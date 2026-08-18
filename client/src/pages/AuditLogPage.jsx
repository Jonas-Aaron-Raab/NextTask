import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  FileClock,
  Filter,
  Search,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';

const severityMeta = {
  INFO: { label: 'Info', tone: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle2 },
  NOTICE: { label: 'Hinweis', tone: 'bg-blue-50 text-blue-700 border-blue-100', icon: FileClock },
  WARNING: { label: 'Pruefpflichtig', tone: 'bg-amber-50 text-amber-700 border-amber-100', icon: AlertTriangle },
  CRITICAL: { label: 'Kritisch', tone: 'bg-rose-50 text-[#b84758] border-rose-100', icon: ShieldAlert },
};

const entityLabels = {
  AUTH: 'Anmeldung',
  USER: 'Benutzer',
  ACCESS_ROLE: 'Rolle',
  TASK: 'Aufgabe',
  COMMENT: 'Kommentar',
  PROJECT: 'Projekt',
  APPROVAL_REQUEST: 'Freigabe',
  TASK_MARKER_SETTINGS: 'Aufgabenfarben',
};

const actionLabels = {
  LOGIN_SUCCESS: 'Login erfolgreich',
  LOGIN_FAILED: 'Login fehlgeschlagen',
  TWO_FACTOR_REQUIRED: '2FA erforderlich',
  TWO_FACTOR_LOGIN_FAILED: '2FA fehlgeschlagen',
  TWO_FACTOR_RECOVERY_CODE_USED: 'Recovery-Code genutzt',
  TWO_FACTOR_SETUP_STARTED: '2FA-Einrichtung',
  TWO_FACTOR_SETUP_FAILED: '2FA-Bestaetigung fehlgeschlagen',
  TWO_FACTOR_ENABLED: '2FA aktiviert',
  TWO_FACTOR_DISABLE_FAILED: '2FA-Deaktivierung fehlgeschlagen',
  TWO_FACTOR_DISABLED: '2FA deaktiviert',
  SSO_CALLBACK_ACCEPTED: 'SSO bestaetigt',
  SSO_LOGIN_SUCCESS: 'SSO Login erfolgreich',
  SSO_LOGIN_FAILED: 'SSO Login fehlgeschlagen',
  USER_REGISTERED: 'Registrierung',
  USER_CREATED: 'Benutzer erstellt',
  USER_ROLE_ASSIGNED: 'Rolle zugewiesen',
  PROFILE_UPDATED: 'Profil geaendert',
  PASSWORD_CHANGED: 'Passwort geaendert',
  ROLE_CREATED: 'Rolle erstellt',
  ROLE_UPDATED: 'Rolle geaendert',
  ROLE_DELETED: 'Rolle geloescht',
  PROJECT_CREATED: 'Projekt erstellt',
  APPROVAL_REQUESTED: 'Freigabe angefragt',
  APPROVAL_APPROVED: 'Freigabe genehmigt',
  APPROVAL_REJECTED: 'Freigabe abgelehnt',
  APPROVAL_CANCELLED: 'Freigabe abgebrochen',
  TASK_CREATED: 'Aufgabe erstellt',
  TASK_UPDATED: 'Aufgabe geaendert',
  TASK_MOVED: 'Aufgabe verschoben',
  TASK_SCHEDULED: 'Terminplanung',
  TASK_DELETED: 'Aufgabe geloescht',
  COMMENT_CREATED: 'Kommentar erstellt',
  TASK_MARKERS_UPDATED: 'Farbstreifen gespeichert',
};

const entityOptions = ['', 'AUTH', 'USER', 'ACCESS_ROLE', 'PROJECT', 'TASK', 'COMMENT', 'APPROVAL_REQUEST', 'TASK_MARKER_SETTINGS'];
const severityOptions = ['', 'INFO', 'NOTICE', 'WARNING', 'CRITICAL'];
const actionOptions = ['', ...Object.keys(actionLabels)];

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatJson(value) {
  if (!value || (typeof value === 'object' && !Object.keys(value).length)) return 'Keine Detaildaten';
  return JSON.stringify(value, null, 2);
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="min-w-[180px] flex-1">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
      >
        {children}
      </select>
    </label>
  );
}

function AuditLogEntry({ entry }) {
  const meta = severityMeta[entry.severity] || severityMeta.INFO;
  const Icon = meta.icon;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold ${meta.tone}`}>
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600">
              {actionLabels[entry.action] || entry.action}
            </span>
            <span className="rounded-full bg-[#fff1f3] px-2.5 py-1 text-xs font-extrabold text-[#b84758]">
              {entityLabels[entry.entityType] || entry.entityType}
            </span>
          </div>
          <h2 className="mt-3 text-base font-black text-slate-950">{entry.summary}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {entry.entityLabel || entry.entityId || 'Systemereignis'}
          </p>
        </div>
        <div className="text-right text-xs font-bold text-slate-400">
          <p>{formatDate(entry.createdAt)}</p>
          <p className="mt-1">{entry.ipAddress || 'IP unbekannt'}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2 text-sm">
          <p className="inline-flex items-center gap-2 font-extrabold text-slate-800">
            <UserRound className="h-4 w-4 text-slate-400" />
            {entry.actorName}
          </p>
          <p className="text-xs font-semibold text-slate-500">{entry.actorEmail || 'Keine E-Mail'}</p>
          <p className="text-xs font-semibold text-slate-500">{entry.actorRole || 'Keine Rolle'}</p>
        </div>
        <details className="rounded-xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Aenderungsdetails
          </summary>
          <div className="grid gap-3 border-t border-slate-200 p-3 xl:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Vorher / Delta</p>
              <pre className="max-h-72 overflow-auto rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-600">{formatJson(entry.before)}</pre>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Nachher</p>
              <pre className="max-h-72 overflow-auto rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-600">{formatJson(entry.after)}</pre>
            </div>
          </div>
        </details>
      </div>
    </article>
  );
}

export default function AuditLogPage() {
  const [searchValue, setSearchValue] = useState('');
  const [entityType, setEntityType] = useState('');
  const [severity, setSeverity] = useState('');
  const [action, setAction] = useState('');
  const [logs, setLogs] = useState([]);
  const [facets, setFacets] = useState({});
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const { data } = await api.get('/audit-logs', {
          signal: controller.signal,
          params: {
            limit: 150,
            search: searchValue.trim() || undefined,
            entityType: entityType || undefined,
            severity: severity || undefined,
            action: action || undefined,
          },
        });
        setLogs(data.logs || []);
        setFacets(data.facets || {});
        setTotal(data.total || 0);
      } catch (requestError) {
        if (requestError.name === 'CanceledError') return;
        setError(requestError.response?.data?.message || 'Audit-Log konnte nicht geladen werden.');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [action, entityType, searchValue, severity]);

  const criticalCount = (facets.CRITICAL || 0) + (facets.WARNING || 0);
  const actorCount = useMemo(() => new Set(logs.map((entry) => entry.actorEmail || entry.actorName)).size, [logs]);
  const searchSuggestions = useMemo(() => {
    if (!searchValue.trim()) return [];

    return logs.map((entry) => ({
      id: `audit-log-${entry.id}`,
      type: 'Log',
      label: entry.summary,
      meta: `${actionLabels[entry.action] || entry.action} - ${entry.actorName} - ${formatDate(entry.createdAt)}`,
    }));
  }, [logs, searchValue]);

  return (
    <AppShell activeItem="Audit-Log" hideBreadcrumb searchPlacement="actions" headerTitle="Audit-Log" searchValue={searchValue} onSearch={setSearchValue} searchSuggestions={searchSuggestions} createMenuItems={[]}>
      <div className="space-y-5 px-4 py-4 xl:px-6">
        <section className="rounded-[28px] border border-slate-300 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#b84758]">Revision</p>
              <h1 className="mt-2 text-2xl font-black text-slate-950">Audit-Log</h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Nachvollziehbare Protokollierung fuer sicherheitsrelevante Aktionen, Rollen, Aufgaben und Stammdaten.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
              <Database className="h-4 w-4" />
              Append-only Ansicht
            </span>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <StatCard icon={FileClock} label="Eintraege" value={total} tone="bg-slate-100 text-slate-600" />
          <StatCard icon={ShieldAlert} label="Prueffaelle" value={criticalCount} tone="bg-rose-50 text-[#b84758]" />
          <StatCard icon={UserRound} label="Akteure" value={actorCount} tone="bg-blue-50 text-blue-700" />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <Filter className="h-4 w-4 text-[#b84758]" />
            Filter
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <FilterSelect label="Bereich" value={entityType} onChange={setEntityType}>
              {entityOptions.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option ? entityLabels[option] || option : 'Alle Bereiche'}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Aktion" value={action} onChange={setAction}>
              {actionOptions.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option ? actionLabels[option] || option : 'Alle Aktionen'}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Kritikalitaet" value={severity} onChange={setSeverity}>
              {severityOptions.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option ? severityMeta[option]?.label || option : 'Alle Kritikalitaeten'}
                </option>
              ))}
            </FilterSelect>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</section>
        ) : null}

        <section className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">Audit-Log wird geladen ...</div>
          ) : null}
          {!isLoading && !logs.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-base font-black text-slate-900">Keine Audit-Eintraege gefunden</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Passe die Filter an oder fuehre eine neue Aktion aus.</p>
            </div>
          ) : null}
          {logs.map((entry) => (
            <AuditLogEntry key={entry.id} entry={entry} />
          ))}
        </section>
      </div>
    </AppShell>
  );
}
