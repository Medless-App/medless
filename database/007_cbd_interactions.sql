-- MEDLESS: CBD-Interaktionen für neue Medikamente

INSERT OR IGNORE INTO cbd_interactions (medication_id, interaction_type, severity, description, mechanism, recommendation, source_url) VALUES
-- Antibiotika (122-140)
(123, 'enzyme_interaction', 'medium', 'CBD kann die CYP3A4-vermittelte Verstoffwechslung von Azithromycin beeinflussen', 'CYP3A4-Hemmung', 'Vorsicht bei gleichzeitiger Anwendung, Dosisanpassung eventuell erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(124, 'enzyme_interaction', 'medium', 'CBD hemmt CYP1A2, was den Ciprofloxacin-Abbau verlangsamen kann', 'CYP1A2-Hemmung', 'Überwachung auf verstärkte Nebenwirkungen empfohlen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(125, 'enzyme_interaction', 'high', 'Starke Wechselwirkung über CYP3A4 mit Clarithromycin möglich', 'CYP3A4-Hemmung', 'Engmaschige Überwachung erforderlich, Dosisreduktion erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(128, 'enzyme_interaction', 'high', 'CBD kann Erythromycin-Spiegel durch CYP3A4-Hemmung erhöhen', 'CYP3A4-Hemmung', 'Vorsicht, niedrigere Erythromycin-Dosis eventuell nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(130, 'enzyme_interaction', 'medium', 'CBD interagiert mit Metronidazol über CYP2C9', 'CYP2C9-Hemmung', 'Überwachung der Metronidazol-Wirkung empfohlen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(133, 'enzyme_interaction', 'critical', 'Rifampicin ist starker CYP3A4-Induktor und reduziert CBD-Spiegel stark', 'CYP3A4-Induktion', 'CBD-Dosis eventuell erhöhen, engmaschige Kontrolle nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(134, 'enzyme_interaction', 'medium', 'CBD hemmt CYP2C9 und kann Cotrimoxazol-Spiegel erhöhen', 'CYP2C9-Hemmung', 'Vorsicht bei Kombination, Dosisanpassung erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Hormonpräparate (141-159)
(141, 'enzyme_interaction', 'medium', 'CBD kann Estradiol-Metabolismus über CYP3A4 beeinflussen', 'CYP3A4-Hemmung', 'Hormonwerte regelmäßig kontrollieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(142, 'enzyme_interaction', 'medium', 'Levonorgestrel-Spiegel können durch CBD-CYP3A4-Hemmung steigen', 'CYP3A4-Hemmung', 'Überwachung der Hormonwirkung empfohlen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(143, 'enzyme_interaction', 'medium', 'CBD hemmt Testosteron-Abbau über CYP3A4', 'CYP3A4-Hemmung', 'Testosteronspiegel überwachen bei CBD-Anwendung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(144, 'enzyme_interaction', 'high', 'Prednisolon-Wirkung kann durch CBD-CYP3A4-Hemmung verstärkt werden', 'CYP3A4-Hemmung', 'Vorsicht, Prednisolon-Dosis eventuell reduzieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(146, 'enzyme_interaction', 'high', 'Dexamethason-Spiegel steigen durch CBD-CYP3A4-Hemmung', 'CYP3A4-Hemmung', 'Engmaschige Kontrolle, Dosisanpassung erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(149, 'enzyme_interaction', 'medium', 'CBD hemmt Cabergolin-Metabolismus über CYP3A4', 'CYP3A4-Hemmung', 'Prolaktinspiegel überwachen bei CBD-Anwendung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(150, 'enzyme_interaction', 'high', 'CBD hemmt CYP2D6 und kann Tamoxifen-Aktivierung verringern', 'CYP2D6-Hemmung', 'Kritisch: CBD kann Tamoxifen-Wirksamkeit reduzieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Antidepressiva (181-200)
(181, 'enzyme_interaction', 'high', 'CBD hemmt CYP2D6 und erhöht Venlafaxin-Spiegel', 'CYP2D6-Hemmung', 'Vorsicht, erhöhtes Serotonin-Syndrom-Risiko', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(182, 'enzyme_interaction', 'high', 'Duloxetin-Spiegel steigen durch CBD-CYP2D6-Hemmung', 'CYP2D6-Hemmung', 'Engmaschige Überwachung, Dosisreduktion erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(183, 'enzyme_interaction', 'high', 'CBD hemmt CYP2B6 und beeinflusst Bupropion-Metabolismus', 'CYP2B6-Hemmung', 'Vorsicht bei Kombination, Anfallsrisiko beachten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(184, 'sedative_interaction', 'high', 'Trazodon plus CBD verstärkt sedierende Wirkung', 'Additive Sedierung', 'Vorsicht vor Übersedierung, niedrigere Dosen erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(185, 'enzyme_interaction', 'medium', 'CBD hemmt CYP1A2 und erhöht Agomelatin-Spiegel', 'CYP1A2-Hemmung', 'Leberfunktion überwachen, Dosisanpassung erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(186, 'enzyme_interaction', 'high', 'Vortioxetin-Spiegel steigen durch CBD-CYP2D6-Hemmung', 'CYP2D6-Hemmung', 'Engmaschige Überwachung erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(187, 'enzyme_interaction', 'critical', 'Fluvoxamin hemmt selbst CYP-Enzyme, Kombination mit CBD problematisch', 'Doppelte CYP-Hemmung', 'Kritisch: Starke Wechselwirkung, ärztliche Überwachung nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(192, 'enzyme_interaction', 'critical', 'Clomipramin-Spiegel steigen stark durch CBD-CYP2D6-Hemmung', 'CYP2D6-Hemmung', 'Kritisch: Engmaschige Überwachung, Dosisreduktion erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(193, 'sedative_interaction', 'high', 'Doxepin plus CBD verstärkt Sedierung erheblich', 'Additive Sedierung', 'Vorsicht vor Übersedierung und kognitiven Beeinträchtigungen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(194, 'enzyme_interaction', 'critical', 'Imipramin-Spiegel steigen stark durch CBD-CYP2D6-Hemmung', 'CYP2D6-Hemmung', 'Kritisch: Kardiotoxizität möglich, engmaschige Kontrolle nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(199, 'enzyme_interaction', 'critical', 'Tranylcypromin (MAO-Hemmer) plus CBD kann schwere Wechselwirkungen verursachen', 'MAO-Hemmung + CYP-Hemmung', 'Kritisch: Nur unter strenger ärztlicher Kontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(200, 'enzyme_interaction', 'high', 'Selegilin plus CBD kann zu erhöhten Serotoninspiegeln führen', 'MAO-B-Hemmung + Serotonerg', 'Vorsicht, Serotonin-Syndrom-Risiko beachten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Opioide (201-215)
(201, 'sedative_interaction', 'critical', 'Fentanyl plus CBD führt zu massiver Atemdepression', 'Additive ZNS-Depression', 'Kritisch: Lebensgefahr durch Atemdepression, nicht kombinieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(202, 'sedative_interaction', 'critical', 'Oxycodon plus CBD verstärkt Sedierung und Atemdepression', 'Additive ZNS-Depression', 'Kritisch: Stark reduzierte Dosis nötig, engmaschige Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(203, 'sedative_interaction', 'critical', 'Hydromorphon plus CBD verstärkt Opioid-Wirkung erheblich', 'Additive ZNS-Depression', 'Kritisch: Atemdepression möglich, nur unter Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(204, 'sedative_interaction', 'critical', 'Buprenorphin plus CBD verstärkt sedierende Wirkung', 'Additive ZNS-Depression', 'Kritisch: Vorsicht, Dosisreduktion erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(205, 'sedative_interaction', 'critical', 'Pethidin plus CBD erhöht Atemdepression-Risiko', 'Additive ZNS-Depression', 'Kritisch: Engmaschige Überwachung nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(207, 'sedative_interaction', 'high', 'Tilidin plus CBD verstärkt sedierende Wirkung', 'Additive ZNS-Depression', 'Vorsicht, niedrigere Dosen erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(208, 'sedative_interaction', 'critical', 'Tapentadol plus CBD verstärkt ZNS-Depression', 'Additive ZNS-Depression', 'Kritisch: Engmaschige Überwachung erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(210, 'sedative_interaction', 'critical', 'Levomethadon plus CBD massiv verstärkte Sedierung', 'Additive ZNS-Depression', 'Kritisch: Lebensgefahr, nur unter strenger Kontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(214, 'enzyme_interaction', 'high', 'CBD hemmt CYP2D6 und reduziert Codein-Aktivierung', 'CYP2D6-Hemmung', 'Analgetische Wirkung kann reduziert sein', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(215, 'enzyme_interaction', 'high', 'Dihydrocodein-Aktivierung durch CBD-CYP2D6-Hemmung reduziert', 'CYP2D6-Hemmung', 'Schmerzkontrolle eventuell unzureichend', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Schlafmittel (221-230)
(221, 'sedative_interaction', 'high', 'Zaleplon plus CBD verstärkt Sedierung erheblich', 'Additive ZNS-Depression', 'Vorsicht vor Übersedierung, niedrigere Dosen nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(222, 'sedative_interaction', 'high', 'Eszopiclon plus CBD verstärkt hypnotische Wirkung', 'Additive ZNS-Depression', 'Vorsicht, Sturzgefahr und Tagesmüdigkeit erhöht', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(224, 'sedative_interaction', 'medium', 'Diphenhydramin plus CBD verstärkt Sedierung', 'Additive Antihistamin-Wirkung', 'Vorsicht vor Übersedierung, besonders bei älteren Patienten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(226, 'sedative_interaction', 'high', 'Chloralhydrat plus CBD stark verstärkte Sedierung', 'Additive ZNS-Depression', 'Kritisch: Atemdepression möglich, engmaschige Überwachung', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(227, 'sedative_interaction', 'high', 'Clomethiazol plus CBD massiv verstärkte ZNS-Depression', 'Additive ZNS-Depression', 'Kritisch: Nur unter strenger Überwachung kombinieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(228, 'sedative_interaction', 'high', 'Zolpidem Retard plus CBD verstärkt hypnotische Wirkung', 'Additive ZNS-Depression', 'Vorsicht, Parasomnien und Sturzgefahr erhöht', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(229, 'sedative_interaction', 'critical', 'Phenobarbital plus CBD stark erhöhtes Sedierungsrisiko', 'Additive ZNS-Depression', 'Kritisch: Atemdepression möglich, nicht kombinieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(230, 'sedative_interaction', 'critical', 'Secobarbital plus CBD lebensgefährliche Atemdepression', 'Additive ZNS-Depression', 'Kritisch: Nicht kombinieren, Lebensgefahr', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Antipsychotika (231-240)
(231, 'enzyme_interaction', 'high', 'CBD hemmt CYP3A4 und erhöht Aripiprazol-Spiegel', 'CYP3A4-Hemmung', 'Vorsicht, Dosisreduktion eventuell nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(232, 'enzyme_interaction', 'high', 'Paliperidon-Spiegel steigen durch CBD-CYP2D6-Hemmung', 'CYP2D6-Hemmung', 'Engmaschige Überwachung, extrapyramidale Symptome beachten', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(233, 'sedative_interaction', 'high', 'Asenapin plus CBD verstärkt Sedierung', 'Additive ZNS-Depression', 'Vorsicht vor Übersedierung, Dosisanpassung erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(234, 'enzyme_interaction', 'high', 'Lurasidon-Spiegel steigen durch CBD-CYP3A4-Hemmung', 'CYP3A4-Hemmung', 'Vorsicht, extrapyramidale Nebenwirkungen möglich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(235, 'enzyme_interaction', 'high', 'Cariprazin-Spiegel steigen durch CBD-CYP3A4-Hemmung', 'CYP3A4-Hemmung', 'Engmaschige Kontrolle erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(236, 'enzyme_interaction', 'critical', 'Haloperidol plus CBD erhöht Risiko für extrapyramidale Symptome', 'CYP3A4-Hemmung', 'Kritisch: Engmaschige Überwachung, Dosisreduktion nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Antiepileptika (241-255)
(242, 'enzyme_interaction', 'high', 'Oxcarbazepin plus CBD erhöhte Wirkstoffspiegel möglich', 'CYP3A4-Hemmung', 'Vorsicht, Schwindel und Ataxie-Risiko erhöht', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(243, 'enzyme_interaction', 'high', 'Eslicarbazepinacetat-Spiegel steigen durch CBD', 'CYP3A4-Hemmung', 'Engmaschige Überwachung, Dosisanpassung erwägen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(244, 'enzyme_interaction', 'high', 'Perampanel plus CBD verstärkt Sedierung und Schwindel', 'CYP3A4-Hemmung', 'Vorsicht, niedrigere Dosen nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(246, 'enzyme_interaction', 'high', 'Zonisamid-Spiegel steigen durch CBD-CYP3A4-Hemmung', 'CYP3A4-Hemmung', 'Engmaschige Kontrolle erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(248, 'enzyme_interaction', 'high', 'Tiagabin plus CBD erhöhte Nebenwirkungen möglich', 'CYP3A4-Hemmung', 'Vorsicht, Schwindel und Müdigkeit verstärkt', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(249, 'enzyme_interaction', 'high', 'Felbamat plus CBD komplexe Wechselwirkung', 'CYP3A4-Hemmung', 'Engmaschige Überwachung nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(251, 'enzyme_interaction', 'critical', 'Stiripentol hemmt selbst CYP-Enzyme, mit CBD kritisch', 'Doppelte CYP-Hemmung', 'Kritisch: Nur unter strenger ärztlicher Kontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(254, 'enzyme_interaction', 'critical', 'Phenytoin-Spiegel stark durch CBD beeinflusst', 'CYP2C9-Hemmung', 'Kritisch: Engmaschige Spiegelkontrolle erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Blutdrucksenker (256-279)
(256, 'enzyme_interaction', 'medium', 'Amlodipin-Spiegel steigen durch CBD-CYP3A4-Hemmung', 'CYP3A4-Hemmung', 'Blutdruck regelmäßig kontrollieren, Schwindel möglich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(257, 'enzyme_interaction', 'medium', 'Felodipin plus CBD erhöhte Wirkstoffspiegel', 'CYP3A4-Hemmung', 'Vorsicht vor Hypotonie und Kopfschmerzen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(261, 'enzyme_interaction', 'medium', 'Nebivolol-Spiegel steigen durch CBD-CYP2D6-Hemmung', 'CYP2D6-Hemmung', 'Puls und Blutdruck überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(262, 'enzyme_interaction', 'medium', 'Carvedilol plus CBD erhöhte Wirkung möglich', 'CYP2D6-Hemmung', 'Blutdruck und Puls engmaschig kontrollieren', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(277, 'enzyme_interaction', 'medium', 'Doxazosin-Spiegel steigen durch CBD-CYP3A4-Hemmung', 'CYP3A4-Hemmung', 'Vorsicht vor orthostatischer Hypotonie', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Immunsuppressiva (308-309)
(308, 'enzyme_interaction', 'critical', 'Tacrolimus-Spiegel steigen stark durch CBD-CYP3A4-Hemmung', 'CYP3A4-Hemmung', 'Kritisch: Engmaschige Spiegelkontrolle absolut nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(309, 'enzyme_interaction', 'critical', 'Ciclosporin-Spiegel steigen stark durch CBD', 'CYP3A4-Hemmung', 'Kritisch: Nierentoxizität möglich, Spiegelkontrolle erforderlich', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Antimykotika (356-359)
(356, 'enzyme_interaction', 'critical', 'Fluconazol hemmt selbst CYP2C9, mit CBD problematisch', 'Doppelte CYP-Hemmung', 'Kritisch: Starke Wechselwirkung, Überwachung nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(357, 'enzyme_interaction', 'critical', 'Itraconazol hemmt CYP3A4, mit CBD stark verstärkt', 'Doppelte CYP3A4-Hemmung', 'Kritisch: Nicht kombinieren ohne ärztliche Kontrolle', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(358, 'enzyme_interaction', 'critical', 'Voriconazol hemmt CYP2C19, mit CBD problematisch', 'Doppelte CYP-Hemmung', 'Kritisch: Leberwerte und Spiegel überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(359, 'enzyme_interaction', 'high', 'Posaconazol plus CBD erhöhte Wirkstoffspiegel', 'CYP-Hemmung', 'Engmaschige Überwachung empfohlen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),

-- Migräne-Prophylaxe (324-325)
(324, 'enzyme_interaction', 'critical', 'Valproinsäure plus CBD stark erhöhte Lebertoxizität', 'CYP2C9-Hemmung + Hepatotoxizität', 'Kritisch: Leberwerte engmaschig überwachen', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen'),
(325, 'enzyme_interaction', 'critical', 'Amitriptylin-Spiegel steigen stark durch CBD', 'CYP2D6-Hemmung', 'Kritisch: Kardiotoxizität möglich, EKG-Kontrolle nötig', 'https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen');
