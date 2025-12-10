-- ============================================================================
-- MEDLESS MIGRATION 013: BATCH 4 - ASSIGN MEDICATIONS TO NEW CATEGORIES
-- ============================================================================
-- Description:  Categorize 10 medications using newly created categories
-- Author:       Lead Backend Engineer
-- Date:         2025-12-09
-- SCOPE:        10 medications → 5 new categories (36-40)
-- IMPACT:       45 → 35 uncategorized (-10)
-- DEPENDS ON:   Migration 012 (Create Batch 4 categories)
-- IDEMPOTENT:   Yes (only updates NULL/0 category_id)
-- RISK:         LOW (Only new categories, all IDs verified)
-- ============================================================================

-- ============================================================================
-- VALIDATION QUERIES (RUN BEFORE MIGRATION)
-- ============================================================================
-- Verify starting point:
-- SELECT COUNT(*) FROM medications WHERE category_id IS NULL OR category_id = 0;
-- Expected: 45

-- Verify all 10 IDs exist and are uncategorized:
-- SELECT id, name, category_id 
-- FROM medications 
-- WHERE id IN (292, 293, 294, 274, 275, 211, 212, 352, 353, 216);
-- Expected: 10 rows with category_id NULL/0

-- Verify new categories exist (from Migration 012):
-- SELECT id, name FROM medication_categories WHERE id BETWEEN 36 AND 40;
-- Expected: 5 rows

-- ============================================================================
-- MIGRATION 013: BATCH 4 CATEGORIZATION (10 Medications)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- KATEGORIE 36: ANTIDEMENTIVA (3 Medikamente)
-- Rationale: Cholinesterase-Hemmer (Donepezil, Rivastigmin), 
--            NMDA-Antagonist (Memantin)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 36 WHERE id IN (
  292,  -- Donepezil (Cholinesterase-Hemmer)
  293,  -- Rivastigmin (Cholinesterase-Hemmer)
  294   -- Memantin (NMDA-Antagonist)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 37: PDE-5-HEMMER (2 Medikamente)
-- Rationale: Phosphodiesterase-5-Inhibitoren
--            (Erektile Dysfunktion, Pulmonale Hypertonie)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 37 WHERE id IN (
  274,  -- Sildenafil (PDE-5-Hemmer)
  275   -- Tadalafil (PDE-5-Hemmer)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 38: LAXANTIEN (2 Medikamente)
-- Rationale: Osmotisches Laxans (Macrogol), Stimulans-Laxans (Bisacodyl)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 38 WHERE id IN (
  211,  -- Macrogol (Osmotisches Laxans)
  212   -- Bisacodyl (Stimulans-Laxans)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 39: VITAMINE / MINERALSTOFFE (2 Medikamente)
-- Rationale: Vitamin D (Cholecalciferol), Calcium (Calciumcarbonat)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 39 WHERE id IN (
  352,  -- Cholecalciferol (Vitamin D3)
  353   -- Calciumcarbonat (Calcium)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 40: H2-REZEPTORANTAGONISTEN (1 Medikament)
-- Rationale: H2-Blocker (Alternative zu PPIs)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 40 WHERE id IN (
  216   -- Famotidin (H2-Blocker)
) AND (category_id IS NULL OR category_id = 0);

-- ============================================================================
-- VALIDATION QUERIES (RUN AFTER MIGRATION)
-- ============================================================================
-- Verify final count:
-- SELECT COUNT(*) FROM medications WHERE category_id IS NULL OR category_id = 0;
-- Expected: 35 (45 - 10)

-- Verify all 10 medications are categorized:
-- SELECT id, name, category_id 
-- FROM medications 
-- WHERE id IN (292, 293, 294, 274, 275, 211, 212, 352, 353, 216);
-- Expected: 10 rows with category_id 36-40 (no NULL/0)

-- Verify category distribution for Batch 4:
-- SELECT category_id, COUNT(*) as count
-- FROM medications 
-- WHERE id IN (292, 293, 294, 274, 275, 211, 212, 352, 353, 216)
-- GROUP BY category_id
-- ORDER BY category_id;
-- Expected:
--   category_id | count
--   36          | 3     (Antidementiva)
--   37          | 2     (PDE-5-Hemmer)
--   38          | 2     (Laxantien)
--   39          | 2     (Vitamine/Mineralstoffe)
--   40          | 1     (H2-Blocker)

-- ============================================================================
-- ROLLBACK QUERY (USE ONLY IF MIGRATION NEEDS TO BE REVERSED)
-- ============================================================================
-- UPDATE medications SET category_id = NULL 
-- WHERE id IN (292, 293, 294, 274, 275, 211, 212, 352, 353, 216);

-- ============================================================================
-- MIGRATION 013 COMPLETE
-- Next: Batch 5 (Manual review of remaining 35 medications)
-- Remaining uncategorized: 35 medications
-- ============================================================================
