// js/views/wiki.js
// Reiter „Wiki“ (Etappe 10, seit 0.32.2): ersetzt den Reiter Hilfe.
// Oben drei Knöpfe über die ganze Breite: Skillshare, Anleitung, Entwicklung App. Darunter Suche und Inhalt.
// Alles steht im Inhalt, kein Detailbereich rechts.
// - Skillshare: Seiten der Gruppe aus dem Tab Wiki (bereich skillshare), nach festen Themen als Aufklapper.
// - Anleitung: feste Seiten der App (texte/anleitung/*.txt, Liste in liste.txt), darunter „Von unserer Gruppe“
//   (Tab Wiki, bereich anleitung, zum Beispiel „Gruppe intern“).
// - Entwicklung App: texte/entwicklung.txt.
// Adressen: #/g/<kurz>/wiki (Übersicht), wiki/<seiten-id>, wiki/anleitung:<datei>, wiki/entwicklung.
// Seit 0.32.3: „+ Seite“ (Skillshare und Anleitung), „+ Gruppe intern anlegen“, „Bearbeiten“ und „Löschen“ (js/views/wiki-eintrag.js).
// Adressen dafür: wiki/neu:skillshare, wiki/neu:anleitung, wiki/neu:gruppe-intern, wiki/bearbeiten:<seiten-id>.
// Zwischenspeicher gruppe_id:wiki (ladeMitCache).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { toast } from '../ui/toast.js';
import { schliesseDetail } from '../ui/detail.js';
import { istWahr } from '../schema.js';
import { zeichneText } from '../wiki-format.js';
import { zeigeEintrag } from './wiki-eintrag.js';
import {
  txt, BEREICHE, themaVon, sortiereSeiten, seitenIn, nachThema, findeSeite, passtSuche, ausschnitt,
  anleitungListe, standText
} from './wiki-rechnen.js';

// Bleibt beim Reiterwechsel (nur im Speicher)
const merker = { bereich: 'skillshare', suche: { skillshare: '', anleitung: '', entwicklung: '' } };

// Feste Texte (einmal je Seitenaufruf geladen)
let feste = null;

async function ladeDatei(pfad) {
  const antwort = await fetch(pfad, { cache: 'no-cache' });
  if (!antwort.ok) throw new Error('fehlt');
  return antwort.text();
}

async function ladeFeste() {
  if (feste) return feste;
  const liste = anleitungListe(await ladeDatei('texte/anleitung/liste.txt').catch(function () { return ''; }));
  const texte = {};
  await Promise.all(liste.map(function (a) {
    return ladeDatei('texte/anleitung/' + a.datei + '.txt')
      .then(function (t) { texte[a.datei] = t; })
      .catch(function () { texte[a.datei] = null; });
  }));
  const entwicklung = await ladeDatei('texte/entwicklung.txt').catch(function () { return null; });
  feste = { liste: liste, texte: texte, entwicklung: entwicklung };
  return feste;
}

// Abschnitte (## …) eines Textes, die zur Suche passen
function abschnitteMit(text, suche) {
  const woerter = txt(suche).toLowerCase().split(/\s+/).filter(Boolean);
  if (!woerter.length) return text;
  const teile = txt(text).split(/\n(?=##\s)/);
  return teile.filter(function (t) {
    const k = t.toLowerCase();
    return woerter.every(function (w) { return k.indexOf(w) >= 0; });
  }).join('\n\n');
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);
  if (ctx.detail) schliesseDetail(ctx.detail);
  const basis = '#/g/' + encodeURIComponent(s.kurzname) + '/wiki';
  const cacheKey = s.gruppe_id + ':wiki';
  const unter = txt(ctx.unter);
  if (unter === 'entwicklung') merker.bereich = 'entwicklung';

  let zeilen = [];
  let fehlerText = '';
  let geladen = false;
  let formGebaut = false;
  let frisch = false;
  let ohneNetz = false;
  let standGemerkt = '';
  const imFormular = unter.indexOf('neu:') === 0 || unter.indexOf('bearbeiten:') === 0;

  const status = el('p', { class: 'leise', role: 'status' });
  const inhalt = el('div', { class: 'wiki-inhalt' });
  const knoepfe = el('div', { class: 'wiki-bereiche', role: 'group', 'aria-label': 'Bereiche des Wikis' });
  const seite = el('div', { class: 'seite wiki-seite' }, el('h1', { text: 'Wiki' }), knoepfe, inhalt);
  container.append(seite);

  function alleSeiten() {
    return zeilen.filter(function (z) { return !istWahr(z.geloescht); });
  }

  // [[Titel]] -> Adresse in der App
  function seiteFinden(titel) {
    const z = findeSeite(alleSeiten(), titel);
    if (z) return basis + '/' + encodeURIComponent(z.id);
    const a = feste && findeSeite(feste.liste, titel);
    if (a) return basis + '/anleitung:' + a.datei;
    return '';
  }

  function knoepfeZeichnen(aufSeite) {
    leeren(knoepfe);
    BEREICHE.forEach(function (b) {
      const aktiv = !aufSeite && merker.bereich === b.id;
      knoepfe.append(el('button', {
        type: 'button',
        class: 'wiki-bereich wiki-bereich-' + b.id + (merker.bereich === b.id ? ' aktiv' : ''),
        'aria-pressed': aktiv ? 'true' : 'false',
        text: b.label,
        onclick: function () {
          merker.bereich = b.id;
          if (unter) location.hash = basis;
          else zeichne();
        }
      }));
    });
  }

  function sucheFeld(bereich, platzhalter) {
    const feld = el('input', {
      class: 'feld suche-feld', type: 'search', placeholder: platzhalter, 'aria-label': platzhalter
    });
    feld.value = merker.suche[bereich] || '';
    feld.addEventListener('input', function () {
      merker.suche[bereich] = feld.value;
      listeZeichnen();
    });
    return feld;
  }

  function seitenLink(href, titel, zusatz) {
    return el('a', { class: 'karte listenlink wiki-eintrag', href: href },
      el('span', { class: 'wiki-eintrag-titel', text: titel }),
      zusatz ? el('span', { class: 'leise wiki-eintrag-zusatz', text: zusatz }) : null
    );
  }

  function markeOeffentlich(z) {
    return istWahr(z.oeffentlich) ? '🌐 öffentlich' : '';
  }

  // ---- Übersicht ----

  let listeBox = null;

  function zeichne() {
    knoepfeZeichnen(false);
    leeren(inhalt);
    const b = merker.bereich;
    const platzhalter = b === 'skillshare' ? 'Skillshare durchsuchen …'
      : (b === 'anleitung' ? 'Anleitung durchsuchen …' : 'Entwicklung durchsuchen …');
    listeBox = el('div', { class: 'wiki-liste' });
    const zeile = el('div', { class: 'filterzeile wiki-filter' }, sucheFeld(b, platzhalter));
    if (b !== 'entwicklung') {
      zeile.classList.add('mit-knopf');
      zeile.append(el('a', { class: 'knopf', href: basis + '/neu:' + b, text: '+ Seite' }));
    }
    inhalt.append(zeile, status, listeBox);
    listeZeichnen();
  }

  function listeZeichnen() {
    if (!listeBox) return;
    leeren(listeBox);
    const b = merker.bereich;
    const suche = merker.suche[b] || '';
    if (b === 'skillshare') skillshareZeichnen(suche);
    else if (b === 'anleitung') anleitungZeichnen(suche);
    else entwicklungZeichnen(suche);
  }

  function trefferListe(treffer, suche) {
    if (!treffer.length) {
      listeBox.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
      return;
    }
    treffer.forEach(function (t) {
      listeBox.append(seitenLink(t.href, t.titel, ausschnitt(t.text, suche, 120)));
    });
  }

  function skillshareZeichnen(suche) {
    const seiten = seitenIn(alleSeiten(), 'skillshare');
    if (!geladen) return;
    if (suche) {
      trefferListe(sortiereSeiten(seiten.filter(function (z) { return passtSuche(z, suche); })).map(function (z) {
        return { href: basis + '/' + encodeURIComponent(z.id), titel: txt(z.titel), text: z.text };
      }), suche);
      return;
    }
    if (!seiten.length) {
      if (!fehlerText) {
        listeBox.append(el('p', { class: 'leise', text: 'Noch keine Seiten. Hier sammelt eure Gruppe Wissen zum Weitergeben, zum Beispiel „Demo anmelden“ oder „Banner malen“.' }));
      }
      return;
    }
    nachThema(seiten).forEach(function (g) {
      listeBox.append(el('details', { class: 'wiki-thema', open: '' },
        el('summary', { text: g.thema + ' (' + g.seiten.length + ')' }),
        el('div', { class: 'wiki-thema-liste' }, ...g.seiten.map(function (z) {
          return seitenLink(basis + '/' + encodeURIComponent(z.id), txt(z.titel), markeOeffentlich(z));
        }))
      ));
    });
  }

  function anleitungZeichnen(suche) {
    const eigene = sortiereSeiten(seitenIn(alleSeiten(), 'anleitung'));
    const fest = feste ? feste.liste : [];
    if (suche) {
      const treffer = fest.filter(function (a) {
        return passtSuche({ titel: a.titel, text: feste.texte[a.datei] || '' }, suche);
      }).map(function (a) {
        return { href: basis + '/anleitung:' + a.datei, titel: a.titel, text: feste.texte[a.datei] || '' };
      }).concat(eigene.filter(function (z) { return passtSuche(z, suche); }).map(function (z) {
        return { href: basis + '/' + encodeURIComponent(z.id), titel: txt(z.titel), text: z.text };
      }));
      trefferListe(treffer, suche);
      return;
    }
    if (!feste) {
      listeBox.append(el('p', { class: 'leise', text: 'Lade Anleitung …' }));
      return;
    }
    const festBox = el('div', { class: 'wiki-thema-liste' }, ...fest.map(function (a) {
      return seitenLink(basis + '/anleitung:' + a.datei, a.titel, '');
    }));
    if (!fest.length) festBox.append(el('p', { class: 'leise', text: 'Die Anleitung konnte nicht geladen werden.' }));
    listeBox.append(festBox);

    const gruppe = el('section', { class: 'wiki-eigene' }, el('h2', { text: 'Von unserer Gruppe' }));
    if (eigene.length) {
      gruppe.append(el('div', { class: 'wiki-thema-liste' }, ...eigene.map(function (z) {
        return seitenLink(basis + '/' + encodeURIComponent(z.id), txt(z.titel), markeOeffentlich(z));
      })));
    } else if (geladen && !fehlerText) {
      gruppe.append(el('p', { class: 'leise', text: 'Noch keine eigenen Seiten, zum Beispiel „Gruppe intern“ mit Abläufen und Absprachen eurer Gruppe.' }));
    }
    if (geladen && !fehlerText && !findeSeite(alleSeiten(), 'Gruppe intern')) {
      gruppe.append(el('p', null, el('a', { class: 'knopf knopf-hell', href: basis + '/neu:gruppe-intern', text: '+ Gruppe intern anlegen' })));
    }
    listeBox.append(gruppe);
  }

  function entwicklungZeichnen(suche) {
    if (!feste) {
      listeBox.append(el('p', { class: 'leise', text: 'Lade …' }));
      return;
    }
    if (feste.entwicklung === null) {
      listeBox.append(el('p', { class: 'fehler', text: 'Der Text konnte nicht geladen werden.' }));
      return;
    }
    const text = abschnitteMit(feste.entwicklung, suche);
    if (!txt(text)) {
      listeBox.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
      return;
    }
    listeBox.append(el('section', { class: 'karte' }, zeichneText(text, { seiteFinden: seiteFinden })));
  }

  // ---- Eine Seite ----

  function zurueckLink() {
    return el('p', { class: 'wiki-zurueck' }, el('a', { href: basis, text: '← Wiki' }));
  }

  function zeigeFesteSeite(datei) {
    knoepfeZeichnen(true);
    leeren(inhalt);
    if (!feste) {
      inhalt.append(zurueckLink(), el('p', { class: 'leise', text: 'Lädt …' }));
      return;
    }
    const a = feste.liste.find(function (x) { return x.datei === datei; });
    const text = a ? feste.texte[a.datei] : null;
    if (!a || text === null || text === undefined) {
      inhalt.append(zurueckLink(), el('p', { class: 'leise', text: 'Diese Seite fehlt.' }));
      return;
    }
    merker.bereich = 'anleitung';
    knoepfeZeichnen(true);
    inhalt.append(
      zurueckLink(),
      el('article', { class: 'karte wiki-artikel' },
        el('h2', { class: 'wiki-titel', text: a.titel }),
        el('p', { class: 'leise wiki-stand', text: 'Anleitung der App' + (a.oeffentlich ? ' · 🌐 öffentlich' : '') }),
        zeichneText(text, { seiteFinden: seiteFinden, inhaltsverzeichnis: true })
      )
    );
  }

  function zeigeSheetSeite(id) {
    knoepfeZeichnen(true);
    leeren(inhalt);
    const z = alleSeiten().find(function (x) { return String(x.id) === String(id); });
    if (!z) {
      inhalt.append(zurueckLink(), el('p', { class: 'leise', text: geladen ? 'Diese Seite gibt es nicht (mehr).' : 'Lädt …' }));
      if (fehlerText) inhalt.append(el('p', { class: 'fehler', text: fehlerText }));
      return;
    }
    merker.bereich = txt(z.bereich) === 'anleitung' ? 'anleitung' : 'skillshare';
    knoepfeZeichnen(true);
    const angaben = [
      txt(z.bereich) === 'skillshare' ? themaVon(z) : 'Von unserer Gruppe',
      standText(z.geaendert_am) ? 'Stand ' + standText(z.geaendert_am) + (txt(z.geaendert_von) ? ' von ' + txt(z.geaendert_von) : '') : '',
      markeOeffentlich(z)
    ].filter(Boolean).join(' · ');
    inhalt.append(
      zurueckLink(),
      el('article', { class: 'karte wiki-artikel' },
        el('h2', { class: 'wiki-titel', text: txt(z.titel) }),
        el('p', { class: 'leise wiki-stand', text: angaben }),
        zeichneText(z.text, { seiteFinden: seiteFinden, inhaltsverzeichnis: true }),
        el('div', { class: 'hut-knoepfe wiki-seiten-knoepfe' },
          el('a', { class: 'knopf', href: basis + '/bearbeiten:' + encodeURIComponent(z.id), text: 'Bearbeiten' }),
          el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Löschen', onclick: function () { loeschen(z); } })
        )
      )
    );
  }

  // Neue oder geänderte Zeile in den Zwischenspeicher, damit die nächste Ansicht sie sofort kennt
  async function merken(eintrag) {
    zeilen = zeilen.filter(function (x) { return String(x.id) !== String(eintrag.id); }).concat([eintrag]);
    await cacheSet(cacheKey, { daten: zeilen, stand: new Date().toISOString() });
  }

  async function loeschen(z) {
    const frage = 'Die Seite „' + txt(z.titel) + '“ wirklich löschen?' +
      (istWahr(z.oeffentlich) ? '\n\nSie ist öffentlich und verschwindet dann auch aus dem öffentlichen Wiki.' : '') +
      '\n\nKommentare zur Seite werden mitgelöscht.';
    if (!window.confirm(frage)) return;
    if (!navigator.onLine) { toast('Keine Verbindung. Löschen geht nur mit Verbindung.'); return; }
    try {
      const r = await api('delete', { tabelle: 'Wiki', id: z.id, bekannt: z.geaendert_am }, s.token);
      await merken(r.eintrag);
      toast('Seite gelöscht.');
      location.hash = basis;
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.code === 'konflikt' ? 'Jemand anderes hat die Seite gerade geändert. Bitte neu laden und noch einmal versuchen.' : e.message);
    }
  }

  // ---- Formular ----

  function zeigeFormular() {
    if (formGebaut) return;
    let seiteZ = null;
    let bereich = 'skillshare';
    let vorschlag = '';
    if (unter.indexOf('bearbeiten:') === 0) {
      seiteZ = alleSeiten().find(function (x) { return String(x.id) === unter.slice(11); }) || null;
      if (!seiteZ) {
        knoepfeZeichnen(true);
        leeren(inhalt);
        inhalt.append(zurueckLink(), el('p', { class: 'leise', text: geladen ? 'Diese Seite gibt es nicht (mehr).' : 'Lädt …' }));
        return;
      }
    } else {
      const art = unter.slice(4);
      bereich = art === 'skillshare' ? 'skillshare' : 'anleitung';
      if (art === 'gruppe-intern') vorschlag = 'Gruppe intern';
    }
    formGebaut = true;
    merker.bereich = seiteZ ? (txt(seiteZ.bereich) === 'anleitung' ? 'anleitung' : 'skillshare') : bereich;
    knoepfeZeichnen(true);
    leeren(inhalt);
    const box = el('div', { class: 'karte wiki-artikel wiki-form-karte' });
    inhalt.append(zurueckLink(), box);
    zeigeEintrag(box, {
      ctx: ctx, token: s.token, gruppeId: s.gruppe_id, seite: seiteZ, bereich: bereich, titel: vorschlag,
      seiten: alleSeiten, seiteFinden: seiteFinden,
      beiFertig: async function (eintrag) {
        await merken(eintrag);
        location.hash = basis + '/' + encodeURIComponent(eintrag.id);
      },
      beiAbbruch: function () {
        location.hash = seiteZ ? basis + '/' + encodeURIComponent(seiteZ.id) : basis;
      }
    });
  }

  function anzeigen() {
    if (imFormular) {
      // Neu anlegen geht sofort, Bearbeiten erst mit den geladenen Seiten. Danach nie neu aufbauen (Tippen geht sonst verloren).
      // Bearbeiten mit frischem Stand (sonst gibt es beim Speichern unnötig einen Konflikt), ohne Verbindung mit dem gemerkten
      if (unter.indexOf('neu:') === 0 || frisch || (geladen && ohneNetz)) zeigeFormular();
      else { knoepfeZeichnen(true); leeren(inhalt); inhalt.append(zurueckLink(), el('p', { class: 'leise', text: 'Lädt …' })); }
      return;
    }
    if (!unter || unter === 'entwicklung') zeichne();
    else if (unter.indexOf('anleitung:') === 0) zeigeFesteSeite(unter.slice(10));
    else zeigeSheetSeite(unter);
  }

  // ---- Laden ----

  async function laden(zuerstCache) {
    try {
      const neuGeladen = await ladeMitCache(cacheKey, function () {
        return api('list', { tabelle: 'Wiki' }, s.token).then(function (r) { return r.zeilen; });
      }, function (daten, meta) {
        zeilen = Array.isArray(daten) ? daten : [];
        geladen = true;
        fehlerText = '';
        if (meta.aktuell) { frisch = true; status.textContent = ''; }
        else standGemerkt = meta.stand;
        if (!container.contains(seite)) return;
        if (unter) anzeigen();
        else listeZeichnen();
      }, zuerstCache);
      if (!neuGeladen) {
        ohneNetz = true;
        status.textContent = 'Ohne Verbindung: Stand vom ' + standText(standGemerkt) + '.';
        if (unter && container.contains(seite)) anzeigen();
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      geladen = true;
      ohneNetz = true;
      fehlerText = 'Die Seiten der Gruppe konnten nicht geladen werden: ' + e.message;
      status.textContent = fehlerText;
      status.className = 'fehler';
      if (!container.contains(seite)) return;
      if (unter) anzeigen();
      else listeZeichnen();
    }
  }

  anzeigen();
  ladeFeste().then(function () {
    if (!container.contains(seite)) return;
    // In der Übersicht nur die Liste neu zeichnen (das Suchfeld behält den Fokus)
    if (!unter || unter === 'entwicklung') listeZeichnen();
    else anzeigen();
  });
  // Beim Schreiben kein regelmäßiges Neuladen
  if (!imFormular) ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}
