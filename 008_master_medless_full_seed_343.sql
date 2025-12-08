-- ========================================================
-- MEDLESS MASTER SEED FILE (GENERATED)
-- ========================================================
-- Project: MEDLESS - Medication Reduction Planning System
-- Purpose: Master data seed for production state
-- Generated: Automatically from REMOTE/Production database
-- Target: medless-production (Cloudflare D1)
-- ========================================================
-- 
-- IDEMPOTENT: This file can be executed multiple times safely
-- - Uses INSERT OR REPLACE for medications and categories
-- - Uses INSERT OR IGNORE for interactions and CYP profiles
-- 
-- PREREQUISITES:
-- - Schema migrations 0001-0007 must be applied first
-- - CYP profile table migration (010) must be applied first
-- 
-- ========================================================


-- ========================================================
-- TABLE: medication_categories (36 entries)
-- ========================================================

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (0, 'Allgemeine Medikation', 'Standardkategorie für Medikamente ohne spezifische Zuordnung (z.B. Schmerzmittel, Antihistaminika, Vitamine)', 'low', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (1, 'Blutverdünner', 'Medikamente zur Hemmung der Blutgerinnung', 'high', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (2, 'Antidepressiva', 'SSRI, SNRI, TCA und andere Antidepressiva', 'high', 1, 0, 8, 0, 'Graduelles Ausschleichen empfohlen; Absetzsyndrom möglich, insbesondere bei kurzen Halbwertszeiten (z.B. Paroxetin, Venlafaxin). HWZ-Anpassung wird automatisch angewendet.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (3, 'Antiepileptika', 'Medikamente zur Behandlung von Epilepsie', 'high', 0, 0.25, 10, 1, 'Niemals abrupt absetzen – erhöhtes Anfallsrisiko! Reduktion nur unter fachärztlicher Kontrolle. Mindestens 25% der Startdosis als Erhaltungsdosis empfohlen.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (4, 'Schmerzmittel', 'Analgetika, NSRA und Opioide', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (5, 'Psychopharmaka', 'Antipsychotika und Benzodiazepine', 'high', 0, 0.25, 8, 1, 'Erhöhtes Absetz- und Rückfallrisiko. Engmaschige psychiatrische Überwachung erforderlich. Mindestens 25% der Startdosis als Sicherheitsuntergrenze.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (6, 'Statine', 'Cholesterinsenker', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (7, 'Antibiotika', 'Antimikrobielle Medikamente', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (8, 'Immunsuppressiva', 'Medikamente zur Unterdrückung des Immunsystems', 'high', 0, 0.5, 5, 1, 'Reduktion nur unter strenger fachärztlicher Aufsicht (Transplantologe/Rheumatologe); Abstoßungsrisiko oder Autoimmun-Flare bei zu schneller Dosisreduktion. Therapeutisches Drug Monitoring erforderlich.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (9, 'Schilddrüsenmedikamente', 'Hormone für die Schilddrüsenfunktion', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (10, 'Antikoagulantien', 'Gerinnungshemmer', 'very_high', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (11, 'Blutdrucksenker', 'Antihypertensiva (ACE-Hemmer, Sartane, Betablocker)', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (12, 'Protonenpumpenhemmer', 'Magenschutzmedikamente', 'low', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (13, 'Diabetesmedikamente', 'Antidiabetika und Insulin', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (14, 'Asthma-Medikamente', 'Bronchodilatatoren und Kortikosteroide', 'low', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (15, 'ADHS-Medikamente', 'Stimulanzien zur ADHS-Behandlung', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (16, 'Schlafmittel', 'Medikamente zur Behandlung von Schlafstörungen (Hypnotika)', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (17, 'Benzodiazepine / Z-Drugs', NULL, 'high', 1, 0, 10, 1, 'Ausschleichen grundsätzlich möglich, aber nur sehr langsam (5–10 % pro Woche/mehrere Wochen); Entzugssymptome und Rückfallrisiko beachten.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (18, 'Opioid-Schmerzmittel', NULL, 'very_high', 1, 0, 10, 1, 'Sehr langsames Ausschleichen (5–10 % pro Woche); starke Entzugssymptome möglich; engmaschige Kontrolle nötig.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (19, 'Antihypertensiva (Blutdrucksenker)', NULL, 'medium', 1, 0, 20, 0, 'Reduktion in der Regel gut möglich; Blutdruck regelmäßig kontrollieren; bei mehreren Blutdrucksenkern: einzeln und nacheinander reduzieren.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (20, 'Antiarrhythmika', NULL, 'very_high', 0, 0.25, 10, 1, 'Nur unter fachärztlicher Kontrolle reduzieren (Kardiologe); Absetzen meist nicht möglich; EKG-Kontrollen erforderlich.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (21, 'Kortikosteroide (systemisch)', NULL, 'high', 1, 0, 10, 1, 'Bei Langzeiteinnahme (>3 Wochen): nur sehr langsam ausschleichen wegen Nebennierenrinden-Suppression; nie abrupt absetzen!');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (22, 'Dopaminagonisten (Parkinson)', NULL, 'very_high', 0, 0.5, 10, 1, 'Nur unter Neurologen-Kontrolle; abruptes Absetzen kann schwere Symptomverschlechterung auslösen; Mindestdosis meist erforderlich.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (23, 'Thyroxin / Schilddrüsenhormone', NULL, 'very_high', 0, 0.75, 10, 1, 'Meist lebenslange Einnahme nötig; Absetzen nur bei temporärer Indikation möglich; TSH-Kontrollen obligat.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (24, 'Antikoagulantien (Gerinnungshemmer)', NULL, 'very_high', 0, 1, 0, 1, 'Meist lebenslange Therapie bei Vorhofflimmern oder Thrombose-Anamnese; Absetzen nur bei Wegfall der Indikation möglich; hohes Thromboserisiko!');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (25, 'SSRI / SNRI (Antidepressiva)', NULL, 'high', 1, 0, 10, 1, 'Langsames Ausschleichen (10 % pro Woche oder langsamer); Absetzsyndrom vermeiden; psychiatrische Begleitung empfohlen.');

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (26, 'Hormonpräparate', 'Hormone und Hormonersatztherapie', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (27, 'Diuretika', 'Entwässerungsmittel', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (28, 'Biologika', 'Biologische Arzneimittel', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (29, 'Antirheumatika', 'Mittel gegen rheumatische Erkrankungen', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (30, 'Migränemedikamente', 'Mittel zur Behandlung von Migräne', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (31, 'Parkinson-Medikamente', 'Mittel zur Behandlung der Parkinson-Krankheit', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (32, 'Antihistaminika', 'Histamin-Rezeptor-Antagonisten', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (33, 'Antimykotika', 'Pilzinfektionsbekämpfende Arzneimittel', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (34, 'Virostatika', 'Virusinfektionsbekämpfende Arzneimittel', 'medium', NULL, NULL, NULL, NULL, NULL);

INSERT OR REPLACE INTO medication_categories (id, name, description, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (35, 'Osteoporose-Medikamente', 'Mittel zur Behandlung von Osteoporose', 'medium', NULL, NULL, NULL, NULL, NULL);


-- ========================================================
-- TABLE: medications (343 entries)
-- ========================================================

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (1, 'Marcumar', 'Warfarin', 24, 'CYP2C9 (hauptsächlich)', 'Oraler Vitamin-K-Antagonist (VKA), Standard in vielen Ländern', '2–10 mg/Tag (je nach INR)', 40, NULL, NULL, 10, 5, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (2, 'Xarelto', 'Rivaroxaban', 24, 'CYP3A4, CYP2J2, P-gp', 'Direkter oraler Faktor-Xa-Inhibitor (DOAK)', '10–20 mg/Tag', 9, NULL, NULL, 10, 5, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (3, 'Eliquis', 'Apixaban', 24, 'CYP3A4, P-gp, BCRP', 'Direkter oraler Faktor-Xa-Inhibitor (DOAK)', '5 mg 2x/Tag (Standard) oder 2,5 mg 2x/Tag', 12, NULL, NULL, 10, 5, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (4, 'Plavix', 'Clopidogrel', 24, 'CYP2C19 (major prodrug activation), CYP3A4', 'Thrombozytenaggregationshemmer', '75 mg/Tag', 8, NULL, NULL, 9, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (5, 'Prozac', 'Fluoxetin', 25, 'CYP2D6 (potent inhibitor), CYP2C9, CYP3A4', 'Selektiver Serotonin-Wiederaufnahmehemmer (SSRI)', '20-80 mg/Tag', 96, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (6, 'Zoloft', 'Sertralin', 25, 'CYP2B6, CYP2C9, CYP2C19, CYP2D6, CYP3A4', 'Selektiver Serotonin-Wiederaufnahmehemmer (SSRI)', '50-200 mg/Tag', 26, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (7, 'Cipralex', 'Escitalopram', 25, 'CYP2C19, CYP3A4, CYP2D6', 'Selektiver Serotonin-Wiederaufnahmehemmer (SSRI)', '10-20 mg/Tag', 30, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (8, 'Trevilor', 'Venlafaxin', 25, 'CYP2D6 (major), CYP3A4', 'Serotonin-Noradrenalin-Wiederaufnahmehemmer (SNRI)', '75-225 mg/Tag', 11, NULL, NULL, 8, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (9, 'Cymbalta', 'Duloxetin', 25, 'CYP1A2 (major), CYP2D6', 'Serotonin-Noradrenalin-Wiederaufnahmehemmer (SSNRI)', '30-120 mg/Tag', 12, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (10, 'Saroten', 'Amitriptylin', 2, 'CYP2C19, CYP2D6', 'Trizyklisches Antidepressivum (TCA)', '25-150 mg/Tag', 20, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (11, 'Stangyl', 'Trimipramin', 2, 'CYP2D6', 'Trizyklisches Antidepressivum (TCA)', '50-300 mg/Tag', 24, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (12, 'Keppra', 'Levetiracetam', 3, 'Non-CYP hydrolysis, largely renal', 'Antiepileptikum für fokale und generalisierte Anfälle', '1000–3000 mg/Tag (aufgeteilt)', 7, NULL, NULL, 7, 10, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (13, 'Lamictal', 'Lamotrigin', 3, 'UGT1A4 (glucuronidation), minimal CYP', 'Antiepileptikum und Stimmungsstabilisator (bipolare Störung, Epilepsie)', '100–500 mg/Tag (aufgeteilt)', 29, NULL, NULL, 8, 10, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (14, 'Depakote', 'Valproat', 3, 'Lebermetabolismus (u.a. CYP2C9, Glukuronidierung)', 'Breitspektrum-Antiepileptikum und Stimmungsstabilisator', '500–2000 mg/Tag (aufgeteilt)', 16, NULL, NULL, 9, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (15, 'Trileptal', 'Oxcarbazepin', 3, 'CYP3A4 (weak inducer), UGT', 'Antiepileptikum', '600-2400 mg/Tag', 9, NULL, NULL, 7, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (16, 'Onfi', 'Clobazam', 3, 'CYP2C19, CYP3A4', 'Benzodiazepin zur Epilepsiebehandlung', '10-40 mg/Tag', 36, NULL, NULL, 9, 10, 1, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (17, 'Lyrica', 'Pregabalin', 3, 'kein CYP, renal', 'Antikonvulsivum und Schmerzmittel', '150-600 mg/Tag', 6, NULL, NULL, 7, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (18, 'Ibuprofen', 'Ibuprofen', 4, 'CYP2C9', 'Nichtsteroidales Antirheumatikum (NSRA)', '400-800 mg bei Bedarf', 2, NULL, NULL, 3, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (19, 'Aspirin', 'Acetylsalicylsäure', 4, 'Schnelle Deacetylierung zu Salicylat, keine dominante CYP-Abhängigkeit', 'Nichtsteroidales Antirheumatikum (NSRA)', '100-500 mg/Tag', 0.3, NULL, NULL, 5, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (20, 'Voltaren', 'Diclofenac', 4, 'CYP2C9, CYP3A4', 'Nichtsteroidales Antirheumatikum (NSRA)', '75-150 mg/Tag', 2, NULL, NULL, 5, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (21, 'Tramal', 'Tramadol', 18, 'CYP2D6, CYP3A4', 'Schwach bis mittelstark wirksames Opioid mit zusätzlicher Serotonin-/Noradrenalin-Wirkung', '50–400 mg/Tag (oral, retard/nicht-retard)', 6, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (22, 'OxyContin', 'Oxycodon', 18, 'CYP2D6 (to oxymorphone), CYP3A4', 'Stark wirksames Opioidanalgetikum (z.B. Tumorschmerz, schwere chronische Schmerzen)', '10–160 mg/Tag (oral, meist retardiert)', 4, NULL, NULL, 9, 5, 1, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (23, 'Novalgin', 'Metamizol', 4, 'CYP2B6, CYP2C9, CYP3A4', 'Nicht-opioide Analgetikum (Pyrazolon)', '500-1000 mg bei Bedarf', 3, NULL, NULL, 4, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (24, 'Tavor', 'Lorazepam', 17, 'Glucuronidierung (kaum CYP)', 'Kurz- bis mittellang wirksames Benzodiazepin (Anxiolytikum, Sedativum)', '0,5–4 mg/Tag', 12, NULL, NULL, 9, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (25, 'Valium', 'Diazepam', 17, 'CYP2C19, CYP3A4', 'Langwirksames Benzodiazepin (Anxiolytikum, Sedativum, Muskelrelaxans)', '5–40 mg/Tag (aufgeteilt)', 48, NULL, NULL, 9, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (26, 'Rivotril', 'Clonazepam', 5, 'CYP3A4', 'Langwirksames Benzodiazepin (u.a. gegen Epilepsie, Panikstörung)', '0,5–4 mg/Tag', 30, NULL, NULL, 9, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (27, 'Lexotanil', 'Bromazepam', 5, 'CYP3A4', 'Benzodiazepin gegen Angst', '1.5-18 mg/Tag', 20, NULL, NULL, 9, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (28, 'Zyprexa', 'Olanzapin', 5, 'CYP1A2 (major), CYP2D6, UGT', 'Atypisches Antipsychotikum', '5-20 mg/Tag', 33, NULL, NULL, 8, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (29, 'Abilify', 'Aripiprazol', 5, 'CYP2D6, CYP3A4', 'Atypisches Antipsychotikum', '10-30 mg/Tag', 75, NULL, NULL, 7, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (30, 'Sortis', 'Atorvastatin', 6, 'CYP3A4', 'Cholesterinsenker', '10-80 mg/Tag', 14, NULL, NULL, 5, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (31, 'Zocor', 'Simvastatin', 6, 'CYP3A4', 'Cholesterinsenker', '20-40 mg/Tag', 2, NULL, NULL, 5, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (32, 'Sandimmun', 'Ciclosporin', 8, 'CYP3A4, P-gp', 'Immunsuppressivum', '2.5-5 mg/kg/Tag', 8, NULL, NULL, 9, 5, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (33, 'Prograf', 'Tacrolimus', 8, 'CYP3A4', 'Immunsuppressivum', '0.1-0.3 mg/kg/Tag', 12, NULL, NULL, 9, 5, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (34, 'L-Thyroxin', 'Levothyroxin', 9, 'Deiodinasen, kein CYP', 'Schilddrüsenhormon', '25-200 µg/Tag', 168, NULL, NULL, 8, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (35, 'Zestril', 'Lisinopril', 19, 'No metabolism, renal elimination only', 'ACE-Hemmer', '10-40 mg/Tag', 12, NULL, NULL, 7, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (36, 'Blopress', 'Candesartan', 19, 'CYP2C9 (minor), largely non-CYP', 'Angiotensin-II-Rezeptor-Antagonist (Sartan)', '8-32 mg/Tag', 9, NULL, NULL, 7, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (37, 'Norvasc', 'Amlodipin', 19, 'CYP3A4', 'Calcium-Kanal-Blocker', '5-10 mg/Tag', 35, NULL, NULL, 7, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (38, 'Diovan', 'Valsartan', 19, 'Kaum metabolisiert (überwiegend biliär/renal unverändert)', 'Angiotensin-II-Rezeptor-Antagonist (Sartan)', '80-320 mg/Tag', 9, NULL, NULL, 7, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (39, 'Antra', 'Omeprazol', 12, 'CYP2C19, CYP3A4', 'Protonenpumpenhemmer (Magenschutz)', '20-40 mg/Tag', 1, NULL, NULL, 6, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (40, 'Agopton', 'Lansoprazol', 12, 'CYP2C19, CYP3A4', 'Protonenpumpenhemmer (Magenschutz)', '15-30 mg/Tag', 1.5, NULL, NULL, 6, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (41, 'Pantozol', 'Pantoprazol', 12, 'CYP2C19, CYP3A4', 'Protonenpumpenhemmer (Magenschutz)', '20-40 mg/Tag', 1, NULL, NULL, 6, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (42, 'Glucophage', 'Metformin', 13, 'Kein CYP, renal eliminiert', 'Orales Antidiabetikum', '500-2000 mg/Tag', 6, NULL, NULL, 5, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (43, 'Januvia', 'Sitagliptin', 13, 'Minimal CYP, largely renal elimination', 'DPP-4-Hemmer', '100 mg/Tag', 12, NULL, NULL, 5, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (44, 'Ventolin', 'Salbutamol', 14, 'Geringe CYP-Beteiligung, v.a. Sulfatkonjugation', 'Beta-2-Sympathomimetikum (Bronchodilatator)', '100-200 µg bei Bedarf', 5, NULL, NULL, 4, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (45, 'Singulair', 'Montelukast', 14, 'CYP2C8, CYP2C9, CYP3A4', 'Leukotrien-Rezeptor-Antagonist', '10 mg/Tag', 5, NULL, NULL, 4, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (46, 'Flutide', 'Fluticason', 14, 'CYP3A4', 'Inhalatives Kortikosteroid', '100-500 µg 2x täglich', 8, NULL, NULL, 5, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (47, 'Medikinet', 'Methylphenidat', 15, 'CES1, gering CYP2D6', 'Psychostimulans zur ADHS-Behandlung', '10-60 mg/Tag', 3, NULL, NULL, 5, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (48, 'Zantac', 'Ranitidin', 12, 'CYP3A4, CYP2D6', 'H2-Rezeptor-Antagonist (Magenschutz)', '150-300 mg/Tag', 3, NULL, NULL, 5, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (49, 'Imodium', 'Loperamid', 4, 'CYP3A4, CYP2C8, P-gp', 'Antidiarrhoikum', '2-16 mg/Tag', 11, NULL, NULL, 3, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (50, 'Femara', 'Letrozol', 8, 'CYP3A4, CYP2A6', 'Aromatasehemmer (Krebstherapie)', '2.5 mg/Tag', 48, NULL, NULL, 6, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (51, 'Elontril', 'Bupropion', 2, 'CYP2B6', 'Atypisches Antidepressivum (NDRI - Noradrenalin-Dopamin-Wiederaufnahmehemmer)', '150-300 mg/Tag', 20, NULL, NULL, 7, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (52, 'Zopiclon', 'Zopiclon', 17, 'CYP3A4', 'Z-Substanz zur Kurzzeitbehandlung von Schlafstörungen', '7,5 mg vor dem Schlafengehen', 5, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (53, 'Zolpidem (Stilnox)', 'Zolpidem', 17, 'CYP3A4', 'Z-Substanz zur Behandlung von Einschlafstörungen', '10 mg vor dem Schlafengehen', 2.5, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (54, 'Zaleplon (Sonata)', 'Zaleplon', 16, 'CYP3A4, Aldehyd-Oxidase', 'Z-Substanz mit sehr kurzer Wirkdauer für Einschlafstörungen', '5-10 mg vor dem Schlafengehen', 1, NULL, NULL, 6, 12.5, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (55, 'Diazepam (Valium)', 'Diazepam', 17, 'CYP2C19, CYP3A4', 'Langwirksames Benzodiazepin (Anxiolytikum, Sedativum, Muskelrelaxans)', '5–40 mg/Tag (aufgeteilt)', 48, NULL, NULL, 9, 10, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (56, 'Lorazepam (Tavor)', 'Lorazepam', 17, 'Glucuronidierung (kaum CYP)', 'Kurz- bis mittellang wirksames Benzodiazepin (Anxiolytikum, Sedativum)', '0,5–4 mg/Tag', 14, NULL, NULL, 9, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (57, 'Temazepam (Remestan)', 'Temazepam', 17, 'Glucuronidierung (nicht CYP)', 'Benzodiazepin speziell für Schlafstörungen', '10-20 mg vor dem Schlafengehen', 10, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (58, 'Nitrazepam (Mogadan)', 'Nitrazepam', 16, 'CYP2E1, CYP3A4', 'Benzodiazepin mit langer Wirkdauer', '5-10 mg vor dem Schlafengehen', 28, NULL, NULL, 9, 10, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (59, 'Flunitrazepam (Rohypnol)', 'Flunitrazepam', 16, 'CYP3A4', 'Starkes Benzodiazepin zur Behandlung schwerer Schlafstörungen', '0,5-2 mg vor dem Schlafengehen', 18, NULL, NULL, 10, 10, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (60, 'Triazolam (Halcion)', 'Triazolam', 16, 'CYP3A4', 'Kurz wirksames Benzodiazepin für Einschlafstörungen', '0,125-0,25 mg vor dem Schlafengehen', 2.5, NULL, NULL, 8, 10, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (61, 'Lormetazepam (Noctamid)', 'Lormetazepam', 16, 'Glucuronidierung (nicht CYP)', 'Benzodiazepin mittlerer Wirkdauer', '0,5-2 mg vor dem Schlafengehen', 10, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (62, 'Brotizolam (Lendormin)', 'Brotizolam', 16, 'CYP3A4', 'Kurz wirksames Benzodiazepin', '0,125-0,25 mg vor dem Schlafengehen', 5, NULL, NULL, 8, 10, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (63, 'Daridorexant (Quviviq)', 'Daridorexant', 16, 'CYP3A4, CYP2C8', 'Orexin-Rezeptor-Antagonist, neue Generation von Schlafmitteln', '25-50 mg vor dem Schlafengehen', 8, NULL, NULL, 4, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (64, 'Lemborexant (Dayvigo)', 'Lemborexant', 16, 'CYP3A4', 'Dualer Orexin-Rezeptor-Antagonist', '5-10 mg vor dem Schlafengehen', 50, NULL, NULL, 4, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (65, 'Mirtazapin (Remergil)', 'Mirtazapin', 16, 'CYP1A2, CYP2D6, CYP3A4', 'Sedierendes Antidepressivum, oft off-label bei Schlafstörungen', '7,5-30 mg zur Nacht', 30, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (66, 'Trazodon (Trittico)', 'Trazodon', 16, 'CYP3A4', 'Sedierendes Antidepressivum bei Schlafstörungen', '25-100 mg zur Nacht', 7, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (67, 'Doxepin (Aponal)', 'Doxepin', 16, 'CYP2D6, CYP1A2', 'Trizyklisches Antidepressivum, auch für Schlafstörungen', '25-50 mg zur Nacht', 17, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (68, 'Diphenhydramin (Vivinox)', 'Diphenhydramin', 16, 'CYP2D6, CYP2C19', 'H1-Antihistaminikum mit sedierender Wirkung, rezeptfrei', '25-50 mg vor dem Schlafengehen', 9, NULL, NULL, 3, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (69, 'Doxylamin (Hoggar Night)', 'Doxylamin', 16, 'CYP2D6', 'H1-Antihistaminikum zur Kurzzeitbehandlung von Schlafstörungen', '25 mg vor dem Schlafengehen', 10, NULL, NULL, 3, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (70, 'Melatonin (Circadin)', 'Melatonin', 16, 'CYP1A2', 'Hormon zur Regulierung des Schlaf-Wach-Rhythmus', '2 mg retardiert 1-2h vor dem Schlafengehen', 0.5, NULL, NULL, 1, 100, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (71, 'Baldrian hochdosiert', 'Valeriana officinalis', 16, 'Minimal CYP-Interaktion', 'Pflanzliches Schlafmittel', '600-900 mg Extrakt vor dem Schlafengehen', 1, NULL, NULL, 1, 100, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (72, 'Cipramil', 'Citalopram', 2, 'CYP2C19, CYP3A4, CYP2D6', 'SSRI-Antidepressivum', '20–40 mg/Tag', 35, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (73, 'Seroxat', 'Paroxetin', 2, 'CYP2D6 (major substrate & potent inhibitor)', 'SSRI-Antidepressivum mit hohem Absetzrisiko', '20–50 mg/Tag', 21, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (76, 'Xanax', 'Alprazolam', 17, 'CYP3A4', 'Kurz- bis mittellang wirksames Benzodiazepin (Panik-/Angststörung)', '0,25–4 mg/Tag', 11, NULL, NULL, 9, 5, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (79, 'Depakine', 'Valproat', 3, 'Lebermetabolismus (u.a. CYP2C9, Glukuronidierung)', 'Breitspektrum-Antiepileptikum und Stimmungsstabilisator', '500–2000 mg/Tag (aufgeteilt)', 12, NULL, NULL, 8, 5, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (81, 'Tegretol', 'Carbamazepin', 3, 'CYP3A4 (potent inducer), CYP2C8', 'Antiepileptikum und Stimmungsstabilisator, auch bei Neuralgie', '400–1200 mg/Tag (aufgeteilt)', 16, NULL, NULL, 8, 10, 1, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (83, 'Coumadin', 'Warfarin', 10, 'CYP2C9 (hauptsächlich)', 'Oraler Vitamin-K-Antagonist (VKA), Standard in vielen Ländern', '2–10 mg/Tag (je nach INR)', 40, NULL, NULL, 9, 10, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (86, 'Pradaxa', 'Dabigatran', 10, 'Kein CYP, P-gp-Substrat, überwiegend renal eliminiert', 'Direkter oraler Thrombininhibitor (DOAK)', '220–300 mg/Tag (aufgeteilt, z.B. 150 mg 2x/Tag)', 13, NULL, NULL, 8, 15, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (87, 'Morphin', 'Morphin', 18, 'UGT2B7 (glucuronidation), minimal CYP', 'Stark wirksames Opioidanalgetikum (akute und chronische Schmerzen)', '20–200 mg/Tag (oral, retard/nicht-retard, je nach Indikation)', 3, NULL, NULL, 9, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (88, 'Oxycodon', 'Oxycodon', 18, 'CYP2D6 (to oxymorphone), CYP3A4', 'Stark wirksames Opioidanalgetikum (z.B. Tumorschmerz, schwere chronische Schmerzen)', '10–160 mg/Tag (oral, meist retardiert)', 4, NULL, NULL, 9, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (89, 'Hydromorphon', 'Hydromorphon', 18, 'UGT2B7 (glucuronidation), minimal CYP', 'Stark wirksames Opioid (ca. 5–7x so potent wie Morphin)', '4–32 mg/Tag (oral, retard/nicht-retard)', 3, NULL, NULL, 9, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (90, 'Fentanyl-Pflaster', 'Fentanyl', 18, 'CYP3A4', 'Sehr stark wirksames Opioid (transdermales Pflaster, Dauertherapie)', '12–100 µg/h (Pflasterwechsel alle 72 h)', 17, NULL, NULL, 10, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (91, 'Tramadol', 'Tramadol', 18, 'CYP2D6, CYP3A4', 'Schwach bis mittelstark wirksames Opioid mit zusätzlicher Serotonin-/Noradrenalin-Wirkung', '50–400 mg/Tag (oral, retard/nicht-retard)', 6, NULL, NULL, 7, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (92, 'Risperdal', 'Risperidon', NULL, 'CYP2D6, CYP3A4', NULL, NULL, 20, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (94, 'Seroquel', 'Quetiapin', NULL, 'CYP3A4 (major)', NULL, NULL, 7, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (96, 'Haldol', 'Haloperidol', NULL, 'CYP3A4, CYP2D6', NULL, NULL, 24, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (97, 'Leponex', 'Clozapin', NULL, 'CYP1A2, CYP3A4', NULL, NULL, 14, NULL, NULL, 10, 5, 1, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (98, 'Ramipril', 'Ramipril', NULL, 'Lebermetabolismus (Esterhydrolyse zu Ramiprilat)', NULL, NULL, 13, NULL, NULL, 5, 15, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (99, 'Enalapril', 'Enalapril', NULL, 'Minimal CYP, esterases, largely renal', NULL, NULL, 11, NULL, NULL, 7, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (100, 'Amlodipin', 'Amlodipin', NULL, 'CYP3A4', NULL, NULL, 40, NULL, NULL, 4, 20, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (101, 'Bisoprolol', 'Bisoprolol', NULL, 'CYP2D6, CYP3A4', NULL, NULL, 11, NULL, NULL, 6, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (102, 'Metoprolol', 'Metoprolol', NULL, 'CYP2D6 (major)', NULL, NULL, 4, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (103, 'Valsartan', 'Valsartan', NULL, 'Kaum metabolisiert (überwiegend biliär/renal unverändert)', NULL, NULL, 7, NULL, NULL, 4, 20, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (104, 'Levothyroxin', 'Levothyroxin', NULL, 'Deiodinasen, kein CYP', NULL, NULL, 168, NULL, NULL, 10, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (105, 'Liothyronin', 'Liothyronin', NULL, 'Keine relevante CYP-Beteiligung', NULL, NULL, 24, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (106, 'Novothyral', 'Levothyroxin/Liothyronin', NULL, 'Keine relevante CYP-Beteiligung', NULL, NULL, 72, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (107, 'Pantoprazol', 'Pantoprazol', NULL, 'CYP2C19, CYP3A4', NULL, NULL, 1, NULL, NULL, 5, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (108, 'Omeprazol', 'Omeprazol', NULL, 'CYP2C19, CYP3A4', NULL, NULL, 1, NULL, NULL, 5, 25, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (109, 'Esomeprazol', 'Esomeprazol', NULL, 'CYP2C19, CYP3A4', NULL, NULL, 1.5, NULL, NULL, 5, 25, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (110, 'Lansoprazol', 'Lansoprazol', NULL, 'CYP2C19, CYP3A4', NULL, NULL, 1.5, NULL, NULL, 5, 25, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (111, 'Atorvastatin', 'Atorvastatin', NULL, 'CYP3A4', NULL, NULL, 14, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (112, 'Simvastatin', 'Simvastatin', NULL, 'CYP3A4', NULL, NULL, 3, NULL, NULL, 6, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (113, 'Rosuvastatin', 'Rosuvastatin', NULL, 'Minimal CYP2C9', NULL, NULL, 19, NULL, NULL, 5, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (114, 'Pravastatin', 'Pravastatin', NULL, 'Kein CYP, renal eliminiert', NULL, NULL, 2, NULL, NULL, 5, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (115, 'Metformin', 'Metformin', NULL, 'Kein CYP, renal eliminiert', NULL, NULL, 6, NULL, NULL, 3, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (116, 'Glimepirid', 'Glimepirid', NULL, 'CYP2C9 (major)', NULL, NULL, 5, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (117, 'Insulin Glargin', 'Insulin Glargin', NULL, 'Proteolyse, kein CYP', NULL, NULL, 12, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (118, 'Insulin Aspart', 'Insulin Aspart', NULL, 'Proteolyse, kein CYP', NULL, NULL, 1, NULL, NULL, 7, 15, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (119, 'Dapagliflozin', 'Dapagliflozin', NULL, 'UGT1A9, minimal CYP', NULL, NULL, 12, NULL, NULL, 5, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (120, 'Liraglutid', 'Liraglutid', NULL, 'Proteolyse, kein CYP', NULL, NULL, 13, NULL, NULL, 2, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (121, 'Prednisolon', 'Prednisolon', NULL, 'Leberaktivierung → Prednisolon (CYP3A4)', NULL, NULL, 3, NULL, NULL, 9, 5, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (122, 'Prednison', 'Prednison', NULL, 'Leberaktivierung → Prednisolon (CYP3A4)', NULL, NULL, 3, NULL, NULL, 9, 5, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (123, 'Dexamethason', 'Dexamethason', NULL, 'CYP3A4', NULL, NULL, 36, NULL, NULL, 10, 5, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (124, 'Hydrocortison', 'Hydrocortison', NULL, 'CYP3A4, 11β-HSD', NULL, NULL, 1.5, NULL, NULL, 10, 5, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (125, 'Methylprednisolon', 'Methylprednisolon', NULL, 'CYP3A4', NULL, NULL, 3, NULL, NULL, 8, 5, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (126, 'Ciclosporin', 'Ciclosporin', NULL, 'CYP3A4, P-gp', NULL, NULL, 8, NULL, NULL, 10, 5, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (127, 'Tacrolimus', 'Tacrolimus', NULL, 'CYP3A4', NULL, NULL, 12, NULL, NULL, 10, 5, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (128, 'Mycophenolat', 'Mycophenolat', NULL, 'Glukuronidierung (UGT1A9)', NULL, NULL, 16, NULL, NULL, 9, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (129, 'Azathioprin', 'Azathioprin', NULL, 'TPMT, XDH (kein CYP450)', NULL, NULL, 5, NULL, NULL, 8, 10, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (130, 'Sirolimus', 'Sirolimus', NULL, 'CYP3A4, P-gp', NULL, NULL, 60, NULL, NULL, 10, 5, 0, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (131, 'Cetirizin', 'Cetirizin', NULL, 'minimal CYP, überwiegend renal', NULL, NULL, 8, NULL, NULL, 4, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (132, 'Loratadin', 'Loratadin', NULL, 'CYP3A4, CYP2D6 (→ Desloratadin)', NULL, NULL, 8, NULL, NULL, 4, 30, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (133, 'Desloratadin', 'Desloratadin', NULL, 'CYP3A4, CYP2D6', NULL, NULL, 27, NULL, NULL, 4, 25, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (134, 'Fexofenadin', 'Fexofenadin', NULL, 'P-gp, minimal CYP3A4', NULL, NULL, 14, NULL, NULL, 3, 30, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (135, 'Dimetinden', 'Dimetinden', NULL, 'Lebermetabolismus (kein dominanter CYP-Typ)', NULL, NULL, 6, NULL, NULL, 3, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (136, 'Salbutamol', 'Salbutamol', NULL, 'Geringe CYP-Beteiligung, v.a. Sulfatkonjugation', NULL, NULL, 4, NULL, NULL, 4, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (137, 'Formoterol', 'Formoterol', NULL, 'CYP2D6, CYP2C9, CYP2C19', NULL, NULL, 10, NULL, NULL, 7, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (138, 'Salmeterol', 'Salmeterol', NULL, 'CYP3A4', NULL, NULL, 5.5, NULL, NULL, 7, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (139, 'Budesonid', 'Budesonid', NULL, 'CYP3A4', NULL, NULL, 3, NULL, NULL, 7, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (140, 'Fluticason', 'Fluticason', NULL, 'CYP3A4', NULL, NULL, 7, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (141, 'Tiotropium', 'Tiotropium', NULL, 'Kaum CYP, überwiegend renal eliminiert', NULL, NULL, 25, NULL, NULL, 6, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (142, 'Estradiol', 'Estradiol', NULL, 'CYP3A4, CYP1A2', NULL, NULL, 14, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (143, 'Estradiol + Dydrogesteron', 'Estradiol + Dydrogesteron', NULL, 'CYP3A4, CYP2C19', NULL, NULL, 17, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (144, 'Progesteron', 'Progesteron', NULL, 'CYP3A4', NULL, NULL, 16, NULL, NULL, 4, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (145, 'Levonorgestrel', 'Levonorgestrel', NULL, 'CYP3A4', NULL, NULL, 24, NULL, NULL, 4, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (146, 'Norethisteron', 'Norethisteron', NULL, 'CYP3A4', NULL, NULL, 8, NULL, NULL, 4, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (147, 'Testosteron', 'Testosteron', NULL, 'CYP3A4, CYP2C19', NULL, NULL, 24, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (149, 'Cabergolin', 'Cabergolin', 26, 'CYP3A4', 'Dopamin-Agonist bei Prolaktinom', '0,5-2mg wöchentlich', 65, NULL, NULL, 5, 25, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (150, 'Tibolon', 'Tibolon', 25, 'CYP3A4', 'Synthetisches Steroid', '2.5 mg/Tag', 45, NULL, NULL, 6, 15, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (151, 'Raloxifen', 'Raloxifen', 25, 'UGT', 'SERM für Osteoporose', '60 mg/Tag', 28, NULL, NULL, 5, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (152, 'Exemestan', 'Exemestan', 26, 'CYP3A4', 'Aromatasehemmer', '25mg täglich', 24, NULL, NULL, 4, 25, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (153, 'Drospirenon/Ethinylestradiol', 'Yasmin', 26, 'CYP3A4', 'Kombinationspille', '1 Tablette täglich', 30, NULL, NULL, 5, 25, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (154, 'Paracetamol', 'Paracetamol', NULL, 'Glucuronidierung/Sulfatierung, geringe CYP2E1-Beteiligung', NULL, NULL, 2.5, NULL, NULL, 2, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (155, 'Medroxyprogesteronacetat', 'Medroxyprogesteronacetat', 26, 'CYP3A4', 'Gestagen', '5-10mg täglich', 30, NULL, NULL, 5, 25, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (156, 'Diclofenac', 'Diclofenac', NULL, 'CYP2C9, CYP3A4', NULL, NULL, 2, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (157, 'Naproxen', 'Naproxen', NULL, 'CYP2C9', NULL, NULL, 12, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (158, 'Metamizol', 'Metamizol', NULL, 'CYP2B6, CYP2C9, CYP3A4', NULL, NULL, 2, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (159, 'Acetylsalicylsäure', 'Acetylsalicylsäure', NULL, 'Schnelle Deacetylierung zu Salicylat, keine dominante CYP-Abhängigkeit', NULL, NULL, 0.25, NULL, NULL, 6, 15, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (160, 'Zolpidem', 'Zolpidem', NULL, 'CYP3A4', NULL, NULL, 2.5, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (162, 'Eszopiclon', 'Eszopiclon', NULL, 'CYP3A4', NULL, NULL, 6, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (163, 'Doxylamin', 'Doxylamin', NULL, 'CYP2D6', NULL, NULL, 10, NULL, NULL, 4, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (164, 'Diphenhydramin', 'Diphenhydramin', NULL, 'CYP2D6, CYP2C19', NULL, NULL, 9, NULL, NULL, 4, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (165, 'Trazodon', 'Trazodon', NULL, 'CYP3A4', NULL, NULL, 6, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (166, 'Trimipramin', 'Trimipramin', NULL, 'CYP2D6', NULL, NULL, 12, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (167, 'Pregabalin', 'Pregabalin', NULL, 'kein CYP, renal', NULL, NULL, 6, NULL, NULL, 7, 10, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (168, 'Gabapentin', 'Gabapentin', NULL, 'kein CYP, renal', NULL, NULL, 6, NULL, NULL, 7, 10, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (169, 'Agomelatin', 'Agomelatin', NULL, 'CYP1A2 (major), CYP2C9/CYP2C19 (minor)', NULL, NULL, 2, NULL, NULL, 4, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (170, 'Vortioxetin', 'Vortioxetin', NULL, 'CYP2D6 (major), CYP3A4/CYP2C9 (minor)', NULL, NULL, 66, NULL, NULL, 4, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (171, 'Nortriptylin', 'Nortriptylin', NULL, 'CYP2D6 (major)', NULL, NULL, 36, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (172, 'Clomipramin', 'Clomipramin', NULL, 'CYP2D6 (major), CYP3A4 (minor)', NULL, NULL, 32, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (173, 'Mianserin', 'Mianserin', NULL, 'CYP2D6, CYP3A4', NULL, NULL, 30, NULL, NULL, 6, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (174, 'Buspiron', 'Buspiron', NULL, 'CYP3A4', NULL, NULL, 3, NULL, NULL, 4, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (175, 'Melatonin', 'Melatonin', NULL, 'CYP1A2', NULL, NULL, 1, NULL, NULL, 2, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (176, 'Propranolol', 'Propranolol', NULL, 'CYP2D6, CYP1A2, CYP2C19', NULL, NULL, 4, NULL, NULL, 7, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (177, 'Buprenorphin', 'Buprenorphin', NULL, 'CYP3A4', NULL, NULL, 37, NULL, NULL, 9, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (178, 'Tapentadol', 'Tapentadol', NULL, 'Glukuronidierung, wenig CYP2C9/2C19', NULL, NULL, 4, NULL, NULL, 8, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (179, 'Tilidin/Naloxon', 'Tilidin/Naloxon', NULL, 'CYP3A4, CYP2C19', NULL, NULL, 4, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (180, 'Codein', 'Codein', NULL, 'CYP2D6', NULL, NULL, 3, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (181, 'Dihydrocodein', 'Dihydrocodein', NULL, 'CYP2D6', NULL, NULL, 4, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (182, 'Pethidin', 'Pethidin', NULL, 'CYP3A4', NULL, NULL, 3, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (183, 'Celecoxib', 'Celecoxib', NULL, 'CYP2C9', NULL, NULL, 11, NULL, NULL, 4, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (184, 'Etoricoxib', 'Etoricoxib', NULL, 'CYP3A4 (gering), nicht-CYP-Metabolismus', NULL, NULL, 22, NULL, NULL, 4, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (185, 'Lidocain', 'Lidocain', NULL, 'CYP1A2, CYP3A4', NULL, NULL, 1.5, NULL, NULL, 3, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (186, 'Ketamin', 'Ketamin', NULL, 'CYP2B6, CYP3A4', NULL, NULL, 3, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (187, 'Amoxicillin', 'Amoxicillin', NULL, 'Kein relevantes CYP, renal eliminiert', NULL, NULL, 1, NULL, NULL, 5, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (188, 'Amoxicillin/Clavulansäure', 'Amoxicillin/Clavulansäure', NULL, 'Kein relevantes CYP, renal eliminiert', NULL, NULL, 1, NULL, NULL, 6, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (189, 'Cefuroxim', 'Cefuroxim', NULL, 'Kein relevantes CYP, renal eliminiert', NULL, NULL, 1.5, NULL, NULL, 5, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (190, 'Ceftriaxon', 'Ceftriaxon', NULL, 'Kein relevantes CYP, biliär/renal eliminiert', NULL, NULL, 8, NULL, NULL, 6, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (191, 'Ciprofloxacin', 'Ciprofloxacin', NULL, 'CYP1A2-Inhibitor, wenig CYP3A4', NULL, NULL, 4, NULL, NULL, 6, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (192, 'Levofloxacin', 'Levofloxacin', NULL, 'Kaum CYP, überwiegend renal', NULL, NULL, 7, NULL, NULL, 6, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (193, 'Azithromycin', 'Azithromycin', NULL, 'CYP3A4, P-gp-Interaktion', NULL, NULL, 68, NULL, NULL, 7, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (194, 'Clarithromycin', 'Clarithromycin', NULL, 'CYP3A4 (starker Inhibitor)', NULL, NULL, 5, NULL, NULL, 7, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (195, 'Doxycyclin', 'Doxycyclin', NULL, 'Kein dominantes CYP, hepatisch/biliär', NULL, NULL, 18, NULL, NULL, 5, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (196, 'Clindamycin', 'Clindamycin', NULL, 'CYP3A4', NULL, NULL, 2.5, NULL, NULL, 7, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (197, 'Hydrochlorothiazide', 'Hydrochlorothiazide', NULL, 'none (renal elimination)', NULL, NULL, 8, NULL, NULL, 6, 20, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (198, 'Furosemide', 'Furosemide', NULL, 'minimal hepatic metabolism, mainly renal', NULL, NULL, 1.5, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (199, 'Torasemide', 'Torasemide', NULL, 'CYP2C9 (major)', NULL, NULL, 3.5, NULL, NULL, 8, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (200, 'Spironolactone', 'Spironolactone', NULL, 'CYP3A4 (hepatic metabolism, active metabolites)', NULL, NULL, 14, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (201, 'Eplerenone', 'Eplerenone', NULL, 'CYP3A4 (major)', NULL, NULL, 4.5, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (202, 'Indapamide', 'Indapamide', NULL, 'CYP3A4 (partial), hepatic', NULL, NULL, 16, NULL, NULL, 6, 20, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (203, 'Verapamil', 'Verapamil', NULL, 'CYP3A4 (substrate & inhibitor), P-gp inhibitor', NULL, NULL, 4, NULL, NULL, 7, 15, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (204, 'Diltiazem', 'Diltiazem', NULL, 'CYP3A4 (substrate & inhibitor)', NULL, NULL, 4, NULL, NULL, 7, 15, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (205, 'Digoxin', 'Digoxin', NULL, 'P-gp substrate, minimal CYP', NULL, NULL, 36, NULL, NULL, 7, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (206, 'Ivabradine', 'Ivabradine', NULL, 'CYP3A4 (major)', NULL, NULL, 6, NULL, NULL, 6, 15, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (207, 'Metoclopramid', 'Metoclopramid', NULL, 'CYP2D6, CYP3A4', NULL, NULL, 5, NULL, NULL, 6, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (208, 'Ondansetron', 'Ondansetron', NULL, 'CYP3A4, CYP2D6, CYP1A2', NULL, NULL, 4, NULL, NULL, 5, 25, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (209, 'Dimenhydrinat', 'Dimenhydrinat', NULL, 'CYP2D6', NULL, NULL, 4, NULL, NULL, 4, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (210, 'Loperamid', 'Loperamid', NULL, 'CYP3A4, CYP2C8, P-gp', NULL, NULL, 11, NULL, NULL, 6, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (211, 'Macrogol', 'Macrogol', NULL, 'Keine relevante CYP-Metabolisierung (minimal resorbiert)', NULL, NULL, 1, NULL, NULL, 3, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (212, 'Bisacodyl', 'Bisacodyl', NULL, 'Esterasen, Glucuronidierung (non-CYP)', NULL, NULL, 16, NULL, NULL, 5, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (213, 'Sumatriptan', 'Sumatriptan', NULL, 'MAO-A (non-CYP-dominant)', NULL, NULL, 2, NULL, NULL, 6, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (214, 'Fluconazol', 'Fluconazol', NULL, 'CYP2C9, CYP2C19, CYP3A4 (Inhibitor)', NULL, NULL, 30, NULL, NULL, 6, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (215, 'Aciclovir', 'Aciclovir', NULL, 'Keine relevante CYP-Metabolisierung, primär renal eliminiert', NULL, NULL, 3, NULL, NULL, 4, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (216, 'Famotidin', 'Famotidin', NULL, 'Keine relevante CYP-Metabolisierung, primär renal eliminiert', NULL, NULL, 3, NULL, NULL, 4, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (217, 'Losartan', 'Losartan', NULL, 'CYP2C9, CYP3A4', NULL, NULL, 2, NULL, NULL, 7, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (218, 'Candesartan', 'Candesartan', NULL, 'CYP2C9 (minor), largely non-CYP', NULL, NULL, 9, NULL, NULL, 7, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (219, 'Nebivolol', 'Nebivolol', NULL, 'CYP2D6 (major)', NULL, NULL, 10, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (220, 'Carvedilol', 'Carvedilol', NULL, 'CYP2D6, CYP2C9, CYP3A4, P-gp', NULL, NULL, 7, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (221, 'Isosorbidmononitrat', 'Isosorbidmononitrat', NULL, 'Hepatic metabolism, minimal CYP involvement', NULL, NULL, 5, NULL, NULL, 7, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (222, 'Clopidogrel', 'Clopidogrel', NULL, 'CYP2C19 (major prodrug activation), CYP3A4', NULL, NULL, 8, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (223, 'Ranolazin', 'Ranolazin', NULL, 'CYP3A4 (major), CYP2D6', NULL, NULL, 7, NULL, NULL, 6, 15, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (224, 'Allopurinol', 'Allopurinol', NULL, 'Xanthine oxidase, minimal CYP involvement', NULL, NULL, 18, NULL, NULL, 6, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (225, 'Amlodipin/Valsartan', 'Amlodipin/Valsartan', NULL, 'CYP3A4 (Amlodipin), CYP2C9 (Valsartan)', NULL, NULL, 36, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (226, 'Bisoprolol/Amlodipin', 'Bisoprolol/Amlodipin', NULL, 'CYP3A4 (Amlodipin), CYP2D6/CYP3A4 (Bisoprolol)', NULL, NULL, 36, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (227, 'Sitagliptin', 'Sitagliptin', NULL, 'Minimal CYP, largely renal elimination', NULL, NULL, 12, NULL, NULL, 5, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (228, 'Linagliptin', 'Linagliptin', NULL, 'CYP3A4 (minor), largely biliary/fecal elimination', NULL, NULL, 100, NULL, NULL, 5, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (229, 'Empagliflozin', 'Empagliflozin', NULL, 'UGT1A3, UGT1A8, UGT1A9, minimal CYP', NULL, NULL, 13, NULL, NULL, 5, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (230, 'Canagliflozin', 'Canagliflozin', NULL, 'UGT1A9, UGT2B4, CYP3A4', NULL, NULL, 11, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (231, 'Pioglitazon', 'Pioglitazon', NULL, 'CYP2C8 (major), CYP3A4', NULL, NULL, 7, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (232, 'Sertralin', 'Sertralin', NULL, 'CYP2B6, CYP2C9, CYP2C19, CYP2D6, CYP3A4', NULL, NULL, 26, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (233, 'Paroxetin', 'Paroxetin', NULL, 'CYP2D6 (major substrate & potent inhibitor)', NULL, NULL, 21, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (234, 'Fluoxetin', 'Fluoxetin', NULL, 'CYP2D6 (potent inhibitor), CYP2C9, CYP3A4', NULL, NULL, 96, NULL, NULL, 5, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (235, 'Venlafaxin', 'Venlafaxin', NULL, 'CYP2D6 (major), CYP3A4', NULL, NULL, 5, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (236, 'Duloxetin', 'Duloxetin', NULL, 'CYP1A2 (major), CYP2D6', NULL, NULL, 12, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (237, 'Mirtazapin', 'Mirtazapin', NULL, 'CYP1A2, CYP2D6, CYP3A4', NULL, NULL, 25, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (238, 'Lamotrigin', 'Lamotrigin', NULL, 'UGT1A4 (glucuronidation), minimal CYP', NULL, NULL, 29, NULL, NULL, 7, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (239, 'Valproinsäure', 'Valproinsäure', NULL, 'UGT, CYP2C9 (minor), multi-enzyme inhibitor', NULL, NULL, 14, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (240, 'Carbamazepin', 'Carbamazepin', NULL, 'CYP3A4 (potent inducer), CYP2C8', NULL, NULL, 16, NULL, NULL, 8, 10, 1, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (243, 'Eslicarbazepinacetat', 'Eslicarbazepinacetat', 3, 'CYP3A4', 'Antiepileptikum', '800-1200mg täglich', 13, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (244, 'Naloxon', 'Naloxon', NULL, 'UGT2B7 (glucuronidation), minimal CYP', NULL, NULL, 1, NULL, NULL, 3, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (245, 'Naltrexon', 'Naltrexon', NULL, 'UGT (glucuronidation), minimal CYP', NULL, NULL, 10, NULL, NULL, 4, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (246, 'Montelukast', 'Montelukast', NULL, 'CYP2C8, CYP2C9, CYP3A4', NULL, NULL, 5, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (247, 'Amiodaron', 'Amiodaron', NULL, 'CYP3A4 (major), CYP2C8, multi-enzyme inhibitor', NULL, NULL, 720, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (248, 'Sotalol', 'Sotalol', NULL, 'Minimal CYP, largely renal elimination', NULL, NULL, 12, NULL, NULL, 7, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (249, 'Propafenon', 'Propafenon', NULL, 'CYP2D6 (major), CYP3A4, CYP1A2', NULL, NULL, 6, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (250, 'Tamsulosin', 'Tamsulosin', NULL, 'CYP3A4, CYP2D6', NULL, NULL, 15, NULL, NULL, 5, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (251, 'Finasterid', 'Finasterid', NULL, 'CYP3A4 (major), CYP2C9, CYP2C19', NULL, NULL, 6, NULL, NULL, 5, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (252, 'Methotrexat', 'Methotrexat', NULL, 'Minimal CYP, mainly renal elimination and DHFR', NULL, NULL, 12, NULL, NULL, 7, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (253, 'Leflunomid', 'Leflunomid', NULL, 'CYP2C9, CYP1A2 (active metabolite)', NULL, NULL, 360, NULL, NULL, 7, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (254, 'Sulfasalazin', 'Sulfasalazin', NULL, 'Bacterial azoreductase, acetylation, minimal CYP', NULL, NULL, 7, NULL, NULL, 6, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (255, 'Hydroxychloroquin', 'Hydroxychloroquin', NULL, 'CYP3A4, CYP2D6, CYP2C8', NULL, NULL, 1200, NULL, NULL, 6, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (256, 'Tamoxifen', 'Tamoxifen', NULL, 'CYP2D6 (to endoxifen, critical!), CYP3A4', NULL, NULL, 168, NULL, NULL, 7, 15, 1, 'critical');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (257, 'Anastrozol', 'Anastrozol', NULL, 'CYP3A4, CYP1A2, CYP2C8/9', NULL, NULL, 50, NULL, NULL, 6, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (258, 'Letrozol', 'Letrozol', NULL, 'CYP3A4, CYP2A6', NULL, NULL, 48, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (259, 'Imatinib', 'Imatinib', NULL, 'CYP3A4 (major), CYP2C8, CYP2D6', NULL, NULL, 18, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (260, 'Bicalutamid', 'Bicalutamid', NULL, 'CYP3A4, UGT (glucuronidation)', NULL, NULL, 168, NULL, NULL, 7, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (261, 'Levodopa/Carbidopa', 'Levodopa/Carbidopa', NULL, 'Aromatic L-amino acid decarboxylase, COMT, minimal CYP', NULL, NULL, 1.5, NULL, NULL, 9, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (262, 'Pramipexol', 'Pramipexol', NULL, 'Minimal CYP, largely renal elimination', NULL, NULL, 8, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (263, 'Ropinirol', 'Ropinirol', NULL, 'CYP1A2 (major)', NULL, NULL, 6, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (264, 'Rasagilin', 'Rasagilin', NULL, 'CYP1A2 (major)', NULL, NULL, 3, NULL, NULL, 7, 15, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (265, 'Natalizumab', 'Natalizumab', NULL, 'Protein catabolism, no CYP involvement', NULL, NULL, 336, NULL, NULL, 9, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (266, 'Fingolimod', 'Fingolimod', NULL, 'CYP4F2 (major), several CYPs', NULL, NULL, 168, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (267, 'Dimethylfumarat', 'Dimethylfumarat', NULL, 'Esterases, minimal CYP involvement', NULL, NULL, 1, NULL, NULL, 6, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (268, 'Teriflunomid', 'Teriflunomid', NULL, 'CYP2C8 (minor), largely non-CYP', NULL, NULL, 432, NULL, NULL, 7, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (269, 'Alendronat', 'Alendronat', NULL, 'No metabolism, bone storage and renal elimination', NULL, NULL, 87600, NULL, NULL, 5, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (270, 'Risedronat', 'Risedronat', NULL, 'No metabolism, bone storage and renal elimination', NULL, NULL, 43800, NULL, NULL, 5, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (271, 'Denosumab', 'Denosumab', NULL, 'Protein catabolism, no CYP involvement', NULL, NULL, 672, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (272, 'Thiamazol', 'Thiamazol', NULL, 'Minimal CYP involvement', NULL, NULL, 6, NULL, NULL, 7, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (273, 'Desmopressin', 'Desmopressin', NULL, 'Peptidases, no CYP involvement', NULL, NULL, 3, NULL, NULL, 6, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (274, 'Sildenafil', 'Sildenafil', NULL, 'CYP3A4 (major), CYP2C9', NULL, NULL, 4, NULL, NULL, 3, 30, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (275, 'Tadalafil', 'Tadalafil', NULL, 'CYP3A4 (major)', NULL, NULL, 18, NULL, NULL, 3, 30, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (276, 'Mirabegron', 'Mirabegron', NULL, 'CYP3A4, CYP2D6, UGT', NULL, NULL, 50, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (278, 'Lisinopril', 'Lisinopril', NULL, 'No metabolism, renal elimination only', NULL, NULL, 12, NULL, NULL, 7, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (279, 'Urapidil', 'Urapidil', 11, NULL, 'Alpha-1-Blocker', '60-180mg täglich', 3, NULL, NULL, 4, 25, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (280, 'Clonidin', 'Clonidin', NULL, 'CYP2D6 (minor), largely renal', NULL, NULL, 12, NULL, NULL, 8, 10, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (281, 'Doxazosin', 'Doxazosin', NULL, 'CYP3A4 (major)', NULL, NULL, 22, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (282, 'Bumetanid', 'Bumetanid', 27, NULL, 'Schleifendiuretikum', '1-5mg täglich', 1.5, NULL, NULL, 3, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (283, 'Gliclazid', 'Gliclazid', NULL, 'CYP2C9, hepatic metabolism', NULL, NULL, 12, NULL, NULL, 6, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (284, 'Insulin Detemir', 'Insulin Detemir', NULL, 'none (proteolytic degradation)', NULL, NULL, 8, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (285, 'Insulin Degludec', 'Insulin Degludec', NULL, 'none (proteolytic degradation)', NULL, NULL, 25, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (286, 'Insulin Lispro', 'Insulin Lispro', NULL, 'none (proteolytic degradation)', NULL, NULL, 1, NULL, NULL, 7, 15, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (287, 'Topiramat', 'Topiramat', NULL, 'Minimal CYP, largely renal elimination', NULL, NULL, 21, NULL, NULL, 8, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (288, 'Levetiracetam', 'Levetiracetam', NULL, 'Non-CYP hydrolysis, largely renal', NULL, NULL, 7, NULL, NULL, 7, 10, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (289, 'Oxcarbazepin', 'Oxcarbazepin', NULL, 'CYP3A4 (weak inducer), UGT', NULL, NULL, 9, NULL, NULL, 8, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (290, 'Quetiapin', 'Quetiapin', NULL, 'CYP3A4 (major)', NULL, NULL, 7, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (291, 'Olanzapin', 'Olanzapin', NULL, 'CYP1A2 (major), CYP2D6, UGT', NULL, NULL, 33, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (292, 'Donepezil', 'Donepezil', NULL, 'CYP2D6, CYP3A4', NULL, NULL, 70, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (293, 'Rivastigmin', 'Rivastigmin', NULL, 'Esterases, no CYP involvement', NULL, NULL, 1.5, NULL, NULL, 6, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (294, 'Memantin', 'Memantin', NULL, 'Minimal CYP, largely renal', NULL, NULL, 70, NULL, NULL, 6, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (295, 'Adalimumab', 'Adalimumab', NULL, 'none (protein catabolism)', NULL, NULL, 336, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (296, 'Etanercept', 'Etanercept', NULL, 'none (protein catabolism)', NULL, NULL, 102, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (297, 'Mesalazin', 'Mesalazin', NULL, 'N-acetyltransferase, minimal CYP', NULL, NULL, 1, NULL, NULL, 6, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (298, 'Infliximab', 'Infliximab', NULL, 'none (protein catabolism)', NULL, NULL, 192, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (299, 'Nitrofurantoin', 'Nitrofurantoin', NULL, 'Bacterial reduction, minimal CYP', NULL, NULL, 0.5, NULL, NULL, 4, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (300, 'Fosfomycin', 'Fosfomycin', NULL, 'No metabolism, renal elimination', NULL, NULL, 4, NULL, NULL, 4, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (301, 'Metronidazol', 'Metronidazol', NULL, 'CYP2C9, CYP3A4 (minor)', NULL, NULL, 8, NULL, NULL, 5, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (302, 'Solifenacin', 'Solifenacin', NULL, 'CYP3A4 (major)', NULL, NULL, 50, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (303, 'Oxybutynin', 'Oxybutynin', NULL, 'CYP3A4 (major)', NULL, NULL, 3, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (304, 'Febuxostat', 'Febuxostat', NULL, 'CYP1A2, CYP2C8, UGT', NULL, NULL, 8, NULL, NULL, 6, 15, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (305, 'Ezetimib', 'Ezetimib', NULL, 'UGT1A1, UGT1A3, minimal CYP', NULL, NULL, 22, NULL, NULL, 4, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (306, 'Vareniclin', 'Vareniclin', NULL, 'Minimal CYP, largely renal', NULL, NULL, 24, NULL, NULL, 6, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (307, 'Rivaroxaban', 'Rivaroxaban', NULL, 'CYP3A4, CYP2J2, P-gp', NULL, NULL, 9, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (308, 'Apixaban', 'Apixaban', NULL, 'CYP3A4, P-gp, BCRP', NULL, NULL, 12, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (309, 'Edoxaban', 'Edoxaban', NULL, 'P-gp, gering CYP3A4', NULL, NULL, 10, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (310, 'Prasugrel', 'Prasugrel', NULL, 'CYP3A4, CYP2B6, CYP2C9', NULL, NULL, 7, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (311, 'Ticagrelor', 'Ticagrelor', NULL, 'CYP3A4, P-gp', NULL, NULL, 8, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (312, 'Upadacitinib', 'Rinvoq', 29, 'CYP3A4', 'JAK-Inhibitor', '15mg täglich', 14, NULL, NULL, 5, 25, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (313, 'Apremilast', 'Otezla', 29, 'CYP3A4', 'PDE4-Hemmer', '30mg 2x täglich', 9, NULL, NULL, 4, 25, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (314, 'Anakinra', 'Kineret', 29, NULL, 'IL-1-Rezeptor-Antagonist', '100mg täglich s.c.', 6, NULL, NULL, 4, 25, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (315, 'Glibenclamid', 'Glibenclamid', NULL, 'CYP2C9', NULL, NULL, 10, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (316, 'Dulaglutid', 'Dulaglutid', NULL, 'Proteolyse, kein CYP', NULL, NULL, 120, NULL, NULL, 4, 20, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (317, 'Semaglutid', 'Semaglutid', NULL, 'Proteolyse, kein CYP', NULL, NULL, 168, NULL, NULL, 5, 15, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (318, 'Ustekinumab', 'Ustekinumab', NULL, 'Proteinabbau, kein CYP', NULL, NULL, 504, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (319, 'Vedolizumab', 'Vedolizumab', NULL, 'Proteinabbau, kein CYP', NULL, NULL, 600, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (320, 'Tofacitinib', 'Tofacitinib', NULL, 'CYP3A4, CYP2C19', NULL, NULL, 3, NULL, NULL, 8, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (321, 'Isotretinoin', 'Isotretinoin', NULL, 'CYP2C8, CYP2C9, CYP3A4', NULL, NULL, 20, NULL, NULL, 4, 25, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (322, 'Acitretin', 'Acitretin', NULL, 'CYP2C8, CYP2C9, CYP3A4', NULL, NULL, 50, NULL, NULL, 5, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (323, 'Latanoprost', 'Latanoprost', NULL, 'Esterasen, kein relevantes CYP', NULL, NULL, 0.3, NULL, NULL, 6, 20, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (324, 'Timolol (ophthalmisch)', 'Timolol', NULL, 'CYP2D6', NULL, NULL, 4, NULL, NULL, 7, 10, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (325, 'Baclofen', 'Baclofen', NULL, 'renal, minimal CYP', NULL, NULL, 4, NULL, NULL, 7, 10, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (326, 'Tizanidin', 'Tizanidin', NULL, 'CYP1A2', NULL, NULL, 2.5, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (327, 'Lithium', 'Lithium', NULL, 'renal, kein CYP', NULL, NULL, 24, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (328, 'Methylphenidat', 'Methylphenidat', NULL, 'CES1, gering CYP2D6', NULL, NULL, 3, NULL, NULL, 6, 20, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (329, 'Atomoxetin', 'Atomoxetin', NULL, 'CYP2D6, CYP2C19', NULL, NULL, 5, NULL, NULL, 6, 15, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (330, 'Oseltamivir', 'Oseltamivir', NULL, 'Esterasen, kein CYP', NULL, NULL, 8, NULL, NULL, 3, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (331, 'Valganciclovir', 'Valganciclovir', NULL, 'renal, kein relevantes CYP', NULL, NULL, 4, NULL, NULL, 8, 10, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (332, 'Budesonid/Formoterol', 'Budesonid + Formoterol', NULL, 'CYP3A4 (Budesonid), CYP2D6/2C19 (Formoterol)', NULL, NULL, 5, NULL, NULL, 7, 15, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (333, 'Eptinezumab', 'Vyepti', 30, NULL, 'CGRP-Antikörper', '100-300mg alle 3 Monate i.v.', 660, NULL, NULL, 3, 50, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (335, 'Ethinylestradiol/Levonorgestrel', 'Ethinylestradiol + Levonorgestrel', NULL, 'CYP3A4 (beide), gering CYP2C9', NULL, NULL, 24, NULL, NULL, 4, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (337, 'Desogestrel', 'Desogestrel', NULL, 'CYP3A4 (über Etonogestrel)', NULL, NULL, 30, NULL, NULL, 4, 20, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (338, 'Rotigotin', 'Rotigotin', 31, 'CYP2D6', 'Dopamin-Agonist Pflaster', '2-8mg täglich', 5, NULL, NULL, 7, 12.5, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (339, 'Apomorphin', 'Apomorphin', 31, NULL, 'Dopamin-Agonist', '2-6mg s.c. bei Bedarf', 0.5, NULL, NULL, 6, 25, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (340, 'Piribedil', 'Piribedil', 31, 'CYP1A2', 'Dopamin-Agonist', '150mg täglich', 7, NULL, NULL, 6, 12.5, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (342, 'Safinamid', 'Safinamid', 31, 'CYP3A4', 'MAO-B-Hemmer', '50-100mg täglich', 22, NULL, NULL, 6, 25, 0, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (343, 'Entacapon', 'Entacapon', 31, NULL, 'COMT-Hemmer', '200mg mit jeder Levodopa-Dosis', 0.8, NULL, NULL, 5, 25, 0, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (344, 'Tolcapon', 'Tolcapon', 31, 'CYP2C9', 'COMT-Hemmer', '100-200mg 3x täglich', 2, NULL, NULL, 6, 25, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (345, 'Levocetirizin', 'Levocetirizin', NULL, 'kaum CYP, überwiegend renal', NULL, NULL, 8, NULL, NULL, 4, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (346, 'Budipin', 'Budipin', 31, NULL, 'Antiparkinsonmittel', '60-120mg täglich', 36, NULL, NULL, 7, 12.5, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (347, 'Trihexyphenidyl', 'Trihexyphenidyl', 31, NULL, 'Anticholinergikum', '6-15mg täglich', 10, NULL, NULL, 7, 12.5, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (348, 'Biperiden', 'Biperiden', 31, NULL, 'Anticholinergikum', '4-12mg täglich', 18, NULL, NULL, 6, 12.5, 0, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (352, 'Cholecalciferol', 'Cholecalciferol', NULL, 'CYP2R1, CYP27B1, CYP24A1', NULL, NULL, 1200, NULL, NULL, 3, 30, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (353, 'Calciumcarbonat', 'Calciumcarbonat', NULL, 'kein CYP (lokaler Effekt im Darm)', NULL, NULL, 2, NULL, NULL, 2, 30, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (354, 'Rupatadin', 'Rupatadin', 32, 'CYP3A4', 'H1-Antihistaminikum', '10mg täglich', 6, NULL, NULL, 2, 50, 1, 'medium');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (355, 'Bilastin', 'Bilastin', 32, NULL, 'H1-Antihistaminikum', '20mg täglich', 14.5, NULL, NULL, 2, 50, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (356, 'Citalopram', 'Citalopram', NULL, 'CYP2C19, CYP3A4, CYP2D6', NULL, NULL, 35, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (357, 'Escitalopram', 'Escitalopram', NULL, 'CYP2C19, CYP3A4, CYP2D6', NULL, NULL, 27, NULL, NULL, 7, 10, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (358, 'Terbinafin', 'Terbinafin', NULL, 'CYP2C9, CYP1A2, CYP3A4 (Inhibitor von CYP2D6)', NULL, NULL, 36, NULL, NULL, 4, 25, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (359, 'Posaconazol', 'Posaconazol', 33, NULL, 'Triazol-Antimykotikum', '300mg täglich', 35, 700, 3500, 4, 50, 1, 'high');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (362, 'Valaciclovir', 'Valaciclovir', 34, NULL, 'Virostatikum gegen Herpes', '500-1000mg 2x täglich', 3, NULL, NULL, 2, 50, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (363, 'Famciclovir', 'Famciclovir', 34, NULL, 'Virostatikum gegen Herpes', '250-500mg 3x täglich', 2, NULL, NULL, 2, 50, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (365, 'Zanamivir', 'Zanamivir', 34, NULL, 'Neuraminidase-Hemmer', '10mg 2x täglich inhalativ', 2.5, NULL, NULL, 2, 50, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (368, 'Ibandronat', 'Ibandronat', 35, NULL, 'Bisphosphonat', '150mg monatlich', 150, NULL, NULL, 3, 50, 1, 'low');

INSERT OR REPLACE INTO medications (id, name, generic_name, category_id, cyp450_enzyme, description, common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength)
VALUES (369, 'Zolendronat', 'Zolendronat', 35, NULL, 'Bisphosphonat', '5mg jährlich i.v.', 146, NULL, NULL, 4, 50, 1, 'low');


-- ========================================================
-- TABLE: cbd_interactions (91 entries)
-- ========================================================

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (1, 'enhancement', 'critical', 'CBD kann die blutverdünnende Wirkung von Warfarin deutlich verstärken, was zu erhöhtem Blutungsrisiko führt.', 'CBD hemmt CYP2C9 und CYP3A4, die für den Abbau von Warfarin verantwortlich sind. Dies führt zu erhöhten Warfarin-Spiegeln im Blut.', 'Regelmäßige INR-Kontrollen erforderlich. Konsultieren Sie vor der CBD-Einnahme unbedingt Ihren Arzt. Möglicherweise muss die Warfarin-Dosis angepasst werden.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-blutverduenner');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (2, 'enhancement', 'high', 'CBD kann die Wirkung von Rivaroxaban verstärken und das Blutungsrisiko erhöhen.', 'CBD hemmt CYP3A4, das primäre Enzym für den Metabolismus von Rivaroxaban.', 'Ärztliche Beratung vor CBD-Einnahme erforderlich. Auf Blutungszeichen achten (z.B. ungewöhnliche Blutergüsse, Nasenbluten).', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (3, 'enhancement', 'high', 'Erhöhtes Blutungs- oder Thromboembolierisiko durch gemeinsamen Metabolismus.', 'CBD und Apixaban werden beide über CYP3A4 metabolisiert, was zu Wechselwirkungen führt.', 'Ärztliche Überwachung notwendig. Blutungsparameter regelmäßig kontrollieren.', 'https://mycannaby.de/blogs/magazin/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (4, 'enhancement', 'high', 'CBD kann die blutverdünnende Wirkung verstärken.', 'CBD beeinflusst CYP2C19, das für den Metabolismus von Clopidogrel wichtig ist.', 'Regelmäßige Kontrolle der Gerinnungswerte. Ärztliche Beratung erforderlich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (5, 'enhancement', 'high', 'CBD kann die Konzentration von Fluoxetin im Blut erhöhen, was zu verstärkten Nebenwirkungen führen kann.', 'CBD hemmt CYP2D6 und CYP2C9, die für den Abbau von Fluoxetin verantwortlich sind.', 'Niedrigere CBD-Dosis empfohlen. Auf verstärkte Nebenwirkungen wie Schläfrigkeit, Übelkeit oder Unruhe achten. Ärztliche Rücksprache erforderlich.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-fluoxetin');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (6, 'enhancement', 'high', 'Mögliche Erhöhung der Sertralin-Konzentration im Blut. In Erfahrungsberichten wurden Halluzinationen, Übelkeit und Durchfall berichtet.', 'CBD hemmt CYP2D6, das am Metabolismus von Sertralin beteiligt ist.', 'Mit niedriger CBD-Dosis beginnen. Auf Nebenwirkungen achten. Bei Halluzinationen oder starkem Unwohlsein sofort Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-sertralin');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (7, 'enhancement', 'medium', 'CBD kann die Wirkung von Escitalopram verstärken.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Escitalopram beteiligt sind.', 'Vorsichtige Dosierung. Überwachung auf verstärkte sedative Effekte.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-antidepressiva');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (8, 'enhancement', 'medium', 'Mögliche Verstärkung der antidepressiven und sedativen Wirkung.', 'CBD hemmt CYP2D6, das für den Abbau von Venlafaxin wichtig ist.', 'Niedrige CBD-Startdosis. Auf verstärkte Müdigkeit achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-antidepressiva');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (9, 'enhancement', 'high', 'CBD kann zu Herzrasen und Übelkeit führen. Verstärkung der Nebenwirkungen möglich.', 'CBD hemmt CYP2D6 und CYP1A2, die am Metabolismus von Duloxetin beteiligt sind.', 'Vorsichtige Kombination nur unter ärztlicher Aufsicht. Bei Herzrasen CBD-Dosis reduzieren oder absetzen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (10, 'enhancement', 'high', 'Verstärkung der sedativen Wirkung. Risiko für Magenschmerzen und Unwohlsein.', 'CBD hemmt CYP2C19 und CYP2D6, die Enzyme für den Abbau von Amitriptylin.', 'Niedrige CBD-Dosis empfohlen. Auf verstärkte Müdigkeit, Schwindel und Magenbeschwerden achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (11, 'enhancement', 'high', 'Mögliche Albträume, Durchfall und verstärkte sedierende Wirkung.', 'CBD hemmt CYP2D6 und CYP2C19, die für den Abbau von Trimipramin wichtig sind.', 'Vorsichtige Dosierung. Bei Albträumen oder starken Nebenwirkungen Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (12, 'neutral', 'low', 'Minimale Wechselwirkung, da Levetiracetam nicht über CYP450 metabolisiert wird.', 'Levetiracetam wird hauptsächlich über die Nieren ausgeschieden, nicht über CYP450-Enzyme.', 'CBD kann in der Regel sicher zusammen mit Levetiracetam eingenommen werden. Dennoch ärztliche Rücksprache empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (13, 'neutral', 'low', 'Geringe direkte Wechselwirkung, aber Vorsicht geboten.', 'Lamotrigin wird hauptsächlich über UGT1A4 metabolisiert, nicht stark von CBD beeinflusst.', 'Überwachung auf mögliche additive sedierende Effekte. Ärztliche Beratung empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (14, 'enhancement', 'high', 'CBD kann die Valproat-Konzentration erhöhen und das Risiko von Leberschäden steigern.', 'CBD hemmt CYP2C9 und könnte den Metabolismus von Valproat beeinflussen.', 'Regelmäßige Leberwertkontrollen erforderlich. Valproat-Spiegel überwachen. Ärztliche Überwachung notwendig.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (15, 'enhancement', 'medium', 'Mögliche Erhöhung der sedativen Effekte.', 'CBD hemmt CYP3A4, das am Metabolismus von Oxcarbazepin beteiligt ist.', 'Auf verstärkte Müdigkeit und Schwindel achten. Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (16, 'enhancement', 'critical', 'CBD hemmt stark den Abbau von Clobazam, was zu erhöhten Blutspiegeln und verstärkten Nebenwirkungen führt.', 'CBD hemmt CYP2C19 und CYP3A4, die Hauptenzyme für den Abbau von Clobazam und seinem aktiven Metaboliten N-Desmethylclobazam.', 'Clobazam-Dosis muss möglicherweise um 50% reduziert werden. Engmaschige ärztliche Überwachung erforderlich. Auf starke Sedierung achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (17, 'enhancement', 'medium', 'Mögliche Durchfall und Übelkeit. Verstärkung der Nebenwirkungen.', 'Pregabalin wird nicht über CYP450 metabolisiert, aber additive Effekte möglich.', 'Niedrige CBD-Dosis empfohlen. Auf gastrointestinale Nebenwirkungen achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (18, 'enhancement', 'low', 'Leichte Verstärkung der entzündungshemmenden Wirkung möglich.', 'CBD hemmt CYP2C9, das am Metabolismus von Ibuprofen beteiligt ist.', 'In der Regel sicher kombinierbar. Bei hohen Dosen auf Magenbeschwerden achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (19, 'enhancement', 'low', 'Möglicherweise leicht erhöhtes Blutungsrisiko.', 'Beide haben blutverdünnende Eigenschaften, aber Aspirin wird nicht primär über CYP450 metabolisiert.', 'Vorsicht bei hohen Dosen. Auf Blutungsneigung achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (20, 'enhancement', 'medium', 'Mögliche Durchfall bei Kombination. Verstärkung der entzündungshemmenden Wirkung.', 'CBD hemmt CYP2C9, das für den Metabolismus von Diclofenac wichtig ist.', 'Bei gastrointestinalen Beschwerden CBD-Dosis reduzieren. Magenschutz in Betracht ziehen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (21, 'enhancement', 'high', 'Erhöhte Sedierung und Atemdepression möglich.', 'CBD hemmt CYP2D6 und CYP3A4, die für den Metabolismus von Tramadol wichtig sind.', 'Vorsicht bei der Kombination. Auf verstärkte Müdigkeit, Schwindel und Atemdepression achten. Ärztliche Überwachung erforderlich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (22, 'enhancement', 'critical', 'Stark erhöhtes Risiko für Atemdepression und Sedierung.', 'CBD hemmt CYP2D6 und CYP3A4. Die Kombination mit Opioiden kann zu gefährlicher Atemdepression führen.', 'Sehr vorsichtige Kombination nur unter engster ärztlicher Aufsicht. Auf Atemdepression, extreme Müdigkeit und Stürze achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (23, 'enhancement', 'low', 'Mögliche Verstärkung der analgetischen Wirkung. Geringe Wechselwirkung.', 'Metamizol wird nicht primär über CYP450 metabolisiert, aber additive Effekte möglich.', 'In der Regel gut verträglich. Bei Magenschmerzen oder Unwohlsein Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-metamizol');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (24, 'enhancement', 'high', 'Verstärkte sedierende Wirkung und erhöhtes Sturzrisiko.', 'Lorazepam wird über UGT2B7 metabolisiert, aber CBD kann die sedative Wirkung additiv verstärken.', 'Niedrige CBD-Dosis empfohlen. Auf verstärkte Schläfrigkeit, Koordinationsprobleme und Sturzgefahr achten. Besonders bei älteren Patienten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (25, 'enhancement', 'high', 'Stark erhöhte Sedierung möglich. Schwäche, Benommenheit und Schwindel.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Diazepam beteiligt sind.', 'Dosisreduktion von Diazepam möglicherweise erforderlich. Auf extreme Müdigkeit und Koordinationsprobleme achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (26, 'enhancement', 'high', 'Erhöhte Schläfrigkeit, Verwirrung und Koordinationsprobleme möglich.', 'CBD hemmt CYP3A4, das am Metabolismus von Clonazepam beteiligt ist.', 'Vorsichtige Kombination. Auf Schwindel, Schläfrigkeit, Verwirrung und Koordinationsschwierigkeiten achten. Besonders bei älteren Patienten erhöhtes Sturzrisiko.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (27, 'enhancement', 'high', 'Herzrasen und Unwohlsein möglich bei Kombination.', 'CBD hemmt CYP3A4, das für den Metabolismus von Bromazepam wichtig ist.', 'Niedrige CBD-Dosis. Bei Herzrasen oder starkem Unwohlsein sofort Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (28, 'enhancement', 'medium', 'Verstärkte sedierende Wirkung möglich.', 'CBD hemmt CYP1A2 und CYP2D6, die am Metabolismus von Olanzapin beteiligt sind.', 'Auf verstärkte Müdigkeit und metabolische Nebenwirkungen achten. Ärztliche Überwachung empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (29, 'enhancement', 'high', 'Herzrasen und Übelkeit möglich. Verstärkung der Nebenwirkungen.', 'CBD hemmt CYP2D6 und CYP3A4, die für den Metabolismus von Aripiprazol wichtig sind.', 'Vorsichtige Dosierung. Bei Herzrasen oder Übelkeit CBD-Dosis reduzieren oder absetzen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (30, 'enhancement', 'medium', 'CBD kann Nebenwirkungen der Statine wie Muskelschmerzen verstärken. Benommenheit möglich.', 'CBD hemmt CYP3A4, das primäre Enzym für den Metabolismus von Atorvastatin.', 'Auf Muskelschmerzen, Schwäche oder dunklen Urin achten. Bei Symptomen sofort Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-cholesterinsenker');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (31, 'enhancement', 'medium', 'Erhöhtes Risiko für Myopathie und Rhabdomyolyse.', 'CBD hemmt CYP3A4, was zu erhöhten Simvastatin-Spiegeln führen kann.', 'Engmaschige Überwachung der Leberwerte und Muskelenzyme. Bei Muskelschmerzen sofort Arzt aufsuchen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-cholesterinsenker');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (32, 'enhancement', 'critical', 'Erhöhtes Risiko für Toxizität und Abstoßungsreaktionen.', 'CBD hemmt CYP3A4, das Hauptenzym für den Metabolismus von Ciclosporin. Dies kann zu stark erhöhten oder erniedrigten Spiegeln führen.', 'Nur unter engster ärztlicher Überwachung kombinieren. Regelmäßige Spiegelkontrollen erforderlich. Bei Transplantationspatienten besondere Vorsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (33, 'enhancement', 'critical', 'Hohes Risiko für Toxizität bei Transplantationspatienten.', 'CBD hemmt CYP3A4, was zu unvorhersehbaren Tacrolimus-Spiegeln führen kann.', 'Nur unter strengster ärztlicher Kontrolle. Regelmäßige Spiegelkontrollen zwingend erforderlich. Abstoßungsrisiko bei Fehlsteuerung.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (34, 'enhancement', 'medium', 'CBD kann die Schilddrüsenhormon-Spiegel beeinflussen. Übelkeit und Durchfall möglich.', 'CBD könnte den Metabolismus von Levothyroxin verändern, Mechanismus noch nicht vollständig verstanden.', 'Regelmäßige Kontrolle der Schilddrüsenwerte (TSH, fT3, fT4). Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-levothyroxin');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (35, 'enhancement', 'medium', 'Mögliche Verstärkung der blutdrucksenkenden Wirkung.', 'Lisinopril wird nicht über CYP450 metabolisiert, aber CBD selbst kann den Blutdruck senken.', 'Regelmäßige Blutdruckkontrolle. Bei zu niedrigem Blutdruck oder Schwindel Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-lisinopril');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (36, 'enhancement', 'medium', 'Übelkeit und Durchfall möglich. Verstärkung der Blutdrucksenkung.', 'CBD beeinflusst CYP2C9, das am Metabolismus von Candesartan beteiligt ist.', 'Blutdruck regelmäßig kontrollieren. Bei Nebenwirkungen CBD-Dosis reduzieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (37, 'enhancement', 'medium', 'Verstärkung der blutdrucksenkenden Wirkung möglich.', 'CBD hemmt CYP3A4, das für den Metabolismus von Amlodipin wichtig ist.', 'Regelmäßige Blutdruckkontrolle. Auf Schwindel und Benommenheit achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (38, 'enhancement', 'medium', 'Allergische Hautreaktionen möglich. Verstärkung der blutdrucksenkenden Wirkung.', 'Valsartan wird nicht primär über CYP450 metabolisiert, aber additive Effekte möglich.', 'Bei allergischen Reaktionen (Hautausschlag, Juckreiz) sofort Arzt konsultieren. Blutdruck überwachen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (39, 'enhancement', 'medium', 'Kreislaufprobleme möglich bei Kombination.', 'CBD hemmt CYP2C19 und CYP3A4, die für den Metabolismus von Omeprazol wichtig sind.', 'Bei Kreislaufproblemen oder Schwindel CBD-Dosis reduzieren. Ärztliche Rücksprache empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-omeprazol');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (40, 'enhancement', 'low', 'Mögliche Verstärkung der Wirkung, aber geringe Wechselwirkung erwartet.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Lansoprazol beteiligt sind.', 'In der Regel gut verträglich. Auf mögliche gastrointestinale Symptome achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-lansoprazol');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (41, 'enhancement', 'low', 'Geringe Wechselwirkung, gut verträglich.', 'CBD hemmt CYP2C19, das primäre Enzym für den Metabolismus von Pantoprazol.', 'Normalerweise unproblematisch. Bei Beschwerden Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-pantoprazol');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (42, 'neutral', 'low', 'Keine direkte Wechselwirkung erwartet, aber CBD kann den Blutzucker beeinflussen.', 'Metformin wird nicht über CYP450 metabolisiert. CBD könnte jedoch den Glukosestoffwechsel beeinflussen.', 'Regelmäßige Blutzuckerkontrolle. Bei Unterzucker-Symptomen Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-metformin');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (43, 'enhancement', 'low', 'Mögliche Beeinflussung des Blutzuckerspiegels.', 'CBD hemmt CYP3A4, das am Metabolismus von Sitagliptin beteiligt ist.', 'Blutzucker regelmäßig überwachen. Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-sitagliptin');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (44, 'neutral', 'low', 'Keine direkte Wechselwirkung erwartet.', 'Salbutamol wird nicht über CYP450 metabolisiert.', 'Normalerweise sicher kombinierbar. Bei Atembeschwerden sofort Arzt aufsuchen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-salbutamol-albuterol');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (45, 'enhancement', 'low', 'Geringe Wechselwirkung möglich.', 'CBD hemmt CYP3A4 und CYP2C9, die am Metabolismus von Montelukast beteiligt sind.', 'In der Regel gut verträglich. Auf Kopfschmerzen oder gastrointestinale Symptome achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-montelukast');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (46, 'enhancement', 'low', 'Mögliche Verstärkung der Kortikosteroid-Wirkung.', 'CBD hemmt CYP3A4, das für den Metabolismus von Fluticason wichtig ist.', 'Normalerweise unproblematisch bei inhalativer Anwendung. Systemische Effekte selten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-fluticason');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (47, 'enhancement', 'medium', 'Magenschmerzen möglich bei Kombination. Beeinflussung der Wirkung.', 'Methylphenidat wird nicht primär über CYP450 metabolisiert, aber Interaktion mit zentralem Nervensystem möglich.', 'Vorsichtige Kombination. Auf Magenbeschwerden, Herzrasen oder Unruhe achten. Ärztliche Überwachung empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-methylphenidat');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (48, 'enhancement', 'low', 'Mögliche Verstärkung der Wirkung, aber geringe Wechselwirkung.', 'CBD hemmt CYP3A4 und CYP2D6, die am Metabolismus von Ranitidin beteiligt sind.', 'Normalerweise gut verträglich. Bei Nebenwirkungen Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-ranitidin');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (49, 'enhancement', 'low', 'Geringe Wechselwirkung möglich bei hohen Dosen.', 'CBD hemmt CYP3A4 und CYP2C8, die am Metabolismus von Loperamid beteiligt sind.', 'In der Regel sicher. Bei sehr hohen CBD-Dosen auf verstärkte Obstipation achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-loperamid');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (50, 'enhancement', 'medium', 'Mögliche Heißhunger, Schlaflosigkeit und Gelenkschmerzen.', 'CBD hemmt CYP3A4 und CYP2A6, die für den Metabolismus von Letrozol wichtig sind.', 'Engmaschige Überwachung bei Krebstherapie. Bei neuen Symptomen sofort Onkologen informieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (51, 'enhancement', 'high', 'CBD hemmt CYP2B6 und kann den Bupropion-Spiegel im Blut erhöhen. Dadurch steigt das Risiko für Nebenwirkungen wie Kopfschmerzen, Schlafstörungen, Reizbarkeit, Tremor und Unruhe. In seltenen Fällen kann die Krampfschwelle sinken.', 'Bupropion wird hauptsächlich über das Enzym CYP2B6 in der Leber verstoffwechselt. CBD hemmt dieses Enzym, wodurch Bupropion langsamer abgebaut wird und sich im Blut anreichern kann.', 'Ärztliche Kontrolle unbedingt erforderlich. Dosisanpassung des Antidepressivums kann notwendig sein. Plan mit besonders langsamer Einschleichphase wird empfohlen. Auf verstärkte Nebenwirkungen achten (Kopfschmerzen, Schlaflosigkeit, Unruhe, Zittern). Bei Krampfanfällen sofort Arzt kontaktieren.', 'Anderson LL et al. (2021) Frontiers in Pharmacology 12:646 | Geffrey AL et al. (2015) Epilepsia 56(8):1246 | FDA Label Elontril (2022)');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (52, 'enhancement', 'high', 'CBD kann die sedierende Wirkung von Zopiclon verstärken und zu erhöhter Schläfrigkeit, Benommenheit und verlängerter Sedierung führen.', 'CBD hemmt CYP3A4 und CYP2C8, die für den Abbau von Zopiclon verantwortlich sind, was zu erhöhten Zopiclon-Spiegeln führt.', 'Ärztliche Beratung vor CBD-Einnahme empfohlen. Beginnen Sie mit niedrigen CBD-Dosen. Beobachten Sie verstärkte Müdigkeit, Benommenheit oder verlängerte Schläfrigkeit am nächsten Morgen.', 'https://www.drugs.com/drug-interactions/cannabidiol.html');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (53, 'enhancement', 'high', 'CBD verstärkt die sedierende Wirkung von Zolpidem. Erhöhtes Risiko für übermäßige Schläfrigkeit, Schwindel und beeinträchtigte Koordination.', 'CBD hemmt CYP3A4 und CYP2C9, die primären Enzyme für den Zolpidem-Metabolismus, was zu erhöhten Zolpidem-Konzentrationen führt.', 'Vorsicht geboten. Dosisanpassung von Zolpidem kann erforderlich sein. Vermeiden Sie Autofahren oder gefährliche Tätigkeiten. Konsultieren Sie vor der Kombination einen Arzt.', 'https://www.drugs.com/drug-interactions/cannabidiol-with-zolpidem-3919-0-2333-0.html');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (54, 'enhancement', 'medium', 'CBD kann die Wirkung von Zaleplon verstärken, was zu erhöhter Schläfrigkeit führen kann.', 'CBD hemmt CYP3A4, ein wichtiges Enzym für den Zaleplon-Stoffwechsel.', 'Überwachen Sie verstärkte Müdigkeitseffekte. Beginnen Sie mit niedrigen CBD-Dosen. Ärztliche Beratung empfohlen.', 'https://www.health.harvard.edu/blog/cbd-and-other-medications-proceed-with-caution-2021011121743');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (55, 'enhancement', 'high', 'CBD verstärkt die sedierende Wirkung von Diazepam deutlich. Erhöhtes Risiko für Sedierung, Atemdepression und Koordinationsstörungen.', 'CBD hemmt CYP2C19 und CYP3A4, die für den Diazepam-Abbau verantwortlich sind, was zu signifikant erhöhten Diazepam-Spiegeln führt.', 'Engmaschige ärztliche Überwachung erforderlich. Dosisreduktion von Diazepam oft notwendig. Überwachen Sie Atemdepression, excessive Sedierung und Koordinationsprobleme.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8298645/');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (56, 'enhancement', 'medium', 'CBD kann die sedierende Wirkung von Lorazepam verstärken.', 'Lorazepam wird hauptsächlich durch Glucuronidierung abgebaut (nicht CYP-abhängig), aber CBD kann die Gesamtsedierung durch additive Effekte erhöhen.', 'Vorsicht bei Kombination. Überwachen Sie verstärkte Schläfrigkeit und Benommenheit. Ärztliche Beratung empfohlen.', 'https://www.health.harvard.edu/blog/cbd-and-other-medications-proceed-with-caution-2021011121743');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (57, 'enhancement', 'medium', 'CBD kann die sedierende Wirkung von Temazepam verstärken.', 'Temazepam wird durch Glucuronidierung abgebaut, aber additive sedierende Effekte mit CBD sind möglich.', 'Überwachen Sie verstärkte Müdigkeit. Beginnen Sie mit niedrigen CBD-Dosen. Konsultieren Sie Ihren Arzt.', 'https://www.mdlinx.com/article/rx-drugs-that-don%27t-mix-with-cbd-thc-and-marijuana/lfc-4695');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (58, 'enhancement', 'high', 'CBD kann die sedierende Wirkung von Nitrazepam deutlich verstärken.', 'CBD hemmt CYP2E1 und CYP3A4, was zu erhöhten Nitrazepam-Spiegeln führt.', 'Ärztliche Überwachung erforderlich. Dosisanpassung kann notwendig sein. Achten Sie auf verlängerte Sedierung am nächsten Morgen (Hangover-Effekt).', 'https://projectcbd.org/safety/cbd-cytochrome-p450/');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (59, 'enhancement', 'critical', 'CBD verstärkt die stark sedierende Wirkung von Flunitrazepam erheblich. Hohes Risiko für gefährliche Atemdepression und Bewusstlosigkeit.', 'CBD hemmt CYP3A4 massiv, das primäre Enzym für Flunitrazepam-Metabolismus.', 'KRITISCH: Kombination sollte vermieden werden. Falls unvermeidbar, nur unter strenger ärztlicher Aufsicht. Erhöhtes Risiko für lebensbedrohliche Atemdepression.', 'https://www.drugs.com/drug-interactions/cannabidiol.html');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (60, 'enhancement', 'high', 'CBD verstärkt die sedierende Wirkung von Triazolam erheblich.', 'CBD hemmt CYP3A4, das primäre Enzym für Triazolam-Abbau, was zu stark erhöhten Triazolam-Konzentrationen führt.', 'Vorsicht geboten. Signifikante Dosisreduktion von Triazolam oft erforderlich. Engmaschige ärztliche Überwachung notwendig.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8298645/');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (61, 'enhancement', 'medium', 'CBD kann die sedierende Wirkung von Lormetazepam verstärken.', 'Lormetazepam wird durch Glucuronidierung abgebaut, aber additive sedierende Effekte sind möglich.', 'Überwachen Sie verstärkte Sedierung. Ärztliche Beratung empfohlen.', 'https://www.health.harvard.edu/blog/cbd-and-other-medications-proceed-with-caution-2021011121743');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (62, 'enhancement', 'high', 'CBD verstärkt die sedierende Wirkung von Brotizolam.', 'CBD hemmt CYP3A4, was zu erhöhten Brotizolam-Spiegeln führt.', 'Dosisanpassung von Brotizolam kann erforderlich sein. Ärztliche Überwachung empfohlen.', 'https://projectcbd.org/safety/cbd-cytochrome-p450/');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (63, 'enhancement', 'medium', 'CBD kann die Konzentration von Daridorexant erhöhen.', 'CBD hemmt CYP3A4 und CYP2C8, die für den Daridorexant-Abbau verantwortlich sind.', 'Überwachen Sie verstärkte Sedierung oder Nebenwirkungen. Dosisanpassung kann erforderlich sein.', 'https://www.mdpi.com/1424-8247/17/5/613');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (64, 'enhancement', 'medium', 'CBD kann die Wirkung von Lemborexant verstärken.', 'CBD hemmt CYP3A4, was zu erhöhten Lemborexant-Spiegeln führen kann.', 'Beginnen Sie mit niedrigen Dosen. Überwachen Sie verstärkte Müdigkeit am nächsten Morgen.', 'https://www.neiglobal.com/default.aspx?tabname=MonthInPsychopharmPost&topic=20919');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (65, 'enhancement', 'medium', 'CBD kann die sedierende Wirkung von Mirtazapin verstärken.', 'CBD hemmt CYP2D6, CYP1A2 und CYP3A4, was zu erhöhten Mirtazapin-Spiegeln führen kann.', 'Überwachen Sie verstärkte Sedierung, Gewichtszunahme oder Mundtrockenheit. Dosisanpassung kann erforderlich sein.', 'https://www.drugs.com/drug-interactions/cannabidiol.html');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (66, 'enhancement', 'medium', 'CBD kann die sedierende Wirkung von Trazodon verstärken.', 'CBD hemmt CYP3A4, was zu erhöhten Trazodon-Spiegeln führt.', 'Vorsicht bei Kombination. Überwachen Sie verstärkte Schläfrigkeit, Schwindel oder niedrigen Blutdruck.', 'https://projectcbd.org/safety/cbd-cytochrome-p450/');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (67, 'enhancement', 'high', 'CBD verstärkt die sedierende Wirkung von Doxepin und erhöht das Risiko für anticholinerge Nebenwirkungen.', 'CBD hemmt CYP2D6 und CYP1A2, was zu erhöhten Doxepin-Spiegeln führt.', 'Ärztliche Überwachung empfohlen. Achten Sie auf verstärkte Müdigkeit, Mundtrockenheit, Verstopfung oder Verwirrtheit.', 'https://www.mdlinx.com/article/rx-drugs-that-don%27t-mix-with-cbd-thc-and-marijuana/lfc-4695');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (68, 'enhancement', 'low', 'CBD kann die sedierende Wirkung von Diphenhydramin leicht verstärken.', 'CBD hemmt CYP2D6, was zu leicht erhöhten Diphenhydramin-Spiegeln führen kann. Additive sedierende Effekte möglich.', 'Überwachen Sie verstärkte Schläfrigkeit. Bei rezeptfreien Präparaten Vorsicht walten lassen.', 'https://www.health.harvard.edu/blog/cbd-and-other-medications-proceed-with-caution-2021011121743');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (69, 'enhancement', 'low', 'CBD kann die sedierende Wirkung von Doxylamin leicht verstärken.', 'CBD hemmt CYP2D6. Additive sedierende Effekte sind möglich.', 'Vorsicht bei Kombination. Beginnen Sie mit niedrigen CBD-Dosen.', 'https://www.drugs.com/drug-interactions/cannabidiol.html');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (70, 'enhancement', 'low', 'CBD kann die Wirkung von Melatonin leicht verstärken. Mögliche Synergie für besseren Schlaf.', 'CBD hemmt CYP1A2, was zu leicht erhöhten Melatonin-Spiegeln führen kann. Beide wirken schlaffördernd.', 'Kombination wird oft als gut verträglich angesehen. Kann sogar synergistische Effekte für besseren Schlaf haben. Beginnen Sie dennoch mit niedrigen Dosen.', 'https://www.healthline.com/health/cbd-and-drug-interactions-what-you-need-to-know');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (71, 'enhancement', 'low', 'CBD und Baldrian können additive sedierende Effekte haben.', 'Beide wirken beruhigend und schlaffördernd. Minimale CYP-Interaktion.', 'Kombination wird oft als unbedenklich angesehen. Überwachen Sie dennoch verstärkte Müdigkeit.', 'https://www.health.harvard.edu/blog/cbd-and-other-medications-proceed-with-caution-2021011121743');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (128, 'enhancement', 'high', 'Stark erhöhtes QT-Zeit-Risiko', 'Clarithromycin ist CYP3A4-Inhibitor, CBD ebenfalls', 'EKG-Kontrolle, Kombination möglichst vermeiden', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (135, 'enhancement', 'high', 'Stark erhöhtes QT-Zeit-Risiko', 'Erythromycin hemmt CYP3A4, CBD ebenfalls', 'Kombination vermeiden oder engmaschige Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (149, 'enhancement', 'high', 'Erhöhtes Thromboserisiko', 'Tamoxifen wird über CYP2D6 und CYP3A4 metabolisiert', 'Engmaschige Überwachung, Onkologe informieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (167, 'enhancement', 'low', 'Mögliche Verstärkung', 'Repaglinid wird über CYP2C8 und CYP3A4 metabolisiert', 'Blutzuckerkontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (170, 'enhancement', 'high', 'Stark erhöhtes Absetzsyndrom-Risiko', 'Paroxetin wird über CYP2D6 metabolisiert, CBD hemmt CYP2D6', 'Sehr langsames Ausschleichen, engmaschige Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (172, 'enhancement', 'high', 'Erhöhte TCA-Spiegel', 'Doxepin wird über CYP2D6 und CYP2C19 metabolisiert', 'TCA-Spiegel überwachen, auf Nebenwirkungen achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (173, 'enhancement', 'high', 'Stark erhöhte TCA-Spiegel', 'Clomipramin wird über CYP2D6, CYP2C19, CYP3A4 metabolisiert', 'Engmaschige Überwachung, TCA-Spiegel messen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (179, 'enhancement', 'high', 'Erhöhte TCA-Spiegel', 'Nortriptylin wird über CYP2D6 metabolisiert', 'TCA-Spiegel überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (180, 'enhancement', 'high', 'Erhöhte TCA-Spiegel', 'Imipramin wird über CYP2D6, CYP2C19 metabolisiert', 'TCA-Spiegel überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (181, 'enhancement', 'critical', 'Stark erhöhtes Atemdepressionsrisiko', 'Morphin: Additive ZNS-Dämpfung mit CBD', 'Nur unter engster ärztlicher Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (182, 'enhancement', 'critical', 'Extrem hohes Atemdepressionsrisiko', 'Fentanyl wird über CYP3A4 metabolisiert, CBD hemmt CYP3A4', 'Kombination möglichst vermeiden', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (183, 'enhancement', 'critical', 'Erhöhte Sedierung und Atemdepression', 'Buprenorphin wird über CYP3A4 metabolisiert', 'Engmaschige Überwachung, Dosisreduktion erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (184, 'enhancement', 'critical', 'Stark erhöhtes Atemdepressionsrisiko', 'Hydrocodon wird über CYP2D6 metabolisiert', 'Nur unter engster ärztlicher Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (185, 'enhancement', 'high', 'Erhöhte Sedierung', 'Tapentadol: Additive ZNS-Dämpfung', 'Vorsichtige Kombination, auf Müdigkeit achten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (192, 'enhancement', 'high', 'Stark erhöhte Nifedipin-Spiegel', 'Nifedipin wird über CYP3A4 metabolisiert', 'Engmaschige Blutdruckkontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (197, 'reduction', 'high', 'CBD-Spiegel werden durch Carbamazepin gesenkt', 'Carbamazepin ist CYP3A4-Induktor', 'Höhere CBD-Dosis erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (198, 'enhancement', 'high', 'Erhöhte Phenytoin-Spiegel', 'Phenytoin wird über CYP2C9, CYP2C19 metabolisiert', 'Phenytoin-Spiegel engmaschig überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (207, 'enhancement', 'high', 'Stark erhöhte Theophyllin-Spiegel', 'Theophyllin wird über CYP1A2, CYP3A4 metabolisiert', 'Theophyllin-Spiegel überwachen, enge therapeutische Breite', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (212, 'enhancement', 'critical', 'Stark erhöhte Sirolimus-Spiegel', 'Sirolimus wird über CYP3A4 metabolisiert', 'Sirolimus-Spiegel engmaschig überwachen, Transplantationspatienten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
VALUES (213, 'enhancement', 'critical', 'Stark erhöhte Everolimus-Spiegel', 'Everolimus wird über CYP3A4 metabolisiert', 'Everolimus-Spiegel engmaschig überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');


-- ========================================================
-- TABLE: medication_cyp_profile (37 entries)
-- ========================================================

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP1A2', 'substrate', 'slower', 'Geringer Anteil über CYP1A2 - trotzdem kritische Interaktion');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP2C9', 'substrate', 'slower', 'S-Warfarin über CYP2C9 - CBD erhöht Blutungsrisiko signifikant');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (1, 'CYP3A4', 'substrate', 'slower', 'R-Warfarin über CYP3A4 - CBD hemmt CYP3A4 stark');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (2, 'CYP2J2', 'substrate', 'slower', 'Teilweise über CYP2J2 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (2, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD erhöht Plasmaspiegel');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (3, 'CYP1A2', 'substrate', 'slower', 'Geringer Anteil über CYP1A2');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (3, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD-Interaktion erhöht Blutungsrisiko');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (4, 'CYP2C19', 'substrate', 'slower', 'PRODRUG - muss über CYP2C19 aktiviert werden. CBD-Hemmung reduziert Wirksamkeit');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (4, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 aktiviert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2C19', 'substrate', 'neutral', 'Teilweise über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2D6', 'substrate', 'neutral', 'Wird über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (5, 'CYP2D6', 'inhibitor', 'slower', 'Starker CYP2D6-Inhibitor - Vorsicht bei Kombination mit anderen CYP2D6-Substraten');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2B6', 'inhibitor', 'slower', 'Schwacher CYP2B6-Inhibitor');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (6, 'CYP2D6', 'substrate', 'neutral', 'Teilweise über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP2D6', 'substrate', 'neutral', 'Geringer CYP2D6-Anteil');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (7, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD hemmt CYP3A4, daher langsamer ausschleichen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (8, 'CYP2D6', 'substrate', 'neutral', 'Wird über CYP2D6 zu aktivem Metabolit O-Desmethylvenlafaxin umgewandelt');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (8, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD-Interaktion möglich');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP1A2', 'substrate', 'neutral', 'Teilweise über CYP1A2 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (9, 'CYP2D6', 'inhibitor', 'slower', 'Schwacher CYP2D6-Inhibitor');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2C19', 'substrate', 'neutral', 'Teilweise über CYP2C19 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 zu Nortriptylin metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP2D6', 'inhibitor', 'slower', 'Schwacher CYP2D6-Inhibitor - Vorsicht bei hohen Dosen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (10, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD kann Spiegel erhöhen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (24, 'UGT', 'substrate', 'faster', 'Wird glucuronidiert (UGT), NICHT über CYP - weniger Interaktion mit CBD');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP2C19', 'substrate', 'neutral', 'Hauptsächlich über CYP2C19 zu aktivem Metabolit');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP2C19', 'inhibitor', 'slower', 'Schwacher CYP2C19-Inhibitor');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (25, 'CYP3A4', 'substrate', 'slower', 'Teilweise über CYP3A4 - CBD kann Spiegel erhöhen');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'CYP1A2', 'substrate', 'neutral', 'Hauptsächlich über CYP1A2 metabolisiert - Rauchen beeinflusst stark');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'CYP2D6', 'substrate', 'neutral', 'Teilweise über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (28, 'UGT', 'substrate', 'faster', 'Teilweise Glucuronidierung - weniger CBD-Interaktion');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP2D6', 'substrate', 'neutral', 'Hauptsächlich über CYP2D6 metabolisiert');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP3A4', 'substrate', 'slower', 'Hauptsächlich über CYP3A4 - CBD erhöht Plasmaspiegel');

INSERT OR IGNORE INTO medication_cyp_profile (medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)
VALUES (29, 'CYP3A4', 'inhibitor', 'slower', 'Schwacher CYP3A4-Inhibitor');


-- ========================================================
-- END OF MASTER SEED FILE
-- ========================================================
-- SUMMARY:
-- - 36 medication_categories
-- - 343 medications
-- - 91 cbd_interactions
-- - 37 medication_cyp_profile entries
-- ========================================================
