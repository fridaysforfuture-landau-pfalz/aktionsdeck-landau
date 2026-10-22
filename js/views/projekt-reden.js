// js/views/projekt-reden.js
// Teil „Reden“ im Projekt (Etappe 8, Schritt 8.7), aufgebaut wie der Teil „Learnings“:
// Reden dieses Projekts (neueste zuerst) und „+ Rede“ mit vorausgewähltem Projekt.
// Ein Klick führt in den Reiter Dokumentation (Ansicht Reden) und öffnet dort die Rede.
// Adressen: #/g/<kurzname>/protokoll/rede:<id> und #/g/<kurzname>/protokoll/rede-neu:p:<projekt-id>
//
// opt: { kurzname, projekt, holeDaten() -> { reden, kommentare }, offen, beiToggle(offen) }

import { el } from '../ui/dom.js';
import { normDatum, datumText, kommentarZahlen, kommentarMarke } from './todos-rechnen.js';
import { redeStatusText } from './rede-eintrag.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

export function baueRedenTeil(opt) {
  const pid = String(opt.projekt.id);
  const basis = '#/g/' + encodeURIComponent(opt.kurzname) + '/protokoll/';
  const d = opt.holeDaten();
  const zahlen = kommentarZahlen(d.kommentare || [], 'rede');
  const zeilen = (d.reden || []).filter(function (r) { return txt(r.projekt_id) === pid; })
    .sort(function (a, b) {
      return (normDatum(b.datum) || txt(b.erstellt_am)).localeCompare(normDatum(a.datum) || txt(a.erstellt_am));
    });

  const body = el('div', { class: 'projekt-teil-body' },
    el('div', { class: 'teil-aktionen' },
      el('a', { class: 'knopf', href: basis + 'rede-neu:p:' + encodeURIComponent(pid), text: '+ Rede' })));
  if (!zeilen.length) {
    body.append(el('p', { class: 'leise', text: 'Noch keine Reden zu diesem Projekt.' }));
  } else {
    body.append(el('ul', { class: 'dash-todo-liste' }, ...zeilen.map(function (r) {
      const info = [normDatum(r.datum) ? datumText(r.datum) : '', txt(r.redner), redeStatusText(r.status)]
        .filter(Boolean).join(' · ');
      return el('li', { class: 'dash-zeile' },
        el('a', { class: 'dash-todo pt-todo', href: basis + 'rede:' + encodeURIComponent(r.id) },
          el('strong', { text: (txt(r.titel) || 'Rede') + kommentarMarke(zahlen[String(r.id)]) }),
          el('span', { class: 'leise', text: info })));
    })));
  }

  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Reden' }),
      el('span', { class: 'leise', text: zeilen.length ? zeilen.length + (zeilen.length === 1 ? ' Rede' : ' Reden') : 'noch keine' })
    ),
    body
  );
  return teil;
}
