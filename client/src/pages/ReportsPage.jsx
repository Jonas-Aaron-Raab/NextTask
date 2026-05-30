import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  FolderKanban,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialTasks } from './MyTasksPage';
import { initialBacklogTasks, initialDepartments, initialProjects } from './ProjectsPage';

const periods = ['Diese Woche', 'Dieser Monat', 'Dieses Jahr'];

const taskDepartmentMap = {
  'Website Relaunch': 'Digitales Banking',
  'Sales Deck': 'Digitales Banking',
  'NextTask UI': 'Digitales Banking',
  'Shop Optimierung': 'Qualitaetssicherung',
  'Content Sprint': 'Marketing und Content',
  'Sparkasse Kampagne': 'Marketing und Content',
  'CRM Automation': 'Kundenservice',
};

const progressWeights = {
  todo: 18,
  progress: 58,
  review: 84,
  done: 100,
};

function getProjectProgress(tasks, projectStatus) {
  if (!tasks.length) {
    return projectStatus === 'Konzept' ? 24 : projectStatus === 'In Planung' ? 38 : 52;
  }

  const sum = tasks.reduce((total, task) => total + (progressWeights[task.status] || 0), 0);
  return Math.round(sum / tasks.length);
}

function getSignal(progress, projectStatus) {
  if (projectStatus === 'Konzept' || progress < 45) {
    return { label: 'Rot', tone: 'bg-[#fff0f2] text-[#b84758]' };
  }

  if (projectStatus === 'Review' || projectStatus === 'In Planung' || progress < 72) {
    return { label: 'Gelb', tone: 'bg-[#fff6e8] text-[#b76c12]' };
  }

  return { label: 'Gruen', tone: 'bg-[#eefaf4] text-[#1f7a4f]' };
}

function DonutChart({ segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const stops = [];
  let offset = 0;

  segments.forEach((segment) => {
    const start = offset;
    const end = offset + segment.percent;
    stops.push(`${segment.color} ${start}% ${end}%`);
    offset = end;
  });

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
      <div className="absolute inset-[18px] rounded-full bg-white" />
      <div className="relative text-center">
        <p className="text-4xl font-extrabold tracking-tight text-slate-950">{total}</p>
        <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">Aufgaben</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [selectedProject, setSelectedProject] = useState('Alle Projekte');
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartments[0]?.name || '');
  const [selectedLoadDepartment, setSelectedLoadDepartment] = useState(initialDepartments[0]?.name || '');
  const [activeProjectId, setActiveProjectId] = useState('');

  const departmentById = useMemo(
    () => Object.fromEntries(initialDepartments.map((department) => [department.id, department])),
    [],
  );

  const departmentOptions = useMemo(() => initialDepartments.map((department) => department.name), []);

  const departmentTasks = useMemo(() => {
    return initialTasks.filter((task) => taskDepartmentMap[task.project] === selectedDepartment);
  }, [selectedDepartment]);

  const taskMetrics = useMemo(() => {
    const sourceTasks = departmentTasks.length ? departmentTasks : initialTasks;
    const done = sourceTasks.filter((task) => task.status === 'done').length;
    const inProgress = sourceTasks.filter((task) => task.status === 'in-progress').length;
    const review = sourceTasks.filter((task) => task.status === 'review').length;
    const open = sourceTasks.filter((task) => task.status === 'today').length;
    const blocked = sourceTasks.filter((task) => task.status === 'blocked').length;
    const criticalRisks = sourceTasks.filter(
      (task) => task.status === 'blocked' || task.compliance?.risk === 'Hoch',
    ).length;
    const openApprovals = sourceTasks.filter((task) =>
      String(task.compliance?.approval || '')
        .toLowerCase()
        .includes('offen'),
    ).length;
    const evidenceOpen = sourceTasks.filter((task) =>
      String(task.compliance?.evidence || '')
        .toLowerCase()
        .includes('erforderlich'),
    ).length;

    return {
      done,
      inProgress,
      review,
      open,
      blocked,
      criticalRisks,
      openApprovals,
      evidenceOpen,
    };
  }, [departmentTasks]);

  const teamLoad = useMemo(() => {
    const ownerCounts = initialProjects.reduce((accumulator, project) => {
      accumulator[project.owner] = (accumulator[project.owner] || 0) + 1;
      return accumulator;
    }, {});
    const activeDepartment =
      initialDepartments.find((department) => department.name === selectedLoadDepartment) || initialDepartments[0];

    return (activeDepartment?.members || []).map((member, index) => ({
      name: member,
      role:
        member === activeDepartment.lead
          ? `${activeDepartment.name} Lead`
          : activeDepartment.name,
      load: Math.min(100, 42 + (ownerCounts[member] || 0) * 18 + index * 9),
      tone: ['#4875c8', '#b76c12', '#1f7a4f', '#b84758', '#6d5df6'][index % 5],
    }));
  }, [selectedLoadDepartment]);

  const projectCards = useMemo(() => {
    return initialProjects.map((project) => {
      const backlog = initialBacklogTasks.filter((task) => task.projectId === project.id);
      const progress = getProjectProgress(backlog, project.status);
      const signal = getSignal(progress, project.status);
      const department = departmentById[project.departmentId];

      return {
        ...project,
        departmentName: department?.name || 'Abteilung',
        progress,
        signal,
        openTasks: backlog.filter((task) => task.status !== 'done').length || (project.status === 'Konzept' ? 5 : 3),
        milestone: `${project.dueDate} - naechster Meilenstein`,
      };
    });
  }, [departmentById]);

  const departmentProjects = useMemo(() => {
    return projectCards.filter((project) => project.departmentName === selectedDepartment);
  }, [projectCards, selectedDepartment]);

  const projectOptions = useMemo(() => ['Alle Projekte', ...departmentProjects.map((project) => project.name)], [departmentProjects]);

  const filteredProjects = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return departmentProjects.filter((project) => {
      const matchesSearch =
        !query ||
        [project.name, project.departmentName, project.owner, project.summary].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesProject = selectedProject === 'Alle Projekte' || project.name === selectedProject;

      return matchesSearch && matchesProject;
    });
  }, [departmentProjects, searchValue, selectedProject]);

  useEffect(() => {
    setSelectedProject('Alle Projekte');
  }, [selectedDepartment]);

  useEffect(() => {
    setActiveProjectId((current) => {
      if (filteredProjects.some((project) => project.id === current)) {
        return current;
      }
      return filteredProjects[0]?.id || '';
    });
  }, [filteredProjects]);

  const visibleProjectCount = filteredProjects.length;
  const activeProject = filteredProjects.find((project) => project.id === activeProjectId) || filteredProjects[0] || null;
  const avgCycleTime = useMemo(() => {
    const activeBacklog = initialBacklogTasks.filter((task) => task.status !== 'done').length;
    return `${(2.2 + activeBacklog / 10).toFixed(1).replace('.', ',')} Tage`;
  }, []);

  const taskStatusSegments = useMemo(() => {
    const values = [
      { label: 'Erledigt', value: taskMetrics.done, color: '#1f7a4f', track: '#e8f7ef' },
      {
        label: 'In Bearbeitung',
        value: taskMetrics.inProgress + taskMetrics.review,
        color: '#4875c8',
        track: '#ecf3ff',
      },
      { label: 'Offen', value: taskMetrics.open, color: '#b76c12', track: '#fff6e8' },
      { label: 'Ueberfaellig', value: taskMetrics.blocked, color: '#b84758', track: '#fff0f2' },
    ];
    const total = values.reduce((sum, item) => sum + item.value, 0) || 1;

    return values.map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [taskMetrics]);

  const kpis = useMemo(
    () => [
      {
        id: 'done',
        label: 'Erledigte Aufgaben',
        value: taskMetrics.done,
        trend: '+12% zur Vorwoche',
        icon: CheckCircle2,
        tone: 'bg-[#eefaf4] text-[#1f7a4f]',
      },
      {
        id: 'open',
        label: 'Offene Aufgaben',
        value: taskMetrics.open + taskMetrics.inProgress + taskMetrics.review,
        trend: '-3% zur Vorwoche',
        icon: FolderKanban,
        tone: 'bg-[#edf4ff] text-[#4875c8]',
      },
      {
        id: 'overdue',
        label: 'Ueberfaellige Aufgaben',
        value: taskMetrics.blocked,
        trend: '+1 seit letzter Woche',
        icon: AlertTriangle,
        tone: 'bg-[#fff0f2] text-[#b84758]',
      },
      {
        id: 'projects',
        label: 'Aktive Projekte',
        value: departmentProjects.length,
        trend: `${selectedDepartment} im Fokus`,
        icon: BarChartIcon,
        tone: 'bg-[#fff6e8] text-[#b76c12]',
      },
      {
        id: 'risks',
        label: 'Kritische Risiken',
        value: taskMetrics.criticalRisks,
        trend: 'eng verknuepft mit Blockern',
        icon: AlertTriangle,
        tone: 'bg-[#fff0f2] text-[#b84758]',
      },
      {
        id: 'cycle',
        label: 'Durchschnittliche Bearbeitungszeit',
        value: avgCycleTime,
        trend: '-0,4 Tage',
        icon: Clock3,
        tone: 'bg-[#f2efff] text-[#6d5df6]',
      },
    ],
    [avgCycleTime, departmentProjects.length, selectedDepartment, taskMetrics],
  );

  const attentionProject = useMemo(() => {
    return [...departmentProjects].sort((left, right) => left.progress - right.progress)[0];
  }, [departmentProjects]);

  const summaryText = useMemo(() => {
    return `In ${selectedDepartment} wurden ${
      taskMetrics.done
    } Aufgaben abgeschlossen. ${
      taskMetrics.open + taskMetrics.inProgress + taskMetrics.review
    } Aufgaben sind noch offen, davon ${taskMetrics.blocked} kritisch oder blockiert. Das Projekt ${
      attentionProject?.name || 'mit dem niedrigsten Fortschritt'
    } benoetigt aktuell besondere Aufmerksamkeit.`;
  }, [attentionProject, selectedDepartment, taskMetrics]);

  return (
    <AppShell
      activeItem="Reports"
      hideBreadcrumb
      searchPlacement="actions"
      searchValue={searchValue}
      onSearch={setSearchValue}
      createMenuItems={['Report exportieren']}
    >
      <div className="space-y-7">
        <section className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#b84758]">Reports</p>
              <h1 className="mt-3 text-[2.4rem] font-extrabold tracking-tight text-slate-950">Reports</h1>
              <p className="mt-3 text-base leading-7 text-slate-500">
                Ueberblick ueber Aufgaben, Projekte, Fortschritt und offene Risiken.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[760px]">
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Zeitraum</span>
                <select
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                >
                  {periods.map((period) => (
                    <option key={period}>{period}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Abteilung</span>
                <select
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                >
                  {departmentOptions.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Projekt auswaehlen</span>
                <select
                  value={selectedProject}
                  onChange={(event) => setSelectedProject(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                >
                  {projectOptions.map((project) => (
                    <option key={project}>{project}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-6">
          {kpis.map((item) => {
            const Icon = item.icon;
            const positive = item.trend.startsWith('+') || item.trend.startsWith('-');

            return (
              <article
                key={item.id}
                className="rounded-[26px] border border-[#f1c6ce] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                    {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    Trend
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
                <p className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">{item.trend}</p>
              </article>
            );
          })}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {departmentOptions.map((department) => (
              <button
                key={department}
                type="button"
                onClick={() => setSelectedDepartment(department)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  selectedDepartment === department
                    ? 'bg-[#b84758] text-white shadow-[0_10px_20px_rgba(184,71,88,0.18)]'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-[#f1c6ce] hover:text-[#b84758]'
                }`}
              >
                {department}
              </button>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Aufgabenstatus</h2>
                <p className="mt-2 text-sm text-slate-500">Status der Aufgaben fuer die aktuell gewaehlte Abteilung.</p>
              </div>
              <span className="rounded-full bg-[#fff7f8] px-4 py-2 text-sm font-bold text-[#b84758]">{selectedPeriod}</span>
            </div>

            <div className="mt-8 flex flex-col items-center gap-8 xl:flex-row xl:items-center">
              <DonutChart segments={taskStatusSegments} />

              <div className="w-full space-y-4">
                {taskStatusSegments.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-3 rounded-full" style={{ backgroundColor: item.track }}>
                      <div
                        className="h-3 rounded-full"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Projektfortschritt</h2>
              <p className="mt-2 text-sm text-slate-500">Nur die Projekte der gewaehlten Abteilung. Erst Projekt waehlen, dann den Detailstand ansehen.</p>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.25fr]">
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveProjectId(project.id)}
                    className={`w-full rounded-[22px] border p-4 text-left transition ${
                      activeProject?.id === project.id
                        ? 'border-[#e8a9b3] bg-[#fff7f8] shadow-[0_12px_28px_rgba(184,71,88,0.08)]'
                        : 'border-slate-200 bg-[#fcfdff] hover:border-[#f1c6ce] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{project.departmentName}</p>
                        <h3 className="mt-2 text-base font-extrabold leading-6 text-slate-950">{project.name}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${project.signal.tone}`}>{project.signal.label}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-500">
                      <span>{project.progress}% Fortschritt</span>
                      <span>{project.openTasks} offen</span>
                    </div>
                  </button>
                ))}
              </div>

              {activeProject ? (
                <article className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{activeProject.departmentName}</p>
                      <h3 className="mt-2 text-[1.35rem] font-extrabold leading-tight text-slate-950">{activeProject.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{activeProject.summary}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${activeProject.signal.tone}`}>{activeProject.signal.label}</span>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                      <span>Fortschritt</span>
                      <span>{activeProject.progress}%</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-[#f0b5bf] via-[#d86a7c] to-[#b84758]"
                        style={{ width: `${activeProject.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Offene Aufgaben</p>
                      <p className="mt-2 text-2xl font-extrabold text-slate-950">{activeProject.openTasks}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Verantwortung</p>
                      <p className="mt-2 text-base font-extrabold text-slate-950">{activeProject.owner}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 md:col-span-2">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Naechster Meilenstein</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{activeProject.milestone}</p>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-[#fcfdff] p-6 text-center text-sm font-semibold text-slate-400">
                  Kein Projekt im aktuellen Filter gefunden.
                </div>
              )}
            </div>
          </article>
          </div>
        </section>

        <section>
          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Team-Auslastung</h2>
                <p className="mt-2 text-sm text-slate-500">Abteilung auswaehlen und dann die aktuelle Auslastung des Teams ansehen.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#4875c8]">
                  <Users className="h-5 w-5" />
                </span>
                <label className="space-y-2">
                  <span className="block text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Abteilung</span>
                  <select
                    value={selectedLoadDepartment}
                    onChange={(event) => setSelectedLoadDepartment(event.target.value)}
                    className="h-12 min-w-[240px] rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                  >
                    {departmentOptions.map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {teamLoad.map((member) => (
                <div key={member.name} className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-extrabold text-slate-950">{member.name}</p>
                      <p className="text-sm font-semibold text-slate-500">{member.role}</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-950">{member.load}%</p>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full"
                      style={{ width: `${member.load}%`, backgroundColor: member.tone }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Wochenzusammenfassung</h2>
                <p className="mt-2 text-sm text-slate-500">Kurzfazit auf Basis des aktuellen Aufgabenboards und der aktiven Projekte.</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eefaf4] text-[#1f7a4f]">
                <CircleDot className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 rounded-[26px] border border-[#f4d9de] bg-[#fff7f8] p-5">
              <p className="text-base leading-8 text-slate-700">{summaryText}</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Erledigt</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">{taskMetrics.done} Aufgaben abgeschlossen</p>
              </div>
              <div className="rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Offen</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">
                  {taskMetrics.open + taskMetrics.inProgress + taskMetrics.review} Aufgaben noch offen
                </p>
              </div>
              <div className="rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Ueberfaellig</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">{taskMetrics.blocked} Aufgaben kritisch oder blockiert</p>
              </div>
              <div className="rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Aufmerksamkeit</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">{attentionProject?.name}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Export</h2>
                <p className="mt-2 text-sm text-slate-500">Platzhalter fuer spaetere PDF- oder Excel-Exports aus den echten Report-Daten.</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6e8] text-[#b76c12]">
                <Download className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#f4d9de] bg-[#fff7f8] p-5">
              <p className="text-sm font-semibold leading-7 text-slate-600">
                Der Export-Button bleibt sichtbar und kann spaeter direkt an PDF-, Excel- oder Management-Exports angebunden werden.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b84758] px-5 text-sm font-bold text-white transition hover:bg-[#a23d4d]"
              >
                <Download className="h-4 w-4" />
                Report exportieren
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {[
                'Verwendet die vorhandenen Abteilungen und Projekte aus dem Produktbereich.',
                'Leitet Fortschritt aus dem bestehenden Projekt-Backlog ab.',
                'Zeigt Team-Auslastung jetzt gezielt pro ausgewaehlter Abteilung.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3">
                  <ArrowUpRight className="mt-0.5 h-4 w-4 flex-none text-[#b84758]" />
                  <p className="text-sm font-semibold leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}

function BarChartIcon(props) {
  return <FolderKanban {...props} />;
}
