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

export default function ProjectsPage() {
  const [tasks] = useState(initialTasks);

  return (
    <AppShell activeItem="Projekte" breadcrumb={['Workspace', 'Web-Relaunch', 'Projekte']}>
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
                    tasks={tasks.filter((task) => task.status === column.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Aktivitaeten</h2>
              <button type="button" className="text-xs font-bold text-[#6047e8]">
                Alle anzeigen
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <p className="rounded-xl bg-slate-50 p-3 text-slate-600">Max Mustermann hat ein Projekt aktualisiert.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-slate-600">Lisa Mueller hat einen Kommentar hinzugefuegt.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-slate-600">QA Review wurde vorbereitet.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
            <h2 className="text-sm font-bold text-slate-900">Naechste Deadlines</h2>
            <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
              <div className="flex items-center justify-between">
                <span>API Fehlerbehandlung</span>
                <span className="text-rose-500">Heute</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Produkt-Tour</span>
                <span>22. Mai</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Performance Audit</span>
                <span>23. Mai</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
