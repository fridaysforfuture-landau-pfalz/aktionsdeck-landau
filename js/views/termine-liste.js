// js/views/termine-liste.js
// Gemeinsame Teile für die öffentlichen Termine: Laden, Aufräumen, Karte, Seitenleiste.
// Die Termine kommen ohne Login vom Skript (Aktion "termine") und liegen im Zwischenspeicher.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { API_URL } from '../config.js';
import { ladeMitCache } from '../cache.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import { schriftfarbe, sichereUrl, WOCHENTAGE_KURZ, wochentagNr } from './kalender-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function farbeVon(f) {
  const t = txt(f);
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : '#368469';
}

// Macht aus der Antwort des Skripts eine saubere Liste. Vergangene fallen heraus.
export function bereinige(roh) {
  const heute = heuteIso();
  const liste = [];
  (Array.isArray(roh) ? roh : []).forEach(function (v) {
    const von = normDatum(v.datum);
    if (!von) return;
    let bis = normDatum(v.datum_ende);
    if (!bis || bis < von) bis = von;
    if (bis < heute) return;
    liste.push({
      titel: txt(v.titel),
      von: von,
      bis: bis,
      zeitVon: txt(v.zeit_von),
      zeitBis: txt(v.zeit_bis),
      ort: txt(v.ort),
      beschreibung: txt(v.beschreibung),
      veranstalter: txt(v.veranstalter),
      url: sichereUrl(v.link),
      gruppe: txt(v.gruppe_name),
      kurz: txt(v.kurzname),
      farbe: farbeVon(v.farbe)
    });
  });
  liste.sort(function (a, b) {
    if (a.von !== b.von) return a.von < b.von ? -1 : 1;
    if (a.zeitVon !== b.zeitVon) return a.zeitVon < b.zeitVon ? -1 : 1;
    return a.titel.localeCompare(b.titel, 'de');
  });
  return liste;
}

function tagKurz(tag) {
  return WOCHENTAGE_KURZ[wochentagNr(tag)] + ', ' + datumText(tag);
}

export function datumsText(t) {
  if (t.von === t.bis) return tagKurz(t.von);
  return tagKurz(t.von) + ' – ' + tagKurz(t.bis);
}

export function zeitText(t) {
  if (t.zeitVon && t.zeitBis) return t.zeitVon + ' – ' + t.zeitBis + ' Uhr';
  if (t.zeitVon) return 'ab ' + t.zeitVon + ' Uhr';
  return '';
}

// Zeigt zuerst den gemerkten Stand, dann den frischen. anzeigen(liste, { aktuell, stand }).
// Gibt true zurück, wenn frisch geladen wurde. Wirft einen Fehler, wenn es gar nichts gibt.
export function ladeOeffentlich(anzeigen) {
  return ladeMitCache(
    'oeffentlich:termine',
    function () { return api('termine', {}); },
    function (daten, meta) { anzeigen(bereinige(daten), meta); },
    true
  );
}

// Adresse zum Abonnieren (Kalender-Datei). kurz = '' heißt alle Gruppen.
export function abonnierLink(kurz) {
  return API_URL + '?aktion=termine&format=ics' + (kurz ? '&gruppe=' + encodeURIComponent(kurz) : '');
}

// Ein Termin als Kasten in der Veranstaltungsfarbe
export function terminKarte(t, kompakt) {
  const info = [zeitText(t), t.ort].filter(Boolean).join(' · ');
  const k = el('article', { class: 'oeff-termin' },
    el('span', { class: 'oeff-datum', text: datumsText(t) }),
    el('strong', { text: t.titel }),
    info ? el('span', { class: 'oeff-info', text: info }) : null,
    el('span', {
      class: 'oeff-info',
      text: t.veranstalter ? 'Veranstalter: ' + t.veranstalter : t.gruppe
    })
  );
  if (!kompakt) {
    if (t.beschreibung) k.append(el('p', { class: 'notiz', text: t.beschreibung }));
    if (t.url) {
      k.append(el('p', null, el('a', {
        href: t.url, target: '_blank', rel: 'noopener noreferrer', text: 'Mehr Infos'
      })));
    }
  }
  k.style.background = t.farbe;
  k.style.color = schriftfarbe(t.farbe);
  return k;
}

// Seitenleiste auf der Gruppenwahl. Ohne Termine bleibt sie versteckt.
export function zeichneSeitenleiste(box, liste) {
  leeren(box);
  box.hidden = !liste.length;
  if (!liste.length) return;
  const MAX = 8;
  box.append(
    el('h2', { text: 'Öffentliche Termine' }),
    el('ul', { class: 'oeff-liste' },
      ...liste.slice(0, MAX).map(function (t) { return el('li', null, terminKarte(t, true)); }))
  );
  if (liste.length > MAX) {
    box.append(el('p', { class: 'leise', text: '… und ' + (liste.length - MAX) + ' weitere' }));
  }
  box.append(el('a', { class: 'knopf knopf-hell', href: '#/termine', text: 'Alle Termine →' }));
}
