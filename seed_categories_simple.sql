-- Simple category seeding - INSERT new, UPDATE existing

-- INSERT new categories (will fail silently if exists due to UNIQUE constraint)
INSERT OR IGNORE INTO medication_categories (name) VALUES ('Transplantations-Immunsuppressiva');
INSERT OR IGNORE INTO medication_categories (name) VALUES ('Antikoagulanzien / Plättchenhemmer');
INSERT OR IGNORE INTO medication_categories (name) VALUES ('Benzodiazepine / Z-Drugs');
INSERT OR IGNORE INTO medication_categories (name) VALUES ('Systemische Kortikosteroide');
INSERT OR IGNORE INTO medication_categories (name) VALUES ('Standard');
INSERT OR IGNORE INTO medication_categories (name) VALUES ('Sonstige / Unbekannt');
INSERT OR IGNORE INTO medication_categories (name) VALUES ('Opioide');

-- UPDATE with safety rules
UPDATE medication_categories SET risk_level='very_high', can_reduce_to_zero=0, default_min_target_fraction=1.0, max_weekly_reduction_pct=0, requires_specialist=1, notes='Langfristige Immunsuppression nach Organtransplantation; Reduktionen nur spezialärztlich, in vielen Fällen keine geplante Absetzung.' WHERE name='Transplantations-Immunsuppressiva';

UPDATE medication_categories SET risk_level='very_high', can_reduce_to_zero=0, default_min_target_fraction=1.0, max_weekly_reduction_pct=0, requires_specialist=1, notes='Langzeit-Antikoagulation / Thrombozytenhemmung z.B. bei Vorhofflimmern, künstlichen Herzklappen oder hohem Thromboserisiko; Reduktion nur fachärztlich.' WHERE name='Antikoagulanzien / Plättchenhemmer';

UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Ausschleichen grundsätzlich möglich, aber nur sehr langsam (5–10 % pro Woche/mehrere Wochen); Entzugssymptome und Rückfallrisiko beachten.' WHERE name='Benzodiazepine / Z-Drugs';

UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Nur langsames Ausschleichen empfohlen; Risiko von Absetzsymptomen und Rückfall der Grunderkrankung.' WHERE name='Antidepressiva';

UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.25, max_weekly_reduction_pct=5, requires_specialist=1, notes='Reduktion nur sehr vorsichtig; Risiko von Krampfanfällen, Therapieanpassung nur durch erfahrene Behandler.' WHERE name='Antiepileptika';

UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Langsames Tapering erforderlich; Entzugssymptome und Schmerzexazerbation möglich, psychosoziale Faktoren beachten.' WHERE name='Opioide';

UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Stufenweise Dosisreduktion notwendig; Nebennierenrinden-Suppression beachten, niemals abrupt absetzen.' WHERE name='Systemische Kortikosteroide';

UPDATE medication_categories SET risk_level='moderate', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=20, requires_specialist=0, notes='Standard-Kategorie für Medikamente ohne bekannte spezielle Tapering-Anforderungen; vorsichtige lineare Reduktion ist grundsätzlich möglich.' WHERE name='Standard';

UPDATE medication_categories SET risk_level='low', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=20, requires_specialist=0, notes='Fallback-Kategorie für Medikamente ohne spezifische Kategorisierung. Spätere manuelle Überarbeitung empfohlen.' WHERE name='Sonstige / Unbekannt';

UPDATE medication_categories SET risk_level='moderate', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=25, requires_specialist=0, notes='In der Regel gut reduzierbar bei nicht-opioiden Schmerzmitteln. Bei Langzeiteinnahme schrittweise Reduktion empfohlen.' WHERE name='Schmerzmittel';

-- Now map medications to categories
UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Benzodiazepine / Z-Drugs' LIMIT 1) WHERE LOWER(generic_name) LIKE '%diazepam%' OR LOWER(generic_name) LIKE '%lorazepam%' OR LOWER(generic_name) LIKE '%alprazolam%' OR LOWER(generic_name) LIKE '%clonazepam%' OR LOWER(generic_name) LIKE '%bromazepam%' OR LOWER(generic_name) LIKE '%oxazepam%' OR LOWER(generic_name) LIKE '%temazepam%' OR LOWER(generic_name) LIKE '%zolpidem%' OR LOWER(generic_name) LIKE '%zopiclon%' OR LOWER(generic_name) LIKE '%eszopiclon%' OR LOWER(name) LIKE '%diazepam%' OR LOWER(name) LIKE '%lorazepam%' OR LOWER(name) LIKE '%alprazolam%' OR LOWER(name) LIKE '%clonazepam%' OR LOWER(name) LIKE '%zolpidem%' OR LOWER(name) LIKE '%zopiclon%';

UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Antidepressiva' LIMIT 1) WHERE LOWER(generic_name) LIKE '%citalopram%' OR LOWER(generic_name) LIKE '%escitalopram%' OR LOWER(generic_name) LIKE '%sertralin%' OR LOWER(generic_name) LIKE '%fluoxetin%' OR LOWER(generic_name) LIKE '%paroxetin%' OR LOWER(generic_name) LIKE '%venlafaxin%' OR LOWER(generic_name) LIKE '%duloxetin%' OR LOWER(generic_name) LIKE '%amitriptylin%' OR LOWER(generic_name) LIKE '%mirtazapin%' OR LOWER(generic_name) LIKE '%bupropion%' OR LOWER(generic_name) LIKE '%trazodon%' OR LOWER(name) LIKE '%citalopram%' OR LOWER(name) LIKE '%sertralin%' OR LOWER(name) LIKE '%fluoxetin%' OR LOWER(name) LIKE '%venlafaxin%';

UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Opioide' LIMIT 1) WHERE LOWER(generic_name) LIKE '%morphin%' OR LOWER(generic_name) LIKE '%oxycodon%' OR LOWER(generic_name) LIKE '%fentanyl%' OR LOWER(generic_name) LIKE '%tramadol%' OR LOWER(generic_name) LIKE '%hydromorphon%' OR LOWER(generic_name) LIKE '%buprenorphin%' OR LOWER(generic_name) LIKE '%codein%' OR LOWER(generic_name) LIKE '%tilidin%' OR LOWER(name) LIKE '%morphin%' OR LOWER(name) LIKE '%oxycodon%' OR LOWER(name) LIKE '%fentanyl%' OR LOWER(name) LIKE '%tramadol%' OR LOWER(name) LIKE '%tilidin%';

UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Antiepileptika' LIMIT 1) WHERE LOWER(generic_name) LIKE '%valproat%' OR LOWER(generic_name) LIKE '%valproinsäure%' OR LOWER(generic_name) LIKE '%carbamazepin%' OR LOWER(generic_name) LIKE '%lamotrigin%' OR LOWER(generic_name) LIKE '%levetiracetam%' OR LOWER(generic_name) LIKE '%gabapentin%' OR LOWER(generic_name) LIKE '%pregabalin%' OR LOWER(generic_name) LIKE '%phenytoin%' OR LOWER(generic_name) LIKE '%topiramat%' OR LOWER(name) LIKE '%valproat%' OR LOWER(name) LIKE '%carbamazepin%' OR LOWER(name) LIKE '%lamotrigin%' OR LOWER(name) LIKE '%gabapentin%' OR LOWER(name) LIKE '%pregabalin%';

UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Transplantations-Immunsuppressiva' LIMIT 1) WHERE LOWER(generic_name) LIKE '%tacrolimus%' OR LOWER(generic_name) LIKE '%ciclosporin%' OR LOWER(generic_name) LIKE '%mycophenolat%' OR LOWER(generic_name) LIKE '%sirolimus%' OR LOWER(generic_name) LIKE '%everolimus%' OR LOWER(generic_name) LIKE '%azathioprin%' OR LOWER(name) LIKE '%tacrolimus%' OR LOWER(name) LIKE '%ciclosporin%' OR LOWER(name) LIKE '%mycophenolat%';

UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Antikoagulanzien / Plättchenhemmer' LIMIT 1) WHERE LOWER(generic_name) LIKE '%warfarin%' OR LOWER(generic_name) LIKE '%phenprocoumon%' OR LOWER(generic_name) LIKE '%apixaban%' OR LOWER(generic_name) LIKE '%rivaroxaban%' OR LOWER(generic_name) LIKE '%dabigatran%' OR LOWER(generic_name) LIKE '%edoxaban%' OR LOWER(generic_name) LIKE '%clopidogrel%' OR LOWER(generic_name) LIKE '%ticagrelor%' OR LOWER(generic_name) LIKE '%prasugrel%' OR LOWER(name) LIKE '%marcumar%' OR LOWER(name) LIKE '%xarelto%' OR LOWER(name) LIKE '%eliquis%' OR LOWER(name) LIKE '%pradaxa%';

UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Systemische Kortikosteroide' LIMIT 1) WHERE LOWER(generic_name) LIKE '%prednisolon%' OR LOWER(generic_name) LIKE '%prednison%' OR LOWER(generic_name) LIKE '%methylprednisolon%' OR LOWER(generic_name) LIKE '%dexamethason%' OR LOWER(generic_name) LIKE '%hydrocortison%' OR LOWER(generic_name) LIKE '%cortison%' OR LOWER(name) LIKE '%prednisolon%' OR LOWER(name) LIKE '%cortison%' OR LOWER(name) LIKE '%dexamethason%';
