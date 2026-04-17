import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [description, setDescription] = useState('');
  const { logout, user } = useAuth();
  const loadProjects = async () => {
    const { data } = await api.get('/projects');
    setProjects(data);
  };
  useEffect(() => {
    loadProjects();
  }, []);
  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/projects', { name, key: keyValue, description });
    setName('');
    setKeyValue('');
    setDescription('');
    loadProjects();
  };
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow">
          <div>
            <h1 className="text-2xl font-bold">Willkommen, {user?.name}</h1>
            <p className="text-slate-500">Deine NextTask Projekte</p>
          </div>
          <button onClick={logout} className="rounded bg-slate-800 px-4 py-2 text-white">Logout</button>
        </div>
        <div className="mb-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Projekt erstellen</h2>
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
            <input className="rounded border p-3" placeholder="Projektname" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="rounded border p-3" placeholder="Key (z. B. NTX)" value={keyValue} onChange={(e) => setKeyValue(e.target.value.toUpperCase())} />
            <input className="rounded border p-3" placeholder="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="rounded bg-blue-600 px-4 py-3 font-semibold text-white md:col-span-3">Projekt anlegen</button>
          </form>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="rounded-2xl bg-white p-5 shadow transition hover:-translate-y-1">
              <h3 className="text-lg font-bold">{project.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{project.key}</p>
              <p className="mt-3 text-sm text-slate-600">{project.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
