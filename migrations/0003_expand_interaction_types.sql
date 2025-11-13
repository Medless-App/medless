-- Expand interaction_type constraint to support PuraMed dataset
-- Add: 'risk', 'uncertain', 'interaction' to existing types

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints
-- We need to recreate the table with the updated constraint

-- Step 1: Create new table with expanded constraint
CREATE TABLE IF NOT EXISTS cbd_interactions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  interaction_type TEXT CHECK(interaction_type IN (
    'inhibition', 
    'enhancement', 
    'reduction', 
    'neutral',
    'risk',
    'uncertain',
    'interaction'
  )) NOT NULL,
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  description TEXT NOT NULL,
  mechanism TEXT,
  recommendation TEXT,
  source_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- Step 2: Copy existing data
INSERT INTO cbd_interactions_new 
SELECT * FROM cbd_interactions;

-- Step 3: Drop old table
DROP TABLE cbd_interactions;

-- Step 4: Rename new table
ALTER TABLE cbd_interactions_new RENAME TO cbd_interactions;

-- Step 5: Recreate index
CREATE INDEX IF NOT EXISTS idx_cbd_interactions_medication ON cbd_interactions(medication_id);
CREATE INDEX IF NOT EXISTS idx_cbd_interactions_severity ON cbd_interactions(severity);
