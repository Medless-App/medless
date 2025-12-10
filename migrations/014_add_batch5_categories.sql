-- ============================================================================
-- MEDLESS MIGRATION 014: ADD BATCH 5 CATEGORIES
-- ============================================================================
-- Description:  Create 15 new medication categories for Batch 5 (final categorization)
-- Author:       Lead Backend Engineer
-- Date:         2025-12-09
-- SCOPE:        15 new categories (IDs 41-55)
-- IMPACT:       Preparation for categorizing 30 medications in Migration 015
-- DEPENDS ON:   Migration 013 (Batch 4)
-- IDEMPOTENT:   Yes (INSERT OR IGNORE)
-- RISK:         LOW (Only INSERTs, no UPDATEs)
-- ============================================================================

-- ============================================================================
-- VALIDATION QUERIES (RUN BEFORE MIGRATION)
-- ============================================================================
-- Verify IDs 41-55 are free:
-- SELECT id FROM medication_categories WHERE id BETWEEN 41 AND 55;
-- Expected: 0 rows (IDs are available)

-- Verify current max ID:
-- SELECT MAX(id) FROM medication_categories;
-- Expected: 40 (from Batch 4)

-- ============================================================================
-- MIGRATION 014: CREATE 15 NEW CATEGORIES (IDs 41-55)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- KATEGORIE 41: HERZGLYKOSIDE
-- Rationale: Herzglykoside (kardiale Glykoside) zur Behandlung von Herzinsuffizienz
--            und Vorhofflimmern. Einzigartiger Wirkmechanismus (Na+/K+-ATPase-Hemmung).
--            Klinisch wichtig wegen schmaler therapeutischer Breite und TDM.
-- Examples:  Digoxin, Digitoxin
-- Medications: 1 (ID 205: Digoxin)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  41,
  'Herzglykoside',
  'Kardiale Glykoside zur Behandlung von Herzinsuffizienz und Vorhofflimmern (schmale therapeutische Breite)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 42: ANTIANGINOSA (NITRATE & ANDERE)
-- Rationale: Antianginöse Medikamente zur Prophylaxe und Behandlung von Angina pectoris.
--            Inkludiert Nitrate (NO-Donoren) und andere Wirkmechanismen (z.B. Ranolazin).
-- Examples:  Isosorbidmononitrat, Isosorbiddinitrat, Glyceroltrinitrat (GTN), Ranolazin
-- Medications: 2 (ID 221: Isosorbidmononitrat, ID 223: Ranolazin)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  42,
  'Antianginosa (Nitrate & Andere)',
  'Antianginöse Medikamente zur Prophylaxe und Behandlung von Angina pectoris (Nitrate, Ranolazin)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 43: LIPIDSENKER (NICHT-STATINE)
-- Rationale: Cholesterinsenker mit anderem Wirkmechanismus als Statine.
--            Inkludiert Cholesterinabsorptionshemmer (Ezetimib), PCSK9-Inhibitoren,
--            Bempedoinsäure. Oft kombiniert mit Statinen verwendet.
-- Examples:  Ezetimib, Bempedoinsäure, Evolocumab, Alirocumab
-- Medications: 1 (ID 305: Ezetimib)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  43,
  'Lipidsenker (Nicht-Statine)',
  'Cholesterinsenker (Cholesterinabsorptionshemmer, PCSK9-Inhibitoren, Bempedoinsäure)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 44: UROLOGIKA (BPH & BLASENFUNKTION)
-- Rationale: Medikamente zur Behandlung der benignen Prostatahyperplasie (BPH).
--            Inkludiert Alpha-1-Blocker (Tamsulosin) und 5-Alpha-Reduktase-Hemmer (Finasterid).
-- Examples:  Tamsulosin, Finasterid, Alfuzosin, Dutasterid
-- Medications: 2 (ID 250: Tamsulosin, ID 251: Finasterid)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  44,
  'Urologika (BPH & Blasenfunktion)',
  'Medikamente zur Behandlung der benignen Prostatahyperplasie (Alpha-1-Blocker, 5-Alpha-Reduktase-Hemmer)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 45: SPASMOLYTIKA (BLASE & DARM)
-- Rationale: Medikamente zur Behandlung der überaktiven Blase (OAB) und Spasmen.
--            Inkludiert Anticholinergika (Solifenacin, Oxybutynin) und Beta-3-Agonisten (Mirabegron).
-- Examples:  Solifenacin, Oxybutynin, Mirabegron, Tolterodin, Trospium
-- Medications: 3 (ID 276: Mirabegron, ID 302: Solifenacin, ID 303: Oxybutynin)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  45,
  'Spasmolytika (Blase & Darm)',
  'Medikamente zur Behandlung der überaktiven Blase (Anticholinergika, Beta-3-Agonisten)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 46: ANTIEMETIKA
-- Rationale: Medikamente zur Behandlung von Übelkeit und Erbrechen.
--            Inkludiert verschiedene Wirkmechanismen (5-HT3-Antagonisten, Dopaminantagonisten, NK1-Antagonisten).
--            Klinisch wichtig (Chemotherapie, postoperativ, Migräne).
-- Examples:  Ondansetron, Granisetron, Metoclopramid, Aprepitant, Domperidon
-- Medications: 2 (ID 207: Metoclopramid, ID 208: Ondansetron)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  46,
  'Antiemetika',
  'Medikamente zur Behandlung von Übelkeit und Erbrechen (5-HT3-Antagonisten, Dopaminantagonisten, NK1-Antagonisten)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 47: ANTIDIARRHOIKA
-- Rationale: Medikamente zur Behandlung von akuter und chronischer Diarrhoe.
--            Inkludiert Opioidrezeptor-Agonisten (Loperamid) und Enkephalinase-Hemmer (Racecadotril).
-- Examples:  Loperamid, Racecadotril
-- Medications: 1 (ID 210: Loperamid)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  47,
  'Antidiarrhoika',
  'Medikamente zur Behandlung von akuter und chronischer Diarrhoe (Loperamid, Racecadotril)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 48: IBD-THERAPEUTIKA
-- Rationale: Medikamente zur Behandlung von chronisch-entzündlichen Darmerkrankungen (IBD).
--            Inkludiert 5-ASA-Präparate (Mesalazin, Sulfasalazin) und andere IBD-Medikamente.
-- Examples:  Mesalazin, Sulfasalazin, Budesonid (IBD-Formulierung)
-- Medications: 2 (ID 254: Sulfasalazin, ID 297: Mesalazin)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  48,
  'IBD-Therapeutika',
  'Medikamente zur Behandlung von chronisch-entzündlichen Darmerkrankungen (5-ASA, Budesonid)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 49: ONKOLOGIKA (HORMONTHERAPIE & TARGETED THERAPY)
-- Rationale: Onkologische Medikamente für Hormontherapie und zielgerichtete Therapie.
--            Inkludiert Antiöstrogene, Aromatasehemmer, Antiandrogene, Tyrosinkinase-Inhibitoren.
--            Klinisch hochspezialisiert.
-- Examples:  Tamoxifen, Anastrozol, Letrozol, Imatinib, Bicalutamid, Exemestan, Erlotinib
-- Medications: 5 (ID 256: Tamoxifen, ID 257: Anastrozol, ID 258: Letrozol, ID 259: Imatinib, ID 260: Bicalutamid)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  49,
  'Onkologika (Hormontherapie & Targeted Therapy)',
  'Onkologische Medikamente (Hormontherapie, Tyrosinkinase-Inhibitoren, zielgerichtete Therapie)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 50: MS-THERAPEUTIKA
-- Rationale: Krankheitsmodifizierende Therapien für Multiple Sklerose (MS).
--            Inkludiert verschiedene Wirkmechanismen (S1P-Modulatoren, Fumarsäureester, DHODH-Hemmer).
--            Wichtig für MS-Patienten.
-- Examples:  Fingolimod, Dimethylfumarat, Teriflunomid, Glatirameracetat, Natalizumab
-- Medications: 3 (ID 266: Fingolimod, ID 267: Dimethylfumarat, ID 268: Teriflunomid)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  50,
  'MS-Therapeutika',
  'Krankheitsmodifizierende Therapien für Multiple Sklerose (S1P-Modulatoren, Fumarsäureester, DHODH-Hemmer)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 51: GICHTMITTEL (URIKOSTATIKA)
-- Rationale: Medikamente zur Behandlung von Gicht und Hyperurikämie.
--            Inkludiert Xanthinoxidase-Hemmer (Allopurinol, Febuxostat) und Urikosurika.
-- Examples:  Allopurinol, Febuxostat, Probenecid, Colchicin
-- Medications: 2 (ID 224: Allopurinol, ID 304: Febuxostat)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  51,
  'Gichtmittel (Urikostatika)',
  'Medikamente zur Behandlung von Gicht und Hyperurikämie (Xanthinoxidase-Hemmer, Urikosurika)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 52: OPHTHALMOLOGIKA (GLAUKOM)
-- Rationale: Topische Medikamente zur Behandlung von Glaukom und okulärer Hypertension.
--            Inkludiert Prostaglandin-Analoga, Beta-Blocker (topisch), Karboanhydrase-Hemmer (topisch).
-- Examples:  Latanoprost, Timolol (ophthalmisch), Brinzolamid, Dorzolamid, Bimatoprost
-- Medications: 2 (ID 323: Latanoprost, ID 324: Timolol ophthalmisch)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  52,
  'Ophthalmologika (Glaukom)',
  'Topische Medikamente zur Behandlung von Glaukom (Prostaglandin-Analoga, Beta-Blocker, Karboanhydrase-Hemmer)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 53: RETINOIDE (DERMATOLOGIE)
-- Rationale: Systemische Retinoide zur Behandlung schwerer Hauterkrankungen.
--            Inkludiert Vitamin-A-Derivate (Isotretinoin, Acitretin).
--            Klinisch wichtig (Teratogenität, Monitoring).
-- Examples:  Isotretinoin, Acitretin, Alitretinoin
-- Medications: 2 (ID 321: Isotretinoin, ID 322: Acitretin)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  53,
  'Retinoide (Dermatologie)',
  'Systemische Retinoide zur Behandlung schwerer Hauterkrankungen (Akne, Psoriasis)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 54: LOKALANÄSTHETIKA
-- Rationale: Lokalanästhetika zur topischen, infiltrativen und regionalen Anästhesie.
--            Inkludiert Amid- und Ester-Lokalanästhetika.
-- Examples:  Lidocain, Bupivacain, Mepivacain, Ropivacain, Articain
-- Medications: 1 (ID 185: Lidocain)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  54,
  'Lokalanästhetika',
  'Lokalanästhetika zur topischen, infiltrativen und regionalen Anästhesie (Amid- und Ester-Typen)'
);

-- ----------------------------------------------------------------------------
-- KATEGORIE 55: RAUCHERENTWÖHNUNG
-- Rationale: Medikamente zur Unterstützung der Raucherentwöhnung.
--            Inkludiert nikotinerge Agonisten (Vareniclin) und Nikotinersatztherapie.
--            Wichtig für Public Health.
-- Examples:  Vareniclin, Bupropion, Nikotinersatztherapie (Pflaster, Kaugummi)
-- Medications: 1 (ID 306: Vareniclin)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES (
  55,
  'Raucherentwöhnung',
  'Medikamente zur Unterstützung der Raucherentwöhnung (Vareniclin, Bupropion, Nikotinersatztherapie)'
);

-- ============================================================================
-- VALIDATION QUERIES (RUN AFTER MIGRATION)
-- ============================================================================
-- Verify all 15 categories were created:
-- SELECT id, name FROM medication_categories WHERE id BETWEEN 41 AND 55 ORDER BY id;
-- Expected: 15 rows (41-55)

-- Count total categories:
-- SELECT COUNT(*) as total_categories FROM medication_categories;
-- Expected: 56 (0-40 existing + 41-55 new)

-- ============================================================================
-- ROLLBACK QUERY (USE ONLY IF MIGRATION NEEDS TO BE REVERSED)
-- ============================================================================
-- DELETE FROM medication_categories WHERE id BETWEEN 41 AND 55;

-- ============================================================================
-- MIGRATION 014 COMPLETE
-- Next: Migration 015 (Batch 5 - Assign 35 medications to categories)
-- New categories: 41-55 (15 categories)
-- ============================================================================
