# MEDLESS PDF Template - Dokumentation

## 📄 Übersicht

Diese Vorlage generiert einen professionellen, mehrseitigen medizinischen Bericht mit zwei Hauptteilen:
- **Teil 1:** Patienten-Plan (Seiten 1-4)
- **Teil 2:** Ärztliche Information (Seiten 5-9)

---

## 🎯 Verwendung der Platzhalter

### **TEIL 1: Patienten-Plan**

#### **Seite 1: Titelseite**
```
{{logo}}           - Logo-Platzhalter (kann Text oder Bild sein)
{{patientName}}    - Name des Patienten
{{date}}           - Erstellungsdatum (Format: TT.MM.JJJJ)
```

#### **Seite 2: Persönliche Daten**
```
{{age}}            - Alter in Jahren (z.B. "45")
{{weight}}         - Gewicht in kg (z.B. "75")
{{height}}         - Körpergröße in cm (z.B. "175")
{{bmi}}            - Body Mass Index (z.B. "24.5")
{{bsa}}            - Körperoberfläche in m² (z.B. "1.90")
{{lifestyle}}      - Relevante Angaben (z.B. "Nichtraucher, kein Alkohol")
```

#### **Seite 3: Dosierplan**
```
{{product}}        - Produktname (z.B. "CBD-Öl 10% Vollspektrum")
{{startDose}}      - Startdosierung in mg (z.B. "5")
{{titrationPlan}}  - Steigerungsplan als HTML oder Text
{{dailyDosing}}    - Tagesdosierung als <tr>-Zeilen für Tabelle
{{expectedEffects}}- Erwartete Effekte als Text oder Liste
```

**Beispiel für `{{dailyDosing}}`:**
```html
<tr><td>Morgens</td><td>5 mg</td></tr>
<tr><td>Mittags</td><td>0 mg</td></tr>
<tr><td>Abends</td><td>10 mg</td></tr>
```

#### **Seite 4: Sicherheit & Hinweise**
```
{{safetyNotes}}    - Individuelle Sicherheitshinweise für den Patienten
```

---

### **TEIL 2: Ärztliche Information**

#### **Seite 6: Medikation**
```
{{drugList}}       - Liste aller Medikamente als HTML-Cards
```

**Beispiel für `{{drugList}}`:**
```html
<div class="drug-card no-break">
  <div class="drug-card-header">Citalopram 20 mg</div>
  <div class="drug-card-row">
    <span class="drug-card-label">Medikamentenklasse:</span>
    <span class="drug-card-value">SSRI (Antidepressivum)</span>
  </div>
  <div class="drug-card-row">
    <span class="drug-card-label">CYP-Metabolismus:</span>
    <span class="drug-card-value">CYP2C19, CYP3A4</span>
  </div>
  <div class="drug-card-row">
    <span class="drug-card-label">Interaktionsrisiko:</span>
    <span class="drug-card-value">
      <span class="risk-badge risk-high">HIGH</span>
    </span>
  </div>
  <div class="drug-card-row">
    <span class="drug-card-label">Mögliche Cannabinoid-Wirkung:</span>
    <span class="drug-card-value">
      CBD hemmt CYP2C19 und kann Citalopram-Spiegel erhöhen. 
      Risiko für Serotonin-Syndrom bei hohen Dosen.
    </span>
  </div>
</div>
```

**Risk-Badge-Klassen:**
- `risk-low` (grün)
- `risk-medium` (gelb)
- `risk-high` (orange)
- `risk-critical` (rot)

#### **Seite 7: Interaktionsanalyse**
```
{{interactionAnalysis}} - Detaillierte pharmakologische Analyse als HTML
```

**Beispiel:**
```html
<h4>Identifizierte Interaktionen:</h4>
<ul class="bullet-list">
  <li><strong>Citalopram + CBD:</strong> CYP2C19-Hemmung → erhöhte Plasmaspiegel</li>
  <li><strong>Warfarin + CBD:</strong> CYP2C9-Hemmung → INR-Erhöhung möglich</li>
</ul>

<h4>Klinische Relevanz:</h4>
<p>
  Bei 2 von 4 Medikamenten besteht ein hohes Interaktionsrisiko. 
  Engmaschiges Monitoring erforderlich.
</p>
```

#### **Seite 8: Monitoring**
```
{{monitoring}}     - Monitoring-Empfehlungen als Tabelle oder Liste
```

**Beispiel:**
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Zeitpunkt</th>
      <th>Begründung</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>INR-Wert</td>
      <td>Nach 3-5 Tagen</td>
      <td>Warfarin-CBD-Interaktion</td>
    </tr>
    <tr>
      <td>Citalopram-Spiegel (TDM)</td>
      <td>Nach 2 Wochen</td>
      <td>CYP2C19-Hemmung durch CBD</td>
    </tr>
  </tbody>
</table>
```

---

## 🎨 Verfügbare CSS-Klassen

### **Layout**
- `.page-break` - Seitenumbruch nach Element
- `.no-break` - Verhindert Seitenumbruch innerhalb Element

### **Content-Boxen**
- `.info-box` - Grüne Info-Box
- `.warning-box` - Gelbe Warnungs-Box
- `.danger-box` - Rote Gefahr-Box

### **Listen**
- `.checklist` - Liste mit grünen Häkchen
- `.bullet-list` - Standard-Aufzählung

### **Tabellen**
- `.data-table` - Professionelle Datentabelle

### **Text-Utilities**
- `.text-center` - Zentrierter Text
- `.text-right` - Rechtsbündiger Text
- `.text-muted` - Grauer Text
- `.text-bold` - Fetter Text

### **Spacing**
- `.mt-1`, `.mt-2`, `.mt-3` - Margin top (10px, 20px, 30px)
- `.mb-1`, `.mb-2`, `.mb-3` - Margin bottom (10px, 20px, 30px)

---

## 🔧 Integration mit PDF-Generator

### **Empfohlene Tools:**

#### **1. Puppeteer (Node.js)**
```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');

async function generatePDF(data) {
  // Load template
  let html = fs.readFileSync('medless-report-template.html', 'utf8');
  
  // Replace placeholders
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, data[key] || '');
  });
  
  // Generate PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: 'medless-report.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    }
  });
  
  await browser.close();
}
```

#### **2. wkhtmltopdf (Command-Line)**
```bash
wkhtmltopdf --page-size A4 --margin-top 15mm --margin-right 15mm \
  --margin-bottom 15mm --margin-left 15mm \
  medless-report-filled.html medless-report.pdf
```

#### **3. Cloudflare Workers (Hono + Puppeteer)**
```typescript
import { Hono } from 'hono';
import puppeteer from '@cloudflare/puppeteer';

const app = new Hono();

app.post('/api/generate-pdf', async (c) => {
  const data = await c.req.json();
  
  // Load template
  const template = await fetch('/templates/pdf/medless-report-template.html');
  let html = await template.text();
  
  // Replace placeholders
  Object.keys(data).forEach(key => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  });
  
  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch(c.env.MYBROWSER);
  const page = await browser.newPage();
  await page.setContent(html);
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });
  
  await browser.close();
  
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="medless-report.pdf"'
    }
  });
});
```

---

## 📋 Beispiel-Daten

```javascript
const exampleData = {
  logo: 'MEDLESS',
  patientName: 'Max Mustermann',
  date: '25.11.2025',
  age: '45',
  weight: '75',
  height: '175',
  bmi: '24.5',
  bsa: '1.90',
  lifestyle: 'Nichtraucher, gelegentlich Alkohol, regelmäßiger Sport',
  
  product: 'CBD-Öl 10% Vollspektrum',
  startDose: '5',
  titrationPlan: `
    <table class="data-table">
      <tr><th>Woche</th><th>Dosis</th></tr>
      <tr><td>Woche 1-2</td><td>5 mg täglich</td></tr>
      <tr><td>Woche 3-4</td><td>10 mg täglich</td></tr>
      <tr><td>Ab Woche 5</td><td>15 mg täglich</td></tr>
    </table>
  `,
  dailyDosing: `
    <tr><td>Morgens</td><td>5 mg</td></tr>
    <tr><td>Abends</td><td>10 mg</td></tr>
  `,
  expectedEffects: 'Mögliche leichte Müdigkeit in den ersten Tagen. Verbesserung von Schlaf und Stimmung nach 2-3 Wochen.',
  safetyNotes: 'Keine bekannten Allergien. Bei Schwindel Dosis reduzieren.',
  
  drugList: `
    <div class="drug-card">
      <div class="drug-card-header">Citalopram 20 mg</div>
      <div class="drug-card-row">
        <span class="drug-card-label">Klasse:</span>
        <span class="drug-card-value">SSRI</span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">CYP:</span>
        <span class="drug-card-value">CYP2C19, CYP3A4</span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">Risiko:</span>
        <span class="drug-card-value">
          <span class="risk-badge risk-high">HIGH</span>
        </span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">Wirkung:</span>
        <span class="drug-card-value">CBD hemmt CYP2C19 → erhöhte Spiegel möglich</span>
      </div>
    </div>
  `,
  
  interactionAnalysis: `
    <h4>Identifizierte Interaktionen (n=1):</h4>
    <ul class="bullet-list">
      <li><strong>Citalopram + CBD:</strong> Moderate bis hohe Interaktion über CYP2C19</li>
    </ul>
    <p class="mt-2">
      <strong>Empfehlung:</strong> Therapeutisches Drug Monitoring nach 2 Wochen. 
      Ggf. Dosisreduktion von Citalopram erwägen.
    </p>
  `,
  
  monitoring: `
    <table class="data-table">
      <thead>
        <tr><th>Parameter</th><th>Zeitpunkt</th><th>Begründung</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Citalopram-Spiegel</td>
          <td>Nach 14 Tagen</td>
          <td>CYP2C19-Hemmung durch CBD</td>
        </tr>
        <tr>
          <td>Klinische Symptome</td>
          <td>Wöchentlich</td>
          <td>Überwachung auf Serotonerge Effekte</td>
        </tr>
      </tbody>
    </table>
  `
};
```

---

## 🚀 Deployment

Diese Vorlage ist für folgende Szenarien optimiert:

1. **Cloudflare Workers** - Serverless PDF-Generierung
2. **Node.js Backend** - Puppeteer/Playwright
3. **Static HTML** - Manuelles Ausfüllen und Drucken

---

## 📝 Hinweise

- Alle Platzhalter müssen ersetzt werden, auch wenn leer: `''`
- HTML-Tags in Platzhaltern sind erlaubt
- Template ist für A4-Format optimiert
- Print-CSS ist enthalten (`@media print`)
- Alle Seiten haben automatische Seitenumbrüche

---

## 📞 Support

Bei Fragen zur Integration: info@medless.de

**Version:** 1.0.0  
**Letzte Aktualisierung:** 25.11.2025
