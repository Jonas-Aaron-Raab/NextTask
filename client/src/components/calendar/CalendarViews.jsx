import { X } from 'lucide-react';
import { CalendarTask } from './CalendarControls';
import { calendarWeekDays } from '../../data/calendarConstants';
import {
  addDays,
  formatCompactDate,
  formatFullDate,
  formatShortDate,
  toDateKey,
  getMonthCalendarWeeks,
  startOfWeek,
} from '../../utils/calendar';

const monthPreviewLimit = 2;

export function MonthView({ cursorDate, tasksByDay, filtersOpen, onOpen, onDayClick, onDragStart, onDrop }) {
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

export function WeekView({ cursorDate, tasksByDay, filtersOpen, onOpen, onDayClick, onDragStart, onDrop }) {
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

export function DayView({ cursorDate, tasksByDay, onOpen, onDayClick, onDragStart, onDrop }) {
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

export function DayAgendaModal({ dateKey, tasks, onClose, onOpenTask, onCreateTask }) {
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

export function PlanningListView({ view, tasks, onOpen, onDragStart }) {
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

