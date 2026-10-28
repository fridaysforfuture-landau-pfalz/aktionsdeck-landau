// apps-script/Setup.gs
// Einmalig benutzen: Geheimnis anlegen und PINs setzen.
// Hier stehen KEINE PINs und KEINE Geheimnisse.
// Der Hash wird mit pinHash() aus Util.gs berechnet (gleiche Regel wie beim Login).

var SETUP_MIN_PIN = 6;

// Legt das Token-Geheimnis in den Skripteigenschaften an (nur wenn es fehlt).
function setupGeheimnis() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('TOKEN_GEHEIMNIS')) {
    return 'Geheimnis war schon da (unverändert).';
  }
  var secret = (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid())
    .replace(/-/g, '');
  props.setProperty('TOKEN_GEHEIMNIS', secret);
  return 'Geheimnis neu angelegt.';
}

function setupIstAktiv_(v) {
  var s = String(v).trim().toUpperCase();
  return v === true || s === 'TRUE' || s === 'WAHR';
}

function setupKopf_(zeile) {
  return zeile.map(function (h) {
    return String(h).trim().toLowerCase();
  });
}

// Fragt für jede aktive Gruppe nach einem PIN und schreibt den Hash in "Zugang".
function setupPins() {
  var ui = SpreadsheetApp.getUi();
  try {
    setupPinsLauf_(ui);
    merkenVergessen();   // 12.6: neuer PIN gilt sofort (Zwischenspeicher des Skripts leeren)
  } catch (e) {
    ui.alert('FEHLER: ' + e.message + '\n\nBitte diesen Text kopieren und mir schicken.');
  }
}

function setupPinsLauf_(ui) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var msgGeheimnis = setupGeheimnis();

  var gSheet = ss.getSheetByName('Gruppen');
  var zSheet = ss.getSheetByName('Zugang');
  if (!gSheet || !zSheet) {
    ui.alert('Tab "Gruppen" oder "Zugang" fehlt (Schritt 1.1).');
    return;
  }

  var gData = gSheet.getDataRange().getValues();
  var gHead = setupKopf_(gData[0]);
  var gi = {
    id: gHead.indexOf('gruppe_id'),
    name: gHead.indexOf('name'),
    aktiv: gHead.indexOf('aktiv')
  };
  if (gi.id < 0 || gi.name < 0 || gi.aktiv < 0) {
    ui.alert('Im Tab "Gruppen" fehlt eine Spalte: gruppe_id, name oder aktiv.\n' +
      'Gefundene Spalten: ' + gHead.join(', '));
    return;
  }

  var zHead = setupKopf_(zSheet.getRange(1, 1, 1, Math.max(zSheet.getLastColumn(), 1)).getValues()[0]);
  var zi = {
    zugang_id: zHead.indexOf('zugang_id'),
    gruppe_id: zHead.indexOf('gruppe_id'),
    pin_salt: zHead.indexOf('pin_salt'),
    pin_hash: zHead.indexOf('pin_hash'),
    aktiv: zHead.indexOf('aktiv'),
    gueltig_bis: zHead.indexOf('gueltig_bis')
  };
  for (var key in zi) {
    if (zi[key] < 0) {
      ui.alert('Im Tab "Zugang" fehlt die Spalte "' + key + '".\n' +
        'Gefundene Spalten: ' + zHead.join(', '));
      return;
    }
  }

  var liste = [];
  var gruppen = [];
  for (var r = 1; r < gData.length; r++) {
    var gid = String(gData[r][gi.id]).trim();
    var nm = String(gData[r][gi.name]).trim();
    if (!gid) continue;
    var ak = setupIstAktiv_(gData[r][gi.aktiv]);
    liste.push((ak ? 'ja   ' : 'NEIN ') + nm + ' (' + gid + ')');
    if (ak) gruppen.push({ id: gid, name: nm });
  }
  ui.alert('Gefundene Gruppen (aktiv?):\n' + (liste.join('\n') || '(keine)') +
    '\n\nPIN wird nur für die mit "ja" abgefragt.');

  var erledigt = [];
  var uebersprungen = [];
  for (var n = 0; n < gruppen.length; n++) {
    var g = gruppen[n];
    var antwort = ui.prompt(
      'PIN für ' + g.name,
      'Mindestens ' + SETUP_MIN_PIN + ' Zeichen. Abbrechen = überspringen.',
      ui.ButtonSet.OK_CANCEL
    );
    if (antwort.getSelectedButton() !== ui.Button.OK) {
      uebersprungen.push(g.name + ' (abgebrochen)');
      continue;
    }
    var pin = antwort.getResponseText().trim();
    if (pin.length < SETUP_MIN_PIN) {
      uebersprungen.push(g.name + ' (PIN zu kurz)');
      continue;
    }

    var salt = Utilities.getUuid().replace(/-/g, '');
    var hash = pinHash(salt, pin);   // aus Util.gs

    var zWerte = zSheet.getDataRange().getValues();
    var zeile = -1;
    for (var k = 1; k < zWerte.length; k++) {
      if (String(zWerte[k][zi.gruppe_id]).trim() === g.id) { zeile = k + 1; break; }
    }
    if (zeile === -1) zeile = Math.max(zSheet.getLastRow(), 1) + 1;
    if (zeile > zSheet.getMaxRows()) {
      zSheet.insertRowsAfter(zSheet.getMaxRows(), zeile - zSheet.getMaxRows());
    }

    var textCols = ['zugang_id', 'gruppe_id', 'pin_salt', 'pin_hash', 'gueltig_bis'];
    textCols.forEach(function (c) {
      zSheet.getRange(zeile, zi[c] + 1).setNumberFormat('@');
    });
    zSheet.getRange(zeile, zi.zugang_id + 1).setValue('z_' + g.id);
    zSheet.getRange(zeile, zi.gruppe_id + 1).setValue(g.id);
    zSheet.getRange(zeile, zi.pin_salt + 1).setValue(salt);
    zSheet.getRange(zeile, zi.pin_hash + 1).setValue(hash);
    zSheet.getRange(zeile, zi.gueltig_bis + 1).setValue('');
    var aktivZelle = zSheet.getRange(zeile, zi.aktiv + 1);
    aktivZelle.setNumberFormat('General');
    aktivZelle.setValue(true);
    SpreadsheetApp.flush();

    erledigt.push(g.name);
  }

  ui.alert(
    msgGeheimnis +
    '\n\nPIN gesetzt für: ' + (erledigt.length ? erledigt.join(', ') : '(keine)') +
    (uebersprungen.length ? '\n\nÜbersprungen: ' + uebersprungen.join(', ') : '')
  );
}
