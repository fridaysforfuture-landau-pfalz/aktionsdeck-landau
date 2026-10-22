// js/views/protokoll-rechnen.js
// Rechenhilfen für den Reiter Protokoll (Etappe 8): Arten, Rollen je Gruppe, Sortierung,
// Gruppieren nach Jahr, Suche, Text zum Kopieren und der Hinweis zur Einfügestelle.
// Keine Anzeige, kein Laden. Wird von js/views/protokoll.js und vom Formular js/views/protokoll-eintrag.js benutzt.

import { istWahr } from '../schema.js';
import { normDatum, datumText } from './todos-rechnen.js';
import { naechsterWochentag, addTage, zeitNorm } from './kalender-rechnen.js';

// Höchstlänge des Protokolltexts (wie MAX_TEXT_AUSNAHMEN in apps-script/Schema.gs)
export const MAX_TEXT = 20000;

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// Art des Protokolls: angezeigt groß, gespeichert klein (wie in js/schema.js)
export const ARTEN = [
  { wert: 'plenum', label: 'Plenum' },
  { wert: 'ag', label: 'AG' },
  { wert: 'aktion', label: 'Aktion' },
  { wert: 'sonstiges', label: 'Sonstiges' }
];

export function artText(a) {
  const k = txt(a).toLowerCase();
  const x = ARTEN.find(function (y) { return y.wert === k; });
  return x ? x.label : txt(a);
}

// Rollen je Gruppe (Entscheidung C, 22.10.2026). Klimabündnis braucht vorerst keine.
const ROLLEN = {
  fff: ['Moderation', 'Protokoll', 'Awareness'],
  gp: ['Moderation', 'Protokoll', 'Awareness']
};

export function rollenFuer(kurzname) {
  return (ROLLEN[txt(kurzname).toLowerCase()] || []).slice();
}

export function imDokument(p) {
  return istWahr(p.im_dokument);
}

// Datum zum Sortieren und Gruppieren: Protokoll-Datum, sonst Tag des Anlegens
export function datumVon(p) {
  return normDatum(p.datum) || normDatum(txt(p.erstellt_am).slice(0, 10));
}

// Neueste zuerst (nach Datum, bei gleichem Datum nach Anlegen)
export function sortiereProtokolle(liste) {
  return liste.slice().sort(function (a, b) {
    const d = datumVon(b).localeCompare(datumVon(a));
    if (d) return d;
    return txt(b.erstellt_am).localeCompare(txt(a.erstellt_am));
  });
}

// [{ jahr: '2026', liste: [...] }], neueste Jahre zuerst. Erwartet eine sortierte Liste.
export function nachJahr(liste) {
  const gruppen = [];
  const index = {};
  liste.forEach(function (p) {
    const jahr = datumVon(p).slice(0, 4) || 'Ohne Datum';
    if (!index[jahr]) {
      index[jahr] = { jahr: jahr, liste: [] };
      gruppen.push(index[jahr]);
    }
    index[jahr].liste.push(p);
  });
  return gruppen;
}

// Suche in Titel, Protokolltext und Anwesend (ohne Groß- und Kleinschreibung)
export function passtSuche(p, suche) {
  const s = txt(suche).toLowerCase();
  if (!s) return true;
  return [p.titel, p.text, p.teilnehmende].some(function (x) {
    return txt(x).toLowerCase().indexOf(s) >= 0;
  });
}

// Schlüssel für den Filter „Projekt oder Veranstaltung“: 'p:<id>' und 'v:<id>'
export function bezugSchluessel(p) {
  const l = [];
  if (txt(p.projekt_id)) l.push('p:' + txt(p.projekt_id));
  if (txt(p.veranstaltung_id)) l.push('v:' + txt(p.veranstaltung_id));
  return l;
}

// Klartext zum Kopieren: Titel, Datum, Rollen, Anwesend, Protokolltext (auch für das Pad)
export function kopierText(p) {
  const teile = [txt(p.titel) || 'Protokoll'];
  if (normDatum(p.datum)) teile.push('Datum: ' + datumText(p.datum));
  txt(p.rollen).split(/\r?\n/).forEach(function (z) { if (txt(z)) teile.push(txt(z)); });
  if (txt(p.teilnehmende)) teile.push('Anwesend: ' + txt(p.teilnehmende));
  const text = String(p.text === undefined || p.text === null ? '' : p.text).replace(/\s+$/, '');
  return teile.join('\n') + (text ? '\n\n' + text : '') + '\n';
}

// Hinweis zur Einfügestelle je Modus (aus der Skript-Aktion protokollInfo)
export function einfuegeHinweis(modus, kurzname) {
  if (modus === 'dokument') return 'Das Protokoll steht im Dokument direkt unter der Markierung.';
  if (modus === 'extern') {
    return txt(kurzname).toLowerCase() === 'gp'
      ? 'Füge das Protokoll im Pad von Hand ein, nach dem Absatz „Aktuelle Projekte“.'
      : 'Füge das Protokoll im Pad von Hand ein.';
  }
  return '';
}

// ---- Formular (8.3) ----

// Namen für Vorschläge: Personen (aktiv), eigener Anzeigename, Anwesende und Rollen bisheriger Protokolle.
// Häufige Namen zuerst. Höchstens max Namen (Standard 30), je höchstens 40 Zeichen.
export function namenVorschlaege(personen, protokolle, eigener, max) {
  const zahl = {};
  const echt = {};
  function merke(n, gewicht) {
    const k = txt(n).replace(/^@/, '').slice(0, 40);
    if (!k) return;
    const key = k.toLowerCase();
    if (!echt[key]) echt[key] = k;
    zahl[key] = (zahl[key] || 0) + gewicht;
  }
  merke(eigener, 1000);
  (personen || []).forEach(function (p) {
    if (p.aktiv === undefined || p.aktiv === '' || istWahr(p.aktiv)) merke(p.name, 1);
  });
  (protokolle || []).forEach(function (p) {
    namenAusListe(p.teilnehmende).forEach(function (n) { merke(n, 1); });
    Object.keys(rollenAusText(p.rollen)).forEach(function (r) { merke(rollenAusText(p.rollen)[r], 1); });
  });
  return Object.keys(zahl).sort(function (a, b) {
    return (zahl[b] - zahl[a]) || echt[a].localeCompare(echt[b], 'de');
  }).slice(0, max || 30).map(function (k) { return echt[k]; });
}

// "Anna, Ben,  Cem" -> ['Anna', 'Ben', 'Cem'] (auch Strichpunkt und Zeilenumbruch trennen)
export function namenAusListe(text) {
  return txt(text).split(/[,;\n]/).map(function (x) { return txt(x); }).filter(Boolean);
}

// Name in die Liste aufnehmen oder (ist er schon drin) herausnehmen. Gibt den neuen Text zurück.
export function nameUmschalten(text, name) {
  const liste = namenAusListe(text);
  const k = txt(name).toLowerCase();
  const i = liste.findIndex(function (x) { return x.toLowerCase() === k; });
  if (i >= 0) liste.splice(i, 1);
  else liste.push(txt(name));
  return liste.join(', ');
}

// "Moderation: Anna\nProtokoll: Ben" -> { Moderation: 'Anna', Protokoll: 'Ben' }
export function rollenAusText(text) {
  const o = {};
  txt(text).split(/\r?\n/).forEach(function (z) {
    const i = z.indexOf(':');
    if (i < 1) return;
    const rolle = txt(z.slice(0, i));
    const name = txt(z.slice(i + 1));
    if (rolle && name) o[rolle] = name;
  });
  return o;
}

// { Moderation: 'Anna', Awareness: '' } -> "Moderation: Anna" (leere Rollen fallen weg)
export function rollenText(rollen, reihenfolge) {
  return reihenfolge.filter(function (r) { return txt(rollen[r]); })
    .map(function (r) { return r + ': ' + txt(rollen[r]); }).join('\n');
}

// Gliederung für ein Plenum
export function plenumGliederung() {
  return '1. \n\n2. \n\nSonstiges\n';
}

// „+ TOP“: nächste Nummer vor der Zeile „Sonstiges“ einfügen (ohne „Sonstiges“: am Ende).
// Gibt { text, pos } zurück; pos = Cursor direkt hinter der neuen Nummer.
export function topEinfuegen(text) {
  const t = String(text === undefined || text === null ? '' : text);
  let n = 0;
  t.split('\n').forEach(function (z) {
    const m = /^\s*(\d+)\.(\s|$)/.exec(z);
    if (m) n = Math.max(n, Number(m[1]));
  });
  const neu = (n + 1) + '. ';
  const m = /(^|\n)Sonstiges/i.exec(t);
  if (m) {
    const stelle = m.index + m[1].length;
    const davor = t.slice(0, stelle);
    const trenner = davor === '' || /\n\n$/.test(davor) ? '' : (/\n$/.test(davor) ? '\n' : '\n\n');
    const vorn = davor + trenner + neu;
    return { text: vorn + '\n\n' + t.slice(stelle), pos: vorn.length };
  }
  const trenner = t === '' || /\n\n$/.test(t) ? '' : (/\n$/.test(t) ? '\n' : '\n\n');
  const vorn = t + trenner + neu;
  return { text: vorn, pos: vorn.length };
}

// Nächstes Plenum nach dem Tag des Protokolls (der Tag selbst zählt nicht).
// vorlagen: Zeilen aus Termin_Vorlagen (eine, deren Name mit „Plenum“ beginnt), sonst standard
// ({ wochentag, zeit_von } aus kalender-vorlagen.js). Gibt { datum, zeit } oder null.
export function naechstesPlenum(vorlagen, standard, protokollDatum) {
  const v = (vorlagen || []).find(function (x) {
    return /^plenum/i.test(txt(x.name)) && txt(x.wochentag);
  }) || standard;
  if (!v || !txt(v.wochentag)) return null;
  const ab = addTage(normDatum(protokollDatum) || '', 1);
  const datum = naechsterWochentag(v.wochentag, ab);
  return datum ? { datum: datum, zeit: zeitNorm(v.zeit_von) } : null;
}

// Schlusszeile "Nächstes Plenum: 23.10.2026, 18:30" ('' ohne Datum)
export function schlusszeile(datum, zeit) {
  if (!normDatum(datum)) return '';
  return 'Nächstes Plenum: ' + datumText(datum) + (zeitNorm(zeit) ? ', ' + zeitNorm(zeit) : '');
}

// Protokolltext mit Schlusszeile (wird beim Speichern gebaut)
export function textMitSchluss(text, datum, zeit) {
  const t = String(text === undefined || text === null ? '' : text).replace(/\s+$/, '');
  const z = schlusszeile(datum, zeit);
  if (!z) return t;
  return t ? t + '\n\n' + z : z;
}
