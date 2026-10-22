// js/views/reden.js
// Reden-Archiv (Etappe 8, Schritt 8.6) im Reiter „Dokumentation“ (Umschalter „Reden“ in protokoll.js).
// Liste neueste zuerst, nichts wird ausgeblendet. Je Rede: Titel, Redner, Datum, Projekt oder Veranstaltung,
// Status als Marke, 💬-Zahl. Suche (Titel, Redner, Aktionsart, Projekt, Veranstaltung, Notiz), Filter Status und Jahr.
// Klick öffnet die Rede im Detailbereich: alle Felder, „Dokument öffnen“, Status weiterschalten, „Bearbeiten“,
// darunter die Kommentare zum Probelesen (bezug_art „rede“).
// Seit 8.8: Knopf „Löschen“ (nur von Hand, weich, mit Rückfrage). Der Redetext steht nicht im Detail
// (zu schmal), sondern im Formular „Bearbeiten“: dort mit Kommentaren je Absatz (js/views/rede-text.js).
// Im Detail stehen die Kommentare zur ganzen Rede. Nicht gespeicherte Formulare kommen nach einem
// Reiterwechsel wieder (Entwurf auf dem Gerät, store.js).
//
// baueReden(container, ctx) -> Promise<{ neu(vorgabe), oeffne(id), bearbeite(id), laden(), weg() }>

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { toast } from '../ui/toast.js';
import { baueKommentare } from '../ui/kommentare.js';
import { zeitText } from './material-rechnen.js';
import { normDatum, datumText, kommentarZahlen, kommentarMarke } from './todos-rechnen.js';
import { sichereUrl } from './kalender-rechnen.js';
import { REDE_STATI, redeStatusText, naechsterStatus, baueRedeFormular } from './rede-eintrag.js';
import { absaetze, stelleLesen } from './rede-text.js';
import { getRedeEntwurf, loescheRedeEntwurf } from '../store.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function datumVon(r) {
  return normDatum(r.datum) || normDatum(txt(r.erstellt_am).slice(0, 10));
}

function statusMarke(s) {
  const w = txt(s).toLowerCase() || 'entwurf';
  return el('span', { class: 'rede-marke rede-' + w, text: redeStatusText(w) });
}

export async function baueReden(container, ctx) {
  const s = ctx.session;
  const cacheKey = s.gruppe_id + ':reden';
  let daten = { reden: [], projekte: [], veranstaltungen: [], kommentare: [], personen: [] };
  let meta = null;
  let offline = false;
  let zahlen = {};
  let formular = null;
  let offeneId = '';   // Rede, die gerade im Detail steht (nach dem Aktualisieren wieder zeigen)

  const status = el('p', { class: 'leise', text: 'Lade Reden …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen (Titel, Redner, Aktionsart, Projekt …)', 'aria-label': 'Reden suchen'
  });
  const statusWahl = el('select', { class: 'feld', 'aria-label': 'Status' },
    el('option', { value: '', text: 'Alle Status' }),
    ...REDE_STATI.map(function (x) { return el('option', { value: x.wert, text: x.label }); }));
  const jahrWahl = el('select', { class: 'feld', 'aria-label': 'Jahr' });
  const boxForm = el('div', { class: 'protokoll-formplatz' });
  const box = el('div', { class: 'protokoll-liste' });

  leeren(container);
  container.append(
    el('div', { class: 'filterzeile reden-filter' }, suche, statusWahl, jahrWahl),
    status,
    boxForm,
    box
  );

  function projektTitel(id) {
    const p = daten.projekte.find(function (x) { return String(x.id) === String(id); });
    return p ? txt(p.titel) : '';
  }
  function veranstTitel(id) {
    const v = daten.veranstaltungen.find(function (x) { return String(x.id) === String(id); });
    return v ? txt(v.titel) : '';
  }
  function bezugText(r) {
    const t = [];
    if (txt(r.projekt_id)) t.push(projektTitel(r.projekt_id) || 'Projekt');
    if (txt(r.veranstaltung_id)) t.push('📅 ' + (veranstTitel(r.veranstaltung_id) || 'Veranstaltung'));
    return t.join(' · ');
  }
  function finde(id) {
    return daten.reden.find(function (r) { return String(r.id) === String(id); }) || null;
  }

  function jahreAufbauen() {
    const alt = jahrWahl.value;
    leeren(jahrWahl);
    jahrWahl.append(el('option', { value: '', text: 'Alle Jahre' }));
    const jahre = [];
    daten.reden.forEach(function (r) {
      const j = datumVon(r).slice(0, 4);
      if (j && jahre.indexOf(j) < 0) jahre.push(j);
    });
    jahre.sort().reverse().forEach(function (j) { jahrWahl.append(el('option', { value: j, text: j })); });
    jahrWahl.value = jahre.indexOf(alt) >= 0 ? alt : '';
  }

  function passt(r) {
    if (statusWahl.value && (txt(r.status).toLowerCase() || 'entwurf') !== statusWahl.value) return false;
    if (jahrWahl.value && datumVon(r).slice(0, 4) !== jahrWahl.value) return false;
    const q = txt(suche.value).toLowerCase();
    if (!q) return true;
    return [r.titel, r.redner, r.aktionsart, r.notiz, r.text, bezugText(r)].some(function (x) {
      return txt(x).toLowerCase().indexOf(q) >= 0;
    });
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
      ? daten.reden.length + (daten.reden.length === 1 ? ' Rede' : ' Reden') + ' · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  function zeichne() {
    statusZeigen();
    leeren(box);
    if (!meta) return;
    if (!daten.reden.length) {
      box.append(el('p', { class: 'leise', text: 'Noch keine Reden. Mit „+ Rede“ legst du die erste an.' }));
      return;
    }
    const liste = daten.reden.filter(passt).sort(function (a, b) {
      return datumVon(b).localeCompare(datumVon(a)) || txt(b.erstellt_am).localeCompare(txt(a.erstellt_am));
    });
    if (!liste.length) {
      box.append(el('p', { class: 'leise', text: 'Keine Rede passt zu Suche und Filter.' }));
      return;
    }
    box.append(el('ul', { class: 'dash-todo-liste' }, ...liste.map(function (r) {
      const zeile1 = [normDatum(r.datum) ? datumText(r.datum) : '', bezugText(r)].filter(Boolean).join(' · ');
      const zeile3 = [txt(r.redner) ? 'Redner: ' + txt(r.redner) : '', txt(r.aktionsart)].filter(Boolean).join(' · ');
      return el('li', null, el('button', {
        class: 'dash-todo protokoll-zeile', type: 'button', onclick: function () { lesen(r); }
      },
        zeile1 ? el('span', { class: 'leise', text: zeile1 }) : null,
        el('strong', { text: (txt(r.titel) || 'Rede') + kommentarMarke(zahlen[String(r.id)]) }),
        zeile3 ? el('span', { class: 'leise', text: zeile3 }) : null,
        statusMarke(r.status)
      ));
    })));
  }

  // ---- Detail ----

  function lesen(r) {
    offeneId = String(r.id);
    const dl = el('dl', { class: 'detail-liste' });
    function paar(name, wert, mehrzeilig) {
      if (!txt(wert)) return;
      dl.append(el('dt', { text: name }), el('dd', { class: mehrzeilig ? 'notiz' : '', text: txt(wert) }));
    }
    paar('Redner', r.redner);
    paar('Datum', normDatum(r.datum) ? datumText(r.datum) : '');
    paar('Projekt', txt(r.projekt_id) ? (projektTitel(r.projekt_id) || 'Projekt (nicht mehr da)') : '');
    paar('Veranstaltung', txt(r.veranstaltung_id) ? (veranstTitel(r.veranstaltung_id) || 'Veranstaltung (nicht mehr da)') : '');
    paar('Aktionsart', r.aktionsart);
    paar('Notiz', r.notiz, true);
    // Redetext nur als Zusammenfassung (8.8): lesen und kommentieren im Formular
    const teile = absaetze(r.text);
    if (teile.length) {
      const nAbs = daten.kommentare.filter(function (k) {
        return txt(k.bezug_art) === 'rede' && txt(k.bezug_id) === String(r.id) && txt(k.stelle) && stelleLesen(k.stelle).nr > 0;
      }).length;
      paar('Redetext', teile.length + (teile.length === 1 ? ' Absatz' : ' Absätze') +
        (nAbs ? ' · ' + nAbs + (nAbs === 1 ? ' Kommentar' : ' Kommentare') + ' zu Absätzen' : ''));
    }

    const knoepfe = el('div', { class: 'form-knoepfe protokoll-knoepfe' });
    const link = sichereUrl(r.link);
    if (link && /^https:\/\//i.test(link)) {
      knoepfe.append(el('a', { class: 'knopf', href: link, target: '_blank', rel: 'noopener noreferrer', text: 'Dokument öffnen' }));
    }
    const weiter = naechsterStatus(r.status);
    if (weiter) {
      const k = el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Status: → ' + redeStatusText(weiter),
        onclick: async function () {
          k.disabled = true;
          try {
            // Wie ein Haken: ohne Konfliktprüfung
            await api('update', { tabelle: 'Reden', id: r.id, daten: { status: weiter } }, s.token);
            toast('Status: ' + redeStatusText(weiter) + '.');
            await laden(false);
            const neu = finde(r.id);
            if (neu) lesen(neu);
          } catch (e) {
            if (ctx.behandleFehler(e)) return;
            toast(e.message);
            k.disabled = false;
          }
        }
      });
      knoepfe.append(k);
    }
    knoepfe.append(el('button', {
      class: 'knopf' + (teile.length ? '' : ' knopf-hell'), type: 'button',
      text: teile.length ? 'Bearbeiten und Absätze kommentieren' : 'Bearbeiten',
      onclick: function () { formularOeffnen(r); }
    }));
    knoepfe.append(el('button', {
      class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen', onclick: function () { loeschen(r); }
    }));

    const kommentare = baueKommentare({
      ctx: ctx, token: s.token, art: 'rede', bezugId: r.id, projektId: txt(r.projekt_id),
      titel: 'Probelesen: Kommentare zur ganzen Rede',
      platzhalter: 'Anmerkung zur ganzen Rede …',
      leerText: 'Noch keine Anmerkungen zur ganzen Rede. Zu einzelnen Absätzen kommentierst du unter „Bearbeiten“.',
      ohneStelle: true,
      // Neuer oder gelöschter Kommentar: Liste neu laden, damit die 💬-Zahl stimmt
      beiAenderung: function () { laden(false); }
    });

    const inhalt = el('div', { class: 'protokoll-lesen' },
      el('p', null, statusMarke(r.status)),
      dl,
      knoepfe,
      kommentare.el
    );
    zeigeDetail(ctx.detail, txt(r.titel) || 'Rede', inhalt, function () { offeneId = ''; }, true);
  }

  // Löschen nur von Hand (8.8): weich, das Skript prüft vonHand
  async function loeschen(r) {
    if (!window.confirm('Die Rede „' + (txt(r.titel) || 'Rede') + '“ wirklich löschen? Sie verschwindet für die ganze Gruppe ' +
      'aus der App, auch mit ihren Kommentaren. Im Sheet bleibt sie als gelöscht markiert stehen.')) return;
    try {
      await api('delete', { tabelle: 'Reden', id: r.id, bekannt: r.geaendert_am, vonHand: true }, s.token);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.code === 'konflikt' ? 'Jemand anderes hat die Rede gerade geändert. Bitte neu öffnen.' : e.message);
      await laden(false);
      return;
    }
    if (formular) formular.schliessen(true);
    toast('Rede gelöscht.');
    offeneId = '';
    schliesseDetail(ctx.detail);
    await laden(false);
  }

  // ---- Formular im Inhalt ----

  function formularOeffnen(r, vorgabe, entwurf) {
    if (formular && !formular.schliessen(false)) return;
    // Für Text und Kommentare braucht das Formular die ganze Breite: Detail schließen (auch am PC, 8.8)
    if (r && ctx.detail) schliesseDetail(ctx.detail);
    formular = baueRedeFormular({
      ctx: ctx, token: s.token, daten: daten, eintrag: r || null, vorgabe: vorgabe || null, entwurf: entwurf || null,
      beiZu: function () { formular = null; },
      nachSpeichern: async function (eintrag) {
        await laden(false);
        const neu = finde(eintrag && eintrag.id);
        if (neu) lesen(neu);
      }
    });
    leeren(boxForm);
    boxForm.append(formular.el);
    if (boxForm.scrollIntoView) boxForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    ['reden', 'projekte', 'veranstaltungen', 'kommentare', 'personen'].forEach(function (k) { if (!neu[k]) neu[k] = []; });
    daten = neu;
    meta = m;
    offline = false;
    zahlen = kommentarZahlen(daten.kommentare, 'rede');
    jahreAufbauen();
    zeichne();
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        cacheKey,
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Reden', 'Projekte', 'Veranstaltungen', 'Kommentare', 'Personen']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            reden: t.Reden || [], projekte: t.Projekte || [], veranstaltungen: t.Veranstaltungen || [],
            kommentare: t.Kommentare || [], personen: t.Personen || []
          };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) { offline = true; statusZeigen(); }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Reden konnten nicht geladen werden: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  statusWahl.addEventListener('change', zeichne);
  jahrWahl.addEventListener('change', zeichne);
  await laden(true);

  // Nicht gespeicherte Rede vom letzten Mal (zum Beispiel nach einem Reiterwechsel) wieder öffnen
  function entwurfWiederOeffnen() {
    const e = getRedeEntwurf(s.gruppe_id);
    if (!e) return false;
    const r = e.id ? finde(e.id) : null;
    if (e.id && !r) { loescheRedeEntwurf(s.gruppe_id); return false; }
    formularOeffnen(r, null, e);
    return true;
  }
  entwurfWiederOeffnen();

  return {
    neu: function (vorgabe) { formularOeffnen(null, vorgabe); },
    oeffne: function (id) { const r = finde(id); if (r) lesen(r); else toast('Diese Rede gibt es nicht mehr.'); },
    bearbeite: function (id) { const r = finde(id); if (r) formularOeffnen(r); else toast('Diese Rede gibt es nicht mehr.'); },
    laden: function () { return laden(false); },
    weg: function () { if (offeneId) schliesseDetail(ctx.detail); offeneId = ''; }
  };
}
