// js/views/mobi-rechnen.js
// Rechenhelfer für Mobi: Status, Fälligkeit, Sortierung, Infozeile.

import { normDatum, datumText, heuteIso, archivGrenze } from './todos-rechnen.js';
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

// Reihenfolge: zuerst überfällige (ältestes Datum zuerst), dann heute fällige,
// dann die übrigen offenen nach Datum und Uhrzeit (ohne Datum zuletzt),
// danach Veröffentlichte (neueste zuerst).
const FAELLIG_RANG = { ueberfaellig: 0, heute: 1 };

export function sortiereBeitraege(liste) {
  return liste.slice().sort(function (a, b) {
    const va = istVeroeffentlicht(a);
    const vb = istVeroeffentlicht(b);
    if (va !== vb) return va ? 1 : -1;
    if (!va) {
      const ra = FAELLIG_RANG[faelligStatus(a)] !== undefined ? FAELLIG_RANG[faelligStatus(a)] : 2;
      const rb = FAELLIG_RANG[faelligStatus(b)] !== undefined ? FAELLIG_RANG[faelligStatus(b)] : 2;
      if (ra !== rb) return ra - rb;
    }
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

export const STATI = ['idee', 'entwurf', 'review', 'bereit', 'veroeffentlicht'];

// Status als Schlüssel. Unbekannt oder leer zählt als "idee".
export function statusKey(b) {
  const s = String(b.status || '').trim();
  return STATI.indexOf(s) >= 0 ? s : 'idee';
}

// "12.09.2026 18:30 (überfällig)" oder "Ohne Datum"
export function datumZeile(b) {
  if (!normDatum(b.datum)) return 'Ohne Datum';
  const st = faelligStatus(b);
  const z = zeitNorm(b.uhrzeit);
  return datumText(b.datum) + (z ? ' ' + z : '') +
    (st === 'ueberfaellig' ? ' (überfällig)' : st === 'heute' ? ' (heute)' : '');
}

// Veröffentlicht und die letzte Änderung ist mehr als 2 Wochen her
export function istArchiv(b) {
  if (!istVeroeffentlicht(b)) return false;
  const d = normDatum(b.geaendert_am) || normDatum(b.datum);
  return !!d && d < archivGrenze();
}
