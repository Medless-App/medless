-- MEDLESS FINAL PATCH - Evidenzbasierte Medikamente
-- Korrigierte Spaltenstruktur für bestehende Tabelle

BEGIN TRANSACTION;

-- ACE-Hemmer & AT1-Blocker (Category 8: Herz/Kreislauf)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Ramipril', 'Ramipril', 8, 75, 14, 10, 0, 'medium', 'CYP3A4,CYP2C9', 'ACE-Hemmer, lang wirksam. Rebound-Hypertonie bei abruptem Absetzen. Nie ganz absetzen ohne Ersatz.'),
('Captopril', 'Captopril', 8, 65, 2, 15, 0, 'low', 'keine', 'Kurz wirksamer ACE-Hemmer. Schneller Rebound möglich. Häufigere Dosierung erleichtert schrittweise Reduktion.'),
('Telmisartan', 'Telmisartan', 8, 70, 24, 10, 0, 'medium', 'UGT1A3', 'AT1-Blocker, sehr lange HWZ. Sanfteres Absetzen möglich, aber Blutdruckkontrolle essentiell.'),
('Irbesartan', 'Irbesartan', 8, 70, 15, 10, 0, 'medium', 'CYP2C9', 'AT1-Blocker. Rebound-Hypertonie-Risiko. Nur unter ärztlicher Kontrolle reduzieren.');

-- Beta-Blocker
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Atenolol', 'Atenolol', 8, 75, 7, 10, 0, 'low', 'renal', 'Beta-Blocker, renale Elimination. Rebound-Tachykardie/Angina bei abruptem Absetzen. Ausschleichen über 2-4 Wochen.'),
('Propranolol', 'Propranolol', 8, 80, 4, 10, 0, 'high', 'CYP2D6,CYP1A2,CYP2C19', 'Nicht-selektiver Beta-Blocker. Hohes Rebound-Risiko (Angina, Arrhythmien). CBD-Interaktion über CYP2D6 beachten.');

-- Statine (Category 9: Lipidsenker)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Simvastatin', 'Simvastatin', 9, 40, 2, 20, 1, 'high', 'CYP3A4', 'Statin, kurze HWZ. Rebound-Cholesterin moderat. Starke CYP3A4-Interaktion mit CBD.'),
('Atorvastatin', 'Atorvastatin', 9, 40, 14, 20, 1, 'high', 'CYP3A4', 'Statin, lange HWZ. Gutes Absetzprofil. Starke CYP3A4-Interaktion beachten.'),
('Rosuvastatin', 'Rosuvastatin', 9, 40, 19, 20, 1, 'medium', 'CYP2C9,CYP2C19', 'Hydrophiles Statin, weniger CYP-Interaktionen. Gute Absetzbarkeit.'),
('Pravastatin', 'Pravastatin', 9, 35, 2, 20, 1, 'low', 'keine', 'Hydrophiles Statin, keine CYP-Interaktionen. Sehr gut absetzbar.'),
('Fenofibrat', 'Fenofibrat', 9, 35, 20, 20, 1, 'medium', 'UGT,CYP3A4', 'Fibrat. Gut absetzbar, moderates Rebound-Risiko.');

-- Antikoagulanzien (Category 10: Gerinnungshemmer)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Dabigatran', 'Dabigatran', 10, 90, 14, 0, 0, 'critical', 'P-gp', 'DOAK. Hohes Thromboserisiko bei Absetzen. Nie eigenständig absetzen. P-gp-Interaktion mit CBD beachten.'),
('Phenprocoumon', 'Phenprocoumon', 10, 95, 160, 0, 0, 'critical', 'CYP2C9,CYP3A4', 'Vitamin-K-Antagonist, sehr lange HWZ. Höchstes Thromboserisiko. Nur unter INR-Kontrolle umstellen.'),
('Warfarin', 'Warfarin', 10, 95, 40, 0, 0, 'critical', 'CYP2C9,CYP3A4,CYP1A2', 'Vitamin-K-Antagonist. Kritisches Thromboserisiko. Starke CYP-Interaktionen mit CBD.');

-- PPIs (Category 11: Magen/Darm)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Pantoprazol', 'Pantoprazol', 11, 50, 1, 20, 1, 'medium', 'CYP2C19,CYP3A4', 'PPI. Rebound-Säure bei Absetzen häufig. Ausschleichen über 4-8 Wochen empfohlen.'),
('Omeprazol', 'Omeprazol', 11, 50, 1, 20, 1, 'high', 'CYP2C19,CYP3A4', 'PPI. Rebound-Säure häufig. Starker CYP2C19-Inhibitor, Interaktionen mit CBD beachten.'),
('Esomeprazol', 'Esomeprazol', 11, 50, 1.5, 20, 1, 'high', 'CYP2C19,CYP3A4', 'PPI, S-Enantiomer von Omeprazol. Rebound-Säure, langsam ausschleichen.'),
('Lansoprazol', 'Lansoprazol', 11, 50, 1.5, 20, 1, 'high', 'CYP2C19,CYP3A4', 'PPI. Rebound-Säure-Risiko. CYP2C19-Inhibitor, CBD-Interaktion beachten.'),
('Rabeprazol', 'Rabeprazol', 11, 50, 1, 20, 1, 'medium', 'CYP2C19,CYP3A4', 'PPI. Weniger CYP-Interaktionen als andere PPIs. Rebound-Säure trotzdem möglich.');

-- Analgetika/NSAIDs (Category 1: Schmerzmittel)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Metamizol', 'Metamizol', 1, 45, 7, 20, 1, 'low', 'keine', 'Nicht-Opioid-Analgetikum. Agranulozytose-Risiko. Gut absetzbar, keine starke Abhängigkeit.'),
('Acetylsalicylsäure', 'Acetylsalicylsäure', 1, 55, 0.3, 20, 1, 'medium', 'UGT', 'ASS. Bei Kardio-Indikation: Thromboserisiko beachten. Gut absetzbar bei Schmerz-Indikation.'),
('Diclofenac', 'Diclofenac', 1, 60, 2, 20, 1, 'high', 'CYP2C9', 'NSAR. GI/CV/Nierenrisiko. CYP2C9-Interaktion mit CBD. Gut absetzbar.'),
('Naproxen', 'Naproxen', 1, 55, 14, 20, 1, 'medium', 'CYP2C9,CYP1A2', 'NSAR, lange HWZ. GI/CV-Risiko. Langsam ausschleichen bei Langzeitgebrauch.'),
('Indometacin', 'Indometacin', 1, 65, 4.5, 15, 1, 'high', 'CYP2C9,CYP2C19', 'NSAR, hohes GI-Risiko. ZNS-Nebenwirkungen. Vorsichtig ausschleichen.'),
('Meloxicam', 'Meloxicam', 1, 55, 20, 20, 1, 'high', 'CYP2C9,CYP3A4', 'COX-2-selektives NSAR. Lange HWZ. GI/CV-Risiko. CYP-Interaktionen beachten.');

-- Antikonvulsiva (Category 12: Epilepsie/Neuropathie)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Pregabalin', 'Pregabalin', 12, 70, 6, 10, 1, 'low', 'renal', 'Antikonvulsivum. Abhängigkeitsrisiko, Rebound-Angst/Schmerz. Langsam über 4-8 Wochen ausschleichen.'),
('Gabapentin', 'Gabapentin', 12, 65, 6, 10, 1, 'low', 'renal', 'Antikonvulsivum. Entzugssymptome möglich (Angst, Schlafstörung). Über 2-4 Wochen ausschleichen.');

-- Antidepressiva (Category 3)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Citalopram', 'Citalopram', 3, 75, 35, 10, 1, 'high', 'CYP2C19,CYP3A4,CYP2D6', 'SSRI. Absetzsyndrom häufig (Schwindel, Parästhesien). Über 4-8 Wochen ausschleichen. CYP-Interaktionen.'),
('Escitalopram', 'Escitalopram', 3, 75, 30, 10, 1, 'high', 'CYP2C19,CYP3A4,CYP2D6', 'SSRI, S-Enantiomer von Citalopram. Absetzsyndrom ähnlich wie Citalopram.'),
('Fluvoxamin', 'Fluvoxamin', 3, 75, 15, 10, 1, 'critical', 'CYP1A2,CYP2C19,CYP3A4', 'SSRI. Starker CYP-Inhibitor! Kritische CBD-Interaktion. Absetzsyndrom häufig.'),
('Amitriptylin', 'Amitriptylin', 3, 80, 20, 10, 1, 'high', 'CYP2C19,CYP2D6,CYP3A4', 'TCA. Anticholinerge Rebound-Symptome. Kardiotoxizität. Sehr langsam ausschleichen (8-12 Wochen).'),
('Bupropion', 'Bupropion', 3, 65, 21, 15, 1, 'high', 'CYP2B6,CYP2D6(Inhibitor)', 'Atypisches Antidepressivum. Krampfrisiko bei abruptem Absetzen. Über 4 Wochen ausschleichen.'),
('Trazodon', 'Trazodon', 3, 60, 7, 15, 1, 'high', 'CYP3A4,CYP2D6', 'Sedierendes Antidepressivum. Rebound-Insomnie möglich. Langsam ausschleichen.');

-- Antipsychotika (Category 4)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Quetiapin', 'Quetiapin', 4, 85, 7, 10, 0, 'high', 'CYP3A4', 'Atypisches Antipsychotikum. Rebound-Psychose, Insomnie. Sehr langsam über 3-6 Monate ausschleichen.'),
('Risperidon', 'Risperidon', 4, 85, 20, 10, 0, 'high', 'CYP2D6,CYP3A4', 'Atypisches Antipsychotikum. Rebound-Psychose-Risiko. Nur unter psychiatrischer Kontrolle reduzieren.'),
('Clozapin', 'Clozapin', 4, 95, 12, 5, 0, 'critical', 'CYP1A2,CYP3A4,CYP2D6', 'Reserveantipsychotikum. Höchstes Rebound-Risiko. Agranulozytose. Nur unter strenger Kontrolle.'),
('Aripiprazol', 'Aripiprazol', 4, 80, 75, 10, 0, 'high', 'CYP2D6,CYP3A4', 'Atypisches Antipsychotikum, sehr lange HWZ. Rebound-Psychose. Langsam über 2-4 Monate.'),
('Haloperidol', 'Haloperidol', 4, 85, 20, 10, 0, 'high', 'CYP3A4,CYP2D6', 'Typisches Antipsychotikum. Extrapyramidale Symptome, Rebound-Psychose. Sehr vorsichtig reduzieren.');

-- Benzodiazepine (Category 5)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Diazepam', 'Diazepam', 5, 85, 48, 10, 1, 'high', 'CYP2C19,CYP3A4', 'Langwirksames Benzodiazepin. Abhängigkeit, Krampfrisiko. Sehr langsam über 8-16 Wochen ausschleichen.'),
('Lorazepam', 'Lorazepam', 5, 85, 14, 10, 1, 'medium', 'UGT', 'Mittellangwirksames Benzodiazepin. Abhängigkeit, Rebound-Angst. Über 6-12 Wochen ausschleichen.'),
('Alprazolam', 'Alprazolam', 5, 90, 12, 5, 1, 'critical', 'CYP3A4', 'Kurzwirksames Benzodiazepin. Höchste Abhängigkeit. Krampfrisiko. Sehr langsam ausschleichen (12-24 Wochen).'),
('Midazolam', 'Midazolam', 5, 75, 3, 15, 1, 'critical', 'CYP3A4', 'Sehr kurzwirksames Benzodiazepin. Meist nur akut. Starke CYP3A4-Interaktion mit CBD.');

-- Z-Substanzen (Category 6)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Zolpidem', 'Zolpidem', 6, 75, 2.5, 15, 1, 'high', 'CYP3A4,CYP2C9,CYP1A2', 'Z-Substanz. Abhängigkeit, Rebound-Insomnie. Über 4-8 Wochen ausschleichen. CYP3A4-Interaktion.'),
('Zopiclon', 'Zopiclon', 6, 75, 5, 15, 1, 'high', 'CYP3A4,CYP2C8', 'Z-Substanz. Ähnliches Profil wie Zolpidem. Rebound-Insomnie. Langsam ausschleichen.');

-- Laxantien (Category 13: Laxantien)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Lactulose', 'Lactulose', 13, 25, 2, 25, 1, 'low', 'keine', 'Osmotisches Laxans. Gut absetzbar. Rebound-Verstopfung mild. Keine systemischen Interaktionen.'),
('Natriumpicosulfat', 'Natriumpicosulfat', 13, 35, 16, 20, 1, 'low', 'intestinal', 'Stimulierendes Laxans. Rebound-Verstopfung möglich. Über 2-4 Wochen ausschleichen.'),
('Senna', 'Senna', 13, 35, 12, 20, 1, 'low', 'intestinal', 'Pflanzliches Stimulans. Rebound-Verstopfung, Darmträgheit. Langsam reduzieren.'),
('Prucaloprid', 'Prucaloprid', 13, 35, 24, 20, 1, 'low', 'keine', 'Prokinetikum. Gut absetzbar. Rebound-Verstopfung moderat.'),
('Linaclotid', 'Linaclotid', 13, 30, 0.2, 25, 1, 'low', 'keine', 'Guanylat-Cyclase-Agonist. Sehr gut absetzbar. Lokale Wirkung, keine systemischen Interaktionen.');

-- CED-Medikamente (Category 14: CED)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Mesalazin', 'Mesalazin', 14, 50, 1, 15, 0, 'low', 'Acetyltransferase', 'Aminosalicylat für CED. Schubrisiko bei Absetzen. Langsam über 4-8 Wochen reduzieren.'),
('Budesonid', 'Budesonid (enteral)', 7, 65, 3, 15, 0, 'medium', 'CYP3A4', 'Enterales Glukokortikoid für CED. NNR-Suppression möglich. Langsam ausschleichen.');

-- Immunsuppressiva (Category 15: Immunsuppressiva)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Azathioprin', 'Azathioprin', 15, 80, 5, 10, 0, 'medium', 'TPMT', 'Immunsuppressivum. Rejection-/Schubrisiko. Nur unter Facharzt-Kontrolle reduzieren.'),
('Ciclosporin', 'Ciclosporin', 15, 95, 8, 5, 0, 'critical', 'CYP3A4,P-gp', 'Calcineurin-Inhibitor. Höchstes Rejection-Risiko. Starke CYP3A4/P-gp-Interaktionen. Spiegel-Monitoring!'),
('Tacrolimus', 'Tacrolimus', 15, 95, 12, 5, 0, 'critical', 'CYP3A4,CYP3A5,P-gp', 'Calcineurin-Inhibitor. Transplant: nie eigenständig reduzieren. Kritische CBD-Interaktion, Spiegel-Monitoring!'),
('Mycophenolat-Mofetil', 'Mycophenolat-Mofetil', 15, 85, 18, 10, 0, 'medium', 'UGT', 'Immunsuppressivum. Rejection-/Schubrisiko. Nur unter Transplant-/Rheuma-Facharzt reduzieren.');

-- Osteoporose-Medikamente (Category 16: Osteoporose)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Zoledronat', 'Zoledronat', 16, 60, 168, 0, 1, 'low', 'renal', 'Bisphosphonat, jährliche Infusion. Rebound-Frakturen nach Jahren möglich. Keine CYP-Interaktionen.'),
('Ibandronat', 'Ibandronat', 16, 55, 120, 0, 1, 'low', 'renal', 'Bisphosphonat. Rebound-Frakturen moderat. Gut absetzbar nach 3-5 Jahren Therapie.'),
('Risedronat', 'Risedronat', 16, 55, 480, 0, 1, 'low', 'renal', 'Bisphosphonat, sehr lange Knochenhalbwertszeit. Rebound-Risiko gering nach Langzeittherapie.'),
('Teriparatid', 'Teriparatid', 16, 70, 1, 0, 1, 'low', 'keine', 'Parathormon-Analogon. Rebound-Knochenverlust nach Absetzen. Anschlusstherapie mit Bisphosphonat nötig.');

-- Antihistaminika (Category 17: Antihistaminika)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Cetirizin', 'Cetirizin', 17, 25, 8, 25, 1, 'low', 'gering', 'H1-Antihistaminikum. Sehr gut absetzbar. Rebound-Pruritus selten.'),
('Loratadin', 'Loratadin', 17, 25, 8, 25, 1, 'medium', 'CYP3A4,CYP2D6', 'H1-Antihistaminikum. Gut absetzbar. Keine nennenswerten Absetzprobleme.'),
('Desloratadin', 'Desloratadin', 17, 25, 27, 25, 1, 'medium', 'CYP3A4,CYP2D6', 'H1-Antihistaminikum, aktiver Metabolit von Loratadin. Sehr gut absetzbar.'),
('Levocetirizin', 'Levocetirizin', 17, 25, 8, 25, 1, 'low', 'gering', 'H1-Antihistaminikum, R-Enantiomer. Sehr gut absetzbar. Keine Absetzprobleme.'),
('Fexofenadin', 'Fexofenadin', 17, 25, 14, 25, 1, 'low', 'P-gp', 'H1-Antihistaminikum. Keine CYP-Interaktionen. Sehr gut absetzbar.'),
('Hydroxyzin', 'Hydroxyzin', 17, 45, 20, 20, 1, 'high', 'CYP3A4,CYP2D6', 'H1-Antihistaminikum, sedierend. Rebound-Angst/Pruritus möglich. Über 2-4 Wochen ausschleichen.');

-- Antimykotika (Category 18: Antimykotika)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Itraconazol', 'Itraconazol', 18, 45, 24, 15, 1, 'critical', 'CYP3A4(Inhibitor/Substrat)', 'Azol-Antimykotikum. Starker CYP3A4-Inhibitor! Kritische CBD-Interaktion. Bei Therapieende gut absetzbar.'),
('Voriconazol', 'Voriconazol', 18, 45, 6, 15, 1, 'critical', 'CYP2C19,CYP2C9,CYP3A4', 'Azol-Antimykotikum. Starker CYP-Inhibitor. Kritische Interaktionen. Nach Therapie gut absetzbar.'),
('Terbinafin', 'Terbinafin', 18, 35, 200, 20, 1, 'high', 'CYP2D6(Inhibitor)', 'Allylamin-Antimykotikum. Sehr lange HWZ. Starker CYP2D6-Inhibitor. Nach Therapie gut absetzbar.');

-- Virostatika (Category 19: Virostatika)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Valaciclovir', 'Valaciclovir', 19, 25, 3, 25, 1, 'low', 'keine', 'Virostatikum (Herpes). Prodrug von Aciclovir. Sehr gut absetzbar nach Therapie. Keine CYP-Interaktionen.'),
('Oseltamivir', 'Oseltamivir', 19, 25, 7, 25, 1, 'low', 'Esterasen', 'Neuraminidase-Inhibitor (Influenza). Sehr gut absetzbar nach Therapie. Keine CYP-Interaktionen.');

-- Update existierendes Ibuprofen
UPDATE medications 
SET 
  withdrawal_risk_score = 55,
  half_life_hours = 2,
  max_weekly_reduction_pct = 20,
  can_reduce_to_zero = 1,
  cbd_interaction_strength = 'medium',
  cyp450_enzyme = 'CYP2C9',
  description = 'NSAR. GI/Nieren/CV-Risiko bei Langzeitgebrauch. Gut absetzbar. CYP2C9-Interaktion mit CBD beachten.'
WHERE name = 'Ibuprofen';

COMMIT;
