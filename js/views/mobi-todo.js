// js/views/mobi-todo.js
// Sammel-ToDos aus den Mobi-Beiträgen: pro Projekt und Kanalgruppe ein Eintrag, zum Beispiel „📣 Social Media“
// (Instagram, Facebook, TikTok zusammen). Unbekannte Kanäle zählen zu „Sonstiges“.
// Sie werden NICHT gespeichert, sondern bei jedem Zeichnen berechnet (wie Kalender-Termine).
// Ein Sammel-ToDo sieht aus wie ein ToDo (text, faellig_am, erledigt, verantwortlich ...),
// damit Sortierung, Filter und Zählzeile aus todos-rechnen.js damit arbeiten können.
// Es hat kein Kästchen. Ein Klick öffnet den Reiter Mobi (Kanban, gefiltert auf Projekt und Kanalgruppe).

import { kanalInfo, KANALGRUPPEN } from '../kanaele.js';
import { istVeroeffentlicht } from './mobi-rechnen.js';
import { normDatum, heuteIso } from './todos-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

export function istSammel(t) {
  return !!(t && t._sammel);
}

// mobi: alle Beiträge, projekte: alle Projekte (für "abgeschlossen")
// projektId (freiwillig): nur für dieses Projekt
export function sammelTodos(mobi, projekte, projektId) {
  const zu = {};
  (projekte || []).forEach(function (p) { zu[String(p.id)] = istAbgeschlossen(p); });
  const gruppen = {};
  const reihenfolge = [];
  (mobi || []).forEach(function (b) {
    const pid = txt(b.projekt_id);
    // Nur Beiträge von Projekten (nicht von Veranstaltungen), nur offene Projekte
    if (!pid || zu[pid] !== false) return;
    if (projektId && pid !== String(projektId)) return;
    const gid = kanalInfo(b.kanal).gruppe || 'sonstiges';
    const kg = KANALGRUPPEN.find(function (x) { return x.id === gid; }) || KANALGRUPPEN[KANALGRUPPEN.length - 1];
    const key = pid + '|' + kg.id;
    if (!gruppen[key]) {
      gruppen[key] = { pid: pid, gruppe: kg, liste: [] };
      reihenfolge.push(key);
    }
    gruppen[key].liste.push(b);
  });
  // Reihenfolge wie KANALGRUPPEN (Social Media, Digital, Print, Extern, Sonstiges)
  reihenfolge.sort(function (a, b) {
    return KANALGRUPPEN.indexOf(gruppen[a].gruppe) - KANALGRUPPEN.indexOf(gruppen[b].gruppe);
  });
  return reihenfolge.map(function (key) { return baue(gruppen[key]); });
}

function baue(g) {
  const offen = g.liste.filter(function (b) { return !istVeroeffentlicht(b); });
  const fertig = g.liste.length - offen.length;
  const erledigt = offen.length === 0;

  // Datum: das nächste Datum eines offenen Beitrags. Gibt es keins: das späteste Datum.
  const offeneDaten = offen.map(function (b) { return normDatum(b.datum); }).filter(Boolean).sort();
  const alleDaten = g.liste.map(function (b) { return normDatum(b.datum); }).filter(Boolean).sort();
  const datum = offeneDaten.length ? offeneDaten[0] : (alleDaten.length ? alleDaten[alleDaten.length - 1] : '');

  // Verantwortliche: Namen der (offenen) Beiträge. Offener Beitrag ohne Namen = „Hut frei“.
  const quelle = erledigt ? g.liste : offen;
  const personen = [];
  quelle.forEach(function (b) {
    const n = txt(b.verantwortlich);
    if (n && personen.indexOf(n) < 0) personen.push(n);
  });
  const hutFrei = offen.some(function (b) { return !txt(b.verantwortlich); });
  const ueberfaellig = offen.some(function (b) {
    const d = normDatum(b.datum);
    return !!d && d < heuteIso();
  });

  // Erledigt seit: die letzte Änderung eines Beitrags (für "Erledigt, letzte 2 Wochen" und das Archiv)
  let erledigtAm = '';
  if (erledigt) {
    g.liste.forEach(function (b) {
      const d = normDatum(b.geaendert_am) || normDatum(b.datum);
      if (d && d > erledigtAm) erledigtAm = d;
    });
  }

  const stand = fertig + ' von ' + g.liste.length + ' veröffentlicht';
  return {
    id: 'mobi-' + g.pid + '-' + g.gruppe.id,
    _sammel: true,
    _farbe: g.gruppe.farbe,
    // Wert für den Kanalfilter im Reiter Mobi: Gruppe ("g:social"), Sonstiges hat dort keine Gruppe
    _kanalId: g.gruppe.id === 'sonstiges' ? 'sonstiges' : 'g:' + g.gruppe.id,
    _personen: personen,
    _hutFrei: hutFrei,
    _ueberfaellig: ueberfaellig,
    _stand: stand,
    projekt_id: g.pid,
    text: '📣 ' + g.gruppe.name,
    details: stand,
    faellig_am: datum,
    erledigt: erledigt,
    erledigt_am: erledigtAm,
    prioritaet: 'normal',
    verantwortlich: personen.join(', ')
  };
}

// Infozeile: "3 von 8 veröffentlicht · Anna, Ben · Hut frei"
export function sammelInfo(t) {
  return [t._stand, t.verantwortlich, !t.erledigt && t._hutFrei ? 'Hut frei' : '']
    .filter(Boolean).join(' · ');
}

// Filter "Verantwortlich" im Reiter ToDos: passt, wenn die Person bei einem Beitrag steht.
// '__leer' = ohne Verantwortliche: passt, wenn ein offener Beitrag ohne Namen ist („Hut frei“).
export function sammelPasstWer(t, wer) {
  if (!wer) return true;
  if (wer === '__leer') return !t.erledigt && t._hutFrei;
  return t._personen.indexOf(wer) >= 0;
}

// ---- Sprung in den Reiter Mobi ----
// Die Vorgabe wird vor dem Navigieren gesetzt und vom Reiter Mobi beim Öffnen einmal gelesen.
let vorgabe = null;

export function nimmMobiVorgabe() {
  const v = vorgabe;
  vorgabe = null;
  return v;
}

export function oeffneSammel(ctx, t) {
  vorgabe = { projekt: String(t.projekt_id), kanal: t._kanalId || '', ansicht: 'kanban' };
  location.hash = '#/g/' + encodeURIComponent(ctx.session.kurzname) + '/mobi';
}
