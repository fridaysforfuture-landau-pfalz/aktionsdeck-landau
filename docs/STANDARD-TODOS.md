# Standard-ToDos beim Anlegen eines Projekts (Stand 0.29.9)

Diese Datei ist zum Nachlesen. Die App liest die Werte **nicht** von hier,
sondern aus `js/vorlagen.js` (Liste `STANDARD_TODOS`). Wer dort etwas ändert, ändert es auch hier.

## So funktioniert es

- Reiter Projekte → „+ Neu“. Unter den Feldern steht die Liste der Standard-ToDos, alle mit Haken.
- Haken weg = dieses ToDo wird nicht angelegt.
- Die Fälligkeit wird vom **Aktionsdatum** zurückgerechnet („Tage vorher“). Änderst du das Aktionsdatum im Formular,
  rechnen sich die Daten neu, außer bei denen, die du selbst geändert hast.
- Ohne Aktionsdatum bekommen die ToDos kein Fälligkeitsdatum.
- Die ToDos gehören zum Projekt, aber zu keinem Meilenstein (sie stehen bei „Ohne Meilenstein“).
- Nur beim Anlegen über „+ Neu“. „Als Projekt starten“ bei einer Aktionsidee legt keine Standard-ToDos an.

**Alle Tage sind Annahmen (Platzhalter).**

## Die Liste

| ToDo | Tage vorher | Herkunft |
|---|---|---|
| Bühne? | 21 | von der Person genannt |
| Band? | 21 | von der Person genannt |
| Uploadplan erstellen | 14 | von der Person genannt (vorher Vorlage „Mobi“) |
| Band anfragen | 14 | von der Person genannt |
| Anfrage Bollerwagen Foodsharing | 14 | von der Person genannt |
| Presseverteiler prüfen | 8 | von der Person genannt (vorher Vorlage „Pressearbeit“) |
| Awareness-Team festlegen | 5 | Vorschlag von Claude |
| Person für Fotos festlegen | 3 | Vorschlag von Claude |
| Bei der Presse nachfassen | 2 | Vorschlag von Claude (vorher Vorlage „Pressearbeit“) |

## Was sich an den Meilenstein-Vorlagen geändert hat (0.29.9)

- Die Vorlagen „Mobi“ und „Pressearbeit“ sind weg. Ihre Aufgaben stecken jetzt in den Standard-Beiträgen
  („+ Beiträge planen“, siehe `docs/MOBI-STANDARD-BEITRAEGE.md`) und in den Standard-ToDos oben.
- „Genehmigung und Anmeldung“: „Ansprechperson für die Aktion festlegen“ heißt jetzt **„Versammlungsleitung festlegen“**
  und steht an zweiter Stelle, unter „Ort und Route klären“. Die Tage (7) sind gleich geblieben.

## Ändern

Eine Zeile in `js/vorlagen.js` unter `STANDARD_TODOS` ändern, zum Beispiel
`{ text: 'Band anfragen', tage_vorher: 14 }` → `tage_vorher: 21`.
Danach Version hochzählen (`js/config.js` und `sw.js`) und diese Datei anpassen.
