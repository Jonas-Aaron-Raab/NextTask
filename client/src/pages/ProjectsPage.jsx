import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Filter,
  FolderOpen,
  ListChecks,
  MoreHorizontal,
  ShieldCheck,
  Tag,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialTasks as sourceTasks } from './MyTasksPage';

const createMenuItems = ['Neue Abteilung', 'Neues Projekt'];

const initialDepartments = [
  {
    id: 'dept-digital-banking',
    name: 'Digitales Banking',
    lead: 'Lisa Wagner',
    members: ['Lisa Wagner', 'Markus Klein', 'Anna Becker', 'Elisabeth Bezverkha'],
    memberCount: 8,
    description: 'Digitale Produkte, Banking-Journeys und Kundenoberflaechen.',
    accent: 'border-[#f3d7de] bg-[#fff4f6]',
    badgeTone: 'bg-[#fff0f2] text-[#b84758]',
  },
  {
    id: 'dept-qa',
    name: 'Qualitaetssicherung',
    lead: 'Tom Becker',
    members: ['Tom Becker', 'Elisabeth Bezverkha'],
    memberCount: 5,
    description: 'Tests, Freigaben, Regressionen und Produktionsqualitaet.',
    accent: 'border-[#d8e6fb] bg-[#f4f8ff]',
    badgeTone: 'bg-[#edf4ff] text-[#4875c8]',
  },
  {
    id: 'dept-marketing',
    name: 'Marketing und Content',
    lead: 'Sarah Nguyen',
    members: ['Sarah Nguyen', 'Markus Klein'],
    memberCount: 6,
    description: 'Kampagnen, Content-Produktion und Markenauftritte.',
    accent: 'border-[#d5eee7] bg-[#effbf7]',
    badgeTone: 'bg-[#ecfbf6] text-[#2f7d68]',
  },
  {
    id: 'dept-compliance',
    name: 'Produkt und Compliance',
    lead: 'Anna Becker',
    members: ['Anna Becker', 'Lisa Wagner'],
    memberCount: 4,
    description: 'Kontrollpunkte, Freigaben und regulatorische Abstimmungen.',
    accent: 'border-[#f5dfc7] bg-[#fff8ef]',
    badgeTone: 'bg-[#fff4e7] text-[#c26a34]',
  },
];

const initialProjects = [
  {
    id: 'proj-1',
    departmentId: 'dept-digital-banking',
    name: 'Mobile Banking Relaunch',
    owner: 'Lisa Wagner',
    visibility: 'Abteilung',
    status: 'In Planung',
    dueDate: '30. Juni 2026',
    summary: 'Neue mobile Customer Journey fuer Konto, Karten und Self Services.',
  },
  {
    id: 'proj-2',
    departmentId: 'dept-digital-banking',
    name: 'Persoenliches Dashboard',
    owner: 'Elisabeth Bezverkha',
    visibility: 'Persoenlich',
    status: 'In Arbeit',
    dueDate: '12. Juli 2026',
    summary: 'Eigenes Strukturprojekt fuer persoenliche Aufgaben und Prioritaeten.',
  },
  {
    id: 'proj-3',
    departmentId: 'dept-qa',
    name: 'Checkout Testprogramm',
    owner: 'Tom Becker',
    visibility: 'Abteilung',
    status: 'Review',
    dueDate: '22. Juni 2026',
    summary: 'Abteilungsprojekt fuer Regression, Testfallpflege und QA-Freigaben.',
  },
  {
    id: 'proj-4',
    departmentId: 'dept-qa',
    name: 'Device Testmatrix 2026',
    owner: 'Elisabeth Bezverkha',
    visibility: 'Persoenlich',
    status: 'In Arbeit',
    dueDate: '05. Juli 2026',
    summary: 'Eigene Matrix fuer Browser-, Breakpoint- und Device-Abdeckung.',
  },
  {
    id: 'proj-5',
    departmentId: 'dept-marketing',
    name: 'Sparkassen Herbstkampagne',
    owner: 'Sarah Nguyen',
    visibility: 'Abteilung',
    status: 'Konzept',
    dueDate: '18. August 2026',
    summary: 'Kampagnenprojekt fuer Landingpages, Anzeigen und Content-Bausteine.',
  },
  {
    id: 'proj-6',
    departmentId: 'dept-compliance',
    name: 'Freigabe-Cockpit',
    owner: 'Anna Becker',
    visibility: 'Abteilung',
    status: 'In Arbeit',
    dueDate: '08. Juli 2026',
    summary: 'Uebersicht fuer Freigaben, Evidenz und Kontroll-IDs pro Fachbereich.',
  },
];

const backlogStatusMeta = {
  todo: {
    label: 'To Do',
    tone: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
  progress: {
    label: 'In Arbeit',
    tone: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
  },
  review: {
    label: 'Review',
    tone: 'bg-violet-50 text-violet-700',
    dot: 'bg-violet-500',
  },
  done: {
    label: 'Erledigt',
    tone: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

const priorityMeta = {
  niedrig: 'text-emerald-700 bg-emerald-50',
  mittel: 'text-amber-700 bg-amber-50',
  hoch: 'text-rose-700 bg-rose-50',
};

const initialBacklogTasks = [
  {
    id: 'bg-101',
    sourceTaskId: 'my-task-1',
    projectId: 'proj-1',
    title: 'Kontouebersicht fuer mobile Breakpoints pruefen',
    status: 'progress',
    priority: 'hoch',
    assignee: 'Lisa Wagner',
    dueDate: '18. Juni 2026',
    points: 5,
    tags: ['Mobile', 'UX'],
    description: 'Die neue Kontouebersicht soll auf den wichtigsten Smartphone-Breiten ohne horizontales Scrollen funktionieren.',
  },
  {
    id: 'bg-102',
    sourceTaskId: 'my-task-2',
    projectId: 'proj-1',
    title: 'Karten-Self-Service Textfreigabe vorbereiten',
    status: 'todo',
    priority: 'mittel',
    assignee: 'Anna Becker',
    dueDate: '24. Juni 2026',
    points: 3,
    tags: ['Content', 'Freigabe'],
    description: 'Copy, Hinweistext und Fehlermeldungen fuer Kartenlimits in ein pruefbares Paket ueberfuehren.',
  },
  {
    id: 'bg-105',
    sourceTaskId: 'my-task-3',
    projectId: 'proj-1',
    title: 'Push-Benachrichtigung fuer Umsatzdetails spezifizieren',
    status: 'todo',
    priority: 'mittel',
    assignee: '',
    dueDate: '27. Juni 2026',
    points: 3,
    tags: ['Mobile', 'Offen'],
    description: 'Fuer Umsatzdetails fehlt noch die fachliche Spezifikation der Push-Hinweise. Die Aufgabe ist noch keiner Person zugeordnet.',
  },
  {
    id: 'bg-103',
    sourceTaskId: 'my-task-4',
    projectId: 'proj-2',
    title: 'Persoenliche KPI-Kacheln priorisieren',
    status: 'review',
    priority: 'mittel',
    assignee: 'Elisabeth Bezverkha',
    dueDate: '02. Juli 2026',
    points: 2,
    tags: ['Dashboard'],
    description: 'Die wichtigsten Kennzahlen fuer persoenliche Tagesplanung festlegen und mit Beispielwerten abgleichen.',
  },
  {
    id: 'bg-104',
    sourceTaskId: 'my-task-3',
    projectId: 'proj-2',
    title: 'Widget-Reihenfolge fuer persoenliches Dashboard klaeren',
    status: 'todo',
    priority: 'mittel',
    assignee: '',
    dueDate: '10. Juli 2026',
    points: 3,
    tags: ['Dashboard', 'Offen'],
    description: 'Die finale Reihenfolge der Dashboard-Widgets ist noch nicht vergeben und braucht eine fachliche Entscheidung.',
  },
  {
    id: 'bg-201',
    sourceTaskId: 'my-task-5',
    projectId: 'proj-3',
    title: 'Checkout Regression fuer Gastzahlung ausfuehren',
    status: 'progress',
    priority: 'hoch',
    assignee: 'Tom Becker',
    dueDate: '20. Juni 2026',
    points: 8,
    tags: ['Regression', 'Checkout'],
    description: 'Gastzahlung mit Kreditkarte, Sofortueberweisung und Abbruchpfad testen und dokumentieren.',
  },
  {
    id: 'bg-202',
    sourceTaskId: 'my-task-2',
    projectId: 'proj-4',
    title: 'Browsermatrix fuer Tablet-Geraete aktualisieren',
    status: 'todo',
    priority: 'niedrig',
    assignee: 'Elisabeth Bezverkha',
    dueDate: '28. Juni 2026',
    points: 3,
    tags: ['Devices'],
    description: 'Aktuelle iPad- und Android-Tablet-Kombinationen in die Testmatrix aufnehmen.',
  },
  {
    id: 'bg-203',
    sourceTaskId: 'my-task-8',
    projectId: 'proj-4',
    title: 'Offene Testdaten fuer Altgeraete einsammeln',
    status: 'todo',
    priority: 'niedrig',
    assignee: '',
    dueDate: '03. Juli 2026',
    points: 2,
    tags: ['QA', 'Offen'],
    description: 'Fuer mehrere Altgeraete fehlen noch Testdaten. Die Aufgabe ist bewusst ohne Verantwortlichen angelegt.',
  },
  {
    id: 'bg-301',
    sourceTaskId: 'my-task-9',
    projectId: 'proj-5',
    title: 'Landingpage-Teaser fuer Herbstkampagne schreiben',
    status: 'review',
    priority: 'mittel',
    assignee: 'Sarah Nguyen',
    dueDate: '04. August 2026',
    points: 5,
    tags: ['Copy', 'Kampagne'],
    description: 'Teaser, CTA und rechtlichen Hinweis als erste Review-Fassung vorbereiten.',
  },
  {
    id: 'bg-302',
    sourceTaskId: 'my-task-6',
    projectId: 'proj-5',
    title: 'Asset-Liste fuer Kampagnenmotive vervollstaendigen',
    status: 'todo',
    priority: 'mittel',
    assignee: '',
    dueDate: '09. August 2026',
    points: 3,
    tags: ['Assets', 'Offen'],
    description: 'Die Liste der benoetigten Kampagnenmotive ist noch nicht einer Person zugeordnet.',
  },
  {
    id: 'bg-401',
    sourceTaskId: 'my-task-7',
    projectId: 'proj-6',
    title: 'Freigabe-Checkliste fuer Evidenzpakete definieren',
    status: 'progress',
    priority: 'hoch',
    assignee: 'Anna Becker',
    dueDate: '01. Juli 2026',
    points: 8,
    tags: ['Compliance', 'Kontrolle'],
    description: 'Pflichtfelder, Nachweise und Vier-Augen-Pruefung fuer Abteilungsfreigaben strukturieren.',
  },
];

function getSourceTaskKey(task) {
  const sourceTask = sourceTasks.find((candidate) => candidate.id === task.sourceTaskId);
  return task.controlId || sourceTask?.compliance?.controlId || task.sourceTaskId || task.id;
}

function getAssigneeLabel(assignee) {
  return assignee?.trim() || 'Ohne Verantwortlichen';
}

const emptyDepartmentForm = {
  name: '',
  lead: 'Elisabeth Bezverkha',
  memberCount: '4',
  description: '',
};

const emptyProjectForm = {
  name: '',
  departmentId: initialDepartments[0].id,
  owner: 'Elisabeth Bezverkha',
  visibility: 'Persoenlich',
  status: 'In Planung',
  dueDate: '2026-07-15',
  summary: '',
};

function PopupShell({ title, subtitle, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <section className={`w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] ${maxWidth}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Popup schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

function CreateDepartmentModal({ form, onChange, onClose, onSubmit }) {
  return (
    <PopupShell title="Neue Abteilung" subtitle="Lege einen neuen Bereich an, in dem spaeter eigene Projekte organisiert werden." maxWidth="max-w-3xl" onClose={onClose}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Abteilungsname
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
            Bereichsleitung
            <input
              value={form.lead}
              onChange={(event) => onChange('lead', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Teamgroesse
            <input
              value={form.memberCount}
              onChange={(event) => onChange('memberCount', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
          Abbrechen
        </button>
        <button type="button" onClick={onSubmit} className="h-11 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)]">
          Abteilung anlegen
        </button>
      </div>
    </PopupShell>
  );
}

function CreateProjectModal({ departments, form, onChange, onClose, onSubmit }) {
  return (
    <PopupShell title="Neues Projekt" subtitle="Lege ein persoenliches Projekt oder ein Projekt fuer eine Abteilung an." maxWidth="max-w-3xl" onClose={onClose}>
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
            Projektbeschreibung
            <textarea
              value={form.summary}
              onChange={(event) => onChange('summary', event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-bold text-slate-700">
            Abteilung
            <select
              value={form.departmentId}
              onChange={(event) => onChange('departmentId', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Projektart
            <select
              value={form.visibility}
              onChange={(event) => onChange('visibility', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            >
              <option value="Persoenlich">Persoenlich</option>
              <option value="Abteilung">Abteilung</option>
            </select>
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Verantwortung
            <input
              value={form.owner}
              onChange={(event) => onChange('owner', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Zieltermin
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => onChange('dueDate', event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
          </label>
        </section>
      </div>

      <div className="mt-6 flex justify-end gap-3">
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

function DepartmentCard({ department, projectCount, backlogCount, isActive, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(department.id)}
      className={`rounded-3xl border p-5 text-left shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${department.accent} ${
        isActive ? 'ring-4 ring-[#c95767]/12' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#b84758] shadow-[0_10px_22px_rgba(184,71,88,0.10)]">
          <Building2 className="h-6 w-6" />
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${department.badgeTone}`}>{projectCount} Projekte</span>
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-slate-950">{department.name}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{department.description}</p>

      <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1">
          <Users className="h-3.5 w-3.5" />
          {department.memberCount} Personen
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          {department.lead}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1">
          <ListChecks className="h-3.5 w-3.5" />
          {backlogCount} Aufgaben
        </span>
      </div>
    </button>
  );
}

function ProjectCard({ project }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-950">{project.name}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{project.summary}</p>
        </div>
        <span className="rounded-full bg-[#fff0f2] px-3 py-1 text-xs font-bold text-[#b84758]">{project.visibility}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">{project.status}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {project.dueDate}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{project.owner}</span>
      </div>
    </article>
  );
}

function BacklogTaskRow({ task, project, isActive, onOpen }) {
  const status = backlogStatusMeta[task.status] || backlogStatusMeta.todo;
  const taskKey = getSourceTaskKey(task);
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className={`grid w-full grid-cols-[minmax(120px,0.8fr)_minmax(240px,2.5fr)_minmax(120px,0.9fr)_minmax(90px,0.6fr)_minmax(150px,1fr)_44px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-[#fff8f9] ${
        isActive ? 'bg-[#fff1f3]' : 'bg-white'
      }`}
    >
      <span className="font-bold text-slate-500">{taskKey}</span>
      <span className="min-w-0">
        <span className="block truncate font-bold text-slate-900">{task.title}</span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">{project?.name || 'Projekt'}</span>
      </span>
      <span className={`inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.tone}`}>
        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
        {status.label}
      </span>
      <span className={`inline-flex w-max rounded-full px-2.5 py-1 text-xs font-bold ${priorityMeta[task.priority] || priorityMeta.mittel}`}>
        {task.priority}
      </span>
      <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold text-slate-600">
        <UserRound className="h-3.5 w-3.5 flex-none text-slate-400" />
        <span className="truncate">{getAssigneeLabel(task.assignee)}</span>
      </span>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400">
        <MoreHorizontal className="h-4 w-4" />
      </span>
    </button>
  );
}

function BacklogProjectGroup({ project, tasks, selectedTaskId, onOpenTask }) {
  const completed = tasks.filter((task) => task.status === 'done').length;
  const totalPoints = tasks.reduce((sum, task) => sum + task.points, 0);

  return (
    <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-extrabold text-slate-950">{project.name}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{tasks.length} Aufgaben</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">{project.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1">{completed} erledigt</span>
          <span className="rounded-full bg-white px-2.5 py-1">{totalPoints} Punkte</span>
        </div>
      </div>

      <div className="hidden grid-cols-[minmax(120px,0.8fr)_minmax(240px,2.5fr)_minmax(120px,0.9fr)_minmax(90px,0.6fr)_minmax(150px,1fr)_44px] gap-3 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400 md:grid">
        <span>Key</span>
        <span>Aufgabe</span>
        <span>Status</span>
        <span>Prio</span>
        <span>Verantwortlich</span>
        <span />
      </div>

      <div>
        {tasks.map((task) => (
          <BacklogTaskRow
            key={task.id}
            task={task}
            project={project}
            isActive={selectedTaskId === task.id}
            onOpen={onOpenTask}
          />
        ))}
      </div>
    </section>
  );
}

function BacklogDetailPanel({ task, project }) {
  if (!task) {
    return (
      <aside className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <ListChecks className="mx-auto h-8 w-8 text-[#b84758]" />
        <p className="mt-3 text-sm font-bold text-slate-900">Aufgabe auswaehlen</p>
        <p className="mt-1 text-sm font-medium text-slate-500">Klicke links auf ein Ticket, um Details im Backlog zu sehen.</p>
      </aside>
    );
  }

  const status = backlogStatusMeta[task.status] || backlogStatusMeta.todo;
  const taskKey = getSourceTaskKey(task);

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">{taskKey}</p>
          <h3 className="mt-2 text-xl font-extrabold leading-tight text-slate-950">{task.title}</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.tone}`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{task.description}</p>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Projekt</p>
          <p className="mt-1 font-bold text-slate-900">{project?.name || 'Projekt'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Status</p>
            <p className="mt-1 font-bold text-slate-900">{status.label}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Prioritaet</p>
            <p className="mt-1 font-bold text-slate-900">{task.priority}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Faellig</p>
            <p className="mt-1 font-bold text-slate-900">{task.dueDate}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Punkte</p>
            <p className="mt-1 font-bold text-slate-900">{task.points}</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Verantwortlich</p>
          <p className="mt-1 flex items-center gap-2 font-bold text-slate-900">
            <UserRound className="h-4 w-4 text-slate-400" />
            {getAssigneeLabel(task.assignee)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {task.tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1f3] px-3 py-1 text-xs font-bold text-[#a23d4d]">
            <Tag className="h-3 w-3" />
            {tag}
          </span>
        ))}
      </div>
    </aside>
  );
}

export default function ProjectsPage() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [projects, setProjects] = useState(initialProjects);
  const [backlogTasks] = useState(initialBacklogTasks);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0].id);
  const [viewMode, setViewMode] = useState('backlog');
  const [selectedBacklogTaskId, setSelectedBacklogTaskId] = useState(initialBacklogTasks[0]?.id || null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [backlogFilter, setBacklogFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [createMode, setCreateMode] = useState(null);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  const normalizedSearch = searchValue.trim().toLowerCase();

  const visibleDepartments = useMemo(
    () =>
      normalizedSearch
        ? departments.filter((department) => {
            const departmentProjects = projects.filter((project) => project.departmentId === department.id);
            return (
              department.name.toLowerCase().includes(normalizedSearch) ||
              department.description.toLowerCase().includes(normalizedSearch) ||
              departmentProjects.some((project) => project.name.toLowerCase().includes(normalizedSearch))
            );
          })
        : departments,
    [departments, normalizedSearch, projects],
  );

  const selectedDepartment =
    visibleDepartments.find((department) => department.id === selectedDepartmentId) ||
    visibleDepartments[0] ||
    departments[0] ||
    null;

  const departmentMembers = selectedDepartment?.members || [];

  const visibleProjects = useMemo(() => {
    if (!selectedDepartment) return [];
    return projects.filter((project) => {
      if (project.departmentId !== selectedDepartment.id) return false;
      if (!normalizedSearch) return true;
      return (
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.summary.toLowerCase().includes(normalizedSearch) ||
        project.owner.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [normalizedSearch, projects, selectedDepartment]);

  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);

  const visibleBacklogTasks = useMemo(
    () =>
      backlogTasks.filter((task) => {
        if (!visibleProjectIds.has(task.projectId)) return false;
        if (backlogFilter === 'unassigned' && task.assignee.trim()) return false;
        if (backlogFilter.startsWith('person:') && task.assignee !== backlogFilter.replace('person:', '')) return false;
        if (!normalizedSearch) return true;
        const project = projects.find((candidate) => candidate.id === task.projectId);
        return (
          task.title.toLowerCase().includes(normalizedSearch) ||
          getSourceTaskKey(task).toLowerCase().includes(normalizedSearch) ||
          getAssigneeLabel(task.assignee).toLowerCase().includes(normalizedSearch) ||
          task.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ||
          project?.name.toLowerCase().includes(normalizedSearch)
        );
      }),
    [backlogFilter, backlogTasks, normalizedSearch, projects, visibleProjectIds],
  );

  const selectedBacklogTask =
    visibleBacklogTasks.find((task) => task.id === selectedBacklogTaskId) || visibleBacklogTasks[0] || null;
  const selectedBacklogProject = selectedBacklogTask
    ? projects.find((project) => project.id === selectedBacklogTask.projectId)
    : null;

  const handleDepartmentOpen = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setViewMode('backlog');
    setFilterOpen(false);
    setBacklogFilter('all');
    const departmentProjectIds = projects.filter((project) => project.departmentId === departmentId).map((project) => project.id);
    const firstTask = backlogTasks.find((task) => departmentProjectIds.includes(task.projectId));
    setSelectedBacklogTaskId(firstTask?.id || null);
  };

  const handleCreateAction = (item) => {
    if (item === 'Neue Abteilung') {
      setDepartmentForm(emptyDepartmentForm);
      setCreateMode('department');
    }

    if (item === 'Neues Projekt') {
      setProjectForm({
        ...emptyProjectForm,
        departmentId: selectedDepartment?.id || departments[0]?.id || '',
      });
      setCreateMode('project');
    }
  };

  const handleDepartmentSubmit = () => {
    const trimmedName = departmentForm.name.trim();
    if (!trimmedName) return;

    const nextDepartment = {
      id: `dept-${Date.now()}`,
      name: trimmedName,
      lead: departmentForm.lead.trim() || 'Elisabeth Bezverkha',
      memberCount: Number.parseInt(departmentForm.memberCount, 10) || 4,
      description: departmentForm.description.trim() || 'Neue Abteilung fuer strukturierte Projekte und Zusammenarbeit.',
      accent: 'border-[#f3d7de] bg-[#fff4f6]',
      badgeTone: 'bg-[#fff0f2] text-[#b84758]',
      members: [departmentForm.lead.trim() || 'Elisabeth Bezverkha'],
    };

    setDepartments((current) => [nextDepartment, ...current]);
    setSelectedDepartmentId(nextDepartment.id);
    setViewMode('projects');
    setSelectedBacklogTaskId(null);
    setCreateMode(null);
  };

  const handleProjectSubmit = () => {
    const trimmedName = projectForm.name.trim();
    if (!trimmedName || !projectForm.departmentId) return;

    const nextProject = {
      id: `proj-${Date.now()}`,
      departmentId: projectForm.departmentId,
      name: trimmedName,
      owner: projectForm.owner.trim() || 'Elisabeth Bezverkha',
      visibility: projectForm.visibility,
      status: projectForm.visibility === 'Persoenlich' ? 'Eigene Planung' : 'Abteilungsprojekt',
      dueDate: new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${projectForm.dueDate}T00:00:00`)),
      summary: projectForm.summary.trim() || 'Neu angelegtes Projekt ohne weitere Beschreibung.',
    };

    setProjects((current) => [nextProject, ...current]);
    setSelectedDepartmentId(projectForm.departmentId);
    setViewMode('projects');
    setCreateMode(null);
  };

  const handleBacklogTaskOpen = (taskId) => {
    setSelectedBacklogTaskId(taskId);
  };

  const filterLabel =
    backlogFilter === 'unassigned'
      ? 'ohne Verantwortlichen'
      : backlogFilter.startsWith('person:')
        ? `fuer ${backlogFilter.replace('person:', '')}`
        : '';

  return (
    <AppShell
      activeItem="Projekte"
      hideBreadcrumb
      searchPlacement="actions"
      createMenuItems={createMenuItems}
      onCreateAction={handleCreateAction}
      searchValue={searchValue}
      onSearch={setSearchValue}
    >
      <div className="space-y-6 px-4 py-4 xl:px-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleDepartments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              projectCount={projects.filter((project) => project.departmentId === department.id).length}
              backlogCount={backlogTasks.filter((task) => {
                const project = projects.find((candidate) => candidate.id === task.projectId);
                return project?.departmentId === department.id;
              }).length}
              isActive={selectedDepartment?.id === department.id}
              onOpen={handleDepartmentOpen}
            />
          ))}
        </section>

        <section className="rounded-3xl border border-[#e6b8c0] bg-white p-5 shadow-[0_16px_40px_rgba(136,54,66,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">
                {selectedDepartment ? selectedDepartment.name : 'Keine Abteilung'}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                {selectedDepartment ? 'Projekte der Abteilung' : 'Keine Projekte sichtbar'}
              </h2>
              {selectedDepartment ? (
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">{selectedDepartment.description}</p>
              ) : null}
            </div>

            {selectedDepartment ? (
              <div className="flex flex-wrap items-center gap-3">
                {viewMode === 'backlog' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterOpen(false);
                      setViewMode('projects');
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Projekte
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterOpen(false);
                      setViewMode('backlog');
                      setSelectedBacklogTaskId((current) => current || visibleBacklogTasks[0]?.id || null);
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)] transition hover:bg-[#b84758]"
                  >
                    <ListChecks className="h-4 w-4" />
                    Backlog
                  </button>
                )}
                <div className="rounded-2xl border border-[#f0d7db] bg-[#fff7f8] px-4 py-3 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#b84758]">Leitung</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{selectedDepartment.lead}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{selectedDepartment.memberCount} Personen im Bereich</p>
                </div>
              </div>
            ) : null}
          </div>

          {viewMode === 'projects' ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : null}

          {viewMode === 'backlog' ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">
                    {visibleBacklogTasks.length} Aufgaben im Backlog
                    {filterLabel ? ` ${filterLabel}` : ''}
                  </p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFilterOpen((current) => !current)}
                      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
                        backlogFilter === 'unassigned'
                          ? 'border-[#d89aa5] bg-[#fff1f3] text-[#a23d4d]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                      aria-label="Backlog filtern"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </button>

                    {filterOpen ? (
                      <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                        <button
                          type="button"
                          onClick={() => {
                            setBacklogFilter((current) => (current === 'unassigned' ? 'all' : 'unassigned'));
                            setFilterOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                            backlogFilter === 'unassigned' ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Ohne Verantwortlichen
                          {backlogFilter === 'unassigned' ? <CheckCircle2 className="h-4 w-4" /> : null}
                        </button>
                        {departmentMembers.length ? (
                          <>
                            <div className="my-1 border-t border-slate-100" />
                            {departmentMembers.map((member) => {
                              const value = `person:${member}`;
                              return (
                                <button
                                  key={member}
                                  type="button"
                                  onClick={() => {
                                    setBacklogFilter((current) => (current === value ? 'all' : value));
                                    setFilterOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                    backlogFilter === value ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {member}
                                  {backlogFilter === value ? <CheckCircle2 className="h-4 w-4" /> : null}
                                </button>
                              );
                            })}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                {visibleProjects.map((project) => {
                  const projectTasks = visibleBacklogTasks.filter((task) => task.projectId === project.id);
                  if (!projectTasks.length) return null;
                  return (
                    <BacklogProjectGroup
                      key={project.id}
                      project={project}
                      tasks={projectTasks}
                      selectedTaskId={selectedBacklogTask?.id}
                      onOpenTask={handleBacklogTaskOpen}
                    />
                  );
                })}

                {!visibleBacklogTasks.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <ListChecks className="mx-auto h-8 w-8 text-[#b84758]" />
                    <p className="mt-4 text-base font-bold text-slate-900">Noch keine Aufgaben im Backlog</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">Fuer diese Abteilung wurden noch keine Backlog-Aufgaben angelegt.</p>
                  </div>
                ) : null}
              </div>

              <BacklogDetailPanel
                task={selectedBacklogTask}
                project={selectedBacklogProject}
              />
            </div>
          ) : null}

          {viewMode === 'projects' && !visibleProjects.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b84758] shadow-[0_10px_24px_rgba(184,71,88,0.10)]">
                <FolderOpen className="h-7 w-7" />
              </div>
              <p className="mt-4 text-base font-bold text-slate-900">Noch keine Projekte in diesem Bereich</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Lege ueber `Erstellen` ein neues Projekt an oder waehle eine andere Abteilung aus.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      {createMode === 'department' ? (
        <CreateDepartmentModal
          form={departmentForm}
          onChange={(field, value) => setDepartmentForm((current) => ({ ...current, [field]: value }))}
          onClose={() => setCreateMode(null)}
          onSubmit={handleDepartmentSubmit}
        />
      ) : null}

      {createMode === 'project' ? (
        <CreateProjectModal
          departments={departments}
          form={projectForm}
          onChange={(field, value) => setProjectForm((current) => ({ ...current, [field]: value }))}
          onClose={() => setCreateMode(null)}
          onSubmit={handleProjectSubmit}
        />
      ) : null}
    </AppShell>
  );
}
