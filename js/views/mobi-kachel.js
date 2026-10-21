// js/views/mobi-kachel.js
// Kacheln für den Reiter Mobi (Ansicht "Liste"): eine Kachel je Beitrag, in Spalten nach Kanalgruppe.
// PC (ab 960 px): vier Spalten Social Media, Digital, Print, Sonstiges. Handy: untereinander.
//
// opt: { bezugText(b) -> Text, oeffnen(b), kommentare ({ beitragId: Anzahl }, freiwillig),
//        auswahl: { gewaehlt(b), umschalten(b, wert) } oder null  (Kästchen "auswählen"),
//        haken: { umschalten(b, wert) } oder null                 (Kästchen "veröffentlicht") }

import { el } from '../ui/dom.js';
import { kanalInfo, FORMAT_TEXT } from '../kanaele.js';
import { istVeroeffentlicht, faelligStatus, sortiereBeitraege, datumZeile, statusText } from './mobi-rechnen.js';
import { kommentarMarke } from './todos-rechnen.js';

// Spalten am PC. Extern und Sonstiges (und unbekannte Kanäle) stehen zusammen in "Sonstiges".
export const KACHEL_SPALTEN = [
  { id: 'social', name: 'Social Media' },
  { id: 'digital', name: 'Digital' },
  { id: 'print', name: 'Print' },
  { id: 'sonstiges', name: 'Sonstiges' }
];

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

export function spalteVon(b) {
  const g = kanalInfo(b.kanal).gruppe;
  return g === 'social' || g === 'digital' || g === 'print' ? g : 'sonstiges';
}

export function baueKachel(b, opt) {
  const k = kanalInfo(b.kanal);
  const fertig = istVeroeffentlicht(b);
  const st = faelligStatus(b);
  const titel = txt(b.titel);

  let box = null;
  if (opt.auswahl) {
    box = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': titel + ' auswählen' });
    box.checked = opt.auswahl.gewaehlt(b);
    box.addEventListener('change', function () { opt.auswahl.umschalten(b, box.checked); });
  } else if (opt.haken) {
    box = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': titel + ' veröffentlicht' });
    box.checked = fertig;
    box.addEventListener('change', function () { opt.haken.umschalten(b, box.checked); });
  }

  const punkt = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
  punkt.style.background = k.farbe;

  const knopf = el('button', {
    class: 'mobi-kachel-text', type: 'button',
    onclick: function () {
      // Beim Auswählen wählt ein Klick auf die Kachel aus, sonst öffnet er den Beitrag
      if (opt.auswahl && box) {
        box.checked = !box.checked;
        opt.auswahl.umschalten(b, box.checked);
      } else {
        opt.oeffnen(b);
      }
    }
  },
    el('span', { class: 'mobi-kachel-kanal leise' },
      punkt,
      el('span', { text: [txt(b.kanal) || 'Ohne Kanal', FORMAT_TEXT[txt(b.format)] || ''].filter(Boolean).join(' · ') })
    ),
    el('strong', {
      class: st ? 'mobi-titel-' + st : '',
      text: titel + kommentarMarke((opt.kommentare || {})[String(b.id)])
    }),
    el('span', { class: 'leise' + (st ? ' mobi-datum-' + st : ''), text: datumZeile(b) + ' · ' + statusText(b.status) }),
    el('span', { class: 'leise', text: [opt.bezugText(b), txt(b.verantwortlich)].filter(Boolean).join(' · ') })
  );

  const kachel = el('article', { class: 'karte mobi-kachel' + (fertig ? ' erledigt' : '') },
    box ? el('label', { class: 'mobi-kachel-box' }, box) : null,
    knopf
  );
  kachel.style.borderLeftColor = k.farbe;
  return kachel;
}

// Offene Beiträge in vier Spalten. Leere Spalten sind am Handy ausgeblendet.
export function baueSpalten(liste, opt) {
  const wrap = el('div', { class: 'mobi-spalten' });
  KACHEL_SPALTEN.forEach(function (sp) {
    const l = sortiereBeitraege(liste.filter(function (b) { return spalteVon(b) === sp.id; }));
    const karten = el('div', { class: 'mobi-kacheln' });
    if (!l.length) karten.append(el('p', { class: 'leise', text: 'Keine Beiträge.' }));
    l.forEach(function (b) { karten.append(baueKachel(b, opt)); });
    wrap.append(el('section', { class: 'mobi-spalte' + (l.length ? '' : ' leer'), 'aria-label': sp.name },
      el('h3', { class: 'mobi-spalte-kopf', text: sp.name + ' (' + l.length + ')' }),
      karten
    ));
  });
  return wrap;
}

// Einfache Kachel-Fläche ohne Spalten (für "Veröffentlicht, letzte 2 Wochen")
export function baueKachelFlaeche(liste, opt) {
  return el('div', { class: 'mobi-kacheln mobi-kacheln-flaeche' },
    ...sortiereBeitraege(liste).map(function (b) { return baueKachel(b, opt); }));
}
