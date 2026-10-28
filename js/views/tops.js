// js/views/tops.js
// TOP-Sammlung (8.3a): Jede Person trägt Tagesordnungspunkte fürs nächste Plenum ein.
// Steht im Reiter „Dokumentation“ (statt der Filter) und als Kachel „TOPs“ auf dem Start.
// Tab TOPs: titel, notiz, protokoll_id. Offen = ohne protokoll_id. Wird ein TOP in einem gespeicherten
// Protokoll benutzt, setzt das Formular protokoll_id (dann steht er hier nicht mehr).
// Klick auf einen TOP = bearbeiten (im selben Eingabefeld), „+“ = speichern.
//
// opt: { ctx, token, holeTops() -> Liste aller TOPs, neuLaden() -> Promise, fehlerText() -> '' oder Grund }

import { el, leeren, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';

// Knopf „+ Protokoll“ auf dem Start (8.4a): Wunsch merken, der Reiter Dokumentation öffnet dann das Formular
let protokollWunsch = false;
export function setzeProtokollWunsch() { protokollWunsch = true; }
export function nimmProtokollWunsch() {
  const w = protokollWunsch;
  protokollWunsch = false;
  return w;
}

// Offene TOPs, älteste zuerst (Reihenfolge des Eintragens)
export function offeneTops(liste) {
  return (liste || []).filter(function (t) { return !txt(t.protokoll_id) && txt(t.titel); })
    .sort(function (a, b) { return txt(a.erstellt_am).localeCompare(txt(b.erstellt_am)); });
}

export function baueTopSammlung(opt) {
  let bearbeitet = null;   // TOP, der gerade im Feld steht
  let laeuft = false;

  const liste = el('div', { class: 'pk-chips top-liste' });
  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const feld = el('input', {
    class: 'feld', type: 'text', maxlength: '200', placeholder: 'Neuer TOP …', 'aria-label': 'TOP'
  });
  const plus = el('button', { class: 'knopf', type: 'button', text: '+', 'aria-label': 'TOP speichern', title: 'TOP speichern' });
  const loeschen = el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Löschen' });
  const abbrechen = el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen' });
  const zeile = el('div', { class: 'top-eingabe' }, feld, plus, loeschen, abbrechen);
  const box = el('div', { class: 'top-sammlung' }, liste, zeile, fehler);

  function modus(t) {
    bearbeitet = t;
    feld.value = t ? txt(t.titel) : '';
    plus.textContent = t ? 'Speichern' : '+';
    plus.setAttribute('aria-label', t ? 'Änderung speichern' : 'TOP speichern');
    loeschen.hidden = !t;
    abbrechen.hidden = !t;
    fehler.textContent = '';
    if (t) feld.focus();
    zeichne();
  }

  function zeichne() {
    leeren(liste);
    const grund = opt.fehlerText ? opt.fehlerText() : '';
    if (grund) {
      liste.append(el('p', { class: 'leise', text: grund }));
      zeile.hidden = true;
      return;
    }
    zeile.hidden = false;
    const offen = offeneTops(opt.holeTops());
    if (!offen.length) {
      liste.append(el('p', { class: 'leise', text: 'Noch keine TOPs. Trag hier ein, was beim nächsten Plenum besprochen werden soll.' }));
    }
    offen.forEach(function (t) {
      const an = bearbeitet && String(bearbeitet.id) === String(t.id);
      liste.append(el('button', {
        class: 'pk-chip' + (an ? ' pk-chip-an' : ''), type: 'button',
        title: 'Eingetragen von ' + (txt(t.erstellt_von) || 'unbekannt') + '. Klick = bearbeiten',
        text: txt(t.titel),
        onclick: function () { modus(an ? null : t); }
      }));
    });
  }

  async function ausfuehren(fn, meldung) {
    if (laeuft) return;
    laeuft = true;
    plus.disabled = true;
    fehler.textContent = '';
    try {
      await fn();
      if (meldung) toast(meldung);
      bearbeitet = null;
      modus(null);
      await opt.neuLaden();
    } catch (e) {
      if (!opt.ctx.behandleFehler(e)) {
        fehler.textContent = e.code === 'konflikt'
          ? 'Jemand anderes hat diesen TOP gerade geändert. Bitte „Abbrechen“ und neu wählen.'
          : e.message;
        if (e.code === 'konflikt' || e.code === 'nicht_gefunden') opt.neuLaden();
      }
    }
    laeuft = false;
    plus.disabled = false;
  }

  function speichern() {
    const titel = txt(feld.value);
    if (!titel) {
      fehler.textContent = 'Bitte einen TOP eintragen.';
      feld.focus();
      return;
    }
    const t = bearbeitet;
    if (!t) {
      ausfuehren(function () {
        return api('create', { tabelle: 'TOPs', daten: { titel: titel } }, opt.token);
      }, 'TOP gespeichert.');
    } else {
      ausfuehren(function () {
        return api('update', { tabelle: 'TOPs', id: t.id, daten: { titel: titel }, bekannt: t.geaendert_am }, opt.token);
      }, 'TOP geändert.');
    }
  }

  plus.addEventListener('click', speichern);
  feld.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); speichern(); }
    if (ev.key === 'Escape' && bearbeitet) { ev.preventDefault(); modus(null); }
  });
  abbrechen.addEventListener('click', function () { modus(null); });
  loeschen.addEventListener('click', function () {
    const t = bearbeitet;
    if (!t || !window.confirm('Den TOP „' + txt(t.titel) + '“ löschen?')) return;
    ausfuehren(function () {
      return api('delete', { tabelle: 'TOPs', id: t.id, bekannt: t.geaendert_am }, opt.token);
    }, 'TOP gelöscht.');
  });

  modus(null);
  return { el: box, zeichne: zeichne };
}
