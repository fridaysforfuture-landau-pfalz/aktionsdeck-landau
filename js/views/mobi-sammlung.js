// js/views/mobi-sammlung.js
// Fenster „+ Beiträge planen“: Kanäle wählen, dann Standard-Beiträge in einer Vorschau prüfen und gemeinsam anlegen.
// Schritt 1: Kanäle als Häkchen (nach Kanalgruppen), darunter „Sonstiges“ mit freiem Titel.
// Schritt 2: Vorschau mit Haken, Titel, Format und Datum (änderbar). Was es schon gibt, ist grau.
// Datum = Bezugsdatum minus tage_vorher (js/kanaele.js, STANDARD_BEITRAEGE).
//
// opt: { ctx, token, kurzname,
//        bezug: { feld ('projekt_id' | 'veranstaltung_id'), id, titel, datum, datumName },
//        vorhandene: Beiträge dieses Projekts oder dieser Veranstaltung,
//        beiFertig() -> Promise }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { toast } from '../ui/toast.js';
import { KANALGRUPPEN, kanaeleDerGruppe, kanaeleFuer, kanalInfo, STANDARD_BEITRAEGE, FORMAT_TEXT } from '../kanaele.js';
import { faelligAus } from '../vorlagen.js';
import { normDatum, datumText } from './todos-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function schluessel(kanalName, titel) {
  return txt(kanalName).toLowerCase() + '|' + txt(titel).toLowerCase();
}

export function zeigeSammlung(opt) {
  const bezug = opt.bezug;
  const bezugDatum = normDatum(bezug.datum);
  const sonstiges = kanalInfo('Sonstiges');

  // Was es schon gibt (Kanal + Titel)
  const vorhanden = {};
  (opt.vorhandene || []).forEach(function (b) { vorhanden[schluessel(b.kanal, b.titel)] = true; });

  // Zustand bleibt beim Wechsel zwischen den Schritten erhalten
  const gewaehlt = {};      // Kanal-Kennung -> true
  let eigenerTitel = '';
  const aenderung = {};     // Zeilen-Schlüssel -> { an, titel, format, datum }

  let fenster = null;
  const inhalt = el('div', { class: 'mobi-sammlung' });

  function datumHinweis() {
    if (bezugDatum) {
      return el('p', { class: 'leise', text: 'Bezugsdatum: ' + bezug.datumName + ' ' + datumText(bezugDatum) + '. ' +
        'Die Termine werden davon zurückgerechnet.' });
    }
    return el('p', {
      class: 'mobi-hinweis',
      text: 'Es gibt noch kein ' + bezug.datumName + '. Die Beiträge bekommen darum kein Datum. ' +
        'Du kannst das Datum in der Vorschau eintragen oder später im Beitrag.'
    });
  }

  // ---- Schritt 1: Kanäle ----

  function schritt1() {
    inhalt.textContent = '';
    inhalt.append(
      el('p', { class: 'leise', text: 'Wähle die Kanäle. Pro Kanal werden Standard-Beiträge vorgeschlagen. ' +
        'Im nächsten Schritt kannst du einzelne abwählen und Titel, Format und Datum ändern.' }),
      datumHinweis()
    );
    KANALGRUPPEN.filter(function (g) { return g.id !== 'sonstiges'; }).forEach(function (g) {
      const kanaele = kanaeleDerGruppe(g.id, opt.kurzname).filter(function (k) {
        return (STANDARD_BEITRAEGE[k.id] || []).length;
      });
      if (!kanaele.length) return;
      const liste = el('div', { class: 'vorlage-liste' });
      kanaele.forEach(function (k) {
        const n = STANDARD_BEITRAEGE[k.id].length;
        const cb = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': k.name });
        cb.checked = !!gewaehlt[k.id];
        cb.addEventListener('change', function () {
          if (cb.checked) gewaehlt[k.id] = true;
          else delete gewaehlt[k.id];
        });
        const punkt = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
        punkt.style.background = k.farbe;
        liste.append(el('label', { class: 'vorlage-zeile' },
          cb,
          el('span', { class: 'vorlage-text' },
            el('span', { class: 'mobi-kachel-kanal' }, punkt, el('strong', { text: k.name })),
            el('span', { class: 'leise', text: n + (n === 1 ? ' Beitrag' : ' Beiträge') })
          )
        ));
      });
      inhalt.append(el('h3', { class: 'teil-titel-klein', text: g.name }), liste);
    });

    const eigen = el('input', {
      class: 'feld', type: 'text', maxlength: '200', 'aria-label': 'Eigener Beitrag (Titel)',
      placeholder: 'Eigener Beitrag, z. B. Banner am Infostand (leer = keiner)'
    });
    eigen.value = eigenerTitel;
    eigen.addEventListener('input', function () { eigenerTitel = eigen.value; });
    inhalt.append(
      el('h3', { class: 'teil-titel-klein', text: 'Sonstiges' }),
      el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Eigener Titel' }), eigen)
    );

    const fehler = el('p', { class: 'fehler' });
    inhalt.append(fehler, el('div', { class: 'form-knoepfe' },
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen',
        onclick: function () { fenster.schliessen(); }
      }),
      el('button', {
        class: 'knopf', type: 'button', text: 'Weiter ›',
        onclick: function () {
          if (!Object.keys(gewaehlt).length && !txt(eigenerTitel)) {
            fehler.textContent = 'Bitte mindestens einen Kanal wählen oder einen eigenen Titel eintragen.';
            return;
          }
          schritt2();
        }
      })
    ));
  }

  // ---- Schritt 2: Vorschau ----

  // Alle vorgeschlagenen Beiträge, in der Reihenfolge der Kanäle
  function vorschlaege() {
    const liste = [];
    kanaeleFuer(opt.kurzname).forEach(function (k) {
      if (!gewaehlt[k.id]) return;
      (STANDARD_BEITRAEGE[k.id] || []).forEach(function (sb) {
        liste.push({
          key: k.id + '|' + sb.name,
          kanal: k,
          titel: sb.name,
          format: sb.format,
          datum: faelligAus(bezugDatum, sb.tage_vorher)
        });
      });
    });
    if (txt(eigenerTitel)) {
      liste.push({ key: 'sonstiges|' + txt(eigenerTitel), kanal: sonstiges, titel: txt(eigenerTitel), format: 'sonstiges', datum: '' });
    }
    return liste;
  }

  function schritt2() {
    inhalt.textContent = '';
    const zeilen = [];
    const anlegenKnopf = el('button', { class: 'knopf', type: 'button' });
    const fehler = el('p', { class: 'fehler' });

    function zaehlen() {
      const n = zeilen.filter(function (z) { return !z.gibtEs && z.cb.checked; }).length;
      anlegenKnopf.textContent = n === 1 ? '1 Beitrag anlegen' : n + ' Beiträge anlegen';
      anlegenKnopf.disabled = n === 0;
    }

    inhalt.append(
      el('p', { class: 'leise', text: 'Haken weg = Beitrag wird nicht angelegt. Alle starten mit Status „Idee“.' }),
      datumHinweis()
    );

    let aktuellerKanal = '';
    let liste = null;
    vorschlaege().forEach(function (v) {
      if (v.kanal.name !== aktuellerKanal) {
        aktuellerKanal = v.kanal.name;
        const punkt = el('span', { class: 'mobi-punkt', 'aria-hidden': 'true' });
        punkt.style.background = v.kanal.farbe;
        liste = el('div', { class: 'vorlage-liste' });
        inhalt.append(el('h3', { class: 'teil-titel-klein mobi-kachel-kanal' }, punkt, el('span', { text: v.kanal.name })), liste);
      }
      const gibtEs = !!vorhanden[schluessel(v.kanal.name, v.titel)];
      const a = aenderung[v.key] || {};

      const cb = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': v.titel + ' anlegen' });
      cb.checked = !gibtEs && a.an !== false;
      cb.disabled = gibtEs;
      const titel = el('input', { class: 'feld mobi-vorschau-titel', type: 'text', maxlength: '200', 'aria-label': 'Titel' });
      titel.value = a.titel !== undefined ? a.titel : v.titel;
      const format = el('select', { class: 'feld', 'aria-label': 'Format' });
      Object.keys(FORMAT_TEXT).forEach(function (w) { format.append(el('option', { value: w, text: FORMAT_TEXT[w] })); });
      format.value = a.format !== undefined ? a.format : v.format;
      const datum = el('input', { class: 'feld vorlage-datum', type: 'date', 'aria-label': 'Datum' });
      datum.value = a.datum !== undefined ? a.datum : v.datum;
      datum.addEventListener('click', function () {
        try { if (typeof datum.showPicker === 'function') datum.showPicker(); } catch (e) { /* ignorieren */ }
      });
      [titel, format, datum].forEach(function (f) { f.disabled = gibtEs; });

      function merken() {
        aenderung[v.key] = { an: cb.checked, titel: titel.value, format: format.value, datum: datum.value };
      }
      cb.addEventListener('change', function () { merken(); zaehlen(); });
      [titel, format, datum].forEach(function (f) { f.addEventListener('change', merken); });
      titel.addEventListener('input', merken);

      zeilen.push({ v: v, gibtEs: gibtEs, cb: cb, titel: titel, format: format, datum: datum });
      liste.append(el('div', { class: 'vorlage-zeile mobi-vorschau' + (gibtEs ? ' gibt-es' : '') },
        cb,
        el('div', { class: 'vorlage-text' },
          el('div', { class: 'mobi-vorschau-felder' }, titel, format, datum),
          gibtEs ? el('span', { class: 'leise', text: 'Gibt es schon' }) : null
        )
      ));
    });

    async function anlegen() {
      fehler.textContent = '';
      const neu = [];
      for (let i = 0; i < zeilen.length; i++) {
        const z = zeilen[i];
        if (z.gibtEs || !z.cb.checked) continue;
        const t = txt(z.titel.value);
        if (!t) {
          fehler.textContent = 'Ein gewählter Beitrag hat keinen Titel. Bitte eintragen oder den Haken entfernen.';
          z.titel.focus();
          return;
        }
        // Auch geänderte Titel nicht doppelt anlegen
        if (vorhanden[schluessel(z.v.kanal.name, t)]) continue;
        const d = { kanal: z.v.kanal.name, format: z.format.value, titel: t, datum: z.datum.value || '', status: 'idee' };
        d[bezug.feld] = bezug.id;
        neu.push(d);
      }
      if (!neu.length) {
        fehler.textContent = 'Es gibt nichts Neues zum Anlegen.';
        return;
      }
      anlegenKnopf.disabled = true;
      anlegenKnopf.textContent = 'Lege an …';
      try {
        await api('batchCreate', { tabelle: 'Mobi_Plan', liste: neu }, opt.token);
        fenster.schliessen();
        toast(neu.length === 1 ? '1 Beitrag angelegt.' : neu.length + ' Beiträge angelegt.');
        await opt.beiFertig();
      } catch (e) {
        if (opt.ctx.behandleFehler(e)) return;
        fehler.textContent = e.code === 'nicht_gefunden'
          ? 'Das Projekt oder die Veranstaltung gibt es nicht mehr.'
          : e.message;
        zaehlen();
      }
    }

    anlegenKnopf.addEventListener('click', anlegen);
    inhalt.append(fehler, el('div', { class: 'form-knoepfe' },
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: '‹ Zurück',
        onclick: function () { schritt1(); }
      }),
      anlegenKnopf
    ));
    zaehlen();
  }

  schritt1();
  fenster = zeigeFenster('Beiträge planen: ' + txt(bezug.titel), inhalt);
}
