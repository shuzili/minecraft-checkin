import { useCallback, useEffect, useRef, useState } from "react";

// Cloud sync via the standalone Node sync API.
// Keeps the rest of the app untouched: pass state in, the hook will:
// - persist auth (token + username) in localStorage
// - when logged in, debounce-PUT the whole state to /api/save
// - expose login/register/logout + a one-shot pull from /api/load
//
// Default API base is /api on the same origin, so Cloudflare tunnel
// for the game must proxy the same path to the NAS sync server.
// If you want to point at a separate host, set window.__SYNC_API_BASE__.

export type CloudAuth = { token: string; userId: string; username: string; displayName: string };

const AUTH_KEY = "mc-cloud-auth-v1";
const BASE_KEY = "mc-cloud-api-base-v1";

function getApiBase(): string {
  if (typeof window !== "undefined") {
    const fromWin = (window as any).__SYNC_API_BASE__;
    if (typeof fromWin === "string" && fromWin) return fromWin.replace(/\/+$/, "");
    const fromLs = localStorage.getItem(BASE_KEY);
    if (fromLs) return fromLs.replace(/\/+$/, "");
    // Smart defaults: pick a reasonable API host for known deployments.
    try {
      const host = window.location.hostname;
      const proto = window.location.protocol;
      if (host === "mc.shuzili.ren" || host === "192.168.1.12") {
        return proto === "https:" ? "https://api.shuzili.ren" : "http://192.168.1.12:8787";
      }
      // Netlify deployment — still route to the NAS sync API
      if (host.endsWith(".netlify.app")) {
        return "https://api.shuzili.ren";
      }
    } catch {}
  }
  return "/api";
}

function loadAuth(): CloudAuth | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.token === "string" && typeof parsed.username === "string") return parsed;
  } catch {}
  return null;
}

function saveAuth(a: CloudAuth | null) {
  if (typeof window === "undefined") return;
  if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  else localStorage.removeItem(AUTH_KEY);
}

export function useCloudSync<T extends object>(state: T, isLoaded: boolean) {
  const [auth, setAuth] = useState<CloudAuth | null>(() => loadAuth());
  const [status, setStatus] = useState<"idle" | "syncing" | "synced" | "error" | "offline">("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const latestStateRef = useRef<T>(state);
  latestStateRef.current = state;

  const apiBase = getApiBase();

  const setApiBase = useCallback((base: string) => {
    const clean = (base || "").trim().replace(/\/+$/, "");
    if (typeof window !== "undefined") {
      if (clean) localStorage.setItem(BASE_KEY, clean);
      else localStorage.removeItem(BASE_KEY);
    }
  }, []);

  const callAuth = useCallback(async (path: "login" | "register", username: string, password: string, displayName?: string): Promise<CloudAuth> => {
    const body: any = { username, password };
    if (displayName) body.displayName = displayName;
    const res = await fetch(`${apiBase}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || !json.ok) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }
    return { token: json.token, userId: json.userId, username: json.username, displayName: json.displayName };
  }, [apiBase]);

  const login = useCallback(async (username: string, password: string) => {
    setStatus("syncing");
    setLastError(null);
    try {
      const a = await callAuth("login", username, password);
      setAuth(a); saveAuth(a);
      setStatus("synced");
      return a;
    } catch (e: any) {
      setStatus("error"); setLastError(e?.message || String(e));
      throw e;
    }
  }, [callAuth]);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    setStatus("syncing");
    setLastError(null);
    try {
      const a = await callAuth("register", username, password, displayName);
      setAuth(a); saveAuth(a);
      setStatus("synced");
      return a;
    } catch (e: any) {
      setStatus("error"); setLastError(e?.message || String(e));
      throw e;
    }
  }, [callAuth]);

  const logout = useCallback(() => {
    setAuth(null); saveAuth(null);
    setStatus("idle"); setLastSyncedAt(null);
  }, []);

  const pushNow = useCallback(async () => {
    if (!auth) return;
    setStatus("syncing");
    try {
      const res = await fetch(`${apiBase}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ state: latestStateRef.current }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setLastSyncedAt(Date.now());
      setStatus("synced");
    } catch (e: any) {
      setStatus("error"); setLastError(e?.message || String(e));
    }
  }, [auth, apiBase]);

  const pull = useCallback(async (): Promise<T | null> => {
    if (!auth) return null;
    const res = await fetch(`${apiBase}/load`, {
      method: "GET",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return (json.state ?? null) as T | null;
  }, [auth, apiBase]);

  // Debounced push whenever the loaded state changes and we're logged in.
  useEffect(() => {
    if (!isLoaded) return;
    if (!auth) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void pushNow();
    }, 2000);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [state, isLoaded, auth, pushNow]);

  return { auth, status, lastError, lastSyncedAt, apiBase, setApiBase, login, register, logout, pushNow, pull };
}
