// js/views/kalender.js
// Reiter Kalender: Liste "Kommende" und "Vergangene", Filterleiste, Suche.
// Veranstaltungen anlegen, ändern und löschen (mit Uhrzeit und mehreren Tagen).
// Die Termine werden in kalender-rechnen.js berechnet, hier wird nur angezeigt und gespeichert.
// Die Filter bleiben beim Reiterwechsel erhalten (Merker außerhalb von render).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { zeitText as stempelText } from './material-rechnen.js';
import { normDatum, heuteIso } from './todos-rechnen.js';
import {
  baueTermine, filtereTermine, kommende, vergangene, standardFilter,
  zeitNorm, zeitText, datumsText, sichereUrl, MONATE
} from './kalender-rechnen.js';

// Bleibt beim Reiterwechsel erhalten. Neue Anmeldung (anderes Token) = zurückgesetzt.
let merk = { token: '', filter: null, alteAuf: false };

const MAX_VERGANGEN = 30;

// Schalter in der Filterleiste: [Schlüssel im Filter, Text]
const SCHALTER = [
  ['intern', 'Intern'],
  ['extern', 'Extern'],
  ['projekte', 'Projekte'],
  ['deadlines', 'Deadlines'],
  ['meilensteine', 'Meilensteine'],
  ['todos', 'ToDos'],
  ['nurMeine', 'Nur meine ToDos']
];

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function markeText(t) {
  if (t.quelle === 'veranstaltung') return t.art === 'extern' ? 'Extern' : 'Intern';
  if (t.quelle === 'aktion') return 'Projekt-Aktion';
  if (t.quelle === 'deadline') return 'Deadline';
  if (t.quelle === 'meilenstein') return 'Meilenstein';
  if (t.quelle === 'todo') return 'ToDo';
  return '';
}

function monatVon(tag) {
  const m = Number(String(tag).slice(5, 7));
  return (MONATE[m - 1] || '') + ' ' + String(tag).slice(0, 4);
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  if (merk.token !== s.token) {
    merk = { token: s.token, filter: standardFilter(getName()), alteAuf: false };
  }
  const f = merk.filter;
  f.name = getName();
  const basis = '#/g/' + encodeURIComponent(s.kurzname) + '/';

  let daten = { veranstaltungen: [], projekte: [], meilensteine: [], todos: [] };
  let meta = null;
  let offline = false;

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const filterBox = el('div', { class: 'kal-filter' });
  const kommBox = el('div');
  const vergBox = el('div');

  const neuKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Veranstaltung',
    onclick: function () { formZeigen(null); }
  });

  SCHALTER.forEach(function (sch) {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = !!f[sch[0]];
    cb.addEventListener('change', function () {
      f[sch[0]] = cb.checked;
      zeichne();
    });
    filterBox.append(el('label', { class: 'formfeld-bool' }, cb, el('span', { text: sch[1] })));
  });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Kalender' }), neuKnopf),
    suche,
    filterBox,
    status,
    el('h2', { class: 'liste-titel', text: 'Kommende Termine' }),
    kommBox,
    vergBox
  ));

  // ---- Zeichnen ----

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? 'Stand ' + stempelText(meta.stand)
      : 'Zwischengespeichert von ' + stempelText(meta.stand) + '. Aktualisiere …';
  }

  function zeile(t) {
    const istV = t.quelle === 'veranstaltung';
    const mitProjekt = (t.quelle === 'meilenstein' || t.quelle === 'todo') && t.projektTitel;
    const info = [
      datumsText(t),
      zeitText(t),
      t.ort,
      mitProjekt ? 'Projekt: ' + t.projektTitel : '',
      t.verantwortlich
    ].filter(Boolean).join(' · ');

    const knopf = el('button', {
      class: 'dash-todo pt-todo', type: 'button',
      onclick: function () {
        if (istV) formZeigen(t.roh);
        else if (t.link) location.hash = t.link;
      }
    },
      el('span', { class: 'kal-marke leise', text: markeText(t) }),
      el('strong', { text: t.titel }),
      info ? el('span', { class: 'leise', text: info }) : null
    );

    const li = el('li', { class: 'dash-zeile kal-zeile' }, knopf);
    li.style.borderLeftColor = t.farbe;
    if (t.url) {
      li.append(el('a', {
        class: 'kal-link', href: t.url, target: '_blank', rel: 'noopener noreferrer',
        text: 'Link öffnen'
      }));
    }
    return li;
  }

  function listeMitMonaten(termine) {
    const box = el('div');
    let monat = '';
    let ul = null;
    termine.forEach(function (t) {
      const m = monatVon(t.von);
      if (m !== monat) {
        monat = m;
        box.append(el('h3', { class: 'teil-titel-klein', text: m }));
        ul = el('ul', { class: 'dash-todo-liste' });
        box.append(ul);
      }
      ul.append(zeile(t));
    });
    return box;
  }

  function zeichne() {
    const termine = baueTermine(daten, {
      basis: basis, farbe: s.farbe, eigeneKurz: s.kurzname
    });
    let liste = filtereTermine(termine, f);
    const q = suche.value.trim().toLowerCase();
    if (q) {
      liste = liste.filter(function (t) {
        return [t.titel, t.ort, t.projektTitel, t.verantwortlich].join(' ').toLowerCase().indexOf(q) >= 0;
      });
    }
    const komm = kommende(liste);
    const verg = vergangene(liste);

    leeren(kommBox);
    if (!komm.length) {
      kommBox.append(el('p', {
        class: 'leise',
        text: daten.veranstaltungen.length || termine.length
          ? 'Keine kommenden Termine gefunden.'
          : 'Noch keine Termine. Mit „+ Veranstaltung“ legst du den ersten an.'
      }));
    } else {
      kommBox.append(listeMitMonaten(komm));
    }

    leeren(vergBox);
    vergBox.hidden = !verg.length;
    if (verg.length) {
      const d = el('details', { class: 'projekt-teil' });
      if (merk.alteAuf) d.open = true;
      d.addEventListener('toggle', function () { merk.alteAuf = d.open; });
      const gezeigt = verg.slice(0, MAX_VERGANGEN);
      d.append(
        el('summary', null,
          el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
          el('strong', { text: 'Vergangene Termine' }),
          el('span', { class: 'leise', text: String(verg.length) })
        ),
        el('div', { class: 'projekt-teil-body' },
          el('ul', { class: 'dash-todo-liste' }, ...gezeigt.map(zeile)),
          verg.length > MAX_VERGANGEN
            ? el('p', {
              class: 'leise',
              text: '… und ' + (verg.length - MAX_VERGANGEN) + ' ältere. Mit der Suche findest du sie.'
            })
            : null
        )
      );
      vergBox.append(d);
    }
    statusZeigen();
  }

  // ---- Veranstaltung: Formular (v = null heißt neu) ----

  function formZeigen(v) {
    let fenster = null;
    const start = v
      ? Object.assign({}, v, {
        datum: normDatum(v.datum),
        datum_ende: normDatum(v.datum_ende),
        zeit_von: zeitNorm(v.zeit_von),
        zeit_bis: zeitNorm(v.zeit_bis),
        oeffentlich: istWahr(v.oeffentlich)
      })
      : { art: 'intern', datum: heuteIso(), oeffentlich: false };

    const form = baueFormular(SCHEMA.Veranstaltungen.felder, start, {
      speichernText: v ? 'Speichern' : 'Anlegen',
      onSpeichern: function (d) { return speichern(v, d, fenster); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    const inhalt = el('div', null, form);
    if (v) {
      inhalt.append(el('div', { class: 'fenster-loeschen' },
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(v, fenster); }
        })
      ));
    }
    fenster = zeigeFenster(v ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung', inhalt);
  }

  async function speichern(v, d, fenster) {
    if (d.art !== 'intern' && d.art !== 'extern') throw new Error('Bitte die Art wählen.');
    if (d.datum_ende && d.datum_ende < d.datum) {
      throw new Error('Der letzte Tag darf nicht vor dem ersten Tag liegen.');
    }
    if (d.datum_ende === d.datum) d.datum_ende = '';
    if (d.zeit_bis && !d.zeit_von) throw new Error('Bitte auch „Uhrzeit von“ eintragen.');
    if (d.zeit_von && d.zeit_bis && !d.datum_ende && d.zeit_bis <= d.zeit_von) {
      throw new Error('„Uhrzeit bis“ muss nach „Uhrzeit von“ liegen.');
    }
    if (d.link && !sichereUrl(d.link)) {
      throw new Error('Der Link muss mit https:// oder http:// beginnen.');
    }
    if (d.oeffentlich && d.art !== 'extern') {
      throw new Error('„Öffentlich“ geht nur bei Art „extern“.');
    }
    try {
      if (!v) {
        await api('create', { tabelle: 'Veranstaltungen', daten: d }, s.token);
        toast('Veranstaltung angelegt.');
      } else {
        const r = await api('update', {
          tabelle: 'Veranstaltungen', id: v.id, daten: d, bekannt: v.geaendert_am
        }, s.token);
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      fenster.schliessen();
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        laden(false);
        throw new Error('Jemand anderes hat diese Veranstaltung gerade geändert. ' +
          'Klicke auf „Abbrechen“ und öffne sie noch einmal.');
      }
      if (e.code === 'nicht_gefunden') {
        laden(false);
        throw new Error('Diese Veranstaltung gibt es nicht mehr. Klicke auf „Abbrechen“.');
      }
      throw e;
    }
  }

  async function loeschen(v, fenster) {
    if (!window.confirm('Diese Veranstaltung wirklich löschen?\n\n„' + txt(v.titel) + '“')) return;
    try {
      await api('delete', { tabelle: 'Veranstaltungen', id: v.id, bekannt: v.geaendert_am }, s.token);
      fenster.schliessen();
      toast('Gelöscht.');
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    if (!neu.veranstaltungen) neu.veranstaltungen = [];
    if (!neu.projekte) neu.projekte = [];
    if (!neu.meilensteine) neu.meilensteine = [];
    if (!neu.todos) neu.todos = [];
    daten = neu;
    meta = m;
    offline = false;
    zeichne();
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':kalender',
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Veranstaltungen', 'Projekte', 'Meilensteine', 'ToDos']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            veranstaltungen: t.Veranstaltungen || [],
            projekte: t.Projekte || [],
            meilensteine: t.Meilensteine || [],
            todos: t.ToDos || []
          };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        offline = true;
        statusZeigen();
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}
