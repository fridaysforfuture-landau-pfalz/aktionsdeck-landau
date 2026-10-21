// js/kanaele.js
// Kanäle für Mobi (fest in der App, wie vorlagen.js). Farben, Zeichengrenzen, Formate.
// Neuer Kanal = eine Zeile in KANAELE. "nur" = nur für diese Gruppen (Kurzname).
// limit = Zeichengrenze (0 = keine Grenze, wird nicht geprüft).

// Status-Reihenfolgen. Gespeichert wird der kleine Wert.
// Standard für alle Kanäle, Video-Reihenfolge für Kanäle mit Video-Schritten (Instagram, TikTok).
export const SCHRITTE_STANDARD = ['idee', 'entwurf', 'review', 'anpassung', 'bereit', 'veroeffentlicht'];
export const SCHRITTE_VIDEO = ['idee', 'entwurf', 'gedreht', 'geschnitten', 'review', 'anpassung', 'bereit', 'veroeffentlicht'];

// Kanalgruppen (Feld "gruppe" je Kanal). Sonstiges steht nicht im Filter.
export const KANALGRUPPEN = [
  { id: 'social', name: 'Social Media' },
  { id: 'digital', name: 'Digital' },
  { id: 'print', name: 'Print' },
  { id: 'extern', name: 'Extern' },
  { id: 'sonstiges', name: 'Sonstiges' }
];

const S = SCHRITTE_STANDARD;
const V = SCHRITTE_VIDEO;

export const KANAELE = [
  { id: 'presse', name: 'Pressemitteilung', farbe: '#6b7280', gruppe: 'digital', limit: 0, schritte: S },
  { id: 'instagram', name: 'Instagram', farbe: '#d6249f', gruppe: 'social', limit: 2200, schritte: V },
  { id: 'facebook', name: 'Facebook', farbe: '#1b5fc1', gruppe: 'social', limit: 5000, schritte: S },
  { id: 'tiktok', name: 'TikTok', farbe: '#1f2937', gruppe: 'social', limit: 2200, schritte: V },
  { id: 'web', name: 'Webseite', farbe: '#0894ad', gruppe: 'digital', limit: 0, schritte: S },
  { id: 'newsletter', name: 'Newsletter', farbe: '#c77c00', gruppe: 'digital', limit: 0, schritte: S },
  { id: 'plakate', name: 'Plakate und Flyer', farbe: '#7a4fb5', gruppe: 'print', limit: 0, schritte: S },
  { id: 'kreide', name: 'Kreideaktion', farbe: '#8a5a2b', gruppe: 'print', limit: 0, schritte: S },
  { id: 'messenger', name: 'WhatsApp und Telegram', farbe: '#2fa142', gruppe: 'digital', limit: 0, schritte: S },
  { id: 'unimail', name: 'Unimail', farbe: '#3949ab', gruppe: 'digital', limit: 0, schritte: S },
  { id: 'gruppen', name: 'Werbung über andere Gruppen', farbe: '#00796b', gruppe: 'extern', limit: 0, schritte: S },
  { id: 'schuldelis', name: 'Schuldelis', farbe: '#b45309', gruppe: 'extern', limit: 0, schritte: S },
  { id: 'foerder', name: 'Mail an Fördermitglieder (Hamburg)', farbe: '#a61e4d', gruppe: 'digital', limit: 0, schritte: S, nur: ['gp'] },
  { id: 'sonstiges', name: 'Sonstiges', farbe: '#596360', gruppe: 'sonstiges', limit: 0, schritte: S }
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

const UNBEKANNT = { id: '', name: '', farbe: '#596360', gruppe: '', limit: 0, schritte: S };

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

// Kanäle einer Kanalgruppe (Name wie "Social Media" oder Kennung wie "social"), nur die dieser Gruppe (Kurzname)
export function kanaeleDerGruppe(gruppeName, kurzname) {
  const g = String(gruppeName || '').trim().toLowerCase();
  const kg = KANALGRUPPEN.find(function (x) { return x.id === g || x.name.toLowerCase() === g; });
  if (!kg) return [];
  return kanaeleFuer(kurzname).filter(function (k) { return k.gruppe === kg.id; });
}
