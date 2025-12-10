# 🧪 MEDLESS V1 – SMOKE-TEST-CHECKLISTE (PRODUCTION)

**Datum:** 2025-12-10  
**Umgebung:** Cloudflare Pages Production (`https://medless.pages.dev`)

---

## **SMOKE-TEST 1: ROOT & APP**

### **1.1 Root-Redirect**

```bash
# Test: GET / sollte auf /app redirecten oder Startseite zeigen
curl -I https://medless.pages.dev/

# Erwartung:
# HTTP/2 200 (wenn Startseite)
# ODER HTTP/2 301/302 + Location: /app (wenn Redirect)
```

**✅ PASS:** Status = 200 oder 3xx mit Location-Header

---

### **1.2 App lädt ohne Fehler**

```bash
# Test: GET /app sollte HTML ohne JS-Fehler zurückgeben
curl -s https://medless.pages.dev/app | grep -i "<!DOCTYPE html"

# Erwartung: HTML-Struktur vorhanden

# Manueller Test im Browser:
# 1. Öffne: https://medless.pages.dev/app
# 2. Browser DevTools → Console öffnen
# 3. Prüfe: KEINE roten Fehler (außer evtl. harmlose Warnings)
```

**✅ PASS:** 
- HTML wird geladen
- Keine kritischen JS-Fehler in Browser-Console

---

## **SMOKE-TEST 2: API BASIC**

### **2.1 Build-Info Endpoint**

```bash
# Test: GET /api/build-info zeigt Deployment-Details
curl -s https://medless.pages.dev/api/build-info | jq .

# Erwartung: JSON mit Feldern:
# {
#   "commit": "COMMIT-HASH",
#   "timestamp": "2025-12-10T...",
#   "version": "1.0.0",
#   "environment": "production"
# }
```

**✅ PASS:** JSON-Response mit korrekten Feldern, `environment = "production"`

---

### **2.2 Health-Check (optional, falls vorhanden)**

```bash
# Test: GET /api/health (falls implementiert)
curl -s https://medless.pages.dev/api/health

# Erwartung: HTTP 200 + JSON { "status": "ok" }
```

**✅ PASS (optional):** Health-Endpoint antwortet mit 200

---

## **SMOKE-TEST 3: ANALYSE-ENDPUNKT**

### **3.1 Single Medication – Benzodiazepin**

```bash
# Test: Analyse für Lorazepam 2mg
curl -X POST https://medless.pages.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      {
        "name": "Lorazepam",
        "mgPerDay": 2,
        "timesPerDay": 2
      }
    ],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female"
  }' | jq '.'

# ERWARTETE FELDER IM RESPONSE:
# {
#   "analysis": [
#     {
#       "medication": "Tavor",
#       "category": "Benzodiazepine / Z-Drugs",
#       "maxWeeklyPct": 3.7,
#       "withdrawalScore": 9,
#       "twoPercentFloor": false,
#       "cypProfiles": [ { "enzyme": "UGT", "effect": "faster" } ]
#     }
#   ],
#   "multi_drug_interaction": { "level": "none" }
# }
```

**✅ PASS:** 
- HTTP 200
- `analysis[0].medication` = "Tavor" oder "Lorazepam"
- `maxWeeklyPct` ≈ 3.7
- `withdrawalScore` = 9
- `twoPercentFloor` = false

---

### **3.2 Multi Medication – Polypharmazie**

```bash
# Test: 3 Medikamente (Benzo + Antipsychotikum + SSRI)
curl -X POST https://medless.pages.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      { "name": "Lorazepam", "mgPerDay": 2, "timesPerDay": 2 },
      { "name": "Quetiapin", "mgPerDay": 300, "timesPerDay": 1 },
      { "name": "Sertralin", "mgPerDay": 100, "timesPerDay": 1 }
    ],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female"
  }' | jq '.multi_drug_interaction'

# ERWARTETE FELDER:
# {
#   "level": "mild" oder "moderate",
#   "inhibitorsCount": 2-3,
#   "inducersCount": 0-1,
#   "adjustmentFactor": 0.9
# }
```

**✅ PASS:**
- `multi_drug_interaction.level` ≠ "none"
- `adjustmentFactor` existiert (z.B. 0.9)
- Mind. 1 Medikament hat `twoPercentFloor = true`

---

### **3.3 Narrow Window – Warfarin**

```bash
# Test: Narrow Window Drug
curl -X POST https://medless.pages.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      { "name": "Warfarin", "mgPerDay": 5, "timesPerDay": 1 }
    ],
    "durationWeeks": 12,
    "age": 65,
    "weight": 70,
    "gender": "male"
  }' | jq '.analysis[0] | { narrowWindow, maxWeeklyPct, withdrawalScore }'

# ERWARTETE FELDER:
# {
#   "narrowWindow": 1 (oder true),
#   "maxWeeklyPct": 2,
#   "withdrawalScore": 10
# }
```

**✅ PASS:**
- `narrowWindow` = 1 oder true
- `maxWeeklyPct` = 0 oder 2
- `withdrawalScore` = 10

---

## **SMOKE-TEST 4: PDF-GENERIERUNG**

### **4.1 Doctor PDF – Einzelmedikament**

```bash
# Test: PDF für Lorazepam 2mg generieren
curl -X POST https://medless.pages.dev/api/pdf/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      { "name": "Lorazepam", "mgPerDay": 2, "timesPerDay": 2 }
    ],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female"
  }' \
  --output /tmp/medless_doctor_lorazepam.pdf

# Manueller Check:
# 1. Öffne: /tmp/medless_doctor_lorazepam.pdf
# 2. Prüfe visuelle Elemente (siehe unten)
```

**✅ PASS (VISUELLE CHECKS):**

#### **PDF MUSS ENTHALTEN:**

1. **Taper-Tail-Warnung** (immer sichtbar):
   > "Hinweis: Die letzten 25–30% der Dosisreduktion sollten..."

2. **Hochrisiko-Substanzklassen** (immer sichtbar):
   > "Besonders vorsichtig anwenden bei: Benzodiazepinen..."

3. **Pharmakokinetik vs. Pharmakodynamik** (immer sichtbar):
   > "Wichtiger Hinweis: MEDLESS berücksichtigt pharmakokinetische Faktoren..."

4. **Monitoring-Empfehlungen** (immer sichtbar):
   > "Monitoring-Empfehlungen: Bei einem Entzugsrisiko-Score ≥ 7..."

5. **Ärztliche Verantwortung** (immer sichtbar):
   > "Hinweis: Dieses Dokument ist eine computergestützte Planungshilfe..."

6. **Obergrenzen-Tool-Erklärung** (immer sichtbar):
   > "MEDLESS ist ein Obergrenzen-Tool..."

7. **2%-Floor-Warnung** (FALLS `twoPercentFloor = true`):
   > "⚠️ Sicherheitshinweis: Die berechnete Reduktionsgeschwindigkeit wurde automatisch auf mindestens 2%..."

**✅ PASS:** Mind. 6 der 7 Warnungen sind im PDF sichtbar (7. nur bei 2%-Floor)

---

### **4.2 Doctor PDF – Polypharmazie mit 2%-Floor**

```bash
# Test: PDF für Polypharmazie (sollte 2%-Floor triggern)
curl -X POST https://medless.pages.dev/api/pdf/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      { "name": "Sertralin", "mgPerDay": 100, "timesPerDay": 1 },
      { "name": "Quetiapin", "mgPerDay": 300, "timesPerDay": 1 },
      { "name": "Lorazepam", "mgPerDay": 2, "timesPerDay": 2 }
    ],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female"
  }' \
  --output /tmp/medless_doctor_polypharmacy.pdf

# Manueller Check:
# 1. Öffne: /tmp/medless_doctor_polypharmacy.pdf
# 2. Suche nach: "⚠️ Sicherheitshinweis: Die berechnete Reduktionsgeschwindigkeit wurde automatisch auf mindestens 2%"
```

**✅ PASS:** 
- PDF enthält **2%-Floor-Warnung**
- Alle 7 PDF-Warnungen sind sichtbar

---

### **4.3 Patient PDF – Basistest**

```bash
# Test: Patient PDF (vereinfachte Version)
curl -X POST https://medless.pages.dev/api/pdf/patient \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      { "name": "Lorazepam", "mgPerDay": 2, "timesPerDay": 2 }
    ],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female",
    "firstName": "Max"
  }' \
  --output /tmp/medless_patient_lorazepam.pdf

# Manueller Check:
# 1. Öffne: /tmp/medless_patient_lorazepam.pdf
# 2. Prüfe: Name "Max" erscheint, Wochenplan ist lesbar
```

**✅ PASS:** Patient-PDF wird ohne Fehler erstellt

---

## **SMOKE-TEST 5: ERROR HANDLING**

### **5.1 Fehlende PDFSHIFT_API_KEY (simuliert)**

```bash
# Test: Falls PDFSHIFT_API_KEY fehlt, sollte API Fehler zurückgeben
# (Nur testbar, wenn Key temporär aus Cloudflare entfernt wird)

# Erwarteter Response (falls Key fehlt):
# {
#   "error": "PDFSHIFT_API_KEY missing. Please configure it in Cloudflare Dashboard.",
#   "pdfUrl": null
# }
```

**✅ PASS:** Sinnvolle Fehlermeldung (falls Key fehlt)

---

### **5.2 Ungültige Medikation**

```bash
# Test: Nicht existierendes Medikament
curl -X POST https://medless.pages.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "medications": [
      { "name": "NichtExistiertXYZ", "mgPerDay": 100, "timesPerDay": 1 }
    ],
    "durationWeeks": 12,
    "age": 45,
    "weight": 75,
    "gender": "female"
  }'

# Erwartung: HTTP 200, aber `analysis` könnte leer sein oder Fehler in `error`-Feld
```

**✅ PASS:** Keine Server-Crashes (HTTP 500), sinnvolle Fehler-Behandlung

---

## **📊 SMOKE-TEST SUMMARY**

| **Test** | **Status** | **Kritisch?** |
|---|---|---|
| 1.1 Root-Redirect | ⏳ | Nein |
| 1.2 App lädt | ⏳ | **JA** |
| 2.1 Build-Info | ⏳ | Nein |
| 3.1 Analyse Benzo | ⏳ | **JA** |
| 3.2 Analyse Poly | ⏳ | **JA** |
| 3.3 Analyse Narrow | ⏳ | **JA** |
| 4.1 PDF Benzo | ⏳ | **JA** |
| 4.2 PDF Poly + 2%-Floor | ⏳ | **JA** |
| 4.3 PDF Patient | ⏳ | Nein |
| 5.1 Error PDFSHIFT | ⏳ | Nein |
| 5.2 Error Invalid Med | ⏳ | Nein |

**✅ ALLE KRITISCHEN TESTS MÜSSEN PASSEN FÜR GO-LIVE**

---

## **NEXT STEPS NACH SMOKE-TESTS:**

1. Falls **ALLE kritischen Tests ✅**: Proceed to **Monitoring & Logging**
2. Falls **IRGENDEIN Test ❌**: **ROLLBACK** und Fix → Re-Deploy → Re-Test
