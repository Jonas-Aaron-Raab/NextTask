const defaultPermissions = {
  viewDepartments: true,
  editProjects: false,
  editTasks: true,
  approveRequests: false,
  viewReports: false,
  manageRoles: false,
};

const defaultAccessRoles = [
  {
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
    name: 'Mitarbeiter OR-IT',
    code: 'M-OR-IT',
    kind: 'MEMBER',
    description: 'Sieht und bearbeitet Inhalte der Abteilung Informationstechnologie.',
    businessAreas: [],
    departmentIds: ['or-it'],
    permissions: {
      ...defaultPermissions,
    },
    system: true,
  },
  {
    name: 'Mitarbeiter OR-ID',
    code: 'M-OR-ID',
    kind: 'MEMBER',
    description: 'Sieht und bearbeitet Inhalte der Abteilung Interne Dienste.',
    businessAreas: [],
    departmentIds: ['or-id'],
    permissions: {
      ...defaultPermissions,
    },
    system: true,
  },
  {
    name: 'Mitarbeiter OR-OE',
    code: 'M-OR-OE',
    kind: 'MEMBER',
    description: 'Sieht und bearbeitet Inhalte der Abteilung Organisationsentwicklung.',
    businessAreas: [],
    departmentIds: ['or-oe'],
    permissions: {
      ...defaultPermissions,
    },
    system: true,
  },
];

function normalizePermissions(value = {}) {
  return {
    ...defaultPermissions,
    ...value,
    manageRoles: Boolean(value.manageRoles),
  };
}

function serializeRole(role) {
  if (!role) return null;

  return {
    id: role.id,
    name: role.name,
    code: role.code,
    kind: role.kind,
    description: role.description,
    businessAreas: role.businessAreas || [],
    departmentIds: role.departmentIds || [],
    permissions: normalizePermissions(role.permissions || {}),
    system: role.system,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    accessRoleId: user.accessRoleId,
    accessRole: serializeRole(user.accessRole),
    createdAt: user.createdAt,
  };
}

async function ensureDefaultAccessRoles(prisma) {
  const roles = [];

  for (const role of defaultAccessRoles) {
    const savedRole = await prisma.accessRole.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        kind: role.kind,
        description: role.description,
        businessAreas: role.businessAreas,
        departmentIds: role.departmentIds,
        permissions: role.permissions,
        system: role.system,
      },
      create: role,
    });
    roles.push(savedRole);
  }

  return roles;
}

async function getAdminAccessRole(prisma) {
  await ensureDefaultAccessRoles(prisma);
  return prisma.accessRole.findUnique({ where: { code: 'A' } });
}

function userCanManageRoles(user) {
  return Boolean(user?.accessRole?.permissions?.manageRoles || user?.accessRole?.kind === 'ADMIN' || user?.role === 'ADMIN');
}

function userCanApproveRequests(user) {
  return Boolean(
    user?.accessRole?.permissions?.approveRequests ||
      user?.accessRole?.kind === 'ADMIN' ||
      user?.accessRole?.kind === 'GBL' ||
      user?.role === 'ADMIN' ||
      user?.role === 'PROJECT_MANAGER',
  );
}

module.exports = {
  defaultAccessRoles,
  ensureDefaultAccessRoles,
  getAdminAccessRole,
  normalizePermissions,
  serializeRole,
  serializeUser,
  userCanApproveRequests,
  userCanManageRoles,
};
