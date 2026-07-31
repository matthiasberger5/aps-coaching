# Druck- und PDF-Optimierung

## Analysebericht

- Eigenständiger A4-Bericht mit APS-Logo und Kundenkopf.
- Spieler, Handicap, Rundendatum, Golfplatz, Score und Rundennotiz werden automatisch übernommen.
- Zweiteilige Seitenstruktur: Management-Zusammenfassung und Prioritäten auf Seite 1; Leistungsindex, Schlägeranalyse und Fehlermuster auf Seite 2.
- Druckgerechte Schriftgrößen, Linien, Statusfarben und Tabellen.
- Kontrollierte Seitenumbrüche verhindern abgeschnittene Karten und Tabellenzeilen.

## Trainingsplan

- Eigenständiger A4-Trainingsplan mit Kundenkopf.
- Gesamtdauer, Hauptfokus und Datengrundlage werden hervorgehoben.
- Jede Priorität zeigt Zeitbudget, Ursache, konkrete Übung und Messziel in einer klaren Zeile.
- Der dreiteilige 90-Minuten-Plan passt bei üblichen Daten auf eine A4-Seite.

## Technische Änderungen

- A4-Hochformat und definierte Druckränder über `@page`.
- Erhalt der APS-Farben über `print-color-adjust`.
- Aussagekräftiger Dateiname im Druckdialog, z. B. `APS_Analyse_Max_Mustermann_2026-07-27.pdf`.
- Neuer Service-Worker-Cache, damit die Druckversion sofort geladen wird.
