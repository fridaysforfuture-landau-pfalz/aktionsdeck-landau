// js/wiki-format.js
// Textformat für Wiki-Seiten und die festen Texte (texte/*.txt), seit 0.32.1 (Schritt 10.2).
// Ohne Bibliothek: Der Text wird Zeile für Zeile in Elemente umgebaut, nur mit el() und textContent.
//
// Regeln (Plan Etappe 10, Abschnitt 6):
//   Leerzeile = neuer Absatz          ## Überschrift        ### Unterüberschrift
//   - Punkt = Liste                   1. Schritt = nummerierte Liste
//   **fett**                          https://… wird ein Link    [Text](https://…) = Link mit eigenem Text
//   [[Titel]] = Link auf eine andere Wiki-Seite (fehlt sie: grau mit „(fehlt)“)
//   > Hinweis = grauer Hinweiskasten
//   ![Beschreibung](bild:<id>) in einer eigenen Zeile = Bild aus dem Drive-Ordner der Gruppe
// Nur http(s)-Adressen werden Links (sichereUrl). Alles andere bleibt Text, auch "<script>" oder "javascript:".
//
// zeichneText(text, opt) -> <div class="wiki-text">
//   opt.seiteFinden(titel) -> Adresse ('#/…') oder '' (fehlt). Ohne seiteFinden bleibt [[Titel]] einfacher Text.
//   opt.bildUrl(id) -> Adresse des Bildes (Standard: Vorschaubild von Google Drive).
//   opt.inhaltsverzeichnis: true = ab 3 Überschriften oben ein Inhaltsverzeichnis.
// ueberschriften(text) -> [{ ebene: 2|3, text }]
//
// Beispiele (mit node geprüft):
//   bloecke('## Hallo\n- a\n- b')      -> [{ art:'h2', zeilen:['Hallo'] }, { art:'ul', zeilen:['a','b'] }]
//   bloecke('a\nb\n\nc')               -> [{ art:'p', zeilen:['a','b'] }, { art:'p', zeilen:['c'] }]
//   teileInline('**x** https://a.de.') -> [{ art:'fett', text:'x' }, ' ', { art:'link', url:'https://a.de', text:'https://a.de' }, '.']
//   teileInline('[k](javascript:x)')   -> ['[k](javascript:x)']

import { el } from './ui/dom.js';
import { sichereUrl } from './views/kalender-rechnen.js';

const BILD_ID = /^[A-Za-z0-9_-]{10,100}$/;

function txt(v) {
  return String(v === undefined || v === null ? '' : v);
}

export function bildUrlStandard(id) {
  return BILD_ID.test(id) ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1000' : '';
}

// Text -> Liste von Blöcken { art: 'h2'|'h3'|'p'|'ul'|'ol'|'hinweis'|'bild', zeilen: [...], bild?: { id, beschreibung } }
export function bloecke(text) {
  const liste = [];
  let offen = null;   // Block, an den die nächste passende Zeile angehängt wird
  txt(text).replace(/\r\n?/g, '\n').split('\n').forEach(function (roh) {
    const zeile = roh.replace(/\s+$/, '');
    const t = zeile.replace(/^\s+/, '');
    let m;
    if (!t) { offen = null; return; }
    if ((m = /^!\[([^\]]*)\]\(bild:([^)\s]+)\)$/.exec(t)) && BILD_ID.test(m[2])) {
      liste.push({ art: 'bild', zeilen: [], bild: { id: m[2], beschreibung: m[1].trim() } });
      offen = null;
      return;
    }
    if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) {
      liste.push({ art: m[1].length === 3 ? 'h3' : 'h2', zeilen: [m[2]] });
      offen = null;
      return;
    }
    let art = 'p';
    let inhalt = zeile;
    if ((m = /^[-*•]\s+(.*)$/.exec(t))) { art = 'ul'; inhalt = m[1]; }
    else if ((m = /^\d{1,3}[.)]\s+(.*)$/.exec(t))) { art = 'ol'; inhalt = m[1]; }
    else if ((m = /^>\s?(.*)$/.exec(t))) { art = 'hinweis'; inhalt = m[1]; }
    else inhalt = t;
    if (offen && offen.art === art) {
      offen.zeilen.push(inhalt);
    } else {
      offen = { art: art, zeilen: [inhalt] };
      liste.push(offen);
    }
  });
  return liste;
}

export function ueberschriften(text) {
  return bloecke(text).filter(function (b) { return b.art === 'h2' || b.art === 'h3'; })
    .map(function (b) { return { ebene: b.art === 'h3' ? 3 : 2, text: ohneSterne(b.zeilen[0]) }; });
}

function ohneSterne(s) {
  return txt(s).replace(/\*\*(.+?)\*\*/g, '$1');
}

// Eine Zeile -> Liste aus Text und Teilen { art: 'fett'|'link'|'wiki', ... }
const INLINE = /\*\*(.+?)\*\*|\[\[([^\]\n]{1,80})\]\]|\[([^\]\n]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>"]+)/gi;

export function teileInline(zeile, ohneFett) {
  const s = txt(zeile);
  const teile = [];
  let pos = 0;
  let m;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(s)) !== null) {
    let ganz = m[0];
    let teil = null;
    let rest = '';
    if (m[1] !== undefined) {
      teil = ohneFett ? null : { art: 'fett', text: m[1] };
    } else if (m[2] !== undefined) {
      teil = { art: 'wiki', titel: m[2].trim() };
    } else if (m[3] !== undefined) {
      const url = sichereUrl(m[4]);
      teil = url ? { art: 'link', url: url, text: m[3] } : null;
    } else {
      // nackte Adresse: Satzzeichen am Ende gehören nicht dazu
      const ende = /[.,;:!?)\]]+$/.exec(ganz);
      if (ende) { rest = ende[0]; ganz = ganz.slice(0, -rest.length); }
      const url = sichereUrl(ganz);
      teil = url ? { art: 'link', url: url, text: ganz } : null;
    }
    if (!teil) continue;   // bleibt Text
    if (m.index > pos) teile.push(s.slice(pos, m.index));
    teile.push(teil);
    if (rest) teile.push(rest);
    pos = m.index + m[0].length;
  }
  if (pos < s.length) teile.push(s.slice(pos));
  return teile;
}

function knotenInline(zeile, opt, ohneFett) {
  return teileInline(zeile, ohneFett).map(function (t) {
    if (typeof t === 'string') return document.createTextNode(t);
    if (t.art === 'fett') return el('strong', null, ...knotenInline(t.text, opt, true));
    if (t.art === 'link') {
      return el('a', { href: t.url, target: '_blank', rel: 'noopener noreferrer', text: t.text });
    }
    // Wiki-Link
    if (!opt.seiteFinden) return document.createTextNode(t.titel);
    const ziel = opt.seiteFinden(t.titel);
    if (ziel && /^#\//.test(ziel)) return el('a', { href: ziel, class: 'wiki-link', text: t.titel });
    return el('span', { class: 'wiki-fehlt', text: t.titel + ' (fehlt)' });
  });
}

// Zeilen eines Absatzes mit Zeilenumbruch dazwischen
function mitUmbruch(zeilen, opt) {
  const kinder = [];
  zeilen.forEach(function (z, i) {
    if (i > 0) kinder.push(el('br'));
    knotenInline(z, opt).forEach(function (k) { kinder.push(k); });
  });
  return kinder;
}

export function zeichneText(text, opt) {
  const o = opt || {};
  const bildUrl = o.bildUrl || bildUrlStandard;
  const box = el('div', { class: 'wiki-text' });
  const marken = [];   // Überschriften für das Inhaltsverzeichnis

  bloecke(text).forEach(function (b) {
    if (b.art === 'h2' || b.art === 'h3') {
      const h = el(b.art, null, ...knotenInline(b.zeilen[0], o));
      marken.push({ ebene: b.art === 'h3' ? 3 : 2, text: ohneSterne(b.zeilen[0]), el: h });
      box.append(h);
    } else if (b.art === 'ul' || b.art === 'ol') {
      box.append(el(b.art, null, ...b.zeilen.map(function (z) { return el('li', null, ...knotenInline(z, o)); })));
    } else if (b.art === 'hinweis') {
      box.append(el('div', { class: 'wiki-hinweis' }, ...mitUmbruch(b.zeilen, o)));
    } else if (b.art === 'bild') {
      const url = bildUrl(b.bild.id);
      if (!url) return;
      const bild = el('img', { src: url, alt: b.bild.beschreibung || 'Bild', loading: 'lazy' });
      box.append(el('figure', { class: 'wiki-bild' }, bild,
        b.bild.beschreibung ? el('figcaption', { text: b.bild.beschreibung }) : null));
    } else {
      box.append(el('p', null, ...mitUmbruch(b.zeilen, o)));
    }
  });

  // Inhaltsverzeichnis: Knöpfe statt Sprungmarken (das # in der Adresse gehört dem Routing)
  if (o.inhaltsverzeichnis && marken.length >= 3) {
    const liste = el('ul');
    marken.forEach(function (mk) {
      liste.append(el('li', { class: mk.ebene === 3 ? 'wiki-iv-unter' : '' },
        el('button', {
          type: 'button', class: 'wiki-iv-knopf', text: mk.text,
          onclick: function () { mk.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        })
      ));
    });
    box.prepend(el('nav', { class: 'wiki-iv', 'aria-label': 'Inhalt' }, el('p', { class: 'wiki-iv-titel', text: 'Inhalt' }), liste));
  }
  return box;
}
