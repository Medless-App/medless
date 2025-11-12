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
        <title>ECS Aktivierung - CBD-Paste 70% Dosierungsplan</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeIn 0.6s ease-out; }
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
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
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="gradient-bg text-white py-8 shadow-lg">
            <div class="max-w-6xl mx-auto px-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-4xl font-bold mb-2">
                            <i class="fas fa-cannabis mr-3"></i>
                            ECS Aktivierung
                        </h1>
                        <p class="text-purple-100 text-lg">Ihr persönlicher CBD-Paste 70% Dosierungsplan</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <i class="fas fa-syringe mr-2"></i>
                            <span class="text-sm">CBD-Paste 70%</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-6xl mx-auto px-4 py-8">
            
            <!-- Product Info Box -->
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-6 mb-8 rounded-xl shadow-lg fade-in">
                <div class="flex items-start">
                    <i class="fas fa-syringe text-purple-600 text-3xl mr-4 mt-1"></i>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800 mb-2">
                            Verwendetes Produkt: CBD-Paste 70%
                        </h2>
                        <div class="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span class="font-semibold">Verpackung:</span> 3g Spritze mit 30 Teilstrichen
                            </div>
                            <div>
                                <span class="font-semibold">Konzentration:</span> 1 Teilstrich (1.5 cm) = 70 mg CBD
                            </div>
                            <div>
                                <span class="font-semibold">Einnahme:</span> Sublingual (unter die Zunge, 2-3 Min)
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Mission Statement -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-8 mb-8 rounded-xl shadow-lg fade-in">
                <div class="flex items-start">
                    <i class="fas fa-heart text-green-600 text-4xl mr-6 mt-1"></i>
                    <div class="w-full">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-seedling mr-2"></i>
                            Ihr Weg zu weniger Tabletten - natürlich mit CBD-Paste
                        </h2>
                        <p class="text-gray-700 text-lg mb-4 leading-relaxed">
                            <strong>Viele Menschen wünschen sich, von ihrer Medikation loszukommen.</strong> Diese Plattform bietet Ihnen einen wissenschaftlich fundierten Ansatz, um Ihr <strong>Endocannabinoid-System (ECS)</strong> mit hochkonzentrierter CBD-Paste 70% zu stärken.
                        </p>
                        
                        <div class="bg-white/70 p-4 rounded-lg mb-4">
                            <h3 class="font-bold text-gray-800 mb-2">
                                <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                Warum CBD-Paste 70%?
                            </h3>
                            <p class="text-gray-700 mb-2">
                                Hochkonzentrierte CBD-Paste ermöglicht <strong>präzise Dosierung in kleinen Mengen</strong>. Mit der Spritze können Sie genau ablesen, wie viel CBD Sie einnehmen - ideal für individuelle Anpassungen an Ihr Körpergewicht und Ihre Medikation.
                            </p>
                        </div>
                        
                        <div class="grid md:grid-cols-3 gap-4 mt-4">
                            <div class="bg-green-100 p-4 rounded-lg">
                                <i class="fas fa-pills text-green-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-1">Medikamente reduzieren</h4>
                                <p class="text-sm text-gray-700">CBD-Paste kann beim Ausschleichen von Medikamenten unterstützen - mit präziser Dosierung</p>
                            </div>
                            <div class="bg-blue-100 p-4 rounded-lg">
                                <i class="fas fa-brain text-blue-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-1">ECS aktivieren</h4>
                                <p class="text-sm text-gray-700">Ihr Endocannabinoid-System wird durch regelmäßige Einnahme optimal unterstützt</p>
                            </div>
                            <div class="bg-purple-100 p-4 rounded-lg">
                                <i class="fas fa-syringe text-purple-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-1">Präzise Dosierung</h4>
                                <p class="text-sm text-gray-700">Mit der Spritze dosieren Sie auf 0.05 cm genau - angepasst an Ihr Gewicht und Alter</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Disclaimer -->
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg shadow fade-in">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl mr-4 mt-1"></i>
                    <div>
                        <h3 class="text-lg font-bold text-yellow-800 mb-2">
                            <i class="fas fa-file-medical mr-2"></i>
                            Wichtiger medizinischer Hinweis
                        </h3>
                        <p class="text-yellow-700 mb-2">
                            Dieser CBD-Paste Dosierungsplan ist <strong>KEINE medizinische Beratung</strong> und ersetzt nicht das Gespräch mit Ihrem Arzt oder Apotheker. <strong>Produkt: CBD-Paste 70%</strong> in 3g Spritze mit 30 Teilstrichen (1 Teilstrich = 1.5 cm = 70 mg CBD). <strong>Einnahme:</strong> Sublingual unter die Zunge legen, 2-3 Minuten einwirken lassen, dann schlucken.
                        </p>
                        <ul class="text-yellow-700 space-y-1 ml-6 list-disc">
                            <li>Konsultieren Sie vor der Einnahme <strong>unbedingt Ihren Arzt</strong></li>
                            <li>Wechselwirkungen mit Medikamenten können gesundheitsgefährdend sein</li>
                            <li><strong>Ändern Sie niemals ohne ärztliche Rücksprache Ihre Medikation</strong></li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- What is ECS Section -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8 card-hover fade-in">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-brain text-purple-600 mr-3"></i>
                    Was ist das Endocannabinoid-System (ECS)?
                </h2>
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <p class="text-gray-700 mb-4 leading-relaxed">
                            Das <strong>Endocannabinoid-System (ECS)</strong> ist ein körpereigenes Regulationssystem, das eine zentrale Rolle für Ihre Gesundheit spielt.
                        </p>
                        <div class="bg-purple-50 p-4 rounded-lg mb-4">
                            <h3 class="font-bold text-purple-900 mb-2">
                                <i class="fas fa-bullseye mr-2"></i>
                                Funktionen des ECS:
                            </h3>
                            <ul class="text-gray-700 space-y-2">
                                <li><i class="fas fa-check text-green-500 mr-2"></i> Schmerzregulierung</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> Stimmung und Emotionen</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> Schlaf-Wach-Rhythmus</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> Immunsystem</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> Appetit und Verdauung</li>
                            </ul>
                        </div>
                    </div>
                    <div>
                        <div class="bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-lg">
                            <h3 class="font-bold text-gray-800 mb-3">
                                <i class="fas fa-syringe text-purple-600 mr-2"></i>
                                Wie CBD-Paste 70% das ECS aktiviert:
                            </h3>
                            <p class="text-gray-700 mb-3">
                                Hochkonzentriertes <strong>Cannabidiol (CBD)</strong> interagiert mit Ihrem ECS und hilft, das Gleichgewicht (Homöostase) wiederherzustellen. Die Paste ermöglicht <strong>präzise, individuelle Dosierung</strong>.
                            </p>
                            <div class="bg-white p-4 rounded-lg">
                                <p class="text-sm text-gray-600 italic">
                                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                                    CBD hat <strong>keine psychoaktive Wirkung</strong> und macht nicht abhängig.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Form -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-syringe text-blue-600 mr-3"></i>
                    Erstellen Sie Ihren persönlichen CBD-Paste Dosierungsplan
                </h2>

                <!-- Tab Navigation -->
                <div class="flex border-b mb-6">
                    <button id="tab-text" class="tab-button px-6 py-3 font-semibold text-purple-600 border-b-2 border-purple-600">
                        <i class="fas fa-keyboard mr-2"></i>
                        Manuelle Eingabe
                    </button>
                    <button id="tab-upload" class="tab-button px-6 py-3 font-semibold text-gray-500 hover:text-purple-600">
                        <i class="fas fa-camera mr-2"></i>
                        Foto hochladen
                    </button>
                </div>

                <!-- Text Input Tab -->
                <div id="content-text" class="tab-content">
                    <form id="medication-form">
                        <!-- Personal Data Section -->
                        <div class="bg-blue-50 p-6 rounded-lg mb-6">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                <i class="fas fa-user-circle mr-2"></i>
                                Ihre persönlichen Daten
                            </h3>
                            <p class="text-sm text-gray-600 mb-4">
                                Diese Angaben helfen uns, die CBD-Dosierung individuell für Sie zu berechnen.
                            </p>
                            
                            <div class="grid md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-user mr-2"></i>
                                        Ihr Vorname *
                                    </label>
                                    <input type="text" id="first-name" name="first_name" 
                                           placeholder="z.B. Maria" 
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-venus-mars mr-2"></i>
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
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-birthday-cake mr-2"></i>
                                        Alter (Jahre) *
                                    </label>
                                    <input type="number" id="age" name="age" 
                                           placeholder="z.B. 45" 
                                           min="18" 
                                           max="120"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                           required>
                                    <p class="text-xs text-gray-500 mt-1">Für altersgerechte Dosierung</p>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-weight mr-2"></i>
                                        Gewicht (kg) *
                                    </label>
                                    <input type="number" id="weight" name="weight" 
                                           placeholder="z.B. 70" 
                                           min="30" 
                                           max="250"
                                           step="0.1"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                           required>
                                    <p class="text-xs text-gray-500 mt-1">In Kilogramm</p>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-ruler-vertical mr-2"></i>
                                        Größe (cm) *
                                    </label>
                                    <input type="number" id="height" name="height" 
                                           placeholder="z.B. 170" 
                                           min="100" 
                                           max="250"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
                            <button type="button" id="add-medication" class="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold">
                                <i class="fas fa-plus mr-2"></i>
                                Weiteres Medikament hinzufügen
                            </button>
                        </div>

                        <!-- Duration Section -->
                        <div class="mb-6">
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-calendar-alt mr-2"></i>
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

                        <button type="submit" class="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                            <i class="fas fa-syringe mr-2"></i>
                            CBD-Paste Dosierungsplan erstellen
                        </button>
                    </form>
                </div>

                <!-- Upload Tab -->
                <div id="content-upload" class="tab-content hidden">
                    <form id="upload-form">
                        <!-- Personal Data for Upload -->
                        <div class="bg-blue-50 p-6 rounded-lg mb-6">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                <i class="fas fa-user-circle mr-2"></i>
                                Ihre persönlichen Daten
                            </h3>
                            
                            <div class="grid md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-user mr-2"></i>
                                        Ihr Vorname *
                                    </label>
                                    <input type="text" id="upload-first-name" name="first_name" 
                                           placeholder="z.B. Maria" 
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-venus-mars mr-2"></i>
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
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-birthday-cake mr-2"></i>
                                        Alter (Jahre) *
                                    </label>
                                    <input type="number" id="upload-age" name="age" 
                                           placeholder="z.B. 45" 
                                           min="18" 
                                           max="120"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-weight mr-2"></i>
                                        Gewicht (kg) *
                                    </label>
                                    <input type="number" id="upload-weight" name="weight" 
                                           placeholder="z.B. 70" 
                                           min="30" 
                                           max="250"
                                           step="0.1"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                           required>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-ruler-vertical mr-2"></i>
                                        Größe (cm) *
                                    </label>
                                    <input type="number" id="upload-height" name="height" 
                                           placeholder="z.B. 170" 
                                           min="100" 
                                           max="250"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-image mr-2"></i>
                                Medikamentenplan hochladen
                            </label>
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                                <input type="file" id="image-upload" accept="image/*" class="hidden">
                                <label for="image-upload" class="cursor-pointer">
                                    <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                                    <p class="text-gray-600 font-semibold mb-2">Klicken Sie hier oder ziehen Sie ein Bild</p>
                                    <p class="text-sm text-gray-500">JPG, PNG (max. 10MB)</p>
                                </label>
                            </div>
                            <div id="image-preview" class="mt-4 hidden">
                                <img id="preview-img" class="max-w-full h-auto rounded-lg shadow-lg">
                            </div>
                        </div>

                        <div class="mb-6">
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-calendar-alt mr-2"></i>
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

                        <button type="submit" class="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                            <i class="fas fa-magic mr-2"></i>
                            Bild analysieren & CBD-Paste Dosierungsplan erstellen
                        </button>
                    </form>
                </div>
            </div>

            <!-- Loading -->
            <div id="loading" class="hidden bg-white rounded-xl shadow-lg p-8 text-center">
                <i class="fas fa-spinner fa-spin text-6xl text-purple-600 mb-4"></i>
                <p class="text-xl font-semibold text-gray-700">Analysiere Ihre Medikamente...</p>
                <p class="text-gray-500 mt-2">Berechne individuelle CBD-Paste Dosierung...</p>
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
