// js/views/start-brett.js
// Schwarzes Brett auf dem Start: angeheftete Mitteilungen der Gruppe (z. B. Plenumszeit).
// Nicht angeheftete stehen im Archiv (mit Suche und Anheften). Tab Mitteilungen: titel, text, angeheftet.
// opt: { ctx, token, mitteilungen, neuLaden() -> Promise }

import { el, leeren, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA, istWahr } from '../schema.js';
import { datumText } from './todos-rechnen.js';
import { pastell } from './kalender-rechnen.js';
import { istDunkel } from '../ui/darstellung.js';

function norm(v) {
  return txt(v).replace(/\s+/g, ' ').toLowerCase();
}

function farbeOk(f) {
  return /^#[0-9a-fA-F]{6}$/.test(txt(f));
}

function neuesteZuerst(a, b) {
  return String(b.erstellt_am || '').localeCompare(String(a.erstellt_am || ''));
}

// Gibt es schon eine Mitteilung mit diesem Text? (angeheftete zuerst)
export function findeMitteilung(liste, text) {
  const n = norm(text);
  if (!n) return null;
  const treffer = (liste || []).filter(function (m) {
    return norm(m.text) === n || (!norm(m.text) && norm(m.titel) === n);
  });
  return treffer.find(function (m) { return istWahr(m.angeheftet); }) || treffer[0] || null;
}

export function anzahlNichtAngeheftet(liste) {
  return (liste || []).filter(function (m) { return !istWahr(m.angeheftet); }).length;
}

async function anheften(m, wert, opt) {
  try {
    await api('update', { tabelle: 'Mitteilungen', id: m.id, daten: { angeheftet: wert } }, opt.token);
    toast(wert ? 'Oben angeheftet.' : 'Nicht mehr angeheftet.');
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    toast(e.message);
  }
}

// ---- Anlegen, Ändern, Löschen (m = null heißt neu) ----
// nachher: wird nach dem Anlegen einmal aufgerufen (z. B. um einen Kommentar zu markieren)

function formZeigen(m, opt, vorgabe, nachher) {
  let fenster = null;
  const form = baueFormular(SCHEMA.Mitteilungen.felder, m || vorgabe || { angeheftet: true }, {
    speichernText: m ? 'Speichern' : 'Veröffentlichen',
    onSpeichern: function (d) {
      if (!m && vorgabe && vorgabe.farbe) d.farbe = vorgabe.farbe;
      return speichern(m, d, fenster, opt, nachher);
    },
    onAbbrechen: function () { fenster.schliessen(); }
  });
  const inhalt = el('div', null, form);
  if (m) {
    inhalt.append(el('div', { class: 'fenster-loeschen' },
      el('button', {
        class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(m, fenster, opt); }
      })
    ));
  }
  fenster = zeigeFenster(m ? 'Mitteilung bearbeiten' : 'Neue Mitteilung', inhalt);
}

async function speichern(m, d, fenster, opt, nachher) {
  try {
    if (!m) {
      await api('create', { tabelle: 'Mitteilungen', daten: d }, opt.token);
      toast('Mitteilung veröffentlicht.');
      if (nachher) await nachher();
    } else {
      const r = await api('update', {
        tabelle: 'Mitteilungen', id: m.id, daten: d, bekannt: m.geaendert_am
      }, opt.token);
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
    }
    fenster.schliessen();
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
      opt.neuLaden();
      throw new Error('Jemand anderes hat diese Mitteilung gerade geändert oder gelöscht. ' +
        'Klicke auf „Abbrechen“ und öffne sie noch einmal.');
    }
    throw e;
  }
}

async function loeschen(m, fenster, opt) {
  if (!window.confirm('Diese Mitteilung wirklich löschen?\n\n„' + txt(m.titel) + '“')) return;
  try {
    await api('delete', { tabelle: 'Mitteilungen', id: m.id, bekannt: m.geaendert_am }, opt.token);
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

// ---- Zeichnen ----

function mitteilung(m, opt) {
  const fest = istWahr(m.angeheftet);
  const wer = [txt(m.erstellt_von), m.erstellt_am ? datumText(m.erstellt_am) : '']
    .filter(Boolean).join(' · ');
  const box = el('div', { class: 'mitteilung' + (fest ? ' angeheftet' : '') },
    el('div', { class: 'mitteilung-kopf' },
      el('div', { class: 'umfrage-titel' },
        el('strong', { text: (fest ? '📌 ' : '') + txt(m.titel) }),
        el('span', { class: 'leise', text: wer })
      ),
      el('div', { class: 'hut-knoepfe' },
        el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button',
          text: fest ? 'Lösen' : 'Anheften',
          onclick: function () { anheften(m, !fest, opt); }
        }),
        el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Bearbeiten',
          onclick: function () { formZeigen(m, opt); }
        })
      )
    ),
    txt(m.text) ? el('p', { class: 'notiz', text: txt(m.text) }) : null
  );
  // Veranstaltung: Rand und Hintergrund in der Veranstaltungsfarbe, Layout bleibt gleich
  if (farbeOk(m.farbe)) {
    box.style.borderLeftColor = txt(m.farbe);
    box.style.background = pastell(txt(m.farbe), istDunkel());
  }
  return box;
}

// Kachel auf dem Start: nur angeheftete. Gibt es keine, bleibt die Kachel versteckt.
export function zeichneBrett(box, opt) {
  leeren(box);
  const fest = opt.mitteilungen.filter(function (m) { return istWahr(m.angeheftet); }).sort(neuesteZuerst);
  box.hidden = !fest.length;
  if (box.hidden) return;

  const karte = el('section', { class: 'karte dash-kachel' },
    el('div', { class: 'dash-kachel-titel' },
      el('h2', { text: 'Schwarzes Brett' })
    )
  );
  fest.forEach(function (m) { karte.append(mitteilung(m, opt)); });
  box.append(karte);
}

// Archiv: nicht angeheftete Mitteilungen mit Suche (bleibt beim Neuzeichnen erhalten)
let archivSuche = '';
const MAX_ALT = 10;   // so viele stehen ohne Suche da (der Rest über die Suche)

export function zeichneBrettArchiv(box, opt) {
  leeren(box);
  const normal = opt.mitteilungen.filter(function (m) { return !istWahr(m.angeheftet); }).sort(neuesteZuerst);
  if (!normal.length) {
    box.append(el('p', {
      class: 'leise',
      text: 'Es gibt keine nicht angehefteten Mitteilungen. Was du löst, steht hier.'
    }));
    return;
  }

  const liste = el('div');
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Mitteilungen durchsuchen …',
    'aria-label': 'Nicht angeheftete Mitteilungen durchsuchen'
  });
  suche.value = archivSuche;

  function fuellen() {
    leeren(liste);
    archivSuche = suche.value;
    const q = suche.value.trim().toLowerCase();
    const treffer = normal.filter(function (m) {
      return !q || (txt(m.titel) + ' ' + txt(m.text)).toLowerCase().indexOf(q) >= 0;
    });
    const gezeigt = q ? treffer : treffer.slice(0, MAX_ALT);
    gezeigt.forEach(function (m) { liste.append(mitteilung(m, opt)); });
    if (!treffer.length) {
      liste.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
    } else if (!q && treffer.length > MAX_ALT) {
      liste.append(el('p', {
        class: 'leise',
        text: '… und ' + (treffer.length - MAX_ALT) + ' ältere. Mit der Suche findest du sie.'
      }));
    }
  }

  suche.addEventListener('input', fuellen);
  fuellen();
  box.append(suche, liste);
}

// Für den Knopf oben auf dem Start
export function neueMitteilung(opt) {
  formZeigen(null, opt);
}

// Aus einem Pinnwand-Kommentar eine angeheftete Mitteilung machen (Formular ist vorausgefüllt).
// nachher wird nach dem Anlegen aufgerufen.
export function mitteilungAus(opt, titel, text, nachher, farbe) {
  formZeigen(null, opt, { titel: titel, text: text, angeheftet: true, farbe: farbe || '' }, nachher);
}
