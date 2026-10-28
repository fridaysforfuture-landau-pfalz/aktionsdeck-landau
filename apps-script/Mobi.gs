// Mobi.gs – Prüfung der Bezüge für Mobi_Plan und ToDos.mobi_id, dazu Tests für den Editor.
// Ein Beitrag (Mobi_Plan) gehört zu einem Projekt ODER zu einer Veranstaltung (oder zu beidem).
// Ein ToDo darf nur auf einen Beitrag der eigenen Gruppe zeigen.

// cache = {} wird beim ersten Gebrauch gefüllt (wie bei bezugPruefen)
function mobiBezugPruefen(ctx, tab, projektId, veranstaltungId, mobiId, cache) {
  var pid = textVon(projektId);
  var vid = textVon(veranstaltungId);
  var mid = textVon(mobiId);
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
      textVon(r.mobi_id) !== '' && ids[String(r.mobi_id)] === true;
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
