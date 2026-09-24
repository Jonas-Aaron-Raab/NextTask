const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:5173';
const PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/projects', name: 'Projekte' },
  { path: '/my-tasks', name: 'Aufgaben' },
  { path: '/calendar', name: 'Kalender' },
  { path: '/documents', name: 'Dokumente' },
  { path: '/reports', name: 'Reports' },
  { path: '/approvals', name: 'Freigaben' },
  { path: '/roles', name: 'Rollen' },
  { path: '/audit-log', name: 'Audit-Log' },
  { path: '/settings', name: 'Einstellungen' },
];

const SKIP_BUTTON_PATTERN =
  /logout|abmelden|löschen|loeschen|entfernen|zurücksetzen|zuruecksetzen|trennen|ablehnen|freigeben|genehmigen|in db erstellen|mail senden|verbinden|sync/i;

function normalizeLabel(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function getFunctionKey(label) {
  if (/^Kommentare zu .+ öffnen$/i.test(label)) return 'Kommentare öffnen';
  if (/^Anhänge zu .+ öffnen$/i.test(label)) return 'Anhänge öffnen';
  if (/^Infos zu .+ anzeigen$/i.test(label)) return label.replace(/^Infos zu (.+) anzeigen$/i, 'Infos anzeigen: $1');
  return label;
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.getByPlaceholder('E-Mail').fill('gast@nexttask.local');
  await page.getByPlaceholder('Passwort').fill('NextTaskDemo!2026');
  await page.getByRole('button', { name: /einloggen/i }).click();
  await page.waitForURL(/\/($|dashboard)/, { timeout: 15000 });
}

async function gotoAppPage(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(150);
}

async function closeTransientUi(page) {
  await page.keyboard.press('Escape').catch(() => {});
  for (const name of [/schlie(?:ss|ß)en/i, /abbrechen/i, /^x$/i]) {
    const button = page.getByRole('button', { name }).last();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 1000 }).catch(() => {});
    }
  }
}

async function getButtonLabel(button, fallback) {
  const rawLabel = await button.evaluate((node) => {
    const text = node.innerText || '';
    return node.getAttribute('aria-label') || node.getAttribute('title') || text || node.textContent || '';
  });
  return normalizeLabel(rawLabel) || fallback;
}

for (const { path, name } of PAGES) {
  test(`visible non-destructive buttons work on ${name}`, async ({ page }, testInfo) => {
    test.setTimeout(name === 'Aufgaben' ? 240000 : 90000);

    const issues = [];
    const clicked = [];
    const skipped = [];
    const clickedFunctionKeys = new Set();

    page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') issues.push(`console: ${message.text()}`);
    });

    await login(page);
    await gotoAppPage(page, path);
    await expect(page.locator('body')).toBeVisible();
    await closeTransientUi(page);

    const buttonLocator = page.locator('main button:visible');
    const count = await buttonLocator.count();
    for (let index = 0; index < count; index += 1) {
      await closeTransientUi(page);

      const button = buttonLocator.nth(index);
      if (!(await button.isVisible().catch(() => false))) continue;
      if (!(await button.isEnabled().catch(() => false))) continue;

      const label = await getButtonLabel(button, `button-${index + 1}`);
      const functionKey = getFunctionKey(label);

      if (SKIP_BUTTON_PATTERN.test(label)) {
        skipped.push(`${name}: ${label}`);
        continue;
      }
      if (clickedFunctionKeys.has(functionKey)) {
        skipped.push(`${name}: ${label} (bereits als ${functionKey} geprüft)`);
        continue;
      }

      try {
        await button.scrollIntoViewIfNeeded();
        await button.click({ timeout: 2500 });
        await page.waitForTimeout(100);
        await closeTransientUi(page);
        clickedFunctionKeys.add(functionKey);
        clicked.push(`${name}: ${label}`);
      } catch (error) {
        issues.push(`${name}: "${label}" konnte nicht geklickt werden (${error.message.split('\n')[0]})`);
      }
    }

    testInfo.attach('button-audit.json', {
      body: JSON.stringify({ page: name, clicked, skipped, issues }, null, 2),
      contentType: 'application/json',
    });

    expect(issues).toEqual([]);
  });
}
