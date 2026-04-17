import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login fehlgeschlagen');
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">NextTask Login</h1>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <input className="mb-3 w-full rounded border p-3" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mb-3 w-full rounded border p-3" placeholder="Passwort" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded bg-blue-600 p-3 font-semibold text-white">Einloggen</button>
        <p className="mt-4 text-sm">Noch keinen Account? <Link to="/register" className="text-blue-600">Registrieren</Link></p>
      </form>
    </div>
  );
}
