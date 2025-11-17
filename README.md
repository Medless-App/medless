# MEDLESS 🌿

<div align="center">

![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)
![Platform](https://img.shields.io/badge/Cloudflare-Pages-orange?style=for-the-badge&logo=cloudflare)
![License](https://img.shields.io/badge/License-Proprietary-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-3.0-green?style=for-the-badge)

**CBD-basierter Medikamenten-Reduktionsplaner mit algorithmischer Dosierungsberechnung**

[🌐 Live Demo](https://medless.pages.dev) · [📚 Dokumentation](./TECHNICAL_DOCUMENTATION.md) · [🤖 AI-Konzept](./KI_INTEGRATION_KONZEPT.md)

</div>

---

## 🎯 Was ist MEDLESS?

MEDLESS ist ein **wissenschaftsbasiertes Tool** zur Planung der schrittweisen Medikamentenreduktion mit personalisierter CBD-Kompensation. Das System berechnet **100% algorithmisch** individuelle Reduktionspläne basierend auf:

- ✅ **Körpergewicht, Alter, BMI** (Personalisierung)
- ✅ **52 Medikamente** mit CBD-Interaktionsdaten
- ✅ **CYP450-Enzyme** (Stoffwechsel-Analyse)
- ✅ **5 KANNASAN-Produkte** (5.8-29 mg CBD/Spray)
- ✅ **Fläschchen-Tracking** (100 Sprays/10ml Flasche)

> ⚠️ **Wichtig:** Dieses Tool dient ausschließlich der Planung unter **ärztlicher Aufsicht**. Keine Eigenmedikation!

---

## ✨ Features

### ✅ **Frontend-Validierung (NEU)**
```
- Inline-Fehlermeldungen statt Browser-Alerts
- Visuelle Fehlermarkierung (rote Border + rosa Hintergrund)
- Auto-Scroll zum ersten Fehlerfeld
- Validierung BEFORE Loading Animation
- Form Disabling nach erfolgreicher Validierung
```

### 🧪 **Algorithmic Core**
```
- Lineare Medikamenten-Reduktion (individuell pro Medikament)
- CBD-Kompensation (0.5 → 1.0 mg/kg Körpergewicht)
- Benzo/Opioid-Erkennung → CBD-Startdosis halbiert
- Alter-/BMI-basierte Anpassungen
```

### 💊 **Multi-Medication Support**
- **Mehrere Medikamente gleichzeitig** reduzieren
- **Individuelle Reduktionskurven** pro Medikament
- **Eine unified CBD-Kurve** für alle Medikamente
- **Übersichtlicher Wochenplan** (1-24 Wochen)

### 🧴 **KANNASAN Integration**
- **5 Spray-Produkte:** Nr. 5, 10, 15, 20, 25
- **Intelligente Produktauswahl** (minimale Sprays, keine Überdosierung)
- **Fläschchen-Tracking** (Verbrauch, Rest, Wechsel-Warnung)
- **Verteilung:** 40% morgens, 60% abends

### 📄 **PDF-Export**
- **Vollständiger Wochenplan** mit allen Details
- **Medikamenten-Analyse** (CBD-Interaktionen)
- **Fläschchen-Status** pro Woche
- **Sicherheitshinweise** & Disclaimer

---

## 🚀 Quick Start

### **🌐 Online verwenden (empfohlen)**
```
https://medless.pages.dev
```

### **💻 Lokal entwickeln**

```bash
# 1. Repository klonen
git clone https://github.com/Medless-App/medless.git
cd medless

# 2. Dependencies installieren
npm install

# 3. Lokale D1-Datenbank erstellen
npm run db:migrate:local
npm run db:seed  # Optional: Testdaten

# 4. Build (WICHTIG vor erstem Start!)
npm run build

# 5. Development Server starten
npm run dev:sandbox
# Oder mit PM2 (empfohlen):
pm2 start ecosystem.config.cjs

# 6. Öffnen
# http://localhost:3000
```

---

## 📊 Architektur

### **Tech Stack**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Hono (TypeScript) | Edge-optimiertes Web Framework |
| **Database** | Cloudflare D1 (SQLite) | 52 Medikamente + Interaktionen |
| **Frontend** | Vanilla JS + TailwindCSS | Responsive, lightweight |
| **Hosting** | Cloudflare Pages | Global Edge Network |
| **PDF** | jsPDF | Client-side PDF Generation |

### **Data Flow**

```
User Input (Medikamente, Gewicht, Alter...)
         ↓
  [CBD-Algorithmus]
    0.5 → 1.0 mg/kg
         ↓
  [Personalisierung]
   Alter, BMI, Benzos
         ↓
  [D1 Database Query]
   52 Meds + Interactions
         ↓
  [Produkt-Selection]
   KANNASAN Nr. 5-25
         ↓
  [Fläschchen-Tracking]
   100 Sprays/Flasche
         ↓
  [Wochenplan-Generation]
   Woche 1-24
         ↓
    [PDF + UI Display]
```

### **Datenbank-Schema**

```sql
-- 15 Kategorien (Blutverdünner, Antidepressiva, Benzodiazepine...)
medication_categories (id, name, description, risk_level)

-- 52 Medikamente (Marcumar, Prozac, Tavor, Tramadol, Lyrica...)
medications (id, name, generic_name, category_id, cyp450_enzymes...)

-- 52 CBD-Interaktionen (inhibition, enhancement, reduction...)
cbd_interactions (id, medication_id, interaction_type, severity...)

-- 5 Dosierungs-Richtlinien (pro Severity-Level)
cbd_dosage_guidelines (id, severity, dosage_adjustment_factor...)
```

---

## 🧮 Algorithmus-Details

### **1. CBD-Dosierung**

```typescript
// Basis-Berechnung
cbdStart = userWeight * 0.5 mg/kg
cbdEnd = userWeight * 1.0 mg/kg

// Sicherheitsregeln
if (hasBenzoOrOpioid) cbdStart = cbdStart / 2  // 🔥 Halbierung!
if (age >= 65) cbdStart = cbdStart * 0.8       // Senior-Anpassung
if (bmi < 18.5) cbdStart = cbdStart * 0.85     // Untergewicht
if (bmi > 30) cbdStart = cbdStart * 1.1        // Übergewicht

// Lineare Progression
cbdWeek[n] = cbdStart + ((cbdEnd - cbdStart) / weeks) * (n - 1)
```

### **2. Medikamenten-Reduktion**

```typescript
// Pro Medikament individuell
startDose = medication.mgPerDay
targetDose = startDose * (1 - reductionGoal / 100)
weeklyReduction = (startDose - targetDose) / durationWeeks

// Lineare Reduktion
currentDose[week] = startDose - (weeklyReduction * (week - 1))
```

### **3. KANNASAN Produkt-Auswahl**

```typescript
// Optimierungskriterien
selectOptimalProduct(cbdDose):
  for each product (Nr. 5, 10, 15, 20, 25):
    spraysPerDay = cbdDose / product.cbdPerSpray
    
    // Constraints
    if (spraysPerDay > 12) continue  // Zu viele Sprays
    if (cbdDelivered > cbdDose * 1.1) continue  // Überdosierung
    if (spraysPerIntake > 6) continue  // Max 6 Sprays/Einnahme
    
    // Wähle mit minimalen Sprays
    return productWithMinimalSprays
```

### **4. Fläschchen-Tracking**

```typescript
bottleCapacity = 100 sprays
bottleRemaining = 100

for each week:
  spraysThisWeek = spraysPerDay * 7
  
  // Produktwechsel-Prüfung
  if (bottleRemaining < spraysThisWeek || spraysPerDay > 12):
    selectNewProduct()
    bottleRemaining = 100  // Neue Flasche
  
  bottleRemaining -= spraysThisWeek
  
  // Status-Output
  consumed = 100 - bottleRemaining
  weeksUntilEmpty = bottleRemaining / spraysPerDay / 7
  switchNextWeek = (bottleRemaining < nextWeekSprays)
```

---

## 📖 API-Dokumentation

### **POST /api/analyze**

**Analyseert Medikamente und erstellt individuellen Reduktionsplan.**

#### Request Body:
```json
{
  "medications": [
    {"name": "Diazepam", "mgPerDay": 10},
    {"name": "Tramadol", "mgPerDay": 150}
  ],
  "bodyWeight": 70,
  "height": 175,
  "age": 52,
  "gender": "male",
  "reductionGoal": 50,
  "durationWeeks": 8
}
```

#### Response:
```json
{
  "summary": {...},
  "bmi": 22.9,
  "bsa": 1.85,
  "cbdProgression": {...},
  "personalization": {...},
  "analysis": [
    {
      "medication": {...},
      "interaction": {...},
      "dosageAdjustment": {...}
    }
  ],
  "weeklyPlan": [
    {
      "week": 1,
      "medications": [...],
      "cbd": {...},
      "product": {...},
      "bottleStatus": {...}
    }
  ],
  "costs": {...},
  "safetyNotes": [...]
}
```

**Komplette API-Specs:** Siehe [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)

---

## 🗂️ Projekt-Struktur

```
medless/
├── src/
│   └── index.tsx           # Hono Backend (1,200+ Zeilen)
├── public/static/
│   └── app.js              # Frontend (1,277 Zeilen)
├── migrations/             # D1 Database Migrations
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_customer_emails.sql
│   └── 0003_expand_interaction_types.sql
├── seed.sql                # 52 Medikamente + Interaktionen
├── wrangler.jsonc          # Cloudflare Config
├── package.json            # Dependencies
├── ecosystem.config.cjs    # PM2 Config
├── vite.config.ts          # Build Config
└── docs/
    ├── TECHNICAL_DOCUMENTATION.md    # Tech-Specs
    ├── KI_INTEGRATION_KONZEPT.md     # AI-Konzept
    ├── FLOWCHARTS_BILDER.md          # Flowcharts
    └── MEDLESS_VERIFIKATION_PROMPT.txt # Verifikation
```

---

## 🧪 Test-Szenarien

### **Test 1: Single Medication (Benzo)**
```json
{
  "medications": [{"name": "Diazepam", "mgPerDay": 10}],
  "bodyWeight": 70,
  "reductionGoal": 50,
  "durationWeeks": 8
}
```
**Erwartetes Ergebnis:**
- ✅ Benzo-Erkennung → CBD-Start halbiert (17.5 mg statt 35 mg)
- ✅ KANNASAN Nr. 15 für Startdosis
- ✅ Fläschchen wechselt bei ~98/100 Sprays
- ✅ Diazepam: 10 mg → 5 mg (50% über 8 Wochen)

### **Test 2: Multi-Medication**
```json
{
  "medications": [
    {"name": "Tramadol", "mgPerDay": 150},
    {"name": "Lyrica", "mgPerDay": 300}
  ],
  "bodyWeight": 80,
  "reductionGoal": 75,
  "durationWeeks": 12
}
```
**Erwartetes Ergebnis:**
- ✅ Opioid-Erkennung (Tramadol) → CBD-Start halbiert
- ✅ 2 separate Reduktionskurven
- ✅ 1 unified CBD-Kompensation
- ✅ Tramadol: 150 → 37.5 mg
- ✅ Lyrica: 300 → 75 mg

**Weitere Tests:** Siehe [VERIFICATION_REPORT_V2.0.md](./VERIFICATION_REPORT_V2.0.md)

---

## 🚀 Deployment

### **Production (Cloudflare Pages)**

```bash
# 1. Cloudflare API Key einrichten
# (siehe Deploy-Tab in Cloudflare Dashboard)

# 2. Produktions-Datenbank erstellen
npx wrangler d1 create medless-production

# 3. Database ID in wrangler.jsonc eintragen

# 4. Migrationen anwenden
npm run db:migrate:prod

# 5. Build & Deploy
npm run deploy:prod
```

### **Manuelle Qualitätskontrolle (empfohlen)**

```bash
# 1. Lokal testen
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000

# 2. Wenn OK → Deploy
npm run deploy:prod

# 3. Verifizieren
curl https://medless.pages.dev
```

---

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) | Komplette technische Spezifikation |
| [KI_INTEGRATION_KONZEPT.md](./KI_INTEGRATION_KONZEPT.md) | AI-Text-Generation Konzept |
| [FLOWCHARTS_BILDER.md](./FLOWCHARTS_BILDER.md) | System-Flowcharts |
| [MEDLESS_VERIFIKATION_PROMPT.txt](./MEDLESS_VERIFIKATION_PROMPT.txt) | Externe AI-Verifikation |
| [PDF_GENERATION_STANDARDS.md](./PDF_GENERATION_STANDARDS.md) | PDF-Generierung |

---

## 🔬 Wissenschaftliche Grundlagen

### **CBD & CYP450-Enzyme**
- CBD hemmt **CYP3A4, CYP2C9, CYP2D6, CYP2C19**
- Risiko: **Erhöhte Medikamentenspiegel** im Blut
- Quellen:
  - [ProjectCBD - CBD Cytochrome P450](https://projectcbd.org/safety/cbd-cytochrome-p450/)
  - [PubMed Central - CBD Drug Interactions](https://pmc.ncbi.nlm.nih.gov/articles/PMC11022902/)
  - [Nordic Oil - CBD Wechselwirkungen](https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen)

### **Lineare Reduktionsstrategie**
- **Medikamente:** Gleichmäßige Reduktion (linear)
- **CBD:** Linearer Anstieg zur Kompensation
- **Verhältnis:** 0.5 → 1.0 mg/kg (Verdopplung über Planzeit)

### **KANNASAN Spray-Anwendung**
- **Morgens:** 40% der Tagesdosis (Fokus, Balance)
- **Abends:** 60% der Tagesdosis (Entspannung, Schlaf)
- **Sublingual:** Spray unter die Zunge

---

## 🛠️ Development

### **Scripts**

```bash
# Development
npm run dev              # Vite dev server
npm run dev:sandbox      # Wrangler dev (für D1 access)
npm run build            # Build für Production

# Database
npm run db:migrate:local # Lokale Migrationen
npm run db:migrate:prod  # Production Migrationen
npm run db:seed          # Testdaten laden
npm run db:reset         # Datenbank zurücksetzen

# Deployment
npm run deploy           # Deploy zu Cloudflare
npm run deploy:prod      # Deploy mit Project Name

# Utilities
npm run clean-port       # Port 3000 freigeben
npm run test             # Curl test zu localhost:3000
```

### **PM2 Commands**

```bash
pm2 start ecosystem.config.cjs  # Server starten
pm2 list                        # Status anzeigen
pm2 logs --nostream            # Logs anzeigen
pm2 restart medless            # Neu starten
pm2 delete medless             # Stoppen & entfernen
```

---

## 🤝 Contributing

Dieses Projekt ist **Proprietary**. Für Beiträge oder Fragen:
- 📧 Email: office@cbd-kompetenzzentrum.com
- 📱 Instagram: [@ECS_Wissen](https://instagram.com/ECS_Wissen)

---

## 📄 Lizenz

**Proprietary** - Alle Rechte vorbehalten.

---

## ⚠️ Rechtlicher Hinweis

Diese Anwendung dient ausschließlich **Informationszwecken** und stellt **keine medizinische Beratung**, Diagnose oder Behandlung dar. 

**Die Reduktion von Medikamenten muss IMMER unter ärztlicher Aufsicht erfolgen.**

Ändern Sie niemals eigenständig Ihre Medikation. Bei gesundheitlichen Fragen konsultieren Sie bitte einen Arzt oder Apotheker.

**MEDLESS ist ein Planungstool für Ärzte und Patienten im gemeinsamen Gespräch.**

---

<div align="center">

**Made with 💚 for structured medication reduction**

[🌐 Live Demo](https://medless.pages.dev) · [📚 Docs](./TECHNICAL_DOCUMENTATION.md) · [📦 GitHub](https://github.com/Medless-App/medless)

**Version 3.0** | Last Updated: 17. November 2025

</div>
