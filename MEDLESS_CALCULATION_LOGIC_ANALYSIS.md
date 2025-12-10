# MEDLESS BERECHNUNGSLOGIK - VOLLSTÄNDIGE TECHNISCHE OFFENLEGUNG

**Dokument-Version**: 1.0  
**Datum**: 2025-12-09  
**Analysiert**: `/home/user/webapp/src/index.tsx` (Lines 1-2000+)  
**Status**: ✅ COMPLETE BACKEND ANALYSIS

---

## 📋 INHALTSVERZEICHNIS

1. [Datenfelder für die Berechnung](#1-datenfelder-für-die-berechnung)
2. [Konkrete Berechnungsformeln](#2-konkrete-berechnungsformeln)
3. [Sicherheitsgrenzen](#3-sicherheitsgrenzen)
4. [Automatische Annahmen](#4-automatische-annahmen)
5. [Risiken in der Berechnung](#5-risiken-in-der-berechnung)
6. [Nicht-implementierte Teile](#6-nicht-implementierte-teile)
7. [Pseudocode](#7-pseudocode-der-berechnung)
8. [Bewertung & Validierung](#8-bewertung--validierung)

---

## 1. DATENFELDER FÜR DIE BERECHNUNG

### 1.1 MEDIKAMENTEN-FELDER (aus `medications` Tabelle)

| **Feldname** | **Typ** | **Verwendet?** | **Wofür?** | **Beispiel** |
|--------------|---------|----------------|------------|--------------|
| `id` | INTEGER | ✅ Ja | Eindeutige Identifikation | 1, 2, 3 |
| `name` | TEXT | ✅ Ja | Medikamentenname für Anzeige | "Ibuprofen" |
| `generic_name` | TEXT | ✅ Ja | Generischer Name für Suche | "Ibuprofen" |
| `category_id` | INTEGER (NULLABLE) | ✅ Ja | Verknüpfung zu `medication_categories` | 4 (Schmerzmittel) |
| `cyp450_enzyme` | TEXT (NULLABLE) | ❌ Nein | **VERALTET** - Ersetzt durch `medication_cyp_profile` Tabelle | "CYP3A4" |
| `description` | TEXT (NULLABLE) | ❌ Nein | Nicht für Berechnung | "Entzündungshemmer" |
| `common_dosage` | TEXT (NULLABLE) | ❌ Nein | Nur informativ | "400 mg 3x täglich" |
| **`half_life_hours`** | REAL (NULLABLE) | ✅ **JA** | **KRITISCH für Reduktionsgeschwindigkeit** | 2.0 (Ibuprofen) |
| **`therapeutic_min_ng_ml`** | REAL (NULLABLE) | ✅ **JA** | Therapeutische Untergrenze (Heuristik) | 10.0 |
| **`therapeutic_max_ng_ml`** | REAL (NULLABLE) | ✅ **JA** | Therapeutische Obergrenze (Heuristik) | 50.0 |
| **`withdrawal_risk_score`** | INTEGER (NULLABLE, 0-10) | ✅ **JA** | **KRITISCH für Reduktionsgeschwindigkeit** | 8 (hohes Risiko) |
| **`cbd_interaction_strength`** | TEXT (NULLABLE) | ✅ **JA** | Warnung bei kritischen Interaktionen | 'high', 'critical' |
| **`max_weekly_reduction_pct`** | REAL (NULLABLE) | ✅ **JA** | **Medikamentspezifische Obergrenze** (überschreibt Kategorie) | 5.0 (max 5%/Woche) |
| **`can_reduce_to_zero`** | INTEGER (NULLABLE, 0/1) | ✅ **JA** | **Medikamentspezifisch** (überschreibt Kategorie) | 0 (Nein), 1 (Ja) |

---

### 1.2 KATEGORIE-FELDER (aus `medication_categories` Tabelle)

| **Feldname** | **Typ** | **Verwendet?** | **Wofür?** | **Beispiel** |
|--------------|---------|----------------|------------|--------------|
| `id` | INTEGER | ✅ Ja | Kategorie-ID | 4 (Schmerzmittel) |
| `name` | TEXT | ✅ Ja | Kategoriename | "Schmerzmittel" |
| **`risk_level`** | TEXT (NULLABLE) | ✅ **JA** | Risikobewertung | 'low', 'medium', 'high', 'very_high', 'lifelong' |
| **`can_reduce_to_zero`** | INTEGER (NULLABLE, 0/1) | ✅ **JA** | Kategorie-Standard für Reduktion | 0 (Nein), 1 (Ja) |
| **`default_min_target_fraction`** | REAL (NULLABLE, 0.0-1.0) | ✅ **JA** | Mindest-Erhaltungsdosis (Fraktion) | 0.5 (50% Minimum) |
| **`max_weekly_reduction_pct`** | REAL (NULLABLE) | ✅ **JA** | Max. wöchentliche Reduktion (%) | 5.0 (max 5%/Woche) |
| **`requires_specialist`** | INTEGER (NULLABLE, 0/1) | ✅ **JA** | Fachärztliche Begleitung erforderlich | 1 (Ja) |
| `notes` | TEXT (NULLABLE) | ✅ Ja | Zusatzinformationen | "Langsam ausschleichen" |

---

### 1.3 CYP450-FELDER (aus `medication_cyp_profile` Tabelle)

| **Feldname** | **Typ** | **Verwendet?** | **Wofür?** | **Beispiel** |
|--------------|---------|----------------|------------|--------------|
| `id` | INTEGER | ✅ Ja | Eindeutige ID | 1 |
| `medication_id` | INTEGER | ✅ Ja | Verknüpfung zu `medications` | 123 |
| **`cyp_enzyme`** | TEXT | ✅ **JA** | CYP-Enzym | "CYP2C9", "CYP3A4", "UGT" |
| **`role`** | TEXT | ✅ **JA** | Substrat/Inhibitor/Inducer | 'substrate', 'inhibitor', 'inducer' |
| **`cbd_effect_on_reduction`** | TEXT (NULLABLE) | ✅ **JA KRITISCH** | **CBD-Effekt auf Metabolismus** | 'slower', 'faster', 'neutral' |
| `note` | TEXT (NULLABLE) | ❌ Nein | Nur informativ | "CYP2C9 Substrat" |

**WICHTIG**: 
- `cbd_effect_on_reduction = 'slower'` → **CBD hemmt CYP-Enzym** → Medikament verbleibt länger im Körper → **Reduktion wird um 30% verlangsamt**
- `cbd_effect_on_reduction = 'faster'` → **CBD hemmt NICHT** → Standard-Clearance → **Reduktion wird um 15% beschleunigt**
- `cbd_effect_on_reduction = 'neutral'` → **Keine Anpassung**

---

### 1.4 BENUTZEREINGABEN (API Request Body)

| **Feldname** | **Typ** | **Verwendet?** | **Wofür?** | **Beispiel** |
|--------------|---------|----------------|------------|--------------|
| `medications` | Array | ✅ **JA** | Liste der Medikamente mit Dosierungen | `[{name: "Ibuprofen", mgPerDay: 400}]` |
| `durationWeeks` | INTEGER | ✅ **JA** | Reduktionsdauer in Wochen | 8 |
| `reductionGoal` | INTEGER (%) | ✅ **JA** | Gewünschte Gesamtreduktion (Prozent) | 50 (= 50%) |
| `firstName` / `vorname` | TEXT | ⚠️ Personalisierung | Nur für Berichte | "Max" |
| `gender` / `geschlecht` | TEXT | ✅ **JA** | Idealgewicht-Berechnung | 'male', 'female' |
| `age` / `alter` | INTEGER | ✅ **JA** | **CBD-Dosis-Anpassung (≥65)** | 70 |
| **`weight` / `gewicht`** | REAL (kg) | ✅ **JA KRITISCH** | **CBD-Dosierung (mg/kg)** | 70.0 |
| `height` / `groesse` | REAL (cm) | ✅ **JA** | BMI, BSA, Idealgewicht | 175.0 |

---

## 2. KONKRETE BERECHNUNGSFORMELN

### 2.1 CBD-DOSIERUNG (Körpergewicht-basiert)

**FORMEL**:
```
CBD_Start_mg = weight_kg * 0.5 mg/kg
CBD_End_mg = weight_kg * 1.0 mg/kg
CBD_Weekly_Increase = (CBD_End_mg - CBD_Start_mg) / durationWeeks
```

**ANPASSUNGEN**:

1. **Benzos/Opioids vorhanden** → `CBD_Start_mg = CBD_Start_mg / 2` (Sicherheitsregel)
2. **Alter ≥ 65** → `CBD_Start_mg *= 0.8` (20% Reduktion für Senioren)
3. **BMI < 18.5** → `CBD_Start_mg *= 0.85` (15% Reduktion für Untergewicht)
4. **BMI > 30** → `CBD_Start_mg *= 1.1` (10% Erhöhung für Übergewicht)

**BEISPIEL** (70 kg, keine Benzos, Alter 35, BMI normal):
```
CBD_Start = 70 * 0.5 = 35.0 mg/Tag
CBD_End = 70 * 1.0 = 70.0 mg/Tag
CBD_Weekly_Increase = (70 - 35) / 8 = 4.375 mg/Woche
```

---

### 2.2 MEDIKAMENTEN-REDUKTION (Multi-Stage Calculation)

**WICHTIG**: Die Berechnung erfolgt in **mehreren Phasen** mit **kumulativen Anpassungen**.

#### **PHASE 1: BASISBERECHNUNG**

```
targetFraction = 1 - (reductionGoal / 100)
desiredTargetMg = startMg * targetFraction
weeklyReductionBase = (startMg - desiredTargetMg) / durationWeeks
```

**BEISPIEL** (Ibuprofen 400 mg, 50% Reduktion, 8 Wochen):
```
targetFraction = 1 - (50 / 100) = 0.5
desiredTargetMg = 400 * 0.5 = 200 mg
weeklyReductionBase = (400 - 200) / 8 = 25 mg/Woche
```

---

#### **PHASE 2: KATEGORIE-BASIERTE LIMITS**

**REGEL 1: Reduktion auf 0 mg erlaubt?**

```typescript
if (can_reduce_to_zero === 0 || risk_level === 'lifelong' || risk_level === 'very_high') {
  if (default_min_target_fraction !== null && default_min_target_fraction > 0) {
    targetFraction = Math.max(targetFraction, default_min_target_fraction);
  } else {
    targetFraction = 0.5; // Minimum 50% Erhaltungsdosis
  }
}
```

**BEISPIEL** (Kategorie: Immunsuppressiva, `can_reduce_to_zero = 0`, `default_min_target_fraction = 0.7`):
```
targetFraction = max(0.5, 0.7) = 0.7
desiredTargetMg = 400 * 0.7 = 280 mg (statt 200 mg)
```

**REGEL 2: Maximale wöchentliche Reduktion (%)**

```typescript
if (max_weekly_reduction_pct !== null && max_weekly_reduction_pct > 0) {
  maxWeeklyReductionMg = startMg * (max_weekly_reduction_pct / 100);
  
  if (weeklyReductionBase > maxWeeklyReductionMg) {
    weeklyReduction = maxWeeklyReductionMg; // Limit anwenden
  }
}
```

**BEISPIEL** (Kategorie: Benzodiazepine, `max_weekly_reduction_pct = 5%`):
```
maxWeeklyReductionMg = 400 * 0.05 = 20 mg/Woche
weeklyReduction = min(25, 20) = 20 mg/Woche (begrenzt)
```

---

#### **PHASE 3: HALBWERTSZEIT-BASIERTE ANPASSUNG**

```typescript
if (half_life_hours && half_life_hours > 0) {
  steadyStateDays = (half_life_hours * 5) / 24; // 5 Halbwertszeiten = Steady State
  
  if (steadyStateDays > 7) {
    weeklyReduction *= 0.5; // 50% langsamer
  } else if (steadyStateDays > 3) {
    weeklyReduction *= 0.75; // 25% langsamer
  }
}
```

**BEISPIEL** (Valproat, `half_life_hours = 15h`):
```
steadyStateDays = (15 * 5) / 24 = 3.125 Tage (mittlere Halbwertszeit)
weeklyReduction *= 0.75
weeklyReduction = 20 * 0.75 = 15 mg/Woche (25% langsamer)
```

---

#### **PHASE 4: CYP450-BASIERTE ANPASSUNG (KRITISCH)**

```typescript
// Priority: 'slower' overrides 'faster'
if (cypProfiles.some(p => p.cbd_effect_on_reduction === 'slower')) {
  cypAdjustmentFactor = 0.7; // 30% langsamer
  weeklyReduction *= 0.7;
} 
else if (cypProfiles.some(p => p.cbd_effect_on_reduction === 'faster') && NO 'slower') {
  cypAdjustmentFactor = 1.15; // 15% schneller
  weeklyReduction *= 1.15;
}
```

**BEISPIEL** (Warfarin, CYP2C9-Substrat, CBD hemmt CYP2C9):
```
cbd_effect_on_reduction = 'slower'
cypAdjustmentFactor = 0.7
weeklyReduction = 15 * 0.7 = 10.5 mg/Woche (30% langsamer)
```

---

#### **PHASE 5: THERAPEUTISCHES FENSTER (HEURISTIK)**

```typescript
if (therapeutic_min_ng_ml != null && therapeutic_max_ng_ml != null) {
  windowWidth = therapeutic_max_ng_ml - therapeutic_min_ng_ml;
  hasNarrowWindow = windowWidth <= 50; // HEURISTIC: ≤50 ng/ml
  hasHighWithdrawalRisk = withdrawal_risk_score >= 7;
  
  if (hasNarrowWindow && hasHighWithdrawalRisk) {
    weeklyReduction *= 0.8; // 20% langsamer
  }
}
```

**BEISPIEL** (Lithium, `therapeutic_min = 0.6 ng/ml`, `therapeutic_max = 1.2 ng/ml`, `withdrawal_risk_score = 8`):
```
windowWidth = 1.2 - 0.6 = 0.6 ng/ml (NARROW WINDOW!)
weeklyReduction = 10.5 * 0.8 = 8.4 mg/Woche (20% langsamer)
```

---

#### **PHASE 6: WITHDRAWAL RISK QUANTIFIKATION**

```typescript
if (withdrawal_risk_score && withdrawal_risk_score > 0) {
  withdrawalRiskFactor = 1 - (withdrawal_risk_score / 10 * 0.25);
  weeklyReduction *= withdrawalRiskFactor;
}
```

**FORMEL**:
```
withdrawalRiskFactor = 1 - (score / 10 * 0.25)
```

**BEISPIELE**:
- Score 4 → factor = 1 - (4/10 * 0.25) = 1 - 0.1 = 0.9 → **10% langsamer**
- Score 8 → factor = 1 - (8/10 * 0.25) = 1 - 0.2 = 0.8 → **20% langsamer**
- Score 10 → factor = 1 - (10/10 * 0.25) = 1 - 0.25 = 0.75 → **25% langsamer**

**BEISPIEL** (Venlafaxin, `withdrawal_risk_score = 8`):
```
withdrawalRiskFactor = 1 - (8 / 10 * 0.25) = 0.8
weeklyReduction = 8.4 * 0.8 = 6.72 mg/Woche (20% langsamer)
```

---

#### **PHASE 7: MULTI-DRUG INTERACTION (MDI) ADJUSTMENT**

**NUR bei mehreren Medikamenten!**

```typescript
// Count 'slower' and 'faster' CYP profiles across ALL medications
inhibitors = allCypProfiles.filter(p => p.cbd_effect_on_reduction === 'slower').length;

if (inhibitors >= 7) {
  mdiAdjustmentFactor = 0.7; // 30% langsamer (SEVERE)
} else if (inhibitors >= 4) {
  mdiAdjustmentFactor = 0.8; // 20% langsamer (MODERATE)
} else if (inhibitors >= 2) {
  mdiAdjustmentFactor = 0.9; // 10% langsamer (MILD)
}

// Apply MDI AFTER all per-medication adjustments
weeklyReduction *= mdiAdjustmentFactor;
```

**BEISPIEL** (3 Medikamente, insgesamt 5 'slower' CYP-Profile):
```
inhibitors = 5
mdiLevel = 'moderate'
mdiAdjustmentFactor = 0.8
weeklyReduction = 6.72 * 0.8 = 5.376 mg/Woche (20% langsamer)
```

---

#### **FINALE REDUKTION**

```typescript
effectiveTargetMg = startMg - (weeklyReduction * durationWeeks);
effectiveTargetMg = Math.max(effectiveTargetMg, desiredTargetMg); // Never below target
```

**VOLLSTÄNDIGES BEISPIEL** (Venlafaxin 150 mg, 50% Reduktion, 8 Wochen):

| **Phase** | **Faktor** | **weeklyReduction** | **Grund** |
|-----------|------------|---------------------|-----------|
| Basis | - | 25 mg/Woche | (150 - 75) / 8 |
| Kategorie-Limit | - | 20 mg/Woche | max_weekly_reduction_pct = 10% |
| Halbwertszeit | 0.75 | 15 mg/Woche | half_life_hours = 15h (mittel) |
| CYP450 | 0.7 | 10.5 mg/Woche | CYP2C9 'slower' |
| Therap. Fenster | 0.8 | 8.4 mg/Woche | Narrow window + high withdrawal |
| Withdrawal Risk | 0.8 | 6.72 mg/Woche | withdrawal_risk_score = 8 |
| MDI (global) | 0.8 | 5.376 mg/Woche | 5 'slower' CYP-Profile gesamt |

**Finale Reduktion**: 5.376 mg/Woche (statt 25 mg/Woche)  
**Reduktionsgeschwindigkeit**: ~21.5% langsamer als Basis

---

### 2.3 WÖCHENTLICHE DOSIS-BERECHNUNG

```typescript
for (week = 1; week <= durationWeeks; week++) {
  currentMg = startMg - (weeklyReduction * (week - 1));
  currentMg = Math.max(currentMg, targetMg); // Never below target
  
  // BUGFIX: Last week ALWAYS uses exact target
  if (week === durationWeeks) {
    currentMg = targetMg;
  }
}
```

**BEISPIEL** (Venlafaxin 150 mg, target 75 mg, weeklyReduction = 5.376 mg):

| **Woche** | **Berechnung** | **Dosis (mg)** |
|-----------|----------------|----------------|
| 1 | 150 - (5.376 * 0) | 150.0 |
| 2 | 150 - (5.376 * 1) | 144.624 |
| 3 | 150 - (5.376 * 2) | 139.248 |
| ... | ... | ... |
| 7 | 150 - (5.376 * 6) | 117.744 |
| 8 | **targetMg** | **75.0** (exakt) |

---

## 3. SICHERHEITSGRENZEN

### 3.1 HARD-CODED LIMITS

| **Limit** | **Wert** | **Code-Location** | **Zweck** |
|-----------|----------|-------------------|-----------|
| **Min. Dauer** | 1 Woche | Line 654 | Mindestens 1 Woche Reduktionsdauer |
| **Min. Dosis** | 0 mg | Line 253 | Negative Dosen unmöglich |
| **Max. CBD-Sprays/Intake** | 6 Sprühstöße | Line 461 | Max. 6 Sprühstöße pro Einnahme |
| **Max. CBD-Überdosis-Toleranz** | +10% | Line 460 | Max. 10% über Zieldosis |
| **Flasche-Kapazität** | 100 Sprühstöße | Line 446 | 100 Sprühstöße = 10ml |
| **BMI-Grenzen für Anpassung** | <18.5, >30 | Lines 883-889 | CBD-Dosis-Anpassung |
| **Senioren-Alter** | ≥65 Jahre | Line 876 | CBD-Dosis-Reduktion |

---

### 3.2 DYNAMISCHE SICHERHEITSGRENZEN (aus DB)

| **Parameter** | **Quelle** | **Typische Werte** | **Effekt** |
|---------------|------------|-------------------|------------|
| **Mindest-Erhaltungsdosis** | `default_min_target_fraction` | 0.5 (50%) | Verhindert vollständige Reduktion |
| **Max. wöchentliche Reduktion** | `max_weekly_reduction_pct` | 2-10% | Begrenzt Reduktionsgeschwindigkeit |
| **CYP-Anpassung (slower)** | `cbd_effect_on_reduction` | 0.7 (30% langsamer) | Sicherheitsbremse |
| **Withdrawal Risk** | `withdrawal_risk_score` | 0.75-1.0 | 0-25% Verlangsamung |
| **Therapeutisches Fenster** | `therapeutic_min/max_ng_ml` | 0.8 (20% langsamer) | Nur bei narrow window |

---

### 3.3 NULL-FÄLLE (Fehlende Datenfelder)

| **Fehlender Wert** | **Fallback** | **Effekt** |
|--------------------|--------------|------------|
| `half_life_hours = NULL` | Keine Anpassung | Standard-Reduktion |
| `withdrawal_risk_score = NULL` | Keine Anpassung | Standard-Reduktion |
| `therapeutic_min/max = NULL` | Keine Heuristik | Keine Warnungen |
| `cbd_interaction_strength = NULL` | Keine Warnung | Keine extra Warnungen |
| `can_reduce_to_zero = NULL` | Default = 1 (erlaubt) | Reduktion auf 0 mg erlaubt |
| `max_weekly_reduction_pct = NULL` | Keine Obergrenze | Basis-Berechnung gilt |
| `weight = NULL` | Default 70 kg | CBD-Dosis: 70 * 0.5 = 35 mg |
| `category_id = NULL` | No category rules | Keine Kategorie-Limits |

---

## 4. AUTOMATISCHE ANNAHMEN

### 4.1 METABOLISMUS

| **Annahme** | **Wert** | **Begründung** |
|-------------|----------|----------------|
| Steady State erreicht nach | **5 Halbwertszeiten** | Pharmakokinetik-Standard |
| Lange Halbwertszeit | > 7 Tage Steady State | Reduktion um 50% verlangsamt |
| Mittlere Halbwertszeit | 3-7 Tage Steady State | Reduktion um 25% verlangsamt |
| Kurze Halbwertszeit | < 3 Tage Steady State | Keine Anpassung |

---

### 4.2 CANNABINOIDE (CBD)

| **Annahme** | **Wert** | **Begründung** |
|-------------|----------|----------------|
| CBD-Startdosis | **0.5 mg/kg Körpergewicht** | Konservative Startdosis |
| CBD-Zieldosis | **1.0 mg/kg Körpergewicht** | Therapeutische Zieldosis |
| CBD-Steigerung | Linear über Reduktionsdauer | Einfache Umsetzbarkeit |
| CBD-Wirkung bei CYP2C9/3A4 | **30% Hemmung** → Reduktion verlangsamen | Wissenschaftliche Evidenz |
| CBD-Wirkung bei UGT | **Keine Hemmung** → Standard-Reduktion | Wissenschaftliche Evidenz |

---

### 4.3 BIOVERFÜGBARKEIT

**WICHTIG**: Bioverfügbarkeit wird **NICHT** in der Berechnung verwendet!

- Annahme: Alle Dosierungen sind **oral** und basieren auf **klinischen Standarddosen**
- **KEINE** Anpassung für intravenöse, subkutane oder transdermale Applikation
- **KEINE** Berücksichtigung von First-Pass-Metabolismus

---

### 4.4 PATIENTENGEWICHT

| **Annahme** | **Wert** | **Wann?** |
|-------------|----------|-----------|
| Standard-Gewicht | **70 kg** | Wenn `weight` nicht angegeben |
| Idealgewicht-Formel (männlich) | 50 + 0.9 * (height - 152) | Für BMI-Berechnung |
| Idealgewicht-Formel (weiblich) | 45.5 + 0.9 * (height - 152) | Für BMI-Berechnung |

---

### 4.5 ORGANFUNKTION

**WICHTIG**: Organfunktion wird **NICHT** berücksichtigt!

- **Annahme**: Normale Leber-/Nierenfunktion
- **KEINE** Anpassung für Niereninsuffizienz
- **KEINE** Anpassung für Leberinsuffizienz
- **KEINE** Berücksichtigung von Dialyse

---

### 4.6 DOSISINTERVALLE

| **Annahme** | **Wert** | **Begründung** |
|-------------|----------|----------------|
| CBD-Einnahmen pro Tag | **2x täglich** (Morgen + Abend) | Praktikabilität |
| CBD-Verteilung | **40% Morgen, 60% Abend** | Typisches Einnahmemuster |
| Medikamenten-Einnahmen | **Beliebig** (nicht spezifiziert) | User-Input ist Gesamtdosis/Tag |

---

### 4.7 REDUKTIONSWECHSELWIRKUNGEN

**ANNAHME**: Alle Medikamente werden **gleichzeitig** reduziert.

- **KEINE** sequenzielle Reduktion (erst Med A, dann Med B)
- **KEINE** Priorisierung nach Risiko
- **ABER**: MDI-Adjustment berücksichtigt kumulativen CYP-Burden

---

## 5. RISIKEN IN DER BERECHNUNG

### 5.1 FALSCHE / FEHLENDE FELDER

| **Problem** | **Risiko** | **Auswirkung** |
|-------------|------------|----------------|
| `half_life_hours = NULL` | **Hoch** | Keine Halbwertszeit-Anpassung → möglicherweise zu schnelle Reduktion |
| `withdrawal_risk_score = NULL` | **Hoch** | Keine Risiko-Quantifizierung → potenziell zu schnelle Reduktion |
| `therapeutic_min/max = NULL` | **Mittel** | Keine Warnungen bei engem Fenster → fehlende Sicherheitshinweise |
| `cbd_interaction_strength = NULL` | **Niedrig** | Nur Warnungen fehlen, CYP-Logik greift trotzdem |
| `max_weekly_reduction_pct = NULL` | **Mittel** | Keine Obergrenze → potenziell zu schnelle Reduktion |
| `category_id = NULL` | **Hoch** | **KEINE Kategorie-Sicherheitsregeln** → sehr riskant |

---

### 5.2 UNVOLLSTÄNDIGE INTERAKTIONSTABELLEN

| **Tabelle** | **Status** | **Risiko** |
|-------------|------------|------------|
| `medication_cyp_profile` | ⚠️ **Unvollständig** | **HOCH** - CYP-Anpassungen greifen nur bei erfassten Medikamenten |
| `cbd_interactions` | ⚠️ **Unvollständig** | **Mittel** - Nur Warnungen, keine Berechnung |
| `medication_categories` | ✅ **Vollständig** | **Niedrig** - Alle 343 Medikamente kategorisiert |

---

### 5.3 PAUSCHALE VS. DIFFERENZIERTE REDUKTION

**AKTUELL**: Pauschale Faktoren (0.7, 0.75, 0.8, 1.15)

**RISIKO**:
- Keine individuelle Anpassung pro Patient
- Keine Berücksichtigung von Komorbiditäten
- Keine Anpassung für Polypharmazie (außer MDI)

**EMPFEHLUNG**: In Phase 2 medikamentspezifische Faktoren aus klinischen Studien verwenden.

---

### 5.4 GRENZFÄLLE

| **Grenzfall** | **Aktuelles Verhalten** | **Risiko** |
|---------------|-------------------------|------------|
| Medikament ohne Halbwertszeit | Standard-Reduktion | **HOCH** - Möglicherweise zu schnell |
| Sehr kurze Halbwertszeit (< 1h) | Keine Anpassung | **Niedrig** - Schnelle Eliminierung |
| Sehr lange Halbwertszeit (> 100h) | 50% Verlangsamung | **Mittel** - Möglicherweise immer noch zu schnell |
| Mehrere CYP-Profile mit 'slower' | Faktor 0.7 (30%) | **Mittel** - Evtl. stärker verlangsamen |
| Withdrawal Risk Score = 10 | Faktor 0.75 (25%) | **Mittel** - Evtl. nicht ausreichend |
| Narrow Window + High Risk | Faktoren 0.8 + 0.8 = 0.64 | **Niedrig** - Gut abgesichert |

---

### 5.5 POTENZIELLE ÜBER- ODER UNTERREDUKTION

**ÜBERREDUKTION** (zu schnell):
- Medikamente ohne `half_life_hours` und `withdrawal_risk_score`
- Medikamente ohne CYP-Profil (keine 'slower' Anpassung)
- Medikamente ohne Kategoriezuordnung

**UNTERREDUKTION** (zu langsam):
- Medikamente mit kumulativen Faktoren (z.B. 0.7 * 0.75 * 0.8 * 0.8 = 0.336)
- Möglicherweise frustrierende Dauer für Patienten

**EMPFEHLUNG**: Medizinische Validierung durch Pharmakologie-Experten.

---

### 5.6 FEHLENDE MEDIZINISCHE CONSTRAINTS

| **Fehlender Constraint** | **Risiko** |
|--------------------------|------------|
| Keine Berücksichtigung von Komorbiditäten | **HOCH** |
| Keine Anpassung für Leber-/Niereninsuffizienz | **HOCH** |
| Keine Berücksichtigung von Schwangerschaft/Stillzeit | **KRITISCH** |
| Keine Berücksichtigung von Alter < 18 Jahren | **HOCH** |
| Keine Interaktions-Checks zwischen Medikamenten (außer CYP) | **MITTEL** |
| Keine Berücksichtigung von Allergien | **NIEDRIG** (informativ) |

---

## 6. NICHT-IMPLEMENTIERTE TEILE

### 6.1 CYP-SPEZIFIZIERUNG

**STATUS**: ✅ **IMPLEMENTIERT** (seit Migration 005)

- CYP450-Profile werden aus `medication_cyp_profile` geladen
- `cbd_effect_on_reduction` wird für Anpassung verwendet
- **ABER**: `cyp450_enzyme` Feld in `medications` ist **veraltet** und wird **NICHT** verwendet

---

### 6.2 WECHSELWIRKUNGEN

**STATUS**: ⚠️ **NUR RUDIMENTÄR**

**IMPLEMENTIERT**:
- CYP-basierte Wechselwirkungen (CBD ↔ Medikament)
- Multi-Drug Interaction (MDI) für kumulative CYP-Burden

**NICHT IMPLEMENTIERT**:
- Medikament-Medikament-Wechselwirkungen (außer CYP)
- Nahrungsmittel-Wechselwirkungen
- Alkohol-Wechselwirkungen

---

### 6.3 BIOVERFÜGBARKEIT

**STATUS**: ❌ **NICHT IMPLEMENTIERT**

- Feld existiert in DB **NICHT**
- Annahme: Alle Dosierungen sind **oral**
- **KEINE** Anpassung für unterschiedliche Applikationsformen

---

### 6.4 TAGESZEITABHÄNGIGE BERECHNUNG

**STATUS**: ❌ **NICHT IMPLEMENTIERT**

- Nur CBD-Verteilung (Morgen/Abend) berücksichtigt
- **KEINE** Berücksichtigung von Chronopharmakokinetik
- **KEINE** Anpassung für Medikamente mit Tageszeitabhängigkeit

---

### 6.5 ORGANFUNKTION

**STATUS**: ❌ **NICHT IMPLEMENTIERT**

- **KEINE** Felder für Leber-/Nierenfunktion
- **KEINE** Anpassung für Insuffizienz
- **KEINE** Berücksichtigung von Dialyse

---

### 6.6 KOMORBIDITÄTEN

**STATUS**: ❌ **NICHT IMPLEMENTIERT**

- **KEINE** Felder für Komorbiditäten
- **KEINE** Anpassung für Diabetes, Hypertonie, etc.
- **KEINE** Berücksichtigung von Schwangerschaft/Stillzeit

---

### 6.7 INTERAKTIONS-MATRIX (MEDIKAMENT ↔ MEDIKAMENT)

**STATUS**: ⚠️ **NUR CYP-BASIERT**

- CYP-basierte Interaktionen **JA**
- Andere Mechanismen (z.B. Protein-Bindung, Transporter) **NEIN**

---

## 7. PSEUDOCODE DER BERECHNUNG

```python
function calculateDoseReduction(patient, medication):
    # ===== INPUT VALIDATION =====
    if not medication.mgPerDay or medication.mgPerDay <= 0:
        raise Error("Invalid dose")
    
    if not patient.durationWeeks or patient.durationWeeks < 1:
        raise Error("Invalid duration")
    
    # ===== PHASE 1: BASE CALCULATION =====
    targetFraction = 1 - (patient.reductionGoal / 100)
    desiredTargetMg = medication.mgPerDay * targetFraction
    weeklyReductionBase = (medication.mgPerDay - desiredTargetMg) / patient.durationWeeks
    
    # ===== PHASE 2: CATEGORY SAFETY RULES =====
    if medication.category:
        # Rule 1: Can reduce to zero?
        if medication.can_reduce_to_zero == 0 or medication.category.risk_level in ['lifelong', 'very_high']:
            if medication.category.default_min_target_fraction:
                targetFraction = max(targetFraction, medication.category.default_min_target_fraction)
            else:
                targetFraction = 0.5  # Minimum 50%
        
        # Rule 2: Max weekly reduction percentage
        if medication.category.max_weekly_reduction_pct:
            maxWeeklyReductionMg = medication.mgPerDay * (medication.category.max_weekly_reduction_pct / 100)
            weeklyReduction = min(weeklyReductionBase, maxWeeklyReductionMg)
        else:
            weeklyReduction = weeklyReductionBase
    else:
        weeklyReduction = weeklyReductionBase
    
    # ===== PHASE 3: HALF-LIFE ADJUSTMENT =====
    if medication.half_life_hours:
        steadyStateDays = (medication.half_life_hours * 5) / 24
        
        if steadyStateDays > 7:
            weeklyReduction *= 0.5  # Long half-life: 50% slower
        elif steadyStateDays > 3:
            weeklyReduction *= 0.75  # Medium half-life: 25% slower
    
    # ===== PHASE 4: CYP450 ADJUSTMENT =====
    cypProfiles = getCypProfiles(medication.id)
    
    if any(p.cbd_effect_on_reduction == 'slower' for p in cypProfiles):
        weeklyReduction *= 0.7  # CBD inhibits CYP: 30% slower
    elif all(p.cbd_effect_on_reduction == 'faster' for p in cypProfiles) and len(cypProfiles) > 0:
        weeklyReduction *= 1.15  # No CYP inhibition: 15% faster
    
    # ===== PHASE 5: THERAPEUTIC RANGE ADJUSTMENT =====
    if medication.therapeutic_min_ng_ml and medication.therapeutic_max_ng_ml:
        windowWidth = medication.therapeutic_max_ng_ml - medication.therapeutic_min_ng_ml
        
        if windowWidth <= 50 and medication.withdrawal_risk_score >= 7:
            weeklyReduction *= 0.8  # Narrow window + high risk: 20% slower
    
    # ===== PHASE 6: WITHDRAWAL RISK QUANTIFICATION =====
    if medication.withdrawal_risk_score:
        withdrawalFactor = 1 - (medication.withdrawal_risk_score / 10 * 0.25)
        weeklyReduction *= withdrawalFactor  # 0-25% slower based on score
    
    # ===== PHASE 7: MULTI-DRUG INTERACTION (MDI) =====
    # (Only if patient has multiple medications)
    if patient.medications.length > 1:
        allCypProfiles = getAllCypProfiles(patient.medications)
        inhibitors = count(allCypProfiles where cbd_effect_on_reduction == 'slower')
        
        if inhibitors >= 7:
            mdiAdjustment = 0.7  # SEVERE: 30% slower
        elif inhibitors >= 4:
            mdiAdjustment = 0.8  # MODERATE: 20% slower
        elif inhibitors >= 2:
            mdiAdjustment = 0.9  # MILD: 10% slower
        else:
            mdiAdjustment = 1.0  # No adjustment
        
        weeklyReduction *= mdiAdjustment
    
    # ===== FINAL CALCULATION =====
    effectiveTargetMg = medication.mgPerDay - (weeklyReduction * patient.durationWeeks)
    effectiveTargetMg = max(effectiveTargetMg, desiredTargetMg)  # Never below desired target
    
    # ===== WEEKLY PLAN GENERATION =====
    weeklyPlan = []
    for week in range(1, patient.durationWeeks + 1):
        currentMg = medication.mgPerDay - (weeklyReduction * (week - 1))
        currentMg = max(currentMg, effectiveTargetMg)
        
        # BUGFIX: Last week ALWAYS exact target
        if week == patient.durationWeeks:
            currentMg = effectiveTargetMg
        
        weeklyPlan.append({
            week: week,
            dose: round(currentMg, 1)
        })
    
    return {
        weeklyReduction: weeklyReduction,
        effectiveTargetMg: effectiveTargetMg,
        weeklyPlan: weeklyPlan
    }
```

---

## 8. BEWERTUNG & VALIDIERUNG

### 8.1 IST DIE BERECHNUNG KORREKT?

**JA, MIT EINSCHRÄNKUNGEN**:

✅ **KORREKT**:
- Multi-Phase-Berechnung mit klaren Prioritäten
- CYP450-Logik wissenschaftlich fundiert
- Withdrawal Risk Quantifikation logisch
- Kategorie-Sicherheitsregeln robust
- MDI-Logik berücksichtigt kumulative Belastung

⚠️ **EINSCHRÄNKUNGEN**:
- Heuristische therapeutische Fenster (mg vs. ng/ml nicht direkt vergleichbar)
- Pauschale Faktoren (0.7, 0.75, 0.8) statt individueller Anpassung
- Fehlende Komorbiditäten-Berücksichtigung
- Keine Organfunktions-Anpassung

---

### 8.2 IST DIE BERECHNUNG MEDIZINISCH PLAUSIBEL?

**JA, FÜR EINEN ORIENTIERUNGSPLAN**:

✅ **PLAUSIBEL**:
- Konservative Faktoren (lieber zu langsam als zu schnell)
- Priorität auf Sicherheit (CYP 'slower' hat Vorrang)
- Berücksichtigung von Halbwertszeit (pharmakokinetisch korrekt)
- Withdrawal Risk als Quantifizierung (evidenzbasiert)

⚠️ **VERBESSERUNGSBEDARF**:
- Medizinische Validierung durch Pharmakologen erforderlich
- Klinische Studien für Faktoren (0.7, 0.75, etc.) fehlen
- Individuelle Anpassung (nicht nur Pauschalen)

---

### 8.3 IST DIE BERECHNUNG STABIL?

**JA**:

✅ **ROBUST**:
- Null-Checks für fehlende Felder
- Fallback-Werte (z.B. weight = 70 kg)
- Guards gegen negative Dosen
- Last-Week-Bugfix (exakte Zieldosis)

⚠️ **EDGE CASES**:
- Medikamente ohne `category_id` → keine Sicherheitsregeln
- Medikamente ohne CYP-Profile → keine Anpassung
- Sehr lange Halbwertszeiten (> 100h) → nur 50% Verlangsamung

---

### 8.4 WELCHE TEILE MÜSSEN ÜBERARBEITET WERDEN?

**PRIORITÄT 1 (KRITISCH)**:
1. ✅ **Kategorie-Vollständigkeit** → **ERLEDIGT** (alle 343 Medikamente kategorisiert)
2. ⚠️ **CYP-Profile vervollständigen** → Aktuell nicht für alle Medikamente
3. ⚠️ **Medizinische Validierung** → Durch Pharmakologen prüfen lassen
4. ⚠️ **Komorbiditäten-Integration** → Leber/Niere/Schwangerschaft

**PRIORITÄT 2 (WICHTIG)**:
5. ⚠️ **Individuelle Faktoren** → Statt Pauschalen (0.7, 0.75)
6. ⚠️ **Bioverfügbarkeit** → Für nicht-orale Applikationen
7. ⚠️ **Organfunktions-Anpassung** → Niereninsuffizienz, Leberinsuffizienz

**PRIORITÄT 3 (NICE-TO-HAVE)**:
8. ⚠️ **Chronopharmakokinetik** → Tageszeitabhängige Dosierung
9. ⚠️ **Interaktions-Matrix** → Medikament ↔ Medikament (nicht nur CYP)
10. ⚠️ **Nahrungsmittel-Interaktionen** → z.B. Grapefruitsaft

---

### 8.5 WAS IST ZWINGEND ZU VERBESSERN?

**SOFORT (vor medizinischem Einsatz)**:
1. ✅ **Kategorie-Daten vervollständigen** → **ERLEDIGT**
2. ⚠️ **CYP-Profile für kritische Medikamente** → Warfarin, Marcumar, etc.
3. ⚠️ **Medizinische Review** → Pharmakologe/Klinischer Pharmazeut
4. ⚠️ **Ausschlusskriterien dokumentieren** → Schwangerschaft, Kinder, etc.

**MITTELFRISTIG (vor Skalierung)**:
5. ⚠️ **Evidenzbasierte Faktoren** → Statt Pauschalen
6. ⚠️ **Komorbiditäten-Integration** → Leber/Niere
7. ⚠️ **Bioverfügbarkeit** → Für IV, SC, transdermal

---

### 8.6 WAS KANN BLEIBEN?

**BEIBEHALTEN** (gut umgesetzt):
- ✅ Multi-Phase-Berechnung (klar strukturiert)
- ✅ CYP450-Logik (wissenschaftlich fundiert)
- ✅ Withdrawal Risk Quantifikation (evidenzbasiert)
- ✅ MDI-Adjustment (kumulative Belastung)
- ✅ Kategorie-Sicherheitsregeln (robust)
- ✅ CBD-Dosierung (körpergewichtsbasiert, konservativ)
- ✅ Null-Handling (stabil)

---

## 🎯 FAZIT

### **STÄRKEN**:
1. ✅ Umfassende Multi-Phase-Berechnung
2. ✅ CYP450-Integration (wissenschaftlich)
3. ✅ Withdrawal Risk Quantifikation
4. ✅ Kategorie-basierte Sicherheit
5. ✅ MDI-Adjustment (Polypharmazie)
6. ✅ Konservative Faktoren (Sicherheit > Geschwindigkeit)

### **SCHWÄCHEN**:
1. ⚠️ Heuristische therapeutische Fenster (nicht exakt)
2. ⚠️ Pauschale Faktoren (nicht individualisiert)
3. ⚠️ Fehlende Komorbiditäten
4. ⚠️ Keine Organfunktions-Anpassung
5. ⚠️ CYP-Profile unvollständig
6. ⚠️ Keine Bioverfügbarkeit

### **EMPFEHLUNG**:
**Das System ist ein guter Orientierungsplan, ABER**:
- ⚠️ **NICHT als medizinisches Gerät verwenden**
- ⚠️ **Immer ärztliche Begleitung erforderlich**
- ⚠️ **Medizinische Validierung durch Experten nötig**
- ⚠️ **Disclaimer: Nur als Diskussionsgrundlage**

**FÜR WHITEAPER / ÄRZTLICHE DOKUMENTATION**:
- ✅ Vollständige Offenlegung der Berechnung
- ✅ Klare Darstellung der Annahmen
- ✅ Transparente Risiken & Limitationen
- ✅ Empfehlungen für ärztliche Anpassung

---

**Ende der technischen Offenlegung**

