const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ensureDefaultAccessRoles } = require('./accessRoles');

const SSO_PROVIDER_OIDC = 'oidc';
const SSO_STATE_TTL_MS = 10 * 60 * 1000;
const SSO_LOGIN_TICKET_TTL_MS = 90 * 1000;

let discoveryCache = null;
let discoveryCacheUntil = 0;
let jwksCache = null;
let jwksCacheUntil = 0;

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function buildDefaultFrontendRedirectUri() {
  if (!process.env.APP_BASE_URL) return '';

  try {
    return new URL('/login', process.env.APP_BASE_URL).toString();
  } catch (error) {
    return '';
  }
}

function getSsoConfig() {
  const issuerUrl = trimSlash(process.env.SSO_ISSUER_URL);
  const discoveryUrl = String(process.env.SSO_DISCOVERY_URL || '').trim() || (issuerUrl ? `${issuerUrl}/.well-known/openid-configuration` : '');
  const provider = String(process.env.SSO_PROVIDER || SSO_PROVIDER_OIDC).trim().toLowerCase();
  const clientId = String(process.env.SSO_CLIENT_ID || '').trim();
  const redirectUri = String(process.env.SSO_REDIRECT_URI || '').trim();
  const frontendRedirectUri = String(process.env.SSO_FRONTEND_REDIRECT_URI || buildDefaultFrontendRedirectUri()).trim();

  return {
    enabled: parseBoolean(process.env.SSO_ENABLED, false),
    provider,
    displayName: String(process.env.SSO_DISPLAY_NAME || 'SSO').trim(),
    issuerUrl,
    discoveryUrl,
    clientId,
    clientSecret: String(process.env.SSO_CLIENT_SECRET || '').trim(),
    clientAuthMethod: String(process.env.SSO_CLIENT_AUTH_METHOD || 'client_secret_basic').trim(),
    redirectUri,
    frontendRedirectUri,
    scopes: String(process.env.SSO_SCOPES || 'openid profile email').trim(),
    allowedEmailDomains: parseList(process.env.SSO_ALLOWED_EMAIL_DOMAINS).map((domain) => domain.replace(/^@/, '').toLowerCase()),
    autoCreateUsers: parseBoolean(process.env.SSO_AUTO_CREATE_USERS, true),
    defaultAccessRoleCode: String(process.env.SSO_DEFAULT_ACCESS_ROLE_CODE || 'M-OR-IT').trim(),
    defaultDepartment: String(process.env.SSO_DEFAULT_DEPARTMENT || 'Development').trim(),
    defaultUserRole: String(process.env.SSO_DEFAULT_USER_ROLE || 'DEVELOPER').trim(),
    groupsClaim: String(process.env.SSO_GROUPS_CLAIM || 'groups').trim(),
    adminGroups: parseList(process.env.SSO_ADMIN_GROUPS),
    requireVerifiedEmail: parseBoolean(process.env.SSO_REQUIRE_VERIFIED_EMAIL, false),
    allowedAlgs: parseList(process.env.SSO_ALLOWED_ALGS || 'RS256'),
  };
}

function isSsoConfigured(config = getSsoConfig()) {
  return Boolean(
    config.enabled &&
      config.provider === SSO_PROVIDER_OIDC &&
      config.discoveryUrl &&
      config.clientId &&
      config.redirectUri &&
      config.frontendRedirectUri,
  );
}

function getPublicSsoConfig() {
  const config = getSsoConfig();

  return {
    enabled: isSsoConfigured(config),
    provider: config.provider,
    displayName: config.displayName,
  };
}

function assertSsoConfigured() {
  const config = getSsoConfig();
  if (!isSsoConfigured(config)) {
    throw new Error('SSO ist nicht vollstaendig konfiguriert');
  }

  return config;
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest();
}

function getStateEncryptionKey() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET ist für SSO erforderlich');
  }

  return crypto.createHash('sha256').update(`${process.env.JWT_SECRET}:sso-state`).digest();
}

function encryptState(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getStateEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ['v1', base64Url(iv), base64Url(tag), base64Url(encrypted)].join('.');
}

function decryptState(value) {
  const [version, ivValue, tagValue, encryptedValue] = String(value || '').split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
    throw new Error('Ungueltiger SSO-State');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', getStateEncryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]);
  const payload = JSON.parse(decrypted.toString('utf8'));

  if (payload.purpose !== 'sso_authorization' || !payload.expiresAt || Date.now() > payload.expiresAt) {
    throw new Error('SSO-State ist abgelaufen');
  }

  return payload;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  let json = null;

  try {
    json = body ? JSON.parse(body) : null;
  } catch (error) {
    throw new Error(`Ungueltige JSON-Antwort von ${url}`);
  }

  if (!response.ok) {
    throw new Error(json?.error_description || json?.error || `Request an ${url} ist fehlgeschlagen`);
  }

  return json;
}

async function getDiscovery(config) {
  if (discoveryCache && discoveryCacheUntil > Date.now()) {
    return discoveryCache;
  }

  const discovery = await fetchJson(config.discoveryUrl);
  if (!discovery.authorization_endpoint || !discovery.token_endpoint || !discovery.jwks_uri) {
    throw new Error('OIDC Discovery-Dokument ist unvollstaendig');
  }

  discoveryCache = discovery;
  discoveryCacheUntil = Date.now() + 5 * 60 * 1000;
  return discovery;
}

async function getJwks(jwksUri) {
  if (jwksCache && jwksCacheUntil > Date.now()) {
    return jwksCache;
  }

  const jwks = await fetchJson(jwksUri);
  if (!Array.isArray(jwks.keys)) {
    throw new Error('OIDC JWKS-Dokument ist unvollstaendig');
  }

  jwksCache = jwks;
  jwksCacheUntil = Date.now() + 5 * 60 * 1000;
  return jwks;
}

function normalizeReturnTo(value) {
  const raw = String(value || '/').trim();
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw.slice(0, 200);
}

async function createAuthorizationUrl({ returnTo, loginHint } = {}) {
  const config = assertSsoConfigured();
  const discovery = await getDiscovery(config);
  const codeVerifier = base64Url(crypto.randomBytes(32));
  const codeChallenge = base64Url(sha256(codeVerifier));
  const nonce = base64Url(crypto.randomBytes(16));
  const state = encryptState({
    purpose: 'sso_authorization',
    nonce,
    codeVerifier,
    returnTo: normalizeReturnTo(returnTo),
    expiresAt: Date.now() + SSO_STATE_TTL_MS,
  });
  const authorizationUrl = new URL(discovery.authorization_endpoint);

  authorizationUrl.searchParams.set('client_id', config.clientId);
  authorizationUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', config.scopes);
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('nonce', nonce);
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  if (loginHint) {
    authorizationUrl.searchParams.set('login_hint', String(loginHint).trim());
  }

  return authorizationUrl.toString();
}

async function exchangeAuthorizationCode({ code, state }) {
  const config = assertSsoConfigured();
  const discovery = await getDiscovery(config);
  const statePayload = decryptState(state);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: statePayload.codeVerifier,
  });
  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
  };

  if (config.clientSecret && config.clientAuthMethod === 'client_secret_basic') {
    headers.authorization = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;
  } else if (config.clientSecret && config.clientAuthMethod === 'client_secret_post') {
    body.set('client_secret', config.clientSecret);
  }

  const tokenSet = await fetchJson(discovery.token_endpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (!tokenSet.id_token) {
    throw new Error('OIDC Token-Antwort enthaelt kein id_token');
  }

  const claims = await verifyIdToken({
    idToken: tokenSet.id_token,
    discovery,
    config,
    expectedNonce: statePayload.nonce,
  });
  const userInfo = await fetchUserInfo({ discovery, accessToken: tokenSet.access_token });

  return {
    profile: normalizeOidcProfile({ claims, userInfo, config }),
    returnTo: statePayload.returnTo,
  };
}

async function verifyIdToken({ idToken, discovery, config, expectedNonce }) {
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded?.header || !decoded?.payload) {
    throw new Error('OIDC id_token konnte nicht gelesen werden');
  }

  const algorithm = decoded.header.alg;
  if (!config.allowedAlgs.includes(algorithm)) {
    throw new Error('OIDC id_token nutzt einen nicht erlaubten Algorithmus');
  }

  const jwks = await getJwks(discovery.jwks_uri);
  const jwk = jwks.keys.find((key) => key.kid === decoded.header.kid && key.kty);
  if (!jwk) {
    throw new Error('OIDC Signaturschluessel wurde nicht gefunden');
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const claims = jwt.verify(idToken, publicKey, {
    algorithms: config.allowedAlgs,
    audience: config.clientId,
    issuer: discovery.issuer || config.issuerUrl,
  });

  if (claims.nonce !== expectedNonce) {
    throw new Error('OIDC Nonce stimmt nicht überein');
  }

  if (Array.isArray(claims.aud) && claims.aud.length > 1 && claims.azp && claims.azp !== config.clientId) {
    throw new Error('OIDC Authorized Party stimmt nicht überein');
  }

  return claims;
}

async function fetchUserInfo({ discovery, accessToken }) {
  if (!discovery.userinfo_endpoint || !accessToken) return {};

  try {
    return await fetchJson(discovery.userinfo_endpoint, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    return {};
  }
}

function getClaimValue(claims, userInfo, key) {
  return userInfo?.[key] ?? claims?.[key];
}

function getClaimArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeOidcProfile({ claims, userInfo, config }) {
  const subject = String(getClaimValue(claims, userInfo, 'sub') || '').trim();
  const email = String(
    getClaimValue(claims, userInfo, 'email') ||
      getClaimValue(claims, userInfo, 'upn') ||
      getClaimValue(claims, userInfo, 'preferred_username') ||
      '',
  )
    .trim()
    .toLowerCase();
  const givenName = String(getClaimValue(claims, userInfo, 'given_name') || '').trim();
  const familyName = String(getClaimValue(claims, userInfo, 'family_name') || '').trim();
  const name = String(getClaimValue(claims, userInfo, 'name') || `${givenName} ${familyName}`.trim() || email).trim();
  const emailVerified = getClaimValue(claims, userInfo, 'email_verified');
  const groups = getClaimArray(getClaimValue(claims, userInfo, config.groupsClaim));

  if (!subject) {
    throw new Error('OIDC-Profil enthaelt keine eindeutige User-ID');
  }

  if (!email) {
    throw new Error('OIDC-Profil enthaelt keine E-Mail-Adresse');
  }

  if (config.requireVerifiedEmail && emailVerified !== true) {
    throw new Error('OIDC-E-Mail-Adresse ist nicht als verifiziert markiert');
  }

  assertAllowedEmailDomain(email, config.allowedEmailDomains);

  return {
    subject,
    email,
    name,
    groups,
  };
}

function assertAllowedEmailDomain(email, allowedDomains) {
  if (!allowedDomains.length) return;

  const domain = String(email).split('@')[1]?.toLowerCase();
  if (!domain || !allowedDomains.includes(domain)) {
    throw new Error('Diese E-Mail-Domain ist nicht für SSO freigegeben');
  }
}

function hasAdminGroup(profile, config) {
  if (!config.adminGroups.length) return false;
  const userGroups = new Set(profile.groups.map((group) => group.toLowerCase()));
  return config.adminGroups.some((group) => userGroups.has(group.toLowerCase()));
}

async function resolveAccessRole(prisma, profile, config) {
  await ensureDefaultAccessRoles(prisma);
  const roleCode = hasAdminGroup(profile, config) ? 'A' : config.defaultAccessRoleCode;
  return prisma.accessRole.findUnique({ where: { code: roleCode } });
}

async function findLinkedUser(prisma, profile) {
  const linkedUser = await prisma.user.findUnique({
    where: {
      ssoProvider_ssoSubject: {
        ssoProvider: SSO_PROVIDER_OIDC,
        ssoSubject: profile.subject,
      },
    },
    include: { accessRole: true },
  });

  if (linkedUser) return linkedUser;

  return prisma.user.findUnique({
    where: { email: profile.email },
    include: { accessRole: true },
  });
}

async function findOrCreateSsoUser(prisma, profile) {
  const config = getSsoConfig();
  const existingUser = await findLinkedUser(prisma, profile);
  const accessRole = await resolveAccessRole(prisma, profile, config);
  const nextRole = accessRole?.kind === 'ADMIN' ? 'ADMIN' : config.defaultUserRole;

  if (existingUser) {
    if (
      existingUser.ssoSubject &&
      (existingUser.ssoSubject !== profile.subject || existingUser.ssoProvider !== SSO_PROVIDER_OIDC)
    ) {
      throw new Error('Diese E-Mail ist bereits mit einem anderen SSO-Profil verbunden');
    }

    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        authProvider: existingUser.authProvider === 'LOCAL' ? 'LOCAL_SSO' : existingUser.authProvider || 'SSO',
        ssoProvider: SSO_PROVIDER_OIDC,
        ssoSubject: profile.subject,
        ssoEmail: profile.email,
        ssoLastLoginAt: new Date(),
        accessRoleId: existingUser.accessRoleId || accessRole?.id || null,
        role: existingUser.role || nextRole,
      },
      include: { accessRole: true },
    });
  }

  if (!config.autoCreateUsers) {
    throw new Error('Für diesen SSO-Nutzer existiert noch kein NextTask-Account');
  }

  const randomPassword = await bcrypt.hash(`sso:${crypto.randomBytes(32).toString('hex')}`, 10);

  return prisma.user.create({
    data: {
      name: profile.name,
      email: profile.email,
      notificationEmail: profile.email,
      emailNotificationsEnabled: false,
      password: randomPassword,
      authProvider: 'SSO',
      ssoProvider: SSO_PROVIDER_OIDC,
      ssoSubject: profile.subject,
      ssoEmail: profile.email,
      ssoLastLoginAt: new Date(),
      role: nextRole,
      department: config.defaultDepartment,
      accessRoleId: accessRole?.id || null,
    },
    include: { accessRole: true },
  });
}

function hashLoginTicket(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function createSsoLoginTicket(prisma, userId) {
  const code = base64Url(crypto.randomBytes(32));
  await prisma.ssoLoginTicket.create({
    data: {
      tokenHash: hashLoginTicket(code),
      userId,
      expiresAt: new Date(Date.now() + SSO_LOGIN_TICKET_TTL_MS),
    },
  });

  return code;
}

async function consumeSsoLoginTicket(prisma, code) {
  const ticket = await prisma.ssoLoginTicket.findUnique({
    where: { tokenHash: hashLoginTicket(code) },
    include: { user: { include: { accessRole: true } } },
  });

  if (!ticket || ticket.usedAt || ticket.expiresAt.getTime() < Date.now()) {
    throw new Error('SSO-Anmeldung ist abgelaufen. Bitte erneut anmelden.');
  }

  await prisma.ssoLoginTicket.update({
    where: { id: ticket.id },
    data: { usedAt: new Date() },
  });

  return ticket.user;
}

function buildFrontendRedirectUrl({ code, returnTo, error }) {
  const config = getSsoConfig();
  const redirectUrl = new URL(config.frontendRedirectUri);

  if (error) {
    redirectUrl.searchParams.set('sso', 'error');
    redirectUrl.searchParams.set('message', String(error).slice(0, 160));
  } else {
    redirectUrl.searchParams.set('sso', 'callback');
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('returnTo', normalizeReturnTo(returnTo));
  }

  return redirectUrl.toString();
}

module.exports = {
  buildFrontendRedirectUrl,
  consumeSsoLoginTicket,
  createAuthorizationUrl,
  createSsoLoginTicket,
  exchangeAuthorizationCode,
  findOrCreateSsoUser,
  getPublicSsoConfig,
};
