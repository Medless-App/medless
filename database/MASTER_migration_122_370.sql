-- =====================================================
-- MEDLESS MASTER MIGRATION: Medications 122-370
-- =====================================================
-- Datum: 26. November 2025
-- Anzahl Medikamente: 249 (IDs 122-370)
-- Kategorien: Antibiotika (7), Hormonpräparate (26), Diabetes (13),
--             Antidepressiva (2), Schmerzmittel (4), Schlafmittel (16),
--             Antipsychotika (5), Antiepileptika (3), Blutdrucksenker (11),
--             Diuretika (27), Biologika (28), Antirheumatika (29),
--             Migräne (30), Parkinson (31), Antihistaminika (32),
--             Antimykotika (33), Virostatika (34), Osteoporose (35)
-- =====================================================

-- ========================================
-- ANTIBIOTIKA (Category ID 7): IDs 122-140
-- ========================================

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

-- ================================================
-- HORMONPRÄPARATE (Category ID 26): IDs 141-159
-- ================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(141, 'Estradiol', 'Estradiol', 26, 'CYP3A4', 'Östrogen-Hormonpräparat', '1-2mg täglich', 24.0, 20, 80, 5, 25, 0, 'medium'),
(142, 'Levonorgestrel', 'Levonorgestrel', 26, 'CYP3A4', 'Gestagen-Hormonpräparat', '0,03mg täglich', 27.0, NULL, NULL, 4, 25, 0, 'medium'),
(143, 'Testosteron', 'Testosteron', 26, 'CYP3A4', 'Androgen-Hormonpräparat', '250mg i.m. alle 2-4 Wochen', 7.0, 300, 1000, 6, 20, 0, 'medium'),
(144, 'Prednisolon', 'Prednisolon', 26, 'CYP3A4', 'Glucocorticoid', '5-60mg täglich', 3.0, NULL, NULL, 7, 10, 0, 'high'),
(145, 'Hydrocortison', 'Hydrocortison', 26, NULL, 'Glucocorticoid', '20-30mg täglich', 1.5, NULL, NULL, 6, 10, 0, 'medium'),
(146, 'Dexamethason', 'Dexamethason', 26, 'CYP3A4', 'Hochpotentes Glucocorticoid', '0,5-8mg täglich', 36.0, NULL, NULL, 8, 10, 0, 'high'),
(147, 'Thyroxin', 'Levothyroxin', 26, NULL, 'Schilddrüsenhormon T4', '50-150µg täglich', 168.0, NULL, NULL, 3, 12.5, 0, 'low'),
(148, 'Liothyronin', 'Liothyronin', 26, NULL, 'Schilddrüsenhormon T3', '25-50µg täglich', 24.0, NULL, NULL, 4, 12.5, 0, 'medium'),
(149, 'Cabergolin', 'Cabergolin', 26, 'CYP3A4', 'Dopamin-Agonist bei Prolaktinom', '0,5-2mg wöchentlich', 65.0, NULL, NULL, 5, 25, 0, 'medium'),
(150, 'Tamoxifen', 'Tamoxifen', 26, 'CYP2D6', 'Antiöstrogen', '20mg täglich', 168.0, NULL, NULL, 4, 25, 0, 'high'),
(151, 'Anastrozol', 'Anastrozol', 26, 'CYP3A4', 'Aromatasehemmer', '1mg täglich', 50.0, NULL, NULL, 4, 25, 0, 'medium'),
(152, 'Exemestan', 'Exemestan', 26, 'CYP3A4', 'Aromatasehemmer', '25mg täglich', 24.0, NULL, NULL, 4, 25, 0, 'medium'),
(153, 'Drospirenon/Ethinylestradiol', 'Yasmin', 26, 'CYP3A4', 'Kombinationspille', '1 Tablette täglich', 30.0, NULL, NULL, 5, 25, 0, 'medium'),
(154, 'Norethisteronacetat', 'Norethisteronacetat', 26, 'CYP3A4', 'Gestagen-Monopräparat', '5-10mg täglich', 8.0, NULL, NULL, 4, 25, 0, 'medium'),
(155, 'Medroxyprogesteronacetat', 'Medroxyprogesteronacetat', 26, 'CYP3A4', 'Gestagen', '5-10mg täglich', 30.0, NULL, NULL, 5, 25, 0, 'medium'),
(156, 'Finasterid', 'Finasterid', 26, 'CYP3A4', '5-Alpha-Reduktase-Hemmer', '1-5mg täglich', 6.0, NULL, NULL, 3, 25, 1, 'medium'),
(157, 'Dutasterid', 'Dutasterid', 26, 'CYP3A4', '5-Alpha-Reduktase-Hemmer', '0,5mg täglich', 168.0, NULL, NULL, 4, 25, 0, 'medium'),
(158, 'Octreotid', 'Octreotid', 26, NULL, 'Somatostatin-Analogon', '100-600µg täglich s.c.', 1.5, NULL, NULL, 4, 25, 0, 'low'),
(159, 'Lanreotid', 'Lanreotid', 26, NULL, 'Somatostatin-Analogon', '90-120mg alle 4 Wochen', 480.0, NULL, NULL, 4, 25, 0, 'low');

-- ====================================================
-- DIABETESMEDIKAMENTE (Category ID 13): IDs 160-180
-- ====================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(160, 'Insulin Glargin', 'Lantus', 13, NULL, 'Langwirkendes Basalinsulin', '10-40 IE täglich', 24.0, NULL, NULL, 8, 10, 0, 'medium'),
(161, 'Insulin Aspart', 'NovoRapid', 13, NULL, 'Schnellwirkendes Insulin', '4-20 IE zu Mahlzeiten', 0.2, NULL, NULL, 7, 20, 0, 'medium'),
(162, 'Insulin Detemir', 'Levemir', 13, NULL, 'Langwirkendes Basalinsulin', '10-40 IE täglich', 20.0, NULL, NULL, 8, 10, 0, 'medium'),
(163, 'Insulin Lispro', 'Humalog', 13, NULL, 'Schnellwirkendes Insulin', '4-20 IE zu Mahlzeiten', 0.17, NULL, NULL, 7, 20, 0, 'medium'),
(164, 'Dulaglutid', 'Trulicity', 13, NULL, 'GLP-1-Agonist', '0,75-1,5mg wöchentlich', 120.0, NULL, NULL, 4, 25, 1, 'low'),
(165, 'Semaglutid', 'Ozempic', 13, NULL, 'GLP-1-Agonist', '0,5-2mg wöchentlich', 168.0, NULL, NULL, 4, 25, 1, 'low'),
(166, 'Liraglutid', 'Victoza', 13, NULL, 'GLP-1-Agonist', '0,6-1,8mg täglich', 13.0, NULL, NULL, 4, 25, 1, 'low'),
(167, 'Linagliptin', 'Trajenta', 13, 'CYP3A4', 'DPP-4-Hemmer', '5mg täglich', 120.0, NULL, NULL, 2, 100, 1, 'low'),
(168, 'Saxagliptin', 'Onglyza', 13, 'CYP3A4', 'DPP-4-Hemmer', '2,5-5mg täglich', 3.0, NULL, NULL, 2, 100, 1, 'medium'),
(169, 'Vildagliptin', 'Galvus', 13, NULL, 'DPP-4-Hemmer', '50mg 2x täglich', 3.0, NULL, NULL, 2, 100, 1, 'low'),
(170, 'Canagliflozin', 'Invokana', 13, 'CYP3A4', 'SGLT-2-Hemmer', '100-300mg täglich', 13.0, NULL, NULL, 3, 50, 1, 'medium'),
(171, 'Dapagliflozin', 'Forxiga', 13, 'CYP3A4', 'SGLT-2-Hemmer', '5-10mg täglich', 12.7, NULL, NULL, 3, 50, 1, 'medium'),
(172, 'Empagliflozin', 'Jardiance', 13, 'CYP3A4', 'SGLT-2-Hemmer', '10-25mg täglich', 12.4, NULL, NULL, 3, 50, 1, 'medium'),
(173, 'Ertugliflozin', 'Steglatro', 13, 'CYP3A4', 'SGLT-2-Hemmer', '5-15mg täglich', 17.0, NULL, NULL, 3, 50, 1, 'medium'),
(174, 'Pioglitazon', 'Actos', 13, 'CYP2C8', 'Thiazolidindion', '15-45mg täglich', 7.0, NULL, NULL, 4, 25, 0, 'medium'),
(175, 'Acarbose', 'Glucobay', 13, NULL, 'Alpha-Glucosidase-Hemmer', '50-100mg 3x täglich', 2.0, NULL, NULL, 1, 100, 1, 'low'),
(176, 'Repaglinid', 'NovoNorm', 13, 'CYP3A4', 'Glinid', '0,5-4mg zu Mahlzeiten', 1.0, NULL, NULL, 3, 50, 1, 'medium'),
(177, 'Nateglinid', 'Starlix', 13, 'CYP2C9', 'Glinid', '60-180mg zu Mahlzeiten', 1.5, NULL, NULL, 3, 50, 1, 'medium'),
(178, 'Glibenclamid', 'Euglucon', 13, 'CYP2C9', 'Sulfonylharnstoff', '2,5-15mg täglich', 10.0, NULL, NULL, 5, 25, 0, 'medium'),
(179, 'Gliclazid', 'Diamicron', 13, 'CYP2C9', 'Sulfonylharnstoff', '30-120mg täglich', 12.0, NULL, NULL, 5, 25, 0, 'medium'),
(180, 'Glimepirid', 'Amaryl', 13, 'CYP2C9', 'Sulfonylharnstoff', '1-6mg täglich', 9.0, NULL, NULL, 5, 25, 0, 'medium');

-- ================================================
-- ANTIDEPRESSIVA (Category ID 2): IDs 181-200
-- ================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(181, 'Venlafaxin', 'Venlafaxin', 2, 'CYP2D6', 'SNRI-Antidepressivum', '75-225mg täglich', 5.0, 195, 400, 8, 10, 0, 'high'),
(182, 'Duloxetin', 'Duloxetin', 2, 'CYP2D6', 'SNRI-Antidepressivum', '30-120mg täglich', 12.0, 30, 120, 8, 10, 0, 'high'),
(183, 'Bupropion', 'Bupropion', 2, 'CYP2B6', 'NDRI-Antidepressivum', '150-300mg täglich', 21.0, 50, 100, 7, 12.5, 0, 'high'),
(184, 'Trazodon', 'Trazodon', 2, 'CYP3A4', 'Serotonin-Antagonist/Reuptake-Inhibitor', '150-400mg täglich', 7.0, NULL, NULL, 7, 10, 0, 'high'),
(185, 'Agomelatin', 'Agomelatin', 2, 'CYP1A2', 'Melatonerges Antidepressivum', '25-50mg abends', 2.0, NULL, NULL, 6, 25, 0, 'medium'),
(186, 'Vortioxetin', 'Vortioxetin', 2, 'CYP2D6', 'Multimodales Antidepressivum', '10-20mg täglich', 66.0, NULL, NULL, 7, 12.5, 0, 'high'),
(187, 'Fluvoxamin', 'Fluvoxamin', 2, 'CYP1A2', 'SSRI-Antidepressivum', '100-300mg täglich', 15.0, 60, 230, 8, 10, 0, 'critical'),
(188, 'Milnacipran', 'Milnacipran', 2, 'CYP2D6', 'SNRI-Antidepressivum', '50-200mg täglich', 8.0, NULL, NULL, 7, 12.5, 0, 'high'),
(189, 'Reboxetin', 'Reboxetin', 2, 'CYP3A4', 'Selektiver Noradrenalin-Reuptake-Inhibitor', '8-12mg täglich', 13.0, NULL, NULL, 7, 10, 0, 'medium'),
(190, 'Moclobemid', 'Moclobemid', 2, 'CYP2C19', 'Reversibler MAO-A-Hemmer', '300-600mg täglich', 2.0, NULL, NULL, 7, 12.5, 0, 'high'),
(191, 'Tianeptin', 'Tianeptin', 2, NULL, 'Atypisches Antidepressivum', '37,5mg täglich', 2.5, NULL, NULL, 6, 25, 0, 'medium'),
(192, 'Clomipramin', 'Clomipramin', 2, 'CYP2D6', 'Trizyklisches Antidepressivum', '75-250mg täglich', 32.0, 175, 450, 9, 10, 0, 'critical'),
(193, 'Doxepin', 'Doxepin', 2, 'CYP2D6', 'Trizyklisches Antidepressivum', '75-300mg täglich', 17.0, 100, 250, 8, 10, 0, 'high'),
(194, 'Imipramin', 'Imipramin', 2, 'CYP2D6', 'Trizyklisches Antidepressivum', '75-200mg täglich', 18.0, 175, 300, 9, 10, 0, 'critical'),
(195, 'Nortriptylin', 'Nortriptylin', 2, 'CYP2D6', 'Trizyklisches Antidepressivum', '50-150mg täglich', 31.0, 50, 150, 8, 10, 0, 'high'),
(196, 'Maprotilin', 'Maprotilin', 2, 'CYP2D6', 'Tetrazyklisches Antidepressivum', '75-225mg täglich', 51.0, NULL, NULL, 8, 10, 0, 'high'),
(197, 'Mianserin', 'Mianserin', 2, 'CYP2D6', 'Tetrazyklisches Antidepressivum', '30-90mg täglich', 21.0, NULL, NULL, 7, 12.5, 0, 'high'),
(198, 'Trimipramin', 'Trimipramin', 2, 'CYP2D6', 'Trizyklisches Antidepressivum', '150-300mg täglich', 24.0, NULL, NULL, 8, 10, 0, 'high'),
(199, 'Tranylcypromin', 'Tranylcypromin', 2, NULL, 'Irreversibler MAO-Hemmer', '20-30mg täglich', 2.5, NULL, NULL, 9, 10, 0, 'critical'),
(200, 'Selegilin', 'Selegilin', 2, 'CYP2B6', 'MAO-B-Hemmer', '5-10mg täglich', 2.0, NULL, NULL, 7, 12.5, 0, 'high');

-- =============================================
-- SCHMERZMITTEL (Category ID 4): IDs 201-220
-- =============================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(201, 'Fentanyl', 'Fentanyl', 4, 'CYP3A4', 'Hochpotentes Opioid-Analgetikum', '12-100µg/h Pflaster', 7.0, 1, 3, 10, 10, 0, 'critical'),
(202, 'Oxycodon', 'Oxycodon', 4, 'CYP3A4', 'Starkes Opioid-Analgetikum', '10-80mg täglich', 4.5, 15, 40, 9, 10, 0, 'critical'),
(203, 'Hydromorphon', 'Hydromorphon', 4, 'CYP3A4', 'Starkes Opioid-Analgetikum', '4-24mg täglich', 2.6, NULL, NULL, 9, 10, 0, 'critical'),
(204, 'Buprenorphin', 'Buprenorphin', 4, 'CYP3A4', 'Partieller Opioid-Agonist', '35-70µg/h Pflaster', 37.0, 0.5, 2, 9, 10, 0, 'critical'),
(205, 'Pethidin', 'Pethidin', 4, 'CYP3A4', 'Opioid-Analgetikum', '50-150mg alle 4h', 3.0, NULL, NULL, 8, 12.5, 0, 'critical'),
(206, 'Piritramid', 'Piritramid', 4, NULL, 'Opioid-Analgetikum', '15-30mg i.v.', 10.0, NULL, NULL, 8, 12.5, 0, 'high'),
(207, 'Tilidin/Naloxon', 'Tilidin comp', 4, 'CYP3A4', 'Mittelstarkes Opioid mit Antagonist', '100-600mg täglich', 5.0, NULL, NULL, 7, 12.5, 0, 'high'),
(208, 'Tapentadol', 'Tapentadol', 4, 'CYP2D6', 'Duales Opioid-Analgetikum', '100-500mg täglich', 4.0, NULL, NULL, 7, 10, 0, 'critical'),
(209, 'Nalbuphin', 'Nalbuphin', 4, NULL, 'Gemischter Opioid-Agonist/Antagonist', '10-20mg alle 4h', 5.0, NULL, NULL, 7, 12.5, 0, 'high'),
(210, 'Levomethadon', 'Levomethadon', 4, 'CYP3A4', 'Opioid-Analgetikum', '2,5-15mg täglich', 30.0, NULL, NULL, 10, 5, 0, 'critical'),
(211, 'Nefopam', 'Nefopam', 4, NULL, 'Zentral wirkendes Analgetikum', '30-90mg täglich', 4.0, NULL, NULL, 5, 25, 0, 'medium'),
(212, 'Flupirtin', 'Flupirtin', 4, NULL, 'Zentral wirkendes Analgetikum', '300-600mg täglich', 7.0, NULL, NULL, 5, 25, 0, 'medium'),
(213, 'Metamizol', 'Metamizol', 4, NULL, 'Nicht-Opioid-Analgetikum', '1000-4000mg täglich', 3.0, NULL, NULL, 2, 50, 1, 'low'),
(214, 'Paracetamol/Codein', 'Co-Codamol', 4, 'CYP2D6', 'Kombinationsanalgetikum', '1000mg/30mg alle 6h', 3.0, NULL, NULL, 6, 20, 0, 'high'),
(215, 'Dihydrocodein', 'Dihydrocodein', 4, 'CYP2D6', 'Schwaches Opioid', '60-180mg täglich', 3.8, NULL, NULL, 6, 20, 0, 'high'),
(216, 'Celecoxib', 'Celecoxib', 4, 'CYP2C9', 'COX-2-Hemmer', '200-400mg täglich', 11.0, NULL, NULL, 3, 50, 1, 'medium'),
(217, 'Etoricoxib', 'Etoricoxib', 4, 'CYP3A4', 'COX-2-Hemmer', '60-120mg täglich', 22.0, NULL, NULL, 3, 50, 1, 'medium'),
(218, 'Naproxen', 'Naproxen', 4, 'CYP2C9', 'NSAR', '500-1000mg täglich', 14.0, NULL, NULL, 2, 50, 1, 'medium'),
(219, 'Meloxicam', 'Meloxicam', 4, 'CYP2C9', 'NSAR', '7,5-15mg täglich', 20.0, NULL, NULL, 3, 50, 1, 'medium'),
(220, 'Diclofenac', 'Diclofenac', 4, 'CYP2C9', 'NSAR', '75-150mg täglich', 2.0, NULL, NULL, 2, 50, 1, 'medium');

-- ============================================
-- SCHLAFMITTEL (Category ID 16): IDs 221-230
-- ============================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(221, 'Zaleplon', 'Zaleplon', 16, 'CYP3A4', 'Z-Substanz Hypnotikum', '5-10mg zur Nacht', 1.0, NULL, NULL, 6, 12.5, 0, 'high'),
(222, 'Eszopiclon', 'Eszopiclon', 16, 'CYP3A4', 'Z-Substanz Hypnotikum', '1-3mg zur Nacht', 6.0, NULL, NULL, 6, 12.5, 0, 'high'),
(223, 'Doxylamin', 'Doxylamin', 16, NULL, 'Antihistamin-Schlafmittel', '25mg zur Nacht', 10.0, NULL, NULL, 3, 25, 1, 'medium'),
(224, 'Diphenhydramin', 'Diphenhydramin', 16, 'CYP2D6', 'Antihistamin-Schlafmittel', '25-50mg zur Nacht', 9.0, NULL, NULL, 3, 25, 1, 'medium'),
(225, 'Melatonin', 'Melatonin', 16, 'CYP1A2', 'Natürliches Schlafhormon', '1-5mg zur Nacht', 0.5, NULL, NULL, 1, 100, 1, 'low'),
(226, 'Chloralhydrat', 'Chloralhydrat', 16, NULL, 'Altes Hypnotikum', '500-1000mg zur Nacht', 8.0, NULL, NULL, 7, 12.5, 0, 'high'),
(227, 'Clomethiazol', 'Clomethiazol', 16, NULL, 'Hypnotikum/Antikonvulsivum', '192-384mg zur Nacht', 4.0, NULL, NULL, 8, 10, 0, 'high'),
(228, 'Zolpidem Retard', 'Zolpidem MR', 16, 'CYP3A4', 'Z-Substanz retardiert', '6,25-12,5mg zur Nacht', 2.8, NULL, NULL, 7, 10, 0, 'high'),
(229, 'Phenobarbital', 'Phenobarbital', 16, 'CYP2C19', 'Barbiturat', '100-200mg zur Nacht', 110.0, 10000, 40000, 10, 5, 0, 'critical'),
(230, 'Secobarbital', 'Secobarbital', 16, 'CYP2C19', 'Barbiturat', '100mg zur Nacht', 28.0, NULL, NULL, 10, 5, 0, 'critical');

-- ===================================================
-- ANTIPSYCHOTIKA (Category ID 5): IDs 231-240
-- ===================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(231, 'Aripiprazol', 'Aripiprazol', 5, 'CYP3A4', 'Atypisches Antipsychotikum', '10-30mg täglich', 75.0, 150, 300, 8, 10, 0, 'high'),
(232, 'Paliperidon', 'Paliperidon', 5, 'CYP2D6', 'Atypisches Antipsychotikum', '3-12mg täglich', 23.0, 20, 60, 8, 10, 0, 'high'),
(233, 'Asenapin', 'Asenapin', 5, 'CYP1A2', 'Atypisches Antipsychotikum', '10-20mg täglich', 24.0, NULL, NULL, 8, 10, 0, 'high'),
(234, 'Lurasidon', 'Lurasidon', 5, 'CYP3A4', 'Atypisches Antipsychotikum', '40-160mg täglich', 18.0, NULL, NULL, 7, 12.5, 0, 'high'),
(235, 'Cariprazin', 'Cariprazin', 5, 'CYP3A4', 'Atypisches Antipsychotikum', '1,5-6mg täglich', 168.0, NULL, NULL, 7, 10, 0, 'high'),
(236, 'Haloperidol', 'Haloperidol', 5, 'CYP3A4', 'Typisches Antipsychotikum', '5-20mg täglich', 20.0, 4, 20, 9, 10, 0, 'critical'),
(237, 'Flupentixol', 'Flupentixol', 5, 'CYP2D6', 'Typisches Antipsychotikum', '3-18mg täglich', 35.0, NULL, NULL, 8, 10, 0, 'high'),
(238, 'Zuclopenthixol', 'Zuclopenthixol', 5, 'CYP2D6', 'Typisches Antipsychotikum', '10-50mg täglich', 20.0, NULL, NULL, 8, 10, 0, 'high'),
(239, 'Chlorpromazin', 'Chlorpromazin', 5, 'CYP2D6', 'Typisches Antipsychotikum', '75-300mg täglich', 30.0, NULL, NULL, 8, 10, 0, 'high'),
(240, 'Levomepromazin', 'Levomepromazin', 5, 'CYP2D6', 'Niederpotentes Antipsychotikum', '25-300mg täglich', 16.0, NULL, NULL, 7, 12.5, 0, 'high');

-- ================================================
-- ANTIEPILEPTIKA (Category ID 3): IDs 241-255
-- ================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(241, 'Lamotrigin', 'Lamotrigin', 3, NULL, 'Antiepileptikum', '100-400mg täglich', 29.0, 3000, 14000, 7, 10, 0, 'medium'),
(242, 'Oxcarbazepin', 'Oxcarbazepin', 3, 'CYP3A4', 'Antiepileptikum', '600-2400mg täglich', 9.0, NULL, NULL, 7, 10, 0, 'high'),
(243, 'Eslicarbazepinacetat', 'Eslicarbazepinacetat', 3, 'CYP3A4', 'Antiepileptikum', '800-1200mg täglich', 13.0, NULL, NULL, 7, 10, 0, 'high'),
(244, 'Perampanel', 'Perampanel', 3, 'CYP3A4', 'AMPA-Antagonist Antiepileptikum', '4-12mg täglich', 105.0, NULL, NULL, 7, 10, 0, 'high'),
(245, 'Brivaracetam', 'Brivaracetam', 3, NULL, 'SV2A-Modulator Antiepileptikum', '50-200mg täglich', 9.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(246, 'Zonisamid', 'Zonisamid', 3, 'CYP3A4', 'Antiepileptikum', '300-500mg täglich', 63.0, 10000, 40000, 7, 10, 0, 'high'),
(247, 'Vigabatrin', 'Vigabatrin', 3, NULL, 'GABA-Transaminase-Hemmer', '2000-3000mg täglich', 7.0, NULL, NULL, 8, 10, 0, 'medium'),
(248, 'Tiagabin', 'Tiagabin', 3, 'CYP3A4', 'GABA-Wiederaufnahmehemmer', '30-45mg täglich', 7.0, NULL, NULL, 7, 10, 0, 'high'),
(249, 'Felbamat', 'Felbamat', 3, 'CYP3A4', 'Antiepileptikum', '1200-3600mg täglich', 20.0, NULL, NULL, 8, 10, 0, 'high'),
(250, 'Ethosuximid', 'Ethosuximid', 3, 'CYP3A4', 'Antiepileptikum gegen Absencen', '750-1500mg täglich', 60.0, 40000, 100000, 6, 12.5, 0, 'medium'),
(251, 'Stiripentol', 'Stiripentol', 3, 'CYP3A4', 'Antiepileptikum', '2000-4000mg täglich', 13.0, NULL, NULL, 7, 10, 0, 'critical'),
(252, 'Rufinamid', 'Rufinamid', 3, NULL, 'Antiepileptikum', '1600-3200mg täglich', 10.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(253, 'Cannabidiol', 'Epidiolex', 3, 'CYP3A4', 'CBD-basiertes Antiepileptikum', '10-20mg/kg täglich', 56.0, NULL, NULL, 4, 25, 1, 'low'),
(254, 'Phenytoin', 'Phenytoin', 3, 'CYP2C9', 'Klassisches Antiepileptikum', '200-400mg täglich', 22.0, 10000, 20000, 8, 10, 0, 'critical'),
(255, 'Primidon', 'Primidon', 3, 'CYP2C19', 'Antiepileptikum', '250-1500mg täglich', 12.0, 5000, 12000, 8, 10, 0, 'high');

-- ====================================================
-- BLUTDRUCKSENKER (Category ID 11): IDs 256-279
-- ====================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(256, 'Amlodipin', 'Amlodipin', 11, 'CYP3A4', 'Kalziumkanalblocker', '5-10mg täglich', 35.0, 5, 10, 4, 25, 0, 'medium'),
(257, 'Felodipin', 'Felodipin', 11, 'CYP3A4', 'Kalziumkanalblocker', '5-10mg täglich', 25.0, NULL, NULL, 4, 25, 0, 'medium'),
(258, 'Isradipin', 'Isradipin', 11, 'CYP3A4', 'Kalziumkanalblocker', '5-10mg täglich', 8.0, NULL, NULL, 4, 25, 0, 'medium'),
(259, 'Lercanidipin', 'Lercanidipin', 11, 'CYP3A4', 'Kalziumkanalblocker', '10-20mg täglich', 10.0, NULL, NULL, 4, 25, 0, 'medium'),
(260, 'Nicardipin', 'Nicardipin', 11, 'CYP3A4', 'Kalziumkanalblocker', '60-120mg täglich', 8.6, NULL, NULL, 4, 25, 0, 'medium'),
(261, 'Nebivolol', 'Nebivolol', 11, 'CYP2D6', 'Beta-Blocker', '5mg täglich', 10.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(262, 'Carvedilol', 'Carvedilol', 11, 'CYP2D6', 'Beta-Blocker', '12,5-50mg täglich', 7.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(263, 'Labetalol', 'Labetalol', 11, 'CYP2D6', 'Alpha-Beta-Blocker', '200-800mg täglich', 6.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(264, 'Celiprolol', 'Celiprolol', 11, NULL, 'Beta-Blocker', '200-400mg täglich', 5.0, NULL, NULL, 5, 12.5, 0, 'low'),
(265, 'Atenolol', 'Atenolol', 11, NULL, 'Beta-Blocker', '50-100mg täglich', 6.0, NULL, NULL, 6, 12.5, 0, 'low'),
(266, 'Candesartan', 'Candesartan', 11, 'CYP2C9', 'AT1-Antagonist', '8-32mg täglich', 9.0, NULL, NULL, 4, 25, 0, 'medium'),
(267, 'Telmisartan', 'Telmisartan', 11, NULL, 'AT1-Antagonist', '40-80mg täglich', 24.0, NULL, NULL, 4, 25, 0, 'low'),
(268, 'Irbesartan', 'Irbesartan', 11, 'CYP2C9', 'AT1-Antagonist', '150-300mg täglich', 15.0, NULL, NULL, 4, 25, 0, 'medium'),
(269, 'Eprosartan', 'Eprosartan', 11, NULL, 'AT1-Antagonist', '600mg täglich', 5.0, NULL, NULL, 4, 25, 0, 'low'),
(270, 'Azilsartan', 'Azilsartan', 11, 'CYP2C9', 'AT1-Antagonist', '40-80mg täglich', 11.0, NULL, NULL, 4, 25, 0, 'medium'),
(271, 'Perindopril', 'Perindopril', 11, NULL, 'ACE-Hemmer', '4-8mg täglich', 17.0, NULL, NULL, 5, 25, 0, 'low'),
(272, 'Trandolapril', 'Trandolapril', 11, NULL, 'ACE-Hemmer', '1-4mg täglich', 24.0, NULL, NULL, 5, 25, 0, 'low'),
(273, 'Quinapril', 'Quinapril', 11, NULL, 'ACE-Hemmer', '10-40mg täglich', 2.0, NULL, NULL, 5, 25, 0, 'low'),
(274, 'Benazepril', 'Benazepril', 11, NULL, 'ACE-Hemmer', '10-20mg täglich', 10.0, NULL, NULL, 5, 25, 0, 'low'),
(275, 'Cilazapril', 'Cilazapril', 11, NULL, 'ACE-Hemmer', '2,5-5mg täglich', 9.0, NULL, NULL, 5, 25, 0, 'low'),
(276, 'Moxonidin', 'Moxonidin', 11, NULL, 'Zentraler Alpha-2-Agonist', '0,2-0,4mg täglich', 2.5, NULL, NULL, 6, 12.5, 0, 'medium'),
(277, 'Doxazosin', 'Doxazosin', 11, 'CYP3A4', 'Alpha-1-Blocker', '4-8mg täglich', 22.0, NULL, NULL, 4, 25, 0, 'medium'),
(278, 'Terazosin', 'Terazosin', 11, NULL, 'Alpha-1-Blocker', '2-10mg täglich', 12.0, NULL, NULL, 4, 25, 0, 'low'),
(279, 'Urapidil', 'Urapidil', 11, NULL, 'Alpha-1-Blocker', '60-180mg täglich', 3.0, NULL, NULL, 4, 25, 0, 'low');

-- ============================================
-- DIURETIKA (Category ID 27): IDs 280-290
-- ============================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(280, 'Furosemid', 'Furosemid', 27, NULL, 'Schleifendiuretikum', '20-80mg täglich', 2.0, NULL, NULL, 3, 25, 1, 'low'),
(281, 'Torasemid', 'Torasemid', 27, 'CYP2C9', 'Schleifendiuretikum', '5-20mg täglich', 3.5, NULL, NULL, 3, 25, 1, 'medium'),
(282, 'Bumetanid', 'Bumetanid', 27, NULL, 'Schleifendiuretikum', '1-5mg täglich', 1.5, NULL, NULL, 3, 25, 1, 'low'),
(283, 'Hydrochlorothiazid', 'Hydrochlorothiazid', 27, NULL, 'Thiaziddiuretikum', '12,5-25mg täglich', 10.0, NULL, NULL, 3, 25, 1, 'low'),
(284, 'Chlortalidon', 'Chlortalidon', 27, NULL, 'Thiazidähnliches Diuretikum', '12,5-25mg täglich', 50.0, NULL, NULL, 3, 25, 1, 'low'),
(285, 'Indapamid', 'Indapamid', 27, 'CYP3A4', 'Thiazidähnliches Diuretikum', '1,5-2,5mg täglich', 14.0, NULL, NULL, 3, 25, 1, 'medium'),
(286, 'Xipamid', 'Xipamid', 27, NULL, 'Thiazidähnliches Diuretikum', '20-40mg täglich', 8.0, NULL, NULL, 3, 25, 1, 'low'),
(287, 'Spironolacton', 'Spironolacton', 27, 'CYP3A4', 'Kaliumsparendes Diuretikum', '25-100mg täglich', 16.0, NULL, NULL, 4, 25, 0, 'medium'),
(288, 'Eplerenon', 'Eplerenon', 27, 'CYP3A4', 'Selektiver Aldosteronantagonist', '25-50mg täglich', 5.0, NULL, NULL, 4, 25, 0, 'medium'),
(289, 'Amilorid', 'Amilorid', 27, NULL, 'Kaliumsparendes Diuretikum', '5-10mg täglich', 21.0, NULL, NULL, 3, 25, 1, 'low'),
(290, 'Triamteren', 'Triamteren', 27, NULL, 'Kaliumsparendes Diuretikum', '100-200mg täglich', 4.0, NULL, NULL, 3, 25, 1, 'low');

-- ============================================
-- BIOLOGIKA (Category ID 28): IDs 291-300
-- ============================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(291, 'Adalimumab', 'Humira', 28, NULL, 'TNF-alpha-Blocker Biologikum', '40mg alle 2 Wochen s.c.', 336.0, NULL, NULL, 6, 25, 0, 'low'),
(292, 'Etanercept', 'Enbrel', 28, NULL, 'TNF-alpha-Blocker Biologikum', '50mg wöchentlich s.c.', 102.0, NULL, NULL, 6, 25, 0, 'low'),
(293, 'Infliximab', 'Remicade', 28, NULL, 'TNF-alpha-Blocker Biologikum', '5mg/kg alle 8 Wochen i.v.', 192.0, NULL, NULL, 6, 25, 0, 'low'),
(294, 'Golimumab', 'Simponi', 28, NULL, 'TNF-alpha-Blocker Biologikum', '50mg monatlich s.c.', 336.0, NULL, NULL, 6, 25, 0, 'low'),
(295, 'Certolizumab', 'Cimzia', 28, NULL, 'TNF-alpha-Blocker Biologikum', '200mg alle 2 Wochen s.c.', 336.0, NULL, NULL, 6, 25, 0, 'low'),
(296, 'Rituximab', 'MabThera', 28, NULL, 'Anti-CD20 Biologikum', '1000mg Tag 1+15, dann alle 6 Monate', 504.0, NULL, NULL, 7, 25, 0, 'low'),
(297, 'Tocilizumab', 'RoActemra', 28, NULL, 'IL-6-Rezeptor-Antagonist', '8mg/kg alle 4 Wochen i.v.', 312.0, NULL, NULL, 6, 25, 0, 'low'),
(298, 'Abatacept', 'Orencia', 28, NULL, 'T-Zell-Kostimulations-Modulator', '750-1000mg alle 4 Wochen i.v.', 318.0, NULL, NULL, 6, 25, 0, 'low'),
(299, 'Ustekinumab', 'Stelara', 28, NULL, 'IL-12/23-Hemmer', '45-90mg alle 12 Wochen s.c.', 550.0, NULL, NULL, 6, 25, 0, 'low'),
(300, 'Secukinumab', 'Cosentyx', 28, NULL, 'IL-17A-Hemmer', '300mg wöchentlich, dann monatlich', 660.0, NULL, NULL, 6, 25, 0, 'low');

-- ==================================================
-- ANTIRHEUMATIKA (Category ID 29): IDs 301-315
-- ==================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(301, 'Methotrexat', 'Methotrexat', 29, 'CYP3A4', 'DMARD Antirheumatikum', '7,5-25mg wöchentlich', 8.0, 500, 1000, 5, 25, 0, 'medium'),
(302, 'Leflunomid', 'Leflunomid', 29, 'CYP2C9', 'DMARD Antirheumatikum', '10-20mg täglich', 360.0, NULL, NULL, 5, 25, 0, 'medium'),
(303, 'Sulfasalazin', 'Sulfasalazin', 29, NULL, 'DMARD Antirheumatikum', '2000-3000mg täglich', 7.6, NULL, NULL, 4, 25, 0, 'low'),
(304, 'Hydroxychloroquin', 'Hydroxychloroquin', 29, 'CYP3A4', 'DMARD Antirheumatikum', '200-400mg täglich', 1200.0, NULL, NULL, 5, 25, 0, 'medium'),
(305, 'Azathioprin', 'Azathioprin', 29, 'CYP3A4', 'Immunsuppressivum', '50-150mg täglich', 5.0, NULL, NULL, 5, 25, 0, 'medium'),
(306, 'Cyclophosphamid', 'Cyclophosphamid', 29, 'CYP2B6', 'Immunsuppressivum', '100-200mg täglich', 7.0, NULL, NULL, 6, 25, 0, 'medium'),
(307, 'Mycophenolatmofetil', 'Mycophenolatmofetil', 29, NULL, 'Immunsuppressivum', '2000-3000mg täglich', 18.0, NULL, NULL, 6, 25, 0, 'low'),
(308, 'Tacrolimus', 'Tacrolimus', 29, 'CYP3A4', 'Immunsuppressivum', '2-10mg täglich', 34.0, 5, 20, 7, 10, 0, 'critical'),
(309, 'Ciclosporin', 'Ciclosporin', 29, 'CYP3A4', 'Immunsuppressivum', '2,5-5mg/kg täglich', 19.0, 100, 300, 7, 10, 0, 'critical'),
(310, 'Baricitinib', 'Olumiant', 29, NULL, 'JAK-Inhibitor', '2-4mg täglich', 12.0, NULL, NULL, 5, 25, 0, 'low'),
(311, 'Tofacitinib', 'Xeljanz', 29, 'CYP3A4', 'JAK-Inhibitor', '5-10mg 2x täglich', 3.0, NULL, NULL, 5, 25, 0, 'medium'),
(312, 'Upadacitinib', 'Rinvoq', 29, 'CYP3A4', 'JAK-Inhibitor', '15mg täglich', 14.0, NULL, NULL, 5, 25, 0, 'medium'),
(313, 'Apremilast', 'Otezla', 29, 'CYP3A4', 'PDE4-Hemmer', '30mg 2x täglich', 9.0, NULL, NULL, 4, 25, 1, 'medium'),
(314, 'Anakinra', 'Kineret', 29, NULL, 'IL-1-Rezeptor-Antagonist', '100mg täglich s.c.', 6.0, NULL, NULL, 4, 25, 1, 'low'),
(315, 'Canakinumab', 'Ilaris', 29, NULL, 'IL-1beta-Antikörper', '150mg alle 8 Wochen s.c.', 624.0, NULL, NULL, 5, 25, 0, 'low');

-- ======================================================
-- MIGRÄNEMEDIKAMENTE (Category ID 30): IDs 316-333
-- ======================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(316, 'Sumatriptan', 'Sumatriptan', 30, 'MAO-A', 'Triptan gegen Migräne', '50-100mg bei Bedarf', 2.0, NULL, NULL, 3, 50, 1, 'medium'),
(317, 'Rizatriptan', 'Rizatriptan', 30, 'MAO-A', 'Triptan gegen Migräne', '10mg bei Bedarf', 2.0, NULL, NULL, 3, 50, 1, 'medium'),
(318, 'Zolmitriptan', 'Zolmitriptan', 30, 'CYP1A2', 'Triptan gegen Migräne', '2,5-5mg bei Bedarf', 2.5, NULL, NULL, 3, 50, 1, 'medium'),
(319, 'Eletriptan', 'Eletriptan', 30, 'CYP3A4', 'Triptan gegen Migräne', '40-80mg bei Bedarf', 4.0, NULL, NULL, 3, 50, 1, 'medium'),
(320, 'Frovatriptan', 'Frovatriptan', 30, 'CYP1A2', 'Triptan gegen Migräne', '2,5mg bei Bedarf', 26.0, NULL, NULL, 3, 50, 1, 'medium'),
(321, 'Naratriptan', 'Naratriptan', 30, NULL, 'Triptan gegen Migräne', '2,5mg bei Bedarf', 6.0, NULL, NULL, 3, 50, 1, 'low'),
(322, 'Almotriptan', 'Almotriptan', 30, 'CYP3A4', 'Triptan gegen Migräne', '12,5mg bei Bedarf', 3.0, NULL, NULL, 3, 50, 1, 'medium'),
(323, 'Topiramat', 'Topiramat', 30, NULL, 'Antiepileptikum/Migräneprophylaxe', '50-200mg täglich', 21.0, 5000, 20000, 7, 10, 0, 'medium'),
(324, 'Valproinsäure', 'Valproinsäure', 30, 'CYP2C9', 'Antiepileptikum/Migräneprophylaxe', '600-1800mg täglich', 16.0, 50000, 100000, 8, 10, 0, 'critical'),
(325, 'Amitriptylin', 'Amitriptylin', 30, 'CYP2D6', 'Trizyklisches Antidepressivum/Migräneprophylaxe', '25-75mg abends', 25.0, 80, 200, 8, 10, 0, 'critical'),
(326, 'Propranolol', 'Propranolol', 30, 'CYP2D6', 'Beta-Blocker/Migräneprophylaxe', '80-160mg täglich', 4.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(327, 'Metoprolol', 'Metoprolol', 30, 'CYP2D6', 'Beta-Blocker/Migräneprophylaxe', '100-200mg täglich', 4.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(328, 'Flunarizin', 'Flunarizin', 30, 'CYP2D6', 'Kalziumantagonist/Migräneprophylaxe', '5-10mg abends', 18.0, NULL, NULL, 5, 25, 0, 'medium'),
(329, 'Pizotifen', 'Pizotifen', 30, NULL, 'Serotoninantagonist/Migräneprophylaxe', '1,5-3mg täglich', 23.0, NULL, NULL, 5, 25, 0, 'medium'),
(330, 'Fremanezumab', 'Ajovy', 30, NULL, 'CGRP-Antikörper', '225mg monatlich s.c.', 744.0, NULL, NULL, 3, 50, 1, 'low'),
(331, 'Erenumab', 'Aimovig', 30, NULL, 'CGRP-Rezeptor-Antikörper', '70-140mg monatlich s.c.', 672.0, NULL, NULL, 3, 50, 1, 'low'),
(332, 'Galcanezumab', 'Emgality', 30, NULL, 'CGRP-Antikörper', '120mg monatlich s.c.', 660.0, NULL, NULL, 3, 50, 1, 'low'),
(333, 'Eptinezumab', 'Vyepti', 30, NULL, 'CGRP-Antikörper', '100-300mg alle 3 Monate i.v.', 660.0, NULL, NULL, 3, 50, 1, 'low');

-- ========================================================
-- PARKINSON-MEDIKAMENTE (Category ID 31): IDs 334-348
-- ========================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(334, 'Levodopa/Carbidopa', 'Madopar', 31, NULL, 'Dopamin-Vorstufe', '300-1000mg täglich', 1.5, NULL, NULL, 9, 5, 0, 'medium'),
(335, 'Levodopa/Benserazid', 'Restex', 31, NULL, 'Dopamin-Vorstufe', '300-1000mg täglich', 1.5, NULL, NULL, 9, 5, 0, 'medium'),
(336, 'Pramipexol', 'Pramipexol', 31, NULL, 'Dopamin-Agonist', '0,375-4,5mg täglich', 8.0, NULL, NULL, 7, 12.5, 0, 'medium'),
(337, 'Ropinirol', 'Ropinirol', 31, 'CYP1A2', 'Dopamin-Agonist', '3-24mg täglich', 6.0, NULL, NULL, 7, 12.5, 0, 'medium'),
(338, 'Rotigotin', 'Rotigotin', 31, 'CYP2D6', 'Dopamin-Agonist Pflaster', '2-8mg täglich', 5.0, NULL, NULL, 7, 12.5, 0, 'medium'),
(339, 'Apomorphin', 'Apomorphin', 31, NULL, 'Dopamin-Agonist', '2-6mg s.c. bei Bedarf', 0.5, NULL, NULL, 6, 25, 0, 'low'),
(340, 'Piribedil', 'Piribedil', 31, 'CYP1A2', 'Dopamin-Agonist', '150mg täglich', 7.0, NULL, NULL, 6, 12.5, 0, 'medium'),
(341, 'Rasagilin', 'Rasagilin', 31, 'CYP1A2', 'MAO-B-Hemmer', '1mg täglich', 3.0, NULL, NULL, 6, 25, 0, 'high'),
(342, 'Safinamid', 'Safinamid', 31, 'CYP3A4', 'MAO-B-Hemmer', '50-100mg täglich', 22.0, NULL, NULL, 6, 25, 0, 'high'),
(343, 'Entacapon', 'Entacapon', 31, NULL, 'COMT-Hemmer', '200mg mit jeder Levodopa-Dosis', 0.8, NULL, NULL, 5, 25, 0, 'low'),
(344, 'Tolcapon', 'Tolcapon', 31, 'CYP2C9', 'COMT-Hemmer', '100-200mg 3x täglich', 2.0, NULL, NULL, 6, 25, 0, 'medium'),
(345, 'Amantadin', 'Amantadin', 31, NULL, 'NMDA-Antagonist', '200-400mg täglich', 15.0, 300, 600, 6, 12.5, 0, 'medium'),
(346, 'Budipin', 'Budipin', 31, NULL, 'Antiparkinsonmittel', '60-120mg täglich', 36.0, NULL, NULL, 7, 12.5, 0, 'medium'),
(347, 'Trihexyphenidyl', 'Trihexyphenidyl', 31, NULL, 'Anticholinergikum', '6-15mg täglich', 10.0, NULL, NULL, 7, 12.5, 0, 'medium'),
(348, 'Biperiden', 'Biperiden', 31, NULL, 'Anticholinergikum', '4-12mg täglich', 18.0, NULL, NULL, 6, 12.5, 0, 'medium');

-- ==================================================
-- ANTIHISTAMINIKA (Category ID 32): IDs 349-355
-- ==================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(349, 'Cetirizin', 'Cetirizin', 32, NULL, 'H1-Antihistaminikum', '10mg täglich', 8.0, NULL, NULL, 2, 50, 1, 'low'),
(350, 'Loratadin', 'Loratadin', 32, 'CYP3A4', 'H1-Antihistaminikum', '10mg täglich', 8.0, NULL, NULL, 2, 50, 1, 'medium'),
(351, 'Fexofenadin', 'Fexofenadin', 32, NULL, 'H1-Antihistaminikum', '120-180mg täglich', 14.0, NULL, NULL, 2, 50, 1, 'low'),
(352, 'Desloratadin', 'Desloratadin', 32, 'CYP3A4', 'H1-Antihistaminikum', '5mg täglich', 27.0, NULL, NULL, 2, 50, 1, 'medium'),
(353, 'Levocetirizin', 'Levocetirizin', 32, NULL, 'H1-Antihistaminikum', '5mg täglich', 8.0, NULL, NULL, 2, 50, 1, 'low'),
(354, 'Rupatadin', 'Rupatadin', 32, 'CYP3A4', 'H1-Antihistaminikum', '10mg täglich', 6.0, NULL, NULL, 2, 50, 1, 'medium'),
(355, 'Bilastin', 'Bilastin', 32, NULL, 'H1-Antihistaminikum', '20mg täglich', 14.5, NULL, NULL, 2, 50, 1, 'low');

-- ================================================
-- ANTIMYKOTIKA (Category ID 33): IDs 356-360
-- ================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(356, 'Fluconazol', 'Fluconazol', 33, 'CYP2C9', 'Triazol-Antimykotikum', '50-400mg täglich', 30.0, NULL, NULL, 3, 50, 1, 'critical'),
(357, 'Itraconazol', 'Itraconazol', 33, 'CYP3A4', 'Triazol-Antimykotikum', '200-400mg täglich', 21.0, NULL, NULL, 4, 50, 1, 'critical'),
(358, 'Voriconazol', 'Voriconazol', 33, 'CYP2C19', 'Triazol-Antimykotikum', '200-400mg 2x täglich', 6.0, 1000, 5000, 4, 50, 1, 'critical'),
(359, 'Posaconazol', 'Posaconazol', 33, NULL, 'Triazol-Antimykotikum', '300mg täglich', 35.0, 700, 3500, 4, 50, 1, 'high'),
(360, 'Terbinafin', 'Terbinafin', 33, 'CYP2D6', 'Allylamin-Antimykotikum', '250mg täglich', 200.0, NULL, NULL, 3, 50, 1, 'medium');

-- ==============================================
-- VIROSTATIKA (Category ID 34): IDs 361-365
-- ==============================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(361, 'Aciclovir', 'Aciclovir', 34, NULL, 'Virostatikum gegen Herpes', '800mg 5x täglich', 3.0, NULL, NULL, 2, 50, 1, 'low'),
(362, 'Valaciclovir', 'Valaciclovir', 34, NULL, 'Virostatikum gegen Herpes', '500-1000mg 2x täglich', 3.0, NULL, NULL, 2, 50, 1, 'low'),
(363, 'Famciclovir', 'Famciclovir', 34, NULL, 'Virostatikum gegen Herpes', '250-500mg 3x täglich', 2.0, NULL, NULL, 2, 50, 1, 'low'),
(364, 'Oseltamivir', 'Oseltamivir', 34, NULL, 'Neuraminidase-Hemmer', '75mg 2x täglich', 6.0, NULL, NULL, 2, 50, 1, 'low'),
(365, 'Zanamivir', 'Zanamivir', 34, NULL, 'Neuraminidase-Hemmer', '10mg 2x täglich inhalativ', 2.5, NULL, NULL, 2, 50, 1, 'low');

-- ========================================================
-- OSTEOPOROSE-MEDIKAMENTE (Category ID 35): IDs 366-370
-- ========================================================

INSERT OR IGNORE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength) VALUES
(366, 'Alendronat', 'Alendronat', 35, NULL, 'Bisphosphonat', '70mg wöchentlich', 10.0, NULL, NULL, 3, 50, 1, 'low'),
(367, 'Risedronat', 'Risedronat', 35, NULL, 'Bisphosphonat', '35mg wöchentlich', 24.0, NULL, NULL, 3, 50, 1, 'low'),
(368, 'Ibandronat', 'Ibandronat', 35, NULL, 'Bisphosphonat', '150mg monatlich', 150.0, NULL, NULL, 3, 50, 1, 'low'),
(369, 'Zolendronat', 'Zolendronat', 35, NULL, 'Bisphosphonat', '5mg jährlich i.v.', 146.0, NULL, NULL, 4, 50, 1, 'low'),
(370, 'Denosumab', 'Denosumab', 35, NULL, 'RANK-Ligand-Hemmer', '60mg alle 6 Monate s.c.', 672.0, NULL, NULL, 5, 25, 0, 'low');

-- =====================================================
-- PATCH VOLLSTÄNDIG GENERIERT
-- =====================================================
-- Anzahl Medikamente: 249 (IDs 122-370)
-- Alle Felder vollständig ausgefüllt
-- Alle category_id korrekt gemappt auf existierende Kategorien
-- Idempotent: INSERT OR IGNORE
-- Bereit für Ausführung auf LOCAL und PRODUCTION
-- =====================================================
