import { createElement, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PROJECT_MANAGER', label: 'Projektmanager' },
  { value: 'DEVELOPER', label: 'Entwicklung' },
  { value: 'QA', label: 'QA' },
  { value: 'DESIGNER', label: 'Design' },
  { value: 'MARKETING', label: 'Marketing' },
];

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function getInitials(value) {
  if (!value) return 'NT';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(value) {
  if (!value) return 'Noch nicht erfasst';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function FieldShell({ label, icon: Icon, children }) {
  const iconNode = createElement(Icon, { className: 'h-4 w-4 text-[#b84758]' });

  return (
    <label className="block text-sm font-bold text-slate-700">
      <span className="inline-flex items-center gap-2">
        {iconNode}
        {label}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'DEVELOPER',
    department: user?.department || 'Development',
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [createdAt, setCreatedAt] = useState('');
  const [isGuest, setIsGuest] = useState(Boolean(user?.isGuest));
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const roleLabel = useMemo(
    () => roleOptions.find((option) => option.value === profileForm.role)?.label || profileForm.role,
    [profileForm.role],
  );

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoading(true);
      setProfileError('');

      try {
        const { data } = await api.get('/auth/me');
        if (ignore) return;

        setProfileForm({
          name: data.user.name || '',
          email: data.user.email || '',
          role: data.user.role || 'DEVELOPER',
          department: data.user.department || 'Development',
        });
        setCreatedAt(data.user.createdAt || '');
        setIsGuest(Boolean(data.user.isGuest));
        updateUser(data.user);
      } catch (error) {
        if (!ignore) {
          setProfileError(error.response?.data?.message || 'Profil konnte nicht geladen werden.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [updateUser]);

  const handleProfileChange = (field, value) => {
    setProfileStatus('');
    setProfileError('');
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordStatus('');
    setPasswordError('');
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileStatus('');
    setProfileError('');

    if (!profileForm.name.trim() || !profileForm.department.trim()) {
      setProfileError('Name und Abteilung sind erforderlich.');
      return;
    }

    if (!isGuest && !profileForm.email.trim()) {
      setProfileError('E-Mail ist erforderlich.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const { data } = await api.put('/auth/me', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        department: profileForm.department.trim(),
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      updateUser(data.user);
      setProfileForm({
        name: data.user.name || '',
        email: data.user.email || '',
        role: data.user.role || 'DEVELOPER',
        department: data.user.department || 'Development',
      });
      setIsGuest(Boolean(data.user.isGuest));
      setProfileStatus('Profil wurde gespeichert.');
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Profil konnte nicht gespeichert werden.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordStatus('');
    setPasswordError('');

    if (isGuest) {
      setPasswordError('Im Gastmodus kann kein Passwort geaendert werden.');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Aktuelles und neues Passwort sind erforderlich.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Die Passwort-Bestaetigung stimmt nicht ueberein.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.put('/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordStatus('Passwort wurde geaendert.');
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Passwort konnte nicht geaendert werden.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <AppShell activeItem="Einstellungen" breadcrumb={['Workspace', 'Einstellungen', 'Profil']}>
      <div className="min-h-full bg-[#f8fafc] px-4 py-5 lg:px-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="inline-flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-[#fff1f3] text-xl font-extrabold text-[#b84758]">
                  {getInitials(profileForm.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">Profil</p>
                  <h1 className="mt-1 text-2xl font-extrabold text-slate-950">{profileForm.name || 'Profil bearbeiten'}</h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {roleLabel} in {profileForm.department || 'keiner Abteilung'}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 text-sm font-bold text-slate-500 sm:grid-cols-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {profileForm.email || 'Keine E-Mail'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  Seit {formatDate(createdAt)}
                </span>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm font-bold text-slate-500">
              Profil wird geladen ...
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">Persoenliche Daten</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Diese Daten werden in Aufgaben, Kommentaren und im Workspace angezeigt.</p>
                </div>
                {profileStatus ? (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {profileStatus}
                  </span>
                ) : null}
              </div>

              {profileError ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {profileError}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FieldShell label="Name" icon={UserRound}>
                  <input
                    value={profileForm.name}
                    onChange={(event) => handleProfileChange('name', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                  />
                </FieldShell>

                <FieldShell label="E-Mail" icon={Mail}>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled={isGuest}
                    onChange={(event) => handleProfileChange('email', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                  />
                </FieldShell>

                <FieldShell label="Rolle" icon={ShieldCheck}>
                  <select
                    value={profileForm.role}
                    disabled
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-500 outline-none"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FieldShell>

                <FieldShell label="Abteilung" icon={BriefcaseBusiness}>
                  <input
                    value={profileForm.department}
                    onChange={(event) => handleProfileChange('department', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                  />
                </FieldShell>
              </div>

              {isGuest ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                  Im Gastmodus bleibt die E-Mail fest, damit der Demo-Zugang weiter funktioniert.
                </p>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? 'Speichern ...' : 'Profil speichern'}
                </button>
              </div>
            </form>

            <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-extrabold text-slate-950">Passwort</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Aendere dein Passwort fuer den direkten Login.</p>
              </div>

              {passwordStatus ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {passwordStatus}
                </div>
              ) : null}

              {passwordError ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {passwordError}
                </div>
              ) : null}

              <div className="mt-5 space-y-4">
                <FieldShell label="Aktuelles Passwort" icon={KeyRound}>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    disabled={isGuest}
                    onChange={(event) => handlePasswordChange('currentPassword', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:bg-slate-100 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                  />
                </FieldShell>

                <FieldShell label="Neues Passwort" icon={KeyRound}>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    disabled={isGuest}
                    onChange={(event) => handlePasswordChange('newPassword', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:bg-slate-100 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                  />
                </FieldShell>

                <FieldShell label="Neues Passwort bestaetigen" icon={KeyRound}>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    disabled={isGuest}
                    onChange={(event) => handlePasswordChange('confirmPassword', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:bg-slate-100 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                  />
                </FieldShell>
              </div>

              {isGuest ? (
                <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                  Passwortwechsel ist nur fuer registrierte Accounts aktiv.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isGuest || isSavingPassword}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <KeyRound className="h-4 w-4" />
                {isSavingPassword ? 'Speichern ...' : 'Passwort aendern'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
