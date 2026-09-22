const impossibleWhere = { id: '__no_access__' };

async function getCurrentUserWithAccessRole(req) {
  if (req.currentUser?.accessRole) return req.currentUser;

  const currentUser = await req.prisma.user.findUnique({
    where: { id: req.user.id },
    include: { accessRole: true },
  });

  req.currentUser = currentUser;
  return currentUser;
}

function getAccessRole(user) {
  return user?.accessRole || null;
}

function isAdminScope(user) {
  const role = getAccessRole(user);
  return Boolean(user?.role === 'ADMIN' || role?.kind === 'ADMIN');
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

function getDepartmentScope(user) {
  const role = getAccessRole(user);
  if (isAdminScope(user)) return { all: true, departmentIds: [], businessAreas: [] };
  if (role?.kind === 'GBL') {
    return {
      all: false,
      departmentIds: [],
      businessAreas: normalizeList(role.businessAreas).map((area) => area.toUpperCase()),
    };
  }
  if (role?.kind === 'MEMBER') {
    return {
      all: false,
      departmentIds: normalizeList(role.departmentIds),
      businessAreas: [],
    };
  }

  return {
    all: false,
    departmentIds: [],
    businessAreas: [],
  };
}

function buildDepartmentScopeWhere(user) {
  const scope = getDepartmentScope(user);
  if (scope.all) return {};
  if (scope.departmentIds.length) return { id: { in: scope.departmentIds } };
  if (scope.businessAreas.length) return { businessArea: { in: scope.businessAreas } };
  return impossibleWhere;
}

function buildProjectScopeWhere(user) {
  const scope = getDepartmentScope(user);
  if (scope.all) return {};

  if (scope.departmentIds.length) {
    return { departmentId: { in: scope.departmentIds } };
  }

  if (scope.businessAreas.length) {
    return {
      OR: [
        { businessArea: { in: scope.businessAreas } },
        { department: { is: { businessArea: { in: scope.businessAreas } } } },
      ],
    };
  }

  return impossibleWhere;
}

function buildTaskScopeWhere(user) {
  const projectWhere = buildProjectScopeWhere(user);
  return Object.keys(projectWhere).length ? { project: projectWhere } : {};
}

function buildDocumentScopeWhere(user) {
  const scope = getDepartmentScope(user);
  if (scope.all) return {};

  if (scope.departmentIds.length) {
    return {
      OR: [
        { departmentId: { in: scope.departmentIds } },
        { project: { is: { departmentId: { in: scope.departmentIds } } } },
      ],
    };
  }

  if (scope.businessAreas.length) {
    return {
      OR: [
        { department: { is: { businessArea: { in: scope.businessAreas } } } },
        { project: { is: buildProjectScopeWhere(user) } },
      ],
    };
  }

  return impossibleWhere;
}

function userHasPermission(user, permission) {
  if (isAdminScope(user)) return true;
  return Boolean(getAccessRole(user)?.permissions?.[permission]);
}

function mergeAnd(...filters) {
  const activeFilters = filters.filter((filter) => filter && Object.keys(filter).length);
  if (!activeFilters.length) return {};
  if (activeFilters.length === 1) return activeFilters[0];
  return { AND: activeFilters };
}

async function buildApprovalScopeWhere(prisma, user) {
  if (isAdminScope(user)) return {};

  const [projects, tasks, reports, documents] = await Promise.all([
    prisma.project.findMany({ where: buildProjectScopeWhere(user), select: { id: true } }),
    prisma.task.findMany({ where: buildTaskScopeWhere(user), select: { id: true } }),
    prisma.projectStatusReport.findMany({
      where: { project: buildProjectScopeWhere(user) },
      select: { id: true },
    }),
    prisma.document.findMany({ where: buildDocumentScopeWhere(user), select: { id: true } }),
  ]);

  const scopedEntityFilters = [
    projects.length ? { entityType: 'PROJECT', entityId: { in: projects.map((item) => item.id) } } : null,
    tasks.length ? { entityType: 'TASK', entityId: { in: tasks.map((item) => item.id) } } : null,
    reports.length ? { entityType: 'STATUS_REPORT', entityId: { in: reports.map((item) => item.id) } } : null,
    documents.length ? { entityType: 'DOCUMENT', entityId: { in: documents.map((item) => item.id) } } : null,
    { entityType: 'OTHER', OR: [{ requesterId: user.id }, { approverId: user.id }] },
  ].filter(Boolean);

  return { OR: scopedEntityFilters };
}

module.exports = {
  buildApprovalScopeWhere,
  buildDepartmentScopeWhere,
  buildDocumentScopeWhere,
  buildProjectScopeWhere,
  buildTaskScopeWhere,
  getCurrentUserWithAccessRole,
  isAdminScope,
  mergeAnd,
  userHasPermission,
};
