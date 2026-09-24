# P2 — Architekturüberblick

Überblick auf Anwendungsebene nach Siedersleben (Kapitel 4.2): Wie bettet sich NextTask in seine Umgebung ein, und mit welchen Nachbarsystemen tauscht es Daten aus. Ziel dieses Bausteins ist die **vollständige Aufzählung der Nachbarsysteme** und der Richtung des Datenflusses.

Die innere Struktur (Komponenten, Schichten, Laufzeitsichten, Verteilung) gehört nicht hierher. Sie steht in der Architekturdokumentation unter [`docs/arch/`](../arch/).

---

## P2.1 Systemkontext

![Systemkontext NextTask](diagrams-png/p2-systemkontext.png)

NextTask hat einen Eingangskanal, den Browser des Anwenders, und vier Verbindungen nach außen. Die SSO-Anbindung ist bidirektional: NextTask leitet den Browser zum Identity Provider um, erhält einen Autorisierungscode zurück und tauscht ihn direkt beim Identity Provider gegen die Identitätsdaten. Kalender und Mailserver werden nur ausgehend angesprochen. Die Authenticator-App des Anwenders ist ein Sonderfall: Zur Laufzeit findet kein Datenaustausch statt; App und NextTask teilen ein Geheimnis, das einmalig bei der Einrichtung per QR-Code übertragen wird, und berechnen daraus unabhängig voneinander denselben Einmalcode.

Die Datenbank ist Teil von NextTask und kein Nachbarsystem. Sie ist im Diagramm eingezeichnet, weil sie der einzige Ort ist, an dem der Server Daten dauerhaft hält.

---

## P2.2 Nachbarsysteme

Vollständige Liste der Systeme, mit denen NextTask kommuniziert. Die Schnittstellenverträge (Ablauf, Daten, Fehlerverhalten) stehen in [S1](S1-nachbarsysteme.md); diese Tabelle ist das Inventar.

| ID | System | Rolle | Richtung | Kopplung | Häufigkeit | Betreiber |
|----|--------|-------|----------|----------|------------|-----------|
| NB-01 | **Browser des Anwenders** | Einziger menschlicher Zugang; zeigt die Masken (B1) an und sendet Aktionen als HTTPS-Anfragen. | eingehend | eng, synchron | bei jeder Bedienung | Anwender |
| NB-02 | **Identity Provider der Sparkasse** (OpenID Connect) | Bestätigt die Identität eines Anwenders beim SSO-Login. NextTask liest Name, E-Mail und optional Gruppen aus dem ID-Token. | bidirektional (Umleitung des Browsers hin, Code-Austausch und Schlüsselabruf von NextTask aus) | eng während der Anmeldung; danach keine Abhängigkeit | je SSO-Anmeldung | Sparkassen-IT |
| NB-03 | **Authenticator-App** des Anwenders (TOTP) | Erzeugt den zweiten Faktor für lokale Konten. | kein Laufzeitaustausch; gemeinsames Geheimnis bei Einrichtung | lose | je Anmeldung mit zweitem Faktor | Anwender |
| NB-04 | **Google Calendar API** | Erhält Fristen zugewiesener Aufgaben als ganztägige Termine im Kalender des Anwenders. | ausgehend (Termine anlegen, aktualisieren, löschen; OAuth-Zustimmung des Anwenders) | lose: Ausfall beeinträchtigt die Aufgabe nicht | je Änderung an Frist oder Bearbeiter, je manueller Synchronisation | Google (Dritter) |
| NB-05 | **SMTP-Mailserver** | Versendet Benachrichtigungen bei Zuweisung einer Aufgabe, bei Erwähnung in einem Kommentar und als Testmail. | ausgehend | lose: Ausfall beeinträchtigt die Aktion nicht | je Zuweisung oder Erwähnung | Sparkassen-IT oder Provider |

**Anmerkungen**

- **Keine Altsysteme.** NextTask ist eine Neuentwicklung; S2 ist nicht anwendbar (README).
- **Alle Anbindungen außer NB-01 sind optional.** Ohne konfigurierten Identity Provider fehlt der SSO-Knopf auf der Anmeldemaske; ohne SMTP-Zugang werden keine Mails versendet; ohne Google-Zugangsdaten ist die Kalenderverbindung in den Einstellungen deaktiviert. Der Kern (Projekte, Aufgaben, Freigaben, Rollen, Audit-Log) funktioniert unabhängig davon (CON-05).
- **Kein System ruft NextTask von sich aus auf.** Die Rückleitungen von NB-02 und NB-04 nach einer Zustimmung laufen über den Browser des Anwenders, nicht über eine Server-zu-Server-Verbindung in Richtung NextTask.

---

## P2.3 Grobstruktur

NextTask besteht aus drei Teilen, die getrennt gestartet werden:

| Teil | Aufgabe | Zustand |
|------|---------|---------|
| **Browser-Anwendung** | Zeigt die Masken, hält Filter- und Anzeigeeinstellungen, ruft die Schnittstelle des Servers auf. Läuft vollständig im Browser des Anwenders. | zustandsbehaftet je Browser (Token, Darstellung, lokale Projektdaten, siehe R-01) |
| **Anwendungsserver** | Prüft Berechtigungen, setzt die fachlichen Regeln aus F3 durch, schreibt das Audit-Log und spricht die Nachbarsysteme an. Stellt eine Schnittstelle unter `/api` bereit. | zustandslos; jede Anfrage trägt das Zugriffstoken |
| **Datenbank** | Hält alle Entitäten aus D1. | dauerhaft |

Die Schnittstelle des Servers ist in Bereiche gegliedert, die den Bausteinen dieser Spezifikation entsprechen:

| Bereich | Fachlicher Inhalt | Bausteine |
|---------|-------------------|-----------|
| `auth` | Registrierung, Anmeldung mit Passwort und zweitem Faktor, SSO, Profil, Passwort, Benachrichtigungseinstellungen | UC-01 bis UC-06 |
| `projects` | Projekte, Berichtsbasis, Statusberichte | UC-07 bis UC-09 |
| `tasks`, `calendar` | Aufgaben, Kommentare, Verschieben, Terminieren, gefilterte Aufgabenlisten | UC-11 bis UC-17 |
| `organization` | Abteilungen mit Mitgliedern, Projekte und Aufgaben im Sichtbereich; Abteilung anlegen | UC-17, UC-27 |
| `documents` | Dokumentenbibliothek und Vorlagen im Sichtbereich | UC-28 |
| `approvals` | Freigabeanfragen und Entscheidungen | UC-18 bis UC-20 |
| `roles` | Rollen, Benutzer, Zuordnungen | UC-21, UC-22 |
| `audit-logs` | Audit-Log lesen | UC-23 |
| `task-markers` | Persönliche Farbstreifen | UC-24 |
| `calendar-integration` | Kalender verbinden, synchronisieren, trennen | UC-25 |

Jede Anfrage an den Server außer Registrierung, Anmeldung und den SSO-Rückleitungen setzt ein gültiges Zugriffstoken voraus ([N2](N2-querschnittskonzepte.md), Authentifizierung und Sitzung).

---

## P2.4 Querverweise

| Baustein | Bezug zu P2 |
|----------|-------------|
| [P1](P1-ziele-rahmenbedingungen.md) | CON-03 (SSO), CON-05 (optionale Anbindungen), AS-02 bis AS-05 (Voraussetzungen der Nachbarsysteme). |
| [S1](S1-nachbarsysteme.md) | Ein Abschnitt je NB-xx mit Ablauf, Daten und Fehlerverhalten. |
| [S3](S3-inbetriebnahme.md) | Konfigurationswerte, mit denen die Anbindungen ein- und ausgeschaltet werden. |
| [N2](N2-querschnittskonzepte.md) | Authentifizierung, Fehlerbehandlung bei Ausfall eines Nachbarsystems. |
