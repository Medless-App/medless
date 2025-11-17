# Dosierplan Sicherheitshinweise - Implementierung

## Übersicht

Diese Erweiterung fügt klare, professionelle medizinische Sicherheitshinweise in den fertigen Dosierplan (HTML/PDF) ein, ohne das Design zu stören oder Panik zu erzeugen.

## Implementierte Features

### 1. Erweiterte Kopfzeile mit Disclaimer

**Datei:** `public/static/app.js` - displayResults() Funktion

**Änderung:** Zweizeiliger Hinweistext unter dem Plan-Titel

**Vorher:**
```
Ihr persönlicher MedLess-Dosierungs- und Reduktionsplan

Dieser Plan zeigt Ihnen eine strukturierte, medizinisch fundierte 
Kombination aus CBD-Dosierung und schrittweiser Medikamentenreduktion. 
Bitte besprechen Sie jede Änderung mit Ihrem Arzt.
```

**Nachher:**
```
Ihr persönlicher MedLess-Dosierungs- und Reduktionsplan

Dieser Plan zeigt Ihnen eine strukturierte, medizinisch fundierte 
Kombination aus CBD-Dosierung und schrittweiser Medikamentenreduktion. 
Er basiert auf Ihren Eingaben und bekannten pharmakologischen Daten.

Er ersetzt keine ärztliche Entscheidung. Bitte besprechen Sie jede 
Änderung mit Ihrem behandelnden Arzt.
```

**Design:**
- Farbe: Grün (#0b7b6c) für wichtige Warnung
- Hintergrund: Radialer Gradient (grün-weiß)
- Zweizeilig für bessere Lesbarkeit

---

### 2. Kategorie-spezifische Hinweise nach Medikamentenliste

**Position:** Nach "Ihre aktuelle Medikation" - vor "Kritische Wechselwirkungen"

**Logik:**
1. Sammelt alle Medikamenten-Kategorien aus `analysis`
2. Verwendet `classifyMedication()` für Pattern-Matching
3. Zeigt bis zu 4 kategorie-spezifische Hinweise

**Kategorie-Texte:**

| Kategorie | Hinweistext |
|-----------|-------------|
| **Benzodiazepine / Z-Drugs** | "Bei Benzodiazepinen und Schlafmitteln ist ein langsames, stufenweises Ausschleichen wichtig. Der hier dargestellte Verlauf ist eine mögliche Orientierung – Tempo und Schritte sollten individuell durch Ihren Arzt angepasst werden." |
| **Antidepressiva** | "Antidepressiva sollten nicht abrupt beendet werden. Ein zu schneller Wechsel kann zu Absetzsymptomen oder einem Wiederaufflammen der Beschwerden führen. Nutzen Sie diesen Plan nur als Grundlage für das Gespräch mit Ihrem Arzt." |
| **Antikoagulantien (Blutverdünner)** | "Blutverdünner werden häufig langfristig oder dauerhaft eingesetzt, zum Beispiel zum Schutz vor Schlaganfall oder Thrombosen. MEDLESS macht hier nur sehr vorsichtige oder keine Reduktionsvorschläge. Eine mögliche Anpassung muss immer ärztlich entschieden werden." |
| **Immunsuppressiva** | "Medikamente zur Verhinderung einer Organabstoßung sind in der Regel unverzichtbar. In diesem Plan wird keine vollständige Reduktion bis 0 mg vorgeschlagen. Änderungen dürfen nur in spezialisierten Zentren erfolgen." |
| **Opioide** | "Starke Schmerzmittel sollten immer unter engmaschiger ärztlicher Kontrolle reduziert werden. MEDLESS kann helfen, einen möglichen Verlauf zu strukturieren – ersetzt aber keine persönliche Betreuung." |
| **Antiepileptika** | "Antiepileptika erfordern ein sehr vorsichtiges Ausschleichen. Ein abruptes Absetzen kann zu schweren Anfällen führen. Jede Dosisänderung sollte nur in enger Abstimmung mit Ihrem Neurologen erfolgen." |

**Design:**
```css
margin-top: 1.2rem;
padding: 1.25rem 1.5rem;
background-color: #f9fafb; /* Hellgrau */
border: 1px solid #e5e7eb;
border-radius: 12px;
```

**Beispiel-HTML:**
```html
<div style="...">
  <h4>Hinweise zu Ihrer Medikation</h4>
  <div style="display: flex; flex-direction: column; gap: 0.75rem;">
    <p>Bei Benzodiazepinen und Schlafmitteln...</p>
    <p>Antidepressiva sollten nicht abrupt...</p>
  </div>
</div>
```

---

### 3. Wöchentliche Reduktionshinweise

**Position:** Am Ende jeder Wochen-Card (nach Fläschchen-Status)

**Logik:**
```javascript
// Prüfe ob in dieser Woche ein High-Risk-Medikament reduziert wird
const hasReduction = week.medications.some(med => {
  // Finde Medikament in Analyse
  const medData = analysis.find(a => ...);
  
  // Klassifiziere
  const classification = classifyMedication(...);
  
  // Prüfe: High-Risk UND Reduktion
  return classification && (med.startMg - med.currentMg) > 0;
});
```

**Hinweistext:**
```
Hinweis: In dieser Woche wird mindestens ein sensibles Medikament 
reduziert. Bitte achten Sie auf Veränderungen Ihres Befindens und 
besprechen Sie Auffälligkeiten mit Ihrem Arzt.
```

**Design:**
```css
margin-top: 1rem;
padding: 0.75rem;
background-color: #fef9f3; /* Orange-beige */
border-left: 3px solid #f59e0b; /* Orange */
border-radius: 4px;
font-size: 0.8rem;
color: #92400e; /* Dunkelorange Text */
```

**Bedingungen:**
- ✅ Nur wenn tatsächlich Reduktion stattfindet (`startMg > currentMg`)
- ✅ Nur 1x pro Woche (nicht pro Medikament)
- ✅ Nur für High-Risk-Medikamente (siehe MEDICATION_CLASSIFICATIONS)

---

### 4. Überarbeitete "Wichtige medizinische Hinweise"

**Struktur:** 2 Bereiche statt 1

#### **Bereich 1: Allgemeine Hinweise**

1. **Theoretischer Plan** (NEU)
   - "Die Berechnungen von MedLess zeigen theoretische Möglichkeiten..."
   - Betont: Arzt entscheidet

2. **Besondere Medikamentengruppen** (NEU)
   - "Bei Blutverdünnern, Immunsuppressiva, Antidepressiva..."
   - Liste der High-Risk-Kategorien

3. **Keine selbstständige Medikamentenänderung**
   - Unverändert

4. **Niemals abrupt absetzen**
   - Unverändert

5. **Bei Nebenwirkungen**
   - Unverändert

#### **Bereich 2: Hinweise zu Cannabinoiden**

1. **CYP450-Interaktionen beachten**
   - Unverändert

2. **Kein Alkohol während der Behandlung**
   - Text leicht angepasst ("während der Behandlung" statt "während der Reduktion")

3. **Keine Grapefruit**
   - Unverändert

4. **Müdigkeit möglich**
   - Unverändert

**Design-Verbesserungen:**
- Mehr Weißraum: `gap: 0.875rem` (vorher 0.75rem)
- Bessere Lesbarkeit: `line-height: 1.6`
- Klare Hierarchie: H3 Zwischenüberschriften
- Keine Dopplungen mehr

---

## Code-Struktur

### Neue Konstante: `CATEGORY_SPECIFIC_HINTS`

```javascript
const CATEGORY_SPECIFIC_HINTS = {
  benzodiazepines: '...',
  antidepressants: '...',
  anticoagulants: '...',
  immunosuppressants: '...',
  opioids: '...',
  antiepileptics: '...'
};
```

### Kategorie-Sammlung

```javascript
const detectedCategories = new Set();

analysisWithMeds.forEach(med => {
  const classification = classifyMedication(med.name, med.genericName);
  if (classification) {
    detectedCategories.add(classification.type);
  }
});
```

### Hinweise generieren

```javascript
const categoryHints = [];
detectedCategories.forEach(category => {
  if (CATEGORY_SPECIFIC_HINTS[category]) {
    categoryHints.push(CATEGORY_SPECIFIC_HINTS[category]);
  }
});

// Zeige maximal 4 Hinweise
if (categoryHints.length > 0) {
  html += `... ${categoryHints.slice(0, 4).map(...)} ...`;
}
```

---

## Testing

### Manuelle Tests

**Test 1: Benzodiazepine + Antidepressiva**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -d '{
    "medications": [
      {"name": "Diazepam", "mgPerDay": 10},
      {"name": "Sertralin", "mgPerDay": 50}
    ],
    ...
  }'
```

**Erwartung:**
- ✅ 2 kategorie-spezifische Hinweise nach Medikamentenliste
- ✅ Wöchentliche Hinweise wenn Reduktion stattfindet
- ✅ Überarbeitete medizinische Hinweise mit 2 Bereichen

**Test 2: Keine High-Risk Medikamente**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -d '{"medications": [{"name": "Ibuprofen", "mgPerDay": 1200}], ...}'
```

**Erwartung:**
- ✅ Keine kategorie-spezifischen Hinweise
- ✅ Keine wöchentlichen Reduktionshinweise
- ✅ Nur allgemeine medizinische Hinweise

---

## PDF-Kompatibilität

**Alle Styles sind inline** → Kompatibel mit html2canvas/jsPDF

**Getestet:**
- ✅ Kategorie-Hinweise erscheinen im PDF
- ✅ Wöchentliche Hinweise erscheinen im PDF
- ✅ Formatierung bleibt erhalten
- ✅ Farben werden korrekt gerendert

---

## Design-Prinzipien

### ✅ DO:
- Ruhige, professionelle Farben (Grün, Hellgrau, Orange-beige)
- Viel Weißraum für Lesbarkeit
- Klare Informationshierarchie
- Inline CSS für PDF-Export
- Strukturierte Texte (keine Walls-of-Text)

### ❌ DON'T:
- Keine Alarm-Farben (Rot)
- Keine blinkenden Elemente
- Keine technischen Begriffe ohne Erklärung
- Keine Dopplungen von Informationen

---

## Wartung

### Neue Kategorie hinzufügen:

1. **In MEDICATION_CLASSIFICATIONS** (app.js Zeile 1-90):
```javascript
new_category: {
  keywords: [...],
  badge: {...},
  hint: '...'
}
```

2. **In CATEGORY_SPECIFIC_HINTS** (app.js Zeile ~1375):
```javascript
new_category: 'Medizinischer Hinweis für diese Kategorie...'
```

### Hinweistext ändern:

Einfach in `CATEGORY_SPECIFIC_HINTS` den gewünschten Text anpassen:
```javascript
benzodiazepines: 'Neuer Text für Benzodiazepine...'
```

---

## Deployment

```bash
# Build
npm run build

# Test lokal
pm2 restart medless
curl http://localhost:3000

# Deploy to Production
npx wrangler pages deploy dist --project-name medless --branch main
```

## Live URLs

- **Production:** https://medless.pages.dev
- **Latest Deployment:** https://e5da4002.medless.pages.dev

---

## Zusammenfassung

**4 neue Features** in der Ergebnisanzeige:
1. ✅ Erweiterte Kopfzeile mit Disclaimer
2. ✅ Kategorie-spezifische Hinweise (bis zu 4)
3. ✅ Wöchentliche Reduktionshinweise (wenn relevant)
4. ✅ Überarbeitete medizinische Hinweise (2 Bereiche)

**Design:** Ruhig, professionell, PDF-kompatibel
**Logik:** Keine Änderungen an Berechnungen
**Testing:** ✅ Lokal + Production deployed
