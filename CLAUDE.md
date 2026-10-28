# CLAUDE.md – Arbeitsregeln für AktionsDeck Landau

Diese Datei liest du (der Agent) zuerst. Sie gilt für jede Aufgabe in diesem Repo.
Der aktuelle Projektstand steht in `docs/STAND.md`, der Plan für die laufende Etappe in `docs/PLAN-ETAPPE-<Nummer>.md`
(als Nächstes Etappe 12 „Prüfung und Qualität“: `docs/PLAN-ETAPPE-12.md`, Fassung 1, der letzte Schritt vor Version 1.0;
Etappe 11 „Komfort“ in `docs/PLAN-ETAPPE-11.md` ist mit 0.33.15 fertig und geprüft).

## 1. Worum es geht

AktionsDeck Landau ist eine Web-App (PWA) für Klima-Gruppen. Gruppen am Anfang: Fridays for Future (fff),
Greenpeace (gp), Klimabündnis. Weitere Gruppen kommen später dazu.
Die Person, die mit dir arbeitet, ist keine Programmiererin und kein Programmierer. Sie arbeitet nur im Browser
(GitHub-Webseite, Google Sheet, Apps-Script-Editor). Die Browser-Konsole ist bei ihr gesperrt.
Sie prüft jede Änderung auf Handy und PC und übernimmt Änderungen am Google-Skript von Hand.

## 2. Sprache und Ton

- Schreibe alles auf Deutsch in einfachen Worten: Antworten, Commit-Nachrichten, Pull-Request-Texte, Kommentare im Code.
- Kurze Sätze. Keine Fachwörter ohne Erklärung.
- Nenne immer Dateipfade und die Schrittnummer (zum Beispiel „7.4a").
- Stelle alle Rückfragen gesammelt am Ende deiner Antwort, nicht zwischendurch.
- Anmerkungen zur Anzeige (Aussehen, Texte) sammelt die Person selbst und meldet sie gesammelt. Frage dazu nicht nach.

## 3. So arbeitest du an einer Aufgabe

1. Lies `docs/STAND.md`, dann den Plan der laufenden Etappe (`docs/PLAN-ETAPPE-<Nummer>.md`), dann genau die Dateien, die du für den Schritt brauchst.
2. Rate nie. Fehlt eine Datei, widersprechen sich Stand und Code, oder wirkt der Stand veraltet: Schreibe es klar in den
   Pull-Request-Text und arbeite nur an dem weiter, was sicher ist.
3. Prüfe zuerst `js/config.js` (VERSION) gegen `docs/STAND.md`. Weichen sie ab, melde es.
4. Arbeite auf einem eigenen Zweig. **Ein Schritt = ein Zweig = ein Pull Request.** Nie direkt auf `main`.
5. Ändere nur, was der Schritt verlangt. Keine Aufräumaktionen nebenbei, keine Umbenennungen, kein Umformatieren.
6. Bestehende Dateien bearbeitest du gezielt (Edit), du schreibst sie nicht komplett neu.
   Ganze Dateien nur, wenn sie neu sind oder mehr als etwa die Hälfte neu ist.
7. Aktualisiere am Ende `docs/STAND.md` (Version, was erledigt ist, was als Nächstes kommt, Dateiübersicht).
   Ändert der Schritt, wie ein Reiter funktioniert, passe im selben Pull Request die Seite in `texte/anleitung/` an
   (Liste in `texte/anleitung/liste.txt`, Format wie im Wiki). Nach Version 1.0 bekommt `texte/entwicklung.txt` zusätzlich
   je Version eine kurze Zeile (neueste oben). Dateien in `texte/` sind öffentlich abrufbar: nichts Internes hineinschreiben.
8. Prüfe deine Arbeit (Abschnitt 8), dann öffne den Pull Request mit dem Text aus Abschnitt 9.

## 4. Harte Regeln

- **Version:** Bei jeder Änderung `VERSION` in `js/config.js` UND in `sw.js` gemeinsam hochzählen.
  Beide müssen am Ende exakt gleich sein. Kleine Schritte zählen den letzten Teil hoch (0.29.4 → 0.29.5),
  ein neuer Hauptschritt zählt den mittleren Teil hoch. Im Zweifel: letzten Teil hochzählen.
- **`js/config.js`:** Dort steht die echte `API_URL`. Die Datei nie ersetzen und nie neu schreiben.
  Ändere nur die Zeile mit `VERSION` und, falls im Plan verlangt, den Block `features`.
- **Neue Dateien** (JS, CSS, Bilder), die zur App-Hülle gehören, trägst du in `sw.js` in die Liste `HUELLE` ein.
  Gelöschte Dateien trägst du dort wieder aus. Prüfe am Ende, dass jede Datei in `HUELLE` existiert.
- **Keine Geheimnisse im Repo:** keine PINs, keine Hashes, kein Token-Geheimnis, keine Sheet-Zugangsdaten.
- **Texte aus Daten nur mit `textContent`** (oder dem `el()`-Helfer mit `text:`) anzeigen. Nie `innerHTML` mit Daten.
- **Links aus Daten** (zum Beispiel Canva-Link) nur öffnen, wenn sie mit `https://` oder `http://` beginnen (`sichereUrl`).
- **CSS:** Neue Regeln hängst du ans Ende von `css/components.css` an und beginnst mit einem Kommentar
  `/* ---- <Version>: <Thema> ---- */`. Bestehende Regeln änderst du nur, wenn es nicht anders geht, und sagst es im PR.
- **Kein Build, keine Pakete, kein Framework.** Reines HTML, CSS und JavaScript mit ES-Modulen. Relative Pfade.
  Keine externen Skripte oder Schriften laden.
- **Hash-Routing:** `#/g/<kurzname>/<reiter>`.
- **Keine Offline-Schreibzugriffe.** Schreiben geht nur mit Verbindung.
- Tippflächen am Handy mindestens 44 px hoch. Am Handy gibt es Karten statt Tabellen.
- Der Dateiname einer Ansicht ist `js/views/<name>.js` mit `render(container, ctx)`.
  Reiter und Schalter stehen in `js/config.js` (`features`) und `js/ui/nav.js`.

## 5. Aufbau in Kürze

- **Oberfläche:** statische PWA auf GitHub Pages. Repo-Bereiche: `index.html`, `manifest.webmanifest`, `sw.js`, `docs/`,
  `icons/`, `css/` (base, layout, components), `apps-script/` (Kopie des Google-Skripts),
  `js/` (app, config, api, store, cache, schema, vorlagen, kanaele, wiki-format, ui/, views/),
  `texte/` (feste Texte im Wiki-Format: Impressum, Info, Datenschutz, Entwicklung App, `anleitung/` mit der App-Anleitung;
  öffentlich abrufbar, darum nichts Internes).
- **PC (ab 960 px):** Seitenleiste links, Inhalt in der Mitte, Details rechts.
  **Handy:** untere Leiste (Start, Projekte, ToDos, Mobi, Mehr), Details als Vollbild.
- **Reiter:** Start, Projekte, ToDos, Mobi, Material, Kalender, Dokumentation, Team, Wiki, Cloud (am Handy alle ab Material unter „Mehr").
  Cloud erscheint nur, wenn die Gruppe einen Cloud-Link hat (`js/gruppeninfo.js`).
  Öffentlich ohne Login: `#/info/<seite>` (Impressum, Info, Datenschutz), `#/termine`, `#/wiki`.
- **Schnittstelle:** Google Apps Script als Web-App, an das Google Sheet gebunden. Aufruf per POST mit JSON als
  `text/plain`. Das Feld für die Aktion heißt `aktion`. Antwort: `{ok, data, error, code}`.
  Aktionen: `gruppen` (ohne Login), `login`, `bootstrap`, `list` (mit `seit`), `listMehrere`, `create`, `update`,
  `delete` (weich), `batchCreate`. Ohne Login außerdem `termine` und `wiki` (nur öffentliche Daten, keine Namen) und `signal` (Rechenaufgabe, danach der Signal-Link aus der Skripteigenschaft `SIGNAL_LINK`).
- **Zugang:** Ein PIN pro Gruppe, kein Admin-PIN, keine Einzelkonten. Das Skript prüft den PIN und gibt ein signiertes
  Token (14 Tage) mit `gruppe_id`. Jeder Aufruf prüft Token und Gruppe. Ein Token sieht nur Daten seiner Gruppe.
- **Anzeigename:** „Wer bist du?" wird nur im Gerät gespeichert und landet im Log.
- **Gleichzeitiges Arbeiten:** Beim Ändern schickt die App den bekannten Wert `geaendert_am` als `bekannt` mit.
  Weicht er ab, zeigt sie einen Hinweis statt zu überschreiben. Löschen ist weich (`geloescht = TRUE`).
  Offene Seiten laden alle 30 bis 60 Sekunden neu. Zwischenspeicher: IndexedDB (`js/cache.js`, `ladeMitCache`).
- **Hilfsmodule, die du vor dem Neubauen suchst und wiederverwendest:** `js/ui/dom.js` (`el`, `leeren`), `js/ui/fenster.js`
  (`zeigeFenster`), `js/ui/form.js` (`baueFormular`), `js/ui/table.js` (`zeigeListe`), `js/ui/toast.js`,
  `js/ui/kommentare.js` (`baueKommentare`), `js/views/todos-rechnen.js`, `js/views/kalender-rechnen.js`,
  `js/views/mobi-rechnen.js`, `js/wiki-format.js` (`zeichneText`, Textformat für Wiki und `texte/`), `js/views/wiki-rechnen.js`,
  `js/gruppeninfo.js` (Kontostand und Cloud-Link), `js/views/erinnerungen-rechnen.js` (Regeln für „Für dich“),
  `js/views/uebersicht-rechnen.js` (Jahresübersicht), `js/ui/druck.js` (`drucke`), `js/ui/darstellung.js` (Dunkelmodus, `istDunkel`).
  Farben: nur über die Variablen in `css/base.css`; jede neue Farbe braucht auch einen dunklen Wert (Block 0.33.8 in `css/components.css`).
  Lies die Datei, bevor du sie benutzt. Rate keine Signaturen.

## 6. Google Sheet (Tabs)

Alle Daten-Tabs haben zusätzlich: `id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht`.
Die erste Zeile enthält die Spaltenköpfe (klein, ohne Umlaute). Die Schreibweise `gruppe_id` ist genau so richtig.
Die Tabs und Spalten stehen in `apps-script/Schema.gs` und `js/schema.js`. Beide müssen zusammenpassen.
Eine neue Tabelle oder Spalte ist nur ein Eintrag in `Schema.gs` und in `js/schema.js`.
Regeln: Verfügbar (Material) = anzahl − Summe mitgenommen + Summe zurueck. Kalender-Termine werden berechnet,
nicht gespeichert. Projekt erledigt = Status `erledigt` (in der Standardliste ausgeblendet, Filter Archiv).

## 7. Google-Skript (`apps-script/*.gs`)

Du kannst das Skript nicht ausführen und das Sheet nicht ändern. Das macht die Person von Hand.
Darum gilt:

- Ändere `.gs`-Dateien im Repo nur, wenn der Schritt es verlangt.
- Das Skript prüft Spaltenköpfe streng. Neue Spalten im Sheet müssen **vor** dem Skript da sein.
- Beim Schreiben ins Sheet werden Werte, die mit `=`, `+`, `-` oder `@` beginnen, mit führendem Hochkomma geschützt.
  Jeder Schreibzugriff läuft mit `LockService`. Es werden nur geänderte Felder geschrieben.
- **Wenn sich eine `.gs`-Datei oder das Sheet ändert, schreibst du in den Pull-Request-Text einen Abschnitt
  „Von Hand zu erledigen"** mit genau diesen Punkten, in dieser Reihenfolge:
  1. Welche Spalten oder Tabs im Sheet neu angelegt werden (Namen zum Abtippen, Zeile 1, in welcher Reihenfolge).
  2. Welche `.gs`-Dateien sich geändert haben. Die Person kopiert dann die **ganze Datei** aus dem Repo in den
     Apps-Script-Editor (Datei im Repo öffnen → „Raw" → alles kopieren → im Editor ersetzen).
  3. Welche Funktion im Editor einmal ausgeführt wird (zum Beispiel `formatieren`) und was im Protokoll stehen soll.
  4. Danach: Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version" → Bereitstellen.
- Gibt es keine Änderung an Sheet oder Skript, schreibe ausdrücklich: „Sheet und Skript bleiben unverändert."

## 8. Prüfen vor dem Pull Request

Du hast keinen Browser auf dem Gerät der Person. Prüfe darum, was du kannst, und sage, was du nicht prüfen konntest.

1. Syntax: Für jede geänderte oder neue `.js`-Datei eine temporäre Kopie mit Endung `.mjs` anlegen und
   `node --check <datei>.mjs` ausführen. Die Kopien nicht einchecken.
2. Importe: Jeder `import`-Pfad in geänderten Dateien zeigt auf eine vorhandene Datei, und jeder importierte Name wird
   in dieser Datei auch exportiert.
3. `sw.js`: Jede Datei in `HUELLE` existiert. Jede neue JS- oder CSS-Datei steht in `HUELLE`.
4. Version: `js/config.js` und `sw.js` haben dieselbe VERSION.
5. Keine Reste: Suche nach `innerHTML`, `console.log`, `debugger`, `TODO` in deinen Änderungen.
6. `docs/STAND.md` ist aktualisiert.

## 9. Pull-Request-Text (immer so aufbauen)

```
## Schritt <Nummer>: <Titel>
Version: <alt> → <neu>

### Was ist neu
- (einfache Sätze)

### Geänderte Dateien
- Pfad: kurz, was sich ändert

### Sheet und Skript
Sheet und Skript bleiben unverändert.   (oder: Abschnitt „Von Hand zu erledigen", siehe Regel in CLAUDE.md Abschnitt 7)

### Prüfen (Liste für die Person, am Handy und am PC)
1. ...

### Nicht geprüft / unsicher
- (ehrlich auflisten)

### Rückfragen
1. ...
```

## 10. Was du nicht tust

- Nicht auf `main` pushen, keinen Pull Request selbst mergen.
- Keine Dateien löschen, die der Plan nicht ausdrücklich nennt.
- Keine Daten, PINs oder Geheimnisse erfinden, abfragen oder einchecken.
- Keine neuen Bibliotheken, keinen Build, keine Tracker, keine Cookies.
- Keine Funktionen bauen, die nicht im Plan stehen. Ideen schreibst du unter „Rückfragen".
- Keine echten Personennamen oder Fotos mit Personen in Beispieldaten.
