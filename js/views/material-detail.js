// js/views/material-detail.js
// Baut den Inhalt der Detailansicht für ein Material.

import { el } from '../ui/dom.js';
import { zeigeBild } from '../ui/lightbox.js';

// Nimmt nur die Datei-ID. Erkennt sie auch in einem ganzen Drive-Link.
export function fotoId(wert) {
  const t = String(wert || '').trim();
  if (!t) return '';
  let m = t.match(/\/d\/([A-Za-z0-9_-]{10,})/);
  if (m) return m[1];
  m = t.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{10,}$/.test(t) ? t : '';
}

function datumText(s) {
  const t = String(s || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t.split('-').reverse().join('.') : String(s || '');
}

function foto(m) {
  const id = fotoId(m.foto_id);
  if (!id) return el('p', { class: 'leise', text: 'Kein Foto.' });
  const box = el('div', { class: 'detail-foto-box' });
  const beschr = 'Foto: ' + String(m.name);
  const img = el('img', {
    class: 'detail-foto',
    src: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w800',
    alt: beschr,
    loading: 'lazy',
    referrerpolicy: 'no-referrer'
  });
  img.addEventListener('error', function () {
    box.textContent = '';
    box.append(el('p', {
      class: 'fehler',
      text: 'Das Foto konnte nicht geladen werden. Prüfe die Freigabe in Google Drive.'
    }));
  });
  box.append(el('button', {
    class: 'foto-knopf',
    type: 'button',
    'aria-label': 'Foto vergrößern',
    onclick: function () {
      zeigeBild('https://drive.google.com/thumbnail?id=' + id + '&sz=w1600', beschr);
    }
  }, img));
  return box;
}

function paare(liste) {
  const dl = el('dl', { class: 'detail-liste' });
  liste.forEach(function (p) {
    if (p[1] === '' || p[1] === undefined || p[1] === null) return;
    dl.append(el('dt', { text: p[0] }), el('dd', { text: String(p[1]) }));
  });
  return dl;
}

function artText(a) {
  if (a === 'mitgenommen') return 'mitgenommen';
  if (a === 'defekt') return 'defekt';
  return 'zurück';
}

function neuesteZuerst(liste) {
  return liste.slice().sort(function (a, b) {
    return String(b.erstellt_am || '').localeCompare(String(a.erstellt_am || ''));
  });
}

function verlaufListe(verlauf) {
  if (!verlauf.length) {
    return el('p', { class: 'leise', text: 'Noch nichts ausgeliehen.' });
  }
  const ul = el('ul', { class: 'verlauf' });
  neuesteZuerst(verlauf).slice(0, 10).forEach(function (a) {
    const text = [
      datumText(a.datum || a.erstellt_am),
      artText(a.art),
      a.anzahl,
      a.person
    ].filter(function (x) { return x !== '' && x !== undefined; }).join(' · ');
    ul.append(el('li', { text: text }));
  });
  return ul;
}

// m = Material aus mitVerfuegbar (mit _verfuegbar, _draussen, _verbrauch)
// verlauf = Ausleihe-Zeilen dieses Materials
// bei = Text „wer hat es gerade“ (seit 1.3.0, je Gruppe mit Namen), freiwillig
export function baueDetail(m, verlauf, herkunft, bei) {
  const einheit = m.einheit ? ' ' + m.einheit : '';
  const kat = [m.kategorie, m.unterkategorie].filter(Boolean).join(' › ');
  const hat = m.anzahl !== '' && m.anzahl !== undefined && m.anzahl !== null;
  const letzte = neuesteZuerst(verlauf.filter(function (a) { return a.art === 'mitgenommen'; }))[0];

  const zeilen = [
    ['Art', m._verbrauch ? 'Verbrauchsmaterial' : 'Festes Material'],
    ['Kategorie', kat],
    ['Ort', m.ort],
    [m._verbrauch ? 'Vorrat' : 'Bestand', hat ? m.anzahl + einheit : '']
  ];
  if (!m._verbrauch) {
    zeilen.push(['Verfügbar', m._verfuegbar === '' ? '' : m._verfuegbar + einheit]);
    zeilen.push(['Gerade ausgeliehen', m._draussen + einheit + (herkunft ? ' (' + herkunft + ')' : '')]);
    if (bei && m._draussen > 0) zeilen.push(['Gerade bei', bei]);
  }
  if (letzte) {
    zeilen.push(['Zuletzt mitgenommen',
      [String(letzte.person || ''), datumText(letzte.datum || letzte.erstellt_am)]
        .filter(Boolean).join(', ')]);
  }

  const box = el('div', null);
  if (!m._verbrauch && m._draussen > 0) {
    box.append(el('p', { class: 'gebucht-hinweis', text: 'Gebucht: ' + m._draussen + einheit + ' ausgeliehen' }));
  }
  box.append(foto(m), paare(zeilen));
  if (m.notiz) {
    box.append(el('h3', { text: 'Notiz' }), el('p', { class: 'notiz', text: String(m.notiz) }));
  }
  box.append(el('h3', { text: 'Letzte Ausleihen' }), verlaufListe(verlauf));
  return box;
}
