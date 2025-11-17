INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Transplantations-Immunsuppressiva',
  'very_high',
  0,
  1.0,
  0,
  1,
  'Langfristige Immunsuppression nach Organtransplantation; Reduktionen nur spezialärztlich, in vielen Fällen keine geplante Absetzung.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Antikoagulanzien / Plättchenhemmer',
  'very_high',
  0,
  1.0,
  0,
  1,
  'Langzeit-Antikoagulation / Thrombozytenhemmung z.B. bei Vorhofflimmern, künstlichen Herzklappen oder hohem Thromboserisiko; Reduktion nur fachärztlich.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Benzodiazepine / Z-Drugs',
  'high',
  1,
  0.0,
  10,
  1,
  'Ausschleichen grundsätzlich möglich, aber nur sehr langsam (5–10 % pro Woche/mehrere Wochen); Entzugssymptome und Rückfallrisiko beachten.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Antidepressiva',
  'high',
  1,
  0.0,
  10,
  1,
  'Nur langsames Ausschleichen empfohlen; Risiko von Absetzsymptomen und Rückfall der Grunderkrankung.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Antiepileptika',
  'high',
  1,
  0.25,
  5,
  1,
  'Reduktion nur sehr vorsichtig; Risiko von Krampfanfällen, Therapieanpassung nur durch erfahrene Behandler.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Opioide',
  'high',
  1,
  0.0,
  10,
  1,
  'Langsames Tapering erforderlich; Entzugssymptome und Schmerzexazerbation möglich, psychosoziale Faktoren beachten.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Systemische Kortikosteroide',
  'high',
  1,
  0.0,
  10,
  1,
  'Stufenweise Dosisreduktion notwendig; Nebennierenrinden-Suppression beachten, niemals abrupt absetzen.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Standard',
  'moderate',
  1,
  0.0,
  20,
  0,
  'Standard-Kategorie für Medikamente ohne bekannte spezielle Tapering-Anforderungen; vorsichtige lineare Reduktion ist grundsätzlich möglich.'
);
INSERT OR IGNORE INTO medication_categories (name, risk_level, can_reduce_to_zero, default_min_target_fraction, max_weekly_reduction_pct, requires_specialist, notes)
VALUES (
  'Sonstige / Unbekannt',
  'low',
  1,
  0.0,
  20,
  0,
  'Fallback-Kategorie für Medikamente ohne spezifische Kategorisierung. Spätere manuelle Überarbeitung empfohlen.'
);
UPDATE medication_categories
SET 
  risk_level = 'high',
  can_reduce_to_zero = 1,
  default_min_target_fraction = 0.0,
  max_weekly_reduction_pct = 10,
  requires_specialist = 1,
  notes = 'Ausschleichen grundsätzlich möglich, aber nur sehr langsam (5–10 % pro Woche/mehrere Wochen); Entzugssymptome und Rückfallrisiko beachten.'
WHERE name = 'Benzodiazepine' OR name LIKE 'Benzodiazepine%';
UPDATE medication_categories
SET 
  risk_level = 'high',
  can_reduce_to_zero = 1,
  default_min_target_fraction = 0.0,
  max_weekly_reduction_pct = 10,
  requires_specialist = 1,
  notes = 'Langsames Tapering erforderlich; Entzugssymptome und Schmerzexazerbation möglich, psychosoziale Faktoren beachten.'
WHERE name = 'Opioid' OR name LIKE 'Opioid%';
UPDATE medication_categories
SET 
  risk_level = 'high',
  can_reduce_to_zero = 1,
  default_min_target_fraction = 0.0,
  max_weekly_reduction_pct = 10,
  requires_specialist = 1,
  notes = 'Nur langsames Ausschleichen empfohlen; Risiko von Absetzsymptomen und Rückfall der Grunderkrankung.'
WHERE name = 'Antidepressivum' OR name LIKE 'Antidepressiv%';
UPDATE medication_categories
SET 
  risk_level = 'moderate',
  can_reduce_to_zero = 1,
  default_min_target_fraction = 0.0,
  max_weekly_reduction_pct = 25,
  requires_specialist = 0,
  notes = 'In der Regel gut reduzierbar bei nicht-opioiden Schmerzmitteln. Bei Langzeiteinnahme schrittweise Reduktion empfohlen.'
WHERE name = 'Schmerzmittel' OR name LIKE 'Schmerzmittel%';
UPDATE medications
SET category_id = (SELECT id FROM medication_categories WHERE name = 'Benzodiazepine / Z-Drugs' LIMIT 1)
WHERE LOWER(generic_name) LIKE '%diazepam%'
   OR LOWER(generic_name) LIKE '%lorazepam%'
   OR LOWER(generic_name) LIKE '%alprazolam%'
   OR LOWER(generic_name) LIKE '%clonazepam%'
   OR LOWER(generic_name) LIKE '%bromazepam%'
   OR LOWER(generic_name) LIKE '%oxazepam%'
   OR LOWER(generic_name) LIKE '%temazepam%'
   OR LOWER(generic_name) LIKE '%zolpidem%'
   OR LOWER(generic_name) LIKE '%zopiclon%'
   OR LOWER(generic_name) LIKE '%eszopiclon%'
   OR LOWER(name) LIKE '%diazepam%'
   OR LOWER(name) LIKE '%lorazepam%'
   OR LOWER(name) LIKE '%alprazolam%'
   OR LOWER(name) LIKE '%clonazepam%'
   OR LOWER(name) LIKE '%zolpidem%'
   OR LOWER(name) LIKE '%zopiclon%';
UPDATE medications
SET category_id = (SELECT id FROM medication_categories WHERE name = 'Antidepressiva' LIMIT 1)
WHERE LOWER(generic_name) LIKE '%citalopram%'
   OR LOWER(generic_name) LIKE '%escitalopram%'
   OR LOWER(generic_name) LIKE '%sertralin%'
   OR LOWER(generic_name) LIKE '%fluoxetin%'
   OR LOWER(generic_name) LIKE '%paroxetin%'
   OR LOWER(generic_name) LIKE '%venlafaxin%'
   OR LOWER(generic_name) LIKE '%duloxetin%'
   OR LOWER(generic_name) LIKE '%amitriptylin%'
   OR LOWER(generic_name) LIKE '%mirtazapin%'
   OR LOWER(generic_name) LIKE '%bupropion%'
   OR LOWER(generic_name) LIKE '%trazodon%'
   OR LOWER(name) LIKE '%citalopram%'
   OR LOWER(name) LIKE '%sertralin%'
   OR LOWER(name) LIKE '%fluoxetin%'
   OR LOWER(name) LIKE '%venlafaxin%';
UPDATE medications
SET category_id = (SELECT id FROM medication_categories WHERE name = 'Opioide' LIMIT 1)
WHERE LOWER(generic_name) LIKE '%morphin%'
   OR LOWER(generic_name) LIKE '%oxycodon%'
   OR LOWER(generic_name) LIKE '%fentanyl%'
   OR LOWER(generic_name) LIKE '%tramadol%'
   OR LOWER(generic_name) LIKE '%hydromorphon%'
   OR LOWER(generic_name) LIKE '%buprenorphin%'
   OR LOWER(generic_name) LIKE '%codein%'
   OR LOWER(generic_name) LIKE '%tilidin%'
   OR LOWER(name) LIKE '%morphin%'
   OR LOWER(name) LIKE '%oxycodon%'
   OR LOWER(name) LIKE '%fentanyl%'
   OR LOWER(name) LIKE '%tramadol%'
   OR LOWER(name) LIKE '%tilidin%';
UPDATE medications
SET category_id = (SELECT id FROM medication_categories WHERE name = 'Antiepileptika' LIMIT 1)
WHERE LOWER(generic_name) LIKE '%valproat%'
   OR LOWER(generic_name) LIKE '%valproinsäure%'
   OR LOWER(generic_name) LIKE '%carbamazepin%'
   OR LOWER(generic_name) LIKE '%lamotrigin%'
   OR LOWER(generic_name) LIKE '%levetiracetam%'
   OR LOWER(generic_name) LIKE '%gabapentin%'
   OR LOWER(generic_name) LIKE '%pregabalin%'
   OR LOWER(generic_name) LIKE '%phenytoin%'
   OR LOWER(generic_name) LIKE '%topiramat%'
   OR LOWER(name) LIKE '%valproat%'
   OR LOWER(name) LIKE '%carbamazepin%'
   OR LOWER(name) LIKE '%lamotrigin%'
   OR LOWER(name) LIKE '%gabapentin%'
   OR LOWER(name) LIKE '%pregabalin%';
UPDATE medications
SET category_id = (SELECT id FROM medication_categories WHERE name = 'Transplantations-Immunsuppressiva' LIMIT 1)
WHERE LOWER(generic_name) LIKE '%tacrolimus%'
   OR LOWER(generic_name) LIKE '%ciclosporin%'
   OR LOWER(generic_name) LIKE '%mycophenolat%'
   OR LOWER(generic_name) LIKE '%sirolimus%'
   OR LOWER(generic_name) LIKE '%everolimus%'
   OR LOWER(generic_name) LIKE '%azathioprin%'
   OR LOWER(name) LIKE '%tacrolimus%'
   OR LOWER(name) LIKE '%ciclosporin%'
   OR LOWER(name) LIKE '%mycophenolat%';
UPDATE medications
SET category_id = (SELECT id FROM medication_categories WHERE name = 'Antikoagulanzien / Plättchenhemmer' LIMIT 1)
WHERE LOWER(generic_name) LIKE '%warfarin%'
   OR LOWER(generic_name) LIKE '%phenprocoumon%'
   OR LOWER(generic_name) LIKE '%apixaban%'
   OR LOWER(generic_name) LIKE '%rivaroxaban%'
   OR LOWER(generic_name) LIKE '%dabigatran%'
   OR LOWER(generic_name) LIKE '%edoxaban%'
   OR LOWER(generic_name) LIKE '%clopidogrel%'
   OR LOWER(generic_name) LIKE '%ticagrelor%'
   OR LOWER(generic_name) LIKE '%prasugrel%'
   OR LOWER(name) LIKE '%marcumar%'
   OR LOWER(name) LIKE '%xarelto%'
   OR LOWER(name) LIKE '%eliquis%'
   OR LOWER(name) LIKE '%pradaxa%';
UPDATE medications
SET category_id = (SELECT id FROM medication_categories WHERE name = 'Systemische Kortikosteroide' LIMIT 1)
WHERE LOWER(generic_name) LIKE '%prednisolon%'
   OR LOWER(generic_name) LIKE '%prednison%'
   OR LOWER(generic_name) LIKE '%methylprednisolon%'
   OR LOWER(generic_name) LIKE '%dexamethason%'
   OR LOWER(generic_name) LIKE '%hydrocortison%'
   OR LOWER(generic_name) LIKE '%cortison%'
   OR LOWER(name) LIKE '%prednisolon%'
   OR LOWER(name) LIKE '%cortison%'
   OR LOWER(name) LIKE '%dexamethason%';
