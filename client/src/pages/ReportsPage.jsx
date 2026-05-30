import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  FolderKanban,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialTasks } from './MyTasksPage';
import { initialBacklogTasks, initialDepartments, initialProjects } from './ProjectsPage';

const periods = ['Diese Woche', 'Dieser Monat', 'Quartal'];

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
  const [selectedTeam, setSelectedTeam] = useState('Alle Teams');

  const departmentById = useMemo(
    () => Object.fromEntries(initialDepartments.map((department) => [department.id, department])),
    [],
  );

  const projectOptions = useMemo(() => ['Alle Projekte', ...initialProjects.map((project) => project.name)], []);
  const teamOptions = useMemo(() => ['Alle Teams', ...initialDepartments.map((department) => department.name)], []);

  const taskMetrics = useMemo(() => {
    const done = initialTasks.filter((task) => task.status === 'done').length;
    const inProgress = initialTasks.filter((task) => task.status === 'in-progress').length;
    const review = initialTasks.filter((task) => task.status === 'review').length;
    const open = initialTasks.filter((task) => task.status === 'today').length;
    const blocked = initialTasks.filter((task) => task.status === 'blocked').length;
    const criticalRisks = initialTasks.filter(
      (task) => task.status === 'blocked' || task.compliance?.risk === 'Hoch',
    ).length;
    const openApprovals = initialTasks.filter((task) =>
      String(task.compliance?.approval || '')
        .toLowerCase()
        .includes('offen'),
    ).length;
    const evidenceOpen = initialTasks.filter((task) =>
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
  }, []);

  const teamLoad = useMemo(() => {
    const ownerCounts = initialProjects.reduce((accumulator, project) => {
      accumulator[project.owner] = (accumulator[project.owner] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(ownerCounts)
      .map(([name, count], index) => ({
        name,
        role: initialDepartments.find((department) => department.lead === name)?.name || 'Projektverantwortung',
        load: Math.min(100, 45 + count * 15 + index * 5),
        tone: ['#4875c8', '#b76c12', '#1f7a4f', '#b84758', '#6d5df6'][index % 5],
      }))
      .slice(0, 4);
  }, []);

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

  const filteredProjects = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return projectCards.filter((project) => {
      const matchesSearch =
        !query ||
        [project.name, project.departmentName, project.owner, project.summary].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesProject = selectedProject === 'Alle Projekte' || project.name === selectedProject;
      const matchesTeam = selectedTeam === 'Alle Teams' || project.departmentName === selectedTeam;

      return matchesSearch && matchesProject && matchesTeam;
    });
  }, [projectCards, searchValue, selectedProject, selectedTeam]);

  const visibleProjectCount = filteredProjects.length;
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

  const complianceCards = useMemo(
    () => [
      {
        title: 'Offene Compliance-Aufgaben',
        value: taskMetrics.openApprovals,
        detail: 'Freigaben und Abstimmungen aus Produkt und Compliance sind noch offen.',
        tone: 'bg-[#fff7f8]',
      },
      {
        title: 'Kritische Risiken',
        value: taskMetrics.criticalRisks,
        detail: 'Blockierte oder risikoreiche Aufgaben muessen priorisiert werden.',
        tone: 'bg-[#fff7f8]',
      },
      {
        title: 'Kontrollnachweise offen',
        value: taskMetrics.evidenceOpen,
        detail: 'Nachweise, Screenshots und Dokumentationen fehlen noch in mehreren Tickets.',
        tone: 'bg-[#f8fafc]',
      },
      {
        title: 'Vier-Augen-Pruefungen offen',
        value: taskMetrics.review,
        detail: 'Review- und Abnahmeaufgaben laufen aktuell ueber QA und Fachbereiche.',
        tone: 'bg-[#f8fafc]',
      },
    ],
    [taskMetrics],
  );

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
        value: initialProjects.length,
        trend: `${visibleProjectCount} aktuell im Filter`,
        icon: BarChartIcon,
        tone: 'bg-[#fff6e8] text-[#b76c12]',
      },
      {
        id: 'risks',
        label: 'Kritische Risiken',
        value: taskMetrics.criticalRisks,
        trend: 'eng verknuepft mit Blockern',
        icon: ShieldAlert,
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
    [avgCycleTime, taskMetrics, visibleProjectCount],
  );

  const attentionProject = useMemo(() => {
    return [...projectCards].sort((left, right) => left.progress - right.progress)[0];
  }, [projectCards]);

  const summaryText = useMemo(() => {
    return `Diese Woche wurden ${taskMetrics.done} Aufgaben abgeschlossen. ${
      taskMetrics.open + taskMetrics.inProgress + taskMetrics.review
    } Aufgaben sind noch offen, davon ${taskMetrics.blocked} kritisch oder blockiert. Das Projekt ${
      attentionProject?.name || 'mit dem niedrigsten Fortschritt'
    } benoetigt aktuell besondere Aufmerksamkeit.`;
  }, [attentionProject, taskMetrics]);

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
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Team auswaehlen</span>
                <select
                  value={selectedTeam}
                  onChange={(event) => setSelectedTeam(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                >
                  {teamOptions.map((team) => (
                    <option key={team}>{team}</option>
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

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Aufgabenstatus</h2>
                <p className="mt-2 text-sm text-slate-500">Stand aus dem aktuellen Aufgabenboard und den laufenden Rueckmeldungen.</p>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Projektfortschritt</h2>
                <p className="mt-2 text-sm text-slate-500">Aktuelle Projekte aus den vorhandenen Abteilungen mit Backlog-Stand und Meilenstein.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-bold text-slate-600">
                {filteredProjects.length} Projekte sichtbar
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredProjects.map((project) => (
                <article key={project.id} className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{project.departmentName}</p>
                      <h3 className="mt-2 text-xl font-extrabold leading-tight text-slate-950">{project.name}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${project.signal.tone}`}>{project.signal.label}</span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                      <span>Fortschritt</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-[#f0b5bf] via-[#d86a7c] to-[#b84758]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Offene Aufgaben</p>
                      <p className="mt-2 text-lg font-extrabold text-slate-950">{project.openTasks}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Naechster Meilenstein</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{project.milestone}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Risiken &amp; Compliance</h2>
                <p className="mt-2 text-sm text-slate-500">Direkt aus den vorhandenen Aufgaben und Freigaben im Tool abgeleitet.</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f2] text-[#b84758]">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {complianceCards.map((item) => (
                <div key={item.title} className={`rounded-[24px] border border-slate-200 p-5 ${item.tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{item.title}</p>
                      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{item.value}</p>
                    </div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#b84758]">
                      <ShieldAlert className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Team-Auslastung</h2>
                <p className="mt-2 text-sm text-slate-500">Auf Basis der vorhandenen Projektverantwortungen in den Abteilungen.</p>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#4875c8]">
                <Users className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-6 space-y-4">
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
                'Greift fuer Risiken und Freigaben auf die aktuellen Aufgaben- und Compliance-Felder zu.',
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
