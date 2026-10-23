// js/views/team-eintrag.js
// Team-Karte bearbeiten (Etappe 9, Schritt 9.4). Steht im Detailbereich (PC rechts, Handy Vollbild).
// - Kapazität eintragen: zehn Knöpfe 1 bis 10, „gilt ab“ (heute), „gilt bis“ mit Schnellknöpfen
//   (2 Wochen, 4 Wochen, 3 Monate; höchstens 6 Monate), kurze Notiz. Jede Angabe ist eine neue Zeile in Kapazitaet.
// - Gruppen-Rollen wählen (gewählte Rollen, die jemand anderes hat, sind gesperrt), „+ Rolle“ legt eine neue an.
// - Name, Notiz, Dabei/Pause. Ein neuer Name wird vom Skript auch in ToDos, Meilensteinen, Mobi-Beiträgen und
//   Umfrage-Antworten ersetzt (Team.gs). Bei der eigenen Karte wird der Anzeigename im Gerät mit umgestellt.
// - Verlauf mit „Löschen“ je Angabe, „Austragen“ (das Skript löscht die Kapazität mit).
// Ändern mit Konfliktprüfung (bekannt = geaendert_am). Keine Offline-Schreibzugriffe.
//
// zeigeEintrag({ ctx, token, person, daten() -> { personen, rollen, kapazitaet },
//                fertig(personId, modus 'lesen'|'bearbeiten'|'weg') -> Promise, beiZu() })
// umbenennen({ ctx, token }, person, neuerName) -> Promise<Text für die Meldung>

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeDetail } from '../ui/detail.js';
import { toast } from '../ui/toast.js';
import { getName, setName } from '../store.js';
import { istWahr } from '../schema.js';
import { datumText, heuteIso } from './todos-rechnen.js';
import { addTage } from './kalender-rechnen.js';
import {
  txt, istIch, istAktiv, rollenIds, sortiereRollen, kapazitaetText, verlauf, angabeJetzt, angabeZustand,
  gewaehltVon, umbenanntText, kapazitaetFehler
} from './team-rechnen.js';
import { HINWEIS_ROLLEN } from './team-rollen.js';

const MAX_NOTIZ = 120;
const DATENSCHUTZ = 'Schreib keine Gründe auf, die deine Gesundheit oder Familie betreffen.';
const SCHNELL = [['2 Wochen', 14], ['4 Wochen', 28], ['3 Monate', 91]];

// Fehlertexte für Speichern
function fehlerText(e, was) {
  if (e.code === 'konflikt') return 'Jemand anderes hat ' + was + ' inzwischen geändert. Schließe und öffne die Karte noch einmal.';
  if (e.code === 'nicht_gefunden') return e.message;
  if (e.code === 'netz') return 'Keine Verbindung. Gespeichert wird nur mit Verbindung.';
  return e.message;
}

// Datumsfeld: Klick auf das ganze Feld öffnet die Auswahl (wie in form.js)
function datumsFeld(wert, label) {
  const f = el('input', { class: 'feld', type: 'date', value: wert, 'aria-label': label });
  f.addEventListener('click', function () { try { if (f.showPicker) f.showPicker(); } catch (e) { /* egal */ } });
  return f;
}

// Name ändern. Gibt den Text für die Meldung zurück. Stellt bei der eigenen Karte den Anzeigenamen um.
export async function umbenennen(o, person, neu) {
  const war = txt(person.name);
  const ich = istIch(person, getName());
  const r = await api('update', {
    tabelle: 'Personen', id: person.id, daten: { name: neu }, bekannt: person.geaendert_am
  }, o.token);
  if (ich) setName(neu);
  const mit = umbenanntText(r && r.umbenannt);
  return '„' + war + '“ heißt jetzt „' + neu + '“.' + (mit ? ' Auch geändert: ' + mit + '.' : '');
}

export function zeigeEintrag(o) {
  const p = o.person;
  const d = o.daten();
  const heute = heuteIso();
  const inhalt = el('div', { class: 'team-eintrag' });

  // ---- Kapazität ----
  let wahl = 0;
  const satz = el('p', { class: 'leise team-wert-satz', text: 'Wie viel Zeit und Kraft hast du gerade? 1 = kaum, 10 = viel.' });
  const werte = el('div', { class: 'team-werte', role: 'group', 'aria-label': 'Kapazität von 1 bis 10' });
  for (let i = 1; i <= 10; i++) {
    werte.append(el('button', {
      class: 'knopf knopf-hell team-wert', type: 'button', text: String(i), 'aria-pressed': 'false',
      onclick: function () {
        wahl = i;
        werte.querySelectorAll('.team-wert').forEach(function (b, j) {
          b.setAttribute('aria-pressed', j + 1 === i ? 'true' : 'false');
        });
        satz.textContent = i + ' = ' + kapazitaetText(i);
      }
    }));
  }
  const ab = datumsFeld(heute, 'Gilt ab');
  const bis = datumsFeld(addTage(heute, 28), 'Gilt bis');
  const schnell = el('div', { class: 'team-schnell' }, ...SCHNELL.map(function (s) {
    return el('button', {
      class: 'knopf knopf-hell knopf-klein', type: 'button', text: s[0],
      onclick: function () { bis.value = addTage(ab.value || heute, s[1]); }
    });
  }));
  const notizK = el('input', { class: 'feld', type: 'text', maxlength: String(MAX_NOTIZ), placeholder: 'zum Beispiel „Urlaub“ (freiwillig)', 'aria-label': 'Notiz zur Kapazität' });
  const zaehlerK = el('span', { class: 'leise', text: '0 / ' + MAX_NOTIZ });
  notizK.addEventListener('input', function () { zaehlerK.textContent = notizK.value.length + ' / ' + MAX_NOTIZ; });
  const fehlerK = el('p', { class: 'fehler', role: 'alert' });
  const knopfK = el('button', { class: 'knopf', type: 'button', text: 'Kapazität speichern', onclick: kapazitaetSpeichern });

  inhalt.append(el('section', { class: 'team-abschnitt' },
    el('h3', { text: 'Kapazität eintragen' }),
    werte, satz,
    el('div', { class: 'team-datum-zeile' },
      el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Gilt ab' }), ab),
      el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Gilt bis' }), bis)
    ),
    schnell,
    el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Notiz zur Kapazität' }), notizK, zaehlerK),
    el('p', { class: 'leise', text: DATENSCHUTZ }),
    fehlerK,
    el('div', { class: 'form-knoepfe' }, knopfK)
  ));

  async function kapazitaetSpeichern() {
    fehlerK.textContent = kapazitaetFehler(wahl, ab.value, bis.value);
    if (fehlerK.textContent) return;
    knopfK.disabled = true;
    try {
      await api('create', {
        tabelle: 'Kapazitaet',
        daten: { person_id: p.id, kapazitaet: wahl, gueltig_ab: ab.value, gueltig_bis: bis.value, notiz: notizK.value.trim() }
      }, o.token);
      toast('Kapazität gespeichert.');
      await o.fertig(p.id, 'bearbeiten');
    } catch (e) {
      if (o.ctx.behandleFehler(e)) return;
      fehlerK.textContent = fehlerText(e, 'die Karte');
      knopfK.disabled = false;
    }
  }

  // ---- Verlauf ----
  const liste = verlauf(p.id, d.kapazitaet, heute);
  if (liste.length) {
    const stand = angabeJetzt(p.id, d.kapazitaet, heute);
    const gueltig = stand.zustand === 'gilt' ? stand.angabe.id : '';
    const zustandText = { gilt: 'gilt jetzt', ueberholt: 'ersetzt', kuenftig: 'kommt noch', abgelaufen: 'abgelaufen' };
    inhalt.append(el('section', { class: 'team-abschnitt' },
      el('h3', { text: 'Bisherige Angaben' }),
      el('ul', { class: 'team-verlauf-bearbeiten' }, ...liste.map(function (k) {
        const z = angabeZustand(k, gueltig, heute);
        return el('li', { class: 'team-verlauf-' + z },
          el('span', null,
            el('strong', { text: String(k.kapazitaet) }),
            el('span', { text: ' · ' + datumText(k.gueltig_ab) + ' bis ' + datumText(k.gueltig_bis) + ' · ' + zustandText[z] }),
            txt(k.notiz) ? el('span', { class: 'leise team-verlauf-notiz', text: txt(k.notiz) }) : null
          ),
          el('button', {
            class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Löschen',
            onclick: function () { angabeLoeschen(k); }
          })
        );
      }))
    ));
  }

  async function angabeLoeschen(k) {
    if (!window.confirm('Diese Angabe löschen?\n\n' + k.kapazitaet + ' · ' + datumText(k.gueltig_ab) + ' bis ' + datumText(k.gueltig_bis))) return;
    try {
      await api('delete', { tabelle: 'Kapazitaet', id: k.id, bekannt: k.geaendert_am }, o.token);
      toast('Angabe gelöscht.');
      await o.fertig(p.id, 'bearbeiten');
    } catch (e) {
      if (o.ctx.behandleFehler(e)) return;
      toast(fehlerText(e, 'die Angabe'));
    }
  }

  // ---- Gruppen-Rollen, Name, Notiz, Pause ----
  const gewaehlt = rollenIds(p);
  const rollen = sortiereRollen(d.rollen);
  const chips = el('div', { class: 'team-rollen-wahl' });
  function chipsZeichnen() {
    leeren(chips);
    if (!rollen.length) chips.append(el('p', { class: 'leise', text: 'Noch keine Gruppen-Rollen. Lege unten eine an.' }));
    rollen.forEach(function (r) {
      const id = String(r.id);
      const an = gewaehlt.indexOf(id) >= 0;
      const anderer = gewaehltVon(r, d.personen, p.id);
      const gesperrt = !!anderer && !an;
      const knopf = el('button', {
        class: 'team-rolle-knopf' + (an ? ' an' : '') + (istWahr(r.gewaehlt) ? ' team-rolle-gewaehlt' : ''),
        type: 'button',
        'aria-pressed': an ? 'true' : 'false',
        title: txt(r.beschreibung),
        text: (an ? '✓ ' : '') + txt(r.name) + (istWahr(r.gewaehlt) ? ' · gewählt' : '') + (gesperrt ? ' (hat ' + txt(anderer.name) + ')' : ''),
        onclick: function () {
          const i = gewaehlt.indexOf(id);
          if (i >= 0) gewaehlt.splice(i, 1); else gewaehlt.push(id);
          chipsZeichnen();
        }
      });
      knopf.disabled = gesperrt;
      chips.append(knopf);
    });
  }
  chipsZeichnen();

  const neueRolle = el('input', { class: 'feld', type: 'text', maxlength: '40', placeholder: 'Neue Rolle', 'aria-label': 'Neue Gruppen-Rolle' });
  const knopfRolle = el('button', { class: 'knopf knopf-hell', type: 'button', text: '+ Rolle', onclick: rolleAnlegen });
  async function rolleAnlegen() {
    const n = neueRolle.value.trim();
    if (!n) { neueRolle.focus(); return; }
    knopfRolle.disabled = true;
    try {
      const r = await api('create', { tabelle: 'Gruppen_Rollen', daten: { name: n, gewaehlt: false } }, o.token);
      rollen.push(r);
      d.rollen.push(r);
      gewaehlt.push(String(r.id));
      neueRolle.value = '';
      chipsZeichnen();
      toast('Rolle „' + n + '“ angelegt und ausgewählt. Bitte noch speichern.');
    } catch (e) {
      if (o.ctx.behandleFehler(e)) return;
      toast(fehlerText(e, 'die Rollen'));
    }
    knopfRolle.disabled = false;
  }

  const name = el('input', { class: 'feld', type: 'text', maxlength: '60', value: txt(p.name), 'aria-label': 'Name' });
  const notiz = el('input', { class: 'feld', type: 'text', maxlength: String(MAX_NOTIZ), value: txt(p.notiz), 'aria-label': 'Notiz' });
  const dabei = el('input', { type: 'checkbox' });
  dabei.checked = istAktiv(p);
  const fehlerP = el('p', { class: 'fehler', role: 'alert' });
  const knopfP = el('button', { class: 'knopf', type: 'button', text: 'Speichern', onclick: karteSpeichern });

  inhalt.append(el('section', { class: 'team-abschnitt' },
    el('h3', { text: 'Gruppen-Rollen' }),
    el('p', { class: 'leise', text: HINWEIS_ROLLEN }),
    chips,
    el('div', { class: 'team-neue-rolle' }, neueRolle, knopfRolle),
    el('h3', { text: 'Name und Notiz' }),
    el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Name' }), name),
    el('p', { class: 'leise', text: 'Ein neuer Name wird auch in ToDos, Meilensteinen, Mobi-Beiträgen und Umfrage-Antworten geändert.' }),
    el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Notiz (freiwillig, kurz)' }), notiz),
    el('p', { class: 'leise', text: DATENSCHUTZ }),
    el('label', { class: 'formfeld-bool' }, dabei, el('span', { text: 'Dabei (ohne Haken = Pause: Die Karte steht unten und zählt nicht im Berg)' })),
    fehlerP,
    el('div', { class: 'form-knoepfe' }, knopfP,
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Schließen', onclick: function () { o.fertig(p.id, 'lesen'); } }))
  ));

  async function karteSpeichern() {
    fehlerP.textContent = '';
    const neuName = name.value.trim();
    if (neuName.length < 2) { fehlerP.textContent = 'Bitte einen Namen mit mindestens 2 Zeichen.'; name.focus(); return; }
    const umbenannt = neuName !== txt(p.name);
    if (umbenannt && !window.confirm('Aus „' + txt(p.name) + '“ wird „' + neuName + '“.\n\n' +
      'Der Name wird auch in ToDos, Meilensteinen, Mobi-Beiträgen und Umfrage-Antworten geändert. Weiter?')) return;
    knopfP.disabled = true;
    try {
      const r = await api('update', {
        tabelle: 'Personen', id: p.id, bekannt: p.geaendert_am,
        daten: { name: neuName, notiz: notiz.value.trim(), aktiv: dabei.checked, rollen: gewaehlt.join('\n') }
      }, o.token);
      if (umbenannt && istIch(p, getName())) setName(neuName);
      const mit = umbenanntText(r && r.umbenannt);
      toast(!r || r.geaendert === false ? 'Nichts geändert.'
        : 'Gespeichert.' + (mit ? ' Auch geändert: ' + mit + '.' : ''));
      await o.fertig(p.id, 'lesen');
    } catch (e) {
      if (o.ctx.behandleFehler(e)) return;
      fehlerP.textContent = fehlerText(e, 'die Karte');
      knopfP.disabled = false;
    }
  }

  // ---- Austragen ----
  const ich = istIch(p, getName());
  inhalt.append(el('section', { class: 'team-abschnitt' },
    el('div', { class: 'fenster-loeschen' },
      el('button', {
        class: 'knopf knopf-gefahr', type: 'button', text: ich ? 'Mich austragen' : 'Aus dem Team austragen',
        onclick: austragen
      })
    )
  ));

  async function austragen() {
    if (!window.confirm((ich ? 'Dich' : '„' + txt(p.name) + '“') + ' wirklich aus dem Team austragen?\n\n' +
      'Die Karte und alle Angaben zur Kapazität werden gelöscht. Namen in ToDos und Protokollen bleiben.')) return;
    try {
      await api('delete', { tabelle: 'Personen', id: p.id, bekannt: p.geaendert_am }, o.token);
      toast(ich ? 'Du bist ausgetragen.' : 'Ausgetragen.');
      await o.fertig(p.id, 'weg');
    } catch (e) {
      if (o.ctx.behandleFehler(e)) return;
      toast(fehlerText(e, 'die Karte'));
    }
  }

  zeigeDetail(o.ctx.detail, 'Bearbeiten: ' + (txt(p.name) || 'Person'), inhalt, o.beiZu, true);
}
