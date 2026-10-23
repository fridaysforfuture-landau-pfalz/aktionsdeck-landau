# Plan Etappe 10: Wiki und öffentliche Seiten (Fassung 1, 23.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: Fassung 1 mit Rückfragen (Schritt 10.0, Version 0.31.10).** Die Person beantwortet die Rückfragen in Abschnitt 4.
Danach kommt Fassung 2 (zusammen mit Schritt 10.1, wie in Etappe 9). Erst dann wird gebaut.
Alles in den Abschnitten 5 bis 9 ist ein **Vorschlag** und kann sich mit den Antworten ändern.

## 1. Ziel

- **Wiki statt Hilfe:** Ein neuer Reiter **„Wiki“** ersetzt den Reiter „Hilfe“. Er hat zwei Bereiche:
  - **Anleitung:** So funktioniert die App. Für alle Gruppen gleich. Die Texte kommen mit der App (der Agent pflegt sie mit jeder Etappe).
    Die bisherige Hilfe zum Team (`js/views/hilfe.js`, Abschnitt „Team“) wird die erste Anleitungsseite.
  - **Skillshare:** Wissen der Gruppe, zum Beispiel „Demo anmelden“, „Pressemitteilung schreiben“, „Banner malen“.
    Alle in der Gruppe schreiben und ändern die Seiten in der App. Gespeichert im neuen Sheet-Tab `Wiki`.
- **Öffentlicher Bereich:** Eine Skillshare-Seite kann die Gruppe **öffentlich** machen. Dann ist sie ohne Login lesbar (Seite `#/wiki`).
  Die Auslieferung läuft wie bei den Terminen über eine eigene Aktion ohne Login, die nur erlaubte Felder herausgibt.
- **Rechtliches und Info:** Die öffentlichen Seiten **Impressum, Info, Datenschutz** (`#/info/<seite>`) bekommen echte Texte.
  Der Datenschutztext bekommt einen Absatz zum Reiter Team.
- **Kalender-Abo:** Das Abo der öffentlichen Termine (Skript-Adresse) wird in Google Kalender und Apple Kalender getestet.
  Klappt es nicht, gibt es einen Ausweg (Abschnitt 4, Frage 30).
- Die Seite `#/termine` gibt es schon. Sie bleibt, wie sie ist, und wird nur verlinkt.

## 2. Ausgangslage (im Repo geprüft am 23.10.2026, Version 0.31.9)

`js/config.js` und `sw.js` haben beide `0.31.9`, wie `docs/STAND.md`. Mit 10.0 wird es 0.31.10.

**Wichtiger Fund (Widerspruch zum Stand):** `docs/STAND.md` spricht von „Texten aus 6.1“ für Impressum, Info und Datenschutz.
**Diese Texte gibt es im Repo nicht.** `js/views/info.js` zeigt nur den Platzhalter „Dieser Text kommt in Schritt 6.1.“
Auch in `docs/` und in der Git-Geschichte gibt es keinen Text dazu. Die Texte müssen in Etappe 10 neu geschrieben werden (Fragen 19 bis 22).

Was es schon gibt und wiederverwendet wird:

- **`js/views/info.js`** (`#/info/<seite>`, ohne Login): Menü aus `OEFFENTLICH` (`js/ui/nav.js`: impressum, info, datenschutz), Karte mit Überschrift,
  „← Zurück zur App“ bzw. „← Zur Gruppenwahl“. Bei „Info“ steht die Version. **Wiederverwendung:** Aufbau bleibt, nur der Text kommt dazu.
- **`js/views/hilfe.js`** (Reiter „Hilfe“): fester Text als Liste `TEAM_HILFE` mit `[Überschrift, Absätze]`. Ein Absatz mit „- “ wird ein Listenpunkt
  (Funktion `teil`, Aufklapper `details`). Darüber der Satz „Hier kommen später Hilfe und Skillshare.“ **Wird ins Wiki übernommen** (Anleitung „Team“), danach gelöscht.
- **`js/views/termine.js` und `js/views/termine-liste.js`:** Vorbild für eine öffentliche Seite ohne Login. `ladeOeffentlich` nutzt
  `ladeMitCache('oeffentlich:termine', …, zuerstCache = true)` und ruft `api('termine', {})` **ohne Token**. `abonnierLink(kurz)` baut die Abo-Adresse
  `API_URL + '?aktion=termine&format=ics[&gruppe=…]'`. `sichereUrl` kommt aus `js/views/kalender-rechnen.js`.
- **`apps-script/Termine.gs`:** Vorbild für eine Aktion ohne Login. Nur erlaubte Felder (keine IDs, Bearbeiter, Zeitstempel), nur aktive Gruppen,
  Gruppenfilter nur `[a-z0-9_-]` und höchstens 30 Zeichen, **ein** Zwischenspeicher-Eintrag für alle (2 Minuten, Schutz vor Überlastung),
  Editor-Tests `testenTermine` und `testenTermineSicher`. Weg über POST (`verteile` in `Code.gs`, vor `tokenPruefen`) und GET (`doGet`).
- **`js/ui/nav.js`:** `TABS` (Reiter `hilfe` mit ❓ am Ende), `OEFFENTLICH`, `oeffentlicheLinks()` (kleine Links in der Seitenleiste, in „Mehr“ und auf der Gruppenwahl).
  `js/views/mehr.js` zeigt am Handy `material, kalender, protokoll, team, hilfe`. `js/config.js` hat `features.hilfe = true`.
- **`js/app.js`:** öffentliche Wege `#/info/…` und `#/termine` stehen vor dem Login-Teil. Unbekannte Reiter fallen auf `start` zurück.
  `ctx.unter` (Unterpunkt in der Adresse) gibt es nur für `projekte`, `protokoll`, `team`.
- **Tab `Gruppen`** (System-Tab): `webseite, instagram, weitere_links` sind öffentlich gedacht. Die Aktion `gruppen` (`apps-script/Auth.gs`, `gruppeOeffentlich`)
  gibt aber nur `gruppe_id, name, kurzname, farbe` heraus. Die Links kommen heute nur über `Termine.gs` (`tLink`, `tInstagram`, `tLinks`) in die App.
- **Kommentare** (`js/ui/kommentare.js`, `baueKommentare`): `art` ist frei (`todo`, `pinnwand`, …). Das Skript prüft `bezug_art` nicht. Für Wiki-Seiten geht `art: 'wiki'`.
  „Was ist neu?“ zeigt Kommentare schon (`js/ui/neu-seit.js`, Abschnitt „Kommentare“); eine neue `art` muss dort einen Text bekommen.
- **Formulare** (`js/ui/form.js`, `baueFormular`): Feldtypen `text, zahl, datum, zeit, farbe, langtext, auswahl, bool, foto`, Vorschläge auch als `{ wert, label }`.
  **Keine Vorschau** und kein Zeichenzähler für `langtext`. Für den Wiki-Text braucht es ein eigenes Eingabefeld mit Vorschau (wie beim Redetext, `js/views/rede-text.js`).
- **Entwürfe im Gerät** (`js/store.js`): Muster für Protokoll und Rede (`aktionsdeck_entwurf_…_<gruppe_id>`, Abmelden löscht sie über `loescheAlleEntwuerfe`).
- **„Was ist neu?“** (`js/ui/neu-seit.js`): `listMehrere` mit **11 Tabellen**. Die Grenze im Skript ist **12** (`aktionListMehrere`). Mit `Wiki` ist die Grenze erreicht.
- **Skript allgemein:** Textfelder höchstens 5000 Zeichen (`MAX_TEXT`), Ausnahmen in `MAX_TEXT_AUSNAHMEN`. `NIE_LOESCHEN`, `NUR_ANHAENGEN`, `nurPerBuchen` als Muster für
  gesperrte Tabs. `CacheService` speichert **höchstens 100 KB je Eintrag** (wichtig für das öffentliche Wiki).
- **`js/api.js` schickt den Anzeigenamen immer mit**, auch ohne Token (also auch bei `termine`). `Termine.gs` liest und speichert ihn nicht.
  Die neue öffentliche Aktion darf ihn auch nicht speichern. Das gehört in den Datenschutztext.
- **GitHub Pages** baut mit Jekyll (`.github/workflows/jekyll-gh-pages.yml`). `.txt`-Dateien werden unverändert ausgeliefert. Dateien und Ordner, die mit `_` beginnen, werden weggelassen.
- **Kalender-Abo:** Die Abo-Adresse ist die Skript-Adresse (`…/exec?aktion=termine&format=ics`). Google leitet sie auf eine andere Adresse weiter (`script.googleusercontent.com`).
  Ob Google Kalender und Apple Kalender dieser Weiterleitung folgen, ist **nicht geprüft**. Google Kalender lädt Abos außerdem nur alle paar Stunden neu.

## 3. Entscheidungen

Noch keine. Die Person beantwortet zuerst die Rückfragen in Abschnitt 4. Die Antworten kommen in Fassung 2 hierher (wie in Plan 9, Abschnitt 3).

Fest steht schon (aus `docs/STAND.md` und dem Auftrag):
1. Das Wiki ersetzt den Reiter Hilfe.
2. Bereich nur mit PIN (App-Anleitung, Skillshare) und öffentlicher Bereich.
3. Öffentliche Seiten Impressum, Info, Datenschutz. Datenschutz mit Absatz zum Team: Name, Gruppen-Rollen, Kapazität mit Datum, kurze Notiz;
   nur für die eigene Gruppe sichtbar; Austragen löscht; alte Kapazitäten werden 6 Monate nach ihrem Ende gelöscht.
4. Die Hilfe zum Team kommt ins Wiki.
5. Kalender-Abo testen, notfalls feste ICS-Datei auf GitHub Pages.
6. Neuer Sheet-Tab `Wiki`.

## 4. Rückfragen (Fassung 1)

Jede Frage hat einen Vorschlag. Antworte gern nur mit „wie Vorschlag“ oder mit der Nummer und deiner Änderung.

### Aufbau des Wikis

1. **Name und Zeichen des Reiters:** „Wiki“ mit 📖, Kennung `wiki`?
   *Vorschlag:* Ja. Der Reiter steht an der Stelle von „Hilfe“ (am PC unten in der Seitenleiste, am Handy unter „Mehr“).
   Alte Adressen `#/g/<kurz>/hilfe` führen automatisch zum Wiki.
2. **Bereiche:** Reichen „Anleitung“ (App) und „Skillshare“ (Gruppe)? Oder braucht es einen dritten Bereich, zum Beispiel „Gruppe intern“ (Abläufe, wer hat welchen Schlüssel, wo liegt was)?
   *Vorschlag:* Zwei Bereiche. „Gruppe intern“ wird eine **Kategorie** im Skillshare. So bleibt das Wiki einfach.
3. **Kategorien im Skillshare:** fest oder frei?
   *Vorschlag:* Frei mit Vorschlägen zum Antippen (wie die Aktionsart): Aktionen, Demo und Anmeldung, Presse, Social Media, Material und Technik, Finanzen, Gruppe und Treffen, Sonstiges.
   Jede Seite hat genau eine Kategorie. Ohne Kategorie steht sie unter „Sonstiges“.
4. **Reihenfolge:** Wie sind die Seiten sortiert?
   *Vorschlag:* Kategorien A–Z („Sonstiges“ immer zuletzt). In der Kategorie zuerst nach der Zahl „Reihenfolge“ (freiwillig, kleine Zahl = weiter oben), dann A–Z.
   Kein Ziehen mit der Maus. Die Anleitung hat eine feste Reihenfolge (wie die Reiter).
5. **Suche:** Wo wird gesucht?
   *Vorschlag:* Ein Suchfeld oben sucht in Titel, Kategorie und Text, in Anleitung und Skillshare zusammen. Groß- und Kleinschreibung egal.
   Treffer zeigen einen kurzen Ausschnitt mit dem Suchwort. Alles läuft im Gerät (die Seiten sind schon geladen).
6. **Startseite des Wikis:** Was sieht man zuerst?
   *Vorschlag:* Oben Suche. Darunter zwei Karten: „Anleitung“ (Liste der Anleitungsseiten) und „Skillshare“ (Kategorien als Aufklapper mit ihren Seiten, „+ Seite“).
   Dazu klein: „Zuletzt geändert“ (die 5 neuesten Skillshare-Seiten).

### Schreiben, Verlauf, gleichzeitiges Arbeiten

7. **Wer darf schreiben?**
   *Vorschlag:* Alle mit dem Gruppen-PIN dürfen Skillshare-Seiten anlegen, ändern und löschen (wie Mitteilungen). Löschen ist weich und fragt nach.
   Die Anleitung ist in der App nur lesbar. Änderungen daran macht der Agent über das Repo (oder die Person auf GitHub, siehe Frage 19).
8. **Verlauf von Änderungen:** Soll man alte Fassungen einer Seite sehen und zurückholen können?
   *Vorschlag:* Ja. Neuer Tab `Wiki_Verlauf`. Bei jeder Änderung des Textes legt das **Skript** die vorige Fassung dort ab (Titel, Text, wer, wann).
   Es bleiben die **letzten 10 Fassungen** je Seite. In der App: „Verlauf (n)“ zeigt die Fassungen mit Datum und Namen, „Ansehen“ und „Diese Fassung wiederherstellen“
   (das ist eine normale Änderung, die alte Fassung kommt wieder in den Verlauf).
   *Andere Möglichkeit:* kein Verlauf, nur das Log (wer wann geändert hat). Dann ist ein überschriebener Text weg.
9. **Gleichzeitiges Bearbeiten:**
   *Vorschlag:* Wie überall mit `bekannt` (`geaendert_am`). Hat jemand anderes inzwischen gespeichert, kommt ein Hinweis mit Name und Uhrzeit.
   Der eigene Text bleibt im Feld, mit den Knöpfen „Text kopieren“ und „Neue Fassung laden“ (die eigene bleibt dann im Gerät als Entwurf).
   Kein Sperren einer Seite. Zusätzlich sichert die App beim Tippen **einen Entwurf im Gerät** (wie beim Protokoll). „Abmelden“ löscht ihn.
10. **Länge einer Seite:**
   *Vorschlag:* Text höchstens 20 000 Zeichen (wie Protokoll und Rede), Titel höchstens 80 Zeichen. Zähler unter dem Feld.

### Textformat (ohne Bibliotheken)

11. **Welche Auszeichnungen?** Die App baut den Text selbst in Absätze, Überschriften und Listen um, ohne Bibliothek und nur mit `textContent`.
   *Vorschlag:* Nur diese Regeln (eine Format-Hilfe steht aufklappbar unter dem Feld):
   - Leerzeile = neuer Absatz.
   - `## Überschrift` und `### Unterüberschrift` (eine `#` ist der Seitentitel und wird nicht gebraucht).
   - `- Punkt` = Liste, `1. Schritt` = nummerierte Liste.
   - `**fett**`.
   - Links: `[Text](https://…)` oder die Adresse einfach hinschreiben. Nur `https://` und `http://` werden zu Links (`sichereUrl`), alles andere bleibt Text.
   - Link auf eine andere Wiki-Seite: `[[Titel der Seite]]`. Gibt es die Seite nicht, steht der Titel grau mit „(fehlt)“.
   - `> Hinweis` = grauer Hinweiskasten.
   Nicht dabei: Tabellen, Farben, HTML, kursiv.
12. **Vorschau beim Schreiben:**
   *Vorschlag:* Am PC Text links und Vorschau rechts nebeneinander. Am Handy Umschalter „Schreiben | Vorschau“.
13. **Bilder:**
   *Vorschlag:* **Keine Bilder** in Etappe 10, nur Links (zum Beispiel auf einen Google-Drive-Ordner oder Canva).
   Grund: Bilder auf öffentlichen Seiten müssten öffentlich im Drive liegen, und Fotos zeigen oft Personen. Idee für später.
14. **Inhaltsverzeichnis:**
   *Vorschlag:* Hat eine Seite mindestens 3 Überschriften, steht oben ein kleines Inhaltsverzeichnis zum Antippen.

### Öffentlich und nur mit PIN

15. **Was ist öffentlich?**
   *Vorschlag:* Jede Skillshare-Seite hat den Haken „Öffentlich (für alle im Internet lesbar)“, Standard aus. Beim Anhaken kommt ein Hinweis:
   „Schreib keine Namen, Telefonnummern, Adressen oder Fotos von Personen in öffentliche Seiten.“ Öffentliche Seiten haben in der Liste die Marke „🌐 öffentlich“.
   Öffentlich sind nur **Titel, Kategorie, Text, Stand (nur das Datum) und die Gruppe**. Nie öffentlich: wer geschrieben hat, Verlauf, Kommentare, IDs.
   Die Anleitung ist **nicht** öffentlich (sie erklärt nur die App für Angemeldete). Wenn du das anders möchtest: Frage 15a.
   - 15a. Soll die Anleitung auch öffentlich lesbar sein (zum Beispiel für neue Leute vor dem ersten Login)? *Vorschlag:* Nein, nur „Erste Schritte“ (eine Seite) öffentlich.
16. **Je Gruppe oder gemeinsam für alle Gruppen?**
   *Vorschlag:* Skillshare-Seiten gehören **einer Gruppe**. Andere Gruppen sehen sie nur, wenn sie öffentlich sind.
   Seiten „nur für angemeldete Gruppen, aber nicht öffentlich“ gibt es nicht: Jedes Token sieht nur seine Gruppe, und das soll so bleiben.
   Wer Wissen mit den anderen Gruppen teilen will, macht die Seite öffentlich. Im Wiki gibt es dazu den Aufklapper „Öffentliche Seiten anderer Gruppen“ (aus der öffentlichen Aktion).
17. **Öffentliche Adresse:** Wie sieht der Link aus?
   *Vorschlag:* Übersicht `#/wiki` (alle öffentlichen Seiten, nach Gruppe und Kategorie, Gruppen-Auswahl wie bei den Terminen),
   eine Seite `#/wiki/<gruppe>/<adresse>`, zum Beispiel `#/wiki/fff/demo-anmelden`.
   Die `adresse` macht die App beim Anlegen aus dem Titel (klein, ohne Umlaute, Bindestriche). Sie **bleibt**, wenn der Titel sich ändert (damit geteilte Links gültig bleiben),
   und ist im Formular unter „Mehr“ änderbar. Das Skript prüft: nur `a-z0-9-`, höchstens 60 Zeichen, in der Gruppe nur einmal.
   Knopf „Link kopieren“ bei öffentlichen Seiten.
18. **Wo wird das öffentliche Wiki verlinkt?**
   *Vorschlag:* In `oeffentlicheLinks()` (Seitenleiste, „Mehr“, Gruppenwahl) als „Wissen“ neben Impressum, Info, Datenschutz, und auf der Seite „Info“.
   Auf der Gruppenwahl kein eigener Kasten (wie bei den Terminen), damit sie nicht voll wird.

### Impressum, Info, Datenschutz

19. **Wo stehen die festen Texte?**
   *Vorschlag:* Als einfache Textdateien im Repo im selben Format wie das Wiki: `texte/impressum.txt`, `texte/info.txt`, `texte/datenschutz.txt`,
   und die Anleitung in `texte/anleitung/<seite>.txt`. Vorteile: Sie laden auch ohne Netz (in `sw.js` eingetragen), hängen nicht am Skript,
   und du kannst sie auf GitHub direkt ändern (Datei öffnen → Stift → „Commit changes“), ohne JavaScript anzufassen.
   *Andere Möglichkeit:* Texte im Sheet. Nachteil: Ohne Skript kein Impressum.
20. **Impressum: Wer ist verantwortlich?** Ich darf keine Namen oder Adressen erfinden oder abfragen.
   *Vorschlag (eine der beiden):*
   - a) Die App liegt unter `fridaysforfuture-landau.de`. Gibt es dort schon ein Impressum, verlinkt die Seite „Impressum“ darauf, mit einem Satz dazu. Am einfachsten.
   - b) Ich schreibe `texte/impressum.txt` mit Platzhaltern in eckigen Klammern (`[Name]`, `[Anschrift]`, `[E-Mail]`). Du füllst sie auf GitHub selbst aus.
     Solange ein Platzhalter drin ist, zeigt die Seite oben „Dieser Text ist noch nicht fertig.“
   Bitte sag, welche Gruppe oder Person verantwortlich ist (nur als „a“ oder „b“, keine Daten in den Chat).
21. **Datenschutz: Wie entsteht der Text?**
   *Vorschlag:* Ich schreibe einen Entwurf, der genau beschreibt, was die App wirklich tut (keine Rechtsberatung). Die Gruppe sollte ihn prüfen lassen.
   Inhalt: wer verantwortlich ist (wie Impressum); Seite liegt auf GitHub Pages (GitHub sieht die IP-Adresse); Daten im Google Sheet über ein Google-Skript (Google sieht die IP-Adresse);
   keine Cookies, keine Tracker, keine fremden Schriften; im Gerät gespeichert: Anmeldung (14 Tage), Anzeigename, Zwischenspeicher, Entwürfe; Gruppen-PIN statt Konten;
   Anzeigename steht bei Einträgen und im Log (Log 180 Tage); Gelöschtes wird nach 90 Tagen endgültig entfernt; Fotos von Material im Google Drive;
   öffentlich sind nur veröffentlichte Termine und öffentliche Wiki-Seiten; öffentliche Abrufe speichern keinen Namen;
   **Absatz Team** (Name, Gruppen-Rollen, Kapazität mit Datum, kurze Notiz; nur für die Gruppe; Austragen löscht; alte Kapazitäten nach 6 Monaten weg);
   Rechte (Auskunft, Löschen) und Kontakt (wie Impressum).
   Gibt es für FFF oder GP schon eine Datenschutzerklärung, auf die sich der Text stützen soll? Dann sag mir, wo sie steht (Link).
22. **Info-Seite:** Was soll drinstehen?
   *Vorschlag:* Kurz, was AktionsDeck ist und für wen. Die Gruppen mit Webseite, Instagram und weiteren Links (aus dem Tab `Gruppen`).
   Links zu „Öffentliche Termine“ und „Wissen“ (öffentliches Wiki). „Mitmachen? Melde dich bei einer Gruppe.“ Version der App.
   Dafür gibt die neue öffentliche Aktion auch die Links der Gruppen heraus (das sind dieselben Felder, die `Termine.gs` schon zeigt).
   Ein Link auf den Quellcode (GitHub)? *Vorschlag:* ja, klein unten.

### Hilfe, Anleitung, Skillshare

23. **Wie kommt die Hilfe ins Wiki?**
   *Vorschlag:* Der Team-Text aus `js/views/hilfe.js` wird `texte/anleitung/team.txt` (gleicher Inhalt, neues Format). `js/views/hilfe.js` wird danach **gelöscht**
   und aus `sw.js` ausgetragen. Der Link unten im Reiter Team („→ Hilfe“) zeigt auf die Anleitungsseite Team (`#/g/<kurz>/wiki/anleitung:team`).
24. **Umfang der Anleitung:** Welche Seiten?
   *Vorschlag:* „Erste Schritte“ (anmelden, Name, App aufs Handy legen, Was ist neu), dann je Reiter eine Seite: Start, Projekte, ToDos und Hüte, Material, Mobi, Kalender,
   Dokumentation (Protokolle und Reden), Team, Wiki (mit der Format-Hilfe). Kurz und mit Listen. Dazu „Häufige Fragen“ (Konflikt-Hinweis, offline, PIN vergessen).
   Ich schreibe die Texte nach dem Stand im Code. Du prüfst sie und meldest Anmerkungen gesammelt.
   Bei einer neuen Funktion in späteren Etappen ergänzt der Agent die passende Anleitungsseite im selben Pull Request.
25. **Skillshare am Anfang:** leer lassen oder mit Vorlagen?
   *Vorschlag:* Leer. Beim „+ Seite“ gibt es drei **Vorlagen nur mit Überschriften** (keine erfundenen Inhalte): „Schritt für Schritt“ (Worum geht es, Was brauchst du, Schritte, Tipps),
   „Checkliste“, „Erfahrungen“ (Was lief gut, Was nicht, Was beim nächsten Mal).
26. **Kommentare an Wiki-Seiten:**
   *Vorschlag:* Ja, unter jeder Skillshare-Seite mit `baueKommentare` (`art: 'wiki'`), zum Beispiel „Das ist veraltet“. Nur intern, nie öffentlich. Nicht bei der Anleitung.
27. **„Was ist neu?“:**
   *Vorschlag:* Neuer Abschnitt „Wiki“: „📖 Titel · neue Seite“ bzw. „· geändert“ (nur von anderen). Kommentare an Wiki-Seiten unter „Kommentare“ mit dem Seitentitel.
   Damit fragt „Was ist neu?“ 12 Tabellen ab (die Grenze des Skripts). Spätere Quellen brauchen dann eine zweite Anfrage.
28. **Verknüpfungen mit anderen Reitern** (Learnings, Protokoll, Projekte):
   *Vorschlag:* In Etappe 10 nichts davon. Ideen für später: „Learning ins Wiki übernehmen“, Wiki-Link im Projekt. Willst du davon etwas schon jetzt?

### Kalender-Abo

29. **Test des Abos:** Ich kann Google Kalender und Apple Kalender nicht selbst testen.
   *Vorschlag:* In Schritt 10.8 steht eine genaue Test-Anleitung (Google am PC: „Weitere Kalender → Per URL“; iPhone: Einstellungen → Kalender → Accounts → Kalenderabo hinzufügen).
   Die App zeigt dazu zwei neue Knöpfe: „In Google Kalender öffnen“ und „In Apple Kalender öffnen“ (`webcal://`-Adresse). Du testest und meldest das Ergebnis.
30. **Wenn das Abo nicht klappt:** Ausweg feste Datei `termine.ics` auf GitHub Pages.
   *Vorschlag:* Die Datei wird **nicht von Hand** gepflegt. Eine GitHub Action holt sie regelmäßig (zum Beispiel stündlich) von der Skript-Adresse und legt sie beim Bauen der Seite dazu.
   Das ist kein Build der App, ändert aber `.github/workflows/`. Darf ich das im Notfall tun? (Hinweis: GitHub hält geplante Actions in Repos ohne Änderungen nach 60 Tagen an.)

### Handy und PC

31. **Aufteilung am Bildschirm:**
   *Vorschlag:* **PC:** Liste der Seiten im Inhalt, die geöffnete Seite **im Inhalt** (nicht im schmalen Detailbereich rechts), Zeilen höchstens etwa 70 Zeichen breit, damit sich lange Texte gut lesen.
   Oben „← Wiki“ und die Knöpfe „Bearbeiten“, „Verlauf“, „Link kopieren“. Bearbeiten mit Vorschau daneben (Frage 12).
   **Handy:** Liste, Seite als ganze Ansicht mit „← Zurück“, Knöpfe unten in einer Zeile (mindestens 44 px). Adresse `#/g/<kurz>/wiki/<seiten-id>`, damit „Zurück“ im Browser geht.
   Öffentliche Seiten: gleicher Aufbau wie `#/termine` (Balken oben, schmale Spalte).

## 5. Datenmodell (Vorschlag, wird in 10.1 gebaut)

Die Person tippt Tabs **von Hand** ins Sheet (siehe CLAUDE.md Abschnitt 7). `gruppe_id` heißt wirklich so.
Beide neuen Tabs haben vorne die Basis-Spalten `id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht`.

**Neuer Tab `Wiki`:** `titel, adresse, kategorie, text, oeffentlich, sortierung`
- `titel`: Pflicht, höchstens 80 Zeichen.
- `adresse`: `a-z0-9-`, höchstens 60 Zeichen, in der Gruppe nur einmal unter den nicht gelöschten Seiten (das Skript prüft es; Frage 17).
- `kategorie`: freiwillig, höchstens 40 Zeichen (Frage 3).
- `text`: höchstens 20 000 Zeichen (Frage 10), Format aus Frage 11.
- `oeffentlich`: TRUE = ohne Login lesbar (Frage 15). Schon in `BOOL_SPALTEN`.
- `sortierung`: Zahl, freiwillig (Frage 4). Schon in `ZAHL_SPALTEN`.

**Neuer Tab `Wiki_Verlauf`** (nur bei Frage 8 = ja): `seite_id, titel, text`
- Eine Zeile je **frühere** Fassung. `erstellt_am` und `erstellt_von` sagen, wann und von wem diese Fassung **gespeichert worden war** (also die Werte `geaendert_am` und `geaendert_von` der Seite vor der Änderung).
- Schreibt nur das Skript. `create`, `update`, `delete` über die API sind gesperrt (wie `Ausleihe`). Gelesen wird mit `list` (nur eigene Gruppe).
- Höchstens 10 Zeilen je Seite. Die elfte entfernt das Skript gleich (weich löschen).

**Was das Skript dazu macht** (neue Datei `apps-script/Wiki.gs`, Hilfsfunktionen beginnen mit `wiki`):
- `wikiPruefen` in `create`, `batchCreate` und `update`: Titel da, Längen, `adresse` gültig und eindeutig.
- `wikiVerlauf` in `update`: ändert sich `titel` oder `text`, kommt die vorige Fassung in `Wiki_Verlauf`.
- `wikiKaskade` in `delete`: Seite gelöscht → ihr Verlauf und ihre Kommentare (`bezug_art = wiki`) werden mitgelöscht (weich).
- **Öffentliche Aktion `wiki`** (ohne Login, in `verteile` vor `tokenPruefen`):
  - `{ aktion: 'wiki' }` → Liste aller öffentlichen Seiten aller aktiven Gruppen **ohne Text**: `titel, adresse, kategorie, stand (JJJJ-MM-TT), kurzname, gruppe_name, farbe`,
    dazu `gruppen: [{ name, kurzname, farbe, webseite, instagram, links }]` für die Info-Seite.
  - `{ aktion: 'wiki', gruppe: 'fff', adresse: 'demo-anmelden' }` → eine Seite **mit Text**. Gruppe und Adresse werden streng geprüft (`[a-z0-9_-]`, `[a-z0-9-]`, Längen).
  - Keine IDs, keine Namen, keine Zeitstempel mit Uhrzeit. Den mitgeschickten Anzeigenamen liest die Aktion nicht.
  - Zwischenspeicher: **ein** Eintrag für die Liste (`wiki_alle`, 2 Minuten). Seiten einzeln (`wiki_<gruppe>_<adresse>`, 2 Minuten), aber **nur für Seiten, die es in der Liste gibt**
    (so kann niemand mit erfundenen Adressen den Speicher füllen). Grund für die Teilung: Ein Eintrag darf höchstens 100 KB groß sein.
  - Nur POST (die App). Ein GET-Weg wie bei den Terminen ist nicht nötig.
- Editor-Tests: `testenWiki` (Regeln mit Werten im Speicher, Spaltenköpfe, schreibt nichts) und `testenWikiSicher` (nur erlaubte Felder, nur öffentliche, ungültige Gruppen und Adressen abgelehnt).
- `apps-script/Aufraeumen.gs`: Verlauf gelöschter Seiten wird mit den anderen gelöschten Zeilen nach 90 Tagen entfernt (läuft schon allgemein; nur prüfen und in `aufraeumenTesten` zählen).

Keine neuen Spalten in bestehenden Tabs. Die Anleitung und die Texte für Impressum, Info, Datenschutz liegen als Dateien im Repo (Frage 19), nicht im Sheet.

## 6. Schritte (Vorschlag)

### 10.0 – Plan schreiben (nur Doku)

Version: 0.31.10. Diese Datei als Fassung 1 mit Rückfragen. `docs/STAND.md` zeigt auf den Plan. Sheet und Skript bleiben unverändert.

**Prüfen:** App läuft wie vorher (nur neue Version, „Info“ zeigt 0.31.10).

### 10.1 – Plan Fassung 2, Sheet und Skript (einmal von Hand bereitstellen)

Version: 0.32.0. Hier steckt die ganze Handarbeit der Etappe. Danach braucht kein weiterer Schritt eine neue Bereitstellung (außer Frage 30 wird nötig).

1. Diese Datei als Fassung 2 (Antworten in Abschnitt 3, Abschnitte 5 bis 9 angepasst).
2. `apps-script/Schema.gs`: neue Tabs `Wiki` und `Wiki_Verlauf`, Höchstlängen in `MAX_TEXT_AUSNAHMEN` (`Wiki.text` 20000, `Wiki_Verlauf.text` 20000, `Wiki.titel` 80, `Wiki.adresse` 60, `Wiki.kategorie` 40), Kommentare zu den Tabs.
3. `js/schema.js`: Einträge `Wiki` und `Wiki_Verlauf`.
4. Neue Datei `apps-script/Wiki.gs` (Abschnitt 5).
5. `apps-script/Daten.gs`: `wikiPruefen` in `create`, `batchCreate`, `update`; `wikiVerlauf` in `update`; `wikiKaskade` in `delete`; `Wiki_Verlauf` für Schreiben sperren.
6. `apps-script/Code.gs`: `if (p.aktion === 'wiki') return aktionWiki(p);` bei „Ohne Login“.
7. `apps-script/Aufraeumen.gs`: Verlauf in `aufraeumenTesten` zählen.
8. **Pull-Request-Abschnitt „Von Hand zu erledigen“** (genaue Liste: Tabs `Wiki` und `Wiki_Verlauf` mit Zeile 1 zum Abtippen, geänderte `.gs`-Dateien ganz kopieren,
   `formatieren` ausführen, `testenWiki` und `testenWikiSicher` ausführen, neue Version bereitstellen).

**Prüfen:** App läuft wie vorher. `testenWiki` zeigt „Alles ok.“, `testenWikiSicher` zeigt „ALLES GUT“. Öffentliche Termine laden weiter.

### 10.2 – Textformat und Rechtliches (Impressum, Info, Datenschutz)

Version: 0.32.1. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/wiki-format.js`: `zeichneText(text, opt)` baut aus dem Text (Frage 11) DOM-Knoten (nur `el()` und `textContent`, Links nur mit `sichereUrl`),
   `ueberschriften(text)` (für das Inhaltsverzeichnis), `platzhalterDa(text)` (für Frage 20b). Kleine Beispiele als Kommentar, mit `node` geprüft
   (auch: `<script>` bleibt Text, `javascript:`-Link wird kein Link).
2. Neue Dateien `texte/impressum.txt`, `texte/info.txt`, `texte/datenschutz.txt` (Inhalt nach den Fragen 19 bis 22, mit Absatz zum Team). Alle in `sw.js` (`HUELLE`).
3. `js/views/info.js`: lädt die passende Datei (`fetch`, relativ) und zeigt sie mit `zeichneText`. Ohne Netz kommt sie aus dem Zwischenspeicher der App-Hülle.
   Info-Seite: Gruppen mit Links (aus der Aktion `wiki`, Liste), Links zu Termine und Wissen, Version.
4. CSS ans Ende von `css/components.css` (`/* ---- 0.32.1: Wiki-Text ---- */`).

**Prüfen:** `#/info/impressum`, `#/info/info`, `#/info/datenschutz` ohne Login, am Handy und am PC. Datenschutz enthält den Absatz zum Team.
Seite einmal laden, dann ohne Netz (Flugmodus) neu öffnen: Text ist da.

### 10.3 – Reiter Wiki (lesen) und Anleitung „Team“

Version: 0.32.2. Sheet und Skript bleiben unverändert.

1. `js/ui/nav.js`: in `TABS` `{ id: 'wiki', label: 'Wiki', icon: '📖' }` statt `hilfe`. `js/config.js`: `features.wiki = true` statt `features.hilfe`.
   `js/views/mehr.js`: `wiki` statt `hilfe`. `js/app.js`: `#/g/<kurz>/hilfe` → `wiki`; `ctx.unter` auch für `wiki`.
2. Neue Datei `js/views/wiki.js` (`render(container, ctx)`): lädt `Wiki` (Zwischenspeicher `gruppe_id:wiki`, `ladeMitCache`) und die Liste der Anleitungsseiten.
   Startseite nach Frage 6, Seitenansicht nach Frage 31, Inhaltsverzeichnis (Frage 14), interne Links `[[…]]`.
3. Neue Datei `js/views/wiki-rechnen.js`: `sortiereSeiten`, `nachKategorie`, `findeSeite(titel)`, `adresseAus(titel)`, `passtSuche`, `ausschnitt`. Mit `node` geprüft.
4. Neue Datei `texte/anleitung/team.txt` (Inhalt von `TEAM_HILFE`) und `texte/anleitung/liste.txt` (Reihenfolge und Titel der Anleitungsseiten), beide in `HUELLE`.
5. `js/views/team.js`: Link unten auf `wiki/anleitung:team`. **`js/views/hilfe.js` löschen** und aus `HUELLE` austragen (Frage 23).
6. Neue Dateien in `sw.js` (`HUELLE`), CSS ans Ende.

**Prüfen:** Reiter „Wiki“ am PC in der Seitenleiste, am Handy unter „Mehr“. Alte Adresse `…/hilfe` öffnet das Wiki. Anleitung „Team“ zeigt den bisherigen Hilfetext.
Link im Reiter Team führt dorthin. Skillshare leer mit freundlichem Satz.

### 10.4 – Skillshare-Seiten schreiben, Verlauf

Version: 0.32.3. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/wiki-eintrag.js`: Formular „+ Seite“ und „Bearbeiten“: Titel, Kategorie (Vorschläge), Text mit Zähler, Format-Hilfe und Vorschau (Frage 12),
   „Öffentlich“ mit Warnung (Frage 15), unter „Mehr“: Reihenfolge und Adresse. Vorlagen (Frage 25) beim Anlegen.
2. Speichern mit Konfliktprüfung (Frage 9), Entwurf im Gerät (`js/store.js`, Schlüssel `aktionsdeck_entwurf_wiki_<gruppe_id>`, in `gibtEntwurf` und `loescheAlleEntwuerfe` aufnehmen).
   Keine Offline-Schreibzugriffe.
3. Löschen mit Rückfrage (nennt „auch öffentlich“, wenn die Seite öffentlich ist).
4. „Verlauf (n)“: Fassungen mit Datum und Name, „Ansehen“, „Diese Fassung wiederherstellen“ (Frage 8).

**Prüfen:** Seite anlegen, Text mit Überschrift, Liste und Link, Vorschau stimmt. Zweites Gerät ändert dieselbe Seite: Konflikt-Hinweis, eigener Text bleibt.
Verlauf zeigt die alte Fassung, Wiederherstellen klappt. Adresse doppelt: Meldung vom Skript.

### 10.5 – Suche, Kommentare, Was ist neu

Version: 0.32.4. Sheet und Skript bleiben unverändert.

1. Suche über Anleitung und Skillshare mit Ausschnitt (Frage 5).
2. Kommentare unter Skillshare-Seiten (`baueKommentare`, `art: 'wiki'`, Frage 26). Marke „💬 n“ in der Liste.
3. `js/ui/neu-seit.js`: `Wiki` in `listMehrere` (dann 12 Tabellen), Abschnitt „Wiki“, Kommentare mit `art: 'wiki'` mit Seitentitel (Frage 27).
4. „Zuletzt geändert“ auf der Wiki-Startseite.

**Prüfen:** Suche nach einem Wort aus dem Text findet die Seite. Kommentar an einer Seite erscheint auf dem anderen Gerät unter „Was ist neu?“.

### 10.6 – App-Anleitung schreiben

Version: 0.32.5. Sheet und Skript bleiben unverändert.

1. Neue Dateien `texte/anleitung/<seite>.txt` nach Frage 24 (Texte nach dem Stand im Code, keine erfundenen Abläufe der Gruppen). Alle in `HUELLE`, `liste.txt` ergänzt.
2. Abschnitt in `CLAUDE.md`: Neue Funktionen ergänzen die passende Anleitungsseite im selben Pull Request (nur wenn die Person zustimmt, Frage 24).

**Prüfen:** Jede Anleitungsseite öffnet sich, Links zwischen den Seiten gehen. Inhalt lesen und Anmerkungen sammeln.

### 10.7 – Öffentliches Wiki (`#/wiki`)

Version: 0.32.6. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/wiki-oeffentlich.js` (`render(container, ctx)`): Übersicht und Seite nach Frage 17, Aufbau wie `js/views/termine.js` (Balken, „← Zur Gruppenwahl“ bzw. „← Zurück zur App“).
   Laden mit `ladeMitCache('oeffentlich:wiki', …, true)` und `api('wiki', …)` ohne Token. Seiten einzeln mit `oeffentlich:wiki:<gruppe>:<adresse>`.
2. `js/app.js`: Weg `#/wiki[/<gruppe>/<adresse>]` vor dem Login-Teil (wie `termine`). `js/ui/nav.js`: „Wissen“ in `oeffentlicheLinks()` (Frage 18).
3. Im Reiter Wiki: Marke „🌐 öffentlich“, „Link kopieren“, Aufklapper „Öffentliche Seiten anderer Gruppen“ (Frage 16).
4. Interne Links `[[…]]` auf öffentlichen Seiten führen nur auf andere **öffentliche** Seiten derselben Gruppe, sonst nur Text.

**Prüfen:** Seite öffentlich machen. Im privaten Fenster (ohne Login) unter `#/wiki` erscheint sie nach höchstens 2 Minuten, ohne Namen.
Haken wieder weg: Sie verschwindet nach höchstens 2 Minuten. Kommentare sind öffentlich nicht zu sehen. Erfundene Adresse: „Seite nicht gefunden“.

### 10.8 – Kalender-Abo testen

Version: 0.32.7. Sheet und Skript bleiben unverändert (außer der Ausweg aus Frage 30 wird gebraucht, dann eigener Schritt 10.8a).

1. `js/views/termine-liste.js`: neben der Abo-Adresse die Knöpfe „In Google Kalender öffnen“ und „In Apple Kalender öffnen“ (`webcal://`) (Frage 29).
2. Test-Anleitung für die Person im Pull Request (Google am PC, Google am Android-Handy über den PC, iPhone, Mac).
3. Anleitung in `texte/anleitung/kalender.txt` ergänzt.
4. Ergebnis kommt in `docs/STAND.md`. Klappt es nicht: Schritt 10.8a nach Frage 30.

**Prüfen:** Abo in Google Kalender und Apple Kalender anlegen. Eine neue öffentliche Veranstaltung erscheint (bei Google nach einigen Stunden). Ergebnis melden.

### 10.9 – Feinschliff und Abschluss

Version: 0.32.8. Sheet und Skript bleiben unverändert.

1. Anmerkungen aus den Prüfungen, soweit klein.
2. `docs/STAND.md`: Etappe 10 abschließen, Dateiübersicht, offene Punkte. Punkte „Etappe 10 (Datenschutz)“ und „Etappe 10 (öffentliche Seiten)“ in „Offen“ erledigen.
3. `CLAUDE.md`: Reiter „Wiki“ statt „Info/Hilfe“ in Abschnitt 1 und 5, Hinweis auf `texte/`.

**Prüfen:** Alles aus 10.2 bis 10.8 läuft noch.

## 7. Regeln und Risiken für Etappe 10

- **Öffentlich heißt öffentlich:** Was auf einer öffentlichen Seite steht, kann jede Person lesen, kopieren und speichern. Auch wenn der Haken später weg ist.
  Darum Standard „nicht öffentlich“, Warnsatz beim Anhaken, Marke in der Liste. Kein Name, kein Verlauf, keine Kommentare nach außen.
- **Auslieferung ohne Login wie `Termine.gs`:** feste Liste erlaubter Felder, nur aktive Gruppen, strenge Prüfung von Gruppe und Adresse, kurzer Zwischenspeicher nur für vorhandene Seiten,
  Editor-Test `testenWikiSicher`. Die Aktion schreibt nichts und speichert keinen Anzeigenamen.
- **Texte nur mit `textContent`:** Das Textformat baut DOM-Knoten selbst. Kein `innerHTML`, auch nicht für fett oder Listen. Links nur mit `http(s)://` (`sichereUrl`).
  Das Skript schützt Werte mit `=`, `+`, `-`, `@` wie immer (beginnt ein Text mit „- “, bekommt er im Sheet ein Hochkomma; `aus` in `apps-script/Util.gs` nimmt es beim Lesen wieder weg).
- **Größe:** Eine Seite bis 20 000 Zeichen, eine Sheet-Zelle fasst 50 000. `CacheService` höchstens 100 KB je Eintrag: darum die Liste ohne Texte und Seiten einzeln.
- **Anleitung als Dateien:** Sie laden ohne Skript und offline. Jede Datei muss in `HUELLE` stehen. Eine fehlende Datei zeigt „Diese Seite fehlt“ statt eines Fehlers.
- **Rechtliches:** Der Agent schreibt Entwürfe nach der echten Technik, aber keine Rechtsberatung. Keine erfundenen Namen oder Adressen, keine Abfrage von Daten.
  Platzhalter bleiben sichtbar, bis die Person sie ersetzt.
- **Löschen von `js/views/hilfe.js`:** steht ausdrücklich in diesem Plan (10.3). Alte Adressen `…/hilfe` führen zum Wiki.
- **„Was ist neu?“ an der Grenze:** Mit `Wiki` fragt es 12 Tabellen ab. Spätere Quellen brauchen eine zweite Anfrage.
- **Kalender-Abo:** Ob Google und Apple der Weiterleitung des Skripts folgen, kann nur die Person testen. Google lädt Abos nur alle paar Stunden neu, das ist kein Fehler.
- **Strenge Spaltenköpfe:** Beim Schreiben in `Wiki` und beim Verlauf prüft das Skript die Köpfe streng. Fehlt ein Tab, kann der Reiter Wiki keine Skillshare-Seiten laden (die Anleitung geht trotzdem).
  Wie immer: zuerst das Sheet, dann das Skript.
- **Nicht vom Agenten prüfbar:** Aussehen am Handy, echte Bereitstellung, Editor-Tests im echten Sheet, Kalender-Abo in Google und Apple.
  Der Agent prüft das Textformat und die Rechenfunktionen mit `node`, das Skript mit einem nachgebauten Sheet, und die Seiten im Browser mit erfundenen Daten.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 10.0 | Plan Fassung 1 mit Rückfragen | 0.31.10 | nein |
| 10.1 | Plan Fassung 2; Tabs `Wiki` und `Wiki_Verlauf`, `Wiki.gs`, öffentliche Aktion `wiki` | 0.32.0 | **ja, von Hand** |
| 10.2 | Textformat; Impressum, Info, Datenschutz (mit Absatz Team) | 0.32.1 | nein |
| 10.3 | Reiter Wiki (lesen), Anleitung „Team“, Hilfe entfällt | 0.32.2 | nein |
| 10.4 | Skillshare-Seiten schreiben, Verlauf | 0.32.3 | nein |
| 10.5 | Suche, Kommentare, Was ist neu | 0.32.4 | nein |
| 10.6 | App-Anleitung für alle Reiter | 0.32.5 | nein |
| 10.7 | Öffentliches Wiki `#/wiki` | 0.32.6 | nein |
| 10.8 | Kalender-Abo testen (Knöpfe Google und Apple) | 0.32.7 | nein (10.8a nur im Notfall) |
| 10.9 | Feinschliff, Abschluss | 0.32.8 | nein |

Die Versionen in dieser Tabelle sind die geplanten. Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.

## 9. Dateien der Etappe (Vorschlag)

- Neu: `js/wiki-format.js`, `js/views/wiki.js`, `js/views/wiki-rechnen.js`, `js/views/wiki-eintrag.js`, `js/views/wiki-oeffentlich.js`,
  `texte/impressum.txt`, `texte/info.txt`, `texte/datenschutz.txt`, `texte/anleitung/*.txt`, `apps-script/Wiki.gs`.
- Geändert: `js/ui/nav.js`, `js/config.js` (VERSION, `features`), `js/app.js`, `js/views/mehr.js`, `js/views/info.js`, `js/views/team.js`, `js/views/termine-liste.js`,
  `js/ui/neu-seit.js`, `js/store.js`, `js/schema.js`, `sw.js`, `css/components.css`, `apps-script/Schema.gs`, `apps-script/Daten.gs`, `apps-script/Code.gs`, `apps-script/Aufraeumen.gs`,
  `docs/STAND.md`, `CLAUDE.md` (10.9).
- Gelöscht: `js/views/hilfe.js` (10.3).
