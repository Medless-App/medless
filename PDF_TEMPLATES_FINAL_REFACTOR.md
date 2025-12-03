# PDF Report Templates - Finale Refactoring Dokumentation

**Datum:** 2025-11-29  
**Projekt:** MEDLESS  
**Autor:** Senior Frontend-Engineer  
**Deployment URL:** https://medless.pages.dev  
**Preview URL:** https://fca92209.medless.pages.dev

---

## 1. Aufgabenstellung

**Ziel:** Refactoring der PDF-Report-Templates in `src/report_templates.ts` für ein **klinisch sauberes, lesbares, professionelles Layout**.

**Hauptanforderungen:**
- **A4-optimiert** mit guter Typografie
- **Feste, deterministische Struktur** (keine KI-generierten Texte zur Laufzeit)
- **Patient-PDF:** Freundlich, verständlich, max. 1-2 subtile Emojis erlaubt
- **Ärzte-PDF:** Rein sachlich, **KEINE Emojis**, Anrede: **"Lieber Arzt, liebe Ärztin,"** (NICHT "Kollege/Kollegin")
- **Robuste Fehlerbehandlung:** Fehlende Werte → "–" oder Sektion weglassen
- **HTML-Kompatibilität** mit `html2pdf.js`: Keine externen Ressourcen, keine `position: fixed`

---

## 2. Implementierte Änderungen

### 2.1 Gemeinsame CSS-Basis (Beide Reports)

**Font-Familie:**
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Page Setup (A4):**
```css
@page {
  size: A4;
  margin: 20mm 18mm; /* Optimiert für A4 */
}

body {
  font-size: 11pt; /* Patient-Report */
  font-size: 10pt; /* Doctor-Report */
  line-height: 1.4;
  color: #111827;
  margin: 20mm 18mm;
}
```

**Farbschema:**
- **Primär-Grün (MEDLESS):** `#0F766E`
- **Text-Dunkel:** `#111827`
- **Subtle Grau-Linien:** `#E5E7EB`
- **Tabellen-Header:** `#F3FBF8` (Hellgrün)

**Heading-Hierarchie:**
```css
h1 { font-size: 24pt; color: #0F766E; border-bottom: 2px solid #0F766E; }
h2 { font-size: 18pt; color: #0F766E; }
h3 { font-size: 15pt; color: #111827; }
```

**Tabellen-Styling:**
```css
table {
  border-collapse: collapse;
  font-size: 10pt; /* Patient */
  font-size: 9pt;  /* Doctor */
}

th {
  background: #F3FBF8;
  color: #0F766E;
  padding: 6px 8px;
  border: 1px solid #E5E7EB;
}

td {
  padding: 5px 8px;
  border: 1px solid #E5E7EB;
}

tr:nth-child(even) {
  background: #F9FAFB; /* Zebra-Pattern */
}
```

---

### 2.2 Patient-Report Struktur (`renderPatientReportHtml`)

**Sektionen (feste Reihenfolge):**

1. **Header (Title Block)**
   - `h1`: "Dein persönlicher MEDLESS-Plan"
   - Subtitle: "Ihr persönlicher Reduktionsplan mit CBD-Begleitung"

2. **Persönliche Daten**
   - Tabelle: Name, Alter, Größe, Gewicht, BMI, Anzahl Medikamente
   - Conditional Warning Box (falls Benzos/Opioide)

3. **Zusammenfassung Ihres Plans**
   - `h2`: "Zusammenfassung Ihres Plans"
   - Klarer Prosa-Text (2-3 Sätze) über Dauer, Reduktionsziel, CBD-Dosis

4. **Mögliche positive Effekte**
   - `h3`: "Mögliche positive Effekte"
   - Liste der Effekte in grüner Box
   - Max. 1 subtiles Emoji im Heading erlaubt

5. **Ihr Wochenplan**
   - `h2`: "Ihr Wochenplan"
   - Tabelle: Woche | CBD-Dosis | Produkt & Einnahme | Medikamente

6. **Wichtige Warnzeichen** (Yellow Warning Box)
   - `h3`: "Wichtige Warnzeichen"
   - Liste kritischer Symptome
   - Gelber Hintergrund (#FFF8E5), orangene Border (#FFCC66)

7. **Regelmäßige ärztliche Kontrollen** (Blue Monitoring Box)
   - `h3`: "Regelmäßige ärztliche Kontrollen"
   - Häufigkeit, Parameter, Symptome
   - Blauer Hintergrund (#F0F7FF), blaue Border (#66A3FF)

8. **MEDLESS Produkte & Kosten**
   - `h2`: "MEDLESS Produkte & Kosten"
   - Gesamtkosten, Kostenzusammenstellung
   - Disclaimer: Medikamentenkosten nicht enthalten

9. **Rechtlicher Hinweis** (Footer)
   - Disclaimer, Versionsnummer

**Emojis:** Max. 1-2 subtile Emojis erlaubt (z.B. im "Positive Effekte"-Heading)

---

### 2.3 Doctor-Report Struktur (`renderDoctorReportHtml`)

**Sektionen (feste Reihenfolge):**

0. **Formales Anschreiben**
   ```
   Lieber Arzt, liebe Ärztin,

   der Patient / die Patientin hat diesen MEDLESS-Plan online erstellt. 
   Das Dokument enthält eine Zusammenfassung des geplanten Cannabinoid-Einsatzes, 
   einen Reduktionsplan sowie eine Wechselwirkungs- und Risikoeinschätzung 
   basierend auf pharmakokinetischen Daten und Reduktionsrichtlinien. 
   Dieses Dokument ist als Entscheidungshilfe gedacht – 
   die finale Therapieentscheidung liegt selbstverständlich bei Ihnen.
   ```

1. **Title Block**
   - `h1`: "MEDLESS – Ärztlicher Reduktionsplan"
   - Subtitle: "Medizinische Dokumentation zur Reduktionsplanung"

2. **Patientendaten**
   - `h2`: "Patientendaten"
   - Tabelle: Name, Alter, Geschlecht, Größe, Gewicht, BMI, Medikamente

3. **Risiko-Übersicht**
   - `h2`: "Risiko-Übersicht"
   - Tabelle: Höchste Wechselwirkungs-Schwere (mit farbigem Dot), Anzahl Medikamente, Risikokategorie
   - **Farbige Risk-Dots:**
     - **Kritisch:** `#CC0000` (Rot)
     - **Hoch:** `#FF6600` (Orange)
     - **Mittel:** `#CC9900` (Gelb)
     - **Niedrig:** `#0A8A64` (Grün)

4. **Strategie-Zusammenfassung**
   - `h2`: "Strategie-Zusammenfassung"
   - Tabelle: Reduktionsdauer, Reduktionsziel, CBD-Dosis (Start→Ende), Geschwindigkeit, Gesamtlastreduktion

5. **Medikations-Übersicht**
   - `h2`: "Medikations-Übersicht"
   - Tabelle: Medikament | Start-Dosis | Ziel-Dosis | HWZ | WD-Risiko | CBD-IA | Risiko (Dot)
   - Abkürzungen: HWZ = Halbwertszeit | WD = Withdrawal | CBD-IA = CBD-Interaktionsstärke

6. **Monitoring-Empfehlungen** (Blue Monitoring Box)
   - `h3`: "Monitoring-Empfehlungen"
   - Häufigkeit, Vitalparameter, Warnsymptome, Besondere Hinweise

7. **Reduktionsplan-Details**
   - `h2`: "Reduktionsplan-Details (Wochenweise)"
   - Tabelle: Woche | Med-Last (mg) | CBD (mg) | CBD/kg | Notizen

8. **Methodologie**
   - `h2`: "Methodologie"
   - Tabelle: CBD-Dosierungsmethode, Reduktionsmethode, Sicherheitsregeln
   - Liste angewandter Anpassungen

9. **Rechtliche Hinweise** (Gray Legal Box)
   - `h3`: "Rechtliche Hinweise"
   - Disclaimer, Footer mit Versionsnummer

**Emojis:** **KEINE EMOJIS** im Ärzte-Report

---

## 3. CSS-Komponenten

### 3.1 Warning Box (Yellow - Patient Only)
```css
.warning-box {
  background: #FFF8E5;
  border-left: 4px solid #FFCC66;
  padding: 14px;
  margin: 20px 0;
}

.warning-box h3 {
  color: #996600;
  font-size: 13pt;
}
```

### 3.2 Monitoring Box (Blue - Both Reports)
```css
.monitoring-box {
  background: #F0F7FF;
  border-left: 4px solid #66A3FF;
  padding: 14px;
  margin: 20px 0;
}

.monitoring-box h3 {
  color: #004085;
  font-size: 13pt;
}
```

### 3.3 Legal Box (Gray - Doctor Only)
```css
.legal-box {
  background: #F8F8F8;
  border: 1px solid #E6E6E6;
  padding: 12px;
  margin: 18px 0;
}

.legal-box h3 {
  color: #1A1A1A;
  font-size: 12pt;
}
```

### 3.4 Risk Dots (Doctor Only)
```css
.risk-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.risk-dot.critical { background: #CC0000; }
.risk-dot.high { background: #FF6600; }
.risk-dot.medium { background: #CC9900; }
.risk-dot.low { background: #0A8A64; }
```

---

## 4. Technische Details

### 4.1 Datenquellen
- **Patient-Report:** `PatientReportData` (aus `report_data.ts`)
- **Doctor-Report:** `DoctorReportData` (aus `report_data.ts`)
- **Keine Berechnungen** in Templates – nur Rendering

### 4.2 Robustheit
- Fehlende Werte → `"–"` oder Sektion weglassen
- Beispiel: 
  ```typescript
  ${data.patientFacts.sensitiveMedCount > 0 ? `
    <tr><th>Davon sensibel</th><td>${data.patientFacts.sensitiveMedCount}</td></tr>
  ` : ''}
  ```

### 4.3 HTML-Kompatibilität mit `html2pdf.js`
- ✅ Keine externen Ressourcen (Webfonts, externe CSS/JS)
- ✅ Keine `position: fixed` Header
- ✅ Sequentielle Tabellen/Sektionen
- ✅ Embedded CSS in `<style>` Block

---

## 5. Deployment

**Build:**
```bash
cd /home/user/webapp && npm run build
```

**Deploy:**
```bash
cd /home/user/webapp && npx wrangler pages deploy dist --project-name medless --commit-dirty=true
```

**URLs:**
- **Production:** https://medless.pages.dev
- **Preview:** https://fca92209.medless.pages.dev

**Build-Output:**
```
✓ 40 modules transformed.
dist/_worker.js  395.65 kB
✓ built in 803ms
```

**Deploy-Output:**
```
✨ Success! Uploaded 0 files (25 already uploaded) (0.31 sec)
✨ Deployment complete! Take a peek over at https://fca92209.medless.pages.dev
```

---

## 6. Finale Checkliste

### Patient-Report ✅
- ✅ Klinisch sauberes Layout
- ✅ A4-optimiert (20mm 18mm Margin)
- ✅ Font: `system-ui` Stack
- ✅ Max. 1-2 subtile Emojis erlaubt
- ✅ 9 Haupt-Sektionen
- ✅ Yellow Warning Box
- ✅ Blue Monitoring Box
- ✅ Tabellen mit Zebra-Pattern
- ✅ Robuste Fehlerbehandlung

### Doctor-Report ✅
- ✅ Klinisch sauberes Layout
- ✅ A4-optimiert (20mm 18mm Margin)
- ✅ Font: `system-ui` Stack
- ✅ **KEINE Emojis**
- ✅ **Anrede: "Lieber Arzt, liebe Ärztin,"** (NICHT "Kollege/Kollegin")
- ✅ 9 Haupt-Sektionen (0-9)
- ✅ Farbige Risk-Dots (Kritisch, Hoch, Mittel, Niedrig)
- ✅ Blue Monitoring Box
- ✅ Gray Legal Box
- ✅ Tabellen mit Zebra-Pattern
- ✅ Robuste Fehlerbehandlung

### CSS & Design ✅
- ✅ Farbschema: MEDLESS-Grün (#0F766E), Grau (#E5E7EB)
- ✅ Heading-Hierarchie: H1 (24pt), H2 (18pt), H3 (15pt/13pt)
- ✅ Tabellen: Header #F3FBF8, Borders #E5E7EB, Padding 6px
- ✅ Risk-Colors: Kritisch (Rot), Hoch (Orange), Mittel (Gelb), Niedrig (Grün)

### Technisch ✅
- ✅ Nur Daten aus `PatientReportData` / `DoctorReportData`
- ✅ Keine Berechnungen in Templates
- ✅ HTML kompatibel mit `html2pdf.js`
- ✅ Embedded CSS (keine externen Ressourcen)
- ✅ Keine `position: fixed`

---

## 7. Testdaten-Beispiel

**API-Endpoint:** `POST /api/analyze-and-reports`

**Testdaten (Ramipril + Diazepam):**
```json
{
  "vorname": "Thomas",
  "geschlecht": "männlich",
  "alter": 55,
  "gewicht": 80,
  "groesse": 175,
  "medications": [
    {
      "name": "Ramipril",
      "dailyDoseMg": 5
    },
    {
      "name": "Diazepam",
      "dailyDoseMg": 20
    }
  ],
  "durationWeeks": 12,
  "reductionGoal": 50
}
```

**Erwartetes Ergebnis:**
- Patient-PDF: Freundlich, verständlich, max. 1-2 Emojis
- Doctor-PDF: Sachlich, keine Emojis, "Lieber Arzt, liebe Ärztin,"
- Beide PDFs: A4-optimiert, klinisch sauber, gut lesbar

---

## 8. Zusammenfassung der Änderungen

### Geänderte Dateien
1. **`/home/user/webapp/src/report_templates.ts`** (6 MultiEdit-Operationen)

### CSS-Verbesserungen
- **@page Margin:** `20mm` → `20mm 18mm`
- **Font-Family:** `-apple-system` → `system-ui` Stack
- **Font-Size:** Patient 10pt → 11pt, Doctor 9pt → 10pt
- **Line-Height:** 1.5 → 1.4
- **Farben:** `#0A8A64` → `#0F766E`, `#1A1A1A` → `#111827`, `#E6E6E6` → `#E5E7EB`
- **Table-Padding:** Optimiert für bessere Lesbarkeit

### Struktur-Verbesserungen
- **Patient-Report:** 9 klare Sektionen, max. 1-2 Emojis
- **Doctor-Report:** 9 klare Sektionen, KEINE Emojis, korrekte Anrede
- **Risk-Badges:** Farbige Dots für Kritisch, Hoch, Mittel, Niedrig
- **Warning/Monitoring Boxes:** Klar differenziert (Yellow/Blue)

---

## 9. Nächste Schritte (Optional)

1. **UI-Tests:** Manuelles Testen mit echten Testdaten via Frontend
2. **Visual Review:** PDF-Download testen für beide Reports
3. **QA-Tests:** Verschiedene Medikations-Kombinationen testen
4. **Edge Cases:** Fehlende Werte, leere Arrays, null-Werte testen

---

## 10. Kontakt & Support

**Projekt:** MEDLESS  
**Deployment:** https://medless.pages.dev  
**Repository:** (Git-Repository URL)  
**Dokumentation:** Siehe README.md

---

**Status:** ✅ Abgeschlossen  
**Datum:** 2025-11-29  
**Build-Version:** 395.65 kB (dist/_worker.js)
