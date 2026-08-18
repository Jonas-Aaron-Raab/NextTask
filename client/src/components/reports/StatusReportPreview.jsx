import { Printer, X } from 'lucide-react';

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


export default function StatusReportPreview({ report, onClose, getReportHtml }) {
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
              ['Nächster Termin', report.nextMilestoneDate],
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
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Erläuterungen und Maßnahmen</p>
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
            <ReportTable title="Risiken" columns={['Kürzel', 'Risiko', 'Klasse', 'Tendenz']} rows={report.risks.map((item) => [item.code, item.title, item.riskClass || '-', item.trend || '-'])} />
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
              <tr><td className="px-3 py-4 text-slate-400" colSpan={columns.length}>Keine Einträge gepflegt.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
