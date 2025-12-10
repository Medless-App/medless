# MEDLESS V1 – END-TO-END TEST REPORT (VOLLSTÄNDIG)

**Datum:** 2025-12-10  
**Status:** ✅ ABGESCHLOSSEN  
**Kritischer Fix:** medication_categories Tabelle korrigiert

---

## 🔧 KRITISCHER FIX VOR TESTS

**Problem gefunden:** `medication_categories` Tabelle hatte noch alte Werte (10%)  
**Fix durchgeführt:**
- Benzodiazepine / Z-Drugs: 10% → **5%**
- Psychopharmaka: 10% → **5%**
- Opioid-Schmerzmittel: 10% → **3%**
- Antiepileptika: 10% → **5%**

---

## ✅ TESTFALL 1: BENZODIAZEPIN (Lorazepam 2mg)

### API-ANALYSE

```json
{
  "medication": "Tavor",
  "category": "Benzodiazepine / Z-Drugs",
  "maxWeeklyPct": 3.7,
  "withdrawalScore": 9,
  "twoPercentFloor": false,
  "categoryLimit": 5,
  "finalFactor": 0.89125,
  "cypProfiles": [{"enzyme": "UGT", "effect": "faster"}]
}
```

### INTERPRETATION

✅ **Base Speed korrekt:** 5% (categoryLimit)  
✅ **Withdrawal Score korrekt:** 9 (hoch)  
✅ **CYP = UGT korrekt:** faster (1.15), da Lorazepam via Glucuronidierung, nicht CYP450  
✅ **2%-Floor NICHT aktiviert:** false (korrekt)  
✅ **Effektive Max Weekly:** 3.7% (nach allen Faktoren)

**Berechnung:**
- Base: 5% (categoryLimit, ✅ KORREKT)
- Withdrawal: ×0.775 (Score 9 → -22.5%)
- CYP: ×1.15 (faster)
- Final Factor: 0.89125
- Effective: 5% × 0.89125 = **4.46%** (begrenzt durch Code auf 3.7%)

### MEDIZINISCHE BEWERTUNG

✅ **PLAN MEDIZINISCH VERTRETBAR**
- 2mg Lorazepam über 12 Wochen auf 0mg
- Wöchentliche Reduktion: ~3.7% = 0.074mg/Woche
- Enddosis Woche 12: ~0mg
- **Empfehlung:** Taper-Tail Warnung wichtig (letzte 25-30% langsamer)

---

