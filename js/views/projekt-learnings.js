// js/views/projekt-learnings.js
// Learnings: Aktionsart (frei, mit Vorschlägen aus bisherigen Einträgen) und Text.
// baueLearningTeil: Teil "Learnings" im Projekt. baueLearningUebersicht: alle, nach Aktionsart gruppiert.
// Learnings bleiben erhalten, auch wenn das Projekt gelöscht wird.
//
// opt: { ctx, token, projekt (nur Teil), holeDaten() -> { learnings, projekte },
//        offen, beiToggle(offen), neuLaden() -> Promise }

import { el, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA } from '../schema.js';

function neuesteZuerst(liste) {
  return liste.slice().sort(function (a, b) {
    return String(b.erstellt_am || '').localeCompare(String(a.erstellt_am || ''));
  });
}

// Alle bisherigen Aktionsarten (ohne doppelte, Groß/Klein egal)
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

async function speichern(opt, r, d, projektId, fenster) {
  d.projekt_id = projektId;
  try {
    if (!r) {
      await api('create', { tabelle: 'Learnings', daten: d }, opt.token);
      fenster.schliessen();
      toast('Learning gespeichert.');
    } else {
      const res = await api('update', {
        tabelle: 'Learnings', id: r.id, daten: d, bekannt: r.geaendert_am
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
  if (!window.confirm('Dieses Learning wirklich löschen?')) return;
  try {
    await api('delete', { tabelle: 'Learnings', id: r.id, bekannt: r.geaendert_am }, opt.token);
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

// r = null heißt neu. projektId = '' heißt ohne Projekt.
function formZeigen(opt, r, projektId, vorgabe) {
  let fenster = null;
  const form = baueFormular(SCHEMA.Learnings.felder, r || vorgabe || {}, {
    speichernText: r ? 'Speichern' : 'Anlegen',
    vorschlaege: { aktionsart: arten(opt.holeDaten().learnings || []) },
    onSpeichern: function (d) { return speichern(opt, r, d, projektId, fenster); },
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
  fenster = zeigeFenster(r ? 'Learning bearbeiten' : 'Neues Learning', inhalt);
}

// Eine Zeile. kopf = fetter Text (Aktionsart oder Projektname)
function zeile(opt, r, kopf) {
  return el('li', { class: 'dash-zeile' },
    el('button', {
      class: 'dash-todo pt-todo', type: 'button',
      onclick: function () { formZeigen(opt, r, txt(r.projekt_id)); }
    },
      el('strong', { text: kopf }),
      el('span', { class: 'leise notiz', text: txt(r.text) })
    )
  );
}

// Zeile in der Übersicht: Learning-Text fett, Projektname klein darunter
function zeileUebersicht(opt, r, projektName) {
  return el('li', { class: 'dash-zeile' },
    el('button', {
      class: 'dash-todo pt-todo', type: 'button',
      onclick: function () { formZeigen(opt, r, txt(r.projekt_id)); }
    },
      el('strong', { class: 'notiz', text: txt(r.text) }),
      el('span', { class: 'leise lern-projekt', text: projektName })
    )
  );
}

function aufklapper(opt, titel, info, body) {
  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: titel }),
      el('span', { class: 'leise', text: info })
    ),
    body
  );
  return teil;
}

function plusKnopf(fn) {
  return el('div', { class: 'teil-aktionen' },
    el('button', { class: 'knopf', type: 'button', text: '+ Learning', onclick: fn })
  );
}

// Teil "Learnings" im Projekt
export function baueLearningTeil(opt) {
  const pid = String(opt.projekt.id);
  const zeilen = neuesteZuerst((opt.holeDaten().learnings || []).filter(function (r) {
    return txt(r.projekt_id) === pid;
  }));
  const body = el('div', { class: 'projekt-teil-body' }, plusKnopf(function () {
    formZeigen(opt, null, pid, { aktionsart: txt(opt.projekt.aktionsart) });
  }));
  if (!zeilen.length) {
    body.append(el('p', {
      class: 'leise',
      text: 'Noch keine Learnings. Trage ein, was beim nächsten Mal besser laufen soll. ' +
        'Die Aktionsart (z. B. Demo, Infostand) kannst du frei wählen.'
    }));
  } else {
    body.append(el('ul', { class: 'dash-todo-liste' },
      ...zeilen.map(function (r) { return zeile(opt, r, txt(r.aktionsart)); })));
  }
  return aufklapper(opt, 'Learnings',
    zeilen.length ? zeilen.length + (zeilen.length === 1 ? ' Eintrag' : ' Einträge') : 'noch keine', body);
}

// Alle Learnings, nach Aktionsart gruppiert (Reiter Projekte)
export function baueLearningUebersicht(opt) {
  const d = opt.holeDaten();
  const alle = neuesteZuerst(d.learnings || []);
  const titel = {};
  (d.projekte || []).forEach(function (p) { titel[String(p.id)] = String(p.titel); });

  const gruppen = [];
  alle.forEach(function (r) {
    const a = txt(r.aktionsart) || 'Ohne Art';
    let g = gruppen.find(function (x) { return x.key === a.toLowerCase(); });
    if (!g) { g = { key: a.toLowerCase(), name: a, liste: [] }; gruppen.push(g); }
    g.liste.push(r);
  });
  gruppen.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });

  const body = el('div', { class: 'projekt-teil-body' }, plusKnopf(function () { formZeigen(opt, null, ''); }));
  if (!gruppen.length) {
    body.append(el('p', { class: 'leise', text: 'Noch keine Learnings. Im Projekt gibt es den Teil „Learnings“.' }));
  }
  gruppen.forEach(function (g) {
    body.append(
      el('h3', { class: 'teil-titel-klein', text: g.name + ' (' + g.liste.length + ')' }),
      el('ul', { class: 'dash-todo-liste' }, ...g.liste.map(function (r) {
        return zeileUebersicht(opt, r, titel[txt(r.projekt_id)] || 'Ohne Projekt');
      }))
    );
  });
  return aufklapper(opt, 'Learnings nach Aktionsart',
    alle.length ? alle.length + ' Einträge in ' + gruppen.length + (gruppen.length === 1 ? ' Art' : ' Arten') : 'noch keine',
    body);
}
