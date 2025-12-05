-- Migration 0006: Update Safety Rules for High-Risk Categories
-- ============================================================
-- This migration adds category-level safety defaults for four critical
-- medication categories that were previously lacking proper safety rules.
--
-- CONTEXT:
-- Based on CATEGORY_ANALYSIS_REPORT.md, 60% of categories (15/25) have NULL
-- safety rules, causing the system to fall back to potentially unsafe defaults
-- (e.g., 15%/week reduction for high-risk medications).
--
-- AFFECTED CATEGORIES (80 medications total):
-- - ID 2: Antidepressiva (31 medications)
-- - ID 3: Antiepileptika (21 medications)
-- - ID 5: Psychopharmaka (21 medications)
-- - ID 8: Immunsuppressiva (3 medications)
--
-- PRIORITY HIERARCHY (unchanged):
-- 1. Medication-specific fields (highest priority)
-- 2. Category defaults (NEW - this migration)
-- 3. System defaults (15%/week, 0% min target) ← fallback
--
-- IMPORTANT: This migration does NOT change applyCategorySafetyRules() logic,
-- only provides better defaults for the existing calculation flow.
--
-- ============================================================

-- Category 2: Antidepressiva (SSRI, SNRI, TCA, etc.)
-- ------------------------------------------------------------
-- RISK: Discontinuation syndrome (especially short half-life SSRIs)
-- STRATEGY: Allow full reduction but enforce gradual tapering
--
-- Medical Rationale:
-- - Antidepressants CAN be fully discontinued (can_reduce_to_zero = 1)
-- - BUT require slow tapering (8%/week max vs. 15% system default)
-- - Short half-life SSRIs (Paroxetine, Venlafaxine) particularly risky
-- - Symptoms: Dizziness, flu-like symptoms, anxiety, insomnia
--
UPDATE medication_categories
SET 
  can_reduce_to_zero = 1,              -- Can be fully discontinued
  default_min_target_fraction = 0.0,   -- No hard minimum (flexible endpoint)
  max_weekly_reduction_pct = 8.0,      -- Max 8%/week (vs. 15% default)
  requires_specialist = 0,              -- Can be managed by GP with guidance
  notes = 'Graduelles Ausschleichen empfohlen; Absetzsyndrom möglich, insbesondere bei kurzen Halbwertszeiten (z.B. Paroxetin, Venlafaxin). HWZ-Anpassung wird automatisch angewendet.'
WHERE id = 2;

-- Category 3: Antiepileptika (Anti-Seizure Medications)
-- ------------------------------------------------------------
-- RISK: Seizure breakthrough if reduced too quickly or stopped abruptly
-- STRATEGY: NEVER allow full discontinuation, maintain 25% minimum
--
-- Medical Rationale:
-- - CRITICAL: Never reduce to zero (can_reduce_to_zero = 0)
-- - Maintain at least 25% of start dose as maintenance (min_target = 0.25)
-- - Seizure risk increases dramatically with abrupt reduction
-- - Requires neurologist supervision for any reduction plan
-- - Even non-epilepsy uses (neuropathic pain, mood) need careful tapering
--
UPDATE medication_categories
SET 
  can_reduce_to_zero = 0,              -- NEVER reduce to zero
  default_min_target_fraction = 0.25,  -- Minimum 25% maintenance dose
  max_weekly_reduction_pct = 10.0,     -- Max 10%/week
  requires_specialist = 1,              -- Neurologist supervision required
  notes = 'Niemals abrupt absetzen – erhöhtes Anfallsrisiko! Reduktion nur unter fachärztlicher Kontrolle. Mindestens 25% der Startdosis als Erhaltungsdosis empfohlen.'
WHERE id = 3;

-- Category 5: Psychopharmaka (Antipsychotics, Mood Stabilizers, etc.)
-- ------------------------------------------------------------
-- RISK: Relapse, withdrawal psychosis, rebound symptoms
-- STRATEGY: Conservative reduction with 25% minimum floor
--
-- Medical Rationale:
-- - High relapse risk if reduced too aggressively (min_target = 0.25)
-- - Antipsychotics: Risk of withdrawal psychosis, tardive dyskinesia
-- - Mood stabilizers: Risk of manic/depressive episode
-- - Slower reduction than antidepressants (8%/week)
-- - Psychiatric monitoring essential
--
UPDATE medication_categories
SET 
  can_reduce_to_zero = 0,              -- Should not reduce to zero
  default_min_target_fraction = 0.25,  -- Minimum 25% maintenance dose
  max_weekly_reduction_pct = 8.0,      -- Max 8%/week (conservative)
  requires_specialist = 1,              -- Psychiatrist supervision required
  notes = 'Erhöhtes Absetz- und Rückfallrisiko. Engmaschige psychiatrische Überwachung erforderlich. Mindestens 25% der Startdosis als Sicherheitsuntergrenze.'
WHERE id = 5;

-- Category 8: Immunsuppressiva (Post-Transplant, Autoimmune)
-- ------------------------------------------------------------
-- RISK: Organ rejection, autoimmune flare, life-threatening complications
-- STRATEGY: MOST CONSERVATIVE - 50% minimum, slowest reduction
--
-- Medical Rationale:
-- - HIGHEST RISK: Organ rejection in transplant patients
-- - Autoimmune flare in rheumatoid arthritis, lupus, etc.
-- - NEVER reduce below 50% without transplant team approval (min_target = 0.5)
-- - SLOWEST reduction: Only 5%/week (vs. 8-10% for other high-risk categories)
-- - Transplant nephrologist/hepatologist must approve ANY reduction
-- - Blood level monitoring essential (therapeutic drug monitoring)
--
UPDATE medication_categories
SET 
  can_reduce_to_zero = 0,              -- ABSOLUTELY NEVER reduce to zero
  default_min_target_fraction = 0.50,  -- Minimum 50% maintenance dose
  max_weekly_reduction_pct = 5.0,      -- Max 5%/week (slowest reduction)
  requires_specialist = 1,              -- Transplant team supervision REQUIRED
  notes = 'Reduktion nur unter strenger fachärztlicher Aufsicht (Transplantologe/Rheumatologe); Abstoßungsrisiko oder Autoimmun-Flare bei zu schneller Dosisreduktion. Therapeutisches Drug Monitoring erforderlich.'
WHERE id = 8;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- After migration, run these checks to verify correct updates:

-- Check 1: Verify all 4 categories were updated
-- Expected: 4 rows with non-NULL safety rules
--
-- SELECT id, name, can_reduce_to_zero, default_min_target_fraction, 
--        max_weekly_reduction_pct, requires_specialist
-- FROM medication_categories
-- WHERE id IN (2, 3, 5, 8);

-- Check 2: Compare with categories that already have rules (e.g., ID 16, 26)
-- Expected: Similar structure, medically sound values
--
-- SELECT id, name, risk_level, can_reduce_to_zero, default_min_target_fraction,
--        max_weekly_reduction_pct, requires_specialist, notes
-- FROM medication_categories
-- WHERE can_reduce_to_zero IS NOT NULL
-- ORDER BY id;

-- Check 3: Count medications affected by new safety rules
-- Expected: ~76 medications (31+21+21+3) now have category-level defaults
--
-- SELECT mc.id, mc.name, COUNT(m.id) as med_count
-- FROM medication_categories mc
-- LEFT JOIN medications m ON m.category_id = mc.id
-- WHERE mc.id IN (2, 3, 5, 8)
-- GROUP BY mc.id, mc.name;

-- ============================================================
-- EXPECTED BEHAVIOR CHANGES IN applyCategorySafetyRules()
-- ============================================================

-- Example 1: Antidepressivum (Category 2)
-- ----------------------------------------
-- Medication: Fluoxetin 40 mg/day
-- User Goal: 50% reduction (target 20 mg) over 8 weeks
-- 
-- BEFORE (NULL category rules):
-- - max_weekly_reduction_pct = med.max_weekly_reduction_pct ?? NULL ?? 15
--   → Falls back to 15%/week if medication has no specific rule
-- - Weekly reduction: (40-20)/8 = 2.5 mg/week
-- - Max weekly: 40 * 15% = 6 mg/week ✅ (within limit)
-- - HWZ adjustment: 2.5 * 0.75 = 1.875 mg/week (due to 96h half-life)
-- - Final target week 8: 40 - (1.875 * 8) = 25 mg
--
-- AFTER (NEW category rules):
-- - max_weekly_reduction_pct = med.max_weekly_reduction_pct ?? 8.0 ?? 15
--   → Uses category default 8%/week if medication has no specific rule
-- - Weekly reduction: (40-20)/8 = 2.5 mg/week
-- - Max weekly: 40 * 8% = 3.2 mg/week ✅ (stricter than before!)
-- - HWZ adjustment: 2.5 * 0.75 = 1.875 mg/week (unchanged)
-- - Final target week 8: 40 - (1.875 * 8) = 25 mg
--
-- SAFETY IMPROVEMENT: Even if medication lacks specific rule, category 
-- enforces 8%/week instead of 15%/week system default.

-- Example 2: Antiepileptikum (Category 3)
-- ----------------------------------------
-- Medication: Levetiracetam (Keppra) 1000 mg/day
-- User Goal: 75% reduction (target 250 mg) over 8 weeks
-- 
-- BEFORE (NULL category rules):
-- - default_min_target_fraction = NULL
-- - Allows reduction to 250 mg (25% of start dose) ⚠️ RISKY
--
-- AFTER (NEW category rules):
-- - default_min_target_fraction = 0.25
-- - Category minimum: 1000 * 0.25 = 250 mg ✅
-- - Explicitly enforces 25% minimum with safety note
-- - requires_specialist = 1 → Warning shown in PDF
--
-- SAFETY IMPROVEMENT: Explicitly enforces minimum with medical rationale,
-- requires specialist approval in UI/PDF reports.

-- Example 3: Immunsuppressivum (Category 8)
-- ------------------------------------------
-- Medication: Tacrolimus 5 mg/day (transplant patient)
-- User Goal: 60% reduction (target 2 mg) over 8 weeks
-- 
-- BEFORE (NULL category rules):
-- - No minimum target → allows reduction to 2 mg (40% of start)
-- - max_weekly_reduction_pct = NULL → 15%/week default
-- - ⚠️ DANGEROUS: Too fast, too low for transplant patient!
--
-- AFTER (NEW category rules):
-- - default_min_target_fraction = 0.50
-- - Category minimum: 5 * 0.50 = 2.5 mg (NOT 2 mg!)
-- - effectiveTargetMg adjusted to 2.5 mg
-- - max_weekly_reduction_pct = 5.0 → Max 0.25 mg/week
-- - requires_specialist = 1 → Transplant team approval required
--
-- SAFETY IMPROVEMENT: Prevents dangerous reduction below 50%, slows 
-- tapering to 5%/week, flags for specialist review.

-- ============================================================
-- MIGRATION METADATA
-- ============================================================
-- Migration Number: 0006
-- Created: 2025-12-05
-- Author: AI Code Assistant
-- Related Analysis: CATEGORY_ANALYSIS_REPORT.md, CATEGORY_ANALYSIS_SUMMARY.md
-- Issue: Safety rules missing for 80 high-risk medications
-- Impact: Improved safety defaults for 25% of medication database
-- Rollback: Reset can_reduce_to_zero, default_min_target_fraction, 
--           max_weekly_reduction_pct, requires_specialist, notes to NULL 
--           for categories 2, 3, 5, 8
-- Testing: Run verification queries above, test PDF generation with 
--          example medications from each category
-- ============================================================
