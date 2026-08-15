import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CalendarDays,
  CircleDot,
  Clock3,
  Download,
  Flag,
  FileText,
  Printer,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialTasks } from './MyTasksPage';
import {
  initialBacklogTasks,
  initialDepartments,
  initialProjects,
  mergeProjectsWithDefaults,
  projectStorageKey,
} from './ProjectsPage';

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

function parseGermanDate(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`).getTime();
  }

  const months = {
    januar: 0,
    februar: 1,
    maerz: 2,
    april: 3,
    mai: 4,
    juni: 5,
    juli: 6,
    august: 7,
    september: 8,
    oktober: 9,
    november: 10,
    dezember: 11,
  };

  const normalized = value
    .toLowerCase()
    .replace('märz', 'maerz')
    .replace(/\./g, '')
    .trim();
  const [day, monthName, year] = normalized.split(/\s+/);
  const monthIndex = months[monthName];

  if (!day || monthIndex === undefined || !year) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(Number(year), monthIndex, Number(day)).getTime();
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

function formatShortDate(timestamp) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' }).format(new Date(timestamp));
}

function formatLongDate(timestamp) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(timestamp));
}

function getDaysBetween(startTime, endTime) {
  return Math.max(1, Math.round((endTime - startTime) / dayInMs) + 1);
}

function getTimelineSpan(startTime, endTime, rangeStart, totalRange) {
  return {
    left: ((startTime - rangeStart) / totalRange) * 100,
    width: ((endTime - startTime + dayInMs) / totalRange) * 100,
  };
}

function getSourceTask(task) {
  return initialTasks.find((item) => item.id === task.sourceTaskId) || null;
}

function buildTaskTimeline(task) {
  const sourceTask = getSourceTask(task);
  const dueTime = parseGermanDate(task.dueDate);
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

function formatReportNumber(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'Noch offen';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 'Noch offen';
  return `${new Intl.NumberFormat('de-DE').format(parsed)}${suffix}`;
}

function getStatusTone(status) {
  if (status === 'Rot') return 'bg-[#fff0f2] text-[#b84758]';
  if (status === 'Gelb') return 'bg-[#fff6e8] text-[#b76c12]';
  return 'bg-[#eefaf4] text-[#1f7a4f]';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getReportHtml(report) {
  const e = escapeHtml;
  const projectTitle = `${report.projectName}`;
  const generationDate = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  const approvals = report.approvals || {};
  const statusText = (value) => {
    if (value === 'Gruen') return 'Positiv';
    if (value === 'Gelb') return 'Beobachten';
    if (value === 'Rot') return 'Kritisch';
    return value || 'Noch offen';
  };
  const statusIcon = (value) => {
    const normalizedStatus = String(value || '').toLowerCase();
    const fill = normalizedStatus.includes('gelb') || normalizedStatus.includes('beob')
      ? '#facc15'
      : normalizedStatus.includes('rot') || normalizedStatus.includes('krit') || normalizedStatus.includes('neg')
        ? '#ef4444'
        : '#35c82d';

    return `<svg class="status-circle" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7.2" fill="${fill}"/>
    </svg>`;
  };
  const reportProgress = Math.min(Math.max(Number(report.progress || 0), 0), 100);
  const progressSlice = () => {
    if (reportProgress <= 0) return '';
    if (reportProgress >= 100) return '<circle cx="12" cy="12" r="8.4" fill="#35c82d"/>';

    const radius = 8.4;
    const angle = (reportProgress / 100) * 360;
    const toPoint = (degrees) => {
      const radians = ((degrees - 90) * Math.PI) / 180;
      return {
        x: Number((12 + radius * Math.cos(radians)).toFixed(2)),
        y: Number((12 + radius * Math.sin(radians)).toFixed(2)),
      };
    };
    const start = toPoint(0);
    const end = toPoint(angle);
    const largeArc = angle > 180 ? 1 : 0;

    return `<path d="M 12 12 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z" fill="#35c82d"/>`;
  };
  const progressIcon = () => `<svg class="progress-circle" viewBox="0 0 24 24" aria-label="${reportProgress}% Projektfortschritt">
    <circle cx="12" cy="12" r="8.4" fill="#ffffff"/>
    ${progressSlice()}
    <circle cx="12" cy="12" r="8.4" fill="none" stroke="#111111" stroke-width="1.1"/>
  </svg>`;
  const riskClass = (risk) => risk.riskClass || 'C-Risiko';
  const riskClassIcon = (risk) => {
    const currentRiskClass = String(riskClass(risk)).toLowerCase();
    if (currentRiskClass.startsWith('a') || currentRiskClass.includes('hoch')) return statusIcon('Rot');
    if (currentRiskClass.startsWith('b') || currentRiskClass.includes('mittel')) return statusIcon('Gelb');
    return statusIcon('Gruen');
  };
  const trendIcon = (trend) => {
    const normalizedTrend = String(trend || '').toLowerCase();
    if (normalizedTrend.includes('steig') || normalizedTrend.includes('hoch')) return statusIcon('Gelb');
    if (normalizedTrend.includes('sink') || normalizedTrend.includes('fall')) return statusIcon('Gruen');
    return statusIcon('Gruen');
  };
  const milestoneRows = report.milestones
    .map(
      (milestone) =>
        `<tr><td>${e(milestone.title)}</td><td>${e(milestone.planDate || '')}</td><td>${e(milestone.newDate || '')}</td><td>${e(milestone.status)}</td><td>${e(milestone.progress ?? 0)}%</td><td>${e(milestone.statusNote || '')}</td></tr>`,
    )
    .join('') || '<tr><td colspan="6">Keine Meilensteine gepflegt.</td></tr>';
  const riskRows = report.risks
    .map(
      (risk) =>
        `<tr><td>${e(risk.code)}</td><td>${e(risk.title)}</td><td>${e(risk.impact || '')}</td><td>${e(risk.probability || '')}</td><td>${e(riskClass(risk))}</td><td class="icon-cell">${riskClassIcon(risk)}</td><td class="icon-cell">${trendIcon(risk.trend)}</td></tr>`,
    )
    .join('') || '<tr><td colspan="7">Keine Risiken gepflegt.</td></tr>';
  const riskLegendRows = report.risks
    .map((risk) => `<div><strong>${e(risk.code)}</strong>&nbsp;&nbsp; ${e(risk.title)}</div>`)
    .join('') || '<div>Keine Risiken gepflegt.</div>';
  const clampRiskValue = (value) => Math.min(Math.max(Number(value) || 0, 0), 10);
  const riskGraphGroups = report.risks.reduce((groups, risk) => {
    const impact = clampRiskValue(risk.impact);
    const probability = clampRiskValue(risk.probability);
    const key = `${impact}-${probability}`;
    const currentGroup = groups.get(key) || { impact, probability, codes: [] };
    currentGroup.codes.push(String(risk.code || '').replace(/^R-/i, 'R'));
    groups.set(key, currentGroup);
    return groups;
  }, new Map());
  const riskGraphMarkers = Array.from(riskGraphGroups.values())
    .map((group) => {
      const x = 70 + group.impact * 54;
      const y = 590 - group.probability * 54;
      const label = group.codes.join(', ');
      return `<g><circle cx="${x}" cy="${y}" r="8" fill="#111111"/><text x="${x}" y="${y + 25}" text-anchor="middle" font-size="12" font-weight="700">${e(label)}</text></g>`;
    })
    .join('');
  const riskAxisTicks = Array.from({ length: 11 }, (_, value) => {
    const x = 70 + value * 54;
    const y = 590 - value * 54;
    return `<g><line x1="${x}" y1="590" x2="${x}" y2="584" stroke="#000"/><text x="${x}" y="613" text-anchor="middle" font-size="12">${value}</text><line x1="70" y1="${y}" x2="76" y2="${y}" stroke="#000"/><text x="52" y="${y + 4}" text-anchor="end" font-size="12">${value}</text></g>`;
  }).join('');
  const budgetRows = report.budgetLines
    .map(
      (line) =>
        `<tr><td>${e(line.category)}</td><td>${e(formatReportNumber(line.plannedAmount, ''))}</td><td>${e(formatReportNumber(line.actualAmount, ''))}</td><td>${e(formatReportNumber(line.difference, ''))}</td><td>${e(line.actualPercent ?? 0)}</td></tr>`,
    )
    .join('') || '<tr><td colspan="5">Keine Budgetpositionen gepflegt.</td></tr>';
  const footer = (page) => `
    <footer class="report-footer">
      <div>Statusbericht - ${e(projectTitle)}</div>
      <div>Seite ${page} von 3</div>
      <div>Version vom: ${e(generationDate)} Uhr</div>
    </footer>`;
  const header = `
    <header class="report-heading">
      <div>
        <h1>Statusbericht</h1>
        <div class="project-line">Projekt: ${e(projectTitle)}</div>
      </div>
      <div class="sparkasse-logo" aria-label="Sparkasse">
        <svg class="sparkasse-symbol" viewBox="0 0 500 651" aria-hidden="true">
          <circle cx="250" cy="84" r="84" fill="#e30613"/>
          <path d="M85 217h330c47 0 85 38 85 85v264c0 47-38 85-85 85H85c-47 0-85-38-85-85V302c0-47 38-85 85-85Z" fill="#e30613"/>
          <rect x="117" y="334" width="383" height="48" fill="#ffffff"/>
          <rect x="0" y="484" width="383" height="48" fill="#ffffff"/>
        </svg>
        <span class="sparkasse-logo-text"><span>Sparkasse</span><span>Oberhessen</span></span>
      </div>
    </header>`;

  return `<!doctype html>
<html>
<head>
  <title>Statusbericht ${e(projectTitle)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; background: #d1d1d4; color: #000; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; line-height: 1.18; }
    .report-page { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm 15mm 12mm 15mm; page-break-after: always; background: #fff; overflow: hidden; }
    .report-page:last-child { page-break-after: auto; }
    .report-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 10mm; margin-bottom: 2mm; border-bottom: .45mm solid #e30613; padding-bottom: 1mm; }
    .report-heading h1 { margin: 0 0 2mm 0; color: #26485a; font-size: 12pt; line-height: 1.1; font-weight: 400; }
    .project-line { max-width: 118mm; color: #26485a; font-size: 7pt; font-weight: 400; line-height: 1.18; }
    .sparkasse-logo { display: flex; align-items: center; gap: 2.2mm; color: #e30613; font-size: 12.2pt; font-weight: 700; line-height: .98; white-space: nowrap; }
    .sparkasse-logo-text { display: flex; flex-direction: column; }
    .sparkasse-symbol { width: 9mm; height: 11.8mm; flex: 0 0 auto; display: block; }
    .section { margin-top: 3mm; }
    .section-title { margin: 0 0 1.8mm 0; border-bottom: .35mm solid #000; padding-bottom: .5mm; font-size: 7.3pt; font-weight: 700; }
    .status-section-title { margin: 0 0 4mm 0; border-bottom: .35mm solid #000; padding-bottom: .5mm; font-size: 10pt; font-weight: 700; }
    .kv-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .kv-table th, .kv-table td { padding: 0 5mm 3.2mm 0; border: 0; text-align: left; vertical-align: top; font-size: 6.6pt; }
    .kv-table th { width: 32mm; font-weight: 700; white-space: nowrap; }
    .kv-table td { width: 44mm; font-weight: 400; }
    .status-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .status-table th, .status-table td { padding: 0 0 6.5mm 0; border: 0; vertical-align: middle; font-size: 10pt; line-height: 1; }
    .status-table th { width: 47mm; text-align: left; font-weight: 400; }
    .status-table .status-result { width: 65mm; text-align: left; font-weight: 400; }
    .status-table .status-icon-cell { width: 48mm; text-align: center; }
    .status-value { display: inline-flex; align-items: center; justify-content: center; width: 100%; min-height: 6mm; line-height: 0; }
    .status-circle { display: block; width: 4.7mm; height: 4.7mm; margin: 0 auto; overflow: visible; }
    .progress-circle { display: inline-block; width: 6.8mm; height: 6.8mm; }
    .explain-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .explain-table th, .explain-table td { padding: 0 0 3mm 0; border: 0; vertical-align: top; font-size: 6.6pt; }
    .explain-table th { width: 42mm; text-align: left; font-weight: 400; }
    .explain-table td { padding-left: 3mm; }
    .data-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 2mm; }
    .data-table th, .data-table td { padding: 1mm 1.1mm; border: .35mm solid #000; text-align: left; vertical-align: top; font-size: 6.5pt; font-weight: 400; }
    .data-table th { font-weight: 700; }
    .milestone-table th:nth-child(1), .milestone-table td:nth-child(1) { width: 45mm; }
    .milestone-table th:nth-child(2), .milestone-table td:nth-child(2), .milestone-table th:nth-child(3), .milestone-table td:nth-child(3) { width: 23mm; }
    .milestone-table th:nth-child(4), .milestone-table td:nth-child(4) { width: 35mm; }
    .milestone-table th:nth-child(5), .milestone-table td:nth-child(5) { width: 22mm; }
    .risk-table th:nth-child(1), .risk-table td:nth-child(1) { width: 8mm; }
    .risk-table th:nth-child(2), .risk-table td:nth-child(2) { width: 72mm; }
    .risk-table th:nth-child(3), .risk-table td:nth-child(3) { width: 18mm; }
    .risk-table th:nth-child(4), .risk-table td:nth-child(4) { width: 22mm; }
    .risk-table th:nth-child(5), .risk-table td:nth-child(5) { width: 22mm; }
    .risk-table th:nth-child(6), .risk-table td:nth-child(6) { width: 9mm; text-align: center; }
    .risk-table th:nth-child(7), .risk-table td:nth-child(7) { width: 12mm; text-align: center; }
    .icon-cell { text-align: center; vertical-align: middle; padding-left: 0 !important; padding-right: 0 !important; line-height: 0; }
    .icon-cell .status-circle { margin: 0 auto; }
    .budget-table th, .budget-table td { font-size: 6.5pt; }
    .resource-block div { margin-bottom: 5mm; }
    .resource-label { display: inline-block; min-width: 43mm; font-weight: 700; }
    .risk-graph-section { margin-top: 5mm; }
    .risk-graph-title { margin-bottom: 1mm; font-size: 10pt; font-weight: 700; }
    .risk-graph { width: 112mm; height: 104mm; display: block; }
    .risk-graph-legend { display: grid; grid-template-columns: 14mm 1fr; gap: 1.5mm 4mm; margin-top: 2mm; width: 62mm; font-size: 8.5pt; }
    .risk-legend-title { grid-column: 1 / -1; font-size: 10pt; font-weight: 400; }
    .risk-color { width: 7mm; height: 7mm; display: block; }
    .legend-block { margin-top: 4mm; }
    .legend-block div { margin-bottom: 2mm; font-size: 7.3pt; }
    .signature-area { display: grid; grid-template-columns: repeat(3, 1fr); column-gap: 8mm; margin-top: 15mm; }
    .signature-line { border-top: 1px solid #000; padding-top: 1.6mm; font-size: 7pt; min-height: 11mm; }
    .signature-line.three { grid-column: 2; margin-top: 12mm; }
    .report-footer { position: absolute; left: 15mm; right: 15mm; bottom: 5mm; display: grid; grid-template-columns: 1fr auto; row-gap: 1mm; font-size: 8pt; color: #000; }
    .report-footer div:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 5mm; }
    .report-footer div:last-child { grid-column: 1 / -1; }
  </style>
</head>
<body>
  <section class="report-page">
    ${header}

    <div class="section">
      <div class="section-title">Allgemeine Projektinformation</div>
      <table class="kv-table">
        <tbody>
          <tr><th>Statusbericht zum:</th><td>${e(report.reportDate)}</td><th>Naechster Termin:</th><td>${e(report.nextMilestoneDate)}</td></tr>
          <tr><th>Zuletzt bearbeitet am:</th><td>${e(report.reportDate)}</td><th>von:</th><td>${e(report.owner)}</td></tr>
          <tr><th>Beginn (Plan):</th><td>${e(report.plannedStart)}</td><th>Ende (Plan):</th><td>${e(report.plannedEnd)}</td></tr>
          <tr><th>Projektleiter:</th><td>${e(report.owner)}</td><th>Stellvertreter:</th><td>${e(report.deputyLead)}</td></tr>
          <tr><th>Berichtszeitraum:</th><td>${e(report.reportPeriod)}</td><th></th><td></td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="status-section-title">Aktueller Status</div>
      <table class="status-table">
        <tbody>
          <tr><th>Projektfortschritt:</th><td class="status-result">${e(report.progress)} %</td><td class="status-icon-cell"><span class="status-value">${progressIcon()}</span></td></tr>
          <tr><th>Prognose Zielerreichung:</th><td class="status-result">${e(statusText(report.goalStatus))}</td><td class="status-icon-cell"><span class="status-value">${statusIcon(report.goalStatus)}</span></td></tr>
          <tr><th>Termineinhaltung:</th><td class="status-result">${e(statusText(report.scheduleStatus))}</td><td class="status-icon-cell"><span class="status-value">${statusIcon(report.scheduleStatus)}</span></td></tr>
          <tr><th>Ressourceneinhaltung:</th><td class="status-result">${e(report.resourceStatus)}</td><td class="status-icon-cell"><span class="status-value">${statusIcon(report.resourceStatus)}</span></td></tr>
          <tr><th>Budgeteinhaltung:</th><td class="status-result">${e(statusText(report.budgetStatus))}</td><td class="status-icon-cell"><span class="status-value">${statusIcon(report.budgetStatus)}</span></td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Erlaeuterungen und Massnahmen</div>
      <table class="explain-table">
        <tbody>
          <tr><th>Projektfortschritt:</th><td>${e(report.reportNotes)}</td></tr>
          <tr><th>Prognose Zielerreichung:</th><td>${e(report.projectGoal)}</td></tr>
          <tr><th>Termineinhaltung:</th><td>${e(report.scheduleStatus === 'Gelb' ? 'Die Termine werden beobachtet und die naechsten Meilensteine priorisiert.' : 'Die Termine liegen im Plan.')}</td></tr>
          <tr><th>Ressourceneinhaltung:</th><td>${e(report.resourceStatus === 'Rot' ? 'Die Ressourcenlage ist kritisch.' : 'Die Ressourcen stehen aktuell zur Verfuegung.')}</td></tr>
          <tr><th>Budgeteinhaltung:</th><td>${e(report.budgetStatus === 'Gelb' ? 'Das Budget wird beobachtet und mit den Kostenpositionen abgeglichen.' : 'Das Budget liegt im geplanten Rahmen.')}</td></tr>
          <tr><th>Veraenderungen in den<br>Risiken:</th><td>${e(report.risks.length ? 'Die aufgefuehrten Risiken werden im Projekt verfolgt.' : 'Die Risikobetrachtung hat sich nicht geaendert.')}</td></tr>
          <tr><th>Veraenderungen in den<br>Schnittstellen:</th><td>${e(report.interfaces.length ? 'Die Schnittstellen werden gemaess Statusliste nachverfolgt.' : 'In den externen und internen Schnittstellen hat sich keine Veraenderung ergeben.')}</td></tr>
          <tr><th>Qualitaet der<br>Zusammenarbeit:</th><td>${e(report.collaborationQuality)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Uebersicht Meilensteine und naechste Schritte</div>
      <table class="data-table milestone-table"><thead><tr><th>Meilenstein</th><th>Plan-<br>Termin</th><th>Neuer<br>Termin</th><th>Status</th><th>Fortsch<br>ritt</th><th>Statusnotiz</th></tr></thead></table>
    </div>
    ${footer(1)}
  </section>

  <section class="report-page">
    ${header}
    <table class="data-table milestone-table"><tbody>${milestoneRows}</tbody></table>

    <div class="section" style="margin-top: 15mm;">
      <div class="section-title">Naechste Schritte</div>
      <div>${e(report.nextSteps)}</div>
    </div>

    <div class="section" style="margin-top: 8mm;">
      <div class="section-title">Uebersicht Ressourcen und Budget</div>
      <div class="section-title" style="margin-top: 6mm;">Ressourcen</div>
      <div class="resource-block">
        <div><span class="resource-label">Plan-Aufwand:</span>${e(formatReportNumber(report.plannedEffortPt, ' PT'))}</div>
        <div><span class="resource-label">Ist-Aufwand:</span>${e(formatReportNumber(report.actualEffortPt, ' PT'))}</div>
        <div><span class="resource-label">Differenz (Plan-Ist):</span>${e(formatReportNumber(report.effortDifferencePt, ' PT'))}</div>
      </div>
      <table class="data-table risk-table"><thead><tr><th>Kuerz<br>el</th><th>Bezeichnung</th><th>Tragweite</th><th>Wahrsche<br>inlichkeit</th><th>Risikoklasse</th><th></th><th>Tendenz</th></tr></thead><tbody>${riskRows}<tr><td colspan="4"><strong>Gesamt-Klassifizierung</strong></td><td><strong>${e(report.risks[0] ? riskClass(report.risks[0]) : 'Keine')}</strong></td><td class="icon-cell">${report.risks[0] ? riskClassIcon(report.risks[0]) : ''}</td><td></td></tr></tbody></table>
    </div>
    ${footer(2)}
  </section>

  <section class="report-page">
    ${header}
    <div class="risk-graph-section">
      <div class="risk-graph-title">Risikograph</div>
      <svg class="risk-graph" viewBox="0 0 700 690" role="img" aria-label="Risikograph">
        <g transform="translate(70 50)">
          <rect x="0" y="0" width="540" height="540" fill="#10b95c" />
          <polygon points="108,216 162,216 162,270 216,270 216,324 270,324 270,378 324,378 324,432 540,432 540,270 432,270 432,216 378,216 378,162 324,162 324,108 270,108 270,0 108,0" fill="#ffd117" />
          <polygon points="270,0 540,0 540,270 432,270 432,216 378,216 378,162 324,162 324,108 270,108" fill="#ff3038" />
          <rect x="0" y="0" width="540" height="540" fill="none" stroke="#000000" stroke-width="2" />
        </g>
        <line x1="70" y1="590" x2="610" y2="590" stroke="#000" stroke-width="1.5" />
        <line x1="70" y1="50" x2="70" y2="590" stroke="#000" stroke-width="1.5" />
        ${riskAxisTicks}
        <text x="340" y="648" text-anchor="middle" font-size="13">Bedeutung/Tragweite</text>
        <text x="28" y="330" text-anchor="middle" font-size="13" transform="rotate(-90 28 330)">Wahrscheinlichkeit des Eintritts</text>
        ${riskGraphMarkers}
      </svg>
      <div class="risk-graph-legend">
        <div class="risk-legend-title">Legende: Risikoklassen</div>
        <svg class="risk-color" viewBox="0 0 20 20" aria-hidden="true"><rect x="1" y="1" width="18" height="18" fill="#ff3038" stroke="#000"/></svg><div>A-Risiko</div>
        <svg class="risk-color" viewBox="0 0 20 20" aria-hidden="true"><rect x="1" y="1" width="18" height="18" fill="#ffd117" stroke="#000"/></svg><div>B-Risiko</div>
        <svg class="risk-color" viewBox="0 0 20 20" aria-hidden="true"><rect x="1" y="1" width="18" height="18" fill="#10b95c" stroke="#000"/></svg><div>C-Risiko</div>
      </div>
    </div>

    <div class="legend-block" style="margin-top: 9mm;">
      <div class="section-title">Legende: Risiken</div>
      ${riskLegendRows}
    </div>

    <div class="section" style="margin-top: 8mm;">
      <div class="section-title">Budget</div>
      <table class="data-table budget-table"><thead><tr><th>Kosten-Kategorie</th><th>Plan [EUR]</th><th>Ist [EUR]</th><th>Differenz [EUR]</th><th>Ist [% von Plan]</th></tr></thead><tbody>${budgetRows}</tbody></table>
    </div>

    <div class="signature-area">
      <div class="signature-line">Projektverantwortlicher<br>${e(approvals.projectResponsible || report.projectSponsor)}</div>
      <div class="signature-line">GBL<br>${e(approvals.gbl || report.projectSponsor)}</div>
      <div class="signature-line">Projektleiter<br>${e(approvals.projectLead || report.owner)}</div>
    </div>
    ${footer(3)}
  </section>
</body>
</html>`;
}
function StatusReportPreview({ report, onClose }) {
  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameWindow = printFrame.contentWindow;
    const frameDocument = frameWindow?.document;
    if (!frameWindow || !frameDocument) {
      printFrame.remove();
      return;
    }

    frameDocument.open();
    frameDocument.write(getReportHtml(report));
    frameDocument.close();

    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      window.setTimeout(() => printFrame.remove(), 1000);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <section className="flex max-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#b84758]">Statusbericht</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{report.projectName}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{report.departmentName} / {report.reportDate} / {report.reportVersion}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrint} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#b84758] px-4 text-sm font-bold text-white transition hover:bg-[#a23d4d]">
              <Printer className="h-4 w-4" />
              PDF erstellen
            </button>
            <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['Projektleitung', report.owner],
              ['Stellvertretung', report.deputyLead],
              ['GBL', report.projectSponsor],
              ['Beginn Plan', report.plannedStart],
              ['Ende Plan', report.plannedEnd],
              ['Naechster Termin', report.nextMilestoneDate],
              ['Fortschritt', `${report.progress}%`],
              ['Planaufwand', formatReportNumber(report.plannedEffortPt, ' PT')],
              ['Ist-Aufwand', formatReportNumber(report.actualEffortPt, ' PT')],
              ['Planbudget', formatReportNumber(report.plannedBudget, ' EUR')],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-2 text-base font-extrabold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Projektziel</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{report.projectGoal}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Erlaeuterungen und Massnahmen</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{report.reportNotes}</p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ['Ziel', report.goalStatus],
              ['Termine', report.scheduleStatus],
              ['Ressourcen', report.resourceStatus],
              ['Budget', report.budgetStatus],
            ].map(([label, status]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusTone(status)}`}>{status}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <ReportTable title="Meilensteine" columns={['Titel', 'Plan', 'Neu', 'Status', '%']} rows={report.milestones.map((item) => [item.title, item.planDate || '-', item.newDate || '-', item.status, `${item.progress}%`])} />
            <ReportTable title="Risiken" columns={['Kuerzel', 'Risiko', 'Klasse', 'Tendenz']} rows={report.risks.map((item) => [item.code, item.title, item.riskClass || '-', item.trend || '-'])} />
          </div>
          <div className="mt-5">
            <ReportTable title="Schnittstellen" columns={['Schnittstelle', 'Status', 'Kommentar']} rows={report.interfaces.map((item) => [item.name, item.status, item.comment || '-'])} />
          </div>
          <div className="mt-5">
            <ReportTable title="Budget" columns={['Kategorie', 'Plan', 'Ist', 'Differenz', 'Ist %']} rows={report.budgetLines.map((item) => [item.category, formatReportNumber(item.plannedAmount, ' EUR'), formatReportNumber(item.actualAmount, ' EUR'), formatReportNumber(item.difference, ' EUR'), `${item.actualPercent ?? 0}%`])} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportTable({ title, columns, rows }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-extrabold text-slate-950">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
            <tr>{columns.map((column) => <th key={column} className="border-b border-slate-200 px-3 py-2">{column}</th>)}</tr>
          </thead>
          <tbody className="font-semibold text-slate-600">
            {rows.length ? rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="border-b border-slate-100 px-3 py-2">{cell}</td>)}</tr>
            )) : (
              <tr><td className="px-3 py-4 text-slate-400" colSpan={columns.length}>Keine Eintraege gepflegt.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
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
    const endTime = parseGermanDate(project.dueDate);
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
        <section className="rounded-[30px] border border-slate-300 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
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

        <section className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b84758]">Statusberichte</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">Projektbericht als Dokument erstellen</h2>
            </div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f2] text-[#b84758]">
              <FileText className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Projekt</span>
                <select value={selectedReportProjectId} onChange={(event) => setSelectedReportProjectId(event.target.value)} className={reportSelectClass}>
                  {projectCards.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4">
              {selectedReportProject ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{selectedReportProject.departmentName}</p>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-950">{selectedReportProject.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selectedReportProject.owner} / {selectedReportProject.reportProgress ?? selectedReportProject.progress}% Fortschritt</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    disabled={!statusReport}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-bold text-white transition hover:bg-[#253047] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <FileText className="h-4 w-4" />
                    Statusbericht erstellen
                  </button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-500">Kein Projekt fuer einen Statusbericht verfuegbar.</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <article className="h-full rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
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

          <article className="h-full rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
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
                        : 'border-slate-200 bg-[#fcfdff] hover:border-slate-400 hover:bg-white'
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
                      <p className="mt-2 min-w-0 break-words text-base font-extrabold leading-6 text-slate-950">
                        {activeProject.owner}
                      </p>
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

        <section className="rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Projekt-Zeitachse</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Waehle ein Projekt aus, dann siehst du nur dessen Verlauf auf einer ruhigen Zeitachse. Auf der Achse stehen
                nur kompakte Marker wie <span className="font-extrabold text-slate-700">MS1</span> oder
                <span className="font-extrabold text-slate-700"> MS2</span>; die Details erscheinen erst darunter.
              </p>
            </div>
            <label className="w-full max-w-[320px] space-y-2">
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Projekt fuer Zeitachse</span>
              <select
                value={selectedTimelineProjectId}
                onChange={(event) => setSelectedTimelineProjectId(event.target.value)}
                className={reportSelectClass}
              >
                <option value="">Projekt auswaehlen</option>
                {timelineProjectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!selectedTimelineProject ? (
            <div className="mt-8 flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-[#fcfdff] px-6 py-10 text-center">
              <div className="max-w-md">
                <p className="text-lg font-extrabold text-slate-950">Bitte zuerst ein Projekt auswaehlen</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Danach wird die Zeitachse nur fuer dieses Projekt angezeigt, damit der Verlauf deutlich und nicht ueberladen ist.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Projektlaufzeit</p>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4e7] text-[#c26a34]">
                      <Flag className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{selectedTimelineProject.durationDays} Tage</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {formatShortDate(selectedTimelineProject.startTime)} bis {formatShortDate(selectedTimelineProject.endTime)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Naechster Meilenstein</p>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#4875c8]">
                      <Clock3 className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-base font-extrabold leading-6 text-slate-950">
                    {selectedTimelineProject.nextTask?.title || 'Kein offener Meilenstein'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {selectedTimelineProject.nextTask
                      ? formatLongDate(selectedTimelineProject.nextTask.endTime)
                      : 'Alle aktuellen Punkte abgeschlossen'}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Aktive Tickets</p>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eefaf4] text-[#1f7a4f]">
                      <CircleDot className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{selectedTimelineStats?.activeCount || 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Gerade in Bearbeitung im ausgewaehlten Projekt.</p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Im Review</p>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f2ebff] text-[#7c59dc]">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{selectedTimelineStats?.reviewCount || 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Ø geplante Ticketdauer {selectedTimelineStats?.avgDuration || 0} Tage.
                  </p>
                </div>
              </div>

              <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfdff]">
                <div className="border-b border-slate-200 bg-white px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{selectedTimelineProject.departmentName}</p>
                      <h3 className="mt-2 text-[1.5rem] font-extrabold leading-tight text-slate-950">{selectedTimelineProject.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{selectedTimelineProject.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-[#f0d6db] bg-[#fff7f8] px-4 py-3 text-sm font-semibold text-[#8c4150]">
                      {selectedTimelineProject.owner} • {selectedTimelineProject.progress}% Fortschritt
                    </div>
                  </div>
                </div>

                <div className="px-5 py-6">
                  <div className="overflow-x-auto pb-3">
                    <div className="min-w-[1180px] rounded-[26px] border border-slate-200 bg-white px-6 py-8">
                      <div className="relative h-[280px]">
                        {selectedTimelineRange?.months.map((segment) => (
                          <div
                            key={segment.key}
                            className="absolute inset-y-0 border-l border-slate-100 first:border-l-0"
                            style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
                          >
                            <span className="absolute left-3 top-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                              {segment.label}
                            </span>
                          </div>
                        ))}

                        <div className="absolute left-0 right-0 top-[156px] h-[2px] bg-slate-200" />

                        {selectedTimelineRange ? (
                          <div
                            className="absolute top-[148px] h-4 rounded-full bg-gradient-to-r from-[#f0b5bf] via-[#d86a7c] to-[#b84758] shadow-[0_10px_24px_rgba(184,71,88,0.18)]"
                            style={{
                              ...getTimelineSpan(
                                selectedTimelineProject.startTime,
                                selectedTimelineProject.endTime,
                                selectedTimelineRange.rangeStart,
                                selectedTimelineRange.totalRange,
                              ),
                            }}
                          />
                        ) : null}

                        {selectedTimelineEntries.map((entry) => {
                          const left = selectedTimelineRange
                            ? ((entry.time - selectedTimelineRange.rangeStart) / selectedTimelineRange.totalRange) * 100
                            : 0;
                          const isActive = selectedTimelineEntry?.id === entry.id;

                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => setSelectedTimelineEntryId(entry.id)}
                              className="absolute -translate-x-1/2 text-center"
                              style={{ left: `${left}%`, top: '86px' }}
                            >
                              <span
                                className={`inline-flex h-11 min-w-[52px] items-center justify-center rounded-2xl border px-3 text-xs font-extrabold uppercase tracking-[0.14em] transition ${
                                  isActive
                                    ? 'border-[#b84758] bg-[#b84758] text-white shadow-[0_12px_24px_rgba(184,71,88,0.22)]'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                }`}
                              >
                                {entry.shortLabel}
                              </span>
                              <span className="relative mx-auto mt-4 block h-10 w-px bg-slate-300">
                                <span
                                  className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-sm"
                                  style={{ backgroundColor: entry.tone.bar }}
                                />
                              </span>
                              <span className="mt-3 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                {formatShortDate(entry.time)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <article className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Ausgewaehlter Punkt</p>
                          <h4 className="mt-2 text-xl font-extrabold text-slate-950">{selectedTimelineEntry?.title}</h4>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedTimelineEntry?.tone.tone || 'bg-slate-100 text-slate-600'}`}>
                          {selectedTimelineEntry?.typeLabel}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-[#f8fafc] p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Datum</p>
                          <p className="mt-2 text-base font-extrabold text-slate-950">
                            {selectedTimelineEntry ? formatLongDate(selectedTimelineEntry.time) : '-'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#f8fafc] p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Verantwortung</p>
                          <p className="mt-2 text-base font-extrabold text-slate-950">{selectedTimelineEntry?.subtitle || '-'}</p>
                        </div>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-slate-600">
                        {selectedTimelineEntry?.description || 'Keine weitere Beschreibung vorhanden.'}
                      </p>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-[#fcfdff] p-4">
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Zusatzinfo</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedTimelineEntry?.meta}</p>
                      </div>
                    </article>

                    <article className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Milestone-Navigator</p>
                          <h4 className="mt-2 text-xl font-extrabold text-slate-950">Alle Marker</h4>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {selectedTimelineEntries.length} Punkte
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {selectedTimelineEntries.map((entry) => {
                          const isActive = selectedTimelineEntry?.id === entry.id;

                          return (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => setSelectedTimelineEntryId(entry.id)}
                              className={`rounded-[18px] border p-4 text-left transition ${
                                isActive
                                  ? 'border-[#e8a9b3] bg-[#fff7f8] shadow-[0_10px_24px_rgba(184,71,88,0.08)]'
                                  : 'border-slate-200 bg-[#fcfdff] hover:border-slate-300 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-extrabold text-slate-950">{entry.shortLabel}</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-500">{entry.title}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${entry.tone.tone}`}>
                                  {entry.typeLabel}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-semibold text-[#8c4150]">{formatLongDate(entry.time)}</p>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  </div>
                </div>
              </article>
            </div>
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
          <article className="h-full rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
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
                <div key={member.name} className="grid min-h-[220px] min-w-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-lg font-extrabold leading-6 text-slate-950">{member.name}</p>
                      <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-500">{member.role}</p>
                    </div>
                    <p className="max-w-[3.5rem] shrink-0 text-right text-lg font-extrabold leading-6 text-slate-950">{member.load}%</p>
                  </div>
                  <div />
                  <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full"
                      style={{ width: `${member.load}%`, backgroundColor: member.tone }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="h-full rounded-[30px] border border-slate-300 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
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
      {previewOpen && statusReport ? (
        <StatusReportPreview report={statusReport} onClose={() => setPreviewOpen(false)} />
      ) : null}
    </AppShell>
  );
}
