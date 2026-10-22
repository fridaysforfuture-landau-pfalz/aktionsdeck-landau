// js/store.js
// Merkt sich im Gerät: die Anmeldung (Token), den Anzeigenamen und die Gruppenliste.

const KEY = 'aktionsdeck_session';
const NAME_KEY = 'aktionsdeck_name';
const GRUPPEN_KEY = 'aktionsdeck_gruppen';

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && s.token ? s : null;
  } catch (e) {
    return null;
  }
}

export function setSession(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignorieren */ }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignorieren */ }
}

// Anzeigename bleibt auch nach dem Abmelden auf dem Gerät
export function getName() {
  try { return (localStorage.getItem(NAME_KEY) || '').trim(); } catch (e) { return ''; }
}

export function setName(n) {
  try { localStorage.setItem(NAME_KEY, String(n).trim().slice(0, 60)); } catch (e) { /* ignorieren */ }
}

// Gruppenliste (öffentlich): damit die Startseite sofort da ist
export function getGruppenCache() {
  try {
    const l = JSON.parse(localStorage.getItem(GRUPPEN_KEY));
    return Array.isArray(l) && l.length ? l : null;
  } catch (e) {
    return null;
  }
}

export function setGruppenCache(liste) {
  try { localStorage.setItem(GRUPPEN_KEY, JSON.stringify(liste)); } catch (e) { /* ignorieren */ }
}

// Zeitpunkt des letzten Besuchs ("Was ist neu?"), pro Gerät und Gruppe
export function getLetzterBesuch(gruppeId) {
  try { return localStorage.getItem('aktionsdeck_besuch_' + gruppeId) || ''; } catch (e) { return ''; }
}

export function setLetzterBesuch(gruppeId, iso) {
  try { localStorage.setItem('aktionsdeck_besuch_' + gruppeId, String(iso)); } catch (e) { /* ignorieren */ }
}

// Entwurf eines Protokolls: einer je Gruppe, nur auf diesem Gerät. { zeit: ISO-Text, felder: {...} } oder null
const ENTWURF_KEY = 'aktionsdeck_entwurf_protokoll_';

export function getEntwurf(gruppeId) {
  try {
    const e = JSON.parse(localStorage.getItem(ENTWURF_KEY + gruppeId));
    return e && e.felder && typeof e.felder === 'object' ? e : null;
  } catch (e) {
    return null;
  }
}

export function setEntwurf(gruppeId, felder) {
  try {
    localStorage.setItem(ENTWURF_KEY + gruppeId, JSON.stringify({ zeit: new Date().toISOString(), felder: felder }));
    return true;
  } catch (e) {
    return false;
  }
}

export function loescheEntwurf(gruppeId) {
  try { localStorage.removeItem(ENTWURF_KEY + gruppeId); } catch (e) { /* ignorieren */ }
}

// Gibt es auf diesem Gerät Protokoll-Entwürfe (egal welche Gruppe)?
function entwurfSchluessel() {
  const l = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(ENTWURF_KEY) === 0) l.push(k);
    }
  } catch (e) { /* ignorieren */ }
  return l;
}

export function gibtEntwurf() {
  return entwurfSchluessel().length > 0;
}

// Beim Abmelden: alle Entwürfe löschen (wichtig bei geteilten Geräten)
export function loescheAlleEntwuerfe() {
  entwurfSchluessel().forEach(function (k) {
    try { localStorage.removeItem(k); } catch (e) { /* ignorieren */ }
  });
}
