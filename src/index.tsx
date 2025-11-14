import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// KANNASAN Product Data - CBD Dosier-Sprays (FIXED VALUES - DO NOT CHANGE)
const KANNASAN_PRODUCTS = [
  { nr: 5,  cbdPerSpray: 5.8,  name: 'Kannasan Nr. 5',  price: 24.90 },
  { nr: 10, cbdPerSpray: 11.5, name: 'Kannasan Nr. 10', price: 39.90 },
  { nr: 15, cbdPerSpray: 17.5, name: 'Kannasan Nr. 15', price: 59.90 },
  { nr: 20, cbdPerSpray: 23.2, name: 'Kannasan Nr. 20', price: 79.90 },
  { nr: 25, cbdPerSpray: 29.0, name: 'Kannasan Nr. 25', price: 99.90 }
];

const BOTTLE_CAPACITY = 100; // Sprays per 10ml bottle (FIXED - 100 sprays = 10ml)

// ReduMed-AI: Select optimal product with minimal sprays, no overdose, max 6 sprays per time
function selectOptimalProduct(targetDailyMg: number) {
  let bestProduct = KANNASAN_PRODUCTS[0];
  let bestSprayCount = 999;
  
  for (const product of KANNASAN_PRODUCTS) {
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

// ReduMed-AI: Generate weekly plan with bottle tracking - NO unnecessary product changes!
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

// ReduMed-AI: Calculate total costs for the entire plan
function calculatePlanCosts(weeklyPlan: any[]) {
  const bottleUsage: { [key: string]: { count: number; product: any; totalSprays: number; weeks: number[] } } = {};
  
  let currentProduct: any = null;
  let currentBottleNumber = 0;
  let bottleRemaining = 0;
  
  weeklyPlan.forEach((week) => {
    const product = week.kannasanProduct;
    const spraysThisWeek = week.totalSprays * 7;
    const productKey = `Kannasan Nr. ${product.nr}`;
    
    // Check if product changed or bottle empty
    if (!currentProduct || currentProduct.nr !== product.nr || bottleRemaining < spraysThisWeek) {
      // New bottle needed
      currentBottleNumber++;
      bottleRemaining = BOTTLE_CAPACITY;
      currentProduct = product;
      
      if (!bottleUsage[productKey]) {
        bottleUsage[productKey] = {
          count: 0,
          product: KANNASAN_PRODUCTS.find(p => p.nr === product.nr),
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

// Get all medications
app.get('/api/medications', async (c) => {
  const { env } = c;
  try {
    const result = await env.DB.prepare(`
      SELECT m.*, mc.name as category_name, mc.risk_level
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
      SELECT m.*, mc.name as category_name, mc.risk_level
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
    
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
      bsa = Math.round(Math.sqrt((height * weight) / 3600) * 100) / 100;
    }
    
    // Analyze each medication for interactions
    const analysisResults = [];
    let maxSeverity = 'low';
    
    for (const med of medications) {
      const medResult = await env.DB.prepare(`
        SELECT m.*, mc.risk_level
        FROM medications m
        LEFT JOIN medication_categories mc ON m.category_id = mc.id
        WHERE m.name LIKE ? OR m.generic_name LIKE ?
        LIMIT 1
      `).bind(`%${med.name}%`, `%${med.name}%`).first();
      
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
      
      // Calculate medication doses for this week
      const weekMedications = medications.map((med: any) => {
        const startMg = med.mgPerDay;
        const targetMg = startMg * (1 - reductionGoal / 100);
        const weeklyReduction = (startMg - targetMg) / durationWeeks;
        const currentMg = startMg - (weeklyReduction * (week - 1));
        
        return {
          name: med.name,
          startMg: Math.round(startMg * 10) / 10,
          currentMg: Math.round(currentMg * 10) / 10,
          targetMg: Math.round(targetMg * 10) / 10,
          reduction: Math.round(weeklyReduction * 10) / 10,
          reductionPercent: Math.round(((startMg - currentMg) / startMg) * 100)
        };
      });
      
      // Calculate total medication load
      const totalMedicationLoad = weekMedications.reduce((sum: number, med: any) => sum + med.currentMg, 0);
      
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
        bottleStatus: cbdWeek.bottleStatus
      };
    });
    
    // Get first week's KANNASAN product for product info box
    const firstWeekKannasan = weeklyPlan[0];
    
    // Calculate total costs for the plan
    const costAnalysis = calculatePlanCosts(weeklyPlan);
    
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
        name: firstWeekKannasan.kannasanProduct.name,
        nr: firstWeekKannasan.kannasanProduct.nr,
        type: 'CBD Dosier-Spray',
        packaging: '10ml Flasche mit Pumpsprühaufsatz',
        concentration: `${firstWeekKannasan.kannasanProduct.cbdPerSpray} mg CBD pro Sprühstoß`,
        cbdPerSpray: firstWeekKannasan.kannasanProduct.cbdPerSpray,
        twoSprays: `${firstWeekKannasan.kannasanProduct.cbdPerSpray * 2} mg CBD bei 2 Sprühstößen`,
        dosageUnit: 'Sprühstöße',
        totalSpraysPerDay: firstWeekKannasan.totalSprays,
        morningSprays: firstWeekKannasan.morningSprays,
        eveningSprays: firstWeekKannasan.eveningSprays,
        actualDailyMg: firstWeekKannasan.actualCbdMg,
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
        cbdStartMg: Math.round(cbdStartMg * 10) / 10,
        cbdEndMg: Math.round(cbdEndMg * 10) / 10,
        hasBenzoOrOpioid,
        notes: adjustmentNotes
      },
      warnings: maxSeverity === 'critical' || maxSeverity === 'high' ? 
        ['⚠️ Kritische Wechselwirkungen erkannt!', 'Konsultieren Sie unbedingt einen Arzt vor der Cannabinoid-Einnahme.'] : []
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return c.json({ success: false, error: error.message || 'Fehler bei der Analyse' }, 500);
  }
})

// Main Route: Homepage
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ReDuMed – reduziere deine Medikamente</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- jsPDF for PDF Generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <!-- Axios for API calls -->
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  
  <!-- html2canvas for PDF generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

  <style>
    /* ============================================================
       DESIGN SYSTEM - ReDuMed
       ============================================================ */
    
    :root {
      /* Colors */
      --primary-dark-green: #0C5C4C;
      --primary-green: #0F7A67;
      --accent-mint: #CFF1E7;
      --accent-mint-light: #E8F8F4;
      --background-ultra-light: #F7FAF9;
      --background-white: #FFFFFF;
      --text-primary: #1A1A1A;
      --text-secondary: #4A5568;
      --text-muted: #718096;
      --border-light: #E2E8F0;
      
      /* Border Radius */
      --radius-small: 8px;
      --radius-medium: 16px;
      --radius-large: 24px;
      --radius-full: 9999px;
      
      /* Shadows */
      --shadow-soft: 0 2px 8px -2px rgba(12, 92, 76, 0.08);
      --shadow-medium: 0 8px 20px -4px rgba(12, 92, 76, 0.12);
      --shadow-large: 0 20px 25px -5px rgba(12, 92, 76, 0.1);
      
      /* Typography */
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    /* ============================================================
       GLOBAL STYLES
       ============================================================ */
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      scroll-behavior: smooth;
    }
    
    body {
      font-family: var(--font-family);
      color: var(--text-primary);
      background: var(--background-white);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    /* ============================================================
       LOGO HEADER
       ============================================================ */
    
    .logo-header {
      background: white;
      padding: 1.5rem 0;
      box-shadow: 0 2px 8px rgba(12, 92, 76, 0.06);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.98);
    }
    
    .brand-logo {
      height: 60px;
      width: auto;
      display: block;
      object-fit: contain;
      transition: transform 0.3s ease;
    }
    
    .brand-logo:hover {
      transform: scale(1.05);
    }
    
    /* ============================================================
       HERO SECTION
       ============================================================ */
    
    .hero {
      background: linear-gradient(180deg, var(--background-ultra-light) 0%, var(--background-white) 100%);
      padding: 80px 0;
      overflow: hidden;
    }
    
    .hero-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    
    .hero-headline {
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--primary-dark-green);
      line-height: 1.1;
      margin-bottom: 1.5rem;
    }
    
    .hero-subheadline {
      font-size: 1.5rem;
      font-weight: 400;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 2rem;
    }
    
    .hero-description {
      font-size: 1.125rem;
      color: var(--text-muted);
      line-height: 1.7;
      margin-bottom: 2.5rem;
    }
    
    .hero-features {
      list-style: none;
      display: grid;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    
    .hero-features li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1rem;
      color: var(--text-secondary);
    }
    
    .checkmark-icon {
      width: 24px;
      height: 24px;
      min-width: 24px;
      color: var(--primary-green);
    }
    
    .cta-button-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white;
      font-size: 1.125rem;
      font-weight: 600;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(12, 92, 76, 0.3);
      transition: all 0.3s ease;
    }
    
    .cta-button-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(12, 92, 76, 0.4);
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
      padding: 100px 0;
    }
    
    .section-headline {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-dark-green);
      text-align: center;
      margin-bottom: 3rem;
      line-height: 1.2;
    }
    
    .section-description {
      font-size: 1.125rem;
      color: var(--text-muted);
      text-align: center;
      line-height: 1.7;
      max-width: 700px;
      margin: 0 auto 4rem;
    }
    
    /* ============================================================
       WHY REDUMED SECTION
       ============================================================ */
    
    .why-redumed {
      background: var(--background-ultra-light);
    }
    
    .explanation-card {
      background: white;
      border: 2px solid var(--accent-mint-light);
      border-radius: var(--radius-large);
      padding: 2.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-soft);
    }
    
    .card-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, var(--accent-mint), var(--accent-mint-light));
      border-radius: var(--radius-medium);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    
    .card-icon i {
      font-size: 32px;
      color: var(--primary-green);
    }
    
    .explanation-card h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary-dark-green);
      margin-bottom: 1rem;
    }
    
    .explanation-card p {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.7;
      margin-bottom: 1rem;
    }
    
    .explanation-card p:last-child {
      margin-bottom: 0;
    }
    
    .process-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2.5rem;
      margin-top: 3rem;
    }
    
    .process-card {
      background: white;
      border-radius: var(--radius-large);
      padding: 2rem;
      box-shadow: var(--shadow-medium);
      position: relative;
      transition: all 0.3s ease;
    }
    
    .process-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-large);
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
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    
    .card-icon-circle i {
      font-size: 40px;
      color: white;
    }
    
    .process-card h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-dark-green);
      text-align: center;
      margin-bottom: 1rem;
      line-height: 1.3;
    }
    
    .process-card p {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.6;
      text-align: center;
    }
    
    /* ============================================================
       HOW IT WORKS SECTION
       ============================================================ */
    
    .how-it-works {
      background: var(--background-white);
    }
    
    .steps-container {
      max-width: 700px;
      margin: 0 auto;
      position: relative;
    }
    
    .step {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 2rem;
      margin-bottom: 4rem;
      position: relative;
    }
    
    .step:last-child {
      margin-bottom: 0;
    }
    
    .step-number-circle {
      width: 64px;
      height: 64px;
      min-width: 64px;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      box-shadow: var(--shadow-medium);
      position: relative;
      z-index: 2;
    }
    
    .step-connector {
      position: absolute;
      left: 31px;
      top: 64px;
      width: 2px;
      height: calc(100% - 64px + 4rem);
      background: var(--accent-mint);
      z-index: 1;
    }
    
    .step:last-child .step-connector {
      display: none;
    }
    
    .step-content {
      padding-top: 0.5rem;
    }
    
    .step-content h4 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary-dark-green);
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }
    
    .step-content p {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    
    /* ============================================================
       SAFETY WARNING SECTION
       ============================================================ */
    
    .safety-warning {
      background: linear-gradient(135deg, #FFF5F5, #FFF9F9);
      border-top: 4px solid #DC2626;
      border-bottom: 4px solid #DC2626;
    }
    
    .warning-box {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border: 3px solid #FCA5A5;
      border-radius: var(--radius-large);
      padding: 3rem;
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.15);
    }
    
    .warning-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .warning-icon-circle {
      width: 80px;
      height: 80px;
      min-width: 80px;
      background: linear-gradient(135deg, #DC2626, #EF4444);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
    }
    
    .warning-icon-circle i {
      font-size: 40px;
      color: white;
    }
    
    .warning-title {
      font-size: 2rem;
      font-weight: 700;
      color: #DC2626;
      line-height: 1.2;
    }
    
    .warning-content {
      font-size: 1.125rem;
      color: var(--text-primary);
      line-height: 1.8;
    }
    
    .warning-content p {
      margin-bottom: 1.5rem;
    }
    
    .warning-content p:last-child {
      margin-bottom: 0;
    }
    
    .warning-content strong {
      font-weight: 700;
      color: #DC2626;
    }
    
    .warning-list {
      list-style: none;
      margin: 1.5rem 0;
      padding-left: 0;
    }
    
    .warning-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
      font-size: 1.125rem;
      color: var(--text-primary);
      line-height: 1.7;
    }
    
    .warning-list li i {
      color: #DC2626;
      font-size: 1.25rem;
      margin-top: 0.25rem;
      min-width: 20px;
    }
    
    /* ============================================================
       PLANNER SECTION
       ============================================================ */
    
    .planner-section {
      background: var(--background-ultra-light);
    }
    
    /* Progress Bar Container */
    .progress-bar-container {
      max-width: 800px;
      margin: 0 auto 4rem;
      padding: 2rem;
      background: white;
      border-radius: var(--radius-large);
      box-shadow: var(--shadow-soft);
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
      margin-top: 0.5rem;
      font-size: 0.75rem;
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
    
    .form-card {
      background: white;
      border: 2px solid var(--accent-mint-light);
      border-radius: var(--radius-large);
      padding: 2.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-soft);
    }
    
    .form-card h3 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary-dark-green);
      margin-bottom: 0.5rem;
    }
    
    .form-card .subtitle {
      font-size: 1rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
    }
    
    .form-row {
      margin-bottom: 1.5rem;
    }
    
    .form-row label {
      display: block;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    
    .form-row input[type="text"],
    .form-row input[type="email"],
    .form-row input[type="number"],
    .form-row select,
    .form-row textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      font-size: 1rem;
      font-family: var(--font-family);
      color: var(--text-primary);
      border: 2px solid var(--border-light);
      border-radius: var(--radius-small);
      background: white;
      transition: all 0.2s ease;
    }
    
    .form-row input:focus,
    .form-row select:focus,
    .form-row textarea:focus {
      outline: none;
      border-color: var(--primary-green);
      box-shadow: 0 0 0 3px rgba(15, 122, 103, 0.1);
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
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: white;
      border: 2px solid var(--border-light);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }
    
    .radio-pill input:checked + label {
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white;
      border-color: var(--primary-green);
      box-shadow: 0 4px 12px rgba(12, 92, 76, 0.2);
    }
    
    .radio-pill label:hover {
      border-color: var(--primary-green);
      transform: translateY(-1px);
    }
    
    /* Form Navigation Buttons */
    .form-navigation {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      margin-top: 2rem;
    }
    
    .btn-secondary {
      padding: 0.875rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      background: white;
      border: 2px solid var(--border-light);
      border-radius: var(--radius-small);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-secondary:hover {
      border-color: var(--primary-green);
      color: var(--primary-green);
    }
    
    .btn-primary {
      padding: 0.875rem 2.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      border: none;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(12, 92, 76, 0.2);
      transition: all 0.3s ease;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(12, 92, 76, 0.3);
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
      border: 2px solid var(--accent-mint-light);
      border-radius: var(--radius-medium);
      margin-bottom: 1rem;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .faq-item:hover {
      border-color: var(--accent-mint);
      box-shadow: var(--shadow-soft);
    }
    
    .faq-question {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--primary-dark-green);
      background: white;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    
    .faq-question:hover {
      background: var(--accent-mint-light);
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
      transition: transform 0.3s ease;
    }
    
    .faq-item.active .faq-icon {
      transform: rotate(180deg);
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white;
    }
    
    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease, padding 0.4s ease;
    }
    
    .faq-item.active .faq-answer {
      max-height: 1000px;
      padding: 0 1.5rem 1.5rem;
    }
    
    .faq-answer-content {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.7;
    }
    
    .faq-answer-content p {
      margin-bottom: 1rem;
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
    
    .scroll-to-top:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 20px rgba(12, 92, 76, 0.4);
    }
    
    /* ============================================================
       FOOTER
       ============================================================ */
    
    footer {
      background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green));
      color: white;
      padding: 4rem 0 2rem;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 3rem;
      margin-bottom: 3rem;
    }
    
    .footer-branding h3 {
      font-size: 2rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.5rem;
    }
    
    .footer-branding .tagline {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1.5rem;
    }
    
    .footer-branding p {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.7;
    }
    
    .footer-section h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      margin-bottom: 1rem;
    }
    
    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .footer-links a {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 0.95rem;
      transition: color 0.2s ease;
    }
    
    .footer-links a:hover {
      color: white;
      text-decoration: underline;
    }
    
    .footer-disclaimer {
      background: rgba(0, 0, 0, 0.2);
      border-radius: var(--radius-medium);
      padding: 1.5rem;
      margin-bottom: 2rem;
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
      padding-top: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .footer-copyright {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
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
    
    .footer-social a:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    /* ============================================================
       RESPONSIVE DESIGN
       ============================================================ */
    
    @media (max-width: 768px) {
      .hero-grid {
        grid-template-columns: 1fr;
        gap: 3rem;
      }
      
      .hero-headline {
        font-size: 2.5rem;
      }
      
      .hero-subheadline {
        font-size: 1.25rem;
      }
      
      .hero-illustration {
        height: 400px;
      }
      
      .process-cards-grid {
        grid-template-columns: 1fr;
      }
      
      .section-headline {
        font-size: 2rem;
      }
      
      section {
        padding: 60px 0;
      }
      
      /* Steps Section Mobile */
      .step {
        grid-template-columns: 48px 1fr;
        gap: 1rem;
        margin-bottom: 3rem;
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
        font-size: 1.25rem;
      }
      
      .step-content p {
        font-size: 0.95rem;
      }
      
      /* Safety Warning Mobile */
      .warning-box {
        padding: 2rem 1.5rem;
      }
      
      .warning-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .warning-icon-circle {
        width: 64px;
        height: 64px;
        min-width: 64px;
      }
      
      .warning-icon-circle i {
        font-size: 32px;
      }
      
      .warning-title {
        font-size: 1.5rem;
      }
      
      .warning-content {
        font-size: 1rem;
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
      
      .faq-item.active .faq-answer {
        padding: 0 1rem 1rem;
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
    
    /* Hidden class */
    .hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  
  <!-- Logo Header -->
  <header class="logo-header">
    <div class="container">
      <img src="/static/redumed-logo.png" alt="ReDuMed Logo" class="brand-logo" />
    </div>
  </header>
  
  <main>
    
    <!-- ============================================================
         1) HERO SECTION
         ============================================================ -->
    <section class="hero">
      <div class="container">
        <div class="hero-grid">
          
          <!-- Left: Content -->
          <div class="hero-content">
            <h1 class="hero-headline">
              ReDuMed – reduziere deine Medikamente.
            </h1>
            
            <h2 class="hero-subheadline">
              Weniger Medikamente – durch ein stärkeres Endocannabinoid-System 
              und ein intelligentes Verständnis von Wechselwirkungen.
            </h2>
            
            <p class="hero-description">
              ReDuMed analysiert Körperdaten, Medikamente und Cannabinoid-Dosierungen, 
              um einen strukturierten, sicheren und ärztlich besprechbaren 
              Reduktionsplan zu erstellen.
            </p>
            
            <ul class="hero-features">
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>berücksichtigt Körpergewicht, Alter, Medikamente</span>
              </li>
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>berechnet sichere Einschleich- & Erhaltungsphase</span>
              </li>
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>nutzt pharmakologische Wechselwirkungen sinnvoll</span>
              </li>
              <li>
                <i class="fas fa-check-circle checkmark-icon"></i>
                <span>geeignet zur ärztlichen Besprechung als PDF</span>
              </li>
            </ul>
            
            <button class="cta-button-primary" onclick="document.getElementById('planner-section').scrollIntoView({behavior:'smooth'})">
              <span>Dosierungsplan erstellen</span>
              <i class="fas fa-arrow-right arrow-icon"></i>
            </button>
          </div>
          
          <!-- Right: Medication Reduction Animation -->
          <div class="hero-illustration">
            <div class="medication-reduction-animation">
              
              <!-- Visual concept: Pills descending → Cannabinoids ascending -->
              <svg viewBox="0 0 400 500" class="reduction-visual" style="width: 100%; height: auto;">
                <defs>
                  <!-- Gradient for depth -->
                  <linearGradient id="pillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#DC2626;stop-opacity:0.8" />
                    <stop offset="100%" style="stop-color:#991B1B;stop-opacity:0.6" />
                  </linearGradient>
                  <linearGradient id="cannabinoidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#0F7A67;stop-opacity:0.9" />
                    <stop offset="100%" style="stop-color:#0C5C4C;stop-opacity:0.7" />
                  </linearGradient>
                </defs>
                
                <!-- Central Balance Line -->
                <line x1="50" y1="250" x2="350" y2="250" stroke="#E5E7EB" stroke-width="2" stroke-dasharray="5,5"/>
                <text x="200" y="240" text-anchor="middle" fill="#9CA3AF" font-size="14" font-weight="600">Balance-Punkt</text>
                
                <!-- Pills descending (animated) -->
                <g class="pill-group descending">
                  <ellipse cx="100" cy="100" rx="15" ry="30" fill="url(#pillGradient)" class="pill pill-1"/>
                  <ellipse cx="180" cy="80" rx="12" ry="25" fill="url(#pillGradient)" class="pill pill-2"/>
                  <ellipse cx="270" cy="110" rx="14" ry="28" fill="url(#pillGradient)" class="pill pill-3"/>
                  <ellipse cx="320" cy="90" rx="11" ry="23" fill="url(#pillGradient)" class="pill pill-4"/>
                  <ellipse cx="140" cy="140" rx="13" ry="26" fill="url(#pillGradient)" class="pill pill-5"/>
                  <ellipse cx="240" cy="150" rx="12" ry="24" fill="url(#pillGradient)" class="pill pill-6"/>
                </g>
                
                <!-- Cannabinoid molecules ascending (animated) -->
                <g class="cannabinoid-group ascending">
                  <!-- Molecule structure: Pentagon with bonds -->
                  <g class="molecule cannabinoid-1">
                    <circle cx="120" cy="380" r="8" fill="url(#cannabinoidGradient)"/>
                    <circle cx="135" cy="395" r="6" fill="url(#cannabinoidGradient)"/>
                    <circle cx="125" cy="410" r="7" fill="url(#cannabinoidGradient)"/>
                    <circle cx="105" cy="410" r="6" fill="url(#cannabinoidGradient)"/>
                    <circle cx="95" cy="395" r="7" fill="url(#cannabinoidGradient)"/>
                    <line x1="120" y1="380" x2="135" y2="395" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="135" y1="395" x2="125" y2="410" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="125" y1="410" x2="105" y2="410" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="105" y1="410" x2="95" y2="395" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="95" y1="395" x2="120" y2="380" stroke="#0C5C4C" stroke-width="2"/>
                  </g>
                  <g class="molecule cannabinoid-2">
                    <circle cx="280" cy="400" r="7" fill="url(#cannabinoidGradient)"/>
                    <circle cx="292" cy="413" r="6" fill="url(#cannabinoidGradient)"/>
                    <circle cx="284" cy="425" r="6" fill="url(#cannabinoidGradient)"/>
                    <circle cx="266" cy="425" r="5" fill="url(#cannabinoidGradient)"/>
                    <circle cx="258" cy="413" r="6" fill="url(#cannabinoidGradient)"/>
                    <line x1="280" y1="400" x2="292" y2="413" stroke="#0C5C4C" stroke-width="1.5"/>
                    <line x1="292" y1="413" x2="284" y2="425" stroke="#0C5C4C" stroke-width="1.5"/>
                    <line x1="284" y1="425" x2="266" y2="425" stroke="#0C5C4C" stroke-width="1.5"/>
                    <line x1="266" y1="425" x2="258" y2="413" stroke="#0C5C4C" stroke-width="1.5"/>
                    <line x1="258" y1="413" x2="280" y2="400" stroke="#0C5C4C" stroke-width="1.5"/>
                  </g>
                  <g class="molecule cannabinoid-3">
                    <circle cx="200" cy="420" r="9" fill="url(#cannabinoidGradient)"/>
                    <circle cx="217" cy="435" r="7" fill="url(#cannabinoidGradient)"/>
                    <circle cx="207" cy="450" r="7" fill="url(#cannabinoidGradient)"/>
                    <circle cx="183" cy="450" r="6" fill="url(#cannabinoidGradient)"/>
                    <circle cx="173" cy="435" r="7" fill="url(#cannabinoidGradient)"/>
                    <line x1="200" y1="420" x2="217" y2="435" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="217" y1="435" x2="207" y2="450" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="207" y1="450" x2="183" y2="450" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="183" y1="450" x2="173" y2="435" stroke="#0C5C4C" stroke-width="2"/>
                    <line x1="173" y1="435" x2="200" y2="420" stroke="#0C5C4C" stroke-width="2"/>
                  </g>
                </g>
                
                <!-- Arrows showing direction -->
                <g class="direction-indicators">
                  <path d="M 60,150 L 60,200" stroke="#DC2626" stroke-width="2" fill="none" marker-end="url(#arrowDown)"/>
                  <path d="M 340,350 L 340,300" stroke="#0F7A67" stroke-width="2" fill="none" marker-end="url(#arrowUp)"/>
                </g>
                
                <defs>
                  <marker id="arrowDown" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <path d="M 2,2 L 5,8 L 8,2" fill="none" stroke="#DC2626" stroke-width="2"/>
                  </marker>
                  <marker id="arrowUp" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                    <path d="M 2,8 L 5,2 L 8,8" fill="none" stroke="#0F7A67" stroke-width="2"/>
                  </marker>
                </defs>
                
                <!-- Labels -->
                <text x="60" y="70" text-anchor="middle" fill="#DC2626" font-size="13" font-weight="600">Medikamente ↓</text>
                <text x="340" y="470" text-anchor="middle" fill="#0F7A67" font-size="13" font-weight="600">Cannabinoide ↑</text>
              </svg>
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
    
    <!-- ============================================================
         2) WARUM ReDuMed SECTION
         ============================================================ -->
    <section class="why-redumed">
      <div class="container">
        
        <h2 class="section-headline">
          Warum ReDuMed? Weil Ihr Körper mehr kann, als Sie denken.
        </h2>
        
        <!-- ECS Explanation -->
        <div class="explanation-card ecs-card">
          <div class="card-icon">
            <i class="fas fa-project-diagram"></i>
          </div>
          <h3>Das Endocannabinoid-System (ECS)</h3>
          <p>
            Das Endocannabinoid-System (ECS) ist ein körpereigenes Regulierungssystem 
            für Schmerz, Schlaf, Immunsystem und Stressbalance. Ist es geschwächt, 
            braucht der Körper oft mehr Medikamente.
          </p>
        </div>
        
        <!-- CYP450 Explanation -->
        <div class="explanation-card cyp-card">
          <div class="card-icon">
            <i class="fas fa-microscope"></i>
          </div>
          <h3>Pharmakologische Wechselwirkungen (CYP450)</h3>
          <p>
            Rund 60 % aller gängigen Medikamente werden über dieselben Leberenzyme 
            abgebaut, an denen auch Cannabinoide wirken (CYP450-System).
          </p>
          <p>
            Diese Wechselwirkung kann dazu führen, dass bestimmte Medikamente langsamer 
            abgebaut werden und sich ihr Bedarf verringert – das passiert jedoch immer 
            individuell und muss ärztlich begleitet werden.
          </p>
        </div>
        
        <!-- Process Cards Grid -->
        <div class="process-cards-grid">
          
          <div class="process-card card-1">
            <div class="card-number">1</div>
            <div class="card-icon-circle">
              <i class="fas fa-pills"></i>
            </div>
            <h4>Hohe Medikamentenlast</h4>
            <p>
              Mehrere Medikamente täglich – Ihr Körper arbeitet auf Hochtouren, 
              das ECS ist möglicherweise geschwächt.
            </p>
          </div>
          
          <div class="process-card card-2">
            <div class="card-number">2</div>
            <div class="card-icon-circle">
              <i class="fas fa-atom"></i>
            </div>
            <h4>ECS stärken + Stoffwechsel modulieren</h4>
            <p>
              Cannabinoide unterstützen das ECS und beeinflussen den Medikamenten-Abbau 
              über Leberenzyme (CYP450).
            </p>
          </div>
          
          <div class="process-card card-3">
            <div class="card-number">3</div>
            <div class="card-icon-circle">
              <i class="fas fa-chart-line"></i>
            </div>
            <h4>Potenzial zur Reduktion</h4>
            <p>
              Stabileres ECS + modulierter Stoffwechsel können den Medikamentenbedarf 
              verringern – unter ärztlicher Kontrolle.
            </p>
          </div>
          
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         3) SO FUNKTIONIERT ReDuMed SECTION
         ============================================================ -->
    <section class="how-it-works">
      <div class="container">
        
        <h2 class="section-headline">
          So funktioniert ReDuMed
        </h2>
        
        <p class="section-description">
          In nur 5 Schritten erstellen Sie Ihren individuellen, ärztlich besprechbaren 
          Cannabinoid-Dosierungsplan – basierend auf Körperdaten, Medikamenten und 
          pharmakologischen Wechselwirkungen.
        </p>
        
        <div class="steps-container">
          
          <!-- Step 1 -->
          <div class="step">
            <div class="step-number-circle">1</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>Daten eingeben</h4>
              <p>
                Geben Sie Ihr Gewicht, Alter, Medikamente und tägliche Beschwerden ein. 
                Diese Informationen bilden die Grundlage für Ihre individuelle Berechnung.
              </p>
            </div>
          </div>
          
          <!-- Step 2 -->
          <div class="step">
            <div class="step-number-circle">2</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>Cannabinoid-Dosierung hochrechnen</h4>
              <p>
                Basierend auf Ihrem Gewicht berechnet ReDuMed die Zieldosis nach 
                evidenzbasierten Richtlinien (Studie: Blessing et al., 2015).
              </p>
            </div>
          </div>
          
          <!-- Step 3 -->
          <div class="step">
            <div class="step-number-circle">3</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>Wechselwirkungen einschätzen</h4>
              <p>
                Das System prüft, ob Ihre Medikamente über CYP450-Enzyme abgebaut werden 
                und stuft das Interaktionspotenzial ein (Hemmung/Induktion).
              </p>
            </div>
          </div>
          
          <!-- Step 4 -->
          <div class="step">
            <div class="step-number-circle">4</div>
            <div class="step-connector"></div>
            <div class="step-content">
              <h4>Medikamenten-Reduktionsplan simulieren</h4>
              <p>
                Sie erhalten einen 8-Wochen-Einschleichplan plus Erhaltungsphase. 
                Für jede Woche wird die Cannabinoid-Dosis und ein geschätztes 
                Medikamenten-Reduktionsfenster angezeigt.
              </p>
            </div>
          </div>
          
          <!-- Step 5 -->
          <div class="step">
            <div class="step-number-circle">5</div>
            <div class="step-content">
              <h4>Plan als PDF speichern</h4>
              <p>
                Laden Sie Ihren vollständigen Plan als PDF herunter und besprechen Sie 
                ihn mit Ihrem Arzt. Der Plan enthält alle Ihre Eingaben, Dosierungen, 
                Wechselwirkungen und Sicherheitshinweise.
              </p>
            </div>
          </div>
          
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         4) SAFETY WARNING SECTION
         ============================================================ -->
    <section class="safety-warning">
      <div class="container">
        
        <div class="warning-box">
          
          <div class="warning-header">
            <div class="warning-icon-circle">
              <i class="fas fa-shield-alt"></i>
            </div>
            <h2 class="warning-title">
              Wichtiger Sicherheitshinweis
            </h2>
          </div>
          
          <div class="warning-content">
            
            <p>
              <strong>ReDuMed ist kein Ersatz für eine ärztliche Beratung.</strong> 
              Dieser Rechner erstellt einen theoretischen Dosierungsplan basierend auf 
              Ihren Angaben und wissenschaftlichen Studien. Er berücksichtigt 
              pharmakologische Wechselwirkungen, ersetzt jedoch keine individuelle 
              medizinische Beurteilung.
            </p>
            
            <ul class="warning-list">
              <li>
                <i class="fas fa-exclamation-triangle"></i>
                <span>
                  <strong>Nie eigenständig Medikamente reduzieren:</strong> 
                  Jede Änderung Ihrer Medikation muss mit Ihrem behandelnden Arzt 
                  besprochen und überwacht werden.
                </span>
              </li>
              <li>
                <i class="fas fa-exclamation-triangle"></i>
                <span>
                  <strong>Wechselwirkungen sind individuell:</strong> 
                  Die tatsächliche Wirkung von Cannabinoiden auf Ihre Medikamente 
                  hängt von vielen Faktoren ab (Genetik, Leberfunktion, weitere 
                  Substanzen).
                </span>
              </li>
              <li>
                <i class="fas fa-exclamation-triangle"></i>
                <span>
                  <strong>Keine Garantie für Reduktion:</strong> 
                  ReDuMed zeigt ein <em>Potenzial</em> auf – ob und wie stark Sie 
                  Medikamente reduzieren können, entscheidet Ihr Arzt anhand Ihrer 
                  tatsächlichen Symptome und Blutwerte.
                </span>
              </li>
            </ul>
            
            <p>
              <strong>Verwenden Sie diesen Plan als Gesprächsgrundlage mit Ihrem Arzt.</strong> 
              Laden Sie das PDF herunter, nehmen Sie es mit in die Sprechstunde und 
              besprechen Sie gemeinsam, ob und wie ein Cannabinoid-Einsatz in Ihrem 
              Fall sinnvoll sein könnte.
            </p>
            
          </div>
          
        </div>
        
      </div>
    </section>
    
    <!-- ============================================================
         5) PLANNER SECTION (Form with Progress Bar)
         ============================================================ -->
    <section id="planner-section" class="planner-section">
      <div class="container">
        
        <h2 class="section-headline">
          Ihren persönlichen Dosierungsplan erstellen
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
              <p class="subtitle">Ihre Körperdaten helfen uns, die optimale Cannabinoid-Dosis zu berechnen.</p>
              
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
              
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 1rem;">
                <i class="fas fa-lock" style="color: var(--primary-green);"></i>
                Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
              </p>
            </div>
            
            <div class="form-navigation">
              <button type="button" class="btn-secondary" onclick="previousStep(4)">
                <i class="fas fa-arrow-left"></i>
                Zurück
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-rocket"></i>
                Plan erstellen
              </button>
            </div>
          </div>
          
        </form>
        
        <!-- Loading Animation -->
        <div id="loading" class="hidden" style="margin-top: 1.5rem;">
          <div style="max-width: 700px; margin: 0 auto; padding: 2.5rem 2rem; background: white; border-radius: var(--radius-large); box-shadow: var(--shadow-soft); text-align: center; position: relative; overflow: hidden;">
            
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.6rem; color: var(--primary-dark-green);">
              <i class="fas fa-sparkles" style="margin-right: 0.5rem;"></i>
              KI analysiert Ihre Daten
            </h3>
            <p style="color: var(--text-muted); margin-bottom: 1.8rem; font-size: 1rem;">
              <span id="analysis-status">Analyse wird gestartet</span>
              <span id="status-dots" style="display: inline-block;">...</span>
            </p>
            
            <!-- Circular Progress (GRÖSSER) -->
            <div style="position: relative; display: inline-block; margin-bottom: 1.8rem;">
              <svg width="160" height="160" style="transform: rotate(-90deg);">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" stroke-width="8"></circle>
                <circle id="progress-circle" cx="80" cy="80" r="70" fill="none" stroke="var(--primary-green)" stroke-width="8" stroke-linecap="round" stroke-dasharray="440" stroke-dashoffset="440" style="transition: stroke-dashoffset 0.3s ease;"></circle>
              </svg>
              
              <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <i id="center-icon" class="fas fa-brain" style="color: var(--primary-green); font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
                <div id="center-percentage" style="font-size: 1.8rem; font-weight: 700; color: var(--primary-green);">0%</div>
              </div>
            </div>
            
            <!-- Live Counter Stats (GRÖSSER) -->
            <div id="live-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.8rem;">
              <div style="background: white; padding: 1.2rem 0.8rem; border-radius: 12px; border: 2px solid var(--border-light);">
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-green);" id="counter-medications">0</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem; line-height: 1.4;">Medikamente<br>analysiert</div>
              </div>
              <div style="background: white; padding: 1.2rem 0.8rem; border-radius: 12px; border: 2px solid var(--border-light);">
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-green);" id="counter-interactions">0</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem; line-height: 1.4;">Wechsel-<br>wirkungen</div>
              </div>
              <div style="background: white; padding: 1.2rem 0.8rem; border-radius: 12px; border: 2px solid var(--border-light);">
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-green);" id="counter-calculations">0</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem; line-height: 1.4;">Berechnungen<br>durchgeführt</div>
              </div>
            </div>
            
            <!-- Plan Ready Message (GRÖSSER) -->
            <div id="plan-ready-message" style="display: none; margin-top: 1.5rem;">
              <div style="background: linear-gradient(135deg, var(--primary-dark-green), var(--primary-green)); padding: 2rem 1.5rem; border-radius: var(--radius-medium); box-shadow: var(--shadow-medium); text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 0.8rem;">
                  <i class="fas fa-file-medical" style="color: white; font-size: 3rem;"></i>
                  <h3 style="margin: 0; font-size: 1.8rem; font-weight: 800; color: white;">Ihr Dosierplan ist fertig!</h3>
                </div>
                <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 1.1rem; font-weight: 500; margin-bottom: 1.5rem;">
                  Ihre persönliche Medikamenten-Reduktionsstrategie wurde erfolgreich erstellt.
                </p>
                <button id="show-plan-button" class="btn-primary" style="background: white; color: var(--primary-green); font-size: 1.1rem; padding: 1rem 2rem;">
                  <i class="fas fa-eye"></i>
                  Plan jetzt anzeigen
                </button>
              </div>
            </div>
            
          </div>
        </div>
        
        <!-- Results Container -->
        <div id="results" class="hidden" style="margin-top: 2rem;"></div>
        
      </div>
    </section>
    
    <!-- ============================================================
         6) FAQ SECTION
         ============================================================ -->
    <section class="faq-section">
      <div class="container">
        
        <h2 class="section-headline">
          Häufig gestellte Fragen (FAQ)
        </h2>
        
        <p class="section-description">
          Alle wichtigen Informationen zu ReDuMed, Cannabinoiden, Wechselwirkungen 
          und dem Medikamenten-Reduktionsprozess.
        </p>
        
        <div class="faq-container">
          
          <!-- FAQ 1 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Was sind Cannabinoide und wie wirken sie im Körper?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  <strong>Cannabinoide</strong> sind Pflanzenstoffe aus der Cannabis-Pflanze, 
                  die an körpereigene Rezeptoren des Endocannabinoid-Systems (ECS) andocken. 
                  Die bekanntesten sind <strong>CBD (Cannabidiol)</strong> und 
                  <strong>THC (Tetrahydrocannabinol)</strong>.
                </p>
                <p>
                  Während THC psychoaktiv wirkt, ist CBD nicht berauschend und wird häufig 
                  zur Unterstützung bei Schmerzen, Schlafstörungen, Entzündungen und 
                  Stressregulation eingesetzt. Cannabinoide modulieren Neurotransmitter, 
                  beeinflussen das Immunsystem und wirken auf Leberenzyme (CYP450), 
                  die auch Medikamente abbauen.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 2 -->
          <div class="faq-item">
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
                  Das <strong>Endocannabinoid-System (ECS)</strong> ist ein körpereigenes 
                  Regulierungssystem, das in jedem Menschen vorhanden ist. Es besteht aus:
                </p>
                <ul>
                  <li><strong>Endocannabinoiden</strong> (körpereigene Botenstoffe)</li>
                  <li><strong>CB1- und CB2-Rezeptoren</strong> (Andockstellen im Gehirn, Immunsystem, Organen)</li>
                  <li><strong>Enzymen</strong>, die Endocannabinoide abbauen</li>
                </ul>
                <p>
                  Das ECS reguliert Schmerz, Schlaf, Appetit, Immunfunktion, Stimmung und 
                  Stressreaktionen. Ein geschwächtes ECS kann zu chronischen Schmerzen, 
                  Schlafstörungen oder Entzündungen führen – Cannabinoide aus Pflanzen 
                  können das ECS unterstützen und stärken.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 3 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Was sind CYP450-Enzyme und warum sind sie wichtig?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  <strong>CYP450-Enzyme</strong> sind Leberenzyme, die etwa 60 % aller 
                  gängigen Medikamente abbauen. Cannabinoide wie CBD können diese Enzyme 
                  <strong>hemmen (inhibieren)</strong> oder <strong>aktivieren (induzieren)</strong>.
                </p>
                <p>
                  <strong>Hemmung:</strong> Medikamente werden langsamer abgebaut → höhere 
                  Blutspiegel → potenziell niedrigere Dosis nötig.<br/>
                  <strong>Induktion:</strong> Medikamente werden schneller abgebaut → niedrigere 
                  Blutspiegel → ggf. höhere Dosis nötig.
                </p>
                <p>
                  Diese Wechselwirkung ist der <strong>pharmakologische Mechanismus</strong>, 
                  durch den Cannabinoide den Medikamentenbedarf beeinflussen können. 
                  ReDuMed berücksichtigt diese Interaktionen bei der Planerstellung.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 4 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Wie können Cannabinoide dabei helfen, Medikamente zu reduzieren?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Cannabinoide wirken auf <strong>zwei Ebenen</strong>:
                </p>
                <p>
                  <strong>1. ECS-Unterstützung:</strong> Sie stärken das körpereigene 
                  Regulierungssystem für Schmerz, Schlaf, Entzündung und Stress. Ein 
                  stabileres ECS kann dazu führen, dass weniger Symptome auftreten und 
                  der Körper besser selbst reguliert.
                </p>
                <p>
                  <strong>2. Pharmakologische Wechselwirkung:</strong> Cannabinoide 
                  beeinflussen den Abbau bestimmter Medikamente über CYP450-Enzyme. 
                  Dadurch können Medikamente länger im Körper wirken und Sie benötigen 
                  möglicherweise eine geringere Dosis.
                </p>
                <p>
                  <strong>Wichtig:</strong> Dies ist ein individueller Prozess und muss 
                  immer ärztlich begleitet werden. ReDuMed zeigt nur ein 
                  <em>theoretisches Potenzial</em> auf.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 5 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Ist ReDuMed eine medizinische Beratung oder Diagnose?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  <strong>Nein.</strong> ReDuMed ist ein <strong>Informationstool</strong>, 
                  das auf wissenschaftlichen Studien und pharmakologischen Daten basiert. 
                  Es erstellt einen <strong>theoretischen Dosierungsplan</strong>, der als 
                  <strong>Gesprächsgrundlage</strong> für Ihren Arzt dient.
                </p>
                <p>
                  ReDuMed ersetzt <strong>keine</strong> ärztliche Beratung, Diagnose 
                  oder Behandlung. Jede Änderung Ihrer Medikation muss mit Ihrem 
                  behandelnden Arzt besprochen und überwacht werden.
                </p>
                <p>
                  <strong>Verwenden Sie den Plan niemals eigenständig zur 
                  Medikamenten-Reduktion.</strong>
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 6 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Wie wird die Cannabinoid-Dosierung berechnet?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Die Dosierung basiert auf <strong>evidenzbasierten Richtlinien</strong> 
                  (Studie: Blessing et al., 2015) und wird <strong>gewichtsabhängig</strong> 
                  berechnet:
                </p>
                <ul>
                  <li><strong>Startdosis:</strong> 0,5 mg CBD pro kg Körpergewicht/Tag</li>
                  <li><strong>Zieldosis:</strong> 1,0 mg CBD pro kg Körpergewicht/Tag</li>
                  <li><strong>Einschleichphase:</strong> 6-12 Wochen (Standard: 8 Wochen)</li>
                </ul>
                <p>
                  <strong>Individuelle Anpassungen:</strong>
                </p>
                <ul>
                  <li>Bei Benzodiazepinen/Opioiden: Startdosis wird halbiert (Sicherheit)</li>
                  <li>Bei Senioren (65+): Dosis wird um 20 % reduziert</li>
                  <li>Bei Untergewicht/Übergewicht: BMI-basierte Anpassung</li>
                </ul>
                <p>
                  Die Dosierung wird <strong>wöchentlich schrittweise</strong> erhöht, 
                  um den Körper sanft einzustellen.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 7 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Welche Medikamente werden von CYP450-Wechselwirkungen beeinflusst?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Etwa <strong>60 % aller gängigen Medikamente</strong> werden über 
                  CYP450-Enzyme abgebaut. Dazu gehören unter anderem:
                </p>
                <ul>
                  <li><strong>Schmerzmittel:</strong> Ibuprofen, Diclofenac, Tramadol</li>
                  <li><strong>Antidepressiva:</strong> Sertralin, Citalopram, Fluoxetin</li>
                  <li><strong>Benzodiazepine:</strong> Diazepam, Lorazepam, Alprazolam</li>
                  <li><strong>Blutdrucksenker:</strong> Amlodipin, Metoprolol, Losartan</li>
                  <li><strong>Blutverdünner:</strong> Warfarin, Clopidogrel</li>
                  <li><strong>Antiepileptika:</strong> Carbamazepin, Valproat</li>
                </ul>
                <p>
                  ReDuMed analysiert Ihre Medikamente und zeigt an, ob 
                  <strong>Wechselwirkungen</strong> zu erwarten sind. Die tatsächliche 
                  Auswirkung muss jedoch <strong>individuell ärztlich überwacht</strong> werden.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 8 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Wie schnell kann ich meine Medikamente reduzieren?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  <strong>Das hängt von vielen individuellen Faktoren ab</strong> und kann 
                  nicht pauschal beantwortet werden. ReDuMed bietet eine 
                  <strong>theoretische Simulation</strong> über 8 Wochen (Einschleichphase) 
                  plus Erhaltungsphase.
                </p>
                <p>
                  <strong>Wichtige Faktoren:</strong>
                </p>
                <ul>
                  <li>Art und Schwere Ihrer Erkrankung</li>
                  <li>Dauer der Medikamenteneinnahme</li>
                  <li>Reaktion Ihres Körpers auf Cannabinoide</li>
                  <li>Genetische Faktoren (Leberfunktion, CYP450-Varianten)</li>
                  <li>Begleitende Therapien (Ernährung, Bewegung, Stressmanagement)</li>
                </ul>
                <p>
                  <strong>Realistische Erwartung:</strong> Ein Reduktionsziel von 
                  <strong>25-50 %</strong> über 3-6 Monate ist für viele Menschen realistisch – 
                  aber nur unter ärztlicher Kontrolle.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 9 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Was passiert, wenn ich Cannabinoide absetze?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  Wenn Sie Cannabinoide absetzen, <strong>fällt die ECS-Unterstützung weg</strong>. 
                  Je nachdem, wie stark Ihr Körper von der Cannabinoid-Zufuhr profitiert hat, 
                  können folgende Szenarien eintreten:
                </p>
                <p>
                  <strong>1. Stabilisiertes ECS:</strong> Ihr ECS hat sich durch die 
                  Cannabinoid-Gabe stabilisiert und bleibt auch ohne weitere Zufuhr stark. 
                  Symptome bleiben reduziert, Medikamentenbedarf bleibt niedrig.
                </p>
                <p>
                  <strong>2. ECS benötigt weiterhin Unterstützung:</strong> Nach Absetzen 
                  kehren Symptome zurück, Sie benötigen wieder höhere Medikamentendosen. 
                  In diesem Fall ist eine <strong>Dauergabe</strong> von Cannabinoiden sinnvoll.
                </p>
                <p>
                  <strong>Empfehlung:</strong> Cannabinoide langsam ausschleichen und 
                  Symptome eng beobachten. Ihr Arzt kann anhand Ihrer Reaktion entscheiden, 
                  ob eine Dauergabe oder ein Auslassversuch sinnvoll ist.
                </p>
              </div>
            </div>
          </div>
          
          <!-- FAQ 10 -->
          <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(this)">
              <span class="faq-question-text">
                Sind Cannabinoide legal und wo kann ich sie kaufen?
              </span>
              <div class="faq-icon">
                <i class="fas fa-chevron-down"></i>
              </div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <p>
                  <strong>CBD-Produkte sind in Deutschland legal</strong>, solange sie 
                  einen THC-Gehalt von unter 0,2 % aufweisen. Sie sind frei verkäuflich 
                  in Apotheken, Online-Shops und spezialisierten CBD-Geschäften.
                </p>
                <p>
                  <strong>Qualitätsmerkmale:</strong>
                </p>
                <ul>
                  <li>Zertifizierte Laboranalysen (COA - Certificate of Analysis)</li>
                  <li>Klare Angabe zu CBD- und THC-Gehalt</li>
                  <li>Bio-Anbau ohne Pestizide</li>
                  <li>Vollspektrum-Öle (enthalten auch Terpene und Flavonoide)</li>
                </ul>
                <p>
                  <strong>Empfehlung:</strong> Kaufen Sie nur bei seriösen Anbietern mit 
                  transparenten Laborberichten. ReDuMed empfiehlt KANNASAN-Produkte 
                  (CBD-Dosier-Sprays), die präzise Dosierungen ermöglichen.
                </p>
              </div>
            </div>
          </div>
          
        </div>
        
      </div>
    </section>
    
  </main>
  
  <!-- ============================================================
       FOOTER
       ============================================================ -->
  <footer>
    <div class="container">
      
      <div class="footer-content">
        
        <!-- Branding -->
        <div class="footer-branding">
          <h3>ReDuMed</h3>
          <p class="tagline">reduziere deine Medikamente.</p>
          <p>
            Ein intelligentes Tool zur Berechnung von Cannabinoid-Dosierungen 
            und Medikamenten-Reduktionsplänen – basierend auf Körperdaten, 
            pharmakologischen Wechselwirkungen und evidenzbasierten Richtlinien.
          </p>
        </div>
        
        <!-- Quick Links -->
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul class="footer-links">
            <li><a href="#planner-section">Plan erstellen</a></li>
            <li><a href="#why-redumed">Warum ReDuMed?</a></li>
            <li><a href="#how-it-works">So funktioniert's</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        
        <!-- Legal -->
        <div class="footer-section">
          <h4>Rechtliches</h4>
          <ul class="footer-links">
            <li><a href="#">Impressum</a></li>
            <li><a href="#">Datenschutz</a></li>
            <li><a href="#">AGB</a></li>
            <li><a href="#">Haftungsausschluss</a></li>
          </ul>
        </div>
        
      </div>
      
      <!-- Disclaimer -->
      <div class="footer-disclaimer">
        <p>
          <strong><i class="fas fa-exclamation-triangle"></i> Wichtiger medizinischer Haftungsausschluss:</strong>
        </p>
        <p>
          ReDuMed ist ein Informationstool und kein Ersatz für ärztlichen Rat, 
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
          © 2024 ReDuMed. Alle Rechte vorbehalten.
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
    // Multi-step form navigation
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
  </script>
  
  <!-- Main Application Logic -->
  <script src="/static/app.js"></script>
  
</body>
</html>
  `)
})

export default app
