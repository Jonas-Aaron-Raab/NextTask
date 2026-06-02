import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  FolderKanban,
  TrendingDown,
  Users,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialTasks } from './MyTasksPage';
import { initialBacklogTasks, initialDepartments, initialProjects } from './ProjectsPage';

const periods = ['Diese Woche', 'Dieser Monat', 'Dieses Jahr'];
const reportSelectClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12';

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

function ReportFilterField({ label, value, onChange, children }) {
  return (
    <label className="min-w-[180px] flex-1 space-y-2">
      <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <select value={value} onChange={onChange} className={reportSelectClass}>
        {children}
      </select>
    </label>
  );
}

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [selectedProject, setSelectedProject] = useState('Alle Projekte');
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartments[0]?.name || '');
  const [activeProjectId, setActiveProjectId] = useState('');
  const [exportFormat, setExportFormat] = useState('PDF');

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
      initialDepartments.find((department) => department.name === selectedDepartment) || initialDepartments[0];

    return (activeDepartment?.members || []).map((member, index) => ({
      name: member,
      role:
        member === activeDepartment.lead
          ? `${activeDepartment.name} Lead`
          : activeDepartment.name,
      load: Math.min(100, 42 + (ownerCounts[member] || 0) * 18 + index * 9),
      tone: ['#4875c8', '#b76c12', '#1f7a4f', '#b84758', '#6d5df6'][index % 5],
    }));
  }, [selectedDepartment]);

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
      headerTitle="Reports"
      searchValue={searchValue}
      onSearch={setSearchValue}
    >
      <div className="space-y-6 px-4 py-4 xl:px-6">
        <section className="rounded-[30px] border-2 border-slate-900 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4">
            <div className="flex flex-wrap items-end gap-3 xl:flex-nowrap">
              <ReportFilterField label="Zeitraum" value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)}>
                {periods.map((period) => (
                  <option key={period}>{period}</option>
                ))}
              </ReportFilterField>
              <ReportFilterField label="Abteilung" value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
                {departmentOptions.map((department) => (
                  <option key={department}>{department}</option>
                ))}
              </ReportFilterField>
              <ReportFilterField label="Exportformat" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
                <option>PDF</option>
                <option>Excel</option>
              </ReportFilterField>
              <ReportFilterField label="Projekt" value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
                {projectOptions.map((project) => (
                  <option key={project}>{project}</option>
                ))}
              </ReportFilterField>
              <div className="min-w-[200px] flex-1 space-y-2 xl:max-w-[240px]">
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Export</span>
                <button
                  type="button"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white transition hover:bg-[#a23d4d]"
                >
                  <Download className="h-4 w-4" />
                  Als {exportFormat} exportieren
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.id}
                className="flex min-h-[168px] flex-col rounded-[24px] border-2 border-slate-900 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-5 text-slate-500">{item.label}</p>
                <p className="mt-2 text-[1.75rem] font-extrabold tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-auto pt-3 text-sm font-semibold leading-5 text-slate-500">{item.trend}</p>
              </article>
            );
          })}
        </section>

        <section>
          <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <article className="h-full rounded-[30px] border border-slate-900 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Aufgabenstatus</h2>
              </div>
            </div>

            <div className="mt-8 flex min-h-[356px] flex-col items-center gap-8 xl:flex-row xl:items-center">
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

          <article className="h-full rounded-[30px] border border-slate-900 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Projektfortschritt</h2>
            </div>

            <div className="mt-6 grid min-h-[356px] gap-4 xl:grid-cols-[0.92fr_1.08fr] xl:items-stretch">
              <div className="grid auto-rows-fr gap-3">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveProjectId(project.id)}
                    className={`flex h-full min-h-[136px] flex-col justify-between rounded-[22px] border p-4 text-left transition ${
                      activeProject?.id === project.id
                        ? 'border-[#e8a9b3] bg-[#fff7f8] shadow-[0_12px_28px_rgba(184,71,88,0.08)]'
                        : 'border-slate-200 bg-[#fcfdff] hover:border-slate-900 hover:bg-white'
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
                <article className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
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

                  <div className="mt-auto grid gap-3 pt-6 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Offene Aufgaben</p>
                      <p className="mt-2 text-2xl font-extrabold text-slate-950">{activeProject.openTasks}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Verantwortung</p>
                      <p className="mt-2 text-base font-extrabold text-slate-950">{activeProject.owner}</p>
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

        <section className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <article className="h-full rounded-[30px] border border-slate-900 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Team-Auslastung</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#4875c8]">
                <Users className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {teamLoad.map((member) => (
                <div key={member.name} className="grid min-h-[220px] grid-rows-[auto_1fr_auto] rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-extrabold text-slate-950 break-words">{member.name}</p>
                      <p className="text-sm font-semibold text-slate-500">{member.role}</p>
                    </div>
                    <p className="shrink-0 whitespace-nowrap text-lg font-extrabold text-slate-950">{member.load}%</p>
                  </div>
                  <div />
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

          <article className="h-full rounded-[30px] border border-slate-900 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Wochenzusammenfassung</h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eefaf4] text-[#1f7a4f]">
                <CircleDot className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="min-h-[150px] rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Erledigt</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">{taskMetrics.done} Aufgaben abgeschlossen</p>
              </div>
              <div className="min-h-[150px] rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Offen</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">
                  {taskMetrics.open + taskMetrics.inProgress + taskMetrics.review} Aufgaben noch offen
                </p>
              </div>
              <div className="min-h-[150px] rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Ueberfaellig</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">{taskMetrics.blocked} Aufgaben kritisch oder blockiert</p>
              </div>
              <div className="min-h-[150px] rounded-[22px] bg-[#f8fafc] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Aufmerksamkeit</p>
                <p className="mt-2 text-lg font-extrabold text-slate-950">{attentionProject?.name}</p>
              </div>
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
