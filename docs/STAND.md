# STAND – AktionsDeck Landau

Version der App: 0.28.13 (gleich in js/config.js und sw.js: beide Dateien prüfen)
Repo: https://github.com/KlimastreikLandau/aktionsdeck-landau
Seite: https://klimastreiklandau.github.io/aktionsdeck-landau/

## Erledigt
- Etappe 0 und 1 (Fundament), Etappe 2 Material und Ausleihe, Zwischenplan Z1 bis Z8, Etappe 3 ToDos.
- Etappe 4 komplett (0.18.0 bis 0.25.x): Projekte, ToDos und Meilensteine im Projekt, Meilenstein-Vorlagen, Hüte, Material im Projekt, Finanzen, Planung und Abschluss, Learnings, Aufräumen.
- Etappe 5 Start als Zentrale (0.26.0 bis 0.26.3): Umfragen, Schwarzes Brett, Pinnwand, Kommentare, Aktionsideen, Aktionsart. Alle Prüfpunkte bestätigt bis auf 0.26.3 (Pinnwand "Als Mitteilung anheften", Handy-Knöpfe in einer Zeile, Suche unter "Nicht angeheftet", "Ergebnis kopieren": noch zu prüfen).
- Etappe 6 Veranstaltungen und Kalender komplett (0.27.0 bis 0.28.13), siehe unten. Noch zu prüfen: 0.28.9 bis 0.28.13 (Anheften in Farbe, Kalender am Handy, Termine.gs, öffentliche Seite, Aktionskalender, ✕ in Fenstern).
- Das Sheet wurde vor 0.26.0 komplett geleert. Danach sind beim Testen von Etappe 5 und 6 Testeinträge entstanden (Umfragen, Mitteilungen, Kommentare, Ideen, Veranstaltungen, Vorlagen): vor dem Echtbetrieb im Sheet löschen. Der Editor-Lauf `testdatenListe` (Aufraeumen.gs) zeigt sie mit Zeilennummern.

## Etappe 6 (Veranstaltungen und Kalender), Stand 0.28.13
- Tabs und Spalten: Veranstaltungen (titel, art intern|extern, datum, datum_ende, zeit_von, zeit_bis, ort, beschreibung, veranstalter, link, oeffentlich, farbe), Termin_Vorlagen (name, art, wochentag, zeit_von, zeit_bis, ort, beschreibung). Neue Spalte farbe in Kommentare und Mitteilungen (für angeheftete Veranstaltungen). Neue Spalten im Tab Gruppen: webseite, instagram, weitere_links (öffentlich; weitere_links durch Leerzeichen getrennt, höchstens 5). Schema.gs und js/schema.js sind angepasst. Feldtypen "zeit" und "farbe" in js/ui/form.js.
- js/views/kalender-rechnen.js: baut die Terminliste (Veranstaltungen, öffentliche Termine anderer Gruppen, Projekt-Aktion, Deadline, Projektbalken, Meilensteine, ToDo-Fristen). Nichts wird gespeichert.
- js/views/kalender.js: Ansichten Liste, Monat (Startansicht) und Aktionskalender. Ansicht, Monat, Tag, Filter und Filter-Auf/Zu bleiben beim Reiterwechsel im Merker (an das Token gebunden). Filter: Intern, Extern, Projekte, Deadlines, Meilensteine, ToDos, Nur meine ToDos, Archiv-Projekte, Öffentliche Termine anderer Gruppen (Standard aus; Klick auf so einen Termin öffnet ein Info-Fenster). Am Handy klappt ein Trichter-Symbol neben der Suche die Filter auf, am PC sind sie immer sichtbar. Suche.
- Kopf des Kalenders: "Kalender" links und Archiv rechts. Darunter links Liste, Monat, Aktionskalender, rechts Vorlagen und + Veranstaltung, alles in einer Zeile. Archiv zeigt alle vergangenen Termine grau mit Suche.
- Liste: Kommende nach Monaten. Überfällige offene ToDos und Meilensteine bleiben bei Kommende (rot). Kacheln für externe, noch nicht veröffentlichte Veranstaltungen nur in der Liste (Haken "Veröffentlichen" speichert sofort).
- Veranstaltung anlegen/ändern/löschen mit Uhrzeit, mehreren Tagen, freier Farbe (leer = Gruppenfarbe). "Veröffentlichen" nur bei extern (bei intern wird FALSE gespeichert); das Formular warnt, dass der Text öffentlich wird. Ganzer Kasten in Veranstaltungsfarbe mit 📅. Deadline ⏰ (Pastell-Kasten), ToDos ✅, Meilensteine 🏁. Projekte in Planung nie im Kalender. Abgeschlossene Projekte nur mit Filter Archiv-Projekte (grau).
- Monat: Kopf in einer Zeile (Handy: ‹ Monat › und Heute links, 📅 rechts; PC: Monat mittig, Heute und 📅 rechts). Veranstaltungen im Tag oben und in Farbe (Handy: Streifen über die ganze Tagesbreite, übrige Termine als Punkte). Projektbalken in festen Bahnen (höchstens 3). Deadline-Abschnitt pink. Ab 600 px öffnet ein Klick auf einen Tag ein großes Fenster mit allen Terminen. Die Tagesliste bleibt immer. Knopf "+ Veranstaltungen an diesem Tag".
- Termin-Vorlagen (js/views/kalender-vorlagen.js): je Gruppe, "Termin anlegen" füllt das Formular (nächster Wochentag). Standard: Plenum FFF (Donnerstag 18:30), Plenum GP (Dienstag 19:00), beide KHG, Moltkestraße 9, Landau. KB braucht keine.
- Anheften (Regel): gruppeneigene externe Veranstaltung (art extern, Veranstalter leer) = Mitteilung am Schwarzen Brett ("Als Mitteilung anheften"). Interne oder fremde (extern mit Veranstalter) = Kommentar an der Pinnwand ("An Pinnwand heften", bezug_art pinnwand). Beide mit Doppelt-Prüfung und Farbe. Pinnwand-Kasten in Veranstaltungsfarbe; Mitteilung behält ihr Layout, bekommt aber linken Rand und Pastell-Hintergrund in der Veranstaltungsfarbe. Wird ein Pinnwand-Kasten zur Mitteilung (Kommentare.angeheftet = TRUE, nur bei Kommentaren mit Farbe), verschwindet er von der Pinnwand. Die Spalte Kommentare.angeheftet WIRD benutzt (kommentare.js, start.js).
- Skript Termine.gs (ohne Login): Aktion termine als POST (App) und GET (`...exec?aktion=termine[&gruppe=fff][&format=ics]`). Nur art extern und oeffentlich TRUE, nur kommende (mehrtägige bis zum letzten Tag), nur aktive Gruppen. Felder: titel, datum, datum_ende, zeit_von, zeit_bis, ort, beschreibung, veranstalter, link, gruppe_name, kurzname, farbe, gruppe_web, gruppe_instagram, gruppe_links. Keine IDs, Bearbeiter, Zeitstempel. Es gibt EINEN Zwischenspeicher-Eintrag "termine_alle" (2 Minuten), der Gruppenfilter läuft danach im Speicher. Gruppenfilter nur [a-z0-9_-], höchstens 30 Zeichen. Kalender-Datei (.ics) mit maskierten Sonderzeichen. Editor-Tests: testenTermine, testenTermineSicher.
- Öffentliche Seite #/termine (ohne Login) und Aktionskalender im Reiter Kalender: derselbe Inhalt aus js/views/termine-liste.js (baueAktionskalender). Feste Kacheln (Datum, Titel, Uhrzeit, Ort, Gruppe; fehlende Angaben bleiben als Leerzeile) in Veranstaltungsfarbe, nach Monaten (PC drei Spalten). Klick öffnet ein Detailfenster (Veranstaltungslink, Webseite, Instagram und weitere Links der Gruppe). Für Angemeldete gibt es den Anheften-Knopf auf der Kachel und im Fenster. Gruppen-Auswahl nur bei Terminen von mindestens zwei Gruppen. Abo-Adresse (Kalender per URL) mit Gruppenfilter. Vergangene Termine werden auch in der App sofort ausgeblendet.
- Gruppenwahl: linke Seitenleiste "Öffentliche Termine" (Rahmen, oberer Strich dunkelgrau #1a1e20, am PC fest/sticky, Handy unter den Gruppen). Die nächsten 8 Termine, darunter "Alle Termine →". Mit Terminen liegen die Gruppen am PC zu zweit pro Reihe, ohne Termine zu dritt. Ohne Termine ist keine Leiste da.
- Was ist neu?: Veranstaltungen sind eine Quelle (nur kommende, nur von anderen, Abschnitt "Veranstaltungen").
- Alle Fenster (fenster.js, modal.js bei Name ändern, material-buchen.js, material-vormerken.js) haben oben rechts ein ✕ (xKnopf aus js/ui/fenster.js). Der Detailbereich der Reiter ToDos und Material hat den Knopf "← Zurück".
- nav.js: Klick auf "Mehr" im Kalender, Posts oder Hilfe öffnet die Übersicht (beiAktiv nur, wenn der Reiter wirklich "mehr" ist).
- 6.9 erledigt: Sicherheitsprüfung Termine, Test, Aufräumen (Testdaten-Liste), siehe oben.
- Nächster Schritt: Etappe 7 Mobi.
- Wunsch für Etappe 7: Wichtige Veranstaltungen (werden schon über Pinnwand oder Mitteilung angeheftet) sollen in Mobi als Story einplanbar sein.
- Mobi-Kalender (Etappe 7) nutzt dieselbe Logik (kalender-rechnen.js) mit voreingestelltem Filter.

## Plan Etappen 7 bis 11
Neue Reiter: Start, Projekte, ToDos, Material, Mobi, Veranstaltungen, Team, Wiki. "Posts" wird Mobi, "Hilfe" wird Wiki, der Reiter Kalender entfällt (Kalender steckt in Mobi und Veranstaltungen). Untere Leiste am Handy bleibt: Start, Projekte, ToDos, Material, Mehr.
- Etappe 7 Mobi: Planung je Projekt, Meilenstein-Vorlage "Mobi", Analyse (Zielgruppe, Art der Werbung), Uploadplan als Liste und im Kalender mit markierten Deadlines. Wichtige Veranstaltungen als Story einplanbar. Kommentare mit Zahl-Markierung wie bei ToDos (baueKommentare, kommentarZahlen, kommentarMarke).
- Etappe 8 Protokoll, Reden, Learnings: Dauerprotokoll Variante B (Formular in der App, Entwurf laufend auf dem Gerät gesichert, beim Speichern an das Drive-Dokument anhängen, Vorschläge für ToDos zum Abhaken); Variante A später kombinierbar. Reden-Archiv mit Link zum Drive-Dokument, Probelesen über die Kommentare. Learnings aus dem Protokoll als Vorschlag. Im Protokoll lassen sich Mitteilungen und Kommentare per Symbol oder Tag einbinden (Wunsch des Nutzers).
- Etappe 9 Team: Reiter Team, Hüte pro Person, Kapazität 1 bis 10 mit Gültigkeitsdatum, Diagramm "Berg". Angaben sind für die Gruppe sichtbar, Zuordnung über den Anzeigenamen.
- Etappe 10 Wiki und öffentliche Seiten: Wiki mit Bereich nur mit PIN (App-Anleitung, Skillshare) und öffentlichem Bereich. Impressum, Info, Datenschutz (Texte aus 6.1). Die Seite #/termine gibt es schon.
- Etappe 11 Komfort: OpenCollective-Kontostand (nur Klimastreik Landau, https://opencollective.com/klimastreik-landau, einmal pro Woche per Skript; erst testen, noch keine Zusage). Erinnerungen und Push so planen, dass sie später auf Push oder E-Mail aufsetzen können (Umfragen, überfällige ToDos, Pinnwand-Kommentare). Sicherung, Übersicht und Export, Dunkelmodus, Feinschliff, GitHub-Actions-Versionen anheben.
- Neue Sheet-Tabs für spätere Etappen: Mobi_Plan, Reden, Kapazitaet, Wiki. Jede Etappe nennt vorher, was im Sheet und Skript zu ergänzen ist und wann neu bereitgestellt wird.

## Festlegungen Start als Zentrale (Etappe 5)
- Tabs und Spalten (Schema.gs und js/schema.js): Umfragen (frage, optionen, ablauf_am, mehrfach, beendet, namentlich), Umfrage_Antworten (umfrage_id, person, auswahl), Mitteilungen (titel, text, angeheftet, farbe), Ideen (titel, beschreibung, aktionsart, projekt_id), Kommentare (projekt_id, bezug_art, bezug_id, text, angeheftet, farbe), Projekte zusätzlich aktionsart. Kommentare gehören nicht zu PROJEKT_PFLICHT (Pinnwand ohne Projekt). BOOL_SPALTEN enthält mehrfach, angeheftet, beendet, namentlich, oeffentlich.
- Kommentare (js/ui/kommentare.js): baueKommentare({ ctx, token, art ('todo'|'pinnwand'|...), bezugId, projektId, titel, platzhalter, leerText, neuesteZuerst, max, beiAenderung, alsMitteilung }) gibt { el, laden } zurück. Pinnwand auf dem Start (art pinnwand, bezugId leer, max 30) hat je Kommentar "Als Mitteilung anheften" (öffnet das Mitteilungs-Formular vorausgefüllt, mit Farbe) und "Löschen". Kommentare mit Farbe sind Veranstaltungen und werden als farbiger Kasten gezeigt. ToDo-Kommentare: nur "Löschen". Im ToDo-Detail (todos.js) und im Bearbeiten-Fenster des ToDos im Projekt (projekt-todos.js). Kommentar-Zahl als Marke "💬 n" (todos-rechnen.js: kommentarZahlen, kommentarMarke) in der ToDo-Tabelle, den Karten und den ToDos im Projekt, nicht auf dem Start.
- Umfragen (js/views/start-umfragen.js): Kachel zeigt nur laufende Umfragen, je eine Zeile. Klick öffnet ein Fenster (Abstimmen, Ergebnis mit Balken). Beendet wird NUR von Hand (Spalte beendet), danach Archiv. Frist (ablauf_am) beendet nichts: heute orange, überfällig rot, sonst leicht grün. Beendete Umfragen: Ergebnis als Text, bei namentlich mit Namen, Knopf "Ergebnis kopieren", "Wieder öffnen". Anonym ist Standard. Hat schon jemand abgestimmt, sind Antworten und "namentlich" nicht mehr änderbar. Eine Stimme je Anzeigename. Das Ablaufdatum sperrt nur in der App.
- Schwarzes Brett (js/views/start-brett.js): Kachel zeigt nur ANGEHEFTETE Mitteilungen. Neue sind angeheftet. Nicht angeheftete stehen im Archiv (neueste 10, Suche für alle). Mitteilungen mit Farbe (Veranstaltung) zeigen Rand und Pastell-Hintergrund in dieser Farbe. Alle mit dem Gruppen-PIN dürfen alles löschen.
- Start-Kopf: "Hallo Name" mit "+ Umfrage", "+ Mitteilung", "Archiv (n)" und Glocke "Was ist neu?" (js/ui/neu-seit.js, letzter Besuch pro Gerät und Gruppe in store.js). Quellen: Umfragen, Mitteilungen, Veranstaltungen, Kommentare, Projekte (mit Meilensteinen und ToDos), ToDos ohne Projekt. Eigene Änderungen stehen nicht drin. Darunter Umfragen und Brett, Kacheln Projekte und ToDos, ganz unten die Pinnwand.
- Aktionsideen (js/views/ideen.js): Aufklapper im Reiter Projekte. "Als Projekt starten" legt ein Projekt in Planung an. Die Idee BLEIBT in der Liste.
- Aktionsart: Feld im Projekt (Vorschläge aus Projekten, Learnings, Ideen). Im aufgeklappten Projekt stehen rechts Toggler "Learnings" und "Aktionsideen" mit derselben Aktionsart.
- Material: "Auch vorgemerkt für ..." nennt nur AKTIVE Projekte. Vormerkungen senken die Verfügbarkeit nie.
- Start: Projekte mit Status Planung stehen nicht in der Kachel Projekte.
- Vorschlagslisten (datalist in form.js): höchstens 30 Einträge, je höchstens 40 Zeichen.

## Festlegungen Projekte (Etappe 4)
- Tabs und Spalten: Projekte (titel, beschreibung, ort, status planung|aktiv|erledigt|archiviert, start_datum, aktionsdatum, deadline, budget_geplant, aktionsart), Meilensteine (projekt_id, titel, datum, verantwortlich, erledigt), Projekt_Material (projekt_id, material_id, name, kategorie, menge, beschaffung vorhanden|kaufen|mieten|leihen, beschafft, notiz), Finanzen (projekt_id, projekt_material_id, posten, art, menge, einzelpreis, betrag_geplant, betrag_tatsaechlich, bezahlt, bezahlt_von, datum, beleg_id), Learnings (projekt_id, aktionsart, text), Protokolle, Posts, Vorlagen_ToDo, Projekt_Team (wird nicht mehr benutzt, bleibt im Sheet).
- ToDos haben zusätzlich meilenstein_id.
- Skript: Aktionen listMehrere, projektLoeschen (prüft zuerst Material draußen, Fehlercode "draussen"; löscht weich alle abhängigen Tabs; Learnings bleiben), buchen mit projekt_id je Position (Rückgabe pro Projekt geprüft), delete auf Projekte gesperrt.
- Reiter Projekte (js/views/projekte.js): Übersicht "Laufende Projekte", Learnings und Aktionsideen als Aufklapper, Filter, Archiv-Knopf, aufklappbare Blöcke. Aktive oben, "In Planung" als Aufklapper ganz unten. Teile im Block: ToDos (mit Meilensteinen und "Offene Hüte"), Material, Finanzen, Learnings. Aufklapp-Zustand bleibt beim Reiterwechsel. Sprung per #/g/<kurzname>/projekte/<projekt-id>. Zwischenspeicher gruppe_id:projekte.
- Abschließen: gesperrt, wenn festes Material für das Projekt draußen ist. Warnung bei offenen ToDos und nicht beschafftem Material. Status erledigt = Archiv. Verbrauchsmaterial sperrt nicht.
- Hüte: offenes ToDo OHNE Verantwortliche (js/views/todos-hut.js: istOffenerHut, huetKnoepfe). "Offene Hüte" (Projekt), "Noch offen" (Reiter ToDos).
- Meilenstein-Vorlagen: fest in js/vorlagen.js (Mobi, Pressearbeit, Genehmigung und Anmeldung, Material und Aufbau, Nachbereitung). tage_vorher = Tage vor dem Meilenstein-Datum (negativ = danach). Die Tage sind Platzhalter, nur die Mobi-Schritte stammen vom Nutzer.
- Material im Projekt (projekt-material.js): Positionen, Haken "beschafft", "+ Aus Bestand", "+ Eigene Position", Ausleihen, Zurückgeben. Komplette Rückgabe löscht die Position. Verbrauchsmaterial mit 0 zurück = alles verbraucht.
- Finanzen (projekt-finanzen.js): Posten, Haken bezahlt, Summen, Geplant leer = Menge mal Einzelpreis, "Aus Material übernehmen". Geld läuft über OpenCollective, kein Foto-Upload für Belege.
- Learnings (projekt-learnings.js): Aktionsart frei mit Vorschlägen, Teil im Projekt und Übersicht nach Aktionsart.
- Aufräumen (apps-script/Aufraeumen.gs, nur Editor): aufraeumenTesten, aufraeumen (löscht geloescht=TRUE älter als 90 Tage und Log älter als 180 Tage), testzeilenAnzeigen, testdatenListe. Einmal im Halbjahr. Keine neue Bereitstellung nötig.
- Löschen in der App = geloescht TRUE (nur ausgeblendet).

## Festlegungen ToDos (Etappe 3)
- Tab ToDos: id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, projekt_id, post_id, text, verantwortlich, faellig_am, erledigt, erledigt_am, erledigt_von, prioritaet, sortierung, details, meilenstein_id.
- "text" = Titel, "details" = weitere Informationen. Reiter ToDos: offene oben, Tabelle "Erledigt, letzte 2 Wochen", Knopf Archiv (Regel erledigt_am, sonst geaendert_am, 14 Tage).
- Datumsformate lesbar (normDatum). Überfällig rot, heute orange.
- Filter: Suche, Verantwortlich, Fälligkeit, Priorität, Nur meine. Abhaken ohne Konfliktprüfung. Bearbeiten prüft Konflikt (bekannt = geaendert_am). Aktualisierung alle 45 Sekunden.
- Start-Kachel ToDos zeigt nur allgemeine ToDos (ohne projekt_id und post_id).
- Rechenhelfer js/views/todos-rechnen.js.

## Festlegungen Material und buchen
- Festes Material: anzahl = Bestand, ausgeliehen = mitgenommen - zurueck - defekt. Verbrauchsmaterial: anzahl = Vorrat, Mitnehmen senkt, Rückgabe erhöht, kein "defekt".
- buchen: { art, person, datum, projekt_id, notiz, positionen:[{material_id, anzahl, defekt, projekt_id}] }, max. 100. Fehlercodes: ungueltig, zuwenig, nicht_gefunden, beschaeftigt. Ausleihe wird nur über buchen geschrieben.
- Vormerken (material-vormerken.js): Zeile in Projekt_Material, nur Planung, senkt die Verfügbarkeit nicht.
- Foto-Upload: Browser verkleinert auf 1000 px, Skript prüft JPEG, speichert im Drive-Ordner FOTO_ORDNER_<gruppe_id>.

## Gruppen und Farben
- g1/fff, g2/gp, g3/kb. Logos icons/gruppen/<kurzname>.svg (Ersatz .png, dann icons/logo.svg). Gruppenliste liegt in localStorage. Der Tab Gruppen hat zusätzlich webseite, instagram, weitere_links (öffentlich).
- AktionsDeck Dunkelgrau #1a1e20, Dunkelgrün #368469. FFF #1b7340; GP #70bd1c; KB #165834 (außerdem #2fa142, #0894ad). Hintergrund #dfe8e4. CSS-Variablen --gruppe, --gruppe-text, --gruen, --gruen-hell, --hintergrund.

## Oberfläche (Stand)
- Reiter aktuell: Start, Projekte, ToDos, Material, Posts, Kalender, Hilfe (Umbenennung siehe Plan). Handy: Start, Projekte, ToDos, Material, Mehr.
- Meldungen (toast) mittig. Projekte, Start, Kalender und Material-Dialoge nutzen Fenster (js/ui/fenster.js, zeigeFenster(titel, inhalt, beiZu, { aussenKlick }), mit ✕ oben rechts). Reiter ToDos und Material nutzen den Detailbereich rechts.
- Öffentliche Seiten ohne Login: #/info/<seite> (Impressum, Info, Datenschutz, Texte kommen in 6.1/Etappe 10) und #/termine.

## Offen
- GitHub Actions: Warnungen (Node 20 veraltet). ubuntu-latest wechselt ab 19.10.2026 auf Ubuntu 26. Läuft, Action-Versionen in .github/workflows später anheben.
- Sicherheitstest 1.8 nur teilweise (Abmelden-Test und Sperre; Ergebnis nicht gemeldet).
- Mögliche Ursache für einmalige Fehler "Cannot read properties of undefined (reading 'forEach')": beschädigte Kopfzeile in einem Sheet-Tab.
- GitHub Pages hält Dateien bis zu ca. 10 Minuten im Zwischenspeicher: warten und zweimal neu laden.
- Der Reiter Projekte lädt neun bis zehn Tabellen auf einmal und kann langsam sein. Bei Bedarf Material und Finanzen erst beim Aufklappen laden.
- Testdaten aus Etappe 5 und 6 im Sheet vor dem Echtbetrieb löschen (testdatenListe im Editor).
- Das Kalender-Abo (Skript-Adresse mit Weiterleitung) in Google und Apple Kalender noch testen. Notfalls feste ICS-Datei auf GitHub Pages.
- Alte, nicht mehr genutzte CSS-Regeln (.kal-pfeil, .kal-nav, .kal-datum, .kal-monat-kopf) stören nicht, können später entfernt werden.
- Am Handy könnten die fünf Kalender-Knöpfe auf sehr schmalen Geräten eng werden. Bei Bedarf "Aktionskalender" kürzen.

## Dateiübersicht
- index.html, manifest.webmanifest, sw.js, icons/, css/ (base, layout, components; Blöcke bis 0.28.13 am Ende)
- apps-script/: Code.gs, Auth.gs, Daten.gs, Schema.gs, Util.gs, Ausleihe.gs, Upload.gs, Aufraeumen.gs, Termine.gs (Setup.gs nur im Editor)
- js/: app.js, config.js, api.js, store.js, cache.js, schema.js, vorlagen.js
- js/ui/: dom, toast, modal, nav, table, detail, form, logo, kopf, bild, lightbox, fenster, balken, kommentare, neu-seit
- js/views/: gruppen, login, start, start-umfragen, start-brett, mehr, info, hilfe, platzhalter, material, material-detail, material-rechnen, material-buchen, material-vormerken, todos, todos-rechnen, todos-abhaken, todos-hut, projekte, projekt-rechnen, projekt-todos, projekt-material, projekt-finanzen, projekt-learnings, ideen, kalender, kalender-rechnen, kalender-vorlagen, termine, termine-liste
- Noch nicht vorhanden: posts/mobi, Team, Wiki, Protokoll.

## Hinweise
- config.js enthält die echte API_URL: nie ersetzen, nur VERSION ändern.
- Neue Dateien immer in sw.js (HUELLE) eintragen, gelöschte austragen. Dateien in HUELLE müssen im Repo existieren.
- Skript geändert = neue Bereitstellung (Bereitstellen, Bereitstellungen verwalten, Stift, Neue Version). Neue Sheet-Spalte oder neuer Tab: erst im Sheet ergänzen (Kopfzeile von Hand tippen, ohne unsichtbare Zeichen), dann Schema.gs (Editor und GitHub), dann formatieren() ausführen (nur bei neuen Text-Spalten nötig), dann neu bereitstellen.
- Skripteigenschaften (nur im Editor): TOKEN_GEHEIMNIS, FOTO_ORDNER_g1, g2, g3.
- Nach jedem Commit: Actions grün abwarten, Seite zweimal neu laden.
- Ein Syntaxfehler in einer Datei lässt den Reiter auf "Dieser Reiter ist noch in Arbeit" zurückfallen (app.js lädt jeden Reiter als Modul). Bei diesem Symptom zuerst die zuletzt geänderten Dateien auf fehlende oder doppelte Klammern und übrig gebliebene Reste wie "..." prüfen, vor allem `});` und `}, s.token);`.
- In Util.gs gibt es schon eine Funktion aus(): in neuen Skriptdateien keine Variable so nennen. Hilfsfunktionen in Termine.gs beginnen mit t oder ics.
- Zwischenspeicher je Reiter: ladeMitCache(key, ladeFn, anzeigen, zuerstCache), Schlüssel gruppe_id:<name> (Start: :todos, :projekteliste, :startextra; Kalender: :kalender). Öffentliche Termine: Schlüssel oeffentlich:termine. Ältere Zwischenspeicher können neue Felder noch nicht enthalten: in zeigen() Fehlendes ergänzen.
- Formulare: js/ui/form.js (Feldtypen text, zahl, datum, zeit, farbe, langtext, auswahl, bool, foto). Listen: zeigeListe in js/ui/table.js.
- Arbeitsweise im Chat: neue Dateien ganz, bei bestehenden Dateien nur die zitierten Änderungen (erste und letzte Zeile des Bereichs, vollständig mit Klammern und Semikolons), CSS ans Ende anhängen. Am Ende Prüfliste und Tabelle "Wenn etwas nicht klappt". Der Nutzer arbeitet nur im Browser, Konsole gesperrt, und sammelt Anmerkungen zur Anzeige.
