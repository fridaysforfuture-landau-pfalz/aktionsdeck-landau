# Plan Etappe 12: Prüfung und Qualität (Fassung 1, 24.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: Fassung 1 mit Rückfragen.** Geschrieben als Plan für Etappe 11 (Schritt 11.0, Version 0.32.10).
Am 24.10.2026 hat die Person entschieden: Zuerst kommt Etappe 11 „Komfort“ (`docs/PLAN-ETAPPE-11.md`). Diese Prüfung wird **Etappe 12**,
der **letzte Schritt vor Version 1.0**. Darum wurde die Datei in Schritt 11.0 (Version 0.32.11) von `PLAN-ETAPPE-11.md` in `PLAN-ETAPPE-12.md` umbenannt.
Schrittnummern und Versionen sind angepasst. Der Inhalt ist sonst noch Fassung 1. Die Person beantwortet die Rückfragen in Abschnitt 4.
Danach kommt Fassung 2, und erst dann wird gebaut. Alles in den Abschnitten 5 bis 8 ist ein **Vorschlag**.

**Vorher offen:** Etappe 10 ist fertig gebaut. Die Bereitstellung von 10.1 (Tab `Wiki`, `Wiki.gs`) und die Prüfung durch die Person stehen noch aus.
Etappe 12 beginnt mit dem Bauen erst, wenn Etappe 11 fertig gebaut und geprüft ist (Rückfrage 1).
**Wichtig:** Die Prüfung umfasst dann auch alles, was Etappe 11 neu bringt (zum Beispiel Dunkelmodus, Kontostand, Erinnerungen, Sicherung, Export).
Die Ausgangslage in Abschnitt 2 ist der Stand vom 24.10.2026 (vor Etappe 11). Sie wird in Schritt 12.1 neu erhoben.

## 1. Ziel

Die App soll schneller, sicherer und für alle gut benutzbar werden. Neue Funktionen kommen in dieser Etappe nicht dazu. Die Punkte der Person:

1. Den ganzen Code auf **Geschwindigkeit und Leistung** prüfen und verbessern.
2. Den ganzen Code auf **Sicherheitslücken** prüfen und sie schließen.
3. **CSS neu ordnen?** Bisher wurde alles unten angehängt.
4. Ein **Skript, das die Tabs im Sheet sortiert** (nach dem Alphabet oder nach Wichtigkeit).
5. Die App auf **Barrierefreiheit** prüfen und verbessern.
6. **PC beim Rauszoomen:** Die Inhalte bleiben gleich groß, drumherum wird es nur weißer. Die Ansicht soll den Platz nutzen.
7. **App-Icon am Handy größer:** Zurzeit steht ein kleines Icon in einem weißen Kreis. Das Icon soll mit Farbe und Design wie eine richtige App wirken.

## 2. Ausgangslage (im Repo geprüft am 24.10.2026, Version 0.32.9)

`js/config.js` und `sw.js` hatten beide `0.32.9` (nach Pull Request #47), wie `docs/STAND.md`. Mit dem Plan (damals Schritt 11.0) wurde es 0.32.10.

- **Umfang:** 82 JavaScript-Dateien mit zusammen etwa 830 KB, nicht verkleinert. CSS: `css/components.css` hat etwa 89 KB und 3140 Zeilen in 78 Blöcken,
  `css/base.css` und `css/layout.css` sind klein. In `sw.js` (`HUELLE`) stehen 107 Dateien.
- **Laden:** Jeder Reiter wird erst geladen, wenn man ihn öffnet (`js/app.js`, `ladeView`). Der Service Worker (`sw.js`) holt **jede App-Datei zuerst aus dem Netz**
  und nimmt den Zwischenspeicher nur, wenn das Netz fehlt. Bei schlechtem Netz wartet die App darum auf jede einzelne Datei.
  Daten liegen in IndexedDB (`js/cache.js`, `ladeMitCache`): Zuerst erscheint der gemerkte Stand, dann der frische.
- **Skript:** `lies(name)` in `apps-script/Util.gs` liest bei jedem Aufruf den **ganzen Tab** und filtert danach nach Gruppe. Mit wachsenden Tabs wird jeder Aufruf langsamer.
  `listMehrere` liest bis zu 12 Tabs in einem Aufruf.
- **Sicherheit (erster Blick, keine vollständige Prüfung):**
  - Das Token ist mit HMAC signiert (`apps-script/Auth.gs`), es gibt eine Sperre nach 8 Fehlversuchen beim PIN.
  - `innerHTML` kommt im Code nicht vor (nur in zwei Kommentaren). Links laufen über `sichereUrl`.
  - Werte mit `=`, `+`, `-`, `@` werden im Sheet geschützt (`schuetzen`).
  - Öffentliche Aktionen (`termine`, `wiki`) geben nur feste Felder heraus.
  - `index.html` hat keine **Content-Security-Policy** (eine Regel, welche Quellen der Browser laden darf).
  - Fotos werden „für alle mit Link“ freigegeben (`apps-script/Upload.gs`).
  - Wie das Sheet, der Drive-Ordner und das Repo freigegeben sind, sieht der Agent nicht. Das prüft die Person.
- **CSS:** Gleiche Klassen sind mehrfach definiert, weil Anpassungen unten angehängt wurden. Beispiele: `.tabelle` 16-mal, `.dash-zeile` 9-mal, `.kal-ansicht` 7-mal.
  Bei doppelten Regeln gewinnt die spätere. In `docs/STAND.md` („Offen“) steht schon eine Liste ungenutzter Regeln.
- **Barrierefreiheit:** Es gibt Ansätze (211 Stellen mit `aria-` oder `role`, `:focus-visible` an 26 Stellen, Tippflächen mindestens 44 px). Eine Prüfung im Ganzen gab es noch nicht.
  Es gibt keine Regel für Menschen, die wenig Bewegung auf dem Bildschirm wollen (`prefers-reduced-motion`).
- **PC-Breite:** `#app` ist in `css/layout.css` auf **höchstens 1400 px** begrenzt. Darum bleibt beim Rauszoomen alles gleich breit, und daneben wird es leer.
- **App-Icon:** `manifest.webmanifest` hat `icons/icon.svg`, `icon-192.png` und `icon-512.png`, alle mit `purpose: any`. Es gibt **kein „maskable“ Icon**.
  Android legt ein solches Icon verkleinert in einen weißen Kreis. Das Icon selbst ist ein dunkles, abgerundetes Quadrat mit dem grünen AD-Logo und der Schrift „AktionsDeck Landau“.
- **GitHub Actions** (`.github/workflows/jekyll-gh-pages.yml`): `actions/checkout@v4`, `configure-pages@v5`, `jekyll-build-pages@v1`, `upload-pages-artifact@v3`, `deploy-pages@v5`.
  In `docs/STAND.md` steht schon: Warnungen wegen Node 20, Versionen anheben (war für die Etappe „Komfort“ geplant, die jetzt Etappe 11 ist).
- **Etappe „Komfort“** (OpenCollective-Kontostand, Erinnerungen, Sicherung, Übersicht und Export, Dunkelmodus, Feinschliff, Actions-Versionen): kommt jetzt **vorher** als Etappe 11 (`docs/PLAN-ETAPPE-11.md`).

**Was Etappe 11 neu gebracht hat (Nachtrag aus Schritt 11.9, Version 0.33.10).** Das gehört mit in die Prüfung von 12.1:
- **Skript:** neue Datei `apps-script/Konto.gs` mit Zeitauslöser (Montag früh) und Abruf von außen (`https://api.opencollective.com/graphql/v2`). Neue Aktionen `gruppeInfo` und `kontoAktualisieren` (mit Login). Kontostand und Cloud-Link stehen in Skripteigenschaften, nicht im Sheet.
- **Neue Dateien in der App:** `js/gruppeninfo.js`, `js/views/cloud.js`, `js/views/erinnerungen-rechnen.js`, `js/views/uebersicht.js`, `js/views/uebersicht-rechnen.js`, `js/ui/druck.js`, `js/ui/darstellung.js`, `js/darstellung-start.js` (normales Skript im `<head>`, kein Modul; wichtig für eine Content-Security-Policy in 12.2).
- **Neue Schlüssel im Gerät:** `aktionsdeck_darstellung`. Neue Zwischenspeicher: `<gruppe_id>:gruppeinfo`, `<gruppe_id>:startfuerdich`, `<gruppe_id>:uebersicht`.
- **Zahl am App-Symbol** (`navigator.setAppBadge`) und **Drucken** (`@media print`, Block 0.33.6).
- **Farben:** Alle festen Farben stehen seit 0.33.7 als Variablen in `css/base.css`. Dunkle Werte stehen in `css/components.css` (Blöcke 0.33.8 und 0.33.9). Für 12.4 (Barrierefreiheit) und 12.8 (CSS ordnen) gibt es also **zwei Modi**, die beide geprüft werden. In 11.8 und 11.8a hat der Agent den Kontrast aller Schriften in beiden Modi gemessen (Testdaten, Farbe von FFF).
- **GitHub Actions** sind seit 11.2 auf aktuellen Versionen (checkout v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5). In 12.9 bleibt nur die Kontrolle.
- **Offener Wunsch vor 1.0** (siehe `docs/STAND.md`, „Offen“): öffentliche Termine nach Veranstalter sortieren. Das ist eine neue Funktion und gehört nicht in die Prüfung. Die Person entscheidet, wann er kommt.

## 3. Entscheidungen

Noch keine. Die Antworten auf Abschnitt 4 kommen in Fassung 2 hierher.

## 4. Rückfragen (Fassung 1)

Jede Frage hat einen Vorschlag. Antworte gern mit „wie Vorschlag“ oder mit der Nummer und deiner Änderung.

### Ablauf

1. **Nummer und Zeitpunkt:** ~~Wird diese Prüfung Etappe 11?~~ **Entschieden (24.10.2026):** Die Prüfung wird **Etappe 12** und ist der letzte Schritt vor Version 1.0.
   „Komfort“ kommt vorher als Etappe 11 (`docs/PLAN-ETAPPE-11.md`). Gebaut wird erst, wenn Etappe 11 geprüft ist.
   Sonst vermischen sich Anmerkungen zu Etappe 11 mit den Änderungen aus Etappe 12.
2. **Erst ein Prüfbericht, dann Änderungen?**
   *Vorschlag:* Ja. Schritt 12.1 ändert nichts an der App. Er schreibt einen Bericht `docs/PRUEFBERICHT-12.md` mit allen Funden zu Geschwindigkeit, Sicherheit, Barrierefreiheit und CSS,
   je Fund mit „wie schlimm“, „wie viel Arbeit“ und einem Vorschlag. Du entscheidest dann, was gebaut wird. Ganz kleine, sichere Funde dürfen gleich in den passenden Schritt.
3. **Reihenfolge:**
   *Vorschlag:* Bericht → Sicherheit → Geschwindigkeit → Barrierefreiheit → PC-Breite → App-Icon → Tabs sortieren → CSS ordnen → Abschluss.
   CSS kommt spät, weil die Schritte davor noch CSS ändern. Tabs sortieren und App-Icon sind klein und können auch früher kommen.

### Geschwindigkeit

4. **Was heißt „schnell genug“?**
   *Vorschlag:* Gemessen im Testbrowser mit gedrosseltem Netz (wie mittleres Handy-Netz): Beim zweiten Öffnen steht der Start in unter 2 Sekunden da (aus dem Zwischenspeicher),
   frische Daten folgen. Ein Reiterwechsel zeigt sofort den gemerkten Stand. Du meldest deinen Eindruck am Handy (die Konsole brauchst du nicht).
5. **App-Dateien zuerst aus dem Zwischenspeicher?** Das macht die App bei schlechtem Netz deutlich schneller.
   Nachteil: Nach einem Update sieht man beim ersten Öffnen noch die alte Version.
   *Vorschlag:* Ja, für alle Dateien aus `HUELLE`. Dazu zeigt die App einen Hinweis „Neue Version da – jetzt neu laden“, sobald im Hintergrund eine neue Version bereit ist.
   Das ersetzt das „zweimal neu laden“.
6. **Skript schneller machen?** Das Skript liest bei jedem Aufruf ganze Tabs.
   *Vorschlag:* Erst im Bericht messen (Laufzeit je Aktion im Editor mit einem Test). Lohnt es sich, kommt ein kurzer Zwischenspeicher im Skript für Listen je Gruppe,
   der bei jedem Schreiben in diesen Tab gelöscht wird. Das ändert `.gs`-Dateien, also mit „Von Hand zu erledigen“ und neuer Bereitstellung.
7. **Dateien verkleinern?** Ein Build-Schritt (Werkzeug, das den Code vor dem Hochladen verkleinert) ist nach `CLAUDE.md` verboten.
   *Vorschlag:* Kein Build. Stattdessen nur sinnvolle Änderungen im Code (weniger doppelte Anfragen, weniger neu zeichnen, Bilder kleiner laden).

### Sicherheit

8. **Was wird geprüft?**
   *Vorschlag:* App-Code (Anzeige von Daten, Links, Speicher im Gerät, öffentliche Seiten), Skript (Token, PIN, Rechte je Gruppe, öffentliche Aktionen, Eingaben, Formeln),
   Service Worker, Abhängigkeiten nach außen (Google, Drive-Bilder). Dazu eine **Checkliste für dich**: Freigabe des Sheets und des Drive-Ordners,
   Skript-Bereitstellung („Ausführen als“, „Wer hat Zugriff“), wer im GitHub-Repo schreiben darf, Schutz des Zweigs `main`.
9. **Wie gehen wir mit Funden um?** Das Repo ist öffentlich.
   *Vorschlag:* Schwere Funde nenne ich dir zuerst nur im Chat und behebe sie gleich im nächsten Pull Request. Im öffentlichen Bericht stehen sie genau erst, wenn sie behoben sind.
10. **Content-Security-Policy:** eine Regel im Kopf von `index.html`. Der Browser lädt dann nur Dateien von der eigenen Seite, vom Google-Skript und Bilder von Google Drive.
    *Vorschlag:* Ja, in Schritt 12.2. Vorher teste ich alle Reiter, damit nichts gesperrt wird.
11. **Fotos „für alle mit Link“:** Das ist nötig, damit Bilder ohne Google-Anmeldung erscheinen (auch im öffentlichen Wiki).
    *Vorschlag:* So lassen. Der Hinweis „keine Personen“ bleibt. Im Bericht steht, was das bedeutet.
11a. **Was könnte kaputt gehen? (neu seit 0.33.0, Entscheidung 17 in `docs/PLAN-ETAPPE-11.md`)** Es gibt keine eigene Sicherung des Sheets, nur den Versionsverlauf von Google.
    *Vorschlag:* Schritt 12.2 prüft als eigenen Punkt, wo Daten verloren gehen können (zum Beispiel Löschen mit Mitlöschen, Aufräumen nach 90 Tagen, Überschreiben bei gleichzeitigem Arbeiten,
    falsche Handarbeit im Sheet, abgelaufene Skript-Bereitstellung) und ob man jeweils von Hand zurückkommt (Anleitung „Für Admins“). Ergebnis als Liste im Prüfbericht.

### CSS

12. **Muss man das CSS neu sortieren?** Nötig ist es nicht, die App funktioniert. Es lohnt sich aber: Die Datei ist groß, Regeln überschreiben sich gegenseitig,
    und jede neue Änderung wird schwerer.
    *Vorschlag:* Ja, in einem eigenen Schritt, **ohne dass sich das Aussehen ändert**:
    - `css/components.css` wird nach Bereichen geordnet: Grundbausteine (Knöpfe, Karten, Formulare, Fenster), dann je Reiter (Start, Projekte, ToDos, Material, Mobi, Kalender, Dokumentation, Team, Wiki), dann öffentliche Seiten.
    - Doppelte Regeln werden zusammengefasst, die ungenutzten aus „Offen“ fallen weg.
    - **Prüfung:** Vorher und nachher mache ich Bildschirmfotos aller Reiter und Seiten bei Handy- und PC-Breite und vergleiche sie Punkt für Punkt. Nur wenn sie gleich sind, kommt der Pull Request.
    - Neue Regel für `CLAUDE.md`: Neue CSS-Regeln kommen in den passenden Bereich (mit Kommentar und Version), nicht mehr ans Ende.
13. **Eine Datei oder mehrere?**
    *Vorschlag:* Mehrere Dateien je Bereich (zum Beispiel `css/start.css`, `css/kalender.css`). Dann findet man Regeln schneller. Alle stehen in `index.html` und in `HUELLE`.
    *Andere Möglichkeit:* eine Datei mit klaren Abschnitten (weniger Dateien, aber lang).

### Tabs im Sheet sortieren

14. **Welche Reihenfolge?**
    *Vorschlag:* Zwei Funktionen für den Apps-Script-Editor, du wählst.
    - `tabsSortieren`: **nach Wichtigkeit**. Zuerst die System-Tabs (`Gruppen`, `Zugang`, `Einstellungen`, `Log`), dann die Daten in der Reihenfolge der Reiter
      (Projekte mit Meilensteinen, Material und Finanzen, dann ToDos, Material und Ausleihe, Mobi, Veranstaltungen, Protokolle und Reden, Team, Wiki, Start mit Umfragen und Mitteilungen),
      ganz hinten die ungenutzten Tabs (`Posts`, `Projekt_Team`).
    - `tabsSortierenAZ`: nach dem Alphabet.
    Tabs, die das Skript nicht kennt, kommen ans Ende und bleiben unverändert.
15. **Farben für die Tabs?**
    *Vorschlag:* Ja, je Bereich eine ruhige Farbe am Tab-Reiter im Sheet (zum Beispiel System grau, Projekte grün). Das macht das Sheet übersichtlicher. Daten ändern sich dabei nicht.
16. **Wann läuft es?** *Vorschlag:* Nur von Hand im Editor, wenn du willst. Es ist keine neue Bereitstellung nötig, weil die App die Funktion nicht aufruft.

### Barrierefreiheit

17. **Maßstab:**
    *Vorschlag:* So weit wie möglich nach den Regeln **WCAG 2.2, Stufe AA** (ein üblicher Standard für barrierefreie Webseiten).
    Geprüft wird automatisch (ein Prüfwerkzeug läuft nur in meinem Testbrowser, nicht in der App) und von Hand:
    Bedienung nur mit Tastatur, sichtbarer Fokus, Beschriftungen für Bildschirmleser, Kontraste, Vergrößerung auf 200 %, große Schrift am Handy, weniger Bewegung, Sprache „Deutsch“.
18. **Testest du mit einem Bildschirmleser?** (iPhone: VoiceOver, Android: TalkBack)
    *Vorschlag:* Freiwillig. Ich schreibe eine kurze Anleitung für einen Test von 10 Minuten. Wichtiger ist dein Test mit großer Schrift am Handy.
19. **Farben:** Manche Farben (zum Beispiel die Gruppenfarben auf Knöpfen) haben vielleicht zu wenig Kontrast.
    *Vorschlag:* Die App wählt die Schriftfarbe schon selbst (Weiß oder Dunkel). Wo der Kontrast trotzdem nicht reicht, wird die Farbe etwas dunkler. Das sage ich im Pull Request vorher an.

### PC-Breite und Rauszoomen

20. **Was soll beim Rauszoomen passieren?**
    *Vorschlag:* Die Grenze von 1400 px wird größer (zum Beispiel 1920 px) bzw. fällt für den Inhalt weg. Listen mit Karten (Projekte, Team, Material, Kacheln auf dem Start, Mobi)
    bekommen dann **mehr Spalten**. Texte zum Lesen (Wiki, Protokoll, Datenschutz) behalten eine angenehme Zeilenlänge und stehen mittig. Der Detailbereich rechts wird etwas breiter.
    So sieht man beim Rauszoomen mehr auf einmal statt mehr leeren Rand.
21. **Sehr große Bildschirme:** *Vorschlag:* Ab etwa 2400 px wächst nichts mehr. Sonst werden Zeilen zu lang.

### App-Icon

22. **Neues Icon für das Handy:** Ursache des weißen Kreises ist das fehlende „maskable“ Icon.
    *Vorschlag:* Ein zweites Icon nur für den Startbildschirm: vollflächig dunkel (#1a1e20) oder grün (#368469), das grüne AD-Logo groß in der Mitte,
    **ohne die Schrift** „AktionsDeck Landau“ (sie ist auf dem Handy zu klein). Dazu `icon-maskable-192.png` und `icon-maskable-512.png` im Manifest und ein neues `apple-touch-icon.png` (iPhone).
    Die PNG-Dateien erzeuge ich aus dem SVG und zeige dir vorher eine Vorschau im Pull Request.
    - 22a. Hintergrund dunkel wie das jetzige Icon oder grün? *Vorschlag:* dunkel, dann passt es zum jetzigen Logo.
    - 22b. Wichtig: Android und iPhone übernehmen ein neues Icon oft erst, wenn man die App vom Startbildschirm löscht und neu hinzufügt. Das steht in der Prüfliste.

### Sonstiges

23. **GitHub Actions anheben** (Node-20-Warnungen)? *Hinweis seit 11.0:* Das steht als Vorschlag jetzt in Etappe 11 (`docs/PLAN-ETAPPE-11.md`, Rückfrage 30). Wird es dort gebaut, prüft 12.9 nur noch, dass die Actions grün laufen.
    *Vorschlag:* Ja, als kleiner Schritt in dieser Etappe, weil er zur Pflege gehört. Prüfen: Nach dem Merge läuft die Action grün und die Seite ist da.
24. **Aufräumen ungenutzter Dateien und Funktionen** (Liste in „Offen“, zum Beispiel `topEinfuegen`, alte CSS-Regeln)?
    *Vorschlag:* Ja, im CSS-Schritt bzw. im Geschwindigkeits-Schritt. Gelöscht wird nur, was der Bericht als ungenutzt nachweist und du freigibst.

## 5. Datenmodell

Keine neuen Tabs oder Spalten. Nur bei Rückfrage 6 (Zwischenspeicher im Skript) ändern sich `.gs`-Dateien, nicht das Sheet.
Das Sortieren der Tabs (Rückfrage 14) ändert nur die Reihenfolge und Farbe der Tabs, keine Daten und keine Spaltenköpfe.

## 6. Schritte (Vorschlag)

### 12.0 – Plan schreiben (nur Doku, erledigt)

Version: 0.32.10 (damals als Schritt 11.0, Pull Request #48). Umbenannt in 11.0 (0.32.11). Diese Datei als Fassung 1 mit Rückfragen. `docs/STAND.md` zeigt auf den Plan. Sheet und Skript bleiben unverändert.

**Prüfen:** App läuft wie vorher (nur neue Version).

### 12.1 – Prüfbericht (nichts an der App ändern)

Version: 0.34.0 (neuer Hauptschritt). Sheet und Skript bleiben unverändert.

1. Neue Datei `docs/PRUEFBERICHT-12.md`: Funde zu Geschwindigkeit, Sicherheit (ohne Einzelheiten zu offenen schweren Funden, Rückfrage 9), Barrierefreiheit und CSS.
   Je Fund: Ort (Datei), wie schlimm, Aufwand, Vorschlag, in welchem Schritt.
2. Messungen: Ladezeiten im Testbrowser (gedrosseltes Netz, Handy und PC), Zahl der Anfragen je Reiter, Größe der Dateien, Laufzeit der Skript-Aktionen (Editor-Test `messenSkript` als Vorschlag, wird erst in 12.3 gebaut).
3. Barrierefreiheit: automatische Prüfung aller Reiter und öffentlichen Seiten, Prüfung von Hand mit Tastatur und 200 % Zoom.
4. CSS: Liste doppelter und ungenutzter Regeln.
5. Checkliste für die Person (Freigaben Sheet, Drive, Skript, GitHub).
6. Fassung 2 dieser Datei mit den Antworten und den Funden.

**Prüfen:** Bericht lesen und entscheiden, welche Funde gebaut werden. Checkliste abarbeiten.

### 12.2 – Sicherheit

Version: 0.34.1. Je nach Funden mit Sheet- oder Skript-Änderung (dann „Von Hand zu erledigen“).

1. Funde aus dem Bericht beheben.
2. Content-Security-Policy in `index.html` (Rückfrage 10).
3. Editor-Test für die Rechte je Gruppe (eine Gruppe kann keine Daten einer anderen lesen oder ändern).
4. Prüfung „Was könnte kaputt gehen?“ (Rückfrage 11a): Liste der Stellen mit Datenverlust und wie man von Hand zurückkommt.

**Prüfen:** Alle Reiter, öffentliche Seiten, Bilder und Kalender-Abo laufen wie vorher.

### 12.3 – Geschwindigkeit

Version: 0.34.2. Mit Skript-Änderung nur, wenn Rückfrage 6 „ja“ ist.

1. Service Worker: App-Dateien zuerst aus dem Zwischenspeicher, Hinweis „Neue Version da – jetzt neu laden“ (Rückfrage 5).
2. Weniger doppelte Anfragen und weniger Neuzeichnen (aus dem Bericht).
3. Bei Bedarf: Zwischenspeicher im Skript, Editor-Test `messenSkript`.

**Prüfen:** Zweites Öffnen am Handy fühlt sich schneller an. Nach einem Update erscheint der Hinweis, und ein Tipp darauf zeigt die neue Version.

### 12.4 – Barrierefreiheit

Version: 0.34.3. Sheet und Skript bleiben unverändert.

1. Funde aus dem Bericht beheben (Beschriftungen, Fokus, Kontraste, Überschriften-Reihenfolge, weniger Bewegung).
2. Kurze Anleitung für einen Test mit Bildschirmleser (Rückfrage 18) in `texte/anleitung/fragen.txt` oder im Pull Request.

**Prüfen:** Große Schrift am Handy, Bedienung mit Tastatur am PC, auf Wunsch Bildschirmleser.

### 12.5 – PC-Breite und Rauszoomen

Version: 0.34.4. Sheet und Skript bleiben unverändert.

1. `css/layout.css`: Grenze für `#app` anheben, Raster mit mehr Spalten bei viel Platz, Lesetexte mit fester Zeilenlänge (Rückfragen 20 und 21).

**Prüfen:** Am PC auf 67 % und 50 % rauszoomen: Mehr Spalten statt leerem Rand. Bei 100 % sieht alles aus wie vorher.

### 12.6 – App-Icon

Version: 0.34.5. Sheet und Skript bleiben unverändert.

1. Neue Dateien `icons/icon-maskable.svg`, `icons/icon-maskable-192.png`, `icons/icon-maskable-512.png`, neues `icons/apple-touch-icon.png`. `manifest.webmanifest` ergänzt. Alle in `HUELLE`.

**Prüfen:** App vom Startbildschirm löschen und neu hinzufügen (Android und iPhone): Das Icon füllt die Fläche und hat keinen weißen Kreis.

### 12.7 – Tabs im Sheet sortieren

Version: 0.34.6. **Skript-Datei neu**, aber keine neue Bereitstellung nötig.

1. Neue Datei `apps-script/Werkzeuge.gs` mit `tabsSortieren`, `tabsSortierenAZ` und (Rückfrage 15) `tabsFaerben`. Nur für den Editor.

**Prüfen:** Im Editor `tabsSortieren` ausführen: Die Tabs stehen in der neuen Reihenfolge, die App läuft wie vorher.

### 12.8 – CSS ordnen

Version: 0.34.7. Sheet und Skript bleiben unverändert.

1. CSS nach Bereichen ordnen, doppelte Regeln zusammenfassen, ungenutzte entfernen (Rückfragen 12 und 13).
2. Vergleich der Bildschirmfotos vorher und nachher (alle Reiter und Seiten, Handy und PC).
3. `CLAUDE.md`: neue Regel für CSS.

**Prüfen:** Alles sieht aus wie vorher. Wenn dir doch etwas anders vorkommt: Reiter und Breite melden.

### 12.9 – GitHub Actions, Abschluss

Version: 0.34.8. Sheet und Skript bleiben unverändert.

1. Versionen in `.github/workflows/jekyll-gh-pages.yml` anheben (Rückfrage 23).
2. `docs/STAND.md`, `docs/PRUEFBERICHT-12.md` (was erledigt ist), `texte/entwicklung.txt` (Etappe 12).

**Prüfen:** Die Action nach dem Merge ist grün, die Seite ist da.

## 7. Regeln und Risiken für Etappe 12

- **Nichts kaputt machen:** Diese Etappe ändert viel im Hintergrund. Jeder Schritt wird vor dem Pull Request im Testbrowser mit allen Reitern und öffentlichen Seiten bei Handy- und PC-Breite geprüft.
- **Aussehen gleich lassen** (außer bei PC-Breite, Icon und Barrierefreiheit). Beim CSS entscheidet der Vergleich der Bildschirmfotos.
- **Service Worker:** Ein Fehler kann die App auf alten Dateien festhalten. Darum gilt: neue Version = neuer Name des Zwischenspeichers (wie bisher), und der Hinweis „Neue Version da“ wird extra getestet.
- **Content-Security-Policy:** Eine zu strenge Regel sperrt Teile der App (zum Beispiel Bilder oder das Skript). Darum alle Reiter testen und im Pull Request genau sagen, was erlaubt ist.
- **Sicherheitsfunde im öffentlichen Repo:** erst beheben, dann genau beschreiben (Rückfrage 9).
- **Kein Build, keine Pakete in der App.** Prüfwerkzeuge laufen nur in der Testumgebung des Agenten und kommen nicht ins Repo.
- **Skript:** Neue oder geänderte `.gs`-Dateien immer mit „Von Hand zu erledigen“. Das Sortieren der Tabs braucht keine neue Bereitstellung.
- **Nicht vom Agenten prüfbar:** echte Ladezeiten am Handy der Person, Freigaben in Google und GitHub, Bildschirmleser auf echten Geräten, das Icon auf dem echten Startbildschirm.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 12.0 | Plan Fassung 1 mit Rückfragen (erledigt als 11.0) | 0.32.10 | nein |
| 12.1 | Prüfbericht, Plan Fassung 2 | 0.34.0 | nein |
| 12.2 | Sicherheit, Content-Security-Policy | 0.34.1 | vielleicht |
| 12.3 | Geschwindigkeit, Hinweis „Neue Version da“ | 0.34.2 | vielleicht |
| 12.4 | Barrierefreiheit | 0.34.3 | nein |
| 12.5 | PC-Breite und Rauszoomen | 0.34.4 | nein |
| 12.6 | App-Icon für den Startbildschirm | 0.34.5 | nein |
| 12.7 | Tabs im Sheet sortieren (`Werkzeuge.gs`) | 0.34.6 | Skript-Datei neu, keine Bereitstellung |
| 12.8 | CSS ordnen | 0.34.7 | nein |
| 12.9 | GitHub Actions, Abschluss | 0.34.8 | nein |

Die Versionen in dieser Tabelle sind die geplanten. Sie gehen davon aus, dass Etappe 11 die Versionen 0.33.x belegt; endet Etappe 11 anders, verschieben sie sich. Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.
