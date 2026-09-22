const express = require('express');
const auth = require('../middleware/auth');
const { parseDate } = require('../utils/date');
const { serializeTask } = require('../utils/contentSerializers');
const { buildTaskScopeWhere, getCurrentUserWithAccessRole, mergeAnd } = require('../utils/accessScope');

const router = express.Router();

function toBoolean(value) {
  return value === true || value === 'true';
}

router.get('/tasks', auth, async (req, res) => {
  try {
    const {
      from,
      to,
      taskId,
      projectId,
      assigneeId,
      status,
      priority,
      department,
      mineOnly,
      overdueOnly,
      search,
    } = req.query;

    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    const now = new Date();

    const filters = [];

    if (fromDate && toDate) {
      filters.push({
        OR: [
          { dueDate: { gte: fromDate, lte: toDate } },
          { startDate: { gte: fromDate, lte: toDate } },
          { endDate: { gte: fromDate, lte: toDate } },
        ],
      });
    }

    if (taskId) filters.push({ id: taskId });
    if (projectId) filters.push({ projectId });
    if (assigneeId) filters.push({ assigneeId });
    if (status) filters.push({ status });
    if (priority) filters.push({ priority });
    if (department) filters.push({ department });
    if (toBoolean(mineOnly)) filters.push({ assigneeId: req.user.id });
    if (toBoolean(overdueOnly)) {
      filters.push({
        dueDate: { lt: now },
        status: { not: 'DONE' },
      });
    }
    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { project: { name: { contains: search, mode: 'insensitive' } } },
          { assignee: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    filters.push(buildTaskScopeWhere(currentUser));

    const tasks = await req.prisma.task.findMany({
      where: mergeAnd(...filters),
      include: {
        assignee: {
          select: { id: true, name: true, email: true, role: true, department: true },
        },
        assignmentSource: true,
        compliance: true,
        attachments: { orderBy: { createdAt: 'asc' } },
        auditEntries: { orderBy: { order: 'asc' } },
        personLinks: { orderBy: { createdAt: 'asc' } },
        tags: { orderBy: { label: 'asc' } },
        comments: {
          include: { author: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        project: {
          select: { id: true, name: true, key: true, color: true, deadline: true, department: true, departmentId: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { startDate: 'asc' }, { priority: 'desc' }],
    });

    res.json(tasks.map(serializeTask));
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Laden der Kalenderaufgaben',
      error: error.message,
    });
  }
});

module.exports = router;
