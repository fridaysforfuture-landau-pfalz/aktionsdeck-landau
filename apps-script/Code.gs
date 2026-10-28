// Code.gs – Eingang der Web-App: nimmt POST entgegen und verteilt auf die Aktionen.

function doPost(e) {
  var antwort;
  try {
    var p = JSON.parse(e.postData.contents);
    antwort = { ok: true, data: verteile(p), error: null };
  } catch (err) {
    antwort = fehlerAntwort(err);
  }
  return ContentService.createTextOutput(JSON.stringify(antwort))
    .setMimeType(ContentService.MimeType.JSON);
}

// Nur zum Testen im Browser (zeigt, dass die Web-App läuft).
function doGet(e) {
  if (e && e.parameter && e.parameter.aktion === 'termine') return termineGet(e.parameter);
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, data: 'AktionsDeck API läuft', error: null })
  ).setMimeType(ContentService.MimeType.JSON);
}

function verteile(p) {
  if (!p || typeof p.aktion !== 'string') fehler('ungueltig', 'Aktion fehlt.');

  // Ohne Login
  if (p.aktion === 'gruppen') return aktionGruppen(p);
  if (p.aktion === 'login') return aktionLogin(p);
  if (p.aktion === 'termine') return aktionTermine(p);
  if (p.aktion === 'wiki') return aktionWiki(p);

  // Mit Login: Token, Gruppe und Zugang werden bei JEDEM Aufruf geprüft
  var ctx = tokenPruefen(p.token);
  switch (p.aktion) {
    case 'bootstrap':       return aktionBootstrap(ctx, p);
    case 'list':            return aktionList(ctx, p);
    case 'listMehrere':     return aktionListMehrere(ctx, p);
    case 'create':          return aktionCreate(ctx, p);
    case 'update':          return aktionUpdate(ctx, p);
    case 'delete':          return aktionDelete(ctx, p);
    case 'batchCreate':     return aktionBatchCreate(ctx, p);
    case 'projektLoeschen': return aktionProjektLoeschen(ctx, p);
    case 'buchen':          return aktionBuchen(ctx, p);
    case 'uploadImage':     return aktionUploadImage(ctx, p);
    case 'protokollSpeichern':   return aktionProtokollSpeichern(ctx, p);
    case 'protokollInsDokument': return aktionProtokollInsDokument(ctx, p);
    case 'protokollInfo':        return aktionProtokollInfo(ctx, p);
    case 'gruppeInfo':           return aktionGruppeInfo(ctx, p);          // Konto.gs, seit 0.33.0
    case 'kontoAktualisieren':   return aktionKontoAktualisieren(ctx, p);  // Konto.gs, seit 0.33.0
    default: fehler('ungueltig', 'Unbekannte Aktion.');
  }
}

function fehlerAntwort(err) {
  if (err && err.code) {
    return { ok: false, data: err.data || null, error: err.message, code: err.code };
  }
  Logger.log(err && err.stack ? err.stack : String(err));
  return { ok: false, data: null, error: 'Interner Fehler. Bitte später noch einmal versuchen.', code: 'intern' };
}

// Testfunktion für den Editor (Schritt 1.2.7)
function testen() {
  Logger.log(JSON.stringify(verteile({ aktion: 'gruppen' })));
}
