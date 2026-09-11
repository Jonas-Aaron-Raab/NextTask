# F3 — Anwendungsfunktionen

Fachliche Regeln und Algorithmen nach Siedersleben (Kapitel 4.5), die in mehreren Anwendungsfällen gebraucht werden und deshalb einmal beschrieben sind. Jede Funktion ist so formuliert, dass sie sich ohne Blick in den Code nachprüfen lässt.

| ID | Funktion | Verwendet in |
|----|----------|--------------|
| AF-01 | Berechtigung prüfen | UC-19 bis UC-23 |
| AF-02 | Sichtbare Aufgaben bestimmen | UC-17 |
| AF-03 | Genehmiger bestimmen | UC-18, UC-19, UC-20 |
| AF-04 | Status, Priorität und Eingaben normalisieren | UC-11 bis UC-14 |
| AF-05 | Projektschlüssel erzeugen | UC-07 |
| AF-06 | Zweiten Faktor prüfen | UC-02, UC-04 |
| AF-07 | Audit-Eintrag mit Differenz schreiben | alle ändernden Anwendungsfälle |
| AF-08 | Kalenderabgleich | UC-11, UC-12, UC-14, UC-16, UC-25 |
| AF-09 | Benachrichtigung per E-Mail | UC-05, UC-11, UC-12, UC-14, UC-15 |
| AF-10 | Farbstreifen zuordnen | UC-17, UC-24 |
| AF-11 | SSO-Konto abgleichen | UC-03 |

---

## AF-01 — Berechtigung prüfen

Zwei Berechtigungen werden vom Server bei jeder betroffenen Anfrage geprüft. Grundlage sind die Zugriffsrolle des Anwenders ([D2.6](D2-datentypen.md#d26-permissionsetdt)) und seine grobe Rolle ([D2.4](D2-datentypen.md#d24-userroledt)).

| Berechtigung | Gilt, wenn eine der Bedingungen erfüllt ist | Schützt |
|--------------|---------------------------------------------|---------|
| **Rollen verwalten** | Zugriffsrolle hat `manageRoles`; Rollenart `ADMIN`; grobe Rolle `ADMIN` | Rollen anlegen, ändern, löschen; Benutzer anlegen und zuordnen (UC-21, UC-22); Audit-Log lesen (UC-23) |
| **Freigaben entscheiden** | Zugriffsrolle hat `approveRequests`; Rollenart `ADMIN` oder `GBL`; grobe Rolle `ADMIN` oder `PROJECT_MANAGER` | Entscheiden und Abbrechen fremder Freigaben (UC-19, UC-20); Sicht auf alle Freigaben |

Fehlt die Berechtigung, antwortet der Server mit „Keine Berechtigung …" und führt die Aktion nicht aus. Die Prüfung liest die Zugriffsrolle bei jeder Anfrage neu aus der Datenbank, nicht aus dem Zugriffstoken; eine geänderte Rollenzuordnung wirkt also sofort.

Die übrigen vier Berechtigungen (`viewDepartments`, `editProjects`, `editTasks`, `viewReports`) werden nur von der Oberfläche ausgewertet. Der Server prüft bei Aufgaben nicht, ob der Anwender das Projekt sehen darf; jeder angemeldete Anwender kann über die Schnittstelle Aufgaben in jedem Projekt anlegen und ändern. Das ist als Einschränkung in [N2](N2-querschnittskonzepte.md) festgehalten.

---

## AF-02 — Sichtbare Aufgaben bestimmen

Liefert die Aufgaben, die ein Anwender in Kalender, Dashboard und Board sieht (UC-17).

1. **Grundmenge nach Rolle.** Anwender mit grober Rolle `ADMIN` oder `PROJECT_MANAGER` sehen alle Aufgaben. Alle anderen sehen eine Aufgabe, wenn mindestens eines gilt: sie sind Bearbeiter; sie sind Eigentümer des Projekts; `Task.department` ist gleich ihrer eigenen `User.department` (Textvergleich, siehe [D1.5](D1-datenmodell.md#d15-organisationsstruktur)).
2. **Filter**, alle optional und kombinierbar:

| Filter | Wirkung |
|--------|---------|
| Zeitraum `from` bis `to` | Frist, Beginn oder Ende liegt im Zeitraum. |
| Aufgabe, Projekt, Bearbeiter, Status, Priorität, Abteilung | Gleichheit. |
| Nur meine | Bearbeiter ist der Anwender. |
| Nur überfällige | Frist liegt in der Vergangenheit und Status ist nicht `DONE`. |
| Suche | Text kommt in Titel, Beschreibung, Projektname oder Bearbeitername vor, ohne Unterscheidung von Groß- und Kleinschreibung. |

3. **Sortierung:** Frist aufsteigend, dann Beginn aufsteigend, dann Priorität absteigend.

Die Projektliste folgt einer strengeren Regel: Ein Anwender sieht nur Projekte, deren Eigentümer er ist.

---

## AF-03 — Genehmiger bestimmen

Legt beim Anlegen einer Freigabeanfrage (UC-18) fest, wer entscheiden soll, und bei jeder Entscheidung (UC-19, UC-20), wer darf.

**Genehmiger beim Anlegen**, erste zutreffende Regel gewinnt:

1. Der vom Anfragenden gewünschte Genehmiger, sofern angegeben.
2. Der Eigentümer des Bezugsobjekts: bei Aufgabe und Statusbericht der Eigentümer des zugehörigen Projekts, bei Projekt dessen Eigentümer. Dokumente und freie Anliegen haben keinen Eigentümer.
3. Ist der so bestimmte Genehmiger der Anfragende selbst, wird er verworfen.
4. Fehlt danach ein Genehmiger, wird der älteste Anwender (nach Anlagedatum) gewählt, der nicht der Anfragende ist und der grobe Rolle `ADMIN` oder `PROJECT_MANAGER` oder eine Zugriffsrolle der Art `ADMIN` oder `GBL` hat.
5. Gibt es auch den nicht, bleibt der Genehmiger leer. Die Anfrage ist trotzdem gültig.

Ein angegebener Genehmiger muss als Konto existieren, sonst wird die Anfrage abgewiesen.

**Wer entscheiden darf:** der eingetragene Genehmiger oder jeder mit „Freigaben entscheiden" (AF-01). Entscheidet jemand anderes als der eingetragene Genehmiger, wird er nachträglich als Genehmiger eingetragen, wenn vorher keiner gesetzt war.

**Wer abbrechen darf:** zusätzlich der Anfragende.

**Sichtbereich der Freigabenliste:**

| Anwender | Sieht |
|----------|-------|
| mit „Freigaben entscheiden" | alle Anfragen; im Eingang die ihm zugewiesenen und die ohne Genehmiger |
| ohne | eigene Anfragen und die ihm zugewiesenen; im Eingang nur die zugewiesenen |

---

## AF-04 — Status, Priorität und Eingaben normalisieren

Der Server nimmt Eingaben aus verschiedenen Masken an und bringt sie auf die Werte aus [D2](D2-datentypen.md).

| Eingabe | Regel |
|---------|-------|
| Status | Abbildung nach der Übergangstabelle in [D2.3](D2-datentypen.md#d23-taskstatusdt); unbekannt → `OPEN`. Beim Ändern bleibt der Status unverändert, wenn keiner übergeben wird. |
| Priorität | In Großbuchstaben; muss `LOW`, `MEDIUM`, `HIGH` oder `URGENT` sein, sonst `MEDIUM`. |
| Datum (Beginn, Frist, Ende) | Muss sich als Datum lesen lassen, sonst leer. |
| Aufwand in Stunden | Komma wird als Dezimaltrenner akzeptiert; nicht lesbare Werte werden leer. |
| Position (`order`) | Neue Aufgaben erhalten die höchste Position ihrer Statusspalte im Projekt plus eins; die erste Aufgabe einer Spalte erhält 0. Beim Verschieben (UC-13) übergibt die Oberfläche die Zielposition. |
| Texte | Führende und schließende Leerzeichen werden entfernt; leere Texte gelten als nicht angegeben. E-Mail-Adressen werden in Kleinschreibung gebracht. |
| Listen (Schnittstellen, Geschäftsbereiche, Abteilungen) | Als Liste oder als Text mit Komma bzw. Zeilenumbruch als Trenner; leere Einträge entfallen. |

---

## AF-05 — Projektschlüssel erzeugen

Wird beim Anlegen eines Projekts (UC-07) kein Schlüssel angegeben, entsteht er aus dem Namen:

1. Name in Großbuchstaben.
2. Jede Folge von Zeichen außer `A` bis `Z` und `0` bis `9` wird durch einen Bindestrich ersetzt; Bindestriche am Anfang und Ende entfallen.
3. Auf 24 Zeichen gekürzt. Bleibt nichts übrig, lautet der Stamm `PROJEKT`.
4. Angehängt werden ein Bindestrich und die letzten sechs Ziffern des Zeitstempels in Millisekunden.

Beispiel: „Kernbank API Modernisierung" → `KERNBANK-API-MODERNISIERU-483921`. Die Eindeutigkeit sichert die Datenbank; ein Konflikt ist wegen des Zeitanteils praktisch ausgeschlossen.

---

## AF-06 — Zweiten Faktor prüfen

Grundlage ist TOTP nach RFC 6238 mit sechs Ziffern und einem Zeitschritt von 30 Sekunden.

**Einrichtung (UC-04):**

1. Der Server erzeugt ein Geheimnis von 20 Byte, speichert es verschlüsselt ([N2](N2-querschnittskonzepte.md), Geheimnisse) und zeigt es als QR-Code und als Text. Ein vorher begonnener, nicht bestätigter Versuch wird dabei überschrieben.
2. Der Anwender bestätigt mit einem Code aus seiner App. Stimmt der Code, wird der zweite Faktor aktiv; der Zeitschritt des Codes wird als zuletzt verwendet gemerkt.
3. Der Server erzeugt zehn Wiederherstellungscodes (je 10 Zeichen), zeigt sie einmalig an und speichert nur ihre Hashes.

**Prüfung bei der Anmeldung (UC-02):**

1. Der Code wird als TOTP gegen den aktuellen Zeitschritt und je einen Schritt davor und danach geprüft (Toleranz für Uhrenabweichung von 30 Sekunden).
2. Ein gültiger TOTP-Code wird nur angenommen, wenn sein Zeitschritt größer ist als der zuletzt verwendete. Damit kann derselbe Code nicht zweimal benutzt werden.
3. Passt kein TOTP-Code, wird der Eingabewert gegen die Wiederherstellungscodes geprüft. Ein Treffer wird verbraucht und aus der Liste entfernt; der Vorgang wird mit Kritikalität `WARNING` protokolliert.
4. Sonst schlägt die Anmeldung fehl.

**Deaktivierung (UC-04):** verlangt das aktuelle Passwort und einen gültigen Code (TOTP oder Wiederherstellungscode, hier ohne Wiederholungsprüfung). Danach werden Geheimnis und Wiederherstellungscodes gelöscht.

---

## AF-07 — Audit-Eintrag mit Differenz schreiben

Jede ändernde Aktion schreibt genau einen Eintrag in `AuditLog` ([D1.4](D1-datenmodell.md#d14-steuerung-und-nachweis)). Die vollständige Liste der Aktionen steht in [N2](N2-querschnittskonzepte.md).

1. **Akteur:** der angemeldete Anwender mit Name, E-Mail und Rollenname zum Zeitpunkt der Aktion. Bei fehlgeschlagener Anmeldung die eingegebene E-Mail; bei SSO-Fehlern „SSO"; sonst „System".
2. **Herkunft:** IP-Adresse (erste Adresse aus `X-Forwarded-For`, sonst die Verbindungsadresse) und Browserkennung.
3. **Differenz:** Aus einem festgelegten Feldsatz je Entität werden Vorher- und Nachher-Zustand gelesen. Für jedes Feld, dessen Wert sich geändert hat, wird `{vorher, nachher}` in `before` abgelegt; `after` hält den vollständigen Nachher-Zustand. Zeitstempel werden als ISO-Text abgelegt.
4. **Ausschluss:** Felder mit den Namen `password` und `token` werden auf jeder Ebene entfernt.
5. **Längen:** Aktion und Objekttyp bis 80 Zeichen, Objekt-ID bis 120, Objektbezeichnung bis 160, Zusammenfassung bis 300; längere Werte werden abgeschnitten.
6. **Fehlertoleranz:** Schlägt das Schreiben fehl, wird der Fehler im Serverprotokoll vermerkt und die fachliche Aktion trotzdem abgeschlossen.

---

## AF-08 — Kalenderabgleich

Überträgt die Frist einer Aufgabe als ganztägigen Termin in den Google-Kalender ihres Bearbeiters.

**Voraussetzung:** Der Bearbeiter hat einen Kalender verbunden (UC-25), die Verbindung ist aktiv, und die Aufgabe hat eine Frist.

**Je Aufgabe** (nach UC-11, UC-12, UC-14 und bei Zuweisung):

- Sind die Voraussetzungen erfüllt, wird der Termin angelegt oder aktualisiert: Datum ist die Frist, Titel ist der Aufgabentitel. Die Verknüpfung wird in `CalendarSyncEvent` gehalten.
- Sind sie nicht erfüllt (kein Bearbeiter, keine Frist, kein Kalender), werden vorhandene Termine der Aufgabe entfernt. Das gilt auch, wenn der Bearbeiter wechselt: Der Termin im Kalender des alten Bearbeiters wird gelöscht.
- Beim Löschen der Aufgabe (UC-16) werden ihre Termine vor dem Löschen entfernt.

**Vollabgleich** (UC-25, nach dem Verbinden und auf Knopfdruck): Alle dem Anwender zugewiesenen Aufgaben mit Frist werden übertragen; Verknüpfungen zu Aufgaben, die nicht mehr zugewiesen sind oder keine Frist haben, werden samt Termin entfernt. Zeitpunkt und Anzahl werden am Konto vermerkt.

**Fehler:** Ein Fehler beim Kalenderdienst bricht die fachliche Aktion nicht ab. Er wird im Serverprotokoll vermerkt; beim Vollabgleich zusätzlich als `calendarSyncError` am Konto, sichtbar in den Einstellungen.

---

## AF-09 — Benachrichtigung per E-Mail

**Voraussetzung auf dem Server:** Versand ist per Konfiguration eingeschaltet und ein SMTP-Zugang ist vollständig hinterlegt (S3). Fehlt eines, wird keine Mail erzeugt und kein Fehler gemeldet.

**Voraussetzung beim Empfänger:** Benachrichtigungen sind im Profil aktiviert; Empfängeradresse ist `notificationEmail`, ersatzweise `email`.

| Anlass | Empfänger | Betreff |
|--------|-----------|---------|
| Aufgabe angelegt mit Bearbeiter (UC-11) | der Bearbeiter | „Neues Ticket für dich: <Titel>" |
| Bearbeiter geändert (UC-12, UC-14) | der neue Bearbeiter | „Ticket neu zugewiesen: <Titel>"; bei erstmaliger Zuweisung wie oben |
| Kommentar mit Erwähnung (UC-15) | jeder erwähnte Anwender außer dem Verfasser, je Person einmal | „Erwaehnung in Ticket: <Titel>" |
| Testmail (UC-05) | der Anwender selbst | „NextTask Testmail" |

Eine Erwähnung ist der Text `@` gefolgt vom vollständigen Anzeigenamen des Anwenders als eigenes Wort, ohne Unterscheidung von Groß- und Kleinschreibung. Der Name muss nicht in Anführungszeichen stehen; „@Mara Stein" erwähnt die Anwenderin Mara Stein.

Bleibt der Bearbeiter beim Ändern gleich, wird keine Mail gesendet. Fehler beim Versand werden im Serverprotokoll vermerkt und brechen die Aktion nicht ab.

---

## AF-10 — Farbstreifen zuordnen

Bestimmt für eine Aufgabe im Board die Farbe ihres linken Randes aus den persönlichen Farbstreifen des Anwenders ([D1.3](D1-datenmodell.md#d13-aufgaben), [D2.13](D2-datentypen.md#d213-matchfielddt)).

1. Trägt die Aufgabe einen `markerId`, der auf einen Farbstreifen des Anwenders zeigt, gilt dieser.
2. Sonst wird die Liste der Farbstreifen in ihrer Reihenfolge durchlaufen; der erste, dessen Merkmal und Vergleichswert auf die Aufgabe passen, gilt.
3. Passt keiner, hat die Aufgabe keinen Farbstreifen.

**Pflege (UC-24):** Beim ersten Lesen legt der Server fünf Standardstreifen an. Beim Speichern ersetzt die übergebene Liste den gesamten Bestand des Anwenders in einer Transaktion: nicht mehr enthaltene Streifen werden gelöscht, bekannte aktualisiert, neue angelegt; die Liste ist auf 60 Einträge begrenzt, Bezeichnung auf 80 Zeichen (Vorgabe „Neue Markierung"), Beschreibung auf 180, Vergleichswert auf 120; ungültige Farben werden ersetzt. Eine leere Liste stellt die Standardstreifen wieder her.

---

## AF-11 — SSO-Konto abgleichen

Verbindet ein vom Identity Provider bestätigtes Profil (Subjekt, E-Mail, Name, Gruppen, E-Mail bestätigt) mit einem NextTask-Konto (UC-03).

1. **Zulassung:** Ist „bestätigte E-Mail erforderlich" konfiguriert, muss der Identity Provider die E-Mail als bestätigt melden. Ist eine Liste erlaubter E-Mail-Domänen konfiguriert, muss die Domäne enthalten sein. Sonst wird die Anmeldung abgewiesen.
2. **Zugriffsrolle:** Enthält das Profil eine der konfigurierten Administratorgruppen, ist die Zielrolle Admin (`A`); sonst die konfigurierte Standardrolle (Vorgabe `M-OR-IT`).
3. **Vorhandenes Konto** (über die SSO-Verknüpfung oder die E-Mail-Adresse gefunden):
   - Ist es bereits mit einem anderen SSO-Subjekt verknüpft, wird die Anmeldung mit „Diese E-Mail ist bereits mit einem anderen SSO-Profil verbunden" abgewiesen.
   - Sonst werden Verknüpfung und Zeitpunkt der letzten SSO-Anmeldung gesetzt; ein lokales Konto wird zu `LOCAL_SSO`. Eine vorhandene Zugriffsrolle bleibt erhalten; nur ein Konto ohne Zugriffsrolle erhält die Zielrolle.
4. **Neues Konto:** Nur wenn „Konten automatisch anlegen" konfiguriert ist (Vorgabe ja); sonst „Für diesen SSO-Nutzer existiert noch kein NextTask-Account". Das Konto erhält Name und E-Mail aus dem Profil, ein zufälliges, unbrauchbares Passwort, `authProvider = SSO`, die konfigurierte Standardabteilung und die Zielrolle. Grobe Rolle ist `ADMIN` bei Administratorgruppe, sonst die konfigurierte Vorgabe (`DEVELOPER`).

Das SSO bestätigt nur die Identität. Rollen und Berechtigungen verwaltet NextTask weiterhin selbst (CON-03); eine spätere Änderung der Gruppen beim Identity Provider ändert eine bereits zugeordnete Rolle nicht.

---

## Querverweise

| Baustein | Bezug zu F3 |
|----------|-------------|
| [F2](F2-anwendungsfaelle.md) | Verwendung je Anwendungsfall, siehe Tabelle oben. |
| [D2](D2-datentypen.md) | Wertebereiche, auf die AF-04 normalisiert; Berechtigungen für AF-01. |
| [N2](N2-querschnittskonzepte.md) | Berechtigungskonzept (AF-01), Audit-Logging (AF-07), Geheimnisse (AF-06), Fehlerbehandlung bei Nachbarsystemen (AF-08, AF-09). |
| [S1](S1-nachbarsysteme.md) | Schnittstellen, die AF-08, AF-09 und AF-11 verwenden. |
