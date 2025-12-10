-- ============================================================
-- MEDLESS Migration 010: Fix Medication Categories (Batch 2)
-- Neurological & Psychiatric Medications
-- ============================================================
-- DATE: 2025-12-09
-- AUTHOR: Lead Backend Engineer
-- SCOPE: 51 Medications → Existing Categories
-- IMPACT: Reduces uncategorized from 187 to 136 (-51)
-- STATUS: READY FOR REVIEW
-- ============================================================

-- IDEMPOTENZ: Diese Migration kann mehrfach ausgeführt werden
-- Keine INSERT/CREATE-Statements, nur UPDATEs auf vorhandene Datensätze
-- Alle UPDATEs prüfen "(category_id IS NULL OR category_id = 0)"

-- HINWEIS: Diese Migration setzt voraus, dass Migration 009 (Batch 1)
-- bereits ausgeführt wurde und 43 Medikamente kategorisiert hat.

-- ==========================================
-- BATCH 2.1: Antiepileptika (3)
-- ==========================================
-- 8 Medikamente: Antikonvulsiva, Calcium-/Natrium-Kanal-Modulatoren

UPDATE medications 
SET category_id = 3 
WHERE id IN (
  167, -- Pregabalin (Calcium-Kanal-Modulator)
  168, -- Gabapentin (Calcium-Kanal-Modulator)
  238, -- Lamotrigin (Natrium-Kanal-Blocker)
  239, -- Valproinsäure (GABA-Transaminase-Hemmer)
  240, -- Carbamazepin (Antikonvulsivum)
  287, -- Topiramat (Multi-Target Antikonvulsivum)
  288, -- Levetiracetam (SV2A-Modulator)
  289  -- Oxcarbazepin (Natrium-Kanal-Blocker)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.2: Schmerzmittel (nicht-opioid) (4)
-- ==========================================
-- 4 Medikamente: Nicht-opioide Analgetika, Muskelrelaxantien

UPDATE medications 
SET category_id = 4 
WHERE id IN (
  154, -- Paracetamol (Nicht-opioides Analgetikum)
  158, -- Metamizol (Nicht-opioides Analgetikum / Antipyretikum)
  325, -- Baclofen (GABA-B-Agonist / Muskelrelaxans)
  326  -- Tizanidin (Alpha-2-Agonist / Muskelrelaxans)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.3: Psychopharmaka (5)
-- ==========================================
-- 7 Medikamente: Antipsychotika, Anxiolytika, Stimmungsstabilisierer

UPDATE medications 
SET category_id = 5 
WHERE id IN (
  92,  -- Risperdal (Atypisches Antipsychotikum)
  94,  -- Seroquel (Atypisches Antipsychotikum)
  174, -- Buspiron (5-HT1A-Agonist / Anxiolytikum)
  186, -- Ketamin (NMDA-Antagonist / Antidepressivum)
  290, -- Quetiapin (Atypisches Antipsychotikum)
  291, -- Olanzapin (Atypisches Antipsychotikum)
  327  -- Lithium (Phasenprophylaktikum / Stimmungsstabilisierer)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.4: ADHS-Medikamente (15)
-- ==========================================
-- 2 Medikamente: Dopamin-/Noradrenalin-Wiederaufnahmehemmer

UPDATE medications 
SET category_id = 15 
WHERE id IN (
  328, -- Methylphenidat (Dopamin/Noradrenalin-Wiederaufnahmehemmer)
  329  -- Atomoxetin (Noradrenalin-Wiederaufnahmehemmer)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.5: Schlafmittel (16)
-- ==========================================
-- 3 Medikamente: H1-Antihistaminika, Melatonin-Agonisten

UPDATE medications 
SET category_id = 16 
WHERE id IN (
  163, -- Doxylamin (Schlafmittel / H1-Antihistaminikum)
  164, -- Diphenhydramin (Schlafmittel / H1-Antihistaminikum)
  175  -- Melatonin (Schlafmittel / MT1/MT2-Agonist)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.6: Benzodiazepine / Z-Drugs (17)
-- ==========================================
-- 2 Medikamente: Z-Drugs (Non-Benzodiazepin-Hypnotika)

UPDATE medications 
SET category_id = 17 
WHERE id IN (
  160, -- Zolpidem (Z-Drug)
  162  -- Eszopiclon (Z-Drug)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.7: Opioid-Schmerzmittel (18)
-- ==========================================
-- 6 Medikamente: Schwache und starke Opioide

UPDATE medications 
SET category_id = 18 
WHERE id IN (
  177, -- Buprenorphin (Partieller µ-Opioid-Agonist)
  178, -- Tapentadol (Opioid + NRI)
  179, -- Tilidin/Naloxon (Schwaches Opioid + Antagonist)
  180, -- Codein (Schwaches Opioid)
  181, -- Dihydrocodein (Schwaches Opioid)
  182  -- Pethidin (Starkes Opioid)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.8: Dopaminagonisten (Parkinson) (22)
-- ==========================================
-- 2 Medikamente: Dopamin-Rezeptor-Agonisten

UPDATE medications 
SET category_id = 22 
WHERE id IN (
  262, -- Pramipexol (Dopamin-Agonist)
  263  -- Ropinirol (Dopamin-Agonist)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.9: SSRI / SNRI (Antidepressiva) (25)
-- ==========================================
-- 15 Medikamente: Selektive Serotonin-/Noradrenalin-Wiederaufnahmehemmer, Trizyklika

UPDATE medications 
SET category_id = 25 
WHERE id IN (
  165, -- Trazodon (SARI)
  166, -- Trimipramin (Trizyklisches Antidepressivum)
  169, -- Agomelatin (MT1/MT2-Agonist + 5-HT2C-Antagonist)
  170, -- Vortioxetin (Multimodales Antidepressivum)
  171, -- Nortriptylin (Trizyklisches Antidepressivum)
  172, -- Clomipramin (Trizyklisches Antidepressivum)
  173, -- Mianserin (Tetracyclisches Antidepressivum)
  232, -- Sertralin (SSRI)
  233, -- Paroxetin (SSRI)
  234, -- Fluoxetin (SSRI)
  235, -- Venlafaxin (SNRI)
  236, -- Duloxetin (SNRI)
  237, -- Mirtazapin (NaSSA)
  356, -- Citalopram (SSRI)
  357  -- Escitalopram (SSRI)
)
AND (category_id IS NULL OR category_id = 0);

-- ==========================================
-- BATCH 2.10: Parkinson-Medikamente (31)
-- ==========================================
-- 2 Medikamente: Dopamin-Vorstufen, MAO-B-Hemmer

UPDATE medications 
SET category_id = 31 
WHERE id IN (
  261, -- Levodopa/Carbidopa (Dopamin-Vorstufe + DDC-Hemmer)
  264  -- Rasagilin (MAO-B-Hemmer)
)
AND (category_id IS NULL OR category_id = 0);

-- ============================================================
-- VALIDATION QUERIES (run after migration):
-- ============================================================

-- 1. Check all Batch 2 medications have correct categories
-- SELECT category_id, COUNT(*) as count 
-- FROM medications 
-- WHERE id IN (
--   92,94,154,158,160,162,163,164,165,166,167,168,169,170,171,172,173,174,
--   175,177,178,179,180,181,182,186,232,233,234,235,236,237,238,239,240,
--   261,262,263,264,287,288,289,290,291,325,326,327,328,329,356,357
-- )
-- GROUP BY category_id;
--
-- Expected (after migration):
-- category_id | count
-- 3           | 8     (Antiepileptika)
-- 4           | 4     (Schmerzmittel)
-- 5           | 7     (Psychopharmaka)
-- 15          | 2     (ADHS-Medikamente)
-- 16          | 3     (Schlafmittel)
-- 17          | 2     (Benzodiazepine / Z-Drugs)
-- 18          | 6     (Opioid-Schmerzmittel)
-- 22          | 2     (Dopaminagonisten)
-- 25          | 15    (SSRI / SNRI)
-- 31          | 2     (Parkinson-Medikamente)
-- NULL/0      | 0     (all should be categorized!)

-- 2. Count remaining uncategorized medications
-- SELECT COUNT(*) as uncategorized 
-- FROM medications 
-- WHERE category_id IS NULL OR category_id = 0;
--
-- Expected: 136 (187 - 51)

-- 3. Verify no overlap with Batch 1
-- SELECT COUNT(*) as overlap
-- FROM medications
-- WHERE id IN (
--   -- Batch 1 IDs
--   98,99,100,101,102,103,107,108,109,110,111,112,113,114,115,116,119,120,
--   159,203,204,206,217,218,219,220,222,225,226,227,229,230,231,278,280,281,
--   283,307,308,309,315,316,317
-- )
-- AND id IN (
--   -- Batch 2 IDs
--   92,94,154,158,160,162,163,164,165,166,167,168,169,170,171,172,173,174,
--   175,177,178,179,180,181,182,186,232,233,234,235,236,237,238,239,240,
--   261,262,263,264,287,288,289,290,291,325,326,327,328,329,356,357
-- );
--
-- Expected: 0 (no overlap!)

-- ============================================================
-- ROLLBACK (if needed):
-- ============================================================

-- To rollback this migration:
-- UPDATE medications SET category_id = NULL 
-- WHERE id IN (
--   92,94,154,158,160,162,163,164,165,166,167,168,169,170,171,172,173,174,
--   175,177,178,179,180,181,182,186,232,233,234,235,236,237,238,239,240,
--   261,262,263,264,287,288,289,290,291,325,326,327,328,329,356,357
-- );
