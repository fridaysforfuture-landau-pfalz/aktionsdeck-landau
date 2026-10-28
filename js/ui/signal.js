// js/ui/signal.js
// Signal-Knopf für die festen Texte (texte/*.txt), seit 0.33.11 (Schritt 11.9).
// Steht in einem festen Text „[Signal]“, wird daraus ein Knopf „Auf Signal schreiben“.
// Vor dem Weiterleiten kommt eine kleine Rechenaufgabe (Schutz gegen Spam ohne fremde Dienste).
// Seit 0.33.13 (Schritt 11.11): Aufgabe und Link kommen vom Skript (Aktion „signal“, ohne Login).
// Der Link steht als Skripteigenschaft SIGNAL_LINK im Google-Skript, nicht mehr hier im Code.
// Nur für die festen Texte benutzen, nie für Wiki-Seiten aus dem Sheet (dort soll niemand Knöpfe einbauen).
//
// signalKnoepfe(knoten) -> knoten (ersetzt jedes „[Signal]“ in den Texten darin durch den Knopf)

import { el, leeren } from './dom.js';
import { zeigeFenster } from './fenster.js';
import { api } from '../api.js';
import { sichereUrl } from '../views/kalender-rechnen.js';

const MARKE = '[Signal]';

function aufgabeZeigen() {
  let schluessel = '';
  let fenster = null;
  const frage = el('p', { class: 'signal-frage', text: 'Lädt …' });
  const eingabe = el('input', {
    class: 'feld', type: 'text', inputmode: 'numeric', autocomplete: 'off',
    'aria-label': 'Ergebnis'
  });
  const meldung = el('p', { class: 'fehler', role: 'alert' });
  const senden = el('button', { class: 'knopf', type: 'submit', text: 'Prüfen' });

  async function neueAufgabe() {
    senden.disabled = true;
    eingabe.value = '';
    try {
      const d = await api('signal', {});
      schluessel = d.schluessel;
      frage.textContent = 'Wie viel ist ' + d.aufgabe + '?';
      senden.disabled = false;
      eingabe.focus();
    } catch (e) {
      frage.textContent = '';
      meldung.textContent = e.message;
    }
  }

  // Der Link kommt erst nach einer Antwort vom Server. Ein Fenster, das erst danach aufgeht,
  // blockieren manche Handys. Darum erscheint ein Knopf, den man selbst antippt.
  function linkZeigen(link) {
    leeren(form);
    form.append(
      el('p', { text: 'Richtig! Tippe auf den Knopf, dann öffnet sich Signal.' }),
      el('a', {
        class: 'knopf', href: link, target: '_blank', rel: 'noopener noreferrer',
        text: '💬 Signal öffnen',
        onclick: function () { fenster.schliessen(); }
      })
    );
    form.querySelector('a').focus();
  }

  const form = el('form', {
    class: 'signal-form',
    onsubmit: async function (ev) {
      ev.preventDefault();
      const antwort = eingabe.value.trim();
      if (!/^\d{1,2}$/.test(antwort)) {
        meldung.textContent = 'Bitte eine Zahl eingeben.';
        return;
      }
      senden.disabled = true;
      meldung.textContent = '';
      try {
        const d = await api('signal', { schluessel: schluessel, antwort: antwort });
        const link = sichereUrl(d && d.link);
        if (!link) throw new Error('Der Signal-Link ist ungültig.');
        linkZeigen(link);
      } catch (e) {
        meldung.textContent = e.message;
        if (e.code === 'falsch' || e.code === 'abgelaufen' || e.code === 'ungueltig') neueAufgabe();
        else senden.disabled = false;
      }
    }
  },
    el('p', { class: 'leise', text: 'Kurze Prüfung gegen Spam. Danach öffnet sich Signal.' }),
    frage,
    eingabe,
    meldung,
    senden
  );
  fenster = zeigeFenster('Auf Signal schreiben', form, null, { aussenKlick: true });
  neueAufgabe();
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
