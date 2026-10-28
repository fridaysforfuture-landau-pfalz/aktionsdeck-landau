// js/darstellung-start.js
// Dunkelmodus (11.8): läuft als normales Skript im <head>, also bevor die Seite gezeichnet wird.
// So blitzt die App beim Öffnen nicht hell auf. Setzt am <html> die Klasse „dunkel“ und die Farbe der Browserleiste.
// Alles Weitere (Schalter, Wechsel am Gerät) steht in js/ui/darstellung.js. Schlüssel wie in js/store.js.
(function () {
  var wahl = 'geraet';
  try { wahl = localStorage.getItem('aktionsdeck_darstellung') || 'geraet'; } catch (e) { /* ignorieren */ }
  var geraetDunkel = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var dunkel = wahl === 'dunkel' || (wahl !== 'hell' && geraetDunkel);
  if (!dunkel) return;
  document.documentElement.classList.add('dunkel');
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', '#0b0f0e');
})();
