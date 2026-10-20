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
  var t = String(s === undefined || s === null ? '' : s).trim();
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
  var t = String(f === undefined || f === null ? '' : f).trim();
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : '';
}

// Nur http(s)-Links
function tLink(u) {
  var t = String(u === undefined || u === null ? '' : u).trim();
  return /^https?:\/\/\S+$/i.test(t) ? t : '';
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
      farbe: tFarbe(v.farbe) || tFarbe(g.farbe)
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
function aktionTermine(p) {
  var kurz = termineFilter(p);
  var key = 'termine_' + (kurz || 'alle');
  var cache = CacheService.getScriptCache();
  var gespeichert = cache.get(key);
  if (gespeichert) {
    try { return JSON.parse(gespeichert); } catch (e) { /* neu berechnen */ }
  }
  var liste = termineListe(kurz);
  try { cache.put(key, JSON.stringify(liste), TERMINE_CACHE_SEK); } catch (e2) { /* zu groß: egal */ }
  return liste;
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
    .replace(/\r?\n/g, '\\n');
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
