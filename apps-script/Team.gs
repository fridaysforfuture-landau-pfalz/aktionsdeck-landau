// Team.gs – Etappe 9 (Team): Prüfungen für Personen, Gruppen_Rollen und Kapazitaet,
// Mitlöschen und Umbenennen. Dazu ein Test für den Editor (testenTeam).
// Alle Hilfsfunktionen beginnen mit "team" (in Util.gs gibt es schon aus()).
//
// - Personen: eine Zeile je Person im Team. name wie der Anzeigename, in der Gruppe nur einmal.
//   rollen = IDs aus Gruppen_Rollen, eine je Zeile. Eine gewählte Rolle (gewaehlt TRUE) hat höchstens eine Person.
// - Gruppen_Rollen: die Liste der Rollen der Gruppe (in der App bearbeitbar). name in der Gruppe nur einmal.
// - Kapazitaet: eine Zeile je Angabe. kapazitaet = ganze Zahl 1 bis 10, gueltig_ab bis gueltig_bis (JJJJ-MM-TT,
//   höchstens 183 Tage). Wird nur angelegt oder gelöscht, nicht geändert.
// - Person gelöscht: ihre Kapazitäts-Angaben gehen mit. Rolle gelöscht: sie wird bei allen Personen ausgetragen.
// - Name einer Person geändert: der Name wird auch in ToDos, Meilensteinen, Mobi-Beiträgen (verantwortlich)
//   und Umfrage-Antworten (person) ersetzt. Protokolle, Reden und das Log bleiben, wie sie sind.

var TEAM_MAX_ROLLEN = 12;
var TEAM_MAX_TAGE = 183;
var TEAM_UMBENENNEN = {
  ToDos: 'verantwortlich',
  Meilensteine: 'verantwortlich',
  Mobi_Plan: 'verantwortlich',
  Umfrage_Antworten: 'person'
};

function teamTxt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function teamKey(v) {
  return teamTxt(v).toLowerCase();
}

// "id1\nid2" -> ['id1', 'id2'] (Zeilenumbruch, Komma und Strichpunkt trennen)
function teamListe(v) {
  return teamTxt(v).split(/[\n,;]+/).map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ''; });
}

// Namen in einem Feld "verantwortlich": Komma oder Strichpunkt trennen
function teamNamen(v) {
  return teamTxt(v).split(/[,;]/).map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ''; });
}

// Ersetzt den Namen alt durch neu (ganzer Name, Groß- und Kleinschreibung egal).
// "Ben" ersetzt nicht "Bente". Doppelte Namen fallen weg. Gibt null zurück, wenn nichts zu ändern ist.
function teamNamenErsetzen(text, alt, neu) {
  var a = teamKey(alt);
  if (!a) return null;
  var treffer = false;
  var ergebnis = [];
  teamNamen(text).forEach(function (n) {
    var m = n;
    if (teamKey(n) === a) {
      treffer = true;
      m = teamTxt(neu);
    }
    var schon = ergebnis.some(function (x) { return teamKey(x) === teamKey(m); });
    if (m && !schon) ergebnis.push(m);
  });
  return treffer ? ergebnis.join(', ') : null;
}

// Ganze Zahl von 1 bis 10
function teamKapazitaetOk(v) {
  return typeof v === 'number' && Math.floor(v) === v && v >= 1 && v <= 10;
}

// "JJJJ-MM-TT" und ein echtes Datum (kein 30. Februar)
function teamDatumOk(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(teamTxt(s));
  if (!m) return false;
  var d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

// Tage von a bis b (beide "JJJJ-MM-TT")
function teamTage(a, b) {
  function ms(s) {
    var t = teamTxt(s).split('-');
    return Date.UTC(Number(t[0]), Number(t[1]) - 1, Number(t[2]));
  }
  return Math.round((ms(b) - ms(a)) / 86400000);
}

// Gibt es den Namen in der Gruppe schon (nicht gelöscht, andere ID)?
function teamNameVergeben(zeilen, gid, name, ohneId) {
  var k = teamKey(name);
  return zeilen.some(function (z) {
    return String(z.gruppe_id) === String(gid) && !truthy(z.geloescht) &&
      String(z.id) !== String(ohneId) && teamKey(z.name) === k;
  });
}

// Zeilen einer Gruppe (nicht gelöscht)
function teamDerGruppe(t, gid) {
  return t.zeilen.filter(function (z) {
    return String(z.gruppe_id) === String(gid) && !truthy(z.geloescht);
  });
}

function teamTab(cache, name) {
  if (!cache['team_' + name]) {
    cache['team_' + name] = lies(name);
    pruefeKopf(name, cache['team_' + name].kopf);
  }
  return cache['team_' + name];
}

// Prüft einen Eintrag vor dem Schreiben (create, batchCreate, update).
// d = der ganze Eintrag (bei update: alter Stand mit den Änderungen), id = seine ID.
// geaendert = Liste der geänderten Spalten (update) oder null (neu angelegt).
// cache = {} wie bei bezugPruefen; bei batchCreate merkt er sich auch die Namen der Liste.
function teamPruefen(ctx, tab, d, id, cache, geaendert) {
  if (tab !== 'Personen' && tab !== 'Gruppen_Rollen' && tab !== 'Kapazitaet') return;
  var neu = geaendert === null;
  var gid = String(ctx.gruppe_id);
  function hat(sp) { return neu || geaendert.indexOf(sp) >= 0; }

  if (tab === 'Kapazitaet') {
    if (!neu) fehler('ungueltig', 'Kapazitäts-Angaben werden nicht geändert. Lege eine neue Angabe an.');
    if (!teamKapazitaetOk(d.kapazitaet)) fehler('ungueltig', 'Die Kapazität muss eine ganze Zahl von 1 bis 10 sein.');
    if (!teamDatumOk(d.gueltig_ab) || !teamDatumOk(d.gueltig_bis)) {
      fehler('ungueltig', 'Bitte „gilt ab“ und „gilt bis“ als Datum angeben.');
    }
    var tage = teamTage(d.gueltig_ab, d.gueltig_bis);
    if (tage < 0) fehler('ungueltig', '„Gilt bis“ liegt vor „gilt ab“.');
    if (tage > TEAM_MAX_TAGE) fehler('ungueltig', 'Eine Angabe gilt höchstens 6 Monate.');
    var pid = teamTxt(d.person_id);
    var da = pid && teamDerGruppe(teamTab(cache, 'Personen'), gid).some(function (z) { return String(z.id) === pid; });
    if (!da) fehler('nicht_gefunden', 'Person nicht gefunden (vielleicht wurde sie ausgetragen).');
    return;
  }

  // Personen und Gruppen_Rollen: Name Pflicht, in der Gruppe nur einmal
  var name = teamTxt(d.name);
  if (hat('name')) {
    if (!name) fehler('ungueltig', 'Bitte einen Namen angeben.');
    var vergeben = teamNameVergeben(teamTab(cache, tab).zeilen, gid, name, id);
    var liste = cache['team_namen_' + tab] || (cache['team_namen_' + tab] = []);
    if (vergeben || liste.indexOf(teamKey(name)) >= 0) {
      fehler('ungueltig', tab === 'Personen'
        ? 'Den Namen „' + name + '“ gibt es im Team schon. Nimm zum Beispiel einen Buchstaben vom Nachnamen dazu.'
        : 'Die Rolle „' + name + '“ gibt es schon.');
    }
    liste.push(teamKey(name));
  }

  if (tab === 'Gruppen_Rollen') {
    // Wird eine Rolle zu "gewählt", darf sie höchstens eine Person haben
    if (!neu && hat('gewaehlt') && truthy(d.gewaehlt)) {
      var mit = teamDerGruppe(teamTab(cache, 'Personen'), gid).filter(function (p) {
        return teamListe(p.rollen).indexOf(String(id)) >= 0;
      });
      if (mit.length > 1) {
        fehler('ungueltig', 'Diese Rolle haben schon ' + mit.length + ' Personen. Eine gewählte Rolle hat höchstens eine Person.');
      }
    }
    return;
  }

  // Personen: Rollen prüfen (nur wenn sie sich ändern)
  if (!hat('rollen')) return;
  var ids = teamListe(d.rollen);
  if (ids.length > TEAM_MAX_ROLLEN) fehler('ungueltig', 'Höchstens ' + TEAM_MAX_ROLLEN + ' Gruppen-Rollen je Person.');
  if (!ids.length) return;
  var rollen = {};
  teamDerGruppe(teamTab(cache, 'Gruppen_Rollen'), gid).forEach(function (r) { rollen[String(r.id)] = r; });
  var andere = teamDerGruppe(teamTab(cache, 'Personen'), gid).filter(function (p) { return String(p.id) !== String(id); });
  var vergebenInListe = cache.team_gewaehlt || (cache.team_gewaehlt = {});
  ids.forEach(function (rid) {
    var r = rollen[rid];
    if (!r) fehler('nicht_gefunden', 'Gruppen-Rolle nicht gefunden (vielleicht wurde sie gelöscht).');
    if (!truthy(r.gewaehlt)) return;
    var wer = andere.filter(function (p) { return teamListe(p.rollen).indexOf(rid) >= 0; })[0];
    if (wer || vergebenInListe[rid]) {
      fehler('ungueltig', 'Die Rolle „' + r.name + '“ ist gewählt und hat schon ' +
        (wer ? teamTxt(wer.name) : 'jemand anderes') + '.');
    }
    vergebenInListe[rid] = true;
  });
}

// Schreibt in den Zeilen "liste" je eigene Werte (r._neu = { spalte: wert }).
// Pro Spalte ein Lesen und ein Schreiben, egal wie viele Zeilen.
function teamZellenSchreiben(t, liste) {
  if (!liste.length) return;
  var min = liste[0]._zeile;
  var max = min;
  var spalten = {};
  liste.forEach(function (r) {
    if (r._zeile < min) min = r._zeile;
    if (r._zeile > max) max = r._zeile;
    Object.keys(r._neu).forEach(function (sp) { spalten[sp] = true; });
  });
  var anz = max - min + 1;
  Object.keys(spalten).forEach(function (sp) {
    var spalte = t.kopf.indexOf(sp) + 1;
    if (spalte < 1) fehler('intern', 'Spalte fehlt: ' + sp);
    var bereich = t.sh.getRange(min, spalte, anz, 1);
    var werte = bereich.getValues();
    liste.forEach(function (r) {
      if (r._neu.hasOwnProperty(sp)) werte[r._zeile - min][0] = r._neu[sp];
    });
    // 12.4: Alle Zeilen des Blocks schützen, auch die dazwischen (sonst würde aus "=…" eine Formel).
    werte.forEach(function (w) { w[0] = schuetzen(w[0]); });
    bereich.setValues(werte);
  });
}

// Löschen mit Verknüpfung (wird von aktionDelete aufgerufen, innerhalb der Sperre).
// z = die Zeile, die gerade gelöscht wird. Gibt die Zahl der mitgeänderten Zeilen zurück.
function teamKaskade(ctx, tab, z, zeit, anzeige) {
  var gid = String(ctx.gruppe_id);
  if (tab === 'Personen') {
    var kt = lies('Kapazitaet');
    pruefeKopf('Kapazitaet', kt.kopf);
    var weg = teamDerGruppe(kt, gid).filter(function (r) { return String(r.person_id) === String(z.id); });
    if (weg.length) {
      schreibeSpalten(kt, weg, { geloescht: true, geaendert_am: zeit, geaendert_von: schuetzen(anzeige) });
      protokoll(ctx, 'delete', 'Kapazitaet', weg.map(function (r) { return r.id; }), anzeige);
    }
    return weg.length;
  }
  if (tab === 'Gruppen_Rollen') {
    var pt = lies('Personen');
    pruefeKopf('Personen', pt.kopf);
    var rid = String(z.id);
    var mit = teamDerGruppe(pt, gid).filter(function (p) { return teamListe(p.rollen).indexOf(rid) >= 0; });
    mit.forEach(function (p) {
      p._neu = {
        rollen: teamListe(p.rollen).filter(function (x) { return x !== rid; }).join('\n'),
        geaendert_am: zeit, geaendert_von: anzeige
      };
    });
    teamZellenSchreiben(pt, mit);
    if (mit.length) protokoll(ctx, 'update', 'Personen', mit.map(function (r) { return r.id; }), anzeige);
    return mit.length;
  }
  return 0;
}

// Name einer Person geändert: alt durch neu ersetzen (innerhalb der Sperre von aktionUpdate).
// Gibt die Zahlen je Tab zurück, zum Beispiel { ToDos: 3, Meilensteine: 0, Mobi_Plan: 1, Umfrage_Antworten: 2 }.
function teamUmbenennen(ctx, alt, neu, zeit, anzeige) {
  var gid = String(ctx.gruppe_id);
  var zahlen = {};
  Object.keys(TEAM_UMBENENNEN).forEach(function (tab) {
    var sp = TEAM_UMBENENNEN[tab];
    var t = lies(tab);
    pruefeKopf(tab, t.kopf);
    var liste = teamDerGruppe(t, gid).filter(function (r) {
      var w = teamNamenErsetzen(r[sp], alt, neu);
      if (w === null || w === teamTxt(r[sp])) return false;
      r._neu = { geaendert_am: zeit, geaendert_von: anzeige };
      r._neu[sp] = w;
      return true;
    });
    teamZellenSchreiben(t, liste);
    if (liste.length) protokoll(ctx, 'update', tab, liste.map(function (r) { return r.id; }), anzeige);
    zahlen[tab] = liste.length;
  });
  return zahlen;
}

// ---- Test für den Editor (Funktion auswählen, dann "Ausführen") ----
// Prüft die Regeln mit Werten im Speicher und die Spaltenköpfe der drei Tabs. Schreibt NICHTS ins Sheet.

function testenTeam() {
  var fehlerZahl = 0;
  function pruefe(nr, text, ist, soll) {
    var gut = JSON.stringify(ist) === JSON.stringify(soll);
    if (!gut) fehlerZahl++;
    Logger.log(nr + ') ' + (gut ? 'ok' : 'FEHLER') + ': ' + text + (gut ? '' : ' (ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll) + ')'));
  }

  pruefe(1, 'Kapazität 0 abgelehnt', teamKapazitaetOk(0), false);
  pruefe(2, 'Kapazität 11 abgelehnt', teamKapazitaetOk(11), false);
  pruefe(3, 'Kapazität 5,5 abgelehnt', teamKapazitaetOk(5.5), false);
  pruefe(4, 'Kapazität leer abgelehnt', teamKapazitaetOk(''), false);
  pruefe(5, 'Kapazität 1, 7 und 10 erlaubt', [teamKapazitaetOk(1), teamKapazitaetOk(7), teamKapazitaetOk(10)], [true, true, true]);
  pruefe(6, 'Datum 30.02. abgelehnt', teamDatumOk('2026-02-30'), false);
  pruefe(7, 'Datum TT.MM.JJJJ abgelehnt', teamDatumOk('23.10.2026'), false);
  pruefe(8, 'Datum 2026-10-23 erlaubt', teamDatumOk('2026-10-23'), true);
  pruefe(9, '183 Tage gezählt', teamTage('2026-10-23', '2027-04-24'), 183);
  pruefe(10, 'vertauschtes Datum ist negativ', teamTage('2026-10-23', '2026-10-01') < 0, true);
  pruefe(11, 'Umbenennen in einer Liste', teamNamenErsetzen('Anna, Ben', 'anna', 'Anna K.'), 'Anna K., Ben');
  pruefe(12, '„Ben“ ändert „Bente“ nicht', teamNamenErsetzen('Bente', 'Ben', 'Benjamin'), null);
  pruefe(13, 'doppelter Name fällt weg', teamNamenErsetzen('Anna K.; Anna', 'Anna', 'Anna K.'), 'Anna K.');
  pruefe(14, 'leeres Feld bleibt', teamNamenErsetzen('', 'Anna', 'Anna K.'), null);
  pruefe(15, 'Rollen-Liste lesen', teamListe('r1\nr2, r3'), ['r1', 'r2', 'r3']);
  var zeilen = [
    { id: 'p1', gruppe_id: 'g1', name: 'Anna', geloescht: false },
    { id: 'p2', gruppe_id: 'g1', name: 'Cem', geloescht: true },
    { id: 'p3', gruppe_id: 'g2', name: 'Ben', geloescht: false }
  ];
  pruefe(16, 'doppelter Name erkannt (groß/klein egal)', teamNameVergeben(zeilen, 'g1', 'anna', ''), true);
  pruefe(17, 'eigener Name zählt nicht doppelt', teamNameVergeben(zeilen, 'g1', 'Anna', 'p1'), false);
  pruefe(18, 'gelöschter Name ist frei', teamNameVergeben(zeilen, 'g1', 'Cem', ''), false);
  pruefe(19, 'Name einer anderen Gruppe ist frei', teamNameVergeben(zeilen, 'g1', 'Ben', ''), false);

  ['Personen', 'Gruppen_Rollen', 'Kapazitaet'].concat(Object.keys(TEAM_UMBENENNEN)).forEach(function (tab) {
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
