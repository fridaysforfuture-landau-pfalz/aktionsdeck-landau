// js/kanaele.js
// Kanäle für Mobi (fest in der App, wie vorlagen.js). Farben, Zeichengrenzen, Formate.
// Neuer Kanal = eine Zeile in KANAELE. "nur" = nur für diese Gruppen (Kurzname).
// limit = Zeichengrenze (0 = keine Grenze, wird nicht geprüft).

// Status-Reihenfolgen. Gespeichert wird der kleine Wert.
// Standard für alle Kanäle, Video-Reihenfolge für Kanäle mit Video-Schritten (Instagram, TikTok).
export const SCHRITTE_STANDARD = ['idee', 'entwurf', 'review', 'anpassung', 'bereit', 'veroeffentlicht'];
export const SCHRITTE_VIDEO = ['idee', 'entwurf', 'gedreht', 'geschnitten', 'review', 'anpassung', 'bereit', 'veroeffentlicht'];

// Kanalgruppen (Feld "gruppe" je Kanal). Sonstiges steht nicht im Filter.
// farbe = Farbe der Sammel-ToDos dieser Gruppe (js/views/mobi-todo.js)
export const KANALGRUPPEN = [
  { id: 'social', name: 'Social Media', farbe: '#d6249f' },
  { id: 'digital', name: 'Digital', farbe: '#0894ad' },
  { id: 'print', name: 'Print', farbe: '#7a4fb5' },
  { id: 'extern', name: 'Extern', farbe: '#00796b' },
  { id: 'sonstiges', name: 'Sonstiges', farbe: '#596360' }
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
  { id: 'radio', name: 'Radio', farbe: '#e65100', gruppe: 'digital', limit: 0, schritte: S },
  { id: 'gruppen', name: 'Werbung über andere Gruppen', farbe: '#00796b', gruppe: 'extern', limit: 0, schritte: S },
  { id: 'schuldelis', name: 'Schuldelis', farbe: '#b45309', gruppe: 'extern', limit: 0, schritte: S },
  { id: 'foerder', name: 'Mail an Fördermitglieder (Hamburg)', farbe: '#a61e4d', gruppe: 'digital', limit: 0, schritte: S, nur: ['gp'] },
  { id: 'sonstiges', name: 'Sonstiges', farbe: '#596360', gruppe: 'sonstiges', limit: 0, schritte: S }
];

// Standard-Beiträge je Kanal (Kennung aus KANAELE) für „+ Beiträge planen“.
// tage_vorher = so viele Tage VOR dem Bezugsdatum (Aktionsdatum oder Veranstaltungsdatum), negativ = danach.
// Alle Tage sind Platzhalter und leicht änderbar. Nachlesen: docs/MOBI-STANDARD-BEITRAEGE.md (bei Änderung mitpflegen).
// Sonstiges hat keinen Satz: dort gibt die Person einen eigenen Titel ein.
export const STANDARD_BEITRAEGE = {
  instagram: [
    { name: 'Heute Demo', format: 'beitrag', tage_vorher: 0 },
    { name: 'Packliste', format: 'beitrag', tage_vorher: 1 },
    { name: 'Awarenesskonzept', format: 'beitrag', tage_vorher: 5 },
    { name: 'Demosprüche', format: 'beitrag', tage_vorher: 4 },
    { name: 'Reel 1', format: 'reel', tage_vorher: 10 },
    { name: 'Reel 2', format: 'reel', tage_vorher: 7 },
    { name: 'Reel 3', format: 'reel', tage_vorher: 3 },
    { name: 'Thema-Post 1', format: 'beitrag', tage_vorher: 7 },
    { name: 'Thema-Post 2', format: 'beitrag', tage_vorher: 6 },
    { name: 'Thema-Post 3', format: 'beitrag', tage_vorher: 5 },
    { name: 'Thema-Post 4', format: 'beitrag', tage_vorher: 4 },
    { name: 'Thema-Post 5', format: 'beitrag', tage_vorher: 3 },
    { name: 'Thema-Post 6', format: 'beitrag', tage_vorher: 2 },
    { name: 'Story 1', format: 'story', tage_vorher: 3 },
    { name: 'Story 2', format: 'story', tage_vorher: 1 },
    { name: 'Story 3 (am Tag)', format: 'story', tage_vorher: 0 },
    { name: 'Danke-Post', format: 'beitrag', tage_vorher: -1 }
  ],
  presse: [
    { name: 'Pressemitteilung', format: 'text', tage_vorher: 7 },
    { name: 'Pressemitteilung Rückblick', format: 'text', tage_vorher: -1 }
  ],
  plakate: [{ name: 'Plakate und Flyer', format: 'sonstiges', tage_vorher: 14 }],
  kreide: [{ name: 'Kreideaktion', format: 'sonstiges', tage_vorher: 1 }],
  messenger: [
    { name: 'Ankündigung', format: 'text', tage_vorher: 7 },
    { name: 'Erinnerung', format: 'text', tage_vorher: 1 }
  ],
  unimail: [{ name: 'Unimail', format: 'text', tage_vorher: 5 }],
  radio: [{ name: 'O-Ton Radio', format: 'sonstiges', tage_vorher: 3 }],
  newsletter: [{ name: 'Newsletter', format: 'text', tage_vorher: 5 }],
  facebook: [
    { name: 'Veranstaltung', format: 'beitrag', tage_vorher: 10 },
    { name: 'Erinnerung', format: 'beitrag', tage_vorher: 1 }
  ],
  tiktok: [
    { name: 'Video 1', format: 'video', tage_vorher: 7 },
    { name: 'Video 2', format: 'video', tage_vorher: 2 }
  ],
  web: [
    { name: 'Ankündigung auf der Webseite', format: 'text', tage_vorher: 10 },
    { name: 'Rückblick auf der Webseite', format: 'text', tage_vorher: -3 }
  ],
  gruppen: [{ name: 'Anfrage an andere Gruppen', format: 'text', tage_vorher: 10 }],
  schuldelis: [{ name: 'Schuldelis informieren', format: 'text', tage_vorher: 7 }],
  foerder: [{ name: 'Mail an Fördermitglieder', format: 'text', tage_vorher: 5 }]
};

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
