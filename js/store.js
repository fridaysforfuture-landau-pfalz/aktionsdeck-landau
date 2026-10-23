// js/store.js
// Merkt sich im Gerät: die Anmeldung (Token), den Anzeigenamen und die Gruppenliste.

const KEY = 'aktionsdeck_session';
const NAME_KEY = 'aktionsdeck_name';
const GRUPPEN_KEY = 'aktionsdeck_gruppen';
const NAME_VORHER_KEY = 'aktionsdeck_name_vorher';

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
  try {
    const alt = (localStorage.getItem(NAME_KEY) || '').trim();
    const neu = String(n).trim().slice(0, 60);
    // Den vorigen Namen merken (Reiter Team fragt dann, ob die Team-Karte mit umbenannt werden soll, 9.4)
    if (alt && alt !== neu) localStorage.setItem(NAME_VORHER_KEY, alt);
    localStorage.setItem(NAME_KEY, neu);
  } catch (e) { /* ignorieren */ }
}

export function getNameVorher() {
  try { return (localStorage.getItem(NAME_VORHER_KEY) || '').trim(); } catch (e) { return ''; }
}

export function loescheNameVorher() {
  try { localStorage.removeItem(NAME_VORHER_KEY); } catch (e) { /* ignorieren */ }
}

// Start: Zeile „Kapazität eintragen“ für 7 Tage ausgeblendet (9.7). Zeitpunkt des Wegklickens je Gruppe.
export function teamHinweisAus(gruppeId) {
  try {
    const t = Number(localStorage.getItem('aktionsdeck_teamhinweis_' + gruppeId)) || 0;
    return Date.now() - t < 7 * 86400000;
  } catch (e) { return false; }
}

export function setTeamHinweisAus(gruppeId) {
  try { localStorage.setItem('aktionsdeck_teamhinweis_' + gruppeId, String(Date.now())); } catch (e) { /* ignorieren */ }
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

// Nicht gespeicherte Rede im Formular (8.8): eine je Gruppe, nur auf diesem Gerät, damit ein Reiterwechsel
// nichts verliert. { zeit, id ('' = neu), bekannt (geaendert_am beim Öffnen), felder: {...} } oder null
const REDE_KEY = 'aktionsdeck_entwurf_rede_';

export function getRedeEntwurf(gruppeId) {
  try {
    const e = JSON.parse(localStorage.getItem(REDE_KEY + gruppeId));
    return e && e.felder && typeof e.felder === 'object' ? e : null;
  } catch (e) {
    return null;
  }
}

export function setRedeEntwurf(gruppeId, id, bekannt, felder) {
  try {
    localStorage.setItem(REDE_KEY + gruppeId, JSON.stringify({
      zeit: new Date().toISOString(), id: String(id || ''), bekannt: bekannt || '', felder: felder
    }));
    return true;
  } catch (e) {
    return false;
  }
}

export function loescheRedeEntwurf(gruppeId) {
  try { localStorage.removeItem(REDE_KEY + gruppeId); } catch (e) { /* ignorieren */ }
}

// Nicht gespeicherte Wiki-Seite (10.4): eine je Gruppe, nur auf diesem Gerät.
// { zeit, id ('' = neu), bereich, felder: { titel, thema, text, adresse, oeffentlich } } oder null
const WIKI_KEY = 'aktionsdeck_entwurf_wiki_';

export function getWikiEntwurf(gruppeId) {
  try {
    const e = JSON.parse(localStorage.getItem(WIKI_KEY + gruppeId));
    return e && e.felder && typeof e.felder === 'object' ? e : null;
  } catch (e) {
    return null;
  }
}

export function setWikiEntwurf(gruppeId, id, bereich, felder) {
  try {
    localStorage.setItem(WIKI_KEY + gruppeId, JSON.stringify({
      zeit: new Date().toISOString(), id: String(id || ''), bereich: String(bereich || ''), felder: felder
    }));
    return true;
  } catch (e) {
    return false;
  }
}

export function loescheWikiEntwurf(gruppeId) {
  try { localStorage.removeItem(WIKI_KEY + gruppeId); } catch (e) { /* ignorieren */ }
}

// Gibt es auf diesem Gerät Entwürfe von Protokollen, Reden oder Wiki-Seiten (egal welche Gruppe)?
function entwurfSchluessel() {
  const l = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.indexOf(ENTWURF_KEY) === 0 || k.indexOf(REDE_KEY) === 0 || k.indexOf(WIKI_KEY) === 0)) l.push(k);
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
