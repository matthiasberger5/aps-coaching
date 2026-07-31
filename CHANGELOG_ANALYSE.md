# Korrektur der Analyse- und Trainingslogik

## Behobene Fehler

1. `Links`, `Rechts`, `Zu kurz` und `Zu lang` wurden zuvor nicht als Analysefehler gezählt.
2. Derselbe Schlag konnte gleichzeitig mehrere globale Top-Prioritäten erzeugen.
3. Reine Häufigkeit wurde stärker gewichtet als Strafschläge, unspielbare Lagen und Dreiputts.
4. Leere, noch nicht ausgefüllte Schlagkarten gingen in Nenner und Stärkenbewertung ein.
5. Putten berücksichtigte kurze verschobene Putts und normale Tempofehler nicht ausreichend.
6. Der Trainingsplan übernahm die fehlerhafte Reihenfolge unverändert und verwendete weitgehend generische Übungen.
7. Manifest, Cache und Local-Storage-Schlüssel verwiesen noch auf APS 2.x.

## Neue Logik

- Nicht überlappende Prioritäten nach Spielbereich.
- Ursachenanalyse innerhalb des Spielbereichs.
- Gewichtung nach Wiederholung, Schwere, Folgewirkung und Stichprobengröße.
- Eigene Puttlogik für kurze Putts, Lag-Putts und Dreiputts.
- Kontextbezogene Übungen und Messziele.
- Automatische Migration vorhandener lokaler APS-2.0-Daten.
- Neuer Service-Worker-Cache, damit die korrigierte JavaScript-Datei ausgeliefert wird.


## Klarere Indexdarstellung

- Prozentanzeige durch `Wert / 100` ersetzt.
- Erklärung ergänzt: `0 = kritisch`, `100 = stabil`.
- Klartextstufen von `Kritisch` bis `Stärke` ergänzt.
- Fehlerquote getrennt vom gewichteten Leistungsindex ausgewiesen.
- Fehlende Daten werden als `–` statt `0 %` dargestellt.
- Putt-Kennzahlen werden direkt an der Putt-Säule erklärt.
