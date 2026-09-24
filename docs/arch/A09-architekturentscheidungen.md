# 9 Architekturentscheidungen

Die fünf Entscheidungen, die die Struktur von NextTask festlegen. Je Entscheidung: Kontext, betrachtete Optionen, Entscheidung, Begründung, Konsequenzen. Der ausführliche Variantenvergleich steht unter [`adr/`](../../adr/).

| ADR | Entscheidung | Betrifft | Status |
|-----|--------------|----------|--------|
| [ADR-001](#adr-001-getrennte-browser-anwendung-und-rest-api) | Getrennte Browser-Anwendung und REST-API | Grundstruktur | angenommen |
| [ADR-002](#adr-002-javascript-durchgängig-react-im-browser-express-auf-dem-server) | JavaScript durchgängig: React im Browser, Express auf dem Server | Sprache, Frameworks | angenommen |
| [ADR-003](#adr-003-postgresql-mit-prisma-als-persistenz) | PostgreSQL mit Prisma als Persistenz | Datenhaltung | angenommen |
| [ADR-004](#adr-004-zustandslose-anmeldung-mit-jwt-totp-und-openid-connect) | Zustandslose Anmeldung mit JWT, TOTP und OpenID Connect | Authentifizierung | angenommen |
| [ADR-005](#adr-005-statusbericht-als-pdf-im-browser-erzeugen) | Statusbericht als PDF im Browser erzeugen | Druckausgabe | angenommen |

---

## ADR-001: Getrennte Browser-Anwendung und REST-API

**Status:** angenommen (Projektstart, April 2026).

**Kontext.** NextTask braucht eine Oberfläche mit Kanban-Board, Kalender mit Ziehen von Karten, mehrreitrigen Dialogen und einer PDF-Erzeugung. Sechs Studierende arbeiten parallel, mit getrennten Rollen für Entwicklung und Architektur. Die Frage war, ob Oberfläche und Server eine Anwendung bilden oder zwei.

**Optionen**

| Option | Beschreibung | Vorteile | Nachteile |
|--------|--------------|----------|-----------|
| **A: Serverseitig gerenderte Seiten** | Express mit Template-Engine (EJS, Handlebars), Formulare, wenig JavaScript im Browser. | Ein Prozess, eine Adresse, Session-Cookie, kein CORS. | Board, Kalender und Dialoge brauchen viel Browserlogik; Template-Engine und Browsercode wachsen nebeneinander; parallele Arbeit an Oberfläche und Server behindert sich. |
| **B: Full-Stack-Framework** | Next.js oder Remix: React-Seiten und API-Routen in einem Projekt, serverseitiges Rendering. | Eine Codebasis, gemeinsames Routing, Rendering auf dem Server. | Framework-Konventionen für Datenladen und Rendering müssen gelernt werden; Server-Komponenten und Client-Komponenten mischen sich; für eine interne Anwendung ohne SEO-Bedarf kein Nutzen aus dem Server-Rendering. |
| **C: SPA und REST-API** | React-Anwendung als eigenständiges Vite-Projekt, Express-Server mit JSON-Schnittstelle unter `/api`. | Klare Grenze: Oberfläche und Server sind getrennt entwickel- und testbar; die Schnittstelle ist für andere Clients nutzbar; das Frontend ist ein statisches Bauartefakt. | Zwei Prozesse, zwei Ursprünge (CORS), Authentifizierung per Token statt Cookie, Serveradresse muss im Browser bekannt sein. |

**Entscheidung.** Option C. Die Optionen A und B wurden nicht als Hauptlösung verfolgt; die Trennung von Oberfläche und Server war für das Team von Beginn an gesetzt.

**Begründung.** Die Trennung erlaubt, Benutzeroberfläche, Geschäftslogik und Schnittstelle getrennt zu entwickeln und zu warten, und erleichtert die Aufgabenverteilung im Team: Teammitglieder arbeiten an Masken, während andere Routen bauen, jede Seite mit ihrer eigenen Werkzeugkette. Die Oberfläche ist zudem der größere Teil des Systems (16.000 gegen 4.900 Zeilen) und lebt von Interaktion, die nur im Browser stattfindet; Server-Rendering hätte dafür keinen Wert. Und die Struktur passt zu einem System, das später erweitert, betrieben und möglicherweise an einen Kunden wie die Sparkasse gegeben werden soll: eine Schnittstelle mit klarem Vertrag lässt sich unabhängig von der Oberfläche prüfen und weitergeben. Die Kosten (CORS, Token, feste Adresse) sind bekannt und in [Kapitel 3.2](A03-kontextabgrenzung.md#32-technischer-kontext) benannt.

**Konsequenzen.** JWT statt Session ([ADR-004](#adr-004-zustandslose-anmeldung-mit-jwt-totp-und-openid-connect)). `cors()` ohne Einschränkung in der Entwicklung. Serveradresse fest in `api/axios.js` (TECH-10), für einen Betrieb außerhalb der Entwicklung zu ändern ([7.2](A07-verteilungssicht.md#72-zielbild-für-einen-betrieb-durch-die-sparkassen-it)). Die Schnittstelle ist auch ohne Oberfläche nutzbar, was in der Entwicklung dazu geführt hat, dass Serverfunktionen vor ihrer Anbindung existieren (R-01). Ausführlich: [`adr/001-spa-und-rest-api.md`](../../adr/001-spa-und-rest-api.md).

---

## ADR-002: JavaScript durchgängig: React im Browser, Express auf dem Server

**Status:** angenommen (Projektstart).

**Kontext.** Nach ADR-001 brauchen beide Seiten eine Sprache und ein Framework. Das Team hat sechs Personen mit unterschiedlicher Vorerfahrung und ein Semester Zeit; die Vorlesung gibt keinen Stack vor, das Beispielprojekt des Dozenten nutzt PHP mit Laravel und Vue.

**Optionen**

| Option | Beschreibung | Vorteile | Nachteile |
|--------|--------------|----------|-----------|
| **A: Java mit Spring Boot, Oberfläche mit Angular oder React** | Typisierte Serversprache, verbreitet in Banken. | Nähe zur Zielumgebung Sparkasse; starke Typisierung; Spring Security für Anmeldung. | Zwei Sprachen und zwei Werkzeugketten; hoher Einstiegsaufwand; langsamer Entwicklungszyklus. |
| **B: PHP mit Laravel und Vue (wie das Beispielprojekt)** | Monolith mit Inertia, Eloquent, eingebauter Auth. | Vorlage vorhanden; viel Framework-Unterstützung. | Verlangt die Monolith-Struktur, die ADR-001 verworfen hat; PHP-Kenntnisse im Team gering. |
| **C: JavaScript mit React und Express** | Eine Sprache, npm auf beiden Seiten, minimalistisches Serverframework. | Ein Werkzeug für alle; wer eine Seite kennt, kann die andere lesen; große Auswahl an Bibliotheken; schnelle Iteration mit Vite und nodemon. | Keine statische Typisierung (Fehler erst zur Laufzeit); Express gibt keine Struktur vor, das Team muss eigene Konventionen setzen. |
| **D: TypeScript statt JavaScript** | Wie C, mit Typen. | Fehler zur Übersetzungszeit; Prisma liefert typisierte Clients. | Übersetzungsschritt auf dem Server; zusätzlicher Lernaufwand; Typdefinitionen für React-Komponenten. |

**Entscheidung.** Option C. Option D wurde nicht gewählt.

**Begründung.** Im Team war wenig Erfahrung mit PHP vorhanden, mit JavaScript und React dagegen genug, um deutlich effizienter zu arbeiten; Option B schied damit aus, obwohl die Vorlage sie nahegelegt hätte. Da die Oberfläche mit React entsteht, war es folgerichtig, auch den Server im selben Ökosystem zu halten: eine Sprache, ein Paketmanager, dieselbe Denkweise in Funktionen, Promises und JSON ([QZ-05](A01-einfuehrung-und-ziele.md#12-qualitätsziele)); wer die Masken baut, kann die Routen lesen und umgekehrt. Express ist klein genug, dass die Routenmodule ohne Framework-Magie verständlich bleiben; die fehlende Struktur ersetzen die Konventionen CONV-06 und CONV-07. Auf TypeScript wurde verzichtet, um die Entwicklung schlank zu halten und schneller produktiv zu werden; für den Projektumfang reichte JavaScript ohne die zusätzliche Komplexität durch Typisierung und Konfiguration. Der Preis, Fehler erst zur Laufzeit zu sehen, wird durch die Normalisierung in [8.6](A08-querschnittliche-konzepte.md#86-validierung-und-normalisierung) und durch Prisma-Enums an der Datenbank teilweise abgefangen.

**Konsequenzen.** Server als CommonJS, Browser als ES-Module. Keine Schichtenarchitektur auf dem Server; Routen rufen Prisma direkt ([5.2.2](A05-bausteinsicht.md#522-whitebox-api-server)). Enum-Werte auf beiden Seiten als Zeichenketten, Wahrheit beim Server. Ausführlich: [`adr/002-javascript-react-express.md`](../../adr/002-javascript-react-express.md).

---

## ADR-003: PostgreSQL mit Prisma als Persistenz

**Status:** angenommen (Projektstart; bestätigt mit den August-Migrationen).

**Kontext.** Das Datenmodell ist relational mit vielen Beziehungen und Löschregeln (D1.6), enthält Listen (Geschäftsbereiche, Abteilungen, Wiederherstellungscodes) und freie Strukturen (Berechtigungen, Audit-Differenzen). Sechs Personen brauchen denselben Datenstand; eine Datei je Entwicklungsrechner reicht nicht.

**Optionen**

| Option | Beschreibung | Vorteile | Nachteile |
|--------|--------------|----------|-----------|
| **A: SQLite** (wie das Beispielprojekt) | Eingebettete Datei, kein Server. | Keine Installation, keine Zugangsdaten. | Je Rechner ein eigener Datenstand; keine Arrays und Enums als Typen; schwach bei parallelen Schreibzugriffen; für eine Mehrbenutzeranwendung untypisch. |
| **B: MongoDB** | Dokumentdatenbank, JSON-nahe Speicherung. | Berechtigungen und Audit-Differenzen passen natürlich; Mongoose verbreitet im JavaScript-Umfeld. | Beziehungen, Fremdschlüssel und Löschregeln müssen im Code nachgebaut werden; Eindeutigkeiten über mehrere Felder umständlich; Revisionssicherheit schwerer zu argumentieren. |
| **C: PostgreSQL mit Prisma** | Relationale Datenbank mit Enums, Arrays, JSON; Schema-zuerst-ORM mit Migrationen. | Alle D1-Konstrukte nativ; gemeinsame entfernte Instanz möglich; Migrationen versioniert; generierter Client mit Autovervollständigung. | Datenbankserver nötig (lokal oder Anbieter); zusätzlicher Schritt `prisma generate`; Prisma-Versionssprünge. |
| **D: PostgreSQL mit SQL-Bibliothek** (`pg`, knex) | Wie C ohne ORM. | Volle Kontrolle über SQL; keine Generierung. | Migrationen und Mapping selbst schreiben; mehr Code je Handler; keine Typen für Ergebnisse. |

**Entscheidung.** Option C.

**Begründung.** Die Datenbank läuft als entfernte Instanz, auf die das ganze Team zugreift. Das war der ausschlaggebende Punkt: Alle arbeiten mit demselben Datenstand und testen Funktionen unter vergleichbaren Bedingungen, statt dass jeder Rechner seinen eigenen Stand hat. Mit Blick auf einen späteren produktiven Einsatz ist eine zentrale Datenbank zudem konsistenter, besser wartbar und näher an einer realen Betriebsumgebung als lokale Einzelstände. Dazu kommt das Datenmodell: D1 verwendet Arrays, JSON, Enums, zusammengesetzte Eindeutigkeiten und Kaskaden; PostgreSQL bildet das direkt ab, SQLite und MongoDB nur mit Umwegen. Prisma macht das Schema zur einzigen Wahrheit und erzeugt die Migrationen; die 14 Migrationen dokumentieren zugleich das Wachstum des Systems ([8.1](A08-querschnittliche-konzepte.md#81-domänenmodell-und-persistenz)).

**Konsequenzen.** `DATABASE_URL` als einzige Datenbankkonfiguration. `prisma migrate deploy` und `prisma generate` als Schritte der Inbetriebnahme (ORG-06); `prisma/seed.js` (`npm run db:seed`) lädt die Beispieldaten aus `client/src/data/` per `upsert` in die Datenbank, nur für Entwicklung und Test. Enums an der Datenbank erzwingen die Wertebereiche aus D2, wo sie als Enum modelliert sind; Textfelder tun es nicht (R-06). Ausführlich: [`adr/003-postgresql-prisma.md`](../../adr/003-postgresql-prisma.md).

---

## ADR-004: Zustandslose Anmeldung mit JWT, TOTP und OpenID Connect

**Status:** angenommen (JWT bei Projektstart; TOTP und OIDC im August 2026).

**Kontext.** ADR-001 trennt Browser und Server auf zwei Ursprünge. Die Sparkasse erwartet einen zweiten Faktor für lokale Konten und eine Anbindung an ihr SSO (G-06, CON-03). Drei zusammenhängende Fragen: Wie wird die Sitzung geführt, wie wird der zweite Faktor umgesetzt, wie das SSO.

**Optionen**

| Frage | Option | Vorteile | Nachteile |
|-------|--------|----------|-----------|
| Sitzung | **A: Session-Cookie** (`express-session` mit Speicher in PostgreSQL) | Widerruf beim Abmelden; `HttpOnly`-Cookie für Skripte unsichtbar. | Cookie über zwei Ursprünge braucht `SameSite`/`credentials`-Konfiguration; Session-Speicher als weitere Tabelle; Server nicht mehr zustandslos. |
| | **B: JWT im Local Storage** | Zustandsloser Server; jede Anfrage trägt alles; einfache Übergabe aus Umleitungen (SSO, Kalender). | Kein Widerruf vor Ablauf; Token für Skripte lesbar; Rollen im Token veralten. |
| Zweiter Faktor | **C: Bibliothek** (`otplib`, `speakeasy`) | Geprüfte Implementierung; weniger Code. | Abhängigkeit; Verschlüsselung des Geheimnisses und Wiederholungsschutz trotzdem selbst zu bauen. |
| | **D: Eigene Umsetzung mit `crypto`** | Keine Abhängigkeit; Verschlüsselung, Zeitschritt-Merker und Wiederherstellungscodes in einem Modul. | Sicherheitskritischer Code im eigenen Repository; Fehler fallen erst beim Test mit echten Apps auf. |
| SSO | **E: Bibliothek** (`openid-client`, `passport-openidconnect`) | Discovery, PKCE, Token-Prüfung fertig. | Passport passt zum Session-Modell, nicht zu JWT; `openid-client` bringt eigenes Konfigurationsmodell. |
| | **F: Eigene Umsetzung mit `fetch` und `jsonwebtoken`** | Passt genau zum Ticket-Modell (Rückleitung ohne Token); alle Konfiguration in `.env`. | Standardkonformität selbst sicherzustellen; keine Unterstützung für SAML. |

**Entscheidung.** B, D und F.

**Begründung.** Mit zwei Ursprüngen ist ein Token, das der Browser selbst mitsendet, der geradlinige Weg; Umleitungen von Identity Provider und Google können ihn über einen Einmalcode einlösen, ohne dass ein Cookie gesetzt sein muss. Der Server bleibt zustandslos und könnte mehrfach laufen ([7.2](A07-verteilungssicht.md#72-zielbild-für-einen-betrieb-durch-die-sparkassen-it)). Berechtigungen werden trotzdem je Anfrage aus der Datenbank gelesen, damit das Veralten des Tokens keine Sicherheitslücke ist ([8.3](A08-querschnittliche-konzepte.md#83-berechtigungen)). Die eigenen Umsetzungen von TOTP und OIDC wurden gewählt, damit die Anmeldeabläufe nachvollziehbar, kontrollierbar und anpassbar bleiben. Bei einem sicherheitsrelevanten Anwendungsfall will das Team genau verstehen, wie Anmeldung, zweiter Faktor und externer Identitätsanbieter zusammenspielen; das lässt sich so besser prüfen, dokumentieren und bei Bedarf gezielt an die Anforderungen eines späteren Kunden wie der Sparkasse anpassen, etwa an dessen Claims oder Gruppenmodell. Beide Umsetzungen folgen den Standards (RFC 6238, OpenID Connect Core mit PKCE) und halten die Geheimnisbehandlung in einem Modul.

**Konsequenzen.** Kein Widerruf (R-02, [NFR-15a-02](../spec/N1-nichtfunktional.md)); Abmelden ist ein Browservorgang. Token im Local Storage, damit Anfälligkeit gegen eingeschleusten Code, akzeptiert für eine interne Anwendung ohne fremde Inhalte. Challenge-Token als Zwischenschritt ([6.1](A06-laufzeitsicht.md#61-anmeldung-mit-passwort-und-zweitem-faktor)). Kein SAML. Ausführlich: [`adr/004-jwt-totp-oidc.md`](../../adr/004-jwt-totp-oidc.md).

---

## ADR-005: Statusbericht als PDF im Browser erzeugen

**Status:** angenommen (August 2026, mit der Berichtsbasis).

**Kontext.** Der Statusbericht (DR-01) muss als dreiseitiges PDF im Formular der Sparkasse vorliegen, mit Ampelsymbolen, Risikograph als Grafik und Unterschriftenzeile. Die Berichtsbasis liegt zu diesem Zeitpunkt in der Maske „Projekte" im Browser (R-01).

**Optionen**

| Option | Beschreibung | Vorteile | Nachteile |
|--------|--------------|----------|-----------|
| **A: Server mit Headless-Browser** (Puppeteer) | Server rendert HTML in Chromium und liefert PDF. | Text bleibt Text (durchsuchbar, kopierbar); exakte Schriftdarstellung; eine Quelle für Vorschau und PDF. | Chromium-Binärdatei (mehrere hundert MB) auf dem Server; Speicherbedarf; Serverdaten müssten vorhanden sein, die derzeit nur im Browser liegen. |
| **B: Server mit PDF-Bibliothek** (PDFKit, pdfmake) | Bericht aus Zeichenbefehlen aufgebaut. | Kleines PDF, Text bleibt Text. | Layout doppelt gepflegt (HTML-Vorschau und PDF-Code); Risikograph und Symbole als Zeichenbefehle nachbauen. |
| **C: Browser mit `html2canvas` und `jsPDF`** | Vorschau-HTML wird seitenweise gerastert und als Bilder in ein PDF gelegt. | Vorschau und PDF sind dieselbe HTML-Vorlage; keine Serverbeteiligung; funktioniert mit den Daten im Browser. | Seiten sind Bilder: kein Textmarkieren, keine Suche, größere Datei; Schriftdarstellung hängt vom Browser ab; feste drei Seiten. |
| **D: Druckstylesheet und „Als PDF drucken"** | `@media print` und der Druckdialog des Browsers. | Kein Code für die Erzeugung. | Dateiname, Seitenzahl und Kopfzeilen nicht steuerbar; Ergebnis je Browser verschieden; kein Download-Knopf. |

**Entscheidung.** Option C.

**Begründung.** Im Vordergrund stand, dass das PDF zuverlässig erzeugt wird, alle relevanten Inhalte vollständig enthält und optisch sauber dem Formular entspricht. Die HTML-Vorlage in `utils/reportExport.js` ist zugleich die Vorschau (`StatusReportPreview`); ein zweites Layout wäre doppelte Pflege und ein Risiko für die Darstellung. Die Erzeugung braucht keinen Server, was zur aktuellen Datenlage passt und den Server frei von einer Chromium-Abhängigkeit hält. Das PDF ist als Export- und Nachweisdokument vorgesehen, das ausgedruckt oder als Anhang verteilt wird; Durchsuchbarkeit und Markierbarkeit waren keine Anforderung, Korrektheit, Vollständigkeit und Darstellung wogen schwerer.

**Konsequenzen.** `html2canvas` und `jspdf` als Abhängigkeiten der Browser-Anwendung. Bericht immer dreiseitig, auch bei leeren Listen (B3). Fünf Erläuterungszeilen kommen aus dem Ampelwert statt aus den Notizfeldern (B3, Hinweis); das ist eine Lücke der Vorlage, nicht der Entscheidung. Die Berichtsbasis ist seit dem 23. September an den Server angebunden; die Erzeugung ist im Browser geblieben, nur die Datenquelle hat gewechselt. Der später hinzugekommene Abteilungsbericht (DR-02) folgt derselben Entscheidung, zeichnet das PDF aber direkt mit jsPDF statt über `html2canvas`, weil er keine Vorschau hat und beliebig lang wird; die Datei bleibt dadurch durchsuchbar. Ausführlich: [`adr/005-pdf-im-browser.md`](../../adr/005-pdf-im-browser.md).
