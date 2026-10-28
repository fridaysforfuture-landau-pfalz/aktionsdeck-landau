// js/ui/druck.js
// Druckblatt (11.6): baut ein schlichtes Blatt (schwarz auf weiß, mit Kästchen) und öffnet den Druckdialog.
// Beim Drucken ist dann nur dieses Blatt zu sehen (css/components.css, Block 0.33.6). Auch „Als PDF speichern“ geht so.
//
// blatt: { titel, unterzeile, abschnitte: [{ titel, zeilen: [{ text, info, fertig }] }] }
// fertig = true druckt ein angekreuztes Kästchen (☑), sonst ein leeres (☐).

import { el } from './dom.js';

export function drucke(blatt) {
  const alt = document.getElementById('druckblatt');
  if (alt) alt.remove();

  const box = el('div', { id: 'druckblatt', class: 'druckblatt' },
    el('h1', { text: String(blatt.titel || '') }),
    blatt.unterzeile ? el('p', { class: 'druck-unter', text: String(blatt.unterzeile) }) : null
  );
  (blatt.abschnitte || []).forEach(function (a) {
    if (!a.zeilen || !a.zeilen.length) return;
    if (a.titel) box.append(el('h2', { text: String(a.titel) }));
    box.append(el('ul', { class: 'druck-liste' }, ...a.zeilen.map(function (z) {
      return el('li', { class: z.fertig ? 'fertig' : '' },
        el('span', { class: 'druck-box', 'aria-hidden': 'true', text: z.fertig ? '☑' : '☐' }),
        el('span', { class: 'druck-text' },
          el('strong', { text: String(z.text || '') }),
          z.info ? el('span', { class: 'druck-info', text: String(z.info) }) : null
        )
      );
    })));
  });
  box.append(el('p', {
    class: 'druck-fuss',
    text: 'Gedruckt am ' + new Date().toLocaleDateString('de-DE') + ' · AktionsDeck Landau'
  }));

  document.body.append(box);
  document.body.classList.add('druckt');
  function fertig() {
    window.removeEventListener('afterprint', fertig);
    document.body.classList.remove('druckt');
    box.remove();
  }
  window.addEventListener('afterprint', fertig);
  window.print();
}
