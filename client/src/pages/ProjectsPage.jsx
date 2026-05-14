import AppShell from '../components/AppShell';

const projectStats = [
  { label: 'Aktive Projekte', value: '12', detail: '4 mit hoher Prioritaet' },
  { label: 'Offene Aufgaben', value: '48', detail: '8 faellig diese Woche' },
  { label: 'Team-Auslastung', value: '81%', detail: '+6% vs. letzte Woche' },
];

const projectCards = [
  {
    title: 'Website Relaunch',
    status: 'In QA',
    owner: 'Lisa Mueller',
    progress: 68,
    accent: 'bg-violet-500',
  },
  {
    title: 'Mobile App',
    status: 'Design',
    owner: 'Max Mustermann',
    progress: 42,
    accent: 'bg-amber-400',
  },
  {
    title: 'Marketing Kampagne',
    status: 'Aktiv',
    owner: 'Anna Schneider',
    progress: 76,
    accent: 'bg-emerald-500',
  },
  {
    title: 'Produkt Roadmap',
    status: 'Planung',
    owner: 'Tom Becker',
    progress: 35,
    accent: 'bg-sky-500',
  },
];

export default function ProjectsPage() {
  return (
    <AppShell activeItem="Projekte" breadcrumb={['Workspace', 'Web-Relaunch', 'Projekte']}>
      <div className="grid gap-5 px-5 py-5 xl:grid-cols-[1fr_275px] xl:px-7">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {projectStats.map((stat) => (
              <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(39,48,93,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6047e8]">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{stat.detail}</p>
              </article>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(39,48,93,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Projekte</p>
                <p className="mt-1 text-sm text-slate-500">Statische Projektuebersicht als Basis fuer die neue Ansicht.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg bg-[#6047e8] px-3 py-2 text-sm font-semibold text-white">
                  Alle
                </button>
                <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                  Aktiv
                </button>
                <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                  Archiv
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {projectCards.map((project) => (
                <article key={project.title} className="rounded-2xl border border-slate-200 bg-[#fbfcff] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${project.accent}`} />
                        <h2 className="text-base font-bold text-slate-900">{project.title}</h2>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-500">{project.owner}</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-[#6047e8]">
                      {project.status}
                    </span>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Fortschritt</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#6047e8]" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Aktivitaeten</h2>
              <button type="button" className="text-xs font-bold text-[#6047e8]">
                Alle anzeigen
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <p className="rounded-xl bg-slate-50 p-3 text-slate-600">Max Mustermann hat ein Projekt aktualisiert.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-slate-600">Lisa Mueller hat einen Kommentar hinzugefuegt.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-slate-600">QA Review wurde vorbereitet.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(39,48,93,0.07)]">
            <h2 className="text-sm font-bold text-slate-900">Naechste Deadlines</h2>
            <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
              <div className="flex items-center justify-between">
                <span>API Fehlerbehandlung</span>
                <span className="text-rose-500">Heute</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Produkt-Tour</span>
                <span>22. Mai</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Performance Audit</span>
                <span>23. Mai</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
