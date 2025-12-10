-- ============================================================================
-- MEDLESS MIGRATION 012: ADD BATCH 4 CATEGORIES
-- ============================================================================
-- Description:  Create 5 new medication categories for Batch 4
-- Author:       Lead Backend Engineer
-- Date:         2025-12-09
-- SCOPE:        5 new categories (IDs 36-40)
-- IMPACT:       Preparation for categorizing 10 medications in Migration 013
-- DEPENDS ON:   Migration 011 (Batch 3)
-- IDEMPOTENT:   Yes (INSERT OR IGNORE)
-- RISK:         LOW (Only INSERTs, no UPDATEs)
-- ============================================================================

-- ============================================================================
-- VALIDATION QUERIES (RUN BEFORE MIGRATION)
-- ============================================================================
-- Verify IDs 36-40 are free:
-- SELECT id FROM medication_categories WHERE id BETWEEN 36 AND 40;
-- Expected: 0 rows (IDs are available)

-- ============================================================================
-- MIGRATION 012: CREATE 5 NEW CATEGORIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- KATEGORIE 36: ANTIDEMENTIVA
-- Rationale: Cholinesterase-Hemmer und NMDA-Antagonisten zur Behandlung
--            der Demenzsymptomatik (Alzheimer, vaskuläre Demenz)
-- Examples:  Donepezil, Rivastigmin, Memantin
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  36,
  'Antidementiva',
  'Arzneimittel zur Behandlung der Demenzsymptomatik (Cholinesterase-Hemmer, NMDA-Antagonisten)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 37: PDE-5-HEMMER
-- Rationale: Phosphodiesterase-5-Inhibitoren zur Behandlung von erektiler
--            Dysfunktion und pulmonaler Hypertonie
-- Examples:  Sildenafil, Tadalafil, Vardenafil
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  37,
  'PDE-5-Hemmer',
  'Phosphodiesterase-5-Inhibitoren (Erektile Dysfunktion, Pulmonale Hypertonie)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 38: LAXANTIEN
-- Rationale: Abführmittel zur Behandlung von Obstipation
-- Examples:  Macrogol (osmotisch), Bisacodyl (Stimulans), Lactulose
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  38,
  'Laxantien',
  'Abführmittel zur Behandlung von Obstipation (osmotisch, Stimulantien)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 39: VITAMINE / MINERALSTOFFE
-- Rationale: Nahrungsergänzungsmittel und Substitutionstherapie
-- Examples:  Vitamin D (Cholecalciferol), Calcium, Vitamin B12, Folsäure
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  39,
  'Vitamine / Mineralstoffe',
  'Vitamine, Mineralstoffe und Spurenelemente (Substitution, Prophylaxe)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 40: H2-REZEPTORANTAGONISTEN
-- Rationale: H2-Blocker zur Reduktion der Magensäureproduktion
--            (Alternative zu PPIs, Kategorie 12)
-- Examples:  Famotidin, Ranitidin, Cimetidin
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  40,
  'H2-Rezeptorantagonisten',
  'H2-Blocker zur Reduktion der Magensäureproduktion (Alternative zu PPIs)'
);

-- ============================================================================
-- VALIDATION QUERIES (RUN AFTER MIGRATION)
-- ============================================================================
-- Verify all 5 categories were created:
-- SELECT id, name FROM medication_categories WHERE id BETWEEN 36 AND 40 ORDER BY id;
-- Expected: 5 rows (36, 37, 38, 39, 40)

-- Count total categories:
-- SELECT COUNT(*) as total_categories FROM medication_categories;
-- Expected: 41 (0-35 existing + 36-40 new)

-- ============================================================================
-- ROLLBACK QUERY (USE ONLY IF MIGRATION NEEDS TO BE REVERSED)
-- ============================================================================
-- DELETE FROM medication_categories WHERE id BETWEEN 36 AND 40;

-- ============================================================================
-- MIGRATION 012 COMPLETE
-- Next: Migration 013 (Batch 4 - Assign 10 medications to new categories)
-- New categories: 36, 37, 38, 39, 40
-- ============================================================================
