// js/views/termine-liste.js
// Gemeinsame Teile für die öffentlichen Termine: Laden, Aufräumen, Kacheln, Detailfenster,
// Anheften, Seitenleiste und der "Aktionskalender" (Seite #/termine und Ansicht im Reiter Kalender).
// Die Termine kommen ohne Login vom Skript (Aktion "termine") und liegen im Zwischenspeicher.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { API_URL } from '../config.js';
import { ladeMitCache } from '../cache.js';
import { zeigeFenster } from '../ui/fenster.js';
import { toast } from '../ui/toast.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';
import {
  schriftfarbe, sichereUrl, WOCHENTAGE_KURZ, wochentagNr, MONATE
} from './kalender-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function norm(v) {
  return txt(v).replace(/\s+/g, ' ').toLowerCase();
}

function farbeVon(f) {
  const t = txt(f);
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : '#368469';
}

// Macht aus der Antwort des Skripts eine saubere Liste. Vergangene fallen heraus.
export function bereinige(roh) {
  const heute = heuteIso();
  const liste = [];
  (Array.isArray(roh) ? roh : []).forEach(function (v) {
    const von = normDatum(v.datum);
    if (!von) return;
    let bis = normDatum(v.datum_ende);
    if (!bis || bis < von) bis = von;
    if (bis < heute) return;
    liste.push({
      titel: txt(v.titel),
      von: von,
      bis: bis,
      zeitVon: txt(v.zeit_von),
      zeitBis: txt(v.zeit_bis),
      ort: txt(v.ort),
      beschreibung: txt(v.beschreibung),
      veranstalter: txt(v.veranstalter),
      url: sichereUrl(v.link),
      gruppe: txt(v.gruppe_name),
      kurz: txt(v.kurzname),
      farbe: farbeVon(v.farbe),
      web: sichereUrl(v.gruppe_web),
      insta: sichereUrl(v.gruppe_instagram),
      links: (Array.isArray(v.gruppe_links) ? v.gruppe_links : [])
        .map(sichereUrl).filter(Boolean)
    });
  });
  liste.sort(function (a, b) {
    if (a.von !== b.von) return a.von < b.von ? -1 : 1;
    if (a.zeitVon !== b.zeitVon) return a.zeitVon < b.zeitVon ? -1 : 1;
    return a.titel.localeCompare(b.titel, 'de');
  });
  return liste;
}

// Seit 0.33.12 (Schritt 11.10): Wer veranstaltet? Ohne Eintrag die Gruppe, die den Termin eingetragen hat.
export function veranstalterVon(t) {
  return t.veranstalter || t.gruppe;
}

function tagKurz(tag) {
  return WOCHENTAGE_KURZ[wochentagNr(tag)] + ', ' + datumText(tag);
}

export function datumsText(t) {
  if (t.von === t.bis) return tagKurz(t.von);
  return tagKurz(t.von) + ' – ' + tagKurz(t.bis);
}

export function zeitText(t) {
  if (t.zeitVon && t.zeitBis) return t.zeitVon + ' – ' + t.zeitBis + ' Uhr';
  if (t.zeitVon) return 'ab ' + t.zeitVon + ' Uhr';
  return '';
}

// Zeigt zuerst den gemerkten Stand, dann den frischen. anzeigen(liste, { aktuell, stand }).
// Gibt true zurück, wenn frisch geladen wurde. Wirft einen Fehler, wenn es gar nichts gibt.
export function ladeOeffentlich(anzeigen) {
  return ladeMitCache(
    'oeffentlich:termine',
    function () { return api('termine', {}); },
    function (daten, meta) { anzeigen(bereinige(daten), meta); },
    true
  );
}

// Adresse zum Abonnieren (Kalender-Datei). kurz = '' heißt alle Gruppen.
export function abonnierLink(kurz) {
  return API_URL + '?aktion=termine&format=ics' + (kurz ? '&gruppe=' + encodeURIComponent(kurz) : '');
}

// Seit 0.32.7: dieselbe Adresse für Apple (webcal://, öffnet das Abo direkt) und Google Kalender (Seite „Kalender hinzufügen“)
export function appleAboLink(url) {
  return String(url).replace(/^https?:\/\//i, 'webcal://');
}

export function googleAboLink(url) {
  return 'https://calendar.google.com/calendar/render?cid=' + encodeURIComponent(appleAboLink(url));
}

// ---- Kacheln ----

// Kleine Karte (Seitenleiste auf der Gruppenwahl)
export function terminKarte(t) {
  const info = [zeitText(t), t.ort].filter(Boolean).join(' · ');
  const k = el('article', { class: 'oeff-termin' },
    el('span', { class: 'oeff-datum', text: datumsText(t) }),
    el('strong', { text: t.titel }),
    info ? el('span', { class: 'oeff-info', text: info }) : null,
    el('span', { class: 'oeff-info', text: 'Veranstalter: ' + veranstalterVon(t) })
  );
  k.style.background = t.farbe;
  k.style.color = schriftfarbe(t.farbe);
  return k;
}

// anheften (nur für Angemeldete): { text, fn(t) -> Promise }. Der Knopf sitzt unter dem Text der Kachel.
export function terminKachel(t, beiKlick, anheften) {
  const leer = '\u00a0';
  const haupt = el('button', {
    class: 'oeff-kachel', type: 'button',
    onclick: function () { beiKlick(t); }
  },
    el('span', { class: 'oeff-datum', text: datumsText(t) }),
    el('strong', { text: t.titel || leer }),
    el('span', { text: zeitText(t) || leer }),
    el('span', { text: t.ort || leer }),
    el('span', { text: veranstalterVon(t) || leer })
  );
  const k = el('div', { class: 'oeff-kachel-box' }, haupt);
  if (anheften) {
    const b = el('button', {
      class: 'knopf knopf-hell knopf-klein oeff-heften', type: 'button', text: anheften.text,
      onclick: async function () {
        b.disabled = true;
        await anheften.fn(t);
        b.disabled = false;
      }
    });
    k.append(b);
  }
  k.style.background = t.farbe;
  k.style.color = schriftfarbe(t.farbe);
  return k;
}

// ---- Anheften (nur für Angemeldete) ----

function istEigen(t, session) {
  return !!session && txt(t.kurz) === txt(session.kurzname) && !t.veranstalter;
}

function terminZeile(t) {
  const tag = t.bis > t.von ? datumText(t.von) + ' – ' + datumText(t.bis) : datumText(t.von);
  return [tag, zeitText(t), t.ort].filter(Boolean).join(' · ');
}

// Gruppeneigen (Veranstalter leer): Mitteilung am Schwarzen Brett. Sonst: Kommentar an der Pinnwand.
// Gibt true zurück, wenn angeheftet wurde.
async function anheften(t, session, ctx) {
  const eigen = istEigen(t, session);
  const zeile1 = terminZeile(t);
  const weitere = eigen
    ? [t.url].filter(Boolean)
    : ['Veranstalter: ' + veranstalterVon(t), t.url].filter(Boolean);

  let r;
  try {
    r = await api('listMehrere', { tabellen: ['Kommentare', 'Mitteilungen'] }, session.token);
  } catch (e) {
    if (ctx.behandleFehler(e)) return false;
    toast(e.message);
    return false;
  }
  const tb = (r && r.tabellen) || {};

  if (!eigen) {
    const text = ('📅 ' + t.titel + ' · ' + [zeile1].concat(weitere).join(' · ')).slice(0, 1000);
    const da = (tb.Kommentare || []).find(function (k) {
      return txt(k.bezug_art) === 'pinnwand' && norm(k.text) === norm(text);
    });
    if (da && !window.confirm(
      'Diese Veranstaltung steht schon auf der Pinnwand.\n\nTrotzdem noch einmal anlegen?'
    )) return false;
    try {
      await api('create', {
        tabelle: 'Kommentare',
        daten: { projekt_id: '', bezug_art: 'pinnwand', bezug_id: '', text: text, farbe: t.farbe }
      }, session.token);
    } catch (e) {
      if (ctx.behandleFehler(e)) return false;
      toast(e.message);
      return false;
    }
    toast('Auf der Pinnwand angeheftet.');
    return true;
  }

  const text = [zeile1].concat(t.beschreibung ? [t.beschreibung] : [], weitere)
    .join('\n').slice(0, 4000);
  const da = (tb.Mitteilungen || []).find(function (m) {
    return norm(m.titel) === norm(t.titel) && norm(m.text) === norm(text);
  });
  if (da && !window.confirm(
    'Diese Veranstaltung gibt es schon als Mitteilung (vielleicht im Archiv auf dem Start).\n\n' +
    'Trotzdem eine neue anlegen?'
  )) return false;
  try {
    await api('create', {
      tabelle: 'Mitteilungen',
      daten: { titel: t.titel, text: text, angeheftet: true, farbe: t.farbe }
    }, session.token);
  } catch (e) {
    if (ctx.behandleFehler(e)) return false;
    toast(e.message);
    return false;
  }
  toast('Als Mitteilung angeheftet.');
  return true;
}

// ---- Detailfenster ----

function linkName(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; }
}

export function zeigeTerminDetail(t, session, ctx) {
  let fenster = null;
  const info = [datumsText(t), zeitText(t), t.ort].filter(Boolean).join(' · ');

  const links = el('ul', { class: 'oeff-links-liste' });
  function linkZu(label, url) {
    if (!url) return;
    links.append(el('li', null, el('a', {
      href: url, target: '_blank', rel: 'noopener noreferrer', text: label
    })));
  }
  linkZu('Webseite', t.web);
  linkZu('Instagram', t.insta);
  t.links.forEach(function (u) { linkZu(linkName(u), u); });
  const hatLinks = links.childNodes.length > 0;

  const knoepfe = el('div', { class: 'fenster-loeschen form-knoepfe' });
  if (session) {
    knoepfe.append(el('button', {
      class: 'knopf', type: 'button',
      text: istEigen(t, session) ? 'Als Mitteilung anheften' : 'An Pinnwand heften',
      onclick: async function () {
        const ok = await anheften(t, session, ctx);
        if (ok) fenster.schliessen();
      }
    }));
  }
  knoepfe.append(el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Schließen',
    onclick: function () { fenster.schliessen(); }
  }));

  const inhalt = el('div', null,
    el('p', { class: 'leise', text: info }),
    el('p', { class: 'leise', text: 'Veranstalter: ' + veranstalterVon(t) }),
    t.veranstalter && t.gruppe ? el('p', { class: 'leise', text: 'Eingetragen von: ' + t.gruppe }) : null,
    t.beschreibung ? el('p', { class: 'notiz', text: t.beschreibung }) : null,
    t.url
      ? el('p', null, el('a', {
        href: t.url, target: '_blank', rel: 'noopener noreferrer', text: 'Zur Veranstaltung'
      }))
      : null,
    hatLinks ? el('h3', { text: 'Die Gruppe: ' + t.gruppe }) : null,
    hatLinks ? links : null,
    knoepfe
  );
  fenster = zeigeFenster(t.titel, inhalt, null, { aussenKlick: true });
}

// ---- Seitenleiste auf der Gruppenwahl ----

// Die nächsten Termine zuerst. Ohne Termine bleibt die Leiste versteckt.
export function zeichneSeitenleiste(box, liste) {
  leeren(box);
  box.hidden = !liste.length;
  if (!liste.length) return;
  const MAX = 8;
  box.append(
    el('h2', { text: 'Öffentliche Termine' }),
    el('ul', { class: 'oeff-liste' },
      ...liste.slice(0, MAX).map(function (t) { return el('li', null, terminKarte(t)); }))
  );
  if (liste.length > MAX) {
    box.append(el('p', { class: 'leise', text: '… und ' + (liste.length - MAX) + ' weitere' }));
  }
  box.append(el('a', { class: 'knopf knopf-hell', href: '#/termine', text: 'Alle Termine →' }));
}

// ---- Aktionskalender: Auswahl, Kacheln, Abo-Adresse ----
// session: Anmeldung oder null (öffentliche Seite ohne Login). ctx: für behandleFehler.
// Gibt { el, laden } zurück.

export function baueAktionskalender(session, ctx) {
  let alle = [];

  const status = el('p', { class: 'leise', text: 'Lade Termine …' });
  // Seit 0.33.12: oben Auswahl nach Veranstalter und Sortierung, die Gruppe wählt man nur noch fürs Abo
  const wahlVeranstalter = el('select', { class: 'feld', 'aria-label': 'Veranstalter' });
  const sortierung = el('select', { class: 'feld', 'aria-label': 'Sortieren' },
    el('option', { value: 'veranstalter', text: 'Nach Veranstalter' }),
    el('option', { value: 'datum', text: 'Nach Datum' })
  );
  const wahl = el('select', { class: 'feld', 'aria-label': 'Gruppe für das Abo' });
  const liste = el('div');
  const aboLink = el('a', {
    class: 'knopf knopf-hell', target: '_blank', rel: 'noopener noreferrer',
    text: 'Kalender-Datei öffnen'
  });
  const aboUrl = el('span', { class: 'leise oeff-url' });
  const aboGoogle = el('a', { class: 'knopf knopf-hell', target: '_blank', rel: 'noopener noreferrer', text: 'In Google Kalender öffnen' });
  const aboApple = el('a', { class: 'knopf knopf-hell', text: 'In Apple Kalender öffnen' });
  const aboKopieren = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Adresse kopieren',
    onclick: function () {
      const url = abonnierLink(wahl.value);
      const fertig = function (ok) { toast(ok ? 'Adresse kopiert.' : 'Kopieren ging nicht. Bitte die Adresse oben markieren.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { fertig(true); }, function () { fertig(false); });
      else fertig(false);
    }
  });

  const box = el('div', null,
    el('div', { class: 'oeff-auswahl' }, wahlVeranstalter, sortierung),
    status,
    liste,
    el('section', { class: 'karte' },
      el('h2', { text: 'Im eigenen Kalender abonnieren' }),
      el('p', {
        class: 'leise',
        text: 'Diese Adresse in Google Kalender, Outlook oder den Handy-Kalender kopieren ' +
          '(„Kalender per URL hinzufügen“). Neue Termine erscheinen dann von selbst.'
      }),
      wahl,
      aboUrl,
      el('div', { class: 'abo-knoepfe' }, aboGoogle, aboApple, aboKopieren, aboLink),
      el('p', { class: 'leise', text: 'Google Kalender: am besten am PC öffnen, das Abo erscheint dann auch am Handy. ' +
        'Neue Termine kommen bei Google oft erst nach einigen Stunden an. Apple: am iPhone oder Mac öffnen.' })
    )
  );

  function aboZeigen() {
    const url = abonnierLink(wahl.value);
    aboLink.href = url;
    aboUrl.textContent = url;
    aboGoogle.href = googleAboLink(url);
    aboApple.href = appleAboLink(url);
  }

  function wahlAufbauen() {
    const alt = wahl.value;
    const gruppen = [];
    alle.forEach(function (t) {
      if (t.kurz && !gruppen.some(function (g) { return g.kurz === t.kurz; })) {
        gruppen.push({ kurz: t.kurz, name: t.gruppe });
      }
    });
    gruppen.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    leeren(wahl);
    wahl.append(el('option', { value: '', text: 'Alle Gruppen' }));
    gruppen.forEach(function (g) {
      wahl.append(el('option', { value: g.kurz, text: g.name }));
    });
    wahl.value = gruppen.some(function (g) { return g.kurz === alt; }) ? alt : '';
    wahl.hidden = gruppen.length < 2;

    // Veranstalter: gleiche Namen (Groß- und Kleinschreibung, Leerzeichen egal) zählen als einer
    const altV = wahlVeranstalter.value;
    const namen = [];
    alle.forEach(function (t) {
      const n = veranstalterVon(t);
      if (n && !namen.some(function (x) { return x.schluessel === norm(n); })) {
        namen.push({ schluessel: norm(n), name: n });
      }
    });
    namen.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    leeren(wahlVeranstalter);
    wahlVeranstalter.append(el('option', { value: '', text: 'Alle Veranstalter' }));
    namen.forEach(function (x) {
      wahlVeranstalter.append(el('option', { value: x.schluessel, text: x.name }));
    });
    wahlVeranstalter.value = namen.some(function (x) { return x.schluessel === altV; }) ? altV : '';
    wahlVeranstalter.hidden = namen.length < 2;
  }

  function kachel(t) {
    return el('li', null, terminKachel(
      t,
      function (x) { zeigeTerminDetail(x, session, ctx); },
      session ? {
        text: istEigen(t, session) ? 'Als Mitteilung anheften' : 'An Pinnwand heften',
        fn: function (x) { return anheften(x, session, ctx); }
      } : null
    ));
  }

  function zeichne() {
    const v = wahlVeranstalter.value;
    const zeilen = alle.filter(function (t) { return !v || norm(veranstalterVon(t)) === v; });
    leeren(liste);
    if (!zeilen.length) {
      liste.append(el('p', {
        class: 'leise', text: 'Zurzeit sind keine öffentlichen Termine eingetragen.'
      }));
    }
    // Überschrift je Veranstalter (A bis Z, darin nach Datum) oder je Monat
    const nachVeranstalter = sortierung.value === 'veranstalter';
    const reihe = zeilen.slice();
    const anzeige = {};   // Schlüssel -> Name, so wie er beim frühesten Termin steht
    zeilen.forEach(function (t) {
      const n = norm(veranstalterVon(t));
      if (!(n in anzeige)) anzeige[n] = veranstalterVon(t);
    });
    if (nachVeranstalter) {
      reihe.sort(function (a, b) {
        const x = norm(veranstalterVon(a)).localeCompare(norm(veranstalterVon(b)), 'de');
        return x !== 0 ? x : zeilen.indexOf(a) - zeilen.indexOf(b);
      });
    }
    let titel = null;
    let ul = null;
    reihe.forEach(function (t) {
      const neu = nachVeranstalter
        ? norm(veranstalterVon(t))
        : MONATE[Number(t.von.slice(5, 7)) - 1] + ' ' + t.von.slice(0, 4);
      if (neu !== titel) {
        titel = neu;
        liste.append(el('h2', { class: 'teil-titel-klein', text: nachVeranstalter ? anzeige[neu] : neu }));
        ul = el('ul', { class: 'oeff-liste oeff-gross' });
        liste.append(ul);
      }
      ul.append(kachel(t));
    });
    aboZeigen();
  }

  function zeigen(daten, meta) {
    if (!box.isConnected) return;   // Seite wurde inzwischen gewechselt
    alle = daten;
    wahlAufbauen();
    zeichne();
    status.className = 'leise';
    status.textContent = alle.length + (alle.length === 1 ? ' kommender Termin' : ' kommende Termine') +
      (meta.aktuell ? '' : ' · Zwischengespeichert, aktualisiere …');
  }

  async function laden() {
    try {
      const ok = await ladeOeffentlich(zeigen);
      if (!ok && box.isConnected) {
        status.className = 'fehler';
        status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      }
    } catch (e) {
      if (!box.isConnected) return;
      status.className = 'fehler';
      status.textContent = 'Die Termine konnten nicht geladen werden: ' + e.message;
    }
  }

  wahlVeranstalter.addEventListener('change', zeichne);
  sortierung.addEventListener('change', zeichne);
  wahl.addEventListener('change', aboZeigen);
  aboZeigen();
  return { el: box, laden: laden };
}
