-- 20 häufigste Schlafmittel mit vollständigen Daten

-- Z-Substanzen (am häufigsten verschrieben)
INSERT INTO medications (name, generic_name, category_id, cyp450_enzyme, description, common_dosage) VALUES
('Zopiclon', 'Zopiclon', 16, 'CYP3A4, CYP2C8', 'Z-Substanz zur Kurzzeitbehandlung von Schlafstörungen', '7,5 mg vor dem Schlafengehen'),
('Zolpidem (Stilnox)', 'Zolpidem', 16, 'CYP3A4, CYP2C9, CYP1A2', 'Z-Substanz zur Behandlung von Einschlafstörungen', '10 mg vor dem Schlafengehen'),
('Zaleplon (Sonata)', 'Zaleplon', 16, 'CYP3A4, Aldehyd-Oxidase', 'Z-Substanz mit sehr kurzer Wirkdauer für Einschlafstörungen', '5-10 mg vor dem Schlafengehen'),

-- Benzodiazepine (klassische Schlafmittel)
('Diazepam (Valium)', 'Diazepam', 16, 'CYP2C19, CYP3A4', 'Benzodiazepin mit langer Wirkdauer, anxiolytisch und sedierend', '5-15 mg zur Nacht'),
('Lorazepam (Tavor)', 'Lorazepam', 16, 'Glucuronidierung (nicht CYP)', 'Benzodiazepin mittlerer Wirkdauer, anxiolytisch', '1-2,5 mg zur Nacht'),
('Temazepam (Remestan)', 'Temazepam', 16, 'Glucuronidierung (nicht CYP)', 'Benzodiazepin speziell für Schlafstörungen', '10-20 mg vor dem Schlafengehen'),
('Nitrazepam (Mogadan)', 'Nitrazepam', 16, 'CYP2E1, CYP3A4', 'Benzodiazepin mit langer Wirkdauer', '5-10 mg vor dem Schlafengehen'),
('Flunitrazepam (Rohypnol)', 'Flunitrazepam', 16, 'CYP3A4', 'Starkes Benzodiazepin zur Behandlung schwerer Schlafstörungen', '0,5-2 mg vor dem Schlafengehen'),
('Triazolam (Halcion)', 'Triazolam', 16, 'CYP3A4', 'Kurz wirksames Benzodiazepin für Einschlafstörungen', '0,125-0,25 mg vor dem Schlafengehen'),
('Lormetazepam (Noctamid)', 'Lormetazepam', 16, 'Glucuronidierung (nicht CYP)', 'Benzodiazepin mittlerer Wirkdauer', '0,5-2 mg vor dem Schlafengehen'),
('Brotizolam (Lendormin)', 'Brotizolam', 16, 'CYP3A4', 'Kurz wirksames Benzodiazepin', '0,125-0,25 mg vor dem Schlafengehen'),

-- Moderne Schlafmittel
('Daridorexant (Quviviq)', 'Daridorexant', 16, 'CYP3A4, CYP2C8', 'Orexin-Rezeptor-Antagonist, neue Generation von Schlafmitteln', '25-50 mg vor dem Schlafengehen'),
('Lemborexant (Dayvigo)', 'Lemborexant', 16, 'CYP3A4', 'Dualer Orexin-Rezeptor-Antagonist', '5-10 mg vor dem Schlafengehen'),

-- Sedierende Antidepressiva (off-label für Schlaf)
('Mirtazapin (Remergil)', 'Mirtazapin', 16, 'CYP2D6, CYP1A2, CYP3A4', 'Sedierendes Antidepressivum, oft off-label bei Schlafstörungen', '7,5-30 mg zur Nacht'),
('Trazodon (Trittico)', 'Trazodon', 16, 'CYP3A4', 'Sedierendes Antidepressivum bei Schlafstörungen', '25-100 mg zur Nacht'),
('Doxepin (Aponal)', 'Doxepin', 16, 'CYP2D6, CYP1A2', 'Trizyklisches Antidepressivum, auch für Schlafstörungen', '25-50 mg zur Nacht'),

-- Antihistaminika
('Diphenhydramin (Vivinox)', 'Diphenhydramin', 16, 'CYP2D6', 'H1-Antihistaminikum mit sedierender Wirkung, rezeptfrei', '25-50 mg vor dem Schlafengehen'),
('Doxylamin (Hoggar Night)', 'Doxylamin', 16, 'CYP2D6', 'H1-Antihistaminikum zur Kurzzeitbehandlung von Schlafstörungen', '25 mg vor dem Schlafengehen'),

-- Melatonin
('Melatonin (Circadin)', 'Melatonin', 16, 'CYP1A2', 'Hormon zur Regulierung des Schlaf-Wach-Rhythmus', '2 mg retardiert 1-2h vor dem Schlafengehen'),

-- Pflanzliche Präparate
('Baldrian hochdosiert', 'Valeriana officinalis', 16, 'Minimal CYP-Interaktion', 'Pflanzliches Schlafmittel', '600-900 mg Extrakt vor dem Schlafengehen');
