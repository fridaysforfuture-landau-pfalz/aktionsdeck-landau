// js/views/wiki-eintrag.js
// Formular „+ Seite“ und „Bearbeiten“ im Reiter Wiki (Etappe 10, seit 0.32.3). Steht im Inhalt, kein Detailbereich.
// Titel, Thema (nur Skillshare, feste Liste), Knöpfe über dem Textfeld (fügen die Auszeichnung an der Cursorstelle ein),
// Textfeld mit Zähler, Vorschau beim Tippen (PC daneben, Handy mit Umschalter „Schreiben | Vorschau“),
// Bild hochladen (mit Hinweis: keine Personen, keine persönlichen Daten), „Öffentlich“ mit Warnsatz, unter „Mehr“ die Adresse.
// Speichern mit Konfliktprüfung (bekannt = geaendert_am). Beim Tippen sichert die App einen Entwurf im Gerät (js/store.js).
//
// zeigeEintrag(box, opt)
// opt: { ctx, token, gruppeId, seite (Zeile aus Wiki oder null = neu), bereich ('skillshare' | 'anleitung'),
//        titel (Vorschlag beim Anlegen), seiten() (alle Seiten der Gruppe), seiteFinden(titel),
//        beiFertig(eintrag), beiAbbruch() }

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';
import { zeigeFenster } from '../ui/fenster.js';
import { verkleinern } from '../ui/bild.js';
import { istWahr } from '../schema.js';
import { getWikiEntwurf, setWikiEntwurf, loescheWikiEntwurf } from '../store.js';
import { zeichneText } from '../wiki-format.js';
import { sichereUrl } from './kalender-rechnen.js';
import { txt, THEMEN, MAX_TITEL, MAX_TEXT, adresseAus, adresseOk, eindeutigeAdresse, findeSeite, standText } from './wiki-rechnen.js';

const WARNUNG_OEFFENTLICH = 'Diese Seite ist dann für alle im Internet lesbar. Schreib keine Namen, Telefonnummern, Adressen oder Fotos von Personen hinein.';
const HINWEIS_BILD = 'Auf dem Bild sind keine Personen und keine persönlichen Daten (zum Beispiel Namen, Adressen, Kennzeichen).';

function uhrzeit(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function kopieren(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
  }
  return Promise.resolve(false);
}

export function zeigeEintrag(box, opt) {
  const z = opt.seite || null;
  const neu = !z;
  const bereich = neu ? opt.bereich : (txt(z.bereich) === 'anleitung' ? 'anleitung' : 'skillshare');
  const bekannt = neu ? '' : txt(z.geaendert_am);
  let adresseVonHand = !neu;
  let entwurfTimer = null;
  let vorschauTimer = null;

  leeren(box);

  // ---- Felder ----
  const titel = el('input', { class: 'feld', type: 'text', maxlength: String(MAX_TITEL), 'aria-label': 'Titel' });
  const thema = el('select', { class: 'feld', 'aria-label': 'Thema' },
    el('option', { value: '', text: 'Thema wählen …' }),
    ...THEMEN.map(function (t) { return el('option', { value: t, text: t }); }));
  const text = el('textarea', { class: 'feld wiki-textfeld', rows: '16', maxlength: String(MAX_TEXT), 'aria-label': 'Text der Seite' });
  const zaehler = el('p', { class: 'leise wiki-zaehler' });
  const oeffentlich = el('input', { type: 'checkbox' });
  const warnung = el('p', { class: 'wiki-warnung', text: WARNUNG_OEFFENTLICH });
  const adresse = el('input', { class: 'feld', type: 'text', maxlength: '60', 'aria-label': 'Adresse für den Link', inputmode: 'url' });
  const vorschau = el('div', { class: 'wiki-vorschau karte', 'aria-live': 'polite' });
  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const konfliktBox = el('div', { class: 'wiki-konflikt' });
  konfliktBox.hidden = true;
  const entwurfBox = el('div', { class: 'wiki-entwurf' });
  entwurfBox.hidden = true;

  function werteSetzen(q) {
    titel.value = txt(q.titel);
    thema.value = THEMEN.indexOf(txt(q.thema)) >= 0 ? txt(q.thema) : '';
    text.value = String(q.text === undefined || q.text === null ? '' : q.text);
    oeffentlich.checked = istWahr(q.oeffentlich) || q.oeffentlich === true;
    adresse.value = txt(q.adresse);
    aktualisieren();
  }

  function werte() {
    return {
      titel: titel.value.trim(), thema: bereich === 'skillshare' ? thema.value : '',
      text: text.value, adresse: adresse.value.trim(), oeffentlich: oeffentlich.checked
    };
  }

  function aktualisieren() {
    zaehler.textContent = text.value.length.toLocaleString('de-DE') + ' / ' + MAX_TEXT.toLocaleString('de-DE') + ' Zeichen';
    warnung.hidden = !oeffentlich.checked;
    vorschauZeichnen();
  }

  function vorschauZeichnen() {
    leeren(vorschau);
    if (!text.value.trim()) {
      vorschau.append(el('p', { class: 'leise', text: 'Hier erscheint die Vorschau.' }));
      return;
    }
    vorschau.append(zeichneText(text.value, { seiteFinden: opt.seiteFinden, inhaltsverzeichnis: true }));
  }

  function entwurfMerken() {
    clearTimeout(entwurfTimer);
    entwurfTimer = setTimeout(function () {
      setWikiEntwurf(opt.gruppeId, neu ? '' : z.id, bereich, werte());
    }, 600);
  }

  function beiEingabe() {
    zaehler.textContent = text.value.length.toLocaleString('de-DE') + ' / ' + MAX_TEXT.toLocaleString('de-DE') + ' Zeichen';
    clearTimeout(vorschauTimer);
    vorschauTimer = setTimeout(vorschauZeichnen, 150);
    entwurfMerken();
  }

  text.addEventListener('input', beiEingabe);
  titel.addEventListener('input', function () {
    if (neu && !adresseVonHand) adresse.value = vorschlagAdresse();
    entwurfMerken();
  });
  thema.addEventListener('change', entwurfMerken);
  adresse.addEventListener('input', function () { adresseVonHand = true; entwurfMerken(); });
  oeffentlich.addEventListener('change', function () { warnung.hidden = !oeffentlich.checked; entwurfMerken(); });

  function vorschlagAdresse() {
    const belegt = opt.seiten().filter(function (x) { return neu || String(x.id) !== String(z.id); })
      .map(function (x) { return txt(x.adresse); });
    return eindeutigeAdresse(adresseAus(titel.value), belegt);
  }

  // ---- Knöpfe über dem Textfeld ----

  // Fügt an der Cursorstelle ein. block = eigene Zeile. platzhalter wird markiert, wenn nichts ausgewählt war.
  function einfuegen(vorne, platzhalter, hinten, block) {
    const a = text.selectionStart;
    const e = text.selectionEnd;
    const wert = text.value;
    const auswahl = wert.slice(a, e);
    const mitte = auswahl || platzhalter;
    let vor = vorne;
    if (block && a > 0 && wert.charAt(a - 1) !== '\n') vor = '\n' + vor;
    let nach = hinten || '';
    if (block && e < wert.length && wert.charAt(e) !== '\n') nach = nach + '\n';
    const neuText = wert.slice(0, a) + vor + mitte + nach + wert.slice(e);
    if (neuText.length > MAX_TEXT) { toast('Der Text ist zu lang.'); return; }
    text.value = neuText;
    text.focus();
    const start = a + vor.length;
    text.setSelectionRange(start, start + mitte.length);
    beiEingabe();
  }

  function linkEinfuegen() {
    const eingabe = window.prompt('Adresse des Links (beginnt mit https://):', 'https://');
    if (eingabe === null) return;
    const url = sichereUrl(eingabe);
    if (!url) { toast('Bitte eine Adresse mit https:// oder http:// eingeben.'); return; }
    einfuegen('[', 'Text des Links', '](' + url + ')', false);
  }

  function bildFenster() {
    if (!navigator.onLine) { toast('Keine Verbindung. Bilder gehen nur mit Verbindung.'); return; }
    const datei = el('input', { type: 'file', accept: 'image/*', class: 'feld', 'aria-label': 'Bild wählen' });
    const beschreibung = el('input', { class: 'feld', type: 'text', maxlength: '120', placeholder: 'Was ist auf dem Bild?', 'aria-label': 'Beschreibung des Bildes' });
    const ok = el('input', { type: 'checkbox' });
    const meldung = el('p', { class: 'fehler', role: 'alert' });
    const los = el('button', { class: 'knopf', type: 'submit', text: 'Hochladen und einfügen' });
    const form = el('form', { class: 'formular', novalidate: '' },
      el('p', { class: 'wiki-warnung', text: 'Bilder liegen im Drive-Ordner der Gruppe und sind für alle lesbar, die den Link kennen.' }),
      el('label', { class: 'formfeld' }, el('span', { text: 'Bild' }), datei),
      el('label', { class: 'formfeld' }, el('span', { text: 'Beschreibung (Pflicht)' }), beschreibung),
      el('label', { class: 'formfeld-bool' }, ok, el('span', { text: HINWEIS_BILD })),
      meldung,
      el('div', { class: 'form-knoepfe' }, los)
    );
    const fenster = zeigeFenster('Bild einfügen', form, null, { aussenKlick: false });
    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      meldung.textContent = '';
      const f = datei.files && datei.files[0];
      const b = beschreibung.value.replace(/[[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!f) { meldung.textContent = 'Bitte ein Bild wählen.'; return; }
      if (!b) { meldung.textContent = 'Bitte kurz beschreiben, was auf dem Bild ist.'; return; }
      if (!ok.checked) { meldung.textContent = 'Bitte bestätigen, dass keine Personen und keine persönlichen Daten auf dem Bild sind.'; return; }
      los.disabled = true;
      los.textContent = 'Lädt hoch …';
      try {
        const bild = await verkleinern(f, 1000, 0.8);
        const r = await api('uploadImage', { bild: bild, mime: 'image/jpeg', zweck: 'wiki' }, opt.token);
        if (!r || !/^[A-Za-z0-9_-]{10,100}$/.test(String(r.foto_id))) throw new Error('Das Bild wurde nicht gespeichert.');
        fenster.schliessen();
        einfuegen('![' + b + '](bild:' + r.foto_id + ')', '', '', true);
        toast('Bild eingefügt.');
      } catch (e) {
        if (opt.ctx.behandleFehler(e)) return;
        meldung.textContent = e.message;
        los.disabled = false;
        los.textContent = 'Hochladen und einfügen';
      }
    });
  }

  const KNOEPFE = [
    ['Ü1', 'Große Überschrift', function () { einfuegen('## ', 'Überschrift 1', '', true); }],
    ['Ü2', 'Kleine Überschrift', function () { einfuegen('### ', 'Überschrift 2', '', true); }],
    ['• Liste', 'Liste', function () { einfuegen('- ', 'Punkt', '', true); }],
    ['1. Liste', 'Nummerierte Liste', function () { einfuegen('1. ', 'Schritt', '', true); }],
    ['F', 'Fett', function () { einfuegen('**', 'fett', '**', false); }],
    ['Link', 'Link mit eigenem Text', linkEinfuegen],
    ['Wiki-Link', 'Link auf eine andere Wiki-Seite', function () { einfuegen('[[', 'Titel der Seite', ']]', false); }],
    ['Hinweis', 'Grauer Hinweiskasten', function () { einfuegen('> ', 'Hinweis', '', true); }],
    ['Bild', 'Bild hochladen und einfügen', bildFenster]
  ];
  const leiste = el('div', { class: 'wiki-werkzeuge', role: 'toolbar', 'aria-label': 'Auszeichnungen einfügen' },
    ...KNOEPFE.map(function (k) {
      return el('button', {
        type: 'button', class: 'knopf knopf-hell knopf-klein', text: k[0], title: k[1], 'aria-label': k[1],
        onmousedown: function (ev) { ev.preventDefault(); },   // Cursor im Textfeld bleibt
        onclick: k[2]
      });
    }));

  const hilfe = el('details', { class: 'wiki-formathilfe' },
    el('summary', { text: 'So geht das Format' }),
    el('ul', null,
      el('li', { text: 'Leerzeile = neuer Absatz' }),
      el('li', { text: '## Überschrift  ·  ### Unterüberschrift' }),
      el('li', { text: '- Punkt = Liste  ·  1. Schritt = nummerierte Liste' }),
      el('li', { text: '**fett**' }),
      el('li', { text: 'Adresse einfach einfügen = Link  ·  [Text](https://…) = Link mit eigenem Text' }),
      el('li', { text: '[[Titel]] = Link auf eine andere Wiki-Seite' }),
      el('li', { text: '> Hinweis = grauer Kasten' }),
      el('li', { text: 'Bild: Knopf „Bild“ (keine Personen, keine persönlichen Daten)' })
    ));

  // Handy: Umschalter Schreiben | Vorschau (am PC stehen beide nebeneinander)
  const schreibenKnopf = el('button', { type: 'button', class: 'wiki-umschalter-knopf aktiv', text: 'Schreiben', 'aria-pressed': 'true' });
  const vorschauKnopf = el('button', { type: 'button', class: 'wiki-umschalter-knopf', text: 'Vorschau', 'aria-pressed': 'false' });
  const schreibTeil = el('div', { class: 'wiki-schreibteil' }, leiste, text, zaehler, hilfe);
  const vorschauTeil = el('div', { class: 'wiki-vorschauteil' }, el('p', { class: 'leise wiki-vorschau-titel', text: 'Vorschau' }), vorschau);
  const flaeche = el('div', { class: 'wiki-schreiben' }, schreibTeil, vorschauTeil);
  function umschalten(aufVorschau) {
    flaeche.classList.toggle('zeigt-vorschau', aufVorschau);
    schreibenKnopf.classList.toggle('aktiv', !aufVorschau);
    vorschauKnopf.classList.toggle('aktiv', aufVorschau);
    schreibenKnopf.setAttribute('aria-pressed', aufVorschau ? 'false' : 'true');
    vorschauKnopf.setAttribute('aria-pressed', aufVorschau ? 'true' : 'false');
    if (aufVorschau) vorschauZeichnen();
  }
  schreibenKnopf.addEventListener('click', function () { umschalten(false); });
  vorschauKnopf.addEventListener('click', function () { umschalten(true); });

  const speichern = el('button', { class: 'knopf', type: 'submit', text: neu ? 'Seite anlegen' : 'Speichern' });
  const abbrechen = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen',
    onclick: function () {
      clearTimeout(entwurfTimer);
      loescheWikiEntwurf(opt.gruppeId);
      opt.beiAbbruch();
    }
  });

  const form = el('form', { class: 'formular wiki-formular', novalidate: '' },
    entwurfBox,
    konfliktBox,
    el('label', { class: 'formfeld' }, el('span', { text: 'Titel' }), titel),
    bereich === 'skillshare' ? el('label', { class: 'formfeld' }, el('span', { text: 'Thema' }), thema) : null,
    el('div', { class: 'wiki-umschalter', role: 'group', 'aria-label': 'Schreiben oder Vorschau' }, schreibenKnopf, vorschauKnopf),
    flaeche,
    el('label', { class: 'formfeld-bool' }, oeffentlich, el('span', { text: 'Öffentlich (für alle im Internet lesbar)' })),
    warnung,
    el('details', { class: 'wiki-mehr' },
      el('summary', { text: 'Mehr' }),
      el('label', { class: 'formfeld' }, el('span', { text: 'Adresse für den öffentlichen Link (a–z, 0–9, Bindestrich)' }), adresse),
      el('p', { class: 'leise', text: 'Die Adresse bleibt gleich, wenn du den Titel änderst. So bleiben geteilte Links gültig.' })
    ),
    fehler,
    el('div', { class: 'form-knoepfe' }, speichern, abbrechen)
  );

  box.append(
    el('h2', { class: 'wiki-titel', text: neu ? (bereich === 'skillshare' ? 'Neue Seite im Skillshare' : 'Neue Seite in der Anleitung') : 'Seite bearbeiten' }),
    form
  );

  // Startwerte, dann einen passenden Entwurf anbieten
  werteSetzen(neu ? { titel: opt.titel || '', thema: '', text: '', adresse: '', oeffentlich: false } : z);
  if (neu) adresse.value = vorschlagAdresse();

  const entwurf = getWikiEntwurf(opt.gruppeId);
  if (entwurf && entwurf.id === (neu ? '' : String(z.id)) && (!neu || entwurf.bereich === bereich)) {
    entwurfBox.hidden = false;
    entwurfBox.append(
      el('p', { text: 'Auf diesem Gerät gibt es einen nicht gespeicherten Entwurf vom ' + uhrzeit(entwurf.zeit) + ' Uhr.' }),
      el('div', { class: 'hut-knoepfe' },
        el('button', {
          type: 'button', class: 'knopf knopf-klein', text: 'Entwurf übernehmen',
          onclick: function () {
            werteSetzen(entwurf.felder);
            adresseVonHand = true;
            entwurfBox.hidden = true;
          }
        }),
        el('button', {
          type: 'button', class: 'knopf knopf-hell knopf-klein', text: 'Verwerfen',
          onclick: function () { loescheWikiEntwurf(opt.gruppeId); entwurfBox.hidden = true; }
        })
      )
    );
  } else if (entwurf) {
    // Entwurf einer anderen Seite: nicht überschreiben, bevor getippt wird
    entwurfBox.hidden = false;
    entwurfBox.append(el('p', { class: 'leise', text: 'Hinweis: Auf diesem Gerät liegt noch ein Entwurf einer anderen Wiki-Seite („' +
      txt(entwurf.felder.titel || 'ohne Titel') + '“). Er wird ersetzt, sobald du hier tippst.' }));
  }

  function konfliktZeigen(aktuell) {
    leeren(konfliktBox);
    konfliktBox.hidden = false;
    konfliktBox.append(
      el('p', { text: (txt(aktuell.geaendert_von) || 'Jemand') + ' hat die Seite am ' + uhrzeit(aktuell.geaendert_am) +
        ' Uhr geändert. Dein Text ist nicht gespeichert und steht noch im Feld.' }),
      el('div', { class: 'hut-knoepfe' },
        el('button', {
          type: 'button', class: 'knopf knopf-hell knopf-klein', text: 'Text kopieren',
          onclick: function () {
            kopieren(text.value).then(function (ok) { toast(ok ? 'Text kopiert.' : 'Kopieren ging nicht. Bitte von Hand markieren.'); });
          }
        }),
        el('button', {
          type: 'button', class: 'knopf knopf-klein', text: 'Neue Fassung laden',
          onclick: function () {
            setWikiEntwurf(opt.gruppeId, z.id, bereich, werte());
            opt.seite = aktuell;
            zeigeEintrag(box, opt);
          }
        })
      ),
      el('p', { class: 'leise', text: 'Mit „Neue Fassung laden“ bleibt dein Text als Entwurf auf diesem Gerät. Du kannst ihn danach übernehmen.' })
    );
    konfliktBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    fehler.textContent = '';
    const d = werte();
    if (!d.titel) { fehler.textContent = 'Bitte einen Titel angeben.'; return; }
    if (bereich === 'skillshare' && !d.thema) { fehler.textContent = 'Bitte ein Thema wählen.'; return; }
    const gleich = findeSeite(opt.seiten().filter(function (x) { return neu || String(x.id) !== String(z.id); }), d.titel);
    if (gleich) { fehler.textContent = 'Eine Seite mit diesem Titel gibt es schon.'; return; }
    if (!d.adresse) d.adresse = vorschlagAdresse();
    if (!adresseOk(d.adresse)) { fehler.textContent = 'Die Adresse darf nur kleine Buchstaben a–z, Ziffern und Bindestriche haben (unter „Mehr“).'; return; }
    if (d.text.length > MAX_TEXT) { fehler.textContent = 'Der Text ist zu lang.'; return; }
    if (!navigator.onLine) { fehler.textContent = 'Keine Verbindung. Speichern geht nur mit Verbindung. Dein Text bleibt als Entwurf auf diesem Gerät.'; return; }
    clearTimeout(entwurfTimer);
    setWikiEntwurf(opt.gruppeId, neu ? '' : z.id, bereich, d);
    speichern.disabled = true;
    try {
      let eintrag;
      if (neu) {
        eintrag = await api('create', { tabelle: 'Wiki', daten: Object.assign({ bereich: bereich }, d) }, opt.token);
      } else {
        const r = await api('update', { tabelle: 'Wiki', id: z.id, bekannt: bekannt, daten: d }, opt.token);
        eintrag = r.eintrag;
      }
      loescheWikiEntwurf(opt.gruppeId);
      toast(neu ? 'Seite angelegt.' : 'Gespeichert.');
      opt.beiFertig(eintrag);
    } catch (e) {
      speichern.disabled = false;
      if (opt.ctx.behandleFehler(e)) return;
      // Kein Überschreiben: bekannt bleibt alt, bis „Neue Fassung laden“ gewählt wird
      if (e.code === 'konflikt' && e.data && e.data.aktuell) {
        konfliktZeigen(e.data.aktuell);
        return;
      }
      fehler.textContent = e.code === 'nicht_gefunden' ? 'Die Seite gibt es nicht mehr (vielleicht gelöscht). Dein Text bleibt als Entwurf.' : e.message;
    }
  });

  if (!neu) {
    box.append(el('p', { class: 'leise', text: 'Zuletzt geändert am ' + standText(z.geaendert_am) + (txt(z.geaendert_von) ? ' von ' + txt(z.geaendert_von) : '') + '.' }));
  }
  titel.focus();
}
