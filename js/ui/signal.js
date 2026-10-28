// js/ui/signal.js
// Signal-Knopf für die festen Texte (texte/*.txt), seit 0.33.11 (Schritt 11.9).
// Steht in einem festen Text „[Signal]“, wird daraus ein Knopf „Auf Signal schreiben“.
// Vor dem Weiterleiten kommt eine kleine Rechenaufgabe (Schutz gegen Spam ohne fremde Dienste).
// Nur für die festen Texte benutzen, nie für Wiki-Seiten aus dem Sheet (dort soll niemand Knöpfe einbauen).
//
// signalKnoepfe(knoten) -> knoten (ersetzt jedes „[Signal]“ in den Texten darin durch den Knopf)

import { el } from './dom.js';
import { zeigeFenster } from './fenster.js';

const SIGNAL_LINK = 'https://signal.me/#eu/KEAKlX0-V163iWsZZ_FFJ2OsAWkHPi6WsMyNmbxz6LQ9tM3DfhtLVLKMiygSiPun';
const MARKE = '[Signal]';

function zufall(von, bis) {
  return von + Math.floor(Math.random() * (bis - von + 1));
}

function aufgabeZeigen() {
  let a = 0;
  let b = 0;
  let fenster = null;
  const frage = el('p', { class: 'signal-frage' });
  const eingabe = el('input', {
    class: 'feld', type: 'text', inputmode: 'numeric', autocomplete: 'off',
    'aria-label': 'Ergebnis'
  });
  const meldung = el('p', { class: 'fehler', role: 'alert' });

  function neueAufgabe() {
    a = zufall(2, 9);
    b = zufall(2, 9);
    frage.textContent = 'Wie viel ist ' + a + ' + ' + b + '?';
    eingabe.value = '';
  }

  const form = el('form', {
    class: 'signal-form',
    onsubmit: function (ev) {
      ev.preventDefault();
      if (eingabe.value.trim() === String(a + b)) {
        window.open(SIGNAL_LINK, '_blank', 'noopener');
        fenster.schliessen();
        return;
      }
      meldung.textContent = 'Leider falsch. Hier ist eine neue Aufgabe.';
      neueAufgabe();
      eingabe.focus();
    }
  },
    el('p', { class: 'leise', text: 'Kurze Prüfung gegen Spam. Danach öffnet sich Signal.' }),
    frage,
    eingabe,
    meldung,
    el('button', { class: 'knopf', type: 'submit', text: 'Weiter zu Signal' })
  );
  neueAufgabe();
  fenster = zeigeFenster('Auf Signal schreiben', form, null, { aussenKlick: true });
  eingabe.focus();
}

function knopf() {
  return el('button', {
    class: 'knopf knopf-hell signal-knopf', type: 'button', text: '💬 Auf Signal schreiben',
    onclick: aufgabeZeigen
  });
}

export function signalKnoepfe(knoten) {
  const gefunden = [];
  const gang = document.createTreeWalker(knoten, NodeFilter.SHOW_TEXT);
  while (gang.nextNode()) {
    if (gang.currentNode.nodeValue.indexOf(MARKE) !== -1) gefunden.push(gang.currentNode);
  }
  gefunden.forEach(function (t) {
    const teile = t.nodeValue.split(MARKE);
    const neu = [];
    teile.forEach(function (s, i) {
      if (i > 0) neu.push(knopf());
      if (s) neu.push(document.createTextNode(s));
    });
    t.replaceWith(...neu);
  });
  return knoten;
}
