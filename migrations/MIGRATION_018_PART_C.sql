-- ============================================================================
-- MIGRATION 018 PART C: Mark known inhibitors and inducers
-- ============================================================================

-- CYP2D6 INHIBITORS
UPDATE medications SET cyp2d6_inhibitor = 1 WHERE id = 5 AND cyp2d6_inhibitor = 0;  -- Fluoxetin (Prozac)
UPDATE medications SET cyp2d6_inhibitor = 1 WHERE id = 73 AND cyp2d6_inhibitor = 0;  -- Paroxetin (Seroxat)
UPDATE medications SET cyp2d6_inhibitor = 1 WHERE generic_name = 'Bupropion' AND cyp2d6_inhibitor = 0;

-- CYP2C19 INHIBITORS
UPDATE medications SET cyp2c19_inhibitor = 1 WHERE id IN (39, 108) AND cyp2c19_inhibitor = 0;  -- Omeprazol
UPDATE medications SET cyp2c19_inhibitor = 1 WHERE id = 109 AND cyp2c19_inhibitor = 0;  -- Esomeprazol

-- CYP3A4 INDUCERS
UPDATE medications SET cyp3a4_inducer = 1 WHERE id = 81 AND cyp3a4_inducer = 0;  -- Carbamazepin (Tegretol)
UPDATE medications SET cyp3a4_inducer = 1 WHERE generic_name = 'Rifampicin' AND cyp3a4_inducer = 0;
UPDATE medications SET cyp3a4_inducer = 1 WHERE generic_name LIKE '%Johanniskraut%' AND cyp3a4_inducer = 0;

-- CYP3A4 INHIBITORS
UPDATE medications SET cyp3a4_inhibitor = 1 WHERE generic_name = 'Clarithromycin' AND cyp3a4_inhibitor = 0;
UPDATE medications SET cyp3a4_inhibitor = 1 WHERE generic_name = 'Ketoconazol' AND cyp3a4_inhibitor = 0;
UPDATE medications SET cyp3a4_inhibitor = 1 WHERE generic_name = 'Itraconazol' AND cyp3a4_inhibitor = 0;
