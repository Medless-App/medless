# 📊 MEDLESS V1 – MONITORING SETUP (POST GO-LIVE)

**Deployment-URL:** https://medless.pages.dev  
**Go-Live:** 2025-12-10 01:38 UTC

---

## **UNMITTELBARES MONITORING (ERSTE 2H NACH GO-LIVE)**

### **METHODE: WRANGLER TAIL (ECHTZEIT-LOGS)**

```bash
# Terminal 1: Echtzeit-Logs streamen
npx wrangler pages deployment tail --project-name medless

# Terminal 2: Gefilterte Logs (nur Fehler)
npx wrangler pages deployment tail --project-name medless | grep -E "(ERROR|500|PDFSHIFT|SQLITE|FAIL)"
```

### **WORAUF ACHTEN (KRITISCHE FEHLER):**

| **Fehler-Pattern** | **Bedeutung** | **Priorität** | **Action** |
|---|---|---|---|
| `PDFSHIFT_API_KEY missing` | PDF-Service down | 🔴 **CRITICAL** | Secret via Dashboard setzen → Re-Deploy |
| `SQLITE_ERROR: no such column` | D1-Schema inkonsistent | 🔴 **CRITICAL** | Rollback → Migration fix |
| `no such table: medication_cyp_profile` | Migration fehlt | 🔴 **CRITICAL** | Rollback |
| `TypeError: Cannot read property` | JS-Runtime-Fehler | 🔴 **CRITICAL** | Rollback |
| `/api/analyze` → 500 | Analyse-Endpunkt crashed | 🔴 **CRITICAL** | Rollback |
| `/api/pdf/doctor` → 500 | PDF-Generierung fehlt | 🟠 **HIGH** | PDFSHIFT-Status prüfen |
| `Request timeout` | Worker zu langsam | 🟡 **MEDIUM** | Performance-Analyse |
| `429 Too Many Requests` | Rate-Limit erreicht | 🟢 **LOW** | Monitoring, ggf. Skalierung |

### **2-3 KENNZAHLEN ZU BEOBACHTEN:**

1. **Fehlerquote (5xx):**
   - **Ziel:** < 1%
   - **Warnung bei:** > 5%
   - **Kritisch bei:** > 20% (sofortiger Rollback)

2. **Durchschnittliche Analysezeit:**
   - **Ziel:** < 2 Sekunden
   - **Warnung bei:** > 5 Sekunden
   - **Kritisch bei:** > 10 Sekunden (Performance-Problem)

3. **PDF-Error-Rate:**
   - **Ziel:** < 5%
   - **Warnung bei:** > 20%
   - **Kritisch bei:** > 90% (PDFSHIFT_API_KEY fehlt)

---

## **CLOUDFLARE DASHBOARD MONITORING (ERSTE 24H)**

### **NAVIGATION:**
1. Cloudflare Dashboard → Workers & Pages → `medless`
2. Tab: **Analytics**
   - **Requests over Time** → Trend erkennen
   - **Status Codes** → 5xx-Errors überwachen
   - **Invocation Statuses** → Success/Failure Rate

### **TÄGLICHE CHECKS (ERSTE WOCHE):**

**MORGENS (5 MIN):**
```bash
# 1. Cloudflare Analytics öffnen
# → Requests letzte 24h
# → Status Codes: 5xx < 1%?

# 2. Wrangler Tail (letzte 10 Minuten)
npx wrangler pages deployment tail --project-name medless --format pretty | head -50

# 3. D1-Database → Storage Size
# Erwartung: ~10MB (stabil)
```

**ABENDS (2 MIN):**
```bash
# 1. Cloudflare Analytics → Invocation Statuses
# → Success Rate > 99%?

# 2. PDFShift Dashboard → Usage
# → Quota < 80%?
```

---

## **TYPISCHE FEHLER & PRIORISIERUNG**

### **🔴 KRITISCH (SOFORTIGER ROLLBACK):**

1. **Analyse-Endpunkt crashed bei Standard-Anfragen**
   - Pattern: `POST /api/analyze` → 500
   - Action: Rollback auf `v1.0-stable` Tag
   - ETA: 10 Min. (siehe ROLLBACK_PLAN_V1.md)

2. **D1-Schema-Fehler (fehlende Spalten)**
   - Pattern: `SQLITE_ERROR: no such column: has_narrow_therapeutic_window`
   - Action: Rollback + Schema-Fix
   - ETA: 15 Min.

3. **JavaScript-Runtime-Fehler**
   - Pattern: `TypeError`, `ReferenceError`, `Unhandled rejection`
   - Action: Rollback
   - ETA: 10 Min.

### **🟠 HIGH (HOTFIX BINNEN 1H):**

1. **PDF-Generierung komplett down**
   - Pattern: `/api/pdf/doctor` → 500 (100% Fehlerrate)
   - Action: PDFSHIFT_API_KEY prüfen → Secret setzen
   - ETA: 5 Min. (kein Re-Deploy nötig, nur Secret-Update)

2. **5xx-Fehlerrate 5–20%**
   - Pattern: Cloudflare Analytics zeigt 10% 5xx
   - Action: Root Cause via Logs → Hotfix oder Rollback
   - ETA: 30–60 Min.

### **🟡 MEDIUM (BINNEN 24H):**

1. **Langsame PDF-Generierung (>15 Sek.)**
   - Pattern: Wrangler Logs zeigen `PDF Generation: 18s`
   - Action: PDFShift Performance prüfen, HTML optimieren
   - ETA: 24h (kein Blocker für Go-Live)

2. **Einzelne Medikamente nicht gefunden**
   - Pattern: `Medication not found: XYZ`
   - Action: DB erweitern (Seed-Update)
   - ETA: 24h

---

## **LOG-PATTERNS ZU BEACHTEN**

### **NORMALE LOGS (INFO):**

```
[ANALYZE] Request received { medicationsCount: 2, durationWeeks: 12 }
[ANALYZE] Response prepared { analysisCount: 2, mdiLevel: 'mild' }
[PDF] Generation started { medicationsCount: 2 }
[PDF] Generation successful { size: 524288 }
```

### **WARNENDE LOGS (WARNING):**

```
[ANALYZE] Medication not found in DB: Ibuprofen
[PDF] Generation slow: 15s
[CYP] No profiles found for medication ID 123
```

### **KRITISCHE LOGS (ERROR):**

```
[PDF] PDFSHIFT_API_KEY missing
[ANALYZE] DB query failed: SQLITE_ERROR
[PDF] Generation failed: 500 Internal Server Error
```

---

## **MONITORING-COMMANDS (QUICK REFERENCE)**

```bash
# Echtzeit-Logs (volle Ausgabe)
npx wrangler pages deployment tail --project-name medless

# Echtzeit-Logs (nur Fehler)
npx wrangler pages deployment tail --project-name medless | grep -E "(ERROR|500)"

# Letzten 50 Log-Einträge (nicht-blockierend)
npx wrangler pages deployment tail --project-name medless --format pretty | head -50

# Deployment-Liste (für Rollback-URL)
npx wrangler pages deployment list --project-name medless

# D1-Database Size prüfen
npx wrangler d1 info medless-production --remote
```

---

## **ALERT-STRATEGIE (ERSTE WOCHE)**

### **KRITISCHE ALERTS (BINNEN 1H REAGIEREN):**

- 5xx-Fehlerrate > 5%
- PDF-Service komplett down (100% Fehlerrate)
- D1-Migrations fehlen (Schema-Fehler)

### **NON-KRITISCHE ALERTS (BINNEN 24H):**

- Langsame PDF-Generierung (>15 Sek.)
- Hohe D1-Query-Last (>100k Queries/Tag)
- Unbekannte Medikamente häufig angefragt

### **SETUP FÜR EMAIL-ALERTS (OPTIONAL):**

1. Cloudflare Dashboard → Notifications → "Add"
2. Event: "Pages Deployment Failed" oder "Workers Script Errors"
3. Email: [Admin-Email]

**→ Bei kritischen Fehlern automatisch Email erhalten**

---

## **STATUS NACH ERSTEN 2H GO-LIVE**

**Erwartetes Ergebnis:**
- ✅ Keine kritischen Fehler in Logs
- ✅ 5xx-Fehlerrate < 1%
- ✅ PDF-Generierung funktioniert
- ✅ Analyse-Endpunkt stabil

**Falls NICHT erfüllt:**
→ Siehe ROLLBACK_PLAN_V1.md

---

## **LANGFRIST-MONITORING (AB TAG 2)**

### **WÖCHENTLICHE REVIEWS:**

| **Metrik** | **Ziel** | **Prüfen via** |
|---|---|---|
| Total Analysen (Woche) | Trend steigend? | Cloudflare Analytics |
| 5xx-Fehlerrate | < 1% | Cloudflare Analytics → Status Codes |
| Avg. PDF-Zeit | < 10 Sek. | Wrangler Logs |
| PDFShift Quota | < 80% | PDFShift Dashboard |

---

## **✅ ZUSAMMENFASSUNG: MINIMALES, ABER EFFEKTIVES MONITORING**

1. **Echtzeit (erste 2h):** Wrangler Tail aktiv beobachten
2. **Täglich (erste Woche):** Cloudflare Analytics + Logs (5 Min.)
3. **Wöchentlich (ab Woche 2):** Kennzahlen-Review + PDFShift-Quota
4. **Alerts:** Email-Notifications für kritische Fehler (optional)

**→ KEIN EXTERNES MONITORING-TOOL NÖTIG FÜR V1**
