// js/views/mobi-rechnen.js
// Rechenhelfer für Mobi: Status, Fälligkeit, Sortierung, Infozeile.

import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import { zeitNorm } from './kalender-rechnen.js';
import { FORMAT_TEXT } from '../kanaele.js';

const STATUS_TEXT = {
  idee: 'Idee',
  entwurf: 'Entwurf',
  review: 'Review',
  bereit: 'Bereit',
  veroeffentlicht: 'Veröffentlicht'
};

export function statusText(s) {
  return STATUS_TEXT[String(s || '').trim()] || 'Idee';
}

export function istVeroeffentlicht(b) {
  return String(b.status || '').trim() === 'veroeffentlicht';
}

// '' | 'ueberfaellig' | 'heute' (nur für nicht veröffentlichte Beiträge)
export function faelligStatus(b) {
  if (istVeroeffentlicht(b)) return '';
  const d = normDatum(b.datum);
  if (!d) return '';
  const h = heuteIso();
  if (d < h) return 'ueberfaellig';
  if (d === h) return 'heute';
  return '';
}

// Offene zuerst (nach Datum und Uhrzeit, ohne Datum zuletzt), dann Veröffentlichte (neueste zuerst)
export function sortiereBeitraege(liste) {
  return liste.slice().sort(function (a, b) {
    const va = istVeroeffentlicht(a);
    const vb = istVeroeffentlicht(b);
    if (va !== vb) return va ? 1 : -1;
    const da = normDatum(a.datum);
    const db = normDatum(b.datum);
    if (da !== db) {
      if (!da) return 1;
      if (!db) return -1;
      if (va) return da < db ? 1 : -1;
      return da < db ? -1 : 1;
    }
    const za = zeitNorm(a.uhrzeit);
    const zb = zeitNorm(b.uhrzeit);
    if (za !== zb) return za < zb ? -1 : 1;
    return String(a.titel).localeCompare(String(b.titel), 'de');
  });
}

// "Instagram · Story · 12.09.2026 18:30 (überfällig) · Entwurf · Anna"
export function beitragInfo(b) {
  const st = faelligStatus(b);
  const datum = normDatum(b.datum)
    ? datumText(b.datum) + (zeitNorm(b.uhrzeit) ? ' ' + zeitNorm(b.uhrzeit) : '') +
      (st === 'ueberfaellig' ? ' (überfällig)' : st === 'heute' ? ' (heute)' : '')
    : 'Ohne Datum';
  return [
    String(b.kanal || '').trim(),
    FORMAT_TEXT[String(b.format || '').trim()] || '',
    datum,
    statusText(b.status),
    String(b.verantwortlich || '').trim()
  ].filter(Boolean).join(' · ');
}
