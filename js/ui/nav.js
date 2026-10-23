// js/ui/nav.js
// Reiter-Liste, Seitenleiste (PC), untere Leiste (Handy), Platz für Details rechts.

import { el } from './dom.js';
import { features } from '../config.js';
import { getName } from '../store.js';
import { gruppenLogo } from './logo.js';

export const TABS = [
  { id: 'start', label: 'Start', icon: '🏠' },
  { id: 'projekte', label: 'Projekte', icon: '📁' },
  { id: 'todos', label: 'ToDos', icon: '✅' },
  { id: 'material', label: 'Material', icon: '📦' },
  { id: 'mobi', label: 'Mobi', icon: '📣' },
  { id: 'kalender', label: 'Kalender', icon: '📅' },
  { id: 'protokoll', label: 'Dokumentation', icon: '📝' },   // Protokolle und (ab 8.6) Reden
  { id: 'team', label: 'Team', icon: '👥' },                  // Etappe 9
  { id: 'wiki', label: 'Wiki', icon: '📖' }                   // Etappe 10, ersetzt „Hilfe“
];

// Öffentliche Seiten (ohne Login): Reihenfolge wie auf der Startseite
export const OEFFENTLICH = [
  { id: 'impressum', label: 'Impressum' },
  { id: 'info', label: 'Info' },
  { id: 'datenschutz', label: 'Datenschutz' }
];

const MEHR = { id: 'mehr', label: 'Mehr', icon: '⋯' };
const UNTEN = ['start', 'projekte', 'todos', 'mobi'];

export function sichtbareTabs() {
  return TABS.filter(function (t) { return features[t.id] !== false; });
}

export function tabLabel(id) {
  if (id === 'mehr') return 'Mehr';
  const t = TABS.find(function (x) { return x.id === id; });
  return t ? t.label : id;
}

// Kleine Links zu den öffentlichen Seiten (seit 0.32.6 auch das öffentliche Wiki)
export function oeffentlicheLinks() {
  return el('div', { class: 'oeff-links' },
    ...OEFFENTLICH.map(function (o) {
      return el('a', { href: '#/info/' + o.id, text: o.label });
    }),
    el('a', { href: '#/wiki', text: 'Wiki' })
  );
}

function eintrag(klasse, basis, t, aktiv, beiAktiv) {
  const a = el('a', {
    class: klasse + (t.id === aktiv ? ' aktiv' : ''),
    href: basis + t.id
  },
    el('span', { class: 'nav-icon', text: t.icon, 'aria-hidden': 'true' }),
    el('span', { text: t.label })
  );
  if (t.id === aktiv) a.setAttribute('aria-current', 'page');
  // Klick auf den schon offenen Reiter: Ansicht neu aufbauen (verlässt z. B. das Archiv)
  if (t.id === aktiv && beiAktiv) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      beiAktiv();
    });
  }
  return a;
}

// Baut das Gerüst. Gibt { inhalt, detail } zurück.
export function baueGeruest(container, ctx) {
  const basis = '#/g/' + encodeURIComponent(ctx.session.kurzname) + '/';
  const aktiv = ctx.tab;
  const tabs = sichtbareTabs();

  const seitenleiste = el('nav', { class: 'seitenleiste', 'aria-label': 'Hauptmenü' },
    el('div', { class: 'seiten-kopf' },
      gruppenLogo(ctx.session.kurzname, 'seiten-logo'),
      el('span', { text: String(ctx.session.kurzname).toUpperCase() })
    ),
    ...tabs.map(function (t) { return eintrag('nav-link', basis, t, aktiv, ctx.neuLaden); }),
    el('div', { class: 'seiten-fuss' },
      el('span', { class: 'leise', text: 'Angemeldet als ' + (getName() || 'unbekannt') }),
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Name ändern', onclick: ctx.nameAendern }),
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abmelden', onclick: ctx.abmelden }),
      oeffentlicheLinks()
    )
  );

  const mehrAktiv = UNTEN.indexOf(aktiv) < 0 ? 'mehr' : '';
  const untenleiste = el('nav', { class: 'untenleiste', 'aria-label': 'Hauptmenü' },
    ...tabs.filter(function (t) { return UNTEN.indexOf(t.id) >= 0; })
      .map(function (t) { return eintrag('nav-unten', basis, t, aktiv, ctx.neuLaden); }),
    eintrag('nav-unten', basis, MEHR, mehrAktiv, aktiv === 'mehr' ? ctx.neuLaden : null)
  );

  const inhalt = el('main', { class: 'inhalt', id: 'inhalt' });
  const detail = el('aside', { class: 'detail', id: 'detail', 'aria-label': 'Details' });

  container.textContent = '';
  container.append(el('div', { class: 'huelle' }, seitenleiste, inhalt, detail, untenleiste));
  return { inhalt: inhalt, detail: detail };
}
