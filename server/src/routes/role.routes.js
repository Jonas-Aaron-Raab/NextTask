const express = require('express');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const {
  ensureDefaultAccessRoles,
  normalizePermissions,
  serializeRole,
  serializeUser,
  userCanManageRoles,
} = require('../utils/accessRoles');
const { pickFields, summarizeChanges, writeAuditLog } = require('../utils/auditLog');

const router = express.Router();
const auditRoleFields = ['id', 'name', 'code', 'kind', 'description', 'businessAreas', 'departmentIds', 'permissions', 'system'];
const auditUserFields = ['id', 'name', 'email', 'role', 'department', 'accessRoleId'];

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toRoleData(body) {
  const kind = body.kind === 'M' ? 'MEMBER' : body.kind;
  const normalizedKind = ['ADMIN', 'GBL', 'MEMBER'].includes(kind) ? kind : 'MEMBER';

  return {
    name: String(body.name || '').trim(),
    code: String(body.code || '').trim().toUpperCase(),
    kind: normalizedKind,
    description: String(body.description || '').trim(),
    businessAreas: normalizedKind === 'GBL' ? normalizeList(body.businessAreas).map((item) => item.toUpperCase()) : [],
    departmentIds: normalizedKind === 'MEMBER' ? normalizeList(body.departmentIds) : [],
    permissions: normalizePermissions({
      ...(body.permissions || {}),
      manageRoles: normalizedKind === 'ADMIN' ? true : Boolean(body.permissions?.manageRoles),
    }),
  };
}

async function requireRoleManager(req, res, next) {
  const currentUser = await req.prisma.user.findUnique({
    where: { id: req.user.id },
    include: { accessRole: true },
  });

  if (!userCanManageRoles(currentUser)) {
    return res.status(403).json({ message: 'Keine Berechtigung für die Rollenverwaltung' });
  }

  req.currentUser = currentUser;
  next();
}

router.get('/', auth, async (req, res) => {
  try {
    await ensureDefaultAccessRoles(req.prisma);

    const [roles, users] = await Promise.all([
      req.prisma.accessRole.findMany({ orderBy: [{ system: 'desc' }, { name: 'asc' }] }),
      req.prisma.user.findMany({
        include: { accessRole: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    res.json({
      roles: roles.map(serializeRole),
      users: users.map(serializeUser),
    });
  } catch (error) {
    res.status(500).json({ message: 'Rollen konnten nicht geladen werden', error: error.message });
  }
});

router.post('/', auth, requireRoleManager, async (req, res) => {
  try {
    const data = toRoleData(req.body);
    if (isBlank(data.name) || isBlank(data.code)) {
      return res.status(400).json({ message: 'Name und Kurzcode sind erforderlich' });
    }

    const role = await req.prisma.accessRole.create({
      data: {
        ...data,
        system: false,
      },
    });

    await writeAuditLog(req, {
      action: 'ROLE_CREATED',
      entityType: 'ACCESS_ROLE',
      entityId: role.id,
      entityLabel: role.name,
      summary: `Rolle ${role.name} wurde erstellt.`,
      severity: 'WARNING',
      after: pickFields(role, auditRoleFields),
    });

    res.status(201).json({ role: serializeRole(role) });
  } catch (error) {
    res.status(500).json({ message: 'Rolle konnte nicht erstellt werden', error: error.message });
  }
});

router.put('/:id', auth, requireRoleManager, async (req, res) => {
  try {
    const currentRole = await req.prisma.accessRole.findUnique({ where: { id: req.params.id } });
    if (!currentRole) {
      return res.status(404).json({ message: 'Rolle wurde nicht gefunden' });
    }

    const data = toRoleData(req.body);
    if (isBlank(data.name) || isBlank(data.code)) {
      return res.status(400).json({ message: 'Name und Kurzcode sind erforderlich' });
    }

    const role = await req.prisma.accessRole.update({
      where: { id: req.params.id },
      data: {
        ...data,
        kind: currentRole.system ? currentRole.kind : data.kind,
      },
    });

    await writeAuditLog(req, {
      action: 'ROLE_UPDATED',
      entityType: 'ACCESS_ROLE',
      entityId: role.id,
      entityLabel: role.name,
      summary: `Rolle ${role.name} wurde aktualisiert.`,
      severity: 'WARNING',
      before: summarizeChanges(pickFields(currentRole, auditRoleFields), pickFields(role, auditRoleFields)),
      after: pickFields(role, auditRoleFields),
    });

    res.json({ role: serializeRole(role) });
  } catch (error) {
    res.status(500).json({ message: 'Rolle konnte nicht gespeichert werden', error: error.message });
  }
});

router.delete('/:id', auth, requireRoleManager, async (req, res) => {
  try {
    const role = await req.prisma.accessRole.findUnique({ where: { id: req.params.id } });
    if (!role) {
      return res.status(404).json({ message: 'Rolle wurde nicht gefunden' });
    }

    if (role.system) {
      return res.status(400).json({ message: 'Systemrollen können nicht gelöscht werden' });
    }

    const fallbackRole = await req.prisma.accessRole.findUnique({ where: { code: 'A' } });
    await req.prisma.user.updateMany({
      where: { accessRoleId: role.id },
      data: { accessRoleId: fallbackRole?.id || null },
    });
    await req.prisma.accessRole.delete({ where: { id: role.id } });

    await writeAuditLog(req, {
      action: 'ROLE_DELETED',
      entityType: 'ACCESS_ROLE',
      entityId: role.id,
      entityLabel: role.name,
      summary: `Rolle ${role.name} wurde gelöscht.`,
      severity: 'CRITICAL',
      before: pickFields(role, auditRoleFields),
      metadata: { fallbackRoleId: fallbackRole?.id || null },
    });

    res.json({ message: 'Rolle wurde gelöscht' });
  } catch (error) {
    res.status(500).json({ message: 'Rolle konnte nicht gelöscht werden', error: error.message });
  }
});

router.put('/users/:id', auth, requireRoleManager, async (req, res) => {
  try {
    const { accessRoleId, department } = req.body;
    const role = await req.prisma.accessRole.findUnique({ where: { id: accessRoleId } });
    if (!role) {
      return res.status(400).json({ message: 'Rolle wurde nicht gefunden' });
    }

    const before = await req.prisma.user.findUnique({ where: { id: req.params.id }, include: { accessRole: true } });
    const user = await req.prisma.user.update({
      where: { id: req.params.id },
      data: {
        accessRoleId,
        department: isBlank(department) ? undefined : String(department).trim(),
      },
      include: { accessRole: true },
    });

    await writeAuditLog(req, {
      action: 'USER_ROLE_ASSIGNED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.name,
      summary: `${user.name} wurde der Rolle ${role.name} zugeordnet.`,
      severity: 'WARNING',
      before: summarizeChanges(pickFields(before, auditUserFields), pickFields(user, auditUserFields)),
      after: pickFields(user, auditUserFields),
      metadata: { assignedRoleId: role.id, assignedRoleName: role.name },
    });

    res.json({ user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Rollenzuweisung konnte nicht gespeichert werden', error: error.message });
  }
});

router.post('/users', auth, requireRoleManager, async (req, res) => {
  try {
    const { name, email, password, department, accessRoleId } = req.body;
    if (isBlank(name) || isBlank(email) || isBlank(password)) {
      return res.status(400).json({ message: 'Name, E-Mail und Passwort sind erforderlich' });
    }

    const existing = await req.prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (existing) {
      return res.status(400).json({ message: 'E-Mail existiert bereits' });
    }

    const role = accessRoleId ? await req.prisma.accessRole.findUnique({ where: { id: accessRoleId } }) : null;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        notificationEmail: String(email).trim().toLowerCase(),
        emailNotificationsEnabled: false,
        password: hashedPassword,
        department: isBlank(department) ? 'Development' : String(department).trim(),
        role: role?.kind === 'ADMIN' ? 'ADMIN' : role?.kind === 'GBL' ? 'PROJECT_MANAGER' : 'DEVELOPER',
        accessRoleId: role?.id || null,
      },
      include: { accessRole: true },
    });

    await writeAuditLog(req, {
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.name,
      summary: `Benutzer ${user.name} wurde angelegt.`,
      severity: 'WARNING',
      after: pickFields(user, auditUserFields),
      metadata: { assignedRoleId: role?.id || null, assignedRoleName: role?.name || null },
    });

    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Benutzer konnte nicht erstellt werden', error: error.message });
  }
});

module.exports = router;
