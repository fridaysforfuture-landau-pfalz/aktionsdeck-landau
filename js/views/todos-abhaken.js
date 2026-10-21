// js/views/todos-abhaken.js
// Gemeinsam für Reiter ToDos und Start-Kachel: Abhaken ohne Konfliktprüfung.
// Es ändert nur erledigt, erledigt_am, erledigt_von.

import { api } from '../api.js';
import { getName } from '../store.js';
import { heuteIso } from './todos-rechnen.js';

export function abhakWerte(wert) {
  return wert
    ? { erledigt: true, erledigt_am: heuteIso(), erledigt_von: getName() || 'unbekannt' }
    : { erledigt: false, erledigt_am: '', erledigt_von: '' };
}

// Gibt den neuen Eintrag vom Server zurück (oder null)
export async function abhakenSpeichern(token, id, werte) {
  const r = await api('update', { tabelle: 'ToDos', id: id, daten: werte }, token);
  return r && r.eintrag ? r.eintrag : null;
}
