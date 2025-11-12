-- Medikamenten-Kategorien einfügen (erweitert)
INSERT OR IGNORE INTO medication_categories (name, description, risk_level) VALUES
('Blutverdünner', 'Medikamente zur Hemmung der Blutgerinnung', 'high'),
('Antidepressiva', 'SSRI, SNRI, TCA und andere Antidepressiva', 'high'),
('Antiepileptika', 'Medikamente zur Behandlung von Epilepsie', 'high'),
('Schmerzmittel', 'Analgetika, NSRA und Opioide', 'medium'),
('Psychopharmaka', 'Antipsychotika und Benzodiazepine', 'high'),
('Statine', 'Cholesterinsenker', 'medium'),
('Antibiotika', 'Antimikrobielle Medikamente', 'medium'),
('Immunsuppressiva', 'Medikamente zur Unterdrückung des Immunsystems', 'high'),
('Schilddrüsenmedikamente', 'Hormone für die Schilddrüsenfunktion', 'medium'),
('Antikoagulantien', 'Gerinnungshemmer', 'very_high'),
('Blutdrucksenker', 'Antihypertensiva (ACE-Hemmer, Sartane, Betablocker)', 'medium'),
('Protonenpumpenhemmer', 'Magenschutzmedikamente', 'low'),
('Diabetesmedikamente', 'Antidiabetika und Insulin', 'medium'),
('Asthma-Medikamente', 'Bronchodilatatoren und Kortikosteroide', 'low'),
('ADHS-Medikamente', 'Stimulanzien zur ADHS-Behandlung', 'medium');

-- Erweiterte Medikamentenliste einfügen
INSERT OR IGNORE INTO medications (name, generic_name, category_id, cyp450_enzyme, description, common_dosage) VALUES
-- Blutverdünner
('Marcumar', 'Warfarin', 1, 'CYP2C9, CYP3A4', 'Vitamin-K-Antagonist zur Blutverdünnung', '2-10 mg/Tag'),
('Xarelto', 'Rivaroxaban', 1, 'CYP3A4', 'Direkter Faktor-Xa-Inhibitor', '10-20 mg/Tag'),
('Eliquis', 'Apixaban', 1, 'CYP3A4', 'Direkter Faktor-Xa-Inhibitor', '5 mg 2x täglich'),
('Plavix', 'Clopidogrel', 1, 'CYP2C19', 'Thrombozytenaggregationshemmer', '75 mg/Tag'),

-- Antidepressiva
('Prozac', 'Fluoxetin', 2, 'CYP2D6, CYP2C9', 'Selektiver Serotonin-Wiederaufnahmehemmer (SSRI)', '20-80 mg/Tag'),
('Zoloft', 'Sertralin', 2, 'CYP2D6', 'Selektiver Serotonin-Wiederaufnahmehemmer (SSRI)', '50-200 mg/Tag'),
('Cipralex', 'Escitalopram', 2, 'CYP2C19, CYP3A4', 'Selektiver Serotonin-Wiederaufnahmehemmer (SSRI)', '10-20 mg/Tag'),
('Trevilor', 'Venlafaxin', 2, 'CYP2D6', 'Serotonin-Noradrenalin-Wiederaufnahmehemmer (SNRI)', '75-225 mg/Tag'),
('Cymbalta', 'Duloxetin', 2, 'CYP2D6, CYP1A2', 'Serotonin-Noradrenalin-Wiederaufnahmehemmer (SSNRI)', '30-120 mg/Tag'),
('Saroten', 'Amitriptylin', 2, 'CYP2C19, CYP2D6', 'Trizyklisches Antidepressivum (TCA)', '25-150 mg/Tag'),
('Stangyl', 'Trimipramin', 2, 'CYP2D6, CYP2C19', 'Trizyklisches Antidepressivum (TCA)', '50-300 mg/Tag'),

-- Antiepileptika
('Keppra', 'Levetiracetam', 3, 'Keine', 'Antiepileptikum', '1000-3000 mg/Tag'),
('Lamictal', 'Lamotrigin', 3, 'UGT1A4', 'Antiepileptikum und Stimmungsstabilisator', '100-400 mg/Tag'),
('Depakote', 'Valproat', 3, 'CYP2C9', 'Antiepileptikum', '500-2000 mg/Tag'),
('Trileptal', 'Oxcarbazepin', 3, 'CYP3A4', 'Antiepileptikum', '600-2400 mg/Tag'),
('Onfi', 'Clobazam', 3, 'CYP2C19, CYP3A4', 'Benzodiazepin zur Epilepsiebehandlung', '10-40 mg/Tag'),
('Lyrica', 'Pregabalin', 3, 'Keine', 'Antikonvulsivum und Schmerzmittel', '150-600 mg/Tag'),

-- Schmerzmittel
('Ibuprofen', 'Ibuprofen', 4, 'CYP2C9', 'Nichtsteroidales Antirheumatikum (NSRA)', '400-800 mg bei Bedarf'),
('Aspirin', 'Acetylsalicylsäure', 4, 'Keine', 'Nichtsteroidales Antirheumatikum (NSRA)', '100-500 mg/Tag'),
('Voltaren', 'Diclofenac', 4, 'CYP2C9', 'Nichtsteroidales Antirheumatikum (NSRA)', '75-150 mg/Tag'),
('Tramal', 'Tramadol', 4, 'CYP2D6, CYP3A4', 'Opioid-Analgetikum', '50-400 mg/Tag'),
('OxyContin', 'Oxycodon', 4, 'CYP2D6, CYP3A4', 'Starkes Opioid-Analgetikum', '10-80 mg/Tag'),
('Novalgin', 'Metamizol', 4, 'Keine', 'Nicht-opioide Analgetikum (Pyrazolon)', '500-1000 mg bei Bedarf'),

-- Psychopharmaka
('Tavor', 'Lorazepam', 5, 'UGT2B7', 'Benzodiazepin gegen Angst', '1-4 mg/Tag'),
('Valium', 'Diazepam', 5, 'CYP2C19, CYP3A4', 'Benzodiazepin', '5-40 mg/Tag'),
('Rivotril', 'Clonazepam', 5, 'CYP3A4', 'Benzodiazepin', '0.5-4 mg/Tag'),
('Lexotanil', 'Bromazepam', 5, 'CYP3A4', 'Benzodiazepin gegen Angst', '1.5-18 mg/Tag'),
('Zyprexa', 'Olanzapin', 5, 'CYP1A2, CYP2D6', 'Atypisches Antipsychotikum', '5-20 mg/Tag'),
('Abilify', 'Aripiprazol', 5, 'CYP2D6, CYP3A4', 'Atypisches Antipsychotikum', '10-30 mg/Tag'),

-- Statine
('Sortis', 'Atorvastatin', 6, 'CYP3A4', 'Cholesterinsenker', '10-80 mg/Tag'),
('Zocor', 'Simvastatin', 6, 'CYP3A4', 'Cholesterinsenker', '20-40 mg/Tag'),

-- Immunsuppressiva
('Sandimmun', 'Ciclosporin', 8, 'CYP3A4', 'Immunsuppressivum', '2.5-5 mg/kg/Tag'),
('Prograf', 'Tacrolimus', 8, 'CYP3A4', 'Immunsuppressivum', '0.1-0.3 mg/kg/Tag'),

-- Schilddrüsenmedikamente
('L-Thyroxin', 'Levothyroxin', 9, 'Keine', 'Schilddrüsenhormon', '25-200 µg/Tag'),

-- Blutdrucksenker
('Zestril', 'Lisinopril', 11, 'Keine', 'ACE-Hemmer', '10-40 mg/Tag'),
('Blopress', 'Candesartan', 11, 'CYP2C9', 'Angiotensin-II-Rezeptor-Antagonist (Sartan)', '8-32 mg/Tag'),
('Norvasc', 'Amlodipin', 11, 'CYP3A4', 'Calcium-Kanal-Blocker', '5-10 mg/Tag'),
('Diovan', 'Valsartan', 11, 'Keine', 'Angiotensin-II-Rezeptor-Antagonist (Sartan)', '80-320 mg/Tag'),

-- Protonenpumpenhemmer
('Antra', 'Omeprazol', 12, 'CYP2C19, CYP3A4', 'Protonenpumpenhemmer (Magenschutz)', '20-40 mg/Tag'),
('Agopton', 'Lansoprazol', 12, 'CYP2C19, CYP3A4', 'Protonenpumpenhemmer (Magenschutz)', '15-30 mg/Tag'),
('Pantozol', 'Pantoprazol', 12, 'CYP2C19', 'Protonenpumpenhemmer (Magenschutz)', '20-40 mg/Tag'),

-- Diabetesmedikamente
('Glucophage', 'Metformin', 13, 'Keine', 'Orales Antidiabetikum', '500-2000 mg/Tag'),
('Januvia', 'Sitagliptin', 13, 'CYP3A4', 'DPP-4-Hemmer', '100 mg/Tag'),

-- Asthma-Medikamente
('Ventolin', 'Salbutamol', 14, 'Keine', 'Beta-2-Sympathomimetikum (Bronchodilatator)', '100-200 µg bei Bedarf'),
('Singulair', 'Montelukast', 14, 'CYP3A4, CYP2C9', 'Leukotrien-Rezeptor-Antagonist', '10 mg/Tag'),
('Flutide', 'Fluticason', 14, 'CYP3A4', 'Inhalatives Kortikosteroid', '100-500 µg 2x täglich'),

-- ADHS-Medikamente
('Medikinet', 'Methylphenidat', 15, 'Keine', 'Psychostimulans zur ADHS-Behandlung', '10-60 mg/Tag'),

-- Weitere Medikamente
('Zantac', 'Ranitidin', 12, 'CYP3A4, CYP2D6', 'H2-Rezeptor-Antagonist (Magenschutz)', '150-300 mg/Tag'),
('Imodium', 'Loperamid', 4, 'CYP3A4, CYP2C8', 'Antidiarrhoikum', '2-16 mg/Tag'),
('Femara', 'Letrozol', 8, 'CYP3A4, CYP2A6', 'Aromatasehemmer (Krebstherapie)', '2.5 mg/Tag'),

-- Weitere Antidepressiva (NEU)
('Elontril', 'Bupropion', 2, 'CYP2B6', 'Atypisches Antidepressivum (NDRI - Noradrenalin-Dopamin-Wiederaufnahmehemmer)', '150-300 mg/Tag');

-- ALLE CBD-Wechselwirkungen (erweitert und aktualisiert)
INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES

-- Blutverdünner (ID 1-4)
(1, 'enhancement', 'critical', 'CBD kann die blutverdünnende Wirkung von Warfarin deutlich verstärken, was zu erhöhtem Blutungsrisiko führt.', 'CBD hemmt CYP2C9 und CYP3A4, die für den Abbau von Warfarin verantwortlich sind. Dies führt zu erhöhten Warfarin-Spiegeln im Blut.', 'Regelmäßige INR-Kontrollen erforderlich. Konsultieren Sie vor der CBD-Einnahme unbedingt Ihren Arzt. Möglicherweise muss die Warfarin-Dosis angepasst werden.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-blutverduenner'),

(2, 'enhancement', 'high', 'CBD kann die Wirkung von Rivaroxaban verstärken und das Blutungsrisiko erhöhen.', 'CBD hemmt CYP3A4, das primäre Enzym für den Metabolismus von Rivaroxaban.', 'Ärztliche Beratung vor CBD-Einnahme erforderlich. Auf Blutungszeichen achten (z.B. ungewöhnliche Blutergüsse, Nasenbluten).', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(3, 'enhancement', 'high', 'Erhöhtes Blutungs- oder Thromboembolierisiko durch gemeinsamen Metabolismus.', 'CBD und Apixaban werden beide über CYP3A4 metabolisiert, was zu Wechselwirkungen führt.', 'Ärztliche Überwachung notwendig. Blutungsparameter regelmäßig kontrollieren.', 'https://mycannaby.de/blogs/magazin/cbd-wechselwirkungen'),

(4, 'enhancement', 'high', 'CBD kann die blutverdünnende Wirkung verstärken.', 'CBD beeinflusst CYP2C19, das für den Metabolismus von Clopidogrel wichtig ist.', 'Regelmäßige Kontrolle der Gerinnungswerte. Ärztliche Beratung erforderlich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Antidepressiva (ID 5-11)
(5, 'enhancement', 'high', 'CBD kann die Konzentration von Fluoxetin im Blut erhöhen, was zu verstärkten Nebenwirkungen führen kann.', 'CBD hemmt CYP2D6 und CYP2C9, die für den Abbau von Fluoxetin verantwortlich sind.', 'Niedrigere CBD-Dosis empfohlen. Auf verstärkte Nebenwirkungen wie Schläfrigkeit, Übelkeit oder Unruhe achten. Ärztliche Rücksprache erforderlich.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-fluoxetin'),

(6, 'enhancement', 'high', 'Mögliche Erhöhung der Sertralin-Konzentration im Blut. In Erfahrungsberichten wurden Halluzinationen, Übelkeit und Durchfall berichtet.', 'CBD hemmt CYP2D6, das am Metabolismus von Sertralin beteiligt ist.', 'Mit niedriger CBD-Dosis beginnen. Auf Nebenwirkungen achten. Bei Halluzinationen oder starkem Unwohlsein sofort Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-sertralin'),

(7, 'enhancement', 'medium', 'CBD kann die Wirkung von Escitalopram verstärken.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Escitalopram beteiligt sind.', 'Vorsichtige Dosierung. Überwachung auf verstärkte sedative Effekte.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-antidepressiva'),

(8, 'enhancement', 'medium', 'Mögliche Verstärkung der antidepressiven und sedativen Wirkung.', 'CBD hemmt CYP2D6, das für den Abbau von Venlafaxin wichtig ist.', 'Niedrige CBD-Startdosis. Auf verstärkte Müdigkeit achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-antidepressiva'),

(9, 'enhancement', 'high', 'CBD kann zu Herzrasen und Übelkeit führen. Verstärkung der Nebenwirkungen möglich.', 'CBD hemmt CYP2D6 und CYP1A2, die am Metabolismus von Duloxetin beteiligt sind.', 'Vorsichtige Kombination nur unter ärztlicher Aufsicht. Bei Herzrasen CBD-Dosis reduzieren oder absetzen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(10, 'enhancement', 'high', 'Verstärkung der sedativen Wirkung. Risiko für Magenschmerzen und Unwohlsein.', 'CBD hemmt CYP2C19 und CYP2D6, die Enzyme für den Abbau von Amitriptylin.', 'Niedrige CBD-Dosis empfohlen. Auf verstärkte Müdigkeit, Schwindel und Magenbeschwerden achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(11, 'enhancement', 'high', 'Mögliche Albträume, Durchfall und verstärkte sedierende Wirkung.', 'CBD hemmt CYP2D6 und CYP2C19, die für den Abbau von Trimipramin wichtig sind.', 'Vorsichtige Dosierung. Bei Albträumen oder starken Nebenwirkungen Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(98, 'enhancement', 'high', 'CBD hemmt CYP2B6 und kann den Bupropion-Spiegel im Blut erhöhen. Dadurch steigt das Risiko für Nebenwirkungen wie Kopfschmerzen, Schlafstörungen, Reizbarkeit, Tremor und Unruhe. In seltenen Fällen kann die Krampfschwelle sinken.', 'Bupropion wird hauptsächlich über das Enzym CYP2B6 in der Leber verstoffwechselt. CBD hemmt dieses Enzym, wodurch Bupropion langsamer abgebaut wird und sich im Blut anreichern kann.', 'Ärztliche Kontrolle unbedingt erforderlich. Dosisanpassung des Antidepressivums kann notwendig sein. Plan mit besonders langsamer Einschleichphase wird empfohlen. Auf verstärkte Nebenwirkungen achten (Kopfschmerzen, Schlaflosigkeit, Unruhe, Zittern). Bei Krampfanfällen sofort Arzt kontaktieren.', 'Anderson LL et al. (2021) Frontiers in Pharmacology 12:646 | Geffrey AL et al. (2015) Epilepsia 56(8):1246 | FDA Label Elontril (2022)'),

-- Antiepileptika (ID 12-17)
(12, 'neutral', 'low', 'Minimale Wechselwirkung, da Levetiracetam nicht über CYP450 metabolisiert wird.', 'Levetiracetam wird hauptsächlich über die Nieren ausgeschieden, nicht über CYP450-Enzyme.', 'CBD kann in der Regel sicher zusammen mit Levetiracetam eingenommen werden. Dennoch ärztliche Rücksprache empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(13, 'neutral', 'low', 'Geringe direkte Wechselwirkung, aber Vorsicht geboten.', 'Lamotrigin wird hauptsächlich über UGT1A4 metabolisiert, nicht stark von CBD beeinflusst.', 'Überwachung auf mögliche additive sedierende Effekte. Ärztliche Beratung empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(14, 'enhancement', 'high', 'CBD kann die Valproat-Konzentration erhöhen und das Risiko von Leberschäden steigern.', 'CBD hemmt CYP2C9 und könnte den Metabolismus von Valproat beeinflussen.', 'Regelmäßige Leberwertkontrollen erforderlich. Valproat-Spiegel überwachen. Ärztliche Überwachung notwendig.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(15, 'enhancement', 'medium', 'Mögliche Erhöhung der sedativen Effekte.', 'CBD hemmt CYP3A4, das am Metabolismus von Oxcarbazepin beteiligt ist.', 'Auf verstärkte Müdigkeit und Schwindel achten. Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(16, 'enhancement', 'critical', 'CBD hemmt stark den Abbau von Clobazam, was zu erhöhten Blutspiegeln und verstärkten Nebenwirkungen führt.', 'CBD hemmt CYP2C19 und CYP3A4, die Hauptenzyme für den Abbau von Clobazam und seinem aktiven Metaboliten N-Desmethylclobazam.', 'Clobazam-Dosis muss möglicherweise um 50% reduziert werden. Engmaschige ärztliche Überwachung erforderlich. Auf starke Sedierung achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(17, 'enhancement', 'medium', 'Mögliche Durchfall und Übelkeit. Verstärkung der Nebenwirkungen.', 'Pregabalin wird nicht über CYP450 metabolisiert, aber additive Effekte möglich.', 'Niedrige CBD-Dosis empfohlen. Auf gastrointestinale Nebenwirkungen achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Schmerzmittel (ID 18-23)
(18, 'enhancement', 'low', 'Leichte Verstärkung der entzündungshemmenden Wirkung möglich.', 'CBD hemmt CYP2C9, das am Metabolismus von Ibuprofen beteiligt ist.', 'In der Regel sicher kombinierbar. Bei hohen Dosen auf Magenbeschwerden achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(19, 'enhancement', 'low', 'Möglicherweise leicht erhöhtes Blutungsrisiko.', 'Beide haben blutverdünnende Eigenschaften, aber Aspirin wird nicht primär über CYP450 metabolisiert.', 'Vorsicht bei hohen Dosen. Auf Blutungsneigung achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(20, 'enhancement', 'medium', 'Mögliche Durchfall bei Kombination. Verstärkung der entzündungshemmenden Wirkung.', 'CBD hemmt CYP2C9, das für den Metabolismus von Diclofenac wichtig ist.', 'Bei gastrointestinalen Beschwerden CBD-Dosis reduzieren. Magenschutz in Betracht ziehen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(21, 'enhancement', 'high', 'Erhöhte Sedierung und Atemdepression möglich.', 'CBD hemmt CYP2D6 und CYP3A4, die für den Metabolismus von Tramadol wichtig sind.', 'Vorsicht bei der Kombination. Auf verstärkte Müdigkeit, Schwindel und Atemdepression achten. Ärztliche Überwachung erforderlich.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(22, 'enhancement', 'critical', 'Stark erhöhtes Risiko für Atemdepression und Sedierung.', 'CBD hemmt CYP2D6 und CYP3A4. Die Kombination mit Opioiden kann zu gefährlicher Atemdepression führen.', 'Sehr vorsichtige Kombination nur unter engster ärztlicher Aufsicht. Auf Atemdepression, extreme Müdigkeit und Stürze achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(23, 'enhancement', 'low', 'Mögliche Verstärkung der analgetischen Wirkung. Geringe Wechselwirkung.', 'Metamizol wird nicht primär über CYP450 metabolisiert, aber additive Effekte möglich.', 'In der Regel gut verträglich. Bei Magenschmerzen oder Unwohlsein Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-metamizol'),

-- Psychopharmaka (ID 24-29)
(24, 'enhancement', 'high', 'Verstärkte sedierende Wirkung und erhöhtes Sturzrisiko.', 'Lorazepam wird über UGT2B7 metabolisiert, aber CBD kann die sedative Wirkung additiv verstärken.', 'Niedrige CBD-Dosis empfohlen. Auf verstärkte Schläfrigkeit, Koordinationsprobleme und Sturzgefahr achten. Besonders bei älteren Patienten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(25, 'enhancement', 'high', 'Stark erhöhte Sedierung möglich. Schwäche, Benommenheit und Schwindel.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Diazepam beteiligt sind.', 'Dosisreduktion von Diazepam möglicherweise erforderlich. Auf extreme Müdigkeit und Koordinationsprobleme achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(26, 'enhancement', 'high', 'Erhöhte Schläfrigkeit, Verwirrung und Koordinationsprobleme möglich.', 'CBD hemmt CYP3A4, das am Metabolismus von Clonazepam beteiligt ist.', 'Vorsichtige Kombination. Auf Schwindel, Schläfrigkeit, Verwirrung und Koordinationsschwierigkeiten achten. Besonders bei älteren Patienten erhöhtes Sturzrisiko.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(27, 'enhancement', 'high', 'Herzrasen und Unwohlsein möglich bei Kombination.', 'CBD hemmt CYP3A4, das für den Metabolismus von Bromazepam wichtig ist.', 'Niedrige CBD-Dosis. Bei Herzrasen oder starkem Unwohlsein sofort Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(28, 'enhancement', 'medium', 'Verstärkte sedierende Wirkung möglich.', 'CBD hemmt CYP1A2 und CYP2D6, die am Metabolismus von Olanzapin beteiligt sind.', 'Auf verstärkte Müdigkeit und metabolische Nebenwirkungen achten. Ärztliche Überwachung empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(29, 'enhancement', 'high', 'Herzrasen und Übelkeit möglich. Verstärkung der Nebenwirkungen.', 'CBD hemmt CYP2D6 und CYP3A4, die für den Metabolismus von Aripiprazol wichtig sind.', 'Vorsichtige Dosierung. Bei Herzrasen oder Übelkeit CBD-Dosis reduzieren oder absetzen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Statine (ID 30-31)
(30, 'enhancement', 'medium', 'CBD kann Nebenwirkungen der Statine wie Muskelschmerzen verstärken. Benommenheit möglich.', 'CBD hemmt CYP3A4, das primäre Enzym für den Metabolismus von Atorvastatin.', 'Auf Muskelschmerzen, Schwäche oder dunklen Urin achten. Bei Symptomen sofort Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-cholesterinsenker'),

(31, 'enhancement', 'medium', 'Erhöhtes Risiko für Myopathie und Rhabdomyolyse.', 'CBD hemmt CYP3A4, was zu erhöhten Simvastatin-Spiegeln führen kann.', 'Engmaschige Überwachung der Leberwerte und Muskelenzyme. Bei Muskelschmerzen sofort Arzt aufsuchen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-cholesterinsenker'),

-- Immunsuppressiva (ID 32-33)
(32, 'enhancement', 'critical', 'Erhöhtes Risiko für Toxizität und Abstoßungsreaktionen.', 'CBD hemmt CYP3A4, das Hauptenzym für den Metabolismus von Ciclosporin. Dies kann zu stark erhöhten oder erniedrigten Spiegeln führen.', 'Nur unter engster ärztlicher Überwachung kombinieren. Regelmäßige Spiegelkontrollen erforderlich. Bei Transplantationspatienten besondere Vorsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(33, 'enhancement', 'critical', 'Hohes Risiko für Toxizität bei Transplantationspatienten.', 'CBD hemmt CYP3A4, was zu unvorhersehbaren Tacrolimus-Spiegeln führen kann.', 'Nur unter strengster ärztlicher Kontrolle. Regelmäßige Spiegelkontrollen zwingend erforderlich. Abstoßungsrisiko bei Fehlsteuerung.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Schilddrüsenmedikamente (ID 34)
(34, 'enhancement', 'medium', 'CBD kann die Schilddrüsenhormon-Spiegel beeinflussen. Übelkeit und Durchfall möglich.', 'CBD könnte den Metabolismus von Levothyroxin verändern, Mechanismus noch nicht vollständig verstanden.', 'Regelmäßige Kontrolle der Schilddrüsenwerte (TSH, fT3, fT4). Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-levothyroxin'),

-- Blutdrucksenker (ID 35-38)
(35, 'enhancement', 'medium', 'Mögliche Verstärkung der blutdrucksenkenden Wirkung.', 'Lisinopril wird nicht über CYP450 metabolisiert, aber CBD selbst kann den Blutdruck senken.', 'Regelmäßige Blutdruckkontrolle. Bei zu niedrigem Blutdruck oder Schwindel Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-lisinopril'),

(36, 'enhancement', 'medium', 'Übelkeit und Durchfall möglich. Verstärkung der Blutdrucksenkung.', 'CBD beeinflusst CYP2C9, das am Metabolismus von Candesartan beteiligt ist.', 'Blutdruck regelmäßig kontrollieren. Bei Nebenwirkungen CBD-Dosis reduzieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(37, 'enhancement', 'medium', 'Verstärkung der blutdrucksenkenden Wirkung möglich.', 'CBD hemmt CYP3A4, das für den Metabolismus von Amlodipin wichtig ist.', 'Regelmäßige Blutdruckkontrolle. Auf Schwindel und Benommenheit achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

(38, 'enhancement', 'medium', 'Allergische Hautreaktionen möglich. Verstärkung der blutdrucksenkenden Wirkung.', 'Valsartan wird nicht primär über CYP450 metabolisiert, aber additive Effekte möglich.', 'Bei allergischen Reaktionen (Hautausschlag, Juckreiz) sofort Arzt konsultieren. Blutdruck überwachen.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Protonenpumpenhemmer (ID 39-41)
(39, 'enhancement', 'medium', 'Kreislaufprobleme möglich bei Kombination.', 'CBD hemmt CYP2C19 und CYP3A4, die für den Metabolismus von Omeprazol wichtig sind.', 'Bei Kreislaufproblemen oder Schwindel CBD-Dosis reduzieren. Ärztliche Rücksprache empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-omeprazol'),

(40, 'enhancement', 'low', 'Mögliche Verstärkung der Wirkung, aber geringe Wechselwirkung erwartet.', 'CBD hemmt CYP2C19 und CYP3A4, die am Metabolismus von Lansoprazol beteiligt sind.', 'In der Regel gut verträglich. Auf mögliche gastrointestinale Symptome achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-lansoprazol'),

(41, 'enhancement', 'low', 'Geringe Wechselwirkung, gut verträglich.', 'CBD hemmt CYP2C19, das primäre Enzym für den Metabolismus von Pantoprazol.', 'Normalerweise unproblematisch. Bei Beschwerden Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-pantoprazol'),

-- Diabetesmedikamente (ID 42-43)
(42, 'neutral', 'low', 'Keine direkte Wechselwirkung erwartet, aber CBD kann den Blutzucker beeinflussen.', 'Metformin wird nicht über CYP450 metabolisiert. CBD könnte jedoch den Glukosestoffwechsel beeinflussen.', 'Regelmäßige Blutzuckerkontrolle. Bei Unterzucker-Symptomen Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-metformin'),

(43, 'enhancement', 'low', 'Mögliche Beeinflussung des Blutzuckerspiegels.', 'CBD hemmt CYP3A4, das am Metabolismus von Sitagliptin beteiligt ist.', 'Blutzucker regelmäßig überwachen. Dosisanpassung unter ärztlicher Aufsicht.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-sitagliptin'),

-- Asthma-Medikamente (ID 44-46)
(44, 'neutral', 'low', 'Keine direkte Wechselwirkung erwartet.', 'Salbutamol wird nicht über CYP450 metabolisiert.', 'Normalerweise sicher kombinierbar. Bei Atembeschwerden sofort Arzt aufsuchen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-salbutamol-albuterol'),

(45, 'enhancement', 'low', 'Geringe Wechselwirkung möglich.', 'CBD hemmt CYP3A4 und CYP2C9, die am Metabolismus von Montelukast beteiligt sind.', 'In der Regel gut verträglich. Auf Kopfschmerzen oder gastrointestinale Symptome achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-montelukast'),

(46, 'enhancement', 'low', 'Mögliche Verstärkung der Kortikosteroid-Wirkung.', 'CBD hemmt CYP3A4, das für den Metabolismus von Fluticason wichtig ist.', 'Normalerweise unproblematisch bei inhalativer Anwendung. Systemische Effekte selten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-fluticason'),

-- ADHS-Medikamente (ID 47)
(47, 'enhancement', 'medium', 'Magenschmerzen möglich bei Kombination. Beeinflussung der Wirkung.', 'Methylphenidat wird nicht primär über CYP450 metabolisiert, aber Interaktion mit zentralem Nervensystem möglich.', 'Vorsichtige Kombination. Auf Magenbeschwerden, Herzrasen oder Unruhe achten. Ärztliche Überwachung empfohlen.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-methylphenidat'),

-- Weitere Medikamente (ID 48-50)
(48, 'enhancement', 'low', 'Mögliche Verstärkung der Wirkung, aber geringe Wechselwirkung.', 'CBD hemmt CYP3A4 und CYP2D6, die am Metabolismus von Ranitidin beteiligt sind.', 'Normalerweise gut verträglich. Bei Nebenwirkungen Arzt konsultieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-ranitidin'),

(49, 'enhancement', 'low', 'Geringe Wechselwirkung möglich bei hohen Dosen.', 'CBD hemmt CYP3A4 und CYP2C8, die am Metabolismus von Loperamid beteiligt sind.', 'In der Regel sicher. Bei sehr hohen CBD-Dosen auf verstärkte Obstipation achten.', 'https://www.nordicoil.de/blogs/cbd/cbd-und-loperamid'),

(50, 'enhancement', 'medium', 'Mögliche Heißhunger, Schlaflosigkeit und Gelenkschmerzen.', 'CBD hemmt CYP3A4 und CYP2A6, die für den Metabolismus von Letrozol wichtig sind.', 'Engmaschige Überwachung bei Krebstherapie. Bei neuen Symptomen sofort Onkologen informieren.', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');

-- CBD Dosierungs-Richtlinien (unverändert)
INSERT OR IGNORE INTO cbd_dosage_guidelines (condition_type, min_dosage_mg, max_dosage_mg, recommended_start_mg, adjustment_period_days, notes) VALUES
('general', 5, 200, 10, 7, 'Allgemeine Mikrodosierung für gesunde Erwachsene ohne Medikamenteneinnahme. Langsame Steigerung empfohlen.'),
('with_low_interaction', 5, 100, 5, 14, 'Bei Medikamenten mit niedriger Wechselwirkung (z.B. Levetiracetam, Salbutamol). Sehr langsame Dosissteigerung.'),
('with_medium_interaction', 2.5, 50, 2.5, 14, 'Bei Medikamenten mit mittlerer Wechselwirkung (z.B. Statine, Ibuprofen, Blutdrucksenker). Start mit sehr niedriger Dosis.'),
('with_high_interaction', 2.5, 25, 2.5, 21, 'Bei Medikamenten mit hoher Wechselwirkung (z.B. Antidepressiva, Benzodiazepine). Nur unter ärztlicher Aufsicht.'),
('with_critical_interaction', 0, 10, 0, 30, 'Bei kritischen Wechselwirkungen (z.B. Warfarin, Immunsuppressiva, Opioide). Nur nach ausdrücklicher ärztlicher Genehmigung und unter engster Überwachung.');
