import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CalendarClock, CircleAlert, FolderOpen } from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialTasks } from './MyTasksPage';
import { initialBacklogTasks, initialDepartments, initialProjects } from './ProjectsPage';

const createMenuItems = ['Neue Aufgabe', 'Neues Projekt', 'Neuer Report', 'Neues Dokument'];

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

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[1.35rem] font-black tracking-tight text-slate-950">{title}</h2>
      {action ? <span className="text-sm font-semibold text-slate-400">{action}</span> : null}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const searchTerm = searchValue.trim().toLowerCase();

  const openTasks = useMemo(() => initialTasks.filter((task) => task.status !== 'done'), []);

  const focusTasks = useMemo(() => {
    const baseTasks = [...openTasks].sort(sortByUrgency).slice(0, 4);

    if (!searchTerm) return baseTasks;

    return baseTasks.filter((task) =>
      [task.title, task.project, task.note, task.assignee].join(' ').toLowerCase().includes(searchTerm),
    );
  }, [openTasks, searchTerm]);

  const attentionItems = useMemo(() => {
    const flagged = initialTasks.filter((task) => ['blocked', 'review'].includes(task.status)).sort(sortByUrgency);

    if (!searchTerm) return flagged.slice(0, 4);

    return flagged
      .filter((task) => [task.title, task.project, task.note].join(' ').toLowerCase().includes(searchTerm))
      .slice(0, 4);
  }, [searchTerm]);

  const departmentCards = useMemo(() => {
    const cards = initialDepartments.map((department) => {
      const departmentProjects = initialProjects.filter((project) => project.departmentId === department.id);
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

    if (!searchTerm) return cards;

    return cards.filter((department) =>
      [department.name, department.lead, department.description].join(' ').toLowerCase().includes(searchTerm),
    );
  }, [searchTerm]);

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

    const projectDeadlines = initialProjects.map((project) => ({
      id: project.id,
      title: project.name,
      meta: project.owner,
      dueLabel: project.dueDate,
      sortValue: parseGermanDate(project.dueDate),
      type: 'Projekt',
      path: '/projects',
    }));

    const combined = [...taskDeadlines, ...projectDeadlines]
      .sort((left, right) => left.sortValue - right.sortValue)
      .slice(0, 5);

    if (!searchTerm) return combined;

    return combined.filter((item) => [item.title, item.meta, item.type].join(' ').toLowerCase().includes(searchTerm));
  }, [openTasks, searchTerm]);

  const kpis = useMemo(
    () => ({
      openTasks: openTasks.length,
      todayDue: openTasks.filter((task) => task.status === 'today').length,
      activeProjects: initialProjects.filter((project) => !['Abgeschlossen', 'Archiviert'].includes(project.status)).length,
      activeDepartments: initialDepartments.length,
    }),
    [openTasks],
  );

  const statusOverview = useMemo(() => {
    const total = openTasks.length || 1;
    const counts = Object.keys(statusMeta).map((key) => ({
      key,
      ...statusMeta[key],
      value: openTasks.filter((task) => task.status === key).length,
    }));

    return counts.map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [openTasks]);

  const workloadScore = useMemo(() => {
    const todayCount = openTasks.filter((task) => task.status === 'today').length;
    const inProgressCount = openTasks.filter((task) => task.status === 'in-progress').length;
    const reviewCount = openTasks.filter((task) => task.status === 'review').length;
    const blockedCount = openTasks.filter((task) => task.status === 'blocked').length;

    return Math.min(100, todayCount * 18 + inProgressCount * 10 + reviewCount * 16 + blockedCount * 24);
  }, [openTasks]);

  const workloadLabel = useMemo(() => {
    if (workloadScore >= 75) return 'hoch';
    if (workloadScore >= 45) return 'mittel';
    return 'stabil';
  }, [workloadScore]);

  return (
    <AppShell
      activeItem="Dashboard"
      hideBreadcrumb
      searchPlacement="actions"
      searchValue={searchValue}
      onSearch={setSearchValue}
      createMenuItems={createMenuItems}
    >
      <div className="space-y-6 px-4 py-5 lg:px-6 lg:py-6">
        <section className="rounded-[30px] border border-[#f2d7dd] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <SectionHeader title="Lagebild heute" action={`${workloadScore}% Auslastung`} />

          <div className="mt-5 grid gap-5 xl:grid-cols-[220px_1fr_260px]">
            <div className="rounded-[26px] border border-[#f2d7dd] bg-[#fff8fa] p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-slate-400">Belastungsskala</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-5xl font-black tracking-tight text-slate-950">{workloadScore}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Arbeitslage {workloadLabel}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#b84758]">live</span>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f3c5cd] via-[#d87384] to-[#b84758]"
                  style={{ width: `${workloadScore}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs font-semibold text-slate-400">
                <span>ruhig</span>
                <span>normal</span>
                <span>hoch</span>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-[#fcfcfd] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {statusOverview.map((item) => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-700">{item.label}</p>
                      <span className="text-sm font-semibold text-slate-500">{item.value}</span>
                    </div>
                    <div className={`h-3 overflow-hidden rounded-full ${item.track}`}>
                      <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.percent}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-slate-400">{item.percent}% der offenen Aufgaben</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <button
                type="button"
                onClick={() => navigate('/my-tasks')}
                className="rounded-[24px] border border-[#f2d7dd] bg-[#fff5f7] px-4 py-4 text-left transition hover:border-[#eab7c2] hover:bg-white"
              >
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-400">Aufgaben</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{kpis.openTasks}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">offen im persoenlichen Board</p>
              </button>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="rounded-[24px] border border-[#f2d7dd] bg-[#f4f8ff] px-4 py-4 text-left transition hover:border-[#eab7c2] hover:bg-white"
              >
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-400">Projekte</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{kpis.activeProjects}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">aktive Vorhaben im Workspace</p>
              </button>
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="rounded-[24px] border border-[#f2d7dd] bg-[#fff8ef] px-4 py-4 text-left transition hover:border-[#eab7c2] hover:bg-white"
              >
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-400">Fristen</p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{upcomingItems.length}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">naechste Termine und Faelligkeiten</p>
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-[#fcfcfd] px-4 py-4">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-400">Heute priorisiert</p>
              <p className="mt-2 text-lg font-black text-slate-950">{kpis.todayDue} Faelligkeiten</p>
              <p className="mt-1 text-sm text-slate-500">direkt aus dem Aufgabenbereich</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-[#fcfcfd] px-4 py-4">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-400">Abteilungen</p>
              <p className="mt-2 text-lg font-black text-slate-950">{kpis.activeDepartments} Bereiche aktiv</p>
              <p className="mt-1 text-sm text-slate-500">mit Projekt- und Backlog-Bezug</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-[#fcfcfd] px-4 py-4">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-slate-400">Fokus</p>
              <p className="mt-2 text-lg font-black text-slate-950">{focusTasks.length} priorisierte Themen</p>
              <p className="mt-1 text-sm text-slate-500">sortiert nach Dringlichkeit und Termin</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[30px] border border-[#f2d7dd] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Heute im Fokus" action={`${focusTasks.length} Eintraege`} />
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

          <article className="rounded-[30px] border border-[#f2d7dd] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Aufmerksamkeit noetig" action={`${attentionItems.length} Themen`} />
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
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[30px] border border-[#f2d7dd] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Abteilungen im Blick" action={`${departmentCards.length} Bereiche`} />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {departmentCards.map((department) => (
                <button
                  key={department.id}
                  type="button"
                  onClick={() => navigate('/projects')}
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

          <article className="rounded-[30px] border border-[#f2d7dd] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Naechste Fristen" action={`${upcomingItems.length} Termine`} />
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
                      {item.type} · {item.meta}
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
        </section>
      </div>
    </AppShell>
  );
}
