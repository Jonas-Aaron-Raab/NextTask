const express = require('express');
const auth = require('../middleware/auth');
const { pickFields, summarizeChanges, writeAuditLog } = require('../utils/auditLog');
const {
  canSendEmails,
  extractMentionedUsers,
  sendTaskAssignmentEmail,
  sendTaskMentionEmail,
} = require('../utils/taskNotificationMailer');
const { removeTaskCalendarSyncs, syncTaskCalendarEvent } = require('../utils/calendarIntegration');
const { parseDate } = require('../utils/date');
const { serializeTask } = require('../utils/contentSerializers');
const {
  buildProjectScopeWhere,
  buildTaskScopeWhere,
  getCurrentUserWithAccessRole,
  mergeAnd,
  userHasPermission,
} = require('../utils/accessScope');
const router = express.Router();

const parseTaskDate = (value) => parseDate(value, undefined);

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
  'approvalLevel',
  'favoriteBy',
  'favoriteReturnIndexBy',
  'projectId',
  'assigneeId',
];

const taskDetailInclude = {
  assignee: true,
  assignmentSource: true,
  compliance: true,
  attachments: { orderBy: { createdAt: 'asc' } },
  auditEntries: { orderBy: { order: 'asc' } },
  personLinks: { orderBy: { createdAt: 'asc' } },
  tags: { orderBy: { label: 'asc' } },
  comments: {
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  },
  project: {
    select: { id: true, name: true, key: true, color: true, deadline: true, departmentId: true },
  },
};

function normalizeStatus(status) {
  return statusMap[status] || 'OPEN';
}

function normalizePriority(priority) {
  const priorityMap = {
    niedrig: 'LOW',
    mittel: 'MEDIUM',
    hoch: 'HIGH',
  };
  const value = priorityMap[String(priority || '').trim().toLowerCase()] || String(priority || 'MEDIUM').toUpperCase();
  return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(value) ? value : 'MEDIUM';
}

function parseOptionalNumber(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringList(value) {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeFavoriteReturnIndexBy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, index]) => [String(key), Number.parseInt(index, 10)])
      .filter(([key, index]) => key && Number.isInteger(index) && index >= 0),
  );
}

function buildTaskDetailWrites(taskId, body) {
  const writes = [];

  if (Array.isArray(body.tags)) {
    writes.push(reqPrisma => reqPrisma.taskTag.deleteMany({ where: { taskId } }));
    toStringList(body.tags).forEach((label) => {
      writes.push(reqPrisma => reqPrisma.taskTag.create({ data: { taskId, label } }));
    });
  }

  if (Array.isArray(body.linkedPeople)) {
    writes.push(reqPrisma => reqPrisma.taskPersonLink.deleteMany({ where: { taskId } }));
    toStringList(body.linkedPeople).forEach((name) => {
      writes.push(reqPrisma => reqPrisma.taskPersonLink.create({ data: { taskId, name } }));
    });
  }

  if (Array.isArray(body.attachments)) {
    writes.push(reqPrisma => reqPrisma.taskAttachment.deleteMany({ where: { taskId } }));
    body.attachments
      .map((attachment) => ({
        name: String(attachment.name || '').trim(),
        type: String(attachment.type || 'Datei').trim(),
        source: String(attachment.source || 'Upload').trim(),
        owner: String(attachment.owner || '').trim() || null,
        url: String(attachment.url || '').trim() || null,
      }))
      .filter((attachment) => attachment.name)
      .forEach((attachment) => {
        writes.push(reqPrisma => reqPrisma.taskAttachment.create({ data: { ...attachment, taskId } }));
      });
  }

  if (body.compliance) {
    writes.push(reqPrisma =>
      reqPrisma.taskCompliance.upsert({
        where: { taskId },
        update: {
          classification: String(body.compliance.classification || 'Intern').trim(),
          risk: String(body.compliance.risk || 'Niedrig').trim(),
          controlId: String(body.compliance.controlId || '').trim() || null,
          approval: String(body.compliance.approval || '').trim() || null,
          evidence: String(body.compliance.evidence || '').trim() || null,
        },
        create: {
          taskId,
          classification: String(body.compliance.classification || 'Intern').trim(),
          risk: String(body.compliance.risk || 'Niedrig').trim(),
          controlId: String(body.compliance.controlId || '').trim() || null,
          approval: String(body.compliance.approval || '').trim() || null,
          evidence: String(body.compliance.evidence || '').trim() || null,
        },
      }),
    );
  }

  if (body.assignedBy?.name) {
    writes.push(reqPrisma =>
      reqPrisma.taskAssignmentSource.upsert({
        where: { taskId },
        update: {
          name: String(body.assignedBy.name).trim(),
          initials: String(body.assignedBy.initials || '').trim() || null,
          tone: String(body.assignedBy.tone || '').trim() || null,
        },
        create: {
          taskId,
          name: String(body.assignedBy.name).trim(),
          initials: String(body.assignedBy.initials || '').trim() || null,
          tone: String(body.assignedBy.tone || '').trim() || null,
        },
      }),
    );
  }

  if (Array.isArray(body.auditTrail)) {
    writes.push(reqPrisma => reqPrisma.taskAuditEntry.deleteMany({ where: { taskId } }));
    toStringList(body.auditTrail).forEach((content, order) => {
      writes.push(reqPrisma => reqPrisma.taskAuditEntry.create({ data: { taskId, content, order } }));
    });
  }

  return writes;
}

async function applyTaskDetailWrites(prisma, taskId, body) {
  const writes = buildTaskDetailWrites(taskId, body);
  for (const write of writes) {
    await write(prisma);
  }
}

async function getTaskNotificationContext(prisma, taskId) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          notificationEmail: true,
          emailNotificationsEnabled: true,
          department: true,
          role: true,
        },
      },
      project: {
        select: { id: true, name: true, key: true, deadline: true, ownerId: true },
      },
    },
  });
}

function getActor(req) {
  return {
    id: req.user?.id || null,
    name: req.user?.name || null,
    email: req.user?.email || null,
    role: req.user?.role || null,
  };
}

async function syncTaskCalendarSafely(req, taskId) {
  try {
    await syncTaskCalendarEvent(req.prisma, taskId);
  } catch (error) {
    console.error(`Calendar sync failed for task ${taskId}:`, error.message);
  }
}

async function notifyTaskAssignment({ req, task, previousAssigneeId, reason }) {
  if (!canSendEmails() || !task?.assignee?.email) return;
  if (task.assignee.id === previousAssigneeId) return;

  try {
    await sendTaskAssignmentEmail({
      recipient: task.assignee,
      task,
      project: task.project,
      actor: getActor(req),
      reason,
    });
  } catch (error) {
    console.error('Task assignment email failed:', error.message);
  }
}

async function notifyCommentMentions({ req, task, content }) {
  if (!canSendEmails() || !task) return;

  try {
    const users = await req.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        notificationEmail: true,
        emailNotificationsEnabled: true,
      },
    });
    const mentionedUsers = extractMentionedUsers(content, users)
      .filter((user) => user.id !== req.user.id)
      .filter((user, index, all) => all.findIndex((candidate) => candidate.id === user.id) === index);

    await Promise.all(
      mentionedUsers.map((recipient) =>
        sendTaskMentionEmail({
          recipient,
          task,
          project: task.project,
          actor: getActor(req),
          commentContent: content,
        }).catch((error) => {
          console.error(`Mention email failed for ${recipient.email}:`, error.message);
        }),
      ),
    );
  } catch (error) {
    console.error('Mention lookup failed:', error.message);
  }
}

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const project = await req.prisma.project.findFirst({
      where: mergeAnd({ id: req.params.projectId }, buildProjectScopeWhere(currentUser)),
      select: { id: true },
    });
    if (!project) return res.status(404).json({ message: 'Projekt wurde nicht gefunden' });

    const tasks = await req.prisma.task.findMany({
      where: { projectId: req.params.projectId },
      include: taskDetailInclude,
      orderBy: [{ status: 'asc' }, { order: 'asc' }],
    });
    res.json(tasks.map(serializeTask));
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Laden der Tasks',
      error: error.message,
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });
    if (!userHasPermission(currentUser, 'editTasks')) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Erstellen von Aufgaben' });
    }

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
      approvalLevel,
      ticketNumber,
      progress,
      checklist,
      note,
      sourceTaskId,
      parentTaskId,
      favoriteBy,
      favoriteReturnIndexBy,
    } = req.body;
    const scopedProject = await req.prisma.project.findFirst({
      where: mergeAnd({ id: projectId }, buildProjectScopeWhere(currentUser)),
      select: { id: true },
    });
    if (!scopedProject) return res.status(404).json({ message: 'Projekt wurde nicht gefunden' });

    const normalizedStatus = normalizeStatus(status);
    const lastTask = await req.prisma.task.findFirst({
      where: { projectId, status: normalizedStatus },
      orderBy: { order: 'desc' },
    });
    const createdTask = await req.prisma.task.create({
      data: {
        title,
        description,
        status: normalizedStatus,
        priority: normalizePriority(priority),
        projectId,
        assigneeId: assigneeId || null,
        order: lastTask ? lastTask.order + 1 : 0,
        startDate: parseTaskDate(startDate),
        dueDate: parseTaskDate(dueDate),
        endDate: parseTaskDate(endDate),
        estimatedHours: parseOptionalNumber(estimatedHours),
        ticketNumber: ticketNumber || null,
        progress: parseOptionalNumber(progress) ?? 0,
        checklist: checklist || null,
        note: note || null,
        sourceTaskId: sourceTaskId || null,
        department: department || null,
        markerId: markerId || null,
        approvalLevel: approvalLevel || null,
        favoriteBy: toStringList(favoriteBy),
        favoriteReturnIndexBy: normalizeFavoriteReturnIndexBy(favoriteReturnIndexBy),
        parentTaskId: parentTaskId || null,
      },
    });
    await applyTaskDetailWrites(req.prisma, createdTask.id, req.body);
    const task = await getTaskNotificationContext(req.prisma, createdTask.id);

    await writeAuditLog(req, {
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: createdTask.id,
      entityLabel: createdTask.title,
      summary: `Aufgabe ${createdTask.title} wurde erstellt.`,
      severity: 'NOTICE',
      after: pickFields(createdTask, auditTaskFields),
      metadata: { projectId: createdTask.projectId },
    });

    await notifyTaskAssignment({
      req,
      task,
      previousAssigneeId: null,
      reason: 'created',
    });

    await syncTaskCalendarSafely(req, createdTask.id);

    const fullTask = await req.prisma.task.findUnique({ where: { id: createdTask.id }, include: taskDetailInclude });
    res.status(201).json(serializeTask(fullTask || task));
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Erstellen der Task',
      error: error.message,
    });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });
    if (!userHasPermission(currentUser, 'editTasks')) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Bearbeiten von Aufgaben' });
    }

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
      approvalLevel,
      ticketNumber,
      progress,
      checklist,
      note,
      sourceTaskId,
      parentTaskId,
    } = req.body;
    const before = await req.prisma.task.findFirst({
      where: mergeAnd({ id: req.params.id }, buildTaskScopeWhere(currentUser)),
    });
    if (!before) return res.status(404).json({ message: 'Aufgabe wurde nicht gefunden' });

    if (req.body.projectId && req.body.projectId !== before.projectId) {
      const scopedProject = await req.prisma.project.findFirst({
        where: mergeAnd({ id: req.body.projectId }, buildProjectScopeWhere(currentUser)),
        select: { id: true },
      });
      if (!scopedProject) return res.status(403).json({ message: 'Keine Berechtigung für das Zielprojekt' });
    }

    const updatedTask = await req.prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        status: status ? normalizeStatus(status) : undefined,
        priority: priority ? normalizePriority(priority) : undefined,
        assigneeId,
        startDate: parseTaskDate(startDate),
        dueDate: parseTaskDate(dueDate),
        endDate: parseTaskDate(endDate),
        estimatedHours: parseOptionalNumber(estimatedHours),
        ticketNumber,
        progress: parseOptionalNumber(progress),
        checklist,
        note,
        sourceTaskId,
        department,
        markerId: markerId === undefined ? undefined : markerId || null,
        approvalLevel: approvalLevel === undefined ? undefined : approvalLevel || null,
        favoriteBy: favoriteBy === undefined ? undefined : toStringList(favoriteBy),
        favoriteReturnIndexBy:
          favoriteReturnIndexBy === undefined ? undefined : normalizeFavoriteReturnIndexBy(favoriteReturnIndexBy),
        parentTaskId: parentTaskId === undefined ? undefined : parentTaskId || null,
      },
    });
    await applyTaskDetailWrites(req.prisma, req.params.id, req.body);
    const updated = await getTaskNotificationContext(req.prisma, req.params.id);

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

    await notifyTaskAssignment({
      req,
      task: updated,
      previousAssigneeId: before?.assigneeId || null,
      reason: before?.assigneeId ? 'reassigned' : 'created',
    });

    await syncTaskCalendarSafely(req, req.params.id);

    const fullTask = await req.prisma.task.findUnique({ where: { id: req.params.id }, include: taskDetailInclude });
    res.json(serializeTask(fullTask || updated));
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Aktualisieren',
      error: error.message,
    });
  }
});

router.patch('/project/:projectId/order', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });
    if (!userHasPermission(currentUser, 'editTasks')) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Sortieren von Aufgaben' });
    }

    const taskIds = Array.isArray(req.body.taskIds) ? req.body.taskIds.map((id) => String(id)).filter(Boolean) : [];
    if (!taskIds.length) return res.status(400).json({ message: 'Aufgabenreihenfolge ist erforderlich' });

    const project = await req.prisma.project.findFirst({
      where: mergeAnd({ id: req.params.projectId }, buildProjectScopeWhere(currentUser)),
      select: { id: true, name: true },
    });
    if (!project) return res.status(404).json({ message: 'Projekt wurde nicht gefunden' });

    const scopedTasks = await req.prisma.task.findMany({
      where: mergeAnd({ projectId: project.id, id: { in: taskIds } }, buildTaskScopeWhere(currentUser)),
      select: { id: true, order: true, title: true },
    });
    if (scopedTasks.length !== taskIds.length) {
      return res.status(403).json({ message: 'Keine Berechtigung fuer alle Aufgaben in dieser Reihenfolge' });
    }

    await req.prisma.$transaction(
      taskIds.map((id, order) =>
        req.prisma.task.update({
          where: { id },
          data: { order },
        }),
      ),
    );

    const updatedTasks = await req.prisma.task.findMany({
      where: { projectId: project.id },
      include: taskDetailInclude,
      orderBy: [{ status: 'asc' }, { order: 'asc' }],
    });

    await writeAuditLog(req, {
      action: 'TASKS_REORDERED',
      entityType: 'PROJECT',
      entityId: project.id,
      entityLabel: project.name,
      summary: `Backlog-Reihenfolge fuer ${project.name} wurde aktualisiert.`,
      severity: 'INFO',
      before: { tasks: scopedTasks },
      after: { taskIds },
      metadata: { projectId: project.id },
    });

    res.json({ tasks: updatedTasks.map(serializeTask) });
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Sortieren',
      error: error.message,
    });
  }
});

router.patch('/:id/move', auth, async (req, res) => {
  try {
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });
    if (!userHasPermission(currentUser, 'editTasks')) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Verschieben von Aufgaben' });
    }

    const { status, order } = req.body;
    const before = await req.prisma.task.findFirst({
      where: mergeAnd({ id: req.params.id }, buildTaskScopeWhere(currentUser)),
    });
    if (!before) return res.status(404).json({ message: 'Aufgabe wurde nicht gefunden' });

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
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });
    if (!userHasPermission(currentUser, 'editTasks')) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Planen von Aufgaben' });
    }

    const { startDate, dueDate, endDate, assigneeId, estimatedHours } = req.body;
    const before = await req.prisma.task.findFirst({
      where: mergeAnd({ id: req.params.id }, buildTaskScopeWhere(currentUser)),
    });
    if (!before) return res.status(404).json({ message: 'Aufgabe wurde nicht gefunden' });

    const updated = await req.prisma.task.update({
      where: { id: req.params.id },
      data: {
        startDate: parseTaskDate(startDate),
        dueDate: parseTaskDate(dueDate),
        endDate: parseTaskDate(endDate),
        assigneeId,
        estimatedHours: parseOptionalNumber(estimatedHours),
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
      summary: `Zeitplanung für Aufgabe ${updated.title} wurde geändert.`,
      severity: 'NOTICE',
      before: summarizeChanges(pickFields(before, ['startDate', 'dueDate', 'endDate', 'assigneeId', 'estimatedHours']), pickFields(updated, ['startDate', 'dueDate', 'endDate', 'assigneeId', 'estimatedHours'])),
      after: pickFields(updated, ['startDate', 'dueDate', 'endDate', 'assigneeId', 'estimatedHours']),
      metadata: { projectId: updated.projectId },
    });

    await notifyTaskAssignment({
      req,
      task: updated,
      previousAssigneeId: before?.assigneeId || null,
      reason: before?.assigneeId ? 'reassigned' : 'created',
    });

    await syncTaskCalendarSafely(req, req.params.id);

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
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });
    if (!userHasPermission(currentUser, 'editTasks')) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Löschen von Aufgaben' });
    }

    const task = await req.prisma.task.findFirst({
      where: mergeAnd({ id: req.params.id }, buildTaskScopeWhere(currentUser)),
    });
    if (!task) return res.status(404).json({ message: 'Aufgabe wurde nicht gefunden' });

    await removeTaskCalendarSyncs(req.prisma, req.params.id);
    await req.prisma.task.delete({ where: { id: req.params.id } });

    await writeAuditLog(req, {
      action: 'TASK_DELETED',
      entityType: 'TASK',
      entityId: req.params.id,
      entityLabel: task?.title || req.params.id,
      summary: `Aufgabe ${task?.title || req.params.id} wurde gelöscht.`,
      severity: 'WARNING',
      before: pickFields(task, auditTaskFields),
      metadata: { projectId: task?.projectId || null },
    });

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
    const currentUser = await getCurrentUserWithAccessRole(req);
    if (!currentUser) return res.status(404).json({ message: 'Benutzer wurde nicht gefunden' });

    const { content } = req.body;
    const task = await req.prisma.task.findFirst({
      where: mergeAnd({ id: req.params.id }, buildTaskScopeWhere(currentUser)),
    });
    if (!task) return res.status(404).json({ message: 'Aufgabe wurde nicht gefunden' });

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

    const taskContext = await getTaskNotificationContext(req.prisma, req.params.id);
    await notifyCommentMentions({
      req,
      task: taskContext,
      content,
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
