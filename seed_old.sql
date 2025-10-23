-- Medikamenten-Kategorien einfügen
INSERT OR IGNORE INTO medication_categories (name, description, risk_level) VALUES
('Blutverdünner', 'Medikamente zur Hemmung der Blutgerinnung', 'high'),
('Antidepressiva', 'SSRI, SNRI und andere Antidepressiva', 'high'),
('Antiepileptika', 'Medikamente zur Behandlung von Epilepsie', 'high'),
('Schmerzmittel', 'Analgetika und Opioide', 'medium'),
('Psychopharmaka', 'Antipsychotika und Benzodiazepine', 'high'),
('Statine', 'Cholesterinsenker', 'medium'),
('Antibiotika', 'Antimikrobielle Medikamente', 'medium'),
('Immunsuppressiva', 'Medikamente zur Unterdrückung des Immunsystems', 'high'),
('Schilddrüsenmedikamente', 'Hormone für die Schilddrüsenfunktion', 'medium'),
('Antikoagulantien', 'Gerinnungshemmer', 'very_high');

-- Häufige Medikamente einfügen
INSERT OR IGNORE INTO medications (name, generic_name, category_id, cyp450_enzyme, description, common_dosage) VALUES
-- Blutverdünner
('Marcumar', 'Warfarin', 1, 'CYP2C9, CYP3A4', 'Vitamin-K-Antagonist zur Blutverdünnung', '2-10 mg/Tag'),
('Xarelto', 'Rivaroxaban', 1, 'CYP3A4', 'Direkter Faktor-Xa-Inhibitor', '10-20 mg/Tag'),
('Eliquis', 'Apixaban', 1, 'CYP3A4', 'Direkter Faktor-Xa-Inhibitor', '5 mg 2x täglich'),
('Plavix', 'Clopidogrel', 1, 'CYP2C19', 'Thrombozytenaggregationshemmer', '75 mg/Tag'),

-- Antidepressiva (SSRI)
('Prozac', 'Fluoxetin', 2, 'CYP2D6, CYP2C9', 'Selektiver Serotonin-Wiederaufnahmehemmer', '20-80 mg/Tag'),
('Zoloft', 'Sertralin', 2, 'CYP2D6', 'Selektiver Serotonin-Wiederaufnahmehemmer', '50-200 mg/Tag'),
('Cipralex', 'Escitalopram', 2, 'CYP2C19, CYP3A4', 'Selektiver Serotonin-Wiederaufnahmehemmer', '10-20 mg/Tag'),
('Trevilor', 'Venlafaxin', 2, 'CYP2D6', 'Serotonin-Noradrenalin-Wiederaufnahmehemmer', '75-225 mg/Tag'),

-- Antiepileptika
('Keppra', 'Levetiracetam', 3, 'Keine', 'Antiepileptikum', '1000-3000 mg/Tag'),
('Lamictal', 'Lamotrigin', 3, 'UGT1A4', 'Antiepileptikum und Stimmungsstabilisator', '100-400 mg/Tag'),
('Depakote', 'Valproat', 3, 'CYP2C9', 'Antiepileptikum', '500-2000 mg/Tag'),
('Trileptal', 'Oxcarbazepin', 3, 'CYP3A4', 'Antiepileptikum', '600-2400 mg/Tag'),
('Onfi', 'Clobazam', 3, 'CYP2C19, CYP3A4', 'Benzodiazepin zur Epilepsiebehandlung', '10-40 mg/Tag'),

-- Schmerzmittel
('Ibuprofen', 'Ibuprofen', 4, 'CYP2C9', 'Nichtsteroidales Antirheumatikum', '400-800 mg bei Bedarf'),
('Aspirin', 'Acetylsalicylsäure', 4, 'Keine', 'Nichtsteroidales Antirheumatikum', '100-500 mg/Tag'),
('Tramal', 'Tramadol', 4, 'CYP2D6, CYP3A4', 'Opioid-Analgetikum', '50-400 mg/Tag'),
('OxyContin', 'Oxycodon', 4, 'CYP2D6, CYP3A4', 'Starkes Opioid-Analgetikum', '10-80 mg/Tag'),

-- Psychopharmaka
('Tavor', 'Lorazepam', 5, 'UGT2B7', 'Benzodiazepin gegen Angst', '1-4 mg/Tag'),
('Valium', 'Diazepam', 5, 'CYP2C19, CYP3A4', 'Benzodiazepin', '5-40 mg/Tag'),
('Rivotril', 'Clonazepam', 5, 'CYP3A4', 'Benzodiazepin', '0.5-4 mg/Tag'),
('Zyprexa', 'Olanzapin', 5, 'CYP1A2, CYP2D6', 'Atypisches Antipsychotikum', '5-20 mg/Tag'),

-- Statine
('Sortis', 'Atorvastatin', 6, 'CYP3A4', 'Cholesterinsenker', '10-80 mg/Tag'),
('Zocor', 'Simvastatin', 6, 'CYP3A4', 'Cholesterinsenker', '20-40 mg/Tag'),

-- Schilddrüsenmedikamente
('L-Thyroxin', 'Levothyroxin', 9, 'Keine', 'Schilddrüsenhormon', '25-200 µg/Tag'),

-- Immunsuppressiva
('Sandimmun', 'Ciclosporin', 8, 'CYP3A4', 'Immunsuppressivum', '2.5-5 mg/kg/Tag'),
('Prograf', 'Tacrolimus', 8, 'CYP3A4', 'Immunsuppressivum', '0.1-0.3 mg/kg/Tag');

-- CBD Wechselwirkungen einfügen
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
-- Warfarin (Marcumar)
(1, 'enhancement', 'critical', 'CBD kann die blutverdünnende Wirkung von Warfarin deutlich verstärken, was zu erhöhtem Blutungsrisiko führt.', 'CBD hemmt CYP2C9 und CYP3A4, die für den Abbau von Warfarin verantwortlich sind. Dies führt zu erhöhten Warfarin-Spiegeln im Blut.', 'Regelmäßige INR-Kontrollen erforderlich. Konsultieren Sie vor der CBD-Einnahme unbedingt Ihren Arzt. Möglicherweise muss die Warfarin-Dosis angepasst werden.', 'https://www.hanfosan.de/blog/wechselwirkungen-von-cbd-und-medikamenten.html'),

-- Rivaroxaban (Xarelto)
(2, 'enhancement', 'high', 'CBD kann die Wirkung von Rivaroxaban verstärken und das Blutungsrisiko erhöhen.', 'CBD hemmt CYP3A4, das primäre Enzym für den Metabolismus von Rivaroxaban.', 'Ärztliche Beratung vor CBD-Einnahme erforderlich. Auf Blutungszeichen achten.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9065521/'),

-- Apixaban (Eliquis)
(3, 'enhancement', 'high', 'Erhöhtes Blutungs- oder Thromboembolierisiko durch gemeinsamen Metabolismus.', 'CBD und Apixaban werden beide über CYP3A4 metabolisiert, was zu Wechselwirkungen führt.', 'Ärztliche Überwachung notwendig. Blutungsparameter regelmäßig kontrollieren.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9065521/'),

-- Clopidogrel (Plavix)
(4, 'enhancement', 'high', 'CBD kann die blutverdünnende Wirkung verstärken.', 'CBD beeinflusst CYP2C19, das für den Metabolismus von Clopidogrel wichtig ist.', 'Regelmäßige Kontrolle der Gerinnungswerte. Ärztliche Beratung erforderlich.', 'https://www.hanf-gesundheit.de/hanfwirkung/kann-cbd-mit-anderen-medikamenten-kombiniert-werden/'),

-- Fluoxetin (Prozac)
(5, 'enhancement', 'high', 'CBD kann die Konzentration von Fluoxetin im Blut erhöhen, was zu verstärkten Nebenwirkungen führen kann.', 'CBD hemmt CYP2D6 und CYP2C9, die für den Abbau von Fluoxetin verantwortlich sind.', 'Niedrigere CBD-Dosis empfohlen. Auf verstärkte Nebenwirkungen wie Schläfrigkeit, Übelkeit oder Unruhe achten. Ärztliche Rücksprache erforderlich.', 'https://dutchbalance.com/de/cbd-und-medikamente-achten-sie-auf-diese-wechselwirkungen/'),

-- Sertralin (Zoloft)
(6, 'enhancement', 'medium', 'Mögliche Erhöhung der Sertralin-Konzentration im Blut.', 'CBD hemmt CYP2D6, das am Metabolismus von Sertralin beteiligt ist.', 'Mit niedriger CBD-Dosis beginnen. Auf Nebenwirkungen achten. Ärztliche Beratung empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-antidepressiva'),

-- Escitalopram (Cipralex)
(7, 'enhancement', 'medium', 'CBD kann die Wirkung von Escitalopram verstärken.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Escitalopram beteiligt sind.', 'Vorsichtige Dosierung. Überwachung auf verstärkte sedative Effekte.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-antidepressiva'),

-- Venlafaxin (Trevilor)
(8, 'enhancement', 'medium', 'Mögliche Verstärkung der antidepressiven und sedativen Wirkung.', 'CBD hemmt CYP2D6, das für den Abbau von Venlafaxin wichtig ist.', 'Niedrige CBD-Startdosis. Auf verstärkte Müdigkeit achten.', 'https://hanfgefluester.de/blogs/body-mind/cbd-statt-antidepressiva'),

-- Levetiracetam (Keppra)
(9, 'neutral', 'low', 'Minimale Wechselwirkung, da Levetiracetam nicht über CYP450 metabolisiert wird.', 'Levetiracetam wird hauptsächlich über die Nieren ausgeschieden, nicht über CYP450-Enzyme.', 'CBD kann in der Regel sicher zusammen mit Levetiracetam eingenommen werden. Dennoch ärztliche Rücksprache empfohlen.', 'https://pubmed.ncbi.nlm.nih.gov/38655747/'),

-- Lamotrigin (Lamictal)
(10, 'neutral', 'low', 'Geringe direkte Wechselwirkung, aber Vorsicht geboten.', 'Lamotrigin wird hauptsächlich über UGT1A4 metabolisiert, nicht stark von CBD beeinflusst.', 'Überwachung auf mögliche additive sedierende Effekte. Ärztliche Beratung empfohlen.', 'https://www.mdpi.com/2077-0383/8/7/989'),

-- Valproat (Depakote)
(11, 'enhancement', 'high', 'CBD kann die Valproat-Konzentration erhöhen und das Risiko von Leberschäden steigern.', 'CBD hemmt CYP2C9 und könnte den Metabolismus von Valproat beeinflussen.', 'Regelmäßige Leberwertkontrollen erforderlich. Valproat-Spiegel überwachen. Ärztliche Überwachung notwendig.', 'https://link.springer.com/article/10.1007/s11606-020-06504-8'),

-- Oxcarbazepin (Trileptal)
(12, 'enhancement', 'medium', 'Mögliche Erhöhung der sedativen Effekte.', 'CBD hemmt CYP3A4, das am Metabolismus von Oxcarbazepin beteiligt ist.', 'Auf verstärkte Müdigkeit und Schwindel achten. Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2022.1055481/full'),

-- Clobazam (Onfi)
(13, 'enhancement', 'critical', 'CBD hemmt stark den Abbau von Clobazam, was zu erhöhten Blutspiegeln und verstärkten Nebenwirkungen führt.', 'CBD hemmt CYP2C19 und CYP3A4, die Hauptenzyme für den Abbau von Clobazam und seinem aktiven Metaboliten N-Desmethylclobazam.', 'Clobazam-Dosis muss möglicherweise um 50% reduziert werden. Engmaschige ärztliche Überwachung erforderlich. Auf starke Sedierung achten.', 'https://smokocbd.com/blogs/what-is-cbd-and-how-to-use-it/cbd-drug-interactions-to-know-in-2025-safe-use-tips'),

-- Ibuprofen
(14, 'enhancement', 'low', 'Leichte Verstärkung der entzündungshemmenden Wirkung möglich.', 'CBD hemmt CYP2C9, das am Metabolismus von Ibuprofen beteiligt ist.', 'In der Regel sicher kombinierbar. Bei hohen Dosen auf Magenbeschwerden achten.', 'https://www.hanfosan.de/blog/wechselwirkungen-von-cbd-und-medikamenten.html'),

-- Aspirin
(15, 'enhancement', 'low', 'Möglicherweise leicht erhöhtes Blutungsrisiko.', 'Beide haben blutverdünnende Eigenschaften, aber Aspirin wird nicht primär über CYP450 metabolisiert.', 'Vorsicht bei hohen Dosen. Auf Blutungsneigung achten.', 'https://www.hanf-gesundheit.de/hanfwirkung/kann-cbd-mit-anderen-medikamenten-kombiniert-werden/'),

-- Tramadol (Tramal)
(16, 'enhancement', 'high', 'Erhöhte Sedierung und Atemdepression möglich.', 'CBD hemmt CYP2D6 und CYP3A4, die für den Metabolismus von Tramadol wichtig sind.', 'Vorsicht bei der Kombination. Auf verstärkte Müdigkeit, Schwindel und Atemdepression achten. Ärztliche Überwachung erforderlich.', 'https://www.netdoktor.de/news/riskante-kombination-cannabis-und-medikamente/'),

-- Oxycodon (OxyContin)
(17, 'enhancement', 'critical', 'Stark erhöhtes Risiko für Atemdepression und Sedierung.', 'CBD hemmt CYP2D6 und CYP3A4. Die Kombination mit Opioiden kann zu gefährlicher Atemdepression führen.', 'Sehr vorsichtige Kombination nur unter engster ärztlicher Aufsicht. Auf Atemdepression, extreme Müdigkeit und Stürze achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Lorazepam (Tavor)
(18, 'enhancement', 'high', 'Verstärkte sedierende Wirkung und erhöhtes Sturzrisiko.', 'Lorazepam wird über UGT2B7 metabolisiert, aber CBD kann die sedative Wirkung additiv verstärken.', 'Niedrige CBD-Dosis empfohlen. Auf verstärkte Schläfrigkeit, Koordinationsprobleme und Sturzgefahr achten.', 'https://www.drugs.com/drug-interactions/cannabidiol-with-clonazepam-3919-0-703-0.html'),

-- Diazepam (Valium)
(19, 'enhancement', 'high', 'Stark erhöhte Sedierung möglich.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Diazepam beteiligt sind.', 'Dosisreduktion von Diazepam möglicherweise erforderlich. Auf extreme Müdigkeit und Koordinationsprobleme achten.', 'https://www.drugs.com/drug-interactions/cannabidiol-with-clonazepam-3919-0-703-0.html'),

-- Clonazepam (Rivotril)
(20, 'enhancement', 'high', 'Erhöhte Schläfrigkeit, Verwirrung und Koordinationsprobleme möglich.', 'CBD hemmt CYP3A4, das am Metabolismus von Clonazepam beteiligt ist.', 'Vorsichtige Kombination. Auf Schwindel, Schläfrigkeit, Verwirrung und Koordinationsschwierigkeiten achten. Besonders bei älteren Patienten erhöhtes Sturzrisiko.', 'https://www.drugs.com/drug-interactions/cannabidiol-with-clonazepam-3919-0-703-0.html'),

-- Olanzapin (Zyprexa)
(21, 'enhancement', 'medium', 'Verstärkte sedierende Wirkung möglich.', 'CBD hemmt CYP1A2 und CYP2D6, die am Metabolismus von Olanzapin beteiligt sind.', 'Auf verstärkte Müdigkeit und metabolische Nebenwirkungen achten. Ärztliche Überwachung empfohlen.', 'https://www.netdoktor.de/news/riskante-kombination-cannabis-und-medikamente/'),

-- Atorvastatin (Sortis)
(22, 'enhancement', 'medium', 'CBD kann Nebenwirkungen der Statine wie Muskelschmerzen verstärken.', 'CBD hemmt CYP3A4, das primäre Enzym für den Metabolismus von Atorvastatin.', 'Auf Muskelschmerzen, Schwäche oder dunklen Urin achten. Bei Symptomen sofort Arzt konsultieren.', 'https://mycannaby.de/blogs/magazin/cbd-wechselwirkungen'),

-- Simvastatin (Zocor)
(23, 'enhancement', 'medium', 'Erhöhtes Risiko für Myopathie und Rhabdomyolyse.', 'CBD hemmt CYP3A4, was zu erhöhten Simvastatin-Spiegeln führen kann.', 'Engmaschige Überwachung der Leberwerte und Muskelenzyme. Bei Muskelschmerzen sofort Arzt aufsuchen.', 'https://mycannaby.de/blogs/magazin/cbd-wechselwirkungen'),

-- Levothyroxin (L-Thyroxin)
(24, 'enhancement', 'medium', 'CBD kann die Schilddrüsenhormon-Spiegel beeinflussen.', 'CBD könnte den Metabolismus von Levothyroxin verändern, Mechanismus noch nicht vollständig verstanden.', 'Regelmäßige Kontrolle der Schilddrüsenwerte (TSH, fT3, fT4). Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.msdmanuals.com/de/heim/spezialthemen/nahrungserg%C3%A4nzungsmittel-und-vitamine/cannabidiol-cbd'),

-- Ciclosporin (Sandimmun)
(25, 'enhancement', 'critical', 'Erhöhtes Risiko für Toxizität und Abstoßungsreaktionen.', 'CBD hemmt CYP3A4, das Hauptenzym für den Metabolismus von Ciclosporin. Dies kann zu stark erhöhten oder erniedrigten Spiegeln führen.', 'Nur unter engster ärztlicher Überwachung kombinieren. Regelmäßige Spiegelkontrollen erforderlich. Bei Transplantationspatienten besondere Vorsicht.', 'https://dutchnaturalhealing.com/blogs/cbd/medication-cbd-oil-can-interact-with-this-is-what-you-need-to-know'),

-- Tacrolimus (Prograf)
(26, 'enhancement', 'critical', 'Hohes Risiko für Toxizität bei Transplantationspatienten.', 'CBD hemmt CYP3A4, was zu unvorhersehbaren Tacrolimus-Spiegeln führen kann.', 'Nur unter strengster ärztlicher Kontrolle. Regelmäßige Spiegelkontrollen zwingend erforderlich. Abstoßungsrisiko bei Fehlsteuerung.', 'https://dutchnaturalhealing.com/blogs/cbd/medication-cbd-oil-can-interact-with-this-is-what-you-need-to-know');

-- CBD Dosierungs-Richtlinien
INSERT OR IGNORE INTO cbd_dosage_guidelines (condition_type, min_dosage_mg, max_dosage_mg, recommended_start_mg, adjustment_period_days, notes) VALUES
('general', 5, 200, 10, 7, 'Allgemeine Mikrodosierung für gesunde Erwachsene ohne Medikamenteneinnahme. Langsame Steigerung empfohlen.'),
('with_low_interaction', 5, 100, 5, 14, 'Bei Medikamenten mit niedriger Wechselwirkung (z.B. Levetiracetam). Sehr langsame Dosissteigerung.'),
('with_medium_interaction', 2.5, 50, 2.5, 14, 'Bei Medikamenten mit mittlerer Wechselwirkung (z.B. Statine, Ibuprofen). Start mit sehr niedriger Dosis.'),
('with_high_interaction', 2.5, 25, 2.5, 21, 'Bei Medikamenten mit hoher Wechselwirkung (z.B. Antidepressiva, Benzodiazepine). Nur unter ärztlicher Aufsicht.'),
('with_critical_interaction', 0, 10, 0, 30, 'Bei kritischen Wechselwirkungen (z.B. Warfarin, Immunsuppressiva). Nur nach ausdrücklicher ärztlicher Genehmigung und unter engster Überwachung.');
