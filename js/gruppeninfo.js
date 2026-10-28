// js/gruppeninfo.js
// Angaben zur eigenen Gruppe aus dem Skript (Aktion gruppeInfo, seit 11.1):
// Kontostand von OpenCollective und Cloud-Link. Beides steht im Skript, nicht im Sheet.
// Im Gerät liegt der letzte Stand in IndexedDB (Schlüssel <gruppe_id>:gruppeinfo, beim Abmelden gelöscht)
// und für schnelles Zeichnen hier im Speicher. Frisch geladen wird höchstens einmal pro Stunde.

import { api } from './api.js';
import { cacheGet, cacheSet } from './cache.js';

let gid = '';          // Gruppe, zu der info gehört
let info = null;       // { konto: {quelle, betrag, waehrung, stand_am} | null, cloud_link }
let geholt = 0;        // Zeitpunkt der letzten Anfrage an den Server (0 = noch nie)
let laeuft = null;     // laufende Anfrage
const FRISCH_MS = 60 * 60 * 1000;

function schluessel(gruppeId) {
  return gruppeId + ':gruppeinfo';
}

function setze(gruppeId, neu) {
  gid = gruppeId;
  info = neu && typeof neu === 'object' ? neu : null;
}

// Sofort (ohne Warten): letzter bekannter Stand oder null
export function gruppenInfoSofort(gruppeId) {
  return gid === gruppeId ? info : null;
}

export function gruppenInfoFrisch(gruppeId) {
  return gid === gruppeId && Date.now() - geholt < FRISCH_MS;
}

// Cloud-Link der Gruppe, nur wenn er mit https:// beginnt, sonst ''
export function cloudLinkSofort(gruppeId) {
  const i = gruppenInfoSofort(gruppeId);
  const l = i ? String(i.cloud_link || '').trim() : '';
  return /^https:\/\/\S+$/i.test(l) ? l : '';
}

// Holt den gemerkten Stand aus IndexedDB, wenn im Speicher noch nichts ist
export async function gruppenInfoAusCache(gruppeId) {
  if (gid === gruppeId && info) return info;
  if (gid !== gruppeId) { setze(gruppeId, null); geholt = 0; laeuft = null; }
  const alt = await cacheGet(schluessel(gruppeId));
  if (gid === gruppeId && !info && alt && alt.daten) info = alt.daten;
  return gruppenInfoSofort(gruppeId);
}

// Fragt das Skript (höchstens einmal pro Stunde). Fehler (offline, altes Skript) lassen den alten Stand stehen.
// Abgelaufene Anmeldung (Fehler "auth") wird weitergegeben.
export function gruppenInfoLaden(session) {
  const gruppeId = session.gruppe_id;
  if (gruppenInfoFrisch(gruppeId)) return Promise.resolve(info);
  if (gid === gruppeId && laeuft) return laeuft;
  if (gid !== gruppeId) { setze(gruppeId, null); geholt = 0; }
  laeuft = api('gruppeInfo', {}, session.token).then(function (neu) {
    if (gid !== gruppeId) return null;
    laeuft = null;
    geholt = Date.now();
    setze(gruppeId, neu);
    cacheSet(schluessel(gruppeId), { daten: info, stand: new Date().toISOString() });
    return info;
  }).catch(function (e) {
    if (e && e.code === 'auth') { if (gid === gruppeId) laeuft = null; throw e; }
    // Nicht bei jedem Zeichnen neu fragen: erst in einer Stunde wieder
    if (gid === gruppeId) { laeuft = null; geholt = Date.now(); }
    return gruppenInfoSofort(gruppeId);
  });
  return laeuft;
}

// Knopf „Jetzt abrufen“. Gibt { konto, frisch } vom Skript zurück (frisch: true = gerade erst abgerufen).
export async function kontoAktualisieren(session) {
  const res = await api('kontoAktualisieren', {}, session.token);
  if (res && res.konto && gid === session.gruppe_id) {
    info = Object.assign({}, info || {}, { konto: res.konto });
    cacheSet(schluessel(gid), { daten: info, stand: new Date().toISOString() });
  }
  return res;
}

// Beim Abmelden
export function gruppenInfoVergessen() {
  gid = '';
  info = null;
  geholt = 0;
  laeuft = null;
}
