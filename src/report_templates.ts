// ============================================================
// DOCTOR REPORT HTML TEMPLATE FOR PDF GENERATION
// ============================================================

import type { PatientReportData, DoctorReportData } from './report_data'
import { fillTemplate } from './utils/template_engine'
import { MEDLESS_LOGO_BASE64 } from './logo_base64'

// ============================================================
// UTILITY FUNCTIONS FOR FORMATTING
// ============================================================

/**
 * Render Safety Data Section for Doctor Report (P0/P1)
 */
function renderSafetyDataSection(safetyData: DoctorReportData['safetyData']): string {
  if (!safetyData) return '';
  
  let html = `
    <div class="monitoring-box" style="background: #FEF3C7; border-left: 3px solid #F59E0B; margin-top: 12px;">
      <h2 style="margin-top: 0; color: #92400E;">🧬 Erweiterte Sicherheits-Analyse (P0/P1)</h2>
      <p style="font-size: 8.5pt; color: #78350F; margin-bottom: 10px;">
        Diese Analyse berücksichtigt CYP450-Enzyme, therapeutische Bereiche, Absetzrisiken und Multi-Drug-Interaktionen.
      </p>
  `;
  
  // Multi-Drug Interaction
  if (safetyData.multiDrugInteraction && (safetyData.multiDrugInteraction.inhibitors > 0 || safetyData.multiDrugInteraction.inducers > 0)) {
    const mdi = safetyData.multiDrugInteraction;
    const levelColor = mdi.level === 'severe' ? '#DC2626' : mdi.level === 'moderate' ? '#F59E0B' : '#6B7280';
    html += `
      <div style="background: white; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
        <h3 style="margin: 0 0 5px; color: ${levelColor};">Multi-Drug-Interaktion: ${mdi.level.toUpperCase()}</h3>
        <p style="font-size: 8pt; margin: 3px 0;"><strong>Hemm-Profile:</strong> ${mdi.inhibitors} | <strong>Induktions-Profile:</strong> ${mdi.inducers}</p>
        <p style="font-size: 8pt; margin: 3px 0;"><strong>Anpassungsfaktor:</strong> ${(mdi.adjustment_factor * 100).toFixed(0)}% der Basis-Reduktionsgeschwindigkeit</p>
        ${mdi.warnings && mdi.warnings.length > 0 ? `
          <ul style="margin: 5px 0 0 18px; font-size: 7.5pt;">
            ${mdi.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  }
  
  // CYP450 Profile
  if (safetyData.cypProfile && safetyData.cypProfile.totalMedicationsWithCypData > 0) {
    const cyp = safetyData.cypProfile;
    html += `
      <div style="background: white; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
        <h3 style="margin: 0 0 5px;">CYP450-Enzym-Profile</h3>
        <p style="font-size: 8pt; margin: 3px 0;"><strong>Medikamente mit CYP-Daten:</strong> ${cyp.totalMedicationsWithCypData} (${cyp.totalCypProfiles} Profile)</p>
        ${cyp.medicationsWithSlowerEffect && cyp.medicationsWithSlowerEffect.length > 0 ? `
          <p style="font-size: 7.5pt; margin: 3px 0; color: #DC2626;"><strong>Langsamere Reduktion:</strong> ${cyp.medicationsWithSlowerEffect.join(', ')}</p>
        ` : ''}
        ${cyp.medicationsWithFasterEffect && cyp.medicationsWithFasterEffect.length > 0 ? `
          <p style="font-size: 7.5pt; margin: 3px 0; color: #059669;"><strong>Schnellere Reduktion:</strong> ${cyp.medicationsWithFasterEffect.join(', ')}</p>
        ` : ''}
        ${cyp.affectedEnzymes && cyp.affectedEnzymes.length > 0 ? `
          <p style="font-size: 7.5pt; margin: 3px 0;"><strong>Betroffene Enzyme:</strong> ${cyp.affectedEnzymes.join(', ')}</p>
        ` : ''}
      </div>
    `;
  }
  
  // Withdrawal Risk
  if (safetyData.withdrawalRiskAdjustment && safetyData.withdrawalRiskAdjustment.medications && safetyData.withdrawalRiskAdjustment.medications.length > 0) {
    const wr = safetyData.withdrawalRiskAdjustment;
    html += `
      <div style="background: white; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
        <h3 style="margin: 0 0 5px;">Absetzrisiko-Quantifizierung</h3>
        ${wr.medications.map(med => {
          const riskColor = med.score >= 8 ? '#DC2626' : med.score >= 5 ? '#F59E0B' : '#6B7280';
          return `
            <p style="font-size: 7.5pt; margin: 3px 0;">
              <strong style="color: ${riskColor};">${med.name}:</strong> Score ${med.score}/10, Verlangsamung ${med.reduction_slowdown_pct}% (Faktor ${med.factor.toFixed(2)})
            </p>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Therapeutic Range
  if (safetyData.therapeuticRange && safetyData.therapeuticRange.medications && safetyData.therapeuticRange.medications.length > 0) {
    const tr = safetyData.therapeuticRange;
    const medsWithRange = tr.medications.filter(m => m.has_range);
    if (medsWithRange.length > 0) {
      html += `
        <div style="background: white; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <h3 style="margin: 0 0 5px;">Therapeutischer Bereich</h3>
          ${medsWithRange.map(med => {
            const isNarrow = med.is_narrow_window;
            return `
              <p style="font-size: 7.5pt; margin: 3px 0;">
                <strong ${isNarrow ? 'style="color: #F59E0B;"' : ''}>${med.name}:</strong> 
                ${med.min_ng_ml}-${med.max_ng_ml} ng/ml 
                ${med.window_width ? `(Breite: ${med.window_width} ng/ml)` : ''}
                ${isNarrow ? ' <strong style="color: #F59E0B;">[ENGES FENSTER]</strong>' : ''}
              </p>
            `;
          }).join('')}
        </div>
      `;
    }
  }
  
  // Medication Safety Notes
  if (Object.keys(safetyData.medicationSafetyNotes).length > 0) {
    html += `
      <div style="background: white; padding: 8px; border-radius: 4px;">
        <h3 style="margin: 0 0 5px;">Medikamenten-spezifische Sicherheitshinweise (Woche 1)</h3>
        ${Object.entries(safetyData.medicationSafetyNotes).map(([medName, notes]) => `
          <p style="font-size: 7.5pt; margin: 5px 0 2px; font-weight: 600;">${medName}:</p>
          <ul style="margin: 2px 0 5px 18px; font-size: 7pt;">
            ${notes.map(note => `<li>${note}</li>`).join('')}
          </ul>
        `).join('')}
      </div>
    `;
  }
  
  html += `</div>`;
  return html;
}

/**
 * Format milligram values consistently
 * - Remove .0 decimals: "400.0" → "400"
 * - Always add space before unit: "400mg" → "400 mg"
 */
function formatMg(value: number | string | undefined | null, unit: 'mg' | 'mg/Tag' = 'mg'): string {
  if (value === undefined || value === null) return 'N/A';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = numValue % 1 === 0 ? numValue.toFixed(0) : numValue.toFixed(1);
  
  return `${formatted} ${unit}`;
}

/**
 * Format medication change (e.g., "400 mg → 375 mg")
 */
function formatMedicationChange(from: number, to: number): string {
  return `${formatMg(from)} → ${formatMg(to)}`;
}

// ============================================================
// DOCTOR REPORT TEMPLATE (EMOJI-FREE, A4-OPTIMIZED)
// ============================================================

export const DOCTOR_REPORT_TEMPLATE_FIXED = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MEDLESS-Reduktionsplan – Ärztliche Dokumentation</title>
  <style>
    @page {
      size: A4;
      margin: 10mm 10mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #222222;
      background: white;
      box-sizing: border-box;
    }
    
    /* PDF-optimized full-width layout - PDFShift compatible */
    .report-wrapper,
    .report-page,
    .report-container,
    body.pdf-report .container,
    body.pdf-report .wrapper,
    body.pdf-report .content {
      width: 100% !important;
      max-width: none !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }
    
    /* Screen-optimized centered layout (for /test/ pages only) */
    body:not(.pdf-report) .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* PROFESSIONAL REPORT HEADER */
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8mm;
    }
    
    .report-header-left {
      flex: 0 0 auto;
    }
    
    .report-logo {
      width: 140px;
      height: auto;
    }
    
    .report-header-right {
      flex: 1;
      text-align: right;
      padding-left: 20px;
    }
    
    .report-header-title {
      font-size: 14pt;
      font-weight: 600;
      color: #00584D;
      margin-bottom: 4px;
    }
    
    .report-header-subtitle {
      font-size: 10pt;
      color: #4b5563;
    }
    
    .report-header-separator {
      border: none;
      border-top: 2px solid #00C39A;
      margin: 0 0 6mm 0;
    }
    
    /* OLD HEADER (deprecated, keep for backwards compat) */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #E5E7EB;
      margin-bottom: 20px;
    }
    
    .header-logo img {
      height: 22px;
    }
    
    .header-text {
      font-size: 8pt;
      color: #666;
      text-align: right;
    }
    
    /* ANREDE */
    .salutation {
      color: #666;
      font-size: 9pt;
      margin-bottom: 16px;
      font-style: italic;
    }
    
    .intro-text {
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    /* RISIKO-DASHBOARD */
    .risk-dashboard {
      background: #F9FAFB;
      border: 1.5px solid #E5E7EB;
      border-radius: 5px;
      padding: 9px;
      margin: 12px 0;
    }
    
    .risk-dashboard-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #00584D;
      margin-bottom: 6px;
    }
    
    .risk-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }
    
    .risk-item {
      background: white;
      padding: 6px;
      border-radius: 4px;
      border-left: 3px solid #00C39A;
    }
    
    .risk-label {
      font-size: 7.5pt;
      color: #666;
      margin-bottom: 3px;
    }
    
    .risk-value {
      font-size: 9.5pt;
      font-weight: 700;
      color: #00584D;
    }
    
    /* TITEL */
    h1 {
      font-size: 16pt;
      color: #00584D;
      margin: 12px 0 5px 0;
      font-weight: 700;
      border-bottom: 2.5px solid #00C39A;
      padding-bottom: 5px;
    }
    
    .subtitle {
      font-size: 8pt;
      color: #666;
      margin-bottom: 10px;
    }
    
    .subtitle-small {
      font-size: 9pt;
      color: #6B7280;
      margin-top: 2mm;
      margin-bottom: 8px;
    }
    
    /* PHARMAKOLOGIE-BOX */
    .pharma-box {
      background: #F0F9F7;
      border: 1px solid #00C39A;
      border-radius: 5px;
      padding: 8px;
      margin: 10px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      page-break-inside: avoid;
      min-height: 120px;
    }
    
    .pharma-title {
      grid-column: 1 / -1;
      font-size: 8.5pt;
      font-weight: 700;
      color: #00584D;
      margin-bottom: 4px;
    }
    
    .pharma-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .pharma-label {
      font-size: 7.5pt;
      color: #666;
    }
    
    .pharma-value {
      font-size: 7.5pt;
      font-weight: 600;
      color: #222;
    }
    
    /* ÜBERSCHRIFTEN */
    h2 {
      font-size: 13pt;
      color: #00584D;
      margin-top: 14px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    h3 {
      font-size: 10pt;
      color: #00584D;
      margin-top: 10px;
      margin-bottom: 5px;
      font-weight: 600;
    }
    
    /* TABELLEN */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }
    
    th {
      background: #E6F7F4;
      color: #00584D;
      font-weight: 600;
      padding: 5px;
      text-align: left;
      border: 1px solid #E5E7EB;
    }
    
    td {
      padding: 4px 5px;
      border: 1px solid #E5E7EB;
    }
    
    tr:nth-child(even) {
      background: #F9FAFB;
    }
    
    tr:nth-child(odd) {
      background: #FFFFFF;
    }
    
    /* MONITORING BOX */
    .monitoring-box {
      background: #F0F9F7;
      border-left: 3px solid #00C39A;
      padding: 8px;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    .monitoring-box h3 {
      margin-top: 0;
    }
    
    .monitoring-box ul {
      margin: 8px 0 8px 18px;
    }
    
    .monitoring-box li {
      margin-bottom: 3px;
      font-size: 8.5pt;
    }
    
    /* BALKENDIAGRAMM */
    .chart-section {
      margin: 12px 0;
    }
    
    .chart-title {
      font-size: 8.5pt;
      font-weight: 600;
      color: #00584D;
      margin-bottom: 6px;
    }
    
    .chart-bar {
      display: flex;
      align-items: center;
      margin-bottom: 3px;
    }
    
    .chart-label {
      width: 55px;
      font-size: 7.5pt;
      color: #666;
    }
    
    .chart-track {
      flex: 1;
      background: #E5E7EB;
      border-radius: 999px;
      height: 7px;
      overflow: hidden;
    }
    
    .chart-fill {
      height: 100%;
      background: #00C39A;
      border-radius: 999px;
      transition: width 0.3s;
    }
    
    .chart-value {
      width: 55px;
      text-align: right;
      font-size: 7.5pt;
      color: #666;
      margin-left: 6px;
    }
    
    /* RECHTLICHE HINWEISE */
    .legal-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      padding: 8px;
      margin: 12px 0;
      font-size: 7pt;
      line-height: 1.4;
      color: #666;
    }
    
    .footer-version {
      text-align: center;
      font-size: 6.5pt;
      color: #999;
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px solid #E5E7EB;
    }
    
    /* UTILITIES */
    .text-right {
      text-align: right;
    }
    
    .font-bold {
      font-weight: 600;
    }
    
    .mb-4 {
      margin-bottom: 16px;
    }
  </style>
</head>
<body class="pdf-report">
<div class="container">

<!-- 1) PROFESSIONAL HEADER -->
<header class="report-header">
  <div class="report-header-left">
    <img src="${MEDLESS_LOGO_BASE64}" alt="MEDLESS" class="report-logo">
  </div>
  <div class="report-header-right">
    <div class="report-header-title">MEDLESS – Ärztebericht</div>
    <div class="report-header-subtitle">Medizinische Dokumentation zur Reduktionsplanung</div>
  </div>
</header>
<hr class="report-header-separator">

<!-- 2) ANREDE UND EINLEITUNG -->
<p class="salutation">Lieber Arzt, liebe Ärztin,</p>

<p class="intro-text">
  der Patient / die Patientin <strong>{{patient_name}}</strong> hat diesen MEDLESS-Plan online erstellt. 
  Dieses Dokument enthält eine strukturierte Zusammenfassung des geplanten Cannabinoid-Einsatzes,
  einen Reduktionsplan sowie eine Wechselwirkungs- und Risikoabschätzung auf Basis pharmakokinetischer Daten 
  und definierter Reduktionsrichtlinien. 
  Der Bericht dient ausschließlich als ärztliche Entscheidungsunterstützung; 
  die finale Therapieentscheidung liegt bei Ihnen.
</p>

<!-- 3) RISIKO-DASHBOARD -->
<div class="risk-dashboard">
  <div class="risk-dashboard-title">Risiko-Dashboard</div>
  <div class="risk-grid">
    <div class="risk-item">
      <div class="risk-label">Wechselwirkung</div>
      <div class="risk-value">{{wechselwirkung_level}}</div>
    </div>
    <div class="risk-item">
      <div class="risk-label">Reduktionsgeschwindigkeit</div>
      <div class="risk-value">{{reduktionsgeschwindigkeit}}</div>
    </div>
    <div class="risk-item">
      <div class="risk-label">Kategorie</div>
      <div class="risk-value">{{kategorie}}</div>
    </div>
  </div>
</div>

<!-- 4) TITELBLOCK -->
<h1>MEDLESS-Reduktionsplan – Ärztliche Dokumentation</h1>
<p class="subtitle-small">Zusammenfassung pharmakologischer Eckdaten</p>

<!-- PHARMAKOLOGIE-BOX -->
<div class="pharma-box">
  <div class="pharma-title">Pharmakologie: {{med_name}}</div>
  
  <div>
    <div class="pharma-row">
      <span class="pharma-label">Startdosis:</span>
      <span class="pharma-value">{{startdosis}}</span>
    </div>
    <div class="pharma-row">
      <span class="pharma-label">Zieldosis:</span>
      <span class="pharma-value">{{zieldosis}}</span>
    </div>
    <div class="pharma-row">
      <span class="pharma-label">Halbwertszeit:</span>
      <span class="pharma-value">{{halbwertszeit}}</span>
    </div>
  </div>
  
  <div>
    <div class="pharma-row">
      <span class="pharma-label">Absetzrisiko:</span>
      <span class="pharma-value">{{absetzrisiko}}</span>
    </div>
    <div class="pharma-row">
      <span class="pharma-label">Kategorie:</span>
      <span class="pharma-value">{{med_kategorie}}</span>
    </div>
    <div class="pharma-row">
      <span class="pharma-label">CBD-IA-Risiko:</span>
      <span class="pharma-value">{{cbd_interaktion_level}}</span>
    </div>
  </div>
</div>

<!-- NEW: ADVANCED SAFETY ANALYSIS (P0/P1) -->
{{safety_data_html}}

<!-- 5) PATIENTENDATEN -->
<h2>Patientendaten</h2>
<table>
  <tr>
    <th style="width:30%;">Name</th>
    <td>{{patient_name}}</td>
    <th style="width:30%;">Alter</th>
    <td>{{alter}} Jahre</td>
  </tr>
  <tr>
    <th>Geschlecht</th>
    <td>{{geschlecht}}</td>
    <th>Gewicht</th>
    <td>{{gewicht}} kg</td>
  </tr>
  <tr>
    <th>Medikamente (gesamt)</th>
    <td>{{anzahl_medikamente}}</td>
    <th>BMI</th>
    <td>{{bmi}}</td>
  </tr>
  <tr>
    <th>Davon sensibel</th>
    <td>{{anzahl_sensible_medikamente}}</td>
    <th></th>
    <td></td>
  </tr>
</table>

<!-- 6) STRATEGIE-ZUSAMMENFASSUNG -->
<h2>Strategie-Zusammenfassung</h2>
<table>
  <tr>
    <th style="width:50%;">Reduktionsdauer</th>
    <td>{{reduktionsdauer_wochen}} Wochen</td>
  </tr>
  <tr>
    <th>Reduktionsziel</th>
    <td>{{reduktionsziel_prozent}} %</td>
  </tr>
  <tr>
    <th>Reduktionsgeschwindigkeit</th>
    <td>{{reduktionsgeschwindigkeit}}</td>
  </tr>
  <tr>
    <th>CBD-Dosis (Start → Ende)</th>
    <td>{{cbd_start}} → {{cbd_ende}} täglich</td>
  </tr>
  <tr>
    <th>Gesamte Lastreduktion</th>
    <td>{{gesamt_lastreduktion_prozent}} %</td>
  </tr>
</table>

<!-- 7) MEDIKATIONS-ÜBERSICHT -->
<h2 style="margin-top:20px;">Medikations-Übersicht</h2>
<table>
  <thead>
    <tr>
      <th>Medikament</th>
      <th>Start-Dosis</th>
      <th>Ziel-Dosis</th>
      <th>HWZ</th>
      <th>WD-Risiko</th>
      <th>CBD-IA Risiko</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>{{med_name}}</strong></td>
      <td>{{startdosis}}</td>
      <td>{{zieldosis}}</td>
      <td>{{halbwertszeit}}</td>
      <td>{{wd_risiko}}</td>
      <td>{{cbd_interaktion_level}}</td>
    </tr>
  </tbody>
</table>
<p style="font-size:7pt;color:#666;margin-top:8px;">
  <strong>Abkürzungen:</strong> HWZ = Halbwertszeit | WD = Withdrawal (Absetzsyndrom) | CBD-IA = CBD-Interaktionsstärke
</p>

<!-- 8) MONITORING-EMPFEHLUNGEN -->
<div class="monitoring-box">
  <h3>Monitoring-Empfehlungen</h3>
  
  <p><strong>Häufigkeit:</strong> {{monitoring_intervall_text}}</p>
  
  <p style="margin-top:12px;"><strong>Vitalparameter:</strong></p>
  <ul>
    {{#vitalparameter_liste}}
    <li>{{.}}</li>
    {{/vitalparameter_liste}}
  </ul>
  
  <p style="margin-top:12px;"><strong>Warnsymptome:</strong></p>
  <ul>
    {{#warnsymptome_liste}}
    <li>{{.}}</li>
    {{/warnsymptome_liste}}
  </ul>
  
  <p style="margin-top:12px;"><strong>Besondere Hinweise:</strong></p>
  <p>{{besondere_hinweise}}</p>
</div>

<!-- 9) REDUKTIONSPLAN-DETAILS -->
<h2>Reduktionsplan-Details (Wochenweise)</h2>
<p class="mb-4" style="font-size:9pt;color:#666;">
  Die folgende Tabelle zeigt die geplante wöchentliche Reduktion der Medikamentenlast und die parallele CBD-Steigerung.
</p>

<table>
  <thead>
    <tr>
      <th>Woche</th>
      <th class="text-right">Med-Last (mg)</th>
      <th class="text-right">CBD (mg)</th>
      <th class="text-right">CBD/kg</th>
    </tr>
  </thead>
  <tbody>
    {{#wochenplan}}
    <tr>
      <td style="font-weight:600;">{{woche}}</td>
      <td class="text-right">{{med_last_mg}}</td>
      <td class="text-right font-bold">{{cbd_mg}}</td>
      <td class="text-right">{{cbd_pro_kg}}</td>
    </tr>
    {{/wochenplan}}
  </tbody>
</table>

<!-- 10) BALKENDIAGRAMME -->
<div class="chart-section">
  <div class="chart-title">Medikamentenlast pro Woche</div>
  {{#wochenplan}}
  <div class="chart-bar">
    <div class="chart-label">Woche {{woche}}</div>
    <div class="chart-track">
      <div class="chart-fill" style="width:{{med_bar_width}}%;"></div>
    </div>
    <div class="chart-value">{{med_last_mg}}</div>
  </div>
  {{/wochenplan}}
</div>

<div class="chart-section">
  <div class="chart-title">CBD-Dosis pro Woche</div>
  {{#wochenplan}}
  <div class="chart-bar">
    <div class="chart-label">Woche {{woche}}</div>
    <div class="chart-track">
      <div class="chart-fill" style="width:{{cbd_bar_width}}%;"></div>
    </div>
    <div class="chart-value">{{cbd_mg}}</div>
  </div>
  {{/wochenplan}}
</div>

<!-- 11) METHODOLOGIE -->
<h2>Methodologie</h2>
<table>
  <tr>
    <th style="width:50%;">CBD-Dosierungsmethode</th>
    <td>{{cbd_dosierungsmethode}}</td>
  </tr>
  <tr>
    <th>Reduktionsmethode</th>
    <td>{{reduktionsmethode}}</td>
  </tr>
  <tr>
    <th>Sicherheitsregeln angewandt</th>
    <td>{{sicherheitsregeln}}</td>
  </tr>
</table>

<!-- 12) RECHTLICHE HINWEISE -->
<div class="legal-box">
  <h3 style="margin-top:0;font-size:10pt;color:#00584D;">Rechtliche Hinweise</h3>
  <p>
    Dieser Bericht dient ausschließlich der ärztlichen Information und Dokumentation. 
    Die endgültige Therapieentscheidung liegt beim behandelnden Arzt / bei der behandelnden Ärztin. 
    Der Plan basiert auf pharmakokinetischen Daten und aktuellen Erkenntnissen zum Endocannabinoid-System.
    Bei Unsicherheit, relevanten Komorbiditäten oder kritischen Wechselwirkungen ist eine engmaschige fachärztliche Begleitung erforderlich.
  </p>
  <p style="margin-top:10px;">
    <strong>Wichtig:</strong> Diese Analyse dient ausschließlich als Entscheidungsstütze und ersetzt nicht die ärztliche Beurteilung.
    Die finale Therapieverantwortung liegt beim behandelnden Arzt / bei der behandelnden Ärztin.
  </p>
</div>

<!-- FOOTER VERSION -->
<div class="footer-version">
  MEDLESS Ärztebericht v2.0 – Erstellt mit KI-gestützter Pharmakokinetik-Analyse (PlanIntelligenz 2.0)
</div>

</div>
</body>
</html>`;

// ============================================================
// DOCTOR REPORT RENDER FUNCTIONS
// ============================================================

/**
 * Renders the doctor report using the fixed template and fillTemplate function
 */
export function renderDoctorReportHtmlFixed(data: DoctorReportData): string {
  // Build template data object with all placeholders
  const firstMed = data.medicationTableRows[0] || {
    name: 'N/A',
    currentDose: 'N/A',
    targetDose: 'N/A',
    halfLife: 'N/A',
    withdrawalRisk: 'N/A',
    cbdInteraction: 'N/A',
    riskCategory: 'low'
  };

  // Calculate max med_last for bar width calculations
  const maxMedLast = Math.max(...data.reductionPlanDetails.map(w => w.totalMedicationLoad), 1);
  const maxCbd = Math.max(...data.reductionPlanDetails.map(w => w.cbdDose), 1);

  const templateData = {
    patient_name: data.patientMeta.firstName || 'N/A',
    geschlecht: data.patientMeta.gender || 'Nicht angegeben',
    alter: data.patientMeta.age || 'N/A',
    gewicht: data.patientMeta.weight || 'N/A',
    bmi: data.patientMeta.bmi || 'N/A',
    anzahl_medikamente: data.riskOverview.totalMedCount || 0,
    anzahl_sensible_medikamente: data.riskOverview.sensitiveMedCount || 0,
    
    // NEW: Safety Data Section (P0/P1)
    safety_data_html: renderSafetyDataSection(data.safetyData),
    
    wechselwirkung_level: getSeverityDisplayDE(data.riskOverview.maxSeverity).toUpperCase(),
    reduktionsgeschwindigkeit: data.strategySummary.reductionSpeedCategory.toUpperCase(),
    kategorie: (data.riskOverview.hasBenzoOrOpioid || data.riskOverview.maxWithdrawalRiskScore >= 7) ? 'ERHÖHT' : 'STANDARD',
    
    med_name: firstMed.name,
    startdosis: data.reductionPlanDetails.length > 0 ? formatMg(data.reductionPlanDetails[0].totalMedicationLoad, 'mg/Tag') : 'N/A',
    zieldosis: data.reductionPlanDetails.length > 0 ? formatMg(data.reductionPlanDetails[data.reductionPlanDetails.length - 1].totalMedicationLoad, 'mg/Tag') : 'N/A',
    halbwertszeit: firstMed.halfLife || 'N/A',
    absetzrisiko: firstMed.withdrawalRisk || 'N/A',
    med_kategorie: data.riskOverview.hasBenzoOrOpioid ? 'Benzodiazepine/Opioide' : 'Standard',
    cbd_interaktion_level: firstMed.cbdInteraction || 'N/A',
    wd_risiko: firstMed.withdrawalRisk || 'N/A',
    
    reduktionsdauer_wochen: data.strategySummary.durationWeeks || 0,
    reduktionsziel_prozent: data.strategySummary.reductionGoal || 0,
    cbd_start: formatMg(data.strategySummary.cbdStartMg || 0),
    cbd_ende: formatMg(data.strategySummary.cbdEndMg || 0),
    gesamt_lastreduktion_prozent: data.strategySummary.overallLoadReduction?.toFixed(1) || '0',
    
    monitoring_intervall_text: data.monitoringRecommendations.frequency || 'N/A',
    vitalparameter_liste: data.monitoringRecommendations.vitalSigns || [],
    warnsymptome_liste: data.monitoringRecommendations.symptoms.map(stripEmojis) || [],
    besondere_hinweise: (data.monitoringRecommendations.specialNotes || []).map(stripEmojis).join('; ') || 'Keine',
    
    wochenplan: data.reductionPlanDetails.map(week => ({
      woche: week.week,
      med_last_mg: formatMg(week.totalMedicationLoad),
      cbd_mg: formatMg(week.cbdDose),
      cbd_pro_kg: week.cannabinoidPerKg !== null ? `${week.cannabinoidPerKg.toFixed(2)} mg/kg` : 'N/A',
      notizen: stripEmojis(week.notes || '–'),
      med_bar_width: Math.round((week.totalMedicationLoad / maxMedLast) * 100),
      cbd_bar_width: Math.round((week.cbdDose / maxCbd) * 100)
    })),
    
    cbd_dosierungsmethode: data.methodologyNotes.cbdDosingMethod || 'N/A',
    reduktionsmethode: data.methodologyNotes.reductionMethod || 'N/A',
    sicherheitsregeln: data.methodologyNotes.safetyRulesApplied ? 'Ja' : 'Nein'
  };

  return fillTemplate(DOCTOR_REPORT_TEMPLATE_FIXED, templateData);
}

/**
 * Example function with embedded test data for DOCTOR_REPORT_TEMPLATE_FIXED
 */
export function renderDoctorReportExample(): string {
  const exampleData: DoctorReportData = {
    headerTitle: 'MEDLESS-Reduktionsplan – Ärztliche Dokumentation',
    patientMeta: {
      firstName: 'Maria',
      age: 62,
      gender: 'weiblich',
      weight: 68,
      height: 165,
      bmi: '24.9'
    },
    riskOverview: {
      totalMedCount: 1,
      sensitiveMedCount: 0,
      maxSeverity: 'low',
      hasBenzoOrOpioid: false
    },
    strategySummary: {
      durationWeeks: 8,
      reductionGoal: 44,
      cbdStartMg: 35.0,
      cbdEndMg: 70.0,
      reductionSpeedCategory: 'RELATIV SCHNELL',
      overallLoadReduction: 44.0
    },
    medicationTableRows: [
      {
        name: 'Celecoxib',
        currentDose: '400 mg/Tag',
        targetDose: '224 mg/Tag',
        halfLife: '11h (2d Steady-State)',
        withdrawalRisk: '4/10',
        cbdInteraction: 'Mittel',
        riskCategory: 'medium'
      }
    ],
    monitoringRecommendations: {
      frequency: 'Wöchentlich in den ersten 4 Wochen, dann alle 2 Wochen',
      vitalSigns: ['Blutdruck', 'Herzfrequenz', 'Allgemeiner Gesundheitszustand'],
      symptoms: ['Starker Schwindel oder Ohnmachtsgefühl', 'Herzrasen (Puls >120)', 'Starke Kopfschmerzen'],
      specialNotes: ['Celecoxib: Langsame Reduktion empfohlen', 'Bei Nebenwirkungen Reduktion pausieren']
    },
    reductionPlanDetails: [
      { week: 1, totalMedicationLoad: 400.0, cbdDose: 35.0, cannabinoidPerKg: 0.51, notes: 'Start der Reduktion' },
      { week: 2, totalMedicationLoad: 378.0, cbdDose: 52.5, cannabinoidPerKg: 0.77, notes: 'Produktwechsel zu MEDLESS Nr. 25' },
      { week: 3, totalMedicationLoad: 356.0, cbdDose: 52.5, cannabinoidPerKg: 0.77, notes: '' },
      { week: 4, totalMedicationLoad: 334.0, cbdDose: 52.5, cannabinoidPerKg: 0.77, notes: '' },
      { week: 5, totalMedicationLoad: 312.0, cbdDose: 70.0, cannabinoidPerKg: 1.03, notes: '' },
      { week: 6, totalMedicationLoad: 290.0, cbdDose: 70.0, cannabinoidPerKg: 1.03, notes: '' },
      { week: 7, totalMedicationLoad: 268.0, cbdDose: 70.0, cannabinoidPerKg: 1.03, notes: '' },
      { week: 8, totalMedicationLoad: 246.0, cbdDose: 70.0, cannabinoidPerKg: 1.03, notes: 'Ziel erreicht' }
    ],
    methodologyNotes: {
      cbdDosingMethod: '0.5-1.5 mg/kg basierend auf Interaktionsstärke',
      reductionMethod: 'Lineare Reduktion mit Halbwertszeitanpassung',
      safetyRulesApplied: true,
      adjustmentsApplied: ['Halbwertszeitanpassung', 'Interaktionsstärkenanpassung']
    },
    legalNotes: [
      'Dieser Bericht dient der ärztlichen Dokumentation',
      'Die finale Therapieentscheidung liegt beim behandelnden Arzt'
    ],
    versionNote: 'MEDLESS Plan v2.0 – Erstellt mit KI-gestützter Analyse'
  };

  return renderDoctorReportHtmlFixed(exampleData);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getSeverityDisplayDE(severity: string | null): string {
  switch (severity) {
    case 'critical': return 'Kritisch';
    case 'high': return 'Hoch';
    case 'medium': return 'Mittel';
    case 'low': return 'Niedrig';
    default: return 'Unbekannt';
  }
}

function stripEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '').trim();
}

function renderLegalNotes(legalNotes?: string | string[]): string {
  if (Array.isArray(legalNotes)) {
    if (legalNotes.length === 0) {
      return '<p>Dieser Bericht ersetzt nicht die ärztliche Beurteilung.</p>';
    }
    return `
      <ul style="padding-left: 20px; margin-top: 8px;">
        ${legalNotes.map(note => `<li style="margin-bottom: 6px;">${note}</li>`).join('')}
      </ul>
    `;
  }
  
  if (typeof legalNotes === 'string' && legalNotes.trim().length > 0) {
    return `<p style="margin-top: 8px;">${legalNotes}</p>`;
  }
  
  return '<p style="margin-top: 8px;">Dieser Bericht dient der ärztlichen Dokumentation.</p>';
}

// ============================================================
// PATIENT REPORT HTML RENDERER (LEGACY)
// ============================================================
// ⚠️ ACHTUNG: Diese Funktion ist veraltet!
// 
// LEGACY: Alte Patientenbericht-Funktion aus report_templates.ts
// Wird NUR für Rückwärtskompatibilität behalten.
// 
// FÜR NEUEN CODE BITTE VERWENDEN:
// - import { renderPatientReportHtmlFixed } from './report_templates_patient'
// 
// Diese Legacy-Version wird in zukünftigen Updates entfernt.
// ============================================================

/**
 * @deprecated Verwende stattdessen renderPatientReportHtmlFixed aus report_templates_patient.ts
 */
export function renderPatientReportHtml(data: PatientReportData): string {
  const sharedCSS = `
    <style>
      @page {
        size: A4;
        margin: 22mm 20mm;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 10.5pt;
        line-height: 1.6;
        color: #1F2937;
        background: white;
        margin: 22mm 20mm;
      }
      
      .container {
        max-width: 750px;
        margin: 0 auto;
      }
      
      h1 {
        font-size: 26pt;
        color: #1B4B50;
        margin-bottom: 6px;
        font-weight: 700;
        letter-spacing: -0.02em;
        border-bottom: 3px solid #1B4B50;
        padding-bottom: 10px;
      }
      
      h2 {
        font-size: 16pt;
        color: #1B4B50;
        margin-top: 28px;
        margin-bottom: 14px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      
      h3 {
        font-size: 13pt;
        color: #1B4B50;
        margin-top: 16px;
        margin-bottom: 10px;
        font-weight: 600;
      }
      
      .subtitle {
        font-size: 10.5pt;
        color: #6B7280;
        margin-bottom: 20px;
        font-weight: 400;
      }
      
      .section-divider {
        border-top: 1px solid #D1D5DB;
        margin: 24px 0;
      }
      
      p {
        margin-bottom: 14px;
        line-height: 1.7;
        color: #374151;
      }
      
      ul, ol {
        margin-left: 22px;
        margin-bottom: 16px;
      }
      
      li {
        margin-bottom: 10px;
        line-height: 1.6;
        color: #374151;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 18px 0;
        font-size: 9.5pt;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      
      th {
        background: #F0F4F5;
        color: #1B4B50;
        font-weight: 600;
        padding: 10px 12px;
        text-align: left;
        border: 1px solid #D1D5DB;
        text-transform: uppercase;
        font-size: 8.5pt;
        letter-spacing: 0.03em;
      }
      
      td {
        padding: 10px 12px;
        border: 1px solid #E5E7EB;
        color: #374151;
      }
      
      tr:nth-child(even) {
        background: #F9FAFB;
      }
      
      tr:hover {
        background: #F3F4F6;
      }
      
      .weekly-plan-table thead th {
        background: #1B4B50;
        color: white;
        font-weight: 600;
        padding: 12px 14px;
        text-align: left;
        border: none;
        text-transform: uppercase;
        font-size: 8.5pt;
        letter-spacing: 0.05em;
      }
      
      .weekly-plan-table tbody td {
        padding: 14px;
        border: 1px solid #E5E7EB;
        vertical-align: top;
      }
      
      .weekly-plan-table tbody tr {
        transition: all 0.2s ease;
      }
      
      .weekly-plan-table tbody tr:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(27, 75, 80, 0.1);
      }
      
      .warning-box {
        background: #FFFBEB;
        border-left: 4px solid #F59E0B;
        padding: 16px;
        margin: 24px 0;
        border-radius: 2px;
      }
      
      .warning-box h3 {
        color: #B45309;
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 12pt;
      }
      
      .critical-warning-box {
        background: #FFF5F5;
        border: 3px solid #F97316;
        padding: 20px;
        margin: 28px 0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
      }
      
      .critical-warning-box .warning-header {
        display: flex;
        align-items: center;
        margin-bottom: 14px;
        padding-bottom: 12px;
        border-bottom: 2px solid #FED7AA;
      }
      
      .critical-warning-box .alert-icon {
        font-size: 24pt;
        margin-right: 12px;
        animation: pulse 2s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.1); }
      }
      
      .critical-warning-box h3 {
        color: #DC2626;
        margin: 0;
        font-size: 13pt;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      
      .critical-warning-box p {
        color: #7C2D12;
        line-height: 1.7;
      }
      
      .critical-symptoms-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .critical-symptoms-list li {
        display: flex;
        align-items: flex-start;
        padding: 10px 14px;
        margin-bottom: 8px;
        background: white;
        border-left: 3px solid #F97316;
        border-radius: 4px;
        font-weight: 500;
        color: #1F2937;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      
      .critical-symptoms-list .symptom-icon {
        font-size: 14pt;
        margin-right: 10px;
        flex-shrink: 0;
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
      }
      
      .emergency-note strong {
        color: #DC2626;
        font-size: 11pt;
      }
      
      .monitoring-box {
        background: #F0F9F9;
        border-left: 4px solid #1B4B50;
        padding: 16px;
        margin: 24px 0;
        border-radius: 2px;
      }
      
      .monitoring-box h3 {
        color: #1B4B50;
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 12pt;
      }
      
      .positive-box {
        background: #F0FDF4;
        border-left: 4px solid #10B981;
        padding: 16px;
        margin: 24px 0;
        border-radius: 2px;
      }
      
      .positive-box h3 {
        color: #047857;
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 12pt;
      }
      
      .cost-note {
        background: #FEFCE8;
        border: 1px solid #E5E7EB;
        padding: 14px;
        margin: 20px 0;
        font-size: 9pt;
        border-radius: 2px;
      }
      
      .footer {
        margin-top: 36px;
        padding-top: 18px;
        border-top: 1px solid #D1D5DB;
        font-size: 8pt;
        color: #6B7280;
      }
      
      .risk-critical {
        color: #DC2626;
        font-weight: 600;
      }
      
      .risk-high {
        color: #EA580C;
        font-weight: 600;
      }
      
      .risk-medium {
        color: #CA8A04;
        font-weight: 500;
      }
      
      .risk-low {
        color: #059669;
        font-weight: 500;
      }
      
      .patient-info-bar {
        background: #F3F4F6;
        border-radius: 8px;
        padding: 16px 20px;
        margin: 20px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid #D1D5DB;
      }
      
      .patient-info-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
      }
      
      .patient-info-label {
        font-size: 8pt;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }
      
      .patient-info-value {
        font-size: 13pt;
        font-weight: 700;
        color: #1B4B50;
      }
      
      .cost-summary-box {
        background: #FEFCE8;
        border: 2px solid #EAB308;
        border-radius: 8px;
        padding: 20px;
        margin: 24px 0;
        text-align: center;
      }
      
      .total-cost {
        font-size: 28pt;
        font-weight: 700;
        color: #1B4B50;
        margin-bottom: 8px;
      }
      
      .cost-label {
        font-size: 11pt;
        color: #6B7280;
        margin-bottom: 16px;
        font-weight: 500;
      }
      
      .product-breakdown {
        font-size: 9pt;
        color: #4B5563;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #E5E7EB;
      }
      
      .legal-disclaimer {
        font-size: 7.5pt;
        color: #9CA3AF;
        line-height: 1.5;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #E5E7EB;
        text-align: left;
      }
      
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    </style>
  `;

  let html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.headerTitle}</title>
  ${sharedCSS}
</head>
<body>
<div class="container">

<h1>${data.headerTitle}</h1>
<p class="subtitle">Ihr persönlicher Reduktionsplan mit CBD-Begleitung</p>

<div class="patient-info-bar">
  <div class="patient-info-item">
    <div class="patient-info-label">Name</div>
    <div class="patient-info-value">${data.patientFacts.firstName}</div>
  </div>
  <div class="patient-info-item">
    <div class="patient-info-label">Alter</div>
    <div class="patient-info-value">${data.patientFacts.age}</div>
  </div>
  <div class="patient-info-item">
    <div class="patient-info-label">Gewicht</div>
    <div class="patient-info-value">${data.patientFacts.weight}</div>
  </div>
  <div class="patient-info-item">
    <div class="patient-info-label">BMI</div>
    <div class="patient-info-value">${data.patientFacts.bmi}</div>
  </div>
  <div class="patient-info-item">
    <div class="patient-info-label">Medikamente</div>
    <div class="patient-info-value">${data.patientFacts.medicationCount}</div>
  </div>
</div>

<div class="section-divider"></div>

${data.patientFacts.hasBenzoOrOpioid ? `
<div class="warning-box">
  <h3>Besondere Vorsicht erforderlich</h3>
  <p>Sie nehmen Benzodiazepine oder Opioide ein. Diese Medikamente erfordern besonders vorsichtige und langsame Reduktion unter engmaschiger ärztlicher Kontrolle.</p>
</div>
` : ''}

<h2>Zusammenfassung Ihres Plans</h2>
<p>${data.shortSummary}</p>

${data.positiveEffectsExamples.length > 0 ? `
<div class="positive-box">
  <h3>Mögliche positive Effekte</h3>
  <ul>
    ${data.positiveEffectsExamples.map(effect => `<li>${effect}</li>`).join('')}
  </ul>
</div>
` : ''}

<div class="section-divider"></div>

<h2>Ihr Wochenplan</h2>
${data.weeklyPlan.length > 0 ? `
<table class="weekly-plan-table">
  <thead>
    <tr>
      <th style="width: 10%;">Woche</th>
      <th style="width: 20%;">CBD-Dosis (Täglich)</th>
      <th style="width: 30%;">Einnahme-Schema</th>
      <th style="width: 40%;">Medikamenten-Anpassung</th>
    </tr>
  </thead>
  <tbody>
    ${data.weeklyPlan.map((week, index) => `
    <tr style="background: ${index % 2 === 0 ? '#F9FAFB' : '#F0F9F9'};">
      <td style="font-weight: 600; text-align: center; color: #1B4B50;">
        ${week.week}
      </td>
      <td style="font-weight: 700; color: #1B4B50; font-size: 11pt;">
        ${week.cbdDoseDisplay}
      </td>
      <td>
        <div style="margin-bottom: 4px; font-weight: 500;">${week.productName}</div>
        <div style="font-size: 8.5pt; color: #6B7280;">${week.spraySchedule}</div>
      </td>
      <td style="font-size: 9pt; color: #374151; line-height: 1.5;">
        ${week.medicationsDisplay}
      </td>
    </tr>
    `).join('')}
  </tbody>
</table>
` : '<p>Kein Wochenplan verfügbar.</p>'}

${data.warningSymptoms.length > 0 ? `
<div class="critical-warning-box">
  <div class="warning-header">
    <span class="alert-icon">⚠️</span>
    <h3>Auf diese Symptome achten – Sofort Arzt kontaktieren!</h3>
  </div>
  <p style="margin-bottom: 16px; font-weight: 500;">Bei folgenden Warnzeichen sollten Sie <strong>umgehend</strong> ärztliche Hilfe in Anspruch nehmen:</p>
  <ul class="critical-symptoms-list">
    ${data.warningSymptoms.map(symptom => {
      if (symptom.toLowerCase().includes('schwindel')) {
        return `<li><span class="symptom-icon">⚠️</span>${symptom}</li>`;
      } else if (symptom.toLowerCase().includes('herzrasen') || symptom.toLowerCase().includes('herzrhythmus')) {
        return `<li><span class="symptom-icon">❗</span>${symptom}</li>`;
      } else if (symptom.toLowerCase().includes('kopfschmerzen') || symptom.toLowerCase().includes('verwirrung')) {
        return `<li><span class="symptom-icon">⚠️</span>${symptom}</li>`;
      } else if (symptom.toLowerCase().includes('fieber')) {
        return `<li><span class="symptom-icon">🌡️</span>${symptom}</li>`;
      } else {
        return `<li><span class="symptom-icon">•</span>${symptom}</li>`;
      }
    }).join('')}
  </ul>
  <div class="emergency-note">
    <strong>Bei lebensbedrohlichen Notfällen:</strong> Wählen Sie sofort den Notruf <strong>112</strong>
  </div>
</div>
` : ''}

<div class="monitoring-box">
  <h3>Regelmäßige ärztliche Kontrollen</h3>
  <p><strong>Häufigkeit:</strong> ${data.checkupInfo.frequency}</p>
  ${data.checkupInfo.parameters.length > 0 ? `
  <p><strong>Zu überwachen:</strong></p>
  <ul>
    ${data.checkupInfo.parameters.map(param => `<li>${param}</li>`).join('')}
  </ul>
  ` : ''}
</div>

<div class="section-divider"></div>

<div class="section-divider"></div>
<h2>MEDLESS Produkte & Kosten</h2>

<div class="cost-summary-box">
  <div class="total-cost">${data.medlessProductNotes.totalCost.toFixed(2)} €</div>
  <div class="cost-label">Gesamtkosten für ${data.medlessProductNotes.durationWeeks} Wochen</div>
  
  <div class="product-breakdown">
    <strong>Benötigte Produkte:</strong><br>
    ${data.medlessProductNotes.costBreakdown}
  </div>
</div>

<p style="font-size: 9pt; color: #6B7280; line-height: 1.6; margin-top: 16px;">
  Dies sind die Kosten für die MEDLESS CBD-Dosier-Sprays. Die Kosten für Ihre ärztlich verordneten Medikamente sind hier nicht enthalten und werden wie gewohnt über Ihren Arzt, Ihre Apotheke oder Ihre Krankenkasse abgerechnet.
</p>

<div class="legal-disclaimer">
  <strong>Rechtlicher Hinweis:</strong> ${data.footerDisclaimer}
  <br><br>
  ${data.versionNote}
</div>

</div>
</body>
</html>`;

  return html;
}

// LEGACY FUNCTION (kept for backward compatibility)
export function renderDoctorReportHtml(data: DoctorReportData): string {
  return renderDoctorReportHtmlFixed(data);
}
