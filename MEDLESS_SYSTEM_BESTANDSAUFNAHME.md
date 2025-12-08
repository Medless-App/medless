# MEDLESS SYSTEM BESTANDSAUFNAHME
**Datum:** 8. Dezember 2025  
**Status:** READ-ONLY Analyse abgeschlossen  
**Datenbank:** medless-production (Cloudflare D1, lokal + remote)

---

## TEIL_A_HUMAN_READABLE

---

## 1. TABELLENÜBERSICHT

Die MEDLESS-Datenbank enthält **9 Tabellen** (inkl. Metadaten):

### 1.1 Kerntabellen (Medikamentenmanagement)

#### **medications** (51 Zeilen)
**Zweck:** Zentrale Medikamentenliste mit pharmakologischen Eigenschaften

**Spalten:**
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (TEXT, UNIQUE, NOT NULL) - Handelsname
- `generic_name` (TEXT) - Generischer Wirkstoffname
- `category_id` (INTEGER, FK → medication_categories.id)
- `cyp450_enzyme` (TEXT) - CYP-Enzyme (z.B. "CYP3A4,CYP2C9")
- `description` (TEXT)
- `common_dosage` (TEXT)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**Pharmakokinetische Felder (Migration 0005 - ALLE AKTUELL NULL):**
- `half_life_hours` (REAL) - Halbwertszeit in Stunden
- `therapeutic_min_ng_ml` (REAL) - Therapeutisches Minimum
- `therapeutic_max_ng_ml` (REAL) - Therapeutisches Maximum  
- `withdrawal_risk_score` (INTEGER) - Absetzrisiko 0-10
- `max_weekly_reduction_pct` (REAL) - Max. Reduktion pro Woche in %
- `can_reduce_to_zero` (INTEGER) - Vollreduktion erlaubt (0/1)
- `cbd_interaction_strength` (TEXT) - CBD-Interaktionsstärke (low/medium/high/critical)

**Anzahl Zeilen:** 51

**KRITISCHER HINWEIS:** Die pharmakokinetischen Felder (half_life_hours, withdrawal_risk_score, etc.) sind bei ALLEN 51 Medikamenten NULL. Die Datei `final_patch_medications_to_200.sql` enthält UPDATE-Statements für diese Felder, wurde aber nie ausgeführt.

---

#### **medication_categories** (20 Zeilen)
**Zweck:** Medikamentenkategorien mit Sicherheitsregeln

**Spalten:**
- `id` (INTEGER, PK, AUTOINCREMENT)
- `name` (TEXT, UNIQUE, NOT NULL)
- `description` (TEXT)
- `risk_level` (TEXT, CHECK: 'low'/'medium'/'high'/'very_high', DEFAULT 'medium')
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**Sicherheitsfelder (Migration 0004 - ALLE AKTUELL NULL):**
- `can_reduce_to_zero` (INTEGER) - Vollreduktion kategorial erlaubt
- `default_min_target_fraction` (REAL) - Minimale Zieldosis (0.0-1.0)
- `max_weekly_reduction_pct` (REAL) - Max. wöchentliche Reduktion
- `requires_specialist` (INTEGER) - Fachärztliche Begleitung nötig
- `notes` (TEXT) - Sicherheitshinweise

**Anzahl Zeilen:** 20

**Kategorien-Liste:**
| ID | Name | risk_level | Beschreibung |
|----|------|------------|--------------|
| 0 | Allgemeine Medikation | low | Standardkategorie |
| 1 | Blutverdünner | high | Antikoagulanzien |
| 2 | Antidepressiva | medium | Depression |
| 3 | Antiepileptika | high | Epilepsie |
| 4 | Schmerzmittel | low | Analgetika/NSAIDs |
| 5 | Psychopharmaka | high | Antipsychotika/Benzos |
| 6 | Statine | low | Cholesterinsenker |
| 7 | Antibiotika | low | Antibakteriell |
| 8 | Immunsuppressiva | very_high | Immunsuppression |
| 9 | Schilddrüsenmedikamente | medium | Hormone |
| 10 | Antikoagulantien | high | Blutgerinnungshemmer |
| 11 | Blutdrucksenker | medium | Antihypertensiva |
| 12 | Protonenpumpenhemmer | low | Magensäureblocker |
| 13 | Diabetesmedikamente | medium | Antidiabetika |
| 14 | Asthma-Medikamente | medium | Bronchodilatatoren |
| 15 | ADHS-Medikamente | medium | Stimulanzien |
| 16 | Opioide | very_high | Starke Schmerzmittel |
| 17 | Beta-Blocker | medium | Herzmedikamente |
| 18 | Diuretika | medium | Entwässerung |
| 19 | Kortikosteroide | high | Entzündungshemmer |

**Risk-Level-Verteilung:**
- `very_high`: 2 Kategorien (Immunsuppressiva, Opioide)
- `high`: 5 Kategorien (Blutverdünner, Antiepileptika, Psychopharmaka, Antikoagulantien, Kortikosteroide)
- `medium`: 8 Kategorien (Antidepressiva, Schilddrüse, Blutdrucksenker, Diabetes, Asthma, ADHS, Beta-Blocker, Diuretika)
- `low`: 5 Kategorien (Allgemein, Schmerzmittel, Statine, Antibiotika, PPI)

---

### 1.2 Wechselwirkungstabellen

#### **cbd_interactions** (51 Zeilen)
**Zweck:** CBD-Wechselwirkungen pro Medikament

**Spalten:**
- `id` (INTEGER, PK, AUTOINCREMENT)
- `medication_id` (INTEGER, NOT NULL, FK → medications.id)
- `interaction_type` (TEXT, CHECK, NOT NULL) - Werte: 'inhibition', 'enhancement', 'reduction', 'neutral', 'risk', 'uncertain', 'interaction'
- `severity` (TEXT, CHECK, NOT NULL) - Werte: 'low', 'medium', 'high', 'critical'
- `description` (TEXT, NOT NULL) - Beschreibung der Wechselwirkung
- `mechanism` (TEXT) - Wirkmechanismus
- `recommendation` (TEXT) - Empfehlung
- `source_url` (TEXT)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**Anzahl Zeilen:** 51 (1 Eintrag pro Medikament)

**Verteilung nach interaction_type und severity:**
- `enhancement + high`: 16
- `enhancement + medium`: 16
- `enhancement + low`: 10
- `enhancement + critical`: 5
- `neutral + low`: 4

**Beispiel:**
```
medication_id: 1 (Marcumar/Warfarin)
interaction_type: enhancement
severity: critical
description: "CBD kann die blutverdünnende Wirkung von Warfarin deutlich verstärken, 
             was zu erhöhtem Blutungsrisiko führt."
```

---

#### **cbd_dosage_guidelines** (0 Zeilen)
**Zweck:** CBD-Dosierrichtlinien nach Bedingung

**Spalten:**
- `id` (INTEGER, PK, AUTOINCREMENT)
- `condition_type` (TEXT, NOT NULL)
- `min_dosage_mg` (INTEGER, NOT NULL)
- `max_dosage_mg` (INTEGER, NOT NULL)
- `recommended_start_mg` (INTEGER, NOT NULL)
- `adjustment_period_days` (INTEGER, DEFAULT 7)
- `notes` (TEXT)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**Anzahl Zeilen:** 0 (leer)

---

### 1.3 Benutzerdaten

#### **user_plans** (0 Zeilen)
**Zweck:** Gespeicherte Reduktionspläne

**Spalten:**
- `id` (INTEGER, PK, AUTOINCREMENT)
- `email` (TEXT)
- `medications_input` (TEXT) - JSON oder Text
- `duration_weeks` (INTEGER, NOT NULL)
- `recommended_cbd_dosage` (TEXT)
- `generated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**Anzahl Zeilen:** 0 (keine Pläne gespeichert)

---

#### **customer_emails** (0 Zeilen)
**Zweck:** E-Mail-Adressen für Marketing

**Spalten:**
- `id` (INTEGER, PK, AUTOINCREMENT)
- `email` (TEXT, NOT NULL)
- `first_name` (TEXT)
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**Anzahl Zeilen:** 0

---

### 1.4 Metadaten

#### **d1_migrations** (7 Zeilen)
**Zweck:** Migrationshistorie (Wrangler D1)

**Migrations:**
1. `0001_initial_schema.sql`
2. `0002_add_customer_emails.sql`
3. `0003_expand_interaction_types.sql`
4. `0004_add_category_safety_rules.sql`
5. `0005_medication_pharma_fields.sql`
6. `0006_update_high_risk_categories_safety_rules.sql`
7. `0007_add_default_general_category.sql`

---

#### **sqlite_sequence** (System)
SQLite-interne Sequenzverwaltung für AUTOINCREMENT

---

#### **_cf_METADATA** (System)
Cloudflare D1-spezifische Metadaten

---

## 2. MEDIKAMENTE & KATEGORIEN – KONSISTENZ

### 2.1 Konsistenz-Check

**Total Medications:** 51  
**Total Categories:** 20

#### Status-Verteilung:

| Status | Anzahl | Beschreibung |
|--------|--------|--------------|
| **OK** | 51 | Gültige category_id vorhanden |
| **FEHLENDE_KATEGORIE** | 0 | NULL oder ungültige category_id |
| **FALLBACK_KATEGORIE** | 0 | Kategorie 0 ("Allgemeine Medikation") |

**ERGEBNIS:** ✅ Alle 51 Medikamente haben eine gültige Kategorie-Zuordnung.

---

### 2.2 Beispiel-Medikamente pro Kategorie

| Kategorie | Medikamente (Auswahl) |
|-----------|-----------------------|
| **Blutverdünner (1)** | Marcumar, Xarelto, Eliquis, Plavix |
| **Antidepressiva (2)** | Prozac, Zoloft, Cipralex, Trevilor, Cymbalta, Saroten, Stangyl, Elontril |
| **Antiepileptika (3)** | Keppra, Lamictal, Depakote, Trileptal, Onfi, Lyrica |
| **Schmerzmittel (4)** | Ibuprofen, Aspirin, Voltaren, Tramal, OxyContin, Novalgin, Imodium |
| **Psychopharmaka (5)** | Tavor, Valium, Rivotril, Lexotanil, Zyprexa, Abilify |
| **Statine (6)** | Sortis, Zocor |
| **Immunsuppressiva (8)** | Sandimmun, Prograf, Femara |
| **Schilddrüse (9)** | L-Thyroxin |
| **Blutdrucksenker (11)** | Zestril, Blopress, Norvasc, Diovan |
| **PPI (12)** | Antra, Agopton, Pantozol, Zantac |
| **Diabetes (13)** | Glucophage, Januvia |
| **Asthma (14)** | Ventolin, Singulair, Flutide |
| **ADHS (15)** | Medikinet |

---

## 3. LOW-/HIGH-RISK-VERFAHREN (RISIKOMODELL)

### 3.1 Risiko-Datenquellen

Das MEDLESS-Risikomodell verwendet **zwei hierarchische Ebenen**:

#### **Ebene 1: Kategorie-basiertes Risiko** (medication_categories.risk_level)

**Quelle:** `medication_categories.risk_level`  
**Werte:** `low`, `medium`, `high`, `very_high`  
**Status:** ✅ Vollständig ausgefüllt (alle 20 Kategorien haben risk_level)

**Verteilung:**
- `very_high`: 2 Kategorien (10%) - Immunsuppressiva, Opioide
- `high`: 5 Kategorien (25%) - Blutverdünner, Antiepileptika, Psychopharmaka, Antikoagulantien, Kortikosteroide
- `medium`: 8 Kategorien (40%) - Antidepressiva, Schilddrüse, Blutdrucksenker, etc.
- `low`: 5 Kategorien (25%) - Allgemein, Schmerzmittel, Statine, Antibiotika, PPI

---

#### **Ebene 2: Medikamenten-spezifisches Risiko** (medications.withdrawal_risk_score)

**Quelle:** `medications.withdrawal_risk_score`  
**Skala:** 0-10 (Integer)  
**Status:** ❌ **ALLE 51 MEDIKAMENTE HABEN NULL** (Daten nicht geladen)

**WICHTIG:** Die Datei `final_patch_medications_to_200.sql` enthält UPDATE-Statements für `withdrawal_risk_score`, wurde aber nie ausgeführt. Beispiele aus der Datei:

```sql
-- Blutverdünner
UPDATE medications SET withdrawal_risk_score = 10 WHERE id = 1; -- Warfarin
UPDATE medications SET withdrawal_risk_score = 10 WHERE id = 2; -- Rivaroxaban

-- Antidepressiva
UPDATE medications SET withdrawal_risk_score = 8 WHERE id = 5; -- Fluoxetin
UPDATE medications SET withdrawal_risk_score = 8 WHERE id = 6; -- Sertralin

-- Schmerzmittel
UPDATE medications SET withdrawal_risk_score = 3 WHERE id = 18; -- Ibuprofen
UPDATE medications SET withdrawal_risk_score = 8 WHERE id = 21; -- Tramadol
UPDATE medications SET withdrawal_risk_score = 9 WHERE id = 22; -- Oxycodon
```

**Schwellenwerte (aus Code abgeleitet):**
- Score >= 7: "Hohes Absetzrisiko" → Warnung im Plan
- Score < 7: Normal

---

### 3.2 Weitere Risiko-Felder

#### **CBD-Interaktionsstärke** (medications.cbd_interaction_strength)

**Quelle:** `medications.cbd_interaction_strength`  
**Werte:** `low`, `medium`, `high`, `critical`  
**Status:** ❌ ALLE NULL (Daten nicht geladen)

**Verwendung im Code:**
- `critical`: 🚨 "Kritische CBD-Wechselwirkung - Engmaschige ärztliche Kontrolle erforderlich"
- `high`: ⚠️ "Starke CBD-Wechselwirkung - Vorsicht bei gleichzeitiger Einnahme"
- `medium`/`low`: Keine spezielle Warnung

---

#### **Halbwertszeit** (medications.half_life_hours)

**Quelle:** `medications.half_life_hours`  
**Einheit:** Stunden (REAL)  
**Status:** ❌ ALLE NULL

**Verwendung in Berechnungen:**
- Berechnung "Steady State Days" = (half_life_hours × 5) / 24
- **Lange Halbwertszeit** (> 7 Tage Steady State):
  - Reduktionsgeschwindigkeit auf 50% verlangsamt
  - Beispiel: Fluoxetin (96h Halbwertszeit) → 20 Tage Steady State
- **Mittlere Halbwertszeit** (3-7 Tage):
  - Reduktionsgeschwindigkeit auf 75% angepasst

---

### 3.3 Risiko-Logik Zusammenfassung

**Hierarchie der Risikobestimmung:**

1. **Kategorie-Risiko** (`risk_level`) → IMMER verwendet (ausgefüllt)
2. **Medikamenten-Risiko** (`withdrawal_risk_score`) → Aktuell NICHT verwendet (alle NULL)
3. **CBD-Interaktion** (`cbd_interaction_strength`) → Aktuell NICHT verwendet (alle NULL)
4. **Pharmakologische Faktoren** (`half_life_hours`) → Aktuell NICHT verwendet (alle NULL)

**FAZIT:** Das System nutzt momentan **NUR das kategorie-basierte Risikomodell**. Alle medikamenten-spezifischen Risikodaten sind vorhanden (im Code implementiert), aber die Datenbankfelder sind leer.

---

## 4. BERECHNUNGSLOGIK – WIE WIRD EIN PLAN BERECHNET?

### 4.1 API-Endpunkte

**Primärer Endpunkt:** `POST /api/analyze`  
**Erweitert:** `POST /api/analyze-and-reports` (inkl. PDF-Reports)

**Codebasis:** `/home/user/webapp/src/index.tsx` (7.645 Zeilen)  
**Zentrale Funktion:** `buildAnalyzeResponse()` (ab Zeile 419)

---

### 4.2 Ablauf der Planberechnung (Schritt für Schritt)

#### **SCHRITT 1: Eingabe-Validierung**

**Input vom Frontend:**
```typescript
{
  medications: [
    { name: "Ibuprofen", mgPerDay: 400 },
    { name: "Tavor", dailyDoseMg: 2.5 }
  ],
  durationWeeks: 8,
  reductionGoal: 50,  // Prozent
  weight: 75,         // kg (optional)
  height: 180,        // cm (optional)
  age: 45,            // optional
  gender: "male",     // optional
  email: "test@example.com"  // optional
}
```

**Validierung:**
- Mindestens 1 Medikament erforderlich
- Jedes Medikament muss `mgPerDay` > 0 haben
- `durationWeeks` >= 1
- Normalisierung: `dailyDoseMg` → `mgPerDay`

**Tabellen:** Keine (nur Validierung)

---

#### **SCHRITT 2: Medikamentendaten laden**

**SQL-Query (pro Medikament):**
```sql
SELECT m.*, 
       mc.name as category_name,
       mc.risk_level,
       mc.can_reduce_to_zero,
       mc.default_min_target_fraction,
       mc.max_weekly_reduction_pct,
       mc.requires_specialist,
       mc.notes as category_notes,
       m.half_life_hours,
       m.therapeutic_min_ng_ml,
       m.therapeutic_max_ng_ml,
       m.withdrawal_risk_score,
       m.cbd_interaction_strength
FROM medications m
LEFT JOIN medication_categories mc ON m.category_id = mc.id
WHERE m.name LIKE '%{name}%' OR m.generic_name LIKE '%{name}%'
LIMIT 1
```

**Tabellen:** `medications`, `medication_categories` (LEFT JOIN)

**Felder verwendet:**
- `medications.*`: Alle Medikamenteninfos
- `medication_categories.risk_level`: Risikostufe der Kategorie
- `medication_categories.can_reduce_to_zero`: Reduktions-Limit
- `medication_categories.max_weekly_reduction_pct`: Geschwindigkeitslimit
- `medications.half_life_hours`: Halbwertszeit (aktuell NULL)
- `medications.withdrawal_risk_score`: Absetzrisiko (aktuell NULL)
- `medications.cbd_interaction_strength`: CBD-Interaktion (aktuell NULL)

---

#### **SCHRITT 3: CBD-Wechselwirkungen laden**

**SQL-Query:**
```sql
SELECT * FROM cbd_interactions WHERE medication_id = ?
```

**Tabellen:** `cbd_interactions`

**Felder verwendet:**
- `interaction_type`: Typ (enhancement/inhibition/etc.)
- `severity`: Schweregrad (low/medium/high/critical)
- `description`: Beschreibung
- `recommendation`: Empfehlung

**Logik:** Maximale Severity über alle Medikamente ermitteln (für globale Warnungen)

---

#### **SCHRITT 4: Benutzerdaten verarbeiten**

**BMI-Berechnung:**
```
BMI = weight / (height_in_meters²)
```

**BSA-Berechnung (Körperoberfläche):**
```
BSA = √((height × weight) / 3600)
```

**Idealgewicht (Devine-Formel):**
- Männer: 50 + 0.9 × (height - 152)
- Frauen: 45.5 + 0.9 × (height - 152)

**Tabellen:** Keine (nur Berechnungen)

---

#### **SCHRITT 5: Sicherheitsregeln anwenden** (Funktion: `applyCategorySafetyRules`)

**Input:**
- `startMg`: Aktuelle Tagesdosis
- `reductionGoal`: Gewünschte Reduktion in %
- `durationWeeks`: Zeitraum
- `medicationName`: Name
- `category`: MedicationWithCategory-Objekt

**Berechnung:**

```typescript
// Basis-Zieldosis
targetFraction = 1 - (reductionGoal / 100)
desiredTargetMg = startMg × targetFraction

// Wöchentliche Reduktion (Basis)
weeklyReductionBase = (startMg - desiredTargetMg) / durationWeeks
```

**REGEL 1: Vollreduktions-Check**
```typescript
if (category.can_reduce_to_zero === 0 || 
    category.risk_level === 'very_high') {
  
  if (category.default_min_target_fraction > 0) {
    targetFraction = max(targetFraction, category.default_min_target_fraction)
    // Beispiel: default_min_target_fraction = 0.5 → max. 50% Reduktion
  } else {
    targetFraction = 0.5  // Fallback: Min. 50% Erhaltungsdosis
  }
  
  safetyNote: "🔒 Keine Vollreduktion möglich - Minimum 50%"
}
```

**Tabellen:** `medication_categories` (über JOIN geladen)  
**Felder:** `can_reduce_to_zero`, `default_min_target_fraction`, `risk_level`

---

**REGEL 2: Geschwindigkeitslimit**
```typescript
maxWeeklyReductionMg = startMg × (category.max_weekly_reduction_pct / 100)

if (weeklyReductionBase > maxWeeklyReductionMg) {
  effectiveWeeklyReduction = maxWeeklyReductionMg
  safetyNote: "🐌 Reduktionsgeschwindigkeit begrenzt auf max. X%/Woche"
}
```

**Tabellen:** `medication_categories`  
**Felder:** `max_weekly_reduction_pct`

---

**REGEL 3: Halbwertszeit-Anpassung** (NUR wenn half_life_hours vorhanden)
```typescript
steadyStateDays = (half_life_hours × 5) / 24

if (steadyStateDays > 7) {
  // Lange Halbwertszeit
  effectiveWeeklyReduction *= 0.5  // 50% langsamer
  safetyNote: "🕐 Lange Halbwertszeit - Reduktion auf 50% verlangsamt"
}
else if (steadyStateDays > 3) {
  // Mittlere Halbwertszeit
  effectiveWeeklyReduction *= 0.75  // 25% langsamer
  safetyNote: "🕐 Mittlere Halbwertszeit - Reduktion auf 75% angepasst"
}
```

**Tabellen:** `medications`  
**Felder:** `half_life_hours` (aktuell ALLE NULL → Regel wird NICHT angewendet)

---

**REGEL 4: Absetzrisiko-Warnung** (NUR wenn withdrawal_risk_score vorhanden)
```typescript
if (withdrawal_risk_score >= 7) {
  safetyNote: "⚠️ Hohes Absetzrisiko (Score: X/10) - Langsame Reduktion empfohlen"
}
```

**Tabellen:** `medications`  
**Felder:** `withdrawal_risk_score` (aktuell ALLE NULL → Regel wird NICHT angewendet)

---

**REGEL 5: CBD-Interaktions-Warnung** (NUR wenn cbd_interaction_strength vorhanden)
```typescript
if (cbd_interaction_strength === 'critical') {
  safetyNote: "🚨 Kritische CBD-Wechselwirkung - Engmaschige Kontrolle"
}
else if (cbd_interaction_strength === 'high') {
  safetyNote: "⚠️ Starke CBD-Wechselwirkung - Vorsicht"
}
```

**Tabellen:** `medications`  
**Felder:** `cbd_interaction_strength` (aktuell ALLE NULL → Regel wird NICHT angewendet)

---

**REGEL 6: Fachärztliche Begleitung**
```typescript
if (category.requires_specialist === 1) {
  safetyNote: "👨‍⚕️ Fachärztliche Begleitung erforderlich"
}
```

**Tabellen:** `medication_categories`  
**Felder:** `requires_specialist` (aktuell ALLE NULL → Regel wird NICHT angewendet)

---

**Output:**
```typescript
{
  effectiveTargetMg: number,
  effectiveWeeklyReduction: number,
  safetyNotes: string[],
  limitedByCategory: boolean,
  appliedCategoryRules: boolean
}
```

---

#### **SCHRITT 6: CBD-Dosierung berechnen**

**Basis-Formel (gewichtsbasiert):**
```
cbdStartMg = userWeight × 0.5   // 0.5 mg/kg Start
cbdEndMg = userWeight × 1.0     // 1.0 mg/kg Ziel
```

**ANPASSUNG 1: Benzos/Opioide erkannt**
```typescript
if (medikament enthält "diazepam" || "lorazepam" || "tramadol" || "oxycodon" || ...) {
  cbdStartMg = cbdStartMg / 2  // Halbierung
  note: "⚠️ Benzodiazepine oder Opioide erkannt: CBD-Startdosis halbiert"
}
```

**ANPASSUNG 2: Alter >= 65**
```typescript
if (age >= 65) {
  cbdStartMg *= 0.8
  note: "👴 CBD-Dosis angepasst für Senioren (65+)"
}
```

**ANPASSUNG 3: BMI**
```typescript
if (bmi < 18.5) {
  cbdStartMg *= 0.85  // Untergewicht
  note: "⚖️ CBD-Dosis angepasst: Untergewicht"
}
else if (bmi > 30) {
  cbdStartMg *= 1.1   // Übergewicht
  note: "⚖️ CBD-Dosis angepasst: Übergewicht"
}
```

**Wöchentliche Steigerung:**
```
cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks
```

**Tabellen:** Keine (nur Berechnungen)

---

#### **SCHRITT 7: Produkt-Matching** (MEDLESS Nr. 5 / 10 / 15 / 20 / 25)

**Produkte (FIXED CONSTANTS):**
```typescript
const MEDLESS_PRODUCTS = [
  { nr: 5,  cbdPerSpray: 5.8,  name: 'MEDLESS Nr. 5',  price: 24.90 },
  { nr: 10, cbdPerSpray: 11.5, name: 'MEDLESS Nr. 10', price: 39.90 },
  { nr: 15, cbdPerSpray: 17.5, name: 'MEDLESS Nr. 15', price: 59.90 },
  { nr: 20, cbdPerSpray: 23.2, name: 'MEDLESS Nr. 20', price: 79.90 },
  { nr: 25, cbdPerSpray: 29.0, name: 'MEDLESS Nr. 25', price: 99.90 }
];

const BOTTLE_CAPACITY = 100; // Sprays pro 10ml Flasche
```

**Algorithmus (Funktion: `selectOptimalProduct`):**
```typescript
// Ziel: Minimale Anzahl Sprays, keine Überdosierung, max 6 Sprays/Tag

for (const product of MEDLESS_PRODUCTS) {
  sprayCount = Math.ceil(targetDailyMg / product.cbdPerSpray)
  actualMg = sprayCount × product.cbdPerSpray
  
  if (sprayCount <= 6 && actualMg <= maxAllowedMg) {
    if (sprayCount < bestSprayCount) {
      bestProduct = product
      bestSprayCount = sprayCount
    }
  }
}
```

**Tabellen:** Keine (Hardcoded-Konstanten)

---

#### **SCHRITT 8: Wochenplan generieren**

**Funktion:** `generateWeeklyPlanWithBottleTracking()`

**Für jede Woche (1 bis durationWeeks):**

1. **CBD-Dosis für die Woche:**
   ```
   weekCbdMg = cbdStartMg + (cbdWeeklyIncrease × (week - 1))
   ```

2. **Produkt auswählen:**
   ```
   product = selectOptimalProduct(weekCbdMg)
   ```

3. **Sprays pro Tag:**
   ```
   totalSprays = ceil(weekCbdMg / product.cbdPerSpray)
   morningSprays = floor(totalSprays / 2)
   eveningSprays = totalSprays - morningSprays
   actualCbdMg = totalSprays × product.cbdPerSpray
   ```

4. **Flaschenverbrauch berechnen:**
   ```
   spraysThisWeek = totalSprays × 7
   remainingInBottle -= spraysThisWeek
   
   if (remainingInBottle <= 0) {
     bottlesNeeded++
     remainingInBottle = BOTTLE_CAPACITY + remainingInBottle
   }
   ```

5. **Medikamenten-Dosen für die Woche:**
   ```
   currentMg = startMg - (weeklyReduction × (week - 1))
   currentMg = max(currentMg, targetMg)
   
   // Letzte Woche: IMMER exakte Zieldosis
   if (week === durationWeeks) {
     currentMg = targetMg
   }
   ```

6. **Metriken berechnen:**
   ```
   totalMedicationLoad = Summe aller currentMg
   cannabinoidMgPerKg = actualCbdMg / userWeight
   cannabinoidToLoadRatio = (actualCbdMg / totalMedicationLoad) × 100
   ```

**Output pro Woche:**
```typescript
{
  week: 1,
  medications: [
    {
      name: "Ibuprofen",
      startMg: 400,
      currentMg: 350,
      targetMg: 200,
      reduction: 25,
      reductionPercent: 12.5,
      reductionSpeedPct: 6.25,
      safety: { ... } // Nur in Woche 1
    }
  ],
  totalMedicationLoad: 350,
  cbdDose: { start: 35, end: 70 },
  kannasanProduct: "MEDLESS Nr. 10",
  morningSprays: 2,
  eveningSprays: 2,
  totalSprays: 4,
  actualCbdMg: 46.0,
  bottleStatus: { ... },
  cannabinoidMgPerKg: 0.6,
  cannabinoidToLoadRatio: 13.1
}
```

**Tabellen verwendet:** Keine (nur Berechnungen mit bereits geladenen Daten)

---

#### **SCHRITT 9: Kostenanalyse**

**Funktion:** `calculatePlanCosts()`

**Berechnung:**
- Gesamtzahl Flaschen über alle Wochen
- Kosten pro Produkt
- Gesamtkosten
- Durchschnittliche Monatskosten

**Tabellen:** Keine

---

#### **SCHRITT 10: Gesamt-Metriken**

```typescript
overallStartLoad = Summe aller Medikamente (mgPerDay)
overallEndLoad = Summe aller targetMg (letzte Woche)
totalLoadReductionPct = ((start - end) / start) × 100

maxReductionSpeed = max(weeklyReduction / startMg) über alle Medikamente
```

**Tabellen:** Keine

---

#### **SCHRITT 11: Response zusammenstellen**

**Output (AnalyzeResponse):**
```typescript
{
  overallStartLoad: 400,
  overallEndLoad: 200,
  totalLoadReductionPct: 50,
  totalMedicationCount: 1,
  sensitiveMedCount: 0,
  maxReductionSpeed: 6.25,
  hasBenzoOrOpioid: false,
  maxSeverity: "high",
  bmi: 23.1,
  bsa: 1.95,
  idealWeightKg: 75.2,
  cbdStartMg: 35,
  cbdEndMg: 70,
  cbdWeeklyIncrease: 4.375,
  adjustmentNotes: [...],
  weeklyPlan: [...],
  analysisResults: [...],
  costAnalysis: {...},
  reductionSpeeds: [...],
  maxWithdrawalRiskScore: 0
}
```

---

### 4.3 Zusammenfassung: Verwendete Tabellen & Felder

| Schritt | Tabellen | Felder (Primär) | Status |
|---------|----------|-----------------|--------|
| 2. Medikamente laden | `medications`, `medication_categories` | `name`, `generic_name`, `category_id`, `risk_level` | ✅ Aktiv |
| 3. CBD-Interaktionen | `cbd_interactions` | `medication_id`, `severity`, `description` | ✅ Aktiv |
| 5a. Vollreduktions-Check | `medication_categories` | `can_reduce_to_zero`, `default_min_target_fraction` | ❌ ALLE NULL |
| 5b. Geschwindigkeitslimit | `medication_categories` | `max_weekly_reduction_pct` | ❌ ALLE NULL |
| 5c. Halbwertszeit | `medications` | `half_life_hours` | ❌ ALLE NULL |
| 5d. Absetzrisiko | `medications` | `withdrawal_risk_score` | ❌ ALLE NULL |
| 5e. CBD-Interaktion | `medications` | `cbd_interaction_strength` | ❌ ALLE NULL |
| 5f. Fachärztliche Begleitung | `medication_categories` | `requires_specialist` | ❌ ALLE NULL |

**KRITISCHE ERKENNTNIS:** Von den 6 Sicherheitsregeln werden aktuell **NUR 2 aktiv genutzt** (Medikamentensuche + CBD-Interaktionen aus separater Tabelle). Die anderen 4 Regeln existieren im Code, können aber nicht greifen, weil die Datenbankfelder leer sind.

---

## 5. WECHSELWIRKUNGS-TABELLEN

### 5.1 Übersicht

| Tabelle | Zeilen | Verknüpfung | Zweck |
|---------|--------|-------------|-------|
| `cbd_interactions` | 51 | `medication_id` (FK → medications.id) | CBD-Wechselwirkungen |
| `cbd_dosage_guidelines` | 0 | `condition_type` (kein FK) | CBD-Dosierrichtlinien (leer) |

**Gesamtzahl Wechselwirkungszeilen:** 51

---

### 5.2 cbd_interactions - Details

**Struktur:**
- **1:1-Relation:** Jedes Medikament hat genau 1 CBD-Interaktionseintrag
- **Hauptsächlich:** `enhancement + high/medium` (Verstärkung)
- **Kritisch:** 5 Medikamente mit `severity: critical` (z.B. Warfarin, Clobazam)

**Verwendung:**
- In `buildAnalyzeResponse()`: Bestimmung der maximalen Severity
- In Reports: Anzeige der Wechselwirkungsdetails

---

## 6. ABSCHLUSS: WICHTIGSTE KENNZAHLEN

### 6.1 Datenbestand

| Metrik | Wert |
|--------|------|
| **Medikamente (Total)** | 51 |
| **Kategorien** | 20 |
| **CBD-Interaktionen** | 51 (1 pro Medikament) |
| **User Plans (gespeichert)** | 0 |
| **Customer Emails** | 0 |
| **Migrations angewendet** | 7 |

---

### 6.2 Datenqualität

| Datenpunkt | Vollständig? | Hinweis |
|-----------|--------------|---------|
| Medikamente → Kategorien | ✅ 100% | Alle 51 haben gültige category_id |
| Kategorie `risk_level` | ✅ 100% | Alle 20 Kategorien haben risk_level |
| Medikament `half_life_hours` | ❌ 0% | ALLE NULL (UPDATEs nicht angewendet) |
| Medikament `withdrawal_risk_score` | ❌ 0% | ALLE NULL |
| Medikament `cbd_interaction_strength` | ❌ 0% | ALLE NULL |
| Kategorie `max_weekly_reduction_pct` | ❌ 0% | ALLE NULL |
| Kategorie `can_reduce_to_zero` | ❌ 0% | ALLE NULL |
| Kategorie `requires_specialist` | ❌ 0% | ALLE NULL |

**FAZIT:** Die Datenbank hat eine **solide Grundstruktur** (Kategorien + Zuordnungen), aber **alle erweiterten Sicherheitsfelder sind leer**. Die Datei `final_patch_medications_to_200.sql` enthält die fehlenden Daten, wurde aber nie ausgeführt.

---

### 6.3 Code-Implementierung

| Feature | Code vorhanden? | DB-Daten vorhanden? | Aktiv? |
|---------|-----------------|---------------------|--------|
| Kategorie-Risiko (`risk_level`) | ✅ Ja | ✅ Ja | ✅ AKTIV |
| CBD-Wechselwirkungen (Tabelle) | ✅ Ja | ✅ Ja | ✅ AKTIV |
| Medikamenten-Risiko (`withdrawal_risk_score`) | ✅ Ja | ❌ Nein | ❌ INAKTIV |
| Halbwertszeit-Anpassung | ✅ Ja | ❌ Nein | ❌ INAKTIV |
| CBD-Interaktionsstärke (Feld) | ✅ Ja | ❌ Nein | ❌ INAKTIV |
| Geschwindigkeitslimit (`max_weekly_reduction_pct`) | ✅ Ja | ❌ Nein | ❌ INAKTIV |
| Vollreduktions-Check (`can_reduce_to_zero`) | ✅ Ja | ❌ Nein | ❌ INAKTIV |
| Fachärztliche Begleitung | ✅ Ja | ❌ Nein | ❌ INAKTIV |

**Aktive Sicherheitslogik:** 2 von 8 implementierten Features  
**Inaktive Features:** 6 (Code vorhanden, aber DB-Felder leer)

---

### 6.4 Nächste Schritte (EMPFEHLUNG)

1. **Datenqualität sicherstellen:**
   - `final_patch_medications_to_200.sql` ausführen
   - Felder `half_life_hours`, `withdrawal_risk_score`, `cbd_interaction_strength` füllen
   - Kategorie-Sicherheitsregeln ergänzen

2. **Medikamentenliste erweitern:**
   - Aktuell: 51 Medikamente
   - Geplant: ~341 Medikamente (laut MASTER_ALL_MEDICATIONS_IDEMPOTENT.sql)

3. **Datenbank-Konsistenz prüfen:**
   - Medikamentenkategorien korrigieren (wenn nötig)
   - ATC-Codes ergänzen (Spalte fehlt aktuell)

---

## TEIL_B_JSON_SUMMARY

**Siehe nächste Nachricht (JSON-Objekt)**

---

**ENDE TEIL_A_HUMAN_READABLE**
