-- ============================================================================
-- MIGRATION 017: Add CYP Boolean Fields to medications Table
-- Priority: P0 (CRITICAL BLOCKER)
-- Enables: Phase 4 (CYP450 Adjustment) calculation
-- Schema Impact: Adds 15 INTEGER columns (5 enzymes × 3 roles)
-- ============================================================================
-- 
-- PURPOSE:
-- Add boolean fields for CYP450 enzyme interactions to enable proper
-- drug-drug interaction detection in MEDLESS v1 calculation engine
--
-- CURRENT PROBLEM:
-- - Code expects: cyp3a4_substrate, cyp2d6_substrate (etc.) as BOOLEAN fields
-- - Database has: cyp450_enzyme as TEXT field (e.g., "CYP3A4, P-gp")
-- - Result: Phase 4 (CYP Adjustment) FAILS because fields don't exist
--
-- SOLUTION:
-- Add 15 boolean (INTEGER 0/1) fields for:
-- - 5 CYP enzymes: CYP3A4, CYP2D6, CYP2C9, CYP2C19, CYP1A2
-- - 3 interaction types: Substrate, Inhibitor, Inducer
--
-- MEDICAL RATIONALE:
-- - Boolean (0/1) is sufficient for v1 (Yes/No interaction possible)
-- - Strength grades (weak/moderate/strong) deferred to v2
-- - Conservative approach: Mark if ANY interaction possible
--
-- VALIDATION SOURCE:
-- - PHASE_C_FINAL_VALIDATION.md Section 3
-- - CYP_CLASSIFICATION_40_MEDICATIONS.md
--
-- ⚠️ IMPORTANT:
-- After this migration, restart application to recognize new schema
-- ============================================================================


-- ============================================================================
-- SECTION 1: ADD CYP SUBSTRATE FIELDS (5 enzymes)
-- ============================================================================

-- CYP3A4 SUBSTRATE (most common, ~40% of drug metabolism)
-- Examples: Atorvastatin, Simvastatin, Amiodaron, Sildenafil
ALTER TABLE medications ADD COLUMN cyp3a4_substrate INTEGER DEFAULT 0 CHECK(cyp3a4_substrate IN (0, 1));

-- CYP2D6 SUBSTRATE (~25% of drug metabolism)
-- Examples: Metoprolol, Tramadol, Codein, Amitriptylin
ALTER TABLE medications ADD COLUMN cyp2d6_substrate INTEGER DEFAULT 0 CHECK(cyp2d6_substrate IN (0, 1));

-- CYP2C9 SUBSTRATE (~10% of drug metabolism)
-- Examples: Warfarin, Phenytoin, Losartan, Diclofenac
ALTER TABLE medications ADD COLUMN cyp2c9_substrate INTEGER DEFAULT 0 CHECK(cyp2c9_substrate IN (0, 1));

-- CYP2C19 SUBSTRATE (~10% of drug metabolism)
-- Examples: Clopidogrel, Omeprazol, Diazepam, Escitalopram
ALTER TABLE medications ADD COLUMN cyp2c19_substrate INTEGER DEFAULT 0 CHECK(cyp2c19_substrate IN (0, 1));

-- CYP1A2 SUBSTRATE (~5% of drug metabolism)
-- Examples: Theophyllin, Clozapin, Duloxetin, Olanzapin
ALTER TABLE medications ADD COLUMN cyp1a2_substrate INTEGER DEFAULT 0 CHECK(cyp1a2_substrate IN (0, 1));

-- ============================================================================
-- SECTION 2: ADD CYP INHIBITOR FIELDS (5 enzymes)
-- ============================================================================

-- CYP3A4 INHIBITOR
-- Examples: Clarithromycin, Ketoconazol, Grapefruit juice
ALTER TABLE medications ADD COLUMN cyp3a4_inhibitor INTEGER DEFAULT 0 CHECK(cyp3a4_inhibitor IN (0, 1));

-- CYP2D6 INHIBITOR (potent inhibitors cause severe interactions)
-- Examples: Fluoxetin (potent), Paroxetin (potent), Bupropion
ALTER TABLE medications ADD COLUMN cyp2d6_inhibitor INTEGER DEFAULT 0 CHECK(cyp2d6_inhibitor IN (0, 1));

-- CYP2C9 INHIBITOR
-- Examples: Fluconazol, Amiodaron, Cotrimoxazol
ALTER TABLE medications ADD COLUMN cyp2c9_inhibitor INTEGER DEFAULT 0 CHECK(cyp2c9_inhibitor IN (0, 1));

-- CYP2C19 INHIBITOR
-- Examples: Omeprazol, Esomeprazol, Fluconazol
ALTER TABLE medications ADD COLUMN cyp2c19_inhibitor INTEGER DEFAULT 0 CHECK(cyp2c19_inhibitor IN (0, 1));

-- CYP1A2 INHIBITOR
-- Examples: Fluvoxamin (potent), Ciprofloxacin, Verapamil
ALTER TABLE medications ADD COLUMN cyp1a2_inhibitor INTEGER DEFAULT 0 CHECK(cyp1a2_inhibitor IN (0, 1));

-- ============================================================================
-- SECTION 3: ADD CYP INDUCER FIELDS (5 enzymes)
-- ============================================================================

-- CYP3A4 INDUCER (causes decreased substrate levels)
-- Examples: Carbamazepin (potent), Rifampicin (potent), Johanniskraut
ALTER TABLE medications ADD COLUMN cyp3a4_inducer INTEGER DEFAULT 0 CHECK(cyp3a4_inducer IN (0, 1));

-- CYP2D6 INDUCER (rare, but exists)
-- Examples: Rifampicin (weak), Dexamethason
ALTER TABLE medications ADD COLUMN cyp2d6_inducer INTEGER DEFAULT 0 CHECK(cyp2d6_inducer IN (0, 1));

-- CYP2C9 INDUCER
-- Examples: Rifampicin, Carbamazepin, Phenobarbital
ALTER TABLE medications ADD COLUMN cyp2c9_inducer INTEGER DEFAULT 0 CHECK(cyp2c9_inducer IN (0, 1));

-- CYP2C19 INDUCER
-- Examples: Rifampicin, Carbamazepin, Johanniskraut
ALTER TABLE medications ADD COLUMN cyp2c19_inducer INTEGER DEFAULT 0 CHECK(cyp2c19_inducer IN (0, 1));

-- CYP1A2 INDUCER
-- Examples: Omeprazol (weak), Smoking, Carbamazepin
ALTER TABLE medications ADD COLUMN cyp1a2_inducer INTEGER DEFAULT 0 CHECK(cyp1a2_inducer IN (0, 1));

-- ============================================================================
-- VALIDATION: Verify all 15 fields were added
-- ============================================================================

PRAGMA table_info(medications);

-- Expected output should include these 15 new columns (approximate cid numbers):
-- cid | name                 | type    | notnull | dflt_value | pk
-- ----|---------------------|---------|---------|------------|---
-- ... | cyp3a4_substrate    | INTEGER |    0    |     0      | 0
-- ... | cyp2d6_substrate    | INTEGER |    0    |     0      | 0
-- ... | cyp2c9_substrate    | INTEGER |    0    |     0      | 0
-- ... | cyp2c19_substrate   | INTEGER |    0    |     0      | 0
-- ... | cyp1a2_substrate    | INTEGER |    0    |     0      | 0
-- ... | cyp3a4_inhibitor    | INTEGER |    0    |     0      | 0
-- ... | cyp2d6_inhibitor    | INTEGER |    0    |     0      | 0
-- ... | cyp2c9_inhibitor    | INTEGER |    0    |     0      | 0
-- ... | cyp2c19_inhibitor   | INTEGER |    0    |     0      | 0
-- ... | cyp1a2_inhibitor    | INTEGER |    0    |     0      | 0
-- ... | cyp3a4_inducer      | INTEGER |    0    |     0      | 0
-- ... | cyp2d6_inducer      | INTEGER |    0    |     0      | 0
-- ... | cyp2c9_inducer      | INTEGER |    0    |     0      | 0
-- ... | cyp2c19_inducer     | INTEGER |    0    |     0      | 0
-- ... | cyp1a2_inducer      | INTEGER |    0    |     0      | 0

-- ============================================================================
-- SANITY CHECK: Verify all fields are initialized to 0
-- ============================================================================

SELECT 
  COUNT(*) AS total_medications,
  SUM(cyp3a4_substrate) AS cyp3a4_substrate_count,
  SUM(cyp2d6_substrate) AS cyp2d6_substrate_count,
  SUM(cyp2c9_substrate) AS cyp2c9_substrate_count,
  SUM(cyp2c19_substrate) AS cyp2c19_substrate_count,
  SUM(cyp1a2_substrate) AS cyp1a2_substrate_count,
  SUM(cyp3a4_inhibitor) AS cyp3a4_inhibitor_count,
  SUM(cyp2d6_inhibitor) AS cyp2d6_inhibitor_count,
  SUM(cyp3a4_inducer) AS cyp3a4_inducer_count
FROM medications;

-- Expected output (BEFORE Migration 018):
-- total_medications: 343
-- All counts: 0 (because DEFAULT 0 for all new fields)

-- ============================================================================
-- CHECK FOR NULL VALUES (should be none due to DEFAULT 0)
-- ============================================================================

SELECT 
  COUNT(*) AS total,
  COUNT(CASE WHEN cyp3a4_substrate IS NULL THEN 1 END) AS cyp3a4_substrate_nulls,
  COUNT(CASE WHEN cyp2d6_substrate IS NULL THEN 1 END) AS cyp2d6_substrate_nulls,
  COUNT(CASE WHEN cyp2c9_substrate IS NULL THEN 1 END) AS cyp2c9_substrate_nulls
FROM medications;

-- Expected: All null counts = 0 (DEFAULT 0 ensures no NULLs)

-- ============================================================================
-- VERIFY CHECK CONSTRAINTS WORK
-- ============================================================================

-- This should FAIL (value not 0 or 1):
-- UPDATE medications SET cyp3a4_substrate = 2 WHERE id = 1;
-- Expected error: "CHECK constraint failed: cyp3a4_substrate IN (0, 1)"

-- This should SUCCEED:
-- UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 1;
-- UPDATE medications SET cyp3a4_substrate = 0 WHERE id = 1;


-- ============================================================================
-- POST-MIGRATION CHECKLIST
-- ============================================================================
-- 
-- [ ] Verify PRAGMA table_info shows 15 new columns
-- [ ] Verify all new columns have INTEGER type
-- [ ] Verify all new columns have DEFAULT 0
-- [ ] Verify all new columns have CHECK constraint IN (0, 1)
-- [ ] Verify no NULL values in new columns
-- [ ] RESTART application to recognize new schema
-- [ ] Proceed to Migration 018 (populate CYP flags)
--
-- ============================================================================
-- ROLLBACK PLAN (SQLite limitation!)
-- ============================================================================
-- 
-- ⚠️ WARNING: SQLite does NOT support ALTER TABLE DROP COLUMN
-- 
-- If rollback needed:
-- 1. OPTION A: Ignore new columns (set all to 0)
--    UPDATE medications SET 
--      cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0,
--      cyp2c19_substrate = 0, cyp1a2_substrate = 0,
--      cyp3a4_inhibitor = 0, cyp2d6_inhibitor = 0, cyp2c9_inhibitor = 0,
--      cyp2c19_inhibitor = 0, cyp1a2_inhibitor = 0,
--      cyp3a4_inducer = 0, cyp2d6_inducer = 0, cyp2c9_inducer = 0,
--      cyp2c19_inducer = 0, cyp1a2_inducer = 0;
-- 
-- 2. OPTION B: Restore from database backup (before migration)
--
-- 3. OPTION C: Recreate table without new columns (complex, not recommended)
--
-- ============================================================================
-- END OF MIGRATION 017
-- ============================================================================
