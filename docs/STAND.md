# STAND – AktionsDeck Landau

**Diese Datei ist die einzige Doku-Datei für den Agenten:** Arbeitsregeln, Aufbau, aktueller Stand, Festlegungen und Pläne.
Lies sie zuerst, bei jeder Aufgabe. `CLAUDE.md` im Hauptordner zeigt nur hierher.
Bis zum Ende von Etappe 12 gibt es daneben noch den Plan `docs/PLAN-ETAPPE-12.md`.

- Version der App: **0.34.5** (gleich in `js/config.js` und `sw.js`: beide Dateien prüfen)
- Repo: https://github.com/fridaysforfuture-landau-pfalz/aktionsdeck-landau
- Seite (App): https://fridaysforfuture-landau.de/aktionsdeck-landau/
- Laufende Etappe: **Etappe 12 „Prüfung und Qualität“**, Plan Fassung 3 in `docs/PLAN-ETAPPE-12.md`, letzter Schritt vor Version 1.0.
- Nächster Schritt: **12.7 Ungenutztes prüfen** (Bericht im Chat).

Inhalt: 1 Arbeitsregeln · 2 Aufbau · 3 Aktueller Stand und Offen · 4 Festlegungen je Bereich · 5 Technik-Merkzettel ·
6 Dateiübersicht · 7 Pläne · 8 Geschichte · Anhang A Standard-ToDos · Anhang B Mobi-Standard-Beiträge

---

## 1. Arbeitsregeln

### 1.1 Worum es geht und mit wem du arbeitest

AktionsDeck Landau ist eine Web-App (PWA) für Klima-Gruppen. Gruppen am Anfang: Fridays for Future (fff),
Greenpeace (gp), Klimabündnis (kb). Weitere Gruppen kommen später dazu.
Die Person, die mit dir arbeitet, ist keine Programmiererin und kein Programmierer. Sie arbeitet nur im Browser
(GitHub-Webseite, Google Sheet, Apps-Script-Editor). Die Browser-Konsole ist bei ihr gesperrt.
Sie prüft jede Änderung auf Handy und PC und übernimmt Änderungen am Google-Skript von Hand.

### 1.2 Sprache und Ton

- Schreibe alles auf Deutsch in einfachen Worten: Antworten, Commit-Nachrichten, Pull-Request-Texte, Kommentare im Code.
- Kurze Sätze. Keine Fachwörter ohne Erklärung.
- Nenne immer Dateipfade und die Schrittnummer (zum Beispiel „7.4a“).
- Stelle alle Rückfragen gesammelt am Ende deiner Antwort, nicht zwischendurch.
- Anmerkungen zur Anzeige (Aussehen, Texte) sammelt die Person selbst und meldet sie gesammelt. Frage dazu nicht nach.

### 1.3 So arbeitest du an einer Aufgabe

1. Lies diese Datei, dann (solange es ihn gibt) den Plan der laufenden Etappe, dann genau die Dateien, die du für den Schritt brauchst.
2. Rate nie. Fehlt eine Datei, widersprechen sich Stand und Code, oder wirkt der Stand veraltet: Schreibe es klar in den
   Pull-Request-Text und arbeite nur an dem weiter, was sicher ist.
3. Prüfe zuerst `js/config.js` (VERSION) gegen den Kopf dieser Datei. Weichen sie ab, melde es.
4. Arbeite auf einem eigenen Zweig. **Ein Schritt = ein Zweig = ein Pull Request.** Nie direkt auf `main`.
5. Ändere nur, was der Schritt verlangt. Keine Aufräumaktionen nebenbei, keine Umbenennungen, kein Umformatieren.
6. Bestehende Dateien bearbeitest du gezielt (Edit), du schreibst sie nicht komplett neu.
   Ganze Dateien nur, wenn sie neu sind oder mehr als etwa die Hälfte neu ist.
7. Aktualisiere am Ende diese Datei: Version im Kopf, nächster Schritt, Abschnitt 3 (Stand und Offen), bei Bedarf Festlegungen (4),
   Merkzettel (5), Dateiübersicht (6) und eine kurze Zeile in der Geschichte (8). **Keine langen Berichte je Schritt mehr:**
   Einzelheiten stehen im Pull Request.
   Ändert der Schritt, wie ein Reiter funktioniert, passe im selben Pull Request die Seite in `texte/anleitung/` an
   (Liste in `texte/anleitung/liste.txt`, Format wie im Wiki). Nach Version 1.0 bekommt `texte/entwicklung.txt` zusätzlich
   je Version eine kurze Zeile (neueste oben). Dateien in `texte/` sind öffentlich abrufbar: nichts Internes hineinschreiben.
8. Prüfe deine Arbeit (1.6), dann öffne den Pull Request mit dem Text aus 1.7.

### 1.4 Harte Regeln

- **Version:** Bei jeder Änderung `VERSION` in `js/config.js` UND in `sw.js` gemeinsam hochzählen.
  Beide müssen am Ende exakt gleich sein. Kleine Schritte zählen den letzten Teil hoch (0.29.4 → 0.29.5),
  ein neuer Hauptschritt zählt den mittleren Teil hoch. Im Zweifel: letzten Teil hochzählen.
  Jede Nachbesserung zählt die Version hoch, auch in einem noch offenen Pull Request.
- **`js/config.js`:** Dort steht die echte `API_URL`. Die Datei nie ersetzen und nie neu schreiben.
  Ändere nur die Zeile mit `VERSION` und, falls im Plan verlangt, den Block `features`.
- **Neue Dateien** (JS, CSS, Bilder), die zur App-Hülle gehören, trägst du in `sw.js` in die Liste `HUELLE` ein.
  Gelöschte Dateien trägst du dort wieder aus. Prüfe am Ende, dass jede Datei in `HUELLE` existiert.
- **Keine Geheimnisse im Repo:** keine PINs, keine Hashes, kein Token-Geheimnis, keine Sheet-Zugangsdaten.
- **Texte aus Daten nur mit `textContent`** (oder dem `el()`-Helfer mit `text:`) anzeigen. Nie `innerHTML` mit Daten.
- **Links aus Daten** (zum Beispiel Canva-Link) nur öffnen, wenn sie mit `https://` oder `http://` beginnen (`sichereUrl`).
- **CSS:** Alle Regeln stehen in `css/components.css` (dazu `css/base.css` für Variablen und `css/layout.css` für das Gerüst).
  **Bis Schritt 12.16** hängst du neue Regeln ans Ende von `css/components.css` an und beginnst mit einem Kommentar
  `/* ---- <Version>: <Thema> ---- */`. **Ab 12.16** (CSS geordnet) kommen neue Regeln in den passenden Abschnitt, mit Kommentar
  und Version; doppelte Regeln für dieselbe Klasse vermeidest du, du änderst die vorhandene. Den Abschnitt musst du der Person
  nicht eigens nennen; sie fragt, wenn sie es wissen will. Bestehende Regeln änderst du nur, wenn es nicht anders geht, und sagst es im PR.
- **Farben:** nur über die Variablen in `css/base.css`; jede neue Farbe braucht auch einen dunklen Wert (Dunkelmodus, Block 0.33.8 in `css/components.css`).
- **Kein Build, keine Pakete, kein Framework.** Reines HTML, CSS und JavaScript mit ES-Modulen. Relative Pfade.
  Keine externen Skripte oder Schriften laden.
- **Hash-Routing:** `#/g/<kurzname>/<reiter>`.
- **Keine Offline-Schreibzugriffe.** Schreiben geht nur mit Verbindung.
- Tippflächen am Handy mindestens 44 px hoch. Am Handy gibt es Karten statt Tabellen.
- Der Dateiname einer Ansicht ist `js/views/<name>.js` mit `render(container, ctx)`.
  Reiter und Schalter stehen in `js/config.js` (`features`) und `js/ui/nav.js`.

### 1.5 Google-Skript (`apps-script/*.gs`)

Du kannst das Skript nicht ausführen und das Sheet nicht ändern. Das macht die Person von Hand. Darum gilt:

- Ändere `.gs`-Dateien im Repo nur, wenn der Schritt es verlangt.
- Das Skript prüft Spaltenköpfe streng. Neue Spalten im Sheet müssen **vor** dem Skript da sein.
- Beim Schreiben ins Sheet werden Werte, die mit `=`, `+`, `-` oder `@` beginnen, mit führendem Hochkomma geschützt.
  Jeder Schreibzugriff läuft mit `LockService`. Es werden nur geänderte Felder geschrieben.
- **Wenn sich eine `.gs`-Datei oder das Sheet ändert, schreibst du in den Pull-Request-Text einen Abschnitt
  „Von Hand zu erledigen“** mit genau diesen Punkten, in dieser Reihenfolge:
  1. Welche Spalten oder Tabs im Sheet neu angelegt werden (Namen zum Abtippen, Zeile 1, in welcher Reihenfolge).
  2. Welche `.gs`-Dateien sich geändert haben. Die Person kopiert dann die **ganze Datei** aus dem Repo in den
     Apps-Script-Editor (Datei im Repo öffnen → „Raw“ → alles kopieren → im Editor ersetzen).
  3. Welche Funktion im Editor einmal ausgeführt wird (zum Beispiel `formatieren`) und was im Protokoll stehen soll.
  4. Danach: Bereitstellen → Bereitstellungen verwalten → Stift → „Neue Version“ → Bereitstellen.
- Gibt es keine Änderung an Sheet oder Skript, schreibe ausdrücklich: „Sheet und Skript bleiben unverändert.“
- Neue Sheet-Spalte oder neuer Tab: erst im Sheet ergänzen (Kopfzeile von Hand tippen, ohne unsichtbare Zeichen),
  dann `Schema.gs` (Editor und GitHub), dann `formatieren()` (nur bei neuen Text-Spalten nötig), dann neu bereitstellen.
- Erfahrung: Kennt die App eine neue Aktion nicht („Bitte neu anmelden“, „Unbekannte Aktion“), ist meist eine alte Fassung von
  `Code.gs` bereitgestellt. Dann `Code.gs` ersetzen und eine neue Version bereitstellen.

### 1.6 Prüfen vor dem Pull Request

Du hast keinen Browser auf dem Gerät der Person. Prüfe darum, was du kannst, und sage, was du nicht prüfen konntest.

1. Syntax: Für jede geänderte oder neue `.js`-Datei eine temporäre Kopie mit Endung `.mjs` anlegen und
   `node --check <datei>.mjs` ausführen. Die Kopien nicht einchecken.
2. Importe: Jeder `import`-Pfad in geänderten Dateien zeigt auf eine vorhandene Datei, und jeder importierte Name wird
   in dieser Datei auch exportiert.
3. `sw.js`: Jede Datei in `HUELLE` existiert. Jede neue JS- oder CSS-Datei steht in `HUELLE`.
4. Version: `js/config.js` und `sw.js` haben dieselbe VERSION.
5. Keine Reste: Suche nach `innerHTML`, `console.log`, `debugger`, `TODO` in deinen Änderungen.
6. Diese Datei ist aktualisiert.
7. Bei sichtbaren Änderungen: im Testbrowser alle betroffenen Reiter bei Handy- (390 px) und PC-Breite (1280 px), hell und dunkel.

### 1.7 Pull-Request-Text (immer so aufbauen)

```
## Schritt <Nummer>: <Titel>
Version: <alt> → <neu>

### Was ist neu
- (einfache Sätze)

### Geänderte Dateien
- Pfad: kurz, was sich ändert

### Sheet und Skript
Sheet und Skript bleiben unverändert.   (oder: Abschnitt „Von Hand zu erledigen“, siehe 1.5)

### Prüfen (Liste für die Person, am Handy und am PC)
1. ...

### Nicht geprüft / unsicher
- (ehrlich auflisten)

### Rückfragen
1. ...
```

Hinweis für die Person in jeder Prüfliste: Nach dem Merge die Action grün abwarten, die Seite neu laden, bei „Neue Version da“ auf „Jetzt neu laden“ tippen
(ab 0.34.4; vorher zweimal neu laden), unter „Info“ die Version prüfen.

### 1.8 Was du nicht tust

- Nicht auf `main` pushen, keinen Pull Request selbst mergen.
- Keine Dateien löschen, die der Plan nicht ausdrücklich nennt.
- Keine Daten, PINs oder Geheimnisse erfinden, abfragen oder einchecken.
- Keine neuen Bibliotheken, keinen Build, keine Tracker, keine Cookies.
- Keine Funktionen bauen, die nicht im Plan stehen. Ideen schreibst du unter „Rückfragen“.
- Keine echten Personennamen oder Fotos mit Personen in Beispieldaten.

---

## 2. Aufbau

### 2.1 Oberfläche

- Statische PWA auf GitHub Pages. Repo-Bereiche: `index.html`, `manifest.webmanifest`, `sw.js`, `docs/`, `icons/`,
  `css/` (base, layout, components), `apps-script/` (Kopie des Google-Skripts),
  `js/` (app, config, api, store, cache, schema, vorlagen, kanaele, wiki-format, gruppeninfo, darstellung-start, ui/, views/),
  `texte/` (feste Texte im Wiki-Format, öffentlich abrufbar).
- **PC (ab 960 px):** Seitenleiste links, Inhalt in der Mitte, Details rechts. Seitenleiste unten: „Name ändern“, „Abmelden“,
  Schalter Hell/Dunkel, Links Impressum, Info, Datenschutz, Wiki.
  **Handy (bis 959 px):** untere Leiste (Start, Projekte, ToDos, Mobi, Mehr), Details als Vollbild.
- **Reiter:** Start, Projekte, ToDos, Mobi, Material, Kalender, Dokumentation (Kennung `protokoll`), Team, Wiki, Cloud
  (am Handy alle ab Material unter „Mehr“). Cloud erscheint nur, wenn die Gruppe einen Cloud-Link hat (`js/gruppeninfo.js`).
- **Öffentlich ohne Login:** `#/info/<seite>` (Impressum, Info, Datenschutz; Texte in `texte/<seite>.txt`), `#/termine`, `#/wiki`.
- Meldungen (toast) mittig. Fenster über `js/ui/fenster.js` (`zeigeFenster(titel, inhalt, beiZu, { aussenKlick })`, mit ✕ oben rechts).
  ToDos und Material nutzen den Detailbereich rechts (mit „← Zurück“).
- Grün als Grundfarbe, Gruppenfarbe aus dem Sheet (CSS-Variable). Ein gemeinsames App-Icon. Dunkelmodus je Gerät.

### 2.2 Schnittstelle und Zugang

- Google Apps Script als Web-App (Ausführen als Besitzer, Zugriff: Jeder), an das Google Sheet gebunden. Aufruf per POST mit JSON als
  `text/plain`. Das Feld für die Aktion heißt `aktion`. Antwort: `{ok, data, error, code}`.
- Aktionen mit Login: `login`, `bootstrap`, `list` (mit `seit`), `listMehrere`, `create`, `update`, `delete` (weich), `batchCreate`,
  `uploadImage`, `buchen`, `projektLoeschen`, `protokollSpeichern`, `protokollInsDokument`, `protokollInfo`, `gruppeInfo`, `kontoAktualisieren`.
  Ohne Login: `gruppen`, `termine` (auch als GET, mit `format=ics`), `wiki` (nur öffentliche Daten, keine Namen), `signal`
  (Rechenaufgabe, danach der Signal-Link aus der Skripteigenschaft `SIGNAL_LINK`).
- **Zugang:** Ein PIN pro Gruppe (mindestens 6 Zeichen), kein Admin-PIN, keine Einzelkonten. Das Skript prüft den PIN
  (SHA-256 mit Salt, Hash im Tab `Zugang`) und gibt ein signiertes Token (HMAC, 14 Tage) mit `gruppe_id`, `zugang_id` und `v` (Stand des PINs, aus Salt und Hash).
  Ein neuer PIN macht damit alle alten Anmeldungen der Gruppe ungültig.
  Geheimnis nur in den Skripteigenschaften (`TOKEN_GEHEIMNIS`). Jeder Aufruf prüft Token, Gruppe und ob der Zugang aktiv ist.
  Ein Token sieht nur Daten seiner Gruppe. Sperre pro Gruppe: 8 Fehlversuche in 15 Minuten → 15 Minuten gesperrt.
- **Anzeigename:** „Wer bist du?“ wird nur im Gerät gespeichert und landet im Log. Das Skript entfernt Steuerzeichen und vorne `= + - @` (höchstens 60 Zeichen).
- **Schutz vor Formeln:** Jeder Text, der ins Sheet geht, läuft durch `schuetzen` (Util.gs), auch beim Zurückschreiben ganzer Blöcke
  (`schreibeSpalten`, `teamZellenSchreiben`). Neue Schreibstellen immer mit `schuetzen`.
- **Content-Security-Policy** als `<meta>` in `index.html`: Skripte und Stile nur von der eigenen Seite, Bilder von allen `https:`-Adressen (Google leitet Drive-Vorschaubilder auf wechselnde Adressen um; nur Drive und
  `googleusercontent.com` blockierte die Fotos in 0.34.1),
  Verbindungen nur zum Skript. Neue Adressen nach außen hier eintragen, sonst blockiert der Browser sie. Kein Inline-Skript, kein `style="…"` im HTML.
- **Gleichzeitiges Arbeiten:** Beim Ändern schickt die App den bekannten Wert `geaendert_am` als `bekannt` mit.
  Weicht er ab, zeigt sie einen Hinweis statt zu überschreiben. Löschen ist weich (`geloescht = TRUE`).
  Offene Seiten laden alle 30 bis 60 Sekunden neu. Zwischenspeicher: IndexedDB (`js/cache.js`, `ladeMitCache`).
- Fotos: Drive-Ordner je Gruppe mit Link-Freigabe, im Sheet steht nur die `foto_id`. Keine Personen auf Fotos.

### 2.3 Google Sheet (Tabs)

Alle Daten-Tabs haben zusätzlich: `id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht`.
Die erste Zeile enthält die Spaltenköpfe (klein, ohne Umlaute). Die Schreibweise `gruppe_id` ist genau so richtig.
Die Tabs und Spalten stehen in `apps-script/Schema.gs` und `js/schema.js`. **Beide müssen zusammenpassen.**
Eine neue Tabelle oder Spalte ist nur ein Eintrag in `Schema.gs` und in `js/schema.js`.

- System-Tabs: `Gruppen` (gruppe_id, name, kurzname, farbe, sortierung, aktiv, webseite, instagram, weitere_links),
  `Zugang` (zugang_id, gruppe_id, pin_salt, pin_hash, aktiv, gueltig_bis), `Einstellungen` (schluessel, wert),
  `Log` (zeit, gruppe_id, aktion, tabelle, datensatz_id, anzeigename).
- Daten-Tabs (Spalten siehe `Schema.gs`): Personen, Material, Ausleihe, ToDos, Projekte, Meilensteine, Projekt_Material, Finanzen,
  Vorlagen_ToDo, Protokolle, Reden, TOPs, Kommentare, Learnings, Umfragen, Umfrage_Antworten, Mitteilungen, Ideen,
  Veranstaltungen, Termin_Vorlagen, Mobi_Plan, Gruppen_Rollen, Kapazitaet, Wiki.
- Ungenutzt, bleiben im Sheet: `Posts` (ersetzt durch Mobi_Plan), `Projekt_Team`, Spalte `Projekte.kanaele`. Das Skript räumt
  `Posts` und `Projekt_Team` beim Löschen eines Projekts noch mit auf.
- Höchstlänge für Textfelder 5000 Zeichen, Ausnahmen 20 000 (`MAX_TEXT`, `MAX_TEXT_AUSNAHMEN` in `Schema.gs`).
  `NIE_LOESCHEN`: fertige Protokolle und Reden nur mit `vonHand: true`.

---

## 3. Aktueller Stand und Offen

### 3.1 Stand

- Etappen 0 bis 11 sind fertig und von der Person geprüft (bis 0.33.15, 28.10.2026). Kurzfassung in Abschnitt 8,
  ausführlich für alle Leser in `texte/entwicklung.txt` (Wiki → Entwicklung App).
- Etappe 12 läuft: 12.1 Plan Fassung 2 (0.33.16, #75), 12.2 Plan Fassung 3 und diese eine Doku-Datei (0.34.0),
  12.3 Sicherheitsbericht (nur im Chat), 12.4 Funde behoben (0.34.1), Nachbesserung Fotos (0.34.2),
  12.5 Geschwindigkeitsbericht (nur im Chat) mit dem Editor-Werkzeug `messenSkript` (0.34.3),
  12.6 Geschwindigkeit verbessert (0.34.4 App, 0.34.5 Zwischenspeicher im Skript).
- Skript: Stand aus Etappe 11 (Konto.gs, Signal.gs) ist bereitgestellt. Skripteigenschaften `CLOUD_LINK_g1` und `SIGNAL_LINK` sind gesetzt,
  Zeitauslöser `kontoAbrufen` (Montag früh) läuft.
- Kalender-Abo in Google Kalender klappt. Apple Kalender kann die Person nicht testen; sie meldet sich, falls Probleme auftreten.

### 3.2 Offen

- **Für die Person vor 1.0:** Testdaten im Sheet löschen (in 12.17; `testdatenListe` in `apps-script/Aufraeumen.gs` zeigt sie mit Zeilennummern),
  auch Testeinträge aus der Sicherheitsprüfung 12.3. Datenschutztext von jemandem prüfen lassen, der sich auskennt.
- **Für den Agenten (12.8):** ungenutzte CSS-Regeln `.kal-pfeil`, `.kal-nav`, `.kal-datum`, `.kal-monat-kopf`, `.modal-vollbild`,
  `.dash-rechts-teil`, `.hilfe-abschnitt`, `.hilfe-teil`, `.hilfe-text`; ungenutzte Funktion `topEinfuegen` in `js/views/protokoll-rechnen.js`.
- **Für die Person nach 12.4:** die fünf geänderten Skriptdateien bereitstellen, `testenRechte` ausführen. Danach müssen sich alle Geräte neu anmelden.
  Foto-Ordner im Drive von „Jeder mit Link = Mitarbeiter“ auf „Betrachter“ stellen (Link bleibt gleich), dann `testenFotoSchreiben`.
- **Bewusst offen aus 12.3:** Mit falschen PINs kann jemand, der den Gruppennamen kennt, die Anmeldung immer wieder 15 Minuten sperren
  (Notweg in der Admin-Anleitung). Der Service Worker gilt nur für den App-Ordner; die Hauptseite auf derselben Adresse lädt nur OpenCollective-Daten (nach 1.0 ansehen).
- Der alte Signal-Link steht noch in der Geschichte des Repos (0.33.11). Der aktuelle Link steht nur in der Skripteigenschaft.
- Wenn `formatieren` wieder mit „Ein unbekannter Fehler ist aufgetreten“ abbricht: Pull Request #52 (nicht übernommen) enthält einen fertigen Notweg.

---

## 4. Festlegungen je Bereich

Diese Regeln gelten. Wer etwas daran ändert, ändert es hier mit.

### 4.1 Start (Etappe 5, 11)

- Kopf: „Hallo Name“ mit „+ Umfrage“, „+ Mitteilung“, „Archiv (n)“ und Glocke „Was ist neu?“ (`js/ui/neu-seit.js`, letzter Besuch je Gerät und Gruppe).
  Quellen: Umfragen, Mitteilungen, Veranstaltungen, Kommentare (auch zu Mobi, Reden, Wiki), Projekte mit Meilensteinen und ToDos, ToDos ohne Projekt,
  Mobi-Beiträge, Protokolle und Reden, neue Team-Mitglieder. Eigene Änderungen stehen nicht drin.
- **„Für dich (n)“** ganz oben (`js/views/erinnerungen-rechnen.js`), gelb mit orangem Rand, nur wenn es etwas gibt: laufende Umfrage ohne eigene Stimme,
  selbst mitgenommenes Material eines Projekts, dessen Aktion vorbei ist, fehlende oder abgelaufene Kapazität (✕ blendet 7 Tage aus). Zahl am App-Symbol
  (`navigator.setAppBadge`), nur auf dem Start neu berechnet, beim Abmelden gelöscht.
- Umfragen (`js/views/start-umfragen.js`): Kachel zeigt nur laufende. Beendet wird **nur von Hand** (Spalte `beendet`). Frist sperrt nur in der App.
  Anonym ist Standard. Nach der ersten Stimme sind Antworten und „namentlich“ fest. Eine Stimme je Anzeigename.
- Schwarzes Brett (`js/views/start-brett.js`): Kachel zeigt nur angeheftete Mitteilungen, neue sind angeheftet, übrige im Archiv.
- Pinnwand (Kommentare mit `bezug_art pinnwand`), unter den Kacheln Projekte und ToDos (rechte Spalte ToDos und TOPs).
  „Als Mitteilung anheften“. Kommentare mit Farbe sind angeheftete Veranstaltungen.
- Kacheln: Projekte (ohne Status Planung), ToDos (nur allgemeine, ohne `projekt_id` und `post_id`), TOPs mit „+ Protokoll“.
- Kommentare überall über `baueKommentare` (`js/ui/kommentare.js`), Marke „💬 n“.
- Aktionsideen (`js/views/ideen.js`): Aufklapper im Reiter Projekte, „Als Projekt starten“ öffnet „Neues Projekt“ vorausgefüllt; die Idee bleibt.
- Vorschlagslisten (datalist in `form.js`): höchstens 30 Einträge, je höchstens 40 Zeichen.

### 4.2 Projekte (Etappe 4, 11)

- Status `planung|aktiv|erledigt|archiviert`. Erledigt = Archiv (Filter Archiv). „In Planung“ als Aufklapper unten, nie im Kalender.
- Teile im Block: ToDos (mit Meilensteinen und „Offene Hüte“), Material, Finanzen, Learnings, Reden, Team, Mobi. Sprung per `#/g/<kurz>/projekte/<id>`.
- Abschließen gesperrt, wenn festes Material draußen ist. Warnung bei offenen ToDos und nicht beschafftem Material.
- `projektLoeschen` (Skript) prüft zuerst Material draußen (Code `draussen`), löscht weich alle abhängigen Tabs; Learnings und Protokolle bleiben.
- **Standard-ToDos** beim Anlegen (Anhang A, `js/vorlagen.js` `STANDARD_TODOS`), Fälligkeit vom Aktionsdatum.
  Meilenstein-Vorlagen fest in `js/vorlagen.js` (Genehmigung und Anmeldung, Material und Aufbau, Nachbereitung).
- Finanzen: Geld läuft über OpenCollective, kein Beleg-Upload. **Kontostand** oben im Teil Finanzen nur für Gruppen mit Konto (FFF),
  „Jetzt abrufen“ höchstens einmal pro Stunde ein echter Abruf.
- **Jahresübersicht** (`js/views/uebersicht.js`, `uebersicht-rechnen.js`) im Archiv, Adresse `#/g/<kurz>/projekte/uebersicht`.
- **Drucken** (`js/ui/druck.js`): Packliste im Teil Material, ToDos je Meilenstein. CSS-Block 0.33.6 mit `@media print`.
- Hüte: offenes ToDo ohne Verantwortliche (`js/views/todos-hut.js`).

### 4.3 ToDos (Etappe 3)

- `text` = Titel, `details` = weitere Informationen. Offene oben, „Erledigt, letzte 2 Wochen“, Archiv (erledigt_am, sonst geaendert_am, 14 Tage).
- Überfällig rot, heute orange. Filter: Suche, Verantwortlich, Fälligkeit, Priorität, Nur meine. Abhaken ohne Konfliktprüfung, Bearbeiten mit.
- Sammel-ToDos „📣 Kanalgruppe“ aus Mobi-Beiträgen (berechnet, nicht gespeichert, `js/views/mobi-todo.js`).

### 4.4 Material und Ausleihe (Etappe 2)

- Festes Material: `anzahl` = Bestand, ausgeliehen = mitgenommen − zurueck − defekt. Verbrauchsmaterial: `anzahl` = Vorrat.
  Verfügbar = anzahl − Summe mitgenommen + Summe zurueck.
- `buchen`: `{ art, person, datum, projekt_id, notiz, positionen:[{material_id, anzahl, defekt, projekt_id}] }`, höchstens 100.
  Fehlercodes: ungueltig, zuwenig, nicht_gefunden, beschaeftigt. Ausleihe wird nur angehängt, nur über `buchen`.
- Vormerken: Zeile in Projekt_Material, senkt die Verfügbarkeit nie. „Auch vorgemerkt für …“ nennt nur aktive Projekte.
- Foto-Upload: Browser verkleinert auf 1000 px, Skript prüft JPEG, speichert in `FOTO_ORDNER_<gruppe_id>`.

### 4.5 Kalender und Veranstaltungen (Etappe 6)

- Termine werden berechnet (`js/views/kalender-rechnen.js`): Veranstaltungen, öffentliche Termine anderer Gruppen, Projekt-Aktion, Deadline,
  Projektbalken, Meilensteine, ToDo-Fristen, Mobi-Beiträge. Nichts davon wird gespeichert.
- Ansichten Liste, Monat (Start), Woche, Aktionskalender. Ansicht, Monat, Filter bleiben beim Reiterwechsel.
- Veranstaltung: intern/extern, mehrere Tage, freie Farbe. „Veröffentlichen“ nur bei extern.
- Anheften: eigene externe Veranstaltung = Mitteilung; interne oder fremde = Pinnwand-Kasten in Farbe.
- Termin-Vorlagen: Plenum FFF (Donnerstag 18:30), Plenum GP (Dienstag 19:00), beide KHG, Moltkestraße 9, Landau.
- Öffentlich (`Termine.gs`): nur extern und veröffentlicht, nur kommende, nur aktive Gruppen; keine IDs, Bearbeiter, Zeitstempel.
  Zwischenspeicher `termine_alle` (2 Minuten). Kalender-Abo (webcal, Google, Apple) mit Gruppenfilter.
  Aktionskalender und `#/termine` mit Auswahl und Sortierung **nach Veranstalter** (ohne Eintrag: die Gruppe), Gruppenwahl nur fürs Abo.
- Gruppenwahl: Seitenleiste „Öffentliche Termine“ (die nächsten 8, nach Datum).

### 4.6 Mobi (Etappe 7)

- Tab `Mobi_Plan`, Bezug Projekt oder Veranstaltung (`Mobi.gs`, `mobiKaskade`). Kanäle fest in `js/kanaele.js` (Farben, Zeichengrenzen, Gruppen
  social, digital, print, extern, sonstiges). Status-Reihenfolgen `SCHRITTE_STANDARD` und `SCHRITTE_VIDEO` (Instagram, TikTok).
- Reiter Mobi: Liste (Kacheln), Kanban (eine Reihe, Seitenknöpfe), Kalender, Zeitstrahl (ohne Status „Idee“). Im Projekt: Balken statt Zeitstrahl.
- „+ Beiträge planen“: Standard-Beiträge je Kanal (Anhang B, `STANDARD_BEITRAEGE`), Bezugsdatum = Aktionsdatum, nichts doppelt.
- Warnungen: „Projekt ohne Mobi“ (Aktion in 21 Tagen), „Beiträge ohne Datum“. Kein Drag-and-Drop.

### 4.7 Dokumentation: Protokolle, Reden, Learnings (Etappe 8)

- Reiter „Dokumentation“, Kennung `protokoll`. Protokoll-Formular im Inhalt, Entwurf im Gerät und gemeinsamer Entwurf im Sheet (`entwurf`).
- Modus je Gruppe aus `protokollInfo`: Dokument (`PROTOKOLL_DOK_<gruppe_id>`), extern (`PROTOKOLL_LINK_<gruppe_id>`, nur https) oder keins.
  Einfügen im Google-Dokument unter `[[NEUE PROTOKOLLE HIER]]`. Die App liest und ändert das Dokument sonst nie.
- Markierungen im Text (☐ ToDo, 💡 Learning, 📅 Termin, 📌 Mitteilung, 📊 Umfrage, 👉 Beschluss, auch als Wort mit Doppelpunkt) legen Einträge an
  oder kommen als Vorschläge nach dem Speichern. Angelegte Einträge stehen in `Protokolle.angelegt`.
- TOP-Sammlung (Tab `TOPs`), Plenum-Gliederung, „Nächstes Plenum“ aus der Termin-Vorlage.
- Reden: Archiv mit Status (Entwurf, Probelesen, Fertig, Gehalten), Redetext in der App mit Kommentaren je Absatz (`stelle`).
- Protokolle und Reden werden nur von Hand gelöscht (`vonHand: true`). Gemeinsame Entwürfe lassen sich verwerfen.

### 4.8 Team (Etappe 9)

- Hüte = Aufgaben mit Verantwortlichen oder offen („Hut frei“). Dauerhafte Zuständigkeiten = „Gruppen-Rollen“.
- Personen (`rollen`, `notiz`, `aktiv` = dabei/Pause), Gruppen_Rollen (`gewaehlt` = höchstens eine Person), Kapazitaet 1 bis 10, höchstens 183 Tage gültig.
- `Team.gs`: `teamPruefen`, `teamKaskade`, `teamUmbenennen` (neuer Name auch in ToDos, Meilensteinen, Mobi_Plan, Umfrage_Antworten).
- Diagramm „Berg“ (Kraft der Gruppe) mit „Fällige Hüte je Woche“. Angaben sind für die ganze Gruppe sichtbar, Zuordnung über den Anzeigenamen.
- Team ist freiwillig. Jede Person pflegt Kapazität, Name und Notiz ihrer eigenen Karte; Rollen dürfen alle zuweisen.

### 4.9 Wiki und öffentliche Seiten (Etappe 10)

- Reiter Wiki mit drei Knöpfen: Skillshare (Seiten aus dem Tab `Wiki`, feste Themen in `js/views/wiki-rechnen.js`), Anleitung (feste Seiten aus
  `texte/anleitung/`, Liste in `liste.txt`, dazu „Von unserer Gruppe“), Entwicklung App (`texte/entwicklung.txt` und „Zuständig für die App“).
- Textformat (`js/wiki-format.js`): `##`, `###`, Listen, `**fett**`, Links, `[[Titel]]`, `> Hinweis`, `![Beschreibung](bild:<id>)`, Backticks.
  Bilder ab 600 px höchstens halb so breit, anklickbar.
- Öffentliches Wiki `#/wiki` ohne Namen und Kommentare. Entwicklung App und „Erste Schritte“ sind immer öffentlich.
  Zwischenspeicher im Skript 2 Minuten.
- `[Signal]` in einem festen Text wird zum Knopf „💬 Auf Signal schreiben“ mit Rechenaufgabe (`js/ui/signal.js`, Aktion `signal`).
  Nur in festen Texten, nie in Wiki-Seiten aus dem Sheet.
- Info zeigt die Gruppen mit Webseite und Instagram (Symbole) aus dem Tab Gruppen und die Version.

### 4.10 Komfort (Etappe 11)

- Reiter **Cloud** (`js/views/cloud.js`): Knopf „Cloud öffnen →“ (neuer Tab), nur mit `CLOUD_LINK_<gruppe_id>`.
- **Kontostand:** `Konto.gs`, Abruf bei `https://api.opencollective.com/graphql/v2` (nur Kontostand und Währung), Zeitauslöser montags.
  Werte in Skripteigenschaften, nicht im Sheet.
- **Dunkelmodus** je Gerät (Schlüssel `aktionsdeck_darstellung` = hell | dunkel, ohne Eintrag „wie das Gerät“). Klasse `dunkel` am `<html>`,
  gesetzt von `js/darstellung-start.js` (normales Skript im `<head>`, kein Modul). Dunkle Werte in den CSS-Blöcken 0.33.8 und 0.33.9.
  Gedruckt wird hell. Gruppen- und Terminfarben bleiben.
- Gestrichen in Etappe 11: Mein Bereich, Push, E-Mail, Sicherungskopien, Downloads.

---

## 5. Technik-Merkzettel

- **Hilfsmodule, die du vor dem Neubauen suchst und wiederverwendest:** `js/ui/dom.js` (`el`, `leeren`), `js/ui/fenster.js` (`zeigeFenster`),
  `js/ui/form.js` (`baueFormular`; Feldtypen text, zahl, datum, zeit, farbe, langtext, auswahl, bool, foto; Vorschlag darf `{ wert, label }` sein),
  `js/ui/table.js` (`zeigeListe`), `js/ui/toast.js`, `js/ui/kommentare.js` (`baueKommentare`), `js/views/todos-rechnen.js`,
  `js/views/kalender-rechnen.js`, `js/views/mobi-rechnen.js`, `js/wiki-format.js` (`zeichneText`), `js/views/wiki-rechnen.js`,
  `js/gruppeninfo.js` (Kontostand und Cloud-Link), `js/views/erinnerungen-rechnen.js`, `js/views/uebersicht-rechnen.js`,
  `js/ui/druck.js` (`drucke`), `js/ui/darstellung.js` (`istDunkel`), `js/views/team-namen.js` (Namen mit Rollen für andere Reiter).
  Lies die Datei, bevor du sie benutzt. Rate keine Signaturen.
- **Ein Syntaxfehler** in einer Datei lässt den Reiter auf „Dieser Reiter ist noch in Arbeit“ zurückfallen (`app.js` lädt jeden Reiter als Modul).
  Dann zuerst die zuletzt geänderten Dateien auf fehlende oder doppelte Klammern prüfen, vor allem `});` und `}, s.token);`.
- **Skript:** In `Util.gs` gibt es `aus()`: in neuen Skriptdateien keine Variable so nennen. Vorsilben: `Termine.gs` t/ics, `Team.gs` team,
  `Wiki.gs` wiki (benutzt `tLink`, `tInstagram`, `tLinks`, `tFarbe` aus `Termine.gs`). Keine `appsscript.json` im Repo.
- **Skripteigenschaften** (nur im Editor): `TOKEN_GEHEIMNIS`, `FOTO_ORDNER_g1/g2/g3`, `PROTOKOLL_DOK_g1`, `PROTOKOLL_DOK_g2`,
  freiwillig `PROTOKOLL_LINK_<gruppe_id>`, `OC_KONTO_<gruppe_id>`, `KONTO_STAND_<gruppe_id>` (nur vom Skript), `CLOUD_LINK_<gruppe_id>`, `SIGNAL_LINK`.
- **Editor-Funktionen:** `formatieren`, `formatierenWiki` (Schema.gs); `aufraeumenTesten`, `aufraeumen` (löscht `geloescht=TRUE` älter als 90 Tage,
  Log älter als 180 Tage, alte Kapazitäten), `testzeilenAnzeigen`, `testdatenListe` (Aufraeumen.gs); `setupGeheimnis`, `setupPins` (Setup.gs);
  Tests `testenTermine`, `testenTermineSicher`, `testenProtokollDok`, `testenProtokollAnhaengen`, `testenTeam`, `testenWiki`, `testenWikiSicher`,
  `testenFotoOrdner`, `testenFotoSchreiben`, `testenRechte` (Auth.gs, Rechte je Gruppe und Token), `messenSkript` (Werkzeuge.gs, misst Laufzeiten, schreibt nichts), `kontoTesten`, `kontoAbrufen`, `kontoAusloeserEinrichten`.
- **Zwischenspeicher (IndexedDB)** `ladeMitCache(key, ladeFn, anzeigen, zuerstCache)`, Schlüssel `<gruppe_id>:<name>`: todos, projekteliste, startextra,
  startmobi, startfuerdich, projekte, kalender, protokoll, reden, team, wiki, gruppeinfo, uebersicht. Öffentlich: `oeffentlich:termine`,
  `oeffentlich:wiki`, `oeffentlich:wiki:<gruppe>:<adresse>`. Ältere Zwischenspeicher können neue Felder noch nicht enthalten: in `zeigen()` Fehlendes ergänzen.
- **Im Gerät (localStorage, `js/store.js`):** `aktionsdeck_session`, `aktionsdeck_name`, `aktionsdeck_gruppen`, `aktionsdeck_besuch_…` (Was ist neu?), `aktionsdeck_name_vorher`, `aktionsdeck_teamhinweis_<gruppe_id>`,
  `aktionsdeck_darstellung`, Entwürfe `aktionsdeck_entwurf_protokoll_<gruppe_id>`, `…_rede_<gruppe_id>`, `…_wiki_<gruppe_id>`.
  Abmelden löscht Sitzung und Zwischenspeicher, eine Anmeldung bei einer anderen Gruppe löscht den Zwischenspeicher auch; der Knopf „Abmelden“ löscht außerdem die Entwürfe (vorher Warnung). Die Darstellung bleibt.
- **Service Worker** (`sw.js`): App-Dateien zuerst aus dem Netz, sonst Zwischenspeicher (`aktionsdeck-<VERSION>`). Daten nicht im Service Worker.
  Nur Dateien im App-Ordner, gespeichert ohne `?…`; offline gibt es `index.html` nur für Seitenaufrufe.
  **Seit 0.34.4 zuerst Zwischenspeicher:** Eine neue Version (neue `VERSION`) lädt beim Installieren alles frisch (`cache: 'reload'`)
  und wartet. Die App zeigt „Neue Version da“ (`neueVersionZeigen` in `js/app.js`); der Knopf schickt `weiter`, dann `skipWaiting` und Neuladen.
  Darum: **Jede geänderte Datei braucht eine neue VERSION**, sonst bekommen Geräte sie nicht. Neue Dateien gehören in `HUELLE`.
  Der Service Worker wird erst nach dem Laden der Seite angemeldet.
- **Reiter Start:** holt seine Daten in einer Anfrage (`paketHolen` in `js/views/start.js`, 10 Tabs; `listMehrere` erlaubt höchstens 12).
  Fehlt ein Tab, laden die Teile einzeln (`ausPaket`). Team (`ladeTeamKlein`) und „Was ist neu?“ bleiben eigene Anfragen.
- **Gruppenlogos:** bekannte Logos stehen in `LOGOS` in `js/ui/logo.js`. Neues Logo in `icons/gruppen/` → dort eintragen.
- **Zwischenspeicher im Skript (0.34.5):** Ein Tab lesen kostet bei Google 0,2 bis 0,35 s (gemessen mit `messenSkript`).
  `liesGemerkt(name)` (Util.gs) merkt Tabs 2 Minuten in `CacheService` (nur bis 45 000 Zeichen je Tab), Schlüssel mit „Stand“.
  `merkenVergessen()` setzt einen neuen Stand: in `mitSperre`, in `verteile` nach jeder Aktion außer `NUR_LESEN` (Code.gs) und nach `setupPins`.
  Benutzt in `tokenPruefen`, `zugangFinden`, `gruppeSuchen`, `aktionGruppen`, `listeFuerGruppe`, `bootstrap`.
  **Regel:** Wer schreibt, liest mit `lies()` (Zeilennummern), nie mit `liesGemerkt`. Neue Aktion, die nur liest? In `NUR_LESEN` eintragen.
  Änderungen direkt im Sheet zeigt die App nach höchstens 2 Minuten.
- Version 0.32.13 wurde übersprungen (war kurz auf `main`).

### 5.1 Gruppen und Farben

- g1/fff, g2/gp, g3/kb. Logos `icons/gruppen/<kurzname>.svg` (Ersatz .png, dann `icons/logo.svg`). Im Dunkeln auf heller runder Fläche.
- AktionsDeck Dunkelgrau `#1a1e20`, Dunkelgrün `#368469`. FFF `#1b7340`; GP `#70bd1c`; KB `#165834` (außerdem `#2fa142`, `#0894ad`).
  Hintergrund hell `#dfe8e4`, dunkel `#343a38`. Variablen `--gruppe`, `--gruppe-text`, `--gruen`, `--gruen-hell`, `--hintergrund`, `--link`.
- `theme-color` hell `#368469`, dunkel `#0b0f0e`.

---

## 6. Dateiübersicht

- Hauptordner: `index.html`, `manifest.webmanifest`, `sw.js`, `README.md`, `LICENSE`, `CLAUDE.md` (zeigt nur hierher).
- `docs/`: `STAND.md` (diese Datei), bis zum Ende von Etappe 12 `PLAN-ETAPPE-12.md`.
- `icons/`: `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `logo.svg`, `gruppen/`.
- `css/`: `base.css` (alle Farb-Variablen), `layout.css` (Gerüst), `components.css` (alle übrigen Regeln, Blöcke je Version).
- `apps-script/`: Code.gs, Auth.gs, Daten.gs, Schema.gs, Util.gs, Ausleihe.gs, Upload.gs, Aufraeumen.gs, Termine.gs, Mobi.gs, Protokoll.gs,
  Team.gs, Wiki.gs, Konto.gs, Signal.gs, Setup.gs, Werkzeuge.gs (nur Editor-Werkzeuge, keine Bereitstellung nötig).
- `js/`: app, config, api, store, cache, schema, vorlagen, kanaele, wiki-format, gruppeninfo, darstellung-start (normales Skript).
- `js/ui/`: dom, toast, modal, nav, table, detail, form, logo, kopf, bild, lightbox, fenster, balken, kommentare, neu-seit, druck, darstellung, signal.
- `js/views/`: gruppen, login, start, start-umfragen, start-brett, mehr, info, platzhalter, ideen,
  material, material-detail, material-rechnen, material-buchen, material-vormerken,
  todos, todos-rechnen, todos-abhaken, todos-hut,
  projekte, projekt-rechnen, projekt-todos, projekt-material, projekt-finanzen, projekt-learnings, projekt-reden, projekt-team, uebersicht, uebersicht-rechnen,
  kalender, kalender-rechnen, kalender-vorlagen, termine, termine-liste,
  mobi, mobi-plan, mobi-eintrag, mobi-rechnen, mobi-kachel, mobi-sammlung, mobi-todo, mobi-zeitstrahl,
  protokoll, protokoll-rechnen, protokoll-eintrag, protokoll-marken, protokoll-vorschlaege, tops, reden, rede-eintrag, rede-text,
  team, team-rechnen, team-rollen, team-eintrag, team-berg, team-namen,
  wiki, wiki-rechnen, wiki-eintrag, wiki-oeffentlich, cloud, erinnerungen-rechnen.
- `texte/`: impressum, info, datenschutz, entwicklung; `anleitung/` mit liste, erste-schritte (öffentlich), start, projekte, todos, material, mobi,
  kalender, dokumentation, team, wiki, cloud, fragen, zustaendig, admin, neue-gruppe (öffentlich). Format wie im Wiki, auf GitHub direkt änderbar.
- `.github/workflows/jekyll-gh-pages.yml`: checkout v7, configure-pages v6, jekyll-build-pages v1, upload-pages-artifact v5, deploy-pages v5.

---

## 7. Pläne

- **Etappe 12 „Prüfung und Qualität“** (jetzt): Schritte und Entscheidungen in `docs/PLAN-ETAPPE-12.md` (Fassung 3).
  Reihenfolge: 12.3 Sicherheit prüfen → 12.4 beheben → 12.5 Geschwindigkeit prüfen → 12.6 verbessern → 12.7 Ungenutztes prüfen → 12.8 löschen →
  12.9 Layout am PC → 12.10 Barrierefreiheit prüfen (mit Test am Bildschirmleser) → 12.11 verbessern → 12.12 App-Icon und Ladebildschirm →
  12.13 Fehlerseite → 12.14 Tabs sortieren → 12.15 CSS prüfen → 12.16 CSS ordnen → 12.17 Abschluss, **Version 1.0.0**.
  Berichte kommen nur in die Projektdateien im Chat (`pruefung/`), nicht ins Repo.
- **Nach 1.0:** offen. Ideen sammelt die Person; jede neue Etappe beginnt mit einem Plan mit Rückfragen.

---

## 8. Geschichte (kurz)

Ausführlich für alle: `texte/entwicklung.txt`. Einzelheiten je Schritt: Pull Requests auf GitHub und die Geschichte dieser Datei.

- **Etappe 0 bis 3** (bis 0.17.x): Fundament, Material und Ausleihe, Zwischenplan Z1 bis Z8, ToDos.
- **Etappe 4** (0.18.0 bis 0.25.x): Projekte mit ToDos, Meilensteinen, Hüten, Material, Finanzen, Learnings, Abschluss.
- **Etappe 5** (0.26.0 bis 0.26.3): Start als Zentrale: Umfragen, Schwarzes Brett, Pinnwand, Kommentare, Aktionsideen.
- **Etappe 6** (0.27.0 bis 0.28.13): Veranstaltungen und Kalender, öffentliche Termine, Aktionskalender.
- **Etappe 7** (0.29.0 bis 0.29.12): Mobi mit Kanälen, Kanban, Zeitstrahl, Standard-Beiträgen und Standard-ToDos. Pull Requests ab 7.5.
- **Etappe 8** (0.29.12 bis 0.30.14): Dokumentation mit Protokollen (Google-Dokument, Markierungen, Vorschläge), Reden, Learnings.
- **Etappe 9** (0.30.15 bis 0.31.9): Team mit Gruppen-Rollen, Hüten, Kapazität und Berg. Pull Requests #26 bis #36.
- **Etappe 10** (0.31.10 bis 0.32.16): Wiki, Anleitung, öffentliches Wiki, Impressum, Info, Datenschutz, Kalender-Abo. Pull Requests #37 bis #59.
- **Etappe 11** (0.32.10 bis 0.33.15): Komfort: Kontostand, Cloud, „Für dich“, Jahresübersicht, Drucken, Dunkelmodus, Signal-Knopf,
  Termine nach Veranstalter, GitHub Actions. Pull Requests #48 und #60 bis #74.
- **Etappe 12** (ab 0.33.16):
  - 12.1 (0.33.16, #75): Plan Fassung 2 mit den Wünschen der Person.
  - 12.2 (0.34.0): Plan Fassung 3. Eine Doku-Datei: `docs/STAND.md` enthält jetzt Regeln, Stand, Festlegungen und Pläne; `CLAUDE.md` zeigt nur hierher.
    Gelöscht: Pläne 7 bis 11, `STANDARD-TODOS.md` und `MOBI-STANDARD-BEITRAEGE.md` (jetzt Anhang A und B), vier Bildschirmfotos im Hauptordner.
    `[Kontakt]` in `texte/anleitung/zustaendig.txt` entfernt (Signal-Knopf reicht).
  - 12.3: Sicherheitsbericht (nur im Chat): keine schwere Lücke, zwei Funde im Skript, Hinweise zu Service Worker und App.
  - 12.4 (0.34.1): Schutz vor Formeln beim Block-Schreiben, Anzeigename bereinigt, neuer PIN meldet alte Geräte ab, Zahlen strenger,
    Kalender-Datei mit `\r`, Content-Security-Policy, Service Worker nur im App-Ordner, Gruppenwechsel leert den Zwischenspeicher, Editor-Test `testenRechte`.
  - 0.34.2: Nachbesserung: Content-Security-Policy erlaubt Bilder von allen `https:`-Adressen (Fotos wurden blockiert).
  - 12.5 (0.34.3): Geschwindigkeitsbericht (nur im Chat); neues Editor-Werkzeug `messenSkript` in `Werkzeuge.gs`.
  - 12.6 (0.34.4): Service Worker zuerst Zwischenspeicher mit Hinweis „Neue Version da“, Start mit 5 statt 12 Anfragen
    (beim Neuladen 2 statt 9), Kalender lädt gleichzeitig, Logo ohne vergebliche Anfrage, Service Worker nach dem Laden.
  - 12.6b (0.34.5): Zwischenspeicher im Skript (`liesGemerkt`, 2 Minuten): Anmeldung und Listen ohne erneutes Lesen des Sheets.

---

## Anhang A: Standard-ToDos beim Anlegen eines Projekts

Zum Nachlesen. Die App liest die Werte aus `js/vorlagen.js` (Liste `STANDARD_TODOS`). Wer dort etwas ändert, ändert es auch hier.

- Reiter Projekte → „+ Neu“ (oder „Als Projekt starten“ bei einer Aktionsidee). Unter den Feldern steht die Liste, alle mit Haken. Haken weg = wird nicht angelegt.
- Die Fälligkeit wird vom **Aktionsdatum** zurückgerechnet („Tage vorher“). Ändert man das Aktionsdatum im Formular, rechnen sich die Daten neu,
  außer den selbst geänderten. Ohne Aktionsdatum kein Fälligkeitsdatum.
- Die ToDos gehören zum Projekt, aber zu keinem Meilenstein („Ohne Meilenstein“).
- **Alle Tage sind Annahmen (Platzhalter).**

| ToDo | Tage vorher |
|---|---|
| Bühne? | 21 |
| Band? | 21 |
| Uploadplan erstellen | 14 |
| Band anfragen | 14 |
| Anfrage Bollerwagen Foodsharing | 14 |
| Presseverteiler prüfen | 8 |
| Reden festlegen | 7 |
| Awareness-Team festlegen | 5 |
| Person für Fotos festlegen | 3 |

Meilenstein-Vorlagen: „Genehmigung und Anmeldung“ (darin „Versammlungsleitung festlegen“ an zweiter Stelle, 21 Tage vorher, wie „Versammlung bei
der Stadt anmelden“), „Material und Aufbau“, „Nachbereitung“. Die Vorlagen „Mobi“ und „Pressearbeit“ gibt es nicht mehr; ihre Aufgaben stecken in den
Standard-Beiträgen (Anhang B) und den Standard-ToDos. Ein ToDo legt keinen Beitrag von selbst an.

Ändern: eine Zeile in `js/vorlagen.js` unter `STANDARD_TODOS`, zum Beispiel `{ text: 'Band anfragen', tage_vorher: 14 }` → `tage_vorher: 21`.
Danach Version hochzählen und diesen Anhang anpassen.

## Anhang B: Mobi-Standard-Beiträge

Zum Nachlesen. Die App liest die Werte aus `js/kanaele.js` (Liste `STANDARD_BEITRAEGE`). Wer dort etwas ändert, ändert es auch hier.

- Im Projekt (Teil „Mobi“) oder im Reiter Mobi (mit gewähltem Projekt oder gewählter Veranstaltung): „+ Beiträge planen“. Einzelne Beiträge mit „+ Einzelner Beitrag“.
- **Bezugsdatum** ist das Aktionsdatum (bei einer Veranstaltung ihr Datum). **Tage vorher**: 0 = am Tag, negativ = danach.
  Ohne Bezugsdatum kein Datum (in der Vorschau eintragbar). In der Vorschau lässt sich jeder Beitrag abwählen und ändern.
- Gleicher Titel auf gleichem Kanal im Projekt wird nicht noch einmal angelegt („Gibt es schon“). Neue Beiträge starten mit Status „Idee“.
- Danke- und Rückblick-Beiträge (Titel enthält „Danke“ oder „Rückblick“) liegen absichtlich nach der Aktion und sind im Kalender nicht pink.
- **Alle Tage sind Annahmen (Platzhalter).** Die Instagram-Liste hat die Person genannt, die Tage und alle anderen Kanäle sind Vorschläge.

**Instagram (Social Media)**

| Beitrag | Format | Tage vorher |
|---|---|---|
| Heute Demo | Beitrag | 0 |
| Packliste | Beitrag | 1 |
| Awarenesskonzept | Beitrag | 5 |
| Demosprüche | Beitrag | 4 |
| Reel 1 / 2 / 3 | Reel | 10 / 7 / 3 |
| Thema-Post 1 bis 6 | Beitrag | 7, 6, 5, 4, 3, 2 |
| Story 1 / 2 / 3 (am Tag) | Story | 3 / 1 / 0 |
| Danke-Post | Beitrag | -1 (danach) |

**Weitere Kanäle**

| Kanal (Gruppe) | Beitrag | Format | Tage vorher |
|---|---|---|---|
| Facebook (Social Media) | Veranstaltung / Erinnerung | Beitrag | 10 / 1 |
| TikTok (Social Media) | Video 1 / Video 2 | Video | 7 / 2 |
| Pressemitteilung (Digital) | Pressemitteilung / Pressemitteilung Rückblick | Text | 7 / -1 |
| Webseite (Digital) | Ankündigung / Rückblick auf der Webseite | Text | 10 / -3 |
| Newsletter (Digital) | Newsletter | Text | 5 |
| WhatsApp und Telegram (Digital) | Ankündigung / Erinnerung | Text | 7 / 1 |
| Unimail (Digital) | Unimail | Text | 5 |
| Radio (Digital) | O-Ton Radio | Sonstiges | 3 |
| Mail an Fördermitglieder (Hamburg) (Digital, nur gp) | Mail an Fördermitglieder | Text | 5 |
| Plakate und Flyer (Print) | Plakate und Flyer | Sonstiges | 14 |
| Kreideaktion (Print) | Kreideaktion | Sonstiges | 1 |
| Werbung über andere Gruppen (Extern) | Anfrage an andere Gruppen | Text | 10 |
| Schuldelis (Extern) | Schuldelis informieren | Text | 7 |
| Sonstiges | eigener Titel, Datum selbst eintragen | Sonstiges | – |

Ändern: eine Zeile in `js/kanaele.js` unter `STANDARD_BEITRAEGE`, zum Beispiel `{ name: 'Packliste', format: 'beitrag', tage_vorher: 1 }` → `tage_vorher: 2`.
Danach Version hochzählen und diesen Anhang anpassen.
