# Golf Schwung-DNA · Matthias Berger

Statische Web-App für den 20-Minuten-Bio-Swing-Screening auf dem iPad. Läuft komplett im Browser, ohne Server und ohne Build-Schritt.

## Neu in Version 2

- **Geführter Ablauf** in sechs Schritten mit Fortschrittsanzeige, großen Auswahlkarten statt Dropdowns, Testanleitung zum Aufklappen, Live-Auswertung und einem 20-Minuten-Timer.
- **Kundenverwaltung:** Kunden und alle bisherigen Checks werden automatisch auf dem Gerät gespeichert. Körpermaße werden beim nächsten Check übernommen. Verlaufsdiagramm der Schlagvergleiche pro Kunde.
- **Trefferzahlen im Termin erfassen** (gewohnt / Vergleich von je fünf Bällen, Bewegungsgefühl) mit automatischer Auswertung und Vorschlag für das Ergebnis.
- **Video-Abgleich (optional, Schritt 7):** Hüfte, Rückschwung- und Abschwungebene aus 1–2 Videos mit bestätigt / teilweise / weicht ab abgleichen; erscheint im Bericht als eigener Abschnitt.
- **Ausgangslage:** Ziel und häufigster Fehlschlag im Profil, erscheinen auf Seite 1.
- **Reicherer Bericht:** Profil auf einen Blick, Testübersicht, Grafiken zu Bewegungstyp, oberstem Punkt und Abschwungzone, Übungsbibliothek (40 Übungen) und Festigungs-Angebot (3 Termine à 50 Minuten, 199 €).
- **Neues PDF:** mehrseitiger A4-Bericht mit Deckblatt und echtem Text (scharf, durchsuchbar, kopierbar) statt eines Bildes. Download, Teilen/Mail über das iPad-Menü und Drucken.
- **Sicherung:** Export und Import aller Daten als Datei.
- **Offline-fähig** nach dem ersten Laden (Service Worker).

## Daten und Datenschutz

Name, E-Mail, Beschwerden und Testergebnisse werden im Browser dieses Geräts gespeichert (localStorage), nicht auf einem Server. Das schließt gesundheitsbezogene Angaben ein. Empfehlung: Gerätesperre aktivieren, Einwilligung der Kunden einholen, Sicherungsdateien geschützt aufbewahren. Beim Löschen der Safari-Website-Daten gehen die gespeicherten Kunden verloren; deshalb regelmäßig auf der Startseite „Sicherung herunterladen“ nutzen. Im privaten Modus speichert Safari nicht dauerhaft; die App weist dann darauf hin.

## Installation im bestehenden Repository

Diese App liegt im Unterordner `schwung-dna` des Repositorys `matthiasberger5/aps-coaching` und wird unter `/schwung-dna/` geöffnet. Die APS-Startseite bleibt unverändert.

1. Im Repository den Inhalt des Ordners `schwung-dna` ersetzen: die alten Dateien `app.js`, `pdf.js`, `rules.js` und `index.html` entfallen bzw. werden überschrieben. Neu sind die Ordner `css`, `js` und `lib` sowie `sw.js`.
2. Den gesamten Inhalt dieses Pakets in den Ordner `schwung-dna` hochladen (nicht die ZIP-Datei selbst).
3. Cloudflare Pages baut bei jedem Commit auf `main` automatisch neu. Einstellungen unverändert: Framework preset `None`, Build command `exit 0`, Build output directory `.`.
4. In Safari öffnen, ggf. Teilen → Zum Home-Bildschirm. Danach einmal online laden, damit der Offline-Betrieb aktiv wird.
5. Mit Testdaten PDF herunterladen, in Dateien öffnen und Teilen → Mail prüfen.

Nach Änderungen am Code in `sw.js` die Zeile `const CACHE='schwung-dna-v2-1'` hochzählen, damit Geräte den neuen Stand laden.

## Dateien

- `index.html` · Seitenrahmen
- `css/styles.css` · Gestaltung (iPad, Handy, Druck)
- `js/app.js` · Oberfläche, Kunden, Ablauf, Bericht
- `js/rules.js` · fachliche Regeln (unverändert aus Version 1)
- `js/model.js` · Berichtsmodell, Angebot (`OFFER`: Name, Termine, Preis), Testübersicht
- `js/drills.js` · Übungsbibliothek
- `js/store.js` · lokale Speicherung, Export/Import
- `js/charts.js` · Grafiken für Bildschirm
- `js/pdf.js` · PDF-Erzeugung (nutzt `lib/pdf-lib.min.js`, MIT-Lizenz)
- `sw.js` · Offline-Betrieb
- `tests/check.cjs` · automatische Prüfung

## Prüfung

Optional mit Node.js: `node tests/check.cjs` im Projektordner. Geprüft werden Regeln, alle 3.125 Kombinationen aus Armtest, Hip-Test, Vergleichspunkt, Ergebnis und Maßen (jede liefert gültige Übungen und Plan), Speicherung samt Export/Import und die PDF-Erzeugung für elf Sonderfälle (Beschwerden, offene Tests, Linksspieler, Sonderzeichen, lange Namen und Notizen). Die erzeugten PDFs liegen danach im Ordner `tmp-pdfs` neben dem Projekt.

## Vier Testblöcke, drei Kundenergebnisse

Die Maske führt in der vom Trainer gewünschten Reihenfolge durch:
1. Arm-Pendeltest: Golfhaltung, Handflächen zusammen, hintere Hand etwas tiefer, ruhige Schultern, Stopp etwa Hüfthöhe. Erfasst wird die Richtung der hinteren Handfläche. Daraus folgen hinterer Griffansatz und vorläufige Rückschwungführung.
2. Körperproportionen: Körpergröße, Spannweite, Oberarm und Ellenbogen–Fingerknöchel. Daraus folgen oberste Armposition und Abschwungzone.
3. Post-/Pivot-Test: Schläger quer an die Oberschenkel, Rückschwung drehen, Beckenbewegung beobachten. Zusätzlich kann subjektives Druckempfinden erfasst werden; keine Druckmessung.
4. Hip-Speed-Test: stabiles Golfbag und gepolsterte hintere Hand, kontrollierte Armbewegung zur Bagseite, Treffposition halten, Ferse und Hüft-/Rumpfabstimmung prüfen. Daraus folgt ein Griffvergleich für die vordere Hand.
5. Schlagvergleich: fünf Bälle gewohnt und fünf mit einer einzelnen Änderung. Die App schlägt einen Vergleichspunkt automatisch vor; der Trainer kann diesen ändern. Das tatsächlich beobachtete Ergebnis wird ausgewählt.

Jeder Schritt zeigt Ausgangsposition, Durchführung, Beobachtung und eine automatische Kurz-Auswertung. Hauptdaten: vier Maße, Arm-/Post-/Hip-Beobachtung sowie Punkt und Ergebnis des Schlagvergleichs. Name, Datum, Spielseite und Beschwerden ergänzen das Profil. Eine freie Kunden-Notiz ist optional. Der bestätigte vordere Griff kann optional erfasst werden. Die Zusatzfelder für Dynamik-/Kraftmessungen sind entfernt.

Der Ablauf wird aus den angegebenen öffentlichen Lehrbeispielen zusammengestellt. Er ist keine offizielle vollständige Zertifizierungsunterlage; zusätzliche BSD-Faktoren und die fachgerechte praktische Testdurchführung sind damit nicht vollständig abgebildet.

Planung für 20 Minuten: 1 Minute Vorbereitung, 3 Minuten Armtest, 4 Minuten Vermessung, 3 Minuten Post, 3 Minuten Hip-Speed und 6 Minuten Schlagvergleich/Bericht. Eigene Zeitplanung, keine offizielle Dauer.

Der Kundenreport besteht aus drei Bereichen:
1. Bewegungsansatz, beide Griffansätze, Drehachse und Hüftabstimmung.
2. Vorläufige Rückschwungführung aus dem Armtest und separat die vordere Armposition am höchsten Punkt aus den Proportionen.
3. Abschwungzone, unabhängig von der Rückschwungposition.

Vor den drei Detailbereichen stehen die erste Aufgabe, drei konkrete Übungsschritte und die Entscheidung nach dem Vergleich. Eine kleine Tabelle hält Datum, Trefferzahlen (gewohnt / Vergleich, jeweils von fünf) und das Bewegungsgefühl aus zwei Einheiten fest. Die Felder bleiben zum Eintragen frei. Am Ende steht der Prüfschritt für den Folgetermin. Es gibt fünf Zustände: günstiger Vergleich, Vergleich noch nicht bestätigt/uneindeutig/gleich, ungünstiger Vergleich, offener Ansatz und Beschwerden. Nur ein Punkt wird gleichzeitig verändert. Auch ein günstiger Kurzvergleich ist noch kein Beleg für einen langfristigen Vorteil.

Der erste Vergleichspunkt wird als eigene Arbeitsregel nach Klarheit gewählt: Alle vier Punkte (Körperbewegung, Griff, Rückschwungführung, Abschwungzone) erhalten 0–3 Klarheitspunkte, der eindeutigste steht vorn, die übrigen sind Themen für spätere Termine. Bei Gleichstand gilt Körperbewegung > Griff > Rückschwung > Abschwung. Das Angebot (3 Termine à 50 Minuten, 199 €) ist in js/model.js (`OFFER`) änderbar. Eine explizite Auswahl des Trainers hat Vorrang. Diese Reihenfolge ist keine offizielle BSD-Prioritätsregel.

Der Grifftext erklärt eine kleine Veränderung der vorderen Hand über mehr/weniger sichtbare Fingerknöchel, bei unveränderter Schlagfläche und hinterer Hand. Die neutrale Stellung wird nicht mit einer universellen Knöchelzahl oder einem erfundenen Winkel berechnet. Zwei kurze Einheiten mit jeweils fünf gewohnten und fünf Vergleichsschlägen sind eine eigene Übungsplanung. Übernahme nur bei mehr sauberen Treffern in beiden Einheiten und mindestens ebenso angenehmem Gefühl; sonst gewohnt weiterspielen.

## Messung und Regeln

Spannweite: Mittelfingerspitze bis Mittelfingerspitze, Arme seitlich auf Schulterhöhe gestreckt. Alte Daumen–Daumen-Werte neu messen. Armmaß: Ellenbogen bis mittlerer Fingerknöchel; Oberarm: Ellenbogen bis Schultergelenk.

Die Ebenenregeln sind in rules.js hinterlegt. Gleichheit wird als mittlerer Modellansatz eingeordnet. Kleine ungleiche Differenzen bis einschließlich 1 cm führen zu einem offenen Ergebnis und einer erneuten Messung. Dieser Arbeitsbereich ist eine eigene Vorsichtsregel; kein als offiziell bestätigter BSD-Grenzwert. Ein konkreter Top-Track wird nur bei eindeutigem Verhältnis hervorgehoben.

Der Hand-/Armtest liefert einen vorläufigen Bewegungsansatz. Zusätzliche Dynamik-/Kraftmessungs-Auswahlen sind nicht mehr Teil der Maske. Ein ungünstiger Schlagvergleich führt zu keiner Änderungsaufgabe. Die Zuordnung zur hinteren Hand folgt Mike Adams' öffentlich wiedergegebenem Lehrbeispiel. Sie weist keine dominante Boden-Kraftquelle nach. Es werden keine Bodenkräfte, Leistungsanteile oder Bewegungsprozente gemessen. Die Drehachse ist nicht die Gewichtsverteilung im Treffmoment. Hip-Differential beschreibt Hüftöffnung und die relative Arm-/Rumpfabstimmung; daraus wird kein Krafttyp berechnet. Das Hüft-Differential liefert einen vorläufigen Vergleichsvorschlag für die vordere Hand (Slow schwächer, Mid neutral, Fast stärker), sofern kein geprüfter Griff erfasst wurde. Dieser Zusammenhang folgt dem Lehrmodell von Bill Schmedes III und ist keine universell belegte BSD-Zwangsregel. Ein erfasster Griffvergleich hat Vorrang. Der ruhige Arm-Pendeltest ersetzt die frühere zusätzliche Arm-Hängetest-Auswahl. Under, Side On und On Top liefern vereinfachte Rückschwungansätze (flach/körpernah, mittel, höher). On-Top-Ausnahmen aufgrund anderer Körpermerkmale bleiben ausdrücklich möglich. Kein exakter Griffwinkel wird berechnet.

Der Armtest-Griffhinweis bezieht sich auf die hintere Hand. Die vordere Hand folgt einem eigenen Vergleich aus dem Hip-Speed-Test oder einem tatsächlich bestätigten Griffvergleich. Stärker/schwächer bedeutet Handstellung, nicht Griffdruck.

Bei Beschwerden entsteht keine automatische Änderungsaufgabe. Bei Linksspielern gilt der Text für vordere/hintere Hand entsprechend; die Griff-Nahaufnahme wird für Linksspieler in der Anzeige gespiegelt. Die übrigen Fotos zeigen Rechtsspieler.

## Bilder und Quellen

Der Bericht verwendet Originale von E.A. Tischler / New Horizons Golf Approach, unverändert mit einer zusätzlichen Auswahlmarkierung im Rückschwungvergleich:
- swing_path_under_sequence1a, swing_path_side-on_seqjuence1a und swing_path_on-top_sequence1a: automatisch ausgewählte Bildfolge zur hinteren Arm-/Handausrichtung in Abschnitt 1. Diese Bilder zeigen Armbewegungen, keine Nahaufnahme des Zweihandgriffs.
- Swing_Track_3_topsets4: alle drei obersten Rückschwungpositionen im Vergleich.
- slotting_-down_RDL_2: hüftnahe Abschwungzone.
- slotting_-cross_RDL_2: rumpfnahe Abschwungzone.
- slotting_-shoulder_RDL_2: höhere Abschwungzone.

Bei einem vorliegenden Vorschlag für die vordere Hand zeigt Abschnitt 1 eine passende Griff-Nahaufnahme (schwächer, neutral oder stärker) von HackMotion. Sie dient als Orientierung für die sichtbaren Knöchel der vorderen Hand; die hintere Hand wird dabei nicht übernommen. Die Originaldatei bleibt unverändert, die Darstellung wählt einen passenden Ausschnitt. Quelle: https://hackmotion.com/strong-vs-weak-grip-in-golf/; Bild und Herkunft stehen in assets/grip/SOURCES.json. Ohne diesen Vorschlag wird die Arm-/Hand-Bildfolge aus dem Armtest gewählt; die Abschwungzonen in Abschnitt 3 aus den Armmaßen. Ihre Bildunterschriften erklären die jeweils dargestellte Beziehung. Bei offenen Tests oder Beschwerden wird kein passendes Ergebnisbild behauptet. Die Bilddateien liegen austauschbar in assets/new-horizons/. Original-URLs und Urheberangabe stehen in SOURCES.json und im Report. Eine Freigabe zur kommerziellen Weitergabe wurde hier nicht festgestellt.

Quellen:
- Griffstärke erklärt (Christy Longfield): https://golf.com/instruction/weak-grip-strong-grip-explainer-play-smart/
- Arm-Pendeltest (Doniger, unter Berufung auf Mike Adams): https://golf.com/instruction/grip-golf-club-test-can-tell-you/
- Armfaltung und Rückschwungführung (Sal Spallone): https://appmesolutions.wixsite.com/vero-golf-pro/bioswing-dynamics-certification-exam
- Post-/Pivot-Durchführung (Mike Adams und Bernie Najar): https://golf.com/instruction/five-easy-tests-to-gain-at-least-20-yards-with-your-driver/
- Ebenen und Messung: https://www.advanceddynamicgolfcenter.com/post/what-is-bio-swing-mechanics
- Mike Adams' Lehrbeispiel zu hinterer Hand und Bewegungsansatz, in diesem Beitrag mit Zitaten und Originalvideo: https://golf.com/instruction/hall-of-fame-teacher-3-thoughts-3-golfers/
- Originalvideo: https://www.instagram.com/tv/CUuUEsDgwnq/ (der direkte Abruf war nicht verfügbar; das Lehrbeispiel wurde anhand der im Artikel wiedergegebenen Aussagen geprüft).
- Hüft-/Griffvergleich: https://golfwrx.com/205319/measure-your-hip-speed-to-determine-your-proper-setup/
- Begriffe und Originalbilder des Mitbegründers E.A. Tischler: https://newhorizonsgolf.com/BioSwingDynamics.html

Das bleibt ein vorläufiges Coaching-Modell. Keine bestätigte Berechnung des einzig richtigen oder biomechanisch zwingend normalen Schwungs und keine behauptete vollständige Implementierung von Phil Allens Originalunterlage.

## Hinweise

Das bleibt ein vorläufiges Coaching-Modell auf Basis öffentlich zugänglicher Lehrbeispiele. Keine bestätigte Berechnung des einzig richtigen oder biomechanisch zwingend normalen Schwungs und keine vollständige Umsetzung einer offiziellen Zertifizierungsunterlage. Der reale Safari-Download, das Teilen-Menü und Mail auf dem iPad sind vor dem ersten Kundeneinsatz zu testen.
