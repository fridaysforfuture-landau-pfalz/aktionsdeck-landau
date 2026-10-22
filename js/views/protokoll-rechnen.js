// js/views/protokoll-rechnen.js
// Rechenhilfen für den Reiter Protokoll (Etappe 8): Arten, Rollen je Gruppe, Sortierung,
// Gruppieren nach Jahr, Suche, Text zum Kopieren und der Hinweis zur Einfügestelle.
// Keine Anzeige, kein Laden. Wird von js/views/protokoll.js benutzt (später auch vom Formular, 8.3).

import { istWahr } from '../schema.js';
import { normDatum, datumText } from './todos-rechnen.js';

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
