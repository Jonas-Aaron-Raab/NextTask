# N2 — Querschnittskonzepte

Einheitliche Lösungen für Fragen, die nicht zu einem einzelnen Anwendungsfall gehören, sondern das ganze System betreffen, nach Siedersleben (Kapitel 4.10). Jedes Konzept beschreibt die Regel, wo sie gilt und welche Grenzen sie hat.

| ID | Konzept | Betrifft |
|----|---------|----------|
| QK-01 | Authentifizierung und Sitzung | alle Masken und Schnittstellen |
| QK-02 | Berechtigungen | Verwaltung, Freigaben, Sichtbarkeit |
| QK-03 | Audit-Logging | alle ändernden Aktionen |
| QK-04 | Fehlerbehandlung und Meldungen | alle Aktionen, Nachbarsysteme |
| QK-05 | Validierung und Normalisierung | alle Eingaben |
| QK-06 | Benachrichtigungen | Aufgaben, Kommentare |
| QK-07 | Geheimnisse | Konfiguration, Datenbank |
| QK-08 | Daten im Browser | Oberfläche |

---

## QK-01 Authentifizierung und Sitzung

- **Systemregel:** Jede Anfrage an den Server außer Registrierung, Anmeldung, SSO-Start und -Rückleitung, Einlösen des Einmaltickets, SSO-Konfiguration und Kalender-Rückleitung braucht ein gültiges Zugriffstoken (JWT) im `Authorization`-Kopf. Das gilt implizit als Vorbedingung aller Anwendungsfälle ab UC-04.
- **Token:** Enthält Kennung, E-Mail, Name, grobe Rolle, Abteilung und Zugriffsrollen-ID des Anwenders sowie den Verwendungszweck `access`; signiert mit dem Serverschlüssel; sieben Tage gültig. Token für den zweiten Faktor tragen den Zweck `two_factor_login` und werden vom Zugriffsschutz abgewiesen.
- **Drei Anmeldewege** führen zu demselben Token: Passwort, Passwort mit zweitem Faktor, SSO ([UC-02](F2-anwendungsfaelle.md#uc-02--anmelden-mit-passwort), [UC-03](F2-anwendungsfaelle.md#uc-03--anmelden-per-sso)). Der Anmeldeweg ist am Konto als `authProvider` vermerkt ([D2.14](D2-datentypen.md#d214-authproviderdt-und-calendarproviderdt)).
- **Im Browser** liegen Token und Profil im Local Storage. Antwortet der Server mit 401, löscht die Oberfläche beide und zeigt die Anmeldung (B1.4.2). Abmelden löscht nur im Browser.
- **Grenzen:** Kein serverseitiger Widerruf, keine Sitzungsliste, keine Begrenzung von Anmeldeversuchen (R-02, [NFR-15a-01](N1-nichtfunktional.md)). Der im Code angelegte Gastmodus (`isGuest` im Token) wird von keinem Anmeldeweg vergeben (NG-08).

---

## QK-02 Berechtigungen

Drei Ebenen wirken zusammen:

| Ebene | Grundlage | Wer prüft |
|-------|-----------|-----------|
| **Berechtigung** | Sechs Schalter der Zugriffsrolle ([D2.6](D2-datentypen.md#d26-permissionsetdt)); „Rollen verwalten" und „Freigaben entscheiden" haben feste Ableitungen aus Rollenart und grober Rolle ([AF-01](F3-anwendungsfunktionen.md#af-01--berechtigung-prüfen)). | Server bei Rollen, Benutzern, Audit-Log, Freigabeentscheidungen; Oberfläche zusätzlich für Sperrseiten und die vier übrigen Schalter. |
| **Sichtbereich** | Grobe Rolle, Bearbeiter, Projekteigentum, Abteilung ([AF-02](F3-anwendungsfunktionen.md#af-02--sichtbare-aufgaben-bestimmen)). | Server bei Aufgabenlisten; Oberfläche für Abteilungsfilter im Dashboard. |
| **Eigentum** | Eigentümer eines Projekts pflegt Berichtsbasis und Statusberichte; Eigentümer des Bezugsobjekts ist Standard-Genehmiger ([AF-03](F3-anwendungsfunktionen.md#af-03--genehmiger-bestimmen)). | Server. |

**Regeln**

- Berechtigungen werden bei jeder Anfrage aus der Datenbank gelesen, nicht aus dem Token. Eine Rollenänderung wirkt sofort.
- Systemrollen sind unlöschbar; die Rolle Admin hat immer alle Berechtigungen.
- Das Vier-Augen-Prinzip wird durch die Genehmigerbestimmung gesichert (Anfragender ist nie Genehmiger), nicht durch ein Verbot: Wer „Freigaben entscheiden" hat, kann jede offene Anfrage entscheiden.

**Grenzen (Stand September 2026)**

- Der Server prüft bei Aufgaben, Kommentaren, Verschieben, Terminieren und Löschen keine Berechtigung über die Anmeldung hinaus. Jeder Anwender kann über die Schnittstelle Aufgaben in jedem Projekt ändern. Die Schalter „Aufgaben bearbeiten", „Projekte bearbeiten", „Abteilungen sehen" und „Reports sehen" wirken nur in der Oberfläche.
- Der Sichtbereich nach Abteilung beruht auf einem Textvergleich ([D1.5](D1-datenmodell.md#d15-organisationsstruktur)).
- Das Löschen einer Rolle hebt ihre Benutzer auf Admin (R-04).

---

## QK-03 Audit-Logging

Jede ändernde Aktion und jeder Anmeldeversuch schreibt einen Eintrag nach [AF-07](F3-anwendungsfunktionen.md#af-07--audit-eintrag-mit-differenz-schreiben) in `AuditLog` ([D1.4](D1-datenmodell.md#d14-steuerung-und-nachweis)). Lesezugriffe werden nicht protokolliert.

| Bereich | Aktion | Kritikalität | Anwendungsfall |
|---------|--------|--------------|----------------|
| Anmeldung | `USER_REGISTERED` | NOTICE | UC-01 |
| | `LOGIN_SUCCESS` | INFO | UC-02, UC-03 |
| | `LOGIN_FAILED` | WARNING | UC-02 |
| | `TWO_FACTOR_REQUIRED` | NOTICE | UC-02 |
| | `TWO_FACTOR_LOGIN_FAILED` | WARNING | UC-02 |
| | `TWO_FACTOR_RECOVERY_CODE_USED` | WARNING | UC-02 |
| | `SSO_CALLBACK_ACCEPTED`, `SSO_LOGIN_SUCCESS` | INFO | UC-03 |
| | `SSO_LOGIN_FAILED` | WARNING | UC-03 |
| | `TWO_FACTOR_SETUP_STARTED` | NOTICE | UC-04 |
| | `TWO_FACTOR_SETUP_FAILED`, `TWO_FACTOR_DISABLE_FAILED` | WARNING | UC-04 |
| | `TWO_FACTOR_ENABLED`, `TWO_FACTOR_DISABLED` | WARNING | UC-04 |
| Benutzer | `PROFILE_UPDATED` | NOTICE | UC-05 |
| | `PASSWORD_CHANGED` | WARNING | UC-05 |
| | `USER_CREATED`, `USER_ROLE_ASSIGNED` | WARNING | UC-22 |
| | `CALENDAR_CONNECTED` | NOTICE | UC-25 |
| | `CALENDAR_SYNC_TRIGGERED` | INFO | UC-25 |
| | `CALENDAR_DISCONNECTED` | WARNING | UC-25 |
| Rolle | `ROLE_CREATED`, `ROLE_UPDATED` | WARNING | UC-21 |
| | `ROLE_DELETED` | CRITICAL | UC-21 |
| Projekt | `PROJECT_CREATED`, `PROJECT_REPORTING_UPDATED`, `PROJECT_STATUS_REPORT_CREATED` | NOTICE | UC-07, UC-08, UC-09 |
| Aufgabe | `TASK_CREATED`, `TASK_UPDATED`, `TASK_SCHEDULED` | NOTICE | UC-11, UC-12, UC-14 |
| | `TASK_MOVED` | INFO, WARNING bei Ziel `BLOCKED` | UC-13 |
| | `TASK_DELETED` | WARNING | UC-16 |
| Kommentar | `COMMENT_CREATED` | INFO | UC-15 |
| Freigabe | `APPROVAL_REQUESTED`, `APPROVAL_APPROVED` | NOTICE | UC-18, UC-19 |
| | `APPROVAL_REJECTED` | WARNING | UC-19 |
| | `APPROVAL_CANCELLED` | INFO | UC-20 |
| Aufgabenfarben | `TASK_MARKERS_UPDATED` | NOTICE | UC-24 |

Jeder Eintrag trägt den Akteur als Text (Name, E-Mail, Rollenname), damit er auch nach Löschung oder Umbenennung des Kontos lesbar bleibt. Einträge werden nur angefügt ([NFR-15d-01](N1-nichtfunktional.md)). Lesen nur mit „Rollen verwalten" ([NFR-15d-02](N1-nichtfunktional.md), [UC-23](F2-anwendungsfaelle.md#uc-23--audit-log-einsehen)).

---

## QK-04 Fehlerbehandlung und Meldungen

- **Eingabefehler** (400): deutscher Satz in `message`, der sagt, was fehlt oder falsch ist; die Oberfläche zeigt ihn unverändert an. Die Sätze stehen in den Ausnahmeszenarien in [F2](F2-anwendungsfaelle.md).
- **Anmeldung** (401) und **Berechtigung** (403): feste Sätze („Bitte einloggen", „Keine Berechtigung für …"); die Oberfläche reagiert mit Umleitung bzw. Sperrseite.
- **Nicht gefunden** (404): „… wurde nicht gefunden". Wird auch verwendet, wenn ein Objekt existiert, aber nicht dem Anwender gehört (Projekte), damit die Existenz fremder Objekte nicht verraten wird.
- **Serverfehler** (500): „Serverfehler" oder „Fehler beim …" mit technischer Ursache in `error`. Die Oberfläche zeigt `message`.
- **Nachbarsysteme:** Fehler bei Kalender und E-Mail werden im Serverprotokoll vermerkt und brechen die Aktion nicht ab ([NFR-12d-01](N1-nichtfunktional.md)). Fehler beim Identity Provider brechen nur die SSO-Anmeldung ab.
- **Oberfläche:** Fehler erscheinen als rote Zeile in der Maske (B1.4.4). Einige Masken (Dashboard, Kalender, Board) fangen Serverfehler still ab und zeigen lokale oder Beispieldaten; das ist in B1.5 vermerkt und für den Anwender nicht erkennbar.

---

## QK-05 Validierung und Normalisierung

- **Pflichtfelder** werden in der Oberfläche (Schaltfläche gesperrt, Hinweis) und auf dem Server geprüft. Der Server ist maßgeblich.
- **Texte** werden getrimmt; leere Texte gelten als nicht angegeben. E-Mail-Adressen werden in Kleinschreibung gespeichert und verglichen. Kurzcodes und Geschäftsbereiche in Großschreibung.
- **Aufzählungen** mit festem Wertebereich (Status, Priorität, Rollenart, Freigabetyp, Freigabestatus, Merkmal der Farbstreifen, Kritikalität) werden auf die Werte aus [D2](D2-datentypen.md) normalisiert; unbekannte Werte fallen auf die Vorgabe zurück ([AF-04](F3-anwendungsfunktionen.md#af-04--status-priorität-und-eingaben-normalisieren)).
- **Freie Statuswerte** der Berichtsbasis (Meilensteinstatus, Risikoklasse, Tendenz, Ampeln, Freigabestufe) werden als Text übernommen; die Oberfläche gibt sie als Auswahllisten vor (R-06).
- **Zahlen und Daten:** ungültige Werte werden leer, nicht abgewiesen. Ein Tippfehler in einem Datum führt also zu einer Aufgabe ohne Datum, nicht zu einer Fehlermeldung.
- **Längen:** Farbstreifen (80/180/120 Zeichen), Audit-Felder (80/120/160/300 Zeichen) werden abgeschnitten. Andere Textfelder haben keine Längenbegrenzung.
- **Passwörter:** Mindestlänge acht Zeichen nur beim Ändern ([NFR-15b-02](N1-nichtfunktional.md)).

---

## QK-06 Benachrichtigungen

Zwei Kanäle, beide nur für Aufgaben:

| Kanal | Anlass | Empfänger entscheidet über | Regel |
|-------|--------|----------------------------|-------|
| E-Mail | Zuweisung, Neuzuweisung, Erwähnung, Testmail | Schalter „Benachrichtigungen aktivieren" und Benachrichtigungsadresse im Profil | [AF-09](F3-anwendungsfunktionen.md#af-09--benachrichtigung-per-e-mail) |
| Kalendertermin | Frist einer zugewiesenen Aufgabe | Verbundener Google-Kalender | [AF-08](F3-anwendungsfunktionen.md#af-08--kalenderabgleich) |

Keine Benachrichtigung gibt es bei Freigabeentscheidungen, Kommentaren ohne Erwähnung, Statuswechseln und Fristablauf. Die Benachrichtigungsanzeige im Anwendungsrahmen ist nicht angebunden (B1.5). Beide Kanäle sind serverseitig abschaltbar (S3) und beeinträchtigen bei Ausfall die Aktion nicht (QK-04).

---

## QK-07 Geheimnisse

| Geheimnis | Ablage | Schutz |
|-----------|--------|--------|
| Serverschlüssel (`JWT_SECRET`), 2FA-Schlüssel, Client-Secrets, SMTP-Passwort | Konfigurationsdatei des Servers (S3.2) | Nicht versioniert; Verlust siehe S3.4. |
| Passwörter | `User.password` | bcrypt-Hash, Kostenfaktor 10. |
| TOTP-Geheimnis, Kalender-Dauerzugriff | `User.twoFactorSecret`, `User.calendarRefreshToken` | AES-256-GCM mit abgeleitetem Schlüssel, Kennzeichen `v1:` ([D2.1](D2-datentypen.md#d21-typkatalog)). Entschlüsselung nur im Server für den jeweiligen Vorgang. |
| Wiederherstellungscodes | `User.twoFactorRecoveryCodes` | bcrypt-Hashes; Klartext nur einmalig bei der Einrichtung sichtbar. |
| SSO-Einmalticket | `SsoLoginTicket.tokenHash` | SHA-256-Hash; 90 Sekunden; einmal einlösbar. |
| SSO-Zustand, Kalender-Zustand | nur in der Umleitungsadresse | Verschlüsselt bzw. signiert mit vom Serverschlüssel abgeleiteten Schlüsseln; zeitlich begrenzt. |
| Zugriffstoken | Browser (Local Storage) | Signiert; sieben Tage. Für Skripte im Browser lesbar; ein Schutz gegen eingeschleusten Code ist nicht Teil des Konzepts. |

Geheimnisse erscheinen nie in Antworten an den Browser (Ausnahme: das TOTP-Geheimnis einmalig bei der Einrichtung, die Wiederherstellungscodes einmalig nach Bestätigung) und nie im Audit-Log ([NFR-15b-03](N1-nichtfunktional.md)).

---

## QK-08 Daten im Browser

Die Oberfläche hält Daten aus drei Gründen im Local Storage des Browsers:

| Zweck | Schlüssel | Verhalten |
|-------|-----------|-----------|
| Sitzung | `token`, `user` | Siehe QK-01. |
| Anzeigeeinstellungen | `nexttask:appearance`, `nexttask:dismissed-notifications` | Nur Komfort; Verlust folgenlos. |
| Kopie serverseitiger Daten | `nexttask:task-marker-settings` (Farbstreifen), `nexttask:bank-access-config` (Rollen als Rückfall), `nexttask:local-approvals` (vorgemerkte Freigaben) | Wird beim Laden vom Server überschrieben bzw. mit ihm zusammengeführt. |
| Fachdaten ohne Serverentsprechung | `nexttask:projects` (Projekte, Berichtsbasis, Backlog), `nexttask:my-tasks` (Board), `nexttask-calendar-schedule-overrides` (nicht speicherbare Verschiebungen) | Bleiben an Browser und Gerät gebunden; andere Anwender sehen sie nicht; ein Leeren des Browserspeichers löscht sie (R-01). |

Die vierte Gruppe ist eine Übergangslösung aus der Entwicklung. Zielbild ist, dass alle Fachdaten über die Schnittstelle des Servers laufen ([P1.8](P1-ziele-rahmenbedingungen.md#p18-risiken), [B1.5](B1-dialogspezifikation.md#b15-stand-der-anbindung)).

---

## Querverweise

| Baustein | Bezug zu N2 |
|----------|-------------|
| [F3](F3-anwendungsfunktionen.md) | AF-01 (QK-02), AF-04 (QK-05), AF-06 (QK-07), AF-07 (QK-03), AF-08 und AF-09 (QK-06). |
| [N1](N1-nichtfunktional.md) | Anforderungen mit Prüfkriterium zu QK-01, QK-03, QK-07. |
| [S1](S1-nachbarsysteme.md), [S3](S3-inbetriebnahme.md) | Nachbarsysteme und Konfiguration. |
| [B1](B1-dialogspezifikation.md) | Dialogmuster und Stand der Anbindung. |
