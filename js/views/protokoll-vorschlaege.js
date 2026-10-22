// js/views/protokoll-vorschlaege.js
// „Vorschläge aus dem Protokoll“ (Etappe 8, Schritt 8.5): steht im Reiter Dokumentation im Inhalt (kein Fenster).
// Liest die Markierungen eines gespeicherten Protokolls (leseMarkierungen) und zeigt sie zum Abhaken:
// ToDos, Learnings (nach Aktionsart), Termine (Veranstaltungen), Mitteilungen, Umfragen, dazu die Fehlerzeilen.
// Zeilen mit „✔“ wurden schon beim Schreiben angelegt und kommen hier nicht vor.
// „Angekreuzte anlegen“: je Tabelle ein batchCreate, danach vorschlaege_erledigt = TRUE (ohne Konfliktprüfung).
//
// baueVorschlaege(opt) -> Element
// opt: { ctx, token, protokoll, daten: { projekte, veranstaltungen, vorlagen }, namen, beiFertig(), beiZu() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';
import { normDatum, datumText } from './todos-rechnen.js';
import { zeitNorm } from './kalender-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';
import { leseMarkierungen } from './protokoll-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// Wie viele Vorschläge hat dieses Protokoll? (ohne Fehlerzeilen und ohne ✔)
export function vorschlagZahl(p, projekte) {
  const r = leseMarkierungen(p.text, { projektAktionsart: aktionsartVon(projekte, p.projekt_id) });
  return r.todos.length + r.learnings.length + r.termine.length + r.mitteilungen.length + r.umfragen.length;
}

function aktionsartVon(projekte, pid) {
  const x = (projekte || []).find(function (y) { return String(y.id) === String(pid); });
  return x ? txt(x.aktionsart) : '';
}

function auswahlBeiKlick(feld) {
  feld.addEventListener('click', function () {
    try { if (typeof feld.showPicker === 'function') feld.showPicker(); } catch (e) { /* ignorieren */ }
  });
}

function eingabe(typ, wert, label) {
  const f = el('input', { class: 'feld', type: typ, maxlength: '300', 'aria-label': label, title: label });
  f.value = wert || '';
  if (typ === 'date' || typ === 'time') auswahlBeiKlick(f);
  return f;
}

function auswahl(optionen, wert, label) {
  const s = el('select', { class: 'feld', 'aria-label': label, title: label },
    ...optionen.map(function (o) { return el('option', { value: o.wert, text: o.label }); }));
  s.value = wert || '';
  return s;
}

function haken(an, label) {
  const c = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': label });
  c.checked = an;
  return c;
}

export function baueVorschlaege(opt) {
  const p = opt.protokoll;
  const d = opt.daten;
  const projekte = (d.projekte || []).filter(function (x) { return !istAbgeschlossen(x) || String(x.id) === txt(p.projekt_id); })
    .sort(function (a, b) { return txt(a.titel).localeCompare(txt(b.titel), 'de'); });
  const projektOpt = [{ wert: '', label: '– kein Projekt –' }].concat(projekte.map(function (x) {
    return { wert: String(x.id), label: txt(x.titel) };
  }));
  const r = leseMarkierungen(p.text, { projektAktionsart: aktionsartVon(d.projekte, p.projekt_id) });
  const herkunft = 'Aus dem Protokoll' + (normDatum(p.datum) ? ' vom ' + datumText(p.datum) : '') +
    (txt(p.titel) ? ': ' + txt(p.titel) : '');

  // Jeder Vorschlag: { tabelle, haken, lesen() -> daten oder { fehler } }
  const vorschlaege = [];
  const box = el('section', { class: 'karte pk-vorschlaege' },
    el('h2', { text: 'Vorschläge aus dem Protokoll' }),
    el('p', { class: 'leise', text: 'Aus „' + (txt(p.titel) || 'Protokoll') + '“' + (normDatum(p.datum) ? ' vom ' + datumText(p.datum) : '') +
      '. Angekreuztes wird angelegt, der Rest nicht.' }));
  if (r.uebersprungen.length) {
    box.append(el('p', { class: 'leise', text: r.uebersprungen.length + (r.uebersprungen.length === 1 ? ' Eintrag wurde' : ' Einträge wurden') +
      ' schon beim Schreiben angelegt (✔) und steht hier nicht.' }));
  }

  function abschnitt(titel, anzahl) {
    const s = el('div', { class: 'pk-vorschlag-teil' }, el('h3', { class: 'teil-titel-klein', text: titel + ' (' + anzahl + ')' }));
    box.append(s);
    return s;
  }

  function zeile(teil, quelle, felder, an) {
    const h = haken(an, 'Anlegen: ' + quelle.text);
    const z = el('div', { class: 'pk-vorschlag' + (an ? '' : ' pk-vorschlag-aus') },
      h,
      el('div', { class: 'pk-vorschlag-felder' },
        el('span', { class: 'leise pk-vorschlag-quelle', text: 'Zeile ' + quelle.zeile + ': ' + quelle.text }),
        ...felder));
    h.addEventListener('change', function () { z.classList.toggle('pk-vorschlag-aus', !h.checked); });
    teil.append(z);
    return h;
  }

  // ToDos
  if (r.todos.length) {
    const teil = abschnitt('ToDos', r.todos.length);
    r.todos.forEach(function (t) {
      const f = {
        text: eingabe('text', t.aufgabe, 'Aufgabe'),
        wer: eingabe('text', t.verantwortlich, 'Verantwortlich (leer = Hut frei)'),
        frist: eingabe('date', t.faellig_am, 'Frist'),
        projekt: auswahl(projektOpt, txt(p.projekt_id), 'Projekt')
      };
      if (opt.namen && opt.namen.length) {
        f.wer.setAttribute('list', 'pk-vorschlag-namen');
      }
      f.wer.setAttribute('placeholder', 'Verantwortlich (leer = Hut frei)');
      const h = zeile(teil, t, [f.text, el('div', { class: 'pk-vorschlag-reihe' }, f.wer, f.frist, f.projekt)], true);
      vorschlaege.push({
        tabelle: 'ToDos', haken: h,
        lesen: function () {
          if (!txt(f.text.value)) return { fehler: 'Ein ToDo hat keinen Text.' };
          return { text: txt(f.text.value), verantwortlich: txt(f.wer.value), faellig_am: f.frist.value,
            projekt_id: f.projekt.value, details: herkunft, erledigt: false };
        }
      });
    });
    if (opt.namen && opt.namen.length) {
      teil.append(el('datalist', { id: 'pk-vorschlag-namen' }, ...opt.namen.map(function (n) { return el('option', { value: n }); })));
    }
  }

  // Learnings, sortiert nach Aktionsart
  if (r.learnings.length) {
    const teil = abschnitt('Learnings', r.learnings.length);
    const gruppen = {};
    r.learnings.forEach(function (l) {
      const a = txt(l.aktionsart) || 'Ohne Aktionsart';
      if (!gruppen[a]) gruppen[a] = [];
      gruppen[a].push(l);
    });
    Object.keys(gruppen).sort(function (a, b) { return a.localeCompare(b, 'de'); }).forEach(function (a) {
      teil.append(el('h4', { class: 'pk-vorschlag-art', text: a }));
      gruppen[a].forEach(function (l) {
        const f = {
          text: eingabe('text', l.learning, 'Learning'),
          art: eingabe('text', l.aktionsart, 'Aktionsart'),
          projekt: auswahl(projektOpt, txt(p.projekt_id), 'Projekt')
        };
        f.art.setAttribute('placeholder', 'Aktionsart (Pflicht)');
        const h = zeile(teil, l, [f.text, el('div', { class: 'pk-vorschlag-reihe' }, f.art, f.projekt)], true);
        vorschlaege.push({
          tabelle: 'Learnings', haken: h,
          lesen: function () {
            if (!txt(f.text.value)) return { fehler: 'Ein Learning hat keinen Text.' };
            const art = txt(f.art.value) || aktionsartVon(d.projekte, f.projekt.value);
            if (!art) return { fehler: 'Bei einem Learning fehlt die Aktionsart.' };
            return { projekt_id: f.projekt.value, aktionsart: art, text: txt(f.text.value) };
          }
        });
      });
    });
  }

  // Termine (Veranstaltungen). „Nächstes Plenum“ nimmt Name, Ort und Ende aus der Plenums-Vorlage.
  if (r.termine.length) {
    const teil = abschnitt('Termine', r.termine.length);
    const vorlage = (d.vorlagen || []).find(function (v) { return /^plenum/i.test(txt(v.name)); }) || null;
    r.termine.forEach(function (t) {
      const plenum = t.titel === 'Plenum' && /^Nächstes Plenum/.test(txt(t.text));
      const titel = plenum && vorlage ? txt(vorlage.name) : t.titel;
      const ort = t.ort || (plenum && vorlage ? txt(vorlage.ort) : '');
      const da = (d.veranstaltungen || []).some(function (v) {
        if (normDatum(v.datum) !== t.datum) return false;
        const vt = txt(v.titel).toLowerCase();
        return vt === titel.toLowerCase() || (plenum && vt.indexOf('plenum') === 0);
      });
      const f = {
        titel: eingabe('text', titel, 'Titel'),
        datum: eingabe('date', t.datum, 'Datum'),
        zeit: eingabe('time', t.zeit, 'Uhrzeit'),
        ort: eingabe('text', ort, 'Ort'),
        art: auswahl([{ wert: 'intern', label: 'Intern' }, { wert: 'extern', label: 'Extern' }], 'intern', 'Art')
      };
      f.ort.setAttribute('placeholder', 'Ort');
      const felder = [f.titel, el('div', { class: 'pk-vorschlag-reihe' }, f.datum, f.zeit, f.ort, f.art)];
      if (da) felder.unshift(el('span', { class: 'protokoll-marke protokoll-ok', text: 'Gibt es schon' }));
      const h = zeile(teil, t, felder, !da);
      vorschlaege.push({
        tabelle: 'Veranstaltungen', haken: h,
        lesen: function () {
          if (!txt(f.titel.value) || !f.datum.value) return { fehler: 'Ein Termin braucht Titel und Datum.' };
          return { titel: txt(f.titel.value), art: f.art.value, datum: f.datum.value, zeit_von: zeitNorm(f.zeit.value),
            zeit_bis: plenum && vorlage ? zeitNorm(vorlage.zeit_bis) : '', ort: txt(f.ort.value),
            beschreibung: herkunft, oeffentlich: false };
        }
      });
    });
  }

  // Mitteilungen (werden angeheftet)
  if (r.mitteilungen.length) {
    const teil = abschnitt('Mitteilungen', r.mitteilungen.length);
    r.mitteilungen.forEach(function (m) {
      const f = { titel: eingabe('text', m.titel, 'Titel'), text: eingabe('text', m.inhalt, 'Text') };
      f.text.setAttribute('placeholder', 'Text (freiwillig)');
      const h = zeile(teil, m, [f.titel, f.text], true);
      vorschlaege.push({
        tabelle: 'Mitteilungen', haken: h,
        lesen: function () {
          if (!txt(f.titel.value)) return { fehler: 'Eine Mitteilung hat keinen Titel.' };
          return { titel: txt(f.titel.value), text: txt(f.text.value), angeheftet: true };
        }
      });
    });
  }

  // Umfragen (Standard: anonym, eine Antwort, ohne Frist)
  if (r.umfragen.length) {
    const teil = abschnitt('Umfragen', r.umfragen.length);
    r.umfragen.forEach(function (u) {
      const antworten = el('textarea', { class: 'feld', rows: '3', 'aria-label': 'Antworten (eine pro Zeile)' });
      antworten.value = u.antworten.join('\n');
      const mehrfach = el('input', { type: 'checkbox' });
      const namentlich = el('input', { type: 'checkbox' });
      const f = { frage: eingabe('text', u.frage, 'Frage'), frist: eingabe('date', '', 'Frist (freiwillig)') };
      const h = zeile(teil, u, [f.frage, antworten,
        el('div', { class: 'pk-vorschlag-reihe' }, f.frist,
          el('label', { class: 'formfeld-bool' }, mehrfach, el('span', { text: 'mehrere Antworten' })),
          el('label', { class: 'formfeld-bool' }, namentlich, el('span', { text: 'namentlich' })))], true);
      vorschlaege.push({
        tabelle: 'Umfragen', haken: h,
        lesen: function () {
          const a = antworten.value.split(/\r?\n/).map(txt).filter(Boolean);
          if (!txt(f.frage.value) || a.length < 2) return { fehler: 'Eine Umfrage braucht eine Frage und mindestens zwei Antworten.' };
          return { frage: txt(f.frage.value), optionen: a.join('\n'), ablauf_am: f.frist.value,
            mehrfach: mehrfach.checked, namentlich: namentlich.checked, beendet: false };
        }
      });
    });
  }

  // Fehlerzeilen: grau mit Grund, es wird nichts angelegt
  if (r.fehler.length) {
    const teil = abschnitt('Nicht lesbare Zeilen', r.fehler.length);
    r.fehler.forEach(function (f) {
      teil.append(el('p', { class: 'leise pk-vorschlag-fehler', text: 'Zeile ' + f.zeile + ': ' + f.text + ' – ' + f.grund }));
    });
  }

  if (!vorschlaege.length) {
    box.append(el('p', { text: 'Keine Markierungen ohne ✔ gefunden. Es gibt nichts anzulegen.' }));
  }

  const ergebnis = el('div', { class: 'pk-vorschlag-ergebnis', 'aria-live': 'polite' });
  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const anlegen = el('button', { class: 'knopf', type: 'button', text: 'Angekreuzte anlegen' });
  anlegen.hidden = !vorschlaege.length;
  box.append(fehler, ergebnis, el('div', { class: 'form-knoepfe' },
    anlegen,
    el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Schließen', onclick: function () { box.remove(); if (opt.beiZu) opt.beiZu(); } })
  ));

  const NAMEN = { ToDos: ['ToDo', 'ToDos'], Learnings: ['Learning', 'Learnings'], Veranstaltungen: ['Termin', 'Termine'],
    Mitteilungen: ['Mitteilung', 'Mitteilungen'], Umfragen: ['Umfrage', 'Umfragen'] };

  // Bereiche, die schon geklappt haben (bei einem zweiten Versuch nicht doppelt anlegen)
  const erledigt = {};

  anlegen.addEventListener('click', async function () {
    fehler.textContent = '';
    ergebnis.textContent = '';
    const jeTab = {};
    for (let i = 0; i < vorschlaege.length; i++) {
      const v = vorschlaege[i];
      if (!v.haken.checked || erledigt[v.tabelle]) continue;
      const daten = v.lesen();
      if (daten.fehler) { fehler.textContent = daten.fehler; return; }
      if (!jeTab[v.tabelle]) jeTab[v.tabelle] = [];
      jeTab[v.tabelle].push(daten);
    }
    const tabs = Object.keys(jeTab);
    if (!tabs.length) { fehler.textContent = 'Nichts angekreuzt.'; return; }
    anlegen.disabled = true;
    anlegen.textContent = 'Lege an …';
    let allesGut = true;
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const n = jeTab[tab].length;
      try {
        await api('batchCreate', { tabelle: tab, liste: jeTab[tab] }, opt.token);
        erledigt[tab] = true;
        ergebnis.append(el('p', { text: '✔ ' + n + ' ' + (n === 1 ? NAMEN[tab][0] : NAMEN[tab][1]) + ' angelegt.' }));
      } catch (e) {
        if (opt.ctx.behandleFehler(e)) return;
        allesGut = false;
        ergebnis.append(el('p', { class: 'fehler', text: NAMEN[tab][1] + ': Fehler, bitte noch einmal (' + e.message + ').' }));
      }
    }
    // Merken: Die Vorschläge wurden angelegt (ohne Konfliktprüfung, wie ein Haken)
    try {
      await api('update', { tabelle: 'Protokolle', id: p.id, daten: { vorschlaege_erledigt: true } }, opt.token);
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
    }
    anlegen.textContent = 'Angelegt';
    toast(allesGut ? 'Einträge angelegt.' : 'Nicht alles hat geklappt, siehe unten.');
    if (!allesGut) { anlegen.disabled = false; anlegen.textContent = 'Angekreuzte anlegen'; }
    if (opt.beiFertig) opt.beiFertig();
  });

  return box;
}
