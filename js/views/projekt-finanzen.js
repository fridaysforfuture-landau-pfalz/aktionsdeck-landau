// js/views/projekt-finanzen.js
// Teil "Finanzen" eines Projekts: Posten aus dem Tab Finanzen, Summen, "bezahlt"-Haken,
// "Aus Material übernehmen" (Beschaffung kaufen/mieten). Geld läuft über OpenCollective,
// hier steht nur die Übersicht geplant / tatsächlich.
// Seit 11.3 oben der Kontostand der Gruppe bei OpenCollective (nur Gruppen mit Konto, nur zum Anschauen).
//
// opt: { ctx, token, projekt, holeDaten() -> { fin, pm }, arbeitet (Objekt),
//        offen, beiToggle(offen), neuZeichnen(), neuLaden() -> Promise, merken() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA, istWahr } from '../schema.js';
import { datumText } from './todos-rechnen.js';
import { WOCHENTAGE_KURZ } from './kalender-rechnen.js';
import { gruppenInfoSofort, gruppenInfoFrisch, gruppenInfoLaden, kontoAktualisieren } from '../gruppeninfo.js';

// Alle Finanz-Teile (ein Teil je Projekt) warten gemeinsam auf den frischen Kontostand: nur einmal neu zeichnen
let kontoWartet = false;

function leer(v) {
  return v === '' || v === undefined || v === null;
}

function zahl(v) {
  const n = Number(String(leer(v) ? '' : v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function euro(n) {
  return Number(n).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function runde(n) {
  return Math.round(n * 100) / 100;
}

function nachPosten(a, b) {
  return String(a.posten).localeCompare(String(b.posten), 'de');
}

// "Mo, 03.11.2026" in der Zeit des Geräts
function standText(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const zwei = function (n) { return (n < 10 ? '0' : '') + n; };
  return WOCHENTAGE_KURZ[(d.getDay() + 6) % 7] + ', ' + zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.' + d.getFullYear();
}

function betragText(k) {
  if (typeof k.betrag !== 'number') return 'noch nicht abgerufen';
  const w = String(k.waehrung || 'EUR');
  return w === 'EUR' ? euro(k.betrag)
    : Number(k.betrag).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + w.slice(0, 5);
}

const ART_TEXT = { kauf: 'Kauf', miete: 'Miete', sonstiges: 'Sonstiges', einnahme: 'Einnahme', spende: 'Spende' };

export function baueFinanzTeil(opt) {
  const ctx = opt.ctx;
  const token = opt.token;
  const pid = String(opt.projekt.id);

  function daten() { return opt.holeDaten(); }

  const d0 = daten();
  const zeilen = (d0.fin || []).filter(function (r) {
    return String(r.projekt_id || '').trim() === pid;
  }).sort(nachPosten);

  // Ausgabe je Posten: tatsächlich, wenn eingetragen, sonst geplant
  function ausgabe(r) {
    return leer(r.betrag_tatsaechlich) ? zahl(r.betrag_geplant) : zahl(r.betrag_tatsaechlich);
  }

  const geplant = runde(zeilen.reduce(function (s, r) { return s + zahl(r.betrag_geplant); }, 0));
  const tatsaechlich = runde(zeilen.reduce(function (s, r) { return s + zahl(r.betrag_tatsaechlich); }, 0));
  const ausgaben = runde(zeilen.reduce(function (s, r) { return s + ausgabe(r); }, 0));
  const hatBudget = !leer(opt.projekt.budget_geplant);
  const budget = zahl(opt.projekt.budget_geplant);
  const rest = runde(budget - ausgaben);

  function fehlerFuer(e) {
    if (e.code === 'konflikt') {
      opt.neuLaden();
      return new Error('Jemand anderes hat diesen Eintrag gerade geändert. ' +
        'Klicke auf „Abbrechen“ und öffne ihn noch einmal.');
    }
    if (e.code === 'nicht_gefunden') {
      opt.neuLaden();
      return new Error('Diesen Eintrag gibt es nicht mehr. Klicke auf „Abbrechen“.');
    }
    return e;
  }

  function knopf(text, hell, fn) {
    return el('button', {
      class: 'knopf' + (hell ? ' knopf-hell' : ''), type: 'button', text: text, onclick: fn
    });
  }

  // ---- bezahlt abhaken (ohne Konfliktprüfung, Anzeige sofort) ----

  async function bezahltSetzen(r, wert) {
    const id = 'f' + String(r.id);
    if (opt.arbeitet[id]) return;
    opt.arbeitet[id] = true;
    const alt = r.bezahlt;
    r.bezahlt = wert;
    opt.neuZeichnen();
    let nachladen = false;
    try {
      const res = await api('update', {
        tabelle: 'Finanzen', id: r.id, daten: { bezahlt: wert }
      }, token);
      if (res && res.eintrag) Object.assign(r, res.eintrag);
      opt.merken();
    } catch (e) {
      r.bezahlt = alt;
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Diesen Posten gibt es nicht mehr.');
          nachladen = true;
        } else {
          toast(e.message);
        }
      }
    }
    delete opt.arbeitet[id];
    opt.neuZeichnen();
    if (nachladen) opt.neuLaden();
  }

  // ---- Posten: Formular (r = null heißt neu) ----

  function formZeigen(r) {
    let fenster = null;
    const form = baueFormular(
      SCHEMA.Finanzen.felder,
      r || { art: 'kauf', menge: '1' },
      {
        speichernText: r ? 'Speichern' : 'Anlegen',
        onSpeichern: function (d) { return speichern(r, d, fenster); },
        onAbbrechen: function () { fenster.schliessen(); }
      }
    );
    const inhalt = el('div', null, form);
    if (r) {
      inhalt.append(el('div', { class: 'fenster-loeschen' },
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(r, fenster); }
        })
      ));
    }
    fenster = zeigeFenster(r ? 'Posten bearbeiten' : 'Neuer Posten', inhalt);
  }

  async function speichern(r, d, fenster) {
    d.projekt_id = pid;
    // Geplant leer: Menge mal Einzelpreis
    if (leer(d.betrag_geplant) && !leer(d.menge) && !leer(d.einzelpreis)) {
      d.betrag_geplant = runde(zahl(d.menge) * zahl(d.einzelpreis));
    }
    try {
      if (!r) {
        await api('create', { tabelle: 'Finanzen', daten: d }, token);
        fenster.schliessen();
        toast('Posten angelegt.');
      } else {
        const res = await api('update', {
          tabelle: 'Finanzen', id: r.id, daten: d, bekannt: r.geaendert_am
        }, token);
        fenster.schliessen();
        toast(res.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  async function loeschen(r, fenster) {
    if (!window.confirm('Diesen Posten wirklich löschen?\n\n„' + String(r.posten) + '“')) return;
    try {
      await api('delete', { tabelle: 'Finanzen', id: r.id, bekannt: r.geaendert_am }, token);
      fenster.schliessen();
      toast('Gelöscht.');
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        opt.neuLaden();
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Aus Material übernehmen (kaufen / mieten, ohne doppelte) ----

  async function uebernehmen() {
    const schon = {};
    zeilen.forEach(function (r) {
      if (r.projekt_material_id) schon[String(r.projekt_material_id)] = true;
    });
    const neu = (d0.pm || []).filter(function (p) {
      return String(p.projekt_id || '').trim() === pid &&
        (p.beschaffung === 'kaufen' || p.beschaffung === 'mieten') &&
        !schon[String(p.id)];
    }).map(function (p) {
      return {
        projekt_id: pid,
        projekt_material_id: String(p.id),
        posten: String(p.name),
        art: p.beschaffung === 'mieten' ? 'miete' : 'kauf',
        menge: p.menge
      };
    });
    if (!neu.length) {
      toast('Nichts Neues: Es gibt keine Material-Positionen mit „kaufen“ oder „mieten“, die noch fehlen.');
      return;
    }
    try {
      await api('batchCreate', { tabelle: 'Finanzen', liste: neu }, token);
      toast(neu.length === 1 ? '1 Posten übernommen.' : neu.length + ' Posten übernommen.');
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.message);
    }
  }

  // ---- Kontostand der Gruppe (11.3) ----

  async function kontoAbrufen() {
    if (opt.arbeitet.konto) return;
    opt.arbeitet.konto = true;
    opt.neuZeichnen();
    try {
      const res = await kontoAktualisieren(ctx.session);
      toast(res && res.frisch
        ? 'Gerade erst abgerufen. Neu abrufen geht frühestens eine Stunde nach dem letzten Abruf.'
        : 'Kontostand abgerufen.');
    } catch (e) {
      if (!ctx.behandleFehler(e)) toast(e.message);
    }
    delete opt.arbeitet.konto;
    opt.neuZeichnen();
  }

  function kontoTeil() {
    const s = ctx.session;
    const info = gruppenInfoSofort(s.gruppe_id);
    if (!gruppenInfoFrisch(s.gruppe_id) && !kontoWartet) {
      kontoWartet = true;
      gruppenInfoLaden(s).then(function () {
        kontoWartet = false;
        if (gruppenInfoSofort(s.gruppe_id) !== info) opt.neuZeichnen();
      }).catch(function (e) {
        kontoWartet = false;
        ctx.behandleFehler(e);
      });
    }
    const k = info && info.konto;
    if (!k) return null;
    const stand = k.stand_am ? standText(k.stand_am) : '';
    const quelle = /^[a-z0-9-]{1,60}$/.test(String(k.quelle || '')) ? String(k.quelle) : '';
    const abrufen = el('button', {
      class: 'knopf knopf-hell', type: 'button', text: opt.arbeitet.konto ? 'Wird abgerufen …' : 'Jetzt abrufen',
      onclick: kontoAbrufen
    });
    if (opt.arbeitet.konto) abrufen.disabled = true;
    return el('div', { class: 'konto-teil' },
      el('p', { class: 'konto-zeile' },
        el('span', { text: 'Kontostand der Gruppe: ' }),
        el('strong', { text: betragText(k) }),
        stand ? el('span', { class: 'leise', text: ' (Stand ' + stand + ')' }) : null
      ),
      el('div', { class: 'teil-aktionen' },
        abrufen,
        quelle ? el('a', {
          class: 'knopf knopf-hell', href: 'https://opencollective.com/' + quelle,
          target: '_blank', rel: 'noopener noreferrer', text: 'Zu OpenCollective →'
        }) : null
      )
    );
  }

  // ---- Zeichnen ----

  function zeile(r) {
    const fertig = istWahr(r.bezahlt);
    const rechnung = (!leer(r.menge) && !leer(r.einzelpreis))
      ? r.menge + ' × ' + euro(zahl(r.einzelpreis)) : '';
    const info = [
      ART_TEXT[r.art] || '',
      rechnung,
      !leer(r.betrag_geplant) ? 'Geplant ' + euro(zahl(r.betrag_geplant)) : '',
      !leer(r.betrag_tatsaechlich) ? 'Tatsächlich ' + euro(zahl(r.betrag_tatsaechlich)) : '',
      r.bezahlt_von ? 'Bezahlt von ' + r.bezahlt_von : '',
      r.datum ? datumText(r.datum) : ''
    ].filter(Boolean).join(' · ');

    const cb = el('input', {
      type: 'checkbox', class: 'auswahl-box', 'aria-label': String(r.posten) + ' bezahlt'
    });
    cb.checked = fertig;
    cb.addEventListener('change', function () { bezahltSetzen(r, cb.checked); });

    return el('li', { class: 'dash-zeile' + (fertig ? ' erledigt' : '') },
      cb,
      el('button', {
        class: 'dash-todo pt-todo' + (fertig ? ' erledigt' : ''), type: 'button',
        onclick: function () { formZeigen(r); }
      },
        el('strong', { text: String(r.posten) }),
        info ? el('span', { class: 'leise', text: info }) : null,
        r.beleg_id ? el('span', { class: 'leise', text: 'Beleg: ' + String(r.beleg_id).slice(0, 100) }) : null
      )
    );
  }

  const summen = [];
  if (hatBudget) summen.push('Budget ' + euro(budget));
  summen.push('Geplant ' + euro(geplant));
  summen.push('Tatsächlich ' + euro(tatsaechlich));
  const restText = hatBudget
    ? el('span', {
      class: 'leise' + (rest < 0 ? ' fehler' : ''),
      text: 'Rest zum Budget: ' + euro(rest) + (rest < 0 ? ' (überschritten)' : '')
    })
    : null;

  const body = el('div', { class: 'projekt-teil-body' },
    kontoTeil(),
    el('div', { class: 'teil-aktionen' },
      knopf('+ Posten', false, function () { formZeigen(null); }),
      knopf('Aus Material übernehmen', true, uebernehmen)
    )
  );
  if (zeilen.length || hatBudget) {
    body.append(
      el('p', { class: 'dash-zahlen', text: summen.join(' · ') }),
      restText
    );
  }
  if (!zeilen.length) {
    body.append(el('p', {
      class: 'leise',
      text: 'Noch keine Posten. „Aus Material übernehmen“ legt Posten für Material an, das gekauft oder ' +
        'gemietet wird. Das Geld selbst läuft über OpenCollective, hier steht nur die Übersicht.'
    }));
  } else {
    body.append(el('ul', { class: 'dash-todo-liste' }, ...zeilen.map(zeile)));
  }

  const bezahlt = zeilen.filter(function (r) { return istWahr(r.bezahlt); }).length;
  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Finanzen' }),
      el('span', {
        class: 'leise',
        text: zeilen.length
          ? zeilen.length + ' Posten · ' + bezahlt + ' bezahlt · ' + euro(ausgaben)
          : 'noch keine Posten'
      })
    ),
    body
  );
  return teil;
}
