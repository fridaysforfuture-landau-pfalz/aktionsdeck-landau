// js/config.js
// Einstellungen der App. Keine PINs, keine Geheimnisse.

// Bei jeder Änderung an der App hochzählen. Gleiche Nummer steht in sw.js.
export const VERSION = '0.28.6';

// Web-App-URL aus Schritt 1.4 (endet auf /exec)
export const API_URL = 'https://script.google.com/macros/s/AKfycbxdAQc32go_QZNAFxeEL89isDW49KTncxkUrEEXUKyDReCZKxChj7B5aPa9wyhy--uf9Q/exec';

// Reiter und Schalter. true = sichtbar.
export const features = {
  start: true,
  material: true,
  todos: true,
  projekte: true,
  posts: true,
  kalender: true,
  hilfe: true,
  fotoUpload: true
};

// Wie oft offene Seiten neu laden (Sekunden)
export const REFRESH_SEKUNDEN = 45;
