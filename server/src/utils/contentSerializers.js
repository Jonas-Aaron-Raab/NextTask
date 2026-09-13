function toDateInputValue(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function toDisplayDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function serializeDepartment(department) {
  if (!department) return null;

  const members = Array.isArray(department.members)
    ? department.members
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .map((member) => member.name)
    : [];

  return {
    id: department.id,
    code: department.code,
    name: department.name,
    businessArea: department.businessArea,
    lead: department.leadName,
    memberCount: department.memberCount,
    description: department.description,
    accent: department.accent,
    badgeTone: department.badgeTone,
    members,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}

function serializeProject(project) {
  if (!project) return null;

  const latestReport = Array.isArray(project.statusReports) ? project.statusReports[0] : null;
  const actualEffortPt = latestReport?.actualEffortPt ?? null;
  const actualBudget = latestReport?.actualBudget ?? null;

  return {
    id: project.id,
    departmentId: project.departmentId,
    name: project.name,
    key: project.key,
    owner: project.owner?.name || project.ownerName || 'Projektteam',
    deputyLead: project.deputyLead || '',
    projectSponsor: project.projectSponsor || '',
    visibility: project.visibility || 'Abteilung',
    status: project.statusLabel || 'In Arbeit',
    projectType: project.projectType || project.visibility || 'Abteilung',
    businessArea: project.businessArea || project.department?.name || '',
    plannedStart: toDisplayDate(project.plannedStart),
    plannedStartInput: toDateInputValue(project.plannedStart),
    dueDate: toDisplayDate(project.deadline || project.plannedEnd) || 'Noch offen',
    dueDateInput: toDateInputValue(project.deadline || project.plannedEnd),
    summary: project.description || '',
    description: project.description || '',
    projectGoal: project.projectGoal || '',
    plannedEffortPt: project.plannedEffortPt,
    actualEffortPt,
    effortDifferencePt:
      actualEffortPt === null || actualEffortPt === undefined || project.plannedEffortPt === null || project.plannedEffortPt === undefined
        ? null
        : actualEffortPt - project.plannedEffortPt,
    plannedBudget: project.plannedBudget,
    actualBudget,
    reportProgress: latestReport?.progress ?? 0,
    overallStatus: latestReport?.goalStatus || 'Gruen',
    goalStatus: latestReport?.goalStatus || '',
    scheduleStatus: latestReport?.scheduleStatus || '',
    resourceStatus: latestReport?.resourceStatus || '',
    budgetStatus: latestReport?.budgetStatus || '',
    collaborationQuality: latestReport?.collaborationQuality || project.collaborationQuality || '',
    reportNotes: latestReport?.progressNote || '',
    nextSteps: latestReport?.nextSteps || '',
    reportVersion: latestReport?.versionLabel || '',
    keyInterfaces: project.keyInterfaces || [],
    milestones: (project.milestones || []).map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      planDate: toDisplayDate(milestone.planDate),
      planDateInput: toDateInputValue(milestone.planDate),
      newDate: toDisplayDate(milestone.newDate),
      newDateInput: toDateInputValue(milestone.newDate),
      status: milestone.status,
      progress: milestone.progress,
      statusNote: milestone.statusNote || '',
      order: milestone.order,
    })),
    risks: (project.risks || []).map((risk) => ({
      id: risk.id,
      code: risk.code,
      title: risk.title,
      impact: risk.impact,
      probability: risk.probability,
      riskClass: risk.riskClass || '',
      trend: risk.trend || '',
      description: risk.description || '',
      measure: risk.measure || '',
      active: risk.active,
    })),
    budgetLines: (project.budgetLines || []).map((line) => {
      const difference = line.actualAmount - line.plannedAmount;
      return {
        id: line.id,
        category: line.category,
        plannedAmount: line.plannedAmount,
        actualAmount: line.actualAmount,
        difference,
        actualPercent: line.plannedAmount ? Math.round((line.actualAmount / line.plannedAmount) * 100) : null,
        order: line.order,
      };
    }),
    interfaces: (project.interfaces || []).map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      comment: item.comment || '',
      order: item.order,
    })),
    approvals: project.approvals?.[0]
      ? {
          projectResponsible: project.approvals[0].projectResponsible || '',
          gbl: project.approvals[0].gbl || '',
          projectLead: project.approvals[0].projectLead || '',
          approvalDate: toDisplayDate(project.approvals[0].approvalDate),
          approvalDateInput: toDateInputValue(project.approvals[0].approvalDate),
        }
      : null,
    createdAt: project.createdAt,
  };
}

function serializeTask(task) {
  if (!task) return null;

  return {
    ...task,
    project: task.project,
    assignee: task.assignee,
    tags: (task.tags || []).map((tag) => tag.label),
    linkedPeople: (task.personLinks || []).map((person) => person.name),
    attachments: (task.attachments || []).map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      source: attachment.source,
      owner: attachment.owner || '',
      url: attachment.url || '',
    })),
    compliance: task.compliance
      ? {
          classification: task.compliance.classification,
          risk: task.compliance.risk,
          controlId: task.compliance.controlId || '',
          approval: task.compliance.approval || '',
          evidence: task.compliance.evidence || '',
        }
      : null,
    auditTrail: (task.auditEntries || [])
      .sort((left, right) => (left.order || 0) - (right.order || 0))
      .map((entry) => entry.content),
    assignedBy: task.assignmentSource
      ? {
          name: task.assignmentSource.name,
          initials: task.assignmentSource.initials || '',
          tone: task.assignmentSource.tone || '',
        }
      : null,
  };
}

function serializeDocument(document) {
  if (!document) return null;

  return {
    id: document.id,
    title: document.title,
    department: document.department?.name || '',
    departmentId: document.departmentId,
    project: document.project?.name || '',
    projectId: document.projectId,
    type: document.type,
    status: document.status,
    classification: document.classification,
    owner: document.ownerName,
    version: document.version || '',
    reviewDate: toDisplayDate(document.reviewDate),
    reviewDateInput: toDateInputValue(document.reviewDate),
    retention: document.retentionDate
      ? new Intl.DateTimeFormat('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(document.retentionDate))
      : '',
    summary: document.summary,
    linkedTasks: (document.linkedTasks || []).map((link) => link.taskTitle),
    controls: (document.controls || []).map((control) => control.controlId),
    auditTrail: (document.auditEntries || [])
      .sort((left, right) => (left.order || 0) - (right.order || 0))
      .map((entry) => entry.content),
  };
}

module.exports = {
  serializeDepartment,
  serializeDocument,
  serializeProject,
  serializeTask,
  toDateInputValue,
  toDisplayDate,
};
