// js/views/nicht-gefunden.js
// Seit 0.34.10 (12.13): Unbekannte Adressen zeigen diese Seite, statt still zum Start zu springen.
// Die Datei 404.html im Hauptordner sieht gleich aus (für falsche Adressen ohne #).

import { el, leeren } from '../ui/dom.js';
import { balken } from '../ui/kopf.js';

export function render(container, ctx) {
  leeren(container);
  container.append(
    balken(),
    el('main', { class: 'start-seite' },
      el('section', { class: 'karte' },
        el('h1', { text: 'Seite nicht gefunden' }),
        el('p', { text: (ctx && ctx.hinweis) || 'Diese Adresse gibt es in der App nicht. Vielleicht ist der Link alt oder falsch abgeschrieben.' }),
        el('p', null, el('a', { class: 'knopf', href: '#/', text: 'Zur Startseite' }))
      )
    )
  );
}
