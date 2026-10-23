// js/views/team-namen.js
// Team-Daten für andere Reiter (Etappe 9, Schritt 9.7): Personen, Gruppen-Rollen und Kapazität.
// Wird von ToDos, Projekten, Mobi und Start beim Öffnen im Hintergrund geladen (ladeTeamKlein) und im Speicher
// gehalten. Zuerst aus dem Zwischenspeicher des Reiters Team (gruppe_id:team), dann frisch vom Skript
// (höchstens einmal je Minute). Fehler stören nicht: dann gibt es eben keine Team-Vorschläge.
//
// namenMitRollen(weitere): Namensvorschläge für „Verantwortlich“: Team-Mitglieder (aktiv) zuerst, mit ihren
// Gruppen-Rollen in der Beschriftung („Anna (Presse, Technik)“), danach die übrigen Namen. Gespeichert wird nur
// der Name (Vorschlag { wert, label }, siehe js/ui/form.js).

import { api } from '../api.js';
import { cacheGet } from '../cache.js';
import { txt, istAktiv, rollenVon } from './team-rechnen.js';

let speicher = { gid: '', personen: [], rollen: [], kapazitaet: [], zeit: 0 };
let laeuft = null;

// Vom Reiter Team aus: frische Daten gleich übernehmen
export function setzeTeamKlein(gid, d) {
  speicher = { gid: String(gid), personen: d.personen || [], rollen: d.rollen || [], kapazitaet: d.kapazitaet || [], zeit: Date.now() };
}

export function teamKlein() {
  return speicher;
}

export function ladeTeamKlein(session) {
  const gid = String(session.gruppe_id);
  if (speicher.gid === gid && Date.now() - speicher.zeit < 60000) return Promise.resolve(speicher);
  if (laeuft) return laeuft;
  laeuft = (async function () {
    if (speicher.gid !== gid) {
      const alt = await cacheGet(gid + ':team');
      if (alt && alt.daten) speicher = { gid: gid, personen: alt.daten.personen || [], rollen: alt.daten.rollen || [], kapazitaet: alt.daten.kapazitaet || [], zeit: 0 };
    }
    try {
      const r = await api('listMehrere', { tabellen: ['Personen', 'Gruppen_Rollen', 'Kapazitaet'] }, session.token);
      const t = (r && r.tabellen) || {};
      setzeTeamKlein(gid, { personen: t.Personen, rollen: t.Gruppen_Rollen, kapazitaet: t.Kapazitaet });
    } catch (e) {
      // ohne Verbindung oder ohne Team-Tabs: alte Daten behalten
    }
    laeuft = null;
    return speicher;
  })();
  return laeuft;
}

function wertVon(v) {
  return v && typeof v === 'object' ? txt(v.wert) : txt(v);
}

// weitere: Namen (Text oder { wert, label }). Gibt [{ wert, label }] zurück, Team zuerst (A–Z), dann die übrigen.
export function namenMitRollen(weitere) {
  const team = speicher.personen.filter(istAktiv).slice().sort(function (a, b) {
    return txt(a.name).localeCompare(txt(b.name), 'de');
  });
  const da = {};
  const liste = [];
  team.forEach(function (p) {
    const n = txt(p.name);
    if (!n || da[n.toLowerCase()]) return;
    da[n.toLowerCase()] = true;
    const rollen = rollenVon(p, speicher.rollen).map(function (r) { return txt(r.name); });
    liste.push({ wert: n, label: rollen.length ? n + ' (' + rollen.join(', ') + ')' : n });
  });
  (weitere || []).forEach(function (v) {
    const n = wertVon(v);
    if (!n || da[n.toLowerCase()]) return;
    da[n.toLowerCase()] = true;
    liste.push({ wert: n, label: n });
  });
  return liste;
}
