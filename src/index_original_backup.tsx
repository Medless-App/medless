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

// MedLess-AI: Select optimal product with minimal sprays, no overdose, max 6 sprays per time
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

// MedLess-AI: Generate weekly plan with bottle tracking - NO unnecessary product changes!
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

// MedLess-AI: Calculate total costs for the entire plan
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

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes

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

// Get Cannabinoid interactions for specific medication
app.get('/api/interactions/:medicationId', async (c) => {
  const { env } = c;
  const medicationId = c.req.param('medicationId');
  
  try {
    const result = await env.DB.prepare(`
      SELECT ci.*, m.name as medication_name, m.generic_name
      FROM cbd_interactions ci
      LEFT JOIN medications m ON ci.medication_id = m.id
      WHERE ci.medication_id = ?
    `).bind(medicationId).all();
    
    return c.json({ success: true, interactions: result.results });
  } catch (error) {
    return c.json({ success: false, error: 'Fehler beim Abrufen der Wechselwirkungen' }, 500);
  }
})

// Analyze medications and generate CANNABINOID PASTE 70% DOSING PLAN
app.post('/api/analyze', async (c) => {
  const { env } = c;
  try {
    const body = await c.req.json();
    const { medications, durationWeeks, reductionGoal = 100, email, firstName, gender, age, weight, height } = body;
    
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
          dosage: med.dosage || 'Nicht angegeben',
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
          dosage: med.dosage || 'Nicht angegeben',
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

// OCR endpoint for image upload using OpenAI Vision API
app.post('/api/ocr', async (c) => {
  const { env } = c;
  
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile || !(imageFile instanceof File)) {
      return c.json({ success: false, error: 'Kein Bild hochgeladen' }, 400);
    }
    
    // Check if API key is configured
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return c.json({ 
        success: false, 
        error: 'OpenAI API-Key nicht konfiguriert. Bitte tragen Sie Ihren API-Key in die .dev.vars Datei ein.' 
      }, 500);
    }
    
    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Image = btoa(binary);
    
    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Bitte extrahiere alle Medikamentennamen und Dosierungen aus diesem Bild. Format: JSON Array mit {name: string, dosage: string}. Nur Medikamente zurückgeben, keine Erklärungen.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`);
    }
    
    const data: any = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const medications = JSON.parse(jsonMatch[0]);
      return c.json({ success: true, medications });
    } else {
      throw new Error('Keine Medikamente im Bild gefunden');
    }
    
  } catch (error: any) {
    console.error('OCR Error:', error);
    return c.json({ success: false, error: error.message || 'Fehler beim Bildupload' }, 500);
  }
})


// Main page

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Medikamente strukturiert reduzieren</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  
  <!-- TailwindCSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- FontAwesome -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- jsPDF for PDF Generation -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <!-- Axios for API calls -->
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script></script>

  <style>
    :root {
      --primary: #0b7b6c;
      --primary-dark: #075448;
      --bg: #f5f7fa;
      --text: #1f2933;
      --accent: #f97316;
      --danger: #b91c1c;
      --radius-lg: 16px;
      --radius-md: 10px;
      --shadow-soft: 0 10px 25px rgba(15, 23, 42, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--bg);
      line-height: 1.5;
    }

    a {
      color: var(--primary);
      text-decoration: none;
    }

    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.2rem 1.2rem 2.5rem;
    }

    /* HERO */
    .hero {
      margin-top: 1.2rem;
      padding: 1.5rem 1.3rem;
      border-radius: 24px;
      background: radial-gradient(circle at top left, #e0fdf7, #f5f7fa);
      box-shadow: var(--shadow-soft);
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.7rem;
      border-radius: 999px;
      background: rgba(11, 123, 108, 0.12);
      color: var(--primary-dark);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.6rem;
    }

    .hero h1 {
      margin: 0 0 0.6rem;
      font-size: 1.6rem;
      line-height: 1.2;
    }

    .hero-sub {
      margin: 0 0 1rem;
      font-size: 0.98rem;
      color: #4b5563;
    }

    .hero-grid {
      display: grid;
      gap: 1rem;
      margin-top: 1rem;
    }

    .hero-list {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.9rem;
      color: #374151;
    }

    .hero-list li + li {
      margin-top: 0.2rem;
    }

    .hero-cta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      align-items: center;
      margin-top: 1rem;
    }

    .btn-primary {
      border: none;
      cursor: pointer;
      padding: 0.7rem 1.2rem;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #fff;
      font-weight: 600;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      box-shadow: 0 10px 20px rgba(11, 123, 108, 0.35);
      transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.1s ease;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(11, 123, 108, 0.45);
    }

    .btn-ghost {
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      padding: 0.6rem 1rem;
      background: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .note {
      font-size: 0.78rem;
      color: #6b7280;
    }

    /* GENERIC SECTIONS */
    section {
      margin-top: 2rem;
    }

    section h2 {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    section p {
      margin: 0.3rem 0;
    }

    .muted {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .grid-3 {
      display: grid;
      gap: 0.9rem;
    }

    .card {
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 1rem;
      box-shadow: var(--shadow-soft);
    }

    .card h3 {
      margin-top: 0;
      margin-bottom: 0.25rem;
      font-size: 1rem;
    }

    .tag-small {
      display: inline-block;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.05);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.3rem;
    }

    /* STEP STRIP */
    .steps {
      display: grid;
      gap: 0.8rem;
      margin-top: 0.7rem;
    }

    .step {
      display: flex;
      gap: 0.7rem;
      align-items: flex-start;
    }

    .step-number {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: rgba(11, 123, 108, 0.1);
      color: var(--primary-dark);
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-title {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .step-text {
      font-size: 0.9rem;
      color: #4b5563;
    }

    /* TOOL / FORM */
    .tool-wrapper {
      margin-top: 1rem;
      display: grid;
      gap: 1rem;
    }

    .form-card {
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 1rem;
      box-shadow: var(--shadow-soft);
    }

    .form-card h3 {
      margin-top: 0;
      margin-bottom: 0.6rem;
    }

    .badge-warning {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      background: rgba(185, 28, 28, 0.08);
      color: var(--danger);
      font-size: 0.78rem;
      margin-bottom: 0.6rem;
    }

    .form-row {
      display: grid;
      gap: 0.7rem;
      margin-bottom: 0.8rem;
    }

    label {
      font-size: 0.85rem;
      font-weight: 500;
      display: block;
      margin-bottom: 0.2rem;
    }

    input[type="text"],
    input[type="email"],
    input[type="number"],
    select {
      width: 100%;
      border-radius: var(--radius-md);
      border: 1px solid #cbd5e1;
      padding: 0.55rem 0.6rem;
      font-size: 0.9rem;
      outline: none;
      background: #f9fafb;
    }

    input:focus,
    select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 1px rgba(11, 123, 108, 0.3);
      background: #fff;
    }

    .helper {
      font-size: 0.78rem;
      color: #6b7280;
      margin-top: 0.1rem;
    }

    .inline-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .radio-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      padding: 0.25rem 0.7rem;
      font-size: 0.8rem;
      cursor: pointer;
      background: #f9fafb;
    }

    .radio-pill input {
      margin: 0;
    }

    .med-row {
      display: grid;
      gap: 0.4rem;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      background: #f9fafb;
      border: 1px dashed #cbd5e1;
    }

    .btn-small {
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      padding: 0.3rem 0.7rem;
      font-size: 0.78rem;
      background: #fff;
      cursor: pointer;
    }

    .btn-small:hover {
      border-color: #94a3b8;
    }

    .tabs {
      display: inline-flex;
      padding: 0.25rem;
      border-radius: 999px;
      background: #e5e7eb;
      margin-bottom: 0.8rem;
    }

    .tab-btn {
      border: none;
      background: transparent;
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      font-size: 0.8rem;
      cursor: pointer;
      color: #4b5563;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .tab-btn.active {
      background: #fff;
      color: var(--primary-dark);
      box-shadow: 0 2px 6px rgba(148, 163, 184, 0.6);
    }

    .tab-panel {
      display: none;
    }

    .tab-panel.active {
      display: block;
    }

    .upload-box {
      border-radius: var(--radius-md);
      border: 1px dashed #cbd5e1;
      padding: 0.9rem;
      text-align: center;
      background: #f9fafb;
      font-size: 0.85rem;
    }

    .upload-box input {
      margin-top: 0.6rem;
    }

    /* FAQ */
    .faq {
      display: grid;
      gap: 0.7rem;
      margin-top: 0.8rem;
    }

    details {
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 0.6rem 0.8rem;
      box-shadow: var(--shadow-soft);
    }

    summary {
      cursor: pointer;
      list-style: none;
      font-size: 0.9rem;
      font-weight: 500;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    details[open] summary {
      color: var(--primary-dark);
    }

    details p {
      font-size: 0.85rem;
      color: #4b5563;
      margin-top: 0.4rem;
    }

    /* Autocomplete Styles */
    .medication-input-wrapper {
      position: relative;
      margin-bottom: 1rem;
    }
    
    .autocomplete-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
      max-height: 250px;
      overflow-y: auto;
      display: none;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-top: -1px;
    }
    
    .autocomplete-item {
      padding: 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.2s;
    }
    
    .autocomplete-item:hover {
      background: #f9fafb;
    }
    
    .autocomplete-item:last-child {
      border-bottom: none;
    }

    footer {
      margin-top: 2.5rem;
      font-size: 0.75rem;
      color: #9ca3af;
      text-align: center;
    }

    /* DESKTOP */
    @media (min-width: 768px) {
      main {
        padding: 1.8rem 1.2rem 3rem;
      }

      .hero {
        padding: 1.8rem 2rem;
      }

      .hero h1 {
        font-size: 2rem;
      }

      .hero-grid {
        grid-template-columns: 1.4fr 1.1fr;
        align-items: flex-start;
      }

      .grid-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .tool-wrapper {
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
        align-items: flex-start;
      }
    }
  </style>
  
  <!-- TailwindCSS & FontAwesome für Loading-Animation -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <style>
    /* Zusätzliche Tailwind-kompatible Styles */
    .section-card {
      background: white;
      border-left: 4px solid #0b7b6c;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
    }
    .hidden { display: none !important; }
    
    /* Remove number input spinner arrows (Chrome, Safari, Edge, Opera) */
    input[type="number"].no-spinner-input::-webkit-outer-spin-button,
    input[type="number"].no-spinner-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    /* Remove number input spinner arrows (Firefox) */
    input[type="number"].no-spinner-input {
      -moz-appearance: textfield;
      appearance: textfield;
    }
    .animate-ping {
      animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    .animate-bounce {
      animation: bounce 1s infinite;
    }
    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    @keyframes pulse {
      50% {
        opacity: .5;
      }
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes bounce {
      0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8,0,1,1);
      }
      50% {
        transform: none;
        animation-timing-function: cubic-bezier(0,0,0.2,1);
      }
    }
    @keyframes burst {
      0% { 
        transform: scale(0); 
        opacity: 1; 
      }
      100% { 
        transform: scale(3); 
        opacity: 0; 
      }
    }
    @keyframes float {
      0%, 100% { 
        transform: translateY(0px) translateX(0px); 
        opacity: 0.3;
      }
      50% { 
        transform: translateY(-20px) translateX(10px); 
        opacity: 0.6;
      }
    }
    @keyframes rotate-center {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes pulse-glow {
      0%, 100% { 
        filter: drop-shadow(0 0 8px rgba(11, 123, 108, 0.4));
      }
      50% { 
        filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.8));
      }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes burst-particle {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(calc(var(--tx, 0) * 1px), calc(var(--ty, 0) * 1px)) scale(0);
        opacity: 0;
      }
    }
    @keyframes gentle-pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 8px 24px rgba(11, 123, 108, 0.3);
      }
      50% {
        transform: scale(1.02);
        box-shadow: 0 12px 32px rgba(11, 123, 108, 0.4);
      }
    }
  </style>
</head>
<body>
  <main>
    <!-- HERO -->
    <section class="hero">
      <div class="hero-tag">Zu viele Medikamente?</div>
      <div class="hero-grid">
        <div>
          <h1>Ihr Weg zu weniger Medikamenten – durch ein starkes Endocannabinoid-System</h1>
          <p class="hero-sub">
            Dieses Tool erstellt einen <strong>individualisierten Dosierungsplan mit Cannabinoiden</strong> –
            als Grundlage für das Gespräch mit Ihrem Arzt.
          </p>
          <ul class="hero-list">
            <li>berücksichtigt Alter, Gewicht, Größe & aktuelle Medikation</li>
            <li>zeigt eine vorsichtige Einschleich- & Erhaltungsphase</li>
            <li>einfach als PDF zum Arzttermin mitnehmen</li>
          </ul>

          <div class="hero-cta-row">
            <a href="#tool" class="btn-primary">
              Dosierungsplan erstellen
              <span>➜</span>
            </a>
            <span class="note">Dauer: ca. 2–3 Minuten · kostenlos</span>
          </div>
        </div>

        <div>
          <div class="card">
            <span class="tag-small">Kurz erklärt</span>
            <h3>Warum das ECS so wichtig ist</h3>
            <p class="muted">
              Das Endocannabinoid-System (ECS) reguliert Schmerz, Schlaf, Stimmung, Entzündungen
              und Immunsystem. Ist es geschwächt, greifen viele Menschen zu immer mehr Medikamenten.
            </p>
            <p class="muted">
              Exogene Cannabinoide wie CBD können das ECS unterstützen – unter ärztlicher Begleitung
              kann dies ein Baustein zur <strong>langfristigen Medikamenten-Reduktion</strong> sein.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- PROBLEM / LÖSUNG -->
    <section>
      <h2>Zu viele Tabletten – Sie sind nicht allein</h2>
      <p class="muted">
        Viele Menschen nehmen täglich mehrere Medikamente – oft über Jahre. Die Frage ist:
        <em>Wie kann ich meine Abhängigkeit von Medikamenten verringern, ohne ein Risiko einzugehen?</em>
      </p>

      <div class="grid-3" style="margin-top: 0.8rem;">
        <div class="card">
          <h3>1 · Status Quo</h3>
          <p class="muted">Schwaches ECS, viele Symptome – und immer mehr Medikamente gegen einzelne Beschwerden.</p>
        </div>
        <div class="card">
          <h3>2 · ECS stärken</h3>
          <p class="muted">CBD kann das ECS unterstützen und körpereigene Regulationsprozesse wieder anstoßen.</p>
        </div>
        <div class="card">
          <h3>3 · Medikamente reduzieren</h3>
          <p class="muted">
            Unter ärztlicher Aufsicht können Dosierungen angepasst und Schritt für Schritt reduziert werden.
          </p>
        </div>
      </div>
    </section>

    <!-- WIE FUNKTIONIERT DAS TOOL -->
    <section>
      <h2>So funktioniert Ihr Dosierungsplan</h2>
      <p class="muted">In drei einfachen Schritten zu einem strukturierten Plan, den Sie mit Ihrem Arzt besprechen können.</p>

      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div>
            <div class="step-title">Daten eingeben</div>
            <div class="step-text">
              Sie geben Alter, Gewicht, Größe, Ihre Medikamente und die gewünschte Dauer der ECS-Aktivierung ein –
              wahlweise manuell oder per Foto Ihres Medikamentenplans.
            </div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div>
            <div class="step-title">Sichere Startdosis berechnen</div>
            <div class="step-text">
              Das System schlägt eine vorsichtige Einschleichdosis für CBD-Paste 70% vor und berücksichtigt dabei
              kritische Medikamentengruppen (z.&nbsp;B. Blutverdünner).
            </div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div>
            <div class="step-title">Plan als PDF speichern</div>
            <div class="step-text">
              Sie erhalten einen übersichtlichen Tagesplan, den Sie ausdrucken oder per E-Mail an Ihren Arzt senden können.
              Die Umsetzung erfolgt <strong>immer nur mit ärztlicher Begleitung</strong>.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SICHERHEIT -->
    <section>
      <h2>Sicherheit steht an erster Stelle</h2>
      <div class="card">
        <div class="badge-warning">Wichtiger Hinweis · Keine medizinische Beratung</div>
        <p class="muted">
          Dieses Tool ersetzt keine ärztliche Beratung und keine Diagnose.
          Es dient ausschließlich als strukturierte <strong>Gesprächsgrundlage</strong> für Sie und Ihre behandelnden Ärzte.
        </p>
        <ul class="hero-list" style="margin-top: 0.5rem;">
          <li>Ändern Sie Ihre Medikation niemals eigenständig.</li>
          <li>Besprechen Sie jede Veränderung der Dosis mit Ihrem Arzt.</li>
          <li>Bei Unsicherheit oder Nebenwirkungen immer ärztliche Hilfe suchen.</li>
        </ul>
      </div>
    </section>

    <!-- FORMULAR MIT MULTISTEP -->
    <section id="tool">
      <h2>Erstellen Sie Ihren persönlichen CBD-Paste-Dosierungsplan</h2>
      <p class="muted">
        Folgen Sie den Schritten, um einen individuellen Dosierungsplan zu erhalten.
      </p>

      <!-- Progress Stepper - NEW STRUCTURED LAYOUT -->
      <div style="margin-bottom: 2rem; margin-top: 1.5rem;">
        <!-- Circles and Progress Bars Container -->
        <div style="display: grid; grid-template-columns: 40px 1fr 40px 1fr 40px 1fr 40px 1fr 40px; align-items: center; max-width: 800px; margin: 0 auto 0.75rem; gap: 0;">
          <!-- Step 1 Circle -->
          <div id="step-indicator-1" style="width: 40px; height: 40px; border-radius: 50%; background: #0b7b6c; color: white; font-weight: 600; display: flex; align-items: center; justify-content: center;">1</div>
          <!-- Progress Bar 1 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-1" style="height: 100%; background: #0b7b6c; width: 100%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 2 Circle -->
          <div id="step-indicator-2" style="width: 40px; height: 40px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center;">2</div>
          <!-- Progress Bar 2 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-2" style="height: 100%; background: #0b7b6c; width: 0%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 3 Circle -->
          <div id="step-indicator-3" style="width: 40px; height: 40px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center;">3</div>
          <!-- Progress Bar 3 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-3" style="height: 100%; background: #0b7b6c; width: 0%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 4 Circle -->
          <div id="step-indicator-4" style="width: 40px; height: 40px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center;">4</div>
          <!-- Progress Bar 4 -->
          <div style="height: 2px; background: #cbd5e1; margin: 0 0.5rem;">
            <div id="progress-bar-4" style="height: 100%; background: #0b7b6c; width: 0%; transition: width 0.3s;"></div>
          </div>
          <!-- Step 5 Circle -->
          <div id="step-indicator-5" style="width: 40px; height: 40px; border-radius: 50%; background: #cbd5e1; color: #6b7280; font-weight: 600; display: flex; align-items: center; justify-content: center;">5</div>
        </div>
        
        <!-- Labels Container - EXACTLY ALIGNED with circles above -->
        <div style="display: grid; grid-template-columns: 40px 1fr 40px 1fr 40px 1fr 40px 1fr 40px; max-width: 800px; margin: 0 auto; gap: 0;">
          <!-- Label 1 -->
          <span style="font-size: 0.7rem; color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Name</span>
          <span></span>
          <!-- Label 2 -->
          <span style="font-size: 0.7rem; color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Körperdaten</span>
          <span></span>
          <!-- Label 3 -->
          <span style="font-size: 0.7rem; color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Medikamente</span>
          <span></span>
          <!-- Label 4 -->
          <span style="font-size: 0.7rem; color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Plan</span>
          <span></span>
          <!-- Label 5 -->
          <span style="font-size: 0.7rem; color: #6b7280; text-align: center; line-height: 1.2; white-space: nowrap;">Zusammenfassung</span>
        </div>
      </div>

      <form id="medication-form">
        <!-- STEP 1: Name & Gender -->
        <div id="step-1" class="form-step">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 1: Persönliche Angaben</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Damit wir Sie persönlich ansprechen können.</p>
            
            <div class="form-row">
              <div>
                <label for="first-name">Ihr Vorname *</label>
                <input type="text" id="first-name" name="first_name" placeholder="z.B. Maria" required />
              </div>
            </div>

            <div class="form-row">
              <div>
                <label>Geschlecht *</label>
                <div class="inline-row">
                  <label class="radio-pill">
                    <input type="radio" name="gender" value="female" required />
                    <span>Weiblich</span>
                  </label>
                  <label class="radio-pill">
                    <input type="radio" name="gender" value="male" />
                    <span>Männlich</span>
                  </label>
                  <label class="radio-pill">
                    <input type="radio" name="gender" value="diverse" />
                    <span>Divers</span>
                  </label>
                </div>
              </div>
            </div>

            <div style="text-align: right; margin-top: 1.5rem;">
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 2: Body Data -->
        <div id="step-2" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 2: Körperdaten</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Diese Daten helfen uns, die Dosierung individuell zu berechnen.</p>
            
            <div class="form-row">
              <div>
                <label for="age">Alter (Jahre) *</label>
                <input type="number" id="age" name="age" placeholder="z.B. 45" min="18" max="120" required />
                <div class="helper">Für altersgerechte Dosierung</div>
              </div>
              <div>
                <label for="weight">Gewicht (kg) *</label>
                <input type="number" id="weight" name="weight" placeholder="z.B. 70" min="30" max="250" step="0.1" required />
                <div class="helper">In Kilogramm</div>
              </div>
              <div>
                <label for="height">Größe (cm) *</label>
                <input type="number" id="height" name="height" placeholder="z.B. 170" min="120" max="230" required />
                <div class="helper">In Zentimetern</div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 3: Medications -->
        <div id="step-3" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 3: Ihre Medikamente</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Geben Sie alle Medikamente ein, die Sie derzeit einnehmen.</p>
            
            <div id="medication-inputs" style="margin-bottom: 1rem;">
              <!-- Wird durch JavaScript befüllt -->
            </div>

            <button type="button" id="add-medication" class="btn-small" style="margin-bottom: 1rem;">
              + Weiteres Medikament hinzufügen
            </button>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 4: Plan Settings -->
        <div id="step-4" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 4: Plan-Einstellungen</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Wählen Sie die Dauer und Ihr Reduktionsziel.</p>
            
            <div class="form-row" style="margin-bottom: 1.5rem;">
              <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border: 2px solid #14b8a6;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0b7b6c, #14b8a6); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-calendar-alt" style="color: white; font-size: 1.1rem;"></i>
                  </div>
                  <div>
                    <label for="duration-weeks" style="font-size: 1rem; font-weight: 600; color: #0b7b6c; margin: 0;">Plan-Dauer (Wochen) *</label>
                    <p style="font-size: 0.85rem; color: #6b7280; margin: 0.25rem 0 0 0;">Wie lange soll Ihr Reduktionsplan dauern?</p>
                  </div>
                </div>
                <select id="duration-weeks" name="duration_weeks" required style="width: 100%; padding: 0.875rem; font-size: 0.95rem; border: 2px solid #14b8a6; border-radius: 8px; background: white;">
                  <option value="">-- Bitte wählen --</option>
                  <option value="4">4 Wochen – Schneller Einstieg</option>
                  <option value="6">6 Wochen – Zügig</option>
                  <option value="8" selected>8 Wochen – Standard (empfohlen) ⭐</option>
                  <option value="10">10 Wochen – Behutsam</option>
                  <option value="12">12 Wochen – Sehr langsam</option>
                </select>
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #059669;">
                  <i class="fas fa-info-circle" style="color: #059669; margin-right: 0.5rem;"></i>
                  <span style="font-size: 0.85rem; color: #374151;">Empfohlen: 8–12 Wochen für eine sanfte und stabile Reduktion.</span>
                </div>
              </div>
            </div>

            <div class="form-row" style="margin-bottom: 1.5rem;">
              <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border: 2px solid #14b8a6;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0b7b6c, #14b8a6); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-chart-line" style="color: white; font-size: 1.1rem;"></i>
                  </div>
                  <div>
                    <label for="reduction-goal" style="font-size: 1rem; font-weight: 600; color: #0b7b6c; margin: 0;">Reduktionsziel *</label>
                    <p style="font-size: 0.85rem; color: #6b7280; margin: 0.25rem 0 0 0;">Wie viel möchten Sie reduzieren?</p>
                  </div>
                </div>
                <select id="reduction-goal" name="reduction_goal" required style="width: 100%; padding: 0.875rem; font-size: 0.95rem; border: 2px solid #14b8a6; border-radius: 8px; background: white;">
                  <option value="">-- Bitte wählen --</option>
                  <option value="10">10% Reduktion</option>
                  <option value="20">20% Reduktion</option>
                  <option value="30">30% Reduktion</option>
                  <option value="40">40% Reduktion</option>
                  <option value="50" selected>50% Reduktion (empfohlen) ⭐</option>
                  <option value="60">60% Reduktion</option>
                  <option value="70">70% Reduktion</option>
                  <option value="80">80% Reduktion</option>
                  <option value="90">90% Reduktion</option>
                  <option value="100">100% Reduktion (komplett absetzen)</option>
                </select>
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #059669;">
                  <i class="fas fa-lightbulb" style="color: #059669; margin-right: 0.5rem;"></i>
                  <span style="font-size: 0.85rem; color: #374151;">Tipp: Beginnen Sie mit 30–50 % für einen sicheren und gut verträglichen Start.</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%); padding: 1.5rem; border-radius: 12px; border: 2px solid #f59e0b; display: none;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b, #fbbf24); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-chart-line" style="color: white; font-size: 1.1rem;"></i>
                  </div>
                  <div>
                    <label for="reduction-goal-hidden" style="font-size: 1rem; font-weight: 600; color: #b45309; margin: 0;">Reduktionsziel (%) *</label>
                    <p style="font-size: 0.85rem; color: #6b7280; margin: 0.25rem 0 0 0;">Wie viel Prozent Ihrer Medikamente möchten Sie reduzieren?</p>
                  </div>
                </div>
                <select id="reduction-goal-hidden" name="reduction_goal" required style="width: 100%; padding: 0.875rem; font-size: 0.95rem; border: 2px solid #f59e0b; border-radius: 8px; background: white;">
                  <option value="">-- Bitte wählen --</option>
                  <option value="10">10% – Minimale Reduktion</option>
                  <option value="20">20% – Leichte Reduktion</option>
                  <option value="30">30% – Moderate Reduktion</option>
                  <option value="40">40% – Deutliche Reduktion</option>
                  <option value="50" selected>50% – Halbierung (empfohlen) ⭐</option>
                  <option value="60">60% – Starke Reduktion</option>
                  <option value="70">70% – Sehr starke Reduktion</option>
                  <option value="80">80% – Maximale Reduktion</option>
                  <option value="90">90% – Fast vollständig</option>
                  <option value="100">100% – Vollständiger Verzicht (nur nach ärztlicher Rücksprache!)</option>
                </select>
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                  <i class="fas fa-exclamation-triangle" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                  <span style="font-size: 0.85rem; color: #374151;">Wichtig: Medikamentenreduktion nur in Absprache mit Ihrem Arzt!</span>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="button" class="btn-primary next-step">
                Weiter <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 5: Email & Summary -->
        <div id="step-5" class="form-step" style="display: none;">
          <div class="card" style="max-width: 700px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.5rem;">Schritt 5: E-Mail & Zusammenfassung</h3>
            <p class="muted" style="margin-bottom: 1.5rem;">Überprüfen Sie Ihre Angaben und geben Sie Ihre E-Mail ein.</p>
            
            <div class="form-row">
              <div>
                <label for="email">Ihre E-Mail-Adresse *</label>
                <input type="email" id="email" name="email" placeholder="ihre.email@beispiel.de" required />
                <div class="helper">Hierhin schicken wir den Download-Link zu Ihrem Dosierungsplan</div>
              </div>
            </div>

            <div class="card" style="background: #f9fafb; margin-top: 1.5rem; padding: 1rem;">
              <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 0.8rem;">Ihre Angaben im Überblick</h4>
              <div style="font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Name:</span>
                  <span id="summary-name" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Geschlecht:</span>
                  <span id="summary-gender" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Alter:</span>
                  <span id="summary-age" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Gewicht:</span>
                  <span id="summary-weight" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Größe:</span>
                  <span id="summary-height" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;">
                  <span class="muted">Medikamente:</span>
                  <span id="summary-medications" style="font-weight: 500;">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;">
                  <span class="muted">Plan-Dauer:</span>
                  <span id="summary-duration" style="font-weight: 500;">-</span>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
              <button type="button" class="btn-ghost prev-step">
                ← Zurück
              </button>
              <button type="submit" class="btn-primary">
                Dosierungsplan erstellen <span>✓</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      <!-- Loading Animation -->
      <div id="loading" class="hidden" style="margin-top: 1.5rem;">
        <div class="card" style="max-width: 550px; margin: 0 auto; padding: 1.5rem 1.25rem; text-align: center; position: relative; overflow: hidden;">
          
          <!-- Particles Background Effect -->
          <div id="particles-container" style="position: absolute; inset: 0; pointer-events: none; opacity: 0.2;"></div>
          
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem; color: #0b7b6c;">
            <i class="fas fa-sparkles" style="margin-right: 0.4rem;"></i>
            KI analysiert Ihre Daten
          </h3>
          <p style="color: #6b7280; margin-bottom: 1.2rem; font-size: 0.85rem;">
            <span id="analysis-status">Analyse wird gestartet</span>
            <span id="status-dots" style="display: inline-block;">...</span>
          </p>
          
          <!-- Main Circular Progress Ring (NOCH KLEINER: 100px) -->
          <div style="position: relative; display: inline-block; margin-bottom: 1.2rem;">
            <!-- Outer Glow Rings -->
            <div style="position: absolute; inset: 0; margin: -1.5rem; background: radial-gradient(circle, rgba(11, 123, 108, 0.1), transparent 70%); border-radius: 50%; opacity: 0.5;" class="animate-ping"></div>
            <div style="position: absolute; inset: 0; margin: -1rem; background: radial-gradient(circle, rgba(11, 123, 108, 0.12), transparent 70%); border-radius: 50%; opacity: 0.4; animation-delay: 0.5s;" class="animate-ping"></div>
            
            <!-- SVG Circular Progress (NOCH KLEINER: 100px) -->
            <svg width="100" height="100" style="transform: rotate(-90deg);">
              <!-- Background Circle -->
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" stroke-width="6"></circle>
              <!-- Progress Circle -->
              <circle id="progress-circle" cx="50" cy="50" r="42" fill="none" stroke="url(#gradient)" stroke-width="6" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="264" style="transition: stroke-dashoffset 0.3s ease, filter 0.3s ease;">
              </circle>
              <!-- Gradient Definition -->
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#0b7b6c;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#14b8a6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
            
            <!-- Center Content -->
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <i id="center-icon" class="fas fa-brain" style="color: #0b7b6c; font-size: 1.6rem; margin-bottom: 0.2rem; transition: all 0.3s;"></i>
              <div id="center-percentage" style="font-size: 1.1rem; font-weight: 700; color: #0b7b6c; transition: all 0.3s;">0%</div>
              <div id="center-time" style="font-size: 0.6rem; color: #6b7280; margin-top: 0.1rem;">ca. 8 Sek.</div>
            </div>
            
            <!-- Completion Burst (hidden initially) -->
            <div id="completion-burst" style="position: absolute; inset: 0; display: none;">
              <div style="position: absolute; inset: -15px; background: radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent 70%); animation: burst 0.6s ease-out;"></div>
            </div>
          </div>
          
          <!-- Live Counter Stats (während Analyse) -->
          <div id="live-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-bottom: 1.2rem;">
            <div style="background: white; padding: 0.6rem 0.4rem; border-radius: 10px; border: 1px solid #e5e7eb;">
              <div style="font-size: 1.3rem; font-weight: 700; color: #0b7b6c;" id="counter-medications">0</div>
              <div style="font-size: 0.65rem; color: #6b7280; margin-top: 0.1rem; line-height: 1.3;">Medikamente<br>analysiert</div>
            </div>
            <div style="background: white; padding: 0.6rem 0.4rem; border-radius: 10px; border: 1px solid #e5e7eb;">
              <div style="font-size: 1.3rem; font-weight: 700; color: #0b7b6c;" id="counter-interactions">0</div>
              <div style="font-size: 0.65rem; color: #6b7280; margin-top: 0.1rem; line-height: 1.3;">Wechsel-<br>wirkungen</div>
            </div>
            <div style="background: white; padding: 0.6rem 0.4rem; border-radius: 10px; border: 1px solid #e5e7eb;">
              <div style="font-size: 1.3rem; font-weight: 700; color: #0b7b6c;" id="counter-calculations">0</div>
              <div style="font-size: 0.65rem; color: #6b7280; margin-top: 0.1rem; line-height: 1.3;">Berechnungen<br>durchgeführt</div>
            </div>
          </div>
          
          <!-- Completion Stats (hidden initially, shown at 100%) -->
          <div id="completion-stats" style="display: none; margin-bottom: 1rem;">
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 1.25rem; border-radius: 14px; border: 2px solid #10b981;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 0.6rem; margin-bottom: 0.9rem;">
                <i class="fas fa-check-circle" style="color: #10b981; font-size: 1.6rem;"></i>
                <h4 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #059669;">Analyse erfolgreich abgeschlossen!</h4>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem;">
                <div style="background: white; padding: 0.65rem; border-radius: 9px; text-align: left;">
                  <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">
                    <span id="stat-calculations">0</span>
                  </div>
                  <div style="font-size: 0.7rem; color: #6b7280;">Berechnungen durchgeführt</div>
                </div>
                <div style="background: white; padding: 0.65rem; border-radius: 9px; text-align: left;">
                  <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">
                    <span id="stat-medications">0</span>
                  </div>
                  <div style="font-size: 0.7rem; color: #6b7280;">Medikamente in Datenbank</div>
                </div>
                <div style="background: white; padding: 0.65rem; border-radius: 9px; text-align: left;">
                  <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">
                    <span id="stat-interactions">0</span>
                  </div>
                  <div style="font-size: 0.7rem; color: #6b7280;">Wechselwirkungen geprüft</div>
                </div>
                <div style="background: white; padding: 0.65rem; border-radius: 9px; text-align: left;">
                  <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">
                    <span id="stat-weeks">0</span>
                  </div>
                  <div style="font-size: 0.7rem; color: #6b7280;">Wochen Ø Plan-Dauer</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Final "Plan ist fertig!" Message (hidden initially) -->
          <div id="plan-ready-message" style="display: none; margin-top: 1rem;">
            <div id="plan-ready-card" style="background: linear-gradient(135deg, #0b7b6c 0%, #059669 100%); padding: 1.5rem; border-radius: 14px; box-shadow: 0 8px 24px rgba(11, 123, 108, 0.3); text-align: center; animation: gentle-pulse 2s ease-in-out infinite;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <i class="fas fa-file-medical" style="color: white; font-size: 2rem;"></i>
                <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Ihr Dosierplan ist fertig!</h3>
              </div>
              <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem;">
                Ihre persönliche Medikamenten-Reduktionsstrategie wurde erfolgreich erstellt.
              </p>
              <button id="show-plan-button" style="
                background: white;
                color: #0b7b6c;
                border: none;
                padding: 0.75rem 1.75rem;
                border-radius: 24px;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.6rem;
              " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'">
                <i class="fas fa-eye" style="font-size: 1rem;"></i>
                <span>Plan jetzt anzeigen</span>
              </button>
              <p style="margin: 0.75rem 0 0 0; color: rgba(255,255,255,0.8); font-size: 0.75rem;">
                <i class="fas fa-info-circle" style="margin-right: 0.3rem;"></i>
                Klicken Sie auf den Button wenn Sie bereit sind
              </p>
            </div>
          </div>
          
          <!-- Progress Steps -->
          <div style="max-width: 600px; margin: 0 auto 2rem; text-align: left;">
            <div id="analysis-step-1" style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: white; border-radius: 12px; border: 2px solid #e5e7eb; margin-bottom: 1rem; opacity: 0.4; transition: all 0.5s;">
              <div style="width: 48px; height: 48px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s;">
                <i id="icon-1" class="fas fa-database" style="color: #9ca3af; font-size: 1.25rem;"></i>
              </div>
              <div style="flex: 1;">
                <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Medikamenten-Datenbank durchsuchen</h4>
                <p id="detail-1" style="font-size: 0.875rem; color: #6b7280;">Wartet auf Start...</p>
                <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 6px; margin-top: 0.5rem; overflow: hidden;">
                  <div id="mini-progress-1" style="background: #0b7b6c; height: 100%; border-radius: 9999px; width: 0%; transition: width 0.3s;"></div>
                </div>
              </div>
              <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i id="check-1" class="fas fa-check" style="color: #059669; font-size: 1.5rem; display: none;"></i>
                <i id="spinner-1" class="fas fa-spinner fa-spin" style="color: #0b7b6c; font-size: 1.25rem; display: none;"></i>
              </div>
            </div>
            
            <div id="analysis-step-2" style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: white; border-radius: 12px; border: 2px solid #e5e7eb; margin-bottom: 1rem; opacity: 0.4; transition: all 0.5s;">
              <div style="width: 48px; height: 48px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s;">
                <i id="icon-2" class="fas fa-exchange-alt" style="color: #9ca3af; font-size: 1.25rem;"></i>
              </div>
              <div style="flex: 1;">
                <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Wechselwirkungen analysieren</h4>
                <p id="detail-2" style="font-size: 0.875rem; color: #6b7280;">Wartet auf Start...</p>
                <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 6px; margin-top: 0.5rem; overflow: hidden;">
                  <div id="mini-progress-2" style="background: #0b7b6c; height: 100%; border-radius: 9999px; width: 0%; transition: width 0.3s;"></div>
                </div>
              </div>
              <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i id="check-2" class="fas fa-check" style="color: #059669; font-size: 1.5rem; display: none;"></i>
                <i id="spinner-2" class="fas fa-spinner fa-spin" style="color: #0b7b6c; font-size: 1.25rem; display: none;"></i>
              </div>
            </div>
            
            <div id="analysis-step-3" style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: white; border-radius: 12px; border: 2px solid #e5e7eb; margin-bottom: 1rem; opacity: 0.4; transition: all 0.5s;">
              <div style="width: 48px; height: 48px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s;">
                <i id="icon-3" class="fas fa-user-md" style="color: #9ca3af; font-size: 1.25rem;"></i>
              </div>
              <div style="flex: 1;">
                <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Körperdaten verarbeiten</h4>
                <p id="detail-3" style="font-size: 0.875rem; color: #6b7280;">Wartet auf Start...</p>
                <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 6px; margin-top: 0.5rem; overflow: hidden;">
                  <div id="mini-progress-3" style="background: #0b7b6c; height: 100%; border-radius: 9999px; width: 0%; transition: width 0.3s;"></div>
                </div>
              </div>
              <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i id="check-3" class="fas fa-check" style="color: #059669; font-size: 1.5rem; display: none;"></i>
                <i id="spinner-3" class="fas fa-spinner fa-spin" style="color: #0b7b6c; font-size: 1.25rem; display: none;"></i>
              </div>
            </div>
            
            <div id="analysis-step-4" style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: white; border-radius: 12px; border: 2px solid #e5e7eb; margin-bottom: 1rem; opacity: 0.4; transition: all 0.5s;">
              <div style="width: 48px; height: 48px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s;">
                <i id="icon-4" class="fas fa-calculator" style="color: #9ca3af; font-size: 1.25rem;"></i>
              </div>
              <div style="flex: 1;">
                <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Dosierung berechnen</h4>
                <p id="detail-4" style="font-size: 0.875rem; color: #6b7280;">Wartet auf Start...</p>
                <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 6px; margin-top: 0.5rem; overflow: hidden;">
                  <div id="mini-progress-4" style="background: #0b7b6c; height: 100%; border-radius: 9999px; width: 0%; transition: width 0.3s;"></div>
                </div>
              </div>
              <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i id="check-4" class="fas fa-check" style="color: #059669; font-size: 1.5rem; display: none;"></i>
                <i id="spinner-4" class="fas fa-spinner fa-spin" style="color: #0b7b6c; font-size: 1.25rem; display: none;"></i>
              </div>
            </div>
            
            <div id="analysis-step-5" style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: white; border-radius: 12px; border: 2px solid #e5e7eb; opacity: 0.4; transition: all 0.5s;">
              <div style="width: 48px; height: 48px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s;">
                <i id="icon-5" class="fas fa-file-medical" style="color: #9ca3af; font-size: 1.25rem;"></i>
              </div>
              <div style="flex: 1;">
                <h4 style="font-weight: 600; margin-bottom: 0.25rem;">Dosierungsplan erstellen</h4>
                <p id="detail-5" style="font-size: 0.875rem; color: #6b7280;">Wartet auf Start...</p>
                <div style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 6px; margin-top: 0.5rem; overflow: hidden;">
                  <div id="mini-progress-5" style="background: #0b7b6c; height: 100%; border-radius: 9999px; width: 0%; transition: width 0.3s;"></div>
                </div>
              </div>
              <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i id="check-5" class="fas fa-check" style="color: #059669; font-size: 1.5rem; display: none;"></i>
                <i id="spinner-5" class="fas fa-spinner fa-spin" style="color: #0b7b6c; font-size: 1.25rem; display: none;"></i>
              </div>
            </div>
          </div>
          
          <!-- Overall Progress -->
          <div style="max-width: 600px; margin: 0 auto 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.875rem; font-weight: 600; color: #374151;">
                <i class="fas fa-chart-line" style="margin-right: 0.5rem; color: #0b7b6c;"></i>
                Gesamtfortschritt
              </span>
              <span id="progress-text" style="font-size: 1.125rem; font-weight: 700; color: #0b7b6c;">0%</span>
            </div>
            <div style="width: 100%; background: #cbd5e1; border-radius: 9999px; height: 16px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
              <div id="progress-bar" style="background: linear-gradient(90deg, #0b7b6c, #059669, #10b981); height: 100%; border-radius: 9999px; width: 0%; transition: width 0.5s ease-out; position: relative;">
                <div style="position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); opacity: 0.6; animation: shimmer 2s infinite linear;"></div>
              </div>
            </div>
          </div>
          
          <p style="font-size: 0.875rem; color: #6b7280;">
            <i class="fas fa-shield-alt" style="color: #059669; margin-right: 0.5rem;"></i>
            Ihre Daten sind sicher: Alle Berechnungen erfolgen verschlüsselt
          </p>
        </div>
      </div>

      <!-- Results -->
      <div id="results" class="hidden" style="margin-top: 2rem;"></div>
    </section>
    <!-- FAQ -->
    <section>
      <h2>Häufig gestellte Fragen (FAQ)</h2>
      <div class="faq">
        
        <!-- ECS & Cannabinoide -->
        <details>
          <summary>Wie unterstützen Cannabinoide mein Endocannabinoid-System (ECS)?</summary>
          <p>
            Cannabinoide stabilisieren körpereigene Endocannabinoide, modulieren Entzündungen und beeinflussen 
            Rezeptoren im Nervensystem. Dadurch unterstützen sie die natürliche Balance des Körpers.
          </p>
        </details>

        <!-- Dosierungsplan -->
        <details>
          <summary>Warum verwende ich einen Dosierungsplan?</summary>
          <p>
            Ein strukturierter Plan steigert die Dosis langsam, erhöht die Verträglichkeit und ermöglicht eine 
            bessere Bewertung der Wirkung.
          </p>
        </details>

        <details>
          <summary>Warum wird die Dosis wöchentlich gesteigert?</summary>
          <p>
            Um Überreaktionen zu vermeiden und die individuelle Verträglichkeit zu optimieren.
          </p>
        </details>

        <!-- Medikamentenreduktion -->
        <details>
          <summary>Kann ich durch Cannabinoide Medikamente reduzieren?</summary>
          <p>
            Eine Reduktion ist möglich, aber nur unter ärztlicher Begleitung. Der Plan dient lediglich als 
            Vorbereitung für das Arztgespräch.
          </p>
        </details>

        <details>
          <summary>Warum sind kleine Schritte bei der Medikamentenreduktion wichtig?</summary>
          <p>
            Um Rebound-Effekte und Überlastungen zu vermeiden. Darum setzt der Plan auf kleine Prozent-Reduktionen 
            mit Stabilisierungswochen.
          </p>
        </details>

        <!-- Wirkung & Zeitrahmen -->
        <details>
          <summary>Wie lange dauert es, bis Cannabinoide wirken?</summary>
          <p>
            Erste Effekte können nach wenigen Tagen auftreten, eine stabile Anpassung dauert 6–12 Wochen.
          </p>
        </details>

        <details>
          <summary>Ich spüre in den ersten Wochen wenig – ist das normal?</summary>
          <p>
            Ja, das ECS benötigt oft mehrere Wochen für eine stabile Anpassung.
          </p>
        </details>

        <!-- Sicherheit -->
        <details>
          <summary>Sind Cannabinoide abhängig machend oder berauschend?</summary>
          <p>
            Nicht-psychoaktive Cannabinoide haben kein Suchtpotenzial und verursachen keinen Rausch.
          </p>
        </details>

        <details>
          <summary>Welche Nebenwirkungen können Cannabinoide haben?</summary>
          <p>
            Mögliche leichte Nebenwirkungen: Müdigkeit, Schwindel, trockener Mund, veränderter Appetit.
          </p>
        </details>

        <details>
          <summary>Können Cannabinoide mit anderen Medikamenten interagieren?</summary>
          <p>
            Ja, Cannabinoide beeinflussen bestimmte Leberenzyme (z. B. CYP450). Darum jede Änderung ärztlich abklären.
          </p>
        </details>

        <details>
          <summary>Was mache ich bei Beschwerden während des Plans?</summary>
          <p>
            Nichts eigenständig ändern – sofort ärztlichen Rat einholen.
          </p>
        </details>

        <!-- Praktische Anwendung -->
        <details>
          <summary>Was mache ich mit dem fertigen Dosierungsplan?</summary>
          <p>
            Ausdrucken oder digital speichern und mit dem Arzt oder der Apotheke besprechen.
          </p>
        </details>

        <!-- Produkte & Dosierung -->
        <details>
          <summary>Warum unterschiedliche Cannabinoid-Konzentrationen?</summary>
          <p>
            Damit die mg-Dosis möglichst genau dem Ziel entspricht.
          </p>
        </details>

        <details>
          <summary>Warum bleibt der Plan bei einem Produkt, bis die Flasche leer ist?</summary>
          <p>
            Für Klarheit und Anwenderfreundlichkeit – kein Mischen verschiedener Produkte.
          </p>
        </details>

        <details>
          <summary>Was bedeutet die Abweichung in Prozent?</summary>
          <p>
            Sie zeigt, wie nah die reale Dosis an der Zieldosis liegt (Toleranz: ±10%).
          </p>
        </details>

      </div>
      
      <!-- Nach oben Button -->
      <div style="text-align: center; margin-top: 2rem; padding: 1.5rem;">
        <button id="scroll-to-top-btn" style="
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #0b7b6c, #14b8a6);
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)'">
          <i class="fas fa-arrow-up"></i>
          Zurück nach oben
        </button>
      </div>
    </section>

    <footer>
      &copy; 2025 ECS Aktivierung · Hinweis: Kein Ersatz für ärztliche Beratung oder Therapie.
    </footer>
  </main>

  <script>
    // Tabs umschalten
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        tabButtons.forEach((b) => b.classList.remove("active"));
        tabPanels.forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(target).classList.add("active");
      });
    });

    // Medikamenten-Zeilen dynamisch
    const medList = document.getElementById("med-list");
    const btnAddMed = document.getElementById("btn-add-med");

    function addMedRow() {
      const wrapper = document.createElement("div");
      wrapper.className = "med-row";

      wrapper.innerHTML = \`
        <input type="text" name="medName[]" placeholder="Name des Medikaments" />
        <input type="text" name="medDose[]" placeholder="z. B. 10 mg morgens, 10 mg abends" />
        <button type="button" class="btn-small btn-remove-med">Entfernen</button>
      \`;

      medList.appendChild(wrapper);

      wrapper.querySelector(".btn-remove-med").addEventListener("click", () => {
        medList.removeChild(wrapper);
      });
    }

    if (btnAddMed) {
      btnAddMed.addEventListener("click", addMedRow);
      // mindestens eine Zeile beim Start
      addMedRow();
    }

    // Formulare aktuell nur Demo: hier später API-Aufrufe einbauen
    function handleDemoSubmit(formId) {
      const form = document.getElementById(formId);
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert(
          "Hier kannst du deinen Backend-Aufruf einbauen.\\n\\nAktuell ist dies nur eine Demo-Oberfläche."
        );
      });
    }

    handleDemoSubmit("form-manual");
    handleDemoSubmit("form-photo");
  </script>

  <script>
    // Multi-Step Wizard Navigation
    let currentStep = 1;
    const totalSteps = 5;
    
    function showStep(stepNumber) {
      // Hide all steps
      for (let i = 1; i <= totalSteps; i++) {
        const step = document.getElementById(\`step-\${i}\`);
        if (step) step.style.display = 'none';
      }
      
      // Show current step
      const currentStepEl = document.getElementById(\`step-\${stepNumber}\`);
      if (currentStepEl) currentStepEl.style.display = 'block';
      
      // Update progress indicators
      updateProgressBar(stepNumber);
      
      // Update summary if on step 5
      if (stepNumber === 5) {
        updateSummary();
      }
      
      currentStep = stepNumber;
    }
    
    function updateProgressBar(stepNumber) {
      for (let i = 1; i <= totalSteps; i++) {
        const indicator = document.getElementById(\`step-indicator-\${i}\`);
        const progressBar = document.getElementById(\`progress-bar-\${i}\`);
        
        if (i < stepNumber) {
          // Completed steps
          if (indicator) {
            indicator.style.background = '#059669';
            indicator.style.color = 'white';
          }
          if (progressBar) progressBar.style.width = '100%';
        } else if (i === stepNumber) {
          // Current step
          if (indicator) {
            indicator.style.background = '#0b7b6c';
            indicator.style.color = 'white';
          }
          if (progressBar) progressBar.style.width = '0%';
        } else {
          // Future steps
          if (indicator) {
            indicator.style.background = '#cbd5e1';
            indicator.style.color = '#6b7280';
          }
          if (progressBar) progressBar.style.width = '0%';
        }
      }
    }
    
    function validateStep(stepNumber) {
      if (stepNumber === 1) {
        const firstName = document.getElementById('first-name').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked');
        if (!firstName) {
          alert('Bitte geben Sie Ihren Vornamen ein.');
          return false;
        }
        if (!gender) {
          alert('Bitte wählen Sie Ihr Geschlecht aus.');
          return false;
        }
        return true;
      }
      
      if (stepNumber === 2) {
        const age = document.getElementById('age').value;
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        
        if (!age || age < 18 || age > 120) {
          alert('Bitte geben Sie ein gültiges Alter ein (18-120 Jahre).');
          return false;
        }
        if (!weight || weight < 30 || weight > 250) {
          alert('Bitte geben Sie ein gültiges Gewicht ein (30-250 kg).');
          return false;
        }
        if (!height || height < 120 || height > 230) {
          alert('Bitte geben Sie eine gültige Größe ein (120-230 cm).');
          return false;
        }
        return true;
      }
      
      if (stepNumber === 3) {
        // Check for medication inputs (new autocomplete version)
        const medicationInputs = document.querySelectorAll('.medication-display-input');
        const dosageInputs = document.querySelectorAll('input[name="medication_mg_per_day[]"]');
        
        let hasValidMedication = false;
        let emptyMedicationName = false;
        let emptyDosage = false;
        
        medicationInputs.forEach((medInput, index) => {
          const medName = medInput.value.trim();
          const dosageValue = dosageInputs[index] ? dosageInputs[index].value.trim() : '';
          
          if (medName && dosageValue) {
            // Both fields filled - valid medication
            hasValidMedication = true;
          } else if (medName && !dosageValue) {
            // Medication name filled but no dosage
            emptyDosage = true;
          } else if (!medName && dosageValue) {
            // Dosage filled but no medication name
            emptyMedicationName = true;
          }
        });
        
        if (!hasValidMedication) {
          alert('Bitte geben Sie mindestens ein Medikament mit Tagesdosis ein.');
          return false;
        }
        
        if (emptyMedicationName) {
          alert('Bitte geben Sie für jede Dosierung auch den Medikamentennamen ein.');
          return false;
        }
        
        if (emptyDosage) {
          alert('Bitte geben Sie für jedes Medikament auch die Tagesdosis in mg ein.');
          return false;
        }
        
        return true;
      }
      
      if (stepNumber === 4) {
        const duration = document.getElementById('duration-weeks').value;
        const reductionGoal = document.getElementById('reduction-goal').value;
        
        if (!duration) {
          alert('Bitte wählen Sie eine Plan-Dauer aus.');
          return false;
        }
        
        if (!reductionGoal) {
          alert('Bitte wählen Sie ein Reduktionsziel aus.');
          return false;
        }
        
        return true;
      }
      
      if (stepNumber === 5) {
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email || !emailRegex.test(email)) {
          alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
          return false;
        }
        return true;
      }
      
      return true;
    }
    
    function updateSummary() {
      // Name
      const firstName = document.getElementById('first-name').value.trim();
      document.getElementById('summary-name').textContent = firstName || '-';
      
      // Gender
      const genderInput = document.querySelector('input[name="gender"]:checked');
      const genderText = genderInput ? (genderInput.value === 'female' ? 'Weiblich' : genderInput.value === 'male' ? 'Männlich' : 'Divers') : '-';
      document.getElementById('summary-gender').textContent = genderText;
      
      // Age, Weight, Height
      document.getElementById('summary-age').textContent = document.getElementById('age').value + ' Jahre' || '-';
      document.getElementById('summary-weight').textContent = document.getElementById('weight').value + ' kg' || '-';
      document.getElementById('summary-height').textContent = document.getElementById('height').value + ' cm' || '-';
      
      // Medications
      const medicationInputs = document.querySelectorAll('input[name="medication_name[]"]');
      const medications = [];
      medicationInputs.forEach(input => {
        if (input.value.trim()) {
          medications.push(input.value.trim());
        }
      });
      document.getElementById('summary-medications').textContent = medications.length > 0 ? medications.join(', ') : '-';
      
      // Duration
      const durationSelect = document.getElementById('duration-weeks');
      const durationText = durationSelect.options[durationSelect.selectedIndex]?.text || '-';
      document.getElementById('summary-duration').textContent = durationText;
    }
    
    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
      // Next buttons
      document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
          if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
              showStep(currentStep + 1);
            }
          }
        });
      });
      
      // Previous buttons
      document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function() {
          if (currentStep > 1) {
            showStep(currentStep - 1);
          }
        });
      });
      
      // Initialize: Show step 1
      showStep(1);
      
      // NOTE: Medication input fields are now managed by /static/app.js
      // All medication form logic (autocomplete, validation, dynamic fields) moved to frontend
      
      // ============================================================
      // NACH OBEN BUTTON (FAQ)
      // ============================================================
      const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
      if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      }
    });
  </script>
  
  <!-- Main Application Logic (API Integration, Loading Animation, PDF Generation) -->
  <script src="/static/app.js?v=${Date.now()}"></script>
</body>
</html>  `)
})

export default app
