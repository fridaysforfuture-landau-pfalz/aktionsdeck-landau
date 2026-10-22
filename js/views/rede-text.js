// js/views/rede-text.js
// Redetext im Detail einer Rede mit Kommentaren zu einzelnen Absätzen (Etappe 8, Schritt 8.8).
// Absätze trennt eine Leerzeile. Neben jedem Absatz steht „💬 Kommentieren“.
// Ein Kommentar speichert in Kommentare.stelle "Nummer|Anfang des Absatzes" (die ersten 60 Zeichen).
// Ändert sich der Text später, sucht die App den Absatz über den Anfang. Findet sie ihn nicht,
// steht der Kommentar unten bei „Kommentare zu geänderten Stellen“ mit dem alten Anfang als Zitat.
//
// baueRedeText(opt) -> Element
// opt: { ctx, token, rede, kommentare (alle geladenen Kommentare), nachAenderung() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function zeitKurz(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// Text in Absätze teilen (Leerzeile = neuer Absatz)
export function absaetze(text) {
  return String(text || '').split(/\r?\n[ \t]*\r?\n/)
    .map(function (a) { return a.replace(/^\s+|\s+$/g, ''); })
    .filter(Boolean);
}

function anfang(absatz) {
  return String(absatz || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export function stelleText(nr, absatz) {
  return String(nr) + '|' + anfang(absatz);
}

export function stelleLesen(s) {
  const t = txt(s);
  const i = t.indexOf('|');
  if (i < 0) return { nr: Number(t) || 0, anfang: '' };
  return { nr: Number(t.slice(0, i)) || 0, anfang: t.slice(i + 1).trim() };
}

// Kommentare den Absätzen zuordnen: { proAbsatz: [[...], ...], verschoben: [...] }
export function kommentareZuordnen(liste, teile) {
  const anf = teile.map(anfang);
  const proAbsatz = teile.map(function () { return []; });
  const verschoben = [];
  liste.forEach(function (k) {
    const st = stelleLesen(k.stelle);
    let i = st.nr - 1;
    if (!(i >= 0 && i < teile.length && (!st.anfang || anf[i] === st.anfang))) {
      i = st.anfang ? anf.indexOf(st.anfang) : -1;
    }
    if (i >= 0) proAbsatz[i].push(k);
    else verschoben.push(k);
  });
  return { proAbsatz: proAbsatz, verschoben: verschoben };
}

export function baueRedeText(opt) {
  const r = opt.rede;
  const teile = absaetze(r.text);
  const eigene = (opt.kommentare || []).filter(function (k) {
    return txt(k.bezug_art) === 'rede' && txt(k.bezug_id) === String(r.id) && txt(k.stelle);
  }).sort(function (a, b) { return String(a.erstellt_am).localeCompare(String(b.erstellt_am)); });
  const zu = kommentareZuordnen(eigene, teile);

  async function loeschen(k) {
    if (!window.confirm('Diesen Kommentar wirklich löschen?')) return;
    try {
      await api('delete', { tabelle: 'Kommentare', id: k.id, bekannt: k.geaendert_am }, opt.token);
      toast('Gelöscht.');
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      toast(e.code === 'konflikt' ? 'Jemand anderes hat dies gerade geändert.' : e.message);
    }
    if (opt.nachAenderung) await opt.nachAenderung();
  }

  function kommentarListe(liste, mitZitat) {
    return el('ul', { class: 'kommentar-liste' }, ...liste.map(function (k) {
      const kopf = [txt(k.erstellt_von), zeitKurz(k.erstellt_am)].filter(Boolean).join(' · ');
      const zitat = mitZitat ? stelleLesen(k.stelle).anfang : '';
      return el('li', { class: 'kommentar' },
        el('span', { class: 'leise', text: kopf }),
        zitat ? el('span', { class: 'leise rede-zitat', text: '„' + zitat + ' …“' }) : null,
        el('span', { class: 'notiz', text: txt(k.text) }),
        el('div', { class: 'hut-knoepfe' }, el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(k); }
        }))
      );
    }));
  }

  function schreibForm(nr, absatz, platz, knopf) {
    const feld = el('textarea', {
      class: 'feld', rows: '2', maxlength: '1000',
      placeholder: 'Anmerkung zu diesem Absatz …', 'aria-label': 'Kommentar zu Absatz ' + nr
    });
    const fehler = el('p', { class: 'fehler', role: 'alert' });
    const senden = el('button', { class: 'knopf', type: 'submit', text: 'Senden' });
    const form = el('form', { class: 'kommentar-form', novalidate: '' }, feld, senden);
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      fehler.textContent = '';
      const t = feld.value.trim();
      if (!t) { fehler.textContent = 'Bitte einen Text schreiben.'; return; }
      senden.disabled = true;
      try {
        await api('create', {
          tabelle: 'Kommentare',
          daten: {
            projekt_id: txt(r.projekt_id), bezug_art: 'rede', bezug_id: String(r.id),
            text: t, stelle: stelleText(nr, absatz)
          }
        }, opt.token);
      } catch (e) {
        senden.disabled = false;
        if (opt.ctx.behandleFehler(e)) return;
        fehler.textContent = e.message;
        return;
      }
      toast('Kommentar gespeichert.');
      if (opt.nachAenderung) await opt.nachAenderung();
    });
    platz.append(form, fehler);
    knopf.setAttribute('aria-expanded', 'true');
    feld.focus();
  }

  const box = el('div', { class: 'rede-text' }, el('h3', { class: 'teil-titel-klein', text: 'Redetext' }));
  if (!teile.length) {
    box.append(el('p', { class: 'leise', text: 'Noch kein Redetext. Mit „Bearbeiten“ kannst du ihn eintragen.' }));
  }
  teile.forEach(function (absatz, i) {
    const nr = i + 1;
    const liste = zu.proAbsatz[i];
    const platz = el('div', { class: 'rede-absatz-form' });
    const knopf = el('button', {
      class: 'knopf knopf-hell knopf-klein rede-absatz-knopf', type: 'button',
      text: liste.length ? '💬 ' + liste.length + ' · Kommentieren' : '💬 Kommentieren',
      'aria-expanded': 'false',
      onclick: function () {
        if (platz.firstChild) {
          platz.textContent = '';
          knopf.setAttribute('aria-expanded', 'false');
        } else {
          schreibForm(nr, absatz, platz, knopf);
        }
      }
    });
    box.append(el('div', { class: 'rede-absatz' + (liste.length ? ' rede-absatz-mit' : '') },
      el('p', { class: 'notiz rede-absatz-text', text: absatz }),
      el('div', { class: 'rede-absatz-aktion' }, knopf),
      liste.length ? kommentarListe(liste, false) : null,
      platz
    ));
  });
  if (zu.verschoben.length) {
    box.append(
      el('h4', { class: 'rede-verschoben', text: 'Kommentare zu geänderten Stellen' }),
      el('p', { class: 'leise', text: 'Diese Absätze gibt es so nicht mehr. Das Zitat zeigt, wie sie anfingen.' }),
      kommentarListe(zu.verschoben, true)
    );
  }
  return box;
}
