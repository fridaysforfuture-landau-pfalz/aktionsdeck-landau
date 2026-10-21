// Daten.gs – bootstrap, list, listMehrere, create, update, delete, batchCreate, projektLoeschen.
// Jeder Schreibzugriff läuft in einer Sperre. Es sieht nur Daten der eigenen Gruppe.

// Diese Tabs brauchen immer ein Projekt (projekt_id darf nicht leer sein)
// (Protokolle seit 0.30.0 nicht mehr: Projekt freiwillig, siehe protokollBezugPruefen in Protokoll.gs)
var PROJEKT_PFLICHT = ['Meilensteine', 'Projekt_Team', 'Projekt_Material', 'Finanzen'];

// Diese Tabs werden beim Löschen eines Projekts mitgelöscht (Posts zuerst, wegen der ToDos zu Posts).
// Protokolle und Reden bleiben erhalten (sie werden nie gelöscht).
var PROJEKT_ABHAENGIG = ['Posts', 'ToDos', 'Meilensteine', 'Projekt_Team', 'Projekt_Material',
                         'Finanzen', 'Kommentare', 'Mobi_Plan'];

function tabelleCheck(name) {
  if (typeof name !== 'string' || !TABELLEN.hasOwnProperty(name)) fehler('ungueltig', 'Unbekannte Tabelle.');
  return name;
}

function nurWennAenderbar(tab) {
  if (NUR_ANHAENGEN.indexOf(tab) >= 0) {
    fehler('ungueltig', 'In "' + tab + '" wird nur angehängt, nichts geändert oder gelöscht.');
  }
}

// Ausleihe wird nur über die Aktion "buchen" geschrieben (dort werden die Mengen geprüft).
function nurPerBuchen(tab) {
  if (tab === 'Ausleihe') {
    fehler('ungueltig', 'Die Ausleihe wird nur über "buchen" geschrieben.');
  }
}

function pruefeFelder(tab, daten) {
  if (!daten || typeof daten !== 'object' || Array.isArray(daten)) fehler('ungueltig', 'Daten fehlen.');
  Object.keys(daten).forEach(function (k) {
    if (TABELLEN[tab].indexOf(k) < 0) fehler('ungueltig', 'Unbekanntes Feld: ' + k);
  });
}

function neuerEintrag(tab, ctx, daten, anzeige, zeit) {
  pruefeFelder(tab, daten);
  var o = {
    id: 'i' + Utilities.getUuid().replace(/-/g, '').slice(0, 12),
    gruppe_id: ctx.gruppe_id,
    erstellt_am: zeit, erstellt_von: anzeige,
    geaendert_am: zeit, geaendert_von: anzeige,
    geloescht: false
  };
  TABELLEN[tab].forEach(function (sp) { o[sp] = typisieren(daten[sp], sp, tab); });
  return o;
}

function zeilenArray(kopf, o) {
  return kopf.map(function (k) { return schuetzen(o[k] === undefined ? '' : o[k]); });
}

function eintragFinden(t, ctx, id) {
  for (var i = 0; i < t.zeilen.length; i++) {
    var z = t.zeilen[i];
    if (String(z.id) === String(id) && String(z.gruppe_id) === String(ctx.gruppe_id) && !truthy(z.geloescht)) return z;
  }
  fehler('nicht_gefunden', 'Eintrag nicht gefunden (vielleicht wurde er gelöscht).');
}

function konfliktPruefen(z, bekannt) {
  if (bekannt === undefined || bekannt === null) return;
  if (String(bekannt) !== String(z.geaendert_am)) {
    fehler('konflikt', 'Jemand anderes hat diesen Eintrag inzwischen geändert.', { aktuell: sauber(z) });
  }
}

// ---- Projekt-Bezug prüfen ----

// t = gelesener Tab Projekte. Gibt die Projekt-Zeile zurück, sonst Fehler.
function projektAus(t, ctx, id) {
  var k = String(id === undefined || id === null ? '' : id).trim();
  if (!k) fehler('ungueltig', 'Bitte ein Projekt angeben.');
  for (var i = 0; i < t.zeilen.length; i++) {
    var z = t.zeilen[i];
    if (String(z.id) === k && String(z.gruppe_id) === String(ctx.gruppe_id) && !truthy(z.geloescht)) return z;
  }
  fehler('nicht_gefunden', 'Projekt nicht gefunden (vielleicht wurde es gelöscht).');
}

// Prüft projekt_id (und bei ToDos meilenstein_id). cache = {} wird beim ersten Gebrauch gefüllt.
function bezugPruefen(ctx, tab, projektId, meilensteinId, cache) {
  var pid = String(projektId === undefined || projektId === null ? '' : projektId).trim();
  var mid = String(meilensteinId === undefined || meilensteinId === null ? '' : meilensteinId).trim();
  if (!pid) {
    if (PROJEKT_PFLICHT.indexOf(tab) >= 0) fehler('ungueltig', 'Bitte ein Projekt angeben.');
    if (tab === 'ToDos' && mid) fehler('ungueltig', 'Ein Meilenstein gehört immer zu einem Projekt.');
    return;
  }
  if (!cache.projekte) {
    cache.projekte = lies('Projekte');
    pruefeKopf('Projekte', cache.projekte.kopf);
  }
  projektAus(cache.projekte, ctx, pid);

  if (tab === 'ToDos' && mid) {
    if (!cache.meilensteine) {
      cache.meilensteine = lies('Meilensteine');
      pruefeKopf('Meilensteine', cache.meilensteine.kopf);
    }
    var ms = cache.meilensteine.zeilen;
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (String(m.id) === mid && String(m.gruppe_id) === String(ctx.gruppe_id) && !truthy(m.geloescht)) {
        if (String(m.projekt_id) !== pid) fehler('ungueltig', 'Der Meilenstein gehört nicht zu diesem Projekt.');
        return;
      }
    }
    fehler('nicht_gefunden', 'Meilenstein nicht gefunden (vielleicht wurde er gelöscht).');
  }
}

// ---- Mehrere Zeilen und Spalten auf einmal schreiben ----

// Setzt in den Zeilen "zeilen" (aus lies) die Spalten aus "felder" ({ spalte: wert }).
// Pro Spalte ein Lesen und ein Schreiben, egal wie viele Zeilen.
function schreibeSpalten(t, zeilen, felder) {
  if (!zeilen.length) return;
  var min = zeilen[0]._zeile;
  var max = min;
  var gesetzt = {};
  zeilen.forEach(function (r) {
    if (r._zeile < min) min = r._zeile;
    if (r._zeile > max) max = r._zeile;
    gesetzt[r._zeile] = true;
  });
  var anz = max - min + 1;
  Object.keys(felder).forEach(function (sp) {
    var spalte = t.kopf.indexOf(sp) + 1;
    if (spalte < 1) fehler('intern', 'Spalte fehlt: ' + sp);
    var bereich = t.sh.getRange(min, spalte, anz, 1);
    var werte = bereich.getValues();
    for (var i = 0; i < anz; i++) {
      if (gesetzt[min + i]) werte[i][0] = felder[sp];
    }
    bereich.setValues(werte);
  });
}

// ---- Lesen ----

function listeFuerGruppe(tab, gid, seit) {
  return lies(tab).zeilen.filter(function (z) {
    if (String(z.gruppe_id) !== String(gid)) return false;
    if (seit) return String(z.geaendert_am) >= seit;   // inkl. gelöschter, damit die App sie entfernen kann
    return !truthy(z.geloescht);
  }).map(sauber);
}

function aktionBootstrap(ctx, p) {
  var zeit = jetzt();
  return {
    gruppe: gruppeOeffentlich(ctx.gruppe),
    zugang_id: ctx.zugang_id,
    serverzeit: zeit,
    personen: listeFuerGruppe('Personen', ctx.gruppe_id, ''),
    einstellungen: lies('Einstellungen').zeilen.map(sauber)
  };
}

function aktionList(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  var zeit = jetzt();
  var seit = p.seit ? String(p.seit) : '';
  return { zeilen: listeFuerGruppe(tab, ctx.gruppe_id, seit), serverzeit: zeit };
}

// Mehrere Tabs in einer Anfrage: { tabellen: ['Projekte','ToDos'] } -> { tabellen: { Projekte: [...], ToDos: [...] } }
function aktionListMehrere(ctx, p) {
  if (!Array.isArray(p.tabellen) || p.tabellen.length < 1 || p.tabellen.length > 12) {
    fehler('ungueltig', 'Die Liste der Tabellen muss 1 bis 12 Einträge haben.');
  }
  var zeit = jetzt();
  var seit = p.seit ? String(p.seit) : '';
  var ergebnis = {};
  p.tabellen.forEach(function (name) {
    var tab = tabelleCheck(name);
    ergebnis[tab] = listeFuerGruppe(tab, ctx.gruppe_id, seit);
  });
  return { tabellen: ergebnis, serverzeit: zeit };
}

// ---- Schreiben ----

function aktionCreate(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurPerBuchen(tab);
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var sh = blatt(tab);
    var kopf = kopfLesen(sh);
    pruefeKopf(tab, kopf);
    pruefeFelder(tab, p.daten);
    var bezugCache = {};
    bezugPruefen(ctx, tab, p.daten.projekt_id, p.daten.meilenstein_id, bezugCache);
    mobiBezugPruefen(ctx, tab, p.daten.projekt_id, p.daten.veranstaltung_id, p.daten.mobi_id, bezugCache);
    protokollBezugPruefen(ctx, tab, p.daten.veranstaltung_id, bezugCache);
    var o = neuerEintrag(tab, ctx, p.daten, anzeige, jetzt());
    anhaengen(sh, [zeilenArray(kopf, o)]);
    protokoll(ctx, 'create', tab, [o.id], anzeige);
    return o;
  });
}

function aktionBatchCreate(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurPerBuchen(tab);
  var anzeige = anzeigename(p);
  if (!Array.isArray(p.liste) || p.liste.length < 1 || p.liste.length > 200) {
    fehler('ungueltig', 'Die Liste muss 1 bis 200 Einträge haben.');
  }
  return mitSperre(function () {
    var sh = blatt(tab);
    var kopf = kopfLesen(sh);
    pruefeKopf(tab, kopf);
    var zeit = jetzt();
    var cache = {};
    var eintraege = p.liste.map(function (d) {
      pruefeFelder(tab, d);
      bezugPruefen(ctx, tab, d.projekt_id, d.meilenstein_id, cache);
      mobiBezugPruefen(ctx, tab, d.projekt_id, d.veranstaltung_id, d.mobi_id, cache);
      protokollBezugPruefen(ctx, tab, d.veranstaltung_id, cache);
      return neuerEintrag(tab, ctx, d, anzeige, zeit);
    });
    anhaengen(sh, eintraege.map(function (o) { return zeilenArray(kopf, o); }));
    protokoll(ctx, 'batchCreate', tab, eintraege.map(function (o) { return o.id; }), anzeige);
    return eintraege;
  });
}

function aktionUpdate(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurWennAenderbar(tab);
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var t = lies(tab);
    pruefeKopf(tab, t.kopf);
    var z = eintragFinden(t, ctx, p.id);
    konfliktPruefen(z, p.bekannt);
    pruefeFelder(tab, p.daten);

    // nur geänderte Felder
    var neu = {};
    Object.keys(p.daten).forEach(function (sp) {
      var wert = typisieren(p.daten[sp], sp, tab);
      if (String(wert) !== String(z[sp])) neu[sp] = wert;
    });
    if (!Object.keys(neu).length) return { eintrag: sauber(z), geaendert: false };

    // Ändert sich Projekt oder Meilenstein, muss der neue Bezug stimmen
    if (neu.hasOwnProperty('projekt_id') || neu.hasOwnProperty('meilenstein_id')) {
      bezugPruefen(
        ctx, tab,
        neu.hasOwnProperty('projekt_id') ? neu.projekt_id : z.projekt_id,
        neu.hasOwnProperty('meilenstein_id') ? neu.meilenstein_id : z.meilenstein_id,
        {}
      );
    }

    // Mobi: Bezug des Beitrags bzw. mobi_id des ToDos prüfen (nur wenn sich dort etwas ändert)
    var vor = function (sp) { return neu.hasOwnProperty(sp) ? neu[sp] : z[sp]; };
    if ((tab === 'Mobi_Plan' && (neu.hasOwnProperty('projekt_id') || neu.hasOwnProperty('veranstaltung_id'))) ||
        neu.hasOwnProperty('mobi_id')) {
      mobiBezugPruefen(ctx, tab, vor('projekt_id'), vor('veranstaltung_id'), vor('mobi_id'), {});
    }
    // Protokolle und Reden: geänderte Veranstaltung prüfen (Projekt prüft schon bezugPruefen oben)
    if (neu.hasOwnProperty('veranstaltung_id')) {
      protokollBezugPruefen(ctx, tab, neu.veranstaltung_id, {});
    }
    var zeit = jetzt();
    neu.geaendert_am = zeit;
    neu.geaendert_von = anzeige;
    Object.keys(neu).forEach(function (sp) {
      t.sh.getRange(z._zeile, t.kopf.indexOf(sp) + 1).setValue(schuetzen(neu[sp]));
      z[sp] = neu[sp];
    });
    protokoll(ctx, 'update', tab, [z.id], anzeige);
    return { eintrag: sauber(z), geaendert: true };
  });
}

// Weiches Löschen: geloescht = TRUE
function aktionDelete(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurWennAenderbar(tab);
  if (tab === 'Projekte') {
    fehler('ungueltig', 'Projekte werden mit "projektLoeschen" gelöscht, damit alles dazu mitgelöscht wird.');
  }
  if (NIE_LOESCHEN.indexOf(tab) >= 0) {
    fehler('ungueltig', 'Protokolle und Reden werden nicht gelöscht.');
  }
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var t = lies(tab);
    pruefeKopf(tab, t.kopf);
    var z = eintragFinden(t, ctx, p.id);
    konfliktPruefen(z, p.bekannt);
    var zeit = jetzt();

    // Mobi: Beitrag oder Veranstaltung gelöscht, dann gehen die verknüpften Teile mit
    mobiKaskade(ctx, tab, z, zeit, anzeige);

    // Meilenstein gelöscht: seine ToDos bleiben, verlieren nur den Verweis
    if (tab === 'Meilensteine') {
      var td = lies('ToDos');
      pruefeKopf('ToDos', td.kopf);
      var lose = td.zeilen.filter(function (r) {
        return String(r.gruppe_id) === String(ctx.gruppe_id) && !truthy(r.geloescht) &&
          String(r.meilenstein_id) === String(z.id);
      });
      schreibeSpalten(td, lose, {
        meilenstein_id: '', geaendert_am: zeit, geaendert_von: schuetzen(anzeige)
      });
      if (lose.length) {
        protokoll(ctx, 'update', 'ToDos', lose.map(function (r) { return r.id; }), anzeige);
      }
    }

    var neu = { geloescht: true, geaendert_am: zeit, geaendert_von: anzeige };
    Object.keys(neu).forEach(function (sp) {
      t.sh.getRange(z._zeile, t.kopf.indexOf(sp) + 1).setValue(schuetzen(neu[sp]));
      z[sp] = neu[sp];
    });
    protokoll(ctx, 'delete', tab, [z.id], anzeige);
    return { eintrag: sauber(z) };
  });
}

// Projekt samt allem Zugehörigen weich löschen.
// Aufruf: { aktion:'projektLoeschen', id, bekannt }
// Vorher muss das Material des Projekts zurückgegeben sein (Fehlercode "draussen").
function aktionProjektLoeschen(ctx, p) {
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var pt = lies('Projekte');
    pruefeKopf('Projekte', pt.kopf);
    var z = eintragFinden(pt, ctx, p.id);
    konfliktPruefen(z, p.bekannt);
    var projektId = String(z.id);

    // 1) Ist noch Material für dieses Projekt draußen?
    var ausl = lies('Ausleihe');
    pruefeKopf('Ausleihe', ausl.kopf);
    var mat = lies('Material');
    var namen = {};
    mat.zeilen.forEach(function (m) { namen[String(m.id)] = String(m.name); });
    var proMat = bAusgeliehenProjekt(ausl.zeilen, ctx.gruppe_id);
    var offen = [];
    Object.keys(proMat).forEach(function (mid) {
      var n = proMat[mid][projektId] || 0;
      if (n > 0) offen.push({ material_id: mid, name: namen[mid] || mid, anzahl: n });
    });
    if (offen.length) {
      fehler('draussen',
        'Für dieses Projekt ist noch Material ausgeliehen: ' +
        offen.map(function (o) { return o.name + ' (' + o.anzahl + ')'; }).join(', ') +
        '. Bitte zuerst zurückgeben.',
        { offen: offen });
    }

    // 2) Alle abhängigen Tabs lesen und prüfen, BEVOR etwas geschrieben wird
    var tabs = {};
    PROJEKT_ABHAENGIG.forEach(function (tab) {
      var t = lies(tab);
      pruefeKopf(tab, t.kopf);
      tabs[tab] = t;
    });

    // 3) Treffer sammeln (Posts zuerst: ToDos zu diesen Posts werden mitgelöscht)
    var postIds = {};
    var treffer = {};
    PROJEKT_ABHAENGIG.forEach(function (tab) {
      treffer[tab] = tabs[tab].zeilen.filter(function (r) {
        if (String(r.gruppe_id) !== String(ctx.gruppe_id) || truthy(r.geloescht)) return false;
        if (String(r.projekt_id) === projektId) return true;
        return tab === 'ToDos' && String(r.post_id || '') !== '' && postIds[String(r.post_id)] === true;
      });
      if (tab === 'Posts') {
        treffer[tab].forEach(function (r) { postIds[String(r.id)] = true; });
      }
    });

    // 4) Schreiben
    var zeit = jetzt();
    var felder = { geloescht: true, geaendert_am: zeit, geaendert_von: schuetzen(anzeige) };
    var gezaehlt = {};
    PROJEKT_ABHAENGIG.forEach(function (tab) {
      var liste = treffer[tab];
      gezaehlt[tab] = liste.length;
      if (!liste.length) return;
      schreibeSpalten(tabs[tab], liste, felder);
      protokoll(ctx, 'delete', tab, liste.map(function (r) { return r.id; }), anzeige);
    });
    schreibeSpalten(pt, [z], felder);
    protokoll(ctx, 'delete', 'Projekte', [z.id], anzeige);

    return { id: projektId, geloescht: gezaehlt };
  });
}
