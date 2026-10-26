# Schwung-DNA · Korrekturen vom 26.10.2026

Geänderte Dateien (in den Ordner `schwung-dna` des Repositorys hochladen und überschreiben):
`js/app.js`, `js/store.js`, `js/model.js`, `js/pdf.js`, `css/styles.css`, `sw.js`, `tests/check.cjs`

## Fehlerbehebungen
- **Schrittleiste „8 · Bericht“** öffnet jetzt den Bericht statt erneut den Video-Schritt.
- **Leere „Kunde ohne Namen“-Einträge** werden beim Zurückkehren zur Startseite automatisch entfernt (nur, wenn weder Name, E-Mail noch Testeingaben vorhanden sind).
- **Schutz vor Datenverlust:** Die App bittet den Browser um dauerhafte Speicherung, zeigt einen Hinweis, solange sie nicht vom Home-Bildschirm aus läuft, und warnt, wenn die letzte Sicherung fehlt oder älter als 7 Tage ist. Datum der letzten Sicherung steht auf der Startseite.
- **Import:** Vorhandene Kunden und Checks werden ersetzt, wenn die Sicherung einen neueren Stand hat. Einträge mit ungültigen IDs werden übersprungen.
- **E-Mail mit PDF:** Speichert zuerst das PDF und öffnet dann den Mail-Entwurf; Hinweis, das PDF anzuhängen.
- **Kundenseite:** Name und Initialen in der Überschrift ändern sich sofort beim Tippen.
- Teilen- und Mail-Text sprechen den Kunden mit Vornamen an.

## Neu
- **Einwilligung** im Profil-Schritt (Pflicht vor dem ersten Test, mit Datum gespeichert). Auf der Kundenseite sichtbar; bestehende Kunden werden beim nächsten Check gefragt.
- **Wichtiger Hinweis** (keine medizinische Untersuchung, bei Beschwerden abbrechen) am Ende von Web-Bericht und PDF.
- **Bildnachweis** im Bericht und PDF, sobald Beispielbilder vorkommen.
- **Kontakt** mit Telefon/WhatsApp 0171 9045523 im Angebot, in der Signatur und in der PDF-Fußzeile; im Web-Bericht direkt anrufbar bzw. per WhatsApp-Link.
- Kontakt, Hinweistext und Bildnachweis werden zentral in `js/model.js` gepflegt (`CONTACT`, `DISCLAIMER`, `CREDITS`).
- Cache-Version auf `schwung-dna-v2-6` erhöht, damit iPads den neuen Stand laden.
- Tests: 105 Prüfungen bestanden, darunter neue Tests für Import und das Entfernen leerer Kunden.

## Noch offen (nicht im Code lösbar)
- GitHub Pages abschalten und Repository auf „Private“ stellen.
- Nutzungsrecht für die New-Horizons- und HackMotion-Bilder klären oder eigene Bilder einsetzen. Der Bildnachweis ersetzt keine Erlaubnis.
- Alte Dateien im Ordner löschen: `app.js`, `pdf.js`, `rules.js` (Hauptebene von `schwung-dna`) und `ANLEITUNG.txt` (Kopie der README).
