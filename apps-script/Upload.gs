// Upload.gs – Aktion "uploadImage": speichert ein verkleinertes JPEG im Drive-Ordner der Gruppe.
// Ordner-IDs stehen nur in den Skripteigenschaften: FOTO_ORDNER_<gruppe_id>, z. B. FOTO_ORDNER_g1.
// Aufruf: { aktion:'uploadImage', token, bild:'<base64 ohne Präfix>', mime:'image/jpeg', zweck:'wiki' (freiwillig) }
// zweck 'wiki' (seit 0.32.0): Bild für eine Wiki-Seite (Dateiname wiki_…, Log „Wiki“). Ohne zweck: Material.
// Antwort: { foto_id }

function fotoOrdnerFuer(gid) {
  var name = 'FOTO_ORDNER_' + gid;
  var id = PropertiesService.getScriptProperties().getProperty(name);
  if (!id) fehler('intern', 'Für diese Gruppe ist kein Foto-Ordner eingerichtet (' + name + ').');
  return id;
}

function aktionUploadImage(ctx, p) {
  var ordnerId = fotoOrdnerFuer(ctx.gruppe_id);

  var b64 = String(p.bild === undefined || p.bild === null ? '' : p.bild);
  if (!b64) fehler('ungueltig', 'Das Bild fehlt.');
  if (b64.length > 4000000) fehler('ungueltig', 'Das Bild ist zu groß.');
  if (p.mime !== 'image/jpeg') fehler('ungueltig', 'Nur JPEG-Bilder sind erlaubt.');

  var bytes;
  try { bytes = Utilities.base64Decode(b64); }
  catch (e) { fehler('ungueltig', 'Das Bild ist ungültig.'); }
  if (bytes.length < 4 || (bytes[0] & 255) !== 255 || (bytes[1] & 255) !== 216 || (bytes[2] & 255) !== 255) {
    fehler('ungueltig', 'Das ist kein gültiges JPEG-Bild.');
  }

  var anzeige = anzeigename(p);
  var zweck = p.zweck === 'wiki' ? 'wiki' : 'material';
  var name = zweck + '_' + jetzt().replace(/[^0-9]/g, '') + '_' + Utilities.getUuid().slice(0, 6) + '.jpg';
  var blob = Utilities.newBlob(bytes, 'image/jpeg', name);
  var datei;
  try {
    datei = DriveApp.getFolderById(ordnerId).createFile(blob);
  } catch (e2) {
    Logger.log(String(e2));
    fehler('intern', 'Das Foto konnte nicht gespeichert werden.');
  }
  try { datei.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e3) { /* Der Ordner gibt die Freigabe meist schon weiter */ }

  protokoll(ctx, 'upload', zweck === 'wiki' ? 'Wiki' : 'Material', [datei.getId()], anzeige);
  return { foto_id: datei.getId() };
}

// Im Editor ausführen: prüft für jede aktive Gruppe, ob der Foto-Ordner erreichbar ist.
function testenFotoOrdner() {
  lies('Gruppen').zeilen.forEach(function (g) {
    if (!truthy(g.aktiv)) return;
    var name = 'FOTO_ORDNER_' + g.gruppe_id;
    var id = PropertiesService.getScriptProperties().getProperty(name);
    if (!id) { Logger.log(g.kurzname + ': FEHLT (' + name + ')'); return; }
    try {
      Logger.log(g.kurzname + ': OK, Ordner "' + DriveApp.getFolderById(id).getName() + '"');
    } catch (e) {
      Logger.log(g.kurzname + ': Ordner nicht erreichbar (ID prüfen)');
    }
  });
}
