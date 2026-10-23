# Plan Etappe 9: Team (Fassung 1, 22.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: Fassung 1, wartet auf Antworten.** Die Person beantwortet die Rückfragen in Abschnitt 4. Danach kommt Fassung 2.
Erst mit Fassung 2 wird gebaut. Bis dahin ist nur Schritt 9.0 (dieser Plan, nur Doku) erlaubt.
**Erledigt:** noch nichts (9.0 läuft mit Version 0.30.15).

## 1. Ziel

- **Wer ist im Team?** Ein neuer Reiter **„Team“** zeigt alle Personen der Gruppe als Karten.
  Jede Person trägt sich selbst ein. Die Zuordnung läuft über den Anzeigenamen („Wer bist du?“).
- **Hüte pro Person:** Jede Person nennt ihre Hüte, also die Aufgaben, um die sie sich dauerhaft kümmert
  (zum Beispiel Presse, Instagram, Finanzen, Material, Versammlungsleitung, Awareness).
- **Kapazität:** Jede Person sagt mit einer Zahl von 1 bis 10, wie viel Zeit und Kraft sie gerade hat.
  Die Angabe gilt bis zu einem Datum (Gültigkeitsdatum). Danach ist sie „abgelaufen“ und zählt nicht mehr.
- **Diagramm „Berg“:** Ein Bild zeigt, wie viel Kraft die Gruppe in den nächsten Wochen hat (die Summe der Kapazitäten als Berg),
  und wo Aktionen und viele fällige Aufgaben liegen. So sieht die Gruppe früh, wann es eng wird.
- Alle Angaben sind **nur für die eigene Gruppe** sichtbar (wie alles hinter dem PIN). Nichts davon ist öffentlich.

## 2. Ausgangslage (im Repo geprüft am 22.10.2026, Version 0.30.14)

`js/config.js` und `sw.js` haben beide `0.30.14`, wie `docs/STAND.md`.

**Was es schon gibt und was davon wiederverwendet wird:**

- **Tab `Personen`** (`apps-script/Schema.gs`, Zeile 23): Spalten `name, aktiv` (dazu die Basis-Spalten `id, gruppe_id, …`).
  - Es gibt **keine Oberfläche** dafür und keinen Eintrag in `js/schema.js`.
  - Gelesen wird der Tab nur als Namensvorschlag: im Protokoll-Formular (`js/views/protokoll.js`, Zeile 674,
    `namenVorschlaege` in `js/views/protokoll-rechnen.js`, Zeile 116, beachtet `aktiv`) und bei den Reden (`js/views/reden.js`, Zeile 289).
  - Das Skript liefert `personen` auch in der Aktion `bootstrap` (`apps-script/Daten.gs`, Zeile 158). Die App ruft `bootstrap` zurzeit **nicht** auf.
  - Ob im Sheet schon Namen im Tab `Personen` stehen, weiß der Agent nicht (Rückfrage 4).
  - **Wiederverwendung:** `Personen` wird die Liste der Team-Mitglieder (eine Zeile je Person). Die Hüte kommen als neue Spalte dazu.
- **Tab `Projekt_Team`** (`projekt_id, person, zustaendigkeit`): wird seit Etappe 4 nicht mehr benutzt. Er steht noch in
  `PROJEKT_PFLICHT` und `PROJEKT_ABHAENGIG` (`apps-script/Daten.gs`, Zeilen 6 und 10), im Löschfenster eines Projekts
  (`js/views/projekte.js`, Zeile 39) und in `js/schema.js` (Zeile 65, Feld „Hut (Zuständigkeit)“).
  **Vorschlag:** nicht wiederbeleben. Wer an einem Projekt mitarbeitet, wird aus den Aufgaben berechnet (Schritt 9.6). Rückfrage 9.
- **Hüte heute** (`js/views/todos-hut.js`): Ein „Hut“ ist bisher ein **offenes ToDo ohne Verantwortliche** (`istOffenerHut`).
  Knöpfe „Hut übernehmen“ und „Weitergeben“ (`huetKnoepfe`). „Offene Hüte“ im Projekt, „Noch offen“ im Reiter ToDos, Schalter „Hüte“ auf dem Start
  (`js/views/start.js`, Zeile 355). Sammel-ToDos aus Mobi zeigen „Hut frei“ (`js/views/mobi-todo.js`).
  **Achtung, Wortgleichheit:** „Hut“ heißt dann zweierlei (freie Aufgabe und dauerhafte Zuständigkeit einer Person). Rückfrage 1.
- **`@Name` im Protokoll:** Die Markierung `☐ @Name: Aufgabe` legt ein ToDo mit `verantwortlich = Name` an (`leseMarkierungen`,
  `js/views/protokoll-rechnen.js`, Zeile 503). Ohne `@` ist der Hut frei. Das bleibt so. Die Namen stehen danach als Text im ToDo.
- **Rollen im Protokoll** (`rollenFuer`, `js/views/protokoll-rechnen.js`, Zeile 37): Moderation, Protokoll, Awareness (FFF und GP).
  Sie gelten nur für ein einzelnes Treffen. Sie sind **keine** Hüte im Sinn dieser Etappe, eignen sich aber als Vorschlag für Hüte.
- **Anzeigename** (`js/store.js`, Zeile 26: `getName`, `setName`, höchstens 60 Zeichen; Frage „Wer bist du?“ in `js/app.js`, Zeile 103, `frageName` aus `js/ui/modal.js`):
  - Er liegt nur im Gerät und wird bei jedem Schreiben als `erstellt_von` / `geaendert_von` ins Sheet geschrieben.
  - Er ist freier Text. „Anna“, „anna“ und „Anna K.“ sind für die App verschiedene Namen.
- **Verantwortliche** sind in `ToDos.verantwortlich`, `Meilensteine.verantwortlich` und `Mobi_Plan.verantwortlich` freier Text, mehrere mit Komma.
  `istMeins` (`js/views/todos-rechnen.js`, Zeile 141) sucht den Namen als **Teilwort** („Ben“ passt auch auf „Bente“).
  Der Filter „Verantwortlich“ im Reiter ToDos prüft dagegen jede Person einzeln. Für das Team brauchen wir den genauen Vergleich (Schritt 9.4).
- **Kommentare** (`js/ui/kommentare.js`, `baueKommentare`): gibt es für ToDos, Pinnwand, Mobi, Reden. **Vorschlag:** keine Kommentare an Personen (Datenschutz, Rückfrage 12).
- **Kalender** (`js/views/kalender-rechnen.js`, `baueTermine`, Zeile 134): kennt Aktionsdatum, Deadline, Veranstaltungen, ToDo-Fristen, Meilensteine, Mobi-Beiträge.
  Der Berg nimmt daraus die Aktionen und die fälligen Aufgaben je Woche. Helfer `addTage`, `tageZwischen`, `wocheVon`, `wochentagNr` werden wiederverwendet.
- **Mobi** (`js/views/mobi-rechnen.js`, `istVeroeffentlicht`; `js/views/mobi-zeitstrahl.js`): Beiträge mit `verantwortlich` zählen als Aufgaben.
  Der Zeitstrahl ist mit `div`-Elementen gebaut. SVG wird bisher nur für kleine Symbole benutzt (`createElementNS` in `js/views/kalender.js` und `js/views/login.js`).
- **Weitere Bausteine:** `js/ui/dom.js` (`el`, `leeren`), `js/ui/detail.js` (Detailbereich rechts, Handy Vollbild), `js/ui/form.js` (`baueFormular`,
  Feldtypen text, zahl, datum, auswahl, bool, langtext), `js/ui/balken.js` (`fortschrittsBalken`), `js/ui/fenster.js`, `js/ui/toast.js`,
  `js/ui/neu-seit.js` („Was ist neu?“), `js/cache.js` (`ladeMitCache`).
- **Reiter:** `js/ui/nav.js` (`TABS`, `UNTEN`), `js/config.js` (`features`), `js/views/mehr.js` (Zeile 14: Liste der Reiter unter „Mehr“).
- **Skript:** `typisieren` (`apps-script/Util.gs`, Zeile 74) prüft nur „ist eine Zahl“, keinen Bereich. Für 1 bis 10 braucht es eine eigene Prüfung (Schritt 9.1).
  `listMehrere` nimmt höchstens 12 Tabellen auf einmal.

## 3. Was fest steht (aus `docs/STAND.md`, Abschnitt „Plan Etappen 7 bis 11“)

1. Neuer **Reiter Team**.
2. **Hüte pro Person.**
3. **Kapazität 1 bis 10 mit Gültigkeitsdatum.**
4. **Diagramm „Berg“.**
5. Angaben sind **für die Gruppe sichtbar**. **Zuordnung über den Anzeigenamen.**
6. **Neuer Sheet-Tab `Kapazitaet`.**

Alles andere in diesem Plan ist ein **Vorschlag** des Agenten und wird in Abschnitt 4 abgefragt.

## 4. Rückfragen (mit Vorschlag)

Bitte zu jeder Nummer kurz „ja“ oder die eigene Antwort. Die Schritte in Abschnitt 6 sind nach den Vorschlägen geschrieben.

| Nr | Frage | Vorschlag |
|---|---|---|
| 1 | **Was ist ein „Hut“ im Team?** Heute heißt „Hut“ in der App: offenes ToDo ohne Verantwortliche. | Im Team ist ein Hut eine **dauerhafte Zuständigkeit**, die eine Person selbst wählt (zum Beispiel „Presse“). Das alte Wort bleibt, wie es ist („Hut frei“, „Hut übernehmen“). Beides passt zusammen: Ein freier Hut ist eine Aufgabe, die noch jemand braucht. Im Reiter Team heißt der Abschnitt „Meine Hüte“, die freien Aufgaben heißen dort „Freie Hüte (Aufgaben)“. |
| 2 | **Welche Hüte stehen zur Auswahl?** | Freier Text mit Vorschlägen. Vorschläge: eine feste Liste je Gruppe in `js/views/team-rechnen.js` (Presse, Instagram, Social Media, Webseite, Finanzen, Material, Versammlungsleitung, Awareness, Moderation, Protokoll, Kontakt zu anderen Gruppen, Neue begleiten, Technik) plus alle Hüte, die schon jemand in der Gruppe trägt. Die Person schickt die Liste je Gruppe, wenn sie anders sein soll. |
| 3 | **Was bedeutet die Zahl der Kapazität?** | 1 = „Ich habe kaum Zeit oder Kraft“, 10 = „Ich habe viel Zeit und Lust auf mehr“. Die App zeigt unter der Auswahl einen kurzen Satz je Bereich: 1–3 „kaum Zeit“, 4–6 „etwas Zeit“, 7–8 „gut Zeit“, 9–10 „viel Zeit“. Es geht um Zeit und Kraft zusammen, nicht um Können. Keine 0. Wer gar nicht kann, setzt „Pause“ (Frage 6). |
| 4 | **Steht im Tab `Personen` im Sheet schon etwas?** | Die Person schaut nach und sagt es. Stehen dort Namen, bleiben sie und erscheinen im Team als „noch ohne Angaben“. Der Agent ergänzt nur Spalten hinten. |
| 5 | **Wer darf was eintragen und ändern?** Es gibt keine Einzelkonten, jede Person mit PIN kann technisch alles. | Jede Person **bearbeitet nur ihre eigene Karte** (Anzeigename = Name in `Personen`, Groß- und Kleinschreibung egal). Bei fremden Karten zeigt die App keinen Bearbeiten-Knopf. Ausnahme: „Für jemanden eintragen“ (zum Beispiel für eine Person ohne Handy) steht klein unten im Reiter und legt eine neue Karte an. Das ist eine Absprache, kein Schutz: Das Skript prüft den Namen nicht. Das steht in der Hilfe. |
| 6 | **Pause und Austragen:** Was passiert, wenn jemand eine Zeit nicht kann oder die Gruppe verlässt? | **Pause:** Schalter auf der eigenen Karte (Spalte `aktiv` = FALSE). Die Karte rutscht nach unten unter „Pausiert“, zählt nicht im Berg und steht nicht mehr in den Namensvorschlägen. **Austragen:** Knopf „Mich austragen“ mit Rückfrage. Die Zeile in `Personen` und alle Kapazitäts-Einträge werden gelöscht (weich, nach 90 Tagen endgültig über `aufraeumen`). Namen in alten ToDos und Protokollen bleiben (sie sind Text). |
| 7 | **Gültigkeitsdatum:** Wie lange gilt eine Angabe, und was passiert danach? | Beim Eintragen schlägt die App **4 Wochen** vor, mit Schnellknöpfen „2 Wochen“, „1 Monat“, „3 Monate“ und freiem Datum (höchstens 6 Monate). Danach steht auf der Karte „abgelaufen seit TT.MM.“ (grau), die Zahl zählt nicht mehr im Berg. Die eigene Person sieht auf dem Start einen kleinen Hinweis „Deine Kapazität ist abgelaufen. Kurz aktualisieren?“ (Frage 13). |
| 8 | **Wie sieht der „Berg“ aus?** | Ein Flächen-Diagramm über die Wochen: links 2 Wochen zurück, rechts 10 Wochen voraus (am Handy 1 zurück, 6 voraus). Die Höhe ist die **Summe der Kapazitäten** der Gruppe in der Woche (nur gültige Angaben, keine Pausierten). Darunter kleine Balken: **Zahl der fälligen offenen Aufgaben** je Woche (ToDos, Meilensteine, Mobi-Beiträge). Senkrechte Linien für **Aktionen** (Projekt-Aktionsdatum, grün) und **Heute** (gestrichelt). Antippen einer Woche zeigt darunter: Woche, Summe, Zahl der Personen mit Angabe, Aufgaben, Aktionen. Wochen mit vielen Aufgaben und wenig Kraft bekommen einen orangen Hinweis („Hier wird es eng“). Gebaut als SVG mit `createElementNS`, ohne Bibliothek. |
| 9 | **Ist der Berg gestapelt nach Personen** (jede Person eine Schicht in eigener Farbe) **oder eine Fläche für alle?** | **Eine Fläche für alle.** Wer wie viel beiträgt, steht auf den Karten, nicht im Bild. Das vermeidet Vergleichen („wer zieht den Berg runter“). Im Antipp-Text steht nur die Summe und die Zahl der Personen. |
| 10 | **Zusammenspiel mit ToDos und Projekten:** Was zeigt die Karte einer Person? | Berechnet, nicht gespeichert: offene ToDos, offene Meilensteine und offene Mobi-Beiträge, bei denen die Person in `verantwortlich` steht (genauer Vergleich je Name, nicht als Teilwort), und die Projekte, in denen sie Aufgaben hat. Im Detail stehen die Listen mit Links (wie im Reiter ToDos). Auf der Karte steht nur „5 Aufgaben · 2 Projekte“. **`Projekt_Team` bleibt ungenutzt.** Im Projekt kommt ein kleiner Teil „Team“: Namen mit ihren Aufgaben-Zahlen und Hüten (Schritt 9.6). |
| 11 | **Hilft die App beim Verteilen von Aufgaben?** | Ja, sanft: (a) Im Reiter Team gibt es den Abschnitt „Freie Hüte (Aufgaben)“ mit den offenen ToDos ohne Verantwortliche und dem Knopf „Hut übernehmen“ (aus `todos-hut.js`). (b) In „Hut weitergeben“ und im Feld „Verantwortlich“ stehen Team-Mitglieder zuerst, mit ihren Hüten im Vorschlag, zum Beispiel „Anna (Presse, Material)“. Die Kapazitätszahl steht dort **nicht** (Datenschutz, kein Druck). Es gibt **keine** automatische Verteilung. |
| 12 | **Datenschutz:** Welche Daten über Personen speichern wir? | Nur: Name (wie der Anzeigename), Hüte, Kapazität mit Datum, eine **kurze freiwillige Notiz** (höchstens 120 Zeichen, zum Beispiel „Prüfungszeit bis Juli“). Kein Nachname nötig, keine Telefonnummer, keine E-Mail, kein Foto, kein Geburtstag. Unter der Notiz: „Schreib keine Gründe auf, die deine Gesundheit oder Familie betreffen.“ Keine Kommentare an Personen, keine Statistik über Anwesenheit aus den Protokollen. Der Datenschutztext (Etappe 10) bekommt einen Absatz zum Team. |
| 13 | **Start-Seite:** Soll das Team auf dem Start erscheinen? | Keine eigene Kachel. Nur eine Zeile im Start-Kopf für die eigene Person, wenn ihre Kapazität fehlt oder abgelaufen ist („Trag kurz ein, wie viel Zeit du hast“ → öffnet den Reiter Team mit der eigenen Karte). Die Zeile lässt sich für 7 Tage wegklicken (merkt sich das Gerät). |
| 14 | **„Was ist neu?“** | Nur „Neu im Team: Name“. Änderungen an der Kapazität und an Hüten stehen **nicht** drin (kein Druck, kein Mitlesen). |
| 15 | **Verlauf der Kapazität:** neue Zeile je Angabe oder eine Zeile je Person überschreiben? | **Neue Zeile je Angabe** (Tab `Kapazitaet`). So kann der Berg auch rückwärts zeigen, und eine neue Angabe ab einem späteren Datum ist möglich (zum Beispiel „ab 01.12. wieder 7“). Die eigene Karte zeigt die letzten Angaben (höchstens 6 Monate zurück) mit „Löschen“. Ältere Zeilen löscht `aufraeumen` (Frage 16). |
| 16 | **Alte Angaben aufräumen:** Wie lange bleiben abgelaufene Kapazitäts-Einträge? | 6 Monate nach `gueltig_bis` werden sie beim halbjährlichen `aufraeumen` (Editor) gelöscht. Dazu bekommt `apps-script/Aufraeumen.gs` eine kleine Regel. Es braucht dafür keine neue Bereitstellung (wie bisher bei `aufraeumen`). |
| 17 | **Namen ändern:** Was passiert, wenn jemand seinen Anzeigenamen ändert („Name ändern“)? | Findet die App zum neuen Namen keine Karte, aber zum alten, fragt sie einmal: „Deine Team-Karte heißt noch ‚Anna‘. Auf ‚Anna K.‘ umbenennen?“ Umbenennen ändert nur `Personen.name`. Alte ToDos und Protokolle behalten den alten Namen (Hinweis im Fenster). Die Kapazitäts-Zeilen hängen an der ID der Person (`person_id`), nicht am Namen, und bleiben dran. |
| 18 | **Gleicher Name doppelt:** Zwei Personen heißen „Anna“. | Das Skript lehnt einen zweiten aktiven Eintrag mit gleichem Namen in der Gruppe ab (Groß- und Kleinschreibung egal): „Den Namen gibt es im Team schon. Nimm zum Beispiel ‚Anna K.‘.“ |
| 19 | **Handy und PC:** | **PC:** Karten in einem Raster (drei Spalten), oben der Berg über die ganze Breite, Detail rechts. **Handy:** Berg oben (kleiner, weniger Wochen), darunter die eigene Karte, dann die anderen untereinander, Detail als Vollbild mit „← Zurück“. Die Auswahl 1 bis 10 sind zehn Knöpfe in zwei Reihen (je mindestens 44 px hoch), kein Schieberegler (der ist am Handy schwer zu treffen). Der Reiter steht am PC in der Seitenleiste nach „Dokumentation“, am Handy unter „Mehr“ (👥). |
| 20 | **Reihenfolge der Karten:** | Eigene Karte zuerst (Marke „Du“). Dann alle anderen nach Namen (A–Z). Pausierte als Aufklapper ganz unten. **Nicht** nach Kapazität sortiert. Filter: Suche (Name, Hut) und „Hut“ (Auswahl der vorkommenden Hüte). |

## 5. Datenmodell (Vorschlag)

Die Person tippt Spalten und Tabs **von Hand** ins Sheet (siehe CLAUDE.md Abschnitt 7). `gruppe_id` heißt wirklich so.

**Tab `Personen`** (besteht: `name, aktiv`). Neu dahinter, in dieser Reihenfolge:
`huete, notiz`
- `name`: wie der Anzeigename (höchstens 60 Zeichen, wie in `js/store.js`). In der Gruppe nur einmal unter den nicht gelöschten (Frage 18).
- `aktiv`: TRUE = dabei, FALSE = Pause (Frage 6). Leer zählt als TRUE (so liest es `namenVorschlaege` schon heute).
- `huete`: die Hüte der Person, **eine Zeile je Hut** (wie `rollen` bei Protokollen). Höchstens 12 Hüte, je höchstens 40 Zeichen.
- `notiz`: freiwillig, höchstens 120 Zeichen (Frage 12).

**Neuer Tab `Kapazitaet`:** `person_id, wert, gueltig_ab, gueltig_bis, notiz`
- `person_id`: ID der Zeile in `Personen` (muss zur Gruppe gehören und darf nicht gelöscht sein).
- `wert`: ganze Zahl von 1 bis 10 (in `ZAHL_SPALTEN`).
- `gueltig_ab`, `gueltig_bis`: Datum `JJJJ-MM-TT` (Text). `gueltig_ab` ≤ `gueltig_bis`, höchstens 6 Monate auseinander.
- `notiz`: freiwillig, höchstens 120 Zeichen (zum Beispiel „Urlaub“).
- **Welcher Wert gilt an einem Tag?** Von allen Zeilen einer Person, die den Tag abdecken, gilt die **zuletzt angelegte** (`erstellt_am`).
  So überschreibt eine neue Angabe eine ältere, ohne sie zu löschen.

**Keine neuen Spalten** in ToDos, Meilensteinen, Mobi_Plan oder Projekten. Aufgaben und Projekte je Person werden berechnet.
`Projekt_Team` bleibt im Sheet und im Schema, wird weiter nicht benutzt (Frage 10).

## 6. Schritte

### 9.0 – Plan schreiben (nur Doku)

Version: 0.30.15. Sheet und Skript bleiben unverändert.

1. Diese Datei als `docs/PLAN-ETAPPE-9.md` ablegen (Fassung 1 mit Rückfragen).
2. `docs/STAND.md`: Verweis auf den Plan, „Nächster Schritt“, Dateiübersicht, Version.
3. `VERSION` in `js/config.js` und `sw.js` auf 0.30.15.

**Prüfen:** Nur Textdateien und die Versionszeilen geändert. Die App läuft wie vorher und zeigt 0.30.15.

### 9.0a – Fassung 2 (nur Doku, nach den Antworten)

Version: 0.30.16. Antworten der Person in Abschnitt 3 und 4 eintragen, Schritte anpassen, Status-Zeile oben auf „Fassung 2“ setzen.

### 9.1 – Sheet und Skript (Grundlage, einmal von Hand bereitstellen)

Version: 0.31.0. Hier steckt die ganze Handarbeit der Etappe. Danach braucht kein weiterer Schritt eine neue Bereitstellung.

1. `apps-script/Schema.gs`: `Personen` um `huete, notiz` ergänzen, Tab `Kapazitaet` neu, `wert` in `ZAHL_SPALTEN`. Kommentar zu beiden Tabs wie bei den anderen.
   Höchstlängen: `Personen.name` 60, `Personen.notiz` und `Kapazitaet.notiz` 120 (in `MAX_TEXT_AUSNAHMEN`; `maxLaenge` nimmt auch kleinere Werte als 5000).
2. `js/schema.js`: Einträge `Personen` (Name Pflicht, Hüte, Notiz) und `Kapazitaet` (Wert, Gültig ab, Gültig bis, Notiz). Das eigentliche Formular baut 9.3 selbst.
3. Neue Datei `apps-script/Team.gs` (Hilfsfunktionen beginnen mit `team`, keine Variable `aus`):
   - `teamPruefen(tab, daten, ctx, id)`: wird von `create`, `update` und `batchCreate` in `apps-script/Daten.gs` für `Personen` und `Kapazitaet` aufgerufen
     (Muster: `protokollBezugPruefen` in `apps-script/Protokoll.gs`, `mobiBezugPruefen` in `apps-script/Mobi.gs`; lies beide zuerst und hänge dich an dieselbe Stelle).
   - `Personen`: Name nicht leer, höchstens 60 Zeichen, nicht doppelt in der Gruppe (Groß- und Kleinschreibung egal, gelöschte zählen nicht). Höchstens 12 Hüte.
   - `Kapazitaet`: `wert` ganze Zahl 1 bis 10. `person_id` gehört zur Gruppe und ist nicht gelöscht. Datumsform `JJJJ-MM-TT`, `gueltig_ab` ≤ `gueltig_bis`, höchstens 183 Tage auseinander.
     Fehlertexte in einfachen Worten (zum Beispiel „Die Kapazität muss eine Zahl von 1 bis 10 sein.“).
   - **Mitlöschen:** Wird eine Zeile in `Personen` gelöscht, werden ihre `Kapazitaet`-Zeilen mitgelöscht (weich; Muster `mobiKaskade`).
   - Editor-Test `testenTeam`: prüft die Regeln mit Werten im Speicher (0, 11, 5.5, falsches Datum, Datum vertauscht, doppelter Name). Schreibt **nichts** ins Sheet.
     Im Protokoll steht je Fall „ok“ oder „FEHLER“.
4. `apps-script/Aufraeumen.gs`: `Kapazitaet`-Zeilen mit `gueltig_bis` älter als 6 Monate werden in `aufraeumen` gelöscht, `aufraeumenTesten` zählt sie (Frage 16).
5. `js/config.js`: `features.team = false` (der Reiter kommt in 9.2).
6. **Pull-Request-Abschnitt „Von Hand zu erledigen“** (in dieser Reihenfolge, zum Abtippen):
   1. Im Sheet, Tab `Personen`, Zeile 1: hinter `aktiv` die Spalten `huete`, `notiz`.
      Neuer Tab `Kapazitaet`, Zeile 1: `id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, person_id, wert, gueltig_ab, gueltig_bis, notiz`.
   2. Dateien `Schema.gs`, `Daten.gs`, `Aufraeumen.gs` und neu `Team.gs` ganz aus dem Repo in den Editor kopieren.
   3. `formatieren` ausführen (Protokoll: „Formatierung fertig.“). Danach `testenTeam` ausführen: kein „FEHLER“.
   4. Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version“ → Bereitstellen.
7. Version, `docs/STAND.md`, Pull Request. In der App ändert sich noch nichts Sichtbares.

**Prüfen:** App läuft wie vorher. Editor-Test ohne „FEHLER“. Protokoll- und Reden-Formular zeigen weiter Namensvorschläge.

### 9.2 – Reiter Team: Karten und Detail (nur lesen)

Version: 0.31.1. Sheet und Skript bleiben unverändert.

1. Neuer Reiter `team` (👥, „Team“) in `js/ui/nav.js` (`TABS`, nach `protokoll`), `js/config.js` (`features.team = true`), am Handy unter „Mehr“ (`js/views/mehr.js`, Zeile 14).
2. Neue Datei `js/views/team.js` (`render(container, ctx)`): lädt `Personen` und `Kapazitaet` mit `listMehrere` (Zwischenspeicher `gruppe_id:team`, `ladeMitCache`).
3. Neue Datei `js/views/team-rechnen.js`: `STANDARD_HUETE` je Gruppe, `hueteLesen`/`hueteText` (eine Zeile je Hut), `istIch(person, name)` (genauer Vergleich ohne Groß/klein),
   `kapazitaetAm(person, kapazitaeten, tag)` (Regel aus Abschnitt 5), `kapazitaetText(wert)` („kaum Zeit“ … „viel Zeit“), `abgelaufen`, `sortierePersonen` (Frage 20).
   Kleine Beispiele als Kommentar, mit `node` geprüft (Kopie als `.mjs`).
4. **Karte:** Name (Marke „Du“ bei der eigenen), Hüte als Chips, Kapazität als Balken 1 bis 10 mit Zahl und Satz, „gilt bis TT.MM.“ bzw. „abgelaufen seit TT.MM.“ (grau), „noch keine Angabe“, Notiz (klein).
   Ohne eigene Karte steht oben ein Kasten „Du bist noch nicht im Team. [Mich eintragen]“ (Knopf gesperrt bis 9.3, mit Hinweis „kommt im nächsten Schritt“).
5. **Detail** (Detailbereich rechts, Handy Vollbild mit „← Zurück“): alle Angaben, Verlauf der Kapazität (letzte 6 Monate, neueste oben).
6. Suche (Name, Hut), Filter Hut. Pausierte als Aufklapper unten. Leere Liste: freundlicher Text.
7. Neue Dateien in `sw.js` (`HUELLE`), CSS ans Ende von `css/components.css`.

**Prüfen:** Reiter am PC in der Seitenleiste, am Handy unter „Mehr“. Ein von Hand ins Sheet geschriebener Test-Eintrag in `Personen` (und einer in `Kapazitaet`) erscheint als Karte (danach im Sheet löschen). Abgelaufene Angabe ist grau.

### 9.3 – Mein Eintrag: ins Team eintragen, Hüte, Kapazität

Version: 0.31.2. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/team-eintrag.js`: Formular im Detailbereich (am Handy Vollbild), für die eigene Karte.
   - **Ins Team eintragen:** legt die Zeile in `Personen` mit dem Anzeigenamen an. Ohne Anzeigenamen erst „Wer bist du?“ (`frageName`).
   - **Hüte:** Chips zum Antippen (Vorschläge aus `STANDARD_HUETE` und den Hüten der anderen), Feld „Eigener Hut“ mit „+“. Nochmal antippen = abwählen.
   - **Kapazität:** zehn Knöpfe 1 bis 10 (Frage 19) mit Satz darunter. „Gilt ab“ (heute), „gilt bis“ mit Schnellknöpfen (Frage 7). Notiz mit Zähler und Datenschutzsatz (Frage 12).
     Speichern legt eine **neue** Zeile in `Kapazitaet` an (Frage 15).
   - **Pause** (Schalter, `aktiv`), **Mich austragen** (Rückfrage, `delete` auf `Personen`, das Skript löscht die Kapazität mit).
   - Verlauf: einzelne Kapazitäts-Zeilen löschen (Rückfrage).
2. Ändern der `Personen`-Zeile mit Konfliktprüfung (`bekannt` = `geaendert_am`). Keine Offline-Schreibzugriffe.
3. „Für jemanden eintragen“ (Frage 5): klein unten im Reiter, legt eine Karte mit eingegebenem Namen an; diese Karte darf danach von allen bearbeitet werden,
   solange niemand mit diesem Anzeigenamen sie übernimmt (Marke „eingetragen von …“ aus `erstellt_von`). **Nur wenn Frage 5 so beantwortet wird.**
4. **Namen ändern** (Frage 17): Beim Öffnen des Reiters prüfen, ob es zum aktuellen Anzeigenamen keine Karte gibt, aber zum vorigen Namen auf diesem Gerät.
   Dafür merkt sich `js/store.js` den vorigen Namen (`setName` schreibt ihn mit). Lies `js/store.js` und `js/app.js` zuerst.

**Prüfen:** Eintragen, Hüte wählen, Kapazität 7 für 2 Wochen speichern, Seite neu laden: Karte zeigt alles. Zweite Angabe „ab nächstem Monat 3“: Verlauf zeigt beide, heute gilt 7.
Gleichen Namen auf einem zweiten Gerät eintragen: Meldung „Den Namen gibt es schon“. Pause: Karte unten. Austragen: Karte weg.

### 9.4 – Aufgaben je Person und freie Hüte

Version: 0.31.3. Sheet und Skript bleiben unverändert.

1. `team.js` lädt zusätzlich `ToDos`, `Meilensteine`, `Mobi_Plan`, `Projekte` (zusammen 6 Tabellen, unter der Grenze von 12).
2. `team-rechnen.js`: `namenAus(verantwortlich)` (trennt an Komma und Strichpunkt; `namenAusListe` in `protokoll-rechnen.js` wiederverwenden, wenn es passt),
   `aufgabenVon(name, daten)`: offene ToDos, offene Meilensteine, nicht veröffentlichte Mobi-Beiträge; nur offene Projekte (Status nicht erledigt/archiviert); genauer Namensvergleich.
3. **Karte:** „5 Aufgaben · 2 Projekte“. **Detail:** Listen mit Frist (überfällig rot, heute orange wie überall), Klick führt wie im Reiter ToDos bzw. Mobi zum Eintrag.
4. **Abschnitt „Freie Hüte (Aufgaben)“** oben im Reiter (Frage 11): offene ToDos ohne Verantwortliche (`istOffenerHut`), nächste Frist zuerst, höchstens 10, darunter „Alle im Reiter ToDos →“.
   Knopf „Hut übernehmen“ aus `huetKnoepfe` (`js/views/todos-hut.js`), nicht nachbauen.
5. Ein Name, der in Aufgaben vorkommt, aber keine Karte hat, steht unten unter „Namen ohne Team-Karte“ (nur Name und Zahl, kein Eintrag).

**Prüfen:** ToDo mit „Anna, Ben“ zählt bei beiden, nicht bei „Bente“. Erledigtes ToDo zählt nicht. „Hut übernehmen“ im Team setzt den eigenen Namen, die Karte zählt eins mehr.

### 9.5 – Diagramm „Berg“

Version: 0.31.4. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/team-berg.js` (`baueBerg(daten, opt)`), SVG mit `document.createElementNS` (kein `innerHTML`, keine Bibliothek). Lies vorher `js/views/mobi-zeitstrahl.js` (Achse, Heute-Linie, Montage) und übernimm die Rechenhelfer aus `js/views/kalender-rechnen.js`.
2. Rechnen (in `team-rechnen.js`, mit `node` geprüft): je Woche (Montag bis Sonntag) die **Summe der Kapazitäten** am Mittwoch der Woche (`kapazitaetAm`, nur aktive Personen), die Zahl der Personen mit Angabe,
   die Zahl der fälligen offenen Aufgaben (ToDos, Meilensteine, Mobi-Beiträge mit Datum in der Woche) und die Aktionen (Projekt-Aktionsdatum offener Projekte, Veranstaltungen mit Art extern).
   Hinweis „eng“, wenn Aufgaben je Kapazitätspunkt deutlich über dem Mittel liegen (Regel im Pull Request nennen, leicht änderbar).
3. Anzeige (Frage 8 und 9): Fläche in Gruppenfarbe (hell) mit dunkler Kante, Balken für Aufgaben darunter, Linien für Aktionen und Heute, Datum je Montag (am Handy nur jede zweite Woche).
   Antippen einer Woche: Textzeile unter dem Bild. Für Bildschirmleser: `role="img"` mit kurzer Beschreibung und darunter dieselben Zahlen als Liste (aufklappbar „Zahlen zeigen“).
4. Platz: oben im Reiter Team, über den Karten. Zu wenige Angaben (weniger als 2 Personen mit gültiger Kapazität): statt des Bildes ein Satz „Der Berg erscheint, sobald mindestens zwei Personen ihre Kapazität eingetragen haben.“
5. Abgelaufene Angaben zählen nicht. Darunter klein: „Berg aus n von m Personen. Abgelaufene Angaben zählen nicht.“

**Prüfen:** Mit drei erfundenen Personen (zum Beispiel 7, 4 und 2, verschiedene Daten) steigt und fällt die Fläche an den richtigen Wochen. Aktion als grüne Linie. Am Handy passt das Bild ohne Seitwärts-Scrollen.

### 9.6 – Verknüpfungen (ToDos, Projekt, Start, Was ist neu)

Version: 0.31.5. Sheet und Skript bleiben unverändert.

1. **Namensvorschläge** (Frage 11b): Team-Mitglieder (aktiv) zuerst, mit Hüten im Vorschlag, im ToDo-Formular (`js/views/todos.js`, `verantwortlicheVorschlaege`),
   im ToDo im Projekt (`js/views/projekt-todos.js`, `personen`), in „Hut weitergeben“ (`js/views/todos-hut.js`) und im Mobi-Beitrag (`verantwortlich`).
   Gespeichert wird nur der Name (der Zusatz in Klammern wird abgeschnitten). Prüfe, ob `baueFormular` bei `vorschlaege` Wert und Beschriftung trennen kann; sonst ergänzen und im Pull Request nennen.
2. **Projekt:** kleiner Teil „Team“ im aufgeklappten Projekt (neue Datei `js/views/projekt-team.js`, Einbau in `js/views/projekte.js`): Namen mit Zahl ihrer Aufgaben in diesem Projekt und ihren Hüten, Klick öffnet die Karte im Reiter Team (`#/g/<kurz>/team/<person-id>`).
   `Projekt_Team` im Löschfenster (`js/views/projekte.js`, Zeile 39) bleibt, wie es ist.
3. **Start** (Frage 13): Zeile im Start-Kopf für die eigene Person (fehlt / abgelaufen), wegklickbar für 7 Tage (`js/store.js`). Der Start lädt dafür `Personen` und `Kapazitaet` mit (Zwischenspeicher prüfen, Fehlendes ergänzen).
4. **„Was ist neu?“** (Frage 14): neue Personen von anderen („Neu im Team: Name“) in `js/ui/neu-seit.js`.
5. **Adresse:** `#/g/<kurz>/team/<person-id>` öffnet eine Karte, `#/g/<kurz>/team/ich` die eigene (vom Start).

**Prüfen:** ToDo-Formular schlägt „Anna (Presse)“ vor und speichert „Anna“. Projekt zeigt Teil „Team“. Start zeigt die Zeile bei abgelaufener Angabe und nach dem Wegklicken 7 Tage nicht.

### 9.7 – Hilfe, Feinschliff, Abschluss

Version: 0.31.6. Sheet und Skript bleiben unverändert.

1. Hilfe-Text zum Team (`js/views/hilfe.js`): was Hüte und Kapazität sind, dass alle in der Gruppe die Angaben sehen, dass jede Person nur ihre eigene Karte pflegt (Absprache), wie man sich austrägt.
2. Anmerkungen aus den Prüfungen von 9.2 bis 9.6, soweit klein.
3. `docs/STAND.md`: Etappe 9 abschließen, Dateiübersicht, offene Punkte (Datenschutzabsatz für Etappe 10).

**Prüfen:** Hilfe zeigt den Abschnitt. Alles aus 9.2 bis 9.6 läuft noch.

## 7. Regeln und Risiken für Etappe 9

- **Anzeigename ist kein Konto:** Jede Person mit PIN kann sich jeden Namen geben und damit fremde Karten bearbeiten. Die App blendet nur Knöpfe aus.
  Das ist Absprache, kein Schutz, und steht so in der Hilfe. Das Log (`geaendert_von`) zeigt, wer zuletzt geändert hat.
- **Namen sind Text:** ToDos, Meilensteine, Mobi-Beiträge und Protokolle speichern Namen als Text. Tippfehler („Ana“) und Umbenennungen trennen Aufgaben von der Karte.
  Die App vergleicht ohne Groß- und Kleinschreibung und zeigt „Namen ohne Team-Karte“ (9.4), damit so etwas auffällt. Es wird nichts automatisch umgeschrieben.
- **Kein Druck, kein Ranking:** Keine Sortierung nach Kapazität, keine Rangliste, kein „wer macht am wenigsten“. Der Berg zeigt nur die Summe (Frage 9).
  Kapazität und Notiz sind freiwillig. Eine Karte ohne Angabe ist normal.
- **Datenschutz:** Kapazität und Notiz sind Angaben über Personen. Nur für die eigene Gruppe (Token), nie öffentlich (keine Aktion ohne Login, nichts in `Termine.gs`).
  Wenig speichern (Abschnitt 5), Austragen löscht (weich, nach 90 Tagen endgültig), alte Kapazitäten werden aufgeräumt (Frage 16).
- **Texte** nur mit `textContent` (`el()` mit `text:`), auch im SVG (`textContent` auf `<text>`). Das Skript schützt Werte mit `=`, `+`, `-`, `@` (wie überall).
- **Gleichzeitiges Arbeiten:** `Personen` mit Konfliktprüfung. `Kapazitaet` wird nur angelegt oder gelöscht, nicht geändert (keine Konflikte).
- **Datenmenge:** etwa 20 Personen, eine Angabe alle paar Wochen: wenige hundert Zeilen im Jahr. Kein Problem für `list`.
- **Nicht vom Agenten prüfbar:** Aussehen am Handy, Antippen im Berg auf echten Geräten, die Bereitstellung, die Editor-Tests im echten Sheet.
  Der Agent prüft Rechenfunktionen mit `node` und die Oberfläche im Browser mit erfundenen Daten und sagt in jedem Pull Request ehrlich, was er nicht prüfen konnte.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 9.0 | Plan Fassung 1 mit Rückfragen | 0.30.15 | nein |
| 9.0a | Plan Fassung 2 nach den Antworten | 0.30.16 | nein |
| 9.1 | Spalten `Personen`, Tab `Kapazitaet`, `Team.gs`, Aufräumen | 0.31.0 | **ja, von Hand** |
| 9.2 | Reiter Team: Karten und Detail (lesen) | 0.31.1 | nein |
| 9.3 | Mein Eintrag: eintragen, Hüte, Kapazität, Pause, Austragen | 0.31.2 | nein |
| 9.4 | Aufgaben je Person, freie Hüte | 0.31.3 | nein |
| 9.5 | Diagramm „Berg“ | 0.31.4 | nein |
| 9.6 | Verknüpfungen: Namensvorschläge, Projekt, Start, Was ist neu | 0.31.5 | nein |
| 9.7 | Hilfe, Feinschliff, Abschluss | 0.31.6 | nein |

Die Versionen in dieser Tabelle sind die geplanten. Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.
Die echten Versionen stehen später oben unter „Erledigt“.

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.
