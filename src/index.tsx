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
        <title>ECS Aktivierung - CBD Ausschleichplan</title>
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
                            <i class="fas fa-leaf mr-3"></i>
                            ECS Aktivierung
                        </h1>
                        <p class="text-purple-100 text-lg">Ihr Weg zu weniger Medikamenten durch ein starkes Endocannabinoid-System</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <i class="fas fa-heart-pulse mr-2"></i>
                            <span class="text-sm">Medikamenten-Reduktion</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-6xl mx-auto px-4 py-8">
            
            <!-- Hero Section: The Problem -->
            <div class="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 p-8 mb-8 rounded-xl shadow-lg fade-in">
                <div class="flex items-start">
                    <i class="fas fa-pills text-red-500 text-5xl mr-6 mt-2"></i>
                    <div class="w-full">
                        <h2 class="text-3xl font-bold text-gray-900 mb-4">
                            💊 Zu viele Tabletten? Sie sind nicht allein.
                        </h2>
                        <p class="text-gray-800 text-lg mb-4 leading-relaxed">
                            Millionen Menschen in Deutschland und Österreich nehmen täglich Medikamente – oft mehrere gleichzeitig. Viele möchten ihre <strong>Medikation reduzieren</strong> oder sogar <strong>komplett ausschleichen</strong>, wissen aber nicht, wie sie das sicher angehen können.
                        </p>
                        <div class="bg-white p-5 rounded-lg border-l-4 border-orange-400">
                            <p class="text-gray-800 font-semibold mb-2">
                                <i class="fas fa-question-circle text-orange-500 mr-2"></i>
                                Die zentrale Frage:
                            </p>
                            <p class="text-gray-700 text-lg">
                                <strong>"Wie kann ich meine Abhängigkeit von Medikamenten verringern – natürlich und ohne Risiko?"</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- The Solution: Strong ECS -->
            <div class="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 p-8 mb-8 rounded-xl shadow-lg fade-in">
                <div class="flex items-start">
                    <i class="fas fa-heart-pulse text-green-600 text-5xl mr-6 mt-2"></i>
                    <div class="w-full">
                        <h2 class="text-3xl font-bold text-gray-900 mb-4">
                            🌿 Die Lösung: Ein starkes Endocannabinoid-System (ECS)
                        </h2>
                        <p class="text-gray-800 text-lg mb-4 leading-relaxed">
                            Ihr Körper besitzt das <strong>stärkste Regulationssystem</strong>, das die Wissenschaft kennt: das <strong>Endocannabinoid-System (ECS)</strong>. Es steuert Schmerz, Stimmung, Schlaf, Immunsystem und vieles mehr – <strong>die gleichen Funktionen, für die Sie heute Medikamente nehmen.</strong>
                        </p>
                        
                        <div class="grid md:grid-cols-2 gap-6 mb-6">
                            <div class="bg-white p-5 rounded-lg shadow">
                                <h3 class="font-bold text-green-800 mb-3 text-lg">
                                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                    Ein gesundes ECS kann:
                                </h3>
                                <ul class="text-gray-700 space-y-2">
                                    <li><i class="fas fa-arrow-right text-green-500 mr-2"></i> <strong>Schmerzen natürlich regulieren</strong> (statt Schmerzmittel)</li>
                                    <li><i class="fas fa-arrow-right text-green-500 mr-2"></i> <strong>Stimmung stabilisieren</strong> (statt Antidepressiva)</li>
                                    <li><i class="fas fa-arrow-right text-green-500 mr-2"></i> <strong>Schlaf verbessern</strong> (statt Schlafmittel)</li>
                                    <li><i class="fas fa-arrow-right text-green-500 mr-2"></i> <strong>Entzündungen hemmen</strong> (statt Cortison)</li>
                                    <li><i class="fas fa-arrow-right text-green-500 mr-2"></i> <strong>Immunsystem stärken</strong> (statt Immunsuppressiva)</li>
                                </ul>
                            </div>
                            <div class="bg-red-50 p-5 rounded-lg border-l-4 border-red-400 shadow">
                                <h3 class="font-bold text-red-800 mb-3 text-lg">
                                    <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                                    Aber: Modernes Leben schwächt Ihr ECS
                                </h3>
                                <ul class="text-gray-700 space-y-2">
                                    <li><i class="fas fa-times text-red-500 mr-2"></i> <strong>Medikamente</strong> stören ECS-Funktion</li>
                                    <li><i class="fas fa-times text-red-500 mr-2"></i> <strong>Chronischer Stress</strong> erschöpft Endocannabinoide</li>
                                    <li><i class="fas fa-times text-red-500 mr-2"></i> <strong>Schlechte Ernährung</strong> (Omega-6-Überschuss)</li>
                                    <li><i class="fas fa-times text-red-500 mr-2"></i> <strong>Bewegungsmangel</strong> reduziert ECS-Aktivität</li>
                                    <li><i class="fas fa-times text-red-500 mr-2"></i> <strong>Umweltgifte</strong> (Pestizide, Plastik)</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg border-2 border-blue-300">
                            <h3 class="font-bold text-gray-900 mb-3 text-xl">
                                <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                Die wissenschaftliche Erkenntnis:
                            </h3>
                            <p class="text-gray-800 text-lg leading-relaxed">
                                Ein <strong>geschwächtes ECS</strong> führt zu einer <strong>klinischen Endocannabinoid-Defizienz (CED)</strong> – Ihr Körper kann sich nicht mehr selbst regulieren. Die Folge: <strong>Sie brauchen Medikamente für Funktionen, die Ihr Körper eigentlich selbst übernehmen könnte.</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- The Method: Exogenous Cannabinoids -->
            <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 p-8 mb-8 rounded-xl shadow-lg fade-in">
                <div class="flex items-start">
                    <i class="fas fa-leaf text-purple-600 text-5xl mr-6 mt-2"></i>
                    <div class="w-full">
                        <h2 class="text-3xl font-bold text-gray-900 mb-4">
                            🧬 Der Weg: Exogene Cannabinoide stärken Ihr ECS
                        </h2>
                        <p class="text-gray-800 text-lg mb-4 leading-relaxed">
                            Wenn Ihr Körper nicht genug <strong>eigene Endocannabinoide</strong> produziert, können Sie ihn mit <strong>exogenen Cannabinoiden</strong> (von außen zugeführt) unterstützen. Diese Pflanzenstoffe – wie CBD – wirken <strong>genauso wie körpereigene Endocannabinoide</strong> und helfen Ihrem ECS, seine Funktion wiederzuerlangen.
                        </p>
                        
                        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                            <h3 class="font-bold text-purple-900 mb-4 text-xl">
                                <i class="fas fa-dna text-purple-600 mr-2"></i>
                                Wissenschaftlich belegt:
                            </h3>
                            <div class="grid md:grid-cols-3 gap-4">
                                <div class="border-l-4 border-green-500 pl-4">
                                    <p class="font-semibold text-green-700 mb-1">Schmerzreduktion</p>
                                    <p class="text-sm text-gray-600">CBD aktiviert Schmerz-Rezeptoren und hemmt Entzündungen</p>
                                </div>
                                <div class="border-l-4 border-blue-500 pl-4">
                                    <p class="font-semibold text-blue-700 mb-1">Angstlösung</p>
                                    <p class="text-sm text-gray-600">Aktiviert Serotonin-Rezeptoren, reduziert Stresshormone</p>
                                </div>
                                <div class="border-l-4 border-purple-500 pl-4">
                                    <p class="font-semibold text-purple-700 mb-1">Schlafverbesserung</p>
                                    <p class="text-sm text-gray-600">Reguliert Schlaf-Wach-Rhythmus über ECS</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-r from-orange-100 to-yellow-100 p-5 rounded-lg border-l-4 border-orange-400">
                            <h4 class="font-bold text-gray-900 mb-2">
                                <i class="fas fa-chart-line text-orange-600 mr-2"></i>
                                Das Ziel: Medikamenten-Reduktion durch starkes ECS
                            </h4>
                            <p class="text-gray-800">
                                Wenn Ihr ECS wieder stark ist, kann Ihr Körper <strong>viele Funktionen selbst übernehmen</strong>, die heute Medikamente erfüllen. Unter ärztlicher Begleitung können Sie so Schritt für Schritt <strong>Ihre Medikation reduzieren oder sogar ausschleichen</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Our Tool: Safe Entry -->
            <div class="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 p-8 mb-8 rounded-xl shadow-lg fade-in">
                <div class="flex items-start">
                    <i class="fas fa-shield-heart text-blue-600 text-5xl mr-6 mt-2"></i>
                    <div class="w-full">
                        <h2 class="text-3xl font-bold text-gray-900 mb-4">
                            📋 Unser Tool: Ihr sicherer Einstieg
                        </h2>
                        <p class="text-gray-800 text-lg mb-4 leading-relaxed">
                            Dieses Tool erstellt Ihnen einen <strong>individualisierten Ausschleichplan</strong> für exogene Cannabinoide (CBD-Paste 70%), der Ihre <strong>aktuelle Medikation, Alter, Gewicht und Körpergröße</strong> berücksichtigt. So können Sie unter ärztlicher Begleitung sicher mit der ECS-Stärkung beginnen.
                        </p>
                        
                        <div class="grid md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-white p-4 rounded-lg shadow">
                                <i class="fas fa-microscope text-blue-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-2">Medikamenten-Analyse</h4>
                                <p class="text-sm text-gray-700">Wir prüfen Wechselwirkungen mit Ihren Medikamenten und passen die Startdosis an</p>
                            </div>
                            <div class="bg-white p-4 rounded-lg shadow">
                                <i class="fas fa-user-md text-green-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-2">Individuelle Dosierung</h4>
                                <p class="text-sm text-gray-700">Basierend auf Alter, BMI und Gewicht – wissenschaftlich fundiert</p>
                            </div>
                            <div class="bg-white p-4 rounded-lg shadow">
                                <i class="fas fa-calendar-check text-purple-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-2">Tag-für-Tag Plan</h4>
                                <p class="text-sm text-gray-700">Zweiphasige Strategie: Einschleichphase + Erhaltung für optimale ECS-Unterstützung</p>
                            </div>
                        </div>
                        
                        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-lg">
                            <h4 class="font-bold text-yellow-900 mb-2">
                                <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                Wichtig: Ärztliche Begleitung erforderlich!
                            </h4>
                            <p class="text-yellow-800 mb-2">
                                Dieser Plan ist <strong>KEINE medizinische Beratung</strong>. Er dient als <strong>Gesprächsgrundlage für Ihr Arztgespräch</strong>. Medikamenten-Reduktion darf <strong>nur unter ärztlicher Aufsicht</strong> erfolgen.
                            </p>
                            <ul class="text-yellow-800 space-y-1 ml-6 list-disc text-sm">
                                <li>Nehmen Sie den Plan zu Ihrem Arzt mit</li>
                                <li>Ändern Sie niemals ohne Rücksprache Ihre Medikation</li>
                                <li>Beachten Sie Wechselwirkungen</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Product Info (small, background) -->
            <div class="bg-gray-50 border border-gray-200 p-4 mb-8 rounded-lg shadow-sm fade-in">
                <div class="flex items-center">
                    <i class="fas fa-info-circle text-gray-500 text-xl mr-3"></i>
                    <div class="flex-1">
                        <p class="text-sm text-gray-700">
                            <strong>Verwendetes Produkt:</strong> CBD-Paste 70% (3g Spritze, 30 Teilstriche) | <strong>Einnahme:</strong> Sublingual (unter die Zunge, 2-3 Min)
                        </p>
                    </div>
                </div>
            </div>

            <!-- What is ECS Section - Deep Dive -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8 card-hover fade-in">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-brain text-purple-600 mr-3"></i>
                    Das ECS: Ihr stärkstes Körpersystem
                </h2>
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <div class="bg-purple-50 p-5 rounded-lg mb-4 border-l-4 border-purple-500">
                            <h3 class="font-bold text-purple-900 mb-3 text-lg">
                                <i class="fas fa-dna mr-2"></i>
                                Das ECS ist überall in Ihrem Körper:
                            </h3>
                            <ul class="text-gray-700 space-y-2">
                                <li><i class="fas fa-check text-green-500 mr-2"></i> <strong>Gehirn & Nervensystem</strong> – Schmerz, Stimmung, Gedächtnis</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> <strong>Immunsystem</strong> – Entzündungen, Abwehr</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> <strong>Verdauungstrakt</strong> – Appetit, Darmmotilität</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> <strong>Herz-Kreislauf</strong> – Blutdruck, Herzrhythmus</li>
                                <li><i class="fas fa-check text-green-500 mr-2"></i> <strong>Knochen & Muskeln</strong> – Regeneration, Heilung</li>
                            </ul>
                        </div>
                        
                        <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <h4 class="font-bold text-blue-900 mb-2">
                                <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                Warum ist das ECS so wichtig?
                            </h4>
                            <p class="text-gray-700 text-sm">
                                Das ECS ist das <strong>Master-Regulationssystem</strong> Ihres Körpers. Es sorgt für <strong>Homöostase</strong> – das innere Gleichgewicht. Wenn das ECS geschwächt ist, gerät Ihr gesamter Körper aus dem Gleichgewicht.
                            </p>
                        </div>
                    </div>
                    <div>
                        <div class="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-lg border-2 border-red-300 mb-4">
                            <h3 class="font-bold text-red-900 mb-3 text-lg">
                                <i class="fas fa-exclamation-circle mr-2"></i>
                                Endocannabinoid-Defizienz (CED):
                            </h3>
                            <p class="text-gray-700 mb-3 text-sm leading-relaxed">
                                Wenn Ihr Körper zu wenig <strong>eigene Endocannabinoide</strong> produziert, entsteht eine <strong>klinische Endocannabinoid-Defizienz</strong>. Das ECS kann seine Aufgaben nicht mehr erfüllen.
                            </p>
                            <div class="bg-white p-3 rounded border-l-4 border-red-500">
                                <p class="text-sm text-gray-800 font-semibold mb-1">Folgen einer CED:</p>
                                <ul class="text-xs text-gray-700 space-y-1">
                                    <li>• Chronische Schmerzen (Fibromyalgie, Migräne)</li>
                                    <li>• Angststörungen, Depressionen</li>
                                    <li>• Schlafstörungen, Erschöpfung</li>
                                    <li>• Entzündliche Darmerkrankungen</li>
                                    <li>• Autoimmunerkrankungen</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-green-50 to-teal-50 p-5 rounded-lg border-2 border-green-300">
                            <h3 class="font-bold text-green-900 mb-2 text-lg">
                                <i class="fas fa-leaf mr-2"></i>
                                Die Lösung: Exogene Cannabinoide
                            </h3>
                            <p class="text-gray-700 text-sm leading-relaxed">
                                <strong>CBD (Cannabidiol)</strong> und andere Phytocannabinoide wirken wie körpereigene Endocannabinoide. Sie <strong>füllen die Lücke</strong> und helfen Ihrem ECS, wieder stark zu werden.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- The Journey: From Medication to Strong ECS -->
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 p-8 mb-8 rounded-xl shadow-lg fade-in">
                <h2 class="text-3xl font-bold text-gray-900 mb-6 text-center">
                    <i class="fas fa-route text-indigo-600 mr-3"></i>
                    Ihr Weg: Von Medikamenten-Abhängigkeit zu einem starken ECS
                </h2>
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="bg-white p-5 rounded-lg shadow text-center">
                        <div class="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-pills text-red-600 text-2xl"></i>
                        </div>
                        <h4 class="font-bold text-gray-800 mb-2">1. Status Quo</h4>
                        <p class="text-sm text-gray-600">Schwaches ECS → Viele Medikamente</p>
                    </div>
                    <div class="bg-white p-5 rounded-lg shadow text-center">
                        <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-leaf text-green-600 text-2xl"></i>
                        </div>
                        <h4 class="font-bold text-gray-800 mb-2">2. ECS Stärken</h4>
                        <p class="text-sm text-gray-600">Exogene Cannabinoide zuführen</p>
                    </div>
                    <div class="bg-white p-5 rounded-lg shadow text-center">
                        <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-chart-line text-blue-600 text-2xl"></i>
                        </div>
                        <h4 class="font-bold text-gray-800 mb-2">3. Medikamente reduzieren</h4>
                        <p class="text-sm text-gray-600">Unter ärztlicher Begleitung ausschleichen</p>
                    </div>
                    <div class="bg-white p-5 rounded-lg shadow text-center">
                        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-heart text-purple-600 text-2xl"></i>
                        </div>
                        <h4 class="font-bold text-gray-800 mb-2">4. Starkes ECS</h4>
                        <p class="text-sm text-gray-600">Körper reguliert sich selbst</p>
                    </div>
                </div>
                <div class="mt-6 bg-white p-5 rounded-lg text-center">
                    <p class="text-gray-800 text-lg font-semibold">
                        <i class="fas fa-arrow-right text-indigo-600 mr-2"></i>
                        Beginnen Sie jetzt mit Ihrem individualisierten Ausschleichplan!
                    </p>
                </div>
            </div>
            
            <!-- FAQ Section: Häufig gestellte Fragen -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-question-circle text-blue-600 mr-3"></i>
                    Häufig gestellte Fragen
                </h2>
                
                <!-- FAQ 1: Wie exogene Cannabinoide ECS aktivieren -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-lg font-bold text-gray-800 py-3 flex items-center hover:text-purple-600 transition">
                        <i class="fas fa-microscope text-purple-600 mr-3"></i>
                        <span>Wie aktivieren exogene Cannabinoide mein Endocannabinoid-System?</span>
                        <i class="fas fa-chevron-down ml-auto"></i>
                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="bg-purple-50 p-5 rounded-lg mb-4">
                            <h4 class="font-bold text-purple-900 mb-3">
                                <i class="fas fa-atom mr-2"></i>
                                Der biochemische Mechanismus:
                            </h4>
                            <p class="text-sm mb-3">
                                CBD (Cannabidiol) wirkt auf mehrere Arten in Ihrem Körper:
                            </p>
                            <ul class="text-sm space-y-2">
                                <li><strong>• Hemmt FAAH-Enzym:</strong> Verhindert den Abbau von Anandamid (körpereigenes "Glücks-Endocannabinoid"), sodass mehr davon im Körper verfügbar bleibt</li>
                                <li><strong>• Aktiviert Serotonin-Rezeptoren (5-HT1A):</strong> Wirkt angstlösend und stimmungsaufhellend – ähnlich wie Antidepressiva</li>
                                <li><strong>• Moduliert CB1/CB2-Rezeptoren:</strong> Indirekte Aktivierung des ECS ohne psychoaktive Wirkung</li>
                                <li><strong>• Hemmt Entzündungen:</strong> Reduziert COX-2 und NF-κB (entzündungsfördernde Enzyme)</li>
                                <li><strong>• Antioxidative Wirkung:</strong> Schützt Nervenzellen vor oxidativem Stress</li>
                            </ul>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <p class="text-sm">
                                <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                <strong>Wichtig:</strong> CBD hat <strong>keine psychoaktive Wirkung</strong>, macht nicht "high" und ist <strong>nicht abhängigkeitsbildend</strong>.
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 2: Welche Medikamente sind gefährlich? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-lg font-bold text-gray-800 py-3 flex items-center hover:text-purple-600 transition">
                        <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
                        <span>Bei welchen Medikamenten sind Wechselwirkungen mit CBD besonders gefährlich?</span>
                        <i class="fas fa-chevron-down ml-auto"></i>
                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="bg-red-50 p-5 rounded-lg mb-4 border-l-4 border-red-500">
                            <h4 class="font-bold text-red-900 mb-3">
                                <i class="fas fa-pills mr-2"></i>
                                Kritische Medikamentengruppen:
                            </h4>
                            <ul class="text-sm space-y-3">
                                <li><strong>🩸 Blutverdünner (Antikoagulanzien):</strong> Warfarin/Marcumar, Xarelto, Eliquis – CBD kann die Blutgerinnung weiter hemmen → Blutungsrisiko erhöht</li>
                                <li><strong>💊 Immunsuppressiva:</strong> Sandimmun (Ciclosporin), Prograf (Tacrolimus) – CBD kann Wirkspiegel erhöhen → Toxizität möglich</li>
                                <li><strong>🧠 Opioide:</strong> OxyContin, Tramadol, Morphin – CBD + Opioide kann zu übermäßiger Sedierung führen → Atemdepression</li>
                                <li><strong>💤 Benzodiazepine:</strong> Tavor (Lorazepam), Valium (Diazepam), Rivotril – Verstärkte Müdigkeit, Sturzgefahr bei älteren Menschen</li>
                                <li><strong>😴 Antidepressiva & Antipsychotika:</strong> Verstärkung der sedierenden Wirkung, mögliche CYP450-Interaktionen</li>
                                <li><strong>🫀 Herzrhythmus-Medikamente:</strong> Amiodaron – CBD kann Wirkspiegel beeinflussen</li>
                            </ul>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                            <p class="text-sm text-yellow-900">
                                <i class="fas fa-user-md mr-2"></i>
                                <strong>Wichtig:</strong> Unser Tool prüft diese Wechselwirkungen automatisch und passt die Startdosis entsprechend an. Bei kritischen Medikamenten empfehlen wir eine <strong>sehr vorsichtige Einschleichphase</strong> und <strong>engmaschige ärztliche Kontrolle</strong>.
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 3: Wie lange bis Wirkung? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-lg font-bold text-gray-800 py-3 flex items-center hover:text-purple-600 transition">
                        <i class="fas fa-clock text-blue-600 mr-3"></i>
                        <span>Wie lange dauert es, bis CBD wirkt? Und wie lange hält die Wirkung an?</span>
                        <i class="fas fa-chevron-down ml-auto"></i>
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
                    <summary class="text-lg font-bold text-gray-800 py-3 flex items-center hover:text-purple-600 transition">
                        <i class="fas fa-chart-line text-green-600 mr-3"></i>
                        <span>Kann ich wirklich meine Medikamente mit CBD reduzieren? Gibt es dafür Beweise?</span>
                        <i class="fas fa-chevron-down ml-auto"></i>
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
                    <summary class="text-lg font-bold text-gray-800 py-3 flex items-center hover:text-purple-600 transition">
                        <i class="fas fa-shield-alt text-green-600 mr-3"></i>
                        <span>Macht CBD abhängig? Welche Nebenwirkungen kann es geben?</span>
                        <i class="fas fa-chevron-down ml-auto"></i>
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
                    <summary class="text-lg font-bold text-gray-800 py-3 flex items-center hover:text-purple-600 transition">
                        <i class="fas fa-user-md text-teal-600 mr-3"></i>
                        <span>Wie finde ich einen Arzt, der mich beim Medikamenten-Ausschleichen mit CBD begleitet?</span>
                        <i class="fas fa-chevron-down ml-auto"></i>
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
                    <summary class="text-lg font-bold text-gray-800 py-3 flex items-center hover:text-purple-600 transition">
                        <i class="fas fa-euro-sign text-orange-600 mr-3"></i>
                        <span>Was kostet CBD-Paste? Übernimmt die Krankenkasse die Kosten?</span>
                        <i class="fas fa-chevron-down ml-auto"></i>
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
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-syringe text-blue-600 mr-3"></i>
                    Erstellen Sie Ihren persönlichen CBD-Ausschleichplan
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
                            Ausschleichplan erstellen
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
                            Bild analysieren & Ausschleichplan erstellen
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
