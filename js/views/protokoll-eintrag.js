// js/views/protokoll-eintrag.js
// Formular „Protokoll schreiben“ (Etappe 8, Schritt 8.3). Fenster, am Handy Vollbild.
// Aufbau wie das FFF-Protokoll: Titel, Datum, Art, Anwesend, Rollen, Projekt oder Veranstaltung,
// Protokolltext (Plenum: mit Gliederung und „+ TOP“), Nächstes Plenum (wird als Schlusszeile angehängt).
// Neues Protokoll: Entwurf auf dem Gerät (1 Sekunde nach der letzten Eingabe), Speichern über protokollSpeichern.
// Vorhandenes Protokoll (nur solange nicht im Dokument): Ändern über update mit Konfliktprüfung, ohne Entwurf.
//
// opt: { ctx, token, gruppeId, kurzname,
//        daten: { protokolle, projekte, veranstaltungen, personen, vorlagen },
//        eintrag (null = neu), nachSpeichern(eintrag, ergebnis) -> ergebnis von protokollSpeichern, bei Ändern null }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { toast } from '../ui/toast.js';
import { getName, getEntwurf, setEntwurf, loescheEntwurf } from '../store.js';
import { STANDARD } from './kalender-vorlagen.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import { addTage } from './kalender-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';
import {
  ARTEN, artText, rollenFuer, MAX_TEXT, namenVorschlaege, namenAusListe, nameUmschalten, rollenAusText, rollenText,
  plenumGliederung, topEinfuegen, naechstesPlenum, textMitSchluss, schlusszeile, kopierText
} from './protokoll-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

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

// Startwerte für ein neues Protokoll
function neueWerte(opt) {
  const datum = heuteIso();
  const rollen = {};
  if (rollenFuer(opt.kurzname).indexOf('Protokoll') >= 0) rollen.Protokoll = getName();
  const np = naechstesPlenum(opt.daten.vorlagen, STANDARD[txt(opt.kurzname).toLowerCase()], datum);
  return {
    titel: autoTitel('plenum', datum), datum: datum, art: 'plenum', teilnehmende: '', rollen: rollen,
    bezug: '', text: plenumGliederung(), np_datum: np ? np.datum : '', np_zeit: np ? np.zeit : ''
  };
}

function werteAus(p) {
  const pid = txt(p.projekt_id);
  const vid = txt(p.veranstaltung_id);
  return {
    titel: txt(p.titel), datum: normDatum(p.datum), art: txt(p.art).toLowerCase(), teilnehmende: txt(p.teilnehmende),
    rollen: rollenAusText(p.rollen), bezug: pid ? 'p:' + pid : (vid ? 'v:' + vid : ''),
    text: String(p.text === undefined || p.text === null ? '' : p.text), np_datum: '', np_zeit: ''
  };
}

export function zeigeProtokollFormular(opt) {
  if (opt.eintrag) {
    formular(opt, werteAus(opt.eintrag));
    return;
  }
  const e = getEntwurf(opt.gruppeId);
  if (!e) {
    formular(opt, neueWerte(opt));
    return;
  }
  // Entwurf vorhanden: fortsetzen oder verwerfen
  const zeit = new Date(e.zeit);
  const wann = isNaN(zeit.getTime()) ? '' :
    ' vom ' + zeit.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) +
    ' um ' + zeit.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  let fenster = null;
  const inhalt = el('div', null,
    el('p', { text: 'Auf diesem Gerät gibt es einen Entwurf' + wann + ': „' + (txt(e.felder.titel) || 'ohne Titel') + '“.' }),
    el('div', { class: 'form-knoepfe' },
      el('button', {
        class: 'knopf', type: 'button', text: 'Fortsetzen',
        onclick: function () {
          fenster.schliessen();
          formular(opt, Object.assign(neueWerte(opt), e.felder));
        }
      }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Verwerfen',
        onclick: function () {
          if (!window.confirm('Den Entwurf wirklich verwerfen? Das geht nicht rückgängig.')) return;
          loescheEntwurf(opt.gruppeId);
          fenster.schliessen();
          formular(opt, neueWerte(opt));
        }
      })
    )
  );
  fenster = zeigeFenster('Entwurf' + wann + ' fortsetzen?', inhalt, null);
}

function formular(opt, w) {
  const neu = !opt.eintrag;
  const d = opt.daten;
  let fenster = null;
  let timer = null;
  let geaendert = false;
  let gespeichert = false;

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
  const text = el('textarea', { class: 'feld protokoll-feld', rows: '14', maxlength: String(MAX_TEXT) });
  text.value = w.text;
  const zaehler = el('span', { class: 'leise pk-zaehler' });
  const topKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: '+ TOP',
    onclick: function () {
      const r = topEinfuegen(text.value);
      text.value = r.text;
      text.focus();
      text.setSelectionRange(r.pos, r.pos);
      zaehlen();
      merken();
    }
  });

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

  function endText() {
    return neu && art.value === 'plenum' ? textMitSchluss(text.value, npDatum.value, npZeit.value) : text.value;
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

  function artGeaendert() {
    npBox.hidden = !(neu && art.value === 'plenum');
    if (art.value === 'plenum' && !txt(text.value)) text.value = plenumGliederung();
    // Unberührte Gliederung passt nur zum Plenum
    if (art.value !== 'plenum' && text.value === plenumGliederung()) text.value = '';
    if (neu && art.value === 'plenum' && !npDatum.value) {
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
    if (neu && npDatum.value === npAuto) {
      const np = naechstesPlenum(d.vorlagen, STANDARD[txt(opt.kurzname).toLowerCase()], datum.value);
      npDatum.value = np ? np.datum : '';
      npAuto = npDatum.value;
    }
    zaehlen();
  });
  art.addEventListener('change', function () { titelNachfuehren(); artGeaendert(); zaehlen(); });
  [text, npDatum, npZeit].forEach(function (x) { x.addEventListener('input', zaehlen); x.addEventListener('change', zaehlen); });

  // ---- Entwurf (nur neue Protokolle) ----

  function sammeln() {
    const rollen = {};
    reihenfolge.forEach(function (r) { rollen[r] = txt(rollenFelder[r].value); });
    return {
      titel: titel.value, datum: datum.value, art: art.value, teilnehmende: anwesend.value, rollen: rollen,
      bezug: bezug.value, text: text.value, np_datum: npDatum.value, np_zeit: npZeit.value
    };
  }

  function sichern() {
    clearTimeout(timer);
    timer = null;
    if (neu && geaendert && !gespeichert) setEntwurf(opt.gruppeId, sammeln());
  }

  function merken() {
    geaendert = true;
    if (!neu) return;
    clearTimeout(timer);
    timer = setTimeout(sichern, 1000);
  }

  // ---- Speichern ----

  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const speichernKnopf = el('button', { class: 'knopf', type: 'submit', text: 'Speichern' });

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
    const b = bezug.value;
    const daten = {
      titel: txt(titel.value),
      datum: datum.value,
      art: art.value,
      teilnehmende: namenAusListe(anwesend.value).join(', '),
      rollen: rollenText(sammeln().rollen, reihenfolge),
      projekt_id: b.indexOf('p:') === 0 ? b.slice(2) : '',
      veranstaltung_id: b.indexOf('v:') === 0 ? b.slice(2) : '',
      text: inhalt
    };
    sichern();
    speichernKnopf.disabled = true;
    speichernKnopf.textContent = 'Speichere …';
    try {
      if (neu) {
        const res = await api('protokollSpeichern', { daten: daten }, opt.token);
        gespeichert = true;
        loescheEntwurf(opt.gruppeId);
        fenster.schliessen();
        await opt.nachSpeichern(res.eintrag, res);
      } else {
        const res = await api('update', {
          tabelle: 'Protokolle', id: opt.eintrag.id, daten: daten, bekannt: opt.eintrag.geaendert_am
        }, opt.token);
        gespeichert = true;
        fenster.schliessen();
        toast(res.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
        await opt.nachSpeichern(res.eintrag, null);
      }
    } catch (e) {
      speichernKnopf.disabled = false;
      speichernKnopf.textContent = 'Speichern';
      if (opt.ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        fehler.textContent = 'Jemand anderes hat dieses Protokoll gerade geändert. Klicke auf „Abbrechen“ und öffne es noch einmal.';
      } else if (e.code === 'nicht_gefunden') {
        fehler.textContent = e.message;
      } else {
        fehler.textContent = 'Nicht gespeichert: ' + e.message + (neu ? ' Der Entwurf bleibt auf diesem Gerät.' : '');
      }
    }
  }

  // ---- Aufbau ----

  const form = el('form', { class: 'formular protokoll-form', novalidate: '' },
    feld('Titel *', titel),
    el('div', { class: 'pk-zwei' }, feld('Datum', datum), feld('Art', art)),
    feld('Anwesend', anwesend, namenListe),
    namen.length ? chips : null,
    reihenfolge.length
      ? el('fieldset', { class: 'pk-gruppe' }, el('legend', { text: 'Rollen' }),
        el('div', { class: 'pk-rollen' }, ...reihenfolge.map(function (r) { return feld(r, rollenFelder[r]); })))
      : null,
    feld('Projekt oder Veranstaltung (freiwillig)', bezug),
    el('div', { class: 'pk-text-kopf' }, el('span', { class: 'formlabel', text: 'Protokolltext' }), topKnopf),
    text,
    zaehler,
    el('p', { class: 'leise pk-hinweis', text:
      'Schreibe nichts auf, was Dritte persönlich betrifft (Namen von Personen außerhalb der Gruppe, Gesundheit, Adressen).' }),
    npBox,
    neu
      ? el('div', { class: 'pk-entwurf' },
        el('p', { class: 'leise', text: 'Der Entwurf bleibt auf diesem Gerät, bis du speicherst oder verwirfst. Andere Geräte sehen ihn nicht.' }),
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
    el('div', { class: 'form-knoepfe' }, speichernKnopf,
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen', onclick: function () { fenster.schliessen(); } }))
  );
  form.addEventListener('input', merken);
  form.addEventListener('change', merken);
  form.addEventListener('submit', function (ev) { ev.preventDefault(); speichern(); });

  artGeaendert();
  zaehlen();

  fenster = zeigeFenster(neu ? 'Neues Protokoll' : 'Protokoll bearbeiten', form, function () {
    // Beim Schließen sofort sichern (Esc, ✕, Abbrechen)
    const offen = timer !== null;
    sichern();
    if (neu && geaendert && !gespeichert && (offen || getEntwurf(opt.gruppeId))) toast('Der Entwurf ist auf diesem Gerät gesichert.');
  });
  const box = form.closest('.modal-box');
  if (box) box.classList.add('modal-vollbild');
}
