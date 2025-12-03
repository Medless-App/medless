// ============================================================
// PATIENT REPORT HTML TEMPLATE FOR PDF GENERATION
// ============================================================

import type { PatientReportData } from './report_data'
import { fillTemplate } from './utils/template_engine'

// ============================================================
// PATIENT REPORT TEMPLATE (WITH EMOJIS, PATIENT-FRIENDLY)
// ============================================================

export const PATIENT_REPORT_TEMPLATE_FIXED = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dein persönlicher MEDLESS-Plan</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #222222;
      background: white;
      padding: 20mm;
    }
    
    .container {
      max-width: 170mm;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 3px solid #00C39A;
      margin-bottom: 24px;
    }
    
    .header-logo img {
      height: 32px;
    }
    
    .header-text {
      font-size: 9pt;
      color: #00584D;
      text-align: right;
      font-weight: 500;
    }
    
    h1 {
      font-size: 22pt;
      color: #00584D;
      margin: 24px 0 12px 0;
      font-weight: 700;
      line-height: 1.2;
    }
    
    .subtitle {
      font-size: 11pt;
      color: #666;
      margin-bottom: 24px;
      font-style: italic;
    }
    
    .patient-data-box {
      background: #F0F9F7;
      border: 2px solid #00C39A;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    
    .patient-data-item {
      display: flex;
      flex-direction: column;
    }
    
    .patient-data-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    
    .patient-data-value {
      font-size: 13pt;
      font-weight: 700;
      color: #00584D;
    }
    
    h2 {
      font-size: 16pt;
      color: #00584D;
      margin-top: 28px;
      margin-bottom: 14px;
      font-weight: 600;
      border-bottom: 2px solid #00C39A;
      padding-bottom: 6px;
    }
    
    h3 {
      font-size: 12pt;
      color: #00584D;
      margin-top: 18px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    p {
      margin-bottom: 14px;
      line-height: 1.8;
    }
    
    .summary-box {
      background: #E6F7F4;
      border-left: 5px solid #00C39A;
      padding: 18px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .summary-box p {
      font-size: 11pt;
      color: #00584D;
      line-height: 1.9;
      margin-bottom: 0;
    }
    
    .positive-box {
      background: #F0FDF4;
      border: 2px solid #10B981;
      border-radius: 8px;
      padding: 18px;
      margin: 24px 0;
    }
    
    .positive-box h3 {
      color: #047857;
      margin-top: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .positive-box ul {
      margin: 12px 0 0 24px;
    }
    
    .positive-box li {
      margin-bottom: 10px;
      color: #065F46;
      line-height: 1.7;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 10pt;
    }
    
    th {
      background: #00C39A;
      color: white;
      font-weight: 600;
      padding: 12px 10px;
      text-align: left;
      border: none;
      text-transform: uppercase;
      font-size: 9pt;
      letter-spacing: 0.05em;
    }
    
    td {
      padding: 12px 10px;
      border: 1px solid #E5E7EB;
      vertical-align: top;
    }
    
    tr:nth-child(even) {
      background: #F9FAFB;
    }
    
    tr:nth-child(odd) {
      background: #FFFFFF;
    }
    
    .weekly-plan-table tbody tr:hover {
      background: #E6F7F4;
      transition: all 0.2s ease;
    }
    
    .cbd-dose-cell {
      font-weight: 700;
      color: #00584D;
      font-size: 11pt;
    }
    
    .warning-box {
      background: #FFF5F5;
      border: 3px solid #F97316;
      border-radius: 8px;
      padding: 20px;
      margin: 28px 0;
    }
    
    .warning-box h3 {
      color: #DC2626;
      margin-top: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13pt;
    }
    
    .warning-box p {
      color: #7C2D12;
      font-weight: 500;
      margin-bottom: 14px;
    }
    
    .warning-box ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .warning-box li {
      padding: 10px 14px;
      margin-bottom: 8px;
      background: white;
      border-left: 3px solid #F97316;
      border-radius: 4px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    
    .emergency-note {
      background: #FEE2E2;
      border: 2px solid #DC2626;
      padding: 14px;
      margin-top: 16px;
      border-radius: 6px;
      text-align: center;
      font-size: 10pt;
      color: #7F1D1D;
      font-weight: 600;
    }
    
    .emergency-note strong {
      color: #DC2626;
      font-size: 12pt;
    }
    
    .monitoring-box {
      background: #F0F9F7;
      border-left: 5px solid #00C39A;
      padding: 18px;
      margin: 24px 0;
      border-radius: 4px;
    }
    
    .monitoring-box h3 {
      color: #00584D;
      margin-top: 0;
    }
    
    .monitoring-box ul {
      margin: 12px 0 0 24px;
    }
    
    .monitoring-box li {
      margin-bottom: 8px;
      color: #00584D;
    }
    
    .cost-box {
      background: #FEFCE8;
      border: 3px solid #EAB308;
      border-radius: 10px;
      padding: 24px;
      margin: 28px 0;
      text-align: center;
    }
    
    .cost-total {
      font-size: 32pt;
      font-weight: 700;
      color: #00584D;
      margin-bottom: 8px;
    }
    
    .cost-label {
      font-size: 12pt;
      color: #666;
      margin-bottom: 18px;
      font-weight: 500;
    }
    
    .cost-breakdown {
      background: white;
      border-radius: 6px;
      padding: 14px;
      margin-top: 16px;
      font-size: 10pt;
      color: #4B5563;
      border: 1px solid #E5E7EB;
    }
    
    .cost-note {
      font-size: 9pt;
      color: #6B7280;
      margin-top: 14px;
      line-height: 1.6;
      font-style: italic;
    }
    
    .legal-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      padding: 16px;
      margin: 28px 0;
      font-size: 8pt;
      line-height: 1.7;
      color: #666;
      border-radius: 4px;
    }
    
    .footer {
      text-align: center;
      font-size: 8pt;
      color: #999;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #E5E7EB;
    }
    
    .section-divider {
      border-top: 1px solid #D1D5DB;
      margin: 24px 0;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
<div class="container">

<!-- 1. HEADER -->
<div class="header">
  <div class="header-logo">
    <img src="{{logo_url}}" alt="MEDLESS Logo" style="height:32px;">
  </div>
  <div class="header-text">
    Dein Weg zu weniger Medikamenten – natürlich begleitet
  </div>
</div>

<!-- 2. TITLE -->
<h1>🌿 Dein persönlicher MEDLESS-Plan</h1>
<p class="subtitle">Individuell für dich erstellt – Schritt für Schritt zu mehr Wohlbefinden</p>

<!-- 3. PATIENT DATA -->
<div class="patient-data-box">
  <div class="patient-data-item">
    <div class="patient-data-label">Name</div>
    <div class="patient-data-value">{{patient_name}}</div>
  </div>
  <div class="patient-data-item">
    <div class="patient-data-label">Alter</div>
    <div class="patient-data-value">{{alter}} Jahre</div>
  </div>
  <div class="patient-data-item">
    <div class="patient-data-label">Gewicht</div>
    <div class="patient-data-value">{{gewicht}} kg</div>
  </div>
  <div class="patient-data-item">
    <div class="patient-data-label">BMI</div>
    <div class="patient-data-value">{{bmi}}</div>
  </div>
  <div class="patient-data-item">
    <div class="patient-data-label">Medikamente</div>
    <div class="patient-data-value">{{anzahl_medikamente}}</div>
  </div>
  <div class="patient-data-item">
    <div class="patient-data-label">Dauer</div>
    <div class="patient-data-value">{{dauer_wochen}} Wochen</div>
  </div>
</div>

<div class="section-divider"></div>

<!-- 4. SUMMARY -->
<h2>📋 Zusammenfassung deines Plans</h2>
<div class="summary-box">
  <p>{{zusammenfassung}}</p>
</div>

<!-- 5. POSITIVE EFFECTS -->
<div class="positive-box">
  <h3>✨ Mögliche positive Effekte</h3>
  <p style="margin-bottom:12px;color:#065F46;">Wenn du deinen Plan befolgst, kannst du diese Verbesserungen erwarten:</p>
  <ul>
    {{#positive_effekte}}
    <li>{{.}}</li>
    {{/positive_effekte}}
  </ul>
</div>

<div class="section-divider"></div>

<!-- 6. WEEKLY PLAN -->
<h2>📅 Dein Wochenplan</h2>
<p style="margin-bottom:16px;color:#666;">So sieht deine persönliche Reduktion Woche für Woche aus:</p>

<table class="weekly-plan-table">
  <thead>
    <tr>
      <th style="width:10%;">Woche</th>
      <th style="width:20%;">CBD-Dosis (täglich)</th>
      <th style="width:30%;">Einnahme-Schema</th>
      <th style="width:40%;">Medikamenten-Anpassung</th>
    </tr>
  </thead>
  <tbody>
    {{#wochenplan}}
    <tr>
      <td style="font-weight:600;text-align:center;color:#00584D;">{{woche}}</td>
      <td class="cbd-dose-cell">{{cbd_dosis}}</td>
      <td style="font-size:9.5pt;">{{einnahme_schema}}</td>
      <td style="font-size:9.5pt;color:#374151;">{{medikament_anpassung}}</td>
    </tr>
    {{/wochenplan}}
  </tbody>
</table>

<!-- 7. WARNING SIGNS -->
<div class="warning-box">
  <h3>⚠️ Wichtige Warnzeichen – Wann du sofort deinen Arzt kontaktieren solltest</h3>
  <p>Bei folgenden Symptomen bitte <strong>umgehend</strong> ärztliche Hilfe suchen:</p>
  <ul>
    {{#warnzeichen}}
    <li>{{.}}</li>
    {{/warnzeichen}}
  </ul>
  <div class="emergency-note">
    <strong>Bei Notfällen:</strong> Ruf sofort die <strong>112</strong> an!
  </div>
</div>

<!-- 8. MEDICAL CONTROLS -->
<div class="monitoring-box">
  <h3>🩺 Regelmäßige ärztliche Kontrollen</h3>
  <p><strong>Kontrolltermine:</strong> {{kontrollen_haeufigkeit}}</p>
  <p style="margin-top:12px;"><strong>Was wird kontrolliert:</strong></p>
  <ul>
    {{#kontrollen_parameter}}
    <li>{{.}}</li>
    {{/kontrollen_parameter}}
  </ul>
</div>

<div class="section-divider"></div>

<!-- 9. COST OVERVIEW (MEDLESS PRODUCTS ONLY) -->
<h2>💰 Deine Investition in deine Gesundheit</h2>

<div class="cost-box">
  <div class="cost-total">{{kosten_gesamt}} €</div>
  <div class="cost-label">Gesamtkosten für {{dauer_wochen}} Wochen MEDLESS CBD-Sprays</div>
  
  <div class="cost-breakdown">
    <strong>Benötigte Produkte:</strong><br>
    {{produkt_details}}
  </div>
  
  <div class="cost-note">
    Dies sind die Kosten für die MEDLESS CBD-Dosier-Sprays. 
    Die Kosten für deine verschriebenen Medikamente sind hier nicht enthalten 
    und werden wie gewohnt über deinen Arzt oder deine Krankenkasse abgerechnet.
  </div>
</div>

<!-- 10. LEGAL NOTICE -->
<div class="legal-box">
  <strong>Wichtiger rechtlicher Hinweis:</strong><br><br>
  {{rechtlicher_hinweis}}
</div>

<!-- 11. FOOTER -->
<div class="footer">
  {{version_note}}<br>
  <span style="color:#00C39A;">●</span> Erstellt mit KI-gestützter Analyse <span style="color:#00C39A;">●</span>
</div>

</div>
</body>
</html>`;

// ============================================================
// RENDER FUNCTION
// ============================================================

export function renderPatientReportHtmlFixed(data: PatientReportData): string {
  const templateData = {
    logo_url: 'https://medless.de/assets/logo.svg',
    patient_name: data.patientFacts.firstName || 'N/A',
    alter: data.patientFacts.age || 'N/A',
    gewicht: data.patientFacts.weight || 'N/A',
    bmi: data.patientFacts.bmi || 'N/A',
    anzahl_medikamente: data.patientFacts.medicationCount || 0,
    dauer_wochen: data.medlessProductNotes.durationWeeks || 0,
    
    zusammenfassung: data.shortSummary || 'Dein individueller Plan wurde erstellt.',
    
    positive_effekte: data.positiveEffectsExamples || [],
    
    wochenplan: data.weeklyPlan.map(week => ({
      woche: week.week,
      cbd_dosis: week.cbdDoseDisplay,
      einnahme_schema: `${week.productName}\n${week.spraySchedule}`,
      medikament_anpassung: week.medicationsDisplay
    })),
    
    warnzeichen: data.warningSymptoms || [],
    
    kontrollen_haeufigkeit: data.checkupInfo.frequency || 'Nach ärztlicher Empfehlung',
    kontrollen_parameter: data.checkupInfo.parameters || [],
    
    kosten_gesamt: data.medlessProductNotes.totalCost.toFixed(2),
    produkt_details: data.medlessProductNotes.costBreakdown || 'Keine Details verfügbar',
    
    rechtlicher_hinweis: data.footerDisclaimer || 'Dieser Plan ersetzt keine ärztliche Beratung.',
    version_note: data.versionNote || 'MEDLESS Plan v2.0'
  };

  return fillTemplate(PATIENT_REPORT_TEMPLATE_FIXED, templateData);
}

// ============================================================
// EXAMPLE FUNCTION
// ============================================================

export function renderPatientReportExample(): string {
  const exampleData = {
    logo_url: 'https://medless.de/assets/logo.svg',
    patient_name: 'Maria',
    alter: 62,
    gewicht: 68,
    bmi: '24.9',
    anzahl_medikamente: 1,
    dauer_wochen: 8,
    
    zusammenfassung: 'Dein Plan reduziert 1 Medikament über 8 Wochen um insgesamt 44%. Deine CBD-Dosis steigt schrittweise von 35 mg auf 70 mg täglich. Die Reduktion erfolgt langsam und sicher, damit dein Körper sich gut anpassen kann.',
    
    positive_effekte: [
      '✨ Weniger Nebenwirkungen durch niedrigere Medikamentendosis',
      '💪 Mehr Energie und besseres Wohlbefinden im Alltag',
      '😌 Natürliche Unterstützung deines Endocannabinoid-Systems',
      '🛡️ Schutz vor Entzugssymptomen durch CBD-Begleitung',
      '🎯 Schritt für Schritt zu mehr Lebensqualität'
    ],
    
    wochenplan: [
      {
        woche: 1,
        cbd_dosis: '35.0 mg',
        einnahme_schema: 'MEDLESS Nr. 5 (2.5%)\n7 Sprühstöße täglich (morgens 3, abends 4)',
        medikament_anpassung: 'Celecoxib: 400mg → 400mg (keine Änderung)'
      },
      {
        woche: 2,
        cbd_dosis: '52.5 mg',
        einnahme_schema: 'MEDLESS Nr. 25 (5%)\n7 Sprühstöße täglich (morgens 3, abends 4)',
        medikament_anpassung: 'Celecoxib: 400mg → 378mg (-5.5%)'
      },
      {
        woche: 3,
        cbd_dosis: '52.5 mg',
        einnahme_schema: 'MEDLESS Nr. 25 (5%)\n7 Sprühstöße täglich (morgens 3, abends 4)',
        medikament_anpassung: 'Celecoxib: 378mg → 356mg (-5.8%)'
      },
      {
        woche: 4,
        cbd_dosis: '52.5 mg',
        einnahme_schema: 'MEDLESS Nr. 25 (5%)\n7 Sprühstöße täglich (morgens 3, abends 4)',
        medikament_anpassung: 'Celecoxib: 356mg → 334mg (-6.2%)'
      },
      {
        woche: 5,
        cbd_dosis: '70.0 mg',
        einnahme_schema: 'MEDLESS Nr. 25 (5%)\n9 Sprühstöße täglich (morgens 4, abends 5)',
        medikament_anpassung: 'Celecoxib: 334mg → 312mg (-6.6%)'
      },
      {
        woche: 6,
        cbd_dosis: '70.0 mg',
        einnahme_schema: 'MEDLESS Nr. 25 (5%)\n9 Sprühstöße täglich (morgens 4, abends 5)',
        medikament_anpassung: 'Celecoxib: 312mg → 290mg (-7.1%)'
      },
      {
        woche: 7,
        cbd_dosis: '70.0 mg',
        einnahme_schema: 'MEDLESS Nr. 25 (5%)\n9 Sprühstöße täglich (morgens 4, abends 5)',
        medikament_anpassung: 'Celecoxib: 290mg → 268mg (-7.6%)'
      },
      {
        woche: 8,
        cbd_dosis: '70.0 mg',
        einnahme_schema: 'MEDLESS Nr. 25 (5%)\n9 Sprühstöße täglich (morgens 4, abends 5)',
        medikament_anpassung: 'Celecoxib: 268mg → 246mg (-8.2%) ✓ Ziel erreicht!'
      }
    ],
    
    warnzeichen: [
      '⚠️ Starker Schwindel oder Ohnmachtsgefühl',
      '💓 Herzrasen oder unregelmäßiger Herzschlag (Puls >120 in Ruhe)',
      '🤯 Starke Kopfschmerzen oder Verwirrung',
      '😰 Extreme Angst oder Panikattacken',
      '🌡️ Fieber über 38,5°C ohne erkennbare Ursache',
      '🤢 Anhaltende Übelkeit oder Erbrechen',
      '😴 Extreme Müdigkeit oder Bewusstseinsstörungen'
    ],
    
    kontrollen_haeufigkeit: 'Wöchentlich in den ersten 4 Wochen, dann alle 2 Wochen',
    kontrollen_parameter: [
      'Blutdruck und Herzfrequenz',
      'Allgemeines Wohlbefinden und Stimmung',
      'Schmerzlevel (bei Schmerzmitteln)',
      'Schlafqualität',
      'Eventuell Blutbild (nach ärztlicher Empfehlung)'
    ],
    
    kosten_gesamt: '184.70',
    produkt_details: '1x MEDLESS Nr. 5 (2.5%, 74.70€) + 2x MEDLESS Nr. 25 (5%, 2x 55.00€)',
    
    rechtlicher_hinweis: 'Dieser Plan ist eine persönliche Empfehlung und ersetzt keine ärztliche Beratung. Bitte sprich mit deinem Arzt oder deiner Ärztin, bevor du Medikamente reduzierst oder Cannabinoide einnimmst. Setze niemals eigenmächtig verschriebene Medikamente ab. Bei Notfällen rufe sofort die 112 an.',
    
    version_note: 'MEDLESS Patientenplan v2.0 – Erstellt am ' + new Date().toLocaleDateString('de-DE')
  };

  return fillTemplate(PATIENT_REPORT_TEMPLATE_FIXED, exampleData);
}
