import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Flag,
  GripVertical,
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

const teamProfiles = {
  'Lisa Wagner': {
    email: 'lisa.wagner@sparkasse-nexttask.de',
    role: 'Produktmanagerin',
    department: 'Digitales Banking',
  },
  'Markus Klein': {
    email: 'markus.klein@sparkasse-nexttask.de',
    role: 'Lead UX Manager',
    department: 'Digitale Vertriebskanaele',
  },
  'Anna Becker': {
    email: 'anna.becker@sparkasse-nexttask.de',
    role: 'Fachkoordinatorin',
    department: 'Produkt und Compliance',
  },
  'Tom Becker': {
    email: 'tom.becker@sparkasse-nexttask.de',
    role: 'QA Manager',
    department: 'Qualitaetssicherung',
  },
  'Sarah Nguyen': {
    email: 'sarah.nguyen@sparkasse-nexttask.de',
    role: 'Campaign Managerin',
    department: 'Marketing und Content',
  },
};

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
    assignedBy: { name: 'Markus Klein', initials: 'MK', tone: 'from-blue-200 to-indigo-300' },
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
    assignedBy: { name: 'Tom Becker', initials: 'TB', tone: 'from-slate-200 to-blue-200' },
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
    id: 'my-task-9',
    title: 'Sparkassen-Landingpage Teaser fuer Startseite abstimmen',
    status: 'today',
    project: 'Sparkasse Kampagne',
    priority: 'hoch',
    dueDate: '16. Mai 2026',
    dueDateValue: '2026-05-16',
    progress: 40,
    checklist: '2/5 erledigt',
    note: 'Textbausteine und Compliance-Hinweis muessen heute noch final abgestimmt werden.',
    description:
      'Der Startseiten-Teaser fuer die Sparkassen-Kampagne braucht finale Copy, Freigabevermerk und einen abgestimmten CTA fuer die Fachbereichsabnahme.',
    assignee: 'Lisa Wagner',
    assignedBy: { name: 'Anna Becker', initials: 'AB', tone: 'from-rose-200 to-orange-200' },
    tags: ['Sparkasse', 'Freigabe', 'Copy'],
    linkedPeople: ['Anna Becker', 'Markus Klein'],
    attachments: [{ id: 'a-9', name: 'Teaser_Freigabe_v2.docx', type: 'Word', source: 'SharePoint', owner: 'Anna Becker' }],
    comments: [
      {
        id: 'c-4',
        author: 'Anna Becker',
        time: 'heute, 10:18',
        text: 'Bitte den Hinweistext zur Produktabbildung noch in die finale Version aufnehmen.',
      },
    ],
    compliance: {
      classification: 'Intern',
      risk: 'Mittel',
      controlId: 'CTRL-SPK-301',
      approval: 'Fachbereich und Compliance pruefen den finalen Teaser',
      evidence: 'Copy-Freigabe und finaler Screenshot am Ticket sichern',
    },
    auditTrail: ['16. Mai 2026: Sparkassen-Teaser als dringende Tagesaufgabe zugewiesen.'],
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
    assignedBy: { name: 'Sarah Nguyen', initials: 'SN', tone: 'from-emerald-200 to-teal-300' },
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
    assignedBy: { name: 'Anna Becker', initials: 'AB', tone: 'from-pink-200 to-violet-200' },
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
    assignedBy: { name: 'Tom Becker', initials: 'TB', tone: 'from-slate-200 to-blue-200' },
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
    assignedBy: { name: 'Sarah Nguyen', initials: 'SN', tone: 'from-emerald-200 to-teal-300' },
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
    assignedBy: { name: 'Anna Becker', initials: 'AB', tone: 'from-pink-200 to-violet-200' },
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
    assignedBy: { name: 'Markus Klein', initials: 'MK', tone: 'from-blue-200 to-indigo-300' },
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

const controlFeed = [
  {
    taskId: 'my-task-5',
    title: 'Vier-Augen-Freigabe offen',
    meta: 'CTRL-PAY-771 • Shop Optimierung',
    note: 'Vor Abschluss fehlt noch die QA- und Product-Owner-Freigabe fuer den Checkout-Testlauf.',
  },
  {
    taskId: 'my-task-7',
    title: 'Preisfreigabe ausstehend',
    meta: 'CTRL-PRC-551 • Website Relaunch',
    note: 'Die Pricing-Seite bleibt blockiert, bis Vertrieb und Fachbereich die finale Preisdatei freigeben.',
  },
  {
    taskId: 'my-task-1',
    title: 'Evidenznachweis nachreichen',
    meta: 'CTRL-WEB-204 • Website Relaunch',
    note: 'Word-Freigabe und Screenshot-Nachweis muessen revisionssicher am Ticket verknuepft werden.',
  },
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
const createMenuItems = ['Neue Aufgabe', 'Neues Projekt'];
const initialProjects = Array.from(new Set(initialTasks.map((task) => task.project))).map((name, index) => ({
  id: `project-${index + 1}`,
  name,
  scope: 'abteilung',
  department: 'Digitales Banking',
  owner: 'Lisa Wagner',
  description: `${name} wurde als bestehendes Projekt aus dem Aufgabenbestand uebernommen.`,
}));
const performancePresets = {
  day: {
    label: 'Tag',
    progress: 68,
    caption: 'Heute abgeschlossen',
    summary: '3 von 5 offenen Tickets bewegt',
    metrics: [
      { type: 'done', value: '3' },
      { type: 'progress', value: '5' },
      { type: 'open', value: '1' },
    ],
    bars: [42, 58, 61, 68, 64, 70, 68],
  },
  week: {
    label: 'Woche',
    progress: 74,
    caption: 'Diese Woche',
    summary: '11 Tickets im Soll bearbeitet',
    metrics: [
      { type: 'done', value: '11' },
      { type: 'progress', value: '4' },
      { type: 'open', value: '2' },
    ],
    bars: [38, 46, 51, 63, 71, 74, 74],
  },
  month: {
    label: 'Monat',
    progress: 79,
    caption: 'Monatstrend',
    summary: 'Leistung stabil ueber Teamziel',
    metrics: [
      { type: 'done', value: '37' },
      { type: 'progress', value: '9' },
      { type: 'open', value: '6' },
    ],
    bars: [22, 34, 43, 56, 64, 71, 79],
  },
  year: {
    label: 'Jahr',
    progress: 81,
    caption: 'Jahreswert',
    summary: 'Audit-faehige Tickets sauber dokumentiert',
    metrics: [
      { type: 'done', value: '412' },
      { type: 'progress', value: '88' },
      { type: 'open', value: '24' },
    ],
    bars: [20, 29, 40, 52, 63, 72, 81],
  },
};

function formatDateLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function parseChecklistStats(checklist) {
  const match = checklist.match(/(\d+)\/(\d+)/);
  if (!match) return { completed: '0', total: '0' };
  return { completed: match[1], total: match[2] };
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

function AssignerAvatar({ person }) {
  const tone = person?.tone || 'from-slate-200 to-slate-300';

  return (
    <span
      className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br ${tone} text-[10px] font-extrabold text-slate-700 ring-2 ring-white`}
      title={person?.name}
    >
      {person?.initials || getInitials(person?.name || 'NA')}
    </span>
  );
}

function TaskCard({ task, onOpen }) {
  const checklistStats = parseChecklistStats(task.checklist);
  const [showAssignerProfile, setShowAssignerProfile] = useState(false);
  const assignerProfile = teamProfiles[task.assignedBy.name];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(task);
        }
      }}
      className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
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

      <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-4 text-slate-500">{task.note}</p>

      <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-2 border-t border-slate-100 pt-2">
        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowAssignerProfile((current) => !current);
            }}
            className="rounded-full"
            aria-label={`Infos zu ${task.assignedBy.name} anzeigen`}
          >
            <AssignerAvatar person={task.assignedBy} />
          </button>
          {showAssignerProfile ? (
            <div
              className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-2xl border border-[#ebc8cf] bg-white p-3 shadow-[0_16px_36px_rgba(15,23,42,0.14)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#b84758]">Zugewiesen von</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{task.assignedBy.name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{assignerProfile?.role || 'Teammitglied'}</p>
              <p className="mt-2 text-xs font-medium text-slate-600">{assignerProfile?.email || 'keine E-Mail hinterlegt'}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{assignerProfile?.department || 'keine Abteilung hinterlegt'}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[10px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MessageSquareMore className="h-3.5 w-3.5" />
            {task.comments.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" />
            {checklistStats.completed}/{checklistStats.total}
          </span>
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" />
            {task.attachments.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function BoardColumn({ column, tasks, onOpenTask, onDragStart, onDragOver, onDrop, isDragged }) {
  return (
    <section
      draggable
      onDragStart={() => onDragStart(column.id)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(column.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(column.id);
      }}
      className={`flex min-w-0 flex-col rounded-2xl border bg-white/85 p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition ${
        isDragged ? 'border-[#d89aa5] shadow-[0_18px_36px_rgba(136,54,66,0.10)]' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-900">{column.title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{tasks.length}</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition group-hover:text-slate-500" aria-hidden="true">
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
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

function PopupShell({ title, subtitle, onClose, children, maxWidth = 'max-w-3xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <section className={`max-h-[85vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ${maxWidth}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Popup schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(85vh-88px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  );
}

function SummaryStrip({ stats, controlCount, performanceValue, onOpenStat, onOpenControls, onOpenPerformance }) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,2.3fr)_minmax(190px,0.75fr)_minmax(190px,0.75fr)]">
      <section className="rounded-2xl border border-[#f0d7db] bg-white p-2.5 shadow-[0_12px_32px_rgba(136,54,66,0.08)]">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <button
              key={stat.id}
              type="button"
              onClick={() => onOpenStat(stat)}
              className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(136,54,66,0.12)] ${stat.cardTone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${stat.iconTone}`}>
                  <stat.icon className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#b66773]" />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[#8b5860]">{stat.title}</p>
              <p className="mt-1 text-[22px] font-extrabold leading-none text-slate-950">{stat.value}</p>
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onOpenControls}
        className="rounded-2xl border border-[#e6b8c0] bg-white p-4 text-left shadow-[0_12px_32px_rgba(136,54,66,0.07)] transition hover:-translate-y-0.5 hover:border-[#d89aa5] hover:shadow-[0_16px_34px_rgba(136,54,66,0.12)]"
      >
        <p className="text-[13px] font-bold text-slate-900">Freigaben und Kontrollen</p>
        <p className="mt-2 text-[28px] font-extrabold leading-none text-slate-950">{controlCount}</p>
        <p className="mt-1 text-[11px] font-semibold text-[#8b5860]">offene Kontrollpunkte</p>
      </button>

      <button
        type="button"
        onClick={onOpenPerformance}
        className="rounded-2xl border border-[#e6b8c0] bg-white p-4 text-left shadow-[0_12px_32px_rgba(136,54,66,0.07)] transition hover:-translate-y-0.5 hover:border-[#d89aa5] hover:shadow-[0_16px_34px_rgba(136,54,66,0.12)]"
      >
        <p className="text-[13px] font-bold text-slate-900">Leistungsueberblick</p>
        <p className="mt-2 text-[30px] font-extrabold leading-none text-slate-950">{performanceValue}%</p>
        <p className="mt-1 text-[11px] font-semibold text-[#8b5860]">heutiger Fortschritt</p>
      </button>
    </div>
  );
}

function TaskCollectionPopup({ title, subtitle, tasks, onClose, onOpenTask }) {
  return (
    <PopupShell title={title} subtitle={subtitle} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => {
              onClose();
              onOpenTask(task);
            }}
            className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-rose-200 hover:bg-rose-50"
          >
            <AssignerAvatar person={task.assignedBy} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{task.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{task.project}</p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{task.note}</p>
            </div>
            <div className="text-right">
              <PriorityBadge priority={task.priority} />
              <p className="mt-2 text-xs font-bold text-slate-500">{task.dueDate}</p>
            </div>
          </button>
        ))}
      </div>
    </PopupShell>
  );
}

function ControlsPopup({ items, tasks, onClose, onOpenTask }) {
  return (
    <PopupShell title="Freigaben und Kontrollen" subtitle="Offene Sign-offs, Blocker und Kontrollnachweise" onClose={onClose}>
      <div className="space-y-3">
        {items.map((item) => {
          const linkedTask = tasks.find((task) => task.id === item.taskId);
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{item.meta}</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.note}</p>
              {linkedTask ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTask(linkedTask);
                  }}
                  className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Ticket oeffnen
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </PopupShell>
  );
}

function CreateTaskModal({ projects, form, onChange, onClose, onSubmit }) {
  return (
    <PopupShell title="Neue Aufgabe" subtitle="Lege eine neue Aufgabe mit Status, Projekt und Verantwortlichkeiten an." onClose={onClose} maxWidth="max-w-3xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Aufgabentitel
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Kurzbeschreibung
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Projekt
            <select
              value={form.project}
              onChange={(event) => onChange('project', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(event) => onChange('status', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {columns.filter((column) => column.id !== 'done').map((column) => (
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
                onChange={(event) => onChange('priority', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
                onChange={(event) => onChange('dueDateValue', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Zustaendig
              <select
                value={form.assignee}
                onChange={(event) => onChange('assignee', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {teamMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
          Abbrechen
        </button>
        <button type="button" onClick={onSubmit} className="h-11 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]">
          Aufgabe anlegen
        </button>
      </div>
    </PopupShell>
  );
}

function CreateProjectModal({ form, onChange, onClose, onSubmit }) {
  return (
    <PopupShell title="Neues Projekt" subtitle="Lege ein eigenes Projekt oder ein Projekt fuer deine Abteilung strukturiert an." onClose={onClose} maxWidth="max-w-3xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Projektname
            <input
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Beschreibung
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Projektart
            <select
              value={form.scope}
              onChange={(event) => onChange('scope', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            >
              <option value="persoenlich">Persoenlich</option>
              <option value="abteilung">Abteilung</option>
            </select>
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Bereich / Abteilung
            <input
              value={form.department}
              onChange={(event) => onChange('department', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Projektverantwortung
            <input
              value={form.owner}
              onChange={(event) => onChange('owner', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
          Abbrechen
        </button>
        <button type="button" onClick={onSubmit} className="h-11 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]">
          Projekt anlegen
        </button>
      </div>
    </PopupShell>
  );
}

function PerformanceCard({ period, onPeriodChange }) {
  const data = performancePresets[period];
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.progress / 100) * circumference;
  const statusIcons = {
    done: CheckCircle2,
    progress: Clock3,
    open: X,
  };
  const statusTones = {
    done: 'bg-emerald-50 text-emerald-600',
    progress: 'bg-amber-50 text-amber-600',
    open: 'bg-rose-50 text-rose-600',
  };

  return (
    <div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {Object.entries(performancePresets).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPeriodChange(key)}
            className={`rounded-full px-2 py-1.5 text-[11px] font-bold transition ${
              period === key ? 'bg-[#c95767] text-white shadow-[0_10px_18px_rgba(201,87,103,0.26)]' : 'bg-[#f7ecee] text-[#8b5860] hover:bg-[#f3dfe3]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-[#fff6f7] p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-[88px] w-[88px] flex-none">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
              <circle cx="44" cy="44" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                stroke="#c95767"
                strokeLinecap="round"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-extrabold leading-none text-[#8f2231]">{data.progress}%</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-5 text-slate-900">{data.summary}</p>
            <div className="mt-3 grid w-full grid-cols-3 gap-2">
            {data.metrics.map((metric) => {
              const Icon = statusIcons[metric.type];
              return (
                <div key={`${period}-${metric.type}`} className="rounded-xl bg-white px-2 py-2 text-center shadow-[0_8px_18px_rgba(136,54,66,0.06)]">
                  <p className="text-[14px] font-extrabold leading-none text-slate-900">{metric.value}</p>
                  <span className={`mx-auto mt-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${statusTones[metric.type]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-end gap-1.5 rounded-2xl bg-[#fff6f7] p-2.5">
          {data.bars.map((value, index) => (
            <div key={`${period}-${index}`} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-10 w-full items-end">
                <div
                  className={`w-full rounded-full ${index === data.bars.length - 1 ? 'bg-[#c95767]' : 'bg-[#efc3ca]'}`}
                  style={{ height: `${Math.max(value, 18)}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-400">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icon className="h-4 w-4 text-[#c95767]" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="h-[min(90vh,920px)] w-full max-w-[1180px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c95767]">Ticket Details</p>
              <h2 className="mt-1 text-xl font-extrabold text-slate-950">{task.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span>{task.project}</span>
                <span className="text-slate-300">•</span>
                <span>{task.assignee}</span>
                <span className="text-slate-300">•</span>
                <span>{statusLabels[task.status]}</span>
                <span className="text-slate-300">•</span>
                <span>{task.assignedBy.name}</span>
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

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#fff3f4] px-3 py-1 text-xs font-bold text-[#b84758]">{statusLabels[task.status]}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{task.project}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{task.assignee}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{task.assignedBy.name}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{task.dueDate}</span>
          </div>
        </div>

        <div className="h-[calc(100%-145px)] overflow-y-auto px-6 py-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
            <div className="space-y-5">
              <DetailBlock title="Kerninfos" icon={FileText}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Titel
                    <input
                      value={form.title}
                      onChange={(event) => onFormChange('title', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Projekt
                    <input
                      value={form.project}
                      onChange={(event) => onFormChange('project', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Status
                    <select
                      value={form.status}
                      onChange={(event) => onFormChange('status', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Zustaendige Person
                    <select
                      value={form.assignee}
                      onChange={(event) => onFormChange('assignee', event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    >
                      {teamMembers.map((member) => (
                        <option key={member} value={member}>
                          {member}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </DetailBlock>

              <DetailBlock title="Beschreibung" icon={FileText}>
                <textarea
                  value={form.description}
                  onChange={(event) => onFormChange('description', event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
              </DetailBlock>

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
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                  >
                    {attachmentSourceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]">
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
              </DetailBlock>

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
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:text-[#b64454]"
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
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
            </div>

            <div className="space-y-5">
              <DetailBlock title="Organisation" icon={Tag}>
                <div className="grid gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tags</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => onTagRemove(tag)}
                          className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-[#b64454]"
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
                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                      />
                      <button
                        type="button"
                        onClick={onTagAdd}
                        className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        Hinzufuegen
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Verlinkte Mitarbeitende</p>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
                  </div>
                </div>
              </DetailBlock>

              <DetailBlock title="Banking Ready" icon={ShieldCheck}>
                <div className="grid gap-3">
                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Datenklassifizierung
                    <select
                      value={form.classification}
                      onChange={(event) => onFormChange('classification', event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
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
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Freigabeprozess
                    <input
                      value={form.approval}
                      onChange={(event) => onFormChange('approval', event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Evidenzhinweis
                    <textarea
                      value={form.evidence}
                      onChange={(event) => onFormChange('evidence', event.target.value)}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                    />
                  </label>
                </div>
              </DetailBlock>

              <DetailBlock title="Audit-Spur" icon={History}>
                <div className="space-y-2">
                  {task.auditTrail.map((entry) => (
                    <div key={entry} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                      {entry}
                    </div>
                  ))}
                </div>
              </DetailBlock>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
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
              className="h-11 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]"
            >
              Details speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [columnOrder, setColumnOrder] = useState(columns.map((column) => column.id));
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [createMode, setCreateMode] = useState(null);
  const [detailForm, setDetailForm] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [personDraft, setPersonDraft] = useState(teamMembers[0]);
  const [attachmentSource, setAttachmentSource] = useState('SharePoint');
  const [attachmentType, setAttachmentType] = useState('Excel');
  const [performancePeriod, setPerformancePeriod] = useState('day');
  const [createTaskForm, setCreateTaskForm] = useState({
    title: '',
    description: '',
    project: initialProjects[0]?.name || '',
    status: 'today',
    priority: 'mittel',
    dueDateValue: '2026-05-20',
    assignee: 'Lisa Wagner',
  });
  const [createProjectForm, setCreateProjectForm] = useState({
    name: '',
    description: '',
    scope: 'persoenlich',
    department: 'Digitales Banking',
    owner: 'Elisabeth Bezverkha',
  });

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
  const orderedColumns = useMemo(
    () => columnOrder.map((columnId) => columns.find((column) => column.id === columnId)).filter(Boolean),
    [columnOrder],
  );

  const statGroups = [
    {
      id: 'open',
      title: 'Meine offenen Aufgaben',
      value: tasks.filter((task) => task.status !== 'done').length,
      subtitle: 'aktuell aktiv',
      icon: ListChecks,
      iconTone: 'bg-white/85 text-[#2f7d68]',
      cardTone: 'border-[#d5eee7] bg-[#eefbf6]',
      items: tasks.filter((task) => task.status !== 'done'),
    },
    {
      id: 'today',
      title: 'Heute faellig',
      value: tasks.filter((task) => task.status === 'today').length,
      subtitle: 'sofort pruefen',
      icon: CalendarDays,
      iconTone: 'bg-white/85 text-[#c26a34]',
      cardTone: 'border-[#f5dfc7] bg-[#fff7ee]',
      items: tasks.filter((task) => task.status === 'today'),
    },
    {
      id: 'review',
      title: 'Warten auf Review',
      value: tasks.filter((task) => task.status === 'review').length,
      subtitle: 'Feedback offen',
      icon: ShieldCheck,
      iconTone: 'bg-white/85 text-[#4875c8]',
      cardTone: 'border-[#d8e6fb] bg-[#f2f7ff]',
      items: tasks.filter((task) => task.status === 'review'),
    },
    {
      id: 'blocked',
      title: 'Blockiert',
      value: tasks.filter((task) => task.status === 'blocked').length,
      subtitle: 'muss geloest werden',
      icon: CircleAlert,
      iconTone: 'bg-white/85 text-[#c24452]',
      cardTone: 'border-[#f3d7de] bg-[#fff1f4]',
      items: tasks.filter((task) => task.status === 'blocked'),
    },
  ];

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const activeStat = activePopup?.type === 'stat' ? statGroups.find((stat) => stat.id === activePopup.statId) : null;

  const openTask = (task) => {
    setActivePopup(null);
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

  const moveColumn = (targetColumnId) => {
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;

    setColumnOrder((currentOrder) => {
      const nextOrder = currentOrder.filter((columnId) => columnId !== draggedColumnId);
      const targetIndex = nextOrder.indexOf(targetColumnId);
      nextOrder.splice(targetIndex, 0, draggedColumnId);
      return nextOrder;
    });
    setDraggedColumnId(null);
  };

  const handleCreateAction = (item) => {
    if (item === 'Neue Aufgabe') {
      setCreateTaskForm({
        title: '',
        description: '',
        project: projects[0]?.name || '',
        status: 'today',
        priority: 'mittel',
        dueDateValue: '2026-05-20',
        assignee: 'Lisa Wagner',
      });
      setCreateMode('task');
    }

    if (item === 'Neues Projekt') {
      setCreateProjectForm({
        name: '',
        description: '',
        scope: 'persoenlich',
        department: 'Digitales Banking',
        owner: 'Elisabeth Bezverkha',
      });
      setCreateMode('project');
    }
  };

  const handleCreateTaskFormChange = (field, value) => {
    setCreateTaskForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateProjectFormChange = (field, value) => {
    setCreateProjectForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateProjectSubmit = () => {
    const trimmedName = createProjectForm.name.trim();
    if (!trimmedName) return;

    const projectExists = projects.some((project) => project.name.toLowerCase() === trimmedName.toLowerCase());
    if (projectExists) {
      setCreateMode(null);
      return;
    }

    const nextProject = {
      id: `project-${Date.now()}`,
      name: trimmedName,
      scope: createProjectForm.scope,
      department: createProjectForm.department.trim() || 'Digitales Banking',
      owner: createProjectForm.owner.trim() || 'Elisabeth Bezverkha',
      description: createProjectForm.description.trim(),
    };

    setProjects((current) => [nextProject, ...current]);
    setCreateTaskForm((current) => ({ ...current, project: nextProject.name }));
    setCreateMode(null);
  };

  const handleCreateTaskSubmit = () => {
    const trimmedTitle = createTaskForm.title.trim();
    if (!trimmedTitle || !createTaskForm.project) return;

    const dueDateLabel = formatDateLabel(createTaskForm.dueDateValue);
    const note = createTaskForm.description.trim() || 'Neu angelegte Aufgabe wartet auf weitere Details.';

    const nextTask = {
      id: `my-task-${Date.now()}`,
      title: trimmedTitle,
      status: createTaskForm.status,
      project: createTaskForm.project,
      priority: createTaskForm.priority,
      dueDate: dueDateLabel,
      dueDateValue: createTaskForm.dueDateValue,
      progress: 0,
      checklist: '0/3 erledigt',
      note,
      description: note,
      assignee: createTaskForm.assignee,
      assignedBy: { name: 'Elisabeth Bezverkha', initials: 'EB', tone: 'from-rose-200 to-orange-200' },
      tags: ['Neu'],
      linkedPeople: [],
      attachments: [],
      comments: [],
      compliance: {
        classification: 'Intern',
        risk: 'Niedrig',
        controlId: `CTRL-NEW-${String(Date.now()).slice(-4)}`,
        approval: 'Noch kein Freigabeprozess definiert',
        evidence: 'Noch keine Evidenz hinterlegt',
      },
      auditTrail: [`${formatDateLabel('2026-05-16')}: Aufgabe neu erstellt.`],
    };

    setTasks((current) => [nextTask, ...current]);
    setCreateMode(null);
  };

  return (
    <AppShell
      activeItem="Meine Aufgaben"
      hideBreadcrumb
      searchPlacement="actions"
      createMenuItems={createMenuItems}
      onCreateAction={handleCreateAction}
      searchValue={searchValue}
      onSearch={setSearchValue}
    >
      <div className="space-y-4 px-4 py-4 xl:px-6">
        <SummaryStrip
          stats={statGroups}
          controlCount={controlFeed.length}
          performanceValue={performancePresets.day.progress}
          onOpenStat={(stat) => setActivePopup({ type: 'stat', statId: stat.id })}
          onOpenControls={() => setActivePopup({ type: 'controls' })}
          onOpenPerformance={() => setActivePopup({ type: 'performance' })}
        />

        <section className="rounded-2xl border border-[#e6b8c0] bg-white p-3.5 shadow-[0_16px_40px_rgba(136,54,66,0.08)]">
          <div className="rounded-2xl border border-[#f2d8dd] bg-[#fff8f9] p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {orderedColumns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                tasks={visibleTasks.filter((task) => task.status === column.id)}
                onOpenTask={openTask}
                onDragStart={setDraggedColumnId}
                onDragOver={() => {}}
                onDrop={moveColumn}
                isDragged={draggedColumnId === column.id}
              />
            ))}
            </div>
          </div>
          {normalizedSearch && !visibleTasks.length ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-slate-700">Keine Aufgaben gefunden</p>
              <p className="mt-1 text-sm text-slate-500">Passe deine Suche an, um andere zugewiesene Aufgaben zu sehen.</p>
            </div>
          ) : null}
        </section>
      </div>

      {activeStat ? (
        <TaskCollectionPopup
          title={activeStat.title}
          subtitle={`${activeStat.value} passende Tickets`}
          tasks={activeStat.items}
          onClose={() => setActivePopup(null)}
          onOpenTask={openTask}
        />
      ) : null}
      {activePopup?.type === 'controls' ? (
        <ControlsPopup items={controlFeed} tasks={tasks} onClose={() => setActivePopup(null)} onOpenTask={openTask} />
      ) : null}
      {activePopup?.type === 'performance' ? (
        <PopupShell
          title="Leistungsueberblick"
          subtitle="Tag, Woche, Monat und Jahr direkt vergleichen"
          onClose={() => setActivePopup(null)}
          maxWidth="max-w-2xl"
        >
          <PerformanceCard period={performancePeriod} onPeriodChange={setPerformancePeriod} />
        </PopupShell>
      ) : null}
      {createMode === 'task' ? (
        <CreateTaskModal
          projects={projects}
          form={createTaskForm}
          onChange={handleCreateTaskFormChange}
          onClose={() => setCreateMode(null)}
          onSubmit={handleCreateTaskSubmit}
        />
      ) : null}
      {createMode === 'project' ? (
        <CreateProjectModal
          form={createProjectForm}
          onChange={handleCreateProjectFormChange}
          onClose={() => setCreateMode(null)}
          onSubmit={handleCreateProjectSubmit}
        />
      ) : null}
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
