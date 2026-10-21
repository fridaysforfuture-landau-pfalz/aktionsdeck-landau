// js/kanaele.js
// Kanäle für Mobi (fest in der App, wie vorlagen.js). Farben, Zeichengrenzen, Formate.
// Neuer Kanal = eine Zeile in KANAELE. "nur" = nur für diese Gruppen (Kurzname).
// limit = Zeichengrenze (0 = keine Grenze, wird nicht geprüft).

export const KANAELE = [
  { id: 'presse', name: 'Pressemitteilung', farbe: '#6b7280', bereich: 'Presse', limit: 0 },
  { id: 'instagram', name: 'Instagram', farbe: '#d6249f', bereich: 'Social Media', limit: 2200 },
  { id: 'facebook', name: 'Facebook', farbe: '#1b5fc1', bereich: 'Social Media', limit: 5000 },
  { id: 'tiktok', name: 'TikTok', farbe: '#1f2937', bereich: 'Social Media', limit: 2200 },
  { id: 'web', name: 'Webseite', farbe: '#0894ad', bereich: 'Web', limit: 0 },
  { id: 'newsletter', name: 'Newsletter', farbe: '#c77c00', bereich: 'Web', limit: 0 },
  { id: 'plakate', name: 'Plakate und Flyer', farbe: '#7a4fb5', bereich: 'Print', limit: 0 },
  { id: 'kreide', name: 'Kreideaktion', farbe: '#8a5a2b', bereich: 'Print', limit: 0 },
  { id: 'messenger', name: 'WhatsApp und Telegram', farbe: '#2fa142', bereich: 'Direkt', limit: 0 },
  { id: 'unimail', name: 'Unimail', farbe: '#3949ab', bereich: 'Direkt', limit: 0 },
  { id: 'gruppen', name: 'Werbung über andere Gruppen', farbe: '#00796b', bereich: 'Direkt', limit: 0 },
  { id: 'schuldelis', name: 'Schuldelis', farbe: '#b45309', bereich: 'Direkt', limit: 0 },
  { id: 'foerder', name: 'Mail an Fördermitglieder (Hamburg)', farbe: '#a61e4d', bereich: 'Direkt', limit: 0, nur: ['gp'] },
  { id: 'sonstiges', name: 'Sonstiges', farbe: '#596360', bereich: 'Sonstiges', limit: 0 }
];

export const FORMAT_TEXT = {
  beitrag: 'Beitrag',
  reel: 'Reel',
  story: 'Story',
  video: 'Video',
  text: 'Text',
  sonstiges: 'Sonstiges'
};

export const FORMAT_HINWEIS = {
  beitrag: 'Bildformat: Hochformat 4:5 (1080 × 1350 px) oder quadratisch.',
  reel: 'Video im Hochformat 9:16 (1080 × 1920 px).',
  story: 'Hochformat 9:16 (1080 × 1920 px). Eine Story ist 24 Stunden sichtbar.',
  video: 'Querformat 16:9 oder Hochformat 9:16.',
  text: '',
  sonstiges: ''
};

const UNBEKANNT = { id: '', name: '', farbe: '#596360', bereich: '', limit: 0 };

// Kanäle, die diese Gruppe nutzt (Kurzname wie "fff")
export function kanaeleFuer(kurzname) {
  const k = String(kurzname || '').toLowerCase();
  return KANAELE.filter(function (x) { return !x.nur || x.nur.indexOf(k) >= 0; });
}

// Infos zu einem Kanalnamen. Unbekannte Namen bekommen Grau.
export function kanalInfo(name) {
  const n = String(name || '').trim().toLowerCase();
  const k = KANAELE.find(function (x) { return x.name.toLowerCase() === n; });
  return k || Object.assign({}, UNBEKANNT, { name: String(name || '').trim() });
}

// Gespeichert im Projekt (Spalte kanaele) als Text: "instagram=h,facebook=z"
// h = Hauptkanal, z = Zusatzkanal. Gibt { instagram: 'h', ... } zurück.
export function leseKanaele(text) {
  const m = {};
  String(text || '').split(',').forEach(function (t) {
    const p = t.split('=');
    const id = (p[0] || '').trim();
    const w = (p[1] || '').trim();
    if (id && (w === 'h' || w === 'z')) m[id] = w;
  });
  return m;
}

export function schreibeKanaele(m) {
  return Object.keys(m).filter(function (id) { return m[id] === 'h' || m[id] === 'z'; })
    .map(function (id) { return id + '=' + m[id]; }).join(',');
}
