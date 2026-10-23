// Wiki.gs – Etappe 10 (Wiki): Prüfungen für den Tab Wiki, Mitlöschen der Kommentare
// und die öffentliche Aktion "wiki" (ohne Login). Dazu Tests für den Editor (testenWiki, testenWikiSicher).
// Alle Hilfsfunktionen beginnen mit "wiki" (in Util.gs gibt es schon aus()).
// Benutzt die Helfer tLink, tInstagram, tLinks, tFarbe aus Termine.gs.
//
// - Wiki: eine Zeile je Seite. bereich = skillshare | anleitung (eigene Anleitungsseite der Gruppe).
//   thema = Thema im Skillshare (die feste Liste steht in der App, hier wird nur die Länge geprüft).
//   titel in der Gruppe nur einmal (Groß- und Kleinschreibung egal).
//   adresse = Teil des öffentlichen Links (a-z, 0-9, Bindestrich), in der Gruppe nur einmal.
//   oeffentlich = TRUE: ohne Login lesbar.
// - Seite gelöscht: ihre Kommentare (bezug_art wiki) gehen mit.
// - Öffentliche Aktion (nur POST):
//   { aktion:'wiki' }                                -> { seiten:[... ohne Text], gruppen:[...] }
//   { aktion:'wiki', gruppe:'fff', adresse:'demo' }  -> { seite:{... mit text} }
//   Keine IDs, keine Namen, keine Uhrzeiten. Der mitgeschickte Anzeigename wird nicht gelesen.

var WIKI_BEREICHE = ['skillshare', 'anleitung'];
var WIKI_CACHE_SEK = 120;

function wikiTxt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function wikiKey(v) {
  return wikiTxt(v).toLowerCase();
}

// "demo-anmelden": nur a-z und 0-9, Bindestrich nur zwischen zwei Zeichen, höchstens 60 Zeichen
function wikiAdresseOk(s) {
  var t = String(s === undefined || s === null ? '' : s);
  return t.length >= 1 && t.length <= 60 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(t);
}

// Gibt es den Wert (titel oder adresse) in der Gruppe schon (nicht gelöscht, andere ID)?
function wikiVergeben(zeilen, gid, sp, wert, ohneId) {
  var k = wikiKey(wert);
  return zeilen.some(function (z) {
    return String(z.gruppe_id) === String(gid) && !truthy(z.geloescht) &&
      String(z.id) !== String(ohneId) && wikiKey(z[sp]) === k;
  });
}

// Prüft einen Eintrag vor dem Schreiben (create, batchCreate, update), wie teamPruefen.
// d = der ganze Eintrag (bei update: alter Stand mit den Änderungen), id = seine ID.
// geaendert = Liste der geänderten Spalten (update) oder null (neu angelegt).
// cache = {} wie bei bezugPruefen; bei batchCreate merkt er sich auch Titel und Adressen der Liste.
function wikiPruefen(ctx, tab, d, id, cache, geaendert) {
  if (tab !== 'Wiki') return;
  var neu = geaendert === null;
  var gid = String(ctx.gruppe_id);
  function hat(sp) { return neu || geaendert.indexOf(sp) >= 0; }
  function tabelle() {
    if (!cache.wiki) {
      cache.wiki = lies('Wiki');
      pruefeKopf('Wiki', cache.wiki.kopf);
    }
    return cache.wiki;
  }
  function eindeutig(sp, wert, text) {
    var liste = cache['wiki_' + sp] || (cache['wiki_' + sp] = []);
    if (wikiVergeben(tabelle().zeilen, gid, sp, wert, id) || liste.indexOf(wikiKey(wert)) >= 0) fehler('ungueltig', text);
    liste.push(wikiKey(wert));
  }

  if (hat('bereich') && WIKI_BEREICHE.indexOf(wikiTxt(d.bereich)) < 0) {
    fehler('ungueltig', 'Der Bereich muss „skillshare“ oder „anleitung“ sein.');
  }
  if (hat('titel')) {
    if (!wikiTxt(d.titel)) fehler('ungueltig', 'Bitte einen Titel angeben.');
    eindeutig('titel', d.titel, 'Eine Seite mit diesem Titel gibt es schon.');
  }
  if (hat('adresse')) {
    if (!wikiAdresseOk(d.adresse)) {
      fehler('ungueltig', 'Die Adresse darf nur kleine Buchstaben a–z, Ziffern und Bindestriche haben (höchstens 60 Zeichen).');
    }
    eindeutig('adresse', d.adresse, 'Eine Seite mit dieser Adresse gibt es schon.');
  }
}

// Seite gelöscht: ihre Kommentare weich mitlöschen (innerhalb der Sperre von aktionDelete)
function wikiKaskade(ctx, tab, z, zeit, anzeige) {
  if (tab !== 'Wiki') return 0;
  var kt = lies('Kommentare');
  pruefeKopf('Kommentare', kt.kopf);
  var weg = kt.zeilen.filter(function (r) {
    return String(r.gruppe_id) === String(ctx.gruppe_id) && !truthy(r.geloescht) &&
      String(r.bezug_art) === 'wiki' && String(r.bezug_id) === String(z.id);
  });
  if (weg.length) {
    schreibeSpalten(kt, weg, { geloescht: true, geaendert_am: zeit, geaendert_von: schuetzen(anzeige) });
    protokoll(ctx, 'delete', 'Kommentare', weg.map(function (r) { return r.id; }), anzeige);
  }
  return weg.length;
}

// ---- Öffentlich (ohne Login) ----

// Gruppe und Adresse prüfen. Gibt { gruppe, adresse } zurück ('' = nicht angegeben).
function wikiFilter(p) {
  var g = String((p && p.gruppe) || '').trim().toLowerCase();
  var a = String((p && p.adresse) || '').trim();
  if (!/^[a-z0-9_-]{0,30}$/.test(g)) fehler('ungueltig', 'Die Gruppe ist ungültig.');
  if (a && !wikiAdresseOk(a)) fehler('ungueltig', 'Die Adresse ist ungültig.');
  if ((g && !a) || (a && !g)) fehler('ungueltig', 'Bitte Gruppe und Adresse zusammen angeben.');
  return { gruppe: g, adresse: a };
}

// Zeitstempel -> "JJJJ-MM-TT" (deutsche Zeit), sonst ''
function wikiStand(iso) {
  var d = new Date(String(iso || ''));
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, 'Europe/Berlin', 'yyyy-MM-dd');
}

function wikiGruppenAktiv() {
  var liste = lies('Gruppen').zeilen.filter(function (g) { return truthy(g.aktiv); });
  liste.sort(function (a, b) { return Number(a.sortierung) - Number(b.sortierung); });
  return liste;
}

// Eine öffentliche Seite mit den erlaubten Feldern (mitText: auch text)
function wikiOeffentlicheSeite(z, g, mitText) {
  var o = {
    bereich: String(z.bereich),
    thema: String(z.thema),
    titel: String(z.titel),
    adresse: String(z.adresse),
    stand: wikiStand(z.geaendert_am),
    kurzname: String(g.kurzname),
    gruppe_name: String(g.name),
    farbe: tFarbe(g.farbe)
  };
  if (mitText) o.text = String(z.text);
  return o;
}

// Liest das Sheet: alle öffentlichen Seiten aktiver Gruppen. kurz/adresse gesetzt: nur diese eine (mit Text).
function wikiLesen(kurz, adresse) {
  var gruppen = {};
  var aktiv = wikiGruppenAktiv();
  aktiv.forEach(function (g) { gruppen[String(g.gruppe_id)] = g; });
  var t = lies('Wiki');
  pruefeKopf('Wiki', t.kopf);

  var seiten = [];
  t.zeilen.forEach(function (z) {
    if (truthy(z.geloescht) || !truthy(z.oeffentlich)) return;
    if (WIKI_BEREICHE.indexOf(String(z.bereich)) < 0 || !wikiAdresseOk(z.adresse)) return;
    var g = gruppen[String(z.gruppe_id)];
    if (!g) return;
    if (adresse && (String(g.kurzname).toLowerCase() !== kurz || String(z.adresse) !== adresse)) return;
    seiten.push(wikiOeffentlicheSeite(z, g, !!adresse));
  });
  seiten.sort(function (a, b) {
    if (a.kurzname !== b.kurzname) return a.kurzname < b.kurzname ? -1 : 1;
    if (a.bereich !== b.bereich) return a.bereich < b.bereich ? -1 : 1;
    if (a.thema !== b.thema) return a.thema.localeCompare(b.thema);
    return a.titel.localeCompare(b.titel);
  });

  var liste = aktiv.map(function (g) {
    return {
      name: String(g.name),
      kurzname: String(g.kurzname),
      farbe: tFarbe(g.farbe),
      webseite: tLink(g.webseite),
      instagram: tInstagram(g.instagram),
      links: tLinks(g.weitere_links)
    };
  });
  return { seiten: seiten, gruppen: liste };
}

// Liste ohne Texte. Es gibt nur EINEN Zwischenspeicher-Eintrag dafür (wie termine_alle).
function wikiAlle() {
  var cache = CacheService.getScriptCache();
  var gespeichert = cache.get('wiki_alle');
  if (gespeichert) {
    try { return JSON.parse(gespeichert); } catch (e) { /* neu berechnen */ }
  }
  var alle = wikiLesen('', '');
  try { cache.put('wiki_alle', JSON.stringify(alle), WIKI_CACHE_SEK); } catch (e2) { /* zu groß: egal */ }
  return alle;
}

function aktionWiki(p) {
  var f = wikiFilter(p);
  var alle = wikiAlle();
  if (!f.adresse) return alle;

  // Nur Seiten aus der Liste werden gelesen und zwischengespeichert (keine erfundenen Schlüssel)
  var da = alle.seiten.some(function (s) {
    return String(s.kurzname).toLowerCase() === f.gruppe && s.adresse === f.adresse;
  });
  if (!da) fehler('nicht_gefunden', 'Seite nicht gefunden.');

  var cache = CacheService.getScriptCache();
  var key = 'wiki_s_' + f.gruppe + '_' + f.adresse;
  var gespeichert = cache.get(key);
  if (gespeichert) {
    try { return { seite: JSON.parse(gespeichert) }; } catch (e) { /* neu lesen */ }
  }
  var eine = wikiLesen(f.gruppe, f.adresse).seiten[0];
  if (!eine) fehler('nicht_gefunden', 'Seite nicht gefunden.');
  try { cache.put(key, JSON.stringify(eine), WIKI_CACHE_SEK); } catch (e2) { /* zu groß: egal */ }
  return { seite: eine };
}

// ---- Tests für den Editor ----

// Im Editor ausführen: prüft die Regeln (mit Werten im Speicher) und die Spaltenköpfe. Schreibt nichts.
function testenWiki() {
  var fehlerZahl = 0;
  function pruefe(nr, text, ist, soll) {
    var gut = JSON.stringify(ist) === JSON.stringify(soll);
    if (!gut) fehlerZahl++;
    Logger.log(nr + ') ' + (gut ? 'ok' : 'FEHLER') + ': ' + text + (gut ? '' : ' (ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll) + ')'));
  }

  pruefe(1, 'Adresse „demo-anmelden“ erlaubt', wikiAdresseOk('demo-anmelden'), true);
  pruefe(2, 'Adresse mit Großbuchstaben abgelehnt', wikiAdresseOk('Demo'), false);
  pruefe(3, 'Adresse mit Umlaut abgelehnt', wikiAdresseOk('müll'), false);
  pruefe(4, 'Adresse mit Bindestrich am Ende abgelehnt', wikiAdresseOk('demo-'), false);
  pruefe(5, 'Adresse mit zwei Bindestrichen abgelehnt', wikiAdresseOk('a--b'), false);
  pruefe(6, 'Adresse mit Schrägstrich abgelehnt', wikiAdresseOk('../x'), false);
  pruefe(7, 'leere Adresse abgelehnt', wikiAdresseOk(''), false);
  pruefe(8, 'Adresse mit 61 Zeichen abgelehnt', wikiAdresseOk(new Array(62).join('a')), false);
  var zeilen = [
    { id: 'w1', gruppe_id: 'g1', titel: 'Demo anmelden', adresse: 'demo-anmelden', geloescht: false },
    { id: 'w2', gruppe_id: 'g1', titel: 'Alt', adresse: 'alt', geloescht: true },
    { id: 'w3', gruppe_id: 'g2', titel: 'Presse', adresse: 'presse', geloescht: false }
  ];
  pruefe(9, 'doppelter Titel erkannt (groß/klein egal)', wikiVergeben(zeilen, 'g1', 'titel', 'demo ANMELDEN', ''), true);
  pruefe(10, 'eigener Titel zählt nicht doppelt', wikiVergeben(zeilen, 'g1', 'titel', 'Demo anmelden', 'w1'), false);
  pruefe(11, 'gelöschte Seite gibt Titel frei', wikiVergeben(zeilen, 'g1', 'titel', 'Alt', ''), false);
  pruefe(12, 'Adresse einer anderen Gruppe ist frei', wikiVergeben(zeilen, 'g1', 'adresse', 'presse', ''), false);
  pruefe(13, 'doppelte Adresse erkannt', wikiVergeben(zeilen, 'g1', 'adresse', 'demo-anmelden', ''), true);
  var abgelehnt = function (p) { try { wikiFilter(p); return false; } catch (e) { return true; } };
  pruefe(14, 'Filter ohne Angaben erlaubt', abgelehnt({}), false);
  pruefe(15, 'Filter mit Gruppe und Adresse erlaubt', abgelehnt({ gruppe: 'fff', adresse: 'demo' }), false);
  pruefe(16, 'Filter nur mit Gruppe abgelehnt', abgelehnt({ gruppe: 'fff' }), true);
  pruefe(17, 'Filter mit ungültiger Adresse abgelehnt', abgelehnt({ gruppe: 'fff', adresse: 'x;y' }), true);
  pruefe(18, 'Stand nur als Datum', wikiStand('2026-10-23T21:30:00.000Z'), '2026-10-23');
  pruefe(19, 'Stand nach Mitternacht (deutsche Zeit)', wikiStand('2026-10-23T22:30:00.000Z'), '2026-10-24');

  ['Wiki', 'Kommentare'].forEach(function (tab) {
    try {
      pruefeKopf(tab, lies(tab).kopf);
      Logger.log('Kopf ' + tab + ': ok');
    } catch (e) {
      fehlerZahl++;
      Logger.log('Kopf ' + tab + ': FEHLER ' + e.message);
    }
  });

  Logger.log(fehlerZahl ? 'FEHLER: ' + fehlerZahl + ' Prüfungen stimmen nicht.' : 'Alles ok.');
}

// Im Editor ausführen: prüft, dass die öffentliche Aktion nichts Unerlaubtes herausgibt. Schreibt nichts.
function testenWikiSicher() {
  var erlaubtSeite = ['bereich', 'thema', 'titel', 'adresse', 'stand', 'kurzname', 'gruppe_name', 'farbe'];
  var erlaubtGruppe = ['name', 'kurzname', 'farbe', 'webseite', 'instagram', 'links'];
  var probleme = 0;
  function feldPruefen(o, erlaubt, wo) {
    Object.keys(o).forEach(function (k) {
      if (erlaubt.indexOf(k) < 0) { probleme++; Logger.log('FEHLER: unerlaubtes Feld ' + k + ' (' + wo + ')'); }
    });
  }

  // 1) Liste: nur erlaubte Felder, kein Text
  var alle = wikiLesen('', '');
  alle.seiten.forEach(function (s) { feldPruefen(s, erlaubtSeite, 'Liste'); });
  alle.gruppen.forEach(function (g) { feldPruefen(g, erlaubtGruppe, 'Gruppen'); });

  // 2) Nicht mehr Seiten als im Sheet öffentlich und nicht gelöscht
  var zeilen = lies('Wiki').zeilen;
  var soll = zeilen.filter(function (z) { return !truthy(z.geloescht) && truthy(z.oeffentlich); }).length;
  Logger.log('Im Sheet öffentlich: ' + soll + ', ausgegeben: ' + alle.seiten.length +
    ' (kleiner ist erlaubt, wenn eine Gruppe nicht aktiv ist)');
  if (alle.seiten.length > soll) { probleme++; Logger.log('FEHLER: mehr Seiten als erlaubt'); }

  // 3) Eine Seite mit Text: nur erlaubte Felder und text
  if (alle.seiten.length) {
    var s = alle.seiten[0];
    var eine = wikiLesen(String(s.kurzname).toLowerCase(), s.adresse).seiten[0];
    if (!eine) { probleme++; Logger.log('FEHLER: öffentliche Seite nicht gefunden'); }
    else feldPruefen(eine, erlaubtSeite.concat('text'), 'Seite');
  }

  // 4) Eine nicht öffentliche Seite wird nicht ausgeliefert
  var gruppen = {};
  lies('Gruppen').zeilen.forEach(function (g) { gruppen[String(g.gruppe_id)] = g; });
  var geheim = zeilen.filter(function (z) { return !truthy(z.oeffentlich) && wikiAdresseOk(z.adresse) && gruppen[String(z.gruppe_id)]; })[0];
  if (geheim) {
    var kurz = String(gruppen[String(geheim.gruppe_id)].kurzname).toLowerCase();
    var offen = wikiLesen(kurz, String(geheim.adresse)).seiten.some(function (x) { return x.titel === String(geheim.titel); });
    if (offen) { probleme++; Logger.log('FEHLER: nicht öffentliche Seite wird ausgeliefert'); }
  } else {
    Logger.log('Hinweis: keine nicht öffentliche Seite im Sheet, Prüfung 4 übersprungen.');
  }

  // 5) Ungültige Angaben werden abgelehnt
  [{ gruppe: 'a b', adresse: 'x' }, { gruppe: '../x', adresse: 'x' }, { gruppe: 'fff', adresse: '../x' },
   { gruppe: 'fff', adresse: 'X' }, { gruppe: 'fff', adresse: 'a'.repeat(61) }, { gruppe: 'fff' }].forEach(function (p) {
    try {
      wikiFilter(p);
      probleme++;
      Logger.log('FEHLER: ' + JSON.stringify(p) + ' wurde nicht abgelehnt');
    } catch (e) { /* gewollt */ }
  });

  // 6) Erfundene Adresse: nicht gefunden
  try {
    aktionWiki({ gruppe: 'fff', adresse: 'gibt-es-sicher-nicht-' + Date.now() });
    probleme++;
    Logger.log('FEHLER: erfundene Adresse wurde ausgeliefert');
  } catch (e) {
    if (e.code !== 'nicht_gefunden') { probleme++; Logger.log('FEHLER: falscher Fehler ' + e.message); }
  }

  Logger.log(probleme ? ('FERTIG mit ' + probleme + ' Problem(en)') : 'ALLES GUT: keine Probleme gefunden.');
}
