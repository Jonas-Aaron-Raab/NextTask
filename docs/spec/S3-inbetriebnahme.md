# S3 — Inbetriebnahme

Voraussetzungen und Ablauf, um NextTask in einer Umgebung in Betrieb zu nehmen, nach Siedersleben (Kapitel 4.9). Beschrieben ist der Stand der Entwicklungsumgebung; ein Betrieb auf einem Server der Sparkasse ist nicht Teil des Projekts (CON-05), die Unterschiede sind in S3.6 benannt.

---

## S3.1 Voraussetzungen

| Voraussetzung | Bemerkung |
|---------------|-----------|
| Laufzeitumgebung für JavaScript (Node.js) mit Paketverwaltung npm | Eine Mindestversion ist im Repository nicht festgelegt; die Entwicklung läuft mit einer aktuellen LTS-Version. |
| PostgreSQL-Datenbank | Leer angelegt; Verbindungsadresse mit Benutzer, Passwort und Datenbankname. Bei entfernten Datenbanken ist `sslmode=require` vorgesehen. |
| Zwei freie Ports auf der Maschine | Server (Vorgabe 5001) und Browser-Anwendung (5173). |
| Optional: Zugangsdaten für SSO, Google Calendar, SMTP | Ohne sie laufen die zugehörigen Funktionen nicht (S1). |
| Für die Dokumentation: Java 8 oder neuer | Zum Rendern der Diagramme (`scripts/generate-diagrams.sh`). |

---

## S3.2 Konfiguration

Der Server liest seine Konfiguration aus einer Datei `server/.env`; eine Vorlage liegt als `server/.env.example` im Repository. Die Datei enthält Geheimnisse und wird nicht versioniert.

| Gruppe | Werte | Pflicht | Bemerkung |
|--------|-------|---------|-----------|
| Datenbank | `DATABASE_URL` | ja | Verbindungsadresse. |
| Sitzung und Geheimnisse | `JWT_SECRET`, `TWO_FACTOR_SECRET_KEY`, `TWO_FACTOR_ISSUER` | `JWT_SECRET` ja | Serverschlüssel für Zugriffstoken, SSO-Zustand und Kalender-Zustand. Der 2FA-Schlüssel verschlüsselt TOTP-Geheimnisse und Kalender-Dauerzugriffe; fehlt er, wird der Serverschlüssel dafür verwendet. Der Aussteller erscheint in der Authenticator-App. |
| Server | `PORT` | nein | Vorgabe 5000; die Browser-Anwendung erwartet 5001. |
| SSO | `SSO_ENABLED`, `SSO_PROVIDER`, `SSO_DISPLAY_NAME`, `SSO_ISSUER_URL`, `SSO_DISCOVERY_URL`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `SSO_CLIENT_AUTH_METHOD`, `SSO_REDIRECT_URI`, `SSO_FRONTEND_REDIRECT_URI`, `SSO_SCOPES`, `SSO_ALLOWED_EMAIL_DOMAINS`, `SSO_AUTO_CREATE_USERS`, `SSO_DEFAULT_ACCESS_ROLE_CODE`, `SSO_DEFAULT_DEPARTMENT`, `SSO_GROUPS_CLAIM`, `SSO_ADMIN_GROUPS`, `SSO_REQUIRE_VERIFIED_EMAIL` | nein | SSO ist erst aktiv, wenn `SSO_ENABLED=true` und Discovery-URL, Client-ID und beide Rückleitungsadressen gesetzt sind (S1.3). |
| Kalender | `APP_BASE_URL`, `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET` | nein | Ohne Google-Zugangsdaten ist die Verbindung in den Einstellungen gesperrt (S1.5). |
| E-Mail | `EMAIL_NOTIFICATIONS_ENABLED`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | nein | Versand nur, wenn `EMAIL_NOTIFICATIONS_ENABLED=true` und alle SMTP-Werte gesetzt sind (S1.6). |

Die Browser-Anwendung hat keine eigene Konfigurationsdatei. Die Adresse des Servers ist fest eingetragen (S1.2).

---

## S3.3 Erstinbetriebnahme

1. Repository klonen und Abhängigkeiten installieren: im Wurzelverzeichnis, in `server` und in `client` jeweils `npm install`.
2. `server/.env` aus der Vorlage anlegen und mindestens `DATABASE_URL`, `JWT_SECRET` und `PORT=5001` setzen. Für `JWT_SECRET` und `TWO_FACTOR_SECRET_KEY` lange Zufallswerte verwenden.
3. Datenbankschema anlegen: in `server` die Migrationen ausführen (`npx prisma migrate deploy`) und den Datenbankzugriff erzeugen (`npx prisma generate`). Die Migrationen legen alle Tabellen aus [D1](D1-datenmodell.md) an; Daten enthalten sie nicht.
4. Server und Browser-Anwendung starten: im Wurzelverzeichnis `npm run dev` startet beide (Server mit automatischem Neustart bei Änderungen, Browser-Anwendung mit Entwicklungsserver). Der Server meldet „Server läuft auf http://localhost:5001", die Browser-Anwendung ist unter `http://localhost:5173` erreichbar.
5. Erstes Konto anlegen: über die Registrierung ([UC-01](F2-anwendungsfaelle.md#uc-01--registrieren)). Beim ersten Zugriff auf Rollen oder bei der ersten Registrierung legt der Server die fünf Systemrollen an ([D2.6](D2-datentypen.md#d26-permissionsetdt)).
6. Ersten Administrator bestimmen: Das System vergibt die Administratorrolle nicht automatisch. Ein Konto wird Administrator, indem es per SSO mit einer konfigurierten Administratorgruppe anmeldet ([AF-11](F3-anwendungsfunktionen.md#af-11--sso-konto-abgleichen)) oder indem in der Datenbank `User.accessRoleId` auf die Rolle mit Code `A` und `User.role` auf `ADMIN` gesetzt wird. Danach legt dieser Administrator weitere Benutzer und Zuordnungen in der Rollenverwaltung an ([UC-22](F2-anwendungsfaelle.md#uc-22--benutzer-anlegen-und-zuordnen)).
7. Optional SSO, Kalender und E-Mail konfigurieren und den Server neu starten. Prüfen: SSO-Schaltfläche auf der Anmeldemaske, Statusanzeige „Server bereit" in den Einstellungen, Testmail.

---

## S3.4 Dauerhafte Zustände

| Zustand | Ort | Sicherung |
|---------|-----|-----------|
| Alle Entitäten aus D1 | PostgreSQL | Datenbanksicherung nach den Regeln des Betreibers. Es gibt keine Exportfunktion in NextTask. |
| Konfiguration und Geheimnisse | `server/.env` | Getrennt und geschützt aufbewahren. Verlust von `JWT_SECRET` beendet alle Sitzungen; Verlust von `TWO_FACTOR_SECRET_KEY` macht alle TOTP-Geheimnisse und Kalender-Dauerzugriffe unlesbar (alle Anwender müssten den zweiten Faktor und den Kalender neu einrichten). |
| Anzeigeeinstellungen, Farbstreifen-Kopie, lokale Projekte und Boards, vorgemerkte Freigaben | Browser des Anwenders (Local Storage) | Nicht gesichert; an Browser und Gerät gebunden (R-01, B1.5). |

---

## S3.5 Aktualisierung

1. Neuen Stand aus dem Repository holen und Abhängigkeiten aktualisieren (`npm install` in allen drei Verzeichnissen).
2. Neue Migrationen anwenden (`npx prisma migrate deploy` in `server`). Migrationen sind vorwärts gerichtet; ein Rückbau ist nur über eine Datenbanksicherung möglich.
3. Server und Browser-Anwendung neu starten.

Sitzungen bleiben über eine Aktualisierung hinweg gültig, solange `JWT_SECRET` unverändert bleibt.

---

## S3.6 Abweichungen für einen Betrieb außerhalb der Entwicklungsumgebung

Nicht Teil des Projekts, aber für eine Übernahme durch die Sparkassen-IT relevant:

- Die Browser-Anwendung muss gebaut (`npm run build` in `client`) und über einen Webserver ausgeliefert werden; die Serveradresse muss vorher angepasst werden (S1.2).
- Der Server muss hinter einem HTTPS-Endpunkt laufen; die Rückleitungsadressen für SSO und Kalender müssen auf die öffentliche Adresse zeigen und beim jeweiligen Provider registriert sein.
- Die offene CORS-Regel sollte auf die Adresse der Browser-Anwendung eingeschränkt werden.
- Der Server läuft als ein Prozess ohne Prozessmanager; Neustart bei Absturz und Protokollrotation muss die Umgebung leisten.

---

## S3.7 Querverweise

| Baustein | Bezug zu S3 |
|----------|-------------|
| [P1](P1-ziele-rahmenbedingungen.md) | CON-04 (Technologiestack), CON-05 (Studienumgebung), R-01. |
| [S1](S1-nachbarsysteme.md) | Bedeutung der Konfigurationswerte je Nachbarsystem. |
| [N2](N2-querschnittskonzepte.md) | Geheimnisse, Sitzungen. |
| [D2.6](D2-datentypen.md#d26-permissionsetdt) | Die fünf Systemrollen, die beim ersten Start entstehen. |
