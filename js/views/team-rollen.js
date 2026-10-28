// js/views/team-rollen.js
// Gruppen-Rollen bearbeiten (Etappe 9, Schritt 9.3). Aufklapper „Gruppen-Rollen (n)“ im Reiter Team:
// Liste der Rollen (Reihenfolge, dann A–Z) mit den Personen, die sie haben. „+ Rolle“, „Bearbeiten“, „Löschen“
// in einem Fenster (wie die Termin-Vorlagen). Alle in der Gruppe dürfen die Liste ändern (Antwort E).
// Im Formular „+ Rolle“ stehen die Standard-Rollen der Gruppe als Vorschläge zum Antippen (Antwort B,
// kein Knopf für alle auf einmal). Bundes-Deli 1 und 2 sind fest gewählt (höchstens eine Person, prüft das Skript).
// Wird eine Rolle gelöscht, trägt das Skript sie bei allen Personen aus (Team.gs, teamKaskade).
// Seit 9.8a (Wunsch der Person): Im Fenster „Wer hat die Rolle?“ zum Antippen (ändert Personen.rollen der gewählten
// Karten), und die Überschrift zeigt, wie viele Rollen noch offen sind (niemand hat sie).
//
// baueRollen({ ctx, token, kurzname, daten() -> { personen, rollen }, neuLaden() -> Promise }) -> { el, zeichne() }

import { el, leeren, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA, istWahr } from '../schema.js';
import { sortiereRollen, passtRolle, rollenIds, istAktiv } from './team-rechnen.js';

export const HINWEIS_ROLLEN = 'Eine Gruppen-Rolle heißt nicht, dass du dich allein kümmern musst. Du kannst jederzeit Unterstützung bekommen.';

// Standard-Rollen je Gruppe (Entscheidung 2). KB hat keine (Antwort A).
export const STANDARD_ROLLEN = {
  fff: [
    { name: 'Social Media' }, { name: 'Webseite' }, { name: 'Finanzen' }, { name: 'Technik' },
    { name: 'Logistik' }, { name: 'Presse' }, { name: 'Schuldelis' }, { name: 'Hochschulgruppe' },
    { name: 'Vernetzung' }, { name: 'Schlüssel' },
    { name: 'Bundes-Deli 1', gewaehlt: true }, { name: 'Bundes-Deli 2', gewaehlt: true }
  ],
  gp: [
    { name: 'Öffko', beschreibung: 'Öffentlichkeitskoordination' },
    { name: 'Fiko', beschreibung: 'Finanzkoordination' },
    { name: 'Gruko', beschreibung: 'Gruppenkoordination' },
    { name: 'Aktionsteam' }
  ]
};

// Standard-Rollen der Gruppe, die es noch nicht gibt (Name ohne Groß- und Kleinschreibung verglichen)
export function vorschlaegeFuer(kurzname, rollen) {
  const da = (rollen || []).map(function (r) { return txt(r.name).toLowerCase(); });
  return (STANDARD_ROLLEN[txt(kurzname).toLowerCase()] || []).filter(function (v) {
    return da.indexOf(v.name.toLowerCase()) < 0;
  });
}

const MAX_NAME = 40;

export function baueRollen(o) {
  let ersterAufbau = true;
  const titel = el('summary', { text: 'Gruppen-Rollen' });
  const inhalt = el('div', { class: 'team-rollen-inhalt' });
  const teil = el('details', { class: 'karte team-rollen-teil' }, titel, inhalt);

  function personenMit(r) {
    return o.daten().personen.filter(function (p) { return passtRolle(p, r.id); })
      .map(function (p) { return txt(p.name); })
      .sort(function (a, b) { return a.localeCompare(b, 'de'); });
  }

  function zeichne() {
    const rollen = sortiereRollen(o.daten().rollen);
    const offen = rollen.filter(function (r) { return !personenMit(r).length; }).length;
    titel.textContent = 'Gruppen-Rollen (' + rollen.length + (rollen.length ? ' · ' + offen + ' offen' : '') + ')';
    // Hat die Gruppe noch keine Rollen, ist der Aufklapper beim ersten Aufbau offen
    if (ersterAufbau) {
      teil.open = rollen.length === 0;
      ersterAufbau = false;
    }
    leeren(inhalt);
    inhalt.append(el('p', { class: 'leise', text: HINWEIS_ROLLEN }));
    if (!rollen.length) {
      inhalt.append(el('p', { class: 'leise', text: 'Noch keine Gruppen-Rollen. Lege sie mit „+ Rolle“ an.' }));
    } else {
      inhalt.append(el('ul', { class: 'team-rollen-verwalten' }, ...rollen.map(function (r) {
        const wer = personenMit(r);
        return el('li', null,
          el('div', { class: 'team-rolle-info' },
            el('span', { class: 'team-name' },
              el('strong', { text: txt(r.name) }),
              istWahr(r.gewaehlt) ? el('span', { class: 'team-marke', text: 'gewählt' }) : null,
              wer.length ? null : el('span', { class: 'team-marke team-marke-offen', text: 'offen' })
            ),
            txt(r.beschreibung) ? el('span', { class: 'leise', text: txt(r.beschreibung) }) : null,
            el('span', { class: 'leise', text: wer.length ? 'Haben: ' + wer.join(', ') : 'Noch niemand' })
          ),
          el('button', {
            class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Bearbeiten',
            onclick: function () { formFenster(r); }
          })
        );
      })));
    }
    inhalt.append(el('div', { class: 'form-knoepfe' },
      el('button', { class: 'knopf', type: 'button', text: '+ Rolle', onclick: function () { formFenster(null); } })
    ));
  }

  // ---- Fenster: anlegen und bearbeiten ----

  function formFenster(r) {
    let fenster = null;
    const start = r
      ? { name: r.name, beschreibung: r.beschreibung, gewaehlt: istWahr(r.gewaehlt), sortierung: r.sortierung }
      : { gewaehlt: false };
    // Wer hat die Rolle? Auswahl der Team-Karten (beim Bearbeiten die bisherigen vorgewählt)
    const auswahl = {};
    if (r) o.daten().personen.forEach(function (p) { if (passtRolle(p, r.id)) auswahl[String(p.id)] = true; });
    const form = baueFormular(SCHEMA.Gruppen_Rollen.felder, start, {
      speichernText: r ? 'Speichern' : 'Anlegen',
      onSpeichern: function (d) { return speichern(r, d, fenster, auswahl); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    const wahl = el('div', { class: 'team-rollen-wahl' });
    function wahlZeichnen() {
      leeren(wahl);
      const personen = o.daten().personen.slice().sort(function (a, b) { return txt(a.name).localeCompare(txt(b.name), 'de'); });
      if (!personen.length) wahl.append(el('p', { class: 'leise', text: 'Noch niemand im Team.' }));
      personen.forEach(function (p) {
        const id = String(p.id);
        const an = !!auswahl[id];
        wahl.append(el('button', {
          class: 'team-rolle-knopf' + (an ? ' an' : ''), type: 'button', 'aria-pressed': an ? 'true' : 'false',
          text: (an ? '✓ ' : '') + txt(p.name) + (istAktiv(p) ? '' : ' (Pause)'),
          onclick: function () {
            if (auswahl[id]) delete auswahl[id]; else auswahl[id] = true;
            wahlZeichnen();
          }
        }));
      });
    }
    wahlZeichnen();
    form.insertBefore(el('div', { class: 'formfeld team-rollen-wer' },
      el('span', { class: 'formlabel', text: 'Wer hat die Rolle? (antippen, freiwillig)' }),
      wahl
    ), form.querySelector('.fehler'));
    const box = el('div', null);

    // Vorschläge zum Antippen (nur beim Anlegen): füllen Name, Beschreibung und „gewählt“
    const vorschlaege = r ? [] : vorschlaegeFuer(o.kurzname, o.daten().rollen);
    if (vorschlaege.length) {
      box.append(
        el('p', { class: 'leise', text: 'Vorschläge zum Antippen:' }),
        el('div', { class: 'team-vorschlaege' }, ...vorschlaege.map(function (v) {
          return el('button', {
            class: 'knopf knopf-hell knopf-klein', type: 'button',
            text: v.name + (v.gewaehlt ? ' (gewählt)' : ''),
            onclick: function () {
              form.querySelector('[name="name"]').value = v.name;
              form.querySelector('[name="beschreibung"]').value = v.beschreibung || '';
              form.querySelector('[name="gewaehlt"]').checked = !!v.gewaehlt;
            }
          });
        }))
      );
    }
    box.append(form);
    if (r) {
      box.append(el('div', { class: 'fenster-loeschen' },
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(r, fenster); }
        })
      ));
    }
    fenster = zeigeFenster(r ? 'Rolle bearbeiten' : 'Neue Gruppen-Rolle', box);
    const feld = form.querySelector('[name="name"]');
    if (feld) feld.focus();
  }

  // Trägt die Rolle bei den Personen ein oder aus (nur wo sich etwas ändert). richtung 'ein' oder 'aus': nur diese Richtung.
  // Gibt die Namen zurück, bei denen es nicht geklappt hat (zum Beispiel Karte inzwischen geändert).
  async function personenSetzen(rid, auswahl, richtung) {
    const fehler = [];
    for (const p of o.daten().personen) {
      const ids = rollenIds(p);
      const hat = ids.indexOf(String(rid)) >= 0;
      const soll = !!auswahl[String(p.id)];
      if (hat === soll || (richtung === 'ein' && !soll) || (richtung === 'aus' && soll)) continue;
      const neu = soll ? ids.concat(String(rid)) : ids.filter(function (x) { return x !== String(rid); });
      try {
        const res = await api('update', {
          tabelle: 'Personen', id: p.id, daten: { rollen: neu.join('\n') }, bekannt: p.geaendert_am
        }, o.token);
        if (res && res.eintrag) Object.assign(p, res.eintrag);
      } catch (e) {
        if (e.code === 'auth') throw e;
        fehler.push(txt(p.name) + ' (' + (e.code === 'konflikt' ? 'Karte wurde inzwischen geändert' : e.message) + ')');
      }
    }
    return fehler;
  }

  async function speichern(r, d, fenster, auswahl) {
    if (txt(d.name).length > MAX_NAME) throw new Error('Der Name ist zu lang (höchstens ' + MAX_NAME + ' Zeichen).');
    if (d.gewaehlt && Object.keys(auswahl).length > 1) throw new Error('Eine fest gewählte Rolle hat höchstens eine Person.');
    try {
      let fehler = [];
      if (!r) {
        const neu = await api('create', { tabelle: 'Gruppen_Rollen', daten: d }, o.token);
        fehler = await personenSetzen(neu.id, auswahl, 'ein');
        toast('Rolle „' + txt(d.name) + '“ angelegt.' + (fehler.length ? ' Nicht eingetragen bei: ' + fehler.join(', ') : ''));
      } else {
        // Erst austragen, dann die Rolle ändern, dann eintragen (so passt „gewählt: höchstens eine Person“)
        fehler = await personenSetzen(r.id, auswahl, 'aus');
        const res = await api('update', {
          tabelle: 'Gruppen_Rollen', id: r.id, daten: d, bekannt: r.geaendert_am
        }, o.token);
        fehler = fehler.concat(await personenSetzen(r.id, auswahl, 'ein'));
        toast((res && res.geaendert ? 'Änderung gespeichert.' : 'Gespeichert.') + (fehler.length ? ' Nicht geändert bei: ' + fehler.join(', ') : ''));
      }
      fenster.schliessen();
      await o.neuLaden();
    } catch (e) {
      if (o.ctx.behandleFehler(e)) { fenster.schliessen(); return; }
      if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
        o.neuLaden();
        throw new Error('Jemand anderes hat diese Rolle gerade geändert oder gelöscht. ' +
          'Klicke auf „Abbrechen“ und öffne die Rolle noch einmal.');
      }
      throw e;
    }
  }

  async function loeschen(r, fenster) {
    const wer = personenMit(r);
    const frage = 'Die Rolle „' + txt(r.name) + '“ wirklich löschen?' +
      (wer.length ? '\n\nSie wird bei diesen Personen ausgetragen: ' + wer.join(', ') : '');
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'Gruppen_Rollen', id: r.id, bekannt: r.geaendert_am }, o.token);
      toast('Rolle gelöscht.');
      fenster.schliessen();
      await o.neuLaden();
    } catch (e) {
      if (o.ctx.behandleFehler(e)) { fenster.schliessen(); return; }
      toast(e.code === 'konflikt' || e.code === 'nicht_gefunden'
        ? 'Jemand anderes hat diese Rolle gerade geändert. Bitte neu öffnen.'
        : e.message);
      fenster.schliessen();
      await o.neuLaden();
    }
  }

  return { el: teil, zeichne: zeichne };
}
