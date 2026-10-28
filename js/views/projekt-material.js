// js/views/projekt-material.js
// Teil "Material" eines Projekts: Positionen aus Projekt_Material, "beschafft"-Haken,
// "draußen für dieses Projekt", Material aus dem Bestand übernehmen (Vormerken), eigene Positionen,
// Ausleihen und Zurückgeben für dieses Projekt (Aktion "buchen" mit projekt_id).
//
// opt: { ctx, token, projekt, holeDaten() -> { material, ausleihe, projekte, pm }, arbeitet (Objekt),
//        offen, beiToggle(offen), neuZeichnen(), neuLaden() -> Promise, merken() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA, istWahr, istFalsch } from '../schema.js';
import {
  zahl, runden, ausgeliehen, ausgeliehenProjekt, mitVerfuegbar, auswaehlbar, personenAus
} from './material-rechnen.js';
import { zeigeBuchenDialog } from './material-buchen.js';
import { zeigeVormerkDialog } from './material-vormerken.js';
import { istAbgeschlossen, terminText } from './projekt-rechnen.js';
import { drucke } from '../ui/druck.js';

function nachName(a, b) {
  return String(a.name).localeCompare(String(b.name), 'de');
}

export function baueMaterialTeil(opt) {
  const ctx = opt.ctx;
  const token = opt.token;
  const pid = String(opt.projekt.id);

  function daten() { return opt.holeDaten(); }

  const d0 = daten();
  const zeilen = (d0.pm || []).filter(function (r) {
    return String(r.projekt_id || '').trim() === pid;
  }).sort(nachName);
  const out = ausgeliehen(d0.ausleihe || []);
  const pp = ausgeliehenProjekt(d0.ausleihe || []);
  const matById = {};
  (d0.material || []).forEach(function (m) { matById[String(m.id)] = m; });
  // Nur AKTIVE Projekte zählen für "Auch vorgemerkt für" (Planung nicht)
  const offeneProjekte = {};
  (d0.projekte || []).forEach(function (p) {
    if ((String(p.status || '').trim() || 'planung') === 'aktiv') {
      offeneProjekte[String(p.id)] = String(p.titel);
    }
  });
  const zu = istAbgeschlossen(opt.projekt);

  // ---- Hilfen ----

  function draussen(r) {
    return ((pp[String(r.material_id)] || {})[pid]) || 0;
  }

  // Wo ist dasselbe Material noch vorgemerkt (andere offene Projekte)?
  function andere(r) {
    const l = [];
    (d0.pm || []).forEach(function (x) {
      const p = String(x.projekt_id || '').trim();
      if (String(x.material_id) === String(r.material_id) && p !== pid && offeneProjekte[p] !== undefined) {
        l.push(offeneProjekte[p] + ' (' + x.menge + ')');
      }
    });
    return l;
  }

  function fehlerFuer(e) {
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

  function knopf(text, hell, fn) {
    return el('button', {
      class: 'knopf' + (hell ? ' knopf-hell' : ''), type: 'button', text: text, onclick: fn
    });
  }

  // ---- beschafft abhaken (ohne Konfliktprüfung, Anzeige sofort) ----

  async function beschafftSetzen(r, wert) {
    const id = 'p' + String(r.id);
    if (opt.arbeitet[id]) return;
    opt.arbeitet[id] = true;
    const alt = r.beschafft;
    r.beschafft = wert;
    opt.neuZeichnen();
    let nachladen = false;
    try {
      const res = await api('update', {
        tabelle: 'Projekt_Material', id: r.id, daten: { beschafft: wert }
      }, token);
      if (res && res.eintrag) Object.assign(r, res.eintrag);
      opt.merken();
    } catch (e) {
      r.beschafft = alt;
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Diese Position gibt es nicht mehr.');
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

  // ---- Eigene Position: Formular (r = null heißt neu) ----

  function posFormZeigen(r) {
    let fenster = null;
    const form = baueFormular(
      SCHEMA.Projekt_Material.felder,
      r || { menge: '1', beschaffung: 'kaufen' },
      {
        speichernText: r ? 'Speichern' : 'Anlegen',
        onSpeichern: function (d) { return posSpeichern(r, d, fenster); },
        onAbbrechen: function () { fenster.schliessen(); }
      }
    );
    const inhalt = el('div', null, form);
    if (r) {
      inhalt.append(el('div', { class: 'fenster-loeschen' },
        knopf('Löschen', false, function () { posLoeschen(r, fenster); })
      ));
      inhalt.lastChild.firstChild.className = 'knopf knopf-gefahr';
    }
    fenster = zeigeFenster(r ? 'Material bearbeiten' : 'Eigene Position', inhalt);
  }

  async function posSpeichern(r, d, fenster) {
    d.projekt_id = pid;
    try {
      if (!r) {
        await api('create', { tabelle: 'Projekt_Material', daten: d }, token);
        fenster.schliessen();
        toast('Position angelegt.');
      } else {
        const res = await api('update', {
          tabelle: 'Projekt_Material', id: r.id, daten: d, bekannt: r.geaendert_am
        }, token);
        fenster.schliessen();
        toast(res.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  async function posLoeschen(r, fenster) {
    const frage = 'Diese Position wirklich löschen?\n\n„' + String(r.name) + '“' +
      '\n\nAusgeliehenes Material bleibt ausgeliehen, bitte vorher zurückgeben.';
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'Projekt_Material', id: r.id, bekannt: r.geaendert_am }, token);
      fenster.schliessen();
      toast('Gelöscht.');
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        opt.neuLaden();
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Aus dem Bestand übernehmen (Auswahl, dann Menge im Vormerk-Fenster) ----

  function bestandWaehlen() {
    const schon = {};
    zeilen.forEach(function (r) { if (r.material_id) schon[String(r.material_id)] = true; });
    const kandidaten = (d0.material || []).filter(function (m) {
      return !istFalsch(m.aktiv) && !schon[String(m.id)];
    }).map(function (m) { return mitVerfuegbar(m, out); }).sort(nachName);
    if (!kandidaten.length) {
      toast('Alles aus dem Bestand ist schon im Projekt.');
      return;
    }

    let fenster = null;
    const gewaehlt = {};
    const suche = el('input', {
      class: 'feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
    });
    const liste = el('div', { class: 'vorlage-liste' });
    const weiter = el('button', { class: 'knopf', type: 'button', text: 'Weiter', disabled: '' });

    function zaehlen() {
      const n = Object.keys(gewaehlt).length;
      weiter.disabled = n === 0;
      weiter.textContent = n ? 'Weiter (' + n + ')' : 'Weiter';
    }

    function zeichneListe() {
      const q = suche.value.trim().toLowerCase();
      liste.textContent = '';
      kandidaten.filter(function (z) {
        return !q || [z.name, z.kategorie, z.ort].join(' ').toLowerCase().indexOf(q) >= 0;
      }).forEach(function (z) {
        const cb = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': String(z.name) });
        cb.checked = !!gewaehlt[z.id];
        cb.addEventListener('change', function () {
          if (cb.checked) gewaehlt[z.id] = true;
          else delete gewaehlt[z.id];
          zaehlen();
        });
        liste.append(el('label', { class: 'vorlage-zeile' }, cb,
          el('span', { class: 'vorlage-text' },
            el('strong', { text: String(z.name) }),
            el('span', { class: 'leise', text: [z.kategorie, z.ort].filter(Boolean).join(' · ') })
          )
        ));
      });
      if (!liste.childNodes.length) liste.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
    }

    suche.addEventListener('input', zeichneListe);
    weiter.addEventListener('click', function () {
      const items = kandidaten.filter(function (z) { return gewaehlt[z.id]; });
      fenster.schliessen();
      zeigeVormerkDialog({
        ctx: ctx, token: token, items: items, projektId: pid,
        onFertig: function () { opt.beiToggle(true); return opt.neuLaden(); }
      });
    });
    zeichneListe();
    zaehlen();
    fenster = zeigeFenster('Material aus dem Bestand', el('div', { class: 'formular' },
      suche,
      liste,
      el('div', { class: 'form-knoepfe' },
        weiter,
        knopf('Abbrechen', true, function () { fenster.schliessen(); })
      )
    ));
  }

  // ---- Ausleihen und Zurückgeben für dieses Projekt ----

  function buchDialog(art, items) {
    items.sort(nachName);
    zeigeBuchenDialog({
      ctx: ctx,
      token: token,
      art: art,
      items: items,
      projektId: art === 'mitgenommen' ? pid : '',
      personen: personenAus(d0.ausleihe || []),
      proProjekt: function () { return ausgeliehenProjekt(daten().ausleihe || []); },
      neuLaden: function () { return opt.neuLaden(); },
      frisch: function () {
        const a = ausgeliehen(daten().ausleihe || []);
        return (daten().material || []).map(function (m) { return mitVerfuegbar(m, a); });
      },
      onFertig: function () { opt.beiToggle(true); return opt.neuLaden(); }
    });
  }

  function ausleihen() {
    const items = [];
    const gesehen = {};
    zeilen.forEach(function (r) {
      const id = String(r.material_id || '');
      if (!id || gesehen[id] || !matById[id]) return;
      gesehen[id] = true;
      const z = mitVerfuegbar(matById[id], out);
      if (!auswaehlbar(z, 'mitgenommen')) return;
      let v = zahl(r.menge) - (z._verbrauch ? 0 : draussen(r));
      if (z._verfuegbar !== '') v = Math.min(v, z._verfuegbar);
      items.push(Object.assign({}, z, { _vorgabe: Math.max(0, runden(v)), _vorgemerkt: zahl(r.menge) }));
    });
    if (!items.length) {
      toast('Nichts zum Ausleihen: Es fehlt Material aus dem Bestand oder nichts ist verfügbar.');
      return;
    }
    buchDialog('mitgenommen', items);
  }

  function zurueck() {
    const items = [];
    Object.keys(pp).forEach(function (id) {
      const n = pp[id][pid];
      if (!(n > 0) || !matById[id]) return;
      // Verbrauchsmaterial nur, wenn es als Position im Projekt steht
      const verbr = String(matById[id].typ || '').trim().toLowerCase() === 'verbrauch';
      if (verbr && !zeilen.some(function (r) { return String(r.material_id) === id; })) return;
      items.push(Object.assign({}, mitVerfuegbar(matById[id], out), { _pid: pid, _draussen: n }));
    });
    if (!items.length) {
      toast('Für dieses Projekt ist nichts ausgeliehen.');
      return;
    }
    buchDialog('zurueck', items);
  }

  // ---- Packliste drucken (11.6): alle Positionen mit leerem Kästchen zum Abhaken beim Packen ----

  function packlisteDrucken() {
    drucke({
      titel: 'Packliste: ' + String(opt.projekt.titel || 'Projekt'),
      unterzeile: terminText(opt.projekt),
      abschnitte: [{
        titel: '',
        zeilen: zeilen.map(function (r) {
          const m = r.material_id ? matById[String(r.material_id)] : null;
          return {
            text: String(r.name),
            info: [
              'Menge: ' + r.menge + (m && m.einheit ? ' ' + m.einheit : ''),
              r.beschaffung,
              m && m.ort ? 'Ort: ' + m.ort : '',
              r.notiz ? String(r.notiz).slice(0, 100) : ''
            ].filter(Boolean).join(' · ')
          };
        })
      }]
    });
  }

  // ---- Zeichnen ----

  function zeile(r) {
    // Komplett für dieses Projekt ausgeliehen = auch "fertig" (grau, durchgestrichen)
    const dr0 = r.material_id ? draussen(r) : 0;
    const komplett = dr0 > 0 && dr0 >= zahl(r.menge);
    const fertig = istWahr(r.beschafft) || komplett;
    const m = r.material_id ? matById[String(r.material_id)] : null;
    const z = m ? mitVerfuegbar(m, out) : null;
    const einheit = m && m.einheit ? ' ' + m.einheit : '';
    const dr = r.material_id ? draussen(r) : 0;
    const info = [
      'Menge: ' + r.menge + einheit,
      r.beschaffung,
      dr > 0 ? (z && z._verbrauch ? 'Mitgenommen: ' : 'Draußen für dieses Projekt: ') + dr : '',
      z && !z._verbrauch && z._verfuegbar !== '' ? 'Verfügbar: ' + z._verfuegbar : '',
      r.material_id && !m ? 'Nicht mehr im Bestand' : ''
    ].filter(Boolean).join(' · ');
    const ander = r.material_id && (!z || !z._verbrauch) ? andere(r) : [];

    const cb = el('input', {
      type: 'checkbox', class: 'auswahl-box', 'aria-label': String(r.name) + ' beschafft'
    });
    cb.checked = fertig;
    cb.disabled = komplett && !istWahr(r.beschafft);
    cb.addEventListener('change', function () { beschafftSetzen(r, cb.checked); });

    return el('li', { class: 'dash-zeile' + (fertig ? ' erledigt' : '') },
      cb,
      el('button', {
        class: 'dash-todo pt-todo' + (fertig ? ' erledigt' : ''), type: 'button',
        onclick: function () { posFormZeigen(r); }
      },
        el('strong', { text: String(r.name) }),
        el('span', { class: 'leise', text: info }),
        ander.length ? el('span', { class: 'leise', text: 'Auch vorgemerkt für: ' + ander.join(', ') }) : null,
        r.notiz ? el('span', { class: 'leise', text: String(r.notiz).slice(0, 100) }) : null
      )
    );
  }

  const body = el('div', { class: 'projekt-teil-body' },
    el('div', { class: 'teil-aktionen' },
      knopf('+ Aus Bestand', false, bestandWaehlen),
      knopf('+ Eigene Position', true, function () { posFormZeigen(null); })
    ),
    el('div', { class: 'teil-aktionen' },
      zu ? null : knopf('Ausleihen', true, ausleihen),
      knopf('Zurückgeben', true, zurueck),
      zeilen.length ? knopf('🖨 Drucken', true, packlisteDrucken) : null
    )
  );
  if (!zeilen.length) {
    body.append(el('p', {
      class: 'leise',
      text: 'Noch kein Material im Projekt. „Aus Bestand“ merkt vorhandenes Material vor, ' +
        '„Eigene Position“ ist für Dinge ohne Bestand (z. B. Bühne mieten).'
    }));
  } else {
    body.append(el('ul', { class: 'dash-todo-liste' }, ...zeilen.map(zeile)));
  }

  const beschafft = zeilen.filter(function (r) { return istWahr(r.beschafft); }).length;
  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Material' }),
      el('span', {
        class: 'leise',
        text: zeilen.length ? zeilen.length + ' Positionen · ' + beschafft + ' beschafft' : 'noch kein Material'
      })
    ),
    body
  );
  return teil;
}
