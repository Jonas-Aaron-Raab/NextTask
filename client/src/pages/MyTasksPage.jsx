import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Flag,
  ListChecks,
  MessageSquareMore,
  ShieldCheck,
} from 'lucide-react';
import AppShell from '../components/AppShell';

const columns = [
  { id: 'today', title: 'Heute', dot: 'bg-amber-400' },
  { id: 'in-progress', title: 'In Arbeit', dot: 'bg-blue-500' },
  { id: 'review', title: 'Review', dot: 'bg-violet-500' },
  { id: 'blocked', title: 'Blockiert', dot: 'bg-rose-500' },
  { id: 'done', title: 'Erledigt', dot: 'bg-emerald-500' },
];

const myTasks = [
  {
    id: 'my-task-1',
    title: 'Hero-Text und CTA fuer Startseite finalisieren',
    status: 'today',
    project: 'Website Relaunch',
    priority: 'hoch',
    dueDate: '15. Mai 2026',
    progress: 70,
    checklist: '7/10 erledigt',
    note: 'Feinschliff fuer Headline und Buttons fehlt noch.',
  },
  {
    id: 'my-task-2',
    title: 'Responsive Navigation auf iPhone Breakpoints pruefen',
    status: 'today',
    project: 'Website Relaunch',
    priority: 'mittel',
    dueDate: '15. Mai 2026',
    progress: 45,
    checklist: '3/6 erledigt',
    note: 'Burger-Menue klappt noch nicht sauber zu.',
  },
  {
    id: 'my-task-3',
    title: 'Projektseite fuer neue Kundenpraesentation strukturieren',
    status: 'in-progress',
    project: 'Sales Deck',
    priority: 'hoch',
    dueDate: '16. Mai 2026',
    progress: 55,
    checklist: '5/9 erledigt',
    note: 'Abschnitt fuer Referenzen und KPIs noch offen.',
  },
  {
    id: 'my-task-4',
    title: 'Task-Karten Farben im Dashboard vereinheitlichen',
    status: 'in-progress',
    project: 'NextTask UI',
    priority: 'niedrig',
    dueDate: '18. Mai 2026',
    progress: 35,
    checklist: '2/5 erledigt',
    note: 'Neue Farblogik in Cards und Badges angleichen.',
  },
  {
    id: 'my-task-5',
    title: 'Checkout-Testlauf dokumentieren und an QA geben',
    status: 'review',
    project: 'Shop Optimierung',
    priority: 'hoch',
    dueDate: '17. Mai 2026',
    progress: 85,
    checklist: '6/7 erledigt',
    note: 'Wartet auf Rueckmeldung vom QA-Team.',
  },
  {
    id: 'my-task-6',
    title: 'Social Preview Bilder fuer Blog vorbereiten',
    status: 'review',
    project: 'Content Sprint',
    priority: 'mittel',
    dueDate: '19. Mai 2026',
    progress: 80,
    checklist: '4/5 erledigt',
    note: 'Finale Freigabe von Marketing fehlt.',
  },
  {
    id: 'my-task-7',
    title: 'Texte fuer Pricing-Seite abstimmen',
    status: 'blocked',
    project: 'Website Relaunch',
    priority: 'mittel',
    dueDate: '20. Mai 2026',
    progress: 20,
    checklist: '1/5 erledigt',
    note: 'Blockiert durch fehlende Preise vom Vertrieb.',
  },
  {
    id: 'my-task-8',
    title: 'Onboarding-Mails in deutsch ueberarbeiten',
    status: 'done',
    project: 'CRM Automation',
    priority: 'niedrig',
    dueDate: '14. Mai 2026',
    progress: 100,
    checklist: '5/5 erledigt',
    note: 'Abgeschlossen und an Team uebergeben.',
  },
];

const activityFeed = [
  'QA hat dir Feedback zum Checkout-Test hinterlassen.',
  'Lisa hat dich bei der Navigation-Aufgabe erwaehnt.',
  'Die Pricing-Seite ist aktuell blockiert wegen fehlender Infos.',
  'Die Onboarding-Mail-Serie wurde von dir abgeschlossen.',
];

const priorityStyles = {
  hoch: 'border-red-100 bg-red-50 text-red-600',
  mittel: 'border-amber-100 bg-amber-50 text-amber-600',
  niedrig: 'border-emerald-100 bg-emerald-50 text-emerald-600',
};

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

function TaskCard({ task }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-4 text-slate-900">{task.title}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{task.project}</p>
        </div>
        {task.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 flex-none text-emerald-500" /> : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <CalendarDays className="h-3 w-3" />
          {task.dueDate}
        </span>
      </div>

      <div className="mt-2 rounded-xl bg-slate-50 p-2">
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-3 w-3" />
            Fortschritt
          </span>
          <span>{task.progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[#6d5df6]" style={{ width: `${task.progress}%` }} />
        </div>
        <p className="mt-1 text-[10px] font-semibold text-slate-400">{task.checklist}</p>
      </div>

      <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">{task.note}</p>
    </article>
  );
}

function BoardColumn({ column, tasks }) {
  return (
    <section className="flex w-[214px] flex-none flex-col rounded-2xl border border-slate-200 bg-white/75 p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-900">{column.title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{tasks.length}</span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
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

export default function MyTasksPage() {
  const [searchValue, setSearchValue] = useState('');

  const normalizedSearch = searchValue.trim().toLowerCase();
  const visibleTasks = useMemo(
    () =>
      normalizedSearch
        ? myTasks.filter(
            (task) =>
              task.title.toLowerCase().includes(normalizedSearch) ||
              task.project.toLowerCase().includes(normalizedSearch),
          )
        : myTasks,
    [normalizedSearch],
  );

  const stats = [
    {
      title: 'Meine offenen Aufgaben',
      value: myTasks.filter((task) => task.status !== 'done').length,
      subtitle: 'aktuell aktiv',
      icon: ListChecks,
      iconTone: 'bg-violet-100 text-[#6d5df6]',
    },
    {
      title: 'Heute faellig',
      value: myTasks.filter((task) => task.status === 'today').length,
      subtitle: 'sofort pruefen',
      icon: CalendarDays,
      iconTone: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Warten auf Review',
      value: myTasks.filter((task) => task.status === 'review').length,
      subtitle: 'Feedback offen',
      icon: ShieldCheck,
      iconTone: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Blockiert',
      value: myTasks.filter((task) => task.status === 'blocked').length,
      subtitle: 'muss geloest werden',
      icon: CircleAlert,
      iconTone: 'bg-rose-100 text-rose-600',
    },
  ];

  const focusTasks = myTasks.filter((task) => task.status === 'today' || task.status === 'blocked').slice(0, 4);
  const nextReviewTask = myTasks.find((task) => task.status === 'review');

  return (
    <AppShell
      activeItem="Meine Aufgaben"
      breadcrumb={['Workspace', 'Persoenlich', 'Meine Aufgaben']}
      searchValue={searchValue}
      onSearch={setSearchValue}
    >
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_270px] xl:px-6">
        <section className="space-y-4">
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_16px_40px_rgba(39,48,93,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-slate-900">Meine Aufgaben Uebersicht</p>
                <p className="mt-1 text-xs text-slate-500">
                  Alle dir zugewiesenen Aufgaben auf einen Blick, inklusive Stand, Deadline und offenen Baustellen.
                </p>
              </div>
              <div className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-[#6047e8]">
                {visibleTasks.length} Aufgaben sichtbar
              </div>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex min-w-max items-start gap-2.5">
                {columns.map((column) => (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    tasks={visibleTasks.filter((task) => task.status === column.id)}
                  />
                ))}
              </div>
              {normalizedSearch && !visibleTasks.length ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-bold text-slate-700">Keine Aufgaben gefunden</p>
                  <p className="mt-1 text-sm text-slate-500">Passe deine Suche an, um andere zugewiesene Aufgaben zu sehen.</p>
                </div>
              ) : null}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <SideCard title="Fokus heute">
            <div className="mt-3 space-y-2">
              {focusTasks.map((task) => (
                <div key={task.id} className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[12px] font-bold leading-4 text-slate-800">{task.title}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{task.project}</p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">{task.note}</p>
                </div>
              ))}
            </div>
          </SideCard>

          <SideCard title="Naechster Schritt">
            <div className="mt-3 rounded-2xl bg-violet-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6047e8]">Empfohlen</p>
              <p className="mt-2 text-[13px] font-bold leading-5 text-slate-900">
                {nextReviewTask ? nextReviewTask.title : 'Alle Reviews sind aktuell erledigt.'}
              </p>
              <p className="mt-2 text-[12px] font-medium leading-5 text-slate-600">
                {nextReviewTask
                  ? 'Diese Aufgabe ist fast fertig und wartet nur noch auf den letzten Review-Schritt.'
                  : 'Du hast aktuell keinen offenen Review-Blocker.'}
              </p>
            </div>
          </SideCard>

          <SideCard title="Letzte Aktivitaet">
            <div className="mt-3 space-y-2">
              {activityFeed.map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-[#6047e8]">
                    <MessageSquareMore className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[12px] font-medium leading-4 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </SideCard>
        </aside>
      </div>
    </AppShell>
  );
}
