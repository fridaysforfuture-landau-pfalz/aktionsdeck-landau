// Werkzeuge.gs – Werkzeuge für den Editor (seit 0.34.3). Die App ruft hier nichts auf.
// messenSkript: misst, wie lange das Skript für die wichtigsten Aktionen braucht. Schreibt nichts ins Sheet.
// tabsSortieren, tabsSortierenAZ (seit 0.34.11): ordnen die Tabs im Sheet und färben sie je Bereich. Daten bleiben gleich.

var MESSEN_RUNDEN = 3;

// Im Editor ausführen. Das Protokoll (Ausführungsprotokoll) bitte komplett kopieren und schicken.
// Es stehen keine Namen, PINs oder Inhalte darin, nur Zeiten und Zahlen von Zeilen und Spalten.
function messenSkript() {
  var start = Date.now();
  Logger.log('messenSkript, Version des Skripts: Stand 0.34.3, ' + MESSEN_RUNDEN + ' Runden je Messung');
  Logger.log('Zeiten in Millisekunden (1000 ms = 1 Sekunde): schnellste / mittlere / langsamste Runde');

  // Erste aktive Gruppe mit gültigem Zugang (wie testenRechte)
  var zugaenge = lies('Zugang').zeilen;
  var gruppe = null, zugang = null;
  lies('Gruppen').zeilen.forEach(function (g) {
    if (gruppe || !truthy(g.aktiv)) return;
    var z = zugaenge.filter(function (x) { return String(x.gruppe_id) === String(g.gruppe_id) && zugangGueltig(x); })[0];
    if (z) { gruppe = g; zugang = z; }
  });
  if (!gruppe) { Logger.log('Keine aktive Gruppe mit Zugang gefunden.'); return; }
  var token = tokenAusstellen(gruppe.gruppe_id, zugang.zugang_id, zugangStand(zugang));
  tokenPruefen(token);
  Logger.log('Gemessen mit der Gruppe ' + gruppe.gruppe_id);

  // 1) Größe der Tabs und Zeit für das Lesen eines ganzen Tabs
  Logger.log('');
  Logger.log('== 1. Tabs lesen (lies) ==');
  var tabs = ['Gruppen', 'Zugang', 'Log'].concat(Object.keys(TABELLEN));
  var summeLesen = 0;
  tabs.forEach(function (tab) {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
    if (!sh) { Logger.log(tab + ': Tab fehlt'); return; }
    var groesse = (sh.getLastRow() - 1) + ' Zeilen x ' + sh.getLastColumn() + ' Spalten';
    if (tab === 'Log') { Logger.log(tab + ': ' + groesse + ' (nicht gelesen)'); return; }
    var m = werkzeugMessen(function () { lies(tab); });
    summeLesen += m.mitte;
    Logger.log(tab + ': ' + groesse + ', ' + werkzeugZeiten(m));
  });
  Logger.log('Alle Tabs zusammen einmal lesen: etwa ' + summeLesen + ' ms');

  // 2) Anmeldung prüfen (läuft bei JEDEM Aufruf mit Anmeldung)
  Logger.log('');
  Logger.log('== 2. Anmeldung prüfen (bei jedem Aufruf) ==');
  Logger.log('tokenPruefen: ' + werkzeugZeiten(werkzeugMessen(function () { tokenPruefen(token); })));

  // 3) Aktionen, wie die App sie schickt (ohne Netz)
  Logger.log('');
  Logger.log('== 3. Aktionen im Skript (ohne Netz) ==');
  // Dritter Wert: true = gehört zum Öffnen des Reiters Start (die App schickt diese Anfragen gleichzeitig)
  var aufrufe = [
    ['gruppen', { aktion: 'gruppen' }, false],
    ['gruppeInfo', { aktion: 'gruppeInfo' }, true],
    ['list ToDos', { aktion: 'list', tabelle: 'ToDos' }, true],
    ['list Projekte', { aktion: 'list', tabelle: 'Projekte' }, true],
    ['list Mobi_Plan', { aktion: 'list', tabelle: 'Mobi_Plan' }, true],
    ['list TOPs', { aktion: 'list', tabelle: 'TOPs' }, true],
    ['listMehrere Umfragen, Antworten, Mitteilungen', { aktion: 'listMehrere', tabellen: ['Umfragen', 'Umfrage_Antworten', 'Mitteilungen'] }, true],
    ['listMehrere Ausleihe, Material', { aktion: 'listMehrere', tabellen: ['Ausleihe', 'Material'] }, true],
    ['listMehrere „Was ist neu?“ (11 Tabs)', { aktion: 'listMehrere', seit: jetzt(),
      tabellen: ['ToDos', 'Meilensteine', 'Mitteilungen', 'Umfragen', 'Kommentare', 'Projekte', 'Veranstaltungen',
        'Mobi_Plan', 'Protokolle', 'Reden', 'Personen'] }, true],
    ['list Material', { aktion: 'list', tabelle: 'Material' }, false],
    ['list Veranstaltungen', { aktion: 'list', tabelle: 'Veranstaltungen' }, false],
    ['list Wiki', { aktion: 'list', tabelle: 'Wiki' }, false],
    ['termine (öffentlich)', { aktion: 'termine' }, false],
    ['wiki (öffentlich)', { aktion: 'wiki' }, false]
  ];
  var summeStart = 0, langsamsteStart = 0;
  aufrufe.forEach(function (a) {
    var p = a[1];
    p.token = token;
    var m = werkzeugMessen(function () { return verteile(JSON.parse(JSON.stringify(p))); });
    if (m.fehler) { Logger.log(a[0] + ': FEHLER ' + m.fehler); return; }
    Logger.log(a[0] + ': ' + werkzeugZeiten(m) + ', Antwort ' + Math.round(m.groesse / 1024) + ' KB');
    if (a[2]) { summeStart += m.mitte; langsamsteStart = Math.max(langsamsteStart, m.mitte); }
  });
  Logger.log('Reiter Start: zusammen ' + summeStart + ' ms Rechenzeit im Skript, die langsamste Anfrage ' + langsamsteStart + ' ms');

  // 4) Ganzer Weg über das Internet (mit Start der Web-App bei Google)
  Logger.log('');
  Logger.log('== 4. Über das Netz (wie die App, mit Start der Web-App) ==');
  var url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (e) { url = ''; }
  if (!url) {
    Logger.log('Die Web-App ist nicht bereitgestellt, Teil 4 übersprungen.');
  } else {
    [['gruppen', { aktion: 'gruppen' }], ['list ToDos', { aktion: 'list', tabelle: 'ToDos', token: token }]].forEach(function (a) {
      var m = werkzeugMessen(function () {
        var r = UrlFetchApp.fetch(url, {
          method: 'post', contentType: 'text/plain', payload: JSON.stringify(a[1]), muteHttpExceptions: true
        });
        if (r.getResponseCode() !== 200) throw new Error('HTTP ' + r.getResponseCode());
        return r.getContentText().length;
      });
      Logger.log(a[0] + ' über das Netz: ' + (m.fehler ? 'FEHLER ' + m.fehler : werkzeugZeiten(m)));
    });
  }

  Logger.log('');
  Logger.log('Fertig nach ' + Math.round((Date.now() - start) / 1000) + ' Sekunden. Bitte das ganze Protokoll kopieren und schicken.');
}

// Führt fn MESSEN_RUNDEN Mal aus. Gibt { min, mitte, max, groesse, fehler } zurück.
function werkzeugMessen(fn) {
  var liste = [], groesse = 0;
  for (var i = 0; i < MESSEN_RUNDEN; i++) {
    var t0 = Date.now();
    try {
      var r = fn();
      if (typeof r === 'number') groesse = r;
      else if (r !== undefined) groesse = JSON.stringify(r).length;
    } catch (e) {
      return { fehler: String(e && e.message ? e.message : e) };
    }
    liste.push(Date.now() - t0);
  }
  liste.sort(function (a, b) { return a - b; });
  return { min: liste[0], mitte: liste[Math.floor(liste.length / 2)], max: liste[liste.length - 1], groesse: groesse };
}

function werkzeugZeiten(m) {
  return m.min + ' / ' + m.mitte + ' / ' + m.max + ' ms';
}

// ---- Tabs sortieren (12.14) ----
// Bereiche in der Reihenfolge der Reiter der App, mit einer Farbe je Bereich.
// Das Skript findet Tabs über ihren Namen, die Reihenfolge im Sheet ist ihm egal.
var TAB_BEREICHE = [
  { name: 'System', farbe: '#5f6a66', tabs: ['Gruppen', 'Zugang', 'Log'] },
  { name: 'Start', farbe: '#368469', tabs: ['Mitteilungen', 'Umfragen', 'Umfrage_Antworten'] },
  { name: 'Projekte', farbe: '#2f6fb3', tabs: ['Projekte', 'Meilensteine', 'Projekt_Material', 'Finanzen', 'Learnings', 'Kommentare', 'Ideen'] },
  { name: 'ToDos', farbe: '#1b7340', tabs: ['ToDos'] },
  { name: 'Material', farbe: '#c77c00', tabs: ['Material', 'Ausleihe'] },
  { name: 'Mobi', farbe: '#d6249f', tabs: ['Mobi_Plan'] },
  { name: 'Kalender', farbe: '#b3261e', tabs: ['Veranstaltungen', 'Termin_Vorlagen'] },
  { name: 'Dokumentation', farbe: '#6a4c93', tabs: ['Protokolle', 'TOPs', 'Reden'] },
  { name: 'Team', farbe: '#00838f', tabs: ['Personen', 'Gruppen_Rollen', 'Kapazitaet'] },
  { name: 'Wiki', farbe: '#795548', tabs: ['Wiki'] }
];

// Im Editor ausführen: Tabs nach Wichtigkeit (System, dann wie die Reiter der App). Unbekannte Tabs kommen ans Ende.
function tabsSortieren() {
  var reihe = [];
  TAB_BEREICHE.forEach(function (b) { reihe = reihe.concat(b.tabs); });
  // Neue Daten-Tabs, die oben noch fehlen, kommen hinter die bekannten
  Object.keys(TABELLEN).forEach(function (t) { if (reihe.indexOf(t) < 0) reihe.push(t); });
  tabsOrdnen_(function (a, b) {
    var ia = reihe.indexOf(a), ib = reihe.indexOf(b);
    if (ia < 0) ia = reihe.length;
    if (ib < 0) ib = reihe.length;
    return ia !== ib ? ia - ib : a.localeCompare(b, 'de');
  }, 'nach Wichtigkeit');
}

// Im Editor ausführen: Tabs nach dem Alphabet. Die Farben je Bereich bleiben.
function tabsSortierenAZ() {
  tabsOrdnen_(function (a, b) { return a.localeCompare(b, 'de', { sensitivity: 'base' }); }, 'nach dem Alphabet');
}

function tabsOrdnen_(vergleich, art) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var blaetter = ss.getSheets();
  var versteckt = {};
  blaetter.forEach(function (sh) { versteckt[sh.getName()] = sh.isSheetHidden(); });
  var namen = blaetter.map(function (sh) { return sh.getName(); }).sort(vergleich);

  var farbeVon = {};
  TAB_BEREICHE.forEach(function (b) { b.tabs.forEach(function (t) { farbeVon[t] = b.farbe; }); });

  namen.forEach(function (name, i) {
    var sh = ss.getSheetByName(name);
    ss.setActiveSheet(sh);       // zeigt einen versteckten Tab kurz an, er wird unten wieder versteckt
    ss.moveActiveSheet(i + 1);
    if (farbeVon[name]) sh.setTabColor(farbeVon[name]);
  });
  namen.forEach(function (name) { if (versteckt[name]) ss.getSheetByName(name).hideSheet(); });
  var erster = ss.getSheets().filter(function (sh) { return !sh.isSheetHidden(); })[0];
  if (erster) ss.setActiveSheet(erster);

  Logger.log('Tabs sortiert ' + art + ':');
  namen.forEach(function (name, i) {
    Logger.log((i + 1) + '. ' + name + (farbeVon[name] ? '' : ' (unbekannt, ohne Farbe)') + (versteckt[name] ? ' (versteckt)' : ''));
  });
  var fehlen = Object.keys(farbeVon).filter(function (t) { return namen.indexOf(t) < 0; });
  if (fehlen.length) Logger.log('Diese Tabs gibt es im Sheet nicht: ' + fehlen.join(', '));
  Logger.log('Fertig. Daten und Spaltenköpfe sind unverändert.');
}
