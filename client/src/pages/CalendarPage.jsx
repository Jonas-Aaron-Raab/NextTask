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
import { useAuth } from '../context/AuthContext';
import { CalendarFilterPanel, CalendarToolbar, FilterSelect as CalendarFilterSelect } from '../components/calendar/CalendarControls';
import { DayAgendaModal, DayView, MonthView, PlanningListView, WeekView } from '../components/calendar/CalendarViews';
import { CreateTaskModal, DetailPanel } from '../components/calendar/CalendarDialogs';
import { addDays, fromDateKey, formatDateRangeTitle, formatFullDate, getRange, toDateKey } from '../utils/calendar';
import { priorityLabels, statusColors, statusLabels } from '../data/calendarConstants';
import { normalizeTaskPriority, normalizeTaskStatus, toTaskDateValue } from '../utils/task';
import { initialTasks } from '../data/taskFixtures';
import {
  initialBacklogTasks,
  initialDepartments,
  initialProjects,
} from '../data/projectFixtures';

const projectColors = ['#4f46e5', '#0f766e', '#b45309', '#be123c', '#6d28d9', '#15803d'];
const mockPeople = ['Lisa Wagner', 'Markus Klein', 'Anna Becker', 'Tom Becker', 'Sarah Nguyen'];
const mockDepartments = ['Development', 'Design', 'QA', 'Marketing', 'Digitales Banking'];
const calendarScheduleStorageKey = 'nexttask-calendar-schedule-overrides';
const monthPreviewLimit = 2;

function normalizeTask(task, index = 0) {
  const dueDate = toTaskDateValue(task.dueDateValue || task.dueDate);
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
    status: normalizeTaskStatus(task.status),
    priority: normalizeTaskPriority(task.priority),
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

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
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
  const currentUserName = user?.name || '';

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
      if (filters.mineOnly && (!currentUserName || task.assignee !== currentUserName)) return false;
      if (filters.overdueOnly && !isOverdue(task)) return false;
      if (query && !`${task.title} ${task.project} ${task.assignee} ${task.description}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [currentUserName, filters, searchValue, tasks]);

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
            formatDateRangeTitle={formatDateRangeTitle}
            formatFullDate={formatFullDate}
            toDateKey={toDateKey}
            cursorDate={cursorDate}
            filtersOpen={filtersOpen}
            onFilterToggle={() => setFiltersOpen((current) => !current)}
            onViewChange={setView}
            onToday={() => setCursorDate(new Date())}
            onMove={moveCursor}
          />
          {filtersOpen ? (
            <CalendarFilterPanel
              statusLabels={statusLabels}
              priorityLabels={priorityLabels}
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
