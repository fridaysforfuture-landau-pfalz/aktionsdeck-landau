// Aufraeumen.gs – Alte gelöschte Zeilen und altes Log endgültig entfernen.
// Nur im Editor ausführen. Erst "aufraeumenTesten" (zählt nur), dann "aufraeumen" (löscht).

var TAGE_GELOESCHT = 90;  // gelöschte Zeilen, die älter sind, werden entfernt
var TAGE_LOG = 180;       // Log-Einträge, die älter sind, werden entfernt

function grenzeIso(tage) {
  return Utilities.formatDate(new Date(Date.now() - tage * 86400000), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
}

// nummern: Zeilennummern, aufsteigend. Löscht von unten nach oben, zusammenhängende Zeilen auf einmal.
function loescheZeilen(sh, nummern) {
  var i = nummern.length - 1;
  while (i >= 0) {
    var ende = nummern[i];
    var start = ende;
    while (i > 0 && nummern[i - 1] === start - 1) {
      i--;
      start = nummern[i];
    }
    sh.deleteRows(start, ende - start + 1);
    i--;
  }
}

function aufraeumenLauf(echt) {
  var gGrenze = grenzeIso(TAGE_GELOESCHT);
  var lGrenze = grenzeIso(TAGE_LOG);
  var gesamt = 0;

  Object.keys(TABELLEN).forEach(function (tab) {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
    if (!sh) return;
    var t = lies(tab);
    if (t.kopf.indexOf('geloescht') < 0 || t.kopf.indexOf('geaendert_am') < 0) return;
    var nummern = t.zeilen.filter(function (z) {
      var am = String(z.geaendert_am || '');
      return truthy(z.geloescht) && am !== '' && am < gGrenze;
    }).map(function (z) { return z._zeile; });
    if (!nummern.length) return;
    Logger.log(tab + ': ' + nummern.length + ' gelöschte Zeilen älter als ' + TAGE_GELOESCHT + ' Tage');
    gesamt += nummern.length;
    if (echt) loescheZeilen(sh, nummern);
  });

  var log = lies('Log');
  var alt = log.zeilen.filter(function (z) {
    var zeit = String(z.zeit || '');
    return zeit !== '' && zeit < lGrenze;
  }).map(function (z) { return z._zeile; });
  if (alt.length) {
    Logger.log('Log: ' + alt.length + ' Einträge älter als ' + TAGE_LOG + ' Tage');
    gesamt += alt.length;
    if (echt) loescheZeilen(log.sh, alt);
  }

  Logger.log((echt ? 'ENTFERNT: ' : 'Würde entfernen: ') + gesamt + ' Zeilen.');
}

// Zählt nur, löscht nichts.
function aufraeumenTesten() {
  aufraeumenLauf(false);
}

// Löscht wirklich (in einer Sperre).
function aufraeumen() {
  mitSperre(function () { aufraeumenLauf(true); });
}

// Listet Testdaten mit Zeilennummern, damit du sie im Sheet von Hand löschen kannst.
function testzeilenAnzeigen() {
  var a = lies('Ausleihe').zeilen.filter(function (z) {
    return String(z.person).trim().toLowerCase() === 'test';
  });
  Logger.log('Ausleihe, Person "Test": ' + a.length + ' Zeilen: ' +
    a.map(function (z) { return z._zeile; }).join(', '));

  var p = lies('Projekte').zeilen.filter(function (z) {
    return !truthy(z.geloescht) && String(z.titel).toLowerCase().indexOf('test') >= 0;
  });
  Logger.log('Projekte mit "test" im Titel: ' +
    p.map(function (z) { return 'Zeile ' + z._zeile + ' (' + z.titel + ')'; }).join(', '));
}

// Im Editor ausführen: zeigt alle Einträge der Etappen 5 und 6 mit Zeilennummer, damit du
// Testdaten im Sheet von Hand löschen kannst. Löscht nichts.
function testdatenListe() {
  var felder = {
    Umfragen: 'frage', Umfrage_Antworten: 'person', Mitteilungen: 'titel', Kommentare: 'text',
    Ideen: 'titel', Veranstaltungen: 'titel', Termin_Vorlagen: 'name', Mobi_Plan: 'titel'
  };
  Object.keys(felder).forEach(function (tab) {
    var t = lies(tab);
    var zeilen = t.zeilen.filter(function (z) { return !truthy(z.geloescht); });
    Logger.log('== ' + tab + ': ' + zeilen.length + ' Einträge');
    zeilen.forEach(function (z) {
      Logger.log('  Zeile ' + z._zeile + ' | ' + String(z[felder[tab]]).slice(0, 50) +
        ' | von ' + z.erstellt_von);
    });
  });
}
