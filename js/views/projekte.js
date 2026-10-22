// js/views/projekte.js
// Reiter Projekte: oben die Übersicht (mit Fortschrittsbalken), darunter ein aufklappbarer Block je Projekt.
// Laufende Projekte (Aktiv) stehen oben, Projekte in Planung getrennt darunter.
// Anlegen, Bearbeiten und Löschen laufen in kleinen Fenstern. Löschen nimmt alles Zugehörige mit.
// Im Block: Teil "Team und Hüte" (projekt-team.js) und Teil "ToDos" mit Meilensteinen (projekt-todos.js).
// Weitere Teile folgen in 4.4 bis 4.6.
// Die Auswahl (aufgeklappte Projekte und Teile) bleibt beim Reiterwechsel erhalten.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { zeigeFenster } from '../ui/fenster.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA, istWahr } from '../schema.js';
import { zeitText, ausgeliehenProjekt, istVerbrauch } from './material-rechnen.js';
import { datumText } from './todos-rechnen.js';
import {
  statusText, istAbgeschlossen, fortschritt, fortschrittText, sortiereProjekte, terminText
} from './projekt-rechnen.js';
import { baueTodoTeil } from './projekt-todos.js';
import { baueMaterialTeil } from './projekt-material.js';
import { baueFinanzTeil } from './projekt-finanzen.js';
import { baueLearningTeil, baueLearningUebersicht } from './projekt-learnings.js';
import { baueRedenTeil } from './projekt-reden.js';
import { baueIdeenTeil } from './ideen.js';
import { baueMobiTeil } from './mobi-plan.js';
import { STANDARD_TODOS, faelligAus } from '../vorlagen.js';

// Bleibt beim Reiterwechsel erhalten. Neue Anmeldung (anderes Token) = leer.
// offen: aufgeklappte Projekte. teile: aufgeklappte Teile ("<id>:todos", "<id>:team").
let merk = { token: '', offen: {}, teile: {} };

// Was beim Löschen eines Projekts mitgelöscht wird (Tab, Anzeigename)
const TEILE = [
  ['ToDos', 'ToDos'],
  ['Meilensteine', 'Meilensteine'],
  ['Projekt_Team', 'Teammitglieder'],
  ['Projekt_Material', 'Material-Positionen'],
  ['Finanzen', 'Finanz-Posten'],
  ['Kommentare', 'Kommentare'],
  ['Posts', 'Posts'],
  ['Mobi_Plan', 'Mobi-Beiträge']
];

function paare(liste) {
  const dl = el('dl', { class: 'detail-liste' });
  liste.forEach(function (p) {
    if (p[1] === '' || p[1] === undefined || p[1] === null) return;
    dl.append(el('dt', { text: p[0] }), el('dd', { text: String(p[1]) }));
  });
  return dl;
}

function euro(v) {
  if (v === '' || v === undefined || v === null) return '';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
}

// Planung = Vorbereitung (auch wenn der Status leer ist)
function istPlanung(p) {
  return (String(p.status || '').trim() || 'planung') === 'planung';
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  if (merk.token !== s.token) merk = { token: s.token, offen: {}, teile: {} };
  const offen = merk.offen;

  let daten = { projekte: [], todos: [], meilensteine: [], team: [], material: [], ausleihe: [], pm: [], fin: [], learnings: [], ideen: [], kommentare: [], mobi: [] };
  let archivModus = false;
  let sprungId = ctx.unter || '';   // von der Start-Kachel: dieses Projekt aufklappen
  let letzteJson = '';
  let meta = null;
  let offline = false;
  const bloecke = {};               // id -> Element, zum Hinspringen
  const arbeitet = {};              // laufende Häkchen (dann keine Aktualisierung)

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const wahl = el('select', { class: 'feld', 'aria-label': 'Projekt anzeigen' });
  const uebersicht = el('section', { class: 'karte projekt-uebersicht' });
  const box = el('div');
  const learnBox = el('div');
  const ideenBox = el('div');

  const archivKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Archiv',
    onclick: function () { archivModus = !archivModus; zeichne(); }
  });
  const neuKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Neu',
    onclick: function () { formZeigen(null); }
  });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Projekte' }),
      el('div', { class: 'kopf-knoepfe' }, archivKnopf, neuKnopf)
    ),
    el('div', { class: 'projekt-zwei' }, uebersicht, el('div', null, learnBox, ideenBox)),
    el('div', { class: 'filterzeile filter-projekte' }, suche, wahl),
    status,
    box
  ));

  // ---- Hilfen ----

  // Alle bisherigen Aktionsarten (Projekte, Learnings, Ideen), ohne doppelte
  function aktionsarten() {
    const l = [];
    daten.learnings.concat(daten.ideen, daten.projekte).forEach(function (r) {
      const a = String(r.aktionsart || '').trim();
      if (a && !l.some(function (x) { return x.toLowerCase() === a.toLowerCase(); })) l.push(a);
    });
    l.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return l;
  }

  // Rechts neben den Projektdaten: Learnings und Aktionsideen mit derselben Aktionsart
  function aehnliche(p) {
    const box = el('div', { class: 'projekt-aehnlich' });
    const art = String(p.aktionsart || '').trim().toLowerCase();
    if (!art) return box;
    const gleich = function (r) { return String(r.aktionsart || '').trim().toLowerCase() === art; };
    const titel = {};
    daten.projekte.forEach(function (x) { titel[String(x.id)] = String(x.titel); });
    const id = String(p.id);

    function teil(key, name, liste, zeileFn) {
      if (!liste.length) return;
      const d = el('details', { class: 'projekt-teil' });
      if (merk.teile[key]) d.open = true;
      d.addEventListener('toggle', function () {
        if (d.open) merk.teile[key] = true;
        else delete merk.teile[key];
      });
      d.append(
        el('summary', null,
          el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
          el('strong', { text: name }),
          el('span', { class: 'leise', text: liste.length + ' · ' + String(p.aktionsart) })
        ),
        el('div', { class: 'projekt-teil-body' },
          el('ul', { class: 'dash-todo-liste' }, ...liste.map(zeileFn)))
      );
      box.append(d);
    }

    teil(id + ':aehnL', 'Learnings', daten.learnings.filter(gleich), function (r) {
      return el('li', { class: 'dash-zeile' },
        el('div', { class: 'dash-todo' },
          el('strong', { class: 'notiz', text: String(r.text || '') }),
          el('span', { class: 'leise lern-projekt', text: titel[String(r.projekt_id || '').trim()] || 'Ohne Projekt' })
        )
      );
    });
    teil(id + ':aehnI', 'Aktionsideen', daten.ideen.filter(gleich), function (r) {
      return el('li', { class: 'dash-zeile' },
        el('div', { class: 'dash-todo' },
          el('strong', { text: String(r.titel || '') }),
          r.beschreibung ? el('span', { class: 'leise', text: String(r.beschreibung).slice(0, 100) }) : null
        )
      );
    });
    return box;
  }
  
  function imModus() {
    return sortiereProjekte(
      daten.projekte.filter(function (p) { return istAbgeschlossen(p) === archivModus; }),
      archivModus
    );
  }

  // Aktiv oben, Planung darunter (im Archiv eine Gruppe ohne Titel)
  function gruppenVon(liste) {
    if (archivModus) return liste.length ? [{ titel: '', liste: liste }] : [];
    return [
      { titel: 'Aktiv', liste: liste.filter(function (p) { return !istPlanung(p); }) },
      { titel: 'In Planung', liste: liste.filter(istPlanung) }
    ].filter(function (g) { return g.liste.length; });
  }

  function wahlAufbauen(liste) {
    const alt = wahl.value;
    leeren(wahl);
    wahl.append(el('option', {
      value: '',
      text: archivModus ? 'Alle abgeschlossenen Projekte' : 'Alle Projekte'
    }));
    liste.forEach(function (p) {
      wahl.append(el('option', { value: String(p.id), text: String(p.titel) }));
    });
    wahl.value = liste.some(function (p) { return String(p.id) === alt; }) ? alt : '';
  }

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    const archiv = daten.projekte.filter(istAbgeschlossen).length;
    const laufend = daten.projekte.length - archiv;
    const zahlen = laufend + (laufend === 1 ? ' laufendes Projekt' : ' laufende Projekte') +
      ' · ' + archiv + ' im Archiv';
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? zahlen + ' · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  // Nach lokalen Änderungen (Häkchen): Zwischenspeicher auffrischen
  function merken() {
    const stand = new Date().toISOString();
    cacheSet(s.gruppe_id + ':projekte', { daten: daten, stand: stand });
    cacheSet(s.gruppe_id + ':todos', { daten: { todos: daten.todos }, stand: stand });
  }

  // Aus der Übersicht zum Projekt springen und es aufklappen
  function springe(id) {
    const k = String(id);
    const p = daten.projekte.find(function (x) { return String(x.id) === k; });
    if (!p) return;
    archivModus = istAbgeschlossen(p);
    if (wahl.value && wahl.value !== k) wahl.value = '';
    suche.value = '';
    offen[k] = true;
    if (istPlanung(p)) merk.planungAuf = true;
    zeichne();
    const e = bloecke[k];
    if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Zeichnen ----

  function uebersichtZeile(p) {
    const f = fortschritt(p.id, daten.todos);
    return el('button', {
      class: 'uebersicht-zeile', type: 'button',
      onclick: function () { springe(p.id); }
    },
      el('span', { class: 'uebersicht-kopf' },
        el('strong', { text: String(p.titel) }),
        el('span', { class: 'leise', text: terminText(p) })
      ),
      fortschrittsBalken(f.prozent, fortschrittText(f))
    );
  }

  function uebersichtZeichnen(alle) {
    // Planung steht nicht in der Übersicht, nur unten im Aufklapper
    const liste = archivModus ? alle : alle.filter(function (p) { return !istPlanung(p); });
    leeren(uebersicht);
    uebersicht.append(el('h2', { text: archivModus ? 'Archiv' : 'Laufende Projekte' }));
    if (!liste.length) {
      let t = 'Noch kein Projekt angelegt. Mit „+ Neu“ geht es los.';
      if (daten.projekte.length) t = archivModus ? 'Das Archiv ist leer.' : 'Keine laufenden Projekte.';
      uebersicht.append(el('p', { class: 'leise', text: t }));
      return;
    }
    liste.forEach(function (p) { uebersicht.append(uebersichtZeile(p)); });
  }

  function block(p) {
    const id = String(p.id);
    const f = fortschritt(p.id, daten.todos);
    const st = String(p.status || '').trim() || 'planung';

    const d = el('details', { class: 'karte projekt-block' });
    if (offen[id]) d.open = true;
    d.addEventListener('toggle', function () {
      if (d.open) offen[id] = true;
      else delete offen[id];
    });

    const teilKey = id + ':todos';
    const todoTeil = baueTodoTeil({
      ctx: ctx,
      token: s.token,
      projekt: p,
      holeDaten: function () { return daten; },
      arbeitet: arbeitet,
      offen: !!merk.teile[teilKey],
      beiToggle: function (o) {
        if (o) merk.teile[teilKey] = true;
        else delete merk.teile[teilKey];
      },
      neuZeichnen: zeichne,
      neuLaden: function () { return laden(false); },
       merken: merken
    });

    const matKey = id + ':material';
    const materialTeil = baueMaterialTeil({
      ctx: ctx,
      token: s.token,
      projekt: p,
      holeDaten: function () { return daten; },
      arbeitet: arbeitet,
      offen: !!merk.teile[matKey],
      beiToggle: function (o) {
        if (o) merk.teile[matKey] = true;
        else delete merk.teile[matKey];
      },
      neuZeichnen: zeichne,
      neuLaden: function () { return laden(false); },
      merken: merken
    });
    const mobiKey = id + ':mobi';
    const mobiTeil = baueMobiTeil({
      ctx: ctx,
      token: s.token,
      projekt: p,
      holeDaten: function () { return daten; },
      arbeitet: arbeitet,
      offen: !!merk.teile[mobiKey],
      beiToggle: function (o) {
        if (o) merk.teile[mobiKey] = true;
        else delete merk.teile[mobiKey];
      },
      neuZeichnen: zeichne,
      neuLaden: function () { return laden(false); },
      merken: merken
    });
    const finKey = id + ':finanzen';
    const finanzTeil = baueFinanzTeil({
      ctx: ctx,
      token: s.token,
      projekt: p,
      holeDaten: function () { return daten; },
      arbeitet: arbeitet,
      offen: !!merk.teile[finKey],
      beiToggle: function (o) {
        if (o) merk.teile[finKey] = true;
        else delete merk.teile[finKey];
      },
      neuZeichnen: zeichne,
      neuLaden: function () { return laden(false); },
      merken: merken
    });
    const learnKey = id + ':learnings';
    const learnTeil = baueLearningTeil({
      ctx: ctx,
      token: s.token,
      projekt: p,
      holeDaten: function () { return daten; },
      offen: !!merk.teile[learnKey],
      beiToggle: function (o) {
        if (o) merk.teile[learnKey] = true;
        else delete merk.teile[learnKey];
      },
      neuLaden: function () { return laden(false); }
    });
    const redenKey = id + ':reden';
    const redenTeil = baueRedenTeil({
      kurzname: s.kurzname,
      projekt: p,
      holeDaten: function () { return daten; },
      offen: !!merk.teile[redenKey],
      beiToggle: function (o) {
        if (o) merk.teile[redenKey] = true;
        else delete merk.teile[redenKey];
      }
    });
    const termine = terminText(p);
    d.append(
      el('summary', null,
        el('span', { class: 'projekt-titel-zeile' },
          el('span', { class: 'projekt-pfeil', 'aria-hidden': 'true', text: '▸' }),
          el('span', { class: 'projekt-titel', text: String(p.titel) }),
          el('span', { class: 'status-marke status-' + st, text: statusText(p.status) }),
          el('span', { class: 'projekt-aktionen' },
            el('button', {
              class: 'knopf knopf-hell knopf-klein', type: 'button',
              text: istAbgeschlossen(p) ? 'Wieder öffnen' : 'Abschließen',
              onclick: function (ev) {
                ev.preventDefault(); ev.stopPropagation();
                if (istAbgeschlossen(p)) statusSetzen(p, 'aktiv', 'Projekt wieder geöffnet.');
                else abschliessen(p);
              }
            }),
            el('button', {
              class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Bearbeiten',
              onclick: function (ev) { ev.preventDefault(); ev.stopPropagation(); formZeigen(p); }
            }),
            el('button', {
              class: 'knopf knopf-gefahr knopf-klein', type: 'button', text: 'Löschen',
              onclick: function (ev) { ev.preventDefault(); ev.stopPropagation(); loeschen(p); }
            })
          )
        ),
        termine ? el('span', { class: 'leise', text: termine }) : null,
        fortschrittsBalken(f.prozent, fortschrittText(f))
      ),
      el('div', { class: 'projekt-body' },
        p.beschreibung ? el('p', { class: 'notiz', text: String(p.beschreibung) }) : null,
        el('div', { class: 'projekt-info-zwei' },
          paare([
            ['Status', statusText(p.status)],
            ['Ort', p.ort],
            ['Aktionsart', p.aktionsart],
            ['Start', datumText(p.start_datum)],
            ['Aktionsdatum', datumText(p.aktionsdatum)],
            ['Deadline', datumText(p.deadline)],
            ['Geplantes Budget', euro(p.budget_geplant)]
          ]),
          aehnliche(p)
        ),
        todoTeil,
        materialTeil,
        mobiTeil,
        finanzTeil,
        learnTeil,
        redenTeil
      )
    );
    bloecke[id] = d;
    return d;
  }

  function zeichne() {
    const liste = imModus();
    wahlAufbauen(liste);
    const q = suche.value.trim().toLowerCase();
    const nurId = wahl.value;
    const angezeigt = liste.filter(function (p) {
      if (nurId && String(p.id) !== nurId) return false;
      if (!q) return true;
      return [p.titel, p.ort, p.beschreibung].join(' ').toLowerCase().indexOf(q) >= 0;
    });

    const abgeschlossen = daten.projekte.filter(istAbgeschlossen).length;
    archivKnopf.textContent = archivModus
      ? '← Zurück zu den Projekten'
      : 'Archiv' + (abgeschlossen ? ' (' + abgeschlossen + ')' : '');

    uebersichtZeichnen(liste);
    leeren(learnBox);
    learnBox.append(baueLearningUebersicht({
      ctx: ctx,
      token: s.token,
      holeDaten: function () { return daten; },
      offen: !!merk.learnAuf,
      beiToggle: function (o) { merk.learnAuf = o; },
      neuLaden: function () { return laden(false); }
    }));

    leeren(ideenBox);
    ideenBox.append(baueIdeenTeil({
      ctx: ctx,
      token: s.token,
      holeDaten: function () { return daten; },
      offen: !!merk.ideenAuf,
      beiToggle: function (o) { merk.ideenAuf = o; },
      neuLaden: function () { return laden(false); },
      springe: springe,
      // „Als Projekt starten“ öffnet das Formular „Neues Projekt“ (mit Standard-ToDos), vorausgefüllt
      projektAnlegen: function (vorgabe) { formZeigen(null, vorgabe); }
    }));

    leeren(box);
    Object.keys(bloecke).forEach(function (k) { delete bloecke[k]; });
    if (liste.length && !angezeigt.length) {
      box.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
    }
        gruppenVon(angezeigt).forEach(function (g) {
      if (g.titel === 'In Planung') {
        // In Planung: Aufklapper ganz unten, Zustand bleibt beim Reiterwechsel
        const hd = el('details', { class: 'projekt-teil projekt-gruppe-planung' });
        const hatOffenes = g.liste.some(function (p) { return offen[String(p.id)]; });
        if (merk.planungAuf || hatOffenes) hd.open = true;
        hd.addEventListener('toggle', function () {
          merk.planungAuf = hd.open;
          if (!hd.open) g.liste.forEach(function (p) { delete offen[String(p.id)]; });
        });
        const inhalt = el('div', { class: 'projekt-teil-body' });
        g.liste.forEach(function (p) { inhalt.append(block(p)); });
        hd.append(
          el('summary', null,
            el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
            el('strong', { text: 'In Planung' }),
            el('span', { class: 'leise', text: g.liste.length + (g.liste.length === 1 ? ' Projekt' : ' Projekte') })
          ),
          inhalt
        );
        box.append(hd);
        return;
      }
      const wrap = el('div', { class: 'projekt-gruppe' });
      if (g.titel) wrap.append(el('h2', { class: 'projekt-gruppe-titel', text: g.titel }));
      g.liste.forEach(function (p) { wrap.append(block(p)); });
      box.append(wrap);
    });
    statusZeigen();
  }

  // ---- Anlegen und Ändern ----

  // p = null heißt neu. vorgabe = vorausgefüllte Werte beim Anlegen (z. B. aus einer Aktionsidee)
  function formZeigen(p, vorgabe) {
    const neuAnlegen = !p;
    let fenster = null;
    let zeilen = [];   // Standard-ToDos (nur beim Anlegen)
    const form = baueFormular(SCHEMA.Projekte.felder, p || Object.assign({ status: 'planung' }, vorgabe || {}), {
      speichernText: neuAnlegen ? 'Anlegen' : 'Speichern',
      vorschlaege: { aktionsart: aktionsarten() },
      onSpeichern: function (d) {
        const todos = zeilen.filter(function (z) { return z.cb.checked; })
          .map(function (z) { return { text: z.st.text, faellig_am: z.datum.value }; });
        return speichern(p, d, fenster, todos);
      },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    if (neuAnlegen) zeilen = standardTodosEinbauen(form);
    fenster = zeigeFenster(
      neuAnlegen ? 'Neues Projekt' : 'Projekt bearbeiten: ' + String(p.titel),
      form
    );
  }

  // Standard-ToDos (js/vorlagen.js) als Liste mit Haken und Datum ins Formular „Neues Projekt“.
  // Das Datum wird vom Aktionsdatum zurückgerechnet, solange du es nicht selbst änderst.
  function standardTodosEinbauen(form) {
    const aktion = form.querySelector('input[name="aktionsdatum"]');
    const liste = el('div', { class: 'vorlage-liste' },
      el('p', { class: 'leise', text: 'Standard-ToDos: Haken weg = wird nicht angelegt. ' +
        'Die Fälligkeit wird vom Aktionsdatum zurückgerechnet und kann hier geändert werden.' }));
    const zeilen = STANDARD_TODOS.map(function (st) {
      const cb = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': st.text });
      cb.checked = true;
      const dat = el('input', { class: 'feld vorlage-datum', type: 'date', 'aria-label': 'Fällig: ' + st.text });
      dat.value = aktion ? faelligAus(aktion.value, st.tage_vorher) : '';
      const z = { st: st, cb: cb, datum: dat, manuell: false };
      dat.addEventListener('input', function () { z.manuell = true; });
      dat.addEventListener('click', function () {
        try { if (typeof dat.showPicker === 'function') dat.showPicker(); } catch (e) { /* ignorieren */ }
      });
      liste.append(el('div', { class: 'vorlage-zeile' },
        cb,
        el('div', { class: 'vorlage-text' }, el('strong', { text: st.text }), dat)
      ));
      return z;
    });
    function fristen() {
      zeilen.forEach(function (z) {
        if (!z.manuell) z.datum.value = faelligAus(aktion.value, z.st.tage_vorher);
      });
    }
    if (aktion) {
      aktion.addEventListener('input', fristen);
      aktion.addEventListener('change', fristen);
    }
    form.insertBefore(liste, form.querySelector('p.fehler'));
    return zeilen;
  }

  async function speichern(p, d, fenster, todos) {
    if (!d.status) d.status = 'planung';
    try {
      if (!p) {
        const o = await api('create', { tabelle: 'Projekte', daten: d }, s.token);
        if (todos && todos.length) {
          try {
            await api('batchCreate', {
              tabelle: 'ToDos',
              liste: todos.map(function (t) {
                return { projekt_id: String(o.id), text: t.text, faellig_am: t.faellig_am || '', prioritaet: 'normal' };
              })
            }, s.token);
          } catch (e2) {
            // Das Projekt steht schon. Nicht noch einmal anlegen lassen.
            fenster.schliessen();
            if (ctx.behandleFehler(e2)) return;
            toast('Projekt angelegt, aber die Standard-ToDos nicht: ' + e2.message);
            offen[o.id] = true;
            await laden(false);
            springe(o.id);
            return;
          }
        }
        fenster.schliessen();
        toast(todos && todos.length ? 'Projekt mit ' + todos.length + ' ToDos angelegt.' : 'Projekt angelegt.');
        offen[o.id] = true;
        await laden(false);
        springe(o.id);
        return;
      }
      const r = await api('update', {
        tabelle: 'Projekte', id: p.id, daten: d, bekannt: p.geaendert_am
      }, s.token);
      fenster.schliessen();
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      offen[p.id] = true;
      if (r.eintrag) archivModus = istAbgeschlossen(r.eintrag);
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        laden(false);
        throw new Error('Jemand anderes hat dieses Projekt gerade geändert. ' +
          'Klicke auf „Abbrechen“ und öffne es noch einmal.');
      }
      if (e.code === 'nicht_gefunden') {
        laden(false);
        throw new Error('Dieses Projekt gibt es nicht mehr. Klicke auf „Abbrechen“.');
      }
      throw e;
    }
  }

   // ---- Status ändern, Abschließen mit Prüfung ----

  async function statusSetzen(p, neuerStatus, text) {
    try {
      await api('update', {
        tabelle: 'Projekte', id: p.id, daten: { status: neuerStatus }, bekannt: p.geaendert_am
      }, s.token);
      toast(text);
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
        toast('Jemand anderes hat dies gerade geändert. Bitte noch einmal versuchen.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  function abschliessen(p) {
    const id = String(p.id);
    const matById = {};
    daten.material.forEach(function (m) { matById[String(m.id)] = m; });

    // Festes Material, das noch für dieses Projekt draußen ist: sperrt
    const pp = ausgeliehenProjekt(daten.ausleihe);
    const draussen = [];
    Object.keys(pp).forEach(function (mid) {
      const n = (pp[mid] || {})[id] || 0;
      const m = matById[mid];
      if (n > 0 && m && !istVerbrauch(m)) draussen.push(String(m.name) + ' (' + n + ')');
    });
    if (draussen.length) {
      window.alert('Das Projekt kann noch nicht abgeschlossen werden.\n\n' +
        'Noch ausgeliehen: ' + draussen.join(', ') + '.\n\nBitte zuerst zurückgeben.');
      return;
    }

    // Warnungen: offene ToDos, nicht beschafftes Material
    const offeneTodos = daten.todos.filter(function (t) {
      return String(t.projekt_id || '').trim() === id && !istWahr(t.erledigt);
    }).length;
    const offenesMaterial = daten.pm.filter(function (r) {
      return String(r.projekt_id || '').trim() === id && !istWahr(r.beschafft);
    }).length;
    const warn = [];
    if (offeneTodos) warn.push('• ' + offeneTodos + ' ToDos sind noch offen');
    if (offenesMaterial) warn.push('• ' + offenesMaterial + ' Material-Positionen sind nicht beschafft');

    const frage = 'Projekt „' + String(p.titel) + '“ abschließen?\n\n' +
      (warn.length ? 'Achtung:\n' + warn.join('\n') + '\n\n' : '') +
      'Es steht danach im Archiv. Über „Wieder öffnen“ holst du es zurück.';
    if (!window.confirm(frage)) return;
    statusSetzen(p, 'erledigt', 'Projekt abgeschlossen. Es steht jetzt im Archiv.');
  }
  
  // ---- Löschen (mit allem Zugehörigen) ----

  async function loeschen(p) {
    let r;
    try {
      r = await api('listMehrere', {
        tabellen: TEILE.map(function (t) { return t[0]; })
      }, s.token);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.message);
      return;
    }

    const zeilen = [];
    TEILE.forEach(function (t) {
      const liste = (r && r.tabellen && r.tabellen[t[0]]) || [];
      const n = liste.filter(function (z) {
        return String(z.projekt_id || '').trim() === String(p.id);
      }).length;
      if (n) zeilen.push('• ' + n + ' ' + t[1]);
    });

    const frage = 'Projekt „' + String(p.titel) + '“ wirklich löschen?\n\n' +
      (zeilen.length
        ? 'Dabei werden auch gelöscht:\n' + zeilen.join('\n')
        : 'Es gehört noch nichts dazu.') +
      '\n\nDie Ausleihe-Historie bleibt erhalten. Rückgängig geht nur im Sheet.';
    if (!window.confirm(frage)) return;

    try {
      await api('projektLoeschen', { id: p.id, bekannt: p.geaendert_am }, s.token);
      delete offen[String(p.id)];
      toast('Projekt gelöscht.');
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'draussen') {
        window.alert(e.message);
      } else if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        laden(false);
      } else if (e.code === 'nicht_gefunden') {
        toast('Dieses Projekt gibt es nicht mehr.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    offline = false;
    meta = m;
    // Ältere Zwischenspeicher kennen Meilensteine und Team noch nicht
    if (!neu.projekte) neu.projekte = [];
    if (!neu.todos) neu.todos = [];
    if (!neu.meilensteine) neu.meilensteine = [];
    if (!neu.team) neu.team = [];
    if (!neu.material) neu.material = [];
    if (!neu.ausleihe) neu.ausleihe = [];
    if (!neu.pm) neu.pm = [];
    if (!neu.fin) neu.fin = [];
    if (!neu.learnings) neu.learnings = [];
    if (!neu.ideen) neu.ideen = [];
    if (!neu.kommentare) neu.kommentare = [];
    if (!neu.mobi) neu.mobi = [];
    const json = JSON.stringify(neu);
    const gleich = json === letzteJson;
    daten = neu;
    letzteJson = json;

    let ziel = null;
    if (sprungId) {
      ziel = daten.projekte.find(function (x) { return String(x.id) === String(sprungId); }) || null;
      if (ziel) {
        archivModus = istAbgeschlossen(ziel);
        offen[String(ziel.id)] = true;
      }
    }

    // Unveränderte Daten: nur die Statuszeile auffrischen (kein Springen der Seite)
    if (gleich && !ziel) statusZeigen();
    else zeichne();

    if (ziel) {
      const e = bloecke[String(ziel.id)];
      if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sprungId = '';
    } else if (sprungId && m.aktuell) {
      sprungId = '';
    }
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':projekte',
        async function () {
          const r = await api('listMehrere', {
              tabellen: ['Projekte', 'ToDos', 'Meilensteine', 'Material', 'Ausleihe', 'Projekt_Material', 'Finanzen', 'Learnings', 'Ideen', 'Kommentare', 'Mobi_Plan', 'Reden']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            projekte: t.Projekte || [],
            todos: t.ToDos || [],
            meilensteine: t.Meilensteine || [],
            material: t.Material || [],
            ausleihe: t.Ausleihe || [],
            pm: t.Projekt_Material || [],
            fin: t.Finanzen || [],
            learnings: t.Learnings || [],
            ideen: t.Ideen || [],
            kommentare: t.Kommentare || [],
            mobi: t.Mobi_Plan || [],
            reden: t.Reden || []
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
  wahl.addEventListener('change', function () {
    if (wahl.value) offen[wahl.value] = true;
    zeichne();
  });
  // Während ein Häkchen noch gespeichert wird, wird nicht aktualisiert
  ctx.setzeRefresh(function () {
    if (Object.keys(arbeitet).length) return Promise.resolve();
    return laden(false);
  });
  await laden(true);
}
