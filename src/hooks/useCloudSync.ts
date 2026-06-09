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
    if (typeof fromWin === "string" && fromWin) return normalizeApiBase(fromWin);
    const fromLs = localStorage.getItem(BASE_KEY);
    if (fromLs) return normalizeApiBase(fromLs);
    // Smart defaults: pick a reasonable API host for known deployments.
    try {
      const host = window.location.hostname;
      const proto = window.location.protocol;
      if (host === "mc.shuzili.ren" || host === "192.168.1.12") {
        return proto === "https:" ? "https://api.shuzili.ren/api" : "http://192.168.1.12:8787/api";
      }
      // Netlify deployment — still route to the NAS sync API
      if (host.endsWith(".netlify.app")) {
        return "https://api.shuzili.ren/api";
      }
    } catch {}
  }
  return "/api";
}

// Normalize a user-supplied API base:
//  - strip trailing slashes
//  - if it looks like a full URL (has http/https) and doesn't end with /api, append /api
function normalizeApiBase(raw: string): string {
  let s = raw.replace(/\/+$/, "");
  if (/^https?:\/\//.test(s) && !/\/api(\?.*)?$/.test(s)) {
    s = s + "/api";
  }
  return s;
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
  const [serverUpdatedAt, setServerUpdatedAt] = useState<number | null>(null);
  const [conflict, setConflict] = useState<{ serverUpdatedAt: number; localUpdatedAt: number } | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastSyncedAtRef = useRef<number | null>(null);
  lastSyncedAtRef.current = lastSyncedAt;
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

  // GET /api/load and return both state and updatedAt.
  const getMeta = useCallback(async (): Promise<{ state: T | null; updatedAt: number }> => {
    if (!auth) return { state: null, updatedAt: 0 };
    const res = await fetch(`${apiBase}/load`, {
      method: "GET",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return { state: (json.state ?? null) as T | null, updatedAt: Number(json.updatedAt || 0) };
  }, [auth, apiBase]);

  // Force push: skip the conflict preflight. Caller is acknowledging overwrite.
  const forcePush = useCallback(async () => {
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
      const serverTs = Number(json.updatedAt || Date.now());
      setLastSyncedAt(serverTs);
      setServerUpdatedAt(serverTs);
      setConflict(null);
      setStatus("synced");
    } catch (e: any) {
      setStatus("error"); setLastError(e?.message || String(e));
    }
  }, [auth, apiBase]);

  const dismissConflict = useCallback(() => { setConflict(null); }, []);

  const pushNow = useCallback(async () => {
    if (!auth) return;
    setStatus("syncing");
    try {
      // Preflight: check the server's updatedAt to detect a conflict.
      const meta = await getMeta();
      const localTs = lastSyncedAtRef.current;
      if (meta.updatedAt > 0 && localTs !== null && localTs > 0 && meta.updatedAt > localTs) {
        // Server has newer data than our last sync. Don't blindly overwrite.
        setServerUpdatedAt(meta.updatedAt);
        setConflict({ serverUpdatedAt: meta.updatedAt, localUpdatedAt: localTs });
      // conflict is exposed via return for UI consumption
        setStatus("idle");
        return;
      }
      const res = await fetch(`${apiBase}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ state: latestStateRef.current }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
      const serverTs = Number(json.updatedAt || Date.now());
      setLastSyncedAt(serverTs);
      setServerUpdatedAt(serverTs);
      setStatus("synced");
    } catch (e: any) {
      setStatus("error"); setLastError(e?.message || String(e));
    }
  }, [auth, apiBase, getMeta]);

  const pull = useCallback(async (): Promise<T | null> => {
    if (!auth) return null;
    const res = await fetch(`${apiBase}/load`, {
      method: "GET",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || !json.ok) throw new Error(json.message || `HTTP ${res.status}`);
    const serverTs = Number(json.updatedAt || 0);
    setServerUpdatedAt(serverTs);
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

  return { auth, status, lastError, lastSyncedAt, apiBase, serverUpdatedAt, setApiBase, login, register, logout, pushNow, forcePush, pull, getMeta, dismissConflict, conflict };
}
