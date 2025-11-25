-- Migration 0005: Add pharmacokinetic and safety fields to medications table
-- This migration extends the medications table with critical fields for
-- medically accurate reduction calculations.
-- 
-- ALL NEW FIELDS ARE NULL-ABLE to ensure 100% backward compatibility.
-- Existing calculations will continue to work if these fields are NULL.
--
-- Created: 2025-11-24
-- Purpose: Enable pharmacokinetic-aware tapering and improved safety checks

-- ============================================================
-- MEDICATIONS TABLE EXTENSIONS
-- ============================================================

-- Pharmacokinetic Parameters
-- These fields enable calculation of safe reduction speeds based on drug half-life
ALTER TABLE medications ADD COLUMN half_life_hours REAL NULL;
-- Example: Citalopram = 33 hours, Fluoxetine = 96-144 hours

-- Therapeutic Range (in ng/mL or µg/mL)
-- These fields help avoid under-dosing (relapse risk) or over-dosing (side effects)
ALTER TABLE medications ADD COLUMN therapeutic_min_ng_ml REAL NULL;
ALTER TABLE medications ADD COLUMN therapeutic_max_ng_ml REAL NULL;
-- Example: Citalopram therapeutic range: 50-110 ng/mL

-- Withdrawal/Discontinuation Syndrome Risk
-- Score from 0 (no risk) to 10 (severe risk)
ALTER TABLE medications ADD COLUMN withdrawal_risk_score INTEGER NULL;
-- Example: SSRIs = 7, Benzodiazepines = 9, Beta-blockers = 3

-- Medication-Specific Safety Rules
-- These override category-level rules when present
ALTER TABLE medications ADD COLUMN max_weekly_reduction_pct REAL NULL;
-- Example: Fluoxetine (long t½) = 10%/week, Paroxetine (short t½) = 5%/week

ALTER TABLE medications ADD COLUMN can_reduce_to_zero INTEGER NULL;
-- 0 = must maintain dose (e.g., lifelong thyroid meds)
-- 1 = can reduce to zero (e.g., pain meds)
-- NULL = use category default

-- CBD Interaction Strength
-- Specific to this medication (overrides category if present)
ALTER TABLE medications ADD COLUMN cbd_interaction_strength TEXT NULL;
-- Values: 'low', 'medium', 'high', 'critical'
-- Example: Warfarin = 'critical', Citalopram = 'high'

-- ============================================================
-- FIELD DESCRIPTIONS (for documentation)
-- ============================================================

-- half_life_hours:
--   Drug elimination half-life in hours. Used to calculate:
--   - Time to steady state (5× t½)
--   - Safe reduction speed (longer t½ = slower reduction)
--   - Minimum days between dose changes

-- therapeutic_min_ng_ml / therapeutic_max_ng_ml:
--   Therapeutic drug monitoring ranges. Used to:
--   - Warn if target dose may be sub-therapeutic
--   - Calculate if CBD interaction may push levels to toxic range
--   - Recommend blood level monitoring

-- withdrawal_risk_score:
--   0-10 scale of discontinuation syndrome severity
--   0-2: Minimal risk (e.g., statins)
--   3-5: Moderate risk (e.g., beta-blockers)
--   6-8: High risk (e.g., SSRIs, gabapentinoids)
--   9-10: Severe risk (e.g., benzodiazepines, opioids)

-- max_weekly_reduction_pct:
--   Maximum safe weekly reduction as % of starting dose
--   Overrides category-level setting for this specific drug
--   Based on half-life and withdrawal risk

-- can_reduce_to_zero:
--   Whether this medication can be fully discontinued
--   0 = No (lifelong medication)
--   1 = Yes (can taper to zero)
--   NULL = Use category default

-- cbd_interaction_strength:
--   Strength of CBD-medication interaction
--   'low': Minor interaction, monitoring recommended
--   'medium': Moderate interaction, dose adjustment may be needed
--   'high': Significant interaction, close monitoring required
--   'critical': Severe interaction, may require dose reduction or alternative

-- ============================================================
-- BACKWARD COMPATIBILITY GUARANTEE
-- ============================================================

-- ✅ All new columns are NULL-able
-- ✅ No existing columns modified
-- ✅ No existing data changed
-- ✅ Existing queries will continue to work
-- ✅ New fields only used when populated

-- If a field is NULL, the system falls back to:
-- 1. Category-level defaults (medication_categories)
-- 2. Hard-coded safe defaults (e.g., 5% max reduction/week)
-- 3. User-specified reduction goal (with safety warnings)

-- ============================================================
-- USAGE IN CODE
-- ============================================================

-- Example query (existing code compatible):
-- SELECT m.*, mc.risk_level
-- FROM medications m
-- LEFT JOIN medication_categories mc ON m.category_id = mc.id
-- WHERE m.name LIKE ?
-- 
-- New fields (m.half_life_hours, m.withdrawal_risk_score, etc.)
-- will be NULL until populated, and existing code will ignore them.

-- ============================================================
-- NEXT STEPS (after migration)
-- ============================================================

-- 1. Populate critical medications first:
--    - SSRIs (Citalopram, Sertraline, Fluoxetine, etc.)
--    - Benzodiazepines (Diazepam, Lorazepam, etc.)
--    - Anticonvulsants (Lamotrigine, Valproate, etc.)
--    - Anticoagulants (Warfarin, etc.)

-- 2. Update reduction algorithm to use half_life_hours when present
-- 3. Add withdrawal_risk warnings to UI
-- 4. Implement therapeutic range checking for CBD interactions

-- Migration complete - 7 new fields added to medications table
