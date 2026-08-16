# NextTask SSO-Schnittstelle

Diese Schnittstelle ist fuer ein bestehendes Unternehmens-SSO gedacht, zum Beispiel Sparkassen-SSO ueber OpenID Connect.

## Zielbild

1. Nutzer klickt auf der Login-Seite auf "Mit SSO anmelden".
2. NextTask leitet zum Identity Provider weiter.
3. Der Identity Provider authentifiziert den Nutzer.
4. Der Identity Provider leitet an NextTask zurueck.
5. NextTask validiert die Antwort, verknuepft den Nutzer und erstellt den normalen NextTask-JWT.

Das Sparkassen-Passwort wird nicht an NextTask uebertragen oder gespeichert.

## Endpunkte

```text
GET  /api/auth/sso/config
GET  /api/auth/sso/login
GET  /api/auth/sso/callback
POST /api/auth/sso/exchange
```

## Redirect-URLs

Diese URL muss beim Identity Provider fuer NextTask registriert werden:

```text
https://eure-domain.de/api/auth/sso/callback
```

Lokal fuer Entwicklung:

```text
http://localhost:5001/api/auth/sso/callback
```

## Benoetigte Angaben von der Sparkassen-IT

Fuer OpenID Connect:

```text
Issuer URL oder Discovery URL
Client ID
Client Secret, falls confidential client
Erlaubte Redirect URI
Scopes, meist: openid profile email
Claims fuer eindeutige User-ID, E-Mail, Name und optional Gruppen
Logout Endpoint, falls vorhanden
```

Falls die Sparkassen-IT nur SAML anbietet, brauchen wir stattdessen:

```text
IdP Metadata XML oder Metadata URL
Entity ID
SSO URL
X.509 Zertifikat
ACS URL
NameID Format
Attribute fuer E-Mail, Name und optional Gruppen
```

## Rollenstrategie

Empfohlen fuer den Start:

```text
SSO bestaetigt nur die Identitaet.
NextTask verwaltet Rollen und Berechtigungen weiterhin selbst.
```

Optional kann spaeter ein Gruppenmapping aktiviert werden, zum Beispiel:

```text
Sparkassen-Gruppe NextTask-Admins -> NextTask Admin
```

## Code-Orte

Die SSO-Logik liegt bewusst getrennt vom normalen Passwort-Login:

```text
server/src/utils/sso.js
server/src/routes/auth.routes.js
client/src/pages/LoginPage.jsx
server/prisma/schema.prisma
```

## Konfiguration

Die konkrete Konfiguration erfolgt ueber `server/.env`. Die Beispielwerte stehen in `server/.env.example`.
