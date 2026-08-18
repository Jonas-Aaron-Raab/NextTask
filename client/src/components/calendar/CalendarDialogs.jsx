import { useState } from 'react';
import { CalendarDays, Flag, FolderKanban, Users, X } from 'lucide-react';
import { CalendarTask, FilterSelect } from './CalendarControls';
import { priorityLabels, statusColors, statusLabels } from '../../data/calendarConstants';
import { formatFullDate, toDateKey } from '../../utils/calendar';

function isOverdue(task) {
  return task.status !== 'DONE' && task.dueDate < toDateKey(new Date());
}

export function DetailPanel({ task, onClose }) {
  if (!task) {
    return null;
  }

  return (
    <aside
      onMouseDown={(event) => event.stopPropagation()}
      className="w-full border-t border-slate-200 bg-white p-4 xl:w-[320px] xl:border-l xl:border-t-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">{task.project}</p>
          <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-950">{task.title}</h2>
        </div>
        <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className={`rounded-md border px-3 py-2 text-sm font-bold ${isOverdue(task) ? 'border-red-200 bg-red-50 text-red-700' : statusColors[task.status]}`}>
          {isOverdue(task) ? 'Überfällig' : statusLabels[task.status]}
        </div>
        <InfoRow icon={CalendarDays} label="Deadline" value={formatFullDate(task.dueDate)} />
        <InfoRow icon={Users} label="Verantwortlich" value={task.assignee} />
        <InfoRow icon={FolderKanban} label="Projekt" value={task.project} />
        <InfoRow icon={Flag} label="Priorität" value={priorityLabels[task.priority]} />
      </div>

      <p className="mt-5 text-sm font-medium leading-6 text-slate-600">{task.description || 'Keine Beschreibung hinterlegt.'}</p>
    </aside>
  );
}

export function InfoRow({ icon, label, value }) {
  const IconComponent = icon;

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <IconComponent className="h-4 w-4 text-slate-400" />
      <div>
        <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function CreateTaskModal({ date, projects, people, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    project: projects[0] || 'NextTask UI',
    assignee: people[0] || 'Lisa Wagner',
    dueDate: date,
    priority: 'MEDIUM',
    status: 'OPEN',
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-xl rounded-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-extrabold text-slate-950">Neue Aufgabe</h2>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          <label className="block text-xs font-bold uppercase text-slate-400 md:col-span-2">
            Titel
            <input value={form.title} onChange={(event) => update('title', event.target.value)} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-slate-500" />
          </label>
          <label className="block text-xs font-bold uppercase text-slate-400 md:col-span-2">
            Beschreibung
            <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm font-medium normal-case text-slate-900 outline-none focus:border-slate-500" />
          </label>
          <FilterSelect label="Projekt" value={form.project} options={projects} onChange={(value) => update('project', value)} />
          <FilterSelect label="Verantwortlich" value={form.assignee} options={people} onChange={(value) => update('assignee', value)} />
          <label className="block text-xs font-bold uppercase text-slate-400">
            Deadline
            <input type="date" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-slate-500" />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-600">
            Abbrechen
          </button>
          <button type="button" onClick={() => onCreate(form)} className="h-10 rounded-md bg-slate-950 px-4 text-sm font-bold text-white">
            Aufgabe erstellen
          </button>
        </div>
      </div>
    </div>
  );
}

