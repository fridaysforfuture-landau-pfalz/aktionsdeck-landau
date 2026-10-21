// js/views/mobi-eintrag.js
// Fenster für einen Mobi-Beitrag: Anlegen, Ändern, Löschen, Text kopieren, Kommentare.
// opt: { ctx, token, kurzname, projektId, veranstaltungId, personen() -> Namensliste,
//        todoAnzahl(b) -> Zahl verknüpfter ToDos, neuLaden() -> Promise, beiFertig() -> Promise }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { baueKommentare } from '../ui/kommentare.js';
import { SCHEMA } from '../schema.js';
import { kanaeleFuer, kanalInfo, FORMAT_HINWEIS } from '../kanaele.js';
import { normDatum } from './todos-rechnen.js';
import { zeitNorm, sichereUrl } from './kalender-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function fehlerFuer(opt, e) {
  if (e.code === 'konflikt') {
    opt.neuLaden();
    return new Error('Jemand anderes hat diesen Beitrag gerade geändert. ' +
      'Klicke auf „Abbrechen“ und öffne ihn noch einmal.');
  }
  if (e.code === 'nicht_gefunden') {
    opt.neuLaden();
    return new Error('Diesen Beitrag gibt es nicht mehr. Klicke auf „Abbrechen“.');
  }
  return e;
}

function kopieren(text) {
  const fehlt = function () { toast('Kopieren hat nicht geklappt. Bitte den Text markieren.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('Text kopiert.'); }, fehlt);
  } else {
    fehlt();
  }
}

async function speichern(opt, b, d, fenster) {
  if (d.canva_link && !sichereUrl(d.canva_link)) {
    throw new Error('Der Canva-Link muss mit https:// oder http:// beginnen.');
  }
  try {
    if (!b) {
      const bez = d._bezug || '';
      delete d._bezug;
      d.projekt_id = bez ? (bez.indexOf('p:') === 0 ? bez.slice(2) : '') : (opt.projektId || '');
      d.veranstaltung_id = bez ? (bez.indexOf('v:') === 0 ? bez.slice(2) : '') : (opt.veranstaltungId || '');
      await api('create', { tabelle: 'Mobi_Plan', daten: d }, opt.token);
      toast('Beitrag angelegt.');
    } else {
      const r = await api('update', {
        tabelle: 'Mobi_Plan', id: b.id, daten: d, bekannt: b.geaendert_am
      }, opt.token);
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
    }
    fenster.schliessen();
    await opt.beiFertig();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    throw fehlerFuer(opt, e);
  }
}

async function loeschen(opt, b, fenster) {
  const n = opt.todoAnzahl ? opt.todoAnzahl(b) : 0;
  const frage = 'Diesen Beitrag wirklich löschen?\n\n„' + txt(b.titel) + '“' +
    (n ? '\n\nDabei werden auch ' + n + (n === 1 ? ' verknüpftes ToDo' : ' verknüpfte ToDos') +
      ' gelöscht.' : '');
  if (!window.confirm(frage)) return;
  try {
    await api('delete', { tabelle: 'Mobi_Plan', id: b.id, bekannt: b.geaendert_am }, opt.token);
    fenster.schliessen();
    toast('Gelöscht.');
    await opt.beiFertig();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'konflikt') {
      toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
      opt.neuLaden();
    } else {
      toast(e.message);
    }
  }
}

// b = null heißt neu. vorgabe = vorausgefüllte Werte beim Neuanlegen.
export function zeigeBeitragFormular(opt, b, vorgabe) {
  let fenster = null;
  const namen = kanaeleFuer(opt.kurzname).map(function (k) { return k.name; });
  if (b && txt(b.kanal) && namen.indexOf(txt(b.kanal)) < 0) namen.push(txt(b.kanal));

  const felder = SCHEMA.Mobi_Plan.felder.map(function (f) {
    if (f.name === 'kanal') return Object.assign({}, f, { typ: 'auswahl', optionen: namen });
    return f;
  });
  if (!b && opt.bezuege) {
    felder.unshift({
      name: '_bezug', label: 'Gehört zu (Projekt oder Veranstaltung)', typ: 'auswahl',
      optionen: opt.bezuege, pflicht: true
    });
  }
  const start = b
    ? Object.assign({}, b, { datum: normDatum(b.datum), uhrzeit: zeitNorm(b.uhrzeit) })
    : Object.assign({ status: 'idee', format: 'beitrag' }, vorgabe || {});

  const form = baueFormular(felder, start, {
    speichernText: b ? 'Speichern' : 'Anlegen',
    vorschlaege: { verantwortlich: opt.personen ? opt.personen() : [] },
    onSpeichern: function (d) { return speichern(opt, b, d, fenster); },
    onAbbrechen: function () { fenster.schliessen(); }
  });

  const hauptFeld = form.querySelector('textarea[name="text"]');
  const kanalFeld = form.querySelector('textarea[name="kanal_text"]');
  const kanalWahl = form.querySelector('select[name="kanal"]');
  const formatWahl = form.querySelector('select[name="format"]');
  const tagFeld = form.querySelector('input[name="hashtags"]');

  // Hinweis zum Bildformat
  const formatHinweis = el('span', { class: 'leise' });
  function formatZeigen() {
    formatHinweis.textContent = FORMAT_HINWEIS[formatWahl.value] || '';
  }
  formatWahl.closest('label').append(formatHinweis);
  formatWahl.addEventListener('change', formatZeigen);
  formatZeigen();

  // Zeichenzähler: gezählt wird der Kanal-Text, sonst der Haupt-Text
  const zaehler = el('span', { class: 'leise mobi-zaehler' });
  function zaehlen() {
    const t = kanalFeld.value.trim() ? kanalFeld.value : hauptFeld.value;
    const grenze = kanalInfo(kanalWahl.value).limit;
    const n = t.length;
    zaehler.textContent = n + (grenze ? ' von ' + grenze + ' Zeichen' : ' Zeichen') +
      (kanalFeld.value.trim() ? ' (Kanal-Text)' : ' (Haupt-Text)');
    zaehler.className = 'leise mobi-zaehler' + (grenze && n > grenze ? ' ueber' : '');
  }
  kanalFeld.closest('label').append(zaehler);
  [hauptFeld, kanalFeld].forEach(function (f) { f.addEventListener('input', zaehlen); });
  kanalWahl.addEventListener('change', zaehlen);
  zaehlen();

  const werkzeuge = el('div', { class: 'teil-aktionen' },
    el('button', {
      class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Haupt-Text übernehmen',
      onclick: function () {
        if (kanalFeld.value.trim() && !window.confirm('Den Kanal-Text durch den Haupt-Text ersetzen?')) return;
        kanalFeld.value = hauptFeld.value;
        zaehlen();
      }
    }),
    el('button', {
      class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Text kopieren',
      onclick: function () {
        const t = kanalFeld.value.trim() ? kanalFeld.value.trim() : hauptFeld.value.trim();
        const tags = tagFeld ? tagFeld.value.trim() : '';
        if (!t && !tags) { toast('Es gibt noch keinen Text.'); return; }
        kopieren(t + (tags ? '\n\n' + tags : ''));
      }
    })
  );

  const inhalt = el('div', null, werkzeuge, form);
  if (b) {
    inhalt.append(el('div', { class: 'fenster-loeschen' },
      el('button', {
        class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(opt, b, fenster); }
      })
    ));
    inhalt.append(baueKommentare({
      ctx: opt.ctx, token: opt.token, art: 'mobi', bezugId: b.id, projektId: txt(b.projekt_id)
    }).el);
  }
  fenster = zeigeFenster(b ? 'Beitrag bearbeiten' : 'Neuer Beitrag', inhalt);
}
