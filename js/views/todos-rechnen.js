// js/views/todos-rechnen.js
// Rechenhelfer für ToDos: Datum, Fälligkeit, Sortierung, Filter, Archiv, Zahlen.
// Wird vom Reiter ToDos, vom Start-Dashboard und später von den Projekten (4.3) benutzt.

import { istWahr } from '../schema.js';

const PRIO_TEXT = { hoch: 'Hoch', normal: 'Normal', niedrig: 'Niedrig' };
const PRIO_RANG = { hoch: 0, normal: 1, niedrig: 2 };

// Liest ein Datum in den Formaten 2026-09-03, 03.09.2026 und 03.09.26.
// Gibt JJJJ-MM-TT zurück, oder '' wenn es nicht lesbar ist.
export function normDatum(s) {
  const t = String(s === undefined || s === null ? '' : s).trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})/);
  if (m) {
    const zz = function (n) { return (n.length < 2 ? '0' : '') + n; };
    const jahr = m[3].length === 2 ? '20' + m[3] : m[3];
    return jahr + '-' + zz(m[2]) + '-' + zz(m[1]);
  }
  return '';
}

export function datumText(s) {
  const d = normDatum(s);
  return d ? d.split('-').reverse().join('.') : String(s || '');
}

export function prioText(p) {
  return PRIO_TEXT[String(p || '').trim()] || '';
}

export function kurz(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

// Lokales Datum als JJJJ-MM-TT
export function iso(d) {
  const zz = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + zz(d.getMonth() + 1) + '-' + zz(d.getDate());
}

export function heuteIso() {
  return iso(new Date());
}

// Sonntag dieser Woche
export function wochenEnde() {
  const d = new Date();
  const tag = d.getDay(); // 0 = Sonntag
  d.setDate(d.getDate() + (tag === 0 ? 0 : 7 - tag));
  return iso(d);
}

export function datumVon(t) {
  return normDatum(t.faellig_am);
}

// '' | 'ueberfaellig' | 'heute' (nur für offene ToDos)
export function faelligStatus(t) {
  if (istWahr(t.erledigt)) return '';
  const d = datumVon(t);
  if (!d) return '';
  const h = heuteIso();
  if (d < h) return 'ueberfaellig';
  if (d === h) return 'heute';
  return '';
}

export function faelligText(t) {
  const d = datumText(t.faellig_am);
  if (!d) return '';
  const st = faelligStatus(t);
  if (st === 'ueberfaellig') return d + ' (überfällig)';
  if (st === 'heute') return d + ' (heute)';
  return d;
}

function rang(t) {
  const r = PRIO_RANG[String(t.prioritaet || '').trim()];
  return r === undefined ? 1 : r;
}

// Offene zuerst, dann Fälligkeit (ohne Datum zuletzt), dann Priorität, dann Anlegedatum
export function sortieren(liste) {
  return liste.slice().sort(function (a, b) {
    const ea = istWahr(a.erledigt);
    const eb = istWahr(b.erledigt);
    if (ea !== eb) return ea ? 1 : -1;
    const fa = datumVon(a);
    const fb = datumVon(b);
    if (fa !== fb) {
      if (!fa) return 1;
      if (!fb) return -1;
      return fa < fb ? -1 : 1;
    }
    if (rang(a) !== rang(b)) return rang(a) - rang(b);
    return String(a.erstellt_am || '').localeCompare(String(b.erstellt_am || ''));
  });
}

// ---- Erledigt und Archiv ----

// Datum, an dem das ToDo erledigt wurde. Ist es nicht lesbar: Änderungsdatum. JJJJ-MM-TT oder ''
export function erledigtDatum(t) {
  return normDatum(t.erledigt_am) || normDatum(t.geaendert_am);
}

// Alles, was davor erledigt wurde, gehört ins Archiv (14 Tage)
export function archivGrenze() {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return iso(d);
}

export function istArchiv(t) {
  if (!istWahr(t.erledigt)) return false;
  const d = erledigtDatum(t);
  return !!d && d < archivGrenze();
}

// Zuletzt erledigte zuerst
export function sortiereErledigte(liste) {
  return liste.slice().sort(function (a, b) {
    const da = erledigtDatum(a);
    const db = erledigtDatum(b);
    if (da !== db) return da < db ? 1 : -1;
    return String(b.geaendert_am || '').localeCompare(String(a.geaendert_am || ''));
  });
}

// ---- Zuordnung und Zahlen ----

// Allgemeines ToDo = gehört zu keinem Projekt und keinem Post
export function istAllgemein(t) {
  return !String(t.projekt_id || '').trim() && !String(t.post_id || '').trim();
}

export function istMeins(t, name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return false;
  return String(t.verantwortlich || '').toLowerCase().indexOf(n) >= 0;
}

// "3 offen · 1 überfällig · 1 heute fällig · 3 für dich" (zählt nur offene)
export function zahlenText(liste, name) {
  const offen = liste.filter(function (t) { return !istWahr(t.erledigt); });
  const ueber = offen.filter(function (t) { return faelligStatus(t) === 'ueberfaellig'; }).length;
  const heute = offen.filter(function (t) { return faelligStatus(t) === 'heute'; }).length;
  const meine = offen.filter(function (t) { return istMeins(t, name); }).length;
  return offen.length + ' offen · ' + ueber + ' überfällig · ' + heute + ' heute fällig · ' + meine + ' für dich';
}

// f: { q, wer ('' | '__leer' | Name), faellig ('' | ueberfaellig | heute | woche | ohne),
//      prio ('' | hoch | normal | niedrig), meine (true/false), name }
export function treffer(t, f) {
  const offen = !istWahr(t.erledigt);
  const d = datumVon(t);

  if (f.q) {
    const heu = [t.text, t.details, t.verantwortlich, prioText(t.prioritaet), datumText(t.faellig_am)]
      .join(' ').toLowerCase();
    if (heu.indexOf(f.q) < 0) return false;
  }
  const wer = String(t.verantwortlich || '').trim();
  if (f.wer === '__leer') {
    if (wer) return false;
  } else if (f.wer && wer !== f.wer) {
    return false;
  }
  if (f.prio && (String(t.prioritaet || '').trim() || 'normal') !== f.prio) return false;
  if (f.meine && !istMeins(t, f.name)) return false;

  const h = heuteIso();
  if (f.faellig === 'ueberfaellig') return offen && !!d && d < h;
  if (f.faellig === 'heute') return offen && d === h;
  if (f.faellig === 'woche') return offen && !!d && d >= h && d <= wochenEnde();
  if (f.faellig === 'ohne') return !d;
  return true;
}

// ---- Kommentare ----

// { todoId: Anzahl } aus der Liste Kommentare (nur Kommentare zu ToDos).
// art (freiwillig, seit 8.6): andere Art zählen, zum Beispiel 'rede'.
export function kommentarZahlen(liste, art) {
  const m = {};
  const welche = art || 'todo';
  (liste || []).forEach(function (k) {
    if (String(k.bezug_art || '').trim() !== welche) return;
    const id = String(k.bezug_id || '').trim();
    if (id) m[id] = (m[id] || 0) + 1;
  });
  return m;
}

// Kleine Markierung hinter dem Titel, z. B. "  💬 2". Ohne Kommentare leer.
export function kommentarMarke(n) {
  return n ? '  💬 ' + n : '';
}
