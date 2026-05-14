const sidebarItems = [
  { label: 'Uebersicht', active: false },
  { label: 'Meine Aufgaben', active: false, badge: 6 },
  { label: 'Projekte', active: true },
  { label: 'Board', active: false },
  { label: 'Kalender', active: false },
  { label: 'Zeiterfassung', active: false },
  { label: 'Berichte', active: false },
  { label: 'Vorlagen', active: false },
];

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] p-4 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(48,42,116,0.12)]">
        <aside className="hidden w-[215px] flex-none bg-[#5237d6] px-5 py-6 text-white lg:block">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/16">
              <CheckIcon />
            </span>
            <span className="text-lg font-bold">NextTask</span>
          </div>

          <nav className="mt-8 space-y-1.5">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold transition ${
                  item.active ? 'bg-white/18 text-white shadow-[0_10px_22px_rgba(33,22,95,0.18)]' : 'text-white/76 hover:bg-white/10'
                }`}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-white/16 px-1.5 text-xs">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="mt-8">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Favoriten</p>
            <div className="mt-3 space-y-2 px-3 text-sm text-white/78">
              <p>Website Relaunch</p>
              <p>Mobile App</p>
              <p>Marketing Kampagne</p>
              <p>Produkt Roadmap</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-[#f7f8fd]">
          <header className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-5 py-4 xl:px-7">
            <div className="relative min-w-[240px] flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                readOnly
                value=""
                placeholder="Suchen"
                className="h-11 w-full rounded-lg border border-transparent bg-slate-100 pl-12 pr-4 text-sm font-medium outline-none placeholder:text-slate-400"
              />
            </div>

            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#6047e8] px-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(96,71,232,0.25)]">
              <PlusIcon />
              Erstellen
            </button>
          </header>

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
                  <h2 className="text-sm font-bold text-slate-900">Activity Feed</h2>
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
        </main>
      </div>
    </div>
  );
}
