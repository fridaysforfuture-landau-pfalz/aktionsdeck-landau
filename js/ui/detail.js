// js/ui/detail.js
// Detailbereich: rechts am PC, Vollbild am Handy (CSS: Klasse "offen").
// Am Handy legt das Detail einen Verlaufseintrag an: Die Zurück-Taste schließt dann das Detail.
// Seit 0.34.8 (Barrierefreiheit): Beim Öffnen springt der Fokus auf die Überschrift, beim Schließen zurück
// auf den Knopf, der das Detail geöffnet hat. Esc schließt das Detail wie „← Zurück“ (nicht in Eingabefeldern).

import { el, leeren } from './dom.js';

let panelMitEintrag = null;
let beiZuMerken = null;
let oeffner = null;        // Element mit Fokus vor dem Öffnen
let zurueckKnopf = null;   // „← Zurück“ des offenen Details

document.addEventListener('keydown', function (ev) {
  if (ev.key !== 'Escape' || !zurueckKnopf || !zurueckKnopf.isConnected) return;
  if (document.querySelector('[aria-modal="true"]')) return;   // Fenster schließt sich selbst
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  zurueckKnopf.click();
});

function istHandy() {
  return window.matchMedia('(max-width: 959px)').matches;
}

function sichtbarSchliessen(panel) {
  const fokusDrin = panel.contains(document.activeElement) || document.activeElement === document.body;
  leeren(panel);
  panel.classList.remove('offen');
  zurueckKnopf = null;
  if (fokusDrin && oeffner && oeffner.isConnected) oeffner.focus({ preventScroll: true });
  oeffner = null;
}

export function schliesseDetail(panel) {
  sichtbarSchliessen(panel);
  if (panelMitEintrag === panel) {
    panelMitEintrag = null;
    beiZuMerken = null;
    if (history.state && history.state.aktionsdeckDetail) history.back();
  }
}

// Zurück-Taste (oder Seitenwechsel): Detail schließen, Eintrag ist schon weg
window.addEventListener('popstate', function () {
  if (!panelMitEintrag) return;
  if (history.state && history.state.aktionsdeckDetail) return;
  const p = panelMitEintrag;
  const f = beiZuMerken;
  panelMitEintrag = null;
  beiZuMerken = null;
  sichtbarSchliessen(p);
  if (f) f();
});

// neu = true: nach oben scrollen. false: Scrollstand behalten (bei Aktualisierung).
export function zeigeDetail(panel, titel, inhalt, beiZu, neu) {
  const scroll = neu ? 0 : panel.scrollTop;
  const fokusVorher = document.activeElement;
  const fokusWarDrin = panel.contains(fokusVorher);
  if (!fokusWarDrin && fokusVorher && fokusVorher !== document.body) oeffner = fokusVorher;
  leeren(panel);
  panel.classList.add('offen');
  zurueckKnopf = el('button', {
    class: 'knopf knopf-hell',
    type: 'button',
    text: '← Zurück',
    onclick: function () {
      schliesseDetail(panel);
      if (beiZu) beiZu();
    }
  });
  const ueberschrift = el('h2', { text: titel, tabindex: '-1', class: 'fokus-still' });
  panel.append(el('div', { class: 'detail-kopf' }, zurueckKnopf), ueberschrift, inhalt);
  panel.scrollTop = scroll;
  // Neu geöffnet (oder Fokus lag im alten Inhalt, der jetzt weg ist): Fokus auf die Überschrift
  if (neu || fokusWarDrin) ueberschrift.focus({ preventScroll: true });

  if (panelMitEintrag === panel) {
    beiZuMerken = beiZu || null;
  } else if (istHandy()) {
    history.pushState({ aktionsdeckDetail: true }, '');
    panelMitEintrag = panel;
    beiZuMerken = beiZu || null;
  }
}
