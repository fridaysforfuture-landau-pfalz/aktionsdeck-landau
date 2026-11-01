// js/views/neue-gruppe.js
// Öffentliche Seite #/neue-gruppe (ohne Login), seit 1.1.1 (Schritt 13.2).
// Eine neue Gruppe beantragt hier ihren Bereich. Das Skript (Aktion „gruppeBeantragen“, apps-script/Antrag.gs)
// speichert den Antrag im Tab „Antraege“. Freigeschaltet wird er nur im Sheet (Schritt 13.3).
// Ablauf: Rechenaufgabe holen → Formular ausfüllen → schicken → Danke mit Signal-Knopf (die Gruppe meldet sich dort für den PIN).
// Keine Kontaktdaten im Formular. Das Feld „falle“ ist für Menschen unsichtbar und bleibt leer (Schutz gegen Roboter).

import { el, leeren, txt } from '../ui/dom.js';
import { balken } from '../ui/kopf.js';
import { api } from '../api.js';
import { signalKnoepfe } from '../ui/signal.js';

const UMLAUTE = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };

// Vorschlag für die Abkürzung: Anfangsbuchstaben der Wörter (bei einem Wort die ersten Buchstaben).
export function kurznameVorschlag(name) {
  const woerter = txt(name).toLowerCase()
    .replace(/[äöüß]/g, function (z) { return UMLAUTE[z]; })
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/).filter(Boolean);
  if (!woerter.length) return '';
  const k = woerter.length === 1 ? woerter[0].slice(0, 6) : woerter.map(function (w) { return w[0]; }).join('');
  return k.slice(0, 12);
}

// Dieselben Regeln wie im Skript (antragDaten), damit Fehler schon vor dem Schicken auffallen.
export function antragPruefen(d) {
  if (txt(d.name).length < 2) return 'Bitte gebt den Namen der Gruppe an.';
  if (txt(d.name).length > 60) return 'Der Name ist zu lang (höchstens 60 Zeichen).';
  if (!/^[a-z0-9]{2,12}$/.test(d.kurzname)) {
    return 'Die Abkürzung braucht 2 bis 12 Zeichen, nur kleine Buchstaben (ohne Umlaute) und Ziffern.';
  }
  if (/^g\d+$/.test(d.kurzname)) return 'Diese Abkürzung ist nicht erlaubt. Bitte wählt eine andere.';
  if (!/^#[0-9a-fA-F]{6}$/.test(d.farbe)) return 'Bitte wählt eine Farbe.';
  if (d.webseite && (!/^https:\/\/\S+$/i.test(d.webseite) || d.webseite.length > 200)) {
    return 'Die Webseite muss mit https:// beginnen.';
  }
  if (d.instagram && !/^https:\/\/\S+$/i.test(d.instagram) && !/^@?[A-Za-z0-9._]{1,30}$/.test(d.instagram)) {
    return 'Instagram bitte als Name (zum Beispiel @gruppe) oder als Link mit https:// angeben.';
  }
  return '';
}

function feld(id, label, eingabe, hinweis) {
  eingabe.id = id;
  const teile = [el('label', { class: 'formlabel', for: id, text: label }), eingabe];
  if (hinweis) {
    const h = el('span', { class: 'leise antrag-hinweis', id: id + '-hinweis', text: hinweis });
    eingabe.setAttribute('aria-describedby', h.id);
    teile.push(h);
  }
  return el('div', { class: 'formfeld' }, ...teile);
}

function zurueckLink() {
  return el('p', null, el('a', { href: '#/', text: '← Zur Gruppenwahl' }));
}

export function render(container) {
  leeren(container);
  const main = el('main', { class: 'start-seite antrag-seite' });
  container.append(balken(), main);

  const name = el('input', { class: 'feld', type: 'text', maxlength: '60', autocomplete: 'off', required: 'required' });
  const kurz = el('input', {
    class: 'feld', type: 'text', maxlength: '12', autocomplete: 'off', autocapitalize: 'none',
    spellcheck: 'false', required: 'required'
  });
  const farbe = el('input', { class: 'farbfeld', type: 'color', value: '#368469' });
  const webseite = el('input', { class: 'feld', type: 'url', inputmode: 'url', autocomplete: 'off', placeholder: 'https://' });
  const instagram = el('input', { class: 'feld', type: 'text', autocomplete: 'off', autocapitalize: 'none', placeholder: '@eure-gruppe' });
  const falle = el('input', { type: 'text', name: 'falle', tabindex: '-1', autocomplete: 'off' });
  const frage = el('p', { class: 'antrag-frage', id: 'antrag-frage', text: 'Rechenaufgabe lädt …' });
  const antwort = el('input', {
    class: 'feld antrag-antwort', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-labelledby': 'antrag-frage'
  });
  const meldung = el('p', { class: 'fehler', role: 'alert' });
  const senden = el('button', { class: 'knopf', type: 'submit', text: 'Antrag schicken', disabled: 'disabled' });

  // Die Abkürzung folgt dem Namen, bis jemand sie selbst ändert.
  let kurzSelbst = false;
  name.addEventListener('input', function () {
    if (!kurzSelbst) kurz.value = kurznameVorschlag(name.value);
  });
  kurz.addEventListener('input', function () {
    kurzSelbst = kurz.value !== '';
    const sauber = kurz.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sauber !== kurz.value) kurz.value = sauber;
  });

  let schluessel = '';
  async function neueAufgabe() {
    senden.disabled = true;
    antwort.value = '';
    frage.textContent = 'Rechenaufgabe lädt …';
    try {
      const d = await api('gruppeBeantragen', {});
      schluessel = d.schluessel;
      frage.textContent = 'Kurze Prüfung gegen Spam: Wie viel ist ' + d.aufgabe + '?';
      senden.disabled = false;
    } catch (e) {
      frage.textContent = 'Die Rechenaufgabe konnte nicht geladen werden.';
      meldung.textContent = e.message;
    }
  }

  function danke(gruppenName) {
    leeren(main);
    const signal = signalKnoepfe(el('p', { class: 'antrag-signal' }, document.createTextNode('[Signal]')));
    main.append(
      el('h1', { text: 'Danke für euren Antrag!' }),
      el('p', { text: 'Der Antrag für „' + gruppenName + '“ ist angekommen.' }),
      el('p', { text: 'Bitte schreibt uns jetzt kurz über Signal, wer ihr seid. Dann schalten wir eure Gruppe frei und geben euch den PIN auf einem sicheren Weg.' }),
      signal,
      el('p', { class: 'leise', text: 'Eure Gruppe erscheint auf der Startseite, sobald sie freigeschaltet ist.' }),
      zurueckLink()
    );
    const h1 = main.querySelector('h1');
    h1.setAttribute('tabindex', '-1');
    h1.classList.add('fokus-still');
    h1.focus();
  }

  const form = el('form', {
    class: 'formular antrag-form',
    novalidate: 'novalidate',
    onsubmit: async function (ev) {
      ev.preventDefault();
      meldung.textContent = '';
      const d = {
        name: txt(name.value).replace(/\s+/g, ' '),
        kurzname: txt(kurz.value).toLowerCase(),
        farbe: farbe.value,
        webseite: txt(webseite.value),
        instagram: txt(instagram.value)
      };
      const problem = antragPruefen(d);
      if (problem) { meldung.textContent = problem; return; }
      const zahl = antwort.value.trim();
      if (!/^\d{1,2}$/.test(zahl)) { meldung.textContent = 'Bitte das Ergebnis der Rechenaufgabe als Zahl eingeben.'; antwort.focus(); return; }

      senden.disabled = true;
      senden.textContent = 'Wird geschickt …';
      try {
        await api('gruppeBeantragen', Object.assign({ schluessel: schluessel, antwort: zahl, falle: falle.value }, d));
        danke(d.name);
      } catch (e) {
        meldung.textContent = e.message;
        senden.textContent = 'Antrag schicken';
        // Neue Aufgabe nur, wenn die alte nicht mehr gilt. Bei anderen Fehlern bleibt sie (sie gilt 10 Minuten).
        if (e.code === 'falsch' || e.code === 'abgelaufen' || /Rechenaufgabe/.test(e.message)) neueAufgabe();
        else senden.disabled = false;
      }
    }
  },
    feld('antrag-name', 'Name der Gruppe', name, 'So, wie er in der App stehen soll, zum Beispiel „Fridays for Future“.'),
    feld('antrag-kurz', 'Abkürzung für die Adresse', kurz, 'Nur kleine Buchstaben und Ziffern, 2 bis 12 Zeichen, zum Beispiel „fff“.'),
    feld('antrag-farbe', 'Farbe eurer Gruppe', farbe, 'Zum Beispiel aus eurem Logo.'),
    feld('antrag-webseite', 'Webseite (freiwillig)', webseite),
    feld('antrag-instagram', 'Instagram (freiwillig)', instagram),
    el('div', { class: 'antrag-falle', 'aria-hidden': 'true' },
      el('label', { text: 'Bitte leer lassen', for: 'antrag-falle' }), Object.assign(falle, { id: 'antrag-falle' })),
    el('div', { class: 'formfeld' }, frage, antwort),
    meldung,
    senden
  );

  main.append(
    el('h1', { text: 'Eigene Gruppe eröffnen' }),
    el('p', { text: 'Eure Klima-Gruppe aus Landau möchte das AktionsDeck nutzen? Füllt das Formular aus. Danach meldet ihr euch kurz über Signal bei uns, wir schalten eure Gruppe frei und geben euch den PIN.' }),
    el('p', { class: 'leise', text: 'Name, Farbe und Links sind später für alle sichtbar (Startseite und „Info“). Euer Logo könnt ihr uns über Signal schicken.' }),
    form,
    zurueckLink()
  );
  neueAufgabe();
}
