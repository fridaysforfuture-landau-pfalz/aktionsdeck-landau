// js/views/erinnerungen-rechnen.js
// Regeln für die Kachel „Für dich“ auf dem Start (11.4). Alle Regeln stehen nur hier.
// Es gibt drei Arten (Plan Etappe 11, Antwort 10):
//   umfrage    – laufende Umfrage, bei der du (nach Anzeigename) noch nicht abgestimmt hast
//   material   – Material, das du für ein Projekt mitgenommen hast, die Aktion ist vorbei, es ist noch nicht zurück
//   kapazitaet – deine Kapazität im Team fehlt oder ist abgelaufen (nur mit Team-Karte, wie seit 9.7)
// Die Funktionen rechnen nur und zeichnen nichts.

import { istWahr } from '../schema.js';
import { normDatum } from './todos-rechnen.js';
import { istIch, angabeJetzt } from './team-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';
import { zahl, runden } from './material-rechnen.js';
import { txt } from '../ui/dom.js';

function gleicherName(a, b) {
  return txt(a).toLowerCase() === txt(b).toLowerCase();
}

// Laufende Umfragen ohne deine Stimme. Ohne Anzeigename: keine.
export function umfragenOffen(umfragen, antworten, name) {
  if (!txt(name)) return [];
  return (umfragen || []).filter(function (u) {
    if (istWahr(u.beendet)) return false;
    return !(antworten || []).some(function (a) {
      return String(a.umfrage_id) === String(u.id) && gleicherName(a.person, name);
    });
  });
}

// Ist die Aktion des Projekts vorbei? Aktionsdatum vor heute, sonst Deadline vor heute, sonst abgeschlossen.
export function aktionVorbei(p, heute) {
  const tag = normDatum(p.aktionsdatum) || normDatum(p.deadline);
  if (tag) return tag < heute;
  return istAbgeschlossen(p);
}

// Material, das du für ein Projekt mitgenommen hast und das nach der Aktion noch draußen ist.
// Gezählt wird je Material und Projekt: mitgenommen minus zurück minus defekt (egal von wem zurückgebracht).
// Gibt [{ material_id, projekt_id, name, projekt, anzahl }] zurück.
export function materialOffen(ausleihen, material, projekte, name, heute) {
  if (!txt(name)) return [];
  const projektVon = {};
  (projekte || []).forEach(function (p) { projektVon[String(p.id)] = p; });
  const nameVon = {};
  (material || []).forEach(function (m) { nameVon[String(m.id)] = txt(m.name); });

  const summe = {};
  const meins = {};
  (ausleihen || []).forEach(function (a) {
    const pid = txt(a.projekt_id);
    if (!pid) return;
    const key = String(a.material_id) + '|' + pid;
    if (a.art === 'mitgenommen') {
      summe[key] = (summe[key] || 0) + zahl(a.anzahl);
      if (gleicherName(a.person, name)) meins[key] = true;
    } else if (a.art === 'zurueck' || a.art === 'defekt') {
      summe[key] = (summe[key] || 0) - zahl(a.anzahl);
    }
  });

  const liste = [];
  Object.keys(summe).forEach(function (key) {
    const n = runden(summe[key]);
    if (n <= 0 || !meins[key]) return;
    const teile = key.split('|');
    const p = projektVon[teile[1]];
    if (!p || !aktionVorbei(p, heute)) return;
    liste.push({
      material_id: teile[0],
      projekt_id: teile[1],
      name: nameVon[teile[0]] || 'Material',
      projekt: txt(p.titel) || 'Projekt',
      anzahl: n
    });
  });
  liste.sort(function (a, b) { return a.projekt.localeCompare(b.projekt, 'de') || a.name.localeCompare(b.name, 'de'); });
  return liste;
}

// Kapazität: null (alles gut, keine Team-Karte) oder { zustand: 'abgelaufen'|'keine'|'kuenftig', angabe }
export function kapazitaetOffen(team, name, heute) {
  if (!team || !txt(name)) return null;
  const ich = (team.personen || []).find(function (p) { return istIch(p, name); });
  if (!ich) return null;
  const stand = angabeJetzt(ich.id, team.kapazitaet, heute);
  return stand.zustand === 'gilt' ? null : stand;
}
