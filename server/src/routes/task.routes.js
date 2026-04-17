const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
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
    const { title, description, status, priority, projectId, assigneeId } = req.body;
    const lastTask = await req.prisma.task.findFirst({
      where: { projectId, status: status || 'TODO' },
      orderBy: { order: 'desc' },
    });
    const task = await req.prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        projectId,
        assigneeId: assigneeId || null,
        order: lastTask ? lastTask.order + 1 : 0,
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
    const { title, description, status, priority, assigneeId } = req.body;
    const updated = await req.prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        status,
        priority,
        assigneeId,
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
      data: { status, order },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Verschieben',
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
