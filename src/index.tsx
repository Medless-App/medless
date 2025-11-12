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

// Get CBD interactions for specific medication
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

// Analyze medications and generate CBD PASTE 70% DOSING PLAN
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
    
    // ========== CBD PASTE 70% DOSING CALCULATION ==========
    // Product: 3g Spritze mit 30 Teilstrichen
    // 1 Teilstrich = 1.5 cm = 70 mg CBD
    // 1 cm = 46.67 mg CBD
    
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
    
    // Weight-based target dose: 1 mg CBD per kg body weight
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
        name: 'CBD-Paste 70%',
        type: 'Hochkonzentrierte Cannabinoid-Paste',
        packaging: '3 Gramm Spritze mit 30 Teilstrichen',
        concentration: '70 mg CBD pro Teilstrich (1.5 cm)',
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
        ['⚠️ Kritische Wechselwirkungen erkannt!', 'Konsultieren Sie unbedingt einen Arzt vor der CBD-Einnahme.'] : []
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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medikamente strukturiert reduzieren - ECS Aktivierung</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          :root {
            --primary: #0f766e;      /* Teal-700 - Medical trustworthy */
            --primary-light: #14b8a6; /* Teal-500 */
            --primary-dark: #115e59;  /* Teal-800 */
            --accent: #059669;        /* Emerald-600 - Nature/Cannabis */
            --warning: #dc2626;       /* Red-600 - Critical warnings */
            --info: #0891b2;          /* Cyan-600 - Information */
            --neutral: #64748b;       /* Slate-500 */
            --bg-subtle: #f8fafc;     /* Slate-50 */
          }
          
          html {
            scroll-behavior: smooth;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeIn 0.6s ease-out; }
          
          .card-hover {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          
          .autocomplete-list {
            animation: fadeIn 0.2s ease-out;
          }
          .autocomplete-item {
            transition: background-color 0.15s ease;
          }
          .autocomplete-item:last-child {
            border-bottom: none;
          }
          
          /* Professional medical design */
          .section-card {
            background: white;
            border-left: 4px solid var(--primary);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .info-box {
            background: #f0fdfa;
            border: 1px solid #99f6e4;
          }
          
          .warning-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
          }
        </style>
    </head>
    <body class="bg-slate-50">
        <!-- Header -->
        <header class="bg-gradient-to-r from-teal-700 to-teal-800 text-white py-12 shadow-md">
            <div class="max-w-6xl mx-auto px-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl md:text-4xl lg:text-4xl font-bold mb-4 leading-tight whitespace-nowrap">
                            <i class="fas fa-leaf mr-3 text-teal-300"></i>
                            Strukturiert Medikamente reduzieren
                        </h1>
                        <p class="text-teal-100 text-base md:text-lg font-light leading-relaxed max-w-3xl">Ihr körpereigenes Endocannabinoid-System als Partner – für einen gut geplanten Weg zu weniger Medikamenten.</p>
                    </div>
                    <div class="text-right hidden md:block">
                        <a href="#dosierungsplan-erstellen" class="block bg-white/10 backdrop-blur-sm rounded-lg px-5 py-3 border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                            <i class="fas fa-heart-pulse mr-2 text-teal-300"></i>
                            <span class="text-sm font-medium">Medikamenten-Reduktion</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-6xl mx-auto px-4 py-8">
            
            <!-- Hero Section: The Problem -->
            <div class="section-card p-8 mb-8 rounded-lg fade-in">
                <div class="flex items-start gap-6">
                    <div class="flex-shrink-0">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-pills text-red-600 text-2xl"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">
                            Zu viele Tabletten? Sie sind nicht allein.
                        </h2>
                        <p class="text-gray-700 text-base mb-6 leading-relaxed">
                            Millionen Menschen in Deutschland und Österreich nehmen täglich Medikamente – oft mehrere gleichzeitig. Viele möchten ihre <strong>Medikation reduzieren</strong> oder sogar <strong>komplett ausschleichen</strong>, wissen aber nicht, wie sie das sicher angehen können.
                        </p>
                        <div class="info-box p-4 rounded-lg">
                            <p class="text-gray-800 font-semibold mb-2 text-sm uppercase tracking-wide text-teal-700">
                                Die zentrale Frage:
                            </p>
                            <p class="text-gray-900 text-lg font-medium">
                                "Wie kann ich Schritt für Schritt weniger Medikamente nehmen – mit natürlicher Unterstützung durch mein Endocannabinoid-System?"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- The Solution: Strong ECS -->
            <div class="section-card p-8 mb-8 rounded-lg fade-in">
                <div class="flex items-start gap-6">
                    <div class="flex-shrink-0">
                        <div class="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-heart-pulse text-teal-700 text-2xl"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">
                            Die Lösung: Ein starkes Endocannabinoid-System (ECS)
                        </h2>
                        <p class="text-gray-700 text-base mb-6 leading-relaxed">
                            Ihr Körper verfügt über ein leistungsstarkes, <strong>körpereigenes Regulationssystem</strong> – das <strong>Endocannabinoid-System (ECS)</strong>. Es wirkt an zahlreichen Schaltstellen des Körpers und beeinflusst Funktionen wie Schmerzempfinden, Stimmung, Schlaf, Entzündungsprozesse und das Immunsystem – <strong>also genau jene Bereiche, in denen häufig Medikamente eingesetzt werden.</strong>
                        </p>
                        
                        <div class="grid md:grid-cols-2 gap-6 mb-6">
                            <div class="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                <h3 class="font-semibold text-gray-900 mb-4 text-base">
                                    Ein gesundes ECS kann:
                                </h3>
                                <ul class="text-gray-700 space-y-2.5 text-sm">
                                    <li class="flex items-start">
                                        <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                        <span><strong>Schmerzen natürlich regulieren</strong> (statt Schmerzmittel)</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                        <span><strong>Stimmung stabilisieren</strong> (statt Antidepressiva)</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                        <span><strong>Schlaf verbessern</strong> (statt Schlafmittel)</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                        <span><strong>Entzündungen hemmen</strong> (statt Cortison)</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                        <span><strong>Immunsystem stärken</strong> (statt Immunsuppressiva)</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="bg-slate-50 p-6 rounded-lg border border-slate-200">
                                <h3 class="font-semibold text-gray-900 mb-4 text-base">
                                    Modernes Leben schwächt Ihr ECS:
                                </h3>
                                <ul class="text-gray-700 space-y-2.5 text-sm">
                                    <li class="flex items-start">
                                        <span class="text-slate-400 mr-2 mt-0.5">•</span>
                                        <span><strong>Medikamente</strong> können die ECS-Funktion beeinflussen</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-slate-400 mr-2 mt-0.5">•</span>
                                        <span><strong>Chronischer Stress</strong> erschöpft Endocannabinoide</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-slate-400 mr-2 mt-0.5">•</span>
                                        <span><strong>Unausgewogene Ernährung</strong> (z. B. viel Omega-6-Fette)</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-slate-400 mr-2 mt-0.5">•</span>
                                        <span><strong>Bewegungsmangel</strong></span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-slate-400 mr-2 mt-0.5">•</span>
                                        <span><strong>Umweltgifte</strong> (z. B. Pestizide, Plastik-Weichmacher)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="info-box p-6 rounded-lg">
                            <h3 class="font-semibold text-gray-900 mb-3 text-base">
                                Das Konzept der klinischen Endocannabinoid-Defizienz (CED):
                            </h3>
                            <p class="text-gray-700 text-base leading-relaxed mb-4">
                                Forschende diskutieren das Konzept einer sogenannten <strong>klinischen Endocannabinoid-Defizienz (CED)</strong>. Die Idee dahinter: Wenn das ECS langfristig belastet ist und der Körper zu wenig eigene Endocannabinoide bildet, könnte seine Fähigkeit zur Selbstregulation eingeschränkt sein.
                            </p>
                            
                            <p class="text-gray-700 text-sm mb-3 font-semibold">
                                Mögliche Folgen, die in diesem Zusammenhang diskutiert werden:
                            </p>
                            
                            <ul class="text-gray-700 space-y-2 text-sm mb-4">
                                <li class="flex items-start">
                                    <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                    <span>Chronische Schmerzen (z. B. Migräne, Fibromyalgie)</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                    <span>Angststörungen und depressive Verstimmungen</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                    <span>Schlafstörungen und Erschöpfung</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                    <span>Entzündliche Erkrankungen</span>
                                </li>
                                <li class="flex items-start">
                                    <span class="text-teal-600 mr-2 mt-0.5">•</span>
                                    <span>Autoimmunerkrankungen</span>
                                </li>
                            </ul>
                            
                            <p class="text-gray-600 text-xs italic border-t border-gray-200 pt-3">
                                <i class="fas fa-info-circle mr-1 text-teal-600"></i>
                                Dieses Konzept wird wissenschaftlich erforscht – gesicherte Antworten gibt es noch nicht in allen Bereichen.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- The Method: Exogenous Cannabinoids -->
            <div class="section-card p-8 mb-8 rounded-lg fade-in">
                <div class="flex items-start gap-6">
                    <div class="flex-shrink-0">
                        <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-leaf text-emerald-700 text-2xl"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">
                            Der Weg: Exogene Cannabinoide stärken Ihr ECS
                        </h2>
                        <p class="text-gray-700 text-base mb-6 leading-relaxed">
                            Wenn Ihr Körper vorübergehend nicht genügend eigene Endocannabinoide zur Verfügung hat, können <strong>exogene Cannabinoide</strong> (von außen zugeführt) das System unterstützen. Diese Pflanzenstoffe binden an ähnliche Rezeptoren oder beeinflussen dieselben Signalwege wie körpereigene Endocannabinoide – und können so helfen, die <strong>ECS-Aktivität zu modulieren</strong>.
                        </p>
                        
                        <!-- Scientific Evidence Section - Expanded 10 Points -->
                        <div class="bg-gradient-to-br from-teal-50 to-emerald-50 p-8 rounded-xl border-2 border-teal-200 mb-6 shadow-sm">
                            <div class="text-center mb-6">
                                <h3 class="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                                    <span class="text-3xl">🧬</span>
                                    Wissenschaftlich belegt – einfach erklärt
                                </h3>
                                <p class="text-sm text-gray-600 italic">Klicken Sie auf einen Bereich, um mehr zu erfahren</p>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4">
                                <!-- 1. Schmerzregulation -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">💊</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">1. Schmerzregulation</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Bremst Schmerzsignale im Nervensystem</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Cannabinoide unterstützen das Nervensystem dabei, <strong>Schmerzreize weniger stark weiterzuleiten</strong>.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Dadurch kann der Körper Schmerzen gedämpfter wahrnehmen und sich besser entspannen.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Zudem fördern Cannabinoide natürliche Prozesse, die <strong>Entzündungen beruhigen</strong> – häufige Ursachen für chronische Schmerzen.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Starowicz & Finn, British Journal of Pharmacology, 2017 – „Cannabinoids and Pain: Sites and Mechanisms of Action"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 2. Entzündungshemmung -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">🔥</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">2. Entzündungshemmung</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Beruhigt überaktive Immunreaktionen</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Cannabinoide helfen dem Körper, <strong>übermäßige Entzündungsreaktionen zu bremsen</strong>.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Sie wirken wie eine natürliche Bremse im Immunsystem und können Schwellungen, Rötungen und Schmerzen verringern.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            So unterstützen sie die <strong>Regeneration</strong> und das allgemeine Wohlbefinden.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Nagarkatti et al., Future Medicinal Chemistry, 2009 – „Cannabinoids as Novel Anti-Inflammatory Drugs"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 3. Angst & innere Ruhe -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">🧘</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">3. Angst & innere Ruhe</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Fördert Serotonin-Bildung</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Cannabinoide wirken <strong>ausgleichend auf das Stresssystem</strong>.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Sie können die Ausschüttung von Stresshormonen verringern und helfen, innere Ruhe und Gelassenheit zu fördern.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Das führt häufig zu mehr <strong>emotionaler Stabilität</strong> und einem ruhigeren Grundgefühl.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Blessing et al., Neurotherapeutics, 2015 – „Cannabidiol as a Potential Treatment for Anxiety Disorders"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 4. Schlafqualität -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">😴</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">4. Schlafqualität</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Stabilisiert Tag-Nacht-Rhythmus</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Das Endocannabinoid-System unterstützt den Körper dabei, den <strong>natürlichen Schlaf-Wach-Rhythmus im Gleichgewicht zu halten</strong>.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Wenn es gut funktioniert, fällt das Einschlafen leichter, der Schlaf wird tiefer und der Körper kann sich besser erholen.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Babson, Sottile & Morabito, Current Psychiatry Reports, 2017 – „Cannabis, Cannabinoids, and Sleep: A Review of the Literature"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 5. Stimmung & Wohlbefinden -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">😊</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">5. Stimmung & Wohlbefinden</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Gleicht Emotionen aus</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Cannabinoide unterstützen das <strong>emotionale Gleichgewicht</strong>, indem sie Botenstoffe wie Serotonin und Dopamin beeinflussen.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Ein aktives Endocannabinoid-System kann helfen, Stimmungsschwankungen zu verringern und das allgemeine Wohlbefinden zu stärken.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Hill & Gorzalka, Neuroscience & Biobehavioral Reviews, 2009 – „The Endocannabinoid System and the Regulation of Mood and Emotion"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 6. Immunsystem -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">🛡️</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">6. Immunsystem</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Reguliert Abwehrreaktionen</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Das Endocannabinoid-System sorgt dafür, dass das Immunsystem nicht überreagiert, aber trotzdem aktiv bleibt.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Cannabinoide können diese Balance unterstützen – sie helfen, <strong>übermäßige Immunreaktionen zu beruhigen</strong> und die Abwehr im Gleichgewicht zu halten.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Klein, Nature Reviews Immunology, 2005 – „Cannabinoid Signaling in Immune Regulation and Neuroinflammation"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 7. Temperaturregulation -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">🌡️</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">7. Temperaturregulation</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Hält innere Temperatur konstant</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Unser Körper hält eine konstante Temperatur – und das ECS spielt dabei mit.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Cannabinoide unterstützen diesen natürlichen Mechanismus und helfen dem Körper, <strong>Temperaturschwankungen besser auszugleichen</strong>, etwa bei Stress, Fieber oder hormonellen Veränderungen.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Pacher, Bátkai & Kunos, Pharmacological Reviews, 2006 – „The Endocannabinoid System as an Emerging Target of Pharmacotherapy"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 8. Verdauung & Appetit -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">🍽️</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">8. Verdauung & Appetit</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Harmonisiert Magen-Darm-Trakt</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Im Verdauungssystem befinden sich viele Rezeptoren des ECS.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Cannabinoide können helfen, <strong>Übelkeit zu lindern, Appetit zu regulieren und die Verdauung zu harmonisieren</strong> – besonders, wenn das Gleichgewicht im Magen-Darm-Trakt gestört ist.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Izzo & Sharkey, Nature Reviews Gastroenterology & Hepatology, 2010 – „Cannabinoids and the Digestive Tract"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 9. Stressbewältigung -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">🌊</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">9. Stressbewältigung</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Beendet Stressreaktionen schneller</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Das Endocannabinoid-System sorgt dafür, dass der Körper nach Belastungen wieder zur Ruhe findet.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Cannabinoide unterstützen diesen Prozess, indem sie die <strong>natürliche Stressregulation stärken</strong> und helfen, schneller in einen entspannten Zustand zurückzukehren.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Patel et al., Neuropharmacology, 2009 – „Endocannabinoid Signaling and the Stress Response"</span>
                                        </div>
                                    </div>
                                </details>

                                <!-- 10. Körperliche Balance (Homöostase) -->
                                <details class="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden group">
                                    <summary class="cursor-pointer p-4 hover:bg-teal-50 transition-colors list-none">
                                        <div class="flex items-center gap-3">
                                            <span class="text-2xl flex-shrink-0">⚖️</span>
                                            <div class="flex-1">
                                                <h4 class="font-semibold text-gray-900 text-sm">10. Körperliche Balance (Homöostase)</h4>
                                                <p class="text-xs text-gray-500 mt-0.5">Inneres Gleichgewichtssystem</p>
                                            </div>
                                            <i class="fas fa-chevron-down text-teal-600 text-xs group-open:rotate-180 transition-transform"></i>
                                        </div>
                                    </summary>
                                    <div class="p-4 pt-0 border-t border-teal-50">
                                        <p class="text-sm text-gray-700 leading-relaxed mb-2">
                                            Das Endocannabinoid-System wirkt wie ein <strong>inneres Gleichgewichtssystem</strong>.
                                        </p>
                                        <p class="text-sm text-gray-700 leading-relaxed mb-3">
                                            Es verbindet Gehirn, Organe, Immunsystem und Hormone miteinander – damit der Körper <strong>stabil, ausgeglichen und anpassungsfähig</strong> bleibt, auch bei äußeren Belastungen.
                                        </p>
                                        <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded text-xs">
                                            <span class="text-emerald-600">🟢</span>
                                            <span class="text-gray-600"><strong>Quelle:</strong> Pacher, Bátkai & Kunos, Pharmacological Reviews, 2006 – „The Endocannabinoid System as an Emerging Target of Pharmacotherapy"</span>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                        
                        <!-- NEW: Positive Drug Interactions Highlight -->
                        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border-l-4 border-emerald-500 mb-6">
                            <h4 class="font-semibold text-gray-900 mb-3 text-base flex items-center gap-2">
                                <span class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">+</span>
                                Der überraschende Vorteil: Wechselwirkungen können auch positiv sein!
                            </h4>
                            <p class="text-gray-700 text-sm mb-3 leading-relaxed">
                                Sie haben richtig gehört: Die oft gefürchteten <strong>Wechselwirkungen zwischen CBD und Medikamenten</strong> haben auch eine <strong>positive Seite</strong>, die gezielt zur Medikamenten-Reduktion genutzt werden kann.
                            </p>
                            
                            <div class="bg-white p-4 rounded-lg mb-3">
                                <h5 class="font-semibold text-gray-900 mb-2 text-sm">So funktioniert's:</h5>
                                <p class="text-xs text-gray-700 mb-2">
                                    CBD hemmt bestimmte <strong>Leber-Enzyme (CYP450-System)</strong>, die für den Abbau von etwa <strong>60% aller Medikamente</strong> verantwortlich sind. Das bedeutet:
                                </p>
                                <ul class="text-xs text-gray-700 space-y-1.5 ml-4">
                                    <li class="flex items-start">
                                        <span class="text-emerald-600 mr-2 mt-0.5">✓</span>
                                        <span><strong>Medikamente bleiben länger im Blut</strong> – die Wirkdauer verlängert sich</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-emerald-600 mr-2 mt-0.5">✓</span>
                                        <span><strong>Dosierung kann reduziert werden</strong> – bei gleicher oder besserer Wirkung</span>
                                    </li>
                                    <li class="flex items-start">
                                        <span class="text-emerald-600 mr-2 mt-0.5">✓</span>
                                        <span><strong>Weniger Medikament = weniger Belastung</strong> für Leber und Nieren</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div class="bg-emerald-100 p-4 rounded-lg">
                                <h5 class="font-semibold text-emerald-900 mb-2 text-sm">Praxis-Beispiel: Clobazam (Frisium®) und CBD</h5>
                                <p class="text-xs text-gray-700 mb-2">
                                    Clobazam wird häufig bei <strong>Epilepsie</strong> eingesetzt. Studien zeigen, dass Cannabinoide – insbesondere CBD – den <strong>Abbau des Wirkstoffs in der Leber verlangsamen</strong> können. Dadurch steigt der Anteil des aktiven Abbauprodukts im Blut, und die Wirkung kann sich verstärken.
                                </p>
                                <p class="text-xs text-gray-700 mb-3">
                                    Typische Begleiterscheinungen sind stärkere Müdigkeit oder Benommenheit, weshalb Ärztinnen und Ärzte in solchen Fällen oft die <strong>Clobazam-Dosis anpassen</strong>.
                                </p>
                                <div class="bg-red-50 border-l-3 border-red-500 p-3 rounded">
                                    <p class="text-xs text-red-900 font-semibold mb-1">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>
                                        Wichtig:
                                    </p>
                                    <p class="text-xs text-red-800">
                                        Cannabinoide dürfen bei Clobazam-Therapie nur in <strong>ärztlicher Absprache</strong> eingesetzt werden. Bei verstärkter Müdigkeit oder Schwindel immer Rücksprache halten – <strong>Medikamente niemals eigenmächtig verändern</strong>.
                                    </p>
                                </div>
                            </div>
                            
                            <p class="text-xs text-gray-600 mt-3 italic">
                                <strong>Wichtig:</strong> Unser Tool berechnet genau diese Wechselwirkungen mit ein und passt die CBD-Startdosis entsprechend an. So nutzen wir die positive Seite der Wechselwirkungen für eine sichere Medikamenten-Reduktion.
                            </p>
                        </div>
                        
                        <div class="info-box p-5 rounded-lg">
                            <h4 class="font-semibold text-gray-900 mb-2 text-base">
                                Das Ziel: Medikamenten-Reduktion durch starkes ECS
                            </h4>
                            <p class="text-gray-700 text-sm">
                                Wenn Ihr Endocannabinoid-System wieder <strong>im Gleichgewicht ist</strong>, kann Ihr Körper viele Aufgaben selbst regulieren – also genau die Prozesse, für die heute oft Medikamente notwendig sind. Unter ärztlicher Begleitung können Sie so Schritt für Schritt <strong>Ihre Medikation reduzieren oder sogar ausschleichen</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Our Tool: Safe Entry -->
            <div class="section-card p-8 mb-8 rounded-lg fade-in">
                <div class="flex items-start gap-6">
                    <div class="flex-shrink-0">
                        <div class="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-shield-heart text-cyan-700 text-2xl"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">
                            Ihre KI-gestützte Unterstützung für einen sicheren Einstieg
                        </h2>
                        <p class="text-gray-700 text-base mb-3 leading-relaxed">
                            Im Hintergrund arbeitet eine <strong>speziell entwickelte KI</strong>, die auf Basis Ihrer Daten einen maßgeschneiderten Einstieg mit Cannabinoiden berechnet.
                        </p>
                        <p class="text-gray-700 text-base mb-6 leading-relaxed">
                            Sie vergleicht Wechselwirkungen, analysiert Dosierungsmuster und erstellt daraus einen <strong>präzisen Tag-für-Tag-Plan</strong> – damit Sie gemeinsam mit Ihrem Arzt Schritt für Schritt sicher starten können.
                        </p>
                        
                        <div class="grid md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                                    <i class="fas fa-microscope text-teal-700 text-lg"></i>
                                </div>
                                <h4 class="font-semibold text-gray-900 mb-2 text-sm">Medikamenten-Analyse</h4>
                                <p class="text-xs text-gray-600">Die KI erkennt bekannte Wechselwirkungen und simuliert, wie Cannabinoide mit Ihren Medikamenten reagieren könnten. So erhalten Sie eine präzise Übersicht für das Gespräch mit Ihrer Ärztin oder Ihrem Arzt.</p>
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                                    <i class="fas fa-user-md text-teal-700 text-lg"></i>
                                </div>
                                <h4 class="font-semibold text-gray-900 mb-2 text-sm">Individuelle Dosierung</h4>
                                <p class="text-xs text-gray-600">Auf Basis Ihrer Körperdaten und bisherigen Medikation berechnet die KI eine empfohlene Startdosis und schlägt eine sanfte Steigerung vor – wissenschaftlich fundiert und nachvollziehbar.</p>
                            </div>
                            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                                    <i class="fas fa-calendar-check text-teal-700 text-lg"></i>
                                </div>
                                <h4 class="font-semibold text-gray-900 mb-2 text-sm">Tag-für-Tag-Plan</h4>
                                <p class="text-xs text-gray-600">Ihr persönlicher Einschleich- und Erhaltungsplan wird automatisch generiert – inklusive Erinnerungen, Anpassungshinweisen und ECS-Balance-Check. So behalten Sie den Überblick und wissen jeden Tag, wie Sie richtig vorgehen.</p>
                            </div>
                        </div>
                        
                        <div class="warning-box p-5 rounded-lg border-l-4 border-red-400">
                            <h4 class="font-semibold text-gray-900 mb-3 text-base flex items-center gap-2">
                                <i class="fas fa-exclamation-triangle text-red-600"></i>
                                Wichtig: Ärztliche Begleitung ist Voraussetzung
                            </h4>
                            <p class="text-gray-700 mb-2 text-sm">
                                Der Plan wird <strong>KI-gestützt berechnet</strong>, ersetzt jedoch <strong>keine ärztliche Beratung</strong>.
                            </p>
                            <p class="text-gray-700 mb-4 text-sm">
                                Er soll Sie <strong>informiert und vorbereitet</strong> in Ihr Arztgespräch bringen. Medikamentenänderungen dürfen <strong>ausschließlich unter ärztlicher Aufsicht</strong> erfolgen.
                            </p>
                            <div class="bg-red-50 p-3 rounded-lg">
                                <p class="text-gray-800 font-semibold mb-2 text-xs">Empfohlen:</p>
                                <ul class="text-gray-700 space-y-1.5 ml-5 list-disc text-xs">
                                    <li>Plan mitnehmen und gemeinsam besprechen</li>
                                    <li>Medikamente nie selbstständig anpassen</li>
                                    <li>Auf mögliche Reaktionen achten (z. B. Müdigkeit, Schwindel, Blutungsneigung)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            

            <!-- The Journey: From Medication to Strong ECS -->
            <div class="section-card p-8 mb-8 rounded-lg fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Ihr Weg: Schritt für Schritt zu weniger Medikamenten – und einem starken ECS
                </h2>
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 text-center">
                        <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-pills text-red-600 text-lg"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 text-sm">1. Status Quo</h4>
                        <p class="text-xs text-gray-600">Ungleichgewicht im ECS → Hoher Medikamentenbedarf</p>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 text-center">
                        <div class="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-leaf text-teal-700 text-lg"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 text-sm">2. ECS Stärken</h4>
                        <p class="text-xs text-gray-600">Cannabinoide zuführen – das ECS aktiv unterstützen</p>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 text-center">
                        <div class="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-chart-line text-emerald-700 text-lg"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 text-sm">3. Medikamente reduzieren</h4>
                        <p class="text-xs text-gray-600">Medikamente sanft und sicher reduzieren</p>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 text-center">
                        <div class="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-heart text-teal-700 text-lg"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 mb-2 text-sm">4. Starkes ECS</h4>
                        <p class="text-xs text-gray-600">Ein starkes ECS – natürliche Balance im Körper</p>
                    </div>
                </div>
                <div class="mt-6 bg-slate-50 p-5 rounded-lg text-center border border-slate-200">
                    <p class="text-gray-800 text-base font-semibold mb-2">
                        Jetzt berechnen: Ihr individueller Plan für weniger Medikamente
                    </p>
                    <p class="text-xs text-gray-500 italic">
                        Unterstützt durch ärztliche Expertise – entwickelt zur sicheren, begleiteten Medikamentenreduktion
                    </p>
                </div>
            </div>
            
            <!-- FAQ Section: Häufig gestellte Fragen -->
            <div class="section-card p-8 mb-8 rounded-lg fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div class="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-question-circle text-teal-700 text-lg"></i>
                    </div>
                    <span>Häufig gestellte Fragen</span>
                </h2>
                
                <!-- FAQ 1: Wie exogene Cannabinoide ECS aktivieren -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Wie aktivieren exogene Cannabinoide mein Endocannabinoid-System?</span>
                    </summary>
                    <div class="mt-4 pl-8 text-gray-700 leading-relaxed">
                        <div class="bg-slate-50 p-5 rounded-lg mb-4 border border-slate-200">
                            <h4 class="font-semibold text-gray-900 mb-3 text-sm">
                                Der biochemische Mechanismus:
                            </h4>
                            <p class="text-xs mb-3">
                                CBD (Cannabidiol) wirkt auf mehrere Arten in Ihrem Körper:
                            </p>
                            <ul class="text-xs space-y-2">
                                <li class="flex items-start"><span class="text-teal-600 mr-2 mt-1">•</span><span><strong>Hemmt FAAH-Enzym:</strong> Verhindert den Abbau von Anandamid (körpereigenes "Glücks-Endocannabinoid"), sodass mehr davon im Körper verfügbar bleibt</li>
                                <li class="flex items-start"><span class="text-teal-600 mr-2 mt-1">•</span><span><strong>Aktiviert Serotonin-Rezeptoren (5-HT1A):</strong> Wirkt angstlösend und stimmungsaufhellend – ähnlich wie Antidepressiva</li>
                                <li class="flex items-start"><span class="text-teal-600 mr-2 mt-1">•</span><span><strong>Moduliert CB1/CB2-Rezeptoren:</strong> Indirekte Aktivierung des ECS ohne psychoaktive Wirkung</li>
                                <li class="flex items-start"><span class="text-teal-600 mr-2 mt-1">•</span><span><strong>Hemmt Entzündungen:</strong> Reduziert COX-2 und NF-κB (entzündungsfördernde Enzyme)</li>
                                <li class="flex items-start"><span class="text-teal-600 mr-2 mt-1">•</span><span><strong>Antioxidative Wirkung:</strong> Schützt Nervenzellen vor oxidativem Stress</span></li>
                            </ul>
                        </div>
                        <div class="info-box p-4 rounded-lg">
                            <p class="text-xs">
                                <strong>Wichtig:</strong> CBD hat <strong>keine psychoaktive Wirkung</strong>, macht nicht "high" und ist <strong>nicht abhängigkeitsbildend</strong>.
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 2: Welche Medikamente sind gefährlich? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Bei welchen Medikamenten sind Wechselwirkungen mit CBD besonders gefährlich?</span>
                    </summary>
                    <div class="mt-4 pl-8 text-gray-700 leading-relaxed">
                        <div class="warning-box p-5 rounded-lg mb-4 border-l-4 border-red-400">
                            <h4 class="font-semibold text-gray-900 mb-3 text-sm">
                                Kritische Medikamentengruppen:
                            </h4>
                            <ul class="text-xs space-y-2.5">
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Blutverdünner (Antikoagulanzien):</strong> Warfarin/Marcumar, Xarelto, Eliquis – CBD kann die Blutgerinnung weiter hemmen → Blutungsrisiko erhöht</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Immunsuppressiva:</strong> Sandimmun (Ciclosporin), Prograf (Tacrolimus) – CBD kann Wirkspiegel erhöhen → Toxizität möglich</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Opioide:</strong> OxyContin, Tramadol, Morphin – CBD + Opioide kann zu übermäßiger Sedierung führen → Atemdepression</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Benzodiazepine:</strong> Tavor (Lorazepam), Valium (Diazepam), Rivotril – Verstärkte Müdigkeit, Sturzgefahr bei älteren Menschen</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Antidepressiva & Antipsychotika:</strong> Verstärkung der sedierenden Wirkung, mögliche CYP450-Interaktionen</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Herzrhythmus-Medikamente:</strong> Amiodaron – CBD kann Wirkspiegel beeinflussen</span></li>
                            </ul>
                        </div>
                        <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <p class="text-xs text-gray-700">
                                <strong>Wichtig:</strong> Unser Tool prüft diese Wechselwirkungen automatisch und passt die Startdosis entsprechend an. Bei kritischen Medikamenten empfehlen wir eine <strong>sehr vorsichtige Einschleichphase</strong> und <strong>engmaschige ärztliche Kontrolle</strong>.
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 3: Wie lange bis Wirkung? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Wie lange dauert es, bis CBD wirkt? Und wie lange hält die Wirkung an?</span>
                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="grid md:grid-cols-2 gap-4 mb-4">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h4 class="font-bold text-blue-900 mb-2">
                                    <i class="fas fa-stopwatch mr-2"></i>
                                    Wirkungseintritt:
                                </h4>
                                <p class="text-sm mb-3">Bei <strong>sublingualer Einnahme</strong> (unter die Zunge):</p>
                                <ul class="text-sm space-y-1">
                                    <li>• <strong>Erste Wirkung:</strong> 15-30 Minuten</li>
                                    <li>• <strong>Volle Wirkung:</strong> 1-2 Stunden</li>
                                    <li>• <strong>Warum so schnell?</strong> Aufnahme über Mundschleimhaut direkt ins Blut</li>
                                </ul>
                            </div>
                            <div class="bg-green-50 p-4 rounded-lg">
                                <h4 class="font-bold text-green-900 mb-2">
                                    <i class="fas fa-hourglass-half mr-2"></i>
                                    Wirkungsdauer:
                                </h4>
                                <p class="text-sm mb-3">Wie lange bleibt CBD im Körper aktiv?</p>
                                <ul class="text-sm space-y-1">
                                    <li>• <strong>Akute Wirkung:</strong> 4-8 Stunden</li>
                                    <li>• <strong>Halbwertszeit:</strong> 18-68 Stunden</li>
                                    <li>• <strong>Kumulativer Effekt:</strong> Bei regelmäßiger Einnahme Aufbau im Körper</li>
                                </ul>
                            </div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                            <p class="text-sm">
                                <i class="fas fa-info-circle text-purple-600 mr-2"></i>
                                <strong>Für ECS-Stärkung:</strong> Die volle Wirkung zur Medikamenten-Reduktion entwickelt sich oft erst nach <strong>2-4 Wochen regelmäßiger Einnahme</strong>, da sich das ECS langsam regeneriert. Geduld ist wichtig!
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 4: Kann ich Medikamente reduzieren? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Kann ich wirklich meine Medikamente mit CBD reduzieren? Gibt es dafür Beweise?</span>
                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="bg-green-50 p-5 rounded-lg mb-4 border-l-4 border-green-500">
                            <h4 class="font-bold text-green-900 mb-3">
                                <i class="fas fa-flask mr-2"></i>
                                Wissenschaftliche Erkenntnisse:
                            </h4>
                            <p class="text-sm mb-3">
                                <strong>Ja, aber nur unter ärztlicher Aufsicht!</strong> Studien zeigen vielversprechende Ergebnisse:
                            </p>
                            <ul class="text-sm space-y-2">
                                <li><strong>• Schmerzpatienten:</strong> 50-80% konnten Opioide reduzieren oder absetzen (Studie: University of Michigan, 2025)</li>
                                <li><strong>• Angststörungen:</strong> CBD zeigte in klinischen Studien vergleichbare Wirkung wie niedrig dosierte Benzodiazepine</li>
                                <li><strong>• Schlafstörungen:</strong> 60% der Patienten reduzierten Schlafmittel nach 3 Monaten CBD-Einnahme</li>
                                <li><strong>• Entzündliche Erkrankungen:</strong> Reduktion von NSAR (Ibuprofen, Diclofenac) durch anti-inflammatorische CBD-Wirkung</li>
                            </ul>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                            <p class="text-sm text-yellow-900 mb-2">
                                <i class="fas fa-user-md mr-2"></i>
                                <strong>Wichtig zu verstehen:</strong>
                            </p>
                            <ul class="text-sm space-y-1 text-yellow-900">
                                <li>• CBD ist <strong>kein Wundermittel</strong>, sondern unterstützt Ihr ECS</li>
                                <li>• Medikamenten-Reduktion ist ein <strong>langsamer Prozess</strong> (3-6 Monate)</li>
                                <li>• <strong>Niemals eigenständig absetzen</strong> – nur mit ärztlicher Begleitung!</li>
                                <li>• Nicht bei allen Menschen gleich wirksam (Genetik, ECS-Status)</li>
                            </ul>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 5: Macht CBD abhängig? Nebenwirkungen? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Macht CBD abhängig? Welche Nebenwirkungen kann es geben?</span>

                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="grid md:grid-cols-2 gap-4 mb-4">
                            <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <h4 class="font-bold text-green-900 mb-2">
                                    <i class="fas fa-check-circle mr-2"></i>
                                    Abhängigkeitspotenzial:
                                </h4>
                                <p class="text-sm mb-2"><strong>Nein, CBD macht nicht abhängig!</strong></p>
                                <ul class="text-sm space-y-1">
                                    <li>• WHO stuft CBD als sicher ein (2025)</li>
                                    <li>• Keine Entzugserscheinungen beim Absetzen</li>
                                    <li>• Keine Toleranzentwicklung (Dosis muss nicht gesteigert werden)</li>
                                    <li>• Keine psychoaktive Wirkung</li>
                                </ul>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <h4 class="font-bold text-blue-900 mb-2">
                                    <i class="fas fa-thermometer-half mr-2"></i>
                                    Mögliche Nebenwirkungen:
                                </h4>
                                <p class="text-sm mb-2">Meist mild und selten:</p>
                                <ul class="text-sm space-y-1">
                                    <li>• Müdigkeit (bei hohen Dosen)</li>
                                    <li>• Mundtrockenheit</li>
                                    <li>• Leichter Durchfall (erste Tage)</li>
                                    <li>• Appetitveränderungen</li>
                                    <li>• Selten: Leberwerterhöhung (bei sehr hohen Dosen)</li>
                                </ul>
                            </div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <p class="text-sm">
                                <i class="fas fa-lightbulb text-purple-600 mr-2"></i>
                                <strong>Tipp:</strong> Unser "Start Low, Go Slow"-Ansatz minimiert Nebenwirkungen. Die meisten Menschen vertragen CBD sehr gut, wenn sie langsam einschleichen.
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 6: Wie finde ich einen Arzt? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Wie finde ich einen Arzt, der mich beim Medikamenten-Ausschleichen mit CBD begleitet?</span>

                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="bg-teal-50 p-5 rounded-lg mb-4 border-l-4 border-teal-500">
                            <h4 class="font-bold text-teal-900 mb-3">
                                <i class="fas fa-search mr-2"></i>
                                So finden Sie den richtigen Arzt:
                            </h4>
                            <ul class="text-sm space-y-3">
                                <li>
                                    <strong>1. Hausarzt als erster Ansprechpartner:</strong><br>
                                    Zeigen Sie Ihrem Hausarzt diesen Ausschleichplan. Viele Ärzte sind heute aufgeschlossen gegenüber CBD, wenn wissenschaftliche Grundlagen vorliegen.
                                </li>
                                <li>
                                    <strong>2. Cannabis-Ärzte & Spezialisten:</strong><br>
                                    Suchen Sie nach Ärzten mit Fortbildung in Cannabinoid-Medizin. In Deutschland und Österreich gibt es zunehmend spezialisierte Praxen.
                                </li>
                                <li>
                                    <strong>3. Online-Plattformen nutzen:</strong><br>
                                    Cannabis-Ärzte-Verzeichnisse, Telemedizin-Plattformen für Cannabis-Beratung
                                </li>
                                <li>
                                    <strong>4. Fachärzte je nach Erkrankung:</strong><br>
                                    • Schmerz: Schmerztherapeut<br>
                                    • Psyche: Psychiater, Neurologe<br>
                                    • Entzündungen: Rheumatologe, Internist
                                </li>
                            </ul>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h5 class="font-bold text-blue-900 mb-2">
                                <i class="fas fa-comments mr-2"></i>
                                Gesprächstipps für Ihr Arztgespräch:
                            </h5>
                            <ul class="text-sm space-y-1">
                                <li>✅ Bringen Sie diesen Ausschleichplan mit (als PDF)</li>
                                <li>✅ Erklären Sie Ihre Motivation (weniger Medikamente, Nebenwirkungen)</li>
                                <li>✅ Betonen Sie, dass Sie unter ärztlicher Aufsicht vorgehen möchten</li>
                                <li>✅ Fragen Sie nach regelmäßigen Kontrolluntersuchungen</li>
                                <li>✅ Dokumentieren Sie Ihre Erfahrungen (Symptom-Tagebuch)</li>
                            </ul>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 7: Was kostet CBD? Zahlt Krankenkasse? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Was kostet CBD-Paste? Übernimmt die Krankenkasse die Kosten?</span>

                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="grid md:grid-cols-2 gap-4 mb-4">
                            <div class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                                <h4 class="font-bold text-orange-900 mb-2">
                                    <i class="fas fa-calculator mr-2"></i>
                                    Kosten für CBD-Paste 70%:
                                </h4>
                                <p class="text-sm mb-2">Beispielrechnung für 1 Monat:</p>
                                <ul class="text-sm space-y-1">
                                    <li>• <strong>Niedrige Dosis (20mg/Tag):</strong> ca. 50-70€</li>
                                    <li>• <strong>Mittlere Dosis (50mg/Tag):</strong> ca. 100-150€</li>
                                    <li>• <strong>Hohe Dosis (100mg/Tag):</strong> ca. 200-250€</li>
                                </ul>
                                <p class="text-xs mt-2 text-gray-600">
                                    *Preise variieren je nach Hersteller und Qualität
                                </p>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <h4 class="font-bold text-blue-900 mb-2">
                                    <i class="fas fa-hospital mr-2"></i>
                                    Krankenkasse:
                                </h4>
                                <p class="text-sm mb-2"><strong>Leider meist NEIN:</strong></p>
                                <ul class="text-sm space-y-1">
                                    <li>• CBD-Paste als Nahrungsergänzungsmittel: <strong>Keine Kostenübernahme</strong></li>
                                    <li>• Medizinisches Cannabis (THC-haltig): Kann verschrieben werden, aber hohe Hürden</li>
                                    <li>• Private Krankenversicherungen: Einzelfallentscheidung</li>
                                </ul>
                            </div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <h5 class="font-bold text-green-900 mb-2">
                                <i class="fas fa-piggy-bank mr-2"></i>
                                Aber: Langfristige Einsparungen möglich!
                            </h5>
                            <p class="text-sm mb-2">
                                Wenn Sie durch CBD Medikamente reduzieren können, sparen Sie:
                            </p>
                            <ul class="text-sm space-y-1">
                                <li>• Zuzahlungen für Medikamente (5-10€ pro Rezept)</li>
                                <li>• Kosten für Nebenwirkungen-Behandlung</li>
                                <li>• Arztbesuche wegen Nebenwirkungen</li>
                                <li>• Langfristig: Weniger Folgeerkrankungen durch Medikamente</li>
                            </ul>
                            <p class="text-sm mt-2">
                                <strong>Beispiel:</strong> Wenn Sie 3 Medikamente à 10€ Zuzahlung/Monat sparen = 30€. Plus CBD-Kosten 100€ = Netto-Mehrkosten 70€ für bessere Lebensqualität.
                            </p>
                        </div>
                    </div>
                </details>
            </div>

            <!-- Main Form -->
            <div id="dosierungsplan-erstellen" class="section-card p-8 mb-8 rounded-lg fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div class="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-syringe text-teal-700 text-lg"></i>
                    </div>
                    <span>Erstellen Sie Ihren persönlichen Medikamenten-Reduktionsplan</span>
                </h2>

                <!-- Tab Navigation -->
                <div class="flex border-b border-gray-200 mb-6">
                    <button id="tab-text" class="tab-button px-6 py-3 font-semibold text-teal-700 border-b-2 border-teal-700">
                        <i class="fas fa-keyboard mr-2 text-sm"></i>
                        Manuelle Eingabe
                    </button>
                    <button id="tab-upload" class="tab-button px-6 py-3 font-semibold text-gray-500 hover:text-teal-700">
                        <i class="fas fa-camera mr-2 text-sm"></i>
                        Foto hochladen
                    </button>
                </div>

                <!-- Text Input Tab -->
                <div id="content-text" class="tab-content">
                    <form id="medication-form">
                        <!-- Personal Data Section -->
                        <div class="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <h3 class="text-base font-semibold text-gray-900 mb-3">
                                Ihre persönlichen Daten
                            </h3>
                            <p class="text-xs text-gray-600 mb-4">
                                Diese Angaben helfen uns, die CBD-Dosierung individuell für Sie zu berechnen.
                            </p>
                            
                            <div class="grid md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        Ihr Vorname *
                                    </label>
                                    <input type="text" id="first-name" name="first_name" 
                                           placeholder="z.B. Maria" 
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-sm"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
        
                                        Geschlecht *
                                    </label>
                                    <div class="flex gap-6 items-center h-full">
                                        <label class="flex items-center cursor-pointer">
                                            <input type="radio" name="gender" value="female" class="w-5 h-5 text-purple-600 focus:ring-purple-500" required>
                                            <span class="ml-3 text-gray-700 font-medium">
                                                <i class="fas fa-venus text-pink-500 mr-1"></i>
                                                Weiblich
                                            </span>
                                        </label>
                                        <label class="flex items-center cursor-pointer">
                                            <input type="radio" name="gender" value="male" class="w-5 h-5 text-purple-600 focus:ring-purple-500" required>
                                            <span class="ml-3 text-gray-700 font-medium">
                                                <i class="fas fa-mars text-blue-500 mr-1"></i>
                                                Männlich
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        <i class="fas fa-birthday-cake mr-2"></i>
                                        Alter (Jahre) *
                                    </label>
                                    <input type="number" id="age" name="age" 
                                           placeholder="z.B. 45" 
                                           min="18" 
                                           max="120"
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                           required>
                                    <p class="text-xs text-gray-500 mt-1">Für altersgerechte Dosierung</p>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        <i class="fas fa-weight mr-2"></i>
                                        Gewicht (kg) *
                                    </label>
                                    <input type="number" id="weight" name="weight" 
                                           placeholder="z.B. 70" 
                                           min="30" 
                                           max="250"
                                           step="0.1"
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                           required>
                                    <p class="text-xs text-gray-500 mt-1">In Kilogramm</p>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        <i class="fas fa-ruler-vertical mr-2"></i>
                                        Größe (cm) *
                                    </label>
                                    <input type="number" id="height" name="height" 
                                           placeholder="z.B. 170" 
                                           min="100" 
                                           max="250"
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                           required>
                                    <p class="text-xs text-gray-500 mt-1">In Zentimetern</p>
                                </div>
                            </div>
                            
                            <div class="bg-white p-3 rounded-lg mt-4">
                                <p class="text-xs text-gray-600">
                                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                                    Ihre Daten werden verwendet, um die CBD-Dosierung an Ihr Körpergewicht und Alter anzupassen.
                                </p>
                            </div>
                        </div>

                        <!-- E-Mail Section -->
                        <div class="bg-green-50 p-6 rounded-lg mb-6 border-l-4 border-green-500">
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-envelope mr-2 text-green-600"></i>
                                Ihre E-Mail-Adresse *
                            </label>
                            <input type="email" id="email" name="email" 
                                   placeholder="ihre.email@beispiel.de"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                   required>
                            <p class="text-xs text-gray-600 mt-2">
                                <i class="fas fa-shield-alt text-green-600 mr-1"></i>
                                Ihre E-Mail-Adresse wird gespeichert, um Ihnen den Download zu ermöglichen.
                            </p>
                        </div>

                        <!-- Medications Section -->
                        <div class="mb-6">
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-pills mr-2"></i>
                                Ihre Medikamente
                            </label>
                            <div id="medication-inputs" class="space-y-3">
                                <div class="medication-input-group flex gap-3" style="position: relative;">
                                    <input type="text" name="medication_name[]" 
                                           placeholder="z.B. Tippen Sie 'IBU' für Ibuprofen..." 
                                           class="medication-name-input flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                           required>
                                    <input type="text" name="medication_dosage[]" 
                                           placeholder="Dosierung (z.B. 400mg täglich)" 
                                           class="w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                    <button type="button" class="remove-medication px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hidden">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="button" id="add-medication" class="mt-3 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 font-medium text-sm border border-teal-200">
                                <i class="fas fa-plus mr-2 text-xs"></i>
                                Weiteres Medikament hinzufügen
                            </button>
                        </div>

                        <!-- Duration Section -->
                        <div class="mb-6">
                            <label class="block text-gray-700 font-semibold mb-3">

                                Gewünschte Aktivierungsdauer
                            </label>
                            <div class="flex items-center gap-4">
                                <input type="number" id="duration-weeks" name="duration_weeks" 
                                       min="1" max="52" value="8"
                                       class="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl font-semibold"
                                       required>
                                <span class="text-gray-700 font-semibold">Wochen</span>
                            </div>
                            <p class="text-sm text-gray-500 mt-2">
                                <i class="fas fa-info-circle mr-1"></i>
                                Empfohlen: 8-12 Wochen für nachhaltige ECS-Aktivierung
                            </p>
                        </div>

                        <button type="submit" class="w-full py-4 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-md text-base">
                            <i class="fas fa-syringe mr-2 text-sm"></i>
                            Ausschleichplan erstellen
                        </button>
                    </form>
                </div>

                <!-- Upload Tab -->
                <div id="content-upload" class="tab-content hidden">
                    <form id="upload-form">
                        <!-- Personal Data for Upload -->
                        <div class="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <h3 class="text-base font-semibold text-gray-900 mb-3">
                                Ihre persönlichen Daten
                            </h3>
                            
                            <div class="grid md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        <i class="fas fa-user mr-2"></i>
                                        Ihr Vorname *
                                    </label>
                                    <input type="text" id="upload-first-name" name="first_name" 
                                           placeholder="z.B. Maria" 
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
        
                                        Geschlecht *
                                    </label>
                                    <div class="flex gap-6 items-center h-full">
                                        <label class="flex items-center cursor-pointer">
                                            <input type="radio" name="upload_gender" value="female" class="w-5 h-5 text-purple-600 focus:ring-purple-500" required>
                                            <span class="ml-3 text-gray-700 font-medium">
                                                <i class="fas fa-venus text-pink-500 mr-1"></i>
                                                Weiblich
                                            </span>
                                        </label>
                                        <label class="flex items-center cursor-pointer">
                                            <input type="radio" name="upload_gender" value="male" class="w-5 h-5 text-purple-600 focus:ring-purple-500" required>
                                            <span class="ml-3 text-gray-700 font-medium">
                                                <i class="fas fa-mars text-blue-500 mr-1"></i>
                                                Männlich
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        <i class="fas fa-birthday-cake mr-2"></i>
                                        Alter (Jahre) *
                                    </label>
                                    <input type="number" id="upload-age" name="age" 
                                           placeholder="z.B. 45" 
                                           min="18" 
                                           max="120"
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        <i class="fas fa-weight mr-2"></i>
                                        Gewicht (kg) *
                                    </label>
                                    <input type="number" id="upload-weight" name="weight" 
                                           placeholder="z.B. 70" 
                                           min="30" 
                                           max="250"
                                           step="0.1"
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2 text-sm">
                                        <i class="fas fa-ruler-vertical mr-2"></i>
                                        Größe (cm) *
                                    </label>
                                    <input type="number" id="upload-height" name="height" 
                                           placeholder="z.B. 170" 
                                           min="100" 
                                           max="250"
                                           class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
                                           required>
                                </div>
                            </div>
                            
                            <div class="bg-white p-3 rounded-lg mt-4">
                                <p class="text-xs text-gray-600">
                                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                                    Ihre Daten werden verwendet, um die CBD-Dosierung an Ihr Körpergewicht und Alter anzupassen.
                                </p>
                            </div>
                        </div>

                        <!-- E-Mail for Upload -->
                        <div class="bg-green-50 p-6 rounded-lg mb-6 border-l-4 border-green-500">
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-envelope mr-2 text-green-600"></i>
                                Ihre E-Mail-Adresse *
                            </label>
                            <input type="email" id="upload-email" name="email" 
                                   placeholder="ihre.email@beispiel.de"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                   required>
                            <p class="text-xs text-gray-600 mt-2">
                                <i class="fas fa-shield-alt text-green-600 mr-1"></i>
                                Ihre E-Mail-Adresse wird gespeichert, um Ihnen den Download zu ermöglichen.
                            </p>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-gray-700 font-medium mb-2 text-sm">
                                Medikamentenplan hochladen
                            </label>
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                                <input type="file" id="image-upload" accept="image/*" class="hidden">
                                <label for="image-upload" class="cursor-pointer">
                                    <i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4"></i>
                                    <p class="text-gray-700 font-medium mb-2 text-sm">Klicken Sie hier oder ziehen Sie ein Bild</p>
                                    <p class="text-xs text-gray-500">JPG, PNG (max. 10MB)</p>
                                </label>
                            </div>
                            <div id="image-preview" class="mt-4 hidden">
                                <img id="preview-img" class="max-w-full h-auto rounded-lg shadow-lg">
                            </div>
                        </div>

                        <div class="mb-6">
                            <label class="block text-gray-700 font-semibold mb-3">

                                Gewünschte Aktivierungsdauer
                            </label>
                            <div class="flex items-center gap-4">
                                <input type="number" id="upload-duration-weeks" name="duration_weeks" 
                                       min="1" max="52" value="8"
                                       class="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xl font-semibold"
                                       required>
                                <span class="text-gray-700 font-semibold">Wochen</span>
                            </div>
                        </div>

                        <button type="submit" class="w-full py-4 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-md text-base">
                            <i class="fas fa-camera mr-2 text-sm"></i>
                            Bild analysieren & Ausschleichplan erstellen
                        </button>
                    </form>
                </div>
            </div>

            <!-- Loading -->
            <div id="loading" class="hidden section-card p-8 text-center rounded-lg">
                <i class="fas fa-spinner fa-spin text-5xl text-teal-600 mb-4"></i>
                <p class="text-lg font-semibold text-gray-900">Analysiere Ihre Medikamente...</p>
                <p class="text-gray-600 mt-2 text-sm">Berechne individuelle CBD-Paste Dosierung...</p>
            </div>

            <!-- Results -->
            <div id="results" class="hidden"></div>

        </div>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-8 mt-16">
            <div class="max-w-6xl mx-auto px-4 text-center">
                <p class="mb-2">
                    <i class="fas fa-shield-alt mr-2"></i>
                    Alle Informationen basieren auf wissenschaftlichen Studien zu CBD-Medikamenten-Wechselwirkungen
                </p>
                <p class="text-gray-400 text-sm">
                    Quellen: PubMed, NIH, ProjectCBD
                </p>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
