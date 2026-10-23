// js/views/projekt-team.js
// Teil „Team“ im Projekt (Etappe 9, Schritt 9.7), aufgebaut wie der Teil „Reden“:
// Wer hat in diesem Projekt Hüte (offene ToDos, Meilensteine, Mobi-Beiträge mit Namen)? Je Name die Zahl der Hüte
// und die Gruppen-Rollen. Mit Team-Karte führt ein Klick in den Reiter Team (#/g/<kurz>/team/<person-id>).
// Darunter die Zahl der offenen Aufgaben ohne Verantwortliche. Nichts wird gespeichert, Projekt_Team bleibt ungenutzt.
//
// opt: { kurzname, projekt, holeDaten() -> { todos, meilensteine, mobi, projekte }, team() -> { personen, rollen },
//        offen, beiToggle(offen) }

import { el } from '../ui/dom.js';
import { txt, alleHuete, rollenVon } from './team-rechnen.js';

export function baueTeamTeil(opt) {
  const pid = String(opt.projekt.id);
  const basis = '#/g/' + encodeURIComponent(opt.kurzname) + '/team/';
  const d = opt.holeDaten();
  const team = opt.team();
  const huete = alleHuete({ todos: d.todos, meilensteine: d.meilensteine, mobi: d.mobi, projekte: d.projekte }, true)
    .filter(function (h) { return h.projekt_id === pid; });
  const frei = huete.filter(function (h) { return !h.namen.length; }).length;

  // Namen zählen (genauer Vergleich, Groß- und Kleinschreibung egal)
  const zahl = {};
  const echt = {};
  huete.forEach(function (h) {
    h.namen.forEach(function (n) {
      const k = n.toLowerCase();
      if (!echt[k]) echt[k] = n;
      zahl[k] = (zahl[k] || 0) + 1;
    });
  });
  const namen = Object.keys(zahl).sort(function (a, b) { return (zahl[b] - zahl[a]) || echt[a].localeCompare(echt[b], 'de'); });

  const body = el('div', { class: 'projekt-teil-body' });
  if (!namen.length) {
    body.append(el('p', { class: 'leise', text: 'Noch niemand hat in diesem Projekt einen Hut.' }));
  } else {
    body.append(el('ul', { class: 'dash-todo-liste' }, ...namen.map(function (k) {
      const p = (team.personen || []).find(function (x) { return txt(x.name).toLowerCase() === k; });
      const rollen = p ? rollenVon(p, team.rollen || []).map(function (r) { return txt(r.name); }) : [];
      const info = [zahl[k] + (zahl[k] === 1 ? ' Hut' : ' Hüte'), rollen.join(', '), p ? '' : 'keine Team-Karte']
        .filter(Boolean).join(' · ');
      const inhalt = [el('strong', { text: p ? txt(p.name) : echt[k] }), el('span', { class: 'leise', text: info })];
      return el('li', { class: 'dash-zeile' }, p
        ? el('a', { class: 'dash-todo pt-todo', href: basis + encodeURIComponent(p.id) }, ...inhalt)
        : el('div', { class: 'dash-todo pt-todo' }, ...inhalt));
    })));
  }
  if (frei) {
    body.append(el('p', { class: 'leise', text: frei + (frei === 1 ? ' offene Aufgabe sucht' : ' offene Aufgaben suchen') + ' noch Verantwortliche (Teil ToDos, „Offene Hüte“).' }));
  }

  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Team' }),
      el('span', { class: 'leise', text: namen.length ? namen.length + (namen.length === 1 ? ' Person' : ' Personen') : 'noch niemand' })
    ),
    body
  );
  return teil;
}
