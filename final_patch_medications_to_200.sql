-- ============================================================
-- MEDLESS FINAL PATCH: Datenbank auf 220 Medikamente erweitern
-- ============================================================
-- Datum: 26. November 2025
-- Zweck: 
--   1. Fehlende Risk-Scores für IDs 1-51 ergänzen
--   2. Neue Medikamente hinzufügen (122-220) für ca. 200 Gesamt
--   3. CBD-Interaktionen für neue Medikamente
--
-- WICHTIG: Dieser Patch ist idempotent (kann mehrfach ausgeführt werden)
-- ============================================================

-- ============================================================
-- TEIL 1: DATENQUALITÄT - UPDATE IDs 1-51
-- ============================================================

-- Blutverdünner (IDs 1-4)
UPDATE medications SET half_life_hours = 40, withdrawal_risk_score = 10, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'critical' WHERE id = 1;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 10, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 2;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 10, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 3;
UPDATE medications SET half_life_hours = 8, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 4;

-- Antidepressiva (IDs 5-11)
UPDATE medications SET half_life_hours = 96, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 5;
UPDATE medications SET half_life_hours = 26, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 6;
UPDATE medications SET half_life_hours = 30, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 7;
UPDATE medications SET half_life_hours = 11, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 8;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 9;
UPDATE medications SET half_life_hours = 20, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 10;
UPDATE medications SET half_life_hours = 24, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 11;

-- Antiepileptika (IDs 12-17)
UPDATE medications SET half_life_hours = 7, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 12;
UPDATE medications SET half_life_hours = 29, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 13;
UPDATE medications SET half_life_hours = 16, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'high' WHERE id = 14;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 15;
UPDATE medications SET half_life_hours = 36, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'critical' WHERE id = 16;
UPDATE medications SET half_life_hours = 6, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 17;

-- Schmerzmittel (IDs 18-23)
UPDATE medications SET half_life_hours = 2, withdrawal_risk_score = 3, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 18;
UPDATE medications SET half_life_hours = 0.3, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 19;
UPDATE medications SET half_life_hours = 2, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 20;
UPDATE medications SET half_life_hours = 6, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 21;
UPDATE medications SET half_life_hours = 4, withdrawal_risk_score = 9, max_weekly_reduction_pct = 5, can_reduce_to_zero = 1, cbd_interaction_strength = 'critical' WHERE id = 22;
UPDATE medications SET half_life_hours = 3, withdrawal_risk_score = 4, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 23;

-- Psychopharmaka (IDs 24-29)
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 24;
UPDATE medications SET half_life_hours = 48, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 25;
UPDATE medications SET half_life_hours = 30, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 26;
UPDATE medications SET half_life_hours = 20, withdrawal_risk_score = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 27;
UPDATE medications SET half_life_hours = 33, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 28;
UPDATE medications SET half_life_hours = 75, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 29;

-- Statine (IDs 30-31)
UPDATE medications SET half_life_hours = 14, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 30;
UPDATE medications SET half_life_hours = 2, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'high' WHERE id = 31;

-- Immunsuppressiva (IDs 32-33)
UPDATE medications SET half_life_hours = 8, withdrawal_risk_score = 9, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'critical' WHERE id = 32;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 9, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0, cbd_interaction_strength = 'critical' WHERE id = 33;

-- Schilddrüsenmedikamente (ID 34)
UPDATE medications SET half_life_hours = 168, withdrawal_risk_score = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'medium' WHERE id = 34;

-- Blutdrucksenker (IDs 35-38)
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'medium' WHERE id = 35;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'medium' WHERE id = 36;
UPDATE medications SET half_life_hours = 35, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'medium' WHERE id = 37;
UPDATE medications SET half_life_hours = 9, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 38;

-- Protonenpumpenhemmer (IDs 39-41)
UPDATE medications SET half_life_hours = 1, withdrawal_risk_score = 6, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 39;
UPDATE medications SET half_life_hours = 1.5, withdrawal_risk_score = 6, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 40;
UPDATE medications SET half_life_hours = 1, withdrawal_risk_score = 6, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 41;

-- Diabetesmedikamente (IDs 42-43)
UPDATE medications SET half_life_hours = 6, withdrawal_risk_score = 5, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 42;
UPDATE medications SET half_life_hours = 12, withdrawal_risk_score = 5, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'low' WHERE id = 43;

-- Asthma-Medikamente (IDs 44-46)
UPDATE medications SET half_life_hours = 5, withdrawal_risk_score = 4, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 44;
UPDATE medications SET half_life_hours = 5, withdrawal_risk_score = 4, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 45;
UPDATE medications SET half_life_hours = 8, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 46;

-- ADHS-Medikamente (ID 47)
UPDATE medications SET half_life_hours = 3, withdrawal_risk_score = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 47;

-- Weitere (IDs 48-50)
UPDATE medications SET half_life_hours = 3, withdrawal_risk_score = 5, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 48;
UPDATE medications SET half_life_hours = 11, withdrawal_risk_score = 3, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1, cbd_interaction_strength = 'low' WHERE id = 49;
UPDATE medications SET half_life_hours = 48, withdrawal_risk_score = 6, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0, cbd_interaction_strength = 'medium' WHERE id = 50;

-- Bupropion (ID 51)
UPDATE medications SET half_life_hours = 20, withdrawal_risk_score = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1, cbd_interaction_strength = 'medium' WHERE id = 51;

-- ============================================================
-- TEIL 2: NEUE MEDIKAMENTE (IDs 122-220)
-- ============================================================

-- Antibiotika (20 Medikamente, Category 7)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(122, 'Amoxicillin', 'Amoxicillin', 7, NULL, 'Breitspektrum-Penicillin', '500-1000 mg 3x täglich', 1, 2, 30, 1, 'low'),
(123, 'Azithromycin', 'Azithromycin', 7, 'CYP3A4', 'Makrolid-Antibiotikum', '500 mg/Tag', 68, 2, 30, 1, 'medium'),
(124, 'Ciprofloxacin', 'Ciprofloxacin', 7, 'CYP1A2', 'Fluorchinolon', '500-750 mg 2x täglich', 4, 3, 25, 1, 'medium'),
(125, 'Doxycyclin', 'Doxycyclin', 7, NULL, 'Tetracyclin-Antibiotikum', '100-200 mg/Tag', 18, 2, 25, 1, 'low'),
(126, 'Clindamycin', 'Clindamycin', 7, 'CYP3A4', 'Lincosamid-Antibiotikum', '600 mg 3x täglich', 3, 3, 25, 1, 'low'),
(127, 'Ceftriaxon', 'Ceftriaxon', 7, NULL, 'Cephalosporin 3. Generation', '1-2 g/Tag i.v.', 8, 2, 30, 1, 'low'),
(128, 'Clarithromycin', 'Clarithromycin', 7, 'CYP3A4', 'Makrolid-Antibiotikum', '500 mg 2x täglich', 5, 2, 25, 1, 'high'),
(129, 'Levofloxacin', 'Levofloxacin', 7, NULL, 'Fluorchinolon', '500-750 mg/Tag', 7, 3, 25, 1, 'low'),
(130, 'Moxifloxacin', 'Moxifloxacin', 7, NULL, 'Fluorchinolon', '400 mg/Tag', 12, 3, 25, 1, 'medium'),
(131, 'Metronidazol', 'Metronidazol', 7, 'CYP2C9', 'Nitroimidazol', '500 mg 3x täglich', 8, 3, 25, 1, 'low'),
(132, 'Cefuroxim', 'Cefuroxim', 7, NULL, 'Cephalosporin 2. Generation', '500 mg 2x täglich', 1.3, 2, 30, 1, 'low'),
(133, 'Amoxicillin/Clavulansäure', 'Amoxicillin/Clavulansäure', 7, NULL, 'Betalactamase-Inhibitor-Kombination', '875/125 mg 2x täglich', 1, 2, 30, 1, 'low'),
(134, 'Trimethoprim/Sulfamethoxazol', 'Trimethoprim/Sulfamethoxazol', 7, 'CYP2C9', 'Sulfonamid-Kombination', '960 mg 2x täglich', 10, 3, 25, 1, 'low'),
(135, 'Erythromycin', 'Erythromycin', 7, 'CYP3A4', 'Makrolid-Antibiotikum', '500 mg 4x täglich', 2, 2, 30, 1, 'high'),
(136, 'Penicillin V', 'Penicillin V', 7, NULL, 'Penicillin oral', '1 Mio. IE 3x täglich', 0.5, 2, 30, 1, 'low'),
(137, 'Flucloxacillin', 'Flucloxacillin', 7, NULL, 'Penicillinase-festes Penicillin', '500-1000 mg 4x täglich', 1, 2, 30, 1, 'low'),
(138, 'Nitrofurantoin', 'Nitrofurantoin', 7, NULL, 'Harnwegsantibiotikum', '100 mg 2x täglich', 0.3, 2, 30, 1, 'low'),
(139, 'Fosfomycin', 'Fosfomycin', 7, NULL, 'Einmaldosis-Antibiotikum', '3 g Einmaldosis', 4, 2, 30, 1, 'low'),
(140, 'Vancomycin', 'Vancomycin', 7, NULL, 'Glykopeptid-Antibiotikum', '1 g 2x täglich i.v.', 6, 4, 20, 1, 'low'),
(141, 'Linezolid', 'Linezolid', 7, NULL, 'Oxazolidinon-Antibiotikum', '600 mg 2x täglich', 5, 4, 20, 1, 'medium');

-- Hormonpräparate (15 Medikamente, Category 25 - neue Kategorie)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(142, 'Estradiol', 'Estradiol', 25, 'CYP3A4', 'Östrogen für Hormonersatztherapie', '1-2 mg/Tag', 24, 6, 15, 0, 'medium'),
(143, 'Progesteron', 'Progesteron', 25, 'CYP3A4', 'Gestagen', '100-200 mg/Tag', 5, 5, 15, 0, 'low'),
(144, 'Levonorgestrel', 'Levonorgestrel', 25, 'CYP3A4', 'Gestagen in Kontrazeptiva', '0.03 mg/Tag', 27, 5, 15, 1, 'low'),
(145, 'Ethinylestradiol', 'Ethinylestradiol', 25, 'CYP3A4', 'Synthetisches Östrogen', '0.02-0.035 mg/Tag', 24, 5, 15, 1, 'medium'),
(146, 'Drospirenon', 'Drospirenon', 25, 'CYP3A4', 'Gestagen mit antiandrogener Wirkung', '3 mg/Tag', 30, 5, 15, 1, 'low'),
(147, 'Testosteron', 'Testosteron', 25, 'CYP3A4', 'Androgen', '50-100 mg alle 2-3 Tage', 10, 6, 15, 0, 'medium'),
(148, 'Finasterid', 'Finasterid', 25, 'CYP3A4', '5α-Reduktase-Hemmer', '1-5 mg/Tag', 6, 5, 15, 1, 'low'),
(149, 'Tamoxifen', 'Tamoxifen', 25, 'CYP2D6, CYP3A4', 'Selektiver Östrogenrezeptor-Modulator', '20 mg/Tag', 168, 7, 10, 0, 'high'),
(150, 'Tibolon', 'Tibolon', 25, 'CYP3A4', 'Synthetisches Steroid', '2.5 mg/Tag', 45, 6, 15, 0, 'low'),
(151, 'Raloxifen', 'Raloxifen', 25, 'UGT', 'SERM für Osteoporose', '60 mg/Tag', 28, 5, 15, 1, 'low'),
(152, 'Dienogest', 'Dienogest', 25, 'CYP3A4', 'Gestagen', '2 mg/Tag', 11, 5, 15, 1, 'low'),
(153, 'Desogestrel', 'Desogestrel', 25, 'CYP3A4', 'Gestagen-only Pille', '0.075 mg/Tag', 30, 5, 15, 1, 'low'),
(154, 'Norethisteron', 'Norethisteron', 25, 'CYP3A4', 'Gestagen', '5-10 mg/Tag', 8, 5, 15, 1, 'low'),
(155, 'Medroxyprogesteronacetat', 'Medroxyprogesteronacetat', 25, 'CYP3A4', 'Depot-Gestagen', '150 mg/3 Monate i.m.', 30, 6, 15, 0, 'low'),
(156, 'Clomifen', 'Clomifen', 25, 'CYP3A4, CYP2D6', 'Antiöstrogen zur Ovulationsinduktion', '50-100 mg/Tag', 120, 5, 15, 1, 'low');

-- Diabetesmedikamente (13 Medikamente, Category 13)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(157, 'Glimepirid', 'Glimepirid', 13, 'CYP2C9', 'Sulfonylharnstoff', '1-4 mg/Tag', 9, 6, 10, 0, 'low'),
(158, 'Gliclazid', 'Gliclazid', 13, 'CYP2C9', 'Sulfonylharnstoff', '30-120 mg/Tag', 12, 6, 10, 0, 'low'),
(159, 'Insulin glargin', 'Insulin glargin', 13, NULL, 'Langwirksames Basalinsulin', '10-40 IE/Tag s.c.', 24, 8, 5, 0, 'low'),
(160, 'Insulin detemir', 'Insulin detemir', 13, NULL, 'Langwirksames Basalinsulin', '10-40 IE/Tag s.c.', 12, 8, 5, 0, 'low'),
(161, 'Liraglutid', 'Liraglutid', 13, NULL, 'GLP-1-Agonist', '0.6-1.8 mg/Tag s.c.', 13, 5, 10, 0, 'low'),
(162, 'Semaglutid', 'Semaglutid', 13, NULL, 'GLP-1-Agonist', '0.5-1 mg/Woche s.c.', 168, 5, 10, 0, 'low'),
(163, 'Empagliflozin', 'Empagliflozin', 13, 'UGT', 'SGLT2-Inhibitor', '10-25 mg/Tag', 12, 5, 10, 0, 'low'),
(164, 'Dapagliflozin', 'Dapagliflozin', 13, 'UGT', 'SGLT2-Inhibitor', '10 mg/Tag', 13, 5, 10, 0, 'low'),
(165, 'Canagliflozin', 'Canagliflozin', 13, 'UGT', 'SGLT2-Inhibitor', '100-300 mg/Tag', 11, 5, 10, 0, 'low'),
(166, 'Pioglitazon', 'Pioglitazon', 13, 'CYP2C8, CYP3A4', 'Thiazolidindion', '15-45 mg/Tag', 7, 6, 10, 0, 'medium'),
(167, 'Repaglinid', 'Repaglinid', 13, 'CYP2C8, CYP3A4', 'Glinid', '0.5-4 mg vor Mahlzeiten', 1, 5, 15, 0, 'low'),
(168, 'Acarbose', 'Acarbose', 13, NULL, 'Alpha-Glucosidase-Hemmer', '50-100 mg 3x täglich', 2, 3, 20, 1, 'low'),
(169, 'Dulaglutid', 'Dulaglutid', 13, NULL, 'GLP-1-Agonist', '0.75-1.5 mg/Woche s.c.', 120, 5, 10, 0, 'low');

-- Antidepressiva (11 Medikamente, Category 2)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(170, 'Paroxetin', 'Paroxetin', 2, 'CYP2D6', 'SSRI mit kurzem t½', '20-50 mg/Tag', 21, 9, 5, 1, 'high'),
(171, 'Mirtazapin', 'Mirtazapin', 2, 'CYP1A2, CYP2D6, CYP3A4', 'NaSSA, sedierend', '15-45 mg/Tag', 30, 7, 10, 1, 'medium'),
(172, 'Doxepin', 'Doxepin', 2, 'CYP2D6, CYP2C19', 'Trizyklisches Antidepressivum', '25-150 mg/Tag', 17, 8, 10, 1, 'high'),
(173, 'Clomipramin', 'Clomipramin', 2, 'CYP2D6, CYP2C19, CYP3A4', 'Trizyklisches Antidepressivum', '50-200 mg/Tag', 32, 8, 10, 1, 'high'),
(174, 'Agomelatin', 'Agomelatin', 2, 'CYP1A2', 'MT1/MT2-Agonist', '25-50 mg/Tag', 2, 6, 15, 1, 'medium'),
(175, 'Vortioxetin', 'Vortioxetin', 2, 'CYP2D6', 'Multimodales Antidepressivum', '10-20 mg/Tag', 66, 7, 10, 1, 'medium'),
(176, 'Reboxetin', 'Reboxetin', 2, 'CYP3A4', 'Selektiver NRI', '4-12 mg/Tag', 13, 7, 10, 1, 'medium'),
(177, 'Moclobemid', 'Moclobemid', 2, 'CYP2C19', 'Reversibler MAO-A-Hemmer', '300-600 mg/Tag', 2, 6, 15, 1, 'medium'),
(178, 'Tianeptin', 'Tianeptin', 2, NULL, 'Atypisches Antidepressivum', '12.5 mg 3x täglich', 3, 7, 10, 1, 'low'),
(179, 'Nortriptylin', 'Nortriptylin', 2, 'CYP2D6', 'Trizyklisches Antidepressivum', '25-150 mg/Tag', 28, 8, 10, 1, 'high'),
(180, 'Imipramin', 'Imipramin', 2, 'CYP2D6, CYP2C19', 'Trizyklisches Antidepressivum', '75-200 mg/Tag', 18, 8, 10, 1, 'high');

-- Schmerzmittel (7 Medikamente, Category 4)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(181, 'Morphin', 'Morphin', 4, 'UGT', 'Starkes Opioid', '10-30 mg p.o. alle 4h', 3, 9, 5, 1, 'critical'),
(182, 'Fentanyl', 'Fentanyl', 4, 'CYP3A4', 'Sehr starkes Opioid', '12-100 µg/h Pflaster', 7, 10, 5, 1, 'critical'),
(183, 'Buprenorphin', 'Buprenorphin', 4, 'CYP3A4', 'Partieller µ-Agonist', '0.2-0.8 mg sublingual', 37, 9, 5, 1, 'critical'),
(184, 'Hydrocodon', 'Hydrocodon', 4, 'CYP2D6', 'Starkes Opioid', '5-10 mg alle 4-6h', 4, 9, 5, 1, 'critical'),
(185, 'Tapentadol', 'Tapentadol', 4, 'UGT', 'Opioid + NRI', '50-250 mg 2x täglich', 4, 8, 10, 1, 'high'),
(186, 'Etoricoxib', 'Etoricoxib', 4, 'CYP3A4', 'COX-2-Hemmer', '60-120 mg/Tag', 22, 5, 15, 1, 'medium'),
(187, 'Paracetamol', 'Paracetamol', 4, 'CYP2E1', 'Nicht-opioides Analgetikum', '500-1000 mg bis 4x täglich', 2, 2, 20, 1, 'low');

-- Blutdrucksenker (5 Medikamente, Category 11)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(188, 'Bisoprolol', 'Bisoprolol', 11, NULL, 'Beta-Blocker kardioselektiv', '2.5-10 mg/Tag', 11, 8, 10, 0, 'low'),
(189, 'Metoprolol', 'Metoprolol', 11, 'CYP2D6', 'Beta-Blocker', '50-200 mg/Tag', 4, 8, 10, 0, 'medium'),
(190, 'Enalapril', 'Enalapril', 11, NULL, 'ACE-Hemmer', '5-40 mg/Tag', 11, 7, 10, 0, 'low'),
(191, 'Losartan', 'Losartan', 11, 'CYP2C9, CYP3A4', 'AT1-Blocker', '50-100 mg/Tag', 2, 7, 10, 0, 'low'),
(192, 'Nifedipin', 'Nifedipin', 11, 'CYP3A4', 'Calcium-Kanal-Blocker', '30-60 mg retard/Tag', 2, 7, 10, 0, 'high');

-- Weitere Kategorien (28 Medikamente verteilt)
-- Antihistaminika (4, Category 22)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(193, 'Diphenhydramin', 'Diphenhydramin', 22, 'CYP2D6', 'Sedierendes H1-Antihistaminikum', '25-50 mg bei Bedarf', 9, 4, 20, 1, 'medium'),
(194, 'Promethazin', 'Promethazin', 22, 'CYP2D6', 'Stark sedierendes Antihistaminikum', '25-75 mg/Tag', 12, 5, 15, 1, 'medium'),
(195, 'Bilastin', 'Bilastin', 22, NULL, 'Nicht-sedierendes H1-Antihistaminikum', '20 mg/Tag', 14, 3, 20, 1, 'low'),
(196, 'Rupatadin', 'Rupatadin', 22, 'CYP3A4', 'H1-Antagonist', '10 mg/Tag', 6, 3, 20, 1, 'low');

-- Antiepileptika (5, Category 3)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(197, 'Carbamazepin', 'Carbamazepin', 3, 'CYP3A4', 'Klassisches Antiepileptikum', '200-1200 mg/Tag', 36, 8, 10, 0, 'high'),
(198, 'Phenytoin', 'Phenytoin', 3, 'CYP2C9, CYP2C19', 'Klassisches Antiepileptikum', '200-400 mg/Tag', 24, 8, 10, 0, 'high'),
(199, 'Topiramat', 'Topiramat', 3, NULL, 'Antiepileptikum', '100-400 mg/Tag', 21, 8, 10, 1, 'medium'),
(200, 'Levetiracetam', 'Levetiracetam', 3, NULL, 'Neues Antiepileptikum', '1000-3000 mg/Tag', 7, 7, 10, 1, 'low'),
(201, 'Brivaracetam', 'Brivaracetam', 3, 'CYP2C19', 'Antiepileptikum', '50-200 mg/Tag', 9, 7, 10, 1, 'low');

-- Statine (2, Category 6)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(202, 'Fluvastatin', 'Fluvastatin', 6, 'CYP2C9', 'Statin', '20-80 mg/Tag', 3, 5, 15, 1, 'medium'),
(203, 'Pitavastatin', 'Pitavastatin', 6, 'CYP2C9', 'Statin', '1-4 mg/Tag', 12, 5, 15, 1, 'low');

-- Asthma-Medikamente (4, Category 14)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(204, 'Formoterol', 'Formoterol', 14, NULL, 'LABA', '12 µg 2x täglich inhalativ', 10, 4, 15, 1, 'low'),
(205, 'Salmeterol', 'Salmeterol', 14, 'CYP3A4', 'LABA', '50 µg 2x täglich inhalativ', 5, 4, 15, 1, 'low'),
(206, 'Budesonid', 'Budesonid', 14, 'CYP3A4', 'Inhalatives Steroid', '200-800 µg 2x täglich', 3, 5, 15, 1, 'medium'),
(207, 'Theophyllin', 'Theophyllin', 14, 'CYP1A2, CYP3A4', 'Methylxanthin Bronchodilatator', '400-800 mg/Tag', 8, 6, 10, 1, 'high');

-- Protonenpumpenhemmer (2, Category 12)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(208, 'Dexlansoprazol', 'Dexlansoprazol', 12, 'CYP2C19, CYP3A4', 'PPI R-Enantiomer', '30-60 mg/Tag', 1.5, 6, 20, 1, 'medium'),
(209, 'Famotidin', 'Famotidin', 12, NULL, 'H2-Blocker', '20-40 mg/Tag', 3, 5, 20, 1, 'low');

-- Schilddrüsenmedikamente (2, Category 9)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(210, 'Liothyronin', 'Liothyronin', 9, NULL, 'T3 Schilddrüsenhormon', '5-25 µg/Tag', 24, 7, 10, 0, 'low'),
(211, 'Carbimazol', 'Carbimazol', 9, NULL, 'Thyreostatikum', '10-40 mg/Tag', 6, 7, 10, 0, 'low');

-- Immunsuppressiva (3, Category 8)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(212, 'Sirolimus', 'Sirolimus', 8, 'CYP3A4', 'mTOR-Inhibitor', '2-5 mg/Tag', 62, 9, 5, 0, 'critical'),
(213, 'Everolimus', 'Everolimus', 8, 'CYP3A4', 'mTOR-Inhibitor', '5-10 mg/Tag', 30, 9, 5, 0, 'critical'),
(214, 'Methotrexat', 'Methotrexat', 8, NULL, 'Folsäure-Antagonist', '7.5-25 mg/Woche', 8, 7, 10, 0, 'medium');

-- Antipsychotika (3, Category 18)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(215, 'Paliperidon', 'Paliperidon', 18, NULL, 'Atypisches Antipsychotikum', '3-12 mg/Tag', 23, 7, 10, 1, 'medium'),
(216, 'Cariprazin', 'Cariprazin', 18, 'CYP3A4', 'Atypisches Antipsychotikum', '1.5-6 mg/Tag', 72, 7, 10, 1, 'medium'),
(217, 'Lurasidon', 'Lurasidon', 18, 'CYP3A4', 'Atypisches Antipsychotikum', '40-160 mg/Tag', 18, 7, 10, 1, 'medium');

-- Diuretika (3, neue Category 26)
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(218, 'Furosemid', 'Furosemid', 26, NULL, 'Schleifendiuretikum', '20-80 mg/Tag', 1.5, 6, 15, 0, 'low'),
(219, 'Hydrochlorothiazid', 'Hydrochlorothiazid', 26, NULL, 'Thiaziddiuretikum', '12.5-50 mg/Tag', 10, 6, 15, 0, 'low'),
(220, 'Spironolacton', 'Spironolacton', 26, 'CYP3A4', 'Kaliumsparendes Diuretikum', '25-100 mg/Tag', 20, 6, 15, 0, 'medium');

-- ============================================================
-- TEIL 3: CBD-INTERAKTIONEN FÜR NEUE MEDIKAMENTE
-- ============================================================

-- Antibiotika
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(123, 'enhancement', 'moderate', 'Erhöhtes QT-Zeit-Risiko bei Kombination', 'CBD hemmt CYP3A4, Azithromycin wird über CYP3A4 metabolisiert', 'EKG-Überwachung bei kardialen Vorerkrankungen empfohlen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(124, 'enhancement', 'moderate', 'Erhöhtes ZNS-Nebenwirkungsrisiko', 'CBD hemmt CYP1A2', 'Auf Schwindel und Benommenheit achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(128, 'enhancement', 'high', 'Stark erhöhtes QT-Zeit-Risiko', 'Clarithromycin ist CYP3A4-Inhibitor, CBD ebenfalls', 'EKG-Kontrolle, Kombination möglichst vermeiden', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(130, 'enhancement', 'moderate', 'Erhöhtes QT-Zeit-Risiko', 'CBD kann QT-Zeit verlängern, Moxifloxacin ebenfalls', 'EKG-Überwachung bei Risikopatienten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(135, 'enhancement', 'high', 'Stark erhöhtes QT-Zeit-Risiko', 'Erythromycin hemmt CYP3A4, CBD ebenfalls', 'Kombination vermeiden oder engmaschige Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Hormonpräparate
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(142, 'enhancement', 'moderate', 'Erhöhte Östrogen-Spiegel möglich', 'Estradiol wird über CYP3A4 metabolisiert, CBD hemmt CYP3A4', 'Auf Nebenwirkungen achten, Hormon-Spiegel überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(144, 'enhancement', 'moderate', 'Verhütungssicherheit könnte beeinflusst werden', 'Levonorgestrel wird über CYP3A4 metabolisiert', 'Zusätzliche Verhütungsmethode erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(145, 'enhancement', 'moderate', 'Verhütungssicherheit könnte beeinflusst werden', 'Ethinylestradiol wird über CYP3A4 metabolisiert', 'Zusätzliche Verhütungsmethode erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(147, 'enhancement', 'moderate', 'Erhöhte Testosteron-Spiegel möglich', 'Testosteron wird über CYP3A4 metabolisiert', 'Leberwerte und Testosteron-Spiegel überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(149, 'enhancement', 'high', 'Erhöhtes Thromboserisiko', 'Tamoxifen wird über CYP2D6 und CYP3A4 metabolisiert', 'Engmaschige Überwachung, Onkologe informieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Diabetes
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(157, 'enhancement', 'moderate', 'Erhöhtes Hypoglykämie-Risiko', 'Glimepirid wird über CYP2C9 metabolisiert, CBD hemmt CYP2C9', 'Blutzucker engmaschig kontrollieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(158, 'enhancement', 'moderate', 'Erhöhtes Hypoglykämie-Risiko', 'Gliclazid wird über CYP2C9 metabolisiert', 'Blutzuckerkontrolle, auf Unterzucker achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(166, 'enhancement', 'moderate', 'Erhöhtes Nebenwirkungsrisiko', 'Pioglitazon wird über CYP2C8 und CYP3A4 metabolisiert', 'Leberwerte überwachen, auf Ödeme achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(167, 'enhancement', 'low', 'Mögliche Verstärkung', 'Repaglinid wird über CYP2C8 und CYP3A4 metabolisiert', 'Blutzuckerkontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Antidepressiva
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(170, 'enhancement', 'high', 'Stark erhöhtes Absetzsyndrom-Risiko', 'Paroxetin wird über CYP2D6 metabolisiert, CBD hemmt CYP2D6', 'Sehr langsames Ausschleichen, engmaschige Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(171, 'enhancement', 'moderate', 'Verstärkte Sedierung möglich', 'Mirtazapin wird über CYP1A2, CYP2D6, CYP3A4 metabolisiert', 'Auf verstärkte Müdigkeit achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(172, 'enhancement', 'high', 'Erhöhte TCA-Spiegel', 'Doxepin wird über CYP2D6 und CYP2C19 metabolisiert', 'TCA-Spiegel überwachen, auf Nebenwirkungen achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(173, 'enhancement', 'high', 'Stark erhöhte TCA-Spiegel', 'Clomipramin wird über CYP2D6, CYP2C19, CYP3A4 metabolisiert', 'Engmaschige Überwachung, TCA-Spiegel messen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(175, 'enhancement', 'moderate', 'Erhöhte Vortioxetin-Spiegel', 'Vortioxetin wird über CYP2D6 metabolisiert', 'Auf Übelkeit und Schwindel achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(176, 'enhancement', 'moderate', 'Erhöhte Reboxetin-Spiegel', 'Reboxetin wird über CYP3A4 metabolisiert', 'Auf Nebenwirkungen achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(179, 'enhancement', 'high', 'Erhöhte TCA-Spiegel', 'Nortriptylin wird über CYP2D6 metabolisiert', 'TCA-Spiegel überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(180, 'enhancement', 'high', 'Erhöhte TCA-Spiegel', 'Imipramin wird über CYP2D6, CYP2C19 metabolisiert', 'TCA-Spiegel überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Schmerzmittel
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(181, 'enhancement', 'critical', 'Stark erhöhtes Atemdepressionsrisiko', 'Morphin: Additive ZNS-Dämpfung mit CBD', 'Nur unter engster ärztlicher Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(182, 'enhancement', 'critical', 'Extrem hohes Atemdepressionsrisiko', 'Fentanyl wird über CYP3A4 metabolisiert, CBD hemmt CYP3A4', 'Kombination möglichst vermeiden', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(183, 'enhancement', 'critical', 'Erhöhte Sedierung und Atemdepression', 'Buprenorphin wird über CYP3A4 metabolisiert', 'Engmaschige Überwachung, Dosisreduktion erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(184, 'enhancement', 'critical', 'Stark erhöhtes Atemdepressionsrisiko', 'Hydrocodon wird über CYP2D6 metabolisiert', 'Nur unter engster ärztlicher Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(185, 'enhancement', 'high', 'Erhöhte Sedierung', 'Tapentadol: Additive ZNS-Dämpfung', 'Vorsichtige Kombination, auf Müdigkeit achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(186, 'enhancement', 'moderate', 'Erhöhte Etoricoxib-Spiegel', 'Etoricoxib wird über CYP3A4 metabolisiert', 'Auf gastrointestinale Nebenwirkungen achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Blutdrucksenker
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(189, 'enhancement', 'moderate', 'Erhöhte Metoprolol-Spiegel', 'Metoprolol wird über CYP2D6 metabolisiert', 'Blutdruck und Herzfrequenz überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(192, 'enhancement', 'high', 'Stark erhöhte Nifedipin-Spiegel', 'Nifedipin wird über CYP3A4 metabolisiert', 'Engmaschige Blutdruckkontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Antihistaminika
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(193, 'enhancement', 'moderate', 'Verstärkte Sedierung', 'Diphenhydramin wird über CYP2D6 metabolisiert', 'Auf verstärkte Müdigkeit achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(194, 'enhancement', 'moderate', 'Stark verstärkte Sedierung', 'Promethazin wird über CYP2D6 metabolisiert', 'Vorsicht beim Autofahren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Antiepileptika
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(197, 'reduction', 'high', 'CBD-Spiegel werden durch Carbamazepin gesenkt', 'Carbamazepin ist CYP3A4-Induktor', 'Höhere CBD-Dosis erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(198, 'enhancement', 'high', 'Erhöhte Phenytoin-Spiegel', 'Phenytoin wird über CYP2C9, CYP2C19 metabolisiert', 'Phenytoin-Spiegel engmaschig überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(199, 'enhancement', 'moderate', 'Verstärkung der ZNS-Nebenwirkungen', 'Topiramat: Additive ZNS-Effekte', 'Auf Schwindel und kognitive Beeinträchtigung achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Asthma-Medikamente
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(206, 'enhancement', 'moderate', 'Erhöhte Budesonid-Spiegel', 'Budesonid wird über CYP3A4 metabolisiert', 'Auf systemische Steroid-Nebenwirkungen achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(207, 'enhancement', 'high', 'Stark erhöhte Theophyllin-Spiegel', 'Theophyllin wird über CYP1A2, CYP3A4 metabolisiert', 'Theophyllin-Spiegel überwachen, enge therapeutische Breite', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Immunsuppressiva
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(212, 'enhancement', 'critical', 'Stark erhöhte Sirolimus-Spiegel', 'Sirolimus wird über CYP3A4 metabolisiert', 'Sirolimus-Spiegel engmaschig überwachen, Transplantationspatienten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(213, 'enhancement', 'critical', 'Stark erhöhte Everolimus-Spiegel', 'Everolimus wird über CYP3A4 metabolisiert', 'Everolimus-Spiegel engmaschig überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(214, 'enhancement', 'moderate', 'Mögliche Verstärkung', 'Methotrexat: Mögliche additive hepatotoxische Effekte', 'Leberwerte überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Antipsychotika
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(216, 'enhancement', 'moderate', 'Erhöhte Cariprazin-Spiegel', 'Cariprazin wird über CYP3A4 metabolisiert', 'Auf Nebenwirkungen achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(217, 'enhancement', 'moderate', 'Erhöhte Lurasidon-Spiegel', 'Lurasidon wird über CYP3A4 metabolisiert', 'Auf Nebenwirkungen achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Diuretika
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
(220, 'enhancement', 'moderate', 'Erhöhte Spironolacton-Spiegel', 'Spironolacton wird über CYP3A4 metabolisiert', 'Elektrolyte überwachen, auf Hyperkaliämie achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- ============================================================
-- PATCH ABGESCHLOSSEN
-- ============================================================
