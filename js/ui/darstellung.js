// js/ui/darstellung.js
// Dunkelmodus (11.8): Klasse „dunkel“ am <html>, Farbe der Browserleiste, Schalter „Gerät | ○ | ●“ (Wie das Gerät, Hell, Dunkel).
// Die dunklen Farben stehen in css/components.css (Block 0.33.8). Die Einstellung steht in js/store.js.
// Der Schalter steht am Handy in „Mehr“ und am PC unten in der Seitenleiste.

import { el } from './dom.js';
import { getDarstellung, setDarstellung } from '../store.js';

const LEISTE_HELL = '#368469';
const LEISTE_DUNKEL = '#0b0f0e';

// 11.8a: „Gerät“ als Wort, Hell und Dunkel nur als weißer und schwarzer Punkt (Name für Vorlesen und Hinweis beim Zeigen)
const WAHLEN = [
  { wert: 'geraet', text: 'Gerät', name: 'Wie das Gerät' },
  { wert: 'hell', punkt: 'hell', name: 'Hell' },
  { wert: 'dunkel', punkt: 'dunkel', name: 'Dunkel' }
];

function geraetDunkel() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function istDunkel() {
  const w = getDarstellung();
  return w === 'dunkel' || (w === 'geraet' && geraetDunkel());
}

export function darstellungAnwenden() {
  const dunkel = istDunkel();
  document.documentElement.classList.toggle('dunkel', dunkel);
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', dunkel ? LEISTE_DUNKEL : LEISTE_HELL);
  return dunkel;
}

// Stellt das Gerät um (zum Beispiel abends automatisch), folgt die App, solange „Wie das Gerät“ gewählt ist.
export function darstellungBeobachten(beiWechsel) {
  if (!window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const f = function () {
    if (getDarstellung() !== 'geraet') return;
    darstellungAnwenden();
    if (beiWechsel) beiWechsel();
  };
  if (mq.addEventListener) mq.addEventListener('change', f);
  else if (mq.addListener) mq.addListener(f);
}

// beiWechsel: baut die Seite neu auf (manche Farben rechnet die App selbst, zum Beispiel Deadline-Kästen)
export function darstellungSchalter(beiWechsel) {
  const jetzt = getDarstellung();
  return el('div', { class: 'darstellung' },
    el('span', { class: 'leise', text: 'Darstellung' }),
    el('div', { class: 'darstellung-knoepfe', role: 'group', 'aria-label': 'Darstellung' },
      ...WAHLEN.map(function (w) {
        return el('button', {
          class: 'darstellung-knopf' + (w.punkt ? ' darstellung-punkt' : ''), type: 'button',
          'aria-label': w.name, title: w.name,
          'aria-pressed': w.wert === jetzt ? 'true' : 'false',
          onclick: function () {
            setDarstellung(w.wert);
            darstellungAnwenden();
            if (beiWechsel) beiWechsel();
          }
        }, w.punkt
          ? el('span', { class: 'punkt-' + w.punkt, 'aria-hidden': 'true' })
          : el('span', { text: w.text }));
      })
    )
  );
}
