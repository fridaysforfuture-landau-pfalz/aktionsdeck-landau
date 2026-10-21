// js/ui/modal.js
// Kleines Fenster "Wer bist du?". Gibt den Namen zurück (oder null bei Abbrechen).

import { el } from './dom.js';
import { xKnopf } from './fenster.js';

export function frageName(aktuell, darfAbbrechen) {
  return new Promise(function (resolve) {
    const fehler = el('p', { class: 'fehler', role: 'alert' });
    const feld = el('input', {
      class: 'feld',
      type: 'text',
      maxlength: '60',
      placeholder: 'Dein Name oder Spitzname',
      'aria-label': 'Dein Name',
      autocomplete: 'nickname'
    });
    feld.value = aktuell || '';

    const knoepfe = el('div', { class: 'modal-knoepfe' },
      el('button', { class: 'knopf', type: 'submit', text: 'Speichern' })
    );
    const formular = el('form', { class: 'login-form' }, feld, fehler, knoepfe);
    const box = el('div', {
      class: 'modal-box',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Wer bist du?'
    },
      el('h2', { text: 'Wer bist du?' }),
      el('p', {
        class: 'leise',
        text: 'Dein Name steht im Änderungsprotokoll deiner Gruppe. Auf diesem Gerät wird er gemerkt.'
      }),
      formular
    );
    const hintergrund = el('div', { class: 'modal' }, box);

    function zu(wert) {
      hintergrund.remove();
      resolve(wert);
    }

    if (darfAbbrechen) {
      knoepfe.append(el('button', {
        class: 'knopf knopf-hell',
        type: 'button',
        text: 'Abbrechen',
        onclick: function () { zu(null); }
      }));
      box.append(xKnopf(function () { zu(null); }));
    }

    formular.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const n = feld.value.trim();
      if (n.length < 2) {
        fehler.textContent = 'Bitte mindestens 2 Zeichen.';
        return;
      }
      zu(n.slice(0, 60));
    });

    document.body.append(hintergrund);
    feld.focus();
  });
}
