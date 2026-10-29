// js/views/protokoll-eintrag.js
// Formular „Protokoll schreiben“ (Etappe 8, Schritt 8.3, umgebaut in 8.3a): steht direkt im Reiter
// „Dokumentation“ (kein Fenster), am PC und am Handy gleich.
// Aufbau wie das FFF-Protokoll: Titel, Datum, Art, Anwesend, Rollen, Projekt oder Veranstaltung,
// TOPs (aus der TOP-Sammlung antippen oder neu eintippen), Protokolltext, Nächstes Plenum (Schlusszeile).
// Im Protokolltext: Unter einem TOP geht es mit Stichpunkten („- “) weiter. Tab rückt ein, Umschalt+Tab aus.
// Neues Protokoll: Entwurf auf dem Gerät (1 Sekunde nach der letzten Eingabe), Speichern über protokollSpeichern.
// Gemeinsamer Entwurf (seit 0.30.4): „Zwischenspeichern“ (und alle 2 Minuten automatisch) legt das Protokoll mit
// entwurf = TRUE im Sheet ab. Die Gruppe sieht es, ins Dokument kommt es erst mit „Speichern“.
// Einen gemeinsamen Entwurf (eintrag.entwurf) schreibt man mit demselben Formular weiter.
// Nach dem fertigen Speichern bekommen die benutzten TOPs der Sammlung die protokoll_id (sie sind damit besprochen).
// Fertiges Protokoll (nur solange nicht im Dokument): Ändern über update mit Konfliktprüfung, ohne Entwurf.
//
// baueProtokollFormular(opt) -> { el, setzeTops(liste), hatAenderungen(), schliessen(), weg(), istNeu }
// opt: { ctx, token, gruppeId, kurzname,
//        daten: { protokolle, projekte, veranstaltungen, personen, vorlagen }, tops (offene TOPs),
//        eintrag (null = neu), ausEntwurf (true = Werte aus dem Entwurf), vorgabe (für ein neues Protokoll), beiZu(),
//        kannEntwurf (Skript kennt gemeinsame Entwürfe, aus protokollInfo), nachVerwerfen(),
//        nachSpeichern(eintrag, ergebnis) -> ergebnis von protokollSpeichern, bei Ändern null }

import { el, txt } from '../ui/dom.js';
import { istWahr } from '../schema.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';
import { getName, getEntwurf, setEntwurf, loescheEntwurf } from '../store.js';
import { STANDARD } from './kalender-vorlagen.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import { addTage } from './kalender-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';
import {
  ARTEN, artText, rollenFuer, MAX_TEXT, namenVorschlaege, namenAusListe, nameUmschalten, rollenAusText, rollenText,
  plenumGliederung, naechstesPlenum, textMitSchluss, schlusszeile, kopierText,
  angelegtLesen, angelegtText, topNummer, topHinzu, topEntfernen, textAufraeumen, stichpunktEnter, stichpunktTab, stichpunktRueck
} from './protokoll-rechnen.js';
import { baueMarken } from './protokoll-marken.js';

function kopieren(text, ok) {
  const fehlt = function () { toast('Kopieren hat nicht geklappt. Bitte den Text markieren.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast(ok); }, fehlt);
  } else {
    fehlt();
  }
}

// „Protokoll Plenum 22.10.2026“
function autoTitel(art, datum) {
  const a = txt(art) && txt(art) !== 'sonstiges' ? artText(art) + ' ' : '';
  return 'Protokoll ' + a + (normDatum(datum) ? datumText(datum) : '');
}

function feld(label, eingabe, extra) {
  return el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: label }), eingabe, extra || null);
}

// Entwurf auf diesem Gerät: { wann: ' vom 22.10. um 18:40', titel, serverId } oder null
// serverId: der Entwurf gehört zu einem gemeinsamen Entwurf im Sheet
export function entwurfInfo(gruppeId) {
  const e = getEntwurf(gruppeId);
  if (!e) return null;
  const zeit = new Date(e.zeit);
  const wann = isNaN(zeit.getTime()) ? '' :
    ' vom ' + zeit.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
    ' um ' + zeit.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return { wann: wann, titel: txt(e.felder.titel), serverId: txt(e.felder.server_id), angelegt: txt(e.felder.angelegt) };
}

export function verwirfEntwurf(gruppeId) {
  loescheEntwurf(gruppeId);
}

// Startwerte für ein neues Protokoll
// opt.vorgabe (freiwillig, 8.7: aus dem Kalender): { datum, art, titel, bezug }
function neueWerte(opt) {
  const v = opt.vorgabe || {};
  const datum = normDatum(v.datum) || heuteIso();
  const art = txt(v.art) || 'plenum';
  const rollen = {};
  if (rollenFuer(opt.kurzname).indexOf('Protokoll') >= 0) rollen.Protokoll = getName();
  const np = naechstesPlenum(opt.daten.vorlagen, STANDARD[txt(opt.kurzname).toLowerCase()], datum);
  return {
    titel: txt(v.titel) || autoTitel(art, datum), datum: datum, art: art, teilnehmende: '', rollen: rollen,
    bezug: txt(v.bezug), text: art === 'plenum' ? plenumGliederung() : '',
    np_datum: np && art === 'plenum' ? np.datum : '', np_zeit: np && art === 'plenum' ? np.zeit : ''
  };
}

function werteAus(p) {
  const pid = txt(p.projekt_id);
  const vid = txt(p.veranstaltung_id);
  return {
    titel: txt(p.titel), datum: normDatum(p.datum), art: txt(p.art).toLowerCase(), teilnehmende: txt(p.teilnehmende),
    rollen: rollenAusText(p.rollen), bezug: pid ? 'p:' + pid : (vid ? 'v:' + vid : ''),
    text: String(p.text === undefined || p.text === null ? '' : p.text), np_datum: '', np_zeit: '',
    angelegt: txt(p.angelegt)
  };
}

// Über die Knöpfe angelegte Einträge löschen (beim Verwerfen eines Entwurfs). Fehler je Eintrag stören nicht.
// Gibt die Zahl der nicht gelöschten zurück.
export async function loescheAngelegte(liste, token) {
  const ergebnis = await Promise.all((liste || []).map(function (x) {
    return api('delete', { tabelle: x.tabelle, id: x.id }, token).then(function () { return true; }, function (e) {
      return e && e.code === 'nicht_gefunden';
    });
  }));
  return ergebnis.filter(function (ok) { return !ok; }).length;
}

// Alle 2 Minuten wird ein gemeinsamer Entwurf gespeichert (wenn sich etwas geändert hat)
const AUTO_MS = 2 * 60 * 1000;

export function baueProtokollFormular(opt) {
  // gemeinsam = neues Protokoll oder gemeinsamer Entwurf (beide mit Zwischenspeichern und Entwurf auf dem Gerät)
  const gemeinsamerEntwurf = !!opt.eintrag && istWahr(opt.eintrag.entwurf);
  const neu = !opt.eintrag || gemeinsamerEntwurf;
  const ganzNeu = !opt.eintrag;
  const d = opt.daten;
  let w;
  // Stand im Sheet (id und geaendert_am), sobald zwischengespeichert wurde
  let server = gemeinsamerEntwurf ? { id: opt.eintrag.id, geaendert_am: opt.eintrag.geaendert_am } : null;
  const lokal = getEntwurf(opt.gruppeId);
  let eigeneFassung = false;   // eigene, neuere Fassung vom Gerät übernommen
  if (!neu) w = werteAus(opt.eintrag);
  else if (gemeinsamerEntwurf) {
    w = werteAus(opt.eintrag);
    // Eigene, noch nicht zwischengespeicherte Fassung zu diesem Entwurf auf dem Gerät?
    if (opt.ausEntwurf && lokal && String(lokal.felder.server_id) === String(opt.eintrag.id)) {
      w = Object.assign(w, lokal.felder);
      server = { id: opt.eintrag.id, geaendert_am: lokal.felder.server_bekannt || opt.eintrag.geaendert_am };
      eigeneFassung = true;
    }
  } else if (opt.ausEntwurf && lokal) w = Object.assign(neueWerte(opt), lokal.felder);
  else w = neueWerte(opt);
  const anfrage = function (aktion, par) { return api(aktion, par, opt.token); };
  let angelegt = angelegtLesen(w.angelegt);   // über die Knöpfe angelegte Einträge (8.4b)
  let seitServer = false;   // geändert seit dem letzten Zwischenspeichern
  let autoAus = false;      // nach einem Konflikt kein automatisches Speichern mehr
  let zwLaeuft = false;
  let tops = (opt.tops || []).slice();
  let timer = null;
  let geaendert = false;
  let gespeichert = false;
  let zu = false;

  const namen = namenVorschlaege(d.personen, d.protokolle, getName(), 30);
  const namenListe = el('datalist', { id: 'pk-namen' }, ...namen.map(function (n) { return el('option', { value: n }); }));

  // ---- Felder ----

  const titel = el('input', { class: 'feld', type: 'text', maxlength: '200', value: w.titel });
  let letzterAuto = autoTitel(w.art, w.datum);

  const datum = el('input', { class: 'feld', type: 'date' });
  datum.value = w.datum;
  datum.addEventListener('click', function () {
    try { if (typeof datum.showPicker === 'function') datum.showPicker(); } catch (e) { /* ignorieren */ }
  });

  const art = el('select', { class: 'feld' }, el('option', { value: '', text: '–' }),
    ...ARTEN.map(function (a) { return el('option', { value: a.wert, text: a.label }); }));
  art.value = w.art;

  // Anwesend: Textfeld und Namen zum Antippen
  const anwesend = el('input', {
    class: 'feld', type: 'text', maxlength: '2000', value: w.teilnehmende, placeholder: 'Namen, durch Komma getrennt'
  });
  const chips = el('div', { class: 'pk-chips' });
  function chipsZeichnen() {
    chips.textContent = '';
    const drin = namenAusListe(anwesend.value).map(function (x) { return x.toLowerCase(); });
    namen.forEach(function (n) {
      const an = drin.indexOf(n.toLowerCase()) >= 0;
      chips.append(el('button', {
        class: 'pk-chip' + (an ? ' pk-chip-an' : ''), type: 'button', 'aria-pressed': String(an),
        text: (an ? '✓ ' : '+ ') + n,
        onclick: function () {
          anwesend.value = nameUmschalten(anwesend.value, n);
          chipsZeichnen();
          merken();
        }
      }));
    });
  }
  anwesend.addEventListener('input', chipsZeichnen);
  chipsZeichnen();

  // Rollen: die der Gruppe, dazu Rollen aus dem gespeicherten Text
  const reihenfolge = rollenFuer(opt.kurzname);
  Object.keys(w.rollen || {}).forEach(function (r) { if (reihenfolge.indexOf(r) < 0) reihenfolge.push(r); });
  const rollenFelder = {};
  reihenfolge.forEach(function (r) {
    rollenFelder[r] = el('input', {
      class: 'feld', type: 'text', maxlength: '60', list: 'pk-namen', value: txt((w.rollen || {})[r])
    });
  });

  // Projekt oder Veranstaltung: offene Projekte, Veranstaltungen ab 30 Tagen vor heute (und der gespeicherte Bezug)
  const bezug = el('select', { class: 'feld' }, el('option', { value: '', text: '– keins –' }));
  const ab = addTage(heuteIso(), -30);
  const projekte = d.projekte.filter(function (x) { return !istAbgeschlossen(x) || 'p:' + x.id === w.bezug; })
    .sort(function (a, b) { return txt(a.titel).localeCompare(txt(b.titel), 'de'); });
  const veranst = d.veranstaltungen.filter(function (x) {
    const t = normDatum(x.datum_ende) || normDatum(x.datum);
    return (!!t && t >= ab) || 'v:' + x.id === w.bezug;
  }).sort(function (a, b) { return normDatum(a.datum).localeCompare(normDatum(b.datum)); });
  if (projekte.length) {
    bezug.append(el('optgroup', { label: 'Projekte' }, ...projekte.map(function (x) {
      return el('option', { value: 'p:' + x.id, text: txt(x.titel) });
    })));
  }
  if (veranst.length) {
    bezug.append(el('optgroup', { label: 'Veranstaltungen' }, ...veranst.map(function (x) {
      return el('option', { value: 'v:' + x.id, text: '📅 ' + datumText(x.datum) + ' ' + txt(x.titel) });
    })));
  }
  bezug.value = w.bezug;
  if (bezug.value !== w.bezug) bezug.value = '';

  // Protokolltext
  const text = el('textarea', { class: 'feld protokoll-feld', rows: '16', maxlength: String(MAX_TEXT), 'aria-labelledby': 'pk-text-label' });
  text.value = w.text;
  const zaehler = el('span', { class: 'leise pk-zaehler' });

  // Markierungen (8.4): Knöpfe, kleine Formulare, @-Namen, Tastenkürzel, „+ Einfügen“, Übersicht
  const aktionsarten = [];
  d.projekte.forEach(function (x) {
    const a = txt(x.aktionsart);
    if (a && aktionsarten.indexOf(a) < 0) aktionsarten.push(a);
  });
  aktionsarten.sort(function (a, b) { return a.localeCompare(b, 'de'); });
  const marken = baueMarken({
    ctx: opt.ctx, token: opt.token, text: text, namen: namen, aktionsarten: aktionsarten,
    projekte: d.projekte.filter(function (x) { return !istAbgeschlossen(x); })
      .sort(function (a, b) { return txt(a.titel).localeCompare(txt(b.titel), 'de'); }),
    projektVorgabe: function () {
      const b = bezug.value;
      return b.indexOf('p:') === 0 ? b.slice(2) : '';
    },
    herkunft: function () {
      return 'Aus dem Protokoll' + (normDatum(datum.value) ? ' vom ' + datumText(datum.value) : '') +
        (txt(titel.value) ? ': ' + txt(titel.value) : '');
    },
    einfuegen: function (r) { textSetzen(r); merken(); },
    beiAngelegt: function (tabelle, id) { angelegt.push({ tabelle: tabelle, id: id }); merken(); }
  });
  bezug.addEventListener('change', function () { marken.aktualisieren(); });

  function textSetzen(r) {
    text.value = r.text;
    text.focus();
    text.setSelectionRange(r.pos, r.pos);
    textGeaendert();
  }

  // TOPs: aus der Sammlung antippen (Nummer in Reihenfolge des Antippens) oder neu eintippen
  const topChips = el('div', { class: 'pk-chips' });
  function topsZeichnen() {
    topChips.textContent = '';
    if (!tops.length) {
      topChips.append(el('span', { class: 'leise', text: 'Keine offenen TOPs in der Sammlung.' }));
    }
    tops.forEach(function (t) {
      const nr = topNummer(text.value, t.titel);
      topChips.append(el('button', {
        class: 'pk-chip' + (nr ? ' pk-chip-an' : ''), type: 'button', 'aria-pressed': String(!!nr),
        text: (nr ? nr + ' · ' : '+ ') + txt(t.titel),
        onclick: function () {
          if (nr) {
            const r = topEntfernen(text.value, t.titel);
            if (r.hatteInhalt && !window.confirm('Unter dem TOP „' + txt(t.titel) + '“ steht schon Text. Trotzdem entfernen?')) return;
            text.value = r.text;
            textGeaendert();
          } else {
            textSetzen(topHinzu(text.value, t.titel));
          }
          merken();
        }
      }));
    });
  }
  const neuerTop = el('input', {
    class: 'feld', type: 'text', maxlength: '200', placeholder: 'Weiterer TOP (nur für dieses Protokoll)', 'aria-label': 'Weiterer TOP'
  });
  function topPlus() {
    textSetzen(topHinzu(text.value, txt(neuerTop.value)));
    neuerTop.value = '';
    merken();
  }
  neuerTop.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); topPlus(); }
  });
  const topBox = el('fieldset', { class: 'pk-gruppe' },
    el('legend', { text: 'TOPs' }),
    el('p', { class: 'leise pk-hinweis', text: 'Antippen = als nächster TOP in den Protokolltext. Nochmal antippen = wieder heraus.' }),
    topChips,
    el('div', { class: 'top-eingabe' }, neuerTop,
      el('button', { class: 'knopf knopf-hell', type: 'button', text: '+ TOP', onclick: topPlus }))
  );

  // Stichpunkte: Enter, Tab, Umschalt+Tab, Rücktaste. Nach Esc verlässt Tab das Feld.
  let tabFrei = false;
  text.addEventListener('keydown', function (ev) {
    if (ev.isComposing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const pos = text.selectionStart;
    const ohneAuswahl = pos === text.selectionEnd;
    let r = null;
    if (ev.key === 'Escape') { tabFrei = true; return; }
    if (ev.key === 'Tab') {
      if (tabFrei) { tabFrei = false; return; }
      r = stichpunktTab(text.value, pos, ev.shiftKey);
    } else if (ev.key === 'Enter' && !ev.shiftKey && ohneAuswahl) {
      r = stichpunktEnter(text.value, pos);
    } else if (ev.key === 'Backspace' && ohneAuswahl) {
      r = stichpunktRueck(text.value, pos);
    }
    tabFrei = false;
    if (!r) return;
    ev.preventDefault();
    textSetzen(r);
    merken();
  });
  // Am Handy gibt es keine Tab-Taste: zwei Knöpfe
  function rueckenKnopf(zeichen, label, zurueck) {
    return el('button', {
      class: 'knopf knopf-hell pk-ruecken', type: 'button', text: zeichen, title: label, 'aria-label': label,
      onmousedown: function (ev) { ev.preventDefault(); },
      onclick: function () { textSetzen(stichpunktTab(text.value, text.selectionStart, zurueck)); merken(); }
    });
  }

  // Nächstes Plenum (nur bei neuen Plenums-Protokollen)
  const npDatum = el('input', { class: 'feld', type: 'date' });
  npDatum.value = w.np_datum;
  const npZeit = el('input', { class: 'feld', type: 'time' });
  npZeit.value = w.np_zeit;
  const npVorschau = el('p', { class: 'leise' });
  let npAuto = npDatum.value;
  const npBox = el('fieldset', { class: 'pk-gruppe' },
    el('legend', { text: 'Nächstes Plenum' }),
    el('div', { class: 'pk-zwei' }, feld('Datum', npDatum), feld('Uhrzeit', npZeit)),
    npVorschau
  );

  function mitSchluss() {
    return ganzNeu && art.value === 'plenum';
  }

  function endText() {
    const t = textAufraeumen(text.value);
    return mitSchluss() ? textMitSchluss(t, npDatum.value, npZeit.value) : t;
  }

  // Text für den gemeinsamen Entwurf: ohne Aufräumen (Gliederung bleibt), mit Schlusszeile
  function entwurfText() {
    return mitSchluss() ? textMitSchluss(text.value, npDatum.value, npZeit.value) : text.value;
  }

  function zaehlen() {
    const n = endText().length;
    zaehler.textContent = n.toLocaleString('de-DE') + ' / ' + MAX_TEXT.toLocaleString('de-DE') + ' Zeichen';
    zaehler.classList.toggle('fehler', n > MAX_TEXT);
    const z = schlusszeile(npDatum.value, npZeit.value);
    npVorschau.textContent = z
      ? 'Wird als letzte Zeile angehängt: „' + z + '“'
      : 'Ohne Datum wird keine Zeile angehängt.';
  }

  function textGeaendert() {
    zaehlen();
    topsZeichnen();
    marken.aktualisieren();
  }

  function artGeaendert() {
    npBox.hidden = !mitSchluss();
    if (art.value === 'plenum' && !txt(text.value)) text.value = plenumGliederung();
    // Unberührte Gliederung passt nur zum Plenum
    if (art.value !== 'plenum' && text.value === plenumGliederung()) text.value = '';
    if (mitSchluss() && !npDatum.value) {
      const np = naechstesPlenum(d.vorlagen, STANDARD[txt(opt.kurzname).toLowerCase()], datum.value);
      if (np) { npDatum.value = np.datum; npZeit.value = npZeit.value || np.zeit; npAuto = np.datum; }
    }
  }

  // Titel und Nächstes Plenum folgen Datum und Art, solange niemand sie selbst geändert hat
  function titelNachfuehren() {
    const auto = autoTitel(art.value, datum.value);
    if (titel.value === letzterAuto) titel.value = auto;
    letzterAuto = auto;
  }
  datum.addEventListener('change', function () {
    titelNachfuehren();
    if (ganzNeu && npDatum.value === npAuto) {
      const np = naechstesPlenum(d.vorlagen, STANDARD[txt(opt.kurzname).toLowerCase()], datum.value);
      npDatum.value = np ? np.datum : '';
      npAuto = npDatum.value;
    }
    zaehlen();
  });
  art.addEventListener('change', function () { titelNachfuehren(); artGeaendert(); textGeaendert(); });
  text.addEventListener('input', textGeaendert);
  [npDatum, npZeit].forEach(function (x) { x.addEventListener('input', zaehlen); x.addEventListener('change', zaehlen); });

  // ---- Entwurf (nur neue Protokolle) ----

  function sammeln() {
    const rollen = {};
    reihenfolge.forEach(function (r) { rollen[r] = txt(rollenFelder[r].value); });
    return {
      titel: titel.value, datum: datum.value, art: art.value, teilnehmende: anwesend.value, rollen: rollen,
      bezug: bezug.value, text: text.value, np_datum: npDatum.value, np_zeit: npZeit.value,
      server_id: server ? server.id : '', server_bekannt: server ? server.geaendert_am : '',
      angelegt: angelegtText(angelegt)
    };
  }

  function sichern() {
    clearTimeout(timer);
    timer = null;
    if (neu && geaendert && !gespeichert) setEntwurf(opt.gruppeId, sammeln());
  }

  function merken() {
    geaendert = true;
    seitServer = true;
    if (!neu) return;
    clearTimeout(timer);
    timer = setTimeout(sichern, 1000);
  }

  function schliessen() {
    if (zu) return;
    zu = true;
    clearInterval(autoTimer);
    window.removeEventListener('hashchange', weg);
    window.removeEventListener('pagehide', sichern);
    const offen = timer !== null;
    sichern();
    if (neu && geaendert && !gespeichert && (offen || getEntwurf(opt.gruppeId))) toast('Der Entwurf ist auf diesem Gerät gesichert.');
    form.remove();
    if (opt.beiZu) opt.beiZu();
  }

  // ---- Speichern ----

  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const speichernKnopf = el('button', { class: 'knopf', type: 'submit', text: 'Speichern' });

  // Benutzte TOPs der Sammlung als besprochen merken (Fehler stören das Speichern nicht)
  async function topsAbhaken(inhalt, protokollId) {
    const benutzt = tops.filter(function (t) { return topNummer(inhalt, t.titel) > 0; });
    const ergebnis = await Promise.all(benutzt.map(function (t) {
      return anfrage('update', { tabelle: 'TOPs', id: t.id, daten: { protokoll_id: protokollId } })
        .then(function () { return true; }, function () { return false; });
    }));
    if (ergebnis.indexOf(false) >= 0) toast('Nicht alle TOPs konnten als besprochen markiert werden.');
  }

  function datenAusFormular(inhalt) {
    const b = bezug.value;
    return {
      titel: txt(titel.value),
      datum: datum.value,
      art: art.value,
      teilnehmende: namenAusListe(anwesend.value).join(', '),
      rollen: rollenText(sammeln().rollen, reihenfolge),
      projekt_id: b.indexOf('p:') === 0 ? b.slice(2) : '',
      veranstaltung_id: b.indexOf('v:') === 0 ? b.slice(2) : '',
      text: inhalt,
      angelegt: angelegtText(angelegt)
    };
  }

  const konfliktText = 'Jemand anderes hat diesen Entwurf inzwischen gespeichert. Deine Fassung bleibt auf diesem Gerät. ' +
    'Tipp: „Entwurf kopieren“, dann „Schließen“ und den Entwurf neu öffnen.';

  // Gemeinsamen Entwurf ins Sheet (nicht ins Dokument). automatisch = vom 2-Minuten-Takt
  async function zwischenspeichern(automatisch) {
    if (zwLaeuft || gespeichert || zu) return;
    if (automatisch && (!seitServer || autoAus)) return;
    if (!txt(titel.value)) {
      if (!automatisch) { fehler.textContent = '„Titel“ darf nicht leer sein.'; titel.focus(); }
      return;
    }
    const inhalt = entwurfText();
    if (inhalt.length > MAX_TEXT) {
      if (!automatisch) fehler.textContent = 'Der Protokolltext ist zu lang (höchstens ' + MAX_TEXT.toLocaleString('de-DE') + ' Zeichen).';
      return;
    }
    zwLaeuft = true;
    zwKnopf.disabled = true;
    const warSeitServer = seitServer;
    seitServer = false;
    try {
      const par = { daten: datenAusFormular(inhalt), entwurf: true };
      if (server) { par.id = server.id; par.bekannt = server.geaendert_am; }
      const res = await anfrage('protokollSpeichern', par);
      // Schutz: Ein altes Skript kennt keine Entwürfe und hängt alles ans Dokument
      if (!res || !res.eintrag || !istWahr(res.eintrag.entwurf) || res.im_dokument) {
        autoAus = true;
        gespeichert = true;
        loescheEntwurf(opt.gruppeId);
        fehler.textContent = 'Das bereitgestellte Skript kennt noch keine Entwürfe: Das Protokoll wurde gespeichert und ins Dokument übernommen. ' +
          'Bitte das Skript neu bereitstellen (siehe Pull Request 8.4a).';
        zwLaeuft = false;
        return;
      }
      server = { id: res.eintrag.id, geaendert_am: res.eintrag.geaendert_am };
      fehler.textContent = '';
      const z = new Date(res.eintrag.geaendert_am);
      zwStand.textContent = 'Für die Gruppe zwischengespeichert' +
        (isNaN(z.getTime()) ? '.' : ' um ' + z.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr.');
      // Der Stand im Sheet ist aktuell: Entwurf auf dem Gerät nur noch mit Verweis darauf
      sichern();
      if (!automatisch) toast('Entwurf für die Gruppe gespeichert.');
      if (opt.beiZwischenspeichern) opt.beiZwischenspeichern();
    } catch (e) {
      seitServer = seitServer || warSeitServer;
      if (!opt.ctx.behandleFehler(e)) {
        if (e.code === 'konflikt') { autoAus = true; fehler.textContent = konfliktText; }
        else if (!automatisch) fehler.textContent = 'Nicht zwischengespeichert: ' + e.message + ' Der Entwurf bleibt auf diesem Gerät.';
        else zwStand.textContent = 'Automatisches Zwischenspeichern hat nicht geklappt (' + e.message + '). Der Entwurf bleibt auf diesem Gerät.';
      }
    }
    zwLaeuft = false;
    zwKnopf.disabled = false;
  }

  async function speichern() {
    fehler.textContent = '';
    if (!txt(titel.value)) {
      fehler.textContent = '„Titel“ darf nicht leer sein.';
      titel.focus();
      return;
    }
    const inhalt = endText();
    if (inhalt.length > MAX_TEXT) {
      fehler.textContent = 'Der Protokolltext ist zu lang (höchstens ' + MAX_TEXT.toLocaleString('de-DE') + ' Zeichen).';
      text.focus();
      return;
    }
    const daten = datenAusFormular(inhalt);
    sichern();
    speichernKnopf.disabled = true;
    speichernKnopf.textContent = 'Speichere …';
    try {
      let eintrag;
      let res = null;
      if (neu) {
        const par = { daten: daten, entwurf: false };
        if (server) { par.id = server.id; par.bekannt = server.geaendert_am; }
        res = await anfrage('protokollSpeichern', par);
        eintrag = res.eintrag;
        gespeichert = true;
        loescheEntwurf(opt.gruppeId);
      } else {
        const r = await anfrage('update', {
          tabelle: 'Protokolle', id: opt.eintrag.id, daten: daten, bekannt: opt.eintrag.geaendert_am
        });
        eintrag = r.eintrag;
        gespeichert = true;
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      await topsAbhaken(inhalt, eintrag.id);
      schliessen();
      await opt.nachSpeichern(eintrag, res);
    } catch (e) {
      speichernKnopf.disabled = false;
      speichernKnopf.textContent = 'Speichern';
      if (opt.ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        fehler.textContent = neu ? konfliktText
          : 'Jemand anderes hat dieses Protokoll gerade geändert. Klicke auf „Schließen“ und öffne es noch einmal.';
      } else if (e.code === 'nicht_gefunden') {
        fehler.textContent = e.message;
      } else {
        fehler.textContent = 'Nicht gespeichert: ' + e.message + (neu ? ' Der Entwurf bleibt auf diesem Gerät.' : '');
      }
    }
  }

  const zwKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Zwischenspeichern',
    onclick: function () { zwischenspeichern(false); }
  });
  const kannEntwurf = opt.kannEntwurf !== false;
  zwKnopf.hidden = !kannEntwurf;
  const zwStand = el('p', { class: 'leise pk-hinweis', text: !kannEntwurf
    ? 'Zwischenspeichern für die Gruppe geht erst, wenn das neue Skript bereitgestellt ist (oder gerade keine Verbindung).'
    : (server
      ? 'Gemeinsamer Entwurf, zuletzt gespeichert von ' + (txt(opt.eintrag && opt.eintrag.geaendert_von) || 'unbekannt') + '.'
      : 'Noch nicht für die Gruppe gespeichert.') });
  const autoTimer = neu && kannEntwurf ? setInterval(function () { zwischenspeichern(true); }, AUTO_MS) : null;

  // Entwurf verwerfen: der auf dem Gerät und (falls vorhanden) der gemeinsame im Sheet
  const verwerfenKnopf = el('button', {
    class: 'knopf knopf-gefahr', type: 'button', text: 'Entwurf verwerfen',
    onclick: async function () {
      const mit = angelegt.length
        ? '\n\nAuch die ' + angelegt.length + ' über die Knöpfe angelegten Einträge (ToDos, Learnings, Termine …) werden gelöscht.'
        : '';
      if (!window.confirm((server
        ? 'Den gemeinsamen Entwurf für alle verwerfen? Das geht nicht rückgängig.'
        : 'Den Entwurf auf diesem Gerät verwerfen? Das geht nicht rückgängig.') + mit)) return;
      if (server) {
        try {
          await anfrage('delete', { tabelle: 'Protokolle', id: server.id, bekannt: server.geaendert_am });
        } catch (e) {
          if (opt.ctx.behandleFehler(e)) return;
          fehler.textContent = e.code === 'konflikt'
            ? 'Jemand anderes hat den Entwurf gerade geändert. Bitte „Schließen“ und neu öffnen.'
            : 'Nicht verworfen: ' + e.message;
          return;
        }
      }
      const rest = await loescheAngelegte(angelegt, opt.token);
      gespeichert = true;
      loescheEntwurf(opt.gruppeId);
      toast(rest ? 'Entwurf verworfen. ' + rest + ' Einträge konnten nicht gelöscht werden.' : 'Entwurf verworfen.');
      schliessen();
      if (opt.nachVerwerfen) opt.nachVerwerfen();
    }
  });

  // Reiterwechsel: Entwurf sofort sichern und dieses Formular anhalten (kein Speichern mehr im Hintergrund).
  // Der Reiter öffnet das Formular beim Zurückkommen wieder (protokoll.js).
  function weg() {
    if (zu) return;
    sichern();
    zu = true;
    clearInterval(autoTimer);
    window.removeEventListener('hashchange', weg);
    window.removeEventListener('pagehide', sichern);
  }
  window.addEventListener('hashchange', weg);
  window.addEventListener('pagehide', sichern);

  // ---- Aufbau ----

  const form = el('form', { class: 'formular protokoll-form karte', novalidate: '' },
    el('h2', { text: ganzNeu ? 'Neues Protokoll' : (gemeinsamerEntwurf ? 'Entwurf weiterschreiben' : 'Protokoll bearbeiten') }),
    eigeneFassung ? el('p', { class: 'fehler', text: 'Du siehst deine eigene Fassung von diesem Gerät. Sie ist noch nicht für die Gruppe gespeichert.' }) : null,
    feld('Titel *', titel),
    el('div', { class: 'pk-zwei' }, feld('Datum', datum), feld('Art', art)),
    feld('Anwesend', anwesend, namenListe),
    namen.length ? chips : null,
    reihenfolge.length
      ? el('fieldset', { class: 'pk-gruppe' }, el('legend', { text: 'Rollen' }),
        el('div', { class: 'pk-rollen' }, ...reihenfolge.map(function (r) { return feld(r, rollenFelder[r]); })))
      : null,
    feld('Projekt oder Veranstaltung (freiwillig)', bezug),
    topBox,
    el('div', { class: 'pk-text-kopf' },
      el('span', { class: 'formlabel', id: 'pk-text-label', text: 'Protokolltext' }),   // Beschriftung des Felds für Bildschirmleser (0.34.8)
      el('span', { class: 'pk-ruecken-knoepfe' },
        rueckenKnopf('⇤', 'Stichpunkt ausrücken', true),
        rueckenKnopf('⇥', 'Stichpunkt einrücken', false))
    ),
    marken.leiste,
    marken.panel,
    text,
    zaehler,
    marken.uebersicht,
    el('p', { class: 'leise pk-hinweis', text:
      'Unter einem TOP geht es mit Stichpunkten („- “) weiter. Tab rückt ein, Umschalt+Tab rückt aus. ' +
      'Rücktaste auf einem leeren Stichpunkt macht normalen Text daraus. Mit Esc und dann Tab verlässt du das Feld.' }),
    el('p', { class: 'leise pk-hinweis', text:
      'Markierungen: Knöpfe über dem Feld (am PC auch Strg+Alt+T, L, V, M, U, B). ' +
      'Die Knöpfe legen den Eintrag gleich an (Zeile mit ✔). Gelesen werden nur Zeilen, die mit ☐ 💡 📅 📌 📊 👉 oder mit „ToDo:“, „Learning:“, „Termin:“, „Mitteilung:“, „Umfrage:“, „Beschluss:“ beginnen.' }),
    el('p', { class: 'leise pk-hinweis', text:
      'Schreibe nichts auf, was Dritte persönlich betrifft (Namen von Personen außerhalb der Gruppe, Gesundheit, Adressen).' }),
    npBox,
    neu
      ? el('div', { class: 'pk-entwurf' },
        el('p', { class: 'leise', text: 'Auf diesem Gerät wird jede Eingabe sofort gesichert (beim Abmelden gelöscht). ' +
          'Für die Gruppe sichtbar wird der Entwurf mit „Zwischenspeichern“ und alle 2 Minuten automatisch. ' +
          'Ins Dokument kommt er erst mit „Speichern“.' }),
        zwStand,
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Entwurf kopieren',
          onclick: function () {
            const f = sammeln();
            kopieren(kopierText({
              titel: f.titel, datum: f.datum, rollen: rollenText(f.rollen, reihenfolge),
              teilnehmende: f.teilnehmende, text: endText()
            }), 'Entwurf kopiert.');
          }
        }))
      : el('p', { class: 'leise', text: 'Du kannst das Protokoll ändern, solange es noch nicht im Dokument steht.' }),
    fehler,
    el('div', { class: 'form-knoepfe' }, speichernKnopf, neu ? zwKnopf : null,
      // „Schließen“ statt „Abbrechen“: Der Entwurf bleibt erhalten (Wunsch 22.10.2026)
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Schließen', onclick: schliessen }),
      neu ? verwerfenKnopf : null)
  );
  form.addEventListener('input', merken);
  form.addEventListener('change', merken);
  form.addEventListener('submit', function (ev) { ev.preventDefault(); speichern(); });

  artGeaendert();
  textGeaendert();

  return {
    el: form,
    // Neue Liste der offenen TOPs (nach dem Aktualisieren). TOPs, die schon im Text stehen, bleiben wählbar.
    setzeTops: function (liste) {
      const imText = tops.filter(function (t) { return topNummer(text.value, t.titel) > 0; });
      tops = (liste || []).slice();
      imText.forEach(function (t) {
        if (!tops.some(function (x) { return String(x.id) === String(t.id); })) tops.push(t);
      });
      topsZeichnen();
    },
    hatAenderungen: function () { return geaendert && !gespeichert; },
    schliessen: schliessen,
    weg: weg,
    istNeu: neu
  };
}
