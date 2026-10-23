// js/views/team.js
// Reiter „Team“ (Etappe 9, Schritt 9.2): alle Personen der Gruppe als Karten, nur zum Lesen.
// Je Karte: Name (Marke „Du“ bei der eigenen), Gruppen-Rollen als Chips (gewählte mit „gewählt“),
// Kapazität als Balken 1 bis 10 mit Satz und Gültigkeit, Notiz. Eigene Karte zuerst, dann A–Z,
// Pausierte als Aufklapper unten. Suche (Name, Rolle, Notiz) und Filter Rolle.
// Klick öffnet die Person im Detailbereich (PC rechts, Handy Vollbild): Rollen mit Beschreibung,
// Kapazität, Verlauf der letzten 6 Monate.
// Eintragen und Bearbeiten kommen mit 9.4, die Rollen-Liste bearbeiten mit 9.3.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { getName } from '../store.js';
import { istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import { datumText, heuteIso } from './todos-rechnen.js';
import {
  txt, istAktiv, rollenVon, sortiereRollen, kapazitaetText, angabeJetzt, angabeZustand, verlauf,
  sortierePersonen, passtSuche, passtRolle
} from './team-rechnen.js';

const HINWEIS_ROLLEN = 'Eine Gruppen-Rolle heißt nicht, dass du dich allein kümmern musst. Du kannst jederzeit Unterstützung bekommen.';

// Datum kurz: "20.11." (mit Jahr, wenn es nicht dieses Jahr ist)
function kurzDatum(iso, heute) {
  const d = datumText(iso);
  return String(iso).slice(0, 4) === String(heute).slice(0, 4) ? d.slice(0, 6) : d;
}

// Balken aus 10 Kästchen. grau = abgelaufen oder künftig.
function kapazitaetsBalken(wert, grau) {
  const n = Math.max(0, Math.min(10, Number(wert) || 0));
  const balken = el('span', {
    class: 'team-balken' + (grau ? ' team-balken-grau' : ''),
    role: 'img',
    'aria-label': 'Kapazität ' + n + ' von 10'
  });
  for (let i = 1; i <= 10; i++) {
    balken.append(el('span', { class: 'team-kaestchen' + (i <= n ? ' voll' : '') }));
  }
  return balken;
}

// Zeile(n) zur Kapazität für Karte und Detail
function kapazitaetZeigen(stand, heute) {
  const box = el('span', { class: 'team-kapazitaet' });
  const k = stand.angabe;
  if (stand.zustand === 'keine') {
    box.append(el('span', { class: 'leise', text: 'Noch keine Angabe zur Kapazität.' }));
    return box;
  }
  const grau = stand.zustand !== 'gilt';
  box.append(kapazitaetsBalken(k.kapazitaet, grau));
  let zeile = k.kapazitaet + ' · ' + kapazitaetText(k.kapazitaet);
  if (stand.zustand === 'gilt') zeile += ' · gilt bis ' + kurzDatum(k.gueltig_bis, heute);
  if (stand.zustand === 'abgelaufen') zeile = 'Abgelaufen seit ' + kurzDatum(k.gueltig_bis, heute) + ' (war ' + k.kapazitaet + ')';
  if (stand.zustand === 'kuenftig') zeile = 'Ab ' + kurzDatum(k.gueltig_ab, heute) + ': ' + k.kapazitaet + ' · ' + kapazitaetText(k.kapazitaet);
  box.append(el('span', { class: grau ? 'leise team-kap-text' : 'team-kap-text', text: zeile }));
  if (stand.naechste && stand.zustand !== 'kuenftig') {
    const n = stand.naechste;
    box.append(el('span', { class: 'leise team-kap-text', text: 'Ab ' + kurzDatum(n.gueltig_ab, heute) + ': ' + n.kapazitaet }));
  }
  return box;
}

function rollenChips(liste) {
  if (!liste.length) return null;
  return el('span', { class: 'team-rollen' }, ...liste.map(function (r) {
    const gew = istWahr(r.gewaehlt);
    return el('span', {
      class: 'team-rolle' + (gew ? ' team-rolle-gewaehlt' : ''),
      title: gew ? 'Fest gewählte Rolle' : txt(r.beschreibung),
      text: txt(r.name) + (gew ? ' · gewählt' : '')
    });
  }));
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);
  if (ctx.detail) schliesseDetail(ctx.detail);

  const cacheKey = s.gruppe_id + ':team';
  let daten = { personen: [], rollen: [], kapazitaet: [] };
  let meta = null;
  let offline = false;
  let offeneId = '';   // Person, die gerade im Detail steht

  const status = el('p', { class: 'leise', text: 'Lade Team …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen (Name, Rolle) …', 'aria-label': 'Team durchsuchen'
  });
  const rolleWahl = el('select', { class: 'feld', 'aria-label': 'Gruppen-Rolle' });
  const boxIch = el('div', { class: 'team-ich' });
  const boxListe = el('div', { class: 'team-raster' });
  const boxPause = el('div');

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Team' })),
    el('div', { class: 'filterzeile team-filter' }, suche, rolleWahl),
    status,
    boxIch,
    boxListe,
    boxPause
  ));

  function findePerson(id) {
    return daten.personen.find(function (p) { return String(p.id) === String(id); }) || null;
  }

  function rollenAufbauen() {
    const alt = rolleWahl.value;
    leeren(rolleWahl);
    rolleWahl.append(el('option', { value: '', text: 'Alle Rollen' }));
    // Nur Rollen, die mindestens eine Person hat
    const benutzt = sortiereRollen(daten.rollen).filter(function (r) {
      return daten.personen.some(function (p) { return passtRolle(p, r.id); });
    });
    benutzt.forEach(function (r) { rolleWahl.append(el('option', { value: String(r.id), text: txt(r.name) })); });
    rolleWahl.value = benutzt.some(function (r) { return String(r.id) === alt; }) ? alt : '';
    // .feld setzt display: block, darum hier direkt ausblenden (hidden allein reicht nicht)
    rolleWahl.style.display = benutzt.length ? '' : 'none';
  }

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    const n = daten.personen.length;
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? n + (n === 1 ? ' Person' : ' Personen') + ' im Team · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  function karte(p, heute, ich) {
    const stand = angabeJetzt(p.id, daten.kapazitaet, heute);
    const kopf = el('span', { class: 'team-name' }, el('strong', { text: txt(p.name) || '(ohne Namen)' }));
    if (ich) kopf.append(el('span', { class: 'team-marke team-marke-du', text: 'Du' }));
    if (!istAktiv(p)) kopf.append(el('span', { class: 'team-marke', text: 'Pause' }));
    return el('button', {
      class: 'karte team-karte' + (ich ? ' team-karte-ich' : '') + (String(p.id) === offeneId ? ' aktiv' : ''),
      type: 'button',
      onclick: function () { oeffne(p); }
    },
      kopf,
      rollenChips(rollenVon(p, daten.rollen)),
      kapazitaetZeigen(stand, heute),
      txt(p.notiz) ? el('span', { class: 'leise team-notiz', text: txt(p.notiz) }) : null
    );
  }

  function zeichne() {
    statusZeigen();
    const heute = heuteIso();
    const name = getName();
    const q = suche.value;
    const r = rolleWahl.value;
    const passt = function (p) { return passtSuche(p, daten.rollen, q) && passtRolle(p, r); };
    const sortiert = sortierePersonen(daten.personen, name);

    leeren(boxIch);
    leeren(boxListe);
    leeren(boxPause);

    if (!daten.personen.length) {
      boxIch.append(el('div', { class: 'karte leer-karte' },
        el('p', { text: 'Noch niemand im Team.' }),
        el('p', { class: 'leise', text: 'Mit dem nächsten Update kann sich jede Person selbst eintragen, ihre Gruppen-Rollen wählen und sagen, wie viel Zeit sie gerade hat.' })
      ));
      return;
    }

    if (!sortiert.ich) {
      boxIch.append(el('div', { class: 'karte team-hinweis' },
        el('p', { text: name ? 'Du (' + name + ') bist noch nicht im Team.' : 'Du bist noch nicht im Team.' }),
        el('p', { class: 'leise', text: 'Eintragen geht mit dem nächsten Update.' })
      ));
    }

    const liste = (sortiert.ich && istAktiv(sortiert.ich) ? [sortiert.ich] : []).concat(sortiert.aktive).filter(passt);
    liste.forEach(function (p) { boxListe.append(karte(p, heute, p === sortiert.ich)); });

    const pause = (sortiert.ich && !istAktiv(sortiert.ich) ? [sortiert.ich] : []).concat(sortiert.pausiert).filter(passt);
    if (pause.length) {
      const auf = el('details', { class: 'team-pausiert' },
        el('summary', { text: 'Pausiert (' + pause.length + ')' }));
      const raster = el('div', { class: 'team-raster' });
      pause.forEach(function (p) { raster.append(karte(p, heute, p === sortiert.ich)); });
      auf.append(raster);
      boxPause.append(auf);
    }

    if (!liste.length && !pause.length) {
      boxListe.append(el('p', { class: 'leise', text: 'Niemand passt zur Suche.' }));
    }
  }

  // ---- Detail ----

  // aktualisieren = true: nach dem Neuladen, Scrollstand im Detail bleibt
  function oeffne(p, aktualisieren) {
    offeneId = String(p.id);
    const heute = heuteIso();
    const stand = angabeJetzt(p.id, daten.kapazitaet, heute);
    const rollen = rollenVon(p, daten.rollen);
    const inhalt = el('div', { class: 'team-detail' });

    const marken = el('p', { class: 'team-name' });
    if (getName() && txt(p.name).toLowerCase() === getName().toLowerCase()) {
      marken.append(el('span', { class: 'team-marke team-marke-du', text: 'Du' }));
    }
    marken.append(el('span', { class: 'team-marke', text: istAktiv(p) ? 'Dabei' : 'Pause' }));
    inhalt.append(marken);

    inhalt.append(el('h3', { text: 'Gruppen-Rollen' }));
    if (rollen.length) {
      inhalt.append(el('ul', { class: 'team-rollen-liste' }, ...rollen.map(function (r) {
        return el('li', null,
          el('strong', { text: txt(r.name) }),
          istWahr(r.gewaehlt) ? el('span', { class: 'team-marke', text: 'gewählt' }) : null,
          txt(r.beschreibung) ? el('span', { class: 'leise', text: ' – ' + txt(r.beschreibung) }) : null
        );
      })));
      inhalt.append(el('p', { class: 'leise', text: HINWEIS_ROLLEN }));
    } else {
      inhalt.append(el('p', { class: 'leise', text: 'Keine Gruppen-Rollen.' }));
    }

    inhalt.append(el('h3', { text: 'Kapazität' }), kapazitaetZeigen(stand, heute));

    const liste = verlauf(p.id, daten.kapazitaet, heute);
    if (liste.length) {
      const gueltig = stand.zustand === 'gilt' ? stand.angabe.id : '';
      const zustandText = { gilt: 'gilt jetzt', ueberholt: 'von neuerer Angabe ersetzt', kuenftig: 'kommt noch', abgelaufen: 'abgelaufen' };
      inhalt.append(el('h3', { text: 'Verlauf (letzte 6 Monate)' }), el('ul', { class: 'team-verlauf' },
        ...liste.map(function (k) {
          const z = angabeZustand(k, gueltig, heute);
          return el('li', { class: 'team-verlauf-' + z },
            el('strong', { text: String(k.kapazitaet) }),
            el('span', { text: ' · ' + datumText(k.gueltig_ab) + ' bis ' + datumText(k.gueltig_bis) + ' · ' + zustandText[z] }),
            txt(k.notiz) ? el('span', { class: 'leise team-verlauf-notiz', text: txt(k.notiz) }) : null
          );
        })));
    }

    if (txt(p.notiz)) inhalt.append(el('h3', { text: 'Notiz' }), el('p', { text: txt(p.notiz) }));

    const seit = datumText(txt(p.erstellt_am).slice(0, 10));
    inhalt.append(el('p', { class: 'leise', text: 'Im Team seit ' + seit + (txt(p.erstellt_von) ? ', eingetragen von ' + txt(p.erstellt_von) : '') + '.' }));

    zeigeDetail(ctx.detail, txt(p.name) || 'Person', inhalt, function () { offeneId = ''; zeichne(); }, !aktualisieren);
    if (!aktualisieren) zeichne();
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    ['personen', 'rollen', 'kapazitaet'].forEach(function (k) { if (!neu[k]) neu[k] = []; });
    daten = neu;
    meta = m;
    offline = false;
    rollenAufbauen();
    zeichne();
    // Offenes Detail mit dem neuen Stand zeigen (oder schließen, wenn die Person weg ist)
    if (offeneId) {
      const p = findePerson(offeneId);
      if (p) oeffne(p, true);
      else { offeneId = ''; schliesseDetail(ctx.detail); }
    }
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        cacheKey,
        async function () {
          const r = await api('listMehrere', { tabellen: ['Personen', 'Gruppen_Rollen', 'Kapazitaet'] }, s.token);
          const t = (r && r.tabellen) || {};
          return { personen: t.Personen || [], rollen: t.Gruppen_Rollen || [], kapazitaet: t.Kapazitaet || [] };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) { offline = true; statusZeigen(); }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Das Team konnte nicht geladen werden: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  rolleWahl.addEventListener('change', zeichne);
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}
