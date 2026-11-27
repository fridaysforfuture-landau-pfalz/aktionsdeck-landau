# Plan: Bollerwagen (Unterreiter im Material, Aufbau-Anleitung, Wiki-Seite)

Stand: 27.11.2026 · **Etappe 15** · noch nichts gebaut. Antworten der Person zu den ersten Rückfragen sind eingearbeitet (Abschnitt 6). Offen: Weg für „alle Gruppen“ (Abschnitt 2a).

## 1. Worum es geht

FFF hat einen eigenen Bollerwagen (nicht der von Foodsharing). Dazu gehört feste Technik und weiteres Material.
Die App soll helfen, nichts zu vergessen und den Wagen richtig aufzubauen. Andere Gruppen sollen ihn anfragen können.

1. **Unterreiter „Bollerwagen“ im Material:** Ist der FFF-Bollerwagen ausgeliehen, erscheint oben im Reiter Material
   ein Knopf „🛒 Bollerwagen“. Er führt zu einer eigenen Seite mit der Liste, was standardmäßig dazugehört.
   Je Teil steht dort: schon ausgeliehen (egal von wem, für welches Projekt), noch nicht ausgeliehen oder nicht verfügbar,
   und **an wen** es ausgeliehen ist (Gruppe automatisch, dazu der Name, der beim Ausleihen eingetragen wurde).
2. **Aufbau-Anleitung:** ein Knopf auf dieser Seite führt zu einer eigenen Seite, die Schritt für Schritt zeigt,
   wie man den Wagen zusammenbaut („Weiter“, „Zurück“, „Schritt 3 von 8“). **Je Schritt eine vereinfachte Zeichnung**,
   bei Bedarf zusätzlich ein Foto (Umschalter „Zeichnung / Foto“).
3. **Wiki-Seite „Bollerwagen“ (öffentlich):** Inhaltsliste (was standardmäßig dabei ist), Knopf zur Aufbau-Anleitung,
   Knopf „Bollerwagen anfragen“ für eine Aktion (vorhandener Signal-Knopf).
4. **Alle Gruppen:** Jede Gruppe soll den Bollerwagen anfragen können und ihn automatisch in ihrer Materialliste haben (Abschnitt 2a).

## 2. Wie es in die bestehende Struktur passt

- **Woher die Inhaltsliste kommt (Vorschlag):** eine feste Textdatei `texte/bollerwagen/inhalt.txt`, eine Zeile je Teil:
  `Name | Anzahl`. Die **erste Zeile ist der Bollerwagen selbst**. Die Namen müssen genau so heißen wie das Material im Sheet (FFF, `g1`).
  Ihr ändert die Liste direkt auf GitHub, wie die Anleitung. Vorteil: **eine Quelle** für die App und das öffentliche Wiki,
  und das Sheet bleibt unverändert. (Das öffentliche Wiki darf das Material im Sheet nicht lesen, weil dafür ein Login nötig ist.)
- **Woran die App den FFF-Bollerwagen erkennt:** Material der Gruppe `fff`, dessen Name genau der ersten Zeile von `inhalt.txt` entspricht
  (Vorschlag: „Bollerwagen FFF“). Der Bollerwagen von Foodsharing steht nicht im Material oder heißt anders, dann zählt er nicht.
- **Wann der Knopf erscheint:** wenn vom FFF-Bollerwagen gerade etwas „draußen“ ist (Rechnung wie heute in `js/views/material-rechnen.js`).
  Die Seite selbst ist immer über `#/g/fff/material/bollerwagen` erreichbar (zum Beispiel zum Vorbereiten).
- **Stand je Teil:** „✓ ausgeliehen“ (draußen), „noch nicht ausgeliehen“ (verfügbar), „nicht verfügbar“ (alles draußen bei anderen, nicht aktiv),
  „fehlt im Material“ (Name steht in der Liste, aber nicht im Sheet). Dazu ein Knopf „Fehlendes ausleihen“: Er startet das normale Ausleihen
  mit den fehlenden Teilen schon angehakt (`js/views/material-buchen.js`, nichts Neues am Skript).
- **Aufbau-Anleitung:** Text in `texte/bollerwagen/aufbau.txt` im Wiki-Format, jeder Schritt beginnt mit `## `. Bilder legt ihr in
  `texte/bollerwagen/bilder/` auf GitHub ab. Die Seite ist **öffentlich ohne Login** (`#/bollerwagen/aufbau`), damit auch andere Gruppen sie nutzen können.
- **Wiki-Seite:** neue Anleitungsseite `texte/anleitung/bollerwagen.txt` (in `liste.txt`, öffentlich). Zwei neue Marken wie `[Signal]`:
  `[Bollerwagen-Inhalt]` (zeigt die Liste aus `inhalt.txt`) und `[Bollerwagen-Aufbau]` (Knopf zur Anleitung).
  Der Knopf „Bollerwagen anfragen“ nutzt den vorhandenen Signal-Knopf mit Rechenaufgabe (`js/ui/signal.js`), siehe Rückfrage 5.

## 2a. Bollerwagen für alle Gruppen

Heute sieht jede Gruppe **nur ihr eigenes Material** (das Skript filtert jede Zeile nach `gruppe_id`, `apps-script/Daten.gs` `listeFuerGruppe`;
`buchen` in `apps-script/Ausleihe.gs` bucht nur Material der eigenen Gruppe). Für den gemeinsamen Bollerwagen braucht es darum
eine Änderung am Skript. Zwei Wege:

- **Weg A, gemeinsames Material (Vorschlag):** Neue Spalte `geteilt` im Tab `Material`. Material mit `geteilt = TRUE` (der Bollerwagen
  und seine Teile, Besitzer FFF) erscheint in der Materialliste **jeder** Gruppe, mit dem Zusatz „von FFF“. Jede Gruppe kann es selbst
  ausleihen und zurückgeben; die Ausleihe trägt automatisch die Gruppe ein, dazu den Namen von Hand. Bestand und „draußen“ zählt das Skript
  über alle Gruppen. Ändern und Löschen darf nur FFF. Vorher fragt die Gruppe über Signal an.
- **Weg B, nur anzeigen:** Andere Gruppen sehen den Bollerwagen in ihrer Liste nur zum Lesen (frei oder „ausgeliehen an …“) mit dem Knopf
  „Anfragen“. Ausleihen bucht immer FFF, dabei wählt FFF die Gruppe aus oder tippt einen Namen ein. Weniger Änderung am Skript,
  aber FFF muss jede Ausleihe selbst eintragen.

Für beide Wege: Sheet-Spalte `geteilt` (Material) und eine neue Spalte `an_gruppe` (Ausleihe) zum Anzeigen „an wen“; Abschnitt
„Von Hand zu erledigen“ im Pull Request. Andere Gruppen sehen bei geteiltem Material die Namen aus dessen Ausleihen (nur diese, sonst nichts von FFF).

## 3. Am Handy und am PC

- Liste als Karten am Handy, als Tabelle am PC (wie das Material, `js/ui/table.js`).
- Aufbau-Anleitung: ein Schritt füllt die Seite, große Knöpfe „← Zurück“ und „Weiter →“ (mindestens 44 px), am PC Bild neben dem Text.
- Hell und dunkel, neue Farben nur über `css/base.css`. Barrierefrei: eine `h1`, „Schritt 3 von 8“ wird vorgelesen.

## 4. Schritte (je Schritt ein Zweig und ein Pull Request)

| Schritt | Version | Was | Sheet / Skript |
|---|---|---|---|
| 15.0 | 1.3.0 | Gemeinsames Material (Abschnitt 2a): Spalten `Material.geteilt` und `Ausleihe.an_gruppe`, Skript `Daten.gs`, `Ausleihe.gs`, `Schema.gs`, Anzeige „von FFF“ und „an wen“ im Material. | **ja**, von Hand |
| 15.1 | 1.3.1 | Plan ins Repo. `texte/bollerwagen/inhalt.txt`. Unterreiter „Bollerwagen“ im Material (neue Datei `js/views/material-bollerwagen.js`), Knopf erscheint, wenn der Wagen draußen ist, „Fehlendes ausleihen“. Anleitung `texte/anleitung/material.txt`. | unverändert |
| 15.2 | 1.3.2 | Aufbau-Anleitung Schritt für Schritt (Zeichnung je Schritt, Foto bei Bedarf) (`js/views/bollerwagen-aufbau.js`, `texte/bollerwagen/aufbau.txt`), öffentlich, Knopf im Unterreiter. | unverändert |
| 15.3 | 1.3.3 | Wiki-Seite „Bollerwagen“ mit Inhaltsliste, Knopf Aufbau, Knopf Anfragen. Abschluss: Plan in `docs/STAND.md` einarbeiten und löschen. | unverändert |

Nach jedem Schritt prüfst du am Handy und am PC, dann kommt der nächste.

## 5. Was ich von euch brauche (kein Raten)

- Die Inhaltsliste: was standardmäßig zum Bollerwagen gehört, mit Anzahl. Ich mache daraus auf Wunsch auch die Zeilen fürs Sheet
  (wie bei der Greenpeace-Liste), damit die Teile im Material stehen.
- Die Schritte für den Zusammenbau (Stichpunkte reichen) und, wenn ihr wollt, Fotos ohne Personen.
  Die vereinfachten Zeichnungen (SVG) zeichne ich nach euren Fotos oder Beschreibungen. Bis dahin steht in `aufbau.txt` ein klar markierter Platzhalter.

## 6. Rückfragen und Antworten

Beantwortet am 27.11.2026:
1. Inhaltsliste als Datei auf GitHub (`texte/bollerwagen/inhalt.txt`): **ja**.
2. Name im Material: **„Bollerwagen FFF“**.
3. „Schon ausgeliehen“: sobald ein Teil draußen ist, **egal für welches Projekt**. Dazu zeigen, **an wen** (Gruppe automatisch oder Name von Hand).
4. Wiki-Seite **öffentlich**.
5. Anfragen über den **vorhandenen Signal-Knopf**.

Offen:
6. Weg A oder Weg B für „alle Gruppen“ (Abschnitt 2a)?
7. Etappe 15 mit Version 1.3.0: passt das?
