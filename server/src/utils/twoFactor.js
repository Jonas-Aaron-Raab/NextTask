const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_WINDOW = 1;
const SECRET_BYTES = 20;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 5;

function getEncryptionKey() {
  const source = process.env.TWO_FACTOR_SECRET_KEY || process.env.JWT_SECRET;
  if (!source) {
    throw new Error('TWO_FACTOR_SECRET_KEY oder JWT_SECRET ist erforderlich');
  }

  return crypto.createHash('sha256').update(source).digest();
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(value) {
  if (!value) return '';
  if (!value.startsWith('v1:')) return value;

  const [, ivHex, tagHex, encryptedHex] = value.split(':');
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error('Ungueltiger 2FA-Secret');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}

function generateBase32Secret(byteLength = SECRET_BYTES) {
  const bytes = crypto.randomBytes(byteLength);
  let bits = '';
  let secret = '';

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0');
  }

  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, '0');
    secret += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  return secret;
}

function base32ToBuffer(secret) {
  const normalized = String(secret || '').replace(/[\s=]/g, '').toUpperCase();
  let bits = '';
  const bytes = [];

  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error('Ungueltiger Base32-Secret');
    }
    bits += value.toString(2).padStart(5, '0');
  }

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function normalizeOneTimeCode(value) {
  return String(value || '').replace(/[\s-]/g, '');
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createTotpCode(secret, step) {
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
  const token = binary % 10 ** TOTP_DIGITS;

  return String(token).padStart(TOTP_DIGITS, '0');
}

function verifyTotpCode(secret, code, options = {}) {
  const normalizedCode = normalizeOneTimeCode(code);
  if (!/^\d{6}$/.test(normalizedCode)) {
    return { valid: false };
  }

  const period = options.period || TOTP_PERIOD_SECONDS;
  const window = options.window ?? TOTP_WINDOW;
  const currentStep = Math.floor((options.now || Date.now()) / 1000 / period);
  const offsets = [0];

  for (let offset = 1; offset <= window; offset += 1) {
    offsets.push(-offset, offset);
  }

  for (const offset of offsets) {
    const step = currentStep + offset;
    if (step < 0) continue;

    const expectedCode = createTotpCode(secret, step);
    if (!timingSafeEqualString(expectedCode, normalizedCode)) continue;

    if (Number.isInteger(options.lastUsedStep) && step <= options.lastUsedStep) {
      return { valid: false, replayed: true };
    }

    return { valid: true, step };
  }

  return { valid: false };
}

function buildOtpAuthUrl({ secret, accountName }) {
  const issuer = process.env.TWO_FACTOR_ISSUER || 'NextTask';
  const label = `${issuer}:${accountName}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

function normalizeRecoveryCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

function createRecoveryCodes(count = RECOVERY_CODE_COUNT) {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(RECOVERY_CODE_BYTES).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

async function hashRecoveryCodes(codes) {
  return Promise.all(codes.map((code) => bcrypt.hash(normalizeRecoveryCode(code), 10)));
}

async function verifyRecoveryCode(code, hashedCodes = []) {
  const normalizedCode = normalizeRecoveryCode(code);
  if (!/^[A-F0-9]{10}$/.test(normalizedCode) || !Array.isArray(hashedCodes)) {
    return { valid: false };
  }

  for (let index = 0; index < hashedCodes.length; index += 1) {
    const matches = await bcrypt.compare(normalizedCode, hashedCodes[index]);
    if (matches) {
      return {
        valid: true,
        nextRecoveryCodes: hashedCodes.filter((_, codeIndex) => codeIndex !== index),
      };
    }
  }

  return { valid: false };
}

module.exports = {
  buildOtpAuthUrl,
  createRecoveryCodes,
  decryptSecret,
  encryptSecret,
  generateBase32Secret,
  hashRecoveryCodes,
  verifyRecoveryCode,
  verifyTotpCode,
};
