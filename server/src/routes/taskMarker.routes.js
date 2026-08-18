const express = require('express');
const auth = require('../middleware/auth');
const { summarizeChanges, writeAuditLog } = require('../utils/auditLog');

const router = express.Router();

const defaultTaskMarkers = [
  {
    label: 'Hohe Priorität',
    description: 'Aufgaben mit hoher Priorität.',
    color: '#ef4444',
    matchField: 'priority',
    matchValue: 'hoch',
  },
  {
    label: 'Mittlere Priorität',
    description: 'Aufgaben mit mittlerer Priorität.',
    color: '#f59e0b',
    matchField: 'priority',
    matchValue: 'mittel',
  },
  {
    label: 'Niedrige Priorität',
    description: 'Aufgaben mit niedriger Priorität.',
    color: '#10b981',
    matchField: 'priority',
    matchValue: 'niedrig',
  },
  {
    label: 'Review',
    description: 'Aufgaben, die auf Rückmeldung oder Abnahme warten.',
    color: '#8b5cf6',
    matchField: 'status',
    matchValue: 'review',
  },
  {
    label: 'Blockiert',
    description: 'Aufgaben mit Hindernis oder Eskalationsbedarf.',
    color: '#e11d48',
    matchField: 'status',
    matchValue: 'blocked',
  },
];

const allowedMatchFields = new Set(['', 'priority', 'status', 'project', 'tag']);

function serializeMarker(marker) {
  return {
    id: marker.id,
    label: marker.label,
    description: marker.description,
    color: marker.color,
    matchField: marker.matchField,
    matchValue: marker.matchValue,
  };
}

function normalizeColor(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#3b82f6';
}

function normalizeMarker(marker, index) {
  return {
    id: typeof marker?.id === 'string' ? marker.id : null,
    label: String(marker?.label || 'Neue Markierung').trim().slice(0, 80) || 'Neue Markierung',
    description: String(marker?.description || '').trim().slice(0, 180),
    color: normalizeColor(marker?.color),
    matchField: allowedMatchFields.has(marker?.matchField) ? marker.matchField : '',
    matchValue: String(marker?.matchValue || '').trim().slice(0, 120),
    order: index,
  };
}

async function getMarkers(prisma, userId) {
  return prisma.taskMarker.findMany({
    where: { userId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
}

async function ensureMarkers(prisma, userId) {
  const existing = await getMarkers(prisma, userId);
  if (existing.length) return existing;

  await prisma.taskMarker.createMany({
    data: defaultTaskMarkers.map((marker, index) => ({
      ...marker,
      order: index,
      userId,
    })),
  });

  return getMarkers(prisma, userId);
}

router.get('/', auth, async (req, res) => {
  try {
    const markers = await ensureMarkers(req.prisma, req.user.id);
    res.json({ markers: markers.map(serializeMarker) });
  } catch (error) {
    res.status(500).json({ message: 'Aufgabenfarben konnten nicht geladen werden', error: error.message });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const inputMarkers = Array.isArray(req.body?.markers) ? req.body.markers : [];
    const normalizedMarkers = (inputMarkers.length ? inputMarkers : defaultTaskMarkers).map(normalizeMarker).slice(0, 60);

    const existingMarkers = await getMarkers(req.prisma, req.user.id);
    const beforeMarkers = existingMarkers.map(serializeMarker);
    const existingIds = new Set(existingMarkers.map((marker) => marker.id));
    const retainedIds = normalizedMarkers.map((marker) => marker.id).filter((id) => existingIds.has(id));
    const operations = [
      req.prisma.taskMarker.deleteMany({
        where: {
          userId: req.user.id,
          id: retainedIds.length ? { notIn: retainedIds } : undefined,
        },
      }),
      ...normalizedMarkers.map((marker) => {
        const { id, ...data } = marker;

        if (existingIds.has(id)) {
          return req.prisma.taskMarker.update({
            where: { id },
            data,
          });
        }

        return req.prisma.taskMarker.create({
          data: {
            ...data,
            userId: req.user.id,
          },
        });
      }),
    ];

    await req.prisma.$transaction(operations);

    const markers = await getMarkers(req.prisma, req.user.id);
    const afterMarkers = markers.map(serializeMarker);
    await writeAuditLog(req, {
      action: 'TASK_MARKERS_UPDATED',
      entityType: 'TASK_MARKER_SETTINGS',
      entityId: req.user.id,
      entityLabel: 'Aufgabenfarben',
      summary: 'Aufgabenfarben und Farbstreifen-Regeln wurden gespeichert.',
      severity: 'NOTICE',
      before: summarizeChanges({ markers: beforeMarkers }, { markers: afterMarkers }),
      after: { markers: afterMarkers },
      metadata: { markerCount: afterMarkers.length },
    });
    res.json({ markers: afterMarkers });
  } catch (error) {
    res.status(500).json({ message: 'Aufgabenfarben konnten nicht gespeichert werden', error: error.message });
  }
});

module.exports = router;
