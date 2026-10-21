// js/views/mobi-vorlage.js
// Legt für gewählte Bausteine einer Meilenstein-Vorlage die Beiträge (Mobi_Plan) und ihre ToDos an.
// Je Baustein: 1 Beitrag + ToDos Erstellen, Feedback (wenn in der Vorlage vorgesehen), Veröffentlichen.
// Alle ToDos zeigen mit mobi_id auf den Beitrag.

import { api } from '../api.js';
import { faelligAus } from '../vorlagen.js';

// bausteine: [{ bs, datum }]  (datum = Veröffentlichungstermin JJJJ-MM-TT oder '')
// Gibt { beitraege, todos } (Anzahlen) zurück. Wirft bei einem Fehler.
export async function legeBausteineAn(token, projektId, meilensteinId, bausteine) {
  const beitraege = bausteine.map(function (b) {
    return {
      projekt_id: projektId,
      kanal: b.bs.kanal,
      format: b.bs.format || 'beitrag',
      titel: b.bs.name,
      datum: b.datum || '',
      status: 'idee'
    };
  });
  const angelegt = await api('batchCreate', { tabelle: 'Mobi_Plan', liste: beitraege }, token);

  const todos = [];
  bausteine.forEach(function (b, i) {
    const mobiId = String(angelegt[i].id);
    function neu(text, details, frist) {
      todos.push({
        projekt_id: projektId,
        meilenstein_id: meilensteinId,
        text: text + ': ' + b.bs.name,
        details: details,
        faellig_am: frist,
        prioritaet: 'normal',
        mobi_id: mobiId
      });
    }
    if (typeof b.bs.erstellen === 'number') {
      neu('Erstellen', 'Entwurf in Canva anlegen und den Canva-Link im Beitrag eintragen.',
        faelligAus(b.datum, b.bs.erstellen));
    }
    if (typeof b.bs.feedback === 'number') {
      neu('Feedback', 'Entwurf im Beitrag kommentieren lassen (Probelesen) und Rückmeldungen einarbeiten.',
        faelligAus(b.datum, b.bs.feedback));
    }
    neu('Veröffentlichen', 'Beitrag veröffentlichen. Danach im Beitrag auf „Veröffentlicht“ setzen.',
      b.datum || '');
  });

  await api('batchCreate', { tabelle: 'ToDos', liste: todos }, token);
  return { beitraege: beitraege.length, todos: todos.length };
}
