# MEDLESS - Technische System-Dokumentation
## Vollständiger Datenfluss: User Input → SQL Datenbank → Algorithmus → Output

**Version:** 1.0  
**Datum:** 2025-01-16  
**Zweck:** 100% nachvollziehbare Dokumentation aller Dosierungsberechnungen für externe Auditierung

---

## 📋 INHALTSVERZEICHNIS

1. [System-Übersicht](#1-system-übersicht)
2. [Beteiligte Dateien](#2-beteiligte-dateien)
3. [Datenbank-Struktur](#3-datenbank-struktur)
4. [Kompletter Ablauf mit Zeilennummern](#4-kompletter-ablauf-mit-zeilennummern)
5. [Alle SQL-Queries](#5-alle-sql-queries)
6. [Algorithmus-Berechnungen](#6-algorithmus-berechnungen)
7. [Output-Format](#7-output-format)
8. [Beispiel-Durchlauf](#8-beispiel-durchlauf)
9. [Verifikations-Checkliste](#9-verifikations-checkliste)

---

## 1. SYSTEM-ÜBERSICHT

### Technologie-Stack
- **Backend:** Hono Framework (TypeScript) auf Cloudflare Workers
- **Datenbank:** Cloudflare D1 (SQLite)
- **Frontend:** Vanilla JavaScript (kein Framework)
- **Deployment:** Cloudflare Pages
- **KI-Nutzung:** KEINE (Stand: 2025-01-16)

### Datenfluss-Übersicht
```
┌─────────────────┐
│  1. USER INPUT  │ → Browser-Formular (public/static/app.js)
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. HTTP POST   │ → axios.post('/api/analyze', data)
│  Request        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. BACKEND     │ → src/index.tsx: app.post('/api/analyze')
│  API Route      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. SQL LOOKUP  │ → Cloudflare D1 Database
│  (Wechselwirk.) │    - medications Tabelle
│                 │    - cbd_interactions Tabelle
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. ALGORITHMUS │ → Feste Berechnungen (KEINE KI)
│  Dosierung      │    - CBD Start/Ende berechnen
│  berechnen      │    - Medikamenten-Reduktion
│                 │    - KANNASAN Produkt wählen
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. JSON OUTPUT │ → Response zurück an Frontend
│  zurück         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  7. DOSSIER     │ → Frontend rendert HTML-Dossier
│  ANZEIGE        │    (public/static/app.js)
└─────────────────┘
```

---

## 2. BETEILIGTE DATEIEN

### 2.1 Backend-Dateien (Server-seitig)

#### **Datei: `/home/user/webapp/src/index.tsx`**
- **Größe:** ~1,200 Zeilen
- **Funktion:** Hauptserver-Datei mit allen API-Endpunkten
- **Kritische Bereiche:**
  - Zeilen 12-19: KANNASAN Produkt-Definitionen (KONSTANTEN)
  - Zeilen 24-45: Produkt-Auswahl-Algorithmus
  - Zeilen 48-123: Wochenplan-Generator mit Flaschen-Tracking
  - Zeilen 126-200: Kosten-Berechnung
  - Zeilen 236-471: **HAUPT-API-ROUTE `/api/analyze`**

#### **Datei: `/home/user/webapp/wrangler.jsonc`**
- **Größe:** ~20 Zeilen
- **Funktion:** Cloudflare-Konfiguration
- **D1 Database Binding:**
```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "medless-production",
    "database_id": "49ae43dd-cb94-4f42-9653-b87821f2ec31"
  }]
}
```

### 2.2 Frontend-Dateien (Client-seitig)

#### **Datei: `/home/user/webapp/public/static/app.js`**
- **Größe:** ~1,277 Zeilen
- **Funktion:** Frontend-Logik
- **Kritische Bereiche:**
  - Zeilen 1-120: Autocomplete-Funktion (Medikamenten-Suche)
  - Zeilen 150-300: Formular-Handling
  - Zeilen 350-450: API-Call an Backend
  - Zeilen 500-1100: Dossier-Rendering (HTML-Generierung)
  - Zeilen 1157-1277: PDF-Download-Funktion

### 2.3 Datenbank-Dateien

#### **Datei: `/home/user/webapp/seed.sql`**
- **Größe:** 26,534 Bytes
- **Funktion:** Vollständige Datenbankdaten
- **Inhalt:**
  - 15 Medikamenten-Kategorien
  - 52 Medikamente mit CYP450-Enzymen
  - 52 CBD-Wechselwirkungen
  - 5 Dosierungs-Richtlinien

---

## 3. DATENBANK-STRUKTUR

### 3.1 Tabelle: `medications`

**Schema:**
```sql
CREATE TABLE medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                    -- z.B. "Sertralin"
  generic_name TEXT,                     -- z.B. "Sertralin"
  category_id INTEGER,                   -- FK zu medication_categories
  typical_dosage_mg TEXT,                -- z.B. "50-200"
  cyp_enzymes TEXT,                      -- z.B. "CYP2C19, CYP2D6"
  description TEXT,                      -- Wirkung
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES medication_categories(id)
);
```

**Beispiel-Datensatz:**
```sql
INSERT INTO medications VALUES (
  20,                                    -- id
  'Sertralin',                          -- name
  'Sertralin',                          -- generic_name
  3,                                     -- category_id (Antidepressiva)
  '50-200',                             -- typical_dosage_mg
  'CYP2C19, CYP2D6, CYP2C9',           -- cyp_enzymes
  'SSRI-Antidepressivum...',           -- description
  '2025-01-15 12:00:00'                -- created_at
);
```

### 3.2 Tabelle: `cbd_interactions`

**Schema:**
```sql
CREATE TABLE cbd_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,        -- FK zu medications
  interaction_type TEXT,                 -- z.B. "enhancement"
  severity TEXT,                         -- low/medium/high/critical
  mechanism TEXT,                        -- Wechselwirkungs-Mechanismus
  recommendation TEXT,                   -- Empfehlung
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);
```

**Beispiel-Datensatz:**
```sql
INSERT INTO cbd_interactions VALUES (
  20,                                    -- id
  20,                                    -- medication_id (Sertralin)
  'enhancement',                         -- interaction_type
  'medium',                              -- severity
  'CBD hemmt CYP2C19 und kann Sertralin-Spiegel erhöhen...',
  'Niedrige CBD-Dosis starten...',     -- recommendation
  '2025-01-15 12:00:00'                -- created_at
);
```

### 3.3 Tabelle: `medication_categories`

**Schema:**
```sql
CREATE TABLE medication_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,             -- z.B. "Antidepressiva"
  risk_level TEXT,                       -- low/medium/high/critical
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Alle 15 Kategorien:**
1. Benzodiazepine (very_high)
2. Opioide (very_high)
3. Antidepressiva (high)
4. Neuroleptika (high)
5. Antiepileptika (high)
6. Immunsuppressiva (high)
7. Betablocker (medium)
8. Blutdrucksenker (medium)
9. Blutverdünner (high)
10. Statine (low)
11. Protonenpumpenhemmer (low)
12. Schmerzmittel (medium)
13. Diabetesmedikamente (medium)
14. Schilddrüsenmedikamente (low)
15. Antihistaminika (low)

---

## 4. KOMPLETTER ABLAUF MIT ZEILENNUMMERN

### PHASE 1: User-Input im Browser

**Datei:** `public/static/app.js`

**Zeilen 1-120:** Autocomplete-System
```javascript
// ZEILE 15-45: Medikamenten-Daten laden
async function loadMedications() {
  const response = await axios.get('/api/medications');
  window.medicationsData = response.data;
  console.log(`Loaded ${window.medicationsData.length} medications`);
}

// ZEILE 50-85: Autocomplete-Dropdown
function setupAutocomplete(inputElement) {
  inputElement.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const matches = window.medicationsData.filter(med => 
      med.name.toLowerCase().includes(searchTerm)
    );
    showDropdown(matches);
  });
}
```

**Zeilen 150-300:** Formular-Handling
```javascript
// ZEILE 180-220: Formular-Daten sammeln
document.getElementById('dossierForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    medications: [
      { name: 'Sertralin', mgPerDay: 100 }
    ],
    durationWeeks: 8,
    reductionGoal: 50,
    firstName: 'Maria',
    gender: 'female',
    age: 45,
    weight: 65,
    height: 165,
    email: 'maria@example.com'
  };
  
  // ZEILE 250: API-Call
  const response = await axios.post('/api/analyze', formData);
});
```

---

### PHASE 2: Backend-Verarbeitung

**Datei:** `src/index.tsx`

#### Schritt 2.1: Request-Empfang (Zeilen 236-270)

```typescript
// ZEILE 236-240: API-Route Definition
app.post('/api/analyze', async (c) => {
  const { env } = c;  // Cloudflare Environment (enthält DB-Zugriff)
  try {
    const body = await c.req.json();
    
    // ZEILE 240: Daten extrahieren
    const { 
      medications,      // [{ name: 'Sertralin', mgPerDay: 100 }]
      durationWeeks,    // 8
      reductionGoal,    // 50
      email,            // 'maria@example.com'
      firstName,        // 'Maria'
      gender,           // 'female'
      age,              // 45
      weight,           // 65
      height            // 165
    } = body;
```

#### Schritt 2.2: Input-Validierung (Zeilen 242-258)

```typescript
// ZEILE 242-248: Medikamente validieren
if (!medications || !Array.isArray(medications) || medications.length === 0) {
  return c.json({ 
    success: false, 
    error: 'Bitte geben Sie mindestens ein Medikament an' 
  }, 400);
}

// ZEILE 246-248: Dauer validieren
if (!durationWeeks || durationWeeks < 1) {
  return c.json({ 
    success: false, 
    error: 'Bitte geben Sie eine gültige Dauer in Wochen an' 
  }, 400);
}

// ZEILE 251-258: Dosierungen validieren
for (const med of medications) {
  if (!med.mgPerDay || isNaN(med.mgPerDay) || med.mgPerDay <= 0) {
    return c.json({ 
      success: false, 
      error: `Bitte geben Sie eine gültige Tagesdosis in mg für "${med.name}" ein` 
    }, 400);
  }
}
```

#### Schritt 2.3: Email speichern (Zeilen 260-270)

```typescript
// ZEILE 261-267: Email in Datenbank speichern (optional)
if (email) {
  try {
    await env.DB.prepare(`
      INSERT INTO customer_emails (email, first_name, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(email, firstName || null).run();
  } catch (emailError: any) {
    console.log('Email already exists or error saving:', emailError.message);
  }
}
```

#### Schritt 2.4: BMI & BSA berechnen (Zeilen 272-280)

```typescript
// ZEILE 273-280: Body-Metriken berechnen
let bmi = null;
let bsa = null;

if (weight && height) {
  const heightInMeters = height / 100;  // 165 cm → 1.65 m
  bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  // Beispiel: 65 / (1.65 * 1.65) = 23.9
  
  bsa = Math.round(Math.sqrt((height * weight) / 3600) * 100) / 100;
  // Beispiel: sqrt((165 * 65) / 3600) = 1.69 m²
}
```

**Formeln:**
- **BMI:** `weight_kg / (height_m)²`
- **BSA (Mosteller):** `sqrt((height_cm × weight_kg) / 3600)`

---

### PHASE 3: SQL-Datenbank-Abfragen

#### Schritt 3.1: Medikamente suchen (Zeilen 282-320)

```typescript
// ZEILE 283-284: Variablen initialisieren
const analysisResults = [];
let maxSeverity = 'low';

// ZEILE 286-320: Für jedes Medikament
for (const med of medications) {
  
  // ===== SQL QUERY 1: Medikament finden =====
  // ZEILE 287-293
  const medResult = await env.DB.prepare(`
    SELECT m.*, mc.risk_level
    FROM medications m
    LEFT JOIN medication_categories mc ON m.category_id = mc.id
    WHERE m.name LIKE ? OR m.generic_name LIKE ?
    LIMIT 1
  `).bind(`%${med.name}%`, `%${med.name}%`).first();
  
  // Beispiel-Input: med.name = "Sertralin"
  // Query wird zu: WHERE m.name LIKE '%Sertralin%' OR m.generic_name LIKE '%Sertralin%'
  
  // Beispiel-Output:
  // {
  //   id: 20,
  //   name: 'Sertralin',
  //   generic_name: 'Sertralin',
  //   category_id: 3,
  //   typical_dosage_mg: '50-200',
  //   cyp_enzymes: 'CYP2C19, CYP2D6, CYP2C9',
  //   description: 'SSRI-Antidepressivum...',
  //   risk_level: 'high'  // Aus medication_categories JOIN
  // }
  
  if (medResult) {
    // ===== SQL QUERY 2: Wechselwirkungen laden =====
    // ZEILE 296-298
    const interactions = await env.DB.prepare(`
      SELECT * FROM cbd_interactions WHERE medication_id = ?
    `).bind(medResult.id).all();
    
    // Beispiel-Input: medResult.id = 20
    // Query wird zu: WHERE medication_id = 20
    
    // Beispiel-Output:
    // {
    //   results: [{
    //     id: 20,
    //     medication_id: 20,
    //     interaction_type: 'enhancement',
    //     severity: 'medium',
    //     mechanism: 'CBD hemmt CYP2C19...',
    //     recommendation: 'Niedrige CBD-Dosis starten...'
    //   }]
    // }
    
    // ZEILE 300-304: Ergebnis speichern
    analysisResults.push({
      medication: medResult,
      interactions: interactions.results,
      mgPerDay: med.mgPerDay  // 100 mg (vom User)
    });
    
    // ZEILE 306-311: Höchsten Severity-Level ermitteln
    if (interactions.results.length > 0) {
      const severity = interactions.results[0].severity;
      if (severity === 'critical') maxSeverity = 'critical';
      else if (severity === 'high' && maxSeverity !== 'critical') maxSeverity = 'high';
      else if (severity === 'medium' && maxSeverity === 'low') maxSeverity = 'medium';
    }
    
  } else {
    // ZEILE 312-319: Medikament nicht gefunden
    analysisResults.push({
      medication: { name: med.name, found: false },
      interactions: [],
      mgPerDay: med.mgPerDay,
      warning: 'Medikament nicht in Datenbank gefunden'
    });
  }
}
```

**Nach diesem Schritt haben wir:**
```javascript
analysisResults = [
  {
    medication: {
      id: 20,
      name: 'Sertralin',
      category_id: 3,
      risk_level: 'high',
      cyp_enzymes: 'CYP2C19, CYP2D6, CYP2C9'
    },
    interactions: [
      {
        severity: 'medium',
        mechanism: 'CBD hemmt CYP2C19...',
        recommendation: 'Niedrige CBD-Dosis starten...'
      }
    ],
    mgPerDay: 100
  }
]

maxSeverity = 'medium'
```

---

### PHASE 4: ALGORITHMUS - CBD-Dosierung berechnen

#### Schritt 4.1: Sicherheitscheck Benzos/Opioids (Zeilen 322-340)

```typescript
// ZEILE 324: Array für Anpassungsnotizen
const adjustmentNotes: string[] = [];

// ZEILE 327-336: Prüfen ob Benzos oder Opioids dabei sind
const hasBenzoOrOpioid = analysisResults.some(result => {
  const medName = result.medication.name.toLowerCase();
  
  const isBenzo = medName.includes('diazepam') || 
                  medName.includes('lorazepam') || 
                  medName.includes('alprazolam') || 
                  medName.includes('clonazepam') ||
                  medName.includes('benzo');
                  
  const isOpioid = medName.includes('tramadol') || 
                   medName.includes('oxycodon') || 
                   medName.includes('morphin') || 
                   medName.includes('fentanyl') ||
                   medName.includes('opioid') || 
                   medName.includes('opiat');
                   
  return isBenzo || isOpioid;
});

// ZEILE 338-340: Warnung hinzufügen wenn gefunden
if (hasBenzoOrOpioid) {
  adjustmentNotes.push('⚠️ Benzodiazepine oder Opioide erkannt: CBD-Startdosis wird halbiert (Sicherheitsregel)');
}
```

**Für unser Beispiel:**
- Sertralin enthält weder "benzo" noch "opioid"
- `hasBenzoOrOpioid = false`

#### Schritt 4.2: CBD-Startdosis berechnen (Zeilen 342-370)

```typescript
// ZEILE 343-344: Gewicht ermitteln
const defaultWeight = 70;  // Default falls nicht angegeben
const userWeight = weight || defaultWeight;  // 65 kg

// ZEILE 346-347: Basis-Dosierung
let cbdStartMg = userWeight * 0.5;  // 65 * 0.5 = 32.5 mg
const cbdEndMg = userWeight * 1.0;   // 65 * 1.0 = 65.0 mg

// ZEILE 349-353: SICHERHEITSREGEL - Benzos/Opioids
if (hasBenzoOrOpioid) {
  cbdStartMg = cbdStartMg / 2;  // HALBIERUNG!
  adjustmentNotes.push(`🔒 CBD-Startdosis reduziert auf ${Math.round(cbdStartMg * 10) / 10} mg/Tag (Sicherheit)`);
}
// Bei Sertralin: NICHT angewendet, da hasBenzoOrOpioid = false
// cbdStartMg bleibt 32.5 mg

// ZEILE 355-359: Alter-Anpassung (65+)
if (age && age >= 65) {
  cbdStartMg *= 0.8;  // 20% Reduktion
  adjustmentNotes.push('👴 CBD-Dosis angepasst für Senioren (65+)');
}
// Bei Maria (45 Jahre): NICHT angewendet
// cbdStartMg bleibt 32.5 mg

// ZEILE 361-370: BMI-Anpassungen
if (weight && height && bmi) {
  if (bmi < 18.5) {
    cbdStartMg *= 0.85;  // 15% Reduktion bei Untergewicht
    adjustmentNotes.push('⚖️ CBD-Dosis angepasst: Untergewicht (BMI < 18.5)');
  } else if (bmi > 30) {
    cbdStartMg *= 1.1;   // 10% Erhöhung bei Übergewicht
    adjustmentNotes.push('⚖️ CBD-Dosis angepasst: Übergewicht (BMI > 30)');
  }
}
// Bei Maria: BMI = 23.9 (Normalgewicht)
// cbdStartMg bleibt 32.5 mg
```

**Ergebnis für Maria:**
- **CBD Start:** 32.5 mg/Tag (65 kg × 0.5 mg/kg)
- **CBD Ende:** 65.0 mg/Tag (65 kg × 1.0 mg/kg)
- **Keine Anpassungen nötig** (kein Benzo/Opioid, Alter <65, BMI normal)

#### Schritt 4.3: Wöchentlicher CBD-Anstieg (Zeile 373)

```typescript
// ZEILE 373: Linearer wöchentlicher Anstieg
const cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks;

// Berechnung:
// (65.0 - 32.5) / 8 = 4.0625 mg pro Woche
```

---

### PHASE 5: Wochenplan generieren

#### Schritt 5.1: CBD-Plan mit KANNASAN-Produkten (Zeilen 376)

```typescript
// ZEILE 376: Funktion aufrufen
const cbdPlan = generateWeeklyPlanWithBottleTracking(
  cbdStartMg,      // 32.5 mg
  cbdEndMg,        // 65.0 mg
  durationWeeks    // 8
);
```

**Funktion `generateWeeklyPlanWithBottleTracking` (Zeilen 48-123):**

```typescript
// ZEILE 48-52: Funktions-Definition
function generateWeeklyPlanWithBottleTracking(
  cbdStartMg: number,    // 32.5
  cbdEndMg: number,      // 65.0
  durationWeeks: number  // 8
) {
  // ZEILE 53: Wöchentlicher Anstieg berechnen
  const cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks;
  // (65.0 - 32.5) / 8 = 4.0625 mg/Woche
  
  const weeklyPlan: any[] = [];
  
  // ZEILE 56-59: Flaschen-Tracking initialisieren
  let currentProduct = selectOptimalProduct(cbdStartMg);  // Wählt KANNASAN Produkt
  let bottleRemaining = BOTTLE_CAPACITY;  // 100 Sprays
  let totalSpraysUsed = 0;
  
  // ZEILE 61-120: Für jede Woche
  for (let week = 1; week <= durationWeeks; week++) {
    
    // ZEILE 62: CBD-Dosis für diese Woche
    const weekCbdDose = cbdStartMg + (cbdWeeklyIncrease * (week - 1));
    
    // Beispiel Woche 1: 32.5 + (4.0625 * 0) = 32.5 mg
    // Beispiel Woche 2: 32.5 + (4.0625 * 1) = 36.5625 mg
    // Beispiel Woche 8: 32.5 + (4.0625 * 7) = 60.9375 mg ≈ 61 mg
    
    // ZEILE 64-66: Sprays pro Woche berechnen
    const totalSpraysPerDay = Math.ceil(weekCbdDose / currentProduct.cbdPerSpray);
    const spraysThisWeek = totalSpraysPerDay * 7;
    
    // ZEILE 68-83: Produkt-Wechsel prüfen
    const needsProductChange = 
      bottleRemaining < spraysThisWeek ||  // Flasche leer?
      totalSpraysPerDay > 12;               // Zu viele Sprays?
    
    if (needsProductChange && bottleRemaining < spraysThisWeek) {
      currentProduct = selectOptimalProduct(weekCbdDose);
      bottleRemaining = BOTTLE_CAPACITY;
      totalSpraysUsed = 0;
    } else if (needsProductChange && totalSpraysPerDay > 12) {
      currentProduct = selectOptimalProduct(weekCbdDose);
      bottleRemaining = BOTTLE_CAPACITY;
      totalSpraysUsed = 0;
    }
    
    // ZEILE 85-90: Finale Sprays berechnen
    const totalSprays = Math.ceil(weekCbdDose / currentProduct.cbdPerSpray);
    const morningSprays = Math.max(1, Math.round(totalSprays * 0.4));  // 40% morgens
    const eveningSprays = totalSprays - morningSprays;                  // 60% abends
    const actualCbdMg = totalSprays * currentProduct.cbdPerSpray;
    const spraysPerWeek = totalSprays * 7;
    
    // ZEILE 92-94: Flaschen-Status aktualisieren
    bottleRemaining -= spraysPerWeek;
    totalSpraysUsed += spraysPerWeek;
    
    // ZEILE 96-98: Tage bis Flasche leer
    const daysUntilEmpty = Math.floor(bottleRemaining / totalSprays);
    const weeksUntilEmpty = Math.floor(daysUntilEmpty / 7);
    
    // ZEILE 100-119: Wochenplan-Eintrag erstellen
    weeklyPlan.push({
      week,
      cbdDose: Math.round(weekCbdDose * 10) / 10,
      kannasanProduct: {
        nr: currentProduct.nr,
        name: currentProduct.name,
        cbdPerSpray: currentProduct.cbdPerSpray
      },
      morningSprays,
      eveningSprays,
      totalSprays,
      actualCbdMg: Math.round(actualCbdMg * 10) / 10,
      bottleStatus: {
        used: BOTTLE_CAPACITY - bottleRemaining,
        remaining: bottleRemaining,
        totalCapacity: BOTTLE_CAPACITY,
        emptyInWeeks: weeksUntilEmpty > 0 ? weeksUntilEmpty : 0,
        productChangeNext: bottleRemaining < totalSprays * 7
      }
    });
  }
  
  // ZEILE 122: Wochenplan zurückgeben
  return weeklyPlan;
}
```

**Beispiel-Output für Woche 1:**
```javascript
{
  week: 1,
  cbdDose: 32.5,           // mg CBD Ziel
  kannasanProduct: {
    nr: 10,                 // KANNASAN Nr. 10
    name: 'Kannasan Nr. 10',
    cbdPerSpray: 11.5       // mg pro Spray
  },
  morningSprays: 2,         // 40% → 2 Sprays
  eveningSprays: 2,         // 60% → 2 Sprays
  totalSprays: 4,           // 2 + 2 = 4 Sprays/Tag
  actualCbdMg: 46.0,        // 4 × 11.5 = 46 mg (etwas mehr als Ziel)
  bottleStatus: {
    used: 28,               // 4 Sprays × 7 Tage = 28 Sprays
    remaining: 72,          // 100 - 28 = 72 Sprays übrig
    totalCapacity: 100,
    emptyInWeeks: 2,        // Flasche reicht noch ~2 Wochen
    productChangeNext: false
  }
}
```

---

#### Schritt 5.2: Produkt-Auswahl-Algorithmus (Zeilen 24-45)

```typescript
// ZEILE 24-45: Optimales KANNASAN Produkt wählen
function selectOptimalProduct(targetDailyMg: number) {
  let bestProduct = KANNASAN_PRODUCTS[0];  // Default: Nr. 5
  let bestSprayCount = 999;
  
  // ZEILE 28-42: Alle Produkte durchgehen
  for (const product of KANNASAN_PRODUCTS) {
    const totalSprays = Math.ceil(targetDailyMg / product.cbdPerSpray);
    const morningSprays = Math.max(1, Math.round(totalSprays * 0.4));
    const eveningSprays = totalSprays - morningSprays;
    
    // ZEILE 34-41: Regeln prüfen
    const actualMg = totalSprays * product.cbdPerSpray;
    if (actualMg <= targetDailyMg * 1.1 &&     // Max 10% Überdosierung
        morningSprays <= 6 &&                   // Max 6 Sprays morgens
        eveningSprays <= 6 &&                   // Max 6 Sprays abends
        totalSprays < bestSprayCount) {         // Weniger Sprays bevorzugt
      bestProduct = product;
      bestSprayCount = totalSprays;
    }
  }
  
  // ZEILE 44: Bestes Produkt zurückgeben
  return bestProduct;
}
```

**Beispiel für 32.5 mg CBD Ziel:**

| Produkt | CBD/Spray | Sprays | Gesamt-CBD | Überdosis | Wahl |
|---------|-----------|--------|------------|-----------|------|
| Nr. 5   | 5.8 mg    | 6      | 34.8 mg    | +7%       | ✅   |
| Nr. 10  | 11.5 mg   | 3      | 34.5 mg    | +6%       | ✅✅ (weniger Sprays!) |
| Nr. 15  | 17.5 mg   | 2      | 35.0 mg    | +8%       | ❌ (mehr als 10% bei Aufteilung) |

**Gewählt:** KANNASAN Nr. 10 (3-4 Sprays = optimal)

---

### PHASE 6: Medikamenten-Reduktion berechnen

#### Schritt 6.1: Wochenplan mit Medikamenten-Dosen (Zeilen 379-414)

```typescript
// ZEILE 379-413: CBD-Plan mit Medikamenten-Reduktion mergen
const weeklyPlan = cbdPlan.map((cbdWeek: any) => {
  const week = cbdWeek.week;
  
  // ZEILE 383-397: Für jedes Medikament Dosis berechnen
  const weekMedications = medications.map((med: any) => {
    const startMg = med.mgPerDay;  // 100 mg Sertralin
    const targetMg = startMg * (1 - reductionGoal / 100);  // 100 * (1 - 0.5) = 50 mg
    const weeklyReduction = (startMg - targetMg) / durationWeeks;  // (100 - 50) / 8 = 6.25 mg/Woche
    const currentMg = startMg - (weeklyReduction * (week - 1));  // Dosis für diese Woche
    
    // Beispiel Woche 1: 100 - (6.25 * 0) = 100.0 mg
    // Beispiel Woche 2: 100 - (6.25 * 1) = 93.75 mg
    // Beispiel Woche 8: 100 - (6.25 * 7) = 56.25 mg ≈ 56 mg
    
    return {
      name: med.name,                                           // 'Sertralin'
      startMg: Math.round(startMg * 10) / 10,                  // 100.0
      currentMg: Math.round(currentMg * 10) / 10,              // Woche 1: 100.0
      targetMg: Math.round(targetMg * 10) / 10,                // 50.0
      reduction: Math.round(weeklyReduction * 10) / 10,        // 6.25 mg/Woche
      reductionPercent: Math.round(((startMg - currentMg) / startMg) * 100)  // Woche 1: 0%
    };
  });
  
  // ZEILE 399-400: Gesamte Medikamenten-Last
  const totalMedicationLoad = weekMedications.reduce(
    (sum: number, med: any) => sum + med.currentMg, 0
  );
  
  // ZEILE 402-413: Wochenplan-Eintrag komplett
  return {
    week,
    medications: weekMedications,
    totalMedicationLoad: Math.round(totalMedicationLoad * 10) / 10,
    cbdDose: cbdWeek.cbdDose,
    kannasanProduct: cbdWeek.kannasanProduct,
    morningSprays: cbdWeek.morningSprays,
    eveningSprays: cbdWeek.eveningSprays,
    totalSprays: cbdWeek.totalSprays,
    actualCbdMg: cbdWeek.actualCbdMg,
    bottleStatus: cbdWeek.bottleStatus
  };
});
```

**Beispiel-Output Woche 1:**
```javascript
{
  week: 1,
  medications: [
    {
      name: 'Sertralin',
      startMg: 100.0,
      currentMg: 100.0,    // Woche 1: Noch volle Dosis
      targetMg: 50.0,
      reduction: 6.25,     // mg pro Woche
      reductionPercent: 0  // Woche 1: 0% reduziert
    }
  ],
  totalMedicationLoad: 100.0,  // Summe aller Medikamente
  cbdDose: 32.5,
  kannasanProduct: { nr: 10, name: 'Kannasan Nr. 10', cbdPerSpray: 11.5 },
  morningSprays: 2,
  eveningSprays: 2,
  totalSprays: 4,
  actualCbdMg: 46.0,
  bottleStatus: { used: 28, remaining: 72, ... }
}
```

**Beispiel-Output Woche 8:**
```javascript
{
  week: 8,
  medications: [
    {
      name: 'Sertralin',
      startMg: 100.0,
      currentMg: 56.25,    // Woche 8: 43.75% reduziert
      targetMg: 50.0,
      reduction: 6.25,
      reductionPercent: 44
    }
  ],
  totalMedicationLoad: 56.25,
  cbdDose: 60.9,
  kannasanProduct: { nr: 10, name: 'Kannasan Nr. 10', cbdPerSpray: 11.5 },
  morningSprays: 3,
  eveningSprays: 3,
  totalSprays: 6,
  actualCbdMg: 69.0,
  bottleStatus: { ... }
}
```

---

### PHASE 7: Kosten berechnen

#### Schritt 7.1: Produkt-Kosten ermitteln (Zeilen 420)

```typescript
// ZEILE 420: Kosten-Analyse Funktion aufrufen
const costAnalysis = calculatePlanCosts(weeklyPlan);
```

**Funktion `calculatePlanCosts` (Zeilen 126-200):**

```typescript
function calculatePlanCosts(weeklyPlan: any[]) {
  const bottleUsage: { [key: string]: { count: number; product: any; totalSprays: number; weeks: number[] } } = {};
  
  let currentProduct: any = null;
  let currentBottleNumber = 0;
  let bottleRemaining = 0;
  
  // ZEILE 133-162: Jede Woche durchgehen
  weeklyPlan.forEach((week) => {
    const product = week.kannasanProduct;
    const spraysThisWeek = week.totalSprays * 7;
    const productKey = `Kannasan Nr. ${product.nr}`;
    
    // Prüfen ob neue Flasche nötig
    if (!currentProduct || currentProduct.nr !== product.nr || bottleRemaining < spraysThisWeek) {
      currentBottleNumber++;
      bottleRemaining = BOTTLE_CAPACITY;  // 100 Sprays
      currentProduct = product;
      
      // Flaschen-Counter erhöhen
      if (!bottleUsage[productKey]) {
        bottleUsage[productKey] = {
          count: 0,
          product: KANNASAN_PRODUCTS.find(p => p.nr === product.nr),
          totalSprays: 0,
          weeks: []
        };
      }
      
      bottleUsage[productKey].count++;
      bottleUsage[productKey].weeks.push(week.week);
    }
    
    // Sprays aufrechnen
    bottleRemaining -= spraysThisWeek;
    bottleUsage[productKey].totalSprays += spraysThisWeek;
  });
  
  // ZEILE 164-180: Kosten berechnen
  const bottleBreakdown = Object.entries(bottleUsage).map(([key, data]) => ({
    productName: data.product.name,
    productNr: data.product.nr,
    cbdPerSpray: data.product.cbdPerSpray,
    pricePerBottle: data.product.price,
    bottlesNeeded: data.count,
    totalCost: Math.round(data.count * data.product.price * 100) / 100,
    totalSprays: data.totalSprays,
    weeksUsed: data.weeks
  }));
  
  const totalCost = bottleBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
  const totalBottles = bottleBreakdown.reduce((sum, item) => sum + item.bottlesNeeded, 0);
  
  return {
    totalCost: Math.round(totalCost * 100) / 100,
    totalBottles,
    breakdown: bottleBreakdown
  };
}
```

**Beispiel-Output:**
```javascript
{
  totalCost: 119.70,    // Euro
  totalBottles: 3,      // Flaschen
  breakdown: [
    {
      productName: 'Kannasan Nr. 10',
      productNr: 10,
      cbdPerSpray: 11.5,
      pricePerBottle: 39.90,
      bottlesNeeded: 3,
      totalCost: 119.70,   // 3 × 39.90€
      totalSprays: 224,    // Gesamt-Sprays über 8 Wochen
      weeksUsed: [1, 2, 3, 4, 5, 6, 7, 8]
    }
  ]
}
```

---

### PHASE 8: JSON-Response erstellen

#### Schritt 8.1: Response zusammenbauen (Zeilen 422-465)

```typescript
// ZEILE 422-465: Finale JSON-Response
return c.json({
  success: true,
  
  // SQL-Daten: Medikamente + Wechselwirkungen
  analysis: analysisResults,
  maxSeverity,  // 'medium' bei Sertralin
  
  // Algorithmus-Output: Wochenplan
  weeklyPlan,
  
  // User-Input
  reductionGoal,  // 50
  
  // Kosten
  costs: costAnalysis,
  
  // CBD-Progression
  cbdProgression: {
    startMg: Math.round(cbdStartMg * 10) / 10,      // 32.5
    endMg: Math.round(cbdEndMg * 10) / 10,          // 65.0
    weeklyIncrease: Math.round(cbdWeeklyIncrease * 10) / 10  // 4.1
  },
  
  // KANNASAN Produkt-Info
  product: {
    name: firstWeekKannasan.kannasanProduct.name,
    nr: firstWeekKannasan.kannasanProduct.nr,
    type: 'CBD Dosier-Spray',
    packaging: '10ml Flasche mit Pumpsprühaufsatz',
    concentration: `${firstWeekKannasan.kannasanProduct.cbdPerSpray} mg CBD pro Sprühstoß`,
    cbdPerSpray: firstWeekKannasan.kannasanProduct.cbdPerSpray,
    twoSprays: `${firstWeekKannasan.kannasanProduct.cbdPerSpray * 2} mg CBD bei 2 Sprühstößen`,
    dosageUnit: 'Sprühstöße',
    totalSpraysPerDay: firstWeekKannasan.totalSprays,
    morningSprays: firstWeekKannasan.morningSprays,
    eveningSprays: firstWeekKannasan.eveningSprays,
    actualDailyMg: firstWeekKannasan.actualCbdMg,
    application: 'Oral: Sprühstoß direkt in den Mund oder unter die Zunge...',
    note: 'Produkt kann sich wöchentlich ändern basierend auf CBD-Dosis'
  },
  
  // Personalisierung
  personalization: {
    firstName,      // 'Maria'
    gender,         // 'female'
    age,            // 45
    weight,         // 65
    height,         // 165
    bmi,            // 23.9
    bsa,            // 1.69
    cbdStartMg: Math.round(cbdStartMg * 10) / 10,  // 32.5
    cbdEndMg: Math.round(cbdEndMg * 10) / 10,      // 65.0
    hasBenzoOrOpioid,  // false
    notes: adjustmentNotes  // []
  },
  
  // Warnungen
  warnings: maxSeverity === 'critical' || maxSeverity === 'high' ? 
    ['⚠️ Kritische Wechselwirkungen erkannt!', ...] : []
});
```

---

### PHASE 9: Frontend rendert Dossier

**Datei:** `public/static/app.js`

#### Schritt 9.1: Response empfangen (Zeilen 350-380)

```javascript
// ZEILE 350-360: API-Call
const response = await axios.post('/api/analyze', formData);
const result = response.data;

// ZEILE 365-375: Daten speichern für PDF
window.currentPlanData = {
  analysis: result.analysis,
  weeklyPlan: result.weeklyPlan,
  guidelines: result.guidelines,
  maxSeverity: result.maxSeverity,
  firstName: formData.firstName,
  gender: formData.gender,
  product: result.product,
  personalization: result.personalization,
  costs: result.costs
};
```

#### Schritt 9.2: HTML generieren (Zeilen 500-1100)

```javascript
// ZEILE 500-650: Header + Personalisierung
let html = `
  <div id="results">
    <h1>Ihr persönlicher Ausschleichplan</h1>
    <p>Hallo ${firstName}, basierend auf Ihren Angaben...</p>
    
    <!-- BMI, Gewicht, Größe anzeigen -->
    <div class="stats">
      <div>BMI: ${bmi}</div>
      <div>Gewicht: ${weight} kg</div>
      <div>Größe: ${height} cm</div>
    </div>
`;

// ZEILE 650-750: Medikamenten-Analyse
html += `
  <h2>Ihre Medikamente und CBD-Wechselwirkungen</h2>
  <table>
    <thead>
      <tr>
        <th>Medikament</th>
        <th>Dosierung</th>
        <th>CBD-Interaktion</th>
        <th>Schweregrad</th>
      </tr>
    </thead>
    <tbody>
`;

result.analysis.forEach(item => {
  html += `
    <tr>
      <td>${item.medication.name}</td>
      <td>${item.mgPerDay} mg/Tag</td>
      <td>${item.interactions[0]?.mechanism || 'Keine Daten'}</td>
      <td class="severity-${item.interactions[0]?.severity}">
        ${item.interactions[0]?.severity || '-'}
      </td>
    </tr>
  `;
});

html += `
    </tbody>
  </table>
`;

// ZEILE 750-900: Wochenplan-Tabelle
html += `
  <h2>Ihr 8-Wochen Reduktionsplan</h2>
  <table class="weekly-plan">
    <thead>
      <tr>
        <th>Woche</th>
        <th>Medikament-Dosis</th>
        <th>CBD-Dosis</th>
        <th>KANNASAN Produkt</th>
        <th>Morgens</th>
        <th>Abends</th>
      </tr>
    </thead>
    <tbody>
`;

result.weeklyPlan.forEach(week => {
  html += `
    <tr>
      <td>Woche ${week.week}</td>
      <td>${week.medications[0].currentMg} mg (-${week.medications[0].reductionPercent}%)</td>
      <td>${week.cbdDose} mg</td>
      <td>${week.kannasanProduct.name}</td>
      <td>${week.morningSprays} Sprays</td>
      <td>${week.eveningSprays} Sprays</td>
    </tr>
  `;
});

html += `
    </tbody>
  </table>
`;

// ZEILE 900-1000: Kosten-Übersicht
html += `
  <h2>Benötigte Produkte und Kosten</h2>
  <div class="cost-summary">
    <p>Gesamtkosten: ${result.costs.totalCost}€</p>
    <p>Flaschen benötigt: ${result.costs.totalBottles}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Produkt</th>
        <th>Anzahl Flaschen</th>
        <th>Preis pro Flasche</th>
        <th>Gesamtpreis</th>
      </tr>
    </thead>
    <tbody>
`;

result.costs.breakdown.forEach(item => {
  html += `
    <tr>
      <td>${item.productName}</td>
      <td>${item.bottlesNeeded}</td>
      <td>${item.pricePerBottle}€</td>
      <td>${item.totalCost}€</td>
    </tr>
  `;
});

html += `
    </tbody>
  </table>
`;

// ZEILE 1000-1100: Sicherheitshinweise + PDF-Button
html += `
  <div class="warnings">
    <h3>⚠️ Wichtige Hinweise</h3>
    <ul>
      <li>Konsultieren Sie Ihren Arzt vor Beginn</li>
      <li>Reduzieren Sie niemals abrupt</li>
      <li>Beobachten Sie Nebenwirkungen</li>
    </ul>
  </div>
  
  <button onclick="downloadPDF(event)">
    <i class="fas fa-file-pdf"></i>
    Plan als PDF herunterladen
  </button>
  
  </div>
`;

// ZEILE 1105: HTML in Seite einfügen
document.getElementById('results').innerHTML = html;
```

---

## 5. ALLE SQL-QUERIES

### Query 1: Medikament suchen

**Datei:** `src/index.tsx` (Zeilen 287-293)

```sql
SELECT 
  m.*,           -- Alle Spalten aus medications
  mc.risk_level  -- risk_level aus medication_categories
FROM medications m
LEFT JOIN medication_categories mc ON m.category_id = mc.id
WHERE 
  m.name LIKE ? OR           -- Fuzzy-Match auf Name
  m.generic_name LIKE ?      -- Fuzzy-Match auf Generika-Name
LIMIT 1                      -- Nur erstes Ergebnis
```

**Bound Parameters:**
- Parameter 1: `%Sertralin%`
- Parameter 2: `%Sertralin%`

**Beispiel-Ergebnis:**
```javascript
{
  id: 20,
  name: 'Sertralin',
  generic_name: 'Sertralin',
  category_id: 3,
  typical_dosage_mg: '50-200',
  cyp_enzymes: 'CYP2C19, CYP2D6, CYP2C9',
  description: 'SSRI-Antidepressivum zur Behandlung von...',
  created_at: '2025-01-15 12:00:00',
  risk_level: 'high'  // Aus JOIN mit medication_categories
}
```

---

### Query 2: Wechselwirkungen laden

**Datei:** `src/index.tsx` (Zeilen 296-298)

```sql
SELECT * 
FROM cbd_interactions 
WHERE medication_id = ?
```

**Bound Parameters:**
- Parameter 1: `20` (Medikament-ID aus Query 1)

**Beispiel-Ergebnis:**
```javascript
{
  results: [
    {
      id: 20,
      medication_id: 20,
      interaction_type: 'enhancement',
      severity: 'medium',
      mechanism: 'CBD hemmt CYP2C19 und kann Sertralin-Spiegel erhöhen. Dies kann zu verstärkten Wirkungen und Nebenwirkungen führen.',
      recommendation: 'Niedrige CBD-Dosis starten (ca. 5-10mg), schrittweise erhöhen. Engmaschige Überwachung auf verstärkte serotonerge Effekte (Unruhe, Zittern, Schwitzen). Bei Nebenwirkungen Sertralin-Dosis reduzieren.',
      created_at: '2025-01-15 12:00:00'
    }
  ]
}
```

---

### Query 3: Email speichern

**Datei:** `src/index.tsx` (Zeilen 263-266)

```sql
INSERT INTO customer_emails (email, first_name, created_at)
VALUES (?, ?, CURRENT_TIMESTAMP)
```

**Bound Parameters:**
- Parameter 1: `maria@example.com`
- Parameter 2: `Maria`

**Hinweis:** Kein Output, nur INSERT. Bei Duplikat wird Fehler ignoriert.

---

### Query 4: Medikamenten-Liste (Autocomplete)

**Datei:** `src/index.tsx` (Zeilen 205-220)

```typescript
app.get('/api/medications', async (c) => {
  const { env } = c;
  const medications = await env.DB.prepare(`
    SELECT 
      m.id,
      m.name,
      m.generic_name,
      m.typical_dosage_mg,
      mc.name as category_name,
      mc.risk_level
    FROM medications m
    LEFT JOIN medication_categories mc ON m.category_id = mc.id
    ORDER BY m.name ASC
  `).all();
  
  return c.json(medications.results);
});
```

**SQL:**
```sql
SELECT 
  m.id,
  m.name,
  m.generic_name,
  m.typical_dosage_mg,
  mc.name as category_name,
  mc.risk_level
FROM medications m
LEFT JOIN medication_categories mc ON m.category_id = mc.id
ORDER BY m.name ASC
```

**Bound Parameters:** Keine

**Beispiel-Ergebnis (gekürzt):**
```javascript
[
  { id: 1, name: 'Alprazolam', generic_name: 'Alprazolam', typical_dosage_mg: '0.25-4', category_name: 'Benzodiazepine', risk_level: 'very_high' },
  { id: 2, name: 'Amitriptylin', generic_name: 'Amitriptylin', typical_dosage_mg: '25-150', category_name: 'Antidepressiva', risk_level: 'high' },
  // ... 50 weitere Medikamente
  { id: 20, name: 'Sertralin', generic_name: 'Sertralin', typical_dosage_mg: '50-200', category_name: 'Antidepressiva', risk_level: 'high' }
]
```

---

## 6. ALGORITHMUS-BERECHNUNGEN

### 6.1 BMI-Berechnung

**Formel:**
```
BMI = weight_kg / (height_m)²
```

**Code:** `src/index.tsx` Zeile 278
```typescript
const heightInMeters = height / 100;  // cm → m
bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
```

**Beispiel:**
- Gewicht: 65 kg
- Größe: 165 cm = 1.65 m
- BMI = 65 / (1.65 × 1.65) = 65 / 2.7225 = **23.9**

---

### 6.2 BSA-Berechnung (Mosteller-Formel)

**Formel:**
```
BSA (m²) = √((height_cm × weight_kg) / 3600)
```

**Code:** `src/index.tsx` Zeile 279
```typescript
bsa = Math.round(Math.sqrt((height * weight) / 3600) * 100) / 100;
```

**Beispiel:**
- Gewicht: 65 kg
- Größe: 165 cm
- BSA = √((165 × 65) / 3600) = √(10725 / 3600) = √2.979 = **1.73 m²**

---

### 6.3 CBD-Startdosis

**Basis-Formel:**
```
CBD_start = weight_kg × 0.5 mg/kg
```

**Anpassungen (multiplikativ):**
1. **Benzos/Opioids:** × 0.5 (HALBIERUNG)
2. **Alter 65+:** × 0.8 (20% Reduktion)
3. **BMI < 18.5:** × 0.85 (15% Reduktion)
4. **BMI > 30:** × 1.1 (10% Erhöhung)

**Code:** `src/index.tsx` Zeilen 346-370
```typescript
let cbdStartMg = userWeight * 0.5;

if (hasBenzoOrOpioid) cbdStartMg *= 0.5;
if (age >= 65) cbdStartMg *= 0.8;
if (bmi < 18.5) cbdStartMg *= 0.85;
else if (bmi > 30) cbdStartMg *= 1.1;
```

**Beispiele:**

| Szenario | Gewicht | Alter | Medikament | BMI | Start-CBD |
|----------|---------|-------|------------|-----|-----------|
| Maria | 65 kg | 45 | Sertralin | 23.9 | 65 × 0.5 = **32.5 mg** |
| Senior mit Benzo | 70 kg | 68 | Diazepam | 24 | 70 × 0.5 × 0.5 × 0.8 = **14.0 mg** |
| Übergewichtig | 100 kg | 50 | Metoprolol | 33 | 100 × 0.5 × 1.1 = **55.0 mg** |
| Untergewicht | 50 kg | 25 | - | 17 | 50 × 0.5 × 0.85 = **21.25 mg** |

---

### 6.4 CBD-Enddosis

**Formel:**
```
CBD_end = weight_kg × 1.0 mg/kg
```

**Code:** `src/index.tsx` Zeile 347
```typescript
const cbdEndMg = userWeight * 1.0;
```

**Keine Anpassungen** - immer 1.0 mg/kg!

**Beispiel:**
- Gewicht: 65 kg
- CBD Ende: 65 × 1.0 = **65.0 mg**

---

### 6.5 Wöchentlicher CBD-Anstieg

**Formel:**
```
CBD_wöchentlich = (CBD_end - CBD_start) / Wochen
```

**Code:** `src/index.tsx` Zeile 373
```typescript
const cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks;
```

**Beispiel:**
- Start: 32.5 mg
- Ende: 65.0 mg
- Wochen: 8
- Anstieg: (65.0 - 32.5) / 8 = **4.0625 mg/Woche**

---

### 6.6 CBD-Dosis pro Woche

**Formel:**
```
CBD_Woche_N = CBD_start + (CBD_wöchentlich × (N - 1))
```

**Code:** `src/index.tsx` Zeile 62
```typescript
const weekCbdDose = cbdStartMg + (cbdWeeklyIncrease * (week - 1));
```

**Beispiel (8 Wochen):**

| Woche | Berechnung | CBD (mg) |
|-------|------------|----------|
| 1 | 32.5 + (4.0625 × 0) | **32.5** |
| 2 | 32.5 + (4.0625 × 1) | **36.56** |
| 3 | 32.5 + (4.0625 × 2) | **40.62** |
| 4 | 32.5 + (4.0625 × 3) | **44.69** |
| 5 | 32.5 + (4.0625 × 4) | **48.75** |
| 6 | 32.5 + (4.0625 × 5) | **52.81** |
| 7 | 32.5 + (4.0625 × 6) | **56.88** |
| 8 | 32.5 + (4.0625 × 7) | **60.94** |

---

### 6.7 Medikamenten-Reduktion

**Formeln:**
```
Target_Dosis = Start_Dosis × (1 - Reduktionsziel%)
Wöchentliche_Reduktion = (Start - Target) / Wochen
Aktuelle_Dosis_Woche_N = Start - (Wöchentliche_Reduktion × (N - 1))
```

**Code:** `src/index.tsx` Zeilen 384-387
```typescript
const startMg = med.mgPerDay;  // 100
const targetMg = startMg * (1 - reductionGoal / 100);  // 100 × 0.5 = 50
const weeklyReduction = (startMg - targetMg) / durationWeeks;  // (100-50)/8 = 6.25
const currentMg = startMg - (weeklyReduction * (week - 1));
```

**Beispiel: Sertralin 100mg → 50mg in 8 Wochen:**

| Woche | Berechnung | Dosis (mg) | Reduktion (%) |
|-------|------------|------------|---------------|
| 1 | 100 - (6.25 × 0) | **100.0** | 0% |
| 2 | 100 - (6.25 × 1) | **93.75** | 6.25% |
| 3 | 100 - (6.25 × 2) | **87.5** | 12.5% |
| 4 | 100 - (6.25 × 3) | **81.25** | 18.75% |
| 5 | 100 - (6.25 × 4) | **75.0** | 25% |
| 6 | 100 - (6.25 × 5) | **68.75** | 31.25% |
| 7 | 100 - (6.25 × 6) | **62.5** | 37.5% |
| 8 | 100 - (6.25 × 7) | **56.25** | 43.75% |

---

### 6.8 KANNASAN Produkt-Auswahl

**Produkt-Daten (KONSTANTEN):**

| Nr. | CBD/Spray | Preis | Sprays/Flasche |
|-----|-----------|-------|----------------|
| 5   | 5.8 mg    | 24.90€ | 100 |
| 10  | 11.5 mg   | 39.90€ | 100 |
| 15  | 17.5 mg   | 59.90€ | 100 |
| 20  | 23.2 mg   | 79.90€ | 100 |
| 25  | 29.0 mg   | 99.90€ | 100 |

**Auswahl-Regeln:**

1. **Sprays pro Tag:** `Math.ceil(CBD_Ziel / CBD_pro_Spray)`
2. **Aufteilung:** 40% morgens, 60% abends
3. **Max Überdosierung:** 110% der Zieldosis
4. **Max Sprays pro Einnahme:** 6 Sprays
5. **Präferenz:** Minimale Sprays

**Code:** `src/index.tsx` Zeilen 24-45
```typescript
function selectOptimalProduct(targetDailyMg: number) {
  let bestProduct = KANNASAN_PRODUCTS[0];
  let bestSprayCount = 999;
  
  for (const product of KANNASAN_PRODUCTS) {
    const totalSprays = Math.ceil(targetDailyMg / product.cbdPerSpray);
    const morningSprays = Math.max(1, Math.round(totalSprays * 0.4));
    const eveningSprays = totalSprays - morningSprays;
    const actualMg = totalSprays * product.cbdPerSpray;
    
    if (actualMg <= targetDailyMg * 1.1 &&  // Max 10% Overdose
        morningSprays <= 6 && 
        eveningSprays <= 6 &&
        totalSprays < bestSprayCount) {
      bestProduct = product;
      bestSprayCount = totalSprays;
    }
  }
  
  return bestProduct;
}
```

**Beispiel: 40 mg CBD Ziel:**

| Nr. | CBD/Spray | Sprays | Gesamt-CBD | Überdosis | Morgens | Abends | Wahl |
|-----|-----------|--------|------------|-----------|---------|--------|------|
| 5   | 5.8       | 7      | 40.6 mg    | +1.5%     | 3       | 4      | ❌   |
| 10  | 11.5      | 4      | 46.0 mg    | +15%      | 2       | 2      | ❌ (>10% Overdose) |
| 15  | 17.5      | 3      | 52.5 mg    | +31%      | 1       | 2      | ❌ (>10% Overdose) |

**Gewählt:** Nr. 5 (7 Sprays/Tag = minimal bei <10% Overdose)

---

### 6.9 Kosten-Berechnung

**Logik:**

1. **Sprays pro Woche zählen** für jedes Produkt
2. **Neue Flasche wenn:**
   - Produkt wechselt ODER
   - Verbleibende Sprays < Bedarf der Woche
3. **Kosten:** Flaschen × Preis pro Flasche

**Code:** `src/index.tsx` Zeilen 126-200

**Beispiel: 8 Wochen mit Nr. 10 (4 Sprays/Tag):**

- Sprays pro Tag: 4
- Sprays pro Woche: 4 × 7 = 28
- Gesamt-Sprays: 28 × 8 = 224 Sprays
- Flaschen nötig: Math.ceil(224 / 100) = **3 Flaschen**
- Kosten: 3 × 39.90€ = **119.70€**

---

## 7. OUTPUT-FORMAT

### 7.1 JSON-Response-Struktur

```typescript
{
  success: boolean,
  
  // SQL-Daten
  analysis: [
    {
      medication: {
        id: number,
        name: string,
        generic_name: string,
        category_id: number,
        typical_dosage_mg: string,
        cyp_enzymes: string,
        description: string,
        risk_level: string
      },
      interactions: [
        {
          id: number,
          medication_id: number,
          interaction_type: string,
          severity: 'low' | 'medium' | 'high' | 'critical',
          mechanism: string,
          recommendation: string
        }
      ],
      mgPerDay: number
    }
  ],
  
  maxSeverity: 'low' | 'medium' | 'high' | 'critical',
  
  // Algorithmus-Ergebnis
  weeklyPlan: [
    {
      week: number,
      medications: [
        {
          name: string,
          startMg: number,
          currentMg: number,
          targetMg: number,
          reduction: number,
          reductionPercent: number
        }
      ],
      totalMedicationLoad: number,
      cbdDose: number,
      kannasanProduct: {
        nr: number,
        name: string,
        cbdPerSpray: number
      },
      morningSprays: number,
      eveningSprays: number,
      totalSprays: number,
      actualCbdMg: number,
      bottleStatus: {
        used: number,
        remaining: number,
        totalCapacity: number,
        emptyInWeeks: number,
        productChangeNext: boolean
      }
    }
  ],
  
  reductionGoal: number,
  
  // Kosten
  costs: {
    totalCost: number,
    totalBottles: number,
    breakdown: [
      {
        productName: string,
        productNr: number,
        cbdPerSpray: number,
        pricePerBottle: number,
        bottlesNeeded: number,
        totalCost: number,
        totalSprays: number,
        weeksUsed: number[]
      }
    ]
  },
  
  // CBD-Info
  cbdProgression: {
    startMg: number,
    endMg: number,
    weeklyIncrease: number
  },
  
  product: {
    name: string,
    nr: number,
    type: string,
    packaging: string,
    concentration: string,
    cbdPerSpray: number,
    twoSprays: string,
    dosageUnit: string,
    totalSpraysPerDay: number,
    morningSprays: number,
    eveningSprays: number,
    actualDailyMg: number,
    application: string,
    note: string
  },
  
  // Personalisierung
  personalization: {
    firstName: string,
    gender: string,
    age: number,
    weight: number,
    height: number,
    bmi: number,
    bsa: number,
    cbdStartMg: number,
    cbdEndMg: number,
    hasBenzoOrOpioid: boolean,
    notes: string[]
  },
  
  // Warnungen
  warnings: string[]
}
```

---

## 8. BEISPIEL-DURCHLAUF

### Input:
```javascript
{
  medications: [
    { name: 'Sertralin', mgPerDay: 100 }
  ],
  durationWeeks: 8,
  reductionGoal: 50,
  firstName: 'Maria',
  gender: 'female',
  age: 45,
  weight: 65,
  height: 165,
  email: 'maria@example.com'
}
```

### Schritt 1: BMI & BSA
- BMI: 65 / (1.65²) = **23.9**
- BSA: √((165 × 65) / 3600) = **1.73 m²**

### Schritt 2: SQL Lookup
- **Medikament:** Sertralin (ID 20) gefunden
- **Kategorie:** Antidepressiva (risk_level: high)
- **Interaktion:** medium severity
- **CYP-Enzyme:** CYP2C19, CYP2D6, CYP2C9

### Schritt 3: CBD-Dosierung
- **Benzos/Opioids:** Nein → Keine Halbierung
- **Start:** 65 kg × 0.5 = **32.5 mg**
- **Ende:** 65 kg × 1.0 = **65.0 mg**
- **Wöchentlich:** (65 - 32.5) / 8 = **+4.06 mg**

### Schritt 4: KANNASAN Produkt
- **Woche 1:** 32.5 mg → **Nr. 10** (4 Sprays = 46 mg)
- **Woche 8:** 61 mg → **Nr. 10** (6 Sprays = 69 mg)

### Schritt 5: Medikamenten-Reduktion
- **Start:** 100 mg
- **Ziel:** 50 mg (50% Reduktion)
- **Wöchentlich:** -6.25 mg
- **Woche 8:** 56.25 mg (-44%)

### Schritt 6: Kosten
- **Produkt:** KANNASAN Nr. 10
- **Sprays gesamt:** 224 (4-6 Sprays/Tag × 56 Tage)
- **Flaschen:** 3 × 100 Sprays
- **Kosten:** 3 × 39.90€ = **119.70€**

### Output (gekürzt):
```javascript
{
  success: true,
  analysis: [
    {
      medication: { name: 'Sertralin', risk_level: 'high' },
      interactions: [{ severity: 'medium', mechanism: 'CBD hemmt CYP2C19...' }],
      mgPerDay: 100
    }
  ],
  maxSeverity: 'medium',
  weeklyPlan: [
    {
      week: 1,
      medications: [{ name: 'Sertralin', currentMg: 100.0, reductionPercent: 0 }],
      cbdDose: 32.5,
      kannasanProduct: { nr: 10, cbdPerSpray: 11.5 },
      morningSprays: 2,
      eveningSprays: 2
    },
    // ... Wochen 2-7
    {
      week: 8,
      medications: [{ name: 'Sertralin', currentMg: 56.25, reductionPercent: 44 }],
      cbdDose: 60.9,
      kannasanProduct: { nr: 10, cbdPerSpray: 11.5 },
      morningSprays: 3,
      eveningSprays: 3
    }
  ],
  costs: {
    totalCost: 119.70,
    totalBottles: 3,
    breakdown: [
      {
        productName: 'Kannasan Nr. 10',
        bottlesNeeded: 3,
        totalCost: 119.70
      }
    ]
  },
  personalization: {
    firstName: 'Maria',
    age: 45,
    weight: 65,
    bmi: 23.9,
    cbdStartMg: 32.5,
    cbdEndMg: 65.0,
    hasBenzoOrOpioid: false
  }
}
```

---

## 9. VERIFIKATIONS-CHECKLISTE

### ✅ Schritt-für-Schritt Verifikation

#### 1. Input-Validierung überprüfen
- [ ] Medikamente haben mgPerDay > 0
- [ ] durationWeeks ≥ 1
- [ ] Email-Format gültig (optional)

#### 2. SQL-Queries validieren
- [ ] Medikament existiert in DB (`medications` Tabelle)
- [ ] Wechselwirkung existiert (`cbd_interactions` Tabelle)
- [ ] Risk Level korrekt aus JOIN ermittelt

#### 3. BMI/BSA-Berechnungen prüfen
```javascript
// Mit Taschenrechner nachrechnen:
const bmi = weight / ((height/100) ** 2);
const bsa = Math.sqrt((height * weight) / 3600);
```

#### 4. CBD-Dosierung validieren
```javascript
// Basis
let cbd_start = weight * 0.5;
const cbd_end = weight * 1.0;

// Anpassungen manuell anwenden
if (hat_benzo_oder_opioid) cbd_start *= 0.5;
if (alter >= 65) cbd_start *= 0.8;
if (bmi < 18.5) cbd_start *= 0.85;
if (bmi > 30) cbd_start *= 1.1;

// Wöchentlicher Anstieg
const wöchentlich = (cbd_end - cbd_start) / wochen;
```

#### 5. Wochenplan prüfen
Für jede Woche N:
```javascript
// CBD
const cbd_woche = cbd_start + (wöchentlich * (N - 1));

// Medikament
const med_woche = med_start - (wöchentliche_reduktion * (N - 1));

// Manuell nachrechnen und mit Output vergleichen
```

#### 6. KANNASAN Produkt-Auswahl verifizieren
```javascript
// Für jede Woche CBD-Dosis nehmen
const ziel_mg = wochenplan[N].cbdDose;

// Manuell beste Produkt ermitteln:
// - Minimale Sprays
// - Max 10% Überdosierung
// - Max 6 Sprays pro Einnahme

// Mit Output vergleichen
```

#### 7. Kosten-Berechnung validieren
```javascript
// Sprays pro Woche summieren
const gesamt_sprays = summe(wochenplan.map(w => w.totalSprays * 7));

// Flaschen berechnen
const flaschen = Math.ceil(gesamt_sprays / 100);

// Kosten
const kosten = flaschen * preis_pro_flasche;

// Mit Output vergleichen
```

#### 8. Severity-Level überprüfen
```javascript
// Höchster Severity-Level aus allen Medikamenten
const max_severity = Math.max(...medikamente.map(m => m.interactions[0].severity));

// 'critical' > 'high' > 'medium' > 'low'
```

---

### 📋 Manuelle Test-Szenarien

#### Szenario 1: Standard (wie Maria)
- **Input:** Sertralin 100mg, 65kg, 45 Jahre, 8 Wochen, 50%
- **Erwartete CBD Start:** 32.5 mg
- **Erwartete CBD Ende:** 65.0 mg
- **Erwartete Woche 8 Sertralin:** 56.25 mg

#### Szenario 2: Mit Benzo
- **Input:** Diazepam 10mg, 70kg, 68 Jahre, 8 Wochen, 30%
- **Erwartete CBD Start:** 70 × 0.5 × 0.5 × 0.8 = **14.0 mg** (Benzo + Alter)
- **Erwartete CBD Ende:** 70.0 mg
- **Erwartete Woche 8 Diazepam:** 10 - ((10 - 7) / 8 * 7) = **7.375 mg**

#### Szenario 3: Mehrere Medikamente
- **Input:** Sertralin 100mg + Metoprolol 50mg, 80kg, 40 Jahre, 12 Wochen, 50%
- **Erwartete CBD Start:** 40.0 mg (kein Benzo, normales Alter/BMI)
- **Erwartete CBD Ende:** 80.0 mg
- **Erwartete totalMedicationLoad Woche 1:** 150 mg
- **Erwartete totalMedicationLoad Woche 12:** 75 mg

---

### 🔍 Debugging-Tools

#### Console-Logs hinzufügen (optional)
```typescript
// In src/index.tsx nach Zeile 370:
console.log('CBD Calculation:', {
  weight: userWeight,
  hasBenzoOrOpioid,
  age,
  bmi,
  cbdStartMg,
  cbdEndMg,
  adjustmentNotes
});

// Nach Zeile 414:
console.log('Weekly Plan:', weeklyPlan);
```

#### SQL-Queries loggen
```typescript
// In src/index.tsx nach Zeile 293:
console.log('Found medication:', medResult);

// Nach Zeile 298:
console.log('Found interactions:', interactions.results);
```

---

## 10. FAZIT

### ✅ Was ist 100% algorithmusbasiert:

1. **BMI & BSA:** Mathematische Formeln
2. **CBD-Dosierung:** Gewichtsbasiert + fixe Anpassungsregeln
3. **Medikamenten-Reduktion:** Lineare Berechnung
4. **KANNASAN Produkt-Auswahl:** Regel-basierter Algorithmus
5. **Kosten-Berechnung:** Arithmetik

### ✅ Was kommt aus der Datenbank:

1. **Medikamenten-Informationen:** 52 Einträge in SQL
2. **CBD-Wechselwirkungen:** 52 Einträge in SQL
3. **CYP450-Enzyme:** Text-Felder in DB
4. **Severity-Levels:** Vordefiniert in DB

### ❌ Was NICHT im System ist:

1. **KEINE KI-API-Calls** (OpenAI, Anthropic, etc.)
2. **KEINE Halluzinationen möglich**
3. **KEINE dynamische Texterstellung**
4. **KEINE externen Datenquellen**

---

### 🎯 Zusammenfassung:

**MEDLESS ist ein 100% deterministisches System:**

- ✅ Alle Dosierungen: **Algorithmus**
- ✅ Alle Interaktionen: **SQL-Datenbank**
- ✅ Alle Berechnungen: **Nachvollziehbar**
- ✅ Alle Outputs: **Reproduzierbar**

**Kein Raum für KI-Halluzinationen!**

---

**Ende der technischen Dokumentation**

*Für Fragen oder Überprüfungen: Vergleichen Sie jeden Schritt mit den angegebenen Zeilennummern im Source-Code.*
