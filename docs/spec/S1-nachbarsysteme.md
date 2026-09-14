# S1 — Nachbarsystem-Schnittstellen

Schnittstellenverträge zwischen NextTask und den in [P2.2](P2-architekturueberblick.md#p22-nachbarsysteme) aufgezählten Nachbarsystemen. Je System: Zweck, Ablauf, ausgetauschte Daten, Konfiguration und Fehlerverhalten. Die fachlichen Abläufe, in denen die Schnittstellen benutzt werden, stehen in [F2](F2-anwendungsfaelle.md); die Regeln in [F3](F3-anwendungsfunktionen.md).

---

## S1.1 Konventionen

- Alle Verbindungen nach außen laufen über HTTPS. Der Server hält Zugangsdaten (Client-Secret, SMTP-Passwort, Google-Zugangsdaten) nur in seiner Konfiguration (S3), nie in der Datenbank und nie im Browser.
- Optionale Nachbarsysteme (NB-02, NB-04, NB-05) sind per Konfiguration abschaltbar. Ist eines nicht konfiguriert, verhält sich NextTask so, als gäbe es die Funktion nicht: Die SSO-Schaltfläche fehlt, Mails werden nicht versendet, die Kalenderverbindung ist in den Einstellungen gesperrt.
- Ein Fehler eines optionalen Systems bricht die auslösende Aktion nicht ab ([N2](N2-querschnittskonzepte.md), Fehlerbehandlung).

---

## S1.2 NB-01 — Browser des Anwenders

**Zweck.** Einziger Zugang für Menschen. Die Browser-Anwendung ruft die Schnittstelle des Servers auf.

**Vertrag.**

| Aspekt | Festlegung |
|--------|------------|
| Protokoll | HTTPS, JSON in beide Richtungen. Basisadresse der Schnittstelle: `<Server>/api`. |
| Authentifizierung | Zugriffstoken (JWT, sieben Tage gültig) im Kopf `Authorization: Bearer <Token>`. Ohne oder mit ungültigem Token antwortet der Server mit Status 401 und „Bitte einloggen" bzw. „Login ist abgelaufen oder ungueltig"; der Browser löscht daraufhin Token und Profil und zeigt die Anmeldemaske. |
| Ohne Token erreichbar | Registrierung, Anmeldung, Einlösen des Einmaltickets, SSO-Konfiguration, SSO-Start und -Rückleitung, Kalender-Rückleitung. |
| Erfolgsantwort | Status 200 (Lesen, Ändern) oder 201 (Anlegen) mit dem betroffenen Objekt oder einer Liste. |
| Fehlerantwort | Status 400 (Eingabe), 401 (Anmeldung), 403 (Berechtigung), 404 (nicht gefunden), 500 (Serverfehler) mit `{ "message": "<deutscher Text>" }`; bei 500 zusätzlich `error` mit der technischen Ursache. Die Texte sind in den Ausnahmeszenarien in F2 genannt. |
| Zeichensatz, Sprache | UTF-8; alle Meldungen Deutsch (CON-06). |
| Herkunft | Anfragen von beliebigen Ursprüngen werden angenommen (offene CORS-Regel); vorgesehen ist der Betrieb von Browser-Anwendung und Server unter verschiedenen Ports derselben Maschine (S3). |

Die Basisadresse ist in der Browser-Anwendung fest auf `http://localhost:5001/api` eingestellt. Für einen Betrieb außerhalb der Entwicklungsumgebung muss sie angepasst werden (S3).

---

## S1.3 NB-02 — Identity Provider der Sparkasse (OpenID Connect)

**Zweck.** Bestätigt die Identität eines Anwenders, ohne dass NextTask das Passwort der Sparkasse sieht (CON-03). Ablauf in [UC-03](F2-anwendungsfaelle.md#uc-03--anmelden-per-sso), Kontenabgleich in [AF-11](F3-anwendungsfunktionen.md#af-11--sso-konto-abgleichen).

**Protokoll.** OpenID Connect Core 1.0, Authorization Code Flow mit PKCE (S256). Discovery über `/.well-known/openid-configuration`; Signaturprüfung über die JWKS des Providers, zulässig ist RS256. Discovery-Dokument und Schlüssel werden zwischengespeichert.

**Ablauf und Daten.**

| Schritt | Richtung | Daten |
|---------|----------|-------|
| Autorisierungsanfrage | Browser → Provider (Umleitung durch NextTask) | `client_id`, `redirect_uri`, `scope` (Vorgabe `openid profile email`), `response_type=code`, `state` (verschlüsselt, enthält Nonce, PKCE-Verifier, Rücksprungziel, zehn Minuten gültig), `nonce`, `code_challenge`, optional `login_hint`. |
| Rückleitung | Provider → Browser → NextTask | `code`, `state`; im Fehlerfall `error`, `error_description`. |
| Token-Austausch | NextTask → Provider | `code`, `code_verifier`, `redirect_uri`, Client-Authentifizierung (`client_secret_basic` oder wie konfiguriert). |
| Antwort | Provider → NextTask | ID-Token, Zugriffstoken. NextTask prüft Signatur, Aussteller, Zielgruppe, Nonce, Ablauf. |
| Profil | aus ID-Token, ergänzt um UserInfo | `sub` (Subjekt), `email`, `email_verified`, `name`, Gruppen aus dem konfigurierten Claim (Vorgabe `groups`). |

**Was NextTask beim Provider registriert braucht** (siehe auch [`docs/SSO.md`](../SSO.md)): Rückleitungsadresse `<Server>/api/auth/sso/callback`; Client-ID; Client-Secret bei vertraulichem Client; Scopes; Claims für Subjekt, E-Mail, Name, optional Gruppen.

**Konfiguration** (S3): Aktivierung, Discovery- oder Issuer-URL, Client-ID und -Secret, Client-Authentifizierungsmethode, Rückleitungsadressen (Server und Browser-Anwendung), Scopes, erlaubte E-Mail-Domänen, automatisches Anlegen von Konten, Standardrolle, Standardabteilung, Gruppen-Claim, Administratorgruppen, Pflicht zur bestätigten E-Mail.

**Fehlerverhalten.** Jeder Fehler (Abbruch beim Provider, abgelaufener oder manipulierter `state`, ungültiges Token, nicht erlaubte Domäne, Konflikt mit vorhandenem Konto, Konto darf nicht angelegt werden) führt zur Anmeldemaske mit der jeweiligen Meldung und zu einem Audit-Eintrag `SSO_LOGIN_FAILED` mit dem Grund. Es entsteht keine Sitzung. Ein Ausfall des Providers betrifft nur die SSO-Anmeldung; lokale Konten melden sich weiter an.

**Nicht umgesetzt.** Abmeldung beim Provider (Logout-Endpunkt), Aktualisierung der Rolle bei geänderten Gruppen, SAML.

---

## S1.4 NB-03 — Authenticator-App (TOTP)

**Zweck.** Zweiter Faktor für lokale Konten ([UC-02](F2-anwendungsfaelle.md#uc-02--anmelden-mit-passwort), [UC-04](F2-anwendungsfaelle.md#uc-04--zweiten-faktor-verwalten), [AF-06](F3-anwendungsfunktionen.md#af-06--zweiten-faktor-prüfen)).

**Vertrag.** Es gibt keine Verbindung zur Laufzeit. Bei der Einrichtung übergibt NextTask das Geheimnis einmalig als QR-Code und als Text in der Form

```
otpauth://totp/<Aussteller>:<E-Mail>?secret=<Base32>&issuer=<Aussteller>&algorithm=SHA1&digits=6&period=30
```

Aussteller ist konfigurierbar (Vorgabe `NextTask`). Jede App, die RFC 6238 mit SHA-1, sechs Ziffern und 30 Sekunden unterstützt, ist geeignet. Die Zeit auf Server und Smartphone darf um höchstens einen Zeitschritt abweichen.

**Fehlerverhalten.** Ein falscher Code wird abgelehnt; der Anwender kann erneut eingeben oder einen Wiederherstellungscode verwenden. Verliert der Anwender die App und die Wiederherstellungscodes, gibt es keinen Weg zurück im System (R-03).

---

## S1.5 NB-04 — Google Calendar API

**Zweck.** Fristen zugewiesener Aufgaben als ganztägige Termine im Kalender des Anwenders ([UC-25](F2-anwendungsfaelle.md#uc-25--kalender-verbinden), [AF-08](F3-anwendungsfunktionen.md#af-08--kalenderabgleich)).

**Protokoll.** OAuth 2.0 Authorization Code mit `access_type=offline` und `prompt=consent`, Scope `https://www.googleapis.com/auth/calendar.events` sowie Profil und E-Mail. Der Dauerzugriff (Refresh-Token) wird verschlüsselt am Konto gespeichert; Zugriffstoken werden je Vorgang erneuert. Kalender ist immer der Hauptkalender (`primary`) des verbundenen Kontos.

**Ablauf und Daten.**

| Schritt | Richtung | Daten |
|---------|----------|-------|
| Zustimmung | Browser → Google (Umleitung durch NextTask) | Client-ID, Rückleitungsadresse `<Server>/api/calendar-integration/callback`, signierter `state` mit Anwender und Rücksprungziel. |
| Rückleitung | Google → Browser → NextTask | `code`, `state`; im Fehlerfall `error`. |
| Token-Austausch, Profil | NextTask → Google | `code` gegen Refresh- und Zugriffstoken; E-Mail des Google-Kontos. |
| Termin anlegen oder ändern | NextTask → Google | Ganztägiger Termin: Datum der Frist, Titel der Aufgabe. Antwort: Kennung des Termins, gespeichert in `CalendarSyncEvent`. |
| Termin löschen | NextTask → Google | Kennung des Termins. |

**Konfiguration** (S3): Google-Client-ID und -Secret, Basisadresse der Browser-Anwendung für die Rückleitung.

**Fehlerverhalten.** Fehlt der Dauerzugriff in Googles Antwort, wird die Verbindung nicht gespeichert und der Anwender gebeten, erneut zuzustimmen. Fehler beim Anlegen oder Löschen eines Termins werden im Serverprotokoll vermerkt, beim Vollabgleich zusätzlich am Konto (`calendarSyncError`); die Aufgabe wird trotzdem gespeichert. Eine Aufgabe ohne Bearbeiter oder ohne Frist erzeugt keinen Termin. Änderungen im Google-Kalender fließen nicht zurück (NG-06).

---

## S1.6 NB-05 — SMTP-Mailserver

**Zweck.** Benachrichtigungen bei Zuweisung, Erwähnung und als Testmail ([AF-09](F3-anwendungsfunktionen.md#af-09--benachrichtigung-per-e-mail)).

**Protokoll.** SMTP mit Anmeldung (Benutzer, Passwort), wahlweise mit TLS ab Verbindungsaufbau (`SMTP_SECURE`) oder STARTTLS über den Standardport. Absender ist die konfigurierte Adresse (`EMAIL_FROM`).

**Nachrichten.** Jede Mail wird als HTML mit Textalternative gesendet und enthält Anrede, Anlass, Aufgabentitel, Projekt, Frist und einen Link auf die Aufgabe in der Browser-Anwendung.

| Anlass | Betreff | Empfänger |
|--------|---------|-----------|
| Zuweisung | „Neues Ticket für dich: <Titel>" | neuer Bearbeiter |
| Neuzuweisung | „Ticket neu zugewiesen: <Titel>" | neuer Bearbeiter |
| Erwähnung | „Erwaehnung in Ticket: <Titel>" | erwähnter Anwender |
| Test | „NextTask Testmail" | der Anwender selbst |

**Konfiguration** (S3): Aktivierung des Versands, Host, Port, TLS, Benutzer, Passwort, Absender. Fehlt ein Wert, wird nicht versendet.

**Fehlerverhalten.** Ablehnung oder Nichterreichbarkeit des Servers wird protokolliert; die auslösende Aktion ist davon unabhängig. Es gibt keine Warteschlange und keinen erneuten Versuch (README, B2 nicht anwendbar). NextTask empfängt keine Mails.

---

## S1.7 Querverweise

| Baustein | Bezug zu S1 |
|----------|-------------|
| [P2](P2-architekturueberblick.md) | Inventar NB-01 bis NB-05. |
| [S3](S3-inbetriebnahme.md) | Konfigurationswerte je Schnittstelle. |
| [N1](N1-nichtfunktional.md) | NFR-15a-03 (SSO), NFR-15b-01 (Geheimnisse), NFR-12d-01 (Unabhängigkeit von Nachbarsystemen), NFR-17b-01 (Standards). |
| [N2](N2-querschnittskonzepte.md) | Fehlerbehandlung, Geheimnisse. |
