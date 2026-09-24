# N1 — Nichtfunktionale Anforderungen

Messbare Qualitätsanforderungen mit Prüfkriterium, gegliedert nach den Abschnitten 10 bis 17 der Volere-Schablone. Rahmenbedingungen, die den Lösungsraum festlegen, stehen in [P1.5](P1-ziele-rahmenbedingungen.md#p15-rahmenbedingungen), nicht hier. Abschnitte ohne Anforderung sind mit Begründung als nicht anwendbar markiert.

Jede Anforderung hat eine Kennung `NFR-<Volere-Abschnitt>-<Nr.>`, eine Beschreibung und ein **Prüfkriterium**, das sich ohne Blick in den Code prüfen lässt. Wo die Umsetzung eine bekannte Lücke hat, steht sie unter *Stand*. Die Anforderungen werden aus den Anwendungsfällen in [F2](F2-anwendungsfaelle.md) referenziert.

| Kennung | Kurztitel | Abschnitt |
|---------|-----------|-----------|
| NFR-11a-01 | Bedienung ohne Schulung | 11 Benutzbarkeit |
| NFR-11b-01 | Deutsche Oberfläche | 11 Benutzbarkeit |
| NFR-12a-01 | Antwortzeit interaktiver Aktionen | 12 Leistung |
| NFR-12d-01 | Unabhängigkeit von optionalen Nachbarsystemen | 12 Leistung |
| NFR-12e-01 | Listenbegrenzung | 12 Leistung |
| NFR-13b-01 | Arbeitsplatz-Browser | 13 Betrieb |
| NFR-14a-01 | Nachvollziehbare Änderungen am Code | 14 Wartbarkeit |
| NFR-14c-01 | Konfigurierbare Anbindungen | 14 Wartbarkeit |
| NFR-15a-01 | Zweiter Faktor für lokale Konten | 15 Sicherheit |
| NFR-15a-02 | Sitzungsdauer | 15 Sicherheit |
| NFR-15a-03 | SSO ohne Passwortübertragung | 15 Sicherheit |
| NFR-15b-01 | Verschlüsselte Geheimnisse | 15 Sicherheit |
| NFR-15b-02 | Passwort-Hashing | 15 Sicherheit |
| NFR-15b-03 | Keine Geheimnisse im Audit-Log | 15 Sicherheit |
| NFR-15c-01 | Datensparsamkeit | 15 Sicherheit |
| NFR-15d-01 | Vollständiger, unveränderlicher Audit-Trail | 15 Sicherheit |
| NFR-15d-02 | Zugriff auf das Audit-Log | 15 Sicherheit |
| NFR-17b-01 | Standards für Anmeldung und zweiten Faktor | 17 Konformität |

---

## 10. Erscheinungsbild

*Keine eigene Anforderung.* Die Gestaltung ist in der Browser-Anwendung festgelegt (Sparkassen-Rot als Kennfarbe, helle und dunkle Darstellung, zwei Dichten, Schriftgröße 90 bis 125 %). Sie ist Teil von B1.4.1, nicht Gegenstand einer Anforderung mit Prüfkriterium.

---

## 11. Benutzbarkeit

### 11a. Einfache Bedienung

**NFR-11a-01: Bedienung ohne Schulung.** Ein Mitarbeiter, der Kanban-Boards und Kalender aus anderen Werkzeugen kennt, kann Aufgaben anlegen, bearbeiten, terminieren und eine Freigabe anfragen, ohne Dokumentation zu lesen.

*Prüfkriterium:* Eine Testperson ohne Einweisung legt in DLG-05 eine Aufgabe an, setzt sie in DLG-06 auf einen anderen Tag und fragt im Editor eine Freigabe an. Alle drei Schritte gelingen ohne Nachfrage.

### 11b. Sprache

**NFR-11b-01: Deutsche Oberfläche.** Alle Beschriftungen, Meldungen, E-Mails und die Druckausgabe sind deutsch (CON-06). Aufzählungswerte des Datenmodells (`IN_PROGRESS`, `PENDING`) erscheinen dem Anwender nur über ihre deutschen Anzeigetexte aus [D2](D2-datentypen.md).

*Prüfkriterium:* Auf keiner Maske, in keiner Fehlermeldung und in keiner E-Mail steht englischer Text, mit Ausnahme von Produktnamen (Google Calendar, SSO) und Eigennamen.

*Stand:* Umlaute werden in einigen Meldungen als `ue`, `ae` geschrieben („ungueltig", „verfuegbar"). Das ist eine Schreibweise, keine Sprachabweichung, sollte aber vereinheitlicht werden.

### 11c, 11d. Erlernbarkeit, Barrierefreiheit

*Nicht anwendbar.* Es gibt keine gesonderten Anforderungen über 11a hinaus; Barrierefreiheit nach BITV ist im Studienprojekt nicht gefordert.

---

## 12. Leistung

### 12a. Antwortzeit

**NFR-12a-01: Antwortzeit interaktiver Aktionen.** Lesende Aufrufe (Aufgabenliste, Freigaben, Audit-Log) und einfache Änderungen (Aufgabe speichern, Freigabe entscheiden) antworten innerhalb von zwei Sekunden, gemessen vom Absenden im Browser bis zur sichtbaren Rückmeldung, bei der in AS-06 angenommenen Nutzerzahl und den Listenbegrenzungen aus NFR-12e-01. Der Versand von E-Mails und der Kalenderabgleich laufen innerhalb derselben Anfrage; ihre Dauer zählt mit.

*Prüfkriterium:* Zehn aufeinanderfolgende Aufrufe von DLG-06 (Monatsansicht) und zehn Speichervorgänge in DLG-05 bleiben jeweils unter zwei Sekunden, gemessen in den Entwicklerwerkzeugen des Browsers gegen eine Datenbank mit mindestens 500 Aufgaben.

### 12b, 12c. Sicherheitskritische und Präzisionsanforderungen

*Nicht anwendbar.* NextTask steuert keine Vorgänge mit Gefährdungspotenzial; Beträge werden nur angezeigt, nicht verrechnet.

### 12d. Zuverlässigkeit

**NFR-12d-01: Unabhängigkeit von optionalen Nachbarsystemen.** Ein Ausfall von Identity Provider, Google Calendar oder SMTP-Server verhindert keine fachliche Aktion. Die Aktion wird gespeichert, die Übertragung unterbleibt und wird protokolliert ([S1](S1-nachbarsysteme.md)).

*Prüfkriterium:* Mit falschen SMTP-Zugangsdaten und ungültigen Google-Zugangsdaten lassen sich Aufgaben anlegen, zuweisen, terminieren und kommentieren; jede Aktion antwortet mit Erfolg, und im Serverprotokoll steht je Aktion ein Eintrag zum fehlgeschlagenen Versand bzw. Abgleich.

### 12e. Kapazität

**NFR-12e-01: Listenbegrenzung.** Listen mit potenziell vielen Einträgen sind serverseitig begrenzt, damit die Antwortzeit unabhängig vom Datenbestand bleibt: Audit-Log Vorgabe 100, Freigaben Vorgabe 150, beide höchstens 250 Einträge je Aufruf; die Kontextliste der Freigaben höchstens 100 Projekte, Aufgaben und Berichte. Die Aufgabenliste ist über den Zeitraum der Ansicht begrenzt.

*Prüfkriterium:* Bei 1.000 Audit-Einträgen liefert DLG-09 höchstens 250 und zeigt die Gesamtzahl an.

---

## 13. Betriebsumgebung

### 13a. Physische Umgebung

*Nicht anwendbar.* Bedienung am Arbeitsplatz.

### 13b. Technische Umgebung

**NFR-13b-01: Arbeitsplatz-Browser.** Die Oberfläche ist für aktuelle Desktop-Browser (Chrome, Edge, Firefox in der jeweils aktuellen Version) bei einer Breite ab 1280 Pixel ausgelegt. Schmalere Fenster werden nicht unterstützt (NG-04, CON-01).

*Prüfkriterium:* Alle zwölf Masken sind in den drei Browsern bei 1280 × 800 vollständig bedienbar, ohne horizontales Scrollen.

### 13c, 13d. Partneranwendungen, Produktisierung

*Nicht anwendbar.* Die Nachbarsysteme sind in S1 vertraglich beschrieben; NextTask wird nicht als Produkt ausgeliefert.

---

## 14. Wartbarkeit

### 14a. Wartung

**NFR-14a-01: Nachvollziehbare Änderungen am Code.** Jede Änderung im Repository ist ein Commit nach Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` mit Bereich), auf Englisch, mit einer Zeile, die sagt, was geändert wurde ([`AGENTS.md`](../../AGENTS.md)). Die Spezifikation liegt neben dem Code und wird mit ihm versioniert.

*Prüfkriterium:* In der Git-Historie folgen mindestens 90 % der Commits dem Muster `typ(bereich): beschreibung`.

### 14b. Support

*Nicht anwendbar.* Studienprojekt ohne Supportorganisation.

### 14c. Anpassbarkeit

**NFR-14c-01: Konfigurierbare Anbindungen.** SSO, Kalender und E-Mail werden ausschließlich über die Konfigurationsdatei des Servers ein- und ausgeschaltet und parametrisiert ([S3.2](S3-inbetriebnahme.md#s32-konfiguration)); ein Wechsel des Identity Providers oder des Mailservers erfordert keine Codeänderung.

*Prüfkriterium:* Das Umstellen von `SSO_ENABLED` auf `true` mit gültigen Providerdaten lässt die SSO-Schaltfläche in DLG-01 erscheinen; das Zurückstellen entfernt sie. Beides ohne Neubau der Anwendung.

*Stand:* Die Adresse des Servers ist in der Browser-Anwendung fest eingetragen (S1.2); für einen anderen Betriebsort ist ein Neubau nötig.

---

## 15. Sicherheit

### 15a. Zugang

**NFR-15a-01: Zweiter Faktor für lokale Konten.** Jedes lokale Konto kann einen zweiten Faktor nach RFC 6238 aktivieren. Ist er aktiv, gelingt die Anmeldung nur mit gültigem Einmalcode oder unverbrauchtem Wiederherstellungscode; ein Einmalcode ist nur einmal gültig ([AF-06](F3-anwendungsfunktionen.md#af-06--zweiten-faktor-prüfen)).

*Prüfkriterium:* Nach Aktivierung führt ein korrektes Passwort ohne Code nicht zu einer Sitzung. Derselbe Einmalcode wird beim zweiten Versuch abgelehnt. Nach Verbrauch aller zehn Wiederherstellungscodes wird ein bereits verwendeter abgelehnt.

*Stand:* Der zweite Faktor ist freiwillig; das System erzwingt ihn nicht für bestimmte Rollen. Es gibt keine Begrenzung fehlgeschlagener Anmeldeversuche, und die Fehlermeldungen unterscheiden zwischen unbekannter E-Mail und falschem Passwort (UC-02). Beides ist eine bekannte Schwäche.

**NFR-15a-02: Sitzungsdauer.** Ein Zugriffstoken ist sieben Tage gültig; ein Challenge-Token für den zweiten Faktor fünf Minuten; ein SSO-Zustand zehn Minuten; ein SSO-Einmalticket 90 Sekunden. Nach Ablauf antwortet der Server mit 401 und die Oberfläche kehrt zur Anmeldung zurück.

*Prüfkriterium:* Ein Aufruf mit einem sieben Tage alten Token wird mit 401 abgewiesen. Ein Einmalticket, das nach 91 Sekunden eingelöst wird, wird abgewiesen.

*Stand:* Abmelden löscht das Token nur im Browser; ein kopiertes Token bleibt bis zum Ablauf gültig (R-02).

**NFR-15a-03: SSO ohne Passwortübertragung.** Bei der SSO-Anmeldung wird das Passwort der Sparkasse ausschließlich beim Identity Provider eingegeben. NextTask erhält Autorisierungscode und ID-Token; es prüft Signatur, Aussteller, Zielgruppe, Nonce und Ablauf und verwendet PKCE (CON-03, [S1.3](S1-nachbarsysteme.md#s13-nb-02--identity-provider-der-sparkasse-openid-connect)).

*Prüfkriterium:* In der Netzwerkaufzeichnung des Browsers geht keine Anfrage mit dem Passwort an NextTask. Ein ID-Token mit falscher Nonce oder abgelaufener Gültigkeit wird abgewiesen und als `SSO_LOGIN_FAILED` protokolliert.

### 15b. Integrität

**NFR-15b-01: Verschlüsselte Geheimnisse.** TOTP-Geheimnisse und Kalender-Dauerzugriffe liegen in der Datenbank nur verschlüsselt vor (AES-256-GCM mit einem aus dem Serverschlüssel abgeleiteten Schlüssel, [D2.1](D2-datentypen.md#d21-typkatalog)). Wiederherstellungscodes und SSO-Einmaltickets liegen nur als Hash vor.

*Prüfkriterium:* Die Spalten `User.twoFactorSecret` und `User.calendarRefreshToken` enthalten ausschließlich Werte mit dem Präfix `v1:`; `User.twoFactorRecoveryCodes` und `SsoLoginTicket.tokenHash` enthalten keinen Wert, mit dem sich anmelden lässt.

**NFR-15b-02: Passwort-Hashing.** Passwörter werden mit bcrypt (Kostenfaktor 10) gehasht; der Klartext wird nie gespeichert oder protokolliert. Beim Ändern gilt eine Mindestlänge von acht Zeichen.

*Prüfkriterium:* `User.password` enthält nur bcrypt-Hashes. Ein neues Passwort mit sieben Zeichen wird in UC-05 abgelehnt.

*Stand:* Bei der Registrierung (UC-01) und beim Anlegen durch Administratoren (UC-22) gilt keine Mindestlänge.

**NFR-15b-03: Keine Geheimnisse im Audit-Log.** Felder mit den Namen `password` und `token` werden vor dem Schreiben aus Vorher-, Nachher- und Zusatzdaten entfernt ([AF-07](F3-anwendungsfunktionen.md#af-07--audit-eintrag-mit-differenz-schreiben)).

*Prüfkriterium:* Nach Registrierung, Passwortänderung und Anlegen eines Benutzers enthält kein Audit-Eintrag ein Feld `password` oder `token`.

### 15c. Datenschutz

**NFR-15c-01: Datensparsamkeit.** NextTask verarbeitet nur Daten, die für die Projektsteuerung nötig sind: Name, E-Mail, Abteilung, Rolle, Aufgaben- und Projektdaten. Keine Kundendaten, keine Kontodaten (NG-05). Für Nachweiszwecke werden IP-Adresse und Browserkennung je Audit-Eintrag gespeichert.

*Prüfkriterium:* Das Datenmodell in [D1](D1-datenmodell.md) enthält keine Entität und kein Attribut mit Kundenbezug. Ein Löschkonzept für Audit-Einträge ist nicht Teil des Projekts und wäre vor einem Echtbetrieb festzulegen.

### 15d. Nachvollziehbarkeit

**NFR-15d-01: Vollständiger, unveränderlicher Audit-Trail.** Jede der in [N2](N2-querschnittskonzepte.md) aufgeführten Aktionen erzeugt genau einen Audit-Eintrag mit Akteur, Zeitpunkt, Herkunft, Kritikalität und, bei Änderungen, den geänderten Feldern mit altem und neuem Wert. Einträge werden nie geändert oder gelöscht; es gibt keine Schnittstelle dafür.

*Prüfkriterium:* Ein Testlauf über alle 39 Aktionen aus QK-03 erzeugt 39 Einträge; für `TASK_UPDATED` mit geändertem Titel enthält `before` genau den Schlüssel `title` mit altem und neuem Wert. Die Schnittstelle bietet keinen Aufruf zum Ändern oder Löschen von Einträgen.

*Stand:* Das Schreiben des Eintrags bricht die fachliche Aktion bei einem Datenbankfehler nicht ab (AF-07). Ein Eintrag kann also im Fehlerfall fehlen; der Fehler steht dann im Serverprotokoll.

**NFR-15d-02: Zugriff auf das Audit-Log.** Nur Anwender mit der Berechtigung „Rollen verwalten" können das Audit-Log lesen; der Server prüft das bei jedem Aufruf ([AF-01](F3-anwendungsfunktionen.md#af-01--berechtigung-prüfen)).

*Prüfkriterium:* Ein Aufruf des Audit-Logs mit dem Token eines Mitarbeiters ohne diese Berechtigung antwortet mit 403.

---

## 16. Kulturelle Anforderungen

*Keine über NFR-11b-01 hinaus.* Datumsformat ist wählbar (numerisch oder ausgeschrieben), Beträge in Euro.

---

## 17. Rechtliche und normative Anforderungen

### 17a. Gesetzliche Anforderungen

*Nicht anwendbar im Studienprojekt.* Vor einem Echtbetrieb wären DSGVO (Aufbewahrung der Audit-Daten, Auskunft, Löschung) und die bankaufsichtlichen Anforderungen an die IT (BAIT) zu prüfen; NextTask bringt mit Rollenkonzept, Vier-Augen-Prinzip und Audit-Trail die Grundlagen dafür mit, ist aber nicht darauf geprüft.

### 17b. Normen und Standards

**NFR-17b-01: Standards für Anmeldung und zweiten Faktor.** Die SSO-Anbindung folgt OpenID Connect Core 1.0 mit Authorization Code Flow und PKCE (RFC 7636); der zweite Faktor folgt RFC 6238 (TOTP) mit SHA-1, sechs Ziffern, 30 Sekunden, sodass gängige Authenticator-Apps ohne Anpassung funktionieren.

*Prüfkriterium:* Die Einrichtung des zweiten Faktors gelingt mit mindestens zwei verschiedenen Authenticator-Apps; die SSO-Anmeldung gelingt gegen einen standardkonformen Provider (z. B. Keycloak) allein über dessen Discovery-Dokument.

---

## Querverweise

| Baustein | Bezug zu N1 |
|----------|-------------|
| [P1](P1-ziele-rahmenbedingungen.md) | Ziele G-05, G-06; Rahmenbedingungen; Risiken R-02, R-03. |
| [F2](F2-anwendungsfaelle.md) | Zeile „Qualitäten" je Anwendungsfall. |
| [F3](F3-anwendungsfunktionen.md) | AF-01, AF-06, AF-07 setzen die Sicherheitsanforderungen um. |
| [N2](N2-querschnittskonzepte.md) | Liste der protokollierten Aktionen; Sitzung; Geheimnisse. |
| [S1](S1-nachbarsysteme.md), [S3](S3-inbetriebnahme.md) | Nachbarsysteme und Konfiguration. |
