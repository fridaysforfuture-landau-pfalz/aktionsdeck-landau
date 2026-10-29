// js/ui/nav.js
// Reiter-Liste, Seitenleiste (PC), untere Leiste (Handy), Platz für Details rechts.

import { el } from './dom.js';
import { features } from '../config.js';
import { getName, getSession } from '../store.js';
import { cloudLinkSofort } from '../gruppeninfo.js';
import { gruppenLogo } from './logo.js';
import { darstellungSchalter } from './darstellung.js';

export const TABS = [
  { id: 'start', label: 'Start', icon: '🏠' },
  { id: 'projekte', label: 'Projekte', icon: '📁' },
  { id: 'todos', label: 'ToDos', icon: '✅' },
  { id: 'material', label: 'Material', icon: '📦' },
  { id: 'mobi', label: 'Mobi', icon: '📣' },
  { id: 'kalender', label: 'Kalender', icon: '📅' },
  { id: 'protokoll', label: 'Dokumentation', icon: '📝' },   // Protokolle und (ab 8.6) Reden
  { id: 'team', label: 'Team', icon: '👥' },                  // Etappe 9
  { id: 'wiki', label: 'Wiki', icon: '📖' },                  // Etappe 10, ersetzt „Hilfe“
  { id: 'cloud', label: 'Cloud', icon: '☁️' }                 // 11.3, nur mit Cloud-Link der Gruppe
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
  const s = getSession();
  return TABS.filter(function (t) {
    if (features[t.id] === false) return false;
    if (t.id === 'cloud') return !!(s && cloudLinkSofort(s.gruppe_id));
    return true;
  });
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
    href: basis + t.id,
    'data-tab': t.id
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

// Seit 0.34.7: Ist die Seitenleiste am PC zu niedrig für alle Reiter, rutschen die unteren Reiter
// in „Mehr ▾“ zum Ausklappen. Wird bei jeder Größenänderung des Fensters neu verteilt.
let verteileAktuell = null;
window.addEventListener('resize', function () { if (verteileAktuell) verteileAktuell(); });

function mehrAmPc(leiste, links, aktiv) {
  const innen = el('div', { class: 'nav-mehr-liste' });
  const kopf = el('summary', { class: 'nav-link' },
    el('span', { class: 'nav-icon', text: MEHR.icon, 'aria-hidden': 'true' }),
    el('span', { text: 'Mehr' }),
    el('span', { class: 'nav-mehr-pfeil', text: '▾', 'aria-hidden': 'true' })
  );
  const mehr = el('details', { class: 'nav-mehr', hidden: true }, kopf, innen);

  function verteile() {
    const offen = mehr.open;
    mehr.open = false;
    links.forEach(function (a) { mehr.before(a); });
    mehr.hidden = true;
    // Ohne Seitenleiste (Handy) ist die Höhe 0, dann bleibt alles, wie es ist
    for (let i = links.length - 1; i > 0 && leiste.clientHeight && leiste.scrollHeight > leiste.clientHeight; i--) {
      mehr.hidden = false;
      innen.prepend(links[i]);
    }
    const drin = links.some(function (a) { return a.parentNode === innen && a.dataset.tab === aktiv; });
    kopf.classList.toggle('aktiv', drin);
    mehr.open = offen && !mehr.hidden;
  }
  return { mehr: mehr, verteile: verteile };
}

// Baut das Gerüst. Gibt { inhalt, detail } zurück.
export function baueGeruest(container, ctx) {
  const basis = '#/g/' + encodeURIComponent(ctx.session.kurzname) + '/';
  const aktiv = ctx.tab;
  const tabs = sichtbareTabs();

  const links = tabs.map(function (t) { return eintrag('nav-link', basis, t, aktiv, ctx.neuLaden); });
  const seitenleiste = el('nav', { class: 'seitenleiste', 'aria-label': 'Hauptmenü' },
    el('div', { class: 'seiten-kopf' },
      gruppenLogo(ctx.session.kurzname, 'seiten-logo'),
      el('span', { text: String(ctx.session.kurzname).toUpperCase() })
    ),
    ...links,
    el('div', { class: 'seiten-fuss' },
      el('span', { class: 'leise', text: 'Angemeldet als ' + (getName() || 'unbekannt') }),
      el('div', { class: 'seiten-fuss-knoepfe' },
        el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Name ändern', onclick: ctx.nameAendern }),
        el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abmelden', onclick: ctx.abmelden })
      ),
      darstellungSchalter(ctx.neuLaden),
      oeffentlicheLinks()
    )
  );

  const mehrAktiv = UNTEN.indexOf(aktiv) < 0 ? 'mehr' : '';
  const untenleiste = el('nav', { class: 'untenleiste', 'aria-label': 'Hauptmenü' },
    ...tabs.filter(function (t) { return UNTEN.indexOf(t.id) >= 0; })
      .map(function (t) { return eintrag('nav-unten', basis, t, aktiv, ctx.neuLaden); }),
    eintrag('nav-unten', basis, MEHR, mehrAktiv, aktiv === 'mehr' ? ctx.neuLaden : null)
  );

  const inhalt = el('main', { class: 'inhalt fokus-still', id: 'inhalt', tabindex: '-1' });
  // Seit 0.34.8: Sprung-Link als erster Tab-Stopp (nur sichtbar mit Fokus). Kein normaler Link, weil # die Adresse ändern würde.
  const sprung = el('a', { class: 'sprung-link', href: '#inhalt', text: 'Zum Inhalt springen' });
  sprung.addEventListener('click', function (ev) {
    ev.preventDefault();
    inhalt.focus();
  });
  const detail = el('aside', { class: 'detail', id: 'detail', 'aria-label': 'Details' });

  const mehr = mehrAmPc(seitenleiste, links, aktiv);
  links[links.length - 1].after(mehr.mehr);

  container.textContent = '';
  container.append(el('div', { class: 'huelle' }, sprung, seitenleiste, inhalt, detail, untenleiste));
  verteileAktuell = mehr.verteile;
  mehr.verteile();
  return { inhalt: inhalt, detail: detail };
}
