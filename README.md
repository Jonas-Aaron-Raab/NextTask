# NextTask

Projekt- und Aufgabenverwaltung für einen Geschäftsbereich einer Sparkasse: Abteilungen, Projekte mit Berichtsbasis und Statusbericht als PDF, Aufgaben im Board und Kalender, Freigaben nach dem Vier-Augen-Prinzip, Audit-Log, Anmeldung mit zweitem Faktor oder SSO. Studienprojekt im Modul WK_1106 (THM), Team in [`TEAMINFO.md`](TEAMINFO.md).

**Aufbau:** `client/` (React 19, Vite) ist die Browser-Anwendung, `server/` (Express 5, Prisma, PostgreSQL) die Schnittstelle unter `/api`, `tests/` die Playwright-Tests.

**Starten:** `npm install` im Wurzelverzeichnis sowie in `server/` und `client/`; `server/.env` aus `server/.env.example` anlegen; in `server/` die Datenbank mit `npx prisma migrate deploy` und `npx prisma generate` vorbereiten, optional Beispieldaten mit `npm run db:seed` laden; dann `npm run dev` im Wurzelverzeichnis (Server auf 5001, Oberfläche auf 5173). Details in [`docs/spec/S3-inbetriebnahme.md`](docs/spec/S3-inbetriebnahme.md).

**Testen:** `npm run test:api` (Schnittstelle, ohne Browser), `npm run test:e2e` (Klicktest), `npm test` (beides); Zuordnung zu den Anforderungen in [`tests/README.md`](tests/README.md).

**Dokumentation:** Spezifikation nach Siedersleben unter [`docs/spec/`](docs/spec/README.md), Architektur nach arc42 unter [`docs/arch/`](docs/arch/README.md), Architekturentscheidungen unter [`adr/`](adr/).
