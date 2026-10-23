// js/views/team-rechnen.js
// Rechenhelfer für den Reiter Team (Etappe 9): Personen, Gruppen-Rollen, Kapazität.
// Gegenstück zu den Regeln in apps-script/Team.gs. Nichts hier schreibt ins Sheet.
//
// Beispiele (mit node geprüft):
//   namenAus('Anna, Ben; Cem')                         -> ['Anna', 'Ben', 'Cem']
//   istIch({ name: 'Anna' }, ' anna ')                 -> true
//   kapazitaetText(7)                                  -> 'gut Zeit'
//   kapazitaetAm('p1', [{ person_id: 'p1', kapazitaet: 7, gueltig_ab: '2026-10-01', gueltig_bis: '2026-10-31',
//     erstellt_am: '2026-10-01T10:00' }, { person_id: 'p1', kapazitaet: 3, gueltig_ab: '2026-10-20',
//     gueltig_bis: '2026-11-15', erstellt_am: '2026-10-19T10:00' }], '2026-10-23').kapazitaet  -> 3 (neuere gewinnt)
//   angabeJetzt(...) mit nur abgelaufenen Angaben      -> { zustand: 'abgelaufen', angabe: <neueste> }

import { istWahr } from '../schema.js';
import { normDatum } from './todos-rechnen.js';
import { addTage } from './kalender-rechnen.js';

export function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function key(v) {
  return txt(v).toLowerCase();
}

// Namen in einem Feld "verantwortlich": Komma oder Strichpunkt trennen (wie teamNamen im Skript)
export function namenAus(text) {
  return txt(text).split(/[,;]/).map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ''; });
}

// Gehört die Karte zum Anzeigenamen auf diesem Gerät? (Groß- und Kleinschreibung egal)
export function istIch(person, name) {
  const n = key(name);
  return !!n && key(person && person.name) === n;
}

// Dabei = aktiv TRUE oder leer (so liest es auch namenVorschlaege im Protokoll)
export function istAktiv(p) {
  return p.aktiv === undefined || txt(p.aktiv) === '' || istWahr(p.aktiv);
}

// "id1\nid2" -> ['id1', 'id2'] (wie teamListe im Skript)
export function rollenIds(person) {
  return txt(person && person.rollen).split(/[\n,;]+/).map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ''; });
}

// Rollen nach Reihenfolge (sortierung), dann A–Z
export function sortiereRollen(liste) {
  return liste.slice().sort(function (a, b) {
    const sa = Number(a.sortierung);
    const sb = Number(b.sortierung);
    const ha = txt(a.sortierung) !== '' && !isNaN(sa);
    const hb = txt(b.sortierung) !== '' && !isNaN(sb);
    if (ha && hb && sa !== sb) return sa - sb;
    if (ha !== hb) return ha ? -1 : 1;
    return txt(a.name).localeCompare(txt(b.name), 'de');
  });
}

// Die Rollen einer Person als Einträge aus Gruppen_Rollen. Gelöschte oder unbekannte IDs fallen weg.
export function rollenVon(person, rollen) {
  const ids = rollenIds(person);
  return sortiereRollen((rollen || []).filter(function (r) { return ids.indexOf(String(r.id)) >= 0; }));
}

// Kapazität als Satz (Entscheidung 3)
export function kapazitaetText(w) {
  const n = Number(w);
  if (!(n >= 1)) return '';
  if (n <= 3) return 'kaum Zeit';
  if (n <= 6) return 'etwas Zeit';
  if (n <= 8) return 'gut Zeit';
  return 'viel Zeit';
}

function ab(k) { return normDatum(k.gueltig_ab); }
function bis(k) { return normDatum(k.gueltig_bis); }

// Alle Angaben einer Person, neueste (zuletzt angelegte) zuerst
export function angabenVon(personId, kapazitaeten) {
  return (kapazitaeten || []).filter(function (k) {
    return String(k.person_id) === String(personId) && !istWahr(k.geloescht) && ab(k) && bis(k);
  }).sort(function (a, b) {
    return txt(b.erstellt_am).localeCompare(txt(a.erstellt_am));
  });
}

// Welche Angabe gilt an einem Tag? Von allen, die den Tag abdecken, die zuletzt angelegte. Sonst null.
export function kapazitaetAm(personId, kapazitaeten, tag) {
  const passend = angabenVon(personId, kapazitaeten).filter(function (k) {
    return ab(k) <= tag && tag <= bis(k);
  });
  return passend.length ? passend[0] : null;
}

// Stand heute für die Karte:
//   { zustand: 'gilt', angabe }        – gilt heute
//   { zustand: 'kuenftig', angabe }    – nur eine spätere Angabe (frühester Beginn)
//   { zustand: 'abgelaufen', angabe }  – letzte Angabe ist vorbei (spätestes Ende)
//   { zustand: 'keine', angabe: null }
// naechste = die nächste spätere Angabe (falls es eine gibt), für den Hinweis "ab TT.MM.: 5".
export function angabeJetzt(personId, kapazitaeten, heute) {
  const alle = angabenVon(personId, kapazitaeten);
  const spaeter = alle.filter(function (k) { return ab(k) > heute; })
    .sort(function (a, b) { return ab(a).localeCompare(ab(b)); });
  const naechste = spaeter.length ? spaeter[0] : null;
  const jetzt = kapazitaetAm(personId, kapazitaeten, heute);
  if (jetzt) return { zustand: 'gilt', angabe: jetzt, naechste: naechste };
  const vorbei = alle.filter(function (k) { return bis(k) < heute; })
    .sort(function (a, b) { return bis(b).localeCompare(bis(a)); });
  if (vorbei.length) return { zustand: 'abgelaufen', angabe: vorbei[0], naechste: naechste };
  if (naechste) return { zustand: 'kuenftig', angabe: naechste, naechste: null };
  return { zustand: 'keine', angabe: null, naechste: null };
}

// Zustand einer einzelnen Angabe im Verlauf: 'gilt' (die heute gültige), 'ueberholt' (deckt heute ab,
// aber eine neuere gilt), 'kuenftig', 'abgelaufen'
export function angabeZustand(k, gueltigeId, heute) {
  if (String(k.id) === String(gueltigeId)) return 'gilt';
  if (ab(k) > heute) return 'kuenftig';
  if (bis(k) < heute) return 'abgelaufen';
  return 'ueberholt';
}

// Verlauf für das Detail: Angaben, die höchstens 6 Monate (183 Tage) vorbei sind, neueste zuerst
export function verlauf(personId, kapazitaeten, heute) {
  const grenze = addTage(heute, -183);
  return angabenVon(personId, kapazitaeten).filter(function (k) { return bis(k) >= grenze; });
}

// Reihenfolge (Entscheidung 20): eigene Karte zuerst, dann A–Z. Pausierte getrennt.
export function sortierePersonen(personen, name) {
  const az = (personen || []).slice().sort(function (a, b) {
    return txt(a.name).localeCompare(txt(b.name), 'de');
  });
  const ich = az.find(function (p) { return istIch(p, name); }) || null;
  const rest = az.filter(function (p) { return p !== ich; });
  return {
    ich: ich,
    aktive: rest.filter(istAktiv),
    pausiert: rest.filter(function (p) { return !istAktiv(p); })
  };
}

// Suche: Name, Notiz, Namen der Rollen
export function passtSuche(person, rollen, q) {
  const s = key(q);
  if (!s) return true;
  return [person.name, person.notiz].concat(rollenVon(person, rollen).map(function (r) { return r.name; }))
    .some(function (x) { return key(x).indexOf(s) >= 0; });
}

// Filter Rolle: rolleId '' = alle
export function passtRolle(person, rolleId) {
  return !rolleId || rollenIds(person).indexOf(String(rolleId)) >= 0;
}

// ---- Bearbeiten (9.4) ----

// Darf diese Person die Karte bearbeiten? Die eigene Karte immer. Eine Karte, die jemand für eine andere
// Person angelegt hat („Für jemanden eintragen“: erstellt_von ist nicht der Name), dürfen alle bearbeiten.
// Absprache, kein Schutz (Entscheidung 5).
export function darfBearbeiten(person, name) {
  if (istIch(person, name)) return true;
  return !!txt(person.erstellt_von) && key(person.erstellt_von) !== key(person.name);
}

// Wer hat eine gewählte Rolle schon (außer der Person selbst)? Gibt die andere Person zurück oder null.
export function gewaehltVon(rolle, personen, ohneId) {
  if (!istWahr(rolle.gewaehlt)) return null;
  return (personen || []).find(function (p) {
    return String(p.id) !== String(ohneId) && rollenIds(p).indexOf(String(rolle.id)) >= 0;
  }) || null;
}

// Antwort von update beim Umbenennen: { ToDos: 3, Mobi_Plan: 1, ... } -> "3 ToDos, 1 Mobi-Beitrag"
const UMBENANNT_TEXT = {
  ToDos: ['ToDo', 'ToDos'],
  Meilensteine: ['Meilenstein', 'Meilensteine'],
  Mobi_Plan: ['Mobi-Beitrag', 'Mobi-Beiträge'],
  Umfrage_Antworten: ['Umfrage-Antwort', 'Umfrage-Antworten']
};
export function umbenanntText(u) {
  return Object.keys(UMBENANNT_TEXT).filter(function (k) { return u && Number(u[k]) > 0; })
    .map(function (k) { const n = Number(u[k]); return n + ' ' + UMBENANNT_TEXT[k][n === 1 ? 0 : 1]; })
    .join(', ');
}

// Prüft eine neue Kapazitäts-Angabe wie das Skript. Gibt '' oder den Fehlertext zurück.
export function kapazitaetFehler(wert, ab, bis) {
  const n = Number(wert);
  if (!(n >= 1 && n <= 10 && Math.floor(n) === n)) return 'Bitte eine Zahl von 1 bis 10 antippen.';
  const a = normDatum(ab);
  const b = normDatum(bis);
  if (!a || !b) return 'Bitte „gilt ab“ und „gilt bis“ angeben.';
  if (b < a) return '„Gilt bis“ liegt vor „gilt ab“.';
  if (b > addTage(a, 183)) return 'Eine Angabe gilt höchstens 6 Monate.';
  return '';
}
