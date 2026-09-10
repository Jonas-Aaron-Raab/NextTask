# NextTask — Spezifikation

Spezifikation von NextTask nach dem Bausteinmodell von Johannes Siedersleben. Jeder Baustein beschreibt eine abgegrenzte Sicht auf das System und liegt in einer eigenen Datei. Dieses Dokument ist das Wurzeldokument: Es enthält die Leseanleitung (E1), den Bausteinindex, die Begründung für nicht anwendbare Bausteine, die Nachvollziehbarkeitsmatrix, das Abbildungsverzeichnis und die Quellen.

Die Architekturdokumentation (arc42, Kapitel A01 bis A09 und A12, mit ADRs) liegt getrennt unter [`docs/arch/`](../arch/). Die Trennung ist verbindlich: Die Spezifikation beschreibt, *was* NextTask fachlich leistet und *warum*. Technische Entscheidungen (Framework, Datenbankprodukt, Bibliotheken, Dateipfade) gehören in die Architektur. Wo diese Spezifikation einen technischen Begriff braucht, um eine fachliche Aussage präzise zu machen, etwa OpenID Connect als Protokoll der SSO-Schnittstelle, wird er genannt.

Das Bausteinmodell selbst ist in [`SIEDERSLEBEN.md`](SIEDERSLEBEN.md) zusammengefasst.

---

## E1 — Leseanleitung

### Zielgruppe

- **Projektteam** (sechs Studierende, siehe [`TEAMINFO.md`](../../TEAMINFO.md)): gemeinsames Verständnis davon, was NextTask tut und welche Regeln gelten, unabhängig davon, wer welchen Teil des Codes geschrieben hat.
- **Dozent und Prüfer**: Bewertung von Zielen, Abläufen, Datenmodell, Oberfläche und Qualitätsanforderungen ohne Blick in den Quellcode.
- **Spätere Bearbeiter**: Einstieg in das System über eine stabile Begriffs- und Nummernwelt, die sich im Code wiederfindet.

### Lesereihenfolge

1. **P1** für Auftrag, Ziele, Stakeholder, Abgrenzung und Rahmenbedingungen.
2. **P2** für den Systemkontext und die Nachbarsysteme.
3. **F1 bis F3** für die fachliche Sicht: Geschäftsprozesse, Anwendungsfälle, Anwendungsfunktionen.
4. **D1 und D2** als Nachschlagewerk für Entitäten, Attribute und Wertebereiche. Beide werden aus allen anderen Bausteinen referenziert.
5. **B1** für die Masken und **B3** für den Statusbericht als Druckausgabe.
6. **S1 und S3** für Schnittstellen und Inbetriebnahme, **N1 und N2** für nichtfunktionale Anforderungen und Querschnittskonzepte.
7. **E2** bei Bedarf für Fachbegriffe.

Wer wenig Zeit hat, liest P1, den Index in F2 und die Tabelle B1.5. Diese drei Stellen sagen, was das System soll, was es kann und wo Oberfläche und Server noch auseinanderliegen.

### Konventionen

- Bausteine tragen die Kürzel nach Siedersleben (`P1`, `F2`, …). Eine Datei je Baustein, benannt `<Kürzel>-<Thema>.md`.
- Sprache ist Deutsch. Entitätsnamen, Attributnamen und Aufzählungswerte behalten die Schreibweise des Datenmodells (`ApprovalRequest`, `IN_PROGRESS`), damit sie sich in Datenbank und Code wiederfinden. Die deutschen Anzeigetexte der Oberfläche stehen daneben, wo sie abweichen.
- Nummerierte Kennungen sind stabil. Wird eine Kennung aus einem anderen Baustein referenziert, wird sie nicht mehr umnummeriert.

| Präfix | Bedeutung | Baustein |
|--------|-----------|----------|
| G-xx | Ziel | P1 |
| NG-xx | Nicht-Ziel | P1 |
| CON-xx | Rahmenbedingung | P1 |
| SC-xx | Erfolgskriterium | P1 |
| AS-xx | Annahme | P1 |
| R-xx | Risiko | P1 |
| NB-xx | Nachbarsystem | P2, S1 |
| GP-xx | Geschäftsprozess | F1 |
| UC-xx | Anwendungsfall | F2 |
| AF-xx | Anwendungsfunktion | F3 |
| DLG-xx | Dialog (Maske) | B1 |
| DR-xx | Druckausgabe | B3 |
| NFR-xx | Nichtfunktionale Anforderung, nummeriert nach Volere-Abschnitt | N1 |
| QK-xx | Querschnittskonzept | N2 |

- Die Spezifikation beschreibt NextTask im Stand von September 2026, wie er im Repository umgesetzt ist. Wo Oberfläche und Server unterschiedlich weit sind, steht das im jeweiligen Baustein (P1.8, F2.1 Spalte „Stand", B1.5).
- Diagramme liegen als PlantUML-Quellen unter [`diagrams/`](diagrams/), die gerenderten Bilder unter [`diagrams-png/`](diagrams-png/). Neu rendern mit `scripts/generate-diagrams.sh` (braucht Java). Bildschirmfotos der Masken liegen unter [`screenshots/`](screenshots/).

### Statuslegende für den Index

| Symbol | Bedeutung |
|--------|-----------|
| ✅ | Baustein liegt vor. |
| 🛠 | Baustein ist geplant, aber noch nicht geschrieben. |
| ⛔ | Baustein ist für NextTask nicht anwendbar (Begründung unten). |

---

## Bausteinindex

### 1. Projektgrundlagen

| Baustein | Titel | Status | Datei |
|----------|-------|--------|-------|
| P1 | Ziele und Rahmenbedingungen | ✅ | [`P1-ziele-rahmenbedingungen.md`](P1-ziele-rahmenbedingungen.md) |
| P2 | Architekturüberblick | ✅ | [`P2-architekturueberblick.md`](P2-architekturueberblick.md) |

### 2. Abläufe und Funktionen

| Baustein | Titel | Status | Datei |
|----------|-------|--------|-------|
| F1 | Geschäftsprozesse | 🛠 | `F1-geschaeftsprozesse.md` |
| F2 | Anwendungsfälle | 🛠 | `F2-anwendungsfaelle.md` |
| F3 | Anwendungsfunktionen | 🛠 | `F3-anwendungsfunktionen.md` |

### 3. Daten

| Baustein | Titel | Status | Datei |
|----------|-------|--------|-------|
| D1 | Datenmodell | ✅ | [`D1-datenmodell.md`](D1-datenmodell.md) |
| D2 | Datentypenverzeichnis | ✅ | [`D2-datentypen.md`](D2-datentypen.md) |

### 4. Benutzerschnittstelle

| Baustein | Titel | Status | Datei |
|----------|-------|--------|-------|
| B1 | Dialogspezifikation | 🛠 | `B1-dialogspezifikation.md` |
| B2 | Batch | ⛔ | — |
| B3 | Druckausgaben | 🛠 | `B3-druckausgaben.md` |

### 5. Schnittstellen zu Alt- und Nachbarsystemen

| Baustein | Titel | Status | Datei |
|----------|-------|--------|-------|
| S1 | Nachbarsystem-Schnittstellen | 🛠 | `S1-nachbarsysteme.md` |
| S2 | Datenmigration | ⛔ | — |
| S3 | Inbetriebnahme | 🛠 | `S3-inbetriebnahme.md` |

### 6. Übergreifendes

| Baustein | Titel | Status | Datei |
|----------|-------|--------|-------|
| N1 | Nichtfunktionale Anforderungen | 🛠 | `N1-nichtfunktional.md` |
| N2 | Querschnittskonzepte | 🛠 | `N2-querschnittskonzepte.md` |

### 7. Ergänzendes

| Baustein | Titel | Status | Datei |
|----------|-------|--------|-------|
| E1 | Leseanleitung | ✅ | dieses Dokument (Abschnitt oben) |
| E2 | Glossar | 🛠 | `E2-glossar.md` |

---

## Nicht anwendbare Bausteine

### B2 — Batch

NextTask hat keine zeitgesteuerten oder nutzerunabhängigen Verarbeitungen. Kalendersynchronisation, E-Mail-Benachrichtigungen und Audit-Protokollierung laufen innerhalb der Anfrage, die ein Anwender ausgelöst hat ([N2](N2-querschnittskonzepte.md)). Es gibt weder einen Scheduler noch eine Warteschlange. Fällt ein Nachbarsystem aus, wird der Fehler protokolliert und die eigentliche Aktion trotzdem abgeschlossen; ein späterer Nachlauf findet nicht statt.

### S2 — Datenmigration

NextTask ist eine Neuentwicklung ohne Vorgängersystem. Es gibt keinen Altdatenbestand, der übernommen werden müsste. Beim ersten Start legt das System die fünf Standardrollen an ([S3](S3-inbetriebnahme.md)); die Schema-Migrationen der Datenbank gehören zur Inbetriebnahme und sind keine Datenübernahme im Sinne von Siedersleben.

---

## Nachvollziehbarkeit

Die Matrix Anwendungsfall → Maske → Qualitätsanforderung wird mit F2, B1 und N1 ergänzt. Die Kennungen sind ab jetzt stabil; Bausteine, die noch fehlen, werden in bestehenden Dokumenten bereits mit ihren künftigen Kennungen referenziert.

---

## Abbildungsverzeichnis

| Nr. | Abbildung | Baustein | Quelle |
|-----|-----------|----------|--------|
| 1 | Systemkontext NextTask | P2.1 | [`diagrams/p2-systemkontext.plantuml`](diagrams/p2-systemkontext.plantuml) |
| 2 | Informationsmodell | D1 | [`diagrams/d1-informationsmodell.plantuml`](diagrams/d1-informationsmodell.plantuml) |
| 3 | Zustände einer Aufgabe (TaskStatusDT) | D2.3 | [`diagrams/d2-taskstatus-zustaende.plantuml`](diagrams/d2-taskstatus-zustaende.plantuml) |
| 4 | Lebenszyklus einer Freigabeanfrage (ApprovalStatusDT) | D2.7 | [`diagrams/d2-freigabestatus-zustaende.plantuml`](diagrams/d2-freigabestatus-zustaende.plantuml) |

Weitere Abbildungen kommen mit F1, F2 und B1 hinzu.

---

## Quellen

- SIEDERSLEBEN, J. (Hrsg.) 2003. *Softwaretechnik — Praxiswissen für Softwareingenieure.* München: Carl Hanser Verlag. Kapitel 4 „Bausteine der Spezifikation".
- POHL, K.; RUPP, C. 2021. *Basiswissen Requirements Engineering.* 5. Auflage. Heidelberg: dpunkt.verlag. (Tabellarische Use-Case-Schablone in F2.)
- ROBERTSON, S.; ROBERTSON, J. *Volere Requirements Specification Template.* <https://www.volere.org/templates/volere-requirements-specification-template/> (Gliederung der Rahmenbedingungen in P1.5 und der nichtfunktionalen Anforderungen in N1.)
- SAKIMURA, N. et al. 2014. *OpenID Connect Core 1.0.* <https://openid.net/specs/openid-connect-core-1_0.html> (Grundlage der SSO-Schnittstelle, S1.)
- SAKIMURA, N.; BRADLEY, J.; AGARWAL, N. 2015. *RFC 7636: Proof Key for Code Exchange by OAuth Public Clients.* IETF.
- M'RAIHI, D. et al. 2011. *RFC 6238: TOTP — Time-Based One-Time Password Algorithm.* IETF. (Zweiter Faktor, N2.)
- LUCKE, C. *Herold — Dokumentation.* Beispielprojekt zur Vorlesung WK_1106, THM. (Struktur und Detailgrad dieser Spezifikation.)

---

## Änderungshistorie

| Version | Datum | Änderung |
|---------|-------|----------|
| 0.1 | 2026-09-10 | Wurzeldokument, Leseanleitung, P1, P2, D1, D2 mit Systemkontext, Informationsmodell und Zustandsdiagrammen; Render-Skript für Diagramme. |
