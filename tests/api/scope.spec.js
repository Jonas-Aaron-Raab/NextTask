// AF-02 Sichtbereich, SC-01, UC-17: Der Server begrenzt Abteilungen, Projekte und Aufgaben
// auf den Sichtbereich der Zugriffsrolle. Ein Objekt außerhalb wird wie ein nicht vorhandenes behandelt.

const { test, expect } = require('@playwright/test');
const { API, ACCOUNTS, PROJECTS, login, disposeAll } = require('./helpers');

test.describe('AF-02: Sichtbereich', () => {
  let gast;
  let mara;
  let nils;
  let jonas;

  test.beforeAll(async () => {
    [gast, mara, nils, jonas] = await Promise.all([
      login(ACCOUNTS.gast),
      login(ACCOUNTS.mara),
      login(ACCOUNTS.nils),
      login(ACCOUNTS.jonas),
    ]);
  });

  test.afterAll(async () => {
    await disposeAll([gast, mara, nils, jonas]);
  });

  test('Mitarbeiter OR-ID sieht nur die eigene Abteilung, ihre Projekte und Aufgaben', async () => {
    const response = await nils.api.get(`${API}/organization`);
    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.departments.map((department) => department.id)).toEqual(['or-id']);
    expect(data.projects.length).toBeGreaterThan(0);
    for (const project of data.projects) {
      expect(project.departmentId, `Projekt ${project.name}`).toBe('or-id');
    }
    const visibleProjectIds = new Set(data.projects.map((project) => project.id));
    for (const task of data.tasks) {
      expect(visibleProjectIds.has(task.projectId), `Aufgabe ${task.title}`).toBe(true);
    }
  });

  test('Mitarbeiter OR-IT sieht die Abteilung OR-IT, aber nicht OR-ID', async () => {
    const data = await (await jonas.api.get(`${API}/organization`)).json();
    expect(data.departments.map((department) => department.id)).toEqual(['or-it']);
    expect(data.projects.some((project) => project.id === PROJECTS.orIt)).toBe(true);
    expect(data.projects.some((project) => project.id === PROJECTS.orId)).toBe(false);
  });

  test('GBL Organisation sieht alle drei OR-Abteilungen', async () => {
    const data = await (await mara.api.get(`${API}/organization`)).json();
    const ids = data.departments.map((department) => department.id).sort();
    expect(ids).toEqual(expect.arrayContaining(['or-id', 'or-it', 'or-oe']));
    for (const department of data.departments) {
      expect(department.businessArea).toBe('OR');
    }
  });

  test('Admin sieht alle Abteilungen', async () => {
    const data = await (await gast.api.get(`${API}/organization`)).json();
    const ids = data.departments.map((department) => department.id);
    expect(ids).toEqual(expect.arrayContaining(['or-id', 'or-it', 'or-oe']));
    expect(data.departments.length).toBeGreaterThanOrEqual(3);
  });

  test('Backlog eines fremden Projekts ist nicht vorhanden (404), nicht verboten (403)', async () => {
    const own = await nils.api.get(`${API}/tasks/project/${PROJECTS.orId}`);
    expect(own.status()).toBe(200);
    expect(Array.isArray(await own.json())).toBe(true);

    const foreign = await nils.api.get(`${API}/tasks/project/${PROJECTS.orIt}`);
    expect(foreign.status()).toBe(404);
    expect((await foreign.json()).message).toBe('Projekt wurde nicht gefunden');
  });

  test('Aufgabe außerhalb des Sichtbereichs kann nicht geändert werden', async () => {
    const tasks = await (await gast.api.get(`${API}/tasks/project/${PROJECTS.orIt}`)).json();
    expect(tasks.length).toBeGreaterThan(0);
    const foreignTask = tasks[0];

    const response = await nils.api.put(`${API}/tasks/${foreignTask.id}`, {
      data: { title: foreignTask.title },
    });
    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Aufgabe wurde nicht gefunden');
  });

  test('Aufgabe in einem fremden Projekt kann nicht angelegt werden', async () => {
    const response = await nils.api.post(`${API}/tasks`, {
      data: { title: 'API-Test darf nicht entstehen', projectId: PROJECTS.orIt, status: 'todo', priority: 'mittel' },
    });
    expect(response.status()).toBe(404);
    expect((await response.json()).message).toBe('Projekt wurde nicht gefunden');
  });

  test('Kalenderliste enthält nur Aufgaben des Sichtbereichs', async () => {
    const own = await (await nils.api.get(`${API}/organization`)).json();
    const visibleProjectIds = new Set(own.projects.map((project) => project.id));

    const response = await nils.api.get(`${API}/calendar/tasks`);
    expect(response.status()).toBe(200);
    const tasks = await response.json();
    for (const task of tasks) {
      expect(visibleProjectIds.has(task.projectId), `Aufgabe ${task.title}`).toBe(true);
    }
  });
});
