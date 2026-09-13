# ADR-002: JavaScript durchgängig — Variantenvergleich

Kurzfassung in [`docs/arch/A09-architekturentscheidungen.md`](../docs/arch/A09-architekturentscheidungen.md#adr-002-javascript-durchgängig-react-im-browser-express-auf-dem-server).

## Kontext

Nach [ADR-001](001-spa-und-rest-api.md) gibt es eine Browser-Anwendung und einen Server. Beide brauchen Sprache und Framework. Randbedingungen: sechs Studierende mit gemischter Vorerfahrung, ein Semester, keine Stack-Vorgabe der Vorlesung. Das Beispielprojekt des Dozenten verwendet PHP mit Laravel, Inertia und Vue. Die Zielumgebung Sparkasse würde bei einer Übernahme eher Java erwarten, ist aber kein Auftraggeber (ORG-02).

Die Teamvereinbarung in `TEAMINFO.md` hat den Stack früh festgelegt: JavaScript, React, Express, PostgreSQL mit Prisma, Vite, Tailwind, JWT.

---

## Option A: Java mit Spring Boot, Oberfläche mit React oder Angular

**Vorteile**
- Verbreitet in Banken; eine Übernahme durch die Sparkassen-IT wäre naheliegend.
- Statische Typisierung; Spring Security bringt Anmeldung, Sessions und OAuth-Client mit.
- Reife Werkzeuge für Tests und Build.

**Nachteile**
- Zwei Sprachen (Java, JavaScript) und zwei Werkzeugketten (Maven oder Gradle, npm); jedes Teammitglied muss beide beherrschen oder wird auf eine Seite festgelegt.
- Hoher Fixaufwand für Projektaufbau, Konfiguration und Kompilierzyklen; für ein Semester mit Spezifikation und Architektur als weiteren Abgaben zu viel.
- Spring-Konventionen (Beans, Annotationen, Profile) sind für Einsteiger schwer zu durchschauen; Fehler in der Konfiguration kosten Tage.

---

## Option B: PHP mit Laravel und Vue (wie das Beispielprojekt)

**Vorteile**
- Vorlage mit Struktur und Dokumentation vorhanden.
- Laravel bringt Auth, Migrationen, Validierung, Mail und Queue mit.

**Nachteile**
- Laravel mit Inertia ist ein Monolith mit Server-Routing; das widerspricht ADR-001.
- PHP-Kenntnisse im Team gering; die Nähe zur Vorlage hätte zum Kopieren verleitet statt zum Verstehen.
- Zwei Sprachen (PHP, JavaScript).

---

## Option C: JavaScript mit React und Express

**Vorteile**
- Eine Sprache, ein Paketmanager, eine Denkweise (Funktionen, Promises, JSON) auf beiden Seiten. Wer eine Maske geschrieben hat, kann eine Route lesen.
- React ist die verbreitetste Oberflächenbibliothek; Vorwissen und Beispiele sind leicht verfügbar.
- Express ist klein: Eine Route ist eine Funktion mit `req` und `res`; nichts ist versteckt.
- Schnelle Iteration: Vite mit Hot Module Replacement, nodemon mit Neustart.
- Prisma, nodemailer, jsonwebtoken, bcryptjs decken die Serverbedürfnisse mit kleinen, bekannten Paketen ab.

**Nachteile**
- Keine statische Typisierung; Tippfehler in Feldnamen fallen erst zur Laufzeit auf.
- Express gibt keine Struktur vor; Schichten, Validierung und Fehlerbehandlung muss das Team selbst vereinbaren (CONV-06, CONV-07, [A08 8.5, 8.6](../docs/arch/A08-querschnittliche-konzepte.md)).
- Bei einer Übernahme durch die Sparkasse müsste die IT einen Node-Betrieb bereitstellen.

---

## Option D: TypeScript statt JavaScript

Wie Option C, aber mit Typen auf beiden Seiten.

**Vorteile**
- Fehler zur Übersetzungszeit; Prisma erzeugt vollständige Typen für Modelle und Abfragen.
- Selbstdokumentierende Schnittstellen zwischen Modulen.

**Nachteile**
- Übersetzungsschritt auf dem Server (tsc oder ts-node); Typdefinitionen für React-Komponenten und Props.
- Für Teammitglieder ohne TypeScript-Erfahrung ein zusätzlicher Lerngegenstand parallel zu React und Express.
- Der Vorteil wächst mit der Projektgröße; bei rund 20.000 Zeilen und einem Semester wurde er als geringer eingeschätzt als der Einstiegsaufwand.

---

## Entscheidung: Option C

## Begründung

1. Im Team war wenig Erfahrung mit PHP vorhanden; mit JavaScript und React konnte es deutlich effizienter arbeiten. Option B schied damit aus, obwohl die Vorlage des Dozenten sie nahegelegt hätte. Ein Stack, in dem alle mitarbeiten können, ist für ein Studienteam die Voraussetzung für Beteiligung, die auch bewertet wird (QZ-05).
2. Da die Oberfläche mit React entsteht, war es sinnvoll, mit dem Server möglichst nah an diesem Ökosystem zu bleiben: dieselbe Sprache, derselbe Paketmanager, dieselben Bibliothekskonventionen.
3. Express passt zu ADR-001: eine JSON-Schnittstelle ohne Rendering, ohne Framework-Konventionen, die es nicht braucht.
4. React deckt die interaktiven Masken ab (Board, Kalender, Editor) und hat mit `@dnd-kit`, `html2canvas`, `jspdf` Bibliotheken für die besonderen Anforderungen.
5. Auf TypeScript wurde verzichtet, um die Entwicklung schlank zu halten und schneller produktiv zu werden. Für den aktuellen Projektumfang war JavaScript ausreichend, ohne zusätzliche Komplexität durch Typisierung und Konfiguration. TypeScript bleibt ein möglicher späterer Schritt: Prisma liefert die Typen bereits, und Vite unterstützt `.tsx` ohne Umbau.

## Konsequenzen

- Server in CommonJS (`require`), Browser in ES-Modulen (`import`); zwei Modulwelten im selben Repository.
- Fehlende Typen werden durch Normalisierung an der Schnittstelle ([A08 8.6](../docs/arch/A08-querschnittliche-konzepte.md#86-validierung-und-normalisierung)) und Enums an der Datenbank ([ADR-003](003-postgresql-prisma.md)) teilweise kompensiert.
- Konventionen für Routen- und Hilfsmodule (CONV-06) und Masken (CONV-07) ersetzen die Struktur, die ein größeres Framework vorgeben würde.
- Keine Tests im Repository; das ist keine Folge der Sprachwahl, sondern eine offene Aufgabe (Test-Lead).
