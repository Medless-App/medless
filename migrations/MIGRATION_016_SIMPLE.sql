-- ============================================================================
-- MIGRATION 016: Fix Invalid Half-Life Values (Simplified)
-- Priority: P0 (CRITICAL BLOCKER)
-- Medically validated corrections for 4 medications
-- ============================================================================

-- 1. Hydroxychloroquin (ID 255): 1200h → 50h
UPDATE medications 
SET half_life_hours = 50 
WHERE id = 255 AND half_life_hours = 1200;

-- 2. Alendronat (ID 269): 87600h → 1.5h
UPDATE medications 
SET half_life_hours = 1.5 
WHERE id = 269 AND half_life_hours = 87600;

-- 3. Risedronat (ID 270): 43800h → 1.5h
UPDATE medications 
SET half_life_hours = 1.5 
WHERE id = 270 AND half_life_hours = 43800;

-- 4. Cholecalciferol (ID 352): 1200h → 400h
UPDATE medications 
SET half_life_hours = 400 
WHERE id = 352 AND half_life_hours = 1200;

-- Validation query
SELECT id, name, generic_name, half_life_hours
FROM medications
WHERE id IN (255, 269, 270, 352)
ORDER BY id;
