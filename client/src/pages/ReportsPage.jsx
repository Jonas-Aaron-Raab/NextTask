import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CalendarDays,
  CircleDot,
  Clock3,
  Download,
  Flag,
  FileText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialTasks } from '../data/taskFixtures';
import { taskDateTimestamp } from '../utils/task';
import { formatLongDate, getTimelineSpan } from '../utils/calendar';
import { DonutChart, ReportFilterField } from '../components/reports/ReportWidgets';
import ReportsContent from '../components/reports/ReportsContent';
import { getReportHtml } from '../utils/reportExport';
import {
  initialBacklogTasks,
  initialDepartments,
  initialProjects,
  mergeProjectsWithDefaults,
  projectStorageKey,
} from '../data/projectFixtures';

const periods = ['Diese Woche', 'Dieser Monat', 'Dieses Jahr'];
const reportSelectClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12';
const dayInMs = 86400000;

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

const backlogStatusMeta = {
  todo: { label: 'Offen', tone: 'bg-slate-100 text-slate-600', bar: '#94a3b8', track: '#e2e8f0' },
  progress: { label: 'In Arbeit', tone: 'bg-[#edf4ff] text-[#4875c8]', bar: '#4875c8', track: '#dbeafe' },
  review: { label: 'Review', tone: 'bg-[#f2ebff] text-[#7c59dc]', bar: '#7c59dc', track: '#e9ddff' },
  done: { label: 'Fertig', tone: 'bg-[#eefaf4] text-[#1f7a4f]', bar: '#1f7a4f', track: '#d1fae5' },
};

const projectLeadDays = {
  Konzept: 24,
  'In Planung': 36,
  'In Arbeit': 28,
  Review: 18,
};

const taskDurationByPriority = {
  hoch: 9,
  mittel: 7,
  niedrig: 5,
};

const taskStatusProgress = {
  todo: 22,
  progress: 58,
  review: 88,
  done: 100,
};

const taskStatusDurationAdjustment = {
  todo: 2,
  progress: 0,
  review: -1,
  done: -2,
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

function startOfMonth(timestamp) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function endOfMonth(timestamp) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
}

function addMonths(timestamp, count) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth() + count, 1).getTime();
}

function getDaysBetween(startTime, endTime) {
  return Math.max(1, Math.round((endTime - startTime) / dayInMs) + 1);
}

function getSourceTask(task) {
  return initialTasks.find((item) => item.id === task.sourceTaskId) || null;
}

function buildTaskTimeline(task) {
  const sourceTask = getSourceTask(task);
  const dueTime = taskDateTimestamp(task.dueDate);
  const baseDuration = taskDurationByPriority[task.priority] || 6;
  const durationDays = Math.max(3, baseDuration + (taskStatusDurationAdjustment[task.status] || 0));
  const startTime = dueTime - (durationDays - 1) * dayInMs;
  const reviewDate = task.status === 'review' ? dueTime - dayInMs : null;
  const sourceState = sourceTask?.status;
  const finishLabel =
    task.status === 'done'
      ? `Fertig am ${formatLongDate(dueTime)}`
      : task.status === 'review'
        ? `Review seit ${formatLongDate(reviewDate || dueTime)}`
        : `Geplant bis ${formatLongDate(dueTime)}`;

  return {
    ...task,
    sourceState,
    startTime,
    endTime: dueTime,
    durationDays,
    progress: taskStatusProgress[task.status] || 24,
    statusMeta: backlogStatusMeta[task.status] || backlogStatusMeta.todo,
    finishLabel,
    assigneeLabel: task.assignee || 'Noch nicht zugewiesen',
  };
}

function buildMonthSegments(rangeStart, rangeEnd) {
  const totalRange = Math.max(dayInMs, rangeEnd - rangeStart + dayInMs);
  const segments = [];
  let cursor = startOfMonth(rangeStart);

  while (cursor <= rangeEnd) {
    const segmentStart = Math.max(cursor, rangeStart);
    const segmentEnd = Math.min(endOfMonth(cursor), rangeEnd);
    segments.push({
      key: cursor,
      label: new Intl.DateTimeFormat('de-DE', { month: 'short', year: 'numeric' }).format(new Date(cursor)),
      ...getTimelineSpan(segmentStart, segmentEnd, rangeStart, totalRange),
    });
    cursor = addMonths(cursor, 1);
  }

  return segments;
}

function formatReportDate(inputDate) {
  if (!inputDate) return 'Noch offen';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${inputDate}T00:00:00`));
}

function formatReportPeriod(inputDate) {
  if (!inputDate) return 'Noch offen';
  return new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${inputDate}T00:00:00`));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStoredReportProjects() {
  if (typeof window === 'undefined') return initialProjects;
  try {
    const stored = window.localStorage.getItem(projectStorageKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return mergeProjectsWithDefaults(parsed);
  } catch {
    return initialProjects;
  }
}

export default function ReportsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [selectedProject, setSelectedProject] = useState('Alle Projekte');
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartments[0]?.name || '');
  const [selectedTimelineProjectId, setSelectedTimelineProjectId] = useState('');
  const [selectedTimelineEntryId, setSelectedTimelineEntryId] = useState('');
  const [activeProjectId, setActiveProjectId] = useState('');
  const [exportFormat, setExportFormat] = useState('PDF');
  const [selectedReportProjectId, setSelectedReportProjectId] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportProjects, setReportProjects] = useState(() => getStoredReportProjects());
  const reportDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const departmentById = useMemo(
    () => Object.fromEntries(initialDepartments.map((department) => [department.id, department])),
    [],
  );

  const departmentOptions = useMemo(() => initialDepartments.map((department) => department.name), []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === projectStorageKey) {
        setReportProjects(getStoredReportProjects());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
    const ownerCounts = reportProjects.reduce((accumulator, project) => {
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
  }, [reportProjects, selectedDepartment]);

  const projectCards = useMemo(() => {
    return reportProjects.map((project) => {
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
  }, [departmentById, reportProjects]);

  useEffect(() => {
    setSelectedReportProjectId((current) => {
      if (projectCards.some((project) => project.id === current)) {
        return current;
      }
      return projectCards[0]?.id || '';
    });
  }, [projectCards]);

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
    setSelectedTimelineProjectId('');
  }, [selectedDepartment]);

  useEffect(() => {
    setSelectedTimelineEntryId('');
  }, [selectedTimelineProjectId]);

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
  const selectedReportProject = projectCards.find((project) => project.id === selectedReportProjectId) || projectCards[0] || null;
  const statusReport = useMemo(() => {
    if (!selectedReportProject) return null;
    const fallbackMilestones = [
      {
        title: selectedReportProject.milestone,
        planDate: selectedReportProject.dueDate,
        newDate: '',
        status: selectedReportProject.progress >= 80 ? 'Erreicht' : 'In Arbeit',
        progress: selectedReportProject.progress,
        statusNote: 'Aus Projektfortschritt abgeleitet.',
      },
    ];
    const fallbackRisks = selectedReportProject.signal.label === 'Rot'
      ? [{ code: 'R-1', title: 'Projektfortschritt kritisch', riskClass: 'Hoch', trend: 'Steigend' }]
      : [];
    const fallbackBudget = [
      {
        category: 'Gesamtbudget',
        plannedAmount: selectedReportProject.plannedBudget || 0,
        actualAmount: selectedReportProject.actualBudget || 0,
        difference: (selectedReportProject.actualBudget || 0) - (selectedReportProject.plannedBudget || 0),
        actualPercent: selectedReportProject.plannedBudget ? Math.round(((selectedReportProject.actualBudget || 0) / selectedReportProject.plannedBudget) * 100) : 0,
      },
    ];
    const rawBudgetLines = selectedReportProject.budgetLines?.length ? selectedReportProject.budgetLines : fallbackBudget;
    const budgetLines = rawBudgetLines.map((line) => {
      const plannedAmount = Number(line.plannedAmount || 0);
      const actualAmount = Number(line.actualAmount || 0);
      return {
        ...line,
        plannedAmount,
        actualAmount,
        difference: line.difference ?? actualAmount - plannedAmount,
        actualPercent: line.actualPercent ?? (plannedAmount ? Math.round((actualAmount / plannedAmount) * 100) : 0),
      };
    });
    const interfaces = selectedReportProject.interfaces?.length
      ? selectedReportProject.interfaces
      : (selectedReportProject.keyInterfaces || []).map((name) => ({
          name,
          status: 'Offen',
          comment: 'Noch nicht bewertet.',
        }));
    const nextMilestone =
      (selectedReportProject.milestones || []).find((milestone) => Number(milestone.progress || 0) < 100) ||
      (selectedReportProject.milestones || [])[0];
    const actualBudget = selectedReportProject.actualBudget ?? budgetLines.reduce((sum, line) => sum + line.actualAmount, 0);
    const effortDifferencePt =
      selectedReportProject.effortDifferencePt ??
      ((selectedReportProject.actualEffortPt || 0) - (selectedReportProject.plannedEffortPt || 0));

    return {
      projectName: selectedReportProject.name,
      departmentName: selectedReportProject.departmentName,
      reportDate: formatReportDate(reportDate),
      reportPeriod: formatReportPeriod(reportDate),
      owner: selectedReportProject.owner || 'Noch offen',
      deputyLead: selectedReportProject.deputyLead || 'Noch offen',
      projectSponsor: selectedReportProject.projectSponsor || 'Noch offen',
      plannedStart: selectedReportProject.plannedStart || 'Noch offen',
      plannedEnd: selectedReportProject.dueDate || 'Noch offen',
      nextMilestoneDate: nextMilestone?.newDate || nextMilestone?.planDate || selectedReportProject.dueDate || 'Noch offen',
      reportVersion: selectedReportProject.reportVersion || 'v1',
      progress: selectedReportProject.reportProgress ?? selectedReportProject.progress,
      plannedEffortPt: selectedReportProject.plannedEffortPt,
      actualEffortPt: selectedReportProject.actualEffortPt,
      effortDifferencePt,
      plannedBudget: selectedReportProject.plannedBudget,
      actualBudget,
      projectGoal: selectedReportProject.projectGoal || selectedReportProject.summary || 'Noch kein Projektziel gepflegt.',
      overallStatus: selectedReportProject.overallStatus || selectedReportProject.signal.label,
      goalStatus: selectedReportProject.goalStatus || selectedReportProject.signal.label,
      scheduleStatus: selectedReportProject.scheduleStatus || selectedReportProject.signal.label,
      resourceStatus: selectedReportProject.resourceStatus || selectedReportProject.signal.label,
      budgetStatus: selectedReportProject.budgetStatus || selectedReportProject.signal.label,
      reportNotes: selectedReportProject.reportNotes || 'Keine Erlaeuterung gepflegt.',
      collaborationQuality: selectedReportProject.collaborationQuality || 'Noch keine Bewertung gepflegt.',
      nextSteps: selectedReportProject.nextSteps || 'Naechste Schritte pruefen und im Projekt pflegen.',
      milestones: selectedReportProject.milestones?.length ? selectedReportProject.milestones : fallbackMilestones,
      risks: selectedReportProject.risks?.length ? selectedReportProject.risks : fallbackRisks,
      budgetLines,
      interfaces,
      approvals: selectedReportProject.approvals || {},
    };
  }, [reportDate, selectedReportProject]);
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

  const attentionProject = useMemo(() => {
    return [...departmentProjects].sort((left, right) => left.progress - right.progress)[0];
  }, [departmentProjects]);

  const timelineProjectOptions = useMemo(() => {
    return departmentProjects.map((project) => ({ id: project.id, name: project.name }));
  }, [departmentProjects]);

  const selectedTimelineProject = useMemo(() => {
    const project = departmentProjects.find((item) => item.id === selectedTimelineProjectId);
    if (!project) return null;

    const tasks = initialBacklogTasks
      .filter((task) => task.projectId === project.id)
      .map(buildTaskTimeline)
      .sort((left, right) => left.endTime - right.endTime);
    const endTime = taskDateTimestamp(project.dueDate);
    const fallbackLeadDays = projectLeadDays[project.status] || 28;
    const fallbackStart = endTime - (fallbackLeadDays - 1) * dayInMs;
    const startTime = tasks.length ? Math.min(...tasks.map((task) => task.startTime), fallbackStart) : fallbackStart;
    const durationDays = getDaysBetween(startTime, endTime);
    const nextTask = tasks.filter((task) => task.status !== 'done').sort((left, right) => left.endTime - right.endTime)[0] || null;

    return {
      ...project,
      tasks,
      startTime,
      endTime,
      durationDays,
      nextTask,
    };
  }, [departmentProjects, selectedTimelineProjectId]);

  const selectedTimelineRange = useMemo(() => {
    if (!selectedTimelineProject) return null;

    const allStartTimes = [selectedTimelineProject.startTime, ...selectedTimelineProject.tasks.map((task) => task.startTime)];
    const allEndTimes = [selectedTimelineProject.endTime, ...selectedTimelineProject.tasks.map((task) => task.endTime)];
    const rangeStart = startOfMonth(Math.min(...allStartTimes));
    const rangeEnd = endOfMonth(Math.max(...allEndTimes));
    const totalRange = Math.max(dayInMs, rangeEnd - rangeStart + dayInMs);

    return {
      rangeStart,
      rangeEnd,
      totalRange,
      months: buildMonthSegments(rangeStart, rangeEnd),
    };
  }, [selectedTimelineProject]);

  const selectedTimelineStats = useMemo(() => {
    if (!selectedTimelineProject) return null;

    const reviewCount = selectedTimelineProject.tasks.filter((task) => task.status === 'review').length;
    const activeCount = selectedTimelineProject.tasks.filter((task) => task.status === 'progress').length;
    const avgDuration = selectedTimelineProject.tasks.length
      ? Math.round(selectedTimelineProject.tasks.reduce((sum, task) => sum + task.durationDays, 0) / selectedTimelineProject.tasks.length)
      : 0;

    return {
      reviewCount,
      activeCount,
      avgDuration,
    };
  }, [selectedTimelineProject]);

  const selectedTimelineEntries = useMemo(() => {
    if (!selectedTimelineProject) return [];

    const taskEntries = selectedTimelineProject.tasks.map((task, index) => ({
      id: task.id,
      time: task.endTime,
      title: task.title,
      subtitle: task.assigneeLabel,
      meta: task.finishLabel,
      description: task.description,
      tone: task.statusMeta,
      shortLabel: `MS${index + 1}`,
      typeLabel: 'Meilenstein',
      type: 'task',
    }));

    return [
      {
        id: `${selectedTimelineProject.id}-start`,
        time: selectedTimelineProject.startTime,
        title: 'Projektstart',
        subtitle: selectedTimelineProject.name,
        meta: `${formatLongDate(selectedTimelineProject.startTime)} • Kickoff`,
        description: 'Kickoff und Start des ausgewaehlten Projekts.',
        tone: { tone: 'bg-[#fff4e7] text-[#c26a34]', bar: '#c26a34' },
        shortLabel: 'Start',
        typeLabel: 'Projektstart',
        type: 'start',
      },
      ...taskEntries,
      {
        id: `${selectedTimelineProject.id}-end`,
        time: selectedTimelineProject.endTime,
        title: 'Projektdeadline',
        subtitle: selectedTimelineProject.owner,
        meta: `${formatLongDate(selectedTimelineProject.endTime)} • Zieltermin`,
        description: 'Geplante Deadline fuer das ausgewaehlte Projekt.',
        tone: { tone: 'bg-[#fff0f2] text-[#b84758]', bar: '#b84758' },
        shortLabel: 'Ziel',
        typeLabel: 'Projektdeadline',
        type: 'deadline',
      },
    ].sort((left, right) => left.time - right.time);
  }, [selectedTimelineProject]);

  useEffect(() => {
    if (!selectedTimelineEntries.length) return;

    setSelectedTimelineEntryId((current) => {
      if (selectedTimelineEntries.some((entry) => entry.id === current)) {
        return current;
      }

      return selectedTimelineEntries.find((entry) => entry.type === 'task')?.id || selectedTimelineEntries[0].id;
    });
  }, [selectedTimelineEntries]);

  const selectedTimelineEntry = useMemo(() => {
    return selectedTimelineEntries.find((entry) => entry.id === selectedTimelineEntryId) || selectedTimelineEntries[0] || null;
  }, [selectedTimelineEntries, selectedTimelineEntryId]);

  const searchSuggestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];

    const projectSuggestions = filteredProjects.map((project) => ({
      id: `report-project-${project.id}`,
      type: 'Projekt',
      label: project.name,
      meta: `${project.departmentName} - ${project.owner}`,
      onSelect: () => setActiveProjectId(project.id),
    }));

    const timelineSuggestions = selectedTimelineEntries
      .filter((entry) => [entry.title, entry.subtitle, entry.meta, entry.description].join(' ').toLowerCase().includes(query))
      .map((entry) => ({
        id: `timeline-${entry.id}`,
        type: 'Termin',
        label: entry.title,
        meta: `${entry.subtitle} - ${entry.typeLabel}`,
        onSelect: () => setSelectedTimelineEntryId(entry.id),
      }));

    return [...projectSuggestions, ...timelineSuggestions];
  }, [filteredProjects, searchValue, selectedTimelineEntries]);

  return <ReportsContent
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        periods={periods}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        departmentOptions={departmentOptions}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        projectOptions={projectOptions}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        selectedReportProjectId={selectedReportProjectId}
        setSelectedReportProjectId={setSelectedReportProjectId}
        projectCards={projectCards}
        selectedReportProject={selectedReportProject}
        statusReport={statusReport}
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
        taskStatusSegments={taskStatusSegments}
        filteredProjects={filteredProjects}
        activeProject={activeProject}
        setActiveProjectId={setActiveProjectId}
        selectedTimelineProjectId={selectedTimelineProjectId}
        setSelectedTimelineProjectId={setSelectedTimelineProjectId}
        timelineProjectOptions={timelineProjectOptions}
        selectedTimelineProject={selectedTimelineProject}
        selectedTimelineRange={selectedTimelineRange}
        selectedTimelineStats={selectedTimelineStats}
        selectedTimelineEntries={selectedTimelineEntries}
        selectedTimelineEntry={selectedTimelineEntry}
        setSelectedTimelineEntryId={setSelectedTimelineEntryId}
        teamLoad={teamLoad}
        taskMetrics={taskMetrics}
        attentionProject={attentionProject}
        searchSuggestions={searchSuggestions}
        getReportHtml={getReportHtml}
      />;
}
