// sw.js
// Lädt die App-Hülle vor. Dateien der App: zuerst Netz, sonst Zwischenspeicher.
// Daten der API liegen nicht hier, sondern in IndexedDB (js/cache.js).

const VERSION = '0.31.3';
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
  'js/cache.js',
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
  'js/ui/fenster.js',
  'js/ui/balken.js',
  'js/ui/kommentare.js',
  'js/ui/neu-seit.js',
  'js/views/gruppen.js',
  'js/views/login.js',
  'js/views/start.js',
  'js/views/mehr.js',
  'js/views/info.js',
  'js/views/hilfe.js',
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
  'icons/icon.svg',
  'icons/logo.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(HUELLE); })
      .then(function () { return self.skipWaiting(); })
  );
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
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then(function (antwort) {
      if (antwort.ok) {
        const kopie = antwort.clone();
        caches.open(CACHE).then(function (c) { c.put(req, kopie); });
      }
      return antwort;
    }).catch(function () {
      return caches.match(req).then(function (treffer) {
        return treffer || caches.match('index.html');
      });
    })
  );
});
