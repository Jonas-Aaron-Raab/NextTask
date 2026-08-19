import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Flag,
  GripVertical,
  History,
  Link2,
  ListChecks,
  LockKeyhole,
  MessageSquareMore,
  Paperclip,
  ShieldCheck,
  Tag,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { CreateProjectModal as ProjectsCreateProjectModal } from './ProjectsPage';
import api from '../api/axios';
import { dashboardFallbackTasks, initialTasks, taskProjects as initialProjects } from '../data/taskFixtures';
import { formatEffort, getEffortHoursFromInput, getEffortInputValue } from '../utils/effort';
import { getStoredTaskMarkers, getTaskMarker } from '../utils/taskMarkers';

const columns = [
  { id: 'today', title: 'Heute', dot: 'bg-amber-400' },
  { id: 'in-progress', title: 'In Arbeit', dot: 'bg-blue-500' },
  { id: 'review', title: 'Review', dot: 'bg-violet-500' },
  { id: 'blocked', title: 'Blockiert', dot: 'bg-rose-500' },
  { id: 'done', title: 'Erledigt', dot: 'bg-emerald-500' },
];

const teamMembers = [
  'Lisa Wagner',
  'Markus Klein',
  'Anna Becker',
  'Tom Becker',
  'Sarah Nguyen',
];

const teamProfiles = {
  'Lisa Wagner': {
    email: 'lisa.wagner@sparkasse-nexttask.de',
    role: 'Produktmanagerin',
    department: 'Digitales Banking',
  },
  'Markus Klein': {
    email: 'markus.klein@sparkasse-nexttask.de',
    role: 'Lead UX Manager',
    department: 'Digitale Vertriebskanaele',
  },
  'Anna Becker': {
    email: 'anna.becker@sparkasse-nexttask.de',
    role: 'Fachkoordinatorin',
    department: 'Produkt und Compliance',
  },
  'Tom Becker': {
    email: 'tom.becker@sparkasse-nexttask.de',
    role: 'QA Manager',
    department: 'Qualitätssicherung',
  },
  'Sarah Nguyen': {
    email: 'sarah.nguyen@sparkasse-nexttask.de',
    role: 'Campaign Managerin',
    department: 'Marketing und Content',
  },
};

const controlFeed = [
  {
    taskId: 'my-task-5',
    title: 'Vier-Augen-Freigabe offen',
    meta: 'CTRL-PAY-771 - Shop Optimierung',
    note: 'Vor Abschluss fehlt noch die QA- und Product-Owner-Freigabe für den Checkout-Testlauf.',
  },
  {
    taskId: 'my-task-7',
    title: 'Preisfreigabe ausstehend',
    meta: 'CTRL-PRC-551 - Website Relaunch',
    note: 'Die Pricing-Seite bleibt blockiert, bis Vertrieb und Fachbereich die finale Preisdatei freigeben.',
  },
  {
    taskId: 'my-task-1',
    title: 'Evidenznachweis nachreichen',
    meta: 'CTRL-WEB-204 - Website Relaunch',
    note: 'Word-Freigabe und Screenshot-Nachweis müssen revisionssicher am Ticket verknüpft werden.',
  },
];

const priorityStyles = {
  hoch: 'border-red-100 bg-red-50 text-red-600',
  mittel: 'border-amber-100 bg-amber-50 text-amber-600',
  niedrig: 'border-emerald-100 bg-emerald-50 text-emerald-600',
};

const statusLabels = {
  today: 'Heute',
  'in-progress': 'In Arbeit',
  review: 'Review',
  blocked: 'Blockiert',
  done: 'Erledigt',
};

const boardStatusOptions = [
  { value: 'all', label: 'Alle Stati' },
  ...columns.map((column) => ({ value: column.id, label: statusLabels[column.id] })),
];
const taskSelectClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12';

const attachmentSourceOptions = ['SharePoint', 'OneDrive', 'DMS', 'Audit-Ablage'];
const attachmentTypeOptions = ['Excel', 'Word', 'PDF', 'Link'];
const createMenuItems = ['Neue Aufgabe', 'Neues Projekt'];
const performancePresets = {
  day: {
    label: 'Tag',
    progress: 68,
    caption: 'Heute abgeschlossen',
    summary: '3 von 5 offenen Tickets bewegt',
    metrics: [
      { type: 'done', value: '3' },
      { type: 'progress', value: '5' },
      { type: 'open', value: '1' },
    ],
    bars: [42, 58, 61, 68, 64, 70, 68],
  },
  week: {
    label: 'Woche',
    progress: 74,
    caption: 'Diese Woche',
    summary: '11 Tickets im Soll bearbeitet',
    metrics: [
      { type: 'done', value: '11' },
      { type: 'progress', value: '4' },
      { type: 'open', value: '2' },
    ],
    bars: [38, 46, 51, 63, 71, 74, 74],
  },
  month: {
    label: 'Monat',
    progress: 79,
    caption: 'Monatstrend',
    summary: 'Leistung stabil über Teamziel',
    metrics: [
      { type: 'done', value: '37' },
      { type: 'progress', value: '9' },
      { type: 'open', value: '6' },
    ],
    bars: [22, 34, 43, 56, 64, 71, 79],
  },
  year: {
    label: 'Jahr',
    progress: 81,
    caption: 'Jahreswert',
    summary: 'Audit-fähige Tickets sauber dokumentiert',
    metrics: [
      { type: 'done', value: '412' },
      { type: 'progress', value: '88' },
      { type: 'open', value: '24' },
    ],
    bars: [20, 29, 40, 52, 63, 72, 81],
  },
};

function formatDateLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

const apiStatusMap = {
  OPEN: 'today',
  IN_PROGRESS: 'in-progress',
  QA: 'review',
  BLOCKED: 'blocked',
  DONE: 'done',
};

const apiPriorityMap = {
  LOW: 'niedrig',
  MEDIUM: 'mittel',
  HIGH: 'hoch',
  URGENT: 'hoch',
};

function normalizeApiTaskForMyTasks(task) {
  const dueDateValue = task.dueDate || task.endDate || task.startDate
    ? String(task.dueDate || task.endDate || task.startDate).slice(0, 10)
    : '';
  const project = task.project?.name || task.project || 'Ohne Projekt';
  const assignee = task.assignee?.name || task.assigneeName || '';

  return {
    id: task.id,
    ticketNumber: task.ticketNumber || '',
    source: 'backend',
    title: task.title,
    project,
    status: apiStatusMap[task.status] || 'today',
    priority: apiPriorityMap[task.priority] || 'mittel',
    dueDateValue,
    dueDate: dueDateValue ? formatDateLabel(dueDateValue) : 'Ohne Frist',
    estimatedHours: task.estimatedHours ?? 0,
    checklist: task.checklist || '0/0 erledigt',
    progress: task.progress ?? 0,
    assignee,
    description: task.description || '',
    note: '',
    compliance: {
      classification: 'Intern',
      risk: 'Niedrig',
      controlId: task.project?.key ? `${task.project.key}-${String(task.id).slice(-4)}` : task.id,
      approval: 'Noch keine Freigabe hinterlegt',
      evidence: 'Noch kein Evidenznachweis hinterlegt',
    },
    markerId: task.markerId || '',
    approvalLevel: task.approvalLevel || 'none',
    parentTaskId: task.parentTaskId || task.parentId || '',
    tags: [task.status, task.priority].filter(Boolean),
    linkedPeople: assignee ? [assignee] : [],
    attachments: [],
    comments: [],
    auditTrail: [`${formatDateLabel(new Date().toISOString().slice(0, 10))}: Aufgabe aus dem Backend geladen.`],
    assignedBy: { name: 'NextTask', initials: 'NT', tone: 'from-slate-200 to-slate-300' },
  };
}

function normalizeFallbackTaskForMyTasks(task) {
  return {
    ...task,
    ticketNumber: task.ticketNumber || '',
    source: task.source || 'local',
    compliance: task.compliance || {
      classification: 'Intern',
      risk: 'Niedrig',
      controlId: task.id,
      approval: 'Noch keine Freigabe hinterlegt',
      evidence: 'Noch kein Evidenznachweis hinterlegt',
    },
    description: task.description || task.note || '',
    checklist: task.checklist || '0/0 erledigt',
    progress: task.progress ?? 0,
    attachments: task.attachments || [],
    comments: task.comments || [],
    linkedPeople: task.linkedPeople || [],
    tags: task.tags || [],
    parentTaskId: task.parentTaskId || '',
    approvalLevel: task.approvalLevel || 'none',
    auditTrail: task.auditTrail || [],
    assignedBy: task.assignedBy || { name: 'NextTask', initials: 'NT', tone: 'from-slate-200 to-slate-300' },
  };
}

function buildProjectKey(projectName) {
  const words = String(projectName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .match(/[A-Z0-9]+/g) || ['TASK'];

  return words.length === 1 ? words[0].slice(0, 3) : words.map((word) => word[0]).join('').slice(0, 4);
}

function withProjectTicketNumbers(taskList) {
  const counters = new Map();

  return taskList.map((task) => {
    const projectKey = buildProjectKey(task.project);
    const nextNumber = (counters.get(projectKey) || 0) + 1;
    counters.set(projectKey, nextNumber);
    return { ...task, ticketNumber: task.ticketNumber || `${projectKey}-${nextNumber}` };
  });
}

function getNextTicketNumber(taskList, projectName) {
  const projectKey = buildProjectKey(projectName);
  const nextNumber = taskList.filter((task) => task.project === projectName).length + 1;
  return `${projectKey}-${nextNumber}`;
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function buildAssignedBy(name = 'Elisabeth Bezverkha') {
  return {
    name,
    initials: getInitials(name),
    tone: 'from-rose-200 to-orange-200',
  };
}

function buildCreateTaskForm(projectName, creatorName = 'Elisabeth Bezverkha') {
  return {
    title: '',
    ticketNumber: '',
    description: '',
    project: projectName,
    status: 'today',
    priority: 'mittel',
    dueDateValue: '2026-08-20',
    estimatedHours: '4',
    assignee: 'Lisa Wagner',
    approvalLevel: 'none',
    markerId: '',
    classification: 'Intern',
    risk: 'Niedrig',
    controlId: `CTRL-NEW-${String(Date.now()).slice(-4)}`,
    approval: 'Noch kein Freigabeprozess definiert',
    evidence: 'Noch keine Evidenz hinterlegt',
    tags: ['Neu'],
    linkedPeople: [],
    attachments: [],
    comments: [],
    auditTrail: [],
    assignedBy: buildAssignedBy(creatorName),
    parentTaskId: '',
  };
}

function buildCreateProjectForm(departmentId = '') {
  return {
    name: '',
    departmentId,
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
    milestoneRows: [{ id: `milestone-${Date.now()}`, title: '', planDate: '', newDate: '', status: 'Offen', progress: '0', statusNote: '' }],
    riskRows: [{ id: `risk-${Date.now()}`, code: '', title: '', impact: '', probability: '', riskClass: '', trend: 'Stabil', description: '', measure: '' }],
    budgetRows: [
      { id: `budget-${Date.now()}-1`, category: 'Interne Personalkosten', plannedAmount: '', actualAmount: '' },
      { id: `budget-${Date.now()}-2`, category: 'Externe Dienstleister', plannedAmount: '', actualAmount: '' },
    ],
    interfaceRows: [{ id: `interface-${Date.now()}`, name: '', status: 'Offen', comment: '' }],
    projectResponsibleApproval: '',
    gblApproval: '',
    projectLeadApproval: '',
    approvalDate: '',
  };
}

function TaskFilterField({ label, value, onChange, children }) {
  return (
    <label className="min-w-[170px] flex-1 space-y-1.5">
      <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <select value={value} onChange={onChange} className={taskSelectClass}>
        {children}
      </select>
    </label>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-bold ${priorityStyles[priority]}`}>
      <Flag className="h-3 w-3" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, iconTone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <ArrowUpRight className="h-3 w-3" />
          {subtitle}
        </p>
      </div>
      <div className="mt-1.5">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-0.5 text-[21px] font-bold leading-none text-slate-950">{value}</p>
      </div>
    </article>
  );
}

function AssignerAvatar({ person }) {
  const tone = person?.tone || 'from-slate-200 to-slate-300';

  return (
    <span
      className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br ${tone} text-[10px] font-extrabold text-slate-700 ring-2 ring-white`}
      title={person?.name}
    >
      {person?.initials || getInitials(person?.name || 'NA')}
    </span>
  );
}

function TaskCard({ task, onOpen }) {
  const [showAssignerProfile, setShowAssignerProfile] = useState(false);
  const assignerProfile = teamProfiles[task.assignedBy.name];
  const marker = getTaskMarker(task);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(task);
        }
      }}
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
      title={marker.label}
    >
      <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: marker.color }} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#b84758]">{task.ticketNumber}</p>
          <p className="text-[13px] font-bold leading-4 text-slate-900">{task.title}</p>
        </div>
        {task.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 flex-none text-emerald-500" /> : null}
      </div>

      <div className="mt-2">
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-2 border-t border-slate-100 pt-2">
        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowAssignerProfile((current) => !current);
            }}
            className="rounded-full"
            aria-label={`Infos zu ${task.assignedBy.name} anzeigen`}
          >
            <AssignerAvatar person={task.assignedBy} />
          </button>
          {showAssignerProfile ? (
            <div
              className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-2xl border border-[#ebc8cf] bg-white p-3 shadow-[0_16px_36px_rgba(15,23,42,0.14)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b84758]">Zugewiesen von</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{task.assignedBy.name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{assignerProfile?.role || 'Teammitglied'}</p>
              <p className="mt-2 text-xs font-medium text-slate-600">{assignerProfile?.email || 'keine E-Mail hinterlegt'}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{assignerProfile?.department || 'keine Abteilung hinterlegt'}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1.5 text-[11px] font-bold text-slate-500">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(task);
            }}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Kommentare zu ${task.title} öffnen`}
          >
            <MessageSquareMore className="h-4 w-4" />
            {task.comments.length}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(task);
            }}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Anhänge zu ${task.title} öffnen`}
          >
            <Paperclip className="h-4 w-4" />
            {task.attachments.length}
          </button>
        </div>
      </div>
    </div>
  );
}

function BoardColumn({ column, tasks, onOpenTask, onDragStart, onDragOver, onDrop, isDragged }) {
  return (
    <section
      draggable
      onDragStart={() => onDragStart(column.id)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(column.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(column.id);
      }}
      className={`flex min-w-0 flex-col rounded-2xl border bg-white/85 p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition ${
        isDragged ? 'border-[#d89aa5] shadow-[0_18px_36px_rgba(136,54,66,0.10)]' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-900">{column.title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{tasks.length}</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition group-hover:text-slate-500" aria-hidden="true">
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
        ))}
      </div>
    </section>
  );
}

function SideCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
      <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function PopupShell({ title, subtitle, onClose, children, maxWidth = 'max-w-3xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <section className={`max-h-[85vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ${maxWidth}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Popup schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(85vh-88px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

function SummaryStrip({ stats, controlCount, performanceValue, onOpenStat, onOpenControls, onOpenPerformance }) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,2.3fr)_minmax(190px,0.75fr)_minmax(190px,0.75fr)]">
      <section className="rounded-2xl border border-slate-300 bg-white p-2 shadow-[0_12px_30px_rgba(136,54,66,0.07)]">
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <button
              key={stat.id}
              type="button"
              onClick={() => onOpenStat(stat)}
              className={`rounded-[22px] border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(136,54,66,0.12)] ${stat.cardTone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${stat.iconTone}`}>
                  <stat.icon className="h-3.5 w-3.5" />
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#b66773]" />
              </div>
              <p className="mt-1.5 text-[10px] font-semibold text-[#8b5860]">{stat.title}</p>
              <p className="mt-1 text-[20px] font-extrabold leading-none text-slate-950">{stat.value}</p>
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onOpenControls}
        className="rounded-2xl border border-slate-300 bg-white p-2 text-left shadow-[0_12px_30px_rgba(136,54,66,0.07)] transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_16px_34px_rgba(136,54,66,0.12)]"
      >
        <div className="h-full rounded-[22px] border border-slate-200 bg-white p-3.5">
          <p className="text-[12px] font-bold text-slate-900">Freigaben und Kontrollen</p>
          <p className="mt-1.5 text-[24px] font-extrabold leading-none text-slate-950">{controlCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#8b5860]">offene Kontrollpunkte</p>
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenPerformance}
        className="rounded-2xl border border-slate-300 bg-white p-2 text-left shadow-[0_12px_30px_rgba(136,54,66,0.07)] transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_16px_34px_rgba(136,54,66,0.12)]"
      >
        <div className="h-full rounded-[22px] border border-slate-200 bg-white p-3.5">
          <p className="text-[12px] font-bold text-slate-900">Leistungsüberblick</p>
          <p className="mt-1.5 text-[26px] font-extrabold leading-none text-slate-950">{performanceValue}%</p>
          <p className="mt-1 text-[11px] font-semibold text-[#8b5860]">erledigte Aufgaben</p>
        </div>
      </button>
    </div>
  );
}

function TaskCollectionPopup({ title, subtitle, tasks, onClose, onOpenTask }) {
  return (
    <PopupShell title={title} subtitle={subtitle} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => {
              onClose();
              onOpenTask(task);
            }}
            className="relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white py-3 pl-5 pr-3 text-left transition hover:border-rose-200 hover:bg-rose-50"
            title={getTaskMarker(task).label}
          >
            <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: getTaskMarker(task).color }} aria-hidden="true" />
            <AssignerAvatar person={task.assignedBy} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{task.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{task.project}</p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{task.note}</p>
            </div>
            <div className="text-right">
              <PriorityBadge priority={task.priority} />
              <p className="mt-2 text-xs font-bold text-slate-500">{task.dueDate}</p>
            </div>
          </button>
        ))}
      </div>
    </PopupShell>
  );
}

function ControlsPopup({ items, tasks, onClose, onOpenTask }) {
  return (
    <PopupShell title="Freigaben und Kontrollen" subtitle="Offene Sign-offs, Blocker und Kontrollnachweise" onClose={onClose}>
      <div className="space-y-3">
        {items.map((item) => {
          const linkedTask = tasks.find((task) => task.id === item.taskId);
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{item.meta}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.note}</p>
              {linkedTask ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTask(linkedTask);
                  }}
                  className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Ticket öffnen
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </PopupShell>
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
function CreateTaskModal({
  projects,
  relatedTasks,
  form,
  taskMarkers,
  commentDraft,
  tagDraft,
  personDraft,
  attachmentSource,
  attachmentType,
  onChange,
  onClose,
  onSubmit,
  onCommentChange,
  onCommentSubmit,
  onInsertMention,
  onTagDraftChange,
  onTagAdd,
  onTagRemove,
  onPersonDraftChange,
  onPersonAdd,
  onPersonRemove,
  onAttachmentSourceChange,
  onAttachmentTypeChange,
  onAttachmentFilesAdd,
  onAttachmentRemove,
  onParentTaskChange,
  onOpenRelatedTask,
}) {
  return (
    <TaskEditorModal
      mode="create"
      resetKey="create-task"
      form={form}
      projects={projects}
      tags={form.tags || []}
      linkedPeople={form.linkedPeople || []}
      attachments={form.attachments || []}
      comments={form.comments || []}
      auditTrail={form.auditTrail || []}
      relatedTasks={relatedTasks}
      parentTask={relatedTasks.find((task) => task.id === form.parentTaskId)}
      childTasks={[]}
      assignedByName={form.assignedBy?.name}
      headerEyebrow="Aufgabe erstellen"
      headerTitle={form.title?.trim() || 'Neue Aufgabe'}
      headerTicketNumber={form.ticketNumber || 'wird vergeben'}
      commentDraft={commentDraft}
      tagDraft={tagDraft}
      personDraft={personDraft}
      attachmentSource={attachmentSource}
      attachmentType={attachmentType}
      onClose={onClose}
      onFormChange={onChange}
      onCommentChange={onCommentChange}
      onCommentSubmit={onCommentSubmit}
      onInsertMention={onInsertMention}
      onTagDraftChange={onTagDraftChange}
      onTagAdd={onTagAdd}
      onTagRemove={onTagRemove}
      onPersonDraftChange={onPersonDraftChange}
      onPersonAdd={onPersonAdd}
      onPersonRemove={onPersonRemove}
      onAttachmentSourceChange={onAttachmentSourceChange}
      onAttachmentTypeChange={onAttachmentTypeChange}
      onAttachmentFilesAdd={onAttachmentFilesAdd}
      onAttachmentRemove={onAttachmentRemove}
      onParentTaskChange={onParentTaskChange}
      onOpenRelatedTask={onOpenRelatedTask}
      onSubmit={onSubmit}
      submitLabel="Aufgabe anlegen"
      taskMarkers={taskMarkers}
    />
  );
}

function PerformanceCard({ period, onPeriodChange }) {
  const data = performancePresets[period];
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.progress / 100) * circumference;
  const statusIcons = {
    done: CheckCircle2,
    progress: Clock3,
    open: X,
  };
  const statusTones = {
    done: 'bg-emerald-50 text-emerald-600',
    progress: 'bg-amber-50 text-amber-600',
    open: 'bg-rose-50 text-rose-600',
  };

  return (
    <div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {Object.entries(performancePresets).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPeriodChange(key)}
            className={`rounded-full px-2 py-1.5 text-[11px] font-bold transition ${
              period === key ? 'bg-[#c95767] text-white shadow-[0_10px_18px_rgba(201,87,103,0.26)]' : 'bg-[#f7ecee] text-[#8b5860] hover:bg-[#f3dfe3]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-[#fff6f7] p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-[88px] w-[88px] flex-none">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
              <circle cx="44" cy="44" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="#c95767"
                strokeLinecap="round"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-extrabold leading-none text-[#8f2231]">{data.progress}%</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-5 text-slate-900">{data.summary}</p>
            <div className="mt-3 grid w-full grid-cols-3 gap-2">
            {data.metrics.map((metric) => {
              const Icon = statusIcons[metric.type];
              return (
                <div key={`${period}-${metric.type}`} className="rounded-xl bg-white px-2 py-2 text-center shadow-[0_8px_18px_rgba(136,54,66,0.06)]">
                  <p className="text-[14px] font-extrabold leading-none text-slate-900">{metric.value}</p>
                  <span className={`mx-auto mt-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${statusTones[metric.type]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-end gap-1.5 rounded-2xl bg-[#fff6f7] p-2.5">
          {data.bars.map((value, index) => (
            <div key={`${period}-${index}`} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-10 w-full items-end">
                <div
                  className={`w-full rounded-full ${index === data.bars.length - 1 ? 'bg-[#c95767]' : 'bg-[#efc3ca]'}`}
                  style={{ height: `${Math.max(value, 18)}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-400">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icon className="h-4 w-4 text-[#c95767]" />
          {title}
        </h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const taskEditorTabs = [
  { id: 'core', label: 'Info', icon: FileText },
  { id: 'description', label: 'Beschreibung', icon: FileText },
  { id: 'files', label: 'Dateien', icon: Paperclip },
  { id: 'comments', label: 'Kommentare', icon: MessageSquareMore },
  { id: 'organization', label: 'Organisation', icon: Tag },
  { id: 'linked', label: 'Verknüpfte Tickets', icon: Link2 },
  { id: 'banking', label: 'Banking Ready', icon: ShieldCheck },
  { id: 'audit', label: 'Audit-Spur', icon: History },
];

function TaskEditorTabList({ activeTab, onChange }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {taskEditorTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
              isActive
                ? 'border-[#d99faa] bg-[#fff1f3] text-[#b84758]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function TaskEditorModal({
  mode = 'detail',
  resetKey,
  form,
  projects,
  tags,
  linkedPeople,
  attachments,
  comments,
  auditTrail,
  relatedTasks = [],
  parentTask,
  childTasks = [],
  assignedByName,
  headerEyebrow,
  headerTitle,
  headerTicketNumber,
  commentDraft,
  tagDraft,
  personDraft,
  attachmentSource,
  attachmentType,
  onClose,
  onFormChange,
  onCommentChange,
  onCommentSubmit,
  onInsertMention,
  onTagDraftChange,
  onTagAdd,
  onTagRemove,
  onPersonDraftChange,
  onPersonAdd,
  onPersonRemove,
  onAttachmentSourceChange,
  onAttachmentTypeChange,
  onAttachmentFilesAdd,
  onAttachmentRemove,
  onParentTaskChange,
  onOpenRelatedTask,
  onSubmit,
  submitLabel,
  taskMarkers,
}) {
  if (!form) return null;

  const [activeTab, setActiveTab] = useState('core');
  const projectOptions = [...new Set([...projects.map((project) => project.name), form.project].filter(Boolean))];
  useEffect(() => {
    setActiveTab('core');
  }, [resetKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-[1180px] min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="flex-none border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c95767]">
                {headerEyebrow}
                {headerTicketNumber ? ` - ${headerTicketNumber}` : ''}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-950">{headerTitle}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Drawer schliessen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <TaskEditorTabList activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {activeTab === 'core' ? (
              <DetailBlock title="Info" icon={FileText}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Titel
                    <input
                      value={form.title}
                      onChange={(event) => onFormChange('title', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Projekt
                    <select
                      value={form.project}
                      onChange={(event) => onFormChange('project', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    >
                      {projectOptions.map((projectName) => (
                        <option key={projectName} value={projectName}>
                          {projectName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Status
                    <select
                      value={form.status}
                      onChange={(event) => onFormChange('status', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    >
                      {columns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Prioritaet
                    <select
                      value={form.priority}
                      onChange={(event) => onFormChange('priority', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    >
                      <option value="hoch">Hoch</option>
                      <option value="mittel">Mittel</option>
                      <option value="niedrig">Niedrig</option>
                    </select>
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Faelligkeit
                    <input
                      type="date"
                      value={form.dueDateValue}
                      onChange={(event) => onFormChange('dueDateValue', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Aufwand in Stunden
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={getEffortInputValue(form.estimatedHours, 'hours')}
                      onChange={(event) => onFormChange('estimatedHours', getEffortHoursFromInput(event.target.value, 'hours'))}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Aufwand in Tagen
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={getEffortInputValue(form.estimatedHours, 'days')}
                      onChange={(event) => onFormChange('estimatedHours', getEffortHoursFromInput(event.target.value, 'days'))}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Zuständige Person
                    <select
                      value={form.assignee}
                      onChange={(event) => onFormChange('assignee', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    >
                      {teamMembers.map((member) => (
                        <option key={member} value={member}>
                          {member}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Freigabe
                    <select
                      value={form.approvalLevel || 'none'}
                      onChange={(event) => onFormChange('approvalLevel', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    >
                      <option value="none">Keine Freigabe erforderlich</option>
                      <option value="department">Freigabe durch Abteilungsleiter</option>
                      <option value="gbl">Freigabe durch GBL</option>
                    </select>
                  </label>

                  <TaskMarkerField
                    value={form.markerId || ''}
                    markers={taskMarkers}
                    onChange={(value) => onFormChange('markerId', value)}
                  />
                </div>
              </DetailBlock>
            ) : null}

            {activeTab === 'description' ? (
              <DetailBlock title="Beschreibung" icon={FileText}>
                <textarea
                  value={form.description}
                  onChange={(event) => onFormChange('description', event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
              </DetailBlock>
            ) : null}

            {activeTab === 'files' ? (
              <DetailBlock
                title="Dateien und Evidenz"
                icon={Paperclip}
                action={
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    revisionssicher dokumentierbar
                  </span>
                }
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
                        <button
                          type="button"
                          onClick={() => onAttachmentRemove(attachment.id)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                        >
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
                    onChange={(event) => onAttachmentTypeChange(event.target.value)}
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
                    onChange={(event) => onAttachmentSourceChange(event.target.value)}
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
                        onAttachmentFilesAdd(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </DetailBlock>
            ) : null}

            {activeTab === 'comments' ? (
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
                  {teamMembers.map((member) => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => onInsertMention(member)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:text-[#b64454]"
                    >
                      @{member}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={commentDraft}
                    onChange={(event) => onCommentChange(event.target.value)}
                    placeholder="Kommentar oder Rückfrage eingeben"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                  />
                  <button
                    type="button"
                    onClick={onCommentSubmit}
                    className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Senden
                  </button>
                </div>
              </DetailBlock>
            ) : null}

            {activeTab === 'organization' ? (
              <DetailBlock title="Organisation" icon={Tag}>
                <div className="grid gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tags</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-[#b64454]"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => onTagRemove(tag)}
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
                        onChange={(event) => onTagDraftChange(event.target.value)}
                        placeholder="Neues Tag"
                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                      />
                      <button
                        type="button"
                        onClick={onTagAdd}
                        className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
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
                            onClick={() => onPersonRemove(person)}
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
                        onChange={(event) => onPersonDraftChange(event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                      >
                        {teamMembers.map((member) => (
                          <option key={member} value={member}>
                            {member}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={onPersonAdd}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        <UserPlus className="h-4 w-4" />
                        Verlinken
                      </button>
                    </div>
                  </div>
                </div>
              </DetailBlock>
            ) : null}

            {activeTab === 'linked' ? (
              <DetailBlock title="Verknüpfte Tickets" icon={Link2}>
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Übergeordnetes Ticket</p>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={form.parentTaskId || ''}
                        onChange={(event) => onParentTaskChange?.(event.target.value)}
                        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                      >
                        <option value="">Kein übergeordnetes Ticket</option>
                        {relatedTasks.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.ticketNumber} - {task.title}
                          </option>
                        ))}
                      </select>
                      {parentTask ? (
                        <button type="button" onClick={() => onParentTaskChange?.('')} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                          Trennen
                        </button>
                      ) : null}
                    </div>
                    {parentTask ? (
                      <button type="button" onClick={() => onOpenRelatedTask?.(parentTask)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[#d99faa] hover:bg-[#fff7f8]">
                        <span>
                          <span className="block text-xs font-bold text-[#b84758]">{parentTask.ticketNumber}</span>
                          <span className="mt-1 block text-sm font-bold text-slate-800">{parentTask.title}</span>
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Untertickets</p>
                    {childTasks.length ? (
                      <div className="mt-2 space-y-2">
                        {childTasks.map((task) => (
                          <button key={task.id} type="button" onClick={() => onOpenRelatedTask?.(task)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[#d99faa] hover:bg-[#fff7f8]">
                            <span>
                              <span className="block text-xs font-bold text-[#b84758]">{task.ticketNumber}</span>
                              <span className="mt-1 block text-sm font-bold text-slate-800">{task.title}</span>
                            </span>
                            <ArrowUpRight className="h-4 w-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl bg-white px-3 py-3 text-sm font-medium text-slate-500">Noch keine Untertickets verknüpft.</div>
                    )}
                  </div>
                </div>
              </DetailBlock>
            ) : null}

            {activeTab === 'banking' ? (
              <DetailBlock title="Banking Ready" icon={ShieldCheck}>
                <div className="grid gap-3">
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Datenklassifizierung
                    <select
                      value={form.classification}
                      onChange={(event) => onFormChange('classification', event.target.value)}
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
                      onChange={(event) => onFormChange('risk', event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    >
                      <option value="Niedrig">Niedrig</option>
                      <option value="Mittel">Mittel</option>
                      <option value="Hoch">Hoch</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Freigabeprozess
                    <input
                      value={form.approval}
                      onChange={(event) => onFormChange('approval', event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Evidenzhinweis
                    <textarea
                      value={form.evidence}
                      onChange={(event) => onFormChange('evidence', event.target.value)}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>
                </div>
              </DetailBlock>
            ) : null}

            {activeTab === 'audit' ? (
              <DetailBlock title="Audit-Spur" icon={History}>
                <div className="space-y-2">
                  {auditTrail.length ? (
                    auditTrail.map((entry) => (
                      <div key={entry} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                        {entry}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-white px-3 py-3 text-sm font-medium text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                      {mode === 'create' ? 'Die Audit-Spur startet automatisch nach dem Anlegen der Aufgabe.' : 'Noch keine Audit-Einträge vorhanden.'}
                    </div>
                  )}
                </div>
              </DetailBlock>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Schliessen
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="h-11 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [tasks, setTasks] = useState(() => withProjectTicketNumbers(initialTasks.map(normalizeFallbackTaskForMyTasks)));
  const [projects, setProjects] = useState(initialProjects);
  const [taskMarkers, setTaskMarkers] = useState(() => getStoredTaskMarkers());
  const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.id));
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [taskScope, setTaskScope] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [createMode, setCreateMode] = useState(null);
  const [detailForm, setDetailForm] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [personDraft, setPersonDraft] = useState(teamMembers[0]);
  const [attachmentSource, setAttachmentSource] = useState('SharePoint');
  const [attachmentType, setAttachmentType] = useState('Excel');
  const [performancePeriod, setPerformancePeriod] = useState('day');
  const [createTaskForm, setCreateTaskForm] = useState(() => buildCreateTaskForm(initialProjects[0]?.name || ''));
  const [createProjectForm, setCreateProjectForm] = useState(() => buildCreateProjectForm('Digitales Banking'));
  const routeTaskId = searchParams.get('taskId');
  const routeSearch = searchParams.get('search');
  const taskFocusToken = location.state?.focusTaskAt;
  const routedDashboardTask = location.state?.dashboardTask;

  const normalizedSearch = searchValue.trim().toLowerCase();
  const currentUserName = user?.name || 'Mara Stein';
  const projectDepartments = useMemo(
    () => [...new Set(projects.map((project) => project.department || 'Digitales Banking'))].map((name) => ({ id: name, name })),
    [projects],
  );
  const assignees = useMemo(
    () => [...new Set(tasks.map((task) => task.assignee).filter(Boolean))].sort(),
    [tasks],
  );
  const activePersonFilter = assignees.includes(selectedPerson) ? selectedPerson : '';
  const scopedTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesScope =
          taskScope === 'all' ||
          (taskScope === 'mine' && task.assignee === currentUserName);
        const matchesPerson = !activePersonFilter || task.assignee === activePersonFilter;
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        return matchesScope && matchesPerson && matchesStatus;
      }),
    [activePersonFilter, currentUserName, statusFilter, taskScope, tasks],
  );
  const visibleTasks = useMemo(
    () =>
      normalizedSearch
        ? scopedTasks.filter(
            (task) =>
              task.title.toLowerCase().includes(normalizedSearch) ||
              task.project.toLowerCase().includes(normalizedSearch),
          )
        : scopedTasks,
    [normalizedSearch, scopedTasks],
  );
  const orderedColumns = useMemo(
    () => columnOrder.map((columnId) => columns.find((column) => column.id === columnId)).filter(Boolean),
    [columnOrder],
  );
  const completionRate = useMemo(() => {
    if (!visibleTasks.length) return 0;
    const completedTasks = visibleTasks.filter((task) => task.status === 'done').length;
    return Math.round((completedTasks / visibleTasks.length) * 100);
  }, [visibleTasks]);
  const hasActiveBoardFilters = taskScope !== 'all' || statusFilter !== 'all' || activePersonFilter !== '';
  const activeScopeValue = taskScope === 'mine' ? 'mine' : 'all';

  const statGroups = [
    {
      id: 'open',
      title: 'Meine offenen Aufgaben',
      value: tasks.filter((task) => task.status !== 'done').length,
      subtitle: 'aktuell aktiv',
      icon: ListChecks,
      iconTone: 'bg-white/85 text-[#2f7d68]',
      cardTone: 'border-slate-300 bg-[#eefbf6]',
      items: tasks.filter((task) => task.status !== 'done'),
    },
    {
      id: 'today',
      title: 'Heute fällig',
      value: tasks.filter((task) => task.status === 'today').length,
      subtitle: 'sofort prüfen',
      icon: CalendarDays,
      iconTone: 'bg-white/85 text-[#c26a34]',
      cardTone: 'border-slate-300 bg-[#fff7ee]',
      items: tasks.filter((task) => task.status === 'today'),
    },
    {
      id: 'review',
      title: 'Warten auf Review',
      value: tasks.filter((task) => task.status === 'review').length,
      subtitle: 'Feedback offen',
      icon: ShieldCheck,
      iconTone: 'bg-white/85 text-[#4875c8]',
      cardTone: 'border-slate-300 bg-[#f2f7ff]',
      items: tasks.filter((task) => task.status === 'review'),
    },
    {
      id: 'blocked',
      title: 'Blockiert',
      value: tasks.filter((task) => task.status === 'blocked').length,
      subtitle: 'muss gelöst werden',
      icon: CircleAlert,
      iconTone: 'bg-white/85 text-[#c24452]',
      cardTone: 'border-slate-300 bg-[#fff1f4]',
      items: tasks.filter((task) => task.status === 'blocked'),
    },
  ];

  useEffect(() => {
    const handleTaskMarkerChange = (event) => {
      setTaskMarkers(event.detail || getStoredTaskMarkers());
    };

    window.addEventListener('nexttask:task-markers-change', handleTaskMarkerChange);

    return () => {
      window.removeEventListener('nexttask:task-markers-change', handleTaskMarkerChange);
    };
  }, []);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const activeStat = activePopup?.type === 'stat' ? statGroups.find((stat) => stat.id === activePopup.statId) : null;
  const relatedTasks = tasks.filter((task) => task.id !== selectedTaskId);
  const parentTask = selectedTask?.parentTaskId ? tasks.find((task) => task.id === selectedTask.parentTaskId) : null;
  const childTasks = selectedTask ? tasks.filter((task) => task.parentTaskId === selectedTask.id) : [];

  const openTask = (task) => {
    setActivePopup(null);
    setSelectedTaskId(task.id);
    setDetailForm({
      title: task.title,
      project: task.project,
      status: task.status,
      priority: task.priority,
      dueDateValue: task.dueDateValue || '',
      estimatedHours: task.estimatedHours ?? '',
      assignee: task.assignee,
      description: task.description || '',
      classification: task.compliance?.classification || 'Intern',
      risk: task.compliance?.risk || 'Niedrig',
      controlId: task.compliance?.controlId || task.id,
      approval: task.compliance?.approval || 'Noch keine Freigabe hinterlegt',
      evidence: task.compliance?.evidence || 'Noch kein Evidenznachweis hinterlegt',
      markerId: task.markerId || '',
      approvalLevel: task.approvalLevel || 'none',
      ticketNumber: task.ticketNumber,
      parentTaskId: task.parentTaskId || '',
    });
    setCommentDraft('');
    setTagDraft('');
    setPersonDraft(teamMembers[0]);
    setAttachmentSource('SharePoint');
    setAttachmentType('Excel');
  };

  useEffect(() => {
    if (routeSearch) {
      setSearchValue((current) => (current === routeSearch ? current : routeSearch));
      return;
    }

    if (routeTaskId) {
      setSearchValue('');
    }
  }, [routeSearch, routeTaskId]);

  useEffect(() => {
    if (!routeTaskId) return undefined;

    const existingTask = tasks.find((task) => task.id === routeTaskId);

    if (routedDashboardTask?.id === routeTaskId) {
      if (!existingTask) {
        setTasks((current) => {
          const nextTask = normalizeFallbackTaskForMyTasks(routedDashboardTask);
          return [{ ...nextTask, ticketNumber: getNextTicketNumber(current, nextTask.project) }, ...current];
        });
      }
      return undefined;
    }

    if (existingTask) return undefined;

    const fallbackTask = dashboardFallbackTasks.find((task) => task.id === routeTaskId);
    if (fallbackTask) {
      setTasks((current) => {
        const nextTask = normalizeFallbackTaskForMyTasks(fallbackTask);
        return [{ ...nextTask, ticketNumber: getNextTicketNumber(current, nextTask.project) }, ...current];
      });
      return undefined;
    }

    let cancelled = false;

    api
      .get('/calendar/tasks', { params: { taskId: routeTaskId } })
      .then(({ data }) => {
        const apiTask = Array.isArray(data) ? data[0] : null;
        if (cancelled || !apiTask) return;

        setTasks((current) => {
          const nextTask = normalizeApiTaskForMyTasks(apiTask);
          return current.some((task) => task.id === apiTask.id)
            ? current.map((task) => (task.id === apiTask.id ? { ...nextTask, ticketNumber: task.ticketNumber || getNextTicketNumber(current, nextTask.project) } : task))
            : [{ ...nextTask, ticketNumber: getNextTicketNumber(current, nextTask.project) }, ...current];
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [routeTaskId, routedDashboardTask, tasks]);

  useEffect(() => {
    if (!routeTaskId) return;

    const task = tasks.find((item) => item.id === routeTaskId);
    if (!task) return;

    openTask(task);
  }, [routeTaskId, taskFocusToken, tasks]);

  const searchSuggestions = normalizedSearch
    ? visibleTasks.map((task) => ({
        id: `task-${task.id}`,
        type: 'Aufgabe',
        label: task.title,
        meta: `${task.project} - ${task.assignee || 'ohne Person'}`,
        onSelect: () => openTask(task),
      }))
    : [];

  const closeTask = () => {
    setSelectedTaskId(null);
    setDetailForm(null);
    setCommentDraft('');
    setTagDraft('');
  };

  const handleDetailFormChange = (field, value) => {
    setDetailForm((current) => ({ ...current, [field]: value }));
  };

  const updateSelectedTask = (updater) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === selectedTaskId ? updater(task) : task)),
    );
  };

  const handleSave = () => {
    if (!selectedTaskId || !detailForm?.title.trim()) return;

    updateSelectedTask((task) => ({
      ...task,
      title: detailForm.title.trim(),
      project: detailForm.project.trim(),
      status: detailForm.status,
      priority: detailForm.priority,
      markerId: detailForm.markerId || undefined,
      dueDateValue: detailForm.dueDateValue,
      dueDate: formatDateLabel(detailForm.dueDateValue),
      estimatedHours: detailForm.estimatedHours === '' ? null : Number(detailForm.estimatedHours),
      assignee: detailForm.assignee,
      approvalLevel: detailForm.approvalLevel || 'none',
      description: detailForm.description.trim(),
      note: detailForm.description.trim() || task.note,
      compliance: {
        classification: detailForm.classification,
        risk: detailForm.risk,
        controlId: detailForm.controlId.trim(),
        approval: detailForm.approval.trim(),
        evidence: detailForm.evidence.trim(),
      },
      parentTaskId: detailForm.parentTaskId || '',
      auditTrail: [`${formatDateLabel('2026-05-16')}: Ticketdetails aktualisiert.`, ...task.auditTrail],
    }));
    closeTask();
  };

  const handleCommentSubmit = () => {
    if (!selectedTaskId || !commentDraft.trim()) return;
    updateSelectedTask((task) => ({
      ...task,
      comments: [
        ...task.comments,
        { id: `comment-${Date.now()}`, author: 'Elisabeth Bezverkha', time: 'gerade eben', text: commentDraft.trim() },
      ],
      auditTrail: [`${formatDateLabel('2026-05-16')}: Kommentar hinzugefuegt.`, ...task.auditTrail],
    }));
    setCommentDraft('');
  };

  const handleInsertMention = (member) => {
    setCommentDraft((current) => `${current}${current ? ' ' : ''}@${member} `);
  };

  const handleTagAdd = () => {
    if (!selectedTaskId || !tagDraft.trim()) return;
    updateSelectedTask((task) =>
      task.tags.includes(tagDraft.trim())
        ? task
        : {
            ...task,
            tags: [...task.tags, tagDraft.trim()],
            auditTrail: [`${formatDateLabel('2026-05-16')}: Tag "${tagDraft.trim()}" hinzugefuegt.`, ...task.auditTrail],
          },
    );
    setTagDraft('');
  };

  const handleTagRemove = (tagToRemove) => {
    updateSelectedTask((task) => ({
      ...task,
      tags: task.tags.filter((tag) => tag !== tagToRemove),
      auditTrail: [`${formatDateLabel('2026-05-16')}: Tag "${tagToRemove}" entfernt.`, ...task.auditTrail],
    }));
  };

  const handlePersonAdd = () => {
    if (!selectedTaskId || !personDraft) return;
    updateSelectedTask((task) =>
      task.linkedPeople.includes(personDraft)
        ? task
        : {
            ...task,
            linkedPeople: [...task.linkedPeople, personDraft],
            auditTrail: [`${formatDateLabel('2026-05-16')}: Mitarbeitende Person "${personDraft}" verlinkt.`, ...task.auditTrail],
          },
    );
  };

  const handlePersonRemove = (personToRemove) => {
    updateSelectedTask((task) => ({
      ...task,
      linkedPeople: task.linkedPeople.filter((person) => person !== personToRemove),
      auditTrail: [`${formatDateLabel('2026-05-16')}: Mitarbeitende Person "${personToRemove}" entfernt.`, ...task.auditTrail],
    }));
  };

  const handleAttachmentFilesAdd = (files) => {
    const nextFiles = Array.from(files || []);
    if (!selectedTaskId || !nextFiles.length) return;

    updateSelectedTask((task) => ({
      ...task,
      attachments: [
        ...task.attachments,
        ...nextFiles.map((file) => ({
          id: `attachment-${file.name}-${Date.now()}`,
          name: file.name,
          type: attachmentType,
          source: attachmentSource,
          owner: 'Elisabeth Bezverkha',
        })),
      ],
      auditTrail: [`${formatDateLabel('2026-05-16')}: ${nextFiles.length} Datei(en) als Evidenz verknüpft.`, ...task.auditTrail],
    }));
  };

  const handleAttachmentRemove = (attachmentId) => {
    updateSelectedTask((task) => ({
      ...task,
      attachments: task.attachments.filter((attachment) => attachment.id !== attachmentId),
      auditTrail: [`${formatDateLabel('2026-05-16')}: Eine Evidenzdatei entfernt.`, ...task.auditTrail],
    }));
  };

  const moveColumn = (targetColumnId) => {
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;

    setColumnOrder((currentOrder) => {
      const nextOrder = currentOrder.filter((columnId) => columnId !== draggedColumnId);
      const targetIndex = nextOrder.indexOf(targetColumnId);
      nextOrder.splice(targetIndex, 0, draggedColumnId);
      return nextOrder;
    });
    setDraggedColumnId(null);
  };

  const handleCreateAction = (item) => {
    if (item === 'Neue Aufgabe') {
      setCreateTaskForm({
        ...buildCreateTaskForm(projects[0]?.name || '', currentUserName),
        ticketNumber: getNextTicketNumber(tasks, projects[0]?.name || ''),
      });
      setCommentDraft('');
      setTagDraft('');
      setPersonDraft(teamMembers[0]);
      setAttachmentSource('SharePoint');
      setAttachmentType('Excel');
      setCreateMode('task');
    }

    if (item === 'Neues Projekt') {
      setCreateProjectForm(buildCreateProjectForm(projectDepartments[0]?.id || 'Digitales Banking'));
      setCreateMode('project');
    }
  };

  const handleCreateTaskFormChange = (field, value) => {
    setCreateTaskForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateCommentSubmit = () => {
    if (!commentDraft.trim()) return;
    setCreateTaskForm((current) => ({
      ...current,
      comments: [
        ...(current.comments || []),
        { id: `comment-${Date.now()}`, author: currentUserName, time: 'gerade eben', text: commentDraft.trim() },
      ],
      auditTrail: [`${formatDateLabel('2026-08-19')}: Kommentar zur neuen Aufgabe ergänzt.`, ...(current.auditTrail || [])],
    }));
    setCommentDraft('');
  };

  const handleCreateInsertMention = (member) => {
    setCommentDraft((current) => `${current}${current ? ' ' : ''}@${member} `);
  };

  const handleCreateTagAdd = () => {
    const nextTag = tagDraft.trim();
    if (!nextTag) return;

    setCreateTaskForm((current) =>
      (current.tags || []).includes(nextTag)
        ? current
        : {
            ...current,
            tags: [...(current.tags || []), nextTag],
            auditTrail: [`${formatDateLabel('2026-08-19')}: Tag "${nextTag}" vorgemerkt.`, ...(current.auditTrail || [])],
          },
    );
    setTagDraft('');
  };

  const handleCreateTagRemove = (tagToRemove) => {
    setCreateTaskForm((current) => ({
      ...current,
      tags: (current.tags || []).filter((tag) => tag !== tagToRemove),
      auditTrail: [`${formatDateLabel('2026-08-19')}: Tag "${tagToRemove}" entfernt.`, ...(current.auditTrail || [])],
    }));
  };

  const handleCreatePersonAdd = () => {
    if (!personDraft) return;

    setCreateTaskForm((current) =>
      (current.linkedPeople || []).includes(personDraft)
        ? current
        : {
            ...current,
            linkedPeople: [...(current.linkedPeople || []), personDraft],
            auditTrail: [`${formatDateLabel('2026-08-19')}: Mitarbeitende Person "${personDraft}" verlinkt.`, ...(current.auditTrail || [])],
          },
    );
  };

  const handleCreatePersonRemove = (personToRemove) => {
    setCreateTaskForm((current) => ({
      ...current,
      linkedPeople: (current.linkedPeople || []).filter((person) => person !== personToRemove),
      auditTrail: [`${formatDateLabel('2026-08-19')}: Mitarbeitende Person "${personToRemove}" entfernt.`, ...(current.auditTrail || [])],
    }));
  };

  const handleCreateAttachmentFilesAdd = (files) => {
    const nextFiles = Array.from(files || []);
    if (!nextFiles.length) return;

    setCreateTaskForm((current) => ({
      ...current,
      attachments: [
        ...(current.attachments || []),
        ...nextFiles.map((file) => ({
          id: `attachment-${file.name}-${Date.now()}`,
          name: file.name,
          type: attachmentType,
          source: attachmentSource,
          owner: currentUserName,
        })),
      ],
      auditTrail: [`${formatDateLabel('2026-08-19')}: ${nextFiles.length} Datei(en) vorgemerkt.`, ...(current.auditTrail || [])],
    }));
  };

  const handleCreateAttachmentRemove = (attachmentId) => {
    setCreateTaskForm((current) => ({
      ...current,
      attachments: (current.attachments || []).filter((attachment) => attachment.id !== attachmentId),
      auditTrail: [`${formatDateLabel('2026-08-19')}: Eine vorgemerkte Datei entfernt.`, ...(current.auditTrail || [])],
    }));
  };

  const handleCreateProjectFormChange = (field, value) => {
    setCreateProjectForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateProjectSubmit = () => {
    const trimmedName = createProjectForm.name.trim();
    if (!trimmedName) return;

    const projectExists = projects.some((project) => project.name.toLowerCase() === trimmedName.toLowerCase());
    if (projectExists) {
      setCreateMode(null);
      return;
    }

    const nextProject = {
      id: `project-${Date.now()}`,
      name: trimmedName,
      scope: createProjectForm.visibility === 'Abteilung' ? 'abteilung' : 'persönlich',
      department: createProjectForm.departmentId || 'Digitales Banking',
      owner: createProjectForm.owner.trim() || 'Elisabeth Bezverkha',
      deputyLead: createProjectForm.deputyLead.trim(),
      projectSponsor: createProjectForm.projectSponsor.trim(),
      description: createProjectForm.summary.trim(),
      projectData: createProjectForm,
    };

    setProjects((current) => [nextProject, ...current]);
    setCreateTaskForm((current) => ({ ...current, project: nextProject.name }));
    setCreateMode(null);
  };

  const handleCreateTaskSubmit = () => {
    const trimmedTitle = createTaskForm.title.trim();
    if (!trimmedTitle || !createTaskForm.project) return;

    const dueDateLabel = formatDateLabel(createTaskForm.dueDateValue);
    const note = createTaskForm.description.trim() || 'Neu angelegte Aufgabe wartet auf weitere Details.';

    const nextTask = {
      id: `my-task-${Date.now()}`,
      ticketNumber: createTaskForm.ticketNumber || getNextTicketNumber(tasks, createTaskForm.project),
      title: trimmedTitle,
      status: createTaskForm.status,
      project: createTaskForm.project,
      priority: createTaskForm.priority,
      markerId: createTaskForm.markerId || undefined,
      dueDate: dueDateLabel,
      dueDateValue: createTaskForm.dueDateValue,
      estimatedHours: createTaskForm.estimatedHours === '' ? null : Number(createTaskForm.estimatedHours),
      progress: 0,
      checklist: '0/3 erledigt',
      note,
      description: note,
      assignee: createTaskForm.assignee,
      approvalLevel: createTaskForm.approvalLevel || 'none',
      assignedBy: createTaskForm.assignedBy || buildAssignedBy(currentUserName),
      tags: createTaskForm.tags?.length ? createTaskForm.tags : ['Neu'],
      linkedPeople: createTaskForm.linkedPeople || [],
      attachments: createTaskForm.attachments || [],
      comments: createTaskForm.comments || [],
      parentTaskId: createTaskForm.parentTaskId || '',
      compliance: {
        classification: createTaskForm.classification || 'Intern',
        risk: createTaskForm.risk || 'Niedrig',
        controlId: createTaskForm.controlId?.trim() || `CTRL-NEW-${String(Date.now()).slice(-4)}`,
        approval: createTaskForm.approval?.trim() || 'Noch kein Freigabeprozess definiert',
        evidence: createTaskForm.evidence?.trim() || 'Noch keine Evidenz hinterlegt',
      },
      auditTrail: [`${formatDateLabel('2026-08-19')}: Aufgabe neu erstellt.`, ...(createTaskForm.auditTrail || [])],
    };

    setTasks((current) => [nextTask, ...current]);
    setCreateMode(null);
  };

  return (
    <AppShell
      activeItem="Aufgaben"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Aufgaben"
      createMenuItems={createMenuItems}
      onCreateAction={handleCreateAction}
      searchValue={searchValue}
      onSearch={setSearchValue}
      searchSuggestions={searchSuggestions}
    >
      <div className="space-y-4 px-4 py-4 xl:px-6">
        <SummaryStrip
          stats={statGroups}
          controlCount={controlFeed.length}
          performanceValue={completionRate}
          onOpenStat={(stat) => setActivePopup({ type: 'stat', statId: stat.id })}
          onOpenControls={() => setActivePopup({ type: 'controls' })}
          onOpenPerformance={() => setActivePopup({ type: 'performance' })}
        />

        <section className="rounded-2xl border border-slate-300 bg-white p-3.5 shadow-[0_16px_40px_rgba(136,54,66,0.08)]">
          <div className="rounded-2xl border border-[#f2d8dd] bg-[#fff8f9] p-3">
            <div className="rounded-[18px] border border-white/80 bg-white/60 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
              <div className="flex flex-wrap items-end gap-2 xl:flex-nowrap">
                <TaskFilterField
                  label="Aufgabenbereich"
                  value={activeScopeValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === 'mine') {
                      setTaskScope('mine');
                      return;
                    }
                    setTaskScope('all');
                  }}
                >
                  <option value="all">Alle Aufgaben</option>
                  <option value="mine">Meine Aufgaben</option>
                </TaskFilterField>

                <TaskFilterField label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {boardStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </TaskFilterField>

                <TaskFilterField label="Person" value={activePersonFilter} onChange={(event) => setSelectedPerson(event.target.value)}>
                  <option value="">Alle Personen</option>
                  {assignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </TaskFilterField>

                <div className="min-w-[180px] flex-1 space-y-1.5 xl:max-w-[220px]">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Filter</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskScope('all');
                      setSelectedPerson('');
                      setStatusFilter('all');
                    }}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {orderedColumns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  tasks={visibleTasks.filter((task) => task.status === column.id)}
                  onOpenTask={openTask}
                  onDragStart={setDraggedColumnId}
                  onDragOver={() => {}}
                  onDrop={moveColumn}
                  isDragged={draggedColumnId === column.id}
                />
              ))}
            </div>
          </div>
          {!visibleTasks.length ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-slate-700">Keine Aufgaben gefunden</p>
              <p className="mt-1 text-sm text-slate-500">
                {normalizedSearch || hasActiveBoardFilters
                  ? 'Passe Suche oder Filter an, um wieder Aufgaben im Board anzuzeigen.'
                  : 'Im Moment sind keine Aufgaben für diese Ansicht vorhanden.'}
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {activeStat ? (
        <TaskCollectionPopup
          title={activeStat.title}
          subtitle={`${activeStat.value} passende Tickets`}
          tasks={activeStat.items}
          onClose={() => setActivePopup(null)}
          onOpenTask={openTask}
        />
      ) : null}
      {activePopup?.type === 'controls' ? (
        <ControlsPopup items={controlFeed} tasks={tasks} onClose={() => setActivePopup(null)} onOpenTask={openTask} />
      ) : null}
      {activePopup?.type === 'performance' ? (
        <PopupShell
          title="Leistungsüberblick"
          subtitle="Tag, Woche, Monat und Jahr direkt vergleichen"
          onClose={() => setActivePopup(null)}
          maxWidth="max-w-2xl"
        >
          <PerformanceCard period={performancePeriod} onPeriodChange={setPerformancePeriod} />
        </PopupShell>
      ) : null}
      {createMode === 'task' ? (
        <CreateTaskModal
          projects={projects}
          relatedTasks={tasks}
          form={createTaskForm}
          taskMarkers={taskMarkers}
          commentDraft={commentDraft}
          tagDraft={tagDraft}
          personDraft={personDraft}
          attachmentSource={attachmentSource}
          attachmentType={attachmentType}
          onChange={handleCreateTaskFormChange}
          onClose={() => setCreateMode(null)}
          onSubmit={handleCreateTaskSubmit}
          onCommentChange={setCommentDraft}
          onCommentSubmit={handleCreateCommentSubmit}
          onInsertMention={handleCreateInsertMention}
          onTagDraftChange={setTagDraft}
          onTagAdd={handleCreateTagAdd}
          onTagRemove={handleCreateTagRemove}
          onPersonDraftChange={setPersonDraft}
          onPersonAdd={handleCreatePersonAdd}
          onPersonRemove={handleCreatePersonRemove}
          onAttachmentSourceChange={setAttachmentSource}
          onAttachmentTypeChange={setAttachmentType}
          onAttachmentFilesAdd={handleCreateAttachmentFilesAdd}
          onAttachmentRemove={handleCreateAttachmentRemove}
          onParentTaskChange={(value) => handleCreateTaskFormChange('parentTaskId', value)}
          onOpenRelatedTask={openTask}
        />
      ) : null}
      {createMode === 'project' ? (
        <ProjectsCreateProjectModal
          departments={projectDepartments}
          form={createProjectForm}
          onChange={handleCreateProjectFormChange}
          onClose={() => setCreateMode(null)}
          onSubmit={handleCreateProjectSubmit}
        />
      ) : null}
      <TaskEditorModal
        mode="detail"
        resetKey={selectedTask?.id}
        form={detailForm}
        projects={projects}
        tags={selectedTask?.tags || []}
        linkedPeople={selectedTask?.linkedPeople || []}
        attachments={selectedTask?.attachments || []}
        comments={selectedTask?.comments || []}
        auditTrail={selectedTask?.auditTrail || []}
        relatedTasks={relatedTasks}
        parentTask={parentTask}
        childTasks={childTasks}
        assignedByName={selectedTask?.assignedBy?.name}
        headerEyebrow="Ticket Details"
        headerTitle={selectedTask?.title || 'Ticket'}
        headerTicketNumber={selectedTask?.ticketNumber}
        commentDraft={commentDraft}
        tagDraft={tagDraft}
        personDraft={personDraft}
        attachmentSource={attachmentSource}
        attachmentType={attachmentType}
        onClose={closeTask}
        onFormChange={handleDetailFormChange}
        onCommentChange={setCommentDraft}
        onCommentSubmit={handleCommentSubmit}
        onInsertMention={handleInsertMention}
        onTagDraftChange={setTagDraft}
        onTagAdd={handleTagAdd}
        onTagRemove={handleTagRemove}
        onPersonDraftChange={setPersonDraft}
        onPersonAdd={handlePersonAdd}
        onPersonRemove={handlePersonRemove}
        onAttachmentSourceChange={setAttachmentSource}
        onAttachmentTypeChange={setAttachmentType}
        onAttachmentFilesAdd={handleAttachmentFilesAdd}
        onAttachmentRemove={handleAttachmentRemove}
        onParentTaskChange={(value) => handleDetailFormChange('parentTaskId', value)}
        onOpenRelatedTask={openTask}
        onSubmit={handleSave}
        submitLabel="Details speichern"
        taskMarkers={taskMarkers}
      />
    </AppShell>
  );
}
