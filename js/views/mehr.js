// js/views/mehr.js
// "Mehr" am Handy: weitere Reiter, Name ändern, Abmelden, öffentliche Seiten.

import { el, leeren } from '../ui/dom.js';
import { sichtbareTabs, oeffentlicheLinks } from '../ui/nav.js';
import { getName } from '../store.js';

export function render(container, ctx) {
  leeren(container);
  const basis = '#/g/' + encodeURIComponent(ctx.session.kurzname) + '/';
  const box = el('div', { class: 'seite' }, el('h1', { text: 'Mehr' }));

  sichtbareTabs()
    .filter(function (t) { return ['material', 'kalender', 'hilfe'].indexOf(t.id) >= 0; })
    .forEach(function (t) {
      box.append(el('a', { class: 'karte listenlink', href: basis + t.id, text: t.icon + '  ' + t.label }));
    });

  box.append(
    el('p', { class: 'leise', text: 'Angemeldet als ' + (getName() || 'unbekannt') }),
    el('div', { class: 'mehr-knoepfe' },
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Name ändern', onclick: ctx.nameAendern }),
      el('button', { class: 'knopf', type: 'button', text: 'Abmelden', onclick: ctx.abmelden })
    ),
    oeffentlicheLinks()
  );
  container.append(box);
}
