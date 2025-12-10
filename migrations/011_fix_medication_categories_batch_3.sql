-- ============================================================================
-- MEDLESS MIGRATION 011: BATCH 3 - ANTI-INFECTIVES & CORE MEDICATIONS
-- ============================================================================
-- Description:  Categorize 91 medications using ONLY existing categories
--               Based on REAL production data after Migration 009 & 010
-- Author:       Lead Backend Engineer
-- Date:         2025-12-09
-- SCOPE:        91 medications across 19 existing categories
-- IMPACT:       136 → 45 uncategorized (-91)
-- DEPENDS ON:   Migration 009 (Batch 1), Migration 010 (Batch 2)
-- IDEMPOTENT:   Yes (only updates NULL/0 category_id)
-- RISK:         LOW (Only existing categories, all IDs verified in Production)
-- ============================================================================

-- ============================================================================
-- VALIDATION QUERIES (RUN BEFORE MIGRATION)
-- ============================================================================
-- Verify starting point:
-- SELECT COUNT(*) FROM medications WHERE category_id IS NULL OR category_id = 0;
-- Expected: 136

-- Verify all 91 IDs exist in database:
-- SELECT COUNT(*) FROM medications WHERE id IN (
--   96,97,104,105,106,117,118,121,122,123,124,125,126,127,128,129,130,
--   131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,
--   156,157,183,184,187,188,189,190,191,192,193,194,195,196,197,198,199,
--   200,201,202,209,213,214,215,228,244,245,246,247,248,249,252,265,269,
--   270,271,272,284,285,286,295,296,298,299,300,301,310,311,318,319,330,
--   331,332,335,337,345,358
-- );
-- Expected: 91

-- ============================================================================
-- MIGRATION 011: BATCH 3 CATEGORIZATION (91 Medications)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- KATEGORIE 5: PSYCHOPHARMAKA (2 Medikamente)
-- Rationale: Typische und atypische Neuroleptika
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 5 WHERE id IN (
  96,   -- Haldol (Haloperidol) - Typisches Neuroleptikum
  97    -- Leponex (Clozapin) - Atypisches Neuroleptikum
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 7: ANTIBIOTIKA (13 Medikamente)
-- Rationale: Beta-Lactame, Makrolide, Fluorchinolone, Tetracycline, Nitroimidazole
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 7 WHERE id IN (
  187,  -- Amoxicillin (Beta-Lactam)
  188,  -- Amoxicillin/Clavulansäure (Beta-Lactam + Inhibitor)
  189,  -- Cefuroxim (Cephalosporin 2. Gen)
  190,  -- Ceftriaxon (Cephalosporin 3. Gen)
  191,  -- Ciprofloxacin (Fluorchinolon)
  192,  -- Levofloxacin (Fluorchinolon)
  193,  -- Azithromycin (Makrolid)
  194,  -- Clarithromycin (Makrolid)
  195,  -- Doxycyclin (Tetracyclin)
  196,  -- Clindamycin (Lincosamid)
  299,  -- Nitrofurantoin (Nitrofuran)
  300,  -- Fosfomycin
  301   -- Metronidazol (Nitroimidazol)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 8: IMMUNSUPPRESSIVA (6 Medikamente)
-- Rationale: Calcineurin-Inhibitoren, Purin-Analoga, mTOR-Inhibitoren
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 8 WHERE id IN (
  126,  -- Ciclosporin (Calcineurin-Inhibitor)
  127,  -- Tacrolimus (Calcineurin-Inhibitor)
  128,  -- Mycophenolat (IMPDH-Inhibitor)
  129,  -- Azathioprin (Purin-Analog)
  130,  -- Sirolimus (mTOR-Inhibitor)
  252   -- Methotrexat (Folsäure-Antagonist / DMARD)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 9: SCHILDDRÜSENMEDIKAMENTE (4 Medikamente)
-- Rationale: T3/T4-Hormone, Thyreostatika
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 9 WHERE id IN (
  104,  -- Levothyroxin (T4)
  105,  -- Liothyronin (T3)
  106,  -- Novothyral (T4 + T3 Kombination)
  272   -- Thiamazol (Thyreostatikum)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 13: DIABETESMEDIKAMENTE (6 Medikamente)
-- Rationale: Insuline (alle Typen), DPP-4-Hemmer
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 13 WHERE id IN (
  117,  -- Insulin Glargin (Langzeit-Insulin)
  118,  -- Insulin Aspart (Kurzzeit-Insulin)
  228,  -- Linagliptin (DPP-4-Hemmer)
  284,  -- Insulin Detemir (Langzeit-Insulin)
  285,  -- Insulin Degludec (Langzeit-Insulin)
  286   -- Insulin Lispro (Kurzzeit-Insulin)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 14: ASTHMA-MEDIKAMENTE (8 Medikamente)
-- Rationale: Beta-2-Agonisten, ICS, LAMA, Leukotrien-Antagonisten
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 14 WHERE id IN (
  136,  -- Salbutamol (SABA)
  137,  -- Formoterol (LABA)
  138,  -- Salmeterol (LABA)
  139,  -- Budesonid (ICS)
  140,  -- Fluticason (ICS)
  141,  -- Tiotropium (LAMA)
  246,  -- Montelukast (Leukotrienrezeptor-Antagonist)
  332   -- Budesonid/Formoterol (ICS + LABA Kombination)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 4: SCHMERZMITTEL (4 Medikamente)
-- Rationale: NSAIDs, COX-2-Hemmer
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 4 WHERE id IN (
  156,  -- Diclofenac (NSAID)
  157,  -- Naproxen (NSAID)
  183,  -- Celecoxib (COX-2-Hemmer)
  184   -- Etoricoxib (COX-2-Hemmer)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 18: OPIOID-SCHMERZMITTEL (2 Medikamente)
-- Rationale: Opioid-Antagonisten (Notfallmedikation, Entzugstherapie)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 18 WHERE id IN (
  244,  -- Naloxon (Opioid-Antagonist)
  245   -- Naltrexon (Opioid-Antagonist)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 20: ANTIARRHYTHMIKA (3 Medikamente)
-- Rationale: Klasse I, III Antiarrhythmika
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 20 WHERE id IN (
  247,  -- Amiodaron (Klasse III)
  248,  -- Sotalol (Klasse III, Beta-Blocker)
  249   -- Propafenon (Klasse IC)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 21: KORTIKOSTEROIDE (SYSTEMISCH) (5 Medikamente)
-- Rationale: Glucocorticoide (systemische Anwendung)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 21 WHERE id IN (
  121,  -- Prednisolon
  122,  -- Prednison
  123,  -- Dexamethason
  124,  -- Hydrocortison
  125   -- Methylprednisolon
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 24: ANTIKOAGULANTIEN (GERINNUNGSHEMMER) (2 Medikamente)
-- Rationale: P2Y12-Inhibitoren
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 24 WHERE id IN (
  310,  -- Prasugrel (P2Y12-Inhibitor)
  311   -- Ticagrelor (P2Y12-Inhibitor)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 26: HORMONPRÄPARATE (8 Medikamente)
-- Rationale: Estrogene, Gestagene, Androgene, Kontrazeptiva
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 26 WHERE id IN (
  142,  -- Estradiol (Estrogen)
  143,  -- Estradiol + Dydrogesteron (Estrogen + Progestogen)
  144,  -- Progesteron (Progestogen)
  145,  -- Levonorgestrel (Progestogen)
  146,  -- Norethisteron (Progestogen)
  147,  -- Testosteron (Androgen)
  335,  -- Ethinylestradiol/Levonorgestrel (Kombinationskontrazeptivum)
  337   -- Desogestrel (Progestogen)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 27: DIURETIKA (6 Medikamente)
-- Rationale: Schleifendiuretika, Thiazide, Aldosteron-Antagonisten
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 27 WHERE id IN (
  197,  -- Hydrochlorothiazide (Thiazid)
  198,  -- Furosemide (Schleifendiuretikum)
  199,  -- Torasemide (Schleifendiuretikum)
  200,  -- Spironolactone (Aldosteron-Antagonist)
  201,  -- Eplerenone (Aldosteron-Antagonist)
  202   -- Indapamide (Thiazid-ähnlich)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 28: BIOLOGIKA (6 Medikamente)
-- Rationale: TNF-alpha-Inhibitoren, Integrin-Inhibitoren, IL-Inhibitoren
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 28 WHERE id IN (
  265,  -- Natalizumab (Integrin-Inhibitor, MS)
  295,  -- Adalimumab (TNF-alpha-Inhibitor)
  296,  -- Etanercept (TNF-alpha-Inhibitor)
  298,  -- Infliximab (TNF-alpha-Inhibitor)
  318,  -- Ustekinumab (IL-12/23-Inhibitor)
  319   -- Vedolizumab (Integrin-Inhibitor, IBD)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 30: MIGRÄNEMEDIKAMENTE (1 Medikament)
-- Rationale: Triptane (akute Migränetherapie)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 30 WHERE id IN (
  213   -- Sumatriptan (Triptan, 5-HT1-Agonist)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 32: ANTIHISTAMINIKA (7 Medikamente)
-- Rationale: H1-Antihistaminika (1. und 2. Generation)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 32 WHERE id IN (
  131,  -- Cetirizin (H1, 2. Gen)
  132,  -- Loratadin (H1, 2. Gen)
  133,  -- Desloratadin (H1, 2. Gen)
  134,  -- Fexofenadin (H1, 2. Gen)
  135,  -- Dimetinden (H1)
  209,  -- Dimenhydrinat (H1, 1. Gen, antiemetisch)
  345   -- Levocetirizin (H1, 2. Gen)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 33: ANTIMYKOTIKA (2 Medikamente)
-- Rationale: Azole, Allylamine
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 33 WHERE id IN (
  214,  -- Fluconazol (Azol-Antimykotikum)
  358   -- Terbinafin (Allylamin-Antimykotikum)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 34: VIROSTATIKA (3 Medikamente)
-- Rationale: Nukleosid-Analoga (Herpes, CMV), Neuraminidase-Hemmer (Influenza)
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 34 WHERE id IN (
  215,  -- Aciclovir (Nukleosid-Analog, Herpes)
  330,  -- Oseltamivir (Neuraminidase-Hemmer, Influenza)
  331   -- Valganciclovir (Nukleosid-Analog, CMV)
) AND (category_id IS NULL OR category_id = 0);

-- ----------------------------------------------------------------------------
-- KATEGORIE 35: OSTEOPOROSE-MEDIKAMENTE (3 Medikamente)
-- Rationale: Bisphosphonate, RANKL-Inhibitoren
-- ----------------------------------------------------------------------------
UPDATE medications SET category_id = 35 WHERE id IN (
  269,  -- Alendronat (Bisphosphonat)
  270,  -- Risedronat (Bisphosphonat)
  271   -- Denosumab (RANKL-Inhibitor)
) AND (category_id IS NULL OR category_id = 0);

-- ============================================================================
-- VALIDATION QUERIES (RUN AFTER MIGRATION)
-- ============================================================================
-- Verify final count:
-- SELECT COUNT(*) FROM medications WHERE category_id IS NULL OR category_id = 0;
-- Expected: 45 (136 - 91)

-- Verify category distribution for Batch 3:
-- SELECT category_id, COUNT(*) 
-- FROM medications 
-- WHERE id IN (
--   96,97,104,105,106,117,118,121,122,123,124,125,126,127,128,129,130,
--   131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,
--   156,157,183,184,187,188,189,190,191,192,193,194,195,196,197,198,199,
--   200,201,202,209,213,214,215,228,244,245,246,247,248,249,252,265,269,
--   270,271,272,284,285,286,295,296,298,299,300,301,310,311,318,319,330,
--   331,332,335,337,345,358
-- )
-- GROUP BY category_id
-- ORDER BY category_id;
-- Expected 19 categories: 4,5,7,8,9,13,14,18,20,21,24,26,27,28,30,32,33,34,35

-- ============================================================================
-- ROLLBACK QUERY (USE ONLY IF MIGRATION NEEDS TO BE REVERSED)
-- ============================================================================
-- UPDATE medications SET category_id = NULL WHERE id IN (
--   96,97,104,105,106,117,118,121,122,123,124,125,126,127,128,129,130,
--   131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,
--   156,157,183,184,187,188,189,190,191,192,193,194,195,196,197,198,199,
--   200,201,202,209,213,214,215,228,244,245,246,247,248,249,252,265,269,
--   270,271,272,284,285,286,295,296,298,299,300,301,310,311,318,319,330,
--   331,332,335,337,345,358
-- );

-- ============================================================================
-- MIGRATION 011 COMPLETE
-- Next: Batch 4 (New Categories + Specialty Medications)
-- Remaining: 45 uncategorized medications
--   - 10 requiring new categories (Batch 4)
--   - 35 requiring manual review
-- ============================================================================
