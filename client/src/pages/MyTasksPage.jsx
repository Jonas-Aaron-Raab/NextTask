import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileText,
  Flag,
  History,
  ListChecks,
  LockKeyhole,
  MessageSquareMore,
  Paperclip,
  ShieldCheck,
  Tag,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';

const columns = [
  { id: 'today', title: 'Heute', dot: 'bg-amber-400' },
  { id: 'in-progress', title: 'In Arbeit', dot: 'bg-blue-500' },
  { id: 'review', title: 'Review', dot: 'bg-violet-500' },
  { id: 'blocked', title: 'Blockiert', dot: 'bg-rose-500' },
  { id: 'done', title: 'Erledigt', dot: 'bg-emerald-500' },
];

const teamMembers = [
  'Lisa Wagner',
  'Markus Klein',
  'Anna Becker',
  'Tom Becker',
  'Sarah Nguyen',
];

const initialTasks = [
  {
    id: 'my-task-1',
    title: 'Hero-Text und CTA fuer Startseite finalisieren',
    status: 'today',
    project: 'Website Relaunch',
    priority: 'hoch',
    dueDate: '16. Mai 2026',
    dueDateValue: '2026-05-16',
    progress: 70,
    checklist: '7/10 erledigt',
    note: 'Feinschliff fuer Headline und Buttons fehlt noch.',
    description:
      'Die Hero-Zone fuer die Startseite muss final textlich und visuell freigegeben werden. CTA-Label, Unterzeile und die mobile Version sind noch nicht abschliessend abgestimmt.',
    assignee: 'Lisa Wagner',
    tags: ['Frontend', 'Freigabe', 'UX'],
    linkedPeople: ['Markus Klein', 'Anna Becker'],
    attachments: [
      { id: 'a-1', name: 'Hero_Copy_V3.docx', type: 'Word', source: 'OneDrive', owner: 'Lisa Wagner' },
      { id: 'a-2', name: 'CTA_Testmatrix.xlsx', type: 'Excel', source: 'SharePoint', owner: 'Markus Klein' },
    ],
    comments: [
      {
        id: 'c-1',
        author: 'Markus Klein',
        time: 'heute, 09:14',
        text: '@Lisa Wagner bitte die CTA-Version mit dem letzten Workshop-Protokoll abgleichen.',
      },
    ],
    compliance: {
      classification: 'Intern',
      risk: 'Mittel',
      controlId: 'CTRL-WEB-204',
      approval: 'Vier-Augen-Pruefung offen',
      evidence: 'Textfreigabe und Screenshot-Nachweis erforderlich',
    },
    auditTrail: [
      '15. Mai 2026: Ticket von Markus Klein an Lisa Wagner uebergeben.',
      '15. Mai 2026: Word-Dokument mit finalem Copy-Entwurf verknuepft.',
    ],
  },
  {
    id: 'my-task-2',
    title: 'Responsive Navigation auf iPhone Breakpoints pruefen',
    status: 'today',
    project: 'Website Relaunch',
    priority: 'mittel',
    dueDate: '16. Mai 2026',
    dueDateValue: '2026-05-16',
    progress: 45,
    checklist: '3/6 erledigt',
    note: 'Burger-Menue klappt noch nicht sauber zu.',
    description:
      'Navigation auf kleineren iPhone-Breakpoints pruefen, Overflow-Verhalten analysieren und dokumentieren. Kritisch ist das Schliessen des Menues nach Link-Klick.',
    assignee: 'Lisa Wagner',
    tags: ['Responsive', 'QA'],
    linkedPeople: ['Tom Becker'],
    attachments: [{ id: 'a-3', name: 'iPhone_Testfaelle.xlsx', type: 'Excel', source: 'DMS', owner: 'Tom Becker' }],
    comments: [],
    compliance: {
      classification: 'Intern',
      risk: 'Niedrig',
      controlId: 'CTRL-UI-118',
      approval: 'Kein Sonderfreigabeprozess',
      evidence: 'Testprotokoll mit Geraeteliste verknuepfen',
    },
    auditTrail: ['16. Mai 2026: Testfallpaket fuer Mobile QA angelegt.'],
  },
  {
    id: 'my-task-3',
    title: 'Projektseite fuer neue Kundenpraesentation strukturieren',
    status: 'in-progress',
    project: 'Sales Deck',
    priority: 'hoch',
    dueDate: '17. Mai 2026',
    dueDateValue: '2026-05-17',
    progress: 55,
    checklist: '5/9 erledigt',
    note: 'Abschnitt fuer Referenzen und KPIs noch offen.',
    description:
      'Fuer die Kundenpraesentation muessen KPI-Folien, Referenzen und Risikohinweise in einer klaren Storyline strukturiert werden.',
    assignee: 'Lisa Wagner',
    tags: ['Sales', 'Stakeholder'],
    linkedPeople: ['Sarah Nguyen', 'Anna Becker'],
    attachments: [{ id: 'a-4', name: 'Praesentation_KPIs.xlsx', type: 'Excel', source: 'SharePoint', owner: 'Sarah Nguyen' }],
    comments: [],
    compliance: {
      classification: 'Vertraulich',
      risk: 'Mittel',
      controlId: 'CTRL-SALES-092',
      approval: 'Bereichsleitung prueft finale Deck-Version',
      evidence: 'KPI-Quelle und Datenstand dokumentieren',
    },
    auditTrail: ['16. Mai 2026: KPI-Datei aus SharePoint verknuepft.'],
  },
  {
    id: 'my-task-4',
    title: 'Task-Karten Farben im Dashboard vereinheitlichen',
    status: 'in-progress',
    project: 'NextTask UI',
    priority: 'niedrig',
    dueDate: '18. Mai 2026',
    dueDateValue: '2026-05-18',
    progress: 35,
    checklist: '2/5 erledigt',
    note: 'Neue Farblogik in Cards und Badges angleichen.',
    description:
      'Design Tokens fuer Kartenfarben harmonisieren und fuer Prioritaets-Badges vereinheitlichen.',
    assignee: 'Lisa Wagner',
    tags: ['Design System'],
    linkedPeople: ['Markus Klein'],
    attachments: [],
    comments: [],
    compliance: {
      classification: 'Intern',
      risk: 'Niedrig',
      controlId: 'CTRL-DS-017',
      approval: 'Design Review offen',
      evidence: 'Vorher-Nachher-Screens dokumentieren',
    },
    auditTrail: ['16. Mai 2026: Design-Review als naechster Schritt markiert.'],
  },
  {
    id: 'my-task-5',
    title: 'Checkout-Testlauf dokumentieren und an QA geben',
    status: 'review',
    project: 'Shop Optimierung',
    priority: 'hoch',
    dueDate: '17. Mai 2026',
    dueDateValue: '2026-05-17',
    progress: 85,
    checklist: '6/7 erledigt',
    note: 'Wartet auf Rueckmeldung vom QA-Team.',
    description:
      'Testlauf dokumentieren, Fehlerszenarien zusammenfassen und das Paket an QA uebergeben. Alle Testbelege muessen nachvollziehbar verknuepft sein.',
    assignee: 'Lisa Wagner',
    tags: ['QA', 'Abnahme', 'Kontrollnachweis'],
    linkedPeople: ['Tom Becker', 'Anna Becker'],
    attachments: [
      { id: 'a-5', name: 'Checkout_Testprotokoll.docx', type: 'Word', source: 'OneDrive', owner: 'Lisa Wagner' },
      { id: 'a-6', name: 'Checkout_Defects.xlsx', type: 'Excel', source: 'SharePoint', owner: 'Tom Becker' },
    ],
    comments: [
      {
        id: 'c-2',
        author: 'Tom Becker',
        time: 'heute, 11:30',
        text: 'Bitte vor der Freigabe noch die Kreditkarten-Fehlerbilder mit anhaengen.',
      },
    ],
    compliance: {
      classification: 'Reguliert',
      risk: 'Hoch',
      controlId: 'CTRL-PAY-771',
      approval: 'Vier-Augen-Pruefung durch QA und Product Owner',
      evidence: 'Defect-Liste, Testprotokoll und Sign-off erforderlich',
    },
    auditTrail: [
      '16. Mai 2026: Testprotokoll hochgeladen.',
      '16. Mai 2026: Ticket auf Review gesetzt und QA informiert.',
    ],
  },
  {
    id: 'my-task-6',
    title: 'Social Preview Bilder fuer Blog vorbereiten',
    status: 'review',
    project: 'Content Sprint',
    priority: 'mittel',
    dueDate: '19. Mai 2026',
    dueDateValue: '2026-05-19',
    progress: 80,
    checklist: '4/5 erledigt',
    note: 'Finale Freigabe von Marketing fehlt.',
    description:
      'Preview-Bilder in allen Formaten vorbereiten und den finalen Satz an Marketing zur Freigabe uebergeben.',
    assignee: 'Lisa Wagner',
    tags: ['Content', 'Freigabe'],
    linkedPeople: ['Sarah Nguyen'],
    attachments: [],
    comments: [],
    compliance: {
      classification: 'Intern',
      risk: 'Niedrig',
      controlId: 'CTRL-CONT-041',
      approval: 'Marketing-Freigabe offen',
      evidence: 'Finale Asset-Liste verknuepfen',
    },
    auditTrail: ['16. Mai 2026: Marketing-Freigabe angefragt.'],
  },
  {
    id: 'my-task-7',
    title: 'Texte fuer Pricing-Seite abstimmen',
    status: 'blocked',
    project: 'Website Relaunch',
    priority: 'mittel',
    dueDate: '20. Mai 2026',
    dueDateValue: '2026-05-20',
    progress: 20,
    checklist: '1/5 erledigt',
    note: 'Blockiert durch fehlende Preise vom Vertrieb.',
    description:
      'Pricing-Texte koennen erst finalisiert werden, wenn die Preisfreigaben aus dem Vertrieb vorliegen. Bis dahin muessen Placeholder markiert bleiben.',
    assignee: 'Lisa Wagner',
    tags: ['Blocker', 'Vertrieb'],
    linkedPeople: ['Anna Becker', 'Sarah Nguyen'],
    attachments: [{ id: 'a-7', name: 'Preisfreigabe_Offen.docx', type: 'Word', source: 'DMS', owner: 'Anna Becker' }],
    comments: [
      {
        id: 'c-3',
        author: 'Anna Becker',
        time: 'heute, 08:50',
        text: 'Vertrieb liefert Preise voraussichtlich morgen frueh.',
      },
    ],
    compliance: {
      classification: 'Vertraulich',
      risk: 'Mittel',
      controlId: 'CTRL-PRC-551',
      approval: 'Preisfreigabe aus Vertrieb erforderlich',
      evidence: 'Freigabedokument und finale Preisdatei verknuepfen',
    },
    auditTrail: ['16. Mai 2026: Ticket als blockiert markiert.'],
  },
  {
    id: 'my-task-8',
    title: 'Onboarding-Mails in deutsch ueberarbeiten',
    status: 'done',
    project: 'CRM Automation',
    priority: 'niedrig',
    dueDate: '15. Mai 2026',
    dueDateValue: '2026-05-15',
    progress: 100,
    checklist: '5/5 erledigt',
    note: 'Abgeschlossen und an Team uebergeben.',
    description:
      'Deutsche Onboarding-Mailserie sprachlich ueberarbeitet und an das CRM-Team fuer den Versand uebergeben.',
    assignee: 'Lisa Wagner',
    tags: ['CRM', 'Done'],
    linkedPeople: ['Tom Becker'],
    attachments: [{ id: 'a-8', name: 'Onboarding_Copy_Final.docx', type: 'Word', source: 'OneDrive', owner: 'Lisa Wagner' }],
    comments: [],
    compliance: {
      classification: 'Intern',
      risk: 'Niedrig',
      controlId: 'CTRL-CRM-032',
      approval: 'Erledigt und dokumentiert',
      evidence: 'Finale Textversion archiviert',
    },
    auditTrail: ['15. Mai 2026: Finale Mailserie archiviert und abgeschlossen.'],
  },
];

const activityFeed = [
  'QA hat dir Feedback zum Checkout-Test hinterlassen.',
  'Lisa hat dich bei der Navigation-Aufgabe erwaehnt.',
  'Die Pricing-Seite ist aktuell blockiert wegen fehlender Infos.',
  'Die Onboarding-Mail-Serie wurde von dir abgeschlossen.',
];

const priorityStyles = {
  hoch: 'border-red-100 bg-red-50 text-red-600',
  mittel: 'border-amber-100 bg-amber-50 text-amber-600',
  niedrig: 'border-emerald-100 bg-emerald-50 text-emerald-600',
};

const statusLabels = {
  today: 'Heute',
  'in-progress': 'In Arbeit',
  review: 'Review',
  blocked: 'Blockiert',
  done: 'Erledigt',
};

const attachmentSourceOptions = ['SharePoint', 'OneDrive', 'DMS', 'Audit-Ablage'];
const attachmentTypeOptions = ['Excel', 'Word', 'PDF', 'Link'];

function formatDateLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-bold ${priorityStyles[priority]}`}>
      <Flag className="h-3 w-3" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, iconTone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <ArrowUpRight className="h-3 w-3" />
          {subtitle}
        </p>
      </div>
      <div className="mt-1.5">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-0.5 text-[21px] font-bold leading-none text-slate-950">{value}</p>
      </div>
    </article>
  );
}

function TaskCard({ task, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-4 text-slate-900">{task.title}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{task.project}</p>
        </div>
        {task.status === 'done' ? <CheckCircle2 className="h-3.5 w-3.5 flex-none text-emerald-500" /> : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <CalendarDays className="h-3 w-3" />
          {task.dueDate}
        </span>
      </div>

      <div className="mt-2 rounded-xl bg-slate-50 p-2">
        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-3 w-3" />
            Fortschritt
          </span>
          <span>{task.progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[#6d5df6]" style={{ width: `${task.progress}%` }} />
        </div>
        <p className="mt-1 text-[10px] font-semibold text-slate-400">{task.checklist}</p>
      </div>

      <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">{task.note}</p>
    </button>
  );
}

function BoardColumn({ column, tasks, onOpenTask }) {
  return (
    <section className="flex w-[214px] flex-none flex-col rounded-2xl border border-slate-200 bg-white/75 p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-900">{column.title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{tasks.length}</span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
        ))}
      </div>
    </section>
  );
}

function SideCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
      <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function DetailBlock({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icon className="h-4 w-4 text-[#6d5df6]" />
          {title}
        </h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TaskDetailDrawer({
  task,
  form,
  commentDraft,
  tagDraft,
  personDraft,
  attachmentSource,
  attachmentType,
  onClose,
  onFormChange,
  onCommentChange,
  onCommentSubmit,
  onInsertMention,
  onTagDraftChange,
  onTagAdd,
  onTagRemove,
  onPersonDraftChange,
  onPersonAdd,
  onPersonRemove,
  onAttachmentSourceChange,
  onAttachmentTypeChange,
  onAttachmentFilesAdd,
  onAttachmentRemove,
  onSave,
}) {
  if (!task || !form) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
      <aside className="h-full w-full max-w-[760px] overflow-y-auto border-l border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6d5df6]">Ticket Details</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-950">{task.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span>{task.project}</span>
                <span className="text-slate-300">•</span>
                <span>{task.assignee}</span>
                <span className="text-slate-300">•</span>
                <span>{statusLabels[task.status]}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Drawer schliessen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Titel
              <input
                value={form.title}
                onChange={(event) => onFormChange('title', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Projekt
              <input
                value={form.project}
                onChange={(event) => onFormChange('project', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(event) => onFormChange('status', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Prioritaet
              <select
                value={form.priority}
                onChange={(event) => onFormChange('priority', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                <option value="hoch">Hoch</option>
                <option value="mittel">Mittel</option>
                <option value="niedrig">Niedrig</option>
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Faelligkeit
              <input
                type="date"
                value={form.dueDateValue}
                onChange={(event) => onFormChange('dueDateValue', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Zustaendige Person
              <select
                value={form.assignee}
                onChange={(event) => onFormChange('assignee', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {teamMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <label className="block text-sm font-bold text-slate-700">
            Beschreibung
            <textarea
              value={form.description}
              onChange={(event) => onFormChange('description', event.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
            />
          </label>

          <section className="grid gap-4 lg:grid-cols-2">
            <DetailBlock title="Tags" icon={Tag}>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagRemove(tag)}
                    className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-bold text-[#6047e8]"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={tagDraft}
                  onChange={(event) => onTagDraftChange(event.target.value)}
                  placeholder="Neues Tag"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                />
                <button
                  type="button"
                  onClick={onTagAdd}
                  className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Hinzufuegen
                </button>
              </div>
            </DetailBlock>

            <DetailBlock title="Verlinkte Mitarbeitende" icon={Users}>
              <div className="flex flex-wrap gap-2">
                {task.linkedPeople.map((person) => (
                  <button
                    key={person}
                    type="button"
                    onClick={() => onPersonRemove(person)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700"
                  >
                    @{person} ×
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <select
                  value={personDraft}
                  onChange={(event) => onPersonDraftChange(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                >
                  {teamMembers.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onPersonAdd}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <UserPlus className="h-4 w-4" />
                  Verlinken
                </button>
              </div>
            </DetailBlock>
          </section>

          <DetailBlock
            title="Dateien und Evidenz"
            icon={Paperclip}
            action={
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                revisionssicher dokumentierbar
              </span>
            }
          >
            <div className="space-y-3">
              {task.attachments.length ? (
                task.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{attachment.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {attachment.type} • {attachment.source} • Owner: {attachment.owner}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAttachmentRemove(attachment.id)}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      Entfernen
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-slate-500">Noch keine Evidenzdatei verknuepft.</p>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <select
                value={attachmentType}
                onChange={(event) => onAttachmentTypeChange(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {attachmentTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={attachmentSource}
                onChange={(event) => onAttachmentSourceChange(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
              >
                {attachmentSourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#6d5df6] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(109,93,246,0.22)]">
                Datei verknuepfen
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    onAttachmentFilesAdd(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Ideal fuer Excel-, Word-, PDF- oder verlinkte Kontrollnachweise aus SharePoint, OneDrive oder DMS.
            </p>
          </DetailBlock>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <DetailBlock title="Kommentare und Mentions" icon={MessageSquareMore}>
              <div className="space-y-3">
                {task.comments.length ? (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-slate-900">{comment.author}</span>
                        <span className="text-xs font-semibold text-slate-400">{comment.time}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-500">Noch keine Kommentare vorhanden.</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {teamMembers.map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => onInsertMention(member)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-violet-200 hover:text-[#6047e8]"
                  >
                    @{member}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(event) => onCommentChange(event.target.value)}
                  placeholder="Kommentar oder Rueckfrage eingeben"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                />
                <button
                  type="button"
                  onClick={onCommentSubmit}
                  className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Senden
                </button>
              </div>
            </DetailBlock>

            <DetailBlock title="Banking Ready" icon={ShieldCheck}>
              <div className="grid gap-3">
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Datenklassifizierung
                  <select
                    value={form.classification}
                    onChange={(event) => onFormChange('classification', event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                  >
                    <option value="Intern">Intern</option>
                    <option value="Vertraulich">Vertraulich</option>
                    <option value="Reguliert">Reguliert</option>
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Risiko
                  <select
                    value={form.risk}
                    onChange={(event) => onFormChange('risk', event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Hoch">Hoch</option>
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Kontroll-ID
                  <input
                    value={form.controlId}
                    onChange={(event) => onFormChange('controlId', event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Freigabeprozess
                  <input
                    value={form.approval}
                    onChange={(event) => onFormChange('approval', event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Evidenzhinweis
                  <textarea
                    value={form.evidence}
                    onChange={(event) => onFormChange('evidence', event.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d5df6] focus:ring-4 focus:ring-[#6d5df6]/10"
                  />
                </label>

                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Produktiver Zusatz
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    Kontrollnachweise, Freigaben und Dateilinks bleiben direkt am Ticket gebuendelt.
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    Das ist besonders fuer Bank- und Audit-Prozesse stark, weil Review, Evidenz und Aenderungshistorie nicht ueber mehrere Tools verteilt sind.
                  </p>
                </div>
              </div>
            </DetailBlock>
          </section>

          <DetailBlock title="Audit-Spur" icon={History}>
            <div className="space-y-2">
              {task.auditTrail.map((entry) => (
                <div key={entry} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                  {entry}
                </div>
              ))}
            </div>
          </DetailBlock>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Schliessen
            </button>
            <button
              type="button"
              onClick={onSave}
              className="h-11 rounded-xl bg-[#6d5df6] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(109,93,246,0.22)]"
            >
              Details speichern
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [detailForm, setDetailForm] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [personDraft, setPersonDraft] = useState(teamMembers[0]);
  const [attachmentSource, setAttachmentSource] = useState('SharePoint');
  const [attachmentType, setAttachmentType] = useState('Excel');

  const normalizedSearch = searchValue.trim().toLowerCase();
  const visibleTasks = useMemo(
    () =>
      normalizedSearch
        ? tasks.filter(
            (task) =>
              task.title.toLowerCase().includes(normalizedSearch) ||
              task.project.toLowerCase().includes(normalizedSearch),
          )
        : tasks,
    [normalizedSearch, tasks],
  );

  const stats = [
    {
      title: 'Meine offenen Aufgaben',
      value: tasks.filter((task) => task.status !== 'done').length,
      subtitle: 'aktuell aktiv',
      icon: ListChecks,
      iconTone: 'bg-violet-100 text-[#6d5df6]',
    },
    {
      title: 'Heute faellig',
      value: tasks.filter((task) => task.status === 'today').length,
      subtitle: 'sofort pruefen',
      icon: CalendarDays,
      iconTone: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Warten auf Review',
      value: tasks.filter((task) => task.status === 'review').length,
      subtitle: 'Feedback offen',
      icon: ShieldCheck,
      iconTone: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Blockiert',
      value: tasks.filter((task) => task.status === 'blocked').length,
      subtitle: 'muss geloest werden',
      icon: CircleAlert,
      iconTone: 'bg-rose-100 text-rose-600',
    },
  ];

  const focusTasks = tasks.filter((task) => task.status === 'today' || task.status === 'blocked').slice(0, 4);
  const nextReviewTask = tasks.find((task) => task.status === 'review');
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  const openTask = (task) => {
    setSelectedTaskId(task.id);
    setDetailForm({
      title: task.title,
      project: task.project,
      status: task.status,
      priority: task.priority,
      dueDateValue: task.dueDateValue || '',
      assignee: task.assignee,
      description: task.description || '',
      classification: task.compliance.classification,
      risk: task.compliance.risk,
      controlId: task.compliance.controlId,
      approval: task.compliance.approval,
      evidence: task.compliance.evidence,
    });
    setCommentDraft('');
    setTagDraft('');
    setPersonDraft(teamMembers[0]);
    setAttachmentSource('SharePoint');
    setAttachmentType('Excel');
  };

  const closeTask = () => {
    setSelectedTaskId(null);
    setDetailForm(null);
    setCommentDraft('');
    setTagDraft('');
  };

  const handleDetailFormChange = (field, value) => {
    setDetailForm((current) => ({ ...current, [field]: value }));
  };

  const updateSelectedTask = (updater) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === selectedTaskId ? updater(task) : task)),
    );
  };

  const handleSave = () => {
    if (!selectedTaskId || !detailForm?.title.trim()) return;

    updateSelectedTask((task) => ({
      ...task,
      title: detailForm.title.trim(),
      project: detailForm.project.trim(),
      status: detailForm.status,
      priority: detailForm.priority,
      dueDateValue: detailForm.dueDateValue,
      dueDate: formatDateLabel(detailForm.dueDateValue),
      assignee: detailForm.assignee,
      description: detailForm.description.trim(),
      note: detailForm.description.trim() || task.note,
      compliance: {
        classification: detailForm.classification,
        risk: detailForm.risk,
        controlId: detailForm.controlId.trim(),
        approval: detailForm.approval.trim(),
        evidence: detailForm.evidence.trim(),
      },
      auditTrail: [`${formatDateLabel('2026-05-16')}: Ticketdetails aktualisiert.`, ...task.auditTrail],
    }));
    closeTask();
  };

  const handleCommentSubmit = () => {
    if (!selectedTaskId || !commentDraft.trim()) return;
    updateSelectedTask((task) => ({
      ...task,
      comments: [
        ...task.comments,
        { id: `comment-${Date.now()}`, author: 'Elisabeth Bezverkha', time: 'gerade eben', text: commentDraft.trim() },
      ],
      auditTrail: [`${formatDateLabel('2026-05-16')}: Kommentar hinzugefuegt.`, ...task.auditTrail],
    }));
    setCommentDraft('');
  };

  const handleInsertMention = (member) => {
    setCommentDraft((current) => `${current}${current ? ' ' : ''}@${member} `);
  };

  const handleTagAdd = () => {
    if (!selectedTaskId || !tagDraft.trim()) return;
    updateSelectedTask((task) =>
      task.tags.includes(tagDraft.trim())
        ? task
        : {
            ...task,
            tags: [...task.tags, tagDraft.trim()],
            auditTrail: [`${formatDateLabel('2026-05-16')}: Tag "${tagDraft.trim()}" hinzugefuegt.`, ...task.auditTrail],
          },
    );
    setTagDraft('');
  };

  const handleTagRemove = (tagToRemove) => {
    updateSelectedTask((task) => ({
      ...task,
      tags: task.tags.filter((tag) => tag !== tagToRemove),
      auditTrail: [`${formatDateLabel('2026-05-16')}: Tag "${tagToRemove}" entfernt.`, ...task.auditTrail],
    }));
  };

  const handlePersonAdd = () => {
    if (!selectedTaskId || !personDraft) return;
    updateSelectedTask((task) =>
      task.linkedPeople.includes(personDraft)
        ? task
        : {
            ...task,
            linkedPeople: [...task.linkedPeople, personDraft],
            auditTrail: [`${formatDateLabel('2026-05-16')}: Mitarbeitende Person "${personDraft}" verlinkt.`, ...task.auditTrail],
          },
    );
  };

  const handlePersonRemove = (personToRemove) => {
    updateSelectedTask((task) => ({
      ...task,
      linkedPeople: task.linkedPeople.filter((person) => person !== personToRemove),
      auditTrail: [`${formatDateLabel('2026-05-16')}: Mitarbeitende Person "${personToRemove}" entfernt.`, ...task.auditTrail],
    }));
  };

  const handleAttachmentFilesAdd = (files) => {
    const nextFiles = Array.from(files || []);
    if (!selectedTaskId || !nextFiles.length) return;

    updateSelectedTask((task) => ({
      ...task,
      attachments: [
        ...task.attachments,
        ...nextFiles.map((file) => ({
          id: `attachment-${file.name}-${Date.now()}`,
          name: file.name,
          type: attachmentType,
          source: attachmentSource,
          owner: 'Elisabeth Bezverkha',
        })),
      ],
      auditTrail: [`${formatDateLabel('2026-05-16')}: ${nextFiles.length} Datei(en) als Evidenz verknuepft.`, ...task.auditTrail],
    }));
  };

  const handleAttachmentRemove = (attachmentId) => {
    updateSelectedTask((task) => ({
      ...task,
      attachments: task.attachments.filter((attachment) => attachment.id !== attachmentId),
      auditTrail: [`${formatDateLabel('2026-05-16')}: Eine Evidenzdatei entfernt.`, ...task.auditTrail],
    }));
  };

  return (
    <AppShell
      activeItem="Meine Aufgaben"
      breadcrumb={['Workspace', 'Persoenlich', 'Meine Aufgaben']}
      searchValue={searchValue}
      onSearch={setSearchValue}
    >
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_270px] xl:px-6">
        <section className="space-y-4">
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_16px_40px_rgba(39,48,93,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-slate-900">Meine Aufgaben Uebersicht</p>
                <p className="mt-1 text-xs text-slate-500">
                  Alle dir zugewiesenen Aufgaben auf einen Blick, inklusive Stand, Deadline und offenen Baustellen.
                </p>
              </div>
              <div className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-[#6047e8]">
                {visibleTasks.length} Aufgaben sichtbar
              </div>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="flex min-w-max items-start gap-2.5">
                {columns.map((column) => (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    tasks={visibleTasks.filter((task) => task.status === column.id)}
                    onOpenTask={openTask}
                  />
                ))}
              </div>
              {normalizedSearch && !visibleTasks.length ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <p className="text-sm font-bold text-slate-700">Keine Aufgaben gefunden</p>
                  <p className="mt-1 text-sm text-slate-500">Passe deine Suche an, um andere zugewiesene Aufgaben zu sehen.</p>
                </div>
              ) : null}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <SideCard title="Fokus heute">
            <div className="mt-3 space-y-2">
              {focusTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openTask(task)}
                  className="w-full rounded-xl bg-slate-50 p-2.5 text-left transition hover:bg-violet-50"
                >
                  <p className="text-[12px] font-bold leading-4 text-slate-800">{task.title}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{task.project}</p>
                  <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">{task.note}</p>
                </button>
              ))}
            </div>
          </SideCard>

          <SideCard title="Naechster Schritt">
            <div className="mt-3 rounded-2xl bg-violet-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6047e8]">Empfohlen</p>
              <p className="mt-2 text-[13px] font-bold leading-5 text-slate-900">
                {nextReviewTask ? nextReviewTask.title : 'Alle Reviews sind aktuell erledigt.'}
              </p>
              <p className="mt-2 text-[12px] font-medium leading-5 text-slate-600">
                {nextReviewTask
                  ? 'Diese Aufgabe ist fast fertig und wartet nur noch auf den letzten Review-Schritt.'
                  : 'Du hast aktuell keinen offenen Review-Blocker.'}
              </p>
            </div>
          </SideCard>

          <SideCard title="Letzte Aktivitaet">
            <div className="mt-3 space-y-2">
              {activityFeed.map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5">
                  <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-[#6047e8]">
                    <MessageSquareMore className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[12px] font-medium leading-4 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </SideCard>
        </aside>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        form={detailForm}
        commentDraft={commentDraft}
        tagDraft={tagDraft}
        personDraft={personDraft}
        attachmentSource={attachmentSource}
        attachmentType={attachmentType}
        onClose={closeTask}
        onFormChange={handleDetailFormChange}
        onCommentChange={setCommentDraft}
        onCommentSubmit={handleCommentSubmit}
        onInsertMention={handleInsertMention}
        onTagDraftChange={setTagDraft}
        onTagAdd={handleTagAdd}
        onTagRemove={handleTagRemove}
        onPersonDraftChange={setPersonDraft}
        onPersonAdd={handlePersonAdd}
        onPersonRemove={handlePersonRemove}
        onAttachmentSourceChange={setAttachmentSource}
        onAttachmentTypeChange={setAttachmentType}
        onAttachmentFilesAdd={handleAttachmentFilesAdd}
        onAttachmentRemove={handleAttachmentRemove}
        onSave={handleSave}
      />
    </AppShell>
  );
}
