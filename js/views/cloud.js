// js/views/cloud.js
// Reiter „Cloud“ (11.3): kurze Seite mit dem Knopf zur Cloud der Gruppe (neuer Tab).
// Die Adresse kommt aus dem Skript (Skripteigenschaft CLOUD_LINK_<gruppe_id>), nicht aus dem Repo.

import { el, leeren } from '../ui/dom.js';
import { cloudLinkSofort } from '../gruppeninfo.js';

export function render(container, ctx) {
  leeren(container);
  const link = cloudLinkSofort(ctx.session.gruppe_id);
  const box = el('div', { class: 'seite' }, el('h1', { text: 'Cloud' }));

  if (!link) {
    box.append(el('p', { class: 'leise', text: 'Für diese Gruppe ist keine Cloud eingetragen.' }));
  } else {
    box.append(
      el('p', {
        text: 'In der Cloud liegen die Dateien der Gruppe. Sie ist ein eigener Dienst außerhalb der App ' +
          'und öffnet sich in einem neuen Tab.'
      }),
      el('a', {
        class: 'knopf cloud-knopf', href: link, target: '_blank', rel: 'noopener noreferrer',
        text: 'Cloud öffnen →'
      })
    );
  }
  container.append(box);
}
