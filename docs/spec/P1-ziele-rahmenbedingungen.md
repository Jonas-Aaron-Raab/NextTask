# P1 — Ziele und Rahmenbedingungen

Grundlagenbaustein nach Siedersleben (Kapitel 4.1). Beantwortet: Warum wird NextTask gebaut, für wen, und welche Rahmenbedingungen schränken den Lösungsraum ein.

---

## P1.1 Auftrag

NextTask ist eine webbasierte Projekt- und Aufgabensteuerung für den Geschäftsbereich Organisation (OR) einer Sparkasse. Der Geschäftsbereich besteht aus den Abteilungen Informationstechnologie (OR-IT), Interne Dienste (OR-ID) und Organisationsentwicklung (OR-OE). Mitarbeitende planen darin die Aufgaben ihrer Projekte, verschieben sie über ein Kanban-Board, terminieren sie im Kalender und holen für kritische Schritte eine Freigabe ein. Projektleitungen führen je Projekt eine Berichtsbasis aus Meilensteinen, Risiken und Budget und erzeugen daraus einen Statusbericht im Format der Sparkasse. Die Geschäftsbereichsleitung (GBL) entscheidet Freigaben und sieht alle Abteilungen ihres Bereichs. Administratoren pflegen Rollen und Benutzer. Sicherheits- und steuerungsrelevante Aktionen werden in einem Audit-Log protokolliert.

NextTask entsteht als Studienprojekt im Modul WK_1106 (Wirtschaftsinformatik-Projekt I) an der THM. Der Bedarf stammt aus der Praxis: Der Projektleiter des Teams arbeitet bei einer Sparkasse und kennt die Anforderungen an ein internes Steuerungswerkzeug aus dem Arbeitsalltag. Einen formalen Auftrag oder schriftlich vorgegebene Anforderungen der Sparkasse gab es zu Beginn nicht; das Team hat die Anforderungen aus dieser Praxiserfahrung abgeleitet und im Projektverlauf konkretisiert. Die fachlichen Regeln (Rollenmodell entlang der Organisationsstruktur, Vier-Augen-Prinzip bei Freigaben, Statusbericht mit Ampeln, Revisionssicherheit) entsprechen dem, was in einer Bank von einem solchen Werkzeug erwartet wird. Die hinterlegten Abteilungen, Personen und Projekte sind Beispieldaten für Entwicklung und Vorführung.

---

## P1.2 Ziele

| ID | Ziel |
|----|------|
| G-01 | Projekte und Aufgaben des Geschäftsbereichs an einer Stelle planen und den Bearbeitungsstand jederzeit sichtbar halten (Board, Kalender, Dashboard). |
| G-02 | Sichtbarkeit und Berechtigungen entlang der Organisationsstruktur abbilden: Mitarbeitende sehen ihre Abteilung, die GBL ihren Geschäftsbereich, Administratoren alles. |
| G-03 | Entscheidungen mit Vier-Augen-Prinzip: Freigaben werden angefragt, von einer anderen Person entschieden und mit Begründung festgehalten. |
| G-04 | Projektstatus ohne Nacharbeit in einem bankinternen Berichtsformat ausgeben: Statusbericht mit Ampeln, Meilensteinen, Risiken und Budget als PDF. |
| G-05 | Alle sicherheits- und steuerungsrelevanten Aktionen mit Akteur, Zeitpunkt und Vorher-Nachher-Werten protokollieren, damit sie für eine Prüfung nachvollziehbar sind. |
| G-06 | Anmeldung an bankübliche Anforderungen anpassen: zweiter Faktor für lokale Konten, Anbindung an das bestehende SSO der Sparkasse. |

---

## P1.3 Stakeholder und Benutzer

| Rolle | Beschreibung | Interaktion mit NextTask |
|-------|--------------|--------------------------|
| **Mitarbeiter** | Angehöriger einer Abteilung. Rollenart `MEMBER` in [D2.5](D2-datentypen.md#d25-accessrolekinddt). | Bearbeitet Aufgaben, kommentiert, terminiert, fragt Freigaben an. Sieht die Inhalte seiner Abteilung. |
| **Projektleitung** | Eigentümer eines Projekts (`Project.owner`). Keine eigene Rollenart; ergibt sich aus dem Anlegen des Projekts. | Pflegt Berichtsbasis und Statusberichte des Projekts. Ist Standard-Genehmiger für Freigaben zu Aufgaben und Berichten seines Projekts. |
| **Geschäftsbereichsleitung (GBL)** | Leitet einen Geschäftsbereich mit mehreren Abteilungen. Rollenart `GBL`. | Sieht alle Abteilungen des Bereichs, entscheidet Freigaben, sieht Reports. |
| **Administrator** | Betreut das System fachlich. Rollenart `ADMIN`. | Legt Rollen und Benutzer an, ordnet Rollen zu, liest das Audit-Log. |
| **Interne Revision** | Prüft, ob Entscheidungen und Änderungen nachvollziehbar sind. | Liest das Audit-Log. Hat im System keine eigene Rolle; der Zugriff setzt die Berechtigung „Rollen verwalten" voraus, also faktisch die Administratorrolle. |
| **Sparkassen-IT (Betrieb)** | Stellt die Infrastruktur, in die NextTask eingebettet wird. | Liefert Identity Provider für SSO, SMTP-Relay und Datenbank; registriert die Redirect-URL von NextTask beim Identity Provider (S1). |
| **Projektteam** | Sechs Studierende: Projektleitung, Entwicklung, Architektur, Spezifikation, Test, DevOps (siehe [`TEAMINFO.md`](../../TEAMINFO.md)). | Entwickelt und dokumentiert das System. |
| **Dozent** | Betreut und bewertet das Projekt. | Prüft Spezifikation, Architektur und Umsetzung. |

---

## P1.4 Abgrenzung

### Im Umfang

- Registrierung und Anmeldung mit E-Mail und Passwort, optional mit zweitem Faktor (TOTP); Anmeldung über das SSO der Sparkasse (OpenID Connect).
- Rollen- und Berechtigungsmodell mit Systemrollen und frei definierbaren Rollen; Zuordnung von Benutzern zu Rollen und Abteilungen.
- Projekte mit Berichtsbasis (Meilensteine, Risiken, Budgetpositionen, Schnittstellen) und Statusberichten.
- Aufgaben mit Status, Priorität, Fristen, Aufwand, Bearbeiter, Kommentaren und persönlichen Farbstreifen; Kanban-Board, Kalender und Dashboard als Sichten darauf.
- Freigabeanfragen zu Aufgaben, Projekten, Statusberichten, Dokumenten oder freien Anliegen mit Genehmigung, Ablehnung und Abbruch.
- Audit-Log mit Filter und Suche.
- Statusbericht als PDF.
- Benachrichtigungen per E-Mail bei Zuweisung und Erwähnung; Übertragung von Fristen in einen Google-Kalender.

### Nicht im Umfang

| ID | Nicht-Ziel | Begründung |
|----|------------|------------|
| NG-01 | Dokumentenverwaltung mit Ablage, Upload und Versionierung | Die Dokumentenbibliothek zeigt Metadaten und Nachweisbezüge aus der Datenbank, aber keine Dateiinhalte; Anhänge an Aufgaben werden nur als Name, Typ und Quelle gespeichert. Ein Dokumentenmanagement ist ein eigenes System. |
| NG-02 | Zeiterfassung von Ist-Stunden je Person | NextTask führt nur den geschätzten Aufwand je Aufgabe und Plan-/Ist-Aufwand in Personentagen auf Projektebene. |
| NG-03 | Mehrsprachigkeit | Die Oberfläche ist einsprachig Deutsch (CON-06). |
| NG-04 | Native App für Smartphones | Die Weboberfläche ist für den Arbeitsplatz-Browser gebaut. |
| NG-05 | Anbindung an Kernbanksysteme oder Kundendaten | NextTask steuert interne Projekte. Es verarbeitet keine Kundendaten und keine Kontodaten (CON-05). |
| NG-06 | Bidirektionale Kalendersynchronisation | Fristen werden nur nach Google Calendar übertragen. Änderungen im Kalender fließen nicht zurück. |
| NG-07 | Passwort zurücksetzen per E-Mail | Nicht umgesetzt. Administratoren legen Benutzer mit Startpasswort an; Anwender ändern es in den Einstellungen. |
| NG-08 | Gastmodus | Im Code vorbereitet (`guestUser.js`), aber von keinem Anmeldeweg vergeben. Nicht Teil dieser Spezifikation. Das Demo-Konto „Gast" des Seed-Skripts ist davon unabhängig ein gewöhnliches Konto mit Passwort und der Rolle Admin (R-07). |

---

## P1.5 Rahmenbedingungen

Gegliedert nach Abschnitt 3 der Volere-Schablone (Mandated Constraints). Die Rahmenbedingungen sind gesetzt und stehen nicht zur Diskussion; Technologieentscheidungen innerhalb dieses Rahmens werden in [`docs/arch/`](../arch/) als ADRs begründet.

| ID | Rahmenbedingung | Herkunft |
|----|-----------------|----------|
| CON-01 | **Webanwendung im Browser.** Bedienung über einen aktuellen Desktop-Browser am Arbeitsplatz; keine Installation auf dem Client. | Projektidee |
| CON-02 | **Mehrbenutzersystem mit festem Organisationsmodell.** Die Hierarchie Geschäftsbereich → Abteilung → Mitarbeiter ist vorgegeben. Rollen werden darauf abgebildet, nicht umgekehrt. | Anwendungsszenario Sparkasse |
| CON-03 | **Anbindung an bestehendes SSO per OpenID Connect.** Das Passwort der Sparkasse wird nie an NextTask übertragen oder dort gespeichert. NextTask verwaltet Rollen weiterhin selbst; der Identity Provider bestätigt nur die Identität. | [`docs/SSO.md`](../SSO.md) |
| CON-04 | **Technologiestack aus der Teamvereinbarung:** JavaScript, React, Express, PostgreSQL mit Prisma. Die Begründung der Wahl steht in den ADRs. | [`TEAMINFO.md`](../../TEAMINFO.md) |
| CON-05 | **Keine Kundendaten, keine produktive Sparkassen-Infrastruktur.** Entwicklung und Betrieb in einer Studienumgebung. SSO, E-Mail-Versand und Kalenderanbindung sind per Konfiguration abschaltbar und im Standard aus. | Studienprojekt |
| CON-06 | **Sprache der Oberfläche ist Deutsch**, einschließlich Fehlermeldungen und E-Mails. | Anwendungsszenario |
| CON-07 | **Studienprojekt mit sechs Personen** im Sommersemester 2026, versioniert in einem Git-Repository mit Conventional Commits. Abgabe umfasst Spezifikation, Architektur und Code. | Vorlesung WK_1106 |

---

## P1.6 Erfolgskriterien

| ID | Kriterium |
|----|-----------|
| SC-01 | Ein Anwender sieht nur Abteilungen, Projekte, Aufgaben, Dokumente und Freigaben aus seinem Sichtbereich: bei Rollenart Mitarbeiter die zugeordneten Abteilungen, bei GBL alle Abteilungen der zugeordneten Geschäftsbereiche, bei Admin alles. Der Server setzt das bei jedem Lese- und Schreibzugriff durch (AF-02). |
| SC-02 | Jede Freigabeanfrage durchläuft genau einen Weg von `PENDING` nach `APPROVED`, `REJECTED` oder `CANCELLED`. Der Anfragende wird nie als Genehmiger eingetragen. Zu jeder Entscheidung sind Entscheider, Zeitpunkt und Vermerk gespeichert. |
| SC-03 | Jede in [N2](N2-querschnittskonzepte.md) aufgeführte Aktion erzeugt einen Audit-Eintrag mit Akteur, Zeitpunkt, IP-Adresse und, bei Änderungen, den geänderten Feldern mit altem und neuem Wert. Passwörter und Tokens erscheinen nie im Audit-Log. |
| SC-04 | Bei aktiviertem zweiten Faktor gelingt die Anmeldung nur mit gültigem Einmalcode oder einem unverbrauchten Wiederherstellungscode. Ein Einmalcode kann nicht zweimal verwendet werden. |
| SC-05 | Aus den Projektdaten entsteht auf Knopfdruck ein dreiseitiger Statusbericht als PDF mit Ampeln, Meilensteinen, Risikotabelle, Risikograph und Budget, ohne manuelle Nachbearbeitung. |
| SC-06 | Beim ersten Start legt das System die fünf Standardrollen (Admin, GBL Organisation, Mitarbeiter OR-IT, OR-ID, OR-OE) selbst an. Neue Benutzer erhalten automatisch eine Rolle. |

---

## P1.7 Annahmen

| ID | Annahme |
|----|---------|
| AS-01 | Jeder Anwender hat eine eindeutige E-Mail-Adresse. Sie ist der Anmeldename und der Schlüssel für die Verknüpfung mit dem SSO-Profil. |
| AS-02 | Für die SSO-Anbindung stellt die Sparkassen-IT Discovery-URL, Client-ID, Client-Secret und die erlaubten E-Mail-Domänen bereit (S1). |
| AS-03 | Anwender mit lokalem Konto haben ein Smartphone mit einer Authenticator-App, die TOTP nach RFC 6238 unterstützt. |
| AS-04 | Für E-Mail-Benachrichtigungen steht ein SMTP-Relay zur Verfügung. Ohne Relay laufen alle Funktionen, nur ohne Versand. |
| AS-05 | Für die Kalenderanbindung besitzt der Anwender ein Google-Konto und stimmt dem Zugriff auf seinen Kalender zu. |
| AS-06 | Die Zahl gleichzeitiger Anwender liegt im Bereich eines Geschäftsbereichs (unter hundert). Lastanforderungen darüber hinaus werden nicht gestellt (N1). |

---

## P1.8 Risiken

| ID | Risiko | Umgang |
|----|--------|--------|
| R-01 | **Anlegen ohne Rückmeldung bei Fehlern.** Beim Anlegen von Aufgaben, Projekten und Abteilungen in Board, Kalender und Projektmaske zeigt die Oberfläche keine Fehlermeldung, wenn der Server ablehnt oder nicht erreichbar ist; die Eingabe geht dann stillschweigend verloren. | In [B1.5](B1-dialogspezifikation.md#b15-stand-der-anbindung) je Maske benannt. Seit dem Stand vom 23. September laufen alle Fachdaten über den Server; die Meldung im Fehlerfall ist offene Entwicklungsarbeit. |
| R-02 | **Sitzung nach Abmelden weiter gültig.** Das Zugriffstoken läuft nach sieben Tagen ab und wird beim Abmelden nur im Browser gelöscht, nicht serverseitig widerrufen. | Als Einschränkung in [N2](N2-querschnittskonzepte.md) dokumentiert. Bei Verdacht auf Missbrauch bleibt nur der Wechsel des Serverschlüssels, der alle Sitzungen beendet. |
| R-03 | **Verlust des zweiten Faktors.** Es gibt keine Funktion, mit der ein Administrator den zweiten Faktor eines Benutzers zurücksetzt. | Bei der Einrichtung werden zehn Wiederherstellungscodes ausgegeben, die der Anwender sicher verwahren muss (UC-04). Ohne Codes ist ein Eingriff in der Datenbank nötig. |
| R-04 | **Löschen einer Rolle hebt Benutzer auf Administrator.** Wird eine selbst angelegte Rolle gelöscht, erhalten ihre Benutzer die Systemrolle Admin als Ersatz. | Das Löschen ist nur mit der Berechtigung „Rollen verwalten" möglich und wird mit Kritikalität `CRITICAL` protokolliert. Fachlich richtiger wäre die Ersatzrolle Mitarbeiter; dies ist eine offene Änderung am Code. |
| R-05 | **Ausfall von Nachbarsystemen.** Fällt Google Calendar oder der SMTP-Server aus, wird die auslösende Aktion trotzdem gespeichert; nur die Übertragung unterbleibt und wird im Serverprotokoll vermerkt. Ein Nachlauf findet nicht statt (kein Batch, siehe README). | Bewusste Entscheidung: Die Kernfunktion darf nicht von optionalen Anbindungen abhängen. Kalender kann manuell erneut synchronisiert werden (UC-25). |
| R-07 | **Beispieldaten und Seed-Skript.** Die Abteilungen, Projekte, Aufgaben und Dokumente der Datenbank stammen aus dem Seed-Skript, das die früheren Beispieldaten der Oberfläche einliest. Es legt 15 Demo-Konten mit dem bekannten Passwort aus S3 an, darunter „Gast" (`gast@nexttask.local`) mit der Rolle Admin und damit allen Berechtigungen; diese Konten dürfen in keiner Umgebung außerhalb von Entwicklung und Test existieren. | Das Seed-Skript ist ein Werkzeug der Inbetriebnahme, kein Teil des Betriebs; in S3 als Entwicklungsschritt gekennzeichnet. |
| R-06 | **Freie Statuswerte in der Berichtsbasis.** Meilensteinstatus, Risikoklasse und Ampelwerte werden als Text gespeichert; der Server prüft die Werte nicht gegen die in D2 definierten Listen. | Die gültigen Werte sind in [D2](D2-datentypen.md) festgelegt und werden von der Oberfläche als Auswahllisten vorgegeben. |
