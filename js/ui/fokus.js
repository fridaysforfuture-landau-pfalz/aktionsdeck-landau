// js/ui/fokus.js
// Seit 0.34.8 (Barrierefreiheit): Ist ein Fenster offen (role="dialog" mit aria-modal), bleibt der Fokus darin.
// Tab am Ende springt zum Anfang, Umschalt+Tab am Anfang zum Ende. Rutscht der Fokus trotzdem nach draußen
// (z. B. durch einen Klick daneben), kommt er zurück ins Fenster. Gilt für alle Fenster an einer Stelle.

const FOKUSSIERBAR = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

function offenesFenster() {
  const alle = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
  return alle.length ? alle[alle.length - 1] : null;
}

function ziele(fenster) {
  return Array.prototype.filter.call(fenster.querySelectorAll(FOKUSSIERBAR), function (e) {
    return e.getClientRects().length > 0;
  });
}

export function fokusImFensterHalten() {
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Tab') return;
    const f = offenesFenster();
    if (!f) return;
    const z = ziele(f);
    if (!z.length) { ev.preventDefault(); return; }
    const erstes = z[0];
    const letztes = z[z.length - 1];
    const a = document.activeElement;
    if (ev.shiftKey && (a === erstes || !f.contains(a))) { ev.preventDefault(); letztes.focus(); }
    else if (!ev.shiftKey && (a === letztes || !f.contains(a))) { ev.preventDefault(); erstes.focus(); }
  });
  document.addEventListener('focusin', function (ev) {
    const f = offenesFenster();
    if (!f || f.contains(ev.target)) return;
    const z = ziele(f);
    if (z.length) z[0].focus();
  });
}
