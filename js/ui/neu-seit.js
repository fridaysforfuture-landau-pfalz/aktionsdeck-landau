// js/ui/neu-seit.js
// "Was ist neu?": holt, was andere seit dem letzten Besuch geändert haben, und zeigt es im Fenster,
// gegliedert in Umfragen, Mitteilungen, Veranstaltungen, Kommentare, Mobi (Beiträge zu Veranstaltungen),
// Projekte (mit Meilensteinen, ToDos und Mobi-Beiträgen) und ToDos ohne Projekt.
// Seit 8.7 auch Protokolle und Reden (Abschnitt „Dokumentation“, mit Projekt beim Projekt).
// Seit 9.7 neue Personen im Team (Abschnitt „Team“, nur „neu im Team“).
// Seit 0.32.4 führen Kommentare zu Wiki-Seiten zur Seite (kein eigener Abschnitt „Wiki“).
// Der Zeitpunkt des letzten Besuchs liegt im Gerät (store.js), pro Gruppe.

import { el, txt } from './dom.js';
import { api } from '../api.js';
import { zeigeFenster } from './fenster.js';
import { getName, getLetzterBesuch, setLetzterBesuch } from '../store.js';
import { istWahr } from '../schema.js';
import { kurz, normDatum, heuteIso } from '../views/todos-rechnen.js';

function zeitKurz(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// Gibt { items, stand } zurück. stand = Serverzeit, wird beim Schließen als "gelesen bis" gespeichert.
// projekteHolen (freiwillig, seit 12.6): Funktion, die die Projekte liefert (spart eine Anfrage), sonst null.
export async function holeNeu(token, gruppeId, kurzname, projekteHolen) {
  const alt = getLetzterBesuch(gruppeId);
  const seit = alt || new Date().toISOString();
  const r = await api('listMehrere', {
    tabellen: ['ToDos', 'Meilensteine', 'Mitteilungen', 'Umfragen', 'Kommentare', 'Projekte', 'Veranstaltungen', 'Mobi_Plan',
      'Protokolle', 'Reden', 'Personen'],
    seit: seit
  }, token);
  const stand = (r && r.serverzeit) || new Date().toISOString();

  // Erster Besuch auf diesem Gerät: nur den Zeitpunkt merken
  if (!alt) {
    setLetzterBesuch(gruppeId, stand);
    return { items: [], stand: stand };
  }

  // Projekttitel aller Projekte (die Liste oben enthält nur geänderte)
  const titel = {};
  try {
    const zeilen = projekteHolen ? await projekteHolen() : (await api('list', { tabelle: 'Projekte' }, token)).zeilen;
    zeilen.forEach(function (p) { titel[String(p.id)] = String(p.titel); });
  } catch (e) {
    if (e && e.code === 'auth') throw e;
  }

  const t = (r && r.tabellen) || {};
  const ich = txt(getName()).toLowerCase();
  const basis = '#/g/' + encodeURIComponent(kurzname) + '/';
  const items = [];

  // fn(z, neu) gibt { art, was, titel, link, projektId? } zurück (oder null = auslassen)
  function sammeln(liste, bereich, fn) {
    (liste || []).forEach(function (z) {
      if (istWahr(z.geloescht)) return;
      const neu = String(z.erstellt_am || '') >= seit;
      const wer = txt(neu ? z.erstellt_von : z.geaendert_von);
      if (ich && wer.toLowerCase() === ich) return;
      const info = fn(z, neu);
      if (!info) return;
      const pid = info.projektId || '';
      items.push({
        bereich: pid ? 'projekt' : bereich,
        art: info.art,
        was: info.was,
        titel: info.titel,
        link: info.link,
        wer: wer,
        zeit: neu ? z.erstellt_am : z.geaendert_am,
        projektId: pid,
        projektTitel: pid ? (titel[pid] || 'Projekt') : '',
        projektLink: pid ? basis + 'projekte/' + encodeURIComponent(pid) : ''
      });
    });
  }

  sammeln(t.ToDos, 'allgemein', function (z, neu) {
    const pid = txt(z.projekt_id);
    return {
      art: 'ToDo',
      was: neu ? 'neu' : (istWahr(z.erledigt) ? 'erledigt' : 'geändert'),
      titel: kurz(z.text, 80),
      link: pid ? basis + 'projekte/' + encodeURIComponent(pid) : basis + 'todos',
      projektId: pid
    };
  });
  sammeln(t.Meilensteine, 'allgemein', function (z, neu) {
    const pid = txt(z.projekt_id);
    if (!pid) return null;
    return {
      art: 'Meilenstein',
      was: neu ? 'neu' : (istWahr(z.erledigt) ? 'erreicht' : 'geändert'),
      titel: '🏁 ' + kurz(z.titel, 80),
      link: basis + 'projekte/' + encodeURIComponent(pid),
      projektId: pid
    };
  });
  sammeln(t.Projekte, 'allgemein', function (z, neu) {
    return {
      art: 'Projekt',
      was: neu ? 'neu' : 'geändert',
      titel: kurz(z.titel, 80),
      link: basis + 'projekte/' + encodeURIComponent(z.id),
      projektId: String(z.id)
    };
  });
  sammeln(t.Mitteilungen, 'mitteilung', function (z, neu) {
    return { art: 'Mitteilung', was: neu ? 'neu' : 'geändert', titel: kurz(z.titel, 80), link: basis + 'start' };
  });
  sammeln(t.Umfragen, 'umfrage', function (z, neu) {
    return {
      art: 'Umfrage',
      was: neu ? 'neu' : (istWahr(z.beendet) ? 'beendet' : 'geändert'),
      titel: kurz(z.frage, 80),
      link: basis + 'start'
    };
  });
  sammeln(t.Veranstaltungen, 'veranstaltung', function (z, neu) {
    const von = normDatum(z.datum);
    if (!von) return null;
    const bis = normDatum(z.datum_ende) || von;
    if (bis < heuteIso()) return null;   // vorbei: nicht mehr wichtig
    return {
      art: 'Veranstaltung',
      was: neu ? 'neu' : 'geändert',
      titel: '📅 ' + kurz(z.titel, 60) + ' · ' + von.split('-').reverse().join('.'),
      link: basis + 'kalender'
    };
  });
  // Mobi-Beiträge: zum Projekt (dann unter dem Projekt) oder zu einer Veranstaltung (Abschnitt Mobi)
  sammeln(t.Mobi_Plan, 'mobi', function (z, neu) {
    const pid = txt(z.projekt_id);
    return {
      art: 'Mobi-Beitrag',
      was: neu ? 'neu' : (txt(z.status) === 'veroeffentlicht' ? 'veröffentlicht' : 'geändert'),
      titel: '📣 ' + (txt(z.kanal) ? txt(z.kanal) + ': ' : '') + kurz(z.titel, 70),
      link: basis + 'mobi',
      projektId: pid
    };
  });
  sammeln(t.Kommentare, 'kommentar', function (z, neu) {
    if (!neu) return null;
    const art = txt(z.bezug_art);
    return {
      art: art === 'rede' ? 'Kommentar zu einer Rede' : (art === 'wiki' ? 'Kommentar zu einer Wiki-Seite' : 'Kommentar'),
      was: 'neu',
      titel: kurz(z.text, 80),
      link: art === 'todo' ? basis + 'todos' : (art === 'mobi' ? basis + 'mobi'
        : (art === 'rede' ? basis + 'protokoll/rede:' + encodeURIComponent(txt(z.bezug_id))
          : (art === 'wiki' ? basis + 'wiki/' + encodeURIComponent(txt(z.bezug_id)) : basis + 'start')))
    };
  });
  // Protokolle (auch gemeinsame Entwürfe) und Reden: Abschnitt Dokumentation, mit Projekt beim Projekt
  sammeln(t.Protokolle, 'doku', function (z, neu) {
    const entwurf = istWahr(z.entwurf) && !istWahr(z.im_dokument);
    return {
      art: entwurf ? 'Protokoll-Entwurf' : 'Protokoll',
      was: neu ? 'neu' : 'geändert',
      titel: '📝 ' + kurz(z.titel, 70),
      link: basis + 'protokoll/protokoll:' + encodeURIComponent(z.id),
      projektId: txt(z.projekt_id)
    };
  });
  sammeln(t.Reden, 'doku', function (z, neu) {
    return {
      art: 'Rede',
      was: neu ? 'neu' : 'geändert',
      titel: '🎤 ' + kurz(z.titel, 70) + (txt(z.redner) ? ' (' + kurz(z.redner, 30) + ')' : ''),
      link: basis + 'protokoll/rede:' + encodeURIComponent(z.id),
      projektId: txt(z.projekt_id)
    };
  });

  // Team (9.7): nur „Neu im Team“, keine Änderungen an Kapazität oder Rollen
  sammeln(t.Personen, 'team', function (z, neu) {
    if (!neu) return null;
    return { art: 'Team', was: 'neu im Team', titel: '👥 ' + kurz(z.name, 60), link: basis + 'team/' + encodeURIComponent(z.id) };
  });

  items.sort(function (a, b) { return String(b.zeit).localeCompare(String(a.zeit)); });
  return { items: items.slice(0, 100), stand: stand };
}

// beiZu wird beim Schließen aufgerufen (dann gilt alles als gelesen)
export function zeigeNeu(items, beiZu) {
  let fenster = null;
  const inhalt = el('div');

  function zu() { if (fenster) fenster.schliessen(); }

  function zeile(it) {
    const info = [it.art, it.was, it.wer ? 'von ' + it.wer : '', zeitKurz(it.zeit)]
      .filter(Boolean).join(' · ');
    return el('li', { class: 'dash-zeile' },
      el('a', { class: 'dash-todo', href: it.link, onclick: zu },
        el('strong', { text: it.titel }),
        el('span', { class: 'leise', text: info })
      )
    );
  }

  function abschnitt(ueberschrift, liste) {
    if (!liste.length) return;
    inhalt.append(
      ueberschrift,
      el('ul', { class: 'dash-todo-liste' }, ...liste.map(zeile))
    );
  }

  function titelText(text) {
    return el('h3', { class: 'neu-titel', text: text });
  }

  if (!items.length) {
    inhalt.append(el('p', {
      class: 'leise',
      text: 'Seit deinem letzten Besuch ist von anderen nichts Neues dazugekommen.'
    }));
  } else {
    inhalt.append(el('p', {
      class: 'leise',
      text: 'Das haben andere seit deinem letzten Besuch gemacht. Eigene Änderungen stehen hier nicht.'
    }));

    function von(b) { return items.filter(function (i) { return i.bereich === b; }); }
    abschnitt(titelText('Umfragen'), von('umfrage'));
    abschnitt(titelText('Mitteilungen'), von('mitteilung'));
    abschnitt(titelText('Veranstaltungen'), von('veranstaltung'));
    abschnitt(titelText('Kommentare'), von('kommentar'));
    abschnitt(titelText('Mobi'), von('mobi'));
    abschnitt(titelText('Dokumentation'), von('doku'));
    abschnitt(titelText('Team'), von('team'));

    // Projekte: je Projekt eine Überschrift, darunter Projekt, Meilensteine und ToDos
    const gruppen = [];
    const index = {};
    von('projekt').forEach(function (i) {
      let g = index[i.projektId];
      if (!g) {
        g = { titel: i.projektTitel, link: i.projektLink, liste: [] };
        index[i.projektId] = g;
        gruppen.push(g);
      }
      g.liste.push(i);
    });
    gruppen.forEach(function (g) {
      g.liste.sort(function (a, b) {
        return (b.art === 'Projekt' ? 1 : 0) - (a.art === 'Projekt' ? 1 : 0);
      });
      abschnitt(
        el('h3', { class: 'neu-titel' },
          el('span', { text: 'Projekt: ' }),
          el('a', { href: g.link, text: g.titel, onclick: zu })
        ),
        g.liste
      );
    });

    abschnitt(titelText('ToDos ohne Projekt'), von('allgemein'));
  }

  inhalt.append(el('div', { class: 'fenster-loeschen' },
    el('button', {
      class: 'knopf', type: 'button', text: 'Schließen (alles gelesen)',
      onclick: zu
    })
  ));
  fenster = zeigeFenster('Was ist neu?', inhalt, beiZu, { aussenKlick: true });
}
