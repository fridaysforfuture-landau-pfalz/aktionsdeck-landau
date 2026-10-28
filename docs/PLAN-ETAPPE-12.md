# Plan Etappe 12: Prüfung und Qualität (Fassung 2, 28.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: Fassung 2 mit Rückfragen.** Etappe 11 ist fertig und geprüft (0.33.15, 28.10.2026). Etappe 12 ist der **letzte Schritt vor Version 1.0**.
Fassung 2 nimmt die Wünsche der Person vom 28.10.2026 auf (Abschnitt 1), ordnet die Schritte neu (Abschnitt 6) und fasst die Rückfragen zusammen (Abschnitt 4).
Die Rückfragen aus Fassung 1 waren noch nicht beantwortet. Sie stehen, gekürzt, wieder in Abschnitt 4.
**Gebaut wird erst, wenn die Person die Rückfragen beantwortet hat.** Alles in den Abschnitten 5 bis 8 ist ein Vorschlag.

## 1. Ziel

Die App soll schneller, sicherer, aufgeräumter und für alle gut benutzbar werden. Neue Funktionen kommen nicht dazu,
außer der Fehlerseite (12.10) und dem Sortieren der Tabs (12.11). Am Ende steht **Version 1.0.0**.

Die Wünsche der Person (28.10.2026) und wo sie im Plan stehen:

| Nr. | Wunsch | Schritt |
|---|---|---|
| W1 | Ganzen Code auf Geschwindigkeit und Leistung prüfen | 12.3 Bericht, 12.5 Bauen |
| W2 | Ganzen Code auf Sicherheitslücken prüfen, mit `/security-review` und den Strix-Skills (`npx skills add usestrix/strix`) | 12.3 Bericht, 12.4 Bauen |
| W3 | CSS sortieren, doppelte Regeln mit gleicher Wirkung zusammenfassen | 12.12 |
| W4 | Nicht mehr benötigte Funktionen und Dateien löschen (zum Beispiel Pläne der Etappen 7 bis 11) | 12.2 (Doku), 12.6 (Code) |
| W5 | `CLAUDE.md` nach `docs/` verschieben oder in den Stand einbauen: nur noch **eine Datei** für Stand, Arbeitsregeln und weitere Pläne | 12.2 |
| W6 | Ein Skript, das die Tabs im Sheet sortiert (nach Alphabet oder nach Wichtigkeit) | 12.11 |
| W7 | Ganze App auf Barrierefreiheit prüfen, Probleme und Lösungen auflisten | 12.3 Bericht (Liste), 12.7 Bauen |
| W8 | Beim Rauszoomen füllt die Ansicht den Bildschirm nicht. Nur zwei Ansichten: Handy und alles darüber. Leiste und Inhalt füllen den Bildschirm. Am PC darf die Leiste zur Not in einen Reiter „Mehr“ zum Ausklappen umbrechen | 12.8 |
| W9 | App-Icon am Handy füllt die Fläche nicht (Bild auf weißem Grund). Größer und füllend. Ladebildschirm grau mit Logo statt weiß | 12.9 |
| W10 | „040 Seite“ (vermutlich: **404-Fehlerseite**, Rückfrage 17) | 12.10 |

## 2. Ausgangslage (im Repo geprüft am 28.10.2026, Version 0.33.15)

`js/config.js` und `sw.js` haben beide `0.33.15`, wie `docs/STAND.md`. Mit diesem Plan wird es 0.33.16.

### 2.1 Offene Punkte aus Fassung 1 und aus `docs/STAND.md`

- **Erledigt seit Fassung 1:**
  - GitHub Actions sind seit 11.2 auf aktuellen Versionen (checkout v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5). In 12.13 nur noch kontrollieren.
  - Die alten Prüfpunkte 0.26.3 und 0.28.9 bis 0.28.13 sind mit der Gesamt-Prüfliste am 27.10.2026 bestätigt.
  - Die Editor-Tests `testenWiki` und `testenWikiSicher` laufen (27.10.2026). Bild-Fehler im Wiki ist mit 10.12 behoben.
  - Kalender-Abo in Google Kalender klappt. Apple Kalender kann die Person nicht testen.
  - `texte/impressum.txt`, `texte/datenschutz.txt` und `texte/entwicklung.txt` sind ausgefüllt (keine Platzhalter mehr gefunden).
- **Noch offen, für die Person:**
  - `texte/anleitung/zustaendig.txt`: zweimal `[Kontakt]` (PIN vergessen, Fehler in der App). Der Signal-Knopf darunter ist schon da; vielleicht reicht er (Rückfrage 19).
  - Den Datenschutztext von jemandem prüfen lassen, der sich auskennt.
  - Testdaten im Sheet löschen (Editor-Lauf `testdatenListe` in `apps-script/Aufraeumen.gs`). Vorschlag: erst in 12.13, damit die Testdaten für die Prüfungen in Etappe 12 noch da sind.
- **Noch offen, für den Agenten:**
  - Ungenutzte CSS-Regeln: `.kal-pfeil`, `.kal-nav`, `.kal-datum`, `.kal-monat-kopf`, `.modal-vollbild`, `.dash-rechts-teil`, `.hilfe-abschnitt`, `.hilfe-teil`, `.hilfe-text`.
  - Ungenutzte Funktion `topEinfuegen` in `js/views/protokoll-rechnen.js`.
  - **Neu gefunden:** Im Hauptordner liegen vier Bildschirmfotos `sig2-390.png`, `sig2-1280.png`, `term-390.png`, `term-1280.png`. Sie kamen mit 11.12 aus Versehen ins Repo und werden nicht benutzt.
  - **Früher entschieden:** „Der Umbau von `sw.js` ist gestrichen“ (Liste `pruefung/offene-todos-und-pruefliste.md`). Fassung 1 schlägt in Rückfrage 5 trotzdem einen Umbau für die Geschwindigkeit vor. Das muss die Person neu entscheiden (Rückfrage 9).

### 2.2 Zahlen und Befunde zu den Wünschen

- **Umfang:** etwa 98 JavaScript-Dateien. `css/components.css` hat 3351 Zeilen (Fassung 1: 3140), `css/base.css` 106, `css/layout.css` 157.
  Gleiche Klassen sind mehrfach definiert, weil Anpassungen unten angehängt wurden (Fassung 1: `.tabelle` 16-mal, `.dash-zeile` 9-mal, `.kal-ansicht` 7-mal).
- **Doku:** `docs/STAND.md` hat etwa 110 KB, dazu `CLAUDE.md` (12 KB), die Pläne 7 bis 12 (zusammen etwa 165 KB), `docs/STANDARD-TODOS.md` und `docs/MOBI-STANDARD-BEITRAEGE.md`.
  Der größte Teil ist Geschichte der Etappen. Für die Arbeit braucht man davon wenig.
- **Laden:** Jeder Reiter wird erst beim Öffnen geladen (`js/app.js`). Der Service Worker (`sw.js`) holt jede App-Datei **zuerst aus dem Netz**. Bei schlechtem Netz wartet die App auf jede Datei.
  Das Skript liest bei jedem Aufruf den ganzen Tab (`lies` in `apps-script/Util.gs`).
- **Sicherheit (erster Blick):** HMAC-Token, Sperre nach 8 Fehlversuchen, kein `innerHTML` mit Daten, `sichereUrl`, Schutz vor Formeln im Sheet.
  **Keine Content-Security-Policy** in `index.html`. Seit Etappe 11 neu: `apps-script/Konto.gs` (Abruf bei OpenCollective), `apps-script/Signal.gs` (Aktion ohne Login), `js/darstellung-start.js` (normales Skript im `<head>`).
  Der alte Signal-Link steht noch in der Geschichte des Repos (0.33.11).
- **Barrierefreiheit:** Ansätze sind da (`aria-`, `role`, `:focus-visible`, 44 px), keine Prüfung im Ganzen, keine Regel für `prefers-reduced-motion`. Zwei Modi (hell und dunkel) müssen beide geprüft werden.
- **Layout (W8):** `#app` ist in `css/layout.css` auf **höchstens 1400 px** begrenzt. Darum bleibt beim Rauszoomen alles gleich breit, daneben wird es leer.
  Es gibt schon genau zwei Ansichten mit Grenze **960 px**: darunter Handy (untere Leiste), darüber PC (Seitenleiste). Die Seitenleiste lässt sich bei niedrigen Fenstern schon scrollen (seit 0.32.14).
- **Icon und Ladebildschirm (W9):** `manifest.webmanifest` hat nur Icons mit `purpose: any`, **kein „maskable“ Icon**. Android legt so ein Icon klein auf einen weißen Kreis.
  Der Ladebildschirm am Handy (Android) nimmt `background_color` aus dem Manifest: zurzeit `#f3f7f5` (fast weiß). Das iPhone nutzt das Manifest dafür nicht; es braucht eigene Startbilder je Bildschirmgröße.
  `icons/apple-touch-icon.png` gibt es schon.
- **Fehlerseite (W10):** Eine falsche Adresse **innerhalb** der App (zum Beispiel `#/g/unbekannt`) springt ohne Hinweis zur Startseite (`js/app.js`, `route`).
  Eine falsche Adresse **auf dem Server** (zum Beispiel `…/aktionsdeck-landau/xyz`) zeigt die englische Standardseite von GitHub. Eine eigene `404.html` gibt es nicht.
- **Tabs im Sheet (W6):** Das Skript kennt 30 Tabs (`apps-script/Schema.gs`), darunter die ungenutzten `Posts` und `Projekt_Team` (beim Löschen eines Projekts noch mit aufgeräumt, `apps-script/Daten.gs`).

## 3. Entscheidungen

Noch keine. Die Antworten auf Abschnitt 4 kommen in Fassung 3 hierher (im Pull Request zu 12.2).

## 4. Rückfragen (Fassung 2)

Jede Frage hat einen Vorschlag. Antworte gern mit „alle wie Vorschlag“ oder mit der Nummer und deiner Änderung.

### Ablauf

1. **Reihenfolge:** wie in Abschnitt 6 (Doku → Bericht → Sicherheit → Geschwindigkeit → Aufräumen → Barrierefreiheit → Layout → Icon → Fehlerseite → Tabs → CSS → Abschluss)?
   *Vorschlag:* Ja. Die Doku kommt zuerst, damit alle folgenden Schritte schon in die eine neue Datei schreiben. CSS ordnen kommt zuletzt, weil fast alle Schritte davor noch CSS ändern.
   Icon, Fehlerseite und Tabs sind klein und unabhängig. Wenn du schnell etwas sehen willst, können sie auch direkt nach 12.2 kommen.
2. **Erst ein Bericht, dann Änderungen?**
   *Vorschlag:* Ja. Schritt 12.3 ändert nichts an der App. Er listet alle Funde zu Geschwindigkeit, Sicherheit, Barrierefreiheit, CSS und Ungenutztem,
   je Fund: Ort, wie schlimm, wie viel Arbeit, Vorschlag zur Lösung. Du entscheidest dann, was gebaut wird. Ganz kleine, sichere Funde dürfen gleich in den passenden Schritt.
3. **Wo steht der Bericht?** Das Repo ist öffentlich, und es soll nur noch eine Doku-Datei geben (W5).
   *Vorschlag:* Der Bericht kommt **nicht ins Repo**, sondern als Datei in die Projektdateien hier im Chat (`pruefung/pruefbericht-12.md`).
   Schwere Sicherheitsfunde stehen so nie öffentlich, bevor sie behoben sind. In `docs/STAND.md` kommt am Ende nur eine kurze Zusammenfassung.
4. **Ende der Etappe = Version 1.0.0?**
   *Vorschlag:* Ja. Der letzte Schritt (12.13) setzt die Version auf 1.0.0, nachdem du alles geprüft und die Testdaten gelöscht hast. Ab dann bekommt `texte/entwicklung.txt` je Version eine Zeile.

### Eine Datei für Stand, Regeln und Pläne (W4, W5)

5. **Wo liegt die eine Datei?** Wichtig: Claude Code liest **nur** eine Datei `CLAUDE.md` im Hauptordner von selbst. Liegt sie in `docs/`, liest der Agent sie nur, wenn etwas auf sie zeigt.
   *Vorschlag:* Alles kommt in **`docs/STAND.md`** (Arbeitsregeln, aktueller Stand, Aufbau, Pläne). Im Hauptordner bleibt eine **sehr kurze `CLAUDE.md`** mit zwei Sätzen: „Lies zuerst `docs/STAND.md`. Dort stehen alle Regeln.“
   So gibt es inhaltlich nur eine Datei, und der Agent findet sie trotzdem sicher.
   *Andere Möglichkeit:* Alles in `CLAUDE.md` im Hauptordner (wird immer gelesen, muss dann aber kurz bleiben).
6. **Was bleibt von der Geschichte?**
   *Vorschlag:* `docs/PLAN-ETAPPE-7.md` bis `docs/PLAN-ETAPPE-11.md` werden gelöscht. Die langen Abschnitte zu den Etappen in `docs/STAND.md` werden auf wenige Zeilen je Etappe gekürzt
   (was es gibt, welche Versionen, welche Pull Requests). Wichtige Festlegungen, die heute noch gelten (zum Beispiel Regeln für Material, ToDos, Projekte, Skripteigenschaften, Schlüssel im Gerät), bleiben.
   Alles Gelöschte bleibt in der Geschichte des Repos auf GitHub abrufbar. `docs/PLAN-ETAPPE-12.md` wird am Ende von Etappe 12 in `docs/STAND.md` eingearbeitet und dann auch gelöscht.
7. **`docs/STANDARD-TODOS.md` und `docs/MOBI-STANDARD-BEITRAEGE.md`:** Sie beschreiben keine Pläne, sondern Inhalte (die Standard-ToDos und Standard-Beiträge zum Nachlesen).
   *Vorschlag:* Beide auch in `docs/STAND.md` einarbeiten (als Anhang am Ende) und löschen. Dann gibt es in `docs/` wirklich nur noch eine Datei.
8. **Projektanweisungen hier im Chat:** In den Einstellungen dieses Projekts stehen alte Regeln doppelt und teils veraltet (zum Beispiel Reiter „Posts“, alte Reihenfolge der Handy-Leiste).
   *Vorschlag:* Ich schreibe dir im Pull Request zu 12.2 einen kurzen neuen Text für die Projektanweisungen, der nur noch auf `docs/STAND.md` zeigt. Du kopierst ihn unter Projekt-Einstellungen hinein.

### Sicherheit und Geschwindigkeit (W1, W2)

9. **Werkzeuge:** `/security-review` prüft eigentlich nur die Änderungen eines Zweigs. Ich lasse es darum gegen den **ganzen Code** laufen (Vergleich mit einem leeren Stand).
   Die Strix-Skills installiere ich **nur in meiner Testumgebung**, nichts davon kommt ins Repo. Strix kann eine laufende App auch „angreifen“.
   Gegen das echte Skript würde das deine Gruppen sperren (8 Fehlversuche = 15 Minuten gesperrt), Einträge im Log und vielleicht Testdaten im Sheet erzeugen.
   *Vorschlag:* Strix prüft den Code und eine Kopie der App in meiner Testumgebung mit einer nachgebauten Schnittstelle. **Nie gegen das echte Skript, das Sheet oder die echte Seite.** Einverstanden?
10. **Content-Security-Policy** (eine Regel im Kopf von `index.html`: Der Browser lädt nur Dateien von der eigenen Seite, vom Google-Skript und Bilder von Google Drive).
    *Vorschlag:* Ja, in 12.4. Vorher teste ich alle Reiter und öffentlichen Seiten, damit nichts gesperrt wird.
11. **App-Dateien zuerst aus dem Zwischenspeicher?** Früher wurde ein Umbau von `sw.js` gestrichen. Für die Geschwindigkeit wäre er aber der größte Gewinn bei schlechtem Netz.
    Nachteil: Nach einem Update sieht man beim ersten Öffnen noch die alte Version.
    *Vorschlag:* Ja, mit einem Hinweis „Neue Version da – jetzt neu laden“, sobald die neue Version im Hintergrund bereit ist. Das ersetzt auch das „zweimal neu laden“.
    *Andere Möglichkeit:* Nein, `sw.js` bleibt wie es ist, und 12.5 verbessert nur den Code der Reiter.
12. **Skript schneller machen?** *Vorschlag:* Erst im Bericht messen (Editor-Test `messenSkript`). Nur wenn es sich lohnt, kommt ein kurzer Zwischenspeicher im Skript (mit „Von Hand zu erledigen“ und neuer Bereitstellung).

### Aufräumen (W4)

13. **Was wird gelöscht?**
    *Vorschlag:* Die Liste aus 2.1 (alte CSS-Regeln, `topEinfuegen`, die vier Bildschirmfotos im Hauptordner) und alles, was der Bericht als sicher ungenutzt nachweist (Funktionen, Dateien, Einträge in `HUELLE`).
    Du bekommst die Liste im Bericht und gibst sie frei. **Die Tabs `Posts` und `Projekt_Team` im Sheet bleiben**, weil das Skript sie beim Löschen eines Projekts noch aufräumt; sie kommen beim Sortieren ans Ende.

### Barrierefreiheit (W7)

14. **Maßstab und Ablauf:**
    *Vorschlag:* Geprüft wird nach **WCAG 2.2, Stufe AA** (ein üblicher Standard für barrierefreie Webseiten), in hell und dunkel, am Handy und am PC:
    automatisch mit einem Prüfwerkzeug in meinem Testbrowser und von Hand (nur Tastatur, sichtbarer Fokus, Beschriftungen für Bildschirmleser, Kontraste, 200 % Zoom, große Schrift, weniger Bewegung).
    Im Bericht steht eine **Liste: Problem, wo, wer betroffen ist, Lösung, Aufwand**. Du wählst aus, 12.7 baut es. Ein Test mit Bildschirmleser (VoiceOver oder TalkBack) ist freiwillig; ich schreibe eine Anleitung für 10 Minuten.

### Layout am PC und beim Rauszoomen (W8)

15. **So habe ich deinen Wunsch verstanden. Stimmt das?**
    - Es bleibt bei **zwei Ansichten**: Handy (untere Leiste) und alles darüber (Seitenleiste links).
    - Am PC fällt die Grenze von 1400 px weg: **Seitenleiste und Inhalt füllen immer den ganzen Bildschirm**, auch beim Rauszoomen.
      Listen mit Karten (Projekte, Team, Material, Kacheln auf dem Start, Mobi) bekommen dann mehr Spalten. Lesetexte (Wiki, Protokoll, Datenschutz) behalten eine angenehme Zeilenlänge.
    - **Seitenleiste zu niedrig** (Fenster wenig hoch oder stark vergrößert): Statt zu scrollen, wandern die Reiter, die nicht mehr passen, in einen Eintrag **„Mehr ▾“** unten in der Leiste. Ein Klick klappt sie aus.
    *Frage dazu:* Soll die Grenze zwischen Handy und PC bei **960 px** bleiben (Tablet hochkant = Handy-Ansicht)? *Vorschlag:* Ja, weil der Detailbereich rechts sonst zu schmal wird.
16. **Sehr große Bildschirme:** *Vorschlag:* Der Inhalt füllt immer die ganze Breite. Nur Lesetexte und Formulare werden nicht breiter als gut lesbar und stehen dann mittig.

### App-Icon und Ladebildschirm (W9)

17. **Icon:** *Vorschlag:* Ein neues Icon nur für den Startbildschirm („maskable“): **vollflächig dunkelgrau (#1a1e20)**, das grüne AD-Logo groß in der Mitte, **ohne die Schrift** „AktionsDeck Landau“ (sie ist am Handy zu klein).
    Dazu passende PNG-Dateien (192 und 512 px) und ein neues `icons/apple-touch-icon.png` fürs iPhone. Du bekommst vorher eine Vorschau im Pull Request.
18. **Ladebildschirm:** Welches Grau? *Vorschlag:* dasselbe **Dunkelgrau #1a1e20** wie das Icon, das Logo darauf (so wirkt Icon und Start wie aus einem Guss).
    Android nimmt das automatisch aus dem Manifest. **Welches Handy nutzt ihr vor allem: Android, iPhone oder beides?** Fürs iPhone braucht es eigene Startbilder für jede Bildschirmgröße (etwa 10 Bilder).
    *Vorschlag:* Android über das Manifest; iPhone mit Startbildern für die gängigen Größen, wenn ihr iPhones nutzt.
    Hinweis für die Prüfung: Ein neues Icon erscheint oft erst, wenn man die App vom Startbildschirm löscht und neu hinzufügt.

### Fehlerseite (W10)

19. **„040 Seite“ = 404-Fehlerseite?** Ich verstehe es als die Seite „Seite nicht gefunden“. *Vorschlag:* zwei Teile:
    - Eine eigene `404.html` für falsche Adressen auf dem Server: im Aussehen der App, auf Deutsch, mit Logo und Knopf „Zur Startseite“ (statt der englischen Seite von GitHub).
    - In der App: Eine unbekannte Adresse (zum Beispiel `#/g/unbekannt` oder `#/g/fff/gibtsnicht`) zeigt „Seite nicht gefunden“ mit Knopf „Zur Startseite“, statt still zur Startseite zu springen.
    Falls du etwas anderes meinst, beschreib es kurz.

### Tabs im Sheet sortieren (W6)

20. **Reihenfolge und Farben:**
    *Vorschlag:* Neue Datei `apps-script/Werkzeuge.gs` mit zwei Funktionen, die du nur im Editor von Hand ausführst (keine neue Bereitstellung nötig):
    `tabsSortieren` (nach Wichtigkeit: System-Tabs `Gruppen`, `Zugang`, `Einstellungen`, `Log`, dann die Daten in der Reihenfolge der Reiter, ganz hinten `Posts` und `Projekt_Team`)
    und `tabsSortierenAZ` (nach dem Alphabet). Dazu bekommt jeder Bereich eine ruhige Farbe am Tab-Reiter (System grau, Projekte grün …). Tabs, die das Skript nicht kennt, kommen ans Ende.
    Daten und Spaltenköpfe ändern sich nicht.

### CSS (W3)

21. **Eine Datei oder mehrere?**
    *Vorschlag:* `css/components.css` wird in mehrere Dateien je Bereich geteilt (zum Beispiel `css/bausteine.css`, `css/start.css`, `css/kalender.css`, `css/dunkel.css`, `css/druck.css`).
    Doppelte Regeln werden zusammengefasst, ungenutzte fallen weg. **Das Aussehen ändert sich nicht:** Ich vergleiche Bildschirmfotos aller Reiter und Seiten (Handy und PC, hell und dunkel) vorher und nachher.
    *Andere Möglichkeit:* eine Datei mit klaren Abschnitten.
22. **Neue Regel für CSS danach:** Bisher gilt „neue Regeln ans Ende von `css/components.css` anhängen“ (auch in deinen Projektanweisungen).
    *Vorschlag:* Ab 12.12 kommen neue Regeln in die passende Datei bzw. den passenden Abschnitt, mit Kommentar und Version. Die Arbeitsregeln in `docs/STAND.md` und der Text für die Projektanweisungen (Rückfrage 8) werden angepasst.
    Für deine Arbeit im Browser heißt das: Ich nenne dann immer Datei und Abschnitt, in den du einfügst.

### Für dich vor 1.0

23. **`[Kontakt]` in `texte/anleitung/zustaendig.txt`:** Was soll dort stehen? *Vorschlag:* Die beiden Zeilen mit `[Kontakt]` fallen weg, der Signal-Knopf darunter reicht als Kontakt.

## 5. Datenmodell

Keine neuen Tabs oder Spalten. Bei Rückfrage 12 (Zwischenspeicher im Skript) ändern sich vielleicht `.gs`-Dateien, nicht das Sheet.
`apps-script/Werkzeuge.gs` (12.11) ändert nur Reihenfolge und Farbe der Tabs, keine Daten und keine Spaltenköpfe.

## 6. Schritte (Vorschlag)

### 12.1 – Plan Fassung 2 (nur Doku, dieser Schritt)

Version: 0.33.16. Diese Datei als Fassung 2 mit Rückfragen. `docs/STAND.md` und `CLAUDE.md` zeigen auf Fassung 2. Sheet und Skript bleiben unverändert.

**Prüfen:** App läuft wie vorher, unter „Info“ steht 0.33.16.

### 12.2 – Eine Datei für Stand, Regeln und Pläne (W4, W5)

Version: 0.34.0 (neuer Hauptschritt). Sheet und Skript bleiben unverändert.

1. Plan Fassung 3: Antworten aus Abschnitt 4 als Entscheidungen in Abschnitt 3.
2. `docs/STAND.md` neu aufbauen: Arbeitsregeln (aus `CLAUDE.md`), Aufbau, aktueller Stand, Festlegungen, Offen, Dateiübersicht, kurze Geschichte je Etappe, Pläne (Rückfragen 5 bis 7).
3. `CLAUDE.md` wird kurz und zeigt auf `docs/STAND.md` (oder umgekehrt, je nach Rückfrage 5).
4. Löschen: `docs/PLAN-ETAPPE-7.md` bis `docs/PLAN-ETAPPE-11.md`, je nach Rückfrage 7 `docs/STANDARD-TODOS.md` und `docs/MOBI-STANDARD-BEITRAEGE.md`, die vier Bildschirmfotos im Hauptordner.
5. Text für die Projektanweisungen im Pull Request (Rückfrage 8).

**Prüfen:** In `docs/` steht nur noch `STAND.md` (und bis zum Ende der Etappe dieser Plan). Die App läuft wie vorher.

### 12.3 – Prüfbericht (nichts an der App ändern, W1, W2, W7)

Version: 0.34.1. Sheet und Skript bleiben unverändert.

1. Bericht in den Projektdateien (`pruefung/pruefbericht-12.md`, Rückfrage 3) mit allen Funden zu Geschwindigkeit, Sicherheit, Barrierefreiheit, CSS (doppelte und ungenutzte Regeln) und ungenutztem Code.
2. Sicherheit: `/security-review` über den ganzen Code, Strix in der Testumgebung (Rückfrage 9), Prüfung von Hand (Token, PIN, Rechte je Gruppe, Aktionen ohne Login, Eingaben, Formeln, Service Worker, Abrufe nach außen).
   Dazu „Was könnte kaputt gehen?“: Stellen mit möglichem Datenverlust und wie man von Hand zurückkommt.
   Dazu eine **Checkliste für dich**: Freigabe von Sheet und Drive-Ordner, Bereitstellung des Skripts („Ausführen als“, „Wer hat Zugriff“), wer im Repo schreiben darf, Schutz des Zweigs `main`.
3. Geschwindigkeit: Ladezeiten im Testbrowser mit gedrosseltem Netz (Handy und PC), Zahl der Anfragen je Reiter, Größe der Dateien, Vorschlag für den Editor-Test `messenSkript`.
4. Barrierefreiheit: Liste „Problem, wo, wer betroffen, Lösung, Aufwand“ (Rückfrage 14).
5. Aufräumen: Liste der sicher ungenutzten Funktionen, Dateien und CSS-Regeln (Rückfrage 13).

**Prüfen:** Bericht lesen, Funde freigeben, Checkliste abarbeiten.

### 12.4 – Sicherheit (W2)

Version: 0.34.2. Je nach Funden mit Skript-Änderung (dann „Von Hand zu erledigen“).

1. Freigegebene Funde beheben.
2. Content-Security-Policy in `index.html` (Rückfrage 10).
3. Editor-Test für die Rechte je Gruppe (eine Gruppe kann keine Daten einer anderen lesen oder ändern).

**Prüfen:** Alle Reiter, öffentliche Seiten, Bilder, Kalender-Abo und Signal-Knopf laufen wie vorher.

### 12.5 – Geschwindigkeit (W1)

Version: 0.34.3. Mit Skript-Änderung nur, wenn Rückfrage 12 „ja“ ergibt.

1. Je nach Rückfrage 11: Service Worker mit „zuerst Zwischenspeicher“ und Hinweis „Neue Version da – jetzt neu laden“.
2. Freigegebene Funde aus dem Bericht (weniger doppelte Anfragen, weniger Neuzeichnen).
3. Bei Bedarf: Zwischenspeicher im Skript und Editor-Test `messenSkript`.

**Prüfen:** Zweites Öffnen am Handy fühlt sich schneller an. Nach einem Update erscheint der Hinweis, ein Tipp darauf zeigt die neue Version.

### 12.6 – Ungenutztes löschen (W4)

Version: 0.34.4. Sheet und Skript bleiben unverändert (außer der Bericht findet ungenutzte Skript-Funktionen, dann „Von Hand zu erledigen“).

1. Freigegebene Liste aus dem Bericht: Funktionen, Dateien, `HUELLE`-Einträge, CSS-Regeln aus 2.1.

**Prüfen:** Alle Reiter und öffentlichen Seiten laufen wie vorher.

### 12.7 – Barrierefreiheit (W7)

Version: 0.34.5. Sheet und Skript bleiben unverändert.

1. Freigegebene Funde aus der Liste (Beschriftungen, Fokus, Kontraste, Überschriften, weniger Bewegung, Zoom).
2. Kurze Anleitung für einen Test mit Bildschirmleser in `texte/anleitung/fragen.txt`.

**Prüfen:** Große Schrift am Handy, Bedienung nur mit Tastatur am PC, auf Wunsch Bildschirmleser.

### 12.8 – Layout am PC und beim Rauszoomen (W8)

Version: 0.34.6. Sheet und Skript bleiben unverändert.

1. `css/layout.css`: Grenze von 1400 px fällt weg, Seitenleiste und Inhalt füllen den Bildschirm, mehr Spalten bei viel Platz, Lesetexte mit fester Zeilenlänge (Rückfragen 15 und 16).
2. `js/ui/nav.js`: Reiter, die in der Seitenleiste nicht mehr passen, wandern in „Mehr ▾“ zum Ausklappen.
3. Anleitung `texte/anleitung/erste-schritte.txt` anpassen, falls sich die Bedienung der Seitenleiste ändert.

**Prüfen:** Am PC auf 67 %, 50 % und 33 % rauszoomen: Alles füllt den Bildschirm, mehr Spalten statt leerem Rand. Fenster niedrig ziehen oder auf 200 % zoomen: „Mehr ▾“ erscheint. Bei 100 % sieht alles fast aus wie vorher.

### 12.9 – App-Icon und Ladebildschirm (W9)

Version: 0.34.7. Sheet und Skript bleiben unverändert.

1. Neue Dateien `icons/icon-maskable.svg`, `icons/icon-maskable-192.png`, `icons/icon-maskable-512.png`, neues `icons/apple-touch-icon.png` (Rückfrage 17), je nach Rückfrage 18 Startbilder fürs iPhone.
2. `manifest.webmanifest`: maskable Icons, `background_color` grau. `index.html`: Verweise. Alle neuen Dateien in `HUELLE`.

**Prüfen:** App vom Startbildschirm löschen und neu hinzufügen: Das Icon füllt die Fläche, kein weißer Kreis. Beim Öffnen erscheint der graue Ladebildschirm mit Logo.

### 12.10 – Fehlerseite „Seite nicht gefunden“ (W10)

Version: 0.34.8. Sheet und Skript bleiben unverändert.

1. Neue Datei `404.html` (Rückfrage 19). In `js/app.js` eine Anzeige „Seite nicht gefunden“ für unbekannte Adressen.

**Prüfen:** `…/aktionsdeck-landau/xyz` und `#/g/unbekannt` zeigen die deutsche Fehlerseite mit Knopf zur Startseite.

### 12.11 – Tabs im Sheet sortieren (W6)

Version: 0.34.9. **Skript-Datei neu**, aber keine neue Bereitstellung nötig.

1. Neue Datei `apps-script/Werkzeuge.gs` mit `tabsSortieren`, `tabsSortierenAZ` und Farben (Rückfrage 20). Nur für den Editor.

**Prüfen:** Im Editor `tabsSortieren` ausführen: Die Tabs stehen in der neuen Reihenfolge und Farbe, die App läuft wie vorher.

### 12.12 – CSS ordnen (W3)

Version: 0.34.10. Sheet und Skript bleiben unverändert.

1. CSS nach Bereichen ordnen und je nach Rückfrage 21 auf mehrere Dateien verteilen, doppelte Regeln zusammenfassen, ungenutzte entfernen.
2. Vergleich der Bildschirmfotos vorher und nachher (alle Reiter und Seiten, Handy und PC, hell und dunkel, Druck).
3. Neue Regel für CSS in `docs/STAND.md` (Rückfrage 22).

**Prüfen:** Alles sieht aus wie vorher. Wenn dir doch etwas anders vorkommt: Reiter, Breite und Modus melden.

### 12.13 – Abschluss und Version 1.0.0

Version: 1.0.0. Sheet und Skript bleiben unverändert.

1. Vorher von dir: Testdaten im Sheet löschen (`testdatenListe`), `[Kontakt]` geklärt (Rückfrage 23), Datenschutztext geprüft.
2. GitHub Actions kontrollieren (laufen grün, keine Warnungen).
3. `docs/STAND.md`: Etappe 12 zusammengefasst, Plan 12 eingearbeitet, `docs/PLAN-ETAPPE-12.md` gelöscht. `texte/entwicklung.txt`: Etappe 12 und Version 1.0.

**Prüfen:** Nach dem Merge ist die Action grün, die Seite ist da, unter „Info“ steht 1.0.0.

## 7. Regeln und Risiken für Etappe 12

- **Nichts kaputt machen:** Jeder Schritt wird vor dem Pull Request im Testbrowser mit allen Reitern und öffentlichen Seiten bei Handy- und PC-Breite, hell und dunkel, geprüft.
- **Aussehen gleich lassen**, außer bei Layout, Icon, Fehlerseite und Barrierefreiheit. Beim CSS entscheidet der Vergleich der Bildschirmfotos.
- **Service Worker:** Ein Fehler kann die App auf alten Dateien festhalten. Darum: neue Version = neuer Name des Zwischenspeichers (wie bisher), und der Hinweis „Neue Version da“ wird extra getestet.
- **Content-Security-Policy:** Eine zu strenge Regel sperrt Teile der App. Darum alle Reiter testen und im Pull Request genau sagen, was erlaubt ist.
- **Sicherheitsfunde:** stehen nur im Bericht in den Projektdateien, nicht im öffentlichen Repo, bis sie behoben sind.
- **Prüfwerkzeuge** (Strix, Barrierefreiheit, Messungen) laufen nur in der Testumgebung des Agenten. Sie kommen nicht ins Repo und greifen nie das echte Skript oder Sheet an.
- **Löschen:** Gelöscht wird nur, was der Bericht als ungenutzt nachweist und die Person freigibt. Alles bleibt in der Geschichte des Repos.
- **Kein Build, keine Pakete in der App.**
- **Nicht vom Agenten prüfbar:** echte Ladezeiten am Handy, Freigaben in Google und GitHub, Bildschirmleser auf echten Geräten, Icon und Ladebildschirm auf dem echten Startbildschirm.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Wunsch | Version | Sheet/Skript |
|---|---|---|---|---|
| 12.0 | Plan Fassung 1 (erledigt als 11.0) | | 0.32.10 | nein |
| 12.1 | Plan Fassung 2 mit Rückfragen | | 0.33.16 | nein |
| 12.2 | Eine Datei für Stand, Regeln und Pläne | W4, W5 | 0.34.0 | nein |
| 12.3 | Prüfbericht (in den Projektdateien) | W1, W2, W7 | 0.34.1 | nein |
| 12.4 | Sicherheit, Content-Security-Policy | W2 | 0.34.2 | vielleicht |
| 12.5 | Geschwindigkeit | W1 | 0.34.3 | vielleicht |
| 12.6 | Ungenutztes löschen | W4 | 0.34.4 | vielleicht |
| 12.7 | Barrierefreiheit | W7 | 0.34.5 | nein |
| 12.8 | Layout am PC und beim Rauszoomen | W8 | 0.34.6 | nein |
| 12.9 | App-Icon und Ladebildschirm | W9 | 0.34.7 | nein |
| 12.10 | Fehlerseite „Seite nicht gefunden“ | W10 | 0.34.8 | nein |
| 12.11 | Tabs im Sheet sortieren (`Werkzeuge.gs`) | W6 | 0.34.9 | Skript-Datei neu, keine Bereitstellung |
| 12.12 | CSS ordnen | W3 | 0.34.10 | nein |
| 12.13 | Abschluss, Version 1.0.0 | | 1.0.0 | nein |

Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.
Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.
