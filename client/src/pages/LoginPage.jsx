import { useEffect, useState } from 'react';
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
  const [ssoConfig, setSsoConfig] = useState({ enabled: false, displayName: 'SSO' });
  const [ssoStatus, setSsoStatus] = useState('');
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

  useEffect(() => {
    let ignore = false;

    api
      .get('/auth/sso/config')
      .then(({ data }) => {
        if (!ignore) setSsoConfig(data);
      })
      .catch(() => {
        if (!ignore) setSsoConfig({ enabled: false, displayName: 'SSO' });
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ssoState = params.get('sso');
    const code = params.get('code');
    const message = params.get('message');
    const returnTo = params.get('returnTo') || redirectTo;

    if (ssoState === 'error') {
      queueMicrotask(() => {
        setError(message || 'SSO-Anmeldung fehlgeschlagen');
        navigate('/login', { replace: true });
      });
      return;
    }

    if (ssoState !== 'callback' || !code) return;

    let ignore = false;

    queueMicrotask(() => {
      if (ignore) return;

      setError('');
      setSsoStatus('SSO-Anmeldung wird abgeschlossen ...');
      setIsSubmitting(true);

      api
        .post('/auth/sso/exchange', { code })
        .then(({ data }) => {
          if (ignore) return;
          login(data.token, data.user);
          navigate(returnTo, { replace: true });
        })
        .catch((err) => {
          if (!ignore) {
            setError(err.response?.data?.message || 'SSO-Anmeldung konnte nicht abgeschlossen werden');
            setSsoStatus('');
            navigate('/login', { replace: true });
          }
        })
        .finally(() => {
          if (!ignore) setIsSubmitting(false);
        });
    });

    return () => {
      ignore = true;
    };
  }, [location.search, login, navigate, redirectTo]);

  const handleSsoLogin = () => {
    const apiBaseUrl = api.defaults.baseURL || 'http://localhost:5001/api';
    const loginUrl = new URL(`${apiBaseUrl.replace(/\/+$/, '')}/auth/sso/login`);
    loginUrl.searchParams.set('returnTo', redirectTo);
    if (email.trim()) loginUrl.searchParams.set('login_hint', email.trim());

    window.location.href = loginUrl.toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSsoStatus('');

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
        setError(err.response?.data?.message || '2FA-Code konnte nicht geprüft werden');
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
    setSsoStatus('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">{requiresTwoFactor ? 'Zwei-Faktor-Code' : 'NextTask Login'}</h1>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {ssoStatus && <p className="mb-4 rounded border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-700">{ssoStatus}</p>}
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
              {isSubmitting ? 'Prüfe ...' : 'Code bestätigen'}
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
              {isSubmitting ? 'Prüfe ...' : 'Einloggen'}
            </button>
            {ssoConfig.enabled ? (
              <>
                <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  oder
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <button
                  type="button"
                  onClick={handleSsoLogin}
                  disabled={isSubmitting}
                  className="w-full rounded border border-slate-300 bg-white p-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mit {ssoConfig.displayName || 'SSO'} anmelden
                </button>
              </>
            ) : null}
            <p className="mt-4 text-sm">Noch keinen Account? <Link to="/register" className="text-blue-600">Registrieren</Link></p>
          </>
        )}
      </form>
    </div>
  );
}
