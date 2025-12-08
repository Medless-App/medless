-- ========================================================
-- MIGRATION 0008: Create medication_cyp_profile table
-- ========================================================
-- Purpose: Add CYP450 enzyme interaction profiles for medications
-- Dependencies: Requires medications table from 0001_initial_schema.sql
-- ========================================================

CREATE TABLE IF NOT EXISTS medication_cyp_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  cyp_enzyme TEXT NOT NULL,
  role TEXT NOT NULL,
  cbd_effect_on_reduction TEXT,
  note TEXT,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- Create index for faster lookups by medication_id
CREATE INDEX IF NOT EXISTS idx_cyp_profile_medication_id 
  ON medication_cyp_profile(medication_id);

-- Create index for faster lookups by cyp_enzyme
CREATE INDEX IF NOT EXISTS idx_cyp_profile_enzyme 
  ON medication_cyp_profile(cyp_enzyme);
