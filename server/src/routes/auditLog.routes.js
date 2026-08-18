const express = require('express');
const auth = require('../middleware/auth');
const { userCanManageRoles } = require('../utils/accessRoles');
const { parseDate } = require('../utils/date');

const router = express.Router();
const allowedSeverities = new Set(['INFO', 'NOTICE', 'WARNING', 'CRITICAL']);

async function requireAuditAccess(req, res, next) {
  const currentUser = await req.prisma.user.findUnique({
    where: { id: req.user.id },
    include: { accessRole: true },
  });

  if (!userCanManageRoles(currentUser)) {
    return res.status(403).json({ message: 'Keine Berechtigung fuer das Audit-Log' });
  }

  req.currentUser = currentUser;
  next();
}

function serializeLog(entry) {
  return {
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    entityLabel: entry.entityLabel,
    summary: entry.summary,
    severity: entry.severity,
    before: entry.before,
    after: entry.after,
    metadata: entry.metadata,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    actorName: entry.actorName,
    actorEmail: entry.actorEmail,
    actorRole: entry.actorRole,
    userId: entry.userId,
    createdAt: entry.createdAt,
  };
}

router.get('/', auth, requireAuditAccess, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 10), 250);
    const search = String(req.query.search || '').trim();
    const entityType = String(req.query.entityType || '').trim();
    const action = String(req.query.action || '').trim();
    const severity = String(req.query.severity || '').trim().toUpperCase();
    const userId = String(req.query.userId || '').trim();
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const where = {
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
      ...(allowedSeverities.has(severity) ? { severity } : {}),
      ...(userId ? { userId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { summary: { contains: search, mode: 'insensitive' } },
              { actorName: { contains: search, mode: 'insensitive' } },
              { actorEmail: { contains: search, mode: 'insensitive' } },
              { actorRole: { contains: search, mode: 'insensitive' } },
              { entityType: { contains: search, mode: 'insensitive' } },
              { entityLabel: { contains: search, mode: 'insensitive' } },
              { action: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [logs, total, facets] = await Promise.all([
      req.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
      req.prisma.auditLog.count({ where }),
      req.prisma.auditLog.groupBy({ by: ['severity'], _count: { severity: true } }),
    ]);

    res.json({
      logs: logs.map(serializeLog),
      total,
      facets: facets.reduce((result, item) => ({ ...result, [item.severity]: item._count.severity }), {}),
    });
  } catch (error) {
    res.status(500).json({ message: 'Audit-Log konnte nicht geladen werden', error: error.message });
  }
});

module.exports = router;
