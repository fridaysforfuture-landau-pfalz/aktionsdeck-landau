// js/views/termine.js
// Öffentliche Seite #/termine (ohne Login): alle kommenden öffentlichen Termine, nach Monaten,
// mit Auswahl der Gruppe und der Adresse zum Abonnieren.

import { el, leeren } from '../ui/dom.js';
import { balken } from '../ui/kopf.js';
import { getSession } from '../store.js';
import { MONATE } from './kalender-rechnen.js';
import { ladeOeffentlich, terminKarte, abonnierLink } from './termine-liste.js';

export async function render(container, ctx) {
  leeren(container);
  let alle = [];

  const status = el('p', { class: 'leise', text: 'Lade Termine …' });
  const wahl = el('select', { class: 'feld', 'aria-label': 'Gruppe' });
  const liste = el('div');
  const aboLink = el('a', {
    class: 'knopf knopf-hell', target: '_blank', rel: 'noopener noreferrer',
    text: 'Kalender-Datei öffnen'
  });
  const aboUrl = el('span', { class: 'leise oeff-url' });

  const s = getSession();
  const zurueck = s
    ? el('a', { href: '#/g/' + encodeURIComponent(s.kurzname) + '/start', text: '← Zurück zur App' })
    : el('a', { href: '#/', text: '← Zur Gruppenwahl' });

  container.append(
    balken(),
    el('div', { class: 'start-seite' },
      el('h1', { text: 'Öffentliche Termine' }),
      el('p', {
        class: 'leise',
        text: 'Veranstaltungen der Klima-Gruppen in Landau. Diese Seite ist ohne Anmeldung sichtbar.'
      }),
      wahl,
      status,
      liste,
      el('section', { class: 'karte' },
        el('h2', { text: 'Im eigenen Kalender abonnieren' }),
        el('p', {
          class: 'leise',
          text: 'Diese Adresse in Google Kalender, Outlook oder den Handy-Kalender kopieren ' +
            '(„Kalender per URL hinzufügen“). Neue Termine erscheinen dann von selbst.'
        }),
        aboUrl,
        el('p', null, aboLink)
      ),
      el('p', null, zurueck)
    )
  );

  function aboZeigen() {
    const url = abonnierLink(wahl.value);
    aboLink.href = url;
    aboUrl.textContent = url;
  }

  function wahlAufbauen() {
    const alt = wahl.value;
    const gruppen = [];
    alle.forEach(function (t) {
      if (t.kurz && !gruppen.some(function (g) { return g.kurz === t.kurz; })) {
        gruppen.push({ kurz: t.kurz, name: t.gruppe });
      }
    });
    gruppen.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    leeren(wahl);
    wahl.append(el('option', { value: '', text: 'Alle Gruppen' }));
    gruppen.forEach(function (g) {
      wahl.append(el('option', { value: g.kurz, text: g.name }));
    });
    wahl.value = gruppen.some(function (g) { return g.kurz === alt; }) ? alt : '';
    wahl.hidden = gruppen.length < 2;
  }

  function zeichne() {
    const k = wahl.value;
    const zeilen = alle.filter(function (t) { return !k || t.kurz === k; });
    leeren(liste);
    if (!zeilen.length) {
      liste.append(el('p', {
        class: 'leise', text: 'Zurzeit sind keine öffentlichen Termine eingetragen.'
      }));
    }
    let monat = '';
    let ul = null;
    zeilen.forEach(function (t) {
      const m = MONATE[Number(t.von.slice(5, 7)) - 1] + ' ' + t.von.slice(0, 4);
      if (m !== monat) {
        monat = m;
        liste.append(el('h2', { class: 'teil-titel-klein', text: m }));
        ul = el('ul', { class: 'oeff-liste oeff-gross' });
        liste.append(ul);
      }
      ul.append(el('li', null, terminKarte(t, false)));
    });
    aboZeigen();
  }

  function zeigen(daten, meta) {
    if (!container.contains(liste)) return;   // Seite wurde inzwischen gewechselt
    alle = daten;
    wahlAufbauen();
    zeichne();
    status.className = 'leise';
    status.textContent = alle.length + (alle.length === 1 ? ' kommender Termin' : ' kommende Termine') +
      (meta.aktuell ? '' : ' · Zwischengespeichert, aktualisiere …');
  }

  wahl.addEventListener('change', zeichne);
  aboZeigen();

  try {
    const ok = await ladeOeffentlich(zeigen);
    if (!ok && container.contains(liste)) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
    }
  } catch (e) {
    if (!container.contains(liste)) return;
    status.className = 'fehler';
    status.textContent = 'Die Termine konnten nicht geladen werden: ' + e.message;
  }
}
