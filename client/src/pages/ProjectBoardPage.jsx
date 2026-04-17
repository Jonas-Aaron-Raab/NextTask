import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
const statuses = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'DONE', label: 'Done' },
];
export default function ProjectBoardPage() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const loadTasks = async () => {
    const { data } = await api.get(`/tasks/project/${projectId}`);
    setTasks(data);
  };
  useEffect(() => {
    loadTasks();
  }, [projectId]);
  const grouped = useMemo(() => {
    const map = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };
    for (const task of tasks) {
      map[task.status].push(task);
    }
    return map;
  }, [tasks]);
  const createTask = async (e) => {
    e.preventDefault();
    await api.post('/tasks', {
      title,
      description,
      priority,
      status,
      projectId,
    });
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setStatus('TODO');
    loadTasks();
  };
  const moveTask = async (taskId, nextStatus) => {
    await api.patch(`/tasks/${taskId}/move`, {
      status: nextStatus,
      order: 0,
    });
    loadTasks();
  };
  const removeTask = async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    loadTasks();
  };
  return (
    <div className="min-h-screen bg-[#f7f8fa] p-5">
      <div className="mb-6 rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold">NextTask Board</h1>
        <p className="text-slate-500">Jira-ähnliche Aufgabenübersicht</p>
      </div>
      <div className="mb-6 rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-semibold">Neue Task erstellen</h2>
        <form onSubmit={createTask} className="grid gap-3 md:grid-cols-4">
          <input className="rounded border p-3" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="rounded border p-3" placeholder="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} />
          <select className="rounded border p-3" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
          <select className="rounded border p-3" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </select>
          <button className="rounded bg-blue-600 px-4 py-3 font-semibold text-white md:col-span-4">Task hinzufügen</button>
        </form>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {statuses.map((column) => (
          <div key={column.key} className="rounded-2xl bg-slate-200 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold uppercase text-slate-700">{column.label}</h3>
              <span className="rounded bg-white px-2 py-1 text-sm">{grouped[column.key].length}</span>
            </div>
            <div className="space-y-3">
              {grouped[column.key].map((task) => (
                <div key={task.id} className="rounded-2xl bg-white p-4 shadow">
                  <h4 className="font-semibold">{task.title}</h4>
                  <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                  <p className="mt-2 text-xs font-bold text-slate-600">Priority: {task.priority}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {statuses.filter((s) => s.key !== task.status).map((s) => (
                      <button
                        key={s.key}
                        onClick={() => moveTask(task.id, s.key)}
                        className="rounded bg-slate-100 px-2 py-1 text-xs"
                      >
                        → {s.label}
                      </button>
                    ))}
                    <button onClick={() => removeTask(task.id)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-600">
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
