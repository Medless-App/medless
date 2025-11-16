# MedLess-AI - Multi-Medication Reduction System with CBD Compensation

🌿 **Strukturierte Medikamenten-Reduktion mit automatischer CBD-Kompensation und intelligentem KannaSan-Produktmanagement**

## 📋 Projekt-Übersicht

**Name**: MedLess-AI - Multi-Medication Reduction System  
**Ziel**: Unterstützung bei der schrittweisen Reduktion von Medikamenten mit personalisierter CBD-Kompensation unter ärztlicher Aufsicht. Intelligentes KannaSan-Fläschchen-Management verhindert unnötige Produktwechsel.

### 🎯 Hauptfunktionen

✅ **Vollständig implementiert:**
- ✨ **Multi-Medikamenten-Unterstützung** - Mehrere Medikamente gleichzeitig reduzieren
- 📊 **Individuelle Reduktionskurven** - Jedes Medikament hat eigene lineare Reduktion
- 🌿 **Unified CBD-Kompensation** - Eine CBD-Kurve (0.5 → 1.0 mg/kg) für alle Medikamente
- 💊 **Einfache Eingabe** - Nur mg/Tag erforderlich (Beschreibung automatisch generiert)
- 📅 **Wochenplan-Format** - Übersichtliche wöchentliche Übersicht
- 🔬 **Automatische Medikamenten-Analyse** - CBD-Wechselwirkungen mit Severity-Level
- 🧪 **KannaSan Produktauswahl** - 5 Produkte: Nr. 5, 10, 15, 20, 25 (5.8-29 mg CBD/Spray)
- 💧 **Intelligente Fläschchen-Verfolgung** - 100 Sprays pro 10ml Flasche tracking
- ⚠️ **Sicherheitsregeln** - Benzo/Opioid-Erkennung → CBD-Startdosis halbiert
- 🎯 **Personalisierung** - Alter, BMI, Körpergewicht-basierte Anpassungen
- 📄 **PDF-Generierung** - Vollständiger Plan mit Fläschchen-Status zum Download
- 📱 **Responsive Design** - TailwindCSS, FontAwesome Icons
- 🔒 **Rechtlicher Disclaimer** - Ärztliche Aufsicht erforderlich

---

## 🌐 URLs

**Lokale Entwicklung:**
- Sandbox: https://3000-ijld9858qau0wmsm3gjq0-82b888ba.sandbox.novita.ai
- Localhost: http://localhost:3000

**API-Endpunkte:**
- `GET /` - Homepage mit Formular
- `POST /api/analyze` - Medikamente analysieren & MedLess-AI Plan erstellen
  - Input: medications[] (name, mgPerDay), bodyWeight, height, age, reductionGoal, durationWeeks
  - Output: weeklyPlan[] mit medications[], CBD-Dosis, KannaSan-Produkt, bottleStatus

---

## 💾 Daten-Architektur

### **Datenbank: Cloudflare D1 (SQLite)**

**Haupt-Tabellen:**

1. **medication_categories** - Medikamenten-Kategorien
   - Blutverdünner, Antidepressiva, Antiepileptika, Benzodiazepine, Opioide, etc.
   - Risk-Level: low, medium, high, very_high

2. **medications** (26+ Einträge)
   - Name, generischer Name, CYP450-Enzyme
   - Beispiele: Marcumar, Prozac, Tavor, Tramal, Lyrica, etc.

3. **cbd_interactions** (26+ Einträge)
   - Interaktionstyp: inhibition, enhancement, reduction, neutral
   - Schweregrad: low, medium, high, critical
   - Mechanismus, Empfehlungen, Quellen

### **MedLess-AI Datenpipeline:**
```
User Input (medications[], bodyWeight, height, age, reductionGoal, weeks)
  ↓
CBD-Dosis-Berechnung (0.5 mg/kg Start → 1.0 mg/kg Ende)
  ↓
Personalisierung (Alter, BMI, Benzo/Opioid-Detection)
  ↓
KannaSan Produktauswahl (optimal für CBD-Dosis)
  ↓
Fläschchen-Tracking (100 Sprays/Flasche, Verbrauch pro Woche)
  ↓
Wochenplan-Generierung (medications[], CBD, bottleStatus)
  ↓
PDF + UI Display
```

### **KannaSan Produkt-Datenbank:**
| Produkt | CBD/Spray | 2 Sprays | Flasche | Verwendung |
|---------|-----------|----------|---------|------------|
| **Nr. 5**  | 5.8 mg  | 11.6 mg | 10ml (100 Sprays) | Niedrige Dosen |
| **Nr. 10** | 11.5 mg | 23.0 mg | 10ml (100 Sprays) | Mittlere Dosen |
| **Nr. 15** | 17.5 mg | 35.0 mg | 10ml (100 Sprays) | Standard |
| **Nr. 20** | 23.2 mg | 46.4 mg | 10ml (100 Sprays) | Höhere Dosen |
| **Nr. 25** | 29.0 mg | 58.0 mg | 10ml (100 Sprays) | Sehr hohe Dosen |

---

## 💧 Fläschchen-Tracking Logic (NEW!)

### **🔥 Kernprinzip: Keine unnötigen Produktwechsel**

Das System verfolgt den Fläschchen-Verbrauch und wechselt Produkte NUR wenn notwendig:

### **Tracking-Parameter:**
- **Kapazität:** 100 Sprays pro 10ml Flasche
- **Verbrauch:** Täglich × 7 Tage = Wochenverbrauch
- **Status:** Verbraucht/Rest/Wochen bis leer

### **Produktwechsel-Regeln:**
✅ **Wechsel NUR wenn:**
1. Flasche leer oder fast leer (<7 Sprays Reservezeitung)
2. Dosierung erfordert >12 Sprays/Tag (Effizienz-Limit)

❌ **KEIN Wechsel wenn:**
- Flasche noch ausreichend Sprays hat
- Dosierung mit aktuellem Produkt machbar ist

### **Beispiel-Szenario:**

```
Woche 1-5: KannaSan Nr. 15 (17.5 mg/Spray)
- Woche 1: 2 Sprays/Tag = 14/Woche → Verbraucht: 14/100
- Woche 2: 3 Sprays/Tag = 21/Woche → Verbraucht: 35/100
- Woche 3: 3 Sprays/Tag = 21/Woche → Verbraucht: 56/100
- Woche 4: 3 Sprays/Tag = 21/Woche → Verbraucht: 77/100
- Woche 5: 3 Sprays/Tag = 21/Woche → Verbraucht: 98/100 ⚠️

Woche 6-8: KannaSan Nr. 25 (29 mg/Spray) - NEUE FLASCHE
- Woche 6: 2 Sprays/Tag = 14/Woche → Verbraucht: 14/100
- Woche 7: 3 Sprays/Tag = 21/Woche → Verbraucht: 35/100
- Woche 8: 3 Sprays/Tag = 21/Woche → Verbraucht: 56/100
```

### **Fläschchen-Status im UI:**

**Woche 5 Beispiel:**
```
💧 Fläschchen-Status
-----------------------------------------
Verbraucht: 98 / 100 Hübe
Verbleibend: 2 Hübe
Voraussichtlich leer in: ~0 Wochen

⚠️ Produktwechsel in nächster Woche erforderlich
```

**Woche 6 Beispiel:**
```
💧 Fläschchen-Status
-----------------------------------------
Verbraucht: 14 / 100 Hübe
Verbleibend: 86 Hübe
Voraussichtlich leer in: ~6 Wochen

✅ Aktuelles Fläschchen weiter verwenden
```

---

## 📖 Benutzerhandbuch

### **Schritt 1: Persönliche Daten eingeben**
1. **Körpergewicht** (kg) - PFLICHTFELD für CBD-Berechnung
2. **Körpergröße** (cm) - PFLICHTFELD für BMI-Berechnung
3. **Alter** (Jahre) - Optional, empfohlen für Senior-Anpassung (65+)
4. **Geschlecht** - Optional

### **Schritt 2: Medikamente eingeben**
1. **Medikamentenname** - z.B. "Diazepam", "Tramadol", "Lyrica"
2. **Tagesdosis in mg** ⭐ PFLICHTFELD - z.B. "10", "150", "300"
3. Klicken Sie "+ Weiteres Medikament" für mehrere Medikamente

**Wichtig:** Nur noch mg/Tag erforderlich! Dosierungsbeschreibung wird automatisch generiert.

### **Schritt 3: Reduktionsplan wählen**
1. **Reduktionsziel** - Wie viel % möchten Sie reduzieren? (z.B. 50%, 75%, 100%)
2. **Dauer in Wochen** - Wie lange soll die Reduktion dauern? (z.B. 8, 12, 16 Wochen)

### **Schritt 4: Plan erstellen**
- Klicken Sie auf "MedLess-AI Plan erstellen"
- Das System berechnet:
  - Individuelle Reduktionskurven für jedes Medikament
  - CBD-Kompensation (0.5 → 1.0 mg/kg Körpergewicht)
  - Optimale KannaSan-Produkte mit Fläschchen-Tracking
  - Benzo/Opioid-Erkennung → CBD-Startdosis halbiert

### **Schritt 5: Ergebnis nutzen**
Sie erhalten:
- 📊 **Plan-Übersicht** - Anzahl Medikamente, CBD-Dosis, Dauer
- 🧪 **Produktinformationen** - KannaSan Spray Spezifikationen
- 🎯 **Personalisierung** - BMI, BSA, CBD-Anpassungen, Sicherheitshinweise
- 💊 **Medikamenten-Analyse** - Wechselwirkungen mit CBD
- 📅 **Wochenplan** - Pro Woche:
  - Medikamente (Aktuell → Ziel, Reduktion)
  - CBD-Kompensation (Dosis, Produkt, Sprays morgens/abends)
  - 💧 Fläschchen-Status (Verbrauch, Rest, Produktwechsel-Warnung)
- 💡 **Sicherheitshinweise** - Ärztliche Begleitung, Einnahmehinweise
- 📄 **PDF-Download** - Vollständiger Plan als PDF

---

## 🧪 MedLess-AI Algorithmus

### **1. CBD-Dosis-Berechnung**
```typescript
CBD_Start = 0.5 mg/kg × Körpergewicht
CBD_Ende = 1.0 mg/kg × Körpergewicht

// Lineare Progression
CBD_Woche[n] = CBD_Start + ((CBD_Ende - CBD_Start) / Wochen) × (n - 1)
```

### **2. Medikamenten-Reduktion (Linear)**
```typescript
für jedes Medikament:
  Start_Dosis = Eingabe mg/Tag
  Ziel_Dosis = Start_Dosis × (1 - Reduktionsziel / 100)
  Wöchentliche_Reduktion = (Start_Dosis - Ziel_Dosis) / Wochen
  
  Aktuelle_Dosis[Woche] = Start_Dosis - (Wöchentliche_Reduktion × (Woche - 1))
```

### **3. KannaSan Produktauswahl**
```typescript
Optimales_Produkt = wähle_Produkt_mit:
  - Minimalen Sprays pro Tag
  - KEINE Überdosierung (max 10% Toleranz)
  - Max 6 Sprays pro Einnahme (morgens/abends)
  - Verteilung: 40% morgens, 60% abends
```

### **4. Fläschchen-Tracking**
```typescript
Flasche_Kapazität = 100 Sprays
Aktuelles_Produkt = KannaSan Nr. X
Verbleibend = 100

für jede Woche:
  Sprays_diese_Woche = Sprays_pro_Tag × 7
  
  // Produktwechsel-Prüfung
  wenn (Verbleibend < Sprays_diese_Woche) ODER (Sprays_pro_Tag > 12):
    Aktuelles_Produkt = wähle_neues_optimales_Produkt()
    Verbleibend = 100  // Neue Flasche
  
  Verbleibend -= Sprays_diese_Woche
  
  Ausgabe:
    - Verbraucht: (100 - Verbleibend)
    - Rest: Verbleibend
    - Voraussichtlich leer in: Verbleibend / Sprays_pro_Tag / 7
    - Produktwechsel nächste Woche: (Verbleibend < nächste_Woche_Sprays)
```

### **5. Personalisierung**

**Benzo/Opioid-Erkennung:**
```typescript
wenn Medikament enthält ["Diazepam", "Tavor", "Oxazepam", "Tramadol", "Oxycodon", etc.]:
  CBD_Start = CBD_Start / 2  // Halbierte Startdosis
  Hinweis: "🔥 Sicherheitsregel: Benzo/Opioid erkannt"
```

**Alter-basierte Anpassungen:**
```typescript
wenn Alter >= 65:
  CBD_Start = CBD_Start × 0.7  // 70% für Senioren
  Hinweis: "📅 Senior-Anpassung (65+)"
```

**BMI-basierte Anpassungen:**
```typescript
BMI = Gewicht / (Größe/100)²

wenn BMI < 18.5:
  CBD_Start = CBD_Start × 0.85  // 85% für Untergewicht
wenn BMI > 30:
  CBD_Start = CBD_Start × 1.1   // 110% für Übergewicht
```

---

## 🚀 Deployment

### **Status:** ✅ Vollständig funktionsfähig mit Fläschchen-Tracking!
### **Plattform:** Cloudflare Pages
### **Tech Stack:**
- **Backend:** Hono (TypeScript) - Edge-optimiert
- **Database:** Cloudflare D1 (SQLite) - Distributed
- **Frontend:** HTML + TailwindCSS + Vanilla JS
- **Icons:** FontAwesome 6.4.0
- **HTTP Client:** Axios 1.6.0
- **PDF:** jsPDF 2.5.1

### **Lokale Entwicklung:**

```bash
# Dependencies installieren
npm install

# Datenbank initialisieren
npm run db:migrate:local
npm run db:seed  # Optional: Testdaten

# Build (IMMER vor erstem Start!)
npm run build

# Server starten (PM2 - empfohlen)
fuser -k 3000/tcp 2>/dev/null || true
pm2 start ecosystem.config.cjs

# Testen
curl http://localhost:3000
pm2 logs --nostream
```

### **Cloudflare Pages Deployment:**

```bash
# 1. Cloudflare API Key einrichten
# Call setup_cloudflare_api_key tool first!

# 2. Produktions-Datenbank erstellen
npx wrangler d1 create ecs-aktivierung-production

# 3. Database ID in wrangler.jsonc eintragen

# 4. Migrationen anwenden (Produktion)
npm run db:migrate:prod

# 5. Build und Deploy
npm run deploy:prod
```

---

## 📊 Test-Szenarien

### **Test 1: Single Medication (Diazepam)**
```json
{
  "medications": [{"name": "Diazepam", "mgPerDay": 10}],
  "bodyWeight": 70,
  "height": 170,
  "age": 45,
  "reductionGoal": 50,
  "durationWeeks": 8
}
```
**Ergebnis:**
- ✅ Benzo-Erkennung → CBD-Start halbiert (17.5 mg statt 35 mg)
- ✅ KannaSan Nr. 15 für niedrige Start-Dosis
- ✅ Fläschchen-Tracking: 98/100 nach Woche 5 → Wechsel zu Nr. 25 in Woche 6
- ✅ Medikament: 10 mg → 5 mg (50% Reduktion über 8 Wochen)

### **Test 2: Multi-Medication (Tramadol + Lyrica)**
```json
{
  "medications": [
    {"name": "Tramadol", "mgPerDay": 150},
    {"name": "Lyrica", "mgPerDay": 300}
  ],
  "bodyWeight": 80,
  "height": 175,
  "age": 52,
  "reductionGoal": 75,
  "durationWeeks": 12
}
```
**Ergebnis:**
- ✅ Opioid-Erkennung (Tramadol) → CBD-Start halbiert
- ✅ Zwei separate Reduktionskurven
- ✅ Eine unified CBD-Kompensation
- ✅ Fläschchen-Tracking über 12 Wochen
- ✅ Tramadol: 150 → 37.5 mg (75% Reduktion)
- ✅ Lyrica: 300 → 75 mg (75% Reduktion)

---

## 🐛 Kürzlich implementierte Features

### **Feature #1: Bottle Tracking System - IMPLEMENTIERT ✅**
- **Feature:** Intelligentes Fläschchen-Management für KannaSan Produkte
- **Funktionen:**
  - 100 Sprays/Flasche Kapazität tracking
  - Keine unnötigen Produktwechsel
  - Produktwechsel nur bei Flasche leer ODER >12 Sprays/Tag
  - Status-Display: Verbraucht/Rest/Wochen bis leer
  - Produktwechsel-Warnung
- **UI:** Fläschchen-Status Box in jeder Woche (Frontend + PDF)
- **Commit:** `f40d8a4` - "✅ Implement MedLess-AI bottle tracking system"

### **Feature #2: Simplified Medication Input - IMPLEMENTIERT ✅**
- **Vorher:** Name + Dosierungsbeschreibung (beide Felder)
- **Nachher:** Name + mg/Tag (Beschreibung automatisch generiert)
- **Grund:** Einfacher, präziser, bessere UX

### **Feature #3: Multi-Medication Support - IMPLEMENTIERT ✅**
- Mehrere Medikamente gleichzeitig
- Individuelle lineare Reduktionskurven
- Eine unified CBD-Kompensation für alle

---

## 🔮 Nächste Schritte (Empfohlen)

### **Deployment & Production:**
1. **Cloudflare Pages Deployment** - Live gehen mit bottle tracking
2. **Custom Domain** - redumed-ai.de oder ecs-aktivierung.de
3. **D1 Production Migrations** - Datenbank migrieren

### **Feature Enhancements:**
4. **Email Export** - Wochenplan per E-Mail
5. **Progress Tracker** - User kann Fortschritt dokumentieren
6. **More Medications** - Datenbank erweitern (aktuell: 26)
7. **Multi-Language** - Englische Version

### **Technical Improvements:**
8. **Error Handling** - Besseres User-Feedback
9. **Loading States** - Progress-Spinner
10. **Form Validation** - Enhanced client-side validation
11. **Mobile Optimization** - Touch-friendly controls

---

## 📚 Wissenschaftliche Grundlagen

### **Lineare Reduktionsstrategie:**
- **Medikamente:** Gleichmäßige Reduktion über Wochen
- **CBD:** Linearer Anstieg zur Kompensation
- **Verhältnis:** 0.5 → 1.0 mg/kg (Verdopplung über Planzeit)

### **CBD-Wechselwirkungen (CYP450):**
- CBD hemmt CYP3A4, CYP2C9, CYP2D6, CYP2C19
- Risiko: Erhöhte Medikamentenspiegel
- **Benzo/Opioid:** Besondere Vorsicht → Halbierte CBD-Dosis

### **KannaSan Spray-Verteilung:**
- **Morgens:** 40% der Tagesdosis (Fokus, Balance)
- **Abends:** 60% der Tagesdosis (Entspannung, Schlaf)
- **Sublingual:** Spray unter die Zunge

### **Fläschchen-Ökonomie:**
- 10ml Flasche = 100 Sprays
- Bei 3 Sprays/Tag = ~33 Tage Versorgung
- Produktwechsel nur wenn nötig → Kosteneffizienz

---

## 📞 Support & Quellen

**Wissenschaftliche Quellen:**
- [ProjectCBD - CBD Cytochrome P450](https://projectcbd.org/safety/cbd-cytochrome-p450/)
- [PubMed Central - CBD Drug Interactions](https://pmc.ncbi.nlm.nih.gov/articles/PMC11022902/)
- [Nordic Oil - CBD Wechselwirkungen](https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen)

**Letzte Aktualisierung:** 14. November 2025  
**Version:** 3.0 - MedLess-AI mit Bottle Tracking

---

## ⚖️ Rechtlicher Hinweis

Diese Anwendung dient ausschließlich Informationszwecken und stellt keine medizinische Beratung, Diagnose oder Behandlung dar. Die Reduktion von Medikamenten muss IMMER unter ärztlicher Aufsicht erfolgen. Ändern Sie niemals eigenständig Ihre Medikation. Bei gesundheitlichen Fragen konsultieren Sie bitte einen Arzt.

**WICHTIG:** MedLess-AI ist ein Planungstool für Ärzte und Patienten im gemeinsamen Gespräch.

---

**Made with 💚 for structured medication reduction**
