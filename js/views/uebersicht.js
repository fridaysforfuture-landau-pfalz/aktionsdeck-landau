// js/views/uebersicht.js
// Jahresübersicht (11.5): erreichbar über den Knopf im Archiv der Projekte, Adresse #/g/<kurzname>/projekte/uebersicht.
// Oben steht immer offen das laufende Jahr, darunter ein Aufklapper je früherem Jahr. Je Jahr „Als Text kopieren“.
// Rechnen: js/views/uebersicht-rechnen.js. Nur für die eigene Gruppe (mit Login).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { toast } from '../ui/toast.js';
import { datumText } from './todos-rechnen.js';
import { jahreAus, jahresZahlen, alsText, euro, protokollArt } from './uebersicht-rechnen.js';

const TABELLEN = ['Projekte', 'ToDos', 'Finanzen', 'Ausleihe', 'Material', 'Veranstaltungen', 'Mobi_Plan', 'Protokolle', 'Reden', 'Learnings'];

// Welche früheren Jahre aufgeklappt sind (bleibt beim Neuladen erhalten)
const offen = {};

function kopieren(text) {
  const fehlt = function () { toast('Kopieren hat nicht geklappt. Bitte den Text markieren.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('Übersicht kopiert.'); }, fehlt);
  } else {
    fehlt();
  }
}

function abschnitt(titel, zeile, punkte) {
  const box = el('div', { class: 'jahr-abschnitt' },
    el('h3', { text: titel }),
    zeile ? el('p', { class: 'dash-zahlen', text: zeile }) : null
  );
  if (punkte && punkte.length) box.append(el('ul', { class: 'jahr-liste' }, ...punkte.map(function (t) { return el('li', { text: t }); })));
  return box;
}

function mitDatum(titel, datum, rest) {
  return titel + (datum ? ' (' + datumText(datum) + ')' : '') + (rest ? ' · ' + rest : '');
}

function jahrInhalt(z, gruppenName) {
  const p = z.projekte;
  const v = z.veranstaltungen;
  const d = z.doku;
  return el('div', { class: 'jahr-inhalt' },
    el('div', { class: 'teil-aktionen' },
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Als Text kopieren',
        onclick: function () { kopieren(alsText(z, gruppenName)); }
      })
    ),
    abschnitt('📁 Projekte', p.abgeschlossen.length + ' abgeschlossen · ' + p.aktiv + ' aktiv · ' + p.planung + ' in Planung',
      p.abgeschlossen.map(function (x) { return mitDatum(x.titel, x.datum, x.aktionsart); })),
    abschnitt('📅 Veranstaltungen', v.intern + ' intern · ' + v.extern.length + ' extern',
      v.extern.map(function (x) { return mitDatum(x.titel, x.datum, x.veranstalter); })),
    abschnitt('📣 Mobi', z.mobi.gesamt + ' veröffentlichte Beiträge',
      z.mobi.jeKanal.map(function (k) { return k.name + ': ' + k.anzahl; })),
    abschnitt('✅ ToDos', z.todos.erledigt + ' erledigt · davon ' + z.todos.inProjekten + ' in Projekten'),
    abschnitt('💶 Geld', 'Geplant ' + euro(z.geld.geplant) + ' · Tatsächlich ' + euro(z.geld.tatsaechlich),
      z.geld.jeProjekt.map(function (g) { return g.projekt + ': geplant ' + euro(g.geplant) + ' · tatsächlich ' + euro(g.tatsaechlich); })),
    abschnitt('📦 Material', z.material.length ? 'Am häufigsten mitgenommen' : 'Nichts mitgenommen',
      z.material.map(function (m) { return m.name + ': ' + m.anzahl; })),
    abschnitt('📝 Dokumentation', d.protokolle + ' Protokolle · ' + d.reden + ' gehaltene Reden · ' + d.learnings + ' Learnings',
      d.protokolleJeArt.map(function (e) { return 'Protokolle ' + protokollArt(e.name) + ': ' + e.anzahl; })
        .concat(d.learningsJeArt.map(function (e) { return 'Learnings ' + e.name + ': ' + e.anzahl; })))
  );
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);
  const basis = '#/g/' + encodeURIComponent(s.kurzname) + '/';
  const gruppenName = String(s.name || String(s.kurzname).toUpperCase());
  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const box = el('div');
  let letzteJson = '';

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Jahresübersicht' }),
      el('div', { class: 'kopf-knoepfe' },
        el('a', { class: 'knopf knopf-hell', href: basis + 'projekte', text: '← Projekte' })
      )
    ),
    el('p', { class: 'leise', text: 'Was die Gruppe in einem Jahr gemacht hat, zum Beispiel für einen Jahresbericht, einen Förderantrag oder einen Rückblick im Plenum.' }),
    status,
    box
  ));

  function zeichne(daten) {
    const json = JSON.stringify(daten);
    if (json === letzteJson) return;
    letzteJson = json;
    leeren(box);
    const diesesJahr = new Date().getFullYear();
    jahreAus(daten, diesesJahr).forEach(function (jahr) {
      const z = jahresZahlen(daten, jahr);
      if (jahr === diesesJahr) {
        box.append(el('section', { class: 'karte jahr-karte' },
          el('h2', { text: String(jahr) + ' (laufendes Jahr)' }),
          jahrInhalt(z, gruppenName)
        ));
        return;
      }
      const auf = el('details', { class: 'karte jahr-karte' });
      if (offen[jahr]) auf.open = true;
      auf.addEventListener('toggle', function () {
        if (auf.open) offen[jahr] = true;
        else delete offen[jahr];
      });
      auf.append(
        el('summary', null,
          el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
          el('strong', { text: String(jahr) }),
          el('span', { class: 'leise', text: z.projekte.abgeschlossen.length + ' Projekte abgeschlossen · ' + z.todos.erledigt + ' ToDos erledigt' })
        ),
        jahrInhalt(z, gruppenName)
      );
      box.append(auf);
    });
  }

  async function laden(zuerstCache) {
    try {
      const frisch = await ladeMitCache(
        s.gruppe_id + ':uebersicht',
        async function () {
          const r = await api('listMehrere', { tabellen: TABELLEN }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            projekte: t.Projekte || [], todos: t.ToDos || [], finanzen: t.Finanzen || [], ausleihe: t.Ausleihe || [],
            material: t.Material || [], veranstaltungen: t.Veranstaltungen || [], mobi: t.Mobi_Plan || [],
            protokolle: t.Protokolle || [], reden: t.Reden || [], learnings: t.Learnings || []
          };
        },
        function (daten, meta) {
          status.textContent = meta.aktuell ? '' : 'Gespeicherter Stand, wird aktualisiert …';
          zeichne(daten);
        },
        zuerstCache
      );
      if (!frisch) status.textContent = 'Keine Verbindung. Du siehst den zuletzt gespeicherten Stand.';
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.textContent = 'Die Übersicht konnte nicht geladen werden: ' + e.message;
    }
  }

  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}
