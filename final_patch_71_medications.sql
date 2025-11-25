-- ============================================================
-- MEDLESS FINAL PATCH: 71 neue Wirkstoffe
-- ============================================================
-- Schema: name, generic_name, category_id, withdrawal_risk_score, 
--         half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, 
--         cbd_interaction_strength, cyp450_enzyme, description

-- ============================================================
-- ACE-Hemmer & AT1-Blocker (Category: Blutdrucksenker = 11)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Ramipril', 'Ramipril', 11, 7, 15, 10, 0, 3, 'CYP3A4', 'ACE-Hemmer gegen Bluthochdruck. Langsam ausschleichen wegen Rebound-Hypertonie.'),
('Captopril', 'Captopril', 11, 7, 2, 10, 0, 2, NULL, 'Kurz wirksamer ACE-Hemmer. Schnelle Ausscheidung, aber hohes Absetzrisiko.'),
('Telmisartan', 'Telmisartan', 11, 7, 24, 10, 0, 3, 'CYP2C9', 'AT1-Blocker mit langer HWZ. Langsames Ausschleichen erforderlich.'),
('Irbesartan', 'Irbesartan', 11, 7, 14, 10, 0, 3, 'CYP2C9', 'AT1-Blocker. Moderate HWZ, Rebound-Risiko bei plötzlichem Absetzen.');

-- ============================================================
-- Beta-Blocker (Category: Blutdrucksenker = 11)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Atenolol', 'Atenolol', 11, 8, 7, 10, 0, 2, NULL, 'Hydrophiler Beta-Blocker. Renale Elimination. Ausschleichen wegen Rebound-Tachykardie.'),
('Propranolol', 'Propranolol', 11, 8, 4, 10, 0, 5, 'CYP2D6, CYP1A2', 'Lipophiler Beta-Blocker. Starke CYP-Interaktion mit CBD. Langsam ausschleichen.');

-- ============================================================
-- Statine (Category: Statine = 6)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Simvastatin', 'Simvastatin', 6, 5, 2, 15, 1, 6, 'CYP3A4', 'Statin mit kurzer HWZ. Starke CYP3A4-Interaktion. Vorsicht bei CBD.'),
('Atorvastatin', 'Atorvastatin', 6, 5, 14, 15, 1, 6, 'CYP3A4', 'Statin mit langer HWZ. Starke CYP3A4-Interaktion mit CBD.'),
('Rosuvastatin', 'Rosuvastatin', 6, 5, 19, 15, 1, 3, 'CYP2C9', 'Statin mit geringerer CYP-Interaktion als Atorvastatin.'),
('Pravastatin', 'Pravastatin', 6, 5, 2, 15, 1, 2, NULL, 'Hydrophiles Statin. Keine relevanten CYP-Interaktionen mit CBD.'),
('Fenofibrat', 'Fenofibrat', 6, 5, 20, 15, 1, 4, 'CYP3A4, UGT', 'Fibrat zur Lipidsenkung. Moderate CBD-Interaktion über UGT.');

-- ============================================================
-- Antikoagulantien (Category: Antikoagulantien = 10)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Dabigatran', 'Dabigatran', 10, 10, 14, 5, 0, 4, 'P-gp', 'Direkter Thrombin-Inhibitor. DOAK. Hohes Thromboserisiko bei Absetzen.'),
('Phenprocoumon', 'Phenprocoumon', 10, 10, 160, 5, 0, 7, 'CYP2C9, CYP3A4', 'Vitamin-K-Antagonist. Sehr lange HWZ. Starke CBD-Interaktion.'),
('Warfarin', 'Warfarin', 10, 10, 40, 5, 0, 7, 'CYP2C9, CYP3A4', 'Vitamin-K-Antagonist. Starke CYP-Interaktion mit CBD.');

-- ============================================================
-- Protonenpumpenhemmer (Category: Protonenpumpenhemmer = 12)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Pantoprazol', 'Pantoprazol', 12, 6, 1, 20, 1, 4, 'CYP2C19', 'PPI mit kurzer HWZ. Rebound-Säuresekretion bei Absetzen. Jeden-zweiten-Tag-Methode empfohlen.'),
('Omeprazol', 'Omeprazol', 12, 6, 1, 20, 1, 5, 'CYP2C19, CYP3A4', 'PPI mit starker CYP-Interaktion. Rebound-Effekt häufig.'),
('Esomeprazol', 'Esomeprazol', 12, 6, 1, 20, 1, 5, 'CYP2C19', 'S-Enantiomer von Omeprazol. Ähnliche Rebound-Problematik.'),
('Lansoprazol', 'Lansoprazol', 12, 6, 1.5, 20, 1, 5, 'CYP2C19, CYP3A4', 'PPI mit kurzer HWZ. Starke CYP-Interaktion.'),
('Rabeprazol', 'Rabeprazol', 12, 6, 1, 20, 1, 4, 'CYP2C19', 'PPI mit kurzer HWZ. Moderate CYP-Interaktion.');

-- ============================================================
-- Schmerzmittel & NSAIDs (Category: Schmerzmittel = 4)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Metamizol', 'Metamizol', 4, 4, 3, 20, 1, 3, 'CYP2C9', 'Nicht-opioides Analgetikum. Risiko: Agranulozytose. Moderate CBD-Interaktion.'),
('Acetylsalicylsäure', 'Acetylsalicylsäure', 4, 5, 0.3, 15, 1, 3, 'UGT', 'ASS als Schmerzmittel/Thrombozytenaggregationshemmer. Kurze HWZ.'),
('Diclofenac', 'Diclofenac', 4, 5, 2, 15, 1, 5, 'CYP2C9', 'NSAID mit starker CYP2C9-Interaktion mit CBD.'),
('Naproxen', 'Naproxen', 4, 5, 14, 15, 1, 4, 'CYP2C9', 'NSAID mit langer HWZ. Moderate CYP-Interaktion.'),
('Indometacin', 'Indometacin', 4, 5, 4, 15, 1, 4, 'CYP2C9', 'Starkes NSAID. Moderate CBD-Interaktion.'),
('Meloxicam', 'Meloxicam', 4, 5, 20, 15, 1, 4, 'CYP2C9', 'NSAID mit langer HWZ. Moderate CYP-Interaktion.');

-- ============================================================
-- Antiepileptika (Category: Antiepileptika = 3)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Pregabalin', 'Pregabalin', 3, 7, 6, 10, 1, 3, NULL, 'Gabapentinoid. Renale Elimination. Entzugserscheinungen bei raschem Absetzen.'),
('Gabapentin', 'Gabapentin', 3, 7, 6, 10, 1, 2, NULL, 'Gabapentinoid. Keine CYP-Interaktion. Langsam ausschleichen.');

-- ============================================================
-- Antidepressiva (Category: Antidepressiva = 2)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Citalopram', 'Citalopram', 2, 8, 35, 10, 1, 5, 'CYP2C19, CYP3A4', 'SSRI mit moderater HWZ. Absetzsyndrom bei raschem Stopp.'),
('Escitalopram', 'Escitalopram', 2, 8, 30, 10, 1, 5, 'CYP2C19', 'S-Enantiomer von Citalopram. Ähnliches Absetzrisiko.'),
('Fluvoxamin', 'Fluvoxamin', 2, 8, 15, 10, 1, 7, 'CYP1A2, CYP2D6, CYP3A4', 'SSRI mit starken CYP-Interaktionen. Hohe CBD-Interaktion.'),
('Amitriptylin', 'Amitriptylin', 2, 8, 20, 10, 1, 6, 'CYP2C19, CYP2D6, CYP3A4', 'Trizyklisches Antidepressivum. Starke CYP-Interaktion.'),
('Bupropion', 'Bupropion', 2, 7, 20, 10, 1, 5, 'CYP2B6, CYP2D6', 'NDRI-Antidepressivum. Moderate CBD-Interaktion.'),
('Trazodon', 'Trazodon', 2, 7, 7, 10, 1, 6, 'CYP3A4', 'Sedierendes Antidepressivum. Starke CYP3A4-Interaktion.');

-- ============================================================
-- Antipsychotika (Category: Antipsychotika = 18)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Quetiapin', 'Quetiapin', 18, 8, 7, 10, 1, 6, 'CYP3A4', 'Atypisches Antipsychotikum. Starke CYP3A4-Interaktion mit CBD.'),
('Risperidon', 'Risperidon', 18, 8, 20, 10, 1, 5, 'CYP2D6', 'Atypisches Antipsychotikum. Moderate CBD-Interaktion.'),
('Clozapin', 'Clozapin', 18, 9, 12, 5, 0, 7, 'CYP1A2, CYP3A4', 'Hochpotentes Antipsychotikum. Starke CYP-Interaktion. Nicht abrupt absetzen.'),
('Aripiprazol', 'Aripiprazol', 18, 7, 75, 10, 1, 5, 'CYP2D6, CYP3A4', 'Atypisches Antipsychotikum mit sehr langer HWZ.'),
('Haloperidol', 'Haloperidol', 18, 8, 20, 10, 1, 4, 'CYP3A4, CYP2D6', 'Typisches Antipsychotikum. Moderate CBD-Interaktion.');

-- ============================================================
-- Benzodiazepine (Category: Benzodiazepine = 16)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Diazepam', 'Diazepam', 16, 9, 48, 10, 1, 6, 'CYP2C19, CYP3A4', 'Langwirksames Benzodiazepin. Starke CYP-Interaktion mit CBD.'),
('Lorazepam', 'Lorazepam', 16, 9, 12, 10, 1, 3, 'UGT', 'Mittellang wirksam. Weniger CYP-Interaktion als Diazepam.'),
('Alprazolam', 'Alprazolam', 16, 9, 12, 10, 1, 7, 'CYP3A4', 'Kurz- bis mittellang wirksam. Starke CYP3A4-Interaktion.'),
('Midazolam', 'Midazolam', 16, 8, 2, 15, 1, 7, 'CYP3A4', 'Kurz wirksam. Sehr starke CYP3A4-Interaktion mit CBD.');

-- ============================================================
-- Z-Substanzen (Category: Z-Substanzen = 17)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Zolpidem', 'Zolpidem', 17, 8, 2.5, 10, 1, 6, 'CYP3A4', 'Z-Substanz. Kurze HWZ. Starke CYP3A4-Interaktion.'),
('Zopiclon', 'Zopiclon', 17, 8, 5, 10, 1, 6, 'CYP3A4', 'Z-Substanz. Moderate HWZ. Starke CYP3A4-Interaktion.');

-- ============================================================
-- Laxantien (Category: Laxantien = 19)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Lactulose', 'Lactulose', 19, 3, 2, 20, 1, 1, NULL, 'Osmotisches Laxans. Keine CYP-Interaktion. Geringes Absetzrisiko.'),
('Natriumpicosulfat', 'Natriumpicosulfat', 19, 4, 1, 20, 1, 2, NULL, 'Stimulierendes Laxans. Rebound-Obstipation bei chronischer Einnahme.'),
('Senna', 'Senna', 19, 4, 1, 20, 1, 2, NULL, 'Pflanzliches Laxans. Rebound-Risiko bei Dauergebrauch.'),
('Prucaloprid', 'Prucaloprid', 19, 4, 24, 15, 1, 3, 'CYP3A4', 'Prokinetikum. Moderate CYP-Interaktion.'),
('Linaclotid', 'Linaclotid', 19, 3, 0.5, 20, 1, 1, NULL, 'GC-C-Agonist. Minimale systemische Absorption. Keine CBD-Interaktion.');

-- ============================================================
-- CED-Medikamente (Category: CED-Medikamente = 20)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Mesalazin', 'Mesalazin', 20, 5, 1, 15, 1, 2, NULL, '5-ASA für CED. Kurze HWZ. Geringe CBD-Interaktion.'),
('Budesonid', 'Budesonid', 20, 6, 3, 15, 1, 5, 'CYP3A4', 'Lokales Steroid für CED. Starke CYP3A4-Interaktion.');

-- ============================================================
-- Immunsuppressiva (Category: Immunsuppressiva = 8)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Azathioprin', 'Azathioprin', 8, 8, 5, 10, 0, 3, NULL, 'Immunsuppressivum. Enzymatisch metabolisiert. Moderate CBD-Interaktion.'),
('Ciclosporin', 'Ciclosporin', 8, 9, 8, 5, 0, 8, 'CYP3A4', 'Starkes Immunsuppressivum. Sehr starke CYP3A4-Interaktion mit CBD.'),
('Tacrolimus', 'Tacrolimus', 8, 9, 12, 5, 0, 8, 'CYP3A4', 'Starkes Immunsuppressivum. Sehr starke CYP3A4-Interaktion.'),
('Mycophenolat-Mofetil', 'Mycophenolat', 8, 8, 18, 10, 0, 4, 'UGT', 'Immunsuppressivum. Moderate CBD-Interaktion über UGT.');

-- ============================================================
-- Osteoporose-Medikamente (Category: Osteoporose-Medikamente = 21)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Zoledronat', 'Zoledronat', 21, 6, 146, 10, 1, 2, NULL, 'Bisphosphonat. Sehr lange HWZ. Keine CYP-Interaktion.'),
('Ibandronat', 'Ibandronat', 21, 6, 50, 10, 1, 2, NULL, 'Bisphosphonat. Lange HWZ. Keine CYP-Interaktion.'),
('Risedronat', 'Risedronat', 21, 6, 480, 10, 1, 2, NULL, 'Bisphosphonat. Extrem lange Skelett-HWZ. Keine CYP-Interaktion.'),
('Teriparatid', 'Teriparatid', 21, 7, 1, 10, 0, 2, NULL, 'PTH-Analogon. Kurze HWZ. Nicht abrupt absetzen.');

-- ============================================================
-- Antihistaminika (Category: Antihistaminika = 22)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Cetirizin', 'Cetirizin', 22, 3, 8, 20, 1, 2, NULL, 'H1-Antagonist. Renale Elimination. Geringe CBD-Interaktion.'),
('Loratadin', 'Loratadin', 22, 3, 8, 20, 1, 4, 'CYP3A4, CYP2D6', 'H1-Antagonist. Moderate CYP-Interaktion.'),
('Desloratadin', 'Desloratadin', 22, 3, 27, 20, 1, 4, 'CYP3A4', 'Aktiver Metabolit von Loratadin. Moderate CYP-Interaktion.'),
('Levocetirizin', 'Levocetirizin', 22, 3, 8, 20, 1, 2, NULL, 'R-Enantiomer von Cetirizin. Geringe CBD-Interaktion.'),
('Fexofenadin', 'Fexofenadin', 22, 3, 14, 20, 1, 3, 'P-gp', 'H1-Antagonist. Geringe CYP-, moderate P-gp-Interaktion.'),
('Hydroxyzin', 'Hydroxyzin', 22, 5, 20, 15, 1, 5, 'CYP3A4', 'Sedierendes Antihistaminikum. Starke CYP3A4-Interaktion.');

-- ============================================================
-- Antimykotika (Category: Antimykotika = 23)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Itraconazol', 'Itraconazol', 23, 5, 24, 15, 1, 7, 'CYP3A4', 'Azol-Antimykotikum. Starke CYP3A4-Interaktion (Inhibitor).'),
('Voriconazol', 'Voriconazol', 23, 6, 6, 15, 1, 7, 'CYP2C19, CYP3A4', 'Azol-Antimykotikum. Sehr starke CYP-Interaktion.'),
('Terbinafin', 'Terbinafin', 23, 4, 300, 15, 1, 4, 'CYP2D6', 'Allylamin-Antimykotikum. Sehr lange HWZ. Moderate CBD-Interaktion.');

-- ============================================================
-- Virostatika (Category: Virostatika = 24)
-- ============================================================
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES 
('Valaciclovir', 'Valaciclovir', 24, 3, 3, 20, 1, 1, NULL, 'Prodrug von Aciclovir. Kurze HWZ. Keine CYP-Interaktion.'),
('Oseltamivir', 'Oseltamivir', 24, 3, 8, 20, 1, 2, NULL, 'Neuraminidase-Hemmer. Renale Elimination. Geringe CBD-Interaktion.');

-- ============================================================
-- ENDE DES PATCHES
-- ============================================================
