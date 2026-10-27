# Plan Etappe 11: Komfort (Fassung 1, 24.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: Fassung 1 mit Rückfragen (Schritt 11.0, Version 0.32.11).** Die Person beantwortet die Rückfragen in Abschnitt 4.
Danach kommt Fassung 2 (zusammen mit Schritt 11.1, wie in Etappe 9 und 10). Erst dann wird gebaut.
Alles in den Abschnitten 5 bis 8 ist ein **Vorschlag** und kann sich mit den Antworten ändern.

**Umentschieden am 24.10.2026:** Zuerst kommt diese Etappe „Komfort“. Die Prüfung und Qualität (Geschwindigkeit, Sicherheit, Barrierefreiheit, CSS ordnen, App-Icon, Tabs sortieren)
wird **Etappe 12** und ist der **letzte Schritt vor Version 1.0**. Ihr Plan stand bisher in `docs/PLAN-ETAPPE-11.md` und heißt jetzt `docs/PLAN-ETAPPE-12.md`.

**Annahme für diesen Plan:** Das Sheet und das Skript für Etappe 10 (Tab `Wiki`, `apps-script/Wiki.gs`, Liste in Pull Request #38) sind am 24.10.2026
**noch nicht** eingerichtet. Dieser Plan geht davon aus, dass das **vor** Schritt 11.1 passiert (Rückfrage 1).

## 1. Ziel

Die App soll im Alltag bequemer werden. Die Punkte stammen aus der bisher geplanten Etappe „Komfort“ (`docs/STAND.md`, „Plan Etappen 7 bis 11“):

1. **Kontostand von OpenCollective:** Die Gruppe sieht in der App, wie viel Geld auf ihrem OpenCollective-Konto ist
   (zuerst nur Klimastreik Landau, https://opencollective.com/klimastreik-landau). Das Skript holt den Stand regelmäßig selbst. Erst testen, dann bauen.
2. **Erinnerungen:** Die App zeigt jeder Person, was für sie ansteht (zum Beispiel überfällige ToDos, offene Umfragen, neue Kommentare).
   Das wird so gebaut, dass später **Push-Nachrichten oder E-Mails** darauf aufsetzen können.
3. **Sicherung:** Das Sheet wird regelmäßig als Kopie gesichert. Die Gruppe kann ihre Daten aus der App herunterladen.
4. **Übersicht und Export:** Eine Übersicht über einen Zeitraum (zum Beispiel ein Jahr: Aktionen, Termine, Beiträge, Ausgaben), Listen als Datei (für Excel oder Google Sheets) und eine Druckansicht.
5. **Dunkelmodus:** Die App gibt es hell und dunkel.
6. **Mein Bereich** („Konto“ auf dem Gerät): eine Seite mit den eigenen Einstellungen (Name, Hell oder Dunkel, Erinnerungen). Siehe Rückfrage 2.
7. **Feinschliff:** Anmerkungen aus der Prüfung von Etappe 10 und gesammelte Anmerkungen der Person.
8. **GitHub Actions** auf neue Versionen heben (Warnungen wegen Node 20).

## 2. Ausgangslage (im Repo geprüft am 24.10.2026, Version 0.32.10)

`js/config.js` und `sw.js` haben beide `0.32.10`, wie `docs/STAND.md`. Mit 11.0 wird es 0.32.11.

Was es schon gibt und wiederverwendet wird:

- **Finanzen im Projekt** (`js/views/projekt-finanzen.js`): Posten, Summen „Budget, Geplant, Tatsächlich“, Haken „bezahlt“. Der Text sagt schon:
  „Das Geld selbst läuft über OpenCollective, hier steht nur die Übersicht.“ Einen Kontostand gibt es nirgends.
- **Tab `Einstellungen`** (`schluessel, wert`, System-Tab in `apps-script/Schema.gs`): `aktionBootstrap` (`apps-script/Daten.gs`) gibt **alle Zeilen an jede Gruppe** heraus.
  Die App liest das Feld nicht (keine Stelle in `js/`). Der Tab hat keine Spalte `gruppe_id`. Für den Kontostand einer Gruppe passt er darum nicht gut (Abschnitt 5).
- **Kein Zeitauslöser, kein Abruf von außen, keine E-Mail im Skript:** In `apps-script/*.gs` gibt es weder `ScriptApp.newTrigger` noch `UrlFetchApp` noch `MailApp`.
  Ein Zeitauslöser und ein Abruf bei OpenCollective brauchen darum **neue Berechtigungen**. Google fragt die Person einmal danach (im Editor).
- **„Was ist neu?“** (`js/ui/neu-seit.js`, Glocke auf dem Start): zeigt Neues seit dem letzten Besuch (pro Gerät und Gruppe). Das ist **keine** Erinnerung an Fälliges.
- **„Für dich“ gibt es schon als Zahl:** `js/views/todos-rechnen.js` hat `istMeins(todo, name)` (Vergleich mit dem Anzeigenamen) und zählt „… für dich“.
  Der Start zeigt schon eine Erinnerung zur abgelaufenen Kapazität (`js/views/start.js`, seit 9.7). Diese Teile werden wiederverwendet.
- **Kopieren statt Export:** Mehrere Reiter haben „kopieren“-Knöpfe (Umfrage-Ergebnis, Protokoll, Wiki-Text, Termine). Einen Download als Datei gibt es nicht
  (kein `Blob`, kein `download` in `js/`). Eine Druckansicht (`@media print`) gibt es nicht.
- **Sicherung:** Es gibt keine. Google Sheets hat einen eigenen **Versionsverlauf** (Datei → Versionsverlauf), der aber nur das ganze Sheet zurücksetzt.
  `apps-script/Aufraeumen.gs` löscht weich gelöschte Zeilen nach 90 Tagen endgültig. Was danach fehlt, ist nur noch im Versionsverlauf.
- **Farben:** In `css/base.css` stehen Farben als Variablen (`--gruen`, `--text`, `--hintergrund`, `--flaeche`, `--rand` …). In `css/components.css` stehen aber
  noch etwa **140 feste Farbwerte** (zum Beispiel `#fff`), und **19 Dateien in `js/`** setzen Farben direkt (Gruppenfarben, Veranstaltungsfarben, Pastell-Hintergründe).
  Ein Dunkelmodus muss diese Stellen erst auf Variablen umstellen. `index.html` hat `theme-color` `#368469`. Es gibt kein `prefers-color-scheme`.
- **Einstellungen auf dem Gerät** (`js/store.js`): Name, Entwürfe, letzter Besuch, Zustände der Reiter. „Name ändern“ und „Abmelden“ stehen am Handy in „Mehr“ (`js/views/mehr.js`).
- **Reiter und Schalter:** `js/ui/nav.js` (`TABS`), `js/config.js` (`features`). Am Handy zeigt „Mehr“ Material, Kalender, Dokumentation, Team, Wiki.
- **Service Worker** (`sw.js`): holt App-Dateien zuerst aus dem Netz. Hintergrund-Abrufe (Push, regelmäßiges Abrufen) gibt es nicht. Das bleibt so (Rückfrage 13).
- **GitHub Actions** (`.github/workflows/jekyll-gh-pages.yml`): `actions/checkout@v4`, `configure-pages@v5`, `jekyll-build-pages@v1`, `upload-pages-artifact@v3`, `deploy-pages@v5`.
  Warnungen wegen Node 20 (siehe `docs/STAND.md`, „Offen“). Läuft noch grün.
- **Etappe 10:** fertig gebaut, gemergt bis Pull Request #48. 10.1 ist bereitgestellt (Skript-Stand 10.1a, Pull Request #50, 27.10.2026). Die Prüfung durch die Person steht aus.
  Noch nicht bestätigte Prüfpunkte aus früheren Etappen: 0.26.3 (Etappe 5) und 0.28.9 bis 0.28.13 (Etappe 6), siehe `docs/STAND.md`, „Erledigt“.

**Technische Grenze bei Push-Nachrichten (wichtig für Rückfrage 13):** Echte Push-Nachrichten aufs Handy (auch wenn die App zu ist) brauchen einen Absender,
der jede Nachricht mit einem besonderen Schlüssel unterschreibt und verschlüsselt. Das Google-Skript kann diese Art der Unterschrift nicht.
Es bräuchte einen fremden Dienst oder eigenen Server. Das widerspricht bisher den Regeln (kein fremder Dienst, keine Tracker).
Am iPhone geht Push außerdem nur, wenn die App auf dem Startbildschirm liegt.

## 3. Entscheidungen

Noch keine. Die Antworten auf Abschnitt 4 kommen in Fassung 2 hierher.

## 4. Rückfragen (Fassung 1)

Jede Frage hat einen Vorschlag. Antworte gern mit „wie Vorschlag“ oder mit der Nummer und deiner Änderung.

### Ablauf

1. **Etappe 10 zuerst einrichten?** Das Skript prüft die Spaltenköpfe streng, und `Schema.gs` aus 11.1 enthält auch den Tab `Wiki`.
   *Vorschlag:* Du arbeitest zuerst die Liste aus Pull Request #38 ab (Tab `Wiki`, `Wiki.gs`, neue Bereitstellung), dann die Liste aus 11.1.
   Die Prüfung von Etappe 10 darf parallel laufen. Deine Anmerkungen dazu kommen in Schritt 11.2, **vor** den neuen Funktionen.
2. **Was meinst du mit „Konto“?**
   - a) den **Kontostand bei OpenCollective** (stand schon in der Etappe „Komfort“) oder
   - b) eine Seite **„Mein Bereich“** mit den eigenen Einstellungen auf dem Gerät.
   *Vorschlag:* beides (Punkt 1 und 6 im Ziel). **Keine Einzelkonten** mit eigenem Passwort pro Person: Das bleibt wie bisher ein PIN pro Gruppe (`CLAUDE.md`, Abschnitt 5).
   Einzelkonten wären ein großer Umbau (Anmeldung, Datenschutz, PIN-Verwaltung) und gehören nicht in „Komfort“.
3. **„etc.“: Gibt es weitere Wünsche?** Ideen, die zu „Komfort“ passen (nur bauen, wenn du sie ankreuzt):
   - a) **Suche über alle Reiter** (ein Suchfeld für Projekte, ToDos, Material, Wiki, Protokolle).
   - b) **„Teilen“ am Handy** (Termin, Wiki-Seite oder Mobi-Text direkt an WhatsApp oder Telegram geben).
   - c) **Start anpassen** (Kacheln ein- und ausblenden, auf dem Gerät gespeichert).
   - d) **Hinweis „Du bist offline“** oben, wenn keine Verbindung da ist (Schreiben geht dann nicht).
   *Vorschlag:* d) ja (klein und hilfreich, weil Schreiben ohne Netz nicht geht). a) bis c) erst nach deiner Antwort.
4. **Reihenfolge:**
   *Vorschlag:* Plan Fassung 2 mit Sheet und Skript → Feinschliff Etappe 10 → GitHub Actions → Mein Bereich → Kontostand → Erinnerungen → Sicherung und Export →
   Übersicht und Drucken → Dunkelmodus (zwei Schritte) → Abschluss. Mein Bereich kommt früh, weil spätere Schritte dort ihre Schalter ablegen.
   Der Dunkelmodus kommt spät, weil die Schritte davor noch neue Farben bringen.

### Kontostand (OpenCollective)

5. **Welche Gruppe?** Klimastreik Landau gehört vermutlich zu Fridays for Future (`g1`, `fff`). Stimmt das?
   *Vorschlag:* Ja, `g1`. Welche Gruppe welches Konto hat, steht in einer **Skripteigenschaft** `OC_KONTO_<gruppe_id>` (Wert: `klimastreik-landau`).
   Eine weitere Gruppe bekommt später nur eine neue Skripteigenschaft, ohne neuen Code. Gruppen ohne Eintrag sehen nichts vom Kontostand.
6. **Was wird abgerufen?** OpenCollective zeigt öffentlich den Kontostand und alle Buchungen (auch mit Namen von Spendenden).
   *Vorschlag:* Nur **Kontostand** und **Zeitpunkt des Abrufs**. Keine Buchungen und keine Namen. Jeder Abruf wird als Zeile gespeichert, so entsteht ein **Verlauf**
   (für die Übersicht in 11.8, zum Beispiel „Kontostand am Anfang und Ende des Jahres“).
7. **Wie oft?** *Vorschlag:* Einmal pro Woche (Montag früh), wie bisher geplant, über einen **Zeitauslöser** im Skript.
   Dazu ein Knopf **„Jetzt abrufen“** in der App, der höchstens einmal pro Stunde wirklich abruft (sonst zeigt er den gemerkten Stand).
   *Andere Möglichkeit:* einmal am Tag und kein Knopf (einfacher, das Skript macht dann alles allein).
8. **Wo steht der Kontostand?**
   *Vorschlag:* (a) Im Reiter Projekte, Aufklapper oder Zeile **„Kasse“** über den laufenden Projekten: „Auf dem Konto: 1.234,56 € (Stand Mo, 21.10.2026)“ und Link „Zu OpenCollective →“.
   (b) Im Teil **Finanzen** jedes Projekts eine Zeile darunter: „Kontostand der Gruppe: … – geplante offene Ausgaben dieses Projekts: …“.
   (c) **Nicht** auf dem Start (der ist schon voll). Nur mit PIN sichtbar, nicht auf öffentlichen Seiten.
9. **Erst testen:** Ob der Abruf aus dem Google-Skript klappt, kann der Agent nicht prüfen (er kann das Skript nicht ausführen).
   *Vorschlag:* Schritt 11.1 bringt die Editor-Funktion **`kontoTesten`**. Du führst sie aus und meldest, was im Protokoll steht.
   Erst wenn das klappt, kommt der Teil in der App (11.5). Klappt es nicht, entscheiden wir neu (zum Beispiel Kontostand von Hand eintragen).

### Erinnerungen

10. **Was ist eine Erinnerung?** *Vorschlag:* Für die Person mit dem eigenen Anzeigenamen:
    - ToDos, bei denen du verantwortlich bist: **überfällig** und **heute fällig** (auch ToDos in Projekten und Mobi).
    - **Meilensteine**, für die du verantwortlich bist, in den nächsten 3 Tagen.
    - **Mobi-Beiträge**, für die du verantwortlich bist, die in den nächsten 2 Tagen erscheinen sollen und noch nicht „bereit“ sind.
    - **Laufende Umfragen**, bei denen du noch nicht abgestimmt hast (mit Frist: zuerst).
    - **Neue Kommentare** zu deinen ToDos und zu Reden, die du geschrieben hast (seit dem letzten Besuch).
    - **Reden im Status „probelesen“**, die nicht von dir sind (Bitte um Rückmeldung).
    - **Material**, das du für ein Projekt mitgenommen hast und das noch draußen ist, wenn die Aktion vorbei ist.
    - **Kapazität** abgelaufen (gibt es schon, zieht mit um).
11. **Wo erscheinen sie?** *Vorschlag:* Eine Kachel **„Für dich“** ganz oben auf dem Start, nur wenn es etwas gibt. Je Zeile ein Satz mit Link zur Stelle.
    Die Glocke „Was ist neu?“ bleibt, wie sie ist (Neues von anderen). Am PC und am Handy gleich. Ohne Anzeigenamen gibt es keine Kachel.
12. **Zahl am App-Symbol:** Viele Handys und PCs zeigen eine kleine Zahl am Symbol der installierten App.
    *Vorschlag:* Ja, die Zahl der Erinnerungen. **Einschränkung:** Die Zahl ändert sich nur, wenn die App offen war (ohne Push kann sie im Hintergrund nichts nachsehen).
    Am iPhone geht die Zahl nur mit Erlaubnis für Mitteilungen. *Vorschlag:* am iPhone nicht danach fragen.
13. **Echte Push-Nachrichten** (auch wenn die App zu ist): Das geht nur mit einem fremden Dienst (siehe Abschnitt 2, „Technische Grenze“).
    *Vorschlag:* In Etappe 11 **keine** Push-Nachrichten. Die Regeln aus Rückfrage 10 stehen an **einer** Stelle (neue Datei `js/views/erinnerungen-rechnen.js`) und sind dort genau beschrieben.
    So kann später ein Skript dieselben Regeln nachbauen und Push oder E-Mail verschicken.
14. **E-Mail schon jetzt?** Das Skript könnte einmal pro Woche eine Zusammenfassung an **eine Adresse der Gruppe** schicken (keine Adressen einzelner Personen,
    weil es keine Einzelkonten gibt). Google erlaubt etwa 100 Mails am Tag.
    *Vorschlag:* **Nein** in Etappe 11. Ja später, wenn ihr eine Gruppen-Adresse habt und es wollt (dann neue Skripteigenschaft, Text im Datenschutz).
15. **Abschalten:** *Vorschlag:* In „Mein Bereich“ kann jede Person die Arten aus Rückfrage 10 einzeln aus- und einschalten (auf dem Gerät gespeichert, je Gruppe). Standard: alle an.

### Sicherung

16. **Sicherung des Sheets:** *Vorschlag:* Neue Editor-Datei `apps-script/Sicherung.gs`. Die Funktion `sichern` legt eine **Kopie des ganzen Sheets** in einem eigenen Drive-Ordner ab
    (Name „AktionsDeck Sicherung JJJJ-MM-TT“). Ein Zeitauslöser macht das **einmal pro Woche** (Sonntag nachts). Es bleiben die **letzten 8** Kopien (etwa zwei Monate), ältere landen im Papierkorb.
    **Wichtig:** Die Kopie enthält alles, auch den Tab `Zugang` (verschlüsselte PINs). Der Ordner darf darum **mit niemandem geteilt** werden. Das steht in der Anleitung.
    Ordner-ID als Skripteigenschaft `SICHERUNG_ORDNER`.
17. **Wie viele Kopien und wie oft?** *Vorschlag:* wöchentlich, 8 Kopien. *Andere Möglichkeit:* täglich, 14 Kopien (mehr Platz im Drive, aber kleiner Verlust bei Fehlern).
18. **Daten der Gruppe aus der App herunterladen:**
    *Vorschlag:* In „Mein Bereich“ ein Knopf **„Daten der Gruppe herunterladen“**. Du wählst Bereiche (Projekte, ToDos, Material, Termine, Protokolle, Wiki …).
    Jeder Bereich wird eine **CSV-Datei** (öffnet sich in Excel oder Google Sheets). Nur die eigene Gruppe, nur nicht gelöschte Zeilen.
    **Team** (Personen, Kapazität) nur nach einer extra Rückfrage im Fenster, weil es Angaben zu Personen sind.
19. **Wiederherstellen:** *Vorschlag:* **Kein** Einspielen über die App (zu riskant: ein Fehler überschreibt alles). Wiederherstellen geht von Hand aus der Sheet-Kopie
    (Anleitung für die Person in `docs/SICHERUNG.md`: Zeilen aus der Kopie in das echte Sheet kopieren, oder Versionsverlauf).

### Übersicht, Export und Drucken

20. **Was zeigt die Übersicht?** *Vorschlag:* Eine Seite für einen wählbaren Zeitraum (Standard: das laufende Jahr; dazu „letztes Jahr“, „Halbjahr“, „frei“). Zahlen und kurze Listen:
    - Projekte: abgeschlossen (mit Aktionsdatum und Aktionsart), aktiv, in Planung.
    - Veranstaltungen: Zahl intern und extern, Liste der externen.
    - Mobi: veröffentlichte Beiträge je Kanal.
    - ToDos: erledigt, davon in Projekten.
    - Geld: geplante und tatsächliche Ausgaben je Projekt, Summe; Kontostand am Anfang und Ende (wenn es einen Verlauf gibt).
    - Material: am häufigsten ausgeliehen.
    - Dokumentation: Zahl der Protokolle, gehaltene Reden; Learnings nach Aktionsart.
    Gedacht für Jahresbericht, Förderanträge oder einen Rückblick im Plenum. Knöpfe „Als Text kopieren“ und „Drucken“.
21. **Wo liegt die Übersicht?** *Vorschlag:* **Kein neuer Reiter** in der unteren Leiste. Am Handy ein Punkt **„📊 Übersicht“** in „Mehr“, am PC in der Seitenleiste unter den Reitern.
    Adresse `#/g/<kurzname>/uebersicht`, Schalter `features.uebersicht`.
22. **Listen als Datei (CSV):** *Vorschlag:* Knopf „⬇ Als Datei“ bei der **ToDo-Liste** (mit den gewählten Filtern), dem **Material-Bestand**, den **Finanzen eines Projekts**
    und der **Kalender-Liste**. Nicht beim Team (Personen).
23. **Drucken:** *Vorschlag:* Eine Druckansicht für alle Seiten (Leisten, Knöpfe und Hintergründe fallen beim Drucken weg, schwarze Schrift auf Weiß).
    Ein Knopf „🖨 Drucken“ nur dort, wo es sich lohnt: **Packliste Material** eines Projekts (mit Kästchen zum Abhaken), ToDos eines Projekts, Protokoll, Wiki-Seite, Übersicht.

### Dunkelmodus

24. **Wann ist die App dunkel?** *Vorschlag:* Standard **„Wie das Gerät“**. In „Mein Bereich“ ein Schalter **Hell | Dunkel | Wie das Gerät** (auf dem Gerät gespeichert, für alle Gruppen gleich).
    Die öffentlichen Seiten (`#/info`, `#/termine`, `#/wiki`) und die Gruppenwahl folgen derselben Einstellung.
25. **Farben im Dunkelmodus:** *Vorschlag:* Hintergrund fast schwarz mit grünem Ton (passend zu `#1a1e20`), Flächen etwas heller, Schrift hellgrau.
    **Gruppenfarben** und **Veranstaltungsfarben** bleiben, Pastell-Hintergründe werden zu dunklen, gedeckten Tönen derselben Farbe.
    Gruppen-Logos (`icons/gruppen/`) bekommen eine helle runde Fläche, damit dunkle Logos sichtbar bleiben. Bilder (Material, Wiki) bleiben unverändert.
26. **Zwei Schritte:** *Vorschlag:* 11.9 stellt zuerst alle festen Farben auf Variablen um (**ohne sichtbare Änderung**, geprüft mit Bildschirmfotos vorher und nachher).
    11.10 bringt dann die dunklen Farben und den Schalter. So sieht man im zweiten Schritt nur den Dunkelmodus.
    Das große Ordnen des CSS bleibt in Etappe 12 und prüft dann beide Modi.

### Mein Bereich

27. **Was steht dort?** *Vorschlag:* Seite **„👤 Mein Bereich“**, Adresse `#/g/<kurzname>/ich`:
    - Name (wie „Name ändern“), Abmelden.
    - **Darstellung:** Hell | Dunkel | Wie das Gerät (Rückfrage 24).
    - **Erinnerungen:** Arten ein und aus (Rückfrage 15), Zahl am App-Symbol ein und aus.
    - **Daten der Gruppe herunterladen** (Rückfrage 18).
    - Hinweis: „Diese Einstellungen gelten nur auf diesem Gerät.“
28. **Wo kommt man hin?** *Vorschlag:* Am Handy ganz oben in „Mehr“. Am PC unten in der Seitenleiste: „Angemeldet als …“ wird ein Link zu „Mein Bereich“ (dort stehen heute „Name ändern“ und „Abmelden“, `js/ui/nav.js`, `baueGeruest`).
    „Name ändern“ und „Abmelden“ bleiben in „Mehr“ zusätzlich stehen (gewohnt).
29. **Beim Abmelden:** *Vorschlag:* Die Darstellung bleibt. Die Einstellungen zu Erinnerungen der Gruppe werden mit den Entwürfen gelöscht.

### Feinschliff und GitHub

30. **GitHub Actions anheben:** *Vorschlag:* Ja, früh als kleiner eigener Schritt (11.3), weil er nichts an der App ändert.
    Der Agent sucht beim Bauen die aktuellen Versionen der fünf Actions heraus und nennt sie im Pull Request. Prüfen: Nach dem Merge läuft die Action grün, die Seite ist da.
    In `docs/PLAN-ETAPPE-12.md` (Rückfrage 23) bleibt dann nur die Kontrolle, dass alles grün ist.
31. **Feinschliff:** *Vorschlag:* 11.2 nimmt deine Anmerkungen aus der Prüfung von Etappe 10. Am Ende (11.11) kommen alle Anmerkungen, die bis dahin gesammelt sind.
    Die alten, noch nicht bestätigten Prüfpunkte (0.26.3 und 0.28.9 bis 0.28.13) prüfst du bitte mit: Ich schreibe sie dir in 11.2 als kurze Liste in den Pull Request.

## 5. Datenmodell (Vorschlag)

Die Person tippt neue Tabs **von Hand** ins Sheet (siehe `CLAUDE.md` Abschnitt 7). `gruppe_id` heißt wirklich so.

**Neuer Tab `Kontostand`** (nur, wenn Rückfrage 2 a „ja“ ist):
Basis-Spalten `id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht`, dahinter `quelle, betrag, waehrung, stand_am`
- `quelle`: Kurzname des OpenCollective-Kontos (zum Beispiel `klimastreik-landau`).
- `betrag`: Kontostand als Zahl in Euro (zwei Nachkommastellen). Neue Zahl-Spalte (`ZAHL_SPALTEN` in `Schema.gs`).
- `waehrung`: zum Beispiel `EUR`.
- `stand_am`: Zeitpunkt des Abrufs.
- Eine Zeile je Abruf (Verlauf). `erstellt_von` ist `Skript` bzw. der Anzeigename beim Knopf „Jetzt abrufen“.
- **Nur das Skript schreibt** in diesen Tab. Die App darf nur lesen. Neu in `Schema.gs`: Liste `NUR_SKRIPT = ['Kontostand']` (create, update, delete und batchCreate über die App sind gesperrt).

*Warum nicht der Tab `Einstellungen`?* Er hat keine Spalte `gruppe_id`, und `bootstrap` gibt ihn an **alle** Gruppen heraus. Ein eigener Tab hält die Regel „ein Token sieht nur seine Gruppe“ ein und erlaubt den Verlauf.

**Neue Skripteigenschaften** (nur im Editor, keine Geheimnisse): `OC_KONTO_g1 = klimastreik-landau` (Rückfrage 5), `SICHERUNG_ORDNER = <ID des Drive-Ordners>` (Rückfrage 16).

**Neue Skriptdateien** (Hilfsfunktionen beginnen mit `konto` bzw. `sicher`):
- `apps-script/Konto.gs`: `kontoAbrufen` (für den Zeitauslöser: alle Gruppen mit `OC_KONTO_…`), `kontoTesten` (nur Editor, schreibt nichts, zeigt den Stand im Protokoll),
  `kontoAusloeserEinrichten` (legt den wöchentlichen Auslöser einmal an, kein doppelter), Aktion `kontoAktualisieren` (Knopf „Jetzt abrufen“, höchstens einmal pro Stunde je Gruppe, Rückfrage 7).
  Abruf über die öffentliche Schnittstelle von OpenCollective (ohne Schlüssel, nur öffentliche Daten).
- `apps-script/Sicherung.gs` (nur Editor): `sichern`, `sichernTesten` (zeigt Ordner und vorhandene Kopien), `sicherungAusloeserEinrichten`.
- `apps-script/Code.gs`: verteilt `kontoAktualisieren`. `apps-script/Daten.gs`: Sperre für `NUR_SKRIPT`.

**Keine** Sheet-Änderung für Erinnerungen, Übersicht, Export, Drucken, Dunkelmodus und Mein Bereich. Alles wird aus den vorhandenen Daten berechnet oder auf dem Gerät gespeichert.

**Neue Schlüssel auf dem Gerät** (`js/store.js`): `aktionsdeck_darstellung` (`hell` | `dunkel` | `geraet`), `aktionsdeck_erinnerungen_<gruppe_id>` (welche Arten aus sind),
`aktionsdeck_konto_abruf_<gruppe_id>` (Zeitpunkt des letzten Knopfdrucks). Zwischenspeicher: `gruppe_id:konto`, `gruppe_id:uebersicht`.

## 6. Schritte (Vorschlag)

### 11.0 – Plan schreiben (nur Doku)

Version: 0.32.11. Diese Datei als Fassung 1 mit Rückfragen. Der bisherige Plan 11 (Prüfung und Qualität) heißt jetzt `docs/PLAN-ETAPPE-12.md`, Schrittnummern und Versionen darin angepasst.
`docs/STAND.md` und `CLAUDE.md` zeigen auf beide Pläne. Sheet und Skript bleiben unverändert.

**Prüfen:** App läuft wie vorher (nur neue Version).

### 11.1 – Plan Fassung 2, Sheet und Skript

Version: 0.33.0 (neuer Hauptschritt). **Mit „Von Hand zu erledigen“** (neuer Tab, neue Skriptdateien, Zeitauslöser, neue Bereitstellung).

1. Fassung 2 dieser Datei mit den Antworten.
2. Tab `Kontostand` in `apps-script/Schema.gs` und `js/schema.js`, `NUR_SKRIPT`, `betrag` in `ZAHL_SPALTEN`.
3. Neue Dateien `apps-script/Konto.gs` und `apps-script/Sicherung.gs`, kleine Änderungen in `Code.gs` und `Daten.gs`.
4. `texte/datenschutz.txt`: Absätze zu Kontostand (keine Personendaten) und Sicherung (Kopie im privaten Drive, 8 Wochen).

**Prüfen:** `kontoTesten` und `sichernTesten` im Editor, Ergebnis melden. Auslöser einrichten. App läuft wie vorher.

### 11.2 – Feinschliff aus der Prüfung von Etappe 10

Version: 0.33.1. Je nach Anmerkungen. Fällt weg, wenn es keine gibt.

1. Deine Anmerkungen zu Etappe 10.
2. Liste der alten Prüfpunkte (0.26.3, 0.28.9 bis 0.28.13) im Pull Request.

**Prüfen:** Die gemeldeten Stellen.

### 11.3 – GitHub Actions

Version: 0.33.2. Sheet und Skript bleiben unverändert.

1. `.github/workflows/jekyll-gh-pages.yml`: aktuelle Versionen der Actions (Rückfrage 30).
2. `docs/STAND.md`: Punkt in „Offen“ streichen.

**Prüfen:** Nach dem Merge ist die Action grün (ohne Node-20-Warnung) und die Seite ist da.

### 11.4 – Mein Bereich

Version: 0.33.3. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/ich.js` (Rückfragen 27 bis 29). Einstieg in `js/views/mehr.js` und am PC über den Namen unten in der Seitenleiste (`js/ui/nav.js`). Adresse `#/g/<kurzname>/ich`.
2. Neue Schlüssel in `js/store.js`. Zunächst: Name, Abmelden, Platz für die späteren Schalter.
3. Hinweis „Du bist offline“, wenn Rückfrage 3 d „ja“ ist.
4. Anleitung: neue Seite `texte/anleitung/ich.txt`, Eintrag in `liste.txt`.

**Prüfen:** Am Handy über „Mehr“, am PC über den Namen. Name ändern, Abmelden.

### 11.5 – Kontostand in der App

Version: 0.33.4. Sheet und Skript bleiben unverändert (alles in 11.1). Nur, wenn `kontoTesten` geklappt hat.

1. Kasse im Reiter Projekte und Zeile in den Finanzen (Rückfrage 8), Knopf „Jetzt abrufen“ (Rückfrage 7). Nur für Gruppen mit Konto.
2. Anleitung `texte/anleitung/projekte.txt` ergänzen.

**Prüfen:** FFF sieht den Kontostand mit Datum, GP und KB sehen nichts. „Jetzt abrufen“ zweimal hintereinander: Beim zweiten Mal kommt der Hinweis „Gerade erst abgerufen“.

### 11.6 – Erinnerungen „Für dich“

Version: 0.33.5. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/erinnerungen-rechnen.js` (Regeln aus Rückfrage 10, genau beschrieben) und Kachel „Für dich“ auf dem Start (`js/views/start.js`).
   Die Erinnerung zur Kapazität zieht in die Kachel um.
2. Zahl am App-Symbol (Rückfrage 12), Schalter in „Mein Bereich“ (Rückfrage 15).
3. Anleitung `texte/anleitung/start.txt` ergänzen.

**Prüfen:** Mit eigenem Namen ein ToDo mit Frist gestern anlegen: Es steht in „Für dich“. Abhaken: Es verschwindet. Eine Art in „Mein Bereich“ ausschalten: Sie fehlt in der Kachel.

### 11.7 – Sicherung und Daten herunterladen

Version: 0.33.6. Sheet und Skript bleiben unverändert (Sicherung.gs kam in 11.1).

1. „Daten der Gruppe herunterladen“ in „Mein Bereich“ (Rückfrage 18), neue Datei `js/ui/export.js` (CSV-Datei bauen und speichern, auch für 11.8).
2. Neue Datei `docs/SICHERUNG.md` (Rückfrage 19): Wo die Kopien liegen, wie man zurückholt.
3. Anleitung `texte/anleitung/fragen.txt` („Wie sichere ich unsere Daten?“).

**Prüfen:** Am Handy und am PC „Projekte“ und „ToDos“ herunterladen und in Google Sheets öffnen: Umlaute richtig, eine Zeile je Eintrag.
Im Drive nach einer Woche: neue Sicherungskopie da.

### 11.8 – Übersicht, Listen als Datei, Drucken

Version: 0.33.7. Sheet und Skript bleiben unverändert.

1. Neue Dateien `js/views/uebersicht.js` und `js/views/uebersicht-rechnen.js` (Rückfragen 20 und 21). `features.uebersicht` in `js/config.js`, Eintrag in `js/ui/nav.js` und „Mehr“.
2. Knöpfe „⬇ Als Datei“ (Rückfrage 22) über `js/ui/export.js`.
3. Druckansicht (`@media print`) und Knöpfe „🖨 Drucken“ (Rückfrage 23).
4. Anleitung: neue Seite `texte/anleitung/uebersicht.txt`.

**Prüfen:** Übersicht für dieses Jahr: Zahlen passen grob zu dem, was ihr kennt. Packliste eines Projekts drucken (oder als PDF speichern): ohne Leisten, mit Kästchen.

### 11.9 – Dunkelmodus Teil 1: Farben als Variablen

Version: 0.33.8. Sheet und Skript bleiben unverändert.

1. Feste Farben in `css/components.css` und in den `js/`-Dateien auf Variablen umstellen (Rückfrage 26). Das ist eine Ausnahme von „bestehende Regeln nur ändern, wenn es nicht anders geht“
   (`CLAUDE.md` Abschnitt 4): Ohne diese Änderung gibt es keinen Dunkelmodus. Der Pull Request nennt jede geänderte Stelle.
2. Bildschirmfotos aller Reiter und Seiten vorher und nachher (Handy- und PC-Breite) im Testbrowser des Agenten. Nur wenn sie gleich sind, kommt der Pull Request.

**Prüfen:** Alles sieht aus wie vorher.

### 11.10 – Dunkelmodus Teil 2

Version: 0.33.9. Sheet und Skript bleiben unverändert.

1. Dunkle Farben (Rückfrage 25) für `prefers-color-scheme: dark` und den Schalter in „Mein Bereich“ (Rückfrage 24). `theme-color` passt sich an.
2. Kontraste im Testbrowser prüfen (Schrift auf Hintergrund, Gruppenfarben auf Knöpfen).
3. Anleitung `texte/anleitung/ich.txt` und `fragen.txt`.

**Prüfen:** Am Handy das Gerät auf dunkel stellen: Die App ist dunkel. In „Mein Bereich“ „Hell“ wählen: Die App ist hell. Alle Reiter, öffentliche Seiten, Fenster, Kalender, Mobi-Farben.

### 11.11 – Feinschliff, Abschluss

Version: 0.33.10. Sheet und Skript bleiben unverändert (außer eine Anmerkung verlangt es).

1. Gesammelte Anmerkungen der Person.
2. `docs/STAND.md`, Status dieser Datei, `texte/entwicklung.txt` (Etappe 11 zusammengefasst), `CLAUDE.md` (Hilfsmodule `erinnerungen-rechnen`, `export`, Reiter-Liste).
3. Kurzer Abgleich mit `docs/PLAN-ETAPPE-12.md`: Was Etappe 11 neu gebracht hat, kommt dort in die Ausgangslage.

**Prüfen:** Gesamt-Prüfliste von Etappe 11 im Pull Request.

## 7. Regeln und Risiken für Etappe 11

- **Neue Berechtigungen im Skript:** Zeitauslöser, Abruf bei OpenCollective und Drive-Kopien brauchen neue Berechtigungen. Google zeigt dabei eine Warnung („Diese App wurde nicht von Google geprüft“).
  Das ist bei eigenen Skripten normal. Die Liste in 11.1 erklärt jeden Klick.
- **OpenCollective kann sich ändern:** Ändert OpenCollective seine Schnittstelle, bleibt der letzte Stand stehen, und die App zeigt das Datum dazu. Kein Absturz.
- **Sicherungskopien enthalten alles** (auch den Tab `Zugang`). Ordner nie teilen. Die Kopien zählen zum Speicherplatz im Drive.
- **Erinnerungen hängen am Anzeigenamen.** Tippt jemand den Namen anders als im ToDo, fehlt die Erinnerung. Die Kachel sagt das in einem Satz.
- **Dunkelmodus:** größtes Risiko für das Aussehen. Darum zwei Schritte und Bildschirmfotos. Farben aus Daten (Gruppen, Veranstaltungen) können im Dunkeln schlechter lesbar sein; die App wählt die Schriftfarbe dazu schon selbst.
- **Downloads am iPhone:** CSV-Dateien landen in „Dateien“. Der Agent kann das nicht am echten Gerät prüfen.
- **Kein Push, keine E-Mail, keine fremden Dienste** in dieser Etappe (außer dem Abruf des öffentlichen Kontostands durch das Skript).
- **Datenschutz:** Neue Datenarten (Kontostand, Sicherung, Downloads) kommen in `texte/datenschutz.txt`. Dateien in `texte/` sind öffentlich: nichts Internes, keine Ordner-IDs.
- **Nicht vom Agenten prüfbar:** Abruf bei OpenCollective aus dem Skript, Zeitauslöser, Drive-Kopien, Zahl am App-Symbol auf echten Geräten, Downloads und Drucken auf dem Handy der Person.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 11.0 | Plan Fassung 1 mit Rückfragen, Plan 11 → 12 umbenannt | 0.32.11 | nein |
| 11.1 | Plan Fassung 2, Tab `Kontostand`, `Konto.gs`, `Sicherung.gs` | 0.33.0 | **ja** |
| 11.2 | Feinschliff aus der Prüfung von Etappe 10 | 0.33.1 | vielleicht |
| 11.3 | GitHub Actions anheben | 0.33.2 | nein |
| 11.4 | Mein Bereich (und Hinweis „offline“) | 0.33.3 | nein |
| 11.5 | Kontostand in der App | 0.33.4 | nein |
| 11.6 | Erinnerungen „Für dich“, Zahl am App-Symbol | 0.33.5 | nein |
| 11.7 | Daten herunterladen, Anleitung Sicherung | 0.33.6 | nein |
| 11.8 | Übersicht, Listen als Datei, Drucken | 0.33.7 | nein |
| 11.9 | Dunkelmodus Teil 1: Farben als Variablen | 0.33.8 | nein |
| 11.10 | Dunkelmodus Teil 2: dunkle Farben, Schalter | 0.33.9 | nein |
| 11.11 | Feinschliff, Abschluss | 0.33.10 | vielleicht |

Danach: Etappe 12 „Prüfung und Qualität“ (`docs/PLAN-ETAPPE-12.md`, Versionen 0.34.x), dann Version 1.0.

Die Versionen in dieser Tabelle sind die geplanten. Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.
