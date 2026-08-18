import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
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

const notifications = [
  {
    id: 'checkout-qa',
    label: 'Checkout Flow testen wurde in QA verschoben.',
    path: '/my-tasks?taskId=my-task-5',
  },
  {
    id: 'seo-assigned',
    label: 'SEO Meta-Tags aktualisieren wurde dir zugewiesen.',
    path: '/my-tasks?search=SEO%20Meta-Tags%20aktualisieren',
  },
  {
    id: 'design-system-done',
    label: 'Design System aktualisiert wurde abgeschlossen.',
    path: '/my-tasks?taskId=my-task-4',
  },
];
const dismissedNotificationsStorageKey = 'nexttask:dismissed-notifications';

function getStoredDismissedNotifications() {
  if (typeof window === 'undefined') return [];

  try {
    const storedIds = JSON.parse(window.localStorage.getItem(dismissedNotificationsStorageKey) || '[]');
    return Array.isArray(storedIds) ? storedIds.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function storeDismissedNotifications(ids) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(dismissedNotificationsStorageKey, JSON.stringify(ids));
  } catch {
    // Ignore unavailable local storage; the current session state still updates.
  }
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

function SearchBox({
  inputRef,
  value,
  onChange,
  suggestions,
  isOpen,
  onFocus,
  onSelect,
}) {
  const hasQuery = value.trim().length > 0;

  return (
    <div className="relative w-full min-w-0">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={value}
        onFocus={onFocus}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Suche nach Aufgaben, Projekten, Personen ..."
        className="h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-12 pr-16 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/12"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-400">
        Ctrl K
      </span>

      {isOpen && hasQuery ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(28rem,calc(100vh-8rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            {suggestions.length ? `${suggestions.length} Treffer` : 'Keine Treffer'}
          </div>
          {suggestions.length ? (
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id || `${suggestion.label}-${index}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(suggestion)}
                  className="flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                >
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#fff1f3] px-2 text-[11px] font-black uppercase text-[#b84758]">
                    {suggestion.type || 'Treffer'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-900">{suggestion.label}</span>
                    {suggestion.meta ? (
                      <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{suggestion.meta}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
              Passe die Suche an, um weitere Inhalte zu finden.
            </div>
          )}
        </div>
      ) : null}
    </div>
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
  searchSuggestions = [],
  createMenuItems = [],
  headerTitle = '',
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStoredAppearanceSettings().sidebarDefault === 'collapsed');
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(getStoredDismissedNotifications);
  const [, setRoleNavigationVersion] = useState(0);
  const availableSearchSuggestions = Array.isArray(searchSuggestions) ? searchSuggestions : [];
  const visibleNotifications = notifications.filter((notification) => !dismissedNotificationIds.includes(notification.id));
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
      setSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchContainerRef.current?.contains(event.target)) return;
      setSearchOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
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

  const handleSearchSuggestionSelect = (suggestion) => {
    onSearch?.(suggestion.searchValue || suggestion.label || searchValue);
    suggestion.onSelect?.(suggestion);
    if (suggestion.path) navigate(suggestion.path);
    setSearchOpen(false);
  };

  const handleNotificationSelect = (notification) => {
    setNotificationsOpen(false);
    setDismissedNotificationIds((current) => {
      if (current.includes(notification.id)) return current;

      const next = [...current, notification.id];
      storeDismissedNotifications(next);
      return next;
    });
    if (notification.path) navigate(notification.path, { state: { focusTaskAt: Date.now() } });
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
      <div className="min-h-screen bg-[#e1e6ec] text-[#111827]">
      <div className="flex min-h-screen">
        <aside
          className={`hidden flex-none border-r border-[#cfd6df] bg-[#e1e6ec] transition-[width] duration-300 lg:flex lg:flex-col ${
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
                      ? 'bg-[#fff1f3] text-[#a23d4d]'
                      : 'text-[#4b5a6d] hover:bg-[#f0f3f6] hover:text-[#1f2937]'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-none ${item.active ? 'text-[#e30613]' : 'text-[#718096]'}`} />
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="px-3 pb-4">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#718096] transition hover:bg-[#f0f3f6] hover:text-[#1f2937] ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              {!sidebarCollapsed ? <span>Sidebar einklappen</span> : null}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-auto min-h-[72px] flex-wrap items-center gap-3 border-b border-[#cfd6df] bg-[#e1e6ec] px-4 py-3 lg:px-6">
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
              <div ref={searchContainerRef} className="w-full min-w-0 flex-1">
                <SearchBox
                  inputRef={searchInputRef}
                  value={searchValue}
                  onChange={onSearch}
                  suggestions={availableSearchSuggestions}
                  isOpen={searchOpen}
                  onFocus={() => setSearchOpen(true)}
                  onSelect={handleSearchSuggestionSelect}
                />
              </div>
            ) : null}

            <div
              className={`ml-auto flex min-w-0 items-center gap-2 sm:gap-3 ${
                searchPlacement === 'actions' ? 'w-full flex-wrap xl:flex-nowrap' : 'shrink-0'
              }`}
            >
              {searchPlacement === 'actions' && headerTitle ? (
                <h1 className="min-w-0 shrink-0 truncate text-left text-xl font-extrabold text-slate-950 lg:max-w-[260px] lg:text-2xl">
                  {headerTitle}
                </h1>
              ) : null}
              {searchPlacement === 'actions' ? (
                <div ref={searchContainerRef} className="order-last w-full min-w-0 flex-1 sm:order-none sm:min-w-[320px]">
                  <SearchBox
                    inputRef={searchInputRef}
                    value={searchValue}
                    onChange={onSearch}
                    suggestions={availableSearchSuggestions}
                    isOpen={searchOpen}
                    onFocus={() => setSearchOpen(true)}
                    onSelect={handleSearchSuggestionSelect}
                  />
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
                  {visibleNotifications.length ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {visibleNotifications.length}
                    </span>
                  ) : null}
                </button>
                {notificationsOpen ? (
                  <MenuCard className="w-72">
                    {visibleNotifications.length ? (
                      visibleNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationSelect(notification)}
                          className="w-full rounded-xl px-3 py-2 text-left font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          {notification.label}
                        </button>
                      ))
                    ) : (
                      <p className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500">
                        Keine neuen Mitteilungen.
                      </p>
                    )}
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
                    <span className="hidden truncate text-xs font-semibold text-[#aeb7c4] lg:block">
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
                        navigate('/settings?section=profile', { state: { focusProfileAt: Date.now() } });
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

          <main className="min-w-0 flex-1 bg-[#e1e6ec]">{children}</main>
        </div>
      </div>
    </div>
  );
}
