// js/views/uebersicht-rechnen.js
// Rechnet die Jahresübersicht (11.5, Plan Etappe 11, Antworten 20 und 21). Zeichnet nichts.
// Zu welchem Jahr ein Eintrag gehört, steht bei jeder Funktion. Ohne passendes Datum zählt das Anlegedatum (erstellt_am).
// daten: { projekte, todos, finanzen, ausleihe, material, veranstaltungen, mobi, protokolle, reden, learnings }

import { istWahr } from '../schema.js';
import { normDatum, datumText } from './todos-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function zahl(v) {
  const n = Number(String(v === undefined || v === null ? '' : v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function runde(n) {
  return Math.round(n * 100) / 100;
}

// Jahr (als Zahl) aus dem ersten lesbaren Datum der Liste, sonst 0
export function jahrAus() {
  for (let i = 0; i < arguments.length; i++) {
    const d = normDatum(arguments[i]);
    if (d) return Number(d.slice(0, 4));
  }
  return 0;
}

// Projekt: Aktionsdatum, sonst Deadline, sonst Start, sonst angelegt
export function projektJahr(p) {
  return jahrAus(p.aktionsdatum, p.deadline, p.start_datum, p.erstellt_am);
}

function zaehle(liste, schluessel) {
  const m = {};
  liste.forEach(function (r) {
    const k = schluessel(r);
    if (k) m[k] = (m[k] || 0) + 1;
  });
  return Object.keys(m).map(function (k) { return { name: k, anzahl: m[k] }; })
    .sort(function (a, b) { return b.anzahl - a.anzahl || a.name.localeCompare(b.name, 'de'); });
}

// Alle Jahre, in denen es etwas gibt, neueste zuerst. Das laufende Jahr ist immer dabei.
export function jahreAus(daten, diesesJahr) {
  const j = {};
  j[diesesJahr] = true;
  (daten.projekte || []).forEach(function (p) { const y = projektJahr(p); if (y) j[y] = true; });
  (daten.todos || []).forEach(function (t) { if (istWahr(t.erledigt)) { const y = jahrAus(t.erledigt_am); if (y) j[y] = true; } });
  (daten.veranstaltungen || []).forEach(function (v) { const y = jahrAus(v.datum); if (y) j[y] = true; });
  (daten.protokolle || []).forEach(function (p) { const y = jahrAus(p.datum, p.erstellt_am); if (y) j[y] = true; });
  return Object.keys(j).map(Number).filter(function (y) { return y > 2000 && y <= diesesJahr; })
    .sort(function (a, b) { return b - a; });
}

// Alle Zahlen für ein Jahr
export function jahresZahlen(daten, jahr) {
  const projekte = (daten.projekte || []).filter(function (p) { return projektJahr(p) === jahr; });
  const titelVon = {};
  (daten.projekte || []).forEach(function (p) { titelVon[String(p.id)] = txt(p.titel) || 'Projekt'; });
  const jahrVonProjekt = {};
  (daten.projekte || []).forEach(function (p) { jahrVonProjekt[String(p.id)] = projektJahr(p); });

  // Projekte: nach dem Jahr des Projekts
  const abgeschlossen = projekte.filter(istAbgeschlossen).map(function (p) {
    return { titel: txt(p.titel), datum: normDatum(p.aktionsdatum) || normDatum(p.deadline), aktionsart: txt(p.aktionsart) };
  }).sort(function (a, b) { return a.datum.localeCompare(b.datum) || a.titel.localeCompare(b.titel, 'de'); });
  const aktiv = projekte.filter(function (p) { return txt(p.status) === 'aktiv'; }).length;
  const planung = projekte.filter(function (p) { return !istAbgeschlossen(p) && txt(p.status) !== 'aktiv'; }).length;

  // Veranstaltungen: nach dem Datum (Termine aus Vorlagen zählen nicht, sie werden nur berechnet)
  const vs = (daten.veranstaltungen || []).filter(function (v) { return jahrAus(v.datum) === jahr; });
  const extern = vs.filter(function (v) { return txt(v.art) === 'extern'; }).map(function (v) {
    return { titel: txt(v.titel), datum: normDatum(v.datum), veranstalter: txt(v.veranstalter) };
  }).sort(function (a, b) { return a.datum.localeCompare(b.datum); });

  // Mobi: veröffentlichte Beiträge nach ihrem Datum, je Kanal
  const mobi = (daten.mobi || []).filter(function (m) {
    return txt(m.status) === 'veroeffentlicht' && jahrAus(m.datum, m.geaendert_am) === jahr;
  });

  // ToDos: erledigt in diesem Jahr
  const todos = (daten.todos || []).filter(function (t) { return istWahr(t.erledigt) && jahrAus(t.erledigt_am) === jahr; });

  // Geld: Posten nach ihrem Datum, sonst nach dem Jahr des Projekts; je Projekt
  const geldJe = {};
  (daten.finanzen || []).forEach(function (r) {
    const pid = txt(r.projekt_id);
    const y = jahrAus(r.datum) || jahrVonProjekt[pid] || jahrAus(r.erstellt_am);
    if (y !== jahr) return;
    if (!geldJe[pid]) geldJe[pid] = { projekt: titelVon[pid] || 'ohne Projekt', geplant: 0, tatsaechlich: 0 };
    geldJe[pid].geplant += zahl(r.betrag_geplant);
    geldJe[pid].tatsaechlich += zahl(r.betrag_tatsaechlich);
  });
  const geld = Object.keys(geldJe).map(function (k) {
    const g = geldJe[k];
    return { projekt: g.projekt, geplant: runde(g.geplant), tatsaechlich: runde(g.tatsaechlich) };
  }).sort(function (a, b) { return a.projekt.localeCompare(b.projekt, 'de'); });

  // Material: am häufigsten mitgenommen (Summe der Anzahl), nach Datum der Buchung
  const nameVon = {};
  (daten.material || []).forEach(function (m) { nameVon[String(m.id)] = txt(m.name); });
  const matJe = {};
  (daten.ausleihe || []).forEach(function (a) {
    if (a.art !== 'mitgenommen' || jahrAus(a.datum, a.erstellt_am) !== jahr) return;
    const id = String(a.material_id);
    matJe[id] = (matJe[id] || 0) + zahl(a.anzahl);
  });
  const material = Object.keys(matJe).map(function (id) {
    return { name: nameVon[id] || 'Material', anzahl: runde(matJe[id]) };
  }).sort(function (a, b) { return b.anzahl - a.anzahl || a.name.localeCompare(b.name, 'de'); }).slice(0, 5);

  // Dokumentation: Protokolle nach Datum, gehaltene Reden nach Datum, Learnings nach Projekt-Jahr (sonst angelegt)
  const protokolle = (daten.protokolle || []).filter(function (p) { return jahrAus(p.datum, p.erstellt_am) === jahr; });
  const reden = (daten.reden || []).filter(function (r) { return txt(r.status) === 'gehalten' && jahrAus(r.datum, r.erstellt_am) === jahr; });
  const learnings = (daten.learnings || []).filter(function (l) {
    return (jahrVonProjekt[txt(l.projekt_id)] || jahrAus(l.erstellt_am)) === jahr;
  });

  return {
    jahr: jahr,
    projekte: { abgeschlossen: abgeschlossen, aktiv: aktiv, planung: planung },
    veranstaltungen: { intern: vs.length - extern.length, extern: extern },
    mobi: { gesamt: mobi.length, jeKanal: zaehle(mobi, function (m) { return txt(m.kanal) || 'ohne Kanal'; }) },
    todos: { erledigt: todos.length, inProjekten: todos.filter(function (t) { return txt(t.projekt_id); }).length },
    geld: {
      jeProjekt: geld,
      geplant: runde(geld.reduce(function (s, g) { return s + g.geplant; }, 0)),
      tatsaechlich: runde(geld.reduce(function (s, g) { return s + g.tatsaechlich; }, 0))
    },
    material: material,
    doku: {
      protokolle: protokolle.length,
      protokolleJeArt: zaehle(protokolle, function (p) { return txt(p.art); }),
      reden: reden.length,
      learnings: learnings.length,
      learningsJeArt: zaehle(learnings, function (l) { return txt(l.aktionsart) || 'ohne Aktionsart'; })
    }
  };
}

export function euro(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

const ART_TEXT = { plenum: 'Plenum', ag: 'AG', aktion: 'Aktion', sonstiges: 'Sonstiges' };

export function protokollArt(a) {
  return ART_TEXT[a] || a;
}

function liste(eintraege) {
  return eintraege.map(function (e) { return e.name + ' ' + e.anzahl; }).join(', ');
}

// Die ganze Übersicht eines Jahres als einfacher Text (für Jahresbericht, Förderantrag, Plenum)
export function alsText(z, gruppenName) {
  const zeilen = ['Jahresübersicht ' + z.jahr + (gruppenName ? ' – ' + gruppenName : ''), ''];
  zeilen.push('Projekte: ' + z.projekte.abgeschlossen.length + ' abgeschlossen, ' + z.projekte.aktiv + ' aktiv, ' + z.projekte.planung + ' in Planung');
  z.projekte.abgeschlossen.forEach(function (p) {
    zeilen.push('- ' + p.titel + (p.datum ? ' (' + datumText(p.datum) + ')' : '') + (p.aktionsart ? ', ' + p.aktionsart : ''));
  });
  zeilen.push('', 'Veranstaltungen: ' + z.veranstaltungen.intern + ' intern, ' + z.veranstaltungen.extern.length + ' extern');
  z.veranstaltungen.extern.forEach(function (v) {
    zeilen.push('- ' + v.titel + (v.datum ? ' (' + datumText(v.datum) + ')' : '') + (v.veranstalter ? ', ' + v.veranstalter : ''));
  });
  zeilen.push('', 'Mobi: ' + z.mobi.gesamt + ' veröffentlichte Beiträge' + (z.mobi.jeKanal.length ? ' (' + liste(z.mobi.jeKanal) + ')' : ''));
  zeilen.push('', 'ToDos: ' + z.todos.erledigt + ' erledigt, davon ' + z.todos.inProjekten + ' in Projekten');
  zeilen.push('', 'Geld: geplant ' + euro(z.geld.geplant) + ', tatsächlich ' + euro(z.geld.tatsaechlich));
  z.geld.jeProjekt.forEach(function (g) {
    zeilen.push('- ' + g.projekt + ': geplant ' + euro(g.geplant) + ', tatsächlich ' + euro(g.tatsaechlich));
  });
  zeilen.push('', 'Material am häufigsten mitgenommen: ' + (z.material.length ? liste(z.material) : 'nichts'));
  zeilen.push('', 'Dokumentation: ' + z.doku.protokolle + ' Protokolle' +
    (z.doku.protokolleJeArt.length ? ' (' + z.doku.protokolleJeArt.map(function (e) { return protokollArt(e.name) + ' ' + e.anzahl; }).join(', ') + ')' : '') +
    ', ' + z.doku.reden + ' gehaltene Reden, ' + z.doku.learnings + ' Learnings' +
    (z.doku.learningsJeArt.length ? ' (' + liste(z.doku.learningsJeArt) + ')' : ''));
  return zeilen.join('\n');
}
