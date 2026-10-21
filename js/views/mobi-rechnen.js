// js/views/mobi-rechnen.js
// Rechenhelfer für Mobi: Status, Fälligkeit, Sortierung, Infozeile.

import { normDatum, datumText, heuteIso, archivGrenze } from './todos-rechnen.js';
import { zeitNorm, addTage } from './kalender-rechnen.js';
import { FORMAT_TEXT, SCHRITTE_VIDEO, kanalInfo } from '../kanaele.js';

const STATUS_TEXT = {
  idee: 'Idee',
  entwurf: 'Entwurf',
  gedreht: 'Gedreht',
  geschnitten: 'Geschnitten',
  review: 'Review',
  anpassung: 'Anpassung',
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

// Alle Status in der längsten Reihenfolge (Video). Kanäle ohne Video-Schritte nutzen einen Teil davon.
export const STATI = SCHRITTE_VIDEO.slice();

// Status-Reihenfolge des Kanals (Standard oder Video). Unbekannte Kanäle: Standard.
export function statiFuer(kanalName) {
  return kanalInfo(kanalName).schritte.slice();
}

// Vorheriger (schritt -1) oder nächster (schritt +1) Status in der Reihenfolge des Kanals dieses Beitrags.
// Steht der Status nicht in dieser Reihenfolge (z. B. "gedreht" bei Facebook), zählt seine Stelle in STATI.
// Gibt '' zurück, wenn es keinen gibt.
export function nachbarStatus(b, schritt) {
  const reihe = statiFuer(b.kanal);
  const jetzt = statusKey(b);
  const i = reihe.indexOf(jetzt);
  if (i >= 0) return reihe[i + schritt] || '';
  const pos = STATI.indexOf(jetzt);
  if (schritt > 0) {
    return reihe.find(function (x) { return STATI.indexOf(x) > pos; }) || '';
  }
  const davor = reihe.filter(function (x) { return STATI.indexOf(x) < pos; });
  return davor.length ? davor[davor.length - 1] : '';
}

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

// { beitragId: Anzahl } aus der Liste Kommentare (nur Kommentare zu Mobi-Beiträgen, bezug_art "mobi")
export function mobiKommentarZahlen(liste) {
  const m = {};
  (liste || []).forEach(function (k) {
    if (String(k.bezug_art || '').trim() !== 'mobi') return;
    const id = String(k.bezug_id || '').trim();
    if (id) m[id] = (m[id] || 0) + 1;
  });
  return m;
}

// Warnungen für Mobi:
// - ohneMobi: offene Projekte mit Aktionsdatum in den nächsten 21 Tagen (heute mitgezählt) ohne einen Beitrag
// - ohneDatum: offene (nicht veröffentlichte) Beiträge ohne Datum, nicht von abgeschlossenen Projekten
// projektOffen(p) sagt, ob ein Projekt noch läuft.
export function mobiWarnungen(mobi, projekte, projektOffen) {
  const h = heuteIso();
  const grenze = addTage(h, 21);
  const mitBeitrag = {};
  const zu = {};
  (projekte || []).forEach(function (p) { zu[String(p.id)] = !projektOffen(p); });
  (mobi || []).forEach(function (b) {
    const pid = String(b.projekt_id || '').trim();
    if (pid) mitBeitrag[pid] = true;
  });
  const ohneMobi = (projekte || []).filter(function (p) {
    const d = normDatum(p.aktionsdatum);
    return projektOffen(p) && !!d && d >= h && d <= grenze && !mitBeitrag[String(p.id)];
  }).sort(function (a, b) { return normDatum(a.aktionsdatum).localeCompare(normDatum(b.aktionsdatum)); });
  const ohneDatum = (mobi || []).filter(function (b) {
    const pid = String(b.projekt_id || '').trim();
    return !istVeroeffentlicht(b) && !normDatum(b.datum) && !(pid && zu[pid]);
  });
  return { ohneMobi: ohneMobi, ohneDatum: ohneDatum };
}
