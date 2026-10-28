# Plan Etappe 11: Komfort (Fassung 2, 28.10.2026)

Diese Datei ergänzt `docs/STAND.md`. Bei Widerspruch gilt `docs/STAND.md`, und du meldest den Widerspruch im Pull Request.
Regeln für die Arbeit stehen in `CLAUDE.md`.

**Status: fertig gebaut (Schritt 11.10, Version 0.33.12, 28.10.2026).** 11.1 bis 11.8a von der Person geprüft. Nachgeschoben: 11.4a (gelbe Kachel „Für dich“), 11.8a (Anmerkungen zum Dunkelmodus), Signal-Knopf in 11.9 (0.33.11) und 11.10 (öffentliche Termine nach Veranstalter, Wunsch der Person), darum endet die Etappe mit 0.33.12 statt 0.33.8.
Frühere Status-Zeile: **Fassung 2 (Schritt 11.1, Version 0.33.0).** Die Antworten der Person vom 28.10.2026 stehen in Abschnitt 3.
Fassung 1 (24.10.2026, 31 Rückfragen) ist im Git-Verlauf dieser Datei nachzulesen. Kleine offene Fragen stehen in Abschnitt 4. Sie halten den Bau nicht auf,
nur die Schritte, die sie betreffen.

Danach kommt **Etappe 12** „Prüfung und Qualität“ (`docs/PLAN-ETAPPE-12.md`), der letzte Schritt vor Version 1.0.

## 1. Ziel

Die App soll im Alltag bequemer werden. Nach den Antworten bleiben diese Punkte:

1. **Kontostand von OpenCollective** (nur Fridays for Future, Konto `klimastreik-landau`): Kontostand und Datum im Teil Finanzen der Projekte. Nur zum Anschauen.
2. **Reiter „Cloud“ für Fridays for Future:** ein eigener Reiter, der auf die Cloud der Gruppe verlinkt. Andere Gruppen sehen ihn nicht.
3. **Erinnerungen „Für dich“** auf dem Start: Umfragen, Material, Kapazität. Dazu eine Zahl am App-Symbol.
4. **Jahresübersicht:** eine Seite mit einem Aufklapper je Jahr, erreichbar über einen Knopf im Archiv der Projekte.
5. **Drucken:** Material und ToDos eines Projekts.
6. **Dunkelmodus:** Standard wie das Gerät, dazu ein Schalter.
7. **GitHub Actions** auf neue Versionen heben.
8. **Feinschliff** mit den gesammelten Anmerkungen.

Gestrichen (Antworten 2, 3, 13 bis 18, 22, 27): Mein Bereich, Suche über alle Reiter, Teilen, Start anpassen, Hinweis „offline“, Push, E-Mail,
Abschalten von Erinnerungen, Sicherungskopien des Sheets, Daten herunterladen, Listen als Datei. Ein Verlauf des Kontostands wird nicht gespeichert.

## 2. Ausgangslage (im Repo geprüft am 28.10.2026, Version 0.32.16)

`js/config.js` und `sw.js` haben beide `0.32.16`, wie `docs/STAND.md`. Mit 11.1 wird es 0.33.0.

- **Etappe 10 ist fertig und geprüft** (Gesamt-Prüfliste am 27.10.2026, Anmerkungen umgesetzt in 10.11 bis 10.13, Pull Requests #56, #58, #59).
  Offen ist nur noch der Test des Kalender-Abos durch die Person (siehe `docs/STAND.md`, „Offen“). Der geplante Schritt „Feinschliff Etappe 10“ entfällt darum.
- **Finanzen im Projekt** (`js/views/projekt-finanzen.js`): Posten, Summen, Haken „bezahlt“. Der Text sagt schon: „Das Geld selbst läuft über OpenCollective, hier steht nur die Übersicht.“
- **Skripteigenschaften** werden schon für Gruppen-Angaben genutzt (zum Beispiel `FOTO_ORDNER_<gruppe_id>`, `PROTOKOLL_LINK_<gruppe_id>`). Kontostand und Cloud-Link kommen auch dorthin.
  So braucht es **keine Änderung am Sheet**, und die Cloud-Adresse steht nicht im öffentlichen Repo.
- **Kein Zeitauslöser und kein Abruf von außen** gab es bisher im Skript. `Konto.gs` bringt beides. Google fragt dafür einmal nach neuen Berechtigungen.
- **Start:** Die Erinnerung zur abgelaufenen Kapazität gibt es schon (`js/views/start.js`, seit 9.7). Sie zieht in die Kachel „Für dich“ um.
- **Farben:** In `css/components.css` stehen noch viele feste Farbwerte, und mehrere Dateien in `js/` setzen Farben direkt. Ein Dunkelmodus muss sie erst auf Variablen umstellen.
- **GitHub Actions** (`.github/workflows/jekyll-gh-pages.yml`): `actions/checkout@v4`, `configure-pages@v5`, `jekyll-build-pages@v1`, `upload-pages-artifact@v3`, `deploy-pages@v5`. Warnungen wegen Node 20.

## 3. Entscheidungen (Antworten vom 28.10.2026)

Die Nummern sind die der Rückfragen aus Fassung 1.

1. Etappe 10 ist fertig (siehe Abschnitt 2). Kein eigener Schritt „Feinschliff Etappe 10“ mehr.
2. „Konto“ heißt: **Kontostand bei OpenCollective**. Keine Einzelkonten, **kein „Mein Bereich“**.
3. Neu: **ein eigener Reiter für FFF, der auf die Cloud verlinkt.** Die anderen Ideen (Suche, Teilen, Start anpassen, Hinweis „offline“) kommen nicht.
4. Reihenfolge an die Antworten angepasst (Abschnitt 6). Dunkelmodus „per Gruppe“ (siehe Abschnitt 4, Frage B).
5. Kontostand zuerst **nur für FFF** (`g1`), über die Skripteigenschaft `OC_KONTO_g1 = klimastreik-landau`. Eine weitere Gruppe braucht später nur eine neue Eigenschaft.
6. Nur **Kontostand und Datum**. Kein Verlauf, keine Buchungen, keine Namen. „Soll nur optisch sein.“
7. **Einmal pro Woche automatisch** (Zeitauslöser, Montag früh) und ein Knopf **„Jetzt abrufen“** (ruft höchstens einmal pro Stunde wirklich ab).
8. Der Kontostand steht **im Teil Finanzen der Projekte**. Nicht auf dem Start, nicht öffentlich.
9. Erst testen mit der Editor-Funktion `kontoTesten`, dann der Teil in der App.
10. Erinnerungen nur für **Umfragen** (laufend, noch nicht abgestimmt), **Material** (für ein Projekt mitgenommen, Aktion vorbei, noch nicht zurück) und **Kapazität** (abgelaufen).
11. Kachel **„Für dich“** ganz oben auf dem Start, nur wenn es etwas gibt.
12. **Zahl am App-Symbol:** ja.
13. **Kein Push.** Auch keine eigene Beschreibung für ein späteres Push („kein Datenmüll“).
14. Keine E-Mail.
15. Kein Abschalten der Erinnerungen, kein eigener Bereich dafür.
16. Keine Sicherungskopien des Sheets durch das Skript.
17. Stattdessen in Etappe 12: als eigener Punkt der Sicherheitsprüfung kontrollieren, **was kaputt gehen könnte** (Datenverlust) und wie man es von Hand zurückholt.
18. Kein Download der Daten aus der App.
19. Wiederherstellen **nur von Hand** (Versionsverlauf des Sheets). Ein Absatz dazu steht seit 11.1 in der Anleitung „Für Admins“.
20. **Übersicht** wie vorgeschlagen (Projekte, Veranstaltungen, Mobi, ToDos, Geld, Material, Dokumentation), ohne Kontostand-Verlauf.
21. Die Übersicht liegt **im Reiter Projekte beim Archiv**: ein Knopf über die volle Breite führt zu einer Seite (nur für die Gruppe) mit einem **Aufklapper je Jahr**. Das laufende Jahr steht immer offen über den Aufklappern.
22. Keine Listen als Datei.
23. **Drucken nur für Material und ToDos eines Projekts.**
24. Dunkelmodus: Standard **wie das Gerät**. Dazu ein **Schalter in „Mehr“, Bereich Einstellungen, unter „Abmelden“**.
25. Farben im Dunkelmodus wie vorgeschlagen.
26. Zwei Schritte (erst Farben als Variablen ohne sichtbare Änderung, dann der Dunkelmodus).
27. Kein eigener Bereich.
28. (betraf „Mein Bereich“, entfällt)
29. Beim Abmelden bleibt die Einstellung hell oder dunkel erhalten.
30. (keine Antwort) GitHub Actions wie vorgeschlagen als kleiner eigener Schritt, früh.
31. (keine Antwort) Feinschliff am Ende mit allen gesammelten Anmerkungen. Die alten Prüfpunkte sind am 27.10.2026 bestätigt.

## 4. Kleine offene Fragen (Fassung 2)

**Beantwortet am 28.10.2026:** A wie vorgeschlagen (Reiter „Cloud“, Knopf „Cloud öffnen →“ im neuen Tab, am PC nach Wiki). B **je Gerät**, nicht je Gruppe: ein Schlüssel `aktionsdeck_darstellung` für alle Gruppen. C am PC in der Seitenleiste **unter „Name ändern“ und „Abmelden“**.

- **A. Reiter Cloud:** Wie soll er heißen („Cloud“ mit ☁️?), und was passiert beim Antippen?
  *Vorschlag:* Der Reiter zeigt eine kurze Seite mit dem großen Knopf **„Cloud öffnen →“** (neuer Tab) und einem Satz, wofür die Cloud da ist.
  Am PC in der Seitenleiste nach „Wiki“, am Handy unter „Mehr“. Die Adresse trägst du als Skripteigenschaft `CLOUD_LINK_g1` ein (beginnt mit `https://`).
  So steht sie nicht im öffentlichen Repo. Betrifft Schritt 11.3.
- **B. Dunkelmodus „per Gruppe“:** Was ist gemeint?
  *Vorschlag:* Die Einstellung (Wie das Gerät, Hell, Dunkel) wird **je Gruppe auf dem Gerät** gemerkt. Wer in zwei Gruppen ist, kann sie verschieden einstellen.
  Die öffentlichen Seiten und die Gruppenwahl folgen immer dem Gerät. Betrifft Schritt 11.8.
- **C. Schalter am PC:** „Mehr“ gibt es nur am Handy.
  *Vorschlag:* Am PC steht derselbe Schalter unten in der Seitenleiste unter „Abmelden“. Betrifft Schritt 11.8.

## 5. Datenmodell

**Keine Änderung am Sheet** in dieser Etappe. Alles andere wird aus den vorhandenen Daten berechnet oder auf dem Gerät gespeichert.

**Skripteigenschaften** (im Editor: Projekteinstellungen → Skripteigenschaften; keine Geheimnisse):
- `OC_KONTO_g1 = klimastreik-landau` (trägt die Person ein).
- `CLOUD_LINK_g1 = https://…` (trägt die Person ein, wenn Frage A geklärt ist).
- `KONTO_STAND_<gruppe_id>`: der letzte Stand als kurzer Text, **schreibt nur das Skript**.

**Neue Skriptdatei** `apps-script/Konto.gs` (seit 11.1):
- `kontoTesten` (nur Editor, schreibt nichts, zeigt den Stand im Protokoll), `kontoAbrufen` (für den Zeitauslöser), `kontoAusloeserEinrichten` (legt den Auslöser einmal an, kein doppelter).
- Aktion `gruppeInfo` (mit Login): Kontostand und Cloud-Link **der eigenen Gruppe**.
- Aktion `kontoAktualisieren` (mit Login, Knopf „Jetzt abrufen“): höchstens einmal pro Stunde ein echter Abruf, sonst der gemerkte Stand.
- Abruf über die öffentliche Schnittstelle von OpenCollective (`https://api.opencollective.com/graphql/v2`, ohne Schlüssel): nur Kontostand und Währung.
- `apps-script/Code.gs` verteilt die beiden Aktionen.

**Neue Schlüssel auf dem Gerät** (`js/store.js`): `aktionsdeck_darstellung` (`geraet` | `hell` | `dunkel`, je Gerät, Antwort B). Zwischenspeicher: `gruppe_id:gruppeinfo`.

## 6. Schritte

### 11.0 – Plan Fassung 1 (erledigt, Pull Request #49)

### 11.1 – Plan Fassung 2, Skript für den Kontostand

Version: 0.33.0 (neuer Hauptschritt). **Mit „Von Hand zu erledigen“** (neue Skriptdatei, Skripteigenschaft, Zeitauslöser, neue Bereitstellung). Am Sheet ändert sich nichts.

1. Fassung 2 dieser Datei.
2. Neue Datei `apps-script/Konto.gs`, zwei Zeilen in `apps-script/Code.gs`.
3. `texte/datenschutz.txt`: Absatz zum Kontostand (öffentliche Angabe von OpenCollective, keine Personendaten).
4. `texte/anleitung/admin.txt`: Absätze zum Versionsverlauf des Sheets (Antwort 19) und zu den Skripteigenschaften für Konto und Cloud.
5. `docs/PLAN-ETAPPE-12.md`: Punkt „Was könnte kaputt gehen?“ in der Sicherheitsprüfung (Antwort 17).

**Prüfen:** `kontoTesten` im Editor zeigt den Kontostand. `kontoAusloeserEinrichten` einmal ausführen. Die App läuft wie vorher.

### 11.2 – GitHub Actions

Version: 0.33.1. Sheet und Skript bleiben unverändert.

1. `.github/workflows/jekyll-gh-pages.yml`: aktuelle Versionen der fünf Actions. Der Agent nennt sie im Pull Request.
2. `docs/STAND.md`: Punkt in „Offen“ streichen.

**Prüfen:** Nach dem Merge ist die Action grün (ohne Node-20-Warnung), und die Seite ist da.

### 11.3 – Kontostand in den Finanzen, Reiter Cloud

Version: 0.33.2. Sheet und Skript bleiben unverändert (alles in 11.1). Kontostand nur, wenn `kontoTesten` geklappt hat. Cloud nach der Antwort auf Frage A.

1. Teil Finanzen im Projekt (`js/views/projekt-finanzen.js`): Zeile „Kontostand der Gruppe: 1.234,56 € (Stand Mo, 03.11.2026)“, Knopf „Jetzt abrufen“, Link „Zu OpenCollective →“. Nur für Gruppen mit Konto.
2. Reiter „Cloud“ (neue Datei `js/views/cloud.js`, Eintrag in `js/ui/nav.js`, `js/config.js` `features.cloud`, `js/views/mehr.js`). Nur sichtbar, wenn die Gruppe einen Cloud-Link hat.
3. Anleitung: `texte/anleitung/projekte.txt` ergänzen, neue Seite `texte/anleitung/cloud.txt`.

**Prüfen:** FFF sieht den Kontostand mit Datum, GP und KB sehen nichts. „Jetzt abrufen“ zweimal hintereinander: Beim zweiten Mal kommt „Gerade erst abgerufen“. FFF sieht den Reiter Cloud, die anderen nicht.

### 11.4 – Erinnerungen „Für dich“

Version: 0.33.3. Sheet und Skript bleiben unverändert.

1. Neue Datei `js/views/erinnerungen-rechnen.js` (Antwort 10) und Kachel „Für dich“ ganz oben auf dem Start (`js/views/start.js`). Die Erinnerung zur Kapazität zieht in die Kachel um.
2. Zahl am App-Symbol (Antwort 12). Am iPhone wird nicht nach Mitteilungen gefragt.
3. Anleitung `texte/anleitung/start.txt` ergänzen.

**Prüfen:** Eine Umfrage anlegen, nicht abstimmen: Sie steht in „Für dich“. Abstimmen: Sie verschwindet. Material für ein vergangenes Projekt mitnehmen: Es steht in „Für dich“.

### 11.5 – Jahresübersicht

Version: 0.33.4. Sheet und Skript bleiben unverändert.

1. Neue Dateien `js/views/uebersicht.js` und `js/views/uebersicht-rechnen.js` (Antworten 20 und 21). Knopf über die volle Breite im Archiv der Projekte. Adresse `#/g/<kurzname>/projekte/uebersicht`.
2. Das laufende Jahr steht offen oben, darunter ein Aufklapper je früherem Jahr. Knopf „Als Text kopieren“.
3. Anleitung `texte/anleitung/projekte.txt` ergänzen.

**Prüfen:** Die Zahlen für dieses Jahr passen grob zu dem, was ihr kennt. Frühere Jahre lassen sich aufklappen.

### 11.6 – Drucken

Version: 0.33.5. Sheet und Skript bleiben unverändert.

1. Druckansicht (`@media print`): Leisten, Knöpfe und Hintergründe fallen weg, schwarze Schrift auf Weiß.
2. Knopf „🖨 Drucken“ im Teil **Material** (Packliste mit Kästchen) und im Teil **ToDos** eines Projekts (Antwort 23).

**Prüfen:** Material und ToDos eines Projekts drucken (oder als PDF speichern): ohne Leisten, mit Kästchen.

### 11.7 – Dunkelmodus Teil 1: Farben als Variablen

Version: 0.33.6. Sheet und Skript bleiben unverändert.

1. Feste Farben in `css/components.css` und in den `js/`-Dateien auf Variablen umstellen. Das ist eine Ausnahme von „bestehende Regeln nur ändern, wenn es nicht anders geht“
   (`CLAUDE.md` Abschnitt 4): Ohne diese Änderung gibt es keinen Dunkelmodus. Der Pull Request nennt jede geänderte Stelle.
2. Bildschirmfotos aller Reiter und Seiten vorher und nachher (Handy- und PC-Breite) im Testbrowser des Agenten. Nur wenn sie gleich sind, kommt der Pull Request.

**Prüfen:** Alles sieht aus wie vorher.

### 11.8 – Dunkelmodus Teil 2

Version: 0.33.7. Sheet und Skript bleiben unverändert.

1. Dunkle Farben (Antwort 25) für `prefers-color-scheme: dark`. Schalter „Wie das Gerät | Hell | Dunkel“ in „Mehr“ unter „Abmelden“ (Antwort 24, Fragen B und C). `theme-color` passt sich an.
2. Kontraste im Testbrowser prüfen (Schrift auf Hintergrund, Gruppenfarben auf Knöpfen).
3. Anleitung `texte/anleitung/fragen.txt` („Wie stelle ich die App dunkel?“).

**Prüfen:** Am Handy das Gerät auf dunkel stellen: Die App ist dunkel. „Hell“ wählen: Die App ist hell. Alle Reiter, öffentliche Seiten, Fenster, Kalender, Mobi-Farben.

### 11.9 – Feinschliff, Abschluss

Version: 0.33.8. Sheet und Skript bleiben unverändert (außer eine Anmerkung verlangt es).

1. Gesammelte Anmerkungen der Person.
2. `docs/STAND.md`, Status dieser Datei, `texte/entwicklung.txt` (Etappe 11 zusammengefasst), `CLAUDE.md` (Hilfsmodule, Reiter-Liste).
3. Kurzer Abgleich mit `docs/PLAN-ETAPPE-12.md`: Was Etappe 11 neu gebracht hat, kommt dort in die Ausgangslage.

**Prüfen:** Gesamt-Prüfliste von Etappe 11 im Pull Request.

## 7. Regeln und Risiken für Etappe 11

- **Neue Berechtigungen im Skript:** Zeitauslöser und Abruf bei OpenCollective brauchen neue Berechtigungen. Google zeigt dabei eine Warnung („Diese App wurde nicht von Google geprüft“).
  Das ist bei eigenen Skripten normal. Die Liste in 11.1 erklärt jeden Klick. **Danach immer eine neue Version bereitstellen**, sonst nutzt die App den alten Stand (siehe Foto-Fehler in 10.12).
- **OpenCollective kann sich ändern:** Ändert OpenCollective seine Schnittstelle, bleibt der letzte Stand stehen, und die App zeigt das Datum dazu. Kein Absturz.
- **Dunkelmodus:** größtes Risiko für das Aussehen. Darum zwei Schritte und Bildschirmfotos. Farben aus Daten (Gruppen, Veranstaltungen) können im Dunkeln schlechter lesbar sein; die App wählt die Schriftfarbe dazu schon selbst.
- **Erinnerungen hängen am Anzeigenamen.** Tippt jemand den Namen anders als im Eintrag, fehlt die Erinnerung.
- **Kein Push, keine E-Mail, keine fremden Dienste** (außer dem Abruf des öffentlichen Kontostands durch das Skript).
- **Datenschutz:** Der Kontostand kommt in `texte/datenschutz.txt`. Dateien in `texte/` sind öffentlich: nichts Internes, keine Ordner-IDs, keine Cloud-Adresse.
- **Nicht vom Agenten prüfbar:** Abruf bei OpenCollective aus dem Skript, Zeitauslöser, Zahl am App-Symbol auf echten Geräten, Drucken auf dem Handy der Person.

## 8. Reihenfolge und Versionen

| Schritt | Inhalt | Version | Sheet/Skript |
|---|---|---|---|
| 11.0 | Plan Fassung 1 mit Rückfragen, Plan 11 → 12 umbenannt | 0.32.11 | nein |
| 11.1 | Plan Fassung 2, `Konto.gs` | 0.33.0 | **Skript ja**, Sheet nein |
| 11.2 | GitHub Actions anheben | 0.33.1 | nein |
| 11.3 | Kontostand in den Finanzen, Reiter Cloud | 0.33.2 | nein |
| 11.4 | Erinnerungen „Für dich“, Zahl am App-Symbol | 0.33.3 | nein |
| 11.5 | Jahresübersicht | 0.33.4 | nein |
| 11.6 | Drucken (Material und ToDos eines Projekts) | 0.33.5 | nein |
| 11.7 | Dunkelmodus Teil 1: Farben als Variablen | 0.33.6 | nein |
| 11.8 | Dunkelmodus Teil 2: dunkle Farben, Schalter | 0.33.7 | nein |
| 11.9 | Feinschliff, Abschluss | 0.33.8 | vielleicht |

Danach: Etappe 12 „Prüfung und Qualität“ (`docs/PLAN-ETAPPE-12.md`, Versionen 0.34.x), dann Version 1.0.

Die Versionen in dieser Tabelle sind die geplanten. Nachbesserungen zählen die Version hoch (auch in einem offenen Pull Request), dann verschieben sich die folgenden Nummern.

Nach jedem Schritt: Pull Request, die Person prüft am Handy und am PC und meldet Anmerkungen gesammelt. Die Anmerkungen kommen in den nächsten Pull Request, vor dem nächsten Schritt.
