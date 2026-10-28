// Konto.gs – Kontostand von OpenCollective und Cloud-Link der Gruppe (Etappe 11, seit 0.33.0).
// Alles steht in den Skripteigenschaften, nicht im Sheet (Plan Etappe 11, Fassung 2):
//   OC_KONTO_<gruppe_id>     Kurzname des Kontos bei OpenCollective, z. B. OC_KONTO_g1 = klimastreik-landau
//   KONTO_STAND_<gruppe_id>  letzter Stand (vom Skript geschrieben): {"betrag":123.45,"waehrung":"EUR","stand_am":"…","quelle":"…"}
//   CLOUD_LINK_<gruppe_id>   Adresse der Cloud der Gruppe (muss mit https:// beginnen), z. B. CLOUD_LINK_g1
// Gruppen ohne OC_KONTO_… sehen keinen Kontostand, Gruppen ohne CLOUD_LINK_… keinen Reiter Cloud.
// Abgerufen werden nur Kontostand und Währung, keine Buchungen und keine Namen.
//
// Editor: kontoTesten (schreibt nichts), kontoAbrufen (für den Zeitauslöser), kontoAusloeserEinrichten (einmal ausführen).
// Aktionen mit Login: gruppeInfo (Kontostand und Cloud-Link der eigenen Gruppe), kontoAktualisieren (Knopf „Jetzt abrufen“).

var KONTO_URL = 'https://api.opencollective.com/graphql/v2';
var KONTO_PAUSE_MS = 60 * 60 * 1000;   // „Jetzt abrufen“ ruft höchstens einmal pro Stunde wirklich ab
var KONTO_QUELLE = /^[a-z0-9-]{1,60}$/;

function kontoEigenschaft(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

// Kurzname des Kontos der Gruppe oder '' (ungültige Werte zählen als nicht eingerichtet)
function kontoQuelle(gid) {
  var q = String(kontoEigenschaft('OC_KONTO_' + gid) || '').trim().toLowerCase();
  return KONTO_QUELLE.test(q) ? q : '';
}

function kontoGemerkt(gid) {
  var roh = kontoEigenschaft('KONTO_STAND_' + gid);
  if (!roh) return null;
  try {
    var d = JSON.parse(roh);
    return (d && typeof d.betrag === 'number') ? d : null;
  } catch (e) {
    return null;
  }
}

// Fragt OpenCollective (öffentliche Schnittstelle, ohne Schlüssel). Gibt { betrag, waehrung } zurück oder wirft einen Fehler.
function kontoHolen(quelle) {
  var anfrage = {
    query: 'query($slug: String) { account(slug: $slug) { stats { balance { valueInCents currency } } } }',
    variables: { slug: quelle }
  };
  var antwort = UrlFetchApp.fetch(KONTO_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(anfrage),
    muteHttpExceptions: true
  });
  var code = antwort.getResponseCode();
  if (code !== 200) throw new Error('OpenCollective antwortet mit Code ' + code + '.');
  var d = JSON.parse(antwort.getContentText());
  var b = d && d.data && d.data.account && d.data.account.stats && d.data.account.stats.balance;
  if (!b || typeof b.valueInCents !== 'number') {
    var grund = d && d.errors && d.errors[0] && d.errors[0].message ? ' (' + String(d.errors[0].message).slice(0, 120) + ')' : '';
    throw new Error('Kein Kontostand in der Antwort' + grund + '.');
  }
  return { betrag: Math.round(b.valueInCents) / 100, waehrung: String(b.currency || 'EUR').slice(0, 5) };
}

function kontoSpeichern(gid, quelle, wert) {
  var stand = { betrag: wert.betrag, waehrung: wert.waehrung, stand_am: jetzt(), quelle: quelle };
  PropertiesService.getScriptProperties().setProperty('KONTO_STAND_' + gid, JSON.stringify(stand));
  return stand;
}

function kontoFuerApp(stand, quelle) {
  if (!stand) return { quelle: quelle, betrag: null, waehrung: '', stand_am: '' };
  return { quelle: quelle, betrag: stand.betrag, waehrung: stand.waehrung, stand_am: stand.stand_am };
}

function cloudLink(gid) {
  var l = String(kontoEigenschaft('CLOUD_LINK_' + gid) || '').trim();
  return /^https:\/\/[^\s"<>]+$/.test(l) && l.length <= 500 ? l : '';
}

// API "gruppeInfo": nur Angaben der eigenen Gruppe
function aktionGruppeInfo(ctx, p) {
  var quelle = kontoQuelle(ctx.gruppe_id);
  return {
    konto: quelle ? kontoFuerApp(kontoGemerkt(ctx.gruppe_id), quelle) : null,
    cloud_link: cloudLink(ctx.gruppe_id)
  };
}

// API "kontoAktualisieren": ruft ab, wenn der letzte Stand älter als eine Stunde ist
function aktionKontoAktualisieren(ctx, p) {
  var quelle = kontoQuelle(ctx.gruppe_id);
  if (!quelle) fehler('ungueltig', 'Für diese Gruppe ist kein Konto eingerichtet.');
  return mitSperre(function () {
    var alt = kontoGemerkt(ctx.gruppe_id);
    if (alt && alt.stand_am && Date.now() - new Date(alt.stand_am).getTime() < KONTO_PAUSE_MS) {
      return { konto: kontoFuerApp(alt, quelle), frisch: true };
    }
    var wert;
    try {
      wert = kontoHolen(quelle);
    } catch (e) {
      Logger.log('kontoAktualisieren ' + ctx.gruppe_id + ': ' + String(e && e.message ? e.message : e));
      fehler('intern', 'Der Kontostand konnte gerade nicht abgerufen werden. Es bleibt der letzte Stand.');
    }
    var stand = kontoSpeichern(ctx.gruppe_id, quelle, wert);
    protokoll(ctx, 'konto', 'Kontostand', [''], anzeigename(p));
    return { konto: kontoFuerApp(stand, quelle), frisch: false };
  });
}

// Für den Zeitauslöser: alle aktiven Gruppen mit Konto
function kontoAbrufen() {
  lies('Gruppen').zeilen.forEach(function (g) {
    if (!truthy(g.aktiv)) return;
    var quelle = kontoQuelle(g.gruppe_id);
    if (!quelle) return;
    try {
      var stand = kontoSpeichern(g.gruppe_id, quelle, kontoHolen(quelle));
      Logger.log(g.kurzname + ': ' + stand.betrag + ' ' + stand.waehrung);
    } catch (e) {
      Logger.log(g.kurzname + ': FEHLER ' + String(e && e.message ? e.message : e));
    }
  });
}

// Im Editor ausführen: zeigt den Kontostand im Protokoll, schreibt nichts
function kontoTesten() {
  var gefunden = false;
  lies('Gruppen').zeilen.forEach(function (g) {
    if (!truthy(g.aktiv)) return;
    var quelle = kontoQuelle(g.gruppe_id);
    if (!quelle) { Logger.log(g.kurzname + ': kein Konto (OC_KONTO_' + g.gruppe_id + ' fehlt)'); return; }
    gefunden = true;
    try {
      var w = kontoHolen(quelle);
      Logger.log(g.kurzname + ': OK, Kontostand ' + w.betrag + ' ' + w.waehrung + ' (' + quelle + ')');
    } catch (e) {
      Logger.log(g.kurzname + ': FEHLER ' + String(e && e.message ? e.message : e));
    }
    Logger.log(g.kurzname + ': Cloud-Link ' + (cloudLink(g.gruppe_id) ? 'eingerichtet' : 'fehlt'));
  });
  if (!gefunden) Logger.log('Keine Gruppe hat ein Konto. Skripteigenschaft OC_KONTO_<gruppe_id> anlegen, z. B. OC_KONTO_g1 = klimastreik-landau.');
}

// Einmal im Editor ausführen: legt den Auslöser „jeden Montag zwischen 6 und 7 Uhr“ an (kein doppelter)
function kontoAusloeserEinrichten() {
  var schon = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'kontoAbrufen'; });
  if (schon) { Logger.log('Auslöser für kontoAbrufen gibt es schon (unverändert).'); return; }
  ScriptApp.newTrigger('kontoAbrufen').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(6).create();
  Logger.log('Auslöser angelegt: kontoAbrufen jeden Montag zwischen 6 und 7 Uhr.');
}
