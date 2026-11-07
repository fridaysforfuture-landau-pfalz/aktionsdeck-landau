// js/views/projekt-zeitplan.js
// Teil "Zeitplan" eines Projekts: ein Gantt-Diagramm (Etappe 14.1). Nur Anzeige, nichts wird gespeichert.
// Zeilen: das Projekt (Balken von Start bis Aktion), je Meilenstein ein Balken bis zu seinem Datum (Raute),
// darunter zum Aufklappen seine ToDos als Punkte am Fälligkeitstag, dann „Ohne Meilenstein“ und eine Sammelzeile „Mobi“.
// Linien: Heute (gestrichelt), Aktion (grün), Deadline (pink). Antippen eines Balkens oder Punkts zeigt ein Fenster mit Infos.
// Ein Meilenstein hat nur ein Datum (Ziel). Den Anfang seines Balkens rechnet zeitplanDaten aus:
// frühestes Fälligkeitsdatum seiner ToDos, sonst das Datum des Meilensteins davor, sonst der Projektstart.
// Wird von projekte.js benutzt. Der Teil klappt auf und zu (Zustand liegt in projekte.js).
//
// Seit 14.2: Im Fenster eines ToDos oder Meilensteins gibt es „Bearbeiten“ und „Erledigt“ (Meilenstein nur ohne ToDos).
// Die Formulare und das Speichern kommen aus dem Teil „ToDos“ (projekt-todos.js füllt opt.aktionen).
//
// opt: { projekt, holeDaten() -> { todos, meilensteine, mobi }, offen (Teil aufgeklappt?), beiToggle(offen),
//        aktionen: { todoBearbeiten(t), todoAbhaken(t, wert), meilensteinBearbeiten(m), meilensteinAbhaken(m, wert) } }

import { el, txt } from '../ui/dom.js';
import { zeigeFenster } from '../ui/fenster.js';
import { istWahr } from '../schema.js';
import { normDatum, datumText, heuteIso, faelligStatus, kurz } from './todos-rechnen.js';
import { addTage, tageZwischen, wochentagNr } from './kalender-rechnen.js';
import { meilensteinStand, sortiereMeilensteine, meilensteinFaellig } from './projekt-rechnen.js';
import { istVeroeffentlicht, faelligStatus as mobiFaellig, sortiereBeitraege, beitragInfo } from './mobi-rechnen.js';
import { beschriftungen, kurzDatum } from './mobi-zeitstrahl.js';

// Aufgeklappte Meilensteine im Zeitplan ("<projekt_id>:<meilenstein_id>"), bleibt beim Neuzeichnen erhalten
const auf = {};

function schmal() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 599px)').matches;
}

function frueheste(liste) {
  const l = liste.filter(Boolean).sort();
  return l.length ? l[0] : '';
}

function spaeteste(liste) {
  const l = liste.filter(Boolean).sort();
  return l.length ? l[l.length - 1] : '';
}

// Rechnet alle Zeilen des Zeitplans aus (ohne Anzeige).
// Gibt null zurück, wenn das Projekt kein einziges Datum hat.
// Ergebnis: { von, bis, spanne, start, aktion, deadline, projekt: { von, bis }, meilensteine: [...], ohne: [...],
//             mobi: [...], ohneDatum (Zahl der ToDos ohne Fälligkeit) }
export function zeitplanDaten(p, alleTodos, alleMeilensteine, alleMobi) {
  const pid = String(p.id);
  const gehoert = function (x) { return txt(x.projekt_id) === pid; };
  const todos = (alleTodos || []).filter(gehoert);
  const ms = sortiereMeilensteine((alleMeilensteine || []).filter(gehoert));
  // Wie im Mobi-Zeitstrahl: Beiträge mit Status „Idee“ stehen nicht drin
  const mobi = (alleMobi || []).filter(function (b) {
    return gehoert(b) && !!normDatum(b.datum) && txt(b.status).toLowerCase() !== 'idee';
  });

  const start = normDatum(p.start_datum);
  const aktion = normDatum(p.aktionsdatum);
  const deadline = normDatum(p.deadline);

  const idListe = {};
  ms.forEach(function (m) { idListe[String(m.id)] = true; });

  let vorher = '';
  const meilensteine = ms.map(function (m) {
    const eigene = todos.filter(function (t) { return txt(t.meilenstein_id) === String(m.id); });
    const daten = eigene.map(function (t) { return normDatum(t.faellig_am); });
    const ziel = normDatum(m.datum);
    const erstes = frueheste(daten);
    let von = '';
    let bis = '';
    let quelle = '';
    if (ziel) {
      bis = ziel;
      if (erstes && erstes < ziel) { von = erstes; quelle = 'todo'; }
      else if (vorher && vorher < ziel) { von = vorher; quelle = 'vorher'; }
      else if (start && start < ziel) { von = start; quelle = 'start'; }
      else von = ziel;
      vorher = ziel;
    } else if (erstes) {
      // Ohne eigenes Datum: Balken über die Fälligkeiten der ToDos
      von = erstes;
      bis = spaeteste(daten);
      quelle = 'todo';
    }
    const stand = meilensteinStand(m, todos);
    return {
      m: m,
      von: von,
      bis: bis,
      ziel: ziel,
      quelle: quelle,
      stand: stand,
      ueber: !stand.erreicht && meilensteinFaellig(m) === 'ueberfaellig',
      todos: eigene.filter(function (t) { return !!normDatum(t.faellig_am); })
        .sort(function (a, b) { return normDatum(a.faellig_am) < normDatum(b.faellig_am) ? -1 : 1; })
    };
  });

  const ohne = todos.filter(function (t) {
    return !idListe[txt(t.meilenstein_id)] && !!normDatum(t.faellig_am);
  });
  const ohneDatum = todos.filter(function (t) { return !normDatum(t.faellig_am); }).length;

  const alle = [start, aktion, deadline]
    .concat(ms.map(function (m) { return normDatum(m.datum); }))
    .concat(todos.map(function (t) { return normDatum(t.faellig_am); }))
    .concat(mobi.map(function (b) { return normDatum(b.datum); }))
    .filter(Boolean);
  if (!alle.length) return null;

  const erst = frueheste(alle);
  const letzt = spaeteste(alle);
  // Projektbalken: von Start (sonst frühestes Datum) bis Aktion (sonst Deadline, sonst spätestes Datum)
  let pVon = start || erst;
  let pBis = aktion || deadline || letzt;
  if (pVon > pBis) { const x = pVon; pVon = pBis; pBis = x; }

  const von = addTage(erst, -1);
  const bis = addTage(letzt, 1);
  return {
    von: von,
    bis: bis,
    spanne: Math.max(1, tageZwischen(von, bis)),
    start: start,
    aktion: aktion,
    deadline: deadline,
    projekt: { von: pVon, bis: pBis },
    meilensteine: meilensteine,
    ohne: ohne,
    mobi: mobi,
    ohneDatum: ohneDatum
  };
}

// ---- Anzeige ----

function paare(liste) {
  const dl = el('dl', { class: 'detail-liste' });
  liste.forEach(function (x) {
    if (!x[1]) return;
    dl.append(el('dt', { text: x[0] }), el('dd', { text: String(x[1]) }));
  });
  return dl;
}

// knoepfe: [{ text, klasse, aktion }] (freiwillig). Ein Knopf schließt zuerst das Fenster.
function infoFenster(titel, liste, hinweis, knoepfe) {
  let fenster = null;
  const reihe = (knoepfe || []).filter(function (k) { return typeof k.aktion === 'function'; });
  fenster = zeigeFenster(titel, el('div', null,
    paare(liste),
    hinweis ? el('p', { class: 'leise', text: hinweis }) : null,
    reihe.length ? el('div', { class: 'modal-knoepfe zp-knoepfe' }, ...reihe.map(function (k) {
      return el('button', {
        class: 'knopf ' + (k.klasse || ''), type: 'button', text: k.text,
        onclick: function () { fenster.schliessen(); k.aktion(); }
      });
    })) : null
  ), null, { aussenKlick: true });
}

// Knopf nur, wenn der Teil „ToDos“ die Aktion bereitstellt
function aktion(akt, name) {
  const fn = akt && akt[name];
  return typeof fn === 'function' ? fn : null;
}

function todoStand(t) {
  if (istWahr(t.erledigt)) return 'Erledigt';
  const f = faelligStatus(t);
  return f === 'ueberfaellig' ? 'Offen, überfällig' : f === 'heute' ? 'Offen, heute fällig' : 'Offen';
}

function todoInfo(t, meilensteinTitel, akt) {
  const fertig = istWahr(t.erledigt);
  const abhaken = aktion(akt, 'todoAbhaken');
  const bearbeiten = aktion(akt, 'todoBearbeiten');
  infoFenster(txt(t.text) || 'ToDo', [
    ['Fällig', datumText(t.faellig_am)],
    ['Verantwortlich', txt(t.verantwortlich) || 'Noch niemand'],
    ['Stand', todoStand(t)],
    ['Meilenstein', meilensteinTitel || 'Ohne Meilenstein']
  ], '', [
    { text: fertig ? 'Wieder öffnen' : '✓ Erledigt', aktion: abhaken && function () { abhaken(t, !fertig); } },
    { text: 'Bearbeiten', klasse: 'knopf-hell', aktion: bearbeiten && function () { bearbeiten(t); } }
  ]);
}

const QUELLE_TEXT = {
  todo: 'Der Balken beginnt beim ersten fälligen ToDo dieses Meilensteins.',
  vorher: 'Der Balken beginnt beim Meilenstein davor (seine ToDos haben kein früheres Datum).',
  start: 'Der Balken beginnt beim Start des Projekts (seine ToDos haben kein früheres Datum).'
};

function meilensteinInfo(z, akt) {
  const st = z.stand;
  const bearbeiten = aktion(akt, 'meilensteinBearbeiten');
  // Abhaken von Hand nur ohne ToDos (wie im Teil „ToDos“); mit ToDos ist er erreicht, wenn alle erledigt sind
  const abhaken = st.gesamt ? null : aktion(akt, 'meilensteinAbhaken');
  infoFenster('🏁 ' + (txt(z.m.titel) || 'Meilenstein'), [
    ['Bis', z.ziel ? datumText(z.ziel) + (z.ueber ? ' (überfällig)' : '') : 'Ohne Datum'],
    ['Anfang', z.von && z.von !== z.ziel ? datumText(z.von) : ''],
    ['Verantwortlich', txt(z.m.verantwortlich)],
    ['Stand', st.erreicht ? 'Erreicht' : st.gesamt ? st.erledigt + ' von ' + st.gesamt + ' ToDos erledigt' : 'Noch nicht erreicht']
  ], QUELLE_TEXT[z.quelle] || '', [
    { text: st.erreicht ? 'Wieder öffnen' : '✓ Erreicht', aktion: abhaken && function () { abhaken(z.m, !st.erreicht); } },
    { text: 'Bearbeiten', klasse: 'knopf-hell', aktion: bearbeiten && function () { bearbeiten(z.m); } }
  ]);
}

function projektInfo(p, d) {
  infoFenster(txt(p.titel) || 'Projekt', [
    ['Start', d.start ? datumText(d.start) : 'nicht eingetragen'],
    ['Aktion', datumText(d.aktion)],
    ['Deadline', datumText(d.deadline)],
    ['Balken', datumText(d.projekt.von) + ' bis ' + datumText(d.projekt.bis)]
  ], d.start && d.aktion ? '' : 'Ohne Start oder Aktionsdatum reicht der Balken vom ersten bis zum letzten Datum im Projekt.');
}

// Auswahl, wenn mehrere Einträge auf einem Punkt liegen. liste: [{ titel, info, oeffnen }]
function auswahl(titel, liste) {
  let fenster = null;
  const ul = el('ul', { class: 'dash-todo-liste' }, ...liste.map(function (x) {
    return el('li', { class: 'dash-zeile' },
      el('button', {
        class: 'dash-todo pt-todo', type: 'button',
        onclick: function () { fenster.schliessen(); x.oeffnen(); }
      },
        el('strong', { text: x.titel }),
        el('span', { class: 'leise', text: x.info })
      )
    );
  }));
  fenster = zeigeFenster(titel, ul, null, { aussenKlick: true });
}

// Baut das Diagramm. Gibt null zurück ohne Daten.
function baueDiagramm(p, d, neuZeichnen, akt) {
  const pid = String(p.id);
  const heute = heuteIso();
  const anteil = function (tag) { return tageZwischen(d.von, tag) / d.spanne; };
  const links = function (tag) { return (anteil(tag) * 100) + '%'; };
  const r = { von: d.von, bis: d.bis, anteil: anteil, links: links };

  const tage = [];
  for (let i = 0; i <= d.spanne; i++) tage.push(addTage(d.von, i));
  const montage = tage.filter(function (t) { return wochentagNr(t) === 0; });

  function linie(tag, klasse, text) {
    if (!tag || tag < d.von || tag > d.bis) return null;
    const l = el('span', { class: 'mz-linie ' + klasse, title: text + ' ' + datumText(tag), 'aria-hidden': 'true' });
    l.style.left = links(tag);
    return l;
  }

  function bahn() {
    const b = el('span', { class: 'mz-bahn zp-bahn' });
    // Wochenlinien nur, wenn sie nicht zu dicht stehen (am Handy bei langen Projekten)
    if (montage.length <= (schmal() ? 10 : 30)) {
      montage.forEach(function (t) { const l = linie(t, 'mz-woche', 'Montag'); if (l) b.append(l); });
    }
    return b;
  }

  function linienDazu(b) {
    [linie(heute, 'mz-heute', 'Heute'), linie(d.aktion, 'mz-aktion', 'Aktion'), linie(d.deadline, 'zp-frist', 'Deadline')]
      .forEach(function (l) { if (l) b.append(l); });
  }

  function balken(von, bis, klasse, label, beiKlick) {
    const knopf = el('button', { class: 'zp-balken ' + klasse, type: 'button', title: label, 'aria-label': label, onclick: beiKlick });
    knopf.style.left = links(von);
    knopf.style.width = (Math.max(0, tageZwischen(von, bis)) / d.spanne * 100) + '%';
    return knopf;
  }

  function raute(tag, klasse, label, beiKlick) {
    const knopf = el('button', { class: 'zp-raute ' + klasse, type: 'button', title: label, 'aria-label': label, onclick: beiKlick });
    knopf.style.left = links(tag);
    return knopf;
  }

  // Punkte je Tag: liste: [{ tag, fertig, ueber, titel, info, oeffnen }]. farbKlasse für offene Punkte.
  function punkte(b, liste, farbKlasse, zeilenName) {
    const proTag = {};
    liste.forEach(function (x) {
      if (!proTag[x.tag]) proTag[x.tag] = [];
      proTag[x.tag].push(x);
    });
    Object.keys(proTag).sort().forEach(function (tag) {
      const l = proTag[tag];
      const alleFertig = l.every(function (x) { return x.fertig; });
      const ueber = l.some(function (x) { return x.ueber; });
      const titel = l.map(function (x) { return x.titel; }).join(', ') + ' · ' + datumText(tag);
      const knopf = el('button', {
        class: 'mz-punkt' + (alleFertig ? ' mz-fertig' : ' ' + farbKlasse) + (ueber ? ' mz-ueber' : ''),
        type: 'button',
        title: titel,
        'aria-label': zeilenName + ': ' + titel,
        text: l.length > 1 ? String(l.length) : '',
        onclick: function () {
          if (l.length > 1) auswahl(zeilenName + ' am ' + datumText(tag), l);
          else l[0].oeffnen();
        }
      });
      knopf.style.left = links(tag);
      b.append(knopf);
    });
  }

  function todoPunkt(t, msTitel) {
    return {
      tag: normDatum(t.faellig_am),
      fertig: istWahr(t.erledigt),
      ueber: faelligStatus(t) === 'ueberfaellig',
      titel: kurz(txt(t.text), 60),
      info: [datumText(t.faellig_am), txt(t.verantwortlich), todoStand(t)].filter(Boolean).join(' · '),
      oeffnen: function () { todoInfo(t, msTitel, akt); }
    };
  }

  function zeile(klasse, name, b) {
    return el('div', { class: 'zp-zeile ' + (klasse || '') }, name, b);
  }

  function nameText(text, extra) {
    return el('span', { class: 'zp-name ' + (extra || ''), title: text }, el('span', { text: text }));
  }

  const box = el('div', { class: 'zeitplan' });

  // Achse oben
  const achse = el('span', { class: 'mz-bahn mz-achse zp-achse' });
  if (d.spanne <= 400) {
    tage.forEach(function (t) {
      const s = el('span', { class: 'mz-strich' + (wochentagNr(t) === 0 ? ' mz-strich-mo' : '') });
      s.style.left = links(t);
      achse.append(s);
    });
  }
  const texte = [
    { tag: d.von, text: kurzDatum(d.von) },
    { tag: d.bis, text: kurzDatum(d.bis) },
    { tag: heute, text: 'Heute', klasse: 'mz-heute-text', wichtig: true }
  ].concat(montage.map(function (t) { return { tag: t, text: kurzDatum(t), klasse: 'mz-mo-text' }; }));
  if (d.aktion) texte.push({ tag: d.aktion, text: 'Aktion ' + kurzDatum(d.aktion), klasse: 'mz-aktion-text', wichtig: true });
  if (d.deadline && d.deadline !== d.aktion) {
    texte.push({ tag: d.deadline, text: 'Deadline', klasse: 'zp-frist-text', wichtig: true });
  }
  beschriftungen(r, texte, schmal() ? 0.22 : 0.07).forEach(function (s) { achse.append(s); });
  box.append(zeile('zp-kopf', el('span', { class: 'zp-name' }), achse));

  // Projekt
  const pb = bahn();
  pb.append(balken(d.projekt.von, d.projekt.bis, 'zp-projekt',
    'Projekt ' + txt(p.titel) + ': ' + datumText(d.projekt.von) + ' bis ' + datumText(d.projekt.bis),
    function () { projektInfo(p, d); }));
  linienDazu(pb);
  box.append(zeile('zp-zeile-projekt', nameText('Projekt', 'zp-name-fett'), pb));

  // Meilensteine, darunter (aufgeklappt) ihre ToDos
  d.meilensteine.forEach(function (z) {
    const mid = String(z.m.id);
    const schluessel = pid + ':' + mid;
    const titel = txt(z.m.titel) || 'Meilenstein';
    const st = z.stand;
    const klasse = (st.erreicht ? ' zp-erreicht' : '') + (z.ueber ? ' zp-ueber' : '');
    const b = bahn();
    if (z.von && z.bis && z.von !== z.bis) {
      const knopf = balken(z.von, z.bis, 'zp-ms' + klasse,
        titel + ': ' + datumText(z.von) + ' bis ' + datumText(z.bis) + (st.erreicht ? ', erreicht' : ''),
        function () { meilensteinInfo(z, akt); });
      if (!st.erreicht && st.gesamt) {
        const fuell = el('span', { class: 'zp-fuell', 'aria-hidden': 'true' });
        fuell.style.width = st.prozent + '%';
        knopf.append(fuell);
      }
      b.append(knopf);
    }
    if (z.ziel) {
      b.append(raute(z.ziel, klasse, titel + ': bis ' + datumText(z.ziel) + (st.erreicht ? ', erreicht' : z.ueber ? ', überfällig' : ''),
        function () { meilensteinInfo(z, akt); }));
    }
    linienDazu(b);

    let name;
    if (z.todos.length) {
      const offen = !!auf[schluessel];
      name = el('button', {
        class: 'zp-name zp-name-knopf', type: 'button', title: titel,
        'aria-expanded': offen ? 'true' : 'false',
        'data-zp': schluessel,
        'aria-label': titel + ', ' + z.todos.length + ' ToDos ' + (offen ? 'zuklappen' : 'aufklappen'),
        onclick: function () {
          if (auf[schluessel]) delete auf[schluessel];
          else auf[schluessel] = true;
          neuZeichnen(schluessel);
        }
      },
        el('span', { class: 'teil-pfeil' + (offen ? ' zp-pfeil-auf' : ''), 'aria-hidden': 'true', text: '▸' }),
        el('span', { text: '🏁 ' + titel })
      );
    } else {
      name = nameText('🏁 ' + titel + (z.von || z.ziel ? '' : ' (ohne Datum)'));
    }
    box.append(zeile('zp-zeile-ms', name, b));

    if (z.todos.length && auf[schluessel]) {
      z.todos.forEach(function (t) {
        const tb = bahn();
        punkte(tb, [todoPunkt(t, titel)], 'zp-offen', titel);
        linienDazu(tb);
        box.append(zeile('zp-zeile-todo', nameText(kurz(txt(t.text), 60), 'zp-name-todo'), tb));
      });
    }
  });

  // ToDos ohne Meilenstein: eine Zeile, gleicher Tag = ein Punkt
  if (d.ohne.length) {
    const b = bahn();
    punkte(b, d.ohne.map(function (t) { return todoPunkt(t, ''); }), 'zp-offen', 'Ohne Meilenstein');
    linienDazu(b);
    box.append(zeile('', nameText(d.meilensteine.length ? 'Ohne Meilenstein' : 'ToDos'), b));
  }

  // Mobi: eine Sammelzeile
  if (d.mobi.length) {
    const b = bahn();
    punkte(b, sortiereBeitraege(d.mobi).map(function (x) {
      return {
        tag: normDatum(x.datum),
        fertig: istVeroeffentlicht(x),
        ueber: mobiFaellig(x) === 'ueberfaellig',
        titel: kurz(txt(x.titel), 60),
        info: beitragInfo(x),
        oeffnen: function () {
          infoFenster(txt(x.titel) || 'Beitrag', [['Beitrag', beitragInfo(x)]], 'Ändern kannst du den Beitrag im Teil „Mobi“.');
        }
      };
    }), 'zp-mobi', 'Mobi');
    linienDazu(b);
    box.append(zeile('', nameText('📣 Mobi'), b));
  }

  const hinweise = [];
  if (d.ohneDatum) {
    hinweise.push(d.ohneDatum === 1 ? '1 ToDo hat kein Fälligkeitsdatum und fehlt darum.'
      : d.ohneDatum + ' ToDos haben kein Fälligkeitsdatum und fehlen darum.');
  }
  box.append(el('p', {
    class: 'leise mz-legende',
    text: 'Balken = Zeitraum, Raute = Datum des Meilensteins, Punkt = ToDo am Fälligkeitstag (pink = Mobi-Beitrag). ' +
      'Grau = erledigt, roter Rand = überfällig. Grüne Linie = Aktion, pinke Linie = Deadline, gestrichelt = heute. ' +
      'Meilensteine mit ▸ antippen zeigt ihre ToDos. ' + hinweise.join(' ')
  }));
  return box;
}

export function baueZeitplanTeil(opt) {
  const p = opt.projekt;

  function rechnen() {
    const daten = opt.holeDaten();
    return zeitplanDaten(p, daten.todos, daten.meilensteine, daten.mobi);
  }

  const body = el('div', { class: 'projekt-teil-body' });

  function zeichne(fokus) {
    body.textContent = '';
    const d = rechnen();
    if (!d) {
      body.append(el('p', {
        class: 'leise',
        text: 'Noch keine Daten für den Zeitplan. Trage beim Projekt Start oder Aktionsdatum ein, oder gib Meilensteinen und ToDos ein Datum.'
      }));
      return d;
    }
    body.append(baueDiagramm(p, d, zeichne, opt.aktionen));
    if (fokus) {
      const k = body.querySelector('[data-zp="' + fokus + '"]');
      if (k) k.focus();
    }
    return d;
  }

  const d = zeichne();
  const zahl = d ? d.meilensteine.length : 0;
  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Zeitplan' }),
      el('span', {
        class: 'leise',
        text: !d ? 'noch keine Daten'
          : kurzDatum(d.projekt.von) + ' bis ' + kurzDatum(d.projekt.bis) +
            (zahl ? ' · ' + zahl + (zahl === 1 ? ' Meilenstein' : ' Meilensteine') : '')
      })
    ),
    body
  );
  return teil;
}
