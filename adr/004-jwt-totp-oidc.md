# ADR-004: Zustandslose Anmeldung mit JWT, TOTP und OpenID Connect — Variantenvergleich

Kurzfassung in [`docs/arch/A09-architekturentscheidungen.md`](../docs/arch/A09-architekturentscheidungen.md#adr-004-zustandslose-anmeldung-mit-jwt-totp-und-openid-connect).

## Kontext

[ADR-001](001-spa-und-rest-api.md) trennt Browser (Port 5173) und Server (Port 5001) auf zwei Ursprünge. Die Spezifikation verlangt einen zweiten Faktor für lokale Konten ([NFR-15a-01](../docs/spec/N1-nichtfunktional.md)) und eine SSO-Anbindung, bei der das Passwort der Sparkasse NextTask nie erreicht (CON-03, [NFR-15a-03](../docs/spec/N1-nichtfunktional.md)). Zusätzlich sollen Umleitungen von Google (Kalender) einen Anwender wiedererkennen.

Drei Fragen hängen zusammen: Sitzung, zweiter Faktor, SSO. Sie wurden zu verschiedenen Zeitpunkten entschieden (JWT im April 2026, TOTP und OIDC im August 2026), gehören aber in eine Entscheidung, weil TOTP und OIDC auf dem Sitzungsmodell aufbauen.

---

## Frage 1: Sitzung

### Option A: Session-Cookie mit Speicher in PostgreSQL

`express-session` mit `connect-pg-simple`; Cookie `HttpOnly`, `SameSite=None; Secure` für den fremden Ursprung.

**Vorteile**
- Abmelden entwertet die Sitzung auf dem Server; Rollenänderungen können die Sitzung sofort beenden.
- Cookie ist für Skripte im Browser unsichtbar.

**Nachteile**
- Über zwei Ursprünge braucht es `credentials: 'include'` im Browser, `SameSite=None` und HTTPS auch in der Entwicklung, sonst setzen Browser das Cookie nicht.
- Session-Tabelle und Aufräumen abgelaufener Sitzungen.
- Umleitungen von Identity Provider und Google landen beim Server; die Sitzung müsste dort gesetzt und zum Browser-Ursprung übertragen werden.

### Option B: JWT im Local Storage

`jsonwebtoken`; Token mit `id`, `email`, `name`, `role`, `department`, `accessRoleId`, `purpose`; sieben Tage; `Authorization: Bearer`.

**Vorteile**
- Server zustandslos; jede Anfrage trägt die Identität; kein Speicher, kein Aufräumen.
- Umleitungen können einen Einmalcode liefern, den der Browser gegen ein Token tauscht; kein Cookie über Ursprünge hinweg.
- Zwei Tokenarten (`access`, `two_factor_login`) modellieren den Zwischenschritt des zweiten Faktors ohne Serverzustand.

**Nachteile**
- Kein Widerruf vor Ablauf; Abmelden ist nur im Browser wirksam (R-02).
- Token für Skripte lesbar; Schutz gegen eingeschleusten Code liegt allein bei der Anwendung.
- Rollen im Token veralten; Berechtigungen müssen je Anfrage aus der Datenbank kommen.

**Entscheidung Frage 1: Option B.** Die zwei Ursprünge und die zwei Umleitungsflüsse geben den Ausschlag; die Nachteile werden mit sieben Tagen Laufzeit, Datenbankprüfung der Berechtigungen ([A08 8.3](../docs/arch/A08-querschnittliche-konzepte.md#83-berechtigungen)) und dem Verzicht auf fremde Inhalte in der Anwendung begrenzt.

---

## Frage 2: Zweiter Faktor

### Option C: Bibliothek (`otplib` oder `speakeasy`)

**Vorteile**
- Geprüfte TOTP-Berechnung; weniger eigener Code.

**Nachteile**
- Verschlüsselung des Geheimnisses in der Datenbank, Wiederholungsschutz über den Zeitschritt und Wiederherstellungscodes bieten die Bibliotheken nicht; das Modul entsteht trotzdem.
- Eine weitere Abhängigkeit für rund 40 Zeilen Kernlogik (HMAC-SHA-1, dynamische Kürzung, Zeitschritt).

### Option D: Eigene Umsetzung mit `crypto`

`server/src/utils/twoFactor.js`: Base32, HMAC-SHA-1, sechs Ziffern, 30 Sekunden, Fenster ±1; AES-256-GCM für das Geheimnis; bcrypt für zehn Wiederherstellungscodes; `otpauth://`-Adresse; QR-Code über `qrcode`.

**Vorteile**
- Alles, was den zweiten Faktor betrifft, in einem Modul mit 200 Zeilen; Verschlüsselung und Wiederholungsschutz sind Teil des Entwurfs, nicht Anbau.
- Keine Abhängigkeit, deren Pflege vom Team abhängt.
- Das Team versteht jeden Schritt; für eine Spezifikation mit Prüfkriterien ([NFR-15a-01](../docs/spec/N1-nichtfunktional.md)) ein Vorteil.

**Nachteile**
- Sicherheitskritischer Code ohne externe Prüfung; Fehler in der Kürzung oder im Zeitfenster fallen erst beim Test mit echten Authenticator-Apps auf.
- Kein Schutz gegen Zeitabweichung über 30 Sekunden hinaus.

**Entscheidung Frage 2: Option D.** Die Anmeldeabläufe sollten für das Team nachvollziehbar, kontrollierbar und anpassbar bleiben. Bei einem sicherheitsrelevanten Anwendungsfall will das Team genau verstehen, wie der zweite Faktor funktioniert, statt eine Bibliothek als Blackbox zu benutzen; so lässt sich die Lösung prüfen und in der Spezifikation mit Prüfkriterien beschreiben. Der Standard ist kurz und gut dokumentiert; der Mehrwert einer Bibliothek wäre klein, weil die aufwendigen Teile (Verschlüsselung, Codes) ohnehin selbst zu bauen sind.

---

## Frage 3: SSO

### Option E: Bibliothek (`openid-client` oder Passport mit `passport-openidconnect`)

**Vorteile**
- Discovery, PKCE, Token-Prüfung, JWKS-Rotation fertig und gepflegt.

**Nachteile**
- Passport ist auf Sessions ausgelegt und passt nicht zu Option B.
- `openid-client` bringt ein eigenes Konfigurations- und Fehlerbild; die Verknüpfung mit dem Ticket-Modell (Rückleitung ohne Token) und mit `.env`-Schlüsseln bleibt eigener Code.

### Option F: Eigene Umsetzung mit `fetch` und `jsonwebtoken`

`server/src/utils/sso.js`: Discovery mit Cache, verschlüsselter `state` (Nonce, PKCE-Verifier, Rücksprung), Token-Tausch, JWKS-Cache, ID-Token-Prüfung (RS256, `iss`, `aud`, `nonce`, `exp`), UserInfo, Kontenabgleich, Einmalticket.

**Vorteile**
- Passt exakt zum Ticket-Modell; alle Konfiguration in `.env` mit denselben Konventionen wie der Rest.
- Verschlüsselter `state` macht den Server auch während des SSO-Flusses zustandslos.
- Verständlich für Team und Prüfer; `docs/SSO.md` beschreibt, was die Sparkassen-IT liefern muss.

**Nachteile**
- Standardkonformität liegt beim Team; Randfälle (Schlüsselrotation, andere Signaturverfahren, `id_token_hint` beim Abmelden) sind nicht umgesetzt.
- Nur OpenID Connect, kein SAML; falls die Sparkasse nur SAML bietet, entsteht neuer Code.

**Entscheidung Frage 3: Option F.** Aus demselben Grund wie bei Frage 2: Das Team will die Einbindung des externen Identitätsanbieters im Detail verstehen, um sie dokumentieren, prüfen und später gezielt an die Anforderungen eines Kunden wie der Sparkasse anpassen zu können (deren Claims, Gruppenmodell, erlaubte Domänen). Die Kernprüfungen sind mit `jsonwebtoken` und `fetch` kurz; die Anbindung an Ticket-Modell und Konfiguration wäre bei einer Bibliothek der größere Teil gewesen.

---

## Konsequenzen

- Zugriffstoken sieben Tage, Challenge-Token fünf Minuten, `state` zehn Minuten, Ticket 90 Sekunden ([NFR-15a-02](../docs/spec/N1-nichtfunktional.md)).
- Abmelden ohne Serverwirkung; Widerruf nur durch Wechsel von `JWT_SECRET` (R-02).
- Berechtigungen bei jeder Anfrage aus der Datenbank, nicht aus dem Token.
- Kein Lockout bei Fehlversuchen und unterscheidende Fehlermeldungen: bekannte Lücken, unabhängig von dieser Entscheidung ([NFR-15a-01](../docs/spec/N1-nichtfunktional.md), Stand).
- Gruppen des Identity Providers wirken nur beim Anlegen des Kontos; Rollen verwaltet NextTask ([AF-11](../docs/spec/F3-anwendungsfunktionen.md#af-11--sso-konto-abgleichen)).
- Kein SAML, keine Abmeldung beim Provider.
