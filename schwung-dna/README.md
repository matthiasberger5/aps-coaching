# Golf Schwung-DNA · Matthias Berger

Statische Web-App für den 20-Minuten-Kurzcheck auf dem iPad. Kundendaten bleiben im geöffneten Browser; beim Neuladen werden sie gelöscht. PDF vor dem nächsten Teilnehmer sichern. E-Mail-Versand erfolgt manuell.

## Im bestehenden APS-Repository

Diese App liegt im Unterordner schwung-dna des Repositorys matthiasberger5/aps-coaching. Die APS-Analyse wird weiterhin über die bisherige Startadresse geöffnet. Das Screening wird über dieselbe Cloudflare-Adresse mit /schwung-dna/ am Ende geöffnet. Der vorhandene Cloudflare-Build muss den Repository-Stamm veröffentlichen, damit beide Apps enthalten sind.

Auf dem iPad zunächst das Screening über /schwung-dna/ in Safari öffnen. Danach bei Bedarf Teilen → Zum Home-Bildschirm verwenden. PDF herunterladen und Teilen → Mail praktisch prüfen.

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

Der erste Vergleichspunkt wird als eigene Arbeitsregel ausgewählt: Bei klarem Handtest und Slow/Fast-Hip-Ergebnis zunächst Griffvergleich; sonst Körperbewegung bei passendem Handtest; sonst verfügbare Rückschwungführung oder Abschwungzone. Eine explizite Auswahl des Trainers hat Vorrang. Diese Reihenfolge ist keine offizielle BSD-Prioritätsregel.

Der Grifftext erklärt eine kleine Veränderung der vorderen Hand über mehr/weniger sichtbare Fingerknöchel, bei unveränderter Schlagfläche und hinterer Hand. Die neutrale Stellung wird nicht mit einer universellen Knöchelzahl oder einem erfundenen Winkel berechnet. Zwei kurze Einheiten mit jeweils fünf gewohnten und fünf Vergleichsschlägen sind eine eigene Übungsplanung. Übernahme nur bei mehr sauberen Treffern in beiden Einheiten und mindestens ebenso angenehmem Gefühl; sonst gewohnt weiterspielen.

## Messung und Regeln

Spannweite: Mittelfingerspitze bis Mittelfingerspitze, Arme seitlich auf Schulterhöhe gestreckt. Alte Daumen–Daumen-Werte neu messen. Armmaß: Ellenbogen bis mittlerer Fingerknöchel; Oberarm: Ellenbogen bis Schultergelenk.

Die Ebenenregeln sind in rules.js hinterlegt. Gleichheit wird als mittlerer Modellansatz eingeordnet. Kleine ungleiche Differenzen bis einschließlich 1 cm führen zu einem offenen Ergebnis und einer erneuten Messung. Dieser Arbeitsbereich ist eine eigene Vorsichtsregel; kein als offiziell bestätigter BSD-Grenzwert. Ein konkreter Top-Track wird nur bei eindeutigem Verhältnis hervorgehoben.

Der Hand-/Armtest liefert einen vorläufigen Bewegungsansatz. Zusätzliche Dynamik-/Kraftmessungs-Auswahlen sind nicht mehr Teil der Maske. Ein ungünstiger Schlagvergleich führt zu keiner Änderungsaufgabe. Die Zuordnung zur hinteren Hand folgt Mike Adams' öffentlich wiedergegebenem Lehrbeispiel. Sie weist keine dominante Boden-Kraftquelle nach. Es werden keine Bodenkräfte, Leistungsanteile oder Bewegungsprozente gemessen. Die Drehachse ist nicht die Gewichtsverteilung im Treffmoment. Hip-Differential beschreibt Hüftöffnung und die relative Arm-/Rumpfabstimmung; daraus wird kein Krafttyp berechnet. Das Hüft-Differential liefert einen vorläufigen Vergleichsvorschlag für die vordere Hand (Slow schwächer, Mid neutral, Fast stärker), sofern kein geprüfter Griff erfasst wurde. Dieser Zusammenhang folgt dem Lehrmodell von Bill Schmedes III und ist keine universell belegte BSD-Zwangsregel. Ein erfasster Griffvergleich hat Vorrang. Der ruhige Arm-Pendeltest ersetzt die frühere zusätzliche Arm-Hängetest-Auswahl. Under, Side On und On Top liefern vereinfachte Rückschwungansätze (flach/körpernah, mittel, höher). On-Top-Ausnahmen aufgrund anderer Körpermerkmale bleiben ausdrücklich möglich. Kein exakter Griffwinkel wird berechnet.

Der Armtest-Griffhinweis bezieht sich auf die hintere Hand. Die vordere Hand folgt einem eigenen Vergleich aus dem Hip-Speed-Test oder einem tatsächlich bestätigten Griffvergleich. Stärker/schwächer bedeutet Handstellung, nicht Griffdruck.

Bei Beschwerden entsteht keine automatische Änderungsaufgabe. Bei Linksspielern gilt der Text für vordere/hintere Hand entsprechend; die Griff-Nahaufnahme wird für Linksspieler in der Anzeige gespiegelt. Die übrigen Fotos zeigen Rechtsspieler.

## Bilder und Quellen

Der Report verwendet Originale von E.A. Tischler / New Horizons Golf Approach, unverändert mit einer zusätzlichen Auswahlmarkierung im Rückschwungvergleich:
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

## PDF und Prüfung

Direkter PDF-Download; Text als hochauflösendes Bild eingebettet. Die vier Standardfälle (niedrig, mittel, hoch und unklare Maße) sowie zwei hochgeladene Kundenfälle wurden mit tatsächlichem Canvas-Rendering erzeugt und visuell geprüft: jeweils eine A4-Seite. Größere eigene Ergänzungen können zusätzliche Seiten erzeugen.

Geprüft: Syntax, Reihenfolge, Feldzuordnung, automatische Armtest-Rückschwungführung, Trainingsaufgabe passend zum Vergleichspunkt, dokumentiertes Druckempfinden, vier Testblöcke, ungünstiger Schlagvergleich, Griffvorschlag und Vorrang des geprüften Griffs, alle Bewegungsansätze, getrennte Rück-/Abschwungzuordnung, Gleichheit, kleine Messdifferenzen, offene Tests, Beschwerden und Linksspieler. Der Browserdruck verwendet kompakte Schriftgrößen und zeigt Rück-/Abschwung nebeneinander. Die Trainingsaufgabe steht vorn; ihre Überschrift, Übung und Entscheidung werden per CSS zusammengehalten. Der reale Safari-Druck, Download und Mail auf dem iPad sind noch zu testen.

Optionaler Entwicklertest: Node.js mit @napi-rs/canvas; im Projektordner node tests/check.cjs ausführen. QA-Dateien entstehen außerhalb des App-Ordners in tmp/pdfs.

Entfernt auf Wunsch: Einleitung zum Ablauf, Bereitlege-Hinweis, optionale Kraft-/Dynamik-Auswahl mit Statusfeld und Fußnote im Kundenbericht/PDF. Bildquellen sind weiterhin in dieser Anleitung und SOURCES.json dokumentiert.

Geprüft: automatische Priorität, Vorrang der Trainer-Auswahl, schwächerer/stärkerer Grifftext, uneindeutiger Vergleich als Versuch, ungünstiges Ergebnis ohne Änderungsübung, Beschwerden, getrennte Rückschwungführung und oberste Armposition.
