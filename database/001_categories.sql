-- MEDLESS DATABASE PATCH 001: Category Extensions
-- Execution Order: 1/7
-- Purpose: Add missing medication categories
-- Note: Existing categories: 1-15 (Blutverdünner, Antidepressiva, Antiepileptika, Schmerzmittel, Psychopharmaka, etc.)

INSERT OR IGNORE INTO medication_categories (id, name, description) VALUES
(16, 'Schlafmittel', 'Hypnotika und Sedativa'),
(26, 'Hormonpräparate', 'Hormone und Hormonersatztherapie'),
(27, 'Diuretika', 'Entwässerungsmittel'),
(28, 'Biologika', 'Biologische Arzneimittel'),
(29, 'Antirheumatika', 'Mittel gegen rheumatische Erkrankungen'),
(30, 'Migränemedikamente', 'Mittel zur Behandlung von Migräne'),
(31, 'Parkinson-Medikamente', 'Mittel zur Behandlung der Parkinson-Krankheit'),
(32, 'Antihistaminika', 'Histamin-Rezeptor-Antagonisten'),
(33, 'Antimykotika', 'Pilzinfektionsbekämpfende Arzneimittel'),
(34, 'Virostatika', 'Virusinfektionsbekämpfende Arzneimittel'),
(35, 'Osteoporose-Medikamente', 'Mittel zur Behandlung von Osteoporose');
