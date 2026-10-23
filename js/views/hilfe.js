// js/views/hilfe.js
// Reiter Hilfe (Hilfe und Skillshare). Nur mit PIN erreichbar. Inhalte kommen später (Wiki, Etappe 10).
// Seit 0.31.7 (Schritt 9.8): Abschnitt „Team“ mit Aufklappern (Gruppen-Rollen, Hüte, Kapazität, Berg, wer sieht was).

import { el, leeren } from '../ui/dom.js';

// Hilfe zum Reiter Team: [Überschrift, Absätze]. Ein Absatz, der mit "- " beginnt, wird ein Listenpunkt.
const TEAM_HILFE = [
  ['Was ist der Reiter Team?', [
    'Hier steht, wer in der Gruppe mitmacht, wer sich um was kümmert und wie viel Zeit alle gerade haben.',
    'Mitmachen ist freiwillig. Wer sich nicht einträgt, kann die App ganz normal benutzen.',
    'Mit „Mich eintragen“ legst du deine Karte an. Dein Name ist dein Anzeigename („Wer bist du?“).'
  ]],
  ['Gruppen-Rollen', [
    'Eine Gruppen-Rolle ist eine dauerhafte Zuständigkeit, zum Beispiel Presse, Finanzen oder Schlüssel.',
    'Eine Gruppen-Rolle heißt nicht, dass du dich allein kümmern musst. Du kannst jederzeit Unterstützung bekommen.',
    'Die Liste der Rollen steht unten im Reiter („Gruppen-Rollen“). Alle in der Gruppe dürfen Rollen anlegen, ändern und löschen.',
    'Eine fest gewählte Rolle (zum Beispiel Bundes-Deli 1) hat höchstens eine Person.'
  ]],
  ['Hüte', [
    'Ein Hut ist eine Aufgabe mit Verantwortlichen: ein offenes ToDo, ein Meilenstein oder ein Mobi-Beitrag.',
    'Freie Hüte sind Aufgaben, für die noch jemand gesucht wird. Mit „Hut übernehmen“ trägst du dich ein.',
    'Auf deiner Karte steht, wie viele Hüte du hast und in welchen Projekten. Gezählt wird der genaue Name: „Ben“ ist nicht „Bente“.',
    'Steht unten „Namen in Hüten ohne Team-Karte“, gibt es einen Namen ohne Karte. Oft ist das ein Tippfehler.'
  ]],
  ['Kapazität', [
    'Mit einer Zahl von 1 bis 10 sagst du, wie viel Zeit und Kraft du gerade hast:',
    '- 1 bis 3: kaum Zeit',
    '- 4 bis 6: etwas Zeit',
    '- 7 bis 8: gut Zeit',
    '- 9 bis 10: viel Zeit',
    'Jede Angabe gilt bis zu einem Datum (höchstens 6 Monate). Danach ist sie abgelaufen und zählt nicht mehr. Auf dem Start erinnert dich dann eine Zeile.',
    'Du kannst auch eine Angabe für später machen, zum Beispiel „ab 1. Dezember wieder 7“.',
    'Wer eine Zeit gar nicht kann, nimmt den Haken „Dabei“ weg (Pause).'
  ]],
  ['Der Berg', [
    'Der Berg zeigt, wie viel Kraft die Gruppe in den nächsten Wochen hat. Jede Schicht ist eine Person, so dick wie ihre Kapazität.',
    'Darunter stehen die fälligen Hüte je Woche: grau mit Verantwortlichen, blau offene Aufgaben ohne Verantwortliche.',
    'Orange heißt „eng“: mindestens 3 Hüte und mehr als ein Hut je 4 Punkte Kraft.',
    'Grüne Linien sind Aktionen, die gestrichelte Linie ist heute. Tippe auf eine Woche für die Zahlen. „Zahlen zeigen“ zeigt alles als Tabelle.'
  ]],
  ['Wer sieht was? Wer darf was?', [
    'Alle Angaben sieht nur deine Gruppe (mit dem Gruppen-PIN). Nichts davon ist öffentlich.',
    'Jede Person bearbeitet nur ihre eigene Karte. Das ist eine Absprache, kein Schutz: Die App kennt keine einzelnen Konten.',
    'Mit „Für jemanden eintragen“ legst du eine Karte für eine andere Person an, zum Beispiel für jemanden ohne Handy. Diese Karte dürfen alle bearbeiten.'
  ]],
  ['Namen ändern', [
    'Änderst du deinen Namen auf deiner Karte, ändert die App ihn auch in ToDos, Meilensteinen, Mobi-Beiträgen und Umfrage-Antworten. Protokolle und Reden bleiben, wie sie sind.',
    'Änderst du oben nur „Name ändern“, fragt der Reiter Team, ob deine Karte mit umbenannt werden soll.'
  ]],
  ['Austragen und Datenschutz', [
    'Speichere nur, was nötig ist. Schreib in die Notiz keine Gründe, die deine Gesundheit oder Familie betreffen.',
    'Mit „Mich austragen“ werden deine Karte und alle Angaben zur Kapazität gelöscht. Namen in ToDos und Protokollen bleiben.',
    'Abgelaufene Angaben zur Kapazität werden ein halbes Jahr nach ihrem Ende endgültig gelöscht.'
  ]]
];

function teil(titel, absaetze) {
  const body = el('div', { class: 'hilfe-text' });
  let liste = null;
  absaetze.forEach(function (a) {
    if (a.indexOf('- ') === 0) {
      if (!liste) { liste = el('ul'); body.append(liste); }
      liste.append(el('li', { text: a.slice(2) }));
    } else {
      liste = null;
      body.append(el('p', { text: a }));
    }
  });
  return el('details', { class: 'hilfe-teil' }, el('summary', { text: titel }), body);
}

export function render(container, ctx) {
  leeren(container);
  container.append(el('div', { class: 'seite' },
    el('h1', { text: 'Hilfe' }),
    el('p', { class: 'leise', text: 'Hier kommen später Hilfe und Skillshare.' }),
    el('section', { class: 'karte hilfe-abschnitt', id: 'hilfe-team' },
      el('h2', { text: '👥 Team' }),
      ...TEAM_HILFE.map(function (t) { return teil(t[0], t[1]); })
    )
  ));
}
