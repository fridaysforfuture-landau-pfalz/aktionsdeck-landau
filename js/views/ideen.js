// js/views/ideen.js
// Aktionsideen-Speicher: ruhiger Aufklapper im Reiter Projekte (unter den Learnings).
// "Als Projekt starten" öffnet das Formular "Neues Projekt" (vorausgefüllt, mit Standard-ToDos, Status planung).
// Ideen mit Projekt-ID werden nicht mehr gezeigt.
//
// opt: { ctx, token, holeDaten() -> { ideen, learnings }, offen, beiToggle(offen), neuLaden() -> Promise,
//        springe(projektId), projektAnlegen(vorgabe) }

import { el, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA } from '../schema.js';
import { kurz } from './todos-rechnen.js';

function neuesteZuerst(liste) {
  return liste.slice().sort(function (a, b) {
    return String(b.erstellt_am || '').localeCompare(String(a.erstellt_am || ''));
  });
}

// Bisherige Aktionsarten aus Ideen und Learnings (ohne doppelte)
function arten(liste) {
  const l = [];
  liste.forEach(function (r) {
    const a = txt(r.aktionsart);
    if (a && !l.some(function (x) { return x.toLowerCase() === a.toLowerCase(); })) l.push(a);
  });
  l.sort(function (a, b) { return a.localeCompare(b, 'de'); });
  return l;
}

function fehlerFuer(opt, e) {
  if (e.code === 'konflikt') {
    opt.neuLaden();
    return new Error('Jemand anderes hat diesen Eintrag gerade geändert. ' +
      'Klicke auf „Abbrechen“ und öffne ihn noch einmal.');
  }
  if (e.code === 'nicht_gefunden') {
    opt.neuLaden();
    return new Error('Diesen Eintrag gibt es nicht mehr. Klicke auf „Abbrechen“.');
  }
  return e;
}

async function speichern(opt, r, d, fenster) {
  try {
    if (!r) {
      await api('create', { tabelle: 'Ideen', daten: d }, opt.token);
      fenster.schliessen();
      toast('Idee gespeichert.');
    } else {
      const res = await api('update', {
        tabelle: 'Ideen', id: r.id, daten: d, bekannt: r.geaendert_am
      }, opt.token);
      fenster.schliessen();
      toast(res.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
    }
    opt.beiToggle(true);
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    throw fehlerFuer(opt, e);
  }
}

async function loeschen(opt, r, fenster) {
  if (!window.confirm('Diese Idee wirklich löschen?\n\n„' + txt(r.titel) + '“')) return;
  try {
    await api('delete', { tabelle: 'Ideen', id: r.id, bekannt: r.geaendert_am }, opt.token);
    fenster.schliessen();
    toast('Gelöscht.');
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'konflikt') {
      toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
      opt.neuLaden();
    } else {
      toast(e.message);
    }
  }
}

// Aus der Idee ein Projekt in Planung machen
async function starten(opt, r) {
  // Normalfall: Formular „Neues Projekt“ mit den Werten der Idee (dort gibt es die Standard-ToDos)
  if (opt.projektAnlegen) {
    opt.projektAnlegen({
      titel: txt(r.titel), beschreibung: txt(r.beschreibung), aktionsart: txt(r.aktionsart), status: 'planung'
    });
    return;
  }
  if (!window.confirm('Aus der Idee „' + txt(r.titel) + '“ ein Projekt in Planung machen?\n\n' +
    'Die Idee bleibt in der Liste.')) return;
  let o;
  try {
    o = await api('create', {
      tabelle: 'Projekte',
      daten: {
        titel: txt(r.titel),
        beschreibung: txt(r.beschreibung),
        aktionsart: txt(r.aktionsart),
        status: 'planung'
      }
    }, opt.token);
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    toast(e.message);
    return;
  }
  toast('Projekt in Planung angelegt.');
  await opt.neuLaden();
  if (opt.springe) opt.springe(o.id);
}

// r = null heißt neu
function formZeigen(opt, r) {
  let fenster = null;
  const d = opt.holeDaten();
  const form = baueFormular(SCHEMA.Ideen.felder, r || {}, {
    speichernText: r ? 'Speichern' : 'Anlegen',
    vorschlaege: { aktionsart: arten((d.ideen || []).concat(d.learnings || [])) },
    onSpeichern: function (x) { return speichern(opt, r, x, fenster); },
    onAbbrechen: function () { fenster.schliessen(); }
  });
  const inhalt = el('div', null, form);
  if (r) {
    inhalt.append(el('div', { class: 'fenster-loeschen' },
      el('button', {
        class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(opt, r, fenster); }
      })
    ));
  }
  fenster = zeigeFenster(r ? 'Idee bearbeiten' : 'Neue Idee', inhalt);
}

function zeile(opt, r) {
  const info = [txt(r.aktionsart), kurz(r.beschreibung, 100)].filter(Boolean).join(' · ');
  return el('li', { class: 'dash-zeile mit-hut' },
    el('button', {
      class: 'dash-todo pt-todo', type: 'button',
      onclick: function () { formZeigen(opt, r); }
    },
      el('strong', { text: txt(r.titel) }),
      info ? el('span', { class: 'leise', text: info }) : null
    ),
    el('div', { class: 'hut-knoepfe' },
      el('button', {
        class: 'knopf knopf-klein', type: 'button', text: 'Als Projekt starten',
        onclick: function () { starten(opt, r); }
      })
    )
  );
}

export function baueIdeenTeil(opt) {
  const zeilen = neuesteZuerst(opt.holeDaten().ideen || []);
  const body = el('div', { class: 'projekt-teil-body' },
    el('div', { class: 'teil-aktionen' },
      el('button', {
        class: 'knopf', type: 'button', text: '+ Idee',
        onclick: function () { formZeigen(opt, null); }
      })
    )
  );
  if (!zeilen.length) {
    body.append(el('p', {
      class: 'leise',
      text: 'Noch keine Ideen. Hier sammelst du Ideen für spätere Aktionen. ' +
        'Mit „Als Projekt starten“ wird daraus ein Projekt in Planung.'
    }));
  } else {
    body.append(el('ul', { class: 'dash-todo-liste' }, ...zeilen.map(function (r) { return zeile(opt, r); })));
  }

  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Aktionsideen' }),
      el('span', {
        class: 'leise',
        text: zeilen.length ? zeilen.length + (zeilen.length === 1 ? ' Idee' : ' Ideen') : 'noch keine'
      })
    ),
    body
  );
  return teil;
}
