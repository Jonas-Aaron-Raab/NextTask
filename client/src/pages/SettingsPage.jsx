import { createElement, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Check,
  CalendarDays,
  Image,
  KeyRound,
  LayoutPanelLeft,
  Mail,
  Monitor,
  Moon,
  Palette,
  Rows3,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Type,
  UserRound,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import {
  applyAppearanceSettings,
  applyAppearanceTheme,
  boardBackgroundOptions,
  formatAppearanceDate,
  getStoredAppearanceSettings,
  storeAppearanceSettings,
} from '../utils/appearance';

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
const themeOptions = [
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'dark', label: 'Dunkel', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];
const densityOptions = [
  { value: 'comfortable', label: 'Komfortabel', icon: Rows3 },
  { value: 'compact', label: 'Kompakt', icon: SlidersHorizontal },
];
const startViewOptions = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'projects', label: 'Projekte' },
  { value: 'my-tasks', label: 'Meine Aufgaben' },
  { value: 'calendar', label: 'Kalender' },
];
const dateFormatOptions = [
  { value: 'numeric', label: '30.05.2026', icon: CalendarDays },
  { value: 'long', label: '30. Mai 2026', icon: CalendarDays },
];
const fontSizeOptions = [
  { value: 'normal', label: 'Normal', icon: Type },
  { value: 'large', label: 'Gross', icon: Type },
];

function getInitials(value) {
  if (!value) return 'NT';
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
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

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-extrabold transition ${
              active
                ? 'border-[#b84758] bg-[#fff1f3] text-[#b84758] shadow-[0_10px_22px_rgba(184,71,88,0.12)]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-8 w-14 items-center rounded-full p-1 transition ${
        checked ? 'bg-[#b84758]' : 'bg-slate-200'
      }`}
      title={label}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#b84758] shadow-sm transition ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function SettingRow({ icon: Icon, label, description, children }) {
  const iconNode = createElement(Icon, { className: 'h-5 w-5' });

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)] md:items-center">
      <div className="flex min-w-0 gap-3">
        <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-[#b84758] shadow-sm">
          {iconNode}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">{label}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [searchValue, setSearchValue] = useState('');
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
  const [appearanceForm, setAppearanceForm] = useState(() => getStoredAppearanceSettings());
  const [appearanceOpen, setAppearanceOpen] = useState(true);
  const [appearanceStatus, setAppearanceStatus] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedAppearanceProjectId, setSelectedAppearanceProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const roleLabel = useMemo(
    () => roleOptions.find((option) => option.value === profileForm.role)?.label || profileForm.role,
    [profileForm.role],
  );
  const selectedProjectBackground = appearanceForm.projectBackgrounds?.[selectedAppearanceProjectId] || boardBackgroundOptions[0].value;

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

  useEffect(() => {
    let ignore = false;

    async function loadProjects() {
      setIsLoadingProjects(true);
      setProjectsError('');

      try {
        const { data } = await api.get('/projects');
        if (ignore) return;

        setProjects(data);
        setSelectedAppearanceProjectId((current) => current || data[0]?.id || '');
      } catch (error) {
        if (!ignore) {
          setProjects([]);
          setProjectsError(error.response?.data?.message || 'Projekte konnten nicht geladen werden.');
        }
      } finally {
        if (!ignore) setIsLoadingProjects(false);
      }
    }

    loadProjects();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const storedAppearance = getStoredAppearanceSettings();
    applyAppearanceSettings(storedAppearance);

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const currentAppearance = getStoredAppearanceSettings();
      if (currentAppearance.theme === 'system') {
        applyAppearanceTheme('system');
      }
    };

    mediaQuery?.addEventListener?.('change', handleSystemThemeChange);

    return () => {
      mediaQuery?.removeEventListener?.('change', handleSystemThemeChange);
    };
  }, []);

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

  const handleAppearanceChange = (field, value) => {
    setAppearanceStatus('Layout wurde gespeichert.');
    setAppearanceForm((current) => storeAppearanceSettings({ ...current, [field]: value }));
  };

  const handleProjectBackgroundChange = (value) => {
    if (!selectedAppearanceProjectId) return;

    setAppearanceStatus('Layout wurde gespeichert.');
    setAppearanceForm((current) =>
      storeAppearanceSettings({
        ...current,
        projectBackgrounds: {
          ...(current.projectBackgrounds || {}),
          [selectedAppearanceProjectId]: value,
        },
      }),
    );
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
    <AppShell
      activeItem="Einstellungen"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Einstellungen"
      createMenuItems={[]}
      searchValue={searchValue}
      onSearch={setSearchValue}
    >
      <div className="space-y-6 px-4 py-4 xl:px-6">
        <div className="space-y-5">
          <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="inline-flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-[#fff1f3] text-xl font-extrabold text-[#b84758]">
                  {getInitials(profileForm.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Profil</p>
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
                  Seit {formatAppearanceDate(createdAt, appearanceForm.dateFormat)}
                </span>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="rounded-[30px] border border-slate-300 bg-white px-5 py-8 text-sm font-bold text-slate-500">
              Profil wird geladen ...
            </div>
          ) : null}

          <section className="rounded-[30px] border border-slate-300 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setAppearanceOpen((current) => !current)}
              className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left"
            >
              <span className="flex min-w-0 items-center gap-4">
                  <span className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#fff1f3] text-[#b84758]">
                    <Palette className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Darstellung</span>
                    <span className="mt-1 block text-lg font-extrabold text-slate-950">Layout & Darstellung</span>
                    <span className="mt-1 block text-sm font-medium text-slate-500">
                      Darkmode, Dichte und Startansicht fuer dein Arbeitsgefuehl.
                  </span>
                </span>
              </span>
              <span className="inline-flex items-center gap-3">
                {appearanceStatus ? (
                  <span className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 sm:inline-flex">
                    <CheckCircle2 className="h-4 w-4" />
                    {appearanceStatus}
                  </span>
                ) : null}
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${appearanceOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {appearanceOpen ? (
              <div className="border-t border-slate-200 p-5">
                <div className="space-y-4">
                  <SettingRow
                    icon={Moon}
                    label="Darkmode"
                    description="Waehle hell, dunkel oder automatisch nach deinem System."
                  >
                    <SegmentedControl
                      options={themeOptions}
                      value={appearanceForm.theme}
                      onChange={(value) => handleAppearanceChange('theme', value)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Rows3}
                    label="Layout-Dichte"
                    description="Mehr Luft fuer Planung oder kompakter fuer viele Aufgaben."
                  >
                    <SegmentedControl
                      options={densityOptions}
                      value={appearanceForm.density}
                      onChange={(value) => handleAppearanceChange('density', value)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Image}
                    label="Board-Hintergrund"
                    description="Waehle fuer jedes Projekt einen eigenen Hintergrund."
                  >
                    <div className="space-y-3">
                      <select
                        value={selectedAppearanceProjectId}
                        disabled={isLoadingProjects || !projects.length}
                        onChange={(event) => setSelectedAppearanceProjectId(event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                      >
                        {isLoadingProjects ? (
                          <option value="">Projekte werden geladen ...</option>
                        ) : projects.length ? (
                          projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))
                        ) : (
                          <option value="">Kein Projekt vorhanden</option>
                        )}
                      </select>
                      {projectsError ? (
                        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                          {projectsError}
                        </p>
                      ) : null}
                      {!isLoadingProjects && !projectsError && !projects.length ? (
                        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500">
                          Erstelle zuerst ein Projekt, dann kannst du hier einen Board-Hintergrund zuweisen.
                        </p>
                      ) : null}
                      {selectedAppearanceProjectId ? (
                        <div className="grid gap-2 sm:grid-cols-4">
                          {boardBackgroundOptions.map((option) => {
                            const active = option.value === selectedProjectBackground;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleProjectBackgroundChange(option.value)}
                                className={`min-h-20 rounded-xl border p-2 text-left transition ${
                                  active ? 'border-[#b84758] ring-4 ring-[#b84758]/10' : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span
                                  className="block h-9 rounded-lg"
                                  style={{ backgroundImage: option.background }}
                                />
                                <span className="mt-2 block text-xs font-extrabold text-slate-700">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </SettingRow>

                  <SettingRow
                    icon={CalendarDays}
                    label="Datumsformat"
                    description="Bestimme, ob Datumswerte kurz oder ausgeschrieben erscheinen."
                  >
                    <SegmentedControl
                      options={dateFormatOptions}
                      value={appearanceForm.dateFormat}
                      onChange={(value) => handleAppearanceChange('dateFormat', value)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Type}
                    label="Schriftgroesse"
                    description="Nutze groessere Schrift fuer bessere Lesbarkeit."
                  >
                    <SegmentedControl
                      options={fontSizeOptions}
                      value={appearanceForm.fontSize}
                      onChange={(value) => handleAppearanceChange('fontSize', value)}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={LayoutPanelLeft}
                    label="Sidebar"
                    description="Lege fest, ob die Seitenleiste beim Start offen bleibt."
                  >
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-sm font-extrabold text-slate-700">
                        {appearanceForm.sidebarDefault === 'expanded' ? 'Geoeffnet' : 'Eingeklappt'}
                      </span>
                      <ToggleSwitch
                        checked={appearanceForm.sidebarDefault === 'expanded'}
                        label="Sidebar beim Start geoeffnet"
                        onChange={(checked) => handleAppearanceChange('sidebarDefault', checked ? 'expanded' : 'collapsed')}
                      />
                    </div>
                  </SettingRow>

                  <SettingRow
                    icon={SlidersHorizontal}
                    label="Animationen"
                    description="Reduziere Bewegungen, wenn du eine ruhigere Oberflaeche willst."
                  >
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-sm font-extrabold text-slate-700">
                        {appearanceForm.reduceMotion ? 'Reduziert' : 'Normal'}
                      </span>
                      <ToggleSwitch
                        checked={appearanceForm.reduceMotion}
                        label="Animationen reduzieren"
                        onChange={(checked) => handleAppearanceChange('reduceMotion', checked)}
                      />
                    </div>
                  </SettingRow>

                  <SettingRow
                    icon={Monitor}
                    label="Startansicht"
                    description="Die Ansicht, die spaeter nach dem Login zuerst geoeffnet wird."
                  >
                    <select
                      value={appearanceForm.startView}
                      onChange={(event) => handleAppearanceChange('startView', event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                    >
                      {startViewOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </SettingRow>
                </div>
              </div>
            ) : null}
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <form onSubmit={handleProfileSubmit} className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
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

            <form onSubmit={handlePasswordSubmit} className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
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
