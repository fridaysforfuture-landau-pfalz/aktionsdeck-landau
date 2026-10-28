// Util.gs – kleine Helfer: Zeit, Fehler, Sheet lesen/schreiben, Schutz vor Formeln, Hash.

function jetzt() {
  return Utilities.formatDate(new Date(), 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
}

function fehler(code, text, data) {
  var e = new Error(text);
  e.code = code;
  if (data) e.data = data;
  throw e;
}

function truthy(v) {
  return v === true || String(v).toUpperCase() === 'TRUE';
}

function blatt(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) fehler('intern', 'Tab fehlt im Sheet: ' + name);
  return sh;
}

function kopfLesen(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

// Liest einen ganzen Tab: { sh, kopf, zeilen:[{_zeile, spalte:wert, ...}] }
function lies(name) {
  var sh = blatt(name);
  var werte = sh.getDataRange().getValues();
  var kopf = werte.length ? werte[0].map(String) : [];
  var zeilen = [];
  for (var i = 1; i < werte.length; i++) {
    if (werte[i].join('') === '') continue;
    var o = { _zeile: i + 1 };
    for (var j = 0; j < kopf.length; j++) o[kopf[j]] = aus(werte[i][j]);
    zeilen.push(o);
  }
  return { sh: sh, kopf: kopf, zeilen: zeilen };
}

function sauber(z) {
  var o = {};
  Object.keys(z).forEach(function (k) { if (k !== '_zeile') o[k] = z[k]; });
  return o;
}

function pruefeKopf(tab, kopf) {
  var fehlt = spaltenListe(tab).filter(function (s) { return kopf.indexOf(s) < 0; });
  if (fehlt.length) fehler('intern', 'Spalte fehlt in Tab ' + tab + ': ' + fehlt.join(', '));
}

function anhaengen(sh, arrays) {
  if (!arrays.length) return;
  var start = sh.getLastRow() + 1;
  var ende = start + arrays.length - 1;
  if (ende > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), ende - sh.getMaxRows() + 100);
  sh.getRange(start, 1, arrays.length, arrays[0].length).setValues(arrays);
}

// ---- Werte prüfen und schützen ----

// Beim Lesen: Datum zu Text, Schutz-Hochkomma entfernen
function aus(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  }
  if (typeof v === 'string' && /^'[=+\-@\t\r]/.test(v)) return v.slice(1);
  return v;
}

// Wert auf den Spaltentyp bringen (noch ohne Schutz). tab ist freiwillig (für die Höchstlänge).
function typisieren(v, sp, tab) {
  var typ = spaltenTyp(sp);
  if (v === null || v === undefined) v = '';
  if (typ === 'bool') return v === true || /^(true|1|ja)$/i.test(String(v));
  if (typ === 'zahl') {
    if (String(v).trim() === '') return '';
    var n = Number(String(v).replace(',', '.'));
    // 12.4: isFinite statt isNaN, damit "Infinity" nicht als Zahl gilt; "0x10" ist keine Kommazahl
    if (!isFinite(n) || /^\s*[+\-]?0[xXbBoO]/.test(String(v))) fehler('ungueltig', 'Feld "' + sp + '" muss eine Zahl sein.');
    return n;
  }
  if (typeof v === 'object') fehler('ungueltig', 'Feld "' + sp + '" hat einen ungültigen Wert.');
  var s = String(v);
  var max = tab ? maxLaenge(tab, sp) : MAX_TEXT;
  if (s.length > max) fehler('ungueltig', 'Feld "' + sp + '" ist zu lang (max. ' + max + ' Zeichen).');
  return s;
}

// Beim Schreiben: Texte, die mit = + - @ beginnen, bekommen ein Hochkomma
function schuetzen(v) {
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) return "'" + v;
  return v;
}

// ---- Sicherheit ----

function hex(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function sha256(text) {
  return hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}

function pinHash(salt, pin) {
  return sha256(salt + ':' + pin);
}

function gleich(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function signiere(text) {
  var geheimnis = PropertiesService.getScriptProperties().getProperty('TOKEN_GEHEIMNIS');
  if (!geheimnis) fehler('intern', 'Geheimnis fehlt (wird in Schritt 1.3 gesetzt).');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(text, geheimnis));
}

// Nur eine Änderung gleichzeitig
function mitSperre(fn) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (e) { fehler('beschaeftigt', 'Gerade ist viel los. Bitte gleich noch einmal versuchen.'); }
  try { return fn(); }
  finally {
    merkenVergessen();   // 12.6: Wer schreibt, macht den Zwischenspeicher ungültig
    lock.releaseLock();
  }
}

// ---- 12.6: Zwischenspeicher für gelesene Tabs ----
// Lesen eines Tabs dauert bei Google etwa 0,2 bis 0,35 s, egal wie klein er ist. liesGemerkt merkt sich
// den Inhalt 2 Minuten im Zwischenspeicher des Skripts. Jede Änderung über die App (mitSperre, verteile)
// macht ihn sofort ungültig: Dann gilt ein neuer "Stand", alte Einträge werden nicht mehr gelesen.
// Wer schreibt, liest immer mit lies() (frische Zeilennummern), nie mit liesGemerkt.
// Änderungen direkt im Sheet erscheinen in der App nach höchstens 2 Minuten.
var MERKEN_SEKUNDEN = 120;
var MERKEN_HOECHSTENS = 45000;   // Zeichen je Tab; größere Tabs werden nicht gemerkt (Grenze von Google: 100 KB)
var merkStandJetzt = null;       // einmal je Ausführung gelesen

function merkStand() {
  if (merkStandJetzt === null) {
    try { merkStandJetzt = CacheService.getScriptCache().get('merk_stand') || '0'; }
    catch (e) { merkStandJetzt = '0'; }
  }
  return merkStandJetzt;
}

function merkenVergessen() {
  merkStandJetzt = String(Date.now()) + '_' + Math.floor(Math.random() * 1e6);
  try { CacheService.getScriptCache().put('merk_stand', merkStandJetzt, 21600); } catch (e) { /* dann eben ohne */ }
}

// Wie lies(name), aber nur mit .zeilen (ohne sh und kopf). Nur zum Anzeigen und Prüfen, nie vor dem Schreiben.
function liesGemerkt(name) {
  var cache = null, key = 'merk_' + merkStand() + '_' + name;
  try {
    cache = CacheService.getScriptCache();
    var roh = cache.get(key);
    if (roh) return { zeilen: JSON.parse(roh) };
  } catch (e) { /* frisch lesen */ }
  var t = lies(name);
  try {
    var text = JSON.stringify(t.zeilen);
    if (cache && text.length <= MERKEN_HOECHSTENS) cache.put(key, text, MERKEN_SEKUNDEN);
  } catch (e) { /* nicht schlimm */ }
  return t;
}

function anzeigename(p) {
  // 12.4: Steuerzeichen raus, und vorne keine Zeichen, mit denen eine Formel beginnt (= + - @).
  var n = String((p && p.anzeigename) || '').replace(/[\u0000-\u001f\u007f]/g, ' ');
  n = n.trim().replace(/^[=+\-@\s]+/, '').slice(0, 60).trim();
  return n || 'unbekannt';
}

// Eintrag ins Log (ids = Liste von Datensatz-IDs)
function protokoll(ctx, aktion, tab, ids, anzeige) {
  var zeit = jetzt();
  var arrays = ids.map(function (id) {
    return [zeit, ctx.gruppe_id, aktion, tab, id, schuetzen(anzeige)];
  });
  anhaengen(blatt('Log'), arrays);
}
