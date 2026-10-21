// js/views/kalender-rechnen.js
// Rechenhelfer für den Kalender (und später den Mobi-Kalender).
// Baut aus Veranstaltungen, Projekten, Meilensteinen, ToDos und Mobi-Beiträgen eine gemeinsame Terminliste.
// Nichts davon wird gespeichert, alles wird berechnet.
//
// Ein Termin hat: key, quelle, art, titel, von, bis (JJJJ-MM-TT), zeitVon, zeitBis, ort, farbe,
//   gruppe, link (Adresse in der App), url (externer Link), projektId, projektTitel,
//   erledigt, verantwortlich, marken (nur Projektbalken), roh (Ursprungszeile).
//   Nur bei Mobi: bezugTage (Tage bis zur Aktion/Veranstaltung, negativ = danach), bezugName, nachAktion.
// quelle: 'veranstaltung' (art intern|extern) | 'oeffentlich' | 'aktion' | 'deadline'
//         | 'balken' | 'meilenstein' | 'todo' | 'mobi'

import { istWahr } from '../schema.js';
import { normDatum, iso, heuteIso, kurz, datumText, istMeins } from './todos-rechnen.js';
import { istAbgeschlossen, meilensteinStand } from './projekt-rechnen.js';
import { kanalInfo } from '../kanaele.js';

export const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const WOCHENTAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
  'September', 'Oktober', 'November', 'Dezember'];

const STANDARD_FARBE = '#368469';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function farbeOk(f) {
  return /^#[0-9a-fA-F]{6}$/.test(txt(f));
}

function farbeVon(f, ersatz) {
  return farbeOk(f) ? txt(f) : (ersatz || STANDARD_FARBE);
}
// Weiß oder Dunkelgrau, je nachdem, was auf der Farbe besser lesbar ist
export function schriftfarbe(hex) {
  const h = farbeVon(hex);
  const kanal = function (i) {
    const c = parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const l = 0.2126 * kanal(0) + 0.7152 * kanal(1) + 0.0722 * kanal(2);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.0625 ? '#ffffff' : '#1a1e20';
}

// Sehr helle Version einer Farbe (für Deadline-Kästen)
export function pastell(hex) {
  const h = farbeVon(hex);
  const mix = function (i) {
    const c = parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(c + (255 - c) * 0.82);
  };
  return 'rgb(' + mix(0) + ',' + mix(1) + ',' + mix(2) + ')';
}

// Nur http(s)-Links sind erlaubt
export function sichereUrl(u) {
  const t = txt(u);
  return /^https?:\/\/\S+$/i.test(t) ? t : '';
}

// ---- Datum ----

function datumAus(s) {
  const t = normDatum(s);
  if (!t) return null;
  const p = t.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

// JJJJ-MM-TT plus n Tage (n darf negativ sein)
export function addTage(s, n) {
  const d = datumAus(s);
  if (!d) return '';
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function tageZwischen(a, b) {
  const da = datumAus(a);
  const db = datumAus(b);
  if (!da || !db) return 0;
  const ua = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const ub = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((ub - ua) / 86400000);
}

// Wochentag mit Montag = 0
export function wochentagNr(s) {
  const d = datumAus(s);
  return d ? (d.getDay() + 6) % 7 : 0;
}

// Nächstes Datum (ab "ab", heute zählt mit) für einen Wochentag wie "Donnerstag". '' wenn unbekannt.
export function naechsterWochentag(name, ab) {
  const idx = WOCHENTAGE.indexOf(txt(name));
  if (idx < 0) return '';
  const start = normDatum(ab) || heuteIso();
  const diff = (idx - wochentagNr(start) + 7) % 7;
  return addTage(start, diff);
}

// "18:30" aus Texten wie "18:30", "8:05" oder "1899-12-30T18:30:00". '' wenn keine Uhrzeit.
export function zeitNorm(s) {
  const m = txt(s).match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  return (m[1].length < 2 ? '0' : '') + m[1] + ':' + m[2];
}

// "18:30 – 20:00 Uhr", "ab 18:30 Uhr" oder ''
export function zeitText(t) {
  if (t.zeitVon && t.zeitBis) return t.zeitVon + ' – ' + t.zeitBis + ' Uhr';
  if (t.zeitVon) return 'ab ' + t.zeitVon + ' Uhr';
  return '';
}

// "12.09.2026" oder "12.09.2026 – 14.09.2026"
export function datumsText(t) {
  if (t.von === t.bis) return datumText(t.von);
  return datumText(t.von) + ' – ' + datumText(t.bis);
}

export function istVorbei(t, heute) {
  return t.bis < (heute || heuteIso());
}

// ---- Terminliste bauen ----

// daten: { veranstaltungen, projekte, meilensteine, todos, mobi, oeffentlich }
//   oeffentlich = Termine aus der öffentlichen Schnittstelle (andere Gruppen):
//   { titel, datum, datum_ende, zeit_von, zeit_bis, ort, beschreibung, link, gruppe_name, kurzname, farbe }
// opt: { basis ('#/g/<kurzname>/'), farbe (Farbe der eigenen Gruppe), eigeneKurz, abgeschlossene (true = auch Archiv) }
export function baueTermine(daten, opt) {
  const o = opt || {};
  const basis = o.basis || '#/';
  const eigeneFarbe = farbeVon(o.farbe);
  const liste = [];
  const projekte = daten.projekte || [];
  const meilensteine = daten.meilensteine || [];
  const todos = daten.todos || [];

  function neu(feld) {
    const t = Object.assign({
      art: '', ort: '', zeitVon: '', zeitBis: '', farbe: eigeneFarbe, gruppe: '', link: '', url: '',
      projektId: '', projektTitel: '', erledigt: false, verantwortlich: '', marken: [], roh: null
    }, feld);
    // zu = gehört zu einem abgeschlossenen Projekt (wird grau gezeigt)
    t.zu = !!t.projektId && projektOffen[t.projektId] === false;
    return t;
  }

  const projektTitel = {};
  const projektOffen = {};
  projekte.forEach(function (p) {
    projektTitel[String(p.id)] = txt(p.titel);
    projektOffen[String(p.id)] = !istAbgeschlossen(p);
  });
  function projektLink(id) {
    return basis + 'projekte/' + encodeURIComponent(id);
  }
  // Gehört der Eintrag zu einem abgeschlossenen Projekt? (dann nur zeigen, wenn gewünscht)
  function ausgeblendet(pid) {
    return !!pid && !o.abgeschlossene && projektOffen[pid] === false;
  }

  // 1) Veranstaltungen der eigenen Gruppe
  (daten.veranstaltungen || []).forEach(function (v) {
    if (istWahr(v.geloescht)) return;
    const von = normDatum(v.datum);
    if (!von) return;
    let bis = normDatum(v.datum_ende);
    if (!bis || bis < von) bis = von;
    liste.push(neu({
      key: 'v' + v.id,
      quelle: 'veranstaltung',
      art: txt(v.art) === 'extern' ? 'extern' : 'intern',
      titel: txt(v.titel),
      von: von,
      bis: bis,
      zeitVon: zeitNorm(v.zeit_von),
      zeitBis: zeitNorm(v.zeit_bis),
      ort: txt(v.ort),
      farbe: farbeVon(v.farbe, eigeneFarbe),
      url: sichereUrl(v.link),
      roh: v
    }));
  });

  // 2) Öffentliche Termine anderer Gruppen
  (daten.oeffentlich || []).forEach(function (v, i) {
    const von = normDatum(v.datum);
    if (!von) return;
    if (o.eigeneKurz && txt(v.kurzname) === o.eigeneKurz) return;
    let bis = normDatum(v.datum_ende);
    if (!bis || bis < von) bis = von;
    liste.push(neu({
      key: 'o' + i + '-' + txt(v.kurzname) + '-' + von + '-' + txt(v.titel),
      quelle: 'oeffentlich',
      art: 'extern',
      titel: txt(v.titel),
      von: von,
      bis: bis,
      zeitVon: zeitNorm(v.zeit_von),
      zeitBis: zeitNorm(v.zeit_bis),
      ort: txt(v.ort),
      farbe: farbeVon(v.farbe),
      gruppe: txt(v.gruppe_name),
      url: sichereUrl(v.link),
      roh: v
    }));
  });

  // 3) Projekte: Aktionsdatum, Deadline, Balken
  projekte.forEach(function (p) {
    const pid = String(p.id);
    const st = txt(p.status) || 'planung';
    if (st === 'planung' || (istAbgeschlossen(p) && !o.abgeschlossene)) return;
    const titel = txt(p.titel);
    const aktion = normDatum(p.aktionsdatum);
    const deadline = normDatum(p.deadline);
    const meine = meilensteine.filter(function (m) {
      return txt(m.projekt_id) === pid && normDatum(m.datum);
    });
    const mDaten = meine.map(function (m) { return normDatum(m.datum); }).sort();
    const start = normDatum(p.start_datum) || mDaten[0] || '';

    if (aktion) {
      liste.push(neu({
        key: 'a' + pid, quelle: 'aktion', titel: 'Aktion: ' + titel, von: aktion, bis: aktion,
        ort: txt(p.ort), link: projektLink(pid), projektId: pid, projektTitel: titel, roh: p
      }));
    }
    if (deadline) {
      liste.push(neu({
        key: 'd' + pid, quelle: 'deadline', titel: 'Deadline: ' + titel, von: deadline, bis: deadline,
        link: projektLink(pid), projektId: pid, projektTitel: titel, roh: p
      }));
    }
    // Balken mit Deadline: ab Start, ohne Start nur der Deadline-Tag
    if (deadline) {
      const balkenVon = (start && start < deadline) ? start : deadline;
      liste.push(neu({
        key: 'b' + pid, quelle: 'balken', titel: titel, von: balkenVon, bis: deadline,
        link: projektLink(pid), projektId: pid, projektTitel: titel,
        marken: mDaten.filter(function (d) { return d >= balkenVon && d <= deadline; }),
        roh: p
      }));
    }
  });

  // 4) Meilensteine
  meilensteine.forEach(function (m) {
    if (istWahr(m.geloescht)) return;
    const d = normDatum(m.datum);
    const pid = txt(m.projekt_id);
    if (!d || ausgeblendet(pid)) return;
    const eigene = todos.filter(function (t) { return txt(t.meilenstein_id) === String(m.id); });
    liste.push(neu({
      key: 'm' + m.id,
      quelle: 'meilenstein',
      titel: '🏁 ' + txt(m.titel),
      von: d,
      bis: d,
      link: pid ? projektLink(pid) : '',
      projektId: pid,
      projektTitel: projektTitel[pid] || '',
      verantwortlich: txt(m.verantwortlich),
      erledigt: meilensteinStand(m, eigene).erreicht,
      roh: m
    }));
  });

  // 5) Offene ToDos mit Frist
  todos.forEach(function (t) {
    if (istWahr(t.geloescht) || istWahr(t.erledigt)) return;
    const d = normDatum(t.faellig_am);
    const pid = txt(t.projekt_id);
    if (!d || ausgeblendet(pid)) return;
    liste.push(neu({
      key: 't' + t.id,
      quelle: 'todo',
      titel: '✅ ' + kurz(t.text, 80),
      von: d,
      bis: d,
      link: pid ? projektLink(pid) : basis + 'todos',
      projektId: pid,
      projektTitel: projektTitel[pid] || '',
      verantwortlich: txt(t.verantwortlich),
      roh: t
    }));
  });

  // 6) Mobi-Beiträge mit Datum (Kanalfarbe, veröffentlichte grau)
  const veranstDatum = {};
  const veranstTitel = {};
  (daten.veranstaltungen || []).forEach(function (v) {
    veranstDatum[String(v.id)] = normDatum(v.datum);
    veranstTitel[String(v.id)] = txt(v.titel);
  });
  const aktionVon = {};
  projekte.forEach(function (p) { aktionVon[String(p.id)] = normDatum(p.aktionsdatum); });
  (daten.mobi || []).forEach(function (b) {
    if (istWahr(b.geloescht)) return;
    const d = normDatum(b.datum);
    const pid = txt(b.projekt_id);
    const vid = txt(b.veranstaltung_id);
    if (!d || ausgeblendet(pid)) return;
    const k = kanalInfo(b.kanal);
    // Bezug: Aktionsdatum des Projekts, sonst Datum der Veranstaltung
    const bezug = (pid && aktionVon[pid]) || (vid && veranstDatum[vid]) || '';
    const bezugName = pid && aktionVon[pid] ? 'Aktion' : 'Veranstaltung';
    const bezugTage = bezug ? tageZwischen(d, bezug) : null;
    // Nach der Aktion ist ungewöhnlich (pink), außer Danke- und Rückblick-Beiträgen
    const danke = /danke|rückblick|rueckblick/i.test(txt(b.titel));
    liste.push(neu({
      key: 'mb' + b.id,
      quelle: 'mobi',
      titel: '📣 ' + (k.name || 'Mobi') + ': ' + kurz(b.titel, 80),
      von: d,
      bis: d,
      zeitVon: zeitNorm(b.uhrzeit),
      farbe: k.farbe,
      link: basis + 'mobi',
      projektId: pid,
      projektTitel: pid ? (projektTitel[pid] || '') : (vid ? '📅 ' + (veranstTitel[vid] || 'Veranstaltung') : ''),
      verantwortlich: txt(b.verantwortlich),
      erledigt: txt(b.status) === 'veroeffentlicht',
      bezugTage: bezugTage,
      bezugName: bezugName,
      nachAktion: bezugTage !== null && bezugTage < 0 && !danke,
      roh: b
    }));
  });

  return sortiereTermine(liste);
}

// "3 Tage bis zur Aktion", "am Tag der Aktion", "2 Tage nach der Veranstaltung" oder ''
export function bezugText(t) {
  if (t.quelle !== 'mobi' || t.bezugTage === null || t.bezugTage === undefined) return '';
  const n = t.bezugTage;
  const zur = t.bezugName === 'Aktion' ? 'zur Aktion' : 'zur Veranstaltung';
  const der = t.bezugName === 'Aktion' ? 'der Aktion' : 'der Veranstaltung';
  if (n === 0) return 'am Tag ' + der;
  if (n > 0) return n + (n === 1 ? ' Tag bis ' : ' Tage bis ') + zur;
  return (-n) + (n === -1 ? ' Tag nach ' : ' Tage nach ') + der;
}

// ---- Sortieren, Filtern ----

// Nach Anfangstag, dann Uhrzeit (ohne Uhrzeit zuerst), dann Titel
export function sortiereTermine(liste) {
  return liste.slice().sort(function (a, b) {
    if (a.von !== b.von) return a.von < b.von ? -1 : 1;
    if (a.zeitVon !== b.zeitVon) return a.zeitVon < b.zeitVon ? -1 : 1;
    return a.titel.localeCompare(b.titel, 'de');
  });
}

// Einstellung beim ersten Öffnen: alles an, außer öffentliche Termine anderer Gruppen und "nur meine"
export function standardFilter(name) {
  return {
    intern: true,
    extern: true,
    oeffentlich: false,
    projekte: true,
    deadlines: true,
    meilensteine: true,
    todos: true,
    mobi: true,
    nurMeine: false,
    archivProjekte: false,
    name: name || ''
  };
}

// Mobi-Kalender: nur Mobi-Beiträge, Projekt-Aktionen und Deadlines (zum Vergleich mit dem Aktionsdatum)
export const MOBI_FILTER = {
  intern: false, extern: false, oeffentlich: false, projekte: true, deadlines: true,
  meilensteine: false, todos: false, mobi: true, nurMeine: false
};

// Wunsch aus dem Reiter Mobi: Der Kalender öffnet sich einmal als Mobi-Kalender
let mobiKalenderWunsch = false;
export function setzeMobiKalender() { mobiKalenderWunsch = true; }
export function nimmMobiKalender() {
  const w = mobiKalenderWunsch;
  mobiKalenderWunsch = false;
  return w;
}

export function passt(t, f) {
  switch (t.quelle) {
    case 'veranstaltung': return t.art === 'intern' ? !!f.intern : !!f.extern;
    case 'oeffentlich': return !!f.oeffentlich;
    case 'aktion': return !!f.projekte;
    case 'balken': return !!f.projekte || !!f.deadlines;
    case 'deadline': return !!f.deadlines;
    case 'meilenstein': return !!f.meilensteine;
    case 'todo': return !!f.todos && (!f.nurMeine || istMeins(t.roh, f.name));
    // Ältere Merker kennen "mobi" noch nicht: dann an
    case 'mobi': return f.mobi !== false;
    default: return true;
  }
}

export function filtereTermine(liste, f) {
  return liste.filter(function (t) { return passt(t, f); });
}

// ---- Zeiträume ----

// Offene ToDos, noch nicht erreichte Meilensteine und nicht veröffentlichte Mobi-Beiträge
// bleiben bei "Kommende", auch wenn sie überfällig sind
export function istUeberfaellig(t, ab) {
  return (t.quelle === 'todo' || t.quelle === 'meilenstein' || t.quelle === 'mobi') && !t.erledigt && !t.zu &&
    t.bis < (ab || heuteIso());
}

// Kommende Termine: nicht vorbei (oder überfällig und offen), nach Anfang sortiert.
// Der Balken eines Projekts zählt nicht mit.
export function kommende(liste, ab) {
  const heute = ab || heuteIso();
  return sortiereTermine(liste.filter(function (t) {
    return t.quelle !== 'balken' && (t.bis >= heute || istUeberfaellig(t, heute));
  }));
}

// Vergangene Termine, neueste zuerst
export function vergangene(liste, ab) {
  const heute = ab || heuteIso();
  return liste.filter(function (t) {
    return t.quelle !== 'balken' && t.bis < heute && !istUeberfaellig(t, heute);
  }).sort(function (a, b) { return a.von < b.von ? 1 : (a.von > b.von ? -1 : 0); });
}

// Alle Termine, die den Zeitraum von..bis (JJJJ-MM-TT) berühren, nach Anfang sortiert.
// Der Projektbalken zählt hier mit (er wird im Monatsraster als Streifen gezeigt).
export function imZeitraum(liste, von, bis) {
  return sortiereTermine(liste.filter(function (t) {
    return t.von <= bis && t.bis >= von;
  }));
}

// ---- Monatsraster ----

// monat0: 0 = Januar. Gibt Wochen zurück, jede Woche 7 Tage ab Montag:
// [[{ tag: 'JJJJ-MM-TT', imMonat: true|false, heute: true|false }, ...], ...]
export function monatsRaster(jahr, monat0) {
  const erster = new Date(jahr, monat0, 1);
  const letzter = new Date(jahr, monat0 + 1, 0);
  const start = new Date(jahr, monat0, 1 - ((erster.getDay() + 6) % 7));
  const heute = heuteIso();
  const wochen = [];
  const lauf = new Date(start.getTime());
  while (lauf <= letzter || wochen.length === 0) {
    const woche = [];
    for (let i = 0; i < 7; i++) {
      const tag = iso(lauf);
      woche.push({ tag: tag, imMonat: lauf.getMonth() === monat0, heute: tag === heute });
      lauf.setDate(lauf.getDate() + 1);
    }
    wochen.push(woche);
    if (lauf > letzter) break;
  }
  return wochen;
}

// Die 7 Tage (Montag bis Sonntag) der Woche, in der "tag" liegt
export function wocheVon(tag) {
  const montag = addTage(tag, -wochentagNr(tag));
  const tage = [];
  for (let i = 0; i < 7; i++) tage.push(addTage(montag, i));
  return tage;
}

// "September 2026"
export function monatTitel(jahr, monat0) {
  return MONATE[monat0] + ' ' + jahr;
}
