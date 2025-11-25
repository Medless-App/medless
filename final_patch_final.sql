-- ===================================================================
-- MEDLESS FINAL PATCH - 71 Medikamente
-- Evidenzbasierte pharmakologische Daten
-- ===================================================================

-- ACE-Hemmer & AT1-Blocker
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Ramipril', 'Ramipril', 8, 7, 75, 14, 10, 0, 'medium', 'CYP3A4,CYP2C9(Substrat)', 'ACE-Hemmer, lang wirksam. Rebound-Hypertonie bei abruptem Absetzen. Nie ganz absetzen ohne Ersatz.'),
('Captopril', 'Captopril', 8, 6, 65, 2, 15, 0, 'low', 'keine CYP', 'Kurz wirksamer ACE-Hemmer. Schneller Rebound möglich. Häufigere Dosierung erleichtert schrittweise Reduktion.'),
('Telmisartan', 'Telmisartan', 8, 7, 70, 24, 10, 0, 'medium', 'UGT1A3(Substrat)', 'AT1-Blocker, sehr lange HWZ. Sanfteres Absetzen möglich, aber Blutdruckkontrolle essentiell.'),
('Irbesartan', 'Irbesartan', 8, 7, 70, 15, 10, 0, 'medium', 'CYP2C9(Substrat)', 'AT1-Blocker. Rebound-Hypertonie-Risiko. Nur unter ärztlicher Kontrolle reduzieren.');

-- Beta-Blocker
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Atenolol', 'Atenolol', 8, 7, 75, 7, 10, 0, 'low', 'keine CYP(renal)', 'Beta-Blocker, renale Elimination. Rebound-Tachykardie/Angina bei abruptem Absetzen. Ausschleichen über 2-4 Wochen.'),
('Propranolol', 'Propranolol', 8, 8, 80, 4, 10, 0, 'high', 'CYP2D6,CYP1A2,CYP2C19(Substrat)', 'Nicht-selektiver Beta-Blocker. Hohes Rebound-Risiko (Angina, Arrhythmien). CBD-Interaktion über CYP2D6 beachten.');

-- Statine
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Simvastatin', 'Simvastatin', 9, 4, 40, 2, 20, 1, 'high', 'CYP3A4(Substrat)', 'Statin, kurze HWZ. Rebound-Cholesterin moderat. Starke CYP3A4-Interaktion mit CBD.'),
('Atorvastatin', 'Atorvastatin', 9, 4, 40, 14, 20, 1, 'high', 'CYP3A4(Substrat)', 'Statin, lange HWZ. Gutes Absetzprofil. Starke CYP3A4-Interaktion beachten.'),
('Rosuvastatin', 'Rosuvastatin', 9, 4, 40, 19, 20, 1, 'medium', 'CYP2C9,CYP2C19(gering)', 'Hydrophiles Statin, weniger CYP-Interaktionen. Gute Absetzbarkeit.'),
('Pravastatin', 'Pravastatin', 9, 3, 35, 2, 20, 1, 'low', 'keine CYP', 'Hydrophiles Statin, keine CYP-Interaktionen. Sehr gut absetzbar.'),
('Fenofibrat', 'Fenofibrat', 9, 4, 35, 20, 20, 1, 'medium', 'UGT,CYP3A4(gering)', 'Fibrat. Gut absetzbar, moderates Rebound-Risiko.');

-- Antikoagulanzien
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Dabigatran', 'Dabigatran', 10, 9, 90, 14, 0, 0, 'critical', 'P-gp(Substrat)', 'DOAK. Hohes Thromboserisiko bei Absetzen. Nie eigenständig absetzen. P-gp-Interaktion mit CBD beachten.'),
('Phenprocoumon', 'Phenprocoumon', 10, 9, 95, 160, 0, 0, 'critical', 'CYP2C9,CYP3A4(Substrat)', 'Vitamin-K-Antagonist, sehr lange HWZ. Höchstes Thromboserisiko. Nur unter INR-Kontrolle umstellen.'),
('Warfarin', 'Warfarin', 10, 9, 95, 40, 0, 0, 'critical', 'CYP2C9,CYP3A4,CYP1A2(Substrat)', 'Vitamin-K-Antagonist. Kritisches Thromboserisiko. Starke CYP-Interaktionen mit CBD.');

-- Protonenpumpenhemmer (PPIs)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Pantoprazol', 'Pantoprazol', 11, 5, 50, 1, 20, 1, 'medium', 'CYP2C19,CYP3A4(Substrat/Inhibitor)', 'PPI. Rebound-Säure bei Absetzen häufig. Ausschleichen über 4-8 Wochen empfohlen.'),
('Omeprazol', 'Omeprazol', 11, 5, 50, 1, 20, 1, 'high', 'CYP2C19,CYP3A4(Substrat/Inhibitor)', 'PPI. Rebound-Säure häufig. Starker CYP2C19-Inhibitor, Interaktionen mit CBD beachten.'),
('Esomeprazol', 'Esomeprazol', 11, 5, 50, 1.5, 20, 1, 'high', 'CYP2C19,CYP3A4(Substrat/Inhibitor)', 'PPI, S-Enantiomer von Omeprazol. Rebound-Säure, langsam ausschleichen.'),
('Lansoprazol', 'Lansoprazol', 11, 5, 50, 1.5, 20, 1, 'high', 'CYP2C19,CYP3A4(Substrat/Inhibitor)', 'PPI. Rebound-Säure-Risiko. CYP2C19-Inhibitor, CBD-Interaktion beachten.'),
('Rabeprazol', 'Rabeprazol', 11, 5, 50, 1, 20, 1, 'medium', 'CYP2C19,CYP3A4(gering)', 'PPI. Weniger CYP-Interaktionen als andere PPIs. Rebound-Säure trotzdem möglich.');

-- Analgetika/NSAIDs
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Metamizol', 'Metamizol', 1, 5, 45, 7, 20, 1, 'low', 'keine CYP(Hydrolyse)', 'Nicht-Opioid-Analgetikum. Agranulozytose-Risiko. Gut absetzbar, keine starke Abhängigkeit.'),
('Acetylsalicylsäure', 'Acetylsalicylsäure', 1, 6, 55, 0.3, 20, 1, 'medium', 'UGT(Konjugation)', 'ASS. Bei Kardio-Indikation: Thromboserisiko beachten. Gut absetzbar bei Schmerz-Indikation.'),
-- Ibuprofen bereits vorhanden, wird aktualisiert
('Diclofenac', 'Diclofenac', 1, 6, 60, 2, 20, 1, 'high', 'CYP2C9(Substrat)', 'NSAR. GI/CV/Nierenrisiko. CYP2C9-Interaktion mit CBD. Gut absetzbar.'),
('Naproxen', 'Naproxen', 1, 6, 55, 14, 20, 1, 'medium', 'CYP2C9,CYP1A2(Substrat)', 'NSAR, lange HWZ. GI/CV-Risiko. Langsam ausschleichen bei Langzeitgebrauch.'),
('Indometacin', 'Indometacin', 1, 7, 65, 4.5, 15, 1, 'high', 'CYP2C9,CYP2C19(Substrat)', 'NSAR, hohes GI-Risiko. ZNS-Nebenwirkungen. Vorsichtig ausschleichen.'),
('Meloxicam', 'Meloxicam', 1, 6, 55, 20, 20, 1, 'high', 'CYP2C9,CYP3A4(Substrat)', 'COX-2-selektives NSAR. Lange HWZ. GI/CV-Risiko. CYP-Interaktionen beachten.');

-- Antikonvulsiva/Neuropathische Schmerzmittel
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Pregabalin', 'Pregabalin', 12, 7, 70, 6, 10, 1, 'low', 'keine CYP(renal)', 'Antikonvulsivum. Abhängigkeitsrisiko, Rebound-Angst/Schmerz. Langsam über 4-8 Wochen ausschleichen.'),
('Gabapentin', 'Gabapentin', 12, 6, 65, 6, 10, 1, 'low', 'keine CYP(renal)', 'Antikonvulsivum. Entzugssymptome möglich (Angst, Schlafstörung). Über 2-4 Wochen ausschleichen.');

-- Antidepressiva (SSRIs/SNRIs/TCAs)
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Citalopram', 'Citalopram', 3, 7, 75, 35, 10, 1, 'high', 'CYP2C19,CYP3A4,CYP2D6(Substrat)', 'SSRI. Absetzsyndrom häufig (Schwindel, Parästhesien). Über 4-8 Wochen ausschleichen. CYP-Interaktionen.'),
('Escitalopram', 'Escitalopram', 3, 7, 75, 30, 10, 1, 'high', 'CYP2C19,CYP3A4,CYP2D6(Substrat)', 'SSRI, S-Enantiomer von Citalopram. Absetzsyndrom ähnlich wie Citalopram.'),
('Fluvoxamin', 'Fluvoxamin', 3, 7, 75, 15, 10, 1, 'critical', 'CYP1A2,CYP2C19,CYP3A4(starker Inhibitor)', 'SSRI. Starker CYP-Inhibitor! Kritische CBD-Interaktion. Absetzsyndrom häufig.'),
('Amitriptylin', 'Amitriptylin', 3, 8, 80, 20, 10, 1, 'high', 'CYP2C19,CYP2D6,CYP3A4(Substrat)', 'TCA. Anticholinerge Rebound-Symptome. Kardiotoxizität. Sehr langsam ausschleichen (8-12 Wochen).'),
('Bupropion', 'Bupropion', 3, 6, 65, 21, 15, 1, 'high', 'CYP2B6(Substrat),CYP2D6(Inhibitor)', 'Atypisches Antidepressivum. Krampfrisiko bei abruptem Absetzen. Über 4 Wochen ausschleichen.'),
('Trazodon', 'Trazodon', 3, 6, 60, 7, 15, 1, 'high', 'CYP3A4,CYP2D6(Substrat)', 'Sedierendes Antidepressivum. Rebound-Insomnie möglich. Langsam ausschleichen.');

-- Antipsychotika
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Quetiapin', 'Quetiapin', 4, 8, 85, 7, 10, 0, 'high', 'CYP3A4(Substrat)', 'Atypisches Antipsychotikum. Rebound-Psychose, Insomnie. Sehr langsam über 3-6 Monate ausschleichen.'),
('Risperidon', 'Risperidon', 4, 8, 85, 20, 10, 0, 'high', 'CYP2D6,CYP3A4(Substrat)', 'Atypisches Antipsychotikum. Rebound-Psychose-Risiko. Nur unter psychiatrischer Kontrolle reduzieren.'),
('Clozapin', 'Clozapin', 4, 9, 95, 12, 5, 0, 'critical', 'CYP1A2,CYP3A4,CYP2D6(Substrat)', 'Reserveantipsychotikum. Höchstes Rebound-Risiko. Agranulozytose. Nur unter strenger Kontrolle.'),
('Aripiprazol', 'Aripiprazol', 4, 7, 80, 75, 10, 0, 'high', 'CYP2D6,CYP3A4(Substrat)', 'Atypisches Antipsychotikum, sehr lange HWZ. Rebound-Psychose. Langsam über 2-4 Monate.'),
('Haloperidol', 'Haloperidol', 4, 8, 85, 20, 10, 0, 'high', 'CYP3A4,CYP2D6(Substrat)', 'Typisches Antipsychotikum. Extrapyramidale Symptome, Rebound-Psychose. Sehr vorsichtig reduzieren.');

-- Benzodiazepine
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Diazepam', 'Diazepam', 5, 8, 85, 48, 10, 1, 'high', 'CYP2C19,CYP3A4(Substrat)', 'Langwirksames Benzodiazepin. Abhängigkeit, Krampfrisiko. Sehr langsam über 8-16 Wochen ausschleichen.'),
('Lorazepam', 'Lorazepam', 5, 8, 85, 14, 10, 1, 'medium', 'UGT(Konjugation)', 'Mittellangwirksames Benzodiazepin. Abhängigkeit, Rebound-Angst. Über 6-12 Wochen ausschleichen.'),
('Alprazolam', 'Alprazolam', 5, 9, 90, 12, 5, 1, 'critical', 'CYP3A4(Substrat)', 'Kurzwirksames Benzodiazepin. Höchste Abhängigkeit. Krampfrisiko. Sehr langsam ausschleichen (12-24 Wochen).'),
('Midazolam', 'Midazolam', 5, 7, 75, 3, 15, 1, 'critical', 'CYP3A4(Substrat)', 'Sehr kurzwirksames Benzodiazepin. Meist nur akut. Starke CYP3A4-Interaktion mit CBD.');

-- Z-Substanzen
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Zolpidem', 'Zolpidem', 6, 7, 75, 2.5, 15, 1, 'high', 'CYP3A4,CYP2C9,CYP1A2(Substrat)', 'Z-Substanz. Abhängigkeit, Rebound-Insomnie. Über 4-8 Wochen ausschleichen. CYP3A4-Interaktion.'),
('Zopiclon', 'Zopiclon', 6, 7, 75, 5, 15, 1, 'high', 'CYP3A4,CYP2C8(Substrat)', 'Z-Substanz. Ähnliches Profil wie Zolpidem. Rebound-Insomnie. Langsam ausschleichen.');

-- Laxantien
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Lactulose', 'Lactulose', 13, 3, 25, 2, 25, 1, 'low', 'keine(nicht resorbiert)', 'Osmotisches Laxans. Gut absetzbar. Rebound-Verstopfung mild. Keine systemischen Interaktionen.'),
('Natriumpicosulfat', 'Natriumpicosulfat', 13, 4, 35, 16, 20, 1, 'low', 'intestinale Esterasen', 'Stimulierendes Laxans. Rebound-Verstopfung möglich. Über 2-4 Wochen ausschleichen.'),
('Senna', 'Senna', 13, 4, 35, 12, 20, 1, 'low', 'keine(Darmbakterien)', 'Pflanzliches Stimulans. Rebound-Verstopfung, Darmträgheit. Langsam reduzieren.'),
('Prucaloprid', 'Prucaloprid', 13, 4, 35, 24, 20, 1, 'low', 'keine CYP', 'Prokinetikum. Gut absetzbar. Rebound-Verstopfung moderat.'),
('Linaclotid', 'Linaclotid', 13, 3, 30, 0, 25, 1, 'low', 'keine(Peptid)', 'Guanylat-Cyclase-Agonist. Sehr gut absetzbar. Lokale Wirkung, keine systemischen Interaktionen.');

-- CED-Medikamente
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Mesalazin', 'Mesalazin', 14, 5, 50, 1, 15, 0, 'low', 'Acetyltransferase', 'Aminosalicylat für CED. Schubrisiko bei Absetzen. Langsam über 4-8 Wochen reduzieren.'),
('Budesonid', 'Budesonid (enteral)', 7, 6, 65, 3, 15, 0, 'medium', 'CYP3A4(Substrat)', 'Enterales Glukokortikoid für CED. NNR-Suppression möglich. Langsam ausschleichen.');

-- Immunsuppressiva
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Azathioprin', 'Azathioprin', 15, 8, 80, 5, 10, 0, 'medium', 'Thiopurin-Methyltransferase', 'Immunsuppressivum. Rejection-/Schubrisiko. Nur unter Facharzt-Kontrolle reduzieren.'),
('Ciclosporin', 'Ciclosporin', 15, 9, 95, 8, 5, 0, 'critical', 'CYP3A4(Substrat),P-gp', 'Calcineurin-Inhibitor. Höchstes Rejection-Risiko. Starke CYP3A4/P-gp-Interaktionen. Spiegel-Monitoring!'),
('Tacrolimus', 'Tacrolimus', 15, 9, 95, 12, 5, 0, 'critical', 'CYP3A4,CYP3A5(Substrat),P-gp', 'Calcineurin-Inhibitor. Transplant: nie eigenständig reduzieren. Kritische CBD-Interaktion, Spiegel-Monitoring!'),
('Mycophenolat-Mofetil', 'Mycophenolat-Mofetil', 15, 8, 85, 18, 10, 0, 'medium', 'UGT(Konjugation)', 'Immunsuppressivum. Rejection-/Schubrisiko. Nur unter Transplant-/Rheuma-Facharzt reduzieren.');

-- Osteoporose-Medikamente
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Zoledronat', 'Zoledronat', 16, 6, 60, 168, 0, 1, 'low', 'keine(renal)', 'Bisphosphonat, jährliche Infusion. Rebound-Frakturen nach Jahren möglich. Keine CYP-Interaktionen.'),
('Ibandronat', 'Ibandronat', 16, 5, 55, 120, 0, 1, 'low', 'keine(renal)', 'Bisphosphonat. Rebound-Frakturen moderat. Gut absetzbar nach 3-5 Jahren Therapie.'),
('Risedronat', 'Risedronat', 16, 5, 55, 480, 0, 1, 'low', 'keine(renal)', 'Bisphosphonat, sehr lange Knochenhalbwertszeit. Rebound-Risiko gering nach Langzeittherapie.'),
('Teriparatid', 'Teriparatid', 16, 7, 70, 1, 0, 1, 'low', 'keine(Peptid)', 'Parathormon-Analogon. Rebound-Knochenverlust nach Absetzen. Anschlusstherapie mit Bisphosphonat nötig.');

-- Antihistaminika
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Cetirizin', 'Cetirizin', 17, 3, 25, 8, 25, 1, 'low', 'geringe CYP', 'H1-Antihistaminikum. Sehr gut absetzbar. Rebound-Pruritus selten.'),
('Loratadin', 'Loratadin', 17, 3, 25, 8, 25, 1, 'medium', 'CYP3A4,CYP2D6(Substrat)', 'H1-Antihistaminikum. Gut absetzbar. Keine nennenswerten Absetzprobleme.'),
('Desloratadin', 'Desloratadin', 17, 3, 25, 27, 25, 1, 'medium', 'CYP3A4,CYP2D6(gering)', 'H1-Antihistaminikum, aktiver Metabolit von Loratadin. Sehr gut absetzbar.'),
('Levocetirizin', 'Levocetirizin', 17, 3, 25, 8, 25, 1, 'low', 'geringe CYP', 'H1-Antihistaminikum, R-Enantiomer. Sehr gut absetzbar. Keine Absetzprobleme.'),
('Fexofenadin', 'Fexofenadin', 17, 3, 25, 14, 25, 1, 'low', 'keine CYP,P-gp(Substrat)', 'H1-Antihistaminikum. Keine CYP-Interaktionen. Sehr gut absetzbar.'),
('Hydroxyzin', 'Hydroxyzin', 17, 5, 45, 20, 20, 1, 'high', 'CYP3A4,CYP2D6(Substrat)', 'H1-Antihistaminikum, sedierend. Rebound-Angst/Pruritus möglich. Über 2-4 Wochen ausschleichen.');

-- Antimykotika
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Itraconazol', 'Itraconazol', 18, 5, 45, 24, 15, 1, 'critical', 'CYP3A4(starker Inhibitor/Substrat)', 'Azol-Antimykotikum. Starker CYP3A4-Inhibitor! Kritische CBD-Interaktion. Bei Therapieende gut absetzbar.'),
('Voriconazol', 'Voriconazol', 18, 5, 45, 6, 15, 1, 'critical', 'CYP2C19,CYP2C9,CYP3A4(Substrat/Inhibitor)', 'Azol-Antimykotikum. Starker CYP-Inhibitor. Kritische Interaktionen. Nach Therapie gut absetzbar.'),
('Terbinafin', 'Terbinafin', 18, 4, 35, 200, 20, 1, 'high', 'CYP2D6(starker Inhibitor)', 'Allylamin-Antimykotikum. Sehr lange HWZ. Starker CYP2D6-Inhibitor. Nach Therapie gut absetzbar.');

-- Virostatika
INSERT OR REPLACE INTO medications (name, generic_name, category_id, withdrawal_risk_score, half_life_hours, max_weekly_reduction_pct, can_reduce_to_zero, cbd_interaction_strength, cyp450_enzyme, description)
VALUES
('Valaciclovir', 'Valaciclovir', 19, 3, 25, 3, 25, 1, 'low', 'keine CYP', 'Virostatikum (Herpes). Prodrug von Aciclovir. Sehr gut absetzbar nach Therapie. Keine CYP-Interaktionen.'),
('Oseltamivir', 'Oseltamivir', 19, 3, 25, 7, 25, 1, 'low', 'Esterasen', 'Neuraminidase-Inhibitor (Influenza). Sehr gut absetzbar nach Therapie. Keine CYP-Interaktionen.');

-- Update existierendes Ibuprofen mit vollständigen Daten
UPDATE medications 
SET 
  risk = 6,
  withdrawal_risk_score = 55,
  half_life_hours = 2,
  max_weekly_reduction_pct = 20,
  can_reduce_to_zero = 1,
  cbd_interaction_strength = 'medium',
  cyp450_enzyme = 'CYP2C9(Substrat)',
  notes = 'NSAR. GI/Nieren/CV-Risiko bei Langzeitgebrauch. Gut absetzbar. CYP2C9-Interaktion mit CBD beachten.'
WHERE name = 'Ibuprofen';

COMMIT;
