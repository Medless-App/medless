-- ============================================================================
-- MEDLESS MIGRATION 015: BATCH 5 - FINAL CATEGORIZATION (35 MEDICATIONS)
-- ============================================================================
-- Description:  Categorize final 35 uncategorized medications (100% completion)
-- Author:       Lead Backend Engineer
-- Date:         2025-12-09
-- SCOPE:        35 medications → 20 categories (5 existing + 15 new)
-- IMPACT:       35 → 0 uncategorized (100% VOLLSTÄNDIG)
-- DEPENDS ON:   Migration 014 (Create Batch 5 categories)
-- IDEMPOTENT:   Yes (only updates NULL/0 category_id)
-- RISK:         LOW (Final categorization, all IDs verified)
-- ============================================================================

-- ============================================================================
-- VALIDATION QUERIES (RUN BEFORE MIGRATION)
-- ============================================================================
-- Verify starting point:
-- SELECT COUNT(*) FROM medications WHERE category_id IS NULL OR category_id = 0;
-- Expected: 35

-- Verify all 35 IDs exist and are uncategorized:
-- SELECT id, name, category_id 
-- FROM medications 
-- WHERE id IN (176,185,205,207,208,210,221,223,224,250,251,253,254,255,256,257,258,259,260,266,267,268,273,276,297,302,303,304,305,306,320,321,322,323,324);
-- Expected: 35 rows with category_id NULL/0

-- Verify new categories exist (from Migration 014):
-- SELECT id, name FROM medication_categories WHERE id BETWEEN 41 AND 55;
-- Expected: 15 rows

-- ============================================================================
-- MIGRATION 015: BATCH 5 CATEGORIZATION (35 Medications)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BESTEHENDE KATEGORIEN (5 Medikamente)
-- ----------------------------------------------------------------------------

-- KATEGORIE 19: ANTIHYPERTENSIVA (1 Medikament)
-- Rationale: Propranolol ist primär ein Antihypertensivum (Beta-Blocker)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 19 WHERE id IN (
  176   -- Propranolol (Beta-Blocker, nicht-selektiv)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 26: HORMONPRÄPARATE (1 Medikament)
-- Rationale: Desmopressin ist ein synthetisches Vasopressin-Analogon (ADH)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 26 WHERE id IN (
  273   -- Desmopressin (ADH-Analogon)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 29: ANTIRHEUMATIKA (3 Medikamente)
-- Rationale: DMARDs zur Behandlung der rheumatoiden Arthritis und verwandter Erkrankungen
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 29 WHERE id IN (
  253,  -- Leflunomid (DMARD)
  255,  -- Hydroxychloroquin (DMARD / Antimalariamittel)
  320   -- Tofacitinib (JAK-Inhibitor)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- NEUE KATEGORIEN (30 Medikamente)
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- KATEGORIE 41: HERZGLYKOSIDE (1 Medikament)
-- Rationale: Herzglykoside zur Behandlung von Herzinsuffizienz und Vorhofflimmern
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 41 WHERE id IN (
  205   -- Digoxin (Herzglykosid)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 42: ANTIANGINOSA (NITRATE & ANDERE) (2 Medikamente)
-- Rationale: Antianginöse Medikamente zur Prophylaxe und Behandlung von Angina pectoris
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 42 WHERE id IN (
  221,  -- Isosorbidmononitrat (Nitrat)
  223   -- Ranolazin (Late-Natrium-Kanal-Hemmer)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 43: LIPIDSENKER (NICHT-STATINE) (1 Medikament)
-- Rationale: Cholesterinabsorptionshemmer (Alternative/Ergänzung zu Statinen)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 43 WHERE id IN (
  305   -- Ezetimib (Cholesterinabsorptionshemmer)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 44: UROLOGIKA (BPH & BLASENFUNKTION) (2 Medikamente)
-- Rationale: Medikamente zur Behandlung der benignen Prostatahyperplasie (BPH)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 44 WHERE id IN (
  250,  -- Tamsulosin (Alpha-1-Blocker)
  251   -- Finasterid (5-Alpha-Reduktase-Hemmer)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 45: SPASMOLYTIKA (BLASE & DARM) (3 Medikamente)
-- Rationale: Medikamente zur Behandlung der überaktiven Blase (OAB)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 45 WHERE id IN (
  276,  -- Mirabegron (Beta-3-Agonist)
  302,  -- Solifenacin (Antimuskarinikum)
  303   -- Oxybutynin (Antimuskarinikum)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 46: ANTIEMETIKA (2 Medikamente)
-- Rationale: Medikamente zur Behandlung von Übelkeit und Erbrechen
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 46 WHERE id IN (
  207,  -- Metoclopramid (Dopaminantagonist)
  208   -- Ondansetron (5-HT3-Antagonist)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 47: ANTIDIARRHOIKA (1 Medikament)
-- Rationale: Medikamente zur Behandlung von akuter und chronischer Diarrhoe
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 47 WHERE id IN (
  210   -- Loperamid (Opioidrezeptor-Agonist)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 48: IBD-THERAPEUTIKA (2 Medikamente)
-- Rationale: Medikamente zur Behandlung von chronisch-entzündlichen Darmerkrankungen
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 48 WHERE id IN (
  254,  -- Sulfasalazin (5-ASA-Prodrug)
  297   -- Mesalazin (5-ASA)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 49: ONKOLOGIKA (HORMONTHERAPIE & TARGETED THERAPY) (5 Medikamente)
-- Rationale: Onkologische Medikamente für Hormontherapie und zielgerichtete Therapie
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 49 WHERE id IN (
  256,  -- Tamoxifen (Antiöstrogen, Brustkrebs)
  257,  -- Anastrozol (Aromatasehemmer, Brustkrebs)
  258,  -- Letrozol (Aromatasehemmer, Brustkrebs)
  259,  -- Imatinib (Tyrosinkinase-Inhibitor, CML)
  260   -- Bicalutamid (Antiandrogen, Prostatakrebs)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 50: MS-THERAPEUTIKA (3 Medikamente)
-- Rationale: Krankheitsmodifizierende Therapien für Multiple Sklerose
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 50 WHERE id IN (
  266,  -- Fingolimod (S1P-Modulator)
  267,  -- Dimethylfumarat (Nrf2-Aktivator)
  268   -- Teriflunomid (DHODH-Hemmer)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 51: GICHTMITTEL (URIKOSTATIKA) (2 Medikamente)
-- Rationale: Medikamente zur Behandlung von Gicht und Hyperurikämie
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 51 WHERE id IN (
  224,  -- Allopurinol (Xanthinoxidase-Hemmer)
  304   -- Febuxostat (Xanthinoxidase-Hemmer)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 52: OPHTHALMOLOGIKA (GLAUKOM) (2 Medikamente)
-- Rationale: Topische Medikamente zur Behandlung von Glaukom
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 52 WHERE id IN (
  323,  -- Latanoprost (Prostaglandin-Analogon)
  324   -- Timolol (ophthalmisch) (Beta-Blocker, topisch)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 53: RETINOIDE (DERMATOLOGIE) (2 Medikamente)
-- Rationale: Systemische Retinoide zur Behandlung schwerer Hauterkrankungen
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 53 WHERE id IN (
  321,  -- Isotretinoin (Retinoid, Akne)
  322   -- Acitretin (Retinoid, Psoriasis)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 54: LOKALANÄSTHETIKA (1 Medikament)
-- Rationale: Lokalanästhetika zur topischen, infiltrativen und regionalen Anästhesie
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 54 WHERE id IN (
  185   -- Lidocain (Amid-Lokalanästhetikum)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 55: RAUCHERENTWÖHNUNG (1 Medikament)
-- Rationale: Medikamente zur Unterstützung der Raucherentwöhnung
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 55 WHERE id IN (
  306   -- Vareniclin (Nikotinerger Agonist)
) AND (category_id IS NULL OR category_id = 0);

-- ============================================================================
-- VALIDATION QUERIES (RUN AFTER MIGRATION)
-- ============================================================================
-- Verify final count (100% completion):
-- SELECT COUNT(*) FROM medications WHERE category_id IS NULL OR category_id = 0;
-- Expected: 0 (ALL medications categorized)

-- Verify all 35 medications are categorized:
-- SELECT id, name, category_id 
-- FROM medications 
-- WHERE id IN (176,185,205,207,208,210,221,223,224,250,251,253,254,255,256,257,258,259,260,266,267,268,273,276,297,302,303,304,305,306,320,321,322,323,324)
-- ORDER BY id;
-- Expected: 35 rows with category_id assigned (no NULL/0)

-- Verify category distribution for Batch 5:
-- SELECT category_id, COUNT(*) as count
-- FROM medications 
-- WHERE id IN (176,185,205,207,208,210,221,223,224,250,251,253,254,255,256,257,258,259,260,266,267,268,273,276,297,302,303,304,305,306,320,321,322,323,324)
-- GROUP BY category_id
-- ORDER BY category_id;
-- Expected:
--   category_id | count
--   19          | 1     (Antihypertensiva)
--   26          | 1     (Hormonpräparate)
--   29          | 3     (Antirheumatika)
--   41          | 1     (Herzglykoside)
--   42          | 2     (Antianginosa)
--   43          | 1     (Lipidsenker Nicht-Statine)
--   44          | 2     (Urologika BPH)
--   45          | 3     (Spasmolytika Blase)
--   46          | 2     (Antiemetika)
--   47          | 1     (Antidiarrhoika)
--   48          | 2     (IBD-Therapeutika)
--   49          | 5     (Onkologika)
--   50          | 3     (MS-Therapeutika)
--   51          | 2     (Gichtmittel)
--   52          | 2     (Ophthalmologika)
--   53          | 2     (Retinoide)
--   54          | 1     (Lokalanästhetika)
--   55          | 1     (Raucherentwöhnung)

-- Count total categorized medications:
-- SELECT COUNT(*) as total_categorized FROM medications WHERE category_id IS NOT NULL AND category_id != 0;
-- Expected: 343 (100% of all medications)

-- ============================================================================
-- ROLLBACK QUERY (USE ONLY IF MIGRATION NEEDS TO BE REVERSED)
-- ============================================================================
-- UPDATE medications SET category_id = NULL 
-- WHERE id IN (176,185,205,207,208,210,221,223,224,250,251,253,254,255,256,257,258,259,260,266,267,268,273,276,297,302,303,304,305,306,320,321,322,323,324);

-- ============================================================================
-- MIGRATION 015 COMPLETE
-- Status: 100% VOLLSTÄNDIG - ALL MEDICATIONS CATEGORIZED
-- Total medications: 343
-- Total categories: 56 (0-55)
-- Uncategorized: 0 (100% completion)
-- ============================================================================
