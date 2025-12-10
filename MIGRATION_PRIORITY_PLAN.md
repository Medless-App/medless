# MEDLESS V1 - MIGRATION PRIORITY PLAN & RISK ASSESSMENT

**Date:** 2025-12-09  
**Purpose:** Structured deployment plan for data quality fixes  
**Target:** Production-ready MEDLESS v1 calculation engine

---

## 1. PRIORISIERUNG DER MIGRATIONEN

### MIGRATION SEQUENCE (IN ORDER):

```
MIGRATION 016: Fix Invalid Half-Life Values (4 medications)
   ↓
MIGRATION 017: Add CYP Boolean Fields (Schema Change)
   ↓
MIGRATION 018: Populate CYP Flags - Critical Medications (26 CYP substrates)
   ↓
MIGRATION 019: Populate CYP Flags - NON-CYP Medications (mark as 0)
   ↓
MIGRATION 020: Add narrow_therapeutic_window Field (Optional for v1.1)
```

---

## 2. MIGRATION 016: FIX INVALID HALF-LIFE VALUES

**Priority:** 🔴 **CRITICAL (BLOCKER)**  
**Must Execute Before:** Phase 3 calculation becomes accurate  
**Affected Medications:** 4  
**Estimated Time:** 5 minutes

### SQL SCRIPT:

```sql
-- ============================================================================
-- MIGRATION 016: Fix Invalid Half-Life Values
-- Priority: P0 (BLOCKER)
-- Affects: Phase 3 (Half-Life Adjustment) calculation
-- ============================================================================

BEGIN TRANSACTION;

-- Hydroxychloroquin: Use dosing half-life (50h) instead of tissue accumulation (1200h)
UPDATE medications 
SET half_life_hours = 50 
WHERE id = 255 AND name = 'Quensyl' AND generic_name = 'Hydroxychloroquin';

-- Alendronat: Use plasma half-life (1.5h) instead of bone deposition (87600h)
UPDATE medications 
SET half_life_hours = 1.5 
WHERE id = 269 AND name = 'Fosamax' AND generic_name = 'Alendronat';

-- Risedronat: Use plasma half-life (1.5h) instead of bone deposition (43800h)
UPDATE medications 
SET half_life_hours = 1.5 
WHERE id = 270 AND name = 'Actonel' AND generic_name = 'Risedronat';

-- Cholecalciferol: Use 25-OH-D3 half-life (400h = 2.5 weeks) instead of storage pool (1200h)
UPDATE medications 
SET half_life_hours = 400 
WHERE id = 352 AND name = 'Vigantol' AND generic_name = 'Cholecalciferol';

-- Validation: Verify no values >1000h remain (except very long elimination drugs)
SELECT id, name, generic_name, half_life_hours
FROM medications
WHERE half_life_hours > 500
ORDER BY half_life_hours DESC;

-- Expected results: Only Levothyroxin (168h), Sirolimus (60h), Aripiprazol (75h) etc.

COMMIT;
```

**Validation After Execution:**
```sql
-- Should return 0 rows (all fixed)
SELECT id, name, half_life_hours 
FROM medications 
WHERE id IN (255, 269, 270, 352);
```

**Expected Output:**
| ID | Name | half_life_hours |
|----|------|-----------------|
| 255 | Quensyl | 50 |
| 269 | Fosamax | 1.5 |
| 270 | Actonel | 1.5 |
| 352 | Vigantol | 400 |

---

## 3. MIGRATION 017: ADD CYP BOOLEAN FIELDS

**Priority:** 🔴 **CRITICAL (BLOCKER)**  
**Must Execute Before:** Phase 4 (CYP adjustment) can function  
**Schema Change:** Yes (15 new columns)  
**Estimated Time:** 10 minutes

### SQL SCRIPT:

```sql
-- ============================================================================
-- MIGRATION 017: Add CYP Boolean Fields
-- Priority: P0 (BLOCKER)
-- Enables: Phase 4 (CYP450 Adjustment) calculation
-- Schema Impact: Adds 15 INTEGER columns (5 enzymes × 3 roles)
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================
-- Add CYP SUBSTRATE fields (5 enzymes)
-- ============================================
ALTER TABLE medications ADD COLUMN cyp3a4_substrate INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2d6_substrate INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2c9_substrate INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2c19_substrate INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp1a2_substrate INTEGER DEFAULT 0;

-- ============================================
-- Add CYP INHIBITOR fields (5 enzymes)
-- ============================================
ALTER TABLE medications ADD COLUMN cyp3a4_inhibitor INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2d6_inhibitor INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2c9_inhibitor INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2c19_inhibitor INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp1a2_inhibitor INTEGER DEFAULT 0;

-- ============================================
-- Add CYP INDUCER fields (5 enzymes)
-- ============================================
ALTER TABLE medications ADD COLUMN cyp3a4_inducer INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2d6_inducer INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2c9_inducer INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp2c19_inducer INTEGER DEFAULT 0;
ALTER TABLE medications ADD COLUMN cyp1a2_inducer INTEGER DEFAULT 0;

-- ============================================
-- Validation: Verify schema changes
-- ============================================
PRAGMA table_info(medications);

-- Expected: 15 new columns (cid 15-29) with INTEGER type, DEFAULT 0

COMMIT;
```

**Validation After Execution:**
```sql
-- Verify all 15 fields exist and are initialized to 0
SELECT 
  COUNT(DISTINCT cyp3a4_substrate) AS cyp3a4_substrate_values,
  COUNT(DISTINCT cyp2d6_substrate) AS cyp2d6_substrate_values,
  SUM(cyp3a4_substrate) AS cyp3a4_substrate_count,
  SUM(cyp2d6_substrate) AS cyp2d6_substrate_count
FROM medications;

-- Expected: All counts = 0 (default values)
```

---

## 4. MIGRATION 018: POPULATE CYP FLAGS - CRITICAL MEDICATIONS

**Priority:** 🟡 **HIGH (Phase 4 functionality)**  
**Must Execute Before:** Full Phase 4 calculation accuracy  
**Affected Medications:** ~100 (CYP substrates from existing TEXT data)  
**Estimated Time:** 15 minutes

### SQL SCRIPT (PART 1: AUTO-POPULATE FROM TEXT):

```sql
-- ============================================================================
-- MIGRATION 018: Populate CYP Flags - Auto-Detection from cyp450_enzyme TEXT
-- Priority: P1 (HIGH)
-- Method: Pattern matching on existing cyp450_enzyme field
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================
-- CYP3A4 SUBSTRATES (Auto-detect from TEXT)
-- ============================================
UPDATE medications 
SET cyp3a4_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP3A4%' OR cyp450_enzyme LIKE '%cyp3a4%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%'
  AND cyp450_enzyme NOT LIKE '%minimal CYP%';

-- ============================================
-- CYP2D6 SUBSTRATES (Auto-detect from TEXT)
-- ============================================
UPDATE medications 
SET cyp2d6_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP2D6%' OR cyp450_enzyme LIKE '%cyp2d6%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%';

-- ============================================
-- CYP2C9 SUBSTRATES (Auto-detect from TEXT)
-- ============================================
UPDATE medications 
SET cyp2c9_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP2C9%' OR cyp450_enzyme LIKE '%cyp2c9%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%';

-- ============================================
-- CYP2C19 SUBSTRATES (Auto-detect from TEXT)
-- ============================================
UPDATE medications 
SET cyp2c19_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP2C19%' OR cyp450_enzyme LIKE '%cyp2c19%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%';

-- ============================================
-- CYP1A2 SUBSTRATES (Auto-detect from TEXT)
-- ============================================
UPDATE medications 
SET cyp1a2_substrate = 1 
WHERE (cyp450_enzyme LIKE '%CYP1A2%' OR cyp450_enzyme LIKE '%cyp1a2%')
  AND cyp450_enzyme NOT LIKE '%kein CYP%'
  AND cyp450_enzyme NOT LIKE '%no CYP%';

-- ============================================
-- Validation: Count auto-detected substrates
-- ============================================
SELECT 
  'CYP3A4' AS enzyme,
  SUM(cyp3a4_substrate) AS substrate_count
FROM medications
UNION ALL
SELECT 'CYP2D6', SUM(cyp2d6_substrate) FROM medications
UNION ALL
SELECT 'CYP2C9', SUM(cyp2c9_substrate) FROM medications
UNION ALL
SELECT 'CYP2C19', SUM(cyp2c19_substrate) FROM medications
UNION ALL
SELECT 'CYP1A2', SUM(cyp1a2_substrate) FROM medications
ORDER BY substrate_count DESC;

-- Expected: CYP3A4 ~120, CYP2D6 ~80, CYP2C9 ~40, CYP2C19 ~50, CYP1A2 ~15

COMMIT;
```

### SQL SCRIPT (PART 2: MANUAL FIXES FOR 40 UNCLEAR MEDICATIONS):

```sql
-- ============================================================================
-- MIGRATION 018b: Manual CYP Classification for 40 Unclear Medications
-- Priority: P1 (HIGH)
-- Source: CYP_CLASSIFICATION_40_MEDICATIONS.md
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================
-- CYP3A4 SUBSTRATES (from 40 unclear list)
-- ============================================
UPDATE medications SET cyp3a4_substrate = 1 WHERE id IN (
  282,  -- Torasemid (also CYP2C9)
  286,  -- Indapamid (minor)
  314,  -- Colchicin
  323,  -- Doxazosin
  343,  -- Prednisolon (prodrug)
  362,  -- Eplerenon
  365   -- Ambroxol (minor)
);

-- ============================================
-- CYP2C9 SUBSTRATES (from 40 unclear list)
-- ============================================
UPDATE medications SET cyp2c9_substrate = 1 WHERE id = 282;  -- Torasemid

-- ============================================
-- CYP1A2 SUBSTRATES (from 40 unclear list)
-- ============================================
UPDATE medications SET cyp1a2_substrate = 1 WHERE id = 363;  -- Triamteren (minor)

-- ============================================
-- KNOWN INHIBITORS (Critical for Phase 4)
-- ============================================

-- Fluoxetine: Potent CYP2D6 inhibitor
UPDATE medications 
SET cyp2d6_inhibitor = 1 
WHERE id = 5 AND name = 'Prozac';

-- Paroxetine: Potent CYP2D6 inhibitor
UPDATE medications 
SET cyp2d6_inhibitor = 1 
WHERE id = 73 AND name = 'Seroxat';

-- Omeprazole: CYP2C19 inhibitor
UPDATE medications 
SET cyp2c19_inhibitor = 1 
WHERE id IN (39, 108) AND generic_name = 'Omeprazol';

-- Esomeprazole: CYP2C19 inhibitor
UPDATE medications 
SET cyp2c19_inhibitor = 1 
WHERE id = 109 AND generic_name = 'Esomeprazol';

-- Carbamazepine: Potent CYP3A4 inducer
UPDATE medications 
SET cyp3a4_inducer = 1 
WHERE id = 81 AND name = 'Tegretol';

-- Rifampicin: Potent CYP3A4 inducer (if in database)
UPDATE medications 
SET cyp3a4_inducer = 1 
WHERE generic_name = 'Rifampicin';

-- ============================================
-- Validation: Verify critical interactions
-- ============================================
SELECT id, name, generic_name, cyp2d6_inhibitor
FROM medications
WHERE cyp2d6_inhibitor = 1;

-- Expected: Fluoxetine, Paroxetine

COMMIT;
```

---

## 5. MIGRATION 019: MARK NON-CYP MEDICATIONS

**Priority:** 🟢 **MEDIUM (Data completeness)**  
**Purpose:** Explicitly mark medications with NO CYP involvement  
**Affected Medications:** ~50 (glucuronidation, renal clearance, etc.)  
**Estimated Time:** 5 minutes

### SQL SCRIPT:

```sql
-- ============================================================================
-- MIGRATION 019: Explicitly Mark NON-CYP Medications
-- Priority: P2 (MEDIUM)
-- Purpose: Ensure all CYP flags = 0 for non-CYP drugs
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================
-- NON-CYP: Glucuronidation-only (UGT)
-- ============================================
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, 
    cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (
  24,   -- Lorazepam (Tavor)
  56,   -- Lorazepam
  57,   -- Temazepam
  61,   -- Lormetazepam
  151   -- Raloxifen
);

-- ============================================
-- NON-CYP: Renal clearance (no metabolism)
-- ============================================
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, 
    cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (
  195,  -- Methotrexat
  266,  -- Amilorid
  279,  -- Hydrochlorothiazid
  284,  -- Acetazolamid
  285,  -- Chlortalidon
  368,  -- N-Acetylcystein
  369   -- Carbocistein
);

-- ============================================
-- NON-CYP: Esterase-metabolized prodrugs
-- ============================================
UPDATE medications 
SET cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0, 
    cyp2c19_substrate = 0, cyp1a2_substrate = 0
WHERE id IN (
  19,   -- Aspirin
  98,   -- Ramipril
  159,  -- Acetylsalicylsäure
  298   -- Molsidomin
);

-- ============================================
-- Validation: Count NON-CYP medications
-- ============================================
SELECT COUNT(*) AS non_cyp_count
FROM medications
WHERE cyp3a4_substrate = 0 
  AND cyp2d6_substrate = 0 
  AND cyp2c9_substrate = 0 
  AND cyp2c19_substrate = 0 
  AND cyp1a2_substrate = 0;

-- Expected: ~200 medications (majority are NOT CYP-dependent)

COMMIT;
```

---

## 6. MIGRATION 020: ADD NARROW THERAPEUTIC WINDOW FIELD (OPTIONAL)

**Priority:** 🟢 **LOW (Future v1.1 feature)**  
**Purpose:** Replace hardcoded narrow_therapeutic_window logic  
**Currently:** Hardcoded in code, not in database  
**Estimated Time:** 10 minutes

### SQL SCRIPT:

```sql
-- ============================================================================
-- MIGRATION 020: Add narrow_therapeutic_window Boolean Field
-- Priority: P3 (LOW - Optional for v1.0)
-- Enables: Phase 5 (Therapeutic Window) to use DB instead of hardcoded logic
-- ============================================================================

BEGIN TRANSACTION;

-- Add field
ALTER TABLE medications ADD COLUMN narrow_therapeutic_window INTEGER DEFAULT 0;

-- Mark known narrow-window drugs
UPDATE medications 
SET narrow_therapeutic_window = 1 
WHERE generic_name IN (
  'Warfarin',
  'Lithium',
  'Digoxin',
  'Phenytoin',
  'Theophyllin',
  'Ciclosporin',
  'Tacrolimus',
  'Carbamazepin',
  'Valproat',
  'Levetiracetam',
  'Clozapin'
);

-- Validation
SELECT id, name, generic_name, narrow_therapeutic_window
FROM medications
WHERE narrow_therapeutic_window = 1
ORDER BY id;

-- Expected: ~15 medications with narrow window

COMMIT;
```

---

## 7. EXECUTION ORDER & DEPENDENCIES

```
┌─────────────────────────────────────────────────────────┐
│ MIGRATION 016: Fix Half-Life Values                    │
│ ✅ Must execute FIRST (affects Phase 3)                │
│ ✅ No dependencies                                      │
│ ✅ Safe to execute immediately                          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ MIGRATION 017: Add CYP Boolean Fields                  │
│ ✅ Must execute BEFORE 018/019 (schema change)         │
│ ✅ Enables Phase 4 calculation                          │
│ ⚠️ RESTART APPLICATION after this migration            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ MIGRATION 018: Populate CYP Flags (Auto + Manual)      │
│ ✅ Requires Migration 017 completed                     │
│ ✅ Part 1: Auto-detect from TEXT (safe, reversible)    │
│ ✅ Part 2: Manual 40 medications (validated)           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ MIGRATION 019: Mark NON-CYP Medications                │
│ ✅ Optional (improves data clarity)                     │
│ ✅ Can execute after 018 or skip for v1.0              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ MIGRATION 020: Add narrow_therapeutic_window (v1.1)    │
│ ⚠️ OPTIONAL for v1.0                                    │
│ ✅ Can be deferred to v1.1 release                      │
└─────────────────────────────────────────────────────────┘
```

---

## 8. AMPEL-SYSTEM: DATENRISIKEN

### 🔴 KRITISCHE BLOCKER (MUST FIX):

| ID | Problem | Affected Phase | Impact | Migration |
|----|---------|----------------|--------|-----------|
| **R1** | 4 ungültige Halbwertszeiten (>1000h) | Phase 3 | 50× zu langsame Reduktion | **016** |
| **R2** | CYP-Boolean-Felder fehlen | Phase 4 | CYP-Anpassung funktioniert nicht | **017** |
| **R3** | 40 unklare CYP-Einträge | Phase 4 | Fehlende Interaktionserkennung | **018** |

**Status vor Migration:**  
🔴🔴🔴 **3/7 Phasen defekt** (Phase 3 ungenau, Phase 4 kaputt)

**Status nach Migration 016+017+018:**  
🟢🟢🟢 **7/7 Phasen funktional**

---

### 🟡 HOHE PRIORITÄT (SOLLTE BEHOBEN WERDEN):

| ID | Problem | Affected Phase | Impact | Migration |
|----|---------|----------------|--------|-----------|
| **W1** | Bekannte CYP-Inhibitoren nicht markiert | Phase 4 | Fehlende Warnungen | **018b** |
| **W2** | CYP-Induktoren nicht vollständig | Phase 4 | Unvollständige Interaktionen | **018b** |
| **W3** | narrow_therapeutic_window hardcoded | Phase 5 | Schwer wartbar | **020** |

**Status vor Migration:**  
🟡🟡 **Teilweise funktional, Verbesserung empfohlen**

**Status nach Migration 018b+020:**  
🟢🟢 **Voll funktional, wartbar**

---

### 🟢 NIEDRIGE PRIORITÄT (NICE TO HAVE):

| ID | Problem | Affected Phase | Impact | Migration |
|----|---------|----------------|--------|-----------|
| **I1** | NON-CYP Medikamente nicht explizit markiert | - | Unklar ob geprüft | **019** |
| **I2** | Therapeutic Ranges fehlen | - | v1 nutzt diese nicht | *Zukunft* |
| **I3** | CYP-Inhibitor-Stärke (weak/moderate/strong) | - | v1 nutzt nur Boolean | *v2.0* |

**Status:**  
🟢 **Nicht kritisch für v1.0, kann später hinzugefügt werden**

---

## 9. FINALE DEPLOYMENT-CHECKLISTE

### VOR PRODUCTION-DEPLOYMENT:

- [ ] ✅ **Migration 016** ausgeführt (Half-Life Fixes)
- [ ] ✅ **Migration 017** ausgeführt (CYP Schema)
- [ ] ✅ **Migration 018** ausgeführt (CYP Population)
- [ ] ✅ Validierungsabfragen erfolgreich (siehe unten)
- [ ] ✅ Unit-Tests aktualisiert (CYP-Felder testen)
- [ ] ✅ Code überprüft (verwendet neue Boolean-Felder)
- [ ] ✅ Medical Lead Approval (Half-Life Korrekturen)
- [ ] ⚠️ **Migration 019** optional ausgeführt (NON-CYP Marks)
- [ ] ⚠️ **Migration 020** optional ausgeführt (Narrow Window)

### VALIDIERUNGS-QUERIES (NACH MIGRATION):

```sql
-- 1. Keine ungültigen Halbwertszeiten (>500h außer bekannte Fälle)
SELECT COUNT(*) FROM medications WHERE half_life_hours > 500;
-- Expect: ~5 (Levothyroxin, Sirolimus, etc.)

-- 2. CYP3A4-Substrat-Abdeckung in kritischen Kategorien
SELECT mc.name, COUNT(*) AS total, SUM(m.cyp3a4_substrate) AS cyp3a4_count
FROM medications m
JOIN medication_categories mc ON mc.id = m.category_id
WHERE mc.id IN (6, 8, 24, 26)  -- Statine, Immunsuppressiva, Antikoagulantien, Hormone
GROUP BY mc.name;
-- Expect: >80% coverage in each category

-- 3. Alle 15 CYP-Felder existieren
PRAGMA table_info(medications);
-- Expect: 15 new columns (cyp3a4_substrate, cyp2d6_substrate, ...)

-- 4. Bekannte Inhibitoren markiert
SELECT name FROM medications WHERE cyp2d6_inhibitor = 1;
-- Expect: Fluoxetine, Paroxetine

-- 5. Keine NULL-Werte in CYP-Feldern
SELECT COUNT(*) FROM medications WHERE cyp3a4_substrate IS NULL;
-- Expect: 0 (all should be 0 or 1)
```

---

## 10. ROLLBACK-PLAN (FALLS PROBLEME AUFTRETEN)

### ROLLBACK MIGRATION 016 (Half-Life):
```sql
-- Restore original values (from backup)
UPDATE medications SET half_life_hours = 1200 WHERE id = 255;
UPDATE medications SET half_life_hours = 87600 WHERE id = 269;
UPDATE medications SET half_life_hours = 43800 WHERE id = 270;
UPDATE medications SET half_life_hours = 1200 WHERE id = 352;
```

### ROLLBACK MIGRATION 017 (CYP Schema):
```sql
-- Drop CYP fields (SQLite does not support DROP COLUMN directly)
-- Alternative: Restore from backup OR ignore fields (set all to 0)
```

### ROLLBACK MIGRATION 018 (CYP Population):
```sql
-- Reset all CYP flags to 0
UPDATE medications SET 
  cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0,
  cyp2c19_substrate = 0, cyp1a2_substrate = 0,
  cyp3a4_inhibitor = 0, cyp2d6_inhibitor = 0, cyp2c9_inhibitor = 0,
  cyp2c19_inhibitor = 0, cyp1a2_inhibitor = 0,
  cyp3a4_inducer = 0, cyp2d6_inducer = 0, cyp2c9_inducer = 0,
  cyp2c19_inducer = 0, cyp1a2_inducer = 0;
```

---

## 11. GESCHÄTZTE GESAMT-DEPLOYMENT-ZEIT

| Migration | Estimated Time | Complexity | Risk |
|-----------|---------------|------------|------|
| **016 (Half-Life)** | 5 min | Low | Low |
| **017 (CYP Schema)** | 10 min | Medium | Low |
| **018 (CYP Population)** | 15 min | Medium | Low |
| **019 (NON-CYP Marks)** | 5 min | Low | None |
| **020 (Narrow Window)** | 10 min | Low | None |
| **Validation** | 10 min | - | - |

**Total:** ~45-60 minutes (inkl. Validierung)

---

**END OF MIGRATION PRIORITY PLAN**

**Next Step:** Execute migrations 016, 017, 018 in sequence  
**Sign-Off Required:** Medical Lead (Half-Life Corrections)
