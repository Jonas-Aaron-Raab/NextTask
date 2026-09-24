# 2 Randbedingungen

Randbedingungen legen fest, was der Architektur nicht zur Wahl steht. Sie kommen aus drei Quellen:

- **Vorgaben aus der Spezifikation**: die Rahmenbedingungen CON-01 bis CON-07 in [`P1.5`](../spec/P1-ziele-rahmenbedingungen.md#p15-rahmenbedingungen) und die Standards in [`N1`](../spec/N1-nichtfunktional.md) (Abschnitte 14, 17).
- **Getroffene Technologieentscheidungen**, die für alle weiteren Entwürfe bindend sind. Die wesentlichen sind als ADRs in [Kapitel 9](A09-architekturentscheidungen.md) begründet; hier stehen nur die bindenden Fakten.
- **Projektkonventionen** aus [`AGENTS.md`](../../AGENTS.md), [`TEAMINFO.md`](../../TEAMINFO.md) und den Wurzeldokumenten von Spezifikation und Architektur.

---

## 2.1 Technische Randbedingungen

Versionsangaben dienen der Nachvollziehbarkeit; bindend ist die Technologie, nicht die Version. Maßgeblich für installierte Versionen sind die `package-lock.json`-Dateien in Wurzel, `server/` und `client/`.

| ID | Randbedingung | Beschreibung / Quelle |
|----|---------------|-----------------------|
| TECH-01 | **JavaScript auf beiden Seiten** | Server und Browser-Anwendung in JavaScript (kein TypeScript). Server als CommonJS-Module, Browser-Anwendung als ES-Module. Aus [`TEAMINFO.md`](../../TEAMINFO.md), begründet in [ADR-002](A09-architekturentscheidungen.md#adr-002-javascript-durchgängig-react-im-browser-express-auf-dem-server). |
| TECH-02 | **Node.js als Laufzeit, npm als Paketmanager** | Drei `package.json`: Wurzel (`concurrently` zum gemeinsamen Start, `@playwright/test` für den Rauchtest), `server/`, `client/`. Keine Mindestversion festgelegt (kein `engines`-Feld); Entwicklung mit aktueller LTS. |
| TECH-03 | **Express 5 als HTTP-Server** | Eine Express-Anwendung in `server/src/index.js`, elf Routenmodule unter `/api`. Keine weitere Server-Schicht (kein Nginx, kein Prozessmanager) im Projekt. [ADR-001](A09-architekturentscheidungen.md#adr-001-getrennte-browser-anwendung-und-rest-api), [ADR-002](A09-architekturentscheidungen.md#adr-002-javascript-durchgängig-react-im-browser-express-auf-dem-server). |
| TECH-04 | **React 19 mit Vite 8, React Router 7, Tailwind CSS 4** | Browser-Anwendung als Single-Page-Application; Vite als Entwicklungsserver und Bundler; Routing im Browser; Gestaltung mit Tailwind-Klassen und Datenattributen für Darstellungsvarianten. [ADR-001](A09-architekturentscheidungen.md#adr-001-getrennte-browser-anwendung-und-rest-api), [ADR-002](A09-architekturentscheidungen.md#adr-002-javascript-durchgängig-react-im-browser-express-auf-dem-server). |
| TECH-05 | **PostgreSQL mit Prisma 6** | Relationale Datenbank; Schema in `server/prisma/schema.prisma`; 16 Migrationen unter `server/prisma/migrations/`; Seed-Skript `server/prisma/seed.js` für Beispieldaten; Zugriff über den Prisma-Client mit `@prisma/adapter-pg`. Verbindung über `DATABASE_URL`. [ADR-003](A09-architekturentscheidungen.md#adr-003-postgresql-mit-prisma-als-persistenz). |
| TECH-06 | **Zustandslose Authentifizierung mit JWT** | `jsonwebtoken`; Token im `Authorization`-Kopf; keine Server-Session. Passwörter mit `bcryptjs`. [ADR-004](A09-architekturentscheidungen.md#adr-004-zustandslose-anmeldung-mit-jwt-totp-und-openid-connect). |
| TECH-07 | **Eigene TOTP- und OpenID-Connect-Implementierung** | Kein Paket für TOTP oder OIDC; beides mit Node-Bordmitteln (`crypto`, `fetch`) in `server/src/utils/twoFactor.js` und `sso.js`. Nur `qrcode` für den QR-Code der Einrichtung. [ADR-004](A09-architekturentscheidungen.md#adr-004-zustandslose-anmeldung-mit-jwt-totp-und-openid-connect). |
| TECH-08 | **Google Calendar über OAuth 2.0, Mail über SMTP** | Kalender mit Node-`fetch` gegen die Google-REST-API; Mail mit `nodemailer`. Beide nur bei vollständiger Konfiguration aktiv ([S3.2](../spec/S3-inbetriebnahme.md#s32-konfiguration)). |
| TECH-09 | **PDF-Erzeugung im Browser** | `html2canvas` und `jspdf`; der Server hat keine PDF-Bibliothek. [ADR-005](A09-architekturentscheidungen.md#adr-005-statusbericht-als-pdf-im-browser-erzeugen). |
| TECH-10 | **Feste Serveradresse in der Browser-Anwendung** | `client/src/api/axios.js` setzt `http://localhost:5001/api`. Ein anderer Betriebsort erfordert eine Codeänderung und einen Neubau ([S1.2](../spec/S1-nachbarsysteme.md#s12-nb-01--browser-des-anwenders)). |
| TECH-11 | **Arbeitsplatz-Browser als Zielplattform** | Aktuelle Desktop-Browser ab 1280 Pixel Breite ([NFR-13b-01](../spec/N1-nichtfunktional.md), CON-01). Keine native App, kein Offline-Betrieb. |

---

## 2.2 Organisatorische Randbedingungen

| ID | Randbedingung | Beschreibung / Quelle |
|----|---------------|-----------------------|
| ORG-01 | **Studienprojekt mit sechs Personen** | Modul WK_1106, Sommersemester 2026. Rollen: Projektleitung, Entwicklung, Architektur, Spezifikation, Test, DevOps ([`TEAMINFO.md`](../../TEAMINFO.md)). Kein externes Review, keine formale Änderungssteuerung; Abstimmung über Pull Requests. |
| ORG-02 | **Kein Auftraggeber mit schriftlichen Anforderungen** | Der Bedarf stammt aus der Praxis der Projektleitung bei einer Sparkasse; Anforderungen wurden im Projektverlauf konkretisiert ([`P1.1`](../spec/P1-ziele-rahmenbedingungen.md#p11-auftrag)). Folge: Die Spezifikation beschreibt den umgesetzten Stand, nicht einen Auftrag. |
| ORG-03 | **Keine produktive Sparkassen-Infrastruktur** | Kein Zugang zu Identity Provider, SMTP-Relay oder Netz der Sparkasse. Alle Anbindungen sind gegen öffentliche Standards gebaut und per Konfiguration abschaltbar (CON-05). |
| ORG-04 | **Kein Budget für Infrastruktur** | Datenbank und eventuelle Testumgebungen auf kostenfreien Angeboten oder lokal. Kein Betriebsvertrag, keine Überwachung. |
| ORG-05 | **Abgabe von Spezifikation, Architektur und Code als Einheit** | Alles im selben Repository; Dokumentation unter `docs/`, Entscheidungen unter `adr/`. Bewertet werden auch Kontinuität und Beteiligung in der Git-Historie. |
| ORG-06 | **Datenbankmigrationen werden von Hand ausgeführt** | `npx prisma migrate deploy` ist Teil der Inbetriebnahme ([S3.3](../spec/S3-inbetriebnahme.md#s33-erstinbetriebnahme)); der Server führt beim Start keine Migrationen aus. |

---

## 2.3 Konventionen

| ID | Konvention | Beschreibung / Quelle |
|----|------------|-----------------------|
| CONV-01 | **Conventional Commits, englisch** | `typ(bereich): beschreibung` mit `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. [`AGENTS.md`](../../AGENTS.md), [NFR-14a-01](../spec/N1-nichtfunktional.md). |
| CONV-02 | **Oberfläche, Meldungen und Dokumentation deutsch** | Anzeigetexte, Fehlermeldungen des Servers und E-Mails auf Deutsch (CON-06, [NFR-11b-01](../spec/N1-nichtfunktional.md)); Code-Bezeichner englisch. |
| CONV-03 | **Trennung Spezifikation / Architektur** | Code-Details (Pfade, Module, Bibliotheken, SQL) gehören in `docs/arch/`, nicht in `docs/spec/`. Wurzeldokumente beider Teile. |
| CONV-04 | **Spezifikation nach Siedersleben, Architektur nach arc42** | Bausteine `P1`…`E2`, Kapitel `A01`…`A12`; je eine Datei; stabile Kennungen. |
| CONV-05 | **Diagramme als PlantUML-Quellen** | Quellen unter `docs/*/diagrams/`, PNG unter `docs/*/diagrams-png/`, gerendert mit `scripts/generate-diagrams.sh`. Layout wird von Hand nachgeführt, keine Default-Anordnung. |
| CONV-06 | **Ein Routenmodul je fachlichem Bereich, ein Hilfsmodul je Querschnittsthema** | `server/src/routes/<bereich>.routes.js` und `server/src/utils/<thema>.js`; Routen enthalten Ablauf und Validierung, Hilfsmodule die wiederverwendeten Regeln ([Kapitel 5](A05-bausteinsicht.md)). |
| CONV-07 | **Eine Maske je Seite, gemeinsamer Rahmen** | `client/src/pages/<Name>Page.jsx` je Route, alle in `components/AppShell.jsx` eingebettet; wiederverwendete Teile unter `components/`, reine Funktionen unter `utils/`. |
| CONV-08 | **Konfiguration nur über `server/.env`** | Vorlage `server/.env.example` wird mit jedem neuen Schlüssel gepflegt; `.env` ist nie versioniert; die Browser-Anwendung hat keine Konfigurationsdatei. |
