import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  History,
  Link2,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { initialDepartments, initialProjects } from './ProjectsPage';
import { initialTasks } from './MyTasksPage';

const createMenuItems = ['Neue Seite', 'Neues Dokument', 'Neue Vorlage', 'Upload Nachweis'];

const typeOptions = ['Alle Typen', 'Richtlinie', 'Kontrollnachweis', 'Projektunterlage', 'Vorlage', 'Prozessdokument'];
const statusOptions = ['Alle Stati', 'Entwurf', 'In Pruefung', 'Freigegeben', 'Abgelaufen'];

const documents = [
  {
    id: 'doc-1',
    title: 'Mobile Banking Fachkonzept',
    department: 'Digitales Banking',
    project: 'Mobile Banking Relaunch',
    type: 'Projektunterlage',
    status: 'In Pruefung',
    classification: 'Vertraulich',
    owner: 'Lisa Wagner',
    version: 'v2.3',
    reviewDate: '12. Juni 2026',
    retention: '31.12.2027',
    summary: 'Fachkonzept fuer Kontoansicht, Karten-Services und digitale Self-Services.',
    linkedTasks: ['Hero-Text und CTA fuer Startseite finalisieren', 'Responsive Navigation auf iPhone Breakpoints pruefen'],
    controls: ['CTRL-WEB-204', 'CTRL-UI-118'],
    auditTrail: ['29. Mai 2026: Version 2.3 hochgeladen', '28. Mai 2026: Datenschutz-Hinweise angepasst'],
  },
  {
    id: 'doc-2',
    title: 'QA Freigabeprotokoll Checkout',
    department: 'Qualitaetssicherung',
    project: 'Checkout Testprogramm',
    type: 'Kontrollnachweis',
    status: 'Freigegeben',
    classification: 'Reguliert',
    owner: 'Tom Becker',
    version: 'v1.8',
    reviewDate: '04. Juni 2026',
    retention: '31.12.2028',
    summary: 'Revisionssichere Sammeldokumentation fuer Testlauf, Befunde und Freigaben.',
    linkedTasks: ['Checkout-Testlauf dokumentieren und an QA geben'],
    controls: ['CTRL-QA-332', 'CTRL-PAY-771'],
    auditTrail: ['30. Mai 2026: Freigabe durch QA erteilt', '29. Mai 2026: Defect-Liste angehaengt'],
  },
  {
    id: 'doc-3',
    title: 'Sparkassen Kampagnenbriefing',
    department: 'Marketing und Content',
    project: 'Sparkassen Herbstkampagne',
    type: 'Projektunterlage',
    status: 'Entwurf',
    classification: 'Intern',
    owner: 'Sarah Nguyen',
    version: 'v0.9',
    reviewDate: '18. Juni 2026',
    retention: '31.12.2026',
    summary: 'Briefing fuer Landingpages, Anzeigenbausteine und Freigabeprozess der Kampagne.',
    linkedTasks: ['Sparkassen-Landingpage Teaser fuer Startseite abstimmen'],
    controls: ['CTRL-SPK-301'],
    auditTrail: ['30. Mai 2026: Copy-Entwurf aktualisiert', '27. Mai 2026: Bildsprache mit Marken-Team abgestimmt'],
  },
  {
    id: 'doc-4',
    title: 'Freigabe-Cockpit Kontrollmatrix',
    department: 'Produkt und Compliance',
    project: 'Freigabe-Cockpit',
    type: 'Kontrollnachweis',
    status: 'In Pruefung',
    classification: 'Streng vertraulich',
    owner: 'Anna Becker',
    version: 'v1.4',
    reviewDate: '07. Juni 2026',
    retention: '31.12.2029',
    summary: 'Kontrollmatrix fuer Freigaben, Evidenz und regulatorische Nachweise je Fachbereich.',
    linkedTasks: ['Texte fuer Pricing-Seite abstimmen'],
    controls: ['CTRL-PRC-551', 'CTRL-WEB-204'],
    auditTrail: ['30. Mai 2026: Kontroll-ID nachgezogen', '28. Mai 2026: Vier-Augen-Pruefung gestartet'],
  },
  {
    id: 'doc-5',
    title: 'Service Anfrage-Cockpit Leitfaden',
    department: 'Kundenservice',
    project: 'Service Anfrage-Cockpit',
    type: 'Prozessdokument',
    status: 'Freigegeben',
    classification: 'Intern',
    owner: 'Nina Hoffmann',
    version: 'v3.1',
    reviewDate: '22. Juni 2026',
    retention: '31.12.2027',
    summary: 'Leitfaden fuer Rueckfragen, Eskalationspfade und SLA-Handling im Service.',
    linkedTasks: ['Onboarding-Mails in deutsch ueberarbeiten'],
    controls: ['CTRL-SRV-110'],
    auditTrail: ['30. Mai 2026: SLA-Hinweise aktualisiert', '25. Mai 2026: Leitfaden freigegeben'],
  },
  {
    id: 'doc-6',
    title: 'Vorlage Datenschutz-Folgenbewertung',
    department: 'Produkt und Compliance',
    project: 'Freigabe-Cockpit',
    type: 'Vorlage',
    status: 'Freigegeben',
    classification: 'Reguliert',
    owner: 'Anna Becker',
    version: 'v2.0',
    reviewDate: '14. Juni 2026',
    retention: '31.12.2030',
    summary: 'Standardisierte Vorlage fuer DSFA, Fachfreigabe und technische Kontrollpunkte.',
    linkedTasks: [],
    controls: ['CTRL-DSFA-019'],
    auditTrail: ['27. Mai 2026: Vorlage freigegeben', '22. Mai 2026: Felder fuer Datenkategorien erweitert'],
  },
];

const knowledgeSpaces = initialDepartments.map((department, index) => ({
  id: department.id,
  title: department.name,
  description: department.description,
  lead: department.lead,
  docsCount: documents.filter((document) => document.department === department.name).length,
  tone: [
    'bg-[#fff7f8] border-[#f1c6ce]',
    'bg-[#f4f8ff] border-[#d8e6fb]',
    'bg-[#effbf7] border-[#d5eee7]',
    'bg-[#fff8ef] border-[#f5dfc7]',
    'bg-[#f3fbf6] border-[#d7e8df]',
  ][index % 5],
}));

const templates = [
  'Vorlage Datenschutz-Folgenbewertung',
  'Kontrollnachweis fuer Freigaben',
  'Projektsteckbrief Sparkasse',
  'Audit-Protokoll fuer Revision',
];

function classificationTone(value) {
  if (value === 'Streng vertraulich') return 'bg-[#fff0f2] text-[#b84758]';
  if (value === 'Reguliert') return 'bg-[#fff6e8] text-[#b76c12]';
  if (value === 'Vertraulich') return 'bg-[#edf4ff] text-[#4875c8]';
  return 'bg-[#eefaf4] text-[#1f7a4f]';
}

function statusTone(value) {
  if (value === 'Freigegeben') return 'bg-[#eefaf4] text-[#1f7a4f]';
  if (value === 'In Pruefung') return 'bg-[#fff6e8] text-[#b76c12]';
  if (value === 'Abgelaufen') return 'bg-[#fff0f2] text-[#b84758]';
  return 'bg-[#edf4ff] text-[#4875c8]';
}

function DocumentModal({ document, onClose }) {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl rounded-[30px] border border-[#f1c6ce] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-[#f1c6ce] hover:text-[#b84758]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-200 px-7 pb-5 pt-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#b84758]">Dokumentendetails</p>
          <h2 className="mt-3 text-[2rem] font-extrabold tracking-tight text-slate-950">{document.title}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(document.status)}`}>{document.status}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${classificationTone(document.classification)}`}>
              {document.classification}
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-bold text-slate-600">{document.type}</span>
          </div>
        </div>

        <div className="grid gap-6 p-7 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <section className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
              <h3 className="text-lg font-extrabold text-slate-950">Beschreibung</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{document.summary}</p>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
              <h3 className="text-lg font-extrabold text-slate-950">Verknuepfte Aufgaben</h3>
              <div className="mt-4 space-y-3">
                {document.linkedTasks.length ? (
                  document.linkedTasks.map((task) => (
                    <div key={task} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                      {task}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-400">
                    Noch keine Aufgaben verknuepft.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
              <h3 className="text-lg font-extrabold text-slate-950">Audit Trail</h3>
              <div className="mt-4 space-y-3">
                {document.auditTrail.map((entry) => (
                  <div key={entry} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    {entry}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
              <h3 className="text-lg font-extrabold text-slate-950">Metadaten</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  ['Abteilung', document.department],
                  ['Projekt', document.project],
                  ['Verantwortung', document.owner],
                  ['Version', document.version],
                  ['Naechste Pruefung', document.reviewDate],
                  ['Aufbewahrung', document.retention],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
              <h3 className="text-lg font-extrabold text-slate-950">Kontroll-IDs</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {document.controls.map((control) => (
                  <span key={control} className="rounded-full bg-[#fff7f8] px-3 py-2 text-xs font-bold text-[#b84758]">
                    {control}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('Alle Abteilungen');
  const [selectedType, setSelectedType] = useState(typeOptions[0]);
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
  const [activeDocumentId, setActiveDocumentId] = useState(null);

  const activeDocument = documents.find((document) => document.id === activeDocumentId) || null;

  const filteredDocuments = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        [document.title, document.department, document.project, document.owner, document.summary].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesDepartment = selectedDepartment === 'Alle Abteilungen' || document.department === selectedDepartment;
      const matchesType = selectedType === 'Alle Typen' || document.type === selectedType;
      const matchesStatus = selectedStatus === 'Alle Stati' || document.status === selectedStatus;

      return matchesSearch && matchesDepartment && matchesType && matchesStatus;
    });
  }, [searchValue, selectedDepartment, selectedStatus, selectedType]);

  const visibleProjects = useMemo(() => {
    const departmentFilter = selectedDepartment === 'Alle Abteilungen'
      ? initialProjects
      : initialProjects.filter((project) => {
          const department = initialDepartments.find((item) => item.id === project.departmentId);
          return department?.name === selectedDepartment;
        });
    return departmentFilter.length;
  }, [selectedDepartment]);

  const policyCount = documents.filter((document) => document.type === 'Richtlinie' || document.type === 'Prozessdokument').length;
  const evidenceCount = documents.filter((document) => document.type === 'Kontrollnachweis').length;
  const reviewCount = documents.filter((document) => document.status === 'In Pruefung').length;
  const confidentialCount = documents.filter((document) => document.classification !== 'Intern').length;

  return (
    <AppShell
      activeItem="Dokumente"
      hideBreadcrumb
      searchPlacement="actions"
      searchValue={searchValue}
      onSearch={setSearchValue}
      createMenuItems={createMenuItems}
    >
      <div className="space-y-7">
        <section className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-[2.4rem] font-extrabold tracking-tight text-slate-950">Dokumente</h1>
              <p className="mt-3 text-base leading-7 text-slate-500">
                Zentrale Wissens-, Freigabe- und Nachweisplattform fuer Projekte, Prozesse und regulatorische Anforderungen.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[760px]">
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Abteilung</span>
                <select
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                >
                  <option>Alle Abteilungen</option>
                  {initialDepartments.map((department) => (
                    <option key={department.id}>{department.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Dokumenttyp</span>
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                >
                  {typeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">Status</span>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12"
                >
                  {statusOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {[
            {
              label: 'Freigegebene Dokumente',
              value: documents.filter((document) => document.status === 'Freigegeben').length,
              detail: 'revisionssicher verfuegbar',
              icon: CheckCircle2,
              tone: 'bg-[#eefaf4] text-[#1f7a4f]',
            },
            {
              label: 'Dokumente in Pruefung',
              value: reviewCount,
              detail: 'offene Freigaben und Reviews',
              icon: Clock3,
              tone: 'bg-[#fff6e8] text-[#b76c12]',
            },
            {
              label: 'Kontrollnachweise',
              value: evidenceCount,
              detail: `${visibleProjects} Projekte verknuepft`,
              icon: ShieldCheck,
              tone: 'bg-[#fff0f2] text-[#b84758]',
            },
            {
              label: 'Vertrauliche Dokumente',
              value: confidentialCount,
              detail: 'mit Klassifizierung markiert',
              icon: LockKeyhole,
              tone: 'bg-[#edf4ff] text-[#4875c8]',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-[26px] border border-[#f1c6ce] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start gap-3">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
                <p className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">{item.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Dokumentenbibliothek</h2>
              </div>
              <span className="rounded-full bg-[#fff7f8] px-4 py-2 text-sm font-bold text-[#b84758]">
                {filteredDocuments.length} sichtbar
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {filteredDocuments.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => setActiveDocumentId(document.id)}
                  className="w-full rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5 text-left transition hover:border-[#f1c6ce] hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(document.status)}`}>{document.status}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${classificationTone(document.classification)}`}>
                          {document.classification}
                        </span>
                        <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-bold text-slate-600">{document.type}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-extrabold leading-tight text-slate-950">{document.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{document.summary}</p>
                    </div>

                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7f8] text-[#b84758]">
                      <Eye className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    {[
                      ['Abteilung', document.department],
                      ['Projekt', document.project],
                      ['Version', document.version],
                      ['Naechste Pruefung', document.reviewDate],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">{label}</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </article>

          <div className="space-y-6">
            <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Wissensbereiche</h2>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#4875c8]">
                  <BookOpen className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {knowledgeSpaces.map((space) => (
                  <div key={space.id} className={`rounded-[22px] border p-4 ${space.tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-950">{space.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{space.description}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{space.docsCount}</span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-500">Lead: {space.lead}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Pruefung &amp; Fristen</h2>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6e8] text-[#b76c12]">
                  <Clock3 className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {documents
                  .filter((document) => document.status === 'In Pruefung' || document.status === 'Abgelaufen')
                  .slice(0, 4)
                  .map((document) => (
                    <div key={document.id} className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                      <p className="text-sm font-extrabold text-slate-950">{document.title}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{document.reviewDate}</p>
                    </div>
                  ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-[#f1c6ce] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Vorlagen &amp; Nachweise</h2>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f2] text-[#b84758]">
                  <Upload className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {templates.map((template) => (
                  <div key={template} className="rounded-[22px] border border-slate-200 bg-[#fcfdff] px-4 py-3 text-sm font-semibold text-slate-700">
                    {template}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>

      <DocumentModal document={activeDocument} onClose={() => setActiveDocumentId(null)} />
    </AppShell>
  );
}
