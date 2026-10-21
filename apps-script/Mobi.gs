// Mobi.gs – Prüfung der Bezüge für Mobi_Plan und ToDos.mobi_id, dazu Tests für den Editor.
// Ein Beitrag (Mobi_Plan) gehört zu einem Projekt ODER zu einer Veranstaltung (oder zu beidem).
// Ein ToDo darf nur auf einen Beitrag der eigenen Gruppe zeigen.

function mobiTxt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// cache = {} wird beim ersten Gebrauch gefüllt (wie bei bezugPruefen)
function mobiBezugPruefen(ctx, tab, projektId, veranstaltungId, mobiId, cache) {
  var pid = mobiTxt(projektId);
  var vid = mobiTxt(veranstaltungId);
  var mid = mobiTxt(mobiId);
  var i;

  if (tab === 'Mobi_Plan') {
    if (!pid && !vid) {
      fehler('ungueltig', 'Ein Beitrag gehört zu einem Projekt oder zu einer Veranstaltung.');
    }
    if (vid) {
      if (!cache.veranstaltungen) {
        cache.veranstaltungen = lies('Veranstaltungen');
        pruefeKopf('Veranstaltungen', cache.veranstaltungen.kopf);
      }
      var vz = cache.veranstaltungen.zeilen;
      var gefunden = false;
      for (i = 0; i < vz.length; i++) {
        if (String(vz[i].id) === vid && String(vz[i].gruppe_id) === String(ctx.gruppe_id) && !truthy(vz[i].geloescht)) {
          gefunden = true;
          break;
        }
      }
      if (!gefunden) fehler('nicht_gefunden', 'Veranstaltung nicht gefunden (vielleicht wurde sie gelöscht).');
    }
  }

  if (tab === 'ToDos' && mid) {
    if (!cache.mobi) {
      cache.mobi = lies('Mobi_Plan');
      pruefeKopf('Mobi_Plan', cache.mobi.kopf);
    }
    var mz = cache.mobi.zeilen;
    var da = false;
    for (i = 0; i < mz.length; i++) {
      if (String(mz[i].id) === mid && String(mz[i].gruppe_id) === String(ctx.gruppe_id) && !truthy(mz[i].geloescht)) {
        da = true;
        break;
      }
    }
    if (!da) fehler('nicht_gefunden', 'Beitrag nicht gefunden (vielleicht wurde er gelöscht).');
  }
}

// Löschen mit Verknüpfung (wird von aktionDelete aufgerufen, innerhalb der Sperre):
// - Beitrag gelöscht: seine ToDos (mobi_id) werden mitgelöscht.
// - Veranstaltung gelöscht: ihre Beiträge und deren ToDos werden mitgelöscht.
// z = die Zeile, die gerade gelöscht wird. Gibt die Zahlen zurück (für Tests).
function mobiKaskade(ctx, tab, z, zeit, anzeige) {
  var leer = { beitraege: 0, todos: 0 };
  if (tab !== 'Mobi_Plan' && tab !== 'Veranstaltungen') return leer;

  var gid = String(ctx.gruppe_id);
  var plan = lies('Mobi_Plan');
  pruefeKopf('Mobi_Plan', plan.kopf);
  var td = lies('ToDos');
  pruefeKopf('ToDos', td.kopf);

  var beitraege = [];
  if (tab === 'Mobi_Plan') {
    beitraege = [z];
  } else {
    beitraege = plan.zeilen.filter(function (r) {
      return String(r.gruppe_id) === gid && !truthy(r.geloescht) &&
        String(r.veranstaltung_id) === String(z.id);
    });
  }

  var ids = {};
  beitraege.forEach(function (b) { ids[String(b.id)] = true; });
  var todos = td.zeilen.filter(function (r) {
    return String(r.gruppe_id) === gid && !truthy(r.geloescht) &&
      mobiTxt(r.mobi_id) !== '' && ids[String(r.mobi_id)] === true;
  });

  var felder = { geloescht: true, geaendert_am: zeit, geaendert_von: schuetzen(anzeige) };

  // Bei einem gelöschten Beitrag löscht aktionDelete die Zeile selbst
  if (tab === 'Veranstaltungen' && beitraege.length) {
    schreibeSpalten(plan, beitraege, felder);
    protokoll(ctx, 'delete', 'Mobi_Plan', beitraege.map(function (r) { return r.id; }), anzeige);
  }
  if (todos.length) {
    schreibeSpalten(td, todos, felder);
    protokoll(ctx, 'delete', 'ToDos', todos.map(function (r) { return r.id; }), anzeige);
  }
  return { beitraege: tab === 'Veranstaltungen' ? beitraege.length : 0, todos: todos.length };
}

// ---- Test für den Editor (Funktion auswählen, dann "Ausführen") ----

function testenMobi() {
  var g = lies('Gruppen').zeilen[0];
  var ctx = { gruppe_id: g.gruppe_id };
  var pr = lies('Projekte').zeilen.filter(function (z) {
    return String(z.gruppe_id) === String(g.gruppe_id) && !truthy(z.geloescht);
  })[0];
  if (!pr) { Logger.log('Kein Projekt in der ersten Gruppe. Bitte erst eins in der App anlegen.'); return; }

  function beitrag(extra) {
    var d = { kanal: 'Instagram', format: 'story', titel: 'Test Mobi', status: 'idee' };
    Object.keys(extra).forEach(function (k) { d[k] = extra[k]; });
    return aktionCreate(ctx, { tabelle: 'Mobi_Plan', anzeigename: 'Test (Editor)', daten: d });
  }

  // 1) Ohne Projekt und ohne Veranstaltung: muss abgelehnt werden
  try {
    beitrag({});
    Logger.log('1) FEHLER: Beitrag ohne Bezug wurde nicht abgelehnt!');
  } catch (e1) {
    Logger.log('1) Gut, abgelehnt mit: ' + e1.message);
  }

  // 2) Unbekannte Veranstaltung: muss abgelehnt werden
  try {
    beitrag({ veranstaltung_id: 'gibtsnicht' });
    Logger.log('2) FEHLER: unbekannte Veranstaltung wurde nicht abgelehnt!');
  } catch (e2) {
    Logger.log('2) Gut, abgelehnt mit: ' + e2.message);
  }

  // 3) Mit Projekt: muss klappen
  var o;
  try {
    o = beitrag({ projekt_id: pr.id, datum: '2026-12-01', uhrzeit: '18:30' });
    Logger.log('3) Beitrag angelegt: ' + o.id);
  } catch (e3) {
    Logger.log('3) FEHLER beim Anlegen: ' + e3.message);
    return;
  }

  // 4) Status ändern: muss klappen
  try {
    aktionUpdate(ctx, {
      tabelle: 'Mobi_Plan', id: o.id, anzeigename: 'Test (Editor)',
      daten: { status: 'entwurf' }, bekannt: o.geaendert_am
    });
    Logger.log('4) Status geändert: OK');
  } catch (e4) {
    Logger.log('4) FEHLER beim Ändern: ' + e4.message);
  }

  // 5) ToDo mit fremder mobi_id: muss abgelehnt werden
  try {
    aktionCreate(ctx, {
      tabelle: 'ToDos', anzeigename: 'Test (Editor)',
      daten: { text: 'Test Mobi', projekt_id: pr.id, mobi_id: 'gibtsnicht' }
    });
    Logger.log('5) FEHLER: ToDo mit unbekannter mobi_id wurde nicht abgelehnt!');
  } catch (e5) {
    Logger.log('5) Gut, abgelehnt mit: ' + e5.message);
  }

  // 6) Testeintrag wieder (weich) löschen
  try {
    aktionDelete(ctx, { tabelle: 'Mobi_Plan', id: o.id, anzeigename: 'Test (Editor)' });
    Logger.log('6) Testeintrag gelöscht: OK');
  } catch (e6) {
    Logger.log('6) FEHLER beim Löschen: ' + e6.message);
  }
}

// Legt einen Beitrag mit ToDo an, löscht den Beitrag und prüft, dass das ToDo mitgeht.
function testenMobiLoeschen() {
  var g = lies('Gruppen').zeilen[0];
  var ctx = { gruppe_id: g.gruppe_id };
  var pr = lies('Projekte').zeilen.filter(function (z) {
    return String(z.gruppe_id) === String(g.gruppe_id) && !truthy(z.geloescht);
  })[0];
  if (!pr) { Logger.log('Kein Projekt in der ersten Gruppe. Bitte erst eins in der App anlegen.'); return; }

  var b = aktionCreate(ctx, {
    tabelle: 'Mobi_Plan', anzeigename: 'Test (Editor)',
    daten: { projekt_id: pr.id, kanal: 'Instagram', format: 'story', titel: 'Test Löschen', status: 'idee' }
  });
  var t = aktionCreate(ctx, {
    tabelle: 'ToDos', anzeigename: 'Test (Editor)',
    daten: { projekt_id: pr.id, text: 'Test Veröffentlichen', mobi_id: b.id }
  });
  Logger.log('1) Beitrag ' + b.id + ' und ToDo ' + t.id + ' angelegt.');

  aktionDelete(ctx, { tabelle: 'Mobi_Plan', id: b.id, anzeigename: 'Test (Editor)' });

  var nochDa = lies('ToDos').zeilen.filter(function (r) {
    return String(r.id) === String(t.id) && !truthy(r.geloescht);
  }).length;
  Logger.log(nochDa === 0
    ? '2) Gut: Das ToDo wurde mitgelöscht.'
    : '2) FEHLER: Das ToDo ist noch da!');
}
