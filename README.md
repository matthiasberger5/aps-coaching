# APS 3.0 Coaching System

APS ist ein Trainerwerkzeug. Die App erfasst Schläge, erkennt wiederkehrende Schwächen und leitet daraus Trainingsprioritäten, Übungen, Messziele und sofortige Spielstrategien ab.

## Dateien

- `index.html` – Oberfläche
- `css/app.css` – Design
- `js/app.js` – Datenerfassung, Analyse und Training
- `tests/analysis.test.js` – Regressionstests für Analyse und Priorisierung
- `assets/aps-logo.png` – APS-Logo
- `manifest.webmanifest` und `sw.js` – installierbare Offline-Web-App

## Veröffentlichung

Den gesamten Inhalt dieses Ordners in das Stammverzeichnis des GitHub-Repositorys hochladen. GitHub Pages und Cloudflare Pages veröffentlichen die App direkt aus dem Branch `main`.

## APS-Analyseprinzip

Beobachtung → wiederkehrendes Muster → Spielbereich → wahrscheinliche Ursache → Folgewirkung → Priorität → Trainingsaufgabe → messbares Ziel.

Die Top-3-Prioritäten werden nicht mehr aus überlappenden Global-Kategorien gebildet. Bewertet werden getrennt:

- Abschlag
- langes Spiel
- Kurzspiel
- Bunker
- Putten

Innerhalb jedes Spielbereichs werden Ballkontakt, Richtung, Länge, Ergebnislage, Restdistanz und Strafschläge gemeinsam ausgewertet. Normale Abweichungen wie `Links`, `Rechts`, `Zu kurz` und `Zu lang` zählen als Fehler; starke Abweichungen, unspielbare Lagen und Strafschläge erhalten eine höhere Gewichtung. Kleine Stichproben werden gedämpft, damit ein einzelner leichter Fehler kein wiederkehrendes Muster überstimmt.

## Analyse testen

Im Projektordner ausführen:

```bash
node tests/analysis.test.js
```

Der Test prüft unter anderem leere Platzhalter, normale Richtungsfehler, kurze verschobene Putts, die Beispielrunde und den Schutz vor einer Übergewichtung einzelner Beobachtungen.

## Darstellung des APS-Leistungsindex

Die sechs Säulen zeigen einen Leistungsindex von `0 bis 100`:

- `0` bedeutet kritisch beziehungsweise hohen Trainingsbedarf.
- `100` bedeutet stabil beziehungsweise aktuell geringen Trainingsbedarf.
- Der Index ist keine Trefferquote. Häufigkeit, Schwere und Auswirkung werden gemeinsam bewertet.
- Die Fehlerquote wird separat als `auffällige Beobachtungen / bewertete Beobachtungen` angezeigt.
- Bei fehlenden Daten erscheint ein Gedankenstrich statt eines irreführenden Werts von `0`.
- Die Putt-Säule nennt zusätzlich Putts, Dreiputt-Bahnen, kurze Putts und die Restdistanz langer Putts.

## Analyse und Trainingsplan als PDF ausgeben

1. In der App den Bereich **Analyse** oder **Training** öffnen.
2. **Drucken / PDF** beziehungsweise **Plan drucken** wählen.
3. Im Browser **Als PDF speichern**, Papierformat **A4** und Ausrichtung **Hochformat** verwenden.
4. Für die vollständige APS-Farbgestaltung im Druckdialog **Hintergrundgrafiken** aktivieren, falls der Browser diese Option anbietet.

Der Dateiname wird automatisch aus Berichtstyp, Spielername und Rundendatum gebildet.


## Kundenbericht mit weiterführenden Angeboten

Über **Kundenbericht + Angebote** wird ein vollständiger Kundenbericht ausgegeben: Analyse, Trainingsplan und eine separate Seite mit APS PLAY, APS ADAPT und APS PERFORM. Die bereits bezahlte Erstanalyse von 99 EUR wird transparent vom jeweiligen Programmpreis abgezogen. QR-Codes und klickbare Links führen direkt zu den Programmseiten.

Die Angebotsdaten können zentral in `js/app.js` über `ANALYSIS_CREDIT` und `APS_OFFERS` gepflegt werden.

## Automatischer Score

Der Bahnscore wird automatisch aus den erfassten Schlägen berechnet. Jeder erfasste Schlag zählt einen Schlag; eingetragene Strafschläge werden zusätzlich addiert. Das Score-Feld ist deshalb nur noch eine Anzeige und muss nicht manuell gepflegt werden. Die Druckausgabe verwendet DIN A4 Hochformat.
