// ============================================================
// DOCTOR REPORT V3 – 3-LEVEL STRUCTURE FOR PHYSICIANS
// ============================================================
// Level 1: Overview (Summary table + Global risk)
// Level 2: Per-Medication Short Profile (compact blocks)
// Level 3: Detail Appendix (CYP tables, full safety notes, model info)
// ============================================================

import type { DoctorReportDataV3 } from './report_data_v3'
import { MEDLESS_LOGO_BASE64 } from './logo_base64'

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
  `;
}

// ============================================================
// LEVEL 1: OVERVIEW (PAGE 1)
// ============================================================

function renderLevel1Overview(data: DoctorReportDataV3): string {
  return `
    <h1>📋 Übersicht – MedLess-Reduktionsplan</h1>
    
    <div class="info-box">
      <strong>Patient:</strong> ${data.patientName} | 
      <strong>Alter:</strong> ${data.patientAge} Jahre | 
      <strong>Gewicht:</strong> ${data.patientWeight} kg | 
      <strong>Reduktionsdauer:</strong> ${data.durationWeeks} Wochen
    </div>

    ${renderOverviewTable(data.overviewMedications)}
    
    ${renderGlobalRiskBox(data.globalRisk)}
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
      
      <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <h3 style="font-size: 10pt; margin-top: 8px; color: #00584D;">🔬 Modell-Faktoren</h3>
      
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

function renderWithdrawalRiskSection(wr: DoctorReportDataV3['medicationDetails'][0]['withdrawalRisk']): string {
  if (!wr || wr.score === 0) {
    return '<p style="font-size: 9pt; color: #6b7280;">Kein erhöhtes Absetzrisiko dokumentiert.</p>';
  }
  
  return `
    <div class="med-profile-row">
      <div class="med-profile-label">Absetzrisiko-Score:</div>
      <div class="med-profile-value">${wr.score}/10 → Faktor ${wr.factor.toFixed(2)} (${wr.slowdownPct}% langsamer)</div>
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
    <div class="med-profile-row">
      <div class="med-profile-label">CYP-Anpassung:</div>
      <div class="med-profile-value">Faktor ${cyp.adjustmentFactor.toFixed(2)} (${cyp.slowdownPct}% ${cyp.effectType === 'slower' ? 'langsamer' : 'schneller'})</div>
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

function renderFullSafetyNotes(notes: DoctorReportDataV3['fullSafetyNotes']): string {
  if (!notes || notes.length === 0) {
    return '';
  }
  
  return `
    <h2>⚠️ Vollständige Sicherheitshinweise (Woche 1)</h2>
    ${notes.map(medNotes => `
      <h3>${medNotes.medicationName}</h3>
      <ul>
        ${medNotes.notes.map(note => `<li style="font-size: 9pt;">${note}</li>`).join('')}
      </ul>
    `).join('\n')}
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
