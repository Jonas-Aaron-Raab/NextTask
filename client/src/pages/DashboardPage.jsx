import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CalendarClock, CheckSquare, CircleAlert, LayoutDashboard } from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { getEffectiveRoleForUser } from '../data/bankOrganization';
import { effortUnitOptions, formatEffort, sumEffortHours } from '../utils/effort';
import { initialTasks } from './MyTasksPage';
import { initialBacklogTasks, initialDepartments, initialProjects } from './ProjectsPage';

const dashboardSelectClass =
  'h-11 min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12';

const priorityWeight = {
  hoch: 3,
  mittel: 2,
  niedrig: 1,
};

const statusMeta = {
  today: { label: 'Heute', tone: 'bg-[#c97a11]', track: 'bg-[#f7ead8]' },
  'in-progress': { label: 'In Arbeit', tone: 'bg-[#4875c8]', track: 'bg-[#e6eefc]' },
  review: { label: 'Review', tone: 'bg-[#7c59dc]', track: 'bg-[#efe9ff]' },
  blocked: { label: 'Blockiert', tone: 'bg-[#b84758]', track: 'bg-[#fdecef]' },
};

const departmentByAssignee = {
  'Lisa Wagner': 'Digitales Banking',
  'Markus Klein': 'Digitale Vertriebskanaele',
  'Anna Becker': 'Produkt und Compliance',
  'Tom Becker': 'Qualitaetssicherung',
  'Sarah Nguyen': 'Marketing und Content',
  'Elisabeth Bezverkha': 'Digitales Banking',
  'Nina Hoffmann': 'Kundenservice',
};

const statusOrder = ['today', 'in-progress', 'review', 'blocked'];
const deadlineMeta = [
  { key: 'overdue', label: 'Ueberfaellig', tone: 'bg-[#b84758]', track: 'bg-[#fdecef]' },
  { key: 'today', label: 'Heute', tone: 'bg-[#c97a11]', track: 'bg-[#f7ead8]' },
  { key: 'soon', label: 'Kurz davor', tone: 'bg-[#4875c8]', track: 'bg-[#e6eefc]' },
  { key: 'later', label: 'Spaeter', tone: 'bg-slate-400', track: 'bg-slate-100' },
];

function parseGermanDate(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value).getTime();
  }

  const months = {
    januar: 0,
    februar: 1,
    maerz: 2,
    april: 3,
    mai: 4,
    juni: 5,
    juli: 6,
    august: 7,
    september: 8,
    oktober: 9,
    november: 10,
    dezember: 11,
  };

  const normalized = value
    .toLowerCase()
    .replace('märz', 'maerz')
    .replace(/\./g, '')
    .trim();
  const [day, monthName, year] = normalized.split(/\s+/);
  const monthIndex = months[monthName];

  if (!day || monthIndex === undefined || !year) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(Number(year), monthIndex, Number(day)).getTime();
}

function sortByUrgency(left, right) {
  const priorityDelta = (priorityWeight[right.priority] || 0) - (priorityWeight[left.priority] || 0);
  if (priorityDelta !== 0) return priorityDelta;

  const dateDelta = parseGermanDate(left.dueDateValue || left.dueDate) - parseGermanDate(right.dueDateValue || right.dueDate);
  if (dateDelta !== 0) return dateDelta;

  return left.title.localeCompare(right.title, 'de');
}

function getTaskDepartment(task, departmentByProjectName) {
  return task.department || departmentByProjectName[task.project] || departmentByAssignee[task.assignee] || 'Ohne Abteilung';
}

function normalizeDashboardStatus(status) {
  const map = {
    OPEN: 'today',
    IN_PROGRESS: 'in-progress',
    QA: 'review',
    BLOCKED: 'blocked',
    DONE: 'done',
    today: 'today',
    'in-progress': 'in-progress',
    review: 'review',
    blocked: 'blocked',
    done: 'done',
  };

  return map[status] || 'today';
}

function normalizeDashboardPriority(priority) {
  const map = {
    LOW: 'niedrig',
    MEDIUM: 'mittel',
    HIGH: 'hoch',
    URGENT: 'hoch',
    niedrig: 'niedrig',
    mittel: 'mittel',
    hoch: 'hoch',
  };

  return map[priority] || 'mittel';
}

function toDateValue(value) {
  if (!value) return '';
  const textValue = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(textValue) ? textValue.slice(0, 10) : textValue;
}

function normalizeApiTaskForDashboard(task) {
  const dueDateValue = toDateValue(task.dueDate || task.endDate || task.startDate);
  const projectName = task.project?.name || task.project || 'Ohne Projekt';
  const assignee = task.assignee?.name || task.assigneeName || task.assignee || '';

  return {
    id: task.id,
    title: task.title,
    status: normalizeDashboardStatus(task.status),
    project: projectName,
    priority: normalizeDashboardPriority(task.priority),
    dueDate: dueDateValue || 'Ohne Frist',
    dueDateValue,
    estimatedHours: task.estimatedHours ?? null,
    note: task.description || task.note || '',
    assigneeId: task.assignee?.id || task.assigneeId || '',
    assigneeEmail: task.assignee?.email || '',
    assignee,
    department: task.department || task.assignee?.department || '',
  };
}

function isAssignedToUser(task, user, currentAssignee) {
  if (user?.id && task.assigneeId === user.id) return true;
  if (user?.email && task.assigneeEmail === user.email) return true;
  return Boolean(currentAssignee && task.assignee === currentAssignee);
}

function canFilterDepartments(role) {
  return ['GBL', 'GPL'].includes(role?.kind) || String(role?.code || '').startsWith('GBL') || String(role?.code || '').startsWith('GPL');
}

function getDaysUntilDue(task) {
  const dueTime = parseGermanDate(task.dueDateValue || task.dueDate);
  if (!Number.isFinite(dueTime)) return Number.POSITIVE_INFINITY;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((dueTime - today.getTime()) / 86400000);
}

function getDeadlineBucket(task) {
  const daysUntilDue = getDaysUntilDue(task);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue === 0) return 'today';
  if (daysUntilDue <= 7) return 'soon';
  return 'later';
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[1.35rem] font-black tracking-tight text-slate-950">{title}</h2>
      {action ? <div className="text-sm font-semibold text-slate-400">{action}</div> : null}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('Alle Abteilungen');
  const [activeDashboardTab, setActiveDashboardTab] = useState('overview');
  const [workloadUnit, setWorkloadUnit] = useState('hours');
  const [apiPersonalTasks, setApiPersonalTasks] = useState(null);
  const currentAssignee = user?.name || 'Teammitglied';
  const effectiveRole = useMemo(() => getEffectiveRoleForUser(user), [user]);
  const showDepartmentFilter = canFilterDepartments(effectiveRole);

  useEffect(() => {
    if (!user?.id) {
      setApiPersonalTasks(null);
      return undefined;
    }

    let cancelled = false;

    const loadPersonalTasks = async () => {
      try {
        const { data } = await api.get('/calendar/tasks', { params: { mineOnly: true } });
        if (cancelled) return;

        setApiPersonalTasks(Array.isArray(data) ? data.map(normalizeApiTaskForDashboard) : []);
      } catch {
        if (!cancelled) setApiPersonalTasks(null);
      }
    };

    loadPersonalTasks();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const searchTerm = searchValue.trim().toLowerCase();
  const departmentByProjectName = useMemo(() => {
    return Object.fromEntries(
      initialProjects.map((project) => {
        const department = initialDepartments.find((item) => item.id === project.departmentId);
        return [project.name, department?.name || 'Ohne Abteilung'];
      }),
    );
  }, []);

  const departmentOptions = useMemo(() => {
    const values = new Set(['Alle Abteilungen']);
    initialDepartments.forEach((department) => values.add(department.name));
    initialTasks.forEach((task) => {
      const name = getTaskDepartment(task, departmentByProjectName);
      if (name) values.add(name);
    });
    return [...values];
  }, [departmentByProjectName]);

  const openTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      if (task.status === 'done') return false;
      if (selectedDepartment === 'Alle Abteilungen') return true;
      const departmentName = getTaskDepartment(task, departmentByProjectName);
      return departmentName === selectedDepartment;
    });
  }, [departmentByProjectName, selectedDepartment]);

  const personalOpenTasks = useMemo(() => {
    const sourceTasks = apiPersonalTasks || openTasks;

    return sourceTasks.filter((task) => {
      if (task.status === 'done') return false;
      if (!isAssignedToUser(task, user, currentAssignee)) return false;
      if (selectedDepartment === 'Alle Abteilungen') return true;

      const departmentName = getTaskDepartment(task, departmentByProjectName);
      return departmentName === selectedDepartment;
    });
  }, [apiPersonalTasks, currentAssignee, departmentByProjectName, openTasks, selectedDepartment, user]);

  const visibleProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      if (selectedDepartment === 'Alle Abteilungen') return true;
      const department = initialDepartments.find((item) => item.id === project.departmentId);
      return department?.name === selectedDepartment;
    });
  }, [selectedDepartment]);

  const focusTasks = useMemo(() => {
    const baseTasks = [...openTasks].sort(sortByUrgency);

    if (!searchTerm) return baseTasks.slice(0, 4);

    return baseTasks.filter((task) =>
      [task.title, task.project, task.note, task.assignee].join(' ').toLowerCase().includes(searchTerm),
    );
  }, [openTasks, searchTerm]);

  const attentionItems = useMemo(() => {
    const flagged = openTasks.filter((task) => ['blocked', 'review'].includes(task.status)).sort(sortByUrgency);

    if (!searchTerm) return flagged.slice(0, 4);

    return flagged.filter((task) => [task.title, task.project, task.note].join(' ').toLowerCase().includes(searchTerm));
  }, [openTasks, searchTerm]);

  const departmentCards = useMemo(() => {
    const cards = initialDepartments.map((department) => {
      const departmentProjects = visibleProjects.filter((project) => project.departmentId === department.id);
      const projectIds = departmentProjects.map((project) => project.id);
      const departmentBacklog = initialBacklogTasks.filter((task) => projectIds.includes(task.projectId));
      const openBacklogCount = departmentBacklog.filter((task) => task.status !== 'done').length;
      const reviewCount = departmentBacklog.filter((task) => task.status === 'review').length;

      return {
        ...department,
        activeProjects: departmentProjects.length,
        openBacklogCount,
        reviewCount,
      };
    });

    const scopedCards =
      selectedDepartment === 'Alle Abteilungen' ? cards : cards.filter((department) => department.name === selectedDepartment);

    if (!searchTerm) return scopedCards;

    return scopedCards.filter((department) =>
      [department.name, department.lead, department.description].join(' ').toLowerCase().includes(searchTerm),
    );
  }, [searchTerm, selectedDepartment, visibleProjects]);

  const upcomingItems = useMemo(() => {
    const taskDeadlines = openTasks.map((task) => ({
      id: task.id,
      title: task.title,
      meta: task.project,
      dueLabel: task.dueDate,
      sortValue: parseGermanDate(task.dueDateValue || task.dueDate),
      type: 'Aufgabe',
      path: '/my-tasks',
    }));

    const projectDeadlines = visibleProjects.map((project) => ({
      id: project.id,
      title: project.name,
      meta: project.owner,
      dueLabel: project.dueDate,
      sortValue: parseGermanDate(project.dueDate),
      type: 'Projekt',
      path: '/projects',
    }));

    const combined = [...taskDeadlines, ...projectDeadlines].sort((left, right) => left.sortValue - right.sortValue);

    if (!searchTerm) return combined.slice(0, 5);

    return combined.filter((item) => [item.title, item.meta, item.type].join(' ').toLowerCase().includes(searchTerm));
  }, [openTasks, searchTerm, visibleProjects]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm) return [];

    const taskSuggestions = openTasks
      .filter((task) => [task.title, task.project, task.note, task.assignee].join(' ').toLowerCase().includes(searchTerm))
      .map((task) => ({
        id: `task-${task.id}`,
        type: 'Aufgabe',
        label: task.title,
        meta: `${task.project} - ${task.assignee || 'ohne Person'}`,
        path: '/my-tasks',
      }));

    const projectSuggestions = visibleProjects
      .filter((project) => [project.name, project.owner, project.status, project.goal].join(' ').toLowerCase().includes(searchTerm))
      .map((project) => ({
        id: `project-${project.id}`,
        type: 'Projekt',
        label: project.name,
        meta: `${project.owner} - ${project.dueDate}`,
        path: '/projects',
      }));

    const departmentSuggestions = departmentCards.map((department) => ({
      id: `department-${department.id}`,
      type: 'Bereich',
      label: department.name,
      meta: `${department.lead} - ${department.activeProjects} Projekte`,
      path: '/departments',
    }));

    return [...taskSuggestions, ...projectSuggestions, ...departmentSuggestions];
  }, [departmentCards, openTasks, searchTerm, visibleProjects]);

  const statusOverview = useMemo(() => {
    const totalHours = sumEffortHours(personalOpenTasks) || 1;
    const counts = statusOrder.map((key) => ({
      key,
      ...statusMeta[key],
      value: sumEffortHours(personalOpenTasks.filter((task) => task.status === key)),
    }));

    return counts.map((item) => ({
      ...item,
      displayValue: formatEffort(item.value, workloadUnit),
      percent: Math.round((item.value / totalHours) * 100),
    }));
  }, [personalOpenTasks, workloadUnit]);

  const workload = useMemo(() => {
    const assignedHours = sumEffortHours(personalOpenTasks);

    return {
      assignedHours,
      displayValue: formatEffort(assignedHours, workloadUnit),
      secondaryValue: formatEffort(assignedHours, workloadUnit === 'hours' ? 'days' : 'hours'),
    };
  }, [personalOpenTasks, workloadUnit]);

  const deadlineOverview = useMemo(() => {
    const totalHours = sumEffortHours(personalOpenTasks) || 1;
    return deadlineMeta.map((item) => {
      const value = sumEffortHours(personalOpenTasks.filter((task) => getDeadlineBucket(task) === item.key));
      return {
        ...item,
        value,
        displayValue: formatEffort(value, workloadUnit),
        percent: Math.round((value / totalHours) * 100),
      };
    });
  }, [personalOpenTasks, workloadUnit]);

  const dashboardTabs = [
    { id: 'overview', label: 'Uebersicht', icon: LayoutDashboard },
    { id: 'focus', label: 'Heute im Fokus', count: focusTasks.length, icon: CheckSquare },
    { id: 'attention', label: 'Aufmerksamkeit', count: attentionItems.length, icon: CircleAlert },
    { id: 'departments', label: 'Abteilungen', count: departmentCards.length, icon: Building2 },
    { id: 'deadlines', label: 'Fristen', count: upcomingItems.length, icon: CalendarClock },
  ];

  return (
    <AppShell
      activeItem="Dashboard"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Dashboard"
      searchValue={searchValue}
      onSearch={setSearchValue}
      searchSuggestions={searchSuggestions}
    >
      <div className="space-y-6 px-4 py-5 lg:px-6 lg:py-6">
        <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Arbeitsbereiche</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Dashboard-Reiter</h2>
            </div>

            <div role="tablist" aria-label="Dashboard-Reiter" className="flex w-full flex-wrap gap-2 lg:w-auto">
              {dashboardTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeDashboardTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveDashboardTab(tab.id)}
                    className={`inline-flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 text-sm font-extrabold transition ${
                      active
                        ? 'border-[#d89aa5] bg-[#fff1f3] text-[#a23d4d]'
                        : 'border-slate-200 bg-[#fcfcfd] text-slate-600 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-none" />
                    <span className="truncate">{tab.label}</span>
                    {tab.count !== undefined ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-500">{tab.count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {activeDashboardTab === 'overview' ? (
        <section className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Uebersicht</p>
              <h2 className="mt-2 text-[1.9rem] font-black tracking-tight text-slate-950">
                {selectedDepartment === 'Alle Abteilungen' ? 'Aktueller Workspace-Stand' : selectedDepartment}
              </h2>
            </div>

            {showDepartmentFilter ? (
              <div className="flex flex-wrap items-end gap-3">
                <label className="space-y-2">
                  <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Abteilung</span>
                  <select value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)} className={dashboardSelectClass}>
                    {departmentOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[220px_1fr]">
            <div className="rounded-[26px] border border-slate-300 bg-[#fff8fa] p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-400">Meine Auslastung</p>
              <div className="mt-5 flex flex-col items-center text-center">
                <div
                  className="relative flex h-36 w-36 items-center justify-center rounded-full border-[18px] border-[#b84758] bg-white shadow-inner"
                  aria-label={`${workload.displayValue} gebundene Zeit`}
                >
                  <div className="flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full bg-white">
                    <p className="text-2xl font-black tracking-tight text-slate-950">{workload.displayValue}</p>
                    <p className="text-xs font-bold text-slate-400">beansprucht</p>
                  </div>
                </div>
                <p className="mt-4 text-lg font-black text-slate-950">{workload.secondaryValue}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{currentAssignee}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
                {effortUnitOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setWorkloadUnit(option.value)}
                    className={`h-10 rounded-xl text-sm font-extrabold transition ${
                      workloadUnit === option.value
                        ? 'bg-[#b84758] text-white shadow-[0_10px_22px_rgba(184,71,88,0.18)]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-[#fcfcfd] p-5">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-400">Aufgabenstatus</p>
                  <div className="mt-4 space-y-4">
                    {statusOverview.map((item) => (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-700">{item.label}</p>
                          <span className="text-sm font-semibold text-slate-500">{item.displayValue}</span>
                        </div>
                        <div className={`h-3 overflow-hidden rounded-full ${item.track}`}>
                          <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.percent}%` }} />
                        </div>
                        <p className="text-xs font-semibold text-slate-400">{item.percent}% deiner offenen Zeit</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-400">Fristen</p>
                  <div className="mt-4 space-y-4">
                    {deadlineOverview.map((item) => (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-700">{item.label}</p>
                          <span className="text-sm font-semibold text-slate-500">{item.displayValue}</span>
                        </div>
                        <div className={`h-3 overflow-hidden rounded-full ${item.track}`}>
                          <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.percent}%` }} />
                        </div>
                        <p className="text-xs font-semibold text-slate-400">{item.percent}% deiner offenen Zeit</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>
        ) : null}

        {['focus', 'attention'].includes(activeDashboardTab) ? (
          <section className="grid gap-4">
            {activeDashboardTab === 'focus' ? (
              <article className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Heute im Fokus" />
            <div className="mt-5 space-y-3">
              {focusTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate('/my-tasks')}
                  className="flex w-full items-start justify-between gap-4 rounded-[22px] border border-slate-200 bg-[#fcfcfd] px-4 py-4 text-left transition hover:border-[#eab7c2] hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="text-[1rem] font-bold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-400">{task.project}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{task.note}</p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-2">
                    <span className="rounded-full bg-[#fff5f7] px-3 py-1 text-xs font-semibold text-[#b84758]">
                      {task.priority}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">{task.dueDate}</span>
                  </div>
                </button>
              ))}

              {!focusTasks.length ? (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-400">
                  Keine Fokus-Aufgaben fuer den aktuellen Suchbegriff gefunden.
                </div>
              ) : null}
            </div>
              </article>
            ) : null}

            {activeDashboardTab === 'attention' ? (
              <article className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Aufmerksamkeit noetig" />
            <div className="mt-5 space-y-3">
              {attentionItems.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate('/my-tasks')}
                  className="flex w-full items-start gap-3 rounded-[22px] border border-slate-200 bg-[#fcfcfd] px-4 py-4 text-left transition hover:border-[#eab7c2] hover:bg-white"
                >
                  <span className="mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-[#fff1f3] text-[#b84758]">
                    <CircleAlert className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[1rem] font-bold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-400">{task.project}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{task.note}</p>
                  </div>
                </button>
              ))}

              {!attentionItems.length ? (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-400">
                  Aktuell keine Review- oder Blocker-Themen im Filter.
                </div>
              ) : null}
            </div>
              </article>
            ) : null}
          </section>
        ) : null}

        {['departments', 'deadlines'].includes(activeDashboardTab) ? (
          <section className="grid gap-4">
            {activeDashboardTab === 'departments' ? (
              <article className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Abteilungen im Blick" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {departmentCards.map((department) => (
                <button
                  key={department.id}
                  type="button"
                  onClick={() => navigate('/departments')}
                  className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${department.accent}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-slate-950">{department.name}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{department.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${department.badgeTone}`}>
                      {department.memberCount} Personen
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/80 px-3 py-3">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-slate-400">Lead</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{department.lead}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-3 py-3">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-slate-400">Projekte</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{department.activeProjects}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 px-3 py-3">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-slate-400">Offen</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{department.openBacklogCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-500">
                    <span>{department.reviewCount} in Review</span>
                    <span className="inline-flex items-center gap-1 text-[#b84758]">
                      Bereich oeffnen
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}

              {!departmentCards.length ? (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-400">
                  Keine Abteilungen passend zum Suchbegriff gefunden.
                </div>
              ) : null}
            </div>
              </article>
            ) : null}

            {activeDashboardTab === 'deadlines' ? (
              <article className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Naechste Fristen" />
            <div className="mt-5 space-y-3">
              {upcomingItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-[#fcfcfd] px-4 py-4 text-left transition hover:border-[#eab7c2] hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="text-[1rem] font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {item.type} - {item.meta}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                    <CalendarClock className="h-4 w-4" />
                    {item.dueLabel}
                  </div>
                </button>
              ))}

              {!upcomingItems.length ? (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-400">
                  Keine Fristen passend zum Suchbegriff gefunden.
                </div>
              ) : null}
            </div>
              </article>
            ) : null}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
