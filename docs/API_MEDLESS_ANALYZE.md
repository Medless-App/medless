# MEDLESS API – Analyse-/Plan-Endpunkt

**Version:** 1.0  
**Datum:** 2025-12-07  
**Projekt:** MEDLESS (Cloudflare Pages + Hono + TypeScript + D1)  
**Production:** https://medless.pages.dev

---

## 📋 **Übersicht**

Der MEDLESS-Analyse-Endpunkt generiert einen personalisierten Medikamenten-Reduktionsplan basierend auf den Angaben des Patienten (Alter, Gewicht, aktuelle Medikation) und medizinischen Sicherheitsregeln.

**Wichtige Eigenschaften:**
- ✅ **Deterministisch:** Keine zufälligen Werte (kein `Math.random()`, kein `Date.now()` in Berechnungen)
- ✅ **Validierung:** Fehlende oder ungültige Daten führen zu HTTP 400 mit klarer Fehlermeldung
- ✅ **Mehrsprachig:** Unterstützt sowohl englische (`firstName`, `gender`, `age`) als auch deutsche (`vorname`, `geschlecht`, `alter`) Feldnamen (englisch hat Priorität)
- ✅ **Umfassend:** Liefert Analyse, Patienten-Bericht (HTML) und Arzt-Bericht (HTML) in einem Request

---

## 🔗 **Endpoint**

```
POST /api/analyze-and-reports
```

**Alternative Endpunkte:**
- `/api/analyze` – Nur Analyse-Daten (ohne HTML-Reports)

---

## 📤 **Request Body (JSON)**

### **Minimal-Beispiel:**
```jsonc
{
  "firstName": "Maria",
  "medications": [
    {
      "name": "Sertralin",
      "dailyDoseMg": 100
    }
  ],
  "durationWeeks": 8
}
```

### **Vollständiges Beispiel:**
```jsonc
{
  // === Persönliche Daten (optional, aber empfohlen) ===
  "firstName": "Maria",              // Vorname (bevorzugt)
  "gender": "female",                // Geschlecht: "male", "female", "other", "" (optional)
  "age": 54,                         // Alter in Jahren (optional, aber für Dosisanpassung wichtig)
  "weight": 70,                      // Gewicht in kg (optional, aber für CBD-Dosierung wichtig)
  "height": 168,                     // Größe in cm (optional, für BMI-Berechnung)
  "email": "maria@example.com",      // E-Mail (optional, wird in DB gespeichert für Newsletter)
  
  // === Plan-Parameter (erforderlich) ===
  "durationWeeks": 8,                // Dauer des Ausschleichplans in Wochen (erforderlich, min: 1)
  "reductionGoal": 50,               // Reduktionsziel in Prozent (0-100, default: 50)
                                     // 0 = keine Reduktion, 50 = auf 50% reduzieren, 100 = komplett absetzen
  
  // === Medikamentenliste (erforderlich) ===
  "medications": [
    {
      "name": "Sertralin",           // Medikamentenname (erforderlich)
      "dailyDoseMg": 100,            // Tagesdosis in mg (erforderlich)
      "unit": "mg"                   // Einheit (optional, default: "mg")
    },
    {
      "name": "Ibuprofen",
      "dailyDoseMg": 400
    }
  ]
}
```

### **Deutsche Feldnamen (Legacy-Support):**
Das Backend akzeptiert auch deutsche Feldnamen, **englische Namen haben jedoch Priorität**:
```jsonc
{
  "vorname": "Maria",               // wird akzeptiert, aber firstName hat Vorrang
  "geschlecht": "female",           // wird akzeptiert, aber gender hat Vorrang
  "alter": 54,                      // wird akzeptiert, aber age hat Vorrang
  "gewicht": 70,                    // wird akzeptiert, aber weight hat Vorrang
  "groesse": 168,                   // wird akzeptiert, aber height hat Vorrang
  "medications": [
    {
      "name": "Sertralin",
      "mgPerDay": 100               // wird akzeptiert, aber dailyDoseMg hat Vorrang
    }
  ]
}
```

---

## 📥 **Response Body (Erfolg)**

**HTTP Status:** `200 OK`

```jsonc
{
  "success": true,
  
  // === Analyse-Daten ===
  "analysis": {
    "personalization": {
      "firstName": "Maria",
      "gender": "female",
      "age": 54,
      "weight": 70,
      "height": 168,
      "bmi": 24.8,
      "bsa": 1.78,                        // Body Surface Area (Mosteller-Formel)
      "medicationCount": 2,
      "hasBenzoOrOpioid": false,          // Warnung bei Benzodiazepinen/Opioiden
      "maxWithdrawalRiskScore": 8         // Höchster Absetzrisiko-Score (0-10)
    },
    
    "plan": {
      "cbdStartMg": 35,                   // CBD-Startdosis (mg/Tag)
      "cbdEndMg": 70,                     // CBD-Enddosis (mg/Tag)
      "durationWeeks": 8,
      "reductionGoal": 50,
      "medications": [
        {
          "name": "Sertralin",
          "category_name": "Antidepressiva",
          "risk_level": "medium",
          "startDose": 100,               // Startdosis (mg/Tag)
          "targetDose": 50,               // Zieldosis nach Plan (mg/Tag)
          "reductionPct": 50,             // Reduktion in Prozent
          "weeklyReduction": 6.25,        // Wöchentliche Reduktion (mg)
          "halfLife": 26,                 // Halbwertszeit (Stunden)
          "withdrawalRisk": 8,            // Absetzrisiko-Score (0-10)
          "cbdInteraction": "medium",     // CBD-Wechselwirkung
          "schedule": [
            { "week": 1, "dose": 100 },
            { "week": 2, "dose": 93.75 },
            { "week": 3, "dose": 87.5 },
            // ... weitere Wochen
            { "week": 8, "dose": 50 }
          ]
        }
      ]
    },
    
    "warnings": [
      "Dieses Medikament sollte nicht abrupt abgesetzt werden.",
      "Bitte konsultieren Sie Ihren Arzt vor jeder Dosisänderung."
    ],
    
    "categorySafety": {
      "appliedRules": [
        "Antidepressiva: max_weekly_reduction_pct=10%, requires_specialist=true"
      ],
      "notes": "Reduktion erfolgt gemäß kategoriespezifischer Sicherheitsregeln."
    }
  },
  
  // === Patienten-Bericht (HTML) ===
  "patient": {
    "data": { /* PatientReportData-Objekt */ },
    "html": "<!DOCTYPE html><html>...</html>"  // Vollständiges HTML für Patient
  },
  
  // === Arzt-Bericht (HTML) ===
  "doctor": {
    "data": { /* DoctorReportData-Objekt */ },
    "html": "<!DOCTYPE html><html>...</html>"  // Vollständiges HTML für Arzt
  }
}
```

---

## ❌ **Response Body (Validierungsfehler)**

**HTTP Status:** `400 Bad Request`

```jsonc
{
  "success": false,
  "error": "Bitte fügen Sie mindestens ein Medikament hinzu."
}
```

### **Mögliche Fehlermeldungen:**
- `"Bitte fügen Sie mindestens ein Medikament hinzu."` – `medications` Array ist leer
- `"Bitte geben Sie eine gültige Dauer in Wochen an"` – `durationWeeks < 1`
- `"Bitte geben Sie eine gültige Tagesdosis in mg für \"[Name]\" ein"` – `dailyDoseMg` fehlt oder ist ungültig

---

## ❌ **Response Body (Server-Fehler)**

**HTTP Status:** `500 Internal Server Error`

```jsonc
{
  "success": false,
  "error": "Fehler bei der Analyse"
}
```

---

## 🔐 **Authentifizierung**

**Aktuell:** Keine Authentifizierung erforderlich (öffentlicher Endpunkt)

**Zukünftig (geplant):** API-Key-basierte Authentifizierung für Partner-Integrationen

---

## 📊 **Dosierungs-Logik**

### **CBD-Dosierung:**
- **Startdosis:** `0.5 mg/kg Körpergewicht` (bei Benzos/Opioiden: `0.25 mg/kg`)
- **Enddosis:** `1.0 mg/kg Körpergewicht`
- **Anpassung:** Berücksichtigt Alter (≥65 Jahre: -20%), BMI (<18.5 oder >30: +10%)

### **Medikamenten-Reduktion:**
- **Kategorie-basiert:** Antidepressiva, Benzodiazepine, Antiepileptika haben spezielle Sicherheitsregeln
- **Absetzrisiko:** Medikamente mit `withdrawal_risk_score >= 7` werden als "erhöht" markiert
- **Linearität:** Reduktion erfolgt linear über die angegebene Dauer

---

## 🧪 **Beispiel-Requests**

### **1. Minimal-Request (nur erforderliche Felder):**
```bash
curl -X POST https://medless.pages.dev/api/analyze-and-reports \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "medications": [{"name": "Ibuprofen", "dailyDoseMg": 400}],
    "durationWeeks": 4
  }'
```

### **2. Vollständiger Request:**
```bash
curl -X POST https://medless.pages.dev/api/analyze-and-reports \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Maria",
    "gender": "female",
    "age": 54,
    "weight": 70,
    "height": 168,
    "email": "maria@example.com",
    "medications": [
      {"name": "Sertralin", "dailyDoseMg": 100},
      {"name": "Ibuprofen", "dailyDoseMg": 400}
    ],
    "durationWeeks": 8,
    "reductionGoal": 50
  }'
```

### **3. Test: Leere Medikamentenliste (erwartet: HTTP 400):**
```bash
curl -X POST https://medless.pages.dev/api/analyze-and-reports \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "medications": [],
    "durationWeeks": 4
  }'
# Erwartet: {"success": false, "error": "Bitte fügen Sie mindestens ein Medikament hinzu."}
```

---

## 📝 **Hinweise für Entwickler**

1. **Feldnamen-Priorität:** Englische Feldnamen (`firstName`, `gender`, `age`) haben **immer Vorrang** vor deutschen Namen (`vorname`, `geschlecht`, `alter`)

2. **Determinismus:** Die Berechnungslogik ist vollständig deterministisch. Bei identischen Eingaben ist die Ausgabe identisch.

3. **Backend-Fallback:** Medikamente ohne `category_name` erhalten automatisch den Fallback `"Allgemeine Medikation"` und `risk_level: "low"`

4. **Validierung:** Alle erforderlichen Felder werden validiert. Fehlende oder ungültige Daten führen zu HTTP 400 mit klarer Fehlermeldung.

5. **Performance:** Typische Response-Zeit: 200-500ms (inkl. DB-Abfragen und HTML-Generierung)

6. **Datenbank:** Patientendaten werden **nicht** dauerhaft gespeichert (außer optionale E-Mail-Adresse in `customer_emails` Tabelle)

---

## 🔄 **API-Versionierung**

**Aktuell:** Version 1.0 (keine explizite Versionierung in URL)

**Zukünftig (geplant):** `/api/v2/analyze-and-reports` für Breaking Changes

---

## 📞 **Support & Feedback**

- **E-Mail:** office@cbd-kompetenzzentrum.com
- **Production:** https://medless.pages.dev
- **GitHub:** (falls öffentlich verfügbar)

---

**Letzte Aktualisierung:** 2025-12-07
