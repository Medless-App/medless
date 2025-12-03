// ============================================================
// TYPE DEFINITIONS FOR POST /api/analyze RESPONSE
// ============================================================
// This file contains all TypeScript types for the MEDLESS /api/analyze endpoint.
// These types are derived from the actual JSON response structure in src/index.tsx.
// DO NOT modify these types without understanding their impact on the calculation logic.

/**
 * Main response type for POST /api/analyze endpoint
 */
export interface AnalyzeResponse {
  success: boolean;
  analysis: AnalysisEntry[];
  maxSeverity: 'low' | 'medium' | 'high' | 'critical';
  weeklyPlan: WeeklyPlanEntry[];
  reductionGoal: number;
  costs: CostAnalysis;
  cbdProgression: CbdProgression;
  product: ProductInfo;
  personalization: Personalization;
  warnings: string[];
  categorySafety: CategorySafety;
  planIntelligence: PlanIntelligence;
}

/**
 * Analysis entry for a single medication
 */
export interface AnalysisEntry {
  medication: MedicationWithCategory | MedicationNotFound;
  interactions: CbdInteraction[];
  mgPerDay: number;
  warning?: string;
}

/**
 * Full medication data with category information
 */
export interface MedicationWithCategory {
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
  
  // Medication-specific pharmacokinetic fields (Migration 0005)
  half_life_hours?: number | null;
  therapeutic_min_ng_ml?: number | null;
  therapeutic_max_ng_ml?: number | null;
  withdrawal_risk_score?: number | null;
  cbd_interaction_strength?: 'low' | 'medium' | 'high' | 'critical' | null;
  
  // Marker that medication was found
  found?: boolean;
}

/**
 * Medication not found in database
 */
export interface MedicationNotFound {
  name: string;
  found: false;
}

/**
 * Medication category data
 */
export interface MedicationCategory {
  id: number;
  name: string;
  risk_level: string | null;
  can_reduce_to_zero: number | null;
  default_min_target_fraction: number | null;
  max_weekly_reduction_pct: number | null;
  requires_specialist: number | null;
  notes: string | null;
}

/**
 * CBD interaction data
 */
export interface CbdInteraction {
  id: number;
  medication_id: number;
  interaction_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mechanism: string;
  recommendation: string;
  source_url: string;
}

/**
 * Weekly plan entry with medication reduction and CBD dosing
 */
export interface WeeklyPlanEntry {
  week: number;
  medications: WeeklyMedication[];
  totalMedicationLoad: number;
  cbdDose: number;
  kannasanProduct: KannasanProduct;
  morningSprays: number;
  eveningSprays: number;
  totalSprays: number;
  actualCbdMg: number;
  bottleStatus: BottleStatus;
  // PlanIntelligenz 2.0: New weekly metrics
  cannabinoidMgPerKg: number | null;
  cannabinoidToLoadRatio: number | null;
  weeklyCannabinoidIntakeMg: number;
}

/**
 * Weekly medication dosage data
 */
export interface WeeklyMedication {
  name: string;
  startMg: number;
  currentMg: number;
  targetMg: number;
  reduction: number;
  reductionPercent: number;
  reductionSpeedPct: number; // PlanIntelligenz 2.0
  safety?: SafetyInfo; // Only present in week 1
}

/**
 * Safety information for medication reduction
 */
export interface SafetyInfo {
  appliedCategoryRules: boolean;
  limitedByCategory: boolean;
  notes: string[];
}

/**
 * MEDLESS/Kannasan product information
 */
export interface KannasanProduct {
  nr: number;
  name: string;
  cbdPerSpray: number;
}

/**
 * Bottle tracking status
 */
export interface BottleStatus {
  used: number;
  remaining: number;
  totalCapacity: number;
  emptyInWeeks: number;
  productChangeNext: boolean;
}

/**
 * Cost analysis for the entire plan
 */
export interface CostAnalysis {
  costBreakdown: CostBreakdownEntry[];
  totalCost: number;
  totalBottles: number;
  totalSprays: number;
}

/**
 * Cost breakdown entry per product
 */
export interface CostBreakdownEntry {
  product: string;
  productNr: number;
  pricePerBottle: number;
  bottleCount: number;
  totalSprays: number;
  totalCost: number;
  weeksUsed: string;
}

/**
 * CBD progression data
 */
export interface CbdProgression {
  startMg: number;
  endMg: number;
  weeklyIncrease: number;
}

/**
 * Detailed product information
 */
export interface ProductInfo {
  name: string;
  nr: number;
  type: string;
  packaging: string;
  concentration: string;
  cbdPerSpray: number;
  twoSprays: string;
  dosageUnit: string;
  totalSpraysPerDay: number;
  morningSprays: number;
  eveningSprays: number;
  actualDailyMg: number;
  application: string;
  note: string;
}

/**
 * Personalization data based on user input
 */
export interface Personalization {
  firstName: string | null;
  gender: 'male' | 'female' | 'diverse' | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bsa: number | null;
  idealWeightKg: number | null; // PlanIntelligenz 2.0
  cbdStartMg: number;
  cbdEndMg: number;
  hasBenzoOrOpioid: boolean;
  notes: string[];
}

/**
 * Category safety summary
 */
export interface CategorySafety {
  appliedRules: boolean;
  notes: string[];
}

/**
 * PlanIntelligenz 2.0: Overall plan metrics
 */
export interface PlanIntelligence {
  overallStartLoad: number;
  overallEndLoad: number;
  totalLoadReductionPct: number;
  avgReductionSpeedPct: number;
  reductionSpeedCategory: 'sehr langsam' | 'moderat' | 'relativ schnell';
  weeksToCbdTarget: number | null;
  cannabinoidIncreasePctPerWeek: number | null;
  totalMedicationCount: number;
  sensitiveMedCount: number;
}
