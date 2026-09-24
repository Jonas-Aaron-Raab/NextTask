# NextTask — Architektur (arc42)

Architekturdokumentation von NextTask nach der arc42-Vorlage (Version 9.0). Jedes Kapitel liegt in einer eigenen Datei; dieses Dokument ist das Wurzeldokument mit Konventionen und Kapitelindex.

Vorlage: <https://arc42.org/>. Die Spezifikation, auf die sich diese Dokumentation stützt, liegt unter [`../spec/`](../spec/). Arbeitsteilung: Die Spezifikation sagt implementierungsfrei, *was* NextTask leistet und *warum*; die Architektur sagt, *wie* das im Code umgesetzt ist, mit Dateipfaden, Modulnamen, Bibliotheken und Protokollen.

Laut Vorgabe der Vorlesung entfallen die Kapitel 10 (Qualitätsanforderungen) und 11 (Risiken und technische Schulden). Die Qualitätsanforderungen stehen mit Prüfkriterien in [`../spec/N1-nichtfunktional.md`](../spec/N1-nichtfunktional.md); bekannte Abweichungen zwischen Spezifikation und Code stehen in [`../spec/B1-dialogspezifikation.md`](../spec/B1-dialogspezifikation.md) (B1.5) und in [`../spec/P1-ziele-rahmenbedingungen.md`](../spec/P1-ziele-rahmenbedingungen.md) (P1.8).

---

## Konventionen

- Eine Datei je arc42-Kapitel, benannt `A<NN>-<Titel>.md`. Das Präfix `A` unterscheidet die Architekturdateien von den Bausteinen der Spezifikation (`P1`, `F2`, …).
- Überschriften in den Dateien folgen der arc42-Nummerierung (`# 1`, `## 1.1`, …), nicht dem Dateipräfix.
- Sprache Deutsch. Bezeichner aus dem Code (Dateien, Funktionen, Umgebungsvariablen, Enum-Werte) bleiben unverändert.
- Jede wesentliche Architekturentscheidung ist ein ADR: Kurzfassung mit Kontext, Optionen, Entscheidung und Begründung in [Kapitel 9](A09-architekturentscheidungen.md), ausführlicher Variantenvergleich unter [`../../adr/`](../../adr/).
- Diagramme als PlantUML-Quellen unter [`diagrams/`](diagrams/), gerendert unter [`diagrams-png/`](diagrams-png/). Neu rendern mit `scripts/generate-diagrams.sh`.
- Kennungen aus der Spezifikation (UC-xx, AF-xx, NB-xx, NFR-xx, QK-xx, DLG-xx) werden hier unverändert weiterverwendet. Eigene Kennungen dieser Dokumentation: QZ-xx (Qualitätsziel), TECH-xx, ORG-xx, CONV-xx (Randbedingungen), ADR-xxx (Entscheidung).

## Statuslegende

| Symbol | Bedeutung |
|--------|-----------|
| ✅ | Kapitel liegt vor. |
| ⛔ | Kapitel entfällt laut Vorgabe. |

---

## Kapitelindex

| # | Titel | Status | Datei |
|---|-------|--------|-------|
| 1 | Einführung und Ziele | ✅ | [`A01-einfuehrung-und-ziele.md`](A01-einfuehrung-und-ziele.md) |
| 2 | Randbedingungen | ✅ | [`A02-randbedingungen.md`](A02-randbedingungen.md) |
| 3 | Kontextabgrenzung | ✅ | [`A03-kontextabgrenzung.md`](A03-kontextabgrenzung.md) |
| 4 | Lösungsstrategie | ✅ | [`A04-loesungsstrategie.md`](A04-loesungsstrategie.md) |
| 5 | Bausteinsicht | ✅ | [`A05-bausteinsicht.md`](A05-bausteinsicht.md) |
| 6 | Laufzeitsicht | ✅ | [`A06-laufzeitsicht.md`](A06-laufzeitsicht.md) |
| 7 | Verteilungssicht | ✅ | [`A07-verteilungssicht.md`](A07-verteilungssicht.md) |
| 8 | Querschnittliche Konzepte | ✅ | [`A08-querschnittliche-konzepte.md`](A08-querschnittliche-konzepte.md) |
| 9 | Architekturentscheidungen | ✅ | [`A09-architekturentscheidungen.md`](A09-architekturentscheidungen.md) |
| 10 | Qualitätsanforderungen | ⛔ | — (siehe N1 der Spezifikation) |
| 11 | Risiken und technische Schulden | ⛔ | — (siehe P1.8 und B1.5 der Spezifikation) |
| 12 | Glossar | ✅ | [`A12-glossar.md`](A12-glossar.md) |

## Architekturentscheidungen (ADRs)

| ADR | Titel | Datei |
|-----|-------|-------|
| ADR-001 | Getrennte Browser-Anwendung und REST-API | [`../../adr/001-spa-und-rest-api.md`](../../adr/001-spa-und-rest-api.md) |
| ADR-002 | JavaScript durchgängig: React im Browser, Express auf dem Server | [`../../adr/002-javascript-react-express.md`](../../adr/002-javascript-react-express.md) |
| ADR-003 | PostgreSQL mit Prisma als Persistenz | [`../../adr/003-postgresql-prisma.md`](../../adr/003-postgresql-prisma.md) |
| ADR-004 | Zustandslose Anmeldung mit JWT, TOTP und OpenID Connect | [`../../adr/004-jwt-totp-oidc.md`](../../adr/004-jwt-totp-oidc.md) |
| ADR-005 | Statusbericht als PDF im Browser erzeugen | [`../../adr/005-pdf-im-browser.md`](../../adr/005-pdf-im-browser.md) |

---

## Abbildungsverzeichnis

| Nr. | Abbildung | Kapitel | Quelle |
|-----|-----------|---------|--------|
| 1 | Technischer Kontext | 3.2 | [`diagrams/a03-technischer-kontext.plantuml`](diagrams/a03-technischer-kontext.plantuml) |
| 2 | Bausteinsicht Ebene 1 und 2 | 5 | [`diagrams/a05-bausteine.plantuml`](diagrams/a05-bausteine.plantuml) |
| 3 | Laufzeit: Anmeldung mit zweitem Faktor | 6.1 | [`diagrams/a06-anmeldung.plantuml`](diagrams/a06-anmeldung.plantuml) |
| 4 | Laufzeit: SSO-Rückleitung | 6.2 | [`diagrams/a06-sso-rueckleitung.plantuml`](diagrams/a06-sso-rueckleitung.plantuml) |
| 5 | Laufzeit: Aufgabe speichern mit Audit, Mail und Kalender | 6.3 | [`diagrams/a06-aufgabe-speichern.plantuml`](diagrams/a06-aufgabe-speichern.plantuml) |
| 6 | Laufzeit: Freigabe entscheiden | 6.4 | [`diagrams/a06-freigabe.plantuml`](diagrams/a06-freigabe.plantuml) |
| 7 | Verteilung: Entwicklungsumgebung | 7.1 | [`diagrams/a07-entwicklung.plantuml`](diagrams/a07-entwicklung.plantuml) |
| 8 | Verteilung: Zielbild Betrieb | 7.2 | [`diagrams/a07-zielbild.plantuml`](diagrams/a07-zielbild.plantuml) |

Das Systemkontextdiagramm (Kapitel 3.1) und das Informationsmodell (Kapitel 8.1) werden aus der Spezifikation übernommen, nicht dupliziert.

---

## Eingesetzte KI-Werkzeuge

Siehe den gleichnamigen Abschnitt in [`../spec/README.md`](../spec/README.md#eingesetzte-ki-werkzeuge); er gilt für Spezifikation und Architekturdokumentation gemeinsam.

## Änderungshistorie

| Version | Datum | Änderung |
|---------|-------|----------|
| 0.1 | 2026-09-10 | Erste Fassung der Kapitel 1 bis 9 und 12 mit fünf ADRs. |
