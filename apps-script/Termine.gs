// Termine.gs – Öffentliche Termine ohne Login.
// Liefert nur Veranstaltungen mit art = extern und oeffentlich = TRUE, nur kommende, nur aktive Gruppen.
// Wege: POST { aktion:'termine', gruppe:'fff' (freiwillig) }
//       GET  ...?aktion=termine[&gruppe=fff][&format=ics]
// Antwort (Liste): { titel, datum, datum_ende, zeit_von, zeit_bis, ort, beschreibung, veranstalter,
//                    link, gruppe_name, kurzname, farbe }
// Keine IDs, keine Bearbeiter, keine Zeitstempel. Antwort wird kurz zwischengespeichert.

var TERMINE_CACHE_SEK = 120;

function tPad(n) {
  n = String(n);
  return n.length < 2 ? '0' + n : n;
}

// "2026-09-12", "12.09.2026" oder "12.09.26" -> "2026-09-12", sonst ''
function tDatum(s) {
  var t = textVon(s);
  var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})/);
  if (m) {
    var jahr = m[3].length === 2 ? '20' + m[3] : m[3];
    return jahr + '-' + tPad(m[2]) + '-' + tPad(m[1]);
  }
  return '';
}

// "18:30" aus "18:30", "8:05" oder "1899-12-30T18:30:00", sonst ''
function tZeit(s) {
  var m = String(s === undefined || s === null ? '' : s).match(/(\d{1,2}):(\d{2})/);
  return m ? tPad(m[1]) + ':' + m[2] : '';
}

function tFarbe(f) {
  var t = textVon(f);
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : '';
}

// Nur http(s)-Links
function tLink(u) {
  var t = textVon(u);
  return /^https?:\/\/\S+$/i.test(t) ? t : '';
}

// Instagram: ganzer Link oder nur der Name (mit oder ohne @)
function tInstagram(s) {
  var t = textVon(s);
  if (tLink(t)) return t;
  t = t.replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(t) ? 'https://www.instagram.com/' + t : '';
}

// Weitere Links: durch Leerzeichen, Komma oder Zeilenumbruch getrennt, höchstens 5
function tLinks(s) {
  return String(s === undefined || s === null ? '' : s).split(/[\s,]+/)
    .filter(function (x) { return tLink(x) !== ''; }).slice(0, 5);
}

function tHeute() {
  return Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd');
}

// Gruppen-Filter prüfen (nur Kurzname-Zeichen erlaubt)
function termineFilter(p) {
  var k = String((p && p.gruppe) || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{0,30}$/.test(k)) fehler('ungueltig', 'Die Gruppe ist ungültig.');
  return k;
}

function termineListe(kurz) {
  var heute = tHeute();
  var gruppen = {};
  lies('Gruppen').zeilen.forEach(function (g) {
    if (truthy(g.aktiv)) gruppen[String(g.gruppe_id)] = g;
  });
  var t = lies('Veranstaltungen');
  pruefeKopf('Veranstaltungen', t.kopf);

  var liste = [];
  t.zeilen.forEach(function (v) {
    if (truthy(v.geloescht)) return;
    if (String(v.art).trim() !== 'extern' || !truthy(v.oeffentlich)) return;
    var g = gruppen[String(v.gruppe_id)];
    if (!g) return;
    if (kurz && String(g.kurzname).toLowerCase() !== kurz) return;
    var von = tDatum(v.datum);
    if (!von) return;
    var bis = tDatum(v.datum_ende);
    if (!bis || bis < von) bis = von;
    if (bis < heute) return;   // vorbei (mehrtägige bis zum letzten Tag)
    liste.push({
      titel: String(v.titel),
      datum: von,
      datum_ende: bis > von ? bis : '',
      zeit_von: tZeit(v.zeit_von),
      zeit_bis: tZeit(v.zeit_bis),
      ort: String(v.ort),
      beschreibung: String(v.beschreibung),
      veranstalter: String(v.veranstalter),
      link: tLink(v.link),
      gruppe_name: String(g.name),
      kurzname: String(g.kurzname),
      farbe: tFarbe(v.farbe) || tFarbe(g.farbe),
         gruppe_web: tLink(g.webseite),
         gruppe_instagram: tInstagram(g.instagram),
         gruppe_links: tLinks(g.weitere_links)
      });
  });

  liste.sort(function (a, b) {
    if (a.datum !== b.datum) return a.datum < b.datum ? -1 : 1;
    if (a.zeit_von !== b.zeit_von) return a.zeit_von < b.zeit_von ? -1 : 1;
    return a.titel.localeCompare(b.titel);
  });
  return liste;
}

// Für POST (verteile in Code.gs) und GET
// Es gibt nur EINEN Zwischenspeicher-Eintrag (alle Gruppen). Der Gruppenfilter wird danach
// im Speicher angewendet. So kann niemand mit erfundenen Gruppennamen das Sheet überlasten.
function termineAlle() {
  var cache = CacheService.getScriptCache();
  var gespeichert = cache.get('termine_alle');
  if (gespeichert) {
    try { return JSON.parse(gespeichert); } catch (e) { /* neu berechnen */ }
  }
  var liste = termineListe('');
  try { cache.put('termine_alle', JSON.stringify(liste), TERMINE_CACHE_SEK); } catch (e2) { /* zu groß: egal */ }
  return liste;
}

function aktionTermine(p) {
  var kurz = termineFilter(p);
  var alle = termineAlle();
  if (!kurz) return alle;
  return alle.filter(function (t) { return String(t.kurzname).toLowerCase() === kurz; });
}

// ---- GET: JSON oder Kalender-Abo (.ics) ----

function termineGet(p) {
  try {
    var liste = aktionTermine(p);
    if (String(p.format || '').toLowerCase() === 'ics') {
      var kurz = termineFilter(p);
      var name = 'Öffentliche Termine' + (kurz ? ' ' + kurz.toUpperCase() : ' AktionsDeck Landau');
      return ContentService.createTextOutput(termineIcs(liste, name))
        .setMimeType(ContentService.MimeType.ICAL);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, data: liste, error: null }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify(fehlerAntwort(err)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function icsText(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n'); // 12.4: auch ein einzelnes \r
}

// Zeilen länger als 75 Zeichen werden umgebrochen (hier vorsichtig bei 60)
function icsFalten(zeile) {
  if (zeile.length <= 60) return zeile;
  var teile = [zeile.slice(0, 60)];
  for (var i = 60; i < zeile.length; i += 60) teile.push(' ' + zeile.slice(i, i + 60));
  return teile.join('\r\n');
}

// "2026-09-12" plus n Tage als "20260913"
function icsTagPlus(tag, n) {
  var p = tag.split('-').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return Utilities.formatDate(d, 'UTC', 'yyyyMMdd');
}

// Uhrzeit ohne Zeitzone ("schwebend"): zeigt überall die eingetragene Uhrzeit
function icsZeit(tag, zeit, plusMin) {
  var p = tag.split('-').map(Number);
  var z = zeit.split(':').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2], z[0], z[1] + (plusMin || 0)));
  return Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss");
}

function termineIcs(liste, kalenderName) {
  var z = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AktionsDeck Landau//Termine//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsText(kalenderName)
  ];
  var stempel = Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'");

  liste.forEach(function (t) {
    var uid = sha256(t.kurzname + '|' + t.datum + '|' + t.titel + '|' + t.zeit_von).slice(0, 24);
    var beschr = [];
    if (t.beschreibung) beschr.push(t.beschreibung);
    beschr.push('Veranstalter: ' + (t.veranstalter || t.gruppe_name));
    if (t.link) beschr.push(t.link);

    z.push('BEGIN:VEVENT');
    z.push('UID:' + uid + '@aktionsdeck-landau');
    z.push('DTSTAMP:' + stempel);
    if (t.zeit_von && !t.datum_ende) {
      z.push('DTSTART:' + icsZeit(t.datum, t.zeit_von, 0));
      z.push('DTEND:' + (t.zeit_bis && t.zeit_bis > t.zeit_von
        ? icsZeit(t.datum, t.zeit_bis, 0)
        : icsZeit(t.datum, t.zeit_von, 60)));
    } else {
      // ganztägig, mehrtägig bis einschließlich letztem Tag (DTEND ist exklusiv)
      z.push('DTSTART;VALUE=DATE:' + t.datum.replace(/-/g, ''));
      z.push('DTEND;VALUE=DATE:' + icsTagPlus(t.datum_ende || t.datum, 1));
      if (t.zeit_von) {
        beschr.unshift('Uhrzeit: ' + t.zeit_von + (t.zeit_bis ? ' – ' + t.zeit_bis : '') + ' Uhr');
      }
    }
    z.push('SUMMARY:' + icsText(t.titel));
    if (t.ort) z.push('LOCATION:' + icsText(t.ort));
    z.push('DESCRIPTION:' + icsText(beschr.join('\n')));
    if (t.link) z.push('URL:' + t.link);
    z.push('END:VEVENT');
  });

  z.push('END:VCALENDAR');
  return z.map(icsFalten).join('\r\n') + '\r\n';
}

// Im Editor ausführen: zeigt im Ausführungsprotokoll, was öffentlich wäre
function testenTermine() {
  var l = termineListe('');
  Logger.log(l.length + ' öffentliche kommende Termine');
  Logger.log(JSON.stringify(l));
  Logger.log(termineIcs(l, 'Test'));
}
// Im Editor ausführen: prüft, dass die öffentliche Schnittstelle nichts Unerlaubtes herausgibt.
function testenTermineSicher() {
  var erlaubt = ['titel', 'datum', 'datum_ende', 'zeit_von', 'zeit_bis', 'ort', 'beschreibung',
    'veranstalter', 'link', 'gruppe_name', 'kurzname', 'farbe', 'gruppe_web', 'gruppe_instagram', 'gruppe_links'];
  var liste = termineListe('');
  var probleme = 0;

  // 1) Nur erlaubte Felder (keine IDs, Bearbeiter, Zeitstempel)
  liste.forEach(function (t) {
    Object.keys(t).forEach(function (k) {
      if (erlaubt.indexOf(k) < 0) { probleme++; Logger.log('FEHLER: unerlaubtes Feld ' + k); }
    });
  });

  // 2) Zahl der Termine passt zu den Zeilen im Sheet (extern, veröffentlicht, nicht gelöscht, kommend)
  var heute = tHeute();
  var soll = lies('Veranstaltungen').zeilen.filter(function (v) {
    var von = tDatum(v.datum);
    var bis = tDatum(v.datum_ende);
    if (!bis || bis < von) bis = von;
    return !truthy(v.geloescht) && String(v.art).trim() === 'extern' && truthy(v.oeffentlich) &&
      von && bis >= heute;
  }).length;
  Logger.log('Im Sheet passend: ' + soll + ', ausgegeben: ' + liste.length +
    ' (kleiner ist erlaubt, wenn eine Gruppe nicht aktiv ist)');
  if (liste.length > soll) { probleme++; Logger.log('FEHLER: mehr Termine als erlaubt'); }

  // 3) Ungültige Gruppenfilter müssen abgelehnt werden
  ['a b', '../x', 'x;y', 'abc<script>', 'a'.repeat(40)].forEach(function (g) {
    try {
      termineFilter({ gruppe: g });
      probleme++;
      Logger.log('FEHLER: Filter "' + g + '" wurde nicht abgelehnt');
    } catch (e) { /* gewollt */ }
  });

  // 4) Links nur mit http(s)
  ['javascript:alert(1)', 'data:text/html,x', 'ftp://x.de', ' https://ok.de '].forEach(function (u) {
    var r = tLink(u);
    var gut = u.trim().indexOf('https://') === 0;
    if ((r !== '') !== gut) { probleme++; Logger.log('FEHLER: Link falsch bewertet: ' + u); }
  });

  Logger.log(probleme ? ('FERTIG mit ' + probleme + ' Problem(en)') : 'ALLES GUT: keine Probleme gefunden.');
}
