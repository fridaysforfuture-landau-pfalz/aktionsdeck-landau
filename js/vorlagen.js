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
  },
  {
    id: 'mobi-demo',
    name: 'Mobi: Demo / Großaktion',
    bausteine: [
      baustein('plakate', 'Plakate und Flyer', 'Plakate und Flyer', 'sonstiges', 14, 7, 4),
      baustein('presse', 'Pressemitteilung', 'Pressemitteilung', 'text', 7, 4, 2),
      baustein('insta-beitrag', 'Instagram-Beitrag', 'Instagram', 'beitrag', 10, 6, 3),
      baustein('story1', 'Instagram-Story 1', 'Instagram', 'story', 7, 4, 2),
      baustein('story2', 'Instagram-Story 2', 'Instagram', 'story', 3),
      baustein('story3', 'Instagram-Story 3', 'Instagram', 'story', 1),
      baustein('story4', 'Instagram-Story 4 (am Tag)', 'Instagram', 'story', 0),
      baustein('msg1', 'WhatsApp und Telegram: Ankündigung', 'WhatsApp und Telegram', 'text', 7, 3),
      baustein('msg2', 'WhatsApp und Telegram: Erinnerung', 'WhatsApp und Telegram', 'text', 1),
      baustein('unimail', 'Unimail', 'Unimail', 'text', 5, 3, 1),
      baustein('newsletter', 'Newsletter', 'Newsletter', 'text', 5, 3, 1),
      baustein('foerder', 'Mail an Fördermitglieder (Hamburg)', 'Mail an Fördermitglieder (Hamburg)', 'text', 5, 3, 1, ['gp']),
      baustein('danke', 'Danke-Post', 'Instagram', 'beitrag', -1, 1)
    ]
  },
  {
    id: 'mobi-klein',
    name: 'Mobi: Infostand / kleine Aktion',
    bausteine: [
      baustein('story1', 'Instagram-Story 1', 'Instagram', 'story', 3, 2),
      baustein('story2', 'Instagram-Story 2 (am Tag)', 'Instagram', 'story', 0),
      baustein('msg', 'WhatsApp und Telegram', 'WhatsApp und Telegram', 'text', 2, 1),
      baustein('kreide', 'Kreideaktion', 'Kreideaktion', 'sonstiges', 1),
      baustein('danke', 'Danke-Story', 'Instagram', 'story', -1)
    ]
  }
];

// Ein Baustein = 1 Beitrag + ToDos. tage_vorher = Veröffentlichung, so viele Tage VOR dem Meilenstein-Datum
// (negativ = danach). erstellen / feedback = so viele Tage VOR der Veröffentlichung (weglassen = kein ToDo).
// Die Tage sind Platzhalter. nur = nur für diese Gruppen (Kurzname).
function baustein(id, name, kanal, format, tageVorher, erstellen, feedback, nur) {
  return {
    id: id, name: name, kanal: kanal, format: format, tage_vorher: tageVorher,
    erstellen: erstellen, feedback: feedback, nur: nur
  };
}

// "Beitrag + ToDos: Erstellen, Feedback, Veröffentlichen"
export function bausteinText(bs) {
  const t = [];
  if (typeof bs.erstellen === 'number') t.push('Erstellen');
  if (typeof bs.feedback === 'number') t.push('Feedback');
  t.push('Veröffentlichen');
  return 'Beitrag + ToDos: ' + t.join(', ');
}

// "13 ToDos" oder "20 ToDos, 5 Beiträge" für die Auswahlliste
export function vorlageAnzahl(v) {
  let todos = (v.schritte || []).length;
  const b = v.bausteine || [];
  b.forEach(function (x) {
    todos += 1 + (typeof x.erstellen === 'number' ? 1 : 0) + (typeof x.feedback === 'number' ? 1 : 0);
  });
  return todos + ' ToDos' + (b.length ? ', ' + b.length + ' Beiträge' : '');
}

// Fälligkeit = Datum des Meilensteins minus tage. Gibt JJJJ-MM-TT zurück, oder '' ohne Datum.
export function faelligAus(datum, tage) {
  const d = normDatum(datum);
  if (!d) return '';
  const n = Number(tage) || 0;
  const t = d.split('-').map(Number);
  return iso(new Date(t[0], t[1] - 1, t[2] - n));
}
