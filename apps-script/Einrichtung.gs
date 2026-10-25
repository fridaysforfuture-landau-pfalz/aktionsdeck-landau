// Einrichtung.gs – Prüft im Editor, ob das Skript richtig eingerichtet ist (seit 0.32.13, Schritt 10.1b).
// Schreibt nichts ins Sheet. Jeder Schritt ist einzeln abgesichert, damit man sieht, wo es hakt.
// Ausführen: im Editor oben pruefenEinrichtung wählen, dann „Ausführen“. Ergebnis im Ausführungsprotokoll.

function pruefenEinrichtung() {
  var probleme = 0;
  function schritt(text, fn) {
    try {
      var r = fn();
      Logger.log('ok: ' + text + (r ? ' – ' + r : ''));
    } catch (e) {
      probleme++;
      Logger.log('FEHLER: ' + text + ' – ' + (e && e.message ? e.message : e));
    }
  }
  function enthaelt(fn, wort) {
    return typeof fn === 'function' && fn.toString().indexOf(wort) >= 0;
  }

  // 1) Sind alle Dateien aus Schritt 10.1 im Editor angekommen?
  schritt('Schema.gs kennt den Tab Wiki', function () {
    if (!TABELLEN.Wiki) throw new Error('Schema.gs ist noch die alte Fassung. Bitte ganz neu kopieren.');
  });
  schritt('Schema.gs hat formatierenWiki (0.32.12)', function () {
    if (typeof formatierenWiki !== 'function') throw new Error('Schema.gs ist älter als 0.32.12. Bitte ganz neu kopieren.');
  });
  schritt('Wiki.gs ist da', function () {
    if (typeof aktionWiki !== 'function' || typeof wikiPruefen !== 'function') throw new Error('Datei Wiki.gs fehlt oder ist leer.');
  });
  schritt('Daten.gs ist neu (prüft Wiki-Seiten)', function () {
    if (!enthaelt(aktionCreate, 'wikiPruefen') || !enthaelt(aktionDelete, 'wikiKaskade')) throw new Error('Daten.gs ist noch die alte Fassung.');
  });
  schritt('Code.gs ist neu (Aktion wiki)', function () {
    if (!enthaelt(verteile, "'wiki'")) throw new Error('Code.gs ist noch die alte Fassung.');
  });
  schritt('Upload.gs ist neu (Bilder fürs Wiki)', function () {
    if (!enthaelt(aktionUploadImage, 'zweck')) throw new Error('Upload.gs ist noch die alte Fassung.');
  });

  // 2) Die Tabelle selbst
  var ss = null;
  schritt('Tabelle erreichbar', function () {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    return '„' + ss.getName() + '“ mit ' + ss.getSheets().length + ' Tabs';
  });
  schritt('Größe der Tabelle (Google erlaubt höchstens 10 Millionen Zellen)', function () {
    var zellen = 0;
    ss.getSheets().forEach(function (sh) { zellen += sh.getMaxRows() * sh.getMaxColumns(); });
    if (zellen > 9000000) throw new Error(zellen + ' Zellen, fast an der Grenze. Leere Zeilen in großen Tabs löschen.');
    return zellen + ' Zellen';
  });
  schritt('Tab Wiki: Spaltenköpfe in Zeile 1', function () {
    var sh = ss.getSheetByName('Wiki');
    if (!sh) throw new Error('Tab „Wiki“ fehlt (Name genau so, großes W).');
    var ist = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
    // feste Liste aus Schritt 10.1 (gilt auch, wenn Schema.gs noch alt ist)
    var soll = BASIS.concat(['bereich', 'thema', 'titel', 'adresse', 'text', 'oeffentlich']);
    var fehlt = soll.filter(function (s) { return ist.indexOf(s) < 0; });
    var zuviel = ist.filter(function (s) { return s !== '' && soll.indexOf(s) < 0; });
    if (fehlt.length || zuviel.length) {
      throw new Error('fehlt: ' + JSON.stringify(fehlt) + ', unbekannt (Tippfehler oder Leerzeichen?): ' + JSON.stringify(zuviel));
    }
    return ist.length + ' Spalten, alle richtig';
  });

  // 3) Die Web-App
  schritt('Adresse der Web-App', function () {
    var url = ScriptApp.getService().getUrl();
    return url ? url + ' (muss zur API_URL in js/config.js passen)' : 'keine Bereitstellung gefunden';
  });

  Logger.log(probleme
    ? 'FERTIG mit ' + probleme + ' Problem(en). Bitte die FEHLER-Zeilen oben beheben.'
    : 'ALLES GUT. Meldet die App trotzdem „Unbekannte Tabelle“, läuft im Internet noch die alte Version: ' +
      'Bereitstellen → Bereitstellungen verwalten → Stift → bei Version „Neue Version“ wählen → Bereitstellen.');
}
