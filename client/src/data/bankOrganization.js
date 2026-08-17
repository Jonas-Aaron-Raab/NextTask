const rolesStorageKey = 'nexttask:bank-access-config';

export const bankDepartments = [
  {
    id: 'or-it',
    code: 'OR-IT',
    name: 'Informationstechnologie',
    businessArea: 'OR',
    lead: 'Mara Stein',
    memberCount: 18,
    description: 'Betrieb, Sicherheit und Weiterentwicklung der bankweiten IT-Plattformen.',
    accent: 'border-slate-300 bg-[#f3f7ff]',
    badgeTone: 'bg-[#e9f1ff] text-[#3d65b8]',
  },
  {
    id: 'or-id',
    code: 'OR-ID',
    name: 'Interne Dienste',
    businessArea: 'OR',
    lead: 'Nils Berger',
    memberCount: 12,
    description: 'Interne Services, Einkauf, Gebaeudemanagement und administrative Prozesse.',
    accent: 'border-slate-300 bg-[#f6fbf4]',
    badgeTone: 'bg-[#ecf8e8] text-[#3d7b47]',
  },
  {
    id: 'or-oe',
    code: 'OR-OE',
    name: 'Organisationsentwicklung',
    businessArea: 'OR',
    lead: 'Lea Hofmann',
    memberCount: 9,
    description: 'Prozessoptimierung, Change-Begleitung und Organisationssteuerung.',
    accent: 'border-slate-300 bg-[#fff7ef]',
    badgeTone: 'bg-[#fff0df] text-[#bb6a2b]',
  },
];

export const bankProjects = [
  {
    id: 'or-it-1',
    departmentId: 'or-it',
    name: 'Kernbank API Modernisierung',
    owner: 'Mara Stein',
    status: 'In Arbeit',
    dueDate: '18. September 2026',
    goal: 'Bestehende Kernbank-Schnittstellen stabilisieren und fuer neue digitale Services vorbereiten.',
    tasks: [
      { id: 'or-it-1-a', title: 'Schnittstelleninventar mit Fachbereichen abgleichen', assignee: 'Jonas Weber', status: 'In Arbeit', priority: 'hoch' },
      { id: 'or-it-1-b', title: 'API-Gateway Routing fuer Kontoservices dokumentieren', assignee: 'Mara Stein', status: 'Review', priority: 'mittel' },
      { id: 'or-it-1-c', title: 'Monitoring fuer Antwortzeiten und Fehlerquoten einrichten', assignee: 'Sven Kraus', status: 'Offen', priority: 'hoch' },
    ],
  },
  {
    id: 'or-it-2',
    departmentId: 'or-it',
    name: 'IT-Sicherheitsbaseline 2026',
    owner: 'Sven Kraus',
    status: 'In Planung',
    dueDate: '30. Oktober 2026',
    goal: 'Technische Mindeststandards fuer Endgeraete, Server und Admin-Zugaenge bankweit vereinheitlichen.',
    tasks: [
      { id: 'or-it-2-a', title: 'Adminrechte fuer produktive Systeme rezertifizieren', assignee: 'Sven Kraus', status: 'Offen', priority: 'hoch' },
      { id: 'or-it-2-b', title: 'Patchfenster mit Interne Dienste abstimmen', assignee: 'Mara Stein', status: 'Offen', priority: 'mittel' },
      { id: 'or-it-2-c', title: 'Notfallhandbuch fuer kritische Services aktualisieren', assignee: 'Jonas Weber', status: 'In Arbeit', priority: 'mittel' },
    ],
  },
  {
    id: 'or-id-1',
    departmentId: 'or-id',
    name: 'Digitaler Posteingang',
    owner: 'Nils Berger',
    status: 'In Arbeit',
    dueDate: '12. September 2026',
    goal: 'Interne Eingangspost digital vorsortieren, verteilen und nachvollziehbar bearbeiten.',
    tasks: [
      { id: 'or-id-1-a', title: 'Eingangsregeln fuer Vertragsunterlagen definieren', assignee: 'Nils Berger', status: 'In Arbeit', priority: 'hoch' },
      { id: 'or-id-1-b', title: 'SLA-Dashboard fuer Bearbeitungszeiten vorbereiten', assignee: 'Tara Klein', status: 'Offen', priority: 'mittel' },
      { id: 'or-id-1-c', title: 'Pilotgruppe fuer Filialpost festlegen', assignee: 'Mara Stein', status: 'Review', priority: 'mittel' },
    ],
  },
  {
    id: 'or-id-2',
    departmentId: 'or-id',
    name: 'Beschaffung Self-Service',
    owner: 'Tara Klein',
    status: 'Konzept',
    dueDate: '08. November 2026',
    goal: 'Standardbeschaffungen ueber einfache Antraege und transparente Freigaben abbilden.',
    tasks: [
      { id: 'or-id-2-a', title: 'Katalog fuer Standardartikel strukturieren', assignee: 'Tara Klein', status: 'Offen', priority: 'mittel' },
      { id: 'or-id-2-b', title: 'Freigabegrenzen mit Organisationsentwicklung klaeren', assignee: 'Lea Hofmann', status: 'Offen', priority: 'hoch' },
      { id: 'or-id-2-c', title: 'Formularfelder fuer Bestellanforderungen testen', assignee: 'Nils Berger', status: 'Offen', priority: 'niedrig' },
    ],
  },
  {
    id: 'or-oe-1',
    departmentId: 'or-oe',
    name: 'Prozesslandkarte Aktivgeschaeft',
    owner: 'Lea Hofmann',
    status: 'In Arbeit',
    dueDate: '25. September 2026',
    goal: 'Kernprozesse im Aktivgeschaeft erfassen, Verantwortungen klaeren und Medienbrueche sichtbar machen.',
    tasks: [
      { id: 'or-oe-1-a', title: 'Workshop-Termine mit Marktfolge koordinieren', assignee: 'Lea Hofmann', status: 'In Arbeit', priority: 'hoch' },
      { id: 'or-oe-1-b', title: 'Ist-Prozess fuer Kreditentscheidung modellieren', assignee: 'Oskar Neumann', status: 'Offen', priority: 'hoch' },
      { id: 'or-oe-1-c', title: 'Massnahmenliste aus Prozessinterviews verdichten', assignee: 'Oskar Neumann', status: 'Review', priority: 'mittel' },
    ],
  },
  {
    id: 'or-oe-2',
    departmentId: 'or-oe',
    name: 'OKR-Steuerung OR',
    owner: 'Oskar Neumann',
    status: 'In Planung',
    dueDate: '14. Oktober 2026',
    goal: 'Gemeinsame Ziele fuer den Geschaeftsbereich OR messbar machen und monatlich steuerbar halten.',
    tasks: [
      { id: 'or-oe-2-a', title: 'Zielstruktur fuer OR-IT, OR-ID und OR-OE entwerfen', assignee: 'Oskar Neumann', status: 'Offen', priority: 'hoch' },
      { id: 'or-oe-2-b', title: 'Kennzahlen aus Projektlisten ableiten', assignee: 'Lea Hofmann', status: 'Offen', priority: 'mittel' },
      { id: 'or-oe-2-c', title: 'Monatsreview-Vorlage fuer Bereichsleitung erstellen', assignee: 'Mara Stein', status: 'Offen', priority: 'mittel' },
    ],
  },
];

export const roleKinds = [
  { value: 'ADMIN', label: 'Admin', shortLabel: 'A' },
  { value: 'GBL', label: 'Geschaeftsbereichsleiter', shortLabel: 'GBL' },
  { value: 'MEMBER', label: 'Mitarbeiter', shortLabel: 'M' },
];

export const permissionLabels = {
  viewDepartments: 'Abteilungen sehen',
  editProjects: 'Projekte bearbeiten',
  editTasks: 'Aufgaben bearbeiten',
  approveRequests: 'Freigaben entscheiden',
  viewReports: 'Reports sehen',
  manageRoles: 'Rollen verwalten',
};

export const defaultBankRoles = [
  {
    id: 'role-admin',
    name: 'Admin',
    code: 'A',
    kind: 'ADMIN',
    description: 'Voller Zugriff auf alle Bereiche, Abteilungen, Projekte und Rolleneinstellungen.',
    businessAreas: [],
    departmentIds: [],
    permissions: {
      viewDepartments: true,
      editProjects: true,
      editTasks: true,
      approveRequests: true,
      viewReports: true,
      manageRoles: true,
    },
    system: true,
  },
  {
    id: 'role-gbl-or',
    name: 'GBL Organisation',
    code: 'GBL-OR',
    kind: 'GBL',
    description: 'Sieht alle Abteilungen im Geschaeftsbereich OR.',
    businessAreas: ['OR'],
    departmentIds: [],
    permissions: {
      viewDepartments: true,
      editProjects: true,
      editTasks: true,
      approveRequests: true,
      viewReports: true,
      manageRoles: false,
    },
    system: true,
  },
  {
    id: 'role-m-or-it',
    name: 'Mitarbeiter OR-IT',
    code: 'M-OR-IT',
    kind: 'MEMBER',
    description: 'Sieht und bearbeitet Inhalte der Abteilung Informationstechnologie.',
    businessAreas: [],
    departmentIds: ['or-it'],
    permissions: {
      viewDepartments: true,
      editProjects: false,
      editTasks: true,
      approveRequests: false,
      viewReports: false,
      manageRoles: false,
    },
    system: true,
  },
  {
    id: 'role-m-or-id',
    name: 'Mitarbeiter OR-ID',
    code: 'M-OR-ID',
    kind: 'MEMBER',
    description: 'Sieht und bearbeitet Inhalte der Abteilung Interne Dienste.',
    businessAreas: [],
    departmentIds: ['or-id'],
    permissions: {
      viewDepartments: true,
      editProjects: false,
      editTasks: true,
      approveRequests: false,
      viewReports: false,
      manageRoles: false,
    },
    system: true,
  },
  {
    id: 'role-m-or-oe',
    name: 'Mitarbeiter OR-OE',
    code: 'M-OR-OE',
    kind: 'MEMBER',
    description: 'Sieht und bearbeitet Inhalte der Abteilung Organisationsentwicklung.',
    businessAreas: [],
    departmentIds: ['or-oe'],
    permissions: {
      viewDepartments: true,
      editProjects: false,
      editTasks: true,
      approveRequests: false,
      viewReports: false,
      manageRoles: false,
    },
    system: true,
  },
];

export const defaultBankUsers = [
  { id: 'user-guest', name: 'Gast', email: 'gast@nexttask.local', departmentId: 'or-it', roleId: 'role-admin' },
  { id: 'user-mara', name: 'Mara Stein', email: 'mara.stein@sparkasse.local', departmentId: 'or-it', roleId: 'role-gbl-or' },
  { id: 'user-jonas', name: 'Jonas Weber', email: 'jonas.weber@sparkasse.local', departmentId: 'or-it', roleId: 'role-m-or-it' },
  { id: 'user-nils', name: 'Nils Berger', email: 'nils.berger@sparkasse.local', departmentId: 'or-id', roleId: 'role-m-or-id' },
  { id: 'user-lea', name: 'Lea Hofmann', email: 'lea.hofmann@sparkasse.local', departmentId: 'or-oe', roleId: 'role-m-or-oe' },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getDefaultAccessConfig() {
  return {
    roles: clone(defaultBankRoles),
    users: clone(defaultBankUsers),
  };
}

export function loadAccessConfig() {
  if (typeof window === 'undefined') return getDefaultAccessConfig();

  const fallback = getDefaultAccessConfig();
  const raw = window.localStorage.getItem(rolesStorageKey);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return {
      roles: Array.isArray(parsed.roles) && parsed.roles.length ? parsed.roles : fallback.roles,
      users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : fallback.users,
    };
  } catch {
    return fallback;
  }
}

export function saveAccessConfig(config) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(rolesStorageKey, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('nexttask:roles-change', { detail: config }));
}

export function resetAccessConfig() {
  const config = getDefaultAccessConfig();
  saveAccessConfig(config);
  return config;
}

export function getDepartmentLabel(departmentId) {
  const department = bankDepartments.find((item) => item.id === departmentId);
  return department ? `${department.name} ${department.code}` : 'Keine Abteilung';
}

export function getRoleKindLabel(kind) {
  return roleKinds.find((item) => item.value === kind)?.label || kind;
}

export function getRoleScopeLabel(role) {
  if (!role) return 'Keine Rolle';
  if (role.kind === 'ADMIN') return 'Alle Geschaeftsbereiche und Abteilungen';
  if (role.kind === 'GBL') return `Geschaeftsbereich ${role.businessAreas?.join(', ') || 'ohne Zuordnung'}`;
  if (role.kind === 'MEMBER') {
    return (role.departmentIds || []).map(getDepartmentLabel).join(', ') || 'Keine Abteilung zugeordnet';
  }
  return 'Keine Einschraenkung definiert';
}

export function getAssignmentForUser(user, config = loadAccessConfig()) {
  if (!user) return null;
  return config.users.find((item) => item.email === user.email) || config.users.find((item) => item.name === user.name) || null;
}

export function getEffectiveRoleForUser(user, config = loadAccessConfig()) {
  if (user?.accessRole) return user.accessRole;
  const assignment = getAssignmentForUser(user, config);
  const assignedRole = config.roles.find((role) => role.id === (assignment?.accessRoleId || assignment?.roleId));
  if (assignedRole) return assignedRole;

  if (user?.role === 'ADMIN' || user?.isGuest) {
    return config.roles.find((role) => role.kind === 'ADMIN') || defaultBankRoles[0];
  }

  if (user?.role === 'PROJECT_MANAGER') {
    return config.roles.find((role) => role.id === 'role-gbl-or') || defaultBankRoles[1];
  }

  return config.roles.find((role) => role.kind === 'MEMBER') || defaultBankRoles[2];
}

export function getVisibleDepartmentsForRole(role, departments = bankDepartments) {
  if (!role) return [];
  if (role.kind === 'ADMIN') return departments;
  if (role.kind === 'GBL') {
    const businessAreas = new Set(role.businessAreas || []);
    return departments.filter((department) => businessAreas.has(department.businessArea));
  }
  if (role.kind === 'MEMBER') {
    const departmentIds = new Set(role.departmentIds || []);
    return departments.filter((department) => departmentIds.has(department.id));
  }
  return [];
}

export function canManageRoles(user, config = loadAccessConfig()) {
  if (user?.isGuest || user?.role === 'ADMIN' || user?.accessRole?.permissions?.manageRoles) return true;
  const role = getEffectiveRoleForUser(user, config);
  return Boolean(role?.permissions?.manageRoles);
}
