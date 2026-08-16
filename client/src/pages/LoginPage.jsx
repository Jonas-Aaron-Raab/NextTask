import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const requiresTwoFactor = Boolean(challengeToken);
  const redirectTo = location.state?.from?.pathname || '/';

  const completeLogin = (data) => {
    login(data.token, data.user);
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (requiresTwoFactor) {
      if (!twoFactorCode.trim()) {
        setError('Bitte 2FA-Code eingeben');
        return;
      }

      setIsSubmitting(true);
      try {
        const { data } = await api.post('/auth/login/2fa', {
          challengeToken,
          code: twoFactorCode.trim(),
        });
        completeLogin(data);
      } catch (err) {
        setError(err.response?.data?.message || '2FA-Code konnte nicht geprueft werden');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Bitte E-Mail und Passwort eingeben');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      if (data.requiresTwoFactor) {
        setChallengeToken(data.challengeToken);
        setPendingUser(data.user);
        setPassword('');
        setTwoFactorCode('');
        return;
      }

      completeLogin(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetLogin = () => {
    setChallengeToken('');
    setPendingUser(null);
    setTwoFactorCode('');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">{requiresTwoFactor ? 'Zwei-Faktor-Code' : 'NextTask Login'}</h1>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {requiresTwoFactor ? (
          <>
            <p className="mb-4 rounded border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
              {pendingUser?.email || email.trim()}
            </p>
            <input
              className="mb-3 w-full rounded border p-3"
              placeholder="Authenticator-Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              required
            />
            <button
              disabled={isSubmitting}
              className="w-full rounded bg-blue-600 p-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Pruefe ...' : 'Code bestaetigen'}
            </button>
            <button type="button" onClick={handleResetLogin} className="mt-3 w-full rounded border p-3 font-semibold text-slate-700">
              Zurueck
            </button>
          </>
        ) : (
          <>
            <input className="mb-3 w-full rounded border p-3" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="mb-3 w-full rounded border p-3" placeholder="Passwort" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button
              disabled={isSubmitting}
              className="w-full rounded bg-blue-600 p-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Pruefe ...' : 'Einloggen'}
            </button>
            <p className="mt-4 text-sm">Noch keinen Account? <Link to="/register" className="text-blue-600">Registrieren</Link></p>
          </>
        )}
      </form>
    </div>
  );
}
