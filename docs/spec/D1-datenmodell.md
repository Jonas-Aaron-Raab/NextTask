# D1 — Datenmodell

Informationsmodell von NextTask nach Siedersleben (Kapitel 4.6): die Entitäten, ihre Attribute und Beziehungen, unabhängig von der physischen Speicherung. Grundlage ist das Datenmodell des Servers; alle 29 Entitäten liegen in der Datenbank von NextTask. Seit dem Stand vom 13. September 2026 hält der Server auch die Abteilungen, die Detailangaben einer Aufgabe und die Dokumente, die vorher als Beispieldaten im Browser lagen.

Attributtypen, die nicht selbsterklärend sind, stehen in [D2](D2-datentypen.md) und enden auf `DT`. Einfache Typen (`Text`, `Integer`, `Boolean`, `Datum`, `Zeitstempel`, `Email`, `URL`, `JSON`) werden ohne eigene Definition verwendet; `PT`, `EUR`, `Stunden`, `Prozent`, `Farbe` und `Identifier` sind in [D2.1](D2-datentypen.md#d21-typkatalog) kurz erklärt. Jede Entität hat einen technischen Schlüssel `id` vom Typ `Identifier` und, sofern nicht anders vermerkt, die Zeitstempel `createdAt` und `updatedAt`; beide werden in den Tabellen nicht wiederholt.

![D1 Informationsmodell: Kernentitäten](diagrams-png/d1-informationsmodell.png)

Das erste Diagramm zeigt die 18 Kernentitäten in vier Gruppen (D1.1, D1.2, Teile von D1.3, D1.5). Vier Beziehungen zu `User` (Autor eines Statusberichts, Autor eines Kommentars, Besitzer eines Kalenderabgleichs, Akteur eines Audit-Eintrags) sind nicht gezeichnet, weil sie das Bild unleserlich machen; sie stehen in den Attributtabellen. Die elf Detailentitäten der Aufgabe und der Dokumente zeigt das zweite Diagramm in D1.3.

---

## D1.1 Organisation und Zugang

### User

Ein Anwender von NextTask. Konten entstehen durch Registrierung (UC-01), durch einen Administrator (UC-22), automatisch bei der ersten SSO-Anmeldung (UC-03) oder durch das Seed-Skript bei der Inbetriebnahme (S3).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `name` | Text | Anzeigename; wird für Erwähnungen in Kommentaren verwendet (AF-09) und verknüpft Abteilungsmitglieder und Projektleitungen über den Namen (D1.6). |
| `email` | Email | Anmeldename, eindeutig, wird in Kleinschreibung gespeichert. |
| `password` | Text | Passwort-Hash. Bei SSO-Konten ein zufälliger Wert, mit dem keine Anmeldung möglich ist. |
| `department` | Text | Abteilung als Anzeigename, Vorgabe `Development`; bei SSO-Konten der konfigurierte Standard. Seit dem Stand vom 13. September nur noch Anzeige; der Sichtbereich kommt aus der Zugriffsrolle (D1.6). |
| `role` | UserRoleDT | Grobe Rolle, abgeleitet aus der Rollenart der Zugriffsrolle bei jeder Zuordnung (UC-22). |
| `accessRole` | → AccessRole [0..1] | Zugriffsrolle mit Sichtbereich und Berechtigungen. |
| `ledDepartments` | → Department [*] | Abteilungen, deren Leitung dieses Konto ist. |
| `authProvider` | AuthProviderDT | Wie sich das Konto anmeldet. |
| `ssoProvider`, `ssoSubject`, `ssoEmail`, `ssoLastLoginAt` | Text, Text, Email, Zeitstempel [0..1] | Verknüpfung mit dem SSO-Profil. `(ssoProvider, ssoSubject)` ist eindeutig. |
| `twoFactorEnabled` | Boolean | Zweiter Faktor aktiv. |
| `twoFactorSecret` | EncryptedSecretDT [0..1] | Geteiltes Geheimnis mit der Authenticator-App, verschlüsselt gespeichert. |
| `twoFactorConfirmedAt` | Zeitstempel [0..1] | Zeitpunkt der bestätigten Einrichtung. |
| `twoFactorLastUsedStep` | Integer [0..1] | Zeitschritt des zuletzt akzeptierten Einmalcodes; verhindert Wiederverwendung (AF-06). |
| `twoFactorRecoveryCodes` | Text [*] | Hashes der noch unverbrauchten Wiederherstellungscodes. |
| `notificationEmail` | Email [0..1] | Empfängeradresse für Benachrichtigungen; Vorgabe ist `email`. |
| `emailNotificationsEnabled` | Boolean | Anwender möchte Benachrichtigungen erhalten. |
| `calendarProvider` | CalendarProviderDT [0..1] | Verbundener Kalenderdienst. |
| `calendarEmail` | Email [0..1] | Konto beim Kalenderdienst. |
| `calendarRefreshToken` | EncryptedSecretDT [0..1] | Dauerzugriff auf den Kalender, verschlüsselt. |
| `calendarSyncEnabled`, `calendarConnectedAt`, `calendarLastSyncedAt`, `calendarSyncError` | Boolean, Zeitstempel, Zeitstempel, Text | Zustand der Kalenderverbindung; `calendarSyncError` hält die letzte Fehlermeldung. |

### AccessRole

Eine Zugriffsrolle: Sie legt fest, welchen Ausschnitt der Organisation ein Anwender sieht und was er darf. Fünf Rollen sind Systemrollen und werden beim ersten Start angelegt (S3); weitere Rollen legen Administratoren an (UC-21).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `name` | Text | Anzeigename, z. B. „GBL Organisation". |
| `code` | Text | Kurzcode, eindeutig, Großschreibung, z. B. `GBL-OR`, `M-OR-IT`. |
| `kind` | AccessRoleKindDT | Rollenart: Admin, Geschäftsbereichsleitung oder Mitarbeiter. Bei Systemrollen unveränderlich. |
| `description` | Text | Beschreibung. |
| `businessAreas` | Text [*] | Sichtbare Geschäftsbereiche; nur bei Rollenart `GBL` gefüllt, z. B. `OR`. Verglichen mit `Department.businessArea` und `Project.businessArea`. |
| `departmentIds` | Identifier [*] | Sichtbare Abteilungen; nur bei Rollenart `MEMBER` gefüllt. Lose Referenz auf `Department.id` ohne Fremdschlüssel; die Systemrollen verwenden die Kennungen `or-it`, `or-id`, `or-oe`, die das Seed-Skript auch als Abteilungskennungen vergibt. |
| `permissions` | PermissionSetDT | Sechs Berechtigungen. Bei Rollenart `ADMIN` ist „Rollen verwalten" immer gesetzt. |
| `system` | Boolean | Systemrolle: kann nicht gelöscht werden, Rollenart nicht änderbar. |

### Department

Eine Abteilung der Sparkasse. Seit dem Stand vom 13. September eine eigene Entität; vorher nur als Beispieldaten im Browser. Angelegt durch das Seed-Skript oder durch einen Anwender mit „Rollen verwalten" (UC-27).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `code` | Text [0..1] | Kürzel, eindeutig, Großschreibung, z. B. `OR-IT`. |
| `name` | Text | Anzeigename, z. B. „Informationstechnologie". |
| `businessArea` | Text [0..1] | Geschäftsbereich, z. B. `OR`; Grundlage des Sichtbereichs für GBL-Rollen (AF-02). |
| `leadName` | Text | Name der Abteilungsleitung als Text, auch wenn kein Konto existiert. |
| `lead` | → User [0..1] | Konto der Abteilungsleitung, falls vorhanden; wird bei Löschung des Kontos geleert. |
| `memberCount` | Integer | Anzahl der Mitarbeitenden für die Kartenansicht. |
| `description` | Text | Beschreibung. |
| `accent`, `badgeTone` | Text | Darstellungsklassen für Karten und Kennzeichen in der Oberfläche. Ein Darstellungsattribut im Datenmodell, übernommen aus den früheren Beispieldaten. |
| `members` | → DepartmentMember [*] | Mitglieder mit Reihenfolge. |

### DepartmentMember

Ein Mitglied einer Abteilung, als Name geführt. Kein Fremdschlüssel auf `User`; `userId` ist eine lose Referenz, damit auch Personen ohne Konto in der Abteilungsliste stehen können.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `department` | → Department | Mit der Abteilung gelöscht. |
| `name` | Text | Eindeutig je Abteilung. |
| `email` | Email [0..1] | |
| `roleLabel` | Text [0..1] | Funktion in der Abteilung, Freitext. |
| `order` | Integer | Reihenfolge. |
| `userId` | Identifier [0..1] | Lose Referenz auf ein Konto. |

### SsoLoginTicket

Ein Einmalticket, das die SSO-Anmeldung vom Rückweg über den Browser entkoppelt: Der Server stellt es nach erfolgreicher Prüfung beim Identity Provider aus, der Browser tauscht es innerhalb kurzer Zeit gegen ein Zugriffstoken (UC-03, S1).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `tokenHash` | Text | Hash des Ticketcodes, eindeutig. Der Code selbst wird nicht gespeichert. |
| `user` | → User | Anwender, für den das Ticket gilt. |
| `expiresAt` | Zeitstempel | 90 Sekunden nach Ausstellung. |
| `usedAt` | Zeitstempel [0..1] | Gesetzt, sobald das Ticket eingelöst wurde. Ein Ticket ist nur einmal einlösbar. |

---

## D1.2 Projekte und Berichtswesen

### Project

Ein Projekt eines Anwenders in einer Abteilung. Der Eigentümer legt es an; ändern darf jeder mit der Berechtigung „Projekte bearbeiten" im Sichtbereich des Projekts (AF-01, AF-02). Die Attribute ab `businessArea` bilden den Kopf des Statusberichts (B3).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `name` | Text | Pflicht. |
| `key` | Text | Projektschlüssel, eindeutig; wird aus dem Namen erzeugt, wenn keiner angegeben ist (AF-05). |
| `description` | Text [0..1] | |
| `color` | Farbe [0..1] | Kennfarbe in Listen und Kalender. |
| `owner` | → User | Eigentümer (Projektleitung). |
| `department` | → Department [0..1] | Abteilung; bestimmt den Sichtbereich (AF-02). Wird bei Löschung der Abteilung geleert. |
| `projectType` | Text [0..1] | Projektart, in der Oberfläche `Persönlich` oder `Abteilung`. |
| `visibility` | Text [0..1] | Sichtbarkeitsangabe für die Projektkarte, Freitext (Seed: `Abteilung`). |
| `statusLabel` | Text [0..1] | Projektstatus für die Karte, Freitext, z. B. `Konzept`, `In Planung`, `In Arbeit`. |
| `deadline` | Datum [0..1] | Fälligkeit; entspricht `plannedEnd`, wenn nicht gesondert gesetzt. |
| `businessArea` | Text [0..1] | Geschäftsbereich, z. B. `OR`. |
| `projectGoal` | Text [0..1] | Projektziel für den Berichtskopf. |
| `plannedStart`, `plannedEnd` | Datum [0..1] | Geplanter Zeitraum. |
| `deputyLead` | Text [0..1] | Stellvertretende Projektleitung (Name als Text). |
| `projectSponsor` | Text [0..1] | Projektverantwortlicher, in der Regel die GBL (Name als Text). |
| `plannedEffortPt` | PT [0..1] | Planaufwand in Personentagen. |
| `plannedBudget` | EUR [0..1] | Planbudget. |
| `keyInterfaces` | Text [*] | Wesentliche Schnittstellen als Stichworte; die ausführliche Liste steht in `ProjectInterface`. |
| `collaborationQuality` | Text [0..1] | Einschätzung der Zusammenarbeit. |
| `reportCycle` | ReportCycleDT | Berichtszyklus, Vorgabe monatlich. |

### ProjectMilestone

Ein Meilenstein eines Projekts. Die Reihenfolge ist Teil der Berichtsbasis.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `title` | Text | Pflicht. |
| `planDate` | Datum [0..1] | Ursprünglich geplanter Termin. |
| `newDate` | Datum [0..1] | Verschobener Termin, falls abweichend. |
| `status` | MilestoneStatusDT | |
| `progress` | Prozent | Fertigstellungsgrad, Vorgabe 0. |
| `statusNote` | Text [0..1] | |
| `order` | Integer | Position in der Liste. |

### ProjectRisk

Ein Risiko eines Projekts. Tragweite und Eintrittswahrscheinlichkeit ergeben die Position im Risikograph des Statusberichts (B3).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `code` | Text | Kürzel, z. B. `R-1`; wird fortlaufend vergeben, wenn keines angegeben ist. |
| `title` | Text | Pflicht. |
| `description` | Text [0..1] | |
| `measure` | Text [0..1] | Gegenmaßnahme. |
| `impact` | Integer [0..1] | Tragweite. |
| `probability` | Integer [0..1] | Eintrittswahrscheinlichkeit. |
| `riskClass` | RiskClassDT [0..1] | Klassifizierung als Text, z. B. `A` oder `Hoch` ([D2.12](D2-datentypen.md#d212-werte-der-berichtsbasis)). |
| `trend` | RiskTrendDT [0..1] | Entwicklung seit dem letzten Bericht. |
| `active` | Boolean | Nur aktive Risiken erscheinen im Bericht. |

### ProjectInterface

Eine Schnittstelle des Projekts zu einem anderen Projekt, Bereich oder System, aus dem Reiter „Schnittstellen & Freigabe" des Projektdialogs.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `name` | Text | Pflicht. |
| `status` | InterfaceStatusDT | Vorgabe `Offen`. |
| `comment` | Text [0..1] | |
| `order` | Integer | Position. |

### ProjectApproval

Die Freigabezeile eines Projekts: wer den Projektauftrag freigegeben hat. Genau eine je Projekt; ergibt die Unterschriftenzeile des Statusberichts (B3). Nicht zu verwechseln mit `ApprovalRequest` (D1.5), dem Workflow für einzelne Entscheidungen.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `project` | → Project | Eindeutig; mit dem Projekt gelöscht. |
| `projectResponsible` | Text [0..1] | Projektverantwortlicher (Name). |
| `gbl` | Text [0..1] | Geschäftsbereichsleitung (Name). |
| `projectLead` | Text [0..1] | Projektleitung (Name). |
| `approvalDate` | Datum [0..1] | Datum der Freigabe. |

### ProjectBudgetLine

Eine Budgetposition eines Projekts mit Plan- und Ist-Wert.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `category` | Text | Pflicht, z. B. „Externe Dienstleister". |
| `plannedAmount` | EUR | Vorgabe 0. |
| `actualAmount` | EUR | Vorgabe 0. |
| `order` | Integer | Position in der Liste. |

### ProjectStatusReport

Ein Statusbericht zu einem Projekt zu einem Stichtag. Die Berichtsbasis (Meilensteine, Risiken, Budgetpositionen, Schnittstellen) wird nicht kopiert, sondern zum Zeitpunkt der Ausgabe aus dem Projekt gelesen; der Bericht hält die Bewertung des Stichtags.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `project` | → Project | |
| `author` | → User [0..1] | Verfasser; bleibt leer, wenn das Konto später gelöscht wurde. |
| `reportDate` | Datum | Stichtag, Vorgabe Erstellungszeitpunkt. |
| `nextMeetingDate` | Datum [0..1] | Nächster Termin des Lenkungskreises. |
| `reportingPeriod` | Text [0..1] | Berichtszeitraum, z. B. „08/2026". |
| `progress` | Prozent | Projektfortschritt. |
| `goalStatus`, `scheduleStatus`, `resourceStatus`, `budgetStatus` | AmpelDT [0..1] | Ampeln für Zielerreichung, Termine, Ressourcen, Budget. |
| `progressNote`, `goalNote`, `scheduleNote`, `resourceNote`, `budgetNote` | Text [0..1] | Erläuterungen zu den Ampeln. |
| `riskChanges`, `interfaceChanges` | Text [0..1] | Änderungen seit dem letzten Bericht. |
| `collaborationQuality`, `nextSteps` | Text [0..1] | |
| `actualEffortPt` | PT [0..1] | Ist-Aufwand zum Stichtag. |
| `actualBudget` | EUR [0..1] | Ist-Budget zum Stichtag. |
| `versionLabel` | Text [0..1] | Berichtsversion, z. B. „V2". |

---

## D1.3 Aufgaben

### Task

Eine Aufgabe in einem Projekt. Sie ist die zentrale Arbeitseinheit; Board, Kalender und Dashboard sind Sichten auf dieselben Aufgaben. Die Felder des Ticket-Editors, die vorher nur im Browser lagen (Tags, Anhänge, Compliance, verlinkte Personen, Audit-Spur), sind seit dem 13. September eigene Detailentitäten.

![D1 Informationsmodell: Detailentitäten](diagrams-png/d1-detailentitaeten.png)

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `title` | Text | Pflicht. |
| `ticketNumber` | Text [0..1] | Anzeigenummer, z. B. `WR-1`; von der Oberfläche vergeben. |
| `description` | Text [0..1] | |
| `project` | → Project | Pflicht. Mit dem Projekt werden Aufgaben gelöscht. |
| `assignee` | → User [0..1] | Bearbeiter. Änderungen lösen Benachrichtigung und Kalenderabgleich aus (AF-08, AF-09). |
| `parentTask` | → Task [0..1] | Übergeordnete Aufgabe; Unteraufgaben über `childTasks`. Wird bei Löschung der übergeordneten Aufgabe geleert. |
| `status` | TaskStatusDT | Vorgabe `OPEN`. |
| `priority` | PriorityDT | Vorgabe `MEDIUM`. |
| `order` | Integer | Position innerhalb der Statusspalte; im Backlog per Ziehen gesetzt (UC-13). |
| `progress` | Prozent | Fortschritt, Vorgabe 0. |
| `startDate`, `dueDate`, `endDate` | Datum [0..1] | Geplanter Beginn, Frist, Ende. Die Frist wird in den Kalender übertragen. |
| `estimatedHours` | Stunden [0..1] | Geschätzter Aufwand. |
| `checklist`, `note` | Text [0..1] | Freitext aus dem Reiter Beschreibung. |
| `department` | Text [0..1] | Abteilung als Anzeigename. Nur noch Anzeige; der Sichtbereich läuft über `project.department` (AF-02). |
| `markerId` | Identifier [0..1] | Verweis auf einen Farbstreifen (`TaskMarker`) des Anwenders. Lose Referenz ohne Fremdschlüssel. |
| `approvalLevel` | ApprovalLevelDT [0..1] | Erforderliche Freigabestufe. |
| `sourceTaskId` | Identifier [0..1] | Herkunftsaufgabe, wenn die Aufgabe aus einer Boardaufgabe in ein Backlog übernommen wurde; lose Referenz. |
| `favoriteBy` | Text [*] | Kennungen der Anwender, die die Aufgabe als Favorit markiert haben. |
| `favoriteReturnIndexBy` | JSON | Je Anwender die ursprüngliche Position, an die die Aufgabe nach Aufheben des Favoriten zurückkehrt. |

### TaskTag

Ein Schlagwort einer Aufgabe. `(task, label)` ist eindeutig. Grundlage für Farbstreifen mit Merkmal `tag` (AF-10).

### TaskPersonLink

Eine mit der Aufgabe verknüpfte Person, als Name und optional E-Mail. Kein Fremdschlüssel auf `User`. `(task, name)` ist eindeutig.

### TaskAttachment

Ein Anhang der Aufgabe: nur Metadaten, keine Dateiinhalte (NG-01).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `name` | Text | Dateiname. |
| `type` | AttachmentTypeDT | Vorgabe `Datei`. |
| `source` | AttachmentSourceDT | Vorgabe `Upload`. |
| `owner` | Text [0..1] | |
| `url` | URL [0..1] | Adresse im Quellsystem, falls vorhanden. |

### TaskCompliance

Die Angaben aus dem Reiter „Banking Ready". Höchstens eine je Aufgabe.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `classification` | ClassificationDT | Vorgabe `Intern`. |
| `risk` | ComplianceRiskDT | Vorgabe `Niedrig`. |
| `controlId` | Text [0..1] | Kontroll-ID, z. B. `CTRL-…`. |
| `approval` | Text [0..1] | Freigabeprozess, Freitext. |
| `evidence` | Text [0..1] | Evidenzhinweis. |

### TaskAssignmentSource

Wer die Aufgabe gestellt hat, als Name mit Initialen und Farbton für die Anzeige. Höchstens eine je Aufgabe.

### TaskAuditEntry

Ein Eintrag der vom Anwender gepflegten „Audit-Spur" im Ticket-Editor: Freitext mit Reihenfolge. Nicht das systemseitige Audit-Log (D1.5), das automatisch geschrieben wird.

### Comment

Ein Kommentar zu einer Aufgabe. Erwähnungen mit `@Name` lösen eine Benachrichtigung aus (AF-09).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `task` | → Task | |
| `author` | → User | |
| `content` | Text | |
| `createdAt` | Zeitstempel | Kommentare werden nicht bearbeitet oder gelöscht. Kein `updatedAt`. |

### TaskMarker

Ein persönlicher Farbstreifen: Ein Anwender legt Regeln fest, nach denen Aufgaben im Board farbig markiert werden. Beim ersten Zugriff werden fünf Standardstreifen angelegt (Priorität hoch/mittel/niedrig, Review, Blockiert). Höchstens 60 je Anwender.

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `user` | → User | Besitzer; Farbstreifen sind nicht geteilt. |
| `label` | Text | Bis 80 Zeichen. |
| `description` | Text | Bis 180 Zeichen. |
| `color` | Farbe | |
| `matchField` | MatchFieldDT | Woran der Streifen erkannt wird; leer bedeutet manuelle Zuordnung über `Task.markerId`. |
| `matchValue` | Text | Vergleichswert, bis 120 Zeichen. |
| `order` | Integer | Reihenfolge in den Einstellungen. |

### CalendarSyncEvent

Die Verbindung zwischen einer Aufgabe und dem Termin, der dafür im Kalender eines Anwenders angelegt wurde. Existiert nur, solange die Aufgabe dem Anwender zugewiesen ist und eine Frist hat (AF-08).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `task` | → Task | |
| `user` | → User | Besitzer des Kalenders. |
| `provider` | CalendarProviderDT | |
| `externalCalendarId`, `externalEventId` | Text | Kennungen beim Kalenderdienst. `(provider, user, task)` ist eindeutig. |

---

## D1.4 Dokumente

Die Dokumentenbibliothek (DLG-10) zeigt seit dem 13. September Datensätze aus der Datenbank statt fester Beispieldaten. NextTask hält nur Metadaten und Nachweisbezüge; Dateiinhalte, Upload und Versionierung bleiben außerhalb (NG-01). Über die Oberfläche werden Dokumente nur gelesen; angelegt werden sie durch das Seed-Skript.

### Document

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `title` | Text | Pflicht. |
| `type` | DocumentTypeDT | |
| `status` | DocumentStatusDT | |
| `classification` | ClassificationDT | |
| `ownerName` | Text | Verantwortliche Person als Name. |
| `version` | Text [0..1] | |
| `reviewDate` | Datum [0..1] | Nächste Prüfung. |
| `retentionDate` | Datum [0..1] | Ende der Aufbewahrung. |
| `summary` | Text | Beschreibung. |
| `department` | → Department [0..1] | Bestimmt den Sichtbereich (AF-02); bei Löschung geleert. |
| `project` | → Project [0..1] | Zugehöriges Projekt; bei Löschung geleert. |

### DocumentTaskLink

Eine mit dem Dokument verknüpfte Aufgabe, als Titel mit optionaler loser Referenz `taskId`. `(document, taskTitle)` ist eindeutig.

### DocumentControl

Eine Kontroll-ID, die das Dokument als Nachweis belegt. `(document, controlId)` ist eindeutig.

### DocumentAuditEntry

Ein Eintrag des vom Anwender gepflegten Audit-Trails eines Dokuments: Freitext mit Reihenfolge.

### DocumentTemplate

Eine Vorlage in der Bibliothek: eindeutiger Titel, Beschreibung, Typ (Vorgabe `Vorlage`). Ohne Bezug zu Abteilung oder Projekt.

---

## D1.5 Steuerung und Nachweis

### ApprovalRequest

Eine Freigabeanfrage. Sie bezieht sich auf ein Objekt in NextTask oder auf ein freies Anliegen und wird von einer anderen Person entschieden. Zustände und Übergänge in [D2.7](D2-datentypen.md#d27-approvalstatusdt). Sichtbar ist eine Anfrage nur, wenn ihr Bezugsobjekt im Sichtbereich des Anwenders liegt (AF-02, AF-03).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `entityType` | ApprovalEntityTypeDT | Art des Bezugsobjekts. |
| `entityId` | Identifier | Bezugsobjekt; bei freien Anliegen ein generierter Wert. Lose Referenz. |
| `entityLabel` | Text | Anzeigename des Bezugsobjekts zum Zeitpunkt der Anfrage. |
| `title` | Text | Pflicht; Vorgabe „Freigabe: <Bezugsobjekt>". |
| `description` | Text [0..1] | |
| `evidence` | Text [0..1] | Nachweis oder Verweis auf Unterlagen. |
| `requester` | → User | Anfragender. |
| `approver` | → User [0..1] | Genehmiger; wird nach AF-03 bestimmt. Leer, wenn niemand bestimmt werden konnte; dann entscheidet, wer die Berechtigung „Freigaben entscheiden" hat. |
| `status` | ApprovalStatusDT | Vorgabe `PENDING`. |
| `decisionNote` | Text [0..1] | Vermerk zur Entscheidung. |
| `requestedAt`, `decidedAt` | Zeitstempel | `decidedAt` wird mit der Entscheidung gesetzt. |

### AuditLog

Ein Eintrag im Audit-Log. Einträge werden nur angefügt, nie geändert oder gelöscht. Vollständige Liste der protokollierten Aktionen in [N2](N2-querschnittskonzepte.md).

| Attribut | Typ | Bemerkung |
|----------|-----|-----------|
| `action` | Text | Aktionscode, z. B. `APPROVAL_APPROVED`, `TASKS_REORDERED`, `LOGIN_FAILED`. |
| `entityType`, `entityId`, `entityLabel` | Text, Identifier [0..1], Text [0..1] | Betroffenes Objekt. |
| `summary` | Text | Satz in deutscher Sprache, der die Aktion beschreibt. |
| `severity` | SeverityDT | Kritikalität. |
| `before` | JSON [0..1] | Geänderte Felder mit altem und neuem Wert (AF-07). |
| `after` | JSON [0..1] | Zustand nach der Aktion. |
| `metadata` | JSON [0..1] | Zusatzinformationen, z. B. Projekt-ID. |
| `user` | → User [0..1] | Akteur. Wird bei Löschung des Kontos auf leer gesetzt; Name, E-Mail und Rolle bleiben als Text erhalten. |
| `actorName`, `actorEmail`, `actorRole` | Text | Akteur zum Zeitpunkt der Aktion, unabhängig von späteren Änderungen am Konto. |
| `ipAddress`, `userAgent` | Text [0..1] | Herkunft der Anfrage. |
| `createdAt` | Zeitstempel | Kein `updatedAt`. |

---

## D1.6 Organisationsstruktur

Seit dem 13. September ist die Abteilung eine Entität (`Department`), der Geschäftsbereich weiterhin ein Kürzel als Text. Die Struktur wirkt an drei Stellen:

| Stelle | Form | Wirkung |
|--------|------|---------|
| `Department.businessArea`, `Project.businessArea` | Kürzel, Großschreibung, z. B. `OR` | Sichtbereich einer GBL-Rolle: alle Abteilungen und Projekte des Bereichs (AF-02). |
| `AccessRole.departmentIds` | Kennungen von `Department` | Sichtbereich einer Mitarbeiterrolle: genau diese Abteilungen mit ihren Projekten, Aufgaben und Dokumenten. |
| `Project.department`, `Document.department` | Fremdschlüssel | Ordnet Projekt und Dokument der Abteilung zu; Aufgaben erben den Sichtbereich über ihr Projekt. |

Die Textfelder `User.department` und `Task.department` bleiben als Anzeigename bestehen und werden für keine Berechtigungsprüfung mehr verwendet. Das Seed-Skript legt die drei Abteilungen des Geschäftsbereichs OR (`or-it`, `or-id`, `or-oe`) mit denselben Kennungen an, die die Systemrollen in `departmentIds` tragen; eine neue Abteilung braucht daher keine Codeänderung mehr, nur eine Rolle, die auf sie zeigt.

Personen sind an mehreren Stellen als Name statt als Konto geführt: `Department.leadName`, `DepartmentMember.name`, `Project.deputyLead`, `Project.projectSponsor`, `ProjectApproval.*`, `TaskPersonLink.name`, `Document.ownerName`. Das Seed-Skript legt für jeden vorkommenden Namen ein Konto an und verknüpft, wo ein Fremdschlüssel existiert (`Department.lead`, `Project.owner`, `Task.assignee`); die Namensfelder bleiben die Anzeigequelle.

---

## D1.7 Invarianten und Löschregeln

**Eindeutigkeit**

- `User.email`, `AccessRole.code`, `Department.code`, `Project.key`, `SsoLoginTicket.tokenHash`, `DocumentTemplate.title` sind eindeutig.
- `(User.ssoProvider, User.ssoSubject)`: Ein SSO-Profil kann nur mit einem Konto verknüpft sein.
- `(CalendarSyncEvent.provider, user, task)`: je Aufgabe ein Termin je Anwender und Dienst.
- `(DepartmentMember.department, name)`, `(TaskTag.task, label)`, `(TaskPersonLink.task, name)`, `(DocumentTaskLink.document, taskTitle)`, `(DocumentControl.document, controlId)`: keine Doppelungen innerhalb eines Elternobjekts.
- `ProjectApproval.project`, `TaskCompliance.task`, `TaskAssignmentSource.task`: höchstens eine je Elternobjekt.

**Fachliche Regeln**

- Systemrollen (`AccessRole.system = true`) können nicht gelöscht werden; ihre Rollenart ist unveränderlich.
- Der Anfragende einer Freigabe wird nie als ihr Genehmiger eingetragen (AF-03).
- Eine Freigabe in einem Endzustand (`APPROVED`, `REJECTED`, `CANCELLED`) wird nicht mehr geändert.
- Ein Einmalcode des zweiten Faktors wird nur akzeptiert, wenn sein Zeitschritt größer ist als `twoFactorLastUsedStep` (AF-06).
- Ein Wiederherstellungscode wird nach Gebrauch aus `twoFactorRecoveryCodes` entfernt.
- Audit-Einträge werden nie geändert oder gelöscht.
- Eine Aufgabe kann nur in ein Projekt verschoben werden, das im Sichtbereich des Anwenders liegt (AF-02).

**Löschregeln**

| Wird gelöscht | Folge |
|---------------|-------|
| `Department` | Mitglieder werden mit gelöscht; Projekte und Dokumente verlieren die Zuordnung (leer). |
| `Project` | Alle Aufgaben, Meilensteine, Risiken, Schnittstellen, die Freigabezeile, Budgetpositionen und Statusberichte werden mit gelöscht; Dokumente verlieren die Zuordnung. |
| `Task` | Kommentare, Tags, Personen, Anhänge, Compliance, Ersteller, Audit-Spur und Kalenderabgleiche werden mit gelöscht; der Termin im Kalender wird vorher entfernt (AF-08). Unteraufgaben verlieren die Zuordnung. |
| `Document` | Aufgabenverknüpfungen, Kontroll-IDs und Audit-Trail werden mit gelöscht. |
| `User` | Farbstreifen, Kalenderabgleiche, SSO-Tickets und gestellte Freigabeanfragen werden mit gelöscht. Statusberichte, Freigaben als Genehmiger, Abteilungsleitungen und Audit-Einträge bleiben erhalten; der Verweis wird geleert. |
| `AccessRole` (nicht Systemrolle) | Betroffene Benutzer erhalten die Systemrolle Admin (siehe R-04 in P1). |

Über die Oberfläche lassen sich nur selbst angelegte Rollen löschen (UC-21). Das Löschen von Aufgaben ist in der Schnittstelle vorgesehen (UC-16), in der Oberfläche aber nicht angebunden. Für Projekte, Abteilungen, Dokumente und Benutzer gibt es keine Löschfunktion; die Regeln für sie gelten bei administrativen Eingriffen in der Datenbank.

---

## D1.8 Querverweise

| Baustein | Bezug zu D1 |
|----------|-------------|
| [D2](D2-datentypen.md) | Definition aller `…DT`-Typen und der Zustandsübergänge von `Task.status` und `ApprovalRequest.status`. |
| [F2](F2-anwendungsfaelle.md) | Jeder Anwendungsfall benennt, welche Entitäten er anlegt oder ändert. |
| [F3](F3-anwendungsfunktionen.md) | AF-02 (Sichtbereich über Abteilung und Geschäftsbereich), AF-03 (Genehmiger), AF-05 (Projektschlüssel), AF-06 (zweiter Faktor), AF-07 (Audit-Differenz), AF-08 (Kalender). |
| [B3](B3-druckausgaben.md) | Der Statusbericht liest `Project`, die Berichtsbasis und `ProjectApproval`; der Abteilungsbericht liest `Department`, `Project` und `Task`. |
| [S3](S3-inbetriebnahme.md) | Das Seed-Skript befüllt Abteilungen, Projekte, Aufgaben, Dokumente und Demo-Konten. |
| [N2](N2-querschnittskonzepte.md) | Berechtigungskonzept auf Basis von `AccessRole` und `Department`; Audit-Logging auf Basis von `AuditLog`. |
