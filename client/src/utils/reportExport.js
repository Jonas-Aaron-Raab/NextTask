import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatReportNumber(value, suffix = '') {
  if (value === null || value === undefined || value === '') return 'Noch offen';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 'Noch offen';
  return `${new Intl.NumberFormat('de-DE').format(parsed)}${suffix}`;
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
          <tr><th>Statusbericht zum:</th><td>${e(report.reportDate)}</td><th>Nächster Termin:</th><td>${e(report.nextMilestoneDate)}</td></tr>
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
      <div class="section-title">Erläuterungen und Maßnahmen</div>
      <table class="explain-table">
        <tbody>
          <tr><th>Projektfortschritt:</th><td>${e(report.reportNotes)}</td></tr>
          <tr><th>Prognose Zielerreichung:</th><td>${e(report.projectGoal)}</td></tr>
          <tr><th>Termineinhaltung:</th><td>${e(report.scheduleStatus === 'Gelb' ? 'Die Termine werden beobachtet und die nächsten Meilensteine priorisiert.' : 'Die Termine liegen im Plan.')}</td></tr>
          <tr><th>Ressourceneinhaltung:</th><td>${e(report.resourceStatus === 'Rot' ? 'Die Ressourcenlage ist kritisch.' : 'Die Ressourcen stehen aktuell zur Verfuegung.')}</td></tr>
          <tr><th>Budgeteinhaltung:</th><td>${e(report.budgetStatus === 'Gelb' ? 'Das Budget wird beobachtet und mit den Kostenpositionen abgeglichen.' : 'Das Budget liegt im geplanten Rahmen.')}</td></tr>
          <tr><th>Veränderungen in den<br>Risiken:</th><td>${e(report.risks.length ? 'Die aufgeführten Risiken werden im Projekt verfolgt.' : 'Die Risikobetrachtung hat sich nicht geändert.')}</td></tr>
          <tr><th>Veränderungen in den<br>Schnittstellen:</th><td>${e(report.interfaces.length ? 'Die Schnittstellen werden gemäß Statusliste nachverfolgt.' : 'In den externen und internen Schnittstellen hat sich keine Veränderung ergeben.')}</td></tr>
          <tr><th>Qualität der<br>Zusammenarbeit:</th><td>${e(report.collaborationQuality)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Übersicht Meilensteine und nächste Schritte</div>
      <table class="data-table milestone-table"><thead><tr><th>Meilenstein</th><th>Plan-<br>Termin</th><th>Neuer<br>Termin</th><th>Status</th><th>Fortsch<br>ritt</th><th>Statusnotiz</th></tr></thead></table>
    </div>
    ${footer(1)}
  </section>

  <section class="report-page">
    ${header}
    <table class="data-table milestone-table"><tbody>${milestoneRows}</tbody></table>

    <div class="section" style="margin-top: 15mm;">
      <div class="section-title">Nächste Schritte</div>
      <div>${e(report.nextSteps)}</div>
    </div>

    <div class="section" style="margin-top: 8mm;">
      <div class="section-title">Übersicht Ressourcen und Budget</div>
      <div class="section-title" style="margin-top: 6mm;">Ressourcen</div>
      <div class="resource-block">
        <div><span class="resource-label">Plan-Aufwand:</span>${e(formatReportNumber(report.plannedEffortPt, ' PT'))}</div>
        <div><span class="resource-label">Ist-Aufwand:</span>${e(formatReportNumber(report.actualEffortPt, ' PT'))}</div>
        <div><span class="resource-label">Differenz (Plan-Ist):</span>${e(formatReportNumber(report.effortDifferencePt, ' PT'))}</div>
      </div>
      <table class="data-table risk-table"><thead><tr><th>Kürz<br>el</th><th>Bezeichnung</th><th>Tragweite</th><th>Wahrsche<br>inlichkeit</th><th>Risikoklasse</th><th></th><th>Tendenz</th></tr></thead><tbody>${riskRows}<tr><td colspan="4"><strong>Gesamt-Klassifizierung</strong></td><td><strong>${e(report.risks[0] ? riskClass(report.risks[0]) : 'Keine')}</strong></td><td class="icon-cell">${report.risks[0] ? riskClassIcon(report.risks[0]) : ''}</td><td></td></tr></tbody></table>
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

function sanitizeFilename(value) {
  return String(value || 'statusbericht')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'statusbericht';
}

function waitForReportFrame(frame, frameDocument) {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.setTimeout(resolve, 350);
    };

    if (frameDocument.readyState === 'complete') {
      finish();
      return;
    }

    frame.addEventListener('load', finish, { once: true });
    window.setTimeout(finish, 1200);
  });
}

async function downloadStatusReportPdf(report) {
  const renderFrame = document.createElement('iframe');
  renderFrame.style.position = 'fixed';
  renderFrame.style.left = '-10000px';
  renderFrame.style.top = '0';
  renderFrame.style.width = '210mm';
  renderFrame.style.height = '297mm';
  renderFrame.style.opacity = '0';
  renderFrame.style.pointerEvents = 'none';
  renderFrame.style.border = '0';
  document.body.appendChild(renderFrame);

  const frameWindow = renderFrame.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    renderFrame.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(getReportHtml(report));
  frameDocument.close();

  try {
    await waitForReportFrame(renderFrame, frameDocument);
    if (frameDocument.fonts?.ready) {
      await frameDocument.fonts.ready;
    }

    const pageNodes = Array.from(frameDocument.querySelectorAll('.report-page'));
    if (!pageNodes.length) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let index = 0; index < pageNodes.length; index += 1) {
      const pageNode = pageNodes[index];
      const canvas = await html2canvas(pageNode, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        width: pageNode.scrollWidth,
        height: pageNode.scrollHeight,
        windowWidth: pageNode.scrollWidth,
        windowHeight: pageNode.scrollHeight,
      });

      const imageData = canvas.toDataURL('image/png', 1);
      if (index > 0) pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    }

    pdf.save(`statusbericht-${sanitizeFilename(report.projectName)}.pdf`);
  } finally {
    renderFrame.remove();
  }
}

export { downloadStatusReportPdf, getReportHtml };
