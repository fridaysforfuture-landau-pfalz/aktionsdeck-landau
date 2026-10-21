// js/ui/fenster.js
// Kleines Fenster (Modal) mit Titel und beliebigem Inhalt. Schließen: Esc oder von außen.
// Gibt { schliessen } zurück. beiZu wird beim Schließen einmal aufgerufen.

import { el } from './dom.js';
// ✕-Knopf oben rechts. Wird auch von anderen Fenstern benutzt (modal.js, material-buchen.js ...).
export function xKnopf(beiKlick) {
  return el('button', {
    class: 'fenster-x', type: 'button', 'aria-label': 'Fenster schließen', title: 'Schließen',
    text: '✕',
    onclick: function () { beiKlick(); }
  });
}

export function zeigeFenster(titel, inhalt, beiZu, optionen) {
  const vorher = document.activeElement;
  const hintergrund = el('div', { class: 'modal' });
  let offen = true;

  function taste(ev) {
    if (ev.key === 'Escape') zu();
  }

  function zu() {
    if (!offen) return;
    offen = false;
    document.removeEventListener('keydown', taste);
    hintergrund.remove();
    if (vorher && vorher.focus) vorher.focus();
    if (beiZu) beiZu();
  }

  const box = el('div', {
    class: 'modal-box modal-gross',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': titel
  },
    el('h2', { text: titel }),
    inhalt
  );
  hintergrund.append(box);
  box.append(xKnopf(zu));
  if (optionen && optionen.aussenKlick) {
    hintergrund.addEventListener('click', function (ev) {
      if (ev.target === hintergrund) zu();
    });
  }
  document.addEventListener('keydown', taste);
  document.body.append(hintergrund);

  const erstes = box.querySelector('input, textarea, select, button');
  if (erstes) erstes.focus();

  return { schliessen: zu };
}
