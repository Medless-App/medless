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
// V3 TYPE DEFINITIONS (3-LEVEL STRUCTURE)
// ============================================================

export interface DoctorReportDataV3 {
  // Patient metadata
  patientName: string;
  patientAge: number;
  patientWeight: number;
  patientGender?: string;
  durationWeeks: number;
  
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

function formatMg(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} mg`;
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
    return `${medicationName}-Spiegel↑ → Blutungsrisiko↑`;
  }
  if (lowerCategory.includes('antidepress') || lowerCategory.includes('ssri')) {
    return `${medicationName}-Spiegel↑ → Nebenwirkungsrisiko↑ (z.B. Sedierung)`;
  }
  if (lowerCategory.includes('immunsuppress') || lowerCategory.includes('immun')) {
    return `${medicationName}-Spiegel↑ → Toxizitätsrisiko↑`;
  }
  if (lowerCategory.includes('benzodiaz') || lowerCategory.includes('benzo')) {
    return `${medicationName}-Spiegel↑ → Sedierung↑, Sturzrisiko↑`;
  }
  if (lowerCategory.includes('opioid') || lowerCategory.includes('schmerz')) {
    return `${medicationName}-Spiegel↑ → Atemdepression-Risiko↑`;
  }
  if (lowerCategory.includes('antiepilep') || lowerCategory.includes('epilep')) {
    return `${medicationName}-Spiegel↑ → Toxizität↑ (Schwindel, Ataxie)`;
  }
  
  // Default fallback
  return `${medicationName}-Spiegel↑ → Nebenwirkungsrisiko↑`;
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
    withdrawal_risk_adjustment
  } = response;

  // Extract patient metadata
  const patientName = personalization?.firstName || 'Patient';
  const patientAge = personalization?.age || 0;
  const patientWeight = personalization?.weight || 0;
  const patientGender = personalization?.gender || 'unknown';
  const durationWeeks = weeklyPlan.length || 0;

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
      comment = 'Kritische Interaktion und/oder hohes Absetzrisiko - engmaschige Überwachung erforderlich';
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

    // Withdrawal Risk
    const withdrawalScore = med.withdrawal_risk_score || 0;
    const wrAdjustment = withdrawal_risk_adjustment?.medications?.find(m => m.name === name);
    const withdrawalFactor = wrAdjustment?.factor || 1.0;
    const withdrawalSlowdownPct = wrAdjustment?.reduction_slowdown_pct || 0;

    // CYP Data
    const cypProfiles = entry.cypProfiles || [];
    const hasCypData = cypProfiles.length > 0;
    const isSlower = cyp_profile?.medicationsWithSlowerEffect?.includes(name) || false;
    const isFaster = cyp_profile?.medicationsWithFasterEffect?.includes(name) || false;
    const cypEffect = isSlower ? 'slower' : isFaster ? 'faster' : 'neutral';
    
    const affectedEnzymes = cypProfiles.map(p => p.cyp_enzyme);
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
    if (isSlower && mdi) {
      const profileCount = cypProfiles.filter(p => p.cbd_effect_on_reduction === 'slower').length;
      mdiImpact = {
        contributesToMdi: true,
        role: 'Inhibitor',
        score: profileCount
      };
    } else if (isFaster && mdi) {
      const profileCount = cypProfiles.filter(p => p.cbd_effect_on_reduction === 'faster').length;
      mdiImpact = {
        contributesToMdi: true,
        role: 'Inducer',
        score: profileCount
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
      'CYP450-Enzyme: Berücksichtigung der Inhibition/Induktion von CYP1A2, CYP2C9, CYP2C19, CYP2D6, CYP3A4 durch CBD',
      'Therapeutische Bereiche: Sonderregel für Medikamente mit enger therapeutischer Breite',
      'Multi-Drug-Interaktion: Kumulative Effekte von Inhibitoren und Induktoren',
      'Absetzrisiko: Withdrawal-Risk-Score (0–10) mit bis zu 25% Reduktionsverlangsamung',
      'Medikamenten-Kategorien: Benzodiazepine, Antidepressiva, Antikoagulantien, Immunsuppressiva, Opioide, Antiepileptika',
      'Halbwertszeiten: Längere Halbwertszeit → langsamere Reduktion',
      'Patientendaten: Gewicht (kg), Alter, Geschlecht für individuelle Dosierung'
    ],
    factorsNotIncluded: [
      'Individuelle genetische Variationen (z.B. CYP2C9-Polymorphismen)',
      'Ko-Morbiditäten und Organfunktionen (Leber-/Nierenfunktion)',
      'Individuelle Verträglichkeit und subjektive Symptome',
      'Psychosoziale Faktoren und Compliance',
      'Andere Medikamente außerhalb der Datenbank',
      'Lebensgewohnheiten (Ernährung, Rauchen, Alkohol)'
    ],
    technicalNote: 'Das Modell basiert auf pharmakokinetischen Daten und allgemeinen klinischen Richtlinien. Es ist ein theoretisches Planungswerkzeug und ersetzt keine individuelle ärztliche Beurteilung. Alle Dosierungsänderungen müssen durch den behandelnden Arzt genehmigt und engmaschig überwacht werden.'
  };

  return {
    patientName,
    patientAge,
    patientWeight,
    patientGender,
    durationWeeks,
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
        comment: 'Enge therapeutische Breite, CYP-Interaktion, regelmäßige INR-Kontrollen erforderlich'
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
      additionalHints: 'Beide Medikamente erfordern engmaschige ärztliche Überwachung. Regelmäßige Kontrollen der Blutgerinnung (INR) und psychischer Befindlichkeit sind notwendig.'
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
          clinicalConsequence: 'Marcumar-Spiegel↑ → Blutungsrisiko↑'
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
        
        monitoring: 'INR-Kontrollen mindestens wöchentlich während der Reduktionsphase. Bei INR-Werten außerhalb des Zielbereichs (2,0–3,0) sofortige Dosisanpassung und ärztliche Rücksprache. Auf Blutungszeichen achten (Hämatome, Zahnfleischbluten, ungewöhnlich starke Menstruation).'
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
          clinicalConsequence: 'Fluoxetin-Spiegel↑ → Nebenwirkungsrisiko↑ (z.B. Sedierung)'
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
        
        monitoring: 'Wöchentliche Evaluation der psychischen Befindlichkeit. Auf Absetzsymptome achten: Schwindel, Kopfschmerzen, Reizbarkeit, Schlafstörungen, „Brain Zaps". Bei schweren Symptomen Reduktion pausieren und ärztliche Rücksprache.'
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
          'KRITISCHE CBD-INTERAKTION: Marcumar wird über CYP2C9 und CYP3A4 verstoffwechselt, beide Enzyme werden durch CBD gehemmt → erhöhte Marcumar-Spiegel → erhöhtes Blutungsrisiko',
          'Regelmäßige INR-Kontrollen zwingend erforderlich',
          'Reduktion auf 0% limitiert durch Kategorie-Sicherheitsregeln (Antikoagulantien)',
          'Lange Halbwertszeit (40h) ermöglicht nur langsame Anpassungen',
          'CYP-Hemmung verlangsamt Reduktion um 30%',
          'Hohes Absetzrisiko (10/10) verlangsamt Reduktion um 25%',
          'Ausschleichen erfordert Facharzt-Begleitung'
        ]
      },
      {
        medicationName: 'Prozac',
        notes: [
          'HOHE CBD-INTERAKTION: Fluoxetin ist starker CYP2D6-Inhibitor, kann andere Medikamente beeinflussen',
          'Hohes Absetzrisiko (8/10): Absetzsymptome möglich (Schwindel, Reizbarkeit, Schlafstörungen)',
          'CYP2D6-Inhibition verlangsamt Reduktion um 15%',
          'Absetzrisiko verlangsamt Reduktion um 20%',
          'Wöchentliche Evaluation der psychischen Befindlichkeit erforderlich',
          'Bei schweren Absetzsymptomen Reduktion pausieren'
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
        'Ko-Morbiditäten und Organfunktionen (Leber-/Nierenfunktion)',
        'Individuelle Verträglichkeit und subjektive Symptome',
        'Psychosoziale Faktoren und Compliance',
        'Andere Medikamente außerhalb der Datenbank',
        'Lebensgewohnheiten (Ernährung, Rauchen, Alkohol)'
      ],
      technicalNote: 'Das Modell basiert auf pharmakokinetischen Daten und allgemeinen klinischen Richtlinien. Es ist ein theoretisches Planungswerkzeug und ersetzt keine individuelle ärztliche Beurteilung. Alle Dosierungsänderungen müssen durch den behandelnden Arzt genehmigt und engmaschig überwacht werden.'
    }
  };
}
