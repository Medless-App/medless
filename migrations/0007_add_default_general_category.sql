-- Migration 0007: Standardkategorie 'Allgemeine Medikation' anlegen
-- 
-- Zweck:
-- - Explizite Kategorie für Medikamente ohne spezifische Zuordnung
-- - Datenbank-seitige Vollständigkeit (Backend-Fallback bleibt als zusätzliche Absicherung bestehen)
-- - Konsistenz zwischen Code und Datenbank
--
-- Datum: 2025-12-07
-- 
-- WICHTIG: 
-- - Der bestehende Backend-Fallback (category_name || 'Allgemeine Medikation') 
--   bleibt aktiv als zusätzliche Robustheit
-- - Diese Migration dient der fachlichen und datenbankseitigen Vollständigkeit

-- Prüfen, ob die Kategorie bereits existiert, und nur einfügen falls nicht
INSERT OR IGNORE INTO medication_categories (
  id, 
  name, 
  description, 
  risk_level
) 
VALUES (
  0, 
  'Allgemeine Medikation', 
  'Standardkategorie für Medikamente ohne spezifische Zuordnung (z.B. Schmerzmittel, Antihistaminika, Vitamine)', 
  'low'
);

-- Optional: Bestehende Medikamente ohne Kategorie (category_id = NULL oder 0) 
-- auf diese neue Kategorie setzen
-- UPDATE medications SET category_id = 0 WHERE category_id IS NULL OR category_id = 0;
-- 
-- HINWEIS: Diese Zeile ist bewusst auskommentiert, da:
-- 1. Der Backend-Fallback bereits alle NULL-Fälle abfängt
-- 2. Es ggf. Medikamente gibt, die bewusst noch nicht kategorisiert wurden
-- 3. Diese Entscheidung sollte medizinisch geprüft werden
