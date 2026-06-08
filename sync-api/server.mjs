// Sync API for the MC check-in game.
// Zero-dependency Node 20 HTTP server, JSON-file storage.
import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = process.env.DATA_DIR || '/home/shuzili/www/mc-game-sync/data';
const JWT_SECRET = process.env.JWT_SECRET || 'mc-game-dev-secret-change-me';
const JWT_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(join(DATA_DIR, 'saves'), { recursive: true });

const USERS_FILE = join(DATA_DIR, 'users.json');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('readJson failed', file, e.message);
    return fallback;
  }
}

function writeJsonAtomic(file, data) {
  const tmp = file + '.tmp-' + process.pid + '-' + Date.now();
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, file);
}

let users = readJson(USERS_FILE, {});
let sessions = readJson(SESSIONS_FILE, {});

function hashPassword(password, salt) {
  const s = salt || randomBytes(16).toString('hex');
  const h = scryptSync(password, s, 64).toString('hex');
  return { salt: s, hash: h };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  if (hash.length !== expectedHash.length) return false;
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac('sha256', JWT_SECRET).update(body).digest());
  return body + '.' + sig;
}
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = b64url(createHmac('sha256', JWT_SECRET).update(body).digest());
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function newId(prefix) {
  return prefix + '_' + randomBytes(9).toString('base64url');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', c => {
      total += c.length;
      if (total > 4 * 1024 * 1024) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

async function route(req, res) {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const method = req.method;
  if (method === 'OPTIONS') return send(res, 204, {});

  if (url.pathname === '/api/health' && method === 'GET') {
    return send(res, 200, { ok: true, users: Object.keys(users).length, ts: Date.now() });
  }

  if (url.pathname === '/api/register' && method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return send(res, 400, { ok: false, message: e.message }); }
    const username = body && body.username;
    const password = body && body.password;
    const displayName = body && body.displayName;
    if (!username || !password) return send(res, 400, { ok: false, message: 'username and password required' });
    if (typeof username !== 'string' || username.length < 2 || username.length > 32) return send(res, 400, { ok: false, message: 'username 2-32 chars' });
    if (typeof password !== 'string' || password.length < 4 || password.length > 128) return send(res, 400, { ok: false, message: 'password 4-128 chars' });
    const key = String(username).toLowerCase();
    if (users[key]) return send(res, 409, { ok: false, message: 'username already taken' });
    const hp = hashPassword(password);
    const userId = newId('u');
    users[key] = {
      id: userId, username: username, displayName: displayName || username,
      salt: hp.salt, hash: hp.hash, createdAt: Date.now(),
    };
    writeJsonAtomic(USERS_FILE, users);
    const saveFile = join(DATA_DIR, 'saves', userId + '.json');
    writeJsonAtomic(saveFile, { v: 1, updatedAt: 0, state: null });
    const token = sign({ sub: userId, name: username, exp: Math.floor(Date.now() / 1000) + JWT_TTL_SEC });
    return send(res, 200, { ok: true, userId: userId, username: username, displayName: users[key].displayName, token: token });
  }

  if (url.pathname === '/api/login' && method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return send(res, 400, { ok: false, message: e.message }); }
    const username = body && body.username;
    const password = body && body.password;
    if (!username || !password) return send(res, 400, { ok: false, message: 'username and password required' });
    const u = users[String(username).toLowerCase()];
    if (!u || !verifyPassword(password, u.salt, u.hash)) {
      return send(res, 401, { ok: false, message: 'invalid username or password' });
    }
    const token = sign({ sub: u.id, name: u.username, exp: Math.floor(Date.now() / 1000) + JWT_TTL_SEC });
    return send(res, 200, { ok: true, userId: u.id, username: u.username, displayName: u.displayName, token: token });
  }

  const auth = req.headers['authorization'] || '';
  const m = String(auth).match(/^Bearer\s+(.+)$/i);
  const claims = m ? verify(m[1]) : null;
  if (!claims) return send(res, 401, { ok: false, message: 'unauthorized' });

  if (url.pathname === '/api/me' && method === 'GET') {
    const k = Object.keys(users).find(key => users[key].id === claims.sub);
    const u = k ? users[k] : null;
    if (!u) return send(res, 404, { ok: false, message: 'user missing' });
    return send(res, 200, { ok: true, userId: u.id, username: u.username, displayName: u.displayName });
  }

  if (url.pathname === '/api/save' && method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return send(res, 400, { ok: false, message: e.message }); }
    const state = body && body.state;
    if (state === undefined) return send(res, 400, { ok: false, message: 'state required' });
    const saveFile = join(DATA_DIR, 'saves', claims.sub + '.json');
    writeJsonAtomic(saveFile, { v: 1, updatedAt: Date.now(), state: state });
    return send(res, 200, { ok: true, updatedAt: Date.now() });
  }

  if (url.pathname === '/api/load' && method === 'GET') {
    const saveFile = join(DATA_DIR, 'saves', claims.sub + '.json');
    if (!existsSync(saveFile)) return send(res, 200, { ok: true, state: null, updatedAt: 0 });
    try {
      const data = JSON.parse(readFileSync(saveFile, 'utf8'));
      return send(res, 200, { ok: true, state: data.state == null ? null : data.state, updatedAt: data.updatedAt || 0 });
    } catch (e) {
      return send(res, 500, { ok: false, message: 'load failed: ' + e.message });
    }
  }

  return send(res, 404, { ok: false, message: 'not found' });
}

const server = http.createServer((req, res) => {
  Promise.resolve(route(req, res)).catch(err => {
    console.error('route error', err);
    if (!res.headersSent) send(res, 500, { ok: false, message: 'internal error' });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('[mc-sync] listening on 0.0.0.0:' + PORT + ' data=' + DATA_DIR);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { console.log('shutting down'); server.close(() => process.exit(0)); });
}