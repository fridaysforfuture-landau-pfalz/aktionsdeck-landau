# Plan Etappe 8: Protokoll, Reden und Learnings (Fassung 2, 22.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status:** Die Person hat die Fragen aus Fassung 1 beantwortet (Abschnitt 3). Die Fragen A bis C und E aus Abschnitt 4 sind am 22.10.2026 bestätigt.
Schritt 8.0 darfst du sofort bauen. Auch 8.1 darfst du bauen. Frage D ist am 22.10.2026 beantwortet (Adresse der Seite, siehe Abschnitt 4).
**Erledigt:** 8.0 (Version 0.29.12), 8.1 (Version 0.30.0, von Hand bereitgestellt), 8.2 (Version 0.30.1), 8.3 (Version 0.30.2), 8.3a Anpassungen aus der Prüfung (Version 0.30.3: Formular im Inhalt, TOP-Sammlung mit neuem Tab TOPs, Formatierung im Dokument). Die Versionen von 8.4 bis 8.7 verschieben sich um eins.
**Änderungen der Person (22.10.2026):** Der Reiter heißt in der Anzeige **„Dokumentation“** (Kennung bleibt `protokoll`). GP hat jetzt ebenfalls ein Google-Dokument (`PROTOKOLL_DOK_g2`), Entscheidung A gilt für GP damit nicht mehr.

## 1. Ziel

- **Dauerprotokoll:** Die Gruppe schreibt Protokolle in der App. Gespeicherte Protokolle werden an das Google-Dokument der Gruppe angehängt
  (neueste oben). Im Protokoll lassen sich ToDos, Learnings, Termine, Mitteilungen und Umfragen **markieren**. Daraus entsteht nach dem Speichern eine Liste
  zum Abhaken.
- **Reden-Archiv:** Liste aller Reden mit Link zum Drive-Dokument, Probelesen über die Kommentare, Verknüpfung zu Projekten.
- **Learnings aus dem Protokoll:** Markierte Learnings erscheinen in derselben Abhak-Liste, sortiert nach Aktionsart.

## 2. Ausgangslage (im Repo geprüft am 22.10.2026, Version 0.29.10)

- Der Tab `Protokolle` gibt es (`projekt_id, datum, titel, teilnehmende, text`). Er steht in `PROJEKT_PFLICHT` und `PROJEKT_ABHAENGIG`
  (`apps-script/Daten.gs`, Zeilen 5 und 9) und in `js/schema.js`. Benutzt wird er nur im Löschfenster eines Projekts (`js/views/projekte.js`, Zeile 41). Keine Oberfläche.
- Learnings: Tab und Teil im Projekt (`js/views/projekt-learnings.js`). Kommentare: `baueKommentare` (`js/ui/kommentare.js`), `bezug_art` `todo`, `pinnwand`, `mobi`.
- Drive: `apps-script/Upload.gs` nutzt Skripteigenschaften für Ordner-IDs (`FOTO_ORDNER_<gruppe_id>`). Dokument-IDs bekommen dasselbe Muster.
- Reiter: `js/ui/nav.js` (`TABS`), `js/config.js` (`features`), `js/views/mehr.js` (Reiter, die am Handy nicht unten stehen).
- Vorhandene Bausteine, die du wiederverwendest: `ToDos` (`batchCreate`), `Veranstaltungen`, `Mitteilungen` (neue sind angeheftet), `Umfragen`, `Learnings`,
  Termin-Vorlagen für Plenen in `js/views/kalender-vorlagen.js` (FFF Donnerstag 18:30, GP Dienstag 19:00), Fenster `js/ui/fenster.js`, Formulare `js/ui/form.js`.
- Die Repo-Adresse in `docs/STAND.md` ist falsch (`KlimastreikLandau/…`, weil das Repo anfangs dort als Unter-Repo angelegt wurde). **Richtig ist
  `https://github.com/fridaysforfuture-landau-pfalz/aktionsdeck-landau`.** Die Adresse der Seite (GitHub Pages) bestätigt die Person (Frage D).

## 3. Entscheidungen der Person (bestätigt am 22.10.2026)

1. Neuer Reiter **„Protokoll"** (📝). Am Handy unter „Mehr", am PC in der Seitenleiste nach „Kalender". Der Reiter hat einen Umschalter **Protokolle · Reden**. Es gibt **keinen** Unter-Reiter für Learnings-Vorschläge.
2. **FFF:** Das Protokoll kommt in ein Google-Dokument, **immer oben** unter einer festen Stelle (siehe 8.1). Die Dokument-ID steht nur in der Skripteigenschaft, nie im Repo oder in diesem Plan.
3. **Ein Dokument je Gruppe.** Die Person legt es an und gibt es von Hand frei. Das Skript teilt nie etwas.
4. **Kein Bearbeiten in der App nach dem Speichern.** „Bearbeiten" öffnet das **Dokument**. Solange ein Protokoll noch nicht im Dokument steht (`im_dokument` = FALSE), darf die App es ändern.
5. **Protokolle und Reden werden nie gelöscht.** Es gibt kein Löschen in der App. Das Skript sperrt `delete` für beide Tabs. Protokolle bleiben auch beim Löschen eines Projekts erhalten.
6. **Protokolle können mit einem Projekt verknüpft sein**, damit Learnings zur Aktionsart des Projekts angelegt werden können.
7. **Reden** haben einen Status (Entwurf · Probelesen · Fertig · Gehalten), können mit Projekt oder Veranstaltung verknüpft sein und stehen **auch im Projekt** (Teil „Reden"). Das ToDo „Reden festlegen" bleibt wie es ist.
8. **Markierungen im Text:** Per Knopf (und optional Tastenkürzel) wird eine Markierung eingefügt. Es gibt **keine KI-Erkennung**.
9. **Hüte:** `@Name` markiert schon heute einen Hut. Das gilt auch im Protokoll (Namensauswahl beim Tippen von `@`).
10. **„Nächstes Plenum"** steht am Ende des Protokolls und wird zu einer Veranstaltung mit Datum (Vorschlag in der Abhak-Liste).
11. Etappe 7 wird mit den Anpassungen der Person abgeschlossen (Schritt 8.0).

## 4. Entscheidungen der zweiten Runde (22.10.2026) und noch Offenes

**Bestätigt:**
- A: GP bleibt zunächst beim Etherpad. Die App baut das Protokoll, speichert es und bietet „Pad öffnen" und „Protokoll kopieren". Eingefügt wird von Hand.
- B: Die Markierungszeile `[[NEUE PROTOKOLLE HIER]]` im FFF-Dokument passt.
- C: GP hat dieselben Rollen wie FFF (Moderation, Protokoll, Awareness). **Klimabündnis braucht vorerst kein Protokoll.** Es bekommt keine Skripteigenschaft und keine Rollen. Die Gruppe kann den Reiter trotzdem benutzen (Archiv und „Protokoll kopieren").
- E: Die Symbole ☐ ToDo, 💡 Learning, 📅 Termin, 📌 Mitteilung, 📊 Umfrage und 👉 Beschluss passen.

**D beantwortet (22.10.2026):** Die Adresse der App ist `https://fridaysforfuture-landau.de/aktionsdeck-landau/`. Sie steht in `docs/STAND.md`.

Die Tabelle zeigt die ursprünglichen Fragen mit den Vorschlägen. Sie gelten damit als bestätigt (D mit der Adresse oben).

| Nr | Frage | Vorschlag |
|---|---|---|
| A | **GP-Protokoll (Etherpad, edupad.ch):** Kann die App automatisch ins Pad schreiben? | Nein, nicht ohne Zugang des Betreibers. Das Pad hat eine Schnittstelle (`setText`, `appendText`), die braucht aber Zugangsdaten vom Betreiber der Instanz, und beide Aufrufe hängen nur ans Ende oder ersetzen den ganzen Text. „Einfügen nach: Aktuelle Projekte …" ist damit nicht sauber möglich (aus der offiziellen Beschreibung der Schnittstelle gelesen, für edupad.ch nicht getestet). **Vorschlag:** GP bleibt zunächst beim Pad. Die App baut das Protokoll (gleiches Formular), speichert es im Sheet, zeigt „Pad öffnen" und „Protokoll kopieren" (Pad-freundlicher Text) und nennt die Einfügestelle. Eingefügt wird von Hand. Alternative: GP wechselt auf ein Google-Dokument, dann klappt es automatisch wie bei FFF. |
| B | **Markierungszeile im Google-Dokument:** Wo genau fügt das Skript ein? | Die Person schreibt an die gewünschte Stelle eine kleine graue Zeile `[[NEUE PROTOKOLLE HIER]]`. Das Skript fügt **direkt darunter** ein und lässt die Zeile stehen. Fehlt die Zeile, schreibt das Skript nichts und meldet es. Nach jedem Protokoll steht eine Trennlinie. |
| C | **Rollen je Gruppe:** FFF: Moderation, Protokoll, Awareness. GP und KB? | GP wie FFF, solange die Person nichts anderes sagt. KB: kein Dokument, nur Archiv in der App. |
| D | **Adresse der Seite (GitHub Pages)** nach dem Umzug des Repos | Die Person nennt sie, der Agent trägt sie in `docs/STAND.md` ein. |
| E | **Symbole der Markierungen** (Abschnitt 6, Schritt 8.4) | Wie dort in der Tabelle. Beschluss mit 👉, weil 🏁 im Kalender für Meilensteine steht. |

## 5. Datenmodell

Die Person tippt Spalten und Tabs **von Hand** ins Sheet (siehe CLAUDE.md Abschnitt 7). `gruppe_id` heißt wirklich so, nicht `gruppen_id`.

**Tab `Protokolle`** (besteht: `projekt_id, datum, titel, teilnehmende, text`). Neu dahinter, in dieser Reihenfolge:
`art, veranstaltung_id, rollen, im_dokument, vorschlaege_erledigt`
- `teilnehmende` = „Anwesend". `text` = der ganze Protokolltext (Tagesordnungspunkte mit Stichpunkten, Markierungen, „Sonstiges", „Nächstes Plenum"). Die Beschriftung im Formular wird „Protokolltext", der Spaltenname bleibt.
- `art`: `plenum | ag | aktion | sonstiges`.
- `rollen`: eine Zeile je Rolle, zum Beispiel `Moderation: Anna`, `Protokoll: Ben`, `Awareness: Cem`. Die Rollen je Gruppe stehen fest in `js/views/protokoll-rechnen.js`.
- `im_dokument`: TRUE, sobald das Protokoll im Dokument steht. `vorschlaege_erledigt`: TRUE, sobald die Abhak-Liste einmal angelegt wurde.
- `projekt_id` und `veranstaltung_id` sind freiwillig. Sind sie gesetzt, müssen sie zur Gruppe gehören.
- Beide Wahrheits-Spalten kommen in `BOOL_SPALTEN`.

**Neuer Tab `Reden`:** `projekt_id, veranstaltung_id, titel, redner, datum, aktionsart, link, status, notiz`
(`status`: `entwurf | probelesen | fertig | gehalten`).

Es gibt **keinen** Tab für Learnings-Vorschläge. Die Vorschläge werden aus den Markierungen im Text berechnet.

**Skripteigenschaften** (nur im Editor, nie im Repo):
- `PROTOKOLL_DOK_<gruppe_id>`: ID des Google-Dokuments (zum Beispiel `PROTOKOLL_DOK_g1`).
- `PROTOKOLL_LINK_<gruppe_id>`: freiwillig, Adresse eines externen Protokolls (zum Beispiel das Etherpad von GP). Wird nur zum Öffnen angezeigt (nur `https://`).

## 6. Schritte

### 8.0 – Etappe 7 abschließen, Stand bereinigen (nur Doku)

Version: nächste freie Nummer. Sheet und Skript bleiben unverändert.

1. Die Anpassungen der Person zu Etappe 7 einarbeiten (die Person hat sie formuliert). Etappe 7 in `docs/STAND.md` als abgeschlossen eintragen, aber nur, wenn alles aus 7.8 im Repo ist.
2. `docs/STAND.md`: Repo-Adresse auf `https://github.com/fridaysforfuture-landau-pfalz/aktionsdeck-landau` ändern. Die Adresse der Seite erst nach Antwort auf Frage D ändern. Abschnitt „Plan Etappen 7 bis 11" korrigieren (Reiter Kalender bleibt, untere Leiste, Verweis auf diese Datei).
3. `CLAUDE.md`: In der Einleitung und in Abschnitt 3 Punkt 1 den Verweis auf `docs/PLAN-ETAPPE-7.md` ändern in „den Plan der laufenden Etappe (`docs/PLAN-ETAPPE-<Nummer>.md`)".
4. Diese Datei als `docs/PLAN-ETAPPE-8.md` ablegen.

**Prüfen:** Nur Textdateien geändert. App läuft wie vorher.

### 8.1 – Sheet und Skript (Grundlage, einmal von Hand bereitstellen)

Version: 0.30.0. Hier steckt die ganze Handarbeit der Etappe. Danach braucht kein weiterer Schritt eine neue Bereitstellung.

1. `apps-script/Schema.gs` und `js/schema.js`: Spalten von `Protokolle` ergänzen, Tab `Reden` neu. Formularfelder:
   - Protokolle: Datum, Titel (Pflicht), Art, Anwesend, Projekt oder Veranstaltung (freiwillig), Protokolltext (langtext). Rollen und „Nächstes Plenum" baut das Protokoll-Formular selbst (8.3).
   - Reden: wie in Abschnitt 5, Titel Pflicht, Status als Auswahl mit großen Beschriftungen (Entwurf, Probelesen, Fertig, Gehalten).
   - Prüfe in `apps-script/Daten.gs` (`pruefeFelder`) die Höchstlänge für Textfelder. Eine Sheet-Zelle fasst höchstens 50 000 Zeichen. Setze für `text` eine Grenze (Vorschlag 20 000) und zeige sie im Formular.
2. `apps-script/Daten.gs`:
   - `Protokolle` aus `PROJEKT_PFLICHT` und `PROJEKT_ABHAENGIG` entfernen. Dann dürfen `projekt_id` und `veranstaltung_id` leer sein. Sind sie gesetzt, prüfe, dass sie zur Gruppe gehören (Muster: `mobiBezugPruefen` in `apps-script/Mobi.gs`).
   - **`delete` für `Protokolle` und `Reden` sperren** (so wie `delete` auf `Projekte` gesperrt ist; lies dort nach, wie). Fehlermeldung: „Protokolle und Reden werden nicht gelöscht."
   - Zähler im Löschfenster eines Projekts in `js/views/projekte.js` (Zeile 41) anpassen: `Protokolle` entfernen.
   - `im_dokument` und `vorschlaege_erledigt` in `BOOL_SPALTEN` eintragen (dort, wo die Liste steht).
3. Neue Datei `apps-script/Protokoll.gs`. Alle Aktionen brauchen Token und Gruppenprüfung wie die anderen und laufen mit `LockService`. Trage sie dort ein, wo `apps-script/Code.gs` die Aktionen verteilt (lies die Datei zuerst):
   - `protokollSpeichern`: Eingabe `daten` (Felder des Protokolls). Legt die Zeile in `Protokolle` an und hängt das Protokoll an das Dokument der Gruppe an. Antwort: `{ eintrag, im_dokument, hinweis }`. Gibt es für die Gruppe **kein** Dokument (keine Skripteigenschaft), bleibt `im_dokument = FALSE`, `hinweis` sagt „Für diese Gruppe ist kein Dokument eingerichtet". Klappt das Dokument nicht, ist die Zeile trotzdem gespeichert, und `hinweis` nennt den Grund (zum Beispiel „Markierung fehlt im Dokument").
   - `protokollInsDokument`: Eingabe `id`. Hängt eine gespeicherte Zeile an, wenn `im_dokument` noch FALSE ist, und setzt es danach TRUE. Ein zweiter Aufruf hängt nichts doppelt an.
   - `protokollInfo`: Antwort `{ modus, link }` für die Gruppe des Tokens. `modus`: `dokument` (Skripteigenschaft `PROTOKOLL_DOK_<gid>` vorhanden, Link `https://docs.google.com/document/d/<id>/edit`), `extern` (nur `PROTOKOLL_LINK_<gid>` vorhanden, nur `https://`-Adressen) oder `keins`. Die ID wird nirgends gespeichert und nicht in Listen ausgegeben.
   - **Einfügen im Dokument (B):** Das Skript sucht den ersten Absatz, der `[[NEUE PROTOKOLLE HIER]]` enthält, und fügt **direkt darunter** ein. Fehlt die Zeile, wird nichts geschrieben. Inhalt: Titelzeile fett, Rollen, „Anwesend", Protokolltext (Zeilen, die mit `- ` beginnen, als Aufzählung), eine Trennlinie. **Nur Klartext.** Keine Formeln, kein HTML.
   - Editor-Tests: `testenProtokollDok` (je aktive Gruppe: Modus, Dokument erreichbar und Name, Markierung gefunden; schreibt nichts) und `testenProtokollAnhaengen` (legt ein **Test-Dokument** mit Markierung an, hängt über dieselbe Hilfsfunktion zwei Protokolle an, liest zurück, prüft die Reihenfolge, wirft das Test-Dokument in den Papierkorb; schreibt nie in ein echtes Dokument).
4. Prüfe, ob es eine `appsscript.json` mit festen Berechtigungen gibt. Ja: Bereich für Dokumente ergänzen und im Pull Request nennen. Nein: Google fragt beim ersten Ausführen im Editor nach der neuen Berechtigung (Dokumente). Das gehört in „Von Hand zu erledigen".
5. **Pull-Request-Abschnitt „Von Hand zu erledigen"** (in dieser Reihenfolge, zum Abtippen):
   1. Das vorhandene FFF-Dokument öffnen und dort die Zeile `[[NEUE PROTOKOLLE HIER]]` an die Stelle schreiben, unter der neue Protokolle erscheinen sollen (klein und grau, gern kleiner als der übrige Text). Prüfen, dass das Google-Konto, dem das Skript gehört, das Dokument **bearbeiten** darf. Prüfen, wer den Freigabe-Link sonst noch bearbeiten darf (der Link enthält `usp=sharing`, die Person soll wissen, ob „Jeder mit dem Link" eingestellt ist).
   2. Apps-Script-Editor → Projekteinstellungen → Skripteigenschaften: `PROTOKOLL_DOK_g1` (FFF) mit der Dokument-ID anlegen (der Teil der Adresse zwischen `/d/` und `/edit`). Für weitere Gruppen je nach Entscheidung (Frage A und C) `PROTOKOLL_DOK_g2` oder `PROTOKOLL_LINK_g2` (Pad-Adresse von GP).
   3. Im Sheet: Spalten von `Protokolle` ergänzen, Tab `Reden` anlegen (Zeile 1, Namen zum Abtippen, Reihenfolge wie in Abschnitt 5).
   4. Dateien `Schema.gs`, `Daten.gs`, `Code.gs`, `Util.gs` (soweit geändert) und neu `Protokoll.gs` ganz aus dem Repo in den Editor kopieren.
   5. Funktion `formatieren` ausführen (Protokoll: „Formatierung fertig.").
   6. `testenProtokollDok` ausführen und die Berechtigung zulassen (Google zeigt „nicht verifiziert": „Erweitert" → „Zum Projekt wechseln"). Dann `testenProtokollAnhaengen` ausführen. Im Protokoll darf kein „FEHLER" stehen.
   7. Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version" → Bereitstellen.
6. Version, `docs/STAND.md`, Pull Request. In der App ändert sich noch nichts Sichtbares.

**Prüfen:** App läuft wie vorher. Löschen eines Projekts zählt keine Protokolle mehr. Die Editor-Tests zeigen kein „FEHLER".

### 8.2 – Reiter Protokoll: Liste und Lesen

Version: 0.30.1. Sheet und Skript bleiben unverändert.

1. Neuer Reiter `protokoll` (📝, „Protokoll") in `js/ui/nav.js` und `js/config.js` (`features.protokoll = true`), am PC nach „Kalender", am Handy unter „Mehr" (`js/views/mehr.js`).
2. `js/views/protokoll.js` (`render(container, ctx)`) mit Umschalter **Protokolle · Reden**. In 8.2 nur „Protokolle", der Umschalter kommt mit 8.6.
3. Liste: neueste zuerst, nach Jahr gruppiert. Zeile oder Kachel: Datum, Titel, Art, Anwesende (gekürzt), Marke „✔ im Dokument" oder „⚠ noch nicht im Dokument". Suche (Titel, Text, Anwesend), Filter Art, Filter Projekt/Veranstaltung.
4. Klick öffnet ein **Lesefenster**: alle Felder, Absätze erhalten (`white-space: pre-wrap`, nur `textContent`). Knöpfe:
   - „Im Dokument bearbeiten": öffnet das Dokument in einem neuen Tab (`rel="noopener noreferrer"`), nur wenn `im_dokument` TRUE ist und `protokollInfo` einen Link liefert.
   - „Protokoll kopieren": legt den Text (Titel, Rollen, Anwesend, Protokolltext) als Klartext in die Zwischenablage (Fallback, auch für Pad-Gruppen).
   - Ist `im_dokument` FALSE: „Bearbeiten" in der App und „Ins Dokument übernehmen" (Skript-Aktion `protokollInsDokument`), solange ein Dokument eingerichtet ist.
   - Ist `vorschlaege_erledigt` FALSE und enthält der Text Markierungen: „Vorschläge ansehen" (Fenster aus 8.5).
5. Neue Hilfsdatei `js/views/protokoll-rechnen.js` (Sortierung, Gruppieren nach Jahr, Kürzen, Rollen je Gruppe). Zwischenspeicher `gruppe_id:protokoll` mit `ladeMitCache`. Neue Dateien in `sw.js` (`HUELLE`) eintragen. CSS ans Ende von `css/components.css`.
6. **Hinweis zur Einfügestelle** je Gruppe als feste Zeile im Lesefenster (steht in `protokoll-rechnen.js`): bei Modus `dokument` „Das Protokoll steht im Dokument direkt unter der Markierung.", bei Modus `extern` „Füge das Protokoll im Pad von Hand ein." (für GP mit dem Hinweis der Person: nach dem Absatz „Aktuelle Projekte").

**Prüfen:** Reiter am PC in der Seitenleiste, am Handy unter „Mehr". Leere Liste zeigt einen freundlichen Text. Ein von Hand ins Sheet geschriebenes Test-Protokoll erscheint (danach im Sheet löschen).

### 8.3 – Protokoll schreiben (Formular, Entwurf, Speichern)

Version: 0.30.2. Sheet und Skript bleiben unverändert (Skript aus 8.1).

1. Knopf „+ Protokoll". Neue Datei `js/views/protokoll-eintrag.js` (Fenster, am Handy Vollbild; lies `js/ui/fenster.js` und `js/ui/form.js`). Aufbau wie das FFF-Protokoll:
   - **Titel** vorbefüllt mit „Protokoll Plenum <Datum>", Datum (heute), Art (Plenum, AG, Aktion, Sonstiges).
   - **Anwesend** (Namen mit Vorschlägen aus Personen, bisherigen Protokollen und Anzeigenamen).
   - **Rollen** je Gruppe (Abschnitt 4, Frage C): FFF Moderation, Protokoll (vorbelegt mit dem Anzeigenamen), Awareness. Je ein Feld mit Namensvorschlägen.
   - **Projekt oder Veranstaltung** (freiwillig, Auswahl wie `bezuege` in `js/views/mobi.js`).
   - **Protokolltext:** großes Feld. Bei Art „Plenum" vorbefüllt mit der Gliederung (`1. `, `2. `, `Sonstiges`). Knopf „+ TOP" fügt die nächste Nummer **vor** der Zeile „Sonstiges" ein.
   - **Nächstes Plenum:** Datum und Uhrzeit, vorbelegt mit dem nächsten Termin der Plenums-Vorlage der Gruppe (`js/views/kalender-vorlagen.js`). Beim Speichern wird eine Schlusszeile `Nächstes Plenum: TT.MM.JJJJ, HH:MM` an den Text angehängt. Das ist zugleich eine Termin-Markierung (siehe 8.4).
2. **Entwurf:** Alle Felder werden 1 Sekunde nach der letzten Eingabe auf dem Gerät gesichert (`localStorage` oder das Muster in `js/store.js`; lies es zuerst). Ein Entwurf je Gruppe. Öffnet die Person „+ Protokoll" mit vorhandenem Entwurf, fragt ein Fenster „Entwurf vom TT.MM. um HH:MM fortsetzen?" mit „Fortsetzen" und „Verwerfen". Nach erfolgreichem Speichern wird der Entwurf gelöscht.
   Im Formular steht: „Der Entwurf bleibt auf diesem Gerät, bis du speicherst oder verwirfst. Andere Geräte sehen ihn nicht." Knopf „Entwurf kopieren" legt alles in die Zwischenablage.
3. **Speichern:** ruft `protokollSpeichern` auf. Danach:
   - Alles gut: „Protokoll gespeichert und im Dokument ergänzt."
   - `im_dokument = FALSE`: Meldung mit dem `hinweis`. Das Protokoll ist gespeichert. Knopf „Ins Dokument übernehmen" (Aktion `protokollInsDokument`), wenn ein Dokument eingerichtet ist, sonst „Protokoll kopieren".
   - Enthält der Text Markierungen: Fenster „Vorschläge aus dem Protokoll" (8.5).
4. Längenzähler für den Protokolltext (Grenze aus 8.1).
5. Datenschutzhinweis unter dem Textfeld: „Schreibe nichts auf, was Dritte persönlich betrifft (Namen von Personen außerhalb der Gruppe, Gesundheit, Adressen)."

**Prüfen:** Protokoll schreiben, Seite neu laden: Entwurf wird angeboten. Speichern: Eintrag in der Liste, Abschnitt im Dokument direkt unter der Markierung. Ein zweites Protokoll steht **über** dem ersten. „Ins Dokument übernehmen" zweimal klicken: nur ein Abschnitt im Dokument. Gruppe ohne Dokument: Hinweis und „Protokoll kopieren".

### 8.4 – Markierungen und Einfügen im Protokolltext

Version: 0.30.3. Sheet und Skript bleiben unverändert.

1. Über dem Textfeld eine Knopfreihe. **Jeder Knopf öffnet ein kleines Formular** und fügt danach die fertig geschriebene Zeile an der Cursorstelle (am Zeilenanfang) ein. So entstehen keine Tippfehler. Wer lieber tippt, schreibt die Zeile selbst.

   | Knopf | Zeilenanfang | Schreibweise | Daraus wird (8.5) |
   |---|---|---|---|
   | ☐ ToDo | `☐` | `☐ @Name: Aufgabe (bis TT.MM.)` | ToDo |
   | 💡 Learning | `💡` | `💡 Aktionsart: Text` | Learning (nach Aktionsart sortiert) |
   | 📅 Termin | `📅` | `📅 Titel, TT.MM.JJJJ, HH:MM, Ort` (Uhrzeit und Ort freiwillig) | Veranstaltung |
   | 📌 Mitteilung | `📌` | `📌 Titel: Text` | Mitteilung am Schwarzen Brett |
   | 📊 Umfrage | `📊` | `📊 Frage? \| Antwort 1 \| Antwort 2 \| …` | Umfrage |
   | 👉 Beschluss | `👉` | `👉 Text` | nur Hervorhebung im Protokoll, kein Vorschlag |

   Die Symbole stammen aus der App (📅 Veranstaltung, 📌 Anheften, ☐ ToDo). 🏁 bleibt dem Kalender (Meilensteine) vorbehalten.
2. **`@` im Text:** Tippt die Person `@`, erscheint eine Namensauswahl (Personen, Anzeigenamen, bisherige Verantwortliche). Die Auswahl setzt `@Name` an die Stelle (am Handy als Liste unter dem Feld).
3. **Tastenkürzel (nur am PC, freiwillig):** Strg+Alt+T (ToDo), Strg+Alt+L (Learning), Strg+Alt+V (Termin), Strg+Alt+M (Mitteilung), Strg+Alt+U (Umfrage), Strg+Alt+B (Beschluss). Prüfe, ob eines davon mit gängigen Browser- oder Systemkürzeln kollidiert, und nenne Konflikte im Pull Request. Die Kürzel stehen als Hinweis im Formular.
4. **Einfügen aus der App:** Knopf „+ Einfügen". Fenster mit zwei Listen: **Mitteilungen** (Schwarzes Brett, angeheftete und neuere) und **Pinnwand-Kommentare**, je die neuesten 10 mit Suche. Ein Klick fügt den Text ein, mit Quelle: `📌 Mitteilung „Titel": Text` bzw. `💬 Pinnwand (Name, TT.MM.): Text`. Lies dazu `js/views/start.js` und die Tabs `Mitteilungen` und `Kommentare` (`bezug_art = pinnwand`). Eingefügte Mitteilungen werden **nicht** noch einmal als Vorschlag angelegt (Zeilenanfang `📌 Mitteilung „…":` wird beim Lesen der Markierungen übersprungen, wenn die Mitteilung schon existiert).
5. **Lesen der Markierungen:** `protokoll-rechnen.js` bekommt `leseMarkierungen(text, personen)`. Es liest nur Zeilen, die mit einem der Symbole oben beginnen. Zeilen ohne Symbol werden nie gedeutet. Schreibe kleine Beispiele als Kommentar und teste sie mit `node` (Kopie als `.mjs`): ToDo mit Name und mit Datum ohne Jahr (**nächstes Vorkommen ab heute**), ToDo ohne Name (= Hut frei), Termin ohne Uhrzeit, Umfrage mit drei Antworten, Learning ohne Aktionsart (dann gilt die Aktionsart des verknüpften Projekts).

**Prüfen:** Jeder Knopf fügt eine korrekte Zeile ein. `@` zeigt Namen. Das Einfügen einer Mitteilung kopiert Text und Quelle. Eine falsch getippte Zeile (zum Beispiel ToDo ohne Doppelpunkt) bricht nichts ab, sie wird als Fehlerzeile in 8.5 markiert.

### 8.5 – Vorschläge aus dem Protokoll (zum Abhaken)

Version: 0.30.4. Sheet und Skript bleiben unverändert.

1. Fenster „Vorschläge aus dem Protokoll" (Datei `js/views/protokoll-vorschlaege.js`), geöffnet nach dem Speichern und über „Vorschläge ansehen" im Lesefenster. Abschnitte, jeder mit Überschrift und Anzahl, leere Abschnitte fehlen:
   - **ToDos:** Haken (an), Text, Verantwortliche (Vorschläge), Frist, Projekt (vom Protokoll vorbelegt). `details` = „Aus dem Protokoll vom TT.MM.JJJJ: <Titel>".
   - **Learnings, sortiert nach Aktionsart:** Aktionsart-Überschrift, darunter die Learnings mit Haken und bearbeitbarem Text. Aktionsart-Vorschläge wie in `js/views/projekt-learnings.js`. `projekt_id` kommt vom Protokoll.
   - **Termine:** Titel, Datum, Uhrzeit, Ort, Art (intern/extern, Standard intern), Haken. Existiert schon eine Veranstaltung mit gleichem Titel und Datum, steht sie grau mit „Gibt es schon" und ist nicht angekreuzt. Das „Nächste Plenum" erscheint hier.
   - **Mitteilungen:** Titel und Text, Haken. Neue Mitteilungen sind angeheftet (wie sonst).
   - **Umfragen:** Frage, Antworten (eine pro Zeile), Frist (freiwillig), „mehrere Antworten", „namentlich" (Standard: anonym, eine Antwort, ohne Frist).
   - **Fehlerzeilen:** Zeilen, die ein Symbol haben, aber nicht lesbar sind, stehen grau mit dem Grund. Nichts wird dafür angelegt.
2. Knopf „Angekreuzte anlegen". Je Tabelle ein `batchCreate` (`ToDos`, `Learnings`, `Veranstaltungen`, `Mitteilungen`, `Umfragen`). Das Ergebnis zeigt eine Zeile je Bereich („3 ToDos angelegt", „Umfrage: Fehler, bitte noch einmal"). Danach setzt ein `update` auf das Protokoll `vorschlaege_erledigt = TRUE` (ohne Konfliktprüfung, wie ein Haken).
3. Ist `vorschlaege_erledigt` TRUE, fragt die App vor dem erneuten Öffnen „Es wurden schon Einträge angelegt. Trotzdem noch einmal?".
4. Die Einträge erscheinen ganz normal in Start, ToDos, Kalender, Schwarzem Brett und Learnings.

**Prüfen:** Protokoll mit einer ToDo-Zeile (mit Name und Frist), einem Learning, einem Termin, einer Mitteilung und einer Umfrage speichern. Das Fenster zeigt fünf Abschnitte. Einen Eintrag abwählen, anlegen: Er fehlt in der App, die anderen sind da. Zweites Öffnen fragt nach.

### 8.6 – Reden-Archiv

Version: 0.30.5. Sheet und Skript bleiben unverändert.

1. Umschalter „Reden" im Reiter Protokoll. Neue Dateien `js/views/reden.js` und `js/views/rede-eintrag.js` (in `sw.js` eintragen).
2. Liste (neueste zuerst, **nichts wird ausgeblendet**): Titel, Redner, Datum, Projekt oder Veranstaltung, Status als Marke, 💬-Zahl. Filter: Status, Jahr, Aktionsart, Redner, Projekt. Suche.
3. Formular „+ Rede": Titel, Redner (Vorschläge aus bisherigen Rednern und Anzeigenamen), Datum, Projekt oder Veranstaltung (freiwillig), Aktionsart (Vorschläge wie bei Learnings), Link zum Drive-Dokument, Status, Notiz. Der Link muss mit `https://` beginnen (`sichereUrl`). Bei anderen Adressen als `docs.google.com` oder `drive.google.com` erscheint nur eine Warnung. Über dem Link: „Gib das Dokument in Drive so frei, dass deine Gruppe kommentieren kann. Die App teilt nichts."
4. Fenster zu einer Rede: alle Felder, „Dokument öffnen" (neuer Tab, `rel="noopener noreferrer"`), Knopf zum Weiterschalten des Status (Entwurf → Probelesen → Fertig → Gehalten), darunter **Kommentare** zum Probelesen (`baueKommentare` mit `art: 'rede'`, `bezugId` = Rede-ID, `projektId` wenn vorhanden).
5. Die 💬-Zahl kommt aus `kommentarZahlen` (`js/views/todos-rechnen.js`). Lies die Funktion zuerst und ergänze sie, wenn sie nur einzelne Arten kennt.
6. **Es gibt kein Löschen** (Entscheidung 5, das Skript sperrt es). Bearbeiten ist erlaubt, mit Konfliktprüfung.

**Prüfen:** Rede anlegen, Link einfügen, Kommentar schreiben, Zahl in der Liste, Status ändern, Filter Jahr. Link ohne https wird abgelehnt. Es gibt keinen Löschen-Knopf.

### 8.7 – Verknüpfungen und Feinschliff

Version: 0.30.6. Sheet und Skript bleiben unverändert.

1. **Projekt:** Teil „Reden" im Projekt (wie „Learnings", neue Datei `js/views/projekt-reden.js`, Einbau in `js/views/projekte.js`): Reden dieses Projekts, „+ Rede" mit vorausgewähltem Projekt. Die Standard-ToDos „Reden festlegen" bleiben unverändert.
2. **Kalender:** In einer **internen** Veranstaltung (Fenster in `js/views/kalender.js`) neuer Knopf „Protokoll schreiben": öffnet das Formular mit Datum, Titel und `veranstaltung_id` vorbelegt, Art „Plenum", wenn der Titel mit „Plenum" beginnt.
3. **Was ist neu?** (`js/ui/neu-seit.js`): Quellen Protokolle (von anderen) und Reden. Eigene Änderungen stehen nicht drin.
4. `docs/STAND.md`: Etappe 8 abschließen, Dateiübersicht, offene Punkte. Aufräumarbeiten, die bei den Prüfungen aufgefallen sind, nur nach Rückfrage.

**Prüfen:** Plenum aus dem Kalender: Formular kommt vorbefüllt. Das Projekt zeigt seine Reden. „Was ist neu?" nennt ein Protokoll, das jemand anderes geschrieben hat.

## 7. Regeln und Risiken für Etappe 8

- **Dokument ≠ App:** Das Dokument wird nur angehängt, nie von der App gelesen oder später geändert. Was jemand im Dokument von Hand ändert, kommt nicht zurück in die App. Die App-Kopie zeigt den Stand beim Speichern. Das steht im Lesefenster.
- **Zugriff:** Das Skript teilt kein Dokument und setzt keine Freigabe. Die Dokument-ID steht nur in den Skripteigenschaften. `protokollInfo` liefert den Link nur an angemeldete Nutzer der Gruppe.
- **Datenschutz:** Protokolle können Personendaten enthalten. `Protokolle` und `Reden` liefern nur Daten der eigenen Gruppe und sind **nicht öffentlich** (keine Aktion ohne Login, kein Eintrag in `Termine.gs`). Wer das Dokument öffnen darf, bestimmt die Person in Drive.
- **Entwurf nur lokal:** Zwei Personen am selben Protokoll gleichzeitig sind nicht vorgesehen.
- **Keine KI:** Es werden nur Zeilen gelesen, die mit einem Markierungs-Symbol beginnen. Fließtext wird nie gedeutet.
- **Texte** nur mit `textContent`. Im Dokument steht nur Klartext. Beim Schreiben ins Sheet schützt das Skript Werte, die mit `=`, `+`, `-` oder `@` beginnen (wie überall).
- **Berechtigung:** Google fragt nach der Berechtigung für Dokumente. Der Hinweis „nicht verifiziert" bei eigenen Skripten ist normal.
- **Nicht vom Agenten prüfbar:** Wie das Dokument am Ende aussieht, die Google-Berechtigung, Handy-Darstellung und die Tastenkürzel. Der Agent sagt in jedem Pull Request ehrlich, was er nicht prüfen konnte.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 8.0 | Etappe 7 abschließen, Stand bereinigen | nächste freie | nein |
| 8.1 | Spalten, Tab Reden, Skript-Aktionen, Dokument einrichten | 0.30.0 | **ja, von Hand** |
| 8.2 | Reiter Protokoll: Liste und Lesen | 0.30.1 | nein |
| 8.3 | Protokoll schreiben, Entwurf, Speichern ins Dokument | 0.30.2 | nein |
| 8.4 | Markierungen, Einfüge-Knöpfe, `@`, Einfügen aus der App | 0.30.3 | nein |
| 8.5 | Vorschläge aus dem Protokoll zum Abhaken | 0.30.4 | nein |
| 8.6 | Reden-Archiv | 0.30.5 | nein |
| 8.7 | Projekt-Teil Reden, Plenum aus dem Kalender, Was ist neu | 0.30.6 | nein |

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt, dann der nächste Schritt.
