-- ============================================================================
-- PuraMed Rx Datenpaket (DE/AT) – GROSSE ERWEITERUNG
--   - Struktur bleibt identisch zu eurer Seed-Datei
--   - Kategorie-IDs werden via SELECT aufgelöst (ID-agnostisch)
--   - Quellen in source_url (wenn Interaktion hinterlegt)
--   - NICHT "vollständig" bzgl. aller in Registern gelisteten Rx-Produkte,
--     aber breit & tief; für die Vollständigkeit nutzt bitte die Registry-ETL.
-- Generated: now
-- ============================================================================
BEGIN TRANSACTION;


-- --------------------------------------------------------------------------
-- 0) DATEN-PFLEGE / FIXES
-- --------------------------------------------------------------------------
-- 0.1) "NSRA" -> "NSAR"
UPDATE medications
SET description = REPLACE(description, 'NSRA', 'NSAR')
WHERE description LIKE '%NSRA%';
-- 0.2) Marcumar in DE/AT = Phenprocoumon (nicht Warfarin)
UPDATE medications
SET generic_name = 'Phenprocoumon',
    description  = 'Vitamin-K-Antagonist (VKA) zur Blutverdünnung'
WHERE name = 'Marcumar';
-- 0.3) Clopidogrel-Interaktion konservativer (Prodrug via CYP2C19)
UPDATE cbd_interactions
SET interaction_type = 'reduction',
    severity         = 'medium',
    description      = 'CBD hemmt CYP2C19; Clopidogrel ist Prodrug. Potenziell verminderte Plättchenhemmung – klinische Überwachung.',
    mechanism        = 'CYP2C19-Hemmung durch CBD → weniger aktiver Metabolit',
    recommendation   = 'Klinische Überwachung/Alternativen erwägen.',
    source_url       = 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210365s021lbl.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Clopidogrel');
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Eliquis', 'Apixaban',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'CYP3A4, P-gp', 'Direkter Faktor-Xa-Hemmer (NOAK)', '5 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Xarelto', 'Rivaroxaban',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'CYP3A4, P-gp', 'Direkter Faktor-Xa-Hemmer (NOAK)', '20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Lixiana', 'Edoxaban',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'P-gp', 'Direkter Faktor-Xa-Hemmer (NOAK)', '60 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Pradaxa', 'Dabigatranetexilat',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'P-gp', 'Direkter Thrombinhemmer (NOAK)', '110–150 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Marcumar', 'Phenprocoumon',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'CYP2C9', 'Vitamin-K-Antagonist (VKA)', '1–6 mg/Tag (INR-basiert)';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Plavix', 'Clopidogrel',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'CYP2C19, CYP3A4', 'Thrombozytenaggregationshemmer (Prodrug)', '75 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Efient', 'Prasugrel',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'CYP3A4, CYP2B6, CYP2C9', 'Thrombozytenaggregationshemmer (Prodrug)', '10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Brilique', 'Ticagrelor',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'CYP3A4', 'Thrombozytenaggregationshemmer (aktiv)', '90 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Arixtra', 'Fondaparinux',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'Keine', 'Selektiver Faktor-Xa-Hemmer (s.c.)', '2,5–10 mg s.c./Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Clexane', 'Enoxaparin',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'Keine', 'Niedermolekulares Heparin (s.c.)', '40–60 mg s.c./Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Fragmin', 'Dalteparin',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'Keine', 'Niedermolekulares Heparin (s.c.)', '2.500–5.000 IE s.c./Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Innohep', 'Tinzaparin',
       (SELECT id FROM medication_categories WHERE name = 'Blutverdünner'),
       'Keine', 'Niedermolekulares Heparin (s.c.)', '3.500–4.500 IE s.c./Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Cipramil', 'Citalopram',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2C19, CYP3A4, CYP2D6', 'SSRI', '20–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Cipralex', 'Escitalopram',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2C19, CYP3A4', 'SSRI', '10–20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Zoloft', 'Sertralin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2B6, CYP2C19, CYP3A4', 'SSRI', '50–200 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Fluctin', 'Fluoxetin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2D6', 'SSRI', '20–60 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Seroxat', 'Paroxetin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2D6', 'SSRI', '20–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Trevilor', 'Venlafaxin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2D6, CYP3A4', 'SNRI', '75–225 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Cymbalta', 'Duloxetin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP1A2, CYP2D6', 'SNRI', '60–120 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Remergil', 'Mirtazapin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP1A2, CYP2D6, CYP3A4', 'NaSSA', '15–45 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Reboxetin', 'Reboxetin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP3A4', 'NARI', '8–10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Trittico', 'Trazodon',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP3A4', 'SARI', '50–300 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Valdoxan', 'Agomelatin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP1A2, CYP2C9', 'Melatonin-Agonist/5-HT2C-Antagonist', '25–50 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Elontril', 'Bupropion',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2B6', 'NDRI', '150–300 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Anafranil', 'Clomipramin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2D6', 'TCA', '25–150 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Saroten', 'Amitriptylin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2D6', 'TCA', '25–150 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Jatrosom', 'Tranylcypromin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'MAO-Hemmung', 'MAO-Hemmer (irreversibel)', '10–30 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Brintellix', 'Vortioxetin',
       (SELECT id FROM medication_categories WHERE name = 'Antidepressiva'),
       'CYP2D6, CYP3A4', 'Multimodal antidepressivum', '10–20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Keppra', 'Levetiracetam',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'Keine', 'Antiepileptikum', '1.000–3.000 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Lamictal', 'Lamotrigin',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'UGT1A4', 'Antiepileptikum', '100–400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Depakine', 'Valproat',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'UGT, β-Oxidation', 'Antiepileptikum', '500–2.000 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Trileptal', 'Oxcarbazepin',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'UGT', 'Antiepileptikum', '600–2.400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Tegretal', 'Carbamazepin',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'CYP3A4 (Autoinduktion)', 'Antiepileptikum', '400–1.200 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Topamax', 'Topiramat',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'teilw. CYP3A4, renal', 'Antiepileptikum', '100–400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Zonegran', 'Zonisamid',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'CYP3A4', 'Antiepileptikum', '200–400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Fycompa', 'Perampanel',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'CYP3A4', 'AMPA-Antagonist', '4–12 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Vimpat', 'Lacosamid',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'CYP2C19 (gering)', 'Antiepileptikum', '200–400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Briviact', 'Brivaracetam',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'CYP2C19 (gering)', 'Antiepileptikum', '50–200 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Onfi', 'Clobazam',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'CYP2C19, CYP3A4', 'Benzodiazepin zur Epilepsie', '10–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Lyrica', 'Pregabalin',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'Keine', 'Antikonvulsivum/Analgetikum', '150–600 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Neurontin', 'Gabapentin',
       (SELECT id FROM medication_categories WHERE name = 'Antiepileptika'),
       'Keine', 'Antikonvulsivum/Analgetikum', '900–3.600 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Ibuprofen', 'Ibuprofen',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP2C9', 'NSAR', '200–800 mg bei Bedarf';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Aspirin', 'Acetylsalicylsäure',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'Keine', 'NSAR', '100–500 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Voltaren', 'Diclofenac',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP2C9', 'NSAR', '75–150 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Naproxen', 'Naproxen',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP2C9', 'NSAR', '250–500 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Celebrex', 'Celecoxib',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP2C9', 'COX-2-Hemmer (NSAR)', '200–400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Arcoxia', 'Etoricoxib',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP3A4 (gering)', 'COX-2-Hemmer (NSAR)', '60–120 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Tramal', 'Tramadol',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP2D6, CYP3A4', 'Opioid-Analgetikum', '50–400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Tilidin/Naloxon', 'Tilidin/Naloxon',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP3A4', 'Opioid-Analgetikum (Komb.)', '50/4–200/16 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'OxyContin', 'Oxycodon',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP2D6, CYP3A4', 'Starkes Opioid', '10–80 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Palladon', 'Hydromorphon',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'UGT', 'Starkes Opioid', '4–24 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Morphin', 'Morphin',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'UGT2B7', 'Starkes Opioid', '10–200 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Durogesic', 'Fentanyl',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'CYP3A4', 'Starkes Opioid (Transdermal)', '12–100 µg/h Pflaster';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Novalgin', 'Metamizol',
       (SELECT id FROM medication_categories WHERE name = 'Schmerzmittel'),
       'Keine', 'Nicht-opioides Analgetikum', '500–1.000 mg bei Bedarf';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Seroquel', 'Quetiapin',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP3A4', 'Atypisches Antipsychotikum', '100–800 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Zyprexa', 'Olanzapin',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP1A2', 'Atypisches Antipsychotikum', '5–20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Risperdal', 'Risperidon',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP2D6', 'Atypisches Antipsychotikum', '2–6 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Abilify', 'Aripiprazol',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP3A4, CYP2D6', 'Atypisches Antipsychotikum', '10–30 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Clozapin', 'Clozapin',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP1A2, CYP3A4', 'Atypisches Antipsychotikum', '150–600 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Solian', 'Amisulprid',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'Keine', 'Atypisches Antipsychotikum', '200–800 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Haldol', 'Haloperidol',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP3A4, CYP2D6', 'Typisches Antipsychotikum', '2–10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Stilnox', 'Zolpidem',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP3A4', 'Hypnotikum (Z-Drug)', '5–10 mg abends';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Imovane', 'Zopiclon',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP3A4', 'Hypnotikum (Z-Drug)', '3,75–7,5 mg abends';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Tavor', 'Lorazepam',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'UGT2B7', 'Benzodiazepin (Anxiolytikum)', '0,5–3 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Valium', 'Diazepam',
       (SELECT id FROM medication_categories WHERE name = 'Psychopharmaka'),
       'CYP2C19, CYP3A4', 'Benzodiazepin (Anxiolytikum)', '2–10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Sortis', 'Atorvastatin',
       (SELECT id FROM medication_categories WHERE name = 'Statine'),
       'CYP3A4', 'Statin', '10–80 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Zocor', 'Simvastatin',
       (SELECT id FROM medication_categories WHERE name = 'Statine'),
       'CYP3A4', 'Statin', '10–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Crestor', 'Rosuvastatin',
       (SELECT id FROM medication_categories WHERE name = 'Statine'),
       'CYP2C9 (gering)', 'Statin', '5–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Pravastatin', 'Pravastatin',
       (SELECT id FROM medication_categories WHERE name = 'Statine'),
       'Keine', 'Statin', '10–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Lescol', 'Fluvastatin',
       (SELECT id FROM medication_categories WHERE name = 'Statine'),
       'CYP2C9', 'Statin', '20–80 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Augmentin', 'Amoxicillin/Clavulansäure',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Aminopenicillin + β-Laktamasehemmer', '875/125 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Amoxicillin', 'Amoxicillin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Aminopenicillin', '500–1.000 mg 2–3x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Cefuroxim', 'Cefuroxim',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Cephalosporin (2. Gen.)', '250–500 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Cefpodoxim', 'Cefpodoxim',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Cephalosporin (3. Gen.)', '100–200 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Cefalexin', 'Cefalexin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Cephalosporin (1. Gen.)', '500 mg 2–3x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Azithromycin', 'Azithromycin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine (minimal CYP3A4)', 'Makrolid', '500 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Clarithromycin', 'Clarithromycin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'CYP3A4 (Inhibitor)', 'Makrolid', '250–500 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Doxycyclin', 'Doxycyclin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Tetrazyklin', '100 mg 1–2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Ciprofloxacin', 'Ciprofloxacin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'CYP1A2 (gering)', 'Fluorchinolon', '250–750 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Levofloxacin', 'Levofloxacin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Fluorchinolon', '500 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Moxifloxacin', 'Moxifloxacin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'Keine', 'Fluorchinolon', '400 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Linezolid', 'Linezolid',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'MAO-Hemmung (nicht CYP)', 'Oxazolidinon', '600 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Rifampicin', 'Rifampicin',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'CYP3A4 (starker Induktor)', 'Rifamycin', '600 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Trimethoprim/Sulfamethoxazol', 'Cotrimoxazol',
       (SELECT id FROM medication_categories WHERE name = 'Antibiotika'),
       'CYP2C9 (Hemmung)', 'Folatantagonisten-Kombi', '160/800 mg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Prograf', 'Tacrolimus',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'CYP3A4, P-gp', 'Calcineurin-Inhibitor', 'TDM-basiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Advagraf', 'Tacrolimus (retard)',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'CYP3A4, P-gp', 'Calcineurin-Inhibitor (retard)', 'TDM-basiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Sandimmun', 'Ciclosporin',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'CYP3A4, P-gp', 'Calcineurin-Inhibitor', 'TDM-basiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Rapamune', 'Sirolimus',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'CYP3A4, P-gp', 'mTOR-Inhibitor', 'TDM-basiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Afinitor', 'Everolimus',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'CYP3A4, P-gp', 'mTOR-Inhibitor', 'TDM-basiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'CellCept', 'Mycophenolatmofetil',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'UGT', 'Antimetabolit', 'TDM optional';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Azafalk', 'Azathioprin',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'TPMT/NUDT15', 'Antimetabolit', '1–3 mg/kg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Leflunomid', 'Leflunomid',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'CYP1A2, CYP2C19 (gering)', 'DMARD', '10–20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Methotrexat', 'Methotrexat',
       (SELECT id FROM medication_categories WHERE name = 'Immunsuppressiva'),
       'Transporter (OAT/MRP)', 'Antimetabolit/DMARD', '7,5–25 mg/Woche';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'L-Thyroxin', 'Levothyroxin',
       (SELECT id FROM medication_categories WHERE name = 'Schilddrüsenmedikamente'),
       'Keine', 'Schilddrüsenhormon (T4)', '25–200 µg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Thybon', 'Liothyronin',
       (SELECT id FROM medication_categories WHERE name = 'Schilddrüsenmedikamente'),
       'Keine', 'Schilddrüsenhormon (T3)', '5–20 µg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Thiamazol', 'Thiamazol',
       (SELECT id FROM medication_categories WHERE name = 'Schilddrüsenmedikamente'),
       'Keine', 'Thyreostatikum', '5–30 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Carbimazol', 'Carbimazol',
       (SELECT id FROM medication_categories WHERE name = 'Schilddrüsenmedikamente'),
       'Keine', 'Thyreostatikum (Prodrug von Thiamazol)', '10–30 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Propylthiouracil', 'Propylthiouracil',
       (SELECT id FROM medication_categories WHERE name = 'Schilddrüsenmedikamente'),
       'Keine', 'Thyreostatikum', '50–150 mg 3x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Delix', 'Ramipril',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine (Prodrug)', 'ACE-Hemmer', '2,5–10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Zestril', 'Lisinopril',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine', 'ACE-Hemmer', '10–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Enalapril', 'Enalapril',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine (Prodrug)', 'ACE-Hemmer', '5–20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Diovan', 'Valsartan',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine', 'AT1-Blocker (Sartan)', '80–160 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Atacand', 'Candesartan',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine', 'AT1-Blocker (Sartan)', '8–32 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Lorzaar', 'Losartan',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP2C9, CYP3A4', 'AT1-Blocker (Sartan) Prodrug', '50–100 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Olmetec', 'Olmesartan',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine', 'AT1-Blocker (Sartan)', '10–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Micardis', 'Telmisartan',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine', 'AT1-Blocker (Sartan)', '20–80 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Norvasc', 'Amlodipin',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP3A4', 'DHP-Kalziumkanalblocker', '5–10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Isoptin', 'Verapamil',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP3A4, P-gp (Inhibitor)', 'non-DHP-Kalziumkanalblocker', '120–240 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Dilatrend', 'Diltiazem',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP3A4', 'non-DHP-Kalziumkanalblocker', '120–360 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Beloc', 'Metoprolol',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP2D6', 'β1-selektiver Betablocker', '50–200 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Concor', 'Bisoprolol',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP3A4, CYP2D6', 'β1-selektiver Betablocker', '2,5–10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Nebilet', 'Nebivolol',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP2D6', 'β1-selektiver Betablocker', '5 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Carvedilol', 'Carvedilol',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP2D6, CYP2C9, CYP3A4', 'α/β-Blocker', '12,5–50 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Lasix', 'Furosemid',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine', 'Schleifendiuretikum', '20–80 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'HCT', 'Hydrochlorothiazid',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'Keine', 'Thiaziddiuretikum', '12,5–25 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Torasemid', 'Torasemid',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP2C9', 'Schleifendiuretikum', '5–20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Indapamid', 'Indapamid',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP3A4 (gering)', 'Thiazidartig', '1,5–2,5 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Aldactone', 'Spironolacton',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP3A4', 'Aldosteronantagonist (K-sparend)', '25–100 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Inspra', 'Eplerenon',
       (SELECT id FROM medication_categories WHERE name = 'Blutdrucksenker'),
       'CYP3A4', 'Aldosteronantagonist (K-sparend)', '25–100 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Nexium', 'Esomeprazol',
       (SELECT id FROM medication_categories WHERE name = 'Protonenpumpenhemmer'),
       'CYP2C19, CYP3A4', 'PPI', '20–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Antra', 'Omeprazol',
       (SELECT id FROM medication_categories WHERE name = 'Protonenpumpenhemmer'),
       'CYP2C19, CYP3A4', 'PPI', '20–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Agopton', 'Lansoprazol',
       (SELECT id FROM medication_categories WHERE name = 'Protonenpumpenhemmer'),
       'CYP2C19, CYP3A4', 'PPI', '15–30 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Pantozol', 'Pantoprazol',
       (SELECT id FROM medication_categories WHERE name = 'Protonenpumpenhemmer'),
       'CYP2C19', 'PPI', '20–40 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Rabeprazol', 'Rabeprazol',
       (SELECT id FROM medication_categories WHERE name = 'Protonenpumpenhemmer'),
       'CYP2C19', 'PPI', '10–20 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Glucophage', 'Metformin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine (OCT2/MATE)', 'Biguanid', '500–2.000 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Amaryl', 'Glimepirid',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'CYP2C9', 'Sulfonylharnstoff', '1–6 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Euglucon', 'Glibenclamid',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'CYP2C9', 'Sulfonylharnstoff', '1,75–10,5 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Pioglitazon', 'Pioglitazon',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'CYP2C8, CYP3A4', 'Glitazon', '15–45 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Acarbose', 'Acarbose',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'Alpha-Glukosidasehemmer', '50–100 mg 3x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Januvia', 'Sitagliptin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'DPP-4-Hemmer', '100 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Onglyza', 'Saxagliptin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'CYP3A4', 'DPP-4-Hemmer', '5 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Trajenta', 'Linagliptin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine (CYP3A4 gering)', 'DPP-4-Hemmer', '5 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Vipidia', 'Alogliptin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'DPP-4-Hemmer', '25 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Jardiance', 'Empagliflozin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'UGT2B7 (gering)', 'SGLT2-Hemmer', '10–25 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Forxiga', 'Dapagliflozin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'UGT1A9', 'SGLT2-Hemmer', '10 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Ozempic', 'Semaglutid',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'GLP-1-RA (s.c.)', '0,25–2 mg/Woche';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Rybelsus', 'Semaglutid (oral)',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'GLP-1-RA (oral)', '7–14 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Victoza', 'Liraglutid',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'GLP-1-RA (s.c.)', '0,6–1,8 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Trulicity', 'Dulaglutid',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'GLP-1-RA (s.c.)', '0,75–4,5 mg/Woche';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Tresiba', 'Insulin degludec',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'Insulin (lang)', 'Titrationsbasiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Lantus', 'Insulin glargin',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'Insulin (lang)', 'Titrationsbasiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'NovoRapid', 'Insulin aspart',
       (SELECT id FROM medication_categories WHERE name = 'Diabetesmedikamente'),
       'Keine', 'Insulin (kurz)', 'Titrationsbasiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Ventolin', 'Salbutamol',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'Keine', 'SABA', '100–200 µg bei Bedarf';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Oxis', 'Formoterol',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'CYP3A4 (gering)', 'LABA', '12–24 µg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Serevent', 'Salmeterol',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'CYP3A4', 'LABA', '50 µg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Pulmicort', 'Budesonid',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'CYP3A4', 'ICS', '200–800 µg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Flixotide', 'Fluticason',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'CYP3A4', 'ICS', '100–500 µg 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Symbicort', 'Budesonid/Formoterol',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'CYP3A4', 'ICS/LABA', '1–2 Hub 2x/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Relvar', 'Fluticason/Vilanterol',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'CYP3A4', 'ICS/LABA', '1 Hub/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Spiriva', 'Tiotropium',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'Keine', 'LAMA', '18 µg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Anoro', 'Umeclidinium/Vilanterol',
       (SELECT id FROM medication_categories WHERE name = 'Asthma-Medikamente'),
       'CYP3A4', 'LAMA/LABA', '1 Hub/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Ritalin', 'Methylphenidat',
       (SELECT id FROM medication_categories WHERE name = 'ADHS-Medikamente'),
       'CES1 (nicht CYP)', 'Stimulans', '5–60 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Medikinet', 'Methylphenidat',
       (SELECT id FROM medication_categories WHERE name = 'ADHS-Medikamente'),
       'CES1 (nicht CYP)', 'Stimulans (retard/IR)', 'Titrationsbasiert';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Concerta', 'Methylphenidat',
       (SELECT id FROM medication_categories WHERE name = 'ADHS-Medikamente'),
       'CES1 (nicht CYP)', 'Stimulans (retard)', '18–54 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Elvanse', 'Lisdexamfetamin',
       (SELECT id FROM medication_categories WHERE name = 'ADHS-Medikamente'),
       'Prodrug (nicht CYP)', 'Stimulans', '30–70 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Strattera', 'Atomoxetin',
       (SELECT id FROM medication_categories WHERE name = 'ADHS-Medikamente'),
       'CYP2D6', 'NARI', '40–100 mg/Tag';
INSERT OR IGNORE INTO medications
(name, generic_name, category_id, cyp450_enzyme, description, common_dosage)
SELECT 'Intuniv', 'Guanfacin',
       (SELECT id FROM medication_categories WHERE name = 'ADHS-Medikamente'),
       'CYP3A4', 'α2A-Agonist', '1–7 mg/Tag';
-- Phenprocoumon
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'high',
    description      = 'CBD kann CYP2C9 hemmen; VKA-Exposition und INR können steigen → Blutungsrisiko.',
    mechanism        = 'CYP2C9-Hemmung durch CBD',
    recommendation   = 'INR engmaschig überwachen; Dosis anpassen.',
    source_url       = 'https://jcannabisresearch.biomedcentral.com/counter/pdf/10.1186/s42238-021-00112-x.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Phenprocoumon');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'high', 'CBD kann CYP2C9 hemmen; VKA-Exposition und INR können steigen → Blutungsrisiko.', 'CYP2C9-Hemmung durch CBD', 'INR engmaschig überwachen; Dosis anpassen.', 'https://jcannabisresearch.biomedcentral.com/counter/pdf/10.1186/s42238-021-00112-x.pdf'
FROM medications WHERE generic_name = 'Phenprocoumon';
-- Warfarin
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'high',
    description      = 'Fallberichte zeigen INR-Anstieg unter CBD/Cannabis.',
    mechanism        = 'CYP2C9-Hemmung',
    recommendation   = 'INR engmaschig; Risiko/Nutzen prüfen.',
    source_url       = 'https://jcannabisresearch.biomedcentral.com/counter/pdf/10.1186/s42238-021-00112-x.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Warfarin');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'high', 'Fallberichte zeigen INR-Anstieg unter CBD/Cannabis.', 'CYP2C9-Hemmung', 'INR engmaschig; Risiko/Nutzen prüfen.', 'https://jcannabisresearch.biomedcentral.com/counter/pdf/10.1186/s42238-021-00112-x.pdf'
FROM medications WHERE generic_name = 'Warfarin';
-- Apixaban
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'Substrat von CYP3A4/P‑gp; CBD kann Transport/Enzyme beeinflussen → Exposition ↑ möglich.',
    mechanism        = 'CYP3A4/P‑gp‑Schnittstelle',
    recommendation   = 'Blutungszeichen überwachen; Interaktionscocktail vermeiden.',
    source_url       = 'https://www.ema.europa.eu/en/documents/product-information/apixaban-accord-epar-product-information_en.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Apixaban');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'Substrat von CYP3A4/P‑gp; CBD kann Transport/Enzyme beeinflussen → Exposition ↑ möglich.', 'CYP3A4/P‑gp‑Schnittstelle', 'Blutungszeichen überwachen; Interaktionscocktail vermeiden.', 'https://www.ema.europa.eu/en/documents/product-information/apixaban-accord-epar-product-information_en.pdf'
FROM medications WHERE generic_name = 'Apixaban';
-- Rivaroxaban
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'Substrat von CYP3A4/P‑gp; CBD könnte Exposition erhöhen.',
    mechanism        = 'CYP3A4/P‑gp',
    recommendation   = 'Klinische Überwachung.',
    source_url       = 'https://www.ema.europa.eu/en/documents/product-information/apixaban-accord-epar-product-information_en.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Rivaroxaban');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'Substrat von CYP3A4/P‑gp; CBD könnte Exposition erhöhen.', 'CYP3A4/P‑gp', 'Klinische Überwachung.', 'https://www.ema.europa.eu/en/documents/product-information/apixaban-accord-epar-product-information_en.pdf'
FROM medications WHERE generic_name = 'Rivaroxaban';
-- Edoxaban
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'low',
    description      = 'P‑gp‑Substrat; theoretische Interaktion über Transporter.',
    mechanism        = 'P‑gp',
    recommendation   = 'Klinische Beobachtung.',
    source_url       = 'https://www.ema.europa.eu/en/documents/product-information/apixaban-accord-epar-product-information_en.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Edoxaban');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'low', 'P‑gp‑Substrat; theoretische Interaktion über Transporter.', 'P‑gp', 'Klinische Beobachtung.', 'https://www.ema.europa.eu/en/documents/product-information/apixaban-accord-epar-product-information_en.pdf'
FROM medications WHERE generic_name = 'Edoxaban';
-- Dabigatranetexilat
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'P‑gp‑Substrat; Inhibition durch Cannabinoide möglich → Spiegel ↑.',
    mechanism        = 'P‑gp',
    recommendation   = 'Auf Blutungszeichen achten.',
    source_url       = 'https://dmd.aspetjournals.org/article/S0090-9556%2824%2909834-9/fulltext'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Dabigatranetexilat');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'P‑gp‑Substrat; Inhibition durch Cannabinoide möglich → Spiegel ↑.', 'P‑gp', 'Auf Blutungszeichen achten.', 'https://dmd.aspetjournals.org/article/S0090-9556%2824%2909834-9/fulltext'
FROM medications WHERE generic_name = 'Dabigatranetexilat';
-- Clopidogrel
UPDATE cbd_interactions
SET interaction_type = 'reduction',
    severity         = 'medium',
    description      = 'CBD hemmt CYP2C19; Clopidogrel ist Prodrug → Aktivierung ↓ möglich.',
    mechanism        = 'CYP2C19-Hemmung',
    recommendation   = 'Wirksamkeit klinisch überwachen.',
    source_url       = 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210365s021lbl.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Clopidogrel');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'reduction', 'medium', 'CBD hemmt CYP2C19; Clopidogrel ist Prodrug → Aktivierung ↓ möglich.', 'CYP2C19-Hemmung', 'Wirksamkeit klinisch überwachen.', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210365s021lbl.pdf'
FROM medications WHERE generic_name = 'Clopidogrel';
-- Ticagrelor
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'CYP3A4-Substrat; CBD-Hemmung von CYP3A4 könnte Exposition erhöhen.',
    mechanism        = 'CYP3A4',
    recommendation   = 'Blutungsrisiko beachten.',
    source_url       = 'https://cima.aemps.es/cima/dochtml/ft/111691014/FT_111691014.html'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Ticagrelor');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'CYP3A4-Substrat; CBD-Hemmung von CYP3A4 könnte Exposition erhöhen.', 'CYP3A4', 'Blutungsrisiko beachten.', 'https://cima.aemps.es/cima/dochtml/ft/111691014/FT_111691014.html'
FROM medications WHERE generic_name = 'Ticagrelor';
-- Prasugrel
UPDATE cbd_interactions
SET interaction_type = 'uncertain',
    severity         = 'low',
    description      = 'Prodrug, mehrere CYP beteiligt; klinische Evidenz mit CBD begrenzt.',
    mechanism        = 'CYP‑Metabolismus (gemischt)',
    recommendation   = 'Vorsicht, aber keine routinemäßige Anpassung.',
    source_url       = 'https://cima.aemps.es/cima/dochtml/ft/111691014/FT_111691014.html'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Prasugrel');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'uncertain', 'low', 'Prodrug, mehrere CYP beteiligt; klinische Evidenz mit CBD begrenzt.', 'CYP‑Metabolismus (gemischt)', 'Vorsicht, aber keine routinemäßige Anpassung.', 'https://cima.aemps.es/cima/dochtml/ft/111691014/FT_111691014.html'
FROM medications WHERE generic_name = 'Prasugrel';
-- Clobazam
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'high',
    description      = 'CBD erhöht N‑Desmethylclobazam deutlich → Sedierung.',
    mechanism        = 'CYP2C19-Hemmung; PK-Interaktion belegt',
    recommendation   = 'Dosis anpassen/Monitoring.',
    source_url       = 'https://onlinelibrary.wiley.com/doi/epdf/10.1111/epi.16355'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Clobazam');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'high', 'CBD erhöht N‑Desmethylclobazam deutlich → Sedierung.', 'CYP2C19-Hemmung; PK-Interaktion belegt', 'Dosis anpassen/Monitoring.', 'https://onlinelibrary.wiley.com/doi/epdf/10.1111/epi.16355'
FROM medications WHERE generic_name = 'Clobazam';
-- Valproat
UPDATE cbd_interactions
SET interaction_type = 'risk',
    severity         = 'high',
    description      = 'Kombination mit CBD: Leberenzyme/Ammoniak ↑ häufiger.',
    mechanism        = 'Additive Hepatotoxizität/Metabolismus',
    recommendation   = 'Leberwerte/Thrombos monitoren; Dosis erwägen.',
    source_url       = 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210365s021lbl.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Valproat');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'risk', 'high', 'Kombination mit CBD: Leberenzyme/Ammoniak ↑ häufiger.', 'Additive Hepatotoxizität/Metabolismus', 'Leberwerte/Thrombos monitoren; Dosis erwägen.', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210365s021lbl.pdf'
FROM medications WHERE generic_name = 'Valproat';
-- Topiramat
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'In CBD‑Studien leichter, dosisabhängiger Spiegelanstieg.',
    mechanism        = 'Unklar; evtl. Enzym/Transport',
    recommendation   = 'ZNS‑NW beobachten; ggf. Spiegel.',
    source_url       = 'https://www.sciencedirect.com/science/article/pii/S1059131120302788'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Topiramat');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'In CBD‑Studien leichter, dosisabhängiger Spiegelanstieg.', 'Unklar; evtl. Enzym/Transport', 'ZNS‑NW beobachten; ggf. Spiegel.', 'https://www.sciencedirect.com/science/article/pii/S1059131120302788'
FROM medications WHERE generic_name = 'Topiramat';
-- Perampanel
UPDATE cbd_interactions
SET interaction_type = 'uncertain',
    severity         = 'low',
    description      = 'Perampanel via CYP3A4; Interaktion mit CBD theoretisch.',
    mechanism        = 'CYP3A4',
    recommendation   = 'Klinische Beobachtung.',
    source_url       = 'https://www.sciencedirect.com/science/article/pii/S1059131120302788'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Perampanel');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'uncertain', 'low', 'Perampanel via CYP3A4; Interaktion mit CBD theoretisch.', 'CYP3A4', 'Klinische Beobachtung.', 'https://www.sciencedirect.com/science/article/pii/S1059131120302788'
FROM medications WHERE generic_name = 'Perampanel';
-- Tacrolimus
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'high',
    description      = 'Fallberichte: Tacrolimus‑Toxizität unter CBD (Spiegel ↑).',
    mechanism        = 'CYP3A4/P‑gp-Hemmung',
    recommendation   = 'TDM & Dosisanpassung.',
    source_url       = 'https://www.sciencedirect.com/science/article/pii/S2468024923009300'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Tacrolimus');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'high', 'Fallberichte: Tacrolimus‑Toxizität unter CBD (Spiegel ↑).', 'CYP3A4/P‑gp-Hemmung', 'TDM & Dosisanpassung.', 'https://www.sciencedirect.com/science/article/pii/S2468024923009300'
FROM medications WHERE generic_name = 'Tacrolimus';
-- Ciclosporin
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'high',
    description      = 'Ciclosporin‑Spiegel können unter CBD steigen.',
    mechanism        = 'CYP3A4/P‑gp-Hemmung',
    recommendation   = 'TDM/klinische Überwachung.',
    source_url       = 'https://link.springer.com/article/10.1007/s40278-024-58662-x'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Ciclosporin');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'high', 'Ciclosporin‑Spiegel können unter CBD steigen.', 'CYP3A4/P‑gp-Hemmung', 'TDM/klinische Überwachung.', 'https://link.springer.com/article/10.1007/s40278-024-58662-x'
FROM medications WHERE generic_name = 'Ciclosporin';
-- Quetiapin
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'Quetiapin via CYP3A4; CBD‑Hemmung könnte Spiegel erhöhen → Sedierung.',
    mechanism        = 'CYP3A4-Hemmung',
    recommendation   = 'Langsam auftitrieren; NW beobachten.',
    source_url       = 'https://www.ema.europa.eu/en/documents/overview/quetiapine-accord-epar-medicine-overview_en.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Quetiapin');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'Quetiapin via CYP3A4; CBD‑Hemmung könnte Spiegel erhöhen → Sedierung.', 'CYP3A4-Hemmung', 'Langsam auftitrieren; NW beobachten.', 'https://www.ema.europa.eu/en/documents/overview/quetiapine-accord-epar-medicine-overview_en.pdf'
FROM medications WHERE generic_name = 'Quetiapin';
-- Risperidon
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'low',
    description      = 'Risperidon via CYP2D6; CBD hemmt CYP2D6 → Exposition ↑ möglich.',
    mechanism        = 'CYP2D6-Hemmung',
    recommendation   = 'ZNS‑NW monitoren.',
    source_url       = 'https://www.ema.europa.eu/en/medicines/human/referrals/risperidone-containing-medicines'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Risperidon');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'low', 'Risperidon via CYP2D6; CBD hemmt CYP2D6 → Exposition ↑ möglich.', 'CYP2D6-Hemmung', 'ZNS‑NW monitoren.', 'https://www.ema.europa.eu/en/medicines/human/referrals/risperidone-containing-medicines'
FROM medications WHERE generic_name = 'Risperidon';
-- Clozapin
UPDATE cbd_interactions
SET interaction_type = 'risk',
    severity         = 'medium',
    description      = 'Clozapin (CYP1A2/3A4) + CBD: mögliche Spiegel ↑ → Krampfschwelle/Sedierung.',
    mechanism        = 'CYP1A2/3A4',
    recommendation   = 'Therapieüberwachung, Spiegel.',
    source_url       = 'https://www.ema.europa.eu/en/medicines/human/referrals/clozapine-containing-medicines'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Clozapin');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'risk', 'medium', 'Clozapin (CYP1A2/3A4) + CBD: mögliche Spiegel ↑ → Krampfschwelle/Sedierung.', 'CYP1A2/3A4', 'Therapieüberwachung, Spiegel.', 'https://www.ema.europa.eu/en/medicines/human/referrals/clozapine-containing-medicines'
FROM medications WHERE generic_name = 'Clozapin';
-- Zolpidem
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'low',
    description      = 'Additive Sedierung/Schläfrigkeit möglich.',
    mechanism        = 'ZNS-Depression additiv',
    recommendation   = 'Dosis/Anwendung prüfen.',
    source_url       = 'https://www.ema.europa.eu/en/medicines/human/referrals/zolpidem-containing-medicines'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Zolpidem');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'low', 'Additive Sedierung/Schläfrigkeit möglich.', 'ZNS-Depression additiv', 'Dosis/Anwendung prüfen.', 'https://www.ema.europa.eu/en/medicines/human/referrals/zolpidem-containing-medicines'
FROM medications WHERE generic_name = 'Zolpidem';
-- Diazepam
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'low',
    description      = 'CBD hemmt CYP2C19/3A4 → Diazepam‑Spiegel ↑ möglich.',
    mechanism        = 'CYP2C19/3A4-Hemmung',
    recommendation   = 'Sedierung beobachten.',
    source_url       = 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210365s021lbl.pdf'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Diazepam');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'low', 'CBD hemmt CYP2C19/3A4 → Diazepam‑Spiegel ↑ möglich.', 'CYP2C19/3A4-Hemmung', 'Sedierung beobachten.', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210365s021lbl.pdf'
FROM medications WHERE generic_name = 'Diazepam';
-- Atorvastatin
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'CYP3A4‑Substrat; CBD könnte Exposition erhöhen.',
    mechanism        = 'CYP3A4-Hemmung',
    recommendation   = 'Myopathiezeichen beachten.',
    source_url       = 'https://www.ema.europa.eu/en/medicines/human/referrals/statins-hmg-coa-reductase-inhibitors'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Atorvastatin');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'CYP3A4‑Substrat; CBD könnte Exposition erhöhen.', 'CYP3A4-Hemmung', 'Myopathiezeichen beachten.', 'https://www.ema.europa.eu/en/medicines/human/referrals/statins-hmg-coa-reductase-inhibitors'
FROM medications WHERE generic_name = 'Atorvastatin';
-- Simvastatin
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'medium',
    description      = 'CYP3A4‑Substrat; Interaktion theoretisch.',
    mechanism        = 'CYP3A4',
    recommendation   = 'CK/Muskelbeschwerden beachten.',
    source_url       = 'https://www.ema.europa.eu/en/medicines/human/referrals/statins-hmg-coa-reductase-inhibitors'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Simvastatin');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'medium', 'CYP3A4‑Substrat; Interaktion theoretisch.', 'CYP3A4', 'CK/Muskelbeschwerden beachten.', 'https://www.ema.europa.eu/en/medicines/human/referrals/statins-hmg-coa-reductase-inhibitors'
FROM medications WHERE generic_name = 'Simvastatin';
-- Metoprolol
UPDATE cbd_interactions
SET interaction_type = 'enhancement',
    severity         = 'low',
    description      = 'CYP2D6‑Substrat; CBD hemmt CYP2D6 → Spiegel ↑ möglich.',
    mechanism        = 'CYP2D6-Hemmung',
    recommendation   = 'Bradykardie/Hypotonie beachten.',
    source_url       = 'https://www.medicines.org.uk/emc/product/6891/smpc'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Metoprolol');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'enhancement', 'low', 'CYP2D6‑Substrat; CBD hemmt CYP2D6 → Spiegel ↑ möglich.', 'CYP2D6-Hemmung', 'Bradykardie/Hypotonie beachten.', 'https://www.medicines.org.uk/emc/product/6891/smpc'
FROM medications WHERE generic_name = 'Metoprolol';
-- Omeprazol
UPDATE cbd_interactions
SET interaction_type = 'interaction',
    severity         = 'low',
    description      = 'Beiderseitige Beeinflussung von CYP2C19 möglich.',
    mechanism        = 'CYP2C19',
    recommendation   = 'Klinisch meist unkritisch.',
    source_url       = 'https://www.ema.europa.eu/en/medicines/human/EPAR/omeprazole-helc'
WHERE medication_id = (SELECT id FROM medications WHERE generic_name = 'Omeprazol');
INSERT OR IGNORE INTO cbd_interactions
(medication_id, interaction_type, severity, description, mechanism, recommendation, source_url)
SELECT id, 'interaction', 'low', 'Beiderseitige Beeinflussung von CYP2C19 möglich.', 'CYP2C19', 'Klinisch meist unkritisch.', 'https://www.ema.europa.eu/en/medicines/human/EPAR/omeprazole-helc'
FROM medications WHERE generic_name = 'Omeprazol';

COMMIT;
-- ============================== END =========================================
