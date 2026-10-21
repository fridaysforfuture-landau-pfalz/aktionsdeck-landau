// js/views/todos-abhaken.js
// Gemeinsam für Reiter ToDos und Start-Kachel: Abhaken ohne Konfliktprüfung.
// Es ändert nur erledigt, erledigt_am, erledigt_von.

import { api } from '../api.js';
import { getName, getSession } from '../store.js';
import { cacheSet } from '../cache.js';
import { toast } from '../ui/toast.js';
import { heuteIso } from './todos-rechnen.js';

export function abhakWerte(wert) {
  return wert
    ? { erledigt: true, erledigt_am: heuteIso(), erledigt_von: getName() || 'unbekannt' }
    : { erledigt: false, erledigt_am: '', erledigt_von: '' };
}

// Gibt den neuen Eintrag vom Server zurück (oder null)
export async function abhakenSpeichern(token, id, werte) {
  const r = await api('update', { tabelle: 'ToDos', id: id, daten: werte }, token);
  const eintrag = r && r.eintrag ? r.eintrag : null;
  if (eintrag && werte.erledigt === true) beitragVorschlagen(token, eintrag);
  return eintrag;
}

// ToDo "Veröffentlichen: …" eines Mobi-Beitrags abgehakt: fragt, ob der Beitrag auch "Veröffentlicht" wird.
// Läuft im Hintergrund. Es wird nie ungefragt geändert.
function beitragVorschlagen(token, t) {
  const mid = String(t.mobi_id || '').trim();
  if (!mid || String(t.text || '').indexOf('Veröffentlichen') !== 0) return;
  setTimeout(async function () {
    try {
      const r = await api('list', { tabelle: 'Mobi_Plan' }, token);
      const b = r.zeilen.find(function (x) { return String(x.id) === mid; });
      if (!b || String(b.status || '').trim() === 'veroeffentlicht') return;
      if (!window.confirm('Den Beitrag „' + String(b.titel) + '“ jetzt auch auf „Veröffentlicht“ setzen?')) return;
      await api('update', { tabelle: 'Mobi_Plan', id: mid, daten: { status: 'veroeffentlicht' } }, token);
      const s = getSession();
      if (s) {
        cacheSet(s.gruppe_id + ':mobi', null);
        cacheSet(s.gruppe_id + ':projekte', null);
      }
      toast('Der Beitrag steht jetzt auf „Veröffentlicht“.');
    } catch (e) { /* ignorieren: der Beitrag lässt sich auch von Hand ändern */ }
  }, 300);
}
