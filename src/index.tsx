import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
}

// ============================================================
// TYPE DEFINITIONS: Medication Category Safety Rules
// ============================================================

interface MedicationCategory {
  id: number;
  name: string;
  risk_level: string | null;
  can_reduce_to_zero: number | null;
  default_min_target_fraction: number | null;
  max_weekly_reduction_pct: number | null;
  requires_specialist: number | null;
  notes: string | null;
}

interface MedicationWithCategory {
  id: number;
  name: string;
  generic_name: string;
  category_id: number | null;
  cyp450_enzyme?: string | null;
  description?: string | null;
  common_dosage?: string | null;
  
  // Category fields (from JOIN)
  category?: MedicationCategory | null;
  category_name?: string;
  risk_level?: string | null;
  
  // Category safety fields
  can_reduce_to_zero?: number | null;
  default_min_target_fraction?: number | null;
  max_weekly_reduction_pct?: number | null;
  requires_specialist?: number | null;
  category_notes?: string | null;
  
  // ===== NEW: Medication-specific pharmacokinetic fields (Migration 0005) =====
  half_life_hours?: number | null;
  therapeutic_min_ng_ml?: number | null;
  therapeutic_max_ng_ml?: number | null;
  withdrawal_risk_score?: number | null;
  // Note: max_weekly_reduction_pct also exists as medication-specific field
  // Note: can_reduce_to_zero also exists as medication-specific field
  cbd_interaction_strength?: 'low' | 'medium' | 'high' | 'critical' | null;
}

interface SafetyResult {
  effectiveTargetMg: number;
  effectiveWeeklyReduction: number;
  safetyNotes: string[];
  limitedByCategory: boolean;
  appliedCategoryRules: boolean;
}

// ============================================================
// SAFETY FUNCTION: Apply Category-Based Reduction Limits
// ============================================================

function applyCategorySafetyRules(params: {
  startMg: number;
  reductionGoal: number;
  durationWeeks: number;
  medicationName: string;
  category?: MedicationWithCategory | null;
}): SafetyResult {
  const { startMg, reductionGoal, durationWeeks, medicationName, category } = params;
  
  const safetyNotes: string[] = [];
  let appliedCategoryRules = false;
  let limitedByCategory = false;
  
  // ===== NEW: Add withdrawal risk warnings based on Migration 0005 fields =====
  if (category?.withdrawal_risk_score && category.withdrawal_risk_score >= 7) {
    safetyNotes.push(
      `⚠️ ${medicationName}: Hohes Absetzrisiko (Score: ${category.withdrawal_risk_score}/10) - Langsame Reduktion empfohlen`
    );
  }
  
  // ===== NEW: Add CBD interaction strength warnings =====
  if (category?.cbd_interaction_strength === 'critical') {
    safetyNotes.push(
      `🚨 ${medicationName}: Kritische CBD-Wechselwirkung - Engmaschige ärztliche Kontrolle erforderlich`
    );
  } else if (category?.cbd_interaction_strength === 'high') {
    safetyNotes.push(
      `⚠️ ${medicationName}: Starke CBD-Wechselwirkung - Vorsicht bei gleichzeitiger Einnahme`
    );
  }
  
  // Base calculation from user input
  let targetFraction = 1 - (reductionGoal / 100);
  
  // If no category data, return original calculation
  if (!category || 
      (category.can_reduce_to_zero === null && 
       category.default_min_target_fraction === null && 
       category.max_weekly_reduction_pct === null)) {
    const desiredTargetMg = startMg * targetFraction;
    const weeklyReduction = (startMg - desiredTargetMg) / durationWeeks;
    
    return {
      effectiveTargetMg: desiredTargetMg,
      effectiveWeeklyReduction: weeklyReduction,
      safetyNotes,
      limitedByCategory: false,
      appliedCategoryRules: false
    };
  }
  
  appliedCategoryRules = true;
  
  // Rule 1: Check if reduction to zero is allowed (MEDICATION-SPECIFIC has priority)
  const canReduceToZero = category.can_reduce_to_zero ?? 1; // Default: reduction allowed
  
  if (canReduceToZero === 0 || category.risk_level === 'lifelong' || category.risk_level === 'very_high') {
    if (category.default_min_target_fraction !== null && category.default_min_target_fraction > 0) {
      // Use category's minimum target fraction
      targetFraction = Math.max(targetFraction, category.default_min_target_fraction);
      if (targetFraction > (1 - reductionGoal / 100)) {
        limitedByCategory = true;
        safetyNotes.push(
          `⚠️ ${medicationName}: Reduktion begrenzt auf max. ${Math.round((1 - targetFraction) * 100)}% (Kategorie-Sicherheitsregel)`
        );
      }
    } else {
      // No reduction allowed at all - set minimum target to 50%
      targetFraction = 0.5;
      limitedByCategory = true;
      safetyNotes.push(
        `🔒 ${medicationName}: Keine Vollreduktion möglich - Minimum 50% Erhaltungsdosis`
      );
    }
  } 
  // Rule 2: Apply minimum target fraction (even if can_reduce_to_zero = 1)
  else if (category.default_min_target_fraction !== null && category.default_min_target_fraction > 0) {
    const originalTargetFraction = targetFraction;
    targetFraction = Math.max(targetFraction, category.default_min_target_fraction);
    if (targetFraction > originalTargetFraction) {
      limitedByCategory = true;
      safetyNotes.push(
        `⚠️ ${medicationName}: Reduktion begrenzt auf max. ${Math.round((1 - targetFraction) * 100)}% (Sicherheitsgrenze)`
      );
    }
  }
  
  // Calculate desired target
  const desiredTargetMg = Math.max(0, startMg * targetFraction);
  
  // Base weekly reduction
  let weeklyReductionBase = (startMg - desiredTargetMg) / durationWeeks;
  
  // Rule 3: Apply maximum weekly reduction percentage (MEDICATION-SPECIFIC has priority over category)
  let effectiveWeeklyReduction = weeklyReductionBase;
  
  const maxWeeklyReductionPct = category.max_weekly_reduction_pct; // Use medication-specific if available
  
  if (maxWeeklyReductionPct !== null && maxWeeklyReductionPct > 0) {
    const maxWeeklyReductionMg = startMg * (maxWeeklyReductionPct / 100);
    
    if (weeklyReductionBase > maxWeeklyReductionMg) {
      effectiveWeeklyReduction = maxWeeklyReductionMg;
      limitedByCategory = true;
      safetyNotes.push(
        `🐌 ${medicationName}: Reduktionsgeschwindigkeit begrenzt auf max. ${maxWeeklyReductionPct}%/Woche`
      );
    }
  }
  
  // ===== NEW: Apply half-life-based reduction factor (Migration 0005) =====
  if (category.half_life_hours && category.half_life_hours > 0) {
    const steadyStateDays = (category.half_life_hours * 5) / 24; // 5 half-lives = steady state
    
    if (steadyStateDays > 7) {
      // Long half-life (> 7 days steady state) - reduce speed by 50%
      effectiveWeeklyReduction *= 0.5;
      limitedByCategory = true;
      safetyNotes.push(
        `🕐 ${medicationName}: Lange Halbwertszeit (${Math.round(category.half_life_hours)}h) - Reduktion auf 50% verlangsamt`
      );
    } else if (steadyStateDays > 3) {
      // Medium half-life (3-7 days) - reduce speed by 25%
      effectiveWeeklyReduction *= 0.75;
      limitedByCategory = true;
      safetyNotes.push(
        `🕐 ${medicationName}: Mittlere Halbwertszeit (${Math.round(category.half_life_hours)}h) - Reduktion auf 75% angepasst`
      );
    }
  }
  
  // Calculate effective target based on weekly reduction limit
  const effectiveTargetMg = Math.max(0, startMg - (effectiveWeeklyReduction * durationWeeks));
  
  // Additional note if target changed due to speed limit
  if (effectiveTargetMg > desiredTargetMg && limitedByCategory) {
    const actualReductionPct = Math.round(((startMg - effectiveTargetMg) / startMg) * 100);
    safetyNotes.push(
      `ℹ️ ${medicationName}: Tatsächliche Reduktion: ${actualReductionPct}% (statt ${reductionGoal}%)`
    );
  }
  
  // Add specialist note if required
  if (category.requires_specialist === 1) {
    safetyNotes.push(
      `👨‍⚕️ ${medicationName}: Fachärztliche Begleitung erforderlich`
    );
  }
  
  return {
    effectiveTargetMg,
    effectiveWeeklyReduction,
    safetyNotes,
    limitedByCategory,
    appliedCategoryRules
  };
}

const app = new Hono<{ Bindings: Bindings }>()

// MEDLESS Product Data - CBD Dosier-Sprays (FIXED VALUES - DO NOT CHANGE)
const MEDLESS_PRODUCTS = [
  { nr: 5,  cbdPerSpray: 5.8,  name: 'MEDLESS Nr. 5',  price: 24.90 },
  { nr: 10, cbdPerSpray: 11.5, name: 'MEDLESS Nr. 10', price: 39.90 },
  { nr: 15, cbdPerSpray: 17.5, name: 'MEDLESS Nr. 15', price: 59.90 },
  { nr: 20, cbdPerSpray: 23.2, name: 'MEDLESS Nr. 20', price: 79.90 },
  { nr: 25, cbdPerSpray: 29.0, name: 'MEDLESS Nr. 25', price: 99.90 }
];

const BOTTLE_CAPACITY = 100; // Sprays per 10ml bottle (FIXED - 100 sprays = 10ml)

// Medless-AI: Select optimal product with minimal sprays, no overdose, max 6 sprays per time
function selectOptimalProduct(targetDailyMg: number) {
  let bestProduct = MEDLESS_PRODUCTS[0];
  let bestSprayCount = 999;
  
  for (const product of MEDLESS_PRODUCTS) {
    const totalSprays = Math.ceil(targetDailyMg / product.cbdPerSpray);
    const morningSprays = Math.max(1, Math.round(totalSprays * 0.4));
    const eveningSprays = totalSprays - morningSprays;
    
    // Rules: No overdose, max 6 sprays per intake, prefer fewer sprays
    const actualMg = totalSprays * product.cbdPerSpray;
    if (actualMg <= targetDailyMg * 1.1 && // Max 10% overdose tolerance
        morningSprays <= 6 && 
        eveningSprays <= 6 &&
        totalSprays < bestSprayCount) {
      bestProduct = product;
      bestSprayCount = totalSprays;
    }
  }
  
  return bestProduct;
}

// Medless-AI: Generate weekly plan with bottle tracking - NO unnecessary product changes!
function generateWeeklyPlanWithBottleTracking(
  cbdStartMg: number,
  cbdEndMg: number,
  durationWeeks: number
) {
  const cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks;
  const weeklyPlan: any[] = [];
  
  // Bottle tracking state
  let currentProduct = selectOptimalProduct(cbdStartMg);
  let bottleRemaining = BOTTLE_CAPACITY;
  let totalSpraysUsed = 0;
  
  for (let week = 1; week <= durationWeeks; week++) {
    const weekCbdDose = cbdStartMg + (cbdWeeklyIncrease * (week - 1));
    
    // Calculate sprays needed this week
    const totalSpraysPerDay = Math.ceil(weekCbdDose / currentProduct.cbdPerSpray);
    const spraysThisWeek = totalSpraysPerDay * 7;
    
    // Check if current bottle + product is still sufficient
    const needsProductChange = 
      bottleRemaining < spraysThisWeek || // Bottle will run out
      totalSpraysPerDay > 12; // Too many sprays per day (max ~12)
    
    if (needsProductChange && bottleRemaining < spraysThisWeek) {
      // Bottle running out - switch to new bottle with potentially new product
      currentProduct = selectOptimalProduct(weekCbdDose);
      bottleRemaining = BOTTLE_CAPACITY;
      totalSpraysUsed = 0;
    } else if (needsProductChange && totalSpraysPerDay > 12) {
      // Dosage too high - upgrade to stronger product
      currentProduct = selectOptimalProduct(weekCbdDose);
      bottleRemaining = BOTTLE_CAPACITY;
      totalSpraysUsed = 0;
    }
    
    // Recalculate with current product
    const totalSprays = Math.ceil(weekCbdDose / currentProduct.cbdPerSpray);
    const morningSprays = Math.max(1, Math.round(totalSprays * 0.4));
    const eveningSprays = totalSprays - morningSprays;
    const actualCbdMg = totalSprays * currentProduct.cbdPerSpray;
    const spraysPerWeek = totalSprays * 7;
    
    // Update bottle tracking
    bottleRemaining -= spraysPerWeek;
    totalSpraysUsed += spraysPerWeek;
    
    // Calculate when bottle will be empty
    const daysUntilEmpty = Math.floor(bottleRemaining / totalSprays);
    const weeksUntilEmpty = Math.floor(daysUntilEmpty / 7);
    
    weeklyPlan.push({
      week,
      cbdDose: Math.round(weekCbdDose * 10) / 10,
      kannasanProduct: {
        nr: currentProduct.nr,
        name: currentProduct.name,
        cbdPerSpray: currentProduct.cbdPerSpray
      },
      morningSprays,
      eveningSprays,
      totalSprays,
      actualCbdMg: Math.round(actualCbdMg * 10) / 10,
      bottleStatus: {
        used: BOTTLE_CAPACITY - bottleRemaining,
        remaining: bottleRemaining,
        totalCapacity: BOTTLE_CAPACITY,
        emptyInWeeks: weeksUntilEmpty > 0 ? weeksUntilEmpty : 0,
        productChangeNext: bottleRemaining < totalSprays * 7
      }
    });
  }
  
  return weeklyPlan;
}

// Medless-AI: Calculate total costs for the entire plan
function calculatePlanCosts(weeklyPlan: any[]) {
  const bottleUsage: { [key: string]: { count: number; product: any; totalSprays: number; weeks: number[] } } = {};
  
  let currentProduct: any = null;
  let currentBottleNumber = 0;
  let bottleRemaining = 0;
  
  weeklyPlan.forEach((week) => {
    const product = week.kannasanProduct;
    const spraysThisWeek = week.totalSprays * 7;
    const productKey = `MEDLESS Nr. ${product.nr}`;
    
    // Check if product changed or bottle empty
    if (!currentProduct || currentProduct.nr !== product.nr || bottleRemaining < spraysThisWeek) {
      // New bottle needed
      currentBottleNumber++;
      bottleRemaining = BOTTLE_CAPACITY;
      currentProduct = product;
      
      if (!bottleUsage[productKey]) {
        bottleUsage[productKey] = {
          count: 0,
          product: MEDLESS_PRODUCTS.find(p => p.nr === product.nr),
          totalSprays: 0,
          weeks: []
        };
      }
      
      bottleUsage[productKey].count++;
    }
    
    // Update usage
    bottleUsage[productKey].totalSprays += spraysThisWeek;
    bottleUsage[productKey].weeks.push(week.week);
    bottleRemaining -= spraysThisWeek;
  });
  
  // Calculate costs
  const costBreakdown: any[] = [];
  let totalCost = 0;
  
  Object.keys(bottleUsage).forEach((productKey) => {
    const usage = bottleUsage[productKey];
    const productCost = usage.count * usage.product.price;
    totalCost += productCost;
    
    costBreakdown.push({
      product: productKey,
      productNr: usage.product.nr,
      pricePerBottle: usage.product.price,
      bottleCount: usage.count,
      totalSprays: usage.totalSprays,
      totalCost: Math.round(productCost * 100) / 100,
      weeksUsed: `${usage.weeks[0]}-${usage.weeks[usage.weeks.length - 1]}`
    });
  });
  
  return {
    costBreakdown,
    totalCost: Math.round(totalCost * 100) / 100,
    totalBottles: Object.values(bottleUsage).reduce((sum, u) => sum + u.count, 0),
    totalSprays: Object.values(bottleUsage).reduce((sum, u) => sum + u.totalSprays, 0)
  };
}

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// REFACTORED DESIGN - Serve as inline HTML (workaround for serveStatic limitation)

// Get all medications
app.get('/api/medications', async (c) => {
  const { env } = c;
  try {
    const result = await env.DB.prepare(`
      SELECT m.*, 
             mc.name as category_name, 
             mc.risk_level,
             mc.can_reduce_to_zero,
             mc.default_min_target_fraction,
             mc.max_weekly_reduction_pct,
             mc.requires_specialist,
             mc.notes as category_notes,
             m.half_life_hours,
             m.therapeutic_min_ng_ml,
             m.therapeutic_max_ng_ml,
             m.withdrawal_risk_score,
             m.cbd_interaction_strength
      FROM medications m
      LEFT JOIN medication_categories mc ON m.category_id = mc.id
      ORDER BY m.name
    `).all();
    
    return c.json({ success: true, medications: result.results });
  } catch (error) {
    return c.json({ success: false, error: 'Fehler beim Abrufen der Medikamente' }, 500);
  }
})

// Search medication by name
app.get('/api/medications/search/:query', async (c) => {
  const { env } = c;
  const query = c.req.param('query');
  
  try {
    const result = await env.DB.prepare(`
      SELECT m.*, 
             mc.name as category_name, 
             mc.risk_level,
             mc.can_reduce_to_zero,
             mc.default_min_target_fraction,
             mc.max_weekly_reduction_pct,
             mc.requires_specialist,
             mc.notes as category_notes,
             m.half_life_hours,
             m.therapeutic_min_ng_ml,
             m.therapeutic_max_ng_ml,
             m.withdrawal_risk_score,
             m.cbd_interaction_strength
      FROM medications m
      LEFT JOIN medication_categories mc ON m.category_id = mc.id
      WHERE m.name LIKE ? OR m.generic_name LIKE ?
      ORDER BY m.name
      LIMIT 20
    `).bind(`%${query}%`, `%${query}%`).all();
    
    return c.json({ success: true, medications: result.results });
  } catch (error) {
    return c.json({ success: false, error: 'Fehler bei der Suche' }, 500);
  }
})

// Analyze medications and generate CANNABINOID DOSING PLAN
app.post('/api/analyze', async (c) => {
  const { env } = c;
  try {
    const body = await c.req.json();
    const { medications, durationWeeks, reductionGoal = 50, email, firstName, gender, age, weight, height } = body;
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return c.json({ success: false, error: 'Bitte geben Sie mindestens ein Medikament an' }, 400);
    }
    
    if (!durationWeeks || durationWeeks < 1) {
      return c.json({ success: false, error: 'Bitte geben Sie eine gültige Dauer in Wochen an' }, 400);
    }
    
    // Validate that all medications have mgPerDay values
    for (const med of medications) {
      if (!med.mgPerDay || isNaN(med.mgPerDay) || med.mgPerDay <= 0) {
        return c.json({ 
          success: false, 
          error: `Bitte geben Sie eine gültige Tagesdosis in mg für "${med.name}" ein` 
        }, 400);
      }
    }
    
    // Save email to database if provided
    if (email) {
      try {
        await env.DB.prepare(`
          INSERT INTO customer_emails (email, first_name, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).bind(email, firstName || null).run();
      } catch (emailError: any) {
        console.log('Email already exists or error saving:', emailError.message);
      }
    }
    
    // Calculate BMI and BSA if data provided
    let bmi = null;
    let bsa = null;
    let idealWeightKg = null; // PlanIntelligenz 2.0: Ideal weight (Devine formula)
    
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
      bsa = Math.round(Math.sqrt((height * weight) / 3600) * 100) / 100;
      
      // PlanIntelligenz 2.0: Calculate ideal weight using Devine formula
      if (gender === 'male') {
        idealWeightKg = Math.round((50 + 0.9 * (height - 152)) * 10) / 10;
      } else if (gender === 'female') {
        idealWeightKg = Math.round((45.5 + 0.9 * (height - 152)) * 10) / 10;
      }
      // For 'diverse' or undefined gender, idealWeightKg remains null
    }
    
    // Analyze each medication for interactions
    const analysisResults = [];
    let maxSeverity = 'low';
    
    for (const med of medications) {
      const medResult = await env.DB.prepare(`
        SELECT m.*, 
               mc.name as category_name,
               mc.risk_level,
               mc.can_reduce_to_zero,
               mc.default_min_target_fraction,
               mc.max_weekly_reduction_pct,
               mc.requires_specialist,
               mc.notes as category_notes,
               m.half_life_hours,
               m.therapeutic_min_ng_ml,
               m.therapeutic_max_ng_ml,
               m.withdrawal_risk_score,
               m.cbd_interaction_strength
        FROM medications m
        LEFT JOIN medication_categories mc ON m.category_id = mc.id
        WHERE m.name LIKE ? OR m.generic_name LIKE ?
        LIMIT 1
      `).bind(`%${med.name}%`, `%${med.name}%`).first() as MedicationWithCategory | null;
      
      if (medResult) {
        const interactions = await env.DB.prepare(`
          SELECT * FROM cbd_interactions WHERE medication_id = ?
        `).bind(medResult.id).all();
        
        analysisResults.push({
          medication: medResult,
          interactions: interactions.results,
          mgPerDay: med.mgPerDay
        });
        
        if (interactions.results.length > 0) {
          const severity = interactions.results[0].severity;
          if (severity === 'critical') maxSeverity = 'critical';
          else if (severity === 'high' && maxSeverity !== 'critical') maxSeverity = 'high';
          else if (severity === 'medium' && maxSeverity === 'low') maxSeverity = 'medium';
        }
      } else {
        analysisResults.push({
          medication: { name: med.name, found: false },
          interactions: [],
          mgPerDay: med.mgPerDay,
          warning: 'Medikament nicht in Datenbank gefunden'
        });
      }
    }
    
    // ========== REDUMED-AI: MULTI-MEDICATION REDUCTION ALGORITHM ==========
    
    const adjustmentNotes: string[] = [];
    
    // Check if any medication is Benzodiazepine or Opioid (safety rule for CBD start dose)
    const hasBenzoOrOpioid = analysisResults.some(result => {
      const medName = result.medication.name.toLowerCase();
      const isBenzo = medName.includes('diazepam') || medName.includes('lorazepam') || 
                      medName.includes('alprazolam') || medName.includes('clonazepam') ||
                      medName.includes('benzo');
      const isOpioid = medName.includes('tramadol') || medName.includes('oxycodon') || 
                       medName.includes('morphin') || medName.includes('fentanyl') ||
                       medName.includes('opioid') || medName.includes('opiat');
      return isBenzo || isOpioid;
    });
    
    if (hasBenzoOrOpioid) {
      adjustmentNotes.push('⚠️ Benzodiazepine oder Opioide erkannt: CBD-Startdosis wird halbiert (Sicherheitsregel)');
    }
    
    // PlanIntelligenz 2.0: Count sensitive medications
    const sensitiveMedCount = analysisResults.filter(result => {
      const medName = result.medication.name?.toLowerCase() || '';
      const categoryName = (result.medication as MedicationWithCategory)?.category_name?.toLowerCase() || '';
      const riskLevel = (result.medication as MedicationWithCategory)?.risk_level?.toLowerCase() || '';
      
      return (
        medName.includes('benzo') || medName.includes('diazepam') || medName.includes('lorazepam') ||
        medName.includes('alprazolam') || medName.includes('clonazepam') ||
        medName.includes('tramadol') || medName.includes('oxycodon') || medName.includes('morphin') ||
        medName.includes('antidepress') || medName.includes('ssri') || medName.includes('snri') ||
        medName.includes('epileps') || medName.includes('antikonvulsiv') ||
        medName.includes('marcumar') || medName.includes('warfarin') || medName.includes('blutverdünn') ||
        medName.includes('immunsuppress') || medName.includes('ciclosporin') ||
        categoryName.includes('benzo') || categoryName.includes('antidepress') ||
        categoryName.includes('epileps') || categoryName.includes('blutverdünn') ||
        categoryName.includes('immunsuppress') || categoryName.includes('opioid') ||
        riskLevel === 'very_high' || riskLevel === 'high'
      );
    }).length;
    
    // CBD Dosing: Body weight-based (0.5 mg/kg start → 1.0 mg/kg end)
    const defaultWeight = 70; // Default if no weight provided
    const userWeight = weight || defaultWeight;
    
    let cbdStartMg = userWeight * 0.5; // Start: 0.5 mg/kg
    const cbdEndMg = userWeight * 1.0;   // End: 1.0 mg/kg
    
    // Safety Rule: Halve CBD start dose if Benzos/Opioids present
    if (hasBenzoOrOpioid) {
      cbdStartMg = cbdStartMg / 2;
      adjustmentNotes.push(`🔒 CBD-Startdosis reduziert auf ${Math.round(cbdStartMg * 10) / 10} mg/Tag (Sicherheit)`);
    }
    
    // Age-based CBD adjustments
    if (age && age >= 65) {
      cbdStartMg *= 0.8;
      adjustmentNotes.push('👴 CBD-Dosis angepasst für Senioren (65+)');
    }
    
    // BMI-based CBD adjustments
    if (weight && height && bmi) {
      if (bmi < 18.5) {
        cbdStartMg *= 0.85;
        adjustmentNotes.push('⚖️ CBD-Dosis angepasst: Untergewicht (BMI < 18.5)');
      } else if (bmi > 30) {
        cbdStartMg *= 1.1;
        adjustmentNotes.push('⚖️ CBD-Dosis angepasst: Übergewicht (BMI > 30)');
      }
    }
    
    // Calculate weekly CBD increase (linear)
    const cbdWeeklyIncrease = (cbdEndMg - cbdStartMg) / durationWeeks;
    
    // Generate weekly plan with bottle tracking
    const cbdPlan = generateWeeklyPlanWithBottleTracking(cbdStartMg, cbdEndMg, durationWeeks);
    
    // Merge CBD tracking with medication reduction data
    const weeklyPlan = cbdPlan.map((cbdWeek: any) => {
      const week = cbdWeek.week;
      
      // Calculate medication doses for this week WITH CATEGORY SAFETY RULES
      const weekMedications = medications.map((med: any, index: number) => {
        const startMg = med.mgPerDay;
        
        // Find the medication's category data from analysisResults
        const medAnalysis = analysisResults[index];
        const medCategory = medAnalysis?.medication as MedicationWithCategory | null;
        
        // Apply category safety rules
        const safetyResult = applyCategorySafetyRules({
          startMg,
          reductionGoal,
          durationWeeks,
          medicationName: med.name,
          category: medCategory
        });
        
        const targetMg = safetyResult.effectiveTargetMg;
        const weeklyReduction = safetyResult.effectiveWeeklyReduction;
        const currentMg = startMg - (weeklyReduction * (week - 1));
        
        // PlanIntelligenz 2.0: Calculate reduction speed per medication
        const reductionSpeed = startMg > 0 ? weeklyReduction / startMg : 0;
        const reductionSpeedPct = Math.round(reductionSpeed * 100 * 10) / 10;
        
        return {
          name: med.name,
          startMg: Math.round(startMg * 10) / 10,
          currentMg: Math.round(currentMg * 10) / 10,
          targetMg: Math.round(targetMg * 10) / 10,
          reduction: Math.round(weeklyReduction * 10) / 10,
          reductionPercent: Math.round(((startMg - currentMg) / startMg) * 100),
          reductionSpeedPct, // PlanIntelligenz 2.0: New field
          // NEW: Safety information
          safety: week === 1 ? { // Only add safety info to first week
            appliedCategoryRules: safetyResult.appliedCategoryRules,
            limitedByCategory: safetyResult.limitedByCategory,
            notes: safetyResult.safetyNotes
          } : undefined
        };
      });
      
      // Calculate total medication load
      const totalMedicationLoad = weekMedications.reduce((sum: number, med: any) => sum + med.currentMg, 0);
      
      // PlanIntelligenz 2.0: Calculate cannabinoid mg/kg body weight
      const cannabinoidMgPerKg = userWeight > 0 
        ? Math.round((cbdWeek.actualCbdMg / userWeight) * 10) / 10 
        : null;
      
      // PlanIntelligenz 2.0: Calculate cannabinoid-to-medication ratio
      const cannabinoidToLoadRatio = totalMedicationLoad > 0 
        ? Math.round((cbdWeek.actualCbdMg / totalMedicationLoad) * 1000) / 10 // Percentage with 1 decimal
        : null;
      
      // PlanIntelligenz 2.0: Weekly cannabinoid intake (mg/week)
      const weeklyCannabinoidIntakeMg = Math.round(cbdWeek.actualCbdMg * 7 * 10) / 10;
      
      return {
        week,
        medications: weekMedications,
        totalMedicationLoad: Math.round(totalMedicationLoad * 10) / 10,
        cbdDose: cbdWeek.cbdDose,
        kannasanProduct: cbdWeek.kannasanProduct,
        morningSprays: cbdWeek.morningSprays,
        eveningSprays: cbdWeek.eveningSprays,
        totalSprays: cbdWeek.totalSprays,
        actualCbdMg: cbdWeek.actualCbdMg,
        bottleStatus: cbdWeek.bottleStatus,
        // PlanIntelligenz 2.0: New weekly metrics
        cannabinoidMgPerKg,
        cannabinoidToLoadRatio,
        weeklyCannabinoidIntakeMg
      };
    });
    
    // Get first week's MEDLESS product for product info box
    const firstWeekMedless = weeklyPlan[0];
    
    // Calculate total costs for the plan
    const costAnalysis = calculatePlanCosts(weeklyPlan);
    
    // PlanIntelligenz 2.0: Calculate overall medication load metrics
    const overallStartLoad = medications.reduce((sum: number, med: any) => sum + med.mgPerDay, 0);
    const overallEndLoad = weeklyPlan.length > 0 
      ? weeklyPlan[weeklyPlan.length - 1].medications.reduce((sum: number, med: any) => sum + med.targetMg, 0)
      : overallStartLoad;
    const totalLoadReductionPct = overallStartLoad > 0 
      ? Math.round(((overallStartLoad - overallEndLoad) / overallStartLoad) * 1000) / 10
      : 0;
    
    // PlanIntelligenz 2.0: Calculate average reduction speed
    const reductionSpeeds = medications.map((med: any, index: number) => {
      const medAnalysis = analysisResults[index];
      const medCategory = medAnalysis?.medication as MedicationWithCategory | null;
      
      const safetyResult = applyCategorySafetyRules({
        startMg: med.mgPerDay,
        reductionGoal,
        durationWeeks,
        medicationName: med.name,
        category: medCategory
      });
      
      const weeklyReduction = safetyResult.effectiveWeeklyReduction;
      return med.mgPerDay > 0 ? (weeklyReduction / med.mgPerDay) * 100 : 0;
    });
    
    const avgReductionSpeedPct = reductionSpeeds.length > 0
      ? reductionSpeeds.reduce((sum: number, speed: number) => sum + speed, 0) / reductionSpeeds.length
      : 0;
    
    // PlanIntelligenz 2.0: Categorize average reduction speed
    let reductionSpeedCategory = 'moderat';
    if (avgReductionSpeedPct < 2) {
      reductionSpeedCategory = 'sehr langsam';
    } else if (avgReductionSpeedPct > 5) {
      reductionSpeedCategory = 'relativ schnell';
    }
    
    // PlanIntelligenz 2.0: Calculate weeks to CBD target
    const weeksToCbdTarget = cbdWeeklyIncrease > 0 
      ? Math.round(((cbdEndMg - cbdStartMg) / cbdWeeklyIncrease) * 10) / 10
      : null;
    
    // PlanIntelligenz 2.0: Calculate cannabinoid increase percentage per week
    const cannabinoidIncreasePctPerWeek = cbdStartMg > 0 
      ? Math.round((cbdWeeklyIncrease / cbdStartMg) * 1000) / 10
      : null;
    
    // Collect all category safety notes from first week
    const categorySafetyNotes: string[] = [];
    if (weeklyPlan.length > 0 && weeklyPlan[0].medications) {
      weeklyPlan[0].medications.forEach((med: any) => {
        if (med.safety && med.safety.notes && med.safety.notes.length > 0) {
          categorySafetyNotes.push(...med.safety.notes);
        }
      });
    }
    
    // Build warnings array
    const warnings: string[] = [];
    if (maxSeverity === 'critical' || maxSeverity === 'high') {
      warnings.push('⚠️ Kritische Wechselwirkungen erkannt!');
      warnings.push('Konsultieren Sie unbedingt einen Arzt vor der Cannabinoid-Einnahme.');
    }
    // Add category safety notes to warnings
    if (categorySafetyNotes.length > 0) {
      warnings.push(...categorySafetyNotes);
    }
    
    return c.json({
      success: true,
      analysis: analysisResults,
      maxSeverity,
      weeklyPlan,
      reductionGoal,
      costs: costAnalysis,
      cbdProgression: {
        startMg: Math.round(cbdStartMg * 10) / 10,
        endMg: Math.round(cbdEndMg * 10) / 10,
        weeklyIncrease: Math.round(cbdWeeklyIncrease * 10) / 10
      },
      product: {
        name: firstWeekMedless.kannasanProduct.name,
        nr: firstWeekMedless.kannasanProduct.nr,
        type: 'CBD Dosier-Spray',
        packaging: '10ml Flasche mit Pumpsprühaufsatz',
        concentration: `${firstWeekMedless.kannasanProduct.cbdPerSpray} mg CBD pro Sprühstoß`,
        cbdPerSpray: firstWeekMedless.kannasanProduct.cbdPerSpray,
        twoSprays: `${firstWeekMedless.kannasanProduct.cbdPerSpray * 2} mg CBD bei 2 Sprühstößen`,
        dosageUnit: 'Sprühstöße',
        totalSpraysPerDay: firstWeekMedless.totalSprays,
        morningSprays: firstWeekMedless.morningSprays,
        eveningSprays: firstWeekMedless.eveningSprays,
        actualDailyMg: firstWeekMedless.actualCbdMg,
        application: 'Oral: Sprühstoß direkt in den Mund oder unter die Zunge. Produkt vor Gebrauch gut schütteln.',
        note: 'Produkt kann sich wöchentlich ändern basierend auf CBD-Dosis'
      },
      personalization: {
        firstName,
        gender,
        age,
        weight,
        height,
        bmi,
        bsa,
        idealWeightKg, // PlanIntelligenz 2.0: Ideal weight
        cbdStartMg: Math.round(cbdStartMg * 10) / 10,
        cbdEndMg: Math.round(cbdEndMg * 10) / 10,
        hasBenzoOrOpioid,
        notes: adjustmentNotes
      },
      warnings,
      // NEW: Category safety summary
      categorySafety: {
        appliedRules: categorySafetyNotes.length > 0,
        notes: categorySafetyNotes
      },
      // PlanIntelligenz 2.0: New overall metrics
      planIntelligence: {
        overallStartLoad: Math.round(overallStartLoad * 10) / 10,
        overallEndLoad: Math.round(overallEndLoad * 10) / 10,
        totalLoadReductionPct,
        avgReductionSpeedPct: Math.round(avgReductionSpeedPct * 10) / 10,
        reductionSpeedCategory,
        weeksToCbdTarget,
        cannabinoidIncreasePctPerWeek,
        totalMedicationCount: medications.length,
        sensitiveMedCount
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return c.json({ success: false, error: error.message || 'Fehler bei der Analyse' }, 500);
  }
})

// Magazine Article Route: Endocannabinoid-System erklärt
app.get('/magazin/endocannabinoid-system-erklaert', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Das Endocannabinoid-System: Dein körpereigenes Schutzschild – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #F3E8FF;
      color: #7C3AED;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      font-size: 19px;
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 56px;
      margin-bottom: 24px;
    }
    
    .article-content h3 {
      font-size: 1.4rem;
      font-weight: 600;
      color: #0F5A46;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    
    .article-content p {
      margin-bottom: 24px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0;
      padding-left: 32px;
    }
    
    .article-content li {
      margin-bottom: 16px;
    }
    
    .article-content strong {
      color: #0F5A46;
      font-weight: 600;
    }
    
    .article-content em {
      color: #6B7280;
      font-style: italic;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      padding: 48px;
      border-radius: 16px;
      border-left: 5px solid #0F5A46;
      margin: 64px 0;
      text-align: center;
    }
    
    .cta-box h3 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin: 0 0 16px 0;
    }
    
    .cta-box p {
      font-size: 17px;
      color: #374151;
      margin-bottom: 24px;
    }
    
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 32px;
      font-size: 17px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #0E5A45, #10B981);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(14, 90, 69, 0.2);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 90, 69, 0.3);
    }
    
    footer {
      background: linear-gradient(135deg, #0E5A45, #10B981);
      padding: 60px 0 20px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      text-align: center;
    }
    
    .footer-content p {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.85);
    }
    
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }
      
      .article-detail {
        padding: 60px 24px;
      }
      
      .article-content {
        font-size: 17px;
      }
      
      .cta-box {
        padding: 32px 24px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="header-logo">
        <span class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </span>
      </a>
      
      <nav class="header-nav">
        <a href="/#ueber-medless">Über MEDLESS</a>
        <a href="/#funktionsweise">Funktionsweise</a>
        <a href="/#faq">FAQ</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#kontakt">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Content -->
  <article class="article-detail">
    <span class="article-category">Wissen & Grundlagen</span>
    <h1 class="article-title">Das Endocannabinoid-System: Dein körpereigenes Schutzschild (und warum kaum ein Arzt darüber spricht)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> Januar 2025</span>
      <span><i class="far fa-clock"></i> 10 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      <p class="intro"><strong>Stell dir vor, du hättest ein System in deinem Körper, das Schmerz, Schlaf und Stimmung ganz ohne Tabletten regulieren kann. Gute Nachricht: Du hast es. Hier lernst du es kennen.</strong></p>

      <hr>

      <h2>Das System, von dem 99% noch nie gehört haben</h2>
      <p>Dein Körper besitzt eine Art "inneren Apotheker". Ein System, das unermüdlich arbeitet, um dein Gleichgewicht zu halten. Es kann Schmerzen dämpfen, Ängste lösen und Entzündungen stoppen.</p>
      <p>Es heißt: <strong>Das Endocannabinoid-System (ECS).</strong></p>
      <p>Obwohl es eines der wichtigsten Systeme für unsere Gesundheit ist, kennt es kaum jemand. Warum?</p>
      <ul>
          <li><strong>Späte Entdeckung:</strong> Es wurde erst 1992 entdeckt (zum Vergleich: das Kreislaufsystem kennen wir seit dem 17. Jahrhundert).</li>
          <li><strong>Das Stigma:</strong> Der Name erinnert an Cannabis. Das hat die Forschung lange behindert, obwohl das ECS auch völlig ohne Cannabis existiert und arbeitet.</li>
      </ul>

      <h2>Was macht das ECS eigentlich? (Die einfache Erklärung)</h2>
      <p>Die Hauptaufgabe des ECS ist <strong>Homöostase</strong> – das biologische Gleichgewicht. Stell dir deinen Körper wie einen Hochseilartisten vor:</p>
      <ul>
          <li>Zu viel Stress? Das ECS beruhigt.</li>
          <li>Zu viel Schmerz? Das ECS dämpft.</li>
          <li>Zu viel Entzündung? Das ECS kühlt ab.</li>
      </ul>
      <p>Es ist der <strong>Dirigent</strong>, der dafür sorgt, dass alle anderen Systeme (Nerven, Hormone, Immunsystem) harmonisch zusammenspielen.</p>

      <h2>Die 3 Bausteine: Wie es funktioniert</h2>
      <p>Das ECS besteht aus drei Hauptkomponenten:</p>
      <ol>
          <li><strong>Die Botenstoffe (Endocannabinoide):</strong> Moleküle, die dein Körper selbst herstellt. Zum Beispiel <em>Anandamid</em> (das "Glücksmolekül"), das Stimmung und Wohlbefinden reguliert.</li>
          <li><strong>Die Empfänger (Rezeptoren):</strong> Sie sitzen auf deinen Zellen. <strong>CB1-Rezeptoren</strong> sind vor allem im Gehirn (steuern Schmerz, Schlaf) und <strong>CB2-Rezeptoren</strong> im Immunsystem (steuern Entzündungen).</li>
          <li><strong>Die Aufräumer (Enzyme):</strong> Sie bauen die Botenstoffe wieder ab, sobald die Arbeit erledigt ist.</li>
      </ol>

      <h2>Was das ECS alles kann (und warum du Medikamente nimmst)</h2>
      <p>Jetzt wird es spannend: Das ECS reguliert genau die Bereiche, für die die meisten Menschen Medikamente nehmen.</p>
      <ul>
          <li><strong>Schmerz:</strong> Wenn du dich verletzt, dämpft das ECS das Signal. (Medikament: Ibuprofen, Opioide).</li>
          <li><strong>Stimmung:</strong> Das ECS hilft, Ängste zu lösen. (Medikament: Antidepressiva).</li>
          <li><strong>Schlaf:</strong> Es steuert den Schlaf-Wach-Rhythmus. (Medikament: Schlafmittel).</li>
      </ul>
      <p><strong>Die MedLess-Erkenntnis:</strong> Wenn wir das ECS stärken, kann der Körper diese Aufgaben oft wieder besser selbst erledigen – und wir brauchen weniger Chemie von außen.</p>

      <h2>Wie du dein ECS natürlich stärkst</h2>
      <p>Du kannst dein ECS trainieren wie einen Muskel. Hier sind die besten Methoden:</p>
      <ul>
          <li>🏃 <strong>Bewegung ("Runner's High"):</strong> 30 Minuten moderates Ausdauertraining fluten dein Gehirn mit körpereigenen Glücksbotenstoffen (Anandamid).</li>
          <li>🐟 <strong>Ernährung (Omega-3):</strong> Endocannabinoide werden aus Fett gebaut. Ohne Omega-3-Fettsäuren (Walnüsse, Fischöl) kann dein Körper sie nicht herstellen.</li>
          <li>❄️ <strong>Kälte:</strong> Kurze, kalte Duschen aktivieren das ECS und erhöhen die Anzahl der Rezeptoren.</li>
          <li>🌿 <strong>Phyto-Cannabinoide (CBD):</strong> Pflanzliche Cannabinoide können dem ECS helfen, indem sie den Abbau der körpereigenen Botenstoffe verlangsamen. So bleibt dein "Schutzschild" länger aktiv.</li>
      </ul>

      <h2>Warum das ECS beim Absetzen von Medikamenten hilft</h2>
      <p>Wenn du Medikamente nimmst, fährt der Körper oft seine eigene Regulation herunter. Wenn du das Medikament absetzt, entsteht eine Lücke – das nennt man Entzug oder Rebound.</p>
      <p><strong>Hier kommt das ECS ins Spiel:</strong> Indem wir das ECS gezielt unterstützen, füllen wir diese Lücke auf natürliche Weise. Der Übergang wird sanfter, und Symptome wie Schlaflosigkeit oder Unruhe werden abgefedert.</p>

      <!-- CTA Box -->
      <div class="cta-box">
          <h3>Nutze deine innere Apotheke</h3>
          <p>Dein Körper ist keine defekte Maschine. Er besitzt ein mächtiges System zur Selbstregulation. Willst du wissen, wie stark dein ECS ist und wie es dir beim Reduzieren helfen kann?</p>
          <a href="/#planner-section" class="btn-primary">
            Jetzt kostenlose Analyse starten ➔
          </a>
      </div>

      <hr>

      <h3>Quellen & Referenzen</h3>
      <ul style="font-size: 0.9rem; color: #666;">
          <li><strong>Biological Psychiatry (2016):</strong> "An Introduction to the Endogenous Cannabinoid System".</li>
          <li><strong>Pharmacological Reviews (2006):</strong> "The Endocannabinoid System as an Emerging Target".</li>
          <li><strong>PNAS (2015):</strong> "A runner's high depends on cannabinoid receptors".</li>
          <li><strong>Drugcom (BZgA):</strong> "Endocannabinoid-System".</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient ausschließlich der Information. Er ersetzt keine ärztliche Beratung.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Medikamente absetzen - 7 Fehler
app.get('/magazin/medikamente-absetzen-7-fehler', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Medikamente absetzen: Die 7 gefährlichsten Fehler – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #DBEAFE;
      color: #1E40AF;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      font-size: 19px;
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 56px;
      margin-bottom: 24px;
    }
    
    .article-content h3 {
      font-size: 1.4rem;
      font-weight: 600;
      color: #0F5A46;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    
    .article-content p {
      margin-bottom: 24px;
    }
    
    .article-content ul {
      margin: 24px 0;
      padding-left: 32px;
    }
    
    .article-content li {
      margin-bottom: 16px;
    }
    
    .article-content strong {
      color: #0F5A46;
      font-weight: 600;
    }
    
    .article-content em {
      color: #6B7280;
      font-style: italic;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      padding: 48px;
      border-radius: 16px;
      border-left: 5px solid #0F5A46;
      margin: 64px 0;
      text-align: center;
    }
    
    .cta-box h3 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin: 0 0 16px 0;
    }
    
    .cta-box p {
      font-size: 17px;
      color: #374151;
      margin-bottom: 24px;
    }
    
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 32px;
      font-size: 17px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #0E5A45, #10B981);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(14, 90, 69, 0.2);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 90, 69, 0.3);
    }
    
    footer {
      background: linear-gradient(135deg, #0E5A45, #10B981);
      padding: 60px 0 20px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      text-align: center;
    }
    
    .footer-content p {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.85);
    }
    
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }
      
      .article-detail {
        padding: 60px 24px;
      }
      
      .article-content {
        font-size: 17px;
      }
      
      .cta-box {
        padding: 32px 24px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="header-logo">
        <span class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </span>
      </a>
      
      <nav class="header-nav">
        <a href="/#ueber-medless">Über MEDLESS</a>
        <a href="/#funktionsweise">Funktionsweise</a>
        <a href="/#faq">FAQ</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#kontakt">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Content -->
  <article class="article-detail">
    <span class="article-category">Sicherheit & Praxis</span>
    <h1 class="article-title">Medikamente absetzen: Die 7 gefährlichsten Fehler (und wie du sie vermeidest)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> Januar 2025</span>
      <span><i class="far fa-clock"></i> 12 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      <p class="intro"><strong>Du willst Medikamente reduzieren? Großartig. Aber Vorsicht: Der falsche Weg kann gefährlich werden. Erfahre hier, warum der "kalte Entzug" scheitert und wie du sicher ausschleichst.</strong></p>

      <hr>

      <h2>"Ich setze einfach ab" – warum das fast schiefging</h2>
      <p>Sarah, 58, hatte genug. Seit Jahren nahm sie acht verschiedene Tabletten. Die Nebenwirkungen waren schlimmer als ihre ursprünglichen Beschwerden. An einem Sonntagmorgen entschied sie: <em>"Das war's. Ich höre auf."</em></p>
      <p>Sie nahm keine ihrer Tabletten mehr. Drei Tage später saß sie in der Notaufnahme: Blutdruck 190/110, Herzrasen, Panik.</p>
      <p><strong>Die Diagnose:</strong> Rebound-Effekt durch abruptes Absetzen eines Betablockers.</p>
      <p>Sarah hatte einen klassischen Fehler gemacht. Der Wunsch nach weniger Medikamenten ist richtig (50% der Deutschen wollen reduzieren!), aber die Methode entscheidet über Erfolg oder Gefahr.</p>

      <h2>Fehler 1: Der kalte Entzug ("Cold Turkey")</h2>
      <p><strong>Was passiert:</strong> Du hörst von heute auf morgen auf. Von 100 auf 0.</p>
      <p><strong>Warum es gefährlich ist:</strong> Dein Körper hat sich an den Wirkstoff angepasst (Adaptation). Fehlt dieser plötzlich, reagiert der Körper mit einer massiven Gegenregulation.</p>
      <ul>
          <li><strong>Betablocker:</strong> Herzrasen, Blutdruckkrisen.</li>
          <li><strong>Antidepressiva:</strong> "Brain Zaps" (Stromschläge im Kopf), Übelkeit.</li>
          <li><strong>Schlafmittel:</strong> Krampfanfälle, massive Angstzustände.</li>
          <li><strong>Säureblocker (PPI):</strong> Extremes Sodbrennen (Rebound).</li>
      </ul>
      <p>✅ <strong>Die Lösung:</strong> Ausschleichen. Reduziere die Dosis schrittweise über Wochen.</p>

      <h2>Fehler 2: Alles gleichzeitig reduzieren</h2>
      <p><strong>Was passiert:</strong> Du willst schnell Ergebnisse und reduzierst Blutdruckmittel, Schmerzmittel und Schlafmittel gleichzeitig.</p>
      <p><strong>Warum es gefährlich ist:</strong> Wenn Probleme auftreten, weißt du nicht, welches Medikament fehlt. Du verlierst die Kontrolle.</p>
      <p>✅ <strong>Die Lösung:</strong> Ein Medikament nach dem anderen. Mache 4-6 Wochen Pause zwischen zwei Reduktionen.</p>

      <h2>Fehler 3: Alleingang ohne Arzt</h2>
      <p><strong>Was passiert:</strong> <em>"Mein Arzt hat eh keine Zeit"</em> – also machst du es allein.</p>
      <p><strong>Warum es gefährlich ist:</strong> Du kannst medizinische Warnsignale (Blutdruckspitzen, Laborwerte) nicht selbst beurteilen.</p>
      <p>✅ <strong>Die Lösung:</strong> Bereite das Gespräch vor. Nutze Tools wie MedLess, um einen Plan als Gesprächsgrundlage zu erstellen.</p>

      <h2>Fehler 4: Warnsignale ignorieren</h2>
      <p>Manche Symptome sind lebensbedrohlich. <strong>Gehe SOFORT zum Arzt bei:</strong></p>
      <ul>
          <li>Starkem Schwindel mit Ohnmachtsgefühl</li>
          <li>Herzrasen (Puls >120 in Ruhe)</li>
          <li>Krampfanfällen oder Muskelzuckungen</li>
          <li>Starker Verwirrtheit oder Suizidgedanken</li>
      </ul>

      <h2>Fehler 5: Keine Vorbereitung des Körpers</h2>
      <p>Du nimmst dem Körper die "Krücke" (Medikament) weg, hast aber die Muskeln nicht trainiert. Stärke dich <strong>vorher</strong>:</p>
      <ul>
          <li><strong>Schlaf:</strong> Optimiere deine Schlafhygiene.</li>
          <li><strong>Ernährung:</strong> Iss entzündungshemmend (Omega-3).</li>
          <li><strong>Wasser:</strong> Trinke 2-3 Liter täglich.</li>
      </ul>

      <h2>Fehler 6: Zu schnell reduzieren</h2>
      <p><strong>Die 10%-Regel:</strong> Experten empfehlen oft Schritte von nur 10-25% Reduktion. Je länger du ein Medikament nimmst, desto langsamer muss der Ausstieg sein. Die letzten Milligramme sind oft die schwersten!</p>

      <h2>Fehler 7: Die Ursache ignorieren</h2>
      <p>Das Medikament war nur das Pflaster. Wenn du es abreißt, blutet die Wunde wieder, wenn sie nicht geheilt ist. Arbeite parallel an der Ursache (Physiotherapie bei Schmerzen, Gewichtsreduktion bei Blutdruck).</p>

      <h2>Dein Geheimtipp: Das Endocannabinoid-System (ECS)</h2>
      <p>Um all diese Fehler zu vermeiden, nutzen wir bei MedLess dein körpereigenes <strong>Endocannabinoid-System</strong>. Wenn du Medikamente reduzierst, entsteht eine Lücke. Indem wir das ECS gezielt stärken (z.B. durch präzise dosierte Cannabinoide), füllen wir diese Lücke natürlich auf.</p>

      <!-- CTA Box -->
      <div class="cta-box">
          <h3>Dein sicherer Fahrplan</h3>
          <p>Sarah hat es beim zweiten Versuch geschafft – mit Plan, Arzt und Geduld. Möchtest du wissen, wie dein persönlicher Ausschleichplan aussehen könnte?</p>
          <a href="/#planner-section" class="btn-primary">
            Jetzt kostenlose KI-Analyse starten ➔
          </a>
      </div>

      <hr>

      <h3>Quellen & Referenzen</h3>
      <ul style="font-size: 0.9rem; color: #666;">
          <li><strong>Apotheken Umschau (2024):</strong> "Medikamente einschleichen und ausschleichen".</li>
          <li><strong>Deutsches Ärzteblatt:</strong> "Absetz- und Rebound-Phänomene bei Antidepressiva".</li>
          <li><strong>SWR (2025):</strong> "Antidepressiva absetzen ohne Symptome".</li>
          <li><strong>CHIP (2025):</strong> "Rebound-Effekt: Diese Medikamente niemals abrupt absetzen".</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient ausschließlich der Information und ersetzt keine ärztliche Beratung. Bei Notfällen wählen Sie 112.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Endocannabinoid-System
app.get('/magazin/endocannabinoid-system-erklaert', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Das Endocannabinoid-System: Dein körpereigenes Schutzschild – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #FEF3C7;
      color: #92400E;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      font-size: 19px;
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul {
      margin: 24px 0 24px 24px;
      list-style-type: disc;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .cta-box {
      background: linear-gradient(135deg, #0F5A46 0%, #1DB98D 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin: 48px 0;
      text-align: center;
    }
    
    .cta-box h3 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: white;
    }
    
    .cta-box p {
      font-size: 1.1rem;
      margin-bottom: 24px;
      opacity: 0.95;
    }
    
    .cta-button {
      display: inline-block;
      background: white;
      color: #0F5A46;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    
    <span class="article-category">Wissen & Grundlagen</span>
    
    <h1 class="article-title">
      Das Endocannabinoid-System: Dein körpereigenes Schutzschild
    </h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 10. Januar 2025</span>
      <span><i class="far fa-clock"></i> 6 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        Stell dir vor, dein Körper hätte eine eigene Apotheke gegen Schmerz, Stress und Entzündungen – eine biologische Schutzinstanz, die rund um die Uhr arbeitet, ohne dass du es merkst. Die gute Nachricht: Du hast sie bereits. Sie heißt <strong>Endocannabinoid-System (ECS)</strong>.
      </p>
      
      <p>
        Trotz seiner zentralen Rolle ist das ECS eines der am wenigsten bekannten Körpersysteme – selbst vielen Ärzten. Warum? Weil es erst in den 1990er Jahren entdeckt wurde. Seitdem gilt es als <strong>Regulationssystem des Körpers</strong>, das alles von Schmerzwahrnehmung bis Stimmung beeinflusst.
      </p>
      
      <h2>Was ist das Endocannabinoid-System?</h2>
      
      <p>
        Das ECS ist ein <strong>körpereigenes Netzwerk aus Botenstoffen und Rezeptoren</strong>, das als Frühwarnsystem und Reparaturmechanismus dient. Es besteht aus drei Hauptkomponenten:
      </p>
      
      <ul>
        <li><strong>Endocannabinoide</strong> (körpereigene Botenstoffe wie Anandamid und 2-AG)</li>
        <li><strong>Rezeptoren</strong> (CB1 im Gehirn/Nervensystem, CB2 im Immunsystem)</li>
        <li><strong>Enzyme</strong>, die Endocannabinoide auf- und abbauen</li>
      </ul>
      
      <p>
        Wenn dein Körper aus dem Gleichgewicht gerät – etwa durch Stress, Schmerz oder Entzündungen – aktiviert das ECS seine „Notfall-Apotheke" und stellt gezielt Endocannabinoide her. Diese docken an Rezeptoren an und bringen dich zurück in Balance. Mediziner nennen das <strong>Homöostase</strong>.
      </p>
      
      <h2>Warum ist das ECS so wichtig?</h2>
      
      <p>
        Das Endocannabinoid-System reguliert fundamentale Körperfunktionen:
      </p>
      
      <ul>
        <li><strong>Schmerzverarbeitung</strong> – Es dämpft Schmerzsignale im Nervensystem</li>
        <li><strong>Entzündungsreaktionen</strong> – Es bremst überschießende Immunantworten</li>
        <li><strong>Stressregulation</strong> – Es moduliert Angst und emotionale Belastung</li>
        <li><strong>Schlaf-Wach-Rhythmus</strong> – Es steuert den zirkadianen Rhythmus</li>
        <li><strong>Appetit & Verdauung</strong> – Es beeinflusst Hunger und Darmfunktion</li>
        <li><strong>Gedächtnis & Lernen</strong> – Es schützt Nervenzellen vor Überlastung</li>
      </ul>
      
      <p>
        Forscher sprechen mittlerweile von einer <strong>„Endocannabinoid-Defizienz"</strong> als möglicher Ursache für chronische Schmerzen, Migräne, Fibromyalgie und Reizdarmsyndrom.
      </p>
      
      <h2>Wie CBD das Endocannabinoid-System unterstützt</h2>
      
      <p>
        Hier wird es spannend: <strong>CBD (Cannabidiol)</strong> aus der Hanfpflanze interagiert direkt mit dem ECS – allerdings anders, als viele denken.
      </p>
      
      <p>
        CBD dockt nicht direkt an CB1- oder CB2-Rezeptoren an. Stattdessen:
      </p>
      
      <ul>
        <li><strong>Hemmt Enzyme</strong>, die körpereigene Endocannabinoide abbauen → mehr eigene Botenstoffe bleiben verfügbar</li>
        <li><strong>Aktiviert zusätzliche Rezeptoren</strong> (z.B. Serotonin-Rezeptoren 5-HT1A für Stimmungsregulation)</li>
        <li><strong>Reduziert chronische Entzündungen</strong>, indem es das Immunsystem moduliert</li>
        <li><strong>Schützt Nervenzellen</strong> vor oxidativem Stress und Übererregung</li>
      </ul>
      
      <p>
        Das Ergebnis: Dein ECS arbeitet effizienter – ohne dass CBD dich „high" macht (das tut nur THC, das direkt an CB1-Rezeptoren bindet).
      </p>
      
      <h2>Der Zusammenhang mit Medikamentenreduktion</h2>
      
      <p>
        Viele chronische Medikamente (Schmerzmittel, Antidepressiva, Schlaftabletten) greifen in dieselben Körperfunktionen ein, die das ECS steuert – oft mit Nebenwirkungen und Abhängigkeitsrisiko.
      </p>
      
      <p>
        Wenn du dein ECS durch CBD unterstützt, kann dein Körper möglicherweise:
      </p>
      
      <ul>
        <li>Schmerzen besser selbst regulieren → weniger Schmerzmittel nötig</li>
        <li>Stress und Angst natürlicher abbauen → niedrigere Antidepressiva-Dosis</li>
        <li>Schlaf ohne chemische Einschlafhilfen finden → Ausschleichen von Z-Drugs</li>
      </ul>
      
      <p>
        <strong>Wichtig:</strong> CBD ist kein „Ersatz" für Medikamente, sondern ein <strong>modulierender Begleiter</strong>, der deinem Körper hilft, wieder selbst zu regulieren – was langfristig Medikamentendosen reduzieren kann.
      </p>
      
      <h2>Warum spricht niemand darüber?</h2>
      
      <p>
        Das ECS wurde erst 1992 entdeckt – zu spät für die meisten medizinischen Lehrpläne. Hinzu kommt die Stigmatisierung von Cannabis, die jahrzehntelang auch CBD-Forschung blockierte.
      </p>
      
      <p>
        Heute gibt es über 30.000 wissenschaftliche Studien zum ECS – aber das Wissen ist noch nicht in der Praxis angekommen. Das ändert sich gerade, langsam aber sicher.
      </p>
      
      <div class="cta-box">
        <h3>Unterstütze dein Endocannabinoid-System intelligent</h3>
        <p>
          Erfahre in unserer kostenlosen Analyse, wie CBD gezielt dein ECS aktivieren und deine Medikation langfristig reduzieren kann – mit einem individuellen 8-Wochen-Plan.
        </p>
        <a href="/#start-analysis" class="cta-button">Kostenlos Analyse starten</a>
      </div>
      
      <h2>Fazit: Dein Körper kann mehr, als du denkst</h2>
      
      <p>
        Das Endocannabinoid-System ist kein esoterisches Konzept, sondern <strong>messbare Biologie</strong>. Es ist dein körpereigenes Schutzschild gegen Schmerz, Stress und Entzündungen – und es funktioniert besser, wenn du es unterstützt.
      </p>
      
      <p>
        CBD gibt deinem ECS die Werkzeuge zurück, die es braucht, um dich selbst zu regulieren – ohne Abhängigkeiten, ohne High, ohne Nebenwirkungen schwerer Medikamente.
      </p>
      
      <p>
        <strong>Die Frage ist nicht, ob dein Körper das kann. Die Frage ist: Gibst du ihm die Chance?</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 48px 0;" />
      
      <h3 style="font-size: 1rem; font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Weiterführende Literatur</h3>
      <ul style="font-size: 0.9rem; color: #6B7280;">
          <li><strong>Russo, E.B. (2016):</strong> "Clinical Endocannabinoid Deficiency Reconsidered" – Cannabis and Cannabinoid Research.</li>
          <li><strong>Lu, H.C. & Mackie, K. (2016):</strong> "An Introduction to the Endogenous Cannabinoid System" – Biological Psychiatry.</li>
          <li><strong>Pacher, P. et al. (2006):</strong> "The Endocannabinoid System as an Emerging Target of Pharmacotherapy" – Pharmacological Reviews.</li>
          <li><strong>Blessing, E.M. et al. (2015):</strong> "Cannabidiol as a Potential Treatment for Anxiety Disorders" – Neurotherapeutics.</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient ausschließlich der Information und ersetzt keine ärztliche Beratung. Jede Medikamentenänderung muss ärztlich begleitet werden.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Antidepressiva absetzen
app.get('/magazin/antidepressiva-absetzen-ohne-entzug', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Antidepressiva absetzen: Der sanfte Weg ohne Entzugserscheinungen – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #FCE7F3;
      color: #BE185D;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      font-size: 19px;
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      font-size: 1.1rem;
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    
    <span class="article-category">Mentale Gesundheit</span>
    
    <h1 class="article-title">Antidepressiva absetzen: Der sanfte Weg ohne Entzugserscheinungen</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 12. Januar 2025</span>
      <span><i class="far fa-clock"></i> 8 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>Du möchtest Antidepressiva absetzen, hast aber Angst vor dem "Loch" danach? Erfahre, warum Absetzerscheinungen entstehen und wie du sie mit einem 8-Wochen-Plan und ECS-Unterstützung vermeidest.</strong>
      </p>
      
      <hr>
      
      <h2>Die Angst vor dem Absetzen: "Schaffe ich das?"</h2>
      <p>Kennst du dieses Gefühl? Du nimmst seit Monaten Antidepressiva. Sie haben dir geholfen, aus dem Gröbsten herauszukommen. Du fühlst dich stabil und möchtest eigentlich reduzieren.</p>
      <p>Aber dann hörst du die Geschichten: <em>"Ich hatte tagelang Schwindel"</em>, <em>"Die Angst kam sofort zurück"</em>, <em>"Ich musste wieder anfangen"</em>.</p>
      <p>Die Angst vor dem sogenannten <strong>Absetzsyndrom</strong> hält Millionen Menschen davon ab, den Schritt in die Unabhängigkeit zu wagen.</p>
      <p>Die gute Nachricht: Mit dem richtigen Plan, Geduld und der Unterstützung deines körpereigenen <strong>Endocannabinoid-Systems (ECS)</strong> kannst du den Ausstieg sanft und sicher schaffen.</p>
      
      <h2>Warum entstehen Absetzerscheinungen überhaupt?</h2>
      <p>Antidepressiva (vor allem SSRIs wie Citalopram oder Sertralin) wirken, indem sie den Serotoninspiegel im Gehirn künstlich erhöhen. Dein Gehirn gewöhnt sich an dieses hohe Niveau ("Down-Regulation").</p>
      <p>Wenn du das Medikament plötzlich wegnimmst, fehlt dem Gehirn der Botenstoff. Es entsteht ein neurochemisches Ungleichgewicht.</p>
      <p><strong>Die Folgen:</strong></p>
      <ul>
          <li><strong>Körperlich:</strong> Schwindel ("Brain Zaps"), Übelkeit, Zittern.</li>
          <li><strong>Psychisch:</strong> Reizbarkeit, plötzliche Tränenausbrüche, Angst.</li>
      </ul>
      <p><strong>Wichtig:</strong> <em>Diese Symptome sind meist KEIN Rückfall in die Depression, sondern eine vorübergehende Anpassungsreaktion des Gehirns!</em></p>
      
      <h2>Die Wahrheit in Zahlen</h2>
      <p>Eine große Meta-Analyse der Charité Berlin (2024) gibt Entwarnung:</p>
      <ul>
          <li>Nur <strong>15%</strong> der Patienten erleben echte, pharmakologische Absetzsymptome.</li>
          <li>Nur <strong>3%</strong> entwickeln schwere Symptome.</li>
          <li><strong>97%</strong> kommen gut durch den Prozess – wenn sie es richtig machen.</li>
      </ul>
      
      <h2>Der sanfte 8-Wochen-Plan: So gehst du vor</h2>
      <p>🚨 <strong>Grundregel:</strong> Setze niemals ohne Rücksprache mit deinem Arzt ab!</p>
      
      <h3>Phase 1: Die Vorbereitung (Woche 0)</h3>
      <p>Bevor du auch nur ein Milligramm reduzierst:</p>
      <ul>
          <li>Bist du seit mindestens 6 Monaten stabil?</li>
          <li>Hast du gerade keinen akuten Stress (Jobwechsel, Trennung)?</li>
          <li>Hast du mit deinem Arzt gesprochen?</li>
      </ul>
      
      <h3>Phase 2: Das langsame Ausschleichen (Woche 1-8)</h3>
      <p>Die goldene Regel: <strong>Langsam ist sicher.</strong> Reduziere die Dosis in kleinen Schritten (z.B. alle 2-4 Wochen um 10-25%).</p>
      <p><em>Tipp: Die letzten Milligramme sind oft die schwersten. Hier besonders langsam vorgehen!</em></p>
      
      <h3>Phase 3: Die Stabilisierung (Woche 9+)</h3>
      <p>Nach der letzten Tablette ist der Prozess nicht vorbei. Dein Gehirn lernt jetzt, wieder selbstständig zu regulieren. Hier ist Unterstützung entscheidend.</p>
      
      <h2>Dein natürlicher Fallschirm: Das Endocannabinoid-System (ECS)</h2>
      <p>Warum schaffen manche das Absetzen spielend und andere nicht? Ein Schlüssel liegt im <strong>Endocannabinoid-System</strong>. Dieses körpereigene System reguliert Stimmung, Schlaf und Stressverarbeitung. Es arbeitet eng mit dem Serotonin-System zusammen.</p>
      <p><strong>Die MedLess-Strategie:</strong> Wenn wir das Antidepressivum (die "Krücke") wegnehmen, stärken wir gleichzeitig das ECS (den "Muskel").</p>
      <ul>
          <li><strong>Stimmungs-Balance:</strong> Ein starkes ECS kann Stimmungstiefs abfedern.</li>
          <li><strong>Schlaf-Qualität:</strong> Es hilft, den Schlaf-Wach-Rhythmus ohne Chemie zu stabilisieren.</li>
      </ul>
      
      <h2>5 Strategien, um dein ECS beim Absetzen zu stärken</h2>
      <ol>
          <li><strong>Omega-3-Fettsäuren:</strong> Sie sind das "Baumaterial" für deine Endocannabinoide. (Fischöl, Algenöl).</li>
          <li><strong>Sport:</strong> 30 Minuten Laufen oder Radfahren setzen körpereigene Glücksbotenstoffe (Anandamid) frei.</li>
          <li><strong>CBD (Cannabidiol):</strong> Pflanzliches CBD kann das ECS unterstützen, ohne psychoaktiv zu wirken. <em>Wichtig: Mit dem Arzt besprechen!</em></li>
          <li><strong>Darm-Gesundheit:</strong> 90% des Serotonins werden im Darm gebildet. Probiotika können helfen.</li>
          <li><strong>Stress-Reduktion:</strong> Meditation senkt Cortisol, den Feind des ECS.</li>
      </ol>
      
      <h2>Rote Flaggen: Wann du sofort zum Arzt musst</h2>
      <p>Brich den Versuch ab und kontaktiere deinen Arzt, wenn:</p>
      <ul>
          <li>Suizidgedanken auftreten.</li>
          <li>Du tagelang nicht schlafen kannst.</li>
          <li>Du schwere Panikattacken hast.</li>
      </ul>
      <p>In diesem Fall war der Schritt vielleicht zu groß. <strong>Keine Panik:</strong> Oft reicht es, auf die letzte Dosis zurückzugehen, sich zu stabilisieren und es dann langsamer erneut zu versuchen.</p>
      
      <div class="cta-box">
          <h3>Dein individueller Fahrplan</h3>
          <p>Du bist nicht abhängig – du bist gewöhnt. Es gibt einen Weg aus den Medikamenten. Möchtest du einen individuellen, ärztlich prüfbaren Ausschleichplan erstellen lassen?</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose KI-Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style="font-size: 1rem; font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Studien</h3>
      <ul style="font-size: 0.9rem; color: #6B7280;">
          <li><strong>Charité Berlin (2024):</strong> "Neue Daten zur Häufigkeit von Absetzsymptomen".</li>
          <li><strong>Ärzteblatt (2025):</strong> "Absetzsymptome meist mild".</li>
          <li><strong>Royal College of Psychiatrists:</strong> "Stopping Antidepressants".</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient der Information und ersetzt keine ärztliche Behandlung. Setzen Sie Antidepressiva niemals eigenständig ab. Bei psychischen Notfällen wenden Sie sich an die Telefonseelsorge (0800 1110111).</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Schlaftabletten loswerden
app.get('/magazin/schlaftabletten-loswerden', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Schlaftabletten loswerden: Endlich wieder natürlich einschlafen – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #E0E7FF;
      color: #3730A3;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      font-size: 19px;
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      font-size: 1.1rem;
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    
    <span class="article-category">Schlaf & Erholung</span>
    
    <h1 class="article-title">Schlaftabletten loswerden: Endlich wieder natürlich einschlafen (Der 8-Wochen-Plan)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 15. Januar 2025</span>
      <span><i class="far fa-clock"></i> 7 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>Jede Nacht das gleiche Spiel: Ohne Tablette keine Ruhe. Erfahre, wie du die Abhängigkeit durchbrichst und deinem Körper wieder beibringst, natürlich zu schlafen.</strong>
      </p>
      
      <hr>
      
      <h2>Die stille Abhängigkeit: "Ohne geht es nicht mehr"</h2>
      <p>Du öffnest die Schublade. Eine Tablette. Vielleicht zwei. Du weißt, dass du davon wegkommen solltest. Aber die Angst vor der schlaflosen Nacht ist größer.</p>
      <p>Du bist nicht allein: <strong>1,5 Millionen Menschen</strong> in Deutschland sind von Schlafmitteln abhängig. Besonders tückisch sind Benzodiazepine und sogenannte Z-Substanzen (Zolpidem, Zopiclon).</p>
      <p>Die gute Nachricht: Dein Körper hat das Schlafen nicht verlernt. Er hat es nur vergessen. Mit dem richtigen Plan kannst du ihn wieder trainieren.</p>
      
      <h2>Warum Schlafmittel zur Falle werden</h2>
      <p>Schlafmittel verstärken den beruhigenden Botenstoff GABA im Gehirn. Das funktioniert anfangs super. Aber nach wenigen Wochen (oft schon nach 4!) passt sich das Gehirn an.</p>
      <ul>
          <li><strong>Toleranz:</strong> Du brauchst immer mehr für die gleiche Wirkung.</li>
          <li><strong>Rebound:</strong> Wenn du die Tablette weglässt, schläfst du schlechter als je zuvor.</li>
      </ul>
      <p><strong>Das Ergebnis:</strong> Du nimmst die Tablette nicht mehr, um zu schlafen – sondern nur noch, um den Entzug zu vermeiden.</p>
      
      <h2>Der sichere Ausweg: Der 8-Wochen-Plan</h2>
      <p>🚨 <strong>Wichtig:</strong> Setze Schlafmittel NIEMALS kalt ab ("Cold Turkey"). Das kann zu Krampfanfällen und massiver Schlaflosigkeit führen.</p>
      
      <h3>Phase 1: Vorbereitung (Woche 0)</h3>
      <ul>
          <li>Ist deine Lebenssituation gerade stabil?</li>
          <li>Hast du mit deinem Arzt gesprochen?</li>
          <li>Hast du ein Schlaftagebuch gestartet?</li>
      </ul>
      
      <h3>Phase 2: Langsames Ausschleichen (Woche 1-8)</h3>
      <p>Wir reduzieren die Dosis in winzigen Schritten (z.B. alle 2 Wochen um 10-20%).</p>
      <p><em>Beispiel:</em> Eine halbe Tablette weniger ist oft schon zu viel. Wir reden von Krümeln! Das Ziel ist, dass das Gehirn den Entzug gar nicht bemerkt.</p>
      
      <h3>Phase 3: Stabilisierung</h3>
      <p>Dein Gehirn lernt jetzt wieder, eigenes GABA zu produzieren. Hier ist Geduld gefragt.</p>
      
      <h2>Dein natürlicher Schlaf-Lehrer: Das ECS</h2>
      <p>Warum schlafen manche Menschen wie Steine und andere nicht? Ein Schlüssel ist das <strong>Endocannabinoid-System (ECS)</strong>. Es steuert deinen Schlaf-Wach-Rhythmus und die Tiefe deines Schlafs.</p>
      <p><strong>Die MedLess-Strategie:</strong> Während wir die chemische Bremse (Tablette) lösen, stärken wir das natürliche Bremssystem (ECS).</p>
      <ul>
          <li><strong>Tieferer Schlaf:</strong> Ein starkes ECS fördert die Tiefschlafphasen, die durch Tabletten oft unterdrückt werden.</li>
          <li><strong>Weniger Angst:</strong> Es beruhigt das Gedankenkarussell am Abend.</li>
      </ul>
      
      <h2>5 natürliche Helfer (statt Chemie)</h2>
      <ol>
          <li><strong>Melatonin:</strong> Das körpereigene Schlafhormon (als Spray oder Kapsel) hilft beim "Reset" der inneren Uhr.</li>
          <li><strong>CBD (Cannabidiol):</strong> Kann das ECS unterstützen und Angst lösen, ohne abhängig zu machen.</li>
          <li><strong>Baldrian & Hopfen:</strong> Die Klassiker. Sie wirken ähnlich wie Schlafmittel auf GABA, aber viel sanfter.</li>
          <li><strong>Lavendelöl:</strong> Studien zeigen, dass es Angstzustände effektiv lindert.</li>
          <li><strong>Magnesium:</strong> Entspannt die Muskeln und beruhigt die Nerven.</li>
      </ol>
      
      <h2>Die 3 goldenen Regeln der Schlafhygiene</h2>
      <p>Ohne diese Basis hilft kein Medikament der Welt dauerhaft:</p>
      <ol>
          <li><strong>Das Bett ist nur zum Schlafen da:</strong> Kein Handy, kein Fernseher, kein Grübeln. Wenn du nach 20 Min. nicht schläfst: Aufstehen!</li>
          <li><strong>Licht aus, Dunkelheit an:</strong> Melatonin braucht Dunkelheit. Blaulicht (Handy) ist Gift für den Schlaf.</li>
          <li><strong>Kühle Temperatur:</strong> 16-18 Grad sind ideal. Dein Körper muss abkühlen, um einzuschlafen.</li>
      </ol>
      
      <div class="cta-box">
          <h3>Vertrau deinem Körper</h3>
          <p>Du brauchst keine Tabletten, um zu schlafen. Schlaf ist ein natürlicher Instinkt. Er kommt zurück, wenn du ihm die Chance gibst. Möchtest du wissen, wie dein individueller, ECS-gestützter Ausschleichplan aussehen könnte?</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose KI-Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style="font-size: 1rem; font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Studien</h3>
      <ul style="font-size: 0.9rem; color: #6B7280;">
          <li><strong>Deutsche Hauptstelle für Suchtfragen (DHS):</strong> "Die Sucht und ihre Stoffe: Benzodiazepine".</li>
          <li><strong>Bundesärztekammer (2022):</strong> "Leitfaden Medikamentenabhängigkeit".</li>
          <li><strong>Stiftung Gesundheitswissen:</strong> "Schlafmittel-Abhängigkeit behandeln".</li>
          <li><strong>PMC (2023):</strong> "Cannabinoids: Emerging sleep modulator".</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient der Information und ersetzt keine ärztliche Behandlung. Setzen Sie Schlafmittel niemals eigenständig ab. Bei schweren Schlafstörungen konsultieren Sie einen Arzt.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: CBD Studien und Fakten
app.get('/magazin/cbd-studien-und-fakten', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CBD bei Medikamentenreduktion: Was die Wissenschaft wirklich sagt – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #D1FAE5;
      color: #065F46;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      font-size: 19px;
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      font-size: 1.1rem;
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    
    <span class="article-category">Wissenschaft & Fakten</span>
    
    <h1 class="article-title">CBD bei Medikamentenreduktion: Was die Wissenschaft wirklich sagt (Studien 2025)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 18. Januar 2025</span>
      <span><i class="far fa-clock"></i> 6 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>Überall hörst du: "CBD ist das neue Wundermittel". Doch was stimmt davon? Erfahre, wie CBD dir beim Absetzen von Medikamenten helfen kann – und wo die Risiken liegen.</strong>
      </p>
      
      <hr>
      
      <h2>Zwischen Hype und Realität</h2>
      <p>Die Schlagzeilen überschlagen sich: "Schmerzfrei ohne Chemie!", "Endlich besser schlafen!". Doch zwischen Marketing-Versprechen und echter Wissenschaft klafft oft eine Lücke.</p>
      <p>Die Wahrheit ist: <strong>CBD (Cannabidiol) ist kein Allheilmittel.</strong> Es ersetzt keinen Arzt und keine lebenswichtigen Medikamente. <strong>Aber:</strong> Hunderte Studien zeigen inzwischen, dass es eine extrem wertvolle Unterstützung sein kann, wenn man Medikamente reduzieren möchte.</p>
      
      <h2>Was ist CBD eigentlich? (Der 2-Minuten-Crashkurs)</h2>
      <p>CBD ist einer von über 100 Wirkstoffen aus der Hanfpflanze. Der wichtigste Unterschied zu THC (dem "Kiffer-Wirkstoff"): <strong>CBD macht nicht high.</strong></p>
      <ul>
          <li>Es ist nicht psychoaktiv.</li>
          <li>Es macht nicht abhängig.</li>
          <li>Die WHO (Weltgesundheitsorganisation) stuft es als sicher ein.</li>
      </ul>
      <p><strong>Wie es wirkt:</strong> Es dockt nicht direkt an deine Zellen an, sondern moduliert dein körpereigenes <strong>Endocannabinoid-System (ECS)</strong>. Es hilft dem Körper, sich selbst wieder ins Gleichgewicht zu bringen.</p>
      
      <h2>Das sagen die Studien: Wo CBD wirklich hilft</h2>
      
      <h3>1. Bei Schmerzen (Opioid-Ersparnis)</h3>
      <p>Das ist das stärkste Feld der Forschung. Studien zeigen, dass Patienten, die Cannabis-Medikamente nutzen, ihren Verbrauch an starken Schmerzmitteln (Opioiden) massiv senken können.</p>
      <p><em>Das Ergebnis: Weniger Schmerzmittel nötig = weniger Nebenwirkungen, weniger Abhängigkeit.</em> (Quelle: Deutsche Gesellschaft für Schmerzmedizin)</p>
      
      <h3>2. Bei Angst & Stress</h3>
      <p>CBD dämpft die Reaktion des Körpers auf Stresshormone. Der Vorteil: Im Gegensatz zu Beruhigungsmitteln (Benzodiazepinen) macht es nicht süchtig und führt nicht zu einer Toleranzentwicklung.</p>
      
      <h3>3. Bei Entzündungen</h3>
      <p>CBD wirkt entzündungshemmend, ähnlich wie Ibuprofen, aber über einen anderen Mechanismus. Das macht es interessant für Rheuma- oder Arthrose-Patienten, die ihren Magen schonen wollen.</p>
      
      <h2>Vorsicht: Der "Elefant im Raum" (Wechselwirkungen)</h2>
      <p>CBD ist natürlich, aber nicht harmlos. Es wird in der Leber über das gleiche Enzym-System abgebaut wie viele Medikamente (das <strong>Cytochrom P450</strong> System).</p>
      <p><strong>Das Problem:</strong> Wenn CBD diese Enzyme "beschäftigt", können andere Medikamente nicht richtig abgebaut werden. Ihr Spiegel im Blut steigt.</p>
      <p><strong>Besondere Vorsicht bei:</strong></p>
      <ul>
          <li>Blutverdünnern (Marcumar)</li>
          <li>Bestimmten Antidepressiva</li>
          <li>Herzmedikamenten (Betablockern)</li>
      </ul>
      <p><strong>Die MedLess-Regel:</strong> <em>Nimmst du Medikamente? Dann sprich VOR der CBD-Einnahme immer mit deinem Arzt!</em></p>
      
      <h2>Die Rechtslage: Ist das legal?</h2>
      <p>In Deutschland ist CBD <strong>legal</strong>, solange der THC-Gehalt unter 0,2% (bzw. 0,3%) liegt. Es ist als Öl oder Kapsel meist frei verkäuflich, höher dosierte Präparate sind apothekenpflichtig.</p>
      
      <div class="cta-box">
          <h3>Passt CBD zu deinen Medikamenten?</h3>
          <p>CBD kann ein starker Hebel sein, um von Chemie loszukommen – aber nur, wenn es sicher kombiniert wird. Möchtest du prüfen, ob CBD in deinen persönlichen Reduktionsplan passen könnte?</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose KI-Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style="font-size: 1rem; font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Studien</h3>
      <ul style="font-size: 0.9rem; color: #6B7280;">
          <li><strong>Deutsche Gesellschaft für Schmerzmedizin (2024):</strong> "Reduzierter Opioid-Verbrauch durch Cannabinoide".</li>
          <li><strong>Springer Medizin (2022):</strong> "Cannabinoide reduzieren Opioidverbrauch".</li>
          <li><strong>Ärzteblatt:</strong> "Interaktionspotenzial der Cannabinoide".</li>
          <li><strong>WHO:</strong> "Cannabidiol (CBD) Critical Review Report".</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel dient der Information und ersetzt keine ärztliche Beratung. CBD kann Wechselwirkungen mit Medikamenten haben. Sprechen Sie immer mit Ihrem Arzt.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Magenschutz (PPI) absetzen
app.get('/magazin/magenschutz-absetzen-ppi', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Die Säure-Falle: Warum "Magenschutz" oft das Gegenteil bewirkt – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #FED7AA;
      color: #9A3412;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content .intro {
      font-size: 19px;
      font-weight: 500;
      color: #1F2937;
      margin-bottom: 32px;
      padding: 20px;
      background: #F9FAFB;
      border-left: 4px solid #0F5A46;
      border-radius: 4px;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 48px;
      margin-bottom: 20px;
      line-height: 1.3;
    }
    
    .article-content h3 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #1F2937;
      margin-top: 32px;
      margin-bottom: 16px;
    }
    
    .article-content p {
      margin-bottom: 20px;
    }
    
    .article-content ul,
    .article-content ol {
      margin: 24px 0 24px 24px;
    }
    
    .article-content ul {
      list-style-type: disc;
    }
    
    .article-content ol {
      list-style-type: decimal;
    }
    
    .article-content li {
      margin-bottom: 12px;
      padding-left: 8px;
    }
    
    .article-content li strong {
      color: #1F2937;
    }
    
    .article-content strong {
      font-weight: 600;
      color: #0F5A46;
    }
    
    .article-content em {
      font-style: italic;
      color: #6B7280;
    }
    
    .article-content hr {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 48px 0;
    }
    
    .cta-box {
      background: linear-gradient(to right, #f0fdf4, #dcfce7);
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 5px solid #0F5A46;
    }
    
    .cta-box h3 {
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: #0F5A46;
    }
    
    .cta-box p {
      font-size: 1.1rem;
      margin-bottom: 24px;
      color: #374151;
    }
    
    .btn-primary {
      display: inline-block;
      background-color: #0F5A46;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
    }
    
    footer {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 48px 32px;
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .article-detail {
        padding: 48px 24px;
      }
      
      .header-container {
        flex-direction: column;
        gap: 20px;
        padding: 16px 20px;
      }
      
      .header-nav {
        gap: 16px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </a>
      </div>
      <nav class="header-nav">
        <a href="/#about">Über MEDLESS</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Detail -->
  <article class="article-detail">
    
    <span class="article-category">Magen & Verdauung</span>
    
    <h1 class="article-title">Die Säure-Falle: Warum "Magenschutz" oft das Gegenteil bewirkt (und wie du davon loskommst)</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> 20. Januar 2025</span>
      <span><i class="far fa-clock"></i> 6 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      
      <p class="intro">
        <strong>"Nehmen Sie das morgens dazu, um den Magen zu schützen." Ein Satz, den Millionen Deutsche hören. Doch was als kurzfristiger Schutz gedacht war, wird oft zur Dauerlösung mit Risiken. Erfahre, warum das Absetzen so schwer ist und wie es trotzdem klappt.</strong>
      </p>
      
      <hr>
      
      <h2>Der Klassiker: "Nur zur Sicherheit"</h2>
      <p>Es fängt meist harmlos an. Du bekommst ein Schmerzmittel (wie Ibuprofen) oder Antibiotika. Der Arzt verschreibt dazu Pantoprazol oder Omeprazol. "Ein Magenschutz", heißt es. Klingt vernünftig.</p>
      <p>Die Schmerzmittel setzt du nach zwei Wochen ab. Den Magenschutz nimmst du weiter. "Kann ja nicht schaden", denkst du. Monate vergehen. Jahre vergehen.</p>
      <p>Dann vergisst du die Tablette einmal im Urlaub. Und plötzlich ist es da: Ein Brennen, das bis in den Hals steigt. Sodbrennen, schlimmer als je zuvor. Du greifst sofort zur Tablette. Die Erleichterung folgt.</p>
      <p>Deine Schlussfolgerung: <em>"Puh, ich habe wohl wirklich zu viel Magensäure. Gut, dass ich die Tabletten nehme."</em></p>
      <p><strong>Doch das ist ein Trugschluss. Dein Magen ist nicht krank. Er ist abhängig.</strong></p>
      
      <h2>Der Rebound-Effekt: Warum dein Magen rebelliert</h2>
      <p>Diese Medikamente (Protonenpumpenhemmer, kurz PPI) blockieren die Säureproduktion extrem effektiv. Dein Körper ist aber schlau. Er merkt: "Huch, zu wenig Säure für die Verdauung!"</p>
      <p>Was macht er? Er baut <strong>mehr</strong> Säure-Pumpen, um gegen die Blockade anzukämpfen. Solange du die Tablette nimmst, merkst du davon nichts. Aber sobald du sie weglässt, arbeiten all diese neuen Pumpen auf Hochtouren. Es kommt zur "Säureflut".</p>
      <p>Das nennt man den <strong>Rebound-Effekt</strong>. Das Sodbrennen ist kein Zeichen deiner Krankheit, sondern ein Entzugssymptom.</p>
      
      <h2>Sind PPI wirklich harmlos?</h2>
      <p>Leider nein. Wenn wir die Magensäure dauerhaft unterdrücken, zahlen wir einen Preis:</p>
      <ul>
          <li><strong>Nährstoffmangel:</strong> Ohne Säure können Vitamin B12, Magnesium und Calcium schlechter aufgenommen werden.</li>
          <li><strong>Knochenbrüche:</strong> Durch den Calcium-Mangel steigt langfristig das Risiko für Osteoporose.</li>
          <li><strong>Infektionen:</strong> Magensäure ist unsere erste Barriere gegen Bakterien. Fehlt sie, haben Keime leichteres Spiel.</li>
      </ul>
      
      <h2>Der Ausweg: Ausschleichen statt Absetzen</h2>
      <p>Wer PPI von heute auf morgen weglässt, scheitert fast immer am Rebound. Der einzige Weg ist Geduld.</p>
      
      <h3>Die "Jeden-zweiten-Tag"-Methode</h3>
      <p>Ein bewährter Trick ist, die Dosis nicht sofort zu halbieren, sondern die Einnahme-Intervalle zu strecken.</p>
      <ol>
          <li><strong>Schritt 1:</strong> Nimm die Tablette nur noch <strong>jeden 2. Tag</strong> (für 2-4 Wochen).</li>
          <li><strong>Die Brücke:</strong> An den "Pausen-Tagen" kannst du bei Bedarf ein mildes Antazidum (z.B. Rennie, Talcid oder Heilerde) nehmen. Das neutralisiert die Säure, ohne die Pumpen zu beeinflussen.</li>
          <li><strong>Schritt 2:</strong> Reduziere auf jeden 3. Tag.</li>
          <li><strong>Schritt 3:</strong> Versuche es ganz ohne.</li>
      </ol>
      
      <h2>5 natürliche Alternativen bei akutem Brennen</h2>
      <p>Wenn es brennt, musst du nicht leiden. Diese Hausmittel helfen oft sofort:</p>
      <ul>
          <li><strong>Heilerde:</strong> Bindet überschüssige Säure wie ein Schwamm.</li>
          <li><strong>Mandeln:</strong> 5-6 Mandeln sehr lange kauen, bis ein Brei entsteht.</li>
          <li><strong>Kartoffelsaft:</strong> Wirkt stark basisch.</li>
          <li><strong>Kaugummi:</strong> Regt den Speichelfluss an, was die Säure in der Speiseröhre neutralisiert.</li>
      </ul>
      
      <h2>Wie dir MedLess und das ECS dabei helfen</h2>
      <p>Auch hier spielt dein <strong>Endocannabinoid-System (ECS)</strong> eine spannende Rolle. Es reguliert nämlich nicht nur Schmerz, sondern auch die Verdauung und Entzündungen im Magen-Darm-Trakt.</p>
      <p>Wenn du den chemischen "Hammer" (PPI) wegnimmst, kann eine gezielte Stärkung des ECS (z.B. durch Ernährung oder CBD) helfen, den Magen auf natürliche Weise zu beruhigen, ohne die Säureproduktion komplett lahmzulegen.</p>
      
      <div class="cta-box">
          <h3>Raus aus der Säure-Falle?</h3>
          <p>Du willst nicht den Rest deines Lebens Magentabletten schlucken? Wir berechnen dir einen Plan, wie du sicher und sanft davon loskommst – ohne dass das Feuer zurückkehrt.</p>
          <br>
          <a href="/#start-analysis" class="btn-primary">Jetzt kostenlose Analyse starten ➔</a>
      </div>
      
      <hr>
      
      <h3 style="font-size: 1rem; font-weight: 600; color: #6B7280; margin-bottom: 12px;">Quellen & Fakten</h3>
      <ul style="font-size: 0.9rem; color: #6B7280;">
          <li><strong>Deutsche Gesellschaft für Gastroenterologie:</strong> Leitlinie zu PPI.</li>
          <li><strong>Ärzteblatt:</strong> "Langzeitrisiken von Protonenpumpeninhibitoren".</li>
          <li><strong>Apotheken Umschau:</strong> "Magenschutz richtig absetzen".</li>
      </ul>
      <p style="font-size: 0.8rem; color: #999; margin-top: 20px;"><em>Haftungsausschluss: Dieser Artikel ersetzt keine ärztliche Beratung. Bei starken Magenschmerzen, Blut im Stuhl oder Vorerkrankungen (z.B. Barrett-Ösophagus) niemals ohne Arzt absetzen.</em></p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Magazine Article Route: Täglich 5 Tabletten
app.get('/magazin/taeglich-5-tabletten', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Täglich 5 Tabletten oder mehr? Warum das gefährlich ist. – MEDLESS</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #FFFFFF;
      color: #374151;
      line-height: 1.6;
    }
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
      text-decoration: none;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
    }
    
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: 80px 32px;
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: #D1FAE5;
      color: #0E5A45;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: #0F5A46;
      line-height: 1.2;
      margin-bottom: 32px;
    }
    
    .article-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #6B7280;
      padding-bottom: 32px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 48px;
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: #374151;
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0F5A46;
      margin-top: 56px;
      margin-bottom: 24px;
    }
    
    .article-content p {
      margin-bottom: 24px;
    }
    
    .article-content ul {
      margin: 24px 0;
      padding-left: 32px;
    }
    
    .article-content li {
      margin-bottom: 16px;
    }
    
    .article-content strong {
      color: #0F5A46;
      font-weight: 600;
    }
    
    .article-cta {
      margin: 64px 0;
      padding: 48px;
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      border: 2px solid #D1FAE5;
      border-radius: 16px;
      text-align: center;
    }
    
    .article-cta h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #0F5A46;
      margin-bottom: 24px;
    }
    
    .cta-button-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 32px;
      font-size: 17px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #0E5A45, #10B981);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(14, 90, 69, 0.2);
    }
    
    .cta-button-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 90, 69, 0.3);
    }
    
    footer {
      background: linear-gradient(135deg, #0E5A45, #10B981);
      padding: 60px 0 20px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 80px;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      text-align: center;
    }
    
    .footer-content p {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.85);
    }
    
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }
      
      .article-detail {
        padding: 60px 24px;
      }
      
      .article-content {
        font-size: 17px;
      }
      
      .article-cta {
        padding: 32px 24px;
      }
    }
  </style>
</head>
<body>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="header-logo">
        <span class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </span>
      </a>
      
      <nav class="header-nav">
        <a href="/#ueber-medless">Über MEDLESS</a>
        <a href="/#funktionsweise">Funktionsweise</a>
        <a href="/#faq">FAQ</a>
        <a href="/#magazin">Magazin</a>
        <a href="/#kontakt">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <!-- Article Content -->
  <article class="article-detail">
    <!-- Header Image -->
    <div style="width: 100%; max-width: 900px; margin: 0 auto 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <img src="/static/medications-elderly-hand.jpg" alt="Ältere Hand greift nach Tablette aus Schale mit vielen bunten Medikamenten" style="width: 100%; height: auto; display: block;" />
    </div>
    
    <span class="article-category">Polypharmazie</span>
    <h1 class="article-title">Täglich 5 Tabletten oder mehr? Warum das gefährlich ist.</h1>
    
    <div class="article-meta">
      <span><i class="far fa-calendar"></i> Januar 2025</span>
      <span><i class="far fa-clock"></i> 8 Min. Lesezeit</span>
    </div>
    
    <div class="article-content">
      <p>
        Ab fünf Medikamenten täglich sprechen Ärzte von <strong>Polypharmazie</strong> – ein Zustand, der längst nicht mehr nur ältere Menschen betrifft. Immer mehr Erwachsene schlucken mehrere Tabletten pro Tag, oft über Jahre hinweg, ohne die Risiken wirklich zu kennen.
      </p>
      
      <p>
        Doch was passiert, wenn sich Wirkstoffe im Körper gegenseitig beeinflussen? Und warum wird das Risiko so selten besprochen?
      </p>
      
      <h2>Was ist Polypharmazie?</h2>
      
      <p>
        Polypharmazie beschreibt die gleichzeitige Einnahme von fünf oder mehr verschreibungspflichtigen Medikamenten. Offiziell ist das keine Krankheit – aber ein erheblicher Risikofaktor.
      </p>
      
      <p>
        <strong>Das Problem:</strong> Jedes Medikament wird einzeln getestet und verschrieben. Doch wie sie zusammenwirken, wenn fünf, sechs oder sogar zehn Wirkstoffe gleichzeitig im Blutkreislauf sind, ist oft unklar.
      </p>
      
      <h2>Die Risiken: Wenn Medikamente miteinander kämpfen</h2>
      
      <p>
        Je mehr Medikamente, desto höher das Risiko für:
      </p>
      
      <ul>
        <li><strong>Wechselwirkungen:</strong> Ein Medikament verstärkt oder schwächt ein anderes. Das kann lebensbedrohlich werden (z. B. bei Blutverdünnern).</li>
        <li><strong>Unerwünschte Nebenwirkungen:</strong> Müdigkeit, Schwindel, Übelkeit, Verwirrtheit – oft werden diese Symptome als „Altersschwäche" abgetan, obwohl sie direkt mit Medikamenten zusammenhängen.</li>
        <li><strong>Kaskadeneffekte:</strong> Ein Medikament verursacht ein Problem, das mit einem weiteren Medikament behandelt wird – und so weiter. Die Medikamentenliste wächst, der Körper leidet.</li>
        <li><strong>Erhöhtes Sturzrisiko:</strong> Besonders bei älteren Menschen steigt durch Schwindel und Benommenheit das Risiko für schwere Stürze.</li>
        <li><strong>Kognitive Beeinträchtigungen:</strong> Manche Wirkstoffkombinationen können das Denkvermögen, die Konzentration und das Gedächtnis beeinträchtigen.</li>
      </ul>
      
      <h2>Warum passiert das so oft?</h2>
      
      <p>
        In vielen Fällen ist Polypharmazie keine bewusste Entscheidung, sondern das Ergebnis von:
      </p>
      
      <ul>
        <li><strong>Symptombehandlung statt Ursachenanalyse:</strong> Ein neues Symptom wird mit einem neuen Medikament behandelt – ohne zu hinterfragen, ob es von einem bereits eingenommenen Medikament kommt.</li>
        <li><strong>Mehrfachbehandlung:</strong> Verschiedene Ärzte verschreiben Medikamente, ohne über die gesamte Medikamentenliste Bescheid zu wissen.</li>
        <li><strong>Zeitmangel in der Praxis:</strong> Ärzte haben oft nicht genug Zeit, um die gesamte Medikation eines Patienten zu überprüfen.</li>
        <li><strong>Angst vor dem Absetzen:</strong> Viele Patienten trauen sich nicht, ein Medikament zu hinterfragen oder abzusetzen – aus Angst vor Rückfällen oder Entzugssymptomen.</li>
      </ul>
      
      <h2>Was kannst du tun?</h2>
      
      <p>
        Wenn du täglich fünf oder mehr Medikamente einnimmst, solltest du aktiv werden:
      </p>
      
      <ul>
        <li><strong>Medikamentenliste aktualisieren:</strong> Erstelle eine vollständige Liste aller Medikamente (inklusive rezeptfreier Präparate und Nahrungsergänzungsmittel) und besprich sie mit deinem Arzt.</li>
        <li><strong>Regelmäßige Überprüfungen:</strong> Frag deinen Arzt, ob alle Medikamente noch notwendig sind. Oft können Dosierungen angepasst oder Medikamente abgesetzt werden.</li>
        <li><strong>Zweitmeinung einholen:</strong> Ein Gespräch mit einem Apotheker oder einem anderen Arzt kann helfen, Wechselwirkungen zu erkennen.</li>
        <li><strong>Natürliche Unterstützung prüfen:</strong> Moderne Ansätze wie die Stärkung des Endocannabinoid-Systems können dabei helfen, den Medikamentenbedarf zu reduzieren – immer in Absprache mit einem Arzt.</li>
      </ul>
      
      <!-- CTA Section -->
      <div class="article-cta">
        <h3>Möchtest du deine Medikamente prüfen?</h3>
        <p style="margin-bottom: 24px; font-size: 17px; color: #374151;">
          MEDLESS hilft dir, einen individuellen Ausschleichplan zu erstellen – KI-berechnet, wissenschaftlich fundiert und für die ärztliche Begleitung entwickelt.
        </p>
        <a href="/#planner-section" class="cta-button-primary">
          Kostenlos Analyse starten
          <i class="fas fa-arrow-right"></i>
        </a>
      </div>
      
      <h2>Fazit</h2>
      
      <p>
        Polypharmazie ist ein stilles, aber wachsendes Problem. Viele Menschen nehmen täglich mehrere Medikamente, ohne sich der Risiken bewusst zu sein. Doch es gibt Möglichkeiten, die Medikamentenlast sicher zu reduzieren – mit ärztlicher Begleitung, einem individuellen Plan und moderner Unterstützung durch das Endocannabinoid-System.
      </p>
      
      <p>
        <strong>Der erste Schritt:</strong> Bewusstsein schaffen. Der zweite: Handeln.
      </p>
    </div>
  </article>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <p><strong>MEDLESS</strong> – Dein Weg zu weniger Medikamenten</p>
      <p style="margin-top: 16px; font-size: 13px;">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    </div>
  </footer>
  
</body>
</html>
  `)
})

// Main Route: Homepage
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MEDLESS – Dein Weg zu weniger Medikamenten</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  
  <!-- jsPDF for PDF Generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <!-- Axios for API calls -->
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  
  <!-- html2canvas for PDF generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

  <style>
    /* ============================================================
       DESIGN SYSTEM - MEDLESS (Refactored for Medical/Professional Look)
       ============================================================ */
    
    :root {
      /* SPACING SYSTEM (8px grid) */
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 24px;
      --space-6: 32px;
      --space-7: 48px;
      --space-8: 64px;
      --space-9: 96px;
      
      /* BRAND COLORS - HEALTH TECH REDESIGN */
      --forest-green: #0E5A45;          /* Tiefes Waldgrün (Hauptfarbe) */
      --forest-green-dark: #0B4536;     /* Dunkleres Waldgrün (Hover) */
      --mint-fresh: #10B981;            /* Frisches Mint (Akzent) */
      --mint-light: #D1FAE5;            /* Helles Mint (Hintergründe) */
      --mint-ultra-light: #ECFDF5;      /* Ultra-helles Mint */
      
      /* Legacy support */
      --primary-dark-green: #0E5A45;
      --primary-green: #10B981;
      --accent-mint: #D1FAE5;
      --accent-mint-light: #ECFDF5;
      
      /* NEUTRAL GRAYS (Tailwind-like) */
      --gray-50: #F9FAFB;
      --gray-100: #F3F4F6;
      --gray-200: #E5E7EB;
      --gray-300: #D1D5DB;
      --gray-400: #9CA3AF;
      --gray-500: #6B7280;
      --gray-600: #4B5563;
      --gray-700: #374151;
      --gray-800: #1F2937;
      --gray-900: #111827;
      
      /* SEMANTIC COLORS */
      --background-white: #FFFFFF;
      --background-ultra-light: var(--gray-50);
      --text-primary: var(--gray-900);
      --text-secondary: var(--gray-600);
      --text-muted: var(--gray-500);
      --border-light: var(--gray-200);
      
      /* BRAND VARIATIONS */
      --brand-500: var(--primary-green);
      --brand-600: var(--primary-dark-green);
      
      /* Border Radius */
      --radius-small: 6px;
      --radius-medium: 12px;
      --radius-large: 16px;
      --radius-xl: 24px;
      --radius-full: 9999px;
      
      /* Shadows (subtle/medical) */
      --shadow-soft: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-medium: 0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.06);
      --shadow-large: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 30px -2px rgba(0, 0, 0, 0.08);
      
      /* Typography - Medical Professional */
      --font-family: 'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      
      /* Typography Scale (Clinical) */
      --font-size-body: 16px;
      --line-height-body: 1.6;
      --text-body-color: #374151;
      --text-secondary-color: #4B5563;
      
      /* Spacing - Medical Clean */
      --spacing-paragraph: 20px;
      --spacing-block: 64px;
      --spacing-block-small: 48px;
      
      /* Max Width for Readability */
      --max-width-text: 65ch;
      --max-width-card-text: 45ch;
      
      /* LAYOUT OPTIMIZATION - Ultra Compact Spacing */
      --section-padding-y: 40px;
      --heading-margin-bottom: 12px;
      --paragraph-spacing: 10px;
      --line-height-comfortable: 1.6;
      
      /* TYPOGRAPHY OPTIMIZATION - FINAL */
      --heading-color: #1A1A1A;
      --text-dark: #333333;
      --text-medium: #555555;
      --body-text-size: 17px;
      --body-text-color: #555555;
      --max-text-width: 730px;
      --list-item-spacing: 12px;
      
      /* UI OPTIMIZATION - FINAL TUNING */
      --icon-color-primary: #0E5F45;
      --icon-size: 34px;
      --icon-stroke-width: 2px;
      --card-padding: 36px;
      --card-border-radius: 5px;
      --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 14px rgba(0, 0, 0, 0.05);
      --card-shadow-hover: 0 3px 12px rgba(0, 0, 0, 0.06), 0 6px 18px rgba(0, 0, 0, 0.06);
      --warning-border-color: #3B82F6;  /* Sanftes Blau statt Rot */
      --button-padding-y: 16px;
      --button-padding-x: 32px;
      --button-hover-bg: #0B4536;
      --button-border-radius: 12px;      /* Abgerundete Ecken */
      --button-shadow: 0 4px 6px -1px rgba(14, 90, 69, 0.15), 0 2px 4px -1px rgba(14, 90, 69, 0.08);
      --button-shadow: 0 3px 10px rgba(14, 95, 69, 0.12), 0 6px 20px rgba(14, 95, 69, 0.08);
      --faq-border-color: #E4E4E4;
      --faq-border-radius: 4px;
      --section-gap: 40px;
    }
    
    /* ============================================================
       GLOBAL LAYOUT IMPROVEMENTS
       ============================================================ */
    
    /* Consistent Line Heights for Better Readability */
    p, li, .faq-answer-content {
      line-height: var(--line-height-comfortable);
    }
    
    /* Consistent Paragraph Spacing */
    p + p {
      margin-top: var(--paragraph-spacing);
    }
    
    /* Consistent Heading Bottom Margins */
    h1, h2, h3, h4 {
      margin-bottom: var(--heading-margin-bottom);
    }
    
    /* ============================================================
       TYPOGRAPHY HIERARCHY & READABILITY
       ============================================================ */
    
    /* H1 - Only in Hero */
    h1, .hero-headline {
      font-size: clamp(2.5rem, 1.5rem + 3vw, 3.5rem);
      font-weight: 700;
      line-height: 1.15;
      color: var(--heading-color);
      letter-spacing: -0.02em;
    }
    
    /* H2 - Main Section Headlines - FINAL */
    h2, .section-headline {
      font-size: clamp(1.875rem, 1.3rem + 1.6vw, 2.125rem);
      font-weight: 700;
      line-height: 1.25;
      color: var(--heading-color);
      letter-spacing: -0.01em;
      margin-bottom: 28px;
    }
    
    /* H3 - Card/Sub-Section Headlines - FINAL */
    h3 {
      font-size: clamp(1.25rem, 1rem + 0.5vw, 1.375rem);
      font-weight: 600;
      line-height: 1.35;
      color: var(--text-dark);
      margin-bottom: 14px;
    }
    
    /* H4 - Small Card Headlines - FINAL */
    h4 {
      font-size: clamp(1.125rem, 0.95rem + 0.3vw, 1.25rem);
      font-weight: 600;
      line-height: 1.4;
      color: var(--text-dark);
      margin-bottom: 12px;
    }
    
    /* Body Text - Improved Readability - FINAL */
    p, li, .section-description {
      font-size: var(--body-text-size);
      color: var(--text-medium);
      line-height: var(--line-height-comfortable);
    }
    
    /* Strong Text */
    strong, b {
      font-weight: 600;
      color: var(--text-dark);
    }
    
    /* Content Max-Width for Readability */
    .section-description,
    .explanation-card p,
    .faq-answer-content p,
    .warning-content p {
      max-width: var(--max-text-width);
      margin-left: auto;
      margin-right: auto;
    }
    
    /* List Spacing */
    ul li + li,
    ol li + li {
      margin-top: var(--list-item-spacing);
    }
    
    .hero-features li + li,
    .medical-list li + li,
    .warning-list li + li {
      margin-top: var(--list-item-spacing);
    }
    
    /* FAQ Typography */
    .faq-question-text {
      font-size: 18px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--heading-color);
    }
    
    .faq-answer-content {
      font-size: 17px;
      line-height: var(--line-height-comfortable);
      color: var(--body-text-color);
    }
    
    /* ============================================================
       SCROLL ANIMATIONS - MEDIZINISCH-SERIÖS & DEZENT
       ============================================================ */
    
    /* Animation Base State - Hidden before scroll */
    .scroll-animate {
      opacity: 0;
      transform: translateY(18px);
      transition: opacity 400ms ease-out, transform 400ms ease-out;
    }
    
    /* Animation Active State - Visible after scroll-in */
    .scroll-animate.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Card Groups - Staggered Animation */
    .scroll-animate-card {
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 380ms ease-out, transform 380ms ease-out;
    }
    
    .scroll-animate-card.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Stagger Delays for Card Groups */
    .scroll-animate-card:nth-child(1) { transition-delay: 0ms; }
    .scroll-animate-card:nth-child(2) { transition-delay: 80ms; }
    .scroll-animate-card:nth-child(3) { transition-delay: 160ms; }
    .scroll-animate-card:nth-child(4) { transition-delay: 240ms; }
    .scroll-animate-card:nth-child(5) { transition-delay: 320ms; }
    .scroll-animate-card:nth-child(6) { transition-delay: 400ms; }
    
    /* Reduced Motion Support - Accessibility */
    @media (prefers-reduced-motion: reduce) {
      .scroll-animate,
      .scroll-animate-card {
        opacity: 1;
        transform: none;
        transition: none;
      }
    }
    
    /* Mobile: Weaker Animation Movement */
    @media (max-width: 768px) {
      .scroll-animate {
        transform: translateY(12px);
      }
      .scroll-animate-card {
        transform: translateY(10px);
      }
    }
    
    /* ============================================================
       HOVER INTERACTIONS - OPTIMIERT & DEZENT
       ============================================================ */
    
    /* 1) BUTTONS - Leichte Farbdunklung + Minimaler Scale */
    .cta-button-primary:hover,
    button.cta-button-primary:hover {
      background: linear-gradient(135deg, #0B4C36, #0E5F45) !important;
      transform: scale(1.01) !important;
      transition: all 200ms ease-out !important;
      box-shadow: 0 4px 12px rgba(14, 95, 69, 0.14), 0 6px 20px rgba(14, 95, 69, 0.09) !important;
    }
    
    .cta-button-primary:active,
    button.cta-button-primary:active {
      transform: scale(0.98) !important;
      transition: all 100ms ease-out !important;
    }
    
    /* Button Arrow Icon - Subtle Movement */
    .cta-button-primary:hover .arrow-icon {
      transform: translateX(3px);
      transition: transform 200ms ease-out;
    }
    
    /* 2) CARDS - Leichter Shadow + Minimaler Lift */
    .explanation-card:hover,
    .process-card:hover,
    .step:hover,
    .ecs-card:hover,
    .cyp-card:hover {
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08), 0 6px 16px rgba(0, 0, 0, 0.06) !important;
      transform: translateY(-2px) !important;
      transition: all 200ms ease-out !important;
    }
    
    /* 3) FAQ ACCORDION - Nur Titelzeile leicht abdunkeln */
    .faq-item:hover {
      border-color: var(--faq-border-color) !important;
      box-shadow: var(--card-shadow) !important;
    }
    
    .faq-question:hover {
      background: #F7F7F7 !important;
      transition: background 180ms ease-out !important;
    }
    
    /* 4) FOOTER LINKS - Unterstreichungsanimation */
    .footer-links a {
      position: relative;
      transition: color 200ms ease-out;
    }
    
    .footer-links a::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.9);
      transition: width 200ms ease-out;
    }
    
    .footer-links a:hover {
      color: rgba(255, 255, 255, 0.95) !important;
    }
    
    .footer-links a:hover::after {
      width: 100%;
    }
    
    /* Footer Social Icons - Subtle Lift */
    .footer-social a:hover {
      background: rgba(255, 255, 255, 0.15) !important;
      transform: translateY(-2px) !important;
      transition: all 180ms ease-out !important;
    }
    
    /* 5) ICONS - Kleine Farbverstärkung */
    .card-icon i:hover,
    .card-icon-circle i:hover,
    .hero-features i:hover,
    .medical-list i:hover {
      color: #0B4C36 !important;
      transition: color 180ms ease-out !important;
    }
    
    /* Scroll-to-Top Button */
    .scroll-to-top:hover {
      transform: translateY(-3px) scale(1.02) !important;
      box-shadow: 0 6px 18px rgba(12, 92, 76, 0.35) !important;
      transition: all 200ms ease-out !important;
    }
    
    /* Header Navigation Links */
    .header-nav a:hover {
      color: var(--primary-green) !important;
      transition: color 180ms ease-out !important;
    }
    
    /* Header CTA Button */
    .header-cta:hover {
      background: linear-gradient(135deg, #0B4C36, #0E5F45) !important;
      transform: scale(1.01) !important;
      transition: all 200ms ease-out !important;
    }
    
    /* ============================================================
       LOADING ANIMATION - OPTIMIERT & MEDIZINISCH-SERIÖS
       ============================================================ */
    
    /* Loading Overlay Styles - Modernized */
    #loading {
      position: relative;
      padding: 0;
      margin: 2rem 0;
    }
    
    /* ============================================================
       LOADING CARD - Professional Health-Tech Dashboard
       ============================================================ */
    
    #loading .loading-card {
      max-width: 640px;
      margin: 0 auto;
      padding: 3.5rem 2.5rem;
      
      /* Subtle mint/green gradient background */
      background: linear-gradient(135deg, 
        rgba(240, 253, 250, 0.95) 0%, 
        rgba(255, 255, 255, 0.95) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      
      /* Professional card shadow */
      border-radius: 20px;
      border: 1px solid rgba(14, 95, 69, 0.08);
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.02),
        0 10px 30px rgba(14, 95, 69, 0.08),
        0 20px 50px rgba(14, 95, 69, 0.05);
      
      text-align: center;
      animation: fadeInUp 400ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Progress Ring Container */
    .loader-circle {
      width: 160px;
      height: 160px;
      margin: 0 auto 2.5rem;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Progress Ring - Subtle Pulse Effect */
    .loader-circle svg {
      filter: drop-shadow(0 2px 8px rgba(14, 95, 69, 0.15));
      animation: ringPulse 3s ease-in-out infinite;
    }
    
    /* Center Icon - Breathing Animation */
    #center-icon {
      animation: iconBreath 3s ease-in-out infinite;
    }
    
    /* Loading Titles */
    .loading-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0E5F45;
      margin-bottom: 0.875rem;
      letter-spacing: -0.02em;
      animation: fadeIn 500ms ease-out 200ms both;
    }
    
    .loading-subtitle {
      font-size: 1.05rem;
      color: #6B7280;
      margin-bottom: 2rem;
      font-weight: 500;
      animation: fadeIn 500ms ease-out 400ms both;
    }
    
    /* Status Text */
    #analysis-status {
      color: #0E5F45;
      font-weight: 600;
    }
    
    #status-dots {
      display: inline-block;
      width: 1.5em;
      text-align: left;
    }
    
    #status-dots::after {
      content: '...';
      animation: dotsAnimation 1500ms steps(4, end) infinite;
    }
    
    /* Progress Circle - Smooth Transition */
    #progress-circle {
      transition: stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
      filter: url(#glow);
    }
    
    /* Center Percentage - Perfect Centering & Smooth Growth */
    #center-percentage {
      transition: font-size 300ms ease-in-out;
      /* Ensure perfect vertical alignment */
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Prevent clipping at 100% */
      font-size: 1.75rem;
    }
    
    /* KPI Cards - Professional Hover Effect */
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(14, 95, 69, 0.12) !important;
      border-color: rgba(14, 95, 69, 0.2) !important;
    }
    
    /* Mobile Optimization - Responsive & Performant */
    @media (max-width: 768px) {
      #loading .loading-card {
        padding: 2.5rem 1.5rem;
        border-radius: 16px;
      }
      
      .loader-circle {
        width: 140px;
        height: 140px;
        margin-bottom: 2rem;
      }
      
      .loader-circle svg {
        width: 110px;
        height: 110px;
      }
      
      #center-icon {
        font-size: 1.5rem !important;
      }
      
      #center-percentage {
        font-size: 1.4rem !important;
      }
      
      .loading-title {
        font-size: 1.25rem;
      }
      
      .loading-subtitle {
        font-size: 0.95rem;
      }
      
      #live-stats {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
      }
      
      .kpi-card {
        padding: 1.25rem 1rem !important;
      }
      
      .kpi-card div[id^="counter-"] {
        font-size: 2rem !important;
      }
    }
    
    /* Extra Small Screens */
    @media (max-width: 480px) {
      #loading .loading-card {
        padding: 2rem 1.25rem;
      }
      
      .loading-title {
        font-size: 1.125rem;
      }
    }
    
    /* ============================================================
       KEYFRAME ANIMATIONS - Professional & Performant
       ============================================================ */
    
    /* Ring Pulse - Subtle breathing effect */
    @keyframes ringPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.02);
        opacity: 0.95;
      }
    }
    
    /* Icon Breath - Gentle scale animation */
    @keyframes iconBreath {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.08);
      }
    }
    
    /* KPI Card Entry - Staggered fade-in */
    @keyframes kpiCardEntry {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Fade In */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes dotsAnimation {
      0%, 20% {
        content: '';
      }
      40% {
        content: '.';
      }
      60% {
        content: '..';
      }
      80%, 100% {
        content: '...';
      }
    }
    
    @keyframes fadeInError {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes checkmarkPop {
      0% {
        opacity: 0;
        transform: scale(0);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    /* ============================================================
       PLAN READY HERO - RESPONSIVE SPACING
       ============================================================ */
    
    /* Desktop: Genug Platz für Header (72px) + Extra-Puffer */
    .plan-ready-hero {
      padding-top: 140px !important; /* 72px Header + 68px Puffer = 140px */
    }
    
    /* Tablet: Reduzierter Abstand */
    @media (max-width: 1024px) {
      .plan-ready-hero {
        padding-top: 120px !important; /* 72px Header + 48px Puffer = 120px */
      }
    }
    
    /* Mobile: Kein Header (hidden), aber trotzdem Abstand oben */
    @media (max-width: 768px) {
      .plan-ready-hero {
        padding-top: 80px !important; /* Kein Header, aber sauberer Top-Abstand */
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
    }
    
    /* Extra Small Mobile: Noch kompakter */
    @media (max-width: 480px) {
      .plan-ready-hero {
        padding-top: 60px !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
    }
    
    /* ============================================================
       UI COMPONENT OPTIMIZATION - HARMONIZED
       ============================================================ */
    
    /* Icon Styling - Perfect Consistency */
    .card-icon i,
    .card-icon-circle i,
    .process-card .card-icon-circle i,
    .hero-features i,
    .medical-list i,
    .warning-list i,
    .checkmark-icon,
    .faq-icon i,
    i.fas,
    i.far,
    i.fab {
      color: var(--icon-color-primary) !important;
      font-size: var(--icon-size);
      line-height: 1;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* FontAwesome Solid Icons need font-weight 900 */
    i.fas {
      font-weight: 900;
    }
    
    /* FontAwesome Regular Icons need font-weight 400 */
    i.far {
      font-weight: 400;
    }
    
    /* FontAwesome Brands Icons need font-weight 400 */
    i.fab {
      font-weight: 400;
    }
    
    /* Hero Features Icons */
    .hero-features i {
      font-size: var(--icon-size);
      min-width: var(--icon-size);
      color: var(--icon-color-primary) !important;
    }
    
    /* Medical List Icons */
    .medical-list i,
    .warning-list i {
      font-size: 28px;
      min-width: 28px;
      color: var(--icon-color-primary) !important;
    }
    
    /* FAQ Icons */
    .faq-icon i {
      font-size: 20px;
      color: var(--icon-color-primary) !important;
      transition: transform 0.3s ease;
    }
    
    .faq-item.active .faq-icon i {
      transform: rotate(180deg);
    }
    
    /* Card Styling - Perfect Shadows & Padding */
    .explanation-card,
    .process-card,
    .faq-item,
    .step,
    .ecs-card,
    .cyp-card {
      background: white;
      border: 1px solid var(--border-light);
      border-radius: var(--card-border-radius);
      padding: var(--card-padding);
      box-shadow: var(--card-shadow);
      transition: all 0.25s ease;
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section above */
    
    /* Process Cards Grid - Equal Heights */
    .process-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-6);
      align-items: stretch;
    }
    
    .process-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      height: 100%;
    }
    
    /* Warning Box - Subtle Professional Design */
    .warning-box {
      background: white;
      border: 2px solid var(--warning-border-color);
      border-radius: var(--card-border-radius);
      padding: 28px;
      box-shadow: var(--card-shadow);
    }
    
    .warning-icon-circle {
      width: 56px;
      height: 56px;
      background: rgba(217, 83, 79, 0.08);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
    }
    
    .warning-icon-circle i {
      color: var(--warning-border-color) !important;
      font-size: 28px;
    }
    
    .warning-title {
      color: var(--heading-color);
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }
    
    /* CTA Buttons - FINAL PROMINENT STYLE */
    .cta-button-primary,
    button.cta-button-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: var(--button-padding-y) var(--button-padding-x);
      font-size: 17px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      border: none;
      border-radius: var(--button-border-radius);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.25s ease;
      box-shadow: var(--button-shadow);
      white-space: nowrap;
    }
    
    /* Arrow Icon in Buttons */
    .cta-button-primary .arrow-icon {
      font-size: 16px;
      transition: transform 0.2s ease;
    }
    
    /* Footer Optimization - Airy & Professional */
    footer {
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      padding: 60px 0 20px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 60px;
      margin-bottom: 50px;
    }
    
    .footer-branding h3,
    .footer-section h4 {
      color: white;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      letter-spacing: 0.02em;
    }
    
    .footer-branding .tagline,
    .footer-branding p {
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.7;
      margin-top: 14px;
    }
    
    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .footer-links li {
      margin-bottom: 14px;
    }
    
    .footer-links a {
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      font-size: 16px;
      transition: color 0.2s ease;
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section above */
    
    .footer-social a {
      color: rgba(255, 255, 255, 0.85);
      font-size: 22px;
      transition: color 0.2s ease;
    }
    
    /* Section Dividers - Clean & Centered */
    .section-divider {
      width: 30%;
      height: 1px;
      background: #E6E6E6;
      margin: 0 auto;
      border: none;
      opacity: 1;
    }
    
    /* Image & Visual Element Harmonization */
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    .hero-logo-mobile {
      margin-left: auto;
      margin-right: auto;
      padding: 0 var(--space-4);
    }
    
    /* Steps Container - Equal Height Alignment */
    .steps-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      max-width: 800px;
      margin: 0 auto;
    }
    
    .step {
      display: flex;
      align-items: flex-start;
      gap: var(--space-5);
      position: relative;
    }
    
    .step-number-circle {
      width: 48px;
      height: 48px;
      min-width: 48px;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white !important;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(14, 95, 69, 0.2);
      z-index: 1;
    }
    
    .step-connector {
      position: absolute;
      left: 24px;
      top: 48px;
      width: 2px;
      height: calc(100% + var(--space-6));
      background: linear-gradient(180deg, var(--primary-green), var(--accent-mint));
      opacity: 0.3;
    }
    
    .step:last-child .step-connector {
      display: none;
    }
    
    .step-content {
      flex: 1;
      padding-top: 4px;
    }
    
    .step-content h4 {
      color: var(--heading-color);
      margin-bottom: 12px;
    }
    
    .step-content p {
      color: var(--body-text-color);
      line-height: var(--line-height-comfortable);
    }
    
    /* Card Icon Containers - Consistent Size */
    .card-icon,
    .card-icon-circle {
      flex-shrink: 0;
    }
    
    /* ============================================================
       FINAL VISUAL TUNING
       ============================================================ */
    
    /* Text Color Consistency */
    h1, h2, h3, h4 {
      color: var(--heading-color);
    }
    
    p, li {
      color: var(--body-text-color);
    }
    
    strong {
      color: var(--text-dark);
      font-weight: 600;
    }
    
    /* Section Hierarchy - Clear Separation */
    section {
      padding: var(--section-gap) 0;
    }
    
    /* Scroll offset for anchor links (compensate for sticky header) */
    section[id] {
      scroll-margin-top: 88px; /* Header height (68px) + spacing (20px) */
    }
    
    .section-headline {
      font-size: clamp(1.875rem, 1.3rem + 1.6vw, 2.125rem);
      font-weight: 700;
      color: var(--heading-color);
      margin-bottom: 28px;
    }
    
    /* FAQ Accordion - Optimized Animation */
    .faq-item {
      border: 1px solid var(--faq-border-color);
      border-radius: var(--faq-border-radius);
      padding: 0;
      margin-bottom: 14px;
      background: white;
      box-shadow: var(--card-shadow);
    }
    
    .faq-question {
      padding: 18px 20px;
      background: #F9F9F9;
      border-radius: var(--faq-border-radius);
      transition: background 280ms ease-in-out;
    }
    
    .faq-item.active .faq-question {
      background: #F9F9F9;
    }
    
    .faq-answer {
      padding: 0 20px 20px;
      background: white;
    }
    
    .faq-item.active {
      border-color: var(--icon-color-primary);
      box-shadow: 0 2px 8px rgba(14, 95, 69, 0.08), 0 4px 16px rgba(14, 95, 69, 0.06);
    }
    
    /* CTA Buttons - Strong Emphasis */
    .cta-button-primary,
    button.cta-button-primary {
      border-radius: var(--button-border-radius);
      font-weight: 700;
      box-shadow: var(--button-shadow);
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section */
    
    /* Science Cards - Equal Heights */
    .explanation-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 320px;
    }
    
    .explanation-card h3 {
      margin-top: 0;
      margin-bottom: 18px;
      min-height: 60px;
      display: flex;
      align-items: center;
    }
    
    .explanation-card .card-icon {
      margin-bottom: 20px;
    }
    
    /* Warning Box - Very Calm */
    .warning-box {
      background: white;
      border: 1.5px solid var(--warning-border-color);
      padding: 32px;
      box-shadow: 0 1px 4px rgba(217, 83, 79, 0.04), 0 2px 8px rgba(217, 83, 79, 0.03);
    }
    
    .warning-icon-circle {
      background: rgba(217, 83, 79, 0.06);
    }
    
    /* Footer - Harmonious Alignment */
    .footer-content {
      grid-template-columns: 1.1fr 1fr 1fr;
      gap: 70px;
      align-items: start;
    }
    
    .footer-section h4,
    .footer-branding h3 {
      font-size: 19px;
    }
    
    .footer-links a {
      font-size: 16px;
    }
    
    .footer-social {
      display: flex;
      gap: 18px;
      align-items: center;
    }
    
    .footer-social a {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.2s ease;
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section above */
    
    .footer-social a i {
      font-size: 20px;
      color: white;
    }
    
    /* Section Dividers - More Visible */
    .section-divider {
      width: 28%;
      height: 1px;
      background: #DADADA;
      opacity: 1;
    }
    
    /* Section Dividers - Subtle Horizontal Lines */
    .section-divider {
      width: 30%;
      height: 1px;
      background: #E6E6E6;
      margin: 0 auto;
      border: none;
    }
    
    /* Consistent Section Padding - Final */
    section {
      padding: var(--section-gap) 0;
    }
    
    section + section {
      margin-top: 0;
    }
    
    /* Card and Text Block Spacing */
    .explanation-card p,
    .process-card p,
    .faq-answer-content p {
      line-height: var(--line-height-comfortable);
    }
    
    .explanation-card p + p,
    .process-card p + p,
    .faq-answer-content p + p {
      margin-top: var(--paragraph-spacing);
    }
    
    /* Card Horizontal Padding */
    .explanation-card,
    .process-card,
    .step-content {
      padding-left: var(--space-5);
      padding-right: var(--space-5);
    }
    
    /* ============================================================
       GLOBAL STYLES
       ============================================================ */
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: rgba(15, 122, 103, 0.1);
    }
    
    html {
      scroll-behavior: smooth;
    }
    
    body {
      font-family: var(--font-family);
      font-size: var(--font-size-body);
      color: var(--text-body-color);
      background: var(--background-white);
      line-height: var(--line-height-body);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    /* ============================================================
       HEADER & NAVIGATION (NEW)
       ============================================================ */
    
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-logo {
      display: flex;
      align-items: center;
    }
    
    .logo-text {
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1;
    }
    
    .logo-med {
      color: #0F5A46;
    }
    
    .logo-less {
      color: #1DB98D;
    }
    
    .logo-dot {
      color: #1DB98D;
    }
    
    .header-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    
    .header-nav a {
      font-size: 16px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: all 0.2s ease;
      padding-bottom: 2px;
      border-bottom: 2px solid transparent;
    }
    
    .header-nav a:hover {
      color: #0E5A45;
      border-bottom-color: #0E5A45;
    }
    
    .header-nav a.active {
      color: #0E5A45;
      border-bottom-color: #0E5A45;
    }
    
    /* Right-aligned contact link */
    .header-nav-contact {
      margin-left: auto;
      color: #6B7280 !important;
      font-weight: 500 !important;
    }
    
    .header-nav-contact:hover {
      color: #0E5A45 !important;
      border-bottom-color: transparent !important;
    }
    
    /* Hero Mobile Logo (inside hero, only visible on mobile) */
    .hero-logo-mobile {
      display: none;
    }
    
    /* Mobile Header - HIDE */
    @media (max-width: 768px) {
      .site-header {
        display: none;
      }
      
      /* Show mobile logo in hero - centered on screen */
      .hero-logo-mobile {
        display: block;
        width: 100%;
        max-width: 530px;
        height: auto;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: var(--space-4);
        padding: 0 var(--space-2);
        box-sizing: border-box;
      }
    }
    
    /* ============================================================
       HERO SECTION
       ============================================================ */
    
    .hero {
      background: linear-gradient(135deg, #FFFFFF 0%, #F4FBF8 100%);
      padding: 35px 0 40px;
      overflow: hidden;
    }
    
    .hero-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: center;
    }
    
    @media (max-width: 768px) {
      .hero-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }
    
    .hero-logo-small {
      width: 160px;
      height: auto;
      margin-bottom: var(--space-4);
      opacity: 0.9;
    }
    
    .hero-headline {
      font-size: clamp(44px, 3vw, 52px);
      font-weight: 700;
      color: #1A1A1A;
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
      max-width: 14ch;
    }
    
    .hero-subheadline {
      font-size: 18px;
      font-weight: 400;
      color: #374151;
      line-height: 1.55;
      margin-bottom: 18px;
      max-width: 560px;
    }
    
    .hero-description {
      font-size: 16px;
      color: var(--text-body-color);
      line-height: 1.6;
      margin-bottom: var(--spacing-paragraph);
      max-width: var(--max-width-text);
    }
    
    .hero-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 26px;
    }
    
    .hero-features li {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 0;
      text-align: left;
    }
    
    .hero-features li i {
      flex-shrink: 0;
      min-width: 24px;
      width: 24px;
      height: 24px;
      margin-top: 0;
    }
    
    .hero-features li span {
      font-size: 16px;
      line-height: 1.45;
      flex: 1;
    }
    
    /* Hero Visualization - Glassmorphism Status Card */
    .hero-visualization {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      padding: 24px;
    }
    
    /* CSS STYLING - BALANCED HERO */
    .visual-wrapper {
      position: relative;
      width: 100%;
      max-width: 450px;
      height: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1000px;
      margin: 0 auto;
    }

    /* Der grüne Leucht-Hintergrund - Ausgewogen */
    .glow-blob {
      position: absolute;
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, rgba(29, 185, 141, 0.45) 0%, rgba(15, 90, 70, 0.15) 70%);
      filter: blur(70px);
      border-radius: 50%;
      z-index: 0;
      animation: pulseBlob 6s infinite alternate;
    }

    /* Glassmorphism Basis-Stil */
    .glass-card {
      background: rgba(255, 255, 255, 0.7); /* Etwas transparenter */
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 
        0 30px 60px rgba(15, 90, 70, 0.15), /* Farbiger Schatten */
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
      border-radius: 28px;
      position: relative;
      z-index: 2;
    }

    /* Hauptkarte - Ausgewogen & Zentriert */
    .main-card {
      width: 360px;
      padding: 32px;
      transform: rotateY(-8deg) rotateX(3deg);
      transition: transform 0.3s ease;
      animation: floatCard 6s ease-in-out infinite;
      position: relative;
      overflow: hidden;
    }
    
    /* Medical Scan Effect - Premium Animation */
    .main-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent);
      transform: skewX(-25deg);
      animation: shine 6s infinite;
      pointer-events: none;
    }
    
    @keyframes shine {
      0% { left: -100%; opacity: 0; }
      20% { left: 200%; opacity: 1; }
      100% { left: 200%; opacity: 0; }
    }

    /* Interaktivität: Wenn man mit der Maus drüber fährt, dreht sie sich gerade */
    .visual-wrapper:hover .main-card {
      transform: rotateY(0deg) rotateX(0deg) scale(1.02);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 25px;
    }

    .icon-box {
      width: 50px; 
      height: 50px; /* Größer */
      background: #ECFDF5; 
      color: #0F5A46;
      border-radius: 14px;
      display: flex; 
      align-items: center; 
      justify-content: center;
    }
    
    .icon-box svg { 
      width: 28px; 
      height: 28px; 
    }

    .status-text {
      font-weight: 800; 
      color: #1F2937;
      font-size: 1.3rem; /* Größer */
    }

    .divider { 
      height: 1px; 
      background: linear-gradient(90deg, transparent, #E5E7EB, transparent); 
      margin-bottom: 25px; 
    }

    /* Balken-Design */
    .metric-item { 
      margin-bottom: 25px; 
    }

    .metric-label {
      display: flex; 
      justify-content: space-between;
      font-size: 1rem; 
      margin-bottom: 10px;
      font-weight: 600; 
      color: #4B5563;
    }

    .trend-down { 
      color: #0F5A46; 
      font-size: 0.85rem; 
      background: #d1fae5; 
      padding: 4px 10px; 
      border-radius: 6px; 
    }
    
    .trend-up { 
      color: #059669; 
      font-size: 0.85rem; 
      background: #ECFDF5; 
      padding: 4px 10px; 
      border-radius: 6px; 
    }

    .progress-bg { 
      height: 12px; 
      background: #F3F4F6; 
      border-radius: 12px; 
      overflow: hidden; 
    }
    
    .progress-fill { 
      height: 100%; 
      border-radius: 12px; 
      animation: fillBar 1.5s ease-out forwards; 
    }
    
    .progress-fill.down { 
      background: linear-gradient(90deg, #9CA3AF, #6B7280); 
      width: 0; 
      animation-delay: 0.2s; 
    }
    
    .progress-fill.up { 
      background: linear-gradient(90deg, #10B981, #34D399); 
      width: 0; 
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.5); 
      animation-delay: 0.4s; 
    }

    /* Schwebendes Badge - Außerhalb der Karte */
    .float-badge {
      position: absolute;
      bottom: -25px;
      right: -25px;
      padding: 15px 25px;
      display: flex; 
      align-items: center; 
      gap: 15px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      transform: translateZ(40px);
      animation: floatBadge 7s ease-in-out infinite reverse;
      z-index: 10;
    }

    .check-circle {
      width: 28px; 
      height: 28px;
      background: #0F5A46; 
      color: white;
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 16px;
    }

    .badge-text strong { 
      display: block; 
      font-size: 1rem; 
      color: #1F2937; 
    }
    
    .badge-text span { 
      font-size: 0.8rem; 
      color: #6B7280; 
    }

    /* Animationen */
    @keyframes floatCard {
      0%, 100% { transform: rotateY(-12deg) rotateX(5deg) translateY(0); }
      50% { transform: rotateY(-12deg) rotateX(5deg) translateY(-20px); }
    }
    
    @keyframes floatBadge {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes pulseBlob {
      0% { transform: scale(0.9); opacity: 0.5; }
      100% { transform: scale(1.1); opacity: 0.7; }
    }
    
    @keyframes fillBar { 
      from { width: 0; } 
    }
    
    /* Mobile: Visualization ausblenden */
    @media (max-width: 768px) {
      .hero-visualization {
        display: none;
      }
    }
    
    @media (max-width: 768px) {
      .hero-info-card {
        margin-top: 24px;
      }
      font-size: 16px;
      line-height: 1.5;
      color: var(--text-secondary-color);
    }
    
    .checkmark-icon {
      width: 24px;
      height: 24px;
      min-width: 24px;
      color: var(--primary-green);
      flex-shrink: 0;
    }
    
    .cta-button-primary {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      height: 54px;
      padding: 0 var(--space-7);
      background: linear-gradient(135deg, var(--forest-green) 0%, var(--mint-fresh) 100%);
      color: white;
      font-size: 17px;
      font-weight: 600;
      border: none;
      border-radius: var(--button-border-radius);
      cursor: pointer;
      box-shadow: var(--button-shadow);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .cta-button-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(14, 90, 69, 0.3), 0 4px 10px rgba(14, 90, 69, 0.2);
      background: linear-gradient(135deg, var(--forest-green-dark) 0%, #0E9F6E 100%);
    }
    
    .cta-button-primary:active {
      transform: translateY(-1px);
    }
    
    .arrow-icon {
      width: 20px;
      height: 20px;
    }
    
    /* Hero Illustration */
    .hero-illustration {
      position: relative;
      height: 600px;
    }
    
    .body-silhouette-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .body-silhouette {
      width: 400px;
      height: 600px;
    }
    
    .ecs-hotspot {
      fill: var(--primary-green);
      filter: drop-shadow(0 0 8px rgba(207, 241, 231, 0.6));
      animation: hotspot-pulse 2s ease-in-out infinite;
    }
    
    @keyframes hotspot-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
    }
    
    .ecs-hotspot.brain { animation-delay: 0s; }
    .ecs-hotspot.heart { animation-delay: 0.4s; }
    .ecs-hotspot.gut { animation-delay: 0.8s; }
    .ecs-hotspot.immune { animation-delay: 1.2s; }
    
    .molecule-decoration {
      width: 40px;
      height: 40px;
      background: radial-gradient(circle, var(--accent-mint), var(--accent-mint-light));
      border-radius: 50%;
      position: absolute;
      animation: molecule-float 6s ease-in-out infinite;
      opacity: 0.4;
    }
    
    @keyframes molecule-float {
      0%, 100% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(-20px) rotate(180deg);
      }
    }
    
    .molecule-1 { top: 10%; left: 10%; animation-delay: 0s; }
    .molecule-2 { top: 60%; right: 15%; animation-delay: 2s; }
    .molecule-3 { bottom: 20%; left: 20%; animation-delay: 4s; }
    
    /* ============================================================
       SECTION STYLES (General)
       ============================================================ */
    
    section {
      padding: var(--spacing-block) 0;
    }
    
    .section-headline {
      font-size: clamp(1.75rem, 1.2rem + 1.5vw, 2rem);
      font-weight: 700;
      color: var(--heading-color);
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }
    
    .section-description {
      font-size: var(--body-text-size);
      color: var(--body-text-color);
      text-align: center;
      line-height: var(--line-height-comfortable);
      max-width: var(--max-text-width);
      margin: 0 auto var(--spacing-paragraph);
    }
    
    /* ============================================================
       WHY REDUMED SECTION
       ============================================================ */
    
    .why-medless {
      background: var(--background-ultra-light);
    }
    
    .wunsch-section {
      padding-top: var(--spacing-section);
      padding-bottom: var(--spacing-section);
    }
    
    .explanation-card {
      background: white;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-large);
      padding: var(--space-5);
      margin-bottom: var(--spacing-paragraph);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.03);
    }
    
    .card-icon {
      width: 56px;
      height: 56px;
      background: rgba(14, 95, 69, 0.08);
      border-radius: var(--radius-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-4);
    }
    
    .card-icon i {
      font-size: var(--icon-size);
      color: var(--icon-color-primary);
    }
    
    .explanation-card h3 {
      font-size: clamp(1.25rem, 1rem + 0.5vw, 1.375rem);
      font-weight: 600;
      color: var(--heading-color);
      line-height: 1.35;
      margin-bottom: 14px;
      max-width: var(--max-width-card-text);
    }
    
    .explanation-card p {
      font-size: var(--body-text-size);
      color: var(--body-text-color);
      line-height: var(--line-height-comfortable);
      margin-bottom: var(--space-4);
      max-width: var(--max-text-width);
    }
    
    .explanation-card p:last-child {
      margin-bottom: 0;
    }
    
    .process-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-6);
      margin-top: var(--spacing-block-small);
    }
    
    @media (max-width: 1024px) {
      .process-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 640px) {
      .process-cards-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .process-card {
      background: white;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-large);
      padding: var(--space-5);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.03);
      position: relative;
      transition: all 0.2s ease;
    }
    
    .process-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.06);
      border-color: var(--gray-300);
    }
    
    .card-number {
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      font-size: 4rem;
      font-weight: 800;
      color: var(--accent-mint);
      opacity: 0.3;
      line-height: 1;
    }
    
    .card-icon-circle {
      width: 56px;
      height: 56px;
      background: rgba(14, 95, 69, 0.1);
      border-radius: var(--radius-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-4);
    }
    
    .card-icon-circle i {
      font-size: var(--icon-size);
      color: var(--icon-color-primary);
    }
    
    .process-card h4 {
      font-size: clamp(1.125rem, 0.95rem + 0.3vw, 1.25rem);
      font-weight: 600;
      color: var(--heading-color);
      text-align: center;
      margin-bottom: 12px;
      line-height: 1.4;
      max-width: var(--max-width-card-text);
      margin-left: auto;
      margin-right: auto;
    }
    
    .process-card p {
      font-size: var(--body-text-size);
      color: var(--body-text-color);
      line-height: var(--line-height-comfortable);
      text-align: center;
      max-width: 40ch;
      margin-left: auto;
      margin-right: auto;
    }
    
    /* ============================================================
       HOW IT WORKS SECTION
       ============================================================ */
    
    /* Bereichs-Überschrift */
    .how-it-works h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 3rem;
      text-align: center;
    }
    
    .how-it-works {
      background: #F9FAFB;
      padding: 80px 0;
    }
    
    /* Container für die Schritte */
    .steps-container {
      display: flex;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 3rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Einzelne Schritt-Karte */
    .step {
      background-color: #fff;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s ease;
      flex: 1;
    }
    
    .step:hover {
      transform: translateY(-5px);
    }
    
    /* Nummerierungskreis */
    .step-number-circle {
      display: inline-block;
      width: 60px;
      height: 60px;
      line-height: 60px;
      border-radius: 50%;
      background-color: #e6f7f1;
      color: #00a86b;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }
    
    .step-connector {
      display: none;
    }
    
    .step-content {
      flex: 1;
    }
    
    /* Karten-Überschrift */
    .step-content h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 1rem;
    }
    
    /* Karten-Text */
    .step-content p {
      font-size: 1rem;
      line-height: 1.6;
      color: #555;
    }
    
    /* Hide step 5 on desktop (only show 4 cards) */
    .step:nth-child(5) {
      display: none;
    }
    
    /* Mobile: Stack vertically */
    @media (max-width: 768px) {
      .steps-container {
        flex-direction: column;
        gap: 1.5rem;
      }
      
      .step:nth-child(5) {
        display: block;
      }
      
      .step:hover {
        transform: none;
      }
    }
    
    /* ============================================================
       SAFETY WARNING SECTION
       ============================================================ */
    
    .safety-warning {
      background: var(--gray-50);
      border-top: 1px solid var(--gray-200);
      border-bottom: 1px solid var(--gray-200);
    }
    
    .warning-box {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border: 2px solid var(--warning-border-color);
      border-radius: var(--card-border-radius);
      padding: 28px;
      box-shadow: var(--card-shadow);
    }
    
    .warning-header {
      display: flex;
      align-items: center;
      gap: var(--space-5);
      margin-bottom: var(--space-5);
    }
    
    .warning-icon-circle {
      width: 56px;
      height: 56px;
      min-width: 56px;
      background: rgba(59, 130, 246, 0.10);  /* Sanftes Blau */
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .warning-icon-circle i {
      font-size: 28px;
      color: #3B82F6;  /* Sanftes Blau statt Rot */
    }
    
    .warning-title {
      font-size: clamp(1.25rem, 1rem + 0.5vw, 1.5rem);
      font-weight: 700;
      color: var(--heading-color);
      line-height: 1.3;
    }
    
    .warning-content {
      font-size: 16px;
      color: var(--text-body-color);
      line-height: 1.6;
    }
    
    .warning-content p {
      margin-bottom: var(--spacing-paragraph);
    }
    
    .warning-content p:last-child {
      margin-bottom: 0;
    }
    
    .warning-content strong {
      font-weight: 700;
      color: #1E40AF;  /* Dunkleres Blau für bessere Lesbarkeit */
    }
    
    .warning-list {
      list-style: none;
      margin: var(--space-5) 0;
      padding-left: 0;
    }
    
    .warning-list li {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
      font-size: 16px;
      color: var(--text-body-color);
      line-height: 1.6;
    }
    
    .warning-list li i {
      color: #3B82F6;  /* Sanftes Blau */
      font-size: 18px;
      margin-top: 2px;
      min-width: 18px;
      flex-shrink: 0;
    }
    
    /* Medical List (for explanation cards - calm, professional) */
    .medical-list {
      list-style: none;
      margin: var(--space-5) 0;
      padding-left: 0;
    }
    
    .medical-list li {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
      font-size: 16px;
      color: var(--text-body-color);
      line-height: 1.6;
    }
    
    .medical-list li i {
      color: #1DB98D;
      font-size: 18px;
      margin-top: 2px;
      min-width: 20px;
      flex-shrink: 0;
    }
    
    .medical-list li strong {
      color: var(--text-body-color);
      font-weight: 600;
    }
    
    /* ============================================================
       PLANNER SECTION
       ============================================================ */
    
    .planner-section {
      background: var(--background-ultra-light);
    }
    
    /* HEALTH TECH REDESIGN: Zentriertes Formular */
    #medication-form {
      max-width: 600px;
      margin: 0 auto;
    }
    
    /* Progress Bar Container */
    .progress-bar-container {
      max-width: 800px;
      margin: 0 auto var(--spacing-block-small);
      padding: var(--space-5);
      background: white;
      border-radius: var(--radius-large);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.03);
    }
    
    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      margin-bottom: 1rem;
    }
    
    .progress-line {
      position: absolute;
      top: 24px;
      left: 48px;
      right: 48px;
      height: 4px;
      background: var(--border-light);
      z-index: 1;
    }
    
    .progress-line-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-dark-green), var(--primary-green));
      width: 0%;
      transition: width 0.4s ease;
    }
    
    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2;
      position: relative;
    }
    
    .progress-circle {
      width: 48px;
      height: 48px;
      min-width: 48px;
      border-radius: 50%;
      background: white;
      border: 4px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-muted);
      transition: all 0.3s ease;
    }
    
    .progress-circle.active {
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      border-color: var(--primary-green);
      color: white;
      box-shadow: 0 4px 12px rgba(12, 92, 76, 0.3);
    }
    
    .progress-circle.completed {
      background: var(--primary-green);
      border-color: var(--primary-green);
      color: white;
    }
    
    .progress-label {
      margin-top: var(--space-2);
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      text-align: center;
      max-width: 80px;
    }
    
    .progress-label.active {
      color: var(--primary-dark-green);
      font-weight: 600;
    }
    
    /* Form Steps */
    .form-step {
      display: none;
    }
    
    .form-step.active {
      display: block;
      animation: fadeInSlide 0.4s ease;
    }
    
    @keyframes fadeInSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Medication Reduction Animation Keyframes */
    @keyframes pillDescend {
      0%, 100% {
        transform: translateY(0) rotate(0deg);
        opacity: 0.9;
      }
      50% {
        transform: translateY(150px) rotate(15deg);
        opacity: 0.3;
      }
    }
    
    @keyframes cannabinoidAscend {
      0%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.8;
      }
      50% {
        transform: translateY(-120px) scale(1.1);
        opacity: 1;
      }
    }
    
    /* Apply animations to SVG elements */
    .pill {
      animation: pillDescend 4s ease-in-out infinite;
    }
    
    .pill-1 { animation-delay: 0s; }
    .pill-2 { animation-delay: 0.5s; }
    .pill-3 { animation-delay: 1s; }
    .pill-4 { animation-delay: 1.5s; }
    .pill-5 { animation-delay: 2s; }
    .pill-6 { animation-delay: 2.5s; }
    
    .molecule {
      animation: cannabinoidAscend 5s ease-in-out infinite;
    }
    
    .cannabinoid-1 { animation-delay: 0s; }
    .cannabinoid-2 { animation-delay: 1.2s; }
    .cannabinoid-3 { animation-delay: 2.4s; }
    
    .medication-reduction-animation {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    /* ============================================================
       AUTOCOMPLETE DROPDOWN STYLING (Step 3)
       ============================================================ */
    
    .autocomplete-list {
      background: white;
      border: 2px solid var(--accent-mint) !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 24px rgba(12, 92, 76, 0.15) !important;
      margin-top: 0.5rem !important;
      padding: 0.5rem 0 !important;
      max-height: 320px !important;
      overflow-y: auto;
      animation: dropdownFadeIn 0.2s ease-out;
    }
    
    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .autocomplete-item {
      padding: 1rem 1.25rem !important;
      cursor: pointer;
      border-bottom: 1px solid var(--accent-mint-light) !important;
      transition: all 0.2s ease;
      margin: 0 0.5rem;
      border-radius: 12px !important;
    }
    
    .autocomplete-item:last-child {
      border-bottom: none !important;
    }
    
    .autocomplete-item:hover {
      background: linear-gradient(135deg, var(--accent-mint-light), #ffffff) !important;
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(12, 92, 76, 0.1);
    }
    
    .autocomplete-item .font-semibold {
      color: var(--primary-dark-green);
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .autocomplete-item .text-sm {
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-style: italic;
      margin-bottom: 0.5rem;
    }
    
    .autocomplete-item .text-xs {
      margin-top: 0.5rem;
    }
    
    .autocomplete-item .bg-red-100 {
      background: linear-gradient(135deg, #FEE2E2, #FECACA);
      color: #991B1B;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      letter-spacing: 0.025em;
    }
    
    .autocomplete-item .bg-yellow-100 {
      background: linear-gradient(135deg, #FEF3C7, #FDE68A);
      color: #92400E;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      letter-spacing: 0.025em;
    }
    
    .autocomplete-item .bg-green-100 {
      background: linear-gradient(135deg, var(--accent-mint), var(--accent-mint-light));
      color: var(--primary-dark-green);
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      letter-spacing: 0.025em;
    }
    
    /* Scrollbar styling for dropdown */
    .autocomplete-list::-webkit-scrollbar {
      width: 8px;
    }
    
    .autocomplete-list::-webkit-scrollbar-track {
      background: var(--accent-mint-light);
      border-radius: 10px;
    }
    
    .autocomplete-list::-webkit-scrollbar-thumb {
      background: var(--primary-green);
      border-radius: 10px;
    }
    
    .autocomplete-list::-webkit-scrollbar-thumb:hover {
      background: var(--primary-dark-green);
    }
    
    .form-card {
      background: white;
      border: 1px solid var(--border-light);
      border-radius: 16px;
      padding: var(--space-7);
      margin-bottom: var(--spacing-paragraph);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 20px -5px rgba(0, 0, 0, 0.08);
    }
    
    .form-card h3 {
      font-size: clamp(1.25rem, 1rem + 0.5vw, 1.4rem);
      font-weight: 600;
      color: var(--primary-dark-green);
      line-height: 1.3;
      margin-bottom: var(--space-2);
    }
    
    .form-card .subtitle {
      font-size: 16px;
      color: var(--text-body-color);
      line-height: 1.6;
      margin-bottom: var(--space-5);
    }
    
    .form-row {
      margin-bottom: var(--space-5);
    }
    
    .form-row label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-body-color);
      margin-bottom: var(--space-2);
      -webkit-tap-highlight-color: transparent;
    }
    
    .form-row input[type="text"],
    .form-row input[type="email"],
    .form-row input[type="number"],
    .form-row select,
    .form-row textarea {
      width: 100%;
      padding: 14px 16px;
      font-size: 16px;
      font-family: var(--font-family);
      color: var(--text-body-color);
      border: 2px solid var(--border-light);
      border-radius: 10px;
      background: white;
      transition: all 0.2s ease;
    }
    
    .form-row input:focus,
    .form-row select:focus,
    .form-row textarea:focus {
      outline: none;
      border-color: var(--forest-green);
      box-shadow: 0 0 0 3px rgba(14, 90, 69, 0.10);
      background: #FAFAFA;
    }
    
    .form-row input::placeholder,
    .form-row textarea::placeholder {
      color: var(--text-muted);
    }
    
    /* Radio Pills for Gender */
    .radio-pills {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    
    .radio-pill {
      position: relative;
    }
    
    .radio-pill input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    
    .radio-pill label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary-color);
      background: white;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }
    
    .radio-pill input:checked + label {
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white;
      border-color: var(--primary-green);
      box-shadow: 0 2px 8px rgba(12, 92, 76, 0.15);
    }
    
    .radio-pill label:hover {
      border-color: var(--primary-green);
      transform: translateY(-1px);
    }
    
    /* Form Navigation Buttons */
    .form-navigation {
      display: flex;
      gap: var(--space-4);
      justify-content: space-between;
      margin-top: var(--space-6);
    }
    
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px;
      padding: 0 var(--space-6);
      font-size: 16px;
      font-weight: 600;
      color: var(--text-body-color);
      background: white;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-medium);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-secondary i {
      font-size: 14px;
      display: flex;
      align-items: center;
      line-height: 1;
    }
    
    .btn-secondary:hover {
      border-color: var(--primary-green);
      color: var(--primary-green);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(12, 92, 76, 0.1);
    }
    
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px;
      padding: 0 var(--space-6);
      font-size: 16px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      border: none;
      border-radius: var(--radius-medium);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(12, 92, 76, 0.15);
      transition: all 0.2s ease;
    }
    
    .btn-primary i {
      font-size: 14px;
      display: flex;
      align-items: center;
      line-height: 1;
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 12px rgba(12, 92, 76, 0.2);
      background: linear-gradient(135deg, #0B4C36, #0E5F45);
    }
    
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    /* Medication Input Wrapper */
    .medication-inputs-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .btn-add-medication {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-green);
      background: white;
      border: 2px dashed var(--accent-mint);
      border-radius: var(--radius-small);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-add-medication:hover {
      background: var(--accent-mint-light);
      border-color: var(--primary-green);
    }
    
    /* Autocomplete Suggestions */
    .form-row {
      position: relative;
    }
    
    .autocomplete-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid var(--accent-mint);
      border-top: none;
      border-radius: 0 0 var(--radius-small) var(--radius-small);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: var(--shadow-medium);
    }
    
    .autocomplete-suggestion {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.2s ease;
      border-bottom: 1px solid var(--border-light);
    }
    
    .autocomplete-suggestion:last-child {
      border-bottom: none;
    }
    
    .autocomplete-suggestion:hover {
      background: var(--accent-mint-light);
    }
    
    .autocomplete-suggestion strong {
      color: var(--primary-dark-green);
      font-weight: 600;
    }
    
    .autocomplete-suggestion small {
      display: block;
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
    
    /* ============================================================
       FAQ SECTION
       ============================================================ */
    
    .faq-section {
      background: var(--background-white);
    }
    
    .faq-container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .faq-item {
      background: white;
      border: 1px solid var(--faq-border-color);
      border-radius: var(--faq-border-radius);
      margin-bottom: var(--space-4);
      overflow: hidden;
      transition: all 0.2s ease;
      box-shadow: var(--card-shadow);
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section above */
    
    .faq-question {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: 18px 20px;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-dark);
      background: #F9F9F9;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 280ms ease-in-out;
    }
    
    .faq-item.active .faq-question {
      background: #F9F9F9;
    }
    
    .faq-question-text {
      flex: 1;
    }
    
    .faq-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--accent-mint), var(--accent-mint-light));
      border-radius: 50%;
      color: var(--primary-green);
      font-size: 1rem;
      transition: transform 200ms ease-in-out, background 200ms ease-in-out;
    }
    
    .faq-icon i {
      transition: transform 200ms ease-in-out;
    }
    
    .faq-item.active .faq-icon {
      transform: rotate(180deg);
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white;
    }
    
    .faq-answer {
      max-height: 0;
      overflow: hidden;
      padding: 0;
      background: white;
      transition: max-height 350ms ease-in-out, padding 350ms ease-in-out;
    }
    
    .faq-item.active .faq-answer {
      max-height: 2000px;
      padding: 20px;
    }
    
    .faq-answer-content {
      font-size: 16px;
      color: var(--text-body-color);
      line-height: 1.6;
    }
    
    .faq-answer-content p {
      margin-bottom: var(--space-4);
    }
    
    .faq-answer-content p:last-child {
      margin-bottom: 0;
    }
    
    .faq-answer-content strong {
      font-weight: 600;
      color: var(--primary-dark-green);
    }
    
    .faq-answer-content ul {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }
    
    .faq-answer-content li {
      margin-bottom: 0.5rem;
    }
    
    /* Scroll to top button */
    .scroll-to-top {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(12, 92, 76, 0.3);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1000;
    }
    
    .scroll-to-top.visible {
      opacity: 1;
      visibility: visible;
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section above */
    
    /* ============================================================
       RESULTS PAGE - HIGH-TECH AI DASHBOARD
       ============================================================ */
    
    /* Container für die Ergebnisseite */
    #results {
      background: linear-gradient(to bottom, #FFFFFF 0%, #F9FAFB 100%);
      padding: 60px 20px;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
    }
    
    /* Subtiles Tech-Muster im Hintergrund */
    #results::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(90deg, rgba(29, 185, 141, 0.02) 1px, transparent 1px),
        linear-gradient(rgba(29, 185, 141, 0.02) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
      z-index: 0;
    }
    
    /* Alle Inhalte über dem Muster */
    #results > * {
      position: relative;
      z-index: 1;
    }
    
    /* ============================================================
       100% KREIS - Herzstück des Dashboards
       ============================================================ */
    
    .analysis-complete-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 80px;
      animation: fadeInScale 0.8s ease-out;
    }
    
    .circle-container {
      position: relative;
      width: 280px;
      height: 280px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    /* Pulsierender Mint-Glow Hintergrund */
    .glow-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(29, 185, 141, 0.15) 0%, transparent 70%);
      filter: blur(30px);
      animation: pulseGlow 2.5s ease-in-out infinite;
      z-index: -1;
    }
    
    /* Hauptkreis (100%) */
    .percentage-circle {
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF9 100%);
      border: 4px solid #1DB98D;
      box-shadow: 
        0 0 40px rgba(29, 185, 141, 0.3),
        0 20px 60px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
    }
    
    .percentage-circle .percentage {
      font-size: 64px;
      font-weight: 800;
      color: #0F5A46;
      line-height: 1;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(15, 90, 70, 0.1);
    }
    
    .percentage-circle .status-text {
      font-size: 14px;
      font-weight: 600;
      color: #1DB98D;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    /* ============================================================
       DATEN-VERBINDUNGEN (Pulsierende Linien)
       ============================================================ */
    
    .data-connections {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 0;
    }
    
    .connection-line {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, 
        rgba(29, 185, 141, 0) 0%, 
        rgba(29, 185, 141, 0.6) 50%, 
        rgba(29, 185, 141, 0) 100%
      );
      transform-origin: left center;
      animation: pulseConnection 2s ease-in-out infinite;
      opacity: 0;
      animation-delay: 1.2s;
      animation-fill-mode: forwards;
    }
    
    .connection-line.to-card-1 { animation-delay: 1.2s; }
    .connection-line.to-card-2 { animation-delay: 1.4s; }
    .connection-line.to-card-3 { animation-delay: 1.6s; }
    
    /* ============================================================
       DATEN-KARTEN - Glassmorphism Design
       ============================================================ */
    
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      max-width: 1200px;
      margin: 0 auto 60px auto;
      opacity: 0;
      animation: fadeInUp 0.8s ease-out 1.8s forwards;
    }
    
    .data-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 20px;
      padding: 35px 28px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.06),
        inset 0 1px 1px rgba(255, 255, 255, 0.9);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    /* Leuchtender Akzent oben */
    .data-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        #1DB98D 50%, 
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    
    .data-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 
        0 20px 60px rgba(29, 185, 141, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.9);
      border-color: rgba(29, 185, 141, 0.3);
    }
    
    .data-card:hover::before {
      opacity: 1;
    }
    
    /* Icon mit Leuchteffekt */
    .data-card-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(29, 185, 141, 0.2);
      transition: all 0.4s ease;
    }
    
    .data-card:hover .data-card-icon {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 8px 24px rgba(29, 185, 141, 0.35);
    }
    
    .data-card-icon i {
      font-size: 26px;
      color: #0F5A46;
      filter: drop-shadow(0 2px 4px rgba(15, 90, 70, 0.2));
    }
    
    /* Extra fette Zahlen */
    .data-card-value {
      font-size: 48px;
      font-weight: 800;
      color: #0F5A46;
      line-height: 1;
      margin: 16px 0 12px 0;
      letter-spacing: -1px;
      text-shadow: 0 2px 8px rgba(15, 90, 70, 0.1);
    }
    
    .data-card-label {
      font-size: 15px;
      font-weight: 500;
      color: #6B7280;
      line-height: 1.5;
    }
    
    /* ============================================================
       CTA-BEREICH - Elegante Glassmorphism Karte
       ============================================================ */
    
    .results-cta-wrapper {
      max-width: 800px;
      margin: 0 auto;
      opacity: 0;
      animation: fadeInUp 0.8s ease-out 2.2s forwards;
    }
    
    .results-cta-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.7);
      border-radius: 24px;
      padding: 50px 40px;
      box-shadow: 
        0 12px 48px rgba(0, 0, 0, 0.08),
        inset 0 1px 2px rgba(255, 255, 255, 0.95);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    /* Subtiler Leuchteffekt */
    .results-cta-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        #1DB98D 50%, 
        transparent 100%
      );
      opacity: 0.6;
    }
    
    .results-cta-title {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    
    .results-cta-subtitle {
      font-size: 17px;
      color: #6B7280;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    
    /* Der EINE leuchtende Button */
    .cta-primary-glow {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 18px 48px;
      font-size: 18px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #0F5A46 0%, #1DB98D 100%);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 
        0 8px 24px rgba(29, 185, 141, 0.35),
        0 0 40px rgba(29, 185, 141, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .cta-primary-glow::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    .cta-primary-glow:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 
        0 12px 32px rgba(29, 185, 141, 0.45),
        0 0 60px rgba(29, 185, 141, 0.3);
    }
    
    .cta-primary-glow:hover::before {
      width: 300px;
      height: 300px;
    }
    
    .cta-primary-glow:active {
      transform: translateY(-1px) scale(1.02);
    }
    
    /* ============================================================
       ANIMATIONEN
       ============================================================ */
    
    @keyframes fadeInScale {
      0% {
        opacity: 0;
        transform: scale(0.8);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes fadeInUp {
      0% {
        opacity: 0;
        transform: translateY(40px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulseGlow {
      0%, 100% {
        transform: scale(1);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.15);
        opacity: 0.8;
      }
    }
    
    @keyframes pulseConnection {
      0% {
        opacity: 0;
        transform: scaleX(0);
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.7;
        transform: scaleX(1);
      }
    }
    
    /* ============================================================
       RESPONSIVE - Mobile Optimierung
       ============================================================ */
    
    @media (max-width: 768px) {
      .circle-container {
        width: 220px;
        height: 220px;
      }
      
      .percentage-circle {
        width: 180px;
        height: 180px;
      }
      
      .percentage-circle .percentage {
        font-size: 52px;
      }
      
      .results-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .data-card-value {
        font-size: 40px;
      }
      
      .results-cta-card {
        padding: 40px 28px;
      }
      
      .results-cta-title {
        font-size: 26px;
      }
      
      .cta-primary-glow {
        padding: 16px 36px;
        font-size: 16px;
      }
    }
    
    /* ============================================================
       SAUBERES ERGEBNIS-DASHBOARD - STATISCH & PROFESSIONELL
       ============================================================ */
    
    .clean-results-dashboard {
      margin: 2rem 0 3rem 0;
      padding: 0;
    }
    
    /* ============================================================
       3 STATISTIK-KARTEN (Garantiert nebeneinander)
       ============================================================ */
    
    .results-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      max-width: 1000px;
      margin: 0 auto 40px auto;
    }
    
    .stat-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 30px 20px;
      text-align: center;
      transition: all 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border-color: #1DB98D;
    }
    
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    
    .stat-icon svg {
      stroke-width: 2;
    }
    
    .stat-number {
      font-size: 48px;
      font-weight: 800;
      color: #0F5A46;
      line-height: 1;
      margin: 0 0 8px 0;
      letter-spacing: -1px;
    }
    
    .stat-label {
      font-size: 14px;
      font-weight: 500;
      color: #6B7280;
      line-height: 1.4;
    }
    
    /* ============================================================
       DIE GROSSE "PLAN FERTIG" HERO-CARD
       ============================================================ */
    
    .plan-ready-hero {
      max-width: 1000px;
      margin: 0 auto;
      background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF9 100%);
      border: 2px solid #0F5A46;
      border-radius: 16px;
      padding: 50px 40px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }
    
    .hero-content {
      text-align: center;
    }
    
    .hero-title {
      font-size: 32px;
      font-weight: 700;
      color: #0F5A46;
      margin: 0 0 12px 0;
      line-height: 1.2;
    }
    
    .hero-subtitle {
      font-size: 18px;
      color: #4B5563;
      margin: 0 0 40px 0;
      line-height: 1.6;
    }
    
    /* Highlight-Features (3 Icons nebeneinander) */
    .hero-features {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .feature-icon {
      font-size: 28px;
    }
    
    .feature-text {
      font-size: 15px;
      font-weight: 600;
      color: #1F2937;
    }
    
    /* Der große CTA-Button */
    .hero-cta-button {
      display: inline-block;
      padding: 18px 50px;
      font-size: 18px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #0F5A46 0%, #1DB98D 100%);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(29, 185, 141, 0.3);
      transition: all 0.3s ease;
    }
    
    .hero-cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(29, 185, 141, 0.4);
    }
    
    .hero-cta-button:active {
      transform: translateY(0);
    }
    
    /* ============================================================
       RESPONSIVE - MOBILE
       ============================================================ */
    
    @media (max-width: 768px) {
      .results-stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .stat-card {
        padding: 24px 16px;
      }
      
      .stat-number {
        font-size: 40px;
      }
      
      .plan-ready-hero {
        padding: 40px 24px;
      }
      
      .hero-title {
        font-size: 26px;
      }
      
      .hero-subtitle {
        font-size: 16px;
      }
      
      .hero-features {
        flex-direction: column;
        gap: 20px;
        align-items: center;
      }
      
      .hero-cta-button {
        width: 100%;
        padding: 16px 40px;
        font-size: 16px;
      }
    }
    
    /* ============================================================
       FOOTER
       ============================================================ */
    
    footer {
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: rgba(255, 255, 255, 0.9);
      padding: 60px 0 20px;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 60px;
      margin-bottom: 50px;
    }
    
    .footer-branding h3 {
      font-size: clamp(1.6rem, 1.2rem + 1vw, 2rem);
      font-weight: 700;
      color: white;
      margin-bottom: var(--space-3);
    }
    
    .footer-branding .tagline {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.7;
      margin-bottom: var(--space-4);
    }
    
    .footer-branding p {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.7;
      margin-top: 14px;
    }
    
    .footer-section h4 {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin-bottom: 20px;
      letter-spacing: 0.02em;
    }
    
    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    
    .footer-links a {
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s ease;
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section above */
    
    .footer-disclaimer {
      background: rgba(0, 0, 0, 0.2);
      border-radius: var(--radius-medium);
      padding: var(--space-5);
      margin-bottom: var(--space-6);
    }
    
    .footer-disclaimer p {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }
    
    .footer-disclaimer p:last-child {
      margin-bottom: 0;
    }
    
    .footer-disclaimer strong {
      font-weight: 700;
      color: white;
    }
    
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: var(--space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }
    
    .footer-copyright {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.75);
    }
    
    .footer-social {
      display: flex;
      gap: 1rem;
    }
    
    .footer-social a {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      color: white;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    /* Hover styles moved to dedicated HOVER INTERACTIONS section above */
    
    /* ============================================================
       RESPONSIVE DESIGN
       ============================================================ */
    
    @media (max-width: 768px) {
      .hero-grid {
        grid-template-columns: 1fr;
        gap: var(--space-6);
      }
      
      .hero {
        padding: var(--space-5) 0 var(--space-4);
      }
      
      .container {
        padding: 0 var(--space-4);
      }
      
      /* WICHTIG: hero-content auf mobile linksbuendig! */
      .hero-content {
        text-align: left !important;
      }
      
      /* Typography Mobile */
      .hero-headline {
        font-size: clamp(1.75rem, 1rem + 2vw, 2.2rem);
        margin-bottom: var(--space-2);
        text-align: center;  /* Headline bleibt zentriert */
      }
      
      .hero-subheadline {
        font-size: 16px;
        margin-bottom: var(--space-3);
        text-align: center;  /* Subheadline bleibt zentriert */
      }
      
      .hero-description {
        margin-bottom: var(--space-3);
      }
      
      .hero-features {
        margin-bottom: var(--space-3);
      }
      
      .section-headline {
        font-size: clamp(1.5rem, 1rem + 1.2vw, 1.75rem);
        margin-bottom: var(--space-3);
      }
      
      /* Hero Features Mobile - IMMER linksbuendig! */
      .hero-features {
        gap: var(--space-2);
        text-align: left !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
        justify-content: flex-start !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
      }
      
      .hero-features li {
        font-size: 15px;
        text-align: left !important;
        display: flex !important;
        align-items: flex-start !important;
        justify-content: flex-start !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      
      .hero-features li i {
        margin-left: 0 !important;
        margin-right: 12px !important;
      }
      
      .hero-features li span {
        text-align: left !important;
        display: block !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      
      /* Extra: Alle 4 Eintraege explizit - KEIN EINZUG! */
      .hero-features li:nth-child(1),
      .hero-features li:nth-child(2),
      .hero-features li:nth-child(3),
      .hero-features li:nth-child(4) {
        text-align: left !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      
      .hero-features li:nth-child(3) {
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      
      .hero-features li:nth-child(3) i {
        margin-left: 0 !important;
      }
      
      .hero-features li:nth-child(3) span {
        text-align: left !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
      }
      
      /* Mobile Spacing Optimization */
      .hero {
        padding: 30px 0 35px !important;
      }
      
      .hero-headline {
        margin-bottom: 12px !important;
      }
      
      .hero-subheadline {
        margin-bottom: 18px !important;
        line-height: 1.55 !important;
      }
      
      .hero-features {
        gap: 6px !important;
        margin-bottom: 26px !important;
      }
      
      .hero-features li {
        margin-bottom: 0 !important;
        gap: 14px !important;
      }
      
      .hero-features li span {
        line-height: 1.45 !important;
      }
      
      .hero-illustration {
        height: 400px;
      }
      
      .process-cards-grid {
        grid-template-columns: 1fr;
        gap: var(--space-3);
      }
      
      .process-card {
        padding: var(--space-5);
      }
      
      .process-card h4 {
        font-size: 18px;
      }
      
      .process-card p {
        font-size: 15px;
      }
      
      section {
        padding: var(--space-4) 0;
      }
      
      /* Reduce spacing for "Der Wunsch" section on mobile */
      .wunsch-section {
        padding-top: var(--space-3);
        padding-bottom: var(--space-3);
      }
      
      /* Tighter spacing for specific sections */
      .why-medless {
        padding: var(--space-3) 0;
      }
      
      .how-section {
        padding: var(--space-3) 0;
      }
      
      .safety-warning {
        padding: var(--space-4) 0;
      }
      
      /* Explanation Cards Mobile */
      .explanation-card {
        padding: var(--space-4);
        margin-bottom: var(--space-3);
      }
      
      .explanation-card h3 {
        font-size: 18px;
        margin-bottom: var(--space-2);
      }
      
      .explanation-card p {
        font-size: 15px;
      }
      
      /* Steps Section Mobile */
      .step {
        grid-template-columns: 48px 1fr;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      
      .step-number-circle {
        width: 48px;
        height: 48px;
        min-width: 48px;
        font-size: 1.25rem;
      }
      
      .step-connector {
        left: 23px;
        top: 48px;
        height: calc(100% - 48px + 3rem);
      }
      
      .step-content h4 {
        font-size: 16px;
      }
      
      .step-content p {
        font-size: 0.95rem;
      }
      
      /* Step content lists - Bullets linksbündig mit Text, gleiche Schriftgröße */
      .step-content ul {
        padding-left: 0;
        margin-left: 0;
        list-style-position: outside;
      }
      
      .step-content ul li {
        margin-left: 1.25rem;
        padding-left: 0.25rem;
        font-size: inherit; /* Gleiche Größe wie .step-content p */
      }
      
      /* Safety Warning Mobile */
      .warning-box {
        padding: var(--space-5);
      }
      
      .warning-header {
        flex-direction: row;
        align-items: center;
        gap: var(--space-4);
      }
      
      .warning-icon-circle {
        width: 48px;
        height: 48px;
        min-width: 48px;
      }
      
      .warning-icon-circle i {
        font-size: 20px;
      }
      
      .warning-title {
        font-size: 18px;
      }
      
      .warning-content {
        font-size: 15px;
      }
      
      .warning-content p {
        font-size: 15px;
      }
      
      .warning-list li,
      .medical-list li {
        font-size: 15px;
        gap: var(--space-2);
      }
      
      .warning-list li {
        font-size: 1rem;
      }
      
      /* Planner Form Mobile */
      .progress-bar-container {
        padding: 1.5rem 1rem;
      }
      
      .progress-line {
        left: 24px;
        right: 24px;
      }
      
      .progress-circle {
        width: 40px;
        height: 40px;
        min-width: 40px;
        font-size: 1rem;
      }
      
      .progress-label {
        font-size: 0.65rem;
        max-width: 60px;
      }
      
      .form-card {
        padding: 1.5rem 1rem;
      }
      
      .form-card h3 {
        font-size: 1.5rem;
      }
      
      .medication-input-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      
      .btn-remove-medication {
        width: 100%;
      }
      
      .autocomplete-suggestions {
        max-height: 150px;
      }
      
      .form-navigation {
        flex-direction: column;
      }
      
      .btn-secondary,
      .btn-primary {
        width: 100%;
      }
      
      /* FAQ Mobile */
      .faq-question {
        padding: 1rem;
        font-size: 1rem;
      }
      
      .faq-icon {
        width: 28px;
        height: 28px;
        min-width: 28px;
        font-size: 0.875rem;
      }
      
      .faq-answer {
        padding: 0;
      }
      
      .faq-item.active .faq-answer {
        padding: 1rem;
      }
      
      .faq-answer-content {
        font-size: 0.95rem;
      }
      
      .scroll-to-top {
        bottom: 1rem;
        right: 1rem;
        width: 48px;
        height: 48px;
        font-size: 1rem;
      }
      
      /* Footer Mobile */
      .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      
      .footer-branding h3 {
        font-size: 1.75rem;
      }
      
      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }
    }
    
    /* Extra Small Devices (< 480px) */
    @media (max-width: 480px) {
      .container {
        padding: 0 var(--space-3);
      }
      
      .hero {
        padding: var(--space-6) 0 var(--space-5);
      }
      
      .hero-headline {
        font-size: 1.75rem;
        margin-bottom: var(--space-3);
      }
      
      .hero-subheadline {
        font-size: 15px;
      }
      
      .hero-features li {
        font-size: 14px;
      }
      
      .cta-button-primary {
        width: 100%;
        font-size: 15px;
      }
      
      section {
        padding: var(--space-6) 0;
      }
      
      .section-headline {
        font-size: 1.5rem;
      }
      
      .process-card,
      .explanation-card {
        padding: var(--space-4);
      }
      
      .card-icon-circle {
        width: 40px;
        height: 40px;
      }
      
      .card-icon-circle i {
        font-size: 18px;
      }
      
      .form-card {
        padding: var(--space-4);
      }
      
      .btn-primary,
      .btn-secondary {
        height: 44px;
        font-size: 15px;
      }
      
      .warning-box {
        padding: var(--space-4);
      }
      
      .warning-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      /* Step content lists - Extra small displays: gleiches Alignment */
      .step-content ul {
        padding-left: 0;
      }
      
      .step-content ul li {
        margin-left: 1.1rem;
      }
      
      .footer-branding h3 {
        font-size: 1.5rem;
      }
    }
    
    /* Hidden class */
    .hidden {
      display: none !important;
    }
    
    /* ============================================
       PRINT STYLES - für PDF-Export via Drucken
       ============================================ */
    @media print {
      /* WENN print-mode aktiv: Verstecke ALLES außer #results */
      body.print-mode > *:not(#results) {
        display: none !important;
        visibility: hidden !important;
      }
      
      body.print-mode main > *:not(#results) {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Verstecke Header, Footer, Navigation komplett */
      body.print-mode header,
      body.print-mode nav,
      body.print-mode footer,
      body.print-mode .hero-section,
      body.print-mode .hero-grid,
      body.print-mode .section-container,
      body.print-mode .progress-bar-container,
      body.print-mode button:not(#results button),
      body.print-mode .nav-container,
      body.print-mode .cta-buttons,
      body.print-mode #hero,
      body.print-mode #how-it-works,
      body.print-mode #benefits,
      body.print-mode #science,
      body.print-mode #faq,
      body.print-mode #planner-section,
      body.print-mode .scroll-to-top {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Zeige NUR #results */
      body.print-mode {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      body.print-mode main {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      body.print-mode #results {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        margin: 0 !important;
        padding: 20px !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      
      /* Optimiere Results für Druck */
      body.print-mode #results {
        box-shadow: none !important;
        border: none !important;
        background: white !important;
      }
      
      /* Entferne alle Animationen und Effekte */
      * {
        box-shadow: none !important;
        animation: none !important;
        transition: none !important;
      }
      
      /* Seitenumbruch-Optimierung */
      .result-card,
      .week-card,
      .cost-summary,
      .interaction-card {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 1rem;
      }
      
      h1, h2, h3, h4 {
        page-break-after: avoid;
        break-after: avoid;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Entferne Hintergründe für besseren Druck */
      body.print-mode,
      body.print-mode * {
        background: white !important;
        color: #000 !important;
      }
      
      /* Behalte wichtige Farben für Kontrast */
      body.print-mode .badge-high,
      body.print-mode .badge-medium,
      body.print-mode .badge-low {
        color: white !important;
      }
      
      body.print-mode .badge-high {
        background: #DC2626 !important;
      }
      
      body.print-mode .badge-medium {
        background: #F59E0B !important;
      }
      
      body.print-mode .badge-low {
        background: #10B981 !important;
      }
    }
    
    /* ============================================================
       DESKTOP LAYOUT OPTIMIZATION - Content Sections
       ============================================================ */
    
    /* Problem List - 2 Column Grid (Desktop) */
    .problem-list {
      list-style: none;
      padding: 0;
      margin: 2rem auto;
      max-width: 1200px;
      display: grid;
      gap: 20px;
    }
    
    .problem-list li {
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: all 0.3s ease;
    }
    
    .problem-list li:hover {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }
    
    .problem-list li i {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ECFDF5;
      border-radius: 50%;
      color: #0F5A46;
      font-size: 20px;
    }
    
    .problem-list li strong {
      color: #1F2937;
      font-weight: 700;
    }
    
    @media (min-width: 769px) {
      .problem-list {
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
    }
    
    /* Benefits Grid - 3x2 Layout (Desktop) */
    .benefits-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }
    
    .benefit-card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .benefit-card .card-icon-circle {
      width: 64px;
      height: 64px;
      background: rgba(14, 95, 69, 0.08);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .benefit-card .card-icon-circle i {
      font-size: 32px;
      color: #0E5A45;
    }
    
    .benefit-card h4 {
      font-size: 18px;
      font-weight: 600;
      color: #1A1A1A;
      margin-bottom: 12px;
    }
    
    .benefit-card p {
      font-size: 15px;
      color: #555555;
      line-height: 1.6;
    }
    
    @media (min-width: 769px) {
      .benefits-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;
      }
      
      .benefit-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
    }
    
    /* ECS Content Grid - 2 Column Layout (Desktop) */
    .ecs-content-grid {
      margin: 2rem auto;
      max-width: 900px;
    }
    
    .ecs-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 20px;
    }
    
    /* ECS Bullet Point Styling */
    .ecs-bullet {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    
    .ecs-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      min-width: 24px;
      min-height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }
    
    .ecs-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .ecs-text {
      flex: 1;
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
    }
    
    .ecs-text strong {
      color: #0E5A45;
      font-weight: 600;
      display: block;
      margin-bottom: 4px;
    }
    
    @media (min-width: 769px) {
      .ecs-content-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 48px;
        align-items: start;
        max-width: 1100px;
      }
      
      .ecs-text {
        font-size: 17px;
        line-height: 1.7;
        color: #374151;
      }
      
      .ecs-highlights {
        background: white;
        border: 1px solid rgba(14, 95, 69, 0.15);
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      
      .ecs-highlights .ecs-text {
        font-size: 16px;
      }
      
      .ecs-highlights .ecs-icon {
        width: 26px;
        height: 26px;
        min-width: 26px;
        min-height: 26px;
      }
    }
    
    /* Science Grid - 3 Column Cards (Desktop) */
    .science-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
      margin-top: 3rem;
    }
    
    .science-card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    
    .science-card .card-icon {
      width: 56px;
      height: 56px;
      background: rgba(14, 95, 69, 0.08);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .science-card .card-icon i {
      font-size: 32px;
      color: #0F5A46;
    }
    
    .science-card h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1A1A1A;
      margin-bottom: 16px;
    }
    
    .science-card p {
      font-size: 16px;
      color: #555555;
      line-height: 1.7;
      margin-bottom: 16px;
    }
    
    .science-card p:last-child {
      margin-bottom: 0;
    }
    
    @media (min-width: 769px) {
      .science-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;
      }
      
      .science-card:hover {
        transform: translateY(-4px);
        border-color: #1DB98D;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      }
    }
    
    @media (min-width: 1200px) {
      .science-grid {
        gap: 40px;
      }
    }
    
    /* Desktop: Unified Section Spacing */
    @media (min-width: 769px) {
      section {
        padding: 100px 0;
      }
      
      .why-medless {
        background: white;
      }
      
      .wunsch-section {
        background: #FAFAFA;
      }
    }
    
    /* ============================================================
       MAGAZINE SECTION - NEW
       ============================================================ */
    
    .magazine-section {
      background: var(--background-ultra-light);
      padding: var(--spacing-block) 0;
    }
    
    .magazine-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
      margin-top: 3rem;
    }
    
    .magazine-card {
      background: white;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-large);
      overflow: hidden;
      box-shadow: var(--card-shadow);
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
    }
    
    .magazine-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--card-shadow-hover);
      border-color: var(--primary-green);
    }
    
    .magazine-card-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
    }
    
    .magazine-card-content {
      padding: var(--space-5);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .magazine-card-category {
      display: inline-block;
      padding: 4px 12px;
      background: var(--accent-mint);
      color: var(--primary-dark-green);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: var(--radius-small);
      margin-bottom: var(--space-3);
      align-self: flex-start;
    }
    
    .magazine-card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--heading-color);
      line-height: 1.4;
      margin-bottom: var(--space-3);
    }
    
    .magazine-card-excerpt {
      font-size: 15px;
      color: var(--text-body-color);
      line-height: 1.6;
      margin-bottom: var(--space-4);
      flex: 1;
    }
    
    .magazine-card-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-green);
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .magazine-card-link:hover {
      color: var(--primary-dark-green);
      gap: 12px;
    }
    
    .magazine-card-link i {
      font-size: 12px;
    }
    
    /* Article Detail Page */
    .article-detail {
      max-width: 800px;
      margin: 0 auto;
      padding: var(--spacing-block) var(--space-5);
    }
    
    .article-header {
      margin-bottom: var(--space-7);
    }
    
    .article-category {
      display: inline-block;
      padding: 6px 16px;
      background: var(--accent-mint);
      color: var(--primary-dark-green);
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-radius: var(--radius-small);
      margin-bottom: var(--space-4);
    }
    
    .article-title {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      font-weight: 700;
      color: var(--primary-dark-green);
      line-height: 1.2;
      margin-bottom: var(--space-5);
    }
    
    .article-meta {
      display: flex;
      gap: var(--space-4);
      font-size: 14px;
      color: var(--text-muted);
      padding-bottom: var(--space-5);
      border-bottom: 1px solid var(--border-light);
    }
    
    .article-content {
      font-size: 18px;
      line-height: 1.7;
      color: var(--text-body-color);
    }
    
    .article-content h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary-dark-green);
      margin-top: var(--space-7);
      margin-bottom: var(--space-4);
    }
    
    .article-content p {
      margin-bottom: var(--space-5);
    }
    
    .article-content ul,
    .article-content ol {
      margin: var(--space-5) 0;
      padding-left: 2rem;
    }
    
    .article-content li {
      margin-bottom: var(--space-3);
    }
    
    .article-content strong {
      color: var(--primary-dark-green);
      font-weight: 600;
    }
    
    .article-cta {
      margin: var(--space-8) 0;
      padding: var(--space-6);
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      border: 2px solid var(--accent-mint);
      border-radius: var(--radius-large);
      text-align: center;
    }
    
    .article-cta h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary-dark-green);
      margin-bottom: var(--space-4);
    }
    
    .article-cta .cta-button-primary {
      margin: 0 auto;
    }
    
    @media (max-width: 1024px) {
      .magazine-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
      }
    }
    
    @media (max-width: 640px) {
      .magazine-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .article-detail {
        padding: var(--space-6) var(--space-4);
      }
      
      .article-content {
        font-size: 17px;
      }
    }
  </style>
</head>
<body>
  
  <!-- ============================================================
       SITE HEADER (STICKY)
       ============================================================ -->
  <header class="site-header">
    <div class="header-container">
      <div class="header-logo">
        <span class="logo-text">
          <span class="logo-med">Med</span><span class="logo-less">Less</span><span class="logo-dot">.</span>
        </span>
      </div>
      
      <nav class="header-nav">
        <a href="#ueber-medless">Über MEDLESS</a>
        <a href="#funktionsweise">Funktionsweise</a>
        <a href="#wissenschaft-ecs">Wissenschaft & ECS</a>
        <a href="#faq">FAQ</a>
        <a href="#magazin">Magazin</a>
        <a href="#kontakt" class="header-nav-contact">Kontakt</a>
      </nav>
    </div>
  </header>
  
  <main>
    
    <!-- ============================================================
         1) HERO SECTION
         ============================================================ -->
    <section class="hero scroll-animate" id="wie-es-funktioniert">
      <div class="container">
        <div class="hero-grid">
          
          <!-- Left: Content -->
          <div class="hero-content">
            <!-- Mobile Logo (only visible on mobile, centered above headline) -->
            <svg class="hero-logo-mobile" viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg">
              <!-- Circles representing medication reduction -->
              <circle cx="60" cy="50" r="30" fill="#0C5C4C"/>
              <circle cx="110" cy="50" r="20" fill="#0C5C4C"/>
              <circle cx="150" cy="50" r="14" fill="#0C5C4C"/>
              <circle cx="180" cy="50" r="10" fill="#0C5C4C"/>
              <circle cx="205" cy="50" r="7" fill="#0C5C4C"/>
              <circle cx="225" cy="50" r="5" fill="#0C5C4C"/>
              <circle cx="240" cy="50" r="3" fill="#0C5C4C"/>
              <circle cx="252" cy="50" r="2" fill="#0C5C4C"/>
              
              <!-- MedLess Text -->
              <text x="30" y="120" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="700" fill="#0C5C4C">MedLess</text>
              
              <!-- Tagline -->
              <text x="35" y="145" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="400" fill="#0C5C4C">weniger Medikamente</text>
              <text x="65" y="165" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="400" fill="#0C5C4C">mehr Leben</text>
            </svg>
            
            <h1 class="hero-headline">
              Weniger Tabletten. Mehr Leben.
            </h1>
            
            <h2 class="hero-subheadline">
              Dein persönlicher Fahrplan in die Unabhängigkeit – ärztlich begleitbar, KI-berechnet und wissenschaftlich fundiert.
            </h2>
            
            <ul class="hero-features">
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>Theoretische Simulation in 2–12 Wochen</span>
              </li>
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>Zeigt, wie das ECS bei der Reduktion unterstützen könnte</span>
              </li>
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>KI-basiert & individuell</span>
              </li>
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>Für die Zusammenarbeit mit deinem Arzt entwickelt</span>
              </li>
            </ul>
            
            <button class="cta-button-primary" onclick="document.getElementById('planner-section').scrollIntoView({behavior:'smooth'})">
              <span>Kostenlos Analyse starten</span>
              <i class="fas fa-arrow-right arrow-icon"></i>
            </button>
          </div>
          
          <!-- Right: Glassmorphism Status Card (Desktop only) -->
          <div class="hero-visualization">
            <div class="visual-wrapper">
              <div class="glow-blob"></div>

              <div class="glass-card main-card">
                <div class="card-header">
                  <div class="icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <span class="status-text">Analyse abgeschlossen</span>
                </div>
                
                <div class="divider"></div>

                <div class="metric-item">
                  <div class="metric-label">
                    <span>Medikamenten-Last</span>
                    <span class="trend-down">- Optimiert</span>
                  </div>
                  <div class="progress-bg">
                    <div class="progress-fill down" style="width: 35%;"></div>
                  </div>
                </div>

                <div class="metric-item">
                  <div class="metric-label">
                    <span>Lebensqualität (ECS)</span>
                    <span class="trend-up">+ Gesteigert</span>
                  </div>
                  <div class="progress-bg">
                    <div class="progress-fill up" style="width: 85%;"></div>
                  </div>
                </div>
              </div>

              <div class="glass-card float-badge">
                <div class="check-circle">✓</div>
                <div class="badge-text">
                  <strong>Plan bereit</strong>
                  <span>Ärztlich prüfbar</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
    
    <!-- ============================================================
         2) WARUM Medless SECTION
         ============================================================ -->
    <section class="why-medless scroll-animate" id="ueber-medless">
      <div class="container">
        
        <h2 class="section-headline">
          Gefangen zwischen „Ich muss" und „Ich will nicht mehr".
        </h2>
        
        <p class="section-description">
          Medikamentenabhängigkeit beginnt oft schleichend. Du willst reduzieren, hast aber Angst vor den Symptomen oder dem Entzug? Das Problem bist nicht du – es fehlte bisher nur der sichere Plan nach unten.
        </p>
        
        <ul class="problem-list">
          <li>
            <i class="fas fa-exclamation-circle"></i>
            <span><strong>Der fehlende Fahrplan:</strong> „Einfach weglassen" ist gefährlich. Dir fehlte eine exakte Anleitung.</span>
          </li>
          <li>
            <i class="fas fa-exclamation-circle"></i>
            <span><strong>Die Zeitnot im System:</strong> Dein Arzt will helfen, hat aber oft keine Kapazität für komplexe Berechnungen.</span>
          </li>
          <li>
            <i class="fas fa-exclamation-circle"></i>
            <span><strong>Die Angst vor dem Rückfall:</strong> Wir berechnen, wie dein Körper stabil bleiben kann.</span>
          </li>
        </ul>
        
      </div>
    </section>
    
    <!-- ============================================================
         3) DER WUNSCH SECTION (Lösung)
         ============================================================ -->
    <section id="funktionsweise" class="wunsch-section scroll-animate" style="background: #f9fafb;">
      <div class="container">
        
        <h2 class="section-headline">
          Der Wunsch nach weniger Belastung und mehr Lebensqualität
        </h2>
        
        <p class="section-description">
          Menschen wünschen sich mehr als nur Symptomfreiheit. Sie sehnen sich nach einem Leben mit:
        </p>
        
        <div class="benefits-grid" style="margin-top: 3rem;">
          
          <div class="benefit-card scroll-animate-card">
            <div class="card-icon-circle">
              <i class="fas fa-heartbeat"></i>
            </div>
            <h4>Weniger Nebenwirkungen</h4>
            <p>
              Endlich wieder klar im Kopf sein. Ohne den Nebel, die Müdigkeit oder das Gefühl, nicht mehr du selbst zu sein.
            </p>
          </div>
          
          <div class="benefit-card scroll-animate-card">
            <div class="card-icon-circle">
              <i class="fas fa-leaf"></i>
            </div>
            <h4>Natürlichere Lösungen</h4>
            <p>
              Das Vertrauen zurückgewinnen in die Selbstheilungskräfte deines Körpers – unterstützt durch das ECS.
            </p>
          </div>
          
          <div class="benefit-card scroll-animate-card">
            <div class="card-icon-circle">
              <i class="fas fa-shield-alt"></i>
            </div>
            <h4>Sicherheit & Kontrolle</h4>
            <p>
              Ein Plan, der dir zeigt, dass Reduktion möglich ist – ohne Rätselraten, ohne Risiko, mit System.
            </p>
          </div>
          
          <div class="benefit-card scroll-animate-card">
            <div class="card-icon-circle">
              <i class="fas fa-laptop-medical"></i>
            </div>
            <h4>Moderne Unterstützung</h4>
            <p>
              KI und Wissenschaft auf deiner Seite – damit du nicht mehr alleine herausfinden musst, wie es gehen könnte.
            </p>
          </div>
          
          <div class="benefit-card scroll-animate-card">
            <div class="card-icon-circle">
              <i class="fas fa-user-md"></i>
            </div>
            <h4>Professionelle Begleitung</h4>
            <p>
              Ein Werkzeug, das deinem Arzt zeigt, wie Cannabinoid-gestützte Reduktion funktionieren kann – für eine fundierte Entscheidung.
            </p>
          </div>
          
          <div class="benefit-card scroll-animate-card">
            <div class="card-icon-circle">
              <i class="fas fa-hands-helping"></i>
            </div>
            <h4>Selbstbestimmung</h4>
            <p>
              Du entscheidest, wann und wie viel. MEDLESS zeigt dir die Möglichkeiten – dein Arzt begleitet dich sicher dabei.
            </p>
          </div>
          
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         4) ENDOCANNABINOID-SYSTEM (ECS) SECTION - NEU
         ============================================================ -->
    <section id="wissenschaft-ecs" class="scroll-animate" style="padding: 80px 0; background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);">
      <div class="container">
        
        <h2 class="section-headline">
          Dein biologisches Sicherheitsnetz.
        </h2>
        
        <p class="section-description">
          Warum scheitern viele beim Absetzen? Weil das innere Gleichgewicht kippt. MedLess stärkt parallel dein Endocannabinoid-System (ECS). Stell es dir wie eine Waage vor: Wenn wir auf der einen Seite die Chemie reduzieren, legen wir auf der anderen Seite natürliche Unterstützung nach. So bleibt dein System stabil.
        </p>
        
        <div class="ecs-content-grid">
          <div class="ecs-text">
            <p>
              Dein Körper besitzt ein eigenes System zur Regulation von Stress, Schmerz, Schlaf und Stimmung – das <strong>Endocannabinoid-System (ECS)</strong>.
            </p>
            <p style="margin-top: 1rem;">
              Das ECS existiert in jedem Menschen und ist verantwortlich für Balance (Homöostase) in nahezu allen Körperfunktionen. Pflanzliche Cannabinoide wie CBD können dieses System stärken.
            </p>
          </div>
          
          <div class="ecs-highlights">
            <div class="ecs-list">
              <div class="ecs-bullet">
                <span class="ecs-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="11" fill="#0E5A45" fill-opacity="0.12"/>
                    <circle cx="12" cy="12" r="10" stroke="#0E5A45" stroke-width="1.5"/>
                    <path d="M8 12.5L10.5 15L16 9.5" stroke="#0E5A45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div class="ecs-text">
                  <strong>Körpereigenes Regulierungssystem:</strong>
                  Das ECS existiert in jedem Menschen und ist verantwortlich für Balance (Homöostase) in nahezu allen Körperfunktionen
                </div>
              </div>
              <div class="ecs-bullet">
                <span class="ecs-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="11" fill="#0E5A45" fill-opacity="0.12"/>
                    <circle cx="12" cy="12" r="10" stroke="#0E5A45" stroke-width="1.5"/>
                    <path d="M8 12.5L10.5 15L16 9.5" stroke="#0E5A45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div class="ecs-text">
                  <strong>Cannabinoide unterstützen das ECS:</strong>
                  Pflanzliche Cannabinoide wie CBD docken an dieselben Rezeptoren an wie körpereigene Endocannabinoide und können so das System stärken
                </div>
              </div>
              <div class="ecs-bullet">
                <span class="ecs-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="11" fill="#0E5A45" fill-opacity="0.12"/>
                    <circle cx="12" cy="12" r="10" stroke="#0E5A45" stroke-width="1.5"/>
                    <path d="M8 12.5L10.5 15L16 9.5" stroke="#0E5A45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div class="ecs-text">
                  <strong>Die Brücke zur Medikamentenreduktion:</strong>
                  Wenn das ECS stark ist, können Symptome besser reguliert werden – oft genau die Symptome, für die ursprünglich Medikamente verschrieben wurden
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p class="section-description" style="margin-top: 2rem; font-weight: 600; font-size: 1.15rem; color: #166534;">
          MEDLESS nutzt dieses Wissen, um dir zu zeigen, wie eine theoretische Medikamentenreduktion mit ECS-Unterstützung aussehen könnte.
        </p>
        
      </div>
    </section>
    
    <!-- Section Divider -->
    <div style="padding: 40px 0;">
      <hr class="section-divider">
    </div>
    
    <!-- ============================================================
         5) MEDLESS LÖSUNG SECTION
         ============================================================ -->
    <section class="scroll-animate" style="padding: 80px 0;">
      <div class="container">
        
        <h2 class="section-headline">
          MEDLESS: Die erste KI, die Cannabinoide nutzt, um Medikamente sicher zu reduzieren
        </h2>
        
        <p class="section-description">
          MEDLESS verbindet moderne Cannabinoid-Forschung mit künstlicher Intelligenz zu einem innovativen System der Medikamentenreduktion.
        </p>
        
        <div class="science-grid">
          
          <div class="science-card scroll-animate-card">
            <div class="card-icon">
              <i class="fas fa-flask"></i>
            </div>
            <h3>Wissenschaftliche Grundlage</h3>
          <p>
            MEDLESS arbeitet mit Cannabinoiden und dem Wissen über das Endocannabinoid-System (ECS) – nicht pauschal „nur mit CBD". Diese pflanzlichen Wirkstoffe interagieren mit körpereigenen Systemen, die an Schlaf, Schmerzempfinden, Stimmung, Stressregulation und Entzündungen beteiligt sind.
          </p>
          <p style="margin-top: 1rem;">
            Ein wichtiger Mechanismus: Bestimmte Cannabinoide beeinflussen Leberenzyme (CYP450-System), die auch für den Abbau vieler Medikamente verantwortlich sind. Dadurch können sich Blutspiegel einzelner Wirkstoffe verändern – mit Chancen, aber auch mit Risiken.
          </p>
          <p style="margin-top: 1rem;">
            MEDLESS nutzt diese Zusammenhänge, um theoretische Ausschleichmodelle zu berechnen. Es ersetzt keine klinischen Leitlinien und keine ärztliche Entscheidung, sondern stellt eine strukturierte, wissenschaftlich inspirierte Grundlage für das Arztgespräch bereit.
          </p>
          </div>
          
          <div class="science-card scroll-animate-card">
            <div class="card-icon">
              <i class="fas fa-calculator"></i>
            </div>
            <h3>Individuelle Berechnung</h3>
          <p>
            MEDLESS berechnet anhand deiner persönlichen Daten einen maßgeschneiderten, theoretischen Reduktionsplan:
          </p>
          <ul class="medical-list" style="margin-top: 1.5rem;">
            <li>
              <i class="fas fa-user"></i>
              <span><strong>Körpergröße, Gewicht, Alter, Geschlecht</strong> – biologische Faktoren beeinflussen Stoffwechsel und Medikamentenwirkung.</span>
            </li>
            <li>
              <i class="fas fa-pills"></i>
              <span><strong>Aktuelle Medikamente</strong> – Art, Dosierung, Einnahmefrequenz und Dauer der Einnahme.</span>
            </li>
            <li>
              <i class="fas fa-bullseye"></i>
              <span><strong>Zielmedikation</strong> – ob es um viele Präparate oder um ein einziges dauerndes Medikament (z. B. Schlafmittel, Antidepressivum zur Nacht oder „Magenschutz") geht.</span>
            </li>
            <li>
              <i class="fas fa-calendar-alt"></i>
              <span><strong>Zeitrahmen</strong> – gewünschter Ausschleichzeitraum (z. B. 2–12 Wochen, sanfter oder schneller).</span>
            </li>
            <li>
              <i class="fas fa-chart-line"></i>
              <span><strong>Reduktionsziel</strong> – von 10 % Dosisreduktion bis hin zum kompletten Ausschleichen.</span>
            </li>
          </ul>
          <p style="margin-top: 1rem;">
            Die Berechnung zeigt dir, wie ein möglicher Weg nach unten aussehen könnte – die tatsächliche Umsetzung erfolgt immer gemeinsam mit deinem Arzt.
          </p>
          </div>
          
          <div class="science-card scroll-animate-card">
            <div class="card-icon">
              <i class="fas fa-brain"></i>
            </div>
            <h3>KI-Intelligenz</h3>
          <p>
            Unsere KI berücksichtigt:
          </p>
          <ul class="medical-list" style="margin-top: 1.5rem;">
            <li>
              <i class="fas fa-exchange-alt"></i>
              <span>Bekannte Wechselwirkungen zwischen Cannabinoiden und vielen gängigen Medikamenten.</span>
            </li>
            <li>
              <i class="fas fa-project-diagram"></i>
              <span>Individualisierte Reduktionslogik auf Basis pharmakologischer Modelle und Sicherheitsmargen.</span>
            </li>
            <li>
              <i class="fas fa-shield-alt"></i>
              <span>Besondere Vorsicht bei sensiblen Wirkstoffen (z. B. Schlafmittel, Beruhigungsmittel, Antidepressiva, Blutverdünner).</span>
            </li>
            <li>
              <i class="fas fa-balance-scale"></i>
              <span>Eine vorsichtige Einschleusung und Anpassung der Cannabinoid-Dosierung im Zeitverlauf.</span>
            </li>
            <li>
              <i class="fas fa-shopping-cart"></i>
              <span>Produktempfehlungen für die MEDLESS-Produktlinie mit genauer Mengenberechnung.</span>
            </li>
          </ul>
          <p style="margin-top: 1rem;">
            <strong>Wichtig:</strong> Die KI ist gezielt auf die MEDLESS-Produkte trainiert. Nur bei diesen Produkten sind Konzentrationen und Cannabinoid-/Terpenprofile exakt hinterlegt. Deshalb gilt der Ausschleichplan ausschließlich für MEDLESS-Produkte – bei anderen Produkten wären die Berechnungen nicht mehr zuverlässig.
          </p>
          <p style="margin-top: 1rem;">
            Im Plan erhältst du zudem eine transparente Übersicht über die Gesamtkosten der MEDLESS-Produkte für deinen gewählten Ausschleichzeitraum.
          </p>
          </div>
          
        </div>
        
        <p class="section-description" style="margin-top: 3rem; font-size: 1.1rem; font-weight: 600;">
          MEDLESS verbindet moderne Forschung, Cannabinoid-Wissen und KI-Intelligenz zu einem sicheren, individualisierten System.
        </p>
        
      </div>
    </section>
    
    <!-- ============================================================
         6) SO FUNKTIONIERT Medless SECTION
         ============================================================ -->
    <section class="how-it-works scroll-animate">
      <div class="container">
        
        <h2 class="section-headline">
          So entsteht dein persönlicher MEDLESS-Ausschleichplan
        </h2>
        
        <div class="steps-container">
          
          <!-- Step 1 -->
          <div class="step scroll-animate-card">
            <div class="step-number-circle">1</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>Analyse starten</h4>
              <p>
                Erfasse deine Körperdaten und Medikamente sicher und diskret in wenigen Minuten.
              </p>
            </div>
          </div>
          
          <!-- Step 2 -->
          <div class="step scroll-animate-card">
            <div class="step-number-circle">2</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>KI-Berechnung</h4>
              <p>
                Unser Algorithmus prüft Wechselwirkungen und erstellt deinen individuellen Reduktionsfahrplan.
              </p>
            </div>
          </div>
          
          <!-- Step 3 -->
          <div class="step scroll-animate-card">
            <div class="step-number-circle">3</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>Ärztliche Abstimmung</h4>
              <p>
                Du erhältst ein professionelles PDF, mit dem dein Arzt die Dosisanpassung fundiert begleiten kann.
              </p>
            </div>
          </div>
          
          <!-- Step 4 -->
          <div class="step scroll-animate-card">
            <div class="step-number-circle">4</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>Natürliche Balance</h4>
              <p>
                Gleiche die Reduktion sanft aus – mit exakt berechneter Unterstützung für dein Endocannabinoid-System.
              </p>
            </div>
          </div>
          
          <!-- Step 5 -->
          <div class="step scroll-animate-card">
            <div class="step-number-circle">5</div>
            <div class="step-content">
              <h4>MEDLESS-AI berechnet automatisch</h4>
              <p>
                Innerhalb von Sekunden erhältst du:
              </p>
              <ul style="margin-top: 0.5rem;">
                <li>einen theoretischen, wöchentlichen Reduktionsplan für deine Medikamente</li>
                <li>eine dazu passende Cannabinoid-Dosierung auf Basis der MEDLESS-Produktlinie</li>
                <li>eine genaue Mengenberechnung, welche MEDLESS-Produkte du für den gesamten Zeitraum benötigst</li>
                <li>eine <strong>Gesamtkostenübersicht</strong> für diese Produkte und – optional – die Kosten pro Woche</li>
                <li>ein druckbares PDF mit klaren Wochenplänen, das du mit in die Ordination nehmen kannst</li>
              </ul>
            </div>
          </div>
          
        </div>
        
        <div style="text-align: center; margin-top: 3rem;">
          <button class="cta-button-primary" onclick="document.getElementById('planner-section').scrollIntoView({behavior:'smooth'})">
            <span>Kostenlos Analyse starten</span>
            <i class="fas fa-arrow-right arrow-icon"></i>
          </button>
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         7) SAFETY WARNING SECTION
         ============================================================ -->
    <section class="safety-warning">
      <div class="container">
        
        <div class="warning-box">
          
          <div class="warning-header">
            <div class="warning-icon-circle">
              <i class="fas fa-shield-alt"></i>
            </div>
            <h2 class="warning-title">
              <strong>Wichtiger medizinischer Haftungsausschluss</strong>
            </h2>
          </div>
          
          <div class="warning-content">
            
            <p>
              MedLess ist ein KI-gestütztes Informationstool und kein Ersatz für ärztlichen Rat, Diagnose oder Behandlung. Alle Berechnungen basieren auf wissenschaftlichen Studien und pharmakologischen Konzepten, ersetzen jedoch keine individuelle medizinische Beurteilung.
            </p>
            
            <p style="margin-top: 1.5rem;">
              <strong>Ändern Sie niemals eigenständig Ihre Medikation.</strong> Jede Anpassung muss mit Ihrem behandelnden Arzt oder Ihrer Ärztin besprochen und überwacht werden.
            </p>
            
          </div>
          
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         8) PLANNER SECTION (Form with Progress Bar)
         ============================================================ -->
    <section id="planner-section" class="planner-section scroll-animate">
      <div class="container">
        
        <h2 class="section-headline">
          Kostenlos Analyse starten
        </h2>
        
        <p class="section-description">
          Beantworten Sie einige Fragen zu Ihrer Person und Ihren Medikamenten, 
          und erhalten Sie einen individuellen 8-Wochen-Plan mit Cannabinoid-Dosierungen 
          und Medikamenten-Reduktionspotenzial.
        </p>
        
        <!-- Progress Bar -->
        <div class="progress-bar-container">
          <div class="progress-steps">
            <div class="progress-line">
              <div class="progress-line-fill" id="progress-fill" style="width: 20%;"></div>
            </div>
            
            <div class="progress-step" data-step="1">
              <div class="progress-circle active">1</div>
              <span class="progress-label active">Basisdaten</span>
            </div>
            
            <div class="progress-step" data-step="2">
              <div class="progress-circle">2</div>
              <span class="progress-label">Körperdaten</span>
            </div>
            
            <div class="progress-step" data-step="3">
              <div class="progress-circle">3</div>
              <span class="progress-label">Medikamente</span>
            </div>
            
            <div class="progress-step" data-step="4">
              <div class="progress-circle">4</div>
              <span class="progress-label">Planziel</span>
            </div>
            
            <div class="progress-step" data-step="5">
              <div class="progress-circle">5</div>
              <span class="progress-label">Kontakt</span>
            </div>
          </div>
        </div>
        
        <!-- Form -->
        <form id="medication-form">
          
          <!-- Step 1: Basisdaten -->
          <div id="step-1" class="form-step active">
            <div class="form-card">
              <h3>Schritt 1: Basisdaten</h3>
              <p class="subtitle">Wie möchten Sie angesprochen werden?</p>
              
              <div class="form-row">
                <label for="first-name">Vorname</label>
                <input type="text" id="first-name" name="first_name" placeholder="z.B. Maria" required />
              </div>
              
              <div class="form-row">
                <label>Geschlecht</label>
                <div class="radio-pills">
                  <div class="radio-pill">
                    <input type="radio" id="gender-female" name="gender" value="female" required />
                    <label for="gender-female">
                      <i class="fas fa-venus"></i>
                      Weiblich
                    </label>
                  </div>
                  <div class="radio-pill">
                    <input type="radio" id="gender-male" name="gender" value="male" />
                    <label for="gender-male">
                      <i class="fas fa-mars"></i>
                      Männlich
                    </label>
                  </div>
                  <div class="radio-pill">
                    <input type="radio" id="gender-diverse" name="gender" value="diverse" />
                    <label for="gender-diverse">
                      <i class="fas fa-transgender"></i>
                      Divers
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-navigation">
              <button type="button" class="btn-secondary" disabled>Zurück</button>
              <button type="button" class="btn-primary" onclick="nextStep(2)">
                Weiter zu Körperdaten
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
          
          <!-- Step 2: Körperdaten -->
          <div id="step-2" class="form-step">
            <div class="form-card">
              <h3>Schritt 2: Körperdaten</h3>
              <p class="subtitle">Ihre Körperdaten helfen Medless, eine individuelle Cannabinoid-Unterstützung für Sie zu planen.</p>
              
              <div class="form-row">
                <label for="age">Alter (Jahre)</label>
                <input type="number" id="age" name="age" placeholder="z.B. 45" min="18" max="120" required />
              </div>
              
              <div class="form-row">
                <label for="weight">Gewicht (kg)</label>
                <input type="number" id="weight" name="weight" placeholder="z.B. 70" min="30" max="250" step="0.1" required />
              </div>
              
              <div class="form-row">
                <label for="height">Körpergröße (cm)</label>
                <input type="number" id="height" name="height" placeholder="z.B. 170" min="120" max="230" required />
              </div>
            </div>
            
            <div class="form-navigation">
              <button type="button" class="btn-secondary" onclick="previousStep(1)">
                <i class="fas fa-arrow-left"></i>
                Zurück
              </button>
              <button type="button" class="btn-primary" onclick="nextStep(3)">
                Weiter zu Medikamenten
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
          
          <!-- Step 3: Medikamente -->
          <div id="step-3" class="form-step">
            <div class="form-card">
              <h3>Schritt 3: Ihre Medikamente</h3>
              <p class="subtitle">Welche Medikamente nehmen Sie täglich ein?</p>
              
              <div id="medication-inputs" class="medication-inputs-wrapper">
                <!-- Medication inputs will be added here by app.js -->
              </div>
              
              <button type="button" id="add-medication" class="btn-add-medication">
                <i class="fas fa-plus"></i>
                Weiteres Medikament hinzufügen
              </button>
            </div>
            
            <div class="form-navigation">
              <button type="button" class="btn-secondary" onclick="previousStep(2)">
                <i class="fas fa-arrow-left"></i>
                Zurück
              </button>
              <button type="button" class="btn-primary" onclick="nextStep(4)">
                Weiter zu Planziel
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
          
          <!-- Step 4: Planziel -->
          <div id="step-4" class="form-step">
            <div class="form-card">
              <h3>Schritt 4: Ihr Planziel</h3>
              <p class="subtitle">Wie lange und wie stark möchten Sie reduzieren?</p>
              
              <div class="form-row">
                <label for="duration-weeks">Plandauer (Einschleichphase)</label>
                <select id="duration-weeks" name="duration_weeks" required>
                  <option value="">-- Bitte wählen --</option>
                  <option value="6">6 Wochen – Schnell</option>
                  <option value="8" selected>8 Wochen – Standard (empfohlen) ⭐</option>
                  <option value="10">10 Wochen – Sanft</option>
                  <option value="12">12 Wochen – Sehr sanft</option>
                </select>
              </div>
              
              <div class="form-row">
                <label for="reduction-goal">Reduktionsziel</label>
                <select id="reduction-goal" name="reduction_goal" required>
                  <option value="">-- Bitte wählen --</option>
                  <option value="25">25% – Leichte Reduktion</option>
                  <option value="50" selected>50% – Halbierung (empfohlen) ⭐</option>
                  <option value="75">75% – Starke Reduktion</option>
                  <option value="100">100% – Vollständiges Absetzen (nur nach Rücksprache)</option>
                </select>
              </div>
            </div>
            
            <div class="form-navigation">
              <button type="button" class="btn-secondary" onclick="previousStep(3)">
                <i class="fas fa-arrow-left"></i>
                Zurück
              </button>
              <button type="button" class="btn-primary" onclick="nextStep(5)">
                Weiter zu Kontakt
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
          
          <!-- Step 5: Kontakt & Submit -->
          <div id="step-5" class="form-step">
            <div class="form-card">
              <h3>Schritt 5: Kontakt (Optional)</h3>
              <p class="subtitle">
                Möchten Sie den Plan per E-Mail erhalten? (Sie können ihn auch direkt herunterladen)
              </p>
              
              <div class="form-row">
                <label for="email">E-Mail-Adresse (optional)</label>
                <input type="email" id="email" name="email" placeholder="ihre.email@beispiel.de" autocomplete="email" />
              </div>
              
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 1rem; display: flex; align-items: center; gap: 0.375rem;">
                <i class="fas fa-lock" style="color: var(--primary-green); font-size: 0.625rem; flex-shrink: 0;"></i>
                <span>Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.</span>
              </p>
            </div>
            
            <div class="form-navigation">
              <button type="button" class="btn-secondary" onclick="previousStep(4)">
                <i class="fas fa-arrow-left"></i>
                Zurück
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-rocket"></i>
                Kostenlos Analyse starten
              </button>
            </div>
          </div>
          
        </form>
        
        <!-- Loading Animation -->
        <div id="loading" class="hidden">
          <div class="loading-card">
            
            <h3 class="loading-title">
              <i class="fas fa-brain" style="margin-right: 0.5rem;"></i>
              MEDLESS berechnet deinen individuellen Ausschleichplan
            </h3>
            <p class="loading-subtitle">
              <span id="analysis-status">KI-Analyse läuft</span><span id="status-dots"></span>
            </p>
            
            <!-- Circular Progress - Professional Health-Tech -->
            <div class="loader-circle">
              <svg width="120" height="120" viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                <!-- Glow Filter for Professional Effect -->
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <!-- Background Circle -->
                <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" stroke-width="5"></circle>
                
                <!-- Progress Circle with Glow -->
                <circle id="progress-circle" cx="50" cy="50" r="42" fill="none" stroke="url(#progressGradient)" stroke-width="5" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="264"></circle>
                
                <!-- Gradient for Progress Ring -->
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#0E5F45;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#097969;stop-opacity:1" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
                <i id="center-icon" class="fas fa-heartbeat" style="color: #0E5F45; font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <div id="center-percentage" style="font-size: 1.75rem; font-weight: 700; color: #0E5F45; letter-spacing: -0.02em; line-height: 1;">0%</div>
              </div>
            </div>
            
            <!-- Live Counter Stats - Professional KPI Dashboard -->
            <div id="live-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 2rem;">
              <div class="kpi-card" style="background: white; padding: 1.5rem 1rem; border-radius: 14px; border: 1px solid rgba(14, 95, 69, 0.12); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); animation: kpiCardEntry 500ms ease-out 600ms both;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                  <i class="fas fa-pills" style="color: #0E5F45; font-size: 1.25rem; opacity: 0.8;"></i>
                </div>
                <div style="font-size: 2.25rem; font-weight: 700; color: #0E5F45; letter-spacing: -0.02em; line-height: 1;" id="counter-medications">0</div>
                <div style="font-size: 0.875rem; color: #6B7280; margin-top: 0.5rem; font-weight: 500; line-height: 1.3;">Medikamente<br>analysiert</div>
              </div>
              
              <div class="kpi-card" style="background: white; padding: 1.5rem 1rem; border-radius: 14px; border: 1px solid rgba(14, 95, 69, 0.12); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); animation: kpiCardEntry 500ms ease-out 700ms both;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                  <i class="fas fa-exclamation-triangle" style="color: #0E5F45; font-size: 1.25rem; opacity: 0.8;"></i>
                </div>
                <div style="font-size: 2.25rem; font-weight: 700; color: #0E5F45; letter-spacing: -0.02em; line-height: 1;" id="counter-interactions">0</div>
                <div style="font-size: 0.875rem; color: #6B7280; margin-top: 0.5rem; font-weight: 500; line-height: 1.3;">Wechsel-<br>wirkungen</div>
              </div>
              
              <div class="kpi-card" style="background: white; padding: 1.5rem 1rem; border-radius: 14px; border: 1px solid rgba(14, 95, 69, 0.12); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); animation: kpiCardEntry 500ms ease-out 800ms both;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                  <i class="fas fa-calculator" style="color: #0E5F45; font-size: 1.25rem; opacity: 0.8;"></i>
                </div>
                <div style="font-size: 2.25rem; font-weight: 700; color: #0E5F45; letter-spacing: -0.02em; line-height: 1;" id="counter-calculations">0</div>
                <div style="font-size: 0.875rem; color: #6B7280; margin-top: 0.5rem; font-weight: 500; line-height: 1.3;">Berechnungen<br>durchgeführt</div>
              </div>
            </div>
            
            <!-- Plan Ready Message (GRÖSSER) -->

            
          </div>
        </div>
        
        <!-- Interstitial screen REMOVED - direct transition to results -->
        
      </div>
    </section>
    
    <!-- Section Divider -->
    <div style="padding: 40px 0;">
      <hr class="section-divider">
    </div>
    
    <!-- ============================================================
         9) FAQ SECTION
         ============================================================ -->
    <section class="faq-section scroll-animate" id="faq">
      <div class="container">
        
        <h2 class="section-headline">
          Häufig gestellte Fragen (FAQ)
        </h2>
        
        <p class="section-description">
          Alle wichtigen Informationen zu Medless, Cannabinoiden, Wechselwirkungen 
          und dem Medikamenten-Reduktionsprozess.
        </p>
        
        <div class="faq-container">
          
          <!-- FAQ 1 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Lohnt sich MedLess auch bei nur einem einzigen Medikament?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  MedLess ist sowohl für Menschen mit vielen Medikamenten (Polypharmazie) als auch für Personen geeignet, die nur ein einziges Dauer-Medikament ausschleichen möchten – zum Beispiel:
                </p>
                <ul>
                  <li>ein Schlafmittel</li>
                  <li>ein Antidepressivum zur Nacht</li>
                  <li>ein Schmerzmittel</li>
                  <li>oder ein „Magenschutz"-Präparat</li>
                </ul>
                <p>
                  Die KI berechnet einen theoretischen Reduktionsplan, der sich an deiner individuellen Situation orientiert. Die tatsächliche Umsetzung erfolgt immer gemeinsam mit deinem Arzt.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 2 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Wie unterstützen Cannabinoide beim Reduzieren?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Cannabinoide wirken auf zwei Ebenen:
                </p>
                <ul>
                  <li><strong>Stärkung des ECS:</strong> Sie unterstützen das Endocannabinoid-System, das Schlaf, Schmerz, Stimmung und Stress reguliert.</li>
                  <li><strong>Enzym-Einfluss:</strong> Sie können Leberenzyme (CYP450) beeinflussen, die Medikamente abbauen.</li>
                </ul>
                <p>
                  Wenn Symptome durch ein stabileres ECS zurückgehen, benötigt der Körper oft weniger Medikamente. Da sich Blutspiegel ändern können, ist die ärztliche Begleitung Pflicht.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 3 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Was ist das Endocannabinoid-System (ECS)?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Das ECS ist ein körpereigenes Regulationssystem für die innere Balance (Homöostase). Es besteht aus:
                </p>
                <ul>
                  <li>Endocannabinoiden (körpereigenen Botenstoffen)</li>
                  <li>Rezeptoren (CB1 und CB2) in Gehirn, Nerven und Organen</li>
                  <li>Enzymen zum Auf- und Abbau</li>
                </ul>
                <p>
                  Gerät dieses System aus dem Gleichgewicht (bei Stress, Schmerz, Schlafproblemen), greifen viele zu Medikamenten. MedLess setzt dort an, wo Cannabinoide das ECS natürlich unterstützen können.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 4 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Ersetzt MedLess den Arztbesuch?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  <strong>Nein.</strong> MedLess bietet keine medizinische Diagnose und keine Therapieempfehlung. Die Anwendung erstellt einen theoretischen, strukturierten Ausschleichplan auf Basis wissenschaftlicher Daten. Dieser Plan ist ausdrücklich als <strong>Gesprächsgrundlage für deinen behandelnden Arzt</strong> gedacht. Ändere deine Medikation niemals eigenständig.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 5 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Wie berechnet die KI die Dosierung?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  MedLess orientiert sich an Fachliteratur und nutzt unter anderem:
                </p>
                <ul>
                  <li>Dein Körpergewicht und Alter</li>
                  <li>Art und Anzahl der Medikamente</li>
                  <li>Den gewählten Zeitrahmen</li>
                  <li>Sicherheitsmargen bei sensiblen Wirkstoffen</li>
                </ul>
                <p>
                  Die Dosierung wird vorsichtig eingeschlichen und ist ein Vorschlag, den dein Arzt anpassen kann.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 6 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Warum funktioniert der Plan nur mit MEDLESS-Produkten?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Die KI ist gezielt auf die <strong>Bioverfügbarkeit der MEDLESS-Linie</strong> trainiert. Cannabinoidgehalt, Konzentrationen und Terpenprofile sind exakt hinterlegt. Nur auf dieser Basis kann die KI seriös berechnen, wie viele Tropfen/Einheiten du benötigst. Bei Fremdprodukten wären die Berechnungen unzuverlässig und potenziell unsicher.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 7 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Sehe ich die Kosten vorab?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Ja. In deinem PDF-Plan siehst du transparent:
                </p>
                <ul>
                  <li>welche Produkte du genau benötigst</li>
                  <li>für welchen Zeitraum sie ausreichen</li>
                  <li>die geschätzten Gesamtkosten</li>
                  <li>die Kosten pro Woche (zur Orientierung)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- FAQ 8 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Ist das legal und werde ich davon "high"?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Nicht-psychoaktive Cannabinoide wie CBD sind in vielen Ländern legal, solange der THC-Gehalt unter der gesetzlichen Grenze liegt (meist 0,2–0,3 %). CBD wirkt <strong>nicht berauschend</strong> und macht nach aktuellem Wissensstand nicht abhängig.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 9 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Wie schnell kann ich ausschleichen?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Das hängt von Medikament, Dauer der Einnahme und deiner Reaktion ab. MedLess simuliert Verläufe von <strong>2 bis 12 Wochen</strong>, die eher vorsichtig angelegt sind. Dein Arzt kann den Plan jederzeit verlängern oder Pausen einbauen.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 10 -->
          <div class="faq-item scroll-animate-card">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Kann mein Arzt das Tool auch nutzen?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Ja. Die Idee von MedLess ist es nicht, den Arzt zu ersetzen, sondern ihn zu unterstützen – durch mehr Übersicht, Struktur und einen klaren Fahrplan, den er mit dir gemeinsam bewerten kann.
                </p>
              </div>
            </div>
          </div>
          
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         MAGAZIN SECTION - NEW
         ============================================================ -->
    <section id="magazin" class="magazine-section scroll-animate">
      <div class="container">
        
        <h2 class="section-headline">
          Wissen & Ratgeber
        </h2>
        
        <p class="section-description">
          Medizinische Hintergründe, Tipps zur Reduktion und Neuigkeiten aus der Forschung.
        </p>
        
        <div class="magazine-grid">
          
          <!-- Article 1: Polypharmazie -->
          <a href="/magazin/taeglich-5-tabletten" class="magazine-card scroll-animate-card">
            <div class="magazine-card-image" style="background-image: url('/static/medications-elderly-hand.jpg'); background-size: cover; background-position: center;"></div>
            <div class="magazine-card-content">
              <span class="magazine-card-category">Polypharmazie</span>
              <h3 class="magazine-card-title">Täglich 5 Tabletten oder mehr? Warum das gefährlich ist.</h3>
              <p class="magazine-card-excerpt">
                Die stille Gefahr der Polypharmazie: Was passiert, wenn sich Medikamente im Körper gegenseitig beeinflussen?
              </p>
              <span class="magazine-card-link">
                Artikel lesen
                <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          
          <!-- Article 2: Medikamente absetzen -->
          <a href="/magazin/medikamente-absetzen-7-fehler" class="magazine-card scroll-animate-card">
            <div class="magazine-card-image" style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);"></div>
            <div class="magazine-card-content">
              <span class="magazine-card-category">Sicherheit & Praxis</span>
              <h3 class="magazine-card-title">Medikamente absetzen: Die 7 gefährlichsten Fehler</h3>
              <p class="magazine-card-excerpt">
                Du willst reduzieren? Vorsicht: Der falsche Weg kann direkt in die Notaufnahme führen. Erfahre, wie du den "Rebound-Effekt" vermeidest.
              </p>
              <span class="magazine-card-link">
                Artikel lesen
                <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          
          <!-- Article 3: Endocannabinoid-System -->
          <a href="/magazin/endocannabinoid-system-erklaert" class="magazine-card scroll-animate-card">
            <div class="magazine-card-image" style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%);"></div>
            <div class="magazine-card-content">
              <span class="magazine-card-category">Wissen & Grundlagen</span>
              <h3 class="magazine-card-title">Das Endocannabinoid-System: Dein körpereigenes Schutzschild</h3>
              <p class="magazine-card-excerpt">
                Stell dir vor, dein Körper hätte eine eigene Apotheke gegen Schmerz und Stress. Gute Nachricht: Du hast sie. Lerne dein ECS kennen.
              </p>
              <span class="magazine-card-link">
                Artikel lesen
                <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          
          <!-- Article 4: Antidepressiva absetzen -->
          <a href="/magazin/antidepressiva-absetzen-ohne-entzug" class="magazine-card scroll-animate-card">
            <div class="magazine-card-image" style="background: linear-gradient(135deg, #FBCFE8 0%, #F9A8D4 100%);"></div>
            <div class="magazine-card-content">
              <span class="magazine-card-category" style="background: #FCE7F3; color: #BE185D;">Mentale Gesundheit</span>
              <h3 class="magazine-card-title">Antidepressiva absetzen: Der sanfte Weg ohne Entzug</h3>
              <p class="magazine-card-excerpt">
                Du willst absetzen, hast aber Angst vor dem "Loch" danach? Erfahre, wie du "Brain Zaps" und Stimmungstiefs mit einem 8-Wochen-Plan vermeidest.
              </p>
              <span class="magazine-card-link">
                Artikel lesen
                <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          
          <!-- Article 5: Schlaftabletten loswerden -->
          <a href="/magazin/schlaftabletten-loswerden" class="magazine-card scroll-animate-card">
            <div class="magazine-card-image" style="background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%);"></div>
            <div class="magazine-card-content">
              <span class="magazine-card-category" style="background: #E0E7FF; color: #3730A3;">Schlaf & Erholung</span>
              <h3 class="magazine-card-title">Schlaftabletten loswerden: Endlich wieder natürlich einschlafen</h3>
              <p class="magazine-card-excerpt">
                Jede Nacht dasselbe Spiel: Ohne Tablette keine Ruhe. Erfahre, wie du die Abhängigkeit durchbrichst und deinem Körper den natürlichen Schlaf zurückgibst.
              </p>
              <span class="magazine-card-link">
                Artikel lesen
                <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          
          <!-- Article 6: CBD Studien und Fakten -->
          <a href="/magazin/cbd-studien-und-fakten" class="magazine-card scroll-animate-card">
            <div class="magazine-card-image" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);"></div>
            <div class="magazine-card-content">
              <span class="magazine-card-category" style="background: #D1FAE5; color: #065F46;">Wissenschaft & Fakten</span>
              <h3 class="magazine-card-title">CBD bei Medikamentenreduktion: Was die Wissenschaft wirklich sagt</h3>
              <p class="magazine-card-excerpt">
                Überall hörst du: "CBD ist das neue Wundermittel". Doch was stimmt davon? Wir checken die aktuelle Studienlage (2025) und klären über Risiken auf.
              </p>
              <span class="magazine-card-link">
                Artikel lesen
                <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          
          <!-- Article 7: Magenschutz (PPI) absetzen -->
          <a href="/magazin/magenschutz-absetzen-ppi" class="magazine-card scroll-animate-card">
            <div class="magazine-card-image" style="background: linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%);"></div>
            <div class="magazine-card-content">
              <span class="magazine-card-category" style="background: #FED7AA; color: #9A3412;">Magen & Verdauung</span>
              <h3 class="magazine-card-title">Die Säure-Falle: Warum "Magenschutz" oft das Gegenteil bewirkt</h3>
              <p class="magazine-card-excerpt">
                Eigentlich wolltest du deinen Magen nur schützen. Jetzt kommst du nicht mehr los, weil das Sodbrennen sofort zurückkehrt? Wir zeigen dir den Ausweg.
              </p>
              <span class="magazine-card-link">
                Artikel lesen
                <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </a>
          
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         RESULTS CONTAINER (außerhalb sections für Print-Mode)
         ============================================================ -->
    <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 2rem;">
      <div id="results" class="hidden" style="margin-top: 2rem;"></div>
    </div>
    
  </main>
  
  <!-- Section Divider -->
  <div style="padding: 40px 0;">
    <hr class="section-divider">
  </div>
  
  <!-- ============================================================
       FOOTER
       ============================================================ -->
  <footer id="kontakt" class="scroll-animate">
    <div class="container">
      
      <div class="footer-content">
        
        <!-- Branding -->
        <div class="footer-branding">
          <h3>MEDLESS</h3>
          <p class="tagline">Dein Weg zu weniger Medikamenten – individuell, sicher und wissenschaftlich begleitet.</p>
          <p style="margin-top: var(--space-3); font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.8);">
            MedLess bietet KI-gestützte Ausschleichpläne auf Basis von Cannabinoiden und deinem Endocannabinoid-System – als Gesprächsgrundlage für ärztlich begleitete Entscheidungen.
          </p>
          <p style="margin-top: var(--space-3); font-size: 14px; color: var(--text-muted);">
            Eine Marke der CBD-Vertriebskompetenz GmbH
          </p>
        </div>
        
        <!-- Legal -->
        <div class="footer-section">
          <h4>Rechtliches</h4>
          <ul class="footer-links">
            <li><a href="/impressum">Impressum</a></li>
            <li><a href="/datenschutz">Datenschutz</a></li>
            <li><a href="/agb">AGB</a></li>
          </ul>
        </div>
        
        <!-- Contact -->
        <div class="footer-section">
          <h4>Kontakt</h4>
          <ul class="footer-links">
            <li><a href="mailto:hallo@medless.care">hallo@medless.care</a></li>
            <li><a href="tel:+43316931288">+43 316 / 931 288</a></li>
          </ul>
        </div>
        
      </div>
      
      <!-- Disclaimer -->
      <div class="footer-disclaimer">
        <p>
          <strong><i class="fas fa-exclamation-triangle"></i> Wichtiger medizinischer Haftungsausschluss:</strong>
        </p>
        <p>
          Medless ist ein KI-gestütztes Informationstool und kein Ersatz für ärztlichen Rat, 
          Diagnose oder Behandlung. Alle Berechnungen basieren auf wissenschaftlichen 
          Studien und pharmakologischen Daten, ersetzen jedoch keine individuelle 
          medizinische Beurteilung.
        </p>
        <p>
          <strong>Ändern Sie niemals eigenständig Ihre Medikation.</strong> 
          Jede Anpassung muss mit Ihrem behandelnden Arzt besprochen und überwacht werden.
        </p>
      </div>
      
      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="footer-copyright">
          © 2025 MEDLESS. Alle Rechte vorbehalten.
        </div>
        <div class="footer-social">
          <a href="#" aria-label="Instagram">
            <i class="fab fa-instagram"></i>
          </a>
          <a href="#" aria-label="Facebook">
            <i class="fab fa-facebook"></i>
          </a>
          <a href="#" aria-label="Twitter">
            <i class="fab fa-twitter"></i>
          </a>
        </div>
      </div>
      
    </div>
  </footer>
  
  <!-- Scroll to Top Button -->
  <button class="scroll-to-top" id="scrollToTopBtn" onclick="scrollToTop()">
    <i class="fas fa-arrow-up"></i>
  </button>
  
  <!-- Navigation Functions -->
  <script>
    // ============================================================
    // SCROLL SPY - Active Navigation Highlighting
    // ============================================================
    
    document.addEventListener('DOMContentLoaded', function() {
      const sections = document.querySelectorAll('section[id], footer[id]');
      const navLinks = document.querySelectorAll('.header-nav a');
      
      // Intersection Observer for scroll spy
      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -75% 0px', // Trigger when section is 20% from top
        threshold: 0
      };
      
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            
            // Remove active class from all nav links
            navLinks.forEach(link => {
              link.classList.remove('active');
            });
            
            // Add active class to corresponding nav link
            const activeLink = document.querySelector('.header-nav a[href="#' + sectionId + '"]');
            if (activeLink) {
              activeLink.classList.add('active');
            }
          }
        });
      }, observerOptions);
      
      // Observe all sections
      sections.forEach(section => {
        observer.observe(section);
      });
      
      // Handle clicks on nav links
      navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('href').substring(1);
          const targetSection = document.getElementById(targetId);
          
          if (targetSection) {
            targetSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });
    });
    
    // ============================================================
    // Multi-step form navigation
    // ============================================================
    
    let currentStep = 1;
    const totalSteps = 5;
    
    function nextStep(step) {
      // Validate current step before proceeding
      if (!validateStep(currentStep)) {
        return;
      }
      
      // Hide current step
      document.getElementById('step-' + currentStep).classList.remove('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-circle').classList.remove('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-circle').classList.add('completed');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-label').classList.remove('active');
      
      // Show next step
      currentStep = step;
      document.getElementById('step-' + currentStep).classList.add('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-circle').classList.add('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-label').classList.add('active');
      
      // Update progress bar
      const progressPercent = (currentStep / totalSteps) * 100;
      document.getElementById('progress-fill').style.width = progressPercent + '%';
      
      // Scroll to top of form
      document.querySelector('.progress-bar-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function previousStep(step) {
      // Hide current step
      document.getElementById('step-' + currentStep).classList.remove('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-circle').classList.remove('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-label').classList.remove('active');
      
      // Show previous step
      currentStep = step;
      document.getElementById('step-' + currentStep).classList.add('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-circle').classList.add('active');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-circle').classList.remove('completed');
      document.querySelector('.progress-step[data-step="' + currentStep + '"] .progress-label').classList.add('active');
      
      // Update progress bar
      const progressPercent = (currentStep / totalSteps) * 100;
      document.getElementById('progress-fill').style.width = progressPercent + '%';
      
      // Scroll to top of form
      document.querySelector('.progress-bar-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function validateStep(step) {
      const stepElement = document.getElementById('step-' + step);
      if (!stepElement) return true;
      
      // Check text/email/number inputs
      const textInputs = stepElement.querySelectorAll('input[type="text"][required], input[type="email"][required], input[type="number"][required]');
      for (const input of textInputs) {
        if (!input.value || input.value.trim() === '') {
          alert('Bitte füllen Sie alle Pflichtfelder aus.');
          input.focus();
          return false;
        }
      }
      
      // Check select dropdowns
      const selects = stepElement.querySelectorAll('select[required]');
      for (const select of selects) {
        if (!select.value || select.value === '') {
          alert('Bitte wählen Sie eine Option aus.');
          select.focus();
          return false;
        }
      }
      
      // Check radio buttons (group by name)
      const radioGroups = {};
      const radios = stepElement.querySelectorAll('input[type="radio"][required]');
      for (const radio of radios) {
        if (!radioGroups[radio.name]) {
          radioGroups[radio.name] = true;
          const checked = stepElement.querySelector('input[name="' + radio.name + '"]:checked');
          if (!checked) {
            alert('Bitte wählen Sie eine Option aus.');
            return false;
          }
        }
      }
      
      return true;
    }
    
    // FAQ Accordion functionality
    function toggleFAQ(button) {
      const faqItem = button.closest('.faq-item');
      const isActive = faqItem.classList.contains('active');
      
      // Close all other FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
          item.classList.remove('active');
        }
      });
      
      // Toggle current FAQ item
      if (isActive) {
        faqItem.classList.remove('active');
      } else {
        faqItem.classList.add('active');
      }
    }
    
    // Scroll to top functionality
    function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    // Show/hide scroll to top button based on scroll position
    window.addEventListener('scroll', function() {
      const scrollToTopBtn = document.getElementById('scrollToTopBtn');
      if (scrollToTopBtn && window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
      } else if (scrollToTopBtn) {
        scrollToTopBtn.classList.remove('visible');
      }
    });
    
    // ============================================================
    // SCROLL ANIMATIONS - Dezent, medizinisch-seriös
    // ============================================================
    
    // Intersection Observer Setup (Performance-optimiert)
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Optional: Observer nach Animation deaktivieren für Performance
          // scrollObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,        // Trigger bei 10% Sichtbarkeit
      rootMargin: '0px 0px -50px 0px'  // Start etwas früher
    });
    
    // Initialisiere Animationen beim Laden der Seite
    function initScrollAnimations() {
      // Alle Elemente mit .scroll-animate oder .scroll-animate-card animieren
      const animateElements = document.querySelectorAll('.scroll-animate, .scroll-animate-card');
      
      animateElements.forEach(element => {
        scrollObserver.observe(element);
      });
    }
    
    // Starte Animationen nach DOM-Load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
      // DOM bereits geladen
      initScrollAnimations();
    }
  </script>
  
  <!-- Main Application Logic -->
  <script src="/static/app.js"></script>
  
</body>
</html>
  `)
})

// Refactored design demo route
app.get('/demo', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MEDLESS – Refactored Design Demo</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
:root{--space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:24px;--space-6:32px;--space-7:48px;--space-8:64px;--space-9:96px;--primary-dark-green:#0C5C4C;--primary-green:#0F7A67;--accent-mint:#CFF1E7;--accent-mint-light:#E8F8F4;--gray-50:#F9FAFB;--gray-100:#F3F4F6;--gray-200:#E5E7EB;--gray-300:#D1D5DB;--gray-400:#9CA3AF;--gray-500:#6B7280;--gray-600:#4B5563;--gray-700:#374151;--gray-800:#1F2937;--gray-900:#111827;--background:#FFFFFF;--background-subtle:var(--gray-50);--text-primary:var(--gray-900);--text-secondary:var(--gray-600);--text-muted:var(--gray-500);--border:var(--gray-200);--border-subtle:var(--gray-100);--brand-500:var(--primary-green);--brand-600:var(--primary-dark-green);--font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;--radius-md:12px;--shadow-md:0 1px 2px rgba(0,0,0,0.05),0 8px 24px rgba(0,0,0,0.06)}*{margin:0;padding:0;box-sizing:border-box}body{font-family:var(--font-family);font-size:16px;line-height:1.6;color:var(--text-primary);background:var(--background);-webkit-font-smoothing:antialiased}h1{font-size:clamp(2rem,1.2rem + 2.5vw,3rem);font-weight:700;line-height:1.15;letter-spacing:-0.01em;color:var(--brand-600);margin-bottom:var(--space-5)}h2{font-size:clamp(1.75rem,1.1rem + 1.6vw,2.25rem);font-weight:700;line-height:1.2;color:var(--brand-600);margin-bottom:var(--space-4)}h3{font-size:clamp(1.375rem,1.05rem + 0.6vw,1.5rem);font-weight:600;line-height:1.3;color:var(--gray-900);margin-bottom:var(--space-3)}.container{max-width:1200px;margin:0 auto;padding:0 var(--space-4)}section{padding:var(--space-8) 0}.hero{background:linear-gradient(180deg,var(--gray-50) 0%,var(--background) 100%);padding:var(--space-9) 0 var(--space-8)}.lead{font-size:18px;line-height:1.7;color:var(--text-secondary);max-width:60ch;margin-bottom:var(--space-6)}.check-list{list-style:none;display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-6)}.check-list li{display:flex;align-items:flex-start;gap:var(--space-3);font-size:16px;line-height:1.6;color:var(--text-secondary)}.check-list li i{color:var(--brand-500);font-size:20px;min-width:20px;margin-top:2px}.cta-primary{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-6);height:48px;font-size:16px;font-weight:600;color:white;background:linear-gradient(135deg,var(--brand-600),var(--brand-500));border:none;border-radius:var(--radius-md);cursor:pointer;text-decoration:none;transition:all .2s ease;box-shadow:var(--shadow-md)}.cta-primary:hover{transform:translateY(-1px)}.section-header{text-align:center;margin-bottom:var(--space-7)}.card{background:var(--background);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:var(--space-6);box-shadow:var(--shadow-md)}.card-icon-badge{width:48px;height:48px;background:var(--gray-100);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-4)}.card-icon-badge i{font-size:24px;color:var(--brand-600)}.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-5)}@media (min-width:768px){.card-grid{grid-template-columns:repeat(3,1fr)}}.bg-subtle{background:var(--background-subtle)}
  </style>
</head>
<body>
  <section class="hero">
    <div class="container">
      <h1>Dein Weg zu weniger Medikamenten – mit CBD-Unterstützung</h1>
      <p class="lead">MEDLESS berechnet dir einen individualisierten Plan zur schrittweisen Medikamenten-Reduktion mit personalisierter CBD-Kompensation – wissenschaftsbasiert und unter ärztlicher Aufsicht.</p>
      <ul class="check-list">
        <li><i class="fas fa-check-circle"></i><span>Algorithmusbasierte Dosierungsberechnung</span></li>
        <li><i class="fas fa-check-circle"></i><span>52 Medikamente mit CBD-Interaktionsdaten</span></li>
        <li><i class="fas fa-check-circle"></i><span>Wochenplan mit MEDLESS-Produktempfehlung</span></li>
      </ul>
      <a href="/" class="cta-primary"><span>Zur Haupt-App</span><i class="fas fa-arrow-right"></i></a>
    </div>
  </section>
  <section class="bg-subtle">
    <div class="container">
      <div class="section-header">
        <h2>Refactored Design Demo</h2>
        <p class="lead">Medizinisch-professionelles Design gemäß Design-System-Guidelines</p>
      </div>
      <div class="card-grid">
        <div class="card">
          <div class="card-icon-badge"><i class="fas fa-palette"></i></div>
          <h3>Inter Typography</h3>
          <p>Responsive Typo-Skala mit clamp() – H1 skaliert von 32-48px</p>
        </div>
        <div class="card">
          <div class="card-icon-badge"><i class="fas fa-ruler"></i></div>
          <h3>8px Grid</h3>
          <p>Konsistente Abstände mit CSS Custom Properties (--space-1 bis --space-9)</p>
        </div>
        <div class="card">
          <div class="card-icon-badge"><i class="fas fa-shield-alt"></i></div>
          <h3>A11y Ready</h3>
          <p>4.5:1 Kontrast, focus-visible Outlines, semantisches HTML</p>
        </div>
      </div>
    </div>
  </section>
</body>
</html>`)
})

// Impressum page
app.get('/impressum', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Impressum – MEDLESS</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap&subset=latin-ext" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    ${getSharedStyles()}
    .legal-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
    .legal-page h1 {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      margin-bottom: var(--space-6);
    }
    .legal-page h2 {
      font-size: clamp(1.5rem, 1.2rem + 0.8vw, 1.75rem);
      margin-top: var(--space-6);
      margin-bottom: var(--space-4);
    }
    .legal-page p {
      margin-bottom: var(--space-4);
      line-height: 1.7;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--primary-dark-green);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: var(--space-6);
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="legal-page">
    <a href="/" class="back-link">
      <i class="fas fa-arrow-left"></i>
      Zurück zur Startseite
    </a>
    
    <h1>Impressum</h1>
    
    <h2>Angaben gemäß § 5 TMG</h2>
    <p>
      <strong>medless</strong> ist eine Marke der<br>
      <strong>CBD-Vertriebskompetenz GmbH</strong><br>
      Asperngasse 4<br>
      8020 Graz<br>
      Österreich
    </p>
    
    <h2>Kontakt</h2>
    <p>
      Telefon: <a href="tel:+43316931288">+43 316 / 931 288</a><br>
      Fax: 0810/955402-5355<br>
      E-Mail: <a href="mailto:hallo@medless.care">hallo@medless.care</a>
    </p>
    
    <h2>Registereintrag</h2>
    <p>
      UID-Nummer: ATU72762156
    </p>
    
    <h2>Haftungsausschluss</h2>
    <p>
      <strong>Medizinischer Hinweis:</strong> MEDLESS ist ein KI-gestütztes Informationstool und kein Ersatz für ärztlichen Rat, Diagnose oder Behandlung. Alle Berechnungen basieren auf wissenschaftlichen Studien und pharmakologischen Daten, ersetzen jedoch keine individuelle medizinische Beurteilung.
    </p>
    <p>
      <strong>Ändern Sie niemals eigenständig Ihre Medikation.</strong> Jede Anpassung muss mit Ihrem behandelnden Arzt besprochen und überwacht werden.
    </p>
  </div>
</body>
</html>
  `)
})

// Datenschutz page
app.get('/datenschutz', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Datenschutzerklärung – MEDLESS</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap&subset=latin-ext" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    ${getSharedStyles()}
    .legal-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
    .legal-page h1 {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      margin-bottom: var(--space-6);
    }
    .legal-page h2 {
      font-size: clamp(1.5rem, 1.2rem + 0.8vw, 1.75rem);
      margin-top: var(--space-6);
      margin-bottom: var(--space-4);
    }
    .legal-page h3 {
      font-size: clamp(1.25rem, 1rem + 0.5vw, 1.4rem);
      margin-top: var(--space-5);
      margin-bottom: var(--space-3);
    }
    .legal-page p, .legal-page li {
      margin-bottom: var(--space-3);
      line-height: 1.7;
    }
    .legal-page ul {
      padding-left: var(--space-5);
      margin-bottom: var(--space-4);
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--primary-dark-green);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: var(--space-6);
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="legal-page">
    <a href="/" class="back-link">
      <i class="fas fa-arrow-left"></i>
      Zurück zur Startseite
    </a>
    
    <h1>Datenschutzerklärung</h1>
    
    <p>
      Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
    </p>
    
    <h2>Datenerfassung auf dieser Website</h2>
    
    <h3>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h3>
    <p>
      Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber (siehe Impressum).
    </p>
    
    <h3>Wie erfassen wir Ihre Daten?</h3>
    <p>
      Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
    </p>
    
    <h3>Wofür nutzen wir Ihre Daten?</h3>
    <p>
      Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
    </p>
    
    <h3>Welche Rechte haben Sie bezüglich Ihrer Daten?</h3>
    <p>Sie haben als Betroffener folgende Rechte:</p>
    <ul>
      <li>gemäß Art. 15 DSGVO das Recht, in dem dort bezeichneten Umfang Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 16 DSGVO das Recht, unverzüglich die Berichtigung unrichtiger oder Vervollständigung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 17 DSGVO das Recht, die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 18 DSGVO das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen;</li>
      <li>gemäß Art. 20 DSGVO das Recht, Ihre personenbezogenen Daten, die Sie uns bereitgestellt haben, in einem strukturierten, gängigen und maschinenlesebaren Format zu erhalten;</li>
      <li>gemäß Art. 77 DSGVO das Recht, sich bei einer Aufsichtsbehörde zu beschweren.</li>
    </ul>
    
    <h2>Hosting</h2>
    <p>
      Diese Website wird bei einem externen Dienstleister gehostet (Cloudflare Pages). Personenbezogene Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Webseitenzugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
    </p>
    <p>
      Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
    </p>
    
    <h2>Cookies</h2>
    <p>
      Diese Website benutzt Cookies um eine optimale Erfahrung zu gewährleisten. Diese Cookies werden auf Ihrem Endgerät abgelegt.
    </p>
    
    <h3>Unbedingt nötige Cookies</h3>
    <p>
      Diese Cookies sind unerlässlich, um ein Funktionieren der Website zu ermöglichen. Diese Cookies sind nur zuständig, um Aktionen wie Sprache, Währung, Login Session und andere Cookie-Einstellungen zu ermöglichen. Sie können diese Cookies in Ihrem Browser deaktivieren, dadurch funktioniert unsere Webseite allerdings nicht mehr korrekt.
    </p>
    
    <h3>Analyse & Statistik</h3>
    <p>
      Diese Cookies ermöglichen es uns, statistische Erhebungen durchzuführen, wie z.B. wie viele Besucher sich gerade auf unserer Website befinden und von wo diese kommen. Das hilft uns zu verstehen, welche Produkte populärer sind als andere.
    </p>
    
    <h3>Marketing</h3>
    <p>
      Diese Cookies werden im Regelfall von unseren Werbepartnern benutzt. Sie werden verwendet, um von unseren Website-Benutzern ein Interessensprofil zu erstellen, um personalisierte Werbung zu schalten. Wenn Sie diesen Cookies nicht zustimmen, werden Sie keine persönlich auf Sie zugeschnittene Werbung erhalten.
    </p>
    
    <h2>Kontakt</h2>
    <p>
      Bei Fragen zum Datenschutz kontaktieren Sie uns bitte:<br>
      Telefon: <a href="tel:+43316931288">+43 316 / 931 288</a><br>
      Fax: 0810/955402-5355<br>
      E-Mail: <a href="mailto:hallo@medless.care">hallo@medless.care</a>
    </p>
  </div>
</body>
</html>
  `)
})

// AGB page  
app.get('/agb', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AGB – MEDLESS</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap&subset=latin-ext" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    ${getSharedStyles()}
    .legal-page {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
    .legal-page h1 {
      font-size: clamp(2rem, 1.5rem + 1.5vw, 2.5rem);
      margin-bottom: var(--space-6);
    }
    .legal-page h2 {
      font-size: clamp(1.5rem, 1.2rem + 0.8vw, 1.75rem);
      margin-top: var(--space-6);
      margin-bottom: var(--space-4);
    }
    .legal-page p {
      margin-bottom: var(--space-4);
      line-height: 1.7;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--primary-dark-green);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: var(--space-6);
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="legal-page">
    <a href="/" class="back-link">
      <i class="fas fa-arrow-left"></i>
      Zurück zur Startseite
    </a>
    
    <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
    
    <h2>I. Geltung</h2>
    <p>
      Die Lieferungen, Leistungen und Angebote unseres Unternehmens erfolgen ausschließlich aufgrund dieser AGB, und zwar unabhängig von der Art des Rechtsgeschäftes. Sämtliche unserer privatrechtlichen Willenserklärungen sind auf Grundlage dieser AGB zu verstehen. Entgegenstehende oder von unseren AGB abweichende Bedingungen des Kunden erkennen wir nicht an, es sei denn, wir hätten schriftlich und ausdrücklich ihrer Geltung zugestimmt.
    </p>
    
    <h2>II. Vertragsabschluss</h2>
    <p>
      <strong>a)</strong> Unsere Angebote verstehen sich unverbindlich und freibleibend. Von diesen AGB oder anderen unserer schriftlichen Willenserklärungen abweichende mündliche Zusagen, Nebenabreden und dergleichen, insbesondere solche, die von Verkäufern, Zustellern, etc. abgegeben werden, sind für uns nicht verbindlich.
    </p>
    <p>
      <strong>b)</strong> Jeder Auftrag bedarf zum Vertragsabschluss einer Auftragsbestätigung. Das Absenden oder Übergeben der vom Kunden bestellten Ware bewirkt ebenfalls den Vertragsabschluss.
    </p>
    
    <h2>III. Preis</h2>
    <p>
      Alle von uns genannten Preise sind, sofern nichts anderes ausdrücklich vermerkt ist, exklusive Umsatzsteuer zu verstehen. Sollten sich die Lohnkosten zwischen Vertragsabschluss und Lieferung aufgrund kollektivvertraglicher Regelungen in der Branche oder innerbetrieblicher Abschlüsse oder sollten sich andere, für die Kalkulation relevante Kostenstellen verändern, so sind wir berechtigt, die Preise entsprechend zu erhöhen oder zu ermäßigen.
    </p>
    
    <h2>IV. Zahlungsbedingungen, Verzugszinsen</h2>
    <p>
      <strong>a)</strong> Mangels gegenteiliger Vereinbarung sind unsere Forderungen Zug um Zug gegen Übergabe der Ware bar zu bezahlen. Unsere Rechnungen sind ab Warenübernahme zur Zahlung fällig.
    </p>
    <p>
      <strong>b)</strong> Eine Verzinsung von Voraus- oder Akontozahlungen findet nicht statt.
    </p>
    <p>
      <strong>c)</strong> Für den Fall des Zahlungsverzuges sind wir ab Fälligkeit berechtigt, Verzugszinsen in Höhe von 12% per anno zu verrechnen.
    </p>
    
    <h2>X. Erfüllungsort</h2>
    <p>
      Erfüllungsort ist der Sitz unseres Unternehmens in 8020 Graz, Asperngasse 4.
    </p>
    
    <h2>XVIII. Rechtswahl, Gerichtsstand</h2>
    <p>
      Es gilt österreichisches Recht. Die Anwendbarkeit des UN-Kaufrechtes wird ausdrücklich ausgeschlossen. Die Vertragssprache ist deutsch. Zur Entscheidung aller aus diesem Vertrag entstehenden Streitigkeiten ist das sachlich zuständige Gericht für 8020 Graz ausschließlich örtlich zuständig.
    </p>
    
    <h2>XIX. Datenschutz</h2>
    <p>
      Der Kunde erteilt seine Zustimmung, dass auch die im Kaufvertrag mit enthaltenen personenbezogenen Daten in Erfüllung dieses Vertrages von uns automationsunterstützt gespeichert und verarbeitet werden.
    </p>
    
    <p style="margin-top: var(--space-6); padding-top: var(--space-6); border-top: 1px solid var(--border-light); font-size: 14px; color: var(--text-muted);">
      Stand: Januar 2025<br>
      CBD-Vertriebskompetenz GmbH<br>
      Asperngasse 4, 8020 Graz
    </p>
  </div>
</body>
</html>
  `)
})

// Helper function to get shared styles
function getSharedStyles() {
  return `
    :root {
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 24px;
      --space-6: 32px;
      --space-7: 48px;
      --space-8: 64px;
      --space-9: 96px;
      --primary-dark-green: #0C5C4C;
      --primary-green: #0F7A67;
      --accent-mint: #CFF1E7;
      --accent-mint-light: #E8F8F4;
      --gray-50: #F9FAFB;
      --gray-100: #F3F4F6;
      --gray-200: #E5E7EB;
      --gray-300: #D1D5DB;
      --gray-400: #9CA3AF;
      --gray-500: #6B7280;
      --gray-600: #4B5563;
      --gray-700: #374151;
      --gray-800: #1F2937;
      --gray-900: #111827;
      --background-white: #FFFFFF;
      --background-ultra-light: #F9FAFB;
      --text-body-color: #374151;
      --text-muted: #6B7280;
      --border-light: #E5E7EB;
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--font-family);
      font-size: 16px;
      line-height: 1.6;
      color: var(--text-body-color);
      background: var(--background-white);
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: var(--primary-dark-green);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `
}

export default app
