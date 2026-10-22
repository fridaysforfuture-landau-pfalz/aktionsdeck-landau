// js/views/protokoll.js
// Reiter „Dokumentation“ (Kennung „protokoll“, Etappe 8). Aufbau seit 8.3a:
// Kopf mit „+ Protokoll“, zwei Spalten (links Suche und Umschalter Protokolle · Reden, rechts TOP-Sammlung,
// js/views/tops.js), gemeinsame Entwürfe (seit 0.30.4), die zwei neuesten Protokolle, darunter das Formular
// (direkt im Inhalt, kein Fenster), darunter die älteren. Der Protokolltext wird wie im Dokument gezeigt
// (TOPs fett in Gruppenfarbe, Stichpunkte eingerückt).
// Klick auf ein Protokoll öffnet es im Detailbereich (PC rechts, Handy Vollbild mit „← Zurück“).
// Das Formular bleibt dabei offen, so lässt sich aus alten Protokollen kopieren.
// Im Detail: „Protokoll kopieren“, „Im Dokument bearbeiten“ (nur wenn es im Dokument steht),
// solange nicht im Dokument: „Bearbeiten“ und „Ins Dokument übernehmen“.
// Protokolle werden nie gelöscht (das Skript sperrt es). Reden kommen mit 8.6.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { toast } from '../ui/toast.js';
import { zeitText } from './material-rechnen.js';
import { istWahr } from '../schema.js';
import { normDatum, datumText, kurz } from './todos-rechnen.js';
import { sichereUrl } from './kalender-rechnen.js';
import {
  artText, imDokument, sortiereProtokolle, nachJahr, passtSuche, kopierText, einfuegeHinweis
} from './protokoll-rechnen.js';
import { baueProtokollFormular, entwurfInfo, verwirfEntwurf } from './protokoll-eintrag.js';
import { baueTopSammlung, offeneTops } from './tops.js';

const NEUESTE = 2;

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function kopieren(text) {
  const fehlt = function () { toast('Kopieren hat nicht geklappt. Bitte den Text markieren.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('Protokoll kopiert.'); }, fehlt);
  } else {
    fehlt();
  }
}

// Link als Knopf, öffnet in einem neuen Tab
function linkKnopf(text, url) {
  return el('a', {
    class: 'knopf knopf-hell', href: url, target: '_blank', rel: 'noopener noreferrer', text: text
  });
}

// Protokolltext wie im Dokument: TOP-Zeilen („1. Titel“, „Sonstiges“) als fette Überschrift in Gruppenfarbe,
// Stichpunkte („- “, Tabs davor = tiefer) als Liste, übrige Zeilen als Absatz. Nur textContent.
function textAnsicht(text) {
  const box = el('div', { class: 'protokoll-text pk-ansicht' });
  let listen = [];   // offene Listen je Ebene
  String(text).split(/\r?\n/).forEach(function (roh) {
    const zeile = roh.replace(/\s+$/, '');
    const m = /^(\t*)- ?(.*)$/.exec(zeile);
    if (m && zeile.indexOf('-') === m[1].length) {
      const ebene = Math.min(m[1].length, 6);
      if (!listen.length) {
        listen = [el('ul', { class: 'pk-ansicht-liste' })];
        box.append(listen[0]);
      }
      while (listen.length - 1 < ebene) {
        const unter = el('ul', { class: 'pk-ansicht-liste' });
        const letzter = listen[listen.length - 1].lastElementChild;
        (letzter || listen[listen.length - 1]).append(unter);
        listen.push(unter);
      }
      listen.length = ebene + 1;
      listen[ebene].append(el('li', { class: m[2].indexOf('👉') === 0 ? 'pk-ansicht-beschluss' : '', text: m[2] }));
      return;
    }
    listen = [];
    if (!zeile) return;
    const top = /^\d+\.[ \t]*\S/.test(zeile) || /^Sonstiges[ \t]*:?[ \t]*$/i.test(zeile);
    // 👉 Beschluss: hervorgehoben (8.4)
    const klasse = top ? 'pk-ansicht-top' : 'pk-ansicht-absatz' + (zeile.indexOf('👉') === 0 ? ' pk-ansicht-beschluss' : '');
    box.append(el(top ? 'h4' : 'p', { class: klasse, text: zeile }));
  });
  return box;
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);
  if (ctx.detail) schliesseDetail(ctx.detail);

  const cacheKey = s.gruppe_id + ':protokoll';
  let daten = { protokolle: [], projekte: [], veranstaltungen: [], personen: [], vorlagen: [] };
  let tops = [];
  let topsFehler = '';
  // Modus der Gruppe (dokument | extern | keins). Nur im Speicher, nicht im Gerät abgelegt.
  let info = null;
  let projektTitel = {};
  let veranstTitel = {};
  let meta = null;
  let offline = false;
  let formular = null;     // offenes Formular (baueProtokollFormular)

  // ---- Bedienelemente ----

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen (Titel, Text, Anwesend) …', 'aria-label': 'Suchen'
  });
  const sammlung = baueTopSammlung({
    ctx: ctx, token: s.token,
    holeTops: function () { return tops; },
    neuLaden: function () { return ladeTops(false); },
    fehlerText: function () { return topsFehler; }
  });
  const neuKnopf = el('button', { class: 'knopf', type: 'button', text: '+ Protokoll', onclick: function () { formularOeffnen(null); } });
  const boxEntwuerfe = el('div', { class: 'protokoll-liste' });
  const boxNeueste = el('div', { class: 'protokoll-liste' });
  const boxForm = el('div', { class: 'protokoll-formplatz' });
  const boxRest = el('div', { class: 'protokoll-liste' });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Dokumentation' }),
      el('div', { class: 'kopf-knoepfe' }, neuKnopf)
    ),
    el('div', { class: 'doku-kopf' },
      el('div', { class: 'doku-links' },
        suche,
        el('div', { class: 'doku-umschalter', role: 'group', 'aria-label': 'Protokolle oder Reden' },
          el('button', { class: 'knopf', type: 'button', text: 'Protokolle', 'aria-pressed': 'true' }),
          el('button', {
            class: 'knopf knopf-hell', type: 'button', text: 'Reden (bald)', disabled: '',
            title: 'Das Reden-Archiv kommt mit Schritt 8.6.'
          })
        ),
        status
      ),
      el('section', { class: 'karte top-karte' }, el('h2', { text: 'TOPs fürs nächste Plenum' }), sammlung.el)
    ),
    boxEntwuerfe,
    boxNeueste,
    boxForm,
    boxRest
  ));

  // ---- Hilfen ----

  function finde(id) {
    return daten.protokolle.find(function (p) { return String(p.id) === String(id); }) || null;
  }

  function bezugText(p) {
    const teile = [];
    const pid = txt(p.projekt_id);
    const vid = txt(p.veranstaltung_id);
    if (pid) teile.push(projektTitel[pid] || 'Projekt');
    if (vid) teile.push('📅 ' + (veranstTitel[vid] || 'Veranstaltung'));
    return teile.join(' · ');
  }

  function istEntwurf(p) {
    return istWahr(p.entwurf) && !imDokument(p);
  }

  function dokumentMarke(p) {
    if (istEntwurf(p)) {
      return el('span', { class: 'protokoll-marke protokoll-entwurf', text: '✎ Entwurf von ' + (txt(p.geaendert_von) || 'unbekannt') +
        (isNaN(new Date(p.geaendert_am).getTime()) ? '' : ', ' + zeitText(p.geaendert_am).slice(0, -3)) });
    }
    if (imDokument(p)) return el('span', { class: 'protokoll-marke protokoll-ok', text: '✔ im Dokument' });
    // Nur bei Gruppen mit Dokument ist „noch nicht im Dokument“ eine Warnung
    if (info && info.modus === 'dokument') {
      return el('span', { class: 'protokoll-marke protokoll-warn', text: '⚠ noch nicht im Dokument' });
    }
    return null;
  }

  // ---- Liste ----

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? daten.protokolle.length + (daten.protokolle.length === 1 ? ' Protokoll' : ' Protokolle') +
        ' · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  function zeileVon(p) {
    const zeile1 = [normDatum(p.datum) ? datumText(p.datum) : '', artText(p.art), bezugText(p)]
      .filter(Boolean).join(' · ');
    return el('li', null,
      el('button', {
        class: 'dash-todo protokoll-zeile', type: 'button',
        onclick: function () { lesen(p); }
      },
        zeile1 ? el('span', { class: 'leise', text: zeile1 }) : null,
        el('strong', { text: txt(p.titel) || 'Protokoll' }),
        txt(p.teilnehmende) ? el('span', { class: 'leise', text: 'Anwesend: ' + kurz(p.teilnehmende, 80) }) : null,
        dokumentMarke(p)
      )
    );
  }

  function zeichne() {
    statusZeigen();
    leeren(boxEntwuerfe);
    leeren(boxNeueste);
    leeren(boxRest);
    if (!meta) return;
    const entwuerfe = sortiereProtokolle(daten.protokolle.filter(function (p) {
      return istEntwurf(p) && passtSuche(p, suche.value);
    }));
    if (entwuerfe.length) {
      boxEntwuerfe.append(
        el('h2', { class: 'liste-titel protokoll-jahr', text: 'Gemeinsame Entwürfe (' + entwuerfe.length + ')' }),
        el('ul', { class: 'dash-todo-liste' }, ...entwuerfe.map(zeileVon))
      );
    }
    const fertige = daten.protokolle.filter(function (p) { return !istEntwurf(p); });
    if (!fertige.length) {
      boxNeueste.append(el('p', { class: 'leise', text: 'Noch keine Protokolle. Mit „+ Protokoll“ schreibst du das erste.' }));
      return;
    }
    const liste = sortiereProtokolle(fertige.filter(function (p) { return passtSuche(p, suche.value); }));
    if (!liste.length) {
      boxNeueste.append(el('p', { class: 'leise', text: 'Kein Protokoll passt zur Suche.' }));
      return;
    }
    const oben = liste.slice(0, NEUESTE);
    const rest = liste.slice(NEUESTE);
    boxNeueste.append(
      el('h2', { class: 'liste-titel protokoll-jahr', text: txt(suche.value) ? 'Treffer' : 'Neueste Protokolle' }),
      el('ul', { class: 'dash-todo-liste' }, ...oben.map(zeileVon))
    );
    if (!rest.length) return;
    boxRest.append(el('h2', { class: 'liste-titel protokoll-jahr', text: txt(suche.value) ? 'Weitere Treffer' : 'Ältere Protokolle' }));
    nachJahr(rest).forEach(function (g) {
      boxRest.append(
        el('h3', { class: 'teil-titel-klein', text: g.jahr + ' (' + g.liste.length + ')' }),
        el('ul', { class: 'dash-todo-liste' }, ...g.liste.map(zeileVon))
      );
    });
  }

  // ---- Lesen im Detailbereich ----

  // meldung (freiwillig): Text oben, zum Beispiel nach dem Speichern
  function lesen(p, meldung) {
    const dl = el('dl', { class: 'detail-liste' });
    function paar(name, wert, mehrzeilig) {
      if (!txt(wert)) return;
      dl.append(el('dt', { text: name }), el('dd', { class: mehrzeilig ? 'notiz' : '', text: txt(wert) }));
    }
    paar('Datum', normDatum(p.datum) ? datumText(p.datum) : '');
    paar('Art', artText(p.art));
    paar('Projekt', txt(p.projekt_id) ? (projektTitel[txt(p.projekt_id)] || 'Projekt (nicht mehr da)') : '');
    paar('Veranstaltung', txt(p.veranstaltung_id) ? (veranstTitel[txt(p.veranstaltung_id)] || 'Veranstaltung (nicht mehr da)') : '');
    paar('Rollen', p.rollen, true);
    paar('Anwesend', p.teilnehmende, true);

    const inhalt = el('div', { class: 'protokoll-lesen' });
    if (meldung) inhalt.append(el('p', { class: 'fehler', role: 'alert', text: meldung }));
    inhalt.append(dl);
    const marke = dokumentMarke(p);
    if (marke) inhalt.append(el('p', null, marke));
    inhalt.append(
      el('h3', { class: 'teil-titel-klein', text: 'Protokolltext' }),
      txt(p.text)
        ? textAnsicht(p.text)
        : el('p', { class: 'leise', text: 'Kein Protokolltext.' })
    );

    // Feste Hinweise
    const modus = info ? info.modus : '';
    const hinweis = einfuegeHinweis(modus, s.kurzname);
    if (hinweis && (modus !== 'dokument' || imDokument(p))) inhalt.append(el('p', { class: 'leise', text: hinweis }));
    if (imDokument(p)) {
      inhalt.append(el('p', { class: 'leise', text:
        'Die App zeigt den Stand beim Speichern. Was jemand später im Dokument ändert, kommt nicht zurück in die App.' }));
    }
    if (!info) {
      inhalt.append(el('p', { class: 'leise', text:
        'Ob deine Gruppe ein Dokument hat, kann die App gerade nicht prüfen (keine Verbindung).' }));
    }

    const knoepfe = el('div', { class: 'form-knoepfe protokoll-knoepfe' });
    const link = info ? sichereUrl(info.link) : '';
    if (imDokument(p) && modus === 'dokument' && link) knoepfe.append(linkKnopf('Im Dokument bearbeiten', link));
    if (modus === 'extern' && link) knoepfe.append(linkKnopf('Pad öffnen', link));
    knoepfe.append(el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Protokoll kopieren',
      onclick: function () { kopieren(kopierText(p)); }
    }));
    if (istEntwurf(p)) {
      knoepfe.append(el('button', {
        class: 'knopf', type: 'button', text: 'Weiterschreiben',
        onclick: function () { formularOeffnen(p); }
      }));
      inhalt.append(el('p', { class: 'leise', text: 'Gemeinsamer Entwurf: Alle in der Gruppe können ihn weiterschreiben. ' +
        'Ins Dokument kommt er mit „Speichern“ im Formular.' }));
    } else if (!imDokument(p)) {
      knoepfe.append(el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
        onclick: function () { formularOeffnen(p); }
      }));
      if (modus === 'dokument') {
        const ins = el('button', {
          class: 'knopf', type: 'button', text: 'Ins Dokument übernehmen',
          onclick: function () { insDokument(p, ins); }
        });
        knoepfe.append(ins);
      }
    }
    inhalt.append(knoepfe);
    zeigeDetail(ctx.detail, txt(p.titel) || 'Protokoll', inhalt, null, true);
  }

  async function insDokument(p, knopf) {
    knopf.disabled = true;
    knopf.textContent = 'Übernehme …';
    try {
      const r = await api('protokollInsDokument', { id: p.id }, s.token);
      if (r && r.im_dokument) {
        toast(r.hinweis || 'Protokoll im Dokument ergänzt.');
        await laden(false);
        lesen(finde(p.id) || r.eintrag || p);
        return;
      }
      toast((r && r.hinweis) || 'Das Dokument konnte nicht ergänzt werden.');
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'nicht_gefunden') {
        schliesseDetail(ctx.detail);
        laden(false);
      }
      toast(e.message);
    }
    knopf.disabled = false;
    knopf.textContent = 'Ins Dokument übernehmen';
  }

  // ---- Formular im Inhalt ----

  function zumFormular() {
    if (boxForm.scrollIntoView) boxForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function formularZu() {
    formular = null;
    leeren(boxForm);
    neuKnopf.hidden = false;
  }

  function formularBauen(p, ausEntwurf) {
    leeren(boxForm);
    formular = baueProtokollFormular({
      ctx: ctx, token: s.token, gruppeId: s.gruppe_id, kurzname: s.kurzname,
      daten: daten, tops: offeneTops(tops), eintrag: p || null, ausEntwurf: ausEntwurf,
      beiZu: formularZu,
      beiZwischenspeichern: function () { laden(false); },
      nachSpeichern: async function (eintrag, res) {
        if (res && res.im_dokument) toast('Protokoll gespeichert und im Dokument ergänzt.');
        else if (res) toast('Protokoll gespeichert.');
        await Promise.all([laden(false), ladeTops(false)]);
        const neu = finde(eintrag.id) || eintrag;
        // Nicht im Dokument: Detail mit Grund und „Ins Dokument übernehmen“ bzw. „Protokoll kopieren“
        if (res && !res.im_dokument) lesen(neu, 'Das Protokoll ist gespeichert, steht aber nicht im Dokument. ' + txt(res.hinweis));
        else if (!res) lesen(neu);
      }
    });
    boxForm.append(formular.el);
    neuKnopf.hidden = true;
    zumFormular();
  }

  // Entwurf vorhanden: Frage direkt im Inhalt
  function entwurfFragen(e) {
    leeren(boxForm);
    neuKnopf.hidden = true;
    boxForm.append(el('section', { class: 'karte pk-entwurf-frage' },
      el('h2', { text: 'Entwurf' + e.wann + ' fortsetzen?' }),
      el('p', { text: 'Auf diesem Gerät gibt es einen Entwurf: „' + (e.titel || 'ohne Titel') + '“.' }),
      el('div', { class: 'form-knoepfe' },
        el('button', {
          class: 'knopf', type: 'button', text: 'Fortsetzen',
          onclick: function () {
            // Gehört der Entwurf zu einem gemeinsamen Entwurf, wird dieser weitergeschrieben
            const g = e.serverId ? finde(e.serverId) : null;
            formularBauen(g && istEntwurf(g) ? g : null, true);
          }
        }),
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Verwerfen',
          onclick: function () {
            if (!window.confirm('Den Entwurf wirklich verwerfen? Das geht nicht rückgängig.')) return;
            verwirfEntwurf(s.gruppe_id);
            formularBauen(null, false);
          }
        }),
        el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen', onclick: formularZu })
      )
    ));
    zumFormular();
  }

  // p = null: neues Protokoll. Sonst ändern (nur solange nicht im Dokument).
  function formularOeffnen(p) {
    if (formular) {
      if (!p && formular.istNeu) { zumFormular(); return; }
      if (formular.hatAenderungen() && !window.confirm(formular.istNeu
        ? 'Das offene Formular wird geschlossen. Dein Entwurf bleibt auf diesem Gerät gesichert. Weiter?'
        : 'Das offene Formular hat ungespeicherte Änderungen. Trotzdem schließen?')) return;
      formular.schliessen();
    }
    // Am Handy verdeckt das Detail den Inhalt: erst schließen
    if (p && ctx.detail && window.matchMedia('(max-width: 959px)').matches) schliesseDetail(ctx.detail);
    const e = p ? null : entwurfInfo(s.gruppe_id);
    if (e) entwurfFragen(e);
    // Gemeinsamer Entwurf: eine eigene, neuere Fassung auf dem Gerät wird mit übernommen
    else formularBauen(p, !!p && istEntwurf(p));
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    if (!neu.protokolle) neu.protokolle = [];
    if (!neu.projekte) neu.projekte = [];
    if (!neu.veranstaltungen) neu.veranstaltungen = [];
    if (!neu.personen) neu.personen = [];
    if (!neu.vorlagen) neu.vorlagen = [];
    daten = neu;
    meta = m;
    offline = false;
    projektTitel = {};
    veranstTitel = {};
    daten.projekte.forEach(function (p) { projektTitel[String(p.id)] = txt(p.titel); });
    daten.veranstaltungen.forEach(function (v) { veranstTitel[String(v.id)] = txt(v.titel); });
    zeichne();
  }

  // Modus der Gruppe, einmal je Aufruf des Reiters. Ohne Verbindung bleibt er unbekannt.
  async function infoLaden() {
    try {
      info = await api('protokollInfo', {}, s.token);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      info = null;
    }
  }

  // TOPs getrennt laden: Fehlt der Tab noch, bleibt der Rest des Reiters nutzbar
  async function ladeTops(zuerstCache) {
    try {
      await ladeMitCache(
        s.gruppe_id + ':tops',
        async function () {
          const r = await api('list', { tabelle: 'TOPs' }, s.token);
          return { tops: r.zeilen || [] };
        },
        function (d) {
          tops = d.tops || [];
          topsFehler = '';
          sammlung.zeichne();
          if (formular) formular.setzeTops(offeneTops(tops));
        },
        zuerstCache
      );
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      topsFehler = 'Die TOP-Sammlung ist noch nicht eingerichtet oder gerade nicht erreichbar (' + e.message + ').';
      sammlung.zeichne();
    }
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        cacheKey,
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Protokolle', 'Projekte', 'Veranstaltungen', 'Personen', 'Termin_Vorlagen']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            protokolle: t.Protokolle || [],
            projekte: t.Projekte || [],
            veranstaltungen: t.Veranstaltungen || [],
            personen: t.Personen || [],
            vorlagen: t.Termin_Vorlagen || []
          };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        offline = true;
        statusZeigen();
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  ctx.setzeRefresh(function () { return Promise.all([laden(false), ladeTops(false)]); });
  await Promise.all([infoLaden(), laden(true), ladeTops(true)]);
  // Marken „noch nicht im Dokument“ hängen vom Modus ab
  zeichne();
}
