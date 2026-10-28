// js/views/start-umfragen.js
// Umfragen auf dem Start: In der Kachel steht nur eine Zeile je Umfrage. Ein Klick öffnet ein Fenster
// (Abstimmen und Ergebnis). Beendet wird von Hand, dann steht die Umfrage im Archiv.
// Die Frist färbt die Zeile (heute = orange, vorbei = rot), beendet aber nichts.
// Jede Person (nach Anzeigename) hat eine Stimme. In der App sieht man nur Zahlen, keine Namen.
// Tabs: Umfragen (frage, optionen, ablauf_am, mehrfach, beendet), Umfrage_Antworten (umfrage_id, person, auswahl).
// opt: { ctx, token, holeDaten() -> { umfragen, antworten }, neuLaden() -> Promise }

import { el, leeren, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';

// Welche Umfragen im Archiv aufgeklappt sind (bleibt beim Neuzeichnen erhalten)
const archivOffen = {};

function optionenVon(u) {
  return txt(u.optionen)
    .split('\n')
    .map(function (t) { return t.trim(); })
    .filter(Boolean);
}

function beendet(u) {
  return istWahr(u.beendet);
}

// '' | 'ueberfaellig' | 'heute' (nur für laufende Umfragen)
function fristStatus(u) {
  if (beendet(u)) return '';
  const d = normDatum(u.ablauf_am);
  if (!d) return '';
  const h = heuteIso();
  if (d < h) return 'ueberfaellig';
  if (d === h) return 'heute';
  return '';
}

function fristText(u) {
  if (!u.ablauf_am) return 'Ohne Frist';
  const t = datumText(u.ablauf_am);
  if (beendet(u)) return 'Frist war ' + t;
  const st = fristStatus(u);
  if (st === 'ueberfaellig') return 'Frist ' + t + ' (überfällig)';
  if (st === 'heute') return 'Frist ' + t + ' (heute)';
  return 'Frist ' + t;
}

// "0,2" -> [0, 2]
function auswahlVon(a) {
  return String(a.auswahl === undefined || a.auswahl === null ? '' : a.auswahl)
    .split(',')
    .map(function (t) { return t.trim(); })
    .filter(function (t) { return t !== ''; })
    .map(Number)
    .filter(function (n) { return !isNaN(n); });
}

// Laufende: bald fällige zuerst, ohne Frist zuletzt
function nachFrist(a, b) {
  const da = normDatum(a.ablauf_am);
  const db = normDatum(b.ablauf_am);
  if (da !== db) {
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? -1 : 1;
  }
  return String(b.erstellt_am || '').localeCompare(String(a.erstellt_am || ''));
}

// Archiv: zuletzt beendete zuerst
function nachBeendet(a, b) {
  return String(b.geaendert_am || '').localeCompare(String(a.geaendert_am || ''));
}

function finde(id, opt) {
  return opt.holeDaten().umfragen.find(function (u) { return String(u.id) === String(id); }) || null;
}

function stimmenVon(u, antworten) {
  return antworten.filter(function (a) { return String(a.umfrage_id) === String(u.id); });
}

function meineStimme(u, antworten) {
  const n = txt(getName()).toLowerCase();
  if (!n) return null;
  return stimmenVon(u, antworten).find(function (a) {
    return txt(a.person).toLowerCase() === n;
  }) || null;
}

export function anzahlBeendet(liste) {
  return (liste || []).filter(beendet).length;
}

// Text in die Zwischenablage legen
function kopieren(text) {
  const fehlt = function () { toast('Kopieren hat nicht geklappt. Bitte den Text markieren.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('Ergebnis kopiert.'); }, fehlt);
  } else {
    fehlt();
  }
}

// ---- Beenden und wieder öffnen ----

async function beendetSetzen(u, wert, text, opt, nachher) {
  try {
    await api('update', { tabelle: 'Umfragen', id: u.id, daten: { beendet: wert } }, opt.token);
    toast(text);
    await opt.neuLaden();
    if (nachher) nachher();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'nicht_gefunden') {
      toast('Diese Umfrage gibt es nicht mehr.');
      opt.neuLaden();
    } else {
      toast(e.message);
    }
  }
}

async function beenden(u, opt, nachher) {
  const frage = 'Umfrage beenden?\n\n„' + txt(u.frage) + '“\n\n' +
    'Danach kann niemand mehr abstimmen. Sie steht dann im Archiv.';
  if (!window.confirm(frage)) return;
  await beendetSetzen(u, true, 'Umfrage beendet.', opt, nachher);
}

// ---- Inhalt einer Umfrage (im Fenster und im Archiv) ----

function umfrageBlock(u, opt, neuZeichnen) {
  const antworten = opt.holeDaten().antworten;
  const optionen = optionenVon(u);
  const aus = beendet(u);
  const mehrfach = istWahr(u.mehrfach);
  const alle = stimmenVon(u, antworten);
  const zaehler = optionen.map(function () { return 0; });
  alle.forEach(function (a) {
    auswahlVon(a).forEach(function (i) {
      if (i >= 0 && i < zaehler.length) zaehler[i] += 1;
    });
  });
  const personen = alle.length;
  const mein = meineStimme(u, antworten);
  const meine = mein ? auswahlVon(mein) : [];
  const eingaben = [];
  const textZeilen = [];   // für "Ergebnis kopieren"
  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const abstimmen = el('button', {
    class: 'knopf', type: 'button', text: mein ? 'Stimme ändern' : 'Abstimmen'
  });

  const reihen = optionen.map(function (text, i) {
    // Beendet: nur Text ohne Balken (leicht zu kopieren), bei namentlichen Umfragen mit Namen
    if (aus) {
      const namen = !istWahr(u.namentlich) ? [] : alle.filter(function (a) {
        return auswahlVon(a).indexOf(i) >= 0;
      }).map(function (a) { return txt(a.person); })
        .sort(function (a, b) { return a.localeCompare(b, 'de'); });
      const zeileText = text + ': ' + zaehler[i] + (zaehler[i] === 1 ? ' Stimme' : ' Stimmen');
      textZeilen.push(zeileText + (namen.length ? ' (' + namen.join(', ') + ')' : ''));
      return el('div', { class: 'umfrage-option' },
        el('strong', { text: zeileText }),
        namen.length ? el('span', { text: namen.join(', ') }) : null
      );
    }
    const p = personen ? Math.round(zaehler[i] * 100 / personen) : 0;
    const balken = fortschrittsBalken(
      p, zaehler[i] + (zaehler[i] === 1 ? ' Stimme' : ' Stimmen') + ' · ' + p + ' %'
    );
    const inp = el('input', {
      type: mehrfach ? 'checkbox' : 'radio',
      name: 'umfrage-' + u.id,
      class: 'auswahl-box',
      'aria-label': text
    });
    inp.checked = meine.indexOf(i) >= 0;
    eingaben.push({ i: i, inp: inp });
    const zeile = el('label', { class: 'umfrage-option-zeile' }, inp, el('span', { text: text }));
    return el('div', { class: 'umfrage-option' }, zeile, balken);
  });

  abstimmen.addEventListener('click', async function () {
    fehler.textContent = '';
    const gewaehlt = eingaben.filter(function (e) { return e.inp.checked; })
      .map(function (e) { return e.i; });
    if (!gewaehlt.length) {
      fehler.textContent = 'Bitte eine Antwort auswählen.';
      return;
    }
    abstimmen.disabled = true;
    const wert = gewaehlt.join(',');
    try {
      if (mein) {
        await api('update', {
          tabelle: 'Umfrage_Antworten', id: mein.id, daten: { auswahl: wert }
        }, opt.token);
      } else {
        await api('create', {
          tabelle: 'Umfrage_Antworten',
          daten: { umfrage_id: String(u.id), person: getName() || 'unbekannt', auswahl: wert }
        }, opt.token);
      }
      toast('Deine Stimme ist gespeichert.');
      await opt.neuLaden();
      if (neuZeichnen) neuZeichnen();
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      fehler.textContent = e.message;
    }
    abstimmen.disabled = false;
  });

  const meta = [
    aus ? 'Beendet' : '',
    istWahr(u.namentlich) ? 'Namentlich' : 'Anonym',
    mehrfach ? 'Mehrere Antworten möglich' : 'Eine Antwort',
    personen + (personen === 1 ? ' Person' : ' Personen') + ' abgestimmt'
  ].filter(Boolean).join(' · ') + ' · ';

  const knoepfe = el('div', { class: 'form-knoepfe' });
  if (!aus) knoepfe.append(abstimmen);
  knoepfe.append(el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
    onclick: function () { formZeigen(u, opt, neuZeichnen); }
  }));
  if (aus) {
    knoepfe.append(el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Ergebnis kopieren',
      onclick: function () {
        kopieren(txt(u.frage) + '\n' + textZeilen.join('\n') + '\n' +
          personen + (personen === 1 ? ' Person' : ' Personen') + ' abgestimmt');
      }
    }));
    knoepfe.append(el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Wieder öffnen',
      onclick: function () {
        beendetSetzen(u, false, 'Umfrage wieder geöffnet.', opt, neuZeichnen);
      }
    }));
  } else {
    knoepfe.append(el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Umfrage beenden',
      onclick: function () { beenden(u, opt, neuZeichnen); }
    }));
  }

  return el('div', { class: 'umfrage' },
    el('p', { class: 'leise' },
      el('span', { text: meta }),
      el('span', { class: 'umfrage-frist ' + fristStatus(u), text: fristText(u) })
    ),
    ...reihen,
    (!aus && istWahr(u.namentlich))
      ? el('p', {
        class: 'leise',
        text: 'Namentliche Umfrage: Dein Name steht nach dem Beenden in der Auswertung.'
      })
      : null,
    knoepfe,
    fehler
  );
}

// ---- Fenster mit einer Umfrage ----

// Auch von „Für dich“ auf dem Start benutzt (11.4)
export function oeffneUmfrage(id, opt) {
  const inhalt = el('div');
  let fenster = null;

  function zeichne() {
    leeren(inhalt);
    const u = finde(id, opt);
    if (!u) {
      if (fenster) fenster.schliessen();
      return;
    }
    inhalt.append(
      el('h3', { class: 'umfrage-frage', text: txt(u.frage) }),
      umfrageBlock(u, opt, zeichne),
      el('div', { class: 'fenster-loeschen' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Schließen',
          onclick: function () { fenster.schliessen(); }
        })
      )
    );
  }

  zeichne();
  fenster = zeigeFenster('Umfrage', inhalt, null, { aussenKlick: true });
}

// ---- Anlegen, Ändern, Löschen (u = null heißt neu) ----

function formZeigen(u, opt, nachher) {
  let fenster = null;
  const hatStimmen = !!u && stimmenVon(u, opt.holeDaten().antworten).length > 0;
  // Schon abgestimmt: Antworten und "namentlich" bleiben fest
  // (sonst stimmen die Nummern nicht mehr, und eine anonyme Umfrage könnte Namen zeigen)
  const felder = SCHEMA.Umfragen.felder.filter(function (f) {
    return !(hatStimmen && (f.name === 'optionen' || f.name === 'namentlich'));
  });
  const startWerte = u
    ? Object.assign({}, u, { namentlich: istWahr(u.namentlich) })
    : { mehrfach: false, namentlich: false };
  const form = baueFormular(felder, startWerte, {
    speichernText: u ? 'Speichern' : 'Anlegen',
    onSpeichern: function (d) { return speichern(u, d, fenster, opt, nachher); },
    onAbbrechen: function () { fenster.schliessen(); }
  });
  const inhalt = el('div', null, form);
  if (hatStimmen) {
    inhalt.prepend(el('p', {
      class: 'leise',
      text: 'Es wurde schon abgestimmt. Die Antworten und „namentlich“ lassen sich nicht mehr ändern.'
    }));
  }
  if (u) {
    inhalt.append(el('div', { class: 'fenster-loeschen' },
      el('button', {
        class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(u, fenster, opt, nachher); }
      })
    ));
  }
  fenster = zeigeFenster(u ? 'Umfrage bearbeiten' : 'Neue Umfrage', inhalt);
}

export function neueUmfrage(opt) {
  formZeigen(null, opt, null);
}

async function speichern(u, d, fenster, opt, nachher) {
  if (d.optionen !== undefined) {
    const n = String(d.optionen).split('\n')
      .map(function (t) { return t.trim(); }).filter(Boolean).length;
    if (n < 2) throw new Error('Bitte mindestens zwei Antworten eintragen (eine pro Zeile).');
    if (n > 10) throw new Error('Bitte höchstens 10 Antworten eintragen.');
  }
  try {
    if (!u) {
      await api('create', { tabelle: 'Umfragen', daten: d }, opt.token);
      toast('Umfrage angelegt.');
    } else {
      const r = await api('update', {
        tabelle: 'Umfragen', id: u.id, daten: d, bekannt: u.geaendert_am
      }, opt.token);
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
    }
    fenster.schliessen();
    await opt.neuLaden();
    if (nachher) nachher();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
      opt.neuLaden();
      throw new Error('Diese Umfrage wurde gerade geändert oder gelöscht. ' +
        'Klicke auf „Abbrechen“ und öffne sie noch einmal.');
    }
    throw e;
  }
}

async function loeschen(u, fenster, opt, nachher) {
  if (!window.confirm('Diese Umfrage wirklich löschen?\n\n„' + txt(u.frage) + '“')) return;
  try {
    await api('delete', { tabelle: 'Umfragen', id: u.id, bekannt: u.geaendert_am }, opt.token);
    fenster.schliessen();
    toast('Gelöscht.');
    await opt.neuLaden();
    if (nachher) nachher();
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

// Eine Zeile in der Kachel: Frage, Frist, Stimmen. Klick öffnet das Fenster.
function zeile(u, opt) {
  const antworten = opt.holeDaten().antworten;
  const st = fristStatus(u);
  const n = stimmenVon(u, antworten).length;
  const mein = meineStimme(u, antworten);
  const info = [
    fristText(u),
    n + ' abgestimmt',
    mein ? '✔ Du hast abgestimmt' : 'Du hast noch nicht abgestimmt'
  ].join(' · ');

  return el('li', { class: 'dash-zeile mit-hut umfrage-zeile' + (st ? ' ' + st : '') },
    el('button', {
      class: 'dash-todo pt-todo', type: 'button',
      onclick: function () { oeffneUmfrage(u.id, opt); }
    },
      el('strong', { text: txt(u.frage) }),
      el('span', { class: 'leise', text: info })
    ),
    el('div', { class: 'hut-knoepfe' },
      el('button', {
        class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Beenden',
        onclick: function () {
          beenden(u, opt, function () { oeffneUmfrage(u.id, opt); });
        }
      })
    )
  );
}

// Kachel mit den laufenden Umfragen. Gibt es keine, bleibt die Box versteckt.
export function zeichneUmfragen(box, opt) {
  leeren(box);
  const laufend = opt.holeDaten().umfragen.filter(function (u) { return !beendet(u); }).sort(nachFrist);
  box.hidden = !laufend.length;
  if (box.hidden) return;
  box.append(el('section', { class: 'karte dash-kachel' },
    el('div', { class: 'dash-kachel-titel' },
      el('h2', { text: 'Umfragen' })
    ),
    el('ul', { class: 'dash-todo-liste' }, ...laufend.map(function (u) { return zeile(u, opt); }))
  ));
}

// Archiv: beendete Umfragen mit Suche, einzeln aufklappbar (Suchtext bleibt beim Neuzeichnen erhalten)
let archivSucheU = '';

export function zeichneArchiv(box, opt) {
  leeren(box);
  const alle = opt.holeDaten().umfragen.filter(beendet).sort(nachBeendet);
  if (!alle.length) {
    box.append(el('p', { class: 'leise', text: 'Das Archiv ist leer. Beendete Umfragen stehen hier.' }));
    return;
  }

  const liste = el('div');
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Umfragen durchsuchen …',
    'aria-label': 'Beendete Umfragen durchsuchen'
  });
  suche.value = archivSucheU;

  function fuellen() {
    leeren(liste);
    archivSucheU = suche.value;
    const q = suche.value.trim().toLowerCase();
    const treffer = alle.filter(function (u) {
      return !q || (txt(u.frage) + ' ' + optionenVon(u).join(' ')).toLowerCase().indexOf(q) >= 0;
    });
    if (!treffer.length) {
      liste.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
      return;
    }
    treffer.forEach(function (u) {
      const id = String(u.id);
      const d = el('details', { class: 'projekt-teil' });
      if (archivOffen[id]) d.open = true;
      d.addEventListener('toggle', function () {
        if (d.open) archivOffen[id] = true;
        else delete archivOffen[id];
      });
      const n = stimmenVon(u, opt.holeDaten().antworten).length;
      d.append(
        el('summary', null,
          el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
          el('strong', { text: txt(u.frage) }),
          el('span', { class: 'leise', text: n + (n === 1 ? ' Person' : ' Personen') + ' · ' + fristText(u) })
        ),
        el('div', { class: 'projekt-teil-body' }, umfrageBlock(u, opt, null))
      );
      liste.append(d);
    });
  }

  suche.addEventListener('input', fuellen);
  fuellen();
  box.append(suche, liste);
}
