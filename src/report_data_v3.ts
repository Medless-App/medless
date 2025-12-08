// ============================================================
// DOCTOR REPORT DATA BUILDER V3 (3-LEVEL STRUCTURE)
// ============================================================
// Simplified, medically-focused Doctor Report structure

import type { 
  AnalyzeResponse,
  MedicationWithCategory,
  AnalysisEntry
} from './types/analyzeResponse'

import type {
  DoctorReportData,
  DoctorReportOverviewMedication,
  DoctorReportGlobalRisk,
  DoctorReportMedicationDetail,
  DoctorReportModelInfo,
  DoctorReportCypDetail
} from './report_data'

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
): 'niedrig' | 'mittel' | 'hoch' | 'kritisch' {
  const cbdStrength = med.cbd_interaction_strength;
  
  if (cbdStrength === 'critical' || interactionSeverity === 'critical' || withdrawalScore >= 9) {
    return 'kritisch';
  }
  if (cbdStrength === 'high' || interactionSeverity === 'high' || withdrawalScore >= 7) {
    return 'hoch';
  }
  if (cbdStrength === 'medium' || interactionSeverity === 'medium' || withdrawalScore >= 4) {
    return 'mittel';
  }
  return 'niedrig';
}

function determineWithdrawalLevel(score: number): 'niedrig' | 'mittel' | 'hoch' {
  if (score >= 7) return 'hoch';
  if (score >= 4) return 'mittel';
  return 'niedrig';
}

// ============================================================
// MAIN BUILDER FUNCTION (3-LEVEL STRUCTURE)
// ============================================================

export function buildDoctorReportDataV3(response: AnalyzeResponse): DoctorReportData {
  const {
    analysis,
    weeklyPlan,
    personalization,
    planIntelligence,
    cyp_profile,
    therapeutic_range,
    multi_drug_interaction,
    withdrawal_risk_adjustment
  } = response;

  // Current date
  const now = new Date();
  const generatedDate = now.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ============================================================
  // LEVEL 1: OVERVIEW DATA
  // ============================================================

  const overviewMedications: DoctorReportOverviewMedication[] = analysis.map(entry => {
    const med = entry.medication as MedicationWithCategory;
    const name = getMedicationName(entry);
    const category = med.category_name || 'Allgemeine Medikation';
    const startDoseMg = entry.mgPerDay || 0;
    
    // Find target dose from last week
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    const targetMed = lastWeek?.medications.find((m: any) => m.name === name);
    const targetDoseMg = targetMed?.targetMg || startDoseMg;
    
    const withdrawalScore = med.withdrawal_risk_score || 0;
    const interactionSeverity = entry.interactions[0]?.severity;
    const riskLevel = determineRiskLevel(med, interactionSeverity, withdrawalScore);
    
    // Generate short comment (1 sentence)
    const hasCyp = cyp_profile?.medicationsWithSlowerEffect?.includes(name) || 
                   cyp_profile?.medicationsWithFasterEffect?.includes(name);
    const hasNarrowTR = therapeutic_range?.medicationsWithNarrowWindow?.includes(name);
    
    let shortComment = '';
    if (riskLevel === 'kritisch') {
      shortComment = 'Kritische Interaktion und/oder hohes Absetzrisiko - engmaschige Überwachung erforderlich';
    } else if (hasCyp && withdrawalScore >= 7) {
      shortComment = 'Langsames Ausschleichen wegen CYP-Hemmung & hohem Absetzrisiko';
    } else if (hasNarrowTR) {
      shortComment = 'Enges therapeutisches Fenster - vorsichtige Dosisanpassung';
    } else if (withdrawalScore >= 7) {
      shortComment = 'Hohes Absetzrisiko - langsame Reduktion empfohlen';
    } else if (hasCyp) {
      shortComment = 'CYP-Interaktion berücksichtigt - Reduktion angepasst';
    } else {
      shortComment = 'Standard-Risiko, keine kritischen Interaktionen bekannt';
    }

    return {
      name,
      category,
      startDoseMg,
      targetDoseMg,
      riskLevel,
      shortComment
    };
  });

  // Global Risk (MDI)
  const mdi = multi_drug_interaction;
  const globalRisk: DoctorReportGlobalRisk = {
    mdiLevel: (mdi?.level as any) || 'none',
    inhibitorCount: mdi?.inhibitors || 0,
    inducerCount: mdi?.inducers || 0,
    adjustmentFactor: mdi?.adjustment_factor || 1.0,
    comment: mdi?.level === 'severe' 
      ? 'Schwere Multi-Drug-Interaktion: Engmaschige ärztliche Begleitung dringend empfohlen'
      : mdi?.level === 'moderate'
      ? 'Mittlere Multi-Drug-Interaktion: Regelmäßige ärztliche Kontrollen empfohlen'
      : mdi?.level === 'mild'
      ? 'Leichte Multi-Drug-Interaktion: Monitoring empfohlen'
      : 'Keine relevante Multi-Drug-Interaktion'
  };

  // ============================================================
  // LEVEL 2: PER-MEDICATION DETAILS
  // ============================================================

  const medicationDetails: DoctorReportMedicationDetail[] = analysis.map(entry => {
    const med = entry.medication as MedicationWithCategory;
    const name = getMedicationName(entry);
    const genericName = med.generic_name || '–';
    const category = med.category_name || 'Allgemeine Medikation';
    const startDoseMg = entry.mgPerDay || 0;
    
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    const targetMed = lastWeek?.medications.find((m: any) => m.name === name);
    const targetDoseMg = targetMed?.targetMg || startDoseMg;
    
    const minimumDoseMg = med.can_reduce_to_zero === 0 
      ? startDoseMg * (med.default_min_target_fraction || 1.0)
      : 0;

    // Withdrawal Risk
    const withdrawalScore = med.withdrawal_risk_score || 0;
    const withdrawalLevel = determineWithdrawalLevel(withdrawalScore);
    const wrAdjustment = withdrawal_risk_adjustment?.medications?.find(m => m.name === name);
    const withdrawalSlowdownPct = wrAdjustment?.reduction_slowdown_pct || 0;

    // CYP Data
    const cypProfiles = entry.cypProfiles || [];
    const hasCypData = cypProfiles.length > 0;
    const isSlower = cyp_profile?.medicationsWithSlowerEffect?.includes(name) || false;
    const isFaster = cyp_profile?.medicationsWithFasterEffect?.includes(name) || false;
    const cypEffect = isSlower ? 'slower' : isFaster ? 'faster' : 'neutral';
    
    let cypSummary = 'Keine CYP-Daten vorhanden';
    if (isSlower) {
      const enzymes = cypProfiles.map(p => p.cyp_enzyme).join(', ');
      cypSummary = `CYP-Substrat (${enzymes}): CBD hemmt Abbau → Spiegelanstieg möglich → Reduktion um 30% verlangsamt`;
    } else if (isFaster) {
      const enzymes = cypProfiles.map(p => p.cyp_enzyme).join(', ');
      cypSummary = `CYP-Konstellation (${enzymes}): Schnellere Elimination unter CBD möglich → Reduktion um 15% beschleunigt`;
    }

    // Therapeutic Range
    const trData = therapeutic_range?.medications?.find(m => m.name === name);
    const hasTherapeuticRange = trData?.has_range || false;
    const isNarrowWindow = trData?.is_narrow_window || false;
    let therapeuticRangeSummary = 'Kein definierter therapeutischer Bereich';
    if (hasTherapeuticRange && trData) {
      const width = trData.window_width || 0;
      therapeuticRangeSummary = `Therapeutischer Bereich: ${trData.min_ng_ml}-${trData.max_ng_ml} ng/ml (Breite: ${width} ng/ml)`;
      if (isNarrowWindow) {
        therapeuticRangeSummary += ' – ENGES FENSTER: Zusätzliche 20% Reduktionsverlangsamung aktiv';
      }
    }

    // MDI Impact
    let mdiImpact = 'Keine relevante MDI-Beteiligung';
    if (isSlower && mdi) {
      const profileCount = cypProfiles.filter(p => p.cbd_effect_on_reduction === 'slower').length;
      mdiImpact = `Trägt mit ${profileCount} Hemm-Profil(en) zur ${mdi.level} MDI bei`;
    } else if (isFaster && mdi) {
      const profileCount = cypProfiles.filter(p => p.cbd_effect_on_reduction === 'faster').length;
      mdiImpact = `Trägt mit ${profileCount} Induktions-Profil(en) zur MDI bei`;
    }

    // Total Slowdown
    let totalSlowdownPct = 0;
    if (med.half_life_hours && med.half_life_hours * 5 > 168) totalSlowdownPct += 50; // Long half-life
    if (isSlower) totalSlowdownPct += 30; // CYP slowdown
    if (isNarrowWindow) totalSlowdownPct += 20; // TR slowdown
    totalSlowdownPct += withdrawalSlowdownPct; // Withdrawal slowdown

    // Safety Notes (top 3-5)
    const safetyNotes: string[] = [];
    if (withdrawalScore >= 7) {
      safetyNotes.push(`Hohes Absetzrisiko (Score ${withdrawalScore}/10): Reduktion um ${withdrawalSlowdownPct}% verlangsamt`);
    }
    if (isSlower) {
      safetyNotes.push(`CYP-Hemmung durch CBD: Medikamentenspiegel können steigen → Reduktion um 30% verlangsamt`);
    }
    if (isNarrowWindow) {
      safetyNotes.push(`Enges therapeutisches Fenster: Erhöhtes Risiko für Über-/Unterdosierung → Reduktion um 20% verlangsamt`);
    }
    if (med.half_life_hours && med.half_life_hours > 40) {
      safetyNotes.push(`Lange Halbwertszeit (${med.half_life_hours}h): Steady-State nach ${Math.round(med.half_life_hours * 5 / 24)} Tagen`);
    }
    if (med.cbd_interaction_strength === 'critical') {
      safetyNotes.push(`Kritische CBD-Interaktion: Engmaschige Kontrollen erforderlich`);
    }

    // Monitoring Recommendations
    const monitoringRecommendations: string[] = [];
    if (withdrawalScore >= 7) {
      monitoringRecommendations.push('Auf Entzugssymptome achten (Unruhe, Schlafstörungen, Rebound)');
    }
    if (med.cbd_interaction_strength === 'critical' || med.cbd_interaction_strength === 'high') {
      monitoringRecommendations.push('Wöchentliche Kontrollen in den ersten 4 Wochen');
    }
    if (isNarrowWindow || med.therapeutic_min_ng_ml) {
      monitoringRecommendations.push('Regelmäßige Spiegelkontrollen erwägen (falls verfügbar)');
    }
    if (!monitoringRecommendations.length) {
      monitoringRecommendations.push('Alle 2-4 Wochen Kontrolltermin');
      monitoringRecommendations.push('Bei Symptomen: Frühere Wiedervorstellung');
    }

    return {
      name,
      genericName,
      category,
      startDoseMg,
      targetDoseMg,
      minimumDoseMg,
      withdrawalScore,
      withdrawalLevel,
      withdrawalSlowdownPct,
      hasCypData,
      cypSummary,
      cypEffect,
      hasTherapeuticRange,
      isNarrowWindow,
      therapeuticRangeSummary,
      mdiImpact,
      totalSlowdownPct,
      safetyNotes,
      monitoringRecommendations
    };
  });

  // ============================================================
  // LEVEL 3: APPENDIX DATA
  // ============================================================

  // Model Info
  const modelInfo: DoctorReportModelInfo = {
    summaryText: 
      'Das MEDLESS-Modell kombiniert pharmakokinetische Faktoren (Halbwertszeit, CYP450-Enzyme, therapeutischer Bereich) ' +
      'mit klinischen Sicherheitsparametern (Absetzrisiko, Kategorie-Regeln, Multi-Drug-Interaktionen) zu einem ' +
      'individualisierten Reduktionsplan. Die Berechnung erfolgt heuristisch mit Sicherheitsbremsen.',
    limitationsText:
      'Das Modell berechnet KEINE echten Plasmaspiegel. Es ersetzt keine ärztliche Beurteilung und berücksichtigt ' +
      'keine individuellen Faktoren wie Leber-/Nierenfunktion, genetische Polymorphismen oder Komedikation außerhalb ' +
      'der CBD-Interaktion. Die Reduktionsgeschwindigkeit ist ein Vorschlag, keine Therapieempfehlung.',
    factorsConsidered: [
      'Medikamenten-Kategorie (z.B. Antikoagulantien, Benzodiazepine)',
      'Halbwertszeit (Steady-State-Berechnung)',
      'CYP450-Profile (CBD-Hemmung/-Induktion)',
      'Therapeutischer Bereich (enges Fenster)',
      'Absetzrisiko-Score (0-10)',
      'Multi-Drug-Interaktionen (kumulative CYP-Belastung)',
      'Kategorie-spezifische Sicherheitsregeln (max. Reduktion%)',
      'CBD-Dosierung (gewichtsbasiert 0,5-1,0 mg/kg)'
    ]
  };

  // CYP Details
  const cypDetails: DoctorReportCypDetail[] = analysis
    .filter(entry => entry.cypProfiles && entry.cypProfiles.length > 0)
    .map(entry => ({
      medicationName: getMedicationName(entry),
      profiles: (entry.cypProfiles || []).map(p => ({
        enzyme: p.cyp_enzyme,
        role: p.role,
        cbdEffect: p.cbd_effect_on_reduction || 'neutral',
        note: p.note || '–'
      }))
    }));

  // All Safety Notes
  const allSafetyNotes: Record<string, string[]> = {};
  if (weeklyPlan.length > 0 && weeklyPlan[0].medications) {
    weeklyPlan[0].medications.forEach((med: any) => {
      if (med.safety && med.safety.notes && med.safety.notes.length > 0) {
        allSafetyNotes[med.name] = med.safety.notes;
      }
    });
  }

  // ============================================================
  // RETURN STRUCTURED DATA
  // ============================================================

  return {
    headerTitle: 'MEDLESS-Reduktionsplan – Ärztliche Dokumentation',
    generatedDate,
    patientMeta: {
      firstName: personalization.firstName || 'Patient',
      age: personalization.age ? `${personalization.age}` : 'N/A',
      weight: personalization.weight ? `${personalization.weight}` : 'N/A',
      gender: personalization.gender || 'N/A',
      height: personalization.height ? `${personalization.height}` : 'N/A',
      bmi: personalization.bmi ? `${personalization.bmi}` : 'N/A',
      bsa: personalization.bsa ? `${personalization.bsa}` : 'N/A',
      idealWeight: personalization.idealWeightKg ? `${personalization.idealWeightKg}` : 'N/A'
    },
    overviewMedications,
    globalRisk,
    strategySummary: {
      durationWeeks: weeklyPlan.length,
      reductionGoal: planIntelligence.totalLoadReductionPct,
      cbdStartMg: personalization.cbdStartMg,
      cbdEndMg: personalization.cbdEndMg,
      overallLoadReduction: planIntelligence.totalLoadReductionPct,
      reductionSpeedCategory: planIntelligence.reductionSpeedCategory
    },
    medicationDetails,
    modelInfo,
    cypDetails,
    allSafetyNotes,
    legalNotes:
      'Dieser Bericht dient ausschließlich der ärztlichen Information und Dokumentation. ' +
      'Die endgültige Therapieentscheidung liegt beim behandelnden Arzt.',
    versionNote: 'MEDLESS Ärztebericht v3.0 – 3-Ebenen-Struktur (Übersicht/Details/Anhang)'
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
          slowdownPct: 30
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
          slowdownPct: 15
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
