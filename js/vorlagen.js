// js/vorlagen.js
// Meilenstein-Vorlagen (fest in der App). Später können sie ins Sheet wandern.
// tage_vorher = so viele Tage VOR dem Datum des Meilensteins soll das ToDo fertig sein.
// Eine negative Zahl heißt "danach" (z. B. -3 = drei Tage nach dem Meilenstein).
// Die Tage hier sind Platzhalter und können jederzeit geändert werden.

import { normDatum, iso } from './views/todos-rechnen.js';

export const VORLAGEN = [
  {
    id: 'mobi',
    name: 'Mobi',
    schritte: [
      { text: 'Plakate designen', tage_vorher: 21 },
      { text: 'Plakate drucken', tage_vorher: 14 },
      { text: 'Uploadplan erstellen', tage_vorher: 14 },
      { text: 'Instagram-Posts erstellen', tage_vorher: 10 },
      { text: 'Instagram-Posts hochladen', tage_vorher: 7 },
      { text: 'Pressemitteilung schreiben', tage_vorher: 7 }
    ]
  },
  {
    id: 'presse',
    name: 'Pressearbeit',
    schritte: [
      { text: 'Pressemitteilung schreiben', tage_vorher: 10 },
      { text: 'Presseverteiler prüfen', tage_vorher: 8 },
      { text: 'Pressemitteilung verschicken', tage_vorher: 5 },
      { text: 'Bei der Presse nachfassen', tage_vorher: 2 }
    ]
  },
  {
    id: 'genehmigung',
    name: 'Genehmigung und Anmeldung',
    schritte: [
      { text: 'Ort und Route klären', tage_vorher: 28 },
      { text: 'Versammlung bei der Stadt anmelden', tage_vorher: 21 },
      { text: 'Auflagen prüfen', tage_vorher: 10 },
      { text: 'Ansprechperson für die Aktion festlegen', tage_vorher: 7 }
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
      { text: 'Danke-Post schreiben', tage_vorher: -2 },
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
