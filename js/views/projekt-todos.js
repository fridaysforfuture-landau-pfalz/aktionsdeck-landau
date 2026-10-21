// js/views/projekt-todos.js
// Teil "ToDos" eines Projekts: Zählzeile, Meilensteine mit Balken, ToDos darunter, Anlegen/Ändern/Löschen.
// Zeigt ALLE ToDos des Projekts (kein 14-Tage-Archiv). Erledigte sind grau und durchgestrichen.
// "+ Meilenstein" bietet zuerst Vorlagen an (js/vorlagen.js). Die ToDos der Vorlage können abgewählt werden.
// Wird von projekte.js benutzt. Der Teil klappt auf und zu (Zustand liegt in projekte.js).
//
// opt: { ctx, token, projekt, holeDaten() -> { todos, meilensteine }, arbeitet (Objekt),
//        offen (Teil aufgeklappt?), beiToggle(offen), neuZeichnen(), neuLaden() -> Promise, merken() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { baueKommentare } from '../ui/kommentare.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { VORLAGEN, faelligAus } from '../vorlagen.js';
import { abhakWerte, abhakenSpeichern } from './todos-abhaken.js';
import {
  kurz, faelligStatus, faelligText, prioText, sortieren, zahlenText, datumText,
  kommentarZahlen, kommentarMarke
} from './todos-rechnen.js';
import {
  fortschritt, meilensteinStand, sortiereMeilensteine, meilensteinFaellig
} from './projekt-rechnen.js';
import { huetKnoepfe, istOffenerHut } from './todos-hut.js';
import { sammelTodos, istSammel, sammelInfo, oeffneSammel } from './mobi-todo.js';

// Aufgeklappte Hut-Listen je Projekt (bleibt beim Neuzeichnen erhalten)
const hutOffen = {};

export function baueTodoTeil(opt) {
  const ctx = opt.ctx;
  const token = opt.token;
  const pid = String(opt.projekt.id);

  function daten() { return opt.holeDaten(); }
  
  // Einstellungen für die Hut-Knöpfe eines ToDos
  function hutOpt(t) {
    return {
      ctx: ctx, token: token, t: t, personen: personen,
      fertig: function () { opt.merken(); opt.neuZeichnen(); }
    };
  }

  const alle = daten().todos.filter(function (t) {
    return String(t.projekt_id || '').trim() === pid;
  });
  const ms = sortiereMeilensteine(daten().meilensteine.filter(function (m) {
    return String(m.projekt_id || '').trim() === pid;
  }));
  const f = fortschritt(pid, daten().todos);
  const kz = kommentarZahlen(daten().kommentare);
  // Sammel-ToDos aus Mobi (berechnet, ohne Kästchen) stehen bei „Ohne Meilenstein“
  const sammel = sammelTodos(daten().mobi || [], daten().projekte || [], pid);

  // ---- Hilfen ----

  function personen() {
    const liste = [];
    const merke = function (n) {
      const k = String(n || '').trim();
      if (k && liste.indexOf(k) < 0) liste.push(k);
    };
    merke(getName());
    alle.forEach(function (t) { merke(t.verantwortlich); });
    ms.forEach(function (m) { merke(m.verantwortlich); });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  // Macht aus einem Server-Fehler den Text fürs Formular
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

  function fensterMitLoeschen(titel, form, loeschen, extra) {
    const inhalt = el('div', null, form);
    if (loeschen) {
      inhalt.append(el('div', { class: 'fenster-loeschen' },
        el('button', { class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen', onclick: loeschen })
      ));
    }
    if (extra) inhalt.append(extra);
    return zeigeFenster(titel, inhalt);
  }

  // ---- ToDo abhaken (ohne Konfliktprüfung) ----

  async function abhaken(t, wert) {
    const id = String(t.id);
    if (opt.arbeitet[id]) return;
    opt.arbeitet[id] = true;

    const alt = { erledigt: t.erledigt, erledigt_am: t.erledigt_am, erledigt_von: t.erledigt_von };
    const neu = abhakWerte(wert);
    Object.assign(t, neu);
    opt.neuZeichnen();

    let nachladen = false;
    try {
      const eintrag = await abhakenSpeichern(token, t.id, neu);
      const liste = daten().todos;
      const i = liste.findIndex(function (x) { return String(x.id) === id; });
      if (i >= 0 && eintrag) liste[i] = eintrag;
      opt.merken();
    } catch (e) {
      Object.assign(t, alt);
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Dieses ToDo gibt es nicht mehr.');
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

  // ---- Meilenstein abhaken (nur wenn er keine ToDos hat) ----

  async function meilensteinAbhaken(m, wert) {
    const id = 'm' + String(m.id);
    if (opt.arbeitet[id]) return;
    opt.arbeitet[id] = true;

    const alt = m.erledigt;
    m.erledigt = wert;
    opt.neuZeichnen();

    let nachladen = false;
    try {
      const r = await api('update', {
        tabelle: 'Meilensteine', id: m.id, daten: { erledigt: wert }
      }, token);
      const liste = daten().meilensteine;
      const i = liste.findIndex(function (x) { return String(x.id) === String(m.id); });
      if (i >= 0 && r && r.eintrag) liste[i] = r.eintrag;
      opt.merken();
    } catch (e) {
      m.erledigt = alt;
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Diesen Meilenstein gibt es nicht mehr.');
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

  // ---- ToDo: Formular (t = null heißt neu, mid = vorgewählter Meilenstein) ----

    function todoFormZeigen(t, mid) {
    let fenster = null;
    const felder = SCHEMA.ToDos.felder.slice();
    if (ms.length) {
      // Nach "Weitere Informationen" einfügen
      felder.splice(2, 0, {
        name: 'meilenstein_id',
        label: 'Meilenstein',
        typ: 'auswahl',
        optionen: ms.map(function (m) { return { wert: String(m.id), label: String(m.titel) }; })
      });
    }
    const form = baueFormular(felder, t || { prioritaet: 'normal', meilenstein_id: mid || '' }, {
      speichernText: t ? 'Speichern' : 'Anlegen',
      vorschlaege: { verantwortlich: personen() },
      onSpeichern: function (d) { return todoSpeichern(t, d, fenster); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    fenster = fensterMitLoeschen(
      t ? 'ToDo bearbeiten' : 'Neues ToDo',
      form,
      t ? function () { todoLoeschen(t, fenster); } : null,
      t ? baueKommentare({
        ctx: ctx, token: token, art: 'todo', bezugId: t.id, projektId: pid,
        beiAenderung: function () { opt.neuLaden(); }
      }).el : null
    );
  }

  async function todoSpeichern(t, d, fenster) {
    delete d._hut;
    d.projekt_id = pid;
    try {
      if (!t) {
        await api('create', { tabelle: 'ToDos', daten: d }, token);
        fenster.schliessen();
        toast('ToDo angelegt.');
      } else {
        const r = await api('update', {
          tabelle: 'ToDos', id: t.id, daten: d, bekannt: t.geaendert_am
        }, token);
        fenster.schliessen();
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  async function todoLoeschen(t, fenster) {
    const frage = 'Dieses ToDo wirklich löschen?\n\n„' + kurz(t.text, 80) + '“';
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'ToDos', id: t.id, bekannt: t.geaendert_am }, token);
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

    // ---- Meilenstein: Formular (m = null heißt neu). Oben ein Dropdown "Vorlage". ----

  function meilensteinFormZeigen(m) {
    let fenster = null;
    let zeilen = [];
    const felder = SCHEMA.Meilensteine.felder.slice();
    if (!m) {
      felder.unshift({
        name: '_vorlage',
        label: 'Vorlage (legt ToDos gleich mit an)',
        typ: 'auswahl',
        optionen: VORLAGEN.map(function (v) {
          return { wert: v.id, label: v.name + ' (' + v.schritte.length + ' ToDos)' };
        })
      });
    }
    const form = baueFormular(felder, m || {}, {
      speichernText: m ? 'Speichern' : 'Anlegen',
      vorschlaege: { verantwortlich: personen() },
      onSpeichern: function (d) {
        const schritte = zeilen.filter(function (z) { return z.cb.checked; })
          .map(function (z) {
            return {
              text: z.textFeld ? z.textFeld.value.trim() : z.sch.text,
              details: z.sch.details || '',
              faellig_am: z.datum.value
            };
          })
          .filter(function (x) { return x.text !== ''; });
        delete d._vorlage;
        return meilensteinSpeichern(m, d, fenster, schritte);
      },
      onAbbrechen: function () { fenster.schliessen(); }
    });

    if (!m) {
      const sel = form.querySelector('select[name="_vorlage"]');
      const titel = form.querySelector('input[name="titel"]');
      const datum = form.querySelector('input[name="datum"]');
      const liste = el('div', { class: 'vorlage-liste' });
      liste.hidden = true;
      form.insertBefore(liste, form.querySelector('p.fehler'));
      let vorher = '';

      // Meilenstein-Datum geändert: nur Fristen neu rechnen, die du nicht selbst geändert hast
      function fristen() {
        zeilen.forEach(function (z) {
          if (!z.manuell) z.datum.value = faelligAus(datum.value, z.sch.tage_vorher);
        });
      }

      function bauen() {
        const v = VORLAGEN.find(function (x) { return x.id === sel.value; });
        liste.textContent = '';
        zeilen = [];
        liste.hidden = !v;
        if (!v) return;
        if (!titel.value.trim() || titel.value === vorher) titel.value = v.name;
        vorher = v.name;
        liste.append(el('p', {
          class: 'leise',
          text: 'Haken weg = ToDo wird nicht angelegt. Die Fälligkeit wird vom Datum des Meilensteins ' +
            'zurückgerechnet und kann hier geändert werden.'
        }));
        v.schritte.forEach(function (sch) {
          const cb = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': sch.text });
          cb.checked = true;
          const dat = el('input', {
            class: 'feld vorlage-datum', type: 'date', 'aria-label': 'Fällig: ' + sch.text
          });
          dat.value = faelligAus(datum.value, sch.tage_vorher);
          const z = { sch: sch, cb: cb, datum: dat, manuell: false };
          dat.addEventListener('input', function () { z.manuell = true; });
          dat.addEventListener('click', function () {
            try { if (typeof dat.showPicker === 'function') dat.showPicker(); } catch (e) { /* ignorieren */ }
          });
          zeilen.push(z);
          liste.append(el('div', { class: 'vorlage-zeile' },
            cb,
            el('div', { class: 'vorlage-text' }, el('strong', { text: sch.text }), dat)
          ));
        });
        const eigenKnopf = el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button', text: '+ Eigener Schritt',
          onclick: function () {
            const cb = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': 'Eigener Schritt' });
            cb.checked = true;
            const text = el('input', {
              class: 'feld', type: 'text', maxlength: '200', 'aria-label': 'Eigener Schritt',
              placeholder: 'Eigener Schritt (z. B. Schuldelis anschreiben)'
            });
            const dat = el('input', {
              class: 'feld vorlage-datum', type: 'date', 'aria-label': 'Fällig: eigener Schritt'
            });
            dat.addEventListener('click', function () {
              try { if (typeof dat.showPicker === 'function') dat.showPicker(); } catch (e) { /* ignorieren */ }
            });
            zeilen.push({ sch: { text: '', tage_vorher: 0 }, textFeld: text, cb: cb, datum: dat, manuell: true });
            liste.insertBefore(el('div', { class: 'vorlage-zeile' },
              cb,
              el('div', { class: 'vorlage-text' }, text, dat)
            ), eigenKnopf);
            text.focus();
          }
        });
        liste.append(eigenKnopf);
      }

      sel.addEventListener('change', bauen);
      datum.addEventListener('input', fristen);
      datum.addEventListener('change', fristen);
    }

    fenster = fensterMitLoeschen(
      m ? 'Meilenstein bearbeiten' : 'Neuer Meilenstein',
      form,
      m ? function () { meilensteinLoeschen(m, fenster); } : null
    );
  }
  
  async function meilensteinSpeichern(m, d, fenster, schritte) {
    d.projekt_id = pid;
    try {
      if (!m) {
        const o = await api('create', { tabelle: 'Meilensteine', daten: d }, token);
        schritte = schritte || [];
        if (schritte.length) {
          const liste = schritte.map(function (sch) {
            return {
              projekt_id: pid,
              meilenstein_id: String(o.id),
              text: sch.text,
              details: sch.details || '',
              faellig_am: sch.faellig_am || '',
              prioritaet: 'normal'
            };
          });
          try {
            await api('batchCreate', { tabelle: 'ToDos', liste: liste }, token);
          } catch (e2) {
            // Der Meilenstein steht schon. Nicht noch einmal anlegen lassen.
            fenster.schliessen();
            opt.beiToggle(true);
            if (ctx.behandleFehler(e2)) return;
            toast('Meilenstein angelegt, aber die ToDos nicht: ' + e2.message);
            await opt.neuLaden();
            return;
          }
        }
        fenster.schliessen();
        toast(schritte.length
          ? 'Meilenstein mit ' + schritte.length + ' ToDos angelegt.'
          : 'Meilenstein angelegt.');
      } else {
        const r = await api('update', {
          tabelle: 'Meilensteine', id: m.id, daten: d, bekannt: m.geaendert_am
        }, token);
        fenster.schliessen();
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  async function meilensteinLoeschen(m, fenster) {
    const n = alle.filter(function (t) {
      return String(t.meilenstein_id || '').trim() === String(m.id);
    }).length;
    const frage = 'Meilenstein „' + String(m.titel) + '“ wirklich löschen?\n\n' +
      (n
        ? n + ' ToDos bleiben erhalten und stehen danach unter „Ohne Meilenstein“.'
        : 'Es gehören keine ToDos dazu.');
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'Meilensteine', id: m.id, bekannt: m.geaendert_am }, token);
      fenster.schliessen();
      toast('Meilenstein gelöscht.');
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

  // ---- Zeichnen ----

  function todoZeile(t) {
    const fertig = istWahr(t.erledigt);
    const klassen = ['dash-todo', 'pt-todo'];
    if (fertig) klassen.push('erledigt');
    const st = faelligStatus(t);
    if (st) klassen.push(st);
    const info = [
      t.verantwortlich,
      t.faellig_am ? 'Fällig ' + faelligText(t) : '',
      prioText(t.prioritaet)
    ].filter(Boolean).join(' · ');

    const cb = el('input', {
      type: 'checkbox',
      class: 'auswahl-box',
      'aria-label': kurz(t.text, 60) + ' erledigt'
    });
    cb.checked = fertig;
    cb.addEventListener('change', function () { abhaken(t, cb.checked); });

    const knopf = el('button', {
      class: klassen.join(' '), type: 'button',
      onclick: function () { todoFormZeigen(t, ''); }
    },
      el('strong', { text: kurz(t.text, 90) + kommentarMarke(kz[String(t.id)]) }),
      info ? el('span', { class: 'leise', text: info }) : null,
      t.details ? el('span', { class: 'leise', text: kurz(t.details, 100) }) : null
    );
    const li = el('li', { class: 'dash-zeile mit-hut' + (fertig ? ' erledigt' : '') }, cb, knopf);
    if (!fertig) li.append(huetKnoepfe(hutOpt(t)));
    return li; 
  }

  // Sammel-ToDo: Kanalfarbe, kein Kästchen, Klick öffnet den Reiter Mobi
  function sammelZeile(t) {
    const fertig = istWahr(t.erledigt);
    const klassen = ['dash-todo', 'pt-todo'];
    if (fertig) klassen.push('erledigt');
    // Überfällig/heute: Balken bleibt in Kanalfarbe, nur der Titel wird rot oder orange
    const st = faelligStatus(t);
    const punkt = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
    punkt.style.background = t._farbe;
    const li = el('li', { class: 'dash-zeile mobi-sammel' + (fertig ? ' erledigt' : '') },
      el('span', { class: 'mobi-sammel-platz', 'aria-hidden': 'true' }, punkt),
      el('button', {
        class: klassen.join(' '), type: 'button',
        onclick: function () { oeffneSammel(ctx, t); }
      },
        el('strong', { class: st ? 'mobi-titel-' + st : '', text: t.text }),
        el('span', { class: 'leise', text: [sammelInfo(t), t.faellig_am ? 'Nächster Termin ' + faelligText(t) : '']
          .filter(Boolean).join(' · ') })
      )
    );
    li.style.borderLeft = '6px solid ' + t._farbe;
    return li;
  }

  function todoListe(liste) {
    return el('ul', { class: 'dash-todo-liste' }, ...sortieren(liste).map(function (t) {
      return istSammel(t) ? sammelZeile(t) : todoZeile(t);
    }));
  }

  function meilensteinBlock(m) {
    const mt = alle.filter(function (t) {
      return String(t.meilenstein_id || '').trim() === String(m.id);
    });
    const st = meilensteinStand(m, alle);
    const fk = st.erreicht ? '' : meilensteinFaellig(m);
    const info = [
      m.datum ? 'Bis ' + datumText(m.datum) +
        (fk === 'ueberfaellig' ? ' (überfällig)' : fk === 'heute' ? ' (heute)' : '') : '',
      m.verantwortlich,
      st.erreicht ? 'Erreicht' : ''
    ].filter(Boolean).join(' · ');

    const kopf = el('div', { class: 'meilenstein-kopf' });
    if (!st.gesamt) {
      const cb = el('input', {
        type: 'checkbox', class: 'auswahl-box',
        'aria-label': String(m.titel) + ' erreicht'
      });
      cb.checked = istWahr(m.erledigt);
      cb.addEventListener('change', function () { meilensteinAbhaken(m, cb.checked); });
      kopf.append(cb);
    }
    kopf.append(
      el('div', { class: 'meilenstein-titel' },
        el('strong', { text: '🏁 ' + String(m.titel) }),
        info ? el('span', { class: 'leise', text: info }) : null
      ),
      el('div', { class: 'kopf-knoepfe' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: '+ ToDo',
          onclick: function () { todoFormZeigen(null, String(m.id)); }
        }),
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
          onclick: function () { meilensteinFormZeigen(m, null); }
        })
      )
    );

    const sektion = el('section', {
      class: 'meilenstein' + (st.erreicht ? ' erreicht' : '') + (fk ? ' ' + fk : '')
    }, kopf);
    if (st.gesamt) {
      sektion.append(
        fortschrittsBalken(st.prozent, st.erledigt + ' von ' + st.gesamt + ' erledigt'),
        todoListe(mt)
      );
    } else {
      sektion.append(el('p', { class: 'leise', text: 'Noch keine ToDos in diesem Meilenstein.' }));
    }
    return sektion;
  }

  // ToDos ohne Meilenstein (auch solche, deren Meilenstein es nicht mehr gibt)
  const meilensteinIds = {};
  ms.forEach(function (m) { meilensteinIds[String(m.id)] = true; });
  const ohne = alle.filter(function (t) {
    return !meilensteinIds[String(t.meilenstein_id || '').trim()];
  });

  const body = el('div', { class: 'projekt-teil-body' },
    el('div', { class: 'teil-aktionen' },
      el('button', {
        class: 'knopf', type: 'button', text: '+ ToDo',
        onclick: function () { todoFormZeigen(null, ''); }
      }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: '+ Meilenstein',
        onclick: function () { meilensteinFormZeigen(null); }
      })
    )
  );
  
    const freie = sortieren(alle.filter(istOffenerHut));
  if (freie.length) {
    const hd = el('details', { class: 'projekt-teil hut-toggler' });
    if (hutOffen[pid]) hd.open = true;
    hd.addEventListener('toggle', function () {
      if (hd.open) hutOffen[pid] = true;
      else delete hutOffen[pid];
    });
    hd.append(
      el('summary', null,
        el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
        el('strong', { text: 'Offene Hüte' }),
        el('span', { class: 'leise', text: freie.length + ' ToDos ohne Verantwortliche' })
      ),
      el('div', { class: 'projekt-teil-body' },
        el('p', {
          class: 'leise',
          text: 'Diese ToDos hat noch niemand. Mit „Hut übernehmen“ trägst du dich selbst ein.'
        }),
        todoListe(freie)
      )
    );
    body.append(hd);
  }
  const mitSammel = alle.concat(sammel);
  if (mitSammel.length) body.append(el('p', { class: 'dash-zahlen', text: zahlenText(mitSammel, getName()) }));
  if (!mitSammel.length && !ms.length) {
    body.append(el('p', { class: 'leise', text: 'Noch keine ToDos in diesem Projekt.' }));
  }
  ms.forEach(function (m) { body.append(meilensteinBlock(m)); });
  if (ohne.length || sammel.length) {
    if (ms.length) body.append(el('h3', { class: 'teil-titel-klein', text: 'Ohne Meilenstein' }));
    body.append(todoListe(ohne.concat(sammel)));
  }

  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'ToDos' }),
      el('span', {
        class: 'leise',
        text: f.gesamt ? f.erledigt + ' von ' + f.gesamt + ' erledigt' : 'noch keine ToDos'
      })
    ),
    body
  );
  return teil;
}
