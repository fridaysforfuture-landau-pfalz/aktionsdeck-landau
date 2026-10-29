// sw.js
// Lädt die App-Hülle vor. Seit 0.34.4: Dateien der App zuerst aus dem Zwischenspeicher (schnelles Öffnen).
// Eine neue Version lädt im Hintergrund und wartet, bis die App „Jetzt neu laden“ schickt (js/app.js).
// Daten der API liegen nicht hier, sondern in IndexedDB (js/cache.js).

const VERSION = '0.34.9';
const CACHE = 'aktionsdeck-' + VERSION;

const HUELLE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'js/config.js',
  'js/app.js',
  'js/api.js',
  'js/store.js',
  'js/darstellung-start.js',
  'js/cache.js',
  'js/gruppeninfo.js',
  'js/schema.js',
  'js/vorlagen.js',
  'js/ui/dom.js',
  'js/ui/toast.js',
  'js/ui/modal.js',
  'js/ui/nav.js',
  'js/ui/table.js',
  'js/ui/detail.js',
  'js/ui/form.js',
  'js/ui/logo.js',
  'js/ui/kopf.js',
  'js/ui/bild.js',
  'js/ui/lightbox.js',
  'js/ui/druck.js',
  'js/ui/darstellung.js',
  'js/ui/fenster.js',
  'js/ui/fokus.js',
  'js/ui/signal.js',
  'js/ui/balken.js',
  'js/ui/kommentare.js',
  'js/ui/neu-seit.js',
  'js/views/gruppen.js',
  'js/views/login.js',
  'js/views/start.js',
  'js/views/erinnerungen-rechnen.js',
  'js/views/mehr.js',
  'js/views/cloud.js',
  'js/views/info.js',
  'js/views/platzhalter.js',
  'js/views/material.js',
  'js/views/material-detail.js',
  'js/views/material-rechnen.js',
  'js/views/material-buchen.js',
  'js/views/material-vormerken.js',
  'js/views/todos.js',
  'js/views/todos-rechnen.js',
  'js/views/todos-abhaken.js',
  'js/views/projekte.js',
  'js/views/uebersicht.js',
  'js/views/uebersicht-rechnen.js',
  'js/views/projekt-rechnen.js',
  'js/views/projekt-todos.js',
  'js/views/projekt-material.js',
  'js/views/projekt-finanzen.js',
  'js/views/projekt-learnings.js',
  'js/views/ideen.js',
  'js/views/start-umfragen.js',
  'js/views/start-brett.js',
  'js/views/kalender-rechnen.js',
  'js/views/kalender.js',
  'js/views/kalender-vorlagen.js',
  'js/views/termine-liste.js',
  'js/views/termine.js',
  'js/views/todos-hut.js',
  'js/kanaele.js',
  'js/views/mobi-rechnen.js',
  'js/views/mobi-eintrag.js',
  'js/views/mobi-plan.js',
  'js/views/mobi.js',
  'js/views/mobi-kachel.js',
  'js/views/mobi-sammlung.js',
  'js/views/mobi-todo.js',
  'js/views/mobi-zeitstrahl.js',
  'js/views/protokoll.js',
  'js/views/protokoll-rechnen.js',
  'js/views/protokoll-eintrag.js',
  'js/views/tops.js',
  'js/views/protokoll-marken.js',
  'js/views/protokoll-vorschlaege.js',
  'js/views/reden.js',
  'js/views/rede-eintrag.js',
  'js/views/projekt-reden.js',
  'js/views/rede-text.js',
  'js/views/team.js',
  'js/views/team-rechnen.js',
  'js/views/team-rollen.js',
  'js/views/team-eintrag.js',
  'js/views/team-berg.js',
  'js/views/team-namen.js',
  'js/views/projekt-team.js',
  'js/wiki-format.js',
  'texte/impressum.txt',
  'texte/info.txt',
  'texte/datenschutz.txt',
  'js/views/wiki.js',
  'js/views/wiki-rechnen.js',
  'js/views/wiki-eintrag.js',
  'js/views/wiki-oeffentlich.js',
  'texte/entwicklung.txt',
  'texte/anleitung/liste.txt',
  'texte/anleitung/team.txt',
  'texte/anleitung/zustaendig.txt',
  'texte/anleitung/neue-gruppe.txt',
  'texte/anleitung/erste-schritte.txt',
  'texte/anleitung/start.txt',
  'texte/anleitung/projekte.txt',
  'texte/anleitung/todos.txt',
  'texte/anleitung/material.txt',
  'texte/anleitung/mobi.txt',
  'texte/anleitung/kalender.txt',
  'texte/anleitung/dokumentation.txt',
  'texte/anleitung/wiki.txt',
  'texte/anleitung/cloud.txt',
  'texte/anleitung/fragen.txt',
  'texte/anleitung/admin.txt',
  'icons/icon.svg',
  'icons/logo.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    // cache: 'reload' = am Browser-Zwischenspeicher vorbei, sonst kämen kurz nach einem Update noch alte Dateien
    caches.open(CACHE).then(function (c) {
      return c.addAll(HUELLE.map(function (u) { return new Request(u, { cache: 'reload' }); }));
    })
  );
});

// Die App schickt "weiter", wenn jemand auf „Jetzt neu laden“ tippt.
self.addEventListener('message', function (event) {
  if (event.data === 'weiter') self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (namen) {
      return Promise.all(namen.filter(function (n) {
        return n.indexOf('aktionsdeck-') === 0 && n !== CACHE;
      }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 12.4: Nur Dateien im Ordner der App (nicht die Hauptwebseite auf derselben Adresse).
  if (req.url.indexOf(self.registration.scope) !== 0) return;
  // 12.4: Gespeichert wird ohne Anhang nach "?" (sonst wächst der Zwischenspeicher mit jedem ?v=…).
  const schluessel = url.origin + url.pathname;

  // 0.34.4: Zuerst Zwischenspeicher. Nur was fehlt, kommt aus dem Netz und wird gemerkt.
  // Nicht im Hintergrund auffrischen: Sonst mischen sich Dateien zweier Versionen.
  event.respondWith(
    caches.open(CACHE).then(function (c) { return c.match(schluessel); }).then(function (treffer) {
      if (treffer) return treffer;
      return fetch(req).then(function (antwort) {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then(function (c) { c.put(schluessel, kopie); });
        }
        return antwort;
      }).catch(function () {
        // 12.4: Die Startseite nur für Seitenaufrufe, nicht für fehlende Skripte oder Bilder.
        if (req.mode === 'navigate') return caches.open(CACHE).then(function (c) { return c.match('index.html'); });
        return Response.error();
      });
    })
  );
});
