-- ========================================================
-- MEDLESS DATABASE PATCH: CYP-PROFILE STRUCTURE
-- Patch Number: 010
-- Date: 2025-12-08
-- ========================================================
-- Purpose: Add CYP450 enzyme profiles for medication-CBD interaction modeling
-- Scope: Adds medication_cyp_profile table and initial 37 profiles for 14 high-impact medications
-- Idempotent: YES (safe to run multiple times)
-- ========================================================

-- --------------------------------------------------------
-- PART 1: CREATE TABLE
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS medication_cyp_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  cyp_enzyme TEXT NOT NULL,
  role TEXT NOT NULL,
  cbd_effect_on_reduction TEXT,
  note TEXT,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- --------------------------------------------------------
-- PART 2: INSERT CYP PROFILES (37 profiles for 14 medications)
-- --------------------------------------------------------

-- Medication ID 1: Marcumar (Warfarin) - CRITICAL BLOOD THINNER
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP1A2', 'substrate', 'slower', 'Geringer Anteil über CYP1A2 - trotzdem kritische Interaktion');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP2C9', 'substrate', 'slower', 'S-Warfarin über CYP2C9 - CBD erhöht Blutungsrisiko signifikant');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP3A4', 'substrate', 'slower', 'R-Warfarin über CYP3A4 - CBD hemmt CYP3A4 stark');

-- Medication ID 2: Xarelto (Rivaroxaban)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (2, 'CYP2J2', 'substrate', 'slower', 'Teilweise über CYP2J2 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (2, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD erhöht Plasmaspiegel');

-- Medication ID 3: Eliquis (Apixaban)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (3, 'CYP1A2', 'substrate', 'slower', 'Geringer Anteil über CYP1A2');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (3, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD-Interaktion erhöht Blutungsrisiko');

-- Medication ID 4: Plavix (Clopidogrel) - PRODRUG
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (4, 'CYP2C19', 'substrate', 'slower', 'PRODRUG - muss über CYP2C19 aktiviert werden. CBD-Hemmung reduziert Wirksamkeit');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (4, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 aktiviert');

-- Medication ID 5: Prozac (Fluoxetin) - SSRI
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2C19', 'substrate', 'neutral', 'Teilweise über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2D6', 'substrate', 'neutral', 'Wird über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2D6', 'inhibitor', 'slower', 'Starker CYP2D6-Inhibitor - Vorsicht bei Kombination mit anderen CYP2D6-Substraten');

-- Medication ID 6: Zoloft (Sertralin) - SSRI
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2B6', 'inhibitor', 'slower', 'Schwacher CYP2B6-Inhibitor');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2D6', 'substrate', 'neutral', 'Teilweise über CYP2D6 metabolisiert');

-- Medication ID 7: Cipralex (Escitalopram) - SSRI
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP2D6', 'substrate', 'neutral', 'Geringer CYP2D6-Anteil');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD hemmt CYP3A4, daher langsamer ausschleichen');

-- Medication ID 8: Trevilor (Venlafaxin) - SNRI
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (8, 'CYP2D6', 'substrate', 'neutral', 'Wird über CYP2D6 zu aktivem Metabolit O-Desmethylvenlafaxin umgewandelt');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (8, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD-Interaktion möglich');

-- Medication ID 9: Cymbalta (Duloxetin) - SNRI
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP1A2', 'substrate', 'neutral', 'Teilweise über CYP1A2 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP2D6', 'inhibitor', 'slower', 'Schwacher CYP2D6-Inhibitor');

-- Medication ID 10: Saroten (Amitriptylin) - TCA
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2C19', 'substrate', 'neutral', 'Teilweise über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 zu Nortriptylin metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2D6', 'inhibitor', 'slower', 'Schwacher CYP2D6-Inhibitor - Vorsicht bei hohen Dosen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD kann Spiegel erhöhen');

-- Medication ID 24: Tavor (Lorazepam) - Benzodiazepine
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (24, 'UGT', 'substrate', 'faster', 'Wird glucuronidiert (UGT), NICHT über CYP - weniger Interaktion mit CBD');

-- Medication ID 25: Valium (Diazepam) - Benzodiazepine
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 zu aktivem Metabolit');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP2C19', 'inhibitor', 'slower', 'Schwacher CYP2C19-Inhibitor');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD kann Spiegel erhöhen');

-- Medication ID 28: Zyprexa (Olanzapin) - Antipsychotic
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'CYP1A2', 'substrate', 'neutral', 'Hauptsächlich über CYP1A2 metabolisiert - Rauchen beeinflusst stark');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'CYP2D6', 'substrate', 'neutral', 'Teilweise über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'UGT', 'substrate', 'faster', 'Teilweise Glucuronidierung - weniger CBD-Interaktion');

-- Medication ID 29: Abilify (Aripiprazol) - Antipsychotic
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD erhöht Plasmaspiegel');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP3A4', 'inhibitor', 'slower', 'Schwacher CYP3A4-Inhibitor');

-- ========================================================
-- SUMMARY:
-- - 37 CYP profiles added
-- - 14 medications covered (IDs: 1-10, 24, 25, 28, 29)
-- - Categories: Blood thinners, SSRIs, SNRIs, TCAs, Benzodiazepines, Antipsychotics
-- - Focus on high-impact CBD-medication interactions
-- ========================================================
