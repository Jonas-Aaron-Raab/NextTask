const express = require('express');
const auth = require('../middleware/auth');
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
    const updated = await req.prisma.task.update({
      where: { id: req.params.id },
      data: { status: normalizeStatus(status), order },
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
    await req.prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task gelöscht' });
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Löschen',
      error: error.message,
    });
  }
});
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
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
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Kommentieren',
      error: error.message,
    });
  }
});
module.exports = router;
