# Tests

Zwei Arten von Tests, beide mit Playwright, beide gegen die laufende Entwicklungsumgebung mit geladenem Seed (`npm run db:seed` in `server/`, siehe S3.3 der Spezifikation).

| Befehl (Wurzelverzeichnis) | Was läuft | Braucht |
|----------------------------|-----------|---------|
| `npm run test:e2e` | Klicktest durch alle Masken im Browser (`tests/smoke.spec.js`) | Server auf 5001, Browser-Anwendung auf 5173, Chromium (`npx playwright install chromium`) |
| `npm run test:api` | HTTP-Tests gegen die Schnittstelle (`tests/api/*.spec.js` und `tests/approval-api.spec.js`), ohne Browser | Server auf 5001 |
| `npm test` | beides nacheinander | beides |

Adresse der Schnittstelle bei Bedarf über `NEXTTASK_API_URL` setzen (Vorgabe `http://127.0.0.1:5001/api`).

## Zuordnung der API-Tests zur Spezifikation

| Datei | Prüft | Anforderung |
|-------|-------|-------------|
| `api/scope.spec.js` | Mitarbeiter sehen nur Abteilung, Projekte und Aufgaben ihrer Zugriffsrolle; GBL sieht den Geschäftsbereich; Admin alles. Fremde Projekte und Aufgaben antworten 404, auch beim Ändern und Anlegen. Kalenderliste bleibt im Sichtbereich. | AF-02, SC-01, UC-17, UC-11, UC-12 |
| `api/approvals.spec.js` | Anfragender wird nie Genehmiger; Genehmiger entscheidet mit Vermerk; zweite Entscheidung wird abgelehnt; Mitarbeiter ohne Berechtigung bekommt 403; Anfragender kann abbrechen, nur einmal; Liste zeigt Mitarbeitern nur eigene und zugewiesene Anfragen; niemand genehmigt die eigene Anfrage. | UC-18 (A1, A3), UC-19 (A1 bis A3), UC-20, AF-03, SC-02 |
| `api/two-factor.spec.js` | Einrichtung liefert Geheimnis und verlangt gültigen Code; Anmeldung verlangt danach den Code; ein Code gilt nur einmal; falscher Code wird abgelehnt; Abschalten verlangt Passwort und Code. | NFR-15a-01, AF-06, UC-02, UC-04 |
| `api/audit.spec.js` | Audit-Log nur mit "Rollen verwalten"; Aufgabenänderung erzeugt genau einen Eintrag mit altem und neuem Wert und ohne unveränderte Felder; Löschen und fehlgeschlagene Anmeldung mit passender Kritikalität; keine Aufrufe zum Ändern oder Löschen von Einträgen. | NFR-15d-01, NFR-15d-02, AF-07, UC-23, QK-03 |

`tests/approval-api.spec.js` (Jonas, 24.09.2026) prüft das Vier-Augen-Prinzip zusätzlich mit dem Admin-Konto; `api/approvals.spec.js` deckt denselben Fall mit einer GBL-Rolle ab.

## Testdaten

Die Tests nutzen die Demo-Konten des Seeds (`gast@nexttask.local`, `mara.stein@`, `nils.berger@`, `tara.klein@`, `jonas.weber@sparkasse.local`, Passwort `NextTaskDemo!2026`) und legen eigene Datensätze mit dem Präfix „API-Test" an. Aufgaben werden am Ende gelöscht, Freigabeanfragen abgebrochen (sie lassen sich nicht löschen und bleiben als `CANCELLED` sichtbar). Der Test für den zweiten Faktor registriert das Konto `api-test-2fa@nexttask.local` und schaltet den zweiten Faktor am Ende wieder ab; bricht der Lauf dazwischen ab, in der Datenbank `twoFactorEnabled` auf `false` und `twoFactorSecret` auf `NULL` setzen.

Die Tests sollten nicht gegen eine Datenbank mit echten Daten laufen (R-07).
