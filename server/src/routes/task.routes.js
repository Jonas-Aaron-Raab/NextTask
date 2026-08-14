const express = require('express');
const auth = require('../middleware/auth');
const { pickFields, summarizeChanges, writeAuditLog } = require('../utils/auditLog');
const router = express.Router();

const statusMap = {
  today: 'OPEN',
  'in-progress': 'IN_PROGRESS',
  review: 'QA',
  blocked: 'BLOCKED',
  done: 'DONE',
  TODAY: 'OPEN',
  THIS_WEEK: 'IN_PROGRESS',
  LATER: 'OPEN',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  QA: 'QA',
  BLOCKED: 'BLOCKED',
  DONE: 'DONE',
};

const auditTaskFields = [
  'id',
  'title',
  'description',
  'status',
  'priority',
  'order',
  'startDate',
  'dueDate',
  'endDate',
  'estimatedHours',
  'department',
  'markerId',
  'projectId',
  'assigneeId',
];

function normalizeStatus(status) {
  return statusMap[status] || 'OPEN';
}

function normalizePriority(priority) {
  const value = String(priority || 'MEDIUM').toUpperCase();
  return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(value) ? value : 'MEDIUM';
}

function parseDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await req.prisma.task.findMany({
      where: { projectId: req.params.projectId },
      include: {
        assignee: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ status: 'asc' }, { order: 'asc' }],
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Laden der Tasks',
      error: error.message,
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      startDate,
      dueDate,
      endDate,
      estimatedHours,
      department,
      markerId,
    } = req.body;
    const normalizedStatus = normalizeStatus(status);
    const lastTask = await req.prisma.task.findFirst({
      where: { projectId, status: normalizedStatus },
      orderBy: { order: 'desc' },
    });
    const task = await req.prisma.task.create({
      data: {
        title,
        description,
        status: normalizedStatus,
        priority: normalizePriority(priority),
        projectId,
        assigneeId: assigneeId || null,
        order: lastTask ? lastTask.order + 1 : 0,
        startDate: parseDate(startDate),
        dueDate: parseDate(dueDate),
        endDate: parseDate(endDate),
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        department: department || null,
        markerId: markerId || null,
      },
    });

    await writeAuditLog(req, {
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      entityLabel: task.title,
      summary: `Aufgabe ${task.title} wurde erstellt.`,
      severity: 'NOTICE',
      after: pickFields(task, auditTaskFields),
      metadata: { projectId: task.projectId },
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Erstellen der Task',
      error: error.message,
    });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      startDate,
      dueDate,
      endDate,
      estimatedHours,
      department,
      markerId,
    } = req.body;
    const before = await req.prisma.task.findUnique({ where: { id: req.params.id } });
    const updated = await req.prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        status: status ? normalizeStatus(status) : undefined,
        priority: priority ? normalizePriority(priority) : undefined,
        assigneeId,
        startDate: parseDate(startDate),
        dueDate: parseDate(dueDate),
        endDate: parseDate(endDate),
        estimatedHours: estimatedHours === undefined ? undefined : Number(estimatedHours),
        department,
        markerId: markerId === undefined ? undefined : markerId || null,
      },
    });

    await writeAuditLog(req, {
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: updated.id,
      entityLabel: updated.title,
      summary: `Aufgabe ${updated.title} wurde aktualisiert.`,
      severity: 'NOTICE',
      before: summarizeChanges(pickFields(before, auditTaskFields), pickFields(updated, auditTaskFields)),
      after: pickFields(updated, auditTaskFields),
      metadata: { projectId: updated.projectId },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Aktualisieren',
      error: error.message,
    });
  }
});

router.patch('/:id/move', auth, async (req, res) => {
  try {
    const { status, order } = req.body;
    const before = await req.prisma.task.findUnique({ where: { id: req.params.id } });
    const updated = await req.prisma.task.update({
      where: { id: req.params.id },
      data: { status: normalizeStatus(status), order },
    });

    await writeAuditLog(req, {
      action: 'TASK_MOVED',
      entityType: 'TASK',
      entityId: updated.id,
      entityLabel: updated.title,
      summary: `Aufgabe ${updated.title} wurde verschoben.`,
      severity: updated.status === 'BLOCKED' ? 'WARNING' : 'INFO',
      before: summarizeChanges(pickFields(before, ['status', 'order']), pickFields(updated, ['status', 'order'])),
      after: pickFields(updated, ['status', 'order']),
      metadata: { projectId: updated.projectId },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Verschieben',
      error: error.message,
    });
  }
});

router.patch('/:id/schedule', auth, async (req, res) => {
  try {
    const { startDate, dueDate, endDate, assigneeId, estimatedHours } = req.body;
    const before = await req.prisma.task.findUnique({ where: { id: req.params.id } });
    const updated = await req.prisma.task.update({
      where: { id: req.params.id },
      data: {
        startDate: parseDate(startDate),
        dueDate: parseDate(dueDate),
        endDate: parseDate(endDate),
        assigneeId,
        estimatedHours: estimatedHours === undefined ? undefined : Number(estimatedHours),
      },
      include: {
        assignee: true,
        project: true,
      },
    });

    await writeAuditLog(req, {
      action: 'TASK_SCHEDULED',
      entityType: 'TASK',
      entityId: updated.id,
      entityLabel: updated.title,
      summary: `Zeitplanung fuer Aufgabe ${updated.title} wurde geaendert.`,
      severity: 'NOTICE',
      before: summarizeChanges(pickFields(before, ['startDate', 'dueDate', 'endDate', 'assigneeId', 'estimatedHours']), pickFields(updated, ['startDate', 'dueDate', 'endDate', 'assigneeId', 'estimatedHours'])),
      after: pickFields(updated, ['startDate', 'dueDate', 'endDate', 'assigneeId', 'estimatedHours']),
      metadata: { projectId: updated.projectId },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Aktualisieren der Kalenderplanung',
      error: error.message,
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await req.prisma.task.findUnique({ where: { id: req.params.id } });
    await req.prisma.task.delete({ where: { id: req.params.id } });

    await writeAuditLog(req, {
      action: 'TASK_DELETED',
      entityType: 'TASK',
      entityId: req.params.id,
      entityLabel: task?.title || req.params.id,
      summary: `Aufgabe ${task?.title || req.params.id} wurde geloescht.`,
      severity: 'WARNING',
      before: pickFields(task, auditTaskFields),
      metadata: { projectId: task?.projectId || null },
    });

    res.json({ message: 'Task geloescht' });
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Loeschen',
      error: error.message,
    });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const task = await req.prisma.task.findUnique({ where: { id: req.params.id } });
    const comment = await req.prisma.comment.create({
      data: {
        content,
        taskId: req.params.id,
        authorId: req.user.id,
      },
      include: {
        author: true,
      },
    });

    await writeAuditLog(req, {
      action: 'COMMENT_CREATED',
      entityType: 'COMMENT',
      entityId: comment.id,
      entityLabel: task?.title || req.params.id,
      summary: `Kommentar zu ${task?.title || 'einer Aufgabe'} wurde erstellt.`,
      severity: 'INFO',
      after: pickFields(comment, ['id', 'taskId', 'authorId', 'createdAt']),
      metadata: { taskId: req.params.id, projectId: task?.projectId || null },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Kommentieren',
      error: error.message,
    });
  }
});

module.exports = router;