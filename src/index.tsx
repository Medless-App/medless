import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

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
    const { medications, durationWeeks, email, firstName, gender, age, weight, height } = body;
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return c.json({ success: false, error: 'Bitte geben Sie mindestens ein Medikament an' }, 400);
    }
    
    if (!durationWeeks || durationWeeks < 1) {
      return c.json({ success: false, error: 'Bitte geben Sie eine gültige Dauer in Wochen an' }, 400);
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
          dosage: med.dosage || 'Nicht angegeben'
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
          warning: 'Medikament nicht in Datenbank gefunden'
        });
      }
    }
    
    // ========== CANNABINOID PASTE 70% DOSING CALCULATION ==========
    // Product: 3g Spritze mit 30 Teilstrichen
    // 1 Teilstrich = 1.5 cm = 70 mg Cannabinoids
    // 1 cm = 46.67 mg Cannabinoids
    
    const MG_PER_CM = 46.67;
    const adjustmentNotes: string[] = [];
    
    // Individualized dosing parameters based on interaction severity
    let titrationDays = 3;
    let startDosageMg = 9.3; // 0.2 cm
    let incrementMg = 5;
    let incrementDays = 3;
    let firstDoseTime = 'Abends (Verträglichkeitstest)';
    
    if (maxSeverity === 'critical' || maxSeverity === 'high') {
      titrationDays = 7;
      startDosageMg = 4.7; // 0.1 cm
      incrementMg = 2.5;
      incrementDays = 3;
      firstDoseTime = 'Abends (Sicherheit bei kritischen Wechselwirkungen)';
      adjustmentNotes.push('⚠️ Sehr vorsichtige Einschleichphase wegen kritischer Medikamenten-Wechselwirkungen');
    } else if (maxSeverity === 'medium') {
      titrationDays = 5;
      startDosageMg = 7; // 0.15 cm
      incrementMg = 4;
      incrementDays = 3;
      firstDoseTime = 'Abends (Sicherheit)';
      adjustmentNotes.push('⚠️ Vorsichtige Einschleichphase wegen Medikamenten-Wechselwirkungen');
    }
    
    // Age-based adjustments
    if (age && age >= 65) {
      startDosageMg *= 0.7;
      titrationDays += 2;
      adjustmentNotes.push('📅 Verlängerte Einschleichphase für Senioren (65+)');
    }
    
    // BMI-based adjustments
    if (weight && height && bmi) {
      if (bmi < 18.5) {
        startDosageMg *= 0.85;
        adjustmentNotes.push('⚖️ Dosierung angepasst: Untergewicht (BMI < 18.5)');
      } else if (bmi > 30) {
        startDosageMg *= 1.1;
        adjustmentNotes.push('⚖️ Dosierung angepasst: Übergewicht (BMI > 30)');
      }
    }
    
    // Weight-based target dose: 1 mg Cannabinoids per kg body weight
    const weightBasedTargetMg = weight ? weight * 1.0 : 50;
    const maxDosageMg = weight ? Math.min(weight * 2.5, 186) : 100;
    
    // Generate daily dosing plan
    const weeklyPlan = [];
    const totalDays = durationWeeks * 7;
    
    for (let day = 1; day <= totalDays; day++) {
      const week = Math.ceil(day / 7);
      
      let morningDosageMg = 0;
      let eveningDosageMg = 0;
      let notes = '';
      
      // Phase 1: Titration phase (evening only)
      if (day <= titrationDays) {
        eveningDosageMg = startDosageMg;
        morningDosageMg = 0;
        
        if (day === 1) {
          notes = `🌙 Einschleichphase: ${firstDoseTime}. Paste unter die Zunge legen, 2-3 Min einwirken lassen, dann schlucken.`;
        } else if (day === titrationDays) {
          notes = `🌅 Letzter Tag nur abends. Ab morgen: 2x täglich (Morgen + Abend) für optimale Endocannabinoid-System-Unterstützung`;
        } else {
          notes = '🌙 Einschleichphase: Nur abends einnehmen';
        }
      }
      // Phase 2: Twice daily with gradual increase
      else {
        const daysAfterTitration = day - titrationDays;
        const increments = Math.floor(daysAfterTitration / incrementDays);
        let currentDailyDose = startDosageMg + (increments * incrementMg);
        
        currentDailyDose = Math.min(currentDailyDose, weightBasedTargetMg);
        currentDailyDose = Math.min(currentDailyDose, maxDosageMg);
        
        // Split 40% morning, 60% evening
        morningDosageMg = currentDailyDose * 0.4;
        eveningDosageMg = currentDailyDose * 0.6;
        
        if (day === titrationDays + 1) {
          notes = '🌅🌙 Ab heute: 2x täglich (Morgen + Abend)';
        } else if (week === durationWeeks && day >= totalDays - 1) {
          notes = '✅ Ende der Aktivierungsphase - ärztliche Nachkontrolle empfohlen';
        } else if (increments > 0 && daysAfterTitration % incrementDays === 0) {
          notes = `📈 Dosierung erhöht auf ${Math.round(currentDailyDose * 10) / 10} mg täglich`;
        }
      }
      
      // Convert mg to cm (round to 0.05 cm precision)
      const morningCm = Math.round((morningDosageMg / MG_PER_CM) * 20) / 20;
      const eveningCm = Math.round((eveningDosageMg / MG_PER_CM) * 20) / 20;
      const totalCm = Math.round((morningCm + eveningCm) * 100) / 100;
      const totalMg = Math.round((morningDosageMg + eveningDosageMg) * 10) / 10;
      
      // Group by weeks
      const existingWeek = weeklyPlan.find((w: any) => w.week === week);
      if (!existingWeek) {
        weeklyPlan.push({
          week,
          days: [{
            day: day % 7 || 7,
            morningDosageCm: morningCm,
            eveningDosageCm: eveningCm,
            totalDailyCm: totalCm,
            morningDosageMg: Math.round(morningDosageMg * 10) / 10,
            eveningDosageMg: Math.round(eveningDosageMg * 10) / 10,
            totalDailyMg: totalMg,
            notes
          }]
        });
      } else {
        (existingWeek as any).days.push({
          day: day % 7 || 7,
          morningDosageCm: morningCm,
          eveningDosageCm: eveningCm,
          totalDailyCm: totalCm,
          morningDosageMg: Math.round(morningDosageMg * 10) / 10,
          eveningDosageMg: Math.round(eveningDosageMg * 10) / 10,
          totalDailyMg: totalMg,
          notes
        });
      }
    }
    
    return c.json({
      success: true,
      analysis: analysisResults,
      maxSeverity,
      weeklyPlan,
      product: {
        name: 'Cannabinoid-Paste 70%',
        type: 'Hochkonzentrierte Cannabinoid-Paste',
        packaging: '3 Gramm Spritze mit 30 Teilstrichen',
        concentration: '70 mg Cannabinoide pro Teilstrich (1.5 cm)',
        dosageUnit: 'cm auf der Spritze',
        application: 'Sublingual: Paste unter die Zunge legen, 2-3 Minuten einwirken lassen, dann schlucken'
      },
      personalization: {
        age,
        weight,
        height,
        bmi,
        bsa,
        titrationDays,
        firstDoseTime,
        startDosageMg: Math.round(startDosageMg * 10) / 10,
        targetDailyMg: Math.round(weightBasedTargetMg * 10) / 10,
        maxDailyMg: Math.round(maxDosageMg * 10) / 10,
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
  <title>ECS Aktivierung – CBD-Paste 70% Dosierungsplan</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

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
            Dieses Tool erstellt einen <strong>individualisierten Dosierungsplan</strong> für CBD-Paste 70% –
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

    <!-- TOOL -->
    <section id="tool">
      <h2>Erstellen Sie Ihren persönlichen CBD-Paste-Dosierungsplan</h2>
      <p class="muted">
        Wählen Sie, wie Sie Ihre Medikamente angeben möchten: manuell oder über ein Foto Ihres Medikamentenplans.
      </p>

      <div class="tool-wrapper">
        <!-- FORM LEFT -->
        <div class="form-card">
          <div class="tabs" role="tablist">
            <button class="tab-btn active" data-target="tab-manual" type="button">
              ✍️ Manuelle Eingabe
            </button>
            <button class="tab-btn" data-target="tab-photo" type="button">
              📷 Foto hochladen
            </button>
          </div>

          <!-- TAB: MANUAL -->
          <div id="tab-manual" class="tab-panel active">
            <form id="form-manual">
              <div class="form-row">
                <div>
                  <label for="firstName">Ihr Vorname *</label>
                  <input id="firstName" name="firstName" type="text" required />
                </div>
                <div>
                  <label>Geschlecht *</label>
                  <div class="inline-row">
                    <label class="radio-pill">
                      <input type="radio" name="gender" value="weiblich" required />
                      <span>Weiblich</span>
                    </label>
                    <label class="radio-pill">
                      <input type="radio" name="gender" value="männlich" />
                      <span>Männlich</span>
                    </label>
                    <label class="radio-pill">
                      <input type="radio" name="gender" value="divers" />
                      <span>Divers</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div>
                  <label for="age">Alter (Jahre) *</label>
                  <input id="age" name="age" type="number" min="1" max="120" required />
                  <div class="helper">Für altersgerechte Dosierung</div>
                </div>
                <div>
                  <label for="weight">Gewicht (kg) *</label>
                  <input id="weight" name="weight" type="number" min="30" max="250" required />
                  <div class="helper">In Kilogramm</div>
                </div>
                <div>
                  <label for="height">Größe (cm) *</label>
                  <input id="height" name="height" type="number" min="120" max="230" required />
                  <div class="helper">In Zentimetern</div>
                </div>
              </div>

              <div class="form-row">
                <div>
                  <label for="email">Ihre E-Mail-Adresse *</label>
                  <input id="email" name="email" type="email" required />
                  <div class="helper">
                    Hierhin schicken wir den Download-Link zu Ihrem Dosierungsplan.
                  </div>
                </div>
              </div>

              <!-- MEDIKAMENTE -->
              <div class="form-row">
                <div>
                  <label>Ihre Medikamente</label>
                  <div id="med-list">
                    <!-- wird per JS mit Zeilen gefüllt -->
                  </div>
                  <button class="btn-small" type="button" id="btn-add-med">
                    + Weiteres Medikament hinzufügen
                  </button>
                  <div class="helper">
                    Tragen Sie alle regelmäßig eingenommenen Medikamente ein (Name + Dosierung).
                  </div>
                </div>
              </div>

              <!-- DAUER -->
              <div class="form-row">
                <div>
                  <label for="duration">Gewünschte Aktivierungsdauer (Wochen)</label>
                  <input id="duration" name="duration" type="number" min="4" max="24" value="8" />
                  <div class="helper">Empfohlen: 8–12 Wochen für nachhaltige ECS-Aktivierung.</div>
                </div>
              </div>

              <button class="btn-primary" type="submit">
                CBD-Paste-Dosierungsplan erstellen
              </button>
              <div class="helper" style="margin-top: 0.5rem;">
                Hinweis: Die Berechnung erfolgt automatisch. Den fertigen Plan können Sie als PDF speichern.
              </div>
            </form>
          </div>

          <!-- TAB: PHOTO -->
          <div id="tab-photo" class="tab-panel">
            <form id="form-photo">
              <div class="form-row">
                <div>
                  <label for="firstNamePhoto">Ihr Vorname *</label>
                  <input id="firstNamePhoto" name="firstNamePhoto" type="text" required />
                </div>
              </div>

              <div class="form-row">
                <div>
                  <label for="emailPhoto">Ihre E-Mail-Adresse *</label>
                  <input id="emailPhoto" name="emailPhoto" type="email" required />
                </div>
              </div>

              <div class="form-row">
                <div>
                  <label>Foto Ihres Medikamentenplans *</label>
                  <div class="upload-box">
                    <div><strong>Foto hochladen</strong></div>
                    <div class="helper">JPG oder PNG, max. 10 MB</div>
                    <input
                      id="medPlanPhoto"
                      name="medPlanPhoto"
                      type="file"
                      accept="image/png, image/jpeg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div>
                  <label for="durationPhoto">Gewünschte Aktivierungsdauer (Wochen)</label>
                  <input id="durationPhoto" name="durationPhoto" type="number" min="4" max="24" value="8" />
                </div>
              </div>

              <button class="btn-primary" type="submit">
                Bild analysieren & Dosierungsplan erstellen
              </button>
              <div class="helper" style="margin-top: 0.5rem;">
                Das System liest die Medikamente aus Ihrem Foto aus und schlägt eine passende CBD-Paste-Dosierung vor.
              </div>
            </form>
          </div>
        </div>

        <!-- TEXT RECHTS -->
        <div class="card">
          <span class="tag-small">Was das Tool berücksichtigt</span>
          <h3>Medikamenten-Analyse & Wechselwirkungen</h3>
          <p class="muted">
            Besonders aufmerksam prüft das System u. a. folgende Gruppen:
          </p>
          <ul class="hero-list" style="margin-top: 0.3rem;">
            <li>Blutverdünner (z. B. Marcumar, Xarelto)</li>
            <li>Immunsuppressiva</li>
            <li>Opioide & starke Schmerzmittel</li>
            <li>Benzodiazepine & beruhigende Medikamente</li>
          </ul>
          <p class="muted">
            Bei kritischen Kombinationen wird eine <strong>besonders vorsichtige Einschleichphase</strong> empfohlen,
            die Sie unbedingt mit Ihrem Arzt besprechen sollten.
          </p>
          <p class="note" style="margin-top: 0.5rem;">
            Alle Empfehlungen sind unverbindlich und ersetzen keine individuelle ärztliche Beurteilung.
          </p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section>
      <h2>Häufig gestellte Fragen (FAQ)</h2>
      <div class="faq">
        <details>
          <summary>Wie genau aktivieren exogene Cannabinoide mein Endocannabinoid-System?</summary>
          <p>
            CBD greift an mehreren Stellen in die körpereigene Regulation ein – unter anderem über das
            Endocannabinoid-System und bestimmte Rezeptoren im Nervensystem. Vereinfacht gesagt kann es
            helfen, körpereigene Botenstoffe zu stabilisieren und Entzündungen zu dämpfen.
          </p>
        </details>

        <details>
          <summary>Kann ich wirklich Medikamente reduzieren?</summary>
          <p>
            Viele Menschen berichten, dass sie unter ärztlicher Begleitung ihre Medikation reduzieren konnten,
            wenn das ECS stabiler wird. Ob und in welchem Ausmaß das bei Ihnen möglich ist, kann nur Ihr behandelnder
            Arzt entscheiden. Dieses Tool hilft Ihnen lediglich, die Einnahme von CBD-Paste strukturiert zu planen.
          </p>
        </details>

        <details>
          <summary>Wie lange dauert es, bis ich etwas merke?</summary>
          <p>
            Erste Effekte können bereits nach wenigen Tagen spürbar sein, die nachhaltige Stabilisierung des ECS dauert
            meist mehrere Wochen. Deshalb empfehlen wir in der Regel 8–12 Wochen regelmäßige Einnahme.
          </p>
        </details>

        <details>
          <summary>Ist CBD abhängig machend?</summary>
          <p>
            CBD hat kein typisches Suchtpotenzial und macht nicht „high". Dennoch sollten Sie die Einnahme immer mit
            Ihrem Arzt besprechen, insbesondere wenn bereits andere Medikamente eingenommen werden.
          </p>
        </details>

        <details>
          <summary>Was mache ich mit dem fertigen Dosierungsplan?</summary>
          <p>
            Drucken Sie den Plan aus oder nehmen Sie ihn digital mit zum Arzttermin.
            Besprechen Sie dort, ob die vorgeschlagenen Dosen und Schritte für Sie geeignet sind
            und wie Ihre Medikation ggf. angepasst werden kann.
          </p>
        </details>
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
</body>
</html>  `)
})

export default app
