# Schwung-DNA · Fachliche Prüfung und Korrekturen (26.10.2026, zweite Runde)

Alle Tests und Schlussfolgerungen wurden gegen die Quellen geprüft: Adams/Najar (fünf Tests), Adams (Griff ↔ Bewegungstyp),
Doniger/Adams (Armtest), GolfWRX-BioSwing-Artikel (Maße → Ebenen), Schmedes (Hüfttempo → Griff).

## Bestätigt (unverändert)
- Spannweite länger/gleich/kürzer als Körpergröße → vorderer Arm über/auf/unter der Schulterlinie.
- Ellenbogen–mittlerer Knöchel länger/gleich/kürzer als Oberarm → Schulter-/Rumpf-/Hüftzone.
- Armtest: Under = Arm faltet körpernah, On Top = höher; Hüfttempo langsam → schwächer, schnell → stärker.

## Korrigiert
- **Bewegungstyp (Glide/Spin/Launch)** kam bisher nur aus dem Armtest. Nach Adams/Najar entscheiden fünf Tests per Mehrheit
  (Armtest, Post-Test, Hüfttempo, Spannweite, Armmaße). Bei Gleichstand wird kein Typ festgelegt.
- **Post-Test** zählte immer als Bestätigung, auch wenn er in eine andere Richtung zeigte. Jetzt eine eigene Stimme.
- **Griff (Punkt 5):** Zeigen Hüfttempo (vordere Hand) und Armtest (hintere Hand) in entgegengesetzte Richtungen,
  gibt es keine automatische Griffänderung mehr, sondern den Hinweis, den Griff im Termin am Ballflug zu prüfen.
- **Griffanweisung:** statt „mehr/weniger Knöchel als gewohnt“ feste Zielwerte nach Schmedes (etwa 2 bzw. 3–3,5 Knöchel,
  neutral: V zum hinteren Auge). Ist der Zielwert schon erreicht, bleibt der Griff unverändert.
- **Glide-Übungen:** Becken zum Ziel, Kopf und Oberkörper bleiben zurück (vorher glitt der Oberkörper mit).
- **Hüft-Übungen** wollten das Hüfttempo verändern. Jetzt Aufstellungs-Anpassung nach Schmedes, optional nach dem Griffvergleich.
- **Messtoleranz (Punkt 7):** Unterschiede bis 2 cm gelten als nahezu gleich; Anleitung „zweimal messen, Mittelwert eintragen“.
- **Rangfolge (Punkt 6):** Punkte nach Eindeutigkeit (Mehrheit der Tests, Übereinstimmung der Hände, Abstand der Maße);
  Spin als mittlerer Typ höchstens 1 Punkt; Gleichstand wird im Bericht benannt.
- **Quellenlinks** in der App auf die geprüften Artikel aktualisiert.

## Umgesetzt
- Fehler 1–4: Auswahlkarten, Trefferzahlen auf dem Handy, Rangliste, Kleinschreibung; dazu Datumsfeld auf dem Handy.
- Punkt 8: alle Übungen mit Eisen 7; Ausgangswert (10 Bälle) nur, solange noch kein Vergleichspunkt feststeht.
- Punkt 9: eine Hauptübung, Warm-up, höchstens zwei optionale Übungen (vorher bis zu sechs).
- Punkt 10: „Sonderpreis bis …“ = Check-Datum + 1 Monat.
- Tests: 125 Prüfungen bestanden; Massentest über 82.500 Eingabekombinationen ohne Widerspruch.

---

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

## Version 2.8 · Setup nach Hüfttyp

- Neuer Block „Dein Setup nach Hüfttyp“ (Slow, Mid, Fast) mit Griff, V obere und hintere Hand, Ballposition, Abstand und Fußstellung, im Hip-Speed-Schritt, in der Berichtsansicht und im PDF (Seite 5).
- Für Linksspieler gespiegelt, bei uneindeutigem Ergebnis oder Beschwerden ausgeblendet.
- Cache auf schwung-dna-v2-8 erhöht.
- Berufsbezeichnung auf „Master Golf Professional“ geändert (Deckblatt, Fußzeile, Kontakt, App-Kopf). Cache auf schwung-dna-v2-9.
- Bild der drei Bewegungstypen (Glider, Spinner, Launcher, Quelle GOLF.com) auf Seite 4 und in der Berichtsansicht, eigener Typ markiert. Cache auf schwung-dna-v2-10.
- Unter dem Bewegungstypen-Bild steht der eigene Typ in gut lesbarer Schrift; die Kacheln Glide/Spin/Launch sind wieder da. Cache auf schwung-dna-v2-11.
- Texte ohne Annahme eines Folgetermins („So geht es für dich weiter“, Aufgabe zum Ausprobieren); Angebot als Option formuliert. Feste Seitenumbrüche vor Abschnitt 1, 2·3 und Übungen entfernt, damit keine halbleeren Seiten entstehen. Bildhinweis GOLF.com entfernt. Cache auf schwung-dna-v2-12.
- Neuer Ablauf: Profil, Maße, Arm-Pendeltest, Post, Hip-Speed, Video (gewohnter Schwung), Schlagvergleich. Video vor dem Ball: „weicht ab“ schließt den Punkt als Vergleichspunkt aus, „teilweise“ senkt die Priorität. Ansage-Kästen „Sag dem Kunden“ in jedem Testschritt. Ziel-Setup als Orientierung mit Reihenfolge, bei Griffkonflikt ohne Knöchelwerte, im PDF hinter Rückschwung/Abschwung. Griff-Übernahme nur bei Folge-Checks. Warnung, wenn das Ergebnis den Trefferzahlen widerspricht. Cache auf schwung-dna-v2-13.
- Beschwerden als Ja/Nein-Frage (Schmerzen bei Drehbewegungen). Ziel entfernt. Häufigster Fehlschlag wird mit dem Hüfttyp abgeglichen (Hip-Schritt, Video-Hinweis, Seite 1, Ziel-Setup). Cache auf schwung-dna-v2-14.
- Abschnitt „Bewegungsansatz und Griff“ geteilt in 1 „Deine Kraftquelle“ (mit Bild der drei Typen) und 2 „Dein Griff“ (mit Griff-Foto); Rückschwung/Abschwung jetzt 3 · 4. Typen beschreiben die Hauptkraftquelle statt „drehende Bewegung“. Cache auf schwung-dna-v2-15.
- Testübersicht im PDF vor die Kraftquelle gezogen; Ziel-Setup in der App hinter Rückschwung/Abschwung wie im PDF; Mischform heißt „Mehrere Kraftquellen“.
- Einheitliche Schriftgrößen im PDF (17 / 12,5 / 11 / 10,5 / 9,5 / 8 / 7,5). Punkt 3 der Aufgabe und die 5+5-Übung verständlicher (Reihenfolge tauschen an einem anderen Tag). „Foto: HackMotion“ aus den Bildunterschriften entfernt. Rückschwung/Abschwung mit Bildern, Kacheln und Erklärung immer auf einer Seite; Ziel-Setup auf eigener Seite; Griff-Abschnitt wird nie getrennt. Cache auf schwung-dna-v2-16.
- Festigungs-Paket: Sonderpreis „bei Buchung bis …“ und Hinweis, dass die Termine auch im Folgejahr stattfinden können; nur das Buchungsdatum zählt. Cache auf schwung-dna-v2-17.
- Fehlerprüfung v2.17: Tabellen (Videoabgleich, Testübersicht) werden nicht mehr über zwei Seiten getrennt; Kraftquelle und Griff bleiben zusammen, das Bild passt sich dem Platz an; passt die Testübersicht nicht mehr auf Seite 3, steht sie als Zusammenfassung unter dem Ziel-Setup; Notizen, Kontakt und „Wichtiger Hinweis“ bleiben zusammen (keine Seite nur mit dem Hinweis); Warnung am Ball nur noch bei echtem Widerspruch (besser gegen weniger Treffer oder umgekehrt); „Mischform“ heißt einheitlich „mehrere Kraftquellen“. Cache auf schwung-dna-v2-18.
- Auswahl des Vergleichspunkts ausgewogener: Der Griff bekommt nur noch 1 Klarheitspunkt aus dem Hip-Speed-Test allein (2, wenn der Armtest dieselbe Richtung zeigt). Bei Gleichstand entscheidet, wie deutlich der Befund innerhalb seiner Stufe ist, statt der festen Reihenfolge; Spin als neutraler Typ ist dabei nachrangig. Simuliert über 20.000 Kunden: Körperbewegung 18 %, Griff 25 %, Rückschwung 32 %, Abschwung 25 % (vorher Griff bis 61 % bei schneller Hüfte). Cache auf schwung-dna-v2-19.
