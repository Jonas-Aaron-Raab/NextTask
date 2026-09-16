# Bausteine der Spezifikation nach Siedersleben

Kurzfassung des Bausteinmodells, das dieser Spezifikation zugrunde liegt, und die Einschätzung, welche Bausteine für NextTask relevant sind.

**Quelle:** SIEDERSLEBEN, J. (Hrsg.) 2003. *Softwaretechnik — Praxiswissen für Softwareingenieure.* München: Carl Hanser Verlag. Kapitel 4 „Bausteine der Spezifikation".

---

## Die Bausteine

| Block | Baustein | Inhalt |
|-------|----------|--------|
| 1. Projektgrundlagen | P1 Ziele und Rahmenbedingungen | Warum wird das System gebaut, für wen, unter welchen Einschränkungen. |
| | P2 Architekturüberblick | Einbettung in die Systemlandschaft, Nachbarsysteme, Grobstruktur. |
| 2. Abläufe und Funktionen | F1 Geschäftsprozesse | Fachliche Arbeitsabläufe, unabhängig vom IT-System. |
| | F2 Anwendungsfälle | Interaktionsszenarien zwischen Anwender und System. |
| | F3 Anwendungsfunktionen | Fachliche Algorithmen und Regeln, die in mehreren Anwendungsfällen gebraucht werden. |
| 3. Daten | D1 Datenmodell | Entitäten, Attribute, Beziehungen. |
| | D2 Datentypenverzeichnis | Wertebereiche, Aufzählungen, Formate. |
| 4. Benutzerschnittstelle | B1 Dialogspezifikation | Masken, Felder, Aktionen, Navigation. |
| | B2 Batch | Verarbeitungen ohne Nutzerinteraktion. |
| | B3 Druckausgaben | Berichte, Listen, Dokumente. |
| 5. Schnittstellen | S1 Nachbarsysteme | Schnittstellenverträge zu anderen Systemen. |
| | S2 Datenmigration | Übernahme von Altdaten. |
| | S3 Inbetriebnahme | Voraussetzungen und Ablauf des Rollouts. |
| 6. Übergreifendes | N1 Nichtfunktionale Anforderungen | Sicherheit, Leistung, Wartbarkeit, mit Prüfkriterien. |
| | N2 Querschnittskonzepte | Einheitliche Lösungen für wiederkehrende Fragen (Berechtigungen, Fehler, Protokollierung). |
| 7. Ergänzendes | E1 Leseanleitung | Wie das Dokument zu lesen ist. |
| | E2 Glossar | Fachbegriffe. |

---

## Einschätzung für NextTask

| Baustein | Relevant | Quelle im Repository | Zieldatei |
|----------|----------|----------------------|-----------|
| P1 | Ja | `TEAMINFO.md`, Rollen- und Organisationsmodell im Code | `P1-ziele-rahmenbedingungen.md` |
| P2 | Ja | Server-Einstiegspunkt, SSO-Doku (`docs/SSO.md`), Kalender- und Mail-Anbindung | `P2-architekturueberblick.md` |
| F1 | Ja, drei Prozesse: Projekt steuern und berichten, Aufgabe bearbeiten, Freigabe | Routen und Masken | `F1-geschaeftsprozesse.md` |
| F2 | Ja | Routen (`server/src/routes`), Masken (`client/src/pages`) | `F2-anwendungsfaelle.md` |
| F3 | Ja | Hilfsmodule (`server/src/utils`) | `F3-anwendungsfunktionen.md` |
| D1 | Ja | Prisma-Schema | `D1-datenmodell.md` |
| D2 | Ja | Aufzählungen im Schema, Normalisierungsregeln in den Routen, Anzeigetexte | `D2-datentypen.md` |
| B1 | Ja | Masken, `AppShell` | `B1-dialogspezifikation.md` |
| B2 | Nein: keine Hintergrundverarbeitung, kein Scheduler | — | im Wurzeldokument als nicht anwendbar |
| B3 | Ja: Projektstatusbericht als dreiseitiges PDF | `reportExport.js`, `StatusReportPreview` | `B3-druckausgaben.md` |
| S1 | Ja: OpenID-Connect-Provider, Google Calendar, SMTP | `sso.js`, `calendarIntegration.js`, `taskNotificationMailer.js` | `S1-nachbarsysteme.md` |
| S2 | Nein: Neuentwicklung ohne Altdaten | — | im Wurzeldokument als nicht anwendbar |
| S3 | Ja | `.env.example`, Migrationen, Standardrollen | `S3-inbetriebnahme.md` |
| N1 | Ja | Sicherheitsmechanismen im Code, Konventionen | `N1-nichtfunktional.md` |
| N2 | Ja: Authentifizierung, Berechtigungen, Audit-Log, Fehlerbehandlung, Validierung | Middleware, Hilfsmodule | `N2-querschnittskonzepte.md` |
| E1 | Ja | — | im Wurzeldokument |
| E2 | Ja | — | `E2-glossar.md` |

---

## Dateistruktur

```
docs/spec/
  README.md                        Wurzeldokument mit E1 Leseanleitung
  SIEDERSLEBEN.md                  dieses Dokument
  P1-ziele-rahmenbedingungen.md
  P2-architekturueberblick.md
  F1-geschaeftsprozesse.md
  F2-anwendungsfaelle.md
  F3-anwendungsfunktionen.md
  D1-datenmodell.md
  D2-datentypen.md
  B1-dialogspezifikation.md
  B3-druckausgaben.md
  S1-nachbarsysteme.md
  S3-inbetriebnahme.md
  N1-nichtfunktional.md
  N2-querschnittskonzepte.md
  E2-glossar.md
  diagrams/                        PlantUML-Quellen
  diagrams-png/                    gerenderte Diagramme
  screenshots/                     Bildschirmfotos der Masken für B1
```
