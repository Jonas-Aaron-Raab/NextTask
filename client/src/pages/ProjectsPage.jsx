/* eslint-disable react-refresh/only-export-components */
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  FolderOpen,
  GripVertical,
  History,
  ListChecks,
  MessageSquareMore,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { bankDepartments, bankProjects } from '../data/bankOrganization';
import {
  effortUnitOptions,
  formatEffort,
  getEffortHoursFromInput,
  getEffortInputValue,
  parseEffortHours,
} from '../utils/effort';
import { getStoredTaskMarkers, getTaskMarker } from '../utils/taskMarkers';
import { initialTasks as sourceTasks } from '../data/taskFixtures';
import {
  initialBacklogTasks,
  initialDepartments,
  initialProjects,
  mergeProjectsWithDefaults,
  projectStorageKey,
} from '../data/projectFixtures';

const bankDepartmentFixtures = bankDepartments.map((department) => ({
  ...department,
  id: `bank-${department.id}`,
  members: [department.lead],
}));

const bankProjectFixtures = bankProjects.map((project) => ({
  id: `bank-${project.id}`,
  departmentId: `bank-${project.departmentId}`,
  name: project.name,
  owner: project.owner,
  visibility: 'Abteilung',
  status: project.status,
  dueDate: project.dueDate,
  summary: project.goal,
}));

const bankBacklogFixtures = bankProjects.flatMap((project) =>
  project.tasks.map((task, index) => ({
    id: `bank-${task.id}`,
    sourceTaskId: null,
    projectId: `bank-${project.id}`,
    title: task.title,
    status: task.status === 'In Arbeit' ? 'progress' : task.status === 'Review' ? 'review' : 'todo',
    priority: task.priority,
    assignee: task.assignee,
    dueDate: project.dueDate,
    estimatedHours: 4 + index,
    tags: [task.status, task.priority],
    description: `${task.title} für ${project.name} bearbeiten und dokumentieren.`,
    controlId: `BANK-${project.id.toUpperCase()}-${index + 1}`,
  })),
);

const createMenuItems = ['Neue Abteilung', 'Neues Projekt'];

const backlogStatusMeta = {
  todo: {
    label: 'To Do',
    tone: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
  progress: {
    label: 'In Arbeit',
    tone: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
  },
  review: {
    label: 'Review',
    tone: 'bg-violet-50 text-violet-700',
    dot: 'bg-violet-500',
  },
  done: {
    label: 'Erledigt',
    tone: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

const priorityMeta = {
  niedrig: 'text-emerald-700 bg-emerald-50',
  mittel: 'text-amber-700 bg-amber-50',
  hoch: 'text-rose-700 bg-rose-50',
};

const attachmentTypeOptions = ['Word', 'Excel', 'PDF', 'Screenshot', 'Notiz'];
const attachmentSourceOptions = ['OneDrive', 'SharePoint', 'DMS', 'Upload'];

function DetailBlock({ title, icon, children, action }) {
  const iconNode = createElement(icon, { className: 'h-4 w-4 text-[#c95767]' });
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          {iconNode}
          {title}
        </h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function getSourceTask(task) {
  return sourceTasks.find((candidate) => candidate.id === task.sourceTaskId) || null;
}

function getSourceTaskKey(task) {
  const sourceTask = getSourceTask(task);
  return task.controlId || sourceTask?.compliance?.controlId || task.sourceTaskId || task.id;
}

function getTaskCreatorInitials(task) {
  if (task.creatorInitials) return task.creatorInitials;
  const sourceTask = getSourceTask(task);
  return sourceTask?.assignedBy?.initials || 'NT';
}

function getTaskCreatorName(task) {
  if (task.creatorName) return task.creatorName;
  const sourceTask = getSourceTask(task);
  return sourceTask?.assignedBy?.name || 'NextTask';
}

function getTaskEffortHours(task) {
  const sourceTask = getSourceTask(task);
  return parseEffortHours(task?.estimatedHours ?? sourceTask?.estimatedHours);
}

function sumTaskEffortHours(tasks) {
  return tasks.reduce((sum, task) => sum + getTaskEffortHours(task), 0);
}

function getTaskDetailCollections(task) {
  const sourceTask = getSourceTask(task);
  return {
    attachments: task.attachments || sourceTask?.attachments || [],
    comments: task.comments || sourceTask?.comments || [],
    linkedPeople: task.linkedPeople || sourceTask?.linkedPeople || [],
    compliance: task.compliance ||
      sourceTask?.compliance || {
        classification: 'Intern',
        risk: 'Niedrig',
        controlId: getSourceTaskKey(task),
        approval: 'Noch kein Freigabeprozess definiert',
        evidence: 'Noch keine Evidenz hinterlegt',
      },
    auditTrail: task.auditTrail || sourceTask?.auditTrail || [`22. Mai 2026: Backlog-Ticket angelegt.`],
  };
}

function getAssigneeLabel(assignee) {
  return assignee?.trim() || 'Ohne Verantwortlichen';
}

function getTaskFavorites(task) {
  return Array.isArray(task.favoriteBy) ? task.favoriteBy : [];
}

function getFavoriteReturnIndexes(task) {
  return task.favoriteReturnIndexBy && typeof task.favoriteReturnIndexBy === 'object' ? task.favoriteReturnIndexBy : {};
}

function isFavoriteForUser(task, userKey) {
  return Boolean(userKey && getTaskFavorites(task).includes(userKey));
}

function toDateInputValue(displayDate) {
  if (!displayDate) return '';
  const monthMap = {
    Januar: '01',
    Februar: '02',
    Maerz: '03',
    April: '04',
    Mai: '05',
    Juni: '06',
    Juli: '07',
    August: '08',
    September: '09',
    Oktober: '10',
    November: '11',
    Dezember: '12',
  };
  const match = displayDate.match(/^(\d{2})\. ([A-Za-z]+) (\d{4})$/);
  if (!match) return '';
  const [, day, monthName, year] = match;
  const month = monthMap[monthName];
  return month ? `${year}-${month}-${day}` : '';
}

function toDisplayDate(inputDate) {
  if (!inputDate) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${inputDate}T00:00:00`));
}

function toSlugPart(value) {
  return String(value || 'custom')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'custom';
}

function normalizeLiveTaskStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'DONE') return 'done';
  if (value === 'QA') return 'review';
  if (value === 'IN_PROGRESS' || value === 'THIS_WEEK') return 'progress';
  return 'todo';
}

function normalizeLiveTaskPriority(priority) {
  const value = String(priority || '').toUpperCase();
  if (value === 'LOW') return 'niedrig';
  if (value === 'HIGH' || value === 'URGENT') return 'hoch';
  return 'mittel';
}

function createLiveDepartment({ id, name, members }) {
  return {
    id,
    name: name || 'Live Projekte',
    lead: 'NextTask',
    members,
    memberCount: members.length || 1,
    description: 'Projektansicht für live geladene Tickets aus dem Backend.',
    accent: 'border-slate-300 bg-[#f7f8ff]',
    badgeTone: 'bg-[#eef2ff] text-[#4f46e5]',
  };
}

function mapApiProjectToProject(project, departmentId, ownerName) {
  return {
    id: project.id,
    departmentId,
    name: project.name || 'Live Projekt',
    owner: ownerName || 'Projektteam',
    visibility: 'Live',
    status: 'In Arbeit',
    dueDate: project.deadline ? toDisplayDate(String(project.deadline).slice(0, 10)) : 'Kein Zieltermin',
    summary: project.description || 'Projekt aus den aktuellen NextTask-Daten.',
  };
}

function mapApiTaskToBacklogTask(task) {
  return {
    id: task.id,
    source: 'api',
    sourceTaskId: null,
    controlId: task.project?.key ? `${task.project.key}-${String(task.id).slice(-4)}` : task.id,
    creatorInitials: 'API',
    creatorName: 'NextTask',
    projectId: task.projectId,
    title: task.title,
    status: normalizeLiveTaskStatus(task.status),
    priority: normalizeLiveTaskPriority(task.priority),
    assignee: task.assignee?.name || '',
    dueDate: task.dueDate ? toDisplayDate(String(task.dueDate).slice(0, 10)) : 'Kein Zieltermin',
    estimatedHours: task.estimatedHours ?? null,
    tags: [task.priority, task.status].filter(Boolean),
    description: task.description || 'Keine Beschreibung hinterlegt.',
    markerId: task.markerId || '',
    comments: Array.isArray(task.comments)
      ? task.comments.map((comment) => ({
          id: comment.id,
          author: comment.author?.name || 'NextTask',
          time: comment.createdAt ? toDisplayDate(String(comment.createdAt).slice(0, 10)) : 'gerade eben',
          text: comment.content,
        }))
      : [],
    linkedPeople: task.assignee?.name ? [task.assignee.name] : [],
    auditTrail: [
      `Live Sync: ${task.updatedAt ? toDisplayDate(String(task.updatedAt).slice(0, 10)) : 'heute'} aktualisiert.`,
      `Ticket ${task.id} aus dem Backend geladen.`,
    ],
  };
}

function getFilterLabel(filterValue) {
  if (filterValue === 'unassigned') return 'Ohne Verantwortlichen';
  if (filterValue.startsWith('person:')) return filterValue.replace('person:', '');
  if (filterValue.startsWith('creator:')) return `Ersteller ${filterValue.replace('creator:', '')}`;
  if (filterValue.startsWith('status:')) return backlogStatusMeta[filterValue.replace('status:', '')]?.label || filterValue;
  if (filterValue.startsWith('priority:')) return `Prio ${filterValue.replace('priority:', '')}`;
  return filterValue;
}

const emptyDepartmentForm = {
  name: '',
  lead: 'Elisabeth Bezverkha',
  memberCount: '4',
  description: '',
};

function createProjectRowId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createMilestoneRow(overrides = {}) {
  return {
    id: createProjectRowId('milestone'),
    title: '',
    planDate: '',
    newDate: '',
    status: 'Offen',
    progress: '0',
    statusNote: '',
    ...overrides,
  };
}

function createRiskRow(overrides = {}) {
  return {
    id: createProjectRowId('risk'),
    code: '',
    title: '',
    impact: '',
    probability: '',
    riskClass: '',
    trend: 'Stabil',
    description: '',
    measure: '',
    ...overrides,
  };
}

function createBudgetRow(overrides = {}) {
  return {
    id: createProjectRowId('budget'),
    category: '',
    plannedAmount: '',
    actualAmount: '',
    ...overrides,
  };
}

function createInterfaceRow(overrides = {}) {
  return {
    id: createProjectRowId('interface'),
    name: '',
    status: 'Offen',
    comment: '',
    ...overrides,
  };
}

const emptyProjectForm = {
  name: '',
  departmentId: initialDepartments[0].id,
  owner: 'Elisabeth Bezverkha',
  deputyLead: '',
  projectSponsor: '',
  visibility: 'Persönlich',
  status: 'In Planung',
  plannedStart: '2026-06-01',
  dueDate: '2026-07-15',
  summary: '',
  projectGoal: '',
  plannedEffortPt: '',
  plannedBudget: '',
  keyInterfaces: '',
  initialMilestones: '',
  initialRisks: '',
  budgetCategories: 'Interne Personalkosten\nExterne Dienstleister',
  reportProgress: '0',
  overallStatus: 'Gruen',
  goalStatus: 'Gruen',
  scheduleStatus: 'Gruen',
  resourceStatus: 'Gruen',
  budgetStatus: 'Gruen',
  collaborationQuality: '',
  reportNotes: '',
  nextSteps: '',
  reportVersion: 'v1',
  actualEffortPt: '',
  milestoneRows: [createMilestoneRow()],
  riskRows: [createRiskRow()],
  budgetRows: [
    createBudgetRow({ category: 'Interne Personalkosten' }),
    createBudgetRow({ category: 'Externe Dienstleister' }),
  ],
  interfaceRows: [createInterfaceRow()],
  projectResponsibleApproval: '',
  gblApproval: '',
  projectLeadApproval: '',
  approvalDate: '',
};

function parseMultilineList(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumberLabel(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'Noch offen';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 'Noch offen';
  return `${new Intl.NumberFormat('de-DE').format(parsed)}${suffix}`;
}

function calculateDifference(plannedValue, actualValue) {
  const planned = parseOptionalNumber(plannedValue) ?? 0;
  const actual = parseOptionalNumber(actualValue) ?? 0;
  return actual - planned;
}

function calculateActualPercent(plannedValue, actualValue) {
  const planned = parseOptionalNumber(plannedValue) ?? 0;
  const actual = parseOptionalNumber(actualValue) ?? 0;
  if (!planned) return null;
  return Math.round((actual / planned) * 100);
}

function ensureRows(rows, createRow) {
  return Array.isArray(rows) && rows.length ? rows : [createRow()];
}

function getStoredProjects() {
  if (typeof window === 'undefined') return initialProjects;
  try {
    const stored = window.localStorage.getItem(projectStorageKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return mergeProjectsWithDefaults(parsed);
  } catch {
    return initialProjects;
  }
}

const germanMonthNumbers = {
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

function formatDateForDisplay(dateValue) {
  if (!dateValue) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
}

function toProjectDateInputValue(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const normalized = String(value).trim().replace(/\.$/, '');
  const numericMatch = normalized.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  if (numericMatch) {
    const [, day, month, year] = numericMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const longMatch = normalized.match(/^(\d{1,2})\.\s*([^\s]+)\s+(\d{4})$/);
  if (longMatch) {
    const [, day, monthName, year] = longMatch;
    const normalizedMonthName = monthName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const month = germanMonthNumbers[normalizedMonthName];
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  return '';
}

function createProjectPayload(projectForm, departments) {
  const targetDepartment = departments.find((department) => department.id === projectForm.departmentId);
  const timestamp = Date.now();
  const interfaceRows = ensureRows(projectForm.interfaceRows, createInterfaceRow)
    .map((row) => ({
      ...row,
      name: row.name?.trim() || '',
      status: row.status || 'Offen',
      comment: row.comment?.trim() || '',
    }))
    .filter((row) => row.name || row.comment);
  const keyInterfaces = interfaceRows.length
    ? interfaceRows.map((row) => row.name).filter(Boolean)
    : parseMultilineList(projectForm.keyInterfaces);
  const milestoneSource = Array.isArray(projectForm.milestoneRows)
    ? projectForm.milestoneRows
    : parseMultilineList(projectForm.initialMilestones).map((title) => createMilestoneRow({ title }));
  const milestones = milestoneSource
    .map((row, index) => ({
      id: row.id || `milestone-${timestamp}-${index}`,
      title: row.title?.trim() || '',
      planDate: formatDateForDisplay(row.planDate),
      planDateInput: row.planDate || '',
      newDate: formatDateForDisplay(row.newDate),
      newDateInput: row.newDate || '',
      status: row.status || 'Offen',
      progress: Math.min(Math.max(parseOptionalNumber(row.progress) ?? 0, 0), 100),
      statusNote: row.statusNote?.trim() || '',
      order: index,
    }))
    .filter((row) => row.title || row.planDate || row.statusNote);
  const riskSource = Array.isArray(projectForm.riskRows)
    ? projectForm.riskRows
    : parseMultilineList(projectForm.initialRisks).map((title, index) => createRiskRow({ code: `R-${index + 1}`, title }));
  const risks = riskSource
    .map((row, index) => ({
      id: row.id || `risk-${timestamp}-${index}`,
      code: row.code?.trim() || `R-${index + 1}`,
      title: row.title?.trim() || '',
      impact: parseOptionalNumber(row.impact),
      probability: parseOptionalNumber(row.probability),
      riskClass: row.riskClass?.trim() || '',
      trend: row.trend || 'Stabil',
      description: row.description?.trim() || '',
      measure: row.measure?.trim() || '',
      active: true,
    }))
    .filter((row) => row.title || row.description || row.measure);
  const budgetSource = Array.isArray(projectForm.budgetRows)
    ? projectForm.budgetRows
    : parseMultilineList(projectForm.budgetCategories).map((category) => createBudgetRow({ category }));
  const budgetLines = budgetSource
    .map((row, index) => {
      const plannedAmount = parseOptionalNumber(row.plannedAmount) ?? 0;
      const actualAmount = parseOptionalNumber(row.actualAmount) ?? 0;
      return {
        id: row.id || `budget-${timestamp}-${index}`,
        category: row.category?.trim() || '',
        plannedAmount,
        actualAmount,
        difference: actualAmount - plannedAmount,
        actualPercent: plannedAmount ? Math.round((actualAmount / plannedAmount) * 100) : null,
        order: index,
      };
    })
    .filter((row) => row.category);
  const formattedPlannedStart = formatDateForDisplay(projectForm.plannedStart);
  const formattedPlannedEnd = formatDateForDisplay(projectForm.dueDate);
  const plannedEffortPt = parseOptionalNumber(projectForm.plannedEffortPt);
  const actualEffortPt = parseOptionalNumber(projectForm.actualEffortPt);

  return {
    departmentId: projectForm.departmentId,
    name: projectForm.name.trim(),
    owner: projectForm.owner.trim() || 'Elisabeth Bezverkha',
    deputyLead: projectForm.deputyLead.trim(),
    projectSponsor: projectForm.projectSponsor.trim(),
    visibility: projectForm.visibility,
    status: projectForm.visibility === 'Persönlich' ? 'Eigene Planung' : 'Abteilungsprojekt',
    dueDate: formattedPlannedEnd || 'Noch offen',
    summary: projectForm.summary.trim() || 'Neu angelegtes Projekt ohne weitere Beschreibung.',
    businessArea: targetDepartment?.name || '',
    projectGoal: projectForm.projectGoal.trim(),
    plannedStart: formattedPlannedStart,
    plannedEnd: formattedPlannedEnd,
    plannedStartInput: projectForm.plannedStart,
    plannedEndInput: projectForm.dueDate,
    plannedEffortPt,
    plannedBudget: parseOptionalNumber(projectForm.plannedBudget),
    keyInterfaces,
    interfaces: interfaceRows,
    milestones,
    risks,
    budgetLines,
    reportProgress: Math.min(Math.max(parseOptionalNumber(projectForm.reportProgress) ?? 0, 0), 100),
    overallStatus: projectForm.overallStatus,
    goalStatus: projectForm.goalStatus,
    scheduleStatus: projectForm.scheduleStatus,
    resourceStatus: projectForm.resourceStatus,
    budgetStatus: projectForm.budgetStatus,
    collaborationQuality: projectForm.collaborationQuality.trim(),
    reportNotes: projectForm.reportNotes.trim(),
    nextSteps: projectForm.nextSteps.trim(),
    reportVersion: projectForm.reportVersion.trim() || 'v1',
    actualEffortPt,
    effortDifferencePt:
      actualEffortPt === null || plannedEffortPt === null
        ? null
        : actualEffortPt - plannedEffortPt,
    approvals: {
      projectResponsible: projectForm.projectResponsibleApproval.trim(),
      gbl: projectForm.gblApproval.trim(),
      projectLead: projectForm.projectLeadApproval.trim(),
      approvalDate: formatDateForDisplay(projectForm.approvalDate),
      approvalDateInput: projectForm.approvalDate,
    },
    reportCycle: 'MONTHLY',
  };
}

function projectToForm(project, fallbackDepartmentId) {
  const milestoneRows = Array.isArray(project.milestones) && project.milestones.length
    ? project.milestones.map((milestone) =>
        createMilestoneRow({
          id: milestone.id,
          title: milestone.title || '',
          planDate: milestone.planDateInput || toProjectDateInputValue(milestone.planDate),
          newDate: milestone.newDateInput || toProjectDateInputValue(milestone.newDate),
          status: milestone.status || 'Offen',
          progress: milestone.progress ?? '0',
          statusNote: milestone.statusNote || '',
        }),
      )
    : parseMultilineList(project.initialMilestones).map((title) => createMilestoneRow({ title }));
  const riskRows = Array.isArray(project.risks) && project.risks.length
    ? project.risks.map((risk) =>
        createRiskRow({
          id: risk.id,
          code: risk.code || '',
          title: risk.title || '',
          impact: risk.impact ?? '',
          probability: risk.probability ?? '',
          riskClass: risk.riskClass || '',
          trend: risk.trend || 'Stabil',
          description: risk.description || '',
          measure: risk.measure || '',
        }),
      )
    : parseMultilineList(project.initialRisks).map((title, index) => createRiskRow({ code: `R-${index + 1}`, title }));
  const budgetRows = Array.isArray(project.budgetLines) && project.budgetLines.length
    ? project.budgetLines.map((line) =>
        createBudgetRow({
          id: line.id,
          category: line.category || '',
          plannedAmount: line.plannedAmount ?? '',
          actualAmount: line.actualAmount ?? '',
        }),
      )
    : parseMultilineList(project.budgetCategories).map((category) => createBudgetRow({ category }));
  const interfaceRows = Array.isArray(project.interfaces) && project.interfaces.length
    ? project.interfaces.map((entry) =>
        createInterfaceRow({
          id: entry.id,
          name: entry.name || '',
          status: entry.status || 'Offen',
          comment: entry.comment || '',
        }),
      )
    : (Array.isArray(project.keyInterfaces) ? project.keyInterfaces : []).map((name) => createInterfaceRow({ name }));

  return {
    ...emptyProjectForm,
    name: project.name || '',
    departmentId: project.departmentId || fallbackDepartmentId || '',
    owner: project.owner || 'Elisabeth Bezverkha',
    deputyLead: project.deputyLead || '',
    projectSponsor: project.projectSponsor || '',
    visibility: project.visibility || 'Persönlich',
    status: project.status || 'In Planung',
    plannedStart: project.plannedStartInput || toProjectDateInputValue(project.plannedStart),
    dueDate: project.plannedEndInput || toProjectDateInputValue(project.plannedEnd || project.dueDate),
    summary: project.summary || '',
    projectGoal: project.projectGoal || '',
    plannedEffortPt: project.plannedEffortPt ?? '',
    plannedBudget: project.plannedBudget ?? '',
    keyInterfaces: Array.isArray(project.keyInterfaces) ? project.keyInterfaces.join('\n') : '',
    initialMilestones: Array.isArray(project.milestones) ? project.milestones.map((milestone) => milestone.title).join('\n') : '',
    initialRisks: Array.isArray(project.risks) ? project.risks.map((risk) => risk.title).join('\n') : '',
    budgetCategories: Array.isArray(project.budgetLines) && project.budgetLines.length
      ? project.budgetLines.map((line) => line.category).join('\n')
      : emptyProjectForm.budgetCategories,
    reportProgress: project.reportProgress ?? '0',
    overallStatus: project.overallStatus || 'Gruen',
    goalStatus: project.goalStatus || 'Gruen',
    scheduleStatus: project.scheduleStatus || 'Gruen',
    resourceStatus: project.resourceStatus || 'Gruen',
    budgetStatus: project.budgetStatus || 'Gruen',
    collaborationQuality: project.collaborationQuality || '',
    reportNotes: project.reportNotes || '',
    nextSteps: project.nextSteps || '',
    reportVersion: project.reportVersion || 'v1',
    actualEffortPt: project.actualEffortPt ?? '',
    milestoneRows: ensureRows(milestoneRows, createMilestoneRow),
    riskRows: ensureRows(riskRows, createRiskRow),
    budgetRows: ensureRows(budgetRows, createBudgetRow),
    interfaceRows: ensureRows(interfaceRows, createInterfaceRow),
    projectResponsibleApproval: project.approvals?.projectResponsible || '',
    gblApproval: project.approvals?.gbl || '',
    projectLeadApproval: project.approvals?.projectLead || '',
    approvalDate: project.approvals?.approvalDateInput || toProjectDateInputValue(project.approvals?.approvalDate),
  };
}

function PopupShell({ title, subtitle, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <section className={`w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ${maxWidth}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Popup schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

function CreateDepartmentModal({ form, onChange, onClose, onSubmit }) {
  return (
    <PopupShell title="Neue Abteilung" subtitle="Lege einen neuen Bereich an, in dem später eigene Projekte organisiert werden." maxWidth="max-w-3xl" onClose={onClose}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Abteilungsname
            <input
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Beschreibung
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Bereichsleitung
            <input
              value={form.lead}
              onChange={(event) => onChange('lead', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Teamgroesse
            <input
              value={form.memberCount}
              onChange={(event) => onChange('memberCount', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
          Abbrechen
        </button>
        <button type="button" onClick={onSubmit} className="h-11 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]">
          Abteilung anlegen
        </button>
      </div>
    </PopupShell>
  );
}

export function CreateProjectModal({
  departments,
  form,
  onChange,
  onClose,
  onSubmit,
  title = 'Neues Projekt',
  subtitle = 'Lege Stammdaten an, die später direkt für Statusberichte genutzt werden.',
  submitLabel = 'Projekt anlegen',
}) {
  const [activeTab, setActiveTab] = useState('basis');
  const inputClass = 'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10';
  const textareaClass = 'mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10';
  const compactInputClass = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10';
  const tabs = [
    { id: 'basis', label: 'Projektbasis', icon: FileText },
    { id: 'status', label: 'Status', icon: ShieldCheck },
    { id: 'milestones', label: 'Meilensteine', icon: ListChecks },
    { id: 'risks', label: 'Risiken', icon: Tag },
    { id: 'budget', label: 'Budget & Ressourcen', icon: CalendarDays },
    { id: 'interfaces', label: 'Schnittstellen & Freigabe', icon: UserPlus },
  ];
  const rowFactories = {
    milestoneRows: createMilestoneRow,
    riskRows: createRiskRow,
    budgetRows: createBudgetRow,
    interfaceRows: createInterfaceRow,
  };
  const statusOptions = ['Gruen', 'Gelb', 'Rot'];
  const milestoneStatusOptions = ['Offen', 'In Arbeit', 'Erreicht', 'Gefährdet', 'Verschoben'];
  const trendOptions = ['Steigend', 'Stabil', 'Fallend', 'Neu'];
  const interfaceStatusOptions = ['Offen', 'In Klärung', 'Abgestimmt', 'Blockiert'];

  const rowsFor = (field) => ensureRows(form[field], rowFactories[field]);
  const updateRow = (field, rowId, key, value) => {
    onChange(
      field,
      rowsFor(field).map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  };
  const addRow = (field) => onChange(field, [...rowsFor(field), rowFactories[field]()]);
  const removeRow = (field, rowId) => {
    const nextRows = rowsFor(field).filter((row) => row.id !== rowId);
    onChange(field, nextRows.length ? nextRows : [rowFactories[field]()]);
  };

  const renderRowAction = (field, rowId, label) => (
    <button
      type="button"
      onClick={() => removeRow(field, rowId)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-[#d89aa5] hover:bg-[#fff7f8] hover:text-[#a23d4d]"
      aria-label={label}
      title={label}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );

  return (
    <PopupShell title={title} subtitle={subtitle} maxWidth="max-w-5xl" onClose={onClose}>
      <div className="mb-5 grid grid-cols-2 gap-2 border-b border-slate-200 pb-4 md:grid-cols-3 xl:grid-cols-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition ${
                isActive
                  ? 'bg-[#fff1f3] text-[#a23d4d] shadow-[0_8px_18px_rgba(136,54,66,0.08)]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="max-h-[calc(100vh-17rem)] overflow-y-auto pr-1">
        {activeTab === 'basis' ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#c95767]" />
              <p className="text-sm font-extrabold text-slate-900">Projektbasis</p>
            </div>

            <label className="block text-sm font-bold text-slate-700">
              Projektname
              <input value={form.name} onChange={(event) => onChange('name', event.target.value)} className={inputClass} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                Abteilung
                <select value={form.departmentId} onChange={(event) => onChange('departmentId', event.target.value)} className={inputClass}>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Projektart
                <select value={form.visibility} onChange={(event) => onChange('visibility', event.target.value)} className={inputClass}>
                  <option value="Persönlich">Persönlich</option>
                  <option value="Abteilung">Abteilung</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-bold text-slate-700">
                Projektleitung
                <input value={form.owner} onChange={(event) => onChange('owner', event.target.value)} className={inputClass} />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Stellvertretung
                <input value={form.deputyLead} onChange={(event) => onChange('deputyLead', event.target.value)} placeholder="Optional" className={inputClass} />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Verantwortlicher / GBL
                <input value={form.projectSponsor} onChange={(event) => onChange('projectSponsor', event.target.value)} placeholder="Optional" className={inputClass} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                Beginn Plan
                <input type="date" value={form.plannedStart} onChange={(event) => onChange('plannedStart', event.target.value)} className={inputClass} />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Ende Plan
                <input type="date" value={form.dueDate} onChange={(event) => onChange('dueDate', event.target.value)} className={inputClass} />
              </label>
            </div>

            <label className="block text-sm font-bold text-slate-700">
              Projektbeschreibung
              <textarea value={form.summary} onChange={(event) => onChange('summary', event.target.value)} rows={5} className={textareaClass} />
            </label>
          </section>
        ) : null}

        {activeTab === 'status' ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#c95767]" />
              <p className="text-sm font-extrabold text-slate-900">Status & Bericht</p>
            </div>

            <label className="block text-sm font-bold text-slate-700">
              Projektziel
              <textarea value={form.projectGoal} onChange={(event) => onChange('projectGoal', event.target.value)} rows={4} placeholder="Kurz formuliertes Ziel für Statusberichte" className={textareaClass} />
            </label>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <label className="block text-sm font-bold text-slate-700">
                Fortschritt %
                <input type="number" min="0" max="100" value={form.reportProgress} onChange={(event) => onChange('reportProgress', event.target.value)} className={inputClass} />
              </label>
              {[
                ['overallStatus', 'Gesamtstatus'],
                ['goalStatus', 'Ziel'],
                ['scheduleStatus', 'Termine'],
                ['resourceStatus', 'Ressourcen'],
                ['budgetStatus', 'Budget'],
              ].map(([field, label]) => (
                <label key={field} className="block text-sm font-bold text-slate-700">
                  {label}
                  <select value={form[field]} onChange={(event) => onChange(field, event.target.value)} className={inputClass}>
                    {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block text-sm font-bold text-slate-700">
                Qualitaet der Zusammenarbeit
                <textarea value={form.collaborationQuality} onChange={(event) => onChange('collaborationQuality', event.target.value)} rows={5} className={textareaClass} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Erläuterungen / Maßnahmen
                <textarea value={form.reportNotes} onChange={(event) => onChange('reportNotes', event.target.value)} rows={5} className={textareaClass} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Nächste Schritte
                <textarea value={form.nextSteps} onChange={(event) => onChange('nextSteps', event.target.value)} rows={5} className={textareaClass} />
              </label>
            </div>

            <label className="block max-w-xs text-sm font-bold text-slate-700">
              Berichtsversion / Stand
              <input value={form.reportVersion} onChange={(event) => onChange('reportVersion', event.target.value)} className={inputClass} />
            </label>
          </section>
        ) : null}

        {activeTab === 'milestones' ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-[#c95767]" />
                <p className="text-sm font-extrabold text-slate-900">Meilensteine</p>
              </div>
              <button type="button" onClick={() => addRow('milestoneRows')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#c95767] px-3 text-sm font-bold text-white">
                <Plus className="h-4 w-4" />
                Meilenstein
              </button>
            </div>

            <div className="space-y-3">
              {rowsFor('milestoneRows').map((row) => (
                <div key={row.id} className="grid gap-3 rounded-2xl border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] xl:grid-cols-[minmax(220px,1.4fr)_150px_150px_150px_120px_minmax(220px,1fr)_44px]">
                  <input value={row.title} onChange={(event) => updateRow('milestoneRows', row.id, 'title', event.target.value)} placeholder="Meilenstein" className={compactInputClass} />
                  <input type="date" value={row.planDate} onChange={(event) => updateRow('milestoneRows', row.id, 'planDate', event.target.value)} className={compactInputClass} />
                  <input type="date" value={row.newDate} onChange={(event) => updateRow('milestoneRows', row.id, 'newDate', event.target.value)} className={compactInputClass} />
                  <select value={row.status} onChange={(event) => updateRow('milestoneRows', row.id, 'status', event.target.value)} className={compactInputClass}>
                    {milestoneStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <input type="number" min="0" max="100" value={row.progress} onChange={(event) => updateRow('milestoneRows', row.id, 'progress', event.target.value)} placeholder="%" className={compactInputClass} />
                  <input value={row.statusNote} onChange={(event) => updateRow('milestoneRows', row.id, 'statusNote', event.target.value)} placeholder="Statusnotiz" className={compactInputClass} />
                  {renderRowAction('milestoneRows', row.id, 'Meilenstein entfernen')}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'risks' ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#c95767]" />
                <p className="text-sm font-extrabold text-slate-900">Risiken</p>
              </div>
              <button type="button" onClick={() => addRow('riskRows')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#c95767] px-3 text-sm font-bold text-white">
                <Plus className="h-4 w-4" />
                Risiko
              </button>
            </div>

            <div className="space-y-3">
              {rowsFor('riskRows').map((row) => (
                <div key={row.id} className="rounded-2xl border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                  <div className="grid gap-3 xl:grid-cols-[100px_minmax(220px,1.2fr)_120px_120px_150px_140px_44px]">
                    <input value={row.code} onChange={(event) => updateRow('riskRows', row.id, 'code', event.target.value)} placeholder="Kürzel" className={compactInputClass} />
                    <input value={row.title} onChange={(event) => updateRow('riskRows', row.id, 'title', event.target.value)} placeholder="Bezeichnung" className={compactInputClass} />
                    <input type="number" min="0" value={row.impact} onChange={(event) => updateRow('riskRows', row.id, 'impact', event.target.value)} placeholder="Tragweite" className={compactInputClass} />
                    <input type="number" min="0" value={row.probability} onChange={(event) => updateRow('riskRows', row.id, 'probability', event.target.value)} placeholder="Wahrscheinlichkeit" className={compactInputClass} />
                    <input value={row.riskClass} onChange={(event) => updateRow('riskRows', row.id, 'riskClass', event.target.value)} placeholder="Risikoklasse" className={compactInputClass} />
                    <select value={row.trend} onChange={(event) => updateRow('riskRows', row.id, 'trend', event.target.value)} className={compactInputClass}>
                      {trendOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    {renderRowAction('riskRows', row.id, 'Risiko entfernen')}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <textarea value={row.description} onChange={(event) => updateRow('riskRows', row.id, 'description', event.target.value)} rows={3} placeholder="Beschreibung" className={textareaClass} />
                    <textarea value={row.measure} onChange={(event) => updateRow('riskRows', row.id, 'measure', event.target.value)} rows={3} placeholder="Massnahme" className={textareaClass} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'budget' ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#c95767]" />
                <p className="text-sm font-extrabold text-slate-900">Budget & Ressourcen</p>
              </div>
              <button type="button" onClick={() => addRow('budgetRows')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#c95767] px-3 text-sm font-bold text-white">
                <Plus className="h-4 w-4" />
                Budgetzeile
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-bold text-slate-700">
                Planaufwand (PT)
                <input type="number" min="0" value={form.plannedEffortPt} onChange={(event) => onChange('plannedEffortPt', event.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Ist-Aufwand (PT)
                <input type="number" min="0" value={form.actualEffortPt} onChange={(event) => onChange('actualEffortPt', event.target.value)} className={inputClass} />
              </label>
              <div className="rounded-2xl border border-white bg-white p-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Differenz PT</p>
                <p className="mt-2 text-lg font-extrabold text-slate-900">{formatNumberLabel(calculateDifference(form.plannedEffortPt, form.actualEffortPt), ' PT')}</p>
              </div>
            </div>

            <label className="block max-w-sm text-sm font-bold text-slate-700">
              Planbudget gesamt (EUR)
              <input type="number" min="0" value={form.plannedBudget} onChange={(event) => onChange('plannedBudget', event.target.value)} className={inputClass} />
            </label>

            <div className="space-y-3">
              {rowsFor('budgetRows').map((row) => (
                <div key={row.id} className="grid gap-3 rounded-2xl border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] xl:grid-cols-[minmax(220px,1.4fr)_160px_160px_150px_110px_44px]">
                  <input value={row.category} onChange={(event) => updateRow('budgetRows', row.id, 'category', event.target.value)} placeholder="Kosten-Kategorie" className={compactInputClass} />
                  <input type="number" min="0" value={row.plannedAmount} onChange={(event) => updateRow('budgetRows', row.id, 'plannedAmount', event.target.value)} placeholder="Plan" className={compactInputClass} />
                  <input type="number" min="0" value={row.actualAmount} onChange={(event) => updateRow('budgetRows', row.id, 'actualAmount', event.target.value)} placeholder="Ist" className={compactInputClass} />
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-700">{formatNumberLabel(calculateDifference(row.plannedAmount, row.actualAmount), ' EUR')}</div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-700">{calculateActualPercent(row.plannedAmount, row.actualAmount) ?? 0}%</div>
                  {renderRowAction('budgetRows', row.id, 'Budgetzeile entfernen')}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'interfaces' ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#c95767]" />
                <p className="text-sm font-extrabold text-slate-900">Schnittstellen & Freigabe</p>
              </div>
              <button type="button" onClick={() => addRow('interfaceRows')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#c95767] px-3 text-sm font-bold text-white">
                <Plus className="h-4 w-4" />
                Schnittstelle
              </button>
            </div>

            <div className="space-y-3">
              {rowsFor('interfaceRows').map((row) => (
                <div key={row.id} className="grid gap-3 rounded-2xl border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] xl:grid-cols-[minmax(220px,1fr)_160px_minmax(240px,1.2fr)_44px]">
                  <input value={row.name} onChange={(event) => updateRow('interfaceRows', row.id, 'name', event.target.value)} placeholder="Schnittstelle" className={compactInputClass} />
                  <select value={row.status} onChange={(event) => updateRow('interfaceRows', row.id, 'status', event.target.value)} className={compactInputClass}>
                    {interfaceStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <input value={row.comment} onChange={(event) => updateRow('interfaceRows', row.id, 'comment', event.target.value)} placeholder="Kommentar" className={compactInputClass} />
                  {renderRowAction('interfaceRows', row.id, 'Schnittstelle entfernen')}
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block text-sm font-bold text-slate-700">
                Projektverantwortlicher
                <input value={form.projectResponsibleApproval} onChange={(event) => onChange('projectResponsibleApproval', event.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                GBL-Freigabe
                <input value={form.gblApproval} onChange={(event) => onChange('gblApproval', event.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Projektleiter-Freigabe
                <input value={form.projectLeadApproval} onChange={(event) => onChange('projectLeadApproval', event.target.value)} className={inputClass} />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Freigabedatum
                <input type="date" value={form.approvalDate} onChange={(event) => onChange('approvalDate', event.target.value)} className={inputClass} />
              </label>
            </div>
          </section>
        ) : null}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
          Abbrechen
        </button>
        <button type="button" onClick={onSubmit} className="h-11 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]">
          {submitLabel}
        </button>
      </div>
    </PopupShell>
  );
}

function DepartmentCard({ department, projectCount, effortHours, effortUnit, isActive, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(department.id)}
      className={`h-full min-h-[208px] min-w-0 overflow-hidden rounded-[1.5rem] border p-3.5 text-left shadow-[0_10px_26px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${department.accent} ${
        isActive ? 'ring-4 ring-[#c95767]/12' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#b84758] shadow-[0_8px_18px_rgba(184,71,88,0.10)]">
          <Building2 className="h-4.5 w-4.5" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${department.badgeTone}`}>{projectCount} Projekte</span>
      </div>

      <h2 className="mt-3.5 break-all text-[1.55rem] font-extrabold leading-tight text-slate-950">{department.name}</h2>

      <div className="mt-3.5 grid gap-2 text-[11px] font-bold text-slate-500 sm:grid-cols-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
          <Users className="h-3.5 w-3.5" />
          {department.memberCount} Personen
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="truncate">{department.lead}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 sm:col-span-2">
          <Clock3 className="h-3.5 w-3.5" />
          {formatEffort(effortHours, effortUnit)}
        </span>
      </div>
    </button>
  );
}

function ProjectCard({ project, effortHours, effortUnit, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="h-full rounded-2xl border border-slate-300 bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_16px_34px_rgba(136,54,66,0.10)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold leading-tight text-slate-950">{project.name}</h3>
        </div>
        <span className="rounded-full bg-[#fff0f2] px-2.5 py-1 text-[11px] font-bold text-[#b84758]">{project.visibility}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{project.status}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {project.dueDate}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{project.owner}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0f2] px-2.5 py-1 text-[#b84758]">
          <Clock3 className="h-3.5 w-3.5" />
          {formatEffort(effortHours, effortUnit)}
        </span>
      </div>

      {project.projectSponsor || project.plannedBudget || project.plannedEffortPt ? (
        <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500 sm:grid-cols-3">
          <span className="truncate rounded-xl bg-slate-50 px-2.5 py-2">{project.projectSponsor || 'GBL offen'}</span>
          <span className="rounded-xl bg-slate-50 px-2.5 py-2">{formatNumberLabel(project.plannedEffortPt, ' PT')}</span>
          <span className="rounded-xl bg-slate-50 px-2.5 py-2">{formatNumberLabel(project.plannedBudget, ' EUR')}</span>
        </div>
      ) : null}
    </button>
  );
}

function ProjectReportOverview({ project }) {
  const hasReportData =
    project.projectGoal ||
    project.deputyLead ||
    project.projectSponsor ||
    project.plannedStart ||
    project.plannedEnd ||
    project.plannedEffortPt ||
    project.plannedBudget ||
    project.keyInterfaces?.length ||
    project.milestones?.length ||
    project.risks?.length ||
    project.budgetLines?.length;

  if (!hasReportData) return null;

  const reportFacts = [
    { label: 'Projektleitung', value: project.owner },
    { label: 'Stellvertretung', value: project.deputyLead || 'Noch offen' },
    { label: 'Verantwortlicher / GBL', value: project.projectSponsor || 'Noch offen' },
    { label: 'Beginn Plan', value: project.plannedStart || 'Noch offen' },
    { label: 'Ende Plan', value: project.plannedEnd || project.dueDate || 'Noch offen' },
    { label: 'Planaufwand', value: formatNumberLabel(project.plannedEffortPt, ' PT') },
    { label: 'Planbudget', value: formatNumberLabel(project.plannedBudget, ' EUR') },
  ];

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Berichtsbasis</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Stammdaten für Statusbericht, Ressourcen, Budget, Risiken und Meilensteine.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">{project.reportCycle || 'MONTHLY'}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reportFacts.map((fact) => (
          <div key={fact.label} className="rounded-2xl border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{fact.label}</p>
            <p className="mt-1 truncate text-sm font-extrabold text-slate-900">{fact.value}</p>
          </div>
        ))}
      </div>

      {project.projectGoal ? (
        <p className="mt-4 rounded-2xl border border-white bg-white p-3 text-sm font-semibold leading-relaxed text-slate-600">{project.projectGoal}</p>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-white bg-white p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Schnittstellen</p>
          <p className="mt-2 text-sm font-bold text-slate-700">{project.keyInterfaces?.length ? project.keyInterfaces.join(', ') : 'Noch offen'}</p>
        </div>
        <div className="rounded-2xl border border-white bg-white p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Meilensteine</p>
          <p className="mt-2 text-sm font-bold text-slate-700">{project.milestones?.length || 0} Einträge</p>
        </div>
        <div className="rounded-2xl border border-white bg-white p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Risiken</p>
          <p className="mt-2 text-sm font-bold text-slate-700">{project.risks?.length || 0} Einträge</p>
        </div>
      </div>

    </div>
  );
}

function BacklogTaskRow({ task, project, effortUnit, isActive, isFavorite, onOpen, onToggleFavorite, dragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: dragDisabled,
  });
  const status = backlogStatusMeta[task.status] || backlogStatusMeta.todo;
  const taskKey = getSourceTaskKey(task);
  const creatorInitials = getTaskCreatorInitials(task);
  const creatorName = getTaskCreatorName(task);
  const marker = getTaskMarker(task);
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen(task.id);
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative grid w-full grid-cols-[36px_36px_minmax(0,1fr)_36px] items-center gap-3 overflow-hidden border-t border-slate-100 py-3 pl-5 pr-4 text-left text-sm transition hover:bg-[#fff1f3] lg:grid-cols-[36px_36px_minmax(94px,0.6fr)_minmax(0,2.4fr)_72px_120px_88px_92px_minmax(130px,0.9fr)_36px] ${
        isActive ? 'bg-[#fff1f3]' : 'bg-white'
      } ${isDragging ? 'relative z-10 opacity-70 shadow-[0_18px_34px_rgba(15,23,42,0.16)]' : ''}`}
      title={marker.label}
    >
      <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: marker.color }} aria-hidden="true" />
      <span
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition ${
          dragDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing'
        }`}
        title={dragDisabled ? 'Sortieren ist bei aktiver Suche oder Filterung deaktiviert' : 'Ticket verschieben'}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(task.id);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          onToggleFavorite(task.id);
        }}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition ${
          isFavorite
            ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
            : 'text-slate-300 hover:bg-slate-100 hover:text-amber-500'
        }`}
        title={isFavorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'}
      >
        <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <span className="hidden font-bold text-slate-500 lg:block">{taskKey}</span>
      <span className="min-w-0">
        <span className="mb-1 block font-bold leading-5 text-slate-900 lg:hidden">{taskKey}</span>
        <span className="block whitespace-normal break-words font-bold leading-5 text-slate-900">{task.title}</span>
        <span className="mt-1 block whitespace-normal break-words text-xs font-semibold text-slate-400">{project?.name || 'Projekt'}</span>
      </span>
      <span
        className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#f0edff] text-[11px] font-extrabold text-[#6d5df6] lg:inline-flex"
        title={`Erstellt von ${creatorName}`}
      >
        {creatorInitials}
      </span>
      <span className={`hidden w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold lg:inline-flex ${status.tone}`}>
        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
        {status.label}
      </span>
      <span className={`hidden w-max rounded-full px-2.5 py-1 text-xs font-bold lg:inline-flex ${priorityMeta[task.priority] || priorityMeta.mittel}`}>
        {task.priority}
      </span>
      <span className="hidden w-max items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 lg:inline-flex">
        <Clock3 className="h-3.5 w-3.5" />
        {formatEffort(getTaskEffortHours(task), effortUnit)}
      </span>
      <span className="hidden min-w-0 items-center gap-2 text-xs font-bold text-slate-600 lg:inline-flex">
        <UserRound className="h-3.5 w-3.5 flex-none text-slate-400" />
        <span className="whitespace-normal break-words">{getAssigneeLabel(task.assignee)}</span>
      </span>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400">
        <MoreHorizontal className="h-4 w-4" />
      </span>
    </div>
  );
}

function BacklogProjectGroup({ project, tasks, effortUnit, selectedTaskId, favoriteUserKey, onOpenTask, onToggleFavorite, dragDisabled }) {
  const openEffortHours = sumTaskEffortHours(tasks.filter((task) => task.status !== 'done'));
  const completedEffortHours = sumTaskEffortHours(tasks.filter((task) => task.status === 'done'));

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-extrabold text-slate-950">{project.name}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{formatEffort(openEffortHours, effortUnit)} offen</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">{project.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1">{formatEffort(completedEffortHours, effortUnit)} erledigt</span>
        </div>
      </div>

      <div className="hidden w-full grid-cols-[36px_36px_minmax(94px,0.6fr)_minmax(0,2.4fr)_72px_120px_88px_92px_minmax(130px,0.9fr)_36px] gap-3 bg-[#fff1f3] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#b84758] lg:grid">
        <span />
        <span />
        <span>Key</span>
        <span>Aufgabe</span>
        <span>Erstellt</span>
        <span>Status</span>
        <span>Prio</span>
        <span>Aufwand</span>
        <span>Verantwortlich</span>
        <span />
      </div>

      <div>
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <BacklogTaskRow
              key={task.id}
              task={task}
              project={project}
              effortUnit={effortUnit}
              isActive={selectedTaskId === task.id}
              isFavorite={isFavoriteForUser(task, favoriteUserKey)}
              onOpen={onOpenTask}
              onToggleFavorite={onToggleFavorite}
              dragDisabled={dragDisabled}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

function TaskMarkerField({ value, markers, onChange }) {
  const selectedMarker = markers.find((marker) => marker.id === value) || null;

  return (
    <label className="block text-sm font-bold text-slate-700">
      Farbstreifen
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <select
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
        >
          <option value="">Automatisch nach Regel</option>
          {markers.map((marker) => (
            <option key={marker.id} value={marker.id}>
              {marker.label}
            </option>
          ))}
        </select>
        <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-600">
          <span
            className="h-5 w-5 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: selectedMarker?.color || '#cbd5e1' }}
            aria-hidden="true"
          />
          {selectedMarker ? selectedMarker.label : 'Auto'}
        </span>
      </div>
    </label>
  );
}
function createBacklogTaskForm(task) {
  const { compliance } = getTaskDetailCollections(task);
  return {
    controlId: getSourceTaskKey(task),
    creatorInitials: getTaskCreatorInitials(task),
    creatorName: getTaskCreatorName(task),
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    status: task.status,
    priority: task.priority,
    markerId: task.markerId || '',
    dueDateValue: toDateInputValue(task.dueDate),
    estimatedHours: getTaskEffortHours(task) || '',
    assignee: task.assignee,
    tags: task.tags.join(', '),
    classification: compliance.classification,
    risk: compliance.risk,
    approval: compliance.approval,
    evidence: compliance.evidence,
  };
}

function BacklogDetailPanel({ task, projects, assignees, assigneeWorkloads, effortUnit, taskMarkers, onSave, onClose }) {
  const [form, setForm] = useState(() => (task ? createBacklogTaskForm(task) : null));
  const [commentDraft, setCommentDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [personDraft, setPersonDraft] = useState(assignees[0] || '');
  const [attachmentType, setAttachmentType] = useState(attachmentTypeOptions[0]);
  const [attachmentSource, setAttachmentSource] = useState(attachmentSourceOptions[0]);
  const [approvalRequestStatus, setApprovalRequestStatus] = useState('');
  const [approvalRequestError, setApprovalRequestError] = useState('');

  if (!task) {
    return null;
  }

  if (!form) return null;

  const status = backlogStatusMeta[task.status] || backlogStatusMeta.todo;
  const taskKey = getSourceTaskKey(task);
  const { attachments, comments, linkedPeople, auditTrail } = getTaskDetailCollections(task);
  const selectedAssigneeWorkload = assigneeWorkloads.get(form.assignee);
  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const updateTask = (updates, auditText) => {
    onSave(task.id, {
      ...updates,
      auditTrail: auditText ? [`22. Mai 2026: ${auditText}`, ...auditTrail] : auditTrail,
    });
  };
  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(task.id, {
      controlId: form.controlId.trim() || task.id,
      creatorInitials: form.creatorInitials.trim() || 'NT',
      creatorName: form.creatorName.trim() || 'NextTask',
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: form.projectId,
      status: form.status,
      priority: form.priority,
      markerId: form.markerId || undefined,
      dueDate: toDisplayDate(form.dueDateValue) || task.dueDate,
      estimatedHours: form.estimatedHours === '' ? null : Number(form.estimatedHours),
      assignee: form.assignee,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      compliance: {
        classification: form.classification,
        risk: form.risk,
        controlId: form.controlId.trim() || task.id,
        approval: form.approval.trim(),
        evidence: form.evidence.trim(),
      },
      auditTrail: [`22. Mai 2026: Ticketdetails aktualisiert.`, ...auditTrail],
    });
  };
  const handleTagAdd = () => {
    const nextTag = tagDraft.trim();
    if (!nextTag || task.tags.includes(nextTag)) return;
    const nextTags = [...task.tags, nextTag];
    setTagDraft('');
    setForm((current) => ({ ...current, tags: nextTags.join(', ') }));
    updateTask({ tags: nextTags }, `Tag "${nextTag}" hinzugefuegt.`);
  };
  const handleTagRemove = (tagToRemove) => {
    const nextTags = task.tags.filter((tag) => tag !== tagToRemove);
    setForm((current) => ({ ...current, tags: nextTags.join(', ') }));
    updateTask({ tags: nextTags }, `Tag "${tagToRemove}" entfernt.`);
  };
  const handlePersonAdd = () => {
    if (!personDraft || linkedPeople.includes(personDraft)) return;
    updateTask({ linkedPeople: [...linkedPeople, personDraft] }, `Mitarbeitende Person "${personDraft}" verlinkt.`);
  };
  const handlePersonRemove = (personToRemove) => {
    updateTask(
      { linkedPeople: linkedPeople.filter((person) => person !== personToRemove) },
      `Mitarbeitende Person "${personToRemove}" entfernt.`,
    );
  };
  const handleCommentSubmit = () => {
    const text = commentDraft.trim();
    if (!text) return;
    setCommentDraft('');
    updateTask(
      {
        comments: [
          ...comments,
          {
            id: `comment-${comments.length + 1}`,
            author: form.creatorName || 'NextTask',
            time: 'gerade eben',
            text,
          },
        ],
      },
      'Kommentar hinzugefügt.',
    );
  };
  const handleMentionInsert = (person) => {
    setCommentDraft((current) => `${current}${current ? ' ' : ''}@${person} `);
  };
  const handleAttachmentFilesAdd = (files) => {
    const nextFiles = Array.from(files || []);
    if (!nextFiles.length) return;
    updateTask(
      {
        attachments: [
          ...attachments,
          ...nextFiles.map((file, index) => ({
            id: `attachment-${attachments.length + index + 1}-${file.name}`,
            name: file.name,
            type: attachmentType,
            source: attachmentSource,
            owner: form.assignee || form.creatorName || 'NextTask',
          })),
        ],
      },
      `${nextFiles.length} Datei(en) als Evidenz verknüpft.`,
    );
  };
  const handleAttachmentRemove = (attachmentId) => {
    updateTask(
      { attachments: attachments.filter((attachment) => attachment.id !== attachmentId) },
      'Eine Evidenzdatei entfernt.',
    );
  };
  const handleApprovalRequest = async () => {
    setApprovalRequestStatus('');
    setApprovalRequestError('');
    try {
      await api.post('/approvals', {
        entityType: 'OTHER',
        entityId: task.id,
        entityLabel: task.title,
        title: `Freigabe: ${form.title.trim() || task.title}`,
        description: form.approval.trim() || form.description.trim(),
        evidence: form.evidence.trim(),
      });
      setApprovalRequestStatus('Freigabe wurde im Cockpit angefragt.');
      updateTask(
        {
          compliance: {
            classification: form.classification,
            risk: form.risk,
            controlId: form.controlId.trim() || task.id,
            approval: form.approval.trim() || 'Freigabe angefragt',
            evidence: form.evidence.trim(),
          },
        },
        'Freigabe im Cockpit angefragt.',
      );
    } catch (requestError) {
      setApprovalRequestError(requestError.response?.data?.message || 'Freigabe konnte nicht angefragt werden.');
    }
  };

  return (
    <aside
      onMouseDown={(event) => event.stopPropagation()}
      className="max-h-[calc(100vh-48px)] w-[min(1180px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
    >
      <div className="sticky -top-5 z-10 border-b border-slate-200 bg-white/95 pb-4 pt-1 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">{taskKey}</p>
            <h3 className="mt-2 text-xl font-extrabold leading-tight text-slate-950">Ticketdetails bearbeiten</h3>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{task.title}</p>
          </div>
          <div className="flex flex-none flex-col items-end gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.tone}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="h-10 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)] transition hover:bg-[#b84758]"
              >
                Änderungen speichern
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Ticketdetails schliessen"
                title="Schliessen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <DetailBlock title="Kerninfos" icon={FileText}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Titel
              <input
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Projekt
              <select
                value={form.projectId}
                onChange={(event) => handleChange('projectId', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {projects.map((candidateProject) => (
                  <option key={candidateProject.id} value={candidateProject.id}>
                    {candidateProject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {Object.entries(backlogStatusMeta).map(([statusValue, meta]) => (
                  <option key={statusValue} value={statusValue}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Prioritaet
              <select
                value={form.priority}
                onChange={(event) => handleChange('priority', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {Object.keys(priorityMeta).map((priorityValue) => (
                  <option key={priorityValue} value={priorityValue}>
                    {priorityValue}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Faelligkeit
              <input
                type="date"
                value={form.dueDateValue}
                onChange={(event) => handleChange('dueDateValue', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Aufwand in Stunden
              <input
                type="number"
                min="0"
                step="0.25"
                value={getEffortInputValue(form.estimatedHours, 'hours')}
                onChange={(event) => handleChange('estimatedHours', getEffortHoursFromInput(event.target.value, 'hours'))}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Aufwand in Tagen
              <input
                type="number"
                min="0"
                step="0.25"
                value={getEffortInputValue(form.estimatedHours, 'days')}
                onChange={(event) => handleChange('estimatedHours', getEffortHoursFromInput(event.target.value, 'days'))}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Zuständige Person
              <select
                value={form.assignee}
                onChange={(event) => handleChange('assignee', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                <option value="">Ohne Verantwortlichen</option>
                {assignees.map((assignee) => {
                  const workload = assigneeWorkloads.get(assignee);
                  return (
                    <option key={assignee} value={assignee}>
                      {assignee} ({workload?.displayValue || formatEffort(0, effortUnit)} gebunden)
                    </option>
                  );
                })}
              </select>
              {selectedAssigneeWorkload ? (
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${selectedAssigneeWorkload.tone}`}>
                  {selectedAssigneeWorkload.displayValue} aktuell gebunden
                </span>
              ) : null}
            </label>

            <TaskMarkerField
              value={form.markerId || ''}
              markers={taskMarkers}
              onChange={(value) => handleChange('markerId', value)}
            />

          </div>
        </DetailBlock>

        <DetailBlock title="Beschreibung" icon={FileText}>
          <textarea
            value={form.description}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
          />
        </DetailBlock>

        <DetailBlock title="Organisation" icon={Tag}>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-[#b64454]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-[#b64454]/10"
                      aria-label={`${tag} entfernen`}
                      title="Entfernen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  placeholder="Neues Tag"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
                <button type="button" onClick={handleTagAdd} className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white">
                  Hinzufuegen
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Verlinkte Mitarbeitende</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {linkedPeople.map((person) => (
                  <span
                    key={person}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700"
                  >
                    @{person}
                    <button
                      type="button"
                      onClick={() => handlePersonRemove(person)}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label={`${person} entfernen`}
                      title="Entfernen"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <select
                  value={personDraft}
                  onChange={(event) => setPersonDraft(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                >
                  {assignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handlePersonAdd} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white">
                  <UserPlus className="h-4 w-4" />
                  Verlinken
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-bold text-slate-700">
                Erstellt von
                <input
                  value={form.creatorName}
                  onChange={(event) => handleChange('creatorName', event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Initialen
                <input
                  value={form.creatorInitials}
                  onChange={(event) => handleChange('creatorInitials', event.target.value)}
                  maxLength={4}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
              </label>
            </div>
          </div>
        </DetailBlock>

        <DetailBlock
          title="Dateien und Evidenz"
          icon={Paperclip}
          action={<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">revisionssicher dokumentierbar</span>}
        >
          <div className="space-y-3">
            {attachments.length ? (
              attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{attachment.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {attachment.type} - {attachment.source} - Owner: {attachment.owner}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleAttachmentRemove(attachment.id)} className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
                    Entfernen
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-slate-500">Noch keine Evidenzdatei verknüpft.</p>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={attachmentType}
              onChange={(event) => setAttachmentType(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            >
              {attachmentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={attachmentSource}
              onChange={(event) => setAttachmentSource(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            >
              {attachmentSourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]">
              Datei verknüpfen
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  handleAttachmentFilesAdd(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
        </DetailBlock>

        <DetailBlock title="Kommentare und Mentions" icon={MessageSquareMore}>
          <div className="space-y-3">
            {comments.length ? (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-slate-900">{comment.author}</span>
                    <span className="text-xs font-semibold text-slate-400">{comment.time}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-slate-500">Noch keine Kommentare vorhanden.</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {assignees.map((assignee) => (
              <button
                key={assignee}
                type="button"
                onClick={() => handleMentionInsert(assignee)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:text-[#b64454]"
              >
                @{assignee}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Kommentar oder Rückfrage eingeben"
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
            <button type="button" onClick={handleCommentSubmit} className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">
              Senden
            </button>
          </div>
        </DetailBlock>

        <DetailBlock title="Banking Ready" icon={ShieldCheck}>
          <div className="grid gap-3">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Datenklassifizierung
              <select
                value={form.classification}
                onChange={(event) => handleChange('classification', event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                <option value="Intern">Intern</option>
                <option value="Vertraulich">Vertraulich</option>
                <option value="Reguliert">Reguliert</option>
              </select>
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Risiko
              <select
                value={form.risk}
                onChange={(event) => handleChange('risk', event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                <option value="Niedrig">Niedrig</option>
                <option value="Mittel">Mittel</option>
                <option value="Hoch">Hoch</option>
              </select>
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Kontroll-ID
              <input
                value={form.controlId}
                onChange={(event) => handleChange('controlId', event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Freigabeprozess
              <input
                value={form.approval}
                onChange={(event) => handleChange('approval', event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Evidenzhinweis
              <textarea
                value={form.evidence}
                onChange={(event) => handleChange('evidence', event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <button
              type="button"
              onClick={handleApprovalRequest}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)] transition hover:bg-[#b84758]"
            >
              <Send className="h-4 w-4" />
              Freigabe anfragen
            </button>
            {approvalRequestStatus ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{approvalRequestStatus}</p> : null}
            {approvalRequestError ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">{approvalRequestError}</p> : null}
          </div>
        </DetailBlock>

        <DetailBlock title="Audit-Spur" icon={History}>
          <div className="space-y-2">
            {auditTrail.map((entry) => (
              <div key={entry} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                {entry}
              </div>
            ))}
          </div>
        </DetailBlock>
      </div>
    </aside>
  );
}

export default function ProjectsPage() {
  const filterMenuRef = useRef(null);
  const { projectId: routeProjectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const favoriteUserKey = user?.id || user?.email || user?.name || 'guest';
  const favoriteUserLabel = user?.name || user?.email || 'Gast';
  const routeTaskId = searchParams.get('taskId');
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const [departments, setDepartments] = useState(() => [...initialDepartments, ...bankDepartmentFixtures]);
  const [projects, setProjects] = useState(() => {
    const storedProjects = getStoredProjects();
    const storedIds = new Set(storedProjects.map((project) => project.id));
    return [...storedProjects, ...bankProjectFixtures.filter((project) => !storedIds.has(project.id))];
  });
  const [backlogTasks, setBacklogTasks] = useState(() => [...initialBacklogTasks, ...bankBacklogFixtures]);
  const [taskMarkers, setTaskMarkers] = useState(() => getStoredTaskMarkers());
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0].id);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [viewMode, setViewMode] = useState('projects');
  const [selectedBacklogTaskId, setSelectedBacklogTaskId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeBacklogFilters, setActiveBacklogFilters] = useState([]);
  const [draftBacklogFilters, setDraftBacklogFilters] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [effortUnit, setEffortUnit] = useState('hours');
  const [createMode, setCreateMode] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  const normalizedSearch = searchValue.trim().toLowerCase();

  useEffect(() => {
    window.localStorage.setItem(projectStorageKey, JSON.stringify(projects));
  }, [projects]);

  const visibleDepartments = useMemo(
    () =>
      normalizedSearch
        ? departments.filter((department) => {
            const departmentProjects = projects.filter((project) => project.departmentId === department.id);
            return (
              department.name.toLowerCase().includes(normalizedSearch) ||
              department.description.toLowerCase().includes(normalizedSearch) ||
              departmentProjects.some((project) => project.name.toLowerCase().includes(normalizedSearch))
            );
          })
        : departments,
    [departments, normalizedSearch, projects],
  );

  const selectedDepartment =
    visibleDepartments.find((department) => department.id === selectedDepartmentId) ||
    visibleDepartments[0] ||
    departments[0] ||
    null;

  const departmentMembers = useMemo(() => selectedDepartment?.members || [], [selectedDepartment]);

  const visibleProjects = useMemo(() => {
    if (!selectedDepartment) return [];
    return projects.filter((project) => {
      if (project.departmentId !== selectedDepartment.id) return false;
      if (!normalizedSearch) return true;
      return (
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.summary.toLowerCase().includes(normalizedSearch) ||
        project.owner.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [normalizedSearch, projects, selectedDepartment]);

  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId) || null;
  const backlogProjectIds = useMemo(
    () => new Set(selectedProject ? [selectedProject.id] : visibleProjects.map((project) => project.id)),
    [selectedProject, visibleProjects],
  );

  const departmentCreators = useMemo(() => {
    const creatorMap = new Map();
    backlogTasks.forEach((task) => {
      if (!backlogProjectIds.has(task.projectId)) return;
      const initials = getTaskCreatorInitials(task);
      creatorMap.set(initials, getTaskCreatorName(task));
    });
    return Array.from(creatorMap, ([initials, name]) => ({ initials, name }));
  }, [backlogProjectIds, backlogTasks]);

  const assigneeWorkloads = useMemo(() => {
    const people = new Set(departmentMembers);
    const workloadTasks = selectedProject
      ? backlogTasks.filter((task) => task.projectId === selectedProject.id)
      : backlogTasks;

    workloadTasks.forEach((task) => {
      if (task.assignee.trim()) people.add(task.assignee);
    });

    return new Map(
      Array.from(people).map((person) => {
        const effortHours = sumTaskEffortHours(workloadTasks.filter((task) => task.assignee === person && task.status !== 'done'));
        return [
          person,
          {
            effortHours,
            displayValue: formatEffort(effortHours, effortUnit),
            tone:
              effortHours >= 32
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : effortHours >= 16
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700',
          },
        ];
      }),
    );
  }, [backlogTasks, departmentMembers, effortUnit, selectedProject]);

  const visibleBacklogTasks = useMemo(
    () => {
      const filteredTasks = backlogTasks.filter((task) => {
        if (!backlogProjectIds.has(task.projectId)) return false;
        if (activeBacklogFilters.length) {
          const matchesFilter = activeBacklogFilters.some((filterValue) => {
            if (filterValue === 'unassigned') return !task.assignee.trim();
            if (filterValue.startsWith('person:')) return task.assignee === filterValue.replace('person:', '');
            if (filterValue.startsWith('creator:')) return getTaskCreatorInitials(task) === filterValue.replace('creator:', '');
            if (filterValue.startsWith('status:')) return task.status === filterValue.replace('status:', '');
            if (filterValue.startsWith('priority:')) return task.priority === filterValue.replace('priority:', '');
            return true;
          });
          if (!matchesFilter) return false;
        }
        if (!normalizedSearch) return true;
        const project = projects.find((candidate) => candidate.id === task.projectId);
        return (
          task.title.toLowerCase().includes(normalizedSearch) ||
          getSourceTaskKey(task).toLowerCase().includes(normalizedSearch) ||
          getAssigneeLabel(task.assignee).toLowerCase().includes(normalizedSearch) ||
          task.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ||
          project?.name.toLowerCase().includes(normalizedSearch)
        );
      });

      return [...filteredTasks].sort((firstTask, secondTask) => {
        const firstFavorite = isFavoriteForUser(firstTask, favoriteUserKey);
        const secondFavorite = isFavoriteForUser(secondTask, favoriteUserKey);
        if (firstFavorite === secondFavorite) return 0;
        return firstFavorite ? -1 : 1;
      });
    },
    [activeBacklogFilters, backlogProjectIds, backlogTasks, favoriteUserKey, normalizedSearch, projects],
  );

  useEffect(() => {
    const handleTaskMarkerChange = (event) => {
      setTaskMarkers(event.detail || getStoredTaskMarkers());
    };

    window.addEventListener('nexttask:task-markers-change', handleTaskMarkerChange);

    return () => {
      window.removeEventListener('nexttask:task-markers-change', handleTaskMarkerChange);
    };
  }, []);

  useEffect(() => {
    if (!routeProjectId && !routeTaskId) return undefined;

    let cancelled = false;

    const loadProjectRouteData = async () => {
      try {
        const requests = [];
        if (routeTaskId) {
          requests.push(
            api.get('/calendar/tasks', {
              params: { taskId: routeTaskId },
            }),
          );
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        if (routeProjectId) {
          requests.push(api.get(`/tasks/project/${routeProjectId}`));
        } else {
          requests.push(Promise.resolve({ data: [] }));
        }

        const [taskResponse, projectTasksResponse] = await Promise.all(requests);
        if (cancelled) return;

        const highlightedTask = Array.isArray(taskResponse.data) ? taskResponse.data[0] : null;
        const projectTasks = Array.isArray(projectTasksResponse.data) ? projectTasksResponse.data : [];
        const combinedTasks = [...projectTasks];
        if (highlightedTask && !combinedTasks.some((task) => task.id === highlightedTask.id)) {
          combinedTasks.unshift(highlightedTask);
        }

        if (!combinedTasks.length && !highlightedTask) return;

        const projectMeta = highlightedTask?.project || {
          id: routeProjectId || highlightedTask?.projectId,
          name: highlightedTask?.project?.name || 'Projektansicht',
          key: highlightedTask?.project?.key || null,
          deadline: highlightedTask?.project?.deadline || null,
          description: 'Projekt aus den aktuellen NextTask-Daten.',
        };
        const departmentName =
          highlightedTask?.department ||
          projectTasks.find((task) => task.department)?.department ||
          user?.department ||
          'Live Projekte';
        const memberNames = Array.from(
          new Set(
            combinedTasks
              .map((task) => task.assignee?.name || '')
              .filter(Boolean),
          ),
        );
        const departmentId = `dept-live-${toSlugPart(departmentName)}`;
        const liveDepartment = createLiveDepartment({
          id: departmentId,
          name: departmentName,
          members: memberNames.length ? memberNames : [user?.name || 'NextTask'],
        });
        const liveProject = mapApiProjectToProject(
          projectMeta,
          departmentId,
          highlightedTask?.assignee?.name || user?.name || 'Projektteam',
        );
        const liveTasks = combinedTasks.map((task) =>
          mapApiTaskToBacklogTask({
            ...task,
            project: task.project || projectMeta,
          }),
        );

        setDepartments((current) => {
          const next = current.filter((department) => department.id !== departmentId);
          return [liveDepartment, ...next];
        });
        setProjects((current) => {
          const next = current.filter((project) => project.id !== liveProject.id);
          return [liveProject, ...next];
        });
        setBacklogTasks((current) => {
          const next = current.filter((task) => !(task.source === 'api' && task.projectId === liveProject.id));
          return [...liveTasks, ...next];
        });
        setSelectedDepartmentId(departmentId);
        setSelectedProjectId(liveProject.id);
        setViewMode('backlog');
        setFilterOpen(false);
        setActiveBacklogFilters([]);
        setDraftBacklogFilters([]);
        if (routeTaskId) {
          setSelectedBacklogTaskId(routeTaskId);
        }
      } catch {
        // Keep the static fallback project board if live route data cannot be loaded.
      }
    };

    loadProjectRouteData();

    return () => {
      cancelled = true;
    };
  }, [routeProjectId, routeTaskId, user?.department, user?.name]);

  const selectedBacklogTask = visibleBacklogTasks.find((task) => task.id === selectedBacklogTaskId) || null;
  const backlogDragDisabled = Boolean(normalizedSearch || activeBacklogFilters.length);

  const handleDepartmentOpen = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setSelectedProjectId(null);
    setViewMode('projects');
    setFilterOpen(false);
    setActiveBacklogFilters([]);
    setDraftBacklogFilters([]);
    setSelectedBacklogTaskId(null);
  };

  const handleProjectOpen = (projectId) => {
    setSelectedProjectId(projectId);
    setViewMode('backlog');
    setFilterOpen(false);
    setActiveBacklogFilters([]);
    setDraftBacklogFilters([]);
    setSelectedBacklogTaskId(null);
  };

  const handleBacklogTaskClose = () => {
    setSelectedBacklogTaskId(null);
    if (!routeTaskId) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('taskId');
    setSearchParams(nextParams, { replace: true });
  };

  const handleProjectEditOpen = () => {
    if (!selectedProject) return;
    setProjectForm(projectToForm(selectedProject, selectedDepartment?.id || departments[0]?.id || ''));
    setEditingProjectId(selectedProject.id);
    setCreateMode('project-edit');
  };

  const handleCreateAction = (item) => {
    if (item === 'Neue Abteilung') {
      setDepartmentForm(emptyDepartmentForm);
      setCreateMode('department');
    }

    if (item === 'Neues Projekt') {
      setProjectForm({
        ...emptyProjectForm,
        departmentId: selectedDepartment?.id || departments[0]?.id || '',
      });
      setCreateMode('project');
    }
  };

  const handleDepartmentSubmit = () => {
    const trimmedName = departmentForm.name.trim();
    if (!trimmedName) return;

    const nextDepartment = {
      id: `dept-${Date.now()}`,
      name: trimmedName,
      lead: departmentForm.lead.trim() || 'Elisabeth Bezverkha',
      memberCount: Number.parseInt(departmentForm.memberCount, 10) || 4,
      description: departmentForm.description.trim() || 'Neue Abteilung für strukturierte Projekte und Zusammenarbeit.',
      accent: 'border-slate-300 bg-[#fff4f6]',
      badgeTone: 'bg-[#fff0f2] text-[#b84758]',
      members: [departmentForm.lead.trim() || 'Elisabeth Bezverkha'],
    };

    setDepartments((current) => [nextDepartment, ...current]);
    setSelectedDepartmentId(nextDepartment.id);
    setViewMode('projects');
    setSelectedBacklogTaskId(null);
    setCreateMode(null);
  };

  const handleProjectSubmit = () => {
    const trimmedName = projectForm.name.trim();
    if (!trimmedName || !projectForm.departmentId) return;

    const nextProject = {
      id: `proj-${Date.now()}`,
      ...createProjectPayload(projectForm, departments),
    };

    setProjects((current) => [nextProject, ...current]);
    setSelectedDepartmentId(projectForm.departmentId);
    setSelectedProjectId(null);
    setViewMode('projects');
    setCreateMode(null);
  };

  const handleProjectEditSubmit = () => {
    const trimmedName = projectForm.name.trim();
    if (!trimmedName || !projectForm.departmentId || !editingProjectId) return;

    const updates = createProjectPayload(projectForm, departments);

    setProjects((current) =>
      current.map((project) =>
        project.id === editingProjectId
          ? {
              ...project,
              ...updates,
              id: project.id,
            }
          : project,
      ),
    );
    setSelectedDepartmentId(projectForm.departmentId);
    setSelectedProjectId(editingProjectId);
    setViewMode('backlog');
    setCreateMode(null);
    setEditingProjectId(null);
  };

  const handleBacklogTaskOpen = (taskId) => {
    setSelectedBacklogTaskId(taskId);
  };

  const searchSuggestions = normalizedSearch
    ? [
        ...visibleDepartments.map((department) => ({
          id: `department-${department.id}`,
          type: 'Bereich',
          label: department.name,
          meta: `${department.lead} - ${projects.filter((project) => project.departmentId === department.id).length} Projekte`,
          onSelect: () => handleDepartmentOpen(department.id),
        })),
        ...visibleProjects.map((project) => ({
          id: `project-${project.id}`,
          type: 'Projekt',
          label: project.name,
          meta: `${selectedDepartment?.name || 'Abteilung'} - ${project.owner}`,
          onSelect: () => handleProjectOpen(project.id),
        })),
        ...visibleBacklogTasks.map((task) => {
          const project = projects.find((candidate) => candidate.id === task.projectId);
          return {
            id: `task-${task.id}`,
            type: 'Aufgabe',
            label: task.title,
            meta: `${project?.name || 'Projekt'} - ${getAssigneeLabel(task.assignee)}`,
            onSelect: () => {
              if (project) setSelectedDepartmentId(project.departmentId);
              setSelectedProjectId(task.projectId);
              setViewMode('backlog');
              setSelectedBacklogTaskId(task.id);
            },
          };
        }),
      ]
    : [];

  const handleBacklogTaskSave = (taskId, updates) => {
    setBacklogTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    );
    if (updates.projectId && updates.projectId !== selectedProjectId) {
      setSelectedProjectId(updates.projectId);
    }
  };

  const handleToggleFavorite = (taskId) => {
    setBacklogTasks((current) => {
      const targetTask = current.find((task) => task.id === taskId);
      if (!targetTask) return current;

      const projectTasks = current.filter((task) => task.projectId === targetTask.projectId);
      const currentProjectIndex = projectTasks.findIndex((task) => task.id === taskId);
      if (currentProjectIndex === -1) return current;

      const currentFavorites = getTaskFavorites(targetTask);
      const currentReturnIndexes = getFavoriteReturnIndexes(targetTask);
      const isCurrentlyFavorite = currentFavorites.includes(favoriteUserKey);
      const nextFavorites = isCurrentlyFavorite
        ? currentFavorites.filter((personKey) => personKey !== favoriteUserKey)
        : [...currentFavorites, favoriteUserKey];
      const nextReturnIndexes = { ...currentReturnIndexes };

      if (isCurrentlyFavorite) {
        delete nextReturnIndexes[favoriteUserKey];
      } else {
        nextReturnIndexes[favoriteUserKey] = currentProjectIndex;
      }

      const nextTasks = current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              favoriteBy: nextFavorites,
              favoriteReturnIndexBy: nextReturnIndexes,
            }
          : task,
      );
      const updatedTarget = nextTasks.find((task) => task.id === taskId);
      if (!updatedTarget) return nextTasks;

      const projectTasksWithoutTarget = projectTasks.filter((task) => task.id !== taskId);
      let reorderedProjectTasks;

      if (isCurrentlyFavorite) {
        const restoreIndex = Math.max(
          0,
          Math.min(currentReturnIndexes[favoriteUserKey] ?? currentProjectIndex, projectTasksWithoutTarget.length),
        );
        reorderedProjectTasks = [
          ...projectTasksWithoutTarget.slice(0, restoreIndex),
          updatedTarget,
          ...projectTasksWithoutTarget.slice(restoreIndex),
        ];
      } else {
        const insertIndex = projectTasksWithoutTarget.findIndex((task) => !isFavoriteForUser(task, favoriteUserKey));
        const nextIndex = insertIndex === -1 ? projectTasksWithoutTarget.length : insertIndex;
        reorderedProjectTasks = [
          ...projectTasksWithoutTarget.slice(0, nextIndex),
          updatedTarget,
          ...projectTasksWithoutTarget.slice(nextIndex),
        ];
      }

      let nextProjectTaskIndex = 0;
      return nextTasks.map((task) => {
        if (task.projectId !== targetTask.projectId) return task;
        const nextTask = reorderedProjectTasks[nextProjectTaskIndex];
        nextProjectTaskIndex += 1;
        return nextTask;
      });
    });
  };

  const handleBacklogDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setBacklogTasks((current) => {
      const activeTask = current.find((task) => task.id === activeId);
      const overTask = current.find((task) => task.id === overId);

      if (!activeTask || !overTask || activeTask.projectId !== overTask.projectId) return current;

      const projectTasks = current.filter((task) => task.projectId === activeTask.projectId);
      const oldIndex = projectTasks.findIndex((task) => task.id === activeId);
      const newIndex = projectTasks.findIndex((task) => task.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return current;

      const reorderedProjectTasks = arrayMove(projectTasks, oldIndex, newIndex);
      let nextProjectTaskIndex = 0;

      return current.map((task) => {
        if (task.projectId !== activeTask.projectId) return task;
        const nextTask = reorderedProjectTasks[nextProjectTaskIndex];
        nextProjectTaskIndex += 1;
        return nextTask;
      });
    });
  };

  const handleFilterMenuOpen = () => {
    setDraftBacklogFilters(activeBacklogFilters);
    setFilterOpen((current) => !current);
  };

  const toggleDraftFilter = (filterValue) => {
    setDraftBacklogFilters((current) =>
      current.includes(filterValue) ? current.filter((value) => value !== filterValue) : [...current, filterValue],
    );
  };

  const removeActiveFilter = (filterValue) => {
    setActiveBacklogFilters((current) => current.filter((value) => value !== filterValue));
    setDraftBacklogFilters((current) => current.filter((value) => value !== filterValue));
  };

  const handleFilterSave = () => {
    setActiveBacklogFilters(draftBacklogFilters);
    setFilterOpen(false);
  };

  const handleFilterDiscard = () => {
    setDraftBacklogFilters(activeBacklogFilters);
    setFilterOpen(false);
  };

  useEffect(() => {
    if (!filterOpen) return undefined;

    const handlePointerDown = (event) => {
      if (filterMenuRef.current?.contains(event.target)) return;
      setDraftBacklogFilters(activeBacklogFilters);
      setFilterOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [activeBacklogFilters, filterOpen]);

  return (
    <AppShell
      activeItem="Projekte"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Projekte"
      createMenuItems={createMenuItems}
      onCreateAction={handleCreateAction}
      searchValue={searchValue}
      onSearch={setSearchValue}
      searchSuggestions={searchSuggestions}
    >
      <div
        className={`px-4 py-4 xl:px-6 ${
          viewMode === 'projects'
            ? 'grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] 2xl:items-start'
            : 'space-y-6'
        }`}
      >
        {viewMode === 'projects' ? (
          <section className="rounded-3xl border border-slate-300 bg-white/70 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Abteilungen</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Zeit anzeigen als</span>
                <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1">
                  {effortUnitOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEffortUnit(option.value)}
                      className={`h-9 rounded-xl px-3 text-sm font-extrabold transition ${
                        effortUnit === option.value
                          ? 'bg-[#b84758] text-white shadow-[0_10px_22px_rgba(184,71,88,0.16)]'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{visibleDepartments.length} Bereiche</span>
              </div>
            </div>
            <div className="mx-auto flex max-w-[1120px] flex-wrap justify-center gap-3">
              {visibleDepartments.map((department) => (
                <div key={department.id} className="w-full min-w-0 sm:w-[250px]">
                  <DepartmentCard
                    department={department}
                    projectCount={projects.filter((project) => project.departmentId === department.id).length}
                    effortHours={sumTaskEffortHours(
                      backlogTasks
                        .filter((task) => {
                          const project = projects.find((candidate) => candidate.id === task.projectId);
                          return project?.departmentId === department.id && task.status !== 'done';
                        }),
                    )}
                    effortUnit={effortUnit}
                    isActive={selectedDepartment?.id === department.id}
                    onOpen={handleDepartmentOpen}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className={`rounded-3xl border border-slate-300 bg-white p-5 shadow-[0_16px_40px_rgba(136,54,66,0.08)] ${viewMode === 'backlog' ? 'min-h-[calc(100vh-150px)]' : ''}`}>
          {viewMode === 'projects' ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Projekte</p>
              </div>
              {selectedDepartment ? (
                <span className="rounded-full bg-[#fff3f5] px-3 py-1 text-xs font-bold text-[#b84758]">{selectedDepartment.name}</span>
              ) : null}
            </div>
          ) : null}
          {viewMode === 'backlog' ? (
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">
                  {selectedDepartment ? selectedDepartment.name : 'Keine Abteilung'}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-[#b84758]">
                  {selectedDepartment ? `Backlog: ${selectedProject?.name || ''}` : 'Keine Projekte sichtbar'}
                </h2>
              </div>

              {selectedDepartment ? (
                <div className="flex flex-wrap items-center gap-3">
                  {selectedProject ? (
                    <button
                      type="button"
                      onClick={handleProjectEditOpen}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:border-[#d89aa5] hover:bg-[#fff7f8] hover:text-[#a23d4d]"
                    >
                      <Pencil className="h-4 w-4" />
                      Bearbeiten
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterOpen(false);
                      setViewMode('projects');
                      setSelectedProjectId(null);
                      setSelectedBacklogTaskId(null);
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)] transition hover:bg-[#b84758]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Zurueck zu Abteilungen und Projekten
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {viewMode === 'backlog' && selectedProject ? <ProjectReportOverview project={selectedProject} /> : null}

          {viewMode === 'backlog' && selectedProject && departmentMembers.length ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Zeitbindung</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Voraussichtlich gebundene Zeit je Person in diesem Projekt.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">{departmentMembers.length} Personen</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {departmentMembers.map((person) => {
                  const workload = assigneeWorkloads.get(person);
                  return (
                    <div key={person} className="rounded-2xl border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-extrabold text-slate-900">{person}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${workload?.tone}`}>
                          {workload?.displayValue || formatEffort(0, effortUnit)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-500">aktuell gebunden</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {viewMode === 'projects' ? (
            <div className={`${viewMode === 'backlog' ? 'mt-5' : ''} grid gap-3 md:grid-cols-2`}>
              {visibleProjects.map((project) => {
                const projectEffortHours = sumTaskEffortHours(backlogTasks.filter((task) => task.projectId === project.id && task.status !== 'done'));
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    effortHours={projectEffortHours}
                    effortUnit={effortUnit}
                    onOpen={handleProjectOpen}
                  />
                );
              })}
            </div>
          ) : null}

          {viewMode === 'backlog' ? (
            <div className="mt-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">
                    {formatEffort(sumTaskEffortHours(visibleBacklogTasks), effortUnit)} im Backlog
                    <span className="ml-2 text-xs font-semibold text-slate-400">
                      Favoriten für {favoriteUserLabel} stehen oben.
                    </span>
                  </p>
                  <div ref={filterMenuRef} className="relative flex flex-wrap items-center justify-end gap-2">
                    {activeBacklogFilters.map((filterValue) => (
                      <button
                        key={filterValue}
                        type="button"
                        onClick={() => removeActiveFilter(filterValue)}
                        className="group inline-flex h-9 items-center gap-2 rounded-full border border-[#f0d7db] bg-[#fff7f8] px-3 text-xs font-bold text-[#a23d4d] transition hover:border-[#d89aa5] hover:bg-[#fff1f3]"
                        title={`${getFilterLabel(filterValue)} entfernen`}
                      >
                        <span>{getFilterLabel(filterValue)}</span>
                        <X className="hidden h-3.5 w-3.5 group-hover:block" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleFilterMenuOpen}
                      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
                        activeBacklogFilters.length
                          ? 'border-[#d89aa5] bg-[#fff1f3] text-[#a23d4d]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                      aria-label="Backlog filtern"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </button>

                    {filterOpen ? (
                      <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                        <div className="max-h-72 overflow-y-auto pr-1">
                          <button
                            type="button"
                            onClick={() => toggleDraftFilter('unassigned')}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                              draftBacklogFilters.includes('unassigned') ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Ohne Verantwortlichen
                            {draftBacklogFilters.includes('unassigned') ? <CheckCircle2 className="h-4 w-4" /> : null}
                          </button>
                        {departmentMembers.length ? (
                          <>
                            <div className="my-1 border-t border-slate-100" />
                              <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Personen</p>
                              {departmentMembers.map((member) => {
                                const value = `person:${member}`;
                                return (
                                  <button
                                    key={member}
                                    type="button"
                                    onClick={() => toggleDraftFilter(value)}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                      draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {member}
                                    {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4" /> : null}
                                  </button>
                                );
                            })}
                          </>
                        ) : null}
                          {departmentCreators.length ? (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Ersteller</p>
                              {departmentCreators.map((creator) => {
                                const value = `creator:${creator.initials}`;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => toggleDraftFilter(value)}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                      draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#f0edff] text-[10px] font-extrabold text-[#6d5df6]">
                                        {creator.initials}
                                      </span>
                                      <span className="truncate">{creator.name}</span>
                                    </span>
                                    {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4 flex-none" /> : null}
                                  </button>
                                );
                              })}
                            </>
                          ) : null}
                          <div className="my-1 border-t border-slate-100" />
                          <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Status</p>
                          {Object.entries(backlogStatusMeta).map(([statusValue, meta]) => {
                            const value = `status:${statusValue}`;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleDraftFilter(value)}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                  draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {meta.label}
                                {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4" /> : null}
                              </button>
                            );
                          })}
                          <div className="my-1 border-t border-slate-100" />
                          <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Prioritaet</p>
                          {Object.keys(priorityMeta).map((priorityValue) => {
                            const value = `priority:${priorityValue}`;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleDraftFilter(value)}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                  draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                Prio {priorityValue}
                                {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4" /> : null}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            onClick={handleFilterDiscard}
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            Verwerfen
                          </button>
                          <button
                            type="button"
                            onClick={handleFilterSave}
                            className="h-10 rounded-xl bg-[#c95767] px-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(201,87,103,0.18)] transition hover:bg-[#b84758]"
                          >
                            Speichern
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {backlogDragDisabled ? (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    Sortieren ist pausiert, solange Suche oder Filter aktiv sind.
                  </p>
                ) : null}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBacklogDragEnd}>
                  {visibleProjects.map((project) => {
                    const projectTasks = visibleBacklogTasks.filter((task) => task.projectId === project.id);
                    if (!projectTasks.length) return null;
                    return (
                      <BacklogProjectGroup
                        key={project.id}
                        project={project}
                        tasks={projectTasks}
                        effortUnit={effortUnit}
                        selectedTaskId={selectedBacklogTask?.id}
                        favoriteUserKey={favoriteUserKey}
                        onOpenTask={handleBacklogTaskOpen}
                        onToggleFavorite={handleToggleFavorite}
                        dragDisabled={backlogDragDisabled}
                      />
                    );
                  })}
                </DndContext>

                {!visibleBacklogTasks.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <ListChecks className="mx-auto h-8 w-8 text-[#b84758]" />
                    <p className="mt-4 text-base font-bold text-slate-900">Noch keine Aufgaben im Backlog</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">Für dieses Projekt wurden noch keine Backlog-Aufgaben angelegt.</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {viewMode === 'projects' && !visibleProjects.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b84758] shadow-[0_10px_24px_rgba(184,71,88,0.10)]">
                <FolderOpen className="h-7 w-7" />
              </div>
              <p className="mt-4 text-base font-bold text-slate-900">Noch keine Projekte in diesem Bereich</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Lege über `Erstellen` ein neues Projekt an oder waehle eine andere Abteilung aus.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {selectedBacklogTask ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
          onMouseDown={handleBacklogTaskClose}
          role="presentation"
        >
          <BacklogDetailPanel
            key={selectedBacklogTask.id}
            task={selectedBacklogTask}
            projects={visibleProjects}
            assignees={departmentMembers}
            assigneeWorkloads={assigneeWorkloads}
            effortUnit={effortUnit}
            taskMarkers={taskMarkers}
            onSave={handleBacklogTaskSave}
            onClose={handleBacklogTaskClose}
          />
        </div>
      ) : null}

      {createMode === 'department' ? (
        <CreateDepartmentModal
          form={departmentForm}
          onChange={(field, value) => setDepartmentForm((current) => ({ ...current, [field]: value }))}
          onClose={() => setCreateMode(null)}
          onSubmit={handleDepartmentSubmit}
        />
      ) : null}

      {createMode === 'project' ? (
        <CreateProjectModal
          departments={departments}
          form={projectForm}
          onChange={(field, value) => setProjectForm((current) => ({ ...current, [field]: value }))}
          onClose={() => {
            setCreateMode(null);
            setEditingProjectId(null);
          }}
          onSubmit={handleProjectSubmit}
        />
      ) : null}

      {createMode === 'project-edit' ? (
        <CreateProjectModal
          departments={departments}
          form={projectForm}
          onChange={(field, value) => setProjectForm((current) => ({ ...current, [field]: value }))}
          onClose={() => {
            setCreateMode(null);
            setEditingProjectId(null);
          }}
          onSubmit={handleProjectEditSubmit}
          title="Projekt bearbeiten"
          subtitle="Passe Stammdaten und Berichtsbasis für den nächsten Statusbericht an."
          submitLabel="Änderungen speichern"
        />
      ) : null}

    </AppShell>
  );
}
