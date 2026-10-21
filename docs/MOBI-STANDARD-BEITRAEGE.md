# Mobi: Standard-Beiträge und ihre Tage (Stand 0.29.9)

Diese Datei ist zum Nachlesen. Die App liest die Werte **nicht** von hier,
sondern aus `js/kanaele.js` (Liste `STANDARD_BEITRAEGE`). Wer dort etwas ändert, ändert es auch hier.

## So funktioniert es

- Im Projekt (Teil „Mobi“) oder im Reiter Mobi (mit gewähltem Projekt oder gewählter Veranstaltung) gibt es den Knopf **„+ Beiträge planen“** (früher „+ Beiträge“). Einzelne Beiträge legst du mit „+ Einzelner Beitrag“ an.
- Du wählst Kanäle. Pro Kanal schlägt die App die Beiträge aus der Tabelle unten vor.
- **Bezugsdatum** ist das Aktionsdatum des Projekts (bei einer Veranstaltung ihr Datum).
- **Tage vorher** heißt: so viele Tage **vor** dem Bezugsdatum wird der Beitrag veröffentlicht.
  0 = am Tag selbst. Eine negative Zahl heißt „danach“ (zum Beispiel -1 = einen Tag nach der Aktion).
- Hat das Projekt kein Aktionsdatum, bekommen die Beiträge kein Datum. In der Vorschau kannst du es eintragen.
- In der Vorschau kannst du jeden Beitrag abwählen und Titel, Format und Datum ändern.
- Gibt es im Projekt schon einen Beitrag mit demselben Titel auf demselben Kanal, wird er nicht noch einmal angelegt („Gibt es schon“).
- Alle neuen Beiträge starten mit Status „Idee“ und ohne Text.

**Alle Tage sind Annahmen (Platzhalter).** Sie stammen aus dem Plan (`docs/PLAN-ETAPPE-7.md`, Schritt 7.5).
Die Instagram-Liste hat die Person genannt (Heute Demo, Packliste, Awarenesskonzept, Demosprüche, 3 Reels,
Thema-Posts einmal pro Tag, Storys). Die Tage dazu und alle anderen Kanäle sind Vorschläge.

## Instagram (Social Media)

| Beitrag | Format | Tage vorher |
|---|---|---|
| Heute Demo | Beitrag | 0 |
| Packliste | Beitrag | 1 |
| Awarenesskonzept | Beitrag | 5 |
| Demosprüche | Beitrag | 4 |
| Reel 1 | Reel | 10 |
| Reel 2 | Reel | 7 |
| Reel 3 | Reel | 3 |
| Thema-Post 1 | Beitrag | 7 |
| Thema-Post 2 | Beitrag | 6 |
| Thema-Post 3 | Beitrag | 5 |
| Thema-Post 4 | Beitrag | 4 |
| Thema-Post 5 | Beitrag | 3 |
| Thema-Post 6 | Beitrag | 2 |
| Story 1 | Story | 3 |
| Story 2 | Story | 1 |
| Story 3 (am Tag) | Story | 0 |
| Danke-Post | Beitrag | -1 (danach) |

## Weitere Kanäle

| Kanal (Gruppe) | Beitrag | Format | Tage vorher |
|---|---|---|---|
| Facebook (Social Media) | Veranstaltung | Beitrag | 10 |
| Facebook (Social Media) | Erinnerung | Beitrag | 1 |
| TikTok (Social Media) | Video 1 | Video | 7 |
| TikTok (Social Media) | Video 2 | Video | 2 |
| Pressemitteilung (Digital) | Pressemitteilung | Text | 7 |
| Pressemitteilung (Digital) | Pressemitteilung Rückblick | Text | -1 (danach) |
| Webseite (Digital) | Ankündigung auf der Webseite | Text | 10 |
| Webseite (Digital) | Rückblick auf der Webseite | Text | -3 (danach) |
| Newsletter (Digital) | Newsletter | Text | 5 |
| WhatsApp und Telegram (Digital) | Ankündigung | Text | 7 |
| WhatsApp und Telegram (Digital) | Erinnerung | Text | 1 |
| Unimail (Digital) | Unimail | Text | 5 |
| Mail an Fördermitglieder (Hamburg) (Digital, nur gp) | Mail an Fördermitglieder | Text | 5 |
| Plakate und Flyer (Print) | Plakate und Flyer | Sonstiges | 14 |
| Kreideaktion (Print) | Kreideaktion | Sonstiges | 1 |
| Werbung über andere Gruppen (Extern) | Anfrage an andere Gruppen | Text | 10 |
| Schuldelis (Extern) | Schuldelis informieren | Text | 7 |
| Sonstiges | kein fester Satz: eigener Titel, Datum selbst eintragen | Sonstiges | – |

Danke- und Rückblick-Beiträge (Titel enthält „Danke“ oder „Rückblick“) liegen absichtlich nach der Aktion.
Im Kalender sind sie darum nicht pink markiert. Andere Beiträge nach der Aktion sind pink.

## Ändern

Eine Zeile in `js/kanaele.js` unter `STANDARD_BEITRAEGE` ändern, zum Beispiel
`{ name: 'Packliste', format: 'beitrag', tage_vorher: 1 }` → `tage_vorher: 2`.
Danach Version hochzählen (`js/config.js` und `sw.js`) und diese Datei anpassen.
