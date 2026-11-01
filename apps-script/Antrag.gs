// Antrag.gs – Eine neue Gruppe beantragt ihren Bereich selbst (Etappe 13, seit 1.1.0, Schritt 13.1).
// Der Antrag landet im Tab "Antraege". Er schaltet nichts frei: Das macht nur die Person mit Adminzugriff im Sheet (Schritt 13.3).
// Wege (ohne Login):
//   POST { aktion:'gruppeBeantragen' }                              -> { aufgabe:'3 + 4', schluessel }
//   POST { aktion:'gruppeBeantragen', schluessel, antwort:'7',
//          name, kurzname, farbe, webseite, instagram, beschreibung, falle } -> { gespeichert:true } oder Fehler
// beschreibung (seit 1.1.3): „Wer seid ihr?“, 10 bis 500 Zeichen, nur für die Prüfung im Sheet; beim Freischalten geleert.
// Schutz gegen Roboter und Unsinn: Rechenaufgabe (wie Signal.gs, eigener Vorsatz "antrag"), unsichtbares Feld "falle",
// höchstens ANTRAG_MAX_OFFEN offene Anträge und ANTRAG_MAX_TAG neue Anträge pro Tag (für alle zusammen).
// Keine Kontaktdaten: Die Gruppe meldet sich danach selbst über Signal.
//
// Seit 1.1.2 (Schritt 13.3):
// - Menü „AktionsDeck“ im Sheet (onOpen) mit „Gruppe freischalten“: zeigt den ältesten offenen Antrag.
//   Freischalten fragt nur nach dem PIN und legt dann Gruppe, Zugang und Foto-Ordner an. Ablehnen löscht den Antrag.
//   Der Foto-Ordner kommt in den Drive-Ordner aus der Skripteigenschaft GRUPPEN_ORDNER (ID oder Link).
// - Hinweis unter „Was ist neu?“: listMehrere mit mitAntraegen:true gibt die offenen Anträge (nur Name und Abkürzung) mit,
//   wenn Gruppe und Anzeigename zu den Skripteigenschaften ADMIN_GRUPPE (gruppe_id oder Abkürzung) und ADMIN_NAME passen.
//   ADMIN_NAME darf mehrere Namen enthalten, getrennt durch Komma. Der Anzeigename ist nicht geschützt: darum nur Name und Abkürzung.

var ANTRAG_GUELTIG_MS = 10 * 60 * 1000;
var ANTRAG_MAX_OFFEN = 5;
var ANTRAG_MAX_TAG = 5;

function antragZufall(von, bis) {
  return von + Math.floor(Math.random() * (bis - von + 1));
}

function aktionGruppeBeantragen(p) {
  // Ohne Antwort: neue Rechenaufgabe
  if (p.antwort === undefined || p.antwort === null || p.antwort === '') {
    var a = antragZufall(2, 9);
    var b = antragZufall(2, 9);
    var ablauf = String(Date.now() + ANTRAG_GUELTIG_MS);
    return {
      aufgabe: a + ' + ' + b,
      schluessel: ablauf + '.' + signiere('antrag|' + ablauf + '|' + (a + b))
    };
  }

  antragAufgabePruefen(p);

  // Unsichtbares Feld ausgefüllt: Das war ein Roboter. Er bekommt dieselbe Antwort, es wird aber nichts gespeichert.
  if (textVon(p.falle) !== '') return { gespeichert: true };

  var d = antragDaten(p);
  return mitSperre(function () {
    var antraege = lies('Antraege');
    pruefeKopf('Antraege', antraege.kopf);
    var offen = antraege.zeilen.filter(function (z) { return textKlein(z.status) === 'offen'; });
    if (offen.length >= ANTRAG_MAX_OFFEN) {
      fehler('voll', 'Gerade gehen keine neuen Anträge. Bitte schreibt uns über Signal.');
    }
    var tag = antragTagZaehler();
    if (tag.zahl >= ANTRAG_MAX_TAG) {
      fehler('voll', 'Heute gehen keine neuen Anträge mehr. Bitte versucht es morgen oder schreibt uns über Signal.');
    }
    antragDoppelt(d, lies('Gruppen').zeilen, offen);

    var zeile = {
      antrag_id: 'a_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10),
      erstellt_am: jetzt(),
      status: 'offen',
      name: d.name,
      kurzname: d.kurzname,
      farbe: d.farbe,
      webseite: d.webseite,
      instagram: d.instagram,
      beschreibung: d.beschreibung,
      erledigt_am: '',
      gruppe_id: ''
    };
    anhaengen(antraege.sh, [antraege.kopf.map(function (sp) {
      return schuetzen(zeile.hasOwnProperty(sp) ? zeile[sp] : '');
    })]);
    antragTagZaehlen(tag);
    protokoll({ gruppe_id: '' }, 'antrag', 'Antraege', [zeile.antrag_id], d.name);
    return { gespeichert: true };
  });
}

// Prüft Schlüssel und Antwort der Rechenaufgabe (bricht sonst mit Fehler ab)
function antragAufgabePruefen(p) {
  var teile = String(p.schluessel || '').split('.');
  var antwort = String(p.antwort).trim();
  if (teile.length !== 2 || !/^\d{13}$/.test(teile[0]) || !/^\d{1,2}$/.test(antwort)) {
    fehler('ungueltig', 'Die Rechenaufgabe ist ungültig. Bitte neu laden.');
  }
  if (Number(teile[0]) < Date.now()) fehler('abgelaufen', 'Die Rechenaufgabe ist abgelaufen. Hier ist eine neue.');
  if (!gleich(signiere('antrag|' + teile[0] + '|' + Number(antwort)), teile[1])) {
    fehler('falsch', 'Das Ergebnis stimmt leider nicht. Hier ist eine neue Aufgabe.');
  }
}

// Felder prüfen und säubern. Gibt { name, kurzname, farbe, webseite, instagram } zurück oder bricht mit Fehler ab.
function antragDaten(p) {
  var name = String(p.name === undefined || p.name === null ? '' : p.name)
    .replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (name.length < 2) fehler('ungueltig', 'Bitte gebt den Namen der Gruppe an.');
  if (name.length > 60) fehler('ungueltig', 'Der Name ist zu lang (höchstens 60 Zeichen).');

  var kurzname = textKlein(p.kurzname);
  if (!/^[a-z0-9]{2,12}$/.test(kurzname)) {
    fehler('ungueltig', 'Die Abkürzung braucht 2 bis 12 Zeichen, nur kleine Buchstaben (ohne Umlaute) und Ziffern.');
  }
  // Sieht aus wie eine gruppe_id (g1, g2, …): wäre beim Anmelden nicht eindeutig
  if (/^g\d+$/.test(kurzname)) fehler('ungueltig', 'Diese Abkürzung ist nicht erlaubt. Bitte wählt eine andere.');

  var farbe = tFarbe(p.farbe);   // Termine.gs
  if (!farbe) fehler('ungueltig', 'Bitte wählt eine Farbe.');

  var webseite = textVon(p.webseite);
  if (webseite && (!/^https:\/\/\S+$/i.test(webseite) || webseite.length > 200)) {
    fehler('ungueltig', 'Die Webseite muss mit https:// beginnen (höchstens 200 Zeichen).');
  }

  var instaRoh = textVon(p.instagram);
  var instagram = instaRoh ? tInstagram(instaRoh) : '';   // Termine.gs: Link oder Name
  if (instaRoh && (!instagram || !/^https:\/\//i.test(instagram) || instagram.length > 200)) {
    fehler('ungueltig', 'Instagram bitte als Name (zum Beispiel @gruppe) oder als Link mit https:// angeben.');
  }

  // Seit 1.1.3: „Wer seid ihr?“ (Zeilenumbrüche bleiben, andere Steuerzeichen nicht)
  var beschreibung = String(p.beschreibung === undefined || p.beschreibung === null ? '' : p.beschreibung)
    .replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim();
  if (beschreibung.length < 10) fehler('ungueltig', 'Bitte schreibt kurz, wer ihr seid (mindestens 10 Zeichen).');
  if (beschreibung.length > 500) fehler('ungueltig', 'Der Text „Wer seid ihr?“ ist zu lang (höchstens 500 Zeichen).');

  return { name: name, kurzname: kurzname, farbe: farbe, webseite: webseite, instagram: instagram, beschreibung: beschreibung };
}

// Name und Abkürzung dürfen weder bei einer Gruppe (auch einer nicht aktiven) noch bei einem offenen Antrag vorkommen.
function antragDoppelt(d, gruppen, offen) {
  var alle = gruppen.concat(offen);
  alle.forEach(function (z) {
    if (textKlein(z.kurzname) === d.kurzname || textKlein(z.gruppe_id) === d.kurzname) {
      fehler('doppelt', 'Diese Abkürzung gibt es schon. Bitte wählt eine andere.');
    }
    if (textKlein(z.name) === d.name.toLowerCase()) {
      fehler('doppelt', 'Eine Gruppe mit diesem Namen gibt es schon oder sie ist schon beantragt.');
    }
  });
}

// Zähler für neue Anträge heute (Skripteigenschaft antraege_tag, Tag nach deutscher Zeit)
function antragTagZaehler() {
  var heute = tHeute();   // Termine.gs
  var d = {};
  try { d = JSON.parse(PropertiesService.getScriptProperties().getProperty('antraege_tag') || '{}'); }
  catch (e) { d = {}; }
  return { tag: heute, zahl: d.tag === heute ? Number(d.zahl) || 0 : 0 };
}

function antragTagZaehlen(t) {
  PropertiesService.getScriptProperties().setProperty('antraege_tag', JSON.stringify({ tag: t.tag, zahl: t.zahl + 1 }));
}

// ---- Hinweis für Admins unter „Was ist neu?“ (seit 1.1.2) ----

// Gibt die offenen Anträge zurück, wenn die Anmeldung zu ADMIN_GRUPPE und ADMIN_NAME passt, sonst null.
function antraegeFuerAdmin(ctx, p) {
  var props = PropertiesService.getScriptProperties();
  var gruppe = textKlein(props.getProperty('ADMIN_GRUPPE'));
  var namen = textKlein(props.getProperty('ADMIN_NAME')).split(',')
    .map(function (n) { return n.trim(); }).filter(Boolean);
  if (!gruppe || !namen.length) return null;
  var g = ctx.gruppe || {};
  if (gruppe !== textKlein(ctx.gruppe_id) && gruppe !== textKlein(g.kurzname)) return null;
  if (namen.indexOf(textKlein(anzeigename(p))) < 0) return null;
  var zeilen;
  try { zeilen = liesGemerkt('Antraege').zeilen; }
  catch (e) { return null; }   // Tab fehlt noch: dann eben kein Hinweis
  return zeilen.filter(function (z) { return textKlein(z.status) === 'offen'; }).map(function (z) {
    return { name: textVon(z.name), kurzname: textVon(z.kurzname), erstellt_am: textVon(z.erstellt_am) };
  });
}

// ---- Menü im Sheet (seit 1.1.2) ----

// Läuft von selbst, wenn jemand mit Bearbeitungsrecht das Sheet öffnet.
function onOpen() {
  SpreadsheetApp.getUi().createMenu('AktionsDeck')
    .addItem('Gruppe freischalten', 'gruppeFreischalten')
    .addToUi();
}

// Zeigt den ältesten offenen Antrag: Ja = freischalten, Nein = ablehnen, Abbrechen = später.
function gruppeFreischalten() {
  var ui = SpreadsheetApp.getUi();
  try {
    var offen = lies('Antraege').zeilen.filter(function (z) { return textKlein(z.status) === 'offen'; });
    if (!offen.length) { ui.alert('Gerade gibt es keine offenen Anträge.'); return; }
    offen.sort(function (a, b) { return textVon(a.erstellt_am).localeCompare(textVon(b.erstellt_am)); });
    var a = offen[0];
    var wahl = ui.alert(offen.length > 1 ? 'Antrag 1 von ' + offen.length : 'Antrag',
      antragText(a) + '\n\nJa = freischalten\nNein = ablehnen (der Antrag wird gelöscht)\nAbbrechen = später entscheiden',
      ui.ButtonSet.YES_NO_CANCEL);
    if (wahl === ui.Button.YES) antragFreischaltenFragen(ui, a);
    else if (wahl === ui.Button.NO) antragAblehnenFragen(ui, a);
  } catch (e) {
    ui.alert('FEHLER: ' + (e && e.message ? e.message : e) + '\n\nBitte diesen Text kopieren und mir schicken.');
  }
}

function antragText(a) {
  return 'Name: ' + textVon(a.name) +
    '\nAbkürzung: ' + textVon(a.kurzname) +
    '\nFarbe: ' + textVon(a.farbe) +
    (textVon(a.webseite) ? '\nWebseite: ' + textVon(a.webseite) : '') +
    (textVon(a.instagram) ? '\nInstagram: ' + textVon(a.instagram) : '') +
    (textVon(a.beschreibung) ? '\n\nWer seid ihr?\n' + textVon(a.beschreibung) + '\n' : '') +
    '\nEingegangen: ' + textVon(a.erstellt_am).slice(0, 10);
}

function antragFreischaltenFragen(ui, a) {
  var r1 = ui.prompt('PIN für ' + textVon(a.name), 'Mindestens ' + SETUP_MIN_PIN + ' Zeichen. Abbrechen = nichts tun.', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var pin = r1.getResponseText().trim();
  if (pin.length < SETUP_MIN_PIN) { ui.alert('Der PIN ist zu kurz (mindestens ' + SETUP_MIN_PIN + ' Zeichen). Es wurde nichts geändert.'); return; }
  var r2 = ui.prompt('PIN wiederholen', 'Bitte den PIN noch einmal eintippen.', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  if (r2.getResponseText().trim() !== pin) { ui.alert('Die beiden PINs sind nicht gleich. Es wurde nichts geändert.'); return; }

  var e = antragFreischalten(textVon(a.antrag_id), pin);
  ui.alert(textVon(a.name) + ' (' + e.gruppe_id + ') ist freigeschaltet.',
    'Die Gruppe steht jetzt auf der Startseite (Abkürzung „' + textVon(a.kurzname) + '“).\n\n' +
    e.ordner + '\n\nGib den PIN jetzt auf einem sicheren Weg an die Gruppe weiter.' +
    (e.nochOffen ? '\n\nEs gibt noch ' + e.nochOffen + ' offene(n) Antrag/Anträge. Klicke dafür noch einmal auf „Gruppe freischalten“.' : ''),
    ui.ButtonSet.OK);
}

function antragAblehnenFragen(ui, a) {
  var ok = ui.alert('Antrag wirklich ablehnen?', 'Der Antrag von „' + textVon(a.name) + '“ wird gelöscht.', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  mitSperre(function () {
    var t = lies('Antraege');
    var z = antragZeile(t, textVon(a.antrag_id));
    t.sh.deleteRow(z._zeile);
    protokoll({ gruppe_id: '' }, 'antrag_abgelehnt', 'Antraege', [textVon(a.antrag_id)], 'Admin im Sheet');
  });
  ui.alert('Der Antrag von „' + textVon(a.name) + '“ ist abgelehnt und gelöscht.');
}

// Sucht einen offenen Antrag nach antrag_id (bricht sonst mit Fehler ab)
function antragZeile(t, id) {
  var z = t.zeilen.filter(function (x) { return textVon(x.antrag_id) === id; })[0];
  if (!z) fehler('nicht_gefunden', 'Der Antrag ist nicht mehr da.');
  if (textKlein(z.status) !== 'offen') fehler('ungueltig', 'Der Antrag ist schon erledigt (' + textVon(z.status) + ').');
  return z;
}

// Nächste freie gruppe_id (g1, g2, …), auch mit Blick auf "Zugang", damit nie eine alte Nummer wiederkommt.
function antragNaechsteId(gruppen, zugaenge) {
  var max = 0;
  gruppen.concat(zugaenge).forEach(function (z) {
    var m = /^g(\d+)$/.exec(textVon(z.gruppe_id));
    if (m) max = Math.max(max, Number(m[1]));
  });
  return 'g' + (max + 1);
}

// Legt Gruppe und Zugang an, setzt den Antrag auf "freigeschaltet" und legt den Foto-Ordner an.
// Gibt { gruppe_id, ordner (Text für die Meldung), nochOffen } zurück.
function antragFreischalten(id, pin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var e = mitSperre(function () {
    var t = lies('Antraege');
    pruefeKopf('Antraege', t.kopf);
    var a = antragZeile(t, id);
    var gruppen = lies('Gruppen');
    pruefeKopf('Gruppen', gruppen.kopf);
    var d = antragDaten(a);   // dieselben Regeln wie beim Antrag (falls jemand im Sheet etwas geändert hat)
    antragDoppelt(d, gruppen.zeilen, []);
    var zSheet = ss.getSheetByName('Zugang');
    if (!zSheet) fehler('intern', 'Tab "Zugang" fehlt.');
    var zi = zugangSpalten_(zSheet);   // Setup.gs
    if (zi.fehlt) fehler('intern', 'Im Tab "Zugang" fehlt die Spalte "' + zi.fehlt + '".');
    var gid = antragNaechsteId(gruppen.zeilen, lies('Zugang').zeilen);

    var neu = {
      gruppe_id: gid, name: d.name, kurzname: d.kurzname, farbe: d.farbe, sortierung: '',
      aktiv: true, webseite: d.webseite, instagram: d.instagram, weitere_links: ''
    };
    // Zuerst der Zugang, dann die Gruppe: Bricht etwas ab, steht nie eine Gruppe ohne PIN auf der Startseite.
    zugangSchreiben_(zSheet, zi, gid, pin);   // Setup.gs
    anhaengen(gruppen.sh, [gruppen.kopf.map(function (sp) {
      return schuetzen(neu.hasOwnProperty(sp) ? neu[sp] : '');
    })]);

    var spalte = function (sp) { return t.kopf.indexOf(sp) + 1; };
    t.sh.getRange(a._zeile, spalte('status')).setValue('freigeschaltet');
    t.sh.getRange(a._zeile, spalte('erledigt_am')).setValue(jetzt());
    t.sh.getRange(a._zeile, spalte('gruppe_id')).setValue(gid);
    t.sh.getRange(a._zeile, spalte('beschreibung')).setValue('');   // wird nach der Prüfung nicht mehr gebraucht
    protokoll({ gruppe_id: gid }, 'antrag_freigeschaltet', 'Antraege', [id], 'Admin im Sheet');
    var nochOffen = t.zeilen.filter(function (z) { return textKlein(z.status) === 'offen'; }).length - 1;
    return { gruppe_id: gid, name: d.name, nochOffen: nochOffen };
  });
  e.ordner = antragFotoOrdner(e.gruppe_id, e.name);
  return e;
}

// Legt den Foto-Ordner der Gruppe an und setzt FOTO_ORDNER_<gruppe_id>. Gibt einen Satz für die Meldung zurück.
// Klappt es nicht, bleibt die Gruppe trotzdem freigeschaltet (Fotos gehen dann erst, wenn der Ordner von Hand eingetragen ist).
function antragFotoOrdner(gid, name) {
  var props = PropertiesService.getScriptProperties();
  var eigenschaft = 'FOTO_ORDNER_' + gid;
  if (props.getProperty(eigenschaft)) return 'Foto-Ordner: war schon eingetragen.';
  var roh = textVon(props.getProperty('GRUPPEN_ORDNER'));
  var m = /folders\/([A-Za-z0-9_-]+)/.exec(roh);
  var oberId = m ? m[1] : roh;
  if (!/^[A-Za-z0-9_-]{10,}$/.test(oberId)) {
    return 'Foto-Ordner: NICHT angelegt, weil die Skripteigenschaft GRUPPEN_ORDNER fehlt. Fotos gehen erst, wenn ' + eigenschaft + ' eingetragen ist.';
  }
  try {
    var ordner = DriveApp.getFolderById(oberId).createFolder('AktionsDeck Fotos – ' + name + ' (' + gid + ')');
    try { ordner.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
    catch (e2) { /* Freigabe erbt meist vom oberen Ordner */ }
    props.setProperty(eigenschaft, ordner.getId());
    return 'Foto-Ordner: angelegt und als ' + eigenschaft + ' eingetragen.';
  } catch (e) {
    return 'Foto-Ordner: NICHT angelegt. Google meldet: ' + String(e && e.message ? e.message : e).slice(0, 200);
  }
}

// ---- Editor-Test: prüft nur die Regeln für die Felder. Schreibt nichts ins Sheet. ----
// Im Editor oben "testenAntrag" wählen und "Ausführen". Im Protokoll darf kein "FEHLER" stehen.
function testenAntrag() {
  var fehlerZahl = 0;
  function pruefe(nr, text, ist, soll) {
    var gut = JSON.stringify(ist) === JSON.stringify(soll);
    if (!gut) fehlerZahl++;
    Logger.log(nr + ') ' + (gut ? 'ok' : 'FEHLER') + ': ' + text + (gut ? '' : ' (ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll) + ')'));
  }
  function abgelehnt(fn) {
    try { fn(); return false; } catch (e) { return !!e.code; }
  }
  var gut = { name: 'Test Gruppe', kurzname: 'tg', farbe: '#12aB34', beschreibung: 'Wir sind eine Testgruppe.' };
  function mit(extra) {
    var o = {};
    Object.keys(gut).forEach(function (k) { o[k] = gut[k]; });
    Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }

  var d = antragDaten(mit({ instagram: '@test.gruppe', webseite: 'https://example.org' }));
  pruefe(1, 'gültiger Antrag wird angenommen', d.kurzname, 'tg');
  pruefe(2, 'Instagram-Name wird zum Link', d.instagram, 'https://www.instagram.com/test.gruppe');
  pruefe(3, 'Abkürzung wird klein geschrieben', antragDaten(mit({ kurzname: 'TG' })).kurzname, 'tg');
  pruefe(4, 'Name zu kurz abgelehnt', abgelehnt(function () { antragDaten(mit({ name: 'x' })); }), true);
  pruefe(5, 'Name zu lang abgelehnt', abgelehnt(function () { antragDaten(mit({ name: new Array(62).join('a') })); }), true);
  pruefe(6, 'Abkürzung mit Umlaut abgelehnt', abgelehnt(function () { antragDaten(mit({ kurzname: 'grün' })); }), true);
  pruefe(7, 'Abkürzung wie gruppe_id abgelehnt', abgelehnt(function () { antragDaten(mit({ kurzname: 'g4' })); }), true);
  pruefe(8, 'Farbe ohne # abgelehnt', abgelehnt(function () { antragDaten(mit({ farbe: '12ab34' })); }), true);
  pruefe(9, 'Webseite mit http:// abgelehnt', abgelehnt(function () { antragDaten(mit({ webseite: 'http://example.org' })); }), true);
  pruefe(10, 'Webseite mit javascript: abgelehnt', abgelehnt(function () { antragDaten(mit({ webseite: 'javascript:alert(1)' })); }), true);
  pruefe(11, 'Instagram mit Unsinn abgelehnt', abgelehnt(function () { antragDaten(mit({ instagram: 'a b c' })); }), true);
  pruefe(12, 'Steuerzeichen im Namen werden entfernt', antragDaten(mit({ name: 'Test\n Gruppe' })).name, 'Test Gruppe');

  var gruppen = [{ gruppe_id: 'g1', name: 'Fridays for Future', kurzname: 'fff' }];
  var offen = [{ name: 'Wartende Gruppe', kurzname: 'wg', status: 'offen' }];
  pruefe(13, 'vorhandene Abkürzung abgelehnt', abgelehnt(function () { antragDoppelt(antragDaten(mit({ kurzname: 'fff' })), gruppen, offen); }), true);
  pruefe(14, 'vorhandener Name abgelehnt (groß/klein egal)', abgelehnt(function () { antragDoppelt(antragDaten(mit({ name: 'fridays FOR future' })), gruppen, offen); }), true);
  pruefe(15, 'Abkürzung eines offenen Antrags abgelehnt', abgelehnt(function () { antragDoppelt(antragDaten(mit({ kurzname: 'wg' })), gruppen, offen); }), true);
  pruefe(16, 'neue Gruppe ist frei', abgelehnt(function () { antragDoppelt(antragDaten(gut), gruppen, offen); }), false);

  var aufgabe = aktionGruppeBeantragen({});
  pruefe(17, 'Rechenaufgabe kommt', /^\d \+ \d$/.test(aufgabe.aufgabe), true);
  var summe = aufgabe.aufgabe.split(' + ').reduce(function (s, x) { return s + Number(x); }, 0);
  pruefe(18, 'richtige Antwort wird angenommen', abgelehnt(function () { antragAufgabePruefen({ schluessel: aufgabe.schluessel, antwort: String(summe) }); }), false);
  pruefe(19, 'falsche Antwort wird abgelehnt', abgelehnt(function () { antragAufgabePruefen({ schluessel: aufgabe.schluessel, antwort: String(summe + 1) }); }), true);
  var signal = aufgabe.schluessel.split('.')[0] + '.' + signiere('signal|' + aufgabe.schluessel.split('.')[0] + '|' + summe);
  pruefe(20, 'Schlüssel vom Signal-Knopf gilt hier nicht', abgelehnt(function () { antragAufgabePruefen({ schluessel: signal, antwort: String(summe) }); }), true);

  pruefe(23, 'Text „Wer seid ihr?“ zu kurz abgelehnt', abgelehnt(function () { antragDaten(mit({ beschreibung: 'kurz' })); }), true);
  pruefe(24, 'Text „Wer seid ihr?“ zu lang abgelehnt', abgelehnt(function () { antragDaten(mit({ beschreibung: new Array(502).join('a') })); }), true);
  pruefe(25, 'Zeilenumbruch im Text bleibt', antragDaten(mit({ beschreibung: 'Zeile eins\r\nZeile zwei' })).beschreibung, 'Zeile eins\nZeile zwei');
  pruefe(21, 'nächste gruppe_id nach g3 ist g4', antragNaechsteId([{ gruppe_id: 'g1' }, { gruppe_id: 'g3' }], [{ gruppe_id: 'g2' }]), 'g4');
  pruefe(22, 'alte Nummer im Tab Zugang zählt mit', antragNaechsteId([{ gruppe_id: 'g1' }], [{ gruppe_id: 'g5' }]), 'g6');

  Logger.log(fehlerZahl ? 'Fertig, ' + fehlerZahl + ' FEHLER (siehe oben).' : 'Fertig, alles ok.');
}
