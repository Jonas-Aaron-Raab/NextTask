import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder,
  History,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  FileText,
  User,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canManageRoles } from '../data/bankOrganization';
import { getStoredAppearanceSettings } from '../utils/appearance';

const navigationItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Abteilungen', path: '/departments', icon: Building2 },
  { label: 'Projekte', path: '/projects', icon: Folder },
  { label: 'Aufgaben', path: '/my-tasks', icon: CheckSquare },
  { label: 'Freigaben', path: '/approvals', icon: BadgeCheck },
  { label: 'Kalender', path: '/calendar', icon: Calendar },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Dokumente', path: '/documents', icon: FileText },
  { label: 'Rollen', path: '/roles', icon: ShieldCheck, adminOnly: true },
  { label: 'Audit-Log', path: '/audit-log', icon: History, adminOnly: true },
  { label: 'Einstellungen', path: '/settings', icon: Settings },
];

const defaultCreateMenuItems = ['Neue Aufgabe', 'Neues Projekt', 'Neuer Kommentar', 'Teammitglied einladen'];
const notifications = [
  'Checkout Flow testen wurde in QA verschoben.',
  'SEO Meta-Tags aktualisieren wurde dir zugewiesen.',
  'Design System aktualisiert wurde abgeschlossen.',
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

function MenuCard({ children, className = '' }) {
  return (
    <div className={`absolute right-0 top-full z-30 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.14)] ${className}`}>
      {children}
    </div>
  );
}

function SparkasseMark({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="44" height="44" rx="10.5" fill="#e30613" />
      <circle cx="24" cy="9.4" r="3.95" fill="#ffffff" />
      <rect x="12.3" y="15.9" width="22.2" height="22.2" rx="6.6" fill="#ffffff" />
      <path
        d="M16.9 21.75h17.6a1.6 1.6 0 1 1 0 3.2H16.9a1.6 1.6 0 1 1 0-3.2Z"
        fill="#e30613"
      />
      <path
        d="M12.3 29.35h17.9a1.6 1.6 0 1 1 0 3.2H12.3a1.6 1.6 0 1 1 0-3.2Z"
        fill="#e30613"
      />
    </svg>
  );
}

export default function AppShell({
  activeItem = 'Dashboard',
  breadcrumb = ['Workspace', 'Web-Relaunch', 'Dashboard'],
  children,
  onCreateAction,
  onSearch,
  searchValue = '',
  hideBreadcrumb = false,
  searchPlacement = 'center',
  createMenuItems = defaultCreateMenuItems,
  headerTitle = '',
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const searchInputRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStoredAppearanceSettings().sidebarDefault === 'collapsed');
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [, setRoleNavigationVersion] = useState(0);
  const activeNavigation = navigationItems
    .filter((item) => !item.adminOnly || canManageRoles(user))
    .map((item) => ({
      ...item,
      active: item.label === activeItem,
    }));

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!isShortcut) return;

      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleAppearanceChange = (event) => {
      setSidebarCollapsed(event.detail.sidebarDefault === 'collapsed');
    };

    window.addEventListener('nexttask:appearance-change', handleAppearanceChange);
    return () => window.removeEventListener('nexttask:appearance-change', handleAppearanceChange);
  }, []);

  useEffect(() => {
    const handleRolesChange = () => setRoleNavigationVersion((current) => current + 1);

    window.addEventListener('nexttask:roles-change', handleRolesChange);
    return () => window.removeEventListener('nexttask:roles-change', handleRolesChange);
  }, []);

  const handleNavigation = (item) => {
    navigate(item.path);
  };

  const handleCreateAction = (item) => {
    setCreateOpen(false);
    onCreateAction?.(item);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      <div className="flex min-h-screen">
        <aside
          className={`hidden flex-none border-r border-slate-200 bg-white transition-[width] duration-300 lg:flex lg:flex-col ${
            sidebarCollapsed ? 'w-[84px]' : 'w-[240px]'
          }`}
        >
          <div className="flex h-[72px] items-center gap-3 px-5">
            <span className="inline-flex h-10 w-10 flex-none items-center justify-center">
              <SparkasseMark className="h-10 w-10" />
            </span>
            {!sidebarCollapsed ? (
              <span className="text-xl font-extrabold tracking-tight text-[#b84758]">Sparkasse</span>
            ) : null}
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {activeNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavigation(item)}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                    item.active
                      ? 'bg-[#fff1f3] text-[#b84758]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-none ${item.active ? 'text-[#b84758]' : 'text-slate-400'}`} />
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="space-y-3 px-3 pb-4">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              {!sidebarCollapsed ? <span>Sidebar einklappen</span> : null}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkspaceOpen((current) => !current)}
                className={`flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:border-violet-200 ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#f0edff] text-[#6d5df6]">
                  <Building2 className="h-5 w-5" />
                </span>
                {!sidebarCollapsed ? (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-slate-400">Workspace</span>
                      <span className="block truncate text-sm font-bold text-slate-900">Agentur Digital</span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </>
                ) : null}
              </button>
              {workspaceOpen && !sidebarCollapsed ? (
                <MenuCard className="left-0 right-auto bottom-full top-auto mb-3 mt-0">
                  <button type="button" className="w-full rounded-xl px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50">
                    Workspace wechseln
                  </button>
                  <button type="button" className="w-full rounded-xl px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50">
                    Workspace verwalten
                  </button>
                </MenuCard>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-auto min-h-[72px] flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
            {!hideBreadcrumb ? (
              <div className="flex min-w-[220px] flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                {breadcrumb.map((crumb, index) => (
                  <span key={crumb} className="inline-flex items-center gap-2">
                    <span className={index === breadcrumb.length - 1 ? 'text-slate-950' : ''}>{crumb}</span>
                    {index < breadcrumb.length - 1 ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
                  </span>
                ))}
              </div>
            ) : null}

            {searchPlacement === 'center' ? (
              <div className="relative mx-auto w-full max-w-[420px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={(event) => onSearch?.(event.target.value)}
                  placeholder="Suche nach Aufgaben, Projekten, Personen ..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-12 pr-16 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-400">
                  Ctrl K
                </span>
              </div>
            ) : null}

            <div
              className={`ml-auto flex min-w-0 items-center gap-2 sm:gap-3 ${
                searchPlacement === 'actions' ? 'w-full flex-wrap justify-end' : 'shrink-0'
              }`}
            >
              {searchPlacement === 'actions' && headerTitle ? (
                <h1 className="mr-auto min-w-0 flex-1 text-left text-xl font-extrabold text-slate-950 lg:text-2xl">
                  {headerTitle}
                </h1>
              ) : null}
              {searchPlacement === 'actions' ? (
                <div className="relative order-last w-full min-w-0 sm:order-none sm:max-w-[420px] lg:max-w-[560px] lg:flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    value={searchValue}
                    onChange={(event) => onSearch?.(event.target.value)}
                    placeholder="Suche nach Aufgaben, Projekten, Personen ..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-12 pr-16 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/12"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-400">
                    Ctrl K
                  </span>
                </div>
              ) : null}
              {createMenuItems.length ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setCreateOpen((current) => !current)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e3b4bc] bg-[#fff7f8] px-3 text-sm font-bold text-[#a23d4d] shadow-[0_10px_22px_rgba(162,61,77,0.10)] transition hover:border-[#d89aa5] hover:bg-[#fff1f3] sm:px-4"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Erstellen</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {createOpen ? (
                  <MenuCard>
                    {createMenuItems.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleCreateAction(item)}
                        className="w-full rounded-xl px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {item}
                      </button>
                    ))}
                  </MenuCard>
                ) : null}
              </div>
              ) : null}

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((current) => !current)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    3
                  </span>
                </button>
                {notificationsOpen ? (
                  <MenuCard className="w-72">
                    {notifications.map((item) => (
                      <p key={item} className="rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-50">
                        {item}
                      </p>
                    ))}
                  </MenuCard>
                ) : null}
              </div>

              <div className="relative min-w-0 max-w-full shrink">
                <button
                  type="button"
                  onClick={() => setProfileOpen((current) => !current)}
                  className="flex h-11 min-w-0 max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 pr-3 text-left transition hover:bg-slate-50 sm:gap-3"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-rose-300 text-xs font-extrabold text-slate-800">
                    {getInitials(user?.name)}
                  </span>
                  <span className="hidden min-w-0 leading-tight sm:block">
                    <span className="block truncate text-sm font-bold text-slate-900">{user?.name || 'Gast'}</span>
                    <span className="hidden truncate text-xs font-semibold text-slate-400 lg:block">
                      {user?.department || 'Workspace'}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 flex-none text-slate-400" />
                </button>
                {profileOpen ? (
                  <MenuCard>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <User className="h-4 w-4" />
                      Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4" />
                      Einstellungen
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </MenuCard>
                ) : null}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-[#f8fafc]">{children}</main>
        </div>
      </div>
    </div>
  );
}
