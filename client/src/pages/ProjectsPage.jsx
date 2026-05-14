import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  MoreHorizontal,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import AppShell from '../components/AppShell';

const projectStats = [
  {
    title: 'Offene Aufgaben',
    value: '24',
    trend: '4 seit gestern',
    icon: CalendarCheck,
    iconTone: 'bg-violet-100 text-[#6d5df6]',
    trendTone: 'text-slate-500',
  },
  {
    title: 'In QA',
    value: '7',
    trend: '1 seit gestern',
    icon: ShieldCheck,
    iconTone: 'bg-blue-100 text-blue-600',
    trendTone: 'text-slate-500',
  },
  {
    title: 'Ueberfaellig',
    value: '3',
    trend: '2 seit gestern',
    icon: Clock,
    iconTone: 'bg-red-100 text-red-500',
    trendTone: 'text-red-500',
  },
  {
    title: 'Erledigt diese Woche',
    value: '18',
    trend: '6 seit letzter Woche',
    icon: CheckCircle2,
    iconTone: 'bg-green-100 text-green-600',
    trendTone: 'text-green-600',
  },
];

const kanbanColumns = [
  {
    id: 'heute',
    title: 'Heute',
    dot: 'bg-amber-400',
  },
  {
    id: 'diese-woche',
    title: 'Diese Woche',
    dot: 'bg-emerald-500',
  },
  {
    id: 'qa',
    title: 'QA',
    dot: 'bg-blue-500',
  },
  {
    id: 'spaeter',
    title: 'Spaeter',
    dot: 'bg-violet-500',
  },
  {
    id: 'erledigt',
    title: 'Erledigt',
    dot: 'bg-green-500',
  },
];

const initialTasks = [
  {
    id: 'task-1',
    title: 'Startseite Hero sektion umsetzen',
    status: 'heute',
    priority: 'hoch',
    dueDate: 'Heute',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
  {
    id: 'task-2',
    title: 'Navigation verbessern (Responsive)',
    status: 'heute',
    priority: 'mittel',
    dueDate: 'Heute',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
  },
  {
    id: 'task-3',
    title: 'SEO Meta-Tags aktualisieren',
    status: 'heute',
    priority: 'niedrig',
    dueDate: 'Heute',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
  },
  {
    id: 'task-4',
    title: 'Leistungsoptimierung Bilder',
    status: 'diese-woche',
    priority: 'mittel',
    dueDate: '23. Mai',
    assignee: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
  },
  {
    id: 'task-5',
    title: 'Case Study Seite erstellen',
    status: 'diese-woche',
    priority: 'hoch',
    dueDate: '24. Mai',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
  {
    id: 'task-6',
    title: 'Kontaktformular validieren',
    status: 'diese-woche',
    priority: 'niedrig',
    dueDate: '24. Mai',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
  },
  {
    id: 'task-7',
    title: 'Analytics Events konfigurieren',
    status: 'diese-woche',
    priority: 'mittel',
    dueDate: '25. Mai',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
  },
  {
    id: 'task-8',
    title: 'Checkout Flow testen',
    status: 'qa',
    priority: 'hoch',
    dueDate: '22. Mai',
    assignee: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
  },
  {
    id: 'task-9',
    title: 'Browser-Kompatibilitaet pruefen',
    status: 'qa',
    priority: 'mittel',
    dueDate: '23. Mai',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
  {
    id: 'task-10',
    title: 'Dark Mode umsetzen',
    status: 'spaeter',
    priority: 'niedrig',
    dueDate: '31. Mai',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
  },
  {
    id: 'task-11',
    title: 'Blog Template erstellen',
    status: 'spaeter',
    priority: 'mittel',
    dueDate: '02. Juni',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
  },
  {
    id: 'task-12',
    title: 'Mehrsprachigkeit vorbereiten',
    status: 'spaeter',
    priority: 'niedrig',
    dueDate: '07. Juni',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
  {
    id: 'task-13',
    title: 'Projekt Kickoff & Anforderungen',
    status: 'erledigt',
    priority: 'niedrig',
    dueDate: '15. Mai',
    assignee: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
    completed: true,
  },
  {
    id: 'task-14',
    title: 'Design System aktualisiert',
    status: 'erledigt',
    priority: 'mittel',
    dueDate: '16. Mai',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
    completed: true,
  },
  {
    id: 'task-15',
    title: 'Landingpage Mockup finalisiert',
    status: 'erledigt',
    priority: 'hoch',
    dueDate: '17. Mai',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
    completed: true,
  },
];

const priorityStyles = {
  hoch: 'border-red-100 bg-red-50 text-red-600',
  mittel: 'border-amber-100 bg-amber-50 text-amber-600',
  niedrig: 'border-emerald-100 bg-emerald-50 text-emerald-600',
};

const activities = [
  {
    id: 'activity-1',
    user: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
    text: 'Markus Klein hat die Aufgabe "Checkout Flow testen" in QA verschoben.',
    time: 'vor 2 Stunden',
    dot: 'bg-blue-500',
  },
  {
    id: 'activity-2',
    user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
    text: 'Du hast die Aufgabe "SEO Meta-Tags aktualisieren" zugewiesen.',
    time: 'vor 3 Stunden',
    dot: 'bg-violet-500',
  },
  {
    id: 'activity-3',
    user: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
    text: 'Anna Becker hat die Aufgabe "Design System aktualisiert" abgeschlossen.',
    time: 'vor 5 Stunden',
    dot: 'bg-green-500',
  },
  {
    id: 'activity-4',
    user: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
    text: 'Lisa Wagner hat einen Kommentar zur Aufgabe "Navigation verbessern (Responsive)" hinzugefuegt.',
    time: 'vor 1 Tag',
    dot: 'bg-violet-500',
  },
];

const deadlineTasks = [
  {
    id: 'deadline-1',
    title: 'Checkout Flow testen',
    dueDate: 'Heute',
    assignee: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
    urgent: true,
  },
  {
    id: 'deadline-2',
    title: 'Leistungsoptimierung Bilder',
    dueDate: '23. Mai',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
  },
  {
    id: 'deadline-3',
    title: 'Case Study Seite erstellen',
    dueDate: '24. Mai',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
];

const projectSummary = {
  completedTasks: 47,
  totalTasks: 65,
};

function PriorityBadge({ priority }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-bold ${priorityStyles[priority]}`}>
      <Flag className="h-3 w-3" />
      {label}
    </span>
  );
}

function Avatar({ assignee }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${assignee.gradient} text-[11px] font-extrabold text-slate-700 ring-2 ring-white`}
    >
      {assignee.initials}
    </span>
  );
}

function TaskCard({ task }) {
  return (
    <button
      type="button"
      className="group w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold leading-5 text-slate-900">{task.title}</h3>
        {task.completed ? <CheckCircle2 className="h-4 w-4 flex-none text-green-500" /> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <PriorityBadge priority={task.priority} />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {task.dueDate}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-end">
        <Avatar assignee={task.assignee} />
      </div>
    </button>
  );
}

function KanbanColumn({ column, tasks }) {
  return (
    <section className="flex min-h-[540px] w-[236px] flex-none flex-col rounded-2xl border border-slate-200 bg-white/75 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        <h2 className="min-w-0 flex-1 text-sm font-bold text-slate-900">{column.title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{tasks.length}</span>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#6d5df6]"
          aria-label={`${column.title} Aufgabe hinzufuegen`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      <button type="button" className="mt-3 flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold text-slate-400 transition hover:bg-slate-50 hover:text-[#6d5df6]">
        <Plus className="h-4 w-4" />
        Aufgabe hinzufuegen
      </button>
    </section>
  );
}

function InfoCard({ title, actionLabel = 'Alle anzeigen', children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {actionLabel ? (
          <button type="button" className="text-xs font-bold text-[#6047e8]">
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ProjectStatusCard({ progress, openTasks }) {
  const radius = 37;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <InfoCard title="Projektstatus" actionLabel="">
      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-[96px] w-[96px] flex-none">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#ede9fe" strokeWidth="10" />
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="#6d5df6"
              strokeLinecap="round"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-slate-950">
            {progress}%
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Projektfortschritt</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{progress}% abgeschlossen</p>
        </div>
      </div>

      <div className="mt-5 h-2.5 rounded-full bg-violet-100">
        <div className="h-full rounded-full bg-[#6d5df6]" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-500">Noch {openTasks} Aufgaben offen</p>
    </InfoCard>
  );
}

export default function ProjectsPage() {
  const [tasks] = useState(initialTasks);
  const [searchValue, setSearchValue] = useState('');
  const normalizedSearch = searchValue.trim().toLowerCase();
  const visibleTasks = normalizedSearch
    ? tasks.filter((task) => task.title.toLowerCase().includes(normalizedSearch))
    : tasks;
  const projectProgress = Math.round((projectSummary.completedTasks / projectSummary.totalTasks) * 100);
  const openTasks = projectSummary.totalTasks - projectSummary.completedTasks;

  return (
    <AppShell
      activeItem="Projekte"
      breadcrumb={['Workspace', 'Web-Relaunch', 'Projekte']}
      searchValue={searchValue}
      onSearch={setSearchValue}
    >
      <div className="grid gap-5 px-5 py-5 xl:grid-cols-[1fr_275px] xl:px-7">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {projectStats.map((stat) => (
              <article
                key={stat.title}
                className="min-h-[104px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${stat.iconTone}`}>
                    <stat.icon className="h-5 w-5" />
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                    aria-label={`${stat.title} Optionen`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
                    <p className="mt-1 text-[28px] font-bold leading-none text-slate-950">{stat.value}</p>
                  </div>
                  <p className={`flex items-center gap-1 pb-1 text-xs font-bold ${stat.trendTone}`}>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {stat.trend}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(39,48,93,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Web-Relaunch Board</p>
                <p className="mt-1 text-sm text-slate-500">Projektaufgaben nach Status, Prioritaet und Faelligkeit.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg bg-[#6047e8] px-3 py-2 text-sm font-semibold text-white">
                  Alle
                </button>
                <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                  Aktiv
                </button>
                <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                  Archiv
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-3">
                {kanbanColumns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    tasks={visibleTasks.filter((task) => task.status === column.id)}
                  />
                ))}
              </div>
              {normalizedSearch && !visibleTasks.length ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-bold text-slate-700">Keine Aufgaben gefunden</p>
                  <p className="mt-1 text-sm text-slate-500">Passe deine Suche an, um weitere Karten zu sehen.</p>
                </div>
              ) : null}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <InfoCard title="Aktivitaeten">
            <div className="mt-4 space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar assignee={activity.user} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-5 text-slate-700">{activity.text}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{activity.time}</p>
                  </div>
                  <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${activity.dot}`} />
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard title="Naechste Deadlines">
            <div className="mt-4 space-y-3">
              {deadlineTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
                >
                  <Avatar assignee={task.assignee} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{task.title}</span>
                  <span
                    className={
                      task.urgent
                        ? 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-500'
                        : 'text-xs font-bold text-slate-400'
                    }
                  >
                    {task.dueDate}
                  </span>
                </button>
              ))}
            </div>
          </InfoCard>

          <ProjectStatusCard progress={projectProgress} openTasks={openTasks} />
        </aside>
      </div>
    </AppShell>
  );
}
