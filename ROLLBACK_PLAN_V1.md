# 🔄 MEDLESS V1 – ROLLBACK-PLAN

**Datum:** 2025-12-10  
**Ziel:** Schnelle Wiederherstellung bei kritischen Produktionsfehlern

---

## **WANN ROLLBACK DURCHFÜHREN?**

### **KRITISCHE FEHLER (SOFORTIGER ROLLBACK):**

- ❌ **PDF-Generierung komplett down** (>90% Fehlerrate)
- ❌ **D1-Datenbank nicht erreichbar** (`SQLITE_ERROR: no such table`)
- ❌ **5xx-Fehlerrate >20%** über 10+ Minuten
- ❌ **Analyse-Endpunkt crasht** bei Standard-Anfragen
- ❌ **Datenverlust** oder fehlerhafte Berechnungen (z.B. falsche Dosierungen)

### **NON-KRITISCHE FEHLER (KEIN ROLLBACK, HOTFIX):**

- ⚠️ Einzelne Medikamente nicht gefunden
- ⚠️ Langsame PDF-Generierung (<20 Sekunden)
- ⚠️ UI/UX-Bugs ohne Funktionsverlust

---

## **ROLLBACK-SCHRITTE (CLOUDFLARE PAGES)**

### **SCHRITT 1: CLOUDFLARE DASHBOARD – DEPLOYMENT HISTORY**

```bash
# Option A: Via Cloudflare Dashboard (GUI)
# 1. Cloudflare Dashboard → Workers & Pages → medless
# 2. Tab: "Deployments"
# 3. Finde letzte STABILE Deployment (vor dem fehlerhaften)
# 4. Klicke auf "..." → "Rollback to this deployment"
# 5. Bestätige mit "Rollback"

# Erwartung: Innerhalb 1–2 Minuten ist alte Version wieder live
```

**✅ ERFOLGSKRITERIUM:** 
- Deployment-Status = "Active"
- Build-Info zeigt alten Commit-Hash
- Smoke-Tests (siehe `SMOKE_TESTS_V1.md`) laufen erfolgreich

---

### **SCHRITT 2: WRANGLER CLI (ALTERNATIVE)**

```bash
# Falls Dashboard nicht verfügbar:

# 1. Liste alle Deployments auf
npx wrangler pages deployment list --project-name medless

# Output zeigt:
# ID                    | Created               | Status   | Branch
# abc123def456...       | 2025-12-10 14:30:00  | Active   | main
# xyz789ghi012...       | 2025-12-09 10:15:00  | Inactive | main

# 2. Finde ID des letzten stabilen Deployments (z.B. xyz789ghi012)

# 3. ACHTUNG: Cloudflare CLI hat KEIN natives "rollback" Command
# Workaround: Re-Deploy der alten Version via Git

# Git-basierter Rollback:
cd /home/user/webapp
git log --oneline -10  # Finde Commit-Hash der stabilen Version
git checkout <STABLE-COMMIT-HASH>  # z.B. 9343c2c
npm run build
npx wrangler pages deploy dist --project-name medless
```

**✅ ERFOLGSKRITERIUM:** Gleich wie Option A

---

## **SCHRITT 3: D1-DATENBANK ROLLBACK (FALLS NÖTIG)**

### **SZENARIO: Migration fehlgeschlagen oder fehlerhafte Daten**

```bash
# ACHTUNG: D1 hat KEINE automatische Rollback-Funktion für Migrations
# Workaround: Manuelle Korrektur via SQL

# 1. Identifiziere fehlerhafte Migration
npx wrangler d1 migrations list medless-production

# 2. Falls z.B. Migration 0018 fehlerhaft:
# Option A: Revert via SQL (falls Revert-Script existiert)
npx wrangler d1 execute medless-production --file=./migrations/0018_REVERT.sql

# Option B: Manuelle Korrektur via SQL
npx wrangler d1 execute medless-production --command="
  ALTER TABLE medications DROP COLUMN fehlerhafte_spalte;
"

# 3. ACHTUNG: Für kritische Schema-Änderungen
# → Backup vor Deployment erstellen (siehe unten)
```

**✅ BEST PRACTICE:**
- **VOR jedem Production-Deployment:** D1-Backup via `wrangler d1 export`
- **NACH Rollback:** Schema-Check (siehe `DEPLOYMENT_CHECKLIST_V1.md`, Schritt 3.2)

---

## **SCHRITT 4: SECRETS & ENV WIEDERHERSTELLEN (FALLS GEÄNDERT)**

```bash
# Falls PDFSHIFT_API_KEY oder andere Secrets während Deployment geändert wurden:

# 1. Alten Key wiederherstellen (manuell)
npx wrangler pages secret put PDFSHIFT_API_KEY --project-name medless
# → Eingabe: [alter API Key]

# 2. Verifizieren
npx wrangler pages secret list --project-name medless

# Erwartung: Alter Key ist gesetzt
```

---

## **SCHRITT 5: POST-ROLLBACK VERIFICATION**

### **SMOKE-TESTS WIEDERHOLEN (VERKÜRZTE VERSION)**

```bash
# 1. Build-Info prüfen
curl -s https://medless.pages.dev/api/build-info | jq .

# Erwartung: 
# {
#   "commit": "<ALTER-COMMIT-HASH>",
#   "timestamp": "<ALTES-DATUM>"
# }

# 2. Analyse-Test (Benzo)
curl -X POST https://medless.pages.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [{"name": "Lorazepam", "mgPerDay": 2, "timesPerDay": 2}],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female"
  }' | jq '.analysis[0] | { medication, maxWeeklyPct, withdrawalScore }'

# Erwartung: 
# {
#   "medication": "Tavor",
#   "maxWeeklyPct": 3.7,
#   "withdrawalScore": 9
# }

# 3. PDF-Test
curl -X POST https://medless.pages.dev/api/pdf/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [{"name": "Lorazepam", "mgPerDay": 2, "timesPerDay": 2}],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female"
  }' \
  --output /tmp/rollback_test.pdf

# Erwartung: PDF ohne Fehler erstellt
```

**✅ ERFOLGSKRITERIUM:** Alle 3 Tests laufen erfolgreich

---

## **FEHLERDIAGNOSE (ERSTE SCHRITTE BEI PROBLEMEN)**

### **CHECKLISTE BEI UNKLAREM FEHLER:**

1. **Logs abrufen (ERSTE PRIORITÄT):**
   ```bash
   npx wrangler pages deployment tail --project-name medless | grep -E "(ERROR|500)"
   ```
   → **Suche nach:** Stack Traces, `SQLITE_ERROR`, `PDFSHIFT`, `Unhandled rejection`

2. **D1-Status prüfen:**
   ```bash
   npx wrangler d1 migrations list medless-production
   npx wrangler d1 execute medless-production --command="SELECT COUNT(*) FROM medications;"
   ```
   → **Erwartung:** Alle Migrations applied, ~343 Medikamente in DB

3. **PDF-Service prüfen:**
   - PDFShift Dashboard → Usage & Errors
   - API-Key korrekt gesetzt? `npx wrangler pages secret list --project-name medless`

4. **Konfiguration prüfen:**
   ```bash
   cat wrangler.jsonc | jq .
   ```
   → **Erwartung:** `d1_databases.database_id` korrekt, `name = "medless"`

5. **Build-Artefakte prüfen:**
   ```bash
   ls -lh dist/_worker.js
   ```
   → **Erwartung:** `_worker.js` existiert, ~500KB–2MB Größe

---

## **ROLLBACK-ENTSCHEIDUNGSBAUM**

```
┌─────────────────────────────────────┐
│ Fehler in Production entdeckt       │
└──────────────┬──────────────────────┘
               │
       ┌───────▼────────┐
       │ Kritischer      │  JA  ┌──────────────────────┐
       │ Fehler?         ├──────►│ SOFORTIGER ROLLBACK  │
       │ (siehe oben)    │      └──────────────────────┘
       └───────┬─────────┘
               │ NEIN
               │
       ┌───────▼────────┐
       │ Hotfix möglich  │  JA  ┌──────────────────────┐
       │ binnen 1h?      ├──────►│ HOTFIX + Re-Deploy   │
       └───────┬─────────┘      └──────────────────────┘
               │ NEIN
               │
       ┌───────▼────────┐
       │ ROLLBACK +      │
       │ FIX offline     │
       └─────────────────┘
```

---

## **BACKUP-STRATEGIE (FÜR ZUKÜNFTIGE DEPLOYMENTS)**

### **VOR JEDEM PRODUCTION-DEPLOYMENT:**

```bash
# 1. Git-Tag erstellen (für schnellen Rollback)
git tag -a v1.0.0 -m "MEDLESS V1 Go-Live"
git push origin v1.0.0

# 2. D1-Datenbank Backup (OPTIONAL, falls Schema-Änderungen)
npx wrangler d1 export medless-production --output=./backups/medless_pre_v1.0.0.sql

# 3. Wrangler.jsonc + .env sichern
cp wrangler.jsonc ./backups/wrangler_v1.0.0.jsonc
```

**✅ VORTEIL:** Bei Rollback einfach `git checkout v1.0.0` + re-deploy

---

## **✅ ROLLBACK-PLAN ZUSAMMENFASSUNG**

| **Schritt** | **Dauer** | **Tool** |
|---|---|---|
| 1. Cloudflare Dashboard → Rollback | ~2 Minuten | GUI |
| 2. (Alternative) Git-Checkout + Re-Deploy | ~5 Minuten | CLI |
| 3. D1-Schema-Check | ~2 Minuten | SQL |
| 4. Secrets wiederherstellen (falls nötig) | ~1 Minute | Wrangler |
| 5. Smoke-Tests | ~3 Minuten | curl |

**→ TOTAL ROLLBACK TIME: ~10–15 MINUTEN**

---

## **KOMMUNIKATION BEI ROLLBACK**

### **INTERN (TEAM):**
- **Slack / Email:** "MEDLESS Rollback durchgeführt. Grund: [Fehler]. Status: Stabil. Fix ETA: [Zeit]"

### **EXTERN (FALLS USER BETROFFEN):**
- **Status-Page / Banner:** "Wartungsarbeiten. System wieder verfügbar."
- **Keine Details zu technischen Fehlern** (Sicherheit)

---

## **POST-ROLLBACK TODO:**

1. **Root Cause Analysis:** Warum ist Fehler aufgetreten?
2. **Fix entwickeln:** Lokal testen + E2E-Tests wiederholen
3. **Staging-Deployment:** Erst auf Preview-Branch testen
4. **Production Re-Deploy:** Nur nach erfolgreichen Tests

**→ KEIN ZWEITER ROLLBACK NÖTIG**
