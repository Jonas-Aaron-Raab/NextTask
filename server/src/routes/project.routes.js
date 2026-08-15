const express = require('express');
const auth = require('../middleware/auth');
const { pickFields, writeAuditLog } = require('../utils/auditLog');
const router = express.Router();

const projectInclude = {
  milestones: { orderBy: { order: 'asc' } },
  risks: { orderBy: { createdAt: 'asc' } },
  budgetLines: { orderBy: { order: 'asc' } },
  statusReports: { orderBy: { reportDate: 'desc' } },
};

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(value) {
  const normalized = normalizeString(value);
  return normalized || undefined;
}

function optionalDate(value) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function optionalNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeString(entry)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function generateProjectKey(name) {
  const keyBase = normalizeString(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return `${keyBase || 'PROJEKT'}-${Date.now().toString().slice(-6)}`;
}

function buildMilestoneCreates(milestones) {
  if (!Array.isArray(milestones)) return [];
  return milestones
    .map((milestone, index) => ({
      title: optionalString(milestone.title || milestone.name),
      planDate: optionalDate(milestone.planDate),
      newDate: optionalDate(milestone.newDate),
      status: optionalString(milestone.status) || 'OPEN',
      progress: optionalNumber(milestone.progress) ?? 0,
      statusNote: optionalString(milestone.statusNote || milestone.note),
      order: optionalNumber(milestone.order) ?? index,
    }))
    .filter((milestone) => milestone.title);
}

function buildRiskCreates(risks) {
  if (!Array.isArray(risks)) return [];
  return risks
    .map((risk, index) => ({
      code: optionalString(risk.code) || `R-${index + 1}`,
      title: optionalString(risk.title || risk.name),
      description: optionalString(risk.description),
      impact: optionalNumber(risk.impact),
      probability: optionalNumber(risk.probability),
      riskClass: optionalString(risk.riskClass),
      trend: optionalString(risk.trend),
      active: risk.active === undefined ? true : Boolean(risk.active),
    }))
    .filter((risk) => risk.title);
}

function buildBudgetLineCreates(budgetLines) {
  if (!Array.isArray(budgetLines)) return [];
  return budgetLines
    .map((line, index) => ({
      category: optionalString(line.category || line.name),
      plannedAmount: optionalNumber(line.plannedAmount) ?? 0,
      actualAmount: optionalNumber(line.actualAmount) ?? 0,
      order: optionalNumber(line.order) ?? index,
    }))
    .filter((line) => line.category);
}

router.get('/', auth, async (req, res) => {
  try {
    const projects = await req.prisma.project.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: projectInclude,
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Laden der Projekte',
      error: error.message,
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      key,
      description,
      color,
      deadline,
      businessArea,
      projectGoal,
      plannedStart,
      plannedEnd,
      deputyLead,
      projectSponsor,
      plannedEffortPt,
      plannedBudget,
      keyInterfaces,
      collaborationQuality,
      reportCycle,
      milestones,
      risks,
      budgetLines,
    } = req.body;

    const trimmedName = normalizeString(name);
    if (!trimmedName) {
      return res.status(400).json({ message: 'Projektname ist erforderlich' });
    }

    const milestoneCreates = buildMilestoneCreates(milestones);
    const riskCreates = buildRiskCreates(risks);
    const budgetLineCreates = buildBudgetLineCreates(budgetLines);

    const project = await req.prisma.project.create({
      data: {
        name: trimmedName,
        key: optionalString(key) || generateProjectKey(trimmedName),
        description: optionalString(description),
        color: optionalString(color),
        deadline: optionalDate(deadline || plannedEnd),
        businessArea: optionalString(businessArea),
        projectGoal: optionalString(projectGoal),
        plannedStart: optionalDate(plannedStart),
        plannedEnd: optionalDate(plannedEnd),
        deputyLead: optionalString(deputyLead),
        projectSponsor: optionalString(projectSponsor),
        plannedEffortPt: optionalNumber(plannedEffortPt),
        plannedBudget: optionalNumber(plannedBudget),
        keyInterfaces: toStringArray(keyInterfaces),
        collaborationQuality: optionalString(collaborationQuality),
        reportCycle: optionalString(reportCycle) || 'MONTHLY',
        ownerId: req.user.id,
        milestones: milestoneCreates.length ? { create: milestoneCreates } : undefined,
        risks: riskCreates.length ? { create: riskCreates } : undefined,
        budgetLines: budgetLineCreates.length ? { create: budgetLineCreates } : undefined,
      },
      include: projectInclude,
    });

    await writeAuditLog(req, {
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      entityLabel: project.name,
      summary: `Projekt ${project.name} wurde erstellt.`,
      severity: 'NOTICE',
      after: {
        ...pickFields(project, [
          'id',
          'name',
          'key',
          'description',
          'ownerId',
          'deadline',
          'businessArea',
          'projectGoal',
          'plannedStart',
          'plannedEnd',
          'deputyLead',
          'projectSponsor',
          'plannedEffortPt',
          'plannedBudget',
          'keyInterfaces',
          'reportCycle',
        ]),
        milestones: project.milestones.length,
        risks: project.risks.length,
        budgetLines: project.budgetLines.length,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Erstellen des Projekts',
      error: error.message,
    });
  }
});

router.put('/:id/reporting', auth, async (req, res) => {
  try {
    const currentProject = await req.prisma.project.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: projectInclude,
    });

    if (!currentProject) {
      return res.status(404).json({ message: 'Projekt wurde nicht gefunden' });
    }

    const milestoneCreates = buildMilestoneCreates(req.body.milestones);
    const riskCreates = buildRiskCreates(req.body.risks);
    const budgetLineCreates = buildBudgetLineCreates(req.body.budgetLines);

    const project = await req.prisma.$transaction(async (prisma) => {
      if (Array.isArray(req.body.milestones)) {
        await prisma.projectMilestone.deleteMany({ where: { projectId: currentProject.id } });
      }
      if (Array.isArray(req.body.risks)) {
        await prisma.projectRisk.deleteMany({ where: { projectId: currentProject.id } });
      }
      if (Array.isArray(req.body.budgetLines)) {
        await prisma.projectBudgetLine.deleteMany({ where: { projectId: currentProject.id } });
      }

      return prisma.project.update({
        where: { id: currentProject.id },
        data: {
          businessArea: optionalString(req.body.businessArea),
          projectGoal: optionalString(req.body.projectGoal),
          plannedStart: optionalDate(req.body.plannedStart),
          plannedEnd: optionalDate(req.body.plannedEnd),
          deadline: optionalDate(req.body.deadline || req.body.plannedEnd),
          deputyLead: optionalString(req.body.deputyLead),
          projectSponsor: optionalString(req.body.projectSponsor),
          plannedEffortPt: optionalNumber(req.body.plannedEffortPt),
          plannedBudget: optionalNumber(req.body.plannedBudget),
          keyInterfaces: toStringArray(req.body.keyInterfaces),
          collaborationQuality: optionalString(req.body.collaborationQuality),
          reportCycle: optionalString(req.body.reportCycle) || currentProject.reportCycle,
          milestones: Array.isArray(req.body.milestones) && milestoneCreates.length ? { create: milestoneCreates } : undefined,
          risks: Array.isArray(req.body.risks) && riskCreates.length ? { create: riskCreates } : undefined,
          budgetLines: Array.isArray(req.body.budgetLines) && budgetLineCreates.length ? { create: budgetLineCreates } : undefined,
        },
        include: projectInclude,
      });
    });

    await writeAuditLog(req, {
      action: 'PROJECT_REPORTING_UPDATED',
      entityType: 'PROJECT',
      entityId: project.id,
      entityLabel: project.name,
      summary: `Berichtsdaten fuer Projekt ${project.name} wurden aktualisiert.`,
      severity: 'NOTICE',
      before: pickFields(currentProject, ['id', 'businessArea', 'projectGoal', 'plannedStart', 'plannedEnd', 'plannedBudget', 'plannedEffortPt']),
      after: pickFields(project, ['id', 'businessArea', 'projectGoal', 'plannedStart', 'plannedEnd', 'plannedBudget', 'plannedEffortPt']),
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Aktualisieren der Berichtsdaten',
      error: error.message,
    });
  }
});

router.post('/:id/status-reports', auth, async (req, res) => {
  try {
    const project = await req.prisma.project.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({ message: 'Projekt wurde nicht gefunden' });
    }

    const statusReport = await req.prisma.projectStatusReport.create({
      data: {
        projectId: project.id,
        authorId: req.user.id,
        reportDate: optionalDate(req.body.reportDate) || new Date(),
        nextMeetingDate: optionalDate(req.body.nextMeetingDate),
        reportingPeriod: optionalString(req.body.reportingPeriod),
        progress: optionalNumber(req.body.progress) ?? 0,
        goalStatus: optionalString(req.body.goalStatus),
        scheduleStatus: optionalString(req.body.scheduleStatus),
        resourceStatus: optionalString(req.body.resourceStatus),
        budgetStatus: optionalString(req.body.budgetStatus),
        progressNote: optionalString(req.body.progressNote),
        goalNote: optionalString(req.body.goalNote),
        scheduleNote: optionalString(req.body.scheduleNote),
        resourceNote: optionalString(req.body.resourceNote),
        budgetNote: optionalString(req.body.budgetNote),
        riskChanges: optionalString(req.body.riskChanges),
        interfaceChanges: optionalString(req.body.interfaceChanges),
        collaborationQuality: optionalString(req.body.collaborationQuality),
        nextSteps: optionalString(req.body.nextSteps),
        actualEffortPt: optionalNumber(req.body.actualEffortPt),
        actualBudget: optionalNumber(req.body.actualBudget),
        versionLabel: optionalString(req.body.versionLabel),
      },
    });

    await writeAuditLog(req, {
      action: 'PROJECT_STATUS_REPORT_CREATED',
      entityType: 'PROJECT_STATUS_REPORT',
      entityId: statusReport.id,
      entityLabel: project.name,
      summary: `Statusbericht fuer Projekt ${project.name} wurde erstellt.`,
      severity: 'NOTICE',
      after: pickFields(statusReport, ['id', 'projectId', 'reportDate', 'reportingPeriod', 'progress', 'goalStatus', 'scheduleStatus', 'resourceStatus', 'budgetStatus']),
    });

    res.status(201).json(statusReport);
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Erstellen des Statusberichts',
      error: error.message,
    });
  }
});

module.exports = router;
