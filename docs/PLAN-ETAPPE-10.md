# Plan Etappe 10: Wiki und öffentliche Seiten (Fassung 2, 23.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: Fassung 2.** Die Person hat die 31 Rückfragen aus Fassung 1 am 23.10.2026 beantwortet (Abschnitt 3). „Plan ist gut.“
Fassung 2 (eigentlich Schritt 10.0a) kommt im selben Pull Request wie Schritt 10.1, damit Plan und Skript zusammenpassen.
**Erledigt:** 10.0 (Version 0.31.10, Fassung 1, Pull Request #37, gemergt). 10.1 (Version 0.32.0, Pull Request #38, gemergt). 10.2 (Version 0.32.1, Pull Request #39, gemergt). 10.3 bis 10.9 baut der Agent am 23.10.2026 nacheinander, je Schritt ein Pull Request (Auftrag der Person).
Die kleinen Fragen A bis D (Abschnitt 4) sind am 23.10.2026 beantwortet.

## 1. Ziel

- **Wiki statt Hilfe:** Ein neuer Reiter **„Wiki“** (📖, Adresse `#/g/<kurz>/wiki`) ersetzt den Reiter „Hilfe“. Oben stehen drei Knöpfe nebeneinander:
  - **Skillshare:** Wissen der Gruppe, zum Beispiel „Demo anmelden“, „Pressemitteilung schreiben“. Nach festen **Themen** geordnet. Alle in der Gruppe schreiben und ändern.
  - **Anleitung:** So funktioniert die App (für alle Gruppen gleich, kommt mit der App). Dazu eigene Seiten der Gruppe, zum Beispiel **„Gruppe intern“** (mit „+“ und „Bearbeiten“).
    Die bisherige Hilfe zum Team wird eine Anleitungsseite.
  - **Entwicklung App:** Verlauf der Updates der App (was in welcher Version neu ist) und wer die App entwickelt hat. Öffentlich.
- **Öffentlicher Bereich:** Eine Seite aus Skillshare oder Anleitung kann die Gruppe **öffentlich** machen. Dann ist sie ohne Login lesbar (Seite `#/wiki`).
  „Entwicklung App“ und die Anleitungsseite „Erste Schritte“ sind immer öffentlich. Die Auslieferung läuft wie bei den Terminen über eine Aktion ohne Login.
- **Bilder** in Wiki-Seiten (hochladen wie beim Material), mit Hinweis: keine Personen, keine persönlichen Daten.
- **Rechtliches und Info:** Die öffentlichen Seiten **Impressum, Info, Datenschutz** (`#/info/<seite>`) bekommen echte Texte.
  Der Datenschutztext bekommt einen Absatz zum Reiter Team.
- **Kalender-Abo:** Das Abo der öffentlichen Termine bekommt Knöpfe für Google und Apple. Die Person testet es.

## 2. Ausgangslage (im Repo geprüft am 23.10.2026, Version 0.31.9 bzw. 0.31.10)

`js/config.js` und `sw.js` hatten beide `0.31.9`, wie `docs/STAND.md`. Mit 10.0 wurde es 0.31.10, mit 10.1 wird es 0.32.0.

**Wichtiger Fund (Widerspruch zum Stand):** `docs/STAND.md` sprach von „Texten aus 6.1“ für Impressum, Info und Datenschutz.
**Diese Texte gibt es im Repo nicht** (auch nicht in der Git-Geschichte). `js/views/info.js` zeigt nur den Platzhalter „Dieser Text kommt in Schritt 6.1.“
Die Texte werden in 10.2 neu geschrieben.

Was es schon gibt und wiederverwendet wird:

- **`js/views/info.js`** (`#/info/<seite>`, ohne Login): Menü aus `OEFFENTLICH` (`js/ui/nav.js`), Karte, „← Zurück zur App“ bzw. „← Zur Gruppenwahl“, Version bei „Info“. Aufbau bleibt.
- **`js/views/hilfe.js`**: fester Text `TEAM_HILFE` (`[Überschrift, Absätze]`, „- “ = Listenpunkt). Wird Anleitungsseite „Team“, danach gelöscht (10.3).
- **`js/views/termine.js`, `js/views/termine-liste.js`:** Vorbild für eine öffentliche Seite ohne Login (`ladeOeffentlich` mit `ladeMitCache('oeffentlich:termine', …, true)`,
  `api('termine', {})` ohne Token, `abonnierLink(kurz)`). `sichereUrl` aus `js/views/kalender-rechnen.js`.
- **`apps-script/Termine.gs`:** Vorbild für eine Aktion ohne Login (feste Felder, nur aktive Gruppen, strenger Gruppenfilter, ein Zwischenspeicher-Eintrag, Editor-Tests).
  Die Helfer `tLink`, `tInstagram`, `tLinks`, `tFarbe`, `tPad` sind im ganzen Skript sichtbar und werden in `Wiki.gs` **wiederverwendet**.
- **`js/ui/nav.js`:** `TABS` (Reiter `hilfe`), `OEFFENTLICH`, `oeffentlicheLinks()`. `js/views/mehr.js` zeigt `hilfe` am Handy. `js/config.js`: `features.hilfe`.
- **`js/app.js`:** öffentliche Wege `#/info/…` und `#/termine` vor dem Login-Teil. `ctx.unter` nur für `projekte`, `protokoll`, `team`.
- **Tab `Gruppen`:** `webseite, instagram, weitere_links` sind öffentlich gedacht, kommen aber nur über `Termine.gs` heraus (`gruppen` gibt nur Name, Kurzname, Farbe).
- **Fotos** (`apps-script/Upload.gs`, `aktionUploadImage`): JPEG wird im Drive-Ordner der Gruppe (`FOTO_ORDNER_<gruppe_id>`) gespeichert und **für alle mit Link lesbar** gemacht.
  Die App zeigt es über `https://drive.google.com/thumbnail?id=<id>&sz=w800` (`js/views/material-detail.js`). Verkleinern im Browser: `verkleinern` in `js/ui/bild.js`.
  Der Dateiname beginnt heute immer mit `material_`, das Log schreibt `Material`. **Wiederverwendung** für Wiki-Bilder (mit `zweck: 'wiki'`).
- **Kommentare** (`js/ui/kommentare.js`, `baueKommentare`): `art` ist frei, das Skript prüft `bezug_art` nicht. Für Wiki-Seiten `art: 'wiki'`.
- **Formulare** (`js/ui/form.js`): `langtext` ohne Vorschau. Für den Wiki-Text braucht es ein eigenes Eingabefeld (wie `js/views/rede-text.js`).
- **Entwürfe im Gerät** (`js/store.js`): Muster für Protokoll und Rede, `gibtEntwurf`, `loescheAlleEntwuerfe`.
- **Skript:** Textfelder höchstens 5000 Zeichen (`MAX_TEXT`), Ausnahmen in `MAX_TEXT_AUSNAHMEN`. `oeffentlich` steht schon in `BOOL_SPALTEN`.
  `CacheService` speichert höchstens 100 KB je Eintrag. Aufräumen (`apps-script/Aufraeumen.gs`) läuft über alle Tabs in `TABELLEN`, also auch über `Wiki`.
- **`js/api.js` schickt den Anzeigenamen immer mit**, auch ohne Token. Öffentliche Aktionen lesen und speichern ihn nicht.
- **GitHub Pages** baut mit Jekyll. `.txt`-Dateien werden unverändert ausgeliefert. **Alle Dateien der App sind öffentlich abrufbar**, wenn man die Adresse kennt (auch die Anleitung).

## 3. Entscheidungen der Person (23.10.2026)

1. Reiter **„Wiki“** statt „Hilfe“, kurze Adresse mit `wiki` (`#/g/<kurz>/wiki`). Alte Adressen `…/hilfe` führen zum Wiki.
2. **„Gruppe intern“** gibt es, und zwar **unter „Anleitung“**. Sie ist **gruppenspezifisch** (eigene Seite der Gruppe im Sheet) und **allgemein** (feste Seite
   „Zuständig für die App“: wer Adminzugriff auf Sheet und Skript hat, wer die App entwickelt hat; mit Platzhaltern, siehe 20).
3. **Themen fest** (feste Liste in der App, nicht frei). Was sie tun: Sie ordnen die Seiten in der Liste in Aufklapper und helfen beim Suchen.
4. Themen **nach Alphabet**. Liste der Person (Antwort A): Aktionen und Demos · Anmeldung · Finanzen und Förderung · Gruppe und Treffen · Material · Mobi · Presse · Recht · Social Media · Technik · Sonstiges (immer zuletzt).
   Die Liste ist in der App **nicht** bearbeitbar. Eine Änderung macht der Agent in `js/views/wiki-rechnen.js` (das Sheet bleibt gleich).
5. Suche wie vorgeschlagen (Titel, Thema, Text; Ausschnitt mit dem Suchwort).
6. **Aufbau des Reiters:** drei Knöpfe in einer Reihe, die zusammen die ganze Breite füllen: **Skillshare, Anleitung, Entwicklung App**.
   Leicht unterschiedliche, ruhige Farben (keine grellen). Die Knöpfe zeigen keine weiteren Angaben. Der gewählte Knopf bleibt markiert.
   Darunter stehen die **Suche** und der **Inhalt** des Bereichs. In Skillshare und Anleitung gibt es „+ Seite“ und „Bearbeiten“.
7. Alle mit dem Gruppen-PIN schreiben, ändern und löschen. Lange Texte im Sheet: siehe Antwort unten.
8. **Kein Verlauf** (kein Archiv alter Fassungen). Löschen ist weich.
9. Gleichzeitiges Bearbeiten wie vorgeschlagen (Konflikt-Hinweis, eigener Text bleibt, Entwurf im Gerät).
10. Text höchstens 20 000 Zeichen, Titel höchstens 80. Links: Adresse einfach einfügen, sie wird von selbst ein Link.
11. Textformat wie vorgeschlagen. Dazu **Knöpfe über dem Textfeld**, die die Auszeichnung an der Cursorstelle einfügen
    (zum Beispiel „Ü1“ fügt `## Überschrift 1` ein). Im Textfeld bleibt es einfacher Text, in der Vorschau und auf der Seite ist die Überschrift groß und fett.
12. Vorschau am PC daneben, am Handy mit Umschalter. Sie aktualisiert sich **beim Tippen** (kurz nach jedem Tastendruck).
13. **Bilder jetzt.** Beim Einfügen ein Hinweis: keine Personen, keine persönlichen Daten.
14. Inhaltsverzeichnis ab 3 Überschriften.
15. Haken „Öffentlich“ je Seite, Standard aus, mit Warnsatz. 15a: Von der Anleitung ist „Erste Schritte“ öffentlich.
16. Seiten gehören einer Gruppe. Teilen mit anderen Gruppen = öffentlich machen.
17. Öffentliche Adresse `#/wiki/<gruppe>/<adresse>`, Adresse bleibt beim Umbenennen, „Link kopieren“.
18. Link heißt **„Wiki“** (nicht „Wissen“). **„Entwicklung App“ (Verlauf der Updates) ist immer öffentlich.**
19. Frage der Person: „Anleitung öffentlich und in GitHub? Dann nicht bearbeitbar per App?“ **Antwort:** Ja. Die App-Anleitung liegt als Textdateien im Repo.
    Sie ist in der App nur lesbar; ändern geht auf GitHub oder über den Agenten. Technisch kann jede Person die Dateien lesen, die die Adresse kennt (wie alle Dateien der App).
    Darum steht dort nie etwas Internes. **Bearbeitbar in der App** sind die eigenen Anleitungsseiten der Gruppe (zum Beispiel „Gruppe intern“), die liegen im Sheet und sind nur mit PIN sichtbar.
20. Impressum mit **Platzhaltern** (`[Name]`, `[Anschrift]`, `[E-Mail]`), die die Person auf GitHub selbst ausfüllt. **Gleich freischalten** (kein Sperr-Hinweis).
    Das Ausfüllen kommt als ToDo für die Person in `docs/STAND.md` (Abschnitt „Offen“). Dasselbe gilt für die Seite „Zuständig für die App“.
21. Datenschutz: Entwurf nach der echten Technik. Vorlage: Die Webseite von FFF Landau hat ein Impressum unter https://fridaysforfuture-landau.de/kontakt/impressum.
    (10.2: Der Agent konnte die Seite nicht öffnen, seine Umgebung sperrt diese Adresse. Das Impressum der App verlinkt sie nur.)
22. Info-Seite wie vorgeschlagen, mit „Wiki“ statt „Wissen“, **ohne Veranstaltungen** (kein Link auf die Termine).
23. Team-Hilfe wird Anleitungsseite, `js/views/hilfe.js` wird gelöscht.
24. Anleitung: „Erste Schritte“, je Reiter eine Seite, „Häufige Fragen“. Neue Funktionen ergänzen die passende Anleitungsseite im selben Pull Request.
25. Skillshare am Anfang **leer**, „+ Seite“. **Keine Vorlagen.**
26. Kommentare unter Wiki-Seiten (nur intern).
27. **Kein** Abschnitt „Wiki“ in „Was ist neu?“.
28. Keine Verknüpfungen mit Learnings oder Projekten.
29. Knöpfe „In Google Kalender öffnen“ und „In Apple Kalender öffnen“, die Person testet.
30. **Kein** Ausweg über GitHub Actions (erstmal nicht).
31. Alles im Inhalt, **kein Detailbereich rechts** (keine Seitenleiste für das Wiki).

**Antworten auf die Fragen der Person:**
- *„Machen lange Texte in einem Sheet Sinn?“* Ja, für ein kleines Wiki schon. Eine Zelle fasst 50 000 Zeichen, wir erlauben 20 000 (etwa 8 Seiten A4).
  Protokolle und Reden machen es schon so. Im Sheet sieht eine Seite wie eine lange Zelle aus, gelesen und geschrieben wird in der App.
  Grenze: Bei sehr vielen langen Seiten lädt der Reiter langsamer. Bei einigen Dutzend Seiten ist das kein Problem.
- *„Links kann ich dann normal einfügen?“* Ja. Adresse einfügen genügt. Mit dem Knopf „Link“ geht auch ein Link mit eigenem Text.
- *„Ist die Überschrift dann automatisch fett?“* Im Textfeld steht `## Überschrift 1` als einfacher Text. In der Vorschau und auf der Seite ist sie groß und fett.
- *„Wie oft aktualisiert die Vorschau?“* Live beim Tippen.

## 4. Kleine Fragen der zweiten Runde

**Antworten der Person (23.10.2026):**
- A: Themen wie in Abschnitt 3, Punkt 4 (Anmeldung und Recht getrennt, Material und Technik getrennt, Mobi und Social Media getrennt). Frage der Person: „Ist die Liste in der App nicht zu bearbeiten?“ Antwort: Ja, so ist „fest“ gemeint. Wer ein neues Thema braucht, sagt es dem Agenten. Wenn die Gruppe Themen später selbst pflegen will, geht das wie bei den Gruppen-Rollen (eigener Tab, neue Bereitstellung).
- B: „Entwicklung App“ fasst **bis zum Ende von Etappe 10 alles je Etappe** zusammen. Eine Zeile je Version kommt erst **nach Version 1.0** (dann automatisch in jedem Pull Request).
- C: wie Vorschlag.
- D: wie Vorschlag. Frage der Person: „Kann ich Bilder im Sheet weich wiederherstellen?“ Antwort: Die Bilder liegen nicht im Sheet, sondern im Drive-Ordner der Gruppe und bleiben dort. Eine gelöschte Seite holt man im Sheet zurück (Spalte `geloescht` auf FALSE), dann sind auch ihre Bilder wieder da. Wurde nur die Bild-Zeile aus dem Text genommen: Die Nummer des Bildes steht im Tab `Log` (Aktion `upload`, Tabelle `Wiki`, Spalte `datensatz_id`). Mit `![Beschreibung](bild:<Nummer>)` kommt es zurück.

Die Tabelle zeigt die Fragen mit den ursprünglichen Vorschlägen.

| Nr | Frage | Vorschlag |
|---|---|---|
| A | **Themen:** Passt die Liste aus Abschnitt 3, Punkt 4? Die Person hat eigene Ideen. | Liste aus Punkt 4. Eigene Themen bitte schicken, sie stehen nur in der App (`js/views/wiki-rechnen.js`), das Sheet bleibt gleich. |
| B | **„Entwicklung App“ pflegen:** Soll jeder Pull Request mit neuer Version eine Zeile in `texte/entwicklung.txt` ergänzen? | Ja, ab 10.6 als Regel in `CLAUDE.md` (kurzer Satz je Version, neueste oben). Ältere Versionen nur je Etappe zusammengefasst. |
| C | **Eigene Anleitungsseiten der Gruppe:** Wo stehen sie in der Liste? | Unter den festen Anleitungsseiten in einem eigenen Block „Von unserer Gruppe“, A–Z. Fehlt „Gruppe intern“, steht dort der Knopf „+ Gruppe intern anlegen“. |
| D | **Bilder löschen:** Wird ein Bild im Drive gelöscht, wenn man es aus dem Text nimmt? | Nein. Das Bild bleibt im Drive-Ordner der Gruppe (wie beim Material). Aufräumen von Hand im Drive. |

## 5. Datenmodell (gebaut in 10.1)

Die Person tippt den Tab **von Hand** ins Sheet (siehe CLAUDE.md Abschnitt 7). `gruppe_id` heißt wirklich so.

**Neuer Tab `Wiki`:** Basis-Spalten `id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht`, dahinter `bereich, thema, titel, adresse, text, oeffentlich`
- `bereich`: `skillshare` oder `anleitung` (eigene Anleitungsseite der Gruppe, zum Beispiel „Gruppe intern“). Pflicht.
- `thema`: Thema im Skillshare (feste Liste in der App, Abschnitt 3, Punkt 4). Bei `anleitung` leer. Höchstens 40 Zeichen. Das Skript prüft nur die Länge, damit die Liste ohne neue Bereitstellung änderbar bleibt.
  Ein unbekanntes Thema zeigt die App unter „Sonstiges“.
- `titel`: Pflicht, höchstens 80 Zeichen, in der Gruppe nur einmal (Groß- und Kleinschreibung egal). So finden Links `[[Titel]]` immer genau eine Seite.
- `adresse`: Pflicht, nur `a-z`, `0-9` und Bindestriche (nicht am Anfang oder Ende, keine zwei hintereinander), höchstens 60 Zeichen, in der Gruppe nur einmal. Die App macht sie beim Anlegen aus dem Titel.
- `text`: höchstens 20 000 Zeichen, Format aus Abschnitt 6.
- `oeffentlich`: TRUE = ohne Login lesbar.

**Kein** Tab `Wiki_Verlauf` (Entscheidung 8). Die App-Anleitung, „Entwicklung App“, Impressum, Info und Datenschutz liegen als Dateien im Repo (Ordner `texte/`), nicht im Sheet.

**Was das Skript dazu macht** (neue Datei `apps-script/Wiki.gs`, Hilfsfunktionen beginnen mit `wiki`):
- `wikiPruefen` in `create`, `batchCreate` und `update`: Bereich gültig, Titel da und eindeutig, Adresse gültig und eindeutig.
- `wikiKaskade` in `delete`: Seite gelöscht → ihre Kommentare (`bezug_art = wiki`, `bezug_id` = ID der Seite) werden mitgelöscht (weich).
- **Öffentliche Aktion `wiki`** (ohne Login, in `verteile` vor `tokenPruefen`, nur POST):
  - `{ aktion: 'wiki' }` → `{ seiten, gruppen }`. `seiten`: alle öffentlichen Seiten aller aktiven Gruppen **ohne Text**:
    `bereich, thema, titel, adresse, stand (JJJJ-MM-TT), kurzname, gruppe_name, farbe`. `gruppen`: alle aktiven Gruppen mit `name, kurzname, farbe, webseite, instagram, links` (für die Info-Seite).
  - `{ aktion: 'wiki', gruppe: 'fff', adresse: 'demo-anmelden' }` → `{ seite }` mit denselben Feldern und `text`. Gruppe (`[a-z0-9_-]`, höchstens 30) und Adresse werden streng geprüft.
    Nicht öffentliche, gelöschte oder unbekannte Seiten: Fehler `nicht_gefunden` („Seite nicht gefunden.“).
  - Keine IDs, keine Namen, keine Uhrzeiten. Der mitgeschickte Anzeigename wird nicht gelesen.
  - Zwischenspeicher: **ein** Eintrag für die Liste (`wiki_alle`, 2 Minuten). Seiten einzeln (`wiki_s_<gruppe>_<adresse>`, 2 Minuten),
    aber **nur für Seiten aus der Liste** (so kann niemand mit erfundenen Adressen den Speicher füllen). Grund für die Teilung: höchstens 100 KB je Eintrag.
- `apps-script/Upload.gs`: `uploadImage` nimmt `zweck: 'wiki'` an. Dann beginnt der Dateiname mit `wiki_` und das Log schreibt `Wiki`. Ohne `zweck` bleibt alles wie bisher (Material).
- Editor-Tests: `testenWiki` (Regeln mit Werten im Speicher, Spaltenköpfe `Wiki` und `Kommentare`, schreibt nichts) und
  `testenWikiSicher` (nur erlaubte Felder, nicht mehr Seiten als öffentlich im Sheet, ungültige Gruppen und Adressen abgelehnt, nicht öffentliche Seite wird nicht ausgeliefert).

Keine neuen Spalten in bestehenden Tabs.

## 6. Textformat (gebaut in 10.2, `js/wiki-format.js`)

Die App baut den Text selbst in Absätze, Überschriften, Listen und Links um. Ohne Bibliothek, nur mit `el()` und `textContent`.

| Schreibweise | Ergebnis | Knopf über dem Textfeld |
|---|---|---|
| Leerzeile | neuer Absatz | – |
| `## Überschrift` | große Überschrift (fett) | „Ü1“ |
| `### Unterüberschrift` | kleinere Überschrift (fett) | „Ü2“ |
| `- Punkt` | Liste | „• Liste“ |
| `1. Schritt` | nummerierte Liste | „1. Liste“ |
| `**fett**` | **fett** | „F“ |
| `https://…` | Link | – (einfach einfügen) |
| `[Text](https://…)` | Link mit eigenem Text | „Link“ |
| `[[Titel einer Seite]]` | Link auf eine andere Wiki-Seite (fehlt sie: grau mit „(fehlt)“) | „Wiki-Link“ |
| `> Hinweis` | grauer Hinweiskasten | „Hinweis“ |
| `![Beschreibung](bild:<id>)` (eigene Zeile) | Bild aus dem Drive-Ordner der Gruppe | „Bild“ (Datei wählen, Hinweis, hochladen) |

Nur `https://` und `http://` werden Links (`sichereUrl`). Alles andere bleibt Text, auch `<script>` oder `javascript:`. Keine Tabellen, Farben, HTML.
Ab 3 Überschriften steht oben ein Inhaltsverzeichnis.

## 7. Schritte

### 10.0 – Plan schreiben (nur Doku) – erledigt

Version: 0.31.10. Fassung 1 mit 31 Rückfragen, Pull Request #37.

### 10.1 – Plan Fassung 2, Sheet und Skript (einmal von Hand bereitstellen)

Version: 0.32.0. Hier steckt die ganze Handarbeit der Etappe. Danach braucht kein weiterer Schritt eine neue Bereitstellung.

1. Diese Datei als Fassung 2 (Abschnitte 3 bis 9).
2. `apps-script/Schema.gs`: neuer Tab `Wiki`, Höchstlängen in `MAX_TEXT_AUSNAHMEN` (`Wiki.bereich` 20, `Wiki.thema` 40, `Wiki.titel` 80, `Wiki.adresse` 60, `Wiki.text` 20000), Kommentar zum Tab.
3. `js/schema.js`: Eintrag `Wiki`.
4. Neue Datei `apps-script/Wiki.gs` (Abschnitt 5).
5. `apps-script/Daten.gs`: `wikiPruefen` in `create`, `batchCreate`, `update`; `wikiKaskade` in `delete`.
6. `apps-script/Code.gs`: Aktion `wiki` bei „Ohne Login“.
7. `apps-script/Upload.gs`: `zweck: 'wiki'`.
8. **Pull-Request-Abschnitt „Von Hand zu erledigen“** (genaue Liste im Pull Request).

**Prüfen:** App läuft wie vorher. `testenWiki` zeigt „Alles ok.“, `testenWikiSicher` zeigt „ALLES GUT“. Öffentliche Termine laden weiter. Foto beim Material hochladen geht weiter.

### 10.2 – Textformat und Rechtliches (Impressum, Info, Datenschutz)

Version: 0.32.1. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/wiki-format.js`: `zeichneText(text, opt)` (Abschnitt 6; `opt.seiteFinden(titel)` für `[[…]]`, `opt.bildUrl(id)`), `ueberschriften(text)`.
   Kleine Beispiele als Kommentar, mit `node` geprüft (auch: `<script>` bleibt Text, `javascript:`-Link wird kein Link).
2. Neue Dateien `texte/impressum.txt` (Platzhalter, Entscheidung 20), `texte/info.txt`, `texte/datenschutz.txt` (Inhalt nach Entscheidung 21, mit Absatz zum Team). Alle in `sw.js` (`HUELLE`).
   Datenschutz nennt auch: Bilder im Wiki kommen von Google Drive (beim Ansehen sieht Google die IP-Adresse).
3. `js/views/info.js`: lädt die passende Datei und zeigt sie mit `zeichneText`. Info-Seite: Gruppen mit Links (aus der Aktion `wiki`), Link „Wiki“ (ab 10.7), Version. Keine Termine.
4. `docs/STAND.md`, Abschnitt „Offen“: ToDo für die Person „Platzhalter im Impressum ausfüllen“.
5. CSS ans Ende von `css/components.css` (`/* ---- 0.32.1: Wiki-Text ---- */`).

**Prüfen:** `#/info/impressum`, `#/info/info`, `#/info/datenschutz` ohne Login, am Handy und am PC. Datenschutz enthält den Absatz zum Team. Info zeigt die Gruppen mit Links.

### 10.3 – Reiter Wiki (lesen, suchen)

Version: 0.32.2. Sheet und Skript bleiben unverändert.

1. `js/ui/nav.js`: in `TABS` `{ id: 'wiki', label: 'Wiki', icon: '📖' }` statt `hilfe`. `js/config.js`: `features.wiki` statt `features.hilfe`.
   `js/views/mehr.js`: `wiki` statt `hilfe`. `js/app.js`: `…/hilfe` → `wiki`; `ctx.unter` auch für `wiki`.
2. Neue Datei `js/views/wiki.js` (`render(container, ctx)`): drei Knöpfe (Entscheidung 6), darunter Suche und Inhalt. Alles im Inhalt, kein Detailbereich (Entscheidung 31).
   Der gewählte Bereich bleibt beim Reiterwechsel (Merker im Speicher). Lädt `Wiki` (Zwischenspeicher `gruppe_id:wiki`, `ladeMitCache`).
   - Skillshare: Themen A–Z als Aufklapper, Seiten A–Z. Leer: freundlicher Satz.
   - Anleitung: feste Seiten (Reihenfolge aus `texte/anleitung/liste.txt`), darunter „Von unserer Gruppe“ (Frage C).
   - Entwicklung App: `texte/entwicklung.txt` (mit „Wer hat die App entwickelt?“). Die Seite „Zuständig für die App“ steht unter Anleitung (Entscheidung 2).
   - Seite: Titel, Stand, Marke „🌐 öffentlich“, Inhaltsverzeichnis, Text. Oben „← Wiki“. Adressen `#/g/<kurz>/wiki/<seiten-id>` und `#/g/<kurz>/wiki/anleitung:<name>`.
   - Suche (Entscheidung 5) im gewählten Bereich, mit Ausschnitt.
3. Neue Datei `js/views/wiki-rechnen.js`: `THEMEN`, `sortiereSeiten`, `nachThema`, `findeSeite(titel)`, `adresseAus(titel)`, `passtSuche`, `ausschnitt`. Mit `node` geprüft.
4. Neue Dateien `texte/anleitung/liste.txt`, `texte/anleitung/team.txt` (Inhalt von `TEAM_HILFE`), `texte/entwicklung.txt` (erste Fassung: Etappen zusammengefasst),
   `texte/anleitung/zustaendig.txt` (Platzhalter, Entscheidung 2 und 20). Alle in `HUELLE`.
5. `js/views/team.js`: Link unten auf `wiki/anleitung:team`. **`js/views/hilfe.js` löschen** und aus `HUELLE` austragen.
6. CSS ans Ende.

**Prüfen:** Reiter „Wiki“ am PC in der Seitenleiste, am Handy unter „Mehr“. Drei Knöpfe füllen die Breite, der gewählte bleibt markiert. Alte Adresse `…/hilfe` öffnet das Wiki.
Anleitung „Team“ zeigt den bisherigen Hilfetext. Link im Reiter Team führt dorthin. Skillshare leer mit freundlichem Satz. Suche findet ein Wort aus der Anleitung.

### 10.4 – Seiten schreiben, Bilder

Version: 0.32.3. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/wiki-eintrag.js`: „+ Seite“ und „Bearbeiten“ (Skillshare und eigene Anleitungsseiten), im Inhalt:
   Titel, Thema (Auswahl aus der festen Liste, nur Skillshare), Knöpfe aus Abschnitt 6, Textfeld mit Zähler, Vorschau live (PC daneben, Handy „Schreiben | Vorschau“),
   „Öffentlich“ mit Warnsatz, unter „Mehr“: Adresse. „+ Gruppe intern anlegen“ (Frage C).
2. **Bild:** Datei wählen, Hinweis „Auf dem Bild sind keine Personen und keine persönlichen Daten.“ (Haken zum Bestätigen), Bildbeschreibung (Pflicht),
   verkleinern (`verkleinern`, 1000 px), `uploadImage` mit `zweck: 'wiki'`, fügt `![Beschreibung](bild:<id>)` an der Cursorstelle ein.
3. Speichern mit Konfliktprüfung (Entscheidung 9). Entwurf im Gerät (`js/store.js`, `aktionsdeck_entwurf_wiki_<gruppe_id>`, in `gibtEntwurf` und `loescheAlleEntwuerfe`).
   Keine Offline-Schreibzugriffe. Löschen mit Rückfrage (nennt „auch öffentlich“).
4. Meldungen vom Skript (Titel oder Adresse doppelt) stehen im Formular.

**Prüfen:** Seite anlegen mit Ü1, Liste, Link, Bild. Vorschau ändert sich beim Tippen. Zweites Gerät ändert dieselbe Seite: Konflikt-Hinweis, eigener Text bleibt.
Gleicher Titel zweimal: Meldung. Seite löschen.

### 10.5 – Kommentare und „Link kopieren“

Version: 0.32.4. Sheet und Skript bleiben unverändert.

1. Kommentare unter Seiten aus dem Sheet (`baueKommentare`, `art: 'wiki'`, Entscheidung 26). Marke „💬 n“ in der Liste. Nicht in „Was ist neu?“ (Entscheidung 27).
   `js/ui/neu-seit.js` zeigt Kommentare mit `art: 'wiki'` schon an; dort nur den Text „zu Wiki-Seite“ ergänzen, falls nötig.
2. „Link kopieren“ bei öffentlichen Seiten (öffentliche Adresse).

**Prüfen:** Kommentar an einer Seite, auf dem anderen Gerät sichtbar. Seite löschen: Kommentar ist weg.

### 10.6 – App-Anleitung und Entwicklung App schreiben

Version: 0.32.5. Sheet und Skript bleiben unverändert.

1. Neue Dateien `texte/anleitung/<seite>.txt`: Erste Schritte, Start, Projekte, ToDos und Hüte, Material, Mobi, Kalender, Dokumentation, Team (schon da), Wiki (mit Format-Hilfe), Häufige Fragen.
   Texte nach dem Stand im Code, keine erfundenen Abläufe der Gruppen. Alle in `HUELLE`, `liste.txt` ergänzt.
2. `texte/entwicklung.txt` vervollständigt (je Etappe zusammengefasst, Antwort B). `CLAUDE.md`: Regel „neue Funktion → Anleitungsseite ergänzen“. Die Regel „neue Version → Zeile in `texte/entwicklung.txt`“ gilt erst nach Version 1.0 (Antwort B).

**Prüfen:** Jede Anleitungsseite öffnet sich, Links zwischen den Seiten gehen. Inhalt lesen und Anmerkungen sammeln.

### 10.7 – Öffentliches Wiki (`#/wiki`)

Version: 0.32.6. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/wiki-oeffentlich.js` (`render(container, ctx)`): Aufbau wie `js/views/termine.js` (Balken, Zurück-Link).
   Übersicht: „Entwicklung App“, „Erste Schritte“, dann öffentliche Seiten nach Gruppe (Auswahl ab zwei Gruppen) und Thema. Seite `#/wiki/<gruppe>/<adresse>`.
   Laden mit `ladeMitCache('oeffentlich:wiki', …, true)` und `api('wiki', …)` ohne Token, Seiten einzeln `oeffentlich:wiki:<gruppe>:<adresse>`.
   Feste Seiten: `#/wiki/app/entwicklung` und `#/wiki/app/erste-schritte`.
2. `js/app.js`: Weg `#/wiki…` vor dem Login-Teil (wie `termine`). `js/ui/nav.js`: „Wiki“ in `oeffentlicheLinks()`. Info-Seite verlinkt das Wiki.
3. Links `[[…]]` auf öffentlichen Seiten führen nur auf andere öffentliche Seiten derselben Gruppe, sonst nur Text. Keine Kommentare, keine Namen.

**Prüfen:** Seite öffentlich machen. Im privaten Fenster (ohne Login) unter `#/wiki` erscheint sie nach höchstens 2 Minuten, ohne Namen und Kommentare. Bild ist sichtbar.
Haken wieder weg: Sie verschwindet nach höchstens 2 Minuten. Erfundene Adresse: „Seite nicht gefunden“. „Entwicklung App“ und „Erste Schritte“ sind ohne Login da.

### 10.8 – Kalender-Abo

Version: 0.32.7. Sheet und Skript bleiben unverändert.

1. `js/views/termine-liste.js`: neben der Abo-Adresse „In Google Kalender öffnen“ und „In Apple Kalender öffnen“ (`webcal://`).
2. Test-Anleitung für die Person im Pull Request (Google am PC, iPhone, Mac). Anleitung in `texte/anleitung/kalender.txt` ergänzt.
3. Ergebnis kommt in `docs/STAND.md`. Kein Ausweg über GitHub Actions (Entscheidung 30); klappt es nicht, wird neu entschieden.

**Prüfen:** Abo in Google Kalender und Apple Kalender anlegen. Eine neue öffentliche Veranstaltung erscheint (bei Google erst nach einigen Stunden). Ergebnis melden.

### 10.9 – Feinschliff und Abschluss

Version: 0.32.8. Sheet und Skript bleiben unverändert.

1. Anmerkungen aus den Prüfungen, soweit klein.
2. `docs/STAND.md`: Etappe 10 abschließen, Dateiübersicht, offene Punkte.
3. `CLAUDE.md`: Reiter „Wiki“ statt „Info/Hilfe“ in Abschnitt 1 und 5, Ordner `texte/`.

**Prüfen:** Alles aus 10.2 bis 10.8 läuft noch.

## 8. Regeln und Risiken für Etappe 10

- **Öffentlich heißt öffentlich:** Was auf einer öffentlichen Seite steht, kann jede Person lesen und speichern, auch wenn der Haken später weg ist.
  Standard „nicht öffentlich“, Warnsatz, Marke in der Liste. Keine Namen, keine Kommentare nach außen.
- **Dateien der App sind immer öffentlich abrufbar** (GitHub Pages). In `texte/` steht nie etwas Internes. Internes gehört in Seiten im Sheet.
- **Bilder:** Hochgeladene Bilder sind im Drive „für alle mit Link“ lesbar (wie beim Material), auch wenn die Seite nicht öffentlich ist.
  Darum der Hinweis „keine Personen, keine persönlichen Daten“. Ein Bild aus dem Text zu nehmen löscht es nicht im Drive.
- **Auslieferung ohne Login wie `Termine.gs`:** feste Felder, nur aktive Gruppen, strenge Prüfung von Gruppe und Adresse, Zwischenspeicher nur für vorhandene Seiten,
  Editor-Test `testenWikiSicher`. Die Aktion schreibt nichts und liest keinen Anzeigenamen.
- **Texte nur mit `textContent`:** Das Textformat baut DOM-Knoten selbst, kein `innerHTML`. Links nur mit `http(s)://`. Bild-IDs nur `[A-Za-z0-9_-]`.
  Das Skript schützt Werte mit `=`, `+`, `-`, `@` (ein Text, der mit „- “ beginnt, bekommt im Sheet ein Hochkomma; `aus` in `Util.gs` nimmt es beim Lesen weg).
- **Kein Verlauf:** Wer speichert, überschreibt. Schutz: Konfliktprüfung und Entwurf im Gerät. Das Log sagt, wer wann geändert hat.
- **Größe:** 20 000 Zeichen je Seite. `CacheService` höchstens 100 KB je Eintrag: darum Liste ohne Texte, Seiten einzeln.
- **Rechtliches:** Entwürfe nach der echten Technik, keine Rechtsberatung. Keine erfundenen Namen oder Adressen. Platzhalter bleiben sichtbar, bis die Person sie ersetzt.
- **Strenge Spaltenköpfe:** Beim Schreiben in `Wiki` und bei der öffentlichen Aktion prüft das Skript die Köpfe. Fehlt der Tab, lädt der Reiter Wiki keine Seiten aus dem Sheet (die Anleitung geht trotzdem).
  Wie immer: zuerst das Sheet, dann das Skript.
- **Nicht vom Agenten prüfbar:** Aussehen am Handy, echte Bereitstellung, Editor-Tests im echten Sheet, Kalender-Abo. Der Agent prüft Textformat und Rechenfunktionen mit `node`,
  das Skript mit einem nachgebauten Sheet, die Seiten im Browser mit erfundenen Daten.

## 9. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 10.0 | Plan Fassung 1 mit Rückfragen | 0.31.10 | nein |
| 10.1 | Plan Fassung 2; Tab `Wiki`, `Wiki.gs`, öffentliche Aktion `wiki`, Bilder | 0.32.0 | **ja, von Hand** |
| 10.2 | Textformat; Impressum, Info, Datenschutz (mit Absatz Team) | 0.32.1 | nein |
| 10.3 | Reiter Wiki (lesen, suchen), Anleitung „Team“, Hilfe entfällt | 0.32.2 | nein |
| 10.4 | Seiten schreiben, Bilder | 0.32.3 | nein |
| 10.5 | Kommentare, Link kopieren | 0.32.4 | nein |
| 10.6 | App-Anleitung und Entwicklung App | 0.32.5 | nein |
| 10.7 | Öffentliches Wiki `#/wiki` | 0.32.6 | nein |
| 10.8 | Kalender-Abo (Knöpfe Google und Apple, Test) | 0.32.7 | nein |
| 10.9 | Feinschliff, Abschluss | 0.32.8 | nein |

Die Versionen in dieser Tabelle sind die geplanten. Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.

**Echte Versionen und Pull Requests:**

| Schritt | Inhalt | Version | Pull Request |
|---|---|---|---|
| 10.0 | Plan Fassung 1 | 0.31.10 | #37 |
| 10.1 | Plan Fassung 2, Sheet und Skript | 0.32.0 | #38 |
| 10.2 | Textformat, Impressum, Info, Datenschutz; Antworten A bis D im Plan | 0.32.1 | #39 |
| 10.3 | Reiter Wiki lesen und suchen, Anleitung Team, Hilfe entfällt | 0.32.2 | #40 |
| 10.4 | Seiten schreiben, Bilder, Entwurf, Konflikt, Löschen | 0.32.3 | #41 |
| 10.5 | Kommentare, Marke 💬, Link kopieren | 0.32.4 | #42 |
| 10.6 | App-Anleitung für alle Reiter, Häufige Fragen, Regel in CLAUDE.md | 0.32.5 | – |

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.

## 10. Dateien der Etappe

- Neu: `apps-script/Wiki.gs`, `js/wiki-format.js`, `js/views/wiki.js`, `js/views/wiki-rechnen.js`, `js/views/wiki-eintrag.js`, `js/views/wiki-oeffentlich.js`,
  `texte/impressum.txt`, `texte/info.txt`, `texte/datenschutz.txt`, `texte/entwicklung.txt`, `texte/anleitung/*.txt`.
- Geändert: `apps-script/Schema.gs`, `apps-script/Daten.gs`, `apps-script/Code.gs`, `apps-script/Upload.gs`, `js/schema.js`, `js/ui/nav.js`, `js/config.js` (VERSION, `features`),
  `js/app.js`, `js/views/mehr.js`, `js/views/info.js`, `js/views/team.js`, `js/views/termine-liste.js`, `js/store.js`, `sw.js`, `css/components.css`, `docs/STAND.md`, `CLAUDE.md`.
- Gelöscht: `js/views/hilfe.js` (10.3).
