-- ============================================================================
-- MIGRATION 018 PART A: Auto-detect CYP substrates from TEXT field
-- ============================================================================

-- CYP3A4 SUBSTRATES (Auto-detect from TEXT)
UPDATE medications 
SET cyp3a4_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP3A4%' OR cyp450_enzyme LIKE '%cyp3a4%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%'
  AND cyp450_enzyme NOT LIKE '%minimal%CYP%'
  AND cyp450_enzyme NOT LIKE '%kaum%CYP%';

-- CYP2D6 SUBSTRATES (Auto-detect from TEXT)
UPDATE medications 
SET cyp2d6_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP2D6%' OR cyp450_enzyme LIKE '%cyp2d6%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%'
  AND cyp450_enzyme NOT LIKE '%minimal%CYP%';

-- CYP2C9 SUBSTRATES (Auto-detect from TEXT)
UPDATE medications 
SET cyp2c9_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP2C9%' OR cyp450_enzyme LIKE '%cyp2c9%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%';

-- CYP2C19 SUBSTRATES (Auto-detect from TEXT)
UPDATE medications 
SET cyp2c19_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP2C19%' OR cyp450_enzyme LIKE '%cyp2c19%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%';

-- CYP1A2 SUBSTRATES (Auto-detect from TEXT)
UPDATE medications 
SET cyp1a2_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP1A2%' OR cyp450_enzyme LIKE '%cyp1a2%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%';
