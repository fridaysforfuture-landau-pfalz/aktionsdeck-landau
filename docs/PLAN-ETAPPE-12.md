# Plan Etappe 12: Prüfung und Qualität (Fassung 3, 28.10.2026)

Dieser Plan gehört zu `docs/STAND.md` (dort stehen alle Regeln). Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Am Ende von Etappe 12 wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

**Status: Fassung 3, entschieden.** Die Person hat die Rückfragen aus Fassung 2 am 28.10.2026 beantwortet (Abschnitt 3).
Etappe 12 ist der **letzte Schritt vor Version 1.0**. Gebaut wird Schritt für Schritt (Abschnitt 5).

## 1. Ziel

Die App soll schneller, sicherer, aufgeräumter und für alle gut benutzbar werden. Neue Funktionen kommen nicht dazu,
außer der Fehlerseite (12.13) und dem Sortieren der Tabs (12.14). Am Ende steht **Version 1.0.0**.

Die Wünsche der Person (28.10.2026):

| Nr. | Wunsch | Schritte |
|---|---|---|
| W1 | Ganzen Code auf Geschwindigkeit und Leistung prüfen | 12.5, 12.6 |
| W2 | Ganzen Code auf Sicherheitslücken prüfen, mit `/security-review` und den Strix-Skills (`npx skills add usestrix/strix`) | 12.3, 12.4 |
| W3 | CSS sortieren, doppelte Regeln mit gleicher Wirkung zusammenfassen | 12.15, 12.16 |
| W4 | Nicht mehr benötigte Funktionen und Dateien löschen (auch die Pläne der Etappen 7 bis 11) | 12.2, 12.7, 12.8 |
| W5 | Nur noch **eine Datei** für Stand, Arbeitsregeln und weitere Pläne | 12.2 |
| W6 | Skript, das die Tabs im Sheet sortiert (nach Alphabet oder nach Wichtigkeit) | 12.14 |
| W7 | Ganze App auf Barrierefreiheit prüfen, Probleme und Lösungen auflisten, ausführlicher Test mit Bildschirmleser | 12.10, 12.11 |
| W8 | Beim Rauszoomen füllt die Ansicht den Bildschirm. Nur zwei Ansichten: Handy und alles darüber. Am PC rutschen Reiter zur Not in „Mehr“ | 12.9 |
| W9 | App-Icon am Handy füllt die Fläche. Ladebildschirm grau mit Logo statt weiß | 12.12 |
| W10 | 404-Fehlerseite („Seite nicht gefunden“) | 12.13 |

## 2. Ausgangslage (28.10.2026, Version 0.33.16)

Die Befunde aus Fassung 2 gelten weiter. Kurz:

- **Erledigt vor Etappe 12:** GitHub Actions auf aktuellen Versionen (11.2). Alte Prüfpunkte 0.26.3 und 0.28.9 bis 0.28.13 bestätigt (27.10.2026). Impressum, Datenschutz und Entwicklung App ausgefüllt.
- **Noch offen für die Person:** Testdaten im Sheet löschen (in 12.17), Datenschutztext prüfen lassen.
- **Noch offen für den Agenten:** ungenutzte CSS-Regeln (`.kal-pfeil`, `.kal-nav`, `.kal-datum`, `.kal-monat-kopf`, `.modal-vollbild`, `.dash-rechts-teil`, `.hilfe-abschnitt`, `.hilfe-teil`, `.hilfe-text`) und `topEinfuegen` in `js/views/protokoll-rechnen.js` (in 12.8).
- **Layout:** `#app` ist in `css/layout.css` auf 1400 px begrenzt. Grenze Handy/PC bei 960 px.
- **Icon:** kein „maskable“ Icon im Manifest; `background_color` ist fast weiß (`#f3f7f5`).
- **Fehlerseite:** Unbekannte Adressen in der App springen still zum Start (`js/app.js`, `route`). Auf dem Server zeigt GitHub seine englische 404-Seite.
- **Sicherheit:** keine Content-Security-Policy in `index.html`. Neu seit Etappe 11: `Konto.gs`, `Signal.gs`, `js/darstellung-start.js`.

## 3. Entscheidungen (Antworten vom 28.10.2026)

Die Nummern sind die der Rückfragen aus Fassung 2.

1. **Reihenfolge** wie vorgeschlagen, aber **Layout vor Barrierefreiheit**.
2. **Immer erst ein Bericht.** Jede Prüfung läuft **getrennt** und bekommt einen **eigenen Bericht**: Sicherheit, Geschwindigkeit, Ungenutztes, Barrierefreiheit, CSS. Erst nach Freigabe wird gebaut.
3. **Berichte nur im Chat** (Projektdateien, Ordner `pruefung/`), nicht im öffentlichen Repo.
4. **Version 1.0.0 erst am Ende** von Etappe 12 (12.17).
5. **Eine Datei:** Alles steht in `docs/STAND.md`. Im Hauptordner bleibt eine sehr kurze `CLAUDE.md`, die auf `docs/STAND.md` zeigt.
6. **Geschichte:** `docs/PLAN-ETAPPE-7.md` bis `docs/PLAN-ETAPPE-11.md` werden gelöscht. Die Abschnitte zu den Etappen in `docs/STAND.md` werden kurz. Geltende Festlegungen bleiben. Alles bleibt in der Geschichte des Repos abrufbar.
7. `docs/STANDARD-TODOS.md` und `docs/MOBI-STANDARD-BEITRAEGE.md` kommen als Anhang in `docs/STAND.md` und werden gelöscht.
8. Der Agent schreibt einen kurzen neuen Text für die **Projektanweisungen** im Chat.
9. **Sicherheitsprüfung gegen das echte Skript:** `/security-review` und Strix laufen in 12.3 auch gegen die echte Schnittstelle. Eine Sperre von 15 Minuten ist in Ordnung, Testeinträge auch (die Person löscht sie in 12.17).
10. **Content-Security-Policy:** ja, als Teil der Sicherheit (12.4). Sie darf **keine Funktion der App blockieren**.
11. **Service Worker „zuerst Zwischenspeicher“:** nur, wenn die App dadurch schneller wird **und die Ansicht ohne Netz nicht schlechter** wird.
12. **Skript:** erst Test und Bericht, dann entscheiden.
13. **Löschen:** erst Bericht, dann Freigabe. Die Tabs `Posts` und `Projekt_Team` bleiben im Sheet.
14. **Barrierefreiheit:** WCAG 2.2, Stufe AA, Liste „Problem und Lösung“. **Zusätzlich auf jeden Fall ein ausführlicher Test mit Bildschirmleser** (die Person testet mit einer Anleitung des Agenten).
15. **Layout:** zwei Ansichten, Grenze bleibt 960 px, ohne Grenze von 1400 px, Reiter rutschen bei zu wenig Höhe in „Mehr ▾“. **Kacheln stehen bei mehr Platz nicht in mehr Spalten nebeneinander, sondern werden nur breiter.**
16. Lesetexte und Formulare bleiben gut lesbar schmal und stehen mittig.
17. **Icon:** vollflächig dunkelgrau `#1a1e20`, Logo groß, ohne Schrift.
18. **Ladebildschirm:** Dunkelgrau `#1a1e20` mit Logo. Die Gruppen nutzen **Android und iPhone**. Startbilder fürs iPhone nur, wenn die App dadurch nicht langsamer wird.
19. **Fehlerseite:** eigene `404.html` für den Server und „Seite nicht gefunden“ in der App.
20. **Tabs sortieren:** nach Wichtigkeit und nach Alphabet, mit Farben, nur von Hand im Editor.
21. **CSS:** **eine Datei** (`css/components.css`), ohne Doppelungen, mit klaren Abschnitten.
22. **CSS-Regel:** Nach 12.16 kommen neue Regeln in den passenden Abschnitt statt ans Ende. Die Projektregel wird angepasst. Der Agent muss den Abschnitt nicht eigens nennen; die Person fragt im Chat, wenn sie es wissen will.
23. Die Zeilen mit `[Kontakt]` in `texte/anleitung/zustaendig.txt` fallen weg, **der Signal-Knopf reicht** (in 12.2 erledigt).

## 4. Regeln für Etappe 12

- **Prüf-Schritte** (12.3, 12.5, 12.7, 12.10, 12.15) ändern die App nicht. Der Bericht kommt als Datei in die Projektdateien (`pruefung/<thema>-bericht.md`).
  Je Fund: Ort, wie schlimm, wer betroffen ist, Vorschlag zur Lösung, Aufwand. Die Person gibt frei, was gebaut wird.
  Ein Prüf-Schritt braucht nur dann einen Pull Request, wenn er ein Werkzeug fürs Skript liefert (12.5).
- **Bau-Schritte** haben je einen Pull Request mit Version. Nachbesserungen zählen die Version hoch.
- **Nichts kaputt machen:** Jeder Bau-Schritt wird vor dem Pull Request im Testbrowser mit allen Reitern und öffentlichen Seiten geprüft, bei Handy- und PC-Breite, hell und dunkel.
- **Aussehen gleich lassen**, außer bei Layout, Icon, Fehlerseite und Barrierefreiheit. Beim CSS entscheidet ein Vergleich von Bildschirmfotos vorher und nachher.
- **Sicherheitsprüfung gegen das echte Skript (12.3):**
  - Erlaubt (Entscheidung 9): Anfragen an die echte Schnittstelle, falsche PINs (Sperre bis 15 Minuten), Testeinträge.
  - Der Agent fragt **nie nach PINs**. Getestet wird darum ohne gültige Anmeldung (falsche oder gefälschte Token, Aktionen ohne Login, kaputte Eingaben).
  - Die Zahl der Anfragen bleibt klein, damit die Tageskontingente von Google nicht aufgebraucht werden (sonst läuft die App für alle bis zum nächsten Tag nicht).
  - Nichts wird gelöscht oder überschrieben, was nicht vom Test selbst stammt. Die Person sagt vorher kurz Bescheid, wann getestet wird, falls die Gruppen gerade arbeiten.
- **Sicherheitsfunde** stehen nur im Bericht in den Projektdateien, bis sie behoben sind.
- **Prüfwerkzeuge** (Strix, Prüfung der Barrierefreiheit, Messungen) laufen in der Testumgebung des Agenten und kommen nicht ins Repo.
- **Service Worker:** neue Version = neuer Name des Zwischenspeichers. Der Hinweis „Neue Version da“ und die Ansicht ohne Netz werden extra getestet.
- **Kein Build, keine Pakete in der App.**
- **Nicht vom Agenten prüfbar:** echte Ladezeiten am Handy, Freigaben in Google und GitHub, Bildschirmleser auf echten Geräten, Icon und Ladebildschirm auf dem echten Startbildschirm.

## 5. Schritte

### 12.1 – Plan Fassung 2 (erledigt)

Version 0.33.16, Pull Request #75.

### 12.2 – Plan Fassung 3 und eine Datei für Stand, Regeln und Pläne (W4, W5)

Version 0.34.0. Sheet und Skript bleiben unverändert.

1. Diese Datei als Fassung 3 mit den Entscheidungen.
2. `docs/STAND.md` neu aufgebaut: Arbeitsregeln (aus `CLAUDE.md`), Aufbau, aktueller Stand, Offen, Festlegungen je Bereich, Technik-Merkzettel, Dateiübersicht, Pläne, kurze Geschichte, Anhänge Standard-ToDos und Standard-Beiträge.
3. `CLAUDE.md` ist kurz und zeigt auf `docs/STAND.md`.
4. Gelöscht: `docs/PLAN-ETAPPE-7.md` bis `docs/PLAN-ETAPPE-11.md`, `docs/STANDARD-TODOS.md`, `docs/MOBI-STANDARD-BEITRAEGE.md`, die Bildschirmfotos `sig2-390.png`, `sig2-1280.png`, `term-390.png`, `term-1280.png` im Hauptordner.
5. Kommentare in `js/vorlagen.js` und `js/kanaele.js` zeigen auf den Anhang in `docs/STAND.md`.
6. `texte/anleitung/zustaendig.txt`: Zeilen mit `[Kontakt]` weg (Entscheidung 23).
7. Text für die Projektanweisungen im Chat.

**Prüfen:** In `docs/` stehen nur `STAND.md` und dieser Plan. Die App läuft wie vorher. Wiki → Anleitung → „Zuständig für die App“: kein `[Kontakt]` mehr, der Signal-Knopf ist da.

### 12.3 – Sicherheit prüfen (Bericht, W2) – erledigt

Keine Änderung an der App, kein Pull Request.

1. `/security-review` über den ganzen Code (App, Skript, Service Worker).
2. Strix in der Testumgebung, auch gegen die echte Schnittstelle (Regeln in Abschnitt 4).
3. Prüfung von Hand: Token, PIN-Sperre, Rechte je Gruppe, Aktionen ohne Login (`gruppen`, `termine`, `wiki`, `signal`), Eingaben, Schutz vor Formeln, Abrufe nach außen (OpenCollective, Drive).
4. „Was könnte kaputt gehen?“: Stellen mit möglichem Datenverlust und wie man von Hand zurückkommt.
5. Vorschlag für die Content-Security-Policy (was erlaubt sein muss).
6. Checkliste für die Person: Freigabe von Sheet und Drive-Ordner, Bereitstellung des Skripts („Ausführen als“, „Wer hat Zugriff“), wer im Repo schreiben darf, Schutz des Zweigs `main`.

**Ergebnis:** `pruefung/sicherheit-bericht.md`. Die Person gibt frei.

### 12.4 – Sicherheit beheben (W2) – erledigt (0.34.1)

Version 0.34.1. Je nach Funden mit Skript-Änderung (dann „Von Hand zu erledigen“).

1. Freigegebene Funde beheben.
2. Content-Security-Policy in `index.html` (und in `404.html`, sobald es sie gibt). Vorher alle Reiter und öffentlichen Seiten testen.
3. Editor-Test für die Rechte je Gruppe (eine Gruppe kann keine Daten einer anderen lesen oder ändern).

**Prüfen:** Alle Reiter, öffentliche Seiten, Bilder, Fotos hochladen, Kalender-Abo, Signal-Knopf, Kontostand und Cloud laufen wie vorher.

### 12.5 – Geschwindigkeit prüfen (Bericht, W1)

Version 0.34.3, nur für das Werkzeug. Skript-Datei neu, **keine neue Bereitstellung nötig**.

1. Neue Datei `apps-script/Werkzeuge.gs` mit dem Editor-Test `messenSkript` (misst die Laufzeit der wichtigsten Aktionen, schreibt nichts). Die Person führt ihn aus und schickt das Protokoll.
2. Messung im Testbrowser mit gedrosseltem Netz (Handy und PC): Ladezeit erstes und zweites Öffnen, Reiterwechsel, Zahl der Anfragen je Reiter, Größe der Dateien.
3. Prüfung „zuerst Zwischenspeicher“ im Service Worker (Entscheidung 11): schneller? Ansicht ohne Netz gleich gut?

**Ergebnis:** `pruefung/geschwindigkeit-bericht.md`. Die Person gibt frei.

### 12.6 – Geschwindigkeit verbessern (W1)

Version 0.34.4. Mit Skript-Änderung nur, wenn der Bericht es zeigt und die Person es freigibt.

1. Freigegebene Funde (zum Beispiel weniger doppelte Anfragen, weniger Neuzeichnen, Zwischenspeicher im Skript).
2. Wenn freigegeben: Service Worker „zuerst Zwischenspeicher“ mit Hinweis „Neue Version da – jetzt neu laden“.

**Prüfen:** Zweites Öffnen am Handy fühlt sich schneller an. Im Flugmodus sind alle Reiter wie vorher lesbar. Nach einem Update erscheint der Hinweis.

### 12.7 – Ungenutztes prüfen (Bericht, W4)

Keine Änderung an der App, kein Pull Request.

1. Liste der sicher ungenutzten Funktionen, Dateien, `HUELLE`-Einträge und Skript-Funktionen, mit Nachweis (wo gesucht).
2. Dazu die bekannten Reste aus Abschnitt 2.

**Ergebnis:** `pruefung/ungenutzt-bericht.md`. Die Person gibt frei.

### 12.8 – Ungenutztes löschen (W4)

Version 0.34.5. Sheet bleibt unverändert; Skript nur, wenn Skript-Funktionen freigegeben sind (dann „Von Hand zu erledigen“).

**Prüfen:** Alle Reiter und öffentlichen Seiten laufen wie vorher.

### 12.9 – Layout am PC und beim Rauszoomen (W8)

Version 0.34.6. Sheet und Skript bleiben unverändert.

1. `css/layout.css`: Grenze von 1400 px fällt weg. Seitenleiste und Inhalt füllen den Bildschirm. Kacheln werden breiter, nicht mehr Spalten (Entscheidung 15). Lesetexte und Formulare bleiben schmal und mittig (Entscheidung 16).
2. `js/ui/nav.js`: Reiter, die in der Seitenleiste keinen Platz mehr haben, rutschen in „Mehr ▾“ zum Ausklappen.
3. Anleitung `texte/anleitung/erste-schritte.txt` anpassen, falls sich die Bedienung der Seitenleiste ändert.

**Prüfen:** Am PC auf 67 %, 50 % und 33 % rauszoomen: kein leerer Rand, Kacheln breiter. Fenster niedrig ziehen oder auf 200 % zoomen: „Mehr ▾“ erscheint. Handy unverändert.

### 12.10 – Barrierefreiheit prüfen (Bericht, W7)

Keine Änderung an der App, kein Pull Request.

1. Automatische Prüfung aller Reiter und öffentlichen Seiten (hell und dunkel, Handy und PC) und Prüfung von Hand: nur Tastatur, sichtbarer Fokus, Beschriftungen, Überschriften, Kontraste, 200 % Zoom, große Schrift, weniger Bewegung.
2. **Anleitung für einen ausführlichen Test mit Bildschirmleser** (iPhone: VoiceOver, Android: TalkBack): Einschalten, Gesten, feste Aufgaben je Reiter, was zu notieren ist.
3. Die Ergebnisse der Person aus dem Test kommen in den Bericht.

**Ergebnis:** `pruefung/barrierefreiheit-bericht.md` (Liste „Problem, wo, wer betroffen, Lösung, Aufwand“). Die Person gibt frei.

### 12.11 – Barrierefreiheit verbessern (W7)

Version 0.34.7. Sheet und Skript bleiben unverändert.

1. Freigegebene Funde aus dem Bericht.
2. `texte/anleitung/fragen.txt`: kurzer Abschnitt zur Bedienung mit Bildschirmleser, wenn sinnvoll.

**Prüfen:** Dieselben Aufgaben aus der Anleitung zum Bildschirmleser noch einmal, große Schrift am Handy, nur Tastatur am PC.

### 12.12 – App-Icon und Ladebildschirm (W9)

Version 0.34.8. Sheet und Skript bleiben unverändert.

1. Neue Dateien `icons/icon-maskable.svg`, `icons/icon-maskable-192.png`, `icons/icon-maskable-512.png`, neues `icons/apple-touch-icon.png` (Entscheidung 17). Vorschau im Pull Request.
2. `manifest.webmanifest`: maskable Icons, `background_color` `#1a1e20`.
3. iPhone: Startbilder nur, wenn sie die App nicht langsamer machen (Entscheidung 18; das prüft der Agent und sagt es im Pull Request).
4. Neue Dateien in `HUELLE`, soweit sie zur App-Hülle gehören.

**Prüfen:** App vom Startbildschirm löschen und neu hinzufügen (Android und iPhone): Das Icon füllt die Fläche, kein weißer Kreis. Beim Öffnen erscheint ein dunkelgrauer Ladebildschirm mit Logo.

### 12.13 – Fehlerseite „Seite nicht gefunden“ (W10)

Version 0.34.9. Sheet und Skript bleiben unverändert.

1. Neue Datei `404.html` im Aussehen der App, auf Deutsch, mit Logo und Knopf „Zur Startseite“.
2. `js/app.js`: Unbekannte Adressen zeigen „Seite nicht gefunden“ mit Knopf „Zur Startseite“.

**Prüfen:** `…/aktionsdeck-landau/xyz`, `#/g/unbekannt` und `#/irgendwas` zeigen die deutsche Fehlerseite.

### 12.14 – Tabs im Sheet sortieren (W6)

Version 0.34.10. Skript-Datei geändert, **keine neue Bereitstellung nötig**.

1. `apps-script/Werkzeuge.gs` ergänzt: `tabsSortieren` (nach Wichtigkeit: `Gruppen`, `Zugang`, `Einstellungen`, `Log`, dann die Daten in der Reihenfolge der Reiter, ganz hinten `Posts` und `Projekt_Team`), `tabsSortierenAZ` (nach dem Alphabet), Farben je Bereich. Unbekannte Tabs kommen ans Ende. Daten und Spaltenköpfe ändern sich nicht.

**Prüfen:** Im Editor `tabsSortieren` ausführen: neue Reihenfolge und Farben, die App läuft wie vorher. Dann `tabsSortierenAZ` zum Vergleich.

### 12.15 – CSS prüfen (Bericht, W3)

Keine Änderung an der App, kein Pull Request.

1. Liste der doppelten Regeln (gleiche Klasse mehrfach), der Regeln, die sich gegenseitig überschreiben, und der ungenutzten Regeln.
2. Vorschlag für die Abschnitte in `css/components.css` (zum Beispiel Grundbausteine, je Reiter, öffentliche Seiten, Dunkelmodus, Druck).

**Ergebnis:** `pruefung/css-bericht.md`. Die Person gibt frei.

### 12.16 – CSS ordnen (W3)

Version 0.34.11. Sheet und Skript bleiben unverändert.

1. `css/components.css` in einer Datei mit klaren Abschnitten, ohne Doppelungen (Entscheidung 21).
2. Vergleich von Bildschirmfotos vorher und nachher (alle Reiter und Seiten, Handy und PC, hell und dunkel, Druck).
3. Neue CSS-Regel in `docs/STAND.md` (Entscheidung 22).

**Prüfen:** Alles sieht aus wie vorher. Wenn doch etwas anders wirkt: Reiter, Breite und Modus melden.

### 12.17 – Abschluss und Version 1.0.0

Version 1.0.0. Sheet und Skript bleiben unverändert.

1. Vorher von der Person: Testdaten im Sheet löschen (`testdatenListe` in `apps-script/Aufraeumen.gs`), auch die Testeinträge aus 12.3. Datenschutztext geprüft.
2. GitHub Actions kontrollieren (laufen grün, keine Warnungen).
3. `docs/STAND.md`: Etappe 12 kurz zusammengefasst, dieser Plan eingearbeitet und gelöscht. `texte/entwicklung.txt`: Etappe 12 und Version 1.0; ab dann eine Zeile je Version.

**Prüfen:** Nach dem Merge ist die Action grün, unter „Info“ steht 1.0.0.

## 6. Reihenfolge und Versionen

| Schritt | Inhalt | Art | Version | Sheet/Skript |
|---|---|---|---|---|
| 12.1 | Plan Fassung 2 | Doku | 0.33.16 | nein |
| 12.2 | Plan Fassung 3, eine Doku-Datei | Doku | 0.34.0 | nein |
| 12.3 | Sicherheit prüfen | Bericht | – | Tests gegen echtes Skript |
| 12.4 | Sicherheit beheben, Content-Security-Policy | Bau | 0.34.1 | vielleicht |
| 12.4b | Nachbesserung: Fotos (CSP) | Bau | 0.34.2 | nein |
| 12.5 | Geschwindigkeit prüfen (`messenSkript`) | Bericht | 0.34.3 | `Werkzeuge.gs` neu, keine Bereitstellung |
| 12.6 | Geschwindigkeit verbessern | Bau | 0.34.4 | vielleicht |
| 12.7 | Ungenutztes prüfen | Bericht | – | nein |
| 12.8 | Ungenutztes löschen | Bau | 0.34.5 | vielleicht |
| 12.9 | Layout am PC und beim Rauszoomen | Bau | 0.34.6 | nein |
| 12.10 | Barrierefreiheit prüfen, Test mit Bildschirmleser | Bericht | – | nein |
| 12.11 | Barrierefreiheit verbessern | Bau | 0.34.7 | nein |
| 12.12 | App-Icon und Ladebildschirm | Bau | 0.34.8 | nein |
| 12.13 | Fehlerseite | Bau | 0.34.9 | nein |
| 12.14 | Tabs im Sheet sortieren | Bau | 0.34.10 | `Werkzeuge.gs`, keine Bereitstellung |
| 12.15 | CSS prüfen | Bericht | – | nein |
| 12.16 | CSS ordnen | Bau | 0.34.11 | nein |
| 12.17 | Abschluss | Doku | 1.0.0 | nein |

Nachbesserungen zählen die Version hoch, dann verschieben sich die folgenden Nummern.
Nach jedem Bau-Schritt prüft die Person am Handy und am PC und meldet Anmerkungen gesammelt. Sie kommen in den nächsten Pull Request, vor dem nächsten Schritt.
