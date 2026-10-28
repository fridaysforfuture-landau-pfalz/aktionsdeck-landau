// js/views/kalender-vorlagen.js
// Fenster "Termin-Vorlagen": Vorlagen der Gruppe ansehen, ändern, neu anlegen.
// "Termin anlegen" gibt die Vorgabe an den Kalender zurück (Formular ist vorausgefüllt).
// Tab Termin_Vorlagen: name, art, wochentag, zeit_von, zeit_bis, ort, beschreibung.
// opt: { ctx, token, kurzname, neueAusVorlage(vorgabe) }

import { el, leeren, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA } from '../schema.js';
import { naechsterWochentag, zeitNorm } from './kalender-rechnen.js';

// Plenum-Vorlagen zum Anlegen per Klick (nur wenn die Gruppe noch keine Vorlage hat).
// Auch das Protokoll-Formular (protokoll-eintrag.js) nimmt sie für „Nächstes Plenum“.
export const STANDARD = {
  fff: {
    name: 'Plenum FFF', art: 'intern', wochentag: 'Donnerstag',
    zeit_von: '18:30', zeit_bis: '', ort: 'KHG, Moltkestraße 9, Landau', beschreibung: ''
  },
  gp: {
    name: 'Plenum GP', art: 'intern', wochentag: 'Dienstag',
    zeit_von: '19:00', zeit_bis: '', ort: 'KHG, Moltkestraße 9, Landau', beschreibung: ''
  }
};

function infoText(v) {
  const zeit = zeitNorm(v.zeit_von)
    ? (zeitNorm(v.zeit_bis)
      ? zeitNorm(v.zeit_von) + ' – ' + zeitNorm(v.zeit_bis) + ' Uhr'
      : 'ab ' + zeitNorm(v.zeit_von) + ' Uhr')
    : '';
  return [
    txt(v.wochentag),
    zeit,
    txt(v.ort),
    txt(v.art) === 'extern' ? 'Extern' : 'Intern'
  ].filter(Boolean).join(' · ');
}

export function zeigeVorlagen(opt) {
  const inhalt = el('div');
  const fenster = zeigeFenster('Termin-Vorlagen', inhalt, null, { aussenKlick: true });

  function ausVorlage(v) {
    const vorgabe = {
      titel: txt(v.name),
      art: txt(v.art) === 'extern' ? 'extern' : 'intern',
      zeit_von: zeitNorm(v.zeit_von),
      zeit_bis: zeitNorm(v.zeit_bis),
      ort: txt(v.ort),
      beschreibung: txt(v.beschreibung)
    };
    const datum = naechsterWochentag(v.wochentag);
    if (datum) vorgabe.datum = datum;
    fenster.schliessen();
    opt.neueAusVorlage(vorgabe);
  }

  function formFenster(v) {
    fenster.schliessen();
    let f2 = null;
    const start = v
      ? Object.assign({}, v, { zeit_von: zeitNorm(v.zeit_von), zeit_bis: zeitNorm(v.zeit_bis) })
      : { art: 'intern' };
    const form = baueFormular(SCHEMA.Termin_Vorlagen.felder, start, {
      speichernText: v ? 'Speichern' : 'Anlegen',
      onSpeichern: function (d) { return speichern(v, d, f2); },
      onAbbrechen: function () { f2.schliessen(); zeigeVorlagen(opt); }
    });
    const box = el('div', null, form);
    if (v) {
      box.append(el('div', { class: 'fenster-loeschen' },
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(v, f2); }
        })
      ));
    }
    f2 = zeigeFenster(v ? 'Vorlage bearbeiten' : 'Neue Vorlage', box);
  }

  async function speichern(v, d, f2) {
    if (d.zeit_bis && !d.zeit_von) throw new Error('Bitte auch „Uhrzeit von“ eintragen.');
    if (d.zeit_von && d.zeit_bis && d.zeit_bis <= d.zeit_von) {
      throw new Error('„Uhrzeit bis“ muss nach „Uhrzeit von“ liegen.');
    }
    try {
      if (!v) {
        await api('create', { tabelle: 'Termin_Vorlagen', daten: d }, opt.token);
        toast('Vorlage angelegt.');
      } else {
        const r = await api('update', {
          tabelle: 'Termin_Vorlagen', id: v.id, daten: d, bekannt: v.geaendert_am
        }, opt.token);
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      f2.schliessen();
      zeigeVorlagen(opt);
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
        throw new Error('Jemand anderes hat diese Vorlage gerade geändert oder gelöscht. ' +
          'Klicke auf „Abbrechen“ und öffne die Liste noch einmal.');
      }
      throw e;
    }
  }

  async function loeschen(v, f2) {
    if (!window.confirm('Diese Vorlage wirklich löschen?\n\n„' + txt(v.name) + '“')) return;
    try {
      await api('delete', { tabelle: 'Termin_Vorlagen', id: v.id, bekannt: v.geaendert_am }, opt.token);
      toast('Gelöscht.');
      f2.schliessen();
      zeigeVorlagen(opt);
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      toast(e.code === 'konflikt'
        ? 'Jemand anderes hat dies gerade geändert. Bitte neu öffnen.'
        : e.message);
    }
  }

  async function standardAnlegen(d) {
    try {
      await api('create', { tabelle: 'Termin_Vorlagen', daten: d }, opt.token);
      toast('Vorlage angelegt.');
      await laden();
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) { fenster.schliessen(); return; }
      toast(e.message);
    }
  }

  function zeichne(zeilen) {
    leeren(inhalt);
    const liste = zeilen.slice().sort(function (a, b) {
      return txt(a.name).localeCompare(txt(b.name), 'de');
    });
    const std = STANDARD[txt(opt.kurzname).toLowerCase()];

    inhalt.append(el('p', {
      class: 'leise',
      text: 'Eine Vorlage füllt das Formular für einen neuen Termin aus. ' +
        'Das Datum ist der nächste passende Wochentag, du kannst es ändern.'
    }));

    if (!liste.length) {
      inhalt.append(el('p', { class: 'leise', text: 'Noch keine Vorlagen.' }));
      if (std) {
        inhalt.append(el('div', { class: 'teil-aktionen' },
          el('button', {
            class: 'knopf', type: 'button', text: std.name + ' anlegen',
            onclick: function () { standardAnlegen(std); }
          })
        ));
      }
    } else {
      inhalt.append(el('ul', { class: 'dash-todo-liste' }, ...liste.map(function (v) {
        return el('li', { class: 'dash-zeile mit-hut' },
          el('div', { class: 'dash-todo' },
            el('strong', { text: txt(v.name) }),
            el('span', { class: 'leise', text: infoText(v) })
          ),
          el('div', { class: 'hut-knoepfe' },
            el('button', {
              class: 'knopf knopf-klein', type: 'button', text: 'Termin anlegen',
              onclick: function () { ausVorlage(v); }
            }),
            el('button', {
              class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Bearbeiten',
              onclick: function () { formFenster(v); }
            })
          )
        );
      })));
    }

    inhalt.append(el('div', { class: 'fenster-loeschen form-knoepfe' },
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: '+ Neue Vorlage',
        onclick: function () { formFenster(null); }
      }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Schließen',
        onclick: function () { fenster.schliessen(); }
      })
    ));
  }

  async function laden() {
    leeren(inhalt);
    inhalt.append(el('p', { class: 'leise', text: 'Lade Vorlagen …' }));
    try {
      const r = await api('list', { tabelle: 'Termin_Vorlagen' }, opt.token);
      zeichne(r.zeilen || []);
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) { fenster.schliessen(); return; }
      leeren(inhalt);
      inhalt.append(
        el('p', { class: 'fehler', text: 'Die Vorlagen konnten nicht geladen werden: ' + e.message }),
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Schließen',
          onclick: function () { fenster.schliessen(); }
        })
      );
    }
  }

  laden();
}
