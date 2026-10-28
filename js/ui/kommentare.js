// js/ui/kommentare.js
// Kommentare zu einem Eintrag (ToDo, später Mobi u. a.) oder die Pinnwand auf dem Start.
// Tab Kommentare: projekt_id (freiwillig), bezug_art, bezug_id, text.
// opt: { ctx, token, art ('todo' | 'pinnwand' | ...), bezugId, projektId, titel,
//        platzhalter, leerText, neuesteZuerst (Formular steht dann oben), max,
//        ohneStelle (nur Kommentare ohne Absatz-Stelle, für Reden seit 0.30.12) }
// Gibt { el, laden } zurück. Das Element lädt seine Kommentare selbst.

import { el, leeren } from './dom.js';
import { api } from '../api.js';
import { toast } from './toast.js';
import { istWahr } from '../schema.js';
import { schriftfarbe } from '../views/kalender-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function farbeOk(f) {
  return /^#[0-9a-fA-F]{6}$/.test(txt(f));
}

function zeitKurz(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

export function baueKommentare(opt) {
  const art = opt.art;
  const bezug = txt(opt.bezugId);
  let zeilen = [];
  let laedt = true;
  let fehlerText = '';

  const liste = el('ul', { class: 'kommentar-liste' });
  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const feld = el('textarea', {
    class: 'feld',
    rows: '2',
    maxlength: '1000',
    placeholder: opt.platzhalter || 'Kommentar schreiben …',
    'aria-label': 'Kommentar'
  });
  const senden = el('button', { class: 'knopf', type: 'submit', text: 'Senden' });
  const form = el('form', { class: 'kommentar-form', novalidate: '' }, feld, senden);

  function zeichne() {
    leeren(liste);
    if (laedt) {
      liste.append(el('li', { class: 'leise', text: 'Lade Kommentare …' }));
      return;
    }
    if (fehlerText) {
      liste.append(el('li', { class: 'fehler', text: fehlerText }));
      return;
    }
    if (!zeilen.length) {
      liste.append(el('li', { class: 'leise', text: opt.leerText || 'Noch keine Kommentare.' }));
      return;
    }
    zeilen.forEach(function (k) {
      const kopf = [
        txt(k.erstellt_von),
        zeitKurz(k.erstellt_am),
        opt.alsMitteilung && istWahr(k.angeheftet) ? '📌 schon als Mitteilung' : ''
      ].filter(Boolean).join(' · ');
      const knoepfe = el('div', { class: 'hut-knoepfe' });
      // Nur wenn der Aufrufer es erlaubt (Pinnwand auf dem Start)
      if (opt.alsMitteilung) {
        knoepfe.append(el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Als Mitteilung anheften',
          onclick: function () { opt.alsMitteilung(k); }
        }));
      }
      knoepfe.append(el('button', {
        class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(k); }
      }));
      const li = el('li', { class: 'kommentar' + (farbeOk(k.farbe) ? ' kommentar-ver' : '') },
        el('span', { class: 'leise', text: kopf }),
        el('span', { class: 'notiz', text: txt(k.text) }),
        knoepfe
      );
      if (farbeOk(k.farbe)) {
        li.style.background = txt(k.farbe);
        li.style.color = schriftfarbe(txt(k.farbe));
      }
      liste.append(li);
    });
  }

  async function laden() {
    try {
      // 12.6: opt.holeZeilen (freiwillig) liefert die Zeilen aus einer laufenden Sammel-Anfrage; null = selbst laden
      const vorhanden = opt.holeZeilen ? opt.holeZeilen() : null;
      const zeilenAlle = vorhanden ? await vorhanden : (await api('list', { tabelle: 'Kommentare' }, opt.token)).zeilen;
      const passend = zeilenAlle.filter(function (k) {
        if (txt(k.bezug_art) !== art || txt(k.bezug_id) !== bezug) return false;
        // Kommentare zu einem Absatz stehen beim Absatz (js/views/rede-text.js)
        if (opt.ohneStelle && txt(k.stelle)) return false;
        // Veranstaltung (hat Farbe), die schon als Mitteilung hängt: nicht doppelt auf der Pinnwand
        if (art === 'pinnwand' && farbeOk(k.farbe) && istWahr(k.angeheftet)) return false;
        return true;
      }).sort(function (a, b) {
        return String(a.erstellt_am).localeCompare(String(b.erstellt_am));
      });
      zeilen = opt.neuesteZuerst ? passend.reverse() : passend;
      if (opt.max && zeilen.length > opt.max) zeilen = zeilen.slice(0, opt.max);
      fehlerText = '';
      laedt = false;
      zeichne();
    } catch (e) {
      laedt = false;
      if (opt.ctx.behandleFehler(e)) return;
      fehlerText = 'Kommentare konnten nicht geladen werden: ' + e.message;
      zeichne();
    }
  }
  
  async function loeschen(k) {
    if (!window.confirm('Diesen Kommentar wirklich löschen?')) return;
    try {
      await api('delete', { tabelle: 'Kommentare', id: k.id, bekannt: k.geaendert_am }, opt.token);
      toast('Gelöscht.');
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      toast(e.code === 'konflikt' ? 'Jemand anderes hat dies gerade geändert.' : e.message);
    }
    await laden();
    if (opt.beiAenderung) opt.beiAenderung();
  }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    fehler.textContent = '';
    const t = feld.value.trim();
    if (!t) {
      fehler.textContent = 'Bitte einen Text schreiben.';
      return;
    }
    senden.disabled = true;
    try {
      await api('create', {
        tabelle: 'Kommentare',
        daten: { projekt_id: txt(opt.projektId), bezug_art: art, bezug_id: bezug, text: t }
      }, opt.token);
      feld.value = '';
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      fehler.textContent = e.message;
      senden.disabled = false;
      return;
    }
    senden.disabled = false;
    await laden();
    if (opt.beiAenderung) opt.beiAenderung();
  });
  
  const box = el('div', { class: 'kommentare' }, el('h3', { text: opt.titel || 'Kommentare' }));
  if (opt.neuesteZuerst) box.append(form, fehler, liste);
  else box.append(liste, form, fehler);

  zeichne();
  laden();
  return { el: box, laden: laden };
}
