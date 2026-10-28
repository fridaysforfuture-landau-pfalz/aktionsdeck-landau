// js/ui/logo.js
// Gruppenlogo: icons/gruppen/<kurzname>.svg, sonst .png, sonst das AktionsDeck-Logo.
// 12.6: Für bekannte Logos gleich die richtige Datei (spart eine vergebliche Anfrage).
// Neues Logo in icons/gruppen/ ablegen? Dann hier eintragen. Fehlt der Eintrag, wird wie bisher gesucht.

import { el } from './dom.js';

const LOGOS = { fff: 'png', gp: 'svg', kb: 'png' };

export function gruppenLogo(kurzname, klasse) {
  const k = encodeURIComponent(String(kurzname || ''));
  const art = Object.prototype.hasOwnProperty.call(LOGOS, k) ? LOGOS[k] : '';
  const quellen = art ? ['icons/gruppen/' + k + '.' + art, 'icons/logo.svg'] : [
    'icons/gruppen/' + k + '.svg',
    'icons/gruppen/' + k + '.png',
    'icons/logo.svg'
  ];
  let i = 0;
  const img = el('img', {
    class: klasse || 'gruppen-logo',
    alt: '',
    'aria-hidden': 'true'
  });
  img.addEventListener('error', function () {
    i += 1;
    if (i < quellen.length) img.src = quellen[i];
  });
  img.src = quellen[0];
  return img;
}
