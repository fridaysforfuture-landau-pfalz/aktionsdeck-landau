// Schema.gs – Beschreibung aller Tabs.
// Neue Tabelle = nur einen Eintrag in TABELLEN ergänzen (und später in js/schema.js).

var BASIS = ['id', 'gruppe_id', 'erstellt_am', 'erstellt_von',
             'geaendert_am', 'geaendert_von', 'geloescht'];

// Daten-Tabs: nur die eigenen Spalten (BASIS kommt automatisch davor)
// Material: typ = fest | verbrauch (leer zählt als fest)
// Ausleihe: art = mitgenommen | zurueck | defekt
// ToDos: text = Titel, details = weitere Informationen, meilenstein_id = Meilenstein im Projekt
// Protokolle: Protokoll eines Plenums, einer AG oder Aktion (Etappe 8). projekt_id und veranstaltung_id sind freiwillig.
//   art = plenum | ag | aktion | sonstiges. rollen = eine Zeile je Rolle ("Moderation: Name").
//   im_dokument = steht im Google-Dokument der Gruppe. vorschlaege_erledigt = Abhak-Liste wurde angelegt.
//   entwurf = gemeinsamer Entwurf (seit 0.30.4): für die Gruppe sichtbar, noch nicht im Dokument.
//   angelegt = über die Knöpfe angelegte Einträge, je Zeile „Tabelle:id“ (seit 0.30.7, beim Verwerfen mitgelöscht).
//   Protokolle werden nur von Hand gelöscht (siehe NIE_LOESCHEN). Gemeinsame Entwürfe dürfen verworfen werden (seit 0.30.6).
// Reden: Archiv der Reden. status = entwurf | probelesen | fertig | gehalten. Werden nur von Hand gelöscht.
//   text = Redetext in der App (seit 0.30.12), link ist freiwillig (Rede woanders geschrieben).
// TOPs: Sammlung der Tagesordnungspunkte fürs nächste Plenum (seit 0.30.3). protokoll_id = in diesem Protokoll besprochen.
// Personen: eine Zeile je Person im Team (seit 0.31.0). name wie der Anzeigename, in der Gruppe nur einmal.
//   aktiv = dabei (FALSE = Pause; die App schickt beim Anlegen TRUE). rollen = IDs aus Gruppen_Rollen, eine je Zeile.
//   notiz = kurz und freiwillig. Prüfungen, Mitlöschen und Umbenennen in Team.gs.
// Gruppen_Rollen: dauerhafte Rollen der Gruppe (seit 0.31.0, in der App bearbeitbar).
//   gewaehlt = fest gewählte Rolle (höchstens eine Person). sortierung = Reihenfolge in der Liste.
// Kapazitaet: eine Zeile je Angabe (seit 0.31.0). person_id = Zeile in Personen. kapazitaet = ganze Zahl 1 bis 10.
//   gueltig_ab, gueltig_bis = JJJJ-MM-TT (höchstens 183 Tage). Wird nur angelegt oder gelöscht.
// Wiki: eine Zeile je Seite (seit 0.32.0). bereich = skillshare | anleitung (eigene Anleitungsseite der Gruppe).
//   thema = Thema im Skillshare (feste Liste in der App). titel und adresse in der Gruppe nur einmal.
//   adresse = Teil des öffentlichen Links (a-z, 0-9, Bindestrich). oeffentlich = ohne Login lesbar. Prüfungen in Wiki.gs.
// Kommentare: freie Kommentare zu einem Projekt.
//   stelle = Absatz im Redetext, zu dem der Kommentar gehört ("Nummer|Anfang des Absatzes", seit 0.30.12).
var TABELLEN = {
  Personen: ['name', 'aktiv', 'rollen', 'notiz'],
  Material: ['name', 'kategorie', 'unterkategorie', 'anzahl', 'einheit', 'ort', 'foto_id', 'notiz', 'aktiv', 'typ'],
  Ausleihe: ['material_id', 'projekt_id', 'person', 'art', 'anzahl', 'datum', 'notiz'],
  ToDos: ['projekt_id', 'post_id', 'text', 'verantwortlich', 'faellig_am', 'erledigt', 'erledigt_am', 'erledigt_von', 'prioritaet', 'sortierung', 'details', 'meilenstein_id', 'mobi_id'],
  Projekte: ['titel', 'beschreibung', 'ort', 'status', 'start_datum', 'aktionsdatum', 'deadline', 'budget_geplant', 'aktionsart','zielgruppe', 'werbeart', 'kampagnenziel', 'handlungsaufruf', 'kanaele'],
  Meilensteine: ['projekt_id', 'titel', 'datum', 'verantwortlich', 'erledigt'],
  Projekt_Team: ['projekt_id', 'person', 'zustaendigkeit'],
  Projekt_Material: ['projekt_id', 'material_id', 'name', 'kategorie', 'menge', 'beschaffung', 'beschafft', 'notiz'],
  Finanzen: ['projekt_id', 'projekt_material_id', 'posten', 'art', 'menge', 'einzelpreis', 'betrag_geplant', 'betrag_tatsaechlich', 'bezahlt', 'bezahlt_von', 'datum', 'beleg_id'],
  Posts: ['projekt_id', 'titel', 'plattform', 'format', 'text', 'medien_id', 'veroeffentlichung_am', 'status', 'verantwortlich'],
  Vorlagen_ToDo: ['vorlage_name', 'schritt_text', 'tage_vorher', 'verantwortlich'],
  Protokolle: ['projekt_id', 'datum', 'titel', 'teilnehmende', 'text',
               'art', 'veranstaltung_id', 'rollen', 'im_dokument', 'vorschlaege_erledigt', 'entwurf', 'angelegt'],
  Reden: ['projekt_id', 'veranstaltung_id', 'titel', 'redner', 'datum', 'aktionsart', 'link', 'status', 'notiz', 'text'],
  TOPs: ['titel', 'notiz', 'protokoll_id'],
  Kommentare: ['projekt_id', 'bezug_art', 'bezug_id', 'text', 'angeheftet', 'farbe', 'stelle'],
  Learnings: ['projekt_id', 'aktionsart', 'text'],
  Umfragen: ['frage', 'optionen', 'ablauf_am', 'mehrfach', 'beendet', 'namentlich'],
  Umfrage_Antworten: ['umfrage_id', 'person', 'auswahl'],
  Mitteilungen: ['titel', 'text', 'angeheftet', 'farbe'],
  Ideen: ['titel', 'beschreibung', 'aktionsart', 'projekt_id'],
  Veranstaltungen: ['titel', 'art', 'datum', 'datum_ende', 'zeit_von', 'zeit_bis', 'ort',
                    'beschreibung', 'veranstalter', 'link', 'oeffentlich', 'farbe'], 
  Termin_Vorlagen: ['name', 'art', 'wochentag', 'zeit_von', 'zeit_bis', 'ort', 'beschreibung'],
  // Mobi_Plan: ein Beitrag je Kanal. Gehört zu einem Projekt oder einer Veranstaltung.
  // status = idee | entwurf | gedreht | geschnitten | review | anpassung | bereit | veroeffentlicht
  // (gedreht und geschnitten nur bei Instagram und TikTok, siehe js/kanaele.js). datum JJJJ-MM-TT, uhrzeit HH:MM (Text).
  Mobi_Plan: ['projekt_id', 'veranstaltung_id', 'kanal', 'format', 'titel', 'text', 'kanal_text', 'hashtags',
              'datum', 'uhrzeit', 'status', 'verantwortlich', 'canva_link', 'ergebnis', 'notiz'],
  Gruppen_Rollen: ['name', 'beschreibung', 'gewaehlt', 'sortierung'],
  Kapazitaet: ['person_id', 'kapazitaet', 'gueltig_ab', 'gueltig_bis', 'notiz'],
  Wiki: ['bereich', 'thema', 'titel', 'adresse', 'text', 'oeffentlich']
};

// System-Tabs (über die API nicht direkt änderbar)
var SYSTEM = {
  Gruppen: ['gruppe_id', 'name', 'kurzname', 'farbe', 'sortierung', 'aktiv', 'webseite', 'instagram', 'weitere_links'],
  Zugang: ['zugang_id', 'gruppe_id', 'pin_salt', 'pin_hash', 'aktiv', 'gueltig_bis'],
  Einstellungen: ['schluessel', 'wert'],
  Log: ['zeit', 'gruppe_id', 'aktion', 'tabelle', 'datensatz_id', 'anzeigename']
};

// Tabs, in die nur angehängt wird (kein Ändern, kein Löschen)
var NUR_ANHAENGEN = ['Ausleihe'];

// Tabs, deren Einträge nur von Hand gelöscht werden (vonHand: true, Ändern bleibt erlaubt)
var NIE_LOESCHEN = ['Protokolle', 'Reden'];

// Höchstlänge für Textfelder: Standard 5000 Zeichen. Ausnahmen je "Tab.spalte".
// Eine Sheet-Zelle fasst höchstens 50 000 Zeichen.
var MAX_TEXT = 5000;
var MAX_TEXT_AUSNAHMEN = {
  'Protokolle.text': 20000, 'Reden.text': 20000,
  'Personen.name': 60, 'Personen.rollen': 400, 'Personen.notiz': 120,
  'Gruppen_Rollen.name': 40, 'Gruppen_Rollen.beschreibung': 300, 'Kapazitaet.notiz': 120,
  'Wiki.bereich': 20, 'Wiki.thema': 40, 'Wiki.titel': 80, 'Wiki.adresse': 60, 'Wiki.text': 20000
};

function maxLaenge(tab, sp) {
  var k = String(tab) + '.' + String(sp);
  return MAX_TEXT_AUSNAHMEN.hasOwnProperty(k) ? MAX_TEXT_AUSNAHMEN[k] : MAX_TEXT;
}

// Spaltentypen: alles andere ist Text
var ZAHL_SPALTEN = ['anzahl', 'menge', 'einzelpreis', 'betrag_geplant',
                    'betrag_tatsaechlich', 'budget_geplant', 'sortierung', 'tage_vorher', 'kapazitaet'];
var BOOL_SPALTEN = ['aktiv', 'geloescht', 'erledigt', 'beschafft', 'bezahlt', 'mehrfach', 'angeheftet', 'beendet', 'namentlich', 'oeffentlich',
                    'im_dokument', 'vorschlaege_erledigt', 'entwurf', 'gewaehlt'];

function spaltenTyp(sp) {
  if (ZAHL_SPALTEN.indexOf(sp) >= 0) return 'zahl';
  if (BOOL_SPALTEN.indexOf(sp) >= 0) return 'bool';
  return 'text';
}

function spaltenListe(tab) {
  if (SYSTEM.hasOwnProperty(tab)) return SYSTEM[tab];
  return BASIS.concat(TABELLEN[tab]);
}

// EINMAL ausführen (und nach neuen Spalten/Tabs wieder): stellt Text-Spalten auf "Nur Text",
// damit Google keine IDs, Zeitstempel oder Datumswerte selbst umwandelt.
function formatieren() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var namen = Object.keys(SYSTEM).concat(Object.keys(TABELLEN));
  namen.forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    if (sh.getMaxRows() < 2) sh.insertRowsAfter(1, 998);
    var kopf = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    kopf.forEach(function (sp, i) {
      if (spaltenTyp(String(sp)) === 'text') {
        sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
      }
    });
  });
  Logger.log('Formatierung fertig.');
}
