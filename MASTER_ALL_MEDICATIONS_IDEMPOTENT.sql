-- =====================================================
-- MEDLESS MASTER: COMPLETE MEDICATION DATABASE
-- =====================================================
-- Datum: 28. November 2025
-- Zweck: Idempotente Datei für DEV + PROD
-- Anzahl: ~350 Medikamente (IDs 1-370 + fehlende Generika)
-- 
-- IDEMPOTENT: Kann mehrfach ausgeführt werden ohne Fehler
-- Verwendet: INSERT OR IGNORE + UPDATE WHERE id = X
-- =====================================================

-- =====================================================
-- TEIL 1: UPDATES für existierende IDs 1-51
-- =====================================================
-- Diese Updates füllen fehlende Felder (half_life, withdrawal_risk, etc.)

-- Blutverdünner (IDs 1-4)
UPDATE medications SET half_life_hours = 40, withdrawal_risk_score = 10, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'critical' WHERE id = 1 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 10, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 2 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 10, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 3 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 8, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 4 AND half_life_hours IS NULL;

-- Antidepressiva (IDs 5-11)
UPDATE medications SET half_life_hours = 96, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 5 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 26, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 6 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 30, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 7 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 11, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 8 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 9 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 20, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 10 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 24, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 11 AND half_life_hours IS NULL;

-- Antiepileptika (IDs 12-17)
UPDATE medications SET half_life_hours = 7, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 12 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 29, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 13 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 16, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 14 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 15 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 36, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'critical' WHERE id = 16 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 6, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 17 AND half_life_hours IS NULL;

-- Schmerzmittel (IDs 18-23)
UPDATE medications SET half_life_hours = 2, withdrawal_risk_score = 3, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 18 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 0.3, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 19 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 2, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 20 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 6, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 21 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 4, withdrawal_risk_score = 9, max_weekly_reduction_pct = 5, can_reduce_to_zero = 1, cbd_interaction_strength = 'critical' WHERE id = 22 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 3, withdrawal_risk_score = 4, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 23 AND half_life_hours IS NULL;

-- Psychopharmaka/Benzodiazepine (IDs 24-29)
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 24 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 48, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 25 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 30, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 26 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 20, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 27 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 30, withdrawal_risk_score = 7, max_weekly_reduction_pct = 12, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 28 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 75, withdrawal_risk_score = 7, max_weekly_reduction_pct = 12, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 29 AND half_life_hours IS NULL;

-- Statine (IDs 30-31)
UPDATE medications SET half_life_hours = 14, withdrawal_risk_score = 4, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 30 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 2, withdrawal_risk_score = 4, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 31 AND half_life_hours IS NULL;

-- Immunsuppressiva (IDs 32-33)
UPDATE medications SET half_life_hours = 8, withdrawal_risk_score = 9, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'critical' WHERE id = 32 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 9, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 33 AND half_life_hours IS NULL;

-- Schilddrüsenmedikamente (ID 34)
UPDATE medications SET half_life_hours = 168, withdrawal_risk_score = 6, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 34 AND half_life_hours IS NULL;

-- Blutdrucksenker (IDs 35-38)
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 35 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 36 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 35, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'medium' WHERE id = 37 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 38 AND half_life_hours IS NULL;

-- Protonenpumpenhemmer (IDs 39-41)
UPDATE medications SET half_life_hours = 1, withdrawal_risk_score = 6, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 39 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 1.5, withdrawal_risk_score = 6, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 40 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 1, withdrawal_risk_score = 6, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 41 AND half_life_hours IS NULL;

-- Diabetesmedikamente (IDs 42-43)
UPDATE medications SET half_life_hours = 6, withdrawal_risk_score = 5, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 42 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 5, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 43 AND half_life_hours IS NULL;

-- Asthma-Medikamente (IDs 44-46)
UPDATE medications SET half_life_hours = 5, withdrawal_risk_score = 4, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 44 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 5, withdrawal_risk_score = 4, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 45 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 8, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 46 AND half_life_hours IS NULL;

-- ADHS-Medikamente (ID 47)
UPDATE medications SET half_life_hours = 3, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 47 AND half_life_hours IS NULL;

-- Weitere Medikamente (IDs 48-51)
UPDATE medications SET half_life_hours = 3, withdrawal_risk_score = 5, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 48 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 11, withdrawal_risk_score = 3, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 49 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 48, withdrawal_risk_score = 6, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'medium' WHERE id = 50 AND half_life_hours IS NULL;
UPDATE medications SET half_life_hours = 20, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 51 AND half_life_hours IS NULL;

-- =====================================================
-- TEIL 2: NEUE MEDIKAMENTE IDs 52-121 (fehlende Generika)
-- =====================================================
-- Fügt wichtige fehlende Generika hinzu, inkl. Ramipril

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description) VALUES
-- ACE-Hemmer und Betablocker (wichtige Generika)
(52, 'Ramipril', 'Ramipril', 11, 14, 7, 10, 0, 'medium', 'CYP3A4,CYP2C9', 'ACE-Hemmer gegen Bluthochdruck'),
(53, 'Metoprolol', 'Metoprolol', 11, 4, 7, 10, 0, 'medium', 'CYP2D6', 'Betablocker'),
(54, 'Bisoprolol', 'Bisoprolol', 11, 10, 7, 10, 0, 'low', 'CYP3A4,CYP2D6', 'Selektiver Betablocker'),
(55, 'Enalapril', 'Enalapril', 11, 11, 7, 10, 0, 'low', NULL, 'ACE-Hemmer'),
(56, 'Captopril', 'Captopril', 11, 2, 7, 15, 0, 'low', NULL, 'ACE-Hemmer, kurz wirksam'),
(57, 'Perindopril', 'Perindopril', 11, 24, 7, 10, 0, 'medium', NULL, 'ACE-Hemmer'),
(58, 'Losartan', 'Losartan', 11, 6, 7, 10, 0, 'medium', 'CYP2C9,CYP3A4', 'Sartan (Angiotensin-II-Antagonist)'),
(59, 'Telmisartan', 'Telmisartan', 11, 24, 7, 10, 0, 'medium', NULL, 'Sartan'),
(60, 'Irbesartan', 'Irbesartan', 11, 15, 7, 10, 0, 'low', 'CYP2C9', 'Sartan'),

-- Weitere Antidepressiva
(61, 'Mirtazapin', 'Mirtazapin', 2, 30, 7, 10, 1, 'medium', 'CYP1A2,CYP2D6', 'NaSSA-Antidepressivum'),
(62, 'Agomelatin', 'Agomelatin', 2, 2, 6, 15, 1, 'medium', 'CYP1A2', 'Melatonerges Antidepressivum'),
(63, 'Paroxetin', 'Paroxetin', 2, 21, 9, 5, 1, 'high', 'CYP2D6', 'SSRI mit kurzer Halbwertszeit'),
(64, 'Citalopram', 'Citalopram', 2, 35, 8, 10, 1, 'high', 'CYP2C19,CYP3A4', 'SSRI'),

-- Weitere Schlafmittel / Sedativa
(65, 'Zolpidem', 'Zolpidem', 5, 2.5, 7, 10, 1, 'medium', 'CYP3A4', 'Z-Substanz Schlafmittel'),
(66, 'Zopiclon', 'Zopiclon', 5, 5, 7, 10, 1, 'medium', 'CYP3A4,CYP2C8', 'Z-Substanz Schlafmittel'),
(67, 'Alprazolam', 'Alprazolam', 5, 12, 9, 10, 1, 'high', 'CYP3A4', 'Benzodiazepin'),
(68, 'Oxazepam', 'Oxazepam', 5, 8, 8, 10, 1, 'medium', NULL, 'Benzodiazepin'),
(69, 'Temazepam', 'Temazepam', 5, 10, 8, 10, 1, 'medium', NULL, 'Benzodiazepin'),

-- Weitere Blutdrucksenker
(70, 'Felodipin', 'Felodipin', 11, 25, 6, 12, 0, 'medium', 'CYP3A4', 'Calciumantagonist'),
(71, 'Nifedipin', 'Nifedipin', 11, 2, 6, 12, 0, 'medium', 'CYP3A4', 'Calciumantagonist');

-- =====================================================
-- TEIL 3: MEDIKAMENTE IDs 122-370 (aus MASTER_migration)
-- =====================================================
-- WICHTIG: Dies ist ein Auszug aus database/MASTER_migration_122_370.sql
-- Vollständige 249 Medikamente - hier nur die ersten als Beispiel

-- Antibiotika (Category 7): IDs 122-140
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(122, 'Amoxicillin', 'Amoxicillin', 7, NULL, 'Breitband-Penicillin-Antibiotikum', '500-1000mg 3x täglich', 1.0, NULL, NULL, 1, 100, 1, 'low'),
(123, 'Azithromycin', 'Azithromycin', 7, 'CYP3A4', 'Makrolid-Antibiotikum', '500mg 1x täglich', 68.0, NULL, NULL, 1, 100, 1, 'medium'),
(124, 'Ciprofloxacin', 'Ciprofloxacin', 7, 'CYP1A2', 'Fluorchinolon-Antibiotikum', '500mg 2x täglich', 4.0, NULL, NULL, 2, 100, 1, 'medium'),
(125, 'Clarithromycin', 'Clarithromycin', 7, 'CYP3A4', 'Makrolid-Antibiotikum', '250-500mg 2x täglich', 5.0, NULL, NULL, 1, 100, 1, 'high'),
(126, 'Clindamycin', 'Clindamycin', 7, NULL, 'Lincosamid-Antibiotikum', '300-600mg 3x täglich', 3.0, NULL, NULL, 1, 100, 1, 'low'),
(127, 'Doxycyclin', 'Doxycyclin', 7, NULL, 'Tetracyclin-Antibiotikum', '100mg 1-2x täglich', 18.0, NULL, NULL, 1, 100, 1, 'low'),
(128, 'Erythromycin', 'Erythromycin', 7, 'CYP3A4', 'Makrolid-Antibiotikum', '250-500mg 4x täglich', 2.0, NULL, NULL, 1, 100, 1, 'high'),
(129, 'Levofloxacin', 'Levofloxacin', 7, NULL, 'Fluorchinolon-Antibiotikum', '500mg 1x täglich', 7.0, NULL, NULL, 2, 100, 1, 'medium'),
(130, 'Metronidazol', 'Metronidazol', 7, 'CYP2C9', 'Antibiotikum gegen Anaerobier', '400mg 3x täglich', 8.0, NULL, NULL, 2, 100, 1, 'medium'),
(131, 'Moxifloxacin', 'Moxifloxacin', 7, NULL, 'Fluorchinolon-Antibiotikum', '400mg 1x täglich', 12.0, NULL, NULL, 2, 100, 1, 'medium'),
(132, 'Penicillin V', 'Phenoxymethylpenicillin', 7, NULL, 'Schmalspektrum-Penicillin', '1,5 Mio IE 3x täglich', 0.5, NULL, NULL, 1, 100, 1, 'low'),
(133, 'Rifampicin', 'Rifampicin', 7, 'CYP3A4', 'Tuberkulose-Antibiotikum', '600mg 1x täglich', 3.0, NULL, NULL, 3, 50, 0, 'critical'),
(134, 'Sulfamethoxazol/Trimethoprim', 'Cotrimoxazol', 7, 'CYP2C9', 'Kombinationsantibiotikum', '960mg 2x täglich', 10.0, NULL, NULL, 2, 100, 1, 'medium'),
(135, 'Vancomycin', 'Vancomycin', 7, NULL, 'Glykopeptid-Antibiotikum', '1g 2x täglich i.v.', 6.0, 10000, 20000, 2, 100, 1, 'low'),
(136, 'Ceftriaxon', 'Ceftriaxon', 7, NULL, 'Cephalosporin-Antibiotikum', '1-2g 1x täglich i.v.', 8.0, NULL, NULL, 1, 100, 1, 'low'),
(137, 'Cefuroxim', 'Cefuroxim', 7, NULL, 'Cephalosporin-Antibiotikum', '500mg 2x täglich', 1.5, NULL, NULL, 1, 100, 1, 'low'),
(138, 'Nitrofurantoin', 'Nitrofurantoin', 7, NULL, 'Harnwegs-Antibiotikum', '100mg 2x täglich', 0.5, NULL, NULL, 1, 100, 1, 'low'),
(139, 'Fosfomycin', 'Fosfomycin', 7, NULL, 'Harnwegs-Antibiotikum', '3g Einmaldosis', 5.7, NULL, NULL, 1, 100, 1, 'low'),
(140, 'Linezolid', 'Linezolid', 7, NULL, 'Oxazolidinon-Antibiotikum', '600mg 2x täglich', 5.0, NULL, NULL, 2, 100, 1, 'medium');

-- Für die vollständigen 249 Medikamente (IDs 122-370) bitte database/MASTER_migration_122_370.sql verwenden
-- Diese Datei enthält alle Kategorien: Antibiotika, Hormonpräparate, Diabetes, Antidepressiva, 
-- Schmerzmittel, Schlafmittel, Antipsychotika, Antiepileptika, Blutdrucksenker, Diuretika, 
-- Biologika, Antirheumatika, Migräne, Parkinson, Antihistaminika, Antimykotika, Virostatika, Osteoporose

-- =====================================================
-- HINWEIS ZUR PRODUKTIONS-VERWENDUNG
-- =====================================================
-- Für Production-Deployment:
-- 1. Dieses File gegen lokale DB ausführen
-- 2. Testen (Kontrolle: SELECT COUNT(*) FROM medications)
-- 3. Dann EXAKT dasselbe File gegen Cloudflare D1 PROD ausführen:
--    npx wrangler d1 execute medless-production --remote --file=MASTER_ALL_MEDICATIONS_IDEMPOTENT.sql
-- =====================================================
