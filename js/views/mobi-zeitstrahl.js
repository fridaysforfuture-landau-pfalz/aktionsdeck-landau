// js/views/mobi-zeitstrahl.js
// Zeitstrahl eines Projekts im Teil „Mobi“: eine Bahn je Kanal, die Beiträge als Punkte an ihrem Datum.
// Senkrechte Linien für „Heute“ und das Aktionsdatum. Veröffentlichte Punkte sind grau, überfällige haben
// einen roten Rand. Mehrere Beiträge am selben Tag auf derselben Bahn stehen als ein Punkt mit Zahl.
// Ein Klick auf einen Punkt öffnet den Beitrag (bei mehreren erst eine kleine Auswahl).
//
// baueZeitstrahl(beitraege, aktionsdatum, oeffnen(b)) -> Element oder null (ohne Beiträge mit Datum)

import { el } from '../ui/dom.js';
import { zeigeFenster } from '../ui/fenster.js';
import { kanalInfo, KANAELE } from '../kanaele.js';
import { istVeroeffentlicht, faelligStatus, sortiereBeitraege, beitragInfo } from './mobi-rechnen.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import { addTage, tageZwischen } from './kalender-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

export function baueZeitstrahl(beitraege, aktionsdatum, oeffnen) {
  const mitDatum = beitraege.filter(function (b) { return !!normDatum(b.datum); });
  if (!mitDatum.length) return null;

  const aktion = normDatum(aktionsdatum);
  const heute = heuteIso();
  const daten = mitDatum.map(function (b) { return normDatum(b.datum); }).sort();
  // Zeitraum: erster Beitrag bis zum Aktionsdatum (oder letzten Beitrag), je einen Tag Rand
  let von = daten[0];
  let bis = daten[daten.length - 1];
  if (aktion && aktion > bis) bis = aktion;
  if (aktion && aktion < von) von = aktion;
  von = addTage(von, -1);
  bis = addTage(bis, 1);
  const spanne = Math.max(1, tageZwischen(von, bis));
  function links(d) {
    return (tageZwischen(von, d) / spanne * 100) + '%';
  }

  // Bahnen in der Reihenfolge der Kanalliste, unbekannte Kanäle danach
  const reihenfolge = KANAELE.map(function (k) { return k.name; });
  const bahnen = {};
  mitDatum.forEach(function (b) {
    const name = kanalInfo(b.kanal).name || 'Ohne Kanal';
    if (!bahnen[name]) bahnen[name] = [];
    bahnen[name].push(b);
  });
  const namen = Object.keys(bahnen).sort(function (a, b) {
    const ia = reihenfolge.indexOf(a);
    const ib = reihenfolge.indexOf(b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

  function auswahl(liste) {
    let fenster = null;
    const ul = el('ul', { class: 'dash-todo-liste' }, ...sortiereBeitraege(liste).map(function (b) {
      return el('li', { class: 'dash-zeile' },
        el('button', {
          class: 'dash-todo pt-todo', type: 'button',
          onclick: function () { fenster.schliessen(); oeffnen(b); }
        },
          el('strong', { text: txt(b.titel) }),
          el('span', { class: 'leise', text: beitragInfo(b) })
        )
      );
    }));
    fenster = zeigeFenster('Beiträge am ' + datumText(liste[0].datum), ul, null, { aussenKlick: true });
  }

  function linie(d, klasse, text) {
    if (!d || d < von || d > bis) return null;
    const l = el('span', { class: 'mz-linie ' + klasse, title: text + ' ' + datumText(d) });
    l.style.left = links(d);
    return l;
  }

  const box = el('div', { class: 'mobi-zeitstrahl' });
  // Kopf: Datum links, Aktion, Datum rechts. Liegt die Aktion nah am Rand (unter 25 %),
  // fällt das Randdatum dort weg, damit sich die Texte nicht überlappen.
  const anteil = aktion ? tageZwischen(von, aktion) / spanne : 0.5;
  const kopf = el('div', { class: 'mz-zeile mz-kopf' },
    el('span', { class: 'mz-name' }),
    el('span', { class: 'mz-bahn mz-achse' },
      anteil >= 0.25 ? el('span', { class: 'mz-datum mz-start', text: datumText(von).slice(0, 6) }) : null,
      aktion ? (function () {
        const a = el('span', { class: 'mz-datum mz-aktion-text', text: 'Aktion ' + datumText(aktion).slice(0, 6) });
        a.style.left = links(aktion);
        return a;
      })() : null,
      anteil <= 0.75 ? el('span', { class: 'mz-datum mz-ende', text: datumText(bis).slice(0, 6) }) : null
    )
  );
  box.append(kopf);

  namen.forEach(function (name) {
    const farbe = kanalInfo(name).farbe;
    const bahn = el('span', { class: 'mz-bahn' },
      linie(heute, 'mz-heute', 'Heute'),
      linie(aktion, 'mz-aktion', 'Aktion')
    );
    // Gleicher Tag = ein Punkt
    const proTag = {};
    bahnen[name].forEach(function (b) {
      const d = normDatum(b.datum);
      if (!proTag[d]) proTag[d] = [];
      proTag[d].push(b);
    });
    Object.keys(proTag).sort().forEach(function (d) {
      const liste = proTag[d];
      const alleFertig = liste.every(istVeroeffentlicht);
      const ueber = liste.some(function (b) { return faelligStatus(b) === 'ueberfaellig'; });
      const titel = liste.map(function (b) { return txt(b.titel); }).join(', ') + ' · ' + datumText(d);
      const p = el('button', {
        class: 'mz-punkt' + (alleFertig ? ' mz-fertig' : '') + (ueber ? ' mz-ueber' : ''),
        type: 'button',
        title: titel,
        'aria-label': name + ': ' + titel,
        text: liste.length > 1 ? String(liste.length) : '',
        onclick: function () { if (liste.length > 1) auswahl(liste); else oeffnen(liste[0]); }
      });
      p.style.left = links(d);
      if (!alleFertig) p.style.background = farbe;
      bahn.append(p);
    });
    const punkt = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
    punkt.style.background = farbe;
    box.append(el('div', { class: 'mz-zeile' },
      el('span', { class: 'mz-name', title: name }, punkt, el('span', { text: name })),
      bahn
    ));
  });

  box.append(el('p', { class: 'leise mz-legende', text: 'Punkt = Beitrag (grau = veröffentlicht, roter Rand = überfällig). ' +
    'Grüne Linie = Aktion, gestrichelt = heute.' }));
  return box;
}
