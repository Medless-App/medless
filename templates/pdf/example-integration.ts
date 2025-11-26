/**
 * MEDLESS PDF Generator - Example Integration with Hono
 * 
 * This example shows how to integrate the PDF template with a Hono API route.
 * It includes placeholder replacement and PDF generation logic.
 */

import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = new Hono();

/**
 * Interface for Patient Data
 */
interface PatientData {
  // Page 1: Title Page
  logo?: string;
  patientName: string;
  date: string;
  
  // Page 2: Personal Data
  age: string;
  weight: string;
  height: string;
  bmi: string;
  bsa: string;
  lifestyle?: string;
  
  // Page 3: Dosing Plan
  product: string;
  startDose: string;
  titrationPlan: string;
  dailyDosing: string;
  expectedEffects: string;
  
  // Page 4: Safety
  safetyNotes?: string;
  
  // Page 6: Medications
  drugList: string;
  
  // Page 7: Interactions
  interactionAnalysis: string;
  
  // Page 8: Monitoring
  monitoring: string;
}

/**
 * Interface for Medication
 */
interface Medication {
  name: string;
  genericName: string;
  drugClass: string;
  cyp450Enzyme: string;
  interactionRisk: 'low' | 'medium' | 'high' | 'critical';
  interactionImpact: string;
  withdrawalRiskScore: number;
  cbdInteractionStrength: number;
}

/**
 * Load and fill PDF template with patient data
 */
function fillTemplate(data: PatientData): string {
  // Load template
  const templatePath = join(__dirname, 'medless-report-template.html');
  let html = readFileSync(templatePath, 'utf8');
  
  // Replace all placeholders
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value || '');
  });
  
  return html;
}

/**
 * Generate medication card HTML
 */
function generateDrugCard(med: Medication): string {
  return `
    <div class="drug-card no-break">
      <div class="drug-card-header">${med.name}</div>
      <div class="drug-card-row">
        <span class="drug-card-label">Generischer Name:</span>
        <span class="drug-card-value">${med.genericName}</span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">Medikamentenklasse:</span>
        <span class="drug-card-value">${med.drugClass}</span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">CYP-Metabolismus:</span>
        <span class="drug-card-value">${med.cyp450Enzyme || 'Nicht bekannt'}</span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">Interaktionsrisiko:</span>
        <span class="drug-card-value">
          <span class="risk-badge risk-${med.interactionRisk}">${med.interactionRisk.toUpperCase()}</span>
        </span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">Absetzrisiko-Score:</span>
        <span class="drug-card-value">${med.withdrawalRiskScore}/10</span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">CBD-Interaktionsstärke:</span>
        <span class="drug-card-value">${med.cbdInteractionStrength}/10</span>
      </div>
      <div class="drug-card-row">
        <span class="drug-card-label">Mögliche Cannabinoid-Wirkung:</span>
        <span class="drug-card-value">${med.interactionImpact}</span>
      </div>
    </div>
  `;
}

/**
 * Generate daily dosing table rows
 */
function generateDailyDosingRows(doses: { morning?: number; noon?: number; evening?: number }): string {
  const rows: string[] = [];
  
  if (doses.morning !== undefined) {
    rows.push(`<tr><td>Morgens</td><td>${doses.morning} mg</td></tr>`);
  }
  if (doses.noon !== undefined) {
    rows.push(`<tr><td>Mittags</td><td>${doses.noon} mg</td></tr>`);
  }
  if (doses.evening !== undefined) {
    rows.push(`<tr><td>Abends</td><td>${doses.evening} mg</td></tr>`);
  }
  
  return rows.join('\n');
}

/**
 * Generate titration plan table
 */
function generateTitrationPlan(weeks: { week: string; dose: string }[]): string {
  const rows = weeks.map(w => 
    `<tr><td>${w.week}</td><td>${w.dose}</td></tr>`
  ).join('\n');
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Zeitraum</th>
          <th>Dosierung</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Calculate BMI
 */
function calculateBMI(weight: number, heightCm: number): string {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  return bmi.toFixed(1);
}

/**
 * Calculate Body Surface Area (Mosteller formula)
 */
function calculateBSA(weight: number, heightCm: number): string {
  const bsa = Math.sqrt((heightCm * weight) / 3600);
  return bsa.toFixed(2);
}

/**
 * Generate interaction analysis
 */
function generateInteractionAnalysis(medications: Medication[]): string {
  const highRiskMeds = medications.filter(m => 
    m.interactionRisk === 'high' || m.interactionRisk === 'critical'
  );
  
  let html = '<h4>Identifizierte Hochrisiko-Interaktionen:</h4>';
  
  if (highRiskMeds.length === 0) {
    html += '<p>Keine Hochrisiko-Interaktionen identifiziert.</p>';
  } else {
    html += '<ul class="bullet-list">';
    highRiskMeds.forEach(med => {
      html += `<li><strong>${med.name}:</strong> ${med.interactionImpact}</li>`;
    });
    html += '</ul>';
  }
  
  html += `
    <h4 class="mt-3">Zusammenfassung:</h4>
    <p>
      Von ${medications.length} Medikamenten weisen ${highRiskMeds.length} 
      ein hohes bis kritisches Interaktionsrisiko mit Cannabinoiden auf.
      ${highRiskMeds.length > 0 ? 'Engmaschiges Monitoring wird dringend empfohlen.' : 'Niedriges Gesamtrisiko.'}
    </p>
  `;
  
  return html;
}

/**
 * Generate monitoring recommendations
 */
function generateMonitoring(medications: Medication[]): string {
  const recommendations: { parameter: string; timing: string; reason: string }[] = [];
  
  medications.forEach(med => {
    if (med.interactionRisk === 'high' || med.interactionRisk === 'critical') {
      recommendations.push({
        parameter: `${med.name}-Spiegel (TDM)`,
        timing: 'Nach 1-2 Wochen',
        reason: `${med.cyp450Enzyme}-Interaktion mit CBD`
      });
    }
    
    if (med.withdrawalRiskScore >= 7) {
      recommendations.push({
        parameter: 'Entzugssymptome',
        timing: 'Wöchentlich',
        reason: `Hohes Absetzrisiko (${med.withdrawalRiskScore}/10)`
      });
    }
  });
  
  if (recommendations.length === 0) {
    return '<p>Standardmonitoring ausreichend. Keine spezifischen Empfehlungen.</p>';
  }
  
  const rows = recommendations.map(r => 
    `<tr>
      <td>${r.parameter}</td>
      <td>${r.timing}</td>
      <td>${r.reason}</td>
    </tr>`
  ).join('\n');
  
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Zeitpunkt</th>
          <th>Begründung</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * API Route: Generate PDF Report
 */
app.post('/api/generate-report', async (c) => {
  try {
    // Get request data
    const requestData = await c.req.json();
    
    const {
      patientName,
      age,
      weight,
      height,
      medications,
      cbdProduct,
      startDose,
      titrationWeeks
    } = requestData;
    
    // Calculate BMI and BSA
    const bmi = calculateBMI(weight, height);
    const bsa = calculateBSA(weight, height);
    
    // Generate date
    const date = new Date().toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Generate medication cards
    const drugList = medications.map((med: Medication) => generateDrugCard(med)).join('\n');
    
    // Generate daily dosing
    const dailyDosing = generateDailyDosingRows({
      morning: startDose * 0.3,
      evening: startDose * 0.7
    });
    
    // Generate titration plan
    const titrationPlan = generateTitrationPlan(titrationWeeks || [
      { week: 'Woche 1-2', dose: `${startDose} mg` },
      { week: 'Woche 3-4', dose: `${startDose * 2} mg` },
      { week: 'Ab Woche 5', dose: `${startDose * 3} mg` }
    ]);
    
    // Generate interaction analysis
    const interactionAnalysis = generateInteractionAnalysis(medications);
    
    // Generate monitoring
    const monitoring = generateMonitoring(medications);
    
    // Prepare patient data
    const patientData: PatientData = {
      logo: 'MEDLESS',
      patientName,
      date,
      age: age.toString(),
      weight: weight.toString(),
      height: height.toString(),
      bmi,
      bsa,
      lifestyle: requestData.lifestyle || 'Keine Angaben',
      product: cbdProduct,
      startDose: startDose.toString(),
      titrationPlan,
      dailyDosing,
      expectedEffects: 'Mögliche leichte Müdigkeit in den ersten Tagen. Verbesserung nach 2-3 Wochen.',
      safetyNotes: 'Bei ungewöhnlichen Symptomen sofort Arzt kontaktieren.',
      drugList,
      interactionAnalysis,
      monitoring
    };
    
    // Fill template
    const filledHTML = fillTemplate(patientData);
    
    // Here you would generate the PDF using Puppeteer, wkhtmltopdf, etc.
    // For now, we'll return the HTML
    
    return c.html(filledHTML);
    
  } catch (error) {
    console.error('Error generating report:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

/**
 * Example usage with sample data
 */
app.get('/api/example-report', async (c) => {
  const sampleMedications: Medication[] = [
    {
      name: 'Citalopram 20 mg',
      genericName: 'Citalopram',
      drugClass: 'SSRI (Antidepressivum)',
      cyp450Enzyme: 'CYP2C19, CYP3A4',
      interactionRisk: 'high',
      interactionImpact: 'CBD hemmt CYP2C19 und kann Citalopram-Spiegel erhöhen. Risiko für verstärkte Nebenwirkungen.',
      withdrawalRiskScore: 7,
      cbdInteractionStrength: 7
    },
    {
      name: 'Pantoprazol 40 mg',
      genericName: 'Pantoprazol',
      drugClass: 'Protonenpumpenhemmer (PPI)',
      cyp450Enzyme: 'CYP2C19',
      interactionRisk: 'medium',
      interactionImpact: 'Moderate Interaktion über CYP2C19. Monitoring empfohlen.',
      withdrawalRiskScore: 6,
      cbdInteractionStrength: 5
    }
  ];
  
  const patientData: PatientData = {
    logo: 'MEDLESS',
    patientName: 'Max Mustermann',
    date: new Date().toLocaleDateString('de-DE'),
    age: '45',
    weight: '75',
    height: '175',
    bmi: '24.5',
    bsa: '1.90',
    lifestyle: 'Nichtraucher, gelegentlich Alkohol, regelmäßiger Sport',
    product: 'CBD-Öl 10% Vollspektrum',
    startDose: '10',
    titrationPlan: generateTitrationPlan([
      { week: 'Woche 1-2', dose: '10 mg' },
      { week: 'Woche 3-4', dose: '20 mg' },
      { week: 'Ab Woche 5', dose: '30 mg' }
    ]),
    dailyDosing: generateDailyDosingRows({ morning: 5, evening: 15 }),
    expectedEffects: 'Mögliche leichte Müdigkeit in den ersten Tagen. Verbesserung von Schlaf und Stimmung nach 2-3 Wochen.',
    safetyNotes: 'Keine bekannten Allergien. Bei Schwindel Dosis reduzieren.',
    drugList: sampleMedications.map(generateDrugCard).join('\n'),
    interactionAnalysis: generateInteractionAnalysis(sampleMedications),
    monitoring: generateMonitoring(sampleMedications)
  };
  
  const filledHTML = fillTemplate(patientData);
  return c.html(filledHTML);
});

export default app;
