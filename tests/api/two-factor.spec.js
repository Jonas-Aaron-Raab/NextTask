// NFR-15a-01 Zweiter Faktor für lokale Konten, AF-06 Zweiten Faktor prüfen, UC-02, UC-04.
// Der Test legt ein eigenes Konto an (oder verwendet es wieder), richtet den zweiten Faktor ein,
// meldet sich damit an und schaltet ihn am Ende wieder ab.

const { test, expect } = require('@playwright/test');
const { API, anonymousContext, totpStep, totpCode } = require('./helpers');

const TEST_ACCOUNT = {
  name: 'API-Test Zweiter Faktor',
  email: 'api-test-2fa@nexttask.local',
  password: 'ApiTest!2026',
};

test.describe.configure({ mode: 'serial' });

test.describe('NFR-15a-01: Zweiter Faktor', () => {
  let anon;
  let token;
  let secret;
  let confirmedStep;

  test.beforeAll(async () => {
    anon = await anonymousContext();

    // Konto anlegen; existiert es schon, reicht die Anmeldung.
    const register = await anon.post(`${API}/auth/register`, { data: TEST_ACCOUNT });
    if (register.status() === 201) {
      token = (await register.json()).token;
    } else {
      const login = await anon.post(`${API}/auth/login`, {
        data: { email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password },
      });
      const body = await login.json();
      if (body.requiresTwoFactor) {
        throw new Error(
          `Für ${TEST_ACCOUNT.email} ist aus einem früheren Lauf noch 2FA aktiv. ` +
            'In der Datenbank twoFactorEnabled auf false und twoFactorSecret auf NULL setzen, dann erneut starten.',
        );
      }
      expect(login.status(), body.message).toBe(200);
      token = body.token;
    }
  });

  test.afterAll(async () => {
    await anon.dispose();
  });

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  test('UC-04: Einrichtung liefert ein Geheimnis und verlangt einen gültigen Code', async () => {
    const setup = await anon.post(`${API}/auth/me/2fa/setup`, { headers: authHeaders() });
    expect(setup.status(), await setup.text()).toBe(200);
    const body = await setup.json();
    expect(body.secret).toMatch(/^[A-Z2-7]+=*$/);
    expect(body.otpAuthUrl).toContain('otpauth://totp/');
    secret = body.secret;

    // Falscher Code wird abgelehnt, 2FA bleibt aus.
    const wrong = await anon.post(`${API}/auth/me/2fa/confirm`, { headers: authHeaders(), data: { code: '000000' } });
    expect(wrong.status()).toBe(400);

    // Richtiger Code aktiviert 2FA und liefert Wiederherstellungscodes.
    confirmedStep = totpStep();
    const confirm = await anon.post(`${API}/auth/me/2fa/confirm`, {
      headers: authHeaders(),
      data: { code: totpCode(secret, confirmedStep) },
    });
    expect(confirm.status(), await confirm.text()).toBe(200);
    const confirmed = await confirm.json();
    expect(confirmed.user.twoFactorEnabled).toBe(true);
    expect(confirmed.recoveryCodes).toHaveLength(10);
  });

  test('UC-02: Anmeldung verlangt den Code, ein Code gilt nur einmal', async () => {
    const login = await anon.post(`${API}/auth/login`, {
      data: { email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password },
    });
    expect(login.status()).toBe(200);
    const challenge = await login.json();
    expect(challenge.requiresTwoFactor).toBe(true);
    expect(challenge.token).toBeUndefined();
    expect(challenge.challengeToken).toBeTruthy();

    // Der bei der Einrichtung benutzte Code ist verbraucht (Wiederholungsschutz, AF-06).
    const replay = await anon.post(`${API}/auth/login/2fa`, {
      data: { challengeToken: challenge.challengeToken, code: totpCode(secret, confirmedStep) },
    });
    expect(replay.status()).toBe(400);

    // Ein falscher Code wird abgelehnt.
    const wrong = await anon.post(`${API}/auth/login/2fa`, {
      data: { challengeToken: challenge.challengeToken, code: '000000' },
    });
    expect(wrong.status()).toBe(400);

    // Der Code des nächsten Zeitfensters ist gültig (Toleranz von einem Schritt).
    const success = await anon.post(`${API}/auth/login/2fa`, {
      data: { challengeToken: challenge.challengeToken, code: totpCode(secret, confirmedStep + 1) },
    });
    expect(success.status(), await success.text()).toBe(200);
    const session = await success.json();
    expect(session.token).toBeTruthy();
    expect(session.user.twoFactorEnabled).toBe(true);
    token = session.token;
  });

  test('UC-04: Abschalten verlangt Passwort und Code', async () => {
    const withoutCode = await anon.post(`${API}/auth/me/2fa/disable`, {
      headers: authHeaders(),
      data: { password: TEST_ACCOUNT.password, code: '' },
    });
    expect(withoutCode.status()).toBe(400);

    const disable = await anon.post(`${API}/auth/me/2fa/disable`, {
      headers: authHeaders(),
      data: { password: TEST_ACCOUNT.password, code: totpCode(secret, totpStep() + 1) },
    });
    expect(disable.status(), await disable.text()).toBe(200);
    expect((await disable.json()).user.twoFactorEnabled).toBe(false);

    // Danach meldet sich das Konto wieder ohne zweiten Faktor an.
    const login = await anon.post(`${API}/auth/login`, {
      data: { email: TEST_ACCOUNT.email, password: TEST_ACCOUNT.password },
    });
    expect(login.status()).toBe(200);
    expect((await login.json()).token).toBeTruthy();
  });
});
