import { createElement, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Check,
  CalendarDays,
  Image,
  Flag,
  KeyRound,
  LayoutPanelLeft,
  Mail,
  Monitor,
  Moon,
  Palette,
  Plus,
  QrCode,
  RotateCcw,
  Rows3,
  Save,
  ShieldCheck,
  ShieldOff,
  SlidersHorizontal,
  Sun,
  Trash2,
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
import {
  createTaskMarker,
  getStoredTaskMarkers,
  loadTaskMarkersFromApi,
  resetTaskMarkers,
  saveTaskMarkersToApi,
  storeTaskMarkers,
  taskMarkerMatchFields,
  taskMarkerQuickColors,
} from '../utils/taskMarkers';

const taskMarkerPriorityOptions = [
  { value: '', label: 'Keine Prioritaet' },
  { value: 'hoch', label: 'Hoch' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'niedrig', label: 'Niedrig' },
];
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

function getCalendarConnectionState(source = {}) {
  return {
    calendarSetupReady: Boolean(source?.calendarSetupReady),
    calendarConnected: Boolean(source?.calendarConnected),
    calendarProvider: source?.calendarProvider || null,
    calendarEmail: source?.calendarEmail || '',
    calendarSyncEnabled: Boolean(source?.calendarSyncEnabled),
    calendarConnectedAt: source?.calendarConnectedAt || '',
    calendarLastSyncedAt: source?.calendarLastSyncedAt || '',
    calendarSyncError: source?.calendarSyncError || '',
  };
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
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-sm font-extrabold transition ${
              active
                ? 'border-[#b84758] bg-[#fff1f3] text-[#b84758] shadow-[0_10px_22px_rgba(184,71,88,0.12)]'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="break-words">{option.label}</span>
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
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
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

function ColorWheelPicker({ value, label, onChange }) {
  return (
    <label className="relative block h-28 w-28 flex-none cursor-pointer" title={label}>
      <span
        className="absolute inset-0 rounded-full border border-slate-300 shadow-inner"
        style={{
          background:
            'conic-gradient(from 90deg, #ff004c, #ff8a00, #ffe600, #39ff14, #00d4ff, #304ffe, #a100ff, #ff00aa, #ff004c)',
        }}
        aria-hidden="true"
      />
      <span className="absolute inset-4 rounded-full bg-white/45 blur-[1px]" aria-hidden="true" />
      <span
        className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_8px_22px_rgba(15,23,42,0.22)]"
        style={{ backgroundColor: value }}
        aria-hidden="true"
      />
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={label}
      />
    </label>
  );
}
export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notificationEmail: user?.notificationEmail || user?.email || '',
    emailNotificationsEnabled: Boolean(user?.emailNotificationsEnabled),
    emailDeliveryReady: Boolean(user?.emailDeliveryReady),
    role: user?.role || 'DEVELOPER',
    department: user?.department || 'Development',
  });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [createdAt, setCreatedAt] = useState('');
  const [isGuest, setIsGuest] = useState(Boolean(user?.isGuest));
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [twoFactorForm, setTwoFactorForm] = useState({
    setupCode: '',
    disablePassword: '',
    disableCode: '',
  });
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [twoFactorStatus, setTwoFactorStatus] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [calendarConnection, setCalendarConnection] = useState(() => getCalendarConnectionState(user));
  const [calendarStatus, setCalendarStatus] = useState('');
  const [calendarError, setCalendarError] = useState('');
  const [appearanceForm, setAppearanceForm] = useState(() => getStoredAppearanceSettings());
  const [appearanceOpen, setAppearanceOpen] = useState(true);
  const [appearanceStatus, setAppearanceStatus] = useState('');
  const [taskMarkers, setTaskMarkers] = useState(() => getStoredTaskMarkers());
  const [taskMarkersOpen, setTaskMarkersOpen] = useState(false);
  const [taskMarkerStatus, setTaskMarkerStatus] = useState('');
  const [taskMarkerError, setTaskMarkerError] = useState('');
  const [isLoadingTaskMarkers, setIsLoadingTaskMarkers] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedAppearanceProjectId, setSelectedAppearanceProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSendingTestMail, setIsSendingTestMail] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false);
  const [isStartingTwoFactor, setIsStartingTwoFactor] = useState(false);
  const [isConfirmingTwoFactor, setIsConfirmingTwoFactor] = useState(false);
  const [isDisablingTwoFactor, setIsDisablingTwoFactor] = useState(false);

  const roleLabel = useMemo(
    () => roleOptions.find((option) => option.value === profileForm.role)?.label || profileForm.role,
    [profileForm.role],
  );
  const selectedProjectBackground = appearanceForm.projectBackgrounds?.[selectedAppearanceProjectId] || boardBackgroundOptions[0].value;
  const searchSuggestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];

    const sections = [
      {
        id: 'settings-profile',
        type: 'Profil',
        label: 'Profil',
        meta: `${profileForm.name || 'Benutzer'} - ${profileForm.email || 'keine E-Mail'}`,
      },
      {
        id: 'settings-mail',
        type: 'Mail',
        label: 'E-Mail-Benachrichtigungen',
        meta: profileForm.notificationEmail || profileForm.email || 'Keine Adresse hinterlegt',
      },
      {
        id: 'settings-password',
        type: 'Konto',
        label: 'Passwort aendern',
        meta: isGuest ? 'Im Gastmodus gesperrt' : 'Account-Sicherheit',
      },
      {
        id: 'settings-two-factor',
        type: '2FA',
        label: 'Zwei-Faktor-Authentifizierung',
        meta: twoFactorEnabled ? 'Aktiviert' : 'Nicht aktiviert',
      },
      {
        id: 'settings-calendar',
        type: 'Kalender',
        label: 'Kalender-Integration',
        meta: calendarConnection.calendarConnected ? calendarConnection.calendarEmail : 'Nicht verbunden',
      },
      {
        id: 'settings-appearance',
        type: 'Layout',
        label: 'Darstellung',
        meta: `Theme ${appearanceForm.theme} - Dichte ${appearanceForm.density}`,
        onSelect: () => setAppearanceOpen(true),
      },
      {
        id: 'settings-markers',
        type: 'Farben',
        label: 'Aufgabenfarben',
        meta: `${taskMarkers.length} Markierungen`,
        onSelect: () => setTaskMarkersOpen(true),
      },
      ...projects.map((project) => ({
        id: `settings-project-${project.id}`,
        type: 'Projekt',
        label: project.name,
        meta: 'Board-Hintergrund',
        onSelect: () => {
          setAppearanceOpen(true);
          setSelectedAppearanceProjectId(project.id);
        },
      })),
      ...taskMarkers.map((marker) => ({
        id: `settings-marker-${marker.id}`,
        type: 'Farbe',
        label: marker.label,
        meta: marker.description || marker.matchValue || 'Aufgabenmarkierung',
        onSelect: () => setTaskMarkersOpen(true),
      })),
    ];

    return sections.filter((item) => [item.label, item.meta, item.type].join(' ').toLowerCase().includes(query));
  }, [appearanceForm.density, appearanceForm.theme, calendarConnection.calendarConnected, calendarConnection.calendarEmail, isGuest, profileForm.email, profileForm.name, profileForm.notificationEmail, projects, searchValue, taskMarkers, twoFactorEnabled]);

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
          notificationEmail: data.user.notificationEmail || data.user.email || '',
          emailNotificationsEnabled: Boolean(data.user.emailNotificationsEnabled),
          emailDeliveryReady: Boolean(data.user.emailDeliveryReady),
          role: data.user.role || 'DEVELOPER',
          department: data.user.department || 'Development',
        });
        setCreatedAt(data.user.createdAt || '');
        setIsGuest(Boolean(data.user.isGuest));
        setTwoFactorEnabled(Boolean(data.user.twoFactorEnabled));
        setCalendarConnection(getCalendarConnectionState(data.user));
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
    const status = searchParams.get('calendar_status');
    const message = searchParams.get('calendar_message');
    if (!status && !message) return;

    if (status === 'connected') {
      setCalendarStatus(message || 'Kalender wurde verbunden.');
      setCalendarError('');
    } else if (status === 'error') {
      setCalendarError(message || 'Kalender konnte nicht verbunden werden.');
      setCalendarStatus('');
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('calendar_status');
    nextParams.delete('calendar_message');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

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

  useEffect(() => {
    let ignore = false;

    async function loadTaskMarkers() {
      setIsLoadingTaskMarkers(true);
      setTaskMarkerError('');

      try {
        const markers = await loadTaskMarkersFromApi();
        if (!ignore) setTaskMarkers(markers);
      } catch (error) {
        if (!ignore) {
          setTaskMarkers(getStoredTaskMarkers());
          setTaskMarkerError(error.response?.data?.message || 'Aufgabenfarben konnten nicht aus der Datenbank geladen werden.');
        }
      } finally {
        if (!ignore) setIsLoadingTaskMarkers(false);
      }
    }

    loadTaskMarkers();

    return () => {
      ignore = true;
    };
  }, []);
  const handleProfileChange = (field, value) => {
    setProfileStatus('');
    setProfileError('');
    setNotificationStatus('');
    setNotificationError('');
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordStatus('');
    setPasswordError('');
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleTwoFactorChange = (field, value) => {
    setTwoFactorStatus('');
    setTwoFactorError('');
    setTwoFactorForm((current) => ({ ...current, [field]: value }));
  };

  const handleCalendarConnect = async () => {
    setCalendarStatus('');
    setCalendarError('');

    if (isGuest) {
      setCalendarError('Im Gastmodus kann kein Kalender verbunden werden.');
      return;
    }

    setIsConnectingCalendar(true);
    try {
      const { data } = await api.post('/calendar-integration/connect-url', {
        returnTo: '/settings',
      });
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setCalendarError(error.response?.data?.message || 'Kalender-Verbindung konnte nicht gestartet werden.');
      setIsConnectingCalendar(false);
    }
  };

  const handleCalendarSync = async () => {
    setCalendarStatus('');
    setCalendarError('');
    setIsSyncingCalendar(true);

    try {
      const { data } = await api.post('/calendar-integration/sync');
      setCalendarConnection(getCalendarConnectionState(data.connection));
      updateUser(data.connection);
      setCalendarStatus(data.message || 'Kalender wurde synchronisiert.');
    } catch (error) {
      setCalendarError(error.response?.data?.message || 'Kalender-Sync konnte nicht gestartet werden.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleCalendarDisconnect = async () => {
    setCalendarStatus('');
    setCalendarError('');
    setIsDisconnectingCalendar(true);

    try {
      const { data } = await api.delete('/calendar-integration/disconnect');
      setCalendarConnection(getCalendarConnectionState(data.connection));
      updateUser(data.connection);
      setCalendarStatus(data.message || 'Kalender-Verbindung wurde getrennt.');
    } catch (error) {
      setCalendarError(error.response?.data?.message || 'Kalender-Verbindung konnte nicht getrennt werden.');
    } finally {
      setIsDisconnectingCalendar(false);
    }
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

  const persistTaskMarkers = async (nextMarkers, message = 'Aufgabenfarben wurden gespeichert.') => {
    const locallyStoredMarkers = storeTaskMarkers(nextMarkers);
    setTaskMarkers(locallyStoredMarkers);
    setTaskMarkerStatus('Speichert ...');
    setTaskMarkerError('');

    try {
      const savedMarkers = await saveTaskMarkersToApi(locallyStoredMarkers);
      setTaskMarkers(savedMarkers);
      setTaskMarkerStatus(message);
    } catch (error) {
      setTaskMarkerStatus('Lokal gespeichert.');
      setTaskMarkerError(error.response?.data?.message || 'Datenbank-Speicherung ist fehlgeschlagen. Die Aenderung bleibt lokal erhalten.');
    }
  };

  const handleTaskMarkerChange = (markerId, field, value) => {
    persistTaskMarkers(
      taskMarkers.map((marker) => {
        if (marker.id !== markerId) return marker;
        if (field === 'matchField') return { ...marker, matchField: value, matchValue: '' };
        return { ...marker, [field]: value };
      }),
    );
  };

  const handleTaskMarkerAdd = () => {
    persistTaskMarkers([...taskMarkers, createTaskMarker()], 'Neue Markierung wurde angelegt.');
  };

  const handleTaskMarkerRemove = (markerId) => {
    if (taskMarkers.length <= 1) {
      setTaskMarkerStatus('Mindestens eine Markierung bleibt aktiv.');
      return;
    }

    persistTaskMarkers(
      taskMarkers.filter((marker) => marker.id !== markerId),
      'Markierung wurde entfernt.',
    );
  };

  const handleTaskMarkerReset = () => {
    persistTaskMarkers(resetTaskMarkers(), 'Standardfarben wurden wiederhergestellt.');
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

    if (!isGuest && profileForm.emailNotificationsEnabled && !profileForm.notificationEmail.trim() && !profileForm.email.trim()) {
      setNotificationError('Bitte hinterlege eine Benachrichtigungs-E-Mail.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const { data } = await api.put('/auth/me', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        notificationEmail: profileForm.notificationEmail.trim(),
        emailNotificationsEnabled: profileForm.emailNotificationsEnabled,
        department: profileForm.department.trim(),
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      updateUser(data.user);
      setProfileForm({
        name: data.user.name || '',
        email: data.user.email || '',
        notificationEmail: data.user.notificationEmail || data.user.email || '',
        emailNotificationsEnabled: Boolean(data.user.emailNotificationsEnabled),
        emailDeliveryReady: Boolean(data.user.emailDeliveryReady),
        role: data.user.role || 'DEVELOPER',
        department: data.user.department || 'Development',
      });
      setIsGuest(Boolean(data.user.isGuest));
      setProfileStatus('Profil wurde gespeichert.');
      setNotificationStatus('E-Mail-Einstellungen wurden gespeichert.');
    } catch (error) {
      const message = error.response?.data?.message || 'Profil konnte nicht gespeichert werden.';
      setProfileError(message);
      setNotificationError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNotificationTestMail = async () => {
    setNotificationStatus('');
    setNotificationError('');
    setIsSendingTestMail(true);

    try {
      const { data } = await api.post('/auth/me/notifications/test');
      setNotificationStatus(data.message || 'Testmail wurde versendet.');
    } catch (error) {
      setNotificationError(error.response?.data?.message || 'Testmail konnte nicht versendet werden.');
    } finally {
      setIsSendingTestMail(false);
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

  const handleTwoFactorSetupStart = async () => {
    setTwoFactorStatus('');
    setTwoFactorError('');

    if (isGuest) {
      setTwoFactorError('Im Gastmodus kann keine 2FA eingerichtet werden.');
      return;
    }

    setIsStartingTwoFactor(true);
    try {
      const { data } = await api.post('/auth/me/2fa/setup');
      setTwoFactorSetup({
        qrCodeDataUrl: data.qrCodeDataUrl,
        secret: data.secret,
        recoveryCodes: [],
      });
      setTwoFactorForm((current) => ({ ...current, setupCode: '' }));
      setTwoFactorStatus('Authenticator wurde vorbereitet.');
    } catch (error) {
      setTwoFactorError(error.response?.data?.message || '2FA-Einrichtung konnte nicht gestartet werden.');
    } finally {
      setIsStartingTwoFactor(false);
    }
  };

  const handleTwoFactorConfirm = async () => {
    setTwoFactorStatus('');
    setTwoFactorError('');

    if (!twoFactorForm.setupCode.trim()) {
      setTwoFactorError('Bitte gib den Authenticator-Code ein.');
      return;
    }

    setIsConfirmingTwoFactor(true);
    try {
      const { data } = await api.post('/auth/me/2fa/confirm', {
        code: twoFactorForm.setupCode.trim(),
      });
      updateUser(data.user);
      setTwoFactorEnabled(Boolean(data.user.twoFactorEnabled));
      setTwoFactorSetup((current) => ({
        ...(current || {}),
        recoveryCodes: data.recoveryCodes || [],
      }));
      setTwoFactorForm({
        setupCode: '',
        disablePassword: '',
        disableCode: '',
      });
      setTwoFactorStatus(data.message || '2FA wurde aktiviert.');
    } catch (error) {
      setTwoFactorError(error.response?.data?.message || '2FA konnte nicht aktiviert werden.');
    } finally {
      setIsConfirmingTwoFactor(false);
    }
  };

  const handleTwoFactorDisable = async () => {
    setTwoFactorStatus('');
    setTwoFactorError('');

    if (!twoFactorForm.disablePassword || !twoFactorForm.disableCode.trim()) {
      setTwoFactorError('Passwort und 2FA-Code sind erforderlich.');
      return;
    }

    setIsDisablingTwoFactor(true);
    try {
      const { data } = await api.post('/auth/me/2fa/disable', {
        password: twoFactorForm.disablePassword,
        code: twoFactorForm.disableCode.trim(),
      });
      updateUser(data.user);
      setTwoFactorEnabled(Boolean(data.user.twoFactorEnabled));
      setTwoFactorSetup(null);
      setTwoFactorForm({
        setupCode: '',
        disablePassword: '',
        disableCode: '',
      });
      setTwoFactorStatus(data.message || '2FA wurde deaktiviert.');
    } catch (error) {
      setTwoFactorError(error.response?.data?.message || '2FA konnte nicht deaktiviert werden.');
    } finally {
      setIsDisablingTwoFactor(false);
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
      searchSuggestions={searchSuggestions}
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
              <div className="grid w-full gap-2 text-sm font-bold text-slate-500 lg:w-auto lg:grid-cols-2">
                <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{profileForm.email || 'Keine E-Mail'}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  <span className="truncate">Seit {formatAppearanceDate(createdAt, appearanceForm.dateFormat)}</span>
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
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
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
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
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

          <section className="rounded-[30px] border border-slate-300 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setTaskMarkersOpen((current) => !current)}
              className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left"
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#fff1f3] text-[#b84758]">
                  <Flag className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Aufgabenfarben</span>
                  <span className="mt-1 block text-lg font-extrabold text-slate-950">Farbstreifen</span>
                  <span className="mt-1 block text-sm font-medium text-slate-500">
                    Bedeutungen, Farben und Zuordnung fuer Aufgaben-Markierungen.
                  </span>
                </span>
              </span>
              <span className="inline-flex items-center gap-3">
                {taskMarkerStatus ? (
                  <span className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 sm:inline-flex">
                    <CheckCircle2 className="h-4 w-4" />
                    {taskMarkerStatus}
                  </span>
                ) : null}
                <ChevronDown className={`h-5 w-5 text-slate-400 transition ${taskMarkersOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {taskMarkersOpen ? (
              <div className="border-t border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTaskMarkerAdd}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#b84758] px-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(184,71,88,0.18)] transition hover:bg-[#a23d4d] sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Neue Markierung
                    </button>
                    <button
                      type="button"
                      onClick={handleTaskMarkerReset}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Zuruecksetzen
                    </button>
                  </div>
                  {taskMarkerStatus ? (
                    <span className="text-sm font-bold text-emerald-700 sm:hidden">{taskMarkerStatus}</span>
                  ) : null}
                </div>

                {isLoadingTaskMarkers ? (
                  <p className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500">
                    Aufgabenfarben werden geladen ...
                  </p>
                ) : null}
                {taskMarkerError ? (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                    {taskMarkerError}
                  </p>
                ) : null}

                <div className="mt-4 space-y-3">
                  {taskMarkers.map((marker) => (
                    <div key={marker.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-4 lg:grid-cols-[128px_minmax(0,1fr)_auto]">
                        <div className="flex items-center gap-4 lg:block">
                          <ColorWheelPicker
                            value={marker.color}
                            label={`Farbe fuer ${marker.label} waehlen`}
                            onChange={(value) => handleTaskMarkerChange(marker.id, 'color', value)}
                          />
                          <span className="inline-flex h-12 w-12 flex-none rounded-xl border border-white shadow-sm lg:mt-3" style={{ backgroundColor: marker.color }} />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="block text-sm font-bold text-slate-700">
                            Name
                            <input
                              value={marker.label}
                              onChange={(event) => handleTaskMarkerChange(marker.id, 'label', event.target.value)}
                              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                            />
                          </label>
                          <label className="block text-sm font-bold text-slate-700">
                            Bedeutung
                            <input
                              value={marker.description}
                              onChange={(event) => handleTaskMarkerChange(marker.id, 'description', event.target.value)}
                              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                            />
                          </label>
                          <label className="block text-sm font-bold text-slate-700">
                            Zuordnung
                            <select
                              value={marker.matchField}
                              onChange={(event) => handleTaskMarkerChange(marker.id, 'matchField', event.target.value)}
                              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                            >
                              {taskMarkerMatchFields.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm font-bold text-slate-700">
                            Wert
                            {marker.matchField === 'priority' ? (
                              <select
                                value={marker.matchValue}
                                onChange={(event) => handleTaskMarkerChange(marker.id, 'matchValue', event.target.value)}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                              >
                                {taskMarkerPriorityOptions.map((option) => (
                                  <option key={option.value || 'empty'} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={marker.matchValue}
                                onChange={(event) => handleTaskMarkerChange(marker.id, 'matchValue', event.target.value)}
                                disabled={!marker.matchField}
                                placeholder={
                                  marker.matchField === 'status'
                                    ? 'review, blocked, done ...'
                                    : marker.matchField === 'project'
                                      ? 'Projektname'
                                      : marker.matchField === 'tag'
                                        ? 'Tag'
                                        : 'Keine Zuordnung ausgewaehlt'
                                }
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10 disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            )}
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTaskMarkerRemove(marker.id)}
                          disabled={taskMarkers.length <= 1}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#b84758] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`${marker.label} entfernen`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {taskMarkerQuickColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleTaskMarkerChange(marker.id, 'color', color)}
                            className={`h-7 w-7 rounded-full border-2 transition ${marker.color.toLowerCase() === color.toLowerCase() ? 'border-slate-900 ring-2 ring-slate-200' : 'border-white hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                            aria-label={`${color} auswaehlen`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
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

              <div className="mt-5 rounded-[26px] border border-slate-200 bg-[#fcfdff] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950">E-Mail-Benachrichtigungen</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Lege fest, ob du bei Zuweisungen und @Mentions Mails erhalten willst.
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
                      profileForm.emailDeliveryReady
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    {profileForm.emailDeliveryReady ? 'Server bereit' : 'Server noch nicht verbunden'}
                  </span>
                </div>

                {notificationStatus ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    {notificationStatus}
                  </div>
                ) : null}

                {notificationError ? (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {notificationError}
                  </div>
                ) : null}

                <div className="mt-4 space-y-4">
                  <SettingRow
                    icon={Mail}
                    label="Benachrichtigungsadresse"
                    description="Diese Adresse wird fuer Task-Zuweisungen und Erwaehnungen verwendet."
                  >
                    <input
                      type="email"
                      value={profileForm.notificationEmail}
                      disabled={isGuest}
                      onChange={(event) => handleProfileChange('notificationEmail', event.target.value)}
                      placeholder="name@firma.de"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Bell}
                    label="Benachrichtigungen aktivieren"
                    description="Sende mir Mails, wenn mir ein Ticket zugewiesen wird oder ich in Kommentaren markiert werde."
                  >
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-700">
                          {profileForm.emailNotificationsEnabled ? 'Aktiv' : 'Deaktiviert'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {profileForm.emailNotificationsEnabled
                            ? 'Zuweisungen und Mentions senden eine E-Mail an dich.'
                            : 'Es werden keine Task-Mails an dich versendet.'}
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={profileForm.emailNotificationsEnabled}
                        label="E-Mail-Benachrichtigungen aktivieren"
                        onChange={(checked) => handleProfileChange('emailNotificationsEnabled', checked)}
                      />
                    </div>
                  </SettingRow>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-700">Testmail</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Damit pruefst du direkt, ob Versand und Template bei dir ankommen.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleNotificationTestMail}
                      disabled={
                        isGuest ||
                        isSendingTestMail ||
                        !profileForm.emailDeliveryReady ||
                        !profileForm.emailNotificationsEnabled
                      }
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <Mail className="h-4 w-4" />
                      {isSendingTestMail ? 'Sende Testmail ...' : 'Testmail senden'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-700">Kalender verbinden</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Verbinde deinen persoenlichen Kalender, damit Ticket-Fristen automatisch als Termine auftauchen.
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
                          calendarConnection.calendarConnected
                            ? 'bg-emerald-50 text-emerald-700'
                            : calendarConnection.calendarSetupReady
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <CalendarDays className="h-4 w-4" />
                        {calendarConnection.calendarConnected
                          ? 'Verbunden'
                          : calendarConnection.calendarSetupReady
                            ? 'Bereit zum Verbinden'
                            : 'Server noch nicht konfiguriert'}
                      </span>
                    </div>

                    {calendarStatus ? (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        {calendarStatus}
                      </div>
                    ) : null}

                    {calendarError ? (
                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                        {calendarError}
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-[#fcfdff] px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Kalenderkonto</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-800">
                          {calendarConnection.calendarConnected
                            ? calendarConnection.calendarEmail || 'Persoenlicher Kalender'
                            : 'Noch nicht verbunden'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Aktuell wird fuer den Connect-Flow Google/Gmail verwendet, die Funktion bleibt in NextTask aber bewusst allgemein.
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-[#fcfdff] px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Letzte Synchronisierung</p>
                        <p className="mt-1 text-sm font-extrabold text-slate-800">
                          {calendarConnection.calendarLastSyncedAt
                            ? formatAppearanceDate(calendarConnection.calendarLastSyncedAt, appearanceForm.dateFormat)
                            : 'Noch kein Sync'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Synchronisiert werden aktuell nur Tickets mit echter Frist.
                        </p>
                      </div>
                    </div>

                    {calendarConnection.calendarSyncError ? (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                        Letzter Sync-Hinweis: {calendarConnection.calendarSyncError}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleCalendarConnect}
                        disabled={isGuest || !calendarConnection.calendarSetupReady || isConnectingCalendar}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(184,71,88,0.18)] transition hover:bg-[#a23d4d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto"
                      >
                        <CalendarDays className="h-4 w-4" />
                        {isConnectingCalendar
                          ? 'Verbinde ...'
                          : calendarConnection.calendarConnected
                            ? 'Neu verbinden'
                            : 'Kalender verbinden'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCalendarSync}
                        disabled={!calendarConnection.calendarConnected || isSyncingCalendar}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {isSyncingCalendar ? 'Synchronisiere ...' : 'Jetzt synchronisieren'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCalendarDisconnect}
                        disabled={!calendarConnection.calendarConnected || isDisconnectingCalendar}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
                      >
                        <ShieldOff className="h-4 w-4" />
                        {isDisconnectingCalendar ? 'Trenne ...' : 'Verbindung trennen'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isGuest ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                  Im Gastmodus bleiben E-Mail und Benachrichtigungen fest, damit der Demo-Zugang weiter funktioniert.
                </p>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d] disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
                >
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? 'Speichern ...' : 'Profil speichern'}
                </button>
              </div>
            </form>

            <div className="space-y-5">
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

            <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">Zwei-Faktor</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Authenticator-App fuer den Login.</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
                    twoFactorEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {twoFactorEnabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                  {twoFactorEnabled ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>

              {twoFactorStatus ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {twoFactorStatus}
                </div>
              ) : null}

              {twoFactorError ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {twoFactorError}
                </div>
              ) : null}

              {twoFactorSetup?.recoveryCodes?.length ? (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-extrabold text-amber-800">Recovery-Codes</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {twoFactorSetup.recoveryCodes.map((code) => (
                      <code key={code} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-900">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              ) : null}

              {isGuest ? (
                <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                  2FA ist nur fuer registrierte Accounts aktiv.
                </p>
              ) : null}

              {!isGuest && !twoFactorEnabled ? (
                <div className="mt-5 space-y-4">
                  {!twoFactorSetup ? (
                    <button
                      type="button"
                      onClick={handleTwoFactorSetupStart}
                      disabled={isStartingTwoFactor}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <QrCode className="h-4 w-4" />
                      {isStartingTwoFactor ? 'Bereite vor ...' : '2FA einrichten'}
                    </button>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                      <img
                        src={twoFactorSetup.qrCodeDataUrl}
                        alt="TOTP QR-Code"
                        className="h-[220px] w-[220px] rounded-xl border border-slate-200 bg-white p-3"
                      />
                      <div className="space-y-4">
                        <FieldShell label="Manueller Schluessel" icon={QrCode}>
                          <input
                            readOnly
                            value={twoFactorSetup.secret || ''}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-bold text-slate-700 outline-none"
                          />
                        </FieldShell>

                        <FieldShell label="Authenticator-Code" icon={ShieldCheck}>
                          <input
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={twoFactorForm.setupCode}
                            onChange={(event) => handleTwoFactorChange('setupCode', event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                          />
                        </FieldShell>

                        <button
                          type="button"
                          onClick={handleTwoFactorConfirm}
                          disabled={isConfirmingTwoFactor}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d] disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          {isConfirmingTwoFactor ? 'Pruefe ...' : '2FA bestaetigen'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {!isGuest && twoFactorEnabled ? (
                <div className="mt-5 space-y-4">
                  <FieldShell label="Aktuelles Passwort" icon={KeyRound}>
                    <input
                      type="password"
                      value={twoFactorForm.disablePassword}
                      onChange={(event) => handleTwoFactorChange('disablePassword', event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                    />
                  </FieldShell>

                  <FieldShell label="2FA-Code oder Recovery-Code" icon={ShieldCheck}>
                    <input
                      autoComplete="one-time-code"
                      value={twoFactorForm.disableCode}
                      onChange={(event) => handleTwoFactorChange('disableCode', event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
                    />
                  </FieldShell>

                  <button
                    type="button"
                    onClick={handleTwoFactorDisable}
                    disabled={isDisablingTwoFactor}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-[#b84758] transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <ShieldOff className="h-4 w-4" />
                    {isDisablingTwoFactor ? 'Deaktiviere ...' : '2FA deaktivieren'}
                  </button>
                </div>
              ) : null}
            </section>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
