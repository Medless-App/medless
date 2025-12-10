import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { buildPatientReportData, buildDoctorReportData } from './report_data'
import { renderDoctorReportHtmlFixed, renderDoctorReportExample } from './report_templates'
import { renderPatientReportHtmlFixed, renderPatientReportExample } from './report_templates_patient'
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
  // Extract and normalize field names (support both API formats)
  const { 
    medications, 
    durationWeeks, 
    reductionGoal = 50, 
    email, 
    firstName, 
    vorname,     // German field name
    gender, 
    geschlecht,  // German field name
    age, 
    alter,       // German field name
    weight, 
    gewicht,     // German field name
    height,
    groesse      // German field name
  } = body;
  
  // ✅ FIX 2: Field Mapping Standardization (firstName takes priority)
  const finalFirstName = firstName || vorname || '';
  const finalGender = geschlecht || gender;
  const finalAge = alter || age;
  const finalWeight = gewicht || weight;
  const finalHeight = groesse || height;
  
  // ✅ FIX 3: Error-Handling für leere Medikamentenliste
  if (!medications || !Array.isArray(medications) || medications.length === 0) {
    throw new Error('Bitte fügen Sie mindestens ein Medikament hinzu.');
  }
  
  if (!durationWeeks || durationWeeks < 1) {
    throw new Error('Bitte geben Sie eine gültige Dauer in Wochen an');
  }
  
  // Normalize medication field names (support both dailyDoseMg and mgPerDay)
  for (const med of medications) {
    const doseMg = med.dailyDoseMg || med.mgPerDay;
    if (!doseMg || isNaN(doseMg) || doseMg <= 0) {
      throw new Error(`Bitte geben Sie eine gültige Tagesdosis in mg für "${med.name}" ein`);
    }
    // Normalize to mgPerDay for internal use
    med.mgPerDay = doseMg;
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
        mgPerDay: med.mgPerDay
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
    const medName = result.medication.name.toLowerCase();
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
        data: doctorData,
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
      const { renderPatientReportExample } = await import('./report_templates_patient');
      const exampleHtml = renderPatientReportExample();
      
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
    const { renderPatientReportExample } = await import('./report_templates_patient');
    const exampleHtml = renderPatientReportExample();
    
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    ${getSharedStyles()}
    .magazine-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-6);
      margin: var(--space-8) 0;
    }
    .article-card {
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      padding: var(--space-6);
      transition: all 0.2s;
    }
    .article-card:hover {
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .article-card h3 {
      
      margin-bottom: var(--space-3);
      color: var(--primary-dark-green);
    }
    .article-card p {
      color: var(--gray-600);
      line-height: 1.6;
      margin-bottom: var(--space-4);
    }
    .article-link {
      color: var(--primary-dark-green);
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .article-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body style="margin: 0; font-family: 'Inter', sans-serif; background: #F9FAFB;">
  
  <!-- HEADER -->
  <header class="header" style="background: white; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; z-index: 100;">
    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 32px;">
      <nav class="nav" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 0;">
        <a href="/" class="logo" style="text-decoration: none;">
          <span class="logo-text" style=" font-weight: 700; color: #0b7b6c;">Medless</span>
        </a>
        <ul class="nav-links" style="display: flex; gap: 32px; list-style: none; margin: 0;">
          <li><a href="/#how-it-works" style="text-decoration: none; color: #4B5563; font-weight: 500;">So funktioniert's</a></li>
          <li><a href="/#benefits" style="text-decoration: none; color: #4B5563; font-weight: 500;">Vorteile</a></li>
          <li><a href="/#faq" style="text-decoration: none; color: #4B5563; font-weight: 500;">FAQ</a></li>
          <li><a href="/magazin" style="text-decoration: none; color: #0b7b6c; font-weight: 600;">Magazin</a></li>
          <li><a href="/fachkreise" style="text-decoration: none; color: #4B5563; font-weight: 500;">Für Ärzt:innen & Apotheken</a></li>
        </ul>
        <button onclick="window.location.href='/app'" style="padding: 12px 24px; background: linear-gradient(135deg, #0E5A45, #10B981); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Orientierungsplan starten</button>
      </nav>
    </div>
  </header>

  <!-- HERO SECTION -->
  <div style="background: linear-gradient(135deg, #0E5A45, #10B981); padding: 80px 32px; text-align: center; color: white;">
    <h1 style="font-weight: 800; margin: 0 0 24px 0;">MEDLESS Magazin</h1>
    <p class="lead" style="max-width: 700px; margin: 0 auto; opacity: 0.95;">Wissenswertes rund um Medikamentenreduktion, das Endocannabinoid-System und natürliche Gesundheit.</p>
  </div>

  <!-- ARTICLES GRID -->
  <div style="max-width: 1200px; margin: 60px auto; padding: 0 32px;">
    <div class="magazine-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 28px;">
      
      <!-- Artikel: ECS erklärt -->
      <article class="magazine-card" style="background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(15, 118, 110, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';">
        <a href="/magazin/endocannabinoid-system-erklaert" style="display: block; text-decoration: none;">
          <img src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=400&fit=crop" alt="Das Endocannabinoid-System erklärt" style="width: 100%; height: 200px; object-fit: cover; display: block;" loading="lazy" />
        </a>
        <div style="padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <span class="caption" style="display: inline-flex; align-items: center; padding: 4px 10px; background: #ECFDF3; color: #15803D; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; width: fit-content;">Wissen & Grundlagen</span>
          <h3 style="font-weight: 700; color: #0F5A46; margin: 0;">
            <a href="/magazin/endocannabinoid-system-erklaert" style="text-decoration: none; color: inherit;">Das Endocannabinoid-System erklärt</a>
          </h3>
          <p style="color: #64748B; margin: 0; flex: 1;">Erfahre, wie dein körpereigenes Schutzschild funktioniert und warum es so wichtig für deine Gesundheit ist.</p>
          <a href="/magazin/endocannabinoid-system-erklaert" style="color: #0F5A46; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; margin-top: 4px;">
            Artikel lesen <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: 7 Fehler -->
      <article class="magazine-card" style="background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(15, 118, 110, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';">
        <a href="/magazin/medikamente-absetzen-7-fehler" style="display: block; text-decoration: none;">
          <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop" alt="7 Fehler beim Medikamente absetzen" style="width: 100%; height: 200px; object-fit: cover; display: block;" loading="lazy" />
        </a>
        <div style="padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <span class="caption" style="display: inline-flex; align-items: center; padding: 4px 10px; background: #FEF2F2; color: #DC2626; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; width: fit-content;">Praxis-Tipps</span>
          <h3 style="font-weight: 700; color: #0F5A46; margin: 0;">
            <a href="/magazin/medikamente-absetzen-7-fehler" style="text-decoration: none; color: inherit;">7 Fehler beim Medikamente absetzen</a>
          </h3>
          <p style="color: #64748B; margin: 0; flex: 1;">Die häufigsten Fehler beim Ausschleichen von Medikamenten und wie du sie vermeidest.</p>
          <a href="/magazin/medikamente-absetzen-7-fehler" style="color: #0F5A46; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; margin-top: 4px;">
            Artikel lesen <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: Antidepressiva -->
      <article class="magazine-card" style="background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(15, 118, 110, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';">
        <a href="/magazin/antidepressiva-absetzen-ohne-entzug" style="display: block; text-decoration: none;">
          <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop" alt="Antidepressiva absetzen ohne Entzug" style="width: 100%; height: 200px; object-fit: cover; display: block;" loading="lazy" />
        </a>
        <div style="padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <span class="caption" style="display: inline-flex; align-items: center; padding: 4px 10px; background: #EEF2FF; color: #4F46E5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; width: fit-content;">Medikamente</span>
          <h3 style="font-weight: 700; color: #0F5A46; margin: 0;">
            <a href="/magazin/antidepressiva-absetzen-ohne-entzug" style="text-decoration: none; color: inherit;">Antidepressiva absetzen ohne Entzug</a>
          </h3>
          <p style="color: #64748B; margin: 0; flex: 1;">Strukturierter Leitfaden für ein sicheres Ausschleichen von Antidepressiva unter ärztlicher Begleitung.</p>
          <a href="/magazin/antidepressiva-absetzen-ohne-entzug" style="color: #0F5A46; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; margin-top: 4px;">
            Artikel lesen <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: Schlaftabletten -->
      <article class="magazine-card" style="background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(15, 118, 110, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';">
        <a href="/magazin/schlaftabletten-loswerden" style="display: block; text-decoration: none;">
          <img src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop" alt="Schlaftabletten loswerden" style="width: 100%; height: 200px; object-fit: cover; display: block;" loading="lazy" />
        </a>
        <div style="padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <span style="display: inline-flex; align-items: center; padding: 4px 10px; background: #EFF6FF; color: #2563EB;  font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; width: fit-content;">Schlaf</span>
          <h3 style=" font-weight: 700; color: #0F5A46; margin: 0; line-height: 1.3;">
            <a href="/magazin/schlaftabletten-loswerden" style="text-decoration: none; color: inherit;">Schlaftabletten loswerden</a>
          </h3>
          <p style="color: #64748B; line-height: 1.6; margin: 0;  flex: 1;">Wie du dich schrittweise von Schlafmitteln lösen und zu natürlichem Schlaf zurückfinden kannst.</p>
          <a href="/magazin/schlaftabletten-loswerden" style="color: #0F5A46; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;  margin-top: 4px;">
            Artikel lesen <i class="fas fa-arrow-right" style=""></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: CBD Studien -->
      <article class="magazine-card" style="background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(15, 118, 110, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';">
        <a href="/magazin/cbd-studien-und-fakten" style="display: block; text-decoration: none;">
          <img src="https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop" alt="CBD: Studien und Fakten" style="width: 100%; height: 200px; object-fit: cover; display: block;" loading="lazy" />
        </a>
        <div style="padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <span style="display: inline-flex; align-items: center; padding: 4px 10px; background: #D1FAE5; color: #059669;  font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; width: fit-content;">Forschung</span>
          <h3 style=" font-weight: 700; color: #0F5A46; margin: 0; line-height: 1.3;">
            <a href="/magazin/cbd-studien-und-fakten" style="text-decoration: none; color: inherit;">CBD: Studien und Fakten</a>
          </h3>
          <p style="color: #64748B; line-height: 1.6; margin: 0;  flex: 1;">Wissenschaftliche Erkenntnisse zur Wirkung von CBD bei verschiedenen Beschwerden.</p>
          <a href="/magazin/cbd-studien-und-fakten" style="color: #0F5A46; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;  margin-top: 4px;">
            Artikel lesen <i class="fas fa-arrow-right" style=""></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: Magenschutz -->
      <article class="magazine-card" style="background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(15, 118, 110, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';">
        <a href="/magazin/magenschutz-absetzen-ppi" style="display: block; text-decoration: none;">
          <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop" alt="Magenschutz (PPI) absetzen" style="width: 100%; height: 200px; object-fit: cover; display: block;" loading="lazy" />
        </a>
        <div style="padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <span style="display: inline-flex; align-items: center; padding: 4px 10px; background: #FEF3C7; color: #D97706;  font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; width: fit-content;">Medikamente</span>
          <h3 style=" font-weight: 700; color: #0F5A46; margin: 0; line-height: 1.3;">
            <a href="/magazin/magenschutz-absetzen-ppi" style="text-decoration: none; color: inherit;">Magenschutz (PPI) absetzen</a>
          </h3>
          <p style="color: #64748B; line-height: 1.6; margin: 0;  flex: 1;">Protonenpumpenhemmer sicher reduzieren: Was du über das Absetzen von Magenschutz wissen musst.</p>
          <a href="/magazin/magenschutz-absetzen-ppi" style="color: #0F5A46; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;  margin-top: 4px;">
            Artikel lesen <i class="fas fa-arrow-right" style=""></i>
          </a>
        </div>
      </article>
      
      <!-- Artikel: 5 Tabletten -->
      <article class="magazine-card" style="background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.3s; display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(15, 118, 110, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)';">
        <a href="/magazin/taeglich-5-tabletten" style="display: block; text-decoration: none;">
          <img src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&h=400&fit=crop" alt="Täglich 5 Tabletten – ist das normal?" style="width: 100%; height: 200px; object-fit: cover; display: block;" loading="lazy" />
        </a>
        <div style="padding: 20px 20px 24px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
          <span style="display: inline-flex; align-items: center; padding: 4px 10px; background: #F3E8FF; color: #7C3AED;  font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: 999px; width: fit-content;">Polypharmazie</span>
          <h3 style=" font-weight: 700; color: #0F5A46; margin: 0; line-height: 1.3;">
            <a href="/magazin/taeglich-5-tabletten" style="text-decoration: none; color: inherit;">Täglich 5 Tabletten – ist das normal?</a>
          </h3>
          <p style="color: #64748B; line-height: 1.6; margin: 0;  flex: 1;">Polypharmazie verstehen: Wann wird Medikation zur Belastung und was kannst du dagegen tun?</p>
          <a href="/magazin/taeglich-5-tabletten" style="color: #0F5A46; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;  margin-top: 4px;">
            Artikel lesen <i class="fas fa-arrow-right" style=""></i>
          </a>
        </div>
      </article>
    </div>
  </div>
  
  <!-- FOOTER -->
  <footer style="background: linear-gradient(135deg, #0E5A45, #10B981); padding: 60px 32px 40px; color: white; text-align: center; margin-top: 80px;">
    <p style=" font-weight: 600; margin-bottom: 12px;">MEDLESS – Dein Weg zu weniger Medikamenten</p>
    <p style=" opacity: 0.85;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    <div style="margin-top: 24px; display: flex; gap: 24px; justify-content: center;">
      <a href="/impressum" style="color: white; opacity: 0.8; text-decoration: none; ">Impressum</a>
      <a href="/datenschutz" style="color: white; opacity: 0.8; text-decoration: none; ">Datenschutz</a>
      <a href="/agb" style="color: white; opacity: 0.8; text-decoration: none; ">AGB</a>
    </div>
  </footer>
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>
  `)
})

// Magazine Article Route: Endocannabinoid-System erklärt
app.get('/magazin/endocannabinoid-system-erklaert', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Das Endocannabinoid-System: Dein körpereigenes Schutzschild – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #F3E8FF;
      color: #7C3AED;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 56px;
      margin-bottom: 24px;
    }
    
    .article-content h3 {
      
      font-weight: 600;
      color: #0F5A46;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    
    .article-content p {
      margin-bottom: 24px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0;
      padding-left: 32px;
    }
    
    .article-content li {
      margin-bottom: 16px;
    }
    
    .article-content strong {
      color: #0F5A46;
      font-weight: 600;
    }
    
    .article-content em {
      color: #6B7280;
      font-style: italic;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      padding: 48px;
      border-radius: 16px;
      border-left: 5px solid #0F5A46;
      margin: 64px 0;
      text-align: center;
    }
    
    .cta-box h3 {
      
      font-weight: 700;
      color: #0F5A46;
      margin: 0 0 16px 0;
    }
    
    .cta-box p {
      
      color: #374151;
      margin-bottom: 24px;
    }
    
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 32px;
      
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #0E5A45, #10B981);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(14, 90, 69, 0.2);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 90, 69, 0.3);
    }
    
    footer {
      background: linear-gradient(135deg, #0E5A45, #10B981);
      padding: 60px 0 20px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      text-align: center;
    }
    
    .footer-content p {
      
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.85);
    }
    
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }
      
      .article-detail {
        padding: 60px 24px;
      }
      
      .article-content {
        
      }
      
      .cta-box {
        padding: 32px 24px;
      }
    }
  </style>
</head>
<body>
  
  <!-- HEADER (identical to landing page) -->
  <header class="header">
    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 32px;">
      <nav class="nav" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 0;">
        <a href="/" class="logo" style="text-decoration: none;">
          <span class="logo-text" style=" font-weight: 700; color: #0b7b6c;">Medless</span>
        </a>
        <ul class="nav-links" style="display: flex; gap: 32px; list-style: none; margin: 0;">
          <li><a href="/#how-it-works" style="text-decoration: none; color: #4B5563; font-weight: 500;">So funktioniert's</a></li>
          <li><a href="/#benefits" style="text-decoration: none; color: #4B5563; font-weight: 500;">Vorteile</a></li>
          <li><a href="/#faq" style="text-decoration: none; color: #4B5563; font-weight: 500;">FAQ</a></li>
          <li><a href="/magazin" style="text-decoration: none; color: #4B5563; font-weight: 500;">Magazin</a></li>
        </ul>
        <button class="btn-primary-sm" onclick="window.location.href='/app'" style="padding: 12px 24px; background: linear-gradient(135deg, #0E5A45, #10B981); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Analyse starten</button>
      </nav>
    </div>
  </header>
  
  <!-- Hero Image (full width) -->
  <div style="width: 100%; height: 400px; background: linear-gradient(135deg, rgba(14, 90, 69, 0.9), rgba(16, 185, 129, 0.8)), url('https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1600&h=600&fit=crop') center/cover; display: flex; align-items: center; justify-content: center; margin-bottom: 60px;">
    <div style="text-align: center; color: white; max-width: 800px; padding: 0 24px;">
      <span style="display: inline-block; padding: 8px 16px; background: rgba(255, 255, 255, 0.2); border-radius: 20px;  font-weight: 600; text-transform: uppercase; margin-bottom: 16px; backdrop-filter: blur(10px);">Wissen & Grundlagen</span>
      <h1 style=" font-weight: 800; line-height: 1.2; margin: 0;">Das Endocannabinoid-System: Dein körpereigenes Schutzschild</h1>
    </div>
  </div>
  
  <!-- Article Content -->
  <article class="article-detail">
    
    <div class="article-meta" style="margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #E5E7EB;">
      <span style="color: #6B7280; "><i class="far fa-calendar"></i> Januar 2025</span>
      <span style="color: #6B7280;  margin-left: 24px;"><i class="far fa-clock"></i> 10 Min. Lesezeit</span>
      <span style="color: #6B7280;  margin-left: 24px;"><i class="far fa-user"></i> MEDLESS Redaktion</span>
    </div>
    
    <div class="article-content">
      <p class="intro"><strong>Stell dir vor, du hättest ein System in deinem Körper, das Schmerz, Schlaf und Stimmung ganz ohne Tabletten regulieren kann. Gute Nachricht: Du hast es. Hier lernst du es kennen.</strong></p>

      <hr>

      <h2>Das System, von dem 99% noch nie gehört haben</h2>
      <p>Dein Körper besitzt eine Art "inneren Apotheker". Ein System, das unermüdlich arbeitet, um dein Gleichgewicht zu halten. Es kann Schmerzen dämpfen, Ängste lösen und Entzündungen stoppen.</p>
      <p>Es heißt: <strong>Das Endocannabinoid-System (ECS).</strong></p>
      <p>Obwohl es eines der wichtigsten Systeme für unsere Gesundheit ist, kennt es kaum jemand. Warum?</p>
      <ul>
          <li><strong>Späte Entdeckung:</strong> Es wurde erst 1992 entdeckt (zum Vergleich: das Kreislaufsystem kennen wir seit dem 17. Jahrhundert).</li>
          <li><strong>Das Stigma:</strong> Der Name erinnert an Cannabis. Das hat die Forschung lange behindert, obwohl das ECS auch völlig ohne Cannabis existiert und arbeitet.</li>
      </ul>

      <h2>Was macht das ECS eigentlich? (Die einfache Erklärung)</h2>
      <p>Die Hauptaufgabe des ECS ist <strong>Homöostase</strong> – das biologische Gleichgewicht. Stell dir deinen Körper wie einen Hochseilartisten vor:</p>
      <ul>
          <li>Zu viel Stress? Das ECS beruhigt.</li>
          <li>Zu viel Schmerz? Das ECS dämpft.</li>
          <li>Zu viel Entzündung? Das ECS kühlt ab.</li>
      </ul>
      <p>Es ist der <strong>Dirigent</strong>, der dafür sorgt, dass alle anderen Systeme (Nerven, Hormone, Immunsystem) harmonisch zusammenspielen.</p>

      <h2>Die 3 Bausteine: Wie es funktioniert</h2>
      <p>Das ECS besteht aus drei Hauptkomponenten:</p>
      <ol>
          <li><strong>Die Botenstoffe (Endocannabinoide):</strong> Moleküle, die dein Körper selbst herstellt. Zum Beispiel <em>Anandamid</em> (das "Glücksmolekül"), das Stimmung und Wohlbefinden reguliert.</li>
          <li><strong>Die Empfänger (Rezeptoren):</strong> Sie sitzen auf deinen Zellen. <strong>CB1-Rezeptoren</strong> sind vor allem im Gehirn (steuern Schmerz, Schlaf) und <strong>CB2-Rezeptoren</strong> im Immunsystem (steuern Entzündungen).</li>
          <li><strong>Die Aufräumer (Enzyme):</strong> Sie bauen die Botenstoffe wieder ab, sobald die Arbeit erledigt ist.</li>
      </ol>

      <h2>Was das ECS alles kann (und warum du Medikamente nimmst)</h2>
      <p>Jetzt wird es spannend: Das ECS reguliert genau die Bereiche, für die die meisten Menschen Medikamente nehmen.</p>
      <ul>
          <li><strong>Schmerz:</strong> Wenn du dich verletzt, dämpft das ECS das Signal. (Medikament: Ibuprofen, Opioide).</li>
          <li><strong>Stimmung:</strong> Das ECS hilft, Ängste zu lösen. (Medikament: Antidepressiva).</li>
          <li><strong>Schlaf:</strong> Es steuert den Schlaf-Wach-Rhythmus. (Medikament: Schlafmittel).</li>
      </ul>
      <p><strong>Die MedLess-Erkenntnis:</strong> Wenn wir das ECS stärken, kann der Körper diese Aufgaben oft wieder besser selbst erledigen – und wir brauchen weniger Chemie von außen.</p>

      <h2>Wie du dein ECS natürlich stärkst</h2>
      <p>Du kannst dein ECS trainieren wie einen Muskel. Hier sind die besten Methoden:</p>
      <ul>
          <li>🏃 <strong>Bewegung ("Runner's High"):</strong> 30 Minuten moderates Ausdauertraining fluten dein Gehirn mit körpereigenen Glücksbotenstoffen (Anandamid).</li>
          <li>🐟 <strong>Ernährung (Omega-3):</strong> Endocannabinoide werden aus Fett gebaut. Ohne Omega-3-Fettsäuren (Walnüsse, Fischöl) kann dein Körper sie nicht herstellen.</li>
          <li>❄️ <strong>Kälte:</strong> Kurze, kalte Duschen aktivieren das ECS und erhöhen die Anzahl der Rezeptoren.</li>
          <li>🌿 <strong>Phyto-Cannabinoide (CBD):</strong> Pflanzliche Cannabinoide können dem ECS helfen, indem sie den Abbau der körpereigenen Botenstoffe verlangsamen. So bleibt dein "Schutzschild" länger aktiv.</li>
      </ul>

      <h2>Warum das ECS beim Absetzen von Medikamenten hilft</h2>
      <p>Wenn du Medikamente nimmst, fährt der Körper oft seine eigene Regulation herunter. Wenn du das Medikament absetzt, entsteht eine Lücke – das nennt man Entzug oder Rebound.</p>
      <p><strong>Hier kommt das ECS ins Spiel:</strong> Indem wir das ECS gezielt unterstützen, füllen wir diese Lücke auf natürliche Weise. Der Übergang wird sanfter, und Symptome wie Schlaflosigkeit oder Unruhe werden abgefedert.</p>

      <!-- CTA Box -->
      <div class="cta-box">
          <h3>Nutze deine innere Apotheke</h3>
          <p>Dein Körper ist keine defekte Maschine. Er besitzt ein mächtiges System zur Selbstregulation. Willst du wissen, wie stark dein ECS ist und wie es dir beim Reduzieren helfen kann?</p>
          <a href="/app" class="btn-primary">
            Jetzt kostenlose Analyse starten ➔
          </a>
      </div>

      <hr>

      <h3>Quellen & Referenzen</h3>
      <ul style=" color: #666;">
          <li><strong>Biological Psychiatry (2016):</strong> "An Introduction to the Endogenous Cannabinoid System".</li>
          <li><strong>Pharmacological Reviews (2006):</strong> "The Endocannabinoid System as an Emerging Target".</li>
          <li><strong>PNAS (2015):</strong> "A runner's high depends on cannabinoid receptors".</li>
          <li><strong>Drugcom (BZgA):</strong> "Endocannabinoid-System".</li>
      </ul>
      <p style=" color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient ausschließlich der Information. Er ersetzt keine ärztliche Beratung.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Medikamente absetzen - 7 Fehler
app.get('/magazin/medikamente-absetzen-7-fehler', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Medikamente absetzen: Die 7 gefährlichsten Fehler – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #DBEAFE;
      color: #1E40AF;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 56px;
      margin-bottom: 24px;
    }
    
    .article-content h3 {
      
      font-weight: 600;
      color: #0F5A46;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    
    .article-content p {
      margin-bottom: 24px;
    }
    
    .article-content ul {
      margin: 24px 0;
      padding-left: 32px;
    }
    
    .article-content li {
      margin-bottom: 16px;
    }
    
    .article-content strong {
      color: #0F5A46;
      font-weight: 600;
    }
    
    .article-content em {
      color: #6B7280;
      font-style: italic;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      padding: 48px;
      border-radius: 16px;
      border-left: 5px solid #0F5A46;
      margin: 64px 0;
      text-align: center;
    }
    
    .cta-box h3 {
      
      font-weight: 700;
      color: #0F5A46;
      margin: 0 0 16px 0;
    }
    
    .cta-box p {
      
      color: #374151;
      margin-bottom: 24px;
    }
    
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 32px;
      
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #0E5A45, #10B981);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(14, 90, 69, 0.2);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 90, 69, 0.3);
    }
    
    footer {
      background: linear-gradient(135deg, #0E5A45, #10B981);
      padding: 60px 0 20px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      text-align: center;
    }
    
    .footer-content p {
      
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.85);
    }
    
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }
      
      .article-detail {
        padding: 60px 24px;
      }
      
      .article-content {
        
      }
      
      .cta-box {
        padding: 32px 24px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="header-logo">
        <span class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </span>
      </a>
      
      <nav class="header-nav">
        <a href="/#ueber-medless">Über MEDLESS</a>
        <a href="/#funktionsweise">Funktionsweise</a>
        <a href="/#faq">FAQ</a>
        <a href="/#magazin">Magazin</a>
        <a href="/fachkreise">Für Ärzt:innen & Apotheken</a>
        <a href="/#kontakt">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Content -->
  <article class="article-detail">
    <!-- Header Image -->
    <div style="width: 100%; max-width: 900px; margin: 0 auto 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <img src="/static/artikel2-medikamente-absetzen.jpg" alt="Gestresste Person mit Kopfschmerzen und Medikamenten - Rebound-Effekt beim Absetzen" style="width: 100%; height: auto; display: block;" />
    </div>
    
    <span class="article-category">Sicherheit & Praxis</span>
    <h1 class="article-title">Medikamente absetzen: Die 7 gefährlichsten Fehler (und wie du sie vermeidest)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> Januar 2025</span>
      <span><i class="far fa-clock"></i> 12 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      <p class="intro"><strong>Du willst Medikamente reduzieren? Großartig. Aber Vorsicht: Der falsche Weg kann gefährlich werden. Erfahre hier, warum der "kalte Entzug" scheitert und wie du sicher ausschleichst.</strong></p>

      <hr>

      <h2>"Ich setze einfach ab" – warum das fast schiefging</h2>
      <p>Sarah, 58, hatte genug. Seit Jahren nahm sie acht verschiedene Tabletten. Die Nebenwirkungen waren schlimmer als ihre ursprünglichen Beschwerden. An einem Sonntagmorgen entschied sie: <em>"Das war's. Ich höre auf."</em></p>
      <p>Sie nahm keine ihrer Tabletten mehr. Drei Tage später saß sie in der Notaufnahme: Blutdruck 190/110, Herzrasen, Panik.</p>
      <p><strong>Die Diagnose:</strong> Rebound-Effekt durch abruptes Absetzen eines Betablockers.</p>
      <p>Sarah hatte einen klassischen Fehler gemacht. Der Wunsch nach weniger Medikamenten ist richtig (50% der Deutschen wollen reduzieren!), aber die Methode entscheidet über Erfolg oder Gefahr.</p>

      <h2>Fehler 1: Der kalte Entzug ("Cold Turkey")</h2>
      <p><strong>Was passiert:</strong> Du hörst von heute auf morgen auf. Von 100 auf 0.</p>
      <p><strong>Warum es gefährlich ist:</strong> Dein Körper hat sich an den Wirkstoff angepasst (Adaptation). Fehlt dieser plötzlich, reagiert der Körper mit einer massiven Gegenregulation.</p>
      <ul>
          <li><strong>Betablocker:</strong> Herzrasen, Blutdruckkrisen.</li>
          <li><strong>Antidepressiva:</strong> "Brain Zaps" (Stromschläge im Kopf), Übelkeit.</li>
          <li><strong>Schlafmittel:</strong> Krampfanfälle, massive Angstzustände.</li>
          <li><strong>Säureblocker (PPI):</strong> Extremes Sodbrennen (Rebound).</li>
      </ul>
      <p>✅ <strong>Die Lösung:</strong> Ausschleichen. Reduziere die Dosis schrittweise über Wochen.</p>

      <h2>Fehler 2: Alles gleichzeitig reduzieren</h2>
      <p><strong>Was passiert:</strong> Du willst schnell Ergebnisse und reduzierst Blutdruckmittel, Schmerzmittel und Schlafmittel gleichzeitig.</p>
      <p><strong>Warum es gefährlich ist:</strong> Wenn Probleme auftreten, weißt du nicht, welches Medikament fehlt. Du verlierst die Kontrolle.</p>
      <p>✅ <strong>Die Lösung:</strong> Ein Medikament nach dem anderen. Mache 4-6 Wochen Pause zwischen zwei Reduktionen.</p>

      <h2>Fehler 3: Alleingang ohne Arzt</h2>
      <p><strong>Was passiert:</strong> <em>"Mein Arzt hat eh keine Zeit"</em> – also machst du es allein.</p>
      <p><strong>Warum es gefährlich ist:</strong> Du kannst medizinische Warnsignale (Blutdruckspitzen, Laborwerte) nicht selbst beurteilen.</p>
      <p>✅ <strong>Die Lösung:</strong> Bereite das Gespräch vor. Nutze Tools wie MedLess, um einen Plan als Gesprächsgrundlage zu erstellen.</p>

      <h2>Fehler 4: Warnsignale ignorieren</h2>
      <p>Manche Symptome sind lebensbedrohlich. <strong>Gehe SOFORT zum Arzt bei:</strong></p>
      <ul>
          <li>Starkem Schwindel mit Ohnmachtsgefühl</li>
          <li>Herzrasen (Puls >120 in Ruhe)</li>
          <li>Krampfanfällen oder Muskelzuckungen</li>
          <li>Starker Verwirrtheit oder Suizidgedanken</li>
      </ul>

      <h2>Fehler 5: Keine Vorbereitung des Körpers</h2>
      <p>Du nimmst dem Körper die "Krücke" (Medikament) weg, hast aber die Muskeln nicht trainiert. Stärke dich <strong>vorher</strong>:</p>
      <ul>
          <li><strong>Schlaf:</strong> Optimiere deine Schlafhygiene.</li>
          <li><strong>Ernährung:</strong> Iss entzündungshemmend (Omega-3).</li>
          <li><strong>Wasser:</strong> Trinke 2-3 Liter täglich.</li>
      </ul>

      <h2>Fehler 6: Zu schnell reduzieren</h2>
      <p><strong>Die 10%-Regel:</strong> Experten empfehlen oft Schritte von nur 10-25% Reduktion. Je länger du ein Medikament nimmst, desto langsamer muss der Ausstieg sein. Die letzten Milligramme sind oft die schwersten!</p>

      <h2>Fehler 7: Die Ursache ignorieren</h2>
      <p>Das Medikament war nur das Pflaster. Wenn du es abreißt, blutet die Wunde wieder, wenn sie nicht geheilt ist. Arbeite parallel an der Ursache (Physiotherapie bei Schmerzen, Gewichtsreduktion bei Blutdruck).</p>

      <h2>Dein Geheimtipp: Das Endocannabinoid-System (ECS)</h2>
      <p>Um all diese Fehler zu vermeiden, nutzen wir bei MedLess dein körpereigenes <strong>Endocannabinoid-System</strong>. Wenn du Medikamente reduzierst, entsteht eine Lücke. Indem wir das ECS gezielt stärken (z.B. durch präzise dosierte Cannabinoide), füllen wir diese Lücke natürlich auf.</p>

      <!-- CTA Box -->
      <div class="cta-box">
          <h3>Dein sicherer Fahrplan</h3>
          <p>Sarah hat es beim zweiten Versuch geschafft – mit Plan, Arzt und Geduld. Möchtest du wissen, wie dein persönlicher Ausschleichplan aussehen könnte?</p>
          <a href="/#planner-section" class="btn-primary">
            Jetzt kostenlose KI-Analyse starten ➔
          </a>
      </div>

      <hr>

      <h3>Quellen & Referenzen</h3>
      <ul style=" color: #666;">
          <li><strong>Apotheken Umschau (2024):</strong> "Medikamente einschleichen und ausschleichen".</li>
          <li><strong>Deutsches Ärzteblatt:</strong> "Absetz- und Rebound-Phänomene bei Antidepressiva".</li>
          <li><strong>SWR (2025):</strong> "Antidepressiva absetzen ohne Symptome".</li>
          <li><strong>CHIP (2025):</strong> "Rebound-Effekt: Diese Medikamente niemals abrupt absetzen".</li>
      </ul>
      <p style=" color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient ausschließlich der Information und ersetzt keine ärztliche Beratung. Bei Notfällen wählen Sie 112.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Endocannabinoid-System
app.get('/magazin/endocannabinoid-system-erklaert', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Das Endocannabinoid-System: Dein körpereigenes Schutzschild – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #FEF3C7;
      color: #92400E;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul {
      margin: 24px 0 24px 24px;
      list-style-type: disc;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .cta-box {
      background: linear-gradient(135deg, #0F5A46 0%, #1DB98D 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin: 48px 0;
      text-align: center;
    }
    
    .cta-box h3 {
      
      margin-bottom: 16px;
      color: white;
    }
    
    .cta-box p {
      
      margin-bottom: 24px;
      opacity: 0.95;
    }
    
    .cta-button {
      display: inline-block;
      background: white;
      color: #0F5A46;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    
    <span class="article-category">Wissen & Grundlagen</span>
    
    <h1 class="article-title">
      Das Endocannabinoid-System: Dein körpereigenes Schutzschild
    </h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 10. Januar 2025</span>
      <span><i class="far fa-clock"></i> 6 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        Stell dir vor, dein Körper hätte eine eigene Apotheke gegen Schmerz, Stress und Entzündungen – eine biologische Schutzinstanz, die rund um die Uhr arbeitet, ohne dass du es merkst. Die gute Nachricht: Du hast sie bereits. Sie heißt <strong>Endocannabinoid-System (ECS)</strong>.
      </p>
      
      <p>
        Trotz seiner zentralen Rolle ist das ECS eines der am wenigsten bekannten Körpersysteme – selbst vielen Ärzten. Warum? Weil es erst in den 1990er Jahren entdeckt wurde. Seitdem gilt es als <strong>Regulationssystem des Körpers</strong>, das alles von Schmerzwahrnehmung bis Stimmung beeinflusst.
      </p>
      
      <h2>Was ist das Endocannabinoid-System?</h2>
      
      <p>
        Das ECS ist ein <strong>körpereigenes Netzwerk aus Botenstoffen und Rezeptoren</strong>, das als Frühwarnsystem und Reparaturmechanismus dient. Es besteht aus drei Hauptkomponenten:
      </p>
      
      <ul>
        <li><strong>Endocannabinoide</strong> (körpereigene Botenstoffe wie Anandamid und 2-AG)</li>
        <li><strong>Rezeptoren</strong> (CB1 im Gehirn/Nervensystem, CB2 im Immunsystem)</li>
        <li><strong>Enzyme</strong>, die Endocannabinoide auf- und abbauen</li>
      </ul>
      
      <p>
        Wenn dein Körper aus dem Gleichgewicht gerät – etwa durch Stress, Schmerz oder Entzündungen – aktiviert das ECS seine „Notfall-Apotheke" und stellt gezielt Endocannabinoide her. Diese docken an Rezeptoren an und bringen dich zurück in Balance. Mediziner nennen das <strong>Homöostase</strong>.
      </p>
      
      <h2>Warum ist das ECS so wichtig?</h2>
      
      <p>
        Das Endocannabinoid-System reguliert fundamentale Körperfunktionen:
      </p>
      
      <ul>
        <li><strong>Schmerzverarbeitung</strong> – Es dämpft Schmerzsignale im Nervensystem</li>
        <li><strong>Entzündungsreaktionen</strong> – Es bremst überschießende Immunantworten</li>
        <li><strong>Stressregulation</strong> – Es moduliert Angst und emotionale Belastung</li>
        <li><strong>Schlaf-Wach-Rhythmus</strong> – Es steuert den zirkadianen Rhythmus</li>
        <li><strong>Appetit & Verdauung</strong> – Es beeinflusst Hunger und Darmfunktion</li>
        <li><strong>Gedächtnis & Lernen</strong> – Es schützt Nervenzellen vor Überlastung</li>
      </ul>
      
      <p>
        Forscher sprechen mittlerweile von einer <strong>„Endocannabinoid-Defizienz"</strong> als möglicher Ursache für chronische Schmerzen, Migräne, Fibromyalgie und Reizdarmsyndrom.
      </p>
      
      <h2>Wie CBD das Endocannabinoid-System unterstützt</h2>
      
      <p>
        Hier wird es spannend: <strong>CBD (Cannabidiol)</strong> aus der Hanfpflanze interagiert direkt mit dem ECS – allerdings anders, als viele denken.
      </p>
      
      <p>
        CBD dockt nicht direkt an CB1- oder CB2-Rezeptoren an. Stattdessen:
      </p>
      
      <ul>
        <li><strong>Hemmt Enzyme</strong>, die körpereigene Endocannabinoide abbauen → mehr eigene Botenstoffe bleiben verfügbar</li>
        <li><strong>Aktiviert zusätzliche Rezeptoren</strong> (z.B. Serotonin-Rezeptoren 5-HT1A für Stimmungsregulation)</li>
        <li><strong>Reduziert chronische Entzündungen</strong>, indem es das Immunsystem moduliert</li>
        <li><strong>Schützt Nervenzellen</strong> vor oxidativem Stress und Übererregung</li>
      </ul>
      
      <p>
        Das Ergebnis: Dein ECS arbeitet effizienter – ohne dass CBD dich „high" macht (das tut nur THC, das direkt an CB1-Rezeptoren bindet).
      </p>
      
      <h2>Der Zusammenhang mit Medikamentenreduktion</h2>
      
      <p>
        Viele chronische Medikamente (Schmerzmittel, Antidepressiva, Schlaftabletten) greifen in dieselben Körperfunktionen ein, die das ECS steuert – oft mit Nebenwirkungen und Abhängigkeitsrisiko.
      </p>
      
      <p>
        Wenn du dein ECS durch CBD unterstützt, kann dein Körper möglicherweise:
      </p>
      
      <ul>
        <li>Schmerzen besser selbst regulieren → weniger Schmerzmittel nötig</li>
        <li>Stress und Angst natürlicher abbauen → niedrigere Antidepressiva-Dosis</li>
        <li>Schlaf ohne chemische Einschlafhilfen finden → Ausschleichen von Z-Drugs</li>
      </ul>
      
      <p>
        <strong>Wichtig:</strong> CBD ist kein „Ersatz" für Medikamente, sondern ein <strong>modulierender Begleiter</strong>, der deinem Körper hilft, wieder selbst zu regulieren – was langfristig Medikamentendosen reduzieren kann.
      </p>
      
      <h2>Warum spricht niemand darüber?</h2>
      
      <p>
        Das ECS wurde erst 1992 entdeckt – zu spät für die meisten medizinischen Lehrpläne. Hinzu kommt die Stigmatisierung von Cannabis, die jahrzehntelang auch CBD-Forschung blockierte.
      </p>
      
      <p>
        Heute gibt es über 30.000 wissenschaftliche Studien zum ECS – aber das Wissen ist noch nicht in der Praxis angekommen. Das ändert sich gerade, langsam aber sicher.
      </p>
      
      <div class="cta-box">
        <h3>Unterstütze dein Endocannabinoid-System intelligent</h3>
        <p>
          Erfahre in unserer kostenlosen Analyse, wie CBD gezielt dein ECS aktivieren und deine Medikation langfristig reduzieren kann – mit einem individuellen 8-Wochen-Plan.
        </p>
        <a href="/#start-analysis" class="cta-button">Kostenlos Analyse starten</a>
      </div>
      
      <h2>Fazit: Dein Körper kann mehr, als du denkst</h2>
      
      <p>
        Das Endocannabinoid-System ist kein esoterisches Konzept, sondern <strong>messbare Biologie</strong>. Es ist dein körpereigenes Schutzschild gegen Schmerz, Stress und Entzündungen – und es funktioniert besser, wenn du es unterstützt.
      </p>
      
      <p>
        CBD gibt deinem ECS die Werkzeuge zurück, die es braucht, um dich selbst zu regulieren – ohne Abhängigkeiten, ohne High, ohne Nebenwirkungen schwerer Medikamente.
      </p>
      
      <p>
        <strong>Die Frage ist nicht, ob dein Körper das kann. Die Frage ist: Gibst du ihm die Chance?</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 48px 0;" />
      
      <h3 style=" font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Weiterführende Literatur</h3>
      <ul style=" color: #6B7280;">
          <li><strong>Russo, E.B. (2016):</strong> "Clinical Endocannabinoid Deficiency Reconsidered" – Cannabis and Cannabinoid Research.</li>
          <li><strong>Lu, H.C. & Mackie, K. (2016):</strong> "An Introduction to the Endogenous Cannabinoid System" – Biological Psychiatry.</li>
          <li><strong>Pacher, P. et al. (2006):</strong> "The Endocannabinoid System as an Emerging Target of Pharmacotherapy" – Pharmacological Reviews.</li>
          <li><strong>Blessing, E.M. et al. (2015):</strong> "Cannabidiol as a Potential Treatment for Anxiety Disorders" – Neurotherapeutics.</li>
      </ul>
      <p style=" color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient ausschließlich der Information und ersetzt keine ärztliche Beratung. Jede Medikamentenänderung muss ärztlich begleitet werden.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
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
  <title>Antidepressiva absetzen: Der sanfte Weg ohne Entzugserscheinungen – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #FCE7F3;
      color: #BE185D;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    <!-- Header Image -->
    <div style="width: 100%; max-width: 900px; margin: 0 auto 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <img src="/static/artikel4-antidepressiva-absetzen.jpg" alt="Person in ruhiger Umgebung - mentale Gesundheit und Weg aus der Depression" style="width: 100%; height: auto; display: block;" />
    </div>
    
    <span class="article-category">Mentale Gesundheit</span>
    
    <h1 class="article-title">Antidepressiva absetzen: Der sanfte Weg ohne Entzugserscheinungen</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 12. Januar 2025</span>
      <span><i class="far fa-clock"></i> 8 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>Du möchtest Antidepressiva absetzen, hast aber Angst vor dem "Loch" danach? Erfahre, warum Absetzerscheinungen entstehen und wie du sie mit einem 8-Wochen-Plan und ECS-Unterstützung vermeidest.</strong>
      </p>
      
      <hr>
      
      <h2>Die Angst vor dem Absetzen: "Schaffe ich das?"</h2>
      <p>Kennst du dieses Gefühl? Du nimmst seit Monaten Antidepressiva. Sie haben dir geholfen, aus dem Gröbsten herauszukommen. Du fühlst dich stabil und möchtest eigentlich reduzieren.</p>
      <p>Aber dann hörst du die Geschichten: <em>"Ich hatte tagelang Schwindel"</em>, <em>"Die Angst kam sofort zurück"</em>, <em>"Ich musste wieder anfangen"</em>.</p>
      <p>Die Angst vor dem sogenannten <strong>Absetzsyndrom</strong> hält Millionen Menschen davon ab, den Schritt in die Unabhängigkeit zu wagen.</p>
      <p>Die gute Nachricht: Mit dem richtigen Plan, Geduld und der Unterstützung deines körpereigenen <strong>Endocannabinoid-Systems (ECS)</strong> kannst du den Ausstieg sanft und sicher schaffen.</p>
      
      <h2>Warum entstehen Absetzerscheinungen überhaupt?</h2>
      <p>Antidepressiva (vor allem SSRIs wie Citalopram oder Sertralin) wirken, indem sie den Serotoninspiegel im Gehirn künstlich erhöhen. Dein Gehirn gewöhnt sich an dieses hohe Niveau ("Down-Regulation").</p>
      <p>Wenn du das Medikament plötzlich wegnimmst, fehlt dem Gehirn der Botenstoff. Es entsteht ein neurochemisches Ungleichgewicht.</p>
      <p><strong>Die Folgen:</strong></p>
      <ul>
          <li><strong>Körperlich:</strong> Schwindel ("Brain Zaps"), Übelkeit, Zittern.</li>
          <li><strong>Psychisch:</strong> Reizbarkeit, plötzliche Tränenausbrüche, Angst.</li>
      </ul>
      <p><strong>Wichtig:</strong> <em>Diese Symptome sind meist KEIN Rückfall in die Depression, sondern eine vorübergehende Anpassungsreaktion des Gehirns!</em></p>
      
      <h2>Die Wahrheit in Zahlen</h2>
      <p>Eine große Meta-Analyse der Charité Berlin (2024) gibt Entwarnung:</p>
      <ul>
          <li>Nur <strong>15%</strong> der Patienten erleben echte, pharmakologische Absetzsymptome.</li>
          <li>Nur <strong>3%</strong> entwickeln schwere Symptome.</li>
          <li><strong>97%</strong> kommen gut durch den Prozess – wenn sie es richtig machen.</li>
      </ul>
      
      <h2>Der sanfte 8-Wochen-Plan: So gehst du vor</h2>
      <p>🚨 <strong>Grundregel:</strong> Setze niemals ohne Rücksprache mit deinem Arzt ab!</p>
      
      <h3>Phase 1: Die Vorbereitung (Woche 0)</h3>
      <p>Bevor du auch nur ein Milligramm reduzierst:</p>
      <ul>
          <li>Bist du seit mindestens 6 Monaten stabil?</li>
          <li>Hast du gerade keinen akuten Stress (Jobwechsel, Trennung)?</li>
          <li>Hast du mit deinem Arzt gesprochen?</li>
      </ul>
      
      <h3>Phase 2: Das langsame Ausschleichen (Woche 1-8)</h3>
      <p>Die goldene Regel: <strong>Langsam ist sicher.</strong> Reduziere die Dosis in kleinen Schritten (z.B. alle 2-4 Wochen um 10-25%).</p>
      <p><em>Tipp: Die letzten Milligramme sind oft die schwersten. Hier besonders langsam vorgehen!</em></p>
      
      <h3>Phase 3: Die Stabilisierung (Woche 9+)</h3>
      <p>Nach der letzten Tablette ist der Prozess nicht vorbei. Dein Gehirn lernt jetzt, wieder selbstständig zu regulieren. Hier ist Unterstützung entscheidend.</p>
      
      <h2>Dein natürlicher Fallschirm: Das Endocannabinoid-System (ECS)</h2>
      <p>Warum schaffen manche das Absetzen spielend und andere nicht? Ein Schlüssel liegt im <strong>Endocannabinoid-System</strong>. Dieses körpereigene System reguliert Stimmung, Schlaf und Stressverarbeitung. Es arbeitet eng mit dem Serotonin-System zusammen.</p>
      <p><strong>Die MedLess-Strategie:</strong> Wenn wir das Antidepressivum (die "Krücke") wegnehmen, stärken wir gleichzeitig das ECS (den "Muskel").</p>
      <ul>
          <li><strong>Stimmungs-Balance:</strong> Ein starkes ECS kann Stimmungstiefs abfedern.</li>
          <li><strong>Schlaf-Qualität:</strong> Es hilft, den Schlaf-Wach-Rhythmus ohne Chemie zu stabilisieren.</li>
      </ul>
      
      <h2>5 Strategien, um dein ECS beim Absetzen zu stärken</h2>
      <ol>
          <li><strong>Omega-3-Fettsäuren:</strong> Sie sind das "Baumaterial" für deine Endocannabinoide. (Fischöl, Algenöl).</li>
          <li><strong>Sport:</strong> 30 Minuten Laufen oder Radfahren setzen körpereigene Glücksbotenstoffe (Anandamid) frei.</li>
          <li><strong>CBD (Cannabidiol):</strong> Pflanzliches CBD kann das ECS unterstützen, ohne psychoaktiv zu wirken. <em>Wichtig: Mit dem Arzt besprechen!</em></li>
          <li><strong>Darm-Gesundheit:</strong> 90% des Serotonins werden im Darm gebildet. Probiotika können helfen.</li>
          <li><strong>Stress-Reduktion:</strong> Meditation senkt Cortisol, den Feind des ECS.</li>
      </ol>
      
      <h2>Rote Flaggen: Wann du sofort zum Arzt musst</h2>
      <p>Brich den Versuch ab und kontaktiere deinen Arzt, wenn:</p>
      <ul>
          <li>Suizidgedanken auftreten.</li>
          <li>Du tagelang nicht schlafen kannst.</li>
          <li>Du schwere Panikattacken hast.</li>
      </ul>
      <p>In diesem Fall war der Schritt vielleicht zu groß. <strong>Keine Panik:</strong> Oft reicht es, auf die letzte Dosis zurückzugehen, sich zu stabilisieren und es dann langsamer erneut zu versuchen.</p>
      
      <div class="cta-box">
          <h3>Dein individueller Fahrplan</h3>
          <p>Du bist nicht abhängig – du bist gewöhnt. Es gibt einen Weg aus den Medikamenten. Möchtest du einen individuellen, ärztlich prüfbaren Ausschleichplan erstellen lassen?</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose KI-Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style=" font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Studien</h3>
      <ul style=" color: #6B7280;">
          <li><strong>Charité Berlin (2024):</strong> "Neue Daten zur Häufigkeit von Absetzsymptomen".</li>
          <li><strong>Ärzteblatt (2025):</strong> "Absetzsymptome meist mild".</li>
          <li><strong>Royal College of Psychiatrists:</strong> "Stopping Antidepressants".</li>
      </ul>
      <p style=" color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient der Information und ersetzt keine ärztliche Behandlung. Setzen Sie Antidepressiva niemals eigenständig ab. Bei psychischen Notfällen wenden Sie sich an die Telefonseelsorge (0800 1110111).</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Schlaftabletten loswerden
app.get('/magazin/schlaftabletten-loswerden', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Schlaftabletten loswerden: Endlich wieder natürlich einschlafen – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #E0E7FF;
      color: #3730A3;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    <!-- Header Image -->
    <div style="width: 100%; max-width: 900px; margin: 0 auto 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <img src="/static/artikel5-schlaftabletten.jpg" alt="Person schläft friedlich - natürlicher Schlaf ohne Tabletten" style="width: 100%; height: auto; display: block;" />
    </div>
    
    <span class="article-category">Schlaf & Erholung</span>
    
    <h1 class="article-title">Schlaftabletten loswerden: Endlich wieder natürlich einschlafen (Der 8-Wochen-Plan)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 15. Januar 2025</span>
      <span><i class="far fa-clock"></i> 7 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>Jede Nacht das gleiche Spiel: Ohne Tablette keine Ruhe. Erfahre, wie du die Abhängigkeit durchbrichst und deinem Körper wieder beibringst, natürlich zu schlafen.</strong>
      </p>
      
      <hr>
      
      <h2>Die stille Abhängigkeit: "Ohne geht es nicht mehr"</h2>
      <p>Du öffnest die Schublade. Eine Tablette. Vielleicht zwei. Du weißt, dass du davon wegkommen solltest. Aber die Angst vor der schlaflosen Nacht ist größer.</p>
      <p>Du bist nicht allein: <strong>1,5 Millionen Menschen</strong> in Deutschland sind von Schlafmitteln abhängig. Besonders tückisch sind Benzodiazepine und sogenannte Z-Substanzen (Zolpidem, Zopiclon).</p>
      <p>Die gute Nachricht: Dein Körper hat das Schlafen nicht verlernt. Er hat es nur vergessen. Mit dem richtigen Plan kannst du ihn wieder trainieren.</p>
      
      <h2>Warum Schlafmittel zur Falle werden</h2>
      <p>Schlafmittel verstärken den beruhigenden Botenstoff GABA im Gehirn. Das funktioniert anfangs super. Aber nach wenigen Wochen (oft schon nach 4!) passt sich das Gehirn an.</p>
      <ul>
          <li><strong>Toleranz:</strong> Du brauchst immer mehr für die gleiche Wirkung.</li>
          <li><strong>Rebound:</strong> Wenn du die Tablette weglässt, schläfst du schlechter als je zuvor.</li>
      </ul>
      <p><strong>Das Ergebnis:</strong> Du nimmst die Tablette nicht mehr, um zu schlafen – sondern nur noch, um den Entzug zu vermeiden.</p>
      
      <h2>Der sichere Ausweg: Der 8-Wochen-Plan</h2>
      <p>🚨 <strong>Wichtig:</strong> Setze Schlafmittel NIEMALS kalt ab ("Cold Turkey"). Das kann zu Krampfanfällen und massiver Schlaflosigkeit führen.</p>
      
      <h3>Phase 1: Vorbereitung (Woche 0)</h3>
      <ul>
          <li>Ist deine Lebenssituation gerade stabil?</li>
          <li>Hast du mit deinem Arzt gesprochen?</li>
          <li>Hast du ein Schlaftagebuch gestartet?</li>
      </ul>
      
      <h3>Phase 2: Langsames Ausschleichen (Woche 1-8)</h3>
      <p>Wir reduzieren die Dosis in winzigen Schritten (z.B. alle 2 Wochen um 10-20%).</p>
      <p><em>Beispiel:</em> Eine halbe Tablette weniger ist oft schon zu viel. Wir reden von Krümeln! Das Ziel ist, dass das Gehirn den Entzug gar nicht bemerkt.</p>
      
      <h3>Phase 3: Stabilisierung</h3>
      <p>Dein Gehirn lernt jetzt wieder, eigenes GABA zu produzieren. Hier ist Geduld gefragt.</p>
      
      <h2>Dein natürlicher Schlaf-Lehrer: Das ECS</h2>
      <p>Warum schlafen manche Menschen wie Steine und andere nicht? Ein Schlüssel ist das <strong>Endocannabinoid-System (ECS)</strong>. Es steuert deinen Schlaf-Wach-Rhythmus und die Tiefe deines Schlafs.</p>
      <p><strong>Die MedLess-Strategie:</strong> Während wir die chemische Bremse (Tablette) lösen, stärken wir das natürliche Bremssystem (ECS).</p>
      <ul>
          <li><strong>Tieferer Schlaf:</strong> Ein starkes ECS fördert die Tiefschlafphasen, die durch Tabletten oft unterdrückt werden.</li>
          <li><strong>Weniger Angst:</strong> Es beruhigt das Gedankenkarussell am Abend.</li>
      </ul>
      
      <h2>5 natürliche Helfer (statt Chemie)</h2>
      <ol>
          <li><strong>Melatonin:</strong> Das körpereigene Schlafhormon (als Spray oder Kapsel) hilft beim "Reset" der inneren Uhr.</li>
          <li><strong>CBD (Cannabidiol):</strong> Kann das ECS unterstützen und Angst lösen, ohne abhängig zu machen.</li>
          <li><strong>Baldrian & Hopfen:</strong> Die Klassiker. Sie wirken ähnlich wie Schlafmittel auf GABA, aber viel sanfter.</li>
          <li><strong>Lavendelöl:</strong> Studien zeigen, dass es Angstzustände effektiv lindert.</li>
          <li><strong>Magnesium:</strong> Entspannt die Muskeln und beruhigt die Nerven.</li>
      </ol>
      
      <h2>Die 3 goldenen Regeln der Schlafhygiene</h2>
      <p>Ohne diese Basis hilft kein Medikament der Welt dauerhaft:</p>
      <ol>
          <li><strong>Das Bett ist nur zum Schlafen da:</strong> Kein Handy, kein Fernseher, kein Grübeln. Wenn du nach 20 Min. nicht schläfst: Aufstehen!</li>
          <li><strong>Licht aus, Dunkelheit an:</strong> Melatonin braucht Dunkelheit. Blaulicht (Handy) ist Gift für den Schlaf.</li>
          <li><strong>Kühle Temperatur:</strong> 16-18 Grad sind ideal. Dein Körper muss abkühlen, um einzuschlafen.</li>
      </ol>
      
      <div class="cta-box">
          <h3>Vertrau deinem Körper</h3>
          <p>Du brauchst keine Tabletten, um zu schlafen. Schlaf ist ein natürlicher Instinkt. Er kommt zurück, wenn du ihm die Chance gibst. Möchtest du wissen, wie dein individueller, ECS-gestützter Ausschleichplan aussehen könnte?</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose KI-Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style=" font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Studien</h3>
      <ul style=" color: #6B7280;">
          <li><strong>Deutsche Hauptstelle für Suchtfragen (DHS):</strong> "Die Sucht und ihre Stoffe: Benzodiazepine".</li>
          <li><strong>Bundesärztekammer (2022):</strong> "Leitfaden Medikamentenabhängigkeit".</li>
          <li><strong>Stiftung Gesundheitswissen:</strong> "Schlafmittel-Abhängigkeit behandeln".</li>
          <li><strong>PMC (2023):</strong> "Cannabinoids: Emerging sleep modulator".</li>
      </ul>
      <p style=" color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient der Information und ersetzt keine ärztliche Behandlung. Setzen Sie Schlafmittel niemals eigenständig ab. Bei schweren Schlafstörungen konsultieren Sie einen Arzt.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: CBD Studien und Fakten
app.get('/magazin/cbd-studien-und-fakten', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CBD bei Medikamentenreduktion: Was die Wissenschaft wirklich sagt – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #D1FAE5;
      color: #065F46;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <img src="/static/artikel6-cbd-studien.jpg" alt="CBD Öl mit Labor-Equipment - Wissenschaftliche Forschung zu Cannabidiol" style="width: 100%; max-width: 900px; height: auto; border-radius: 16px; margin: 0 auto 32px auto; display: block; box-shadow: 0 4px 16px rgba(0,0,0,0.08);" />
  
  <article class="article-detail">
    
    <span class="article-category">Wissenschaft & Fakten</span>
    
    <h1 class="article-title">CBD bei Medikamentenreduktion: Was die Wissenschaft wirklich sagt (Studien 2025)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 18. Januar 2025</span>
      <span><i class="far fa-clock"></i> 6 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>Überall hörst du: "CBD ist das neue Wundermittel". Doch was stimmt davon? Erfahre, wie CBD dir beim Absetzen von Medikamenten helfen kann – und wo die Risiken liegen.</strong>
      </p>
      
      <hr>
      
      <h2>Zwischen Hype und Realität</h2>
      <p>Die Schlagzeilen überschlagen sich: "Schmerzfrei ohne Chemie!", "Endlich besser schlafen!". Doch zwischen Marketing-Versprechen und echter Wissenschaft klafft oft eine Lücke.</p>
      <p>Die Wahrheit ist: <strong>CBD (Cannabidiol) ist kein Allheilmittel.</strong> Es ersetzt keinen Arzt und keine lebenswichtigen Medikamente. <strong>Aber:</strong> Hunderte Studien zeigen inzwischen, dass es eine extrem wertvolle Unterstützung sein kann, wenn man Medikamente reduzieren möchte.</p>
      
      <h2>Was ist CBD eigentlich? (Der 2-Minuten-Crashkurs)</h2>
      <p>CBD ist einer von über 100 Wirkstoffen aus der Hanfpflanze. Der wichtigste Unterschied zu THC (dem "Kiffer-Wirkstoff"): <strong>CBD macht nicht high.</strong></p>
      <ul>
          <li>Es ist nicht psychoaktiv.</li>
          <li>Es macht nicht abhängig.</li>
          <li>Die WHO (Weltgesundheitsorganisation) stuft es als sicher ein.</li>
      </ul>
      <p><strong>Wie es wirkt:</strong> Es dockt nicht direkt an deine Zellen an, sondern moduliert dein körpereigenes <strong>Endocannabinoid-System (ECS)</strong>. Es hilft dem Körper, sich selbst wieder ins Gleichgewicht zu bringen.</p>
      
      <h2>Das sagen die Studien: Wo CBD wirklich hilft</h2>
      
      <h3>1. Bei Schmerzen (Opioid-Ersparnis)</h3>
      <p>Das ist das stärkste Feld der Forschung. Studien zeigen, dass Patienten, die Cannabis-Medikamente nutzen, ihren Verbrauch an starken Schmerzmitteln (Opioiden) massiv senken können.</p>
      <p><em>Das Ergebnis: Weniger Schmerzmittel nötig = weniger Nebenwirkungen, weniger Abhängigkeit.</em> (Quelle: Deutsche Gesellschaft für Schmerzmedizin)</p>
      
      <h3>2. Bei Angst & Stress</h3>
      <p>CBD dämpft die Reaktion des Körpers auf Stresshormone. Der Vorteil: Im Gegensatz zu Beruhigungsmitteln (Benzodiazepinen) macht es nicht süchtig und führt nicht zu einer Toleranzentwicklung.</p>
      
      <h3>3. Bei Entzündungen</h3>
      <p>CBD wirkt entzündungshemmend, ähnlich wie Ibuprofen, aber über einen anderen Mechanismus. Das macht es interessant für Rheuma- oder Arthrose-Patienten, die ihren Magen schonen wollen.</p>
      
      <h2>Vorsicht: Der "Elefant im Raum" (Wechselwirkungen)</h2>
      <p>CBD ist natürlich, aber nicht harmlos. Es wird in der Leber über das gleiche Enzym-System abgebaut wie viele Medikamente (das <strong>Cytochrom P450</strong> System).</p>
      <p><strong>Das Problem:</strong> Wenn CBD diese Enzyme "beschäftigt", können andere Medikamente nicht richtig abgebaut werden. Ihr Spiegel im Blut steigt.</p>
      <p><strong>Besondere Vorsicht bei:</strong></p>
      <ul>
          <li>Blutverdünnern (Marcumar)</li>
          <li>Bestimmten Antidepressiva</li>
          <li>Herzmedikamenten (Betablockern)</li>
      </ul>
      <p><strong>Die MedLess-Regel:</strong> <em>Nimmst du Medikamente? Dann sprich VOR der CBD-Einnahme immer mit deinem Arzt!</em></p>
      
      <h2>Die Rechtslage: Ist das legal?</h2>
      <p>In Deutschland ist CBD <strong>legal</strong>, solange der THC-Gehalt unter 0,2% (bzw. 0,3%) liegt. Es ist als Öl oder Kapsel meist frei verkäuflich, höher dosierte Präparate sind apothekenpflichtig.</p>
      
      <div class="cta-box">
          <h3>Passt CBD zu deinen Medikamenten?</h3>
          <p>CBD kann ein starker Hebel sein, um von Chemie loszukommen – aber nur, wenn es sicher kombiniert wird. Möchtest du prüfen, ob CBD in deinen persönlichen Reduktionsplan passen könnte?</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose KI-Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style=" font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Studien</h3>
      <ul style=" color: #6B7280;">
          <li><strong>Deutsche Gesellschaft für Schmerzmedizin (2024):</strong> "Reduzierter Opioid-Verbrauch durch Cannabinoide".</li>
          <li><strong>Springer Medizin (2022):</strong> "Cannabinoide reduzieren Opioidverbrauch".</li>
          <li><strong>Ärzteblatt:</strong> "Interaktionspotenzial der Cannabinoide".</li>
          <li><strong>WHO:</strong> "Cannabidiol (CBD) Critical Review Report".</li>
      </ul>
      <p style=" color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient der Information und ersetzt keine ärztliche Beratung. CBD kann Wechselwirkungen mit Medikamenten haben. Sprechen Sie immer mit Ihrem Arzt.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Magenschutz (PPI) absetzen
app.get('/magazin/magenschutz-absetzen-ppi', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Die Säure-Falle: Warum "Magenschutz" oft das Gegenteil bewirkt – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #FED7AA;
      color: #9A3412;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    <!-- Header Image -->
    <div style="width: 100%; max-width: 900px; margin: 0 auto 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <img src="/static/artikel7-magenschutz-ppi.jpg" alt="Person mit Magenschmerzen und Sodbrennen - PPI Rebound-Effekt" style="width: 100%; height: auto; display: block;" />
    </div>
    
    <span class="article-category">Magen & Verdauung</span>
    
    <h1 class="article-title">Die Säure-Falle: Warum "Magenschutz" oft das Gegenteil bewirkt (und wie du davon loskommst)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 20. Januar 2025</span>
      <span><i class="far fa-clock"></i> 6 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>"Nehmen Sie das morgens dazu, um den Magen zu schützen." Ein Satz, den Millionen Deutsche hören. Doch was als kurzfristiger Schutz gedacht war, wird oft zur Dauerlösung mit Risiken. Erfahre, warum das Absetzen so schwer ist und wie es trotzdem klappt.</strong>
      </p>
      
      <hr>
      
      <h2>Der Klassiker: "Nur zur Sicherheit"</h2>
      <p>Es fängt meist harmlos an. Du bekommst ein Schmerzmittel (wie Ibuprofen) oder Antibiotika. Der Arzt verschreibt dazu Pantoprazol oder Omeprazol. "Ein Magenschutz", heißt es. Klingt vernünftig.</p>
      <p>Die Schmerzmittel setzt du nach zwei Wochen ab. Den Magenschutz nimmst du weiter. "Kann ja nicht schaden", denkst du. Monate vergehen. Jahre vergehen.</p>
      <p>Dann vergisst du die Tablette einmal im Urlaub. Und plötzlich ist es da: Ein Brennen, das bis in den Hals steigt. Sodbrennen, schlimmer als je zuvor. Du greifst sofort zur Tablette. Die Erleichterung folgt.</p>
      <p>Deine Schlussfolgerung: <em>"Puh, ich habe wohl wirklich zu viel Magensäure. Gut, dass ich die Tabletten nehme."</em></p>
      <p><strong>Doch das ist ein Trugschluss. Dein Magen ist nicht krank. Er ist abhängig.</strong></p>
      
      <h2>Der Rebound-Effekt: Warum dein Magen rebelliert</h2>
      <p>Diese Medikamente (Protonenpumpenhemmer, kurz PPI) blockieren die Säureproduktion extrem effektiv. Dein Körper ist aber schlau. Er merkt: "Huch, zu wenig Säure für die Verdauung!"</p>
      <p>Was macht er? Er baut <strong>mehr</strong> Säure-Pumpen, um gegen die Blockade anzukämpfen. Solange du die Tablette nimmst, merkst du davon nichts. Aber sobald du sie weglässt, arbeiten all diese neuen Pumpen auf Hochtouren. Es kommt zur "Säureflut".</p>
      <p>Das nennt man den <strong>Rebound-Effekt</strong>. Das Sodbrennen ist kein Zeichen deiner Krankheit, sondern ein Entzugssymptom.</p>
      
      <h2>Sind PPI wirklich harmlos?</h2>
      <p>Leider nein. Wenn wir die Magensäure dauerhaft unterdrücken, zahlen wir einen Preis:</p>
      <ul>
          <li><strong>Nährstoffmangel:</strong> Ohne Säure können Vitamin B12, Magnesium und Calcium schlechter aufgenommen werden.</li>
          <li><strong>Knochenbrüche:</strong> Durch den Calcium-Mangel steigt langfristig das Risiko für Osteoporose.</li>
          <li><strong>Infektionen:</strong> Magensäure ist unsere erste Barriere gegen Bakterien. Fehlt sie, haben Keime leichteres Spiel.</li>
      </ul>
      
      <h2>Der Ausweg: Ausschleichen statt Absetzen</h2>
      <p>Wer PPI von heute auf morgen weglässt, scheitert fast immer am Rebound. Der einzige Weg ist Geduld.</p>
      
      <h3>Die "Jeden-zweiten-Tag"-Methode</h3>
      <p>Ein bewährter Trick ist, die Dosis nicht sofort zu halbieren, sondern die Einnahme-Intervalle zu strecken.</p>
      <ol>
          <li><strong>Schritt 1:</strong> Nimm die Tablette nur noch <strong>jeden 2. Tag</strong> (für 2-4 Wochen).</li>
          <li><strong>Die Brücke:</strong> An den "Pausen-Tagen" kannst du bei Bedarf ein mildes Antazidum (z.B. Rennie, Talcid oder Heilerde) nehmen. Das neutralisiert die Säure, ohne die Pumpen zu beeinflussen.</li>
          <li><strong>Schritt 2:</strong> Reduziere auf jeden 3. Tag.</li>
          <li><strong>Schritt 3:</strong> Versuche es ganz ohne.</li>
      </ol>
      
      <h2>5 natürliche Alternativen bei akutem Brennen</h2>
      <p>Wenn es brennt, musst du nicht leiden. Diese Hausmittel helfen oft sofort:</p>
      <ul>
          <li><strong>Heilerde:</strong> Bindet überschüssige Säure wie ein Schwamm.</li>
          <li><strong>Mandeln:</strong> 5-6 Mandeln sehr lange kauen, bis ein Brei entsteht.</li>
          <li><strong>Kartoffelsaft:</strong> Wirkt stark basisch.</li>
          <li><strong>Kaugummi:</strong> Regt den Speichelfluss an, was die Säure in der Speiseröhre neutralisiert.</li>
      </ul>
      
      <h2>Wie dir MedLess und das ECS dabei helfen</h2>
      <p>Auch hier spielt dein <strong>Endocannabinoid-System (ECS)</strong> eine spannende Rolle. Es reguliert nämlich nicht nur Schmerz, sondern auch die Verdauung und Entzündungen im Magen-Darm-Trakt.</p>
      <p>Wenn du den chemischen "Hammer" (PPI) wegnimmst, kann eine gezielte Stärkung des ECS (z.B. durch Ernährung oder CBD) helfen, den Magen auf natürliche Weise zu beruhigen, ohne die Säureproduktion komplett lahmzulegen.</p>
      
      <div class="cta-box">
          <h3>Raus aus der Säure-Falle?</h3>
          <p>Du willst nicht den Rest deines Lebens Magentabletten schlucken? Wir berechnen dir einen Plan, wie du sicher und sanft davon loskommst – ohne dass das Feuer zurückkehrt.</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style=" font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Fakten</h3>
      <ul style=" color: #6B7280;">
          <li><strong>Deutsche Gesellschaft für Gastroenterologie:</strong> Leitlinie zu PPI.</li>
          <li><strong>Ärzteblatt:</strong> "Langzeitrisiken von Protonenpumpeninhibitoren".</li>
          <li><strong>Apotheken Umschau:</strong> "Magenschutz richtig absetzen".</li>
      </ul>
      <p style=" color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel ersetzt keine ärztliche Beratung. Bei starken Magenschmerzen, Blut im Stuhl oder Vorerkrankungen (z.B. Barrett-Ösophagus) niemals ohne Arzt absetzen.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Täglich 5 Tabletten
app.get('/magazin/taeglich-5-tabletten', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Täglich 5 Tabletten oder mehr? Warum das gefährlich ist. – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #D1FAE5;
      color: #0E5A45;
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content h2 {
      
      font-weight: 700;
      color: #0F5A46;
      margin-top: 56px;
      margin-bottom: 24px;
    }
    
    .article-content p {
      margin-bottom: 24px;
    }
    
    .article-content ul {
      margin: 24px 0;
      padding-left: 32px;
    }
    
    .article-content li {
      margin-bottom: 16px;
    }
    
    .article-content strong {
      color: #0F5A46;
      font-weight: 600;
    }
    
    .article-cta {
      margin: 64px 0;
      padding: 48px;
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      border: 2px solid #D1FAE5;
      border-radius: 16px;
      text-align: center;
    }
    
    .article-cta h3 {
      
      font-weight: 600;
      color: #0F5A46;
      margin-bottom: 24px;
    }
    
    .cta-button-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 32px;
      
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #0E5A45, #10B981);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(14, 90, 69, 0.2);
    }
    
    .cta-button-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 90, 69, 0.3);
    }
    
    footer {
      background: linear-gradient(135deg, #0E5A45, #10B981);
      padding: 60px 0 20px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      text-align: center;
    }
    
    .footer-content p {
      
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.85);
    }
    
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }
      
      .article-detail {
        padding: 60px 24px;
      }
      
      .article-content {
        
      }
      
      .article-cta {
        padding: 32px 24px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="header-logo">
        <span class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </span>
      </a>
      
      <nav class="header-nav">
        <a href="/#ueber-medless">Über MEDLESS</a>
        <a href="/#funktionsweise">Funktionsweise</a>
        <a href="/#faq">FAQ</a>
        <a href="/#magazin">Magazin</a>
        <a href="/fachkreise">Für Ärzt:innen & Apotheken</a>
        <a href="/#kontakt">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Content -->
  <article class="article-detail">
    <!-- Header Image -->
    <div style="width: 100%; max-width: 900px; margin: 0 auto 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <img src="/static/polypharmazie-original-full.jpg" alt="Ältere Hand greift nach grün-weißer Kapsel aus weißer Schale voller verschiedener Medikamente" style="width: 100%; height: auto; display: block;" />
    </div>
    
    <span class="article-category">Polypharmazie</span>
    <h1 class="article-title">Täglich 5 Tabletten oder mehr? Warum das gefährlich ist.</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> Januar 2025</span>
      <span><i class="far fa-clock"></i> 8 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      <p>
        Ab fünf Medikamenten täglich sprechen Ärzte von <strong>Polypharmazie</strong> – ein Zustand, der längst nicht mehr nur ältere Menschen betrifft. Immer mehr Erwachsene schlucken mehrere Tabletten pro Tag, oft über Jahre hinweg, ohne die Risiken wirklich zu kennen.
      </p>
      
      <p>
        Doch was passiert, wenn sich Wirkstoffe im Körper gegenseitig beeinflussen? Und warum wird das Risiko so selten besprochen?
      </p>
      
      <h2>Was ist Polypharmazie?</h2>
      
      <p>
        Polypharmazie beschreibt die gleichzeitige Einnahme von fünf oder mehr verschreibungspflichtigen Medikamenten. Offiziell ist das keine Krankheit – aber ein erheblicher Risikofaktor.
      </p>
      
      <p>
        <strong>Das Problem:</strong> Jedes Medikament wird einzeln getestet und verschrieben. Doch wie sie zusammenwirken, wenn fünf, sechs oder sogar zehn Wirkstoffe gleichzeitig im Blutkreislauf sind, ist oft unklar.
      </p>
      
      <h2>Die Risiken: Wenn Medikamente miteinander kämpfen</h2>
      
      <p>
        Je mehr Medikamente, desto höher das Risiko für:
      </p>
      
      <ul>
        <li><strong>Wechselwirkungen:</strong> Ein Medikament verstärkt oder schwächt ein anderes. Das kann lebensbedrohlich werden (z. B. bei Blutverdünnern).</li>
        <li><strong>Unerwünschte Nebenwirkungen:</strong> Müdigkeit, Schwindel, Übelkeit, Verwirrtheit – oft werden diese Symptome als „Altersschwäche" abgetan, obwohl sie direkt mit Medikamenten zusammenhängen.</li>
        <li><strong>Kaskadeneffekte:</strong> Ein Medikament verursacht ein Problem, das mit einem weiteren Medikament behandelt wird – und so weiter. Die Medikamentenliste wächst, der Körper leidet.</li>
        <li><strong>Erhöhtes Sturzrisiko:</strong> Besonders bei älteren Menschen steigt durch Schwindel und Benommenheit das Risiko für schwere Stürze.</li>
        <li><strong>Kognitive Beeinträchtigungen:</strong> Manche Wirkstoffkombinationen können das Denkvermögen, die Konzentration und das Gedächtnis beeinträchtigen.</li>
      </ul>
      
      <h2>Warum passiert das so oft?</h2>
      
      <p>
        In vielen Fällen ist Polypharmazie keine bewusste Entscheidung, sondern das Ergebnis von:
      </p>
      
      <ul>
        <li><strong>Symptombehandlung statt Ursachenanalyse:</strong> Ein neues Symptom wird mit einem neuen Medikament behandelt – ohne zu hinterfragen, ob es von einem bereits eingenommenen Medikament kommt.</li>
        <li><strong>Mehrfachbehandlung:</strong> Verschiedene Ärzte verschreiben Medikamente, ohne über die gesamte Medikamentenliste Bescheid zu wissen.</li>
        <li><strong>Zeitmangel in der Praxis:</strong> Ärzte haben oft nicht genug Zeit, um die gesamte Medikation eines Patienten zu überprüfen.</li>
        <li><strong>Angst vor dem Absetzen:</strong> Viele Patienten trauen sich nicht, ein Medikament zu hinterfragen oder abzusetzen – aus Angst vor Rückfällen oder Entzugssymptomen.</li>
      </ul>
      
      <h2>Was kannst du tun?</h2>
      
      <p>
        Wenn du täglich fünf oder mehr Medikamente einnimmst, solltest du aktiv werden:
      </p>
      
      <ul>
        <li><strong>Medikamentenliste aktualisieren:</strong> Erstelle eine vollständige Liste aller Medikamente (inklusive rezeptfreier Präparate und Nahrungsergänzungsmittel) und besprich sie mit deinem Arzt.</li>
        <li><strong>Regelmäßige Überprüfungen:</strong> Frag deinen Arzt, ob alle Medikamente noch notwendig sind. Oft können Dosierungen angepasst oder Medikamente abgesetzt werden.</li>
        <li><strong>Zweitmeinung einholen:</strong> Ein Gespräch mit einem Apotheker oder einem anderen Arzt kann helfen, Wechselwirkungen zu erkennen.</li>
        <li><strong>Natürliche Unterstützung prüfen:</strong> Moderne Ansätze wie die Stärkung des Endocannabinoid-Systems können dabei helfen, den Medikamentenbedarf zu reduzieren – immer in Absprache mit einem Arzt.</li>
      </ul>
      
      <!-- CTA Section -->
      <div class="article-cta">
        <h3>Möchtest du deine Medikamente prüfen?</h3>
        <p style="margin-bottom: 24px;  color: #374151;">
          MEDLESS hilft dir, einen individuellen Ausschleichplan zu erstellen – KI-berechnet, wissenschaftlich fundiert und für die ärztliche Begleitung entwickelt.
        </p>
        <a href="/#planner-section" class="cta-button-primary">
          Kostenlos Analyse starten
          <i class="fas fa-arrow-right"></i>
        </a>
      </div>
      
      <h2>Fazit</h2>
      
      <p>
        Polypharmazie ist ein stilles, aber wachsendes Problem. Viele Menschen nehmen täglich mehrere Medikamente, ohne sich der Risiken bewusst zu sein. Doch es gibt Möglichkeiten, die Medikamentenlast sicher zu reduzieren – mit ärztlicher Begleitung, einem individuellen Plan und moderner Unterstützung durch das Endocannabinoid-System.
      </p>
      
      <p>
        <strong>Der erste Schritt:</strong> Bewusstsein schaffen. Der zweite: Handeln.
      </p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; ">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Main Route: New Marketing Homepage (served as static file via serveStatic)
// The static index.html and styles.css are in the public folder and copied to dist during build
// They will be served automatically by Cloudflare Pages

// Main MEDLESS Tool Application (5-step form with API integration)
app.get('/app', (c) => {
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
  
  <!-- Google Fonts (SAME AS LANDING PAGE) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- FontAwesome -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- jsPDF for PDF Generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <!-- Axios for API calls -->
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <!-- Custom CSS (UNIFIED) -->
  <link rel="stylesheet" href="/styles.css">

  <style>
    :root {
      --primary: #0b7b6c;
      --primary-dark: #075448;
      --bg: #f5f7fa;
      --text: #1f2933;
      --accent: #f97316;
      --danger: #b91c1c;
      --radius-lg: 16px;
      --radius-md: 10px;
      --shadow-soft: 0 10px 25px rgba(15, 23, 42, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.5;
    }

    a {
      color: var(--primary);
      text-decoration: none;
    }

    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.2rem 1.2rem 2.5rem;
    }

    /* HERO */
    .hero {
      margin-top: 1.2rem;
      padding: 1.5rem 1.3rem;
      border-radius: 24px;
      background: radial-gradient(circle at top left, #e0fdf7, #f5f7fa);
      box-shadow: var(--shadow-soft);
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.7rem;
      border-radius: 999px;
      background: rgba(11, 123, 108, 0.12);
      color: var(--primary-dark);
      
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.6rem;
    }

    .hero h1 {
      margin: 0 0 0.6rem;
      
      line-height: 1.2;
    }

    .hero-sub {
      margin: 0 0 1rem;
      
      color: #4b5563;
    }

    .hero-grid {
      display: grid;
      gap: 1rem;
      margin-top: 1rem;
    }

    .hero-list {
      margin: 0;
      padding-left: 1.1rem;
      
      color: #374151;
    }

    .hero-list li + li {
      margin-top: 0.2rem;
    }

    .hero-cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      align-items: center;
      margin-top: 1rem;
    }

    .btn-primary {
      border: none;
      cursor: pointer;
      padding: 0.7rem 1.2rem;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #fff;
      font-weight: 600;
      
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: 0 10px 20px rgba(11, 123, 108, 0.35);
      transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(11, 123, 108, 0.45);
    }

    .btn-ghost {
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      padding: 0.6rem 1rem;
      background: rgba(255, 255, 255, 0.7);
      
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .note {
      
      color: #6b7280;
    }

    /* GENERIC SECTIONS */
    section {
      margin-top: 2rem;
    }

    section h2 {
      
      margin-bottom: 0.5rem;
    }

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
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 1rem;
      box-shadow: var(--shadow-soft);
    }

    .card h3 {
      margin-top: 0;
      margin-bottom: 0.25rem;
      
    }

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
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-title {
      font-weight: 600;
      
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
      
      font-weight: 500;
      display: block;
      margin-bottom: 0.2rem;
    }

    input[type="text"],
    input[type="email"],
    input[type="number"],
    select {
      width: 100%;
      border-radius: var(--radius-md);
      border: 1px solid #cbd5e1;
      padding: 0.55rem 0.6rem;
      
      outline: none;
      background: #f9fafb;
    }

    input:focus,
    select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 1px rgba(11, 123, 108, 0.3);
      background: #fff;
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
  
  <!-- TailwindCSS & FontAwesome für Loading-Animation -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <style>
    /* Zusätzliche Tailwind-kompatible Styles */
    .section-card {
      background: white;
      border-left: 4px solid #0b7b6c;
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
<body>
  <!-- HEADER -->
  <header class="header">
    <div class="container">
      <nav class="nav">
        <span class="logo">
          <span class="logo-text">Medless</span>
        </span>
        <ul class="nav-links">
          <li><a href="/#how-it-works">So funktioniert's</a></li>
          <li><a href="/#benefits">Vorteile</a></li>
          <li><a href="/#faq">FAQ</a></li>
          <li><a href="/magazin">Magazin</a></li>
          <li><a href="/fachkreise">Für Ärzt:innen & Apotheken</a></li>
        </ul>
        <button class="btn-primary-sm" onclick="window.location.href='/app'">Orientierungsplan starten</button>
      </nav>
    </div>
  </header>

  <main>
    <!-- FORMULAR MIT MULTISTEP -->
    <section id="tool">
      <h2>Erstellen Sie Ihren persönlichen MEDLESS-Orientierungsplan</h2>
      <p class="muted">
        Folgen Sie den Schritten, um Ihre aktuelle Medikation strukturiert zu erfassen und einen persönlichen MEDLESS-Orientierungsplan als Gesprächsgrundlage für Ihren Arzt zu erhalten. Keine Therapie, keine Diagnose – sondern eine klare Übersicht.
      </p>

      <!-- Progress Stepper - FIXED HEIGHT WRAPPER prevents vertical movement -->
      <div style="min-height: 80px; margin-bottom: 1.5rem; margin-top: 0;">
        <!-- Circles and Progress Bars Container - Fixed 48px containers -->
        <div style="display: grid; grid-template-columns: 48px 1fr 48px 1fr 48px 1fr 48px 1fr 48px; align-items: center; max-width: 800px; margin: 0 auto 8px; gap: 0;">
          <!-- Step 1 Circle - Fixed 48px container -->
          <div id="step-indicator-1" style="width: 48px; height: 48px; min-width: 48px; min-height: 48px; border-radius: 50%; background: #0b7b6c; color: white; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;">1</div>
          <!-- Progress Bar 1 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-1" style="height: 100%; background: #0b7b6c; width: 100%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 2 Circle - Fixed 48px container -->
          <div id="step-indicator-2" style="width: 48px; height: 48px; min-width: 48px; min-height: 48px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;">2</div>
          <!-- Progress Bar 2 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-2" style="height: 100%; background: #0b7b6c; width: 0%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 3 Circle - Fixed 48px container -->
          <div id="step-indicator-3" style="width: 48px; height: 48px; min-width: 48px; min-height: 48px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;">3</div>
          <!-- Progress Bar 3 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-3" style="height: 100%; background: #0b7b6c; width: 0%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 4 Circle - Fixed 48px container -->
          <div id="step-indicator-4" style="width: 48px; height: 48px; min-width: 48px; min-height: 48px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;">4</div>
          <!-- Progress Bar 4 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-4" style="height: 100%; background: #0b7b6c; width: 0%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 5 Circle - Fixed 48px container -->
          <div id="step-indicator-5" style="width: 48px; height: 48px; min-width: 48px; min-height: 48px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;">5</div>
        </div>
        
        <!-- Labels Container - EXACTLY ALIGNED with 48px circles, stable position -->
        <div style="display: grid; grid-template-columns: 48px 1fr 48px 1fr 48px 1fr 48px 1fr 48px; max-width: 800px; margin: 0 auto; gap: 0;">
          <!-- Label 1 -->
          <span style=" color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Name</span>
          <span></span>
          <!-- Label 2 -->
          <span style=" color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Körperdaten</span>
          <span></span>
          <!-- Label 3 -->
          <span style=" color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Medikation</span>
          <span></span>
          <!-- Label 4 -->
          <span style=" color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Orientierungsplan</span>
          <span></span>
          <!-- Label 5 -->
          <span style=" color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Zusammenfassung</span>
        </div>
      </div>

      <form id="medication-form">
        <!-- STEP 1: Name & Gender -->
        <div id="step-1" class="form-step">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 1: Persönliche Angaben</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Damit wir Sie persönlich ansprechen können.</p>
            
            <div class="form-row">
              <div>
                <label for="first-name">Ihr Vorname *</label>
                <input type="text" id="first-name" name="first_name" placeholder="z.B. Maria" required />
              </div>
            </div>

            <div class="form-row">
              <div>
                <label>Geschlecht *</label>
                <div class="inline-row">
                  <label class="radio-pill">
                    <input type="radio" name="gender" value="female" required />
                    <span>Weiblich</span>
                  </label>
                  <label class="radio-pill">
                    <input type="radio" name="gender" value="male" />
                    <span>Männlich</span>
                  </label>
                  <label class="radio-pill">
                    <input type="radio" name="gender" value="diverse" />
                    <span>Divers</span>
                  </label>
                </div>
              </div>
            </div>

            <div style="text-align: right; margin-top: 1.5rem;">
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 2: Body Data -->
        <div id="step-2" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 2: Körperdaten</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Diese Daten helfen uns, die Dosierung individuell zu berechnen.</p>
            
            <div class="form-row">
              <div>
                <label for="age">Alter (Jahre) *</label>
                <input type="number" id="age" name="age" placeholder="z.B. 45" min="18" max="120" required />
                <div class="helper">Für altersgerechte Dosierung</div>
              </div>
              <div>
                <label for="weight">Gewicht (kg) *</label>
                <input type="number" id="weight" name="weight" placeholder="z.B. 70" min="30" max="250" step="0.1" required />
                <div class="helper">In Kilogramm</div>
              </div>
              <div>
                <label for="height">Größe (cm) *</label>
                <input type="number" id="height" name="height" placeholder="z.B. 170" min="120" max="230" required />
                <div class="helper">In Zentimetern</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 3: Medications -->
        <div id="step-3" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 3: Ihre Medikation</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Geben Sie hier Ihre aktuellen Medikamente ein. Diese Daten werden genutzt, um einen strukturierten Überblick und einen MEDLESS-Orientierungsplan für Ihr Arztgespräch zu erstellen. Es werden keine Therapieempfehlungen berechnet.</p>
            
            <div id="medication-inputs" style="margin-bottom: 1rem;">
              <!-- Wird durch JavaScript befüllt -->
            </div>

            <button type="button" id="add-medication" class="btn-small" style="margin-bottom: 1rem;">
              + Weiteres Medikament hinzufügen
            </button>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 4: Plan Settings -->
        <div id="step-4" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 4: Orientierungsplan-Einstellungen</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Legen Sie hier die Einstellungen für Ihren MEDLESS-Orientierungsplan fest. Auf dieser Basis wird Ihr persönlicher Orientierungsplan für das Gespräch mit Ihrem Arzt berechnet. Alle medizinischen Entscheidungen trifft ausschließlich Ihr Arzt.</p>
            
            <div class="form-row" style="margin-bottom: 1.5rem;">
              <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border: 2px solid #14b8a6;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0b7b6c, #14b8a6); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-calendar-alt" style="color: white; "></i>
                  </div>
                  <div>
                    <label for="duration-weeks" style=" font-weight: 600; color: #0b7b6c; margin: 0;">Plan-Dauer (Wochen) *</label>
                    <p style=" color: #6b7280; margin: 0.25rem 0 0 0;">Wie lange soll Ihr Orientierungsplan dauern?</p>
                  </div>
                </div>
                <select id="duration-weeks" name="duration_weeks" required style="width: 100%; padding: 0.875rem;  border: 2px solid #14b8a6; border-radius: 8px; background: white;">
                  <option value="">-- Bitte wählen --</option>
                  <option value="4">4 Wochen – Schneller Einstieg</option>
                  <option value="6">6 Wochen – Zügig</option>
                  <option value="8" selected>8 Wochen – Standard (empfohlen) ⭐</option>
                  <option value="10">10 Wochen – Behutsam</option>
                  <option value="12">12 Wochen – Sehr langsam</option>
                </select>
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #059669;">
                  <i class="fas fa-info-circle" style="color: #059669; margin-right: 0.5rem;"></i>
                  <span style=" color: #374151;">Empfohlen: 8–12 Wochen für eine sanfte und stabile Reduktion.</span>
                </div>
              </div>
            </div>

            <div class="form-row" style="margin-bottom: 1.5rem;">
              <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border: 2px solid #14b8a6;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0b7b6c, #14b8a6); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-chart-line" style="color: white; "></i>
                  </div>
                  <div>
                    <label for="reduction-goal" style=" font-weight: 600; color: #0b7b6c; margin: 0;">Reduktionsziel *</label>
                    <p style=" color: #6b7280; margin: 0.25rem 0 0 0;">Wie viel möchten Sie reduzieren?</p>
                  </div>
                </div>
                <select id="reduction-goal" name="reduction_goal" required style="width: 100%; padding: 0.875rem;  border: 2px solid #14b8a6; border-radius: 8px; background: white;">
                  <option value="">-- Bitte wählen --</option>
                  <option value="10">10% Reduktion</option>
                  <option value="20">20% Reduktion</option>
                  <option value="30">30% Reduktion</option>
                  <option value="40">40% Reduktion</option>
                  <option value="50" selected>50% Reduktion (empfohlen) ⭐</option>
                  <option value="60">60% Reduktion</option>
                  <option value="70">70% Reduktion</option>
                  <option value="80">80% Reduktion</option>
                  <option value="90">90% Reduktion</option>
                  <option value="100">100% Reduktion (komplett absetzen)</option>
                </select>
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #059669;">
                  <i class="fas fa-lightbulb" style="color: #059669; margin-right: 0.5rem;"></i>
                  <span style=" color: #374151;">Tipp: Beginnen Sie mit 30–50 % für einen sicheren und gut verträglichen Start.</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border: 2px solid #f59e0b; display: none;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b, #fbbf24); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-chart-line" style="color: white; "></i>
                  </div>
                  <div>
                    <label for="reduction-goal-hidden" style=" font-weight: 600; color: #b45309; margin: 0;">Reduktionsziel (%) *</label>
                    <p style=" color: #6b7280; margin: 0.25rem 0 0 0;">Wie viel Prozent Ihrer Medikamente möchten Sie reduzieren?</p>
                  </div>
                </div>
                <select id="reduction-goal-hidden" name="reduction_goal" required style="width: 100%; padding: 0.875rem;  border: 2px solid #f59e0b; border-radius: 8px; background: white;">
                  <option value="">-- Bitte wählen --</option>
                  <option value="10">10% – Minimale Reduktion</option>
                  <option value="20">20% – Leichte Reduktion</option>
                  <option value="30">30% – Moderate Reduktion</option>
                  <option value="40">40% – Deutliche Reduktion</option>
                  <option value="50" selected>50% – Halbierung (empfohlen) ⭐</option>
                  <option value="60">60% – Starke Reduktion</option>
                  <option value="70">70% – Sehr starke Reduktion</option>
                  <option value="80">80% – Maximale Reduktion</option>
                  <option value="90">90% – Fast vollständig</option>
                  <option value="100">100% – Vollständiger Verzicht (nur nach ärztlicher Rücksprache!)</option>
                </select>
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <i class="fas fa-exclamation-triangle" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                  <span style=" color: #374151;">Wichtig: Medikamentenreduktion nur in Absprache mit Ihrem Arzt!</span>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 5: Email & Summary -->
        <div id="step-5" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 5: E-Mail & Zusammenfassung</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Überprüfen Sie Ihre Angaben in Ruhe und geben Sie Ihre E-Mail-Adresse ein. Dorthin senden wir den Download-Link zu Ihrem MEDLESS-Orientierungsplan.</p>
            
            <div class="form-row">
              <div>
                <label for="email">Ihre E-Mail-Adresse *</label>
                <input type="email" id="email" name="email" placeholder="ihre.email@beispiel.de" required />
                <div class="helper">Hierhin schicken wir den Download-Link zu Ihrem Dosierungsplan</div>
              </div>
            </div>

            <div class="card" style="background: #f9fafb; margin-top: 1.5rem; padding: 1rem;">
              <h4 style=" font-weight: 600; margin-bottom: 0.8rem;">Ihre Angaben im Überblick</h4>
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
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="submit" class="btn-primary">
                Orientierungsplan erstellen <span>✓</span>
              </button>
            </div>
          </div>
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
                </div>
              </div>
              
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
                </div>
              </div>
              
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
            </div>
          </div>
          
          
          <!-- Final "Plan ist fertig!" Message (hidden initially) -->
          <div id="plan-ready-message" style="display: none; margin-top: 1rem;">
            <div id="plan-ready-card" style="background: linear-gradient(135deg, #0b7b6c 0%, #059669 100%); padding: 1.5rem; border-radius: 14px; box-shadow: 0 8px 24px rgba(11, 123, 108, 0.3); text-align: center; animation: gentle-pulse 2s ease-in-out infinite;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <i class="fas fa-file-medical" style="color: white; "></i>
                <h3 style="margin: 0;  font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Ihr persönlicher MEDLESS-Orientierungsplan ist fertig!</h3>
              </div>
              <p style="margin: 0; color: rgba(255,255,255,0.95);  font-weight: 500; margin-bottom: 1rem;">
                Ihr persönlicher Orientierungsplan wurde erstellt. Er fasst Ihre Angaben zu Medikamenten und Einnahmezeiten übersichtlich zusammen und dient als Grundlage für das Gespräch mit Ihrem Arzt. MEDLESS ersetzt keine ärztliche Beratung und ist kein Medizinprodukt.
              </p>
              <button id="show-plan-button" style="
                background: white;
                color: #0b7b6c;
                border: none;
                padding: 0.75rem 1.75rem;
                border-radius: 24px;
                
                font-weight: 700;
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
            indicator.style.background = '#059669';
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
        const age = document.getElementById('age').value;
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        
        if (!age || age < 18 || age > 120) {
          alert('Bitte geben Sie ein gültiges Alter ein (18-120 Jahre).');
          return false;
        }
        if (!weight || weight < 30 || weight > 250) {
          alert('Bitte geben Sie ein gültiges Gewicht ein (30-250 kg).');
          return false;
        }
        if (!height || height < 120 || height > 230) {
          alert('Bitte geben Sie eine gültige Größe ein (120-230 cm).');
          return false;
        }
        return true;
      }
      
      if (stepNumber === 3) {
        // Check for medication inputs (new autocomplete version)
        const medicationInputs = document.querySelectorAll('.medication-display-input');
        const dosageInputs = document.querySelectorAll('input[name="medication_mg_per_day[]"]');
        
        let hasValidMedication = false;
        let emptyMedicationName = false;
        let emptyDosage = false;
        
        medicationInputs.forEach((medInput, index) => {
          const medName = medInput.value.trim();
          const dosageValue = dosageInputs[index] ? dosageInputs[index].value.trim() : '';
          
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
        const duration = document.getElementById('duration-weeks').value;
        const reductionGoal = document.getElementById('reduction-goal').value;
        
        if (!duration) {
          alert('Bitte wählen Sie eine Plan-Dauer aus.');
          return false;
        }
        
        if (!reductionGoal) {
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
      document.getElementById('summary-age').textContent = document.getElementById('age').value + ' Jahre' || '-';
      document.getElementById('summary-weight').textContent = document.getElementById('weight').value + ' kg' || '-';
      document.getElementById('summary-height').textContent = document.getElementById('height').value + ' cm' || '-';
      
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
      const durationSelect = document.getElementById('duration-weeks');
      const durationText = durationSelect.options[durationSelect.selectedIndex]?.text || '-';
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
  <footer style="background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 48px 32px; margin-top: 80px; text-align: center; color: #6B7280; font-size: 0.875rem;">
    <p style="margin: 0;">© 2025 Medless | <a href="/impressum" style="color: #0b7b6c; text-decoration: none;">Impressum</a> | <a href="/datenschutz" style="color: #0b7b6c; text-decoration: none;">Datenschutz</a></p>
    <p id="build-info-tag" style="margin: 12px 0 0 0; opacity: 0.6;">Loading build info...</p>
  </footer>
  
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
        document.getElementById('build-info-tag').textContent = \`Build: \${buildDate} | \${shortHash} (\${shortCommit})\`;
      } catch (error) {
        console.warn('Could not load build info:', error);
        document.getElementById('build-info-tag').textContent = 'Build info unavailable';
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
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 24px;
      --space-6: 32px;
      --space-7: 48px;
      --space-8: 64px;
      --space-9: 96px;
      --primary-dark-green: #0C5C4C;
      --primary-green: #0F7A67;
      --accent-mint: #CFF1E7;
      --accent-mint-light: #E8F8F4;
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
      --background-ultra-light: #F9FAFB;
      --text-body-color: #374151;
      --text-muted: #6B7280;
      --border-light: #E5E7EB;
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
  const html = renderPatientReportExample()
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
