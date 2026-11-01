// Antrag.gs – Eine neue Gruppe beantragt ihren Bereich selbst (Etappe 13, seit 1.1.0, Schritt 13.1).
// Der Antrag landet im Tab "Antraege". Er schaltet nichts frei: Das macht nur die Person mit Adminzugriff im Sheet (Schritt 13.3).
// Wege (ohne Login):
//   POST { aktion:'gruppeBeantragen' }                              -> { aufgabe:'3 + 4', schluessel }
//   POST { aktion:'gruppeBeantragen', schluessel, antwort:'7',
//          name, kurzname, farbe, webseite, instagram, falle }      -> { gespeichert:true } oder Fehler
// Schutz gegen Roboter und Unsinn: Rechenaufgabe (wie Signal.gs, eigener Vorsatz "antrag"), unsichtbares Feld "falle",
// höchstens ANTRAG_MAX_OFFEN offene Anträge und ANTRAG_MAX_TAG neue Anträge pro Tag (für alle zusammen).
// Keine Kontaktdaten: Die Gruppe meldet sich danach selbst über Signal.

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

  return { name: name, kurzname: kurzname, farbe: farbe, webseite: webseite, instagram: instagram };
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
  var gut = { name: 'Test Gruppe', kurzname: 'tg', farbe: '#12aB34' };
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

  Logger.log(fehlerZahl ? 'Fertig, ' + fehlerZahl + ' FEHLER (siehe oben).' : 'Fertig, alles ok.');
}
