# MEDLESS CALCULATION SPECIFICATION V1
## Technical Documentation for Developers

**Version:** 1.0  
**Date:** 2025-12-09  
**Status:** PRODUCTION (medless-production)  
**Purpose:** Complete technical specification of MEDLESS v1 reduction calculation engine

---

## 1. OVERVIEW

MEDLESS v1 implements a **7-phase sequential reduction calculation** for medication tapering in context of cannabinoid therapy. The calculation combines:

- Medication-specific pharmacological properties
- Safety rules by therapeutic category
- CYP450-based interaction risk
- Withdrawal potential
- Multi-drug interaction scoring

**Core Principle:** Conservative, standardized reduction planning (not individualized prescribing).

---

## 2. INPUT PARAMETERS

### 2.1 MEDICATION-SPECIFIC PARAMETERS

| Parameter | Type | Source | Meaning | NULL Behavior |
|-----------|------|--------|---------|---------------|
| `dailyDoseMg` | `number` | User input / prescription | Total daily dose in mg | **REQUIRED** - calculation aborts if NULL |
| `half_life_hours` | `number` | `medications.half_life_hours` | Elimination half-life (hours) | Default: `12.0` (moderate half-life assumption) |
| `category_id` | `number` | `medications.category_id` | Therapeutic category (0-55) | **CRITICAL** - Default: `0` (General) with max restrictions |
| `narrow_therapeutic_window` | `boolean` | `medications.narrow_therapeutic_window` | Toxicity risk flag | Default: `false` |
| `withdrawal_risk_score` | `number (0-10)` | `medications.withdrawal_risk_score` | Dependency/withdrawal potential | Default: `0` (no withdrawal risk) |
| `cyp3a4_substrate` | `boolean` | `medications.cyp3a4_substrate` | CYP3A4 metabolism flag | Default: `false` |
| `cyp2d6_substrate` | `boolean` | `medications.cyp2d6_substrate` | CYP2D6 metabolism flag | Default: `false` |
| `cyp2c9_substrate` | `boolean` | `medications.cyp2c9_substrate` | CYP2C9 metabolism flag | Default: `false` |
| `cyp2c19_substrate` | `boolean` | `medications.cyp2c19_substrate` | CYP2C19 metabolism flag | Default: `false` |
| `cyp1a2_substrate` | `boolean` | `medications.cyp1a2_substrate` | CYP1A2 metabolism flag | Default: `false` |

### 2.2 CATEGORY-SPECIFIC SAFETY RULES

| Parameter | Type | Source | Meaning | NULL Behavior |
|-----------|------|--------|---------|---------------|
| `can_reduce_to_zero` | `boolean` | `categorySafetyRules[category_id]` | Allow full discontinuation? | Default: `false` (NEVER reduce to 0) |
| `max_weekly_reduction_pct` | `number (%)` | `categorySafetyRules[category_id]` | Maximum weekly reduction rate | Default: `15%` |
| `requires_monitoring` | `boolean` | `categorySafetyRules[category_id]` | Flag for intensive monitoring | Default: `false` |

**Source Code Location:**
```typescript
const categorySafetyRules: Record<number, CategorySafetyRule> = {
  0: { can_reduce_to_zero: false, max_weekly_reduction_pct: 10, requires_monitoring: true },
  1: { can_reduce_to_zero: true, max_weekly_reduction_pct: 20, requires_monitoring: false },
  // ... (56 categories total, IDs 0-55)
};
```

### 2.3 POLYPHARMACY CONTEXT

| Parameter | Type | Source | Meaning | NULL Behavior |
|-----------|------|--------|---------|---------------|
| `totalInteractionScore` | `number` | Calculated from all patient medications | Sum of CYP interaction risks | Default: `0` (no interactions) |
| `allMedications` | `Medication[]` | User input (patient's full medication list) | Context for interaction analysis | Default: `[]` (single medication) |

**Calculation:**
```typescript
let totalInteractionScore = 0;
for (const otherMed of allMedications) {
  if (otherMed.id === medication.id) continue;
  
  // CYP3A4 interactions
  if (medication.cyp3a4_substrate && (otherMed.cyp3a4_inhibitor || otherMed.cyp3a4_inducer)) {
    totalInteractionScore += 3;
  }
  // ... (repeat for CYP2D6, 2C9, 2C19, 1A2)
}
```

### 2.4 FIXED CONSTANTS

| Constant | Value | Purpose |
|----------|-------|---------|
| `targetFraction` | `0.10` (10%) | Base weekly reduction target (10% of daily dose per week) |
| `standardWeight` | `70 kg` | Assumed patient weight for CBD dosing |
| `minCbdDoseMgPerKg` | `0.5` | Minimum CBD starting dose (mg/kg) |
| `maxCbdDoseMgPerKg` | `1.0` | Maximum CBD starting dose (mg/kg) |

---

## 3. CALCULATION PHASES (SEQUENTIAL)

### PHASE 1: BASE CALCULATION
**Formula:**
```
weeklyReductionBase = dailyDoseMg × targetFraction
```

**Example:**
- `dailyDoseMg = 50 mg`
- `targetFraction = 0.10` (10%)
- → `weeklyReductionBase = 5 mg/week`

---

### PHASE 2: CATEGORY LIMITS
**Formula:**
```
maxAllowedReduction = dailyDoseMg × (max_weekly_reduction_pct / 100)
weeklyReduction = min(weeklyReductionBase, maxAllowedReduction)
```

**Example:**
- `weeklyReductionBase = 5 mg`
- `max_weekly_reduction_pct = 15%` (category rule)
- `dailyDoseMg = 50 mg`
- → `maxAllowedReduction = 7.5 mg`
- → `weeklyReduction = min(5, 7.5) = 5 mg` ✅ (no clipping)

**Special Case:**
- If `can_reduce_to_zero = false` → Final dose never reaches 0 mg (stops at minimal therapeutic dose)

---

### PHASE 3: HALF-LIFE ADJUSTMENT
**Formula:**
```
halfLifeAdjustment = 
  if half_life_hours > 24:   0.5   (slow reduction for long half-life)
  if half_life_hours > 12:   0.75  (moderate reduction)
  else:                      1.0   (standard reduction)

weeklyReduction × halfLifeAdjustment
```

**Examples:**
| Medication | Half-Life | Factor | Rationale |
|------------|-----------|--------|-----------|
| Fluoxetine | 96 hours | 0.5 | Very slow reduction (long elimination) |
| Diazepam | 48 hours | 0.5 | Slow reduction (accumulation risk) |
| Lorazepam | 14 hours | 0.75 | Moderate reduction |
| Ibuprofen | 2 hours | 1.0 | Standard reduction (fast elimination) |

---

### PHASE 4: CYP450 ADJUSTMENT
**Formula:**
```
cypAdjustment = 
  if CYP inhibitors present:  0.7   (slower reduction, increased plasma levels)
  if CYP inducers present:    1.15  (faster reduction, decreased plasma levels)
  else:                       1.0   (no CYP interaction)

weeklyReduction × cypAdjustment
```

**Detection Logic:**
```typescript
const cypProfile = analyzeCypProfile(medication, allMedications);
// cypProfile.inhibitors: Array of co-medications inhibiting this drug's metabolism
// cypProfile.inducers: Array of co-medications inducing this drug's metabolism

if (cypProfile.inhibitors.length > 0) → 0.7
if (cypProfile.inducers.length > 0)   → 1.15
```

**Examples:**
- Patient takes **Omeprazole (CYP2C19 inhibitor)** + **Citalopram (CYP2C19 substrate)**
  - → Slower reduction for Citalopram (0.7×) due to elevated plasma levels

- Patient takes **Carbamazepine (CYP3A4 inducer)** + **Simvastatin (CYP3A4 substrate)**
  - → Faster reduction for Simvastatin (1.15×) due to reduced plasma levels

---

### PHASE 5: THERAPEUTIC WINDOW ADJUSTMENT
**Formula:**
```
therapeuticWindowFactor = 
  if narrow_therapeutic_window = true:  0.8  (20% slower reduction)
  else:                                 1.0  (standard)

weeklyReduction × therapeuticWindowFactor
```

**Examples:**
| Medication | Narrow Window? | Factor | Reason |
|------------|----------------|--------|--------|
| Warfarin | ✅ Yes | 0.8 | Risk of sub-/supratherapeutic anticoagulation |
| Lithium | ✅ Yes | 0.8 | Toxicity risk (0.8-1.2 mmol/L therapeutic range) |
| Digoxin | ✅ Yes | 0.8 | Cardiac glycoside toxicity |
| Metformin | ❌ No | 1.0 | Wide therapeutic window |

---

### PHASE 6: WITHDRAWAL RISK ADJUSTMENT
**Formula:**
```
withdrawalFactor = 
  if withdrawal_risk_score ≥ 7:  0.75  (25% slower reduction, high dependency)
  if withdrawal_risk_score ≥ 4:  0.85  (15% slower reduction, moderate dependency)
  else:                          1.0   (standard)

weeklyReduction × withdrawalFactor
```

**Examples:**
| Medication | Withdrawal Score | Factor | Reason |
|------------|------------------|--------|--------|
| Alprazolam | 9/10 | 0.75 | High benzodiazepine dependency risk |
| Oxycodone | 8/10 | 0.75 | Severe opioid withdrawal syndrome |
| Venlafaxine | 5/10 | 0.85 | Moderate SNRI discontinuation syndrome |
| Amoxicillin | 0/10 | 1.0 | No withdrawal risk (antibiotic) |

---

### PHASE 7: MULTI-DRUG INTERACTION GLOBAL FACTOR
**Formula:**
```
interactionFactor = 
  if totalInteractionScore ≥ 10:  0.7   (high polypharmacy risk, very slow reduction)
  if totalInteractionScore ≥ 5:   0.85  (moderate polypharmacy risk, slow reduction)
  else:                           1.1   (low risk, slightly faster reduction possible)

weeklyReduction × interactionFactor
```

**Total Interaction Score Calculation:**
- Each CYP-based interaction contributes **+3 points**
- Example: Patient on 4 medications with 3 CYP3A4 overlaps → `totalInteractionScore = 9` → Factor `0.85`

---

## 4. FINAL FORMULA (COMPOSITE)

```
weeklyReduction = dailyDoseMg × 0.10 
                  × min(1, max_weekly_reduction_pct / 10)
                  × halfLifeAdjustment 
                  × cypAdjustment 
                  × therapeuticWindowFactor 
                  × withdrawalFactor 
                  × interactionFactor
```

**Example Calculation:**
```
Input:
- dailyDoseMg = 50 mg
- max_weekly_reduction_pct = 15%
- half_life_hours = 20 (→ 0.75)
- CYP inhibitor present (→ 0.7)
- narrow_therapeutic_window = true (→ 0.8)
- withdrawal_risk_score = 6 (→ 0.85)
- totalInteractionScore = 7 (→ 0.85)

Calculation:
weeklyReduction = 50 × 0.10 × 1.0 × 0.75 × 0.7 × 0.8 × 0.85 × 0.85
                = 50 × 0.10 × 0.2848
                = 1.42 mg/week

→ Patient reduces by ~1.4 mg per week (very conservative)
```

---

## 5. SAFETY MECHANISMS

### 5.1 HARD LIMITS

| Safety Rule | Implementation | Medical Purpose |
|-------------|----------------|-----------------|
| **Max Weekly Reduction** | `max_weekly_reduction_pct` per category (5%-25%) | Prevent abrupt dose changes |
| **Min Remaining Dose** | Never reduce below 5% of original dose | Maintain minimal therapeutic coverage |
| **Never-to-Zero Categories** | `can_reduce_to_zero = false` for critical meds | Avoid dangerous discontinuation (e.g., antihypertensives) |
| **Withdrawal Protection** | Factor 0.75-1.0 based on `withdrawal_risk_score` | Prevent severe discontinuation syndromes |
| **Therapeutic Window Protection** | Factor 0.8 for `narrow_therapeutic_window = true` | Avoid sub-/supratherapeutic levels |

### 5.2 DEFAULT FALLBACKS

| Field | Default | Reason |
|-------|---------|--------|
| `half_life_hours` | 12.0 | Conservative moderate half-life assumption |
| `category_id` | 0 (General) | Most restrictive category (10% max reduction, never to 0) |
| `withdrawal_risk_score` | 0 | Assume no dependency (safest default) |
| `narrow_therapeutic_window` | false | Assume standard window (avoid unnecessary restrictions) |
| All CYP flags | false | Assume no CYP metabolism (avoid false interactions) |

### 5.3 VALIDATION RULES

```typescript
// Pre-calculation validation
if (!dailyDoseMg || dailyDoseMg <= 0) {
  throw new Error("Invalid daily dose");
}

if (category_id === null || category_id === undefined) {
  category_id = 0; // Force General category
}

// Post-calculation validation
if (weeklyReduction > dailyDoseMg * 0.25) {
  weeklyReduction = dailyDoseMg * 0.25; // Hard cap: max 25% per week
}

if (!can_reduce_to_zero && projectedFinalDose < originalDose * 0.05) {
  weeklyReduction = 0; // Stop reduction at 5% of original
}
```

---

## 6. PSEUDOCODE (COMPLETE ALGORITHM)

```python
def calculate_weekly_reduction_factor(medication, patient_medications):
    """
    MEDLESS v1 - Weekly Reduction Calculation
    Returns: weeklyReductionMg (float)
    """
    
    # =========================================
    # PHASE 1: BASE CALCULATION
    # =========================================
    dailyDoseMg = medication.dailyDoseMg
    targetFraction = 0.10  # 10% weekly base reduction
    weeklyReductionBase = dailyDoseMg * targetFraction
    
    # =========================================
    # PHASE 2: CATEGORY LIMITS
    # =========================================
    category_id = medication.category_id or 0
    category_rule = categorySafetyRules.get(category_id, DEFAULT_RULE)
    
    max_weekly_reduction_pct = category_rule.max_weekly_reduction_pct
    can_reduce_to_zero = category_rule.can_reduce_to_zero
    
    max_allowed_reduction = dailyDoseMg * (max_weekly_reduction_pct / 100)
    weeklyReduction = min(weeklyReductionBase, max_allowed_reduction)
    
    # =========================================
    # PHASE 3: HALF-LIFE ADJUSTMENT
    # =========================================
    half_life_hours = medication.half_life_hours or 12.0
    
    if half_life_hours > 24:
        halfLifeAdjustment = 0.5   # Long half-life (>24h)
    elif half_life_hours > 12:
        halfLifeAdjustment = 0.75  # Moderate half-life (12-24h)
    else:
        halfLifeAdjustment = 1.0   # Short half-life (<12h)
    
    weeklyReduction *= halfLifeAdjustment
    
    # =========================================
    # PHASE 4: CYP450 ADJUSTMENT
    # =========================================
    cypProfile = analyze_cyp_profile(medication, patient_medications)
    
    if cypProfile.inhibitors.length > 0:
        cypAdjustment = 0.7   # Slower reduction (elevated plasma levels)
    elif cypProfile.inducers.length > 0:
        cypAdjustment = 1.15  # Faster reduction (decreased plasma levels)
    else:
        cypAdjustment = 1.0   # No CYP interaction
    
    weeklyReduction *= cypAdjustment
    
    # =========================================
    # PHASE 5: THERAPEUTIC WINDOW ADJUSTMENT
    # =========================================
    narrow_therapeutic_window = medication.narrow_therapeutic_window or False
    
    if narrow_therapeutic_window:
        therapeuticWindowFactor = 0.8  # 20% slower for narrow window
    else:
        therapeuticWindowFactor = 1.0
    
    weeklyReduction *= therapeuticWindowFactor
    
    # =========================================
    # PHASE 6: WITHDRAWAL RISK ADJUSTMENT
    # =========================================
    withdrawal_risk_score = medication.withdrawal_risk_score or 0
    
    if withdrawal_risk_score >= 7:
        withdrawalFactor = 0.75  # High dependency risk
    elif withdrawal_risk_score >= 4:
        withdrawalFactor = 0.85  # Moderate dependency risk
    else:
        withdrawalFactor = 1.0   # No withdrawal risk
    
    weeklyReduction *= withdrawalFactor
    
    # =========================================
    # PHASE 7: MULTI-DRUG INTERACTION FACTOR
    # =========================================
    totalInteractionScore = calculate_interaction_score(medication, patient_medications)
    
    if totalInteractionScore >= 10:
        interactionFactor = 0.7   # High polypharmacy risk
    elif totalInteractionScore >= 5:
        interactionFactor = 0.85  # Moderate polypharmacy risk
    else:
        interactionFactor = 1.1   # Low risk (slightly faster OK)
    
    weeklyReduction *= interactionFactor
    
    # =========================================
    # FINAL SAFETY CHECKS
    # =========================================
    # Hard cap: Never exceed 25% weekly reduction
    if weeklyReduction > dailyDoseMg * 0.25:
        weeklyReduction = dailyDoseMg * 0.25
    
    # Never-to-zero protection
    if not can_reduce_to_zero:
        min_remaining_dose = dailyDoseMg * 0.05  # Stop at 5% of original
        if (dailyDoseMg - weeklyReduction) < min_remaining_dose:
            weeklyReduction = 0  # Stop reduction
    
    return weeklyReduction


def analyze_cyp_profile(medication, all_medications):
    """
    Analyze CYP450 interactions between target medication and patient's other meds
    Returns: { inhibitors: [], inducers: [] }
    """
    inhibitors = []
    inducers = []
    
    for other_med in all_medications:
        if other_med.id == medication.id:
            continue
        
        # Check each CYP enzyme
        for cyp_enzyme in ['3A4', '2D6', '2C9', '2C19', '1A2']:
            is_substrate = getattr(medication, f'cyp{cyp_enzyme.lower()}_substrate', False)
            is_inhibitor = getattr(other_med, f'cyp{cyp_enzyme.lower()}_inhibitor', False)
            is_inducer = getattr(other_med, f'cyp{cyp_enzyme.lower()}_inducer', False)
            
            if is_substrate and is_inhibitor:
                inhibitors.append(other_med)
            
            if is_substrate and is_inducer:
                inducers.append(other_med)
    
    return {
        'inhibitors': inhibitors,
        'inducers': inducers
    }


def calculate_interaction_score(medication, all_medications):
    """
    Calculate total polypharmacy interaction risk score
    Each CYP interaction = +3 points
    """
    total_score = 0
    
    for other_med in all_medications:
        if other_med.id == medication.id:
            continue
        
        # CYP3A4 interactions
        if medication.cyp3a4_substrate and (other_med.cyp3a4_inhibitor or other_med.cyp3a4_inducer):
            total_score += 3
        
        # CYP2D6 interactions
        if medication.cyp2d6_substrate and (other_med.cyp2d6_inhibitor or other_med.cyp2d6_inducer):
            total_score += 3
        
        # CYP2C9 interactions
        if medication.cyp2c9_substrate and (other_med.cyp2c9_inhibitor or other_med.cyp2c9_inducer):
            total_score += 3
        
        # CYP2C19 interactions
        if medication.cyp2c19_substrate and (other_med.cyp2c19_inhibitor or other_med.cyp2c19_inducer):
            total_score += 3
        
        # CYP1A2 interactions
        if medication.cyp1a2_substrate and (other_med.cyp1a2_inhibitor or other_med.cyp1a2_inducer):
            total_score += 3
    
    return total_score
```

---

## 7. DATA SOURCES

| Data Type | Source | Format |
|-----------|--------|--------|
| **Medication Master Data** | `medless-production.medications` | D1 SQLite table (343 rows, 56 categories) |
| **Category Safety Rules** | Hardcoded in `src/index.tsx` | TypeScript object (`categorySafetyRules`) |
| **CYP Profiles** | `medications` table (boolean flags) | 5 CYP enzymes × 3 roles (substrate/inhibitor/inducer) |
| **Patient Medications** | User input (frontend form) | JSON array of medication objects |

---

## 8. OUTPUT FORMAT

```typescript
interface ReductionPlan {
  weeklyReductionMg: number;        // Calculated reduction per week
  estimatedWeeks: number;           // Duration until target reached
  appliedFactors: {
    halfLifeAdjustment: number;     // 0.5 / 0.75 / 1.0
    cypAdjustment: number;          // 0.7 / 1.0 / 1.15
    therapeuticWindowFactor: number; // 0.8 / 1.0
    withdrawalFactor: number;       // 0.75 / 0.85 / 1.0
    interactionFactor: number;      // 0.7 / 0.85 / 1.1
  };
  safetyWarnings: string[];         // e.g., "Never reduce to zero", "High withdrawal risk"
}
```

---

## 9. KNOWN LIMITATIONS (MEDLESS V1)

### ❌ NOT IMPLEMENTED
- **Bioavailability correction** (oral vs. IV routes treated equally)
- **Organ function adjustment** (no renal/hepatic impairment correction)
- **Comorbidities** (no diabetes, heart failure, etc. considerations)
- **Time-of-day dosing** (no circadian rhythm modeling)
- **Pharmacogenetics** (no individual CYP polymorphism variants)
- **Patient weight** (fixed 70 kg assumption for CBD dosing)
- **Dose frequency** (1×, 2×, 3× daily not differentiated)

### ⚠️ SIMPLIFICATIONS
- CYP interactions use **binary flags** (substrate/inhibitor/inducer), not quantitative inhibition constants
- Withdrawal risk is a **0-10 heuristic score**, not validated clinical scale
- Multi-drug interaction scoring is **additive**, not synergistic

---

## 10. VERSION CONTROL

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-09 | Initial specification for production system | MEDLESS Team |

---

## 11. REFERENCES

**Code Implementation:**
- `/home/user/webapp/src/index.tsx` (Lines 150-500: Calculation engine)
- `/home/user/webapp/migrations/` (Database schema, 56 medication categories)

**Medical Background:**
- CYP450 interaction principles (not specific guidelines)
- General pharmacokinetic half-life principles
- Conservative tapering heuristics (not evidence-based protocols)

---

## 12. DISCLAIMER

> **MEDLESS v1 is an orientation planning tool, NOT a prescribing system.**  
> All calculations must be reviewed and approved by a licensed physician.  
> The system provides **standardized recommendations** based on pharmacological data, but does NOT replace individualized clinical assessment.  
> Factors like organ function, comorbidities, and patient-specific pharmacogenetics MUST be evaluated separately by the treating physician.

---

**END OF SPECIFICATION**
