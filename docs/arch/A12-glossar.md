# 12 Glossar

Technische Begriffe, die in dieser Architekturdokumentation vorkommen. Fachbegriffe stehen im Glossar der Spezifikation ([`E2`](../spec/E2-glossar.md)) und werden hier nicht wiederholt.

---

### AES-256-GCM

Symmetrisches Verschlüsselungsverfahren mit Authentifizierung. NextTask verschlüsselt damit TOTP-Geheimnisse und Kalender-Refresh-Tokens; Format `v1:<iv>:<tag>:<ciphertext>` ([Kapitel 8.8](A08-querschnittliche-konzepte.md#88-geheimnisse)).

### Authorization Code Flow mit PKCE

OAuth-2.0-Ablauf, bei dem der Browser einen Autorisierungscode erhält, den der Server gegen Tokens tauscht. PKCE (RFC 7636) bindet den Code an einen zufälligen Verifier, den nur der Server kennt. Verwendet für SSO und Google.

### axios

HTTP-Bibliothek der Browser-Anwendung. Eine Instanz in `client/src/api/axios.js` mit Basisadresse und Interceptoren für Token und 401.

### bcrypt

Passwort-Hashverfahren mit einstellbarem Kostenfaktor (hier 10). Bibliothek `bcryptjs`; auch für Wiederherstellungscodes.

### CommonJS / ES-Module

Zwei Modulsysteme in JavaScript. Der Server nutzt CommonJS (`require`, `module.exports`), die Browser-Anwendung ES-Module (`import`, `export`).

### concurrently

npm-Paket, das mehrere Befehle parallel startet. `npm run dev` im Wurzelverzeichnis startet damit Server und Vite-Dev-Server.

### CORS

Cross-Origin Resource Sharing. Regelt, welche Ursprünge im Browser die Schnittstelle aufrufen dürfen. NextTask erlaubt alle (`cors()` ohne Optionen).

### cuid

Kollisionsfreier, zeitlich sortierbarer Bezeichner mit 25 Zeichen; Prisma-Vorgabe `@default(cuid())` für alle Primärschlüssel.

### Discovery-Dokument

JSON unter `/.well-known/openid-configuration` eines Identity Providers mit den Adressen von Autorisierungs-, Token-, JWKS- und UserInfo-Endpunkt. NextTask liest es beim ersten Bedarf und hält es zehn Minuten.

### Express

Minimalistisches HTTP-Framework für Node.js. Version 5; Router je Bereich, Middleware für Authentifizierung.

### html2canvas / jsPDF

Browser-Bibliotheken: `html2canvas` rastert ein DOM-Element in ein Bild, `jspdf` fügt Bilder zu einem PDF zusammen. Grundlage der Statusbericht-Ausgabe.

### Interceptor

Funktion, die axios vor jeder Anfrage oder nach jeder Antwort ausführt. NextTask setzt damit den `Authorization`-Kopf und reagiert auf 401.

### JWKS

JSON Web Key Set: die öffentlichen Schlüssel eines Identity Providers, mit denen ID-Tokens geprüft werden. Wird zwischengespeichert.

### JWT

JSON Web Token: signierter, base64-kodierter Datensatz. NextTask stellt Zugriffstokens (`purpose: access`, sieben Tage) und Challenge-Tokens für den zweiten Faktor (`purpose: two_factor_login`, fünf Minuten) aus, beide mit `JWT_SECRET` signiert (HS256).

### Local Storage

Schlüssel-Wert-Speicher des Browsers je Ursprung. Hält Token, Profil, Anzeigeeinstellungen und derzeit auch Teile der Fachdaten ([Kapitel 8.9](A08-querschnittliche-konzepte.md#89-zustand-im-browser)).

### Middleware

Funktion, die Express vor dem Routen-Handler ausführt. `auth.js` prüft das JWT; in `index.js` hängt eine Middleware den Prisma-Client an die Anfrage.

### Migration

Versionierte Schemaänderung der Datenbank als SQL-Datei unter `server/prisma/migrations/<zeitstempel>_<name>/migration.sql`. Wird mit `prisma migrate deploy` in Reihenfolge angewendet.

### nodemailer

Node-Bibliothek für SMTP-Versand. Ein Transport je Prozess, faul beim ersten Versand erzeugt.

### nodemon

Startet den Server in der Entwicklung neu, wenn sich Dateien ändern (`npm run dev` in `server/`).

### Prisma

ORM und Migrationswerkzeug. Schema in `schema.prisma`, generierter Client `@prisma/client`, Treiberadapter `@prisma/adapter-pg` für PostgreSQL.

### React Router

Routing im Browser. Definiert in `client/src/App.jsx` mit Wächtern `RequireAuth`, `PublicOnly`, `RequireAuditAccess`.

### SHA-256

Hashfunktion. Verwendet für SSO-Einmaltickets und zur Ableitung der Verschlüsselungsschlüssel aus `JWT_SECRET` bzw. `TWO_FACTOR_SECRET_KEY`.

### SPA

Single-Page-Application: Eine HTML-Seite, deren Inhalt JavaScript im Browser nachlädt und wechselt. Die Browser-Anwendung von NextTask ist eine SPA.

### Tailwind CSS

CSS-Framework mit Utility-Klassen. Version 4 über das Vite-Plugin; Darstellungsvarianten (Darkmode, Dichte) über Datenattribute am `<html>`-Element.

### TOTP

Time-based One-time Password (RFC 6238). Eigene Implementierung in `server/src/utils/twoFactor.js`: Base32-Geheimnis mit 20 Byte, HMAC-SHA-1, sechs Ziffern, 30 Sekunden, Toleranz ±1 Schritt.

### Vite

Entwicklungsserver und Bundler der Browser-Anwendung. `vite` für Entwicklung mit Hot Module Replacement, `vite build` für das statische Bauartefakt unter `client/dist/`.
