# PHASE E – PDF-INTEGRATION ANALYSE

**Date:** 2025-12-09  
**Purpose:** Identify data gaps and create implementation plan for PDF integration  
**Files Analyzed:** `src/report_data_v3.ts`, `src/types/analyzeResponse.ts`, `src/index.tsx`

---

## 1. WELCHE VARIABLEN STEHEN IM AKTUELLEN PDF BEREITS ZUR VERFÜGUNG?

### AVAILABLE VARIABLES IN PDF (DoctorReportDataV3):

#### Patient Metadata:
```typescript
- patientName: string                   // ← FROM personalization.firstName
- patientAge: number                    // ← FROM personalization.age
- patientWeight: number                 // ← FROM personalization.weight
- patientGender: string                 // ← FROM personalization.gender
- durationWeeks: number                 // ← FROM weeklyPlan.length
```

#### Level 1: Overview (Per-Medication Summary):
```typescript
- overviewMedications: Array<{
    name: string                        // ← FROM medication.name
    genericName: string                 // ← FROM medication.generic_name
    category: string                    // ← FROM medication.category_name
    startDose: string                   // ← FROM entry.mgPerDay (formatted)
    targetDose: string                  // ← FROM weeklyPlan[last].medications[].targetMg
    riskLevel: 'critical' | 'high' | 'medium' | 'low'  // ← CALCULATED
    comment: string                     // ← GENERATED based on risk factors
  }>
```

#### Global Risk (Multi-Drug Interaction):
```typescript
- globalRisk: {
    multiDrugInteraction: {
      level: string                     // ← FROM multi_drug_interaction.level
      inhibitorsCount: number           // ← FROM multi_drug_interaction.inhibitors
      inducersCount: number             // ← FROM multi_drug_interaction.inducers
      adjustmentFactor: number          // ← FROM multi_drug_interaction.adjustment_factor
      warning: string | undefined       // ← GENERATED based on level
    }
    additionalHints: string | undefined // ← GENERATED
  }
```

#### Level 2: Medication Details (Per-Medication):
```typescript
- medicationDetails: Array<{
    name: string                        // ← FROM medication.name
    genericName: string                 // ← FROM medication.generic_name
    category: string                    // ← FROM medication.category_name
    startDose: string                   // ← FROM entry.mgPerDay
    targetDose: string                  // ← FROM weeklyPlan[last].targetMg
    maxWeeklyReductionPct: number       // ← FROM entry.max_weekly_reduction_pct ✅
    
    withdrawalRisk: {
      score: number                     // ← FROM medication.withdrawal_risk_score ✅
      factor: number                    // ← FROM withdrawal_risk_adjustment.factor ✅
      slowdownPct: number               // ← FROM withdrawal_risk_adjustment.reduction_slowdown_pct ✅
    }
    
    cypData: {
      hasCypData: boolean               // ← FROM entry.cypProfiles.length > 0 ✅
      affectedEnzymes: string[]         // ← FROM entry.cypProfiles[].cyp_enzyme ⚠️
      effectType: 'slower' | 'faster' | 'neutral'  // ← FROM cyp_profile.medicationsWithSlowerEffect ⚠️
      adjustmentFactor: number          // ⚠️ HARDCODED (0.7 for slower, 1.15 for faster)
      slowdownPct: number               // ⚠️ HARDCODED (30 for slower, -15 for faster)
      clinicalConsequence: string       // ← GENERATED from category ✅
    }
    
    therapeuticRange: {
      hasRange: boolean                 // ← FROM therapeutic_range.medications[].has_range ✅
      minValue: string                  // ← FROM therapeutic_range.medications[].min_ng_ml ✅
      maxValue: string                  // ← FROM therapeutic_range.medications[].max_ng_ml ✅
      unit: string                      // ← FROM therapeutic_range.medications[].unit ✅
      isNarrow: boolean                 // ← FROM therapeutic_range.medications[].is_narrow_window ✅
      adjustmentFactor: number          // ⚠️ HARDCODED (0.8 for narrow, 1.0 otherwise)
      slowdownPct: number               // ⚠️ HARDCODED (20 for narrow, 0 otherwise)
    }
    
    mdiImpact: {
      contributesToMdi: boolean         // ← FROM cyp_profile.medicationsWithSlowerEffect ⚠️
      role: string                      // ⚠️ HARDCODED ('Inhibitor', 'Inducer', 'Keine')
      score: number                     // ← COUNT of cypProfiles ⚠️
    }
    
    monitoring: string                  // ← GENERATED from multiple factors ✅
  }>
```

#### Level 3: Appendix:
```typescript
- cypDetails: Array<{                   // ← FROM entry.cypProfiles
    medicationName: string
    profiles: Array<{
      enzyme: string                    // ← FROM cypProfiles[].cyp_enzyme
      role: string                      // ← FROM cypProfiles[].role
      cbdEffect: string                 // ← FROM cypProfiles[].cbd_effect_on_reduction
      reductionImpact: string           // ← FORMATTED (-30% or +15%)
    }>
  }>

- fullSafetyNotes: Array<{              // ← FROM weeklyPlan[0].medications[].safety
    medicationName: string
    notes: string[]
  }>

- modelInfo: {                          // ← HARDCODED (static text)
    version: string
    factorsIncluded: string[]
    factorsNotIncluded: string[]
    technicalNote: string
  }
```

---

## 2. WELCHE DER NEUEN CYP-FELDER & BERECHNUNGSFAKTOREN WERDEN NICHT INS PDF ÜBERGEBEN?

### MISSING FOR PDF (Critical Gaps):

#### A. NEW DATABASE FIELDS (from Migrations 017+018):

**CYP Substrate Fields (5 enzymes):**
```typescript
❌ medication.cyp3a4_substrate       // NOT in AnalyzeResponse
❌ medication.cyp2d6_substrate       // NOT in AnalyzeResponse
❌ medication.cyp2c9_substrate       // NOT in AnalyzeResponse
❌ medication.cyp2c19_substrate      // NOT in AnalyzeResponse
❌ medication.cyp1a2_substrate       // NOT in AnalyzeResponse
```

**CYP Inhibitor Fields (5 enzymes):**
```typescript
❌ medication.cyp2d6_inhibitor       // NOT in AnalyzeResponse
❌ medication.cyp2c19_inhibitor      // NOT in AnalyzeResponse
❌ medication.cyp3a4_inhibitor       // NOT in AnalyzeResponse
❌ medication.cyp2c9_inhibitor       // NOT in AnalyzeResponse
❌ medication.cyp1a2_inhibitor       // NOT in AnalyzeResponse
```

**CYP Inducer Fields (5 enzymes):**
```typescript
❌ medication.cyp3a4_inducer         // NOT in AnalyzeResponse
❌ medication.cyp2d6_inducer         // NOT in AnalyzeResponse
❌ medication.cyp2c9_inducer         // NOT in AnalyzeResponse
❌ medication.cyp2c19_inducer        // NOT in AnalyzeResponse
❌ medication.cyp1a2_inducer         // NOT in AnalyzeResponse
```

**Status:** ⚠️ **CRITICAL** - These 15 new fields are NOT in the MedicationWithCategory interface.

---

#### B. CALCULATION FACTORS (7 Phases):

**Phase 1: Base Calculation**
```typescript
✅ base_reduction_pct                 // IMPLICIT in maxWeeklyReductionPct
```

**Phase 2: Category Limits**
```typescript
✅ category.max_weekly_reduction_pct  // AVAILABLE in medication.max_weekly_reduction_pct
✅ final_reduction_pct                // IMPLICIT in maxWeeklyReductionPct
```

**Phase 3: Half-Life Adjustment**
```typescript
❌ half_life_hours                    // AVAILABLE in medication.half_life_hours BUT NOT DISPLAYED
❌ halfLifeAdjustment (factor)        // NOT EXPOSED (0.5, 0.75, 1.0, 1.25, 1.5)
❌ halfLifeSlowdownPct                // NOT EXPOSED
```

**Phase 4: CYP450 Adjustment**
```typescript
⚠️ cypAdjustment (factor)             // HARDCODED in PDF (0.7 or 1.15) - NOT FROM CALCULATION
⚠️ cypSlowdownPct                     // HARDCODED in PDF (30 or -15) - NOT FROM CALCULATION
⚠️ affectedEnzymes                    // FROM cypProfiles BUT NOT FROM NEW DB FIELDS
```

**Phase 5: Therapeutic Window Adjustment**
```typescript
⚠️ therapeuticWindowFactor            // HARDCODED in PDF (0.8 or 1.0) - NOT FROM CALCULATION
⚠️ therapeuticSlowdownPct             // HARDCODED in PDF (20 or 0) - NOT FROM CALCULATION
✅ isNarrowWindow                     // AVAILABLE from therapeutic_range
```

**Phase 6: Withdrawal Risk Adjustment**
```typescript
✅ withdrawalFactor                   // AVAILABLE from withdrawal_risk_adjustment.factor
✅ withdrawalSlowdownPct              // AVAILABLE from withdrawal_risk_adjustment.reduction_slowdown_pct
✅ withdrawal_risk_score              // AVAILABLE from medication.withdrawal_risk_score
```

**Phase 7: Multi-Drug Interaction Factor**
```typescript
⚠️ interactionFactor                  // AVAILABLE from multi_drug_interaction.adjustment_factor
⚠️ inhibitorsCount                    // AVAILABLE from multi_drug_interaction.inhibitors
⚠️ inducersCount                      // AVAILABLE from multi_drug_interaction.inducers
❌ per-medication MDI contribution    // NOT EXPOSED (only global MDI)
```

---

### SUMMARY OF GAPS:

| Data Type | Available? | Displayed in PDF? | Source |
|-----------|------------|-------------------|--------|
| **New CYP Boolean Fields** | ❌ NO | ❌ NO | Missing from AnalyzeResponse |
| **Half-Life (raw value)** | ✅ YES | ❌ NO | medication.half_life_hours |
| **Half-Life Factor** | ❌ NO | ❌ NO | Not exposed in response |
| **CYP Adjustment Factor** | ⚠️ HARDCODED | ⚠️ YES (wrong) | Should come from calculation |
| **Therapeutic Window Factor** | ⚠️ HARDCODED | ⚠️ YES (wrong) | Should come from calculation |
| **Withdrawal Factor** | ✅ YES | ✅ YES | withdrawal_risk_adjustment.factor |
| **MDI Factor (global)** | ✅ YES | ✅ YES | multi_drug_interaction.adjustment_factor |
| **MDI Per-Med Contribution** | ❌ NO | ⚠️ INFERRED | Should be explicit |

---

## 3. WELCHE IDENTIFIKATOREN BRAUCHEN WIR ZUSÄTZLICH IM PDF?

### REQUIRED ADDITIONS TO AnalyzeResponse:

#### A. Expose Calculation Factors Per Medication:

**In `AnalysisEntry` interface (add these fields):**
```typescript
export interface AnalysisEntry {
  medication: MedicationWithCategory | MedicationNotFound;
  interactions: CbdInteraction[];
  mgPerDay: number;
  warning?: string;
  
  // ← ADD THESE NEW FIELDS:
  calculationFactors?: {
    phase1_base_reduction_pct: number;        // Base calculation (8% or custom)
    phase2_category_limit_pct: number;        // Category max (e.g., 15%)
    phase3_halflife_factor: number;           // 0.5, 0.75, 1.0, 1.25, 1.5
    phase4_cyp_factor: number;                // 0.9 (substrate), 1.1 (inducer), 1.0 (none)
    phase5_therapeutic_factor: number;        // 0.8 (narrow), 1.0 (normal)
    phase6_withdrawal_factor: number;         // 0.75-1.0 based on score
    phase7_mdi_factor: number;                // 1.0 + (0.15 × (n-1))
    final_reduction_pct: number;              // Product of all factors
  };
  
  max_weekly_reduction_pct: number;  // ← ALREADY EXISTS (final result)
  
  cypProfiles?: Array<{              // ← ALREADY EXISTS
    cyp_enzyme: string;
    role: string;
    cbd_effect_on_reduction: 'slower' | 'faster' | 'neutral';
  }>;
}
```

---

#### B. Add New CYP Fields to MedicationWithCategory:

**In `MedicationWithCategory` interface (add these fields):**
```typescript
export interface MedicationWithCategory {
  // ... existing fields ...
  
  // ← ADD THESE NEW FIELDS (from Migration 017):
  
  // CYP Substrate Fields
  cyp3a4_substrate?: number | null;   // 0 or 1
  cyp2d6_substrate?: number | null;   // 0 or 1
  cyp2c9_substrate?: number | null;   // 0 or 1
  cyp2c19_substrate?: number | null;  // 0 or 1
  cyp1a2_substrate?: number | null;   // 0 or 1
  
  // CYP Inhibitor Fields
  cyp2d6_inhibitor?: number | null;   // 0 or 1
  cyp2c19_inhibitor?: number | null;  // 0 or 1
  cyp3a4_inhibitor?: number | null;   // 0 or 1
  cyp2c9_inhibitor?: number | null;   // 0 or 1
  cyp1a2_inhibitor?: number | null;   // 0 or 1
  
  // CYP Inducer Fields
  cyp3a4_inducer?: number | null;     // 0 or 1
  cyp2d6_inducer?: number | null;     // 0 or 1
  cyp2c9_inducer?: number | null;     // 0 or 1
  cyp2c19_inducer?: number | null;    // 0 or 1
  cyp1a2_inducer?: number | null;     // 0 or 1
}
```

---

### ESTIMATED IMPLEMENTATION STATUS:

| Field | Backend Available? | In AnalyzeResponse? | In PDF Data? | Action Required |
|-------|-------------------|---------------------|--------------|-----------------|
| **cyp3a4_substrate** | ✅ YES (DB) | ❌ NO | ❌ NO | Add to SELECT query |
| **cyp3a4_inhibitor** | ✅ YES (DB) | ❌ NO | ❌ NO | Add to SELECT query |
| **cyp3a4_inducer** | ✅ YES (DB) | ❌ NO | ❌ NO | Add to SELECT query |
| **half_life_hours** | ✅ YES (DB) | ✅ YES | ❌ NO (not displayed) | Add to PDF template |
| **phase3_halflife_factor** | ✅ YES (calculated) | ❌ NO | ❌ NO | Expose in response |
| **phase4_cyp_factor** | ✅ YES (calculated) | ❌ NO | ⚠️ HARDCODED | Expose in response |
| **phase5_therapeutic_factor** | ✅ YES (calculated) | ❌ NO | ⚠️ HARDCODED | Expose in response |
| **phase6_withdrawal_factor** | ✅ YES (calculated) | ✅ YES | ✅ YES | ✅ Already correct |
| **phase7_mdi_factor** | ✅ YES (calculated) | ✅ YES (global) | ✅ YES (global) | ✅ Already correct |

---

## 4. ENTWURF: STRUKTUR FÜR DEN NEUEN ARZT-PDF-REPORT

### EMPFOHLENE ABSCHNITTSSTRUKTUR:

```
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 1: ÜBERSICHT                                         │
├─────────────────────────────────────────────────────────────┤
│ 1.1 Patientendaten                                          │
│     - Name, Alter, Gewicht, Geschlecht                      │
│     - Plandauer (Wochen)                                    │
│                                                             │
│ 1.2 Medikationsliste (Tabelle)                             │
│     | Medikament | Kategorie | Start | Ziel | Risiko | ... |
│     |------------|-----------|-------|------|--------|     |
│     | Prozac     | SSRI      | 20mg  | 5mg  | HOCH   | ... |
│     | Tavor      | Benzo     | 2mg   | 0mg  | MITTEL | ... |
│                                                             │
│ 1.3 Globales Interaktionsrisiko                            │
│     - Multi-Drug-Interaction Level: MODERAT                 │
│     - Anzahl Inhibitoren: 1                                 │
│     - Anzahl Induktoren: 0                                  │
│     - Adjustment Factor: 1.15 (15% langsamer)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LEVEL 2: MEDIKAMENTENPROFILE (Pro Medikament)              │
├─────────────────────────────────────────────────────────────┤
│ 2.1 Prozac (Fluoxetin) - SSRI                              │
│                                                             │
│ 2.1.1 Dosierung                                             │
│       Start: 20mg täglich → Ziel: 5mg täglich              │
│       Max. Wochenreduktion: 5.2%                            │
│                                                             │
│ 2.1.2 Berechnungsgrundlagen (7 Phasen)                     │
│       ┌─────────────────────────────────────────┐           │
│       │ Phase │ Faktor │ Einfluss │ Begründung  │           │
│       ├───────┼────────┼──────────┼─────────────┤           │
│       │ 1. Base      │ 8.0%  │ -      │ Standardwert         │
│       │ 2. Kategorie │ 15.0% │ -47%   │ SSRI-Limit           │
│       │ 3. HWZ       │ 0.5   │ -50%   │ Lange HWZ (120h)     │
│       │ 4. CYP       │ 0.9   │ -10%   │ CYP2D6-Inhibitor     │
│       │ 5. Therap.   │ 1.0   │ ±0%    │ Normal window        │
│       │ 6. Entzug    │ 0.75  │ -25%   │ Score: 8/10          │
│       │ 7. MDI       │ 1.15  │ -15%   │ 2 Medikamente        │
│       └───────┴────────┴──────────┴─────────────┘           │
│       FINAL: 5.2% pro Woche                                 │
│                                                             │
│ 2.1.3 CYP-Profil                                            │
│       - CYP2D6: Inhibitor (potent)                          │
│       - CYP2C9: Substrat                                    │
│       - CYP3A4: Substrat                                    │
│       Klinische Konsequenz: Erhöhter Wirkspiegel bei        │
│       gleichzeitiger Gabe mit CYP2D6-Substraten.            │
│                                                             │
│ 2.1.4 Entzugsrisiko                                         │
│       Score: 8/10 (HOCH)                                    │
│       Adjustment: -25% Verlangsamung                        │
│       Symptome: Unruhe, Schlafstörungen, Rebound            │
│                                                             │
│ 2.1.5 Monitoring-Empfehlungen                               │
│       - Wöchentliche Kontrollen in ersten 4 Wochen          │
│       - Auf Entzugssymptome achten                          │
│       - Bei Symptomen: Frühere Wiedervorstellung            │
│                                                             │
│ [... weitere Medikamente ...]                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LEVEL 3: ANHANG & DETAILS                                  │
├─────────────────────────────────────────────────────────────┤
│ 3.1 CYP450-Interaktionstabelle (Komplett)                  │
│     | Medikament | Enzym   | Rolle      | CBD-Effekt | ... |
│     |------------|---------|------------|------------|     |
│     | Prozac     | CYP2D6  | Inhibitor  | Langsamer  | ... |
│     | Prozac     | CYP2C9  | Substrat   | Langsamer  | ... |
│     | Tavor      | -       | NON-CYP    | Neutral    | ... |
│                                                             │
│ 3.2 Pharmakokinetische Parameter                            │
│     | Medikament | HWZ    | Kategorie | Reduktion  |      |
│     |------------|--------|-----------|------------|      |
│     | Prozac     | 120h   | Lang      | Langsam    |      |
│     | Tavor      | 12h    | Mittel    | Standard   |      |
│                                                             │
│ 3.3 Sicherheitshinweise (Pro Medikament)                   │
│     - Prozac: SSRI-Absetzrisiko, CYP2D6-Inhibitor           │
│     - Tavor: Benzodiazepin-Abhängigkeit, langsam ausschleichen │
│                                                             │
│ 3.4 MEDLESS-Modell Informationen                            │
│     Version: PlanIntelligenz 3.0                            │
│     Berücksichtigte Faktoren:                               │
│     - CYP450-Enzymsystem (5 Hauptenzyme)                    │
│     - Therapeutische Breite                                 │
│     - Absetzrisiko-Quantifizierung                          │
│     - Pharmakokinetische Halbwertszeit                      │
│     - Patientenspezifische Parameter                        │
│                                                             │
│     NICHT berücksichtigte Faktoren:                         │
│     - Pharmakogenetische Variationen                        │
│     - Komorbiditäten und Organfunktionsstörungen            │
│     - Individuelle Medikamentenverträglichkeit              │
│                                                             │
│ 3.5 Disclaimer                                              │
│     Dieses Modell stellt ein rechnergestütztes              │
│     Planungsinstrument dar und ersetzt nicht die            │
│     individuelle klinische Beurteilung.                     │
└─────────────────────────────────────────────────────────────┘
```

---

### BEISPIEL-TABELLE: Berechnungsfaktoren Pro Medikament

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Medikament   │ HWZ-Adj │ CYP-Adj │ Entzug │ Therap. │ MDI  │ Final Reduktion │
├──────────────┼─────────┼─────────┼────────┼─────────┼──────┼─────────────────┤
│ Prozac       │  0.50   │  0.90   │  0.75  │  1.00   │ 1.15 │      5.2%       │
│ Tavor        │  1.00   │  1.00   │  0.85  │  1.00   │ 1.15 │      9.8%       │
│ Carbamazepin │  1.00   │  0.90   │  0.90  │  0.80   │ 1.30 │      6.7%       │
└──────────────┴─────────┴─────────┴────────┴─────────┴──────┴─────────────────┘

Legende:
- HWZ-Adj: Phase 3 (Halbwertszeit-Anpassung)
- CYP-Adj: Phase 4 (CYP450-Anpassung)
- Entzug: Phase 6 (Withdrawal Risk)
- Therap.: Phase 5 (Therapeutic Window)
- MDI: Phase 7 (Multi-Drug Interaction)
- Final: Ergebnis aller Phasen
```

---

## 5. WIE LANGE SCHÄTZT DU, DASS DIE PDF-INTEGRATION DAUERT?

### GESCHÄTZTE IMPLEMENTIERUNGSZEIT:

#### Phase 1: Backend Updates (~90 min)

**A. Add CYP Fields to SELECT Query (20 min)**
- File: `src/index.tsx`
- Task: Add 15 CYP Boolean fields to medication SELECT query
- Complexity: LOW

**B. Expose Calculation Factors in AnalyzeResponse (40 min)**
- File: `src/index.tsx`
- Task: Add `calculationFactors` object to each `AnalysisEntry`
- Requires: Track all 7 phase factors during calculation
- Complexity: MEDIUM

**C. Update TypeScript Interfaces (15 min)**
- File: `src/types/analyzeResponse.ts`
- Task: Add new fields to `MedicationWithCategory` and `AnalysisEntry`
- Complexity: LOW

**D. Test Backend Changes (15 min)**
- Task: Verify new fields appear in `/api/analyze` response
- Complexity: LOW

---

#### Phase 2: PDF Data Builder Updates (~60 min)

**E. Populate `cypData.affectedEnzymes` from NEW DB Fields (30 min)**
- File: `src/report_data_v3.ts`
- Task: Create helper function to extract affected enzymes from 15 CYP fields
- Current: Uses `entry.cypProfiles` (old method)
- New: Uses `medication.cyp3a4_substrate`, etc. (new fields)
- Complexity: MEDIUM

```typescript
// New helper function needed:
function extractAffectedEnzymes(medication: MedicationWithCategory): string[] {
  const enzymes: string[] = [];
  if (medication.cyp3a4_substrate) enzymes.push('CYP3A4');
  if (medication.cyp2d6_substrate) enzymes.push('CYP2D6');
  if (medication.cyp2c9_substrate) enzymes.push('CYP2C9');
  if (medication.cyp2c19_substrate) enzymes.push('CYP2C19');
  if (medication.cyp1a2_substrate) enzymes.push('CYP1A2');
  return enzymes;
}
```

**F. Populate `mdiImpact.role` from NEW DB Fields (20 min)**
- File: `src/report_data_v3.ts`
- Task: Create helper function to determine MDI role
- Current: Hardcoded 'Inhibitor', 'Inducer', 'Keine'
- New: Check all 15 CYP inhibitor/inducer fields
- Complexity: MEDIUM

```typescript
// New helper function needed:
function getMdiRole(medication: MedicationWithCategory): string {
  const roles: string[] = [];
  if (medication.cyp2d6_inhibitor || medication.cyp2c19_inhibitor || medication.cyp3a4_inhibitor) {
    roles.push('CYP-Inhibitor');
  }
  if (medication.cyp3a4_inducer || medication.cyp2d6_inducer) {
    roles.push('CYP-Inducer');
  }
  if (medication.cyp3a4_substrate || medication.cyp2d6_substrate || medication.cyp2c9_substrate) {
    roles.push('CYP-Substrat');
  }
  return roles.join(', ') || 'Keine CYP-Interaktion';
}
```

**G. Replace Hardcoded Factors with Backend Data (10 min)**
- File: `src/report_data_v3.ts`
- Task: Use `entry.calculationFactors` instead of hardcoded values
- Current: `cypAdjustmentFactor = isSlower ? 0.7 : 1.15` (hardcoded)
- New: `cypAdjustmentFactor = entry.calculationFactors.phase4_cyp_factor`
- Complexity: LOW

---

#### Phase 3: PDF Template Updates (~45 min)

**H. Add "Berechnungsgrundlagen" Section to Level 2 (30 min)**
- File: `src/report_templates_doctor_v3.ts`
- Task: Add 7-phase table for each medication
- Show: Phase name, factor, impact %, explanation
- Complexity: MEDIUM

**I. Add Half-Life Display to Level 3 Appendix (OPTIONAL) (15 min)**
- File: `src/report_templates_doctor_v3.ts`
- Task: Add pharmacokinetics table
- Show: Medication, half-life, category, reduction speed
- Complexity: LOW

---

#### Phase 4: Testing & Validation (~30 min)

**J. Test with Sample Medications (15 min)**
- Test Cases:
  1. Fluoxetin (CYP2D6-Inhibitor, long half-life, high withdrawal)
  2. Lorazepam (NON-CYP, medium half-life, medium withdrawal)
  3. Carbamazepin (CYP3A4-Inducer, medium half-life, high withdrawal)
- Complexity: MEDIUM

**K. Medical Review & Final Polish (15 min)**
- Task: Review generated PDF for medical accuracy
- Check: All factors displayed correctly
- Check: No hardcoded values remain
- Complexity: LOW

---

### TOTAL ESTIMATED TIME:

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1: Backend Updates** | A-D | ~90 minutes |
| **Phase 2: PDF Data Builder** | E-G | ~60 minutes |
| **Phase 3: PDF Template** | H-I | ~45 minutes |
| **Phase 4: Testing** | J-K | ~30 minutes |
| **TOTAL** | A-K | **~225 minutes (~3.75 hours)** |

**With ONLY Critical Changes (Priority 1):**
- Phase 1 (Backend): ~90 min
- Phase 2 (Data Builder E-F): ~50 min
- **Total Critical:** **~140 minutes (~2.3 hours)**

---

## ZIEL VON PHASE E: ✅ ERREICHT

**Wir haben jetzt:**
1. ✅ Vollständige Liste aller verfügbaren PDF-Variablen
2. ✅ Identifikation aller fehlenden CYP-Felder und Berechnungsfaktoren
3. ✅ Klare Priorisierung: Was muss ergänzt werden
4. ✅ Empfohlene PDF-Struktur mit 3 Leveln
5. ✅ Realistische Zeitschätzung (~3.75h total, ~2.3h kritisch)

**Nächster Schritt:**
PHASE F → PDF-IMPLEMENTIERUNG (Backend + PDF Data Builder + Template)

---

**END OF PHASE E – PDF-INTEGRATION ANALYSE**

**Status:** ✅ **ANALYSE COMPLETE - READY FOR PHASE F IMPLEMENTATION**
