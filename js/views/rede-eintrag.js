// js/views/rede-eintrag.js
// Formular „+ Rede“ / „Rede bearbeiten“ (Etappe 8, Schritt 8.6). Steht direkt im Inhalt (kein Fenster),
// wie das Protokoll-Formular. Felder: Titel, Redner, Datum, Projekt oder Veranstaltung, Aktionsart,
// Redetext (seit 8.8, Standard: die Rede steht in der App; Absätze mit Kommentaren, js/views/rede-text.js), Status, Notiz,
// Link freiwillig (falls die Rede woanders geschrieben wird; nur https://, Warnung bei anderen Seiten als Google Docs/Drive).
// Löschen nur von Hand im Detail (reden.js). Ändern mit Konfliktprüfung.
// Jede Eingabe wird auf dem Gerät gemerkt (store.js, setRedeEntwurf). So geht beim Reiterwechsel nichts verloren:
// reden.js öffnet das Formular danach mit opt.entwurf wieder. Speichern oder „Schließen“ löscht den Entwurf.
//
// baueRedeFormular(opt) -> { el, schliessen(still) } (schliessen gibt false zurück, wenn die Person abbricht)
// opt: { ctx, token, daten: { reden, projekte, veranstaltungen, personen, kommentare }, eintrag (null = neu),
//        vorgabe ({ projekt_id, veranstaltung_id }, freiwillig), entwurf (aus getRedeEntwurf, freiwillig),
//        beiZu(), nachSpeichern(eintrag) }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';
import { getName, setRedeEntwurf, loescheRedeEntwurf } from '../store.js';
import { baueRedeText } from './rede-text.js';
import { zeitText } from './material-rechnen.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import { addTage, sichereUrl } from './kalender-rechnen.js';
import { istAbgeschlossen } from './projekt-rechnen.js';
import { istWahr } from '../schema.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// Status einer Rede: gespeichert klein, angezeigt groß. Reihenfolge = Weiterschalten.
export const REDE_STATI = [
  { wert: 'entwurf', label: 'Entwurf' },
  { wert: 'probelesen', label: 'Probelesen' },
  { wert: 'fertig', label: 'Fertig' },
  { wert: 'gehalten', label: 'Gehalten' }
];

export function redeStatusText(s) {
  const x = REDE_STATI.find(function (y) { return y.wert === txt(s).toLowerCase(); });
  return x ? x.label : (txt(s) || 'Entwurf');
}

// Nächster Status (oder '' wenn schon „Gehalten“)
export function naechsterStatus(s) {
  const i = REDE_STATI.findIndex(function (y) { return y.wert === (txt(s).toLowerCase() || 'entwurf'); });
  return i >= 0 && i < REDE_STATI.length - 1 ? REDE_STATI[i + 1].wert : '';
}

// Link prüfen: '' = in Ordnung, sonst Hinweis. pflicht: nur https://. warnung: andere Seite als Google Docs/Drive.
export function linkPruefen(link) {
  const l = txt(link);
  if (!l) return { fehler: '', warnung: '' };
  if (!/^https:\/\//i.test(l) || !sichereUrl(l)) return { fehler: 'Der Link muss mit https:// beginnen.', warnung: '' };
  const host = l.replace(/^https:\/\/([^/?#]+).*$/i, '$1').toLowerCase();
  if (host !== 'docs.google.com' && host !== 'drive.google.com') {
    return { fehler: '', warnung: 'Achtung: Das ist kein Google-Docs- oder Drive-Link. Speichern geht trotzdem.' };
  }
  return { fehler: '', warnung: '' };
}

function feld(label, eingabe, extra) {
  return el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: label }), eingabe, extra || null);
}

function liste(id, werte) {
  return el('datalist', { id: id }, ...werte.slice(0, 30).map(function (v) { return el('option', { value: v }); }));
}

function eindeutig(werte) {
  const l = [];
  werte.forEach(function (w) {
    const t = txt(w);
    if (t && !l.some(function (x) { return x.toLowerCase() === t.toLowerCase(); })) l.push(t);
  });
  return l.sort(function (a, b) { return a.localeCompare(b, 'de'); });
}

export function baueRedeFormular(opt) {
  const r = opt.eintrag || null;
  const d = opt.daten;
  const v = opt.vorgabe || {};
  const ent = opt.entwurf || null;
  const ef = ent ? ent.felder : null;
  const gruppe = opt.ctx.session.gruppe_id;
  const bekannt = ent ? ent.bekannt : (r ? r.geaendert_am : '');
  let zu = false;
  let geaendert = !!ent;

  const startBezug = r
    ? (txt(r.projekt_id) ? 'p:' + txt(r.projekt_id) : (txt(r.veranstaltung_id) ? 'v:' + txt(r.veranstaltung_id) : ''))
    : (txt(v.projekt_id) ? 'p:' + txt(v.projekt_id) : (txt(v.veranstaltung_id) ? 'v:' + txt(v.veranstaltung_id) : ''));

  const titel = el('input', { class: 'feld', type: 'text', maxlength: '200' });
  titel.value = r ? txt(r.titel) : '';
  const redner = el('input', { class: 'feld', type: 'text', maxlength: '100', list: 'rede-redner' });
  redner.value = r ? txt(r.redner) : '';
  const rednerListe = liste('rede-redner', eindeutig((d.reden || []).map(function (x) { return x.redner; })
    .concat((d.personen || []).filter(function (p) { return p.aktiv === undefined || p.aktiv === '' || istWahr(p.aktiv); })
      .map(function (p) { return p.name; })).concat([getName()])));
  const datum = el('input', { class: 'feld', type: 'date' });
  datum.value = r ? normDatum(r.datum) : '';
  datum.addEventListener('click', function () {
    try { if (typeof datum.showPicker === 'function') datum.showPicker(); } catch (e) { /* ignorieren */ }
  });

  // Projekt oder Veranstaltung: offene Projekte und Veranstaltungen ab 60 Tagen vor heute (und der gespeicherte Bezug)
  const bezug = el('select', { class: 'feld' }, el('option', { value: '', text: '– keins –' }));
  const ab = addTage(heuteIso(), -60);
  const projekte = (d.projekte || []).filter(function (x) { return !istAbgeschlossen(x) || 'p:' + x.id === startBezug; })
    .sort(function (a, b) { return txt(a.titel).localeCompare(txt(b.titel), 'de'); });
  const veranst = (d.veranstaltungen || []).filter(function (x) {
    const t = normDatum(x.datum_ende) || normDatum(x.datum);
    return (!!t && t >= ab) || 'v:' + x.id === startBezug;
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
  bezug.value = ef ? txt(ef.bezug) : startBezug;
  if (bezug.value !== (ef ? txt(ef.bezug) : startBezug)) bezug.value = '';

  const aktionsart = el('input', { class: 'feld', type: 'text', maxlength: '60', list: 'rede-aktionsart' });
  aktionsart.value = r ? txt(r.aktionsart) : '';
  const artListe = liste('rede-aktionsart', eindeutig((d.reden || []).map(function (x) { return x.aktionsart; })
    .concat((d.projekte || []).map(function (x) { return x.aktionsart; }))));
  function projektArt(b) {
    if (b.indexOf('p:') !== 0) return '';
    const p = (d.projekte || []).find(function (x) { return 'p:' + x.id === b; });
    return p ? txt(p.aktionsart) : '';
  }
  // Aktionsart vom Projekt übernehmen, solange niemand selbst eine eingetragen hat
  let artAuto = '';
  function artNachfuehren() {
    const neu = projektArt(bezug.value);
    if (!txt(aktionsart.value) || aktionsart.value === artAuto) aktionsart.value = neu;
    artAuto = neu;
  }
  if (!r && !ef) artNachfuehren();
  bezug.addEventListener('change', artNachfuehren);

  const redeText = baueRedeText({
    ctx: opt.ctx, token: opt.token, rede: r, kommentare: d.kommentare || [],
    text: ef ? ef.text : (r ? r.text : '')
  });
  const link = el('input', { class: 'feld', type: 'url', maxlength: '500', placeholder: 'https://docs.google.com/document/d/…' });
  link.value = r ? txt(r.link) : '';
  const linkHinweis = el('p', { class: 'leise pk-hinweis' });
  function linkZeigen() {
    const p = linkPruefen(link.value);
    linkHinweis.textContent = p.fehler || p.warnung;
    linkHinweis.className = p.fehler || p.warnung ? 'fehler pk-hinweis' : 'leise pk-hinweis';
  }
  link.addEventListener('input', linkZeigen);

  const status = el('select', { class: 'feld' }, ...REDE_STATI.map(function (s) { return el('option', { value: s.wert, text: s.label }); }));
  status.value = r ? (txt(r.status).toLowerCase() || 'entwurf') : 'entwurf';
  const notiz = el('textarea', { class: 'feld', rows: '3', maxlength: '5000' });
  notiz.value = r ? String(r.notiz || '') : '';

  // Nicht gespeicherte Werte vom Gerät (nach einem Reiterwechsel)
  if (ef) {
    titel.value = String(ef.titel || '');
    redner.value = String(ef.redner || '');
    datum.value = String(ef.datum || '');
    aktionsart.value = String(ef.aktionsart || '');
    link.value = String(ef.link || '');
    status.value = String(ef.status || 'entwurf');
    if (!status.value) status.value = 'entwurf';
    notiz.value = String(ef.notiz || '');
  }

  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const speichernKnopf = el('button', { class: 'knopf', type: 'submit', text: r ? 'Speichern' : 'Anlegen' });

  // Werte von der Seite lesen (für den Entwurf auf dem Gerät)
  function felder() {
    return {
      titel: titel.value, redner: redner.value, datum: datum.value, bezug: bezug.value, aktionsart: aktionsart.value,
      text: redeText.wert(), link: link.value, status: status.value, notiz: notiz.value
    };
  }
  function merken(ev) {
    // Kommentar-Felder gehören nicht zur Rede
    if (ev && ev.target && ev.target.closest && ev.target.closest('.rede-schreibplatz')) return;
    geaendert = true;
    setRedeEntwurf(gruppe, r ? r.id : '', bekannt, felder());
  }

  // still = true: ohne Rückfrage (zum Beispiel nach dem Speichern oder Löschen)
  function schliessen(still) {
    if (zu) return true;
    if (!still && geaendert &&
      !window.confirm('Deine Änderungen an der Rede sind noch nicht gespeichert. Trotzdem schließen?')) return false;
    zu = true;
    loescheRedeEntwurf(gruppe);
    form.remove();
    if (opt.beiZu) opt.beiZu();
    return true;
  }

  async function speichern() {
    fehler.textContent = '';
    if (!txt(titel.value)) { fehler.textContent = '„Titel“ darf nicht leer sein.'; titel.focus(); return; }
    const p = linkPruefen(link.value);
    if (p.fehler) { fehler.textContent = p.fehler; link.focus(); return; }
    const b = bezug.value;
    const daten = {
      titel: txt(titel.value), redner: txt(redner.value), datum: datum.value,
      projekt_id: b.indexOf('p:') === 0 ? b.slice(2) : '',
      veranstaltung_id: b.indexOf('v:') === 0 ? b.slice(2) : '',
      aktionsart: txt(aktionsart.value), text: redeText.wert(),
      link: txt(link.value), status: status.value, notiz: txt(notiz.value)
    };
    speichernKnopf.disabled = true;
    speichernKnopf.textContent = 'Speichere …';
    try {
      let eintrag;
      if (!r) {
        eintrag = await api('create', { tabelle: 'Reden', daten: daten }, opt.token);
        toast('Rede angelegt.');
      } else {
        const res = await api('update', { tabelle: 'Reden', id: r.id, daten: daten, bekannt: bekannt }, opt.token);
        eintrag = res.eintrag;
        toast(res.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      schliessen(true);
      if (opt.nachSpeichern) await opt.nachSpeichern(eintrag);
    } catch (e) {
      speichernKnopf.disabled = false;
      speichernKnopf.textContent = r ? 'Speichern' : 'Anlegen';
      if (opt.ctx.behandleFehler(e)) return;
      fehler.textContent = e.code === 'konflikt'
        ? 'Jemand anderes hat diese Rede inzwischen geändert. Kopiere dir deinen Text, klicke auf „Schließen“ und öffne sie noch einmal.'
        : e.message;
    }
  }

  const form = el('form', { class: 'formular protokoll-form karte rede-form', novalidate: '' },
    el('h2', { text: r ? 'Rede bearbeiten' : 'Neue Rede' }),
    ent ? el('p', { class: 'leise pk-hinweis', text: 'Deine nicht gespeicherten Änderungen vom ' + zeitText(ent.zeit) + ' sind wieder da.' }) : null,
    feld('Titel *', titel),
    el('div', { class: 'pk-zwei' }, feld('Redner', redner, rednerListe), feld('Datum', datum)),
    feld('Projekt oder Veranstaltung (freiwillig)', bezug),
    feld('Aktionsart (zum Beispiel Demo, Infostand)', aktionsart, artListe),
    el('div', { class: 'formfeld' },
      el('span', { class: 'formlabel', text: 'Redetext' }),
      r ? el('p', { class: 'leise pk-hinweis', text: 'Jeder Absatz hat ein eigenes Feld. Eine Leerzeile macht beim Speichern einen neuen Absatz. ' +
        'Die Kommentare stehen am PC rechts neben dem Absatz, am Handy darunter.' }) : null,
      redeText.el),
    feld('Status', status),
    feld('Notiz (zum Beispiel Dauer, Reihenfolge)', notiz),
    feld('Link (freiwillig, falls die Rede woanders geschrieben ist, https://…)', link),
    el('p', { class: 'leise pk-hinweis', text: 'Bei einem Drive-Dokument: Gib es so frei, dass deine Gruppe kommentieren kann. Die App teilt nichts.' }),
    linkHinweis,
    fehler,
    el('div', { class: 'form-knoepfe' }, speichernKnopf,
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Schließen', onclick: function () { schliessen(false); } }))
  );
  form.addEventListener('submit', function (ev) { ev.preventDefault(); speichern(); });
  form.addEventListener('input', merken);
  form.addEventListener('change', merken);
  linkZeigen();
  return { el: form, schliessen: schliessen };
}
