const KEY_PREFIX = 'erp_base_module:';
const KEYS = {
  users: KEY_PREFIX + 'users',
  session: KEY_PREFIX + 'session',
};

export const GENERIC_LOGIN_ERROR = 'Usuario o contraseña incorrectos.';
export const DEFAULT_USERNAME = 'admin';
export const DEFAULT_PASSWORD = 'admin123';

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

export function sha256Hex(message) {
  const bytes = new TextEncoder().encode(String(message));
  const bitLength = bytes.length * 8;
  const paddedLength = bytes.length + 1 + ((56 - ((bytes.length + 1) % 64) + 64) % 64) + 8;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(bytes);
  buffer[bytes.length] = 0x80;
  const view = new DataView(buffer.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  let hex = '';
  for (const word of H) hex += word.toString(16).padStart(8, '0');
  return hex;
}

let memoryStorage = null;

function getStorage() {
  try {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.getItem === 'function') return ls;
  } catch {
    /* localStorage no disponible */
  }
  if (!memoryStorage) {
    const map = new Map();
    memoryStorage = {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => {
        map.set(k, String(v));
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => {
        map.clear();
      },
    };
  }
  return memoryStorage;
}

function readJSON(key, fallback) {
  try {
    const raw = getStorage().getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

function normalizeUsername(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function hashPassword(password, salt) {
  return sha256Hex(`${password}${salt}`);
}

export function loadUsers() {
  const users = readJSON(KEYS.users, []);
  return Array.isArray(users) ? users : [];
}

function saveUsers(list) {
  getStorage().setItem(KEYS.users, JSON.stringify(list));
}

export function ensureDefaultUser() {
  if (loadUsers().length > 0) return false;
  const timestamp = new Date().toISOString();
  const salt = randomHex(16);
  saveUsers([
    {
      id: 'usr_default_admin',
      username: DEFAULT_USERNAME,
      passwordHash: hashPassword(DEFAULT_PASSWORD, salt),
      salt,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]);
  return true;
}

export function login(username, password) {
  const user = String(username ?? '').trim();
  const secret = String(password ?? '');
  if (!user || !secret) return null;
  ensureDefaultUser();
  const match = loadUsers().find((u) => normalizeUsername(u.username) === normalizeUsername(user));
  if (!match || !match.salt) return null;
  if (hashPassword(secret, match.salt) !== match.passwordHash) return null;
  const session = { username: match.username, loggedInAt: new Date().toISOString() };
  getStorage().setItem(KEYS.session, JSON.stringify(session));
  return session;
}

export function getSession() {
  const session = readJSON(KEYS.session, null);
  if (!session || typeof session !== 'object') return null;
  if (typeof session.username !== 'string' || !session.username.trim()) return null;
  return session;
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function logout() {
  getStorage().removeItem(KEYS.session);
}
