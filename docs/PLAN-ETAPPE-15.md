# Plan: Bollerwagen (Unterreiter im Material, Aufbau-Anleitung, Wiki-Seite)

Stand: 27.11.2026 · **Etappe 15** · noch nichts gebaut. Die Rückfragen in Abschnitt 6 sind offen.

## 1. Worum es geht

FFF hat einen eigenen Bollerwagen (nicht der von Foodsharing). Dazu gehört feste Technik und weiteres Material.
Die App soll helfen, nichts zu vergessen und den Wagen richtig aufzubauen. Andere Gruppen sollen ihn anfragen können.

1. **Unterreiter „Bollerwagen“ im Material:** Ist der FFF-Bollerwagen ausgeliehen, erscheint oben im Reiter Material
   ein Knopf „🛒 Bollerwagen“. Er führt zu einer eigenen Seite mit der Liste, was standardmäßig dazugehört.
   Je Teil steht dort: schon ausgeliehen, noch nicht ausgeliehen oder nicht verfügbar.
2. **Aufbau-Anleitung:** ein Knopf auf dieser Seite führt zu einer eigenen Seite, die Schritt für Schritt zeigt,
   wie man den Wagen zusammenbaut („Weiter“, „Zurück“, „Schritt 3 von 8“, freiwillig ein Bild je Schritt).
3. **Wiki-Seite „Bollerwagen“:** Inhaltsliste (was standardmäßig dabei ist), Knopf zur Aufbau-Anleitung,
   Knopf „Bollerwagen anfragen“ für eine Aktion.

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

## 3. Am Handy und am PC

- Liste als Karten am Handy, als Tabelle am PC (wie das Material, `js/ui/table.js`).
- Aufbau-Anleitung: ein Schritt füllt die Seite, große Knöpfe „← Zurück“ und „Weiter →“ (mindestens 44 px), am PC Bild neben dem Text.
- Hell und dunkel, neue Farben nur über `css/base.css`. Barrierefrei: eine `h1`, „Schritt 3 von 8“ wird vorgelesen.

## 4. Schritte (je Schritt ein Zweig und ein Pull Request)

| Schritt | Version | Was | Sheet / Skript |
|---|---|---|---|
| 15.1 | 1.3.0 | Plan ins Repo. `texte/bollerwagen/inhalt.txt`. Unterreiter „Bollerwagen“ im Material (neue Datei `js/views/material-bollerwagen.js`), Knopf erscheint, wenn der Wagen draußen ist, „Fehlendes ausleihen“. Anleitung `texte/anleitung/material.txt`. | unverändert |
| 15.2 | 1.3.1 | Aufbau-Anleitung Schritt für Schritt (`js/views/bollerwagen-aufbau.js`, `texte/bollerwagen/aufbau.txt`), öffentlich, Knopf im Unterreiter. | unverändert |
| 15.3 | 1.3.2 | Wiki-Seite „Bollerwagen“ mit Inhaltsliste, Knopf Aufbau, Knopf Anfragen. Abschluss: Plan in `docs/STAND.md` einarbeiten und löschen. | unverändert (außer bei Rückfrage 5 Weg B) |

Nach jedem Schritt prüfst du am Handy und am PC, dann kommt der nächste.

## 5. Was ich von euch brauche (kein Raten)

- Die Inhaltsliste: was standardmäßig zum Bollerwagen gehört, mit Anzahl. Ich mache daraus auf Wunsch auch die Zeilen fürs Sheet
  (wie bei der Greenpeace-Liste), damit die Teile im Material stehen.
- Die Schritte für den Zusammenbau (Stichpunkte reichen) und, wenn ihr wollt, Fotos ohne Personen.
  Bis dahin steht in `aufbau.txt` ein klar markierter Platzhalter.

## 6. Rückfragen

1. **Inhaltsliste als Datei auf GitHub** (Vorschlag, eine Quelle für App und Wiki) **oder im Sheet** (Material mit Unterkategorie „Bollerwagen“,
   in der App änderbar, aber dann zeigt das öffentliche Wiki die Liste nicht von selbst)?
2. **Name des Wagens im Material:** passt „Bollerwagen FFF“?
3. **„Schon ausgeliehen“** heißt für dich: von irgendwem draußen (Vorschlag, einfach), oder nur von derselben Person bzw. für dasselbe Projekt wie der Wagen?
4. **Wiki-Seite öffentlich** (ohne Login, auch für andere Gruppen und Leute außerhalb) oder nur für angemeldete Gruppen?
5. **Kontakt zum Anfragen:** Weg A = der vorhandene Signal-Knopf (geht an denselben Kontakt wie heute in der App). Weg B = ein eigener Link
   nur für den Bollerwagen (neue Skripteigenschaft `BOLLERWAGEN_LINK`, kleine Änderung am Skript). Oder etwas anderes, zum Beispiel eine E-Mail-Adresse?
6. **Etappe 15 mit Version 1.3.0** (neue Etappe = mittlere Zahl). Passt das?
