-- ========================================================
-- CYP-PROFILE FÜR HIGH-IMPACT MEDIKAMENTE
-- MEDLESS DATENBANK - LOKAL
-- ========================================================

-- ANTIDEPRESSIVA (SSRIs, SNRIs, Trizyklika)
-- --------------------------------------------------------

-- ID 5: Prozac (Fluoxetin) - starker CYP2D6-Inhibitor
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2D6', 'substrate', 'neutral', 'Wird über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2D6', 'inhibitor', 'slower', 'Starker CYP2D6-Inhibitor - Vorsicht bei Kombination mit anderen CYP2D6-Substraten');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2C19', 'substrate', 'neutral', 'Teilweise über CYP2C19 metabolisiert');

-- ID 6: Zoloft (Sertralin)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2D6', 'substrate', 'neutral', 'Teilweise über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2B6', 'inhibitor', 'slower', 'Schwacher CYP2B6-Inhibitor');

-- ID 7: Cipralex (Escitalopram)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD hemmt CYP3A4, daher langsamer ausschleichen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP2D6', 'substrate', 'neutral', 'Geringer CYP2D6-Anteil');

-- ID 8: Trevilor (Venlafaxin)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (8, 'CYP2D6', 'substrate', 'neutral', 'Wird über CYP2D6 zu aktivem Metabolit O-Desmethylvenlafaxin umgewandelt');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (8, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD-Interaktion möglich');

-- ID 9: Cymbalta (Duloxetin)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP1A2', 'substrate', 'neutral', 'Teilweise über CYP1A2 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP2D6', 'inhibitor', 'slower', 'Schwacher CYP2D6-Inhibitor');

-- ID 10: Saroten (Amitriptylin) - trizyklisches Antidepressivum
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 zu Nortriptylin metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2C19', 'substrate', 'neutral', 'Teilweise über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD kann Spiegel erhöhen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2D6', 'inhibitor', 'slower', 'Schwacher CYP2D6-Inhibitor - Vorsicht bei hohen Dosen');


-- BLUTVERDÜNNER
-- --------------------------------------------------------

-- ID 1: Marcumar (Warfarin) - KRITISCH
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP2C9', 'substrate', 'slower', 'S-Warfarin über CYP2C9 - CBD erhöht Blutungsrisiko signifikant');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP3A4', 'substrate', 'slower', 'R-Warfarin über CYP3A4 - CBD hemmt CYP3A4 stark');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP1A2', 'substrate', 'slower', 'Geringer Anteil über CYP1A2 - trotzdem kritische Interaktion');

-- ID 2: Xarelto (Rivaroxaban)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (2, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD erhöht Plasmaspiegel');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (2, 'CYP2J2', 'substrate', 'slower', 'Teilweise über CYP2J2 metabolisiert');

-- ID 3: Eliquis (Apixaban)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (3, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD-Interaktion erhöht Blutungsrisiko');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (3, 'CYP1A2', 'substrate', 'slower', 'Geringer Anteil über CYP1A2');

-- ID 4: Plavix (Clopidogrel) - PRODRUG
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (4, 'CYP2C19', 'substrate', 'slower', 'PRODRUG - muss über CYP2C19 aktiviert werden. CBD-Hemmung reduziert Wirksamkeit');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (4, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 aktiviert');


-- BENZODIAZEPINE / Z-SUBSTANZEN
-- --------------------------------------------------------

-- ID 24: Tavor (Lorazepam) - KEIN CYP-Metabolismus
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (24, 'UGT', 'substrate', 'faster', 'Wird glucuronidiert (UGT), NICHT über CYP - weniger Interaktion mit CBD');

-- ID 25: Valium (Diazepam)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 zu aktivem Metabolit');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD kann Spiegel erhöhen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP2C19', 'inhibitor', 'slower', 'Schwacher CYP2C19-Inhibitor');


-- ANTIPSYCHOTIKA
-- --------------------------------------------------------

-- ID 28: Zyprexa (Olanzapin)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'CYP1A2', 'substrate', 'neutral', 'Hauptsächlich über CYP1A2 metabolisiert - Rauchen beeinflusst stark');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'CYP2D6', 'substrate', 'neutral', 'Teilweise über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'UGT', 'substrate', 'faster', 'Teilweise Glucuronidierung - weniger CBD-Interaktion');

-- ID 29: Abilify (Aripiprazol)
INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD erhöht Plasmaspiegel');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP3A4', 'inhibitor', 'slower', 'Schwacher CYP3A4-Inhibitor');


-- ========================================================
-- ZUSAMMENFASSUNG:
-- 14 Medikamente
-- 37 CYP-Profile
-- Fokus: Antidepressiva, Blutverdünner, Benzodiazepine, Antipsychotika
-- ========================================================
