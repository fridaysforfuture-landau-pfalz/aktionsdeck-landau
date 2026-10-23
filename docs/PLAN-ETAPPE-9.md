# Plan Etappe 9: Team (Fassung 2, 23.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: Fassung 2.** Die Person hat die 20 Rückfragen aus Fassung 1 am 23.10.2026 beantwortet (Abschnitt 4).
Fassung 2 (eigentlich Schritt 9.0a) kommt im selben Pull Request wie Schritt 9.1, damit Plan und Skript zusammenpassen.
Die kleinen Fragen A bis F (Abschnitt 4) sind am 23.10.2026 beantwortet.
**Erledigt:** 9.0 (Version 0.30.15, Fassung 1, Pull Request #26), 9.1 (Version 0.31.0, Pull Request #27, von Hand bereitgestellt am 23.10.2026). 9.2 läuft mit Version 0.31.1.

## 1. Ziel

- **Wer ist im Team?** Ein neuer Reiter **„Team“** zeigt alle Personen der Gruppe als Karten.
  Jede Person trägt sich selbst ein. Die Zuordnung läuft über den Anzeigenamen („Wer bist du?“).
- **Gruppen-Rollen:** dauerhafte Rollen in der Gruppe (zum Beispiel Presse, Finanzen, Bundes-Deli 1).
  Jede Person wählt ihre Rollen. **Eine Rolle heißt nicht, dass sich die Person allein kümmern muss.** Unterstützung ist jederzeit willkommen.
  Die Liste der Rollen bearbeitet die Gruppe selbst in der App.
- **Hüte bleiben, wie sie sind:** Ein Hut ist eine Aufgabe (ToDo, Meilenstein, Mobi-Beitrag) mit Verantwortlichen
  oder eine offene Aufgabe, die noch Verantwortliche sucht („Hut frei“, „Hut übernehmen“). Im Team sieht man die Hüte jeder Person.
- **Kapazität:** Jede Person sagt mit einer Zahl von 1 bis 10, wie viel Zeit und Kraft sie gerade hat.
  Die Angabe gilt bis zu einem Datum (Gültigkeitsdatum). Danach ist sie „abgelaufen“ und zählt nicht mehr.
- **Diagramm „Berg“:** Ein Bild zeigt, wie viel Kraft die Gruppe in den nächsten Wochen hat. Jede Person ist eine Schicht in eigener Farbe.
  Dazu stehen dort die Aktionen und die fälligen Hüte je Woche. So sieht die Gruppe früh, wann es eng wird.
- Alle Angaben sind **nur für die eigene Gruppe** sichtbar (wie alles hinter dem PIN). Nichts davon ist öffentlich.

## 2. Ausgangslage (im Repo geprüft am 22.10.2026, Version 0.30.14)

`js/config.js` und `sw.js` hatten beide `0.30.14`, wie `docs/STAND.md`. Mit 9.0 wurde es 0.30.15.

- **Tab `Personen`** (`apps-script/Schema.gs`): Spalten `name, aktiv` (dazu die Basis-Spalten). **Im Sheet leer** (Antwort 4).
  Gelesen nur als Namensvorschlag im Protokoll-Formular und bei den Reden (`namenVorschlaege` in `js/views/protokoll-rechnen.js` beachtet `aktiv`).
  Die Aktion `bootstrap` (`apps-script/Daten.gs`) liefert `personen` mit, die App ruft sie aber nicht auf.
  **Wiederverwendung:** `Personen` wird die Liste der Team-Mitglieder.
- **Tab `Projekt_Team`** (`projekt_id, person, zustaendigkeit`): seit Etappe 4 ungenutzt. **Bleibt ungenutzt** (Antwort 10).
- **Hüte** (`js/views/todos-hut.js`): `istOffenerHut`, `huetKnoepfe` („Hut übernehmen“, „Weitergeben“). Wird im Team wiederverwendet, nicht nachgebaut.
- **`@Name` im Protokoll** legt ein ToDo mit `verantwortlich = Name` an. Bleibt so.
- **Rollen im Protokoll** (`rollenFuer`: Moderation, Protokoll, Awareness) gelten für ein Treffen und sind **keine** Gruppen-Rollen. Bleibt getrennt.
- **Anzeigename** (`js/store.js`: `getName`, `setName`, höchstens 60 Zeichen; `frageName` in `js/ui/modal.js`): freier Text, nur im Gerät.
- **Verantwortliche** in `ToDos`, `Meilensteine`, `Mobi_Plan` sind freier Text (mehrere mit Komma). `istMeins` (`js/views/todos-rechnen.js`) vergleicht als Teilwort.
  Das Team braucht den genauen Vergleich je Name (`teamNamen` in `apps-script/Team.gs`, in der App ein Gegenstück in `js/views/team-rechnen.js`).
- **Kalender** (`js/views/kalender-rechnen.js`): Helfer `addTage`, `tageZwischen`, `wocheVon`, `wochentagNr`. **Mobi-Zeitstrahl** (`js/views/mobi-zeitstrahl.js`) als Vorbild für Achse und Heute-Linie.
- **Reiter:** `js/ui/nav.js` (`TABS`, `UNTEN`), `js/config.js` (`features`), `js/views/mehr.js`.
- **Skript:** `typisieren` (`apps-script/Util.gs`) prüft nur „ist eine Zahl“. Die Spalte `wert` gibt es schon im System-Tab `Einstellungen`. Darum heißt die Zahl im neuen Tab `kapazitaet` (nicht `wert`), sonst würde `formatieren` die Spalte `Einstellungen.wert` anders behandeln.

## 3. Entscheidungen der Person (23.10.2026)

1. **Hüte bleiben Aufgaben** mit Verantwortlichen oder offene Aufgaben, die Verantwortliche suchen. Dauerhafte Zuständigkeiten heißen **„Gruppen-Rollen“**,
   mit dem Hinweis: „Eine Rolle heißt nicht, dass du dich allein kümmern musst. Du kannst jederzeit Unterstützung bekommen.“
2. **Gruppen-Rollen je Gruppe** (Standardliste):
   - FFF: Social Media, Webseite, Finanzen, Technik, Logistik, Presse, Schuldelis, Hochschulgruppe, Vernetzung, Schlüssel.
     Fest gewählt: Bundes-Deli 1, Bundes-Deli 2.
   - GP: Öffko (Öffentlichkeitskoordination), Fiko (Finanzkoordination), Gruko (Gruppenkoordination), Aktionsteam.
   - Die Gruppe kann Rollen in der App **bearbeiten und ergänzen** (Knöpfe). Darum stehen die Rollen in einem eigenen Tab `Gruppen_Rollen`, nicht fest im Code.
3. Kapazität 1 bis 10 = Zeit und Kraft zusammen. Satz je Bereich: 1–3 „kaum Zeit“, 4–6 „etwas Zeit“, 7–8 „gut Zeit“, 9–10 „viel Zeit“. Keine 0, dafür „Pause“.
4. Tab `Personen` ist im Sheet angelegt (`id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, name, aktiv`) und leer.
5. Jede Person bearbeitet nur ihre eigene Karte (Absprache, kein Schutz). „Für jemanden eintragen“ klein unten im Reiter.
6. Pause (`aktiv` = FALSE) und „Mich austragen“ (weich löschen, Kapazität geht mit) wie vorgeschlagen.
7. Gültigkeit: Vorschlag 4 Wochen, Schnellknöpfe 2 Wochen, 1 Monat, 3 Monate, höchstens 6 Monate. Abgelaufen = grau, zählt nicht.
8. **Berg** wird nach dem Vorschlag gebaut. Die Person entscheidet, wenn sie ihn sieht.
9. **Berg gestapelt: jede Person eine Schicht in eigener Farbe.** Zur Frage der Person, ob gleich große Flächen das Bild verzerren: siehe Frage D in Abschnitt 4.
10. Karte zeigt die Hüte der Person (berechnet aus ToDos, Meilensteinen, Mobi-Beiträgen) und ihre Projekte. `Projekt_Team` bleibt ungenutzt. Im Projekt kommt ein Teil „Team“.
11. Abschnitt „Freie Hüte“ im Reiter Team mit „Hut übernehmen“. Namensvorschläge mit Gruppen-Rollen, ohne Kapazitätszahl. Keine automatische Verteilung.
12. Datenschutz: nur Name, Gruppen-Rollen, Kapazität mit Datum, kurze freiwillige Notiz. Keine Kommentare an Personen, keine Anwesenheits-Statistik.
13. Start: keine Kachel, nur eine Zeile für die eigene Person (Kapazität fehlt oder abgelaufen), 7 Tage wegklickbar.
14. „Was ist neu?“: nur „Neu im Team: Name“.
15. Neue Zeile je Kapazitäts-Angabe (Verlauf). Die neueste deckt einen Tag ab.
16. Abgelaufene Angaben werden 6 Monate nach „gilt bis“ von `aufraeumen` entfernt.
17. **Umbenennen:** Die Verknüpfung bleibt. Ändert eine Person ihren Namen auf der Team-Karte, ersetzt das Skript den Namen auch in
    ToDos, Meilensteinen und Mobi-Beiträgen (`verantwortlich`) und in Umfrage-Antworten (`person`, damit die Stimme bei der Person bleibt).
    Protokolle, Reden, Ausleihe und das Log bleiben, wie sie sind (sie sind ein Nachweis, was damals geschrieben wurde). Der Anzeigename im Gerät wird mit umgestellt.
18. Gleicher Name doppelt: Das Skript lehnt ab.
19. Handy und PC wie vorgeschlagen (PC Raster und Detail rechts; Handy untereinander, Detail als Vollbild; zehn Knöpfe statt Schieberegler; Reiter am Handy unter „Mehr“).
20. Reihenfolge: eigene Karte zuerst, dann A–Z, Pausierte unten. Nicht nach Kapazität sortiert.

## 4. Kleine Fragen der zweiten Runde

**Antworten der Person (23.10.2026):**
- A: Klimabündnis bekommt **keine** Standard-Rollen. Ob KB die App nutzt, ist offen, vielleicht kommt später eine andere Gruppe. Rollen kommen dann über „+ Rolle“.
- B: **Kein** Knopf „Standard-Rollen übernehmen“. Die Rollen legt die Gruppe mit „+ Rolle“ an. Die Namen aus Abschnitt 3 stehen dort als Vorschläge zum Antippen (keine Pflicht).
- C: **Kein** Datum „gewählt bis“.
- D und F: wie Vorschlag (Dicke = Kapazität, feste Reihe mit 8 Farben nach Namen A–Z).
- E: Alle in der Gruppe dürfen die Rollen-Liste ändern.
- Den Pull Request muss der Agent nicht beobachten.

Die Tabelle zeigt die Fragen mit den ursprünglichen Vorschlägen.

| Nr | Frage | Vorschlag |
|---|---|---|
| A | **Klimabündnis:** Welche Gruppen-Rollen? | Keine Standardliste. KB legt Rollen bei Bedarf mit „+ Rolle“ an. |
| B | **Wie kommen die Standard-Rollen ins Sheet?** | Knopf „Standard-Rollen übernehmen“ im Reiter Team, solange die Gruppe noch keine Rollen hat (legt die Liste aus Abschnitt 3 mit einem Aufruf an). Kein Abtippen im Sheet. |
| C | **Fest gewählte Rollen** (Bundes-Deli 1 und 2): Braucht es ein Datum („gewählt bis“)? | Nein. Marke „gewählt“, höchstens eine Person. Das prüft das Skript. Wer gewählt wird, trägt die Rolle selbst ein oder gibt sie ab. |
| D | **„Jede Fläche gleich groß“ beim Berg?** | Jede Schicht ist **so dick wie die Kapazität** der Person (7 ist dicker als 3). Die Gesamthöhe bleibt die Summe der Gruppe. So verzerrt nichts. Wären alle Schichten gleich dick, würde der Berg nur zählen, **wie viele** Personen eine Angabe haben, nicht wie viel Kraft da ist. Das wäre eine Verzerrung. Gebaut wird darum „Dicke = Kapazität“. Die Person schaut es sich in 9.6 an. |
| E | **Wer darf die Rollen-Liste ändern?** | Alle in der Gruppe (wie bei Mitteilungen). Löschen fragt nach und nennt die Personen, die die Rolle haben. Eine gelöschte Rolle wird bei allen ausgetragen (macht das Skript). |
| F | **Farben der Schichten im Berg:** | Feste Farbreihe (8 gut unterscheidbare Farben), vergeben nach Namen A–Z. Ab der 9. Person wiederholen sich die Farben, die Legende nennt die Namen. |

## 5. Datenmodell (gebaut in 9.1)

Die Person tippt Spalten und Tabs **von Hand** ins Sheet (siehe CLAUDE.md Abschnitt 7). `gruppe_id` heißt wirklich so.

**Tab `Personen`** (besteht: `name, aktiv`). Neu dahinter, in dieser Reihenfolge: `rollen, notiz`
- `name`: wie der Anzeigename, höchstens 60 Zeichen. In der Gruppe nur einmal unter den nicht gelöschten (Groß- und Kleinschreibung egal).
- `aktiv`: TRUE = dabei, FALSE = Pause. **Die App schickt beim Anlegen TRUE** (ein leerer Wert wird im Skript zu FALSE).
- `rollen`: IDs aus `Gruppen_Rollen`, **eine je Zeile**, höchstens 12. Über die ID statt den Namen: Benennt jemand eine Rolle um, bleibt sie bei allen Personen.
- `notiz`: freiwillig, höchstens 120 Zeichen.

**Neuer Tab `Gruppen_Rollen`:** `name, beschreibung, gewaehlt, sortierung`
- `name` höchstens 40 Zeichen, in der Gruppe nur einmal. `beschreibung` freiwillig, höchstens 300 Zeichen.
- `gewaehlt`: TRUE = fest gewählte Rolle, **höchstens eine Person** (das Skript prüft beim Eintragen und beim Umstellen auf „gewählt“).
- `sortierung`: Reihenfolge in der Liste (Zahl).

**Neuer Tab `Kapazitaet`:** `person_id, kapazitaet, gueltig_ab, gueltig_bis, notiz`
- `person_id`: ID der Zeile in `Personen` (eigene Gruppe, nicht gelöscht).
- `kapazitaet`: ganze Zahl von 1 bis 10.
- `gueltig_ab`, `gueltig_bis`: Datum `JJJJ-MM-TT`, `gueltig_ab` ≤ `gueltig_bis`, höchstens 183 Tage auseinander.
- `notiz`: freiwillig, höchstens 120 Zeichen.
- Wird nur angelegt oder gelöscht, **nicht geändert** (das Skript lehnt `update` ab).
- **Welcher Wert gilt an einem Tag?** Von allen Zeilen einer Person, die den Tag abdecken, gilt die **zuletzt angelegte** (`erstellt_am`).

**Was das Skript dazu macht** (`apps-script/Team.gs`):
- Person gelöscht → ihre Kapazitäts-Zeilen werden mitgelöscht (weich).
- Rolle gelöscht → sie wird bei allen Personen aus `rollen` entfernt.
- Name einer Person geändert (`update` auf `Personen.name`) → derselbe Name wird in `ToDos.verantwortlich`, `Meilensteine.verantwortlich`, `Mobi_Plan.verantwortlich`
  und `Umfrage_Antworten.person` ersetzt (nur der ganze Name, „Ben“ ändert „Bente“ nicht; nur die eigene Gruppe). Die Antwort von `update` enthält dann
  `umbenannt: { ToDos: n, Meilensteine: n, Mobi_Plan: n, Umfrage_Antworten: n }`.

Keine neuen Spalten in ToDos, Meilensteinen, Mobi_Plan oder Projekten. Hüte und Projekte je Person werden in der App berechnet.

## 6. Schritte

### 9.0 – Plan schreiben (nur Doku) – erledigt

Version: 0.30.15. Fassung 1 mit 20 Rückfragen, Pull Request #26.

### 9.1 – Sheet und Skript (Grundlage, einmal von Hand bereitstellen), mit Fassung 2 des Plans

Version: 0.31.0. Hier steckt die ganze Handarbeit der Etappe. Danach braucht kein weiterer Schritt eine neue Bereitstellung.

1. Diese Datei als Fassung 2 (Abschnitte 3 bis 8).
2. `apps-script/Schema.gs`: `Personen` um `rollen, notiz`, neue Tabs `Gruppen_Rollen` und `Kapazitaet`. `kapazitaet` in `ZAHL_SPALTEN`, `gewaehlt` in `BOOL_SPALTEN`.
   Höchstlängen in `MAX_TEXT_AUSNAHMEN`. Kommentare zu den Tabs.
3. `js/schema.js`: Einträge `Personen`, `Gruppen_Rollen`, `Kapazitaet`.
4. Neue Datei `apps-script/Team.gs`: `teamPruefen` (Regeln aus Abschnitt 5), `teamKaskade` (Mitlöschen), `teamUmbenennen`, Editor-Test `testenTeam`
   (prüft die Regeln mit Werten im Speicher und die Spaltenköpfe; schreibt nichts).
5. `apps-script/Daten.gs`: `teamPruefen` in `create`, `batchCreate` und `update`; `teamKaskade` in `delete`; `teamUmbenennen` nach einem `update` von `Personen.name`.
6. `apps-script/Aufraeumen.gs`: abgelaufene Kapazitäts-Angaben (mehr als 183 Tage nach `gueltig_bis`) werden entfernt, `aufraeumenTesten` zählt sie.
7. **Pull-Request-Abschnitt „Von Hand zu erledigen“** (genaue Liste im Pull Request).

**Prüfen:** App läuft wie vorher (nur neue Version). `testenTeam` zeigt „Alles ok.“. Protokoll- und Reden-Formular zeigen weiter Namensvorschläge.

### 9.2 – Reiter Team: Karten und Detail (nur lesen)

Version: 0.31.1. Sheet und Skript bleiben unverändert.

1. Neuer Reiter `team` (👥, „Team“) in `js/ui/nav.js` (`TABS`, nach `protokoll`), `js/config.js` (`features.team = true`), am Handy unter „Mehr“ (`js/views/mehr.js`).
2. Neue Datei `js/views/team.js` (`render(container, ctx)`): lädt `Personen`, `Gruppen_Rollen`, `Kapazitaet` mit `listMehrere` (Zwischenspeicher `gruppe_id:team`, `ladeMitCache`).
3. Neue Datei `js/views/team-rechnen.js`: `rollenVon` (IDs → Rollen, gelöschte fallen weg), `sortiereRollen`, `istIch(person, name)`, `istAktiv`,
   `namenAus(text)` (genauer Vergleich wie `teamNamen` im Skript), `kapazitaetAm(personId, kapazitaeten, tag)`, `angabeJetzt` (gilt, künftig, abgelaufen, keine),
   `angabeZustand`, `verlauf`, `kapazitaetText(wert)`, `sortierePersonen`, `passtSuche`, `passtRolle`. Kleine Beispiele als Kommentar, mit `node` geprüft.
4. **Karte:** Name (Marke „Du“), Gruppen-Rollen als Chips (gewählte mit Marke „gewählt“), Kapazität als Balken 1 bis 10 mit Zahl und Satz, „gilt bis TT.MM.“ bzw. „abgelaufen seit TT.MM.“ (grau),
   „noch keine Angabe“, Notiz klein. Ohne eigene Karte oben ein Kasten „Du bist noch nicht im Team.“ (Knopf kommt in 9.4).
5. **Detail** (Detailbereich rechts, Handy Vollbild mit „← Zurück“): alle Angaben, Verlauf der Kapazität (letzte 6 Monate, neueste oben).
6. Suche (Name, Rolle), Filter Rolle. Pausierte als Aufklapper unten. Leere Liste: freundlicher Text.
7. Neue Dateien in `sw.js` (`HUELLE`), CSS ans Ende von `css/components.css`.

**Prüfen:** Reiter am PC in der Seitenleiste, am Handy unter „Mehr“. Leeres Team zeigt den freundlichen Text.

### 9.3 – Gruppen-Rollen bearbeiten

Version: 0.31.2. Sheet und Skript bleiben unverändert.

1. Im Reiter Team ein Aufklapper „Gruppen-Rollen (n)“ mit der Liste der Rollen (nach `sortierung`, dann A–Z), je Rolle die Personen, die sie haben.
   Darüber der Hinweis aus Abschnitt 3, Punkt 1.
2. Knöpfe: „+ Rolle“, je Rolle „Bearbeiten“ (Name, Beschreibung, gewählt, Reihenfolge; mit Konfliktprüfung) und „Löschen“ (Rückfrage nennt die Personen mit der Rolle).
3. Im Formular „+ Rolle“ stehen die Namen aus Abschnitt 3 (je Gruppe, die es noch nicht gibt) als Vorschläge zum Antippen. Bei „Bundes-Deli 1“ und „Bundes-Deli 2“ ist „gewählt“ dann vorbelegt. Kein Knopf „alle übernehmen“ (Antwort B). KB hat keine Vorschläge (Antwort A).
4. Neue Datei `js/views/team-rollen.js` (mit `STANDARD_ROLLEN` je Gruppe), in `sw.js` eintragen.

**Prüfen:** FFF: „+ Rolle“ zeigt die Vorschläge, „Bundes-Deli 1“ antippen setzt „gewählt“. Rolle umbenennen, neue Rolle anlegen, Rolle löschen.
Gleichen Namen zweimal anlegen: Meldung „Die Rolle gibt es schon“.

### 9.4 – Mein Eintrag: ins Team eintragen, Rollen, Kapazität, Pause, Umbenennen

Version: 0.31.3. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/team-eintrag.js`: Formular im Detailbereich (am Handy Vollbild) für die eigene Karte.
   - **Ins Team eintragen:** legt die Zeile in `Personen` mit dem Anzeigenamen und `aktiv: true` an. Ohne Anzeigenamen erst „Wer bist du?“ (`frageName`).
   - **Gruppen-Rollen:** Chips zum Antippen (gewählte Rollen, die jemand anderes hat, sind gesperrt mit „hat Name“). Unten „+ Neue Rolle“ (legt sie in `Gruppen_Rollen` an und wählt sie).
     Hinweis aus Abschnitt 3, Punkt 1.
   - **Kapazität:** zehn Knöpfe 1 bis 10 in zwei Reihen (mindestens 44 px hoch) mit Satz darunter. „Gilt ab“ (heute), „gilt bis“ mit Schnellknöpfen. Notiz mit Zähler und Satz
     „Schreib keine Gründe auf, die deine Gesundheit oder Familie betreffen.“ Speichern legt eine **neue** Zeile in `Kapazitaet` an.
   - **Pause** (Schalter), **Mich austragen** (Rückfrage, `delete` auf `Personen`; das Skript löscht die Kapazität mit).
   - Verlauf: einzelne Kapazitäts-Angaben löschen (Rückfrage).
2. `Personen` mit Konfliktprüfung (`bekannt` = `geaendert_am`). Keine Offline-Schreibzugriffe.
3. **Umbenennen:** Feld „Name“ auf der eigenen Karte. Speichern schickt `update` mit dem neuen Namen. Die Meldung nennt, was mitgeändert wurde
   („Name geändert. Auch geändert: 3 ToDos, 1 Mobi-Beitrag.“, aus `umbenannt`). Danach wird der Anzeigename im Gerät auf den neuen Namen gestellt (`setName`).
4. **Name im Gerät geändert** („Name ändern“ oben): Gibt es zum neuen Namen keine Karte, aber zum vorigen, fragt der Reiter einmal „Deine Team-Karte heißt noch ‚Anna‘. Umbenennen?“.
   Dafür merkt sich `js/store.js` den vorigen Namen. Lies `js/store.js` und `js/app.js` zuerst.
5. **„Für jemanden eintragen“** klein unten im Reiter: legt eine Karte mit eingegebenem Namen an (Marke „eingetragen von …“). Diese Karte dürfen alle bearbeiten,
   bis jemand mit diesem Anzeigenamen sie übernimmt.

**Prüfen:** Eintragen, zwei Rollen wählen, Kapazität 7 für 2 Wochen. Seite neu laden: alles da. Zweite Angabe „ab nächstem Monat 3“: Verlauf zeigt beide, heute gilt 7.
Bundes-Deli 1 auf zwei Karten: zweite wird abgelehnt. Umbenennen: ToDos mit dem alten Namen zeigen den neuen. Pause, Austragen.

### 9.5 – Hüte je Person und freie Hüte

Version: 0.31.4. Sheet und Skript bleiben unverändert.

1. `team.js` lädt zusätzlich `ToDos`, `Meilensteine`, `Mobi_Plan`, `Projekte` (zusammen 7 Tabellen, unter der Grenze von 12).
2. `team-rechnen.js`: `hueteVon(name, daten)`: offene ToDos, offene Meilensteine, nicht veröffentlichte Mobi-Beiträge (nur offener Projekte, Beiträge zu Veranstaltungen zählen auch), genauer Namensvergleich.
3. **Karte:** „5 Hüte · 2 Projekte“. **Detail:** Listen mit Frist (überfällig rot, heute orange), Klick führt zum Eintrag (ToDo, Projekt, Mobi-Beitrag).
4. **Abschnitt „Freie Hüte“** im Reiter: offene ToDos ohne Verantwortliche (`istOffenerHut`), nächste Frist zuerst, höchstens 10, darunter „Alle im Reiter ToDos →“.
   Knopf „Hut übernehmen“ aus `huetKnoepfe` (`js/views/todos-hut.js`).
5. Namen in Hüten ohne Team-Karte stehen unten unter „Namen ohne Team-Karte“ (Name und Zahl). So fallen Tippfehler auf.

**Prüfen:** ToDo mit „Anna, Ben“ zählt bei beiden, nicht bei „Bente“. Erledigtes ToDo zählt nicht. „Hut übernehmen“ im Team: die eigene Karte zählt einen Hut mehr.

### 9.6 – Diagramm „Berg“

Version: 0.31.5. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/team-berg.js` (`baueBerg(daten, opt)`), SVG mit `document.createElementNS` (kein `innerHTML`, keine Bibliothek, Texte mit `textContent`).
2. Rechnen in `team-rechnen.js` (mit `node` geprüft): je Woche (Montag bis Sonntag) die Kapazität jeder aktiven Person am Mittwoch (`kapazitaetAm`),
   die Zahl der fälligen offenen Hüte (Datum in der Woche) und die Aktionen (Aktionsdatum offener Projekte, externe Veranstaltungen). Hinweis „eng“, wenn die Hüte je Kapazitätspunkt
   deutlich über dem Mittel der gezeigten Wochen liegen (Regel im Pull Request nennen, leicht änderbar).
3. Anzeige: **gestapelte Flächen, eine Schicht je Person** (Dicke = Kapazität, Frage D; Farben nach Frage F), Reihenfolge A–Z, Legende mit Namen.
   PC: 2 Wochen zurück, 10 voraus; Handy: 1 zurück, 6 voraus, ohne Seitwärts-Scrollen. Balken für fällige Hüte darunter, Linien für Aktionen (grün) und Heute (gestrichelt), Datum je Montag.
   Antippen einer Woche: Zeile darunter mit Woche, Summe, Personen mit Wert, Hüte, Aktionen. Für Bildschirmleser `role="img"` mit Beschreibung und „Zahlen zeigen“ (Liste).
4. Platz: oben im Reiter Team. Weniger als 2 Personen mit gültiger Angabe: Satz statt Bild. Darunter klein: „Berg aus n von m Personen. Abgelaufene Angaben zählen nicht.“

**Prüfen:** Mit drei erfundenen Personen (7, 4, 2, verschiedene Zeiträume) steigen und fallen die Schichten an den richtigen Wochen. Aktion als grüne Linie. Am Handy passt das Bild.

### 9.7 – Verknüpfungen (Namensvorschläge, Projekt, Start, Was ist neu)

Version: 0.31.6. Sheet und Skript bleiben unverändert.

1. **Namensvorschläge:** Team-Mitglieder (aktiv) zuerst, mit Gruppen-Rollen im Vorschlag, zum Beispiel „Anna (Presse, Technik)“: ToDo-Formular (`js/views/todos.js`), ToDo im Projekt (`js/views/projekt-todos.js`),
   „Hut weitergeben“ (`js/views/todos-hut.js`), Mobi-Beitrag. Gespeichert wird nur der Name. Prüfe, ob `baueFormular` bei `vorschlaege` Wert und Beschriftung trennen kann; sonst ergänzen und im Pull Request nennen.
2. **Projekt:** kleiner Teil „Team“ (neue Datei `js/views/projekt-team.js`, Einbau in `js/views/projekte.js`): Namen mit Zahl ihrer Hüte in diesem Projekt und ihren Gruppen-Rollen. Klick öffnet die Karte (`#/g/<kurz>/team/<person-id>`).
3. **Start:** Zeile im Start-Kopf für die eigene Person (Kapazität fehlt oder abgelaufen), 7 Tage wegklickbar (`js/store.js`). Der Start lädt dafür `Personen` und `Kapazitaet` mit.
4. **„Was ist neu?“** (`js/ui/neu-seit.js`): „Neu im Team: Name“ (von anderen).
5. **Adressen:** `#/g/<kurz>/team/<person-id>` öffnet eine Karte, `#/g/<kurz>/team/ich` die eigene.

**Prüfen:** ToDo-Formular schlägt „Anna (Presse)“ vor und speichert „Anna“. Projekt zeigt Teil „Team“. Start-Zeile bei abgelaufener Angabe, nach dem Wegklicken 7 Tage nicht.

### 9.8 – Hilfe, Feinschliff, Abschluss

Version: 0.31.7. Sheet und Skript bleiben unverändert.

1. Hilfe-Text zum Team (`js/views/hilfe.js`): Gruppen-Rollen (mit dem Hinweis aus Abschnitt 3), Hüte, Kapazität, wer was sieht, eigene Karte als Absprache, Umbenennen, Austragen.
2. Anmerkungen aus den Prüfungen, soweit klein.
3. `docs/STAND.md`: Etappe 9 abschließen, Dateiübersicht, offene Punkte (Datenschutzabsatz für Etappe 10).

**Prüfen:** Hilfe zeigt den Abschnitt. Alles aus 9.2 bis 9.7 läuft noch.

## 7. Regeln und Risiken für Etappe 9

- **Anzeigename ist kein Konto:** Jede Person mit PIN kann sich jeden Namen geben und damit fremde Karten bearbeiten. Die App blendet nur Knöpfe aus. Das steht in der Hilfe. Das Log zeigt, wer zuletzt geändert hat.
- **Namen sind Text:** Hüte und Protokolle speichern Namen als Text. Umbenennen über die Team-Karte zieht ToDos, Meilensteine, Mobi-Beiträge und Umfrage-Antworten mit.
  Wer nur den Anzeigenamen im Gerät ändert, ändert nichts im Sheet (dafür die Frage in 9.4). Tippfehler zeigt „Namen ohne Team-Karte“ (9.5).
- **Umbenennen schreibt viele Zeilen:** Es läuft in einer Sperre und schreibt je Tab und Spalte einmal. Die geänderten Zeilen bekommen ein neues `geaendert_am`.
  Wer gerade so ein ToDo bearbeitet, bekommt beim Speichern den üblichen Konflikt-Hinweis. Das ist gewollt (sonst würde der alte Name zurückgeschrieben).
- **Gewählte Rolle:** Das Skript prüft „höchstens eine Person“ beim Eintragen. Zwei fast gleichzeitige Einträge werden durch die Sperre nacheinander geprüft.
- **Kein Druck, kein Ranking:** Keine Sortierung nach Kapazität, keine Rangliste. Kapazität und Notiz sind freiwillig.
- **Datenschutz:** Nur für die eigene Gruppe (Token), nie öffentlich (keine Aktion ohne Login, nichts in `Termine.gs`). Wenig speichern, Austragen löscht (weich, nach 90 Tagen endgültig), alte Kapazitäten werden aufgeräumt.
- **Texte** nur mit `textContent`, auch im SVG. Das Skript schützt Werte mit `=`, `+`, `-`, `@`.
- **Strenge Spaltenköpfe:** Beim Schreiben in `Personen`, `Gruppen_Rollen` und `Kapazitaet`, beim Austragen und beim Umbenennen prüft das Skript die Köpfe streng.
  Fehlt ein Tab, kann der Reiter Team (ab 9.2) nicht laden. Lesen in den anderen Reitern prüft keine Köpfe und läuft weiter. Trotzdem gilt wie immer: zuerst das Sheet, dann das Skript.
- **Nicht vom Agenten prüfbar:** Aussehen am Handy, echte Bereitstellung, Editor-Tests im echten Sheet. Der Agent prüft Rechenfunktionen mit `node` (auch das Skript, mit einem nachgebauten Sheet) und sagt ehrlich, was offen bleibt.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 9.0 | Plan Fassung 1 mit Rückfragen | 0.30.15 | nein |
| 9.1 | Plan Fassung 2; Spalten `Personen`, Tabs `Gruppen_Rollen` und `Kapazitaet`, `Team.gs`, Aufräumen | 0.31.0 | **ja, von Hand** |
| 9.2 | Reiter Team: Karten und Detail (lesen) | 0.31.1 | nein |
| 9.3 | Gruppen-Rollen bearbeiten | 0.31.2 | nein |
| 9.4 | Mein Eintrag: eintragen, Rollen, Kapazität, Pause, Austragen, Umbenennen | 0.31.3 | nein |
| 9.5 | Hüte je Person, freie Hüte | 0.31.4 | nein |
| 9.6 | Diagramm „Berg“ | 0.31.5 | nein |
| 9.7 | Verknüpfungen: Namensvorschläge, Projekt, Start, Was ist neu | 0.31.6 | nein |
| 9.8 | Hilfe, Feinschliff, Abschluss | 0.31.7 | nein |

Die Versionen in dieser Tabelle sind die geplanten. Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.
Die echten Versionen stehen oben unter „Erledigt“.

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.
