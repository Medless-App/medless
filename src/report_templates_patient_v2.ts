// ============================================================
// PATIENT REPORT V2 – MEGAPROMPT COMPLIANCE
// ============================================================
// Implements all 6 megaprompt rules for patient-friendly reports
// Consistent with Doctor Report V3

import type { AnalyzeResponse } from './types/analyzeResponse'
import { MEDLESS_LOGO_BASE64 } from './logo_base64'
import {
  formatMgValue,
  formatMgPerKg,
  calculateReductionPercentage,
  buildCBDDoseInfo,
  type CBDDoseInfo
} from './utils/report_formatting'
import { getReportStyles } from './design-system/reportStyles'

// 🎨 Get design tokens for consistent styling
const S = getReportStyles();

/**
 * MEGAPROMPT REGEL 3: Patient Plan Data Structure
 */
export interface PatientPlanData {
  patientName: string;
  patientAge: number;
  patientWeight: number;
  durationWeeks: number;
  
  // MEGAPROMPT REGEL 1: CBD Dose Info (identical to doctor report)
  cbdDoseInfo: CBDDoseInfo;
  
  // Medications
  medications: Array<{
    name: string;
    startDose: number;
    endDose: number;
    reductionPercent: number;
  }>;
  
  // Weekly plan (simplified for patient)
  weeklyPlan: Array<{
    week: number;
    cbdDose: number;
    medications: Array<{
      name: string;
      dose: number;
    }>;
  }>;
  
  // Safety warnings (patient-friendly)
  safetyWarnings: string[];
  
  // Product info
  product: {
    name: string;
    cbdPerSpray: number;
    spraysPerDay: number;
  };
}

/**
 * Build Patient Plan Data from Analyze Response
 */
export function buildPatientPlanData(response: AnalyzeResponse): PatientPlanData {
  const {
    analysis,
    weeklyPlan,
    personalization,
    cbdProgression,
    product
  } = response;
  
  const patientName = personalization?.firstName || 'Patient';
  const patientAge = personalization?.age || 0;
  const patientWeight = personalization?.weight || 0;
  const durationWeeks = weeklyPlan.length || 0;
  
  // MEGAPROMPT REGEL 1: Extract CBD dose info
  const cbdStart = cbdProgression?.startMg || personalization?.cbdStartMg || 0;
  const cbdEnd = cbdProgression?.endMg || personalization?.cbdEndMg || 0;
  const cbdDoseInfo = buildCBDDoseInfo(cbdStart, cbdEnd, patientWeight);
  
  // Extract medications
  const medications = analysis.map(entry => {
    const name = entry.medication.name || entry.medication.generic_name || 'Unbekanntes Medikament';
    const startDose = entry.mgPerDay || 0;
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    const targetMed = lastWeek?.medications.find((m: any) => m.name === name);
    const endDose = targetMed?.targetMg || startDose;
    const reductionPercent = calculateReductionPercentage(startDose, endDose);
    
    return { name, startDose, endDose, reductionPercent };
  });
  
  // Simplify weekly plan for patient
  const simplifiedWeeklyPlan = weeklyPlan.map((week: any, idx: number) => ({
    week: idx + 1,
    cbdDose: week.cbdMgPerDay || 0,
    medications: week.medications.map((m: any) => ({
      name: m.name,
      dose: m.targetMg
    }))
  }));
  
  // Extract safety warnings (patient-friendly)
  const safetyWarnings: string[] = [];
  
  // Check for high-risk substances
  const hasHighRisk = analysis.some(entry => {
    const withdrawalScore = entry.medication.withdrawal_risk_score || 0;
    return withdrawalScore >= 7;
  });
  
  if (hasHighRisk) {
    safetyWarnings.push('⚠️ Eines oder mehrere deiner Medikamente haben ein hohes Absetzrisiko. Halte dich genau an den Plan und sprich sofort mit deinem Arzt, wenn du Beschwerden bemerkst.');
  }
  
  if (analysis.length > 1) {
    safetyWarnings.push('💊 Du nimmst mehrere Medikamente gleichzeitig. Dein Arzt wird den Plan möglicherweise noch individuell anpassen.');
  }
  
  return {
    patientName,
    patientAge,
    patientWeight,
    durationWeeks,
    cbdDoseInfo,
    medications,
    weeklyPlan: simplifiedWeeklyPlan,
    safetyWarnings,
    product: {
      name: product?.name || 'MEDLESS Nr. 5',
      cbdPerSpray: product?.cbdPerSpray || 2.5,
      spraysPerDay: product?.totalSpraysPerDay || 7
    }
  };
}

/**
 * Render Patient Plan HTML
 */
export function renderPatientPlanHTML(data: PatientPlanData): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dein MEDLESS Plan – ${data.patientName}</title>
  <style>
    ${getPatientStyles()}
  </style>
</head>
<body>
<div class="container">

${renderPatientHeader(data)}

${renderPatientSummary(data)}

${renderPatientWeeklyPlan(data)}

${renderPatientSafetyInfo(data)}

${renderPatientFooter(data)}

</div>
</body>
</html>
`;
}

/**
 * Styles for Patient Report
 */
function getPatientStyles(): string {
  return `
    @page {
      size: A4;
      margin: 10mm 10mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: ${S.gray800};
      background: white;
    }
    
    .container {
      width: 100%;
      max-width: 100%;
    }
    
    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8mm;
      padding-bottom: 4mm;
      border-bottom: 2px solid ${S.successBorder};
    }
    
    .header-logo {
      width: 120px;
      height: auto;
    }
    
    .header-title {
      text-align: right;
      flex: 1;
      padding-left: 20px;
    }
    
    .header-title h1 {
      font-size: 14pt;
      font-weight: 700;
      color: ${S.successText};
      margin-bottom: 2px;
    }
    
    .header-title .subtitle {
      font-size: 9pt;
      color: ${S.gray500};
    }
    
    /* Typography */
    h1 {
      font-size: 16pt;
      font-weight: 700;
      color: ${S.gray900};
      margin: 12px 0 8px 0;
    }
    
    h2 {
      font-size: 13pt;
      font-weight: 600;
      color: ${S.gray800};
      margin: 16px 0 8px 0;
      border-bottom: 1px solid ${S.gray200};
      padding-bottom: 4px;
    }
    
    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: ${S.gray700};
      margin: 10px 0 6px 0;
    }
    
    p {
      margin: 6px 0;
    }
    
    /* Boxes */
    .info-box {
      background: ${S.infoBg};
      border-left: 3px solid ${S.infoBorder};
      padding: 12px 14px;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    .success-box {
      background: ${S.successBg};
      border-left: 3px solid ${S.successText};
      padding: 12px 14px;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    .warning-box {
      background: ${S.warningBg};
      border-left: 3px solid ${S.warningBorder};
      padding: 12px 14px;
      margin: 10px 0;
      border-radius: 4px;
    }
    
    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10pt;
    }
    
    th {
      background: ${S.gray100};
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      border: 1px solid ${S.gray300};
    }
    
    td {
      padding: 6px;
      border: 1px solid ${S.gray200};
    }
    
    tr:nth-child(even) {
      background: ${S.gray50};
    }
    
    /* Footer */
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid ${S.gray200};
      font-size: 8pt;
      color: ${S.gray500};
    }
    
    ul {
      margin: 6px 0 6px 20px;
    }
    
    li {
      margin: 3px 0;
    }
  `;
}

/**
 * MEGAPROMPT REGEL 6: Header (H1)
 */
function renderPatientHeader(data: PatientPlanData): string {
  return `
    <div class="header">
      <div class="header-logo">
        <img src="${MEDLESS_LOGO_BASE64}" alt="MEDLESS Logo" style="width: 120px; height: auto;">
      </div>
      <div class="header-title">
        <h1>Dein MEDLESS Plan</h1>
        <div class="subtitle">Persönlicher Orientierungsplan für ${data.patientName}</div>
        <div class="subtitle" style="margin-top: 4px;">${new Date().toLocaleDateString('de-DE')}</div>
      </div>
    </div>
  `;
}

/**
 * MEGAPROMPT REGEL 1-3: Patient Summary (Consistent CBD Values)
 */
function renderPatientSummary(data: PatientPlanData): string {
  const cbd = data.cbdDoseInfo;
  
  // 🔒 DEFENSIVE: Check if cbdProgression exists before accessing startMg
  const showCBD = (data.cbdProgression?.startMg ?? 0) > 0 || cbd.startDose > 0;
  
  return `
    <h1>📋 Deine Zusammenfassung</h1>
    
    <div class="info-box">
      <p><strong>Dauer:</strong> ${data.durationWeeks} Wochen</p>
      <p><strong>Gewicht:</strong> ${data.patientWeight} kg</p>
    </div>
    
    ${showCBD ? `
    <h2>CBD-Dosis (Start → Ende)</h2>
    <div class="success-box">
      <p style="font-size: 11pt; margin: 4px 0;">
        <strong>Start:</strong> ${formatMgValue(cbd.startDose)}<br>
        <strong>Ende:</strong> ${formatMgValue(cbd.endDose)} (das entspricht ${formatMgPerKg(cbd.endDose, data.patientWeight)})<br>
        <strong>Deine CBD-Dosis steigt stufenweise von ${formatMgValue(cbd.startDose)} auf ${formatMgValue(cbd.endDose)}.</strong>
      </p>
    </div>
    ` : ''}
    
    <h2>Deine Medikamente</h2>
    <table>
      <thead>
        <tr>
          <th>Medikament</th>
          <th>Start</th>
          <th>Ziel</th>
          <th>Reduktion</th>
        </tr>
      </thead>
      <tbody>
        ${data.medications.map(med => {
          // 🔒 DEFENSIVE: Handle missing startDose/endDose
          if (med.startDose === undefined || med.startDose === null || med.startDose === 0) {
            return `
          <tr>
            <td><strong>${med.name}</strong></td>
            <td colspan="3" style="color: ${S.gray400}; text-align: center;">
              Aktuell wird keine Reduktion empfohlen (0%). Der Plan dient ausschließlich als Orientierung.
            </td>
          </tr>
        `;
          }
          
          // ✅ D2 FIX: Patient-friendly 0% explanation
          const reductionText = med.reductionPercent === 0 
            ? '<span style="color: ${S.gray400};">Aktuell wird keine Reduktion empfohlen (0%) - aus Sicherheitsgründen</span>'
            : `${med.reductionPercent}%`;
          
          return `
          <tr>
            <td><strong>${med.name}</strong></td>
            <td>${formatMgValue(med.startDose)}</td>
            <td>${formatMgValue(med.endDose)}</td>
            <td>${reductionText}</td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Weekly Plan (Simplified for Patient)
 */
function renderPatientWeeklyPlan(data: PatientPlanData): string {
  return `
    <h2>📅 Dein Wochenplan</h2>
    <p style="font-size: 10pt; color: ${S.gray500}; margin-bottom: 10px;">
      Hier siehst du, wie sich deine Dosen Woche für Woche ändern.
    </p>
    
    <table>
      <thead>
        <tr>
          <th>Woche</th>
          ${(data.cbdProgression?.startMg ?? 0) > 0 ? '<th>CBD-Dosis</th>' : ''}
          ${data.medications.map(med => `<th>${med.name}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.weeklyPlan.map(week => `
          <tr>
            <td><strong>${week.week}</strong></td>
            ${(data.cbdProgression?.startMg ?? 0) > 0 ? `<td>${formatMgValue(week.cbdDose)}</td>` : ''}
            ${week.medications.map(med => `<td>${formatMgValue(med.dose)}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Safety Information (Patient-Friendly)
 */
function renderPatientSafetyInfo(data: PatientPlanData): string {
  return `
    <h2>⚠️ Wichtige Sicherheitshinweise</h2>
    
    ${data.safetyWarnings.length > 0 ? `
      <div class="warning-box">
        <ul style="margin: 0; padding-left: 20px;">
          ${data.safetyWarnings.map(warning => `<li>${warning}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <div class="warning-box" style="margin-top: 12px;">
      <h3 style="color: ${S.warningText}; margin-bottom: 6px;">🩺 Besprich diesen Plan mit deinem Arzt</h3>
      <p style="font-size: 10pt; line-height: 1.6;">
        Dieser Plan ist eine <strong>Orientierungshilfe</strong>. Dein Arzt wird entscheiden, ob und wie schnell deine Medikamente reduziert werden können. 
        <strong>Ändere niemals die Dosis ohne Rücksprache mit deinem Arzt!</strong>
      </p>
    </div>
    
    <div class="info-box" style="margin-top: 12px;">
      <h3 style="color: ${S.infoText}; margin-bottom: 6px;">📞 Bei Beschwerden sofort zum Arzt</h3>
      <ul style="margin: 6px 0 0 20px; font-size: 10pt; line-height: 1.6;">
        <li>Starke Kopfschmerzen oder Schwindel</li>
        <li>Unruhe, Angst oder Schlafstörungen</li>
        <li>Zittern oder Krampfanfälle</li>
        <li>Jede andere ungewöhnliche Reaktion</li>
      </ul>
    </div>
  `;
}

/**
 * Footer
 */
function renderPatientFooter(data: PatientPlanData): string {
  return `
    <div class="footer">
      <p><strong>Wichtig:</strong> Dieser Plan ist keine medizinische Diagnose oder Behandlung. 
      Alle Dosierungsänderungen müssen durch deinen Arzt genehmigt werden.</p>
      <p style="margin-top: 6px;"><strong>MEDLESS Patientenplan</strong> – Erstellt am ${new Date().toLocaleDateString('de-DE')}</p>
    </div>
  `;
}

// ============================================================
// EXAMPLE FUNCTION FOR TESTING
// ============================================================

/**
 * Generate example patient plan HTML for testing/preview
 * Uses realistic dummy data matching production structure
 */
export function renderPatientPlanExample(): string {
  const exampleData: PatientPlanData = {
    patient: {
      firstName: 'Maria',
      age: 62,
      weight: 68,
      height: 165,
      gender: 'female',
      bmi: 24.9,
      durationWeeks: 8
    },
    cbdProgression: {
      startMg: 35,
      endMg: 68,
      weeklyIncrease: 4.7
    },
    reductionSummary: {
      theoreticalTargetPercent: 50,
      actualReductionPercent: 44,
      medications: [
        {
          name: 'Celecoxib',
          startMg: 400,
          endMg: 224,
          reductionPercent: 44
        }
      ]
    },
    medications: [
      {
        name: 'Celecoxib',
        generic: 'Celecoxib',
        startMg: 400,
        endMg: 224,
        currentDoseMg: 400
      }
    ],
    weeklyPlan: [
      {
        week: 1,
        cbdDose: 35,
        medications: { 'Celecoxib': 400 }
      },
      {
        week: 2,
        cbdDose: 52.5,
        medications: { 'Celecoxib': 400 }
      },
      {
        week: 3,
        cbdDose: 56,
        medications: { 'Celecoxib': 380 }
      },
      {
        week: 4,
        cbdDose: 60,
        medications: { 'Celecoxib': 350 }
      },
      {
        week: 5,
        cbdDose: 63,
        medications: { 'Celecoxib': 310 }
      },
      {
        week: 6,
        cbdDose: 65,
        medications: { 'Celecoxib': 270 }
      },
      {
        week: 7,
        cbdDose: 66.5,
        medications: { 'Celecoxib': 240 }
      },
      {
        week: 8,
        cbdDose: 68,
        medications: { 'Celecoxib': 224 }
      }
    ],
    warnings: [
      '⚠️ Bei starken Schmerzen, Unwohlsein oder neuen Symptomen kontaktieren Sie sofort Ihren Arzt',
      '⚠️ Reduzieren Sie die Medikation NICHT schneller als im Plan vorgesehen',
      '⚠️ CBD kann mit anderen Medikamenten interagieren - informieren Sie alle behandelnden Ärzte'
    ],
    positiveEffects: [
      '✨ Weniger Nebenwirkungen durch niedrigere Medikamentendosis',
      '💪 Mehr Energie und besseres Wohlbefinden im Alltag',
      '😌 Natürliche Unterstützung des Endocannabinoid-Systems',
      '🛡️ Schutz vor Entzugssymptomen durch CBD-Begleitung',
      '🎯 Schritt für Schritt zu mehr Lebensqualität'
    ],
    checkupInfo: {
      frequency: 'Nach 2, 4 und 8 Wochen',
      parameters: [
        'Schmerzniveau (VAS-Skala)',
        'Nebenwirkungen dokumentieren',
        'Lebensqualität bewerten',
        'Ggf. Laborwerte kontrollieren'
      ]
    },
    costs: {
      totalEur: 167.20,
      breakdown: 'Geschätzte Gesamtkosten für 8 Wochen CBD-Therapie'
    },
    footerNote: 'Erstellt am ' + new Date().toLocaleDateString('de-DE'),
    disclaimer: 'Dieser Plan ersetzt keine ärztliche Beratung. Führen Sie Änderungen nur in Absprache mit Ihrem Arzt durch.'
  };

  return renderPatientPlanHTML(exampleData);
}
