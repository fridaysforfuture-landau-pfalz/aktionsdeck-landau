// js/views/material-vormerken.js
// Fenster "Für Projekt vormerken": Projekt wählen, je Material eine Anzahl.
// Speichert in den Tab Projekt_Material. Es wird nichts ausgeliehen.

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';
import { xKnopf } from '../ui/fenster.js';

function zuZahl(t) {
  const s = String(t).trim().replace(',', '.');
  if (s === '') return 0;
  const n = Number(s);
  return isNaN(n) ? NaN : n;
}

// opt: { ctx, token, items (aus mitVerfuegbar), onFertig() }
export async function zeigeVormerkDialog(opt) {
  let projekte;
  let vorgemerkt;

  async function holen() {
    const r = await Promise.all([
      api('list', { tabelle: 'Projekte' }, opt.token),
      api('list', { tabelle: 'Projekt_Material' }, opt.token)
    ]);
    projekte = r[0].zeilen.filter(function (p) {
      return p.status !== 'erledigt' && p.status !== 'archiviert';
    }).sort(function (a, b) {
      return String(a.titel).localeCompare(String(b.titel), 'de');
    });
    vorgemerkt = r[1].zeilen;
  }

  try {
    await holen();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    toast(e.message);
    return;
  }
  if (!projekte.length) {
    toast('Es gibt noch kein offenes Projekt. Lege zuerst im Reiter Projekte eins an.');
    return;
  }

  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const wahl = el('select', { class: 'feld', 'aria-label': 'Projekt' });
  projekte.forEach(function (p) {
    wahl.append(el('option', { value: String(p.id), text: String(p.titel) }));
  });
  
  // Aus einem Projekt heraus aufgerufen: Projekt ist fest vorgegeben
  if (opt.projektId) {
    wahl.value = String(opt.projektId);
    wahl.disabled = true;
  }
  
  function bestehend(materialId) {
    return vorgemerkt.find(function (v) {
      return String(v.projekt_id) === wahl.value && String(v.material_id) === String(materialId);
    }) || null;
  }

  const reihen = opt.items.map(function (z) {
    const feld = el('input', {
      class: 'feld mengen-feld', type: 'text', inputmode: 'decimal',
      'aria-label': 'Anzahl ' + String(z.name)
    });
    const einheit = z.einheit ? ' ' + z.einheit : '';
    const verf = z._verfuegbar === '' ? '' : 'Verfügbar jetzt: ' + z._verfuegbar + einheit;
    const hinweis = el('span', { class: 'leise' });
    const zeile = el('div', { class: 'buch-zeile' },
      el('div', { class: 'buch-text' },
        el('strong', { text: String(z.name) }),
        el('span', { class: 'leise', text: verf }),
        hinweis
      ),
      el('div', { class: 'buch-felder' },
        el('label', { class: 'buch-feld' }, el('span', { class: 'leise', text: 'Anzahl' }), feld)
      )
    );
    return { z: z, feld: feld, hinweis: hinweis, zeile: zeile, b: null };
  });

  // Vorbelegung je nach Projekt: schon Vorgemerktes wird angezeigt
  function belegen() {
    reihen.forEach(function (r) {
      r.b = bestehend(r.z.id);
      r.feld.value = r.b ? String(r.b.menge) : '1';
      r.hinweis.textContent = r.b
        ? 'Schon vorgemerkt: ' + r.b.menge + ' (wird ersetzt)'
        : 'Noch nicht vorgemerkt';
    });
  }
  wahl.addEventListener('change', belegen);
  belegen();

  const ok = el('button', { class: 'knopf', type: 'submit', text: 'Vormerken' });
  const abbrechen = el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen' });
  const form = el('form', { class: 'formular', novalidate: '' },
    el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Projekt *' }), wahl),
    el('div', { class: 'buch-liste' }, ...reihen.map(function (r) { return r.zeile; })),
    fehler,
    el('div', { class: 'form-knoepfe' }, ok, abbrechen)
  );
  const hintergrund = el('div', { class: 'modal' },
    el('div', { class: 'modal-box modal-gross', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Für Projekt vormerken' },
      el('h2', { text: 'Für Projekt vormerken' }),
      el('p', {
        class: 'leise',
        text: 'Das ist nur eine Planung. Ausgeliehen wird später im Projekt. Anzahl 0 oder leer lässt das Material aus.'
      }),
      form
    )
  );

  function zu() { hintergrund.remove(); }
  hintergrund.firstChild.append(xKnopf(zu));
  abbrechen.addEventListener('click', zu);
  hintergrund.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') zu(); });

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    fehler.textContent = '';
    const neu = [];
    const aend = [];
    for (let i = 0; i < reihen.length; i++) {
      const r = reihen[i];
      const n = zuZahl(r.feld.value);
      if (isNaN(n) || n < 0) {
        fehler.textContent = '„' + String(r.z.name) + '“: Die Anzahl muss eine Zahl sein.';
        r.feld.focus();
        return;
      }
      if (n === 0) continue;
      if (r.b) {
        if (Number(r.b.menge) !== n) aend.push({ b: r.b, n: n });
      } else {
        neu.push({
          projekt_id: wahl.value,
          material_id: r.z.id,
          name: String(r.z.name),
          kategorie: String(r.z.kategorie || ''),
          menge: n,
          beschaffung: 'vorhanden'
        });
      }
    }
    if (!neu.length && !aend.length) {
      zu();
      toast('Nichts geändert.');
      return;
    }

    ok.disabled = true;
    ok.textContent = 'Speichere …';
    try {
      for (let i = 0; i < aend.length; i++) {
        await api('update', {
          tabelle: 'Projekt_Material', id: aend[i].b.id,
          daten: { menge: aend[i].n }, bekannt: aend[i].b.geaendert_am
        }, opt.token);
      }
      if (neu.length) {
        await api('batchCreate', { tabelle: 'Projekt_Material', liste: neu }, opt.token);
      }
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) { zu(); return; }
      let text = e.message;
      try {
        await holen();
        belegen();
        text += ' Die Anzeige ist jetzt aktuell, bitte prüfen und noch einmal drücken.';
      } catch (x) { /* ignorieren */ }
      fehler.textContent = text;
      ok.disabled = false;
      ok.textContent = 'Vormerken';
      return;
    }
    zu();
    const k = neu.length + aend.length;
    toast((k === 1 ? '1 Material' : k + ' Materialien') + ' vorgemerkt.');
    await opt.onFertig();
  });

  document.body.append(hintergrund);
  wahl.focus();
}
