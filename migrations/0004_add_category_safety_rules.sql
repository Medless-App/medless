-- Add safety parameters to medication_categories table
-- This migration extends the medication_categories table with safety rules
-- for controlling reduction limits and speed per category.
-- All new fields are NULL-able to ensure backward compatibility.

-- Add safety-related columns to medication_categories
ALTER TABLE medication_categories ADD COLUMN risk_level TEXT NULL;
ALTER TABLE medication_categories ADD COLUMN can_reduce_to_zero INTEGER NULL;
ALTER TABLE medication_categories ADD COLUMN default_min_target_fraction REAL NULL;
ALTER TABLE medication_categories ADD COLUMN max_weekly_reduction_pct REAL NULL;
ALTER TABLE medication_categories ADD COLUMN requires_specialist INTEGER NULL;
ALTER TABLE medication_categories ADD COLUMN notes TEXT NULL;

-- Add comments (stored as metadata, SQLite doesn't support COMMENT directly)
-- risk_level: 'lifelong' | 'high' | 'moderate' | 'low' | NULL
-- can_reduce_to_zero: 0 = no, 1 = yes, NULL = unknown
-- default_min_target_fraction: Minimum fraction of start dose (0.0-1.0), e.g., 0.5 = max 50% reduction
-- max_weekly_reduction_pct: Max weekly reduction as percentage of start dose, e.g., 5 = 5%/week
-- requires_specialist: 0 = no, 1 = yes, NULL = unknown
-- notes: Free-text safety notes

-- Example data updates (optional - can be applied separately)
-- UPDATE medication_categories SET 
--   risk_level = 'high',
--   can_reduce_to_zero = 0,
--   default_min_target_fraction = 0.75,
--   max_weekly_reduction_pct = 5.0,
--   requires_specialist = 1,
--   notes = 'Requires slow tapering under specialist supervision'
-- WHERE name IN ('Benzodiazepine', 'Opioid');
