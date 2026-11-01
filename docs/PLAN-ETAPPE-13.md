# Plan Etappe 13 – Gruppen eröffnen sich selbst

Ziel: Eine neue Gruppe beantragt ihren Bereich selbst auf der Startseite. Die Person mit Adminzugriff setzt nur noch den PIN.
Versionen 1.1.0 bis 1.1.2. Am Ende der Etappe wird dieser Plan in `docs/STAND.md` eingearbeitet und gelöscht.

## Festlegungen (mit der Person abgestimmt, 01.11.2026)

1. **PIN** setzt die Person mit Adminzugriff beim Freischalten. Die Gruppe wählt ihn nicht selbst. Der PIN geht nie über die App.
2. **Freischalten** nur im Sheet: Menü „AktionsDeck → Gruppe freischalten“ (kein Admin-PIN, keine Admin-Ansicht in der App).
3. **Hinweis auf neue Anträge** unter „Was ist neu?“, nur wenn Gruppe und Anzeigename zu den Skripteigenschaften `ADMIN_GRUPPE` und
   `ADMIN_NAME` passen. Der Hinweis enthält nur Name und Abkürzung der neuen Gruppe (der Anzeigename ist nicht geschützt).
4. **Logo** erstmal über GitHub: Die Gruppe schickt es, die Person lädt es nach `icons/gruppen/` hoch.
5. **Foto-Ordner** legt das Skript beim Freischalten selbst an, im Drive-Ordner aus der Skripteigenschaft `GRUPPEN_ORDNER`
   (die ID steht nicht im Repo), und setzt `FOTO_ORDNER_<gruppe_id>`.
6. **Keine Kontaktdaten** im Antrag. Die Gruppe meldet sich danach selbst über Signal.
7. Kein eigener Menüpunkt „PIN ändern“; `setupPins` bleibt.
8. Startseite **alphabetisch** nach Name (die Spalte `sortierung` im Tab `Gruppen` wird nicht mehr gebraucht).
9. **Grenzen:** höchstens 5 offene Anträge und 5 neue Anträge pro Tag (für alle zusammen), dazu Rechenaufgabe und ein unsichtbares Feld gegen Roboter.

## Tab `Antraege` (System-Tab, über `list` nicht lesbar)

`antrag_id, erstellt_am, status, name, kurzname, farbe, webseite, instagram, erledigt_am, gruppe_id`
(`status` = offen | freigeschaltet | abgelehnt; `erledigt_am` und `gruppe_id` füllt erst die Freischaltung)

## Schritte

| Schritt | Inhalt | Version |
|---|---|---|
| 13.1 | Skript: Tab `Antraege`, Aktion `gruppeBeantragen` (ohne Login, Rechenaufgabe, Grenzen), Startseite alphabetisch | 1.1.0 |
| 13.2 | App: Kachel „+ Eigene Gruppe eröffnen“, Seite `#/neue-gruppe`, Danke-Meldung mit Signal-Knopf, Texte (Anleitung, Datenschutz) | 1.1.1 |
| 13.3 | Skript und App: Menü „Gruppe freischalten / Ablehnen“, Foto-Ordner automatisch, Hinweis unter „Was ist neu?“ | 1.1.2 |

## Nach dem Freischalten

- **Automatisch:** Gruppe auf der Startseite, Zugang mit PIN, alle Reiter (alle Gruppen teilen sich die Tabs, getrennt über `gruppe_id`),
  Foto-Ordner, öffentliche Termine und Wiki.
- **Von Hand, nur wenn gewünscht:** Logo, `PROTOKOLL_DOK_<gruppe_id>` oder `PROTOKOLL_LINK_<gruppe_id>`, `CLOUD_LINK_<gruppe_id>`, `OC_KONTO_<gruppe_id>`.
- **Macht die Gruppe in der App:** Plenum-Vorlage im Kalender, Team und Rollen, Projekte.
