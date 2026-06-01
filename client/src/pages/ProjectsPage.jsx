/* eslint-disable react-refresh/only-export-components */
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Filter,
  FolderOpen,
  GripVertical,
  History,
  ListChecks,
  MessageSquareMore,
  MoreHorizontal,
  Paperclip,
  ShieldCheck,
  Star,
  Tag,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { initialTasks as sourceTasks } from './MyTasksPage';

const createMenuItems = ['Neue Abteilung', 'Neues Projekt'];

export const initialDepartments = [
  {
    id: 'dept-digital-banking',
    name: 'Digitales Banking',
    lead: 'Lisa Wagner',
    members: ['Lisa Wagner', 'Markus Klein', 'Anna Becker', 'Elisabeth Bezverkha'],
    memberCount: 8,
    description: 'Digitale Produkte, Banking-Journeys und Kundenoberflaechen.',
    accent: 'border-slate-900 bg-[#fff4f6]',
    badgeTone: 'bg-[#fff0f2] text-[#b84758]',
  },
  {
    id: 'dept-qa',
    name: 'Qualitaetssicherung',
    lead: 'Tom Becker',
    members: ['Tom Becker', 'Elisabeth Bezverkha'],
    memberCount: 5,
    description: 'Tests, Freigaben, Regressionen und Produktionsqualitaet.',
    accent: 'border-slate-900 bg-[#f4f8ff]',
    badgeTone: 'bg-[#edf4ff] text-[#4875c8]',
  },
  {
    id: 'dept-marketing',
    name: 'Marketing und Content',
    lead: 'Sarah Nguyen',
    members: ['Sarah Nguyen', 'Markus Klein'],
    memberCount: 6,
    description: 'Kampagnen, Content-Produktion und Markenauftritte.',
    accent: 'border-slate-900 bg-[#effbf7]',
    badgeTone: 'bg-[#ecfbf6] text-[#2f7d68]',
  },
  {
    id: 'dept-compliance',
    name: 'Produkt und Compliance',
    lead: 'Anna Becker',
    members: ['Anna Becker', 'Lisa Wagner'],
    memberCount: 4,
    description: 'Kontrollpunkte, Freigaben und regulatorische Abstimmungen.',
    accent: 'border-slate-900 bg-[#fff8ef]',
    badgeTone: 'bg-[#fff4e7] text-[#c26a34]',
  },
  {
    id: 'dept-service',
    name: 'Kundenservice',
    lead: 'Nina Hoffmann',
    members: ['Nina Hoffmann', 'Tom Becker', 'Elisabeth Bezverkha'],
    memberCount: 7,
    description: 'Serviceprozesse, Rueckfragen, Eskalationen und Kundenkommunikation.',
    accent: 'border-slate-900 bg-[#f3fbf6]',
    badgeTone: 'bg-[#edf9f1] text-[#3b7f57]',
  },
];

export const initialProjects = [
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
  {
    id: 'proj-7',
    departmentId: 'dept-service',
    name: 'Service Anfrage-Cockpit',
    owner: 'Nina Hoffmann',
    visibility: 'Abteilung',
    status: 'In Arbeit',
    dueDate: '19. Juli 2026',
    summary: 'Zentrale Sicht auf Rueckfragen, Antwortzeiten und Eskalationspfade.',
  },
  {
    id: 'proj-8',
    departmentId: 'dept-service',
    name: 'Kundenfeedback Auswertung',
    owner: 'Elisabeth Bezverkha',
    visibility: 'Persoenlich',
    status: 'Konzept',
    dueDate: '02. August 2026',
    summary: 'Struktur fuer Feedback-Cluster, Massnahmen und wiederkehrende Themen.',
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

const attachmentTypeOptions = ['Word', 'Excel', 'PDF', 'Screenshot', 'Notiz'];
const attachmentSourceOptions = ['OneDrive', 'SharePoint', 'DMS', 'Upload'];
const defaultWorkloadLimit = 5;
const workloadLimits = {
  'Lisa Wagner': 6,
  'Markus Klein': 5,
  'Anna Becker': 5,
  'Tom Becker': 6,
  'Sarah Nguyen': 5,
  'Elisabeth Bezverkha': 4,
  'Nina Hoffmann': 5,
};

export const initialBacklogTasks = [
  {
    id: 'bg-101',
    sourceTaskId: 'my-task-1',
    projectId: 'proj-1',
    title: 'Kontouebersicht fuer mobile Breakpoints pruefen',
    status: 'progress',
    priority: 'hoch',
    assignee: 'Lisa Wagner',
    dueDate: '18. Juni 2026',
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
    tags: ['Compliance', 'Kontrolle'],
    description: 'Pflichtfelder, Nachweise und Vier-Augen-Pruefung fuer Abteilungsfreigaben strukturieren.',
  },
  {
    id: 'bg-501',
    sourceTaskId: 'my-task-3',
    projectId: 'proj-7',
    title: 'Antwortvorlagen fuer Kartenrueckfragen pruefen',
    status: 'progress',
    priority: 'mittel',
    assignee: 'Nina Hoffmann',
    dueDate: '11. Juli 2026',
    tags: ['Service', 'Vorlagen'],
    description: 'Bestehende Antwortvorlagen fuer Kartenrueckfragen auf Verstaendlichkeit und Freigabestand pruefen.',
  },
  {
    id: 'bg-502',
    sourceTaskId: 'my-task-8',
    projectId: 'proj-7',
    title: 'Eskalationsregeln fuer dringende Anliegen sammeln',
    status: 'todo',
    priority: 'hoch',
    assignee: '',
    dueDate: '15. Juli 2026',
    tags: ['Eskalation', 'Offen'],
    description: 'Fuer dringende Servicefaelle fehlen noch eindeutige Eskalationsregeln und eine verantwortliche Person.',
  },
  {
    id: 'bg-503',
    sourceTaskId: 'my-task-6',
    projectId: 'proj-8',
    title: 'Feedback-Cluster fuer App-Bewertungen definieren',
    status: 'review',
    priority: 'niedrig',
    assignee: 'Elisabeth Bezverkha',
    dueDate: '24. Juli 2026',
    tags: ['Feedback'],
    description: 'App-Bewertungen nach wiederkehrenden Themen clustern und fuer die Auswertung vorbereiten.',
  },
];

function DetailBlock({ title, icon, children, action }) {
  const iconNode = createElement(icon, { className: 'h-4 w-4 text-[#c95767]' });
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          {iconNode}
          {title}
        </h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function getSourceTask(task) {
  return sourceTasks.find((candidate) => candidate.id === task.sourceTaskId) || null;
}

function getSourceTaskKey(task) {
  const sourceTask = getSourceTask(task);
  return task.controlId || sourceTask?.compliance?.controlId || task.sourceTaskId || task.id;
}

function getTaskCreatorInitials(task) {
  if (task.creatorInitials) return task.creatorInitials;
  const sourceTask = getSourceTask(task);
  return sourceTask?.assignedBy?.initials || 'NT';
}

function getTaskCreatorName(task) {
  if (task.creatorName) return task.creatorName;
  const sourceTask = getSourceTask(task);
  return sourceTask?.assignedBy?.name || 'NextTask';
}

function getTaskDetailCollections(task) {
  const sourceTask = getSourceTask(task);
  return {
    attachments: task.attachments || sourceTask?.attachments || [],
    comments: task.comments || sourceTask?.comments || [],
    linkedPeople: task.linkedPeople || sourceTask?.linkedPeople || [],
    compliance: task.compliance ||
      sourceTask?.compliance || {
        classification: 'Intern',
        risk: 'Niedrig',
        controlId: getSourceTaskKey(task),
        approval: 'Noch kein Freigabeprozess definiert',
        evidence: 'Noch keine Evidenz hinterlegt',
      },
    auditTrail: task.auditTrail || sourceTask?.auditTrail || [`22. Mai 2026: Backlog-Ticket angelegt.`],
  };
}

function getAssigneeLabel(assignee) {
  return assignee?.trim() || 'Ohne Verantwortlichen';
}

function getTaskFavorites(task) {
  return Array.isArray(task.favoriteBy) ? task.favoriteBy : [];
}

function getFavoriteReturnIndexes(task) {
  return task.favoriteReturnIndexBy && typeof task.favoriteReturnIndexBy === 'object' ? task.favoriteReturnIndexBy : {};
}

function isFavoriteForUser(task, userKey) {
  return Boolean(userKey && getTaskFavorites(task).includes(userKey));
}

function getWorkloadLimit(person) {
  return workloadLimits[person] || defaultWorkloadLimit;
}

function getWorkloadTone(remaining, percent) {
  if (remaining <= 0) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (percent >= 75) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function toDateInputValue(displayDate) {
  if (!displayDate) return '';
  const monthMap = {
    Januar: '01',
    Februar: '02',
    Maerz: '03',
    April: '04',
    Mai: '05',
    Juni: '06',
    Juli: '07',
    August: '08',
    September: '09',
    Oktober: '10',
    November: '11',
    Dezember: '12',
  };
  const match = displayDate.match(/^(\d{2})\. ([A-Za-z]+) (\d{4})$/);
  if (!match) return '';
  const [, day, monthName, year] = match;
  const month = monthMap[monthName];
  return month ? `${year}-${month}-${day}` : '';
}

function toDisplayDate(inputDate) {
  if (!inputDate) return '';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${inputDate}T00:00:00`));
}

function getFilterLabel(filterValue) {
  if (filterValue === 'unassigned') return 'Ohne Verantwortlichen';
  if (filterValue.startsWith('person:')) return filterValue.replace('person:', '');
  if (filterValue.startsWith('creator:')) return `Ersteller ${filterValue.replace('creator:', '')}`;
  if (filterValue.startsWith('status:')) return backlogStatusMeta[filterValue.replace('status:', '')]?.label || filterValue;
  if (filterValue.startsWith('priority:')) return `Prio ${filterValue.replace('priority:', '')}`;
  return filterValue;
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

function ProjectCard({ project, backlogCount, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[#e6b8c0] hover:shadow-[0_16px_34px_rgba(136,54,66,0.10)]"
    >
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0f2] px-3 py-1 text-[#b84758]">
          <ListChecks className="h-3.5 w-3.5" />
          {backlogCount} Aufgaben
        </span>
      </div>
    </button>
  );
}

function BacklogTaskRow({ task, project, isActive, isFavorite, onOpen, onToggleFavorite, dragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: dragDisabled,
  });
  const status = backlogStatusMeta[task.status] || backlogStatusMeta.todo;
  const taskKey = getSourceTaskKey(task);
  const creatorInitials = getTaskCreatorInitials(task);
  const creatorName = getTaskCreatorName(task);
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen(task.id);
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`grid w-full grid-cols-[36px_36px_minmax(0,1fr)_36px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-[#fff1f3] lg:grid-cols-[36px_36px_minmax(94px,0.6fr)_minmax(0,2.4fr)_72px_120px_88px_minmax(130px,0.9fr)_36px] ${
        isActive ? 'bg-[#fff1f3]' : 'bg-white'
      } ${isDragging ? 'relative z-10 opacity-70 shadow-[0_18px_34px_rgba(15,23,42,0.16)]' : ''}`}
    >
      <span
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition ${
          dragDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing'
        }`}
        title={dragDisabled ? 'Sortieren ist bei aktiver Suche oder Filterung deaktiviert' : 'Ticket verschieben'}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(task.id);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          onToggleFavorite(task.id);
        }}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition ${
          isFavorite
            ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
            : 'text-slate-300 hover:bg-slate-100 hover:text-amber-500'
        }`}
        title={isFavorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'}
      >
        <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <span className="hidden font-bold text-slate-500 lg:block">{taskKey}</span>
      <span className="min-w-0">
        <span className="mb-1 block font-bold leading-5 text-slate-900 lg:hidden">{taskKey}</span>
        <span className="block whitespace-normal break-words font-bold leading-5 text-slate-900">{task.title}</span>
        <span className="mt-1 block whitespace-normal break-words text-xs font-semibold text-slate-400">{project?.name || 'Projekt'}</span>
      </span>
      <span
        className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#f0edff] text-[11px] font-extrabold text-[#6d5df6] lg:inline-flex"
        title={`Erstellt von ${creatorName}`}
      >
        {creatorInitials}
      </span>
      <span className={`hidden w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold lg:inline-flex ${status.tone}`}>
        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
        {status.label}
      </span>
      <span className={`hidden w-max rounded-full px-2.5 py-1 text-xs font-bold lg:inline-flex ${priorityMeta[task.priority] || priorityMeta.mittel}`}>
        {task.priority}
      </span>
      <span className="hidden min-w-0 items-center gap-2 text-xs font-bold text-slate-600 lg:inline-flex">
        <UserRound className="h-3.5 w-3.5 flex-none text-slate-400" />
        <span className="whitespace-normal break-words">{getAssigneeLabel(task.assignee)}</span>
      </span>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400">
        <MoreHorizontal className="h-4 w-4" />
      </span>
    </div>
  );
}

function BacklogProjectGroup({ project, tasks, selectedTaskId, favoriteUserKey, onOpenTask, onToggleFavorite, dragDisabled }) {
  const completed = tasks.filter((task) => task.status === 'done').length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-extrabold text-slate-950">{project.name}</h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{tasks.length} Aufgaben</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">{project.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
          <span className="rounded-full bg-white px-2.5 py-1">{completed} erledigt</span>
        </div>
      </div>

      <div className="hidden w-full grid-cols-[36px_36px_minmax(94px,0.6fr)_minmax(0,2.4fr)_72px_120px_88px_minmax(130px,0.9fr)_36px] gap-3 bg-[#fff1f3] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#b84758] lg:grid">
        <span />
        <span />
        <span>Key</span>
        <span>Aufgabe</span>
        <span>Erstellt</span>
        <span>Status</span>
        <span>Prio</span>
        <span>Verantwortlich</span>
        <span />
      </div>

      <div>
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <BacklogTaskRow
              key={task.id}
              task={task}
              project={project}
              isActive={selectedTaskId === task.id}
              isFavorite={isFavoriteForUser(task, favoriteUserKey)}
              onOpen={onOpenTask}
              onToggleFavorite={onToggleFavorite}
              dragDisabled={dragDisabled}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

function createBacklogTaskForm(task) {
  const { compliance } = getTaskDetailCollections(task);
  return {
    controlId: getSourceTaskKey(task),
    creatorInitials: getTaskCreatorInitials(task),
    creatorName: getTaskCreatorName(task),
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    status: task.status,
    priority: task.priority,
    dueDateValue: toDateInputValue(task.dueDate),
    assignee: task.assignee,
    tags: task.tags.join(', '),
    classification: compliance.classification,
    risk: compliance.risk,
    approval: compliance.approval,
    evidence: compliance.evidence,
  };
}

function BacklogDetailPanel({ task, projects, assignees, assigneeWorkloads, onSave, onClose }) {
  const [form, setForm] = useState(() => (task ? createBacklogTaskForm(task) : null));
  const [commentDraft, setCommentDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [personDraft, setPersonDraft] = useState(assignees[0] || '');
  const [attachmentType, setAttachmentType] = useState(attachmentTypeOptions[0]);
  const [attachmentSource, setAttachmentSource] = useState(attachmentSourceOptions[0]);

  if (!task) {
    return null;
  }

  if (!form) return null;

  const status = backlogStatusMeta[task.status] || backlogStatusMeta.todo;
  const taskKey = getSourceTaskKey(task);
  const { attachments, comments, linkedPeople, auditTrail } = getTaskDetailCollections(task);
  const selectedAssigneeWorkload = assigneeWorkloads.get(form.assignee);
  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const updateTask = (updates, auditText) => {
    onSave(task.id, {
      ...updates,
      auditTrail: auditText ? [`22. Mai 2026: ${auditText}`, ...auditTrail] : auditTrail,
    });
  };
  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(task.id, {
      controlId: form.controlId.trim() || task.id,
      creatorInitials: form.creatorInitials.trim() || 'NT',
      creatorName: form.creatorName.trim() || 'NextTask',
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: form.projectId,
      status: form.status,
      priority: form.priority,
      dueDate: toDisplayDate(form.dueDateValue) || task.dueDate,
      assignee: form.assignee,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      compliance: {
        classification: form.classification,
        risk: form.risk,
        controlId: form.controlId.trim() || task.id,
        approval: form.approval.trim(),
        evidence: form.evidence.trim(),
      },
      auditTrail: [`22. Mai 2026: Ticketdetails aktualisiert.`, ...auditTrail],
    });
  };
  const handleTagAdd = () => {
    const nextTag = tagDraft.trim();
    if (!nextTag || task.tags.includes(nextTag)) return;
    const nextTags = [...task.tags, nextTag];
    setTagDraft('');
    setForm((current) => ({ ...current, tags: nextTags.join(', ') }));
    updateTask({ tags: nextTags }, `Tag "${nextTag}" hinzugefuegt.`);
  };
  const handleTagRemove = (tagToRemove) => {
    const nextTags = task.tags.filter((tag) => tag !== tagToRemove);
    setForm((current) => ({ ...current, tags: nextTags.join(', ') }));
    updateTask({ tags: nextTags }, `Tag "${tagToRemove}" entfernt.`);
  };
  const handlePersonAdd = () => {
    if (!personDraft || linkedPeople.includes(personDraft)) return;
    updateTask({ linkedPeople: [...linkedPeople, personDraft] }, `Mitarbeitende Person "${personDraft}" verlinkt.`);
  };
  const handlePersonRemove = (personToRemove) => {
    updateTask(
      { linkedPeople: linkedPeople.filter((person) => person !== personToRemove) },
      `Mitarbeitende Person "${personToRemove}" entfernt.`,
    );
  };
  const handleCommentSubmit = () => {
    const text = commentDraft.trim();
    if (!text) return;
    setCommentDraft('');
    updateTask(
      {
        comments: [
          ...comments,
          {
            id: `comment-${comments.length + 1}`,
            author: form.creatorName || 'NextTask',
            time: 'gerade eben',
            text,
          },
        ],
      },
      'Kommentar hinzugefuegt.',
    );
  };
  const handleMentionInsert = (person) => {
    setCommentDraft((current) => `${current}${current ? ' ' : ''}@${person} `);
  };
  const handleAttachmentFilesAdd = (files) => {
    const nextFiles = Array.from(files || []);
    if (!nextFiles.length) return;
    updateTask(
      {
        attachments: [
          ...attachments,
          ...nextFiles.map((file, index) => ({
            id: `attachment-${attachments.length + index + 1}-${file.name}`,
            name: file.name,
            type: attachmentType,
            source: attachmentSource,
            owner: form.assignee || form.creatorName || 'NextTask',
          })),
        ],
      },
      `${nextFiles.length} Datei(en) als Evidenz verknuepft.`,
    );
  };
  const handleAttachmentRemove = (attachmentId) => {
    updateTask(
      { attachments: attachments.filter((attachment) => attachment.id !== attachmentId) },
      'Eine Evidenzdatei entfernt.',
    );
  };

  return (
    <aside
      onMouseDown={(event) => event.stopPropagation()}
      className="max-h-[calc(100vh-48px)] w-[min(1180px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
    >
      <div className="sticky -top-5 z-10 border-b border-slate-200 bg-white/95 pb-4 pt-1 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">{taskKey}</p>
            <h3 className="mt-2 text-xl font-extrabold leading-tight text-slate-950">Ticketdetails bearbeiten</h3>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{task.title}</p>
          </div>
          <div className="flex flex-none flex-col items-end gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.tone}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="h-10 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)] transition hover:bg-[#b84758]"
              >
                Aenderungen speichern
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Ticketdetails schliessen"
                title="Schliessen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <DetailBlock title="Kerninfos" icon={FileText}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Titel
              <input
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Projekt
              <select
                value={form.projectId}
                onChange={(event) => handleChange('projectId', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {projects.map((candidateProject) => (
                  <option key={candidateProject.id} value={candidateProject.id}>
                    {candidateProject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Status
              <select
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {Object.entries(backlogStatusMeta).map(([statusValue, meta]) => (
                  <option key={statusValue} value={statusValue}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Prioritaet
              <select
                value={form.priority}
                onChange={(event) => handleChange('priority', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                {Object.keys(priorityMeta).map((priorityValue) => (
                  <option key={priorityValue} value={priorityValue}>
                    {priorityValue}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Faelligkeit
              <input
                type="date"
                value={form.dueDateValue}
                onChange={(event) => handleChange('dueDateValue', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Zustaendige Person
              <select
                value={form.assignee}
                onChange={(event) => handleChange('assignee', event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              >
                <option value="">Ohne Verantwortlichen</option>
                {assignees.map((assignee) => {
                  const workload = assigneeWorkloads.get(assignee);
                  const disabled = workload?.remaining <= 0 && assignee !== form.assignee;
                  return (
                    <option key={assignee} value={assignee} disabled={disabled}>
                      {assignee} ({workload?.activeCount || 0}/{workload?.limit || getWorkloadLimit(assignee)}, {workload?.remaining || 0} frei)
                    </option>
                  );
                })}
              </select>
              {selectedAssigneeWorkload ? (
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${selectedAssigneeWorkload.tone}`}>
                  {selectedAssigneeWorkload.remaining} von {selectedAssigneeWorkload.limit} Aufgaben frei
                </span>
              ) : null}
            </label>

          </div>
        </DetailBlock>

        <DetailBlock title="Beschreibung" icon={FileText}>
          <textarea
            value={form.description}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
          />
        </DetailBlock>

        <DetailBlock title="Organisation" icon={Tag}>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-bold text-[#b64454]"
                  >
                    {tag} x
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  placeholder="Neues Tag"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
                <button type="button" onClick={handleTagAdd} className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white">
                  Hinzufuegen
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Verlinkte Mitarbeitende</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {linkedPeople.map((person) => (
                  <button
                    key={person}
                    type="button"
                    onClick={() => handlePersonRemove(person)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700"
                  >
                    @{person} x
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <select
                  value={personDraft}
                  onChange={(event) => setPersonDraft(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                >
                  {assignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handlePersonAdd} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white">
                  <UserPlus className="h-4 w-4" />
                  Verlinken
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-bold text-slate-700">
                Erstellt von
                <input
                  value={form.creatorName}
                  onChange={(event) => handleChange('creatorName', event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Initialen
                <input
                  value={form.creatorInitials}
                  onChange={(event) => handleChange('creatorInitials', event.target.value)}
                  maxLength={4}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
                />
              </label>
            </div>
          </div>
        </DetailBlock>

        <DetailBlock
          title="Dateien und Evidenz"
          icon={Paperclip}
          action={<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">revisionssicher dokumentierbar</span>}
        >
          <div className="space-y-3">
            {attachments.length ? (
              attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{attachment.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {attachment.type} - {attachment.source} - Owner: {attachment.owner}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleAttachmentRemove(attachment.id)} className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
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
              onChange={(event) => setAttachmentType(event.target.value)}
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
              onChange={(event) => setAttachmentSource(event.target.value)}
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
                  handleAttachmentFilesAdd(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
        </DetailBlock>

        <DetailBlock title="Kommentare und Mentions" icon={MessageSquareMore}>
          <div className="space-y-3">
            {comments.length ? (
              comments.map((comment) => (
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
            {assignees.map((assignee) => (
              <button
                key={assignee}
                type="button"
                onClick={() => handleMentionInsert(assignee)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:text-[#b64454]"
              >
                @{assignee}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Kommentar oder Rueckfrage eingeben"
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
            />
            <button type="button" onClick={handleCommentSubmit} className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">
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
                onChange={(event) => handleChange('classification', event.target.value)}
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
                onChange={(event) => handleChange('risk', event.target.value)}
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
                onChange={(event) => handleChange('controlId', event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Freigabeprozess
              <input
                value={form.approval}
                onChange={(event) => handleChange('approval', event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Evidenzhinweis
              <textarea
                value={form.evidence}
                onChange={(event) => handleChange('evidence', event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#c95767] focus:ring-4 focus:ring-[#c95767]/10"
              />
            </label>
          </div>
        </DetailBlock>

        <DetailBlock title="Audit-Spur" icon={History}>
          <div className="space-y-2">
            {auditTrail.map((entry) => (
              <div key={entry} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                {entry}
              </div>
            ))}
          </div>
        </DetailBlock>
      </div>
    </aside>
  );
}

export default function ProjectsPage() {
  const filterMenuRef = useRef(null);
  const { user } = useAuth();
  const favoriteUserKey = user?.id || user?.email || user?.name || 'guest';
  const favoriteUserLabel = user?.name || user?.email || 'Gast';
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const [departments, setDepartments] = useState(initialDepartments);
  const [projects, setProjects] = useState(initialProjects);
  const [backlogTasks, setBacklogTasks] = useState(initialBacklogTasks);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0].id);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [viewMode, setViewMode] = useState('projects');
  const [selectedBacklogTaskId, setSelectedBacklogTaskId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeBacklogFilters, setActiveBacklogFilters] = useState([]);
  const [draftBacklogFilters, setDraftBacklogFilters] = useState([]);
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

  const departmentMembers = useMemo(() => selectedDepartment?.members || [], [selectedDepartment]);

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

  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId) || null;
  const backlogProjectIds = useMemo(
    () => new Set(selectedProject ? [selectedProject.id] : visibleProjects.map((project) => project.id)),
    [selectedProject, visibleProjects],
  );

  const departmentCreators = useMemo(() => {
    const creatorMap = new Map();
    backlogTasks.forEach((task) => {
      if (!backlogProjectIds.has(task.projectId)) return;
      const initials = getTaskCreatorInitials(task);
      creatorMap.set(initials, getTaskCreatorName(task));
    });
    return Array.from(creatorMap, ([initials, name]) => ({ initials, name }));
  }, [backlogProjectIds, backlogTasks]);

  const assigneeWorkloads = useMemo(() => {
    const people = new Set(departmentMembers);
    const workloadTasks = selectedProject
      ? backlogTasks.filter((task) => task.projectId === selectedProject.id)
      : backlogTasks;

    workloadTasks.forEach((task) => {
      if (task.assignee.trim()) people.add(task.assignee);
    });

    return new Map(
      Array.from(people).map((person) => {
        const limit = getWorkloadLimit(person);
        const activeCount = workloadTasks.filter((task) => task.assignee === person && task.status !== 'done').length;
        const remaining = Math.max(limit - activeCount, 0);
        const percent = Math.min(Math.round((activeCount / limit) * 100), 100);
        return [
          person,
          {
            activeCount,
            limit,
            remaining,
            percent,
            tone: getWorkloadTone(remaining, percent),
          },
        ];
      }),
    );
  }, [backlogTasks, departmentMembers, selectedProject]);

  const visibleBacklogTasks = useMemo(
    () => {
      const filteredTasks = backlogTasks.filter((task) => {
        if (!backlogProjectIds.has(task.projectId)) return false;
        if (activeBacklogFilters.length) {
          const matchesFilter = activeBacklogFilters.some((filterValue) => {
            if (filterValue === 'unassigned') return !task.assignee.trim();
            if (filterValue.startsWith('person:')) return task.assignee === filterValue.replace('person:', '');
            if (filterValue.startsWith('creator:')) return getTaskCreatorInitials(task) === filterValue.replace('creator:', '');
            if (filterValue.startsWith('status:')) return task.status === filterValue.replace('status:', '');
            if (filterValue.startsWith('priority:')) return task.priority === filterValue.replace('priority:', '');
            return true;
          });
          if (!matchesFilter) return false;
        }
        if (!normalizedSearch) return true;
        const project = projects.find((candidate) => candidate.id === task.projectId);
        return (
          task.title.toLowerCase().includes(normalizedSearch) ||
          getSourceTaskKey(task).toLowerCase().includes(normalizedSearch) ||
          getAssigneeLabel(task.assignee).toLowerCase().includes(normalizedSearch) ||
          task.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ||
          project?.name.toLowerCase().includes(normalizedSearch)
        );
      });

      return [...filteredTasks].sort((firstTask, secondTask) => {
        const firstFavorite = isFavoriteForUser(firstTask, favoriteUserKey);
        const secondFavorite = isFavoriteForUser(secondTask, favoriteUserKey);
        if (firstFavorite === secondFavorite) return 0;
        return firstFavorite ? -1 : 1;
      });
    },
    [activeBacklogFilters, backlogProjectIds, backlogTasks, favoriteUserKey, normalizedSearch, projects],
  );

  const selectedBacklogTask = visibleBacklogTasks.find((task) => task.id === selectedBacklogTaskId) || null;
  const backlogDragDisabled = Boolean(normalizedSearch || activeBacklogFilters.length);

  const handleDepartmentOpen = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setSelectedProjectId(null);
    setViewMode('projects');
    setFilterOpen(false);
    setActiveBacklogFilters([]);
    setDraftBacklogFilters([]);
    setSelectedBacklogTaskId(null);
  };

  const handleProjectOpen = (projectId) => {
    setSelectedProjectId(projectId);
    setViewMode('backlog');
    setFilterOpen(false);
    setActiveBacklogFilters([]);
    setDraftBacklogFilters([]);
    setSelectedBacklogTaskId(null);
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
      accent: 'border-slate-900 bg-[#fff4f6]',
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
    setSelectedProjectId(null);
    setViewMode('projects');
    setCreateMode(null);
  };

  const handleBacklogTaskOpen = (taskId) => {
    setSelectedBacklogTaskId(taskId);
  };

  const handleBacklogTaskSave = (taskId, updates) => {
    setBacklogTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    );
    if (updates.projectId && updates.projectId !== selectedProjectId) {
      setSelectedProjectId(updates.projectId);
    }
  };

  const handleToggleFavorite = (taskId) => {
    setBacklogTasks((current) => {
      const targetTask = current.find((task) => task.id === taskId);
      if (!targetTask) return current;

      const projectTasks = current.filter((task) => task.projectId === targetTask.projectId);
      const currentProjectIndex = projectTasks.findIndex((task) => task.id === taskId);
      if (currentProjectIndex === -1) return current;

      const currentFavorites = getTaskFavorites(targetTask);
      const currentReturnIndexes = getFavoriteReturnIndexes(targetTask);
      const isCurrentlyFavorite = currentFavorites.includes(favoriteUserKey);
      const nextFavorites = isCurrentlyFavorite
        ? currentFavorites.filter((personKey) => personKey !== favoriteUserKey)
        : [...currentFavorites, favoriteUserKey];
      const nextReturnIndexes = { ...currentReturnIndexes };

      if (isCurrentlyFavorite) {
        delete nextReturnIndexes[favoriteUserKey];
      } else {
        nextReturnIndexes[favoriteUserKey] = currentProjectIndex;
      }

      const nextTasks = current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              favoriteBy: nextFavorites,
              favoriteReturnIndexBy: nextReturnIndexes,
            }
          : task,
      );
      const updatedTarget = nextTasks.find((task) => task.id === taskId);
      if (!updatedTarget) return nextTasks;

      const projectTasksWithoutTarget = projectTasks.filter((task) => task.id !== taskId);
      let reorderedProjectTasks;

      if (isCurrentlyFavorite) {
        const restoreIndex = Math.max(
          0,
          Math.min(currentReturnIndexes[favoriteUserKey] ?? currentProjectIndex, projectTasksWithoutTarget.length),
        );
        reorderedProjectTasks = [
          ...projectTasksWithoutTarget.slice(0, restoreIndex),
          updatedTarget,
          ...projectTasksWithoutTarget.slice(restoreIndex),
        ];
      } else {
        const insertIndex = projectTasksWithoutTarget.findIndex((task) => !isFavoriteForUser(task, favoriteUserKey));
        const nextIndex = insertIndex === -1 ? projectTasksWithoutTarget.length : insertIndex;
        reorderedProjectTasks = [
          ...projectTasksWithoutTarget.slice(0, nextIndex),
          updatedTarget,
          ...projectTasksWithoutTarget.slice(nextIndex),
        ];
      }

      let nextProjectTaskIndex = 0;
      return nextTasks.map((task) => {
        if (task.projectId !== targetTask.projectId) return task;
        const nextTask = reorderedProjectTasks[nextProjectTaskIndex];
        nextProjectTaskIndex += 1;
        return nextTask;
      });
    });
  };

  const handleBacklogDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setBacklogTasks((current) => {
      const activeTask = current.find((task) => task.id === activeId);
      const overTask = current.find((task) => task.id === overId);

      if (!activeTask || !overTask || activeTask.projectId !== overTask.projectId) return current;

      const projectTasks = current.filter((task) => task.projectId === activeTask.projectId);
      const oldIndex = projectTasks.findIndex((task) => task.id === activeId);
      const newIndex = projectTasks.findIndex((task) => task.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return current;

      const reorderedProjectTasks = arrayMove(projectTasks, oldIndex, newIndex);
      let nextProjectTaskIndex = 0;

      return current.map((task) => {
        if (task.projectId !== activeTask.projectId) return task;
        const nextTask = reorderedProjectTasks[nextProjectTaskIndex];
        nextProjectTaskIndex += 1;
        return nextTask;
      });
    });
  };

  const handleFilterMenuOpen = () => {
    setDraftBacklogFilters(activeBacklogFilters);
    setFilterOpen((current) => !current);
  };

  const toggleDraftFilter = (filterValue) => {
    setDraftBacklogFilters((current) =>
      current.includes(filterValue) ? current.filter((value) => value !== filterValue) : [...current, filterValue],
    );
  };

  const removeActiveFilter = (filterValue) => {
    setActiveBacklogFilters((current) => current.filter((value) => value !== filterValue));
    setDraftBacklogFilters((current) => current.filter((value) => value !== filterValue));
  };

  const handleFilterSave = () => {
    setActiveBacklogFilters(draftBacklogFilters);
    setFilterOpen(false);
  };

  const handleFilterDiscard = () => {
    setDraftBacklogFilters(activeBacklogFilters);
    setFilterOpen(false);
  };

  useEffect(() => {
    if (!filterOpen) return undefined;

    const handlePointerDown = (event) => {
      if (filterMenuRef.current?.contains(event.target)) return;
      setDraftBacklogFilters(activeBacklogFilters);
      setFilterOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [activeBacklogFilters, filterOpen]);

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
        {viewMode === 'projects' ? (
          <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/70 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
            <div className="flex min-w-max gap-4 pb-1">
              {visibleDepartments.map((department) => (
                <div key={department.id} className="w-[300px] flex-none xl:w-[320px]">
                  <DepartmentCard
                    department={department}
                    projectCount={projects.filter((project) => project.departmentId === department.id).length}
                    backlogCount={backlogTasks.filter((task) => {
                      const project = projects.find((candidate) => candidate.id === task.projectId);
                      return project?.departmentId === department.id;
                    }).length}
                    isActive={selectedDepartment?.id === department.id}
                    onOpen={handleDepartmentOpen}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className={`rounded-3xl border border-[#e6b8c0] bg-white p-5 shadow-[0_16px_40px_rgba(136,54,66,0.08)] ${viewMode === 'backlog' ? 'min-h-[calc(100vh-150px)]' : ''}`}>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#b84758]">
                {selectedDepartment ? selectedDepartment.name : 'Keine Abteilung'}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                {selectedDepartment
                  ? viewMode === 'backlog' && selectedProject
                    ? `Backlog: ${selectedProject.name}`
                    : 'Projekte der Abteilung'
                  : 'Keine Projekte sichtbar'}
              </h2>
              {selectedDepartment ? (
                <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">{selectedDepartment.description}</p>
              ) : null}
            </div>

            {selectedDepartment && viewMode === 'backlog' ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpen(false);
                    setViewMode('projects');
                    setSelectedProjectId(null);
                    setSelectedBacklogTaskId(null);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#c95767] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(201,87,103,0.22)] transition hover:bg-[#b84758]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zurueck zu Abteilungen und Projekten
                </button>
              </div>
            ) : null}
          </div>

          {viewMode === 'backlog' && selectedProject && departmentMembers.length ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Auslastungsgrenzen</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Aktive Aufgaben je Person in diesem Projekt und verbleibende Kapazitaet.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">{departmentMembers.length} Personen</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {departmentMembers.map((person) => {
                  const workload = assigneeWorkloads.get(person);
                  return (
                    <div key={person} className="rounded-2xl border border-white bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-extrabold text-slate-900">{person}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${workload?.tone}`}>
                          {workload?.remaining || 0} frei
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#c95767]" style={{ width: `${workload?.percent || 0}%` }} />
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-500">
                        {workload?.activeCount || 0} / {workload?.limit || getWorkloadLimit(person)} Aufgaben belegt
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {viewMode === 'projects' ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleProjects.map((project) => {
                const projectBacklogCount = backlogTasks.filter((task) => task.projectId === project.id).length;
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    backlogCount={projectBacklogCount}
                    onOpen={handleProjectOpen}
                  />
                );
              })}
            </div>
          ) : null}

          {viewMode === 'backlog' ? (
            <div className="mt-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">
                    {visibleBacklogTasks.length} Aufgaben im Backlog
                    <span className="ml-2 text-xs font-semibold text-slate-400">
                      Favoriten fuer {favoriteUserLabel} stehen oben.
                    </span>
                  </p>
                  <div ref={filterMenuRef} className="relative flex flex-wrap items-center justify-end gap-2">
                    {activeBacklogFilters.map((filterValue) => (
                      <button
                        key={filterValue}
                        type="button"
                        onClick={() => removeActiveFilter(filterValue)}
                        className="group inline-flex h-9 items-center gap-2 rounded-full border border-[#f0d7db] bg-[#fff7f8] px-3 text-xs font-bold text-[#a23d4d] transition hover:border-[#d89aa5] hover:bg-[#fff1f3]"
                        title={`${getFilterLabel(filterValue)} entfernen`}
                      >
                        <span>{getFilterLabel(filterValue)}</span>
                        <X className="hidden h-3.5 w-3.5 group-hover:block" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleFilterMenuOpen}
                      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
                        activeBacklogFilters.length
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
                        <div className="max-h-72 overflow-y-auto pr-1">
                          <button
                            type="button"
                            onClick={() => toggleDraftFilter('unassigned')}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                              draftBacklogFilters.includes('unassigned') ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Ohne Verantwortlichen
                            {draftBacklogFilters.includes('unassigned') ? <CheckCircle2 className="h-4 w-4" /> : null}
                          </button>
                        {departmentMembers.length ? (
                          <>
                            <div className="my-1 border-t border-slate-100" />
                              <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Personen</p>
                              {departmentMembers.map((member) => {
                                const value = `person:${member}`;
                                return (
                                  <button
                                    key={member}
                                    type="button"
                                    onClick={() => toggleDraftFilter(value)}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                      draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {member}
                                    {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4" /> : null}
                                  </button>
                                );
                            })}
                          </>
                        ) : null}
                          {departmentCreators.length ? (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Ersteller</p>
                              {departmentCreators.map((creator) => {
                                const value = `creator:${creator.initials}`;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => toggleDraftFilter(value)}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                      draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#f0edff] text-[10px] font-extrabold text-[#6d5df6]">
                                        {creator.initials}
                                      </span>
                                      <span className="truncate">{creator.name}</span>
                                    </span>
                                    {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4 flex-none" /> : null}
                                  </button>
                                );
                              })}
                            </>
                          ) : null}
                          <div className="my-1 border-t border-slate-100" />
                          <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Status</p>
                          {Object.entries(backlogStatusMeta).map(([statusValue, meta]) => {
                            const value = `status:${statusValue}`;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleDraftFilter(value)}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                  draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {meta.label}
                                {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4" /> : null}
                              </button>
                            );
                          })}
                          <div className="my-1 border-t border-slate-100" />
                          <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Prioritaet</p>
                          {Object.keys(priorityMeta).map((priorityValue) => {
                            const value = `priority:${priorityValue}`;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleDraftFilter(value)}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold transition ${
                                  draftBacklogFilters.includes(value) ? 'bg-[#fff1f3] text-[#a23d4d]' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                Prio {priorityValue}
                                {draftBacklogFilters.includes(value) ? <CheckCircle2 className="h-4 w-4" /> : null}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            onClick={handleFilterDiscard}
                            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                          >
                            Verwerfen
                          </button>
                          <button
                            type="button"
                            onClick={handleFilterSave}
                            className="h-10 rounded-xl bg-[#c95767] px-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(201,87,103,0.18)] transition hover:bg-[#b84758]"
                          >
                            Speichern
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {backlogDragDisabled ? (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    Sortieren ist pausiert, solange Suche oder Filter aktiv sind.
                  </p>
                ) : null}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBacklogDragEnd}>
                  {visibleProjects.map((project) => {
                    const projectTasks = visibleBacklogTasks.filter((task) => task.projectId === project.id);
                    if (!projectTasks.length) return null;
                    return (
                      <BacklogProjectGroup
                        key={project.id}
                        project={project}
                        tasks={projectTasks}
                        selectedTaskId={selectedBacklogTask?.id}
                        favoriteUserKey={favoriteUserKey}
                        onOpenTask={handleBacklogTaskOpen}
                        onToggleFavorite={handleToggleFavorite}
                        dragDisabled={backlogDragDisabled}
                      />
                    );
                  })}
                </DndContext>

                {!visibleBacklogTasks.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <ListChecks className="mx-auto h-8 w-8 text-[#b84758]" />
                    <p className="mt-4 text-base font-bold text-slate-900">Noch keine Aufgaben im Backlog</p>
                    <p className="mt-2 text-sm font-medium text-slate-500">Fuer dieses Projekt wurden noch keine Backlog-Aufgaben angelegt.</p>
                  </div>
                ) : null}
              </div>
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

      {selectedBacklogTask ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
          onMouseDown={() => setSelectedBacklogTaskId(null)}
          role="presentation"
        >
          <BacklogDetailPanel
            key={selectedBacklogTask.id}
            task={selectedBacklogTask}
            projects={visibleProjects}
            assignees={departmentMembers}
            assigneeWorkloads={assigneeWorkloads}
            onSave={handleBacklogTaskSave}
            onClose={() => setSelectedBacklogTaskId(null)}
          />
        </div>
      ) : null}

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
