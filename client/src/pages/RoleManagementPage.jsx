import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  KeyRound,
  LockKeyhole,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import {
  bankDepartments,
  canManageRoles,
  getDefaultAccessConfig,
  getDepartmentLabel,
  getEffectiveRoleForUser,
  getRoleKindLabel,
  getRoleScopeLabel,
  permissionLabels,
  roleKinds,
} from '../data/bankOrganization';

const defaultPassword = 'NextTask2026!';

const emptyUserForm = {
  name: '',
  email: '',
  password: defaultPassword,
  department: 'Informationstechnologie OR-IT',
  accessRoleId: '',
};

function createRole(kind = 'MEMBER') {
  const suffix = Date.now().toString(36);

  return {
    id: '',
    name: kind === 'GBL' ? 'Neue GBL Rolle' : 'Neue Mitarbeiterrolle',
    code: kind === 'GBL' ? `GBL-OR-${suffix}` : `M-OR-IT-${suffix}`,
    kind,
    description: 'Neue Rolle mit eigenem Sichtbereich.',
    businessAreas: kind === 'GBL' ? ['OR'] : [],
    departmentIds: kind === 'MEMBER' ? ['or-it'] : [],
    permissions: {
      viewDepartments: true,
      editProjects: kind !== 'MEMBER',
      editTasks: true,
      approveRequests: kind !== 'MEMBER',
      viewReports: kind !== 'MEMBER',
      manageRoles: kind === 'ADMIN',
    },
    system: false,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getUserDepartmentLabel(value) {
  if (!value) return 'Keine Abteilung';
  const directMatch = bankDepartments.find((department) => department.id === value);
  if (directMatch) return getDepartmentLabel(value);
  return value;
}

function getDepartmentValue(department) {
  return `${department.name} ${department.code}`;
}

function RoleBadge({ role }) {
  const kind = roleKinds.find((item) => item.value === role.kind);
  return (
    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#fff1f3] px-2 text-xs font-black text-[#b84758]">
      {kind?.shortLabel || role?.code || 'R'}
    </span>
  );
}

function PermissionToggle({ label, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? 'border-[#d89aa5] bg-[#fff7f8] text-[#a23d4d]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className="text-sm font-extrabold">{label}</span>
      <span className={`inline-flex h-6 w-6 flex-none items-center justify-center rounded-full ${checked ? 'bg-[#b84758] text-white' : 'bg-slate-100 text-slate-300'}`}>
        {checked ? <Check className="h-4 w-4" /> : null}
      </span>
    </button>
  );
}

export default function RoleManagementPage() {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [accessConfig, setAccessConfig] = useState(() => getDefaultAccessConfig());
  const [draftRole, setDraftRole] = useState(() => getDefaultAccessConfig().roles[0] || createRole('ADMIN'));
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [activeTab, setActiveTab] = useState('manage');
  const roleManagerAllowed = canManageRoles(user, accessConfig);
  const currentRole = useMemo(() => getEffectiveRoleForUser(user, accessConfig), [accessConfig, user]);
  const searchTerm = searchValue.trim().toLowerCase();

  const refreshConfig = useCallback(async (message = '') => {
    setError('');
    try {
      const { data } = await api.get('/roles');
      setAccessConfig(data);
      window.dispatchEvent(new CustomEvent('nexttask:roles-change', { detail: data }));
      setDraftRole((current) => {
        const nextRole = data.roles.find((role) => role.id === current.id) || data.roles[0] || createRole('ADMIN');
        return clone(nextRole);
      });
      if (message) setStatus(message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Rollen konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial API load for the database-backed role editor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshConfig();
  }, [refreshConfig]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return accessConfig.roles;
    return accessConfig.roles.filter((role) =>
      [role.name, role.code, role.description, getRoleKindLabel(role.kind), getRoleScopeLabel(role)].join(' ').toLowerCase().includes(searchTerm),
    );
  }, [accessConfig.roles, searchTerm]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm) return [];

    const roleSuggestions = filteredRoles.map((role) => ({
      id: `role-${role.id}`,
      type: 'Rolle',
      label: role.name,
      meta: `${role.code} - ${getRoleScopeLabel(role)}`,
      onSelect: () => {
        setDraftRole(clone(role));
        setActiveTab('manage');
      },
    }));

    const userSuggestions = accessConfig.users
      .filter((item) =>
        [item.name, item.email, getUserDepartmentLabel(item.department)].join(' ').toLowerCase().includes(searchTerm),
      )
      .map((item) => ({
        id: `user-${item.id}`,
        type: 'User',
        label: item.name,
        meta: `${item.email} - ${getUserDepartmentLabel(item.department)}`,
      }));

    return [...roleSuggestions, ...userSuggestions];
  }, [accessConfig.users, filteredRoles, searchTerm]);

  const updateDraft = (field, value) => {
    setStatus('');
    setError('');
    setDraftRole((current) => ({ ...current, [field]: value }));
  };

  const updatePermission = (permission, value) => {
    setStatus('');
    setError('');
    setDraftRole((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [permission]: value,
      },
    }));
  };

  const toggleDepartment = (departmentId) => {
    setDraftRole((current) => {
      const nextDepartments = new Set(current.departmentIds || []);
      if (nextDepartments.has(departmentId)) {
        nextDepartments.delete(departmentId);
      } else {
        nextDepartments.add(departmentId);
      }
      return { ...current, departmentIds: [...nextDepartments] };
    });
  };

  const normalizeRolePayload = (role) => ({
    name: role.name.trim() || 'Unbenannte Rolle',
    code: role.code.trim() || role.kind,
    kind: role.kind,
    description: role.description || '',
    businessAreas:
      role.kind === 'GBL'
        ? String(role.businessAreasText || role.businessAreas?.join(',') || 'OR')
            .split(',')
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean)
        : [],
    departmentIds: role.kind === 'MEMBER' ? role.departmentIds || [] : [],
    permissions: {
      ...role.permissions,
      manageRoles: role.kind === 'ADMIN' ? true : Boolean(role.permissions?.manageRoles),
    },
  });

  const saveRole = async () => {
    setError('');
    try {
      const payload = normalizeRolePayload(draftRole);
      if (draftRole.id) {
        await api.put(`/roles/${draftRole.id}`, payload);
      } else {
        const { data } = await api.post('/roles', payload);
        setDraftRole(clone(data.role));
      }
      await refreshConfig('Rolle wurde in der Datenbank gespeichert.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Rolle konnte nicht gespeichert werden.');
    }
  };

  const addRole = (kind) => {
    setStatus('');
    setError('');
    setDraftRole(createRole(kind));
    setActiveTab('manage');
  };

  const deleteRole = async () => {
    if (!draftRole.id || draftRole.system) return;
    setError('');
    try {
      await api.delete(`/roles/${draftRole.id}`);
      await refreshConfig('Rolle wurde gelöscht.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Rolle konnte nicht gelöscht werden.');
    }
  };

  const assignRole = async (targetUser, accessRoleId) => {
    setError('');
    try {
      await api.put(`/roles/users/${targetUser.id}`, {
        accessRoleId,
        department: targetUser.department,
      });
      await refreshConfig('Rollenzuweisung wurde in der Datenbank gespeichert.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Rollenzuweisung konnte nicht gespeichert werden.');
    }
  };

  const addUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) return;
    setError('');
    try {
      await api.post('/roles/users', {
        ...userForm,
        accessRoleId: userForm.accessRoleId || accessConfig.roles[0]?.id,
      });
      setUserForm(emptyUserForm);
      await refreshConfig('Benutzer wurde in der Datenbank erstellt.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Benutzer konnte nicht erstellt werden.');
    }
  };

  const handleReset = async () => {
    setError('');
    await refreshConfig('Datenbankrollen wurden neu geladen.');
  };

  if (!roleManagerAllowed && !isLoading) {
    return (
      <AppShell activeItem="Rollen" hideBreadcrumb searchPlacement="actions" headerTitle="Rollen" searchValue={searchValue} onSearch={setSearchValue} searchSuggestions={searchSuggestions} createMenuItems={[]}>
        <div className="px-4 py-5 lg:px-6 lg:py-6">
          <section className="rounded-[30px] border border-slate-300 bg-white px-6 py-12 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <LockKeyhole className="mx-auto h-10 w-10 text-[#b84758]" />
            <h1 className="mt-4 text-2xl font-black text-slate-950">Rollenverwaltung ist gesperrt</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
              Deine aktuelle Rolle {currentRole?.name || 'ohne Rollenverwaltung'} erlaubt keine Bearbeitung von Rollen und Zuweisungen.
            </p>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeItem="Rollen" hideBreadcrumb searchPlacement="actions" headerTitle="Rollen" searchValue={searchValue} onSearch={setSearchValue} searchSuggestions={searchSuggestions} createMenuItems={[]}>
      <div className="space-y-5 px-4 py-5 lg:px-6 lg:py-6">
        <section className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Adminbereich</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Rollen bearbeiten und vergeben</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Diese Liste kommt jetzt aus der Datenbank. Jeder Benutzer hier ist ein echter Account aus der User-Tabelle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addRole('GBL')} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#e3b4bc] bg-[#fff7f8] px-4 text-sm font-bold text-[#a23d4d] transition hover:bg-[#fff1f3]">
                <Plus className="h-4 w-4" />
                GBL Rolle
              </button>
              <button type="button" onClick={() => addRole('MEMBER')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d]">
                <Plus className="h-4 w-4" />
                Mitarbeiterrolle
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#b84758]" />
              {isLoading ? 'Rollen werden geladen ...' : `Du arbeitest als ${currentRole?.name || 'Admin'}`}
            </span>
            {status ? <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700"><Check className="h-4 w-4" />{status}</span> : null}
            {error ? <span className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700">{error}</span> : null}
            <button type="button" onClick={handleReset} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" />
              Aus DB neu laden
            </button>
          </div>
        </section>

        <nav className="rounded-[30px] border border-slate-300 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.04)]" aria-label="Rollenverwaltung">
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { id: 'manage', label: 'Rollen bearbeiten & hinzufügen', icon: ShieldCheck },
              { id: 'assignments', label: 'Zuweisungen', icon: UsersRound },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${active ? 'border-[#e3b4bc] bg-[#fff1f3] text-[#a23d4d]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><Icon className="h-5 w-5" />{tab.label}</button>;
            })}
          </div>
        </nav>

        {activeTab === 'manage' ? <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Rollen</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{filteredRoles.length} Gruppen</h2>
              </div>
              <KeyRound className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-2">
              {filteredRoles.map((role) => (
                <button key={role.id} type="button" onClick={() => setDraftRole(clone(role))} className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${role.id === draftRole.id ? 'border-[#d89aa5] bg-[#fff7f8]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <RoleBadge role={role} />
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">{role.name}</span>
                    <span className="mt-1 block text-xs font-bold text-slate-400">{getRoleScopeLabel(role)}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <RoleBadge role={draftRole} />
                <div className="min-w-0">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Rolle bearbeiten</p>
                  <h2 className="mt-1 truncate text-2xl font-black text-slate-950">{draftRole.name}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {draftRole.id && !draftRole.system ? (
                  <button type="button" onClick={deleteRole} className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
                    <Trash2 className="h-4 w-4" />
                    Loeschen
                  </button>
                ) : null}
                <button type="button" onClick={saveRole} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d]">
                  <Save className="h-4 w-4" />
                  In DB speichern
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,1.05fr)]">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">
                  Name
                  <input value={draftRole.name} onChange={(event) => updateDraft('name', event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10" />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Kurzcode
                  <input value={draftRole.code} onChange={(event) => updateDraft('code', event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10" />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Rollentyp
                  <select value={draftRole.kind} disabled={draftRole.system} onChange={(event) => updateDraft('kind', event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10">
                    {roleKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Beschreibung
                  <textarea value={draftRole.description} rows={4} onChange={(event) => updateDraft('description', event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10" />
                </label>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">Sichtbereich</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{getRoleScopeLabel(draftRole)}</p>

                  {draftRole.kind === 'GBL' ? (
                    <label className="mt-4 block text-sm font-bold text-slate-700">
                      Geschäftsbereiche
                      <input value={draftRole.businessAreasText ?? draftRole.businessAreas?.join(', ') ?? 'OR'} onChange={(event) => updateDraft('businessAreasText', event.target.value)} placeholder="OR, PK, FK" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10" />
                    </label>
                  ) : null}

                  {draftRole.kind === 'MEMBER' ? (
                    <div className="mt-4 grid gap-2">
                      {bankDepartments.map((department) => {
                        const active = draftRole.departmentIds?.includes(department.id);
                        return (
                          <button key={department.id} type="button" onClick={() => toggleDepartment(department.id)} className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition ${active ? 'border-[#d89aa5] bg-white text-[#a23d4d]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                            <span>
                              <span className="block text-sm font-extrabold">{department.name}</span>
                              <span className="mt-1 block text-xs font-bold text-slate-400">{department.code}</span>
                            </span>
                            {active ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {draftRole.kind === 'ADMIN' ? <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600">Adminrollen haben automatisch Zugriff auf alle Abteilungen.</p> : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">Berechtigungen</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {Object.entries(permissionLabels).map(([permission, label]) => (
                      <PermissionToggle key={permission} label={label} checked={Boolean(draftRole.permissions?.[permission])} disabled={draftRole.kind === 'ADMIN' && permission === 'manageRoles'} onChange={(value) => updatePermission(permission, value)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div> : null}

        {activeTab === 'assignments' ? <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Zuweisungen</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Echte Benutzer Rollen zuordnen</h2>
            </div>
            <UsersRound className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_210px_240px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                <span>Benutzer</span>
                <span>Abteilung</span>
                <span>Rolle</span>
              </div>
              {accessConfig.users.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_210px_240px] gap-3 border-t border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                  <div className="min-w-0">
                    <p className="truncate text-slate-950">{item.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{item.email}</p>
                  </div>
                  <span className="self-center text-xs font-extrabold text-slate-500">{getUserDepartmentLabel(item.department)}</span>
                  <select value={item.accessRoleId || ''} onChange={(event) => assignRole(item, event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10">
                    <option value="">Keine Access-Rolle</option>
                    {accessConfig.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-black text-slate-950"><UserPlus className="h-4 w-4 text-[#b84758]" />Echten Benutzer erstellen</p>
              <div className="mt-4 space-y-3">
                <input value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10" />
                <input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} placeholder="E-Mail" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10" />
                <input type="text" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} placeholder="Startpasswort" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10" />
                <select value={userForm.department} onChange={(event) => setUserForm((current) => ({ ...current, department: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10">
                  {bankDepartments.map((department) => <option key={department.id} value={getDepartmentValue(department)}>{getDepartmentValue(department)}</option>)}
                </select>
                <select value={userForm.accessRoleId || accessConfig.roles[0]?.id || ''} onChange={(event) => setUserForm((current) => ({ ...current, accessRoleId: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10">
                  {accessConfig.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
                <button type="button" onClick={addUser} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d]"><Plus className="h-4 w-4" />In DB erstellen</button>
              </div>
            </div>
          </div>
        </section> : null}
      </div>
    </AppShell>
  );
}
