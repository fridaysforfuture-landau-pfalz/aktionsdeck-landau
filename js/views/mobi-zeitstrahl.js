// js/views/mobi-zeitstrahl.js
// Zeitstrahl für Mobi.
// - baueZeitstrahl: der ganze Zeitstrahl (Reiter Mobi, Ansicht „Zeitstrahl“): eine Bahn je Kanal,
//   Beiträge als Punkte an ihrem Datum, Achse mit Tagesstrichen und Datum je Montag, Linien für Heute
//   und das Bezugsdatum (Aktion oder Veranstaltung). Grau = veröffentlicht, roter Rand = überfällig.
//   Mehrere Beiträge am selben Tag auf derselben Bahn stehen als ein Punkt mit Zahl (Klick = Auswahl).
// - baueZeitbalken: ein einzelner Balken für den Teil „Mobi“ im Projekt: Abschnitte mit Beiträgen
//   in Kanalfarbe (grau, wenn veröffentlicht), Linien für Aktion und Heute.

import { el } from '../ui/dom.js';
import { zeigeFenster } from '../ui/fenster.js';
import { kanalInfo, KANAELE } from '../kanaele.js';
import { istVeroeffentlicht, faelligStatus, sortiereBeitraege, beitragInfo } from './mobi-rechnen.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import { addTage, tageZwischen, wochentagNr } from './kalender-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// Schmaler Bildschirm (Handy): Beschriftungen brauchen mehr Abstand
function schmal() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 599px)').matches;
}

// "20.10."
function kurzDatum(d) {
  return datumText(d).slice(0, 6);
}

// Zeitraum aus den Beiträgen und dem Bezugsdatum, je einen Tag Rand. null ohne Beiträge mit Datum.
function zeitraum(beitraege, bezug) {
  const daten = beitraege.map(function (b) { return normDatum(b.datum); }).filter(Boolean).sort();
  if (!daten.length) return null;
  let von = daten[0];
  let bis = daten[daten.length - 1];
  if (bezug && bezug > bis) bis = bezug;
  if (bezug && bezug < von) von = bezug;
  von = addTage(von, -1);
  bis = addTage(bis, 1);
  const spanne = Math.max(1, tageZwischen(von, bis));
  return {
    von: von,
    bis: bis,
    spanne: spanne,
    anteil: function (d) { return tageZwischen(von, d) / spanne; },
    links: function (d) { return (tageZwischen(von, d) / spanne * 100) + '%'; }
  };
}

// Beschriftungen ohne Überlappung: zuerst die wichtigen (Bezug, Heute), dann der Rest.
// liste: [{ tag, text, klasse, wichtig }]. abstand: kleinster Abstand als Anteil der Breite.
function beschriftungen(r, liste, abstand) {
  const gewaehlt = [];
  liste.slice().sort(function (a, b) { return (b.wichtig ? 1 : 0) - (a.wichtig ? 1 : 0); })
    .forEach(function (x) {
      if (x.tag < r.von || x.tag > r.bis) return;
      const a = r.anteil(x.tag);
      const zuNah = gewaehlt.some(function (g) { return Math.abs(r.anteil(g.tag) - a) < abstand; });
      if (!zuNah) gewaehlt.push(x);
    });
  return gewaehlt.map(function (x) {
    const s = el('span', { class: 'mz-datum ' + (x.klasse || ''), text: x.text });
    s.style.left = r.links(x.tag);
    return s;
  });
}

// ---- Ganzer Zeitstrahl ----

// beitraege: Beiträge eines Projekts oder einer Veranstaltung. bezugsdatum: Aktion oder Veranstaltungsdatum.
// bezugName: 'Aktion' oder 'Veranstaltung'. oeffnen(b): Beitrag öffnen. Gibt null ohne Beiträge mit Datum.
export function baueZeitstrahl(beitraege, bezugsdatum, oeffnen, bezugName) {
  // Beiträge mit Status „Idee“ stehen nicht im Zeitstrahl (Wunsch aus der Prüfung von 0.29.12)
  const mitDatum = beitraege.filter(function (b) {
    return !!normDatum(b.datum) && txt(b.status).toLowerCase() !== 'idee';
  });
  const bezug = normDatum(bezugsdatum);
  const name = bezugName || 'Aktion';
  const r = zeitraum(mitDatum, bezug);
  if (!r) return null;
  const heute = heuteIso();

  // Tage im Zeitraum (für Striche und Montags-Linien)
  const tage = [];
  for (let i = 0; i <= r.spanne; i++) tage.push(addTage(r.von, i));
  const montage = tage.filter(function (d) { return wochentagNr(d) === 0; });

  // Bahnen in der Reihenfolge der Kanalliste, unbekannte Kanäle danach
  const reihenfolge = KANAELE.map(function (k) { return k.name; });
  const bahnen = {};
  mitDatum.forEach(function (b) {
    const n = kanalInfo(b.kanal).name || 'Ohne Kanal';
    if (!bahnen[n]) bahnen[n] = [];
    bahnen[n].push(b);
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
    if (!d || d < r.von || d > r.bis) return null;
    const l = el('span', { class: 'mz-linie ' + klasse, title: text + ' ' + datumText(d) });
    l.style.left = r.links(d);
    return l;
  }

  const box = el('div', { class: 'mobi-zeitstrahl' });

  // Achse: Tagesstriche, Datum je Montag, Anfang, Ende, Heute und Bezugsdatum
  const achse = el('span', { class: 'mz-bahn mz-achse' });
  tage.forEach(function (d) {
    const s = el('span', { class: 'mz-strich' + (wochentagNr(d) === 0 ? ' mz-strich-mo' : '') });
    s.style.left = r.links(d);
    achse.append(s);
  });
  const texte = [
    { tag: r.von, text: kurzDatum(r.von) },
    { tag: r.bis, text: kurzDatum(r.bis) },
    { tag: heute, text: 'Heute', klasse: 'mz-heute-text', wichtig: true }
  ].concat(montage.map(function (d) { return { tag: d, text: kurzDatum(d), klasse: 'mz-mo-text' }; }));
  if (bezug) texte.push({ tag: bezug, text: name + ' ' + kurzDatum(bezug), klasse: 'mz-aktion-text', wichtig: true });
  // Am PC ist Platz für viele Daten (Montage sind am Handy per CSS ausgeblendet)
  beschriftungen(r, texte, schmal() ? 0.22 : 0.07).forEach(function (s) { achse.append(s); });
  box.append(el('div', { class: 'mz-zeile mz-kopf' }, el('span', { class: 'mz-name' }), achse));

  namen.forEach(function (n) {
    const farbe = kanalInfo(n).farbe;
    const bahn = el('span', { class: 'mz-bahn' });
    montage.forEach(function (d) { const l = linie(d, 'mz-woche', 'Montag'); if (l) bahn.append(l); });
    [linie(heute, 'mz-heute', 'Heute'), linie(bezug, 'mz-aktion', name)].forEach(function (l) { if (l) bahn.append(l); });
    // Gleicher Tag = ein Punkt
    const proTag = {};
    bahnen[n].forEach(function (b) {
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
        'aria-label': n + ': ' + titel,
        text: liste.length > 1 ? String(liste.length) : '',
        onclick: function () { if (liste.length > 1) auswahl(liste); else oeffnen(liste[0]); }
      });
      p.style.left = r.links(d);
      if (!alleFertig) p.style.background = farbe;
      bahn.append(p);
    });
    const punkt = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
    punkt.style.background = farbe;
    box.append(el('div', { class: 'mz-zeile' },
      el('span', { class: 'mz-name', title: n }, punkt, el('span', { text: n })),
      bahn
    ));
  });

  box.append(el('p', { class: 'leise mz-legende', text: 'Punkt = Beitrag (grau = veröffentlicht, roter Rand = überfällig). ' +
    'Grüne Linie = ' + name + ', gestrichelt = heute, dünne Linien = Wochenanfang (Montag). ' +
    'Beiträge mit Status „Idee“ stehen nicht im Zeitstrahl.' }));
  return box;
}

// ---- Einzelner Balken (Projekt) ----

// Gibt null ohne Beiträge mit Datum.
export function baueZeitbalken(beitraege, aktionsdatum) {
  // Wie im Zeitstrahl: Beiträge mit Status „Idee“ stehen nicht im Balken (Entscheidung 22.10.2026)
  const mitDatum = beitraege.filter(function (b) {
    return !!normDatum(b.datum) && txt(b.status).toLowerCase() !== 'idee';
  });
  const aktion = normDatum(aktionsdatum);
  const r = zeitraum(mitDatum, aktion);
  if (!r) return null;
  const heute = heuteIso();
  const tagBreite = 100 / r.spanne;

  const balken = el('div', { class: 'mzb-balken' });
  // Abschnitte: ein Tag breit, in Kanalfarbe oder grau (veröffentlicht); später gezeichnete liegen oben
  sortiereBeitraege(mitDatum).reverse().forEach(function (b) {
    const d = normDatum(b.datum);
    const fertig = istVeroeffentlicht(b);
    const s = el('span', {
      class: 'mzb-abschnitt' + (fertig ? ' mzb-fertig' : ''),
      title: txt(b.titel) + ' · ' + (kanalInfo(b.kanal).name || '') + ' · ' + datumText(d) + (fertig ? ' · veröffentlicht' : '')
    });
    s.style.left = 'calc(' + r.links(d) + ' - ' + (tagBreite / 2) + '%)';
    s.style.width = tagBreite + '%';
    if (!fertig) s.style.background = kanalInfo(b.kanal).farbe;
    balken.append(s);
  });
  [[aktion, 'mzb-aktion', 'Aktion'], [heute, 'mzb-heute', 'Heute']].forEach(function (x) {
    if (!x[0] || x[0] < r.von || x[0] > r.bis) return;
    const l = el('span', { class: 'mzb-linie ' + x[1], title: x[2] + ' ' + datumText(x[0]) });
    l.style.left = r.links(x[0]);
    balken.append(l);
  });

  const achse = el('div', { class: 'mzb-achse' }, ...beschriftungen(r, [
    { tag: r.von, text: kurzDatum(r.von) },
    { tag: r.bis, text: kurzDatum(r.bis) },
    { tag: heute, text: 'Heute', klasse: 'mz-heute-text', wichtig: true },
    aktion ? { tag: aktion, text: 'Aktion ' + kurzDatum(aktion), klasse: 'mz-aktion-text', wichtig: true } : { tag: '' }
  ].filter(function (x) { return !!x.tag; }), schmal() ? 0.3 : 0.18));

  return el('div', { class: 'mobi-zeitbalken' }, balken, achse);
}
