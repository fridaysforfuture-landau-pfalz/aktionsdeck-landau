// js/views/info.js
// Impressum, Info, Datenschutz: drei Seiten, ohne Login erreichbar.
// Seit 0.32.1 (Schritt 10.2): Die Texte liegen in texte/<seite>.txt (Format wie im Wiki, js/wiki-format.js).
// „Info“ zeigt dazu die Gruppen mit ihren Links (öffentliche Aktion "wiki", Liste der Gruppen) und die Version.

import { el, leeren } from '../ui/dom.js';
import { balken } from '../ui/kopf.js';
import { OEFFENTLICH } from '../ui/nav.js';
import { getSession } from '../store.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeichneText } from '../wiki-format.js';
import { sichereUrl } from './kalender-rechnen.js';

async function ladeText(seite) {
  const antwort = await fetch('texte/' + seite + '.txt', { cache: 'no-cache' });
  if (!antwort.ok) throw new Error('fehlt');
  return antwort.text();
}

function linkZeile(text, url) {
  const u = sichereUrl(url);
  return u ? el('a', { href: u, target: '_blank', rel: 'noopener noreferrer', text: text }) : null;
}

// Gruppen mit Webseite, Instagram und weiteren Links
function zeigeGruppen(box, gruppen) {
  leeren(box);
  const liste = (Array.isArray(gruppen) ? gruppen : []).filter(function (g) { return g && g.name; });
  if (!liste.length) { box.hidden = true; return; }
  box.hidden = false;
  box.append(el('h2', { text: 'Die Gruppen' }));
  liste.forEach(function (g) {
    const links = [linkZeile('Webseite', g.webseite), linkZeile('Instagram', g.instagram)]
      .concat((Array.isArray(g.links) ? g.links : []).slice(0, 5).map(function (u) {
        return linkZeile(String(u).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''), u);
      }))
      .filter(Boolean);
    box.append(el('div', { class: 'info-gruppe' },
      el('h3', { text: String(g.name) }),
      links.length ? el('div', { class: 'info-gruppe-links' }, ...links) : el('p', { class: 'leise', text: 'Noch keine Links.' })
    ));
  });
}

export function render(container, ctx) {
  leeren(container);
  const aktiv = OEFFENTLICH.find(function (o) { return o.id === ctx.seite; }) ||
    OEFFENTLICH.find(function (o) { return o.id === 'info'; });

  const menue = el('nav', { class: 'start-knoepfe', 'aria-label': 'Rechtliches und Info' },
    ...OEFFENTLICH.map(function (o) {
      const a = el('a', {
        class: 'knopf' + (o.id === aktiv.id ? '' : ' knopf-hell'),
        href: '#/info/' + o.id,
        text: o.label
      });
      if (o.id === aktiv.id) a.setAttribute('aria-current', 'page');
      return a;
    })
  );

  const s = getSession();
  const zurueck = s
    ? el('a', { href: '#/g/' + encodeURIComponent(s.kurzname) + '/start', text: '← Zurück zur App' })
    : el('a', { href: '#/', text: '← Zur Gruppenwahl' });

  const textBox = el('div', null, el('p', { class: 'leise', text: 'Lädt …' }));
  const gruppenBox = el('section', { class: 'info-gruppen' });
  gruppenBox.hidden = true;
  const karte = el('section', { class: 'karte info-karte' },
    el('h1', { text: aktiv.label }),
    textBox,
    aktiv.id === 'info' ? gruppenBox : null,
    aktiv.id === 'info'
      ? el('p', { class: 'leise info-version', text: 'AktionsDeck Landau · Version ' + ctx.version })
      : null
  );

  container.append(
    balken(),
    el('div', { class: 'start-seite' }, menue, karte, el('p', null, zurueck))
  );

  ladeText(aktiv.id).then(function (text) {
    if (!container.contains(karte)) return;
    leeren(textBox);
    textBox.append(zeichneText(text));
  }).catch(function () {
    if (!container.contains(karte)) return;
    leeren(textBox);
    textBox.append(el('p', { class: 'fehler', text: 'Der Text konnte nicht geladen werden. Bitte später noch einmal versuchen.' }));
  });

  if (aktiv.id === 'info') {
    ladeMitCache('oeffentlich:wiki', function () { return api('wiki', {}); }, function (daten) {
      if (!container.contains(karte)) return;
      zeigeGruppen(gruppenBox, daten && daten.gruppen);
    }, true).catch(function () { /* ohne Verbindung und ohne Kopie: keine Gruppen-Liste */ });
  }
}
