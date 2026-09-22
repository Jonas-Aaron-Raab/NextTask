const { test, expect } = require('@playwright/test');

test('core navigation smoke', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('E-Mail').fill('gast@nexttask.local');
  await page.getByPlaceholder('Passwort').fill('NextTaskDemo!2026');
  await page.getByRole('button', { name: /einloggen/i }).click();
  await page.waitForURL(/\/($|dashboard)/, { timeout: 15000 });
  await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible();

  const labels = ['Dashboard', 'Projekte', 'Aufgaben', 'Kalender', 'Dokumente', 'Reports', 'Freigaben', 'Rollen', 'Audit-Log', 'Einstellungen'];
  for (const label of labels) {
    await page.getByText(label, { exact: true }).first().click({ timeout: 8000 });
    await page.waitForTimeout(500);
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
});
