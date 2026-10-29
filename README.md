# AktionsDeck Landau

Web-App (PWA) für Klima-Gruppen in Landau: Projekte, ToDos, Material, Mobi, Kalender, Dokumentation (Protokolle und Reden), Team und Wiki.

- App: https://fridaysforfuture-landau.de/aktionsdeck-landau/
- Version: 1.0.0 (Oktober 2026). Was in welcher Version dazukam, steht in der App unter Wiki → Entwicklung App (`texte/entwicklung.txt`).
- Lizenz: MIT (`LICENSE`). Andere Gruppen dürfen die App als Grundlage für ein eigenes System nutzen.

## Technik

- Oberfläche: reines HTML, CSS und JavaScript (ES-Module), läuft auf GitHub Pages. Kein Build, keine Pakete.
- Daten: Google Sheet, erreichbar über ein Google Apps Script (Ordner `apps-script/`).
- In diesem Repo stehen keine PINs, Hashes oder Geheimnisse.

## Ordner

- `css/` Gestaltung (`base.css` Farben, `layout.css` Gerüst, `components.css` alles Übrige)
- `js/` Programmcode (`views/` je Reiter, `ui/` Bausteine)
- `icons/` App-Icon und Gruppenlogos
- `texte/` Impressum, Info, Datenschutz, Entwicklung und die Anleitung im Wiki (öffentlich lesbar)
- `apps-script/` Kopie des Google-Skripts
- `docs/` Stand, Regeln und Pläne (`docs/STAND.md`)
