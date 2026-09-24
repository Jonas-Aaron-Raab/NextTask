const path = require('path');
const { pathToFileURL } = require('url');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { ensureDefaultAccessRoles } = require('../src/utils/accessRoles');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const userProfiles = {
  Gast: { email: 'gast@nexttask.local', role: 'ADMIN', department: 'Informationstechnologie' },
  'Lisa Wagner': { email: 'lisa.wagner@sparkasse-nexttask.de', role: 'PROJECT_MANAGER', department: 'Digitales Banking' },
  'Markus Klein': { email: 'markus.klein@sparkasse-nexttask.de', role: 'DEVELOPER', department: 'Digitale Vertriebskanaele' },
  'Anna Becker': { email: 'anna.becker@sparkasse-nexttask.de', role: 'QA', department: 'Produkt und Compliance' },
  'Tom Becker': { email: 'tom.becker@sparkasse-nexttask.de', role: 'QA', department: 'Qualitaetssicherung' },
  'Sarah Nguyen': { email: 'sarah.nguyen@sparkasse-nexttask.de', role: 'MARKETING', department: 'Marketing und Content' },
  'Elisabeth Bezverkha': { email: 'elisabeth.bezverkha@sparkasse-nexttask.de', role: 'PROJECT_MANAGER', department: 'Digitales Banking' },
  'Nina Hoffmann': { email: 'nina.hoffmann@sparkasse-nexttask.de', role: 'DEVELOPER', department: 'Kundenservice' },
  'Mara Stein': { email: 'mara.stein@sparkasse.local', role: 'PROJECT_MANAGER', department: 'Informationstechnologie' },
  'Jonas Weber': { email: 'jonas.weber@sparkasse.local', role: 'DEVELOPER', department: 'Informationstechnologie' },
  'Sven Kraus': { email: 'sven.kraus@sparkasse.local', role: 'DEVELOPER', department: 'Informationstechnologie' },
  'Nils Berger': { email: 'nils.berger@sparkasse.local', role: 'DEVELOPER', department: 'Interne Dienste' },
  'Tara Klein': { email: 'tara.klein@sparkasse.local', role: 'DEVELOPER', department: 'Interne Dienste' },
  'Lea Hofmann': { email: 'lea.hofmann@sparkasse.local', role: 'PROJECT_MANAGER', department: 'Organisationsentwicklung' },
  'Oskar Neumann': { email: 'oskar.neumann@sparkasse.local', role: 'DEVELOPER', department: 'Organisationsentwicklung' },
};

const roleByName = {
  Gast: 'A',
  'Mara Stein': 'GBL-OR',
  'Jonas Weber': 'M-OR-IT',
  'Sven Kraus': 'M-OR-IT',
  'Nils Berger': 'M-OR-ID',
  'Tara Klein': 'M-OR-ID',
  'Lea Hofmann': 'M-OR-OE',
  'Oskar Neumann': 'M-OR-OE',
};

const statusMap = {
  today: 'OPEN',
  todo: 'OPEN',
  Offen: 'OPEN',
  'In Arbeit': 'IN_PROGRESS',
  progress: 'IN_PROGRESS',
  review: 'QA',
  Review: 'QA',
  blocked: 'BLOCKED',
  done: 'DONE',
  Erledigt: 'DONE',
};

const priorityMap = {
  niedrig: 'LOW',
  mittel: 'MEDIUM',
  hoch: 'HIGH',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

function clientDataUrl(relativePath) {
  return pathToFileURL(path.resolve(__dirname, '../../client/src/data', relativePath)).href;
}

async function importClientData() {
  const [projects, tasks, bank, documents] = await Promise.all([
    import(clientDataUrl('projectFixtures.js')),
    import(clientDataUrl('taskFixtures.js')),
    import(clientDataUrl('bankOrganization.js')),
    import(clientDataUrl('documentFixtures.js')),
  ]);

  return {
    ...projects,
    ...tasks,
    ...bank,
    ...documents,
  };
}

function normalizeText(value) {
  return String(value || '').trim();
}

function slug(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) || 'NEXTTASK';
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return new Date(`${text.slice(0, 10)}T00:00:00.000Z`);

  const numericMatch = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (numericMatch) {
    const [, day, month, year] = numericMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
  }

  const monthMap = {
    januar: '01',
    februar: '02',
    maerz: '03',
    marz: '03',
    april: '04',
    mai: '05',
    juni: '06',
    juli: '07',
    august: '08',
    september: '09',
    oktober: '10',
    november: '11',
    dezember: '12',
  };
  const longMatch = text.match(/^(\d{1,2})\.\s*([^\s]+)\s+(\d{4})$/);
  if (longMatch) {
    const [, day, monthName, year] = longMatch;
    const normalizedMonth = monthName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const month = monthMap[normalizedMonth];
    if (month) return new Date(`${year}-${month}-${day.padStart(2, '0')}T00:00:00.000Z`);
  }

  return null;
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function ensureUser(name, rolesByCode, passwordHash) {
  const profile = userProfiles[name] || {
    email: `${slug(name).toLowerCase().replace(/-/g, '.')}@sparkasse-nexttask.de`,
    role: 'DEVELOPER',
    department: 'Development',
  };
  const accessRole = rolesByCode.get(roleByName[name] || (profile.role === 'ADMIN' ? 'A' : 'M-OR-IT'));

  return prisma.user.upsert({
    where: { email: profile.email },
    update: {
      name,
      password: passwordHash,
      role: profile.role,
      department: profile.department,
      accessRoleId: accessRole?.id || null,
      notificationEmail: profile.email,
    },
    create: {
      name,
      email: profile.email,
      notificationEmail: profile.email,
      emailNotificationsEnabled: false,
      password: passwordHash,
      role: profile.role,
      department: profile.department,
      accessRoleId: accessRole?.id || null,
    },
  });
}

function uniqueNames(...collections) {
  return [
    ...new Set(
      collections
        .flat()
        .filter(Boolean)
        .map((name) => normalizeText(name))
        .filter(Boolean),
    ),
  ];
}

async function seedDepartment(department, usersByName) {
  await prisma.department.upsert({
    where: { id: department.id },
    update: {
      code: department.code || null,
      name: department.name,
      businessArea: department.businessArea || null,
      leadName: department.lead,
      leadId: usersByName.get(department.lead)?.id || null,
      memberCount: department.memberCount || department.members?.length || 0,
      description: department.description || '',
      accent: department.accent || 'border-slate-300 bg-[#fff4f6]',
      badgeTone: department.badgeTone || 'bg-[#fff0f2] text-[#b84758]',
    },
    create: {
      id: department.id,
      code: department.code || null,
      name: department.name,
      businessArea: department.businessArea || null,
      leadName: department.lead,
      leadId: usersByName.get(department.lead)?.id || null,
      memberCount: department.memberCount || department.members?.length || 0,
      description: department.description || '',
      accent: department.accent || 'border-slate-300 bg-[#fff4f6]',
      badgeTone: department.badgeTone || 'bg-[#fff0f2] text-[#b84758]',
    },
  });

  await prisma.departmentMember.deleteMany({ where: { departmentId: department.id } });
  const members = uniqueNames(department.members || [], department.lead);
  await Promise.all(
    members.map((name, order) =>
      prisma.departmentMember.create({
        data: {
          id: `${department.id}-member-${order + 1}`,
          departmentId: department.id,
          name,
          userId: usersByName.get(name)?.id || null,
          order,
        },
      }),
    ),
  );
}

async function seedProject(project, usersByName, departmentsByName) {
  const owner = usersByName.get(project.owner) || usersByName.get('Gast');
  const departmentId = project.departmentId || departmentsByName.get(project.department)?.id || null;
  const dueDate = toDate(project.dueDateInput || project.dueDate);
  const plannedStart = toDate(project.plannedStartInput || project.plannedStart);

  await prisma.project.upsert({
    where: { id: project.id },
    update: {
      name: project.name,
      key: project.key || slug(project.name),
      description: project.summary || project.description || project.goal || '',
      deadline: dueDate,
      businessArea: project.businessArea || project.department || null,
      projectGoal: project.projectGoal || project.goal || null,
      plannedStart,
      plannedEnd: dueDate,
      deputyLead: project.deputyLead || null,
      projectSponsor: project.projectSponsor || null,
      plannedEffortPt: toNumber(project.plannedEffortPt),
      plannedBudget: toNumber(project.plannedBudget),
      keyInterfaces: project.keyInterfaces || [],
      collaborationQuality: project.collaborationQuality || null,
      visibility: project.visibility || 'Abteilung',
      statusLabel: project.status || 'In Arbeit',
      projectType: project.projectType || project.visibility || 'Abteilung',
      ownerId: owner.id,
      departmentId,
    },
    create: {
      id: project.id,
      name: project.name,
      key: project.key || slug(project.name),
      description: project.summary || project.description || project.goal || '',
      deadline: dueDate,
      businessArea: project.businessArea || project.department || null,
      projectGoal: project.projectGoal || project.goal || null,
      plannedStart,
      plannedEnd: dueDate,
      deputyLead: project.deputyLead || null,
      projectSponsor: project.projectSponsor || null,
      plannedEffortPt: toNumber(project.plannedEffortPt),
      plannedBudget: toNumber(project.plannedBudget),
      keyInterfaces: project.keyInterfaces || [],
      collaborationQuality: project.collaborationQuality || null,
      visibility: project.visibility || 'Abteilung',
      statusLabel: project.status || 'In Arbeit',
      projectType: project.projectType || project.visibility || 'Abteilung',
      ownerId: owner.id,
      departmentId,
    },
  });

  await Promise.all([
    prisma.projectMilestone.deleteMany({ where: { projectId: project.id } }),
    prisma.projectRisk.deleteMany({ where: { projectId: project.id } }),
    prisma.projectBudgetLine.deleteMany({ where: { projectId: project.id } }),
    prisma.projectInterface.deleteMany({ where: { projectId: project.id } }),
  ]);

  await Promise.all([
    ...(project.milestones || []).map((milestone, order) =>
      prisma.projectMilestone.create({
        data: {
          id: milestone.id || `${project.id}-milestone-${order + 1}`,
          projectId: project.id,
          title: milestone.title,
          planDate: toDate(milestone.planDateInput || milestone.planDate),
          newDate: toDate(milestone.newDateInput || milestone.newDate),
          status: milestone.status || 'Offen',
          progress: toNumber(milestone.progress, 0),
          statusNote: milestone.statusNote || null,
          order,
        },
      }),
    ),
    ...(project.risks || []).map((risk, order) =>
      prisma.projectRisk.create({
        data: {
          id: risk.id || `${project.id}-risk-${order + 1}`,
          projectId: project.id,
          code: risk.code || `R-${order + 1}`,
          title: risk.title,
          description: risk.description || null,
          measure: risk.measure || null,
          impact: toNumber(risk.impact),
          probability: toNumber(risk.probability),
          riskClass: risk.riskClass || null,
          trend: risk.trend || null,
          active: risk.active === undefined ? true : Boolean(risk.active),
        },
      }),
    ),
    ...(project.budgetLines || []).map((line, order) =>
      prisma.projectBudgetLine.create({
        data: {
          id: line.id || `${project.id}-budget-${order + 1}`,
          projectId: project.id,
          category: line.category,
          plannedAmount: toNumber(line.plannedAmount, 0),
          actualAmount: toNumber(line.actualAmount, 0),
          order,
        },
      }),
    ),
    ...(project.interfaces || []).map((item, order) =>
      prisma.projectInterface.create({
        data: {
          id: item.id || `${project.id}-interface-${order + 1}`,
          projectId: project.id,
          name: item.name,
          status: item.status || 'Offen',
          comment: item.comment || null,
          order,
        },
      }),
    ),
  ]);

  if (project.approvals) {
    await prisma.projectApproval.upsert({
      where: { projectId: project.id },
      update: {
        projectResponsible: project.approvals.projectResponsible || null,
        gbl: project.approvals.gbl || null,
        projectLead: project.approvals.projectLead || null,
        approvalDate: toDate(project.approvals.approvalDateInput || project.approvals.approvalDate),
      },
      create: {
        id: `${project.id}-approval`,
        projectId: project.id,
        projectResponsible: project.approvals.projectResponsible || null,
        gbl: project.approvals.gbl || null,
        projectLead: project.approvals.projectLead || null,
        approvalDate: toDate(project.approvals.approvalDateInput || project.approvals.approvalDate),
      },
    });
  }

  if (project.reportProgress || project.reportNotes || project.nextSteps || project.actualBudget || project.actualEffortPt) {
    await prisma.projectStatusReport.upsert({
      where: { id: `${project.id}-status-report-1` },
      update: {
        projectId: project.id,
        authorId: owner.id,
        progress: toNumber(project.reportProgress, 0),
        goalStatus: project.goalStatus || project.overallStatus || null,
        scheduleStatus: project.scheduleStatus || null,
        resourceStatus: project.resourceStatus || null,
        budgetStatus: project.budgetStatus || null,
        progressNote: project.reportNotes || null,
        collaborationQuality: project.collaborationQuality || null,
        nextSteps: project.nextSteps || null,
        actualEffortPt: toNumber(project.actualEffortPt),
        actualBudget: toNumber(project.actualBudget),
        versionLabel: project.reportVersion || null,
      },
      create: {
        id: `${project.id}-status-report-1`,
        projectId: project.id,
        authorId: owner.id,
        progress: toNumber(project.reportProgress, 0),
        goalStatus: project.goalStatus || project.overallStatus || null,
        scheduleStatus: project.scheduleStatus || null,
        resourceStatus: project.resourceStatus || null,
        budgetStatus: project.budgetStatus || null,
        progressNote: project.reportNotes || null,
        collaborationQuality: project.collaborationQuality || null,
        nextSteps: project.nextSteps || null,
        actualEffortPt: toNumber(project.actualEffortPt),
        actualBudget: toNumber(project.actualBudget),
        versionLabel: project.reportVersion || null,
      },
    });
  }
}

async function seedTask(task, projectId, usersByName, sourceTask = null) {
  const assignee = usersByName.get(task.assignee);
  const assignedBy = task.assignedBy || sourceTask?.assignedBy || { name: 'NextTask', initials: 'NT', tone: 'from-slate-200 to-slate-300' };
  const tags = task.tags || sourceTask?.tags || [];
  const attachments = task.attachments || sourceTask?.attachments || [];
  const linkedPeople = task.linkedPeople || sourceTask?.linkedPeople || [];
  const compliance = task.compliance || sourceTask?.compliance || null;
  const auditTrail = task.auditTrail || sourceTask?.auditTrail || [];
  const dueDate = toDate(task.dueDateValue || task.dueDate);

  await prisma.task.upsert({
    where: { id: task.id },
    update: {
      title: task.title,
      description: task.description || task.note || sourceTask?.description || null,
      status: statusMap[task.status] || 'OPEN',
      priority: priorityMap[task.priority] || 'MEDIUM',
      dueDate,
      estimatedHours: toNumber(task.estimatedHours),
      ticketNumber: task.ticketNumber || null,
      progress: toNumber(task.progress, 0),
      checklist: task.checklist || null,
      note: task.note || null,
      sourceTaskId: task.sourceTaskId || sourceTask?.id || null,
      department: task.department || null,
      approvalLevel: task.approvalLevel || null,
      markerId: task.markerId || null,
      assigneeId: assignee?.id || null,
      projectId,
    },
    create: {
      id: task.id,
      title: task.title,
      description: task.description || task.note || sourceTask?.description || null,
      status: statusMap[task.status] || 'OPEN',
      priority: priorityMap[task.priority] || 'MEDIUM',
      dueDate,
      estimatedHours: toNumber(task.estimatedHours),
      ticketNumber: task.ticketNumber || null,
      progress: toNumber(task.progress, 0),
      checklist: task.checklist || null,
      note: task.note || null,
      sourceTaskId: task.sourceTaskId || sourceTask?.id || null,
      department: task.department || null,
      approvalLevel: task.approvalLevel || null,
      markerId: task.markerId || null,
      assigneeId: assignee?.id || null,
      projectId,
    },
  });

  await Promise.all([
    prisma.taskTag.deleteMany({ where: { taskId: task.id } }),
    prisma.taskPersonLink.deleteMany({ where: { taskId: task.id } }),
    prisma.taskAttachment.deleteMany({ where: { taskId: task.id } }),
    prisma.taskCompliance.deleteMany({ where: { taskId: task.id } }),
    prisma.taskAuditEntry.deleteMany({ where: { taskId: task.id } }),
    prisma.taskAssignmentSource.deleteMany({ where: { taskId: task.id } }),
    prisma.comment.deleteMany({ where: { taskId: task.id } }),
  ]);

  await Promise.all([
    prisma.taskAssignmentSource.create({
      data: {
        id: `${task.id}-assigned-by`,
        taskId: task.id,
        name: assignedBy.name,
        initials: assignedBy.initials || null,
        tone: assignedBy.tone || null,
      },
    }),
    ...[...new Set(tags)].map((label) =>
      prisma.taskTag.create({ data: { id: `${task.id}-tag-${slug(label).toLowerCase()}`, taskId: task.id, label } }),
    ),
    ...[...new Set(linkedPeople)].map((name, order) =>
      prisma.taskPersonLink.create({ data: { id: `${task.id}-person-${order + 1}`, taskId: task.id, name } }),
    ),
    ...attachments.map((attachment, order) =>
      prisma.taskAttachment.create({
        data: {
          id: `${task.id}-attachment-${attachment.id || order + 1}`,
          taskId: task.id,
          name: attachment.name,
          type: attachment.type || 'Datei',
          source: attachment.source || 'Upload',
          owner: attachment.owner || null,
        },
      }),
    ),
    ...(compliance
      ? [
          prisma.taskCompliance.create({
            data: {
              id: `${task.id}-compliance`,
              taskId: task.id,
              classification: compliance.classification || 'Intern',
              risk: compliance.risk || 'Niedrig',
              controlId: compliance.controlId || null,
              approval: compliance.approval || null,
              evidence: compliance.evidence || null,
            },
          }),
        ]
      : []),
    ...auditTrail.map((content, order) =>
      prisma.taskAuditEntry.create({ data: { id: `${task.id}-audit-${order + 1}`, taskId: task.id, content, order } }),
    ),
    ...(task.comments || sourceTask?.comments || []).map((comment, order) =>
      prisma.comment.create({
        data: {
          id: `${task.id}-comment-${comment.id || order + 1}`,
          taskId: task.id,
          authorId: usersByName.get(comment.author)?.id || usersByName.get('Gast').id,
          content: comment.text || comment.content || '',
        },
      }),
    ),
  ]);
}

async function seedDocument(document, departmentsByName, projectsByName) {
  const project = projectsByName.get(document.project);
  const department = departmentsByName.get(document.department);

  await prisma.document.upsert({
    where: { id: document.id },
    update: {
      title: document.title,
      type: document.type,
      status: document.status,
      classification: document.classification,
      ownerName: document.owner,
      version: document.version || null,
      reviewDate: toDate(document.reviewDate),
      retentionDate: toDate(document.retention),
      summary: document.summary,
      departmentId: department?.id || null,
      projectId: project?.id || null,
    },
    create: {
      id: document.id,
      title: document.title,
      type: document.type,
      status: document.status,
      classification: document.classification,
      ownerName: document.owner,
      version: document.version || null,
      reviewDate: toDate(document.reviewDate),
      retentionDate: toDate(document.retention),
      summary: document.summary,
      departmentId: department?.id || null,
      projectId: project?.id || null,
    },
  });

  await Promise.all([
    prisma.documentTaskLink.deleteMany({ where: { documentId: document.id } }),
    prisma.documentControl.deleteMany({ where: { documentId: document.id } }),
    prisma.documentAuditEntry.deleteMany({ where: { documentId: document.id } }),
  ]);

  await Promise.all([
    ...(document.linkedTasks || []).map((taskTitle, order) =>
      prisma.documentTaskLink.create({
        data: { id: `${document.id}-task-${order + 1}`, documentId: document.id, taskTitle },
      }),
    ),
    ...(document.controls || []).map((controlId, order) =>
      prisma.documentControl.create({
        data: { id: `${document.id}-control-${order + 1}`, documentId: document.id, controlId },
      }),
    ),
    ...(document.auditTrail || []).map((content, order) =>
      prisma.documentAuditEntry.create({
        data: { id: `${document.id}-audit-${order + 1}`, documentId: document.id, content, order },
      }),
    ),
  ]);
}

async function main() {
  const data = await importClientData();
  const roles = await ensureDefaultAccessRoles(prisma);
  const rolesByCode = new Map(roles.map((role) => [role.code, role]));
  const passwordHash = await bcrypt.hash('NextTaskDemo!2026', 10);

  const taskProjects = data.taskProjects.map((project) => ({
    id: project.id,
    name: project.name,
    department: project.department,
    owner: project.owner,
    status: 'In Arbeit',
    dueDate: '',
    summary: project.description,
    projectGoal: project.description,
  }));
  const bankProjects = data.bankProjects.map((project) => ({
    ...project,
    dueDateInput: null,
    departmentId: project.departmentId,
    summary: project.goal,
    projectGoal: project.goal,
    visibility: 'Abteilung',
  }));
  const dashboardProject = {
    id: 'project-informationstechnologie-or-it',
    name: 'Informationstechnologie OR-IT',
    departmentId: 'or-it',
    owner: 'Mara Stein',
    status: 'In Arbeit',
    summary: 'Operative IT-Aufgaben, Patches und API-Gateway-Dokumentation.',
    projectGoal: 'Stabile und dokumentierte IT-Plattformen fuer den laufenden Betrieb sichern.',
  };

  const allDepartments = [...data.initialDepartments, ...data.bankDepartments];
  const allProjects = [...data.initialProjects, ...taskProjects, ...bankProjects, dashboardProject];
  const sourceTasksById = new Map(data.initialTasks.map((task) => [task.id, task]));
  const projectByTaskProjectName = new Map(taskProjects.map((project) => [project.name, project]));

  const allNames = uniqueNames(
    ['Gast', 'NextTask'],
    Object.keys(userProfiles),
    allDepartments.map((department) => department.lead),
    allDepartments.flatMap((department) => department.members || []),
    allProjects.map((project) => project.owner),
    data.initialTasks.map((task) => task.assignee),
    data.initialTasks.map((task) => task.assignedBy?.name),
    data.initialTasks.flatMap((task) => task.linkedPeople || []),
    data.initialBacklogTasks.map((task) => task.assignee),
    data.bankProjects.flatMap((project) => project.tasks.map((task) => task.assignee)),
    data.dashboardFallbackTasks.map((task) => task.assignee),
    data.documentFixtures.map((document) => document.owner),
  );

  const users = await Promise.all(allNames.map((name) => ensureUser(name, rolesByCode, passwordHash)));
  const usersByName = new Map(users.map((user) => [user.name, user]));

  for (const department of allDepartments) {
    await seedDepartment(department, usersByName);
  }
  const departments = await prisma.department.findMany();
  const departmentsByName = new Map(departments.map((department) => [department.name, department]));

  for (const project of allProjects) {
    await seedProject(project, usersByName, departmentsByName);
  }
  const projects = await prisma.project.findMany();
  const projectsByName = new Map(projects.map((project) => [project.name, project]));

  for (const task of data.initialTasks) {
    const project = projectByTaskProjectName.get(task.project);
    await seedTask(task, project.id, usersByName);
  }

  for (const task of data.initialBacklogTasks) {
    await seedTask(task, task.projectId, usersByName, sourceTasksById.get(task.sourceTaskId));
  }

  for (const bankProject of data.bankProjects) {
    for (const [index, task] of bankProject.tasks.entries()) {
      await seedTask(
        {
          ...task,
          id: task.id,
          dueDate: bankProject.dueDate,
          estimatedHours: 4 + index,
          tags: [task.status, task.priority],
          description: `${task.title} fuer ${bankProject.name} bearbeiten und dokumentieren.`,
          compliance: {
            classification: 'Intern',
            risk: task.priority === 'hoch' ? 'Mittel' : 'Niedrig',
            controlId: `BANK-${bankProject.id.toUpperCase()}-${index + 1}`,
            approval: 'Projektinterne Freigabe nach Abschluss',
            evidence: 'Bearbeitungsnachweis am Ticket hinterlegen',
          },
        },
        bankProject.id,
        usersByName,
      );
    }
  }

  for (const task of data.dashboardFallbackTasks) {
    await seedTask(task, dashboardProject.id, usersByName);
  }

  for (const document of data.documentFixtures) {
    await seedDocument(document, departmentsByName, projectsByName);
  }

  for (const title of data.documentTemplates) {
    await prisma.documentTemplate.upsert({
      where: { title },
      update: { title },
      create: { id: `template-${slug(title).toLowerCase()}`, title },
    });
  }

  console.log('Seed complete: display content is available in the database.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
