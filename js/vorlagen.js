// js/vorlagen.js
// Meilenstein-Vorlagen (fest in der App). Später können sie ins Sheet wandern.
// tage_vorher = so viele Tage VOR dem Datum des Meilensteins soll das ToDo fertig sein.
// Eine negative Zahl heißt "danach" (z. B. -3 = drei Tage nach dem Meilenstein).
// Die Tage hier sind Platzhalter und können jederzeit geändert werden.

import { normDatum, iso } from './views/todos-rechnen.js';

// Standard-ToDos: werden beim Anlegen eines Projekts vorgeschlagen (mit Haken, abwählbar).
// tage_vorher = so viele Tage VOR dem Aktionsdatum (ohne Aktionsdatum: kein Fälligkeitsdatum).
// Alle Tage sind Platzhalter. Nachlesen: docs/STAND.md, Anhang A (bei Änderung mitpflegen).
export const STANDARD_TODOS = [
  { text: 'Bühne?', tage_vorher: 21 },
  { text: 'Band?', tage_vorher: 21 },
  { text: 'Uploadplan erstellen', tage_vorher: 14 },
  { text: 'Band anfragen', tage_vorher: 14 },
  { text: 'Anfrage Bollerwagen Foodsharing', tage_vorher: 14 },
  { text: 'Presseverteiler prüfen', tage_vorher: 8 },
  { text: 'Reden festlegen', tage_vorher: 7 },
  { text: 'Awareness-Team festlegen', tage_vorher: 5 },
  { text: 'Person für Fotos festlegen', tage_vorher: 3 }
];

export const VORLAGEN = [
  {
    id: 'genehmigung',
    name: 'Genehmigung und Anmeldung',
    schritte: [
      { text: 'Ort und Route klären', tage_vorher: 28 },
      { text: 'Versammlungsleitung festlegen', tage_vorher: 21 },
      { text: 'Versammlung bei der Stadt anmelden', tage_vorher: 21 },
      { text: 'Auflagen prüfen', tage_vorher: 10 }
    ]
  },
  {
    id: 'aufbau',
    name: 'Material und Aufbau',
    schritte: [
      { text: 'Materialliste prüfen', tage_vorher: 10 },
      { text: 'Material ausleihen', tage_vorher: 2 },
      { text: 'Aufbau-Team klären', tage_vorher: 5 },
      { text: 'Abbau und Rückgabe planen', tage_vorher: 3 }
    ]
  },
  {
    id: 'nachbereitung',
    name: 'Nachbereitung',
    schritte: [
      { text: 'Material zurückgeben', tage_vorher: -1 },
      { text: 'Fotos sichten und auswählen', tage_vorher: -2 },
      { text: 'Belege und Kosten sammeln', tage_vorher: -7 },
      { text: 'Auswertung im Team', tage_vorher: -10 }
    ]
  }
];

// Fälligkeit = Datum des Meilensteins minus tage. Gibt JJJJ-MM-TT zurück, oder '' ohne Datum.
export function faelligAus(datum, tage) {
  const d = normDatum(datum);
  if (!d) return '';
  const n = Number(tage) || 0;
  const t = d.split('-').map(Number);
  return iso(new Date(t[0], t[1] - 1, t[2] - n));
}
