# PDF-Generierung Standards für ECS Aktivierung Dosierungspläne
## Global gültig für alle zukünftigen Dosierungspläne

**Letzte Aktualisierung:** 2025-01-12 (v2.0 - Komplettes Redesign)  
**Gültigkeitsbereich:** Alle Cannabinoid-Reduktionspläne weltweit

**⚠️ WICHTIG: Alle bisherigen Standards wurden durch die neuen Layout-Vorgaben ersetzt.**

---

## 🆕 NEUE HAUPTÜBERSCHRIFT & EINLEITUNG

### Titelzeile
```
Cannabinoid-Reduktionsplan – Ihr Weg zu weniger Medikamenten
```
- Schriftgröße: **18pt** (nicht mehr 20pt)
- Farbe: **#004D40** (dunkleres Teal)
- Stil: **Fett**

### Untertitel
```
Erstellt auf Basis Ihrer Eingaben, wissenschaftlich fundiert und KI-gestützt
```
- Schriftgröße: **12pt**
- Farbe: **#00695C**
- Stil: **Normal**

### Einleitung (IMMER vor Übersicht)
```
Lieber [Vorname],
willkommen zu Ihrem persönlichen Cannabinoid-Reduktionsplan!

Dieser Plan wurde individuell für Sie erstellt – basierend auf Ihrer aktuellen 
Medikation, Ihrem Alter, Körpergewicht und Ihrer Körpergröße.

Ziel ist es, das Endocannabinoid-System (ECS) zu stärken und dadurch schrittweise 
Ihre Medikamentenmenge zu reduzieren – unter ärztlicher Begleitung und ohne Risiko.
```
- Schriftgröße: **11pt**
- Farbe: **#222**
- Stil: **Normal**

---

## 📋 STRUKTUR DER ERSTEN SEITE

**Reihenfolge (fest):**
1. Hauptüberschrift + Untertitel
2. Begrüßung ("Lieber [Vorname],")
3. Einleitungstext (ECS-Stärkung)
4. **Übersicht Ihres Plans** (grüne Box)
5. Produktinformationen (Cannabinoid-Paste 70 %)
6. Ihre individuelle Dosierungsstrategie
7. ⚠️ Warnbox (falls Wechselwirkungen)

---

## 📦 BOXEN & LAYOUT-FORMATIERUNG

### Übersicht Ihres Plans (hellgrün)
```css
{
  "backgroundColor": "#E6F7F1", /* Hellgrün */
  "borderRadius": "3px",
  "padding": "12px",
  "border": "1px solid #004D40",
  "maxWidth": "90%"
}
```

**Inhalt:**
```
📋 Übersicht Ihres Plans
• Startdosis (Tag 1): 0,1 cm = 4,7 mg (abends)
• Zielbereich (Woche 7–8): 1,5 cm = 70 mg Cannabinoide täglich
• Verteilung: morgens ~40 %, abends ~60 %
• Einschleichphase: 3 Tage (nur abends)
• Gesamtdauer: 8 Wochen
```
- Icon: 📋 vor Titel
- Alle Zahlen mit **deutschem Komma**: 0,1 cm (nicht 0.1 cm)

### Warnbox (zartrot)
```css
{
  "backgroundColor": "#FDECEA", /* Zartrot */
  "borderRadius": "3px",
  "padding": "12px",
  "border": "1px solid #DC2626"
}
```

**Position:** Direkt nach "Ihre individuelle Dosierungsstrategie"

**Neuer Text:**
```
⚠️ Wichtig: Ihr Medikamentenprofil weist mögliche Wechselwirkungen auf

Ihr Plan wurde deshalb besonders vorsichtig gestaltet. Bitte starten Sie 
erst nach ärztlicher Rücksprache.

Dies dient Ihrer Sicherheit und ermöglicht eine optimale Anpassung.
```

**NICHT MEHR:**
- ❌ "WICHTIG: Kritische Wechselwirkungen erkannt"
- ❌ Warnbox am Seitenende
- ❌ Reißerischer Ton

### Allgemeine Box-Regeln
- **Padding:** Mindestens 12px (nicht 4-6px)
- **Border-Radius:** 3px (abgerundete Ecken)
- **Max-Width:** 90% des Textbereichs
- **Kein Textüberlauf:** Text darf nicht über Balkenrand hinauslaufen

---

## 🎨 TYPOGRAFISCHE HIERARCHIE (NUR 5 GRÖSSEN)

| Element | Größe | Stil | Farbe |
|---------|-------|------|-------|
| **Haupttitel** | 18pt | Fett | #004D40 |
| **Untertitel** | 12pt | Normal | #00695C |
| **Box-Überschriften** | 12pt | Fett | #004D40 |
| **Fließtext** | 11-12pt | Normal | #222 |
| **Tabellenheader** | 10pt | Fett | #004D40 |
| **Footer** | 9pt | Kursiv | #888 |

**WICHTIG:** Keine anderen Schriftgrößen verwenden!

---

## ⚙️ 1. Einheitlichkeit & Schreibweise

### Anrede
- **Format:** `Lieber [Vorname],` oder `Liebe [Vorname],` (je nach Geschlecht)
- **Wichtig:** Vorname wird automatisch **großgeschrieben** (erster Buchstabe)
- **Beispiel:** `Lieber Max,` (nicht `Lieber max,`)

### Terminologie
- ✅ **Korrekt:** "Cannabinoide" (allgemeiner Begriff)
- ❌ **Falsch:** "CBD" (nur ein spezifisches Cannabinoid)
- ✅ **Korrekt:** "Reduktionsplan" (medizinisch korrekt)
- ❌ **Falsch:** "Ausschleichplan" (umgangssprachlich)

### Dosierungsphilosophie
- **Englisch + Deutsche Übersetzung:** `"Start low, go slow (niedrig beginnen, langsam steigern)"`
- **Nie nur Englisch:** ❌ "Start Low, Go Slow"

### Wechselwirkungen
- **Einheitliche Schreibweise:** `"CBD-/Medikamenten-Wechselwirkungen"`
- Mit Schrägstrich und Bindestrich

### Zahlenformatierung
- **Zahlen und Einheiten immer mit Leerzeichen trennen:**
  - ✅ Korrekt: `70 mg`, `1,5 cm`, `2-3 Minuten`
  - ❌ Falsch: `70mg`, `1.5 cm`, `2-3Minuten`
- **Dezimal-Komma verwenden (deutsch):**
  - ✅ Korrekt: `46,7 mg`, `1,5 cm`
  - ❌ Falsch: `46.7 mg`, `1.5 cm` (englische Punkte)

---

## 💊 2. Einheiten & Umrechnung (weltweit einheitlich)

### Referenz-Umrechnung (immer gleich)
```
Skalierung der Spritze: 0,1 cm pro Teilstrich

Referenz (fix):
• 1,5 cm = 70 mg Cannabinoide
• 1,0 cm = 46,7 mg Cannabinoide
• 0,1 cm = 4,67 mg Cannabinoide

Formel (weltweit gültig):
mg = cm × 46,7
```

### Dosierungseinheit
- **Primär:** Zentimeter (cm) auf der Spritze
- **Sekundär:** mg-Werte (berechnet mit Formel)

### Umrechnung
- **Alle mg-Werte werden ausschließlich mit dieser Formel berechnet:** `mg = cm × 46,7`
- **Runden:** Eine Dezimalstelle (z. B. `46,7 mg`, nicht `46,67 mg`)

### Ausgabe der Referenz
- **Diese Referenz muss in jedem Plan einmal in der "Produktinfo" oder im Anhang ausgegeben werden**
- Position: Nach der Produktbeschreibung, vor den Tabellen

---

## 📊 3. Tabellen-Konsistenz & Struktur

### Woche 1-3: Kompakte Darstellung
- **Nur eine Erhöhungszeile pro Woche anzeigen**
- Format: `Tage 1-7: [Dosierung] täglich`
- **Keine Wiederholungen pro Tag** (zu viele redundante Zeilen)
- Beispiel:
  ```
  Woche 1
  -------
  Tage 1-7  | 0,2 cm (9,3 mg) abends | Gesamt: 9,3 mg täglich
  ```

### Einschleichphase (Tage 1-3)
- **Nur abends:** Erste 3 Tage nur abendliche Einnahme
- **Morgens:** Erst ab Tag 4 morgens + abends

### Verteilung morgens/abends
- **Morgens:** ~40 % der Tagesmenge
- **Abends:** ~60 % der Tagesmenge
- **Bei jeder Berechnung prüfen und ggf. cm-Werte anpassen**

### Zusammenfassung über Tabelle
- **Immer automatisch über der ersten Tabelle ausgeben:**
  ```
  • Startdosis (Tag 1): 0,2 cm = 9,3 mg (abends)
  • Zielbereich (Woche 7-8): 1,5 cm = 70 mg Cannabinoide
  • Verteilung: morgens ~40 %, abends ~60 %
  ```

### Dosisänderungen
- **Maximal eine Dosisänderung pro Tag**
- Keine mehrfachen Erhöhungen innerhalb eines Tages

---

## 🧠 4. Sicherheit & Ärztliche Begleitung

### Wichtige Hinweise (immer am Ende des Plans)

#### Bei Nebenwirkungen
```
Bei Nebenwirkungen: Sofort auf die zuletzt gut verträgliche Dosis des 
Vortags zurückgehen ("Step-back-Regel") und ärztlich Rücksprache halten.
```

#### Ärztliche Begleitung
```
Cannabinoide können das ECS unterstützen und ärztlich begleitete Anpassungen 
der Medikation erleichtern.

Änderungen erfolgen ausschließlich durch Ärztinnen und Ärzte.

Bitte nehmen Sie diesen Plan zu Ihrem Arzttermin mit – er dient als 
Gesprächsgrundlage.
```

### Verbotene Formulierungen
- ❌ **Keine Heilversprechen:** "CBD heilt...", "garantiert wirksam..."
- ❌ **Keine eigenständige Reduktion:** "Sie können Ihre Medikamente jetzt reduzieren..."
- ✅ **Korrekt:** "Cannabinoide können das ECS unterstützen und **ärztlich begleitete** Anpassungen erleichtern"

---

## 🧾 5. Medikamentenliste & Wechselwirkungen

### Tabellenform (immer so darstellen)

| Nr. | Wirkstoff (Generikum) | Dosierung | Einnahme | Erwartete Wechselwirkung |
|-----|------------------------|-----------|----------|--------------------------|
| 1   | Acetylsalicylsäure (ASS) | 400 mg | regelmäßig | mittel |
| 2   | Ibuprofen | 400 mg | bei Bedarf | mittel |

### Hinweis unter Tabelle (automatisch)
```
Einstufung "mittel" bedeutet, dass Wirkstoffspiegel steigen können. 
Ärztliche Dosisanpassungen sind möglich – bitte nie eigenmächtig ändern.
```

### Generikum-Namen
- **Format:** `Handelsname (Generikum)`
- **Beispiel:** `Voltaren (Diclofenac)`

---

## 🧩 6. Stil & Aufbau

### Seitenüberschrift (Standard)
```
Individueller Cannabinoid-Dosierungsplan

Erstellt auf Basis Ihrer Eingaben, wissenschaftlich fundiert 
und KI-gestützt
```

### Zusammenfassung direkt nach Anrede
```
Übersicht Ihres Dosierungsplans:
• Startdosis (Tag 1): 0,2 cm = 9,3 mg (abends)
• Zielbereich (Woche 7-8): 1,5 cm = 70 mg Cannabinoide täglich
• Verteilung: morgens ~40 %, abends ~60 %
```

### Produktinformationen (mit Referenz)
```
Cannabinoid-Paste 70 % – Produktinformationen
• Konzentration: 70 % Cannabinoide (davon ca. 90 % CBD)
• Verpackung: 3 g Spritze mit 30 Teilstrichen (je 0,1 cm pro Teilstrich)
• Dosierungseinheit: Zentimeter (cm) auf der Spritze

Referenz-Umrechnung (weltweit gültig):
• 1,5 cm = 70 mg Cannabinoide  |  1,0 cm = 46,7 mg  |  0,1 cm = 4,67 mg
• Formel: mg = cm × 46,7  (alle mg-Werte werden mit dieser Formel berechnet)
```

### Tabellenüberschriften
- **Woche 1-8:** Immer gleich formatieren
- Format: `Woche 1`, `Woche 2`, etc.

### Automatische Neuberechnung
- **mg-Werte automatisch neu berechnen, wenn cm geändert wird**
- Formel bleibt fix: `mg = cm × 46,7`

---

## ✅ 7. Globale Qualitätsregeln

### Keine Fehler
- ❌ Tippfehler vermeiden (z. B. "1 cm H 46,7 mg" → ✅ "1 cm = 46,7 mg")
- ❌ Falsche Umrechnungen
- ❌ Formatierungsfehler

### Synchronisation
- **mg- und cm-Werte immer synchron**
- Bei Änderung eines Wertes, anderen automatisch anpassen

### Einheitliche Formatierung
- Einheitliche Schriftgröße & Abstände zwischen Tabellen
- Konsistente Farben und Hervorhebungen

### Abschlussabschnitt (immer am Ende)
```
Erstellt durch KI auf Basis wissenschaftlicher Studien zu 
Cannabinoid-Dosierung und ECS-Regulation.
```

### Dateiname-Standard
```
Cannabinoid-Reduktionsplan_[Vorname]_[YYYY-MM-DD].pdf
```
- Beispiel: `Cannabinoid-Reduktionsplan_Max_2025-01-12.pdf`

---

## 📋 Checkliste für jeden Plan

Vor Veröffentlichung prüfen:

- [ ] Vorname korrekt großgeschrieben
- [ ] "Cannabinoide" statt "CBD" verwendet
- [ ] "Reduktionsplan" statt "Ausschleichplan"
- [ ] "Start low, go slow (niedrig beginnen, langsam steigern)"
- [ ] Zahlen mit Leerzeichen (70 mg, 1,5 cm)
- [ ] Dezimal-Komma (nicht Punkt)
- [ ] Referenz-Umrechnung in Produktinfo ausgegeben
- [ ] Formel `mg = cm × 46,7` verwendet
- [ ] Woche 1-3 kompakt (nur eine Zeile)
- [ ] Einschleichphase: Tage 1-3 nur abends
- [ ] Verteilung: morgens ~40 %, abends ~60 %
- [ ] Zusammenfassung über Tabelle
- [ ] Step-back-Regel bei Nebenwirkungen
- [ ] Ärztliche Begleitung betont
- [ ] Medikamentenliste als Tabelle
- [ ] Einstufungs-Hinweis unter Tabelle
- [ ] KI-Signatur am Ende
- [ ] Dateiname korrekt: `Cannabinoid-Reduktionsplan_[Name]_[Datum].pdf`

---

## 🔄 Versionierung

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0 | 2025-01-12 | Initiale Erstellung der globalen Standards |

---

**Diese Standards sind verbindlich für alle zukünftigen Dosierungspläne.**
