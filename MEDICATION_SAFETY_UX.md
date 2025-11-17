# Medication Safety UX Implementation

## Übersicht

Dieses Feature fügt dezente, sachliche Sicherheitshinweise für Medikamente mit erhöhtem Risiko hinzu. Die Hinweise sind informativ und professionell, ohne Panik zu erzeugen.

## Implementierte Features

### 1. Zentrale Klassifizierung (MEDICATION_CLASSIFICATIONS)

**Datei:** `public/static/app.js` (Zeilen 1-90)

Zentrale Konfiguration für 6 Medikamentenkategorien:

| Kategorie | Keywords | Badge | Badge-Farbe |
|-----------|----------|-------|-------------|
| **Benzodiazepine/Z-Drugs** | diazepam, lorazepam, alprazolam, zolpidem, etc. | "vorsichtig reduzieren" | Gelb (Pastell) |
| **Antidepressiva** | citalopram, sertralin, fluoxetin, venlafaxin, etc. | "vorsichtig reduzieren" | Gelb (Pastell) |
| **Antiepileptika** | valproat, carbamazepin, lamotrigin, etc. | "vorsichtig reduzieren" | Gelb (Pastell) |
| **Antikoagulantien** | warfarin, rivaroxaban, apixaban, marcumar, etc. | "kritische Dauertherapie" | Orange (Pastell) |
| **Immunsuppressiva** | tacrolimus, ciclosporin, mycophenolat, etc. | "kritische Dauertherapie" | Orange (Pastell) |
| **Opioide** | morphin, oxycodon, fentanyl, tramadol, etc. | "vorsichtig reduzieren" | Gelb (Pastell) |

Jede Kategorie enthält:
- `keywords`: Array von Wirkstoffen für Pattern Matching
- `badge`: Text und Farbe für Badge-Darstellung
- `hint`: Ausführlicher Hinweistext (2-3 Sätze)

### 2. Individuelle Medikamenten-Hinweise (Input-Formular)

**Funktion:** `showMedicationSafetyHint()`

**Wo sichtbar:** Bei der Medikamenten-Eingabe (Schritt: "Medikamente")

**Verhalten:**
- Wird automatisch beim Auswählen eines Medikaments aus der Autocomplete-Liste ausgelöst
- Badge erscheint **neben dem Medikamentennamen-Label**
- Hinweistext erscheint **unter dem Medikamentennamen-Eingabefeld**
- Entfernt alte Hinweise beim Wechsel des Medikaments

**Styling:**
```css
/* Badge */
display: inline-block;
padding: 0.25rem 0.5rem;
border-radius: 9999px;
font-size: 0.75rem;
background-color: #fefce8; /* Gelb */
color: #854d0e;
border: 1px solid #fef08a;

/* Hinweisbox */
margin-top: 0.5rem;
padding: 0.75rem;
background-color: #f9fafb; /* Hellgrau */
border-left: 3px solid #9ca3af; /* Grau */
font-size: 0.875rem;
color: #6b7280; /* Grau */
```

**Beispiel-Hinweis für Diazepam:**
> Hinweis: Dieses Medikament gehört zu einer Wirkstoffgruppe, die in der Regel langsam und unter ärztlicher Begleitung reduziert wird. MEDLESS zeigt nur einen theoretischen Verlauf – bitte jede Änderung mit Ihrem Arzt besprechen.

### 3. Globaler Sicherheitshinweis (Unterhalb Medikamentenliste)

**Funktion:** `updateGlobalSafetyNotice()`

**Wo sichtbar:** Unter dem "Medikament hinzufügen" Button

**Auslöser:**
- Wird angezeigt, wenn **mindestens ein High-Risk-Medikament** eingegeben wurde
- Aktualisiert sich automatisch beim Hinzufügen/Entfernen von Medikamenten

**Inhalt:**
```
📋 MedLess-Hinweis zu Ihrer Medikation

Bei einigen Ihrer Medikamente ist ein besonders vorsichtiges Vorgehen empfohlen. 
Der berechnete Ausschleichplan ist nur eine theoretische Orientierung und ersetzt 
keine ärztliche Entscheidung. Bitte besprechen Sie alle Änderungen mit Ihrem 
behandelnden Arzt.
```

**Styling:**
```css
margin-top: 1.5rem;
padding: 1.25rem;
background-color: #f9fafb;
border: 1px solid #e5e7eb;
border-radius: 8px;
```

### 4. Ergebnisseite-Erweiterungen (Step 5)

**Funktion:** Erweiterte `displayResults()` Funktion

**Änderungen:**

1. **Badge neben Medikamentennamen:**
   - Erscheint inline neben dem Medikamentennamen
   - Gleiche Farben wie im Input-Formular

2. **Individuelle Hinweise pro Medikament:**
   - Unter der Medikamentenbeschreibung
   - Gleicher Text wie im Input-Formular
   - Hellgrauer Hintergrund, linker grauer Balken

3. **Globaler Hinweis:**
   - Erscheint nach der Medikamentenliste (vor den Critical Warnings)
   - Wird angezeigt wenn:
     - `hasHighRiskMedication()` = true ODER
     - `maxSeverity` = 'high' | 'critical'

## Helper-Funktionen

### `classifyMedication(medicationName, genericName)`
- **Input:** Medikamentenname und generischer Name (optional)
- **Output:** Classification object oder `null`
- **Logik:** Durchsucht alle Keywords in `MEDICATION_CLASSIFICATIONS`
- **Case-insensitive:** Suche in Kleinbuchstaben

### `hasHighRiskMedication(medications)`
- **Input:** Array von Medikamenten `[{name, genericName}]`
- **Output:** `boolean`
- **Logik:** Prüft ob mindestens ein Medikament klassifiziert werden kann

### `getBadgeStyles(tailwindClasses)`
- **Input:** Tailwind CSS Klassen (z.B. "bg-yellow-50 text-yellow-800")
- **Output:** Inline CSS String
- **Zweck:** Konvertiert Tailwind-Klassen zu inline CSS für HTML-String-Rendering

## Design-Prinzipien

### ✅ DO:
- Dezente, sachliche Hinweise
- Kleine, graue Schrift
- Pastell-Farben (Gelb/Orange)
- Informativ ohne Alarmismus
- Zentrale Konfiguration für Texte

### ❌ DON'T:
- Keine roten Alarmboxen
- Keine Blink-Effekte
- Keine großen, fett gedruckten Warnungen
- Keine Panik-erzeugenden Formulierungen
- Keine technischen Warnungen (nur medizinisch relevante)

## Wartung & Erweiterung

### Neue Medikamentenkategorie hinzufügen:

```javascript
// In MEDICATION_CLASSIFICATIONS Object:
new_category: {
  keywords: ['wirkstoff1', 'wirkstoff2', 'wirkstoff3'],
  badge: { 
    text: 'Badge-Text', 
    color: 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
  },
  hint: 'Hinweis: Ausführlicher Text für Patienten. 2-3 Sätze, sachlich und informativ.'
}
```

### Neue Farbe für Badge hinzufügen:

```javascript
// In getBadgeStyles() colorMap:
const colorMap = {
  'bg-your-color-50': 'background-color: #hexcode',
  'text-your-color-800': 'color: #hexcode',
  'border-your-color-200': 'border: 1px solid #hexcode',
};
```

### Keyword zu existierender Kategorie hinzufügen:

```javascript
benzodiazepines: {
  keywords: [...existingKeywords, 'neuer-wirkstoff'],
  // Rest bleibt gleich
}
```

## Testing

### Manueller Test - Input Form:
1. Navigate zu Medikamenten-Schritt
2. Tippe "Diazepam" ins Suchfeld
3. Wähle "Valium (Diazepam)" aus
4. **Erwartung:** Badge "vorsichtig reduzieren" erscheint, Hinweistext unter Input

### Manueller Test - Global Notice:
1. Füge mindestens ein High-Risk-Medikament hinzu (z.B. Diazepam)
2. **Erwartung:** Globaler Hinweis erscheint unter "Medikament hinzufügen" Button
3. Entferne alle Medikamente
4. **Erwartung:** Globaler Hinweis verschwindet

### Manueller Test - Results Page:
1. Durchlaufe komplettes Formular mit Diazepam
2. Scrolle zu Medikamentenliste in Ergebnissen
3. **Erwartung:** Badge neben "Valium", Hinweis unter Medikament, Globaler Hinweis nach Liste

## Deployment

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name medless --branch main
```

## Live URLs

- **Production:** https://medless.pages.dev
- **Latest Deployment:** https://36bc5742.medless.pages.dev

## Browser-Kompatibilität

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari
✅ Mobile Browsers (iOS Safari, Chrome Android)

**Hinweis:** Verwendet standard HTML/CSS/JavaScript, keine speziellen Browser-Features.
