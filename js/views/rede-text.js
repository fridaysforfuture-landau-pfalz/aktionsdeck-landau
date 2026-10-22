// js/views/rede-text.js
// Redetext im Formular „Rede bearbeiten“ mit Kommentaren zu einzelnen Absätzen (Etappe 8, Schritt 8.8).
// Jeder Absatz ist ein eigenes Textfeld. Eine Leerzeile in einem Feld macht beim Speichern einen neuen Absatz.
// Am PC stehen die Kommentare rechts neben ihrem Absatz, am Handy darunter. „💬 Kommentieren“ je Absatz.
// Ein Kommentar speichert in Kommentare.stelle "Nummer|Anfang des Absatzes" (die ersten 60 Zeichen).
// Ändert sich der Text, sucht die App den Absatz über den Anfang. Findet sie ihn nicht, steht der Kommentar
// unten bei „Kommentare zu geänderten Stellen“ mit dem alten Anfang als Zitat.
// Kommentieren geht erst, wenn die Rede angelegt ist.
//
// baueRedeText(opt) -> { el, wert() }
// opt: { ctx, token, rede (null = neu), text (Starttext), kommentare (alle geladenen Kommentare),
//        beiKommentar() (nach neuem oder gelöschtem Kommentar, freiwillig) }

import { el, leeren } from '../ui/dom.js';
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

// Kommentare den Absätzen zuordnen. anfaenge: je Absatz eine Liste erlaubter Anfänge
// (zum Beispiel gespeicherter und gerade getippter Text). Ergebnis: { proAbsatz: [[...], ...], verschoben: [...] }
export function kommentareZuordnen(liste, anfaenge) {
  const proAbsatz = anfaenge.map(function () { return []; });
  const verschoben = [];
  liste.forEach(function (k) {
    const st = stelleLesen(k.stelle);
    let i = st.nr - 1;
    if (!(i >= 0 && i < anfaenge.length && (!st.anfang || anfaenge[i].indexOf(st.anfang) >= 0))) {
      i = -1;
      if (st.anfang) {
        for (let j = 0; j < anfaenge.length; j++) {
          if (anfaenge[j].indexOf(st.anfang) >= 0) { i = j; break; }
        }
      }
    }
    if (i >= 0) proAbsatz[i].push(k);
    else verschoben.push(k);
  });
  return { proAbsatz: proAbsatz, verschoben: verschoben };
}

// Textfeld wächst mit dem Text
function hoeheAnpassen(feld) {
  feld.style.height = 'auto';
  feld.style.height = Math.max(feld.scrollHeight + 2, 48) + 'px';
}

export function baueRedeText(opt) {
  const r = opt.rede || null;
  const mitKommentaren = !!(r && r.id);
  let kommentare = (opt.kommentare || []).slice();
  const box = el('div', { class: 'rede-text' + (mitKommentaren ? ' rede-text-mit' : '') });
  const unten = el('div', { class: 'rede-verschoben-box' });
  const reihen = [];   // { feld, orig, spalte }

  function eigene() {
    return kommentare.filter(function (k) {
      return r && txt(k.bezug_art) === 'rede' && txt(k.bezug_id) === String(r.id) && txt(k.stelle);
    }).sort(function (a, b) { return String(a.erstellt_am).localeCompare(String(b.erstellt_am)); });
  }

  async function neuLaden() {
    try {
      const res = await api('list', { tabelle: 'Kommentare' }, opt.token);
      kommentare = res.zeilen || [];
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      toast('Kommentare konnten nicht geladen werden: ' + e.message);
    }
    kommentareZeichnen();
    if (opt.beiKommentar) opt.beiKommentar();
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
    await neuLaden();
  }

  function kommentarBlock(k, mitZitat) {
    const kopf = [txt(k.erstellt_von), zeitKurz(k.erstellt_am)].filter(Boolean).join(' · ');
    const zitat = mitZitat ? stelleLesen(k.stelle).anfang : '';
    return el('li', { class: 'kommentar rede-kommentar' },
      el('span', { class: 'leise', text: kopf }),
      zitat ? el('span', { class: 'leise rede-zitat', text: '„' + zitat + ' …“' }) : null,
      el('span', { class: 'notiz', text: txt(k.text) }),
      el('div', { class: 'hut-knoepfe' }, el('button', {
        class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(k); }
      }))
    );
  }

  // Schreibfeld für einen Kommentar (kein eigenes <form>: steht im Reden-Formular)
  function schreiben(nr, reihe, platz) {
    leeren(platz);
    const feld = el('textarea', {
      class: 'feld', rows: '2', maxlength: '1000',
      placeholder: 'Anmerkung zu diesem Absatz …', 'aria-label': 'Kommentar zu Absatz ' + nr
    });
    const fehler = el('p', { class: 'fehler', role: 'alert' });
    const senden = el('button', { class: 'knopf knopf-klein', type: 'button', text: 'Senden' });
    const weg = el('button', {
      class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Abbrechen',
      onclick: function () { leeren(platz); }
    });
    senden.addEventListener('click', async function () {
      fehler.textContent = '';
      const t = feld.value.trim();
      if (!t) { fehler.textContent = 'Bitte einen Text schreiben.'; return; }
      senden.disabled = true;
      try {
        await api('create', {
          tabelle: 'Kommentare',
          daten: {
            projekt_id: txt(r.projekt_id), bezug_art: 'rede', bezug_id: String(r.id),
            text: t, stelle: stelleText(nr, reihe.feld.value || reihe.orig)
          }
        }, opt.token);
      } catch (e) {
        senden.disabled = false;
        if (opt.ctx.behandleFehler(e)) return;
        fehler.textContent = e.message;
        return;
      }
      toast('Kommentar gespeichert.');
      await neuLaden();
    });
    platz.append(feld, el('div', { class: 'hut-knoepfe' }, senden, weg), fehler);
    feld.focus();
  }

  function kommentareZeichnen() {
    if (!mitKommentaren) return;
    const zu = kommentareZuordnen(eigene(), reihen.map(function (x) {
      return [anfang(x.orig), anfang(x.feld.value)];
    }));
    reihen.forEach(function (reihe, i) {
      const liste = zu.proAbsatz[i];
      const platz = el('div', { class: 'rede-schreibplatz' });
      leeren(reihe.spalte);
      reihe.zeile.classList.toggle('rede-reihe-mit', liste.length > 0);
      if (liste.length) {
        reihe.spalte.append(el('ul', { class: 'kommentar-liste' }, ...liste.map(function (k) { return kommentarBlock(k, false); })));
      }
      reihe.spalte.append(
        el('button', {
          class: 'knopf knopf-hell knopf-klein rede-absatz-knopf', type: 'button',
          text: liste.length ? '💬 ' + liste.length + ' · Kommentieren' : '💬 Kommentieren',
          onclick: function () { schreiben(i + 1, reihe, platz); }
        }),
        platz
      );
    });
    leeren(unten);
    if (zu.verschoben.length) {
      unten.append(
        el('h4', { class: 'rede-verschoben', text: 'Kommentare zu geänderten Stellen' }),
        el('p', { class: 'leise', text: 'Diese Absätze gibt es so nicht mehr. Das Zitat zeigt, wie sie anfingen.' }),
        el('ul', { class: 'kommentar-liste' }, ...zu.verschoben.map(function (k) { return kommentarBlock(k, true); }))
      );
    }
  }

  const teile = absaetze(opt.text);
  (teile.length ? teile : ['']).forEach(function (absatz, i) {
    const feld = el('textarea', {
      class: 'feld rede-absatz-feld', rows: '3', maxlength: '20000', 'aria-label': 'Absatz ' + (i + 1),
      placeholder: i === 0 && !teile.length
        ? 'Schreib hier deine Rede. Eine Leerzeile trennt die Absätze. Nach dem Speichern kann die Gruppe jeden Absatz kommentieren.'
        : ''
    });
    feld.value = absatz;
    feld.addEventListener('input', function () { hoeheAnpassen(feld); });
    const spalte = el('div', { class: 'rede-kommentar-spalte' });
    const zeile = el('div', { class: 'rede-reihe' }, feld, mitKommentaren ? spalte : null);
    reihen.push({ feld: feld, orig: absatz, spalte: spalte, zeile: zeile });
    box.append(zeile);
  });
  box.append(unten);
  if (!mitKommentaren) {
    box.append(el('p', { class: 'leise pk-hinweis', text: 'Kommentieren geht, sobald die Rede angelegt ist.' }));
  }
  kommentareZeichnen();
  // Höhe erst setzen, wenn die Felder auf der Seite sind
  setTimeout(function () { reihen.forEach(function (x) { hoeheAnpassen(x.feld); }); }, 0);

  return {
    el: box,
    // Alle Absätze zusammen (Leerzeile dazwischen)
    wert: function () {
      return reihen.map(function (x) { return x.feld.value.replace(/^\s+|\s+$/g, ''); })
        .filter(Boolean).join('\n\n');
    },
    hoehen: function () { reihen.forEach(function (x) { hoeheAnpassen(x.feld); }); }
  };
}
