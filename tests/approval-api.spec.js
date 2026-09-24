const { test, expect } = require('@playwright/test');

const API_URL = process.env.API_URL || 'http://localhost:5001/api';
const GUEST_EMAIL = process.env.E2E_EMAIL || 'gast@nexttask.local';
const GUEST_PASSWORD = process.env.E2E_PASSWORD || 'NextTaskDemo!2026';

async function login(request) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD,
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.token).toBeTruthy();
  expect(body.user?.id).toBeTruthy();

  return {
    token: body.token,
    user: body.user,
  };
}

async function createApproval(request, token, title) {
  const response = await request.post(`${API_URL}/approvals`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      entityType: 'OTHER',
      title,
      entityLabel: title,
      description: 'API-Test fuer das Vier-Augen-Prinzip',
      evidence: 'Automatischer Regressionstest',
    },
  });

  expect(response.status()).toBe(201);
  return response.json();
}

test('requester cannot decide their own approval request but can cancel it', async ({ request }) => {
  const { token, user } = await login(request);
  const title = `Vier-Augen-Test ${Date.now()}`;
  const approval = await createApproval(request, token, title);

  expect(approval.requesterId).toBe(user.id);
  expect(approval.status).toBe('PENDING');

  const approveResponse = await request.patch(`${API_URL}/approvals/${approval.id}/approve`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      decisionNote: 'Soll vom Anfragenden blockiert werden',
    },
  });

  expect(approveResponse.status()).toBe(403);
  await expect(approveResponse.json()).resolves.toEqual({
    message: 'Eigene Freigabeanfragen koennen nicht selbst entschieden werden',
  });

  const listResponse = await request.get(`${API_URL}/approvals`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      search: title,
      limit: 10,
    },
  });

  expect(listResponse.ok()).toBeTruthy();
  const listBody = await listResponse.json();
  const unchangedApproval = listBody.approvals.find((item) => item.id === approval.id);
  expect(unchangedApproval?.status).toBe('PENDING');
  expect(unchangedApproval?.decidedAt).toBeFalsy();

  const cancelResponse = await request.patch(`${API_URL}/approvals/${approval.id}/cancel`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      decisionNote: 'Eigene Anfrage darf abgebrochen werden',
    },
  });

  expect(cancelResponse.ok()).toBeTruthy();
  const cancelledApproval = await cancelResponse.json();
  expect(cancelledApproval.status).toBe('CANCELLED');
  expect(cancelledApproval.requesterId).toBe(user.id);
});
