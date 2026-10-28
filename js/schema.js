// js/schema.js
// Formularfelder der Tabs, deren Formular die App mit baueFormular (ui/form.js) baut. Gegenstück zu Schema.gs.
// Tabs mit eigenem Formular (Ausleihe, Protokolle, Reden, TOPs, Kommentare, Personen, Kapazitaet, Wiki) stehen
// nicht hier (seit 0.34.6). Alle Spalten aller Tabs stehen in apps-script/Schema.gs.

export const SCHEMA = {
  Material: {
    titel: 'Material',
    felder: [
      { name: 'name', label: 'Name', typ: 'text', pflicht: true },
      { name: 'kategorie', label: 'Kategorie', typ: 'text' },
      { name: 'unterkategorie', label: 'Unterkategorie', typ: 'text' },
      { name: 'typ', label: 'Art (fest = Pavillon, verbrauch = Flyer)', typ: 'auswahl', optionen: ['fest', 'verbrauch'] },
      { name: 'anzahl', label: 'Anzahl', typ: 'zahl' },
      { name: 'einheit', label: 'Einheit', typ: 'text' },
      { name: 'ort', label: 'Ort', typ: 'text' },
      { name: 'foto_id', label: 'Foto', typ: 'foto' },
      { name: 'notiz', label: 'Notiz', typ: 'langtext' },
      { name: 'aktiv', label: 'Aktiv', typ: 'bool' }
    ]
  },
  ToDos: {
    titel: 'ToDos',
    felder: [
      { name: 'text', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'details', label: 'Weitere Informationen (freiwillig)', typ: 'langtext' },
      { name: 'verantwortlich', label: 'Verantwortlich (leer = Hut noch frei)', typ: 'text' },
      { name: 'faellig_am', label: 'Fällig am', typ: 'datum' },
      { name: 'prioritaet', label: 'Priorität', typ: 'auswahl', optionen: ['hoch', 'normal', 'niedrig'] }
    ]
  },
  Projekte: {
    titel: 'Projekte',
    felder: [
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'beschreibung', label: 'Beschreibung', typ: 'langtext' },
      { name: 'ort', label: 'Ort', typ: 'text' },
      { name: 'aktionsart', label: 'Aktionsart (z. B. Demo, Infostand)', typ: 'text' },
      { name: 'status', label: 'Status', typ: 'auswahl', optionen: ['planung', 'aktiv', 'erledigt', 'archiviert'] },
      { name: 'start_datum', label: 'Start', typ: 'datum' },
      { name: 'aktionsdatum', label: 'Aktionsdatum', typ: 'datum' },
      { name: 'deadline', label: 'Deadline', typ: 'datum' },
      { name: 'budget_geplant', label: 'Geplantes Budget (€)', typ: 'zahl' }
    ]
  },
  Meilensteine: {
    titel: 'Meilensteine',
    felder: [
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'datum', label: 'Datum', typ: 'datum' },
      { name: 'verantwortlich', label: 'Verantwortlich', typ: 'text' }
    ]
  },
  Projekt_Material: {
    titel: 'Material im Projekt',
    felder: [
      { name: 'name', label: 'Name', typ: 'text', pflicht: true },
      { name: 'kategorie', label: 'Kategorie', typ: 'text' },
      { name: 'menge', label: 'Menge', typ: 'zahl', pflicht: true },
      { name: 'beschaffung', label: 'Beschaffung', typ: 'auswahl', optionen: ['vorhanden', 'kaufen', 'mieten', 'leihen'] },
      { name: 'notiz', label: 'Notiz', typ: 'langtext' }
    ]
  },
  Finanzen: {
    titel: 'Finanzen',
    felder: [
      { name: 'posten', label: 'Posten', typ: 'text', pflicht: true },
      { name: 'art', label: 'Art', typ: 'auswahl', optionen: ['kauf', 'miete', 'sonstiges'] },
      { name: 'menge', label: 'Menge', typ: 'zahl' },
      { name: 'einzelpreis', label: 'Einzelpreis (€)', typ: 'zahl' },
      { name: 'betrag_geplant', label: 'Geplant (€)', typ: 'zahl' },
      { name: 'betrag_tatsaechlich', label: 'Tatsächlich (€)', typ: 'zahl' },
      { name: 'bezahlt_von', label: 'Bezahlt von', typ: 'text' },
      { name: 'datum', label: 'Datum', typ: 'datum' },
      { name: 'beleg_id', label: 'Beleg / Hinweis (z. B. Link, keine Kontonummern)', typ: 'text' }
    ]
  },
  Learnings: {
    titel: 'Learnings',
    felder: [
      { name: 'aktionsart', label: 'Aktionsart (z. B. Demo, Infostand)', typ: 'text', pflicht: true },
      { name: 'text', label: 'Learning', typ: 'langtext', pflicht: true }
    ]
  },
  Umfragen: {
    titel: 'Umfragen',
    felder: [
      { name: 'frage', label: 'Frage', typ: 'text', pflicht: true },
      { name: 'optionen', label: 'Antworten (eine pro Zeile, mindestens zwei)', typ: 'langtext', pflicht: true },
      { name: 'ablauf_am', label: 'Frist (freiwillig, beendet wird von Hand)', typ: 'datum' },
      { name: 'mehrfach', label: 'Mehrere Antworten erlaubt', typ: 'bool' },
      { name: 'namentlich', label: 'Namentlich abstimmen (Namen stehen nach dem Beenden in der Auswertung)', typ: 'bool' }
    ]
  },
  Mitteilungen: {
    titel: 'Mitteilungen',
    felder: [
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'text', label: 'Text', typ: 'langtext' },
      { name: 'angeheftet', label: 'Angeheftet (nur angeheftete stehen direkt auf dem Start)', typ: 'bool' }
    ]
  },
  Ideen: {
    titel: 'Aktionsideen',
    felder: [
      { name: 'titel', label: 'Idee', typ: 'text', pflicht: true },
      { name: 'beschreibung', label: 'Beschreibung', typ: 'langtext' },
      { name: 'aktionsart', label: 'Aktionsart (z. B. Demo, Infostand)', typ: 'text' }
    ]
  },
  Veranstaltungen: {
    titel: 'Veranstaltungen',
    felder: [
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'art', label: 'Art (intern = nur Gruppe, extern = nach außen)', typ: 'auswahl', optionen: ['intern', 'extern'], pflicht: true },
      { name: 'datum', label: 'Datum (erster Tag)', typ: 'datum', pflicht: true },
      { name: 'datum_ende', label: 'Letzter Tag (nur bei mehreren Tagen)', typ: 'datum' },
      { name: 'zeit_von', label: 'Uhrzeit von', typ: 'zeit' },
      { name: 'zeit_bis', label: 'Uhrzeit bis', typ: 'zeit' },
      { name: 'ort', label: 'Ort', typ: 'text' },
      { name: 'beschreibung', label: 'Beschreibung', typ: 'langtext' },
      { name: 'veranstalter', label: 'Veranstalter (leer = unsere Gruppe)', typ: 'text' },
      { name: 'link', label: 'Link (https://…)', typ: 'text' },
      { name: 'farbe', label: 'Farbe (ohne Auswahl: Gruppenfarbe)', typ: 'farbe' },
      { name: 'oeffentlich', label: 'Veröffentlichen (nur bei extern: erscheint ohne PIN für alle im Netz. Bitte keine privaten Daten in Titel, Beschreibung, Ort oder Link)', typ: 'bool' }
    ]
  },
  Termin_Vorlagen: {
    titel: 'Termin-Vorlagen',
    felder: [
      { name: 'name', label: 'Name der Vorlage (z. B. Plenum FFF)', typ: 'text', pflicht: true },
      { name: 'art', label: 'Art (intern = nur Gruppe, extern = nach außen)', typ: 'auswahl', optionen: ['intern', 'extern'], pflicht: true },
      { name: 'wochentag', label: 'Wochentag (für das nächste passende Datum)', typ: 'auswahl', optionen: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] },
      { name: 'zeit_von', label: 'Uhrzeit von', typ: 'zeit' },
      { name: 'zeit_bis', label: 'Uhrzeit bis', typ: 'zeit' },
      { name: 'ort', label: 'Ort', typ: 'text' },
      { name: 'beschreibung', label: 'Beschreibung', typ: 'langtext' }
    ]
  },
  Mobi_Plan: {
    titel: 'Mobi',
    felder: [
      { name: 'kanal', label: 'Kanal', typ: 'text', pflicht: true },
      // Angezeigt groß, gespeichert klein
      { name: 'format', label: 'Format', typ: 'auswahl', optionen: [
        { wert: 'beitrag', label: 'Beitrag' }, { wert: 'reel', label: 'Reel' }, { wert: 'story', label: 'Story' },
        { wert: 'video', label: 'Video' }, { wert: 'text', label: 'Text' }, { wert: 'sonstiges', label: 'Sonstiges' }
      ] },
      { name: 'titel', label: 'Thema / Titel', typ: 'text', pflicht: true },
      { name: 'text', label: 'Haupt-Text', typ: 'langtext' },
      { name: 'kanal_text', label: 'Text für diesen Kanal', typ: 'langtext' },
      { name: 'hashtags', label: 'Hashtags', typ: 'text' },
      { name: 'datum', label: 'Datum', typ: 'datum' },
      { name: 'uhrzeit', label: 'Uhrzeit', typ: 'zeit' },
      { name: 'status', label: 'Status', typ: 'auswahl', optionen: [
        { wert: 'idee', label: 'Idee' }, { wert: 'entwurf', label: 'Entwurf' },
        { wert: 'gedreht', label: 'Gedreht' }, { wert: 'geschnitten', label: 'Geschnitten' },
        { wert: 'review', label: 'Review' }, { wert: 'anpassung', label: 'Anpassung' },
        { wert: 'bereit', label: 'Bereit' }, { wert: 'veroeffentlicht', label: 'Veröffentlicht' }
      ] },
      { name: 'verantwortlich', label: 'Verantwortlich', typ: 'text' },
      { name: 'canva_link', label: 'Canva-Link (https://…)', typ: 'text' },
      { name: 'ergebnis', label: 'Ergebnis (z. B. Reichweite, freiwillig)', typ: 'text' },
      { name: 'notiz', label: 'Notiz', typ: 'langtext' }
    ]
  },
  Gruppen_Rollen: {
    titel: 'Gruppen-Rollen',
    felder: [
      { name: 'name', label: 'Name der Rolle', typ: 'text', pflicht: true },
      { name: 'beschreibung', label: 'Beschreibung (freiwillig)', typ: 'langtext', max: 300 },
      { name: 'gewaehlt', label: 'Fest gewählt (höchstens eine Person)', typ: 'bool' },
      { name: 'sortierung', label: 'Reihenfolge', typ: 'zahl' }
    ]
  }
};

// Das Sheet liefert Wahrheitswerte mal als true, mal als Text "TRUE".
export function istWahr(v) {
  return v === true || String(v).trim().toUpperCase() === 'TRUE';
}

export function istFalsch(v) {
  return v === false || String(v).trim().toUpperCase() === 'FALSE';
}
