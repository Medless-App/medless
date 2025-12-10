-- ============================================================================
-- MIGRATION 018 PART B: Manual classification of 40 unclear medications
-- ============================================================================

-- CYP3A4 SUBSTRATES (from 40-unclear list)
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 282;  -- Torasemid
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 286;  -- Indapamid
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 314;  -- Colchicin
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 323;  -- Doxazosin
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 343;  -- Prednisolon
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 362;  -- Eplerenon
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 365;  -- Ambroxol
UPDATE medications SET cyp3a4_substrate = 1 WHERE id = 359;  -- Spironolacton

-- CYP2C9 SUBSTRATES
UPDATE medications SET cyp2c9_substrate = 1 WHERE id = 282;  -- Torasemid (dual)

-- CYP1A2 SUBSTRATES
UPDATE medications SET cyp1a2_substrate = 1 WHERE id = 363;  -- Triamteren

-- NON-CYP MEDICATIONS (Glucuronidation)
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (24, 56, 57, 61, 151);

-- NON-CYP MEDICATIONS (Renal clearance)
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (195, 266, 279, 284, 285, 368, 369);

-- NON-CYP MEDICATIONS (Esterases)
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (19, 98, 159, 298);

-- NON-CYP MEDICATIONS (Other)
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (44, 136, 105, 106, 211, 295, 296, 333, 339, 355);

-- VITAMIN D ANALOGS (treat as NON-CYP for v1)
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (346, 347, 348, 352);

-- UNCERTAIN (Dimetinden)
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id = 135;
