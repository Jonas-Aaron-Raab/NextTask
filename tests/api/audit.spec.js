// NFR-15d-01 Audit-Trail, NFR-15d-02 Zugriff auf das Audit-Log, AF-07, UC-23.

const { test, expect } = require('@playwright/test');
const { API, ACCOUNTS, PROJECTS, login, disposeAll, uniqueLabel } = require('./helpers');

test.describe('NFR-15d: Audit-Log', () => {
  let gast;
  let tara;

  test.beforeAll(async () => {
    [gast, tara] = await Promise.all([login(ACCOUNTS.gast), login(ACCOUNTS.tara)]);
  });

  test.afterAll(async () => {
    await disposeAll([gast, tara]);
  });

  test('NFR-15d-02: Ohne "Rollen verwalten" ist das Audit-Log gesperrt', async () => {
    const response = await tara.api.get(`${API}/audit-logs`);
    expect(response.status()).toBe(403);
    expect((await response.json()).message).toBe('Keine Berechtigung für das Audit-Log');
  });

  test('NFR-15d-01: Ändern einer Aufgabe erzeugt genau einen Eintrag mit altem und neuem Titel', async () => {
    const oldTitle = uniqueLabel('API-Test Audit alt');
    const newTitle = uniqueLabel('API-Test Audit neu');

    const created = await gast.api.post(`${API}/tasks`, {
      data: { title: oldTitle, projectId: PROJECTS.orIt, status: 'todo', priority: 'mittel' },
    });
    expect(created.status(), await created.text()).toBe(201);
    const task = await created.json();

    try {
      const updated = await gast.api.put(`${API}/tasks/${task.id}`, { data: { title: newTitle } });
      expect(updated.status(), await updated.text()).toBe(200);
      expect((await updated.json()).title).toBe(newTitle);

      const logs = await (
        await gast.api.get(`${API}/audit-logs?action=TASK_UPDATED&entityType=TASK&limit=50`)
      ).json();
      const entries = logs.logs.filter((entry) => entry.entityId === task.id);
      expect(entries).toHaveLength(1);

      const entry = entries[0];
      expect(entry.actorEmail).toBe(ACCOUNTS.gast.email);
      expect(entry.severity).toBe('NOTICE');
      expect(entry.before).toHaveProperty('title');
      expect(entry.before.title).toEqual({ before: oldTitle, after: newTitle });
      expect(Object.keys(entry.before)).not.toContain('projectId');
      expect(entry.after.title).toBe(newTitle);
      expect(JSON.stringify(entry)).not.toMatch(/"password"|"token"/);
    } finally {
      const deleted = await gast.api.delete(`${API}/tasks/${task.id}`);
      expect(deleted.status()).toBe(200);
    }

    const deletion = await (
      await gast.api.get(`${API}/audit-logs?action=TASK_DELETED&entityType=TASK&limit=50`)
    ).json();
    const deletionEntry = deletion.logs.find((entry) => entry.entityId === task.id);
    expect(deletionEntry).toBeTruthy();
    expect(deletionEntry.severity).toBe('WARNING');
    expect(deletionEntry.before.title).toBe(newTitle);
  });

  test('NFR-15d-01: Fehlgeschlagene Anmeldung wird mit WARNING protokolliert', async () => {
    const attempt = await gast.api.post(`${API}/auth/login`, {
      data: { email: ACCOUNTS.tara.email, password: 'falsches-passwort' },
    });
    expect(attempt.status()).toBe(400);

    const logs = await (
      await gast.api.get(`${API}/audit-logs?action=LOGIN_FAILED&search=${encodeURIComponent(ACCOUNTS.tara.email)}&limit=10`)
    ).json();
    expect(logs.logs.length).toBeGreaterThan(0);
    expect(logs.logs[0].severity).toBe('WARNING');
    expect(logs.logs[0].summary).toContain(ACCOUNTS.tara.email);
  });

  test('Die Schnittstelle bietet kein Ändern oder Löschen von Einträgen', async () => {
    const logs = await (await gast.api.get(`${API}/audit-logs?limit=10`)).json();
    expect(logs.logs.length).toBeGreaterThan(0);
    const entryId = logs.logs[0].id;

    const del = await gast.api.delete(`${API}/audit-logs/${entryId}`);
    expect(del.status()).toBe(404);
    const put = await gast.api.put(`${API}/audit-logs/${entryId}`, { data: { summary: 'manipuliert' } });
    expect(put.status()).toBe(404);
  });
});
