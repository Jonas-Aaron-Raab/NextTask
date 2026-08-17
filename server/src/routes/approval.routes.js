const express = require('express');
const auth = require('../middleware/auth');
const { pickFields, summarizeChanges, writeAuditLog } = require('../utils/auditLog');
const { userCanApproveRequests } = require('../utils/accessRoles');

const router = express.Router();

const entityTypes = new Set(['TASK', 'PROJECT', 'STATUS_REPORT', 'DOCUMENT', 'OTHER']);
const approvalStatuses = new Set(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
const auditApprovalFields = [
  'id',
  'entityType',
  'entityId',
  'entityLabel',
  'title',
  'description',
  'status',
  'evidence',
  'decisionNote',
  'requesterId',
  'approverId',
  'requestedAt',
  'decidedAt',
];

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(value) {
  const normalized = normalizeString(value);
  return normalized || undefined;
}

function normalizeEntityType(value) {
  const normalized = normalizeString(value).toUpperCase();
  return entityTypes.has(normalized) ? normalized : 'OTHER';
}

function normalizeStatus(value) {
  const normalized = normalizeString(value).toUpperCase();
  return approvalStatuses.has(normalized) ? normalized : '';
}

function serializeApproval(approval) {
  return {
    id: approval.id,
    entityType: approval.entityType,
    entityId: approval.entityId,
    entityLabel: approval.entityLabel,
    title: approval.title,
    description: approval.description,
    status: approval.status,
    evidence: approval.evidence,
    decisionNote: approval.decisionNote,
    requestedAt: approval.requestedAt,
    decidedAt: approval.decidedAt,
    createdAt: approval.createdAt,
    updatedAt: approval.updatedAt,
    requesterId: approval.requesterId,
    approverId: approval.approverId,
    requester: approval.requester
      ? {
          id: approval.requester.id,
          name: approval.requester.name,
          email: approval.requester.email,
          department: approval.requester.department,
          role: approval.requester.role,
        }
      : null,
    approver: approval.approver
      ? {
          id: approval.approver.id,
          name: approval.approver.name,
          email: approval.approver.email,
          department: approval.approver.department,
          role: approval.approver.role,
        }
      : null,
  };
}

const approvalInclude = {
  requester: {
    select: { id: true, name: true, email: true, department: true, role: true },
  },
  approver: {
    select: { id: true, name: true, email: true, department: true, role: true },
  },
};

async function getCurrentUser(req) {
  const currentUser = await req.prisma.user.findUnique({
    where: { id: req.user.id },
    include: { accessRole: true },
  });

  req.currentUser = currentUser;
  return currentUser;
}

async function findFallbackApprover(prisma, requesterId) {
  return prisma.user.findFirst({
    where: {
      id: { not: requesterId },
      OR: [
        { role: 'ADMIN' },
        { role: 'PROJECT_MANAGER' },
        { accessRole: { is: { kind: { in: ['ADMIN', 'GBL'] } } } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
}

async function getEntityContext(prisma, entityType, entityId) {
  if (!entityId) return null;

  if (entityType === 'TASK') {
    const task = await prisma.task.findUnique({
      where: { id: entityId },
      include: { project: { select: { id: true, name: true, key: true, ownerId: true } } },
    });
    if (!task) return null;
    return {
      entityLabel: task.title,
      title: `Freigabe: ${task.title}`,
      metadata: { projectId: task.projectId, projectName: task.project?.name || null },
      ownerId: task.project?.ownerId || null,
    };
  }

  if (entityType === 'PROJECT') {
    const project = await prisma.project.findUnique({
      where: { id: entityId },
      select: { id: true, name: true, key: true, ownerId: true },
    });
    if (!project) return null;
    return {
      entityLabel: project.name,
      title: `Freigabe: ${project.name}`,
      metadata: { projectId: project.id, projectKey: project.key },
      ownerId: project.ownerId,
    };
  }

  if (entityType === 'STATUS_REPORT') {
    const report = await prisma.projectStatusReport.findUnique({
      where: { id: entityId },
      include: { project: { select: { id: true, name: true, key: true, ownerId: true } } },
    });
    if (!report) return null;
    const period = report.reportingPeriod ? ` ${report.reportingPeriod}` : '';
    return {
      entityLabel: `${report.project?.name || 'Statusbericht'}${period}`,
      title: `Freigabe: Statusbericht ${report.project?.name || ''}`.trim(),
      metadata: { projectId: report.projectId, projectName: report.project?.name || null },
      ownerId: report.project?.ownerId || null,
    };
  }

  return null;
}

function buildListWhere({ currentUser, role, status, search }) {
  const canApprove = userCanApproveRequests(currentUser);
  const scope =
    role === 'sent'
      ? { requesterId: currentUser.id }
      : role === 'inbox'
        ? canApprove
          ? { OR: [{ approverId: currentUser.id }, { approverId: null }] }
          : { approverId: currentUser.id }
        : canApprove
          ? {}
          : { OR: [{ requesterId: currentUser.id }, { approverId: currentUser.id }] };
  const filters = [
    Object.keys(scope).length ? scope : null,
    status ? { status } : null,
    search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { entityLabel: { contains: search, mode: 'insensitive' } },
            { evidence: { contains: search, mode: 'insensitive' } },
            { requester: { name: { contains: search, mode: 'insensitive' } } },
            { approver: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : null,
  ].filter(Boolean);

  return filters.length ? { AND: filters } : {};
}

router.get('/context', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const [users, projects, tasks, statusReports] = await Promise.all([
      req.prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, email: true, department: true, role: true, accessRole: true },
      }),
      req.prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, name: true, key: true, ownerId: true },
      }),
      req.prisma.task.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: { id: true, title: true, status: true, projectId: true, project: { select: { name: true } } },
      }),
      req.prisma.projectStatusReport.findMany({
        orderBy: { reportDate: 'desc' },
        take: 100,
        select: { id: true, reportingPeriod: true, reportDate: true, project: { select: { id: true, name: true } } },
      }),
    ]);

    res.json({
      canApprove: userCanApproveRequests(currentUser),
      users,
      entities: [
        ...projects.map((project) => ({
          entityType: 'PROJECT',
          entityId: project.id,
          entityLabel: project.name,
          ownerId: project.ownerId,
        })),
        ...tasks.map((task) => ({
          entityType: 'TASK',
          entityId: task.id,
          entityLabel: task.title,
          detail: task.project?.name || task.status,
        })),
        ...statusReports.map((report) => ({
          entityType: 'STATUS_REPORT',
          entityId: report.id,
          entityLabel: `Statusbericht ${report.project?.name || ''}`.trim(),
          detail: report.reportingPeriod || report.reportDate,
        })),
      ],
    });
  } catch (error) {
    res.status(500).json({ message: 'Freigabe-Kontext konnte nicht geladen werden', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const status = normalizeStatus(req.query.status);
    const role = normalizeString(req.query.role);
    const search = normalizeString(req.query.search);
    const limit = Math.min(Math.max(Number(req.query.limit) || 150, 10), 250);
    const where = buildListWhere({ currentUser, role, status, search });

    const [approvals, total, facets] = await Promise.all([
      req.prisma.approvalRequest.findMany({
        where,
        include: approvalInclude,
        orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
        take: limit,
      }),
      req.prisma.approvalRequest.count({ where }),
      req.prisma.approvalRequest.groupBy({ where, by: ['status'], _count: { status: true } }),
    ]);

    res.json({
      approvals: approvals.map(serializeApproval),
      total,
      facets: facets.reduce((result, item) => ({ ...result, [item.status]: item._count.status }), {}),
      canApprove: userCanApproveRequests(currentUser),
    });
  } catch (error) {
    res.status(500).json({ message: 'Freigaben konnten nicht geladen werden', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const entityType = normalizeEntityType(req.body.entityType);
    const entityId = normalizeString(req.body.entityId);
    const bodyEntityLabel = normalizeString(req.body.entityLabel);
    const title = normalizeString(req.body.title);

    if (!entityId && entityType !== 'OTHER') {
      return res.status(400).json({ message: 'Bezugsobjekt ist erforderlich' });
    }

    const entityContext = await getEntityContext(req.prisma, entityType, entityId);
    if (['TASK', 'PROJECT', 'STATUS_REPORT'].includes(entityType) && !entityContext) {
      return res.status(404).json({ message: 'Bezugsobjekt wurde nicht gefunden' });
    }

    let approverId = normalizeString(req.body.approverId) || entityContext?.ownerId || null;
    if (approverId === currentUser.id) {
      approverId = null;
    }
    if (!approverId) {
      const fallbackApprover = await findFallbackApprover(req.prisma, currentUser.id);
      approverId = fallbackApprover?.id || null;
    }

    if (approverId) {
      const approver = await req.prisma.user.findUnique({ where: { id: approverId }, select: { id: true } });
      if (!approver) return res.status(400).json({ message: 'Genehmiger wurde nicht gefunden' });
    }

    const approval = await req.prisma.approvalRequest.create({
      data: {
        entityType,
        entityId: entityId || `manual-${Date.now()}`,
        entityLabel: entityContext?.entityLabel || bodyEntityLabel || title || 'Manuelle Freigabe',
        title: title || entityContext?.title || 'Freigabe anfragen',
        description: optionalString(req.body.description),
        evidence: optionalString(req.body.evidence),
        requesterId: currentUser.id,
        approverId,
      },
      include: approvalInclude,
    });

    await writeAuditLog(req, {
      action: 'APPROVAL_REQUESTED',
      entityType: 'APPROVAL_REQUEST',
      entityId: approval.id,
      entityLabel: approval.title,
      summary: `Freigabe ${approval.title} wurde angefragt.`,
      severity: 'NOTICE',
      after: pickFields(approval, auditApprovalFields),
      metadata: { approvedEntityType: approval.entityType, approvedEntityId: approval.entityId, ...entityContext?.metadata },
    });

    res.status(201).json(serializeApproval(approval));
  } catch (error) {
    res.status(500).json({ message: 'Freigabe konnte nicht angefragt werden', error: error.message });
  }
});

async function decideApproval(req, res, status) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const before = await req.prisma.approvalRequest.findUnique({
      where: { id: req.params.id },
      include: approvalInclude,
    });
    if (!before) return res.status(404).json({ message: 'Freigabe wurde nicht gefunden' });
    if (before.status !== 'PENDING') {
      return res.status(400).json({ message: 'Diese Freigabe ist bereits entschieden' });
    }

    const canDecide = before.approverId === currentUser.id || userCanApproveRequests(currentUser);
    if (!canDecide) {
      return res.status(403).json({ message: 'Keine Berechtigung fuer diese Freigabe' });
    }

    const updated = await req.prisma.approvalRequest.update({
      where: { id: before.id },
      data: {
        status,
        approverId: before.approverId || currentUser.id,
        decisionNote: optionalString(req.body.decisionNote),
        decidedAt: new Date(),
      },
      include: approvalInclude,
    });

    await writeAuditLog(req, {
      action: status === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
      entityType: 'APPROVAL_REQUEST',
      entityId: updated.id,
      entityLabel: updated.title,
      summary:
        status === 'APPROVED'
          ? `Freigabe ${updated.title} wurde genehmigt.`
          : `Freigabe ${updated.title} wurde abgelehnt.`,
      severity: status === 'APPROVED' ? 'NOTICE' : 'WARNING',
      before: summarizeChanges(pickFields(before, auditApprovalFields), pickFields(updated, auditApprovalFields)),
      after: pickFields(updated, auditApprovalFields),
      metadata: { approvedEntityType: updated.entityType, approvedEntityId: updated.entityId },
    });

    res.json(serializeApproval(updated));
  } catch (error) {
    res.status(500).json({ message: 'Freigabe konnte nicht entschieden werden', error: error.message });
  }
}

router.patch('/:id/approve', auth, (req, res) => decideApproval(req, res, 'APPROVED'));
router.patch('/:id/reject', auth, (req, res) => decideApproval(req, res, 'REJECTED'));

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const before = await req.prisma.approvalRequest.findUnique({
      where: { id: req.params.id },
      include: approvalInclude,
    });
    if (!before) return res.status(404).json({ message: 'Freigabe wurde nicht gefunden' });
    if (before.status !== 'PENDING') {
      return res.status(400).json({ message: 'Nur offene Freigaben koennen abgebrochen werden' });
    }

    const canCancel = before.requesterId === currentUser.id || before.approverId === currentUser.id || userCanApproveRequests(currentUser);
    if (!canCancel) {
      return res.status(403).json({ message: 'Keine Berechtigung fuer diese Freigabe' });
    }

    const updated = await req.prisma.approvalRequest.update({
      where: { id: before.id },
      data: {
        status: 'CANCELLED',
        decisionNote: optionalString(req.body.decisionNote),
        decidedAt: new Date(),
      },
      include: approvalInclude,
    });

    await writeAuditLog(req, {
      action: 'APPROVAL_CANCELLED',
      entityType: 'APPROVAL_REQUEST',
      entityId: updated.id,
      entityLabel: updated.title,
      summary: `Freigabe ${updated.title} wurde abgebrochen.`,
      severity: 'INFO',
      before: summarizeChanges(pickFields(before, auditApprovalFields), pickFields(updated, auditApprovalFields)),
      after: pickFields(updated, auditApprovalFields),
      metadata: { approvedEntityType: updated.entityType, approvedEntityId: updated.entityId },
    });

    res.json(serializeApproval(updated));
  } catch (error) {
    res.status(500).json({ message: 'Freigabe konnte nicht abgebrochen werden', error: error.message });
  }
});

module.exports = router;
