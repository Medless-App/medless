# MEDLESS V1 - MIGRATION EXECUTION GUIDE

**Purpose:** Step-by-step guide for executing Migrations 016–018  
**Estimated Time:** 30-45 minutes  
**Risk Level:** LOW (all migrations are reversible)

---

## PREREQUISITES

### 1. Medical Approval Required ✅

- [ ] Medical Lead has reviewed and approved all 4 half-life corrections
- [ ] Pharmacologist has reviewed CYP-40 classification
- [ ] Technical Lead has reviewed SQL syntax

### 2. Database Backup ✅

```bash
# Create backup before migrations
npx wrangler d1 backup create medless-production
```

### 3. Development Environment Test ✅

```bash
# Test migrations on local D1 first
npx wrangler d1 execute medless-production --local --file=migrations/MIGRATION_016_FIX_HALF_LIFE.sql
npx wrangler d1 execute medless-production --local --file=migrations/MIGRATION_017_ADD_CYP_FIELDS.sql
npx wrangler d1 execute medless-production --local --file=migrations/MIGRATION_018_POPULATE_CYP_FLAGS.sql
```

---

## MIGRATION SEQUENCE

### ⚠️ IMPORTANT: Execute in this EXACT order!

```
MIGRATION 016: Fix Half-Life Values
   ↓ (Must complete before 017)
MIGRATION 017: Add CYP Boolean Fields
   ↓ (Must complete before 018)
MIGRATION 018: Populate CYP Flags
   ↓
VALIDATION QUERIES
   ↓
PRODUCTION DEPLOYMENT
```

---

## STEP 1: MIGRATION 016 (5 minutes)

### Purpose:
Fix 4 medications with medically implausible half-life values

### Execute:

```bash
# Production execution
npx wrangler d1 execute medless-production \
  --file=migrations/MIGRATION_016_FIX_HALF_LIFE.sql
```

### Validation:

```sql
-- Verify all 4 corrections applied
SELECT id, name, generic_name, half_life_hours
FROM medications
WHERE id IN (255, 269, 270, 352);
```

**Expected Output:**
```
| id  | name     | generic_name       | half_life_hours |
|-----|----------|-------------------|-----------------|
| 255 | Quensyl  | Hydroxychloroquin  | 50              |
| 269 | Fosamax  | Alendronat         | 1.5             |
| 270 | Actonel  | Risedronat         | 1.5             |
| 352 | Vigantol | Cholecalciferol    | 400             |
```

### ✅ Success Criteria:
- All 4 medications show corrected half_life_hours
- No medications remain with half_life_hours > 500h (except known long-elimination drugs)

### ❌ Rollback (if needed):
```sql
BEGIN TRANSACTION;
UPDATE medications SET half_life_hours = 1200 WHERE id = 255;
UPDATE medications SET half_life_hours = 87600 WHERE id = 269;
UPDATE medications SET half_life_hours = 43800 WHERE id = 270;
UPDATE medications SET half_life_hours = 1200 WHERE id = 352;
COMMIT;
```

---

## STEP 2: MIGRATION 017 (10 minutes)

### Purpose:
Add 15 CYP boolean fields (5 enzymes × 3 roles)

### Execute:

```bash
# Production execution
npx wrangler d1 execute medless-production \
  --file=migrations/MIGRATION_017_ADD_CYP_FIELDS.sql
```

### Validation:

```sql
-- Verify schema changes
PRAGMA table_info(medications);
```

**Expected Output (partial):**
```
| cid | name                 | type    | notnull | dflt_value | pk |
|-----|---------------------|---------|---------|------------|---|
| ... | cyp3a4_substrate    | INTEGER |    0    |     0      | 0 |
| ... | cyp2d6_substrate    | INTEGER |    0    |     0      | 0 |
| ... | cyp2c9_substrate    | INTEGER |    0    |     0      | 0 |
| ... | cyp2c19_substrate   | INTEGER |    0    |     0      | 0 |
| ... | cyp1a2_substrate    | INTEGER |    0    |     0      | 0 |
| ... | cyp3a4_inhibitor    | INTEGER |    0    |     0      | 0 |
| ... | cyp2d6_inhibitor    | INTEGER |    0    |     0      | 0 |
...
```

### Additional Validation:

```sql
-- Verify all fields initialized to 0
SELECT 
  COUNT(*) AS total,
  SUM(cyp3a4_substrate) AS cyp3a4_count,
  SUM(cyp2d6_substrate) AS cyp2d6_count
FROM medications;
```

**Expected:**
```
| total | cyp3a4_count | cyp2d6_count |
|-------|--------------|--------------|
| 343   | 0            | 0            |
```

### ✅ Success Criteria:
- PRAGMA table_info shows 15 new columns
- All new columns have INTEGER type
- All new columns have DEFAULT 0
- All counts = 0 (before population)

### ⚠️ CRITICAL: Restart Application
```bash
# After Migration 017, restart application to recognize new schema
pm2 restart medless-backend
```

### ❌ Rollback (if needed):
```sql
-- Option A: Set all fields to 0 (ignore new columns)
UPDATE medications SET 
  cyp3a4_substrate = 0, cyp2d6_substrate = 0, cyp2c9_substrate = 0,
  cyp2c19_substrate = 0, cyp1a2_substrate = 0,
  cyp3a4_inhibitor = 0, cyp2d6_inhibitor = 0, cyp2c9_inhibitor = 0,
  cyp2c19_inhibitor = 0, cyp1a2_inhibitor = 0,
  cyp3a4_inducer = 0, cyp2d6_inducer = 0, cyp2c9_inducer = 0,
  cyp2c19_inducer = 0, cyp1a2_inducer = 0;

-- Option B: Restore from database backup (recommended if serious issues)
```

---

## STEP 3: MIGRATION 018 (15 minutes)

### Purpose:
Populate CYP flags (auto-detect from TEXT + manual 40 medications)

### Execute:

```bash
# Production execution
npx wrangler d1 execute medless-production \
  --file=migrations/MIGRATION_018_POPULATE_CYP_FLAGS.sql
```

### Validation:

```sql
-- Count substrates by enzyme
SELECT 
  'CYP3A4 Substrates' AS enzyme,
  SUM(cyp3a4_substrate) AS count
FROM medications
UNION ALL
SELECT 'CYP2D6 Substrates', SUM(cyp2d6_substrate) FROM medications
UNION ALL
SELECT 'CYP2C9 Substrates', SUM(cyp2c9_substrate) FROM medications
UNION ALL
SELECT 'CYP2C19 Substrates', SUM(cyp2c19_substrate) FROM medications
UNION ALL
SELECT 'CYP1A2 Substrates', SUM(cyp1a2_substrate) FROM medications
ORDER BY count DESC;
```

**Expected Output:**
```
| enzyme              | count |
|--------------------|-------|
| CYP3A4 Substrates  | 120   |  (±10)
| CYP2D6 Substrates  | 80    |  (±10)
| CYP2C19 Substrates | 50    |  (±10)
| CYP2C9 Substrates  | 40    |  (±10)
| CYP1A2 Substrates  | 15    |  (±5)
```

### Verify Critical Medications:

```sql
-- Check sample from 40-unclear list
SELECT 
  id, 
  name, 
  generic_name,
  cyp3a4_substrate,
  cyp2d6_substrate,
  cyp2c9_substrate,
  cyp1a2_substrate,
  cyp2d6_inhibitor,
  cyp3a4_inducer
FROM medications 
WHERE id IN (
  314,  -- Colchicin (CYP3A4-Substrat)
  24,   -- Lorazepam (NON-CYP)
  282,  -- Torasemid (CYP3A4 + CYP2C9)
  5,    -- Fluoxetin (CYP2D6-Inhibitor)
  81    -- Carbamazepin (CYP3A4-Induktor)
)
ORDER BY id;
```

**Expected:**
```
| id  | name         | cyp3a4_sub | cyp2d6_sub | cyp2c9_sub | cyp1a2_sub | cyp2d6_inh | cyp3a4_ind |
|-----|-------------|-----------|-----------|-----------|-----------|-----------|-----------|
| 5   | Prozac      | ?         | ?         | ?         | ?         | 1         | 0         |
| 24  | Tavor       | 0         | 0         | 0         | 0         | 0         | 0         |
| 81  | Tegretol    | 1         | ?         | ?         | ?         | 0         | 1         |
| 282 | Torasemid   | 1         | ?         | 1         | ?         | 0         | 0         |
| 314 | Anakinra    | 1         | 0         | 0         | 0         | 0         | 0         |
```

### ✅ Success Criteria:
- CYP3A4 substrates: ~120 medications
- CYP2D6 substrates: ~80 medications
- Fluoxetin: cyp2d6_inhibitor = 1
- Carbamazepin: cyp3a4_inducer = 1
- Lorazepam: All CYP flags = 0
- Colchicin: cyp3a4_substrate = 1

### ❌ Rollback (if needed):
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

## STEP 4: FINAL VALIDATION (10 minutes)

### 1. Half-Life Distribution:

```sql
SELECT 
  CASE 
    WHEN half_life_hours < 6 THEN '< 6h (ultra-short)'
    WHEN half_life_hours < 12 THEN '6-12h (short)'
    WHEN half_life_hours < 24 THEN '12-24h (medium)'
    WHEN half_life_hours < 48 THEN '24-48h (long)'
    WHEN half_life_hours < 100 THEN '48-100h (very long)'
    ELSE '>100h (ultra-long)'
  END AS half_life_category,
  COUNT(*) AS medication_count
FROM medications
GROUP BY half_life_category
ORDER BY MIN(half_life_hours);
```

**Expected:**
- Most medications in 6-48h range
- Few medications >100h (e.g., Levothyroxin, Amiodarone)

### 2. CYP Coverage by Category:

```sql
SELECT 
  mc.name AS category_name,
  COUNT(*) AS total_medications,
  SUM(m.cyp3a4_substrate) AS cyp3a4_count,
  ROUND(SUM(m.cyp3a4_substrate) * 100.0 / COUNT(*), 1) AS cyp3a4_percentage
FROM medications m
JOIN medication_categories mc ON mc.id = m.category_id
WHERE mc.id IN (6, 8, 24, 26)  -- Statine, Immunsuppressiva, Antikoagulantien, Hormone
GROUP BY mc.name;
```

**Expected:**
- High CYP3A4 coverage in Statine, Immunsuppressiva (>80%)

### 3. Check for NULL Values:

```sql
SELECT 
  COUNT(*) AS total,
  COUNT(CASE WHEN cyp3a4_substrate IS NULL THEN 1 END) AS cyp3a4_nulls,
  COUNT(CASE WHEN cyp2d6_substrate IS NULL THEN 1 END) AS cyp2d6_nulls,
  COUNT(CASE WHEN half_life_hours IS NULL THEN 1 END) AS halflife_nulls
FROM medications;
```

**Expected:**
```
| total | cyp3a4_nulls | cyp2d6_nulls | halflife_nulls |
|-------|--------------|--------------|----------------|
| 343   | 0            | 0            | 0              |
```

### 4. Data Quality Score:

```sql
SELECT 
  COUNT(*) AS total_medications,
  SUM(CASE WHEN half_life_hours > 0 THEN 1 ELSE 0 END) AS has_halflife,
  SUM(CASE WHEN withdrawal_risk_score >= 0 THEN 1 ELSE 0 END) AS has_withdrawal,
  SUM(CASE WHEN category_id IS NOT NULL THEN 1 ELSE 0 END) AS has_category,
  ROUND(
    (SUM(CASE WHEN half_life_hours > 0 THEN 1 ELSE 0 END) +
     SUM(CASE WHEN withdrawal_risk_score >= 0 THEN 1 ELSE 0 END) +
     SUM(CASE WHEN category_id IS NOT NULL THEN 1 ELSE 0 END)) * 100.0 / (COUNT(*) * 3),
    1
  ) AS data_quality_percentage
FROM medications;
```

**Expected:**
- Data quality: >95% (Excellent)

---

## STEP 5: PRODUCTION DEPLOYMENT (15 minutes)

### 1. Build Application:

```bash
cd /home/user/webapp
npm run build
```

### 2. Deploy to Cloudflare Pages:

```bash
npx wrangler pages deploy dist --project-name medless
```

### 3. Smoke Test (5 sample plans):

**Test 1: CYP3A4 Substrate (Colchicin, ID 314)**
```bash
curl -X POST https://medless-production.pages.dev/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "medication_id": 314,
    "current_dose_mg": 1.0,
    "number_of_medications": 1
  }'
```

**Expected:** Plan with Phase 4 (CYP Adjustment) factor applied

**Test 2: NON-CYP Medication (Lorazepam, ID 24)**
```bash
curl -X POST https://medless-production.pages.dev/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "medication_id": 24,
    "current_dose_mg": 2.0,
    "number_of_medications": 1
  }'
```

**Expected:** Plan with Phase 4 factor = 1.0 (no CYP adjustment)

**Test 3: Dual CYP Metabolism (Torasemid, ID 282)**
```bash
curl -X POST https://medless-production.pages.dev/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "medication_id": 282,
    "current_dose_mg": 10.0,
    "number_of_medications": 1
  }'
```

**Expected:** Plan with CYP3A4 + CYP2C9 substrate flags

**Test 4: Polypharmacy (3 medications)**
```bash
curl -X POST https://medless-production.pages.dev/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "medication_id": 314,
    "current_dose_mg": 1.0,
    "number_of_medications": 3
  }'
```

**Expected:** Multi-Drug Interaction Factor = 1.3 (30% slower reduction)

**Test 5: Bisphosphonate (Alendronat, ID 269 - corrected half-life)**
```bash
curl -X POST https://medless-production.pages.dev/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "medication_id": 269,
    "current_dose_mg": 70.0,
    "number_of_medications": 1
  }'
```

**Expected:** Phase 3 factor = 1.0 (standard reduction, not ultra-slow)

### 4. Medical Review:

- [ ] Review 3 generated plans for medical plausibility
- [ ] Verify all 7 calculation phases are active
- [ ] Check disclaimer is displayed correctly

---

## MONITORING & FEEDBACK

### Week 1 After Deployment:

- [ ] Track first 50 generated plans
- [ ] Collect physician feedback
- [ ] Monitor for unexpected results
- [ ] Log any CYP-related calculation issues

### Data Quality Metrics:

```sql
-- Weekly check: Any new medications without CYP data?
SELECT id, name, generic_name
FROM medications
WHERE cyp3a4_substrate = 0 
  AND cyp2d6_substrate = 0 
  AND cyp2c9_substrate = 0 
  AND cyp2c19_substrate = 0 
  AND cyp1a2_substrate = 0
  AND cyp450_enzyme IS NOT NULL
  AND cyp450_enzyme != ''
ORDER BY id DESC
LIMIT 20;
```

---

## TROUBLESHOOTING

### Issue: Migration 017 fails with "column already exists"

**Cause:** Migration was already executed  
**Solution:** Check PRAGMA table_info(medications) - if columns exist, skip to Migration 018

### Issue: Migration 018 shows unexpected counts

**Cause:** TEXT field patterns may have changed  
**Solution:** Review cyp450_enzyme field for new medications, manually classify

### Issue: Phase 4 calculation still returns factor = 1.0

**Cause:** Application not restarted after Migration 017  
**Solution:** Restart application: `pm2 restart medless-backend`

### Issue: Rollback needed for all migrations

**Solution:**
```bash
# Restore from database backup
npx wrangler d1 backup restore medless-production BACKUP_ID
```

---

## SUMMARY CHECKLIST

### Pre-Migration:
- [ ] Medical approval obtained
- [ ] Database backup created
- [ ] Migrations tested on local D1

### Migration Execution:
- [ ] Migration 016 executed successfully (4 half-life corrections)
- [ ] Migration 017 executed successfully (15 CYP fields added)
- [ ] Migration 018 executed successfully (CYP flags populated)

### Validation:
- [ ] All validation queries passed
- [ ] Critical medications verified
- [ ] No NULL values in new fields
- [ ] Data quality >95%

### Deployment:
- [ ] Application restarted
- [ ] Production deployment successful
- [ ] Smoke tests passed (5 sample plans)
- [ ] Medical review completed

### Post-Deployment:
- [ ] Monitoring active
- [ ] Feedback collection started
- [ ] v1.1 roadmap prepared

---

**Status:** ✅ All migrations ready for execution  
**Estimated Total Time:** 30-45 minutes (migrations) + 15 minutes (deployment) = **~1 hour**

---

**END OF MIGRATION EXECUTION GUIDE**
