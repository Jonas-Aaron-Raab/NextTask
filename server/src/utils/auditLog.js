function getActor(user, fallback = {}) {
  return {
    userId: user?.id || fallback.userId || null,
    actorName: user?.name || fallback.actorName || 'System',
    actorEmail: user?.email || fallback.actorEmail || null,
    actorRole: user?.accessRole?.name || user?.accessRole?.code || user?.role || fallback.actorRole || null,
  };
}

function getRequestDetails(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : String(forwardedFor || req.ip || '').split(',')[0].trim();

  return {
    ipAddress: ipAddress || null,
    userAgent: req.headers['user-agent'] || null,
  };
}

function compactValue(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(compactValue);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['password', 'token'].includes(key))
        .map(([key, entryValue]) => [key, compactValue(entryValue)]),
    );
  }
  return value;
}

function summarizeChanges(before = {}, after = {}) {
  const changes = {};
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of keys) {
    const previousValue = compactValue(before?.[key]);
    const nextValue = compactValue(after?.[key]);
    if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
      changes[key] = { before: previousValue ?? null, after: nextValue ?? null };
    }
  }

  return changes;
}

function pickFields(record, fields) {
  if (!record) return null;
  return fields.reduce((result, field) => {
    result[field] = compactValue(record[field]);
    return result;
  }, {});
}

async function writeAuditLog(req, entry) {
  const prisma = req?.prisma || entry.prisma;
  if (!prisma) return null;

  const actor = getActor(entry.user || req?.currentUser || req?.user, entry.actor || {});
  const requestDetails = req ? getRequestDetails(req) : {};

  try {
    return await prisma.auditLog.create({
      data: {
        action: String(entry.action || 'UNKNOWN').slice(0, 80),
        entityType: String(entry.entityType || 'SYSTEM').slice(0, 80),
        entityId: entry.entityId ? String(entry.entityId).slice(0, 120) : null,
        entityLabel: entry.entityLabel ? String(entry.entityLabel).slice(0, 160) : null,
        summary: String(entry.summary || 'Aktion protokolliert').slice(0, 300),
        severity: String(entry.severity || 'INFO').slice(0, 40),
        before: entry.before === undefined ? undefined : compactValue(entry.before),
        after: entry.after === undefined ? undefined : compactValue(entry.after),
        metadata: entry.metadata === undefined ? undefined : compactValue(entry.metadata),
        ipAddress: requestDetails.ipAddress || null,
        userAgent: requestDetails.userAgent || null,
        ...actor,
      },
    });
  } catch (error) {
    console.error('Audit log write failed:', error.message);
    return null;
  }
}

module.exports = {
  pickFields,
  summarizeChanges,
  writeAuditLog,
};