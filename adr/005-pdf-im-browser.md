# ADR-005: Statusbericht als PDF im Browser erzeugen — Variantenvergleich

Kurzfassung in [`docs/arch/A09-architekturentscheidungen.md`](../docs/arch/A09-architekturentscheidungen.md#adr-005-statusbericht-als-pdf-im-browser-erzeugen).

## Kontext

Der Projektstatusbericht ([DR-01](../docs/spec/B3-druckausgaben.md#dr-01--projektstatusbericht)) folgt einem Formular der Sparkasse: drei Seiten DIN A4 mit Kopf und Marke, Stammdatentabelle, fünf Ampelzeilen mit Symbolen, Erläuterungen, Meilensteintabelle, Ressourcen, Risikotabelle, Risikograph als farbiges Raster mit Markierungen, Budgettabelle, drei Unterschriftenlinien, Seitenzähler. Das Layout ist fest; Abweichungen fallen dem Empfänger auf.

Zum Zeitpunkt der Entscheidung (August 2026) liegen Projekte und Berichtsbasis in der Maske „Projekte" im Browser; die Serverschnittstelle für Projekte existiert, ist aber nicht angebunden (R-01). Die Maske „Reports" zeigt eine Vorschau des Berichts als HTML.

---

## Option A: Server mit Headless-Browser (Puppeteer, Playwright)

Der Server rendert die HTML-Vorlage in Chromium und liefert `page.pdf()`.

**Vorteile**
- Text bleibt Text: durchsuchbar, kopierbar, kleine Datei.
- Schriftdarstellung und Seitenumbrüche sind auf dem Server reproduzierbar.
- Eine Vorlage für Vorschau und PDF, wenn der Server dasselbe HTML rendert.

**Nachteile**
- Chromium als Abhängigkeit des Servers: mehrere hundert Megabyte, Startzeit, Speicher; auf kostenfreien Hostings oft nicht möglich.
- Der Server müsste die Berichtsdaten haben; sie liegen im Browser. Entweder erst die Anbindung (R-01) oder die Daten mit der Anfrage hochladen.
- Ein weiterer Nachbar im Betrieb (Browser-Binärdatei aktuell halten).

---

## Option B: Server mit PDF-Bibliothek (PDFKit, pdfmake)

Der Bericht wird aus Zeichen- und Textbefehlen aufgebaut.

**Vorteile**
- Kleines PDF, Text bleibt Text, keine Browser-Abhängigkeit.

**Nachteile**
- Zwei Layouts pflegen: die HTML-Vorschau und der PDF-Code. Jede Änderung am Formular zweimal.
- Risikograph (Raster mit drei Farbflächen, Achsen, Markierungen) und Ampelsymbole als Zeichenbefehle nachbauen; Tabellen mit Umbrüchen von Hand.
- Dieselbe Datenfrage wie Option A.

---

## Option C: Browser mit `html2canvas` und `jsPDF`

`utils/reportExport.js` baut eine vollständige HTML-Seite mit eingebettetem CSS (`@page { size: A4 }`, `section.report-page` mit 210 × 297 mm), lädt sie in ein verstecktes `<iframe>`, rastert jede Sektion mit `html2canvas` und legt die Bilder mit `jsPDF` auf drei A4-Seiten. Dateiname `statusbericht-<projekt>.pdf`.

**Vorteile**
- Vorschau und PDF sind dieselbe Vorlage; das Formular wird einmal in HTML und CSS gepflegt, inklusive Risikograph als SVG.
- Kein Server beteiligt; funktioniert mit den Daten, die die Maske hat; kein Upload, keine zusätzliche Route.
- Bibliotheken sind klein und ohne native Abhängigkeiten.
- Der Anwender bekommt einen Download-Knopf mit festem Dateinamen.

**Nachteile**
- Jede Seite ist ein Bild: kein Markieren, keine Suche, keine Barrierefreiheit; Dateigröße im Megabytebereich.
- Schriftdarstellung und Rasterung hängen vom Browser ab; das PDF kann sich zwischen Chrome und Firefox minimal unterscheiden.
- Feste drei Seiten; lange Meilenstein- oder Risikolisten laufen über den Seitenrand statt umzubrechen.
- Rasterung dauert je nach Rechner mehrere Sekunden.

---

## Option D: Druckstylesheet und Druckdialog des Browsers

`@media print` für die Vorschau; der Anwender wählt „Als PDF speichern".

**Vorteile**
- Kein Code für die Erzeugung; Text bleibt Text.

**Nachteile**
- Dateiname, Ränder, Kopf- und Fußzeilen des Browsers und die Seitenzahl „Seite x von 3" sind nicht steuerbar.
- Das Ergebnis unterscheidet sich je Browser und Betriebssystem stärker als bei Option C.
- Kein Download-Knopf; der Ablauf ist für Anwender weniger klar.

---

## Entscheidung: Option C

## Begründung

1. Im Vordergrund stand, dass das PDF zuverlässig erzeugt wird, alle relevanten Inhalte vollständig enthält und optisch sauber dargestellt wird. Eine Vorlage in HTML und CSS, die gleichzeitig Vorschau und Druckbild ist, hält das Formular an einer Stelle richtig; was in der Vorschau stimmt, stimmt im PDF.
2. Die Datenlage (R-01) macht Serveroptionen zum Zeitpunkt der Entscheidung teuer; Option C funktioniert sofort und bleibt gültig, wenn die Berichtsbasis später vom Server kommt.
3. Der Server bleibt ein schlanker Node-Prozess ohne Chromium ([QZ-05](../docs/arch/A01-einfuehrung-und-ziele.md#12-qualitätsziele)).
4. Das PDF ist als Export- und Nachweisdokument vorgesehen, das gedruckt oder als Anhang verteilt wird. Durchsuchbarkeit und Markierbarkeit waren keine Anforderung; Korrektheit, Vollständigkeit und Darstellung wogen schwerer ([SC-05](../docs/spec/P1-ziele-rahmenbedingungen.md#p16-erfolgskriterien) verlangt drei Seiten ohne Nachbearbeitung, nicht Text im PDF).

## Konsequenzen

- `html2canvas` und `jspdf` in `client/package.json`.
- Der Bericht ist immer dreiseitig; lange Listen sind eine bekannte Grenze ([B3](../docs/spec/B3-druckausgaben.md), Regeln).
- Fünf Erläuterungszeilen kommen derzeit aus dem Ampelwert statt aus den Notizfeldern des Statusberichts ([B3](../docs/spec/B3-druckausgaben.md), Hinweis). Das ist ein Fehler in der Vorlage, nicht in der Entscheidung, und mit wenigen Zeilen behebbar.
- Wechselt die Datenquelle zum Server, ändert sich nur, woher `ReportsPage` das Projekt bekommt; die Erzeugung bleibt.
- Sollte Durchsuchbarkeit gefordert werden, ist Option A der Weg, mit der Vorlage aus `reportExport.js` unverändert.
