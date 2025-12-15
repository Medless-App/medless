import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { buildPatientReportData, buildDoctorReportData } from './report_data'
import { renderDoctorReportHtmlFixed, renderDoctorReportExample } from './report_templates'
import { renderPatientPlanExample } from './report_templates_patient_v2'
// MEGAPROMPT V2 TEMPLATES
import { buildDoctorReportDataV3 } from './report_data_v3'
import { renderDoctorReportHtmlV3 } from './report_templates_doctor_v3'
import { buildPatientPlanData, renderPatientPlanHTML } from './report_templates_patient_v2'
import type { AnalyzeResponse } from './types/analyzeResponse'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  PDFSHIFT_API_KEY?: string;
}

// ============================================================
// TYPE DEFINITIONS: Medication Category Safety Rules
// ============================================================

interface MedicationCategory {
  id: number;
  name: string;
  risk_level: string | null;
  can_reduce_to_zero: number | null;
  default_min_target_fraction: number | null;
  max_weekly_reduction_pct: number | null;
  requires_specialist: number | null;
  notes: string | null;
}

interface MedicationWithCategory {
  id: number;
  name: string;
  generic_name: string;
  category_id: number | null;
  cyp450_enzyme?: string | null;
  description?: string | null;
  common_dosage?: string | null;
  
  // Category fields (from JOIN)
  category?: MedicationCategory | null;
  category_name?: string;
  risk_level?: string | null;
  
  // Category safety fields
  can_reduce_to_zero?: number | null;
  default_min_target_fraction?: number | null;
  max_weekly_reduction_pct?: number | null;
  requires_specialist?: number | null;
  category_notes?: string | null;
  
  // ===== NEW: Medication-specific pharmacokinetic fields (Migration 0005) =====
  half_life_hours?: number | null;
  therapeutic_min_ng_ml?: number | null;
  therapeutic_max_ng_ml?: number | null;
  withdrawal_risk_score?: number | null;
  // Note: max_weekly_reduction_pct also exists as medication-specific field
  // Note: can_reduce_to_zero also exists as medication-specific field
  cbd_interaction_strength?: 'low' | 'medium' | 'high' | 'critical' | null;
}

// ============================================================
// TYPE DEFINITION: CYP450 Enzyme Profile
// ============================================================

interface MedicationCypProfile {
  id: number;
  medication_id: number;
  cyp_enzyme: string; // e.g., 'CYP2D6', 'CYP3A4', 'UGT'
  role: string; // 'substrate', 'inhibitor', 'inducer', 'mixed'
  cbd_effect_on_reduction: 'faster' | 'neutral' | 'slower' | null;
  note: string | null;
}

interface SafetyResult {
  effectiveTargetMg: number;
  effectiveWeeklyReduction: number;
  safetyNotes: string[];
  limitedByCategory: boolean;
  appliedCategoryRules: boolean;
  cypAdjustmentApplied?: boolean; // NEW: Indicates if CYP logic was applied
  cypAdjustmentFactor?: number; // NEW: CYP adjustment multiplier (e.g., 0.7, 1.15)
  withdrawalRiskAdjustmentApplied?: boolean; // NEW P1: Indicates if withdrawal risk quantification was applied
  withdrawalRiskFactor?: number; // NEW P1: Withdrawal risk factor (0.75-1.0)
  
  // NEW: Calculation Factors (for PDF transparency - PHASE F)
  calculationFactors?: {
    baseReductionPct: number; // Phase 1: Base (10%)
    categoryLimit: number | null; // Phase 2: Category Safety Limit
    halfLifeFactor: number; // Phase 3: Half-Life Adjustment (0.5, 0.75, 1.0)
    cypFactor: number; // Phase 4: CYP Adjustment (0.7, 1.0, 1.15)
    therapeuticWindowFactor: number; // Phase 5: Narrow Therapeutic Window (0.8, 1.0)
    withdrawalFactor: number; // Phase 6: Withdrawal Risk (0.75-1.0)
    interactionFactor: number; // Phase 7: Multi-Drug Interaction (0.7-1.0)
    finalFactor: number; // Product of all factors
  };
}

// ============================================================
// P0 TASK #2: THERAPEUTIC RANGE MONITORING
// ============================================================

interface TherapeuticRangeWarning {
  underdoseWarning?: string;
  overdoseWarning?: string;
  narrowWindowWarning?: string;
}

/**
 * Evaluates therapeutic range for a medication at a given dose.
 * 
 * HEURISTIC APPROACH (since mg vs. ng/ml cannot be directly converted):
 * - Uses therapeutic_min/max_ng_ml primarily to detect PRESENCE of a therapeutic window
 * - Evaluates dose fraction (currentDoseMg / startingDoseMg) for underdose/overdose risk
 * - Flags narrow therapeutic windows based on range width
 * 
 * @param medication - Medication data including therapeutic_min/max_ng_ml, withdrawal_risk_score
 * @param currentDoseMg - Current dose in mg
 * @param startingDoseMg - Starting dose in mg
 * @returns Object with warnings (if any)
 */
function evaluateTherapeuticRange(
  medication: MedicationWithCategory,
  currentDoseMg: number,
  startingDoseMg: number
): TherapeuticRangeWarning {
  const warnings: TherapeuticRangeWarning = {};
  
  const hasTherapeuticRange = 
    medication.therapeutic_min_ng_ml != null && 
    medication.therapeutic_max_ng_ml != null;
  
  // If no therapeutic range defined, return empty warnings
  if (!hasTherapeuticRange) {
    return warnings;
  }
  
  const doseFraction = startingDoseMg > 0 ? currentDoseMg / startingDoseMg : 0;
  const windowWidth = (medication.therapeutic_max_ng_ml || 0) - (medication.therapeutic_min_ng_ml || 0);
  const hasHighWithdrawalRisk = (medication.withdrawal_risk_score || 0) >= 7;
  
  // HEURISTIC 1: Underdose risk
  // If dose drops below 20% of starting dose AND medication has high withdrawal risk
  // → Risk of falling below therapeutic minimum
  if (medication.therapeutic_min_ng_ml != null && doseFraction < 0.2 && hasHighWithdrawalRisk) {
    warnings.underdoseWarning = 
      `⚠️ ${medication.name}: Mögliche Unterdosierungsgefahr bei sehr niedriger Dosis – ` +
      `enges therapeutisches Fenster, ärztliche Kontrolle empfohlen.`;
  }
  
  // HEURISTIC 2: Overdose risk
  // If dose exceeds starting dose (e.g., user input error)
  // → Risk of exceeding therapeutic maximum
  if (medication.therapeutic_max_ng_ml != null && doseFraction > 1.0) {
    warnings.overdoseWarning = 
      `⚠️ ${medication.name}: Mögliche Überdosierungsgefahr – ` +
      `Dosis liegt über der Ausgangsdosis, bitte ärztlich prüfen.`;
  }
  
  // HEURISTIC 3: Narrow therapeutic window
  // If therapeutic range is defined AND window width is small (≤ 50 units)
  // → Requires extra caution during tapering
  // Note: 50 is a conservative threshold for ng/ml range
  if (hasTherapeuticRange && windowWidth <= 50) {
    warnings.narrowWindowWarning = 
      `🧪 ${medication.name}: Enges therapeutisches Fenster (${medication.therapeutic_min_ng_ml}-${medication.therapeutic_max_ng_ml} ng/ml) – ` +
      `langsamer Ausschleich-Verlauf und engmaschige Kontrolle empfohlen.`;
  }
  
  return warnings;
}

// ============================================================
// SAFETY FUNCTION: Apply Category-Based Reduction Limits
// ============================================================

function applyCategorySafetyRules(params: {
  startMg: number;
  reductionGoal: number;
  durationWeeks: number;
  medicationName: string;
  category?: MedicationWithCategory | null;
  cypProfiles?: MedicationCypProfile[]; // NEW: CYP profiles from medication_cyp_profile table
}): SafetyResult {
  const { startMg, reductionGoal, durationWeeks, medicationName, category, cypProfiles = [] } = params;
  
  const safetyNotes: string[] = [];
  let appliedCategoryRules = false;
  let limitedByCategory = false;
  
  // ===== NEW: Add withdrawal risk warnings based on Migration 0005 fields =====
  if (category?.withdrawal_risk_score && category.withdrawal_risk_score >= 7) {
    safetyNotes.push(
      `⚠️ ${medicationName}: Hohes Absetzrisiko (Score: ${category.withdrawal_risk_score}/10) - Langsame Reduktion empfohlen`
    );
  }
  
  // ===== NEW: Add CBD interaction strength warnings =====
  if (category?.cbd_interaction_strength === 'critical') {
    safetyNotes.push(
      `🚨 ${medicationName}: Kritische CBD-Wechselwirkung - Engmaschige ärztliche Kontrolle erforderlich`
    );
  } else if (category?.cbd_interaction_strength === 'high') {
    safetyNotes.push(
      `⚠️ ${medicationName}: Starke CBD-Wechselwirkung - Vorsicht bei gleichzeitiger Einnahme`
    );
  }
  
  // Base calculation from user input
  let targetFraction = 1 - (reductionGoal / 100);
  
  // If no category data, return original calculation
  if (!category || 
      (category.can_reduce_to_zero === null && 
       category.default_min_target_fraction === null && 
       category.max_weekly_reduction_pct === null)) {
    const desiredTargetMg = startMg * targetFraction;
    const weeklyReduction = (startMg - desiredTargetMg) / durationWeeks;
    
    return {
      effectiveTargetMg: desiredTargetMg,
      effectiveWeeklyReduction: weeklyReduction,
      safetyNotes,
      limitedByCategory: false,
      appliedCategoryRules: false
    };
  }
  
  appliedCategoryRules = true;
  
  // Rule 1: Check if reduction to zero is allowed (MEDICATION-SPECIFIC has priority)
  const canReduceToZero = category.can_reduce_to_zero ?? 1; // Default: reduction allowed
  
  if (canReduceToZero === 0 || category.risk_level === 'lifelong' || category.risk_level === 'very_high') {
    if (category.default_min_target_fraction !== null && category.default_min_target_fraction > 0) {
      // Use category's minimum target fraction
      targetFraction = Math.max(targetFraction, category.default_min_target_fraction);
      if (targetFraction > (1 - reductionGoal / 100)) {
        limitedByCategory = true;
        safetyNotes.push(
          `⚠️ ${medicationName}: Reduktion begrenzt auf max. ${Math.round((1 - targetFraction) * 100)}% (Kategorie-Sicherheitsregel)`
        );
      }
    } else {
      // No reduction allowed at all - set minimum target to 50%
      targetFraction = 0.5;
      limitedByCategory = true;
      safetyNotes.push(
        `🔒 ${medicationName}: Keine Vollreduktion möglich - Minimum 50% Erhaltungsdosis`
      );
    }
  } 
  // Rule 2: Apply minimum target fraction (even if can_reduce_to_zero = 1)
  else if (category.default_min_target_fraction !== null && category.default_min_target_fraction > 0) {
    const originalTargetFraction = targetFraction;
    targetFraction = Math.max(targetFraction, category.default_min_target_fraction);
    if (targetFraction > originalTargetFraction) {
      limitedByCategory = true;
      safetyNotes.push(
        `⚠️ ${medicationName}: Reduktion begrenzt auf max. ${Math.round((1 - targetFraction) * 100)}% (Sicherheitsgrenze)`
      );
    }
  }
  
  // Calculate desired target
  const desiredTargetMg = Math.max(0, startMg * targetFraction);
  
  // Base weekly reduction
  let weeklyReductionBase = (startMg - desiredTargetMg) / durationWeeks;
  
  // Rule 3: Apply maximum weekly reduction percentage (MEDICATION-SPECIFIC has priority over category)
  let effectiveWeeklyReduction = weeklyReductionBase;
  
  const maxWeeklyReductionPct = category.max_weekly_reduction_pct; // Use medication-specific if available
  
  if (maxWeeklyReductionPct !== null && maxWeeklyReductionPct > 0) {
    const maxWeeklyReductionMg = startMg * (maxWeeklyReductionPct / 100);
    
    if (weeklyReductionBase > maxWeeklyReductionMg) {
      effectiveWeeklyReduction = maxWeeklyReductionMg;
      limitedByCategory = true;
      safetyNotes.push(
        `🐌 ${medicationName}: Reduktionsgeschwindigkeit begrenzt auf max. ${maxWeeklyReductionPct}%/Woche`
      );
    }
  }
  
  // ===== NEW: Apply half-life-based reduction factor (Migration 0005) =====
  if (category.half_life_hours && category.half_life_hours > 0) {
    const steadyStateDays = (category.half_life_hours * 5) / 24; // 5 half-lives = steady state
    
    if (steadyStateDays > 7) {
      // Long half-life (> 7 days steady state) - reduce speed by 50%
      effectiveWeeklyReduction *= 0.5;
      limitedByCategory = true;
      safetyNotes.push(
        `🕐 ${medicationName}: Lange Halbwertszeit (${Math.round(category.half_life_hours)}h) - Reduktion auf 50% verlangsamt`
      );
    } else if (steadyStateDays > 3) {
      // Medium half-life (3-7 days) - reduce speed by 25%
      effectiveWeeklyReduction *= 0.75;
      limitedByCategory = true;
      safetyNotes.push(
        `🕐 ${medicationName}: Mittlere Halbwertszeit (${Math.round(category.half_life_hours)}h) - Reduktion auf 75% angepasst`
      );
    }
  }
  
  // ===== NEW P0: CYP450-BASED DOSAGE ADJUSTMENT (CRITICAL FEATURE) =====
  // CYP enzymes determine how drugs are metabolized. CBD can inhibit certain CYP enzymes,
  // affecting medication clearance and requiring dosage adjustments.
  // 
  // Logic:
  // - 'slower' effect: CBD inhibits CYP enzyme → medication stays longer in body → reduce faster (SLOWER reduction)
  // - 'faster' effect: No CYP inhibition → medication clears normally → standard reduction
  // - 'neutral': No significant CYP interaction
  //
  // Priority: If ANY profile shows 'slower', apply cautious approach (30% reduction)
  // Only if ALL profiles are 'faster' (and none 'slower'), allow slightly faster reduction
  
  let cypAdjustmentApplied = false;
  let cypAdjustmentFactor = 1.0;
  
  if (cypProfiles && cypProfiles.length > 0) {
    const hasSlowerEffect = cypProfiles.some(p => p.cbd_effect_on_reduction === 'slower');
    const hasFasterEffect = cypProfiles.some(p => p.cbd_effect_on_reduction === 'faster');
    const allNeutral = cypProfiles.every(p => p.cbd_effect_on_reduction === 'neutral' || p.cbd_effect_on_reduction === null);
    
    if (hasSlowerEffect) {
      // CRITICAL: CBD inhibits CYP enzyme → medication accumulates → SLOWER tapering required
      // Example: Warfarin (CYP2C9 substrate) + CBD (CYP2C9 inhibitor) → higher warfarin levels
      cypAdjustmentFactor = 0.7; // 30% slower reduction
      effectiveWeeklyReduction *= cypAdjustmentFactor;
      cypAdjustmentApplied = true;
      limitedByCategory = true;
      
      const affectedEnzymes = cypProfiles
        .filter(p => p.cbd_effect_on_reduction === 'slower')
        .map(p => p.cyp_enzyme)
        .join(', ');
      
      safetyNotes.push(
        `🧬 ${medicationName}: CYP-Hemmung unter CBD erkannt (${affectedEnzymes}) - Reduktion wird automatisch um 30% verlangsamt für mehr Sicherheit`
      );
      
    } else if (hasFasterEffect && !hasSlowerEffect && !allNeutral) {
      // RARE CASE: CBD does NOT inhibit clearance (e.g., UGT-metabolized drugs like Lorazepam)
      // Slightly faster reduction MAY be safe, but still conservative (15% faster only)
      cypAdjustmentFactor = 1.15; // 15% faster reduction (conservative)
      effectiveWeeklyReduction *= cypAdjustmentFactor;
      cypAdjustmentApplied = true;
      
      const affectedEnzymes = cypProfiles
        .filter(p => p.cbd_effect_on_reduction === 'faster')
        .map(p => p.cyp_enzyme)
        .join(', ');
      
      safetyNotes.push(
        `🧬 ${medicationName}: CYP-Konstellation unter CBD erlaubt leicht schnellere Reduktion (${affectedEnzymes}) - Anpassung: +15%, weiterhin mit ärztlicher Kontrolle`
      );
    }
    // If allNeutral: no adjustment needed, effectiveWeeklyReduction stays unchanged
  }
  
  // ===== NEW P0 TASK #2: THERAPEUTIC RANGE ADJUSTMENT =====
  // If medication has a narrow therapeutic window AND high withdrawal risk,
  // apply additional safety brake (20% slower reduction)
  // This runs AFTER CYP adjustment but BEFORE final max_weekly_reduction_pct enforcement
  
  let therapeuticRangeAdjustmentApplied = false;
  
  if (category.therapeutic_min_ng_ml != null && category.therapeutic_max_ng_ml != null) {
    const windowWidth = category.therapeutic_max_ng_ml - category.therapeutic_min_ng_ml;
    const hasNarrowWindow = windowWidth <= 50; // HEURISTIC: ≤50 ng/ml range is considered narrow
    const hasHighWithdrawalRisk = (category.withdrawal_risk_score || 0) >= 7;
    
    if (hasNarrowWindow && hasHighWithdrawalRisk) {
      // Apply additional 20% reduction to weekly speed for extra safety
      effectiveWeeklyReduction *= 0.8; // 20% slower
      therapeuticRangeAdjustmentApplied = true;
      limitedByCategory = true;
      
      safetyNotes.push(
        `🧪 ${medicationName}: Enges therapeutisches Fenster (${category.therapeutic_min_ng_ml}-${category.therapeutic_max_ng_ml} ng/ml) + hohes Absetzrisiko (${category.withdrawal_risk_score}/10) - Reduktion wird vorsichtshalber zusätzlich um 20% verlangsamt.`
      );
    }
  }
  
  // ===== NEW P1 TASK #4: WITHDRAWAL RISK QUANTIFICATION =====
  // Apply withdrawal risk as a quantitative factor, not just a warning
  // Formula: withdrawal_factor = 1 - (withdrawal_risk_score / 10 * 0.25)
  // Examples:
  //   Score 4 → factor 0.9 → -10% reduction speed
  //   Score 8 → factor 0.8 → -20% reduction speed
  //   Score 10 → factor 0.75 → -25% reduction speed
  //
  // This runs AFTER Therapeutic Range adjustment but BEFORE final max_weekly_reduction_pct
  
  let withdrawalRiskAdjustmentApplied = false;
  let withdrawalRiskFactor = 1.0;
  
  if (category.withdrawal_risk_score && category.withdrawal_risk_score > 0) {
    // Calculate withdrawal factor based on risk score (score is 0-10)
    withdrawalRiskFactor = 1 - (category.withdrawal_risk_score / 10 * 0.25);
    
    // Apply withdrawal risk factor to reduction speed
    effectiveWeeklyReduction *= withdrawalRiskFactor;
    withdrawalRiskAdjustmentApplied = true;
    limitedByCategory = true;
    
    const slowdownPct = Math.round((1 - withdrawalRiskFactor) * 100);
    safetyNotes.push(
      `⚠️ ${medicationName}: Hoher Absetzrisiko-Score (${category.withdrawal_risk_score}/10) - Reduktion wird um ${slowdownPct}% verlangsamt`
    );
  }
  
  // Calculate effective target based on weekly reduction limit
  const effectiveTargetMg = Math.max(0, startMg - (effectiveWeeklyReduction * durationWeeks));
  
  // Additional note if target changed due to speed limit
  if (effectiveTargetMg > desiredTargetMg && limitedByCategory) {
    const actualReductionPct = Math.round(((startMg - effectiveTargetMg) / startMg) * 100);
    safetyNotes.push(
      `ℹ️ ${medicationName}: Tatsächliche Reduktion: ${actualReductionPct}% (statt ${reductionGoal}%)`
    );
  }
  
  // Add specialist note if required
  if (category.requires_specialist === 1) {
    safetyNotes.push(
      `👨‍⚕️ ${medicationName}: Fachärztliche Begleitung erforderlich`
    );
  }
  
  // ===== NEW: PHASE F - Calculate Calculation Factors for PDF Transparency =====
  // Extract all calculation steps into structured format
  const baseReductionPct = 10; // Phase 1: Base (always 10%)
  const categoryLimit = maxWeeklyReductionPct; // Phase 2: Category Safety Limit
  
  // Phase 3: Half-Life Factor (determined by steady state calculation)
  let halfLifeFactor = 1.0;
  if (category.half_life_hours && category.half_life_hours > 0) {
    const steadyStateDays = (category.half_life_hours * 5) / 24;
    if (steadyStateDays > 7) {
      halfLifeFactor = 0.5;
    } else if (steadyStateDays > 3) {
      halfLifeFactor = 0.75;
    }
  }
  
  // Phase 4: CYP Factor (already calculated)
  const cypFactor = cypAdjustmentFactor;
  
  // Phase 5: Therapeutic Window Factor
  const therapeuticWindowFactor = therapeuticRangeAdjustmentApplied ? 0.8 : 1.0;
  
  // Phase 6: Withdrawal Factor (already calculated)
  const withdrawalFactor = withdrawalRiskFactor;
  
  // Phase 7: Multi-Drug Interaction Factor (will be calculated later in /api/analyze)
  const interactionFactor = 1.0; // Placeholder - actual value calculated in multi-drug context
  
  // Final Factor: Product of all factors
  const finalFactor = halfLifeFactor * cypFactor * therapeuticWindowFactor * withdrawalFactor * interactionFactor;
  
  const calculationFactors = {
    baseReductionPct,
    categoryLimit,
    halfLifeFactor,
    cypFactor,
    therapeuticWindowFactor,
    withdrawalFactor,
    interactionFactor,
    finalFactor
  };
  
  return {
    effectiveTargetMg,
    effectiveWeeklyReduction,
    safetyNotes,
    limitedByCategory,
    appliedCategoryRules,
    cypAdjustmentApplied, // NEW: Indicates if CYP-based adjustment was applied
    cypAdjustmentFactor, // NEW: CYP adjustment multiplier (0.7 = 30% slower, 1.15 = 15% faster)
    withdrawalRiskAdjustmentApplied, // NEW P1: Indicates if withdrawal risk quantification was applied
    withdrawalRiskFactor, // NEW P1: Withdrawal risk factor (0.75-1.0)
    calculationFactors // NEW: PHASE F - Calculation Factors for PDF
  };
}

const app = new Hono<{ Bindings: Bindings }>()

// MEDLESS Product Data - CBD Dosier-Sprays (FIXED VALUES - DO NOT CHANGE)
const MEDLESS_PRODUCTS = [
  { nr: 5,  cbdPerSpray: 5.8,  name: 'MEDLESS Nr. 5',  price: 24.90 },
  { nr: 10, cbdPerSpray: 11.5, name: 'MEDLESS Nr. 10', price: 39.90 },
  { nr: 15, cbdPerSpray: 17.5, name: 'MEDLESS Nr. 15', price: 59.90 },
  { nr: 20, cbdPerSpray: 23.2, name: 'MEDLESS Nr. 20', price: 79.90 },
  { nr: 25, cbdPerSpray: 29.0, name: 'MEDLESS Nr. 25', price: 99.90 }
];

const BOTTLE_CAPACITY = 100; // Sprays per 10ml bottle (FIXED - 100 sprays = 10ml)

// Medless-AI: Select optimal product with minimal sprays, no overdose, max 6 sprays per time
function selectOptimalProduct(targetDailyMg: number) {
  let bestProduct = MEDLESS_PRODUCTS[0];
  let bestSprayCount = 999;
  
  for (const product of MEDLESS_PRODUCTS) {
    const totalSprays = Math.ceil(targetDailyMg / product.cbdPerSpray);
    const morningSprays = Math.max(1, Math.round(totalSprays * 0.4));
    const eveningSprays = totalSprays - morningSprays;
    
    // Rules: No overdose, max 6 sprays per intake, prefer fewer sprays
    const actualMg = totalSprays * product.cbdPerSpray;
    if (actualMg <= targetDailyMg * 1.1 && // Max 10% overdose tolerance
        morningSprays <= 6 && 
        eveningSprays <= 6 &&
        totalSprays < bestSprayCount) {
      bestProduct = product;
      bestSprayCount = totalSprays;
    }
  }
  
  return bestProduct;
}

// Medless-AI: Generate weekly plan with bottle tracking - NO unnecessary product changes!
function generateWeeklyPlanWithBottleTracking(
  cbdStartMg: number,
  cbdEndMg: number,
  durationWeeks: number
) {
  const cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks;
  const weeklyPlan: any[] = [];
  
  // Bottle tracking state
  let currentProduct = selectOptimalProduct(cbdStartMg);
  let bottleRemaining = BOTTLE_CAPACITY;
  let totalSpraysUsed = 0;
  
  for (let week = 1; week <= durationWeeks; week++) {
    const weekCbdDose = cbdStartMg + (cbdWeeklyIncrease * (week - 1));
    
    // Calculate sprays needed this week
    const totalSpraysPerDay = Math.ceil(weekCbdDose / currentProduct.cbdPerSpray);
    const spraysThisWeek = totalSpraysPerDay * 7;
    
    // Check if current bottle + product is still sufficient
    const needsProductChange = 
      bottleRemaining < spraysThisWeek || // Bottle will run out
      totalSpraysPerDay > 12; // Too many sprays per day (max ~12)
    
    if (needsProductChange && bottleRemaining < spraysThisWeek) {
      // Bottle running out - switch to new bottle with potentially new product
      currentProduct = selectOptimalProduct(weekCbdDose);
      bottleRemaining = BOTTLE_CAPACITY;
      totalSpraysUsed = 0;
    } else if (needsProductChange && totalSpraysPerDay > 12) {
      // Dosage too high - upgrade to stronger product
      currentProduct = selectOptimalProduct(weekCbdDose);
      bottleRemaining = BOTTLE_CAPACITY;
      totalSpraysUsed = 0;
    }
    
    // Recalculate with current product
    const totalSprays = Math.ceil(weekCbdDose / currentProduct.cbdPerSpray);
    const morningSprays = Math.max(1, Math.round(totalSprays * 0.4));
    const eveningSprays = totalSprays - morningSprays;
    const actualCbdMg = totalSprays * currentProduct.cbdPerSpray;
    const spraysPerWeek = totalSprays * 7;
    
    // Update bottle tracking
    bottleRemaining -= spraysPerWeek;
    totalSpraysUsed += spraysPerWeek;
    
    // Calculate when bottle will be empty
    const daysUntilEmpty = Math.floor(bottleRemaining / totalSprays);
    const weeksUntilEmpty = Math.floor(daysUntilEmpty / 7);
    
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
  
  return weeklyPlan;
}

// Medless-AI: Calculate total costs for the entire plan
function calculatePlanCosts(weeklyPlan: any[]) {
  const bottleUsage: { [key: string]: { count: number; product: any; totalSprays: number; weeks: number[] } } = {};
  
  let currentProduct: any = null;
  let currentBottleNumber = 0;
  let bottleRemaining = 0;
  
  weeklyPlan.forEach((week) => {
    const product = week.kannasanProduct;
    const spraysThisWeek = week.totalSprays * 7;
    const productKey = `MEDLESS Nr. ${product.nr}`;
    
    // Check if product changed or bottle empty
    if (!currentProduct || currentProduct.nr !== product.nr || bottleRemaining < spraysThisWeek) {
      // New bottle needed
      currentBottleNumber++;
      bottleRemaining = BOTTLE_CAPACITY;
      currentProduct = product;
      
      if (!bottleUsage[productKey]) {
        bottleUsage[productKey] = {
          count: 0,
          product: MEDLESS_PRODUCTS.find(p => p.nr === product.nr),
          totalSprays: 0,
          weeks: []
        };
      }
      
      bottleUsage[productKey].count++;
    }
    
    // Update usage
    bottleUsage[productKey].totalSprays += spraysThisWeek;
    bottleUsage[productKey].weeks.push(week.week);
    bottleRemaining -= spraysThisWeek;
  });
  
  // Calculate costs
  const costBreakdown: any[] = [];
  let totalCost = 0;
  
  Object.keys(bottleUsage).forEach((productKey) => {
    const usage = bottleUsage[productKey];
    const productCost = usage.count * usage.product.price;
    totalCost += productCost;
    
    costBreakdown.push({
      product: productKey,
      productNr: usage.product.nr,
      pricePerBottle: usage.product.price,
      bottleCount: usage.count,
      totalSprays: usage.totalSprays,
      totalCost: Math.round(productCost * 100) / 100,
      weeksUsed: `${usage.weeks[0]}-${usage.weeks[usage.weeks.length - 1]}`
    });
  });
  
  return {
    costBreakdown,
    totalCost: Math.round(totalCost * 100) / 100,
    totalBottles: Object.values(bottleUsage).reduce((sum, u) => sum + u.count, 0),
    totalSprays: Object.values(bottleUsage).reduce((sum, u) => sum + u.totalSprays, 0)
  };
}

// ============================================================
// SHARED ANALYSIS FUNCTION: Single Source of Truth
// ============================================================
// This function contains the complete analysis logic used by both
// /api/analyze and /api/analyze-and-reports routes.
// DO NOT modify this function without understanding its medical implications.

async function buildAnalyzeResponse(body: any, env: any) {
  // Extract and normalize field names (support both API formats + nested structures)
  const patient = body.patient || {};
  const plan = body.plan || {};
  
  const { 
    medications, 
    durationWeeks = plan.duration_weeks, 
    reductionGoal = plan.reduction_percentage || 50, 
    email = patient.email, 
    firstName = patient.first_name, 
    vorname = patient.vorname,     // German field name
    patientName,
    gender = patient.gender, 
    geschlecht = patient.geschlecht,  // German field name
    patientGender,
    age = patient.age, 
    alter = patient.alter,       // German field name
    patientAge,
    weight = patient.weight, 
    gewicht = patient.gewicht,     // German field name
    patientWeight,
    height = patient.height,
    groesse = patient.groesse      // German field name
  } = body;
  
  // ===== NEW: Extract organ function parameters =====
  const liverFunction = patient.liver_function ?? 'normal';
  const kidneyFunction = patient.kidney_function ?? 'normal';
  
  // ✅ FIX 2: Field Mapping Standardization (firstName takes priority)
  const finalFirstName = firstName || vorname || patientName || '';
  const finalGender = geschlecht || gender || patientGender;
  const finalAge = alter || age || patientAge;
  const finalWeight = gewicht || weight || patientWeight;
  const finalHeight = groesse || height;
  
  // ✅ FIX 3: Error-Handling für leere Medikamentenliste
  if (!medications || !Array.isArray(medications) || medications.length === 0) {
    throw new Error('Bitte fügen Sie mindestens ein Medikament hinzu.');
  }
  
  if (!durationWeeks || durationWeeks < 1) {
    throw new Error('Bitte geben Sie eine gültige Dauer in Wochen an');
  }
  
  // Normalize medication field names (support: daily_dose_mg, dailyDoseMg, mgPerDay)
  for (const med of medications) {
    // ✅ D1 FIX: Preserve user input as "userInputName" before normalization
    med.userInputName = med.name || med.generic_name || 'Unbekanntes Medikament';
    
    // Normalize medication name (support both name and generic_name)
    med.name = med.name || med.generic_name || 'Unbekanntes Medikament';
    
    // Support multiple field names for daily dose
    const doseMg = med.daily_dose_mg || med.dailyDoseMg || med.mgPerDay;
    
    // Allow null/undefined (Tagesdosis fehlt), but validate if present
    if (doseMg !== null && doseMg !== undefined) {
      if (isNaN(doseMg) || doseMg < 0) {
        throw new Error(`Bitte geben Sie eine gültige Tagesdosis in mg für "${med.name}" ein`);
      }
    }
    
    // Normalize to mgPerDay for internal use (null if not provided)
    med.mgPerDay = doseMg !== null && doseMg !== undefined ? doseMg : null;
  }
  
  // Save email to database if provided
  if (email) {
    try {
      await env.DB.prepare(`
        INSERT INTO customer_emails (email, first_name, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind(email, finalFirstName || null).run();
    } catch (emailError: any) {
      console.log('Email already exists or error saving:', emailError.message);
    }
  }
  
  // Calculate BMI and BSA if data provided
  let bmi = null;
  let bsa = null;
  let idealWeightKg = null;
  
  if (finalWeight && finalHeight) {
    const heightInMeters = finalHeight / 100;
    bmi = Math.round((finalWeight / (heightInMeters * heightInMeters)) * 10) / 10;
    bsa = Math.round(Math.sqrt((finalHeight * finalWeight) / 3600) * 100) / 100;
    
    // Calculate ideal weight using Devine formula
    if (finalGender === 'male' || finalGender === 'männlich') {
      idealWeightKg = Math.round((50 + 0.9 * (finalHeight - 152)) * 10) / 10;
    } else if (finalGender === 'female' || finalGender === 'weiblich') {
      idealWeightKg = Math.round((45.5 + 0.9 * (finalHeight - 152)) * 10) / 10;
    }
  }
  
  // Analyze each medication for interactions
  const analysisResults = [];
  let maxSeverity = 'low';
  
  for (const med of medications) {
    const medResult = await env.DB.prepare(`
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
             m.cbd_interaction_strength,
             m.cyp3a4_substrate,
             m.cyp3a4_inhibitor,
             m.cyp3a4_inducer,
             m.cyp2d6_substrate,
             m.cyp2d6_inhibitor,
             m.cyp2d6_inducer,
             m.cyp2c9_substrate,
             m.cyp2c9_inhibitor,
             m.cyp2c9_inducer,
             m.cyp2c19_substrate,
             m.cyp2c19_inhibitor,
             m.cyp2c19_inducer,
             m.cyp1a2_substrate,
             m.cyp1a2_inhibitor,
             m.cyp1a2_inducer
      FROM medications m
      LEFT JOIN medication_categories mc ON m.category_id = mc.id
      WHERE m.name LIKE ? OR m.generic_name LIKE ?
      LIMIT 1
    `).bind(`%${med.name}%`, `%${med.name}%`).first() as MedicationWithCategory | null;
    
    if (medResult) {
      const interactions = await env.DB.prepare(`
        SELECT * FROM cbd_interactions WHERE medication_id = ?
      `).bind(medResult.id).all();
      
      // ===== NEW P0: Load CYP450 profiles for this medication =====
      const cypProfiles = await env.DB.prepare(`
        SELECT id, medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note
        FROM medication_cyp_profile
        WHERE medication_id = ?
        ORDER BY cyp_enzyme
      `).bind(medResult.id).all();
      
      analysisResults.push({
        medication: medResult,
        interactions: interactions.results,
        cypProfiles: (cypProfiles.results || []) as MedicationCypProfile[], // NEW: CYP profiles
        mgPerDay: med.mgPerDay,
        userInputName: med.userInputName  // ✅ D1 FIX: Preserve user input for PDF display
      });
      
      if (interactions.results.length > 0) {
        const severity = interactions.results[0].severity;
        if (severity === 'critical') maxSeverity = 'critical';
        else if (severity === 'high' && maxSeverity !== 'critical') maxSeverity = 'high';
        else if (severity === 'medium' && maxSeverity === 'low') maxSeverity = 'medium';
      }
    } else {
      analysisResults.push({
        medication: { name: med.name, found: false },
        interactions: [],
        mgPerDay: med.mgPerDay,
        userInputName: med.userInputName,  // ✅ D1 FIX: Preserve user input for PDF display
        warning: 'Medikament nicht in Datenbank gefunden'
      });
    }
  }
  
  // ===== NEW P1 TASK #3: MULTI-DRUG INTERACTION (MDI) SYSTEM =====
  // ===== MDI CODE CHANGE 1 (VERPFLICHTEND FÜR V1) =====
  // Calculate cumulative CYP burden based on NUMBER OF MEDICATIONS (not number of profiles)
  //
  // MDI-Logic (CORRECTED):
  //   - Count medications with at least one 'slower' CYP profile
  //   - Each medication counts ONCE, regardless of how many 'slower' profiles it has
  //   - Example: Med A (2 slower profiles) + Med B (1 slower profile) = 2 medications (NOT 3)
  //
  // MDI-Levels (based on medication count):
  //   - None (0-1 medications): No brake, Factor 1.0
  //   - Mild (2-3 medications): -10% reduction, Factor 0.9
  //   - Moderate (4-5 medications): -20% reduction, Factor 0.8
  //   - Severe (≥6 medications): -30% reduction, Factor 0.7 + Warning
  //
  // Induction (only if NO inhibitor medications present):
  //   - Mild Faster (2-3 medications): +5% reduction, Factor 1.05
  //   - Strong Faster (≥4 medications): +10% reduction, Factor 1.1
  
  // Count medications with at least one 'slower' profile
  const medicationsWithSlowerProfile = analysisResults.filter(result => {
    const cypProfiles = result.cypProfiles || [];
    return cypProfiles.some(p => p.cbd_effect_on_reduction === 'slower');
  }).length;
  
  // Count medications with at least one 'faster' profile
  const medicationsWithFasterProfile = analysisResults.filter(result => {
    const cypProfiles = result.cypProfiles || [];
    return cypProfiles.some(p => p.cbd_effect_on_reduction === 'faster');
  }).length;
  
  const inhibitors = medicationsWithSlowerProfile;
  const inducers = medicationsWithFasterProfile;
  
  let mdiLevel: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
  let mdiAdjustmentFactor = 1.0;
  const mdiWarnings: string[] = [];
  
  // Determine MDI level based on NUMBER OF MEDICATIONS with slower profiles (NOT profile count)
  if (inhibitors >= 6) {
    mdiLevel = 'severe';
    mdiAdjustmentFactor = 0.7; // 30% slower
    mdiWarnings.push(
      `🚨 SEVERE Multi-Drug Interaction: ${inhibitors} Medikamente mit CYP-Inhibition erkannt - Reduktion wird um 30% verlangsamt. Engmaschige ärztliche Kontrolle erforderlich!`
    );
  } else if (inhibitors >= 4) {
    mdiLevel = 'moderate';
    mdiAdjustmentFactor = 0.8; // 20% slower
    mdiWarnings.push(
      `⚠️ MODERATE Multi-Drug Interaction: ${inhibitors} Medikamente mit CYP-Inhibition - Reduktion um 20% verlangsamt`
    );
  } else if (inhibitors >= 2) {
    mdiLevel = 'mild';
    mdiAdjustmentFactor = 0.9; // 10% slower
    mdiWarnings.push(
      `ℹ️ MILD Multi-Drug Interaction: ${inhibitors} Medikamente mit CYP-Inhibition - Reduktion um 10% verlangsamt`
    );
  }
  
  // Override with induction if applicable (only if NO inhibitor medications present)
  if (inhibitors === 0 && inducers >= 4) {
    mdiLevel = 'mild'; // Use 'mild' to indicate induction
    mdiAdjustmentFactor = 1.1; // 10% faster (strong induction)
    mdiWarnings.push(
      `ℹ️ Strong CYP-Induktion: ${inducers} Medikamente mit 'faster'-Profil - Reduktion um 10% beschleunigt (konservativ)`
    );
  } else if (inhibitors === 0 && inducers >= 2) {
    mdiLevel = 'mild';
    mdiAdjustmentFactor = 1.05; // 5% faster (mild induction)
    mdiWarnings.push(
      `ℹ️ Mild CYP-Induktion: ${inducers} Medikamente mit 'faster'-Profil - Reduktion um 5% beschleunigt`
    );
  }
  
  // Check for Benzos/Opioids
  const adjustmentNotes: string[] = [];
  const hasBenzoOrOpioid = analysisResults.some(result => {
    const medName = result.medication.name?.toLowerCase() || result.medication.generic_name?.toLowerCase() || '';
    const isBenzo = medName.includes('diazepam') || medName.includes('lorazepam') || 
                    medName.includes('alprazolam') || medName.includes('clonazepam') ||
                    medName.includes('benzo');
    const isOpioid = medName.includes('tramadol') || medName.includes('oxycodon') || 
                     medName.includes('morphin') || medName.includes('fentanyl') ||
                     medName.includes('opioid') || medName.includes('opiat');
    return isBenzo || isOpioid;
  });
  
  if (hasBenzoOrOpioid) {
    adjustmentNotes.push('⚠️ Benzodiazepine oder Opioide erkannt: CBD-Startdosis wird halbiert (Sicherheitsregel)');
  }
  
  // Calculate maximum withdrawal risk score (for risk level determination)
  const maxWithdrawalRiskScore = analysisResults.reduce((max, result) => {
    const score = (result.medication as MedicationWithCategory).withdrawal_risk_score || 0;
    return Math.max(max, score);
  }, 0);
  
  // Count sensitive medications
  const sensitiveMedCount = analysisResults.filter(result => {
    const medName = result.medication.name?.toLowerCase() || '';
    const categoryName = (result.medication as MedicationWithCategory)?.category_name?.toLowerCase() || '';
    const riskLevel = (result.medication as MedicationWithCategory)?.risk_level?.toLowerCase() || '';
    
    return (
      medName.includes('benzo') || medName.includes('diazepam') || medName.includes('lorazepam') ||
      medName.includes('alprazolam') || medName.includes('clonazepam') ||
      medName.includes('tramadol') || medName.includes('oxycodon') || medName.includes('morphin') ||
      medName.includes('antidepress') || medName.includes('ssri') || medName.includes('snri') ||
      medName.includes('epileps') || medName.includes('antikonvulsiv') ||
      medName.includes('marcumar') || medName.includes('warfarin') || medName.includes('blutverdünn') ||
      medName.includes('immunsuppress') || medName.includes('ciclosporin') ||
      categoryName.includes('benzo') || categoryName.includes('antidepress') ||
      categoryName.includes('epileps') || categoryName.includes('blutverdünn') ||
      categoryName.includes('immunsuppress') || categoryName.includes('opioid') ||
      riskLevel === 'very_high' || riskLevel === 'high'
    );
  }).length;
  
  // CBD Dosing: Body weight-based (0.5 mg/kg start → 1.0 mg/kg end)
  const defaultWeight = 70;
  const userWeight = finalWeight || defaultWeight;
  
  let cbdStartMg = userWeight * 0.5;
  const cbdEndMg = userWeight * 1.0;
  
  // Safety Rule: Halve CBD start dose if Benzos/Opioids present
  if (hasBenzoOrOpioid) {
    cbdStartMg = cbdStartMg / 2;
    adjustmentNotes.push(`🔒 CBD-Startdosis reduziert auf ${Math.round(cbdStartMg * 10) / 10} mg/Tag (Sicherheit)`);
  }
  
  // Age-based CBD adjustments
  if (finalAge && finalAge >= 65) {
    cbdStartMg *= 0.8;
    adjustmentNotes.push('👴 CBD-Dosis angepasst für Senioren (65+)');
  }
  
  // BMI-based CBD adjustments
  if (finalWeight && finalHeight && bmi) {
    if (bmi < 18.5) {
      cbdStartMg *= 0.85;
      adjustmentNotes.push('⚖️ CBD-Dosis angepasst: Untergewicht (BMI < 18.5)');
    } else if (bmi > 30) {
      cbdStartMg *= 1.1;
      adjustmentNotes.push('⚖️ CBD-Dosis angepasst: Übergewicht (BMI > 30)');
    }
  }
  
  // Calculate weekly CBD increase
  const cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks;
  
  // Generate weekly plan with bottle tracking
  const cbdPlan = generateWeeklyPlanWithBottleTracking(cbdStartMg, cbdEndMg, durationWeeks);
  
  // Merge CBD tracking with medication reduction data
  const weeklyPlan = cbdPlan.map((cbdWeek: any) => {
    const week = cbdWeek.week;
    
    const weekMedications = medications.map((med: any, index: number) => {
      const startMg = med.mgPerDay;
      const medAnalysis = analysisResults[index];
      const medCategory = medAnalysis?.medication as MedicationWithCategory | null;
      const cypProfiles = medAnalysis?.cypProfiles || []; // NEW: CYP profiles from DB
      
      const safetyResult = applyCategorySafetyRules({
        startMg,
        reductionGoal,
        durationWeeks,
        medicationName: med.name,
        category: medCategory,
        cypProfiles // NEW: Pass CYP profiles to safety function
      });
      
      // ===== NEW P1 TASK #3: Apply MDI adjustment AFTER applyCategorySafetyRules =====
      // MDI adjustment is GLOBAL (affects all medications based on cumulative CYP burden)
      // This runs AFTER withdrawal risk quantification (which is per-medication)
      let weeklyReduction = safetyResult.effectiveWeeklyReduction;
      weeklyReduction *= mdiAdjustmentFactor; // Apply MDI adjustment (0.7-1.1)
      
      // ===== MDI CODE CHANGE 2: Apply 2% weekly reduction floor (VERPFLICHTEND F\u00dcR V1) =====
      const MIN_WEEKLY_PCT = 0.02; // 2% of starting dose
      const minWeeklyReductionMg = startMg * MIN_WEEKLY_PCT;
      if (weeklyReduction < minWeeklyReductionMg && startMg > 0) {
        weeklyReduction = minWeeklyReductionMg;
      }
      
      const targetMg = safetyResult.effectiveTargetMg;
      
      // BUGFIX: Ensure last week always reaches exact target dose
      // Example: Ibuprofen 400 mg, 50% reduction, 8 weeks
      //   targetMg = 200 mg, weeklyReduction = 25 mg
      //   Week 1: 400 - (25 * 0) = 400 mg
      //   Week 2: 400 - (25 * 1) = 375 mg
      //   ...
      //   Week 7: 400 - (25 * 6) = 250 mg
      //   Week 8 (OLD): 400 - (25 * 7) = 225 mg ❌
      //   Week 8 (NEW): targetMg = 200 mg ✅
      let currentMg = startMg - (weeklyReduction * (week - 1));
      
      // Never fall below target dose
      currentMg = Math.max(currentMg, targetMg);
      
      // In the last week, ALWAYS use exact target dose
      if (week === durationWeeks) {
        currentMg = targetMg;
      }
      
      const reductionSpeed = startMg > 0 ? weeklyReduction / startMg : 0;
      const reductionSpeedPct = Math.round(reductionSpeed * 100 * 10) / 10;
      
      return {
        name: med.name,
        startMg: Math.round(startMg * 10) / 10,
        currentMg: Math.round(currentMg * 10) / 10,
        targetMg: Math.round(targetMg * 10) / 10,
        reduction: Math.round(weeklyReduction * 10) / 10,
        reductionPercent: Math.round(((startMg - currentMg) / startMg) * 100),
        reductionSpeedPct,
        safety: week === 1 ? {
          appliedCategoryRules: safetyResult.appliedCategoryRules,
          limitedByCategory: safetyResult.limitedByCategory,
          notes: safetyResult.safetyNotes
        } : undefined
      };
    });
    
    const totalMedicationLoad = weekMedications.reduce((sum: number, med: any) => sum + med.currentMg, 0);
    const cannabinoidMgPerKg = userWeight > 0 ? Math.round((cbdWeek.actualCbdMg / userWeight) * 10) / 10 : null;
    const cannabinoidToLoadRatio = totalMedicationLoad > 0 ? Math.round((cbdWeek.actualCbdMg / totalMedicationLoad) * 1000) / 10 : null;
    const weeklyCannabinoidIntakeMg = Math.round(cbdWeek.actualCbdMg * 7 * 10) / 10;
    
    // ===== NEW P0: Collect medication safety notes per medication for week 1 =====
    const medicationSafetyNotes: { [medName: string]: string[] } = {};
    if (week === 1) {
      weekMedications.forEach((weekMed: any, medIndex: number) => {
        const notes: string[] = [];
        
        // Add existing safety notes from applyCategorySafetyRules
        if (weekMed.safety && weekMed.safety.notes && weekMed.safety.notes.length > 0) {
          notes.push(...weekMed.safety.notes);
        }
        
        // ===== NEW P0 TASK #2: Add therapeutic range warnings =====
        const medAnalysis = analysisResults[medIndex];
        const medCategory = medAnalysis?.medication as MedicationWithCategory | null;
        
        if (medCategory) {
          const therapeuticWarnings = evaluateTherapeuticRange(
            medCategory,
            weekMed.currentMg, // Current dose in this week
            weekMed.startMg     // Starting dose
          );
          
          // Add warnings if they exist (avoid duplicates)
          if (therapeuticWarnings.underdoseWarning && !notes.some(n => n.includes('Unterdosierungsgefahr'))) {
            notes.push(therapeuticWarnings.underdoseWarning);
          }
          if (therapeuticWarnings.overdoseWarning && !notes.some(n => n.includes('Überdosierungsgefahr'))) {
            notes.push(therapeuticWarnings.overdoseWarning);
          }
          if (therapeuticWarnings.narrowWindowWarning && !notes.some(n => n.includes('Enges therapeutisches Fenster'))) {
            // Only add if NOT already added by applyCategorySafetyRules
            // (which adds a similar but longer message)
            const alreadyHasNarrowWindowNote = notes.some(n => 
              n.includes('Enges therapeutisches Fenster') && n.includes('vorsichtshalber zusätzlich')
            );
            if (!alreadyHasNarrowWindowNote) {
              notes.push(therapeuticWarnings.narrowWindowWarning);
            }
          }
        }
        
        if (notes.length > 0) {
          medicationSafetyNotes[weekMed.name] = notes;
        }
      });
      
      // ===== NEW P1 TASK #3: Add MDI warnings to safety notes =====
      // MDI warnings are global (not per-medication), so add them to all medications
      if (mdiWarnings.length > 0 && Object.keys(medicationSafetyNotes).length > 0) {
        // Add MDI warning to the first medication's notes (as a global warning)
        const firstMedName = Object.keys(medicationSafetyNotes)[0];
        if (!medicationSafetyNotes[firstMedName]) {
          medicationSafetyNotes[firstMedName] = [];
        }
        mdiWarnings.forEach(warning => {
          if (!medicationSafetyNotes[firstMedName].includes(warning)) {
            medicationSafetyNotes[firstMedName].push(warning);
          }
        });
      }
    }
    
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
      bottleStatus: cbdWeek.bottleStatus,
      cannabinoidMgPerKg,
      cannabinoidToLoadRatio,
      weeklyCannabinoidIntakeMg,
      ...(week === 1 ? { medicationSafetyNotes } : {}) // Only include for week 1
    };
  });
  
  const firstWeekMedless = weeklyPlan[0];
  const costAnalysis = calculatePlanCosts(weeklyPlan);
  
  // Calculate overall metrics
  const overallStartLoad = medications.reduce((sum: number, med: any) => sum + med.mgPerDay, 0);
  const overallEndLoad = weeklyPlan.length > 0 
    ? weeklyPlan[weeklyPlan.length - 1].medications.reduce((sum: number, med: any) => sum + med.targetMg, 0)
    : overallStartLoad;
  const totalLoadReductionPct = overallStartLoad > 0 
    ? Math.round(((overallStartLoad - overallEndLoad) / overallStartLoad) * 1000) / 10
    : 0;
  
  const reductionSpeeds = medications.map((med: any, index: number) => {
    const medAnalysis = analysisResults[index];
    const medCategory = medAnalysis?.medication as MedicationWithCategory | null;
    const cypProfiles = medAnalysis?.cypProfiles || []; // NEW: CYP profiles from DB
    
    const safetyResult = applyCategorySafetyRules({
      startMg: med.mgPerDay,
      reductionGoal,
      durationWeeks,
      medicationName: med.name,
      category: medCategory,
      cypProfiles // NEW: Pass CYP profiles to safety function
    });
    
    const weeklyReduction = safetyResult.effectiveWeeklyReduction;
    return med.mgPerDay > 0 ? (weeklyReduction / med.mgPerDay) * 100 : 0;
  });
  
  const avgReductionSpeedPct = reductionSpeeds.length > 0
    ? reductionSpeeds.reduce((sum: number, speed: number) => sum + speed, 0) / reductionSpeeds.length
    : 0;
  
  let reductionSpeedCategory = 'moderat';
  if (avgReductionSpeedPct < 2) {
    reductionSpeedCategory = 'sehr langsam';
  } else if (avgReductionSpeedPct > 5) {
    reductionSpeedCategory = 'relativ schnell';
  }
  
  const weeksToCbdTarget = cbdWeeklyIncrease > 0 
    ? Math.round(((cbdEndMg - cbdStartMg) / cbdWeeklyIncrease) * 10) / 10
    : null;
  
  const cannabinoidIncreasePctPerWeek = cbdStartMg > 0 
    ? Math.round((cbdWeeklyIncrease / cbdStartMg) * 1000) / 10
    : null;
  
  // Collect category safety notes
  const categorySafetyNotes: string[] = [];
  if (weeklyPlan.length > 0 && weeklyPlan[0].medications) {
    weeklyPlan[0].medications.forEach((med: any) => {
      if (med.safety && med.safety.notes && med.safety.notes.length > 0) {
        categorySafetyNotes.push(...med.safety.notes);
      }
    });
  }
  
  // Build warnings array
  const warnings: string[] = [];
  if (maxSeverity === 'critical' || maxSeverity === 'high') {
    warnings.push('⚠️ Kritische Wechselwirkungen erkannt!');
    warnings.push('Konsultieren Sie unbedingt einen Arzt vor der Cannabinoid-Einnahme.');
  }
  if (categorySafetyNotes.length > 0) {
    warnings.push(...categorySafetyNotes);
  }
  
  // ✅ ORGAN FUNCTION WARNINGS (LAYER 2: Documentation + Warnings)
  if (kidneyFunction !== 'normal') {
    const severityText = kidneyFunction === 'schwer_eingeschränkt' 
      ? 'Schwer eingeschränkte Nierenfunktion' 
      : 'Eingeschränkte Nierenfunktion';
    warnings.push(
      `🩺 ${severityText}: Konservativer Reduktionsverlauf empfohlen. Besondere Vorsicht bei renal eliminierten Wirkstoffen. Ärztliche Begleitung und engmaschige Nierenfunktionskontrolle angeraten.`
    );
  }
  
  if (liverFunction !== 'normal') {
    const severityText = liverFunction === 'schwer_eingeschränkt' 
      ? 'Schwer eingeschränkte Leberfunktion' 
      : 'Eingeschränkte Leberfunktion';
    warnings.push(
      `🩺 ${severityText}: Konservativer Reduktionsverlauf empfohlen. Besondere Vorsicht bei hepatisch metabolisierten Wirkstoffen (CYP450-Substrate). Ärztliche Begleitung und regelmäßige Leberfunktionskontrolle angeraten.`
    );
  }
  
  // ===== BUGFIX: Enrich analysisResults with calculated max_weekly_reduction_pct =====
  // Calculate final weekly reduction percentage for each medication (AFTER all safety adjustments)
  const enrichedAnalysis = medications.map((med: any, index: number) => {
    const medAnalysis = analysisResults[index];
    const medCategory = medAnalysis?.medication as MedicationWithCategory | null;
    const cypProfiles = medAnalysis?.cypProfiles || [];
    
    // Calculate safety-adjusted reduction (same logic as weekly plan)
    const safetyResult = applyCategorySafetyRules({
      startMg: med.mgPerDay,
      reductionGoal,
      durationWeeks,
      medicationName: med.name,
      category: medCategory,
      cypProfiles
    });
    
    // Apply MDI adjustment (global factor affecting all medications)
    let finalWeeklyReduction = safetyResult.effectiveWeeklyReduction * mdiAdjustmentFactor;
    
    // ===== MDI CODE CHANGE 2 (VERPFLICHTEND FÜR V1) =====
    // Apply 2% weekly reduction floor to prevent unrealistically long plans
    // This ensures final reduction never falls below 2% of starting dose per week
    const startMg = med.mgPerDay;
    const MIN_WEEKLY_PCT = 0.02; // 2% of starting dose
    const minWeeklyReductionMg = startMg * MIN_WEEKLY_PCT;
    
    let twoPercentFloorApplied = false;
    if (finalWeeklyReduction < minWeeklyReductionMg && startMg > 0) {
      // Original reduction was below 2% floor - apply floor
      twoPercentFloorApplied = true;
      finalWeeklyReduction = minWeeklyReductionMg;
    }
    
    // Calculate as percentage of starting dose (after floor application)
    const finalWeeklyReductionPct = med.mgPerDay > 0 
      ? Math.round((finalWeeklyReduction / med.mgPerDay) * 100 * 10) / 10
      : null;
    
    // NEW: PHASE F - Update calculationFactors with MDI factor
    const updatedCalculationFactors = safetyResult.calculationFactors ? {
      ...safetyResult.calculationFactors,
      interactionFactor: mdiAdjustmentFactor, // Phase 7: Update with actual MDI factor
      finalFactor: safetyResult.calculationFactors.halfLifeFactor * 
                   safetyResult.calculationFactors.cypFactor * 
                   safetyResult.calculationFactors.therapeuticWindowFactor * 
                   safetyResult.calculationFactors.withdrawalFactor * 
                   mdiAdjustmentFactor
    } : undefined;
    
    return {
      ...medAnalysis,
      max_weekly_reduction_pct: finalWeeklyReductionPct,
      calculationFactors: updatedCalculationFactors, // NEW: Add calculation factors to analysis entry
      twoPercentFloorApplied // NEW: Flag indicating if 2% floor was applied (for PDF warning)
    };
  });
  
  // Return complete analysis response
  return {
    analysis: enrichedAnalysis,
    maxSeverity,
    weeklyPlan,
    reductionGoal,
    costs: costAnalysis,
    cbdProgression: {
      startMg: Math.round(cbdStartMg * 10) / 10,
      endMg: Math.round(cbdEndMg * 10) / 10,
      weeklyIncrease: Math.round(cbdWeeklyIncrease * 10) / 10
    },
    product: {
      name: firstWeekMedless.kannasanProduct.name,
      nr: firstWeekMedless.kannasanProduct.nr,
      type: 'CBD Dosier-Spray',
      packaging: '10ml Flasche mit Pumpsprühaufsatz',
      concentration: `${firstWeekMedless.kannasanProduct.cbdPerSpray} mg CBD pro Sprühstoß`,
      cbdPerSpray: firstWeekMedless.kannasanProduct.cbdPerSpray,
      twoSprays: `${firstWeekMedless.kannasanProduct.cbdPerSpray * 2} mg CBD bei 2 Sprühstößen`,
      dosageUnit: 'Sprühstöße',
      totalSpraysPerDay: firstWeekMedless.totalSprays,
      morningSprays: firstWeekMedless.morningSprays,
      eveningSprays: firstWeekMedless.eveningSprays,
      actualDailyMg: firstWeekMedless.actualCbdMg,
      application: 'Oral: Sprühstoß direkt in den Mund oder unter die Zunge. Produkt vor Gebrauch gut schütteln.',
      note: 'Produkt kann sich wöchentlich ändern basierend auf CBD-Dosis'
    },
    personalization: {
      firstName: finalFirstName,
      gender: finalGender,
      age: finalAge,
      weight: finalWeight,
      height: finalHeight,
      bmi,
      bsa,
      idealWeightKg,
      liverFunction,      // NEW: Organ function
      kidneyFunction,     // NEW: Organ function
      cbdStartMg: Math.round(cbdStartMg * 10) / 10,
      cbdEndMg: Math.round(cbdEndMg * 10) / 10,
      hasBenzoOrOpioid,
      maxWithdrawalRiskScore,
      notes: adjustmentNotes
    },
    warnings,
    categorySafety: {
      appliedRules: categorySafetyNotes.length > 0,
      notes: categorySafetyNotes
    },
    planIntelligence: {
      overallStartLoad: Math.round(overallStartLoad * 10) / 10,
      overallEndLoad: Math.round(overallEndLoad * 10) / 10,
      totalLoadReductionPct,
      avgReductionSpeedPct: Math.round(avgReductionSpeedPct * 10) / 10,
      reductionSpeedCategory,
      weeksToCbdTarget,
      cannabinoidIncreasePctPerWeek,
      totalMedicationCount: medications.length,
      sensitiveMedCount
    },
    // ===== NEW P0: CYP450 Profile Statistics =====
    cyp_profile: {
      totalMedicationsWithCypData: analysisResults.filter(r => r.cypProfiles && r.cypProfiles.length > 0).length,
      totalCypProfiles: analysisResults.reduce((sum, r) => sum + (r.cypProfiles?.length || 0), 0),
      medicationsWithSlowerEffect: analysisResults.filter(r => 
        r.cypProfiles?.some(p => p.cbd_effect_on_reduction === 'slower')
      ).map(r => r.medication?.name || 'Unknown'),
      medicationsWithFasterEffect: analysisResults.filter(r => 
        r.cypProfiles?.some(p => p.cbd_effect_on_reduction === 'faster')
      ).map(r => r.medication?.name || 'Unknown'),
      affectedEnzymes: Array.from(new Set(
        analysisResults.flatMap(r => 
          (r.cypProfiles || []).map(p => p.cyp_enzyme)
        )
      ))
    },
    // ===== NEW P0 TASK #2: THERAPEUTIC RANGE STATISTICS =====
    therapeutic_range: {
      medications: analysisResults.map(r => {
        const med = r.medication as MedicationWithCategory | null;
        if (!med) return null;
        
        const hasRange = med.therapeutic_min_ng_ml != null && med.therapeutic_max_ng_ml != null;
        const windowWidth = hasRange 
          ? (med.therapeutic_max_ng_ml || 0) - (med.therapeutic_min_ng_ml || 0) 
          : null;
        const isNarrowWindow = windowWidth !== null && windowWidth <= 50; // HEURISTIC: ≤50 ng/ml
        
        return {
          name: med.name,
          has_range: hasRange,
          min_ng_ml: med.therapeutic_min_ng_ml,
          max_ng_ml: med.therapeutic_max_ng_ml,
          window_width: windowWidth,
          is_narrow_window: isNarrowWindow,
          withdrawal_risk_score: med.withdrawal_risk_score
        };
      }).filter(m => m !== null),
      totalMedicationsWithRange: analysisResults.filter(r => {
        const med = r.medication as MedicationWithCategory | null;
        return med && med.therapeutic_min_ng_ml != null && med.therapeutic_max_ng_ml != null;
      }).length,
      medicationsWithNarrowWindow: analysisResults.filter(r => {
        const med = r.medication as MedicationWithCategory | null;
        if (!med || med.therapeutic_min_ng_ml == null || med.therapeutic_max_ng_ml == null) return false;
        const windowWidth = med.therapeutic_max_ng_ml - med.therapeutic_min_ng_ml;
        return windowWidth <= 50; // HEURISTIC: ≤50 ng/ml
      }).map(r => r.medication?.name || 'Unknown')
    },
    // ===== NEW P1 TASK #3: MULTI-DRUG INTERACTION STATISTICS =====
    multi_drug_interaction: {
      inhibitors: inhibitors,
      inducers: inducers,
      level: mdiLevel, // 'none' | 'mild' | 'moderate' | 'severe'
      adjustment_factor: mdiAdjustmentFactor, // 0.7, 0.8, 0.9, 1.05, 1.1
      warnings: mdiWarnings
    },
    // ===== NEW P1 TASK #4: WITHDRAWAL RISK QUANTIFICATION STATISTICS =====
    withdrawal_risk_adjustment: {
      medications: analysisResults.map(r => {
        const med = r.medication as MedicationWithCategory | null;
        if (!med || !med.withdrawal_risk_score) return null;
        
        const score = med.withdrawal_risk_score;
        const factor = 1 - (score / 10 * 0.25); // Corrected formula
        
        return {
          name: med.name,
          score: score,
          factor: Math.round(factor * 100) / 100,
          reduction_slowdown_pct: Math.round((1 - factor) * 100)
        };
      }).filter(m => m !== null)
    }
  };
}

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ===== ROOT ROUTE: Serve Marketing Landing Page =====
// MEDLESS FIX: Root / now serves the original marketing page (public/index.html)
// This is handled by Cloudflare Pages automatically (excluded from Worker in _routes.json)
// The /app route serves the actual wizard application

// ===== CANONICAL FOOTER COMPONENT =====
// Mobile-first footer with light background on mobile, dark on desktop
function getCanonicalFooter() {
  return `
  <!-- FOOTER - Mobile-First MEDLESS Design -->
  <footer class="bg-medless-bg-light text-medless-text-secondary py-8 md:py-16 px-4 mt-12 border-t border-medless-border-light">
    <div class="max-w-6xl mx-auto">
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-12 mb-6 md:mb-10">
        
        <!-- Brand Section -->
        <div>
          <strong class="text-medless-text-primary font-semibold mb-3 text-sm block tracking-tight">MEDLESS</strong>
          <p class="text-sm leading-relaxed text-medless-text-secondary">Weniger ist mehr.</p>
        </div>
        
        <!-- Legal Links -->
        <div>
          <strong class="text-medless-text-primary font-semibold mb-3 text-sm block tracking-tight">Rechtliches</strong>
          <ul class="space-y-1 text-sm">
            <li><a href="/impressum" class="block py-2 text-medless-text-secondary hover:text-medless-primary transition-colors duration-medless active:scale-[0.98] active:text-medless-primary-dark">Impressum</a></li>
            <li><a href="/datenschutz" class="block py-2 text-medless-text-secondary hover:text-medless-primary transition-colors duration-medless active:scale-[0.98] active:text-medless-primary-dark">Datenschutz</a></li>
            <li><a href="/agb" class="block py-2 text-medless-text-secondary hover:text-medless-primary transition-colors duration-medless active:scale-[0.98] active:text-medless-primary-dark">AGB</a></li>
          </ul>
        </div>
        
        <!-- Contact -->
        <div>
          <strong class="text-medless-text-primary font-semibold mb-3 text-sm block tracking-tight">Kontakt</strong>
          <a href="mailto:info@medless.de" class="block py-2 text-medless-primary hover:text-medless-primary-dark text-sm transition-colors duration-medless active:scale-[0.98] active:text-medless-primary-dark font-medium">
            info@medless.de
          </a>
        </div>
        
        <!-- Navigation -->
        <div>
          <strong class="text-medless-text-primary font-semibold mb-3 text-sm block tracking-tight">Navigation</strong>
          <ul class="space-y-1 text-sm">
            <li><a href="/magazin" class="block py-2 text-medless-text-secondary hover:text-medless-primary transition-colors duration-medless active:scale-[0.98] active:text-medless-primary-dark">Magazin</a></li>
            <li><a href="/fachkreise" class="block py-2 text-medless-text-secondary hover:text-medless-primary transition-colors duration-medless active:scale-[0.98] active:text-medless-primary-dark">Fachkreise</a></li>
            <li><a href="/app" class="block py-2 text-medless-text-secondary hover:text-medless-primary transition-colors duration-medless active:scale-[0.98] active:text-medless-primary-dark">Orientierungsplan</a></li>
          </ul>
        </div>
        
      </div>
      
      <!-- Copyright -->
      <div class="border-t border-medless-border-light pt-6 text-xs text-center text-medless-text-secondary">
        <p>© 2025 Medless – Eine Marke der CBD-Vertriebskompetenz GmbH</p>
      </div>
      
    </div>
  </footer>
  `;
}

// ===== CANONICAL HEADER COMPONENT =====
// Single source of truth for header across all routes
function getCanonicalHeader(activePage: 'home' | 'magazin' | 'fachkreise' | 'app' = 'home') {
  const isActive = (page: string) => activePage === page ? 'text-medless-primary font-medium' : 'text-medless-text-secondary';
  
  return `
  <!-- HEADER -->
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-medless-border-light shadow-medless-header">
    <div class="max-w-container mx-auto px-4 md:px-7 py-4 md:py-5 flex items-center justify-between">
      
      <!-- Logo -->
      <a href="/" class="text-xl md:text-2xl font-semibold text-medless-text-primary tracking-tight">
        Medless
      </a>
      
      <!-- Desktop Navigation -->
      <ul class="hidden md:flex items-center gap-7">
        <li><a href="/#how-it-works" class="text-[15px] ${isActive('home')} hover:text-medless-primary transition-colors duration-medless">So funktioniert's</a></li>
        <li><a href="/#benefits" class="text-[15px] ${isActive('home')} hover:text-medless-primary transition-colors duration-medless">Vorteile</a></li>
        <li><a href="/#faq" class="text-[15px] ${isActive('home')} hover:text-medless-primary transition-colors duration-medless">FAQ</a></li>
        <li><a href="/magazin" class="text-[15px] ${isActive('magazin')} hover:text-medless-primary transition-colors duration-medless">Magazin</a></li>
        <li><a href="/fachkreise" class="text-[15px] ${isActive('fachkreise')} hover:text-medless-primary transition-colors duration-medless">Für Ärzt:innen & Apotheken</a></li>
      </ul>
      
      <!-- Desktop CTA Button -->
      <a
        href="/app" 
        class="hidden md:inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-medless-button border-2 border-medless-primary text-medless-primary bg-white text-button-text font-medium shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:shadow-medless-button-hover hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medless-primary/40"
      >
        Orientierungsplan starten
      </a>
      
      <!-- Mobile Menu Button -->
      <button 
        id="mobile-nav-toggle"
        class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-medless-border-light text-medless-text-primary hover:bg-medless-bg-ultra-light transition-colors"
      >
        <i data-lucide="menu" class="w-5 h-5"></i>
      </button>
    </div>
  </header>

  <!-- MOBILE NAVIGATION OVERLAY -->
  <div id="mobile-nav-overlay" class="hidden fixed inset-0 bg-black/30 z-50">
    <div class="max-w-xs w-full ml-auto bg-white h-full shadow-medless-card flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-medless-border-light">
        <a href="/" class="text-xl font-semibold text-medless-text-primary tracking-tight">
          Medless
        </a>
        <button 
          id="mobile-nav-close"
          class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-medless-border-light text-medless-text-primary hover:bg-medless-bg-ultra-light transition-colors"
        >
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto p-5">
        <ul class="space-y-2">
          <li>
            <a href="/#how-it-works" class="mobile-nav-link block px-4 py-3 text-base font-medium text-medless-text-primary hover:bg-medless-bg-ultra-light rounded-medless-md transition-colors">
              So funktioniert's
            </a>
          </li>
          <li>
            <a href="/#benefits" class="mobile-nav-link block px-4 py-3 text-base font-medium text-medless-text-primary hover:bg-medless-bg-ultra-light rounded-medless-md transition-colors">
              Vorteile
            </a>
          </li>
          <li>
            <a href="/#faq" class="mobile-nav-link block px-4 py-3 text-base font-medium text-medless-text-primary hover:bg-medless-bg-ultra-light rounded-medless-md transition-colors">
              FAQ
            </a>
          </li>
          <li>
            <a href="/magazin" class="mobile-nav-link block px-4 py-3 text-base font-medium text-medless-text-primary hover:bg-medless-bg-ultra-light rounded-medless-md transition-colors">
              Magazin
            </a>
          </li>
          <li>
            <a href="/fachkreise" class="mobile-nav-link block px-4 py-3 text-base font-medium text-medless-text-primary hover:bg-medless-bg-ultra-light rounded-medless-md transition-colors">
              Für Ärzt:innen & Apotheken
            </a>
          </li>
        </ul>
      </nav>
      
      <!-- CTA Button -->
      <div class="p-5 border-t border-medless-border-light">
        <a 
          href="/app" 
          class="inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-button-text text-white bg-medless-primary border border-medless-primary rounded-medless-button shadow-medless-button hover:bg-medless-primary-dark hover:-translate-y-0.5 hover:shadow-medless-button-hover transition-all duration-medless"
        >
          <i data-lucide="plus-circle" class="w-5 h-5"></i>
          <span>Orientierungsplan starten</span>
        </a>
      </div>

  <script>
    // Mobile menu toggle
    const toggle = document.getElementById('mobile-nav-toggle');
    const overlay = document.getElementById('mobile-nav-overlay');
    const close = document.getElementById('mobile-nav-close');
    const links = document.querySelectorAll('.mobile-nav-link');
    
    if (toggle && overlay && close) {
      toggle.addEventListener('click', () => {
        overlay.classList.remove('hidden');
        lucide.createIcons();
      });
      
      close.addEventListener('click', () => {
        overlay.classList.add('hidden');
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
        }
      });
      
      links.forEach(link => {
        link.addEventListener('click', () => {
          overlay.classList.add('hidden');
        });
      });
    }
  </script>
  `;
}

// API Routes
// Get all medications
app.get('/api/medications', async (c) => {
  const { env } = c;
  try {
    const result = await env.DB.prepare(`
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
      ORDER BY m.name
    `).all();
    
    // ✅ FIX 1: Category-Fallback & Risk-Fallback
    const medicationsWithFallbacks = result.results.map((med: any) => ({
      ...med,
      category_name: med.category_name || 'Allgemeine Medikation',
      risk_level: med.risk_level || 'low'
    }));
    
    return c.json({ success: true, medications: medicationsWithFallbacks });
  } catch (error) {
    return c.json({ success: false, error: 'Fehler beim Abrufen der Medikamente' }, 500);
  }
})

// Search medication by name
app.get('/api/medications/search/:query', async (c) => {
  const { env } = c;
  const query = c.req.param('query');
  
  try {
    const result = await env.DB.prepare(`
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
      WHERE m.name LIKE ? OR m.generic_name LIKE ?
      ORDER BY m.name
      LIMIT 20
    `).bind(`%${query}%`, `%${query}%`).all();
    
    return c.json({ success: true, medications: result.results });
  } catch (error) {
    return c.json({ success: false, error: 'Fehler bei der Suche' }, 500);
  }
})

// Analyze medications and generate CANNABINOID DOSING PLAN
// NOW USES SHARED buildAnalyzeResponse FUNCTION
app.post('/api/analyze', async (c) => {
  const { env } = c;
  try {
    const body = await c.req.json();
    const analysisResult = await buildAnalyzeResponse(body, env);
    
    return c.json({
      success: true,
      ...analysisResult
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return c.json({ success: false, error: error.message || 'Fehler bei der Analyse' }, 500);
  }
})

// ============================================================
// NEW ROUTE: /api/reports
// Generates HTML reports from existing AnalyzeResponse data
// ============================================================

app.post('/api/reports', async (c) => {
  try {
    const body = await c.req.json();
    const { analysis, includePatient = true, includeDoctor = true } = body;
    
    if (!analysis) {
      return c.json({ 
        success: false, 
        error: 'Missing analysis data. Please provide an AnalyzeResponse object.' 
      }, 400);
    }
    
    const result: any = { success: true };
    
    // Build Patient Report (MEGAPROMPT V2)
    if (includePatient) {
      const patientDataV2 = buildPatientPlanData(analysis as AnalyzeResponse);
      const patientHtml = renderPatientPlanHTML(patientDataV2);
      result.patient = {
        data: patientDataV2,
        html: patientHtml
      };
    }
    
    // Build Doctor Report (MEGAPROMPT V3)
    if (includeDoctor) {
      const doctorDataV3 = buildDoctorReportDataV3(analysis as AnalyzeResponse);
      const doctorHtml = renderDoctorReportHtmlV3(doctorDataV3);
      result.doctor = {
        data: doctorDataV3,
        html: doctorHtml
      };
    }
    
    return c.json(result);
    
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Fehler beim Erstellen der Berichte' 
    }, 500);
  }
})

// ============================================================
// NEW ROUTE: /api/analyze-and-reports
// Combines /api/analyze logic with report generation
// IMPORTANT: Uses IDENTICAL calculation logic as /api/analyze
// ============================================================

// ============================================================
// ROUTE: /api/analyze-and-reports
// NOW USES SHARED buildAnalyzeResponse FUNCTION + GENERATES REPORTS
// ============================================================

app.post('/api/analyze-and-reports', async (c) => {
  const { env } = c;
  try {
    const body = await c.req.json();
    
    // Use shared analysis function (Single Source of Truth)
    const analysisResult = await buildAnalyzeResponse(body, env);
    
    // Generate reports from analysis result (MEGAPROMPT V2/V3)
    const patientDataV2 = buildPatientPlanData(analysisResult as any);
    const patientHtml = renderPatientPlanHTML(patientDataV2);
    
    const doctorDataV3 = buildDoctorReportDataV3(analysisResult as any);
    const doctorHtml = renderDoctorReportHtmlV3(doctorDataV3);
    
    // Return combined response
    return c.json({
      success: true,
      analysis: analysisResult,
      patient: {
        data: patientDataV2,
        html: patientHtml
      },
      doctor: {
        data: doctorDataV3,
        html: doctorHtml
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    // ✅ FIX 3: Return HTTP 400 for validation errors
    const statusCode = error.message?.includes('Bitte') ? 400 : 500;
    return c.json({ success: false, error: error.message || 'Fehler bei der Analyse' }, statusCode);
  }
})

// ============================================================
// PDF GENERATION ENDPOINTS (SERVER-SIDE)
// ============================================================

/**
 * PDF Service Helper Function
 * Uses PDFShift API for consistent server-side PDF rendering
 * 
 * @param html - HTML string to convert to PDF
 * @param filename - Filename for the PDF
 * @param apiKey - PDFShift API key (from environment variable)
 * @returns PDF binary as ArrayBuffer
 */
async function generatePdfWithService(html: string, filename: string, apiKey?: string): Promise<ArrayBuffer> {
  if (!apiKey) {
    throw new Error('PDFSHIFT_API_KEY not configured. Please set it with: npx wrangler secret put PDFSHIFT_API_KEY');
  }
  
  const pdfshiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      source: html,
      format: 'A4',
      margin: '20mm',
      use_print: true,
      landscape: false
    })
  });
  
  if (!pdfshiftResponse.ok) {
    const errorText = await pdfshiftResponse.text();
    console.error('PDFShift error:', pdfshiftResponse.status, errorText);
    throw new Error(`PDF generation failed (${pdfshiftResponse.status}): ${errorText}`);
  }
  
  return await pdfshiftResponse.arrayBuffer();
}

/**
 * POST /api/pdf/patient
 * Generates patient report PDF from analysis data
 * 
 * Query params:
 *   - example=true: Use example data for testing
 * 
 * Body (if example not set):
 *   - analysis: AnalyzeResponse object
 */
app.post('/api/pdf/patient', async (c) => {
  try {
    const { env } = c;
    
    // CRITICAL: Check if PDFSHIFT_API_KEY is configured
    if (!env.PDFSHIFT_API_KEY) {
      console.error('PDFSHIFT_API_KEY not configured');
      return c.json({ 
        success: false, 
        error: 'PDFSHIFT_API_KEY missing. Please configure it in Cloudflare Dashboard.' 
      }, 500);
    }
    
    const url = new URL(c.req.url);
    const isExample = url.searchParams.get('example') === 'true';
    
    let patientData;
    
    if (isExample) {
      // Use example data from renderPatientReportExample
      const { renderPatientPlanExample } = await import('./report_templates_patient_v2');
      const exampleHtml = renderPatientPlanExample();
      
      // PRODUCTION VERSION: Generate PDF with PDFShift
      const pdfBuffer = await generatePdfWithService(
        exampleHtml, 
        'MEDLESS-Orientierungsplan.pdf',
        env.PDFSHIFT_API_KEY
      );
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="MEDLESS-Orientierungsplan.pdf"',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    } else {
      const body = await c.req.json();
      const { analysis, html, fileName } = body;
      
      let patientHtml: string;
      
      // Support both 'html' (from frontend) and 'analysis' (programmatic)
      if (html) {
        // Direct HTML provided by frontend
        patientHtml = html;
      } else if (analysis) {
        // Analysis data provided - generate HTML
        // MEGAPROMPT V2: Use new template with consistency
        const patientDataV2 = buildPatientPlanData(analysis as AnalyzeResponse);
        patientHtml = renderPatientPlanHTML(patientDataV2);
      } else {
        return c.json({ 
          success: false, 
          error: 'Missing html or analysis data' 
        }, 400);
      }
      
      // PRODUCTION VERSION: Generate PDF with PDFShift
      const pdfBuffer = await generatePdfWithService(
        patientHtml,
        fileName || 'Dein_persoenlicher_MEDLESS-Plan.pdf',
        env.PDFSHIFT_API_KEY
      );
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName || 'Dein_persoenlicher_MEDLESS-Plan.pdf'}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error generating patient PDF:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Fehler beim Erstellen des Patienten-PDFs' 
    }, 500);
  }
})

/**
 * GET /api/pdf/patient?example=true
 * Convenience endpoint for browser testing (GET instead of POST)
 */
app.get('/api/pdf/patient', async (c) => {
  try {
    const { env } = c;
    const url = new URL(c.req.url);
    const isExample = url.searchParams.get('example') === 'true';
    
    if (!isExample) {
      return c.json({ 
        success: false, 
        error: 'GET requests only support ?example=true parameter. Use POST for real data.' 
      }, 400);
    }
    
    // CRITICAL: Check if PDFSHIFT_API_KEY is configured
    if (!env.PDFSHIFT_API_KEY) {
      console.error('PDFSHIFT_API_KEY not configured');
      return c.json({ 
        success: false, 
        error: 'PDFSHIFT_API_KEY missing. Please configure it in Cloudflare Dashboard.' 
      }, 500);
    }
    
    // Use example data
    const { renderPatientPlanExample } = await import('./report_templates_patient_v2');
    const exampleHtml = renderPatientPlanExample();
    
    // Generate PDF with PDFShift
    const pdfBuffer = await generatePdfWithService(
      exampleHtml, 
      'Dein_persoenlicher_MEDLESS-Plan.pdf',
      env.PDFSHIFT_API_KEY
    );
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Dein_persoenlicher_MEDLESS-Plan.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
    
  } catch (error: any) {
    console.error('Error generating patient PDF (GET):', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Fehler beim Erstellen des Patienten-PDFs' 
    }, 500);
  }
})

/**
 * POST /api/pdf/doctor
 * Generates doctor report PDF from analysis data
 * 
 * Query params:
 *   - example=true: Use example data for testing
 * 
 * Body (if example not set):
 *   - analysis: AnalyzeResponse object
 */
app.post('/api/pdf/doctor', async (c) => {
  try {
    const { env } = c;
    
    // CRITICAL: Check if PDFSHIFT_API_KEY is configured
    if (!env.PDFSHIFT_API_KEY) {
      console.error('PDFSHIFT_API_KEY not configured');
      return c.json({ 
        success: false, 
        error: 'PDFSHIFT_API_KEY missing. Please configure it in Cloudflare Dashboard.' 
      }, 500);
    }
    
    const url = new URL(c.req.url);
    const isExample = url.searchParams.get('example') === 'true';
    
    let doctorData;
    
    if (isExample) {
      // Use example data from renderDoctorReportExample
      const { renderDoctorReportExample } = await import('./report_templates');
      const exampleHtml = renderDoctorReportExample();
      
      // PRODUCTION VERSION: Generate PDF with PDFShift
      const pdfBuffer = await generatePdfWithService(
        exampleHtml,
        'MEDLESS-Reduktionsplan_Aerztliche_Dokumentation.pdf',
        env.PDFSHIFT_API_KEY
      );
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="MEDLESS-Reduktionsplan_Aerztliche_Dokumentation.pdf"',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    } else {
      const body = await c.req.json();
      const { analysis, html, fileName } = body;
      
      let doctorHtml: string;
      
      // Support both 'html' (from frontend) and 'analysis' (programmatic)
      if (html) {
        // Direct HTML provided by frontend
        doctorHtml = html;
      } else if (analysis) {
        // Analysis data provided - generate HTML with V3 builder
        const { buildDoctorReportDataV3 } = await import('./report_data_v3');
        const { renderDoctorReportHtmlV3 } = await import('./report_templates_doctor_v3');
        const doctorDataV3 = buildDoctorReportDataV3(analysis as AnalyzeResponse);
        doctorHtml = renderDoctorReportHtmlV3(doctorDataV3);
      } else {
        return c.json({ 
          success: false, 
          error: 'Missing html or analysis data' 
        }, 400);
      }
      
      // PRODUCTION VERSION: Generate PDF with PDFShift
      const pdfBuffer = await generatePdfWithService(
        doctorHtml,
        fileName || 'MEDLESS-Reduktionsplan_Aerztliche_Dokumentation.pdf',
        env.PDFSHIFT_API_KEY
      );
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName || 'MEDLESS-Reduktionsplan_Aerztliche_Dokumentation.pdf'}"`,
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }
    
  } catch (error: any) {
    console.error('Error generating doctor PDF:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Fehler beim Erstellen des Arzt-PDFs' 
    }, 500);
  }
})

/**
 * GET /api/pdf/doctor?example=true
 * Convenience endpoint for browser testing (GET instead of POST)
 */
app.get('/api/pdf/doctor', async (c) => {
  try {
    const { env } = c;
    const url = new URL(c.req.url);
    const isExample = url.searchParams.get('example') === 'true';
    
    if (!isExample) {
      return c.json({ 
        success: false, 
        error: 'GET requests only support ?example=true parameter. Use POST for real data.' 
      }, 400);
    }
    
    // CRITICAL: Check if PDFSHIFT_API_KEY is configured
    if (!env.PDFSHIFT_API_KEY) {
      console.error('PDFSHIFT_API_KEY not configured');
      return c.json({ 
        success: false, 
        error: 'PDFSHIFT_API_KEY missing. Please configure it in Cloudflare Dashboard.' 
      }, 500);
    }
    
    // Use example data
    const { renderDoctorReportExample } = await import('./report_templates');
    const exampleHtml = renderDoctorReportExample();
    
    // Generate PDF with PDFShift
    const pdfBuffer = await generatePdfWithService(
      exampleHtml,
      'MEDLESS-Reduktionsplan_Aerztliche_Dokumentation.pdf',
      env.PDFSHIFT_API_KEY
    );
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="MEDLESS-Reduktionsplan_Aerztliche_Dokumentation.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
    
  } catch (error: any) {
    console.error('Error generating doctor PDF (GET):', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Fehler beim Erstellen des Arzt-PDFs' 
    }, 500);
  }
})

/**
 * POST /api/pdf/arztbericht
 * Server-side PDF generation for doctor reports (accepts direct HTML)
 * Body: { html: string, fileName?: string }
 */
app.post('/api/pdf/arztbericht', async (c) => {
  try {
    const { env } = c;
    
    // CRITICAL: Check if PDFSHIFT_API_KEY is configured
    if (!env.PDFSHIFT_API_KEY) {
      console.error('PDFSHIFT_API_KEY not configured');
      return c.json({ 
        success: false, 
        error: 'PDFSHIFT_API_KEY missing. Please configure it in Cloudflare Dashboard.' 
      }, 500);
    }
    
    const body = await c.req.json();
    const html = body.html;
    const fileName = body.fileName || 'medless-arztbericht.pdf';
    
    if (!html) {
      return c.json({ 
        success: false, 
        error: 'Missing html in request body.' 
      }, 400);
    }
    
    // Use generatePdfWithService with correct PDF options (A4, margins, viewport)
    const pdfArrayBuffer = await generatePdfWithService(html, fileName, env.PDFSHIFT_API_KEY);
    
    return new Response(pdfArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
    
  } catch (error: any) {
    console.error('Error generating arztbericht PDF:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Fehler beim Erstellen des Ärzteberichts' 
    }, 500);
  }
})

// Magazine Overview Route
app.get('/magazin', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magazin – MEDLESS</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="/static/scroll-animations.css">
  <script src="/static/scroll-animations.js" defer></script>
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <!-- HERO SECTION - MEDLESS CARD STYLE -->
  <section class="py-8 md:py-16 px-4 md:px-6">
    <div class="max-w-6xl mx-auto">
      <div class="rounded-medless-lg bg-medless-bg-light border border-medless-border-light shadow-medless-card px-4 py-6 md:px-10 md:py-10 text-center">
        <h1 class="text-2xl md:text-section-title text-medless-text-primary mt-0 mb-2 md:mb-3">MEDLESS Magazin</h1>
        <p class="text-sm md:text-base text-medless-text-secondary max-w-3xl mx-auto leading-relaxed">
          Wissenswertes rund um Medikamentenreduktion, das Endocannabinoid-System und natürliche Gesundheit.
        </p>
      </div>
    </div>
  </section>

  <!-- ARTICLES GRID -->
  <section class="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-14">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      
      <!-- Artikel: ECS erklärt -->
      <article class="group bg-white border border-medless-border-light rounded-medless-lg overflow-hidden shadow-medless-card hover:shadow-medless-card-hover transition-all duration-medless flex flex-col">
        <a href="/magazin/endocannabinoid-system-erklaert" class="block">
          <div class="overflow-hidden aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=400&fit=crop" 
                 alt="Das Endocannabinoid-System erklärt" 
                 loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-medless" />
          </div>
        </a>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <h3 class="text-card-title text-medless-text-primary mb-2">
            <a href="/magazin/endocannabinoid-system-erklaert" class="hover:text-medless-primary transition-colors duration-medless">Das Endocannabinoid-System erklärt</a>
          </h3>
          <p class="text-sm text-medless-text-secondary mb-4">
            Erfahre, wie dein körpereigenes Schutzschild funktioniert und warum es so wichtig für deine Gesundheit ist.
          </p>
          <div class="mt-auto pt-2">
            <a href="/magazin/endocannabinoid-system-erklaert" 
               class="inline-flex items-center gap-2 text-sm font-medium text-medless-primary hover:text-medless-primary-dark transition-colors duration-medless">
              Artikel lesen <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
        </div>
      </article>
      
      <!-- Artikel: 7 Fehler -->
      <article class="group bg-white border border-medless-border-light rounded-medless-lg overflow-hidden shadow-medless-card hover:shadow-medless-card-hover transition-all duration-medless flex flex-col">
        <a href="/magazin/medikamente-absetzen-7-fehler" class="block">
          <div class="overflow-hidden aspect-[4/3]">
            <img src="https://www.genspark.ai/api/files/s/KMI6cvDz" 
                 alt="7 Fehler beim Medikamente absetzen - Kalter Entzug vs. Sicher ausschleichen" 
                 loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-medless" />
          </div>
        </a>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <h3 class="text-card-title text-medless-text-primary mb-2">
            <a href="/magazin/medikamente-absetzen-7-fehler" class="hover:text-medless-primary transition-colors duration-medless">7 Fehler beim Medikamente absetzen</a>
          </h3>
          <p class="text-sm text-medless-text-secondary mb-4">
            Die häufigsten Fehler beim Ausschleichen von Medikamenten und wie du sie vermeidest.
          </p>
          <div class="mt-auto pt-2">
            <a href="/magazin/medikamente-absetzen-7-fehler" 
               class="inline-flex items-center gap-2 text-sm font-medium text-medless-primary hover:text-medless-primary-dark transition-colors duration-medless">
            Artikel lesen <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: Antidepressiva -->
      <article class="group bg-white border border-medless-border-light rounded-medless-lg overflow-hidden shadow-medless-card hover:shadow-medless-card-hover transition-all duration-medless flex flex-col">
        <a href="/magazin/antidepressiva-absetzen-ohne-entzug" class="block">
          <div class="overflow-hidden aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop" 
                 alt="Antidepressiva absetzen ohne Entzug" 
                 loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-medless" />
          </div>
        </a>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <h3 class="text-card-title text-medless-text-primary mb-2">
            <a href="/magazin/antidepressiva-absetzen-ohne-entzug" class="hover:text-medless-primary transition-colors duration-medless">Antidepressiva absetzen ohne Entzug</a>
          </h3>
          <p class="text-sm text-medless-text-secondary mb-4">
            Strukturierter Leitfaden für ein sicheres Ausschleichen von Antidepressiva unter ärztlicher Begleitung.
          </p>
          <div class="mt-auto pt-2">
            <a href="/magazin/antidepressiva-absetzen-ohne-entzug" 
               class="inline-flex items-center gap-2 text-sm font-medium text-medless-primary hover:text-medless-primary-dark transition-colors duration-medless">
            Artikel lesen <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: Schlaftabletten -->
      <article class="group bg-white border border-medless-border-light rounded-medless-lg overflow-hidden shadow-medless-card hover:shadow-medless-card-hover transition-all duration-medless flex flex-col">
        <a href="/magazin/schlaftabletten-loswerden" class="block">
          <div class="overflow-hidden aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop" 
                 alt="Schlaftabletten loswerden" 
                 loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-medless" />
          </div>
        </a>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <h3 class="text-card-title text-medless-text-primary mb-2">
            <a href="/magazin/schlaftabletten-loswerden" class="hover:text-medless-primary transition-colors duration-medless">Schlaftabletten loswerden</a>
          </h3>
          <p class="text-sm text-medless-text-secondary mb-4">
            Wie du dich schrittweise von Schlafmitteln lösen und zu natürlichem Schlaf zurückfinden kannst.
          </p>
          <div class="mt-auto pt-2">
            <a href="/magazin/schlaftabletten-loswerden" 
               class="inline-flex items-center gap-2 text-sm font-medium text-medless-primary hover:text-medless-primary-dark transition-colors duration-medless">
            Artikel lesen <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: CBD Studien -->
      <article class="group bg-white border border-medless-border-light rounded-medless-lg overflow-hidden shadow-medless-card hover:shadow-medless-card-hover transition-all duration-medless flex flex-col">
        <a href="/magazin/cbd-studien-und-fakten" class="block">
          <div class="overflow-hidden aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop" 
                 alt="CBD: Studien und Fakten" 
                 loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-medless" />
          </div>
        </a>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <h3 class="text-card-title text-medless-text-primary mb-2">
            <a href="/magazin/cbd-studien-und-fakten" class="hover:text-medless-primary transition-colors duration-medless">CBD: Studien und Fakten</a>
          </h3>
          <p class="text-sm text-medless-text-secondary mb-4">
            Wissenschaftliche Erkenntnisse zur Wirkung von CBD bei verschiedenen Beschwerden.
          </p>
          <div class="mt-auto pt-2">
            <a href="/magazin/cbd-studien-und-fakten" 
               class="inline-flex items-center gap-2 text-sm font-medium text-medless-primary hover:text-medless-primary-dark transition-colors duration-medless">
            Artikel lesen <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: Magenschutz -->
      <article class="group bg-white border border-medless-border-light rounded-medless-lg overflow-hidden shadow-medless-card hover:shadow-medless-card-hover transition-all duration-medless flex flex-col">
        <a href="/magazin/magenschutz-absetzen-ppi" class="block">
          <div class="overflow-hidden aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop" 
                 alt="Magenschutz (PPI) absetzen" 
                 loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-medless" />
          </div>
        </a>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <h3 class="text-card-title text-medless-text-primary mb-2">
            <a href="/magazin/magenschutz-absetzen-ppi" class="hover:text-medless-primary transition-colors duration-medless">Magenschutz (PPI) absetzen</a>
          </h3>
          <p class="text-sm text-medless-text-secondary mb-4">
            Protonenpumpenhemmer sicher reduzieren: Was du über das Absetzen von Magenschutz wissen musst.
          </p>
          <div class="mt-auto pt-2">
            <a href="/magazin/magenschutz-absetzen-ppi" 
               class="inline-flex items-center gap-2 text-sm font-medium text-medless-primary hover:text-medless-primary-dark transition-colors duration-medless">
            Artikel lesen <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: 5 Tabletten -->
      <article class="group bg-white border border-medless-border-light rounded-medless-lg overflow-hidden shadow-medless-card hover:shadow-medless-card-hover transition-all duration-medless flex flex-col">
        <a href="/magazin/taeglich-5-tabletten" class="block">
          <div class="overflow-hidden aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&h=400&fit=crop" 
                 alt="Täglich 5 Tabletten – ist das normal?" 
                 loading="lazy"
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-medless" />
          </div>
        </a>
        <div class="p-5 md:p-6 flex flex-col flex-1">
          <h3 class="text-card-title text-medless-text-primary mb-2">
            <a href="/magazin/taeglich-5-tabletten" class="hover:text-medless-primary transition-colors duration-medless">Täglich 5 Tabletten – ist das normal?</a>
          </h3>
          <p class="text-sm text-medless-text-secondary mb-4">
            Polypharmazie verstehen: Wann wird Medikation zur Belastung und was kannst du dagegen tun?
          </p>
          <div class="mt-auto pt-2">
            <a href="/magazin/taeglich-5-tabletten" 
               class="inline-flex items-center gap-2 text-sm font-medium text-medless-primary hover:text-medless-primary-dark transition-colors duration-medless">
            Artikel lesen <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        </div>
      </article>
    </div>
  </section>
  
  <!-- FOOTER -->
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})

// Magazine Article Route: Endocannabinoid-System erklärt

app.get('/magazin/medikamente-absetzen-7-fehler', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>7 Fehler beim Medikamente absetzen – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <main class="max-w-article mx-auto px-4 md:px-6 py-8 md:py-14 pb-12 md:pb-16">
    
    <article class="mb-8">
      <h1 class="text-2xl md:text-article-hero text-medless-text-primary mb-4">7 Fehler beim Medikamente absetzen</h1>
      <p class="text-sm md:text-base text-medless-text-secondary mb-4 md:mb-6 leading-relaxed">Die häufigsten Fehler beim Ausschleichen von Medikamenten und wie du sie vermeidest.</p>
      
      <div class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-medless-text-tertiary mb-6 md:mb-8 pb-4 md:pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> 8. Dezember 2024
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> 8 Min. Lesezeit
        </span>
      </div>
    </article>
    
    <div class="rounded-medless-lg overflow-hidden border border-medless-border-light shadow-medless-card mb-6 md:mb-8">
      <img
        class="w-full h-full aspect-video object-cover"
        src="https://www.genspark.ai/api/files/s/KMI6cvDz"
        alt="7 Fehler beim Medikamente absetzen - Kalter Entzug vs. Sicher ausschleichen"
        loading="eager"
      />
    </div>
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-lg px-4 py-4 md:px-6 md:py-6 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
        <p><span class="font-semibold text-medless-text-primary">Kurz erklärt:</span> Du willst Medikamente reduzieren? Großartig. Aber Vorsicht: Der falsche Weg kann gefährlich werden. Erfahre hier, warum der "kalte Entzug" scheitert und wie du sicher ausschleichst.</p>
      </div>
      
            <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">"Ich setze einfach ab" – warum das fast schiefging</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fehler 1: Der kalte Entzug ("Cold Turkey")</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fehler 2: Alles gleichzeitig reduzieren</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fehler 3: Alleingang ohne Arzt</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fehler 4: Warnsignale ignorieren</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fehler 5: Keine Vorbereitung des Körpers</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fehler 6: Zu schnell reduzieren</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fehler 7: Die Ursache ignorieren</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Dein Geheimtipp: Das Endocannabinoid-System (ECS)</h2>
      <p><strong>Du willst Medikamente reduzieren? Großartig. Aber Vorsicht: Der falsche Weg kann gefährlich werden. Erfahre hier, warum der "kalte Entzug" scheitert und wie du sicher ausschleichst.</strong></p>
      <p>Sarah, 58, hatte genug. Seit Jahren nahm sie acht verschiedene Tabletten. Die Nebenwirkungen waren schlimmer als ihre ursprünglichen Beschwerden. An einem Sonntagmorgen entschied sie: <em>"Das war's. Ich höre auf."</em></p>
      <p>Sie nahm keine ihrer Tabletten mehr. Drei Tage später saß sie in der Notaufnahme: Blutdruck 190/110, Herzrasen, Panik.</p>
      <p><strong>Die Diagnose:</strong> Rebound-Effekt durch abruptes Absetzen eines Betablockers.</p>
      <p>Sarah hatte einen klassischen Fehler gemacht. Der Wunsch nach weniger Medikamenten ist richtig (50% der Deutschen wollen reduzieren!), aber die Methode entscheidet über Erfolg oder Gefahr.</p>
      <p><strong>Was passiert:</strong> Du hörst von heute auf morgen auf. Von 100 auf 0.</p>
      <p><strong>Warum es gefährlich ist:</strong> Dein Körper hat sich an den Wirkstoff angepasst (Adaptation). Fehlt dieser plötzlich, reagiert der Körper mit einer massiven Gegenregulation.</p>
      <p>✅ <strong>Die Lösung:</strong> Ausschleichen. Reduziere die Dosis schrittweise über Wochen.</p>

      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})


app.get('/magazin/endocannabinoid-system-erklaert', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Das Endocannabinoid-System: Dein körpereigenes Schutzschild – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <main class="max-w-article mx-auto px-4 md:px-6 py-8 md:py-14 pb-12 md:pb-16">
    
    <article class="mb-8">
      <h1 class="text-2xl md:text-article-hero text-medless-text-primary mb-4">Das Endocannabinoid-System: Dein körpereigenes Schutzschild</h1>
      <p class="text-sm md:text-base text-medless-text-secondary mb-4 md:mb-6 leading-relaxed">Wie dein Körper sich selbst heilt – und warum dir das niemand erzählt hat.</p>
      
      <div class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-medless-text-tertiary mb-6 md:mb-8 pb-4 md:pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> 10. Januar 2025
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> 6 Min. Lesezeit
        </span>
      </div>
    </article>
    
    <div class="rounded-medless-lg overflow-hidden border border-medless-border-light shadow-medless-card mb-6 md:mb-8">
      <img
        class="w-full h-full aspect-video object-cover"
        src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=400&fit=crop"
        alt="Endocannabinoid-System - Körpereigene Regulationssysteme"
        loading="eager"
      />
    </div>
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-lg px-4 py-4 md:px-6 md:py-6 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
        <p><span class="font-semibold text-medless-text-primary">Kurz erklärt:</span> Stell dir vor, dein Körper hätte eine eigene Apotheke gegen Schmerz, Stress und Entzündungen – eine biologische Schutzinstanz, die rund um die Uhr arbeitet. Du hast sie bereits: das <strong>Endocannabinoid-System (ECS)</strong>.</p>
      </div>
      
      <p>Trotz seiner zentralen Rolle ist das ECS eines der am wenigsten bekannten Körpersysteme – selbst vielen Ärzten. Warum? Weil es erst in den 1990er Jahren entdeckt wurde. Seitdem gilt es als <strong>Regulationssystem des Körpers</strong>, das alles von Schmerzwahrnehmung bis Stimmung beeinflusst.</p>
      
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Was ist das Endocannabinoid-System?</h2>
      
      <p>Das ECS ist ein <strong>körpereigenes Netzwerk aus Botenstoffen und Rezeptoren</strong>, das als Frühwarnsystem und Reparaturmechanismus dient. Es besteht aus drei Hauptkomponenten:</p>
      
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Endocannabinoide</strong> (körpereigene Botenstoffe wie Anandamid und 2-AG)</li>
        <li><strong>Rezeptoren</strong> (CB1 im Gehirn/Nervensystem, CB2 im Immunsystem)</li>
        <li><strong>Enzyme</strong>, die Endocannabinoide auf- und abbauen</li>
      </ul>
      
      <p>Wenn dein Körper aus dem Gleichgewicht gerät – etwa durch Stress, Schmerz oder Entzündungen – aktiviert das ECS seine „Notfall-Apotheke" und stellt gezielt Endocannabinoide her. Diese docken an Rezeptoren an und bringen dich zurück in Balance. Mediziner nennen das <strong>Homöostase</strong>.</p>
      
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Warum ist das ECS so wichtig?</h2>
      
      <p>Das Endocannabinoid-System reguliert fundamentale Körperfunktionen:</p>
      
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Schmerzverarbeitung</strong> – Es dämpft Schmerzsignale im Nervensystem</li>
        <li><strong>Entzündungsreaktionen</strong> – Es bremst überschießende Immunantworten</li>
        <li><strong>Stressregulation</strong> – Es moduliert Angst und emotionale Belastung</li>
        <li><strong>Schlaf-Wach-Rhythmus</strong> – Es steuert den zirkadianen Rhythmus</li>
        <li><strong>Appetit & Verdauung</strong> – Es beeinflusst Hunger und Darmfunktion</li>
        <li><strong>Gedächtnis & Lernen</strong> – Es schützt Nervenzellen vor Überlastung</li>
      </ul>
      
      <p>Forscher sprechen mittlerweile von einer <strong>„Endocannabinoid-Defizienz"</strong> als möglicher Ursache für chronische Schmerzen, Migräne, Fibromyalgie und Reizdarmsyndrom.</p>
      
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Wie CBD das Endocannabinoid-System unterstützt</h2>
      
      <p>Hier wird es spannend: <strong>CBD (Cannabidiol)</strong> aus der Hanfpflanze interagiert direkt mit dem ECS – allerdings anders, als viele denken.</p>
      
      <p>CBD dockt nicht direkt an CB1- oder CB2-Rezeptoren an. Stattdessen:</p>
      
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li>Es <strong>hemmt den Abbau</strong> körpereigener Endocannabinoide (Anandamid bleibt länger aktiv)</li>
        <li>Es <strong>moduliert Rezeptoren</strong> indirekt (wie ein Verstärker für das ECS)</li>
        <li>Es wirkt auf <strong>Serotonin-, Vanilloid- und PPAR-Rezeptoren</strong> (entzündungshemmend, schmerzlindernd)</li>
      </ul>
      
      <p>Deshalb gilt CBD als <strong>ECS-Booster</strong>: Es verstärkt das, was dein Körper ohnehin tut – nur effizienter.</p>
      
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Was bedeutet das für dich?</h2>
      
      <p>Wenn du Medikamente reduzieren willst, ist die Stärkung deines Endocannabinoid-Systems eine sinnvolle Strategie. Wie?</p>
      
      <ul class="list-disc list-inside space-y-2 ml-4">
        <li><strong>Bewegung</strong> – Steigert die Produktion von Anandamid („Runner's High")</li>
        <li><strong>Omega-3-Fettsäuren</strong> – Bausteine für Endocannabinoide</li>
        <li><strong>Stressreduktion</strong> – Chronischer Stress schwächt das ECS</li>
        <li><strong>CBD-Supplementierung</strong> – Kann das ECS gezielt unterstützen</li>
      </ul>
      
      <p>Das Endocannabinoid-System ist kein Wundermittel – aber es ist der Beweis, dass dein Körper bereits alles mitbringt, um sich selbst zu regulieren. Die Frage ist: Gibst du ihm die Chance dazu?</p>
      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
`)
})

// Magazine Article Route: Antidepressiva absetzen
app.get('/magazin/antidepressiva-absetzen-ohne-entzug', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Antidepressiva absetzen ohne Entzug – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <main class="max-w-article mx-auto px-4 md:px-6 py-8 md:py-14 pb-12 md:pb-16">
    
    <article class="mb-8">
      <h1 class="text-2xl md:text-article-hero text-medless-text-primary mb-4">Antidepressiva absetzen ohne Entzug</h1>
      <p class="text-sm md:text-base text-medless-text-secondary mb-4 md:mb-6 leading-relaxed">Strukturierter Leitfaden für ein sicheres Ausschleichen von Antidepressiva unter ärztlicher Begleitung.</p>
      
      <div class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-medless-text-tertiary mb-6 md:mb-8 pb-4 md:pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> 8. Dezember 2024
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> 9 Min. Lesezeit
        </span>
      </div>
    </article>
    
    <div class="rounded-medless-lg overflow-hidden border border-medless-border-light shadow-medless-card mb-6 md:mb-8">
      <img
        class="w-full h-full aspect-video object-cover"
        src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop"
        alt="Antidepressiva absetzen ohne Entzug"
        loading="eager"
      />
    </div>
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-lg px-4 py-4 md:px-6 md:py-6 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
        <p><span class="font-semibold text-medless-text-primary">Kurz erklärt:</span> Du möchtest Antidepressiva absetzen, hast aber Angst vor dem "Loch" danach? Erfahre, warum Absetzerscheinungen entstehen und wie du sie mit einem 8-Wochen-Plan und ECS-Unterstützung vermeidest.</p>
      </div>
      
            <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Die Angst vor dem Absetzen: "Schaffe ich das?"</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Warum entstehen Absetzerscheinungen überhaupt?</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Die Wahrheit in Zahlen</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Der sanfte 8-Wochen-Plan: So gehst du vor</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Dein natürlicher Fallschirm: Das Endocannabinoid-System (ECS)</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">5 Strategien, um dein ECS beim Absetzen zu stärken</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Rote Flaggen: Wann du sofort zum Arzt musst</h2>
      <p><strong>Du möchtest Antidepressiva absetzen, hast aber Angst vor dem "Loch" danach? Erfahre, warum Absetzerscheinungen entstehen und wie du sie mit einem 8-Wochen-Plan und ECS-Unterstützung vermeidest.</strong></p>
      <p>Kennst du dieses Gefühl? Du nimmst seit Monaten Antidepressiva. Sie haben dir geholfen, aus dem Gröbsten herauszukommen. Du fühlst dich stabil und möchtest eigentlich reduzieren.</p>
      <p>Aber dann hörst du die Geschichten: <em>"Ich hatte tagelang Schwindel"</em>, <em>"Die Angst kam sofort zurück"</em>, <em>"Ich musste wieder anfangen"</em>.</p>
      <p>Die Angst vor dem sogenannten <strong>Absetzsyndrom</strong> hält Millionen Menschen davon ab, den Schritt in die Unabhängigkeit zu wagen.</p>
      <p>Die gute Nachricht: Mit dem richtigen Plan, Geduld und der Unterstützung deines körpereigenen <strong>Endocannabinoid-Systems (ECS)</strong> kannst du den Ausstieg sanft und sicher schaffen.</p>
      <p>Antidepressiva (vor allem SSRIs wie Citalopram oder Sertralin) wirken, indem sie den Serotoninspiegel im Gehirn künstlich erhöhen. Dein Gehirn gewöhnt sich an dieses hohe Niveau ("Down-Regulation").</p>
      <p>Wenn du das Medikament plötzlich wegnimmst, fehlt dem Gehirn der Botenstoff. Es entsteht ein neurochemisches Ungleichgewicht.</p>
      <p><strong>Die Folgen:</strong></p>

      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})


app.get('/magazin/schlaftabletten-loswerden', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Schlaftabletten loswerden – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <main class="max-w-article mx-auto px-4 md:px-6 py-8 md:py-14 pb-12 md:pb-16">
    
    <article class="mb-8">
      <h1 class="text-2xl md:text-article-hero text-medless-text-primary mb-4">Schlaftabletten loswerden</h1>
      <p class="text-sm md:text-base text-medless-text-secondary mb-4 md:mb-6 leading-relaxed">Wie du dich schrittweise von Schlafmitteln lösen und zu natürlichem Schlaf zurückfinden kannst.</p>
      
      <div class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-medless-text-tertiary mb-6 md:mb-8 pb-4 md:pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> 8. Dezember 2024
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> 7 Min. Lesezeit
        </span>
      </div>
    </article>
    
    <div class="rounded-medless-lg overflow-hidden border border-medless-border-light shadow-medless-card mb-6 md:mb-8">
      <img
        class="w-full h-full aspect-video object-cover"
        src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop"
        alt="Schlaftabletten loswerden"
        loading="eager"
      />
    </div>
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-lg px-4 py-4 md:px-6 md:py-6 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
        <p><span class="font-semibold text-medless-text-primary">Kurz erklärt:</span> Jede Nacht das gleiche Spiel: Ohne Tablette keine Ruhe. Erfahre, wie du die Abhängigkeit durchbrichst und deinem Körper wieder beibringst, natürlich zu schlafen.</p>
      </div>
      
            <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Die stille Abhängigkeit: "Ohne geht es nicht mehr"</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Warum Schlafmittel zur Falle werden</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Der sichere Ausweg: Der 8-Wochen-Plan</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Dein natürlicher Schlaf-Lehrer: Das ECS</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">5 natürliche Helfer (statt Chemie)</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Die 3 goldenen Regeln der Schlafhygiene</h2>
      <p><strong>Jede Nacht das gleiche Spiel: Ohne Tablette keine Ruhe. Erfahre, wie du die Abhängigkeit durchbrichst und deinem Körper wieder beibringst, natürlich zu schlafen.</strong></p>
      <p>Du öffnest die Schublade. Eine Tablette. Vielleicht zwei. Du weißt, dass du davon wegkommen solltest. Aber die Angst vor der schlaflosen Nacht ist größer.</p>
      <p>Du bist nicht allein: <strong>1,5 Millionen Menschen</strong> in Deutschland sind von Schlafmitteln abhängig. Besonders tückisch sind Benzodiazepine und sogenannte Z-Substanzen (Zolpidem, Zopiclon).</p>
      <p>Die gute Nachricht: Dein Körper hat das Schlafen nicht verlernt. Er hat es nur vergessen. Mit dem richtigen Plan kannst du ihn wieder trainieren.</p>
      <p>Schlafmittel verstärken den beruhigenden Botenstoff GABA im Gehirn. Das funktioniert anfangs super. Aber nach wenigen Wochen (oft schon nach 4!) passt sich das Gehirn an.</p>
      <p><strong>Das Ergebnis:</strong> Du nimmst die Tablette nicht mehr, um zu schlafen – sondern nur noch, um den Entzug zu vermeiden.</p>
      <p>🚨 <strong>Wichtig:</strong> Setze Schlafmittel NIEMALS kalt ab ("Cold Turkey"). Das kann zu Krampfanfällen und massiver Schlaflosigkeit führen.</p>
      <p>Wir reduzieren die Dosis in winzigen Schritten (z.B. alle 2 Wochen um 10-20%).</p>

      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})


app.get('/magazin/cbd-studien-und-fakten', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CBD: Studien und Fakten – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <main class="max-w-article mx-auto px-4 md:px-6 py-8 md:py-14 pb-12 md:pb-16">
    
    <article class="mb-8">
      <h1 class="text-2xl md:text-article-hero text-medless-text-primary mb-4">CBD: Studien und Fakten</h1>
      <p class="text-sm md:text-base text-medless-text-secondary mb-4 md:mb-6 leading-relaxed">Wissenschaftliche Erkenntnisse zur Wirkung von CBD bei verschiedenen Beschwerden.</p>
      
      <div class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-medless-text-tertiary mb-6 md:mb-8 pb-4 md:pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> 8. Dezember 2024
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> 10 Min. Lesezeit
        </span>
      </div>
    </article>
    
    <div class="rounded-medless-lg overflow-hidden border border-medless-border-light shadow-medless-card mb-6 md:mb-8">
      <img
        class="w-full h-full aspect-video object-cover"
        src="https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop"
        alt="CBD: Studien und Fakten"
        loading="eager"
      />
    </div>
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-lg px-4 py-4 md:px-6 md:py-6 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
        <p><span class="font-semibold text-medless-text-primary">Kurz erklärt:</span> Überall hörst du: "CBD ist das neue Wundermittel". Doch was stimmt davon? Erfahre, wie CBD dir beim Absetzen von Medikamenten helfen kann – und wo die Risiken liegen.</p>
      </div>
      
            <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Zwischen Hype und Realität</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Was ist CBD eigentlich? (Der 2-Minuten-Crashkurs)</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Das sagen die Studien: Wo CBD wirklich hilft</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Vorsicht: Der "Elefant im Raum" (Wechselwirkungen)</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Die Rechtslage: Ist das legal?</h2>
      <p><strong>Überall hörst du: "CBD ist das neue Wundermittel". Doch was stimmt davon? Erfahre, wie CBD dir beim Absetzen von Medikamenten helfen kann – und wo die Risiken liegen.</strong></p>
      <p>Die Schlagzeilen überschlagen sich: "Schmerzfrei ohne Chemie!", "Endlich besser schlafen!". Doch zwischen Marketing-Versprechen und echter Wissenschaft klafft oft eine Lücke.</p>
      <p>Die Wahrheit ist: <strong>CBD (Cannabidiol) ist kein Allheilmittel.</strong> Es ersetzt keinen Arzt und keine lebenswichtigen Medikamente. <strong>Aber:</strong> Hunderte Studien zeigen inzwischen, dass es eine extrem wertvolle Unterstützung sein kann, wenn man Medikamente reduzieren möchte.</p>
      <p>CBD ist einer von über 100 Wirkstoffen aus der Hanfpflanze. Der wichtigste Unterschied zu THC (dem "Kiffer-Wirkstoff"): <strong>CBD macht nicht high.</strong></p>
      <p><strong>Wie es wirkt:</strong> Es dockt nicht direkt an deine Zellen an, sondern moduliert dein körpereigenes <strong>Endocannabinoid-System (ECS)</strong>. Es hilft dem Körper, sich selbst wieder ins Gleichgewicht zu bringen.</p>
      <p>Das ist das stärkste Feld der Forschung. Studien zeigen, dass Patienten, die Cannabis-Medikamente nutzen, ihren Verbrauch an starken Schmerzmitteln (Opioiden) massiv senken können.</p>
      <p><em>Das Ergebnis: Weniger Schmerzmittel nötig = weniger Nebenwirkungen, weniger Abhängigkeit.</em> (Quelle: Deutsche Gesellschaft für Schmerzmedizin)</p>
      <p>CBD dämpft die Reaktion des Körpers auf Stresshormone. Der Vorteil: Im Gegensatz zu Beruhigungsmitteln (Benzodiazepinen) macht es nicht süchtig und führt nicht zu einer Toleranzentwicklung.</p>

      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})


app.get('/magazin/magenschutz-absetzen-ppi', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Magenschutz (PPI) absetzen – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <main class="max-w-article mx-auto px-4 md:px-6 py-8 md:py-14 pb-12 md:pb-16">
    
    <article class="mb-8">
      <h1 class="text-2xl md:text-article-hero text-medless-text-primary mb-4">Magenschutz (PPI) absetzen</h1>
      <p class="text-sm md:text-base text-medless-text-secondary mb-4 md:mb-6 leading-relaxed">Protonenpumpenhemmer sicher reduzieren: Was du über das Absetzen von Magenschutz wissen musst.</p>
      
      <div class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-medless-text-tertiary mb-6 md:mb-8 pb-4 md:pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> 8. Dezember 2024
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> 8 Min. Lesezeit
        </span>
      </div>
    </article>
    
    <div class="rounded-medless-lg overflow-hidden border border-medless-border-light shadow-medless-card mb-6 md:mb-8">
      <img
        class="w-full h-full aspect-video object-cover"
        src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop"
        alt="Magenschutz (PPI) absetzen"
        loading="eager"
      />
    </div>
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-lg px-4 py-4 md:px-6 md:py-6 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
        <p><span class="font-semibold text-medless-text-primary">Kurz erklärt:</span> "Nehmen Sie das morgens dazu, um den Magen zu schützen." Ein Satz, den Millionen Deutsche hören. Doch was als kurzfristiger Schutz gedacht war, wird oft zur Dauerlösung mit Risiken. Erfahre, warum das Absetzen so schwer ist und wie es trotzdem klappt.</p>
      </div>
      
            <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Der Klassiker: "Nur zur Sicherheit"</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Der Rebound-Effekt: Warum dein Magen rebelliert</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Sind PPI wirklich harmlos?</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Der Ausweg: Ausschleichen statt Absetzen</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">5 natürliche Alternativen bei akutem Brennen</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Wie dir MedLess und das ECS dabei helfen</h2>
      <p><strong>"Nehmen Sie das morgens dazu, um den Magen zu schützen." Ein Satz, den Millionen Deutsche hören. Doch was als kurzfristiger Schutz gedacht war, wird oft zur Dauerlösung mit Risiken. Erfahre, warum das Absetzen so schwer ist und wie es trotzdem klappt.</strong></p>
      <p>Es fängt meist harmlos an. Du bekommst ein Schmerzmittel (wie Ibuprofen) oder Antibiotika. Der Arzt verschreibt dazu Pantoprazol oder Omeprazol. "Ein Magenschutz", heißt es. Klingt vernünftig.</p>
      <p>Die Schmerzmittel setzt du nach zwei Wochen ab. Den Magenschutz nimmst du weiter. "Kann ja nicht schaden", denkst du. Monate vergehen. Jahre vergehen.</p>
      <p>Dann vergisst du die Tablette einmal im Urlaub. Und plötzlich ist es da: Ein Brennen, das bis in den Hals steigt. Sodbrennen, schlimmer als je zuvor. Du greifst sofort zur Tablette. Die Erleichterung folgt.</p>
      <p>Deine Schlussfolgerung: <em>"Puh, ich habe wohl wirklich zu viel Magensäure. Gut, dass ich die Tabletten nehme."</em></p>
      <p><strong>Doch das ist ein Trugschluss. Dein Magen ist nicht krank. Er ist abhängig.</strong></p>
      <p>Diese Medikamente (Protonenpumpenhemmer, kurz PPI) blockieren die Säureproduktion extrem effektiv. Dein Körper ist aber schlau. Er merkt: "Huch, zu wenig Säure für die Verdauung!"</p>
      <p>Was macht er? Er baut <strong>mehr</strong> Säure-Pumpen, um gegen die Blockade anzukämpfen. Solange du die Tablette nimmst, merkst du davon nichts. Aber sobald du sie weglässt, arbeiten all diese neuen Pumpen auf Hochtouren. Es kommt zur "Säureflut".</p>

      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})


app.get('/magazin/taeglich-5-tabletten', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Täglich 5 Tabletten – ist das normal? – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    // ✅ MEDLESS Design System loaded from tailwind.config.js (canonical)
  </script>
  
  <style>
    ${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-medless-bg-ultra-light">
  
  ${getCanonicalHeader('magazin')}

  <main class="max-w-article mx-auto px-4 md:px-6 py-8 md:py-14 pb-12 md:pb-16">
    
    <article class="mb-8">
      <h1 class="text-2xl md:text-article-hero text-medless-text-primary mb-4">Täglich 5 Tabletten – ist das normal?</h1>
      <p class="text-sm md:text-base text-medless-text-secondary mb-4 md:mb-6 leading-relaxed">Polypharmazie verstehen: Wann wird Medikation zur Belastung und was kannst du dagegen tun?</p>
      
      <div class="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-medless-text-tertiary mb-6 md:mb-8 pb-4 md:pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> 8. Dezember 2024
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> 6 Min. Lesezeit
        </span>
      </div>
    </article>
    
    <div class="rounded-medless-lg overflow-hidden border border-medless-border-light shadow-medless-card mb-6 md:mb-8">
      <img
        class="w-full h-full aspect-video object-cover"
        src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&h=400&fit=crop"
        alt="Täglich 5 Tabletten – ist das normal?"
        loading="eager"
      />
    </div>
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-lg px-4 py-4 md:px-6 md:py-6 mb-6 md:mb-10 text-sm md:text-base leading-relaxed">
        <p><span class="font-semibold text-medless-text-primary">Kurz erklärt:</span> Ab fünf Medikamenten täglich sprechen Ärzte von Polypharmazie – ein Zustand, der längst nicht mehr nur ältere Menschen betrifft. Immer mehr Erwachsene schlucken mehrere Tabletten pro Tag, oft über Jahre hinweg, ohne die Risiken wirklich zu kennen.</p>
      </div>
      
            <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Was ist Polypharmazie?</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Die Risiken: Wenn Medikamente miteinander kämpfen</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Warum passiert das so oft?</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Was kannst du tun?</h2>
      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Fazit</h2>
      <p>Ab fünf Medikamenten täglich sprechen Ärzte von <strong>Polypharmazie</strong> – ein Zustand, der längst nicht mehr nur ältere Menschen betrifft. Immer mehr Erwachsene schlucken mehrere Tabletten pro Tag, oft über Jahre hinweg, ohne die Risiken wirklich zu kennen.</p>
      <p>Doch was passiert, wenn sich Wirkstoffe im Körper gegenseitig beeinflussen? Und warum wird das Risiko so selten besprochen?</p>
      <p>Polypharmazie beschreibt die gleichzeitige Einnahme von fünf oder mehr verschreibungspflichtigen Medikamenten. Offiziell ist das keine Krankheit – aber ein erheblicher Risikofaktor.</p>
      <p><strong>Das Problem:</strong> Jedes Medikament wird einzeln getestet und verschrieben. Doch wie sie zusammenwirken, wenn fünf, sechs oder sogar zehn Wirkstoffe gleichzeitig im Blutkreislauf sind, ist oft unklar.</p>
      <p>Je mehr Medikamente, desto höher das Risiko für:</p>
      <p>In vielen Fällen ist Polypharmazie keine bewusste Entscheidung, sondern das Ergebnis von:</p>
      <p>Wenn du täglich fünf oder mehr Medikamente einnimmst, solltest du aktiv werden:</p>
      <p>MEDLESS hilft dir, einen individuellen Ausschleichplan zu erstellen – KI-berechnet, wissenschaftlich fundiert und für die ärztliche Begleitung entwickelt.</p>

      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  ${getCanonicalFooter()}
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})


app.get('/app', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>MEDLESS-Orientierungsplan erstellen</title>
      
      <!-- Google Fonts - Inter (same as Landing) -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      
      <!-- Tailwind CDN + MEDLESS Design System -->
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
              },
              colors: {
                'medless-primary': '#2FB585',
                'medless-primary-dark': '#27a073',
                'medless-bg-ultra-light': '#FAFEFB',
                'medless-bg-light': '#F4FBF7',
                'medless-bg-medium': '#E7F8EF',
                'medless-border-light': '#DCE9E2',
                'medless-text-primary': '#111111',
                'medless-text-secondary': '#666666'
              },
              borderRadius: {
                'medless-sm': '8px',
                'medless-md': '12px',
                'medless-lg': '16px',
                'medless-button': '10px'
              },
              boxShadow: {
                'medless-card': '0 2px 8px rgba(47, 181, 133, 0.08)',
                'medless-button': '0 4px 16px rgba(47, 181, 133, 0.2)'
              }
            }
          }
        }
      </script>
    </head>
    
    <body class="font-sans bg-medless-bg-ultra-light text-medless-text-primary">
      
      <!-- HERO SECTION -->
      <section class="bg-gradient-to-br from-medless-primary to-medless-primary-dark text-white py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-12">
            <h1 class="text-4xl md:text-5xl font-bold mb-4">
              Ihr persönlicher MEDLESS-Orientierungsplan
            </h1>
            <p class="text-xl md:text-2xl text-white/90 mb-8">
              Erfasst Medikamente, zeigt Wechselwirkungen, erstellt einen ärztetauglichen PDF-Bericht
            </p>
            <button 
              onclick="document.getElementById('tool').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => document.getElementById('first_name')?.focus(), 500);"
              class="bg-white text-medless-primary px-8 py-4 rounded-medless-lg font-semibold text-lg hover:bg-medless-bg-ultra-light transition-all shadow-lg hover:shadow-xl"
            >
              Orientierungsplan starten →
            </button>
          </div>
          
          <!-- BENEFITS GRID (styled like Landing) -->
          <div class="grid md:grid-cols-4 gap-6 mt-12">
            <div class="bg-white/10 backdrop-blur-sm rounded-medless-lg shadow-medless-card p-6 text-center">
              <div class="text-4xl mb-3">📋</div>
              <h3 class="font-semibold text-lg mb-2">Medikamente erfassen</h3>
              <p class="text-sm text-white/80">Alle aktuellen Medikamente zentral dokumentieren</p>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-medless-lg shadow-medless-card p-6 text-center">
              <div class="text-4xl mb-3">⚠️</div>
              <h3 class="font-semibold text-lg mb-2">Wechselwirkungen prüfen</h3>
              <p class="text-sm text-white/80">Automatische Analyse kritischer Kombinationen</p>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-medless-lg shadow-medless-card p-6 text-center">
              <div class="text-4xl mb-3">📊</div>
              <h3 class="font-semibold text-lg mb-2">Plan erstellen</h3>
              <p class="text-sm text-white/80">Individueller Reduktionsplan (2-12 Wochen)</p>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-medless-lg shadow-medless-card p-6 text-center">
              <div class="text-4xl mb-3">💾</div>
              <h3 class="font-semibold text-lg mb-2">PDF Download</h3>
              <p class="text-sm text-white/80">Professioneller Bericht für Arztgespräch</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- MAIN WIZARD SECTION -->
      <main class="py-12 px-4">
        <div class="max-w-4xl mx-auto">
          
          <!-- WIZARD CARD -->
          <section id="tool" class="bg-white rounded-medless-lg shadow-medless-card p-8">
            
            <!-- WIZARD HEADER -->
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-medless-primary mb-2">
                5-Schritte-Wizard
              </h2>
              <p class="text-medless-text-secondary">
                Füllen Sie die Schritte aus, um Ihren persönlichen Orientierungsplan zu erstellen
              </p>
            </div>
            
            <!-- STEPPER INDICATOR -->
            <div class="mb-10">
              <!-- Desktop Stepper -->
              <div class="hidden md:grid md:grid-cols-5 gap-4">
                <div class="text-center step-indicator" data-step="1">
                  <div id="step-indicator-1" class="w-12 h-12 rounded-full bg-medless-primary text-white font-semibold flex items-center justify-center mx-auto transition-all">1</div>
                  <p class="mt-2 text-sm text-medless-text-secondary font-medium">Persönlich</p>
                </div>
                <div class="text-center step-indicator" data-step="2">
                  <div id="step-indicator-2" class="w-12 h-12 rounded-full bg-gray-300 text-white font-semibold flex items-center justify-center mx-auto transition-all">2</div>
                  <p class="mt-2 text-sm text-medless-text-secondary font-medium">Körper</p>
                </div>
                <div class="text-center step-indicator" data-step="3">
                  <div id="step-indicator-3" class="w-12 h-12 rounded-full bg-gray-300 text-white font-semibold flex items-center justify-center mx-auto transition-all">3</div>
                  <p class="mt-2 text-sm text-medless-text-secondary font-medium">Medikation</p>
                </div>
                <div class="text-center step-indicator" data-step="4">
                  <div id="step-indicator-4" class="w-12 h-12 rounded-full bg-gray-300 text-white font-semibold flex items-center justify-center mx-auto transition-all">4</div>
                  <p class="mt-2 text-sm text-medless-text-secondary font-medium">Plan</p>
                </div>
                <div class="text-center step-indicator" data-step="5">
                  <div id="step-indicator-5" class="w-12 h-12 rounded-full bg-gray-300 text-white font-semibold flex items-center justify-center mx-auto transition-all">5</div>
                  <p class="mt-2 text-sm text-medless-text-secondary font-medium">Fertig</p>
                </div>
              </div>
              
              <!-- Mobile Stepper -->
              <div class="md:hidden flex justify-center items-center gap-2">
                <div id="step-indicator-mobile-1" class="w-3 h-3 rounded-full bg-medless-primary transition-all"></div>
                <div id="step-indicator-mobile-2" class="w-3 h-3 rounded-full bg-gray-300 transition-all"></div>
                <div id="step-indicator-mobile-3" class="w-3 h-3 rounded-full bg-gray-300 transition-all"></div>
                <div id="step-indicator-mobile-4" class="w-3 h-3 rounded-full bg-gray-300 transition-all"></div>
                <div id="step-indicator-mobile-5" class="w-3 h-3 rounded-full bg-gray-300 transition-all"></div>
              </div>
            </div>
            
            <!-- ERROR BOX -->
            <div id="error-box" class="hidden mb-6 bg-red-50 border border-red-200 rounded-medless-button p-4">
              <p id="error-message" class="text-red-800"></p>
            </div>
            
            <!-- WIZARD FORM -->
            <form id="medication-form">
              
              <!-- STEP 1: Persönliche Angaben (NOT hidden - visible by default) -->
              <div id="step-1" class="form-step">
                <h3 class="text-xl font-semibold mb-4 text-medless-primary">Schritt 1: Persönliche Angaben</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Vorname</label>
                    <input type="text" id="first_name" name="first_name" placeholder="Ihr Vorname" class="w-full border border-medless-border-light rounded-medless-button px-4 py-2 focus:outline-none focus:ring-2 focus:ring-medless-primary focus:border-medless-primary transition-colors" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Biologisches Geschlecht</label>
                    <div class="space-y-2">
                      <label class="flex items-center cursor-pointer"><input type="radio" name="gender" value="male" class="mr-2 text-medless-primary focus:ring-medless-primary" required /> Männlich</label>
                      <label class="flex items-center cursor-pointer"><input type="radio" name="gender" value="female" class="mr-2 text-medless-primary focus:ring-medless-primary" /> Weiblich</label>
                    </div>
                  </div>
                </div>
                <div class="mt-6 flex justify-end">
                  <button type="button" class="btn-next bg-medless-primary text-white px-6 py-2 rounded-medless-button hover:bg-medless-primary-dark transition-colors font-medium">Weiter</button>
                </div>
              </div>
              
              <!-- STEP 2: Körperdaten (hidden initially) -->
              <div id="step-2" class="form-step hidden">
                <h3 class="text-xl font-semibold mb-4 text-medless-primary">Schritt 2: Körperdaten</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Alter (Jahre)</label>
                    <input type="number" id="age" name="age" placeholder="Ihr Alter" class="w-full border border-medless-border-light rounded-medless-button px-4 py-2 focus:outline-none focus:ring-2 focus:ring-medless-primary focus:border-medless-primary transition-colors" min="1" max="120" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Gewicht (kg)</label>
                    <input type="number" id="weight" name="weight" placeholder="Ihr Gewicht" class="w-full border border-medless-border-light rounded-medless-button px-4 py-2 focus:outline-none focus:ring-2 focus:ring-medless-primary focus:border-medless-primary transition-colors" min="1" max="300" step="0.1" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Größe (cm)</label>
                    <input type="number" id="height" name="height" placeholder="Ihre Größe" class="w-full border border-medless-border-light rounded-medless-button px-4 py-2 focus:outline-none focus:ring-2 focus:ring-medless-primary focus:border-medless-primary transition-colors" min="50" max="250" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Leberfunktion</label>
                    <select id="liver_function" name="liver_function" class="w-full border border-medless-border-light rounded-medless-button px-4 py-2 focus:outline-none focus:ring-2 focus:ring-medless-primary focus:border-medless-primary transition-colors" required>
                      <option value="">Bitte auswählen</option>
                      <option value="normal">Normal</option>
                      <option value="eingeschränkt">Eingeschränkt</option>
                      <option value="schwer_eingeschränkt">Schwer eingeschränkt</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Nierenfunktion</label>
                    <select id="kidney_function" name="kidney_function" class="w-full border border-medless-border-light rounded-medless-button px-4 py-2 focus:outline-none focus:ring-2 focus:ring-medless-primary focus:border-medless-primary transition-colors" required>
                      <option value="">Bitte auswählen</option>
                      <option value="normal">Normal</option>
                      <option value="eingeschränkt">Eingeschränkt</option>
                      <option value="schwer_eingeschränkt">Schwer eingeschränkt</option>
                    </select>
                  </div>
                </div>
                <div class="mt-6 flex justify-between">
                  <button type="button" class="btn-prev bg-gray-200 text-medless-text-primary px-6 py-2 rounded-medless-button hover:bg-gray-300 transition-colors font-medium">Zurück</button>
                  <button type="button" class="btn-next bg-medless-primary text-white px-6 py-2 rounded-medless-button hover:bg-medless-primary-dark transition-colors font-medium">Weiter</button>
                </div>
              </div>
              
              <!-- STEP 3: Medikation (hidden initially) -->
              <div id="step-3" class="form-step hidden">
                <h3 class="text-xl font-semibold mb-4 text-medless-primary">Schritt 3: Ihre Medikation</h3>
                <div id="medication-inputs" class="space-y-4">
                  <div id="empty-state" class="text-center py-8 text-medless-text-secondary">
                    <p class="font-medium">Noch keine Medikamente hinzugefügt.</p>
                    <p class="text-sm mt-2">Klicken Sie auf "Medikament hinzufügen"</p>
                  </div>
                </div>
                <button type="button" id="add-medication" class="mt-4 bg-medless-bg-medium text-medless-primary px-4 py-2 rounded-medless-button hover:bg-medless-primary hover:text-white transition-all font-medium">+ Medikament hinzufügen</button>
                <div class="mt-6 flex justify-between">
                  <button type="button" class="btn-prev bg-gray-200 text-medless-text-primary px-6 py-2 rounded-medless-button hover:bg-gray-300 transition-colors font-medium">Zurück</button>
                  <button type="button" class="btn-next bg-medless-primary text-white px-6 py-2 rounded-medless-button hover:bg-medless-primary-dark transition-colors font-medium">Weiter</button>
                </div>
              </div>
              
              <!-- STEP 4: Plan-Auswahl (hidden initially) -->
              <div id="step-4" class="form-step hidden">
                <h3 class="text-xl font-semibold mb-4 text-medless-primary">Schritt 4: Plan-Auswahl</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Zieldauer (Wochen)</label>
                    <div class="space-y-2">
                      <label class="flex items-center cursor-pointer"><input type="radio" name="duration" value="2" class="mr-2 text-medless-primary focus:ring-medless-primary" required /> 2 Wochen (schnell)</label>
                      <label class="flex items-center cursor-pointer"><input type="radio" name="duration" value="4" class="mr-2 text-medless-primary focus:ring-medless-primary" /> 4 Wochen</label>
                      <label class="flex items-center cursor-pointer"><input type="radio" name="duration" value="6" class="mr-2 text-medless-primary focus:ring-medless-primary" /> 6 Wochen</label>
                      <label class="flex items-center cursor-pointer"><input type="radio" name="duration" value="8" class="mr-2 text-medless-primary focus:ring-medless-primary" checked /> 8 Wochen (empfohlen)</label>
                      <label class="flex items-center cursor-pointer"><input type="radio" name="duration" value="12" class="mr-2 text-medless-primary focus:ring-medless-primary" /> 12 Wochen (sehr sanft)</label>
                    </div>
                  </div>
                  <!-- Reduction Slider (always visible, 10-100%) -->
                  <div>
                    <label class="block text-sm font-medium mb-2">
                      Reduktionsziel: <span id="reduction-percentage-label" class="text-medless-primary font-semibold">100%</span>
                    </label>
                    <input type="range" id="reduction-percentage" name="reduction_percentage" min="10" max="100" value="100" step="10" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-medless-primary" required />
                    <div class="flex justify-between text-xs text-medless-text-secondary mt-1">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                    <p class="text-xs text-medless-text-secondary mt-2">MEDLESS unterstützt ausschließlich Reduktionspläne (10-100%)</p>
                  </div>
                </div>
                <div class="mt-6 flex justify-between">
                  <button type="button" class="btn-prev bg-gray-200 text-medless-text-primary px-6 py-2 rounded-medless-button hover:bg-gray-300 transition-colors font-medium">Zurück</button>
                  <button type="button" class="btn-next bg-medless-primary text-white px-6 py-2 rounded-medless-button hover:bg-medless-primary-dark transition-colors font-medium">Weiter</button>
                </div>
              </div>
              
              <!-- STEP 5: Zusammenfassung (hidden initially) -->
              <div id="step-5" class="form-step hidden">
                <h3 class="text-xl font-semibold mb-4 text-medless-primary">Schritt 5: Zusammenfassung</h3>
                <div class="bg-medless-bg-light rounded-medless-md p-6 space-y-3">
                  <div class="flex justify-between"><span class="font-medium">Name:</span><span id="summary-name" class="text-medless-text-secondary">—</span></div>
                  <div class="flex justify-between"><span class="font-medium">Alter:</span><span id="summary-age" class="text-medless-text-secondary">—</span></div>
                  <div class="flex justify-between"><span class="font-medium">Gewicht:</span><span id="summary-weight" class="text-medless-text-secondary">—</span></div>
                  <div class="flex justify-between"><span class="font-medium">Leberfunktion:</span><span id="summary-liver" class="text-medless-text-secondary">—</span></div>
                  <div class="flex justify-between"><span class="font-medium">Nierenfunktion:</span><span id="summary-kidney" class="text-medless-text-secondary">—</span></div>
                  <div class="flex justify-between"><span class="font-medium">Medikamente:</span><span id="summary-medications" class="text-medless-text-secondary">—</span></div>
                  <div class="flex justify-between"><span class="font-medium">Zieldauer:</span><span id="summary-duration" class="text-medless-text-secondary">—</span></div>
                  <div class="flex justify-between"><span class="font-medium">Reduktion:</span><span id="summary-reduction" class="text-medless-text-secondary">—</span></div>
                </div>
                <div class="mt-6">
                  <label class="block text-sm font-medium mb-2">E-Mail (Pflichtfeld für Plan-Erstellung)</label>
                  <input type="email" id="email-input" name="email" placeholder="ihre@email.de" class="w-full border border-medless-border-light rounded-medless-button px-4 py-2 focus:outline-none focus:ring-2 focus:ring-medless-primary focus:border-medless-primary transition-colors" required />
                  <p class="text-xs text-medless-text-secondary mt-1">Sie erhalten Ihren Orientierungsplan per E-Mail</p>
                </div>
                <div class="mt-6 flex justify-between">
                  <button type="button" class="btn-prev bg-gray-200 text-medless-text-primary px-6 py-2 rounded-medless-button hover:bg-gray-300 transition-colors font-medium">Zurück</button>
                  <button type="button" id="create-plan-btn" class="bg-medless-primary text-white px-6 py-2 rounded-medless-button hover:bg-medless-primary-dark transition-colors shadow-medless-button font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled>Plan erstellen & PDF herunterladen</button>
                </div>
              </div>
              
            </form>
            
            <!-- LOADING/RESULTS SECTION (for PDF generation) -->
            <div id="loading" class="hidden text-center py-12">
              <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-medless-primary mx-auto mb-4"></div>
              <h3 class="text-xl font-semibold text-medless-primary mb-6">KI-Analyse läuft...</h3>
              
              <!-- 3-Step AI Loading Animation -->
              <div class="max-w-md mx-auto space-y-4">
                <div id="ki-step-1" class="flex items-center gap-3 p-3 bg-medless-bg-light rounded-medless-md">
                  <div class="w-6 h-6 rounded-full bg-medless-primary flex items-center justify-center text-white text-sm font-semibold">1</div>
                  <span class="text-sm text-medless-text-secondary">Medikamente analysieren...</span>
                  <div class="ml-auto"><div class="animate-spin h-4 w-4 border-2 border-medless-primary border-t-transparent rounded-full"></div></div>
                </div>
                <div id="ki-step-2" class="flex items-center gap-3 p-3 bg-gray-100 rounded-medless-md opacity-50">
                  <div class="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">2</div>
                  <span class="text-sm text-gray-500">Wechselwirkungen prüfen...</span>
                </div>
                <div id="ki-step-3" class="flex items-center gap-3 p-3 bg-gray-100 rounded-medless-md opacity-50">
                  <div class="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">3</div>
                  <span class="text-sm text-gray-500">Reduktionsplan erstellen...</span>
                </div>
              </div>
              
              <div id="particles-container" class="mt-8"></div>
            </div>
            
            <div id="results" class="hidden">
              <div class="text-center py-8">
                <div class="text-6xl mb-4">✅</div>
                <h3 class="text-2xl font-bold text-medless-primary mb-4">Ihr Plan ist fertig!</h3>
                <p class="text-medless-text-secondary mb-6">Wählen Sie unten, welche PDFs Sie herunterladen möchten.</p>
                <div id="plan-ready-animations"></div>
              </div>
            </div>

            <!-- PDF Download Modal -->
            <div id="pdf-download-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="display: none;">
              <div class="bg-white rounded-medless-lg shadow-medless-card p-8 max-w-md w-full mx-4">
                <div class="text-center mb-6">
                  <div class="text-5xl mb-4">📄</div>
                  <h3 class="text-2xl font-bold text-medless-primary mb-2">Ihr Plan ist fertig!</h3>
                  <p class="text-medless-text-secondary">Laden Sie den gewünschten Plan herunter:</p>
                </div>
                
                <div class="space-y-3 mb-6">
                  <button id="download-patient-btn" class="btn-medless-primary w-full py-3 px-6 text-lg font-semibold rounded-medless-md shadow-medless-button hover:shadow-medless-button-hover transition-all duration-200">
                    <span class="mr-2">👤</span> Patientenplan herunterladen
                  </button>
                  
                  <button id="download-doctor-btn" class="btn-medless-primary w-full py-3 px-6 text-lg font-semibold rounded-medless-md shadow-medless-button hover:shadow-medless-button-hover transition-all duration-200">
                    <span class="mr-2">🩺</span> Ärzteplan herunterladen
                  </button>
                </div>
                
                <div id="pdf-modal-error" class="hidden mt-4 p-3 bg-red-50 border border-red-200 rounded-medless-md">
                  <p class="text-red-700 text-sm"></p>
                </div>
                
                <button id="close-modal-btn" class="mt-4 text-medless-text-secondary text-sm hover:text-medless-primary transition-colors w-full">
                  Schließen
                </button>
              </div>
            </div>
            
          </section>
          
        </div>
      </main>
      
      <!-- External Resources -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
      
      <!-- Wizard Logic -->
      <script src="/static/app.js"></script>
      
    </body>
    </html>
  `);
})




// Explicitly return 404 for removed demo/showcase routes

app.get('/app-original', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Medless – Strukturierte Orientierungshilfe für dein Arztgespräch. Kostenlose Medikamentenanalyse als PDF-Orientierungsplan.">
  <title>MEDLESS-Orientierungsplan erstellen</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="shortcut icon" href="/favicon.png">
  <link rel="apple-touch-icon" href="/favicon.png">
  
  <!-- Google Fonts - Inter (Fresh & Fine Design) -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap" rel="stylesheet">
  
  <!-- CRITICAL CSS FALLBACK - Always visible -->
  <style>
    /* Emergency fallback to ensure content is ALWAYS visible */
    body {
      background-color: #FAFEFB !important; /* light green background */
      color: #111111 !important;            /* dark text */
      min-height: 100vh;
    }
    main {
      min-height: 100vh;
      display: block !important;
    }
    #tool {
      background: white !important;
      padding: 20px !important;
      display: block !important;
    }
    .form-step {
      display: block !important;
    }
  </style>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    // ✅ MEDLESS Design System - Canonical Config
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'medless-primary': '#2FB585',
            'medless-primary-dark': '#1B9C6E',
            'medless-primary-light': '#36C48C',
            'medless-bg-ultra-light': '#FAFEFB',
            'medless-bg-light': '#F4FBF7',
            'medless-bg-card': '#E7F8EF',
            'medless-bg-card-hover': '#D4F1E3',
            'medless-text-primary': '#1B2A36',
            'medless-text-secondary': '#5E6A71',
            'medless-text-tertiary': '#94A3B8',
            'medless-border-light': '#E9ECEF',
            'medless-border-primary': 'rgba(47, 181, 133, 0.2)',
            'medless-border-shadow': 'rgba(0, 0, 0, 0.05)',
          },
          fontSize: {
            'button-text': ['16px', { lineHeight: '1.5', fontWeight: '600' }],
          },
          borderRadius: {
            'medless-sm': '6px',
            'medless-md': '12px',
            'medless-lg': '16px',
            'medless-xl': '20px',
            'medless-button': '10px',
          },
          boxShadow: {
            'medless-card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
            'medless-card-hover': '0 8px 16px rgba(0, 0, 0, 0.12)',
            'medless-button': '0 2px 6px rgba(47, 181, 133, 0.15)',
            'medless-button-hover': '0 4px 12px rgba(47, 181, 133, 0.25)',
            'medless-header': '0 1px 2px rgba(0, 0, 0, 0.04)',
          },
          maxWidth: {
            'container': '1400px',
          },
          transitionDuration: {
            'medless': '250ms',
          },
          transitionTimingFunction: {
            'medless': 'cubic-bezier(0.4, 0, 0.2, 1)',
          }
        }
      }
    }
  </script>
  
  <!-- jsPDF for PDF Generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <!-- Axios for API calls -->
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    :root {
      --primary: #2FB585;
      --primary-dark: #28A376;
      --primary-light: #E7F8EF;
      --bg: #FBFCFD;
      --text: #1B2A36;
      --text-secondary: #5E6A71;
      --text-tertiary: #94A3B8;
      --border: rgba(0, 0, 0, 0.06);
      --accent: #f97316;
      --danger: #b91c1c;
      --radius-lg: 16px;
      --radius-md: 12px;
      --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    * {
      box-sizing: border-box;
    }

    a {
      color: var(--primary);
      text-decoration: none;
    }

    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #FAFEFB; /* medless-bg-ultra-light fallback */
      font-family: 'Inter', sans-serif;
    }

    main {
      flex-grow: 1;
      background-color: #FAFEFB; /* medless-bg-ultra-light */
      min-height: calc(100vh - 200px);
    }
    
    main > div {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
    }
    
    @media (max-width: 768px) {
      main > div {
        padding: 1.5rem 1rem;
      }
    }

    /* WIZARD CARD - CRITICAL STYLES */
    #tool {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
      padding: 1.5rem 1rem;
      margin-top: 2rem;
    }
    
    @media (min-width: 768px) {
      #tool {
        padding: 2rem 2rem;
      }
    }

    /* HERO - MEDLESS STYLE */
    .hero {
      margin-top: 1.5rem;
      padding: 2rem 1.75rem;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(47, 181, 133, 0.03), rgba(47, 181, 133, 0.08));
      border: 1px solid var(--border);
      box-shadow: var(--shadow-soft);
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: var(--primary-light);
      color: var(--primary-dark);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .hero h1 {
      margin: 0 0 0.75rem;
      font-size: 2rem;
      font-weight: 600;
      line-height: 1.2;
      color: var(--text);
    }

    .hero-sub {
      margin: 0 0 1.25rem;
      font-size: 1.125rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .hero-grid {
      display: grid;
      gap: 1rem;
      margin-top: 1.25rem;
    }

    .hero-list {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--text);
    }

    .hero-list li + li {
      margin-top: 0.375rem;
    }

    .hero-cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      margin-top: 1.25rem;
    }
    
    @media (max-width: 768px) {
      .hero {
        padding: 1.5rem 1.25rem;
      }
      
      .hero h1 {
        font-size: 1.75rem;
      }
      
      .hero-sub {
        font-size: 1rem;
      }
    }

    .btn-primary {
      border: none;
      cursor: pointer;
      padding: 0.75rem 1.75rem;
      border-radius: var(--radius-md);
      background: var(--primary);
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(47, 181, 133, 0.15);
      transition: all 280ms ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(47, 181, 133, 0.25);
      background: var(--primary-dark);
    }

    .btn-secondary {
      border-radius: var(--radius-md);
      border: 2px solid var(--primary);
      padding: 0.75rem 1.75rem;
      background: #fff;
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 280ms ease;
    }
    
    .btn-secondary:hover {
      background: rgba(47, 181, 133, 0.05);
      transform: translateY(-1px);
    }
    
    .btn-ghost {
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(148, 163, 184, 0.2);
      padding: 0.75rem 1.5rem;
      background: #fff;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 280ms ease;
    }
    
    .btn-ghost:hover {
      background: var(--bg);
      border-color: var(--primary);
      color: var(--primary);
    }

    .note {
      
      color: #6b7280;
    }

    /* GENERIC SECTIONS */
    section {
      margin-top: 2rem;
    }

    /* H2 styles now handled by Tailwind classes */

    section p {
      margin: 0.3rem 0;
    }

    .muted {
      color: #6b7280;
      
    }

    .grid-3 {
      display: grid;
      gap: 0.9rem;
    }

    .card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.4) inset;
      border-radius: 2rem;
      padding: 2rem;
    }

    /* H3 styles now handled by Tailwind classes */

    .tag-small {
      display: inline-block;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.05);
      
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.3rem;
    }

    /* STEP STRIP */
    .steps {
      display: grid;
      gap: 0.8rem;
      margin-top: 0.7rem;
    }

    .step {
      display: flex;
      gap: 0.7rem;
      align-items: flex-start;
    }

    .step-number {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: rgba(11, 123, 108, 0.1);
      color: var(--primary-dark);
      
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      flex-shrink: 0;
    }

    .step-title {
      font-weight: 500;
      
    }

    .step-text {
      
      color: #4b5563;
    }

    /* TOOL / FORM */
    .tool-wrapper {
      margin-top: 1rem;
      display: grid;
      gap: 1rem;
    }

    .form-card {
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 1rem;
      box-shadow: var(--shadow-soft);
    }
    
    /* CRITICAL: Form steps visibility */
    .form-step {
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      min-height: 400px;
      padding: 1.5rem 0;
    }
    
    .form-step h3 {
      color: #1B2A36;
      font-size: 1.5rem;
      font-weight: 300;
      margin-bottom: 1rem;
    }
    
    /* Buttons must be visible */
    .next-step, .prev-step {
      display: inline-flex !important;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s;
      min-height: 44px;
      background-color: #2FB585;
      color: white;
      border: 1px solid #2FB585;
    }
    
    .next-step:hover {
      background-color: #1B9C6E;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(47, 181, 133, 0.25);
    }
    
    .prev-step {
      background-color: white;
      color: #2FB585;
      border: 2px solid #2FB585;
    }
    
    .prev-step:hover {
      background-color: #E7F8EF;
    }

    .form-card h3 {
      margin-top: 0;
      margin-bottom: 0.6rem;
    }

    .badge-warning {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      background: rgba(185, 28, 28, 0.08);
      color: var(--danger);
      
      margin-bottom: 0.6rem;
    }

    .form-row {
      display: grid;
      gap: 0.7rem;
      margin-bottom: 0.8rem;
    }

    label {
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      display: block;
      margin-bottom: 0.5rem;
    }

    input[type="text"],
    input[type="email"],
    input[type="number"],
    select {
      width: 100%;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      outline: none;
      background: rgba(255, 255, 255, 0.6);
      transition: all 0.2s ease;
    }

    input:focus,
    select:focus {
      border-color: medless-primary;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
      background: rgba(255, 255, 255, 1);
      outline: none;
    }

    .helper {
      
      color: #6b7280;
      margin-top: 0.1rem;
    }

    .inline-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .radio-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      padding: 0.25rem 0.7rem;
      
      cursor: pointer;
      background: #f9fafb;
    }

    .radio-pill input {
      margin: 0;
    }

    .med-row {
      display: grid;
      gap: 0.4rem;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      background: #f9fafb;
      border: 1px dashed #cbd5e1;
    }

    .btn-small {
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      padding: 0.3rem 0.7rem;
      
      background: #fff;
      cursor: pointer;
    }

    .btn-small:hover {
      border-color: #94a3b8;
    }

    .tabs {
      display: inline-flex;
      padding: 0.25rem;
      border-radius: 999px;
      background: #e5e7eb;
      margin-bottom: 0.8rem;
    }

    .tab-btn {
      border: none;
      background: transparent;
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      
      cursor: pointer;
      color: #4b5563;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .tab-btn.active {
      background: #fff;
      color: var(--primary-dark);
      box-shadow: 0 2px 6px rgba(148, 163, 184, 0.6);
    }

    .tab-panel {
      display: none;
    }

    .tab-panel.active {
      display: block;
    }

    .upload-box {
      border-radius: var(--radius-md);
      border: 1px dashed #cbd5e1;
      padding: 0.9rem;
      text-align: center;
      background: #f9fafb;
      
    }

    .upload-box input {
      margin-top: 0.6rem;
    }

    /* FAQ */
    .faq {
      display: grid;
      gap: 0.7rem;
      margin-top: 0.8rem;
    }

    details {
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 0.6rem 0.8rem;
      box-shadow: var(--shadow-soft);
    }

    summary {
      cursor: pointer;
      list-style: none;
      
      font-weight: 500;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    details[open] summary {
      color: var(--primary-dark);
    }

    details p {
      
      color: #4b5563;
      margin-top: 0.4rem;
    }

    /* Autocomplete Styles */
    .medication-input-wrapper {
      position: relative;
      margin-bottom: 1rem;
    }
    
    .autocomplete-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
      max-height: 250px;
      overflow-y: auto;
      display: none;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-top: -1px;
    }
    
    .autocomplete-item {
      padding: 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.2s;
    }
    
    .autocomplete-item:hover {
      background: #f9fafb;
    }
    
    .autocomplete-item:last-child {
      border-bottom: none;
    }

    footer {
      margin-top: 2.5rem;
      
      color: #9ca3af;
      text-align: center;
    }

    /* DESKTOP */
    @media (min-width: 768px) {
      main {
        padding: 1.8rem 1.2rem 3rem;
      }

      .hero {
        padding: 1.8rem 2rem;
      }

      .hero h1 {
        
      }

      .hero-grid {
        grid-template-columns: 1.4fr 1.1fr;
        align-items: flex-start;
      }

      .grid-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .tool-wrapper {
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
        align-items: flex-start;
      }
    }
  </style>
  
  <!-- FontAwesome für Loading-Animation -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <style>
    /* Zusätzliche Tailwind-kompatible Styles */
    .section-card {
      background: white;
      border-left: 4px solid medless-primary-dark;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
    }
    .hidden { display: none !important; }
    
    /* Remove number input spinner arrows (Chrome, Safari, Edge, Opera) */
    input[type="number"].no-spinner-input::-webkit-outer-spin-button,
    input[type="number"].no-spinner-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    /* Remove number input spinner arrows (Firefox) */
    input[type="number"].no-spinner-input {
      -moz-appearance: textfield;
      appearance: textfield;
    }
    .animate-ping {
      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    @keyframes pulse {
      50% {
        opacity: .5;
      }
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes bounce {
      0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8,0,1,1);
      }
      50% {
        transform: none;
        animation-timing-function: cubic-bezier(0,0,0.2,1);
      }
    }
    @keyframes burst {
      0% { 
        transform: scale(0); 
        opacity: 1; 
      }
      100% { 
        transform: scale(3); 
        opacity: 0; 
      }
    }
    @keyframes float {
      0%, 100% { 
        transform: translateY(0px) translateX(0px); 
        opacity: 0.3;
      }
      50% { 
        transform: translateY(-20px) translateX(10px); 
        opacity: 0.6;
      }
    }
    @keyframes rotate-center {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes pulse-glow {
      0%, 100% { 
        filter: drop-shadow(0 0 8px rgba(11, 123, 108, 0.4));
      }
      50% { 
        filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.8));
      }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes burst-particle {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(calc(var(--tx, 0) * 1px), calc(var(--ty, 0) * 1px)) scale(0);
        opacity: 0;
      }
    }
    @keyframes gentle-pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 8px 24px rgba(11, 123, 108, 0.3);
      }
      50% {
        transform: scale(1.02);
        box-shadow: 0 12px 32px rgba(11, 123, 108, 0.4);
      }
    }
  </style>
</head>
<body class="min-h-screen bg-medless-bg-ultra-light flex flex-col">
  
  ${getCanonicalHeader('app')}

  <!-- MAIN CONTENT - MEDLESS Layout -->
  <main class="flex-grow bg-medless-bg-ultra-light">
    
    <!-- 🚨 DEBUG BLOCK - REMOVE AFTER FIX -->
    <div style="padding: 40px; font-size: 24px; color: #000; background: #ffecb3; border: 3px solid #ff6b00; margin: 20px;">
      🚨 DEBUG: APP-WIZARD CONTENT SOLLTE HIER DARUNTER SICHTBAR SEIN
      <br>
      <span style="font-size: 16px; color: #666;">Wenn Sie diesen gelben Block sehen, ist das Template OK. Wenn nicht, liegt ein Routing-Problem vor.</span>
    </div>
    
    <div class="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14">
      
      <!-- HERO SECTION - MEDLESS STYLE -->
      <header class="mb-8 md:mb-10 text-center">
        <h1 class="text-2xl md:text-3xl font-light text-medless-text-primary mb-2">Ihr persönlicher MEDLESS-Orientierungsplan</h1>
        <p class="text-sm md:text-base text-medless-text-secondary max-w-2xl mx-auto">
          Folgen Sie den Schritten, um Ihre aktuelle Medikation strukturiert zu erfassen und einen persönlichen MEDLESS-Orientierungsplan als Gesprächsgrundlage für Ihren Arzt zu erhalten.
        </p>
      </header>

      <!-- WIZARD CARD -->
      <section id="tool" class="bg-white rounded-medless-lg shadow-medless-card px-4 md:px-8 py-6 md:py-8">

      <!-- Progress Stepper - MEDLESS DESIGN -->
      <!-- MEDLESS STEPPER/PROGRESS INDICATOR (TAILWIND, RESPONSIVE) -->
      <div class="mb-8 mt-0">
        <!-- Desktop: Horizontal Layout (md:grid) | Mobile: Simplified Stack -->
        <div class="hidden md:grid grid-cols-[48px_1fr_48px_1fr_48px_1fr_48px_1fr_48px] items-center max-w-3xl mx-auto mb-2 gap-0">
          <!-- Step 1 Circle -->
          <div id="step-indicator-1" class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-medless-primary text-white font-semibold flex items-center justify-center transition-all duration-300 shadow-lg">
            <i data-lucide="user" class="w-5 h-5"></i>
          </div>
          <!-- Progress Bar 1 -->
          <div class="h-0.5 bg-medless-border-light mx-2">
            <div id="progress-bar-1" class="h-full bg-medless-primary w-full transition-all duration-300"></div>
          </div>
          <!-- Step 2 Circle -->
          <div id="step-indicator-2" class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center transition-all duration-300">
            <i data-lucide="activity" class="w-5 h-5"></i>
          </div>
          <!-- Progress Bar 2 -->
          <div class="h-0.5 bg-medless-border-light mx-2">
            <div id="progress-bar-2" class="h-full bg-medless-primary w-0 transition-all duration-300"></div>
          </div>
          <!-- Step 3 Circle -->
          <div id="step-indicator-3" class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center transition-all duration-300">
            <i data-lucide="pill" class="w-5 h-5"></i>
          </div>
          <!-- Progress Bar 3 -->
          <div class="h-0.5 bg-medless-border-light mx-2">
            <div id="progress-bar-3" class="h-full bg-medless-primary w-0 transition-all duration-300"></div>
          </div>
          <!-- Step 4 Circle -->
          <div id="step-indicator-4" class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center transition-all duration-300">
            <i data-lucide="file-text" class="w-5 h-5"></i>
          </div>
          <!-- Progress Bar 4 -->
          <div class="h-0.5 bg-medless-border-light mx-2">
            <div id="progress-bar-4" class="h-full bg-medless-primary w-0 transition-all duration-300"></div>
          </div>
          <!-- Step 5 Circle -->
          <div id="step-indicator-5" class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center transition-all duration-300">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
        </div>
        
        <!-- Desktop Labels -->
        <div class="hidden md:grid grid-cols-[48px_1fr_48px_1fr_48px_1fr_48px_1fr_48px] max-w-3xl mx-auto gap-0">
          <span class="text-xs font-medium text-medless-text-tertiary text-center leading-tight">Name</span>
          <span></span>
          <span class="text-xs font-medium text-medless-text-tertiary text-center leading-tight">Körper</span>
          <span></span>
          <span class="text-xs font-medium text-medless-text-tertiary text-center leading-tight">Medikation</span>
          <span></span>
          <span class="text-xs font-medium text-medless-text-tertiary text-center leading-tight">Plan</span>
          <span></span>
          <span class="text-xs font-medium text-medless-text-tertiary text-center leading-tight">Zusammen-fassung</span>
        </div>

        <!-- Mobile: Vertical Stack -->
        <div class="md:hidden flex flex-col gap-3">
          <!-- Step 1 -->
          <div class="flex items-center gap-2 md:gap-3">
            <div class="w-10 h-10 rounded-full bg-medless-primary text-white font-semibold flex items-center justify-center shadow-md">
              <i data-lucide="user" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-medless-text-tertiary tracking-wide">Schritt 1</p>
              <p class="text-sm text-medless-text-primary font-medium">Name</p>
            </div>
          </div>
          <!-- Step 2 -->
          <div class="flex items-center gap-3 opacity-50">
            <div class="w-10 h-10 rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center">
              <i data-lucide="activity" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-medless-text-tertiary tracking-wide">Schritt 2</p>
              <p class="text-sm text-medless-text-secondary">Körperdaten</p>
            </div>
          </div>
          <!-- Step 3 -->
          <div class="flex items-center gap-3 opacity-50">
            <div class="w-10 h-10 rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center">
              <i data-lucide="pill" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-medless-text-tertiary tracking-wide">Schritt 3</p>
              <p class="text-sm text-medless-text-secondary">Medikation</p>
            </div>
          </div>
          <!-- Step 4 -->
          <div class="flex items-center gap-3 opacity-50">
            <div class="w-10 h-10 rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center">
              <i data-lucide="file-text" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-medless-text-tertiary tracking-wide">Schritt 4</p>
              <p class="text-sm text-medless-text-secondary">Orientierungsplan</p>
            </div>
          </div>
          <!-- Step 5 -->
          <div class="flex items-center gap-3 opacity-50">
            <div class="w-10 h-10 rounded-full bg-white border-2 border-medless-border-light text-medless-text-tertiary font-semibold flex items-center justify-center">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-medless-text-tertiary tracking-wide">Schritt 5</p>
              <p class="text-sm text-medless-text-secondary">Zusammenfassung</p>
            </div>
      </div>

      <form id="medication-form">
        <!-- STEP 1: Name & Gender & Body Data -->
        <div id="step-1" class="form-step">
            <h3 class="text-2xl md:text-3xl font-light text-slate-900" style="margin-bottom: 0.5rem;">Schritt 1: Persönliche Angaben</h3>
            <p class="text-slate-500 font-light text-sm" style="margin-bottom: 1.5rem;">Damit wir Sie persönlich ansprechen können.</p>
            
            <div class="mb-6">
              <div>
                <label for="first-name" class="block text-sm font-medium text-medless-text-primary mb-1.5">Ihr Vorname *</label>
                <input 
                  type="text" 
                  id="first-name" 
                  name="first_name" 
                  class="w-full rounded-medless-md border border-medless-border-light px-3 py-2.5 text-sm md:text-base text-medless-text-primary placeholder:text-medless-text-tertiary focus:outline-none focus:ring-2 focus:ring-medless-primary/40 focus:border-medless-primary bg-white transition-all duration-200" 
                  placeholder="z.B. Maria" 
                  required 
                />
              </div>
            </div>

            <!-- Geschlecht (MEDLESS DESIGN) -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-medless-text-primary mb-1.5">Geschlecht *</label>
              <div class="grid grid-cols-3 gap-4">
                <!-- Option 1: Männlich -->
                <label class="cursor-pointer">
                  <input type="radio" name="gender" value="male" class="peer sr-only" required>
                  <div class="peer-checked:bg-medless-bg-card peer-checked:border-medless-primary peer-checked:text-medless-primary 
                              border-2 border-medless-border-light rounded-medless-md p-4 text-center transition-all duration-200
                              hover:border-medless-primary/40 hover:shadow-sm bg-white">
                    <span class="font-medium">Männlich</span>
                  </div>
                </label>
                
                <!-- Option 2: Weiblich -->
                <label class="cursor-pointer">
                  <input type="radio" name="gender" value="female" class="peer sr-only" required>
                  <div class="peer-checked:bg-medless-bg-card peer-checked:border-medless-primary peer-checked:text-medless-primary 
                              border-2 border-medless-border-light rounded-medless-md p-4 text-center transition-all duration-200
                              hover:border-medless-primary/40 hover:shadow-sm bg-white">
                    <span class="font-medium">Weiblich</span>
                  </div>
                </label>
              </div>
            </div>

            <div style="text-align: right; margin-top: 1.5rem;">
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-white bg-medless-primary border border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary-dark hover:-translate-y-0.5 hover:shadow-medless-button-hover min-h-[44px] next-step">
                <span>Weiter</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </div>

        <!-- STEP 2: Body Data (glass-input auf Feldern) -->
        <div id="step-2" class="form-step" style="display: none;">
          <h3 class="text-2xl md:text-3xl font-light text-slate-900" style="margin-bottom: 0.5rem;">Schritt 2: Körperdaten</h3>
            <p class="text-slate-500 font-light text-sm" style="margin-bottom: 1.5rem;">Diese Daten helfen uns, die Dosierung individuell zu berechnen.</p>
            
            <!-- Körperdaten (MEDLESS DESIGN) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Alter -->
              <div>
                <label class="block text-sm font-medium text-medless-text-primary mb-1.5 text-center">
                  Alter (Jahre) *
                </label>
                <input 
                  type="text" 
                  inputmode="numeric" 
                  pattern="[0-9]*" 
                  name="age" 
                  class="w-full rounded-medless-md border border-medless-border-light px-3 py-2.5 text-center text-lg text-medless-text-primary placeholder:text-medless-text-tertiary focus:outline-none focus:ring-2 focus:ring-medless-primary/40 focus:border-medless-primary bg-white transition-all duration-200" 
                  placeholder="z.B. 45" 
                  required
                >
              </div>
              
              <!-- Größe -->
              <div>
                <label class="block text-sm font-medium text-medless-text-primary mb-1.5 text-center">
                  Größe (cm) *
                </label>
                <input 
                  type="text" 
                  inputmode="numeric" 
                  pattern="[0-9]*" 
                  name="height" 
                  class="w-full rounded-medless-md border border-medless-border-light px-3 py-2.5 text-center text-lg text-medless-text-primary placeholder:text-medless-text-tertiary focus:outline-none focus:ring-2 focus:ring-medless-primary/40 focus:border-medless-primary bg-white transition-all duration-200" 
                  placeholder="z.B. 170" 
                  required
                >
              </div>
              
              <!-- Gewicht -->
              <div>
                <label class="block text-sm font-medium text-medless-text-primary mb-1.5 text-center">
                  Gewicht (kg) *
                </label>
                <input 
                  type="text" 
                  inputmode="numeric" 
                  pattern="[0-9]*" 
                  name="weight" 
                  class="w-full rounded-medless-md border border-medless-border-light px-3 py-2.5 text-center text-lg text-medless-text-primary placeholder:text-medless-text-tertiary focus:outline-none focus:ring-2 focus:ring-medless-primary/40 focus:border-medless-primary bg-white transition-all duration-200" 
                  placeholder="z.B. 70" 
                  required
                >
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-medless-text-secondary bg-white border border-medless-border-light rounded-medless-button transition-all duration-medless hover:bg-medless-bg-ultra-light hover:border-medless-primary/40 min-h-[44px] prev-step">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>Zurück</span>
              </button>
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-white bg-medless-primary border border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary-dark hover:-translate-y-0.5 hover:shadow-medless-button-hover min-h-[44px] next-step">
                <span>Weiter</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </div>

        <!-- STEP 3: Medications (Empty State) -->
        <div id="step-3" class="form-step" style="display: none;">
          <h3 class="text-2xl md:text-3xl font-light text-slate-900" style="margin-bottom: 0.5rem;">Schritt 3: Ihre Medikation</h3>
            <p class="text-slate-500 font-light text-sm" style="margin-bottom: 1.5rem;">Geben Sie hier Ihre aktuellen Medikamente ein. Diese Daten werden genutzt, um einen strukturierten Überblick und einen MEDLESS-Orientierungsplan für Ihr Arztgespräch zu erstellen. Es werden keine Therapieempfehlungen berechnet.</p>
            
            <!-- Info Box -->
            <div class="mb-6 rounded-medless-md bg-medless-bg-card border border-medless-border-light px-4 py-3 text-sm text-medless-text-secondary">
              <p>
                Gib hier deine aktuellen Medikamente ein. Diese Daten werden in deinen MEDLESS-Orientierungsplan übernommen. Du kannst jederzeit weitere Medikamente hinzufügen.
              </p>
            </div>

            <div class="space-y-4 mb-8">
              <!-- MEDIKATIONS-LISTE (Wird per JS gefüllt, erste Card wird automatisch erstellt) -->
              <div id="medication-inputs" class="space-y-3">
                <!-- Wird durch JavaScript befüllt -->
              </div>

              <button type="button" id="add-medication" class="w-full py-4 rounded-medless-md border-2 border-dashed border-medless-border-light text-medless-text-tertiary text-sm font-medium hover:border-medless-primary hover:text-medless-primary hover:bg-medless-bg-ultra-light transition-all duration-medless inline-flex items-center justify-center gap-2">
                <i data-lucide="plus" class="w-5 h-5"></i>
                <span>Weiteres Medikament hinzufügen</span>
              </button>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-medless-text-secondary bg-white border border-medless-border-light rounded-medless-button transition-all duration-medless hover:bg-medless-bg-ultra-light hover:border-medless-primary/40 min-h-[44px] prev-step">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>Zurück</span>
              </button>
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-white bg-medless-primary border border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary-dark hover:-translate-y-0.5 hover:shadow-medless-button-hover min-h-[44px] next-step">
                <span>Weiter</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </div>

        <!-- STEP 4: Plan Settings -->
        <div id="step-4" class="form-step" style="display: none;">
          <h3 class="text-2xl md:text-3xl font-light text-slate-900" style="margin-bottom: 0.5rem;">Schritt 4: Orientierungsplan-Einstellungen</h3>
            <p class="text-slate-500 font-light text-sm" style="margin-bottom: 1.5rem;">Legen Sie hier die Einstellungen für Ihren MEDLESS-Orientierungsplan fest. Auf dieser Basis wird Ihr persönlicher Orientierungsplan für das Gespräch mit Ihrem Arzt berechnet. Alle medizinischen Entscheidungen trifft ausschließlich Ihr Arzt.</p>
            
            <!-- Dauer V4 (Fully Clickable Cards) -->
            <div class="mb-10">
              <label class="block text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium text-center">
                Dauer des Plans (Wochen) *
              </label>
              <div class="grid grid-cols-5 gap-3">
                <!-- 2 Wochen -->
                <label class="cursor-pointer">
                  <input type="radio" name="duration" value="2" class="peer sr-only" required>
                  <div class="peer-checked:bg-[medless-bg-card] peer-checked:border-[medless-primary] peer-checked:text-[medless-primary] peer-checked:font-semibold 
                              border-2 border-slate-200 rounded-2xl py-4 text-center transition-all duration-200
                              hover:border-slate-300 hover:shadow-sm">
                    <span class="text-2xl">2</span>
                  </div>
                </label>
                
                <!-- 4 Wochen -->
                <label class="cursor-pointer">
                  <input type="radio" name="duration" value="4" class="peer sr-only text-sm py-2.5 px-3">
                  <div class="peer-checked:bg-[medless-bg-card] peer-checked:border-[medless-primary] peer-checked:text-[medless-primary] peer-checked:font-semibold 
                              border-2 border-slate-200 rounded-2xl py-4 text-center transition-all duration-200
                              hover:border-slate-300 hover:shadow-sm">
                    <span class="text-2xl">4</span>
                  </div>
                </label>
                
                <!-- 6 Wochen -->
                <label class="cursor-pointer">
                  <input type="radio" name="duration" value="6" class="peer sr-only text-sm py-2.5 px-3">
                  <div class="peer-checked:bg-[medless-bg-card] peer-checked:border-[medless-primary] peer-checked:text-[medless-primary] peer-checked:font-semibold 
                              border-2 border-slate-200 rounded-2xl py-4 text-center transition-all duration-200
                              hover:border-slate-300 hover:shadow-sm">
                    <span class="text-2xl">6</span>
                  </div>
                </label>
                
                <!-- 8 Wochen (Default) -->
                <label class="cursor-pointer">
                  <input type="radio" name="duration" value="8" class="peer sr-only" checked>
                  <div class="peer-checked:bg-[medless-bg-card] peer-checked:border-[medless-primary] peer-checked:text-[medless-primary] peer-checked:font-semibold 
                              border-2 border-slate-200 rounded-2xl py-4 text-center transition-all duration-200
                              hover:border-slate-300 hover:shadow-sm">
                    <span class="text-2xl">8</span>
                  </div>
                </label>
                
                <!-- 12 Wochen -->
                <label class="cursor-pointer">
                  <input type="radio" name="duration" value="12" class="peer sr-only text-sm py-2.5 px-3">
                  <div class="peer-checked:bg-[medless-bg-card] peer-checked:border-[medless-primary] peer-checked:text-[medless-primary] peer-checked:font-semibold 
                              border-2 border-slate-200 rounded-2xl py-4 text-center transition-all duration-200
                              hover:border-slate-300 hover:shadow-sm">
                    <span class="text-2xl">12</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- REDUCTION SLIDER V4 (Clear Labels + Info Box) -->
            <div class="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 bg-[medless-bg-card] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-[medless-primary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
                <div class="flex-grow">
                  <h4 class="font-semibold text-slate-800 text-lg mb-1">Reduktionsziel</h4>
                  <p class="text-sm text-slate-500">Wie stark möchten Sie Ihre Medikation reduzieren?</p>
                </div>
                <div class="text-right">
                  <div class="text-4xl font-light text-[medless-primary]" id="reductionValue">100%</div>
                  <p class="text-xs text-slate-400 uppercase tracking-wide mt-1">Ziel-Dosis</p>
                </div>
              </div>
              
              <!-- Slider -->
              <div class="relative px-2 mb-6">
                <input type="range" name="reduction" min="10" max="100" value="100" step="10" 
                       class="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[medless-primary] 
                              [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white
                              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                       oninput="document.getElementById('reductionValue').innerText = this.value + '%'">
              </div>
              
              <!-- Labels mit Klarstellung -->
              <div class="flex justify-between text-xs text-slate-400 font-medium px-1">
                <div class="text-center">
                  <div class="font-semibold text-slate-600">10%</div>
                  <div class="text-[10px] mt-1">Minimale Reduktion</div>
                </div>
                <div class="text-center">
                  <div class="font-semibold text-slate-600">50%</div>
                  <div class="text-[10px] mt-1">Halbe Dosis</div>
                </div>
                <div class="text-center">
                  <div class="font-semibold text-[medless-primary]">100%</div>
                  <div class="text-[10px] mt-1">Komplette Reduktion</div>
              
              <!-- Info-Box -->
              <div class="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <svg class="w-5 h-5 text-[medless-primary] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-xs text-slate-600">
                  <strong>Hinweis:</strong> 100% bedeutet <strong>komplette Reduktion</strong> der Medikation. 
                  10% bedeutet minimale Reduktion. Bitte besprechen Sie Ihr Ziel mit Ihrem Arzt.
                </p>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-medless-text-secondary bg-white border border-medless-border-light rounded-medless-button transition-all duration-medless hover:bg-medless-bg-ultra-light hover:border-medless-primary/40 min-h-[44px] prev-step">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>Zurück</span>
              </button>
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-white bg-medless-primary border border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary-dark hover:-translate-y-0.5 hover:shadow-medless-button-hover min-h-[44px] next-step">
                <span>Weiter</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </div>

        <!-- STEP 5: Email & Summary -->
        <div id="step-5" class="form-step" style="display: none;">
          <h3 class="text-2xl md:text-3xl font-light text-slate-900" style="margin-bottom: 0.5rem;">Schritt 5: E-Mail & Zusammenfassung</h3>
            <p class="text-slate-500 font-light text-sm" style="margin-bottom: 1.5rem;">Überprüfen Sie Ihre Angaben in Ruhe und geben Sie Ihre E-Mail-Adresse ein. Dorthin senden wir den Download-Link zu Ihrem MEDLESS-Orientierungsplan.</p>
            
            <div class="form-row">
              <div>
                <label for="email">Ihre E-Mail-Adresse *</label>
                <input type="email" id="email" name="email" placeholder="ihre.email@beispiel.de" required />
                <div class="helper">Hierhin schicken wir den Download-Link zu Ihrem Dosierungsplan</div>

            <div class="card" style="background: #f9fafb; margin-top: 1.5rem; padding: 1rem;">
              <h4 style=" font-weight: 500; margin-bottom: 0.8rem;">Ihre Angaben im Überblick</h4>
              <div style="">
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Name:</span>
                  <span id="summary-name" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Geschlecht:</span>
                  <span id="summary-gender" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Alter:</span>
                  <span id="summary-age" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Gewicht:</span>
                  <span id="summary-weight" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Größe:</span>
                  <span id="summary-height" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Medikamente:</span>
                  <span id="summary-medications" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;">
                  <span class="muted">Plan-Dauer:</span>
                  <span id="summary-duration" style="font-weight: 500;">-</span>
                </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-button-text text-medless-text-secondary bg-white border border-medless-border-light rounded-medless-button transition-all duration-medless hover:bg-medless-bg-ultra-light hover:border-medless-primary/40 min-h-[44px] prev-step">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                <span>Zurück</span>
              </button>
              <button type="submit" class="btn-primary">
                Orientierungsplan erstellen <span>✓</span>
              </button>
            </div>
      </form>

      <!-- Loading Animation -->
      <div id="loading" class="hidden" style="margin-top: 1.5rem;">
        <div class="card" style="max-width: 550px; margin: 0 auto; padding: 3rem 1.5rem; text-align: center;">
          
          <!-- Medical AI Loader -->
          <div class="medical-loader">
            <!-- Spektakuläre Medical AI DNA-Helix Scanner Animation (150px) -->
            <div class="medical-dna-scanner">
              <!-- Hexagon Container (pulsating medical grid) -->
              <div class="medical-hexagon-container">
                <!-- Outer Hexagon -->
                <svg class="hexagon hexagon-outer" viewBox="0 0 120 120" width="150" height="150">
                  <polygon points="60,10 100,30 100,70 60,90 20,70 20,30" fill="none" stroke="#15927a" stroke-width="2.5" opacity="0.3"/>
                </svg>
                <!-- Middle Hexagon -->
                <svg class="hexagon hexagon-middle" viewBox="0 0 120 120" width="150" height="150">
                  <polygon points="60,20 90,35 90,65 60,80 30,65 30,35" fill="none" stroke="#14b8a6" stroke-width="2.5" opacity="0.5"/>
                </svg>
                <!-- Inner Hexagon (brightest) -->
                <svg class="hexagon hexagon-inner" viewBox="0 0 120 120" width="150" height="150">
                  <polygon points="60,30 80,40 80,60 60,70 40,60 40,40" fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" stroke-width="3" opacity="0.8"/>
                </svg>
              </div>
              
              <!-- DNA Helix (rotating double-helix with particles) -->
              <div class="medical-helix-container">
                <!-- Left Helix Strand -->
                <div class="helix-strand helix-left"></div>
                <!-- Right Helix Strand -->
                <div class="helix-strand helix-right"></div>
                
                <!-- Floating Medical Particles -->
                <div class="medical-particle particle-1"></div>
                <div class="medical-particle particle-2"></div>
                <div class="medical-particle particle-3"></div>
                <div class="medical-particle particle-4"></div>
              </div>
              
              <!-- Center Glow Pulse -->
              <div class="medical-center-glow"></div>
            </div>
            
            <h2 class="plan-loader-title">Ihr MEDLESS-Orientierungsplan wird erstellt …</h2>
            <p class="plan-loader-subtitle">
              Bitte haben Sie einen Moment Geduld. Ihr Orientierungsplan wird anhand Ihrer Angaben berechnet und als PDF vorbereitet.
            </p>
            
            <!-- Medical Analysis Pipeline with Premium Card Design -->
            <div class="plan-loader-pipeline">
              <!-- Step 1: Medication Analysis -->
              <div class="plan-loader-step step-1">
                <div class="step-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <path d="M9.5 2.5L14.5 7.5L9.5 12.5L4.5 7.5L9.5 2.5Z" fill="currentColor" opacity="0.3"/>
                    <path d="M14.5 11.5L19.5 16.5L14.5 21.5L9.5 16.5L14.5 11.5Z" fill="currentColor"/>
                    <path d="M9.5 2.5L14.5 7.5M14.5 7.5L9.5 12.5M14.5 7.5L19.5 16.5M9.5 12.5L4.5 7.5M9.5 12.5L14.5 11.5M4.5 7.5L9.5 2.5M14.5 11.5L9.5 16.5M14.5 11.5L19.5 16.5M9.5 16.5L14.5 21.5M19.5 16.5L14.5 21.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="step-text">
                  <div class="step-title">
                    Medikamente werden analysiert …
                    <span class="step-counter">0/47</span>
                  </div>
                  <div class="step-subtitle">Wirkstoffe, Dosierung und Einnahmezeiten werden geprüft</div>
                  <div class="step-progress">
                    <div class="step-progress-bar" data-step="1"></div>
                  </div>
                  <div class="step-percentage">0%</div>
              
              <!-- Step 2: Metabolism & Interactions -->
              <div class="plan-loader-step step-2">
                <div class="step-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <path d="M12 3C12 3 8 5.5 8 9C8 11.5 9.5 13 12 13C14.5 13 16 11.5 16 9C16 5.5 12 3 12 3Z" fill="currentColor" opacity="0.3"/>
                    <path d="M12 13C12 13 8 15.5 8 19C8 21.5 9.5 23 12 23C14.5 23 16 21.5 16 19C16 15.5 12 13 12 13Z" fill="currentColor" opacity="0.3"/>
                    <path d="M4 8C4 8 2 10.5 2 13C2 14.5 3 16 4.5 16C6 16 7.5 14.5 7.5 13C7.5 10.5 4 8 4 8Z" fill="currentColor"/>
                    <path d="M20 8C20 8 22 10.5 22 13C22 14.5 21 16 19.5 16C18 16 16.5 14.5 16.5 13C16.5 10.5 20 8 20 8Z" fill="currentColor"/>
                    <path d="M12 3L12 23M8 9C8 9 4 8 4 8M16 9C16 9 20 8 20 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="step-text">
                  <div class="step-title">
                    Stoffwechsel & Wechselwirkungen werden berechnet …
                    <span class="step-counter">0/128</span>
                  </div>
                  <div class="step-subtitle">Leberenzyme und mögliche Interaktionen werden simuliert</div>
                  <div class="step-progress">
                    <div class="step-progress-bar" data-step="2"></div>
                  </div>
                  <div class="step-percentage">0%</div>
              
              <!-- Step 3: Plan Construction -->
              <div class="plan-loader-step step-3">
                <div class="step-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <path d="M3 9H21M9 3V21" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M12 12L17 17M12 17L17 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
                    <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                    <circle cx="6" cy="15" r="1.5" fill="currentColor" opacity="0.7"/>
                    <circle cx="15" cy="6" r="1.5" fill="currentColor" opacity="0.7"/>
                  </svg>
                </div>
                <div class="step-text">
                  <div class="step-title">
                    Orientierungsplan wird konstruiert …
                    <span class="step-counter">0/89</span>
                  </div>
                  <div class="step-subtitle">Ihr persönlicher MEDLESS-Orientierungsplan wird aufgebaut</div>
                  <div class="step-progress">
                    <div class="step-progress-bar" data-step="3"></div>
                  </div>
                  <div class="step-percentage">0%</div>
            </div>
          </div>
          
          
          <!-- Final "Plan ist fertig!" Message (hidden initially) -->
          <div id="plan-ready-message" style="display: none; margin-top: 1rem;">
            <div id="plan-ready-card" style="background: linear-gradient(135deg, medless-primary-dark 0%, medless-primary-dark 100%); padding: 1.5rem; border-radius: 14px; box-shadow: 0 8px 24px rgba(11, 123, 108, 0.3); text-align: center; animation: gentle-pulse 2s ease-in-out infinite;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <i class="fas fa-file-medical" style="color: white; "></i>
                <h3 style="margin: 0;  font-weight: 300; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Ihr persönlicher MEDLESS-Orientierungsplan ist fertig!</h3>
              </div>
              <p style="margin: 0; color: rgba(255,255,255,0.95);  font-weight: 500; margin-bottom: 1rem;">
                Ihr persönlicher Orientierungsplan wurde erstellt. Er fasst Ihre Angaben zu Medikamenten und Einnahmezeiten übersichtlich zusammen und dient als Grundlage für das Gespräch mit Ihrem Arzt. MEDLESS ersetzt keine ärztliche Beratung und ist kein Medizinprodukt.
              </p>
              <button id="show-plan-button" style="
                background: white;
                color: medless-primary-dark;
                border: none;
                padding: 0.75rem 1.75rem;
                border-radius: 24px;
                
                font-weight: 400;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.6rem;
              " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'">
                <i class="fas fa-eye" style=""></i>
                <span>Plan jetzt anzeigen</span>
              </button>
              <p style="margin: 0.75rem 0 0 0; color: rgba(255,255,255,0.8); ">
                <i class="fas fa-info-circle" style="margin-right: 0.3rem;"></i>
                Klicken Sie auf den Button wenn Sie bereit sind
              </p>
            </div>
      </div>

      <!-- Results -->
          

        </div>
      </div>

      <!-- Results -->
      <div id="results" class="hidden" style="margin-top: 2rem;"></div>
      
      <!-- DNA Scanner Animation Script -->
      <script>
        // Animate DNA Scanner Loader with Counters & Progress Bars
        function animateDNAScanner() {
          console.log('🧬 DNA Scanner Animation started');
          
          // Get all elements
          const step1Counter = document.querySelector('.step-1 .step-counter');
          const step1ProgressBar = document.querySelector('.step-progress-bar[data-step="1"]');
          const step1Percentage = document.querySelector('.step-1 .step-percentage');
          
          const step2Counter = document.querySelector('.step-2 .step-counter');
          const step2ProgressBar = document.querySelector('.step-progress-bar[data-step="2"]');
          const step2Percentage = document.querySelector('.step-2 .step-percentage');
          
          const step3Counter = document.querySelector('.step-3 .step-counter');
          const step3ProgressBar = document.querySelector('.step-progress-bar[data-step="3"]');
          const step3Percentage = document.querySelector('.step-3 .step-percentage');
          
          // Check if all elements exist
          if (!step1Counter || !step1ProgressBar || !step1Percentage) {
            console.warn('⚠️ DNA Scanner elements not found');
            return;
          }
          
          // Animation config: [maxCount, duration, delay]
          const steps = [
            { max: 47, duration: 3500, delay: 600, elements: { counter: step1Counter, bar: step1ProgressBar, percentage: step1Percentage } },   // Step 1: 47 medications
            { max: 128, duration: 4000, delay: 1200, elements: { counter: step2Counter, bar: step2ProgressBar, percentage: step2Percentage } },  // Step 2: 128 interactions
            { max: 89, duration: 3000, delay: 1800, elements: { counter: step3Counter, bar: step3ProgressBar, percentage: step3Percentage } }    // Step 3: 89 calculations
          ];
          
          // Animate each step sequentially
          steps.forEach((step, index) => {
            setTimeout(() => {
              const { max, duration, elements } = step;
              const startTime = Date.now();
              
              // Animation interval
              const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(100, (elapsed / duration) * 100);
                const currentCount = Math.floor((progress / 100) * max);
                
                // Update counter
                if (elements.counter) {
                  elements.counter.textContent = currentCount + '/' + max;
                }
                
                // Update progress bar
                if (elements.bar) {
                  elements.bar.style.width = progress + '%';
                }
                
                // Update percentage
                if (elements.percentage) {
                  elements.percentage.textContent = Math.round(progress) + '%';
                }
                
                // Stop when complete
                if (progress >= 100) {
                  clearInterval(interval);
                  console.log('✅ Step ' + (index + 1) + ' complete: ' + max + '/' + max);
                }
              }, 50); // Update every 50ms for smooth animation
              
            }, step.delay);
          });
        }
        
        // Auto-start animation when loader is visible
        const loadingObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            const loadingEl = document.getElementById('loading');
            if (loadingEl && !loadingEl.classList.contains('hidden')) {
              console.log('🎬 Loader visible - starting DNA Scanner animation');
              animateDNAScanner();
              loadingObserver.disconnect(); // Stop observing after first trigger
            }
          });
        });
        
        // Start observing when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
              loadingObserver.observe(loadingEl, { attributes: true, attributeFilter: ['class'] });
            }
          });
        } else {
          const loadingEl = document.getElementById('loading');
          if (loadingEl) {
            loadingObserver.observe(loadingEl, { attributes: true, attributeFilter: ['class'] });
          }
        }
      </script>
      </section>
    </div>
  </main>

  <script>
    // Tabs umschalten
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        tabButtons.forEach((b) => b.classList.remove("active"));
        tabPanels.forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(target).classList.add("active");
      });
    });

    // Medikamenten-Zeilen dynamisch
    const medList = document.getElementById("med-list");
    const btnAddMed = document.getElementById("btn-add-med");

    function addMedRow() {
      const wrapper = document.createElement("div");
      wrapper.className = "med-row";

      wrapper.innerHTML = \`
        <input type="text" name="medName[]" placeholder="Name des Medikaments" />
        <input type="text" name="medDose[]" placeholder="z. B. 10 mg morgens, 10 mg abends" />
        <button type="button" class="btn-small btn-remove-med">Entfernen</button>
      \`;

      medList.appendChild(wrapper);

      wrapper.querySelector(".btn-remove-med").addEventListener("click", () => {
        medList.removeChild(wrapper);
      });
    }

    if (btnAddMed) {
      btnAddMed.addEventListener("click", addMedRow);
      // mindestens eine Zeile beim Start
      addMedRow();
    }

    // Formulare aktuell nur Demo: hier später API-Aufrufe einbauen
    function handleDemoSubmit(formId) {
      const form = document.getElementById(formId);
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert(
          "Hier kannst du deinen Backend-Aufruf einbauen.\\n\\nAktuell ist dies nur eine Demo-Oberfläche."
        );
      });
    }

    handleDemoSubmit("form-manual");
    handleDemoSubmit("form-photo");
  </script>

  <script>
    // Multi-Step Wizard Navigation
    let currentStep = 1;
    const totalSteps = 5;
    
    function showStep(stepNumber) {
      // Fade-Out current step (150ms)
      const currentStepEl = document.getElementById(\`step-\${currentStep}\`);
      if (currentStepEl && currentStepEl.style.display !== 'none') {
        currentStepEl.style.opacity = '0';
        currentStepEl.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          // Hide all steps after fade-out
          for (let i = 1; i <= totalSteps; i++) {
            const step = document.getElementById(\`step-\${i}\`);
            if (step) step.style.display = 'none';
          }
          
          // Show new step
          const newStepEl = document.getElementById(\`step-\${stepNumber}\`);
          if (newStepEl) {
            newStepEl.style.display = 'block';
            newStepEl.style.opacity = '0';
            newStepEl.style.transform = 'translateY(10px)';
            
            // Fade-In new step (150ms)
            setTimeout(() => {
              newStepEl.style.opacity = '1';
              newStepEl.style.transform = 'translateY(0)';
            }, 10);
          }
          
          // Update progress indicators
          updateProgressBar(stepNumber);
          
          // Update summary if on step 5
          if (stepNumber === 5) {
            updateSummary();
          }
          
          currentStep = stepNumber;
        }, 150);
      } else {
        // Initial load - no animation
        for (let i = 1; i <= totalSteps; i++) {
          const step = document.getElementById(\`step-\${i}\`);
          if (step) step.style.display = 'none';
        }
        
        const newStepEl = document.getElementById(\`step-\${stepNumber}\`);
        if (newStepEl) {
          newStepEl.style.display = 'block';
          newStepEl.style.opacity = '1';
          newStepEl.style.transform = 'translateY(0)';
        }
        
        updateProgressBar(stepNumber);
        currentStep = stepNumber;
      }
    }
    
    // Focus current step with header offset
    function focusCurrentStep(stepEl) {
      if (!stepEl) return;
      
      setTimeout(() => {
        const headerOffset = 80;
        const rect = stepEl.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        window.scrollTo({
          top: rect.top + scrollTop - headerOffset,
          behavior: 'smooth'
        });
      }, 200); // Wait for fade-in to complete
    }
    
    function updateProgressBar(stepNumber) {
      for (let i = 1; i <= totalSteps; i++) {
        const indicator = document.getElementById(\`step-indicator-\${i}\`);
        const progressBar = document.getElementById(\`progress-bar-\${i}\`);
        
        if (i < stepNumber) {
          // Completed steps - fixed size container, scaled down
          if (indicator) {
            indicator.style.background = 'medless-primary-dark';
            indicator.style.color = 'white';
            indicator.style.fontSize = '1rem';
            indicator.style.transform = 'scale(0.83)';  // 40px visual size
            indicator.style.boxShadow = 'none';
            indicator.innerHTML = '<i class="fas fa-check" style=""></i>';
          }
          if (progressBar) progressBar.style.width = '100%';
        } else if (i === stepNumber) {
          // Current step - fixed size container, full scale
          if (indicator) {
            indicator.style.background = 'linear-gradient(135deg, #1A9C7F, #14b8a6)';
            indicator.style.color = 'white';
            indicator.style.fontSize = '1.1rem';
            indicator.style.fontWeight = '700';
            indicator.style.transform = 'scale(1.0)';  // 48px visual size
            indicator.style.boxShadow = '0 0 0 4px rgba(26, 156, 127, 0.2)';
            indicator.innerHTML = i;
          }
          if (progressBar) progressBar.style.width = '0%';
        } else {
          // Future steps - fixed size container, scaled down
          if (indicator) {
            indicator.style.background = '#e5e7eb';
            indicator.style.color = '#9ca3af';
            indicator.style.fontSize = '0.875rem';
            indicator.style.fontWeight = '500';
            indicator.style.transform = 'scale(0.83)';  // 40px visual size
            indicator.style.boxShadow = 'none';
            indicator.innerHTML = '<i class="fas fa-circle" style=""></i>';
          }
          if (progressBar) progressBar.style.width = '0%';
        }
        
        // Smooth transition only on transform, background, box-shadow
        if (indicator) {
          indicator.style.transition = 'transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease';
        }
      }
    }
    
    function validateStep(stepNumber) {
      if (stepNumber === 1) {
        const firstName = document.getElementById('first-name').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked');
        if (!firstName) {
          alert('Bitte geben Sie Ihren Vornamen ein.');
          return false;
        }
        if (!gender) {
          alert('Bitte wählen Sie Ihr Geschlecht aus.');
          return false;
        }
        return true;
      }
      
      if (stepNumber === 2) {
        const age = document.querySelector('input[name="age"]').value;
        const weight = document.querySelector('input[name="weight"]').value;
        const height = document.querySelector('input[name="height"]').value;
        
        if (!age || age < 18 || age > 120) {
          alert('Bitte geben Sie ein gültiges Alter ein (18-120 Jahre).');
          return false;
        }
        if (!weight || weight < 30 || weight > 300) {
          alert('Bitte geben Sie ein gültiges Gewicht ein (30-300 kg).');
          return false;
        }
        if (!height || height < 100 || height > 250) {
          alert('Bitte geben Sie eine gültige Größe ein (100-250 cm).');
          return false;
        }
        return true;
      }
      
      if (stepNumber === 3) {
        // Check for medication inputs (V4 field names)
        const medicationInputs = document.querySelectorAll('input[name="medication_display[]"]');
        const dosageInputs = document.querySelectorAll('input[name="medication_mg_per_day[]"]');
        
        console.log('WIZARD STEP 3: Found ' + medicationInputs.length + ' medication fields and ' + dosageInputs.length + ' dosage fields');
        
        // REQUIRE at least 1 medication - no skipping allowed
        if (medicationInputs.length === 0) {
          alert('Bitte geben Sie mindestens ein Medikament mit Tagesdosis ein.');
          return false;
        }
        
        let hasValidMedication = false;
        let emptyMedicationName = false;
        let emptyDosage = false;
        
        medicationInputs.forEach((medInput, index) => {
          const medName = medInput.value.trim();
          const dosageValue = dosageInputs[index] ? dosageInputs[index].value.trim() : '';
          
          console.log('WIZARD Med ' + (index + 1) + ': name="' + medName + '", dosage="' + dosageValue + '"');
          
          if (medName && dosageValue) {
            // Both fields filled - valid medication
            hasValidMedication = true;
          } else if (medName && !dosageValue) {
            // Medication name filled but no dosage
            emptyDosage = true;
          } else if (!medName && dosageValue) {
            // Dosage filled but no medication name
            emptyMedicationName = true;
          }
        });
        
        console.log('WIZARD: hasValidMedication = ' + hasValidMedication);
        
        // At least one medication must be valid
        if (!hasValidMedication) {
          alert('Bitte geben Sie mindestens ein Medikament mit Tagesdosis ein.');
          return false;
        }
        
        if (emptyMedicationName) {
          alert('Bitte geben Sie für jede Dosierung auch den Medikamentennamen ein.');
          return false;
        }
        
        if (emptyDosage) {
          alert('Bitte geben Sie für jedes Medikament auch die Tagesdosis in mg ein.');
          return false;
        }
        
        return true;
      }
      
      if (stepNumber === 4) {
        const duration = document.querySelector('input[name="duration"]:checked');
        const reduction = document.querySelector('input[name="reduction"]');
        
        if (!duration) {
          alert('Bitte wählen Sie eine Plan-Dauer aus.');
          return false;
        }
        
        if (!reduction || !reduction.value) {
          alert('Bitte wählen Sie ein Reduktionsziel aus.');
          return false;
        }
        
        return true;
      }
      
      if (stepNumber === 5) {
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email || !emailRegex.test(email)) {
          alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
          return false;
        }
        return true;
      }
      
      return true;
    }
    
    function updateSummary() {
      // Name
      const firstName = document.getElementById('first-name').value.trim();
      document.getElementById('summary-name').textContent = firstName || '-';
      
      // Gender
      const genderInput = document.querySelector('input[name="gender"]:checked');
      const genderText = genderInput ? (genderInput.value === 'female' ? 'Weiblich' : genderInput.value === 'male' ? 'Männlich' : 'Divers') : '-';
      document.getElementById('summary-gender').textContent = genderText;
      
      // Age, Weight, Height
      document.getElementById('summary-age').textContent = document.querySelector('input[name="age"]').value + ' Jahre' || '-';
      document.getElementById('summary-weight').textContent = document.querySelector('input[name="weight"]').value + ' kg' || '-';
      document.getElementById('summary-height').textContent = document.querySelector('input[name="height"]').value + ' cm' || '-';
      
      // Medications
      const medicationInputs = document.querySelectorAll('input[name="medication_name[]"]');
      const medications = [];
      medicationInputs.forEach(input => {
        if (input.value.trim()) {
          medications.push(input.value.trim());
        }
      });
      document.getElementById('summary-medications').textContent = medications.length > 0 ? medications.join(', ') : '-';
      
      // Duration
      const durationRadio = document.querySelector('input[name="duration"]:checked');
      const durationText = durationRadio ? (durationRadio.value + ' Wochen') : '-';
      document.getElementById('summary-duration').textContent = durationText;
    }
    
    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
      // Next buttons
      document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
          if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
              showStep(currentStep + 1);
            }
          }
        });
      });
      
      // Previous buttons
      document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function() {
          if (currentStep > 1) {
            showStep(currentStep - 1);
          }
        });
      });
      
      // Initialize: Show step 1
      showStep(1);
      
      // Initial scroll to wizard (only on first load)
      setTimeout(() => {
        const tool = document.getElementById('tool');
        if (tool) {
          const headerOffset = 80;
          const rect = tool.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({
            top: rect.top + scrollTop - headerOffset,
            behavior: 'smooth'
          });
        }
      }, 100);
      
      // NOTE: Medication input fields are now managed by /static/app.js
      // All medication form logic (autocomplete, validation, dynamic fields) moved to frontend
      
      // ============================================================
      // NACH OBEN BUTTON (FAQ)
      // ============================================================
      const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
      if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      }
    });
  </script>
  
  <!-- Main Application Logic (API Integration, Loading Animation, PDF Generation) -->
  <script src="/static/app.js?v=${Date.now()}"></script>
  
  <!-- Footer with Build Info -->
  ${getCanonicalFooter()}
  
  <script>
    // Fetch and display build info in footer
    (async function loadBuildInfo() {
      try {
        const response = await fetch('/api/build-info');
        if (!response.ok) throw new Error('Build info not available');
        const buildInfo = await response.json();
        const buildDate = new Date(buildInfo.buildTime).toLocaleString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        const shortHash = buildInfo.buildHash.substring(0, 8);
        const shortCommit = buildInfo.commit.substring(0, 7);
        const buildInfoEl = document.getElementById('build-info-tag');
        if (buildInfoEl) {
          buildInfoEl.textContent = \`Build: \${buildDate} | \${shortHash} (\${shortCommit})\`;
        }
      } catch (error) {
        console.warn('Could not load build info:', error);
        const buildInfoEl = document.getElementById('build-info-tag');
        if (buildInfoEl) {
          buildInfoEl.textContent = 'Build info unavailable';
        }
      }
    })();
  </script>
</body>
</html>  `)
})

// Explicitly return 404 for removed demo/showcase routes
app.get('/refactored/*', (c) => {
  return c.notFound()
})

app.get('/demo', (c) => {
  return c.notFound()
})

app.get('/impressum', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Impressum – MEDLESS</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap&subset=latin-ext" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    ${getSharedStyles()}
    .legal-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
    .legal-page h1 {
      
      margin-bottom: var(--space-6);
    }
    .legal-page h2 {
      
      margin-top: var(--space-6);
      margin-bottom: var(--space-4);
    }
    .legal-page p {
      margin-bottom: var(--space-4);
      line-height: 1.7;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--primary-dark-green);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: var(--space-6);
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="legal-page">
    <a href="/" class="back-link">
      <i class="fas fa-arrow-left"></i>
      Zurück zur Startseite
    </a>
    
    <h1>Impressum</h1>
    
    <h2>Angaben gemäß § 5 TMG</h2>
    <p>
      <strong>medless</strong> ist eine Marke der<br>
      <strong>CBD-Vertriebskompetenz GmbH</strong><br>
      Asperngasse 4<br>
      8020 Graz<br>
      Österreich
    </p>
    
    <h2>Kontakt</h2>
    <p>
      Telefon: <a href="tel:+43316931288">+43 316 / 931 288</a><br>
      Fax: 0810/955402-5355<br>
      E-Mail: <a href="mailto:hallo@medless.care">hallo@medless.care</a>
    </p>
    
    <h2>Registereintrag</h2>
    <p>
      UID-Nummer: ATU72762156
    </p>
    
    <h2>Haftungsausschluss</h2>
    <p>
      <strong>Medizinischer Hinweis:</strong> MEDLESS ist ein KI-gestütztes Informationstool und kein Ersatz für ärztlichen Rat, Diagnose oder Behandlung. Alle Berechnungen basieren auf wissenschaftlichen Studien und pharmakologischen Daten, ersetzen jedoch keine individuelle medizinische Beurteilung.
    </p>
    <p>
      <strong>Ändern Sie niemals eigenständig Ihre Medikation.</strong> Jede Anpassung muss mit Ihrem behandelnden Arzt besprochen und überwacht werden.
    </p>
  </div>
</body>
</html>
  `)
})

// Datenschutz page
app.get('/datenschutz', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Datenschutzerklärung – MEDLESS</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap&subset=latin-ext" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    ${getSharedStyles()}
    .legal-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
    .legal-page h1 {
      
      margin-bottom: var(--space-6);
    }
    .legal-page h2 {
      
      margin-top: var(--space-6);
      margin-bottom: var(--space-4);
    }
    .legal-page h3 {
      
      margin-top: var(--space-5);
      margin-bottom: var(--space-3);
    }
    .legal-page p, .legal-page li {
      margin-bottom: var(--space-3);
      line-height: 1.7;
    }
    .legal-page ul {
      padding-left: var(--space-5);
      margin-bottom: var(--space-4);
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--primary-dark-green);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: var(--space-6);
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="legal-page">
    <a href="/" class="back-link">
      <i class="fas fa-arrow-left"></i>
      Zurück zur Startseite
    </a>
    
    <h1>Datenschutzerklärung</h1>
    
    <p>
      Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
    </p>
    
    <h2>Datenerfassung auf dieser Website</h2>
    
    <h3>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h3>
    <p>
      Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber (siehe Impressum).
    </p>
    
    <h3>Wie erfassen wir Ihre Daten?</h3>
    <p>
      Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
    </p>
    
    <h3>Wofür nutzen wir Ihre Daten?</h3>
    <p>
      Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
    </p>
    
    <h3>Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
    <p>Sie haben als Betroffener folgende Rechte:</p>
    <ul>
      <li>gemäß Art. 15 DSGVO das Recht, in dem dort bezeichneten Umfang Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 16 DSGVO das Recht, unverzüglich die Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 17 DSGVO das Recht, die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 18 DSGVO das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 20 DSGVO das Recht, Ihre personenbezogenen Daten, die Sie uns bereitgestellt haben, in einem strukturierten, gängigen und maschinenlesebaren Format zu erhalten;</li>
      <li>gemäß Art. 77 DSGVO das Recht, sich bei einer Aufsichtsbehörde zu beschweren.</li>
    </ul>
    
    <h2>Hosting</h2>
    <p>
      Diese Website wird bei einem externen Dienstleister gehostet (Cloudflare Pages). Personenbezogene Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Webseitenzugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
    </p>
    <p>
      Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
    </p>
    
    <h2>Cookies</h2>
    <p>
      Diese Website benutzt Cookies um eine optimale Erfahrung zu gewährleisten. Diese Cookies werden auf Ihrem Endgerät abgelegt.
    </p>
    
    <h3>Unbedingt nötige Cookies</h3>
    <p>
      Diese Cookies sind unerlässlich, um ein Funktionieren der Website zu ermöglichen. Diese Cookies sind nur zuständig, um Aktionen wie Sprache, Währung, Login Session und andere Cookie-Einstellungen zu ermöglichen. Sie können diese Cookies in Ihrem Browser deaktivieren, dadurch funktioniert unsere Webseite allerdings nicht mehr korrekt.
    </p>
    
    <h3>Analyse & Statistik</h3>
    <p>
      Diese Cookies ermöglichen es uns, statistische Erhebungen durchzuführen, wie z.B. wie viele Besucher sich gerade auf unserer Website befinden und von wo diese kommen. Das hilft uns zu verstehen, welche Produkte populärer sind als andere.
    </p>
    
    <h3>Marketing</h3>
    <p>
      Diese Cookies werden im Regelfall von unseren Werbepartnern benutzt. Sie werden verwendet, um von unseren Website-Benutzern ein Interessensprofil zu erstellen, um personalisierte Werbung zu schalten. Wenn Sie diesen Cookies nicht zustimmen, werden Sie keine persönlich auf Sie zugeschnittene Werbung erhalten.
    </p>
    
    <h2>Kontakt</h2>
    <p>
      Bei Fragen zum Datenschutz kontaktieren Sie uns bitte:<br>
      Telefon: <a href="tel:+43316931288">+43 316 / 931 288</a><br>
      Fax: 0810/955402-5355<br>
      E-Mail: <a href="mailto:hallo@medless.care">hallo@medless.care</a>
    </p>
  </div>
</body>
</html>
  `)
})

// AGB page  
app.get('/agb', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AGB – MEDLESS</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap&subset=latin-ext" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    ${getSharedStyles()}
    .legal-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
    .legal-page h1 {
      
      margin-bottom: var(--space-6);
    }
    .legal-page h2 {
      
      margin-top: var(--space-6);
      margin-bottom: var(--space-4);
    }
    .legal-page p {
      margin-bottom: var(--space-4);
      line-height: 1.7;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--primary-dark-green);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: var(--space-6);
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="legal-page">
    <a href="/" class="back-link">
      <i class="fas fa-arrow-left"></i>
      Zurück zur Startseite
    </a>
    
    <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
    
    <h2>I. Geltung</h2>
    <p>
      Die Lieferungen, Leistungen und Angebote unseres Unternehmens erfolgen ausschließlich aufgrund dieser AGB, und zwar unabhängig von der Art des Rechtsgeschäftes. Sämtliche unserer privatrechtlichen Willenserklärungen sind auf Grundlage dieser AGB zu verstehen. Entgegenstehende oder von unseren AGB abweichende Bedingungen des Kunden erkennen wir nicht an, es sei denn, wir hätten schriftlich und ausdrücklich ihrer Geltung zugestimmt.
    </p>
    
    <h2>II. Vertragsabschluss</h2>
    <p>
      <strong>a)</strong> Unsere Angebote verstehen sich unverbindlich und freibleibend. Von diesen AGB oder anderen unserer schriftlichen Willenserklärungen abweichende mündliche Zusagen, Nebenabreden und dergleichen, insbesondere solche, die von Verkäufern, Zustellern, etc. abgegeben werden, sind für uns nicht verbindlich.
    </p>
    <p>
      <strong>b)</strong> Jeder Auftrag bedarf zum Vertragsabschluss einer Auftragsbestätigung. Das Absenden oder Übergeben der vom Kunden bestellten Ware bewirkt ebenfalls den Vertragsabschluss.
    </p>
    
    <h2>III. Preis</h2>
    <p>
      Alle von uns genannten Preise sind, sofern nichts anderes ausdrücklich vermerkt ist, exklusive Umsatzsteuer zu verstehen. Sollten sich die Lohnkosten zwischen Vertragsabschluss und Lieferung aufgrund kollektivvertraglicher Regelungen in der Branche oder innerbetrieblicher Abschlüsse oder sollten sich andere, für die Kalkulation relevante Kostenstellen verändern, so sind wir berechtigt, die Preise entsprechend zu erhöhen oder zu ermäßigen.
    </p>
    
    <h2>IV. Zahlungsbedingungen, Verzugszinsen</h2>
    <p>
      <strong>a)</strong> Mangels gegenteiliger Vereinbarung sind unsere Forderungen Zug um Zug gegen Übergabe der Ware bar zu bezahlen. Unsere Rechnungen sind ab Warenübernahme zur Zahlung fällig.
    </p>
    <p>
      <strong>b)</strong> Eine Verzinsung von Voraus- oder Akontozahlungen findet nicht statt.
    </p>
    <p>
      <strong>c)</strong> Für den Fall des Zahlungsverzuges sind wir ab Fälligkeit berechtigt, Verzugszinsen in Höhe von 12% per anno zu verrechnen.
    </p>
    
    <h2>X. Erfüllungsort</h2>
    <p>
      Erfüllungsort ist der Sitz unseres Unternehmens in 8020 Graz, Asperngasse 4.
    </p>
    
    <h2>XVIII. Rechtswahl, Gerichtsstand</h2>
    <p>
      Es gilt österreichisches Recht. Die Anwendbarkeit des UN-Kaufrechtes wird ausdrücklich ausgeschlossen. Die Vertragssprache ist deutsch. Zur Entscheidung aller aus diesem Vertrag entstehenden Streitigkeiten ist das sachlich zuständige Gericht für 8020 Graz ausschließlich örtlich zuständig.
    </p>
    
    <h2>XIX. Datenschutz</h2>
    <p>
      Der Kunde erteilt seine Zustimmung, dass auch die im Kaufvertrag mit enthaltenen personenbezogenen Daten in Erfüllung dieses Vertrages von uns automationsunterstützt gespeichert und verarbeitet werden.
    </p>
    
    <p style="margin-top: var(--space-6); padding-top: var(--space-6); border-top: 1px solid var(--border-light);  color: var(--text-muted);">
      Stand: Januar 2025<br>
      CBD-Vertriebskompetenz GmbH<br>
      Asperngasse 4, 8020 Graz
    </p>
  </div>
</body>
</html>
  `)
})

// Helper function to get shared styles
function getSharedStyles() {
  return `
    :root {
      /* MEDLESS Design System - PDF Styles */
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 24px;
      --space-6: 32px;
      --space-7: 48px;
      --space-8: 64px;
      --space-9: 96px;
      --primary: #2FB585;
      --primary-dark: #1B9C6E;
      --primary-light: #E7F8EF;
      --accent-mint: #E7F8EF;
      --accent-mint-light: #FAFEFB;
      --gray-50: #F9FAFB;
      --gray-100: #F3F4F6;
      --gray-200: #E5E7EB;
      --gray-300: #D1D5DB;
      --gray-400: #9CA3AF;
      --gray-500: #6B7280;
      --gray-600: #4B5563;
      --gray-700: #374151;
      --gray-800: #1F2937;
      --gray-900: #111827;
      --background-white: #FFFFFF;
      --background-ultra-light: #FAFEFB;
      --text-body-color: #1B2A36;
      --text-muted: #5E6A71;
      --border-light: #E9ECEF;
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--font-family);
      line-height: 1.6;
      color: var(--text-body-color);
      background: var(--background-white);
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: var(--primary-dark-green);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    
    /* HEADER STYLES (wie Homepage) */
    .header {
      position: sticky;
      top: 0;
      width: 100%;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(16, 185, 129, 0.15);
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
    }
    .header .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 0;
    }
    .logo {
      text-decoration: none;
    }
    .logo-text {
      font-family: 'Inter', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: #0f172a;
    }
    .nav-links {
      display: flex;
      list-style: none;
      gap: 2rem;
      margin: 0;
      padding: 0;
    }
    .nav-links li {
      margin: 0;
    }
    .nav-link {
      text-decoration: none;
      color: #4B5563;
      font-weight: 500;
      font-size: 0.95rem;
      transition: color 0.2s;
    }
    .nav-link:hover {
      color: medless-primary;
    }
    .nav-link.active {
      color: medless-primary;
      font-weight: 600;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 11px 26px;
      background: white;
      color: #2FB585;
      border: 2px solid #2FB585;
      border-radius: 24px;
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .btn-primary:hover {
      background: #2FB585;
      color: white;
      box-shadow: 0 4px 12px rgba(47, 181, 133, 0.25);
      transform: translateY(-1px);
    }
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
    }
  `
}

// ============================================================
// NEUE ROUTE: /fachkreise - Seite für Ärzt:innen & Apotheken
// ============================================================
// Cloudflare Pages serves /fachkreise.html automatically from public/
// No need to define custom route

// ============================================================
// TEST ENDPOINTS: Display Example Reports (HTML only)
// ============================================================
// These endpoints render the example reports with test data
// NO PDF generation - just HTML for visual testing

app.get('/test/doctor-report', async (c) => {
  // Use V3 template with 3-level structure
  const { renderDoctorReportV3Example } = await import('./report_templates_doctor_v3');
  const html = await renderDoctorReportV3Example()
  return c.html(html)
})

app.get('/test/patient-report', (c) => {
  const html = renderPatientPlanExample()
  return c.html(html)
})

// ============================================================
// API ENDPOINT: Build Info
// ============================================================
import { BUILD_INFO } from './build-info.generated'

app.get('/api/build-info', (c) => {
  return c.json(BUILD_INFO)
})

export default app
