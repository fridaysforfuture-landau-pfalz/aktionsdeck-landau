// Signal.gs – Signal-Link für Hilfe, ohne Login (seit 0.33.13, Schritt 11.11).
// Der Link steht nicht im Repo, sondern als Skripteigenschaft SIGNAL_LINK.
// Das Skript gibt ihn erst heraus, wenn eine kleine Rechenaufgabe richtig gelöst ist.
// Wege: POST { aktion:'signal' }                         -> { aufgabe:'3 + 4', schluessel }
//       POST { aktion:'signal', schluessel, antwort:'7' } -> { link } oder Fehler 'falsch'
// Die Aufgabe merkt sich das Skript nicht: Der Schlüssel enthält den Ablauf und eine Signatur
// (mit dem Token-Geheimnis). Ein Schlüssel gilt 10 Minuten.

var SIGNAL_GUELTIG_MS = 10 * 60 * 1000;

function signalZufall(von, bis) {
  return von + Math.floor(Math.random() * (bis - von + 1));
}

function aktionSignal(p) {
  var link = String(PropertiesService.getScriptProperties().getProperty('SIGNAL_LINK') || '').trim();
  if (!/^https:\/\/\S+$/i.test(link)) fehler('fehlt', 'Der Signal-Link ist noch nicht eingetragen.');

  // Ohne Antwort: neue Aufgabe
  if (p.antwort === undefined || p.antwort === null || p.antwort === '') {
    var a = signalZufall(2, 9);
    var b = signalZufall(2, 9);
    var ablauf = String(Date.now() + SIGNAL_GUELTIG_MS);
    return {
      aufgabe: a + ' + ' + b,
      schluessel: ablauf + '.' + signiere('signal|' + ablauf + '|' + (a + b))
    };
  }

  // Mit Antwort: prüfen
  var teile = String(p.schluessel || '').split('.');
  var antwort = String(p.antwort).trim();
  if (teile.length !== 2 || !/^\d{13}$/.test(teile[0]) || !/^\d{1,2}$/.test(antwort)) {
    fehler('ungueltig', 'Die Aufgabe ist ungültig. Bitte neu laden.');
  }
  if (Number(teile[0]) < Date.now()) fehler('abgelaufen', 'Die Aufgabe ist abgelaufen. Hier ist eine neue.');
  if (!gleich(signiere('signal|' + teile[0] + '|' + Number(antwort)), teile[1])) {
    fehler('falsch', 'Leider falsch. Hier ist eine neue Aufgabe.');
  }
  return { link: link };
}
