// js/views/protokoll-marken.js
// Markierungen im Protokolltext (Etappe 8, Schritt 8.4, umgebaut in 8.4a), eingebaut im Formular (protokoll-eintrag.js):
// - Knopfreihe ☐ ToDo · 💡 Learning · 📅 Termin · 📌 Mitteilung · 📊 Umfrage · 👉 Beschluss · + Einfügen.
//   Jeder Knopf öffnet ein kleines Formular unter der Reihe. „Anlegen und einfügen“ legt den Eintrag sofort an
//   (ToDo, Learning, Veranstaltung, Mitteilung, Umfrage) und schreibt die Zeile mit „✔“ am Ende in den Text.
//   „Nur in den Text“ schreibt nur die Zeile (ohne ✔, sie kann später aus dem Protokoll angelegt werden, 8.5).
//   👉 Beschluss legt nichts an.
// - Tastenkürzel am PC: Strg+Alt+T (ToDo), L (Learning), V (Termin), M (Mitteilung), U (Umfrage), B (Beschluss).
// - „+ Einfügen“: bestehende Mitteilungen und Pinnwand-Kommentare mit Quelle einfügen. Das legt nichts Neues an
//   („↪ Mitteilung …“ und „💬 Pinnwand …“ sind keine Markierungen).
// - Übersicht unter dem Feld: erkannte Markierungen, schon angelegte (✔) und nicht lesbare Zeilen.
// Gelesen werden nur Zeilen mit Symbol am Anfang (leseMarkierungen in protokoll-rechnen.js). Keine KI.
//
// baueMarken(opt) -> { leiste, panel, uebersicht, aktualisieren() }
// opt: { ctx, token, text (Textfeld), namen [..], aktionsarten [..], projekte (offene Projekte),
//        projektVorgabe() -> Projekt-ID des Protokolls oder '', herkunft() -> 'Aus dem Protokoll vom …',
//        einfuegen({ text, pos }) (setzt den Text und merkt die Änderung), beiAngelegt(tabelle, id) }

import { el, leeren, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';
import { istWahr } from '../schema.js';
import { datumText, heuteIso } from './todos-rechnen.js';
import { MARKEN, leseMarkierungen, markenUebersicht, markenDatumText, zeileEinfuegen } from './protokoll-rechnen.js';

// Eingaben werden zu einer Zeile ohne Umbrüche
function einzeilig(v) {
  return String(v === undefined || v === null ? '' : v).replace(/\s+/g, ' ').trim();
}

// Tastenkürzel (Strg+Alt+Taste) je Art
const KUERZEL = { t: 'todo', l: 'learning', v: 'termin', m: 'mitteilung', u: 'umfrage', b: 'beschluss' };
const KUERZEL_TEXT = { todo: 'T', learning: 'L', termin: 'V', mitteilung: 'M', umfrage: 'U', beschluss: 'B' };
const ANGELEGT = { todo: 'ToDo angelegt.', learning: 'Learning angelegt.', termin: 'Veranstaltung angelegt.',
  mitteilung: 'Mitteilung angeheftet.', umfrage: 'Umfrage angelegt.' };

function eingabe(label, feld, extra) {
  return el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: label }), feld, extra || null);
}

// Ganzes Datums- oder Zeitfeld öffnet die Auswahl (nicht nur das kleine Symbol)
function auswahlBeiKlick(feld) {
  feld.addEventListener('click', function () {
    try { if (typeof feld.showPicker === 'function') feld.showPicker(); } catch (e) { /* ignorieren */ }
  });
}

export function baueMarken(opt) {
  const text = opt.text;
  let merkPos = 0;
  let offen = '';
  let einfuegeDaten = null;   // { mitteilungen, kommentare }, erst beim Öffnen von „+ Einfügen“ geladen

  const panel = el('div', { class: 'pk-marke-panel karte' });
  panel.hidden = true;
  const uebersicht = el('div', { class: 'pk-marken-uebersicht leise', 'aria-live': 'polite' });

  // ---- Knopfreihe ----

  const leiste = el('div', { class: 'pk-marken-leiste', role: 'group', 'aria-label': 'Markierung einfügen' },
    ...MARKEN.map(function (m) {
      return el('button', {
        class: 'knopf knopf-hell pk-marke-knopf', type: 'button',
        title: m.label + ' (Strg+Alt+' + KUERZEL_TEXT[m.art] + ')',
        text: m.zeichen + ' ' + m.label,
        onmousedown: function () { merkPos = text.selectionStart; },
        onclick: function () { oeffnen(m.art); }
      });
    }),
    el('button', {
      class: 'knopf knopf-hell pk-marke-knopf', type: 'button', text: '+ Einfügen',
      title: 'Bestehende Mitteilung oder Pinnwand-Kommentar einfügen (legt nichts Neues an)',
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

  function projektOptionen() {
    return [{ wert: '', label: '– kein Projekt (allgemein) –' }].concat(
      (opt.projekte || []).map(function (p) { return { wert: String(p.id), label: txt(p.titel) }; }));
  }

  function projektAktionsart(pid) {
    const p = (opt.projekte || []).find(function (x) { return String(x.id) === String(pid); });
    return p ? txt(p.aktionsart) : '';
  }

  // Kleines Formular.
  // felder: [{ name, label, typ (text|date|time|langtext|bool|auswahl), pflicht, liste, optionen, wert }]
  // art.zeile(w) -> Zeile oder { fehler }; art.anlegen(w) -> { tabelle, daten } oder { fehler } (fehlt = nichts anlegen)
  function miniFormular(titel, felder, art) {
    const fehler = el('p', { class: 'fehler', role: 'alert' });
    const ein = {};
    let laeuft = false;
    const form = el('form', { class: 'formular pk-marke-form', novalidate: '' },
      el('h3', { class: 'teil-titel-klein', text: titel }));
    felder.forEach(function (f) {
      let feld;
      if (f.typ === 'langtext') feld = el('textarea', { class: 'feld', rows: '3', maxlength: '1000' });
      else if (f.typ === 'bool') feld = el('input', { type: 'checkbox' });
      else if (f.typ === 'auswahl') {
        feld = el('select', { class: 'feld' }, ...(f.optionen || []).map(function (o) {
          return el('option', { value: o.wert, text: o.label });
        }));
      } else {
        feld = el('input', { class: 'feld', type: f.typ || 'text', maxlength: '300' });
        if (f.typ === 'date' || f.typ === 'time') auswahlBeiKlick(feld);
      }
      if (f.wert !== undefined) {
        if (f.typ === 'bool') feld.checked = !!f.wert;
        else feld.value = f.wert;
      }
      let extra = null;
      if (f.liste && f.liste.length) {
        const id = 'pk-marke-' + f.name;
        feld.setAttribute('list', id);
        extra = el('datalist', { id: id }, ...f.liste.slice(0, 30).map(function (v) { return el('option', { value: v }); }));
      }
      ein[f.name] = feld;
      if (f.typ === 'bool') form.append(el('label', { class: 'formfeld-bool' }, feld, el('span', { text: f.label })));
      else form.append(eingabe(f.label + (f.pflicht ? ' *' : ''), feld, extra));
    });

    function lesen() {
      const w = {};
      for (let i = 0; i < felder.length; i++) {
        const f = felder[i];
        if (f.typ === 'bool') { w[f.name] = ein[f.name].checked; continue; }
        w[f.name] = f.typ === 'langtext' ? ein[f.name].value : einzeilig(ein[f.name].value);
        if (f.pflicht && !txt(w[f.name])) {
          fehler.textContent = '„' + f.label + '“ darf nicht leer sein.';
          ein[f.name].focus();
          return null;
        }
      }
      return w;
    }

    async function los(anlegen) {
      if (laeuft) return;
      fehler.textContent = '';
      const w = lesen();
      if (!w) return;
      const zeile = art.zeile(w);
      if (zeile && zeile.fehler) { fehler.textContent = zeile.fehler; return; }
      if (!anlegen || !art.anlegen) { setzen(zeile); return; }
      const auftrag = art.anlegen(w);
      if (auftrag && auftrag.fehler) { fehler.textContent = auftrag.fehler; return; }
      laeuft = true;
      hauptKnopf.disabled = true;
      hauptKnopf.textContent = 'Lege an …';
      try {
        const neu = await api('create', { tabelle: auftrag.tabelle, daten: auftrag.daten }, opt.token);
        // Merken, damit der Eintrag beim Verwerfen des Entwurfs mitgelöscht werden kann
        if (opt.beiAngelegt && neu && neu.id) opt.beiAngelegt(auftrag.tabelle, String(neu.id));
        toast(ANGELEGT[art.art] || 'Angelegt.');
        setzen(zeile + ' ✔');
      } catch (e) {
        laeuft = false;
        hauptKnopf.disabled = false;
        hauptKnopf.textContent = 'Anlegen und einfügen';
        if (opt.ctx.behandleFehler(e)) return;
        fehler.textContent = 'Nicht angelegt: ' + e.message + ' Mit „Nur in den Text“ kommt die Zeile trotzdem ins Protokoll.';
      }
    }

    const hauptKnopf = el('button', { class: 'knopf', type: 'submit', text: art.anlegen ? 'Anlegen und einfügen' : 'Einfügen' });
    form.append(fehler, el('div', { class: 'form-knoepfe' },
      hauptKnopf,
      art.anlegen ? el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Nur in den Text', onclick: function () { los(false); } }) : null,
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen', onclick: function () { schliessen(true); } })
    ));
    form.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); schliessen(true); }
    });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); los(true); });
    return { form: form, erstes: ein[felder[0].name], ein: ein };
  }

  function oeffnen(was) {
    if (offen === was) { schliessen(true); return; }
    leeren(panel);
    offen = was;
    panel.hidden = false;
    if (was === 'einfuegen') { einfuegenZeigen(); return; }
    const heute = heuteIso();
    const vorgabe = opt.projektVorgabe();
    let m = null;
    if (was === 'todo') {
      m = miniFormular('☐ ToDo anlegen', [
        { name: 'aufgabe', label: 'Aufgabe', pflicht: true },
        { name: 'wer', label: 'Verantwortlich (leer = Hut frei, mehrere mit Komma)', liste: opt.namen },
        { name: 'frist', label: 'Frist (freiwillig)', typ: 'date' },
        { name: 'projekt', label: 'Projekt (freiwillig, leer = allgemeines ToDo)', typ: 'auswahl', optionen: projektOptionen(), wert: vorgabe }
      ], {
        art: 'todo',
        zeile: function (w) {
          const wer = namenListe(w.wer);
          const frist = w.frist ? ' (bis ' + markenDatumText(w.frist, heute) + ')' : '';
          return '☐ ' + (wer.length ? wer.map(function (n) { return '@' + n; }).join(' ') + ': ' : '') + w.aufgabe + frist;
        },
        anlegen: function (w) {
          return { tabelle: 'ToDos', daten: {
            text: w.aufgabe, verantwortlich: namenListe(w.wer).join(', '), faellig_am: w.frist,
            projekt_id: w.projekt, details: opt.herkunft(), erledigt: false
          } };
        }
      });
    } else if (was === 'learning') {
      m = miniFormular('💡 Learning anlegen', [
        { name: 'learning', label: 'Was haben wir gelernt?', pflicht: true },
        { name: 'projekt', label: 'Projekt (freiwillig)', typ: 'auswahl', optionen: projektOptionen(), wert: vorgabe },
        { name: 'aktionsart', label: 'Aktionsart (leer = die des Projekts)', liste: opt.aktionsarten, wert: projektAktionsart(vorgabe) }
      ], {
        art: 'learning',
        zeile: function (w) {
          const a = (w.aktionsart || projektAktionsart(w.projekt)).replace(/:/g, ' ').trim();
          return '💡 ' + (a ? a + ': ' : '') + w.learning;
        },
        anlegen: function (w) {
          const a = w.aktionsart || projektAktionsart(w.projekt);
          if (!a) return { fehler: 'Bitte eine Aktionsart angeben (zum Beispiel Demo oder Infostand).' };
          return { tabelle: 'Learnings', daten: { projekt_id: w.projekt, aktionsart: a, text: w.learning } };
        }
      });
      // Anderes Projekt gewählt: Aktionsart nachführen, solange sie noch die alte Vorgabe ist
      let alt = projektAktionsart(vorgabe);
      m.ein.projekt.addEventListener('change', function () {
        if (txt(m.ein.aktionsart.value) === alt) m.ein.aktionsart.value = projektAktionsart(m.ein.projekt.value);
        alt = projektAktionsart(m.ein.projekt.value);
      });
    } else if (was === 'termin') {
      m = miniFormular('📅 Veranstaltung anlegen', [
        { name: 'titel', label: 'Titel', pflicht: true },
        { name: 'datum', label: 'Datum', typ: 'date', pflicht: true },
        { name: 'zeit', label: 'Uhrzeit (freiwillig)', typ: 'time' },
        { name: 'ort', label: 'Ort (freiwillig)' },
        { name: 'art', label: 'Art', typ: 'auswahl', optionen: [
          { wert: 'intern', label: 'Intern (nur die Gruppe)' }, { wert: 'extern', label: 'Extern (nach außen, nicht veröffentlicht)' }
        ], wert: 'intern' }
      ], {
        art: 'termin',
        zeile: function (w) {
          // Kommas trennen die Teile: im Titel werden sie zu Bindestrichen
          const titel = w.titel.replace(/,/g, ' –');
          return '📅 ' + titel + ', ' + datumText(w.datum) + (w.zeit ? ', ' + w.zeit : '') + (w.ort ? ', ' + w.ort : '');
        },
        anlegen: function (w) {
          return { tabelle: 'Veranstaltungen', daten: {
            titel: w.titel, art: w.art || 'intern', datum: w.datum, zeit_von: w.zeit, ort: w.ort,
            beschreibung: opt.herkunft(), oeffentlich: false
          } };
        }
      });
    } else if (was === 'mitteilung') {
      m = miniFormular('📌 Mitteilung anheften', [
        { name: 'titel', label: 'Titel', pflicht: true },
        { name: 'inhalt', label: 'Text (freiwillig)', typ: 'langtext' }
      ], {
        art: 'mitteilung',
        zeile: function (w) {
          return '📌 ' + w.titel.replace(/:/g, ' –') + (txt(w.inhalt) ? ': ' + einzeilig(w.inhalt) : '');
        },
        anlegen: function (w) {
          return { tabelle: 'Mitteilungen', daten: { titel: w.titel, text: txt(w.inhalt), angeheftet: true } };
        }
      });
    } else if (was === 'umfrage') {
      const antworten = function (w) {
        return String(w.antworten).split(/\r?\n/).map(einzeilig).filter(Boolean);
      };
      m = miniFormular('📊 Umfrage anlegen', [
        { name: 'frage', label: 'Frage', pflicht: true },
        { name: 'antworten', label: 'Antworten (eine pro Zeile, mindestens zwei)', typ: 'langtext', pflicht: true },
        { name: 'frist', label: 'Frist (freiwillig)', typ: 'date' },
        { name: 'mehrfach', label: 'Mehrere Antworten erlaubt', typ: 'bool' },
        { name: 'namentlich', label: 'Namentlich abstimmen', typ: 'bool' }
      ], {
        art: 'umfrage',
        zeile: function (w) {
          const a = antworten(w);
          if (a.length < 2) return { fehler: 'Bitte mindestens zwei Antworten eintragen (eine pro Zeile).' };
          return '📊 ' + w.frage.replace(/\|/g, '/') + ' | ' + a.map(function (x) { return x.replace(/\|/g, '/'); }).join(' | ');
        },
        anlegen: function (w) {
          return { tabelle: 'Umfragen', daten: {
            frage: w.frage, optionen: antworten(w).join('\n'), ablauf_am: w.frist,
            mehrfach: !!w.mehrfach, namentlich: !!w.namentlich, beendet: false
          } };
        }
      });
    } else if (was === 'beschluss') {
      m = miniFormular('👉 Beschluss', [
        { name: 'beschluss', label: 'Was wurde beschlossen?', pflicht: true }
      ], { art: 'beschluss', zeile: function (w) { return '👉 ' + w.beschluss; } });
    }
    panel.append(m.form);
    m.erstes.focus();
  }

  function namenListe(s) {
    return String(s || '').split(',').map(function (x) {
      return txt(x).replace(/^@/, '').replace(/[:@]/g, ' ').trim();
    }).filter(Boolean);
  }

  // ---- „+ Einfügen“: bestehende Mitteilungen und Pinnwand-Kommentare (legt nichts an) ----

  async function einfuegenZeigen() {
    const suche = el('input', { class: 'feld suche-feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen' });
    const listen = el('div', { class: 'pk-einfuegen-listen' }, el('p', { class: 'leise', text: 'Lade …' }));
    panel.append(el('div', { class: 'pk-marke-form' },
      el('h3', { class: 'teil-titel-klein', text: '+ Einfügen aus der App' }),
      el('p', { class: 'leise pk-hinweis', text: 'Fügt den Text mit Quelle ein. Es wird nichts Neues angelegt.' }),
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
          return '↪ Mitteilung „' + einzeilig(x.titel).replace(/[“”"]/g, '\'') + '“: ' + einzeilig(x.text);
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

  // Cursorstelle merken (auch für Knöpfe, die mit der Tastatur bedient werden)
  text.addEventListener('blur', function () { merkPos = text.selectionStart; });

  // ---- Übersicht der erkannten Markierungen ----

  function aktualisieren() {
    leeren(uebersicht);
    const r = leseMarkierungen(text.value, { projektAktionsart: projektAktionsart(opt.projektVorgabe()) });
    const kurz = markenUebersicht(r);
    if (!kurz) return;
    uebersicht.append(el('span', { text: 'Im Text: ' + kurz }));
    r.fehler.forEach(function (f) {
      uebersicht.append(el('span', { class: 'fehler pk-marken-fehler', text: 'Zeile ' + f.zeile + ': ' + f.grund }));
    });
    r.learnings.forEach(function (l) {
      if (l.ausProjekt && !l.aktionsart) {
        uebersicht.append(el('span', { class: 'fehler pk-marken-fehler', text: 'Zeile ' + l.zeile + ': Learning ohne Aktionsart (kein Projekt mit Aktionsart gewählt).' }));
      }
    });
  }
  text.addEventListener('input', aktualisieren);

  return { leiste: leiste, panel: panel, uebersicht: uebersicht, aktualisieren: aktualisieren };
}
