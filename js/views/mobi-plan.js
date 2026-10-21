// js/views/mobi-plan.js
// Teil "Mobi" eines Projekts: Analyse (Zielgruppe, Art der Werbung, Ziel, Aufruf),
// Zeile mit der Anzahl Beiträge je Kanal und Beitragsliste mit Haken "veröffentlicht".
//
// opt: { ctx, token, projekt, holeDaten() -> { mobi, todos }, arbeitet (Objekt),
//        offen, beiToggle(offen), neuZeichnen(), neuLaden() -> Promise, merken() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { kanaeleFuer, kanalInfo } from '../kanaele.js';
import {
  istVeroeffentlicht, faelligStatus, sortiereBeitraege, beitragInfo
} from './mobi-rechnen.js';
import { zeigeBeitragFormular } from './mobi-eintrag.js';

const ANALYSE = [
  { name: 'zielgruppe', label: 'Zielgruppe (wen wollen wir erreichen?)', typ: 'langtext' },
  { name: 'werbeart', label: 'Art der Werbung', typ: 'langtext' },
  { name: 'kampagnenziel', label: 'Kampagnenziel (was soll erreicht werden?)', typ: 'langtext' },
  { name: 'handlungsaufruf', label: 'Aufruf zum Handeln (was sollen die Leute tun?)', typ: 'langtext' }
];

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

export function baueMobiTeil(opt) {
  const ctx = opt.ctx;
  const token = opt.token;
  const p = opt.projekt;
  const pid = String(p.id);
  const kurzname = ctx.session.kurzname;

  function daten() { return opt.holeDaten(); }

  const alle = sortiereBeitraege((daten().mobi || []).filter(function (b) {
    return txt(b.projekt_id) === pid;
  }));
  const fertigAnzahl = alle.filter(istVeroeffentlicht).length;

  function knopf(text, hell, fn) {
    return el('button', {
      class: 'knopf' + (hell ? ' knopf-hell' : ''), type: 'button', text: text, onclick: fn
    });
  }

  function personen() {
    const liste = [];
    const merke = function (n) {
      const k = txt(n);
      if (k && liste.indexOf(k) < 0) liste.push(k);
    };
    merke(getName());
    alle.forEach(function (b) { merke(b.verantwortlich); });
    (daten().todos || []).forEach(function (t) {
      if (txt(t.projekt_id) === pid) merke(t.verantwortlich);
    });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  const formOpt = {
    ctx: ctx,
    token: token,
    kurzname: kurzname,
    projektId: pid,
    personen: personen,
    todosVon: function (b) {
      return (daten().todos || []).filter(function (t) { return txt(t.mobi_id) === String(b.id); });
    },
    todoAnzahl: function (b) {
      return (daten().todos || []).filter(function (t) { return txt(t.mobi_id) === String(b.id); }).length;
    },
    neuLaden: function () { return opt.neuLaden(); },
    beiFertig: function () { opt.beiToggle(true); return opt.neuLaden(); }
  };

  // ---- Analyse ----

  function analyseBearbeiten() {
    let fenster = null;
    const form = baueFormular(ANALYSE, p, {
      speichernText: 'Speichern',
      onSpeichern: async function (d) {
        try {
          const r = await api('update', {
            tabelle: 'Projekte', id: p.id, daten: d, bekannt: p.geaendert_am
          }, token);
          if (r && r.eintrag) Object.assign(p, r.eintrag);
          fenster.schliessen();
          toast(r.geaendert ? 'Analyse gespeichert.' : 'Nichts geändert.');
          opt.beiToggle(true);
          await opt.neuLaden();
        } catch (e) {
          if (ctx.behandleFehler(e)) return;
          if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
            opt.neuLaden();
            throw new Error('Jemand anderes hat dieses Projekt gerade geändert. ' +
              'Klicke auf „Abbrechen“ und öffne es noch einmal.');
          }
          throw e;
        }
      },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    fenster = zeigeFenster('Analyse: ' + txt(p.titel), form);
  }

  function analyseAnzeige() {
    const dl = el('dl', { class: 'detail-liste mobi-analyse' });
    let n = 0;
    ANALYSE.forEach(function (f) {
      if (!txt(p[f.name])) return;
      n += 1;
      dl.append(el('dt', { text: f.label.split(' (')[0] }), el('dd', { text: txt(p[f.name]) }));
    });
    if (!n) {
      return el('p', {
        class: 'leise',
        text: 'Noch keine Analyse. Trage Zielgruppe, Art der Werbung, Ziel und Aufruf ein.'
      });
    }
    return dl;
  }

  // ---- Kanäle: Anzahl Beiträge je Kanal (nur Kanäle mit Beiträgen) ----

  function kanalZeile() {
    // Reihenfolge wie in kanaele.js, unbekannte Kanalnamen (alte Daten) danach
    const namen = kanaeleFuer(kurzname).map(function (k) { return k.name; });
    const anzahl = {};
    alle.forEach(function (b) {
      const n = kanalInfo(b.kanal).name || 'Ohne Kanal';
      if (!anzahl[n]) {
        anzahl[n] = 0;
        if (namen.indexOf(n) < 0) namen.push(n);
      }
      anzahl[n] += 1;
    });
    const zeile = el('p', { class: 'mobi-kanaele' }, el('span', { text: 'Kanäle: ' }));
    namen.filter(function (n) { return anzahl[n]; }).forEach(function (n, i) {
      const punkt = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
      punkt.style.background = kanalInfo(n).farbe;
      if (i) zeile.append(el('span', { text: ' · ' }));
      zeile.append(el('span', { class: 'mobi-kanal-zahl' }, punkt, el('span', { text: n + ' ' + anzahl[n] })));
    });
    return zeile;
  }

  // ---- Beiträge ----

  async function veroeffentlichtSetzen(b, wert) {
    const id = 'b' + String(b.id);
    if (opt.arbeitet[id]) return;
    opt.arbeitet[id] = true;
    const alt = b.status;
    b.status = wert ? 'veroeffentlicht' : 'bereit';
    opt.neuZeichnen();
    let nachladen = false;
    try {
      const r = await api('update', {
        tabelle: 'Mobi_Plan', id: b.id, daten: { status: b.status }
      }, token);
      if (r && r.eintrag) Object.assign(b, r.eintrag);
      opt.merken();
    } catch (e) {
      b.status = alt;
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Diesen Beitrag gibt es nicht mehr.');
          nachladen = true;
        } else {
          toast(e.message);
        }
      }
    }
    delete opt.arbeitet[id];
    opt.neuZeichnen();
    if (nachladen) opt.neuLaden();
  }

  function beitragZeile(b) {
    const fertig = istVeroeffentlicht(b);
    const st = faelligStatus(b);
    const k = kanalInfo(b.kanal);

    const cb = el('input', {
      type: 'checkbox', class: 'auswahl-box', 'aria-label': txt(b.titel) + ' veröffentlicht'
    });
    cb.checked = fertig;
    cb.addEventListener('change', function () { veroeffentlichtSetzen(b, cb.checked); });

    const klassen = ['dash-todo', 'pt-todo'];
    if (fertig) klassen.push('erledigt');
    const li = el('li', { class: 'dash-zeile' + (fertig ? ' erledigt' : '') },
      cb,
      el('button', {
        class: klassen.join(' '), type: 'button',
        onclick: function () { zeigeBeitragFormular(formOpt, b); }
      },
        el('strong', { class: st ? 'mobi-titel-' + st : '', text: txt(b.titel) }),
        el('span', { class: 'leise', text: beitragInfo(b) })
      )
    );
    li.style.borderLeft = '6px solid ' + k.farbe;
    return li;
  }

  // ---- Zusammenbauen ----

  const body = el('div', { class: 'projekt-teil-body' },
    el('div', { class: 'teil-aktionen' },
      knopf('+ Beitrag', false, function () { zeigeBeitragFormular(formOpt, null); }),
      knopf('Analyse bearbeiten', true, analyseBearbeiten)
    ),
    analyseAnzeige(),
    el('h3', { class: 'teil-titel-klein', text: 'Beiträge' })
  );
  if (!alle.length) {
    body.append(el('p', {
      class: 'leise',
      text: 'Noch keine Beiträge. Mit „+ Beitrag“ planst du, was wann auf welchem Kanal erscheint.'
    }));
  } else {
    body.append(kanalZeile(), el('ul', { class: 'dash-todo-liste' }, ...alle.map(beitragZeile)));
  }

  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Mobi' }),
      el('span', {
        class: 'leise',
        text: alle.length
          ? alle.length + (alle.length === 1 ? ' Beitrag' : ' Beiträge') + ' · ' + fertigAnzahl + ' veröffentlicht'
          : 'noch keine Beiträge'
      })
    ),
    body
  );
  return teil;
}
