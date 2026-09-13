# ADR-001: Getrennte Browser-Anwendung und REST-API — Variantenvergleich

Kurzfassung in [`docs/arch/A09-architekturentscheidungen.md`](../docs/arch/A09-architekturentscheidungen.md#adr-001-getrennte-browser-anwendung-und-rest-api).

## Kontext

NextTask hat zwölf Masken, davon drei mit intensiver Interaktion: das Kanban-Board mit Ticket-Editor (acht Reiter), der Kalender mit Ziehen von Karten auf Tage und die Projektmaske mit Backlog-Sortierung und einem Dialog mit sechs Reitern. Dazu kommt eine PDF-Erzeugung. Auf der Serverseite stehen Regeln, Berechtigungen, Audit-Log und drei Nachbarsysteme.

Das Team hat sechs Personen mit den Rollen Projektleitung, Entwicklung, Architektur, Spezifikation, Test und DevOps. Es arbeitet verteilt über ein Semester. Zu entscheiden war, ob Oberfläche und Server als eine Anwendung mit einem Prozess und einer Adresse laufen oder als zwei Teile mit einer Schnittstelle dazwischen.

---

## Option A: Serverseitig gerenderte Seiten

Express liefert HTML aus Templates (EJS, Handlebars oder Pug); Formulare senden an Routen; Interaktion mit wenig JavaScript.

**Vorteile**
- Ein Prozess, eine Adresse, keine CORS-Konfiguration.
- Session-Cookie mit `HttpOnly`; Abmelden entwertet die Sitzung serverseitig.
- Wenig Werkzeugkette: kein Bundler, kein zweiter Entwicklungsserver.

**Nachteile**
- Board, Kalender, Editor und PDF brauchen ohnehin viel Browserlogik. Sie würde neben den Templates entstehen, ohne Komponentenmodell und ohne gemeinsamen Zustand.
- Oberflächen- und Serverarbeit greifen ineinander (Template braucht Daten aus der Route); parallele Arbeit im Team kollidiert häufiger.
- Jede Interaktion, die keine Seite neu laden soll, braucht trotzdem eine JSON-Route; am Ende entstehen beide Welten.

---

## Option B: Full-Stack-Framework (Next.js oder Remix)

React-Seiten und API-Routen im selben Projekt; Rendering auf dem Server mit Hydration im Browser.

**Vorteile**
- Eine Codebasis, gemeinsames Routing, Datenladen im Framework vorgesehen.
- Server-Rendering für schnellen ersten Aufbau.

**Nachteile**
- Konventionen für Server- und Client-Komponenten, Datenladen und Caching müssen von allen gelernt werden; für ein Semester ein hoher Fixaufwand.
- Server-Rendering bringt für eine interne Anwendung hinter Anmeldung keinen Nutzen (kein SEO, keine anonymen Besucher).
- Die Trennlinie zwischen Server- und Browsercode ist im Projekt weniger sichtbar; Fehler wie „Datenbankzugriff in einer Client-Komponente" sind für Einsteiger schwer zu erkennen.

---

## Option C: SPA und REST-API

Eine React-Anwendung als eigenes Vite-Projekt (`client/`), ein Express-Server mit JSON-Schnittstelle unter `/api` (`server/`). Verbindung ausschließlich über HTTP.

**Vorteile**
- Klare Grenze, an der sich Arbeit aufteilen lässt: Masken und Routen entstehen unabhängig, die Schnittstelle ist der Vertrag.
- Jede Seite hat ihre passende Werkzeugkette (Vite mit Hot Module Replacement, nodemon).
- Das Frontend ist ein statisches Bauartefakt, das ein beliebiger Webserver ausliefern kann; der Server bleibt ein Node-Prozess.
- Die Schnittstelle ist ohne Oberfläche nutzbar (Tests, Skripte, künftige Clients).

**Nachteile**
- Zwei Prozesse in der Entwicklung; zwei Ursprünge, daher CORS.
- Authentifizierung per Token statt Cookie; das Token liegt im Local Storage.
- Die Serveradresse muss die Browser-Anwendung kennen; derzeit fest in `api/axios.js`.
- Die Trennung erlaubt, dass eine Seite der anderen vorausläuft. Genau das ist geschehen: Projekt-API ohne Anbindung, Masken mit Beispieldaten (R-01).

---

## Entscheidung: Option C

Die Trennung von Oberfläche und Server war für das Team von Beginn an die sinnvollere Struktur. Die Optionen A und B wurden als Alternativen betrachtet, aber nicht als Hauptlösung verfolgt; der Vergleich oben hält fest, was sie gekostet hätten.

## Begründung

1. Benutzeroberfläche, Geschäftslogik und Schnittstelle lassen sich getrennt entwickeln und warten. Die Grenze zwischen `client/` und `server/` ist die Grenze, an der das Team arbeitet; sie macht Zuständigkeiten sichtbar und Pull Requests klein.
2. Die Oberfläche ist der größere und interaktivere Teil des Systems. Ihr Bedarf an Browserlogik ist unabhängig von der Entscheidung vorhanden; Option A hätte ihn nur schlechter organisiert.
3. Die Struktur passt zu einem System, das später erweitert, betrieben und möglicherweise an einen Kunden wie die Sparkasse gegeben werden soll: Die Schnittstelle hat einen eigenen Vertrag, den man ohne Oberfläche prüfen und übergeben kann.
4. Die Kosten sind bekannt und begrenzt: CORS ist eine Zeile, JWT ist in ADR-004 begründet, die feste Adresse ist eine Konfigurationsaufgabe für den Betrieb.
5. Option B hätte dieselbe Struktur mit einem Framework erzwungen, dessen Nutzen (Server-Rendering) hier nicht gebraucht wird.

## Konsequenzen

- Zwei `package.json` mit eigenen Abhängigkeiten, dazu eine im Wurzelverzeichnis für den gemeinsamen Start (`concurrently`).
- Kein gemeinsamer Code zwischen Browser und Server; Enum-Werte und Meldungstexte existieren auf beiden Seiten als Zeichenketten.
- Sitzung über JWT ([ADR-004](004-jwt-totp-oidc.md)).
- Für einen Betrieb außerhalb der Entwicklung: statischer Build hinter einem Reverse Proxy, Serveradresse konfigurierbar, CORS eingeschränkt ([A07 7.2](../docs/arch/A07-verteilungssicht.md#72-zielbild-für-einen-betrieb-durch-die-sparkassen-it)).
- Der Rückstand der Anbindung (R-01) ist eine Folge der Freiheit, die die Trennung gibt; er wird durch die Zuordnung in [A05 5.4](../docs/arch/A05-bausteinsicht.md#54-zuordnung-zur-spezifikation) sichtbar gemacht und ist die erste offene Arbeit.
