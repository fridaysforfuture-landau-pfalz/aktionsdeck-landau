// js/views/wiki-rechnen.js
// Rechenhilfen für den Reiter Wiki (Etappe 10, seit 0.32.2): feste Themen, Sortieren, Suchen,
// Adresse aus dem Titel, Liste der Anleitungsseiten. Ohne DOM, darum mit node prüfbar.
//
// Beispiele (mit node geprüft):
//   adresseAus('Demo anmelden – so geht’s!')  -> 'demo-anmelden-so-geht-s'
//   adresseAus('Müll & Größe')               -> 'muell-groesse'
//   eindeutigeAdresse('demo', ['demo', 'demo-2']) -> 'demo-3'
//   themaVon({ thema: 'Gibt es nicht' })      -> 'Sonstiges'
//   ausschnitt('Viel Text über Banner malen und mehr', 'banner', 20) -> '… über Banner malen …'
//   anleitungListe('team | Team\n# Kommentar\nerste-schritte | Erste Schritte | oeffentlich')
//     -> [{ datei:'team', titel:'Team', oeffentlich:false }, { datei:'erste-schritte', titel:'Erste Schritte', oeffentlich:true }]

import { txt } from '../ui/dom.js';

// Feste Themen im Skillshare (Antwort A der Person). In der App nicht bearbeitbar.
// „Sonstiges“ steht immer zuletzt, die übrigen nach dem Alphabet.
export const THEMEN = [
  'Aktionen und Demos', 'Anmeldung', 'Finanzen und Förderung', 'Gruppe und Treffen', 'Material',
  'Mobi', 'Presse', 'Recht', 'Social Media', 'Technik', 'Sonstiges'
];
export const SONSTIGES = 'Sonstiges';

export const BEREICHE = [
  { id: 'skillshare', label: 'Skillshare' },
  { id: 'anleitung', label: 'Anleitung' },
  { id: 'entwicklung', label: 'Entwicklung App' }
];

export const MAX_TITEL = 80;
export const MAX_TEXT = 20000;

function key(v) {
  return txt(v).toLowerCase();
}

export function themaVon(z) {
  const t = txt(z && z.thema);
  return THEMEN.indexOf(t) >= 0 ? t : SONSTIGES;
}

export function sortiereSeiten(liste) {
  return liste.slice().sort(function (a, b) {
    return txt(a.titel).localeCompare(txt(b.titel), 'de', { sensitivity: 'base' });
  });
}

// Seiten eines Bereichs (nicht gelöscht)
export function seitenIn(zeilen, bereich) {
  return (zeilen || []).filter(function (z) {
    return txt(z.bereich) === bereich && String(z.geloescht).toUpperCase() !== 'TRUE' && z.geloescht !== true;
  });
}

// Skillshare nach Themen: [{ thema, seiten }] in der Reihenfolge von THEMEN, nur Themen mit Seiten
export function nachThema(seiten) {
  const gruppen = {};
  seiten.forEach(function (s) {
    const t = themaVon(s);
    (gruppen[t] = gruppen[t] || []).push(s);
  });
  return THEMEN.filter(function (t) { return gruppen[t]; })
    .map(function (t) { return { thema: t, seiten: sortiereSeiten(gruppen[t]) }; });
}

// Seite nach Titel finden (Groß- und Kleinschreibung egal)
export function findeSeite(seiten, titel) {
  const k = key(titel);
  if (!k) return null;
  return (seiten || []).find(function (s) { return key(s.titel) === k; }) || null;
}

// Titel -> Adresse (a-z, 0-9, Bindestrich, höchstens 60 Zeichen, wie wikiAdresseOk im Skript)
export function adresseAus(titel) {
  const s = txt(titel).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const kurz = s.slice(0, 60).replace(/-+$/, '');
  return kurz || 'seite';
}

export function adresseOk(a) {
  return typeof a === 'string' && a.length >= 1 && a.length <= 60 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(a);
}

// Hängt -2, -3 … an, bis die Adresse frei ist
export function eindeutigeAdresse(basis, vorhanden) {
  const belegt = {};
  (vorhanden || []).forEach(function (a) { belegt[a] = true; });
  if (!belegt[basis]) return basis;
  for (let i = 2; i < 1000; i++) {
    const endung = '-' + i;
    const a = basis.slice(0, 60 - endung.length).replace(/-+$/, '') + endung;
    if (!belegt[a]) return a;
  }
  return basis;
}

// Text ohne Auszeichnungen (für die Suche und den Ausschnitt)
export function ohneFormat(text) {
  return txt(text)
    .replace(/!\[([^\]]*)\]\(bild:[^)]*\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^\s*(#{1,3}|[-*•]|\d{1,3}[.)]|>)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Passt die Seite zur Suche? Alle Wörter müssen vorkommen (in Titel, Thema oder Text).
export function passtSuche(seite, suche) {
  const woerter = key(suche).split(/\s+/).filter(Boolean);
  if (!woerter.length) return true;
  const heuhaufen = (txt(seite.titel) + ' ' + txt(seite.thema) + ' ' + ohneFormat(seite.text)).toLowerCase();
  return woerter.every(function (w) { return heuhaufen.indexOf(w) >= 0; });
}

// Kurzer Ausschnitt um das erste Suchwort
export function ausschnitt(text, suche, laenge) {
  const l = laenge || 120;
  const t = ohneFormat(text);
  const w = key(suche).split(/\s+/).filter(Boolean)[0] || '';
  const pos = w ? t.toLowerCase().indexOf(w) : -1;
  if (pos < 0) return t.length > l ? t.slice(0, l).replace(/\s+\S*$/, '') + ' …' : t;
  let start = Math.max(0, pos - Math.floor(l / 2));
  let ende = Math.min(t.length, start + l);
  let s = t.slice(start, ende);
  if (start > 0) s = '… ' + s.replace(/^\S*\s+/, '');
  if (ende < t.length) s = s.replace(/\s+\S*$/, '') + ' …';
  return s;
}

// texte/anleitung/liste.txt: je Zeile „datei | Titel“ oder „datei | Titel | oeffentlich“. # = Kommentar.
export function anleitungListe(text) {
  return txt(text).split(/\r?\n/).map(function (z) { return z.trim(); })
    .filter(function (z) { return z && z.charAt(0) !== '#'; })
    .map(function (z) {
      const teile = z.split('|').map(function (t) { return t.trim(); });
      return { datei: teile[0], titel: teile[1] || teile[0], oeffentlich: teile[2] === 'oeffentlich' };
    })
    .filter(function (a) { return /^[a-z0-9-]{1,40}$/.test(a.datei); });
}

// "2026-10-23T08:00:00.000Z" -> "23.10.2026"
export function standText(iso) {
  const d = new Date(txt(iso));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
