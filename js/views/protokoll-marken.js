// js/views/protokoll-marken.js
// Markierungen im Protokolltext (Etappe 8, Schritt 8.4), eingebaut im Formular (protokoll-eintrag.js):
// - Knopfreihe ☐ ToDo · 💡 Learning · 📅 Termin · 📌 Mitteilung · 📊 Umfrage · 👉 Beschluss · + Einfügen.
//   Jeder Knopf öffnet ein kleines Formular unter der Reihe und fügt danach die fertige Zeile an der Cursorstelle ein.
// - Tastenkürzel am PC: Strg+Alt+T (ToDo), L (Learning), V (Termin), M (Mitteilung), U (Umfrage), B (Beschluss).
// - „@“ im Text: Namensauswahl unter dem Feld.
// - „+ Einfügen“: neueste Mitteilungen und Pinnwand-Kommentare mit Quelle einfügen.
// - Übersicht unter dem Feld: welche Markierungen erkannt wurden und welche Zeilen nicht lesbar sind.
// Gelesen werden nur Zeilen mit Symbol am Anfang (leseMarkierungen in protokoll-rechnen.js). Keine KI.
//
// baueMarken(opt) -> { leiste, panel, atListe, uebersicht, aktualisieren() }
// opt: { ctx, token, text (Textfeld), namen [..], aktionsarten [..], projektAktionsart() -> '',
//        einfuegen({ text, pos }) (setzt den Text und merkt die Änderung) }

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { istWahr } from '../schema.js';
import { datumText, heuteIso } from './todos-rechnen.js';
import { MARKEN, leseMarkierungen, markenUebersicht, markenDatumText, zeileEinfuegen } from './protokoll-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// Eingaben werden zu einer Zeile ohne Umbrüche
function einzeilig(v) {
  return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim();
}

// Tastenkürzel (Strg+Alt+Taste) je Art
const KUERZEL = { t: 'todo', l: 'learning', v: 'termin', m: 'mitteilung', u: 'umfrage', b: 'beschluss' };
const KUERZEL_TEXT = { todo: 'T', learning: 'L', termin: 'V', mitteilung: 'M', umfrage: 'U', beschluss: 'B' };

function eingabe(label, feld, extra) {
  return el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: label }), feld, extra || null);
}

export function baueMarken(opt) {
  const text = opt.text;
  let merkPos = 0;
  let offen = '';
  let einfuegeDaten = null;   // { mitteilungen, kommentare }, erst beim Öffnen von „+ Einfügen“ geladen

  const panel = el('div', { class: 'pk-marke-panel karte' });
  panel.hidden = true;
  const uebersicht = el('div', { class: 'pk-marken-uebersicht leise', 'aria-live': 'polite' });
  const atListe = el('div', { class: 'pk-chips pk-at-liste' });
  atListe.hidden = true;

  // ---- Knopfreihe ----

  const leiste = el('div', { class: 'pk-marken-leiste', role: 'group', 'aria-label': 'Markierung einfügen' },
    ...MARKEN.map(function (m) {
      return el('button', {
        class: 'knopf knopf-hell pk-marke-knopf', type: 'button',
        title: m.label + ' einfügen (Strg+Alt+' + KUERZEL_TEXT[m.art] + ')',
        text: m.zeichen + ' ' + m.label,
        onmousedown: function () { merkPos = text.selectionStart; },
        onclick: function () { oeffnen(m.art); }
      });
    }),
    el('button', {
      class: 'knopf knopf-hell pk-marke-knopf', type: 'button', text: '+ Einfügen',
      title: 'Mitteilung oder Pinnwand-Kommentar einfügen',
      onmousedown: function () { merkPos = text.selectionStart; },
      onclick: function () { oeffnen('einfuegen'); }
    })
  );

  function schliessen(zumText) {
    offen = '';
    leeren(panel);
    panel.hidden = true;
    if (zumText) {
      text.focus();
      text.setSelectionRange(merkPos, merkPos);
    }
  }

  function setzen(zeile) {
    const r = zeileEinfuegen(text.value, merkPos, zeile);
    schliessen(false);
    opt.einfuegen(r);
  }

  // Kleines Formular: felder = [{ name, label, typ, pflicht, liste }], bauen(werte) -> Zeile oder Fehlertext { fehler }
  function miniFormular(titel, felder, bauen) {
    const fehler = el('p', { class: 'fehler', role: 'alert' });
    const ein = {};
    const form = el('form', { class: 'formular pk-marke-form', novalidate: '' },
      el('h3', { class: 'teil-titel-klein', text: titel }));
    felder.forEach(function (f) {
      let feld;
      if (f.typ === 'langtext') feld = el('textarea', { class: 'feld', rows: '3', maxlength: '1000' });
      else feld = el('input', { class: 'feld', type: f.typ || 'text', maxlength: '300' });
      if (f.platzhalter) feld.setAttribute('placeholder', f.platzhalter);
      let extra = null;
      if (f.liste && f.liste.length) {
        const id = 'pk-marke-' + f.name;
        feld.setAttribute('list', id);
        extra = el('datalist', { id: id }, ...f.liste.slice(0, 30).map(function (v) { return el('option', { value: v }); }));
      }
      ein[f.name] = feld;
      form.append(eingabe(f.label + (f.pflicht ? ' *' : ''), feld, extra));
    });
    form.append(fehler, el('div', { class: 'form-knoepfe' },
      el('button', { class: 'knopf', type: 'submit', text: 'Einfügen' }),
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen', onclick: function () { schliessen(true); } })
    ));
    form.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); schliessen(true); }
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const w = {};
      for (let i = 0; i < felder.length; i++) {
        const f = felder[i];
        w[f.name] = f.typ === 'langtext' ? ein[f.name].value : einzeilig(ein[f.name].value);
        if (f.pflicht && !txt(w[f.name])) {
          fehler.textContent = '„' + f.label + '“ darf nicht leer sein.';
          ein[f.name].focus();
          return;
        }
      }
      const r = bauen(w);
      if (r && r.fehler) { fehler.textContent = r.fehler; return; }
      setzen(r);
    });
    return { form: form, erstes: ein[felder[0].name] };
  }

  function oeffnen(art) {
    if (offen === art) { schliessen(true); return; }
    leeren(panel);
    offen = art;
    panel.hidden = false;
    let m = null;
    const heute = heuteIso();
    if (art === 'todo') {
      m = miniFormular('☐ ToDo', [
        { name: 'wer', label: 'Verantwortlich (leer = Hut frei, mehrere mit Komma)', liste: opt.namen },
        { name: 'aufgabe', label: 'Aufgabe', pflicht: true },
        { name: 'frist', label: 'Frist', typ: 'date' }
      ], function (w) {
        const wer = w.wer.split(',').map(function (x) { return txt(x).replace(/^@/, '').replace(/[:@]/g, ' ').trim(); }).filter(Boolean);
        const frist = w.frist ? ' (bis ' + markenDatumText(w.frist, heute) + ')' : '';
        return '☐ ' + (wer.length ? wer.map(function (n) { return '@' + n; }).join(' ') + ': ' : '') + w.aufgabe + frist;
      });
    } else if (art === 'learning') {
      m = miniFormular('💡 Learning', [
        { name: 'aktionsart', label: 'Aktionsart (leer = die des Projekts)', liste: opt.aktionsarten },
        { name: 'learning', label: 'Was haben wir gelernt?', pflicht: true }
      ], function (w) {
        const a = w.aktionsart.replace(/:/g, ' ').trim();
        return '💡 ' + (a ? a + ': ' : '') + w.learning;
      });
    } else if (art === 'termin') {
      m = miniFormular('📅 Termin', [
        { name: 'titel', label: 'Titel', pflicht: true },
        { name: 'datum', label: 'Datum', typ: 'date', pflicht: true },
        { name: 'zeit', label: 'Uhrzeit (freiwillig)', typ: 'time' },
        { name: 'ort', label: 'Ort (freiwillig)' }
      ], function (w) {
        // Kommas trennen die Teile: im Titel werden sie zu Bindestrichen
        const titel = w.titel.replace(/,/g, ' –');
        return '📅 ' + titel + ', ' + datumText(w.datum) + (w.zeit ? ', ' + w.zeit : '') + (w.ort ? ', ' + w.ort : '');
      });
    } else if (art === 'mitteilung') {
      m = miniFormular('📌 Mitteilung', [
        { name: 'titel', label: 'Titel', pflicht: true },
        { name: 'inhalt', label: 'Text (freiwillig)' }
      ], function (w) {
        return '📌 ' + w.titel.replace(/:/g, ' –') + (w.inhalt ? ': ' + w.inhalt : '');
      });
    } else if (art === 'umfrage') {
      m = miniFormular('📊 Umfrage', [
        { name: 'frage', label: 'Frage', pflicht: true },
        { name: 'antworten', label: 'Antworten (eine pro Zeile, mindestens zwei)', typ: 'langtext', pflicht: true }
      ], function (w) {
        const antworten = String(w.antworten).split(/\r?\n/).map(einzeilig).filter(Boolean)
          .map(function (a) { return a.replace(/\|/g, '/'); });
        if (antworten.length < 2) return { fehler: 'Bitte mindestens zwei Antworten eintragen (eine pro Zeile).' };
        return '📊 ' + w.frage.replace(/\|/g, '/') + ' | ' + antworten.join(' | ');
      });
    } else if (art === 'beschluss') {
      m = miniFormular('👉 Beschluss', [
        { name: 'beschluss', label: 'Was wurde beschlossen?', pflicht: true }
      ], function (w) { return '👉 ' + w.beschluss; });
    } else if (art === 'einfuegen') {
      einfuegenZeigen();
      return;
    }
    panel.append(m.form);
    m.erstes.focus();
  }

  // ---- „+ Einfügen“: Mitteilungen und Pinnwand-Kommentare ----

  async function einfuegenZeigen() {
    const suche = el('input', { class: 'feld suche-feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen' });
    const listen = el('div', { class: 'pk-einfuegen-listen' }, el('p', { class: 'leise', text: 'Lade …' }));
    panel.append(el('div', { class: 'pk-marke-form' },
      el('h3', { class: 'teil-titel-klein', text: '+ Einfügen aus der App' }),
      suche, listen,
      el('div', { class: 'form-knoepfe' },
        el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Schließen', onclick: function () { schliessen(true); } }))
    ));
    suche.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); schliessen(true); }
    });
    suche.focus();
    if (!einfuegeDaten) {
      try {
        const r = await api('listMehrere', { tabellen: ['Mitteilungen', 'Kommentare'] }, opt.token);
        const t = (r && r.tabellen) || {};
        einfuegeDaten = { mitteilungen: t.Mitteilungen || [], kommentare: t.Kommentare || [] };
      } catch (e) {
        if (opt.ctx.behandleFehler(e)) return;
        leeren(listen);
        listen.append(el('p', { class: 'fehler', text: 'Laden hat nicht geklappt: ' + e.message }));
        return;
      }
      aktualisieren();
    }
    if (offen !== 'einfuegen') return;

    function zeichne() {
      leeren(listen);
      const s = txt(suche.value).toLowerCase();
      const passt = function (x) { return !s || x.toLowerCase().indexOf(s) >= 0; };
      const neueste = function (a, b) { return txt(b.erstellt_am).localeCompare(txt(a.erstellt_am)); };
      // Mitteilungen: angeheftete zuerst, dann die neuesten
      const mitt = einfuegeDaten.mitteilungen.slice().sort(function (a, b) {
        return (istWahr(b.angeheftet) ? 1 : 0) - (istWahr(a.angeheftet) ? 1 : 0) || neueste(a, b);
      }).filter(function (x) { return passt(txt(x.titel) + ' ' + txt(x.text)); }).slice(0, 10);
      const komm = einfuegeDaten.kommentare.filter(function (k) {
        return txt(k.bezug_art) === 'pinnwand' && passt(txt(k.text) + ' ' + txt(k.erstellt_von));
      }).sort(neueste).slice(0, 10);

      function liste(titel, eintraege, zeileVon, beschriftung) {
        const ul = el('ul', { class: 'dash-todo-liste' });
        eintraege.forEach(function (x) {
          ul.append(el('li', null, el('button', {
            class: 'dash-todo protokoll-zeile', type: 'button',
            onclick: function () { setzen(zeileVon(x)); }
          }, ...beschriftung(x))));
        });
        if (!eintraege.length) ul.append(el('li', { class: 'leise', text: 'Nichts gefunden.' }));
        return el('div', null, el('h4', { class: 'teil-titel-klein', text: titel }), ul);
      }
      listen.append(
        liste('Mitteilungen (Schwarzes Brett)', mitt, function (x) {
          return '📌 Mitteilung „' + einzeilig(x.titel).replace(/[“”"]/g, '\'') + '“: ' + einzeilig(x.text);
        }, function (x) {
          return [el('strong', { text: (istWahr(x.angeheftet) ? '📌 ' : '') + txt(x.titel) }),
            txt(x.text) ? el('span', { class: 'leise', text: einzeilig(x.text).slice(0, 120) }) : null];
        }),
        liste('Pinnwand', komm, function (x) {
          return '💬 Pinnwand (' + (einzeilig(x.erstellt_von) || 'unbekannt') + ', ' + datumText(txt(x.erstellt_am).slice(0, 10)).slice(0, 6) + '): ' + einzeilig(x.text);
        }, function (x) {
          return [el('span', { class: 'leise', text: (txt(x.erstellt_von) || 'unbekannt') + ', ' + datumText(txt(x.erstellt_am).slice(0, 10)) }),
            el('span', { text: einzeilig(x.text).slice(0, 160) })];
        })
      );
    }
    suche.addEventListener('input', zeichne);
    zeichne();
  }

  // ---- Tastenkürzel (nur Strg+Alt, ohne Umschalt). AltGr-Zeichen (z. B. µ) haben eine andere Taste. ----

  text.addEventListener('keydown', function (ev) {
    if (!ev.ctrlKey || !ev.altKey || ev.shiftKey || ev.metaKey) return;
    const art = KUERZEL[String(ev.key || '').toLowerCase()];
    if (!art) return;
    ev.preventDefault();
    merkPos = text.selectionStart;
    oeffnen(art);
  });

  // ---- „@“: Namensauswahl ----

  function atPruefen() {
    const pos = text.selectionStart;
    if (pos !== text.selectionEnd) { atListe.hidden = true; return; }
    const vorher = text.value.slice(0, pos);
    const m = /(^|[\s(])@([^\s@:,()]*)$/.exec(vorher);
    leeren(atListe);
    if (!m) { atListe.hidden = true; return; }
    const teil = m[2].toLowerCase();
    const treffer = opt.namen.filter(function (n) { return n.toLowerCase().indexOf(teil) === 0; }).slice(0, 8);
    if (!treffer.length) { atListe.hidden = true; return; }
    atListe.hidden = false;
    atListe.append(el('span', { class: 'leise', text: 'Name wählen:' }));
    treffer.forEach(function (n) {
      atListe.append(el('button', {
        class: 'pk-chip', type: 'button', text: '@' + n,
        onmousedown: function (ev) { ev.preventDefault(); },
        onclick: function () {
          const start = pos - m[2].length - 1;
          const neu = text.value.slice(0, start) + '@' + n + text.value.slice(pos);
          atListe.hidden = true;
          opt.einfuegen({ text: neu, pos: start + n.length + 1 });
        }
      }));
    });
  }
  text.addEventListener('input', atPruefen);
  text.addEventListener('click', atPruefen);
  text.addEventListener('keyup', function (ev) {
    if (ev.key === 'Escape') { atListe.hidden = true; return; }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') atPruefen();
  });
  text.addEventListener('blur', function () {
    // Cursorstelle merken (auch für Knöpfe, die mit der Tastatur bedient werden)
    merkPos = text.selectionStart;
    setTimeout(function () { atListe.hidden = true; }, 200);
  });

  // ---- Übersicht der erkannten Markierungen ----

  function aktualisieren() {
    leeren(uebersicht);
    const r = leseMarkierungen(text.value, {
      projektAktionsart: opt.projektAktionsart(),
      mitteilungen: einfuegeDaten ? einfuegeDaten.mitteilungen : []
    });
    const kurz = markenUebersicht(r);
    if (!kurz && !r.uebersprungen.length) return;
    if (kurz) uebersicht.append(el('span', { text: 'Erkannt: ' + kurz }));
    r.fehler.forEach(function (f) {
      uebersicht.append(el('span', { class: 'fehler pk-marken-fehler', text: 'Zeile ' + f.zeile + ': ' + f.grund }));
    });
    r.uebersprungen.forEach(function (u) {
      uebersicht.append(el('span', { text: 'Zeile ' + u.zeile + ': Diese Mitteilung gibt es schon, sie wird nicht neu angelegt.' }));
    });
    r.learnings.forEach(function (l) {
      if (l.ausProjekt && !l.aktionsart) {
        uebersicht.append(el('span', { class: 'fehler pk-marken-fehler', text: 'Zeile ' + l.zeile + ': Learning ohne Aktionsart (kein Projekt mit Aktionsart gewählt).' }));
      }
    });
  }
  text.addEventListener('input', aktualisieren);

  return { leiste: leiste, panel: panel, atListe: atListe, uebersicht: uebersicht, aktualisieren: aktualisieren };
}
