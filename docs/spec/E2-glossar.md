# E2 — Glossar

Fachbegriffe, wie sie in dieser Spezifikation und in der Oberfläche von NextTask verwendet werden. Alphabetisch. Verweise führen zu anderen Einträgen oder zum Baustein, in dem der Begriff festgelegt ist.

---

### Abteilung

Organisationseinheit unterhalb eines Geschäftsbereichs. Im Anwendungsszenario die drei Abteilungen OR-IT (Informationstechnologie), OR-ID (Interne Dienste) und OR-OE (Organisationsentwicklung). Keine Entität; als Text an Benutzer, Aufgabe und Zugriffsrolle ([D1.5](D1-datenmodell.md#d15-organisationsstruktur)).

### Ampel

Dreistufige Bewertung im Statusbericht: Gruen (Positiv), Gelb (Beobachten), Rot (Kritisch), je für Zielerreichung, Termine, Ressourcen und Budget ([D2.11](D2-datentypen.md#d211-ampeldt)).

### Anwendungsfall (UC)

Interaktion zwischen Anwender und NextTask mit einem für den Anwender sinnvollen Ziel; beschrieben in [F2](F2-anwendungsfaelle.md).

### Anwendungsfunktion (AF)

Fachliche Regel oder Algorithmus, der in mehreren Anwendungsfällen gebraucht wird; beschrieben in [F3](F3-anwendungsfunktionen.md).

### Audit-Log

Fortlaufendes, unveränderliches Protokoll aller ändernden Aktionen und Anmeldeversuche mit Akteur, Zeitpunkt, Herkunft und Vorher-Nachher-Werten ([QK-03](N2-querschnittskonzepte.md#qk-03-audit-logging)). Lesbar für Administratoren.

### Authenticator-App

App auf dem Smartphone des Anwenders, die aus einem geteilten Geheimnis Einmalcodes nach TOTP erzeugt. Zweiter Faktor für lokale Konten.

### Backlog

Liste der Aufgaben eines Projekts in der Maske Projekte ([DLG-04](B1-dialogspezifikation.md#dlg-04--projekte-und-backlog)), sortierbar per Ziehen.

### Bearbeiter (assignee)

Anwender, dem eine Aufgabe zugewiesen ist. Erhält Benachrichtigung und Kalendertermin.

### Berichtsbasis

Die Daten eines Projekts, aus denen der Statusbericht entsteht: Berichtskopf, Meilensteine, Risiken, Budgetpositionen, Schnittstellen ([D1.2](D1-datenmodell.md#d12-projekte-und-berichtswesen)).

### Board

Kanban-Ansicht der Aufgaben mit den Spalten Heute, In Arbeit, Review, Blockiert, Erledigt ([DLG-05](B1-dialogspezifikation.md#dlg-05--meine-aufgaben)).

### Challenge-Token

Kurzlebiges Token (fünf Minuten), das nach erfolgreicher Passwortprüfung ausgestellt wird und den zweiten Anmeldeschritt mit dem ersten verbindet ([UC-02](F2-anwendungsfaelle.md#uc-02--anmelden-mit-passwort)).

### Dialog (DLG)

Maske der Oberfläche; beschrieben in [B1](B1-dialogspezifikation.md).

### Eigentümer (owner)

Anwender, der ein Projekt angelegt hat. Entspricht der Projektleitung; einzige Person, die Berichtsbasis und Statusberichte des Projekts pflegt.

### Einmalticket

Kurzlebiger Code (90 Sekunden, einmal einlösbar), mit dem der Browser nach der SSO-Rückleitung das Zugriffstoken abholt ([D1.1](D1-datenmodell.md#d11-organisation-und-zugang), `SsoLoginTicket`).

### Evidenz, Nachweis

Freitext an einer Freigabeanfrage, der auf Unterlagen oder Protokolle verweist, die die Entscheidung stützen. NextTask speichert die Unterlagen nicht.

### Farbstreifen (TaskMarker)

Persönliche Regel eines Anwenders, nach der Karten im Board farbig markiert werden, z. B. alle Aufgaben mit Priorität hoch in Rot ([AF-10](F3-anwendungsfunktionen.md#af-10--farbstreifen-zuordnen)).

### Freigabe (ApprovalRequest)

Anfrage an eine zweite Person, ein Vorhaben zu genehmigen. Zustände Offen, Genehmigt, Abgelehnt, Abgebrochen ([D2.7](D2-datentypen.md#d27-approvalstatusdt)); Ablauf in [GP-03](F1-geschaeftsprozesse.md#f13-gp-03-freigabe-nach-dem-vier-augen-prinzip).

### Freigabestufe

Angabe an einer Aufgabe, wer sie freigeben soll: keine, Abteilungsleiter, GBL ([D2.9](D2-datentypen.md#d29-approvalleveldt)). Löst beim Setzen eine Freigabeanfrage aus.

### Frist (dueDate)

Fälligkeitsdatum einer Aufgabe. Wird im Kalender angezeigt und als Termin in den Google-Kalender des Bearbeiters übertragen.

### GBL — Geschäftsbereichsleitung

Leitung eines Geschäftsbereichs. Rollenart `GBL`: sieht alle Abteilungen des Bereichs, entscheidet Freigaben, sieht Reports. In der Oberfläche als „Geschäftsbereichsleiter" beschriftet.

### Genehmiger (approver)

Anwender, der eine Freigabeanfrage entscheiden soll; bestimmt nach [AF-03](F3-anwendungsfunktionen.md#af-03--genehmiger-bestimmen).

### Geschäftsbereich

Oberste Organisationseinheit, im Szenario OR (Organisation). Kürzel an Zugriffsrollen der Art GBL und an Projekten.

### Geschäftsprozess (GP)

Fachlicher Ablauf, unabhängig vom IT-System; beschrieben in [F1](F1-geschaeftsprozesse.md).

### Grobe Rolle (UserRoleDT)

Sechsstufige Rolle am Benutzer (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, …), abgeleitet aus der Rollenart der Zugriffsrolle; steuert die Sichtbarkeit von Aufgaben ([D2.4](D2-datentypen.md#d24-userroledt)).

### Identity Provider

System der Sparkasse, das Anwender authentifiziert und NextTask die Identität per OpenID Connect bestätigt (NB-02).

### Kritikalität (SeverityDT)

Einstufung eines Audit-Eintrags: Info, Hinweis, Prüfpflichtig, Kritisch ([D2.10](D2-datentypen.md#d210-severitydt)).

### Local Storage

Speicher des Browsers, in dem NextTask Sitzung, Einstellungen und derzeit auch Teile der Fachdaten hält ([QK-08](N2-querschnittskonzepte.md#qk-08-daten-im-browser)).

### Meilenstein

Terminierter Zwischenstand eines Projekts mit Plan- und neuem Termin, Status und Fortschritt; Teil der Berichtsbasis.

### Mitarbeiter (MEMBER)

Rollenart für Anwender, die eine oder mehrere Abteilungen sehen und dort Aufgaben bearbeiten.

### Nachbarsystem (NB)

System außerhalb von NextTask, mit dem Daten ausgetauscht werden; Inventar in [P2](P2-architekturueberblick.md), Verträge in [S1](S1-nachbarsysteme.md).

### OpenID Connect (OIDC)

Standard für die Anmeldung über einen Identity Provider; Grundlage der SSO-Anbindung.

### PKCE

Proof Key for Code Exchange, Erweiterung des OAuth-Code-Flows, die den Autorisierungscode an den Aufrufer bindet. Von NextTask bei SSO verwendet.

### PT — Personentag

Einheit für Plan- und Ist-Aufwand auf Projektebene. Auf Aufgabenebene wird in Stunden geschätzt; acht Stunden entsprechen einem Tag.

### Risikograph

Rasterdarstellung der Projektrisiken nach Tragweite und Eintrittswahrscheinlichkeit mit den Klassen A, B, C im Statusbericht ([B3](B3-druckausgaben.md)).

### Rollenart (AccessRoleKindDT)

Art einer Zugriffsrolle: Admin, GBL, Mitarbeiter ([D2.5](D2-datentypen.md#d25-accessrolekinddt)).

### Sichtbereich

Ausschnitt der Organisation, den ein Anwender sieht: bei GBL Geschäftsbereiche, bei Mitarbeitern Abteilungen, bei Admin alles. Für Aufgaben umgesetzt in [AF-02](F3-anwendungsfunktionen.md#af-02--sichtbare-aufgaben-bestimmen).

### SSO — Single Sign-on

Anmeldung bei NextTask über das bestehende Anmeldesystem der Sparkasse ohne eigenes Passwort ([UC-03](F2-anwendungsfaelle.md#uc-03--anmelden-per-sso)).

### Statusbericht

Bewertung eines Projekts zum Stichtag mit Ampeln, Fortschritt, Erläuterungen und Ist-Werten ([D1.2](D1-datenmodell.md#d12-projekte-und-berichtswesen)); als PDF die Druckausgabe [DR-01](B3-druckausgaben.md#dr-01--projektstatusbericht).

### Systemrolle

Eine der fünf Zugriffsrollen, die beim ersten Start angelegt werden (Admin, GBL Organisation, Mitarbeiter OR-IT, OR-ID, OR-OE). Nicht löschbar.

### TOTP

Time-based One-time Password nach RFC 6238: sechsstelliger Code, der sich alle 30 Sekunden aus einem geteilten Geheimnis ableitet. Zweiter Faktor in NextTask.

### Vier-Augen-Prinzip

Grundsatz, dass eine Entscheidung von einer zweiten Person bestätigt wird. In NextTask umgesetzt über Freigabeanfragen, bei denen der Anfragende nie Genehmiger ist.

### Wiederherstellungscode

Einer von zehn Codes, die bei der Einrichtung des zweiten Faktors einmalig angezeigt werden. Ersetzt je einmal einen Einmalcode, wenn die Authenticator-App nicht verfügbar ist.

### Zugriffsrolle (AccessRole)

Rolle mit Rollenart, Sichtbereich und sechs Berechtigungen, die einem Benutzer zugeordnet wird ([D1.1](D1-datenmodell.md#d11-organisation-und-zugang)).

### Zugriffstoken

Signiertes Token (JWT), das der Browser bei jeder Anfrage mitsendet; sieben Tage gültig ([QK-01](N2-querschnittskonzepte.md#qk-01-authentifizierung-und-sitzung)).

### Zweiter Faktor

Zusätzlicher Nachweis bei der Anmeldung neben dem Passwort; in NextTask der TOTP-Code der Authenticator-App oder ein Wiederherstellungscode.
