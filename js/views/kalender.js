// js/views/kalender.js
// Reiter Kalender: Liste "Kommende" und "Vergangene", Monat, Woche, Filterleiste, Suche.
// Mobi-Beiträge stehen als Termine darin (📣, Kanalfarbe; Klick öffnet den Beitrag).
// Veranstaltungen anlegen, ändern und löschen (mit Uhrzeit und mehreren Tagen).
// Die Termine werden in kalender-rechnen.js berechnet, hier wird nur angezeigt und gespeichert.
// Die Filter bleiben beim Reiterwechsel erhalten (Merker außerhalb von render).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { zeitText as stempelText } from './material-rechnen.js';
import { normDatum, heuteIso, datumText } from './todos-rechnen.js';
import {
  baueTermine, filtereTermine, kommende, vergangene, standardFilter,
  zeitNorm, zeitText, datumsText, sichereUrl, istUeberfaellig, MONATE,
  monatsRaster, monatTitel, imZeitraum, WOCHENTAGE, wochentagNr,
  istVorbei, schriftfarbe, pastell, bezugText, wocheVon, addTage
} from './kalender-rechnen.js';
import { zeigeBeitragFormular } from './mobi-eintrag.js';
import { zeigeSammlung } from './mobi-sammlung.js';
import { zeigeVorlagen } from './kalender-vorlagen.js';
import { baueAktionskalender } from './termine-liste.js';

// Bleibt beim Reiterwechsel erhalten. Neue Anmeldung (anderes Token) = zurückgesetzt.
let merk = {
  token: '', filter: null, alteAuf: false,
  ansicht: 'monat', archiv: false, filterAuf: false, jahr: 0, monat: 0, tag: ''
};

const MAX_VERGANGEN = 30;

// Schalter in der Filterleiste: [Schlüssel im Filter, Text]
const SCHALTER = [
  ['intern', 'Intern'],
  ['extern', 'Extern'],
  ['projekte', 'Projekte'],
  ['deadlines', 'Deadlines'],
  ['meilensteine', 'Meilensteine'],
  ['todos', 'ToDos'],
  ['mobi', 'Mobi'],
  ['nurMeine', 'Nur meine ToDos'],
  ['archivProjekte', 'Archiv-Projekte'],
  ['oeffentlich', 'Öffentliche Termine anderer Gruppen']
];

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

// Gruppeneigene externe Veranstaltung (Veranstalter leer) = Mitteilung am Schwarzen Brett.
// Intern oder von anderen = Kommentar an der Pinnwand.
function aufsBrett(v) {
  return txt(v.art) === 'extern' && !txt(v.veranstalter);
}

// Farbe der Veranstaltung (leer = Gruppenfarbe)
function eventFarbe(v, gruppe) {
  const ok = function (f) { return /^#[0-9a-fA-F]{6}$/.test(txt(f)); };
  if (ok(v.farbe)) return txt(v.farbe);
  return ok(gruppe) ? txt(gruppe) : '#368469';
}

// Trichter-Symbol für den Filter-Knopf
function filterIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const sv = document.createElementNS(NS, 'svg');
  sv.setAttribute('viewBox', '0 0 24 24');
  sv.setAttribute('width', '22');
  sv.setAttribute('height', '22');
  sv.setAttribute('fill', 'none');
  sv.setAttribute('stroke', 'currentColor');
  sv.setAttribute('stroke-width', '2');
  sv.setAttribute('stroke-linecap', 'round');
  sv.setAttribute('stroke-linejoin', 'round');
  sv.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', 'M3 4h18l-7 8v7l-4 2v-9z');
  sv.append(p);
  return sv;
}

function markeText(t) {
  if (t.quelle === 'veranstaltung') return t.art === 'extern' ? 'Extern' : 'Intern';
  if (t.quelle === 'oeffentlich') return t.gruppe || 'Öffentlich';
  if (t.quelle === 'aktion') return 'Projekt-Aktion';
  if (t.quelle === 'deadline') return 'Deadline';
  if (t.quelle === 'meilenstein') return 'Meilenstein';
  if (t.quelle === 'todo') return 'ToDo';
  if (t.quelle === 'balken') return 'Projektzeitraum';
  if (t.quelle === 'mobi') return 'Mobi' + (t.erledigt ? ' · veröffentlicht' : '');
  return '';
}

function monatVon(tag) {
  const m = Number(String(tag).slice(5, 7));
  return (MONATE[m - 1] || '') + ' ' + String(tag).slice(0, 4);
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  if (merk.token !== s.token) {
    const h = heuteIso();
    merk = {
      token: s.token, filter: standardFilter(getName()), alteAuf: false,
      ansicht: 'monat', archiv: false, filterAuf: false,
      jahr: Number(h.slice(0, 4)), monat: Number(h.slice(5, 7)) - 1, tag: h
    };
  }
  const f = merk.filter;
  f.name = getName();
  if (f.mobi === undefined) f.mobi = true;   // Merker von vor 0.29.9
  const basis = '#/g/' + encodeURIComponent(s.kurzname) + '/';

  let daten = { veranstaltungen: [], projekte: [], meilensteine: [], todos: [], mobi: [], oeffentlich: [] };
  let meta = null;
  let offline = false;

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const filterBox = el('div', { class: 'kal-filter' });
  const kommBox = el('div');
  const vergBox = el('div');
  const kachelBox = el('div', { class: 'kal-kacheln' });
  const archivKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Archiv',
    onclick: function () { merk.archiv = !merk.archiv; zeichne(); }
  });
  const monatBox = el('div', { class: 'kal-monat' });
  const listeTitel = el('h2', { class: 'liste-titel', text: 'Kommende Termine' });
  const listenKnopf = el('button', {
    class: 'knopf', type: 'button', text: 'Liste',
    onclick: function () { ansichtSetzen('liste'); }
  });
  const monatKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Monat',
    onclick: function () { ansichtSetzen('monat'); }
  });
  const wocheKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Woche',
    onclick: function () { ansichtSetzen('woche'); }
  });
  const aktionKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Aktionskalender',
    onclick: function () { aktionSchalten(true); }
  });
  const ansichtLinks = el('div', { class: 'kal-ansicht-gruppe' }, listenKnopf, monatKnopf, wocheKnopf, aktionKnopf);
  const ansichtRechts = el('div', { class: 'kal-ansicht-gruppe kal-ansicht-rechts' });
  const ansichtZeile = el('div', { class: 'kal-ansicht' }, ansichtLinks, ansichtRechts);

  const neuKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Veranstaltung',
    onclick: function () { formZeigen(null); }
  });
  const vorlagenKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Vorlagen',
    onclick: function () {
      zeigeVorlagen({
        ctx: ctx,
        token: s.token,
        kurzname: s.kurzname,
        neueAusVorlage: function (vorgabe) { formZeigen(null, vorgabe); }
      });
    }
  });

  // Archiv, Vorlagen und Veranstaltung stehen in einer Reihe mit Liste und Monat
  ansichtRechts.append(vorlagenKnopf, neuKnopf);
  
  // Filter: Symbol rechts neben der Suche, klappt die Häkchen auf (am PC immer sichtbar)
  const filterKnopf = el('button', {
    class: 'knopf knopf-hell kal-filterknopf', type: 'button',
    'aria-label': 'Filter', title: 'Filter',
    onclick: function () { merk.filterAuf = !merk.filterAuf; filterAnzeige(); }
  }, filterIcon());
  function filterAnzeige() {
    filterBox.hidden = !merk.filterAuf;
    filterKnopf.setAttribute('aria-expanded', String(!!merk.filterAuf));
    filterKnopf.className = 'knopf kal-filterknopf' + (merk.filterAuf ? '' : ' knopf-hell');
  }
  const suchZeile = el('div', { class: 'kal-suchzeile' }, suche, filterKnopf);
  
  SCHALTER.forEach(function (sch) {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = !!f[sch[0]];
    cb.addEventListener('change', function () {
      f[sch[0]] = cb.checked;
      zeichne();
    });
    filterBox.append(el('label', { class: 'formfeld-bool' }, cb, el('span', { text: sch[1] })));
  });

  // Alles Bisherige liegt in kalenderBox. Der Aktionskalender ersetzt es zeitweise (Reiter bleiben links).
  const kalenderBox = el('div', null,
    ansichtZeile,
    suchZeile,
    filterBox,
    kachelBox,
    status,
    monatBox,
    listeTitel,
    kommBox,
    vergBox
  );
  const aktionBox = el('div');
  aktionBox.hidden = true;
  let aktionInhalt = null;

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'Kalender' }), archivKnopf),
    kalenderBox,
    aktionBox
  ));
  filterAnzeige();

  // Aktionskalender = Seite "Öffentliche Termine" mitten im Reiter
  function aktionSchalten(an) {
    kalenderBox.hidden = an;
    aktionBox.hidden = !an;
    archivKnopf.hidden = an;
    if (!an) return;
    if (!aktionInhalt) aktionInhalt = baueAktionskalender(s, ctx);
    leeren(aktionBox);
    aktionBox.append(
      el('div', { class: 'kopfzeile' },
        el('h2', { text: 'Aktionskalender' }),
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: '← Zurück zum Kalender',
          onclick: function () { aktionSchalten(false); }
        })
      ),
      el('p', {
        class: 'leise',
        text: 'Öffentliche Veranstaltungen aller Klima-Gruppen. Klicke auf eine Kachel für Details.'
      }),
      aktionInhalt.el
    );
    aktionInhalt.laden();
  }

  // ---- Zeichnen ----

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? 'Stand ' + stempelText(meta.stand)
      : 'Zwischengespeichert von ' + stempelText(meta.stand) + '. Aktualisiere …';
  }

  // Klick auf einen Termin: Veranstaltung bearbeiten, öffentlichen Termin ansehen,
  // Mobi-Beitrag öffnen, sonst in den Reiter springen
  function oeffnen(t) {
    if (t.quelle === 'veranstaltung') formZeigen(t.roh);
    else if (t.quelle === 'oeffentlich') oeffInfo(t);
    else if (t.quelle === 'mobi') beitragOeffnen(t.roh);
    else if (t.link) location.hash = t.link;
  }

  function beitragOeffnen(b) {
    const personen = function () {
      const l = [];
      [getName()].concat(daten.mobi.map(function (x) { return x.verantwortlich; })).forEach(function (n) {
        const k = txt(n);
        if (k && l.indexOf(k) < 0) l.push(k);
      });
      return l.sort(function (a, c) { return a.localeCompare(c, 'de'); });
    };
    zeigeBeitragFormular({
      ctx: ctx, token: s.token, kurzname: s.kurzname, personen: personen,
      neuLaden: function () { return laden(false); },
      beiFertig: function () { return laden(false); }
    }, b);
  }

  // Grau: abgeschlossenes Projekt, vorbei (offene überfällige nicht) oder veröffentlichter Mobi-Beitrag
  function istGrau(t) {
    return !!t.zu || (!istUeberfaellig(t) && istVorbei(t)) || (t.quelle === 'mobi' && t.erledigt);
  }

  // Mobi-Beitrag nach der Aktion (außer Danke/Rückblick): pink markiert
  function istPink(t) {
    return t.quelle === 'mobi' && t.nachAktion && !istGrau(t);
  }

  function zeile(t, vorher) {
    const istV = t.quelle === 'veranstaltung';
    const ueber = istUeberfaellig(t);
    const grau = istGrau(t);
    const pink = istPink(t);
    const voll = !grau && (istV || t.quelle === 'aktion');
    const frist = !grau && t.quelle === 'deadline';
    const symbol = (istV || t.quelle === 'aktion') ? '📅 ' : (t.quelle === 'deadline' ? '⏰ ' : '');
    const mitProjekt = (t.quelle === 'meilenstein' || t.quelle === 'todo' || t.quelle === 'mobi') && t.projektTitel;
    const info = [
      datumsText(t) + (ueber ? ' (überfällig)' : ''),
      zeitText(t),
      t.ort,
      mitProjekt ? (t.projektTitel.indexOf('📅') === 0 ? t.projektTitel : 'Projekt: ' + t.projektTitel) : '',
      t.verantwortlich,
      t.erledigt ? '' : bezugText(t)
    ].filter(Boolean).join(' · ');

    const knopf = el('button', {
      class: 'dash-todo pt-todo' + (ueber ? ' ueberfaellig' : ''), type: 'button',
      onclick: function () {
        if (typeof vorher === 'function') vorher();
        oeffnen(t);
      }
    },
      el('span', { class: 'kal-marke leise', text: markeText(t) }),
      el('strong', { text: symbol + t.titel }),
      info ? el('span', { class: 'leise', text: info }) : null
    );

    const li = el('li', {
      class: 'dash-zeile kal-zeile' + (grau ? ' kal-grau' : '') +
        (voll ? ' kal-voll' : '') + (frist ? ' kal-frist' : '') + (pink ? ' kal-mobi-nach' : '')
    }, knopf);
    li.style.borderLeftColor = grau ? '#8a9490' : (ueber ? '#b3261e' : (pink ? '#d81b60' : t.farbe));
    if (voll) {
      li.style.background = t.farbe;
      li.style.color = schriftfarbe(t.farbe);
    }
    if (frist) li.style.background = pastell(t.farbe);
    if (t.url) {
      li.append(el('a', {
        class: 'kal-link', href: t.url, target: '_blank', rel: 'noopener noreferrer',
        text: 'Link öffnen'
      }));
    }
    if (istV && !istVorbei(t)) {
      li.append(el('button', {
        class: 'knopf knopf-hell knopf-klein kal-heften', type: 'button',
        text: aufsBrett(t.roh) ? 'Als Mitteilung anheften' : 'An Pinnwand heften',
        onclick: function () { anheften(t.roh, null); }
      }));
    }
    return li;
  }

  function listeMitMonaten(termine) {
    const box = el('div');
    let monat = '';
    let ul = null;
    termine.forEach(function (t) {
      const m = monatVon(t.von);
      if (m !== monat) {
        monat = m;
        box.append(el('h3', { class: 'teil-titel-klein', text: m }));
        ul = el('ul', { class: 'dash-todo-liste' });
        box.append(ul);
      }
      ul.append(zeile(t));
    });
    return box;
  }

  function zeichne() {
    const termine = baueTermine(daten, {
      basis: basis, farbe: s.farbe, eigeneKurz: s.kurzname, abgeschlossene: !!f.archivProjekte
    });
    let liste = filtereTermine(termine, f);
    const q = suche.value.trim().toLowerCase();
    if (q) {
      liste = liste.filter(function (t) {
        return [t.titel, t.ort, t.projektTitel, t.verantwortlich].join(' ').toLowerCase().indexOf(q) >= 0;
      });
    }
    const komm = kommende(liste);
    const verg = vergangene(liste);
    archivKnopf.textContent = merk.archiv
      ? '← Termine'
      : 'Archiv' + (verg.length ? ' (' + verg.length + ')' : '');
    listeTitel.textContent = merk.archiv ? 'Archiv: vergangene Termine' : 'Kommende Termine';
    kachelnZeichnen(termine);

    ansichtAnzeige();
    if (merk.ansicht === 'monat' && !merk.archiv) {
      zeichneMonat(liste);
      statusZeigen();
      return;
    }
    if (merk.ansicht === 'woche' && !merk.archiv) {
      zeichneWoche(liste);
      statusZeigen();
      return;
    }
    if (merk.archiv) {
      zeichneArchiv(verg);
      leeren(vergBox);
      vergBox.hidden = true;
      statusZeigen();
      return;
    }

    leeren(kommBox);
    if (!komm.length) {
      kommBox.append(el('p', {
        class: 'leise',
        text: daten.veranstaltungen.length || termine.length
          ? 'Keine kommenden Termine gefunden.'
          : 'Noch keine Termine. Mit „+ Veranstaltung“ legst du den ersten an.'
      }));
    } else {
      kommBox.append(listeMitMonaten(komm));
    }

    leeren(vergBox);
    vergBox.hidden = true;
    statusZeigen();
  }

  // ---- Kacheln (extern) und Archiv ----

  // Veröffentlichen per Klick auf die Kachel: speichert sofort
  async function veroeffentlichen(v, wert, cb) {
    cb.disabled = true;
    try {
      await api('update', {
        tabelle: 'Veranstaltungen', id: v.id, daten: { oeffentlich: wert }, bekannt: v.geaendert_am
      }, s.token);
      toast(wert ? 'Veröffentlicht.' : 'Nicht mehr veröffentlicht.');
      await laden(false);
    } catch (e) {
      cb.checked = !wert;
      cb.disabled = false;
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
        toast('Jemand anderes hat dies gerade geändert. Bitte noch einmal versuchen.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  function kachelnZeichnen(termine) {
    leeren(kachelBox);
    if (merk.ansicht === 'monat' || merk.ansicht === 'woche' || merk.archiv) {
      kachelBox.hidden = true;
      return;
    }
    const extern = termine.filter(function (t) {
      return t.quelle === 'veranstaltung' && t.art === 'extern' && !istVorbei(t) &&
        !istWahr(t.roh.oeffentlich);
    });
    kachelBox.hidden = !extern.length;
    if (!extern.length) return;
    const reihe = el('div', { class: 'kal-kacheln-liste' });
    extern.forEach(function (t) {
      const cb = el('input', { type: 'checkbox', 'aria-label': t.titel + ' veröffentlichen' });
      cb.checked = istWahr(t.roh.oeffentlich);
      cb.addEventListener('change', function () { veroeffentlichen(t.roh, cb.checked, cb); });
      const k = el('div', { class: 'kal-kachel' },
        el('button', {
          class: 'kal-kachel-titel', type: 'button', text: t.titel,
          onclick: function () { formZeigen(t.roh); }
        }),
        el('span', { class: 'kal-kachel-datum', text: datumsText(t) }),
        el('label', null, cb, el('span', { text: 'Veröffentlichen' }))
      );
      k.style.background = t.farbe;
      k.style.color = schriftfarbe(t.farbe);
      reihe.append(k);
    });
    kachelBox.append(
      el('p', { class: 'leise', text: 'Externe Veranstaltungen, noch nicht veröffentlicht:' }),
      reihe
    );
  }

  function zeichneArchiv(verg) {
    leeren(kommBox);
    if (!verg.length) {
      kommBox.append(el('p', {
        class: 'leise', text: 'Das Archiv ist leer. Vergangene Termine stehen hier.'
      }));
      return;
    }
    kommBox.append(listeMitMonaten(verg.slice(0, 200)));
    if (verg.length > 200) {
      kommBox.append(el('p', {
        class: 'leise',
        text: '… und ' + (verg.length - 200) + ' ältere. Mit der Suche findest du sie.'
      }));
    }
  }
  
  // ---- Monatsansicht ----

  function ansichtAnzeige() {
    const monat = merk.ansicht === 'monat';
    const woche = merk.ansicht === 'woche';
    const liste = !monat && !woche;
    // Raster (Monat oder Woche) nur, wenn das Archiv nicht offen ist. Beide nutzen monatBox.
    const m = (monat || woche) && !merk.archiv;
    monatBox.hidden = !m;
    listeTitel.hidden = m;
    kommBox.hidden = m;
    vergBox.hidden = m;
    listenKnopf.className = 'knopf' + (liste ? '' : ' knopf-hell');
    monatKnopf.className = 'knopf' + (monat ? '' : ' knopf-hell');
    wocheKnopf.className = 'knopf' + (woche ? '' : ' knopf-hell');
    listenKnopf.setAttribute('aria-pressed', String(liste));
    monatKnopf.setAttribute('aria-pressed', String(monat));
    wocheKnopf.setAttribute('aria-pressed', String(woche));
  }
  
  function ansichtSetzen(a) {
    merk.ansicht = a;
    merk.archiv = false;
    zeichne();
  }

  function monatWechseln(delta, liste) {
    let m = merk.monat + delta;
    let j = merk.jahr;
    if (m < 0) { m = 11; j -= 1; }
    if (m > 11) { m = 0; j += 1; }
    merk.monat = m;
    merk.jahr = j;
    merk.tag = '';
    zeichneMonat(liste);
  }

  function zuHeute(liste) {
    const h = heuteIso();
    merk.jahr = Number(h.slice(0, 4));
    merk.monat = Number(h.slice(5, 7)) - 1;
    merk.tag = h;
    zeichneMonat(liste);
  }

  // Veranstaltungen zuerst, dann Projekt-Aktionen, dann der Rest
  function rang(t) {
    return t.quelle === 'veranstaltung' ? 0 : (t.quelle === 'aktion' ? 1 : 2);
  }

  // Ein Tag im Raster: Zahl, Balken in festen Bahnen, Punkte (Handy), Kurztitel (PC)
  function tagesZelle(d, spalte, termine, liste, bahn, nBahn) {
    const normal = termine.filter(function (t) {
      return t.quelle !== 'balken' && t.quelle !== 'deadline';
    }).sort(function (a, b) { return rang(a) - rang(b); });
    const balken = termine.filter(function (t) { return t.quelle === 'balken'; });

    const streifen = [];
    for (let i = 0; i < nBahn; i++) {
      const t = balken.find(function (b) { return bahn[b.key] === i; });
      const fristTag = !!t && !!f.deadlines && d.tag === t.bis;
      if (!t || !(f.projekte || fristTag)) {
        streifen.push(el('span', {
          class: 'kal-streifen kal-leer', 'aria-hidden': 'true', text: '\u00a0'
        }));
        continue;
      }
      const rosa = fristTag && !t.zu;
      let beschriftung = '\u00a0';
      if (fristTag) beschriftung = 'Deadline: ' + t.projektTitel;
      else if (d.tag === t.von || spalte === 0) beschriftung = t.titel;
      const b = el('span', {
        class: 'kal-streifen' + (rosa ? ' kal-frist-tag' : ''),
        title: fristTag ? 'Deadline: ' + t.projektTitel : t.titel,
        'aria-hidden': 'true',
        text: beschriftung
      });
      b.style.borderTopColor = rosa ? '#d81b60' : (t.zu ? '#8a9490' : t.farbe);
      streifen.push(b);
    }

    const punkte = el('span', { class: 'kal-punkte', 'aria-hidden': 'true' });
    const punktFarbe = function (t) {
      return istUeberfaellig(t) ? '#b3261e' : (istGrau(t) ? '#8a9490' : t.farbe);
    };
    // Veranstaltungen und Aktionen: Streifen über die ganze Breite des Tages
    normal.filter(function (t) { return rang(t) < 2; }).slice(0, 3).forEach(function (t) {
      const p = el('span', { class: 'kal-punkt kal-punkt-voll' });
      p.style.background = punktFarbe(t);
      punkte.append(p);
    });
    // Übrige Termine: kleine Punkte
    normal.filter(function (t) { return rang(t) >= 2; }).slice(0, 4).forEach(function (t) {
      const p = el('span', { class: 'kal-punkt' });
      p.style.background = punktFarbe(t);
      punkte.append(p);
    });

    const chips = el('span', { class: 'kal-chips', 'aria-hidden': 'true' });
    normal.slice(0, 3).forEach(function (t) {
      const ueber = istUeberfaellig(t);
      const grau = istGrau(t);
      const hervor = !grau && (t.quelle === 'veranstaltung' || t.quelle === 'aktion');
      const c = el('span', {
        class: 'kal-chip' + (ueber ? ' ueber' : '') + (hervor ? ' kal-chip-voll' : '') +
          (grau ? ' kal-chip-grau' : ''),
        text: t.titel
      });
      if (hervor) {
        c.style.background = t.farbe;
        c.style.color = schriftfarbe(t.farbe);
      } else {
        c.style.borderLeftColor = ueber ? '#b3261e' : (grau ? '#8a9490' : (istPink(t) ? '#d81b60' : t.farbe));
        if (istPink(t)) c.classList.add('kal-chip-pink');
      }
      chips.append(c);
    });
    if (normal.length > 3) {
      chips.append(el('span', {
        class: 'kal-chip-mehr leise', text: '+ ' + (normal.length - 3) + ' weitere'
      }));
    }

    const n = termine.length;
    return el('button', {
      class: 'kal-tag' + (d.imMonat ? '' : ' kal-fremd') + (d.heute ? ' kal-heute' : '') +
        (merk.tag === d.tag ? ' kal-gewaehlt' : ''),
      type: 'button',
      'aria-label': datumText(d.tag) + ': ' + n + (n === 1 ? ' Termin' : ' Termine'),
      'aria-pressed': String(merk.tag === d.tag),
      onclick: function () {
        merk.tag = d.tag;
        zeichneMonat(liste);
        if (breit()) tagOeffnen(d.tag, termine);
      }
    },
      el('span', { class: 'kal-nr', text: String(Number(d.tag.slice(8, 10))) }),
      ...streifen,
      punkte,
      chips
    );
  }

  function breit() {
    return window.matchMedia('(min-width: 600px)').matches;
  }

  // Großes Fenster mit allen Terminen eines Tages (am Handy gilt die Liste unter dem Raster)
  function tagOeffnen(tag, termine) {
    let fenster = null;
    const sortiert = termine.slice().sort(function (a, b) { return rang(a) - rang(b); });
    const inhalt = el('div', { class: 'kal-gross' });
    if (sortiert.length) {
      inhalt.append(el('ul', { class: 'dash-todo-liste' },
        ...sortiert.map(function (t) {
          return zeile(t, function () { fenster.schliessen(); });
        })));
    } else {
      inhalt.append(el('p', { class: 'leise', text: 'Keine Termine an diesem Tag.' }));
    }
    inhalt.append(el('div', { class: 'fenster-loeschen form-knoepfe' },
      el('button', {
        class: 'knopf', type: 'button', text: '+ Veranstaltungen an diesem Tag',
        onclick: function () { fenster.schliessen(); formZeigen(null, { datum: tag }); }
      }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: 'Schließen',
        onclick: function () { fenster.schliessen(); }
      })
    ));
    fenster = zeigeFenster(
      WOCHENTAGE[wochentagNr(tag)] + ', ' + datumText(tag), inhalt, null, { aussenKlick: true }
    );
  }

  // Kalender-Symbol: freie Datumswahl (der Knopf ist ein Datumsfeld, das unsichtbar darüber liegt)
  function datumWahlBauen(liste) {
    const eingabe = el('input', { type: 'date', 'aria-label': 'Datum wählen' });
    eingabe.value = merk.tag || heuteIso();
    eingabe.addEventListener('click', function () {
      try {
        if (typeof eingabe.showPicker === 'function') eingabe.showPicker();
      } catch (e) { /* ignorieren */ }
    });
    eingabe.addEventListener('change', function () {
      const d = normDatum(eingabe.value);
      if (!d) return;
      merk.jahr = Number(d.slice(0, 4));
      merk.monat = Number(d.slice(5, 7)) - 1;
      merk.tag = d;
      zeichneMonat(liste);
    });
    return el('label', { class: 'knopf knopf-hell kal-datumknopf', title: 'Datum wählen' },
      el('span', { 'aria-hidden': 'true', text: '📅' }),
      eingabe
    );
  }
  
  function zeichneMonat(liste) {
    leeren(monatBox);
    const wochen = monatsRaster(merk.jahr, merk.monat);
    const erster = wochen[0][0].tag;
    const letzter = wochen[wochen.length - 1][6].tag;
    const imRaum = imZeitraum(liste, erster, letzter);
    const proTag = {};
    wochen.forEach(function (w) {
      w.forEach(function (d) {
        proTag[d.tag] = imRaum.filter(function (t) { return t.von <= d.tag && t.bis >= d.tag; });
      });
    });

    // Balken in feste Bahnen legen, damit sie von Tag zu Tag auf einer Höhe bleiben
    const bahn = {};
    const bahnEnde = [];
    imRaum.filter(function (b) { return b.quelle === 'balken'; }).forEach(function (b) {
      let i = 0;
      while (i < bahnEnde.length && bahnEnde[i] >= b.von) i += 1;
      bahnEnde[i] = b.bis;
      bahn[b.key] = i;
    });
    const nBahn = Math.min(3, bahnEnde.length);

    monatBox.append(el('div', { class: 'kal-kopf' },
      el('div', { class: 'kal-monatsnav' },
        el('button', {
          class: 'kal-taste', type: 'button', text: '‹', 'aria-label': 'Vorheriger Monat',
          onclick: function () { monatWechseln(-1, liste); }
        }),
        el('h2', { text: monatTitel(merk.jahr, merk.monat) }),
        el('button', {
          class: 'kal-taste', type: 'button', text: '›', 'aria-label': 'Nächster Monat',
          onclick: function () { monatWechseln(1, liste); }
        })
      ),
      el('div', { class: 'kal-kopf-rechts' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Heute',
          onclick: function () { zuHeute(liste); }
        }),
        datumWahlBauen(liste)
      )
    ));

    const raster = el('div', { class: 'kal-raster' });
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(function (k) {
      raster.append(el('span', { class: 'kal-wt', text: k }));
    });
    wochen.forEach(function (w) {
      w.forEach(function (d, i) {
        raster.append(tagesZelle(d, i, proTag[d.tag], liste, bahn, nBahn));
      });
    });
    monatBox.append(raster);

    // Termine des gewählten Tages
    const tag = merk.tag;
    if (!tag || !proTag[tag]) {
      monatBox.append(el('p', { class: 'leise kal-hinweis', text: 'Tippe auf einen Tag, um seine Termine zu sehen.' }));
      return;
    }
    const heutige = proTag[tag];
    const tagesBox = el('div', { class: 'kal-tagesliste' },
      el('h3', { text: WOCHENTAGE[wochentagNr(tag)] + ', ' + datumText(tag) })
    );
    if (heutige.length) {
      tagesBox.append(el('ul', { class: 'dash-todo-liste' }, ...heutige.map(zeile)));
    } else {
      tagesBox.append(el('p', { class: 'leise', text: 'Keine Termine an diesem Tag.' }));
    }
    tagesBox.append(el('div', { class: 'teil-aktionen' },
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: '+ Veranstaltungen an diesem Tag',
        onclick: function () { formZeigen(null, { datum: tag }); }
      })
    ));
    monatBox.append(tagesBox);
  }

  // ---- Wochenansicht ----
  // Montag bis Sonntag der Woche, in der der gewählte Tag liegt. PC: 7 Spalten, Handy: Tage untereinander.
  // Jeder Termin ist ein Knopf (Klick wie in der Liste). Projektbalken stehen hier nicht.

  function wocheWechseln(delta, liste) {
    const tag = addTage(merk.tag || heuteIso(), delta * 7);
    merk.tag = tag;
    merk.jahr = Number(tag.slice(0, 4));
    merk.monat = Number(tag.slice(5, 7)) - 1;
    zeichneWoche(liste);
  }

  function wochenChip(t) {
    const ueber = istUeberfaellig(t);
    const grau = istGrau(t);
    const pink = istPink(t);
    const hervor = !grau && (t.quelle === 'veranstaltung' || t.quelle === 'aktion');
    const symbol = (t.quelle === 'veranstaltung' || t.quelle === 'aktion') ? '📅 ' : (t.quelle === 'deadline' ? '⏰ ' : '');
    const zusatz = [zeitNorm(t.zeitVon), t.erledigt ? '' : bezugText(t)].filter(Boolean).join(' · ');
    const c = el('button', {
      class: 'kal-wchip' + (ueber ? ' ueber' : '') + (grau ? ' kal-chip-grau' : '') + (pink ? ' kal-chip-pink' : ''),
      type: 'button',
      onclick: function () { oeffnen(t); }
    },
      el('strong', { text: symbol + t.titel }),
      zusatz ? el('span', { class: 'leise', text: zusatz }) : null
    );
    if (hervor) {
      c.style.background = t.farbe;
      c.style.color = schriftfarbe(t.farbe);
    } else {
      c.style.borderLeftColor = ueber ? '#b3261e' : (grau ? '#8a9490' : (pink ? '#d81b60' : t.farbe));
    }
    return c;
  }

  function zeichneWoche(liste) {
    leeren(monatBox);
    const tage = wocheVon(merk.tag || heuteIso());
    const heute = heuteIso();
    const imRaum = imZeitraum(liste, tage[0], tage[6]).filter(function (t) { return t.quelle !== 'balken'; });

    monatBox.append(el('div', { class: 'kal-kopf' },
      el('div', { class: 'kal-monatsnav' },
        el('button', {
          class: 'kal-taste', type: 'button', text: '‹', 'aria-label': 'Vorherige Woche',
          onclick: function () { wocheWechseln(-1, liste); }
        }),
        el('h2', { text: datumText(tage[0]).slice(0, 6) + ' – ' + datumText(tage[6]) }),
        el('button', {
          class: 'kal-taste', type: 'button', text: '›', 'aria-label': 'Nächste Woche',
          onclick: function () { wocheWechseln(1, liste); }
        })
      ),
      el('div', { class: 'kal-kopf-rechts' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Heute',
          onclick: function () { merk.tag = heute; zeichneWoche(liste); }
        })
      )
    ));

    const raster = el('div', { class: 'kal-woche' });
    tage.forEach(function (tag) {
      const termine = imRaum.filter(function (t) { return t.von <= tag && t.bis >= tag; })
        .sort(function (a, b) {
          if (rang(a) !== rang(b)) return rang(a) - rang(b);
          return (a.zeitVon || '').localeCompare(b.zeitVon || '');
        });
      const spalte = el('section', { class: 'kal-wtag' + (tag === heute ? ' kal-heute' : '') },
        el('h3', { class: 'kal-wtag-kopf', text: WOCHENTAGE[wochentagNr(tag)].slice(0, 2) + ', ' + datumText(tag).slice(0, 6) })
      );
      if (termine.length) termine.forEach(function (t) { spalte.append(wochenChip(t)); });
      else spalte.append(el('p', { class: 'leise kal-wleer', text: '–' }));
      spalte.append(el('button', {
        class: 'knopf knopf-hell knopf-klein kal-wneu', type: 'button', text: '+',
        'aria-label': 'Veranstaltung am ' + datumText(tag),
        title: 'Veranstaltung an diesem Tag',
        onclick: function () { formZeigen(null, { datum: tag }); }
      }));
      raster.append(spalte);
    });
    monatBox.append(raster);
  }

  // ---- Öffentlicher Termin einer anderen Gruppe: nur ansehen ----

  function oeffInfo(t) {
    let fenster = null;
    const r = t.roh || {};
    const inhalt = el('div', null,
      el('p', { class: 'leise', text: [datumsText(t), zeitText(t), t.ort].filter(Boolean).join(' · ') }),
      el('p', { class: 'leise', text: 'Veranstalter: ' + (txt(r.veranstalter) || t.gruppe) }),
      txt(r.beschreibung) ? el('p', { class: 'notiz', text: txt(r.beschreibung) }) : null,
      t.url
        ? el('p', null, el('a', {
          href: t.url, target: '_blank', rel: 'noopener noreferrer', text: 'Link öffnen'
        }))
        : null,
      el('div', { class: 'fenster-loeschen' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Schließen',
          onclick: function () { fenster.schliessen(); }
        })
      )
    );
    fenster = zeigeFenster(t.titel, inhalt, null, { aussenKlick: true });
  }
  
  // ---- Anheften (Pinnwand für extern, Mitteilung für intern) ----

  function norm(x) {
    return txt(x).replace(/\s+/g, ' ').toLowerCase();
  }

  // "12.09.2026 · 18:30 – 20:00 Uhr · Ort"
  function terminZeile(v) {
    const von = normDatum(v.datum);
    const bis = normDatum(v.datum_ende);
    const tag = bis && bis > von ? datumText(von) + ' – ' + datumText(bis) : datumText(von);
    const vz = zeitNorm(v.zeit_von);
    const bz = zeitNorm(v.zeit_bis);
    const zeit = vz ? (bz ? vz + ' – ' + bz + ' Uhr' : 'ab ' + vz + ' Uhr') : '';
    return [tag, zeit, txt(v.ort)].filter(Boolean).join(' · ');
  }

  async function anheften(v, fenster) {
    const pinnwand = !aufsBrett(v);
    const zeile1 = terminZeile(v);
    const weitere = [
      txt(v.veranstalter) ? 'Veranstalter: ' + txt(v.veranstalter) : '',
      sichereUrl(v.link)
    ].filter(Boolean);

    let r;
    try {
      r = await api('listMehrere', { tabellen: ['Kommentare', 'Mitteilungen'] }, s.token);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.message);
      return;
    }
    const t = (r && r.tabellen) || {};

    if (pinnwand) {
      const text = ('📅 ' + txt(v.titel) + ' · ' + [zeile1].concat(weitere).join(' · ')).slice(0, 1000);
      const da = (t.Kommentare || []).find(function (k) {
        return txt(k.bezug_art) === 'pinnwand' && norm(k.text) === norm(text);
      });
      if (da && !window.confirm(
        'Diese Veranstaltung steht schon auf der Pinnwand.\n\nTrotzdem noch einmal anlegen?'
      )) return;
      try {
        await api('create', {
          tabelle: 'Kommentare',
          daten: {
            projekt_id: '', bezug_art: 'pinnwand', bezug_id: '', text: text,
            farbe: eventFarbe(v, s.farbe)
          }
        }, s.token);
      } catch (e) {
        if (ctx.behandleFehler(e)) return;
        toast(e.message);
        return;
      }
      if (fenster) fenster.schliessen();
      toast('Auf der Pinnwand angeheftet.');
      return;
    }

    const titel = txt(v.titel);
    const text = [zeile1].concat(txt(v.beschreibung) ? [txt(v.beschreibung)] : [], weitere)
      .join('\n').slice(0, 4000);
    const da = (t.Mitteilungen || []).find(function (m) {
      return norm(m.titel) === norm(titel) && norm(m.text) === norm(text);
    });
    if (da) {
      const frage = istWahr(da.angeheftet)
        ? 'Diese Veranstaltung hängt schon als Mitteilung am Schwarzen Brett.\n\nTrotzdem eine neue anlegen?'
        : 'Dazu gibt es schon eine Mitteilung, die nicht mehr angeheftet ist. ' +
          'Du findest sie im Archiv auf dem Start und kannst sie dort wieder anheften.\n\n' +
          'Trotzdem eine neue anlegen?';
      if (!window.confirm(frage)) return;
    }
    try {
      await api('create', {
        tabelle: 'Mitteilungen',
        daten: { titel: titel, text: text, angeheftet: true, farbe: eventFarbe(v, s.farbe) }
      }, s.token);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.message);
      return;
    }
    if (fenster) fenster.schliessen();
    toast('Als Mitteilung angeheftet.');
  }
  
  // ---- Veranstaltung: Formular (v = null heißt neu) ----

  function formZeigen(v, vorgabe) {
    let fenster = null;
    const start = v
      ? Object.assign({}, v, {
        datum: normDatum(v.datum),
        datum_ende: normDatum(v.datum_ende),
        zeit_von: zeitNorm(v.zeit_von),
        zeit_bis: zeitNorm(v.zeit_bis),
        oeffentlich: istWahr(v.oeffentlich)
      })
      : Object.assign({ art: 'intern', datum: heuteIso(), oeffentlich: false }, vorgabe || {});
    
    const form = baueFormular(SCHEMA.Veranstaltungen.felder, start, {
      speichernText: v ? 'Speichern' : 'Anlegen',
      onSpeichern: function (d) { return speichern(v, d, fenster); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    // "Veröffentlichen" gibt es nur bei Art extern
    const artWahl = form.querySelector('select[name="art"]');
    const oeffBox = form.querySelector('input[name="oeffentlich"]');
    const oeffZeile = oeffBox ? oeffBox.closest('label') : null;
    function oeffAnzeige() {
      if (oeffZeile) oeffZeile.hidden = !artWahl || artWahl.value !== 'extern';
    }
    if (artWahl) artWahl.addEventListener('change', oeffAnzeige);
    oeffAnzeige();

    const inhalt = el('div', null, form);
    if (v) {
      inhalt.append(el('div', { class: 'fenster-loeschen form-knoepfe' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'In Mobi einplanen',
          onclick: function () { fenster.schliessen(); inMobiEinplanen(v); }
        }),
        el('button', {
          class: 'knopf knopf-hell', type: 'button',
          text: aufsBrett(v) ? 'Als Mitteilung anheften' : 'An Pinnwand heften',
          onclick: function () { anheften(v, fenster); }
        }),
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(v, fenster); }
        })
      ));
    }
    fenster = zeigeFenster(v ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung', inhalt);
  }

  // Veranstaltung in Mobi einplanen: dasselbe Fenster wie „+ Beiträge planen“, Bezug = Veranstaltung
  function inMobiEinplanen(v) {
    zeigeSammlung({
      ctx: ctx,
      token: s.token,
      kurzname: s.kurzname,
      bezug: {
        feld: 'veranstaltung_id', id: String(v.id), titel: txt(v.titel), datum: v.datum,
        datumName: 'Veranstaltungsdatum'
      },
      vorhandene: daten.mobi.filter(function (b) { return txt(b.veranstaltung_id) === String(v.id); }),
      beiFertig: function () { return laden(false); }
    });
  }

  async function speichern(v, d, fenster) {
    if (d.art !== 'intern' && d.art !== 'extern') throw new Error('Bitte die Art wählen.');
    if (d.datum_ende && d.datum_ende < d.datum) {
      throw new Error('Der letzte Tag darf nicht vor dem ersten Tag liegen.');
    }
    if (d.datum_ende === d.datum) d.datum_ende = '';
    if (d.zeit_bis && !d.zeit_von) throw new Error('Bitte auch „Uhrzeit von“ eintragen.');
    if (d.zeit_von && d.zeit_bis && !d.datum_ende && d.zeit_bis <= d.zeit_von) {
      throw new Error('„Uhrzeit bis“ muss nach „Uhrzeit von“ liegen.');
    }
    if (d.link && !sichereUrl(d.link)) {
      throw new Error('Der Link muss mit https:// oder http:// beginnen.');
    }
    if (d.art !== 'extern') d.oeffentlich = false;
    try {
      if (!v) {
        await api('create', { tabelle: 'Veranstaltungen', daten: d }, s.token);
        toast('Veranstaltung angelegt.');
      } else {
        const r = await api('update', {
          tabelle: 'Veranstaltungen', id: v.id, daten: d, bekannt: v.geaendert_am
        }, s.token);
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      fenster.schliessen();
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        laden(false);
        throw new Error('Jemand anderes hat diese Veranstaltung gerade geändert. ' +
          'Klicke auf „Abbrechen“ und öffne sie noch einmal.');
      }
      if (e.code === 'nicht_gefunden') {
        laden(false);
        throw new Error('Diese Veranstaltung gibt es nicht mehr. Klicke auf „Abbrechen“.');
      }
      throw e;
    }
  }

  async function loeschen(v, fenster) {
    // Das Skript löscht die Mobi-Beiträge der Veranstaltung mit (mobiKaskade)
    const n = daten.mobi.filter(function (b) { return txt(b.veranstaltung_id) === String(v.id); }).length;
    const frage = 'Diese Veranstaltung wirklich löschen?\n\n„' + txt(v.titel) + '“' +
      (n ? '\n\nDabei werden auch ' + n + (n === 1 ? ' Mobi-Beitrag' : ' Mobi-Beiträge') + ' gelöscht.' : '');
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'Veranstaltungen', id: v.id, bekannt: v.geaendert_am }, s.token);
      fenster.schliessen();
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

  // ---- Laden ----

  function zeigen(neu, m) {
    if (!neu.veranstaltungen) neu.veranstaltungen = [];
    if (!neu.projekte) neu.projekte = [];
    if (!neu.meilensteine) neu.meilensteine = [];
    if (!neu.todos) neu.todos = [];
    if (!neu.mobi) neu.mobi = [];
    if (!neu.oeffentlich) neu.oeffentlich = [];
    daten = neu;
    meta = m;
    offline = false;
    zeichne();
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':kalender',
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Veranstaltungen', 'Projekte', 'Meilensteine', 'ToDos', 'Mobi_Plan']
          }, s.token);
          // Öffentliche Termine anderer Gruppen (ohne Login). Klappt es nicht, bleibt die Liste leer.
          let oeff = [];
          try {
            const o = await api('termine', {});
            if (Array.isArray(o)) oeff = o;
          } catch (e2) { /* ignorieren */ }
          const t = (r && r.tabellen) || {};
          return {
            veranstaltungen: t.Veranstaltungen || [],
            projekte: t.Projekte || [],
            meilensteine: t.Meilensteine || [],
            todos: t.ToDos || [],
            mobi: t.Mobi_Plan || [],
            oeffentlich: oeff
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
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}
