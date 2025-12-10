# 📊 MEDLESS V1 – MONITORING & LOGGING PLAN

**Datum:** 2025-12-10  
**Ziel:** Lightweight Monitoring für Produktions-Go-Live ohne komplexe Infrastruktur

---

## **1) KRITISCHE FEHLER & EVENTS ZU BEOBACHTEN**

### **A) FEHLERQUELLEN (PRIORITY HIGH)**

| **Event** | **Indikator** | **Action** |
|---|---|---|
| **PDF-Service Fehler** | `PDFSHIFT_API_KEY missing` oder HTTP 402/500 von PDFShift | ⚠️ Sofort prüfen: API-Key korrekt? PDFShift-Quota überschritten? |
| **D1-Datenbankfehler** | `SQLITE_ERROR`, `no such column`, `table not found` | ⚠️ Migrations-Status prüfen, ggf. Rollback |
| **Analyse-Endpunkt Crashes** | `/api/analyze` → HTTP 500, `Unhandled rejection` | ⚠️ Request-Payload loggen, Bugfix & Hotfix |
| **CYP-Profile fehlen** | `cypProfiles: []` in Analysis-Response (für kritische Meds) | ⚠️ DB-Check: CYP-Profile für Medikament vorhanden? |
| **MDI-Berechnung fehlerhaft** | `multi_drug_interaction.level = "none"` bei 6+ Meds | ⚠️ MDI-Code prüfen, evtl. Hot-Fix |
| **2%-Floor nicht aktiv** | `twoPercentFloorApplied = false` trotz Raw < 2% | ⚠️ Code-Logic prüfen (Lines 1850–1870 in `index.tsx`) |

---

### **B) PERFORMANCE-INDIKATOREN**

| **Metrik** | **Erwarteter Wert** | **Warnung bei** |
|---|---|---|
| **API Response Time** (`/api/analyze`) | < 2 Sekunden | > 5 Sekunden |
| **PDF-Generierung** (`/api/pdf/doctor`) | < 10 Sekunden | > 20 Sekunden |
| **D1-Query Time** (SELECT) | < 100ms | > 500ms |
| **Worker CPU Time** | < 50ms | > 200ms (Cloudflare Free Plan Limit) |

---

## **2) KENNZAHLEN (METRICS) – LIGHTWEIGHT TRACKING**

### **A) BUSINESS METRICS**

| **KPI** | **Definition** | **Wie messen?** |
|---|---|---|
| **Analysen pro Tag** | Anzahl erfolgreicher `/api/analyze` Requests | Cloudflare Analytics → Requests → `/api/analyze` |
| **PDF-Generierungen pro Tag** | Anzahl erfolgreicher `/api/pdf/*` Requests | Cloudflare Analytics → Requests → `/api/pdf/*` |
| **Fehlerquote (%)** | (HTTP 500/502) / (Total Requests) × 100 | Cloudflare Analytics → Status Codes → 5xx |
| **Durchschnittliche Medikamenten-Anzahl pro Analyse** | Avg. `medications.length` in `/api/analyze` | Manuell aus Logs (siehe Abschnitt 3) |

---

### **B) TECHNISCHE METRICS**

| **Metrik** | **Wie messen?** |
|---|---|
| **Request-Volumen** | Cloudflare Dashboard → Workers & Pages → medless → Analytics → Total Requests |
| **Bandwidth** | Cloudflare Analytics → Bandwidth (wichtig für PDF-Downloads) |
| **CPU Time (Worker)** | Cloudflare Analytics → CPU Time per Request |
| **D1-Queries per Day** | Cloudflare D1 Dashboard → medless-production → Metrics |

---

## **3) CLOUDFLARE-NATIVE MONITORING (OHNE EXTERNE TOOLS)**

### **A) WRANGLER TAIL (ECHTZEIT-LOGS)**

```bash
# Terminal 1: Echtzeit-Logs streamen
npx wrangler pages deployment tail --project-name medless

# Output zeigt:
# - Alle console.log() aus Worker-Code
# - Request-URLs
# - Response-Status-Codes
# - Execution-Time

# WICHTIG: Logs nach kritischen Patterns filtern
npx wrangler pages deployment tail --project-name medless | grep -E "(ERROR|500|PDFSHIFT|SQLITE)"
```

**✅ USE CASE:** Während Go-Live erste 1–2 Stunden aktiv beobachten

---

### **B) CLOUDFLARE DASHBOARD (HISTORISCHE DATEN)**

**Navigation:**
1. Cloudflare Dashboard → Workers & Pages → `medless`
2. Tab: **Analytics**
   - **Requests over Time** → Trend erkennen
   - **Status Codes** → 5xx-Errors beobachten
   - **Invocation Statuses** → Success/Failure Rate
3. Tab: **Logs**
   - Letzte 24h Logs durchsuchen (Search nach "ERROR", "PDFSHIFT", "500")

**✅ USE CASE:** Täglich nach Go-Live für erste Woche überprüfen

---

### **C) D1-DATABASE MONITORING**

```bash
# D1-Metrics abrufen (Query-Anzahl, Fehlerrate)
# ACHTUNG: Cloudflare CLI hat noch kein natives Metrics-Command für D1

# Workaround: Manuell im Dashboard
# Cloudflare Dashboard → D1 → medless-production → Metrics
# Zeigt:
# - Read/Write Queries per Day
# - Storage Size
# - Errors
```

**✅ USE CASE:** Wöchentlich prüfen, ob DB-Size wächst (sollte stabil bei ~10MB bleiben)

---

## **4) ALERT-STRATEGIE (MANUELL / SEMI-AUTOMATISIERT)**

### **A) KRITISCHE ALERTS (BINNEN 1 STUNDE REAGIEREN)**

| **Alert** | **Trigger** | **Action** |
|---|---|---|
| **PDF-Service Down** | PDFShift API gibt 500/502 zurück | 1. PDFShift-Dashboard prüfen<br>2. Falls API-Problem: Rollback oder Wartungsmodus |
| **D1-Migrations fehlen** | `no such column` Error in Logs | 1. `wrangler d1 migrations list` prüfen<br>2. Fehlende Migration(s) sofort applyen |
| **5xx-Fehlerrate > 5%** | Cloudflare Analytics zeigt >5% 5xx | 1. Logs abrufen → Root Cause finden<br>2. Hotfix oder Rollback |

---

### **B) NON-KRITISCHE ALERTS (BINNEN 24H REAGIEREN)**

| **Alert** | **Trigger** | **Action** |
|---|---|---|
| **Langsame PDF-Generierung** | Durchschnittlich >15 Sekunden | 1. PDFShift Performance prüfen<br>2. HTML-Template optimieren (weniger Inline-CSS) |
| **Hohe D1-Query-Last** | >100k Queries/Tag | 1. Query-Caching einführen (z.B. KV für häufige Meds)<br>2. DB-Indexes prüfen |
| **Unbekannte Medikamente** | Analyse-Logs zeigen oft "Medikation nicht gefunden" | 1. Häufig angefragte Meds identifizieren<br>2. DB erweitern (Seed-Update) |

---

### **C) SETUP FÜR EMAIL-ALERTS (OPTIONAL, VIA CLOUDFLARE)**

```bash
# Cloudflare Email Notifications einrichten:
# 1. Dashboard → Notifications → "Add"
# 2. Event: "Pages Deployment Failed" oder "Workers Script Errors"
# 3. Email: [deine Email]

# Erwartung: Bei kritischen Fehlern automatisch Email erhalten
```

**✅ USE CASE:** Für Nachtstunden / Wochenenden, wenn kein aktives Monitoring

---

## **5) LOGGING-BEST-PRACTICES IM CODE**

### **A) KRITISCHE LOG-STATEMENTS (BEREITS IMPLEMENTIERT)**

**In `src/index.tsx` (Worker):**

```typescript
// ANALYSE-ENDPUNKT
app.post('/api/analyze', async (c) => {
  console.log('[ANALYZE] Request received', {
    medicationsCount: medications.length,
    durationWeeks,
    age,
    gender
  });

  // ... Analyse-Logic ...

  console.log('[ANALYZE] Response prepared', {
    analysisCount: analysis.length,
    mdiLevel: multi_drug_interaction.level,
    twoPercentFloorApplied: analysis.filter(a => a.twoPercentFloor).length
  });
});

// PDF-ENDPUNKT
app.post('/api/pdf/doctor', async (c) => {
  if (!env.PDFSHIFT_API_KEY) {
    console.error('[PDF] PDFSHIFT_API_KEY missing');
    return c.json({ error: 'PDFSHIFT_API_KEY missing' }, 500);
  }

  console.log('[PDF] Generation started', { medicationsCount });

  // Nach PDFShift-Call:
  if (pdfResponse.ok) {
    console.log('[PDF] Generation successful', { size: pdfBlob.size });
  } else {
    console.error('[PDF] Generation failed', { 
      status: pdfResponse.status, 
      error: await pdfResponse.text() 
    });
  }
});
```

**✅ DIESE LOGS ERSCHEINEN IN WRANGLER TAIL & CLOUDFLARE LOGS**

---

### **B) LOG-LEVELS (EMPFEHLUNG FÜR V2)**

| **Level** | **Use Case** | **Beispiel** |
|---|---|---|
| `console.log()` | Normale Requests (Info) | `[ANALYZE] Request received` |
| `console.warn()` | Ungewöhnliche Zustände (Warning) | `[ANALYZE] Medication not found in DB` |
| `console.error()` | Fehler / Crashes (Error) | `[PDF] PDFSHIFT_API_KEY missing` |

---

## **6) DAILY MONITORING ROUTINE (ERSTE WOCHE NACH GO-LIVE)**

### **TÄGLICHE CHECKS (5 MINUTEN)**

```bash
# CHECK 1: Cloudflare Analytics → Requests & Status Codes
# Frage: Gibt es ungewöhnlich viele 5xx-Errors?

# CHECK 2: Wrangler Tail → Letzte 10 Minuten
npx wrangler pages deployment tail --project-name medless --format pretty | head -50

# CHECK 3: D1-Database → Storage Size
# Dashboard → D1 → medless-production → Metrics → Storage
# Erwartung: ~10MB (stabil, kein plötzlicher Anstieg)

# CHECK 4: PDF-Service → Quota
# PDFShift Dashboard → Usage
# Erwartung: < 500 PDFs/Tag (Free Tier: 500/Monat, Paid: 5000/Monat)
```

**✅ WENN ALLE 4 CHECKS OK → SYSTEM LÄUFT STABIL**

---

## **7) LANGFRIST-MONITORING (AB WOCHE 2)**

### **WÖCHENTLICHE REVIEWS**

| **Metrik** | **Ziel** |
|---|---|
| **Total Analysen (Woche)** | Trend steigend? |
| **5xx-Fehlerrate** | < 1% |
| **Avg. PDF-Generierungszeit** | < 10 Sekunden |
| **PDFShift Quota** | < 80% verbraucht |
| **User-Feedback** | Positive Rückmeldungen? Bugs gemeldet? |

---

## **✅ ZUSAMMENFASSUNG: MINIMALES, ABER EFFEKTIVES MONITORING**

1. **Echtzeit:** `wrangler tail` während Go-Live (erste 2h)
2. **Täglich:** Cloudflare Analytics + Logs (5 Min.)
3. **Wöchentlich:** Kennzahlen-Review + PDFShift-Quota
4. **Alerts:** Email-Notifications für kritische Fehler (optional)
5. **Langfristig:** Erweiterte Metrics via Cloudflare Workers Analytics (ab v2)

**→ KEIN EXTERNES MONITORING-TOOL NÖTIG FÜR V1**
