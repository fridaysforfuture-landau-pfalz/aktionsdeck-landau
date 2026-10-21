# Plan Etappe 7: Mobi (Stand 21.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

## 1. Worum es in Mobi geht

Mobi plant die Werbung für Aktionen und Veranstaltungen: Was wird wo und wann veröffentlicht, wer macht es, wie weit ist es.
Ein **Mobi-Beitrag** (Tab `Mobi_Plan`) ist eine Veröffentlichung auf einem Kanal. Er hängt an einem Projekt
oder an einer Veranstaltung. Social-Media-Posts werden in Canva gebaut. Im Beitrag steht nur ein Canva-Link
(ein Link pro Beitrag, kein Bild-Upload).

## 2. Was schon im Repo sein soll (letzte ausgelieferte Schritte)

Bitte zuerst prüfen, ob das wirklich im Repo steht. Prüfe `js/config.js` (VERSION) und `docs/STAND.md`.

- **7.1 (0.29.0) und 7.1a (0.29.1), Sheet und Skript:** Tab `Mobi_Plan` mit den Spalten
  `id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, projekt_id, veranstaltung_id, kanal, format,
  titel, text, kanal_text, hashtags, datum, uhrzeit, status, verantwortlich, canva_link, ergebnis, notiz`.
  Neue Spalten in `Projekte`: `zielgruppe, werbeart, kampagnenziel, handlungsaufruf, kanaele`. Neue Spalte in `ToDos`: `mobi_id`.
  `apps-script/Mobi.gs` prüft den Bezug (Projekt oder Veranstaltung) und löscht mit Verknüpfung (`mobiKaskade`):
  Beitrag gelöscht = seine ToDos (mit `mobi_id`) gehen mit. Veranstaltung gelöscht = ihre Beiträge und deren ToDos gehen mit.
  Mobi_Plan steht in `PROJEKT_ABHAENGIG` (geht beim Projekt-Löschen mit), nicht in `PROJEKT_PFLICHT`. Der alte Tab `Posts` ist ungenutzt.
- **7.2 (0.29.2):** `js/kanaele.js` (feste Kanalliste mit Farben und Zeichengrenzen, `kanaeleFuer`, `kanalInfo`,
  `FORMAT_TEXT`, `FORMAT_HINWEIS`, `leseKanaele`, `schreibeKanaele`), `js/views/mobi-eintrag.js` (Beitrag-Fenster mit
  Zeichenzähler, „Haupt-Text übernehmen", „Text kopieren", Löschen, Kommentare mit `bezug_art` = `mobi`),
  `js/views/mobi-plan.js` (Teil „Mobi" im Projekt), `js/views/mobi-rechnen.js`. Reiter „Posts" heißt jetzt „Mobi".
- **7.3 (0.29.3):** `js/views/mobi.js` (Reiter Mobi: Liste und Kanban, Filter, „Mehrere bearbeiten", Archiv, Zählzeile).
- **7.4 (0.29.4), laut Person im Repo (21.10.2026):** Vorlagen „Mobi: Demo / Großaktion" und „Mobi: Infostand / kleine Aktion" mit Bausteinen
  (`js/vorlagen.js`, `js/views/mobi-vorlage.js`, Änderungen in `projekt-todos.js` und `todos-abhaken.js`), Tausch in der unteren
  Leiste (Mobi statt Material), Abschnitt „Zugehörige ToDos" im Beitrag.
  **Ob 7.4 im Repo ist, ist nicht sicher.** Steht VERSION auf 0.29.3 oder tiefer, ist 7.4 nicht drin.
  Dann übernimmst du aus 7.4 **nur den Tausch** (`js/ui/nav.js`: `UNTEN = ['start', 'projekte', 'todos', 'mobi']`,
  `js/views/mehr.js`: Filter `['material', 'kalender', 'hilfe']`) und baust die Bausteine **nicht**, denn sie werden in Schritt 7.5 ohnehin zurückgebaut.
  Die alte Meilenstein-Vorlage „Mobi" (mit den eigenen Schritten der Gruppe) bleibt in jedem Fall unverändert.

## 3. Entscheidungen der Person (bestätigt)

1. Der Reiter „Posts" heißt „Mobi". Der Reiter „Kalender" bleibt dauerhaft.
2. Der Plan kommt **ohne** feste „Pakete". Standard-Beiträge werden stattdessen über „+ Beiträge" mit Kanalauswahl angelegt (Schritt 7.5).
3. Keine Start-Kachel für Mobi. Mobi erscheint auf dem Start nur über ToDos (Schritt 7.6).
4. Storys sind einzelne Einträge. Jede Story wird einzeln geplant.
5. Pro Beitrag ein Canva-Link.
6. Wird ein Beitrag gelöscht, gehen seine verknüpften ToDos mit. Wird eine Veranstaltung gelöscht, gehen ihre Beiträge mit.
7. Die Option „Zusatzkanal" braucht es nicht. Im Projekt müssen nicht alle Kanäle dauerhaft sichtbar sein.
8. Formate werden groß geschrieben angezeigt (Beitrag, Reel, Story …). Gespeichert wird weiter klein.
9. Nicht jeder Beitrag wird ein ToDo. ToDos sind nur eine Zusammenfassung (siehe 7.6).
10. Überfällige Beiträge: Der farbige Balken links bleibt in der **Kanalfarbe**. Der Titel wird **rot und fett**.
    Überfällige stehen ganz oben, die am längsten überfälligen zuerst.
11. Kanal-Farben (Instagram pink, Facebook blau, Presse grau, …) wie in `js/kanaele.js`.

## 4. Entscheidungen vom 21.10.2026 und noch Offenes

**Bestätigt:** A ja (Pressemitteilung und Fördermitglieder-Mail gehören zu „Digital"). C ja (ein Sammel-ToDo pro Projekt und Kanal).
D ja (Verantwortliche anzeigen, „Hut frei" bei offenem Beitrag ohne Verantwortliche). E ja (Instagram-Satz passt, Platzhalter für die anderen Kanäle sind in Ordnung).
Die Person hat 7.4 (0.29.4) umgesetzt, es ist im Repo.
**Noch offen:** B (Bausteine aus 7.4 entfernen?). Bis zur Antwort baust du in 7.5 nur „+ Beiträge" und führst den Rückbau **nicht** aus. Frage am Ende nach.

Die Tabelle unten zeigt die ursprünglichen Fragen.

Für diese Punkte baust du den Vorschlag, markierst ihn im Pull Request als „Vorschlag" und fragst am Ende nach.
Vor 7.5 und 7.6 stellst du die Fragen zu den dort genannten Punkten **zuerst** und baust erst nach der Antwort.

| Nr | Frage | Vorschlag |
|---|---|---|
| A | Pressemitteilung und Fördermitglieder-Mail: zu welcher Kanalgruppe? | Gruppe „Digital" |
| B | Die ToDo-Bausteine aus 7.4 (Erstellen/Feedback/Veröffentlichen als einzelne ToDos) ganz entfernen? | Ja. Der Arbeitsstand steht dann im Status des Beitrags. |
| C | Sammel-ToDo: eines pro Projekt und Kanal, oder eines pro Projekt? | Eines pro Projekt und Kanal (zum Beispiel „Pressemitteilung", „Instagram"). |
| D | Verantwortliche im Sammel-ToDo anzeigen, „Hut frei" bei offenem Beitrag ohne Verantwortliche? | Ja, beides. |
| E | Standard-Beiträge je Kanal (Namen und Tage) | Siehe 7.5. Alle Tage sind Platzhalter und leicht änderbar. |

## 5. Schritte

### 7.4a – Aufräumen und Darstellung (klein, kein Sheet, kein Skript)

Version: nächste freie Nummer (0.29.5, falls 7.4 drin ist, sonst 0.29.4).

1. **Zusatzkanal entfällt.** In `js/views/mobi-plan.js` die Kanal-Checkliste (`kanalZeile`, `rolleSetzen`, Auswahl
   Hauptkanal/Zusatzkanal/Nicht genutzt) entfernen. Dafür **eine Zeile** über der Beitragsliste:
   `Kanäle: Instagram 5 · Pressemitteilung 1` (Anzahl Beiträge je Kanal, nur Kanäle mit mindestens einem Beitrag,
   Kanalfarbe als kleiner Punkt). Ohne Beiträge zeigt die Zeile nichts.
   Die Spalte `kanaele` im Sheet und `leseKanaele`/`schreibeKanaele` in `js/kanaele.js`: Wenn nichts anderes sie nutzt, entferne die
   beiden Funktionen. Die Spalte bleibt im Sheet und im Schema (kein Skript-Eingriff).
   Die Analyse (Zielgruppe, Art der Werbung, Kampagnenziel, Aufruf zum Handeln) bleibt.
   Die Kanalliste soll aus dem Teil „Mobi" verschwunden sein, auch die CSS-Klassen `.mobi-kanal`, `.mobi-rolle`, `.mobi-luecke`
   nur entfernen, wenn sie nirgends sonst gebraucht werden (Suche vorher). Sonst stehen lassen.
2. **Formate groß.** In `js/schema.js` beim Feld `format` von `Mobi_Plan` die Optionen als `{ wert, label }` angeben:
   `beitrag` → „Beitrag", `reel` → „Reel", `story` → „Story", `video` → „Video", `text` → „Text", `sonstiges` → „Sonstiges".
   Prüfe in `js/ui/form.js`, dass `{ wert, label }` bei `typ: 'auswahl'` unterstützt wird (in `mobi.js` wird es schon so benutzt).
   Gespeichert wird weiter der kleine Wert. Auch Status-Optionen im Formular so beschriften, wie `statusText` in `mobi-rechnen.js`
   (Idee, Entwurf, Review, Bereit, Veröffentlicht).
3. **Überfällig anders darstellen** (in `js/views/mobi.js` und `js/views/mobi-plan.js`, Kacheln, Kanban und Projekt-Liste):
   - Der linke Balken bleibt in der Kanalfarbe. Heute wird der Balken bei überfälligen Beiträgen von der Klasse `ueberfaellig`
     überschrieben, und die Funktion `markieren` setzt den Rand nur, wenn der Beitrag nicht überfällig ist. Das ändern.
   - Überfällig: Titel rot (`#b3261e`) und fett. Heute fällig: Titel orange (`#c77c00`) und fett.
   - Sortierung in `sortiereBeitraege` (`js/views/mobi-rechnen.js`): zuerst überfällige (ältestes Datum zuerst),
     dann heute, dann die übrigen offenen nach Datum und Uhrzeit, ohne Datum zuletzt, danach Veröffentlichte (wie bisher).
4. Version hochzählen, `docs/STAND.md` ergänzen, Pull Request.

**Prüfen:** Projekt öffnen: Kanalliste ist weg, stattdessen eine Zeile mit Anzahlen. Beitrag anlegen: Formate groß geschrieben.
Beitrag mit Datum in der Vergangenheit: Balken in Kanalfarbe, Titel rot und fett, ganz oben. Gilt in Projekt, Reiter Mobi am PC und am Handy.

### 7.4b – Kanban je Kanal, Kanalgruppen, Kacheln in Spalten (kein Sheet, kein Skript)

Neue Statuswerte sind nur Text. Prüfe in `apps-script/Daten.gs` (`pruefeFelder`) und `apps-script/Schema.gs`, ob erlaubte
Werte für `status` geprüft werden. Falls ja: melde es im Pull Request unter „Von Hand zu erledigen" (Skript-Änderung nötig).
Falls nein: „Sheet und Skript bleiben unverändert."

1. **Neue Statuswerte** in `js/views/mobi-rechnen.js` und `js/schema.js`:
   `gedreht` („Gedreht"), `geschnitten` („Geschnitten"), `anpassung` („Anpassung").
   Zwei Reihenfolgen:
   - Standard: `idee, entwurf, review, anpassung, bereit, veroeffentlicht`
   - Kanäle mit Video-Schritten (Instagram, TikTok): `idee, entwurf, gedreht, geschnitten, review, anpassung, bereit, veroeffentlicht`
   In `js/kanaele.js` je Kanal ein Feld `schritte` (Liste der Status), Standard für alle, die Video-Reihenfolge für Instagram und TikTok.
   Neue Funktion in `mobi-rechnen.js`: `statiFuer(kanalName)`. Bestehende Beiträge bleiben gültig.
   „Anpassung" ist die Feedbackschleife. Von „Anpassung" geht es weiter nach „Bereit" oder zurück nach „Entwurf".
2. **Kanban** (`js/views/mobi.js`): Die Spalten ergeben sich aus den **sichtbaren** Beiträgen und dem Kanalfilter.
   - Zeigt der Filter nur Kanäle ohne Video-Schritte (zum Beispiel nur Presse): Standard-Spalten.
   - Sonst (kein Filter, Instagram, TikTok oder Gruppen, die Instagram/TikTok enthalten): alle Spalten der Video-Reihenfolge.
   - Hat eine Karte einen Status, der in der Spaltenliste fehlt (zum Beispiel `gedreht` bei Facebook), wird die Spalte trotzdem gezeigt.
   - Die Knöpfe „‹ Zurück" und „Weiter ›" springen zum vorherigen oder nächsten Status **in der Reihenfolge des Kanals dieser Karte**
     (Standard oder Video). Bei „Anpassung" gibt es zusätzlich den Knopf „Zurück zu Entwurf".
   - Die Spalte „Veröffentlicht" zeigt weiter nur Beiträge der letzten zwei Wochen (`istArchiv`).
   - Am Handy scrollen die Spalten seitwärts (bleibt wie in 7.3).
3. **Kanalgruppen** in `js/kanaele.js`: Feld `gruppe` je Kanal:
   - „Social Media": Instagram, Facebook, TikTok
   - „Digital": Newsletter, WhatsApp und Telegram, Webseite, Unimail, Pressemitteilung, Mail an Fördermitglieder (Hamburg)  (Vorschlag A)
   - „Print": Plakate und Flyer, Kreideaktion
   - „Extern": Werbung über andere Gruppen, Schuldelis
   - „Sonstiges": Sonstiges
   Das bestehende Feld `bereich` kann ersetzt oder ergänzt werden. Prüfe, wo `bereich` benutzt wird, bevor du es änderst.
   Neue Funktion `kanaeleDerGruppe(gruppeName, kurzname)`.
4. **Kanalfilter im Reiter Mobi** (`js/views/mobi.js`, Auswahl `kanalWahl`): Oben die vier Gruppen „Social Media", „Digital", „Print",
   „Extern" (Werte zum Beispiel `g:social`), danach die einzelnen Kanäle (Werte wie bisher). Eine Gruppe zeigt alle ihre Kanäle.
   Die anderen Filter (Suche, Projekt/Veranstaltung, Verantwortliche, Status, „Nur meine") bleiben.
5. **Kacheln in Spalten** statt Tabelle in der Ansicht „Liste" (PC und Handy gleiche Kachel):
   - Eine Kachel zeigt: Kanal-Punkt und Kanal, Format, Titel, Datum (mit „überfällig"/„heute"), Status, Projekt/Veranstaltung, Verantwortliche,
     den Haken „veröffentlicht" und das Kanalfarben-Balkchen links.
   - PC (ab 960 px): vier Spalten nebeneinander: **Social Media**, **Digital**, **Print**, **Sonstiges** (Extern und Sonstiges zusammen
     in „Sonstiges"). Jede Spalte hat eine Überschrift mit Anzahl. Innerhalb der Spalte gilt die Sortierung aus 7.4a.
   - Handy: Die Spalten stehen untereinander (Überschrift, darunter die Kacheln).
   - „Mehrere bearbeiten" (Auswahlkästchen) und der Haken müssen weiter funktionieren.
   - „Veröffentlicht, letzte 2 Wochen" bleibt als eigener Block unter den Spalten, in derselben Kachelform, grau.
   - Das Archiv darf als einfache Liste bleiben (`zeigeListe`). Entscheide selbst, was weniger Aufwand ist, und nenne es im Pull Request.
   - Eine eigene Datei `js/views/mobi-kachel.js` ist erlaubt, wenn `mobi.js` sonst zu unübersichtlich wird (dann in `sw.js` eintragen).
6. Version hochzählen, STAND ergänzen, Pull Request.

**Prüfen:** Kanban mit Filter Instagram zeigt acht Spalten, mit Filter Pressemitteilung sechs. „Anpassung" lässt sich von Hand erreichen und
auch zurück zu „Entwurf" schieben. Filter „Social Media" zeigt nur Instagram, Facebook, TikTok. Am PC stehen die Kacheln in vier Spalten,
am Handy untereinander. „Mehrere bearbeiten" geht noch.

### 7.5 – Standard-Beiträge („+ Beiträge" mit Kanalauswahl)

**Vor dem Bauen:** Rückfragen A, B und E klären (Abschnitt 4).

Ziel: Die Person legt ein Projekt an (zum Beispiel „Demo COP 31") und klickt im Teil „Mobi" auf „+ Beiträge". Dort wählt sie Kanäle.
Pro gewähltem Kanal wird ein **Satz Standard-Beiträge** angelegt. Titel ist der Name des Standard-Beitrags, Text leer, Status „Idee",
`projekt_id` gesetzt, Datum vom Aktionsdatum zurückgerechnet.

1. **Sätze in `js/kanaele.js`:** Liste `STANDARD_BEITRAEGE`, je Kanal eine Liste mit `{ name, format, tage_vorher }`.
   `tage_vorher` = Tage **vor** dem Bezugsdatum (negativ = danach). Alles Platzhalter, leicht änderbar.
   Vorschlag für **Instagram** (von der Person genannt: Heute Demo, Packliste, Awarenesskonzept, Demosprüche, 3 Reels, Posts zum Thema 1 pro Tag, Storys):
   - „Heute Demo" (Beitrag, 0), „Packliste" (Beitrag, 1), „Awarenesskonzept" (Beitrag, 5), „Demosprüche" (Beitrag, 4)
   - „Reel 1" (10), „Reel 2" (7), „Reel 3" (3)
   - „Thema-Post 1" bis „Thema-Post 6" (täglich, 7, 6, 5, 4, 3, 2)
   - „Story 1" (3), „Story 2" (1), „Story 3 (am Tag)" (0)
   Platzhalter für die anderen Kanäle (Tage wie von der Person genannt, soweit bekannt):
   - Pressemitteilung: „Pressemitteilung" (Text, 7)
   - Plakate und Flyer: „Plakate und Flyer" (Sonstiges, 14)
   - Kreideaktion: „Kreideaktion" (Sonstiges, 1)
   - WhatsApp und Telegram: „Ankündigung" (Text, 7), „Erinnerung" (Text, 1)
   - Unimail: „Unimail" (Text, 5)
   - Newsletter: „Newsletter" (Text, 5)
   - Facebook: „Veranstaltung" (Beitrag, 10), „Erinnerung" (Beitrag, 1)
   - TikTok: „Video 1" (Video, 7), „Video 2" (Video, 2)
   - Webseite: „Ankündigung auf der Webseite" (Text, 10)
   - Werbung über andere Gruppen: „Anfrage an andere Gruppen" (Text, 10)
   - Schuldelis: „Schuldelis informieren" (Text, 7)
   - Mail an Fördermitglieder (Hamburg), nur `gp`: „Mail an Fördermitglieder" (Text, 5)
   - Sonstiges: kein Satz. Die Person gibt einen eigenen Titel und ein Datum ein.
   Nur Kanäle der aktuellen Gruppe anzeigen (`kanaeleFuer(kurzname)`).
2. **Fenster „+ Beiträge"** (neue Datei `js/views/mobi-sammlung.js`, in `sw.js` eintragen):
   - Schritt 1: Kanäle als Häkchen, gruppiert nach den Kanalgruppen aus 7.4b. Darunter „Sonstiges" mit freiem Titel.
   - Schritt 2: Vorschau-Liste aller Beiträge mit Haken, Titel, Format und Datum (bearbeitbar). Nicht gewollte Beiträge abwählen.
   - Bezugsdatum: das **Aktionsdatum** des Projekts. Hat das Projekt keins, bleibt `datum` leer und es erscheint ein Hinweis.
     Für Veranstaltungen (Schritt 7.7) ist das Bezugsdatum das Veranstaltungsdatum.
   - Anlegen mit `batchCreate` auf `Mobi_Plan` (Format wie in `js/views/mobi-vorlage.js`, `legeBausteineAn`, als Vorlage). Danach Liste neu laden.
   - Bereits vorhandene Beiträge desselben Titels und Kanals im Projekt: nicht doppelt anlegen. In der Vorschau grau mit „Gibt es schon".
3. Die Knöpfe „+ Beitrag" (einzelner Beitrag) bleiben. „+ Beiträge" kommt im Teil „Mobi" im Projekt dazu. Im Reiter Mobi nur, wenn Projekt oder
   Veranstaltung gewählt ist (sonst Hinweis).
4. **Rückbau der Bausteine aus 7.4 (nur wenn Rückfrage B mit Ja beantwortet ist):**
   - `js/vorlagen.js`: Vorlagen `mobi-demo` und `mobi-klein`, die Funktion `baustein` sowie `bausteinText` und `vorlageAnzahl` entfernen
     (`vorlageAnzahl` nur, wenn kein anderer Code sie braucht, sonst Aufruf in `projekt-todos.js` zurück auf `v.schritte.length`).
   - `js/views/projekt-todos.js`: Bausteine-Zeilen, „+ Eigener Schritt" und `legeBausteineAn`-Aufruf entfernen. „+ Eigener Schritt" darf bleiben,
     wenn die Person es will (Rückfrage). Zurück zu `schritte`-Zeilen mit `z.sch.tage_vorher`.
   - `js/views/mobi-vorlage.js` löschen, aus `sw.js` austragen.
   - `js/views/todos-abhaken.js`: `beitragVorschlagen` entfernen (Frage „Beitrag auf Veröffentlicht setzen" entfällt).
   - Die alte Vorlage „Mobi" bleibt.
   - Der Abschnitt „Zugehörige ToDos" im Beitrag (`mobi-eintrag.js`, `todosVon`) entfällt, ebenso der ToDo-Hinweis beim Löschen (`todoAnzahl`).
   - Die Spalte `ToDos.mobi_id` und `mobiKaskade` im Skript bleiben stehen (harmlos).
5. Version, STAND, Pull Request. Sheet und Skript bleiben unverändert.

**Prüfen:** Neues Projekt mit Aktionsdatum. „+ Beiträge" → Instagram und Pressemitteilung wählen → Vorschau zeigt Termine rückwärts vom Aktionsdatum →
einen Beitrag abwählen → Anlegen. Im Teil „Mobi" und im Reiter Mobi stehen die Beiträge mit Status „Idee". Zweiter Klick auf dieselben Kanäle legt nichts doppelt an.

### 7.6 – Sammel-ToDo in allen ToDo-Listen

**Vor dem Bauen:** Rückfragen C und D klären (Abschnitt 4).

Das Sammel-ToDo wird **nicht gespeichert**. Es wird aus den Beiträgen **berechnet**, so wie Kalender-Termine.

1. Neue Datei `js/views/mobi-todo.js` (in `sw.js` eintragen) mit einer Funktion, die aus den Beiträgen eines Projekts die Sammel-ToDos baut:
   pro Projekt und Kanal ein Eintrag mit
   - Titel: Kanalname, zum Beispiel „Pressemitteilung" (mit 📣-Symbol und Kanalfarbe),
   - Datum: das **nächste** Datum eines noch offenen Beitrags. Gibt es keins, das späteste Datum. Kein Fälligkeits-Enddatum.
   - Zusatz: „3 von 8 veröffentlicht",
   - Verantwortliche: Namen der Beiträge (Vorschlag D). Gibt es offene Beiträge ohne Verantwortliche: „Hut frei".
   - Erledigt: wenn alle Beiträge dieses Kanals im Projekt `veroeffentlicht` sind.
   - Überfällig-Hinweis, wenn ein offener Beitrag überfällig ist.
2. Anzeige in **allen** ToDo-Listen: Start (`js/views/start.js`), Reiter ToDos (`js/views/todos.js`), Teil ToDos im Projekt
   (`js/views/projekt-todos.js`). Dort **ohne Checkbox**, mit dem Datum aus 1. Prüfe vor dem Bauen, wie diese Listen ihre Zeilen bauen
   (`todos-rechnen.js`, `todos-hut.js`), damit sich das Sammel-ToDo in Sortierung, Filter „Nur meine" und Zählzeile sinnvoll einfügt.
   Es zählt als offen, bis alle Beiträge veröffentlicht sind.
3. Klick auf ein Sammel-ToDo: öffnet den Reiter **Mobi** in der **Kanban-Ansicht**, gefiltert auf das Projekt und den Kanal.
   Umsetzung: In `js/views/mobi.js` den Merker (`merk`) um eine Vorgabe erweitern (`projekt`, `kanal`, `ansicht`), die vor dem Navigieren gesetzt wird
   (die Hash-Adresse bleibt `#/g/<kurzname>/mobi`). Beim Öffnen werden Filter und Ansicht aus der Vorgabe gesetzt, danach wird die Vorgabe gelöscht.
4. Ein Veröffentlichen aller Beiträge eines Kanals setzt das Sammel-ToDo automatisch auf erledigt (es ist ja berechnet).
5. Das Sammel-ToDo erscheint nicht im Kalender als ToDo-Frist. Die Beiträge selbst kommen im Schritt 7.7 in den Kalender.
6. Version, STAND, Pull Request. Sheet und Skript bleiben unverändert.

**Prüfen:** Projekt mit Beiträgen für Instagram und Presse. In Start, ToDos und im Projekt stehen die Zeilen „Instagram" und „Pressemitteilung"
ohne Kästchen, mit Datum und Stand. Klick → Reiter Mobi, Kanban, gefiltert. Alle Presse-Beiträge veröffentlichen → die Zeile „Pressemitteilung" steht bei den erledigten.

### 7.7 – Kalender

1. `js/views/kalender-rechnen.js` und `js/views/kalender.js`: Mobi-Beiträge als Termine (Symbol 📣, Kanalfarbe, Titel mit Kanal, Uhrzeit wenn gesetzt).
   Veröffentlichte grau. Bei Beiträgen vor dem Aktionsdatum: Hinweis „n Tage bis zur Aktion". Beiträge, die **nach** dem Aktionsdatum liegen
   (außer „Danke"-Beiträge), werden pink markiert.
2. Neuer Filter „Mobi" im Kalender (nur Beiträge).
3. Wochenansicht im Kalender (Monat gibt es, Tag öffnet sich beim Klick auf einen Tag).
4. Veranstaltungen: Knopf „In Mobi einplanen" (öffnet dasselbe Fenster wie in 7.5, Bezugsdatum = Veranstaltungsdatum, Bezug = `veranstaltung_id`).
   Im Löschfenster einer Veranstaltung steht der Hinweis, dass ihre Mobi-Beiträge mitgelöscht werden (das Skript tut das schon, `mobiKaskade`).
5. Version, STAND, Pull Request.

### 7.8 – Feinschliff

1. Kommentare: 💬-Marke an Beiträgen mit Kommentaren (wie bei ToDos, `bezug_art` = `mobi`).
2. „Was ist neu?" (`js/views/neu-seit.js`): Mobi als Quelle, ohne die eigenen Änderungen der Person.
3. Warnungen: „Projekt ohne Mobi" (Aktionsdatum in den nächsten 21 Tagen und kein Beitrag), „Beitrag ohne Datum".
4. Timeline pro Projekt: ein Zeitstrahl mit einer Bahn je Kanal bis zum Aktionsdatum.
5. Zum Schluss prüfen, ob Drag-and-Drop am PC sinnvoll ist (am Handy nicht). Nur als Vorschlag im Pull Request, nicht bauen ohne Auftrag.
6. Etappe 7 in `docs/STAND.md` als abgeschlossen eintragen. Danach folgt Etappe 8 (Protokoll, Reden, Learnings).

## 6. Wichtige Regeln für Mobi im Code

- Beitrag hängt an Projekt **oder** Veranstaltung (nie am Meilenstein). Das Skript lehnt Beiträge ohne beides ab.
- `datum` ist `JJJJ-MM-TT`, `uhrzeit` ist `HH:MM`, beides als Text. Immer über `normDatum` und `zeitNorm` lesen.
- Der Kanal wird als **Name** gespeichert (zum Beispiel „Instagram"), nicht als ID. Die ID kommt aus `kanalInfo(name).id`.
  Unbekannte Kanalnamen (zum Beispiel alte Daten) werden grau angezeigt und dürfen nicht zu Fehlern führen.
- Status wird als kleiner Text gespeichert: `idee, entwurf, gedreht, geschnitten, review, anpassung, bereit, veroeffentlicht`.
  Leer oder unbekannt zählt als `idee`.
- Archiv: Veröffentlicht und `geaendert_am` älter als zwei Wochen, oder das Projekt ist abgeschlossen.
- Der Hinweis „Veröffentlichen" und die Verknüpfung über `mobi_id` stammen aus 7.4 und fallen nach 7.5 weg (wenn Rückfrage B mit Ja beantwortet ist).
