import { CircleDot, Clock3, Download, FileText, Flag, Users } from 'lucide-react';
import AppShell from '../../components/AppShell';
import { DonutChart, ReportFilterField } from './ReportWidgets';
import StatusReportPreview from './StatusReportPreview';
import { reportSelectClass } from './styles';
import { formatLongDate, formatReportShortDate, getTimelineSpan } from '../../utils/calendar';

export default function ReportsContent(props) {
  const { searchValue, setSearchValue, periods, selectedPeriod, setSelectedPeriod, departmentOptions, selectedDepartment, setSelectedDepartment, exportFormat, setExportFormat, projectOptions, selectedProject, setSelectedProject, selectedReportProjectId, setSelectedReportProjectId, projectCards, selectedReportProject, statusReport, previewOpen, setPreviewOpen, taskStatusSegments, filteredProjects, activeProject, setActiveProjectId, selectedTimelineProjectId, setSelectedTimelineProjectId, timelineProjectOptions, selectedTimelineProject, selectedTimelineRange, selectedTimelineStats, selectedTimelineEntries, selectedTimelineEntry, setSelectedTimelineEntryId, teamLoad, taskMetrics, attentionProject, searchSuggestions, getReportHtml } = props;

  return (
    <AppShell
      activeItem="Reports"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Reports"
      searchValue={searchValue}
      onSearch={setSearchValue}
      searchSuggestions={searchSuggestions}
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
                <p className="text-sm font-semibold text-slate-500">Kein Projekt für einen Statusbericht verfuegbar.</p>
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
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Projekt für Zeitachse</span>
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
                  Danach wird die Zeitachse nur für dieses Projekt angezeigt, damit der Verlauf deutlich und nicht überladen ist.
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
                    {formatReportShortDate(selectedTimelineProject.startTime)} bis {formatReportShortDate(selectedTimelineProject.endTime)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Nächster Meilenstein</p>
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
                  <p className="mt-1 text-sm font-semibold text-slate-500">Gerade in Bearbeitung im ausgewählten Projekt.</p>
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
                                {formatReportShortDate(entry.time)}
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
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Überfällig</p>
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
        <StatusReportPreview report={statusReport} onClose={() => setPreviewOpen(false)} getReportHtml={getReportHtml} />
      ) : null}
    </AppShell>
  );
}
