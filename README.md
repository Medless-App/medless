# ECS Aktivierung - CBD Ausgleichsplan Generator

🌿 **Ihr persönlicher CBD-Ausgleichsplan basierend auf Medikamenten-Wechselwirkungen**

## 📋 Projekt-Übersicht

**Name**: ECS Aktivierung - CBD Ausgleichsplan Generator  
**Ziel**: Benutzer über das Endocannabinoid-System (ECS) aufklären und personalisierte CBD-Dosierungspläne erstellen, die Medikamenten-Wechselwirkungen berücksichtigen.

### 🎯 Hauptfunktionen

✅ **Bereits implementiert:**
- ✨ Informative Homepage über das Endocannabinoid-System (ECS)
- 💊 Datenbank mit 26 häufigen Medikamenten und deren CBD-Wechselwirkungen
- 🔬 Automatische Analyse von Medikamenten-Interaktionen mit CBD
- 📊 Personalisierte CBD-Dosierungspläne (Wochen-basiert)
- ⚠️ Warnungen bei kritischen Wechselwirkungen
- 📝 Manuelle Eingabe von Medikamenten (Name + Dosierung)
- 🖼️ Bildupload-Funktion (UI bereit, OCR pending)
- 🎨 Modernes, responsives Design mit TailwindCSS
- 🔒 Rechtlicher Disclaimer und medizinische Hinweise

🔄 **In Entwicklung:**
- 🤖 OpenAI Vision API Integration für OCR (Medikamentenplan-Erkennung aus Fotos)
- 📄 PDF-Generierung mit jsPDF (Download des Ausgleichsplans)
- 📧 E-Mail-Versand des PDF (optional, benötigt SendGrid/Resend API)

---

## 🌐 URLs

**Lokale Entwicklung:**
- Sandbox: https://3000-ijld9858qau0wmsm3gjq0-82b888ba.sandbox.novita.ai
- Localhost: http://localhost:3000

**API-Endpunkte:**
- `GET /api/medications` - Alle Medikamente abrufen
- `GET /api/medications/search/:query` - Medikamente suchen
- `GET /api/interactions/:medicationId` - Wechselwirkungen für Medikament
- `POST /api/analyze` - Medikamente analysieren & Plan erstellen
- `POST /api/ocr` - Bildupload für OCR (in Entwicklung)

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

5. **user_plans** - Speichert generierte Pläne (optional)

### **Datenquellen:**
- PubMed, NIH, ProjectCBD
- Nordic Oil, Hanfosan, Dutch Natural Healing
- Wissenschaftliche Studien zu CBD-CYP450-Wechselwirkungen

---

## 📖 Benutzerhandbuch

### **Schritt 1: Medikamente eingeben**

**Option A: Manuelle Eingabe**
1. Geben Sie den Namen Ihrer Medikamente ein (z.B. "Marcumar", "Prozac")
2. Optional: Fügen Sie die Dosierung hinzu (z.B. "400mg täglich")
3. Klicken Sie auf "Weiteres Medikament hinzufügen" für mehrere Medikamente

**Option B: Foto hochladen** (UI vorhanden, OCR in Entwicklung)
1. Laden Sie ein Foto Ihres Medikamentenplans hoch
2. Die KI erkennt automatisch Medikamente (benötigt OpenAI API-Key)

### **Schritt 2: Ausgleichsdauer wählen**
- Wählen Sie die gewünschte Dauer in Wochen (1-52)
- Empfohlen: 8-12 Wochen für nachhaltigen Ausgleich

### **Schritt 3: Plan erstellen**
- Klicken Sie auf "CBD-Ausgleichsplan erstellen"
- Das System analysiert:
  - Wechselwirkungen mit CBD
  - Schweregrad der Interaktionen
  - CYP450-Enzyme-Beteiligung

### **Schritt 4: Ergebnis nutzen**
Sie erhalten:
- ✅ Detaillierte Medikamenten-Analyse mit Wechselwirkungen
- ⚠️ Warnungen bei kritischen Interaktionen
- 📅 Wochenplan mit täglicher CBD-Dosierung (Morgens/Mittags/Abends)
- 💡 Empfehlungen und wichtige Hinweise
- 🖨️ Druckfunktion (PDF-Download kommt bald)

---

## ⚠️ Wichtige Hinweise

### **Medizinischer Disclaimer**
- ❗ **KEINE medizinische Beratung** - Dient nur zur Orientierung
- 👨‍⚕️ Konsultieren Sie **unbedingt Ihren Arzt** vor CBD-Einnahme
- 🚫 Ändern Sie niemals ohne ärztliche Rücksprache Ihre Medikation
- 📋 Nehmen Sie den generierten Plan zu Ihrem Arztgespräch mit

### **Kritische Wechselwirkungen**
Besonders vorsichtig bei:
- 🩸 Blutverdünner (Marcumar, Xarelto, Eliquis)
- 💊 Immunsuppressiva (Sandimmun, Prograf)
- 🧠 Opioide (OxyContin, Tramadol)
- 💤 Benzodiazepine (Tavor, Valium, Rivotril)
- 🔬 Clobazam (starke CYP450-Hemmung)

---

## 🚀 Deployment

### **Status:** ✅ Lokal getestet
### **Plattform:** Cloudflare Pages (bereit für Deployment)
### **Tech Stack:**
- **Backend:** Hono (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Frontend:** HTML + TailwindCSS + Vanilla JS
- **Icons:** FontAwesome
- **HTTP Client:** Axios

### **Lokale Entwicklung:**

```bash
# Dependencies installieren
npm install

# Datenbank initialisieren
npm run db:migrate:local
npm run db:seed

# Build
npm run build

# Server starten
pm2 start ecosystem.config.cjs

# Testen
curl http://localhost:3000
```

### **Cloudflare Pages Deployment** (vorbereitet):

```bash
# Produktions-Datenbank erstellen
npx wrangler d1 create ecs-aktivierung-production

# Migrationen anwenden
npm run db:migrate:prod

# Deployen
npm run deploy
```

---

## 🔮 Nächste Schritte (Empfohlen)

### **Priorität Hoch:**
1. **OpenAI Vision API** - OCR für Medikamentenpläne aktivieren
   - Benötigt: OpenAI API-Key (GPT-4 Vision)
   - Funktion: Automatische Texterkennung aus Fotos

2. **PDF-Generierung** - jsPDF Integration
   - Funktion: Ausgleichsplan als PDF herunterladen
   - Alternative: Browser-Print verwenden (bereits implementiert)

### **Priorität Mittel:**
3. **E-Mail-Versand** (optional)
   - Service: SendGrid oder Resend
   - Funktion: PDF per E-Mail zusenden

4. **Erweiterte Datenbank**
   - Mehr Medikamente hinzufügen (aktuell: 26)
   - Detailliertere Dosierungs-Algorithmen

### **Priorität Niedrig:**
5. **Benutzer-Tracking** - Analytics hinzufügen
6. **Multi-Language Support** - Englische Version
7. **Admin-Panel** - Medikamente verwalten

---

## 📚 Wissenschaftliche Grundlagen

**CYP450-System:**
- CBD hemmt Cytochrom P450-Enzyme (CYP3A4, CYP2C9, CYP2D6, CYP2C19)
- Diese Enzyme bauen viele Medikamente ab
- Hemmung → erhöhte Medikamentenspiegel im Blut
- Risiko: Toxizität oder verstärkte Nebenwirkungen

**Dosierungs-Strategie:**
- Mikrodosierung: 5-50 mg/Tag (allgemein)
- Reduzierte Dosis bei Wechselwirkungen: 2.5-25 mg/Tag
- Einschleichphase: Langsame Steigerung alle 1-3 Wochen
- Individuelle Anpassung unter ärztlicher Aufsicht

---

## 📞 Support & Quellen

**Quellen:**
- [ProjectCBD - CBD Cytochrome P450](https://projectcbd.org/safety/cbd-cytochrome-p450/)
- [PubMed Central - CBD Drug Interactions](https://pmc.ncbi.nlm.nih.gov/articles/PMC11022902/)
- [Nordic Oil - CBD Wechselwirkungen](https://www.nordicoil.de/blogs/cbd/cbd-wechselwirkungen)
- [Hanfosan - CBD und Medikamente](https://www.hanfosan.de/blog/wechselwirkungen-von-cbd-und-medikamenten.html)

**Letzte Aktualisierung:** 23. Oktober 2025  
**Version:** 1.0 (MVP)

---

## ⚖️ Rechtlicher Hinweis

Diese Anwendung dient ausschließlich Informationszwecken und stellt keine medizinische Beratung, Diagnose oder Behandlung dar. Die Informationen ersetzen nicht das Gespräch mit einem Arzt oder Apotheker. Bei gesundheitlichen Fragen oder Beschwerden konsultieren Sie bitte einen Arzt.

---

**Made with 💚 für die ECS-Community**
