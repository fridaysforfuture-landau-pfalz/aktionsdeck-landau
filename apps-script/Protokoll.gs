// Protokoll.gs – Protokolle speichern und an das Google-Dokument der Gruppe anhängen (Etappe 8, Schritt 8.1).
// Die Dokument-ID steht nur in den Skripteigenschaften: PROTOKOLL_DOK_<gruppe_id>, z. B. PROTOKOLL_DOK_g1.
// Freiwillig: PROTOKOLL_LINK_<gruppe_id> = Adresse eines externen Protokolls (z. B. Etherpad), nur https://.
// Das Skript teilt nie etwas und ändert keine Freigabe. Es fügt nur ein, liest das Dokument nicht in die App.
//
// Aktionen (alle mit Token, wie die anderen):
//   protokollSpeichern   { daten }  -> { eintrag, im_dokument, hinweis }
//   protokollInsDokument { id }     -> { eintrag, im_dokument, hinweis }
//   protokollInfo        {}         -> { modus: 'dokument' | 'extern' | 'keins', link }
//
// Hilfsfunktionen in dieser Datei beginnen mit "protokoll" oder "pk" (in Util.gs gibt es schon aus() und protokoll()).

var PK_MARKE = '[[NEUE PROTOKOLLE HIER]]';
var PK_ARTEN = ['plenum', 'ag', 'aktion', 'sonstiges'];

function pkTxt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// "2026-10-22" -> "22.10.2026", sonst unverändert
function pkDatum(d) {
  var s = pkTxt(d);
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? m[3] + '.' + m[2] + '.' + m[1] : s;
}

// ---- Bezug prüfen (wird von aktionCreate, aktionBatchCreate und aktionUpdate in Daten.gs aufgerufen) ----

// Protokolle und Reden: veranstaltung_id ist freiwillig. Ist sie gesetzt, muss sie zur Gruppe gehören.
// (projekt_id prüft schon bezugPruefen in Daten.gs.) cache = {} wird beim ersten Gebrauch gefüllt.
function protokollBezugPruefen(ctx, tab, veranstaltungId, cache) {
  if (tab !== 'Protokolle' && tab !== 'Reden') return;
  var vid = pkTxt(veranstaltungId);
  if (!vid) return;
  if (!cache.veranstaltungen) {
    cache.veranstaltungen = lies('Veranstaltungen');
    pruefeKopf('Veranstaltungen', cache.veranstaltungen.kopf);
  }
  var vz = cache.veranstaltungen.zeilen;
  for (var i = 0; i < vz.length; i++) {
    if (String(vz[i].id) === vid && String(vz[i].gruppe_id) === String(ctx.gruppe_id) && !truthy(vz[i].geloescht)) return;
  }
  fehler('nicht_gefunden', 'Veranstaltung nicht gefunden (vielleicht wurde sie gelöscht).');
}

// ---- Skripteigenschaften ----

function protokollDokId(gid) {
  return pkTxt(PropertiesService.getScriptProperties().getProperty('PROTOKOLL_DOK_' + gid));
}

// Nur https://-Adressen ohne Leerzeichen, sonst ''
function protokollLinkExtern(gid) {
  var link = pkTxt(PropertiesService.getScriptProperties().getProperty('PROTOKOLL_LINK_' + gid));
  return /^https:\/\/[^\s]+$/i.test(link) ? link : '';
}

function aktionProtokollInfo(ctx, p) {
  var dok = protokollDokId(ctx.gruppe_id);
  if (dok) return { modus: 'dokument', link: 'https://docs.google.com/document/d/' + encodeURIComponent(dok) + '/edit' };
  var extern = protokollLinkExtern(ctx.gruppe_id);
  if (extern) return { modus: 'extern', link: extern };
  return { modus: 'keins', link: '' };
}

// ---- Einfügen im Dokument ----

// Sucht den ersten Absatz (oder Listenpunkt) mit der Markierung. Gibt den Index im Dokument oder -1.
function protokollMarkeIndex(body) {
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var c = body.getChild(i);
    var typ = c.getType();
    if (typ !== DocumentApp.ElementType.PARAGRAPH && typ !== DocumentApp.ElementType.LIST_ITEM) continue;
    if (c.asText().getText().indexOf(PK_MARKE) >= 0) return i;
  }
  return -1;
}

// Neuer Absatz mit festem Aussehen (nicht grau und klein wie die Markierung)
function pkAbsatz(body, idx, text, fett) {
  var a = body.insertParagraph(idx, text);
  a.setHeading(DocumentApp.ParagraphHeading.NORMAL);
  if (text) {
    var t = a.editAsText();
    t.setBold(!!fett);
    t.setForegroundColor('#000000');
  }
  return a;
}

// Fügt das Protokoll o (Felder wie im Tab) direkt unter der Markierung ein. Nur Klartext.
// Gibt { ok, hinweis } zurück. Fehlt die Markierung, wird nichts geschrieben.
function protokollEinfuegen(doc, o) {
  var body = doc.getBody();
  var marke = protokollMarkeIndex(body);
  if (marke < 0) return { ok: false, hinweis: 'Markierung fehlt im Dokument (' + PK_MARKE + ').' };

  var idx = marke + 1;
  pkAbsatz(body, idx++, pkTxt(o.titel) || 'Protokoll', true);
  if (pkTxt(o.datum)) pkAbsatz(body, idx++, 'Datum: ' + pkDatum(o.datum), false);
  pkTxt(o.rollen).split(/\r?\n/).forEach(function (z) {
    if (pkTxt(z)) pkAbsatz(body, idx++, pkTxt(z), false);
  });
  if (pkTxt(o.teilnehmende)) pkAbsatz(body, idx++, 'Anwesend: ' + pkTxt(o.teilnehmende), false);
  pkAbsatz(body, idx++, '', false);

  // Protokolltext: Zeilen mit "- " am Anfang werden Aufzählungspunkte
  var liste = null;
  String(o.text === undefined || o.text === null ? '' : o.text).split(/\r?\n/).forEach(function (z) {
    var zeile = z.replace(/\s+$/, '');
    if (/^\s*- /.test(zeile)) {
      var punkt = body.insertListItem(idx++, zeile.replace(/^\s*- /, ''));
      punkt.setGlyphType(DocumentApp.GlyphType.BULLET);
      punkt.editAsText().setBold(false);
      punkt.editAsText().setForegroundColor('#000000');
      if (liste) punkt.setListId(liste); else liste = punkt;
      return;
    }
    liste = null;
    pkAbsatz(body, idx++, zeile, false);
  });

  // Trennlinie nach jedem Protokoll
  var linie = body.insertParagraph(idx++, '');
  linie.appendHorizontalRule();
  return { ok: true, hinweis: '' };
}

// Öffnet das Dokument der Gruppe und fügt ein. Wirft keine Fehler, gibt { ok, hinweis } zurück.
function protokollAnsDokument(gid, o) {
  var dokId = protokollDokId(gid);
  if (!dokId) return { ok: false, hinweis: 'Für diese Gruppe ist kein Dokument eingerichtet.' };
  var doc;
  try {
    doc = DocumentApp.openById(dokId);
  } catch (e) {
    Logger.log(String(e));
    return { ok: false, hinweis: 'Das Dokument ist nicht erreichbar. Bitte die Freigabe für das Skript prüfen.' };
  }
  try {
    var r = protokollEinfuegen(doc, o);
    doc.saveAndClose();
    return r;
  } catch (e2) {
    Logger.log(e2 && e2.stack ? e2.stack : String(e2));
    return { ok: false, hinweis: 'Das Dokument konnte nicht ergänzt werden. Das Protokoll ist trotzdem gespeichert.' };
  }
}

// Setzt im_dokument = TRUE in der Zeile (zeile = Zeilennummer im Sheet)
function protokollMarkieren(sh, kopf, zeile, zeit, anzeige) {
  var neu = { im_dokument: true, geaendert_am: zeit, geaendert_von: anzeige };
  Object.keys(neu).forEach(function (sp) {
    sh.getRange(zeile, kopf.indexOf(sp) + 1).setValue(schuetzen(neu[sp]));
  });
  return neu;
}

// ---- Aktionen ----

function aktionProtokollSpeichern(ctx, p) {
  var tab = 'Protokolle';
  var anzeige = anzeigename(p);
  var daten = p.daten;
  pruefeFelder(tab, daten);
  if (!pkTxt(daten.titel)) fehler('ungueltig', 'Bitte einen Titel angeben.');
  var art = pkTxt(daten.art).toLowerCase();
  if (art && PK_ARTEN.indexOf(art) < 0) fehler('ungueltig', 'Unbekannte Art des Protokolls.');

  // Diese beiden Felder setzt nur das Skript
  var d = {};
  Object.keys(daten).forEach(function (k) { d[k] = daten[k]; });
  d.art = art;
  d.im_dokument = false;
  d.vorschlaege_erledigt = false;

  return mitSperre(function () {
    var sh = blatt(tab);
    var kopf = kopfLesen(sh);
    pruefeKopf(tab, kopf);
    var cache = {};
    bezugPruefen(ctx, tab, d.projekt_id, '', cache);
    protokollBezugPruefen(ctx, tab, d.veranstaltung_id, cache);
    var o = neuerEintrag(tab, ctx, d, anzeige, jetzt());
    var zeile = sh.getLastRow() + 1;
    anhaengen(sh, [zeilenArray(kopf, o)]);
    protokoll(ctx, 'create', tab, [o.id], anzeige);

    // Die Zeile ist gespeichert. Klappt das Dokument nicht, bleibt im_dokument = FALSE.
    var r = protokollAnsDokument(ctx.gruppe_id, o);
    if (r.ok) {
      var neu = protokollMarkieren(sh, kopf, zeile, jetzt(), anzeige);
      Object.keys(neu).forEach(function (sp) { o[sp] = neu[sp]; });
    }
    return { eintrag: o, im_dokument: r.ok, hinweis: r.hinweis };
  });
}

function aktionProtokollInsDokument(ctx, p) {
  var tab = 'Protokolle';
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var t = lies(tab);
    pruefeKopf(tab, t.kopf);
    var z = eintragFinden(t, ctx, p.id);
    // Steht es schon im Dokument, wird nichts doppelt angehängt
    if (truthy(z.im_dokument)) {
      return { eintrag: sauber(z), im_dokument: true, hinweis: 'Das Protokoll steht schon im Dokument.' };
    }
    var r = protokollAnsDokument(ctx.gruppe_id, z);
    if (r.ok) {
      var neu = protokollMarkieren(t.sh, t.kopf, z._zeile, jetzt(), anzeige);
      Object.keys(neu).forEach(function (sp) { z[sp] = neu[sp]; });
      protokoll(ctx, 'update', tab, [z.id], anzeige);
    }
    return { eintrag: sauber(z), im_dokument: r.ok, hinweis: r.hinweis };
  });
}

// ---- Tests für den Editor ----

// Je aktive Gruppe: Modus, Dokument erreichbar (Name), Markierung gefunden. Schreibt nichts.
function testenProtokollDok() {
  lies('Gruppen').zeilen.forEach(function (g) {
    if (!truthy(g.aktiv)) return;
    var gid = String(g.gruppe_id);
    var dokId = protokollDokId(gid);
    if (!dokId) {
      var extern = protokollLinkExtern(gid);
      Logger.log(g.kurzname + ': ' + (extern ? 'Modus extern (Link vorhanden)' : 'Modus keins (kein Dokument eingerichtet)'));
      return;
    }
    var doc;
    try {
      doc = DocumentApp.openById(dokId);
    } catch (e) {
      Logger.log(g.kurzname + ': FEHLER, Dokument nicht erreichbar (ID und Freigabe prüfen)');
      return;
    }
    var marke = protokollMarkeIndex(doc.getBody());
    Logger.log(g.kurzname + ': Modus dokument, "' + doc.getName() + '", ' +
      (marke >= 0 ? 'Markierung gefunden' : 'FEHLER, Markierung ' + PK_MARKE + ' fehlt'));
  });
}

// Legt ein Test-Dokument an, hängt zwei Protokolle an, prüft die Reihenfolge und wirft das Dokument
// in den Papierkorb. Schreibt nie in ein echtes Dokument.
function testenProtokollAnhaengen() {
  var doc = DocumentApp.create('AktionsDeck Test-Protokoll (wird gelöscht)');
  var id = doc.getId();
  try {
    var body = doc.getBody();
    body.appendParagraph('Kopf des Dokuments');
    body.appendParagraph(PK_MARKE);
    body.appendParagraph('Älteres Protokoll');

    var a = protokollEinfuegen(doc, {
      titel: 'Test A', datum: '2026-01-01', rollen: 'Moderation: Test\nProtokoll: Test',
      teilnehmende: 'Test 1, Test 2', text: '1. Punkt\n- Stichpunkt eins\n- Stichpunkt zwei\nSonstiges'
    });
    var b = protokollEinfuegen(doc, { titel: 'Test B', datum: '2026-01-08', text: '=1+1 bleibt Text' });
    doc.saveAndClose();

    var text = DocumentApp.openById(id).getBody().getText();
    var iKopf = text.indexOf('Kopf des Dokuments');
    var iMarke = text.indexOf(PK_MARKE);
    var iA = text.indexOf('Test A');
    var iB = text.indexOf('Test B');
    var iAlt = text.indexOf('Älteres Protokoll');
    Logger.log((a.ok && b.ok ? 'OK' : 'FEHLER') + ': Einfügen meldet ' + a.ok + ' / ' + b.ok);
    Logger.log((iKopf < iMarke && iMarke < iB && iB < iA && iA < iAlt ? 'OK' : 'FEHLER') +
      ': Reihenfolge Kopf, Markierung, Test B (neu), Test A, älteres Protokoll');
    Logger.log((text.indexOf('Stichpunkt eins') > iA ? 'OK' : 'FEHLER') + ': Stichpunkte stehen im Protokoll');
    Logger.log((text.indexOf('=1+1 bleibt Text') > iB ? 'OK' : 'FEHLER') + ': Text mit = bleibt Klartext');

    // Ohne Markierung wird nichts geschrieben
    var doc2 = DocumentApp.openById(id);
    var b2 = doc2.getBody();
    b2.getChild(protokollMarkeIndex(b2)).asText().setText('Markierung entfernt');
    var vorher = b2.getText();
    var c = protokollEinfuegen(doc2, { titel: 'Test C' });
    Logger.log((!c.ok && b2.getText() === vorher ? 'OK' : 'FEHLER') + ': ohne Markierung nichts geschrieben (' + c.hinweis + ')');
    doc2.saveAndClose();
  } catch (e) {
    Logger.log('FEHLER: ' + (e && e.stack ? e.stack : String(e)));
  } finally {
    DriveApp.getFileById(id).setTrashed(true);
    Logger.log('Test-Dokument liegt im Papierkorb.');
  }
}
