// js/views/login.js
// PIN eingeben (mit Auge zum Anzeigen). Das Skript prüft den PIN und gibt ein Token zurück.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { setSession, getSession } from '../store.js';
import { cacheLeeren } from '../cache.js';
import { balken } from '../ui/kopf.js';
import { gruppenLogo } from '../ui/logo.js';

const NS = 'http://www.w3.org/2000/svg';

// Auge (offen) oder durchgestrichenes Auge
function augenIcon(durchgestrichen) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', '24');
  s.setAttribute('height', '24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '2');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  const pfade = [
    'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z',
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
  ];
  if (durchgestrichen) pfade.push('M3 3l18 18');
  pfade.forEach(function (d) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    s.append(p);
  });
  return s;
}

export function render(container, ctx) {
  const g = ctx.gruppe;
  leeren(container);

  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const pin = el('input', {
    class: 'feld',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'PIN',
    'aria-label': 'PIN'
  });

  let sichtbar = false;
  const auge = el('button', { class: 'pin-auge', type: 'button' });
  function augeZeichnen() {
    leeren(auge);
    auge.append(augenIcon(sichtbar));
    auge.setAttribute('aria-label', sichtbar ? 'PIN verbergen' : 'PIN anzeigen');
    auge.setAttribute('aria-pressed', String(sichtbar));
    pin.type = sichtbar ? 'text' : 'password';
  }
  auge.addEventListener('click', function () {
    sichtbar = !sichtbar;
    augeZeichnen();
    pin.focus();
  });
  augeZeichnen();

  const knopf = el('button', { class: 'knopf', type: 'submit', text: 'Anmelden' });
  const formular = el('form', { class: 'login-form' },
    el('div', { class: 'pin-wrap' }, pin, auge),
    fehler,
    knopf
  );

  formular.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    fehler.textContent = '';
    if (!pin.value.trim()) {
      fehler.textContent = 'Bitte den PIN eingeben.';
      return;
    }
    knopf.disabled = true;
    knopf.textContent = 'Prüfe …';
    try {
      // Das Skript erwartet das Feld "gruppe" (gruppe_id oder kurzname)
      const daten = await api('login', { gruppe: g.gruppe_id, pin: pin.value });
      if (!daten || !daten.token) throw new Error('Keine Anmeldung erhalten.');
      // 12.4: Wechsel zu einer anderen Gruppe ohne Abmelden: Daten der alten Gruppe aus dem Gerät löschen
      const alt = getSession();
      if (alt && alt.gruppe_id !== g.gruppe_id) await cacheLeeren();
      setSession({
        token: daten.token,
        gruppe_id: g.gruppe_id,
        kurzname: g.kurzname,
        name: g.name,
        farbe: g.farbe || ''
      });
      ctx.neuLaden();
    } catch (e) {
      fehler.textContent = e.message;
      knopf.disabled = false;
      knopf.textContent = 'Anmelden';
    }
  });

  const zurueck = el('a', { href: '#/', text: '← Andere Gruppe' });
  container.append(
    balken(),
    el('div', { class: 'mitte' },
      el('div', { class: 'login-kopf' },
        gruppenLogo(g.kurzname, 'gruppen-logo'),
        el('h1', { text: g.name })
      ),
      el('p', { class: 'leise', text: 'Gib den PIN deiner Gruppe ein.' }),
      formular,
      el('p', null, zurueck)
    )
  );
  pin.focus();
}
