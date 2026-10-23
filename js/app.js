// js/app.js
// Startpunkt: Routing mit #/g/<kurzname>/<reiter>[/<unterpunkt>], Gerüst, Name, Aktualisierung.

import { VERSION, REFRESH_SEKUNDEN } from './config.js';
import { api } from './api.js';
import {
  getSession, clearSession, getName, setName, getGruppenCache, setGruppenCache, gibtEntwurf, loescheAlleEntwuerfe
} from './store.js';
import { cacheLeeren } from './cache.js';
import { baueGeruest, sichtbareTabs, tabLabel } from './ui/nav.js';
import { frageName } from './ui/modal.js';
import { toast } from './ui/toast.js';
import * as gruppenView from './views/gruppen.js';
import * as loginView from './views/login.js';
import * as infoView from './views/info.js';

let gruppenListe = null;   // frisch vom Server (einmal pro Seitenaufruf)
let gruppenLaeuft = null;  // laufende Anfrage
let refreshFn = null;
let laufNummer = 0;
let nameFrageOffen = false;
const geladeneViews = {};

// Sofort verfügbar: frische Liste oder die im Gerät gemerkte
function gruppenSofort() {
  return gruppenListe || getGruppenCache();
}

function ladeGruppen() {
  if (gruppenListe) return Promise.resolve(gruppenListe);
  if (!gruppenLaeuft) {
    gruppenLaeuft = api('gruppen').then(function (liste) {
      gruppenLaeuft = null;
      if (!Array.isArray(liste)) return null;
      gruppenListe = liste;
      setGruppenCache(liste);
      return liste;
    }).catch(function (e) {
      console.warn('Gruppen laden fehlgeschlagen:', e);
      gruppenLaeuft = null;
      return null;
    });
  }
  return gruppenLaeuft;
}

// Wählt Weiß oder Dunkelgrau, je nachdem, was auf der Farbe besser lesbar ist.
function schriftfarbeFuer(hex) {
  const kanal = function (i) {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const l = 0.2126 * kanal(0) + 0.7152 * kanal(1) + 0.0722 * kanal(2);
  const kontrastWeiss = 1.05 / (l + 0.05);
  const kontrastDunkel = (l + 0.05) / (0.0125 + 0.05);
  return kontrastWeiss >= kontrastDunkel ? '#ffffff' : '#1a1e20';
}

function setzeFarbe(farbe) {
  const root = document.documentElement;
  const f = String(farbe || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(f)) {
    root.style.setProperty('--gruppe', f);
    root.style.setProperty('--gruppe-text', schriftfarbeFuer(f));
  } else {
    root.style.removeProperty('--gruppe');
    root.style.removeProperty('--gruppe-text');
  }
}

// Lädt views/<reiter>.js. Gibt es die Datei noch nicht, kommt der Platzhalter.
async function ladeView(tab) {
  if (geladeneViews[tab]) return geladeneViews[tab];
  let modul;
  try {
    modul = await import('./views/' + tab + '.js');
  } catch (e) {
    modul = await import('./views/platzhalter.js');
  }
  geladeneViews[tab] = modul;
  return modul;
}

async function abmelden() {
  clearSession();
  await cacheLeeren();
  location.hash = '#/';
  route();
}

// Knopf „Abmelden“: Entwürfe von Protokollen und Reden werden mitgelöscht (geteilte Geräte), vorher Warnung.
// Läuft nur die Anmeldung ab (abmelden ohne Knopf), bleiben die Entwürfe.
async function abmeldenVonHand() {
  if (gibtEntwurf()) {
    if (!window.confirm('Auf diesem Gerät gibt es einen Entwurf (Protokoll, Rede oder Wiki-Seite), der noch nicht gespeichert ist.\n\n' +
      'Beim Abmelden wird er gelöscht. Trotzdem abmelden?')) return;
    loescheAlleEntwuerfe();
  }
  await abmelden();
}

async function nameAendern() {
  const n = await frageName(getName(), true);
  if (n) {
    setName(n);
    toast('Name gespeichert.');
    route();
  }
}

// true = Fehler wurde behandelt (z. B. Anmeldung abgelaufen)
function behandleFehler(e) {
  if (e && e.code === 'auth') {
    toast(e.message);
    abmelden();
    return true;
  }
  return false;
}

async function nameSicherstellen() {
  if (getName() || nameFrageOffen) return;
  nameFrageOffen = true;
  const n = await frageName('', false);
  setName(n);
  nameFrageOffen = false;
}

async function route() {
  const nummer = ++laufNummer;
  refreshFn = null;
  const container = document.getElementById('app');
  const teile = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);

  const ctx = {
    ladeGruppen: ladeGruppen,
    gruppenSofort: gruppenSofort,
    neuLaden: route,
    version: VERSION,
    abmelden: abmeldenVonHand,
    nameAendern: nameAendern,
    behandleFehler: behandleFehler,
    setzeRefresh: function (fn) { refreshFn = fn; }
  };

  // Impressum, Info, Datenschutz: ohne Login
  if (teile[0] === 'info') {
    setzeFarbe('');
    ctx.seite = teile[1] || 'info';
    infoView.render(container, ctx);
    return;
  }

  // Öffentliche Termine: ohne Login (wird erst bei Bedarf geladen)
  if (teile[0] === 'termine') {
    setzeFarbe('');
    try {
      const tm = await import('./views/termine.js');
      if (nummer !== laufNummer) return;
      await tm.render(container, ctx);
    } catch (e) {
      container.textContent = 'Die Termine konnten nicht geladen werden.';
    }
    return;
  }

  if (teile[0] === 'g' && teile[1]) {
    const finde = function (liste) {
      return liste && liste.find(function (x) { return x.kurzname === teile[1]; });
    };

    // Erst die gemerkte Liste nehmen (schnell), im Hintergrund auffrischen.
    let g = finde(gruppenSofort());
    if (g) {
      const alt = g;
      ladeGruppen().then(function (frisch) {
        const neu = finde(frisch);
        if (neu && nummer === laufNummer && neu.farbe !== alt.farbe) setzeFarbe(neu.farbe);
      });
    } else {
      g = finde(await ladeGruppen());
      if (nummer !== laufNummer) return;
    }

    if (!g) {
      setzeFarbe('');
      location.hash = '#/';
      return;
    }
    setzeFarbe(g.farbe);
    const s = getSession();
    if (!s || s.gruppe_id !== g.gruppe_id) {
      ctx.gruppe = g;
      loginView.render(container, ctx);
      return;
    }

    ctx.session = s;
    const erlaubt = sichtbareTabs().map(function (t) { return t.id; }).concat('mehr');
    // Seit 0.32.2 ersetzt das Wiki den Reiter Hilfe: alte Adressen …/hilfe öffnen das Wiki
    if (teile[2] === 'hilfe') teile[2] = 'wiki';
    ctx.tab = erlaubt.indexOf(teile[2]) >= 0 ? teile[2] : 'start';
    ctx.tabLabel = tabLabel(ctx.tab);
    // Unterpunkt, z. B. #/g/fff/projekte/<projekt-id>, #/g/fff/protokoll/rede:<id>, #/g/fff/team/<person-id> bzw. team/ich
    // oder #/g/fff/wiki/<seiten-id> bzw. wiki/anleitung:<datei>
    ctx.unter = ['projekte', 'protokoll', 'team', 'wiki'].indexOf(ctx.tab) >= 0 ? (teile[3] || '') : '';

    const geruest = baueGeruest(container, ctx);
    ctx.detail = geruest.detail;

    await nameSicherstellen();
    if (nummer !== laufNummer) return;

    const modul = await ladeView(ctx.tab);
    if (nummer !== laufNummer) return;
    try {
      await modul.render(geruest.inhalt, ctx);
    } catch (e) {
      if (!behandleFehler(e)) geruest.inhalt.textContent = 'Fehler: ' + e.message;
    }
    return;
  }

  setzeFarbe('');
  gruppenView.render(container, ctx);
}

function serviceWorkerAnmelden() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (e) {
      console.warn('Service Worker nicht angemeldet:', e);
    });
  }
}

// Offene Seiten laden regelmäßig neu (nur wenn sichtbar und online)
setInterval(function () {
  if (refreshFn && document.visibilityState === 'visible' && navigator.onLine) refreshFn();
}, REFRESH_SEKUNDEN * 1000);

window.addEventListener('hashchange', route);
route();
serviceWorkerAnmelden();
