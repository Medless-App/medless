// ============================================================
// REPORT FORMATTING UTILITIES – MEGAPROMPT COMPLIANCE
// ============================================================
// Ensures consistency between Doctor Report and Patient Plan
// Implements all 6 rules from the megaprompt

/**
 * REGEL 2.3 & 4: Format mg values consistently
 * - mg täglich (not mg/Tag)
 * - Always 2 decimals for mg/kg
 * - Remove unnecessary .0
 */
export function formatMgValue(value: number): string {
  // Remove .0 decimals if whole number
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} mg täglich`;
}

/**
 * Format mg/kg with exactly 2 decimals (REGEL 4)
 */
export function formatMgPerKg(mgTotal: number, weightKg: number): string {
  const mgPerKg = mgTotal / weightKg;
  return `${mgPerKg.toFixed(2)} mg/kg`;
}

/**
 * REGEL 5: Calculate percentage reduction correctly
 * Example: 300mg → 207mg = 31% (not 30.5%)
 */
export function calculateReductionPercentage(startDose: number, endDose: number): number {
  const reduction = ((startDose - endDose) / startDose) * 100;
  return Math.round(reduction); // Round to whole number
}

/**
 * Format dosage change (Start → Ende)
 */
export function formatDosageChange(startDose: number, endDose: number, unit: string = 'mg täglich'): string {
  return `${formatMgValue(startDose)} → ${formatMgValue(endDose)}`;
}

/**
 * REGEL 1: CBD End Dose Consistency
 * This value MUST be used everywhere (summary, methodology, weekly plan)
 */
export interface CBDDoseInfo {
  startDose: number;  // e.g., 17.5 mg
  endDose: number;    // e.g., 87 mg or 70 mg
  startMgPerKg: number;
  endMgPerKg: number;
  patientWeight: number;
}

export function buildCBDDoseInfo(
  startDose: number,
  endDose: number,
  patientWeight: number
): CBDDoseInfo {
  return {
    startDose,
    endDose,
    startMgPerKg: startDose / patientWeight,
    endMgPerKg: endDose / patientWeight,
    patientWeight
  };
}

/**
 * REGEL 2.2: Format theoretical vs. actual reduction
 */
export interface ReductionSummary {
  theoreticalTargetPercent: number;   // User input (e.g., 50%)
  actualReductionPercent: number;     // Calculated (e.g., 31%)
  startDose: number;
  endDose: number;
  reason: string;  // Why actual differs from theoretical
}

export function buildReductionSummary(
  startDose: number,
  endDose: number,
  theoreticalTarget: number,
  reason: string
): ReductionSummary {
  const actualPercent = calculateReductionPercentage(startDose, endDose);
  
  return {
    theoreticalTargetPercent: theoreticalTarget,
    actualReductionPercent: actualPercent,
    startDose,
    endDose,
    reason
  };
}

/**
 * REGEL 2.2: Render summary text (German)
 */
export function renderReductionSummaryText(summary: ReductionSummary): string {
  return `
    <p><strong>Theoretisches Reduktionsziel:</strong> ${summary.theoreticalTargetPercent}%</p>
    <p><strong>Umgesetzte Reduktion:</strong> ${summary.actualReductionPercent}% (${formatMgValue(summary.startDose)} → ${formatMgValue(summary.endDose)})</p>
    <p style="font-size: 9pt; color: #6b7280; margin-top: 4px;">
      ${summary.reason}
    </p>
  `;
}

/**
 * REGEL 2.3: Render CBD dose methodology text
 */
export function renderCBDMethodologyText(cbdInfo: CBDDoseInfo): string {
  return `
    <p>
      Die CBD-Dosis wird stufenweise von ${formatMgValue(cbdInfo.startDose)} auf 
      <strong>${formatMgValue(cbdInfo.endDose)}</strong> gesteigert 
      (entspricht ca. ${formatMgPerKg(cbdInfo.endDose, cbdInfo.patientWeight)}).
    </p>
  `;
}

/**
 * REGEL 2.1: Deduplicate medication safety warnings
 * Input: Array of safety warnings (may contain duplicates)
 * Output: Unique warnings grouped by medication
 */
export interface MedicationSafetyWarning {
  medicationName: string;
  genericName?: string;
  warnings: string[];
}

export function deduplicateSafetyWarnings(
  warnings: { medicationName: string; warning: string }[]
): MedicationSafetyWarning[] {
  const grouped = new Map<string, Set<string>>();
  
  for (const item of warnings) {
    if (!grouped.has(item.medicationName)) {
      grouped.set(item.medicationName, new Set());
    }
    grouped.get(item.medicationName)!.add(item.warning);
  }
  
  return Array.from(grouped.entries()).map(([name, warningSet]) => ({
    medicationName: name,
    warnings: Array.from(warningSet)
  }));
}

/**
 * REGEL 2.1: Render medication-specific safety warnings (deduplicated)
 */
export function renderMedicationSafetyWarnings(warnings: MedicationSafetyWarning[]): string {
  if (warnings.length === 0) {
    return '';
  }
  
  return `
    <h3>⚠️ Medikamentenspezifische Sicherheitshinweise</h3>
    ${warnings.map(med => `
      <div style="margin: 12px 0; padding: 10px; background: #FEF3C7; border-left: 3px solid #F59E0B; border-radius: 4px;">
        <p style="font-weight: 700; color: #92400E; margin-bottom: 6px;">${med.medicationName}:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 9pt; line-height: 1.6;">
          ${med.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  `;
}

/**
 * REGEL 6: H1/H2/H3 Formatierung
 */
export const HEADING_STYLES = {
  h1: 'font-size: 16pt; font-weight: 700; color: #111827; margin: 12px 0 8px 0;',
  h2: 'font-size: 13pt; font-weight: 600; color: #1f2937; margin: 16px 0 8px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;',
  h3: 'font-size: 11pt; font-weight: 600; color: #374151; margin: 10px 0 6px 0;'
};
