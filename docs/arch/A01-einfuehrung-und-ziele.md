# 1 Einführung und Ziele

NextTask ist eine Projekt- und Aufgabensteuerung für den Geschäftsbereich Organisation einer Sparkasse: Aufgaben in Board und Kalender, Projekte mit Berichtsbasis und Statusbericht, Freigaben nach dem Vier-Augen-Prinzip, Rollenmodell entlang der Organisation, Audit-Log, Anmeldung mit zweitem Faktor oder SSO.

Dieses Kapitel fasst die Anforderungen und Qualitätsziele zusammen, die die Architektur bestimmen. Die verbindliche Anforderungsbeschreibung ist die Spezifikation unter [`../spec/`](../spec/); sie wird hier referenziert, nicht wiederholt.

---

## 1.1 Anforderungsüberblick

Der fachliche Kern in einem Absatz: Ein Anwender meldet sich mit E-Mail und Passwort an, optional mit Einmalcode aus einer Authenticator-App, oder über den Identity Provider der Sparkasse. Er sieht Aufgaben seiner Abteilung, seiner Projekte und die ihm zugewiesenen, bearbeitet sie im Kanban-Board, terminiert sie im Kalender und kommentiert sie. Fristen gehen als Termin in seinen Google-Kalender, Zuweisungen und Erwähnungen als E-Mail. Für kritische Schritte stellt er eine Freigabeanfrage, die eine zweite Person entscheidet. Projektleitungen pflegen Meilensteine, Risiken und Budget und erzeugen daraus einen dreiseitigen Statusbericht als PDF. Administratoren pflegen Rollen und Benutzer und lesen das Audit-Log, in dem jede ändernde Aktion mit Vorher-Nachher-Werten steht.

Verbindliche Quellen:

- Auftrag, Ziele, Stakeholder, Abgrenzung, Rahmenbedingungen, Risiken: [`P1`](../spec/P1-ziele-rahmenbedingungen.md).
- Geschäftsprozesse GP-01 bis GP-03: [`F1`](../spec/F1-geschaeftsprozesse.md).
- Anwendungsfälle UC-01 bis UC-25: [`F2`](../spec/F2-anwendungsfaelle.md).
- Anwendungsfunktionen AF-01 bis AF-11: [`F3`](../spec/F3-anwendungsfunktionen.md).
- Nichtfunktionale Anforderungen mit Prüfkriterien: [`N1`](../spec/N1-nichtfunktional.md).
- Querschnittskonzepte QK-01 bis QK-08: [`N2`](../spec/N2-querschnittskonzepte.md).

---

## 1.2 Qualitätsziele

Die fünf Qualitätsziele, an denen sich Architekturentscheidungen messen lassen, in der Reihenfolge ihrer Bedeutung. Jedes Ziel hat ein Szenario, das sich prüfen lässt, und den Bezug zur Spezifikation.

| ID | Qualitätsziel | ISO-25010-Merkmal | Szenario | Quelle |
|----|---------------|-------------------|----------|--------|
| QZ-01 | **Nachvollziehbarkeit.** Jede ändernde Aktion ist nachträglich mit Akteur, Zeitpunkt, Herkunft und geänderten Feldern prüfbar; Freigaben halten Entscheider und Vermerk fest. | Sicherheit (Nichtabstreitbarkeit) | Ein Prüfer findet zu einer Aufgabe im Audit-Log jede Statusänderung mit altem und neuem Wert und dem Anwender, der sie ausgelöst hat. | [G-05](../spec/P1-ziele-rahmenbedingungen.md#p12-ziele), [NFR-15d-01](../spec/N1-nichtfunktional.md), [QK-03](../spec/N2-querschnittskonzepte.md#qk-03-audit-logging) |
| QZ-02 | **Zugriffsschutz.** Anmeldung mit zweitem Faktor für lokale Konten, SSO ohne Passwortübertragung, Berechtigungen serverseitig geprüft, Geheimnisse verschlüsselt. | Sicherheit | Ein Mitarbeiter ohne „Rollen verwalten" erhält beim Aufruf des Audit-Logs vom Server 403, unabhängig davon, was die Oberfläche anzeigt. TOTP-Geheimnisse liegen nur verschlüsselt in der Datenbank. | [G-06](../spec/P1-ziele-rahmenbedingungen.md#p12-ziele), [NFR-15a-01](../spec/N1-nichtfunktional.md), [NFR-15b-01](../spec/N1-nichtfunktional.md), [AF-01](../spec/F3-anwendungsfunktionen.md#af-01--berechtigung-prüfen) |
| QZ-03 | **Unabhängigkeit von optionalen Nachbarsystemen.** SSO, Kalender und E-Mail sind konfigurierbar und beeinträchtigen bei Ausfall keine fachliche Aktion. | Zuverlässigkeit | Mit ungültigen SMTP- und Google-Zugangsdaten lassen sich Aufgaben anlegen und zuweisen; jede Aktion antwortet mit Erfolg, der Fehler steht nur im Serverprotokoll. | [NFR-12d-01](../spec/N1-nichtfunktional.md), [NFR-14c-01](../spec/N1-nichtfunktional.md), [CON-05](../spec/P1-ziele-rahmenbedingungen.md#p15-rahmenbedingungen) |
| QZ-04 | **Erweiterbarkeit entlang fachlicher Bereiche.** Ein neuer fachlicher Bereich (Aufgaben, Freigaben, Rollen …) ist ein Routenmodul auf dem Server, eine Maske im Browser und ein Abschnitt im Prisma-Schema, ohne Änderungen an anderen Bereichen. | Wartbarkeit (Modularität) | Die Freigaben wurden als 14. Migration, ein Routenmodul und eine Maske ergänzt, ohne bestehende Routen anzufassen. | [QZ-04 ↔ Kapitel 5](A05-bausteinsicht.md), [NFR-14a-01](../spec/N1-nichtfunktional.md) |
| QZ-05 | **Einfache Entwicklungsumgebung für sechs Studierende.** Eine Sprache, ein Paketmanager, ein Startbefehl, kein Container, keine lokale Datenbankinstallation. | Wartbarkeit, Übertragbarkeit | Ein neues Teammitglied hat nach `npm install` in drei Verzeichnissen, einer `.env` und `npm run dev` eine laufende Anwendung. | [CON-04](../spec/P1-ziele-rahmenbedingungen.md#p15-rahmenbedingungen), [CON-07](../spec/P1-ziele-rahmenbedingungen.md#p15-rahmenbedingungen), [S3](../spec/S3-inbetriebnahme.md) |

QZ-01 und QZ-02 gehören zusammen: Ein Audit-Log ist nur so viel wert wie die Sicherheit, dass der eingetragene Akteur der tatsächliche war. QZ-03 und QZ-05 haben Vorrang vor Vollständigkeit der Anbindungen: Lieber eine Funktion, die ohne Nachbarsystem läuft, als eine, die es zwingend braucht.

Was bewusst kein Qualitätsziel ist: Lastverhalten über einen Geschäftsbereich hinaus (AS-06), Hochverfügbarkeit, Mehrmandantenfähigkeit.

---

## 1.3 Stakeholder

| Rolle | Reichweite | Erwartung an die Architektur |
|-------|------------|------------------------------|
| **Mitarbeiter, Projektleitung, GBL, Administrator** | Anwender im Geschäftsbereich | Eine Oberfläche, die im Arbeitsplatz-Browser ohne Installation läuft; Antwortzeiten unter zwei Sekunden; keine Abhängigkeit von Google oder Mail für die Kernfunktion. |
| **Interne Revision** | Liest das Audit-Log über ein Administratorkonto | Vollständige, unveränderliche Einträge; keine Möglichkeit, das Log über die Anwendung zu verändern. |
| **Sparkassen-IT (Betrieb)** | Stellt Identity Provider, SMTP, Datenbank; würde die Anwendung übernehmen | Standardprotokolle (OpenID Connect, SMTP, PostgreSQL); Konfiguration über Umgebungsvariablen; keine Geheimnisse im Code; ein Bauartefakt für den Browser, ein Prozess für den Server. |
| **Projektteam** (sechs Studierende, Rollen in [`TEAMINFO.md`](../../TEAMINFO.md)) | Entwickelt und dokumentiert | Klare Modulgrenzen, damit parallel gearbeitet werden kann; eine Sprache; Spezifikation und Architektur, die den Code beschreiben, wie er ist. |
| **Dozent** | Bewertet Spezifikation, Architektur, Umsetzung | Nachvollziehbare Entscheidungen mit echten Alternativen; Bausteine, die sich im Code wiederfinden; Diagramme, die den Mechanismus zeigen. |

Ausführliche Stakeholderbeschreibung: [`P1.3`](../spec/P1-ziele-rahmenbedingungen.md#p13-stakeholder-und-benutzer).
