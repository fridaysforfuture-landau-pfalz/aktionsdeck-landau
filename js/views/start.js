// js/views/start.js
// Start-Reiter: Dashboard. Kachel Projekte zeigt die laufenden Projekte (Aktiv zuerst, dann Planung)
// mit Fortschrittsbalken (Klick = ins Projekt) und je Projekt einen Schalter "ToDos (n offen)".
// Kachel ToDos zeigt die offenen, allgemeinen ToDos (ohne Projekt und Post).
// Erledigte (nur die der letzten 2 Wochen) per Schalter oben rechts. ToDos haben ein Kästchen zum Abhaken.
// Die anderen Kacheln sind noch Platzhalter (Posts/Kalender Etappe 5).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { gruppenLogo } from '../ui/logo.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { toast } from '../ui/toast.js';
import { baueKommentare } from '../ui/kommentare.js';
import { zeichneUmfragen, zeichneArchiv, neueUmfrage, anzahlBeendet } from './start-umfragen.js';
import {
  zeichneBrett, neueMitteilung, mitteilungAus, zeichneBrettArchiv,
  findeMitteilung, anzahlNichtAngeheftet
} from './start-brett.js';
import { getName, setLetzterBesuch } from '../store.js';
import { holeNeu, zeigeNeu } from '../ui/neu-seit.js';
import { istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import { abhakWerte, abhakenSpeichern } from './todos-abhaken.js';
import { istOffenerHut, huetKnoepfe } from './todos-hut.js';
import {
  kurz, faelligStatus, faelligText, prioText, sortieren, sortiereErledigte,
  istAllgemein, istArchiv, zahlenText
} from './todos-rechnen.js';
import {
  istAbgeschlossen, fortschritt, fortschrittText, sortiereProjekte, terminText
} from './projekt-rechnen.js';

const MAX_OFFEN = 10;
const MAX_ERLEDIGT = 10;
const MAX_PROJEKTE = 6;

// Welche Projekte in der Kachel aufgeklappt sind (bleibt beim Reiterwechsel erhalten)
const projektOffen = {};

// Das Fenster "Was ist neu?" öffnet sich nur einmal pro Seitenaufruf von selbst
let neuAutoGezeigt = false;

const KACHELN = [
  { titel: 'Projekte', projekte: true },
  { titel: 'ToDos', todos: true }
];

// Planung = Vorbereitung (auch wenn der Status leer ist)
function istPlanung(p) {
  return (String(p.status || '').trim() || 'planung') === 'planung';
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  const basis = '#/g/' + encodeURIComponent(s.kurzname) + '/';
  const todosLink = basis + 'todos';
  const projekteLink = basis + 'projekte';
  const cacheKey = s.gruppe_id + ':todos';
  let letzte = null;        // { daten, meta } der ToDos
  let projektDaten = null;  // { projekte }
  let projektFehler = '';
  let extraDaten = null;    // { umfragen, antworten, mitteilungen }
  let extraJson = '';
  let offline = false;
  const arbeitet = {};

  const zahlen = el('p', { class: 'dash-zahlen', text: 'Lade ToDos …' });
  const erledigteCb = el('input', { type: 'checkbox' });
  const filter = el('label', { class: 'formfeld-bool' },
    erledigteCb, el('span', { text: 'Erledigte anzeigen' }));
  const liste = el('ul', { class: 'dash-todo-liste' });
  const fuss = el('p', { class: 'leise' });

  const todoKachel = el('section', { class: 'karte dash-kachel dash-todos' },
    el('div', { class: 'dash-kachel-kopf' },
      el('div', { class: 'dash-kachel-titel' },
        el('h2', { text: 'ToDos' }),
        el('a', { class: 'knopf knopf-hell', href: todosLink, text: 'Alle ToDos →' })
      ),
      filter
    ),
    zahlen,
    liste
  );

  const projektListe = el('div', { class: 'dash-projekt-liste' },
    el('p', { class: 'leise', text: 'Lade Projekte …' }));
  const projektKachel = el('section', { class: 'karte dash-kachel dash-projekte' },
    el('div', { class: 'dash-kachel-titel' },
      el('h2', { text: 'Projekte' }),
      el('a', { class: 'knopf knopf-hell', href: projekteLink, text: 'Alle Projekte →' })
    ),
    projektListe
  );

  const umfrageBox = el('div');
  const brettBox = el('div');
  const extraRaster = el('div', { class: 'dash-raster start-extra' }, umfrageBox, brettBox);
  extraRaster.hidden = true;   // erst sichtbar, wenn es Umfragen oder Mitteilungen gibt

  const archivUmfragen = el('div');
  const archivMitteilungen = el('div');
  const archivListe = el('div', { class: 'archiv-zwei' },
    el('div', null,
      el('h2', { class: 'liste-titel', text: 'Beendete Umfragen' }),
      archivUmfragen
    ),
    el('div', null,
      el('h2', { class: 'liste-titel', text: 'Nicht angeheftete Mitteilungen' }),
      archivMitteilungen
    )
  );
  const archivBox = el('div', null,
    el('div', { class: 'kopfzeile' },
      el('h2', { text: 'Archiv' }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: '← Zurück zum Start',
        onclick: function () { archivSchalten(false); }
      })
    ),
    archivListe
  );
  archivBox.hidden = true;

  const archivKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Archiv',
    onclick: function () { archivSchalten(true); }
  });
  archivKnopf.hidden = true;
  let neuStand = null;   // { items, stand }
  const neuZahl = el('sup', { class: 'glocke-zahl' });
  const neuKnopf = el('button', {
    class: 'knopf knopf-hell glocke', type: 'button',
    'aria-label': 'Was ist neu?', title: 'Was ist neu?',
    onclick: function () { neuOeffnen(); }
  }, el('span', { 'aria-hidden': 'true', text: '🔔' }), neuZahl);
  neuKnopf.hidden = true;
  const kopfKnoepfe = el('div', { class: 'kopf-knoepfe' },
    el('button', {
      class: 'knopf knopf-hell', type: 'button', text: '+ Umfrage',
      onclick: function () { neueUmfrage(extraOpt()); }
    }),
    el('button', {
      class: 'knopf knopf-hell', type: 'button', text: '+ Mitteilung',
      onclick: function () { neueMitteilung(extraOpt()); }
    }),
    archivKnopf,
    neuKnopf
  );
  const pinnwand = baueKommentare({
    ctx: ctx,
    token: s.token,
    art: 'pinnwand',
    bezugId: '',
    projektId: '',
    titel: 'Pinnwand',
    platzhalter: 'Notiz oder Kommentar für die Gruppe …',
    leerText: 'Noch nichts angepinnt.',
    neuesteZuerst: true,
    alsMitteilung: function (k) {
      const t = String(k.text || '').trim();
      const opt = extraOpt();
      const da = findeMitteilung(opt.mitteilungen, t);
      if (da) {
        const frage = istWahr(da.angeheftet)
          ? 'Dazu gibt es schon eine angeheftete Mitteilung:\n\n„' + String(da.titel || '') + '“\n\n' +
            'Trotzdem eine neue anlegen?'
          : 'Dazu gibt es schon eine Mitteilung, die nicht angeheftet ist:\n\n„' + String(da.titel || '') + '“\n\n' +
            'Du findest sie im Archiv (Suche) und kannst sie dort anheften. Trotzdem eine neue anlegen?';
        if (!window.confirm(frage)) return;
      } else if (istWahr(k.angeheftet)) {
        const frage = 'Aus diesem Kommentar wurde schon einmal eine Mitteilung gemacht ' +
          '(sie wurde inzwischen geändert oder gelöscht).\n\nTrotzdem eine neue anlegen?';
        if (!window.confirm(frage)) return;
      }
      mitteilungAus(opt, t.replace(/\s+/g, ' ').slice(0, 60), t, function () {
        // Kommentar merken: daraus wurde schon eine Mitteilung
        return api('update', {
          tabelle: 'Kommentare', id: k.id, daten: { angeheftet: true }
        }, s.token).then(function () { return pinnwand.laden(); }).catch(function () { return null; });
      }, String(k.farbe || ''));
    },
    max: 30
  });
  
  const dashBox = el('div', null,
    extraRaster,
    el('div', { class: 'dash-raster' },
      ...KACHELN.map(function (k) {
        if (k.projekte) return projektKachel;
        if (k.todos) return todoKachel;
        return el('section', { class: 'karte dash-kachel' },
          el('h2', { text: k.titel }),
          el('p', { class: 'leise', text: k.hinweis })
        );
      })
    ),
    el('section', { class: 'karte start-pinnwand' }, pinnwand.el)
  );

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'dash-kopf' },
      gruppenLogo(s.kurzname, 'dash-logo'),
      el('h1', { text: 'Hallo ' + (getName() || '') }),
      kopfKnoepfe
    ),
    fuss,
    archivBox,
    dashBox
  ));

  // ---- Projekte ----

  function zeichneProjekte() {
    leeren(projektListe);
    if (projektFehler && !projektDaten) {
      projektListe.append(el('p', {
        class: 'fehler', text: 'Projekte konnten nicht geladen werden: ' + projektFehler
      }));
      return;
    }
    if (!projektDaten) {
      projektListe.append(el('p', { class: 'leise', text: 'Lade Projekte …' }));
      return;
    }
    // Nur laufende Projekte (Aktiv). Projekte in Planung stehen nicht auf dem Start.
    const laufend = sortiereProjekte(
      projektDaten.projekte.filter(function (p) { return !istAbgeschlossen(p) && !istPlanung(p); }),
      false
    );
    if (!laufend.length) {
      projektListe.append(el('p', { class: 'leise', text: 'Noch kein laufendes Projekt.' }));
      return;
    }
    const gezeigt = laufend.slice(0, MAX_PROJEKTE);
    const todos = letzte ? letzte.daten.todos : [];

    if (letzte) {
      const alleAuf = gezeigt.every(function (p) { return projektOffen[String(p.id)]; });
      projektListe.append(el('div', { class: 'dash-projekt-knopf' },
        el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button',
          text: alleAuf ? 'Alle zuklappen' : 'Alle aufklappen',
          onclick: function () {
            gezeigt.forEach(function (p) {
              projektOffen[String(p.id)] = !alleAuf;
              projektOffen[String(p.id) + ':hut'] = !alleAuf;
            });
            zeichneProjekte();
          }
        })
      ));
    }

    gezeigt.forEach(function (p) {
      const id = String(p.id);
      const href = projekteLink + '/' + encodeURIComponent(p.id);
      const f = fortschritt(p.id, todos);
      const termine = terminText(p);
      const blockEl = el('div', { class: 'dash-projekt-block' },
        el('a', { class: 'dash-projekt', href: href },
          el('span', { class: 'dash-projekt-titel' },
            el('strong', { text: String(p.titel) })
          ),
          termine ? el('span', { class: 'leise', text: termine }) : null,
          fortschrittsBalken(letzte ? f.prozent : 0, letzte ? fortschrittText(f) : 'Lade ToDos …')
        )
      );

      if (letzte) {
        const offeneAlle = todos.filter(function (t) {
          return String(t.projekt_id || '').trim() === id && !istWahr(t.erledigt);
        });
        const mitWer = sortieren(offeneAlle.filter(function (t) { return !istOffenerHut(t); }));
        const hueteListe = sortieren(offeneAlle.filter(istOffenerHut));
        const keyHut = id + ':hut';

        const schalter = function (key, label, liste) {
          const auf = !!projektOffen[key];
          return el('button', {
            class: 'dash-schalter', type: 'button',
            'aria-expanded': String(auf),
            onclick: function () {
              if (projektOffen[key]) delete projektOffen[key];
              else projektOffen[key] = true;
              zeichneProjekte();
            }
          },
            el('span', { class: 'teil-pfeil' + (auf ? ' auf' : ''), 'aria-hidden': 'true', text: '▸' }),
            el('span', { text: label + ' (' + liste.length + ' offen)' })
          );
        };
        const listeFuer = function (key, liste, leer) {
          const ul = el('ul', { class: 'dash-todo-liste' });
          liste.forEach(function (t) { ul.append(zeile(t, href, true)); });
          if (!liste.length) ul.append(el('li', { class: 'leise', text: leer }));
          return ul;
        };

        blockEl.append(el('div', { class: 'dash-projekt-spalten' },
          schalter(id, 'ToDos', mitWer),
          schalter(keyHut, 'Hüte', hueteListe)
        ));
        if (projektOffen[id]) blockEl.append(listeFuer(id, mitWer, 'Keine offenen ToDos.'));
        if (projektOffen[keyHut]) blockEl.append(listeFuer(keyHut, hueteListe, 'Keine offenen Hüte.'));
      }
      projektListe.append(blockEl);
    });

    if (laufend.length > MAX_PROJEKTE) {
      projektListe.append(el('p', {
        class: 'leise', text: '… und ' + (laufend.length - MAX_PROJEKTE) + ' weitere'
      }));
    }
  }

  async function ladeProjekte(zuerstCache) {
    try {
      await ladeMitCache(
        s.gruppe_id + ':projekteliste',
        async function () {
          const r = await api('list', { tabelle: 'Projekte' }, s.token);
          return { projekte: r.zeilen };
        },
        function (daten) {
          projektDaten = daten;
          projektFehler = '';
          zeichneProjekte();
        },
        zuerstCache
      );
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      projektFehler = e.message;
      zeichneProjekte();
    }
  }

  // ---- Umfragen und Schwarzes Brett ----

  function extraOpt() {
    return {
      ctx: ctx,
      token: s.token,
      holeDaten: function () {
        return extraDaten || { umfragen: [], antworten: [], mitteilungen: [] };
      },
      mitteilungen: extraDaten ? extraDaten.mitteilungen : [],
      neuLaden: function () { return ladeExtra(false); }
    };
  }

  // Umfrage-Archiv statt Dashboard zeigen (und zurück)
  function archivSchalten(an) {
    dashBox.hidden = an;
    archivBox.hidden = !an;
    if (an) archivZeichnen();
  }

  function archivZeichnen() {
    const opt = extraOpt();
    zeichneArchiv(archivUmfragen, opt);
    zeichneBrettArchiv(archivMitteilungen, opt);
  }

  function zeichneExtra() {
    if (!extraDaten) return;
    const json = JSON.stringify(extraDaten);
    if (json === extraJson) return;   // nichts Neues: angefangene Auswahl nicht wegwischen
    extraJson = json;
    const opt = extraOpt();
    zeichneUmfragen(umfrageBox, opt);
    zeichneBrett(brettBox, opt);
    extraRaster.hidden = umfrageBox.hidden && brettBox.hidden;
    const n = anzahlBeendet(extraDaten.umfragen) + anzahlNichtAngeheftet(extraDaten.mitteilungen);
    archivKnopf.hidden = !n;
    archivKnopf.textContent = 'Archiv (' + n + ')';
    if (!archivBox.hidden) archivZeichnen();
  }

  async function ladeExtra(zuerstCache) {
    try {
      await ladeMitCache(
        s.gruppe_id + ':startextra',
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Umfragen', 'Umfrage_Antworten', 'Mitteilungen']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            umfragen: t.Umfragen || [],
            antworten: t.Umfrage_Antworten || [],
            mitteilungen: t.Mitteilungen || []
          };
        },
        function (daten) {
          extraDaten = daten;
          zeichneExtra();
        },
        zuerstCache
      );
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (!extraDaten) {
        extraRaster.hidden = false;
        umfrageBox.hidden = false;
        leeren(umfrageBox);
        umfrageBox.append(el('p', {
          class: 'fehler', text: 'Umfragen und Schwarzes Brett konnten nicht geladen werden: ' + e.message
        }));
      }
    }
  }
  
  // ---- Abhaken (ohne Konfliktprüfung) ----

  async function abhaken(t, wert) {
    const id = String(t.id);
    if (arbeitet[id]) return;
    arbeitet[id] = true;

    const alt = { erledigt: t.erledigt, erledigt_am: t.erledigt_am, erledigt_von: t.erledigt_von };
    const neu = abhakWerte(wert);
    Object.assign(t, neu);
    zeichne();

    let neuLaden = false;
    try {
      const eintrag = await abhakenSpeichern(s.token, t.id, neu);
      const i = letzte.daten.todos.findIndex(function (x) { return String(x.id) === id; });
      if (i >= 0 && eintrag) letzte.daten.todos[i] = eintrag;
      cacheSet(cacheKey, { daten: letzte.daten, stand: new Date().toISOString() });
      toast(wert ? 'Erledigt.' : 'Wieder geöffnet.');
    } catch (e) {
      Object.assign(t, alt);
      if (!ctx.behandleFehler(e)) {
        toast(e.code === 'nicht_gefunden' ? 'Dieses ToDo gibt es nicht mehr.' : e.message);
        if (e.code === 'nicht_gefunden') neuLaden = true;
      }
    }
    delete arbeitet[id];
    zeichne();
    if (neuLaden) laden(false);
  }

  // href: wohin ein Klick auf den Text führt (Standard: Reiter ToDos)
    function hutOpt(t) {
    return {
      ctx: ctx, token: s.token, t: t,
      fertig: function () {
        cacheSet(cacheKey, { daten: letzte.daten, stand: new Date().toISOString() });
        zeichne();
      }
    };
  }

  function zeile(t, href, mitHut) {
    const fertig = istWahr(t.erledigt);
    const klassen = ['dash-todo'];
    if (fertig) klassen.push('erledigt');
    const st = faelligStatus(t);
    if (st) klassen.push(st);
    const info = [
      t.verantwortlich,
      t.faellig_am ? 'Fällig ' + faelligText(t) : '',
      prioText(t.prioritaet)
    ].filter(Boolean).join(' · ');

    const cb = el('input', {
      type: 'checkbox',
      class: 'auswahl-box',
      'aria-label': kurz(t.text, 60) + ' erledigt'
    });
    cb.checked = fertig;
    cb.addEventListener('change', function () { abhaken(t, cb.checked); });

    const li = el('li', { class: 'dash-zeile' + (mitHut && !fertig ? ' mit-hut' : '') + (fertig ? ' erledigt' : '') },
      cb,
      el('a', { class: klassen.join(' '), href: href || todosLink },
        el('strong', { text: kurz(t.text, 90) }),
        info ? el('span', { class: 'leise', text: info }) : null
      )
    );
    if (mitHut && !fertig) li.append(huetKnoepfe(hutOpt(t)));
    return li;
  }

  function zeichne() {
    leeren(liste);
    zeichneProjekte();
    if (!letzte) return;
    const alle = letzte.daten.todos.filter(istAllgemein);
    const offen = sortieren(alle.filter(function (t) { return !istWahr(t.erledigt); }));
    // Erledigte: nur die der letzten 2 Wochen (ältere stehen im Archiv im Reiter ToDos)
    const fertig = sortiereErledigte(alle.filter(function (t) {
      return istWahr(t.erledigt) && !istArchiv(t);
    }));

    zahlen.className = 'dash-zahlen';
    zahlen.textContent = zahlenText(alle, getName());

    offen.slice(0, MAX_OFFEN).forEach(function (t) { liste.append(zeile(t)); });
    if (offen.length > MAX_OFFEN) {
      liste.append(el('li', { class: 'leise', text: '… und ' + (offen.length - MAX_OFFEN) + ' weitere offene' }));
    }
    if (!offen.length) {
      liste.append(el('li', {
        class: 'leise',
        text: alle.length ? 'Keine offenen ToDos.' : 'Noch keine allgemeinen ToDos eingetragen.'
      }));
    }

    if (erledigteCb.checked) {
      fertig.slice(0, MAX_ERLEDIGT).forEach(function (t) { liste.append(zeile(t)); });
      if (fertig.length > MAX_ERLEDIGT) {
        liste.append(el('li', { class: 'leise', text: '… und ' + (fertig.length - MAX_ERLEDIGT) + ' weitere erledigte' }));
      }
    }

    if (offline) {
      fuss.className = 'fehler';
      fuss.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
    } else {
      fuss.className = 'leise';
      fuss.textContent = letzte.meta.aktuell
        ? 'Stand ' + zeitText(letzte.meta.stand)
        : 'Zwischengespeichert von ' + zeitText(letzte.meta.stand) + '. Aktualisiere …';
    }
  }

  function zeigen(daten, meta) {
    letzte = { daten: daten, meta: meta };
    offline = false;
    zeichne();
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        cacheKey,
        async function () {
          const r = await api('list', { tabelle: 'ToDos' }, s.token);
          return { todos: r.zeilen };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        offline = true;
        zeichne();
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      zahlen.className = 'fehler';
      zahlen.textContent = 'ToDos konnten nicht geladen werden: ' + e.message;
    }
  }

  // ---- Was ist neu? ----

  function neuAnzeige() {
    const n = neuStand ? neuStand.items.length : 0;
    neuKnopf.hidden = !neuStand;
    neuZahl.textContent = n ? String(n) : '';
    neuKnopf.setAttribute('aria-label', n ? 'Was ist neu? ' + n + ' neue Einträge' : 'Was ist neu?');
  }

  function neuOeffnen() {
    if (!neuStand) return;
    const st = neuStand;
    zeigeNeu(st.items, function () {
      setLetzterBesuch(s.gruppe_id, st.stand);
      if (neuStand === st) neuStand = { items: [], stand: st.stand };
      neuAnzeige();
    });
  }

  async function ladeNeuSeit(automatisch) {
    try {
      const r = await holeNeu(s.token, s.gruppe_id, s.kurzname);
      neuStand = r;
      neuAnzeige();
      if (automatisch && !neuAutoGezeigt && r.items.length) {
        neuAutoGezeigt = true;
        neuOeffnen();
      }
    } catch (e) {
      ctx.behandleFehler(e);
    }
  }
  
  erledigteCb.addEventListener('change', zeichne);
  // Während ein Häkchen noch gespeichert wird, wird nicht aktualisiert
  ctx.setzeRefresh(function () {
    if (Object.keys(arbeitet).length) return Promise.resolve();
    return Promise.all([laden(false), ladeProjekte(false), ladeExtra(false), pinnwand.laden(), ladeNeuSeit(false)]);
  });
  await Promise.all([laden(true), ladeProjekte(true), ladeExtra(true), ladeNeuSeit(true)]);
}
