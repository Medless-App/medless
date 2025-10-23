-- Medikamenten-Kategorien Tabelle
CREATE TABLE IF NOT EXISTS medication_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high', 'very_high')) DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medikamente Tabelle
CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  generic_name TEXT,
  category_id INTEGER,
  cyp450_enzyme TEXT, -- Welches CYP450 Enzym wird beeinflusst (z.B. CYP3A4, CYP2C9, CYP2D6)
  description TEXT,
  common_dosage TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES medication_categories(id)
);

-- CBD Wechselwirkungen Tabelle
CREATE TABLE IF NOT EXISTS cbd_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  interaction_type TEXT CHECK(interaction_type IN ('inhibition', 'enhancement', 'reduction', 'neutral')) NOT NULL,
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  description TEXT NOT NULL,
  mechanism TEXT, -- Wie die Wechselwirkung funktioniert (z.B. "CBD hemmt CYP3A4")
  recommendation TEXT, -- Empfehlung für den Patienten
  source_url TEXT, -- Quellenangabe
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);

-- CBD Dosierungs-Richtlinien Tabelle
CREATE TABLE IF NOT EXISTS cbd_dosage_guidelines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  condition_type TEXT NOT NULL, -- z.B. "general", "with_medications", "high_interaction"
  min_dosage_mg INTEGER NOT NULL, -- Minimale Tagesdosis in mg
  max_dosage_mg INTEGER NOT NULL, -- Maximale Tagesdosis in mg
  recommended_start_mg INTEGER NOT NULL, -- Empfohlene Startdosis
  adjustment_period_days INTEGER DEFAULT 7, -- Tage zwischen Dosisanpassungen
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Benutzer Ausgleichspläne Tabelle (optional für Tracking)
CREATE TABLE IF NOT EXISTS user_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  medications_input TEXT, -- JSON oder Text der eingegebenen Medikamente
  duration_weeks INTEGER NOT NULL,
  recommended_cbd_dosage TEXT, -- JSON der empfohlenen Dosierung
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category_id);
CREATE INDEX IF NOT EXISTS idx_cbd_interactions_medication ON cbd_interactions(medication_id);
CREATE INDEX IF NOT EXISTS idx_cbd_interactions_severity ON cbd_interactions(severity);
CREATE INDEX IF NOT EXISTS idx_user_plans_email ON user_plans(email);
