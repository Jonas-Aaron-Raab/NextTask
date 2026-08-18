import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  FolderKanban,
  ListFilter,
  Users,
  X,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { getTaskMarker } from '../utils/taskMarkers';
import { initialTasks } from './MyTasksPage';
import {
  initialBacklogTasks,
  initialDepartments,
  initialProjects,
} from './ProjectsPage';

const viewOptions = [
  { id: 'month', label: 'Monat' },
  { id: 'week', label: 'Woche' },
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
const calendarScheduleStorageKey = 'nexttask-calendar-schedule-overrides';
const germanMonths = {
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
const monthPreviewLimit = 2;

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

function formatShortDate(date) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

function formatCompactDate(date) {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function formatNumericDate(date, includeYear = false) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return includeYear ? `${day}.${month}.${date.getFullYear()}` : `${day}.${month}.`;
}

function formatDateRangeTitle(view, cursorDate) {
  if (view === 'week') {
    const from = startOfWeek(cursorDate);
    const to = addDays(from, 6);
    return `${formatNumericDate(from)} - ${formatNumericDate(to, true)}`;
  }

  const from = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const to = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 0);
  return `${formatNumericDate(from)} - ${formatNumericDate(to, true)}`;
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

function parseCalendarDate(value) {
  if (!value) return null;
  if (value instanceof Date) return toDateKey(value);

  const textValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(textValue)) {
    return textValue.slice(0, 10);
  }

  const match = textValue.match(/^(\d{1,2})\.\s*([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;

  const [, day, monthName, year] = match;
  const month = germanMonths[monthName];
  if (!month) return null;

  return `${year}-${month}-${day.padStart(2, '0')}`;
}

function normalizeStatus(status) {
  const map = {
    today: 'OPEN',
    'in-progress': 'IN_PROGRESS',
    review: 'QA',
    todo: 'OPEN',
    progress: 'IN_PROGRESS',
    blocked: 'BLOCKED',
    done: 'DONE',
    TODAY: 'OPEN',
    THIS_WEEK: 'IN_PROGRESS',
    LATER: 'OPEN',
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
  const dueDate = parseCalendarDate(task.dueDateValue || task.dueDate);
  const projectName = task.project?.name || task.project || 'Ohne Projekt';
  const assigneeName = task.assignee?.name || task.assignee || task.assigneeName || mockPeople[index % mockPeople.length];
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
    estimatedHours: task.estimatedHours ?? null,
    source: task.source || (task.project?.id ? 'api' : 'mock'),
  };
}

function getPriorityWeight(priority) {
  const weights = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  return weights[priority] ?? 4;
}

function compareCalendarTasks(firstTask, secondTask) {
  const overdueDifference = Number(isOverdue(secondTask)) - Number(isOverdue(firstTask));
  if (overdueDifference !== 0) return overdueDifference;

  const priorityDifference = getPriorityWeight(firstTask.priority) - getPriorityWeight(secondTask.priority);
  if (priorityDifference !== 0) return priorityDifference;

  return firstTask.title.localeCompare(secondTask.title, 'de');
}

function applyTaskSchedule(task, dateKey) {
  return {
    ...task,
    dueDate: dateKey,
    endDate: dateKey,
    startDate: task.startDate || dateKey,
  };
}

function readScheduleOverrides() {
  if (typeof window === 'undefined') return {};

  try {
    const stored = window.localStorage.getItem(calendarScheduleStorageKey);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function storeScheduleOverride(taskId, dateKey) {
  if (typeof window === 'undefined') return;

  try {
    const current = readScheduleOverrides();
    window.localStorage.setItem(
      calendarScheduleStorageKey,
      JSON.stringify({ ...current, [taskId]: dateKey }),
    );
  } catch {
    // Local persistence is a convenience; the visible calendar state is already updated.
  }
}

function removeScheduleOverride(taskId) {
  if (typeof window === 'undefined') return;

  try {
    const current = readScheduleOverrides();
    if (!current[taskId]) return;
    const { [taskId]: _removed, ...next } = current;
    window.localStorage.setItem(calendarScheduleStorageKey, JSON.stringify(next));
  } catch {
    // Server-saved tasks still keep their updated API schedule.
  }
}

function applyScheduleOverrides(tasks) {
  const overrides = readScheduleOverrides();

  return tasks.map((task) => (overrides[task.id] ? applyTaskSchedule(task, overrides[task.id]) : task));
}

function getDepartmentName(project) {
  const department = initialDepartments.find((candidate) => candidate.id === project?.departmentId);
  return department?.name || 'Ohne Abteilung';
}

function mapBacklogTaskToCalendarTask(task) {
  const project = initialProjects.find((candidate) => candidate.id === task.projectId);

  return {
    id: `backlog-${task.id}`,
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    project: project?.name || 'Ohne Projekt',
    assignee: task.assignee || 'Nicht zugewiesen',
    department: getDepartmentName(project),
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    startDate: task.dueDate,
    endDate: task.dueDate,
    estimatedHours: null,
    source: 'project-backlog',
  };
}

function getFallbackCalendarTasks() {
  return applyScheduleOverrides([
    ...initialTasks,
    ...initialBacklogTasks.map(mapBacklogTaskToCalendarTask),
  ].map(normalizeTask));
}

function mergeCalendarTasks(primaryTasks, fallbackTasks) {
  const taskMap = new Map();
  [...fallbackTasks, ...primaryTasks].forEach((task) => {
    taskMap.set(task.id, task);
  });
  return [...taskMap.values()];
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

function CalendarTask({ task, onOpen, onDragStart, expanded = false }) {
  const overdue = isOverdue(task);
  const marker = getTaskMarker(task);
  return (
    <button
      type="button"
      data-calendar-task
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(task);
      }}
      className={`w-full min-w-0 rounded-md border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        overdue ? 'border-red-300 bg-red-50 text-red-700' : statusColors[task.status]
      } ${expanded ? 'px-2.5 py-2' : 'px-1.5 py-1 text-[11px] font-semibold leading-tight'}`}
      title={overdue ? `Ueberfaellig - ${marker.label}` : marker.label}
      style={{ borderLeftWidth: expanded ? 4 : 3, borderLeftColor: overdue ? '#dc2626' : marker.color }}
    >
      {expanded ? (
        <span className="block">
          <span className="block text-sm font-extrabold leading-snug text-slate-950">{task.title}</span>
          <span className="mt-2 grid gap-1 text-xs font-semibold text-slate-600 sm:grid-cols-2">
            <span>Projekt: {task.project}</span>
            <span>Person: {task.assignee}</span>
            <span>Status: {overdue ? 'Ueberfaellig' : statusLabels[task.status]}</span>
            <span>Prioritaet: {priorityLabels[task.priority]}</span>
          </span>
        </span>
      ) : (
        <>
          <span className="block truncate">{task.title}</span>
          <span className="mt-0.5 block truncate text-[10px] font-medium opacity-75">{task.assignee}</span>
        </>
      )}
    </button>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="block text-[11px] font-bold uppercase text-slate-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-8 w-full rounded-md border border-[#f0d7db] bg-white px-2 text-xs font-semibold normal-case text-slate-700 outline-none focus:border-[#c95767] focus:ring-2 focus:ring-[#c95767]/10"
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

function CalendarFilterPanel({ filters, filterOptions, onFilterChange }) {
  return (
    <div className="border-b border-slate-200 bg-white px-3 py-2">
      <div className="grid gap-2 rounded-md border border-[#f0d7db] bg-[#fff7f8] p-2 md:grid-cols-3 xl:grid-cols-7">
        <FilterSelect label="Projekt" value={filters.project} options={filterOptions.projects} onChange={(value) => onFilterChange('project', value)} />
        <FilterSelect label="Person" value={filters.person} options={filterOptions.people} onChange={(value) => onFilterChange('person', value)} />
        <FilterSelect label="Status" value={filters.status} options={Object.values(statusLabels)} onChange={(value) => onFilterChange('statusLabel', value)} />
        <FilterSelect label="Prioritaet" value={filters.priorityLabel} options={Object.values(priorityLabels)} onChange={(value) => onFilterChange('priorityLabel', value)} />
        <FilterSelect label="Abteilung" value={filters.department} options={filterOptions.departments} onChange={(value) => onFilterChange('department', value)} />
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={filters.mineOnly}
            onChange={(event) => onFilterChange('mineOnly', event.target.checked)}
            className="h-4 w-4 rounded border-[#d89aa5] accent-[#c95767]"
          />
          Nur meine Aufgaben
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={filters.overdueOnly}
            onChange={(event) => onFilterChange('overdueOnly', event.target.checked)}
            className="h-4 w-4 rounded border-[#d89aa5] accent-[#c95767]"
          />
          Nur ueberfaellige Aufgaben
        </label>
      </div>
    </div>
  );
}

function CalendarToolbar({ view, cursorDate, filtersOpen, onFilterToggle, onViewChange, onToday, onMove }) {
  const dateRangeTitle = formatDateRangeTitle(view, cursorDate);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onToday} className="h-10 rounded-md border border-[#f0d7db] px-3 text-sm font-bold text-slate-700 transition hover:border-[#d89aa5] hover:bg-[#fff1f3] hover:text-[#a23d4d]">
          Heute
        </button>
        <button type="button" onClick={() => onMove(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#f0d7db] text-slate-600 transition hover:border-[#d89aa5] hover:bg-[#fff1f3] hover:text-[#a23d4d]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onMove(1)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#f0d7db] text-slate-600 transition hover:border-[#d89aa5] hover:bg-[#fff1f3] hover:text-[#a23d4d]">
          <ChevronRight className="h-4 w-4" />
        </button>
        <h1 className="ml-2 mr-3 text-lg font-extrabold text-slate-950">
          {view === 'day' ? formatFullDate(toDateKey(cursorDate)) : dateRangeTitle}
        </h1>
        <div className="flex rounded-md border border-[#f0d7db] bg-[#fff7f8] p-1">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onViewChange(option.id)}
              className={`h-8 rounded px-2 text-xs font-bold transition ${
                view === option.id ? 'bg-white text-[#a23d4d] shadow-sm' : 'text-slate-500 hover:bg-[#fff1f3] hover:text-[#a23d4d]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onFilterToggle}
          className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition ${
            filtersOpen
              ? 'border-[#c95767] bg-[#c95767] text-white'
              : 'border-[#f0d7db] bg-white text-slate-700 hover:border-[#d89aa5] hover:bg-[#fff1f3] hover:text-[#a23d4d]'
          }`}
        >
          <ListFilter className="h-4 w-4" />
          Filter
        </button>
      </div>
    </div>
  );
}

function MonthView({ cursorDate, tasksByDay, filtersOpen, onOpen, onDayClick, onDragStart, onDrop }) {
  const calendarWeeks = getMonthCalendarWeeks(cursorDate);
  const currentMonth = cursorDate.getMonth();

  return (
    <div className={`${filtersOpen ? 'h-[calc(100vh-246px)] min-h-[420px]' : 'h-[calc(100vh-150px)] min-h-[520px]'} bg-[#fff7f8] p-3`}>
      <div className="h-full overflow-hidden rounded-lg border border-[#f0d7db] bg-white shadow-sm">
        <div
          className="grid h-full"
          style={{
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gridTemplateRows: `44px repeat(${calendarWeeks.length}, minmax(0, 1fr))`,
          }}
        >
          {calendarWeekDays.map((weekDay) => (
            <div key={weekDay.label} className="min-w-0 border-b-2 border-r-2 border-[#f0d7db] bg-[#ffe3e8] px-3 py-2">
              <p className="truncate text-sm font-extrabold text-slate-950">{weekDay.label}</p>
              <p className="text-[11px] font-bold uppercase text-slate-400">{weekDay.short}</p>
            </div>
          ))}

          {calendarWeeks.map((week) =>
            week.map((day) => {
              const key = toDateKey(day);
              const isCurrentMonth = day.getMonth() === currentMonth;
              const dayTasks = isCurrentMonth ? tasksByDay[key] || [] : [];
              const visiblePreviewTasks = dayTasks.slice(0, monthPreviewLimit);
              const remainingTaskCount = Math.max(dayTasks.length - visiblePreviewTasks.length, 0);

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
                  className={`min-h-0 overflow-hidden border-b-2 border-r-2 border-[#f0d7db] p-2 text-left transition hover:relative hover:z-10 hover:shadow-[0_0_0_2px_rgba(201,87,103,0.16),0_14px_30px_rgba(201,87,103,0.18)] ${
                    isCurrentMonth ? 'bg-white hover:bg-[#fff1f3]' : 'bg-[#fff7f8] text-slate-400'
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className={`text-sm font-extrabold ${isCurrentMonth ? 'text-slate-950' : 'text-slate-400'}`}>
                      {formatCompactDate(day)}
                    </p>
                    {isCurrentMonth && dayTasks.length ? (
                      <span className="rounded-full bg-[#fff1f3] px-2 py-0.5 text-[10px] font-extrabold text-[#a23d4d]">
                        {dayTasks.length}
                      </span>
                    ) : null}
                  </div>
                  {isCurrentMonth ? (
                    <div className="space-y-1 overflow-hidden">
                      {visiblePreviewTasks.map((task) => (
                        <CalendarTask key={task.id} task={task} onOpen={onOpen} onDragStart={onDragStart} />
                      ))}
                      {remainingTaskCount ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDayClick(key);
                          }}
                          className="flex w-full items-center justify-between rounded-md border border-dashed border-[#d89aa5] bg-[#fff7f8] px-2 py-1 text-[11px] font-extrabold text-[#a23d4d] transition hover:bg-[#fff1f3]"
                        >
                          <span>+{remainingTaskCount} weitere</span>
                          <span>Liste</span>
                        </button>
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

function WeekView({ cursorDate, tasksByDay, filtersOpen, onOpen, onDayClick, onDragStart, onDrop }) {
  const start = startOfWeek(cursorDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <div className={`${filtersOpen ? 'h-[calc(100vh-246px)] min-h-[420px]' : 'h-[calc(100vh-150px)] min-h-[520px]'} bg-[#fff7f8] p-3`}>
      <div className="h-full overflow-hidden rounded-lg border border-[#f0d7db] bg-white shadow-sm">
        <div className="grid h-full grid-cols-[128px_minmax(0,1fr)]" style={{ gridTemplateRows: '42px repeat(7, minmax(0, 1fr))' }}>
          <div className="border-b-2 border-r-2 border-[#f0d7db] bg-[#ffe3e8] px-3 py-2 text-xs font-extrabold uppercase text-[#a23d4d]">
            Wochentag
          </div>
          <div className="border-b-2 border-r-2 border-[#f0d7db] bg-[#ffe3e8] px-3 py-2">
            <p className="text-sm font-extrabold text-slate-950">Aufgaben</p>
          </div>

          {days.map((day, index) => {
            const key = toDateKey(day);
            const dayTasks = tasksByDay[key] || [];

            return (
              <div key={key} className="contents">
                <div className="min-h-0 border-b-2 border-r-2 border-[#f0d7db] bg-white px-3 py-2">
                  <p className="text-sm font-extrabold text-slate-950">{calendarWeekDays[index].label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{formatShortDate(day)}</p>
                </div>
                <div
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
                  className="min-h-0 overflow-hidden border-b-2 border-r-2 border-[#f0d7db] bg-white p-2 transition hover:relative hover:z-10 hover:bg-[#fff1f3] hover:shadow-[0_0_0_2px_rgba(201,87,103,0.16),0_14px_30px_rgba(201,87,103,0.18)]"
                >
                  {dayTasks.length ? (
                    <div className="grid max-w-4xl gap-1.5 xl:grid-cols-2">
                      {dayTasks.map((task) => (
                        <CalendarTask key={task.id} task={task} onOpen={onOpen} onDragStart={onDragStart} />
                      ))}
                    </div>
                  ) : null}
                </div>
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
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{tasks.length} Aufgaben</p>
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

function DayAgendaModal({ dateKey, tasks, onClose, onOpenTask, onCreateTask }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">Tagesansicht</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{formatFullDate(dateKey)}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {tasks.length} faellige {tasks.length === 1 ? 'Aufgabe' : 'Aufgaben'} an diesem Tag
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCreateTask(dateKey)}
              className="h-10 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.2)] transition hover:bg-[#b84758]"
            >
              Aufgabe anlegen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Tagesliste schliessen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto bg-[#fff7f8] p-5">
          {tasks.length ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <CalendarTask key={task.id} task={task} onOpen={onOpenTask} onDragStart={() => {}} expanded />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
              <p className="text-base font-bold text-slate-900">Keine faelligen Aufgaben</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Fuer diesen Tag ist aktuell keine Ticket-Frist hinterlegt.
              </p>
            </div>
          )}
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
          {isOverdue(task) ? 'Ueberfaellig' : statusLabels[task.status]}
        </div>
        <InfoRow icon={CalendarDays} label="Deadline" value={formatFullDate(task.dueDate)} />
        <InfoRow icon={Users} label="Verantwortlich" value={task.assignee} />
        <InfoRow icon={FolderKanban} label="Projekt" value={task.project} />
        <InfoRow icon={Flag} label="Prioritaet" value={priorityLabels[task.priority]} />
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

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState(() => getFallbackCalendarTasks());
  const [view, setView] = useState('month');
  const [cursorDate, setCursorDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
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
  const focusedTaskId = searchParams.get('taskId');

  useEffect(() => {
    const range = getRange(view, cursorDate);
    const loadTasks = async () => {
      try {
        const requests = [
          api.get('/calendar/tasks', {
            params: {
              from: toDateKey(range.from),
              to: toDateKey(range.to),
            },
          }),
        ];

        if (focusedTaskId) {
          requests.push(
            api.get('/calendar/tasks', {
              params: { taskId: focusedTaskId },
            }),
          );
        }

        const results = await Promise.allSettled(requests);
        const apiTasks = results.flatMap((result) => {
          if (result.status !== 'fulfilled' || !Array.isArray(result.value.data)) return [];
          return result.value.data.map(normalizeTask);
        });

        if (apiTasks.length) {
          setTasks(applyScheduleOverrides(mergeCalendarTasks(apiTasks, getFallbackCalendarTasks())));
          return;
        }

        setTasks(getFallbackCalendarTasks());
      } catch {
        setTasks(getFallbackCalendarTasks());
      }
    };

    loadTasks();
  }, [cursorDate, focusedTaskId, view]);

  useEffect(() => {
    if (!focusedTaskId) return;

    const task = tasks.find((entry) => entry.id === focusedTaskId);
    if (!task) return;

    setSelectedTask((current) => (current?.id === task.id ? current : task));
    setView((current) => (current === 'week' ? current : 'week'));

    const focusDateKey = task.dueDate || task.startDate || task.endDate;
    if (!focusDateKey) return;

    setCursorDate((current) => {
      const currentKey = toDateKey(current);
      return currentKey === focusDateKey ? current : fromDateKey(focusDateKey);
    });
  }, [focusedTaskId, tasks]);

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
      if (!task.dueDate) return false;
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
        result[task.dueDate].sort(compareCalendarTasks);
        return result;
      }, {}),
    [visibleTasks],
  );
  const selectedDayTasks = selectedDayKey ? tasksByDay[selectedDayKey] || [] : [];

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
      current.map((task) => (task.id === taskId ? applyTaskSchedule(task, dateKey) : task)),
    );
    setSelectedTask((current) => (current?.id === taskId ? applyTaskSchedule(current, dateKey) : current));

    const task = tasks.find((item) => item.id === taskId);
    const updatedTask = task ? applyTaskSchedule(task, dateKey) : null;
    if (task?.source === 'api') {
      api.patch(`/tasks/${taskId}/schedule`, {
        startDate: updatedTask.startDate,
        dueDate: dateKey,
        endDate: updatedTask.endDate,
      })
        .then(() => removeScheduleOverride(taskId))
        .catch(() => {
          storeScheduleOverride(taskId, dateKey);
        });
    } else {
      storeScheduleOverride(taskId, dateKey);
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
    });
    setTasks((current) => [nextTask, ...current]);
    setCreateDate(null);
    setSelectedDayKey(form.dueDate);

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
      return <WeekView cursorDate={cursorDate} tasksByDay={tasksByDay} filtersOpen={filtersOpen} onOpen={setSelectedTask} onDayClick={setSelectedDayKey} onDragStart={handleDragStart} onDrop={handleDrop} />;
    }
    if (view === 'day') {
      return <DayView cursorDate={cursorDate} tasksByDay={tasksByDay} onOpen={setSelectedTask} onDayClick={setSelectedDayKey} onDragStart={handleDragStart} onDrop={handleDrop} />;
    }
    if (['project', 'team', 'mine', 'department'].includes(view)) {
      return <PlanningListView view={view} tasks={visibleTasks} onOpen={setSelectedTask} onDragStart={handleDragStart} />;
    }
    return <MonthView cursorDate={cursorDate} tasksByDay={tasksByDay} filtersOpen={filtersOpen} onOpen={setSelectedTask} onDayClick={setSelectedDayKey} onDragStart={handleDragStart} onDrop={handleDrop} />;
  };

  const handleDragStart = (event, taskId) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.setData('text/plain', taskId);
  };

  const closeSelectedTask = () => {
    setSelectedTask(null);
    if (!focusedTaskId) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('taskId');
    setSearchParams(nextParams, { replace: true });
  };

  const searchSuggestions = useMemo(() => {
    const query = searchValue.trim();
    if (!query) return [];

    return visibleTasks.map((task) => ({
      id: `calendar-task-${task.id}`,
      type: 'Termin',
      label: task.title,
      meta: `${task.project} - ${task.assignee || 'ohne Person'} - ${task.dueDate || 'ohne Datum'}`,
      onSelect: () => {
        setSelectedTask(task);
        if (task.dueDate) {
          setSelectedDayKey(task.dueDate);
          setCursorDate(fromDateKey(task.dueDate));
          setView('week');
        }
      },
    }));
  }, [searchValue, visibleTasks]);

  return (
    <AppShell
      activeItem="Kalender"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Kalender"
      searchValue={searchValue}
      onSearch={setSearchValue}
      searchSuggestions={searchSuggestions}
      createMenuItems={[]}
    >
      <div
        className="flex min-h-[calc(100vh-72px)] flex-col lg:flex-row"
        onMouseDown={(event) => {
          if (event.target.closest('[data-calendar-task]')) return;
          if (selectedTask) closeSelectedTask();
        }}
      >
        <section className="min-w-0 flex-1">
          <CalendarToolbar
            view={view}
            cursorDate={cursorDate}
            filtersOpen={filtersOpen}
            onFilterToggle={() => setFiltersOpen((current) => !current)}
            onViewChange={setView}
            onToday={() => setCursorDate(new Date())}
            onMove={moveCursor}
          />
          {filtersOpen ? (
            <CalendarFilterPanel
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={updateFilter}
            />
          ) : null}
          {renderView()}
        </section>

        <DetailPanel task={selectedTask} onClose={closeSelectedTask} />
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

      {selectedDayKey ? (
        <div onMouseDown={() => setSelectedDayKey(null)} role="presentation">
          <DayAgendaModal
            dateKey={selectedDayKey}
            tasks={selectedDayTasks}
            onClose={() => setSelectedDayKey(null)}
            onOpenTask={(task) => {
              setSelectedTask(task);
            }}
            onCreateTask={(dateKey) => {
              setSelectedDayKey(null);
              setCreateDate(dateKey);
            }}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
