// js/views/team.js
// Reiter „Team“ (Etappe 9, Schritt 9.2): alle Personen der Gruppe als Karten, nur zum Lesen.
// Je Karte: Name (Marke „Du“ bei der eigenen), Gruppen-Rollen als Chips (gewählte mit „gewählt“),
// Kapazität als Balken 1 bis 10 mit Satz und Gültigkeit, Notiz. Eigene Karte zuerst, dann A–Z,
// Pausierte als Aufklapper unten. Suche (Name, Rolle, Notiz) und Filter Rolle.
// Klick öffnet die Person im Detailbereich (PC rechts, Handy Vollbild): Rollen mit Beschreibung,
// Kapazität, Verlauf der letzten 6 Monate.
// Seit 9.3: Aufklapper „Gruppen-Rollen“ unten zum Bearbeiten der Rollen-Liste (js/views/team-rollen.js).
// Seit 9.4: „Mich eintragen“, „Für jemanden eintragen“ (klein unten), „Bearbeiten“ im Detail
// (js/views/team-eintrag.js). Hat jemand den Anzeigenamen geändert und gibt es eine Karte mit dem vorigen
// Namen, fragt der Reiter, ob die Karte mit umbenannt werden soll.
// Seit 9.5: Hüte je Person (offene ToDos, Meilensteine, Mobi-Beiträge mit dem Namen; Karte „5 Hüte · 2 Projekte“,
// Liste im Detail), Abschnitt „Freie Hüte“ oben mit „Hut übernehmen“ (todos-hut.js), „Namen ohne Team-Karte“ unten.
// Seit 9.6: Diagramm „Berg“ oben (js/views/team-berg.js), dafür werden auch die Veranstaltungen geladen.
// Seit 9.7: Adressen #/g/<kurz>/team/<person-id> (öffnet die Karte) und team/ich (eigene Karte zum Bearbeiten,
// vom Start). Die geladenen Personen, Rollen und Kapazitäten gehen an team-namen.js (Vorschläge in anderen Reitern).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { getName, setName, getNameVorher, loescheNameVorher } from '../store.js';
import { frageName } from '../ui/modal.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import { datumText, heuteIso, kurz, normDatum } from './todos-rechnen.js';
import { huetKnoepfe } from './todos-hut.js';
import { oeffneMobiAnsicht } from './mobi-todo.js';
import {
  txt, istAktiv, rollenVon, sortiereRollen, kapazitaetText, angabeJetzt, angabeZustand, verlauf,
  sortierePersonen, passtSuche, passtRolle, istIch, darfBearbeiten, fuerJemandenEingetragen,
  alleHuete, hueteVon, projekteAus, faelligKlasse, namenOhneKarte, freieHuete, bergDaten
} from './team-rechnen.js';
import { baueBerg } from './team-berg.js';
import { setzeTeamKlein } from './team-namen.js';
import { zeigeEintrag, umbenennen } from './team-eintrag.js';
import { baueRollen, HINWEIS_ROLLEN } from './team-rollen.js';

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
  let daten = { personen: [], rollen: [], kapazitaet: [], todos: [], meilensteine: [], mobi: [], projekte: [], veranstaltungen: [] };
  let bergWoche = -1;   // im Berg gewählte Woche (bleibt beim Neuladen)
  let huete = [];       // alle offenen Hüte mit Verantwortlichen (alleHuete), nach jedem Laden neu
  let freiAlle = false; // Freie Hüte ganz zeigen (9.5a: sonst nur die ersten 5)
  let meta = null;
  let offline = false;
  let offeneId = '';   // Person, die gerade im Detail steht
  let offenModus = '';  // 'lesen' oder 'bearbeiten' (beim Bearbeiten baut das Neuladen das Detail nicht neu auf)

  const status = el('p', { class: 'leise', text: 'Lade Team …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen (Name, Rolle) …', 'aria-label': 'Team durchsuchen'
  });
  const rolleWahl = el('select', { class: 'feld', 'aria-label': 'Gruppen-Rolle' });
  const boxIch = el('div', { class: 'team-ich' });
  const boxBerg = el('div');
  const boxFrei = el('div');
  const boxOhne = el('div');
  const basis = '#/g/' + encodeURIComponent(s.kurzname) + '/';
  const boxListe = el('div', { class: 'team-raster' });
  const boxPause = el('div');
  const fuerAndere = el('div', { class: 'team-fuer-andere' },
    el('button', {
      class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Für jemanden eintragen',
      onclick: fuerJemanden
    }),
    el('span', { class: 'leise', text: 'Zum Beispiel für eine Person ohne Handy. Bist du selbst im Team, dürfen alle die Karte bearbeiten.' })
  );
  const rollenTeil = baueRollen({
    ctx: ctx, token: s.token, kurzname: s.kurzname,
    daten: function () { return daten; },
    neuLaden: function () { return laden(false); }
  });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Team' })),
    el('div', { class: 'filterzeile team-filter' }, suche, rolleWahl),
    status,
    boxIch,
    boxBerg,
    boxFrei,
    boxListe,
    boxPause,
    boxOhne,
    fuerAndere,
    rollenTeil.el,
    el('p', { class: 'team-hilfe-link' }, el('a', { href: basis + 'hilfe', text: 'Wie funktioniert der Reiter Team? → Hilfe' }))
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
      hueteZeile(p),
      txt(p.notiz) ? el('span', { class: 'leise team-notiz', text: txt(p.notiz) }) : null
    );
  }

  // "5 Hüte · 2 Projekte"
  function hueteZeile(p) {
    const h = hueteVon(p.name, huete);
    if (!h.length) return el('span', { class: 'leise team-huete-zahl', text: 'Keine Hüte' });
    const n = projekteAus(h).length;
    return el('span', { class: 'team-huete-zahl', text: '🎩 ' + h.length + (h.length === 1 ? ' Hut' : ' Hüte') +
      (n ? ' · ' + n + (n === 1 ? ' Projekt' : ' Projekte') : '') });
  }

  function projektTitel(id) {
    const pr = daten.projekte.find(function (x) { return String(x.id) === String(id); });
    return pr ? txt(pr.titel) : '';
  }

  // Ein Hut als Zeile mit Link (ToDo ohne Projekt: Reiter ToDos; mit Projekt und Meilenstein: das Projekt;
  // Mobi-Beitrag: Reiter Mobi, gefiltert auf das Projekt)
  const FREI_ANFANG = 3;   // 9.6a: Wunsch der Person (vorher 5)
  const ART_SYMBOL = { todo: '✅', meilenstein: '🏁', mobi: '📣' };
  function hutZeile(h, heute) {
    const fk = faelligKlasse(h.datum, heute);
    const info = [h.projekt_id ? projektTitel(h.projekt_id) : (h.art === 'mobi' ? 'Veranstaltung' : 'Allgemein'),
      h.datum ? 'Fällig ' + datumText(h.datum) + (fk === 'ueberfaellig' ? ' (überfällig)' : fk === 'heute' ? ' (heute)' : '') : '']
      .filter(Boolean).join(' · ');
    const a = el('a', { class: 'team-hut' + (fk ? ' ' + fk : ''), href: h.art === 'todo' && !h.projekt_id ? basis + 'todos' : basis + 'projekte/' + encodeURIComponent(h.projekt_id) },
      el('span', { class: 'team-hut-titel', text: ART_SYMBOL[h.art] + ' ' + kurz(h.titel, 80) }),
      el('span', { class: 'leise', text: info })
    );
    if (h.art === 'mobi') {
      a.setAttribute('href', basis + 'mobi');
      a.addEventListener('click', function (ev) { ev.preventDefault(); oeffneMobiAnsicht(ctx, h.projekt_id, 'liste'); });
    }
    return el('li', null, a);
  }

  // Abschnitt "Freie Hüte" oben: offene ToDos ohne Verantwortliche. Die ersten 3, der Rest über
  // „▸ Alle anzeigen“ (9.5a, Wunsch der Person; seit 9.6a die ersten 3)
  function zeichneFrei(heute) {
    leeren(boxFrei);
    const frei = freieHuete(daten.todos, daten.projekte);
    if (!frei.length) return;
    const namen = function () {
      const l = daten.personen.filter(istAktiv).map(function (p) { return txt(p.name); });
      if (getName() && l.indexOf(getName()) < 0) l.push(getName());
      return l.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    };
    boxFrei.append(el('section', { class: 'karte team-frei' },
      el('h2', { text: '🎩 Freie Hüte (' + frei.length + ')' }),
      el('p', { class: 'leise', text: 'Aufgaben, für die noch jemand gesucht wird.' }),
      el('ul', { class: 'team-hut-liste' }, ...frei.slice(0, freiAlle ? frei.length : FREI_ANFANG).map(function (t) {
        const li = hutZeile({ art: 'todo', titel: txt(t.text), datum: normDatum(t.faellig_am), projekt_id: txt(t.projekt_id) }, heute);
        li.append(huetKnoepfe({
          ctx: ctx, token: s.token, t: t, personen: namen,
          fertig: function () { huete = alleHuete(daten); zeichne(); if (offeneId && offenModus === 'lesen') { const p = findePerson(offeneId); if (p) oeffne(p, true); } }
        }));
        return li;
      })),
      frei.length > FREI_ANFANG ? el('button', {
        class: 'dash-schalter', type: 'button', 'aria-expanded': String(freiAlle),
        onclick: function () { freiAlle = !freiAlle; zeichneFrei(heuteIso()); }
      },
        el('span', { class: 'teil-pfeil' + (freiAlle ? ' auf' : ''), 'aria-hidden': 'true', text: '▸' }),
        el('span', { text: freiAlle ? 'Weniger anzeigen' : 'Alle anzeigen (' + frei.length + ')' })
      ) : null,
      el('a', { class: 'knopf knopf-hell', href: basis + 'todos', text: 'Alle im Reiter ToDos →' })
    ));
  }

  // Berg (9.6): am PC 2 Wochen zurück und 10 voraus, am Handy 1 zurück und 6 voraus
  function zeichneBerg(heute) {
    leeren(boxBerg);
    if (!daten.personen.length) return;
    const handy = window.matchMedia('(max-width: 599px)').matches;
    const berg = bergDaten(Object.assign({}, daten, { huete: alleHuete(daten, true) }), heute, handy ? 1 : 2, handy ? 6 : 10);
    const box = el('section', { class: 'karte team-berg-karte' }, el('h2', { text: '⛰️ Berg: Kraft der Gruppe' }));
    if (berg.mitWert < 2) {
      box.append(el('p', { class: 'leise', text: 'Der Berg erscheint, sobald mindestens zwei Personen ihre Kapazität eingetragen haben.' }));
    } else {
      box.append(
        el('p', { class: 'leise', text: 'Jede Schicht ist eine Person, so dick wie ihre Kapazität. Die Höhe ist die Kraft der ganzen Gruppe. Tippe auf eine Woche für die Zahlen.' }),
        baueBerg(berg, { handy: handy, heute: heute, gewaehlt: bergWoche, beiWahl: function (i) { bergWoche = i; } }),
        el('p', { class: 'leise', text: 'Berg aus ' + berg.mitWert + ' von ' + berg.aktive + (berg.aktive === 1 ? ' Person' : ' Personen') +
          '. Abgelaufene Angaben und Pausierte zählen nicht.' })
      );
    }
    boxBerg.append(box);
  }

  // Unten: Namen, die in Hüten stehen, aber keine Team-Karte haben (zum Beispiel Tippfehler)
  function zeichneOhne() {
    leeren(boxOhne);
    const ohne = namenOhneKarte(daten.personen, huete);
    if (!ohne.length) return;
    boxOhne.append(el('p', { class: 'leise team-ohne' },
      el('strong', { text: 'Namen in Hüten ohne Team-Karte: ' }),
      el('span', { text: ohne.map(function (o) { return o.name + ' (' + o.zahl + ')'; }).join(', ') })
    ));
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
    zeichneBerg(heute);
    zeichneFrei(heute);
    zeichneOhne();

    if (!daten.personen.length) {
      boxIch.append(el('div', { class: 'karte leer-karte' },
        el('p', { text: 'Noch niemand im Team.' }),
        el('p', { class: 'leise', text: 'Trag dich ein, wähle deine Gruppen-Rollen und sag, wie viel Zeit du gerade hast. Alle in der Gruppe sehen die Angaben.' }),
        el('div', { class: 'form-knoepfe' }, el('button', { class: 'knopf', type: 'button', text: 'Mich eintragen', onclick: michEintragen }))
      ));
      return;
    }

    if (!sortiert.ich) boxIch.append(hinweisOhneKarte(name));

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
    offenModus = 'lesen';
    const heute = heuteIso();
    const stand = angabeJetzt(p.id, daten.kapazitaet, heute);
    const rollen = rollenVon(p, daten.rollen);
    const inhalt = el('div', { class: 'team-detail' });

    const marken = el('p', { class: 'team-name' });
    if (getName() && txt(p.name).toLowerCase() === getName().toLowerCase()) {
      marken.append(el('span', { class: 'team-marke team-marke-du', text: 'Du' }));
    }
    marken.append(el('span', { class: 'team-marke', text: istAktiv(p) ? 'Dabei' : 'Pause' }));
    if (fuerJemandenEingetragen(p, daten.personen)) {
      marken.append(el('span', { class: 'team-marke', text: 'eingetragen von ' + txt(p.erstellt_von) }));
    }
    inhalt.append(marken);
    if (darfBearbeiten(p, getName(), daten.personen)) {
      inhalt.append(el('div', { class: 'form-knoepfe team-detail-knoepfe' },
        el('button', {
          class: 'knopf', type: 'button',
          text: istIch(p, getName()) ? 'Bearbeiten und Kapazität eintragen' : 'Bearbeiten',
          onclick: function () { bearbeite(p); }
        })));
    }

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

    const ph = hueteVon(p.name, huete);
    inhalt.append(el('h3', { text: 'Hüte (' + ph.length + ')' }));
    if (ph.length) inhalt.append(el('ul', { class: 'team-hut-liste' }, ...ph.map(function (h) { return hutZeile(h, heute); })));
    else inhalt.append(el('p', { class: 'leise', text: 'Keine offenen Aufgaben mit diesem Namen.' }));

    if (txt(p.notiz)) inhalt.append(el('h3', { text: 'Notiz' }), el('p', { text: txt(p.notiz) }));

    const seit = datumText(txt(p.erstellt_am).slice(0, 10));
    inhalt.append(el('p', { class: 'leise', text: 'Im Team seit ' + seit + (txt(p.erstellt_von) ? ', eingetragen von ' + txt(p.erstellt_von) : '') + '.' }));

    zeigeDetail(ctx.detail, txt(p.name) || 'Person', inhalt, function () { offeneId = ''; offenModus = ''; zeichne(); }, !aktualisieren);
    if (!aktualisieren) zeichne();
  }

  // ---- Bearbeiten (9.4) ----

  function bearbeite(p) {
    offeneId = String(p.id);
    offenModus = 'bearbeiten';
    zeigeEintrag({
      ctx: ctx, token: s.token, person: p,
      daten: function () { return daten; },
      beiZu: function () { offeneId = ''; offenModus = ''; zeichne(); },
      fertig: async function (id, modus) {
        await laden(false);
        const neu = findePerson(id);
        if (!neu || modus === 'weg') { offeneId = ''; offenModus = ''; schliesseDetail(ctx.detail); zeichne(); return; }
        if (modus === 'bearbeiten') bearbeite(neu); else oeffne(neu);
      }
    });
    zeichne();
  }

  // Neue Karte anlegen und gleich zum Bearbeiten öffnen
  async function karteAnlegen(n) {
    try {
      const neu = await api('create', { tabelle: 'Personen', daten: { name: n, aktiv: true, rollen: '', notiz: '' } }, s.token);
      toast('„' + n + '“ ist jetzt im Team.');
      await laden(false);
      const p = findePerson(neu && neu.id);
      if (p) bearbeite(p);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.code === 'netz' ? 'Keine Verbindung. Eintragen geht nur mit Verbindung.' : e.message);
    }
  }

  async function michEintragen() {
    let n = getName();
    if (!n) {
      n = await frageName('', true);
      if (!n) return;
      setName(n);
    }
    await karteAnlegen(n);
  }

  function fuerJemanden() {
    let fenster = null;
    const form = baueFormular(
      [{ name: 'name', label: 'Name der Person', typ: 'text', pflicht: true }],
      {},
      {
        speichernText: 'Eintragen',
        onSpeichern: async function (d) {
          const n = txt(d.name);
          if (n.length < 2 || n.length > 60) throw new Error('Bitte einen Namen mit 2 bis 60 Zeichen.');
          fenster.schliessen();
          await karteAnlegen(n);
        },
        onAbbrechen: function () { fenster.schliessen(); }
      }
    );
    fenster = zeigeFenster('Für jemanden eintragen', el('div', null,
      el('p', { class: 'leise', text: 'Nimm den Namen, den die Person in der App benutzt (zum Beispiel in ToDos). Bist du selbst im Team, dürfen alle die Karte bearbeiten.' }),
      form));
    const f = form.querySelector('[name="name"]');
    if (f) f.focus();
  }

  // Kasten oben, wenn es zum Anzeigenamen keine Karte gibt. Gibt es eine Karte mit dem vorigen Namen
  // (Name auf diesem Gerät geändert), wird Umbenennen angeboten.
  function hinweisOhneKarte(name) {
    const vorher = getNameVorher();
    const alt = vorher && name ? daten.personen.find(function (p) { return istIch(p, vorher); }) : null;
    if (alt) {
      return el('div', { class: 'karte team-hinweis' },
        el('p', { text: 'Deine Team-Karte heißt noch „' + txt(alt.name) + '“. Auf „' + name + '“ umbenennen?' }),
        el('p', { class: 'leise', text: 'Der Name wird auch in ToDos, Meilensteinen, Mobi-Beiträgen und Umfrage-Antworten geändert.' }),
        el('div', { class: 'form-knoepfe' },
          el('button', {
            class: 'knopf', type: 'button', text: 'Umbenennen',
            onclick: async function (ev) {
              ev.target.disabled = true;
              try {
                toast(await umbenennen({ ctx: ctx, token: s.token }, alt, name));
                loescheNameVorher();
                await laden(false);
              } catch (e) {
                if (ctx.behandleFehler(e)) return;
                toast(e.message);
                ev.target.disabled = false;
              }
            }
          }),
          el('button', {
            class: 'knopf knopf-hell', type: 'button', text: 'Nein, das bin nicht ich',
            onclick: function () { loescheNameVorher(); zeichne(); }
          })
        ));
    }
    return el('div', { class: 'karte team-hinweis' },
      el('p', { text: name ? 'Du (' + name + ') bist noch nicht im Team.' : 'Du bist noch nicht im Team.' }),
      el('div', { class: 'form-knoepfe' }, el('button', { class: 'knopf', type: 'button', text: 'Mich eintragen', onclick: michEintragen }))
    );
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    ['personen', 'rollen', 'kapazitaet', 'todos', 'meilensteine', 'mobi', 'projekte', 'veranstaltungen'].forEach(function (k) { if (!neu[k]) neu[k] = []; });
    daten = neu;
    huete = alleHuete(daten);
    setzeTeamKlein(s.gruppe_id, daten);
    meta = m;
    offline = false;
    rollenAufbauen();
    zeichne();
    rollenTeil.zeichne();
    // Offenes Detail mit dem neuen Stand zeigen (oder schließen, wenn die Person weg ist)
    // Beim Bearbeiten bleibt das Formular stehen (Eingaben gehen nicht verloren)
    if (offeneId) {
      const p = findePerson(offeneId);
      if (!p) { offeneId = ''; offenModus = ''; schliesseDetail(ctx.detail); }
      else if (offenModus !== 'bearbeiten') oeffne(p, true);
    }
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        cacheKey,
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Personen', 'Gruppen_Rollen', 'Kapazitaet', 'ToDos', 'Meilensteine', 'Mobi_Plan', 'Projekte', 'Veranstaltungen']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            personen: t.Personen || [], rollen: t.Gruppen_Rollen || [], kapazitaet: t.Kapazitaet || [],
            todos: t.ToDos || [], meilensteine: t.Meilensteine || [], mobi: t.Mobi_Plan || [], projekte: t.Projekte || [],
            veranstaltungen: t.Veranstaltungen || []
          };
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

  // Unterpunkt aus der Adresse (9.7): team/ich = eigene Karte bearbeiten, team/<id> = Karte öffnen.
  // Danach steht wieder #/g/<kurz>/team in der Adresszeile.
  if (ctx.unter) {
    const ziel = ctx.unter === 'ich'
      ? daten.personen.find(function (p) { return istIch(p, getName()); })
      : findePerson(ctx.unter);
    try { history.replaceState(history.state, '', '#/g/' + encodeURIComponent(s.kurzname) + '/team'); } catch (e) { /* ignorieren */ }
    if (ziel && ctx.unter === 'ich') bearbeite(ziel);
    else if (ziel) oeffne(ziel);
    else if (ctx.unter !== 'ich') toast('Diese Person ist nicht mehr im Team.');
  }
}
