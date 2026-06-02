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
const documentSelectClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#b84758] focus:ring-4 focus:ring-[#b84758]/12';

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
    'bg-[#fff7f8] border-slate-300',
    'bg-[#f4f8ff] border-slate-300',
    'bg-[#effbf7] border-slate-300',
    'bg-[#fff8ef] border-slate-300',
    'bg-[#f3fbf6] border-slate-300',
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

function DocumentFilterField({ label, value, onChange, children }) {
  return (
    <label className="min-w-[180px] flex-1 space-y-2">
      <span className="block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <select value={value} onChange={onChange} className={documentSelectClass}>
        {children}
      </select>
    </label>
  );
}

function DocumentModal({ document, onClose }) {
  if (!document) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-3 py-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-slate-300 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Dokumentendetails schliessen"
          className="absolute left-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-slate-400 hover:text-[#b84758]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-200 px-5 pb-4 pl-18 pt-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[#b84758]">Dokumentendetails</p>
          <h2 className="mt-2 text-[1.55rem] font-extrabold leading-tight tracking-tight text-slate-950">{document.title}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(document.status)}`}>{document.status}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${classificationTone(document.classification)}`}>
              {document.classification}
            </span>
            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-bold text-slate-600">{document.type}</span>
          </div>
        </div>

        <div className="grid min-h-0 gap-4 overflow-hidden p-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <section className="rounded-[20px] border border-slate-200 bg-[#fcfdff] p-4">
              <h3 className="text-base font-extrabold text-slate-950">Beschreibung</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{document.summary}</p>
            </section>

            <section className="rounded-[20px] border border-slate-200 bg-[#fcfdff] p-4">
              <h3 className="text-base font-extrabold text-slate-950">Verknuepfte Aufgaben</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {document.linkedTasks.length ? (
                  document.linkedTasks.map((task) => (
                    <div key={task} className="rounded-2xl bg-white px-3 py-2.5 text-sm font-semibold leading-5 text-slate-700">
                      {task}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-400">
                    Noch keine Aufgaben verknuepft.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[20px] border border-slate-200 bg-[#fcfdff] p-4">
              <h3 className="text-base font-extrabold text-slate-950">Audit Trail</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {document.auditTrail.map((entry) => (
                  <div key={entry} className="rounded-2xl bg-white px-3 py-2.5 text-sm font-semibold leading-5 text-slate-700">
                    {entry}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[20px] border border-slate-200 bg-[#fcfdff] p-4">
              <h3 className="text-base font-extrabold text-slate-950">Metadaten</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  ['Abteilung', document.department],
                  ['Projekt', document.project],
                  ['Verantwortung', document.owner],
                  ['Version', document.version],
                  ['Naechste Pruefung', document.reviewDate],
                  ['Aufbewahrung', document.retention],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white p-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-1.5 break-words text-sm font-bold leading-5 text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[20px] border border-slate-200 bg-[#fcfdff] p-4">
              <h3 className="text-base font-extrabold text-slate-950">Kontroll-IDs</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {document.controls.map((control) => (
                  <span key={control} className="rounded-full bg-[#fff7f8] px-3 py-1.5 text-xs font-bold text-[#b84758]">
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
  const [activeSection, setActiveSection] = useState('library');

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
  const reviewDocuments = documents
    .filter((document) => document.status === 'In Pruefung' || document.status === 'Abgelaufen')
    .slice(0, 4);

  const sectionCards = [
    {
      id: 'library',
      title: 'Dokumentenbibliothek',
      description: 'Alle Dokumente durchsuchen und oeffnen',
      count: filteredDocuments.length,
      icon: FileText,
      tone: 'bg-[#fff7f8] text-[#b84758]',
    },
    {
      id: 'spaces',
      title: 'Wissensbereiche',
      description: 'Abteilungswissen und Spaces',
      count: knowledgeSpaces.length,
      icon: BookOpen,
      tone: 'bg-[#edf4ff] text-[#4875c8]',
    },
    {
      id: 'reviews',
      title: 'Pruefung & Fristen',
      description: 'Offene Reviews und Fristen',
      count: reviewDocuments.length,
      icon: Clock3,
      tone: 'bg-[#fff6e8] text-[#b76c12]',
    },
    {
      id: 'templates',
      title: 'Vorlagen & Nachweise',
      description: 'Standardvorlagen und Uploads',
      count: templates.length,
      icon: Upload,
      tone: 'bg-[#eefaf4] text-[#1f7a4f]',
    },
  ];

  return (
    <AppShell
      activeItem="Dokumente"
      hideBreadcrumb
      searchPlacement="actions"
      headerTitle="Dokumente"
      searchValue={searchValue}
      onSearch={setSearchValue}
      createMenuItems={createMenuItems}
    >
      <div className="space-y-6 px-4 py-4 xl:px-6">
        <section className="rounded-[30px] border border-slate-300 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-4">
            <div className="flex flex-wrap items-end gap-3 xl:flex-nowrap">
              <DocumentFilterField label="Abteilung" value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
                <option>Alle Abteilungen</option>
                {initialDepartments.map((department) => (
                  <option key={department.id}>{department.name}</option>
                ))}
              </DocumentFilterField>
              <DocumentFilterField label="Dokumenttyp" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                {typeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </DocumentFilterField>
              <DocumentFilterField label="Status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </DocumentFilterField>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                className="flex min-h-[168px] flex-col rounded-[24px] border border-slate-300 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-5 text-slate-500">{item.label}</p>
                <p className="mt-1.5 text-[1.8rem] font-extrabold tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-auto pt-3 text-sm font-semibold leading-5 text-slate-500">{item.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-[30px] border border-slate-300 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="grid gap-3 xl:grid-cols-4">
            {sectionCards.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex min-h-[108px] items-center gap-3 rounded-[22px] border px-4 py-4 text-left transition ${
                    activeSection === section.id
                      ? 'border-[#e8a9b3] bg-[#fff7f8] shadow-[0_12px_28px_rgba(184,71,88,0.08)]'
                      : 'border-slate-200 bg-[#fcfdff] hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${section.tone}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-slate-950">{section.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{section.description}</span>
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{section.count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            {activeSection === 'library' ? (
              <article>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Dokumentenbibliothek</h2>
                  <span className="rounded-full bg-[#fff7f8] px-4 py-2 text-sm font-bold text-[#b84758]">
                    {filteredDocuments.length} sichtbar
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {filteredDocuments.map((document) => (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => setActiveDocumentId(document.id)}
                      className="w-full rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4 text-left transition hover:border-slate-400 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(document.status)}`}>{document.status}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${classificationTone(document.classification)}`}>
                              {document.classification}
                            </span>
                            <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-bold text-slate-600">{document.type}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-extrabold leading-tight text-slate-950">{document.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{document.summary}</p>
                        </div>

                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff7f8] text-[#b84758]">
                          <Eye className="h-4.5 w-4.5" />
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        {[
                          ['Abteilung', document.department],
                          ['Projekt', document.project],
                          ['Version', document.version],
                          ['Naechste Pruefung', document.reviewDate],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl bg-white p-3">
                            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                            <p className="mt-1.5 text-sm font-bold leading-6 text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            ) : null}

            {activeSection === 'spaces' ? (
              <article>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Wissensbereiche</h2>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#4875c8]">
                    <BookOpen className="h-4.5 w-4.5" />
                  </span>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {knowledgeSpaces.map((space) => (
                    <div key={space.id} className={`rounded-[22px] border p-4 ${space.tone}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-950">{space.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{space.description}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{space.docsCount}</span>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-500">Lead: {space.lead}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {activeSection === 'reviews' ? (
              <article>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Pruefung & Fristen</h2>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff6e8] text-[#b76c12]">
                    <Clock3 className="h-4.5 w-4.5" />
                  </span>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {reviewDocuments.map((document) => (
                    <div key={document.id} className="rounded-[22px] border border-slate-200 bg-[#fcfdff] p-4">
                      <p className="text-sm font-extrabold text-slate-950">{document.title}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(document.status)}`}>{document.status}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{document.reviewDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {activeSection === 'templates' ? (
              <article>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Vorlagen & Nachweise</h2>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f2] text-[#b84758]">
                    <Upload className="h-4.5 w-4.5" />
                  </span>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {templates.map((template) => (
                    <div key={template} className="rounded-[22px] border border-slate-200 bg-[#fcfdff] px-4 py-3 text-sm font-semibold text-slate-700">
                      {template}
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </div>
        </section>
      </div>

      <DocumentModal document={activeDocument} onClose={() => setActiveDocumentId(null)} />
    </AppShell>
  );
}
