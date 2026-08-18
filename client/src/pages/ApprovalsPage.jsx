import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Plus,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import api from '../api/axios';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

const roleTabs = [
  { value: 'inbox', label: 'Zu genehmigen' },
  { value: 'sent', label: 'Angefragt' },
  { value: 'all', label: 'Alle' },
];

const statusMeta = {
  PENDING: {
    label: 'Offen',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  APPROVED: {
    label: 'Genehmigt',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Abgelehnt',
    tone: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Abgebrochen',
    tone: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: Ban,
  },
};

const entityTypeLabels = {
  TASK: 'Aufgabe',
  PROJECT: 'Projekt',
  STATUS_REPORT: 'Statusbericht',
  DOCUMENT: 'Dokument',
  OTHER: 'Sonstiges',
};

const initialForm = {
  entityType: 'PROJECT',
  entityId: '',
  entityLabel: '',
  title: '',
  description: '',
  evidence: '',
  approverId: '',
};

function formatDate(value) {
  if (!value) return 'Noch offen';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.PENDING;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold ${meta.tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function PersonPill({ person, fallback }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
      <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#fff1f3] text-[11px] font-black text-[#b84758]">
        {getInitials(person?.name || fallback)}
      </span>
      <span className="min-w-0 truncate">{person?.name || fallback}</span>
    </span>
  );
}

function ApprovalCard({ approval, currentUserId, canApprove, note, onNoteChange, onApprove, onReject, onCancel, isBusy }) {
  const canDecide = approval.status === 'PENDING' && (canApprove || approval.approverId === currentUserId);
  const canCancel = approval.status === 'PENDING' && (approval.requesterId === currentUserId || canDecide);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={approval.status} />
            <span className="rounded-full bg-[#fff1f3] px-2.5 py-1 text-xs font-extrabold text-[#b84758]">
              {entityTypeLabels[approval.entityType] || approval.entityType}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-black leading-6 text-slate-950">{approval.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{approval.entityLabel}</p>
        </div>
        <div className="text-right text-xs font-bold text-slate-400">
          <p>Angefragt</p>
          <p className="mt-1">{formatDate(approval.requestedAt)}</p>
        </div>
      </div>

      {approval.description ? <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{approval.description}</p> : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Anfrage</p>
          <PersonPill person={approval.requester} fallback="Anfragende Person" />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Genehmigung</p>
          <PersonPill person={approval.approver} fallback={approval.approverId ? 'Genehmiger' : 'Nicht zugewiesen'} />
        </div>
      </div>

      {approval.evidence ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
            <FileText className="h-4 w-4 text-[#b84758]" />
            Evidenz
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{approval.evidence}</p>
        </div>
      ) : null}

      {approval.decisionNote ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Entscheidung</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{approval.decisionNote}</p>
          <p className="mt-2 text-xs font-bold text-slate-400">{formatDate(approval.decidedAt)}</p>
        </div>
      ) : null}

      {canDecide || canCancel ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <textarea
            value={note}
            onChange={(event) => onNoteChange(approval.id, event.target.value)}
            placeholder="Kurzer Entscheidungsvermerk ..."
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
          />
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {canCancel ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onCancel(approval.id)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Ban className="h-4 w-4" />
                Abbrechen
              </button>
            ) : null}
            {canDecide ? (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onReject(approval.id)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Ablehnen
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onApprove(approval.id)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b84758] px-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(184,71,88,0.18)] transition hover:bg-[#a23d4d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Genehmigen
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function CreateApprovalModal({ form, context, onChange, onClose, onSubmit, isSaving }) {
  const entityOptions = (context.entities || []).filter((entity) => entity.entityType === form.entityType);
  const approverOptions = (context.users || []).filter((user) => user.id);

  const handleEntityChange = (entityId) => {
    const selected = entityOptions.find((entity) => entity.entityId === entityId);
    onChange({
      entityId,
      entityLabel: selected?.entityLabel || '',
      title: selected ? `Freigabe: ${selected.entityLabel}` : form.title,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Workflow</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Freigabe anfragen</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Typ</span>
            <select
              value={form.entityType}
              onChange={(event) => onChange({ entityType: event.target.value, entityId: '', entityLabel: '', title: '' })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
            >
              {Object.entries(entityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {form.entityType === 'OTHER' || form.entityType === 'DOCUMENT' ? (
            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Bezug</span>
              <input
                value={form.entityLabel}
                onChange={(event) => onChange({ entityLabel: event.target.value })}
                placeholder="Dokument, Vorgang oder Thema"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
              />
            </label>
          ) : (
            <label className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Bezugsobjekt</span>
              <select
                value={form.entityId}
                onChange={(event) => handleEntityChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
              >
                <option value="">Auswaehlen</option>
                {entityOptions.map((entity) => (
                  <option key={`${entity.entityType}-${entity.entityId}`} value={entity.entityId}>
                    {entity.entityLabel}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Titel</span>
            <input
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Wofür wird eine Freigabe benötigt?"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Beschreibung</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange({ description: event.target.value })}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Genehmiger</span>
            <select
              value={form.approverId}
              onChange={(event) => onChange({ approverId: event.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
            >
              <option value="">Automatisch bestimmen</option>
              {approverOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Evidenzhinweis</span>
            <input
              value={form.evidence}
              onChange={(event) => onChange({ evidence: event.target.value })}
              placeholder="Link, Dokumentname oder Nachweis"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
            Schliessen
          </button>
          <button
            type="button"
            disabled={isSaving || !form.title.trim()}
            onClick={onSubmit}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.18)] transition hover:bg-[#a23d4d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Anfragen
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [role, setRole] = useState('inbox');
  const [status, setStatus] = useState('');
  const [approvals, setApprovals] = useState([]);
  const [facets, setFacets] = useState({});
  const [context, setContext] = useState({ users: [], entities: [], canApprove: false });
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const refreshApprovals = async () => {
    setError('');
    try {
      const { data } = await api.get('/approvals', {
        params: {
          limit: 200,
          role: role === 'all' ? undefined : role,
          status: status || undefined,
          search: searchValue.trim() || undefined,
        },
      });
      setApprovals(data.approvals || []);
      setFacets(data.facets || {});
      setContext((current) => ({ ...current, canApprove: Boolean(data.canApprove) }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Freigaben konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const { data } = await api.get('/approvals', {
          signal: controller.signal,
          params: {
            limit: 200,
            role: role === 'all' ? undefined : role,
            status: status || undefined,
            search: searchValue.trim() || undefined,
          },
        });
        setApprovals(data.approvals || []);
        setFacets(data.facets || {});
        setContext((current) => ({ ...current, canApprove: Boolean(data.canApprove) }));
      } catch (requestError) {
        if (requestError.name === 'CanceledError') return;
        setError(requestError.response?.data?.message || 'Freigaben konnten nicht geladen werden.');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [role, searchValue, status]);

  useEffect(() => {
    api
      .get('/approvals/context')
      .then(({ data }) => setContext((current) => ({ ...current, ...data })))
      .catch(() => {});
  }, []);

  const metrics = useMemo(
    () => ({
      open: facets.PENDING || approvals.filter((approval) => approval.status === 'PENDING').length,
      approved: facets.APPROVED || approvals.filter((approval) => approval.status === 'APPROVED').length,
      rejected: facets.REJECTED || approvals.filter((approval) => approval.status === 'REJECTED').length,
    }),
    [approvals, facets],
  );

  const searchSuggestions = useMemo(() => {
    if (!searchValue.trim()) return [];

    return approvals.map((approval) => ({
      id: `approval-${approval.id}`,
      type: 'Freigabe',
      label: approval.title,
      meta: `${entityTypeLabels[approval.entityType] || approval.entityType} - ${approval.entityLabel}`,
    }));
  }, [approvals, searchValue]);

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));
  const updateNote = (id, value) => setNotes((current) => ({ ...current, [id]: value }));

  const submitApproval = async () => {
    if (!form.title.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      await api.post('/approvals', form);
      setForm(initialForm);
      setCreateOpen(false);
      setRole('sent');
      await refreshApprovals();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Freigabe konnte nicht angefragt werden.');
    } finally {
      setIsSaving(false);
    }
  };

  const decide = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/approvals/${id}/${action}`, { decisionNote: notes[id] || '' });
      setNotes((current) => ({ ...current, [id]: '' }));
      await refreshApprovals();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Freigabe konnte nicht aktualisiert werden.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <AppShell
      activeItem="Freigaben"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Freigaben"
      searchValue={searchValue}
      onSearch={setSearchValue}
      searchSuggestions={searchSuggestions}
      createMenuItems={[]}
    >
      <div className="space-y-5 px-4 py-5 lg:px-6 lg:py-6">
        <section className="rounded-[28px] border border-slate-300 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-[#b84758]">Genehmigungsworkflow</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Freigaben steuern</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Entscheidungen, Evidenz und Verantwortliche laufen hier zusammen und werden im Audit-Log protokolliert.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d]"
            >
              <Plus className="h-4 w-4" />
              Freigabe anfragen
            </button>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
              <Clock3 className="h-4 w-4 text-amber-500" />
              Offen
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{metrics.open}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Genehmigt
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{metrics.approved}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
              <XCircle className="h-4 w-4 text-rose-600" />
              Abgelehnt
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">{metrics.rejected}</p>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-black text-slate-950">
              <Filter className="h-4 w-4 text-[#b84758]" />
              Ansicht
            </span>
            <div className="flex flex-wrap gap-2">
              {roleTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setRole(tab.value)}
                  className={`h-10 rounded-xl border px-3 text-sm font-bold transition ${
                    role === tab.value
                      ? 'border-[#d89aa5] bg-[#fff1f3] text-[#a23d4d]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="ml-auto h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/10"
            >
              <option value="">Alle Status</option>
              {Object.entries(statusMeta).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</section> : null}

        <section className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">Freigaben werden geladen ...</div>
          ) : null}
          {!isLoading && !approvals.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-[#b84758]" />
              <p className="mt-4 text-lg font-black text-slate-950">Keine Freigaben gefunden</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">Passe Filter oder Suche an oder starte eine neue Anfrage.</p>
            </div>
          ) : null}
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              currentUserId={user?.id}
              canApprove={context.canApprove}
              note={notes[approval.id] || ''}
              onNoteChange={updateNote}
              onApprove={(id) => decide(id, 'approve')}
              onReject={(id) => decide(id, 'reject')}
              onCancel={(id) => decide(id, 'cancel')}
              isBusy={busyId === approval.id}
            />
          ))}
        </section>
      </div>

      {createOpen ? (
        <CreateApprovalModal
          form={form}
          context={context}
          onChange={updateForm}
          onClose={() => setCreateOpen(false)}
          onSubmit={submitApproval}
          isSaving={isSaving}
        />
      ) : null}
    </AppShell>
  );
}
