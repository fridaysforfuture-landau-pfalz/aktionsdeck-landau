// js/views/wiki-oeffentlich.js
// Öffentliches Wiki ohne Login (Etappe 10, seit 0.32.6). Aufbau wie die öffentliche Seite #/termine.
// Adressen:
//   #/wiki                        Übersicht: Seiten der App (Entwicklung App, öffentliche Anleitung) und
//                                 öffentliche Seiten der Gruppen (nach Gruppe und Thema)
//   #/wiki/app/entwicklung        texte/entwicklung.txt
//   #/wiki/app/<datei>            Anleitungsseite, nur wenn sie in texte/anleitung/liste.txt „oeffentlich“ ist
//   #/wiki/<gruppe>/<adresse>     eine öffentliche Seite einer Gruppe (Aktion "wiki" mit gruppe und adresse)
// Daten: Aktion "wiki" ohne Token. Zwischenspeicher oeffentlich:wiki (Liste) und oeffentlich:wiki:<gruppe>:<adresse>.
// Keine Namen, keine Kommentare. Links [[Titel]] führen nur auf andere öffentliche Seiten derselben Gruppe.

import { el, leeren, txt } from '../ui/dom.js';
import { balken } from '../ui/kopf.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { getSession } from '../store.js';
import { zeichneText } from '../wiki-format.js';
import { signalKnoepfe } from '../ui/signal.js';
import { nachThema, sortiereSeiten, findeSeite, anleitungListe, standText, BEREICHE } from './wiki-rechnen.js';

const DATEI = /^[a-z0-9-]{1,40}$/;
const GRUPPE = /^[a-z0-9_-]{1,30}$/;
const ADRESSE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function ladeDatei(pfad) {
  const antwort = await fetch(pfad, { cache: 'no-cache' });
  if (!antwort.ok) throw new Error('fehlt');
  return antwort.text();
}

// "2026-10-23" -> "23.10.2026"
function tagText(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(s));
  return m ? m[3] + '.' + m[2] + '.' + m[1] : '';
}

function seitenHref(s) {
  return '#/wiki/' + encodeURIComponent(txt(s.kurzname).toLowerCase()) + '/' + encodeURIComponent(txt(s.adresse));
}

export async function render(container, ctx) {
  leeren(container);
  const teile = (ctx.wikiTeile || []).map(function (t) { return txt(t); });
  const sitzung = getSession();
  const zurueck = sitzung
    ? el('a', { href: '#/g/' + encodeURIComponent(sitzung.kurzname) + '/wiki', text: '← Zurück zur App' })
    : el('a', { href: '#/', text: '← Zur Gruppenwahl' });
  const inhalt = el('div', { class: 'wiki-oeffentlich' });
  const seite = el('main', { class: 'start-seite' }, inhalt, el('p', null, zurueck));
  container.append(balken(), seite);

  let liste = { seiten: [], gruppen: [] };
  let feste = [];

  function zurueckWiki() {
    return el('p', { class: 'wiki-zurueck' }, el('a', { href: '#/wiki', text: '← Wiki' }));
  }

  function hinweis(text, klasse) {
    return el('p', { class: klasse || 'leise', text: text });
  }

  // ---- Übersicht ----

  function zeichneUebersicht(meta, laedt) {
    leeren(inhalt);
    inhalt.append(el('h1', { text: 'Wiki' }));
    if (meta && !meta.aktuell) inhalt.append(hinweis('Ohne Verbindung: Stand vom ' + standText(meta.stand) + '.'));

    const app = el('section', { class: 'karte wiki-artikel' }, el('h2', { text: 'Zur App' }));
    const appListe = el('div', { class: 'wiki-thema-liste' },
      el('a', { class: 'karte listenlink wiki-eintrag', href: '#/wiki/app/entwicklung' },
        el('span', { class: 'wiki-eintrag-titel', text: BEREICHE[2].label }),
        el('span', { class: 'leise wiki-eintrag-zusatz', text: 'Wie die App gewachsen ist' }))
    );
    feste.filter(function (a) { return a.oeffentlich; }).forEach(function (a) {
      appListe.append(el('a', { class: 'karte listenlink wiki-eintrag', href: '#/wiki/app/' + a.datei },
        el('span', { class: 'wiki-eintrag-titel', text: a.titel }),
        el('span', { class: 'leise wiki-eintrag-zusatz', text: 'Anleitung' })));
    });
    app.append(appListe);
    inhalt.append(app);

    const gruppenMit = liste.gruppen.filter(function (g) {
      return liste.seiten.some(function (s) { return s.kurzname === g.kurzname; });
    });
    const box = el('div');
    let wahl = null;
    if (gruppenMit.length >= 2) {
      wahl = el('select', { class: 'feld', 'aria-label': 'Gruppe wählen' },
        el('option', { value: '', text: 'Alle Gruppen' }),
        ...gruppenMit.map(function (g) { return el('option', { value: g.kurzname, text: g.name }); }));
      wahl.addEventListener('change', gruppenZeichnen);
      inhalt.append(el('div', { class: 'filterzeile wiki-filter' }, wahl));
    }
    inhalt.append(box);

    function gruppenZeichnen() {
      leeren(box);
      const nur = wahl ? wahl.value : '';
      const zeigen = gruppenMit.filter(function (g) { return !nur || g.kurzname === nur; });
      if (!zeigen.length) {
        box.append(hinweis(laedt ? 'Lädt …' : 'Noch keine öffentlichen Seiten der Gruppen.'));
        return;
      }
      zeigen.forEach(function (g) {
        const eigene = liste.seiten.filter(function (s) { return s.kurzname === g.kurzname; });
        const karte = el('section', { class: 'karte wiki-artikel wiki-gruppe' }, el('h2', { text: g.name }));
        const skill = eigene.filter(function (s) { return s.bereich === 'skillshare'; });
        const anl = sortiereSeiten(eigene.filter(function (s) { return s.bereich === 'anleitung'; }));
        nachThema(skill).forEach(function (t) {
          karte.append(el('h3', { class: 'wiki-oeff-thema', text: t.thema }),
            el('div', { class: 'wiki-thema-liste' }, ...t.seiten.map(function (s) {
              return el('a', { class: 'karte listenlink wiki-eintrag', href: seitenHref(s) },
                el('span', { class: 'wiki-eintrag-titel', text: txt(s.titel) }),
                tagText(s.stand) ? el('span', { class: 'leise wiki-eintrag-zusatz', text: 'Stand ' + tagText(s.stand) }) : null);
            })));
        });
        if (anl.length) {
          karte.append(el('h3', { class: 'wiki-oeff-thema', text: 'Anleitung der Gruppe' }),
            el('div', { class: 'wiki-thema-liste' }, ...anl.map(function (s) {
              return el('a', { class: 'karte listenlink wiki-eintrag', href: seitenHref(s) },
                el('span', { class: 'wiki-eintrag-titel', text: txt(s.titel) }));
            })));
        }
        box.append(karte);
      });
    }
    gruppenZeichnen();
  }

  // ---- Seite der App ----

  async function zeigeAppSeite(datei) {
    leeren(inhalt);
    inhalt.append(zurueckWiki(), hinweis('Lädt …'));
    let titel = '';
    let pfad = '';
    if (datei === 'entwicklung') {
      titel = BEREICHE[2].label;
      pfad = 'texte/entwicklung.txt';
    } else {
      const a = DATEI.test(datei) ? feste.find(function (x) { return x.datei === datei && x.oeffentlich; }) : null;
      if (a) { titel = a.titel; pfad = 'texte/anleitung/' + a.datei + '.txt'; }
    }
    let text = null;
    if (pfad) text = await ladeDatei(pfad).catch(function () { return null; });
    if (!container.contains(seite)) return;
    leeren(inhalt);
    inhalt.append(zurueckWiki());
    if (text === null) {
      inhalt.append(hinweis('Seite nicht gefunden.'));
      return;
    }
    inhalt.append(el('article', { class: 'karte wiki-artikel' },
      el('h1', { class: 'wiki-titel', text: titel }),
      el('p', { class: 'leise wiki-stand', text: 'AktionsDeck Landau' }),
      signalKnoepfe(zeichneText(text, { inhaltsverzeichnis: true, seiteFinden: function () { return ''; }, fehltAlsText: true }))
    ));
  }

  // ---- Seite einer Gruppe ----

  async function zeigeGruppenSeite(gruppe, adresse) {
    leeren(inhalt);
    inhalt.append(zurueckWiki(), hinweis('Lädt …'));
    if (!GRUPPE.test(gruppe) || !ADRESSE.test(adresse) || adresse.length > 60) {
      leeren(inhalt);
      inhalt.append(zurueckWiki(), hinweis('Seite nicht gefunden.'));
      return;
    }
    function zeigen(s, meta) {
      if (!container.contains(seite)) return;
      leeren(inhalt);
      inhalt.append(zurueckWiki());
      if (!s) {
        inhalt.append(hinweis('Seite nicht gefunden. Vielleicht ist sie nicht mehr öffentlich.'));
        return;
      }
      if (meta && !meta.aktuell) inhalt.append(hinweis('Ohne Verbindung: Stand vom ' + standText(meta.stand) + '.'));
      const angaben = [txt(s.gruppe_name), s.bereich === 'skillshare' ? txt(s.thema) : 'Anleitung der Gruppe',
        tagText(s.stand) ? 'Stand ' + tagText(s.stand) : ''].filter(Boolean).join(' · ');
      inhalt.append(el('article', { class: 'karte wiki-artikel' },
        el('h1', { class: 'wiki-titel', text: txt(s.titel) }),
        el('p', { class: 'leise wiki-stand', text: angaben }),
        zeichneText(s.text, {
          inhaltsverzeichnis: true, fehltAlsText: true,
          // nur andere öffentliche Seiten derselben Gruppe
          seiteFinden: function (t) {
            const z = findeSeite(liste.seiten.filter(function (x) { return x.kurzname === s.kurzname; }), t);
            return z ? seitenHref(z) : '';
          }
        })
      ));
    }
    try {
      await ladeMitCache('oeffentlich:wiki:' + gruppe + ':' + adresse, function () {
        return api('wiki', { gruppe: gruppe, adresse: adresse }).then(function (r) {
          return (r && r.seite) || null;
        }, function (e) {
          // Nicht (mehr) öffentlich: auch die gemerkte Kopie gilt nicht mehr
          if (e && e.code === 'nicht_gefunden') return null;
          throw e;
        });
      }, zeigen, true);
    } catch (e) {
      if (!container.contains(seite)) return;
      leeren(inhalt);
      inhalt.append(zurueckWiki(), hinweis('Die Seite konnte nicht geladen werden. Bitte später noch einmal versuchen.', 'fehler'));
    }
  }

  // ---- Start ----

  feste = anleitungListe(await ladeDatei('texte/anleitung/liste.txt').catch(function () { return ''; }));
  if (!container.contains(seite)) return;

  if (teile[0] === 'app') {
    await zeigeAppSeite(teile[1] || '');
    return;
  }

  let erstesMal = true;
  const listeLaden = ladeMitCache('oeffentlich:wiki', function () { return api('wiki', {}); }, function (daten, meta) {
    liste = {
      seiten: Array.isArray(daten && daten.seiten) ? daten.seiten : [],
      gruppen: Array.isArray(daten && daten.gruppen) ? daten.gruppen : []
    };
    if (!container.contains(seite)) return;
    if (!teile[0]) zeichneUebersicht(meta);
    erstesMal = false;
  }, true).catch(function () {
    if (!container.contains(seite) || teile[0]) return;
    if (erstesMal) {
      zeichneUebersicht(null);
      inhalt.append(hinweis('Die öffentlichen Seiten der Gruppen konnten nicht geladen werden. Bitte später noch einmal versuchen.', 'fehler'));
    }
  });

  if (!teile[0]) {
    zeichneUebersicht(null, true);
    await listeLaden;
    return;
  }
  // Seite einer Gruppe: die Liste wird für die Links [[…]] gebraucht
  await listeLaden;
  await zeigeGruppenSeite(teile[0].toLowerCase(), teile[1] || '');
}
