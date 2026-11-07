# Plan: Zeitplan (Gantt-Diagramm) pro Projekt

Stand: 06.11.2026 · **Etappe 14** · 14.1 gebaut mit Version 1.2.0 (nach den Vorschlägen unten). Die Rückfragen in Abschnitt 5 sind noch offen.

## 1. Worum es geht

Jedes Projekt bekommt einen neuen Teil **„Zeitplan“**. Er zeigt auf einen Blick, was wann dran ist:
eine Zeile für das Projekt selbst, eine Zeile je Meilenstein und darunter die ToDos.
Links stehen die Namen, rechts die Zeitachse mit Datum. Linien zeigen „Heute“, die Aktion und die Deadline.

So sieht es ungefähr aus (PC):

```
                     | 01.11.   | 08.11.   | 15.11.   | 22.11.  Aktion |
Projekt              |██████████████████████████████████████████|       |
🏁 Genehmigung       |   ██████████◆                              |       |
   · Stadt anmelden  |        ●                                   |       |
🏁 Material, Aufbau  |              ███████████████◆              |       |
Ohne Meilenstein     |      ●     ●        ●   ●                  |       |
                               ┆ heute                         ┃ Aktion
```

- **Balken** = Zeitraum, **◆** = Meilenstein-Datum, **●** = ToDo an seinem Fälligkeitstag.
- Grau = erledigt oder erreicht, roter Rand = überfällig (wie in den ToDos und im Mobi-Zeitstrahl).
- Antippen eines Balkens oder Punkts zeigt ein kleines Fenster mit Titel, Datum, Verantwortlichen und Stand.

## 2. Wie es in die bestehende Struktur passt

Alles, was das Diagramm braucht, lädt der Reiter Projekte schon heute (`js/views/projekte.js`, eine Anfrage `listMehrere`):

| Was | Tab und Spalten | im Diagramm |
|---|---|---|
| Projekt | `Projekte`: `start_datum`, `aktionsdatum`, `deadline`, `status` | Balken von Start bis Aktion, Linien für Aktion und Deadline |
| Meilensteine | `Meilensteine`: `titel`, `datum`, `verantwortlich`, `erledigt` | eine Zeile je Meilenstein, ◆ am Datum |
| ToDos | `ToDos`: `text`, `faellig_am`, `meilenstein_id`, `erledigt` | Punkte unter ihrem Meilenstein oder bei „Ohne Meilenstein“ |
| Mobi-Beiträge | `Mobi_Plan`: `datum`, `status` | freiwillig eine Sammelzeile „Mobi“ (siehe Rückfrage 3) |

Es wird **nichts gespeichert**; das Diagramm wird nur berechnet (wie der Kalender und der Mobi-Zeitstrahl).
Bauen kann ich auf vorhandenen Teilen auf: Zeitachse und Beschriftungen wie im Mobi-Zeitstrahl (`js/views/mobi-zeitstrahl.js`),
Datum-Helfer aus `js/views/kalender-rechnen.js` und `js/views/todos-rechnen.js`, Stand der Meilensteine aus `js/views/projekt-rechnen.js`.

### Was in den Daten fehlt

Ein Meilenstein hat heute **nur ein Datum** (das Ziel „bis“). Für einen echten Gantt-Balken fehlt der **Anfang**. Zwei Wege:

- **A (ohne Änderung am Sheet):** Der Anfang wird berechnet: frühestes Fälligkeitsdatum seiner ToDos, sonst das Datum des
  vorigen Meilensteins, sonst der Projektstart. Ein Meilenstein ohne alles erscheint nur als ◆.
- **B (neue Spalte):** Neue Spalte `start_datum` im Tab `Meilensteine` (Sheet, `apps-script/Schema.gs`, Formular in `js/schema.js`).
  Dann trägt ihr den Anfang selbst ein. Ist er leer, rechnet die App wie bei A.

Mein Vorschlag: **erst A**. Wenn euch die berechneten Balken nicht reichen, kommt B als eigener Schritt dazu.

Weitere Lücken (keine Änderung nötig, nur gut zu wissen):
- ToDos haben nur ein Fälligkeitsdatum, keinen Zeitraum. Sie sind darum Punkte, keine Balken.
- Projekte ohne Start: Der Projektbalken beginnt beim frühesten Datum im Projekt. Ohne jedes Datum zeigt der Teil einen Hinweis.

## 3. Am Handy und am PC

- **PC:** Namen links (feste Spalte), Zeitachse rechts über die ganze Breite.
- **Handy (390 px):** Name über der Zeile, Zeitachse über die volle Breite, kein seitliches Wischen (wie im Mobi-Zeitstrahl).
  Weniger Datumsangaben an der Achse, damit nichts übereinander liegt.
- Hell und dunkel; neue Farben nur über Variablen in `css/base.css`.
- Barrierefrei: jeder Balken und Punkt ist ein Knopf mit Beschriftung zum Vorlesen; unter dem Diagramm eine kurze Erklärung (Legende).

## 4. Schritte (je Schritt ein Zweig und ein Pull Request)

| Schritt | Version | Was | Sheet / Skript |
|---|---|---|---|
| 14.1 | 1.2.0 | Plan ins Repo (`docs/PLAN-ETAPPE-14.md`). Neuer Teil „Zeitplan“ im Projekt (neue Datei `js/views/projekt-zeitplan.js`), Weg A, Antippen zeigt Infos. Anleitung `texte/anleitung/projekte.txt`. | unverändert |
| 14.2 | 1.2.1 | Aus dem Info-Fenster direkt „Bearbeiten“ (ToDo oder Meilenstein) und „Abhaken“. Falls gewünscht: Weg B (Spalte `Meilensteine.start_datum`). | nur bei Weg B |
| 14.3 | 1.2.2 | „🖨 Drucken“ des Zeitplans (quer), Abschluss: Plan in `docs/STAND.md` einarbeiten und löschen. | unverändert |

Nach jedem Schritt prüfst du am Handy und am PC, dann kommt der nächste.

## 5. Rückfragen

1. **Etappe oder Einzelschritt?** Ich schlage Etappe 14 mit Version 1.2.0 vor (neue Etappe = mittlere Zahl). Passt das?
2. **Anfang der Meilenstein-Balken:** Weg A (berechnet, ohne Sheet-Änderung) oder gleich Weg B (neue Spalte `start_datum`)?
3. **Was soll ins Diagramm?** Mein Vorschlag: Projekt, Meilensteine und ToDos. Mobi-Beiträge nur als eine Sammelzeile „Mobi“
   (der Teil Mobi hat schon einen eigenen Balken). Ohne Mobi, mit Sammelzeile oder eine Zeile je Kanal?
4. **ToDos:** immer sichtbar oder je Meilenstein zum Aufklappen (bei vielen ToDos wird das Diagramm sonst lang)?
   Mein Vorschlag: zugeklappt, Meilenstein-Zeile antippen klappt auf.
5. **Wo im Projekt?** Mein Vorschlag: als eigener Teil direkt über „ToDos“, zugeklappt wie die anderen Teile.
6. **Idee für später (nicht im Plan):** ein gemeinsamer Zeitplan aller aktiven Projekte im Reiter Projekte. Interesse?
