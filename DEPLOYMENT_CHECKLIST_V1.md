# 🚀 MEDLESS V1 – DEPLOYMENT CHECKLIST

**Datum:** 2025-12-10  
**Ziel:** Produktions-Deployment von MEDLESS v1 auf Cloudflare Pages + Workers + D1

---

## **SCHRITT 1: PRE-DEPLOYMENT CHECKS (LOKAL)**

### **1.1 Git Status & Code-Commit**

```bash
cd /home/user/webapp

# Aktuellen Status prüfen
git status

# KRITISCH: Alle Änderungen committen
git add src/index.tsx src/report_templates_doctor_v3.ts src/report_data_v3.ts src/types/analyzeResponse.ts
git add public/build-info.json src/build-info.generated.ts

# Commit mit aussagekräftiger Message
git commit -m "MEDLESS V1 GO-LIVE: MDI-Fixes, 2%-Floor, 7 PDF-Warnings, DB-Validierung"

# Branch prüfen
git branch
# Erwartung: * main

# Letzter Commit-Hash notieren (für Rollback)
git log --oneline -1
```

**✅ ERFOLGSKRITERIUM:** `git status` zeigt "nothing to commit, working tree clean"

---

### **1.2 Lokaler Build-Test**

```bash
cd /home/user/webapp

# Dependencies prüfen
npm install

# Build durchführen (inkl. Build-Info-Generation)
npm run build

# Erwartung: dist/ Verzeichnis wird erstellt
ls -la dist/
# Erwartete Dateien:
# - _worker.js (Hono Worker-Code)
# - _routes.json (Routing-Config)
# - static/ (Frontend-Assets)
```

**✅ ERFOLGSKRITERIUM:** Build läuft ohne Fehler durch, `dist/_worker.js` existiert

---

### **1.3 Lokale D1-Migrations-Validierung**

```bash
cd /home/user/webapp

# Prüfen: Welche Migrations sind lokal applied?
npx wrangler d1 migrations list medless-production --local

# Erwartung: Alle Migrations 0001–0008 + 009–015 + MIGRATION_016–018 sind "applied"
# Falls nicht: Lokal migrieren
npm run db:migrate:local
```

**✅ ERFOLGSKRITERIUM:** Alle 20 Migrations sind lokal angewendet

---

## **SCHRITT 2: CLOUDFLARE SECRETS & ENV**

### **2.1 API-Key Setup prüfen**

```bash
# CRITICAL: PDFSHIFT_API_KEY muss in Cloudflare gesetzt sein
# ENTWEDER via Bash (falls setup_cloudflare_api_key funktioniert):
# setup_cloudflare_api_key

# ODER manuell (falls Bash nicht funktioniert):
# 1. Gehe zu Cloudflare Dashboard → Workers & Pages → medless → Settings → Variables & Secrets
# 2. Unter "Environment Variables" → "Add variable"
# 3. Name: PDFSHIFT_API_KEY, Value: [dein PDFShift API Key]
# 4. Save

# Prüfen: Secret ist gesetzt
npx wrangler pages secret list --project-name medless

# Erwartung: PDFSHIFT_API_KEY wird aufgelistet
```

**✅ ERFOLGSKRITERIUM:** `PDFSHIFT_API_KEY` existiert in Cloudflare

---

## **SCHRITT 3: D1-SCHEMA IN PRODUCTION MIGRIEREN**

### **3.1 Production D1-Migrations applied?**

```bash
cd /home/user/webapp

# CRITICAL: Migrations auf PRODUCTION D1 anwenden
# ACHTUNG: --remote oder ohne --local Flag für Production!
npx wrangler d1 migrations list medless-production

# Erwartung: Zeigt, welche Migrations bereits applied sind
# Falls NICHT alle 20 Migrations applied:
npx wrangler d1 migrations apply medless-production

# BESTÄTIGUNG erforderlich: Wrangler fragt "Apply X migrations? (y/n)"
# → 'y' eingeben
```

**✅ ERFOLGSKRITERIUM:** Alle Migrations 0001–0008 + 009–015 + MIGRATION_016–018 sind in Production applied

---

### **3.2 Production D1-Schema-Checks (SQL-Validierung)**

```bash
cd /home/user/webapp

# CHECK 1: has_narrow_therapeutic_window Spalte existiert?
npx wrangler d1 execute medless-production --command="PRAGMA table_info(medications);" | grep "narrow"

# Erwartung: Zeile mit "has_narrow_therapeutic_window | INTEGER | 0"

# CHECK 2: Benzodiazepine Category Limit = 5%
npx wrangler d1 execute medless-production --command="SELECT name, max_weekly_reduction_pct FROM medication_categories WHERE name = 'Benzodiazepine / Z-Drugs';"

# Erwartung: max_weekly_reduction_pct = 5

# CHECK 3: Warfarin has_narrow_therapeutic_window = 1
npx wrangler d1 execute medless-production --command="SELECT id, name, has_narrow_therapeutic_window FROM medications WHERE name LIKE '%Warfarin%' OR name LIKE '%Marcumar%';"

# Erwartung: has_narrow_therapeutic_window = 1

# CHECK 4: Lorazepam max_weekly_reduction_pct = 5
npx wrangler d1 execute medless-production --command="SELECT m.name, m.max_weekly_reduction_pct FROM medications m WHERE m.name LIKE '%Lorazepam%' OR m.name LIKE '%Tavor%';"

# Erwartung: max_weekly_reduction_pct = 5

# CHECK 5: CYP-Profile für Oxycodon existieren?
npx wrangler d1 execute medless-production --command="SELECT m.name, mcp.cyp_enzyme, mcp.role, mcp.cbd_effect_on_reduction FROM medications m JOIN medication_cyp_profile mcp ON m.id = mcp.medication_id WHERE m.name LIKE '%Oxycodon%' OR m.name LIKE '%OxyContin%';"

# Erwartung: Mind. 2 Rows (CYP3A4, CYP2D6) für Oxycodon/OxyContin
```

**✅ ERFOLGSKRITERIUM:** Alle 5 SQL-Checks zeigen erwartete Werte

---

## **SCHRITT 4: DEPLOYMENT AUF CLOUDFLARE PAGES**

### **4.1 Production Deployment**

```bash
cd /home/user/webapp

# CRITICAL: Production Deployment via npm script
npm run deploy

# Alternativ (manuell):
# npm run build
# npx wrangler pages deploy dist --project-name medless

# Erwartung: Wrangler zeigt:
# ✅ Deployment complete!
# ✨ View your site at https://medless.pages.dev
# (oder https://RANDOM-ID.medless.pages.dev)
```

**✅ ERFOLGSKRITERIUM:** Deployment erfolgreich, URL wird angezeigt

---

### **4.2 Deployment-URL & Build-Info notieren**

```bash
# Nach erfolgreichem Deployment:
# 1. Notiere Production-URL (z.B. https://medless.pages.dev)
# 2. Öffne im Browser: https://medless.pages.dev/api/build-info
# 3. Prüfe: commit, timestamp, version stimmen mit lokalem Stand überein

# Lokaler Build-Info zum Vergleich:
cat dist/build-info.json
```

**✅ ERFOLGSKRITERIUM:** Build-Info in Production = Lokaler Build-Info

---

## **SCHRITT 5: SMOKE-TESTS AUF PRODUCTION**

Siehe separate Checkliste: **SMOKE_TESTS_V1.md**

---

## **SCHRITT 6: MONITORING & LOGGING AKTIVIEREN**

```bash
# Echtzeit-Logs beobachten (in separatem Terminal)
npx wrangler pages deployment tail --project-name medless

# Alternativ: Cloudflare Dashboard → Workers & Pages → medless → Logs
```

---

## **SCHRITT 7: ROLLBACK-PLAN BEREITHALTEN**

Siehe separate Dokumentation: **ROLLBACK_PLAN_V1.md**

---

## **✅ FINAL CHECK:**

- [ ] Code committed & gepusht
- [ ] Build erfolgreich
- [ ] D1-Migrations in Production applied
- [ ] D1-Schema validiert (5 SQL-Checks passed)
- [ ] PDFSHIFT_API_KEY in Cloudflare gesetzt
- [ ] Deployment erfolgreich
- [ ] Smoke-Tests passed (siehe SMOKE_TESTS_V1.md)
- [ ] Monitoring aktiv
- [ ] Rollback-Plan dokumentiert

**→ WENN ALLE CHECKS ✅, DANN: 🟢 GO-LIVE FREIGEGEBEN**
