-- ============================================================
-- MEDLESS Migration 009: Fix Medication Categories (Batch 1)
-- High-Priority Cardiovascular & Metabolic Medications
-- ============================================================
-- DATE: 2025-12-09
-- AUTHOR: Lead Backend Engineer
-- SCOPE: 43 Medications → Existing Categories
-- IMPACT: Reduces uncategorized from 230 to 187 (-43)
-- STATUS: READY FOR APPROVAL
-- ============================================================

-- IDEMPOTENZ: Diese Migration kann mehrfach ausgeführt werden
-- Keine INSERT/CREATE-Statements, nur UPDATEs auf vorhandene Datensätze
-- Alle UPDATEs prüfen "(category_id IS NULL OR category_id = 0)"

-- ==========================================
-- BATCH 1.1: Antihypertensiva (19)
-- ==========================================
-- 18 Medikamente: ACE-Hemmer, ARB, Beta-Blocker, Calcium-Antagonisten

UPDATE medications 
SET category_id = 19 
WHERE id IN (
  98,  -- Ramipril (ACE-Hemmer)
  99,  -- Enalapril (ACE-Hemmer)
  100, -- Amlodipin (Calcium-Antagonist)
  101, -- Bisoprolol (Beta-Blocker)
  102, -- Metoprolol (Beta-Blocker)
  103, -- Valsartan (ARB)
  217, -- Losartan (ARB)
  218, -- Candesartan (ARB)
  219, -- Nebivolol (Beta-Blocker)
  220, -- Carvedilol (Alpha-/Beta-Blocker)
  225, -- Amlodipin/Valsartan (Kombi)
  226, -- Bisoprolol/Amlodipin (Kombi)
  278, -- Lisinopril (ACE-Hemmer)
  280, -- Clonidin (Alpha-2-Agonist)
  281, -- Doxazosin (Alpha-1-Blocker)
  203, -- Verapamil (Calcium-Antagonist)
  204, -- Diltiazem (Calcium-Antagonist)
  206  -- Ivabradine (If-Kanal-Blocker)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 1.2: Diabetesmedikamente (13)
-- ==========================================
-- 12 Medikamente: GLP-1, SGLT2, DPP-4, Sulfonylharnstoffe, Metformin

UPDATE medications 
SET category_id = 13 
WHERE id IN (
  115, -- Metformin (Biguanid)
  116, -- Glimepirid (Sulfonylharnstoff)
  119, -- Dapagliflozin (SGLT2-Inhibitor)
  120, -- Liraglutid (GLP-1-Agonist)
  227, -- Sitagliptin (DPP-4-Hemmer)
  229, -- Empagliflozin (SGLT2-Inhibitor)
  230, -- Canagliflozin (SGLT2-Inhibitor)
  231, -- Pioglitazon (Glitazon)
  283, -- Gliclazid (Sulfonylharnstoff)
  315, -- Glibenclamid (Sulfonylharnstoff)
  316, -- Dulaglutid (GLP-1-Agonist)
  317  -- Semaglutid (GLP-1-Agonist)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 1.3: Antikoagulantien (10)
-- ==========================================
-- 5 Medikamente: DOAKs, P2Y12-Inhibitoren, ASS

UPDATE medications 
SET category_id = 10 
WHERE id IN (
  159, -- Acetylsalicylsäure (Thrombozyten-Hemmer)
  222, -- Clopidogrel (P2Y12-Inhibitor)
  307, -- Rivaroxaban (DOAK)
  308, -- Apixaban (DOAK)
  309  -- Edoxaban (DOAK)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 1.4: Statine (6)
-- ==========================================
-- 4 Medikamente: HMG-CoA-Reduktase-Hemmer

UPDATE medications 
SET category_id = 6 
WHERE id IN (
  111, -- Atorvastatin
  112, -- Simvastatin
  113, -- Rosuvastatin
  114  -- Pravastatin
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 1.5: Protonenpumpenhemmer (12)
-- ==========================================
-- 4 Medikamente: PPIs

UPDATE medications 
SET category_id = 12 
WHERE id IN (
  107, -- Pantoprazol
  108, -- Omeprazol
  109, -- Esomeprazol
  110  -- Lansoprazol
)
AND (category_id IS NULL OR category_id = 0);

-- ============================================================
-- VALIDATION QUERIES (run after migration):
-- ============================================================

-- 1. Check all Batch 1 medications have correct categories
-- SELECT category_id, COUNT(*) as count 
-- FROM medications 
-- WHERE id IN (
--   98,99,100,101,102,103,107,108,109,110,111,112,113,114,115,116,119,120,
--   159,203,204,206,217,218,219,220,222,225,226,227,229,230,231,278,280,281,
--   283,307,308,309,315,316,317
-- )
-- GROUP BY category_id;
--
-- Expected (after migration): 
-- category_id | count
-- 6           | 4     (Statine)
-- 10          | 5     (Antikoagulantien)
-- 12          | 4     (PPIs)
-- 13          | 12    (Diabetes)
-- 19          | 18    (Antihypertensiva)
-- NULL/0      | 0     (all should be categorized!)

-- 2. Count remaining uncategorized medications
-- SELECT COUNT(*) as uncategorized 
-- FROM medications 
-- WHERE category_id IS NULL OR category_id = 0;
--
-- Expected: 187 (230 - 43)

-- ============================================================
-- ROLLBACK (if needed):
-- ============================================================

-- To rollback this migration:
-- UPDATE medications SET category_id = NULL 
-- WHERE id IN (
--   98,99,100,101,102,103,107,108,109,110,111,112,113,114,115,116,119,120,
--   159,203,204,206,217,218,219,220,222,225,226,227,229,230,231,278,280,281,
--   283,307,308,309,315,316,317
-- );
