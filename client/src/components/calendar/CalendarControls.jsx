import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { getTaskMarker } from '../../utils/taskMarkers';
import { priorityLabels, statusColors, statusLabels, viewOptions } from '../../data/calendarConstants';

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function CalendarTask({ task, onOpen, onDragStart, expanded = false }) {
  const overdue = task.status !== 'DONE' && task.dueDate < toDateKey(new Date());
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

export function FilterSelect({ label, value, options, onChange }) {
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

export function CalendarFilterPanel({ filters, filterOptions, onFilterChange }) {
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

export function CalendarToolbar({ view, cursorDate, filtersOpen, onFilterToggle, onViewChange, onToday, onMove, formatDateRangeTitle, formatFullDate, toDateKey }) {
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

