// ============================================================
// DOCTOR REPORT V3 – 3-LEVEL STRUCTURE FOR PHYSICIANS
// ============================================================
// Level 1: Overview (Summary table + Global risk)
// Level 2: Per-Medication Short Profile (compact blocks)
// Level 3: Detail Appendix (CYP tables, full safety notes, model info)
// ============================================================

import type { DoctorReportDataV3 } from './report_data_v3'
import { MEDLESS_LOGO_BASE64 } from './logo_base64'
import {
  formatMgValue,
  formatMgPerKg,
  calculateReductionPercentage,
  renderCBDMethodologyText,
  renderReductionSummaryText,
  buildCBDDoseInfo,
  buildReductionSummary,
  deduplicateSafetyWarnings,
  renderMedicationSafetyWarnings,
  type CBDDoseInfo,
  type ReductionSummary
} from './utils/report_formatting'

/**
 * Render example Doctor Report V3 for testing
 */
export async function renderDoctorReportV3Example(): Promise<string> {
  const { getDoctorReportV3Example } = await import('./report_data_v3');
  const exampleData = getDoctorReportV3Example();
  return renderDoctorReportHtmlV3(exampleData);
}

/**
 * Main template function for Doctor Report V3
 */
export function renderDoctorReportHtmlV3(data: DoctorReportDataV3): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MEDLESS Ärztebericht – ${data.patientName}</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
<div class="container">

${renderHeader(data)}

${renderLevel1Overview(data)}

<div class="page-break"></div>

${renderLevel2MedicationProfiles(data)}

<div class="page-break"></div>

${renderLevel3Appendix(data)}

${renderFooter(data)}

</div>
</body>
</html>
`;
}

// ============================================================
// STYLES
// ============================================================

function getStyles(): string {
  return `
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }
    
    .container {
      width: 100%;
      max-width: 100%;
    }
    
    /* Header */
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8mm;
      padding-bottom: 4mm;
      border-bottom: 2px solid #00C39A;
    }
    
    .report-logo {
      width: 120px;
      height: auto;
    }
    
    .report-title {
      text-align: right;
      flex: 1;
      padding-left: 20px;
    }
    
    .report-title h1 {
      font-size: 14pt;
      font-weight: 700;
      color: #00584D;
      margin-bottom: 2px;
    }
    
    .report-title .subtitle {
      font-size: 9pt;
      color: #6b7280;
    }
    
    /* Typography */
    h1 {
      font-size: 16pt;
      font-weight: 700;
      color: #111827;
      margin: 12px 0 8px 0;
    }
    
    h2 {
      font-size: 13pt;
      font-weight: 600;
      color: #1f2937;
      margin: 16px 0 8px 0;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    
    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #374151;
      margin: 10px 0 6px 0;
    }
    
    p {
      margin: 6px 0;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    }
    
    th {
      background: #f3f4f6;
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #d1d5db;
    }
    
    td {
      padding: 6px;
      border: 1px solid #e5e7eb;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    /* Risk badges */
    .risk-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .risk-critical {
      background: #FEE2E2;
      color: #991B1B;
    }
    
    .risk-high {
      background: #FED7AA;
      color: #9A3412;
    }
    
    .risk-medium {
      background: #FEF3C7;
      color: #92400E;
    }
    
    .risk-low {
      background: #D1FAE5;
      color: #065F46;
    }
    
    /* Boxes */
    .info-box {
      background: #F0F9FF;
      border-left: 3px solid #0284C7;
      padding: 10px 12px;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    .warning-box {
      background: #FEF3C7;
      border-left: 3px solid #F59E0B;
      padding: 10px 12px;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    .critical-box {
      background: #FEE2E2;
      border-left: 3px solid #DC2626;
      padding: 10px 12px;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    /* Med Profile Box */
    .med-profile {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    
    .med-profile-header {
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    
    .med-profile-title {
      font-size: 12pt;
      font-weight: 700;
      color: #111827;
    }
    
    .med-profile-subtitle {
      font-size: 9pt;
      color: #6b7280;
    }
    
    .med-profile-row {
      display: flex;
      margin: 4px 0;
      font-size: 9pt;
    }
    
    .med-profile-label {
      font-weight: 600;
      min-width: 140px;
      color: #4b5563;
    }
    
    .med-profile-value {
      color: #1f2937;
    }
    
    /* Page breaks */
    .page-break {
      page-break-after: always;
    }
    
    /* Footer */
    .report-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      color: #6b7280;
    }
    
    /* Lists */
    ul {
      margin: 6px 0 6px 20px;
    }
    
    li {
      margin: 3px 0;
    }
  `;
}

// ============================================================
// HEADER
// ============================================================

function renderHeader(data: DoctorReportDataV3): string {
  return `
    <div class="report-header">
      <div class="report-logo">
        <img src="${MEDLESS_LOGO_BASE64}" alt="MEDLESS Logo" style="width: 120px; height: auto;">
      </div>
      <div class="report-title">
        <h1>MEDLESS Ärztebericht</h1>
        <div class="subtitle">Pharmakokinetische Analyse & Reduktionsplanung</div>
        <div class="subtitle" style="margin-top: 4px;">Patient: ${data.patientName} | ${new Date().toLocaleDateString('de-DE')}</div>
      </div>
    </div>
    
    ${renderLegalDisclaimer()}
  `;
}

// ============================================================
// LEGAL DISCLAIMER
// ============================================================

function renderLegalDisclaimer(): string {
  return `
    <div style="
      background: #f3f4f6; 
      border-left: 4px solid #9ca3af; 
      padding: 12px 16px; 
      margin: 12px 0 16px 0;
      font-size: 9pt;
      line-height: 1.4;
      color: #374151;
    ">
      <strong style="color: #1f2937;">⚠️ ÄRZTLICHE VERANTWORTUNG:</strong><br>
      Dieses Dokument ist eine <strong>computergestützte Planungshilfe</strong> und ersetzt <strong>keine medizinische Diagnose oder Therapieentscheidung</strong>. 
      Die finale Verantwortung für Dosierung, Monitoring und Anpassung der Medikation liegt <strong>vollständig bei der behandelnden Ärztin / dem behandelnden Arzt</strong>. 
      Individuelle Faktoren (z.&nbsp;B. Organfunktion, Komorbiditäten, weitere Medikamente) müssen immer zusätzlich berücksichtigt werden.
    </div>
    
    <div style="
      background: #EFF6FF; 
      border-left: 4px solid #0284C7; 
      padding: 12px 16px; 
      margin: 12px 0 16px 0;
      font-size: 9pt;
      line-height: 1.4;
      color: #1e40af;
    ">
      <strong style="color: #1e3a8a;">💡 MEDLESS IST EIN OBERGRENZEN-TOOL:</strong><br>
      Die berechneten Dosisreduktionen stellen <strong>konservative Obergrenzen</strong> dar. 
      Die tatsächliche Reduktion sollte durch die behandelnde Ärztin / den behandelnden Arzt <strong>individuell festgelegt</strong> werden.
    </div>
  `;
}

// ============================================================
// LEVEL 1: OVERVIEW (PAGE 1)
// ============================================================

function renderLevel1Overview(data: DoctorReportDataV3): string {
  return `
    <h1>📋 Übersicht – MEDLESS-Reduktionsplan</h1>
    
    <div class="info-box">
      <strong>Patient:</strong> ${data.patientName} | 
      <strong>Alter:</strong> ${data.patientAge} Jahre | 
      <strong>Gewicht:</strong> ${data.patientWeight} kg | 
      <strong>Reduktionsdauer:</strong> ${data.durationWeeks} Wochen
    </div>
    
    ${((data.liverFunction && data.liverFunction !== 'normal') || (data.kidneyFunction && data.kidneyFunction !== 'normal')) ? `
    <div class="warning-box" style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 16px 0;">
      <strong style="color: #92400E; font-size: 11pt;">🩺 Organfunktion – Ärztliche Hinweise</strong>
      
      <div style="margin: 12px 0;">
        <p style="margin: 0 0 8px 0; font-size: 9pt; color: #92400E; font-style: italic;">
          Hinweis: Die folgenden Parameter beeinflussen nicht die algorithmische Reduktionsberechnung. 
          Sie dienen als Orientierung für ärztliche Entscheidungen zu Monitoring und Dosisanpassungen.
        </p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
        <thead>
          <tr style="background-color: #FDE68A; border-bottom: 2px solid #F59E0B;">
            <th style="padding: 6px; text-align: left; font-size: 9pt; color: #92400E;">Organ</th>
            <th style="padding: 6px; text-align: left; font-size: 9pt; color: #92400E;">Status</th>
            <th style="padding: 6px; text-align: left; font-size: 9pt; color: #92400E;">Klinische Empfehlung</th>
          </tr>
        </thead>
        <tbody>
          ${data.liverFunction && data.liverFunction !== 'normal' ? `
          <tr style="border-bottom: 1px solid #FDE68A;">
            <td style="padding: 6px; font-size: 9pt; color: #92400E;"><strong>Leber</strong></td>
            <td style="padding: 6px; font-size: 9pt; color: #92400E;">
              ${data.liverFunction === 'schwer_eingeschränkt' ? '<strong>Schwer eingeschränkt</strong>' : 'Eingeschränkt'}
            </td>
            <td style="padding: 6px; font-size: 9pt; color: #92400E;">
              ${data.liverFunction === 'schwer_eingeschränkt' 
                ? '<strong>Besondere Vorsicht:</strong> Klinische Überwachung und Prüfung medikationsbezogener Dosisanpassungen angeraten. Vorsicht bei hepatisch metabolisierten Wirkstoffen (CYP450-Substrate).' 
                : 'Konservatives Vorgehen erwägen. Engmaschige Kontrolle der Leberwerte. Vorsicht bei CYP450-Substraten.'}
            </td>
          </tr>
          ` : ''}
          ${data.kidneyFunction && data.kidneyFunction !== 'normal' ? `
          <tr style="border-bottom: 1px solid #FDE68A;">
            <td style="padding: 6px; font-size: 9pt; color: #92400E;"><strong>Niere</strong></td>
            <td style="padding: 6px; font-size: 9pt; color: #92400E;">
              ${data.kidneyFunction === 'schwer_eingeschränkt' ? '<strong>Schwer eingeschränkt</strong>' : 'Eingeschränkt'}
            </td>
            <td style="padding: 6px; font-size: 9pt; color: #92400E;">
              ${data.kidneyFunction === 'schwer_eingeschränkt' 
                ? '<strong>Besondere Vorsicht:</strong> Klinische Überwachung und Prüfung medikationsbezogener Dosisanpassungen angeraten. Vorsicht bei renal eliminierten Wirkstoffen.' 
                : 'Konservatives Vorgehen erwägen. Engmaschige Kontrolle der Nierenfunktion. Vorsicht bei renal eliminierten Wirkstoffen.'}
            </td>
          </tr>
          ` : ''}
        </tbody>
      </table>
      
      <div style="margin: 12px 0 0 0; padding: 8px; background-color: #FFFBEB; border-radius: 4px;">
        <strong style="color: #92400E; font-size: 9pt;">Monitoring-Checkliste bei eingeschränkter Organfunktion:</strong>
        <ul style="margin: 6px 0 0 20px; color: #92400E; font-size: 9pt; line-height: 1.4;">
          <li>Organparameter im Verlauf kontrollieren (Labor: Leberwerte, Kreatinin, GFR)</li>
          <li>Sedierung/Überdosierungszeichen beachten (bei relevanten Substanzen wie Benzodiazepinen, Opioiden)</li>
          <li>Bei Unsicherheiten substanzspezifische Dosisanpassungsregeln prüfen (z.B. Fachinformation, DOSING-Datenbank)</li>
          <li>Reduktionsgeschwindigkeit ggf. individuell anpassen (konservativeres Vorgehen erwägen)</li>
          <li>Engmaschige klinische Nachkontrollen einplanen</li>
        </ul>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: 8pt; color: #92400E; font-style: italic;">
        <strong>Rechtlicher Hinweis:</strong> MEDLESS liefert einen Orientierungsplan. 
        Die finale Entscheidung über Dosisanpassungen und Reduktionsgeschwindigkeit liegt beim behandelnden Arzt. 
        Dies sind Empfehlungen, keine verbindlichen Anweisungen.
      </p>
    </div>
    ` : ''}
    
    ${renderCBDAndReductionSummary(data)}

    ${renderOverviewTable(data.overviewMedications)}
    
    ${renderGlobalRiskBox(data.globalRisk)}
    
    ${renderHighRiskSubstanceClassesWarning()}
    
    ${renderPharmacokineticsVsPharmacodynamicsNote()}
    
    ${renderTaperTailWarning()}
    
    ${renderMonitoringRecommendations(data)}
  `;
}

/**
 * MEGAPROMPT REGEL 1-3: CBD & Reduction Summary (Consistent Values)
 */
function renderCBDAndReductionSummary(data: DoctorReportDataV3): string {
  const cbd = data.cbdProgression;
  const reduction = data.reductionSummary;
  
  return `
    <h2>Zusammenfassung</h2>
    
    <div style="background: #F0FDFA; border-left: 4px solid #00C39A; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">
      <h3 style="color: #00584D; margin-bottom: 8px;">CBD-Dosis (Start → Ende)</h3>
      <p style="font-size: 10pt; margin: 4px 0;">
        <strong>Start:</strong> ${formatMgValue(cbd.startMg)} (entspricht ${formatMgPerKg(cbd.startMg, data.patientWeight)})<br>
        <strong>Ende:</strong> ${formatMgValue(cbd.endMg)} (entspricht ${formatMgPerKg(cbd.endMg, data.patientWeight)})<br>
        <strong>Wöchentliche Steigerung:</strong> ${formatMgValue(cbd.weeklyIncrease)}
      </p>
    </div>
    
    ${reduction ? `
      <div style="background: #EFF6FF; border-left: 4px solid #0284C7; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">
        <h3 style="color: #1e40af; margin-bottom: 8px;">Reduktionsziel</h3>
        <p style="font-size: 10pt; margin: 4px 0;">
          <strong>Theoretisches Reduktionsziel:</strong> ${reduction.theoreticalTargetPercent}%
        </p>
        <p style="font-size: 10pt; margin: 4px 0;">
          <strong>Tatsächliche Reduktion:</strong> ${Math.round(reduction.actualReductionPercent)}%
        </p>
        <p style="font-size: 9pt; color: #6b7280; margin-top: 6px; font-style: italic;">
          Aufgrund pharmakologischer Sicherheitsfaktoren (Halbwertszeit, CYP450-Interaktionen, Entzugsrisiko, Multi-Drug-Interaktionen) wurde eine konservative Reduktion umgesetzt.
        </p>
        
        <h4 style="font-size: 10pt; margin-top: 10px; color: #374151;">Medikamentenspezifische Reduktionen:</h4>
        <ul style="margin: 6px 0 0 20px; font-size: 9pt; line-height: 1.6;">
          ${reduction.medications.map(med => `
            <li><strong>${med.name}:</strong> ${formatMgValue(med.startMg)} → ${formatMgValue(med.endMg)} (${med.reductionPercent}%)</li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">
      <h3 style="color: #92400E; margin-bottom: 8px;">MEDLESS-Empfehlung</h3>
      <p style="font-size: 9pt; line-height: 1.6;">
        Die berechneten Werte stellen <strong>konservative Obergrenzen</strong> dar. Die tatsächliche Dosisanpassung sollte 
        durch die behandelnde Ärztin / den behandelnden Arzt <strong>individuell festgelegt</strong> werden, basierend auf 
        klinischer Beobachtung, Patientenreaktion und Laborwerten.
      </p>
    </div>
  `;
}

function renderOverviewTable(medications: DoctorReportDataV3['overviewMedications']): string {
  if (!medications || medications.length === 0) {
    return '<p>Keine Medikamente vorhanden.</p>';
  }
  
  return `
    <h2>Medikamenten-Übersicht</h2>
    <table>
      <thead>
        <tr>
          <th>Medikament</th>
          <th>Gruppe / Kategorie</th>
          <th>Start → Ziel</th>
          <th>Risiko-Level</th>
          <th>Kurz-Kommentar</th>
        </tr>
      </thead>
      <tbody>
        ${medications.map(med => `
          <tr>
            <td><strong>${med.name}</strong><br><span style="font-size: 8pt; color: #6b7280;">${med.genericName || '—'}</span></td>
            <td>${med.category || '—'}</td>
            <td>${med.startDose} → ${med.targetDose}</td>
            <td>${renderRiskBadge(med.riskLevel)}</td>
            <td style="font-size: 8.5pt;">${med.comment || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderRiskBadge(level: string): string {
  const classes: Record<string, string> = {
    'critical': 'risk-critical',
    'high': 'risk-high',
    'medium': 'risk-medium',
    'low': 'risk-low'
  };
  const className = classes[level] || 'risk-medium';
  return `<span class="risk-badge ${className}">${level}</span>`;
}

function renderGlobalRiskBox(globalRisk: DoctorReportDataV3['globalRisk']): string {
  if (!globalRisk) return '';
  
  const mdi = globalRisk.multiDrugInteraction;
  const boxClass = mdi.level === 'severe' ? 'critical-box' : mdi.level === 'moderate' ? 'warning-box' : 'info-box';
  
  return `
    <h2>🔬 Gesamt-Risiko / Multi-Drug-Interaktion</h2>
    <div class="${boxClass}">
      <p><strong>MDI-Level:</strong> ${mdi.level.toUpperCase()} (Anpassungsfaktor: ${(mdi.adjustmentFactor * 100).toFixed(0)}%)</p>
      <p><strong>Inhibitoren (langsamer):</strong> ${mdi.inhibitorsCount} Medikamente</p>
      <p><strong>Induktoren (schneller):</strong> ${mdi.inducersCount} Medikamente</p>
      ${mdi.warning ? `<p style="margin-top: 8px; font-weight: 600;">⚠️ ${mdi.warning}</p>` : ''}
    </div>
    
    ${globalRisk.additionalHints ? `
      <div class="info-box" style="margin-top: 8px;">
        <p><strong>Zusätzliche Hinweise:</strong></p>
        <p style="font-size: 9pt;">${globalRisk.additionalHints}</p>
      </div>
    ` : ''}
  `;
}

// ============================================================
// NEW V1 GO-LIVE WARNINGS (STEP 7/7)
// ============================================================

/**
 * 1. Taper-Tail Warning (always shown)
 */
function renderTaperTailWarning(): string {
  return `
    <div class="warning-box" style="margin-top: 16px;">
      <p style="font-weight: 700; color: #92400E; margin-bottom: 6px;">⚠️ TAPER-TAIL-WARNUNG (Letzte 25–30% der Reduktion):</p>
      <p style="font-size: 9pt; line-height: 1.5;">
        Die <strong>letzten 25–30% der Dosisreduktion</strong> sollten in der Praxis häufig <strong>deutlich langsamer</strong> erfolgen als im Plan dargestellt. 
        Besonders bei <strong>Benzodiazepinen, Antipsychotika und Opioiden</strong> sollte die Endphase der Reduktion ärztlich individuell über mindestens <strong>4–8 zusätzliche Wochen verlängert</strong> werden.
      </p>
    </div>
  `;
}

/**
 * 2. Two-Percent Floor Warning (conditional - shown per medication)
 */
function renderTwoPercentFloorWarning(): string {
  return `
    <div class="warning-box" style="margin-top: 8px;">
      <p style="font-weight: 700; color: #92400E; margin-bottom: 4px;">⚠️ SICHERHEITSHINWEIS – 2%-UNTERGRENZE ANGEWENDET:</p>
      <p style="font-size: 8.5pt; line-height: 1.5;">
        Die berechnete Reduktionsgeschwindigkeit wurde automatisch auf <strong>mindestens 2% pro Woche</strong> begrenzt. 
        Dies weist auf eine <strong>Hochrisiko-Konstellation</strong> hin (z.B. sehr lange Halbwertszeit, starke Interaktionen oder Polypharmazie). 
        Eine <strong>enge ärztliche Überwachung</strong> wird empfohlen.
      </p>
    </div>
  `;
}

/**
 * 3. High-Risk Substance Classes Warning (always shown)
 */
function renderHighRiskSubstanceClassesWarning(): string {
  return `
    <div class="critical-box" style="margin-top: 16px;">
      <p style="font-weight: 700; color: #7F1D1D; margin-bottom: 8px;">⚠️ BESONDERS VORSICHTIG ANWENDEN BEI:</p>
      <ul style="margin-left: 18px; font-size: 9pt; line-height: 1.6;">
        <li><strong>Benzodiazepinen</strong> (Entzugsrisiko, Rebound-Angst, Krampfanfälle)</li>
        <li><strong>Antipsychotika</strong> (Rebound-Psychose, Dopamin-Hypersensitivität)</li>
        <li><strong>Opioiden</strong> (physisches Entzugssyndrom)</li>
        <li><strong>Antikonvulsiva</strong> (Breakthrough-Seizures)</li>
        <li><strong>Medikamenten mit engem therapeutischem Fenster</strong> (z.B. Digoxin, Lithium, Warfarin, Phenytoin)</li>
      </ul>
    </div>
  `;
}

/**
 * 4. Pharmacokinetics vs Pharmacodynamics Note (always shown)
 */
function renderPharmacokineticsVsPharmacodynamicsNote(): string {
  return `
    <div class="info-box" style="margin-top: 16px;">
      <p style="font-weight: 700; color: #1e40af; margin-bottom: 6px;">🔬 WICHTIGER HINWEIS: PHARMAKOKINETIK VS. PHARMAKODYNAMIK</p>
      <p style="font-size: 9pt; line-height: 1.5;">
        MEDLESS berücksichtigt <strong>pharmakokinetische Faktoren</strong> wie Halbwertszeit, CYP-Interaktionen und Polypharmazie. 
        <strong>Pharmakodynamische Risiken</strong> (z.B. additive Sedierung bei Benzo + Opioid, Serotonin-Syndrom bei SSRI + Tramadol, 
        QT-Verlängerung bei Antipsychotika + Makroliden) müssen <strong>ärztlich separat geprüft</strong> werden.
      </p>
    </div>
  `;
}

/**
 * 6. Monitoring Recommendations (always shown)
 */
function renderMonitoringRecommendations(data: DoctorReportDataV3): string {
  return `
    <div class="info-box" style="margin-top: 16px;">
      <p style="font-weight: 700; color: #0369a1; margin-bottom: 8px;">🩺 MONITORING-EMPFEHLUNGEN:</p>
      <ul style="margin-left: 18px; font-size: 9pt; line-height: 1.6;">
        <li>Bei einem <strong>Entzugsrisiko-Score ≥ 7</strong> wird eine <strong>wöchentliche ärztliche Überwachung</strong> empfohlen.</li>
        <li>Bei Medikamenten mit <strong>engem therapeutischem Fenster</strong> (z.B. Warfarin, Lithium, Digoxin) sind <strong>regelmäßige Laborkontrollen (TDM)</strong> erforderlich.</li>
      </ul>
    </div>
  `;
}

// ============================================================
// LEVEL 2: PER-MEDICATION SHORT PROFILES (PAGE 2+)
// ============================================================

function renderLevel2MedicationProfiles(data: DoctorReportDataV3): string {
  if (!data.medicationDetails || data.medicationDetails.length === 0) {
    return '<p>Keine Medikamenten-Details vorhanden.</p>';
  }
  
  return `
    <h1>📊 Medikamenten-Kurzprofile</h1>
    <p style="font-size: 9pt; color: #6b7280; margin-bottom: 12px;">
      Kompakte pharmakokinetische Profile für jedes Medikament mit Modell-Faktoren und Überwachungsempfehlungen.
    </p>
    
    ${data.medicationDetails.map((med, idx) => renderMedicationProfile(med, idx)).join('\n')}
  `;
}

function renderMedicationProfile(med: DoctorReportDataV3['medicationDetails'][0], index: number): string {
  return `
    <div class="med-profile">
      <div class="med-profile-header">
        <div class="med-profile-title">${index + 1}. ${med.name}</div>
        <div class="med-profile-subtitle">${med.genericName || '—'} | ${med.category || '—'}</div>
      </div>
      
      <div class="med-profile-row">
        <div class="med-profile-label">Start-Dosis:</div>
        <div class="med-profile-value">${med.startDose}</div>
      </div>
      
      <div class="med-profile-row">
        <div class="med-profile-label">Ziel-Dosis:</div>
        <div class="med-profile-value">${med.targetDose}</div>
      </div>
      
      <div class="med-profile-row">
        <div class="med-profile-label">Max. Wochen-Reduktion:</div>
        <div class="med-profile-value">${med.maxWeeklyReductionPct}% (nach allen Anpassungen)</div>
      </div>
      
      <hr style="margin: 12px 0; border: none; border-top: 2px solid #00C39A;">
      
      ${renderBasiswerteSection(med)}
      
      ${renderCypEnzymeTable(med)}
      
      ${renderCalculationFactorsBox(med)}
      
      ${med.twoPercentFloorApplied ? renderTwoPercentFloorWarning() : ''}
      
      <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      ${index === 0 ? '<h3 style="font-size: 10pt; margin-top: 8px; color: #00584D; margin-bottom: 10px;">🔬 Modell-Faktoren (gelten für alle Profile):</h3>' : ''}
      
      ${renderWithdrawalRiskSection(med.withdrawalRisk)}
      
      ${renderCypSection(med.cypData)}
      
      ${renderTherapeuticRangeSection(med.therapeuticRange)}
      
      ${renderMdiImpactSection(med.mdiImpact)}
      
      ${med.monitoring ? `
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
        <h3 style="font-size: 10pt; margin-top: 8px; color: #00584D;">🩺 Überwachungs-Empfehlungen</h3>
        <div style="font-size: 9pt; color: #4b5563; line-height: 1.5;">
          ${med.monitoring}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// NEW: BASISWERTE SECTION (RAW DATA)
// ============================================================

function renderBasiswerteSection(med: DoctorReportDataV3['medicationDetails'][0]): string {
  return `
    <h3 style="font-size: 10pt; margin-top: 8px; color: #00584D; margin-bottom: 6px;">📋 A. Basiswerte</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
      <div style="background: #F3F4F6; padding: 6px 8px; border-radius: 4px;">
        <div style="font-size: 8pt; color: #6b7280; font-weight: 600;">KATEGORIE</div>
        <div style="font-size: 9pt; color: #1f2937;">${med.category || 'Unbekannt'} ${med.rawData?.categoryId ? `(ID ${med.rawData.categoryId})` : ''}</div>
      </div>
      <div style="background: #F3F4F6; padding: 6px 8px; border-radius: 4px;">
        <div style="font-size: 8pt; color: #6b7280; font-weight: 600;">HALBWERTSZEIT</div>
        <div style="font-size: 9pt; color: #1f2937;">${med.rawData?.halfLifeHours ? `${med.rawData.halfLifeHours}h` : 'Keine Daten'}</div>
      </div>
      <div style="background: #F3F4F6; padding: 6px 8px; border-radius: 4px;">
        <div style="font-size: 8pt; color: #6b7280; font-weight: 600;">WITHDRAWAL SCORE</div>
        <div style="font-size: 9pt; color: #1f2937;">${med.rawData?.withdrawalScore !== null && med.rawData?.withdrawalScore !== undefined ? `${med.rawData.withdrawalScore}/10` : 'Keine Daten'}</div>
      </div>
    </div>
  `;
}

// ============================================================
// NEW: CYP ENZYME TABLE (DETAILED BOOLEAN TABLE)
// ============================================================

function renderCypEnzymeTable(med: DoctorReportDataV3['medicationDetails'][0]): string {
  if (!med.cypEnzymes) {
    return '';
  }
  
  const enzymes = [
    { name: 'CYP3A4', data: med.cypEnzymes.cyp3a4 },
    { name: 'CYP2D6', data: med.cypEnzymes.cyp2d6 },
    { name: 'CYP2C9', data: med.cypEnzymes.cyp2c9 },
    { name: 'CYP2C19', data: med.cypEnzymes.cyp2c19 },
    { name: 'CYP1A2', data: med.cypEnzymes.cyp1a2 }
  ].filter(e => e.data.substrate || e.data.inhibitor || e.data.inducer);
  
  if (enzymes.length === 0) {
    return `
      <h3 style="font-size: 10pt; margin-top: 8px; color: #00584D; margin-bottom: 6px;">🧬 B. CYP-Profil</h3>
      <p style="font-size: 9pt; color: #6b7280; margin-bottom: 10px;">Keine CYP-Daten vorhanden (Nicht-CYP-Metabolismus: z.B. UGT, Renale Clearance)</p>
    `;
  }
  
  return `
    <h3 style="font-size: 10pt; margin-top: 8px; color: #00584D; margin-bottom: 6px;">🧬 B. CYP-Profil</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px;">
      <thead style="background: #F3F4F6;">
        <tr>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: left; font-weight: 600;">Enzym</th>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-weight: 600;">Substrat</th>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-weight: 600;">Inhibitor</th>
          <th style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-weight: 600;">Induktor</th>
        </tr>
      </thead>
      <tbody>
        ${enzymes.map(e => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: 600;">${e.name}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center;">${e.data.substrate ? '✓' : '—'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; color: ${e.data.inhibitor ? '#DC2626' : '#6b7280'}; font-weight: ${e.data.inhibitor ? '600' : '400'};">${e.data.inhibitor ? '✓' : '—'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; color: ${e.data.inducer ? '#059669' : '#6b7280'}; font-weight: ${e.data.inducer ? '600' : '400'};">${e.data.inducer ? '✓' : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================================================
// NEW: CALCULATION FACTORS BOX (MEDLESS FORMULA)
// ============================================================

function renderCalculationFactorsBox(med: DoctorReportDataV3['medicationDetails'][0]): string {
  if (!med.calculationFactors) {
    return '';
  }
  
  const cf = med.calculationFactors;
  
  return `
    <h3 style="font-size: 10pt; margin-top: 8px; color: #00584D; margin-bottom: 6px;">🧮 C. Berechnungsformel (MEDLESS-Modell)</h3>
    <div style="background: #F0FDFA; border: 2px solid #00C39A; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
      <div style="font-size: 9pt; line-height: 1.7; color: #1f2937;">
        <div style="margin-bottom: 4px;"><strong>Phase 1 (Base):</strong> ${cf.baseReductionPct}%</div>
        <div style="margin-bottom: 4px;"><strong>Phase 2 (Kategorie-Limit):</strong> ${cf.categoryLimit ? cf.categoryLimit + '%/Woche' : 'Keine Begrenzung'}</div>
        <div style="margin-bottom: 4px;"><strong>Phase 3 (Halbwertszeit):</strong> Faktor ${cf.halfLifeFactor.toFixed(2)} ${cf.halfLifeFactor < 1 ? '❄️ (Verlangsamung)' : ''}</div>
        <div style="margin-bottom: 4px;"><strong>Phase 4 (CYP-Anpassung):</strong> Faktor ${cf.cypFactor.toFixed(2)} ${cf.cypFactor < 1 ? '🧬 (Hemmung)' : cf.cypFactor > 1 ? '⚡ (Induktion)' : ''}</div>
        <div style="margin-bottom: 4px;"><strong>Phase 5 (Therap. Fenster):</strong> Faktor ${cf.therapeuticWindowFactor.toFixed(2)} ${cf.therapeuticWindowFactor < 1 ? '🧪 (Enges Fenster)' : ''}</div>
        <div style="margin-bottom: 4px;"><strong>Phase 6 (Withdrawal):</strong> Faktor ${cf.withdrawalFactor.toFixed(2)} ${cf.withdrawalFactor < 1 ? '⚠️ (Hohes Risiko)' : ''}</div>
        <div style="margin-bottom: 8px;"><strong>Phase 7 (Multi-Drug):</strong> Faktor ${cf.interactionFactor.toFixed(2)} ${cf.interactionFactor < 1 ? '💊 (Interaktion)' : ''}</div>
        
        <hr style="border: none; border-top: 1px solid #00C39A; margin: 8px 0;">
        
        <div style="font-size: 10pt; font-weight: 700; color: #00584D;">
          <strong>FINAL FACTOR:</strong> ${(cf.finalFactor * 100).toFixed(1)}% 
          <span style="font-weight: 400; color: #6b7280;">(Produkt aller Faktoren)</span>
        </div>
      </div>
    </div>
    
    <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 8px 10px; margin-bottom: 10px;">
      <div style="font-size: 9pt; color: #1f2937; font-weight: 600;">
        📌 D. MEDLESS Empfehlung: Max. <span style="color: #00584D; font-size: 11pt;">${med.maxWeeklyReductionPct}% pro Woche</span>
      </div>
      <div style="font-size: 8pt; color: #6b7280; margin-top: 4px;">
        Basierend auf pharmakokinetischen Daten, Interaktionsprofil und Absetzrisiko.
      </div>
    </div>
  `;
}

function renderWithdrawalRiskSection(wr: DoctorReportDataV3['medicationDetails'][0]['withdrawalRisk']): string {
  if (!wr || wr.score === 0) {
    return '<p style="font-size: 9pt; color: #6b7280;">Kein erhöhtes Absetzrisiko (Entzugssymptomatik) dokumentiert.</p>';
  }
  
  return `
    <div class="med-profile-row">
      <div class="med-profile-label">Absetzrisiko-Score:</div>
      <div class="med-profile-value">${wr.score}/10 → Anpassungsfaktor ${wr.factor.toFixed(2)} (Reduktion um ${wr.slowdownPct}% verlangsamt)</div>
    </div>
  `;
}

function renderCypSection(cyp: DoctorReportDataV3['medicationDetails'][0]['cypData']): string {
  if (!cyp || !cyp.hasCypData) {
    return '<p style="font-size: 9pt; color: #6b7280;">Keine CYP450-Daten vorhanden.</p>';
  }
  
  return `
    <div class="med-profile-row">
      <div class="med-profile-label">CYP450-Enzyme:</div>
      <div class="med-profile-value">
        ${cyp.affectedEnzymes.join(', ')} 
        <span style="color: #6b7280;">(${cyp.effectType === 'slower' ? 'Verlangsamung' : 'Beschleunigung'})</span>
      </div>
    </div>
    ${cyp.clinicalConsequence ? `
    <div class="med-profile-row">
      <div class="med-profile-label">Klinische Konsequenz:</div>
      <div class="med-profile-value" style="color: #DC2626; font-weight: 500;">
        CBD hemmt ${cyp.affectedEnzymes.join('/')} → ${cyp.clinicalConsequence}
      </div>
    </div>
    ` : ''}
    <div class="med-profile-row">
      <div class="med-profile-label">CYP-Anpassung:</div>
      <div class="med-profile-value">Faktor ${cyp.adjustmentFactor.toFixed(2)} (${Math.abs(cyp.slowdownPct)}% ${cyp.effectType === 'slower' ? 'langsamer' : 'schneller'})</div>
    </div>
  `;
}

function renderTherapeuticRangeSection(tr: DoctorReportDataV3['medicationDetails'][0]['therapeuticRange']): string {
  if (!tr || !tr.hasRange) {
    return '<p style="font-size: 9pt; color: #6b7280;">Kein therapeutisches Fenster definiert.</p>';
  }
  
  return `
    <div class="med-profile-row">
      <div class="med-profile-label">Therapeutisches Fenster:</div>
      <div class="med-profile-value">
        ${tr.minValue}–${tr.maxValue} ${tr.unit}
        ${tr.isNarrow ? ' <span style="color: #DC2626; font-weight: 600;">⚠️ ENGES FENSTER</span>' : ''}
      </div>
    </div>
    ${tr.adjustmentFactor !== 1 ? `
      <div class="med-profile-row">
        <div class="med-profile-label">TR-Anpassung:</div>
        <div class="med-profile-value">Faktor ${tr.adjustmentFactor.toFixed(2)} (${tr.slowdownPct}% langsamer)</div>
      </div>
    ` : ''}
  `;
}

function renderMdiImpactSection(mdi: DoctorReportDataV3['medicationDetails'][0]['mdiImpact']): string {
  if (!mdi || !mdi.contributesToMdi) {
    return '<p style="font-size: 9pt; color: #6b7280;">Keine Multi-Drug-Interaktion.</p>';
  }
  
  return `
    <div class="med-profile-row">
      <div class="med-profile-label">MDI-Beitrag:</div>
      <div class="med-profile-value">${mdi.role} (Score: ${mdi.score})</div>
    </div>
  `;
}

// ============================================================
// LEVEL 3: DETAIL APPENDIX (PAGE 3+)
// ============================================================

function renderLevel3Appendix(data: DoctorReportDataV3): string {
  return `
    <h1>📚 Detail-Anhang</h1>
    <p style="font-size: 9pt; color: #6b7280; margin-bottom: 12px;">
      Technische Details, vollständige CYP-Profile und Modell-Dokumentation.
    </p>
    
    ${renderCypDetailTables(data.cypDetails)}
    
    ${renderFullSafetyNotes(data.fullSafetyNotes)}
    
    ${renderModelInfo(data.modelInfo)}
  `;
}

function renderCypDetailTables(cypDetails: DoctorReportDataV3['cypDetails']): string {
  if (!cypDetails || cypDetails.length === 0) {
    return '<p>Keine CYP450-Details vorhanden.</p>';
  }
  
  return `
    <h2>🧬 CYP450-Enzyme – Detaillierte Tabellen</h2>
    ${cypDetails.map(detail => `
      <h3>${detail.medicationName}</h3>
      <table>
        <thead>
          <tr>
            <th>Enzym</th>
            <th>Rolle</th>
            <th>CBD-Effekt</th>
            <th>Einfluss auf Reduktion</th>
          </tr>
        </thead>
        <tbody>
          ${detail.profiles.map(prof => `
            <tr>
              <td>${prof.enzyme}</td>
              <td>${prof.role}</td>
              <td>${prof.cbdEffect}</td>
              <td>${prof.reductionImpact}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `).join('\n')}
  `;
}

/**
 * MEGAPROMPT REGEL 2.1: Deduplicate medication safety warnings
 */
function renderFullSafetyNotes(notes: DoctorReportDataV3['fullSafetyNotes']): string {
  if (!notes || notes.length === 0) {
    return '';
  }
  
  // MEGAPROMPT REGEL 2.1: Remove duplicates within each medication
  const deduplicatedNotes = notes.map(medNotes => {
    const uniqueNotes = Array.from(new Set(medNotes.notes));
    return {
      medicationName: medNotes.medicationName,
      notes: uniqueNotes
    };
  });
  
  return `
    <h2>⚠️ Medikamentenspezifische Sicherheitshinweise</h2>
    <p style="font-size: 9pt; color: #6b7280; margin-bottom: 12px;">
      Jedes Medikament wird nur einmal aufgeführt mit allen relevanten Hinweisen.
    </p>
    ${deduplicatedNotes.map(medNotes => {
      if (medNotes.notes.length === 0) return '';
      
      return `
        <div style="margin: 16px 0; padding: 12px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px; page-break-inside: avoid;">
          <h3 style="font-size: 11pt; font-weight: 700; color: #92400E; margin-bottom: 8px;">${medNotes.medicationName}:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 9pt; line-height: 1.7;">
            ${medNotes.notes.map(note => `<li style="margin: 4px 0;">${note}</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('')}
  `;
}

function renderModelInfo(modelInfo: DoctorReportDataV3['modelInfo']): string {
  if (!modelInfo) return '';
  
  return `
    <h2>ℹ️ Modell-Information</h2>
    <div class="info-box">
      <p><strong>Version:</strong> ${modelInfo.version}</p>
      <p><strong>Faktoren im Modell:</strong></p>
      <ul>
        ${modelInfo.factorsIncluded.map(f => `<li style="font-size: 9pt;">${f}</li>`).join('')}
      </ul>
      
      ${modelInfo.factorsNotIncluded && modelInfo.factorsNotIncluded.length > 0 ? `
        <p style="margin-top: 10px;"><strong>Was das Modell NICHT berücksichtigt:</strong></p>
        <ul>
          ${modelInfo.factorsNotIncluded.map(f => `<li style="font-size: 9pt; color: #DC2626;">${f}</li>`).join('')}
        </ul>
      ` : ''}
      
      ${modelInfo.technicalNote ? `
        <p style="margin-top: 10px; font-size: 9pt; font-style: italic;">${modelInfo.technicalNote}</p>
      ` : ''}
    </div>
  `;
}

// ============================================================
// FOOTER
// ============================================================

function renderFooter(data: DoctorReportDataV3): string {
  return `
    <div class="report-footer">
      <p><strong>Rechtlicher Hinweis:</strong></p>
      <p style="line-height: 1.6;">
        Dieser Bericht ist ein theoretisches Planungsmodell auf Basis pharmakokinetischer Daten und ersetzt keine ärztliche Beratung. 
        Alle Dosierungsänderungen müssen durch den behandelnden Arzt genehmigt und überwacht werden. 
        Das MEDLESS-Modell dient zur Entscheidungsunterstützung und übernimmt keine Haftung für medizinische Entscheidungen.
      </p>
      <p style="margin-top: 8px;">
        <strong>MEDLESS Ärztebericht V3.0</strong> – Erstellt mit PlanIntelligenz 3.0 (CYP450, Therapeutic Range, MDI, Withdrawal Risk Quantification)
      </p>
      <p style="margin-top: 4px;">Generiert am: ${new Date().toLocaleString('de-DE')}</p>
    </div>
  `;
}
