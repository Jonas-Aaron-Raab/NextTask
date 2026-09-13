# ADR-003: PostgreSQL mit Prisma — Variantenvergleich

Kurzfassung in [`docs/arch/A09-architekturentscheidungen.md`](../docs/arch/A09-architekturentscheidungen.md#adr-003-postgresql-mit-prisma-als-persistenz).

## Kontext

Das Datenmodell ([D1](../docs/spec/D1-datenmodell.md)) hat 14 Entitäten mit Fremdschlüsseln, Kaskaden, zusammengesetzten Eindeutigkeiten, sechs Aufzählungstypen, vier Listenattributen und drei freien JSON-Strukturen (Berechtigungen, Audit-Vorher/Nachher, Metadaten). Das Audit-Log soll revisionssicher sein: Einträge werden nur angefügt.

Das Team arbeitet verteilt; alle sollen gegen denselben Datenbestand entwickeln und testen können. Es gibt kein Budget für Infrastruktur (ORG-04), aber kostenfreie PostgreSQL-Angebote.

---

## Option A: SQLite

Eingebettete Datei im Repository-Verzeichnis, wie im Beispielprojekt des Dozenten.

**Vorteile**
- Keine Installation, keine Zugangsdaten, kein Netz.
- Prisma unterstützt SQLite; Migrationen funktionieren gleich.

**Nachteile**
- Jeder Entwicklungsrechner hat seinen eigenen Datenstand; Testdaten, Rollen und Beispielprojekte müssten je Rechner angelegt werden.
- Keine Array- und Enum-Typen; `String[]` und `enum` in Prisma werden auf SQLite nicht unterstützt und müssten als Text mit eigener Prüfung abgebildet werden.
- Parallele Schreibzugriffe serialisieren auf Dateiebene; für ein Mehrbenutzersystem das falsche Signal, auch wenn die Last klein ist.
- Das Beispielprojekt hat einen Anwender; NextTask hat einen Geschäftsbereich.

---

## Option B: MongoDB mit Mongoose

**Vorteile**
- JSON-nahe Ablage; Berechtigungen und Audit-Differenzen passen ohne Umweg.
- Verbreitet im JavaScript-Umfeld, kostenfreies Angebot (Atlas).

**Nachteile**
- Beziehungen und Löschregeln (Projekt löschen → Aufgaben, Meilensteine, Berichte) müssen im Code umgesetzt werden; ein vergessener Aufruf hinterlässt Waisen.
- Eindeutigkeit über zwei Felder (`ssoProvider` + `ssoSubject`, `provider` + `userId` + `taskId`) ist möglich, aber die Modellierung mit eingebetteten oder referenzierten Dokumenten muss je Entität entschieden werden.
- Für eine Revision ist ein relationales Schema mit Fremdschlüsseln leichter zu erklären als eine Dokumentsammlung.

---

## Option C: PostgreSQL mit Prisma

**Vorteile**
- Enums, Arrays, JSON, zusammengesetzte Eindeutigkeiten, `ON DELETE CASCADE` und `SET NULL` als native Datenbankmerkmale; das Schema in `schema.prisma` liest sich wie D1.
- Eine gemeinsame Instanz bei einem Anbieter (die Vorlage `.env.example` sieht `sslmode=require` vor) gibt dem Team einen Datenstand.
- Prisma: Schema zuerst, Migrationen aus dem Schema erzeugt, generierter Client mit Autovervollständigung, `include`/`select` für Beziehungen, `$transaction`.
- Wechsel des Anbieters ist eine Änderung von `DATABASE_URL`.

**Nachteile**
- Ein Datenbankserver muss existieren; ohne Netz keine Entwicklung.
- `prisma generate` als zusätzlicher Schritt; der Client liegt unter `server/generated/prisma` und ist nicht versioniert.
- Prisma-Versionssprünge (hier 6.x mit Treiberadapter) ändern gelegentlich die Konfiguration (`prisma.config.ts`).

---

## Option D: PostgreSQL mit `pg` oder knex

**Vorteile**
- Volle Kontrolle über SQL; keine Generierung; kleinere Abhängigkeit.

**Nachteile**
- Migrationen von Hand oder mit weiterem Werkzeug; Mapping von Zeilen auf Objekte in jedem Handler.
- Mehr Code pro Route bei identischem Ergebnis; für sechs Personen mit unterschiedlicher SQL-Erfahrung fehleranfälliger.

---

## Entscheidung: Option C

## Begründung

1. Die Datenbank läuft als entfernte Instanz, auf die das ganze Team zugreift. So arbeiten alle mit demselben Datenstand und testen Funktionen unter vergleichbaren Bedingungen; Rollen, Beispielprojekte und Testkonten existieren einmal statt sechsmal. Das war wichtiger als eine Datei ohne Installation.
2. Mit Blick auf einen späteren produktiven Einsatz ist eine zentrale Datenbank konsistenter, besser wartbar und näher an einer realen Betriebsumgebung als lokale Einzelstände. Die Sparkassen-IT betreibt PostgreSQL als Standardprodukt.
3. Das Datenmodell ist relational und nutzt Datenbankmerkmale, die nur PostgreSQL unter den Optionen vollständig bietet. Die Löschregeln aus D1.6 sind Schema, nicht Code.
4. Prisma macht das Schema zur einzigen Wahrheit und erzeugt die Migrationen. Die 14 Migrationen sind zugleich die Entstehungsgeschichte des Systems ([A08 8.1](../docs/arch/A08-querschnittliche-konzepte.md#81-domänenmodell-und-persistenz)).
5. Die Enums an der Datenbank fangen einen Teil dessen ab, was fehlende Typen im Code ([ADR-002](002-javascript-react-express.md)) offenlassen.

## Konsequenzen

- `DATABASE_URL` ist die einzige Datenbankkonfiguration; `sslmode=require` für entfernte Instanzen.
- Inbetriebnahme mit `prisma migrate deploy` und `prisma generate` ([S3.3](../docs/spec/S3-inbetriebnahme.md#s33-erstinbetriebnahme)); Migrationen laufen nicht automatisch (ORG-06).
- Werte, die in D2 als Text modelliert sind (Ampeln, Meilensteinstatus, Freigabestufe), prüft die Datenbank nicht (R-06). Ein Umbau auf Prisma-Enums wäre eine Migration je Feld.
- Kein eingebauter Seed; Beispieldaten liegen derzeit in der Browser-Anwendung (`client/src/data/`), was zu R-01 beiträgt. Ein `prisma/seed.js` wäre der natürliche Ort.
- Bei Übernahme durch die Sparkassen-IT ist PostgreSQL ein Standardprodukt; Sicherung und Zugriff folgen deren Regeln.
