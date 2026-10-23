// js/views/todos-hut.js
// Hut = offenes ToDo ohne Verantwortliche. Knöpfe "Hut übernehmen" (ohne Verantwortliche)
// und "Weitergeben" (mit Verantwortlichen). Gemeinsam für den Reiter ToDos und den Teil ToDos im Projekt.
// Ohne Konfliktprüfung (wie Abhaken). Die Anzeige ändert sich sofort, gespeichert wird im Hintergrund.
//
// o: { ctx, token, t (das ToDo), personen() -> Namensliste, fertig() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { istWahr } from '../schema.js';
import { namenMitRollen } from './team-namen.js';

export function istOffenerHut(t) {
  return !istWahr(t.erledigt) && !String(t.verantwortlich || '').trim();
}

// Ändert sofort in der Anzeige, speichert danach. Bei einem Fehler springt es zurück.
function setzen(o, name, okText) {
  const alt = o.t.verantwortlich;
  o.t.verantwortlich = name;
  o.fertig();
  toast(okText);
  return api('update', {
    tabelle: 'ToDos', id: o.t.id, daten: { verantwortlich: name }
  }, o.token).then(function (r) {
    if (r && r.eintrag) Object.assign(o.t, r.eintrag);
  }).catch(function (e) {
    o.t.verantwortlich = alt;
    o.fertig();
    if (o.ctx.behandleFehler(e)) return;
    toast(e.code === 'nicht_gefunden'
      ? 'Dieses ToDo gibt es nicht mehr.'
      : 'Nicht gespeichert: ' + e.message);
  });
}

function weitergeben(o) {
  let fenster = null;
  const aktuell = String(o.t.verantwortlich || '').trim();
  const form = baueFormular(
    [{ name: 'person', label: 'Neue Person (leer lassen = Hut wird frei)', typ: 'text' }],
    { person: '' },
    {
      speichernText: 'Weitergeben',
      vorschlaege: { person: namenMitRollen(o.personen ? o.personen() : []) },
      onSpeichern: function (d) {
        fenster.schliessen();
        setzen(o, d.person, d.person ? 'Hut an ' + d.person + ' gegeben.' : 'Hut ist jetzt frei.');
        return Promise.resolve();
      },
      onAbbrechen: function () { fenster.schliessen(); }
    }
  );
  fenster = zeigeFenster('Hut weitergeben', el('div', null,
    aktuell ? el('p', { class: 'leise', text: 'Aktuell: ' + aktuell }) : null,
    form
  ));
}

export function huetKnoepfe(o) {
  const wer = String(o.t.verantwortlich || '').trim();
  const ich = getName();
  const meins = !!ich && wer.toLowerCase() === ich.toLowerCase();
  const box = el('div', { class: 'hut-knoepfe' });

  // Übernehmen: bei freien Hüten und bei ToDos anderer (nicht bei den eigenen)
  if (!meins) {
    box.append(el('button', {
      class: 'knopf knopf-klein', type: 'button', text: 'Hut übernehmen',
      onclick: function () {
        if (!ich) { toast('Bitte zuerst deinen Namen eintragen (Name ändern).'); return; }
        setzen(o, ich, 'Du hast den Hut übernommen.');
      }
    }));
  }
  // Weitergeben: nur wenn schon jemand verantwortlich ist
  if (wer) {
    box.append(el('button', {
      class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Weitergeben',
      onclick: function () { weitergeben(o); }
    }));
  }
  return box;
}
