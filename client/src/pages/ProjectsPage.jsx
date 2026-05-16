import { useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  FolderOpen,
  Layers3,
  Plus,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';

const createMenuItems = ['Neue Abteilung', 'Neues Projekt'];

const initialDepartments = [
  {
    id: 'dept-digital-banking',
    name: 'Digitales Banking',
    lead: 'Lisa Wagner',
    memberCount: 8,
    description: 'Digitale Produkte, Banking-Journeys und Kundenoberflaechen.',
    accent: 'border-[#f3d7de] bg-[#fff4f6]',
    badgeTone: 'bg-[#fff0f2] text-[#b84758]',
  },
  {
    id: 'dept-qa',
    name: 'Qualitaetssicherung',
    lead: 'Tom Becker',
    memberCount: 5,
    description: 'Tests, Freigaben, Regressionen und Produktionsqualitaet.',
    accent: 'border-[#d8e6fb] bg-[#f4f8ff]',
    badgeTone: 'bg-[#edf4ff] text-[#4875c8]',
  },
  {
    id: 'dept-marketing',
    name: 'Marketing und Content',
    lead: 'Sarah Nguyen',
    memberCount: 6,
    description: 'Kampagnen, Content-Produktion und Markenauftritte.',
    accent: 'border-[#d5eee7] bg-[#effbf7]',
    badgeTone: 'bg-[#ecfbf6] text-[#2f7d68]',
  },
  {
    id: 'dept-compliance',
    name: 'Produkt und Compliance',
    lead: 'Anna Becker',
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

function DepartmentCard({ department, projectCount, isActive, onOpen }) {
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

export default function ProjectsPage() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [projects, setProjects] = useState(initialProjects);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0].id);
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
    };

    setDepartments((current) => [nextDepartment, ...current]);
    setSelectedDepartmentId(nextDepartment.id);
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
    setCreateMode(null);
  };

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
              isActive={selectedDepartment?.id === department.id}
              onOpen={setSelectedDepartmentId}
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
              <div className="rounded-2xl border border-[#f0d7db] bg-[#fff7f8] px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#b84758]">Leitung</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{selectedDepartment.lead}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{selectedDepartment.memberCount} Personen im Bereich</p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {!visibleProjects.length ? (
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
