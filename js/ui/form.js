// js/ui/form.js
// Baut ein Formular aus einer Feldliste (siehe js/schema.js).
// Texte kommen nur über textContent (dom.js), nie über innerHTML.
// Bei Auswahlfeldern darf "optionen" Texte oder { wert, label } enthalten.
// Datumsfelder: Ein Klick auf das ganze Feld öffnet den Kalender.

import { el } from './dom.js';
import { istFalsch } from '../schema.js';

function zahlOk(t) {
  const s = String(t).trim().replace(',', '.');
  return s === '' || !isNaN(Number(s));
}

function text(w) {
  return w === undefined || w === null ? '' : String(w);
}

// Foto-Knopf unter dem Feld: wählt ein Bild, lädt es hoch und trägt die ID ins Feld ein.
function fotoBereich(feld, fotoFn) {
  const meldung = el('p', { class: 'leise' });
  const datei = el('input', { type: 'file', accept: 'image/*', hidden: '' });
  const knopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Foto aufnehmen / auswählen',
    onclick: function () { datei.click(); }
  });
  datei.addEventListener('change', async function () {
    const f = datei.files && datei.files[0];
    if (!f) return;
    feld.setAttribute('data-laedt', '1');
    knopf.disabled = true;
    meldung.className = 'leise';
    meldung.textContent = 'Foto wird hochgeladen …';
    try {
      feld.value = await fotoFn(f);
      meldung.textContent = 'Foto hochgeladen. Bitte noch speichern.';
    } catch (e) {
      meldung.className = 'fehler';
      meldung.textContent = e.message;
    }
    feld.removeAttribute('data-laedt');
    knopf.disabled = false;
    datei.value = '';
  });
  return el('div', { class: 'foto-upload' },
    knopf, datei, meldung,
    el('p', { class: 'leise', text: 'Bitte keine Personen fotografieren.' })
  );
}

// Baut ein einzelnes Eingabefeld. Gibt { feld, extra, zusatz, lesen } zurück.
function eingabe(f, wert, vorschlaege, fotoFn) {
  if (f.typ === 'bool') {
    const cb = el('input', { type: 'checkbox', name: f.name });
    cb.checked = wert === undefined || wert === null ? true : !istFalsch(wert);
    return { feld: cb, lesen: function () { return cb.checked; } };
  }
  if (f.typ === 'farbe') {
    const gesetzt = /^#[0-9a-fA-F]{6}$/.test(text(wert).trim());
    const cs = getComputedStyle(document.documentElement).getPropertyValue('--gruppe').trim();
    const gruppe = /^#[0-9a-fA-F]{6}$/.test(cs) ? cs : '#368469';
    const fa = el('input', { class: 'farbfeld', type: 'color', name: f.name });
    fa.value = gesetzt ? text(wert).trim() : gruppe;
    if (!gesetzt) fa.setAttribute('data-leer', '1');
    const hinweis = el('span', { class: 'leise' });
    function hinweisZeigen() {
      hinweis.textContent = fa.hasAttribute('data-leer') ? 'Es gilt die Gruppenfarbe.' : '';
    }
    hinweisZeigen();
    fa.addEventListener('input', function () {
      fa.removeAttribute('data-leer');
      hinweisZeigen();
    });
    const zurueck = el('button', {
      class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Gruppenfarbe',
      onclick: function () {
        fa.value = gruppe;
        fa.setAttribute('data-leer', '1');
        hinweisZeigen();
      }
    });
    return {
      feld: fa,
      zusatz: el('div', { class: 'farb-zusatz' }, zurueck, hinweis),
      lesen: function () { return fa.hasAttribute('data-leer') ? '' : fa.value.toLowerCase(); }
    };
  }
  
  let feld;
  let extra = null;
  let zusatz = null;
  if (f.typ === 'langtext') {
    // f.max: eigene Höchstlänge (zum Beispiel Protokolltext), sonst 5000 wie im Skript
    feld = el('textarea', { class: 'feld', name: f.name, rows: '4', maxlength: String(f.max || 5000) });
  } else if (f.typ === 'auswahl') {
    feld = el('select', { class: 'feld', name: f.name });
    feld.append(el('option', { value: '', text: '–' }));
    (f.optionen || []).forEach(function (o) {
      const objekt = o !== null && typeof o === 'object';
      feld.append(el('option', {
        value: objekt ? o.wert : o,
        text: objekt ? o.label : o
      }));
    });
  } else if (f.typ === 'datum') {
    feld = el('input', { class: 'feld', type: 'date', name: f.name });
    // Ganzes Feld öffnet den Kalender. Geht es nicht, bleibt das Mini-Symbol als Rückfall.
    feld.addEventListener('click', function () {
      try {
        if (typeof feld.showPicker === 'function') feld.showPicker();
      } catch (e) { /* ignorieren */ }
    });
  } else if (f.typ === 'zeit') {
    feld = el('input', { class: 'feld', type: 'time', name: f.name });
    feld.addEventListener('click', function () {
      try {
        if (typeof feld.showPicker === 'function') feld.showPicker();
      } catch (e) { /* ignorieren */ }
    });
  } else {
    feld = el('input', { class: 'feld', type: 'text', name: f.name, maxlength: '200' });
    if (f.typ === 'zahl') feld.setAttribute('inputmode', 'decimal');
    if (f.typ === 'foto') {
      feld.setAttribute('placeholder', 'Link oder ID aus Google Drive');
      if (fotoFn) zusatz = fotoBereich(feld, fotoFn);
    }
    if (vorschlaege && vorschlaege.length) {
      const id = 'vorschlag-' + f.name;
      feld.setAttribute('list', id);
      extra = el('datalist', { id: id });
      // Ein Vorschlag ist Text oder { wert, label } (seit 0.31.6: Team-Namen mit Gruppen-Rollen in der Beschriftung,
      // ins Feld kommt nur der Wert)
      vorschlaege.slice(0, 30).forEach(function (v) {
        if (v && typeof v === 'object') {
          extra.append(el('option', { value: String(v.wert).slice(0, 60), label: String(v.label || v.wert).slice(0, 80) }));
        } else {
          extra.append(el('option', { value: String(v).slice(0, 40) }));
        }
      });
    }
  }
  feld.value = text(wert);
  return { feld: feld, extra: extra, zusatz: zusatz, lesen: function () { return feld.value; } };
}

// felder: Liste aus schema.js, start: vorhandene Werte (oder {})
// opt: { speichernText, vorschlaege: {feldname:[...]}, fotoUpload(datei) -> Promise<foto_id>,
//        onSpeichern(daten) -> Promise, onAbbrechen() }
// Wirft onSpeichern einen Fehler, steht dessen Text im Formular.
export function baueFormular(felder, start, opt) {
  const werte = start || {};
  const o = opt || {};
  const fehler = el('p', { class: 'fehler', role: 'alert' });

  const eingaben = felder.map(function (f) {
    return Object.assign(
      { f: f },
      eingabe(f, werte[f.name], (o.vorschlaege || {})[f.name], o.fotoUpload)
    );
  });

  const label = o.speichernText || 'Speichern';
  const knopf = el('button', { class: 'knopf', type: 'submit', text: label });
  const knoepfe = el('div', { class: 'form-knoepfe' }, knopf);
  if (o.onAbbrechen) {
    knoepfe.append(el('button', {
      class: 'knopf knopf-hell',
      type: 'button',
      text: 'Abbrechen',
      onclick: o.onAbbrechen
    }));
  }

  const formular = el('form', { class: 'formular', novalidate: '' });
  eingaben.forEach(function (e) {
    const f = e.f;
    if (f.typ === 'bool') {
      formular.append(el('label', { class: 'formfeld-bool' }, e.feld, el('span', { text: f.label })));
    } else {
      formular.append(el('label', { class: 'formfeld' },
        el('span', { class: 'formlabel', text: f.label + (f.pflicht ? ' *' : '') }),
        e.feld,
        e.extra
      ));
      if (e.zusatz) formular.append(e.zusatz);
    }
  });
  formular.append(fehler, knoepfe);

  formular.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    fehler.textContent = '';
    if (formular.querySelector('[data-laedt]')) {
      fehler.textContent = 'Das Foto wird noch hochgeladen. Bitte kurz warten.';
      return;
    }
    const daten = {};
    for (let i = 0; i < eingaben.length; i++) {
      const f = eingaben[i].f;
      let w = eingaben[i].lesen();
      if (typeof w === 'string') w = w.trim();
      if (f.pflicht && w === '') {
        fehler.textContent = '„' + f.label + '“ darf nicht leer sein.';
        eingaben[i].feld.focus();
        return;
      }
      if (f.typ === 'zahl' && !zahlOk(w)) {
        fehler.textContent = '„' + f.label + '“ muss eine Zahl sein.';
        eingaben[i].feld.focus();
        return;
      }
      daten[f.name] = w;
    }
    knopf.disabled = true;
    knopf.textContent = 'Speichere …';
    try {
      await o.onSpeichern(daten);
    } catch (e) {
      fehler.textContent = e.message;
      knopf.disabled = false;
      knopf.textContent = label;
    }
  });

  return formular;
}
