# MEDLESS DATABASE MIGRATION PLAN

**Version:** 1.0  
**Datum:** 08. Dezember 2025  
**Ziel-Datenbank:** `medless-production` (Cloudflare D1)

---

## 📊 AKTUELLER ZIELZUSTAND (REMOTE/PRODUCTION)

Die REMOTE-Datenbank `medless-production` ist der aktuelle **Gold-Standard** mit folgenden Kerndaten:

| **METRIK** | **WERT** | **STATUS** |
|------------|----------|------------|
| **Medikamente gesamt** | 343 | ✅ Vollständig |
| **CBD-Interaktionen** | 91 | ✅ Vollständig |
| **CYP-Profile** | 37 | ✅ Vollständig |
| **Medikations-Kategorien** | 22 | ✅ Vollständig |
| **Pharmakokinetische Felder gefüllt** | 100% | ✅ Alle 343 Medikamente |
| **Gültige Kategorien** | 100% | ✅ Keine Orphans |

**Tabellen:**
- `medications` (343 Zeilen)
- `medication_categories` (22 Zeilen)
- `cbd_interactions` (91 Zeilen)
- `medication_cyp_profile` (37 Zeilen)
- `cbd_dosage_guidelines` (0 Zeilen)
- `user_plans` (0 Zeilen)
- `customer_emails` (0 Zeilen)

---

## 📁 INVENTAR ALLER SQL-DATEIEN

### **1. OFFIZIELLE MIGRATIONS (Schema DDL)**

| **DATEI** | **TYP** | **BESCHREIBUNG** | **STATUS** |
|-----------|---------|------------------|------------|
| `migrations/0001_initial_schema.sql` | Schema Migration | Erstellt Basis-Tabellen (medications, medication_categories, cbd_interactions, cbd_dosage_guidelines, user_plans) | ✅ **OFFIZIELL** |
| `migrations/0002_add_customer_emails.sql` | Schema Migration | Fügt `customer_emails` Tabelle hinzu | ✅ **OFFIZIELL** |
| `migrations/0003_expand_interaction_types.sql` | Schema Migration | Erweitert `cbd_interactions` um `interaction_type`, `mechanism`, `recommendation`, `source_url` | ✅ **OFFIZIELL** |
| `migrations/0004_add_category_safety_rules.sql` | Schema Migration | Fügt Safety-Felder zu `medication_categories` hinzu (`can_reduce_to_zero`, `default_min_target_fraction`, `max_weekly_reduction_pct`, `requires_specialist`, `notes`) | ✅ **OFFIZIELL** |
| `migrations/0005_medication_pharma_fields.sql` | Schema Migration | Fügt pharmakokinetische Felder zu `medications` hinzu (`half_life_hours`, `therapeutic_min_ng_ml`, `therapeutic_max_ng_ml`, `withdrawal_risk_score`, `max_weekly_reduction_pct`, `can_reduce_to_zero`, `cbd_interaction_strength`) | ✅ **OFFIZIELL** |
| `migrations/0006_update_high_risk_categories_safety_rules.sql` | Schema Migration | Aktualisiert Safety-Rules für Hochrisiko-Kategorien | ✅ **OFFIZIELL** |
| `migrations/0007_add_default_general_category.sql` | Daten-Seeding | Fügt Fallback-Kategorie "Allgemeine Medikation" (ID 0) hinzu | ✅ **OFFIZIELL** |
| `010_add_cyp_profiles.sql` | Schema + Daten | Erstellt `medication_cyp_profile` Tabelle und fügt 37 CYP-Profile für 14 Schlüssel-Medikamente hinzu | ✅ **OFFIZIELL** |

**Gesamt:** 8 offizielle Migrationen

---

### **2. DATEN-SEEDING (Initial Data Load)**

| **DATEI** | **TYP** | **BESCHREIBUNG** | **STATUS** |
|-----------|---------|------------------|------------|
| `seed.sql` | Daten-Seeding | Enthält 51 Medikamente + 20 Kategorien. VERALTET, da nur Teilmenge. | ⚠️ **LEGACY** |
| `seed_categories_simple.sql` | Daten-Seeding | Fügt 19 Kategorien (IDs 1-19) hinzu | ⚠️ **REDUNDANT** (in späteren Patches enthalten) |
| `seed_category_safety_defaults.sql` | Daten-Seeding | Legacy-Version für Kategorie-Safety-Defaults | ⚠️ **LEGACY** |
| `seed_category_safety_defaults_clean.sql` | Daten-Seeding | Bereinigte Version für Kategorie-Safety-Defaults | ⚠️ **LEGACY** |

---

### **3. DATEN-PATCHES (Erweiterte Medikamente)**

| **DATEI** | **TYP** | **BESCHREIBUNG** | **STATUS** |
|-----------|---------|------------------|------------|
| `MASTER_ALL_MEDICATIONS_IDEMPOTENT.sql` | Daten-Patch | Sollte ~341 Medikamente enthalten, aber nur 39 tatsächlich vorhanden | ⚠️ **UNVOLLSTÄNDIG** |
| `final_patch_medications_to_200.sql` | Daten-Patch | Erweitert DB auf ~220 Medikamente (52 neue IDs 122-220) + 51 UPDATEs für pharmakokinetische Felder + 12 CBD-Interaktionen | ⚠️ **VERALTET** (durch CORRECTED ersetzt) |
| `final_patch_medications_to_200_CORRECTED.sql` | Daten-Patch | Korrigierte Version (Category 26→18 fix). Fügt 99 neue Medikamente hinzu (→150 total) + befüllt pharmakokinetische Felder | ✅ **VERWENDET** (auf LOKAL) |
| `final_patch_71_medications.sql` | Daten-Patch | Ältere Patch-Version | ⚠️ **LEGACY** |
| `final_patch_medications.sql` | Daten-Patch | Ältere Patch-Version | ⚠️ **LEGACY** |
| `final_patch_medications_corrected.sql` | Daten-Patch | Ältere Patch-Version | ⚠️ **LEGACY** |
| `final_patch_correct.sql` | Daten-Patch | Ältere Patch-Version | ⚠️ **LEGACY** |
| `final_patch_final.sql` | Daten-Patch | Ältere Patch-Version | ⚠️ **LEGACY** |
| `schlafmittel_insert.sql` | Daten-Patch | Fügt Schlafmittel hinzu | ⚠️ **REDUNDANT** (in späteren Patches enthalten) |
| `schlafmittel_interactions.sql` | Daten-Patch | CBD-Interaktionen für Schlafmittel | ⚠️ **REDUNDANT** |

---

### **4. DATABASE-VERZEICHNIS (Strukturierte Patches)**

| **DATEI** | **TYP** | **BESCHREIBUNG** | **STATUS** |
|-----------|---------|------------------|------------|
| `database/001_categories.sql` | Daten-Seeding | Kategorien-Definitionen | 🔶 **TEILWEISE OFFIZIELL** |
| `database/002_updates_1_51.sql` | Daten-Patch | UPDATEs für pharmakokinetische Felder (IDs 1-51) | 🔶 **TEILWEISE OFFIZIELL** |
| `database/003_medications_122_180.sql` | Daten-Patch | Neue Medikamente IDs 122-180 | 🔶 **TEILWEISE OFFIZIELL** |
| `database/004_medications_181_240.sql` | Daten-Patch | Neue Medikamente IDs 181-240 | 🔶 **TEILWEISE OFFIZIELL** |
| `database/005_medications_241_300.sql` | Daten-Patch | Neue Medikamente IDs 241-300 | 🔶 **TEILWEISE OFFIZIELL** |
| `database/006_medications_301_370.sql` | Daten-Patch | Neue Medikamente IDs 301-370 | 🔶 **TEILWEISE OFFIZIELL** |
| `database/007_cbd_interactions.sql` | Daten-Patch | CBD-Interaktionen für neue Medikamente | 🔶 **TEILWEISE OFFIZIELL** |
| `database/008_updates_54_71.sql` | Daten-Patch | Weitere UPDATEs für Medikamente 54-71 | 🔶 **TEILWEISE OFFIZIELL** |
| `database/MASTER_migration_122_370.sql` | Daten-Patch (KONSOLIDIERT) | Konsolidierte Version: 249 Medikamente (IDs 122-370) | ✅ **OFFIZIELL** (wahrscheinlich auf REMOTE verwendet) |

**Hinweis:** Das `database/`-Verzeichnis enthält eine strukturierte, inkrementelle Patch-Kette. Die Datei `MASTER_migration_122_370.sql` ist wahrscheinlich die konsolidierte Version aller 001-008 Patches.

---

### **5. CYP-PROFILE**

| **DATEI** | **TYP** | **BESCHREIBUNG** | **STATUS** |
|-----------|---------|------------------|------------|
| `cyp_profiles_high_impact.sql` | Daten-Patch | Ursprüngliche CYP-Profile (37 Einträge) - Rohdatei ohne CREATE TABLE | ⚠️ **LEGACY** (durch 010 ersetzt) |
| `010_add_cyp_profiles.sql` | Schema + Daten | Offizielle CYP-Patch-Datei mit CREATE TABLE + 37 INSERTs | ✅ **OFFIZIELL** |

---

### **6. ARCHIVE (Alte/Experimentelle Dateien)**

**Pfad:** `archive/old_sql/`

Alle Dateien in diesem Verzeichnis sind **LEGACY** und sollten **NICHT** mehr verwendet werden:

- `seed_categories.sql`, `seed_guidelines.sql`, `seed_interactions.sql`, `seed_medications.sql`
- `seed_old.sql`, `seed_step1_categories.sql`, `seed_step2_medications.sql`
- `temp_*.sql` (temporäre Experimental-Dateien)
- `upload_*.sql` (alte Upload-Scripts mit Timestamps)

**Status:** ⛔ **ARCHIVIERT - NICHT VERWENDEN**

---

## 🔄 OFFIZIELLE MIGRATIONS-/PATCH-KETTE

### **ZIEL:** Leere Datenbank → Aktueller REMOTE-Zustand (343 Medikamente, 91 CBD-Interaktionen, 37 CYP-Profile)

---

### **PHASE 1: SCHEMA-MIGRATIONEN (DDL)**

Diese Migrationen erstellen die Tabellenstruktur:

```bash
# Reihenfolge 1-7 (alle in migrations/)
1. 0001_initial_schema.sql                 # Basis-Tabellen
2. 0002_add_customer_emails.sql            # customer_emails Tabelle
3. 0003_expand_interaction_types.sql       # Erweiterte cbd_interactions
4. 0004_add_category_safety_rules.sql      # Safety-Rules für Kategorien
5. 0005_medication_pharma_fields.sql       # Pharmakokinetische Felder
6. 0006_update_high_risk_categories_safety_rules.sql  # Safety-Rule-Updates
7. 0007_add_default_general_category.sql   # Fallback-Kategorie (ID 0)
```

**Ausführung:**
```bash
cd /home/user/webapp
for i in {1..7}; do
  npx wrangler d1 migrations apply medless-production --local  # oder --remote
done
```

---

### **PHASE 2: DATEN-SEEDING (Initial Data Load)**

#### **Option A: Konsolidierte Master-Datei (EMPFOHLEN)**

**PROBLEM:** Es existiert **KEINE** einzige, konsolidierte Datei, die alle 343 Medikamente enthält.

**LÖSUNG:** Erstellen einer neuen Master-Datei:

```bash
008_master_medless_full_seed_343.sql
```

**Inhalt:**
- 22 Kategorien (IDs 0-19, 22, 25)
- 343 Medikamente (IDs 1-370, nicht sequenziell)
- 91 CBD-Interaktionen

**Status:** ⚠️ **MUSS NOCH ERSTELLT WERDEN** (siehe Empfehlungen unten)

---

#### **Option B: Inkrementelle Patches (Aktueller Ansatz auf REMOTE)**

Basierend auf dem `database/`-Verzeichnis:

```bash
# Kategorien
database/001_categories.sql

# Erste 51 Medikamente (aus seed.sql oder database/002)
database/002_updates_1_51.sql  # UPDATEs für pharmakokinetische Felder

# Neue Medikamente (IDs 122-370)
database/MASTER_migration_122_370.sql  # 249 Medikamente

# CBD-Interaktionen
database/007_cbd_interactions.sql

# Weitere Updates
database/008_updates_54_71.sql
```

**Hinweis:** Diese Kette ist **funktional**, aber **nicht vollständig dokumentiert**. Es fehlt eine klare Datei für die ersten 51 Medikamente.

---

### **PHASE 3: CYP-PROFILE**

```bash
# CYP-Struktur und Daten
010_add_cyp_profiles.sql  # Tabelle + 37 Profile für 14 Schlüssel-Medikamente
```

---

### **VOLLSTÄNDIGE MIGRATIONS-KETTE (Zusammenfassung)**

Für eine **neue, leere Datenbank** → **REMOTE-Zustand**:

```bash
# SCHEMA (DDL)
migrations/0001_initial_schema.sql
migrations/0002_add_customer_emails.sql
migrations/0003_expand_interaction_types.sql
migrations/0004_add_category_safety_rules.sql
migrations/0005_medication_pharma_fields.sql
migrations/0006_update_high_risk_categories_safety_rules.sql
migrations/0007_add_default_general_category.sql

# DATEN (Kategorien)
database/001_categories.sql

# DATEN (Medikamente IDs 1-51)
# ⚠️ FEHLENDE DATEI - muss aus seed.sql extrahiert oder neu erstellt werden
[BENÖTIGT: 008_medications_001_051.sql]

# DATEN (Medikamente IDs 122-370)
database/MASTER_migration_122_370.sql

# DATEN (Pharmakokinetische Updates)
database/002_updates_1_51.sql
database/008_updates_54_71.sql

# DATEN (CBD-Interaktionen)
database/007_cbd_interactions.sql

# CYP-PROFILE
010_add_cyp_profiles.sql
```

**Gesamt:** 15 Dateien (7 Schema + 8 Daten/Patches)

---

## ⚠️ LEGACY/VERALTETE DATEIEN

### **NICHT MEHR VERWENDEN:**

| **DATEI** | **GRUND** |
|-----------|-----------|
| `seed.sql` | Nur 51 Medikamente - durch umfangreichere Patches ersetzt |
| `MASTER_ALL_MEDICATIONS_IDEMPOTENT.sql` | Unvollständig (nur 39 Medikamente statt versprochener 341) |
| `final_patch_medications_to_200.sql` | Kategorie-26-Bug - durch CORRECTED-Version ersetzt |
| `final_patch_71_medications.sql` | Ältere Version - durch neuere Patches überholt |
| `final_patch_medications.sql` | Duplikat/Experimentalversion |
| `final_patch_medications_corrected.sql` | Ältere korrigierte Version |
| `final_patch_correct.sql` | Experimentalversion |
| `final_patch_final.sql` | Experimentalversion |
| `cyp_profiles_high_impact.sql` | Ohne CREATE TABLE - durch 010_add_cyp_profiles.sql ersetzt |
| `schlafmittel_insert.sql` | Redundant - bereits in MASTER_migration enthalten |
| `schlafmittel_interactions.sql` | Redundant - bereits in cbd_interactions enthalten |
| `seed_categories_simple.sql` | Redundant - durch database/001_categories.sql ersetzt |
| `seed_category_safety_defaults*.sql` | Legacy - Safety-Defaults sind in Migrationen 0004/0006 |
| `archive/old_sql/*` | Alle Dateien veraltet - experimentelle/temporäre Versionen |

---

## 📝 EMPFEHLUNGEN FÜR ZUKÜNFTIGE ENTWICKLUNG

### **1. FEHLENDE DATEIEN ERSTELLEN**

**DRINGEND BENÖTIGT:**

#### **A) `008_master_medless_full_seed_343.sql`**

**Zweck:** Konsolidierte Master-Datei mit allen 343 Medikamenten + 91 CBD-Interaktionen

**Inhalt:**
- ALLE 343 Medikamente (IDs 1-370, nicht sequenziell)
- ALLE 22 Kategorien
- ALLE 91 CBD-Interaktionen
- Pharmakokinetische Felder bereits gefüllt

**Erstellung:**
```sql
-- Export aus REMOTE:
npx wrangler d1 execute medless-production --remote \
  --command="SELECT * FROM medications ORDER BY id;" > medications_export.sql
npx wrangler d1 execute medless-production --remote \
  --command="SELECT * FROM cbd_interactions ORDER BY medication_id;" > cbd_interactions_export.sql
```

Dann manuell zu idempotenten `INSERT OR IGNORE` Statements umformen.

---

#### **B) `008_medications_001_051.sql` (Falls Option B bevorzugt)**

**Zweck:** Explizite Datei für die ersten 51 Medikamente

**Quelle:** Extrahieren aus `seed.sql` oder aus REMOTE exportieren

---

### **2. MIGRATIONS-NUMMERIERUNG VEREINHEITLICHEN**

**Aktuell:**
- `migrations/0001` bis `0007` (Schema DDL)
- `010_add_cyp_profiles.sql` (root-level)
- `database/001` bis `008` (separate Nummerierung)

**EMPFEHLUNG:**
- **Alle offiziellen Patches in `migrations/` verschieben**
- **Durchgehende Nummerierung:** `0001` → `0015`

**Neue Struktur:**
```
migrations/
├── 0001_initial_schema.sql
├── 0002_add_customer_emails.sql
├── 0003_expand_interaction_types.sql
├── 0004_add_category_safety_rules.sql
├── 0005_medication_pharma_fields.sql
├── 0006_update_high_risk_categories_safety_rules.sql
├── 0007_add_default_general_category.sql
├── 0008_seed_categories.sql
├── 0009_seed_medications_001_051.sql
├── 0010_seed_medications_122_370.sql
├── 0011_update_pharma_fields_001_051.sql
├── 0012_update_pharma_fields_054_071.sql
├── 0013_seed_cbd_interactions.sql
├── 0014_add_cyp_profiles.sql
└── 0015_master_full_seed_343.sql  # Optional: Konsolidierte Version
```

---

### **3. NEUE MEDIKAMENTE/INTERAKTIONEN HINZUFÜGEN**

**Workflow:**

1. **Neue Migration erstellen:**
   ```bash
   migrations/0016_add_new_medications_YYYYMMDD.sql
   ```

2. **Idempotente Statements verwenden:**
   ```sql
   INSERT OR IGNORE INTO medications (id, name, ...) VALUES (...);
   INSERT OR IGNORE INTO cbd_interactions (medication_id, ...) VALUES (...);
   ```

3. **Migration anwenden:**
   ```bash
   # Lokal testen
   npx wrangler d1 execute medless-production --local --file=migrations/0016_...sql
   
   # Remote deployen
   npx wrangler d1 execute medless-production --remote --file=migrations/0016_...sql
   ```

4. **Git Commit:**
   ```bash
   git add migrations/0016_*.sql
   git commit -m "Add 0016 migration: New medications XYZ"
   ```

---

### **4. KEINE DIREKTEN DB-ÄNDERUNGEN**

**NIEMALS:**
- Daten direkt in REMOTE ändern ohne Migration-Datei
- Migrations nachträglich editieren (nur neue Migrationen hinzufügen)

**IMMER:**
- Neue Patches als separate Dateien erstellen
- Idempotenz sicherstellen (`INSERT OR IGNORE`, `CREATE TABLE IF NOT EXISTS`)
- Lokal testen vor Remote-Deployment

---

### **5. VERALTETE DATEIEN ARCHIVIEREN**

**Aktion:**
```bash
# Verschieben aller Legacy-Dateien
mkdir -p archive/legacy_patches
mv final_patch_*.sql archive/legacy_patches/
mv seed*.sql archive/legacy_patches/
mv MASTER_ALL_MEDICATIONS_IDEMPOTENT.sql archive/legacy_patches/
mv cyp_profiles_high_impact.sql archive/legacy_patches/
mv schlafmittel_*.sql archive/legacy_patches/
```

**Nur behalten:**
- `migrations/` (offizielle Schema-Migrationen)
- `database/` (strukturierte Daten-Patches) – ggf. in `migrations/` integrieren
- `010_add_cyp_profiles.sql` – ggf. in `migrations/0014_add_cyp_profiles.sql` umbenennen

---

## 🎯 ZUSAMMENFASSUNG

### **AKTUELLER ZUSTAND:**

✅ **Funktioniert:** REMOTE-Datenbank ist vollständig und konsistent (343 Medikamente, 91 CBD-Interaktionen, 37 CYP-Profile)

⚠️ **Problem:** SQL-Datei-Struktur ist **fragmentiert** und **nicht vollständig dokumentiert**

---

### **WICHTIGSTE MASSNAHMEN:**

1. ✅ **Dokumentation erstellt** (dieses Dokument)
2. ⚠️ **Master-Seed-Datei fehlt** → Muss aus REMOTE exportiert werden
3. ⚠️ **Migrations-Nummerierung inkonsistent** → Vereinheitlichen auf `migrations/0001-0015`
4. ⚠️ **Legacy-Dateien aufräumen** → Archivieren

---

### **NÄCHSTE SCHRITTE:**

**SOFORT:**
- [ ] Export aller 343 Medikamente aus REMOTE → `008_master_medless_full_seed_343.sql`
- [ ] Export aller 91 CBD-Interaktionen aus REMOTE → inkludieren in 008
- [ ] `010_add_cyp_profiles.sql` → `migrations/0014_add_cyp_profiles.sql` umbenennen

**MITTELFRISTIG:**
- [ ] Alle `database/*` Dateien → `migrations/` integrieren
- [ ] Legacy-Dateien archivieren
- [ ] README mit Quick-Start-Guide erstellen

**LANGFRISTIG:**
- [ ] Automatisierte Migrations-Tests (CI/CD)
- [ ] Schema-Versionierung (z.B. mit Flyway oder ähnlichem Tool)

---

## 📚 REFERENZEN

- **REMOTE-Datenbank:** `medless-production` (Cloudflare D1, ID: `49ae43dd-cb94-4f42-9653-b87821f2ec31`)
- **Migrations-Tool:** `wrangler d1` CLI
- **Datenbank-Größe (REMOTE):** 0.20 MB (200704 bytes)
- **Schema-Version:** Basiert auf `migrations/0001-0007` + `010_add_cyp_profiles.sql`

---

**END OF DOCUMENT**

**Version History:**
- v1.0 (08.12.2025): Initial documentation
