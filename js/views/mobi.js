// js/views/mobi.js
// Reiter Mobi: alle Beiträge der Gruppe, über alle Projekte und Veranstaltungen.
// Ansichten: Liste (Kacheln in Spalten nach Kanalgruppe, darunter "Veröffentlicht, letzte 2 Wochen"), Kanban
// und Zeitstrahl (je Projekt oder Veranstaltung eine Bahn je Kanal, js/views/mobi-zeitstrahl.js).
// Filter, Sammelbearbeitung (Status, Verantwortliche), Archiv, Zählzeile mit Wochenzahl.
// Die Ansicht bleibt beim Reiterwechsel erhalten (Merker außerhalb von render).

import { el, leeren, txt } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { zeigeListe } from '../ui/table.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { zeitText } from './material-rechnen.js';
import { normDatum, datumText, heuteIso, wochenEnde, istMeins, kurz, kommentarMarke } from './todos-rechnen.js';
import { addTage, setzeMobiKalender } from './kalender-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';
import {
  kanaeleFuer, kanalInfo, FORMAT_TEXT, KANALGRUPPEN, kanaeleDerGruppe, SCHRITTE_STANDARD, SCHRITTE_VIDEO
} from '../kanaele.js';
import {
  STATI, statusKey, statusText, istVeroeffentlicht, faelligStatus,
  sortiereBeitraege, datumZeile, istArchiv, nachbarStatus, mobiKommentarZahlen, mobiWarnungen
} from './mobi-rechnen.js';
import { zeigeBeitragFormular } from './mobi-eintrag.js';
import { baueSpalten, baueKachelFlaeche } from './mobi-kachel.js';
import { zeigeSammlung } from './mobi-sammlung.js';
import { nimmMobiVorgabe } from './mobi-todo.js';
import { baueZeitstrahl } from './mobi-zeitstrahl.js';
import { namenMitRollen, ladeTeamKlein } from './team-namen.js';

// Bleibt beim Reiterwechsel erhalten. Neue Anmeldung (anderes Token) = zurückgesetzt.
let merk = { token: '', ansicht: 'liste' };

export async function render(container, ctx) {
  const s = ctx.session;
  ladeTeamKlein(s);   // Team-Namen für die Vorschläge bei „Verantwortlich“ (9.7)
  leeren(container);

  if (merk.token !== s.token) merk = { token: s.token, ansicht: 'liste' };
  // Vorgabe aus einem Sammel-ToDo (Projekt, Kanal, Ansicht). Wird nur einmal benutzt.
  const vorgabe = nimmMobiVorgabe();
  let vorgabeBezug = '';
  if (vorgabe) {
    merk.ansicht = vorgabe.ansicht || merk.ansicht;
    vorgabeBezug = vorgabe.projekt ? 'p:' + vorgabe.projekt : '';
  }
  let kanbanScroll = 0;     // Seitwärts-Stand im Kanban (bleibt beim Aktualisieren erhalten)

  const cacheKey = s.gruppe_id + ':mobi';
  let daten = { mobi: [], projekte: [], veranstaltungen: [], todos: [], kommentare: [] };
  let kommZahl = {};        // Kommentare je Beitrag (💬-Marke)
  let projektTitel = {};
  let projektOffen = {};
  let veranstTitel = {};
  let meta = null;
  let offline = false;
  let archivModus = false;
  let auswahlModus = false;
  let gewaehlt = {};
  let sichtbareOffene = [];
  const arbeitet = {};

  // ---- Bedienelemente ----

  const zahlen = el('p', { class: 'dash-zahlen' });
  const warnBox = el('div', { class: 'mobi-warnungen' });
  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const kanalWahl = el('select', { class: 'feld', 'aria-label': 'Kanal' },
    el('option', { value: '', text: 'Alle Kanäle' }));
  // Zuerst die Kanalgruppen (Wert "g:<kennung>"), danach die einzelnen Kanäle
  KANALGRUPPEN.filter(function (g) {
    return g.id !== 'sonstiges' && kanaeleDerGruppe(g.id, s.kurzname).length;
  }).forEach(function (g) {
    kanalWahl.append(el('option', { value: 'g:' + g.id, text: g.name + ' (alle)' }));
  });
  kanaeleFuer(s.kurzname).forEach(function (k) {
    kanalWahl.append(el('option', { value: k.id, text: k.name }));
  });
  if (vorgabe && vorgabe.kanal) kanalWahl.value = vorgabe.kanal;
  const bezugWahl = el('select', { class: 'feld', 'aria-label': 'Projekt oder Veranstaltung' });
  const werWahl = el('select', { class: 'feld', 'aria-label': 'Verantwortlich' });
  const statusWahl = el('select', { class: 'feld', 'aria-label': 'Status' },
    el('option', { value: '', text: 'Alle Status' }),
    ...STATI.filter(function (x) { return x !== 'veroeffentlicht'; }).map(function (x) {
      return el('option', { value: x, text: statusText(x) });
    })
  );
  const meine = el('input', { type: 'checkbox' });
  const meineFeld = el('label', { class: 'formfeld-bool' }, meine, el('span', { text: 'Nur meine' }));

  const listenKnopf = el('button', {
    class: 'knopf', type: 'button', text: 'Liste',
    onclick: function () { ansichtSetzen('liste'); }
  });
  const kanbanKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Kanban',
    onclick: function () { ansichtSetzen('kanban'); }
  });
  const zeitKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Zeitstrahl',
    onclick: function () { ansichtSetzen('zeitstrahl'); }
  });
  // Kalender: öffnet den Reiter Kalender als Mobi-Kalender (Beiträge, Aktionen, Deadlines)
  const kalenderKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Kalender',
    onclick: function () {
      setzeMobiKalender();
      location.hash = '#/g/' + encodeURIComponent(s.kurzname) + '/kalender';
    }
  });
  const archivKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Archiv',
    onclick: function () {
      archivModus = !archivModus;
      auswahlModus = false;
      gewaehlt = {};
      bezugAufbauen();
      zeichne();
    }
  });
  const mehrereKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Mehrere bearbeiten',
    onclick: function () {
      auswahlModus = true;
      archivModus = false;
      gewaehlt = {};
      zeichne();
    }
  });
  const neuKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: '+ Einzelner Beitrag',
    onclick: function () { neuerBeitrag(); }
  });
  const sammelKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Beiträge planen',
    onclick: function () { neueBeitraege(); }
  });

  const boxListe = el('div');
  const kopfFertig = el('h2', { class: 'liste-titel' });
  const boxFertig = el('div', { class: 'liste-erledigt' });
  const boxKanban = el('div');
  const boxZeit = el('div', { class: 'mobi-zeit-liste' });

  const zaehler = el('strong');
  const okKnopf = el('button', {
    class: 'knopf', type: 'button', text: 'Bearbeiten', onclick: function () { sammelDialog(); }
  });
  const leiste = el('div', { class: 'auswahl-leiste' },
    zaehler,
    el('div', { class: 'form-knoepfe' },
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen',
        onclick: function () { auswahlModus = false; gewaehlt = {}; zeichne(); }
      }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Alle wählen',
        onclick: function () {
          sichtbareOffene.forEach(function (b) { gewaehlt[b.id] = true; });
          zeichne();
        }
      }),
      okKnopf
    )
  );
  leiste.hidden = true;
  boxKanban.hidden = true;
  boxZeit.hidden = true;
  kopfFertig.hidden = true;
  boxFertig.hidden = true;

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile mobi-kopf' },
      el('h1', { text: 'Mobi' }),
      el('div', { class: 'kopf-knoepfe' }, archivKnopf, mehrereKnopf, sammelKnopf, neuKnopf)
    ),
    el('div', { class: 'mobi-ansicht' }, listenKnopf, kanbanKnopf, zeitKnopf, kalenderKnopf),
    zahlen,
    warnBox,
    el('div', { class: 'filterzeile filter-todos' },
      suche, kanalWahl, bezugWahl, werWahl, statusWahl, meineFeld),
    status,
    boxListe,
    kopfFertig,
    boxFertig,
    boxKanban,
    boxZeit,
    leiste
  ));

  // ---- Hilfen ----

  function finde(id) {
    return daten.mobi.find(function (b) { return String(b.id) === String(id); }) || null;
  }

  function projektZu(b) {
    const id = txt(b.projekt_id);
    return !!id && projektOffen[id] === false;
  }

  function bezugText(b) {
    const p = txt(b.projekt_id);
    const v = txt(b.veranstaltung_id);
    const teile = [];
    if (p) teile.push(projektTitel[p] || 'Projekt');
    if (v) teile.push('📅 ' + (veranstTitel[v] || 'Veranstaltung'));
    return teile.join(' · ');
  }

  function personen() {
    const liste = [];
    const merke = function (n) {
      const k = txt(n);
      if (k && liste.indexOf(k) < 0) liste.push(k);
    };
    merke(getName());
    daten.mobi.forEach(function (b) { merke(b.verantwortlich); });
    daten.todos.forEach(function (t) { merke(t.verantwortlich); });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  // Auswahl "Gehört zu" im Formular: offene Projekte und kommende Veranstaltungen
  function bezuege() {
    const h = heuteIso();
    const p = daten.projekte.filter(function (x) { return !istAbgeschlossen(x); })
      .sort(function (a, b) { return txt(a.titel).localeCompare(txt(b.titel), 'de'); })
      .map(function (x) { return { wert: 'p:' + x.id, label: 'Projekt: ' + txt(x.titel) }; });
    const v = daten.veranstaltungen.filter(function (x) {
      const d = normDatum(x.datum_ende) || normDatum(x.datum);
      return !!d && d >= h;
    }).sort(function (a, b) { return normDatum(a.datum).localeCompare(normDatum(b.datum)); })
      .map(function (x) {
        return { wert: 'v:' + x.id, label: 'Veranstaltung: ' + txt(x.titel) + ' (' + datumText(x.datum) + ')' };
      });
    return p.concat(v);
  }

  function formOpt() {
    return {
      ctx: ctx,
      token: s.token,
      kurzname: s.kurzname,
      personen: personen,
      bezuege: bezuege(),
      neuLaden: function () { return laden(false); },
      beiFertig: function () {
        cacheSet(s.gruppe_id + ':projekte', null);
        return laden(false);
      }
    };
  }

  function beitragOeffnen(b) {
    zeigeBeitragFormular(formOpt(), b);
  }

  function neuerBeitrag() {
    if (!bezuege().length) {
      toast('Lege zuerst ein Projekt oder eine Veranstaltung an. Dort hängt der Beitrag dran.');
      return;
    }
    zeigeBeitragFormular(formOpt(), null);
  }

  // „+ Beiträge planen“ nur mit gewähltem Projekt oder gewählter Veranstaltung (Filter oben)
  function neueBeitraege() {
    const wert = bezugWahl.value;
    if (!wert) {
      toast('Wähle zuerst oben ein Projekt oder eine Veranstaltung. ' +
        'Für ein neues Projekt geht es im Reiter Projekte im Teil „Mobi“.');
      return;
    }
    const id = wert.slice(2);
    const istProjekt = wert.charAt(0) === 'p';
    const quelle = istProjekt ? daten.projekte : daten.veranstaltungen;
    const x = quelle.find(function (y) { return String(y.id) === id; });
    if (!x) {
      toast('Das gibt es nicht mehr. Bitte neu laden.');
      return;
    }
    const feld = istProjekt ? 'projekt_id' : 'veranstaltung_id';
    zeigeSammlung({
      ctx: ctx,
      token: s.token,
      kurzname: s.kurzname,
      bezug: {
        feld: feld, id: id, titel: txt(x.titel),
        datum: istProjekt ? x.aktionsdatum : x.datum,
        datumName: istProjekt ? 'Aktionsdatum' : 'Veranstaltungsdatum'
      },
      vorhandene: daten.mobi.filter(function (b) { return txt(b[feld]) === id; }),
      beiFertig: formOpt().beiFertig
    });
  }

  function cacheAuffrischen() {
    cacheSet(cacheKey, { daten: daten, stand: new Date().toISOString() });
    cacheSet(s.gruppe_id + ':projekte', null);
  }

  // ---- Filter ----

  function werAufbauen() {
    const alt = werWahl.value;
    const liste = [];
    daten.mobi.forEach(function (b) {
      const k = txt(b.verantwortlich);
      if (k && liste.indexOf(k) < 0) liste.push(k);
    });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    leeren(werWahl);
    werWahl.append(
      el('option', { value: '', text: 'Alle Verantwortlichen' }),
      el('option', { value: '__leer', text: 'Ohne Verantwortliche' })
    );
    liste.forEach(function (k) { werWahl.append(el('option', { value: k, text: k })); });
    werWahl.value = (alt === '__leer' || liste.indexOf(alt) >= 0) ? alt : '';
  }

  function bezugAufbauen() {
    const alt = bezugWahl.value;
    const keys = [];
    daten.mobi.filter(function (b) { return archivModus || !projektZu(b); }).forEach(function (b) {
      const p = txt(b.projekt_id);
      const v = txt(b.veranstaltung_id);
      if (p && keys.indexOf('p:' + p) < 0) keys.push('p:' + p);
      if (v && keys.indexOf('v:' + v) < 0) keys.push('v:' + v);
    });
    const optionen = keys.map(function (k) {
      const id = k.slice(2);
      return {
        wert: k,
        label: k.charAt(0) === 'p' ? (projektTitel[id] || 'Projekt') : '📅 ' + (veranstTitel[id] || 'Veranstaltung')
      };
    }).sort(function (a, b) { return a.label.localeCompare(b.label, 'de'); });
    leeren(bezugWahl);
    bezugWahl.append(el('option', { value: '', text: 'Alle Projekte und Veranstaltungen' }));
    optionen.forEach(function (o) { bezugWahl.append(el('option', { value: o.wert, text: o.label })); });
    const wunsch = vorgabeBezug || alt;
    bezugWahl.value = optionen.some(function (o) { return o.wert === wunsch; }) ? wunsch : '';
    vorgabeBezug = '';
  }

  function trifft(b, mitStatus) {
    const q = suche.value.trim().toLowerCase();
    if (q) {
      const heu = [b.titel, b.kanal, b.text, b.kanal_text, b.hashtags, b.verantwortlich, bezugText(b)]
        .join(' ').toLowerCase();
      if (heu.indexOf(q) < 0) return false;
    }
    if (kanalWahl.value.indexOf('g:') === 0) {
      if (kanalInfo(b.kanal).gruppe !== kanalWahl.value.slice(2)) return false;
    } else if (kanalWahl.value && kanalInfo(b.kanal).id !== kanalWahl.value) {
      return false;
    }
    if (bezugWahl.value) {
      const id = bezugWahl.value.slice(2);
      const feld = bezugWahl.value.charAt(0) === 'p' ? b.projekt_id : b.veranstaltung_id;
      if (txt(feld) !== id) return false;
    }
    const wer = txt(b.verantwortlich);
    if (werWahl.value === '__leer') {
      if (wer) return false;
    } else if (werWahl.value && wer !== werWahl.value) {
      return false;
    }
    if (mitStatus && statusWahl.value && statusKey(b) !== statusWahl.value) return false;
    if (meine.checked && !istMeins(b, getName())) return false;
    return true;
  }

  // ---- Status ändern (ohne Konfliktprüfung, Anzeige sofort) ----

  async function statusSetzen(b, neu) {
    if (!b) return;
    const id = String(b.id);
    if (arbeitet[id]) return;
    arbeitet[id] = true;
    const alt = b.status;
    b.status = neu;
    zeichne();
    let nachladen = false;
    try {
      const r = await api('update', {
        tabelle: 'Mobi_Plan', id: b.id, daten: { status: neu }
      }, s.token);
      const i = daten.mobi.findIndex(function (x) { return String(x.id) === id; });
      if (i >= 0 && r && r.eintrag) daten.mobi[i] = r.eintrag;
      cacheAuffrischen();
    } catch (e) {
      b.status = alt;
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Diesen Beitrag gibt es nicht mehr.');
          nachladen = true;
        } else {
          toast(e.message);
        }
      }
    }
    delete arbeitet[id];
    zeichne();
    if (nachladen) laden(false);
  }

  // ---- Mehrere bearbeiten ----

  function leisteAktualisieren() {
    const n = Object.keys(gewaehlt).length;
    zaehler.textContent = n + ' ausgewählt';
    okKnopf.disabled = n === 0;
  }

  function sammelDialog() {
    const ids = Object.keys(gewaehlt);
    if (!ids.length) return;
    let fenster = null;
    const form = baueFormular([
      {
        name: 'status', label: 'Status setzen (leer = nicht ändern)', typ: 'auswahl',
        optionen: STATI.map(function (x) { return { wert: x, label: statusText(x) }; })
      },
      { name: 'verantwortlich', label: 'Verantwortliche setzen (leer = nicht ändern)', typ: 'text' }
    ], {}, {
      speichernText: ids.length === 1 ? '1 Beitrag ändern' : ids.length + ' Beiträge ändern',
      vorschlaege: { verantwortlich: namenMitRollen(personen()) },
      onSpeichern: async function (d) {
        const neu = {};
        if (d.status) neu.status = d.status;
        if (d.verantwortlich) neu.verantwortlich = d.verantwortlich;
        if (!Object.keys(neu).length) {
          throw new Error('Bitte einen Status oder Verantwortliche eintragen.');
        }
        let ok = 0;
        let fehl = 0;
        for (let i = 0; i < ids.length; i++) {
          try {
            await api('update', { tabelle: 'Mobi_Plan', id: ids[i], daten: neu }, s.token);
            ok += 1;
          } catch (e) {
            if (ctx.behandleFehler(e)) return;
            fehl += 1;
          }
        }
        fenster.schliessen();
        auswahlModus = false;
        gewaehlt = {};
        toast(fehl ? ok + ' geändert, ' + fehl + ' nicht (vielleicht gelöscht).' : ok + ' geändert.');
        cacheSet(s.gruppe_id + ':projekte', null);
        await laden(false);
      },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    fenster = zeigeFenster('Mehrere Beiträge ändern', el('div', null,
      el('p', { class: 'leise', text: ids.length + (ids.length === 1 ? ' Beitrag' : ' Beiträge') + ' ausgewählt.' }),
      form
    ));
  }

  // ---- Liste ----

  const SPALTEN = [
    { name: 'kanal', label: 'Kanal', wert: function (z) { return txt(z.kanal); } },
    { name: 'titel', label: 'Titel', wert: function (z) { return kurz(z.titel, 80) + kommentarMarke(kommZahl[String(z.id)]); } },
    { name: '_bezug', label: 'Projekt / Veranstaltung', wert: function (z) { return bezugText(z); } },
    { name: 'datum', label: 'Datum', wert: function (z) { return datumZeile(z); } },
    { name: 'status', label: 'Status', wert: function (z) { return statusText(z.status); } },
    { name: 'verantwortlich', label: 'Verantwortlich' }
  ];

  function karteVon(z) {
    return {
      titel: txt(z.titel) + kommentarMarke(kommZahl[String(z.id)]),
      zeilen: [
        [txt(z.kanal), FORMAT_TEXT[txt(z.format)] || ''].filter(Boolean).join(' · '),
        datumZeile(z) + ' · ' + statusText(z.status),
        [bezugText(z), txt(z.verantwortlich)].filter(Boolean).join(' · ')
      ]
    };
  }

  const haken = {
    gewaehlt: function (z) { return istVeroeffentlicht(z); },
    umschalten: function (z, wert) {
      statusSetzen(finde(z.id), wert ? 'veroeffentlicht' : 'bereit');
    }
  };

  const auswahl = {
    gewaehlt: function (z) { return !!gewaehlt[z.id]; },
    erlaubt: function () { return true; },
    umschalten: function (z, wert) {
      if (wert) gewaehlt[z.id] = true;
      else delete gewaehlt[z.id];
      leisteAktualisieren();
    }
  };

  // Kanalfarbe (Balken bleibt immer in Kanalfarbe), Erledigt (grau) an Zeilen und Karten setzen.
  // Überfällig: Titel rot und fett. Heute fällig: Titel orange und fett.
  function markieren(box, zeilen) {
    const reihen = box.querySelectorAll('tbody tr');
    const karten = box.querySelectorAll('.karten-liste .karte');
    zeilen.forEach(function (z, i) {
      if (istVeroeffentlicht(z)) {
        if (reihen[i]) reihen[i].classList.add('erledigt');
        if (karten[i]) karten[i].classList.add('erledigt');
      }
      const st = faelligStatus(z);
      const farbe = kanalInfo(z.kanal).farbe;
      if (karten[i]) {
        karten[i].style.borderLeft = '6px solid ' + farbe;
        const titel = karten[i].querySelector('.karten-text strong');
        if (titel && st) titel.classList.add('mobi-titel-' + st);
      }
      if (reihen[i]) {
        const zellen = reihen[i].querySelectorAll('td');
        const zelle = zellen[0] && zellen[0].classList.contains('auswahl-spalte') ? zellen[1] : zellen[0];
        if (zelle) {
          const p = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
          p.style.background = farbe;
          zelle.prepend(p);
          // Spalte nach "Kanal" ist der Titel
          if (st && zelle.nextElementSibling) zelle.nextElementSibling.classList.add('mobi-titel-' + st);
        }
      }
    });
  }

  // Kacheln (Ansicht Liste): Auswahl beim "Mehrere bearbeiten", sonst Haken "veröffentlicht"
  function kachelOpt(mitAuswahl) {
    return {
      bezugText: bezugText,
      kommentare: kommZahl,
      oeffnen: function (b) { beitragOeffnen(b); },
      auswahl: mitAuswahl ? {
        gewaehlt: function (b) { return !!gewaehlt[b.id]; },
        umschalten: function (b, wert) {
          if (wert) gewaehlt[b.id] = true;
          else delete gewaehlt[b.id];
          leisteAktualisieren();
        }
      } : null,
      haken: mitAuswahl ? null : {
        umschalten: function (b, wert) {
          statusSetzen(finde(b.id), wert ? 'veroeffentlicht' : 'bereit');
        }
      }
    };
  }

  // Archiv: einfache Liste (Tabelle am PC, Karten am Handy)
  function liste(box, zeilen, leerText, mitAuswahl, mitHaken) {
    zeigeListe(
      box,
      zeilen.map(function (b) { return Object.assign({}, b, { name: txt(b.titel) }); }),
      SPALTEN,
      karteVon,
      function (z) {
        const b = finde(z.id);
        if (b) beitragOeffnen(b);
      },
      leerText,
      mitAuswahl ? auswahl : null,
      mitHaken ? haken : null
    );
    markieren(box, zeilen);
  }

  // ---- Kanban ----

  // Hat ein Kanal Video-Schritte (gedreht, geschnitten)?
  function mitVideo(k) {
    return !!k && k.schritte.indexOf('gedreht') >= 0;
  }

  // Spalten aus Kanalfilter und sichtbaren Beiträgen:
  // nur Kanäle ohne Video-Schritte im Filter = Standard, sonst Video-Reihenfolge.
  // Status, die bei einer Karte vorkommen, aber fehlen, bekommen trotzdem eine Spalte.
  function kanbanSpalten(passend) {
    const f = kanalWahl.value;
    let video = true;
    if (f.indexOf('g:') === 0) {
      video = kanaeleDerGruppe(f.slice(2), s.kurzname).some(mitVideo);
    } else if (f) {
      video = mitVideo(kanaeleFuer(s.kurzname).find(function (k) { return k.id === f; }));
    }
    const basis = video ? SCHRITTE_VIDEO : SCHRITTE_STANDARD;
    const da = passend.map(statusKey);
    return STATI.filter(function (st) { return basis.indexOf(st) >= 0 || da.indexOf(st) >= 0; });
  }

  function kanbanKarte(b) {
    const k = kanalInfo(b.kanal);
    const st = faelligStatus(b);
    const zurueck = nachbarStatus(b, -1);
    const weiter = nachbarStatus(b, 1);
    const knoepfe = el('div', { class: 'kanban-knoepfe' });
    if (zurueck) {
      knoepfe.append(el('button', {
        class: 'knopf knopf-hell knopf-klein', type: 'button', text: '‹ Zurück',
        'aria-label': 'Zurück nach ' + statusText(zurueck),
        onclick: function () { statusSetzen(b, zurueck); }
      }));
    } else {
      knoepfe.append(el('span'));
    }
    if (weiter) {
      knoepfe.append(el('button', {
        class: 'knopf knopf-klein', type: 'button', text: 'Weiter ›',
        'aria-label': 'Weiter nach ' + statusText(weiter),
        onclick: function () { statusSetzen(b, weiter); }
      }));
    }
    // Feedbackschleife: von "Anpassung" zurück zum Entwurf
    const extra = statusKey(b) === 'anpassung' && zurueck !== 'entwurf'
      ? el('button', {
        class: 'knopf knopf-hell knopf-klein kanban-entwurf', type: 'button', text: 'Zurück zu Entwurf',
        onclick: function () { statusSetzen(b, 'entwurf'); }
      })
      : null;
    const karte = el('article', { class: 'karte kanban-karte' },
      el('button', {
        class: 'kanban-titel', type: 'button',
        onclick: function () { beitragOeffnen(b); }
      },
        el('strong', { class: st ? 'mobi-titel-' + st : '', text: txt(b.titel) + kommentarMarke(kommZahl[String(b.id)]) }),
        el('span', { class: 'leise', text: [txt(b.kanal), FORMAT_TEXT[txt(b.format)] || ''].filter(Boolean).join(' · ') }),
        el('span', { class: 'leise ' + st, text: datumZeile(b) }),
        el('span', { class: 'leise', text: [bezugText(b), txt(b.verantwortlich)].filter(Boolean).join(' · ') })
      ),
      knoepfe,
      extra
    );
    karte.style.borderLeftColor = k.farbe;
    return karte;
  }

  // Kanban in einer Reihe. Darüber: Seiten-Knöpfe (‹ Seite 1 · Seite 2 ›, in Klammern die Zahl der Beiträge
  // auf der Seite, die gerade nicht zu sehen ist) und eine Leiste zum Verschieben direkt über den Spalten.
  function kanbanZeichnen(passend) {
    leeren(boxKanban);
    const wrap = el('div', { class: 'kanban' });
    const anzahl = [];
    kanbanSpalten(passend).forEach(function (st) {
      let l = passend.filter(function (b) { return statusKey(b) === st; });
      if (st === 'veroeffentlicht') l = l.filter(function (b) { return !istArchiv(b); });
      l = sortiereBeitraege(l);
      anzahl.push(l.length);
      const karten = el('div', { class: 'kanban-karten' });
      if (!l.length) karten.append(el('p', { class: 'leise', text: 'Nichts in dieser Spalte.' }));
      l.forEach(function (b) { karten.append(kanbanKarte(b)); });
      wrap.append(el('section', { class: 'kanban-spalte', 'aria-label': statusText(st) },
        el('h3', { class: 'kanban-kopf', text: statusText(st) + ' (' + l.length + ')' }),
        karten
      ));
    });

    const zurueck = el('button', { class: 'knopf knopf-hell knopf-klein', type: 'button' });
    const weiter = el('button', { class: 'knopf knopf-hell knopf-klein', type: 'button' });
    const seiteText = el('span', { class: 'leise' });
    const nav = el('div', { class: 'kanban-nav' }, zurueck, seiteText, weiter);
    const innen = el('div', { class: 'kanban-leiste-innen' });
    const leiste = el('div', { class: 'kanban-leiste', 'aria-hidden': 'true' }, innen);
    boxKanban.append(nav, leiste, wrap);

    let seite = 0;
    function mass() {
      const spalte = wrap.querySelector('.kanban-spalte');
      const breite = spalte ? spalte.offsetWidth : 1;
      const abstand = parseFloat(getComputedStyle(wrap).columnGap) || 0;
      const proSeite = Math.max(1, Math.floor((wrap.clientWidth + abstand) / (breite + abstand)));
      return { schritt: proSeite * (breite + abstand), proSeite: proSeite, seiten: Math.ceil(anzahl.length / proSeite) };
    }
    function beitraegeAuf(m, i) {
      return anzahl.slice(i * m.proSeite, (i + 1) * m.proSeite).reduce(function (a, b) { return a + b; }, 0);
    }
    function aktualisieren() {
      const m = mass();
      const mehr = m.seiten > 1;
      nav.hidden = !mehr;
      leiste.hidden = !mehr;
      if (!mehr) return;
      innen.style.width = wrap.scrollWidth + 'px';
      const ende = wrap.scrollLeft >= wrap.scrollWidth - wrap.clientWidth - 2;
      seite = ende ? m.seiten - 1 : Math.min(m.seiten - 1, Math.round(wrap.scrollLeft / m.schritt));
      seiteText.textContent = 'Seite ' + (seite + 1) + ' von ' + m.seiten;
      zurueck.disabled = seite === 0;
      weiter.disabled = seite >= m.seiten - 1;
      zurueck.textContent = seite > 0 ? '‹ Seite ' + seite + ' (' + beitraegeAuf(m, seite - 1) + ')' : '‹';
      weiter.textContent = seite < m.seiten - 1 ? 'Seite ' + (seite + 2) + ' (' + beitraegeAuf(m, seite + 1) + ') ›' : '›';
      zurueck.title = seite > 0 ? beitraegeAuf(m, seite - 1) + ' Beiträge auf Seite ' + seite : '';
      weiter.title = seite < m.seiten - 1 ? beitraegeAuf(m, seite + 1) + ' Beiträge auf Seite ' + (seite + 2) : '';
    }
    // Sofort springen (nicht weich): Weiches Scrollen wurde in manchen Browsern
    // von der mitlaufenden Leiste wieder zurückgesetzt.
    let vonWrap = 0;
    function gehe(i) {
      const ziel = Math.max(0, i * mass().schritt);
      vonWrap = Date.now();
      wrap.scrollLeft = ziel;
      leiste.scrollLeft = ziel;
      aktualisieren();
    }
    zurueck.addEventListener('click', function () { gehe(seite - 1); });
    weiter.addEventListener('click', function () { gehe(seite + 1); });

    // Leiste oben und Kanban gegenseitig mitbewegen
    // Bewegt sich der Kanban selbst (Knopf, Wischen), folgt die Leiste; dann darf die Leiste
    // den Kanban kurz nicht zurückschieben (Rückkopplung vermeiden).
    leiste.addEventListener('scroll', function () {
      if (Date.now() - vonWrap < 300) return;
      if (Math.abs(wrap.scrollLeft - leiste.scrollLeft) > 1) wrap.scrollLeft = leiste.scrollLeft;
    });
    wrap.addEventListener('scroll', function () {
      kanbanScroll = wrap.scrollLeft;
      if (Math.abs(leiste.scrollLeft - wrap.scrollLeft) > 1) {
        vonWrap = Date.now();
        leiste.scrollLeft = wrap.scrollLeft;
      }
      aktualisieren();
    });
    function beiGroesse() {
      if (!document.body.contains(wrap)) { window.removeEventListener('resize', beiGroesse); return; }
      aktualisieren();
    }
    window.addEventListener('resize', beiGroesse);

    // Erst nach dem Einhängen messen; Stand vom letzten Zeichnen wiederherstellen
    requestAnimationFrame(function () {
      wrap.scrollLeft = kanbanScroll;
      leiste.scrollLeft = kanbanScroll;
      aktualisieren();
    });
  }

  // ---- Zeichnen ----

  function ansichtSetzen(a) {
    merk.ansicht = a;
    if (a !== 'liste') {
      archivModus = false;
      auswahlModus = false;
      gewaehlt = {};
    }
    zeichne();
  }

  // Warnungen: Projekt ohne Mobi (Aktion in den nächsten 21 Tagen, kein Beitrag), Beiträge ohne Datum
  function warnungenZeichnen() {
    leeren(warnBox);
    const w = mobiWarnungen(daten.mobi, daten.projekte, function (p) { return !istAbgeschlossen(p); });
    warnBox.hidden = archivModus || (!w.ohneMobi.length && !w.ohneDatum.length);
    if (warnBox.hidden) return;
    const h = heuteIso();
    w.ohneMobi.forEach(function (p) {
      const tage = Math.round((new Date(normDatum(p.aktionsdatum)) - new Date(h)) / 86400000);
      warnBox.append(el('p', { class: 'mobi-warnung' },
        el('span', { text: '⚠ Projekt ohne Mobi: ' }),
        el('a', {
          href: '#/g/' + encodeURIComponent(s.kurzname) + '/projekte/' + encodeURIComponent(p.id),
          text: txt(p.titel)
        }),
        el('span', {
          text: ' · Aktion ' + datumText(p.aktionsdatum) +
            (tage === 0 ? ' (heute)' : ' (in ' + tage + (tage === 1 ? ' Tag)' : ' Tagen)')) +
            '. Noch kein Beitrag geplant.'
        })
      ));
    });
    if (w.ohneDatum.length) {
      const zeile = el('p', { class: 'mobi-warnung' },
        el('span', { text: '⚠ ' + w.ohneDatum.length + (w.ohneDatum.length === 1 ? ' Beitrag' : ' Beiträge') + ' ohne Datum: ' }));
      w.ohneDatum.slice(0, 5).forEach(function (b, i) {
        if (i) zeile.append(el('span', { text: ', ' }));
        zeile.append(el('button', {
          class: 'mobi-warnung-link', type: 'button', text: txt(b.titel) || 'ohne Titel',
          onclick: function () { beitragOeffnen(b); }
        }));
      });
      if (w.ohneDatum.length > 5) zeile.append(el('span', { text: ' … und ' + (w.ohneDatum.length - 5) + ' weitere' }));
      warnBox.append(zeile);
    }
  }

  // Zeitstrahl: je Projekt oder Veranstaltung (mit Beiträgen mit Datum) ein eigener Strahl
  function zeitstrahlZeichnen(passend) {
    leeren(boxZeit);
    const gruppen = [];
    const index = {};
    passend.forEach(function (b) {
      const pid = txt(b.projekt_id);
      const vid = txt(b.veranstaltung_id);
      const key = pid ? 'p:' + pid : (vid ? 'v:' + vid : '');
      if (!key) return;
      if (!index[key]) {
        index[key] = { key: key, liste: [] };
        gruppen.push(index[key]);
      }
      index[key].liste.push(b);
    });
    let gezeigt = 0;
    gruppen.forEach(function (g) {
      const id = g.key.slice(2);
      const istProjekt = g.key.charAt(0) === 'p';
      const quelle = istProjekt ? daten.projekte : daten.veranstaltungen;
      const x = quelle.find(function (y) { return String(y.id) === id; }) || {};
      const strahl = baueZeitstrahl(g.liste, istProjekt ? x.aktionsdatum : x.datum, beitragOeffnen,
        istProjekt ? 'Aktion' : 'Veranstaltung');
      if (!strahl) return;
      gezeigt += 1;
      boxZeit.append(el('section', { class: 'mobi-zeit-gruppe' },
        el('h3', { class: 'teil-titel-klein', text: istProjekt ? (projektTitel[id] || 'Projekt') : '📅 ' + (veranstTitel[id] || 'Veranstaltung') }),
        strahl
      ));
    });
    if (!gezeigt) {
      boxZeit.append(el('p', {
        class: 'leise',
        text: 'Keine Beiträge mit Datum gefunden. Der Zeitstrahl zeigt Beiträge, die ein Datum haben (ohne Status „Idee“).'
      }));
    }
  }

  function zaehlenZeile(sicht) {
    zahlen.hidden = !sicht.length;
    if (!sicht.length) return;
    const offen = sicht.filter(function (b) { return !istVeroeffentlicht(b); });
    const ueber = offen.filter(function (b) { return faelligStatus(b) === 'ueberfaellig'; }).length;
    const heute = offen.filter(function (b) { return faelligStatus(b) === 'heute'; }).length;
    const bis = wochenEnde();
    const von = addTage(bis, -6);
    const woche = sicht.filter(function (b) {
      const d = normDatum(b.datum);
      return !!d && d >= von && d <= bis;
    });
    const storys = woche.filter(function (b) { return txt(b.format) === 'story'; }).length;
    zahlen.textContent = offen.length + ' offen · ' + ueber + ' überfällig · ' + heute + ' heute fällig · ' +
      'Diese Woche ' + woche.length + (woche.length === 1 ? ' Beitrag' : ' Beiträge') +
      (storys ? ', davon ' + storys + (storys === 1 ? ' Story' : ' Storys') : '');
  }

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? daten.mobi.length + ' Beiträge · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  function zeichne() {
    const kanban = merk.ansicht === 'kanban';
    const zeit = merk.ansicht === 'zeitstrahl';
    const andere = kanban || zeit;   // nicht die Liste
    const sicht = daten.mobi.filter(function (b) { return !projektZu(b); });
    const archivListe = daten.mobi.filter(function (b) { return istArchiv(b) || projektZu(b); });

    [[listenKnopf, !andere], [kanbanKnopf, kanban], [zeitKnopf, zeit]].forEach(function (x) {
      x[0].className = 'knopf' + (x[1] ? '' : ' knopf-hell');
      x[0].setAttribute('aria-pressed', String(x[1]));
    });
    statusWahl.style.display = andere ? 'none' : '';
    archivKnopf.hidden = andere;
    archivKnopf.textContent = archivModus
      ? '← Zurück zu Mobi'
      : 'Archiv' + (archivListe.length ? ' (' + archivListe.length + ')' : '');
    mehrereKnopf.hidden = andere || archivModus || auswahlModus;
    neuKnopf.disabled = auswahlModus;
    sammelKnopf.disabled = auswahlModus;

    zaehlenZeile(sicht);
    warnungenZeichnen();

    boxListe.hidden = andere;
    boxKanban.hidden = !kanban;
    boxZeit.hidden = !zeit;
    leiste.hidden = !auswahlModus;

    if (zeit) {
      kopfFertig.hidden = true;
      boxFertig.hidden = true;
      zeitstrahlZeichnen(sicht.filter(function (b) { return trifft(b, false); }));
      statusZeigen();
      return;
    }

    if (kanban) {
      kopfFertig.hidden = true;
      boxFertig.hidden = true;
      kanbanZeichnen(sicht.filter(function (b) { return trifft(b, false); }));
      statusZeigen();
      return;
    }

    if (archivModus) {
      kopfFertig.hidden = true;
      boxFertig.hidden = true;
      const treffer = archivListe.filter(function (b) { return trifft(b, true); });
      liste(boxListe, sortiereBeitraege(treffer),
        archivListe.length
          ? 'Nichts gefunden.'
          : 'Das Archiv ist leer. Hier stehen Beiträge, die vor mehr als 2 Wochen veröffentlicht wurden, ' +
            'und Beiträge abgeschlossener Projekte.',
        false, true);
      statusZeigen();
      return;
    }

    const passend = sicht.filter(function (b) { return trifft(b, true); });
    const offen = sortiereBeitraege(passend.filter(function (b) { return !istVeroeffentlicht(b); }));
    const neuere = sortiereBeitraege(passend.filter(function (b) {
      return istVeroeffentlicht(b) && !istArchiv(b);
    }));
    sichtbareOffene = offen;

    leeren(boxListe);
    if (!offen.length) {
      boxListe.append(el('p', {
        class: 'leise',
        text: daten.mobi.length
          ? 'Keine offenen Beiträge gefunden.'
          : 'Noch keine Beiträge. Lege sie mit „+ Beiträge planen“ oder „+ Einzelner Beitrag“ an.'
      }));
    } else {
      boxListe.append(baueSpalten(offen, kachelOpt(auswahlModus)));
    }

    // Beim Auswählen ist die Liste der Veröffentlichten ausgeblendet
    const zeigeFertig = !auswahlModus && neuere.length > 0;
    kopfFertig.hidden = !zeigeFertig;
    boxFertig.hidden = !zeigeFertig;
    if (zeigeFertig) {
      kopfFertig.textContent = 'Veröffentlicht, letzte 2 Wochen (' + neuere.length + ')';
      leeren(boxFertig);
      boxFertig.append(baueKachelFlaeche(neuere, kachelOpt(false)));
    }
    leisteAktualisieren();
    statusZeigen();
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    if (!neu.mobi) neu.mobi = [];
    if (!neu.projekte) neu.projekte = [];
    if (!neu.veranstaltungen) neu.veranstaltungen = [];
    if (!neu.todos) neu.todos = [];
    if (!neu.kommentare) neu.kommentare = [];
    daten = neu;
    kommZahl = mobiKommentarZahlen(daten.kommentare);
    meta = m;
    offline = false;
    projektTitel = {};
    projektOffen = {};
    veranstTitel = {};
    daten.projekte.forEach(function (p) {
      projektTitel[String(p.id)] = txt(p.titel);
      projektOffen[String(p.id)] = !istAbgeschlossen(p);
    });
    daten.veranstaltungen.forEach(function (v) { veranstTitel[String(v.id)] = txt(v.titel); });
    // Auswahl aufräumen: nur was es noch gibt
    Object.keys(gewaehlt).forEach(function (id) { if (!finde(id)) delete gewaehlt[id]; });
    werAufbauen();
    bezugAufbauen();
    zeichne();
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        cacheKey,
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Mobi_Plan', 'Projekte', 'Veranstaltungen', 'ToDos', 'Kommentare']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            mobi: t.Mobi_Plan || [],
            projekte: t.Projekte || [],
            veranstaltungen: t.Veranstaltungen || [],
            todos: t.ToDos || [],
            kommentare: t.Kommentare || []
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
  kanalWahl.addEventListener('change', zeichne);
  bezugWahl.addEventListener('change', zeichne);
  werWahl.addEventListener('change', zeichne);
  statusWahl.addEventListener('change', zeichne);
  meine.addEventListener('change', zeichne);
  // Während ein Status noch gespeichert wird, wird nicht aktualisiert
  ctx.setzeRefresh(function () {
    if (Object.keys(arbeitet).length) return Promise.resolve();
    return laden(false);
  });
  await laden(true);
}
