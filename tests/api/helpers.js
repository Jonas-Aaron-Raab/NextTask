// Gemeinsame Hilfsfunktionen für die API-Tests.
// Voraussetzung: laufender Server (npm run dev) und geladener Seed (npm run db:seed in server/).

const crypto = require('crypto');
const { request } = require('@playwright/test');

const API = process.env.NEXTTASK_API_URL || 'http://127.0.0.1:5001/api';
const PASSWORD = process.env.NEXTTASK_SEED_PASSWORD || 'NextTaskDemo!2026';

// Demo-Konten aus server/prisma/seed.js (S3.3 der Spezifikation)
const ACCOUNTS = {
  gast: { email: 'gast@nexttask.local', name: 'Gast', role: 'A (Admin)' },
  mara: { email: 'mara.stein@sparkasse.local', name: 'Mara Stein', role: 'GBL-OR' },
  nils: { email: 'nils.berger@sparkasse.local', name: 'Nils Berger', role: 'M-OR-ID' },
  tara: { email: 'tara.klein@sparkasse.local', name: 'Tara Klein', role: 'M-OR-ID' },
  jonas: { email: 'jonas.weber@sparkasse.local', name: 'Jonas Weber', role: 'M-OR-IT' },
};

// Projekte aus den Fixtures (client/src/data/bankOrganization.js)
const PROJECTS = {
  orIt: 'or-it-1', // Kernbank API Modernisierung, Abteilung OR-IT
  orId: 'or-id-1', // Digitaler Posteingang, Abteilung OR-ID
};

async function anonymousContext() {
  return request.newContext({ baseURL: API });
}

// Meldet ein Konto an und liefert einen Kontext, der das Token bei jedem Aufruf mitsendet.
async function login(account, password = PASSWORD) {
  const anon = await anonymousContext();
  const response = await anon.post(`${API}/auth/login`, { data: { email: account.email, password } });
  const body = await response.json().catch(() => ({}));
  await anon.dispose();

  if (response.status() !== 200) {
    throw new Error(`Anmeldung für ${account.email} fehlgeschlagen (${response.status()}): ${body.message || ''}. Ist der Server gestartet und der Seed geladen?`);
  }
  if (body.requiresTwoFactor) {
    throw new Error(`Für ${account.email} ist der zweite Faktor aktiv; die Tests erwarten Demo-Konten ohne 2FA.`);
  }

  const api = await request.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${body.token}` },
  });
  return { api, token: body.token, user: body.user };
}

async function disposeAll(sessions) {
  await Promise.all(sessions.filter(Boolean).map((session) => session.api.dispose()));
}

function uniqueLabel(prefix) {
  return `${prefix} ${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

// TOTP nach RFC 6238, identisch zu server/src/utils/twoFactor.js (SHA-1, 6 Ziffern, 30 Sekunden).
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ToBuffer(secret) {
  const clean = String(secret).toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) {
    bits += BASE32_ALPHABET.indexOf(char).toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpStep(now = Date.now(), period = 30) {
  return Math.floor(now / 1000 / period);
}

function totpCode(secret, step) {
  const key = base32ToBuffer(secret);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** 6).padStart(6, '0');
}

module.exports = { API, PASSWORD, ACCOUNTS, PROJECTS, anonymousContext, login, disposeAll, uniqueLabel, totpStep, totpCode };
