import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getTaskMarker } from '../utils/taskMarkers';
import {
  bankProjects,
  canManageRoles,
  getEffectiveRoleForUser,
  getRoleKindLabel,
  getRoleScopeLabel,
  getVisibleDepartmentsForRole,
  loadAccessConfig,
} from '../data/bankOrganization';

const priorityTone = {
  hoch: 'bg-[#fff1f3] text-[#b84758]',
  mittel: 'bg-[#fff7e8] text-[#b66a24]',
  niedrig: 'bg-[#eefaf4] text-[#2f7d68]',
};

function countTasksForDepartment(departmentId) {
  return bankProjects
    .filter((project) => project.departmentId === departmentId)
    .reduce((sum, project) => sum + project.tasks.length, 0);
}

function DepartmentCard({ department, selected, onSelect }) {
  const projectCount = bankProjects.filter((project) => project.departmentId === department.id).length;
  const taskCount = countTasksForDepartment(department.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(department.id)}
      className={`w-full rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] ${
        selected ? 'border-[#d89aa5] ring-4 ring-[#b84758]/10' : department.accent
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-[#b84758] shadow-sm">
          <Building2 className="h-5 w-5" />
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${department.badgeTone}`}>{department.code}</span>
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-950">{department.name}</h3>
      <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-slate-500">{department.description}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <span className="rounded-2xl bg-white/85 px-3 py-2">
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Lead</span>
          <span className="mt-1 block truncate text-xs font-extrabold text-slate-900">{department.lead}</span>
        </span>
        <span className="rounded-2xl bg-white/85 px-3 py-2">
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Projekte</span>
          <span className="mt-1 block text-xs font-extrabold text-slate-900">{projectCount}</span>
        </span>
        <span className="rounded-2xl bg-white/85 px-3 py-2">
          <span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">Aufgaben</span>
          <span className="mt-1 block text-xs font-extrabold text-slate-900">{taskCount}</span>
        </span>
      </div>
    </button>
  );
}

function ProjectPanel({ project }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-[#fcfcfd] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-black text-slate-950">{project.name}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{project.goal}</p>
        </div>
        <span className="rounded-full bg-[#fff1f3] px-3 py-1 text-xs font-extrabold text-[#b84758]">{project.status}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-slate-500">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
          <UserRound className="h-4 w-4 text-slate-400" />
          {project.owner}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {project.dueDate}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
          <ClipboardList className="h-4 w-4 text-slate-400" />
          {project.tasks.length} Aufgaben
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {project.tasks.map((task) => {
          const marker = getTaskMarker(task);

          return (
            <div
              key={task.id}
              className="relative grid gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white py-3 pl-5 pr-4 md:grid-cols-[1fr_150px_100px] md:items-center"
              title={marker.label}
            >
              <span className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: marker.color }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900">{task.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{task.status}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
                <UserRound className="h-4 w-4 text-slate-400" />
                {task.assignee}
              </span>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ${priorityTone[task.priority] || priorityTone.mittel}`}>
                {task.priority}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [accessConfig, setAccessConfig] = useState(() => loadAccessConfig());
  const effectiveRole = useMemo(() => getEffectiveRoleForUser(user, accessConfig), [accessConfig, user]);
  const visibleDepartments = useMemo(() => getVisibleDepartmentsForRole(effectiveRole), [effectiveRole]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const searchTerm = searchValue.trim().toLowerCase();
  const roleManagerAllowed = canManageRoles(user, accessConfig);
  useEffect(() => {
    let ignore = false;
    const refreshRoles = async () => {
      try {
        const { data } = await api.get('/roles');
        if (!ignore) setAccessConfig(data);
      } catch {
        if (!ignore) setAccessConfig(loadAccessConfig());
      }
    };
    const handleRoleChange = (event) => setAccessConfig(event.detail || loadAccessConfig());

    refreshRoles();
    window.addEventListener('nexttask:roles-change', handleRoleChange);
    return () => {
      ignore = true;
      window.removeEventListener('nexttask:roles-change', handleRoleChange);
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return visibleDepartments;
    return visibleDepartments.filter((department) =>
      [department.name, department.code, department.lead, department.description].join(' ').toLowerCase().includes(searchTerm),
    );
  }, [searchTerm, visibleDepartments]);

  const selectedDepartment = visibleDepartments.find((department) => department.id === selectedDepartmentId) || visibleDepartments[0] || null;
  const selectedProjects = useMemo(() => {
    if (!selectedDepartment) return [];
    const projects = bankProjects.filter((project) => project.departmentId === selectedDepartment.id);
    if (!searchTerm) return projects;
    return projects.filter((project) =>
      [project.name, project.owner, project.status, project.goal, ...project.tasks.map((task) => task.title)].join(' ').toLowerCase().includes(searchTerm),
    );
  }, [searchTerm, selectedDepartment]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm) return [];

    const departmentSuggestions = filteredDepartments.map((department) => ({
      id: `department-${department.id}`,
      type: 'Bereich',
      label: department.name,
      meta: `${department.code} - ${department.lead}`,
      onSelect: () => setSelectedDepartmentId(department.id),
    }));

    const projectSuggestions = visibleDepartments
      .flatMap((department) =>
        bankProjects
          .filter((project) => project.departmentId === department.id)
          .map((project) => ({ ...project, departmentName: department.name })),
      )
      .filter((project) =>
        [project.name, project.owner, project.status, project.goal, ...project.tasks.map((task) => task.title)].join(' ').toLowerCase().includes(searchTerm),
      )
      .map((project) => ({
        id: `project-${project.id}`,
        type: 'Projekt',
        label: project.name,
        meta: `${project.departmentName} - ${project.owner}`,
        onSelect: () => setSelectedDepartmentId(project.departmentId),
      }));

    return [...departmentSuggestions, ...projectSuggestions];
  }, [filteredDepartments, searchTerm, visibleDepartments]);

  const visibleProjectCount = visibleDepartments.reduce(
    (sum, department) => sum + bankProjects.filter((project) => project.departmentId === department.id).length,
    0,
  );
  const visibleTaskCount = visibleDepartments.reduce((sum, department) => sum + countTasksForDepartment(department.id), 0);

  return (
    <AppShell
      activeItem="Abteilungen"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Abteilungen"
      searchValue={searchValue}
      onSearch={setSearchValue}
      searchSuggestions={searchSuggestions}
      createMenuItems={[]}
    >
      <div className="space-y-5 px-4 py-5 lg:px-6 lg:py-6">
        <section className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Bankorganisation</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Abteilungen im Geschäftsbereich OR</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Die Sicht wird aus deiner Rolle berechnet: Admin sieht alles, GBL sieht seinen Geschäftsbereich, Mitarbeiter sehen ihre zugeordneten Abteilungen.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-[#b84758]" />
                {getRoleKindLabel(effectiveRole?.kind)}
              </span>
              {roleManagerAllowed ? (
                <button
                  type="button"
                  onClick={() => navigate('/roles')}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)] transition hover:bg-[#a23d4d]"
                >
                  <LockKeyhole className="h-4 w-4" />
                  Rollen verwalten
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-[#fcfcfd] px-4 py-3">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-slate-400">Sichtbereich</p>
              <p className="mt-2 text-sm font-black text-slate-900">{getRoleScopeLabel(effectiveRole)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#fcfcfd] px-4 py-3">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-slate-400">Sichtbare Projekte</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{visibleProjectCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#fcfcfd] px-4 py-3">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-slate-400">Sichtbare Aufgaben</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{visibleTaskCount}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Abteilungen</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{filteredDepartments.length} sichtbar</h2>
              </div>
              <Users className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {filteredDepartments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  selected={department.id === selectedDepartment?.id}
                  onSelect={setSelectedDepartmentId}
                />
              ))}

              {!filteredDepartments.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
                  Keine Abteilung in deiner aktuellen Sicht gefunden.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            {selectedDepartment ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">{selectedDepartment.code}</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedDepartment.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{selectedDepartment.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
                      <BriefcaseBusiness className="h-4 w-4" />
                      Bereich {selectedDepartment.businessArea}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1f3] px-3 py-2 text-sm font-bold text-[#b84758]">
                      <UserRound className="h-4 w-4" />
                      {selectedDepartment.lead}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {selectedProjects.map((project) => (
                    <ProjectPanel key={project.id} project={project} />
                  ))}

                  {!selectedProjects.length ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-[#b84758]" />
                      <p className="mt-3 text-sm font-bold text-slate-600">Keine Projekte passend zur Suche gefunden.</p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                <LockKeyhole className="mx-auto h-9 w-9 text-[#b84758]" />
                <p className="mt-4 text-lg font-black text-slate-950">Keine Abteilung freigegeben</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Bitte lass dir durch einen Admin eine Rolle mit Abteilungs- oder Geschaeftsbereichs-Sicht zuweisen.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
