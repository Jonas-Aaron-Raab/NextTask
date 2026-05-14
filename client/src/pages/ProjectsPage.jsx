import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
  Trash2,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';

const statCards = [
  {
    title: 'Offene Aufgaben',
    trend: '4 seit gestern',
    icon: CalendarCheck,
    iconTone: 'bg-violet-100 text-[#6d5df6]',
    trendTone: 'text-slate-500',
  },
  {
    title: 'In QA',
    trend: '1 seit gestern',
    icon: ShieldCheck,
    iconTone: 'bg-blue-100 text-blue-600',
    trendTone: 'text-slate-500',
  },
  {
    title: 'Überfällig',
    trend: '2 seit gestern',
    icon: Clock,
    iconTone: 'bg-red-100 text-red-500',
    trendTone: 'text-red-500',
  },
  {
    title: 'Erledigt diese Woche',
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
    title: 'Später',
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
    dueDateValue: '2026-05-14',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
    overdue: true,
  },
  {
    id: 'task-2',
    title: 'Navigation verbessern (Responsive)',
    status: 'heute',
    priority: 'mittel',
    dueDate: 'Heute',
    dueDateValue: '2026-05-14',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
    overdue: true,
  },
  {
    id: 'task-3',
    title: 'SEO Meta-Tags aktualisieren',
    status: 'heute',
    priority: 'niedrig',
    dueDate: 'Heute',
    dueDateValue: '2026-05-14',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
  },
  {
    id: 'task-4',
    title: 'Leistungsoptimierung Bilder',
    status: 'diese-woche',
    priority: 'mittel',
    dueDate: '23. Mai',
    dueDateValue: '2026-05-23',
    assignee: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
  },
  {
    id: 'task-5',
    title: 'Case Study Seite erstellen',
    status: 'diese-woche',
    priority: 'hoch',
    dueDate: '24. Mai',
    dueDateValue: '2026-05-24',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
  {
    id: 'task-6',
    title: 'Kontaktformular validieren',
    status: 'diese-woche',
    priority: 'niedrig',
    dueDate: '24. Mai',
    dueDateValue: '2026-05-24',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
  },
  {
    id: 'task-7',
    title: 'Analytics Events konfigurieren',
    status: 'diese-woche',
    priority: 'mittel',
    dueDate: '25. Mai',
    dueDateValue: '2026-05-25',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
  },
  {
    id: 'task-8',
    title: 'Checkout Flow testen',
    status: 'qa',
    priority: 'hoch',
    dueDate: '22. Mai',
    dueDateValue: '2026-05-22',
    assignee: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
    overdue: true,
  },
  {
    id: 'task-9',
    title: 'Browser-Kompatibilität prüfen',
    status: 'qa',
    priority: 'mittel',
    dueDate: '23. Mai',
    dueDateValue: '2026-05-23',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
  {
    id: 'task-10',
    title: 'Dark Mode umsetzen',
    status: 'spaeter',
    priority: 'niedrig',
    dueDate: '31. Mai',
    dueDateValue: '2026-05-31',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
  },
  {
    id: 'task-11',
    title: 'Blog Template erstellen',
    status: 'spaeter',
    priority: 'mittel',
    dueDate: '02. Juni',
    dueDateValue: '2026-06-02',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
  },
  {
    id: 'task-12',
    title: 'Mehrsprachigkeit vorbereiten',
    status: 'spaeter',
    priority: 'niedrig',
    dueDate: '07. Juni',
    dueDateValue: '2026-06-07',
    assignee: { initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  },
  {
    id: 'task-13',
    title: 'Projekt Kickoff & Anforderungen',
    status: 'erledigt',
    priority: 'niedrig',
    dueDate: '15. Mai',
    dueDateValue: '2026-05-15',
    assignee: { initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
    completed: true,
  },
  {
    id: 'task-14',
    title: 'Design System aktualisiert',
    status: 'erledigt',
    priority: 'mittel',
    dueDate: '16. Mai',
    dueDateValue: '2026-05-16',
    assignee: { initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
    completed: true,
  },
  {
    id: 'task-15',
    title: 'Landingpage Mockup finalisiert',
    status: 'erledigt',
    priority: 'hoch',
    dueDate: '17. Mai',
    dueDateValue: '2026-05-17',
    assignee: { initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
    completed: true,
  },
];

const priorityStyles = {
  hoch: 'border-red-100 bg-red-50 text-red-600',
  mittel: 'border-amber-100 bg-amber-50 text-amber-600',
  niedrig: 'border-emerald-100 bg-emerald-50 text-emerald-600',
};

const initialActivities = [
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
    text: 'Lisa Wagner hat einen Kommentar zur Aufgabe "Navigation verbessern (Responsive)" hinzugefügt.',
    time: 'vor 1 Tag',
    dot: 'bg-violet-500',
  },
];

const teamMembers = [
  { id: 'markus', name: 'Markus Klein', initials: 'MK', gradient: 'from-blue-200 to-indigo-300' },
  { id: 'lisa', name: 'Lisa Wagner', initials: 'LW', gradient: 'from-rose-200 to-orange-200' },
  { id: 'anna', name: 'Anna Becker', initials: 'AB', gradient: 'from-pink-200 to-violet-200' },
  { id: 'tom', name: 'Tom Becker', initials: 'TB', gradient: 'from-slate-200 to-blue-200' },
];

const emptyTaskForm = {
  title: '',
  status: 'heute',
  priority: 'mittel',
  dueDate: '',
  assigneeId: 'lisa',
  description: '',
};

function formatDateInputLabel(value) {
  if (!value) return 'Heute';

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function getTaskDueDateLabel(task) {
  if (task.dueDateValue) {
    return formatDateInputLabel(task.dueDateValue);
  }

  return task.dueDate;
}

function getDueOrder(dueDate) {
  if (!dueDate) return 999;
  const normalizedDate = dueDate.toLowerCase();
  if (normalizedDate.includes('heute')) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    return new Date(`${normalizedDate}T00:00:00`).getTime();
  }

  const day = Number.parseInt(normalizedDate, 10);
  if (Number.isNaN(day)) return 900;
  if (normalizedDate.includes('mai')) return 100 + day;
  if (normalizedDate.includes('juni')) return 200 + day;
  return 800 + day;
}

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

function TaskCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(task)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`group w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
        isDragging ? 'z-20 opacity-70 shadow-[0_20px_40px_rgba(15,23,42,0.16)]' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold leading-5 text-slate-900">{task.title}</h3>
        {task.completed ? <CheckCircle2 className="h-4 w-4 flex-none text-green-500" /> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <PriorityBadge priority={task.priority} />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {getTaskDueDateLabel(task)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-end">
        <Avatar assignee={task.assignee} />
      </div>
    </button>
  );
}

function KanbanColumn({ column, tasks, onAddTask, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[540px] w-[236px] flex-none flex-col rounded-2xl border border-slate-200 bg-white/75 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition ${
        isOver ? 'border-[#6d5df6] bg-violet-50/70 ring-4 ring-[#6d5df6]/10' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        <h2 className="min-w-0 flex-1 text-sm font-bold text-slate-900">{column.title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{tasks.length}</span>
        <button
          type="button"
          onClick={() => onAddTask(column.id)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[#6d5df6]"
          aria-label={`${column.title} Aufgabe hinzufügen`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddTask(column.id)}
        className="mt-3 flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold text-slate-400 transition hover:bg-slate-50 hover:text-[#6d5df6]"
      >
        <Plus className="h-4 w-4" />
        Aufgabe hinzufügen
      </button>
    </section>
  );
}

function InfoCard({ title, actionLabel = 'Alle anzeigen', onAction, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {actionLabel ? (
          <button type="button" onClick={onAction} className="text-xs font-bold text-[#6047e8]">
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ListModal({ title, items, type, onClose, onOpenTask }) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <section className="max-h-full w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Liste schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          {items.map((item) =>
            type === 'activities' ? (
              <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <Avatar assignee={item.user} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-5 text-slate-700">{item.text}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.time}</p>
                </div>
                <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${item.dot}`} />
              </div>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTask(item);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-violet-50"
              >
                <Avatar assignee={item.assignee} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{item.title}</span>
                <span className={item.overdue || item.dueDate === 'Heute' ? 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-500' : 'text-xs font-bold text-slate-400'}>
                  {getTaskDueDateLabel(item)}
                </span>
              </button>
            ),
          )}
        </div>
      </section>
    </div>
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

function TaskCreateModal({ form, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6d5df6]">Neue Aufgabe</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">Aufgabe erstellen</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dialog schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm font-bold text-slate-700">
            Titel
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder="Aufgabentitel"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Beschreibung
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={3}
              placeholder="Kurze Beschreibung"
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(event) => onChange('status', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {kanbanColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Priorität
              <select
                value={form.priority}
                onChange={(event) => onChange('priority', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                <option value="hoch">Hoch</option>
                <option value="mittel">Mittel</option>
                <option value="niedrig">Niedrig</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Fälligkeit
              <span className="relative mt-2 block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => onChange('dueDate', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                />
              </span>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Zust. Person
              <select
                value={form.assigneeId}
                onChange={(event) => onChange('assigneeId', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button type="submit" className="h-11 rounded-xl bg-[#6d5df6] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(109,93,246,0.22)]">
            Aufgabe erstellen
          </button>
        </div>
      </form>
    </div>
  );
}

function TaskDetailDrawer({
  task,
  form,
  commentDraft,
  onChange,
  onCommentChange,
  onCommentSubmit,
  onClose,
  onSave,
  onDelete,
  onComplete,
}) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm">
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6d5df6]">Aufgabendetails</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">{task.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Drawer schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-5 px-6 py-6">
          <label className="block text-sm font-bold text-slate-700">
            Titel
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Beschreibung
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={5}
              placeholder="Noch keine Beschreibung vorhanden."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(event) => onChange('status', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {kanbanColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Priorität
              <select
                value={form.priority}
                onChange={(event) => onChange('priority', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                <option value="hoch">Hoch</option>
                <option value="mittel">Mittel</option>
                <option value="niedrig">Niedrig</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Fälligkeitsdatum
              <span className="relative mt-2 block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => onChange('dueDate', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                />
              </span>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Zust. Person
              <select
                value={form.assigneeId}
                onChange={(event) => onChange('assigneeId', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-slate-900">Kommentare</h3>
            <div className="mt-3 space-y-3">
              {task.comments?.length ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-800">{comment.author}</span>
                      <span className="text-xs font-semibold text-slate-400">{comment.time}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-slate-500">Noch keine Kommentare vorhanden.</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={commentDraft}
                onChange={(event) => onCommentChange(event.target.value)}
                placeholder="Kommentar schreiben"
                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              />
              <button
                type="button"
                onClick={onCommentSubmit}
                className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Senden
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-slate-900">Aktivitätsverlauf</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">Diese Aufgabe wurde im Web-Relaunch Board angelegt.</p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Löschen
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onComplete}
                className="h-11 rounded-xl border border-green-100 bg-green-50 px-4 text-sm font-bold text-green-600 transition hover:bg-green-100"
              >
                Abschließen
              </button>
              <button type="submit" className="h-11 rounded-xl bg-[#6d5df6] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(109,93,246,0.22)]">
                Speichern
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}

function getColumnTitle(columnId) {
  return kanbanColumns.find((column) => column.id === columnId)?.title || 'Board';
}

export default function ProjectsPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activityItems, setActivityItems] = useState(initialActivities);
  const [searchValue, setSearchValue] = useState('');
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [detailForm, setDetailForm] = useState(emptyTaskForm);
  const [commentDraft, setCommentDraft] = useState('');
  const [openStatMenu, setOpenStatMenu] = useState(null);
  const [hiddenStats, setHiddenStats] = useState([]);
  const [listModal, setListModal] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  const normalizedSearch = searchValue.trim().toLowerCase();
  const visibleTasks = normalizedSearch
    ? tasks.filter((task) => task.title.toLowerCase().includes(normalizedSearch))
    : tasks;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const openTasks = tasks.length - completedTasks;
  const projectProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const deadlineTasks = tasks
    .filter((task) => !task.completed)
    .sort((left, right) => getDueOrder(left.dueDateValue || left.dueDate) - getDueOrder(right.dueDateValue || right.dueDate))
    .slice(0, 3);
  const allDeadlineTasks = tasks
    .filter((task) => !task.completed)
    .sort((left, right) => getDueOrder(left.dueDateValue || left.dueDate) - getDueOrder(right.dueDateValue || right.dueDate));
  const projectStats = statCards.map((stat) => {
    if (stat.title === 'Offene Aufgaben') {
      return { ...stat, value: tasks.filter((task) => !task.completed).length };
    }

    if (stat.title === 'In QA') {
      return { ...stat, value: tasks.filter((task) => task.status === 'qa').length };
    }

    if (stat.title === 'Überfällig') {
      return { ...stat, value: tasks.filter((task) => task.overdue && !task.completed).length };
    }

    return { ...stat, value: tasks.filter((task) => task.completed).length };
  }).filter((stat) => !hiddenStats.includes(stat.title));

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const targetStatus = over.id;
    const targetColumn = kanbanColumns.some((column) => column.id === targetStatus);
    if (!targetColumn) return;

    const movedTask = tasks.find((task) => task.id === active.id);
    if (!movedTask || movedTask.status === targetStatus) return;

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === active.id
          ? {
              ...task,
              status: targetStatus,
              completed: targetStatus === 'erledigt',
            }
          : task,
      ),
    );

    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text: `Du hast die Aufgabe "${movedTask.title}" nach ${getColumnTitle(targetStatus)} verschoben.`,
        time: 'gerade eben',
        dot: targetStatus === 'erledigt' ? 'bg-green-500' : 'bg-violet-500',
      },
      ...currentItems,
    ]);
  };

  const openTaskCreateForm = (status = 'heute') => {
    setTaskForm({ ...emptyTaskForm, status });
    setTaskFormOpen(true);
  };

  const handleCreateAction = (action) => {
    if (action === 'Neue Aufgabe') {
      openTaskCreateForm('heute');
      return;
    }

    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text: `Du hast "${action}" vorbereitet.`,
        time: 'gerade eben',
        dot: 'bg-violet-500',
      },
      ...currentItems,
    ]);
  };

  const handleTaskFormChange = (field, value) => {
    setTaskForm((current) => ({ ...current, [field]: value }));
  };

  const handleTaskCreate = (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) return;

    const assignee = teamMembers.find((member) => member.id === taskForm.assigneeId) || teamMembers[0];
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskForm.title.trim(),
      status: taskForm.status,
      priority: taskForm.priority,
      dueDate: formatDateInputLabel(taskForm.dueDate.trim()),
      dueDateValue: taskForm.dueDate.trim(),
      assignee,
      completed: taskForm.status === 'erledigt',
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text: `Du hast die Aufgabe "${newTask.title}" erstellt.`,
        time: 'gerade eben',
        dot: 'bg-violet-500',
      },
      ...currentItems,
    ]);
    setTaskFormOpen(false);
    setTaskForm(emptyTaskForm);
  };

  const openTaskDetail = (task) => {
    const assignee = teamMembers.find((member) => member.initials === task.assignee.initials) || teamMembers[0];
    setSelectedTaskId(task.id);
    setDetailForm({
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDateValue || '',
      assigneeId: assignee.id,
      description: task.description || '',
    });
    setCommentDraft('');
  };

  const handleDetailFormChange = (field, value) => {
    setDetailForm((current) => ({ ...current, [field]: value }));
  };

  const handleTaskSave = (event) => {
    event.preventDefault();
    if (!selectedTaskId || !detailForm.title.trim()) return;

    const assignee = teamMembers.find((member) => member.id === detailForm.assigneeId) || teamMembers[0];
    const originalTask = tasks.find((task) => task.id === selectedTaskId);
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === selectedTaskId
          ? {
              ...task,
              title: detailForm.title.trim(),
              description: detailForm.description.trim(),
              status: detailForm.status,
              priority: detailForm.priority,
              dueDate: formatDateInputLabel(detailForm.dueDate.trim()),
              dueDateValue: detailForm.dueDate.trim(),
              assignee,
              completed: detailForm.status === 'erledigt',
            }
          : task,
      ),
    );
    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text: `Du hast die Aufgabe "${detailForm.title.trim()}" aktualisiert.`,
        time: 'gerade eben',
        dot: originalTask?.priority !== detailForm.priority ? 'bg-amber-500' : 'bg-violet-500',
      },
      ...currentItems,
    ]);
    setSelectedTaskId(null);
  };

  const handleTaskDelete = () => {
    const deletedTask = tasks.find((task) => task.id === selectedTaskId);
    if (!deletedTask) return;

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== selectedTaskId));
    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text: `Du hast die Aufgabe "${deletedTask.title}" gelöscht.`,
        time: 'gerade eben',
        dot: 'bg-red-500',
      },
      ...currentItems,
    ]);
    setSelectedTaskId(null);
  };

  const handleTaskComplete = () => {
    const completedTask = tasks.find((task) => task.id === selectedTaskId);
    if (!completedTask) return;

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === selectedTaskId
          ? {
              ...task,
              status: 'erledigt',
              completed: true,
            }
          : task,
      ),
    );
    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text: `Du hast die Aufgabe "${completedTask.title}" abgeschlossen.`,
        time: 'gerade eben',
        dot: 'bg-green-500',
      },
      ...currentItems,
    ]);
    setSelectedTaskId(null);
  };

  const handleCommentCreate = () => {
    if (!selectedTaskId || !commentDraft.trim()) return;

    const selectedTask = tasks.find((task) => task.id === selectedTaskId);
    if (!selectedTask) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      author: 'Du',
      text: commentDraft.trim(),
      time: 'gerade eben',
    };

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === selectedTaskId
          ? {
              ...task,
              comments: [...(task.comments || []), newComment],
            }
          : task,
      ),
    );
    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text: `Du hast einen Kommentar zur Aufgabe "${selectedTask.title}" hinzugefügt.`,
        time: 'gerade eben',
        dot: 'bg-violet-500',
      },
      ...currentItems,
    ]);
    setCommentDraft('');
  };

  const handleStatAction = (statTitle, action) => {
    setOpenStatMenu(null);

    if (action === 'hide') {
      setHiddenStats((current) => [...current, statTitle]);
      return;
    }

    setActivityItems((currentItems) => [
      {
        id: `activity-${Date.now()}`,
        user: { initials: 'DU', gradient: 'from-violet-200 to-fuchsia-200' },
        text:
          action === 'export'
            ? `Du hast einen Bericht für "${statTitle}" exportiert.`
            : `Du hast Details für "${statTitle}" geöffnet.`,
        time: 'gerade eben',
        dot: 'bg-violet-500',
      },
      ...currentItems,
    ]);
  };

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  return (
    <AppShell
      activeItem="Projekte"
      breadcrumb={['Workspace', 'Web-Relaunch', 'Projekte']}
      searchValue={searchValue}
      onSearch={setSearchValue}
      onCreateAction={handleCreateAction}
    >
      <div className="grid gap-5 px-5 py-5 xl:grid-cols-[1fr_275px] xl:px-7">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {projectStats.map((stat) => (
              <article
                key={stat.title}
                className="relative min-h-[104px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${stat.iconTone}`}>
                    <stat.icon className="h-5 w-5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenStatMenu((current) => (current === stat.title ? null : stat.title))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                    aria-label={`${stat.title} Optionen`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  {openStatMenu === stat.title ? (
                    <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                      <button
                        type="button"
                        onClick={() => handleStatAction(stat.title, 'details')}
                        className="w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Details anzeigen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatAction(stat.title, 'export')}
                        className="w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Bericht exportieren
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatAction(stat.title, 'hide')}
                        className="w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Karte ausblenden
                      </button>
                    </div>
                  ) : null}
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
                <p className="mt-1 text-sm text-slate-500">Projektaufgaben nach Status, Priorität und Fälligkeit.</p>
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

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="mt-5 overflow-x-auto pb-2">
                <div className="flex min-w-max gap-3">
                  {kanbanColumns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      tasks={visibleTasks.filter((task) => task.status === column.id)}
                      onAddTask={openTaskCreateForm}
                      onOpenTask={openTaskDetail}
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
            </DndContext>
          </section>
        </section>

        <aside className="space-y-5">
          <InfoCard title="Aktivitäten" onAction={() => setListModal('activities')}>
            <div className="mt-4 space-y-4">
              {activityItems.map((activity) => (
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

          <InfoCard title="Nächste Deadlines" onAction={() => setListModal('deadlines')}>
            <div className="mt-4 space-y-3">
              {deadlineTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openTaskDetail(task)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
                >
                  <Avatar assignee={task.assignee} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{task.title}</span>
                  <span
                    className={
                      task.overdue || task.dueDate === 'Heute'
                        ? 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-500'
                        : 'text-xs font-bold text-slate-400'
                    }
                  >
                    {getTaskDueDateLabel(task)}
                  </span>
                </button>
              ))}
            </div>
          </InfoCard>

          <ProjectStatusCard progress={projectProgress} openTasks={openTasks} />
        </aside>
      </div>
      {taskFormOpen ? (
        <TaskCreateModal
          form={taskForm}
          onChange={handleTaskFormChange}
          onClose={() => setTaskFormOpen(false)}
          onSubmit={handleTaskCreate}
        />
      ) : null}
      <TaskDetailDrawer
        task={selectedTask}
        form={detailForm}
        commentDraft={commentDraft}
        onChange={handleDetailFormChange}
        onCommentChange={setCommentDraft}
        onCommentSubmit={handleCommentCreate}
        onClose={() => setSelectedTaskId(null)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onComplete={handleTaskComplete}
      />
      <ListModal
        title={listModal === 'activities' ? 'Alle Aktivitäten' : 'Alle Deadlines'}
        type={listModal}
        items={listModal === 'activities' ? activityItems : allDeadlineTasks}
        onClose={() => setListModal(null)}
        onOpenTask={openTaskDetail}
      />
    </AppShell>
  );
}
