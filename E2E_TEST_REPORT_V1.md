# MEDLESS V1 – END-TO-END TEST REPORT

**Datum:** 2025-12-10  
**Status:** 🔄 IN BEARBEITUNG  
**Testumfang:** 5 kritische Medikamentenklassen

---

## 📋 TESTFALL 1: BENZODIAZEPIN (Lorazepam 2mg)

### ✅ API-ANALYSE OUTPUT

```json
{
  "medication": "Tavor",
  "category": "Benzodiazepine / Z-Drugs",
  "startDose": 2,
  "maxWeeklyPct": 3.7,
  "withdrawalScore": 9,
  "halfLife": 12,
  "twoPercentFloor": false,
  "factors": {
    "baseReductionPct": 10,
    "categoryLimit": 10,
    "halfLifeFactor": 1,
    "cypFactor": 1.15,
    "therapeuticWindowFactor": 1,
    "withdrawalFactor": 0.775,
    "interactionFactor": 1,
    "finalFactor": 0.89125
  }
}
```

### 🔍 INTERPRETATION DER BERECHNUNG

**Erwarteter Base Speed:** 5% (Benzodiazepine)  
**Tatsächlicher Base Speed:** 10% (categoryLimit = 10)  
**❌ FEHLER:** Lorazepam hat NICHT die korrigierte `max_weekly_reduction_pct = 5%`

**Berechnung:**
- Base: 10%
- Category Limit: 10% (SOLLTE 5% sein!)
- Half-Life Factor: 1.0 (12h = kurz, korrekt)
- CYP Factor: 1.15 (faster, korrekt - UGT-Metabolismus)
- Withdrawal Factor: 0.775 (Score 9, -22.5%, korrekt)
- MDI Factor: 1.0 (Single med, korrekt)
- **Final: 10 × 0.89125 = 8.9125%**
- **Effective Max Weekly: 3.7%** (nach allen Faktoren)

### ❌ KRITISCHES PROBLEM IDENTIFIZIERT

**Problem:** Das System findet "Tavor" (ID 24) statt "Lorazepam" (ID 56).

**Tavor hat:**
- `max_weekly_reduction_pct`: Vermutlich noch 10% (alt)
- Sollte: 5%

**Fix benötigt:** Database-Korrektur für "Tavor" (ID 24) fehlt.

---

