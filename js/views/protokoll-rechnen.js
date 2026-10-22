// js/views/protokoll-rechnen.js
// Rechenhilfen für den Reiter Protokoll (Etappe 8): Arten, Rollen je Gruppe, Sortierung,
// Gruppieren nach Jahr, Suche, Text zum Kopieren und der Hinweis zur Einfügestelle.
// Keine Anzeige, kein Laden. Wird von js/views/protokoll.js und vom Formular js/views/protokoll-eintrag.js benutzt.

import { istWahr } from '../schema.js';
import { normDatum, datumText } from './todos-rechnen.js';
import { naechsterWochentag, addTage, zeitNorm } from './kalender-rechnen.js';

// Höchstlänge des Protokolltexts (wie MAX_TEXT_AUSNAHMEN in apps-script/Schema.gs)
export const MAX_TEXT = 20000;

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// Art des Protokolls: angezeigt groß, gespeichert klein (wie in js/schema.js)
export const ARTEN = [
  { wert: 'plenum', label: 'Plenum' },
  { wert: 'ag', label: 'AG' },
  { wert: 'aktion', label: 'Aktion' },
  { wert: 'sonstiges', label: 'Sonstiges' }
];

export function artText(a) {
  const k = txt(a).toLowerCase();
  const x = ARTEN.find(function (y) { return y.wert === k; });
  return x ? x.label : txt(a);
}

// Rollen je Gruppe (Entscheidung C, 22.10.2026). Klimabündnis braucht vorerst keine.
const ROLLEN = {
  fff: ['Moderation', 'Protokoll', 'Awareness'],
  gp: ['Moderation', 'Protokoll', 'Awareness']
};

export function rollenFuer(kurzname) {
  return (ROLLEN[txt(kurzname).toLowerCase()] || []).slice();
}

export function imDokument(p) {
  return istWahr(p.im_dokument);
}

// Datum zum Sortieren und Gruppieren: Protokoll-Datum, sonst Tag des Anlegens
export function datumVon(p) {
  return normDatum(p.datum) || normDatum(txt(p.erstellt_am).slice(0, 10));
}

// Neueste zuerst (nach Datum, bei gleichem Datum nach Anlegen)
export function sortiereProtokolle(liste) {
  return liste.slice().sort(function (a, b) {
    const d = datumVon(b).localeCompare(datumVon(a));
    if (d) return d;
    return txt(b.erstellt_am).localeCompare(txt(a.erstellt_am));
  });
}

// [{ jahr: '2026', liste: [...] }], neueste Jahre zuerst. Erwartet eine sortierte Liste.
export function nachJahr(liste) {
  const gruppen = [];
  const index = {};
  liste.forEach(function (p) {
    const jahr = datumVon(p).slice(0, 4) || 'Ohne Datum';
    if (!index[jahr]) {
      index[jahr] = { jahr: jahr, liste: [] };
      gruppen.push(index[jahr]);
    }
    index[jahr].liste.push(p);
  });
  return gruppen;
}

// Suche in Titel, Protokolltext und Anwesend (ohne Groß- und Kleinschreibung)
export function passtSuche(p, suche) {
  const s = txt(suche).toLowerCase();
  if (!s) return true;
  return [p.titel, p.text, p.teilnehmende].some(function (x) {
    return txt(x).toLowerCase().indexOf(s) >= 0;
  });
}

// Schlüssel für den Filter „Projekt oder Veranstaltung“: 'p:<id>' und 'v:<id>'
export function bezugSchluessel(p) {
  const l = [];
  if (txt(p.projekt_id)) l.push('p:' + txt(p.projekt_id));
  if (txt(p.veranstaltung_id)) l.push('v:' + txt(p.veranstaltung_id));
  return l;
}

// Klartext zum Kopieren: Titel, Datum, Rollen, Anwesend, Protokolltext (auch für das Pad)
export function kopierText(p) {
  const teile = [txt(p.titel) || 'Protokoll'];
  if (normDatum(p.datum)) teile.push('Datum: ' + datumText(p.datum));
  txt(p.rollen).split(/\r?\n/).forEach(function (z) { if (txt(z)) teile.push(txt(z)); });
  if (txt(p.teilnehmende)) teile.push('Anwesend: ' + txt(p.teilnehmende));
  const text = String(p.text === undefined || p.text === null ? '' : p.text).replace(/\s+$/, '');
  return teile.join('\n') + (text ? '\n\n' + text : '') + '\n';
}

// Hinweis zur Einfügestelle je Modus (aus der Skript-Aktion protokollInfo)
export function einfuegeHinweis(modus, kurzname) {
  if (modus === 'dokument') return 'Das Protokoll steht im Dokument direkt unter der Markierung.';
  if (modus === 'extern') {
    return txt(kurzname).toLowerCase() === 'gp'
      ? 'Füge das Protokoll im Pad von Hand ein, nach dem Absatz „Aktuelle Projekte“.'
      : 'Füge das Protokoll im Pad von Hand ein.';
  }
  return '';
}

// ---- Formular (8.3) ----

// Namen für Vorschläge: Personen (aktiv), eigener Anzeigename, Anwesende und Rollen bisheriger Protokolle.
// Häufige Namen zuerst. Höchstens max Namen (Standard 30), je höchstens 40 Zeichen.
export function namenVorschlaege(personen, protokolle, eigener, max) {
  const zahl = {};
  const echt = {};
  function merke(n, gewicht) {
    const k = txt(n).replace(/^@/, '').slice(0, 40);
    if (!k) return;
    const key = k.toLowerCase();
    if (!echt[key]) echt[key] = k;
    zahl[key] = (zahl[key] || 0) + gewicht;
  }
  merke(eigener, 1000);
  (personen || []).forEach(function (p) {
    if (p.aktiv === undefined || p.aktiv === '' || istWahr(p.aktiv)) merke(p.name, 1);
  });
  (protokolle || []).forEach(function (p) {
    namenAusListe(p.teilnehmende).forEach(function (n) { merke(n, 1); });
    Object.keys(rollenAusText(p.rollen)).forEach(function (r) { merke(rollenAusText(p.rollen)[r], 1); });
  });
  return Object.keys(zahl).sort(function (a, b) {
    return (zahl[b] - zahl[a]) || echt[a].localeCompare(echt[b], 'de');
  }).slice(0, max || 30).map(function (k) { return echt[k]; });
}

// "Anna, Ben,  Cem" -> ['Anna', 'Ben', 'Cem'] (auch Strichpunkt und Zeilenumbruch trennen)
export function namenAusListe(text) {
  return txt(text).split(/[,;\n]/).map(function (x) { return txt(x); }).filter(Boolean);
}

// Name in die Liste aufnehmen oder (ist er schon drin) herausnehmen. Gibt den neuen Text zurück.
export function nameUmschalten(text, name) {
  const liste = namenAusListe(text);
  const k = txt(name).toLowerCase();
  const i = liste.findIndex(function (x) { return x.toLowerCase() === k; });
  if (i >= 0) liste.splice(i, 1);
  else liste.push(txt(name));
  return liste.join(', ');
}

// "Moderation: Anna\nProtokoll: Ben" -> { Moderation: 'Anna', Protokoll: 'Ben' }
export function rollenAusText(text) {
  const o = {};
  txt(text).split(/\r?\n/).forEach(function (z) {
    const i = z.indexOf(':');
    if (i < 1) return;
    const rolle = txt(z.slice(0, i));
    const name = txt(z.slice(i + 1));
    if (rolle && name) o[rolle] = name;
  });
  return o;
}

// { Moderation: 'Anna', Awareness: '' } -> "Moderation: Anna" (leere Rollen fallen weg)
export function rollenText(rollen, reihenfolge) {
  return reihenfolge.filter(function (r) { return txt(rollen[r]); })
    .map(function (r) { return r + ': ' + txt(rollen[r]); }).join('\n');
}

// Gliederung für ein Plenum: je TOP Überschrift, ein Stichpunkt, Leerzeile (Wunsch 22.10.2026)
export function plenumGliederung() {
  return '1. \n- \n\n2. \n- \n\nSonstiges\n- \n';
}

// „+ TOP“: nächste Nummer vor der Zeile „Sonstiges“ einfügen (ohne „Sonstiges“: am Ende).
// Gibt { text, pos } zurück; pos = Cursor direkt hinter der neuen Nummer.
export function topEinfuegen(text) {
  const t = String(text === undefined || text === null ? '' : text);
  let n = 0;
  t.split('\n').forEach(function (z) {
    const m = /^\s*(\d+)\.(\s|$)/.exec(z);
    if (m) n = Math.max(n, Number(m[1]));
  });
  const neu = (n + 1) + '. ';
  const m = /(^|\n)Sonstiges/i.exec(t);
  if (m) {
    const stelle = m.index + m[1].length;
    const davor = t.slice(0, stelle);
    const trenner = davor === '' || /\n\n$/.test(davor) ? '' : (/\n$/.test(davor) ? '\n' : '\n\n');
    const vorn = davor + trenner + neu;
    return { text: vorn + '\n\n' + t.slice(stelle), pos: vorn.length };
  }
  const trenner = t === '' || /\n\n$/.test(t) ? '' : (/\n$/.test(t) ? '\n' : '\n\n');
  const vorn = t + trenner + neu;
  return { text: vorn, pos: vorn.length };
}

// Nächstes Plenum nach dem Tag des Protokolls (der Tag selbst zählt nicht).
// vorlagen: Zeilen aus Termin_Vorlagen (eine, deren Name mit „Plenum“ beginnt), sonst standard
// ({ wochentag, zeit_von } aus kalender-vorlagen.js). Gibt { datum, zeit } oder null.
export function naechstesPlenum(vorlagen, standard, protokollDatum) {
  const v = (vorlagen || []).find(function (x) {
    return /^plenum/i.test(txt(x.name)) && txt(x.wochentag);
  }) || standard;
  if (!v || !txt(v.wochentag)) return null;
  const ab = addTage(normDatum(protokollDatum) || '', 1);
  const datum = naechsterWochentag(v.wochentag, ab);
  return datum ? { datum: datum, zeit: zeitNorm(v.zeit_von) } : null;
}

// Schlusszeile "Nächstes Plenum: 23.10.2026, 18:30" ('' ohne Datum)
export function schlusszeile(datum, zeit) {
  if (!normDatum(datum)) return '';
  return 'Nächstes Plenum: ' + datumText(datum) + (zeitNorm(zeit) ? ', ' + zeitNorm(zeit) : '');
}

// Protokolltext mit Schlusszeile (wird beim Speichern gebaut)
export function textMitSchluss(text, datum, zeit) {
  const t = String(text === undefined || text === null ? '' : text).replace(/\s+$/, '');
  const z = schlusszeile(datum, zeit);
  if (!z) return t;
  return t ? t + '\n\n' + z : z;
}

// ---- TOPs im Protokolltext (8.3a) ----
// Ein TOP ist eine Zeile „1. Titel“ ganz am Zeilenanfang. „Sonstiges“ steht immer als letzter Abschnitt.
// Stichpunkte sind Zeilen „- Text“, eingerückt mit Tabs davor („\t- Text“).

const TOP_ZEILE = /^(\d+)\.[ \t]*(.*)$/;
const SONSTIGES = /^Sonstiges[ \t]*:?[ \t]*$/i;
const STICHPUNKT = /^(\t*)- ?(.*)$/;

function zeilen(text) {
  return String(text === undefined || text === null ? '' : text).split('\n');
}

export function istTopZeile(z) {
  return TOP_ZEILE.test(z) || SONSTIGES.test(z);
}

// Liste der nummerierten TOPs: [{ zeile, nr, titel }]
export function topListe(text) {
  const l = [];
  zeilen(text).forEach(function (z, i) {
    const m = TOP_ZEILE.exec(z);
    if (m) l.push({ zeile: i, nr: Number(m[1]), titel: txt(m[2]) });
  });
  return l;
}

// Ende des Abschnitts ab Zeile i (erste Zeile des nächsten TOPs oder von „Sonstiges“, sonst Länge)
function abschnittEnde(z, i) {
  for (let k = i + 1; k < z.length; k++) if (istTopZeile(z[k])) return k;
  return z.length;
}

function abschnittLeer(z, i) {
  const ende = abschnittEnde(z, i);
  for (let k = i + 1; k < ende; k++) if (txt(z[k]).replace(/^-\s*/, '')) return false;
  return true;
}

// Nummern der TOPs neu vergeben (1, 2, 3 … in der Reihenfolge im Text)
export function topsNummerieren(text) {
  let n = 0;
  return zeilen(text).map(function (z) {
    const m = TOP_ZEILE.exec(z);
    if (!m) return z;
    n += 1;
    return n + '. ' + m[2].replace(/^[ \t]+/, '');
  }).join('\n');
}

// Nummer eines TOPs mit diesem Titel (ohne Groß- und Kleinschreibung), 0 wenn nicht im Text
export function topNummer(text, titel) {
  const k = txt(titel).toLowerCase();
  const t = topListe(text).find(function (x) { return x.titel.toLowerCase() === k; });
  return t ? t.nr : 0;
}

// TOP anhängen: zuerst eine leere Nummer („2. “ ohne Inhalt) füllen, sonst vor „Sonstiges“ einfügen.
// Ein neuer TOP bekommt gleich einen leeren Stichpunkt („- “) und eine Leerzeile.
// Gibt { text, pos } zurück (pos = Ende des ersten Stichpunkts unter dem TOP, sonst Ende der TOP-Zeile).
export function topHinzu(text, titel) {
  const z = zeilen(text);
  const t = txt(titel);
  const leer = topListe(text).find(function (x) { return !x.titel && abschnittLeer(z, x.zeile); });
  let zeile;
  if (leer && t) {
    z[leer.zeile] = leer.nr + '. ' + t;
    zeile = leer.zeile;
  } else {
    let s = z.findIndex(function (x) { return SONSTIGES.test(x); });
    if (s < 0) {
      while (z.length && !txt(z[z.length - 1])) z.pop();
      if (z.length) z.push('');
      z.push('0. ' + t, '- ');
      zeile = z.length - 2;
    } else {
      // Leerzeilen vor „Sonstiges“: eine bleibt als Abstand
      while (s > 0 && !txt(z[s - 1])) { z.splice(s - 1, 1); s -= 1; }
      const neu = s > 0 ? ['', '0. ' + t, '- ', ''] : ['0. ' + t, '- ', ''];
      z.splice(s, 0, ...neu);
      zeile = s + (s > 0 ? 1 : 0);
    }
  }
  const fertig = topsNummerieren(z.join('\n')).split('\n');
  // Cursor in den Stichpunkt direkt darunter, wenn es einen gibt
  if (zeile + 1 < fertig.length && /^\t*- ?$/.test(fertig[zeile + 1])) zeile += 1;
  let pos = 0;
  for (let i = 0; i <= zeile; i++) pos += fertig[i].length + (i < zeile ? 1 : 0);
  return { text: fertig.join('\n'), pos: pos };
}

// TOP mit diesem Titel samt seinem Abschnitt entfernen. { text, hatteInhalt, gefunden }
export function topEntfernen(text, titel) {
  const z = zeilen(text);
  const k = txt(titel).toLowerCase();
  const t = topListe(text).find(function (x) { return x.titel.toLowerCase() === k; });
  if (!t) return { text: String(text || ''), hatteInhalt: false, gefunden: false };
  const hatteInhalt = !abschnittLeer(z, t.zeile);
  let ende = abschnittEnde(z, t.zeile);
  let start = t.zeile;
  // Eine Leerzeile davor mitnehmen, damit keine doppelten Abstände bleiben
  if (start > 0 && !txt(z[start - 1])) start -= 1;
  z.splice(start, ende - start);
  return { text: topsNummerieren(z.join('\n')), hatteInhalt: hatteInhalt, gefunden: true };
}

// Vor dem Speichern: leere Nummern ohne Titel und ohne Inhalt weg, leere Stichpunkte weg, neu nummerieren,
// höchstens eine Leerzeile.
export function textAufraeumen(text) {
  const z = zeilen(text);
  const weg = {};
  topListe(text).forEach(function (x) {
    if (!x.titel && abschnittLeer(z, x.zeile)) {
      const ende = abschnittEnde(z, x.zeile);
      for (let k = x.zeile; k < ende; k++) weg[k] = true;
    }
  });
  // Leere Stichpunkte („- “ ohne Text) fallen auch weg
  const rest = z.filter(function (x, i) { return !weg[i] && !/^\t*-\s*$/.test(x); }).join('\n');
  return topsNummerieren(rest).replace(/\n{3,}/g, '\n\n');
}

// ---- Stichpunkte beim Tippen ----
// Alle Funktionen bekommen den Text und die Cursorstelle und geben { text, pos } zurück
// oder null (dann macht das Textfeld das Übliche).

function zeileUm(text, pos) {
  const start = text.lastIndexOf('\n', pos - 1) + 1;
  let ende = text.indexOf('\n', pos);
  if (ende < 0) ende = text.length;
  return { start: start, ende: ende, zeile: text.slice(start, ende) };
}

// Enter: unter einem TOP und in Stichpunkten geht es mit „- “ weiter. Leerer Stichpunkt = Liste beenden.
export function stichpunktEnter(text, pos) {
  const z = zeileUm(text, pos);
  if (pos !== z.ende) return null;
  if (istTopZeile(z.zeile)) {
    const neu = '\n- ';
    return { text: text.slice(0, pos) + neu + text.slice(pos), pos: pos + neu.length };
  }
  const m = STICHPUNKT.exec(z.zeile);
  if (!m || z.zeile.indexOf('-') !== m[1].length) return null;
  if (!txt(m[2])) {
    // Leerer Stichpunkt: zu normalem Text machen (Liste endet)
    return { text: text.slice(0, z.start) + text.slice(z.ende), pos: z.start };
  }
  const neu = '\n' + m[1] + '- ';
  return { text: text.slice(0, pos) + neu + text.slice(pos), pos: pos + neu.length };
}

// Tab: Stichpunkt einrücken (normale Zeile wird Stichpunkt). Umschalt+Tab: ausrücken, ganz links = normaler Text.
export function stichpunktTab(text, pos, zurueck) {
  const z = zeileUm(text, pos);
  if (istTopZeile(z.zeile)) return { text: text, pos: pos };
  const m = STICHPUNKT.exec(z.zeile);
  const istPunkt = !!m && z.zeile.indexOf('-') === m[1].length;
  let neu;
  if (!zurueck) neu = istPunkt ? '\t' + z.zeile : '- ' + z.zeile.replace(/^\s+/, '');
  else if (istPunkt && m[1].length) neu = z.zeile.slice(1);
  else if (istPunkt) neu = m[2];
  else return { text: text, pos: pos };
  const p = Math.max(z.start, pos + neu.length - z.zeile.length);
  return { text: text.slice(0, z.start) + neu + text.slice(z.ende), pos: p };
}

// Rücktaste direkt hinter „- “ eines leeren Stichpunkts: ausrücken bzw. zu normalem Text machen.
export function stichpunktRueck(text, pos) {
  const z = zeileUm(text, pos);
  if (pos !== z.ende || !/^\t*- ?$/.test(z.zeile)) return null;
  return stichpunktTab(text, pos, true);
}

// ---- Markierungen im Protokolltext (8.4) ----
// Gelesen werden NUR Zeilen, die mit einem dieser Symbole beginnen (davor darf ein Stichpunkt „- “ stehen).
// Fließtext wird nie gedeutet, es gibt keine KI.
//   ☐ @Name: Aufgabe (bis TT.MM.)        -> ToDo (ohne @Name = Hut frei, mehrere: @Anna @Ben:)
//   💡 Aktionsart: Text                  -> Learning (ohne Aktionsart: die des verknüpften Projekts)
//   📅 Titel, TT.MM.JJJJ, HH:MM, Ort      -> Termin (Uhrzeit und Ort freiwillig, Datum ohne Jahr = nächstes Vorkommen)
//   📌 Titel: Text                       -> Mitteilung („📌 Mitteilung „Titel“: …“ aus „+ Einfügen“ wird übersprungen,
//                                           wenn es die Mitteilung schon gibt)
//   📊 Frage? | Antwort 1 | Antwort 2    -> Umfrage (mindestens zwei Antworten)
//   👉 Text                              -> Beschluss (nur Hervorhebung, kein Vorschlag)
// Dazu die Schlusszeile „Nächstes Plenum: TT.MM.JJJJ, HH:MM“ (Termin „Plenum“).
//
// Beispiele (heute = 22.10.2026, getestet mit node):
//   '☐ @Anna: Flyer drucken (bis 20.10.)'  -> ToDo, verantwortlich 'Anna', faellig_am '2027-10-20' (nächstes Vorkommen)
//   '☐ Plakate holen'                      -> ToDo ohne Verantwortliche (Hut frei)
//   '☐ @Anna Flyer drucken'                -> Fehlerzeile: Nach dem Namen fehlt der Doppelpunkt
//   '📅 Infostand, 07.11., Rathausplatz'   -> Termin 2026-11-07 ohne Uhrzeit, Ort 'Rathausplatz'
//   '📊 Wann? | Mo | Di | Mi'              -> Umfrage mit drei Antworten
//   '💡 Flyer früher bestellen'            -> Learning mit der Aktionsart des Projekts

export const MARKEN = [
  { art: 'todo', zeichen: '☐', label: 'ToDo' },
  { art: 'learning', zeichen: '💡', label: 'Learning' },
  { art: 'termin', zeichen: '📅', label: 'Termin' },
  { art: 'mitteilung', zeichen: '📌', label: 'Mitteilung' },
  { art: 'umfrage', zeichen: '📊', label: 'Umfrage' },
  { art: 'beschluss', zeichen: '👉', label: 'Beschluss' }
];

const ISO = function (j, m, t) {
  return j + '-' + (m < 10 ? '0' : '') + m + '-' + (t < 10 ? '0' : '') + t;
};

// "20.10." oder "20.10.2026" (auch "20.10.26") -> JJJJ-MM-TT. Ohne Jahr: nächstes Vorkommen ab heute.
export function markenDatum(s, heute) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})?$/.exec(txt(s));
  if (!m) return '';
  const tag = Number(m[1]);
  const monat = Number(m[2]);
  const h = normDatum(heute) || iso0();
  let jahr = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : Number(h.slice(0, 4));
  const gueltig = function (j) {
    const d = new Date(j, monat - 1, tag);
    return d.getFullYear() === j && d.getMonth() === monat - 1 && d.getDate() === tag;
  };
  if (!gueltig(jahr) && !(!m[3] && gueltig(jahr + 1))) return '';
  let d = ISO(jahr, monat, tag);
  if (!m[3] && (d < h || !gueltig(jahr))) d = ISO(jahr + 1, monat, tag);
  return d;
}

function iso0() {
  const d = new Date();
  return ISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// Kurze Schreibweise fürs Einfügen: "20.10." wenn das nächste Vorkommen genau dieses Datum ist, sonst mit Jahr
export function markenDatumText(isoDatum, heute) {
  const d = normDatum(isoDatum);
  if (!d) return '';
  const kurz = d.slice(8, 10) + '.' + d.slice(5, 7) + '.';
  return markenDatum(kurz, heute) === d ? kurz : kurz + d.slice(0, 4);
}

function zeitAus(s) {
  const m = /^(\d{1,2})[:.](\d{2})(\s*Uhr)?$/i.exec(txt(s)) || /^(\d{1,2})\s*Uhr$/i.exec(txt(s));
  if (!m) return '';
  const st = Number(m[1]);
  const mi = m[2] && /^\d{2}$/.test(m[2]) ? Number(m[2]) : 0;
  if (st > 23 || mi > 59) return '';
  return (st < 10 ? '0' : '') + st + ':' + (mi < 10 ? '0' : '') + mi;
}

// Zeile ohne Stichpunkt davor; { art, rest } oder null
function markeVon(zeile) {
  const z = zeile.replace(/^\t*-\s*/, '').replace(/^\s+/, '');
  for (let i = 0; i < MARKEN.length; i++) {
    const k = MARKEN[i].zeichen;
    if (z.indexOf(k) === 0) return { art: MARKEN[i].art, rest: txt(z.slice(k.length).replace(/^️/, '')) };
  }
  return null;
}

// text: Protokolltext. opt: { heute (JJJJ-MM-TT), projektAktionsart, mitteilungen (vorhandene, mit titel) }
// Gibt { todos, learnings, termine, mitteilungen, umfragen, beschluesse, fehler, uebersprungen } zurück.
// Jeder Eintrag hat zeile (Zeilennummer ab 1) und text (die ganze Zeile). fehler: { zeile, text, grund }.
export function leseMarkierungen(text, opt) {
  const o = opt || {};
  const heute = normDatum(o.heute) || iso0();
  const r = { todos: [], learnings: [], termine: [], mitteilungen: [], umfragen: [], beschluesse: [], fehler: [], uebersprungen: [] };
  const vorhanden = {};
  (o.mitteilungen || []).forEach(function (m) { vorhanden[txt(m.titel).toLowerCase()] = true; });

  String(text === undefined || text === null ? '' : text).split(/\r?\n/).forEach(function (roh, i) {
    const zeile = roh.replace(/\s+$/, '');
    const nr = i + 1;
    const fehler = function (grund) { r.fehler.push({ zeile: nr, text: zeile, grund: grund }); };

    // Schlusszeile „Nächstes Plenum: 29.10.2026, 18:30“ = Termin
    const np = /^Nächstes Plenum:\s*([0-9.]+)\s*(?:,\s*(.+))?$/.exec(txt(zeile));
    if (np) {
      const d = markenDatum(np[1], heute);
      if (!d) { fehler('Das Datum ist nicht lesbar (TT.MM.JJJJ).'); return; }
      r.termine.push({ zeile: nr, text: zeile, titel: 'Plenum', datum: d, zeit: zeitAus(np[2] || ''), ort: '' });
      return;
    }

    const m = markeVon(zeile);
    if (!m) return;
    const rest = m.rest;

    if (m.art === 'todo') {
      let wer = [];
      let aufgabe = rest;
      if (rest.charAt(0) === '@') {
        const dp = rest.indexOf(':');
        if (dp < 0) { fehler('Nach dem Namen fehlt der Doppelpunkt („☐ @Name: Aufgabe“).'); return; }
        wer = rest.slice(0, dp).split(/[@,]/).map(function (x) { return txt(x); }).filter(Boolean);
        aufgabe = txt(rest.slice(dp + 1));
      }
      let frist = '';
      const f = /\(\s*bis\s+([0-9.]+)\s*\)\s*$/i.exec(aufgabe);
      if (f) {
        frist = markenDatum(f[1], heute);
        if (!frist) { fehler('Die Frist ist nicht lesbar („(bis TT.MM.)“).'); return; }
        aufgabe = txt(aufgabe.slice(0, f.index));
      }
      if (!aufgabe) { fehler('Die Aufgabe fehlt.'); return; }
      r.todos.push({ zeile: nr, text: zeile, aufgabe: aufgabe, verantwortlich: wer.join(', '), faellig_am: frist });
      return;
    }

    if (m.art === 'learning') {
      let aktionsart = '';
      let t = rest;
      const dp = rest.indexOf(':');
      if (dp > 0 && dp <= 40) { aktionsart = txt(rest.slice(0, dp)); t = txt(rest.slice(dp + 1)); }
      if (!t) { fehler('Der Text des Learnings fehlt.'); return; }
      r.learnings.push({ zeile: nr, text: zeile, aktionsart: aktionsart || txt(o.projektAktionsart), learning: t, ausProjekt: !aktionsart });
      return;
    }

    if (m.art === 'termin') {
      const teile = rest.split(',').map(function (x) { return txt(x); });
      const titel = teile[0];
      if (!titel) { fehler('Der Titel des Termins fehlt („📅 Titel, TT.MM.JJJJ“).'); return; }
      if (teile.length < 2) { fehler('Das Datum fehlt („📅 Titel, TT.MM.JJJJ“).'); return; }
      const d = markenDatum(teile[1], heute);
      if (!d) { fehler('Das Datum ist nicht lesbar (TT.MM.JJJJ).'); return; }
      let zeit = '';
      let ab = 2;
      if (teile.length > 2 && zeitAus(teile[2])) { zeit = zeitAus(teile[2]); ab = 3; }
      r.termine.push({ zeile: nr, text: zeile, titel: titel, datum: d, zeit: zeit, ort: teile.slice(ab).join(', ') });
      return;
    }

    if (m.art === 'mitteilung') {
      // Aus „+ Einfügen“: 📌 Mitteilung „Titel“: Text
      const app = /^Mitteilung\s+„([^“”"]*)[“”"]\s*:\s*(.*)$/.exec(rest);
      if (app) {
        if (vorhanden[txt(app[1]).toLowerCase()]) { r.uebersprungen.push({ zeile: nr, text: zeile, grund: 'Mitteilung gibt es schon' }); return; }
        r.mitteilungen.push({ zeile: nr, text: zeile, titel: txt(app[1]), inhalt: txt(app[2]) });
        return;
      }
      const dp = rest.indexOf(':');
      const titel = txt(dp >= 0 ? rest.slice(0, dp) : rest);
      if (!titel) { fehler('Der Titel der Mitteilung fehlt („📌 Titel: Text“).'); return; }
      r.mitteilungen.push({ zeile: nr, text: zeile, titel: titel, inhalt: dp >= 0 ? txt(rest.slice(dp + 1)) : '' });
      return;
    }

    if (m.art === 'umfrage') {
      const teile = rest.split('|').map(function (x) { return txt(x); });
      const frage = teile[0];
      const antworten = teile.slice(1).filter(Boolean);
      if (!frage) { fehler('Die Frage fehlt („📊 Frage? | Antwort 1 | Antwort 2“).'); return; }
      if (antworten.length < 2) { fehler('Eine Umfrage braucht mindestens zwei Antworten, getrennt mit „|“.'); return; }
      r.umfragen.push({ zeile: nr, text: zeile, frage: frage, antworten: antworten });
      return;
    }

    if (m.art === 'beschluss') {
      if (!rest) { fehler('Der Text des Beschlusses fehlt.'); return; }
      r.beschluesse.push({ zeile: nr, text: zeile, beschluss: rest });
    }
  });
  return r;
}

// Kurze Übersicht: „2 ToDos · 1 Termin · 1 Fehlerzeile“ ('' ohne Markierungen)
export function markenUebersicht(r) {
  const teile = [];
  const z = function (n, eins, mehr) { if (n) teile.push(n + ' ' + (n === 1 ? eins : mehr)); };
  z(r.todos.length, 'ToDo', 'ToDos');
  z(r.learnings.length, 'Learning', 'Learnings');
  z(r.termine.length, 'Termin', 'Termine');
  z(r.mitteilungen.length, 'Mitteilung', 'Mitteilungen');
  z(r.umfragen.length, 'Umfrage', 'Umfragen');
  z(r.beschluesse.length, 'Beschluss', 'Beschlüsse');
  z(r.fehler.length, 'Fehlerzeile', 'Fehlerzeilen');
  return teile.join(' · ');
}

// Eine Markierungszeile an der Cursorstelle einfügen: leere Zeile oder leerer Stichpunkt wird gefüllt,
// sonst kommt eine neue Zeile unter die aktuelle (bei Stichpunkten wieder als Stichpunkt).
// Gibt { text, pos } zurück (pos = Ende der eingefügten Zeile).
export function zeileEinfuegen(text, pos, neu) {
  const t = String(text === undefined || text === null ? '' : text);
  const start = t.lastIndexOf('\n', pos - 1) + 1;
  let ende = t.indexOf('\n', pos);
  if (ende < 0) ende = t.length;
  const zeile = t.slice(start, ende);
  const punkt = /^(\t*- ?)/.exec(zeile);
  if (!txt(zeile) || /^\t*-\s*$/.test(zeile)) {
    const vorn = (punkt ? punkt[1].replace(/- ?$/, '- ') : '') + neu;
    return { text: t.slice(0, start) + vorn + t.slice(ende), pos: start + vorn.length };
  }
  const rein = '\n' + (punkt ? punkt[1].replace(/- ?$/, '- ') : '') + neu;
  return { text: t.slice(0, ende) + rein + t.slice(ende), pos: ende + rein.length };
}
