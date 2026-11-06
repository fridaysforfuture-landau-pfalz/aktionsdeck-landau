// js/views/material.js
// Reiter Material: Liste mit Suche, Kategorie- und Status-Filter, Details, Anlegen, Ändern,
// Löschen, Sammel-Ausleihe (Ausleihen / Zurückgeben) und Vormerken für Projekte.
// Die Auswahl bleibt beim Reiterwechsel erhalten (Merker außerhalb von render).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { features } from '../config.js';
import { zeigeListe } from '../ui/table.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { baueFormular } from '../ui/form.js';
import { verkleinern } from '../ui/bild.js';
import { toast } from '../ui/toast.js';
import { baueDetail, fotoId } from './material-detail.js';
import { zeigeBuchenDialog } from './material-buchen.js';
import { zeigeVormerkDialog } from './material-vormerken.js';
import {
  ausgeliehen, mitVerfuegbar, auswaehlbar, personenAus, zeitText,
  ausgeliehenProjekt, herkunftText, nachHerkunft
} from './material-rechnen.js';
import { istFalsch, SCHEMA } from '../schema.js';

// Bleibt beim Reiterwechsel erhalten. Neue Anmeldung (anderes Token) = leer.
let merk = { token: '', modus: null, gewaehlt: {} };

const OK_TEXT = { mitgenommen: 'Ausbuchen', zurueck: 'Zurückbuchen', vormerken: 'Vormerken' };
const HINWEIS = {
  mitgenommen: 'Wähle das Material aus, das du mitnimmst. Suche und Filter funktionieren weiter.',
  zurueck: 'Wähle aus, was zurückkommt. Hier steht festes Material, das draußen ist, und Verbrauchsmaterial.',
  vormerken: 'Wähle das Material, das du für ein Projekt vormerken willst. Du kannst auch in andere Reiter wechseln, die Auswahl bleibt.'
};

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  if (merk.token !== s.token) merk = { token: s.token, modus: null, gewaehlt: {} };

  let daten = { material: [], ausleihe: [], projekte: [] };
  let offenId = null;
  let formOffen = false;
  let modus = merk.modus;        // null | 'mitgenommen' | 'zurueck' | 'vormerken'
  let gewaehlt = merk.gewaehlt;  // { materialId: true }

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const kat = el('select', { class: 'feld', 'aria-label': 'Kategorie' });
  const ortWahl = el('select', { class: 'feld', 'aria-label': 'Ort' });
  const stat = el('select', { class: 'feld', 'aria-label': 'Status' },
    el('option', { value: 'aktiv', text: 'Aktive' }),
    el('option', { value: 'inaktiv', text: 'Nicht aktive' }),
    el('option', { value: 'alle', text: 'Alle' })
  );
  const box = el('div');

  const neuKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Neu',
    onclick: function () { offenId = null; formZeigen(null); }
  });
  const normal = el('div', { class: 'aktionsleiste' },
    el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Ausleihen',
      onclick: function () { modusSetzen('mitgenommen'); }
    }),
    el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Zurückgeben',
      onclick: function () { modusSetzen('zurueck'); }
    }),
    el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Vormerken',
      onclick: function () { modusSetzen('vormerken'); }
    })
  );
  const hinweis = el('p', { class: 'leise' });
  const zaehler = el('strong');
  const okKnopf = el('button', { class: 'knopf', type: 'button', onclick: buchenOeffnen });
  const leiste = el('div', { class: 'auswahl-leiste' },
    zaehler,
    el('div', { class: 'form-knoepfe' },
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen',
        onclick: function () { modusBeenden(); }
      }),
      okKnopf
    )
  );

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Material' }), neuKnopf),
    normal,
    hinweis,
    el('div', { class: 'filterzeile filter-material' }, suche, kat, ortWahl, stat),
    status,
    box,
    leiste
  ));

  // ---- Auswahl-Modus ----

  function leisteAktualisieren() {
    merk.modus = modus;
    merk.gewaehlt = gewaehlt;
    const n = Object.keys(gewaehlt).length;
    zaehler.textContent = n + ' ausgewählt';
    okKnopf.textContent = OK_TEXT[modus] || 'OK';
    okKnopf.disabled = n === 0;
  }

  function modusAnzeige() {
    normal.hidden = !!modus;
    hinweis.hidden = !modus;
    leiste.hidden = !modus;
    neuKnopf.disabled = !!modus;
    hinweis.textContent = HINWEIS[modus] || '';
    leisteAktualisieren();
  }

  function modusSetzen(art) {
    modus = art;
    gewaehlt = {};
    offenId = null;
    formOffen = false;
    schliesseDetail(ctx.detail);
    modusAnzeige();
    zeichne();
  }

  function modusBeenden() {
    modus = null;
    gewaehlt = {};
    modusAnzeige();
    zeichne();
  }

  // Vom Detail aus: dieses Material gleich auswählen
  function startMitMaterial(art, m) {
    modusSetzen(art);
    const z = mitVerfuegbar(m, ausgeliehen(daten.ausleihe));
    if (auswaehlbar(z, art)) {
      gewaehlt[m.id] = true;
    } else if (art === 'mitgenommen') {
      toast('Davon ist nichts verfügbar.');
    } else if (art === 'zurueck') {
      toast('Davon ist nichts ausgeliehen.');
    } else {
      toast('Nicht aktives Material kann nicht vorgemerkt werden.');
    }
    leisteAktualisieren();
    zeichne();
  }

  function fertig() {
    cacheSet(s.gruppe_id + ':projekte', null); // Projekte sollen nicht den alten Stand zeigen
    modus = null;
    gewaehlt = {};
    modusAnzeige();
    return laden(false);
  }
  
  function titelMap() {
    const t = {};
    daten.projekte.forEach(function (p) { t[String(p.id)] = String(p.titel); });
    return t;
  }

  // Projekte, für die noch ausgeliehen werden darf
  function offeneProjekte() {
    return daten.projekte.filter(function (p) {
      return p.status !== 'erledigt' && p.status !== 'archiviert';
    }).sort(function (a, b) { return String(a.titel).localeCompare(String(b.titel), 'de'); });
  }
  
  function buchenOeffnen() {
    const out = ausgeliehen(daten.ausleihe);
    let items = daten.material
      .filter(function (m) { return gewaehlt[m.id]; })
      .map(function (m) { return mitVerfuegbar(m, out); })
      .sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'de'); });
    if (!items.length) return;

    if (modus === 'vormerken') {
      zeigeVormerkDialog({ ctx: ctx, token: s.token, items: items, onFertig: fertig });
      return;
    }
    // Rückgabe: festes Material pro Herkunft (Projekt oder ohne Projekt) in eigener Zeile
    if (modus === 'zurueck') {
      items = nachHerkunft(items, ausgeliehenProjekt(daten.ausleihe), titelMap());
      if (!items.length) return;
    }
    zeigeBuchenDialog({
      ctx: ctx,
      token: s.token,
      art: modus,
      items: items,
      personen: personenAus(daten.ausleihe),
      projekte: offeneProjekte(),
      proProjekt: function () { return ausgeliehenProjekt(daten.ausleihe); },
      neuLaden: function () { return laden(false); },
      frisch: function () {
        const aktuell = ausgeliehen(daten.ausleihe);
        return daten.material.map(function (m) { return mitVerfuegbar(m, aktuell); });
      },
      onFertig: fertig
    });
  }

  // ---- Hilfen ----

  // Alle verschiedenen Werte einer Spalte, sortiert
  function werteVon(feld) {
    const liste = [];
    daten.material.forEach(function (m) {
      const k = String(m[feld] || '').trim();
      if (k && liste.indexOf(k) < 0) liste.push(k);
    });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  function kategorienAufbauen() {
    const gewaehltK = kat.value;
    const liste = werteVon('kategorie');
    leeren(kat);
    kat.append(el('option', { value: '', text: 'Alle Kategorien' }));
    liste.forEach(function (k) { kat.append(el('option', { value: k, text: k })); });
    kat.value = liste.indexOf(gewaehltK) >= 0 ? gewaehltK : '';
  }

  // Filter „Ort“: alle Orte, die im Material vorkommen
  function orteAufbauen() {
    const gewaehltO = ortWahl.value;
    const liste = werteVon('ort');
    leeren(ortWahl);
    ortWahl.append(el('option', { value: '', text: 'Alle Orte' }));
    liste.forEach(function (o) { ortWahl.append(el('option', { value: o, text: o })); });
    ortWahl.value = liste.indexOf(gewaehltO) >= 0 ? gewaehltO : '';
  }

  // ---- Detail ----

  function detailZeigen(id, neu) {
    const m = daten.material.find(function (x) { return String(x.id) === String(id); });
    if (!m) {
      offenId = null;
      schliesseDetail(ctx.detail);
      return;
    }
    const z = mitVerfuegbar(m, ausgeliehen(daten.ausleihe));
    const verlauf = daten.ausleihe.filter(function (a) {
      return String(a.material_id) === String(m.id);
    });
    const inhalt = el('div', null,
      el('div', { class: 'detail-knoepfe' },
        el('button', {
          class: 'knopf', type: 'button', text: 'Ausleihen',
          onclick: function () { startMitMaterial('mitgenommen', m); }
        }),
        el('button', {
          class: 'knopf', type: 'button', text: 'Zurückgeben',
          onclick: function () { startMitMaterial('zurueck', m); }
        }),
        el('button', {
          class: 'knopf', type: 'button', text: 'Vormerken',
          onclick: function () { startMitMaterial('vormerken', m); }
        })
      ),
      el('div', { class: 'detail-knoepfe' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
          onclick: function () { formZeigen(m); }
        }),
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(m); }
        })
      ),
      istFalsch(m.aktiv)
        ? el('p', { class: 'fehler', text: 'Dieses Material ist nicht aktiv. Zum Zurückholen: Bearbeiten und „Aktiv“ anhaken.' })
        : null,
      baueDetail(z, verlauf, herkunftText(ausgeliehenProjekt(daten.ausleihe)[String(m.id)], titelMap()))
    );
    zeigeDetail(ctx.detail, String(m.name), inhalt, function () { offenId = null; }, neu);
  }

  // ---- Formular: m = null heißt neu anlegen ----

  async function fotoHochladen(datei) {
    const bild = await verkleinern(datei);
    try {
      const r = await api('uploadImage', { bild: bild, mime: 'image/jpeg' }, s.token);
      return r.foto_id;
    } catch (e) {
      if (ctx.behandleFehler(e)) throw new Error('Bitte neu anmelden.');
      throw e;
    }
  }

  function formZeigen(m) {
    formOffen = true;
    const neuAnlegen = !m;
    const form = baueFormular(SCHEMA.Material.felder, m || {}, {
      speichernText: neuAnlegen ? 'Anlegen' : 'Speichern',
      vorschlaege: {
        kategorie: werteVon('kategorie'),
        unterkategorie: werteVon('unterkategorie')
      },
      fotoUpload: features.fotoUpload ? fotoHochladen : null,
      onSpeichern: function (d) { return speichern(m, d); },
      onAbbrechen: function () { formSchliessen(m); }
    });
    zeigeDetail(
      ctx.detail,
      neuAnlegen ? 'Neues Material' : 'Bearbeiten: ' + String(m.name),
      form,
      function () { formOffen = false; offenId = null; },
      true
    );
  }

  function formSchliessen(m) {
    formOffen = false;
    if (m) {
      offenId = m.id;
      detailZeigen(m.id, true);
    } else {
      offenId = null;
      schliesseDetail(ctx.detail);
    }
  }

  async function speichern(m, d) {
    const fid = fotoId(d.foto_id);
    if (d.foto_id && !fid) {
      throw new Error('Das Foto sieht nicht wie ein Google-Drive-Link oder eine Datei-ID aus.');
    }
    d.foto_id = fid;
    try {
      if (!m) {
        const o = await api('create', { tabelle: 'Material', daten: d }, s.token);
        formOffen = false;
        offenId = o.id;
        toast('Material angelegt.');
        await laden(false);
        detailZeigen(o.id, true);
        return;
      }
      const r = await api('update', {
        tabelle: 'Material', id: m.id, daten: d, bekannt: m.geaendert_am
      }, s.token);
      formOffen = false;
      offenId = m.id;
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      await laden(false);
      detailZeigen(m.id, true);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        laden(false);
        throw new Error('Jemand anderes hat dieses Material gerade geändert. ' +
          'Klicke auf „Abbrechen“ und öffne es noch einmal.');
      }
      throw e;
    }
  }

  async function loeschen(m) {
    const frage = '„' + String(m.name) + '“ wirklich löschen? ' +
      'Das Material verschwindet aus der Liste. Die Ausleihe-Einträge bleiben erhalten. ' +
      'Tipp: Zum Ausblenden reicht es, „Aktiv“ abzuhaken.';
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'Material', id: m.id, bekannt: m.geaendert_am }, s.token);
      offenId = null;
      schliesseDetail(ctx.detail);
      toast('Gelöscht.');
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Liste ----

  function zeichne() {
    const out = ausgeliehen(daten.ausleihe);
    const q = suche.value.trim().toLowerCase();
    const k = kat.value;
    const o = ortWahl.value;
    const st = stat.value;

    const zeilen = daten.material.map(function (m) {
      return mitVerfuegbar(m, out);
    }).filter(function (z) {
      if (modus === 'zurueck') {
        // Nur was draußen ist (fest) und Verbrauchsmaterial. Status-Filter gilt hier nicht.
        if (!auswaehlbar(z, 'zurueck')) return false;
      } else {
        const inaktiv = istFalsch(z.aktiv);
        if (st === 'aktiv' && inaktiv) return false;
        if (st === 'inaktiv' && !inaktiv) return false;
      }
      if (k && String(z.kategorie || '').trim() !== k) return false;
      if (o && String(z.ort || '').trim() !== o) return false;
      if (!q) return true;
      return [z.name, z.kategorie, z.unterkategorie, z.ort, z.notiz]
        .join(' ').toLowerCase().indexOf(q) >= 0;
    });

    zeilen.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), 'de');
    });

    const auswahl = modus ? {
      gewaehlt: function (z) { return !!gewaehlt[z.id]; },
      erlaubt: function (z) { return auswaehlbar(z, modus); },
      umschalten: function (z, wert) {
        if (wert) gewaehlt[z.id] = true;
        else delete gewaehlt[z.id];
        leisteAktualisieren();
      }
    } : null;

    let leerText = daten.material.length ? 'Nichts gefunden.' : 'Noch kein Material eingetragen.';
    if (modus === 'zurueck' && daten.material.length) leerText = 'Es ist nichts ausgeliehen.';

    zeigeListe(box, zeilen,
      [
        {
          name: 'name',
          label: 'Name',
          wert: function (z) {
            return String(z.name) + (istFalsch(z.aktiv) ? ' (nicht aktiv)' : '');
          }
        },
        { name: 'kategorie', label: 'Kategorie' },
        { name: 'ort', label: 'Ort' },
        { name: '_art', label: 'Art', wert: function (z) { return z._verbrauch ? 'Verbrauch' : 'Fest'; } },
        { name: 'anzahl', label: 'Anzahl', zahl: true },
        { name: '_verfuegbar', label: 'Verfügbar', zahl: true },
        {
          name: '_draussen',
          label: 'Ausgeliehen',
          zahl: true,
          wert: function (z) { return z._verbrauch || !z._draussen ? '' : z._draussen; }
        }
      ],
      function (z) {
        const einheit = z.einheit ? ' ' + z.einheit : '';
        let mengen = '';
        if (z._verfuegbar !== '') {
          mengen = z._verbrauch
            ? 'Vorrat: ' + z._verfuegbar + einheit
            : 'Verfügbar: ' + z._verfuegbar + ' von ' + z.anzahl + einheit;
        }
        return {
          titel: String(z.name) + (istFalsch(z.aktiv) ? ' (nicht aktiv)' : ''),
          zeilen: [
            [z.kategorie, z.ort, z._verbrauch ? 'Verbrauch' : ''].filter(Boolean).join(' · '),
            mengen,
            !z._verbrauch && z._draussen > 0 ? 'Draußen: ' + z._draussen + einheit : ''
          ]
        };
      },
      function (z) {
        formOffen = false;
        offenId = z.id;
        detailZeigen(z.id, true);
      },
      leerText,
      auswahl
    );
  }

  function zeigen(neu, meta) {
    if (!neu.projekte) neu.projekte = [];
    daten = neu;
    kategorienAufbauen();
    orteAufbauen();
    if (modus) {
      // Auswahl aufräumen: nur was noch da und wählbar ist
      const out = ausgeliehen(daten.ausleihe);
      Object.keys(gewaehlt).forEach(function (id) {
        const m = daten.material.find(function (x) { return String(x.id) === id; });
        if (!m || !auswaehlbar(mitVerfuegbar(m, out), modus)) delete gewaehlt[id];
      });
      leisteAktualisieren();
    }
    zeichne();
    // Ein offenes Formular wird bei der Aktualisierung nicht überschrieben.
    if (offenId && !formOffen) detailZeigen(offenId, false);
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? daten.material.length + ' Einträge · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':material',
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Material', 'Ausleihe', 'Projekte']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return { material: t.Material || [], ausleihe: t.Ausleihe || [], projekte: t.Projekte || [] };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        status.className = 'fehler';
        status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  kat.addEventListener('change', zeichne);
  ortWahl.addEventListener('change', zeichne);
  stat.addEventListener('change', zeichne);
  modusAnzeige();
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}
