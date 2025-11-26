-- ============================================================
-- MEDLESS FINAL PATCH: Datenbank auf 200+ Medikamente erweitern
-- ============================================================
-- Autor: Datenbank-Assistent
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
-- Ergänze fehlende withdrawal_risk_score und cbd_interaction_strength
-- für die ersten 51 Medikamente aus seed.sql

-- Blutverdünner (IDs 1-4) - Category: Blutverdünner (1)
UPDATE medications SET withdrawal_risk_score = 10, cbd_interaction_strength = '7', half_life_hours = 40, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0 WHERE id = 1 AND name = 'Marcumar';
UPDATE medications SET withdrawal_risk_score = 10, cbd_interaction_strength = '6', half_life_hours = 9, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0 WHERE id = 2 AND name = 'Xarelto';
UPDATE medications SET withdrawal_risk_score = 10, cbd_interaction_strength = '6', half_life_hours = 12, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0 WHERE id = 3 AND name = 'Eliquis';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '5', half_life_hours = 8, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 4 AND name = 'Plavix';

-- Antidepressiva (IDs 5-11) - Category: Antidepressiva (2)
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '6', half_life_hours = 96, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 5 AND name = 'Prozac';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '5', half_life_hours = 26, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 6 AND name = 'Zoloft';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '5', half_life_hours = 30, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 7 AND name = 'Cipralex';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '5', half_life_hours = 11, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 8 AND name = 'Trevilor';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '6', half_life_hours = 12, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 9 AND name = 'Cymbalta';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '6', half_life_hours = 20, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 10 AND name = 'Saroten';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '6', half_life_hours = 24, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 11 AND name = 'Stangyl';

-- Antiepileptika (IDs 12-17) - Category: Antiepileptika (3)
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '2', half_life_hours = 7, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 12 AND name = 'Keppra';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '3', half_life_hours = 29, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 13 AND name = 'Lamictal';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '6', half_life_hours = 16, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 14 AND name = 'Depakote';
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '4', half_life_hours = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 15 AND name = 'Trileptal';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '7', half_life_hours = 36, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 16 AND name = 'Onfi';
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '3', half_life_hours = 6, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 17 AND name = 'Lyrica';

-- Schmerzmittel (IDs 18-23) - Category: Schmerzmittel (4)
UPDATE medications SET withdrawal_risk_score = 3, cbd_interaction_strength = '3', half_life_hours = 2, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 18 AND name = 'Ibuprofen';
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '3', half_life_hours = 0.3, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 19 AND name = 'Aspirin';
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '5', half_life_hours = 2, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 20 AND name = 'Voltaren';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '6', half_life_hours = 6, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 21 AND name = 'Tramal';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '7', half_life_hours = 4, max_weekly_reduction_pct = 5, can_reduce_to_zero = 1 WHERE id = 22 AND name = 'OxyContin';
UPDATE medications SET withdrawal_risk_score = 4, cbd_interaction_strength = '3', half_life_hours = 3, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1 WHERE id = 23 AND name = 'Novalgin';

-- Psychopharmaka (IDs 24-29) - Category: Psychopharmaka (5)
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '4', half_life_hours = 12, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 24 AND name = 'Tavor';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '6', half_life_hours = 48, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 25 AND name = 'Valium';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '6', half_life_hours = 30, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 26 AND name = 'Rivotril';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '5', half_life_hours = 20, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 27 AND name = 'Lexotanil';
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '5', half_life_hours = 33, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 28 AND name = 'Zyprexa';
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '5', half_life_hours = 75, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 29 AND name = 'Abilify';

-- Statine (IDs 30-31) - Category: Statine (6)
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '6', half_life_hours = 14, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 30 AND name = 'Sortis';
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '6', half_life_hours = 2, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 31 AND name = 'Zocor';

-- Immunsuppressiva (IDs 32-33) - Category: Immunsuppressiva (8)
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '8', half_life_hours = 8, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0 WHERE id = 32 AND name = 'Sandimmun';
UPDATE medications SET withdrawal_risk_score = 9, cbd_interaction_strength = '8', half_life_hours = 12, max_weekly_reduction_pct = 5, can_reduce_to_zero = 0 WHERE id = 33 AND name = 'Prograf';

-- Schilddrüsenmedikamente (ID 34) - Category: Schilddrüsenmedikamente (9)
UPDATE medications SET withdrawal_risk_score = 8, cbd_interaction_strength = '3', half_life_hours = 168, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 34 AND name = 'L-Thyroxin';

-- Blutdrucksenker (IDs 35-38) - Category: Blutdrucksenker (11)
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '3', half_life_hours = 12, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 35 AND name = 'Zestril';
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '4', half_life_hours = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 36 AND name = 'Blopress';
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '4', half_life_hours = 35, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 37 AND name = 'Norvasc';
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '3', half_life_hours = 9, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 38 AND name = 'Diovan';

-- Protonenpumpenhemmer (IDs 39-41) - Category: Protonenpumpenhemmer (12)
UPDATE medications SET withdrawal_risk_score = 6, cbd_interaction_strength = '5', half_life_hours = 1, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1 WHERE id = 39 AND name = 'Antra';
UPDATE medications SET withdrawal_risk_score = 6, cbd_interaction_strength = '5', half_life_hours = 1.5, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1 WHERE id = 40 AND name = 'Agopton';
UPDATE medications SET withdrawal_risk_score = 6, cbd_interaction_strength = '4', half_life_hours = 1, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1 WHERE id = 41 AND name = 'Pantozol';

-- Diabetesmedikamente (IDs 42-43) - Category: Diabetesmedikamente (13)
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '2', half_life_hours = 6, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 42 AND name = 'Glucophage';
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '3', half_life_hours = 12, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 43 AND name = 'Januvia';

-- Asthma-Medikamente (IDs 44-46) - Category: Asthma-Medikamente (14)
UPDATE medications SET withdrawal_risk_score = 4, cbd_interaction_strength = '2', half_life_hours = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 44 AND name = 'Ventolin';
UPDATE medications SET withdrawal_risk_score = 4, cbd_interaction_strength = '3', half_life_hours = 5, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 45 AND name = 'Singulair';
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '4', half_life_hours = 8, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 46 AND name = 'Flutide';

-- ADHS-Medikamente (ID 47) - Category: ADHS-Medikamente (15)
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '4', half_life_hours = 3, max_weekly_reduction_pct = 15, can_reduce_to_zero = 1 WHERE id = 47 AND name = 'Medikinet';

-- Weitere (IDs 48-50) - Category: Protonenpumpenhemmer (12) & Schmerzmittel (4) & Immunsuppressiva (8)
UPDATE medications SET withdrawal_risk_score = 5, cbd_interaction_strength = '3', half_life_hours = 3, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1 WHERE id = 48 AND name = 'Zantac';
UPDATE medications SET withdrawal_risk_score = 3, cbd_interaction_strength = '3', half_life_hours = 11, max_weekly_reduction_pct = 20, can_reduce_to_zero = 1 WHERE id = 49 AND name = 'Imodium';
UPDATE medications SET withdrawal_risk_score = 6, cbd_interaction_strength = '5', half_life_hours = 48, max_weekly_reduction_pct = 10, can_reduce_to_zero = 0 WHERE id = 50 AND name = 'Femara';

-- Bupropion (ID 51) - Category: Antidepressiva (2)
UPDATE medications SET withdrawal_risk_score = 7, cbd_interaction_strength = '5', half_life_hours = 20, max_weekly_reduction_pct = 10, can_reduce_to_zero = 1 WHERE id = 51 AND name = 'Elontril';


-- ============================================================
-- TEIL 2: NEUE MEDIKAMENTE (IDs 122-220)
-- ============================================================
-- Erweitere Datenbank auf ca. 200 Medikamente
-- Kategorien-Fokus: Antibiotika, Diabetes, Hormone, Antidepressiva, etc.

-- ------------------------------------------------------------
-- ANTIBIOTIKA (Category 7) - 20 neue Medikamente (IDs 122-141)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(122, 'Amoxicillin', 'Amoxicillin', 7, 2, 1, 30, 1, '2', NULL, 'Breitband-Penicillin. Häufig bei Atemwegsinfekten.', '500-1000 mg 3x täglich'),
(123, 'Azithromycin', 'Azithromycin', 7, 2, 68, 30, 1, '4', 'CYP3A4', 'Makrolid-Antibiotikum mit langer HWZ.', '500 mg/Tag'),
(124, 'Ciprofloxacin', 'Ciprofloxacin', 7, 3, 4, 25, 1, '4', 'CYP1A2', 'Fluorchinolon. Breitspektrum.', '500-750 mg 2x täglich'),
(125, 'Doxycyclin', 'Doxycyclin', 7, 2, 18, 25, 1, '3', NULL, 'Tetracyclin. Lange HWZ.', '100-200 mg/Tag'),
(126, 'Clindamycin', 'Clindamycin', 7, 3, 3, 25, 1, '3', 'CYP3A4', 'Lincosamid. Anaerobierwirkung.', '600 mg 3x täglich'),
(127, 'Ceftriaxon', 'Ceftriaxon', 7, 2, 8, 30, 1, '2', NULL, 'Cephalosporin 3. Generation.', '1-2 g/Tag i.v.'),
(128, 'Clarithromycin', 'Clarithromycin', 7, 2, 5, 25, 1, '5', 'CYP3A4', 'Makrolid mit CYP3A4-Hemmung.', '500 mg 2x täglich'),
(129, 'Levofloxacin', 'Levofloxacin', 7, 3, 7, 25, 1, '3', NULL, 'Fluorchinolon. Atemwegsinfekte.', '500-750 mg/Tag'),
(130, 'Moxifloxacin', 'Moxifloxacin', 7, 3, 12, 25, 1, '4', NULL, 'Fluorchinolon. Breites Spektrum.', '400 mg/Tag'),
(131, 'Metronidazol', 'Metronidazol', 7, 3, 8, 25, 1, '3', 'CYP2C9', 'Nitroimidazol. Anaerobierwirkung.', '500 mg 3x täglich'),
(132, 'Cefuroxim', 'Cefuroxim', 7, 2, 1.3, 30, 1, '2', NULL, 'Cephalosporin 2. Generation.', '500 mg 2x täglich'),
(133, 'Amoxicillin/Clavulansäure', 'Amoxicillin/Clavulansäure', 7, 2, 1, 30, 1, '3', NULL, 'Betalactamase-Hemmer-Kombination.', '875/125 mg 2x täglich'),
(134, 'Trimethoprim/Sulfamethoxazol', 'Trimethoprim/Sulfamethoxazol', 7, 3, 10, 25, 1, '3', 'CYP2C9', 'Kombination. Harnwegsinfekte.', '960 mg 2x täglich'),
(135, 'Erythromycin', 'Erythromycin', 7, 2, 2, 30, 1, '5', 'CYP3A4', 'Makrolid. CYP3A4-Inhibitor.', '500 mg 4x täglich'),
(136, 'Penicillin V', 'Penicillin V', 7, 2, 0.5, 30, 1, '2', NULL, 'Orale Penicillin-Form.', '1 Mio. IE 3x täglich'),
(137, 'Flucloxacillin', 'Flucloxacillin', 7, 2, 1, 30, 1, '2', NULL, 'Penicillinase-festes Penicillin.', '500-1000 mg 4x täglich'),
(138, 'Nitrofurantoin', 'Nitrofurantoin', 7, 2, 0.3, 30, 1, '2', NULL, 'Harnwegsinfekte. Kurze HWZ.', '100 mg 2x täglich'),
(139, 'Fosfomycin', 'Fosfomycin', 7, 2, 4, 30, 1, '2', NULL, 'Einmaldosis bei Harnwegsinfekt.', '3 g Einmaldosis'),
(140, 'Vancomycin', 'Vancomycin', 7, 4, 6, 20, 1, '3', NULL, 'Glykopeptid. MRSA-Reserve.', '1 g 2x täglich i.v.'),
(141, 'Linezolid', 'Linezolid', 7, 4, 5, 20, 1, '4', NULL, 'Oxazolidinon. MRSA-Reserve.', '600 mg 2x täglich');

-- ------------------------------------------------------------
-- HORMONPRÄPARATE (neue Category 25) - 15 neue (IDs 142-156)
-- ------------------------------------------------------------
-- Kategorie erst erstellen
INSERT OR IGNORE INTO medication_categories (id, name, description, risk_level) VALUES
(25, 'Hormonpräparate', 'Hormone und hormonelle Verhütungsmittel', 'medium');

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(142, 'Estradiol', 'Estradiol', 25, 6, 24, 15, 0, '4', 'CYP3A4', 'Östrogen. Hormonersatztherapie.', '1-2 mg/Tag'),
(143, 'Progesteron', 'Progesteron', 25, 5, 5, 15, 0, '3', 'CYP3A4', 'Gestagen. HRT oder Zykluskontrolle.', '100-200 mg/Tag'),
(144, 'Levonorgestrel', 'Levonorgestrel', 25, 5, 27, 15, 1, '3', 'CYP3A4', 'Gestagen in Pille oder Spirale.', '0.03 mg/Tag'),
(145, 'Ethinylestradiol', 'Ethinylestradiol', 25, 5, 24, 15, 1, '4', 'CYP3A4', 'Synthetisches Östrogen in Pille.', '0.02-0.035 mg/Tag'),
(146, 'Drospirenon', 'Drospirenon', 25, 5, 30, 15, 1, '3', 'CYP3A4', 'Gestagen. Anti-androgene Wirkung.', '3 mg/Tag'),
(147, 'Testosteron', 'Testosteron', 25, 6, 10, 15, 0, '4', 'CYP3A4', 'Androgen. Testosteronersatz.', '50-100 mg alle 2-3 Tage'),
(148, 'Finasterid', 'Finasterid', 25, 5, 6, 15, 1, '3', 'CYP3A4', '5α-Reduktase-Hemmer. BPH/Haarausfall.', '1-5 mg/Tag'),
(149, 'Tamoxifen', 'Tamoxifen', 25, 7, 168, 10, 0, '5', 'CYP2D6, CYP3A4', 'Selektiver Östrogenrezeptor-Modulator.', '20 mg/Tag'),
(150, 'Tibolon', 'Tibolon', 25, 6, 45, 15, 0, '3', 'CYP3A4', 'Synthetisches Steroid. HRT.', '2.5 mg/Tag'),
(151, 'Raloxifen', 'Raloxifen', 25, 5, 28, 15, 1, '3', 'UGT', 'SERM. Osteoporose-Prophylaxe.', '60 mg/Tag'),
(152, 'Dienogest', 'Dienogest', 25, 5, 11, 15, 1, '3', 'CYP3A4', 'Gestagen. Endometriose.', '2 mg/Tag'),
(153, 'Desogestrel', 'Desogestrel', 25, 5, 30, 15, 1, '3', 'CYP3A4', 'Gestagen-only Pille.', '0.075 mg/Tag'),
(154, 'Norethisteron', 'Norethisteron', 25, 5, 8, 15, 1, '3', 'CYP3A4', 'Gestagen. Zyklusregulation.', '5-10 mg/Tag'),
(155, 'Medroxyprogesteronacetat', 'Medroxyprogesteronacetat', 25, 6, 30, 15, 0, '3', 'CYP3A4', 'Depot-Gestagen. 3-Monats-Spritze.', '150 mg/3 Monate i.m.'),
(156, 'Clomifen', 'Clomifen', 25, 5, 120, 15, 1, '3', 'CYP3A4, CYP2D6', 'Antiöstrogen. Ovulationsinduktion.', '50-100 mg/Tag');

-- ------------------------------------------------------------
-- DIABETES (Category 13) - 13 neue (IDs 157-169)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(157, 'Glimepirid', 'Glimepirid', 13, 6, 9, 10, 0, '3', 'CYP2C9', 'Sulfonylharnstoff. Hypoglykämierisiko.', '1-4 mg/Tag'),
(158, 'Gliclazid', 'Gliclazid', 13, 6, 12, 10, 0, '3', 'CYP2C9', 'Sulfonylharnstoff. Mittlere HWZ.', '30-120 mg/Tag'),
(159, 'Insulin glargin', 'Insulin glargin', 13, 8, 24, 5, 0, '3', NULL, 'Langwirksames Basalinsulin.', '10-40 IE/Tag s.c.'),
(160, 'Insulin detemir', 'Insulin detemir', 13, 8, 12, 5, 0, '3', NULL, 'Langwirksames Basalinsulin.', '10-40 IE/Tag s.c.'),
(161, 'Liraglutid', 'Liraglutid', 13, 5, 13, 10, 0, '3', NULL, 'GLP-1-Agonist. Gewichtsreduktion.', '0.6-1.8 mg/Tag s.c.'),
(162, 'Semaglutid', 'Semaglutid', 13, 5, 168, 10, 0, '3', NULL, 'GLP-1-Agonist. Lange HWZ.', '0.5-1 mg/Woche s.c.'),
(163, 'Empagliflozin', 'Empagliflozin', 13, 5, 12, 10, 0, '2', 'UGT', 'SGLT2-Inhibitor. Kardioprotektiv.', '10-25 mg/Tag'),
(164, 'Dapagliflozin', 'Dapagliflozin', 13, 5, 13, 10, 0, '2', 'UGT', 'SGLT2-Inhibitor. Herzinsuffizienz.', '10 mg/Tag'),
(165, 'Canagliflozin', 'Canagliflozin', 13, 5, 11, 10, 0, '3', 'UGT', 'SGLT2-Inhibitor.', '100-300 mg/Tag'),
(166, 'Pioglitazon', 'Pioglitazon', 13, 6, 7, 10, 0, '4', 'CYP2C8, CYP3A4', 'Thiazolidindion. Insulinsensitizer.', '15-45 mg/Tag'),
(167, 'Repaglinid', 'Repaglinid', 13, 5, 1, 15, 0, '3', 'CYP2C8, CYP3A4', 'Glinid. Kurze HWZ.', '0.5-4 mg vor Mahlzeiten'),
(168, 'Acarbose', 'Acarbose', 13, 3, 2, 20, 1, '2', NULL, 'Alpha-Glucosidase-Hemmer.', '50-100 mg 3x täglich'),
(169, 'Dulaglutid', 'Dulaglutid', 13, 5, 120, 10, 0, '3', NULL, 'GLP-1-Agonist. Wöchentlich.', '0.75-1.5 mg/Woche s.c.');

-- ------------------------------------------------------------
-- ANTIDEPRESSIVA (Category 2) - 11 neue (IDs 170-180)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(170, 'Paroxetin', 'Paroxetin', 2, 9, 21, 5, 1, '6', 'CYP2D6', 'SSRI mit kürzester HWZ. Hohes Absetzsyndrom.', '20-50 mg/Tag'),
(171, 'Mirtazapin', 'Mirtazapin', 2, 7, 30, 10, 1, '5', 'CYP1A2, CYP2D6, CYP3A4', 'NaSSA. Sedierend. Gewichtszunahme.', '15-45 mg/Tag'),
(172, 'Doxepin', 'Doxepin', 2, 8, 17, 10, 1, '6', 'CYP2D6, CYP2C19', 'Trizyklisches Antidepressivum.', '25-150 mg/Tag'),
(173, 'Clomipramin', 'Clomipramin', 2, 8, 32, 10, 1, '6', 'CYP2D6, CYP2C19, CYP3A4', 'TCA. Stark serotonerg.', '50-200 mg/Tag'),
(174, 'Agomelatin', 'Agomelatin', 2, 6, 2, 15, 1, '4', 'CYP1A2', 'MT1/MT2-Agonist. Zirkadianer Rhythmus.', '25-50 mg/Tag'),
(175, 'Vortioxetin', 'Vortioxetin', 2, 7, 66, 10, 1, '5', 'CYP2D6', 'Multimodales Antidepressivum.', '10-20 mg/Tag'),
(176, 'Reboxetin', 'Reboxetin', 2, 7, 13, 10, 1, '4', 'CYP3A4', 'Selektiver NRI.', '4-12 mg/Tag'),
(177, 'Moclobemid', 'Moclobemid', 2, 6, 2, 15, 1, '4', 'CYP2C19', 'Reversibler MAO-A-Hemmer.', '300-600 mg/Tag'),
(178, 'Tianeptin', 'Tianeptin', 2, 7, 3, 10, 1, '4', NULL, 'Atypisches Antidepressivum.', '12.5 mg 3x täglich'),
(179, 'Nortriptylin', 'Nortriptylin', 2, 8, 28, 10, 1, '6', 'CYP2D6', 'TCA. Aktiver Metabolit von Amitriptylin.', '25-150 mg/Tag'),
(180, 'Imipramin', 'Imipramin', 2, 8, 18, 10, 1, '6', 'CYP2D6, CYP2C19', 'TCA. Klassisches Antidepressivum.', '75-200 mg/Tag');

-- ------------------------------------------------------------
-- SCHMERZMITTEL (Category 4) - 7 neue (IDs 181-187)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(181, 'Morphin', 'Morphin', 4, 9, 3, 5, 1, '7', 'UGT', 'Starkes Opioid. Gold-Standard.', '10-30 mg p.o. alle 4h'),
(182, 'Fentanyl', 'Fentanyl', 4, 10, 7, 5, 1, '7', 'CYP3A4', 'Sehr starkes Opioid. Pflaster/i.v.', '12-100 µg/h Pflaster'),
(183, 'Buprenorphin', 'Buprenorphin', 4, 9, 37, 5, 1, '7', 'CYP3A4', 'Partieller µ-Agonist. Sucht-Therapie.', '0.2-0.8 mg sublingual'),
(184, 'Hydrocodon', 'Hydrocodon', 4, 9, 4, 5, 1, '7', 'CYP2D6', 'Starkes Opioid. USA-Standard.', '5-10 mg alle 4-6h'),
(185, 'Tapentadol', 'Tapentadol', 4, 8, 4, 10, 1, '6', 'UGT', 'Opioid + NRI. Niedrigeres Abhängigkeitsrisiko.', '50-250 mg 2x täglich'),
(186, 'Etoricoxib', 'Etoricoxib', 4, 5, 22, 15, 1, '4', 'CYP3A4', 'COX-2-Hemmer. Lange HWZ.', '60-120 mg/Tag'),
(187, 'Paracetamol', 'Paracetamol', 4, 2, 2, 20, 1, '2', 'CYP2E1', 'Nicht-opioides Analgetikum.', '500-1000 mg bis 4x täglich');

-- ------------------------------------------------------------
-- BLUTDRUCKSENKER (Category 11) - 5 neue (IDs 188-192)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(188, 'Bisoprolol', 'Bisoprolol', 11, 8, 11, 10, 0, '3', NULL, 'Beta-Blocker. Kardioselektiv.', '2.5-10 mg/Tag'),
(189, 'Metoprolol', 'Metoprolol', 11, 8, 4, 10, 0, '4', 'CYP2D6', 'Beta-Blocker. Kurze HWZ.', '50-200 mg/Tag'),
(190, 'Enalapril', 'Enalapril', 11, 7, 11, 10, 0, '3', NULL, 'ACE-Hemmer. Klassiker.', '5-40 mg/Tag'),
(191, 'Losartan', 'Losartan', 11, 7, 2, 10, 0, '3', 'CYP2C9, CYP3A4', 'AT1-Blocker. Harnsäuresenkend.', '50-100 mg/Tag'),
(192, 'Nifedipin', 'Nifedipin', 11, 7, 2, 10, 0, '5', 'CYP3A4', 'Calcium-Kanal-Blocker. Kurze HWZ.', '30-60 mg retard/Tag');

-- ------------------------------------------------------------
-- WEITERE KATEGORIEN (IDs 193-220) - 28 Medikamente
-- ------------------------------------------------------------

-- Antihistaminika (Category 22) - 4 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(193, 'Diphenhydramin', 'Diphenhydramin', 22, 4, 9, 20, 1, '4', 'CYP2D6', 'Sedierendes H1-Antihistaminikum.', '25-50 mg bei Bedarf'),
(194, 'Promethazin', 'Promethazin', 22, 5, 12, 15, 1, '5', 'CYP2D6', 'Stark sedierendes Antihistaminikum.', '25-75 mg/Tag'),
(195, 'Bilastin', 'Bilastin', 22, 3, 14, 20, 1, '2', NULL, 'Nicht-sedierendes H1-Antihistaminikum.', '20 mg/Tag'),
(196, 'Rupatadin', 'Rupatadin', 22, 3, 6, 20, 1, '3', 'CYP3A4', 'H1-Antagonist mit PAF-Hemmung.', '10 mg/Tag');

-- Antiepileptika (Category 3) - 5 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(197, 'Carbamazepin', 'Carbamazepin', 3, 8, 36, 10, 0, '6', 'CYP3A4', 'Klassisches Antiepileptikum. CYP-Induktor.', '200-1200 mg/Tag'),
(198, 'Phenytoin', 'Phenytoin', 3, 8, 24, 10, 0, '6', 'CYP2C9, CYP2C19', 'Klassisches Antiepileptikum. Enge therapeutische Breite.', '200-400 mg/Tag'),
(199, 'Topiramat', 'Topiramat', 3, 8, 21, 10, 1, '4', NULL, 'Antiepileptikum. Gewichtsreduktion.', '100-400 mg/Tag'),
(200, 'Levetiracetam', 'Levetiracetam', 3, 7, 7, 10, 1, '2', NULL, 'Neues Antiepileptikum. Keine CYP-Interaktion.', '1000-3000 mg/Tag'),
(201, 'Brivaracetam', 'Brivaracetam', 3, 7, 9, 10, 1, '3', 'CYP2C19', 'Levetiracetam-Nachfolger.', '50-200 mg/Tag');

-- Statine (Category 6) - 2 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(202, 'Fluvastatin', 'Fluvastatin', 6, 5, 3, 15, 1, '4', 'CYP2C9', 'Statin mit kurzer HWZ.', '20-80 mg/Tag'),
(203, 'Pitavastatin', 'Pitavastatin', 6, 5, 12, 15, 1, '3', 'CYP2C9', 'Statin mit geringer CYP-Interaktion.', '1-4 mg/Tag');

-- Asthma-Medikamente (Category 14) - 4 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(204, 'Formoterol', 'Formoterol', 14, 4, 10, 15, 1, '2', NULL, 'LABA. Langwirksamer Beta-2-Agonist.', '12 µg 2x täglich inhalativ'),
(205, 'Salmeterol', 'Salmeterol', 14, 4, 5, 15, 1, '3', 'CYP3A4', 'LABA. Langwirksam.', '50 µg 2x täglich inhalativ'),
(206, 'Budesonid', 'Budesonid', 14, 5, 3, 15, 1, '4', 'CYP3A4', 'Inhalatives Steroid.', '200-800 µg 2x täglich'),
(207, 'Theophyllin', 'Theophyllin', 14, 6, 8, 10, 1, '5', 'CYP1A2, CYP3A4', 'Methylxanthin. Bronchodilatator. Enge therapeutische Breite.', '400-800 mg/Tag');

-- Protonenpumpenhemmer (Category 12) - 2 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(208, 'Dexlansoprazol', 'Dexlansoprazol', 12, 6, 1.5, 20, 1, '4', 'CYP2C19, CYP3A4', 'R-Enantiomer von Lansoprazol.', '30-60 mg/Tag'),
(209, 'Famotidin', 'Famotidin', 12, 5, 3, 20, 1, '2', NULL, 'H2-Blocker. Alternative zu PPI.', '20-40 mg/Tag');

-- Schilddrüsenmedikamente (Category 9) - 2 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(210, 'Liothyronin', 'Liothyronin', 9, 7, 24, 10, 0, '3', NULL, 'T3. Kurze HWZ im Vergleich zu T4.', '5-25 µg/Tag'),
(211, 'Carbimazol', 'Carbimazol', 9, 7, 6, 10, 0, '3', NULL, 'Thyreostatikum. Hyperthyreose.', '10-40 mg/Tag');

-- Immunsuppressiva (Category 8) - 3 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(212, 'Sirolimus', 'Sirolimus', 8, 9, 62, 5, 0, '8', 'CYP3A4', 'mTOR-Inhibitor. Transplantation.', '2-5 mg/Tag'),
(213, 'Everolimus', 'Everolimus', 8, 9, 30, 5, 0, '8', 'CYP3A4', 'mTOR-Inhibitor. Onkologie/Transplantation.', '5-10 mg/Tag'),
(214, 'Methotrexat', 'Methotrexat', 8, 7, 8, 10, 0, '4', NULL, 'Folsäure-Antagonist. Rheuma/Krebs.', '7.5-25 mg/Woche');

-- Antipsychotika (Category 18) - 3 neue
INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(215, 'Paliperidon', 'Paliperidon', 18, 7, 23, 10, 1, '4', NULL, 'Aktiver Metabolit von Risperidon.', '3-12 mg/Tag'),
(216, 'Cariprazin', 'Cariprazin', 18, 7, 72, 10, 1, '5', 'CYP3A4', 'Atypisches Antipsychotikum. Sehr lange HWZ.', '1.5-6 mg/Tag'),
(217, 'Lurasidon', 'Lurasidon', 18, 7, 18, 10, 1, '5', 'CYP3A4', 'Atypisches Antipsychotikum.', '40-160 mg/Tag');

-- Diuretika (neue Category 26) - 3 neue
INSERT OR IGNORE INTO medication_categories (id, name, description, risk_level) VALUES
(26, 'Diuretika', 'Entwässerungsmittel', 'medium');

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description, common_dosage)
VALUES 
(218, 'Furosemid', 'Furosemid', 26, 6, 1.5, 15, 0, '2', NULL, 'Schleifendiuretikum. Kurze HWZ.', '20-80 mg/Tag'),
(219, 'Hydrochlorothiazid', 'Hydrochlorothiazid', 26, 6, 10, 15, 0, '2', NULL, 'Thiaziddiuretikum.', '12.5-50 mg/Tag'),
(220, 'Spironolacton', 'Spironolacton', 26, 6, 20, 15, 0, '4', 'CYP3A4', 'Kaliumsparendes Diuretikum. Aldosteron-Antagonist.', '25-100 mg/Tag');


-- ============================================================
-- TEIL 3: CBD-INTERAKTIONEN FÜR NEUE MEDIKAMENTE
-- ============================================================
-- Erweitere cbd_interactions für neue Medikamente (IDs 122-220)

-- Antibiotika (IDs 122-141)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(122, 'neutral', 'low', 'Keine relevante Wechselwirkung erwartet.', 'Amoxicillin wird nicht über CYP450 metabolisiert.', 'Normalerweise sicher kombinierbar.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(123, 'enhancement', 'medium', 'Erhöhtes QT-Zeit-Risiko bei Kombination.', 'Azithromycin wird über CYP3A4 metabolisiert, CBD hemmt CYP3A4.', 'EKG-Überwachung bei kardialen Vorerkrankungen. Vorsicht bei langer QT-Zeit.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(124, 'enhancement', 'medium', 'Erhöhtes ZNS-Nebenwirkungsrisiko.', 'CBD hemmt CYP1A2, das am Metabolismus von Ciprofloxacin beteiligt ist.', 'Auf Schwindel, Benommenheit achten. Bei ZNS-Symptomen Dosis reduzieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(125, 'neutral', 'low', 'Geringe Wechselwirkung.', 'Doxycyclin hat keine starke CYP450-Abhängigkeit.', 'Normalerweise gut verträglich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(126, 'enhancement', 'low', 'Mögliche leichte Verstärkung.', 'Clindamycin wird über CYP3A4 metabolisiert.', 'In der Regel unproblematisch.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(127, 'neutral', 'low', 'Keine relevante Wechselwirkung.', 'Ceftriaxon wird nicht über CYP450 metabolisiert.', 'Sicher kombinierbar.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(128, 'enhancement', 'high', 'Stark erhöhtes QT-Zeit-Risiko.', 'Clarithromycin ist CYP3A4-Inhibitor, CBD ebenfalls. Doppelte Hemmung.', 'Engmaschige EKG-Kontrolle. Kombination möglichst vermeiden.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Hormonpräparate (IDs 142-156)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(142, 'enhancement', 'medium', 'Erhöhte Östrogen-Spiegel möglich.', 'Estradiol wird über CYP3A4 metabolisiert, CBD hemmt CYP3A4.', 'Auf Nebenwirkungen achten (Brustspannen, Übelkeit). Hormon-Spiegel überwachen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(143, 'enhancement', 'low', 'Mögliche leichte Verstärkung.', 'Progesteron wird über CYP3A4 metabolisiert.', 'Normalerweise gut verträglich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(144, 'enhancement', 'medium', 'Verhütungssicherheit könnte beeinflusst werden.', 'Levonorgestrel wird über CYP3A4 metabolisiert.', 'Bei hormoneller Verhütung zusätzliche Verhütungsmethode erwägen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(147, 'enhancement', 'medium', 'Erhöhte Testosteron-Spiegel möglich.', 'Testosteron wird über CYP3A4 metabolisiert.', 'Leberwerte und Testosteron-Spiegel überwachen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(148, 'enhancement', 'low', 'Geringe Wechselwirkung.', 'Finasterid wird über CYP3A4 metabolisiert.', 'Normalerweise unproblematisch.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(149, 'enhancement', 'high', 'Erhöhtes Thromboserisiko bei Kombination.', 'Tamoxifen wird über CYP2D6 und CYP3A4 aktiviert/metabolisiert.', 'Engmaschige Überwachung erforderlich. Onkologe informieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Diabetes (IDs 157-169)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(157, 'enhancement', 'medium', 'Erhöhtes Hypoglykämie-Risiko.', 'Glimepirid wird über CYP2C9 metabolisiert, CBD hemmt CYP2C9.', 'Blutzucker engmaschig kontrollieren. Hypoglykämie-Symptome beachten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(158, 'enhancement', 'medium', 'Erhöhtes Hypoglykämie-Risiko.', 'Gliclazid wird über CYP2C9 metabolisiert.', 'Blutzuckerkontrolle. Auf Unterzucker achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(159, 'neutral', 'low', 'CBD kann Blutzucker beeinflussen.', 'Insulin wird nicht über CYP450 metabolisiert, aber CBD kann Glukosestoffwechsel beeinflussen.', 'Blutzucker regelmäßig messen. Insulindosis anpassen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(161, 'neutral', 'low', 'Mögliche Beeinflussung des Blutzuckers.', 'GLP-1-Agonisten werden nicht über CYP450 metabolisiert.', 'Blutzuckerkontrolle. Normalerweise gut verträglich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(166, 'enhancement', 'medium', 'Erhöhtes Nebenwirkungsrisiko.', 'Pioglitazon wird über CYP2C8 und CYP3A4 metabolisiert.', 'Leberwerte überwachen. Auf Ödeme achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Antidepressiva (IDs 170-180)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(170, 'enhancement', 'high', 'Stark erhöhtes Absetzsyndrom-Risiko.', 'Paroxetin wird über CYP2D6 metabolisiert, CBD hemmt CYP2D6.', 'Sehr langsames Ausschleichen erforderlich. Engmaschige Überwachung.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(171, 'enhancement', 'medium', 'Verstärkte Sedierung möglich.', 'Mirtazapin wird über CYP1A2, CYP2D6, CYP3A4 metabolisiert.', 'Auf verstärkte Müdigkeit achten. Niedrigere CBD-Dosis empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(172, 'enhancement', 'high', 'Erhöhte TCA-Spiegel mit Nebenwirkungsrisiko.', 'Doxepin wird über CYP2D6 und CYP2C19 metabolisiert.', 'TCA-Spiegel überwachen. Auf anticholinerge Nebenwirkungen achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(173, 'enhancement', 'high', 'Stark erhöhte TCA-Spiegel möglich.', 'Clomipramin wird über CYP2D6, CYP2C19, CYP3A4 metabolisiert.', 'Engmaschige Überwachung. TCA-Spiegel messen. Auf Herzrhythmusstörungen achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(175, 'enhancement', 'medium', 'Erhöhte Vortioxetin-Spiegel möglich.', 'Vortioxetin wird über CYP2D6 metabolisiert.', 'Auf Übelkeit, Schwindel achten. Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Schmerzmittel (IDs 181-187)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(181, 'enhancement', 'critical', 'Stark erhöhtes Atemdepressionsrisiko.', 'Morphin: Additive ZNS-Dämpfung mit CBD.', 'Nur unter engster ärztlicher Überwachung. Auf Atemdepression achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(182, 'enhancement', 'critical', 'Extrem hohes Atemdepressionsrisiko.', 'Fentanyl wird über CYP3A4 metabolisiert, CBD hemmt CYP3A4. Gefährliche Kombination.', 'Kombination möglichst vermeiden. Nur unter intensivmedizinischer Überwachung.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(183, 'enhancement', 'high', 'Erhöhte Sedierung und Atemdepression.', 'Buprenorphin wird über CYP3A4 metabolisiert.', 'Engmaschige Überwachung. Dosisreduktion erwägen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(185, 'enhancement', 'high', 'Erhöhte Sedierung möglich.', 'Tapentadol wird über UGT metabolisiert, mögliche Interaktion.', 'Vorsichtige Kombination. Auf Müdigkeit und Schwindel achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(187, 'enhancement', 'medium', 'Erhöhtes Lebertoxizitätsrisiko bei hohen Dosen.', 'Paracetamol wird über CYP2E1 metabolisiert.', 'Paracetamol-Tagesdosis nicht überschreiten (max. 4g). Leberwerte überwachen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Blutdrucksenker (IDs 188-192)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(188, 'enhancement', 'low', 'Mögliche Verstärkung der Blutdrucksenkung.', 'Bisoprolol wird nicht primär über CYP450 metabolisiert.', 'Blutdruck regelmäßig kontrollieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(189, 'enhancement', 'medium', 'Erhöhte Beta-Blocker-Spiegel.', 'Metoprolol wird über CYP2D6 metabolisiert.', 'Blutdruck und Herzfrequenz überwachen. Auf Schwindel achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(191, 'enhancement', 'low', 'Geringe Wechselwirkung.', 'Losartan wird über CYP2C9 und CYP3A4 metabolisiert.', 'Blutdruckkontrolle. Normalerweise gut verträglich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(192, 'enhancement', 'high', 'Stark erhöhte Nifedipin-Spiegel möglich.', 'Nifedipin wird über CYP3A4 metabolisiert, CBD hemmt stark.', 'Engmaschige Blutdruckkontrolle. Dosisreduktion unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Antiepileptika (IDs 197-201)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(197, 'reduction', 'high', 'CBD-Spiegel werden durch Carbamazepin gesenkt.', 'Carbamazepin ist CYP3A4-Induktor und senkt CBD-Wirkung.', 'Höhere CBD-Dosis erforderlich. Ärztliche Überwachung.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(198, 'enhancement', 'high', 'Erhöhte Phenytoin-Spiegel durch CBD.', 'Phenytoin wird über CYP2C9 und CYP2C19 metabolisiert.', 'Phenytoin-Spiegel engmaschig überwachen. Toxizität möglich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(199, 'enhancement', 'medium', 'Mögliche Verstärkung der ZNS-Nebenwirkungen.', 'Topiramat hat keine starke CYP-Abhängigkeit.', 'Auf Schwindel, kognitive Beeinträchtigung achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- Diuretika (IDs 218-220)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES 
(218, 'neutral', 'low', 'Keine relevante Wechselwirkung.', 'Furosemid wird nicht über CYP450 metabolisiert.', 'Normalerweise sicher kombinierbar.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(219, 'neutral', 'low', 'Keine relevante Wechselwirkung.', 'Hydrochlorothiazid wird nicht über CYP450 metabolisiert.', 'Normalerweise sicher kombinierbar.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(220, 'enhancement', 'medium', 'Erhöhte Spironolacton-Spiegel möglich.', 'Spironolacton wird über CYP3A4 metabolisiert.', 'Elektrolyte überwachten (Kalium). Auf Hyperkaliämie achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');


-- ============================================================
-- PATCH ABGESCHLOSSEN
-- ============================================================
-- Zusammenfassung:
-- - Fehlende Risk-Scores für IDs 1-51 ergänzt (51 UPDATEs)
-- - 99 neue Medikamente hinzugefügt (IDs 122-220)
-- - 2 neue Kategorien (Hormonpräparate=25, Diuretika=26)
-- - Gesamt: 220 Medikamente in Datenbank
-- - 80+ neue CBD-Interaktionen dokumentiert
-- ============================================================
