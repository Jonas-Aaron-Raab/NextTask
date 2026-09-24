// Sicherheitsnahe Regressionen: Login-Antworten, Passwortregeln und Rollenloeschung.

const { test, expect } = require('@playwright/test');
const { API, ACCOUNTS, PASSWORD, anonymousContext, login, disposeAll, uniqueLabel } = require('./helpers');

test.describe('Security hardening', () => {
  let anon;
  let gast;

  test.beforeAll(async () => {
    [anon, gast] = await Promise.all([anonymousContext(), login(ACCOUNTS.gast)]);
  });

  test.afterAll(async () => {
    await anon?.dispose();
    await disposeAll([gast]);
  });

  test('Login gibt fuer unbekannte E-Mail und falsches Passwort dieselbe Meldung zurueck', async () => {
    const unknown = await anon.post(`${API}/auth/login`, {
      data: { email: `missing-${Date.now()}@nexttask.local`, password: PASSWORD },
    });
    const wrongPassword = await anon.post(`${API}/auth/login`, {
      data: { email: ACCOUNTS.tara.email, password: 'wrong-password' },
    });

    expect(unknown.status()).toBe(400);
    expect(wrongPassword.status()).toBe(400);
    await expect(unknown.json()).resolves.toMatchObject({ message: 'E-Mail oder Passwort falsch' });
    await expect(wrongPassword.json()).resolves.toMatchObject({ message: 'E-Mail oder Passwort falsch' });
  });

  test('Registrierung und Admin-Anlage lehnen zu kurze Passwoerter ab', async () => {
    const emailSuffix = Date.now();
    const register = await anon.post(`${API}/auth/register`, {
      data: {
        name: 'Short Password Register',
        email: `short-register-${emailSuffix}@nexttask.local`,
        password: 'short',
      },
    });

    const adminCreate = await gast.api.post(`${API}/roles/users`, {
      data: {
        name: 'Short Password Admin',
        email: `short-admin-${emailSuffix}@nexttask.local`,
        password: 'short',
      },
    });

    expect(register.status()).toBe(400);
    expect(adminCreate.status()).toBe(400);
    await expect(register.json()).resolves.toMatchObject({ message: 'Das Passwort muss mindestens 8 Zeichen lang sein' });
    await expect(adminCreate.json()).resolves.toMatchObject({ message: 'Das Passwort muss mindestens 8 Zeichen lang sein' });
  });

  test('Eine Rolle mit zugeordneten Benutzern kann nicht geloescht werden', async () => {
    const snapshot = await (await gast.api.get(`${API}/roles`)).json();
    const tara = snapshot.users.find((user) => user.email === ACCOUNTS.tara.email);
    expect(tara?.accessRoleId).toBeTruthy();
    const originalRoleId = tara.accessRoleId;
    const roleName = uniqueLabel('API-Test Rolle');

    const created = await gast.api.post(`${API}/roles`, {
      data: {
        name: roleName,
        code: `T${Date.now()}`.slice(0, 12),
        kind: 'MEMBER',
        description: 'Automatische Testrolle',
        departmentIds: ['or-id'],
        permissions: { viewDepartments: true, editTasks: true },
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const role = (await created.json()).role;

    try {
      const assigned = await gast.api.put(`${API}/roles/users/${tara.id}`, {
        data: { accessRoleId: role.id, department: tara.department },
      });
      expect(assigned.status(), await assigned.text()).toBe(200);

      const blocked = await gast.api.delete(`${API}/roles/${role.id}`);
      expect(blocked.status()).toBe(400);
      await expect(blocked.json()).resolves.toMatchObject({
        message: 'Rolle kann nicht geloescht werden, solange Benutzer zugeordnet sind',
      });
    } finally {
      await gast.api.put(`${API}/roles/users/${tara.id}`, {
        data: { accessRoleId: originalRoleId, department: tara.department },
      });
      const deleted = await gast.api.delete(`${API}/roles/${role.id}`);
      expect([200, 404]).toContain(deleted.status());
    }
  });
});
