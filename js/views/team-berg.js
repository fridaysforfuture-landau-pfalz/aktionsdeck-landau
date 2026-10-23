// js/views/team-berg.js
// Diagramm „Berg“ im Reiter Team (Etappe 9, Schritt 9.6). SVG, ohne Bibliothek, Texte nur mit textContent.
// Oben: gestapelte Flächen, eine Schicht je aktiver Person (Dicke = Kapazität, Farben nach Namen A–Z),
// die Höhe ist die Summe der Gruppe. Darunter ein eigenes kleines Bild mit eigener Skala: fällige Hüte je Woche
// (keine zwei Maßstäbe in einem Bild). Linien für Aktionen (grün) und Heute (gestrichelt).
// Antippen oder Zeigen auf eine Woche: Zeile darunter mit Woche, Summe, Werten je Person, Hüten, Aktionen.
// Für Bildschirmleser role="img" mit Beschreibung und „Zahlen zeigen“ (Tabelle).
//
// baueBerg(berg, { gewaehlt (Index der Woche), beiWahl(index), handy }) -> Element
// berg: Ergebnis von bergDaten (team-rechnen.js)

import { el } from '../ui/dom.js';
import { datumText } from './todos-rechnen.js';
import { tageZwischen } from './kalender-rechnen.js';
import { kapazitaetText } from './team-rechnen.js';

const NS = 'http://www.w3.org/2000/svg';

function svg(tag, attr, ...kinder) {
  const e = document.createElementNS(NS, tag);
  Object.keys(attr || {}).forEach(function (k) {
    if (k === 'text') e.textContent = attr[k];
    else e.setAttribute(k, attr[k]);
  });
  kinder.forEach(function (k) { if (k) e.append(k); });
  return e;
}

function kurz(iso) {
  return datumText(iso).slice(0, 6);
}

function wochenText(w) {
  return kurz(w.montag) + '–' + kurz(w.sonntag);
}

// Infozeile zu einer Woche
function infoText(berg, w) {
  const teile = ['Woche ' + wochenText(w) + ': Kraft ' + w.summe];
  const namen = berg.personen.map(function (p, i) { return w.werte[i] ? p.name + ' ' + w.werte[i] : ''; }).filter(Boolean);
  teile.push(namen.length ? '(' + namen.join(', ') + ')' : '(keine Angaben)');
  const rest = [w.huete + (w.huete === 1 ? ' Hut fällig' : ' Hüte fällig')];
  if (w.aktionen.length) rest.push('Aktion: ' + w.aktionen.map(function (a) { return a.titel + ' (' + kurz(a.datum) + ')'; }).join(', '));
  if (w.eng) rest.push('⚠ Hier wird es eng');
  return teile.join(' ') + ' · ' + rest.join(' · ');
}

export function baueBerg(berg, opt) {
  const o = opt || {};
  const wochen = berg.wochen;
  const n = wochen.length;
  const B = o.handy ? 340 : 720;           // Breite im Koordinatensystem (das Bild passt sich der Breite an)
  const L = 30, R = 8;                     // Rand links (Skala) und rechts
  const H1 = o.handy ? 150 : 180;          // Höhe Berg
  const LUECKE = 46;                       // Platz für die Datumszeile und die Überschrift des zweiten Bildes
  const H2 = 56;                           // Höhe Hüte-Balken
  const OBEN = 14;
  const y1u = OBEN + H1;                   // Grundlinie Berg
  const y2o = y1u + LUECKE;                // Oberkante Hüte
  const y2u = y2o + H2;                    // Grundlinie Hüte
  const HOEHE = y2u + 6;
  const breit = (B - L - R) / n;
  const start = wochen[0].montag;
  const tage = n * 7;
  const xTag = function (iso) { return L + (tageZwischen(start, iso) + 0.5) / tage * (B - L - R); };
  const xMitte = function (i) { return L + (i + 0.5) * breit; };

  const maxSumme = Math.max(10, ...wochen.map(function (w) { return w.summe; }));
  const yMax = Math.ceil(maxSumme / 10) * 10;   // glatte Skala: 0, Hälfte, Höchstwert
  const y1 = function (v) { return y1u - v / yMax * H1; };
  const maxHuete = Math.max(1, ...wochen.map(function (w) { return w.huete; }));
  const y2 = function (v) { return y2u - v / maxHuete * H2; };

  const bild = svg('svg', {
    viewBox: '0 0 ' + B + ' ' + HOEHE, class: 'team-berg-svg', role: 'img',
    'aria-label': 'Berg: Kraft der Gruppe je Woche von ' + wochenText(wochen[0]) + ' bis ' + wochenText(wochen[n - 1]) +
      ', höchstens ' + Math.max(...wochen.map(function (w) { return w.summe; })) + '. Die Zahlen stehen unter „Zahlen zeigen“.'
  });

  // Gitter und Skala (zurückhaltend)
  [0, yMax / 2, yMax].forEach(function (v) {
    bild.append(svg('line', { x1: L, x2: B - R, y1: y1(v), y2: y1(v), class: 'berg-gitter' }));
    bild.append(svg('text', { x: L - 4, y: y1(v) + 4, class: 'berg-skala', 'text-anchor': 'end', text: String(v) }));
  });

  // Markierte Woche (Hintergrund über beide Bilder)
  const markierung = svg('rect', { y: OBEN, width: breit, height: y2u - OBEN, class: 'berg-wahl' });
  bild.append(markierung);

  // Gestapelte Flächen: je Person ein Band zwischen der Summe davor und der Summe danach.
  // Punkte an den Wochenmitten, an den Rändern bis zum Bildrand verlängert. Weiße Kante = Abstand zwischen Schichten.
  const unten = wochen.map(function () { return 0; });
  berg.personen.forEach(function (p, i) {
    if (!p.hatWert) return;
    const oben = wochen.map(function (w, k) { return unten[k] + w.werte[i]; });
    const xs = wochen.map(function (w, k) { return xMitte(k); });
    xs[0] = L; xs[n - 1] = B - R;
    const pfad = xs.map(function (x, k) { return x + ',' + y1(oben[k]); })
      .concat(xs.slice().reverse().map(function (x, k) { return x + ',' + y1(unten[n - 1 - k]); }));
    bild.append(svg('polygon', { points: pfad.join(' '), fill: p.farbe, class: 'berg-schicht' },
      svg('title', { text: p.name })));
    oben.forEach(function (v, k) { unten[k] = v; });
  });
  bild.append(svg('line', { x1: L, x2: B - R, y1: y1u, y2: y1u, class: 'berg-achse' }));

  // Datum je Montag (am Handy jede zweite Woche)
  wochen.forEach(function (w, i) {
    if (o.handy && i % 2) return;
    bild.append(svg('text', { x: xMitte(i), y: y1u + 14, class: 'berg-skala', 'text-anchor': 'middle', text: kurz(w.montag) }));
  });

  // Zweites Bild: fällige Hüte je Woche
  bild.append(svg('text', { x: L, y: y2o - 6, class: 'berg-titel', text: 'Fällige Hüte je Woche' }));
  wochen.forEach(function (w, i) {
    if (!w.huete) return;
    const x = xMitte(i) - breit * 0.3;
    bild.append(svg('rect', {
      x: x, y: y2(w.huete), width: breit * 0.6, height: y2u - y2(w.huete), rx: 2,
      class: 'berg-hut' + (w.eng ? ' berg-eng' : '')
    }));
    bild.append(svg('text', { x: xMitte(i), y: y2(w.huete) - 3, class: 'berg-skala', 'text-anchor': 'middle', text: String(w.huete) }));
  });
  bild.append(svg('line', { x1: L, x2: B - R, y1: y2u, y2: y2u, class: 'berg-achse' }));

  // Aktionen (grün) und Heute (gestrichelt) über beide Bilder
  // (je Bild ein Stück, damit die Überschrift des unteren Bildes frei bleibt)
  function senkrecht(x, klasse, titel) {
    [[OBEN, y1u], [y2o, y2u]].forEach(function (yy) {
      bild.append(svg('line', { x1: x, x2: x, y1: yy[0], y2: yy[1], class: klasse }, titel ? svg('title', { text: titel }) : null));
    });
  }
  wochen.forEach(function (w) {
    w.aktionen.forEach(function (a) { senkrecht(xTag(a.datum), 'berg-aktion', 'Aktion: ' + a.titel); });
  });
  const heuteW = wochen.findIndex(function (w) { return w.aktuell; });
  if (heuteW >= 0) senkrecht(xTag(o.heute || wochen[heuteW].montag), 'berg-heute', 'Heute');

  // Trefferflächen je Woche (größer als die Marken): Zeigen am PC, Antippen am Handy
  const info = el('p', { class: 'team-berg-info', 'aria-live': 'polite' });
  function waehle(i, merken) {
    markierung.setAttribute('x', String(L + i * breit));
    info.textContent = infoText(berg, wochen[i]);
    if (merken && o.beiWahl) o.beiWahl(i);
  }
  let gemerkt = o.gewaehlt !== undefined && o.gewaehlt >= 0 && o.gewaehlt < n ? o.gewaehlt : Math.max(0, heuteW);
  wochen.forEach(function (w, i) {
    const flaeche = svg('rect', { x: L + i * breit, y: OBEN, width: breit, height: y2u - OBEN, class: 'berg-treffer' });
    flaeche.addEventListener('mouseenter', function () { waehle(i, false); });
    flaeche.addEventListener('mouseleave', function () { waehle(gemerkt, false); });
    flaeche.addEventListener('click', function () { gemerkt = i; waehle(i, true); });
    bild.append(flaeche);
  });
  waehle(gemerkt, false);

  // Legende (Namen mit Farbe) und Linien
  const legende = el('div', { class: 'team-berg-legende' },
    ...berg.personen.filter(function (p) { return p.hatWert; }).map(function (p) {
      const punkt = el('span', { class: 'berg-punkt', 'aria-hidden': 'true' });
      punkt.style.background = p.farbe;
      return el('span', { class: 'berg-eintrag' }, punkt, el('span', { text: p.name }));
    }),
    el('span', { class: 'berg-eintrag' }, el('span', { class: 'berg-strich-aktion', 'aria-hidden': 'true' }), el('span', { text: 'Aktion' })),
    el('span', { class: 'berg-eintrag' }, el('span', { class: 'berg-strich-heute', 'aria-hidden': 'true' }), el('span', { text: 'Heute' })),
    el('span', { class: 'berg-eintrag' }, el('span', { class: 'berg-punkt berg-punkt-eng', 'aria-hidden': 'true' }), el('span', { text: '⚠ eng: viele Hüte für wenig Kraft' }))
  );

  // Tabelle „Zahlen zeigen“
  const tabelle = el('table', { class: 'tabelle team-berg-tabelle' },
    el('thead', null, el('tr', null,
      el('th', { text: 'Woche' }), el('th', { text: 'Kraft' }), el('th', { text: 'Personen' }),
      el('th', { text: 'Hüte' }), el('th', { text: 'Aktionen' }))),
    el('tbody', null, ...wochen.map(function (w) {
      return el('tr', { class: w.aktuell ? 'berg-zeile-heute' : '' },
        el('td', { text: wochenText(w) + (w.aktuell ? ' (jetzt)' : '') }),
        el('td', { text: String(w.summe) + (w.summe ? ' · ' + kapazitaetText(Math.round(w.summe / Math.max(1, w.personen))) + ' je Person' : '') }),
        el('td', { text: berg.personen.map(function (p, i) { return w.werte[i] ? p.name + ' ' + w.werte[i] : ''; }).filter(Boolean).join(', ') || '–' }),
        el('td', { text: String(w.huete) + (w.eng ? ' ⚠ eng' : '') }),
        el('td', { text: w.aktionen.map(function (a) { return a.titel; }).join(', ') || '–' })
      );
    }))
  );

  return el('div', { class: 'team-berg' },
    el('div', { class: 'team-berg-bild' }, bild),
    info,
    legende,
    el('details', { class: 'team-berg-zahlen' }, el('summary', { text: 'Zahlen zeigen' }),
      el('div', { class: 'team-berg-tabelle-wrap' }, tabelle))
  );
}
