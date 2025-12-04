// ============================================================
// REPORT DATA BUILDERS FOR PDF GENERATION
// ============================================================
// This file defines types and builder functions for generating patient and doctor reports
// from the MEDLESS /api/analyze response. All logic is deterministic and based solely
// on the AnalyzeResponse data structure.
//
// CRITICAL RULES:
// - NO new fields, AI calls, randomness, or time dependency
// - Patient reports: Show MEDLESS product costs ONLY (no medication costs)
// - Doctor reports: Show NO cost information at all
// - All data must come from AnalyzeResponse object

import type { 
  AnalyzeResponse,
  WeeklyPlanEntry,
  AnalysisEntry,
  MedicationWithCategory
} from './types/analyzeResponse'

// ============================================================
// PATIENT REPORT DATA TYPE
// ============================================================

export interface PatientReportData {
  // Header section
  headerTitle: string;
  
  // Warning box (critical/high severity only)
  warningBox: {
    show: boolean;
    severity: 'critical' | 'high' | null;
    title: string;
    message: string;
  };
  
  // Patient facts (personalization summary)
  patientFacts: {
    firstName: string;
    age: string;
    weight: string;
    bmi: string;
    medicationCount: number;
    sensitiveMedCount: number;
    hasBenzoOrOpioid: boolean;
  };
  
  // Short summary (3-4 sentences)
  shortSummary: string;
  
  // Weekly plan (simplified for patients)
  weeklyPlan: {
    week: number;
    cbdDoseDisplay: string; // e.g. "35.0 mg/Tag"
    productName: string;
    spraySchedule: string; // e.g. "2x morgens, 3x abends"
    medicationsDisplay: string; // e.g. "Metoprolol: 100mg → 90mg"
  }[];
  
  // Positive effects examples (based on CBD dose and medications)
  positiveEffectsExamples: string[];
  
  // Warning symptoms to watch for
  warningSymptoms: string[];
  
  // Checkup info
  checkupInfo: {
    frequency: string; // e.g. "alle 2 Wochen"
    parameters: string[]; // e.g. ["Blutdruck", "Herzfrequenz"]
  };
  
  // MEDLESS product notes (costs, ordering info)
  medlessProductNotes: {
    totalCost: number;
    costBreakdown: string; // e.g. "2x MEDLESS Nr. 10 (79,80 €)"
    durationWeeks: number;
  };
  
  // Footer disclaimer
  footerDisclaimer: string;
  
  // Version note
  versionNote: string;
}

// ============================================================
// DOCTOR REPORT DATA TYPE
// ============================================================

export interface DoctorReportData {
  // Header section
  headerTitle: string;
  
  // Patient metadata
  patientMeta: {
    firstName: string;
    age: string;
    weight: string;
    height: string;
    bmi: string;
    bsa: string;
    idealWeight: string;
  };
  
  // Risk overview
  riskOverview: {
    maxSeverity: 'low' | 'medium' | 'high' | 'critical';
    sensitiveMedCount: number;
    totalMedCount: number;
    hasBenzoOrOpioid: boolean;
    criticalInteractions: string[]; // Medication names with critical interactions
  };
  
  // Strategy summary
  strategySummary: {
    durationWeeks: number;
    reductionGoal: number;
    cbdStartMg: number;
    cbdEndMg: number;
    overallLoadReduction: number;
    reductionSpeedCategory: string;
  };
  
  // Traffic light medications (grouped by risk)
  trafficLightMedications: {
    critical: string[]; // Red: Critical CBD interactions or very high risk
    high: string[]; // Orange: High CBD interactions or high withdrawal risk
    medium: string[]; // Yellow: Medium interactions or moderate risk
    low: string[]; // Green: Low risk
  };
  
  // Medication table rows (detailed data)
  medicationTableRows: {
    name: string;
    startDose: string;
    targetDose: string;
    reductionPct: number;
    weeklyReductionMg: number;
    halfLife: string;
    withdrawalRisk: string;
    cbdInteraction: string;
    categoryRules: string; // e.g. "Max 5%/Woche" or "Keine Vollreduktion"
  }[];
  
  // Reduction plan details (week-by-week summary)
  reductionPlanDetails: {
    week: number;
    totalMedicationLoad: number;
    cbdDose: number;
    cannabinoidPerKg: number | null;
    notes: string; // Key events (e.g., "Produktwechsel zu MEDLESS Nr. 15")
  }[];
  
  // Monitoring recommendations
  monitoringRecommendations: {
    frequency: string;
    vitalSigns: string[]; // e.g. ["Blutdruck", "Herzfrequenz", "Leberwerte"]
    symptoms: string[]; // Warning symptoms to monitor
    specialNotes: string[]; // Category-specific warnings
  };
  
  // Methodology notes (how the plan was calculated)
  methodologyNotes: {
    cbdDosingMethod: string; // e.g. "0,5 mg/kg Startdosis, 1,0 mg/kg Zieldosis"
    reductionMethod: string; // e.g. "Schrittweise Reduktion mit Kategorie-Sicherheitsregeln"
    safetyRulesApplied: boolean;
    adjustmentsApplied: string[]; // e.g. ["CBD halbiert (Benzodiazepine)", "Alter 65+ (-20%)"]
  };
  
  // Legal notes (disclaimers for doctors) - can be string or string array
  legalNotes: string | string[];
  
  // Version note
  versionNote: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get medication name from analysis entry
 */
function getMedicationName(entry: AnalysisEntry): string {
  if ('found' in entry.medication && entry.medication.found === false) {
    return entry.medication.name;
  }
  return (entry.medication as MedicationWithCategory).name;
}

/**
 * Format number with one decimal place
 */
function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return num.toFixed(1);
}

/**
 * Determine if medication has critical/high CBD interaction
 */
function hasCriticalInteraction(entry: AnalysisEntry): boolean {
  return entry.interactions.some(i => i.severity === 'critical' || i.severity === 'high');
}

/**
 * Get severity display text in German
 */
function getSeverityDisplayDE(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const map: Record<string, string> = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    critical: 'Kritisch'
  };
  return map[severity] || severity;
}

// ============================================================
// PATIENT REPORT BUILDER
// ============================================================

export function buildPatientReportData(response: AnalyzeResponse): PatientReportData {
  const { 
    analysis, 
    maxSeverity, 
    weeklyPlan, 
    reductionGoal, 
    costs, 
    personalization, 
    warnings,
    planIntelligence 
  } = response;
  
  // --- Header ---
  const headerTitle = `Dein persönlicher MEDLESS-Plan`;
  
  // --- Warning Box ---
  const showWarning = maxSeverity === 'critical' || maxSeverity === 'high';
  const warningBox = {
    show: showWarning,
    severity: showWarning ? maxSeverity : null,
    title: maxSeverity === 'critical' 
      ? '⚠️ WICHTIG: Kritische Wechselwirkungen erkannt'
      : maxSeverity === 'high'
        ? '⚠️ ACHTUNG: Hohe Wechselwirkungen erkannt'
        : '',
    message: showWarning
      ? 'Bitte sprich mit deinem Arzt, bevor du mit der Einnahme von Cannabinoiden beginnst. Deine Sicherheit hat oberste Priorität.'
      : ''
  };
  
  // --- Patient Facts ---
  const patientFacts = {
    firstName: personalization.firstName || 'Unbekannt',
    age: personalization.age ? `${personalization.age}` : 'Keine Angabe',
    weight: personalization.weight ? `${personalization.weight}` : 'Keine Angabe',
    bmi: personalization.bmi ? `${personalization.bmi}` : 'Keine Angabe',
    medicationCount: planIntelligence.totalMedicationCount,
    sensitiveMedCount: planIntelligence.sensitiveMedCount,
    hasBenzoOrOpioid: personalization.hasBenzoOrOpioid
  };
  
  // --- Short Summary ---
  const reductionPct = planIntelligence.totalLoadReductionPct;
  const speedCategory = planIntelligence.reductionSpeedCategory;
  const shortSummary = `Dein Plan reduziert ${patientFacts.medicationCount} Medikament${patientFacts.medicationCount > 1 ? 'e' : ''} ` +
    `über ${weeklyPlan.length} Wochen um insgesamt ${reductionPct.toFixed(1)}% (${speedCategory}). ` +
    `Deine CBD-Dosis steigt von ${personalization.cbdStartMg.toFixed(1)} mg auf ${personalization.cbdEndMg.toFixed(1)} mg täglich. ` +
    `${patientFacts.sensitiveMedCount > 0 
      ? `Da du ${patientFacts.sensitiveMedCount} kritische${patientFacts.sensitiveMedCount > 1 ? '' : 's'} Medikament${patientFacts.sensitiveMedCount > 1 ? 'e' : ''} nimmst, erfolgt die Reduktion besonders vorsichtig.`
      : 'Die Reduktion erfolgt schrittweise und sicher.'
    }`;
  
  // --- Weekly Plan (Simplified) ---
  const weeklyPlanSimplified = weeklyPlan.map(week => {
    const spraySchedule = `${week.morningSprays}x morgens, ${week.eveningSprays}x abends`;
    
    // Summarize medications: e.g., "Metoprolol: 100mg → 90mg, Ramipril: 10mg → 9mg"
    const medicationsDisplay = week.medications
      .map(med => `${med.name}: ${med.startMg}mg → ${med.currentMg}mg`)
      .join(', ');
    
    return {
      week: week.week,
      cbdDoseDisplay: `${week.actualCbdMg} mg/Tag`,
      productName: week.kannasanProduct.name,
      spraySchedule,
      medicationsDisplay
    };
  });
  
  // --- Positive Effects Examples ---
  const positiveEffectsExamples: string[] = [];
  
  // Based on medication types and CBD dose
  const hasPainMeds = analysis.some(a => {
    const name = getMedicationName(a).toLowerCase();
    return name.includes('schmerz') || name.includes('ibuprofen') || name.includes('paracetamol');
  });
  
  const hasAnxietyMeds = analysis.some(a => {
    const name = getMedicationName(a).toLowerCase();
    const category = (a.medication as MedicationWithCategory).category_name?.toLowerCase() || '';
    return name.includes('benzo') || name.includes('antidepress') || category.includes('antidepress');
  });
  
  const hasSleepMeds = analysis.some(a => {
    const name = getMedicationName(a).toLowerCase();
    return name.includes('schlaf') || name.includes('zolpidem') || name.includes('zopiclon');
  });
  
  if (hasPainMeds) {
    positiveEffectsExamples.push('🌿 Bessere Schmerzlinderung durch natürliche CBD-Unterstützung');
  }
  if (hasAnxietyMeds) {
    positiveEffectsExamples.push('😌 Mehr innere Ruhe und Gelassenheit im Alltag');
  }
  if (hasSleepMeds) {
    positiveEffectsExamples.push('😴 Verbesserter Schlaf und schnelleres Einschlafen');
  }
  
  // General effects
  positiveEffectsExamples.push('⚡ Mehr Energie und weniger Nebenwirkungen durch Medikamentenreduktion');
  positiveEffectsExamples.push('🧠 Klarerer Kopf und bessere Konzentration');
  
  // --- Warning Symptoms ---
  const warningSymptoms: string[] = [
    '🚨 Starker Schwindel oder Ohnmachtsgefühl',
    '💓 Herzrasen oder unregelmäßiger Herzschlag (Puls >120 in Ruhe)',
    '🤯 Starke Kopfschmerzen oder Verwirrung',
    '😰 Extreme Angst oder Panikattacken',
    '🌡️ Fieber über 38,5°C ohne erkennbare Ursache'
  ];
  
  if (personalization.hasBenzoOrOpioid) {
    warningSymptoms.push('⚠️ Krampfanfälle oder starke Muskelzuckungen (bei Benzodiazepinen/Opioiden)');
  }
  
  // --- Checkup Info ---
  const checkupInfo = {
    frequency: weeklyPlan.length <= 8 ? 'alle 2 Wochen' : 'alle 3-4 Wochen',
    parameters: [] as string[]
  };
  
  // Determine parameters based on medications
  const hasBloodPressureMeds = analysis.some(a => {
    const name = getMedicationName(a).toLowerCase();
    const category = (a.medication as MedicationWithCategory).category_name?.toLowerCase() || '';
    return name.includes('blutdruck') || category.includes('blutdruck') || 
           name.includes('beta') || name.includes('ace');
  });
  
  const hasPsychMeds = analysis.some(a => {
    const category = (a.medication as MedicationWithCategory).category_name?.toLowerCase() || '';
    return category.includes('antidepress') || category.includes('psycho') || category.includes('benzo');
  });
  
  if (hasBloodPressureMeds) {
    checkupInfo.parameters.push('Blutdruck');
    checkupInfo.parameters.push('Herzfrequenz');
  }
  
  if (hasPsychMeds) {
    checkupInfo.parameters.push('Stimmungslage');
    checkupInfo.parameters.push('Schlafqualität');
  }
  
  checkupInfo.parameters.push('Allgemeinbefinden');
  checkupInfo.parameters.push('Nebenwirkungen');
  
  // --- MEDLESS Product Notes (COSTS) ---
  const medlessProductNotes = {
    totalCost: costs.totalCost,
    costBreakdown: costs.costBreakdown
      .map(cb => `${cb.bottleCount}x ${cb.product} (${cb.totalCost.toFixed(2)} €)`)
      .join(', '),
    durationWeeks: weeklyPlan.length
  };
  
  // --- Footer Disclaimer ---
  const footerDisclaimer = 
    'Dieser Plan ist eine Empfehlung und ersetzt keine ärztliche Beratung. ' +
    'Bitte sprich mit deinem Arzt, bevor du Medikamente reduzierst oder Cannabinoide einnimmst. ' +
    'Bei Notfällen rufe sofort 112 an.';
  
  // --- Version Note ---
  const versionNote = 'MEDLESS Plan v2.0 – Erstellt mit KI-gestützter Analyse';
  
  return {
    headerTitle,
    warningBox,
    patientFacts,
    shortSummary,
    weeklyPlan: weeklyPlanSimplified,
    positiveEffectsExamples,
    warningSymptoms,
    checkupInfo,
    medlessProductNotes,
    footerDisclaimer,
    versionNote
  };
}

// ============================================================
// DOCTOR REPORT BUILDER
// ============================================================

export function buildDoctorReportData(response: AnalyzeResponse): DoctorReportData {
  const { 
    analysis, 
    maxSeverity, 
    weeklyPlan, 
    reductionGoal, 
    personalization, 
    warnings,
    categorySafety,
    planIntelligence,
    cbdProgression
  } = response;
  
  // --- Header ---
  const headerTitle = `MEDLESS-Reduktionsplan – Ärztliche Dokumentation`;
  
  // --- Patient Metadata ---
  const patientMeta = {
    firstName: personalization.firstName || 'Patient',
    age: personalization.age ? `${personalization.age}` : 'N/A',
    weight: personalization.weight ? `${personalization.weight}` : 'N/A',
    height: personalization.height ? `${personalization.height}` : 'N/A',
    bmi: personalization.bmi ? `${personalization.bmi}` : 'N/A',
    bsa: personalization.bsa ? `${personalization.bsa}` : 'N/A',
    idealWeight: personalization.idealWeightKg ? `${personalization.idealWeightKg}` : 'N/A'
  };
  
  // --- Risk Overview ---
  const criticalInteractions = analysis
    .filter(hasCriticalInteraction)
    .map(getMedicationName);
  
  const riskOverview = {
    maxSeverity,
    sensitiveMedCount: planIntelligence.sensitiveMedCount,
    totalMedCount: planIntelligence.totalMedicationCount,
    hasBenzoOrOpioid: personalization.hasBenzoOrOpioid,
    criticalInteractions
  };
  
  // --- Strategy Summary ---
  const strategySummary = {
    durationWeeks: weeklyPlan.length,
    reductionGoal,
    cbdStartMg: personalization.cbdStartMg,
    cbdEndMg: personalization.cbdEndMg,
    overallLoadReduction: planIntelligence.totalLoadReductionPct,
    reductionSpeedCategory: planIntelligence.reductionSpeedCategory
  };
  
  // --- Traffic Light Medications ---
  const trafficLightMedications = {
    critical: [] as string[],
    high: [] as string[],
    medium: [] as string[],
    low: [] as string[]
  };
  
  analysis.forEach(entry => {
    const name = getMedicationName(entry);
    const med = entry.medication as MedicationWithCategory;
    
    // Determine color based on CBD interaction strength or withdrawal risk
    const cbdStrength = med.cbd_interaction_strength;
    const withdrawalRisk = med.withdrawal_risk_score || 0;
    const interactionSeverity = entry.interactions[0]?.severity;
    
    if (cbdStrength === 'critical' || interactionSeverity === 'critical' || withdrawalRisk >= 9) {
      trafficLightMedications.critical.push(name);
    } else if (cbdStrength === 'high' || interactionSeverity === 'high' || withdrawalRisk >= 7) {
      trafficLightMedications.high.push(name);
    } else if (cbdStrength === 'medium' || interactionSeverity === 'medium' || withdrawalRisk >= 4) {
      trafficLightMedications.medium.push(name);
    } else {
      trafficLightMedications.low.push(name);
    }
  });
  
  // --- Medication Table Rows ---
  const medicationTableRows = analysis.map(entry => {
    const name = getMedicationName(entry);
    const med = entry.medication as MedicationWithCategory;
    const startDose = entry.mgPerDay;
    
    // Calculate target dose from last week
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    const targetMed = lastWeek?.medications.find(m => m.name === name);
    const targetDose = targetMed?.targetMg || startDose;
    
    const reductionPct = startDose > 0 ? ((startDose - targetDose) / startDose) * 100 : 0;
    const weeklyReductionMg = (startDose - targetDose) / weeklyPlan.length;
    
    // Half-life display
    const halfLife = med.half_life_hours 
      ? `${med.half_life_hours}h (${Math.round((med.half_life_hours * 5) / 24)}d Steady-State)`
      : 'N/A';
    
    // Withdrawal risk display
    const withdrawalRisk = med.withdrawal_risk_score 
      ? `${med.withdrawal_risk_score}/10 ${med.withdrawal_risk_score >= 7 ? '(Hoch)' : ''}`
      : 'N/A';
    
    // CBD interaction display
    const cbdInteraction = med.cbd_interaction_strength 
      ? getSeverityDisplayDE(med.cbd_interaction_strength)
      : entry.interactions[0]?.severity 
        ? getSeverityDisplayDE(entry.interactions[0].severity)
        : 'N/A';
    
    // Category rules display
    let categoryRules = 'Standard';
    if (med.can_reduce_to_zero === 0) {
      categoryRules = 'Keine Vollreduktion';
    } else if (med.max_weekly_reduction_pct) {
      categoryRules = `Max ${med.max_weekly_reduction_pct}%/Woche`;
    }
    if (med.requires_specialist === 1) {
      categoryRules += ' (Facharzt)';
    }
    
    return {
      name,
      startDose: `${startDose} mg/Tag`,
      targetDose: `${targetDose.toFixed(1)} mg/Tag`,
      reductionPct: Math.round(reductionPct * 10) / 10,
      weeklyReductionMg: Math.round(weeklyReductionMg * 10) / 10,
      halfLife,
      withdrawalRisk,
      cbdInteraction,
      categoryRules
    };
  });
  
  // --- Reduction Plan Details ---
  const reductionPlanDetails = weeklyPlan.map(week => {
    // Detect product changes
    let notes = '';
    if (week.week > 1) {
      const prevWeek = weeklyPlan[week.week - 2];
      if (prevWeek.kannasanProduct.nr !== week.kannasanProduct.nr) {
        notes = `Produktwechsel zu ${week.kannasanProduct.name}`;
      }
    }
    
    return {
      week: week.week,
      totalMedicationLoad: week.totalMedicationLoad,
      cbdDose: week.actualCbdMg,
      cannabinoidPerKg: week.cannabinoidMgPerKg,
      notes
    };
  });
  
  // --- Monitoring Recommendations ---
  const vitalSigns: string[] = ['Blutdruck', 'Herzfrequenz', 'Körpergewicht'];
  
  // Add specific parameters based on medications
  const hasLiverMeds = analysis.some(a => {
    const med = a.medication as MedicationWithCategory;
    return med.cyp450_enzyme?.includes('CYP3A4') || med.cyp450_enzyme?.includes('CYP2D6');
  });
  
  if (hasLiverMeds) {
    vitalSigns.push('Leberwerte (ALT, AST)');
  }
  
  const hasKidneyMeds = analysis.some(a => {
    const name = getMedicationName(a).toLowerCase();
    return name.includes('ace') || name.includes('sartan');
  });
  
  if (hasKidneyMeds) {
    vitalSigns.push('Nierenwerte (Kreatinin)');
  }
  
  const symptoms = [
    'Schwindel, Ohnmacht',
    'Herzrhythmusstörungen',
    'Starke Angst, Panik',
    'Schlafstörungen',
    'Magen-Darm-Beschwerden'
  ];
  
  if (personalization.hasBenzoOrOpioid) {
    symptoms.push('Krampfanfälle (bei Benzos)');
    symptoms.push('Entzugssymptome (bei Opioiden)');
  }
  
  const monitoringRecommendations = {
    frequency: weeklyPlan.length <= 8 
      ? 'Alle 2 Wochen (erste 8 Wochen), dann alle 4 Wochen'
      : 'Alle 3-4 Wochen',
    vitalSigns,
    symptoms,
    specialNotes: categorySafety.notes
  };
  
  // --- Methodology Notes ---
  const methodologyNotes = {
    cbdDosingMethod: `Gewichtsbasiert: ${cbdProgression.startMg} mg Start (0,5 mg/kg) → ${cbdProgression.endMg} mg Ziel (1,0 mg/kg)`,
    reductionMethod: 'Schrittweise Reduktion mit kategoriespezifischen Sicherheitsregeln (Halbwertszeit, Entzugsrisiko, CBD-Wechselwirkungen)',
    safetyRulesApplied: categorySafety.appliedRules,
    adjustmentsApplied: personalization.notes
  };
  
  // --- Legal Notes ---
  const legalNotes = 
    'Dieser Bericht dient ausschließlich der ärztlichen Information und Dokumentation. ' +
    'Die endgültige Therapieentscheidung liegt beim behandelnden Arzt. ' +
    'Der Plan basiert auf wissenschaftlichen Erkenntnissen zum Endocannabinoid-System und pharmakokinetischen Daten. ' +
    'Bei kritischen Wechselwirkungen ist eine engmaschige fachärztliche Begleitung erforderlich.';
  
  // --- Version Note ---
  const versionNote = 'MEDLESS Ärztebericht v2.0 – Erstellt mit KI-gestützter Pharmakokinetik-Analyse (PlanIntelligenz 2.0)';
  
  return {
    headerTitle,
    patientMeta,
    riskOverview,
    strategySummary,
    trafficLightMedications,
    medicationTableRows,
    reductionPlanDetails,
    monitoringRecommendations,
    methodologyNotes,
    legalNotes,
    versionNote
  };
}
