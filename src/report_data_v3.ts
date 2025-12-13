// ============================================================
// DOCTOR REPORT DATA BUILDER V3 (3-LEVEL STRUCTURE)
// ============================================================
// Simplified, medically-focused Doctor Report structure

import type { 
  AnalyzeResponse,
  MedicationWithCategory,
  AnalysisEntry
} from './types/analyzeResponse'

// ============================================================
// IMPORTS (MEGAPROMPT COMPLIANCE)
// ============================================================
import { formatMgValue } from './utils/report_formatting';

// ============================================================
// HELPER FUNCTIONS FOR CYP DATA (NEW - MIGRATION 017/018)
// ============================================================

/**
 * Build CYP data from new Boolean fields in DB (Migration 017/018)
 * Replaces legacy cyp_profile array-based approach
 */
function buildCypDataFromDB(med: MedicationWithCategory): {
  enzymes: {
    cyp3a4: { substrate: number; inhibitor: number; inducer: number };
    cyp2d6: { substrate: number; inhibitor: number; inducer: number };
    cyp2c9: { substrate: number; inhibitor: number; inducer: number };
    cyp2c19: { substrate: number; inhibitor: number; inducer: number };
    cyp1a2: { substrate: number; inhibitor: number; inducer: number };
  };
  affectedEnzymes: string[];
  hasCypData: boolean;
} {
  const enzymes = {
    cyp3a4: {
      substrate: med.cyp3a4_substrate || 0,
      inhibitor: med.cyp3a4_inhibitor || 0,
      inducer: med.cyp3a4_inducer || 0
    },
    cyp2d6: {
      substrate: med.cyp2d6_substrate || 0,
      inhibitor: med.cyp2d6_inhibitor || 0,
      inducer: med.cyp2d6_inducer || 0
    },
    cyp2c9: {
      substrate: med.cyp2c9_substrate || 0,
      inhibitor: med.cyp2c9_inhibitor || 0,
      inducer: med.cyp2c9_inducer || 0
    },
    cyp2c19: {
      substrate: med.cyp2c19_substrate || 0,
      inhibitor: med.cyp2c19_inhibitor || 0,
      inducer: med.cyp2c19_inducer || 0
    },
    cyp1a2: {
      substrate: med.cyp1a2_substrate || 0,
      inhibitor: med.cyp1a2_inhibitor || 0,
      inducer: med.cyp1a2_inducer || 0
    }
  };

  // Collect affected enzymes (any enzyme with substrate=1 or inhibitor=1 or inducer=1)
  const affectedEnzymes: string[] = [];
  
  if (enzymes.cyp3a4.substrate || enzymes.cyp3a4.inhibitor || enzymes.cyp3a4.inducer) {
    affectedEnzymes.push('CYP3A4');
  }
  if (enzymes.cyp2d6.substrate || enzymes.cyp2d6.inhibitor || enzymes.cyp2d6.inducer) {
    affectedEnzymes.push('CYP2D6');
  }
  if (enzymes.cyp2c9.substrate || enzymes.cyp2c9.inhibitor || enzymes.cyp2c9.inducer) {
    affectedEnzymes.push('CYP2C9');
  }
  if (enzymes.cyp2c19.substrate || enzymes.cyp2c19.inhibitor || enzymes.cyp2c19.inducer) {
    affectedEnzymes.push('CYP2C19');
  }
  if (enzymes.cyp1a2.substrate || enzymes.cyp1a2.inhibitor || enzymes.cyp1a2.inducer) {
    affectedEnzymes.push('CYP1A2');
  }

  return {
    enzymes,
    affectedEnzymes,
    hasCypData: affectedEnzymes.length > 0
  };
}

// ============================================================
// V3 TYPE DEFINITIONS (3-LEVEL STRUCTURE)
// ============================================================

export interface DoctorReportDataV3 {
  // Patient metadata
  patientName: string;
  patientAge: number;
  patientWeight: number;
  patientGender?: string;
  liverFunction?: string;    // NEW: Organ function
  kidneyFunction?: string;   // NEW: Organ function
  durationWeeks: number;
  
  // CBD Progression (MEGAPROMPT REGEL 1: Must be consistent everywhere)
  cbdProgression: {
    startMg: number;
    endMg: number;
    weeklyIncrease: number;
    startMgPerKg: number;
    endMgPerKg: number;
  };
  
  // Reduction Summary (MEGAPROMPT REGEL 2.2: Theoretical vs. Actual)
  reductionSummary?: {
    theoreticalTargetPercent: number;
    actualReductionPercent: number;
    medications: Array<{
      name: string;
      startMg: number;
      endMg: number;
      reductionPercent: number;
    }>;
  };
  
  // Level 1: Overview
  overviewMedications: OverviewMedication[];
  globalRisk: GlobalRisk;
  
  // Level 2: Per-medication details
  medicationDetails: MedicationDetail[];
  
  // Level 3: Appendix
  cypDetails: CypDetail[];
  fullSafetyNotes: SafetyNotes[];
  modelInfo: ModelInfo;
}

export interface OverviewMedication {
  name: string;
  genericName: string;
  category: string;
  startDose: string;
  targetDose: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  comment: string;
}

export interface GlobalRisk {
  multiDrugInteraction: {
    level: string;
    inhibitorsCount: number;
    inducersCount: number;
    adjustmentFactor: number;
    warning?: string;
  };
  additionalHints?: string;
}

export interface MedicationDetail {
  name: string;
  genericName: string;
  category: string;
  startDose: string;
  targetDose: string;
  maxWeeklyReductionPct: number; // ← CRITICAL: Must come from analysis data
  
  // NEW V1: Safety Flags (Step 7/7)
  twoPercentFloorApplied?: boolean; // ← CRITICAL: 2% floor applied flag (for PDF warning)
  
  // NEW: Raw DB Values (Basiswerte für Arztbericht)
  rawData: {
    halfLifeHours: number | null;
    categoryId: number | null;
    withdrawalScore: number | null;
  };
  
  // NEW: CYP Enzymes (Detailed Table)
  cypEnzymes: {
    cyp3a4: { substrate: number; inhibitor: number; inducer: number };
    cyp2d6: { substrate: number; inhibitor: number; inducer: number };
    cyp2c9: { substrate: number; inhibitor: number; inducer: number };
    cyp2c19: { substrate: number; inhibitor: number; inducer: number };
    cyp1a2: { substrate: number; inhibitor: number; inducer: number };
  };
  
  // NEW: Calculation Factors (MEDLESS-Formel Zerlegung)
  calculationFactors?: {
    baseReductionPct: number;
    categoryLimit: number | null;
    halfLifeFactor: number;
    cypFactor: number;
    therapeuticWindowFactor: number;
    withdrawalFactor: number;
    interactionFactor: number;
    finalFactor: number;
  };
  
  withdrawalRisk: {
    score: number;
    factor: number;
    slowdownPct: number;
  };
  
  cypData: {
    hasCypData: boolean;
    affectedEnzymes: string[];
    effectType: 'slower' | 'faster' | 'neutral';
    adjustmentFactor: number;
    slowdownPct: number;
    clinicalConsequence?: string; // ← NEW: Clinical impact description
  };
  
  therapeuticRange: {
    hasRange: boolean;
    minValue: string;
    maxValue: string;
    unit: string;
    isNarrow: boolean;
    adjustmentFactor: number;
    slowdownPct: number;
  };
  
  mdiImpact: {
    contributesToMdi: boolean;
    role: string;
    score: number;
  };
  
  monitoring: string;
}

export interface CypDetail {
  medicationName: string;
  profiles: {
    enzyme: string;
    role: string;
    cbdEffect: string;
    reductionImpact: string;
  }[];
}

export interface SafetyNotes {
  medicationName: string;
  notes: string[];
}

export interface ModelInfo {
  version: string;
  factorsIncluded: string[];
  factorsNotIncluded: string[];
  technicalNote: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getMedicationName(entry: AnalysisEntry): string {
  return entry.medication?.name || 'Unbekannt';
}

/**
 * MEGAPROMPT REGEL 4: Format mg values consistently
 * Uses imported formatMgValue from utils/report_formatting
 * Legacy wrapper for backwards compatibility
 */
function formatMg(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return formatMgValue(value).replace(' täglich', ''); // Remove 'täglich' for table use
}

function determineRiskLevel(
  med: MedicationWithCategory,
  interactionSeverity: string | undefined,
  withdrawalScore: number
): 'critical' | 'high' | 'medium' | 'low' {
  const cbdStrength = med.cbd_interaction_strength;
  
  if (cbdStrength === 'critical' || interactionSeverity === 'critical' || withdrawalScore >= 9) {
    return 'critical';
  }
  if (cbdStrength === 'high' || interactionSeverity === 'high' || withdrawalScore >= 7) {
    return 'high';
  }
  if (cbdStrength === 'medium' || interactionSeverity === 'medium' || withdrawalScore >= 4) {
    return 'medium';
  }
  return 'low';
}

/**
 * Get clinical consequence description based on medication category
 * Used for CYP interaction explanations
 */
function getClinicalConsequence(category: string, medicationName: string): string {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('antikoagul') || lowerCategory.includes('blut')) {
    return `Erhöhter ${medicationName}-Wirkspiegel mit gesteigertem Blutungsrisiko. Engmaschige INR-Kontrollen sind empfohlen.`;
  }
  if (lowerCategory.includes('antidepress') || lowerCategory.includes('ssri')) {
    return `Erhöhter ${medicationName}-Wirkspiegel. Es sollte auf zentralnervöse Nebenwirkungen (z.B. Sedierung, Schwindel) geachtet werden.`;
  }
  if (lowerCategory.includes('immunsuppress') || lowerCategory.includes('immun')) {
    return `Erhöhter ${medicationName}-Wirkspiegel mit potenziellem Toxizitätsrisiko. Regelmäßige Spiegelkontrollen sind sinnvoll.`;
  }
  if (lowerCategory.includes('benzodiaz') || lowerCategory.includes('benzo')) {
    return `Erhöhter ${medicationName}-Wirkspiegel. Es besteht ein erhöhtes Risiko für Sedierung und Stürze, insbesondere bei älteren Patienten.`;
  }
  if (lowerCategory.includes('opioid') || lowerCategory.includes('schmerz')) {
    return `Erhöhter ${medicationName}-Wirkspiegel. Es sollte auf Zeichen einer Atemdepression geachtet werden.`;
  }
  if (lowerCategory.includes('antiepilep') || lowerCategory.includes('epilep')) {
    return `Erhöhter ${medicationName}-Wirkspiegel mit möglichen neurologischen Symptomen (Schwindel, Ataxie, Koordinationsstörungen).`;
  }
  
  // Default fallback
  return `Erhöhter ${medicationName}-Wirkspiegel. Eine klinische Verlaufsbeobachtung ist empfohlen.`;
}

function determineWithdrawalLevel(score: number): 'niedrig' | 'mittel' | 'hoch' {
  if (score >= 7) return 'hoch';
  if (score >= 4) return 'mittel';
  return 'niedrig';
}

// ============================================================
// MAIN BUILDER FUNCTION (3-LEVEL STRUCTURE)
// ============================================================

/**
 * Build Doctor Report V3 data from AnalyzeResponse
 * 
 * CRITICAL DATA MAPPINGS:
 * - maxWeeklyReductionPct: entry.max_weekly_reduction_pct (from backend calculation)
 * - Patient data: personalization object
 * - CYP data: cyp_profile + entry.cypProfiles
 * - Withdrawal: withdrawal_risk_adjustment
 * - MDI: multi_drug_interaction
 */
export function buildDoctorReportDataV3(response: AnalyzeResponse): DoctorReportDataV3 {
  const {
    analysis,
    weeklyPlan,
    personalization,
    cyp_profile,
    therapeutic_range,
    multi_drug_interaction,
    withdrawal_risk_adjustment,
    cbdProgression,
    reductionGoal
  } = response;

  // Extract patient metadata
  const patientName = personalization?.firstName || 'Patient';
  const patientAge = personalization?.age || 0;
  const patientWeight = personalization?.weight || 0;
  const patientGender = personalization?.gender || 'unknown';
  const liverFunction = personalization?.liverFunction || 'normal';    // NEW
  const kidneyFunction = personalization?.kidneyFunction || 'normal';  // NEW
  const durationWeeks = weeklyPlan.length || 0;
  
  // MEGAPROMPT REGEL 1: Extract CBD progression (must be consistent everywhere)
  const cbdStart = cbdProgression?.startMg || personalization?.cbdStartMg || 0;
  const cbdEnd = cbdProgression?.endMg || personalization?.cbdEndMg || 0;
  const cbdWeeklyInc = cbdProgression?.weeklyIncrease || ((cbdEnd - cbdStart) / durationWeeks);
  const cbdStartPerKg = patientWeight > 0 ? cbdStart / patientWeight : 0;
  const cbdEndPerKg = patientWeight > 0 ? cbdEnd / patientWeight : 0;

  // ============================================================
  // LEVEL 1: OVERVIEW
  // ============================================================

  const overviewMedications: OverviewMedication[] = analysis.map(entry => {
    const med = entry.medication as MedicationWithCategory;
    const name = getMedicationName(entry);
    const genericName = med.generic_name || '–';
    const category = med.category_name || 'Allgemeine Medikation';
    const startDoseMg = entry.mgPerDay || 0;
    
    // Find target dose from last week
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    const targetMed = lastWeek?.medications.find((m: any) => m.name === name);
    const targetDoseMg = targetMed?.targetMg || startDoseMg;
    
    const withdrawalScore = med.withdrawal_risk_score || 0;
    const interactionSeverity = entry.interactions[0]?.severity;
    const riskLevel = determineRiskLevel(med, interactionSeverity, withdrawalScore);
    
    // Generate short comment
    const hasCyp = cyp_profile?.medicationsWithSlowerEffect?.includes(name) || 
                   cyp_profile?.medicationsWithFasterEffect?.includes(name);
    const hasNarrowTR = therapeutic_range?.medicationsWithNarrowWindow?.includes(name);
    
    let comment = '';
    if (riskLevel === 'critical') {
      comment = 'Kritische Interaktion und/oder hohes Absetzrisiko. Engmaschige klinische Überwachung ist erforderlich.';
    } else if (hasCyp && withdrawalScore >= 7) {
      comment = 'Langsames Ausschleichen wegen CYP-Hemmung & hohem Absetzrisiko';
    } else if (hasNarrowTR) {
      comment = 'Enges therapeutisches Fenster - vorsichtige Dosisanpassung';
    } else if (withdrawalScore >= 7) {
      comment = 'Hohes Absetzrisiko - langsame Reduktion empfohlen';
    } else if (hasCyp) {
      comment = 'CYP-Interaktion berücksichtigt - Reduktion angepasst';
    } else {
      comment = 'Standard-Risiko, keine kritischen Interaktionen bekannt';
    }

    return {
      name,
      genericName,
      category,
      startDose: `${formatMg(startDoseMg)} täglich`,
      targetDose: `${formatMg(targetDoseMg)} täglich`,
      riskLevel,
      comment
    };
  });

  // Global Risk (MDI)
  const mdi = multi_drug_interaction;
  const globalRisk: GlobalRisk = {
    multiDrugInteraction: {
      level: mdi?.level || 'none',
      inhibitorsCount: mdi?.inhibitors || 0,
      inducersCount: mdi?.inducers || 0,
      adjustmentFactor: mdi?.adjustment_factor || 1.0,
      warning: mdi?.level === 'severe' 
        ? 'Schwere Multi-Drug-Interaktion: Engmaschige ärztliche Begleitung dringend empfohlen'
        : mdi?.level === 'moderate'
        ? 'Mittlere Multi-Drug-Interaktion: Regelmäßige ärztliche Kontrollen empfohlen'
        : mdi?.level === 'mild'
        ? 'Leichte Multi-Drug-Interaktion: Monitoring empfohlen'
        : undefined
    },
    additionalHints: analysis.length > 1 
      ? 'Mehrere Medikamente erfordern koordinierte Reduktion und regelmäßige ärztliche Überwachung.'
      : undefined
  };

  // ============================================================
  // LEVEL 2: MEDICATION DETAILS
  // ============================================================

  const medicationDetails: MedicationDetail[] = analysis.map(entry => {
    const med = entry.medication as MedicationWithCategory;
    const name = getMedicationName(entry);
    const genericName = med.generic_name || '–';
    const category = med.category_name || 'Allgemeine Medikation';
    const startDoseMg = entry.mgPerDay || 0;
    
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    const targetMed = lastWeek?.medications.find((m: any) => m.name === name);
    const targetDoseMg = targetMed?.targetMg || startDoseMg;
    
    // CRITICAL: Extract max_weekly_reduction_pct from entry
    // This comes from the backend calculation (after all safety adjustments)
    const maxWeeklyReductionPct = entry.max_weekly_reduction_pct || 0;

    // NEW: Raw DB Values (Basiswerte)
    const rawData = {
      halfLifeHours: med.half_life_hours || null,
      categoryId: med.category_id || null,
      withdrawalScore: med.withdrawal_risk_score || null
    };

    // NEW: Build CYP Enzymes from DB Boolean fields
    const cypFromDB = buildCypDataFromDB(med);
    const cypEnzymes = cypFromDB.enzymes;

    // NEW: Calculation Factors (from entry.calculationFactors if available)
    const calculationFactors = entry.calculationFactors || undefined;

    // Withdrawal Risk
    const withdrawalScore = med.withdrawal_risk_score || 0;
    const wrAdjustment = withdrawal_risk_adjustment?.medications?.find(m => m.name === name);
    const withdrawalFactor = wrAdjustment?.factor || 1.0;
    const withdrawalSlowdownPct = wrAdjustment?.reduction_slowdown_pct || 0;

    // CYP Data (Legacy + New)
    const cypProfiles = entry.cypProfiles || [];
    const hasCypData = cypFromDB.hasCypData || cypProfiles.length > 0;
    const isSlower = cyp_profile?.medicationsWithSlowerEffect?.includes(name) || false;
    const isFaster = cyp_profile?.medicationsWithFasterEffect?.includes(name) || false;
    const cypEffect = isSlower ? 'slower' : isFaster ? 'faster' : 'neutral';
    
    const affectedEnzymes = cypFromDB.affectedEnzymes.length > 0 
      ? cypFromDB.affectedEnzymes 
      : cypProfiles.map(p => p.cyp_enzyme);
    const cypAdjustmentFactor = isSlower ? 0.7 : isFaster ? 1.15 : 1.0;
    const cypSlowdownPct = isSlower ? 30 : isFaster ? -15 : 0;
    
    // NEW: Clinical consequence for CYP interaction
    const clinicalConsequence = hasCypData 
      ? getClinicalConsequence(category, name)
      : undefined;

    // Therapeutic Range
    const trData = therapeutic_range?.medications?.find(m => m.name === name);
    const hasTherapeuticRange = trData?.has_range || false;
    const isNarrowWindow = trData?.is_narrow_window || false;
    const trAdjustmentFactor = isNarrowWindow ? 0.8 : 1.0;
    const trSlowdownPct = isNarrowWindow ? 20 : 0;

    // MDI Impact
    let mdiImpact: MedicationDetail['mdiImpact'];
    
    // NEW: Determine MDI role from CYP Boolean fields
    const isInhibitor = cypEnzymes.cyp3a4.inhibitor || cypEnzymes.cyp2d6.inhibitor || 
                        cypEnzymes.cyp2c9.inhibitor || cypEnzymes.cyp2c19.inhibitor || 
                        cypEnzymes.cyp1a2.inhibitor;
    const isInducer = cypEnzymes.cyp3a4.inducer || cypEnzymes.cyp2d6.inducer || 
                      cypEnzymes.cyp2c9.inducer || cypEnzymes.cyp2c19.inducer || 
                      cypEnzymes.cyp1a2.inducer;
    
    if (isInhibitor && mdi) {
      mdiImpact = {
        contributesToMdi: true,
        role: 'Inhibitor',
        score: (cypEnzymes.cyp3a4.inhibitor + cypEnzymes.cyp2d6.inhibitor + 
                cypEnzymes.cyp2c9.inhibitor + cypEnzymes.cyp2c19.inhibitor + 
                cypEnzymes.cyp1a2.inhibitor)
      };
    } else if (isInducer && mdi) {
      mdiImpact = {
        contributesToMdi: true,
        role: 'Inducer',
        score: (cypEnzymes.cyp3a4.inducer + cypEnzymes.cyp2d6.inducer + 
                cypEnzymes.cyp2c9.inducer + cypEnzymes.cyp2c19.inducer + 
                cypEnzymes.cyp1a2.inducer)
      };
    } else {
      mdiImpact = {
        contributesToMdi: false,
        role: 'Keine',
        score: 0
      };
    }

    // Monitoring Recommendations
    let monitoring = '';
    if (withdrawalScore >= 7) {
      monitoring += 'Auf Entzugssymptome achten (Unruhe, Schlafstörungen, Rebound). ';
    }
    if (med.cbd_interaction_strength === 'critical' || med.cbd_interaction_strength === 'high') {
      monitoring += 'Wöchentliche Kontrollen in den ersten 4 Wochen empfohlen. ';
    }
    if (isNarrowWindow || med.therapeutic_min_ng_ml) {
      monitoring += 'Regelmäßige Spiegelkontrollen erwägen (falls verfügbar). ';
    }
    if (!monitoring) {
      monitoring = 'Alle 2-4 Wochen Kontrolltermin. Bei Symptomen: Frühere Wiedervorstellung.';
    }

    return {
      name,
      genericName,
      category,
      startDose: `${formatMg(startDoseMg)} täglich`,
      targetDose: `${formatMg(targetDoseMg)} täglich`,
      maxWeeklyReductionPct, // ← FROM entry.max_weekly_reduction_pct
      
      twoPercentFloorApplied: entry.twoPercentFloorApplied || false, // ← NEW V1: 2% floor flag
      
      rawData, // ← NEW: Basiswerte
      cypEnzymes, // ← NEW: CYP Enzyme Boolean Table
      calculationFactors, // ← NEW: Calculation Factors
      
      withdrawalRisk: {
        score: withdrawalScore,
        factor: withdrawalFactor,
        slowdownPct: withdrawalSlowdownPct
      },
      
      cypData: {
        hasCypData,
        affectedEnzymes,
        effectType: cypEffect,
        adjustmentFactor: cypAdjustmentFactor,
        slowdownPct: cypSlowdownPct,
        clinicalConsequence // ← NEW
      },
      
      therapeuticRange: {
        hasRange: hasTherapeuticRange,
        minValue: trData?.min_ng_ml?.toString() || '',
        maxValue: trData?.max_ng_ml?.toString() || '',
        unit: trData?.unit || 'ng/ml',
        isNarrow: isNarrowWindow,
        adjustmentFactor: trAdjustmentFactor,
        slowdownPct: trSlowdownPct
      },
      
      mdiImpact,
      monitoring
    };
  });

  // ============================================================
  // LEVEL 3: APPENDIX
  // ============================================================

  // CYP Details (tables)
  const cypDetails: CypDetail[] = analysis
    .filter(entry => entry.cypProfiles && entry.cypProfiles.length > 0)
    .map(entry => {
      const name = getMedicationName(entry);
      const profiles = (entry.cypProfiles || []).map(prof => ({
        enzyme: prof.cyp_enzyme,
        role: prof.role,
        cbdEffect: prof.cbd_effect_on_reduction === 'slower' ? 'Inhibition' : 'Induktion',
        reductionImpact: prof.cbd_effect_on_reduction === 'slower' 
          ? 'Langsamer (-30%)' 
          : 'Schneller (+15%)'
      }));
      
      return {
        medicationName: name,
        profiles
      };
    });

  // Full Safety Notes (from week 1)
  const fullSafetyNotes: SafetyNotes[] = analysis.map(entry => {
    const name = getMedicationName(entry);
    const firstWeek = weeklyPlan[0];
    const medInWeek = firstWeek?.medications.find((m: any) => m.name === name);
    const notes = medInWeek?.safety?.notes || [];
    
    return {
      medicationName: name,
      notes
    };
  });

  // Model Info
  const modelInfo: ModelInfo = {
    version: 'PlanIntelligenz 3.0',
    factorsIncluded: [
      'CYP450-Enzymsystem: Pharmakokinetische Berücksichtigung der Inhibition/Induktion von CYP1A2, CYP2C9, CYP2C19, CYP2D6, CYP3A4 durch Cannabidiol',
      'Therapeutische Breite: Anpassung der Reduktionsgeschwindigkeit bei Medikamenten mit engem therapeutischem Fenster',
      'Arzneimittelinteraktionen: Berücksichtigung kumulativer Effekte von Enzyminhibitoren und -induktoren',
      'Absetzrisiko-Quantifizierung: Withdrawal-Risk-Score (0–10) mit bis zu 25% Verlangsamung der Dosisreduktion',
      'Medikamentenklassen: Benzodiazepine, Antidepressiva, Antikoagulanzien, Immunsuppressiva, Opioide, Antiepileptika mit jeweils spezifischen Sicherheitsregeln',
      'Pharmakokinetische Halbwertszeit: Längere Halbwertszeit resultiert in langsamerer Dosisreduktion',
      'Patientenspezifische Parameter: Körpergewicht, Alter, Geschlecht zur individuellen Dosisanpassung'
    ],
    factorsNotIncluded: [
      'Pharmakogenetische Variationen (z.B. CYP2C9/CYP2D6-Polymorphismen)',
      'Komorbiditäten und Organfunktionsstörungen (hepatische/renale Insuffizienz)',
      'Individuelle Medikamentenverträglichkeit und subjektive Symptomatik',
      'Psychosoziale Faktoren und Therapieadhärenz',
      'Begleitmedikation außerhalb der erfassten Datenbank',
      'Lebensstilfaktoren (Ernährung, Nikotinkonsum, Alkoholkonsum)'
    ],
    technicalNote: 'Dieses Modell basiert auf pharmakokinetischen Daten und aktuellen klinischen Leitlinien. Es stellt ein rechnergestütztes Planungsinstrument dar und ersetzt nicht die individuelle klinische Beurteilung. Alle Dosierungsanpassungen sollten unter Berücksichtigung der individuellen Patientensituation erfolgen und bedürfen der klinischen Überwachung.'
  };

  // MEGAPROMPT REGEL 2.2: Build reduction summary (theoretical vs. actual)
  const reductionSummary = reductionGoal ? {
    theoreticalTargetPercent: reductionGoal,
    actualReductionPercent: analysis.map(entry => {
      const startMg = entry.mgPerDay || 0;
      const lastWeek = weeklyPlan[weeklyPlan.length - 1];
      const targetMed = lastWeek?.medications.find((m: any) => m.name === getMedicationName(entry));
      const endMg = targetMed?.targetMg || startMg;
      return Math.round(((startMg - endMg) / startMg) * 100);
    }).reduce((sum, pct) => sum + pct, 0) / analysis.length,
    medications: analysis.map(entry => {
      const name = getMedicationName(entry);
      const startMg = entry.mgPerDay || 0;
      const lastWeek = weeklyPlan[weeklyPlan.length - 1];
      const targetMed = lastWeek?.medications.find((m: any) => m.name === name);
      const endMg = targetMed?.targetMg || startMg;
      return {
        name,
        startMg,
        endMg,
        reductionPercent: Math.round(((startMg - endMg) / startMg) * 100)
      };
    })
  } : undefined;

  return {
    patientName,
    patientAge,
    patientWeight,
    patientGender,
    liverFunction,    // NEW
    kidneyFunction,   // NEW
    durationWeeks,
    // MEGAPROMPT REGEL 1: CBD Progression
    cbdProgression: {
      startMg: Math.round(cbdStart * 10) / 10,
      endMg: Math.round(cbdEnd * 10) / 10,
      weeklyIncrease: Math.round(cbdWeeklyInc * 10) / 10,
      startMgPerKg: Math.round(cbdStartPerKg * 100) / 100,
      endMgPerKg: Math.round(cbdEndPerKg * 100) / 100
    },
    // MEGAPROMPT REGEL 2.2: Reduction Summary
    reductionSummary,
    overviewMedications,
    globalRisk,
    medicationDetails,
    cypDetails,
    fullSafetyNotes,
    modelInfo
  };
}
/**
 * Example/Test data for Doctor Report V3
 * For testing the 3-level structure without real analysis data
 */
export function getDoctorReportV3Example(): DoctorReportDataV3 {
  return {
    patientName: 'Max Mustermann',
    patientAge: 65,
    patientWeight: 75,
    durationWeeks: 8,
    
    overviewMedications: [
      {
        name: 'Marcumar',
        genericName: 'Warfarin',
        category: 'Antikoagulans',
        startDose: '5 mg täglich',
        targetDose: '2,5 mg täglich',
        riskLevel: 'critical',
        comment: 'Enge therapeutische Breite mit CYP-basierter Interaktion. Regelmäßige INR-Kontrollen sind erforderlich'
      },
      {
        name: 'Prozac',
        genericName: 'Fluoxetin',
        category: 'SSRI Antidepressivum',
        startDose: '20 mg täglich',
        targetDose: '10 mg täglich',
        riskLevel: 'high',
        comment: 'Hohes Absetzrisiko (Score 8/10), CYP2D6-Inhibitor'
      }
    ],
    
    globalRisk: {
      multiDrugInteraction: {
        level: 'moderate',
        inhibitorsCount: 2,
        inducersCount: 0,
        adjustmentFactor: 0.8,
        warning: 'Moderate Multi-Drug-Interaktion: 2 Inhibitoren → 20% langsamere Reduktion empfohlen'
      },
      additionalHints: 'Die Kombination dieser Medikamente sollte eine engmaschige klinische Überwachung erfolgen, einschließlich regelmäßiger INR-Kontrollen und Evaluation der psychischen Befindlichkeit.'
    },
    
    medicationDetails: [
      {
        name: 'Marcumar',
        genericName: 'Warfarin',
        category: 'Antikoagulans (Vitamin-K-Antagonist)',
        startDose: '5 mg täglich',
        targetDose: '2,5 mg täglich',
        maxWeeklyReductionPct: 5,
        
        withdrawalRisk: {
          score: 10,
          factor: 0.75,
          slowdownPct: 25
        },
        
        cypData: {
          hasCypData: true,
          affectedEnzymes: ['CYP2C9', 'CYP3A4'],
          effectType: 'slower',
          adjustmentFactor: 0.7,
          slowdownPct: 30,
          clinicalConsequence: 'Erhöhter Marcumar-Wirkspiegel mit gesteigertem Blutungsrisiko. Engmaschige INR-Kontrollen sind empfohlen.'
        },
        
        therapeuticRange: {
          hasRange: true,
          minValue: '2,0',
          maxValue: '3,0',
          unit: 'INR',
          isNarrow: true,
          adjustmentFactor: 0.75,
          slowdownPct: 25
        },
        
        mdiImpact: {
          contributesToMdi: true,
          role: 'Inhibitor',
          score: 3
        },
        
        monitoring: 'INR-Kontrollen mindestens wöchentlich während der Reduktionsphase. Bei INR-Werten außerhalb des therapeutischen Bereichs (2,0–3,0) sollte eine umgehende Dosisanpassung erfolgen. Es sollte auf klinische Blutungszeichen geachtet werden (Hämatome, Zahnfleischbluten, verstärkte Menstruationsblutung).'
      },
      {
        name: 'Prozac',
        genericName: 'Fluoxetin',
        category: 'SSRI Antidepressivum',
        startDose: '20 mg täglich',
        targetDose: '10 mg täglich',
        maxWeeklyReductionPct: 8,
        
        withdrawalRisk: {
          score: 8,
          factor: 0.8,
          slowdownPct: 20
        },
        
        cypData: {
          hasCypData: true,
          affectedEnzymes: ['CYP2D6'],
          effectType: 'slower',
          adjustmentFactor: 0.85,
          slowdownPct: 15,
          clinicalConsequence: 'Erhöhter Fluoxetin-Wirkspiegel. Es sollte auf zentralnervöse Nebenwirkungen (z.B. Sedierung, Schwindel) geachtet werden.'
        },
        
        therapeuticRange: {
          hasRange: false,
          minValue: '',
          maxValue: '',
          unit: '',
          isNarrow: false,
          adjustmentFactor: 1,
          slowdownPct: 0
        },
        
        mdiImpact: {
          contributesToMdi: true,
          role: 'Inhibitor',
          score: 2
        },
        
        monitoring: 'Wöchentliche Evaluation der psychischen Befindlichkeit. Es sollte auf Absetzsymptome geachtet werden (z.B. Schwindel, Kopfschmerzen, Reizbarkeit, Schlafstörungen, parästhesieähnliche Empfindungen). Bei ausgeprägter Symptomatik ist eine Pausierung der Dosisreduktion sinnvoll.'
      }
    ],
    
    cypDetails: [
      {
        medicationName: 'Marcumar (Warfarin)',
        profiles: [
          {
            enzyme: 'CYP2C9',
            role: 'Major Substrate',
            cbdEffect: 'Inhibition',
            reductionImpact: 'Langsamer (-30%)'
          },
          {
            enzyme: 'CYP3A4',
            role: 'Minor Substrate',
            cbdEffect: 'Inhibition',
            reductionImpact: 'Langsamer (-10%)'
          }
        ]
      },
      {
        medicationName: 'Prozac (Fluoxetin)',
        profiles: [
          {
            enzyme: 'CYP2D6',
            role: 'Strong Inhibitor',
            cbdEffect: 'Keine direkte Interaktion',
            reductionImpact: 'Leicht langsamer (-15%)'
          }
        ]
      }
    ],
    
    fullSafetyNotes: [
      {
        medicationName: 'Marcumar',
        notes: [
          'Kritische pharmakokinetische Interaktion: Marcumar wird über CYP2C9 und CYP3A4 metabolisiert. Beide Enzyme werden durch CBD gehemmt, was zu erhöhten Wirkspiegeln und gesteigertem Blutungsrisiko führen kann',
          'Regelmäßige INR-Kontrollen sind zwingend erforderlich',
          'Dosisreduktion auf 0% limitiert durch kategoriespezifische Sicherheitsregeln (Antikoagulanzien)',
          'Lange Halbwertszeit (40h) bedingt langsame Anpassungskinetik',
          'CYP-basierte Inhibition verlangsamt Reduktion um 30%',
          'Hohes Absetzrisiko (Score 10/10) resultiert in 25% Verlangsamung der Dosisreduktion',
          'Ausschleichen sollte unter fachärztlicher Begleitung erfolgen'
        ]
      },
      {
        medicationName: 'Prozac',
        notes: [
          'Hohe pharmakokinetische Interaktion: Fluoxetin ist ein potenter CYP2D6-Inhibitor und kann die Metabolisierung anderer Medikamente beeinflussen',
          'Hohes Absetzrisiko (Score 8/10): Absetzsymptome sind möglich (z.B. Schwindel, Reizbarkeit, Schlafstörungen)',
          'CYP2D6-basierte Inhibition verlangsamt Reduktion um 15%',
          'Absetzrisiko resultiert in 20% Verlangsamung der Dosisreduktion',
          'Wöchentliche Evaluation der psychischen Befindlichkeit ist erforderlich',
          'Bei ausgeprägter Absetzsymptomatik sollte die Dosisreduktion pausiert werden'
        ]
      }
    ],
    
    modelInfo: {
      version: 'PlanIntelligenz 3.0',
      factorsIncluded: [
        'CYP450-Enzyme (P0 #1): Berücksichtigung der Inhibition/Induktion von CYP1A2, CYP2C9, CYP2C19, CYP2D6, CYP3A4 durch CBD',
        'Therapeutische Bereiche (P0 #2): Sonderregel für Medikamente mit enger therapeutischer Breite',
        'Multi-Drug-Interaktion (P1 #3): Kumulative Effekte von Inhibitoren und Induktoren',
        'Absetzrisiko-Quantifizierung (P1 #4): Withdrawal-Risk-Score (0–10) mit 25% maximaler Verlangsamung',
        'Medikamenten-Kategorien: Benzodiazepine, Antidepressiva, Antikoagulantien, Immunsuppressiva, Opioide, Antiepileptika',
        'Halbwertszeiten: Längere Halbwertszeit → langsamere Reduktion',
        'Patientendaten: Gewicht (kg), Alter, Geschlecht für individuelle Dosierung'
      ],
      factorsNotIncluded: [
        'Individuelle genetische Variationen (z.B. CYP2C9-Polymorphismen)',
        'Komorbiditäten und Organfunktionsstörungen (hepatische/renale Insuffizienz)',
        'Individuelle Verträglichkeit und subjektive Symptome',
        'Psychosoziale Faktoren und Compliance',
        'Andere Medikamente außerhalb der Datenbank',
        'Lebensgewohnheiten (Ernährung, Rauchen, Alkohol)'
      ],
      technicalNote: 'Das Modell basiert auf pharmakokinetischen Daten und allgemeinen klinischen Richtlinien. Es ist ein theoretisches Planungswerkzeug und ersetzt keine individuelle ärztliche Beurteilung. Alle Dosierungsänderungen müssen durch den behandelnden Arzt genehmigt und engmaschig überwacht werden.'
    }
  };
}
