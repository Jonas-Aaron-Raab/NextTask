// UC-18 Freigabe anfragen, UC-19 Freigabe entscheiden, UC-20 Freigabe abbrechen, AF-03, SC-02 (Vier-Augen-Prinzip).
// Die Tests legen eigene Anfragen vom Typ OTHER an. Freigaben lassen sich nicht löschen;
// offene Testanfragen werden am Ende abgebrochen.

const { test, expect } = require('@playwright/test');
const { API, ACCOUNTS, login, disposeAll, uniqueLabel } = require('./helpers');

async function requestApproval(session, extra = {}) {
  const response = await session.api.post(`${API}/approvals`, {
    data: {
      entityType: 'OTHER',
      title: uniqueLabel('API-Test Freigabe'),
      description: 'Automatischer Test, kann ignoriert werden.',
      ...extra,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

async function cancelQuietly(session, approvalId) {
  await session.api.patch(`${API}/approvals/${approvalId}/cancel`, { data: { decisionNote: 'Aufräumen nach Test' } });
}

test.describe('UC-18 bis UC-20: Freigaben', () => {
  let gast;
  let mara;
  let nils;
  let tara;

  test.beforeAll(async () => {
    [gast, mara, nils, tara] = await Promise.all([
      login(ACCOUNTS.gast),
      login(ACCOUNTS.mara),
      login(ACCOUNTS.nils),
      login(ACCOUNTS.tara),
    ]);
  });

  test.afterAll(async () => {
    await disposeAll([gast, mara, nils, tara]);
  });

  test('UC-18 A1: Der Anfragende wird nie als Genehmiger eingetragen', async () => {
    const approval = await requestApproval(nils, { approverId: nils.user.id });
    expect(approval.status).toBe('PENDING');
    expect(approval.requesterId).toBe(nils.user.id);
    expect(approval.approverId).not.toBe(nils.user.id);
    await cancelQuietly(nils, approval.id);
  });

  test('UC-19: Genehmiger entscheidet, eine zweite Entscheidung wird abgelehnt', async () => {
    const approval = await requestApproval(nils, { approverId: gast.user.id });
    expect(approval.approverId).toBe(gast.user.id);

    const decided = await gast.api.patch(`${API}/approvals/${approval.id}/approve`, {
      data: { decisionNote: 'Geprüft und freigegeben.' },
    });
    expect(decided.status(), await decided.text()).toBe(200);
    const body = await decided.json();
    expect(body.status).toBe('APPROVED');
    expect(body.approverId).toBe(gast.user.id);
    expect(body.decisionNote).toBe('Geprüft und freigegeben.');
    expect(body.decidedAt).toBeTruthy();

    const again = await gast.api.patch(`${API}/approvals/${approval.id}/reject`, { data: {} });
    expect(again.status()).toBe(400);
    expect((await again.json()).message).toBe('Diese Freigabe ist bereits entschieden');
  });

  test('UC-19 A1: Ein Mitarbeiter ohne "Freigaben entscheiden", der nicht Genehmiger ist, bekommt 403', async () => {
    const approval = await requestApproval(nils, { approverId: gast.user.id });

    const response = await tara.api.patch(`${API}/approvals/${approval.id}/approve`, { data: {} });
    expect(response.status()).toBe(403);
    expect((await response.json()).message).toBe('Keine Berechtigung für diese Freigabe');

    await cancelQuietly(nils, approval.id);
  });

  test('UC-19: Abgelehnte Anfrage erhält Status REJECTED und den Vermerk', async () => {
    const approval = await requestApproval(nils, { approverId: gast.user.id });
    const response = await gast.api.patch(`${API}/approvals/${approval.id}/reject`, {
      data: { decisionNote: 'Nachweis fehlt.' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('REJECTED');
    expect(body.decisionNote).toBe('Nachweis fehlt.');
  });

  test('UC-20: Der Anfragende kann seine eigene Anfrage abbrechen, aber nur einmal', async () => {
    const approval = await requestApproval(nils, { approverId: gast.user.id });

    const cancelled = await nils.api.patch(`${API}/approvals/${approval.id}/cancel`, {
      data: { decisionNote: 'Nicht mehr nötig.' },
    });
    expect(cancelled.status(), await cancelled.text()).toBe(200);
    expect((await cancelled.json()).status).toBe('CANCELLED');

    const again = await nils.api.patch(`${API}/approvals/${approval.id}/cancel`, { data: {} });
    expect(again.status()).toBe(400);
    expect((await again.json()).message).toBe('Nur offene Freigaben können abgebrochen werden');
  });

  test('UC-20: Unbeteiligte ohne Berechtigung können nicht abbrechen', async () => {
    const approval = await requestApproval(nils, { approverId: gast.user.id });

    const response = await tara.api.patch(`${API}/approvals/${approval.id}/cancel`, { data: {} });
    expect(response.status()).toBe(403);

    await cancelQuietly(nils, approval.id);
  });

  test('Freigabenliste zeigt Mitarbeitern nur eigene und zugewiesene Anfragen', async () => {
    const approval = await requestApproval(nils, { approverId: gast.user.id });

    const listForTara = await (await tara.api.get(`${API}/approvals`)).json();
    expect(listForTara.canApprove).toBe(false);
    expect(listForTara.approvals.some((entry) => entry.id === approval.id)).toBe(false);

    const listForNils = await (await nils.api.get(`${API}/approvals?role=sent`)).json();
    expect(listForNils.approvals.some((entry) => entry.id === approval.id)).toBe(true);

    await cancelQuietly(nils, approval.id);
  });

  test('SC-02: Niemand kann die eigene Anfrage genehmigen (Vier-Augen-Prinzip)', async () => {
    const approval = await requestApproval(mara);
    expect(approval.requesterId).toBe(mara.user.id);

    const response = await mara.api.patch(`${API}/approvals/${approval.id}/approve`, {
      data: { decisionNote: 'Selbst genehmigt' },
    });
    await cancelQuietly(mara, approval.id);

    expect(response.status()).toBe(403);
    expect((await response.json()).message).toBe('Eigene Freigabeanfragen koennen nicht selbst entschieden werden');
    const check = await (await gast.api.get(`${API}/approvals?search=${encodeURIComponent(approval.title)}`)).json();
    const stored = check.approvals.find((entry) => entry.id === approval.id);
    expect(stored.status).not.toBe('APPROVED');
    expect(stored.approverId).not.toBe(mara.user.id);
  });
});
