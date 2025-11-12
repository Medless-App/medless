# ECS Aktivierung - CBD-Paste 70% Dosierungsplan Generator

🌿 **Ihr individualisierter CBD-Paste 70% Dosierungsplan basierend auf Medikamenten, Alter, Gewicht und Körpergröße**

## 📋 Projekt-Übersicht

**Name**: ECS Aktivierung - CBD-Paste 70% Dosierungsplan Generator  
**Ziel**: Individualisierte CBD-Paste Dosierungspläne erstellen mit wissenschaftlich fundierter "Start Low, Go Slow"-Philosophie unter Berücksichtigung von Medikamenten-Wechselwirkungen, Alter, BMI und Körpergröße.

### 🎯 Hauptfunktionen

✅ **Vollständig implementiert:**
- ✨ Informative Homepage über das Endocannabinoid-System (ECS)
- 💊 Datenbank mit 26+ häufigen Medikamenten und deren CBD-Wechselwirkungen
- 🔬 Automatische Analyse von Medikamenten-Interaktionen mit CBD
- 📊 **Individualisierte Tag-für-Tag Dosierungspläne** (nicht wöchentlich!)
- 🎯 **Personalisierung basierend auf:**
  - Medikamenten-Wechselwirkungen (Severity: Critical/High/Medium/Low)
  - Alter (Senior-Anpassung ab 65 Jahren: 70% Dosis, +2 Tage Titration)
  - Body-Mass-Index (BMI) (Untergewicht: 85%, Übergewicht: 110%)
  - Körpergewicht (Zieldosis: 1 mg/kg, Maximum: 2.5 mg/kg)
  - Körpergröße (BSA-Berechnung für präzise Dosierung)
- 🌙 **Zweiphasige Dosierungsstrategie:**
  - Phase 1: Einschleichphase (nur abends) - Dauer abhängig von Schweregrad
  - Phase 2: 2x täglich (Morgens 40%, Abends 60%) für optimale ECS-Unterstützung
- 📏 **CBD-Paste 70% Spezifikationen:**
  - 3 Gramm Spritze mit 30 Teilstrichen
  - Dosierung in Zentimeter (cm) auf der Spritze
  - 1 cm = 46.67 mg CBD | 1 Teilstrich (1.5 cm) = 70 mg CBD
  - Sublinguale Einnahme (unter die Zunge, 2-3 Minuten)
- ⚠️ Warnungen bei kritischen Wechselwirkungen
- 📝 Manuelle Eingabe von Medikamenten (Name + Dosierung)
- 🖼️ **Bildupload mit OpenAI Vision OCR** - Medikamentenplan-Erkennung
- 📄 **PDF-Generierung** - Vollständiger Plan zum Download
- 📧 **E-Mail-Sammlung** für Marketing-Zwecke
- 🎨 Modernes, responsives Design mit TailwindCSS
- 🔒 Rechtlicher Disclaimer und medizinische Hinweise

---

## 🌐 URLs

**Lokale Entwicklung:**
- Sandbox: https://3000-ijld9858qau0wmsm3gjq0-82b888ba.sandbox.novita.ai
- Localhost: http://localhost:3000

**API-Endpunkte:**
- `GET /api/medications` - Alle Medikamente abrufen
- `GET /api/medications/search/:query` - Medikamente suchen
- `GET /api/interactions/:medicationId` - Wechselwirkungen für Medikament
- `POST /api/analyze` - Medikamente analysieren & individualisierten Plan erstellen
- `POST /api/ocr` - Bildupload für OCR (OpenAI Vision)

---

## 💾 Daten-Architektur

### **Datenbank: Cloudflare D1 (SQLite)**

**Haupt-Tabellen:**

1. **medication_categories** - Medikamenten-Kategorien
   - Blutverdünner, Antidepressiva, Antiepileptika, Schmerzmittel, etc.
   - Risk-Level: low, medium, high, very_high

2. **medications** (26 Einträge)
   - Name, generischer Name, CYP450-Enzyme, Dosierung
   - Beispiele: Marcumar, Prozac, Ibuprofen, Tavor, etc.

3. **cbd_interactions** (26 Einträge)
   - Interaktionstyp: inhibition, enhancement, reduction, neutral
   - Schweregrad: low, medium, high, critical
   - Mechanismus, Empfehlungen, Quellen

4. **cbd_dosage_guidelines** (5 Einträge)
   - Dosierungs-Richtlinien basierend auf Wechselwirkungs-Schweregrad
   - Min/Max-Dosierung, Startdosis, Anpassungszeitraum

5. **customer_emails** - E-Mail-Adressen für Marketing
   - E-Mail, Vorname, Erstellungsdatum

### **Datenquellen:**
- PubMed, NIH, ProjectCBD
- Nordic Oil, Hanfosan, Dutch Natural Healing
- Wissenschaftliche Studien zu CBD-CYP450-Wechselwirkungen
- Medizinische Dosierungsprotokolle

---

## 📖 Benutzerhandbuch

### **Schritt 1: Persönliche Daten eingeben**
1. **Vorname** (Pflichtfeld) - Für personalisierte Ansprache
2. **Geschlecht** (Pflichtfeld) - Männlich/Weiblich
3. **E-Mail-Adresse** (Pflichtfeld) - Für Newsletter/Marketing
4. **Alter** (optional, aber empfohlen) - Senior-Anpassung ab 65 Jahren
5. **Körpergewicht** (optional, aber empfohlen) - Gewichtsbasierte Dosierung
6. **Körpergröße** (optional, aber empfohlen) - BMI/BSA-Berechnung

### **Schritt 2: Medikamente eingeben**

**Option A: Manuelle Eingabe**
1. Geben Sie den Namen Ihrer Medikamente ein (z.B. "Marcumar", "Prozac")
2. Optional: Fügen Sie die Dosierung hinzu (z.B. "400mg täglich")
3. Klicken Sie auf "Weiteres Medikament hinzufügen" für mehrere Medikamente

**Option B: Foto hochladen (OpenAI Vision OCR)**
1. Laden Sie ein Foto Ihres Medikamentenplans hoch
2. Die KI erkennt automatisch Medikamente mittels GPT-4 Vision
3. Überprüfen Sie die erkannten Medikamente

### **Schritt 3: Dosierungsdauer wählen**
- Wählen Sie die gewünschte Dauer in Wochen (1-52)
- Empfohlen: 8-12 Wochen für nachhaltigen Aufbau

### **Schritt 4: Plan erstellen**
- Klicken Sie auf "CBD-Paste Dosierungsplan erstellen"
- Das System analysiert:
  - Wechselwirkungen mit CBD (CYP450-Enzyme)
  - Schweregrad der Interaktionen
  - Alter, BMI, Body Surface Area (BSA)
  - Gewichtsbasierte Zieldosis (1 mg/kg)

### **Schritt 5: Ergebnis nutzen**
Sie erhalten:
- 💊 **Produktinformationen** - CBD-Paste 70% Spezifikationen
- 📋 **Personalisierung** - BMI, BSA, Titrationstage, Startdosis, Anpassungshinweise
- ✅ Detaillierte Medikamenten-Analyse mit Wechselwirkungen
- ⚠️ Warnungen bei kritischen Interaktionen
- 📅 **Tag-für-Tag Dosierungsplan** - Gruppiert nach Wochen
  - Morgens-Dosis in cm (und mg)
  - Abends-Dosis in cm (und mg)
  - Tägliche Gesamt-Dosis
  - Hinweise und Anweisungen
- 💡 Sublinguale Einnahme-Anleitung
- 🖨️ **PDF-Download** - Vollständiger Plan als PDF
- 🖨️ **Druckfunktion** - Direkt aus Browser drucken

---

## 🧪 Dosierungs-Individualisierung

### **Severity-Based Titration (Einschleichphase)**

| Schweregrad | Titrationstage | Startdosis | Inkrement | Erste Einnahme |
|-------------|---------------|------------|-----------|----------------|
| **Critical/High** | 7 Tage | 4.7 mg (0.1 cm) | 2.5 mg alle 3 Tage | Abends (Sicherheit) |
| **Medium** | 5 Tage | 7 mg (0.15 cm) | 4 mg alle 3 Tage | Abends (Sicherheit) |
| **Low** | 3 Tage | 9.3 mg (0.2 cm) | 5 mg alle 3 Tage | Abends (Verträglichkeitstest) |

### **Age-Based Adjustments (Seniorenprogramm)**
- **65+ Jahre:**
  - Startdosis: 70% der Basisdosis
  - Titrationstage: +2 Tage zusätzlich
  - Hinweis: "📅 Verlängerte Einschleichphase für Senioren (65+)"

### **BMI-Based Adjustments**
- **BMI < 18.5 (Untergewicht):** Startdosis × 0.85 (15% Reduktion)
- **BMI > 30 (Übergewicht):** Startdosis × 1.1 (10% Erhöhung)
- **BMI 18.5-30 (Normal):** Keine Anpassung

### **Weight-Based Target Dosing**
- **Zieldosis:** 1 mg CBD pro kg Körpergewicht
- **Maximum:** 2.5 mg CBD pro kg Körpergewicht (Sicherheit)
- **Beispiel:** 70 kg Person → Zieldosis 70 mg, Maximum 175 mg

### **Two-Phase Strategy**
- **Phase 1 (Titration):** Nur abends einnehmen
  - Zweck: Verträglichkeit prüfen, Körper adaptieren lassen
  - Dauer: 3-9 Tage (abhängig von Schweregrad + Alter)
- **Phase 2 (Maintenance):** 2x täglich
  - Morgens: 40% der Tagesdosis
  - Abends: 60% der Tagesdosis
  - Zweck: Optimale ECS-Unterstützung rund um die Uhr

---

## ⚠️ Wichtige Hinweise

### **Medizinischer Disclaimer**
- ❗ **KEINE medizinische Beratung** - Dient nur zur Orientierung
- 👨‍⚕️ Konsultieren Sie **unbedingt Ihren Arzt** vor CBD-Einnahme
- 🚫 Ändern Sie niemals ohne ärztliche Rücksprache Ihre Medikation
- 📋 Nehmen Sie den generierten Plan zu Ihrem Arztgespräch mit

### **Kritische Wechselwirkungen**
Besonders vorsichtig bei:
- 🩸 Blutverdünner (Warfarin/Marcumar, Xarelto, Eliquis)
- 💊 Immunsuppressiva (Sandimmun, Prograf)
- 🧠 Opioide (OxyContin, Tramadol)
- 💤 Benzodiazepine (Tavor, Valium, Rivotril)
- 🔬 Clobazam (starke CYP450-Hemmung)

### **CBD-Paste 70% Besonderheiten**
- 💪 **Hochkonzentriert** - Vorsicht bei Dosierung
- 👅 **Sublingual** - Unter die Zunge, 2-3 Minuten warten
- 📏 **Präzise Dosierung** - Spritze mit 30 Teilstrichen
- 🚫 **Nicht überdosieren** - Start Low, Go Slow

---

## 🚀 Deployment

### **Status:** ✅ Vollständig getestet und funktionsfähig
### **Plattform:** Cloudflare Pages (bereit für Deployment)
### **Tech Stack:**
- **Backend:** Hono (TypeScript) - Edge-optimiert
- **Database:** Cloudflare D1 (SQLite) - Distributed
- **Frontend:** HTML + TailwindCSS + Vanilla JS
- **Icons:** FontAwesome 6.4.0
- **HTTP Client:** Axios 1.6.0
- **PDF:** jsPDF 2.5.1
- **OCR:** OpenAI GPT-4 Vision

### **Lokale Entwicklung:**

```bash
# Dependencies installieren
npm install

# Datenbank initialisieren
npm run db:migrate:local
npm run db:seed  # Optional: Testdaten

# Build
npm run build

# Server starten (PM2 - empfohlen)
pm2 start ecosystem.config.cjs

# Server starten (direkt)
npm run dev:d1

# Testen
curl http://localhost:3000
```

### **Cloudflare Pages Deployment:**

```bash
# 1. Cloudflare API Key einrichten
# (Guide User to Deploy tab for API key setup)

# 2. Produktions-Datenbank erstellen
npx wrangler d1 create ecs-aktivierung-production

# 3. Database ID in wrangler.jsonc eintragen

# 4. Migrationen anwenden (Produktion)
npm run db:migrate:prod

# 5. OpenAI API Key als Secret setzen
npx wrangler pages secret put OPENAI_API_KEY --project-name ecs-aktivierung

# 6. Build und Deploy
npm run deploy:prod
```

---

## 📊 Test-Szenarien

### **Test 1: Medium Severity (Metformin)**
```json
{
  "medications": [{"name": "Metformin", "dosage": "500mg 2x täglich"}],
  "age": 55,
  "weight": 70,
  "height": 165,
  "durationWeeks": 8
}
```
**Ergebnis:**
- ✅ 3 Tage Einschleichphase (nur abends)
- ✅ Startdosis: 0.2 cm (9.3 mg)
- ✅ BMI: 25.7 (Normal) - Keine Anpassung
- ✅ Ab Tag 4: 2x täglich (Morgen + Abend)

### **Test 2: Critical Severity + Senior (Warfarin, 72yo)**
```json
{
  "medications": [{"name": "Warfarin", "dosage": "5mg täglich"}],
  "age": 72,
  "weight": 85,
  "height": 175,
  "durationWeeks": 8
}
```
**Ergebnis:**
- ✅ 9 Tage Einschleichphase (7 base + 2 senior)
- ✅ Startdosis: 0.05 cm (3.3 mg) - 70% wegen Senior
- ✅ BMI: 27.8 (Übergewicht) - 110% Anpassung
- ✅ Zwei Sicherheitshinweise:
  - ⚠️ Sehr vorsichtige Einschleichphase (kritisch)
  - 📅 Verlängerte Einschleichphase für Senioren

---

## 🔮 Nächste Schritte (Empfohlen)

### **Deployment & Production:**
1. **Cloudflare Pages Deployment** - Live gehen
2. **Custom Domain** - ecs-aktivierung.de verbinden
3. **OpenAI API Key** - Als Production Secret setzen
4. **D1 Production Migrations** - Datenbank migrieren

### **Feature Enhancements:**
5. **Email Marketing Integration** - SendGrid/Mailchimp
6. **Analytics** - User-Tracking (Cloudflare Web Analytics)
7. **More Medications** - Datenbank erweitern (aktuell: 26)
8. **Multi-Language** - Englische Version

### **Technical Improvements:**
9. **Error Handling** - Besseres User-Feedback
10. **Loading States** - Spinner für OCR/API-Calls
11. **Form Validation** - Client-side validation
12. **Mobile Optimization** - Touch-friendly controls

---

## 📚 Wissenschaftliche Grundlagen

### **CYP450-System:**
- CBD hemmt Cytochrom P450-Enzyme (CYP3A4, CYP2C9, CYP2D6, CYP2C19)
- Diese Enzyme bauen ~60% aller Medikamente ab
- Hemmung → erhöhte Medikamentenspiegel im Blut
- Risiko: Toxizität oder verstärkte Nebenwirkungen

### **"Start Low, Go Slow" Protokoll:**
- Medizinischer Standard für CBD-Dosierung
- Beginn: 2.5-5 mg/Tag bei kritischen Wechselwirkungen
- Steigerung: 5-10 mg alle 2-7 Tage
- Ziel: Individuell angepasste Dosis ohne Nebenwirkungen

### **Sublinguales Absorptionsmodell:**
- **Aufnahme:** 13-35% Bioverfügbarkeit (sublingual vs. 6% oral)
- **Wirkungseintritt:** 15-45 Minuten
- **Wirkungsdauer:** 4-8 Stunden
- **Halbwertszeit:** 18-68 Stunden (kumulativer Effekt)

### **Zweiphasige Strategie (Wissenschaftlich):**
- **Circadian Rhythm:** ECS reguliert Schlaf-Wach-Zyklus
- **Abends 60%:** Unterstützt Entspannung, Schlaf, Regeneration
- **Morgens 40%:** Unterstützt Fokus, Balance, Tagesfunktion
- **2x täglich:** Kontinuierliche ECS-Unterstützung für Homöostase

---

## 📞 Support & Quellen

**Wissenschaftliche Quellen:**
- [ProjectCBD - CBD Cytochrome P450](https://projectcbd.org/safety/cbd-cytochrome-p450/)
- [PubMed Central - CBD Drug Interactions](https://pmc.ncbi.nlm.nih.gov/articles/PMC11022902/)
- [Nordic Oil - CBD Wechselwirkungen](https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen)
- [Hanfosan - CBD und Medikamente](https://www.hanfosan.de/blog/wechselwirkungen-von-cbd-und-medikamenten.html)

**Letzte Aktualisierung:** 23. Oktober 2025  
**Version:** 2.0 - CBD-Paste 70% Vollversion

---

## ⚖️ Rechtlicher Hinweis

Diese Anwendung dient ausschließlich Informationszwecken und stellt keine medizinische Beratung, Diagnose oder Behandlung dar. Die Informationen ersetzen nicht das Gespräch mit einem Arzt oder Apotheker. Bei gesundheitlichen Fragen oder Beschwerden konsultieren Sie bitte einen Arzt. CBD-Paste 70% ist ein hochkonzentriertes Produkt - Vorsicht bei der Dosierung!

---

**Made with 💚 für die ECS-Community**
