// js/views/termine.js
// Öffentliche Seite #/termine (ohne Login). Der Inhalt kommt aus termine-liste.js
// (derselbe wie der "Aktionskalender" im Reiter Kalender).

import { el, leeren } from '../ui/dom.js';
import { balken } from '../ui/kopf.js';
import { getSession } from '../store.js';
import { baueAktionskalender } from './termine-liste.js';

export async function render(container, ctx) {
  leeren(container);
  const s = getSession();
  const inhalt = baueAktionskalender(s, ctx);

  const zurueck = s
    ? el('a', { href: '#/g/' + encodeURIComponent(s.kurzname) + '/start', text: '← Zurück zur App' })
    : el('a', { href: '#/', text: '← Zur Gruppenwahl' });

  container.append(
    balken(),
    el('div', { class: 'start-seite' },
      el('h1', { text: 'Öffentliche Termine' }),
      el('p', {
        class: 'leise',
        text: 'Veranstaltungen der Klima-Gruppen in Landau. Diese Seite ist ohne Anmeldung sichtbar.'
      }),
      inhalt.el,
      el('p', null, zurueck)
    )
  );
  await inhalt.laden();
}
