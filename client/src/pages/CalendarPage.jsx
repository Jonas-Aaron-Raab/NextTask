import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  FolderKanban,
  ListFilter,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { initialTasks } from './MyTasksPage';

const viewOptions = [
  { id: 'month', label: 'Monat' },
  { id: 'week', label: 'Woche' },
  { id: 'day', label: 'Tag' },
  { id: 'project', label: 'Projekt-Zeitplan' },
  { id: 'team', label: 'Team-Kalender' },
  { id: 'mine', label: 'Meine Aufgaben' },
  { id: 'department', label: 'Abteilung' },
];

const statusLabels = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  QA: 'QA',
  BLOCKED: 'Blockiert',
  DONE: 'Erledigt',
};

const statusColors = {
  OPEN: 'border-blue-200 bg-blue-50 text-blue-700',
  IN_PROGRESS: 'border-orange-200 bg-orange-50 text-orange-700',
  QA: 'border-teal-200 bg-teal-50 text-teal-700',
  BLOCKED: 'border-slate-300 bg-slate-100 text-slate-700',
  DONE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const priorityLabels = {
  LOW: 'Niedrig',
  MEDIUM: 'Normal',
  HIGH: 'Hoch',
  URGENT: 'Kritisch',
};

const calendarWeekDays = [
  { index: 1, short: 'Mo', label: 'Montag' },
  { index: 2, short: 'Di', label: 'Dienstag' },
  { index: 3, short: 'Mi', label: 'Mittwoch' },
  { index: 4, short: 'Do', label: 'Donnerstag' },
  { index: 5, short: 'Fr', label: 'Freitag' },
  { index: 6, short: 'Sa', label: 'Samstag' },
  { index: 0, short: 'So', label: 'Sonntag' },
];

const projectColors = ['#4f46e5', '#0f766e', '#b45309', '#be123c', '#6d28d9', '#15803d'];
const mockPeople = ['Lisa Wagner', 'Markus Klein', 'Anna Becker', 'Tom Becker', 'Sarah Nguyen'];
const mockDepartments = ['Development', 'Design', 'QA', 'Marketing', 'Digitales Banking'];

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function fromDateKey(value) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeek(first);
}

function getMonthCalendarWeeks(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const firstGridDay = startOfWeek(firstDay);
  const weeks = [];

  for (let weekStart = firstGridDay; weekStart <= lastDay; weekStart = addDays(weekStart, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)));
  }

  return weeks;
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

function formatCompactDate(date) {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function formatFullDate(value) {
  if (!value) return 'Keine Deadline';
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fromDateKey(value));
}

function normalizeStatus(status) {
  const map = {
    today: 'OPEN',
    'in-progress': 'IN_PROGRESS',
    review: 'QA',
    blocked: 'BLOCKED',
    done: 'DONE',
  };
  return map[status] || status || 'OPEN';
}

function normalizePriority(priority) {
  const map = {
    niedrig: 'LOW',
    mittel: 'MEDIUM',
    hoch: 'HIGH',
    kritisch: 'URGENT',
  };
  return map[priority] || priority || 'MEDIUM';
}

function normalizeTask(task, index = 0) {
  const dueDate = task.dueDateValue || task.dueDate?.slice?.(0, 10) || toDateKey(addDays(new Date(), index % 8));
  const projectName = task.project?.name || task.project || 'Ohne Projekt';
  const assigneeName = task.assignee?.name || task.assignee || mockPeople[index % mockPeople.length];
  return {
    id: task.id,
    title: task.title,
    description: task.description || task.note || '',
    projectId: task.project?.id || task.projectId || projectName,
    project: projectName,
    projectColor: task.project?.color || projectColors[index % projectColors.length],
    assigneeId: task.assignee?.id || task.assigneeId || assigneeName,
    assignee: assigneeName,
    department: task.department || task.assignee?.department || mockDepartments[index % mockDepartments.length],
    status: normalizeStatus(task.status),
    priority: normalizePriority(task.priority),
    startDate: task.startDate?.slice?.(0, 10) || dueDate,
    dueDate,
    endDate: task.endDate?.slice?.(0, 10) || dueDate,
    estimatedHours: task.estimatedHours || Math.max(2, (index % 5) + 2),
    source: task.project?.id ? 'api' : 'mock',
  };
}

function isOverdue(task) {
  return task.status !== 'DONE' && task.dueDate < toDateKey(new Date());
}

function getRange(view, cursorDate) {
  if (view === 'day') {
    return { from: cursorDate, to: cursorDate };
  }
  if (view === 'week') {
    const from = startOfWeek(cursorDate);
    return { from, to: addDays(from, 6) };
  }
  const from = startOfMonthGrid(cursorDate);
  return { from, to: addDays(from, 41) };
}

function CalendarTask({ task, onOpen, onDragStart }) {
  const overdue = isOverdue(task);
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(task);
      }}
      className={`w-full min-w-0 rounded-md border px-2.5 py-2 text-left text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        overdue ? 'border-red-300 bg-red-50 text-red-700' : statusColors[task.status]
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: overdue ? '#dc2626' : task.projectColor }}
    >
      <span className="block truncate">{task.title}</span>
      <span className="mt-0.5 block truncate text-[11px] font-medium opacity-80">{task.assignee}</span>
    </button>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block text-xs font-bold uppercase text-slate-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold normal-case text-slate-700 outline-none focus:border-slate-500"
      >
        <option value="all">Alle</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CalendarSidebar({ cursorDate, filters, filterOptions, stats, filtersOpen, onFilterToggle, onFilterChange }) {
  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 lg:w-[280px] lg:border-b-0 lg:border-r">
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">Aktueller Monat</p>
        <p className="mt-1 text-lg font-extrabold text-slate-950">{formatMonth(cursorDate)}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-md bg-red-50 p-2">
          <p className="text-lg font-extrabold text-red-700">{stats.overdue}</p>
          <p className="text-[11px] font-bold text-red-500">Ueberfaellig</p>
        </div>
        <div className="rounded-md bg-teal-50 p-2">
          <p className="text-lg font-extrabold text-teal-700">{stats.qa}</p>
          <p className="text-[11px] font-bold text-teal-500">QA</p>
        </div>
        <div className="rounded-md bg-orange-50 p-2">
          <p className="text-lg font-extrabold text-orange-700">{stats.high}</p>
          <p className="text-[11px] font-bold text-orange-500">Hoch</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onFilterToggle}
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-extrabold text-slate-700 transition hover:border-slate-300 hover:bg-white"
      >
        <ListFilter className="h-4 w-4" />
        Filter
      </button>

      {filtersOpen ? (
        <div className="mt-4 space-y-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <ListFilter className="h-4 w-4" />
            Optionen
          </div>
          <FilterSelect label="Projekt" value={filters.project} options={filterOptions.projects} onChange={(value) => onFilterChange('project', value)} />
          <FilterSelect label="Person" value={filters.person} options={filterOptions.people} onChange={(value) => onFilterChange('person', value)} />
          <FilterSelect label="Status" value={filters.status} options={Object.values(statusLabels)} onChange={(value) => onFilterChange('statusLabel', value)} />
          <FilterSelect label="Prioritaet" value={filters.priorityLabel} options={Object.values(priorityLabels)} onChange={(value) => onFilterChange('priorityLabel', value)} />
          <FilterSelect label="Abteilung" value={filters.department} options={filterOptions.departments} onChange={(value) => onFilterChange('department', value)} />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={filters.mineOnly}
              onChange={(event) => onFilterChange('mineOnly', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Nur meine Aufgaben
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(event) => onFilterChange('overdueOnly', event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Nur ueberfaellige Aufgaben
          </label>
        </div>
      ) : null}
    </aside>
  );
}

function CalendarToolbar({ view, cursorDate, onViewChange, onToday, onMove, onCreate }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onToday} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Heute
        </button>
        <button type="button" onClick={() => onMove(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onMove(1)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ChevronRight className="h-4 w-4" />
        </button>
        <h1 className="ml-2 text-lg font-extrabold text-slate-950">{view === 'day' ? formatFullDate(toDateKey(cursorDate)) : formatMonth(cursorDate)}</h1>
      </div>
      {view === 'month' ? (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onMove(-1)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
            Vorheriger Monat
          </button>
          <button type="button" onClick={() => onMove(1)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Naechster Monat
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onViewChange(option.id)}
              className={`h-8 rounded px-2 text-xs font-bold transition ${
                view === option.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onCreate} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white">
          <Plus className="h-4 w-4" />
          Neue Aufgabe
        </button>
      </div>
    </div>
  );
}

function MonthView({ cursorDate, tasksByDay, onOpen, onDayClick, onDragStart, onDrop }) {
  const calendarWeeks = getMonthCalendarWeeks(cursorDate);
  const currentMonth = cursorDate.getMonth();

  return (
    <div className="min-h-[760px] bg-slate-50 p-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <div
          className="grid min-w-[1260px]"
          style={{ gridTemplateColumns: 'repeat(7, minmax(180px, 1fr))' }}
        >
          {calendarWeekDays.map((weekDay) => (
            <div key={weekDay.label} className="border-b border-r border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-extrabold text-slate-950">{weekDay.label}</p>
              <p className="mt-1 text-xs font-bold uppercase text-slate-400">{weekDay.short}</p>
            </div>
          ))}

          {calendarWeeks.map((week) =>
            week.map((day) => {
              const key = toDateKey(day);
              const isCurrentMonth = day.getMonth() === currentMonth;
              const dayTasks = isCurrentMonth ? tasksByDay[key] || [] : [];

              return (
                <div
                  key={key}
                  role={isCurrentMonth ? 'button' : undefined}
                  tabIndex={isCurrentMonth ? 0 : undefined}
                  onClick={() => {
                    if (isCurrentMonth) onDayClick(key);
                  }}
                  onKeyDown={(event) => {
                    if (!isCurrentMonth) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onDayClick(key);
                    }
                  }}
                  onDragOver={(event) => {
                    if (isCurrentMonth) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (isCurrentMonth) onDrop(event, key);
                  }}
                  className={`min-h-[138px] border-b border-r border-slate-200 p-4 text-left transition ${
                    isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/80 text-slate-400'
                  }`}
                >
                  <p className={`mb-3 text-lg font-extrabold ${isCurrentMonth ? 'text-slate-950' : 'text-slate-400'}`}>
                    {formatCompactDate(day)}
                  </p>
                  {isCurrentMonth ? (
                    <div className="space-y-2">
                      {dayTasks.slice(0, 2).map((task) => (
                        <CalendarTask key={task.id} task={task} onOpen={onOpen} onDragStart={onDragStart} />
                      ))}
                      {dayTasks.length > 2 ? (
                        <span className="block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                          +{dayTasks.length - 2} weitere Aufgaben
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

function WeekView({ cursorDate, tasksByDay, onOpen, onDayClick, onDragStart, onDrop }) {
  const start = startOfWeek(cursorDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const timeBlocks = [
    { id: 'morning', label: 'Vormittag', hint: '08:00 - 12:00' },
    { id: 'afternoon', label: 'Nachmittag', hint: '12:00 - 17:00' },
    { id: 'deadline', label: 'Deadline', hint: 'faellige Aufgaben' },
  ];

  return (
    <div className="min-h-[760px] bg-slate-50 p-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid min-w-[860px] grid-cols-[148px_repeat(3,minmax(210px,1fr))]">
          <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold uppercase text-slate-500">
            Wochentag
          </div>
          {timeBlocks.map((block) => (
            <div key={block.id} className="border-b border-r border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-extrabold text-slate-950">{block.label}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{block.hint}</p>
            </div>
          ))}

          {days.map((day, index) => {
            const key = toDateKey(day);
            const dayTasks = tasksByDay[key] || [];
            const totalHours = dayTasks.reduce((sum, task) => sum + task.estimatedHours, 0);

            return (
              <div key={key} className="contents">
                <div className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-extrabold text-slate-950">{calendarWeekDays[index].label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{formatShortDate(day)} · {totalHours}h geplant</p>
                </div>
                {timeBlocks.map((block) => (
                  <div
                    key={`${key}-${block.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onDayClick(key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onDayClick(key);
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDrop(event, key)}
                    className="min-h-[124px] border-b border-r border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                  >
                    <div className="space-y-2">
                      {block.id === 'deadline'
                        ? dayTasks.map((task) => <CalendarTask key={task.id} task={task} onOpen={onOpen} onDragStart={onDragStart} />)
                        : null}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayView({ cursorDate, tasksByDay, onOpen, onDayClick, onDragStart, onDrop }) {
  const key = toDateKey(cursorDate);
  const tasks = tasksByDay[key] || [];
  const hours = Array.from({ length: 11 }, (_, index) => index + 8);
  return (
    <div className="min-h-[760px] bg-slate-50 p-4">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-extrabold text-slate-950">{formatFullDate(key)}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{tasks.length} Aufgaben · {tasks.reduce((sum, task) => sum + task.estimatedHours, 0)}h geplant</p>
        </div>
        <div
          onClick={() => onDayClick(key)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => onDrop(event, key)}
        >
          {hours.map((hour, index) => (
            <div key={hour} className="grid min-h-[72px] grid-cols-[88px_1fr] border-b border-slate-100 last:border-b-0">
              <div className="border-r border-slate-100 px-4 py-3 text-xs font-bold text-slate-400">{String(hour).padStart(2, '0')}:00</div>
              <div className="flex flex-wrap items-start gap-2 p-3">
                {index === 1
                  ? tasks.map((task) => <CalendarTask key={task.id} task={task} onOpen={onOpen} onDragStart={onDragStart} />)
                  : null}
              </div>
            </div>
          ))}
          {!tasks.length ? (
            <div className="px-4 py-8 text-center text-sm font-semibold text-slate-400">Keine Aufgaben fuer diesen Tag geplant.</div>
          ) : null}
          </div>
      </div>
    </div>
  );
}

function PlanningListView({ view, tasks, onOpen, onDragStart }) {
  const groupKey = view === 'team' ? 'assignee' : view === 'department' ? 'department' : view === 'project' ? 'project' : 'dueDate';
  const groups = tasks.reduce((result, task) => {
    const key = task[groupKey] || 'Ohne Zuordnung';
    result[key] = result[key] || [];
    result[key].push(task);
    return result;
  }, {});

  return (
    <div className="min-h-[760px] space-y-4 bg-slate-50 p-4">
      {Object.entries(groups).map(([group, items]) => (
        <section key={group} className="rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-extrabold text-slate-950">{view === 'mine' ? formatFullDate(group) : group}</h2>
            <span className="text-xs font-bold text-slate-400">{items.length} Aufgaben</span>
          </div>
          <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((task) => (
              <CalendarTask key={task.id} task={task} onOpen={onOpen} onDragStart={onDragStart} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DetailPanel({ task, onClose }) {
  if (!task) {
    return (
      <aside className="hidden w-[320px] border-l border-slate-200 bg-white p-4 xl:block">
        <div className="flex h-full items-center justify-center text-center text-sm font-semibold text-slate-400">
          Aufgabe auswaehlen, um Details zu sehen.
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full border-t border-slate-200 bg-white p-4 xl:w-[320px] xl:border-l xl:border-t-0">
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
          {isOverdue(task) ? 'Ueberfaellig' : statusLabels[task.status]}
        </div>
        <InfoRow icon={CalendarDays} label="Deadline" value={formatFullDate(task.dueDate)} />
        <InfoRow icon={Users} label="Verantwortlich" value={task.assignee} />
        <InfoRow icon={FolderKanban} label="Projekt" value={task.project} />
        <InfoRow icon={Flag} label="Prioritaet" value={priorityLabels[task.priority]} />
        <InfoRow icon={Clock3} label="Aufwand" value={`${task.estimatedHours} Stunden geplant`} />
      </div>

      <p className="mt-5 text-sm font-medium leading-6 text-slate-600">{task.description || 'Keine Beschreibung hinterlegt.'}</p>
    </aside>
  );
}

function InfoRow({ icon, label, value }) {
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

function CreateTaskModal({ date, projects, people, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    project: projects[0] || 'NextTask UI',
    assignee: people[0] || 'Lisa Wagner',
    dueDate: date,
    priority: 'MEDIUM',
    status: 'OPEN',
    estimatedHours: 3,
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
          <label className="block text-xs font-bold uppercase text-slate-400">
            Aufwand
            <input type="number" min="1" value={form.estimatedHours} onChange={(event) => update('estimatedHours', Number(event.target.value))} className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-slate-500" />
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

export default function CalendarPage() {
  const [tasks, setTasks] = useState(() => initialTasks.map(normalizeTask));
  const [view, setView] = useState('month');
  const [cursorDate, setCursorDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [createDate, setCreateDate] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    project: 'all',
    person: 'all',
    statusLabel: 'all',
    priorityLabel: 'all',
    department: 'all',
    mineOnly: false,
    overdueOnly: false,
  });

  useEffect(() => {
    const range = getRange(view, cursorDate);
    api
      .get('/calendar/tasks', {
        params: {
          from: toDateKey(range.from),
          to: toDateKey(range.to),
        },
      })
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length) {
          setTasks(response.data.map(normalizeTask));
        }
      })
      .catch(() => {
        setTasks(initialTasks.map(normalizeTask));
      });
  }, [cursorDate, view]);

  const filterOptions = useMemo(
    () => ({
      projects: [...new Set(tasks.map((task) => task.project))],
      people: [...new Set(tasks.map((task) => task.assignee))],
      departments: [...new Set(tasks.map((task) => task.department))],
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return tasks.filter((task) => {
      if (filters.project !== 'all' && task.project !== filters.project) return false;
      if (filters.person !== 'all' && task.assignee !== filters.person) return false;
      if (filters.statusLabel !== 'all' && statusLabels[task.status] !== filters.statusLabel) return false;
      if (filters.priorityLabel !== 'all' && priorityLabels[task.priority] !== filters.priorityLabel) return false;
      if (filters.department !== 'all' && task.department !== filters.department) return false;
      if (filters.mineOnly && task.assignee !== 'Lisa Wagner') return false;
      if (filters.overdueOnly && !isOverdue(task)) return false;
      if (query && !`${task.title} ${task.project} ${task.assignee} ${task.description}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [filters, searchValue, tasks]);

  const tasksByDay = useMemo(
    () =>
      visibleTasks.reduce((result, task) => {
        result[task.dueDate] = result[task.dueDate] || [];
        result[task.dueDate].push(task);
        return result;
      }, {}),
    [visibleTasks],
  );

  const stats = useMemo(
    () => ({
      overdue: visibleTasks.filter(isOverdue).length,
      qa: visibleTasks.filter((task) => task.status === 'QA').length,
      high: visibleTasks.filter((task) => ['HIGH', 'URGENT'].includes(task.priority)).length,
    }),
    [visibleTasks],
  );

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));

  const moveCursor = (direction) => {
    setCursorDate((current) => {
      if (view === 'day') return addDays(current, direction);
      if (view === 'week') return addDays(current, direction * 7);
      return new Date(current.getFullYear(), current.getMonth() + direction, 1);
    });
  };

  const handleDrop = (event, dateKey) => {
    event.preventDefault();
    const taskId = draggedTaskId || event.dataTransfer.getData('text/plain');
    if (!taskId) return;

    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, dueDate: dateKey, endDate: dateKey, startDate: task.startDate || dateKey } : task)),
    );

    const task = tasks.find((item) => item.id === taskId);
    if (task?.source === 'api') {
      api.patch(`/tasks/${taskId}/schedule`, {
        startDate: task.startDate,
        dueDate: dateKey,
        endDate: dateKey,
      }).catch(() => {});
    }
    setDraggedTaskId(null);
  };

  const handleCreateTask = (form) => {
    if (!form.title.trim()) return;
    const projectMatch = tasks.find((task) => task.project === form.project && task.source === 'api');
    const assigneeMatch = tasks.find((task) => task.assignee === form.assignee && task.source === 'api');
    const nextTask = normalizeTask({
      id: `calendar-task-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      project: form.project,
      assignee: form.assignee,
      dueDateValue: form.dueDate,
      status: form.status,
      priority: form.priority,
      estimatedHours: form.estimatedHours,
    });
    setTasks((current) => [nextTask, ...current]);
    setCreateDate(null);

    if (projectMatch?.projectId) {
      api
        .post('/tasks', {
          title: form.title.trim(),
          description: form.description.trim(),
          projectId: projectMatch.projectId,
          assigneeId: assigneeMatch?.assigneeId,
          dueDate: form.dueDate,
          startDate: form.dueDate,
          endDate: form.dueDate,
          priority: form.priority,
          status: form.status,
          estimatedHours: form.estimatedHours,
          department: nextTask.department,
        })
        .then((response) => {
          const savedTask = normalizeTask(response.data);
          setTasks((current) => current.map((task) => (task.id === nextTask.id ? savedTask : task)));
        })
        .catch(() => {});
    }
  };

  const renderView = () => {
    if (view === 'week') {
      return <WeekView cursorDate={cursorDate} tasksByDay={tasksByDay} onOpen={setSelectedTask} onDayClick={setCreateDate} onDragStart={handleDragStart} onDrop={handleDrop} />;
    }
    if (view === 'day') {
      return <DayView cursorDate={cursorDate} tasksByDay={tasksByDay} onOpen={setSelectedTask} onDayClick={setCreateDate} onDragStart={handleDragStart} onDrop={handleDrop} />;
    }
    if (['project', 'team', 'mine', 'department'].includes(view)) {
      return <PlanningListView view={view} tasks={visibleTasks} onOpen={setSelectedTask} onDragStart={handleDragStart} />;
    }
    return <MonthView cursorDate={cursorDate} tasksByDay={tasksByDay} onOpen={setSelectedTask} onDayClick={setCreateDate} onDragStart={handleDragStart} onDrop={handleDrop} />;
  };

  const handleDragStart = (event, taskId) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <AppShell
      activeItem="Kalender"
      hideBreadcrumb
      searchPlacement="actions"
      searchValue={searchValue}
      onSearch={setSearchValue}
      createMenuItems={['Neue Aufgabe']}
      onCreateAction={() => setCreateDate(toDateKey(cursorDate))}
    >
      <div className="flex min-h-[calc(100vh-72px)] flex-col lg:flex-row">
        <CalendarSidebar
          cursorDate={cursorDate}
          filters={filters}
          filterOptions={filterOptions}
          stats={stats}
          filtersOpen={filtersOpen}
          onFilterToggle={() => setFiltersOpen((current) => !current)}
          onFilterChange={updateFilter}
        />

        <section className="min-w-0 flex-1">
          <CalendarToolbar
            view={view}
            cursorDate={cursorDate}
            onViewChange={setView}
            onToday={() => setCursorDate(new Date())}
            onMove={moveCursor}
            onCreate={() => setCreateDate(toDateKey(cursorDate))}
          />
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
            <Search className="h-4 w-4" />
            {visibleTasks.length} sichtbare Kalenderelemente
            {stats.overdue ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 font-bold text-red-700">
                <AlertTriangle className="h-3 w-3" />
                {stats.overdue} ueberfaellig
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Keine ueberfaelligen Aufgaben
              </span>
            )}
          </div>
          {renderView()}
        </section>

        <DetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      </div>

      {createDate ? (
        <CreateTaskModal
          date={createDate}
          projects={filterOptions.projects}
          people={filterOptions.people}
          onClose={() => setCreateDate(null)}
          onCreate={handleCreateTask}
        />
      ) : null}
    </AppShell>
  );
}
