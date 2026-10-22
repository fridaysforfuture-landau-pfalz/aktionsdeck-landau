// js/views/protokoll.js
// Reiter „Protokoll“ (Etappe 8, Schritt 8.2): Liste der Protokolle, neueste zuerst, nach Jahr gruppiert.
// Suche (Titel, Text, Anwesend), Filter Art und Filter Projekt/Veranstaltung.
// Klick öffnet das Lesefenster: alle Felder, „Protokoll kopieren“, „Im Dokument bearbeiten“ (nur wenn es
// im Dokument steht), solange nicht im Dokument: „Bearbeiten“ und „Ins Dokument übernehmen“.
// „+ Protokoll“ und „Bearbeiten“ öffnen das Formular aus protokoll-eintrag.js (seit 8.3).
// Der Reiter heißt in der Anzeige „Dokumentation“ (Protokolle und ab 8.6 Reden), die Kennung bleibt „protokoll“.
// Protokolle werden nie gelöscht (das Skript sperrt es). Reden kommen mit 8.6.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeFenster } from '../ui/fenster.js';
import { toast } from '../ui/toast.js';
import { zeitText } from './material-rechnen.js';
import { normDatum, datumText, kurz } from './todos-rechnen.js';
import { sichereUrl } from './kalender-rechnen.js';
import {
  ARTEN, artText, imDokument, sortiereProtokolle, nachJahr, passtSuche, bezugSchluessel, kopierText, einfuegeHinweis
} from './protokoll-rechnen.js';
import { zeigeProtokollFormular } from './protokoll-eintrag.js';

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

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  const cacheKey = s.gruppe_id + ':protokoll';
  let daten = { protokolle: [], projekte: [], veranstaltungen: [], personen: [], vorlagen: [] };
  // Modus der Gruppe (dokument | extern | keins). Nur im Speicher, nicht im Gerät abgelegt.
  let info = null;
  let projektTitel = {};
  let veranstTitel = {};
  let meta = null;
  let offline = false;

  // ---- Bedienelemente ----

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen (Titel, Text, Anwesend) …', 'aria-label': 'Suchen'
  });
  const artWahl = el('select', { class: 'feld', 'aria-label': 'Art' },
    el('option', { value: '', text: 'Alle Arten' }),
    ...ARTEN.map(function (a) { return el('option', { value: a.wert, text: a.label }); })
  );
  const bezugWahl = el('select', { class: 'feld', 'aria-label': 'Projekt oder Veranstaltung' });
  const box = el('div', { class: 'protokoll-liste' });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Dokumentation' }),
      el('div', { class: 'kopf-knoepfe' },
        el('button', { class: 'knopf', type: 'button', text: '+ Protokoll', onclick: function () { formularOeffnen(null); } })
      )
    ),
    el('div', { class: 'filterzeile filter-todos' }, suche, artWahl, bezugWahl),
    status,
    box
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

  // Auswahl „Projekt oder Veranstaltung“: nur, was in Protokollen vorkommt
  function bezugAufbauen() {
    const alt = bezugWahl.value;
    leeren(bezugWahl);
    bezugWahl.append(el('option', { value: '', text: 'Alle Projekte und Veranstaltungen' }));
    const da = {};
    daten.protokolle.forEach(function (p) { bezugSchluessel(p).forEach(function (k) { da[k] = true; }); });
    const eintraege = Object.keys(da).map(function (k) {
      const id = k.slice(2);
      return k.charAt(0) === 'p'
        ? { wert: k, label: 'Projekt: ' + (projektTitel[id] || 'Projekt') }
        : { wert: k, label: '📅 ' + (veranstTitel[id] || 'Veranstaltung') };
    }).sort(function (a, b) { return a.label.localeCompare(b.label, 'de'); });
    eintraege.forEach(function (x) { bezugWahl.append(el('option', { value: x.wert, text: x.label })); });
    bezugWahl.value = da[alt] ? alt : '';
    bezugWahl.hidden = !eintraege.length;
  }

  function dokumentMarke(p) {
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

  function zeichne() {
    statusZeigen();
    leeren(box);
    if (!meta) return;
    if (!daten.protokolle.length) {
      box.append(el('p', { class: 'leise', text:
        'Noch keine Protokolle. Mit „+ Protokoll“ schreibst du das erste.' }));
      return;
    }
    const art = artWahl.value;
    const bezug = bezugWahl.value;
    const liste = sortiereProtokolle(daten.protokolle.filter(function (p) {
      if (art && txt(p.art).toLowerCase() !== art) return false;
      if (bezug && bezugSchluessel(p).indexOf(bezug) < 0) return false;
      return passtSuche(p, suche.value);
    }));
    if (!liste.length) {
      box.append(el('p', { class: 'leise', text: 'Kein Protokoll passt zu Suche und Filter.' }));
      return;
    }
    nachJahr(liste).forEach(function (g) {
      box.append(el('h2', { class: 'liste-titel protokoll-jahr', text: g.jahr + ' (' + g.liste.length + ')' }));
      box.append(el('ul', { class: 'dash-todo-liste' }, ...g.liste.map(function (p) {
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
      })));
    });
  }

  // ---- Lesefenster ----

  // meldung (freiwillig): Text oben im Fenster, zum Beispiel nach dem Speichern
  function lesen(p, meldung) {
    let fenster = null;
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
    paar('Geschrieben', [txt(p.erstellt_von), txt(p.erstellt_am) ? zeitText(p.erstellt_am) : ''].filter(Boolean).join(', '));

    const inhalt = el('div', { class: 'protokoll-lesen' });
    if (meldung) inhalt.append(el('p', { class: 'fehler', role: 'alert', text: meldung }));
    inhalt.append(dl);
    const marke = dokumentMarke(p);
    if (marke) inhalt.append(el('p', null, marke));
    inhalt.append(
      el('h3', { class: 'teil-titel-klein', text: 'Protokolltext' }),
      txt(p.text)
        ? el('div', { class: 'notiz protokoll-text', text: String(p.text) })
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
    if (!imDokument(p)) {
      knoepfe.append(el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
        onclick: function () { fenster.schliessen(); formularOeffnen(p); }
      }));
      if (modus === 'dokument') {
        const ins = el('button', {
          class: 'knopf', type: 'button', text: 'Ins Dokument übernehmen',
          onclick: function () { insDokument(p, ins, fenster); }
        });
        knoepfe.append(ins);
      }
    }
    inhalt.append(knoepfe);
    fenster = zeigeFenster(txt(p.titel) || 'Protokoll', inhalt, null, { aussenKlick: true });
  }

  async function insDokument(p, knopf, fenster) {
    knopf.disabled = true;
    knopf.textContent = 'Übernehme …';
    try {
      const r = await api('protokollInsDokument', { id: p.id }, s.token);
      if (r && r.im_dokument) {
        fenster.schliessen();
        toast(r.hinweis || 'Protokoll im Dokument ergänzt.');
        await laden(false);
        const neu = finde(p.id);
        if (neu) lesen(neu);
        return;
      }
      toast((r && r.hinweis) || 'Das Dokument konnte nicht ergänzt werden.');
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'nicht_gefunden') {
        fenster.schliessen();
        laden(false);
      }
      toast(e.message);
    }
    knopf.disabled = false;
    knopf.textContent = 'Ins Dokument übernehmen';
  }

  // Formular (protokoll-eintrag.js): neu (p = null) oder ändern (nur solange nicht im Dokument)
  function formularOeffnen(p) {
    zeigeProtokollFormular({
      ctx: ctx, token: s.token, gruppeId: s.gruppe_id, kurzname: s.kurzname,
      daten: daten, eintrag: p || null,
      nachSpeichern: async function (eintrag, res) {
        if (res && res.im_dokument) toast('Protokoll gespeichert und im Dokument ergänzt.');
        else if (res) toast('Protokoll gespeichert.');
        await laden(false);
        const neu = finde(eintrag.id) || eintrag;
        if (!res) { lesen(neu); return; }
        // Nicht im Dokument: Lesefenster mit Grund und den Knöpfen „Ins Dokument übernehmen“ oder „Protokoll kopieren“
        if (!res.im_dokument) lesen(neu, 'Das Protokoll ist gespeichert, steht aber nicht im Dokument. ' + txt(res.hinweis));
      }
    });
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
    bezugAufbauen();
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
  artWahl.addEventListener('change', zeichne);
  bezugWahl.addEventListener('change', zeichne);
  ctx.setzeRefresh(function () { return laden(false); });
  bezugAufbauen();
  await Promise.all([infoLaden(), laden(true)]);
  // Marken „noch nicht im Dokument“ hängen vom Modus ab
  zeichne();
}
