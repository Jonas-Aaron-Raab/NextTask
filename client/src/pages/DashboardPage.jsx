import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  closestCorners,
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLUMNS = [
  {
    key: 'TODAY',
    label: 'Heute',
    accent: 'from-[#fff0a8] via-[#ffe76c] to-[#f8d54b]',
    surface: 'bg-[#fff5b8]',
    addTone: 'text-[#8a6400]',
    badge: 'bg-[#6e9617]',
  },
  {
    key: 'THIS_WEEK',
    label: 'Diese Woche',
    accent: 'from-[#c6f7df] via-[#aeeecf] to-[#8eddbf]',
    surface: 'bg-[#baf0d8]',
    addTone: 'text-[#126145]',
    badge: 'bg-[#138b64]',
  },
  {
    key: 'LATER',
    label: 'Spater',
    accent: 'from-[#ffffff] via-[#f4f5f7] to-[#e8edf4]',
    surface: 'bg-[#f4f5f7]',
    addTone: 'text-[#4e5c72]',
    badge: 'bg-[#5d6b82]',
  },
  {
    key: 'DONE',
    label: 'Erledigt',
    accent: 'from-[#d8f5d8] via-[#c9efcf] to-[#a8e2b1]',
    surface: 'bg-[#d3f2d7]',
    addTone: 'text-[#1f7048]',
    badge: 'bg-[#277a4e]',
  },
];

const PRIORITY_META = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-rose-100 text-rose-700',
};

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const BOARD_TABS = ['Projekte', 'Planer', 'Board', 'Boards wechseln'];
const EMPTY_DRAFTS = {
  TODAY: '',
  THIS_WEEK: '',
  LATER: '',
  DONE: '',
};

function sortTasks(taskList) {
  return [...taskList].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

function getTaskMap(taskList) {
  return STATUS_COLUMNS.reduce((accumulator, column) => {
    accumulator[column.key] = sortTasks(taskList.filter((task) => task.status === column.key));
    return accumulator;
  }, {});
}

function getInitials(value) {
  if (!value) return 'NT';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1.5" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1.5" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1.5" />
      <rect x="14.5" y="14.5" width="6" height="6" rx="1.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlusIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M15 17H5.5a1 1 0 0 1-.9-1.43l1.12-2.28A6 6 0 0 0 6.3 10V9a5.7 5.7 0 1 1 11.4 0v1c0 1.14.27 2.26.78 3.28l1.11 2.28A1 1 0 0 1 18.7 17H17" />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M14 16.5 19 12l-5-4.5" />
      <path d="M8 12h11" />
      <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M15 8a3 3 0 1 0-2.94-3.59L7.8 6.67a3 3 0 1 0 0 4.66l4.26 2.26A3 3 0 1 0 13 15" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M6.5 18.5 4 20V6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v6.5A2.75 2.75 0 0 1 17.25 16H8z" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="8" cy="12" r="1.3" />
      <circle cx="8" cy="16" r="1.3" />
      <circle cx="16" cy="8" r="1.3" />
      <circle cx="16" cy="12" r="1.3" />
      <circle cx="16" cy="16" r="1.3" />
    </svg>
  );
}

function SortableTaskCard({ task, onOpen, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(task.id)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-left shadow-[0_8px_20px_rgba(39,43,77,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(39,43,77,0.18)] ${
        isDragging ? 'opacity-70 shadow-[0_18px_34px_rgba(33,37,68,0.24)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[1.05rem] font-semibold text-slate-800">{task.title}</p>
          {task.description ? (
            <p className="mt-1 max-h-12 overflow-hidden text-sm leading-6 text-slate-500">{task.description}</p>
          ) : null}
        </div>
        <span
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          className="mt-0.5 inline-flex h-8 w-8 flex-none cursor-grab items-center justify-center rounded-full text-slate-400 transition group-hover:bg-slate-100 group-hover:text-slate-600"
        >
          <GripIcon />
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_META[task.priority]}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
            <CommentIcon />
            {task.comments?.length || 0}
          </span>
          {task.assignee?.name ? (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#5f49d7] text-[0.72rem] font-semibold text-white">
              {getInitials(task.assignee.name)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function BoardColumn({ column, tasks, draft, onDraftChange, onSubmit, onOpenTask, dragDisabled }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[620px] w-[320px] flex-none flex-col rounded-[22px] border border-white/20 bg-white/12 p-3 shadow-[0_12px_40px_rgba(28,20,78,0.16)] backdrop-blur-sm transition ${
        isOver ? 'ring-2 ring-white/50' : ''
      }`}
    >
      <div className={`rounded-[18px] bg-gradient-to-r ${column.accent} p-4 shadow-inner`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[1.05rem] font-semibold text-slate-800">{column.label}</h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Task-Liste</p>
          </div>
          <span className={`inline-flex min-w-9 items-center justify-center rounded-full px-2 py-1 text-sm font-semibold text-white ${column.badge}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      <div className={`mt-3 flex min-h-[420px] flex-1 flex-col rounded-[18px] ${column.surface} p-2.5`}>
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onOpen={onOpenTask} disabled={dragDisabled} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm font-medium text-slate-500">
            Hier ist noch nichts. Lege die erste Karte fur diese Liste an.
          </div>
        ) : null}
      </div>

      <form onSubmit={(event) => onSubmit(event, column.key)} className="mt-3 rounded-[18px] bg-white/18 p-2">
        <label className="sr-only" htmlFor={`draft-${column.key}`}>
          Karte hinzufugen
        </label>
        <div className="flex items-center gap-2 rounded-[14px] bg-white/60 px-3 py-2.5 text-slate-600 transition focus-within:bg-white">
          <PlusIcon className="h-4 w-4 flex-none" />
          <input
            id={`draft-${column.key}`}
            value={draft}
            onChange={(event) => onDraftChange(column.key, event.target.value)}
            placeholder="Eine Karte hinzufugen"
            className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </form>
    </section>
  );
}

function TaskModal({
  task,
  form,
  commentDraft,
  onClose,
  onChange,
  onSave,
  onDelete,
  onCommentChange,
  onCommentCreate,
}) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/20 bg-[#f8f7ff] shadow-[0_30px_90px_rgba(14,8,52,0.34)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6d63d8]">Kartenansicht</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{task.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <span className="text-xl leading-none">x</span>
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Titel
                <input
                  value={form.title}
                  onChange={(event) => onChange('title', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Prioritat
                <select
                  value={form.priority}
                  onChange={(event) => onChange('priority', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
                Status
                <select
                  value={form.status}
                  onChange={(event) => onChange('status', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                >
                  {STATUS_COLUMNS.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Beschreibung
              <textarea
                value={form.description}
                onChange={(event) => onChange('description', event.target.value)}
                rows={7}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSave}
                className="rounded-2xl bg-[#614dd8] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(97,77,216,0.28)] transition hover:bg-[#5643ca]"
              >
                Karte speichern
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-2xl bg-rose-100 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
              >
                Karte loschen
              </button>
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-white/80 px-6 py-6 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              <ClockIcon />
              Aktivitat
            </div>

            <div className="mt-5 space-y-3">
              {task.comments?.length ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="rounded-2xl bg-white p-4 shadow-[0_10px_25px_rgba(70,75,112,0.1)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800">{comment.author?.name || 'Team'}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                  Noch keine Kommentare vorhanden.
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <textarea
                value={commentDraft}
                onChange={(event) => onCommentChange(event.target.value)}
                rows={4}
                placeholder="Kommentar schreiben"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
              />
              <button
                type="button"
                onClick={onCommentCreate}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Kommentar senden
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { projectId: routeProjectId } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || '');
  const [searchValue, setSearchValue] = useState('');
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', key: '', description: '' });
  const [cardDrafts, setCardDrafts] = useState(EMPTY_DRAFTS);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODAY' });
  const [commentDraft, setCommentDraft] = useState('');
  const [pageError, setPageError] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const deferredSearch = useDeferredValue(searchValue);
  const dragDisabled = Boolean(deferredSearch.trim());
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
  const activeProjectId = routeProjectId || selectedProjectId;

  const filteredProjects = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => {
      const haystack = `${project.name} ${project.key} ${project.description || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [deferredSearch, projects]);

  const visibleTasks = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) => {
      const haystack = `${task.title} ${task.description || ''} ${task.priority}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [deferredSearch, tasks]);

  const taskColumns = useMemo(() => getTaskMap(visibleTasks), [visibleTasks]);
  const fullTaskColumns = useMemo(() => getTaskMap(tasks), [tasks]);

  const selectedProject = projects.find((project) => project.id === activeProjectId) || null;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  const loadProjects = useCallback(async (preferredProjectId) => {
    setIsLoadingProjects(true);
    setPageError('');
    try {
      const { data } = await api.get('/projects');
      setProjects(data);

      const routeStillValid = routeProjectId && data.some((project) => project.id === routeProjectId);
      const preferredStillValid = preferredProjectId && data.some((project) => project.id === preferredProjectId);
      const currentStillValid = activeProjectId && data.some((project) => project.id === activeProjectId);
      const nextProjectId =
        (routeStillValid && routeProjectId) ||
        (preferredStillValid && preferredProjectId) ||
        (currentStillValid && activeProjectId) ||
        data[0]?.id ||
        '';

      setSelectedProjectId(nextProjectId);

      if (routeProjectId && !routeStillValid && data[0]?.id) {
        navigate(`/projects/${data[0].id}`, { replace: true });
      }
    } catch (error) {
      setPageError(error.response?.data?.message || 'Projekte konnten nicht geladen werden.');
    } finally {
      setIsLoadingProjects(false);
    }
  }, [activeProjectId, navigate, routeProjectId]);

  const loadTasks = useCallback(async (projectId) => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    setIsLoadingTasks(true);
    setPageError('');
    try {
      const { data } = await api.get(`/tasks/project/${projectId}`);
      setTasks(sortTasks(data));
    } catch (error) {
      setPageError(error.response?.data?.message || 'Tasks konnten nicht geladen werden.');
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadProjects]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadTasks(activeProjectId);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [activeProjectId, loadTasks]);

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setSelectedTaskId(null);
    navigate(`/projects/${projectId}`);
  };

  const openTask = (taskId) => {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;

    setSelectedTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
    });
    setCommentDraft('');
  };

  const handleProjectFieldChange = (field, value) => {
    setProjectForm((current) => ({
      ...current,
      [field]: field === 'key' ? value.toUpperCase().replace(/[^A-Z0-9-]/g, '') : value,
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!projectForm.name.trim() || !projectForm.key.trim()) return;

    setPageError('');
    try {
      const { data } = await api.post('/projects', {
        name: projectForm.name.trim(),
        key: projectForm.key.trim(),
        description: projectForm.description.trim(),
      });

      setProjectForm({ name: '', key: '', description: '' });
      setProjectFormOpen(false);
      await loadProjects(data.id);
      navigate(`/projects/${data.id}`);
    } catch (error) {
      setPageError(error.response?.data?.message || 'Projekt konnte nicht erstellt werden.');
    }
  };

  const handleCardDraftChange = (status, value) => {
    setCardDrafts((current) => ({ ...current, [status]: value }));
  };

  const handleCreateTask = async (event, status) => {
    event.preventDefault();
    const title = cardDrafts[status]?.trim();
    if (!title || !activeProjectId) return;

    setPageError('');
    try {
      await api.post('/tasks', {
        title,
        description: '',
        priority: 'MEDIUM',
        status,
        projectId: activeProjectId,
      });
      setCardDrafts((current) => ({ ...current, [status]: '' }));
      await loadTasks(activeProjectId);
    } catch (error) {
      setPageError(error.response?.data?.message || 'Task konnte nicht angelegt werden.');
    }
  };

  const persistTaskOrder = async (previousTasks, nextTasks) => {
    const changedTasks = nextTasks.filter((task) => {
      const previousTask = previousTasks.find((candidate) => candidate.id === task.id);
      return previousTask && (previousTask.status !== task.status || previousTask.order !== task.order);
    });

    if (!changedTasks.length) return;

    try {
      await Promise.all(
        changedTasks.map((task) =>
          api.patch(`/tasks/${task.id}/move`, {
            status: task.status,
            order: task.order,
          }),
        ),
      );
    } catch (error) {
      setPageError(error.response?.data?.message || 'Die Kartenreihenfolge konnte nicht gespeichert werden.');
      await loadTasks(activeProjectId);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || dragDisabled) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const previousTasks = sortTasks(tasks);
    const board = getTaskMap(previousTasks);
    const sourceStatus = STATUS_COLUMNS.find((column) => board[column.key].some((task) => task.id === activeId))?.key;

    if (!sourceStatus) return;

    const overIsColumn = STATUS_COLUMNS.some((column) => column.key === overId);
    const targetTask = overIsColumn ? null : previousTasks.find((task) => task.id === overId);
    const targetStatus = overIsColumn ? overId : targetTask?.status;

    if (!targetStatus) return;

    const sourceIds = board[sourceStatus].map((task) => task.id);
    const targetIds = board[targetStatus].map((task) => task.id);
    const sourceIndex = sourceIds.indexOf(activeId);

    if (sourceIndex === -1) return;

    let nextBoard = { ...board };

    if (sourceStatus === targetStatus) {
      const currentIds = [...sourceIds];
      const targetIndex = overIsColumn ? currentIds.length - 1 : currentIds.indexOf(overId);
      if (targetIndex === -1 || targetIndex === sourceIndex) return;
      const reorderedIds = arrayMove(currentIds, sourceIndex, targetIndex);
      nextBoard = {
        ...board,
        [sourceStatus]: reorderedIds.map((id) => previousTasks.find((task) => task.id === id)).filter(Boolean),
      };
    } else {
      const nextSourceIds = [...sourceIds];
      nextSourceIds.splice(sourceIndex, 1);

      const nextTargetIds = [...targetIds];
      const insertIndex = overIsColumn ? nextTargetIds.length : Math.max(nextTargetIds.indexOf(overId), 0);
      nextTargetIds.splice(insertIndex, 0, activeId);

      nextBoard = {
        ...board,
        [sourceStatus]: nextSourceIds.map((id) => previousTasks.find((task) => task.id === id)).filter(Boolean),
        [targetStatus]: nextTargetIds.map((id) => previousTasks.find((task) => task.id === id)).filter(Boolean),
      };
    }

    const taskLookup = new Map(previousTasks.map((task) => [task.id, task]));
    const nextTasks = STATUS_COLUMNS.flatMap((column) =>
      nextBoard[column.key].map((task, index) => ({
        ...taskLookup.get(task.id),
        status: column.key,
        order: index,
      })),
    );

    setTasks(nextTasks);
    await persistTaskOrder(previousTasks, nextTasks);
  };

  const handleTaskSave = async () => {
    if (!selectedTask) return;

    setPageError('');
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        status: taskForm.status,
        assigneeId: selectedTask.assigneeId || null,
      });
      await loadTasks(activeProjectId);
      setSelectedTaskId(selectedTask.id);
    } catch (error) {
      setPageError(error.response?.data?.message || 'Task konnte nicht gespeichert werden.');
    }
  };

  const handleTaskDelete = async () => {
    if (!selectedTask) return;

    setPageError('');
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      setSelectedTaskId(null);
      await loadTasks(activeProjectId);
    } catch (error) {
      setPageError(error.response?.data?.message || 'Task konnte nicht geloscht werden.');
    }
  };

  const handleCreateComment = async () => {
    if (!selectedTask || !commentDraft.trim()) return;

    setPageError('');
    try {
      await api.post(`/tasks/${selectedTask.id}/comments`, { content: commentDraft.trim() });
      setCommentDraft('');
      await loadTasks(activeProjectId);
      setSelectedTaskId(selectedTask.id);
    } catch (error) {
      setPageError(error.response?.data?.message || 'Kommentar konnte nicht gespeichert werden.');
    }
  };

  const handleShareBoard = async () => {
    if (!activeProjectId || !navigator?.clipboard) return;

    const shareUrl = `${window.location.origin}/projects/${activeProjectId}`;
    await navigator.clipboard.writeText(shareUrl);
  };

  const projectCountCopy = `${projects.length} ${projects.length === 1 ? 'Projekt aktiv' : 'Projekte aktiv'}`;
  const visibleTaskCount = tasks.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(157,112,242,0.65),_rgba(99,79,219,0.92)_38%,_rgba(193,92,195,0.85)_100%)] text-white">
      <header className="border-b border-white/10 bg-[#4d38a5]/85 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 lg:px-7">
          <div className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 text-white">
            <DashboardIcon />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Workspace</p>
              <p className="text-xl font-semibold">NextTask</p>
            </div>
          </div>

          <div className="relative min-w-[240px] flex-1">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Suchen"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/14 pl-12 pr-4 text-base font-medium text-white outline-none transition placeholder:text-white/65 focus:border-white/30 focus:bg-white/20"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
              <SearchIcon />
            </span>
          </div>

          <button
            type="button"
            onClick={() => setProjectFormOpen((current) => !current)}
            className="h-14 rounded-2xl bg-white/14 px-5 text-base font-semibold text-white transition hover:bg-white/20"
          >
            Erstellen
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#7d4ee6] px-4 py-3 text-sm font-semibold shadow-[0_10px_20px_rgba(78,40,170,0.26)]">
              <ClockIcon />
              {projectCountCopy}
            </span>
            <button
              type="button"
              onClick={handleShareBoard}
              disabled={!activeProjectId}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-[#223457] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShareIcon />
              Teilen
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white transition hover:bg-white/20"
            >
              <BellIcon />
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#241d45] px-4 text-sm font-semibold text-white transition hover:bg-[#18122f]"
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-white/10 bg-[#6a4aa4]/55 px-5 py-4 backdrop-blur-sm lg:px-7">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[240px] flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Mein Board</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {selectedProject?.name || (isLoadingProjects ? 'Projekt wird geladen' : 'Projekt auswahlen')}
              </h1>
              {selectedProject ? (
                <span className="rounded-full bg-white/14 px-3 py-1 text-sm font-semibold text-white/90">
                  {selectedProject.key}
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-3xl text-sm text-white/75">
              {selectedProject?.description || 'Lege ein Projekt an oder wähle eines aus, um sofort im Board weiterzuarbeiten.'}
            </p>
          </div>

          {selectedProject ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#5f49d7] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(44,32,103,0.28)]">
                {getInitials(user?.name)}
              </span>
              <div className="rounded-2xl bg-white/12 px-4 py-3 text-sm font-medium text-white/85">
                {visibleTaskCount} Karten in {selectedProject.name}
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white transition hover:bg-white/18"
              >
                <MoreIcon />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <main className="flex gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <aside className="hidden w-[290px] flex-none xl:block">
          <div className="sticky top-5 space-y-4">
            <div className="rounded-[28px] border border-white/16 bg-white/12 p-4 shadow-[0_16px_50px_rgba(33,25,82,0.24)] backdrop-blur-md">
              <div className="rounded-[22px] bg-white/14 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Trello-Ansicht</p>
                <p className="mt-3 text-2xl font-semibold leading-tight">Projekt erstellen und direkt im Board verwalten</p>
                <button
                  type="button"
                  onClick={() => setProjectFormOpen((current) => !current)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#33456e] transition hover:bg-slate-100"
                >
                  <PlusIcon className="h-4 w-4" />
                  Neues Projekt
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-white">Boards</p>
                  <span className="text-xs text-white/60">{filteredProjects.length}</span>
                </div>
                <div className="max-h-[350px] space-y-2 overflow-y-auto pr-1">
                  {filteredProjects.map((project) => {
                    const active = project.id === activeProjectId;
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleProjectSelect(project.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? 'border-white/40 bg-white text-[#2b2d59] shadow-[0_12px_22px_rgba(28,16,78,0.18)]'
                            : 'border-white/12 bg-white/10 text-white hover:bg-white/18'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{project.name}</p>
                            <p className={`mt-1 text-xs ${active ? 'text-slate-500' : 'text-white/65'}`}>{project.key}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[0.7rem] font-semibold ${active ? 'bg-[#efeaff] text-[#5a49d7]' : 'bg-white/14 text-white/80'}`}>
                            {active ? `${tasks.length} Karten` : 'Board'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {!filteredProjects.length && !isLoadingProjects ? (
                    <div className="rounded-2xl border border-dashed border-white/25 px-4 py-8 text-center text-sm text-white/70">
                      Zu deiner Suche wurden keine Projekte gefunden.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {projectFormOpen ? (
              <form
                onSubmit={handleCreateProject}
                className="rounded-[28px] border border-white/16 bg-white p-5 text-slate-900 shadow-[0_18px_45px_rgba(22,16,60,0.26)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6a58da]">Projekt anlegen</p>
                <h2 className="mt-2 text-2xl font-semibold">Neues Board erstellen</h2>
                <div className="mt-5 space-y-3">
                  <input
                    value={projectForm.name}
                    onChange={(event) => handleProjectFieldChange('name', event.target.value)}
                    placeholder="Projektname"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                  />
                  <input
                    value={projectForm.key}
                    onChange={(event) => handleProjectFieldChange('key', event.target.value)}
                    placeholder="Key"
                    maxLength={8}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium uppercase text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                  />
                  <textarea
                    value={projectForm.description}
                    onChange={(event) => handleProjectFieldChange('description', event.target.value)}
                    rows={4}
                    placeholder="Beschreibung"
                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 w-full rounded-2xl bg-[#5f49d7] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(95,73,215,0.28)] transition hover:bg-[#5640cd]"
                >
                  Projekt anlegen
                </button>
              </form>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {pageError ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {pageError}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-3 xl:hidden">
            <button
              type="button"
              onClick={() => setProjectFormOpen((current) => !current)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#31456d] shadow-[0_10px_20px_rgba(34,28,78,0.16)]"
            >
              {projectFormOpen ? 'Projektformular schliessen' : 'Projekt erstellen'}
            </button>
            <div className="min-w-[220px] flex-1 overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                      onClick={() => handleProjectSelect(project.id)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      project.id === activeProjectId ? 'bg-white text-[#28365c]' : 'bg-white/12 text-white hover:bg-white/18'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {projectFormOpen ? (
            <form
              onSubmit={handleCreateProject}
              className="mb-4 rounded-[28px] border border-white/16 bg-white p-5 text-slate-900 shadow-[0_18px_45px_rgba(22,16,60,0.26)] xl:hidden"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6a58da]">Projekt anlegen</p>
              <h2 className="mt-2 text-2xl font-semibold">Neues Board erstellen</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <input
                  value={projectForm.name}
                  onChange={(event) => handleProjectFieldChange('name', event.target.value)}
                  placeholder="Projektname"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                />
                <input
                  value={projectForm.key}
                  onChange={(event) => handleProjectFieldChange('key', event.target.value)}
                  placeholder="Key"
                  maxLength={8}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium uppercase text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15"
                />
                <input
                  value={projectForm.description}
                  onChange={(event) => handleProjectFieldChange('description', event.target.value)}
                  placeholder="Beschreibung"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#6a58da] focus:ring-2 focus:ring-[#6a58da]/15 md:col-span-3"
                />
              </div>
              <button
                type="submit"
                className="mt-5 w-full rounded-2xl bg-[#5f49d7] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(95,73,215,0.28)] transition hover:bg-[#5640cd]"
              >
                Projekt anlegen
              </button>
            </form>
          ) : null}

          {!selectedProject && !isLoadingProjects ? (
            <div className="rounded-[28px] border border-dashed border-white/24 bg-white/10 px-6 py-16 text-center shadow-[0_16px_40px_rgba(27,18,77,0.18)] backdrop-blur-sm">
              <p className="text-lg font-semibold text-white">Noch kein Projekt vorhanden</p>
              <p className="mt-2 text-sm text-white/75">
                Erstelle dein erstes Projekt, damit das Board auf der Startseite direkt nutzbar wird.
              </p>
            </div>
          ) : null}

          {selectedProject ? (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto pb-6">
                <div className="flex min-w-max items-start gap-4">
                  {STATUS_COLUMNS.map((column) => (
                    <BoardColumn
                      key={column.key}
                      column={column}
                      tasks={taskColumns[column.key]}
                      draft={cardDrafts[column.key]}
                      onDraftChange={handleCardDraftChange}
                      onSubmit={handleCreateTask}
                      onOpenTask={openTask}
                      dragDisabled={dragDisabled}
                    />
                  ))}

                  <div className="w-[320px] flex-none rounded-[22px] border border-white/14 bg-white/12 p-4 shadow-[0_12px_40px_rgba(28,20,78,0.16)] backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setProjectFormOpen((current) => !current)}
                      className="flex w-full items-center gap-3 rounded-[18px] bg-white/14 px-4 py-4 text-left text-lg font-semibold text-white transition hover:bg-white/22"
                    >
                      <PlusIcon className="h-5 w-5" />
                      {projectFormOpen ? 'Projektformular anzeigen' : 'Weiteres Projekt hinzufugen'}
                    </button>
                    <div className="mt-4 rounded-[18px] bg-white/10 p-4 text-sm text-white/72">
                      {dragDisabled
                        ? 'Suche ist aktiv. Ziehen und Ablegen ist vorubergehend pausiert, damit das Filterergebnis stabil bleibt.'
                        : 'Nutze die linke Projektliste oder den Erstellen-Button, um weitere Boards in derselben Ansicht anzulegen.'}
                    </div>
                  </div>
                </div>
              </div>
            </DndContext>
          ) : null}

          {selectedProject && !isLoadingTasks && !dragDisabled && !fullTaskColumns.DONE.length ? (
            <p className="mt-1 text-sm text-white/70">
              Tipp: Karten lassen sich per Drag-and-Drop zwischen Heute, Diese Woche, Spater und Erledigt verschieben.
            </p>
          ) : null}
        </section>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-[24px] border border-slate-200/40 bg-white px-3 py-2 text-slate-900 shadow-[0_18px_40px_rgba(31,21,92,0.22)]">
          {BOARD_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'Board' ? 'bg-[#e8f0ff] text-[#2b66ff]' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        form={taskForm}
        commentDraft={commentDraft}
        onClose={() => setSelectedTaskId(null)}
        onChange={(field, value) => setTaskForm((current) => ({ ...current, [field]: value }))}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onCommentChange={setCommentDraft}
        onCommentCreate={handleCreateComment}
      />
    </div>
  );
}
