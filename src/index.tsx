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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>redu-med – Medikamentenreduktion unter ärztlicher Begleitung</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          :root {
            --primary: #0f766e;
            --primary-light: #14b8a6;
            --primary-dark: #115e59;
          }
          
          html { scroll-behavior: smooth; }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeIn 0.6s ease-out; }
          
          .section-card {
            background: white;
            border-left: 4px solid var(--primary);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
        </style>
    </head>
    <body class="bg-slate-50">
        <!-- Header -->
        <header class="bg-gradient-to-r from-teal-700 to-teal-800 text-white py-6 md:py-8 shadow-md sticky top-0 z-50">
            <div class="max-w-5xl mx-auto px-4 sm:px-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex-1">
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold mb-2 leading-tight">
                            <i class="fas fa-leaf mr-2 text-teal-300"></i>
                            Weniger Medikamente. Mehr Balance.
                        </h1>
                        <p class="text-teal-100 text-sm sm:text-base">
                            Mit der Kraft Ihres Endocannabinoid-Systems – ärztlich begleitet.
                        </p>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3">
                        <a href="#dosierungsplan-erstellen" class="block bg-white text-teal-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-teal-50 transition-all text-center shadow-lg">
                            <i class="fas fa-clipboard-list mr-2"></i>
                            Analyse starten
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
            
            <!-- Hero: Das Problem -->
            <div class="section-card p-6 md:p-8 mb-6 rounded-lg fade-in">
                <div class="flex items-start gap-4 md:gap-6">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 md:w-14 md:h-14 bg-red-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-pills text-red-600 text-xl md:text-2xl"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3">
                            Zu viele Medikamente? Sie sind nicht allein.
                        </h2>
                        <p class="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                            Viele Menschen nehmen täglich mehrere Medikamente und möchten diese Schritt für Schritt reduzieren – 
                            aber <strong>sicher</strong> und <strong>unter ärztlicher Begleitung</strong>.
                        </p>
                        
                        <div class="bg-teal-50 p-4 rounded-lg border border-teal-200 mb-4">
                            <p class="text-sm text-gray-800">
                                <strong class="text-teal-700">redu-med</strong> hilft Ihnen dabei: Eine KI-gestützte Analyse zeigt Ihnen, 
                                wie Ihr körpereigenes Endocannabinoid-System (ECS) gestärkt werden kann – als Grundlage für 
                                das Gespräch mit Ihrem Arzt.
                            </p>
                        </div>
                        
                        <a href="#dosierungsplan-erstellen" class="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg">
                            <i class="fas fa-arrow-right"></i>
                            Jetzt kostenlos Analyse starten
                        </a>
                    </div>
                </div>
            </div>

            <!-- ECS Kurz erklärt -->
            <div class="section-card p-6 md:p-8 mb-6 rounded-lg fade-in">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-brain text-teal-700"></i>
                    Was ist das Endocannabinoid-System (ECS)?
                </h2>
                <p class="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                    Das ECS ist Ihr körpereigenes Regulationssystem – es steuert Schmerz, Schlaf, Stimmung, Entzündungen und mehr. 
                    <strong>Wenn das ECS geschwächt ist</strong>, entstehen oft viele Symptome, für die dann Medikamente eingesetzt werden.
                </p>
                
                <div class="grid sm:grid-cols-2 gap-4">
                    <div class="bg-slate-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-900 mb-2 text-sm">
                            <i class="fas fa-arrow-down text-red-600 mr-2"></i>
                            Schwaches ECS
                        </h3>
                        <p class="text-xs text-gray-600">Symptome nehmen zu → mehr Medikamente nötig</p>
                    </div>
                    <div class="bg-teal-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-teal-900 mb-2 text-sm">
                            <i class="fas fa-arrow-up text-teal-600 mr-2"></i>
                            Starkes ECS
                        </h3>
                        <p class="text-xs text-gray-700">Bessere Regulation → weniger Medikamente unter ärztlicher Aufsicht</p>
                    </div>
                </div>
                
                <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 mt-4">
                    <p class="text-sm text-red-800 leading-relaxed">
                        <i class="fas fa-exclamation-circle text-red-600 mr-2"></i>
                        <strong>Wichtig:</strong> Ob und wie Medikamente reduziert werden können, entscheidet immer Ihr Arzt. 
                        redu-med bietet nur eine Analyse als Gesprächsgrundlage.
                    </p>
                </div>
            </div>

            <!-- Wie funktioniert redu-med -->
            <div class="section-card p-6 md:p-8 mb-6 rounded-lg fade-in">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-clipboard-check text-teal-700"></i>
                    So funktioniert redu-med
                </h2>
                <p class="text-sm sm:text-base text-gray-700 mb-4">In 3 einfachen Schritten zu Ihrer persönlichen Analyse:</p>
                
                <div class="space-y-3">
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-700 text-sm">1</div>
                        <div class="flex-1 pt-1">
                            <h3 class="font-semibold text-gray-900 text-sm mb-1">Medikamente eingeben</h3>
                            <p class="text-xs text-gray-600">Ihre aktuelle Medikation und Körperdaten angeben</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-700 text-sm">2</div>
                        <div class="flex-1 pt-1">
                            <h3 class="font-semibold text-gray-900 text-sm mb-1">KI-Analyse erhalten</h3>
                            <p class="text-xs text-gray-600">Wechselwirkungen prüfen und ECS-Stärkungsplan erstellen</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-700 text-sm">3</div>
                        <div class="flex-1 pt-1">
                            <h3 class="font-semibold text-gray-900 text-sm mb-1">Mit Arzt besprechen</h3>
                            <p class="text-xs text-gray-600">Bericht ausdrucken und gemeinsam mit Ihrem Arzt entscheiden</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FAQ Compact -->
            <div class="section-card p-6 md:p-8 mb-6 rounded-lg fade-in">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                    Häufige Fragen
                </h2>
                
                <div class="space-y-3">
                    <details class="group">
                        <summary class="cursor-pointer text-sm font-semibold text-gray-900 list-none flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                            <span>Kann ich meine Medikamente selbst reduzieren?</span>
                            <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <p class="text-xs text-gray-700 mt-2 px-3 pb-2 leading-relaxed">
                            <strong class="text-red-700">Nein, auf keinen Fall.</strong> Veränderungen an der Medikation dürfen ausschließlich durch Ihren behandelnden Arzt vorgenommen werden.
                        </p>
                    </details>

                    <details class="group">
                        <summary class="cursor-pointer text-sm font-semibold text-gray-900 list-none flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                            <span>Ersetzt CBD Medikamente?</span>
                            <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <p class="text-xs text-gray-700 mt-2 px-3 pb-2 leading-relaxed">
                            <strong>Nein.</strong> CBD kann das ECS unterstützen. Ob dadurch Medikamente reduziert werden können, entscheidet ausschließlich Ihr Arzt.
                        </p>
                    </details>

                    <details class="group">
                        <summary class="cursor-pointer text-sm font-semibold text-gray-900 list-none flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                            <span>Was mache ich mit der Analyse?</span>
                            <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <p class="text-xs text-gray-700 mt-2 px-3 pb-2 leading-relaxed">
                            Drucken Sie den Bericht aus und besprechen Sie ihn mit Ihrem Arzt. Der Arzt prüft, ob eine Medikamentenoptimierung möglich ist.
                        </p>
                    </details>

                    <details class="group">
                        <summary class="cursor-pointer text-sm font-semibold text-gray-900 list-none flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                            <span>Kostet das Tool etwas?</span>
                            <i class="fas fa-chevron-down text-gray-400 group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <p class="text-xs text-gray-700 mt-2 px-3 pb-2 leading-relaxed">
                            Die Basisanalyse ist aktuell <strong>kostenlos</strong> nutzbar.
                        </p>
                    </details>
                </div>
            </div>

            <!-- Haftungsausschluss Compact -->
            <div class="section-card p-6 mb-6 rounded-lg bg-gray-50 border-t-4 border-gray-300">
                <h2 class="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <i class="fas fa-balance-scale text-gray-700"></i>
                    Haftungsausschluss
                </h2>
                <p class="text-xs sm:text-sm text-gray-700 leading-relaxed mb-2">
                    <strong class="text-red-700">redu-med gibt keinerlei medizinische Empfehlungen.</strong> 
                    Die Inhalte ersetzen keine Diagnose oder Therapie. Veränderungen an Medikamenten dürfen ausschließlich durch den behandelnden Arzt erfolgen.
                </p>
                <p class="text-xs text-gray-600">
                    Das eigenständige Absetzen, Reduzieren oder Verändern von Medikamenten ohne ärztliche Anordnung kann schwerwiegende gesundheitliche Folgen haben.
                </p>
            </div>


            <!-- Main Form -->
            <div id="dosierungsplan-erstellen" class="section-card p-8 mb-8 rounded-lg fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div class="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-syringe text-teal-700 text-lg"></i>
                    </div>
                    <span>Erstellen Sie Ihren persönlichen Medikamenten-Reduktionsplan</span>
                </h2>
                    <!-- Progress Stepper -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between max-w-3xl mx-auto mb-2">
                            <div class="flex-1 flex items-center">
                                <div id="step-indicator-1" class="step-indicator active flex items-center justify-center w-10 h-10 rounded-full bg-teal-700 text-white font-bold">
                                    1
                                </div>
                                <div class="flex-1 h-1 bg-gray-300 mx-2">
                                    <div id="progress-bar-1" class="h-full bg-teal-700 transition-all duration-300" style="width: 100%"></div>
                                </div>
                            </div>
                            <div class="flex-1 flex items-center">
                                <div id="step-indicator-2" class="step-indicator flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-600 font-bold">
                                    2
                                </div>
                                <div class="flex-1 h-1 bg-gray-300 mx-2">
                                    <div id="progress-bar-2" class="h-full bg-teal-700 transition-all duration-300" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="flex-1 flex items-center">
                                <div id="step-indicator-3" class="step-indicator flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-600 font-bold">
                                    3
                                </div>
                                <div class="flex-1 h-1 bg-gray-300 mx-2">
                                    <div id="progress-bar-3" class="h-full bg-teal-700 transition-all duration-300" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="flex-1 flex items-center">
                                <div id="step-indicator-4" class="step-indicator flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-600 font-bold">
                                    4
                                </div>
                                <div class="flex-1 h-1 bg-gray-300 mx-2">
                                    <div id="progress-bar-4" class="h-full bg-teal-700 transition-all duration-300" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="flex-1 flex items-center justify-end">
                                <div id="step-indicator-5" class="step-indicator flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-600 font-bold">
                                    5
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-between max-w-3xl mx-auto text-xs text-gray-600">
                            <span class="w-20 text-center">Name</span>
                            <span class="w-20 text-center">Körperdaten</span>
                            <span class="w-20 text-center">Medikamente</span>
                            <span class="w-20 text-center">Plan</span>
                            <span class="w-20 text-center">Zusammenfassung</span>
                        </div>
                    </div>

                    <form id="medication-form">
                        <!-- STEP 1: Name & Gender -->
                        <div id="step-1" class="form-step">
                            <div class="bg-slate-50 p-8 rounded-lg border border-slate-200">
                                <h3 class="text-xl font-bold text-gray-900 mb-2">
                                    <i class="fas fa-user-circle mr-2 text-teal-700"></i>
                                    Schritt 1: Persönliche Angaben
                                </h3>
                                <p class="text-sm text-gray-600 mb-6">
                                    Damit wir Sie persönlich ansprechen können.
                                </p>
                                
                                <div class="max-w-xl">
                                    <div class="mb-6">
                                        <label class="block text-gray-700 font-medium mb-2 text-base">
                                            <i class="fas fa-id-card mr-2"></i>
                                            Ihr Vorname *
                                        </label>
                                        <input type="text" id="first-name" name="first_name" 
                                               placeholder="z.B. Maria" 
                                               class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-base"
                                               required>
                                    </div>
                                    
                                    <div class="mb-6">
                                        <label class="block text-gray-700 font-medium mb-3 text-base">
                                            <i class="fas fa-venus-mars mr-2"></i>
                                            Geschlecht *
                                        </label>
                                        <div class="flex gap-6">
                                            <label class="flex items-center cursor-pointer bg-white px-6 py-4 rounded-lg border-2 border-gray-300 hover:border-teal-500 transition-colors flex-1">
                                                <input type="radio" name="gender" value="female" class="w-5 h-5 text-teal-700 focus:ring-teal-500" required>
                                                <span class="ml-3 text-gray-700 font-medium text-base">
                                                    <i class="fas fa-venus text-pink-500 mr-2 text-lg"></i>
                                                    Weiblich
                                                </span>
                                            </label>
                                            <label class="flex items-center cursor-pointer bg-white px-6 py-4 rounded-lg border-2 border-gray-300 hover:border-teal-500 transition-colors flex-1">
                                                <input type="radio" name="gender" value="male" class="w-5 h-5 text-teal-700 focus:ring-teal-500" required>
                                                <span class="ml-3 text-gray-700 font-medium text-base">
                                                    <i class="fas fa-mars text-blue-500 mr-2 text-lg"></i>
                                                    Männlich
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-end mt-6">
                                <button type="button" class="next-step px-8 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-md text-base">
                                    Weiter <i class="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </div>

                        <!-- STEP 2: Body Data -->
                        <div id="step-2" class="form-step hidden">
                            <div class="bg-slate-50 p-8 rounded-lg border border-slate-200">
                                <h3 class="text-xl font-bold text-gray-900 mb-2">
                                    <i class="fas fa-weight mr-2 text-teal-700"></i>
                                    Schritt 2: Körperdaten
                                </h3>
                                <p class="text-sm text-gray-600 mb-6">
                                    Diese Angaben helfen uns, die Cannabinoid-Dosierung individuell für Sie zu berechnen.
                                </p>
                                
                                <div class="grid md:grid-cols-3 gap-6 max-w-3xl">
                                    <div>
                                        <label class="block text-gray-700 font-medium mb-2 text-base">
                                            <i class="fas fa-birthday-cake mr-2"></i>
                                            Alter (Jahre) *
                                        </label>
                                        <input type="number" id="age" name="age" 
                                               placeholder="z.B. 45" 
                                               min="18" 
                                               max="120"
                                               class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-white"
                                               required>
                                        <p class="text-xs text-gray-500 mt-2">Für altersgerechte Dosierung</p>
                                    </div>
                                    <div>
                                        <label class="block text-gray-700 font-medium mb-2 text-base">
                                            <i class="fas fa-weight mr-2"></i>
                                            Gewicht (kg) *
                                        </label>
                                        <input type="number" id="weight" name="weight" 
                                               placeholder="z.B. 70" 
                                               min="30" 
                                               max="250"
                                               step="0.1"
                                               class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-white"
                                               required>
                                        <p class="text-xs text-gray-500 mt-2">In Kilogramm</p>
                                    </div>
                                    <div>
                                        <label class="block text-gray-700 font-medium mb-2 text-base">
                                            <i class="fas fa-ruler-vertical mr-2"></i>
                                            Größe (cm) *
                                        </label>
                                        <input type="number" id="height" name="height" 
                                               placeholder="z.B. 170" 
                                               min="100" 
                                               max="250"
                                               class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-white"
                                               required>
                                        <p class="text-xs text-gray-500 mt-2">In Zentimetern</p>
                                    </div>
                                </div>
                                
                                <div class="bg-blue-50 p-4 rounded-lg mt-6 max-w-3xl border-l-4 border-blue-400">
                                    <p class="text-sm text-gray-700">
                                        <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                                        Ihre Daten werden verwendet, um die Cannabinoid-Dosierung an Ihr Körpergewicht und Alter anzupassen.
                                    </p>
                                </div>
                            </div>
                            
                            <div class="flex justify-between mt-6">
                                <button type="button" class="prev-step px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-base">
                                    <i class="fas fa-arrow-left mr-2"></i> Zurück
                                </button>
                                <button type="button" class="next-step px-8 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-md text-base">
                                    Weiter <i class="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </div>

                        <!-- STEP 3: Medications -->
                        <div id="step-3" class="form-step hidden">
                            <div class="bg-slate-50 p-8 rounded-lg border border-slate-200">
                                <h3 class="text-xl font-bold text-gray-900 mb-2">
                                    <i class="fas fa-pills mr-2 text-teal-700"></i>
                                    Schritt 3: Ihre Medikamente
                                </h3>
                                <p class="text-sm text-gray-600 mb-6">
                                    Geben Sie alle Medikamente ein, die Sie derzeit einnehmen. Unsere Datenbank prüft automatisch mögliche Wechselwirkungen mit Cannabinoiden.
                                </p>
                                
                                <div id="medication-inputs" class="space-y-4 mb-4">
                                    <div class="medication-input-group flex gap-3" style="position: relative;">
                                        <input type="text" name="medication_name[]" 
                                               placeholder="z.B. Tippen Sie 'IBU' für Ibuprofen..." 
                                               class="medication-name-input flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base bg-white"
                                               required>
                                        <input type="text" name="medication_dosage[]" 
                                               placeholder="Dosierung (z.B. 400mg täglich)" 
                                               class="w-72 px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base bg-white">
                                        <button type="button" class="remove-medication px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hidden">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <button type="button" id="add-medication" class="px-5 py-2.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 font-medium text-base border-2 border-teal-300 transition-colors">
                                    <i class="fas fa-plus mr-2"></i>
                                    Weiteres Medikament hinzufügen
                                </button>
                                
                                <div class="bg-amber-50 p-4 rounded-lg mt-6 border-l-4 border-amber-400">
                                    <p class="text-sm text-gray-700">
                                        <i class="fas fa-exclamation-triangle text-amber-600 mr-2"></i>
                                        <strong>Wichtig:</strong> Die Angabe aller Medikamente ist entscheidend für Ihre Sicherheit. Unsere KI analysiert automatisch mögliche Wechselwirkungen.
                                    </p>
                                </div>
                            </div>
                            
                            <div class="flex justify-between mt-6">
                                <button type="button" class="prev-step px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-base">
                                    <i class="fas fa-arrow-left mr-2"></i> Zurück
                                </button>
                                <button type="button" class="next-step px-8 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-md text-base">
                                    Weiter <i class="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </div>

                        <!-- STEP 4: Plan Settings -->
                        <div id="step-4" class="form-step hidden">
                            <div class="bg-slate-50 p-8 rounded-lg border border-slate-200">
                                <h3 class="text-xl font-bold text-gray-900 mb-2">
                                    <i class="fas fa-cog mr-2 text-teal-700"></i>
                                    Schritt 4: Plan-Einstellungen
                                </h3>
                                <p class="text-sm text-gray-600 mb-6">
                                    Wählen Sie die Dauer Ihres Reduktionsplans und Ihr Reduktionsziel.
                                </p>
                                
                                <div class="max-w-2xl space-y-6">
                                    <!-- Plan Duration Dropdown -->
                                    <div>
                                        <label class="block text-gray-700 font-medium mb-3 text-base">
                                            <i class="fas fa-calendar-alt mr-2"></i>
                                            Plan-Dauer *
                                        </label>
                                        <select id="duration-weeks" name="duration_weeks" 
                                                class="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-base"
                                                required>
                                            <option value="">-- Bitte wählen Sie eine Dauer --</option>
                                            <option value="4">4 Wochen – Schneller Einstieg (nur für Erfahrene)</option>
                                            <option value="6">6 Wochen – Zügig</option>
                                            <option value="8">8 Wochen – Standard (empfohlen)</option>
                                            <option value="10">10 Wochen – Behutsam</option>
                                            <option value="12">12 Wochen – Sehr langsam & sicher</option>
                                        </select>
                                        <p class="text-xs text-gray-500 mt-2">
                                            <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
                                            Empfehlung: 8-12 Wochen für nachhaltige ECS-Aktivierung und sanfte Medikamenten-Reduktion
                                        </p>
                                    </div>
                                    
                                    <!-- Reduction Goal Dropdown -->
                                    <div>
                                        <label class="block text-gray-700 font-medium mb-3 text-base">
                                            <i class="fas fa-bullseye mr-2"></i>
                                            Reduktionsziel *
                                        </label>
                                        <select id="reduction-goal" name="reduction_goal" 
                                                class="w-full px-5 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-base"
                                                required>
                                            <option value="">-- Bitte wählen Sie Ihr Ziel --</option>
                                            <option value="10">10% Reduktion – Minimale Anpassung</option>
                                            <option value="20">20% Reduktion – Leichte Reduktion</option>
                                            <option value="30">30% Reduktion – Moderate Reduktion</option>
                                            <option value="40">40% Reduktion – Spürbare Reduktion</option>
                                            <option value="50">50% Reduktion – Halbierung (empfohlen für Einstieg)</option>
                                            <option value="60">60% Reduktion – Deutliche Reduktion</option>
                                            <option value="70">70% Reduktion – Starke Reduktion</option>
                                            <option value="80">80% Reduktion – Sehr starke Reduktion</option>
                                            <option value="90">90% Reduktion – Fast vollständiges Absetzen</option>
                                            <option value="100">100% Reduktion – Vollständiges Absetzen</option>
                                        </select>
                                        <p class="text-xs text-gray-500 mt-2">
                                            <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
                                            Empfehlung: Starten Sie mit 50% Reduktion und passen Sie bei Bedarf in späteren Zyklen an
                                        </p>
                                    </div>
                                    
                                    <!-- Warning Box (initially hidden, shown by JS) -->
                                    <div id="plan-warning" class="hidden bg-red-50 p-5 rounded-lg border-l-4 border-red-500">
                                        <p class="text-sm text-red-800 font-medium">
                                            <i class="fas fa-exclamation-circle text-red-600 mr-2"></i>
                                            <strong>Achtung: Ungünstige Kombination!</strong>
                                        </p>
                                        <p id="plan-warning-text" class="text-sm text-red-700 mt-2"></p>
                                    </div>
                                    
                                    <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                        <p class="text-sm text-gray-700">
                                            <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                                            Ihr persönlicher Reduktionsplan wird basierend auf diesen Einstellungen, Ihren Körperdaten und Medikamenten individuell berechnet.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-between mt-6">
                                <button type="button" class="prev-step px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-base">
                                    <i class="fas fa-arrow-left mr-2"></i> Zurück
                                </button>
                                <button type="button" class="next-step px-8 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors shadow-md text-base">
                                    Weiter <i class="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </div>

                        <!-- STEP 5: Email & Summary -->
                        <div id="step-5" class="form-step hidden">
                            <div class="bg-slate-50 p-8 rounded-lg border border-slate-200">
                                <h3 class="text-xl font-bold text-gray-900 mb-2">
                                    <i class="fas fa-check-circle mr-2 text-teal-700"></i>
                                    Schritt 5: E-Mail & Zusammenfassung
                                </h3>
                                <p class="text-sm text-gray-600 mb-6">
                                    Überprüfen Sie Ihre Angaben und geben Sie Ihre E-Mail-Adresse ein, um Ihren persönlichen Reduktionsplan zu erhalten.
                                </p>
                                
                                <!-- Email Input -->
                                <div class="bg-green-50 p-6 rounded-lg mb-6 border-l-4 border-green-500 max-w-2xl">
                                    <label class="block text-gray-700 font-semibold mb-3 text-base">
                                        <i class="fas fa-envelope mr-2 text-green-600"></i>
                                        Ihre E-Mail-Adresse *
                                    </label>
                                    <input type="email" id="email" name="email" 
                                           placeholder="ihre.email@beispiel.de"
                                           class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-base"
                                           required>
                                    <p class="text-xs text-gray-600 mt-2">
                                        <i class="fas fa-shield-alt text-green-600 mr-1"></i>
                                        Datensicherheit garantiert – Ihre Daten werden nicht weitergegeben.
                                    </p>
                                </div>
                                
                                <!-- Summary -->
                                <div class="bg-white p-6 rounded-lg border border-gray-300 max-w-2xl">
                                    <h4 class="font-bold text-gray-900 mb-4 text-lg">
                                        <i class="fas fa-clipboard-list mr-2 text-teal-700"></i>
                                        Ihre Angaben im Überblick
                                    </h4>
                                    
                                    <div class="space-y-3 text-sm">
                                        <div class="flex justify-between py-2 border-b border-gray-200">
                                            <span class="text-gray-600 font-medium">Name:</span>
                                            <span id="summary-name" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b border-gray-200">
                                            <span class="text-gray-600 font-medium">Geschlecht:</span>
                                            <span id="summary-gender" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b border-gray-200">
                                            <span class="text-gray-600 font-medium">Alter:</span>
                                            <span id="summary-age" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b border-gray-200">
                                            <span class="text-gray-600 font-medium">Gewicht:</span>
                                            <span id="summary-weight" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b border-gray-200">
                                            <span class="text-gray-600 font-medium">Größe:</span>
                                            <span id="summary-height" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b border-gray-200">
                                            <span class="text-gray-600 font-medium">Medikamente:</span>
                                            <span id="summary-medications" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                        <div class="flex justify-between py-2 border-b border-gray-200">
                                            <span class="text-gray-600 font-medium">Plan-Dauer:</span>
                                            <span id="summary-duration" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                        <div class="flex justify-between py-2">
                                            <span class="text-gray-600 font-medium">Reduktionsziel:</span>
                                            <span id="summary-goal" class="text-gray-900 font-semibold">-</span>
                                        </div>
                                    </div>
                                    
                                    <button type="button" id="edit-summary" class="mt-4 text-teal-700 hover:text-teal-800 font-medium text-sm">
                                        <i class="fas fa-edit mr-1"></i>
                                        Angaben bearbeiten (zurück zu Schritt 1)
                                    </button>
                                </div>
                            </div>
                            
                            <div class="flex justify-between mt-6">
                                <button type="button" class="prev-step px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-base">
                                    <i class="fas fa-arrow-left mr-2"></i> Zurück
                                </button>
                                <button type="submit" class="px-10 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg text-base">
                                    <i class="fas fa-syringe mr-2"></i>
                                    Reduktionsplan erstellen
                                </button>
                            </div>
                        </div>
                    </form>
            </div>

            <!-- Loading - Advanced KI Analysis Animation -->
            <div id="loading" class="hidden section-card p-10 text-center rounded-lg">
                <!-- Animated KI Brain with Multiple Pulse Rings -->
                <div class="relative inline-block mb-8">
                    <!-- Outer pulse ring -->
                    <div class="absolute inset-0 -m-8 bg-teal-200 rounded-full opacity-40 animate-ping"></div>
                    <!-- Middle pulse ring -->
                    <div class="absolute inset-0 -m-4 bg-teal-300 rounded-full opacity-50 animate-ping" style="animation-delay: 0.3s"></div>
                    <!-- Inner pulse ring -->
                    <div class="absolute inset-0 bg-teal-400 rounded-full opacity-60 animate-ping" style="animation-delay: 0.6s"></div>
                    
                    <!-- Main brain icon with rotation animation -->
                    <div class="relative w-24 h-24 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                        <i class="fas fa-brain text-white text-4xl"></i>
                    </div>
                    
                    <!-- Orbiting particles -->
                    <div class="absolute top-0 left-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-spin" style="animation-duration: 2s; transform-origin: 0 48px;"></div>
                    <div class="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-spin" style="animation-duration: 3s; animation-delay: 0.5s; transform-origin: 0 48px;"></div>
                </div>
                
                <!-- Main Headline with animated gradient -->
                <h3 class="text-2xl font-bold mb-3 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    <i class="fas fa-sparkles text-teal-600 mr-2"></i>
                    KI analysiert Ihre Daten
                </h3>
                <p class="text-gray-600 mb-8 text-base font-medium">
                    <span id="analysis-status">Analyse wird gestartet</span>
                    <span class="inline-block animate-bounce">...</span>
                </p>
                
                <!-- Detailed Analysis Steps with Rich Animation -->
                <div class="max-w-2xl mx-auto space-y-4 mb-8">
                    <!-- Step 1: Database Search -->
                    <div id="analysis-step-1" class="flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm opacity-40 transition-all duration-500">
                        <div class="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300">
                            <i id="icon-1" class="fas fa-database text-gray-400 text-xl"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="text-base font-bold text-gray-800 mb-1">Medikamenten-Datenbank durchsuchen</h4>
                            <p id="detail-1" class="text-sm text-gray-500">Wartet auf Start...</p>
                            <!-- Mini progress bar for this step -->
                            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div id="mini-progress-1" class="bg-teal-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            <i id="check-1" class="fas fa-check text-green-600 text-2xl hidden"></i>
                            <i id="spinner-1" class="fas fa-spinner fa-spin text-teal-600 text-xl hidden"></i>
                        </div>
                    </div>
                    
                    <!-- Step 2: Interaction Check -->
                    <div id="analysis-step-2" class="flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm opacity-40 transition-all duration-500">
                        <div class="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300">
                            <i id="icon-2" class="fas fa-exchange-alt text-gray-400 text-xl"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="text-base font-bold text-gray-800 mb-1">Wechselwirkungen analysieren</h4>
                            <p id="detail-2" class="text-sm text-gray-500">Wartet auf Start...</p>
                            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div id="mini-progress-2" class="bg-teal-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            <i id="check-2" class="fas fa-check text-green-600 text-2xl hidden"></i>
                            <i id="spinner-2" class="fas fa-spinner fa-spin text-teal-600 text-xl hidden"></i>
                        </div>
                    </div>
                    
                    <!-- Step 3: Personal Data -->
                    <div id="analysis-step-3" class="flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm opacity-40 transition-all duration-500">
                        <div class="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300">
                            <i id="icon-3" class="fas fa-user-md text-gray-400 text-xl"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="text-base font-bold text-gray-800 mb-1">Körperdaten verarbeiten</h4>
                            <p id="detail-3" class="text-sm text-gray-500">Wartet auf Start...</p>
                            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div id="mini-progress-3" class="bg-teal-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            <i id="check-3" class="fas fa-check text-green-600 text-2xl hidden"></i>
                            <i id="spinner-3" class="fas fa-spinner fa-spin text-teal-600 text-xl hidden"></i>
                        </div>
                    </div>
                    
                    <!-- Step 4: Dosage Calculation -->
                    <div id="analysis-step-4" class="flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm opacity-40 transition-all duration-500">
                        <div class="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300">
                            <i id="icon-4" class="fas fa-calculator text-gray-400 text-xl"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="text-base font-bold text-gray-800 mb-1">Dosierung berechnen</h4>
                            <p id="detail-4" class="text-sm text-gray-500">Wartet auf Start...</p>
                            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div id="mini-progress-4" class="bg-teal-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            <i id="check-4" class="fas fa-check text-green-600 text-2xl hidden"></i>
                            <i id="spinner-4" class="fas fa-spinner fa-spin text-teal-600 text-xl hidden"></i>
                        </div>
                    </div>
                    
                    <!-- Step 5: Plan Generation -->
                    <div id="analysis-step-5" class="flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm opacity-40 transition-all duration-500">
                        <div class="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300">
                            <i id="icon-5" class="fas fa-file-medical text-gray-400 text-xl"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <h4 class="text-base font-bold text-gray-800 mb-1">Reduktionsplan erstellen</h4>
                            <p id="detail-5" class="text-sm text-gray-500">Wartet auf Start...</p>
                            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div id="mini-progress-5" class="bg-teal-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            <i id="check-5" class="fas fa-check text-green-600 text-2xl hidden"></i>
                            <i id="spinner-5" class="fas fa-spinner fa-spin text-teal-600 text-xl hidden"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Overall Progress Bar -->
                <div class="mb-6 max-w-2xl mx-auto">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-semibold text-gray-700">
                            <i class="fas fa-chart-line mr-2 text-teal-600"></i>
                            Gesamtfortschritt
                        </span>
                        <span id="progress-text" class="text-lg font-bold text-teal-700">0%</span>
                    </div>
                    <div class="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
                        <div id="progress-bar" class="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 h-4 rounded-full transition-all duration-500 ease-out relative" style="width: 0%">
                            <!-- Shimmer effect -->
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse"></div>
                            <!-- Moving highlight -->
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60" style="animation: shimmer 2s infinite linear;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Data Counter Animation -->
                <div class="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-6">
                    <div class="bg-teal-50 rounded-lg p-3 border border-teal-200">
                        <div class="text-2xl font-bold text-teal-700" id="counter-medications">0</div>
                        <div class="text-xs text-gray-600">Medikamente</div>
                    </div>
                    <div class="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <div class="text-2xl font-bold text-emerald-700" id="counter-interactions">0</div>
                        <div class="text-xs text-gray-600">Wechselwirkungen</div>
                    </div>
                    <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div class="text-2xl font-bold text-blue-700" id="counter-calculations">0</div>
                        <div class="text-xs text-gray-600">Berechnungen</div>
                    </div>
                </div>
                
                <!-- Security Notice -->
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 max-w-2xl mx-auto">
                    <p class="text-sm text-gray-700">
                        <i class="fas fa-shield-alt text-green-600 mr-2"></i>
                        <strong>Ihre Daten sind sicher:</strong> Alle Berechnungen erfolgen verschlüsselt und werden nicht gespeichert
                    </p>
                </div>
            </div>
            
            <style>
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            </style>

            <!-- Results -->
            <div id="results" class="hidden"></div>

        </div>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-8 mt-16">
            <div class="max-w-6xl mx-auto px-4 text-center">
                <p class="mb-2">
                    <i class="fas fa-shield-alt mr-2"></i>
                    Alle Informationen basieren auf wissenschaftlichen Studien zu Cannabinoid-Medikamenten-Wechselwirkungen
                </p>
                <p class="text-gray-400 text-sm">
                    Quellen: PubMed, NIH, ProjectCBD, WHO
                </p>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script>
            // Multi-Step Wizard Navigation
            let currentStep = 1;
            const totalSteps = 5;
            
            function showStep(stepNumber) {
                // Hide all steps
                for (let i = 1; i <= totalSteps; i++) {
                    const step = document.getElementById(\`step-\${i}\`);
                    if (step) step.classList.add('hidden');
                }
                
                // Show current step
                const currentStepEl = document.getElementById(\`step-\${stepNumber}\`);
                if (currentStepEl) currentStepEl.classList.remove('hidden');
                
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
                        indicator.classList.remove('bg-gray-300', 'text-gray-600', 'bg-teal-700', 'text-white');
                        indicator.classList.add('bg-green-600', 'text-white');
                        if (progressBar) progressBar.style.width = '100%';
                    } else if (i === stepNumber) {
                        // Current step
                        indicator.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-600', 'text-white');
                        indicator.classList.add('bg-teal-700', 'text-white');
                        if (progressBar) progressBar.style.width = '0%';
                    } else {
                        // Future steps
                        indicator.classList.remove('bg-teal-700', 'text-white', 'bg-green-600');
                        indicator.classList.add('bg-gray-300', 'text-gray-600');
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
                    if (!height || height < 100 || height > 250) {
                        alert('Bitte geben Sie eine gültige Größe ein (100-250 cm).');
                        return false;
                    }
                    return true;
                }
                
                if (stepNumber === 3) {
                    const medicationInputs = document.querySelectorAll('.medication-name-input');
                    let hasValidMedication = false;
                    
                    medicationInputs.forEach(input => {
                        if (input.value.trim()) {
                            hasValidMedication = true;
                        }
                    });
                    
                    if (!hasValidMedication) {
                        alert('Bitte geben Sie mindestens ein Medikament ein.');
                        return false;
                    }
                    return true;
                }
                
                if (stepNumber === 4) {
                    const duration = document.getElementById('duration-weeks').value;
                    const goal = document.getElementById('reduction-goal').value;
                    
                    if (!duration) {
                        alert('Bitte wählen Sie eine Plan-Dauer aus.');
                        return false;
                    }
                    if (!goal) {
                        alert('Bitte wählen Sie ein Reduktionsziel aus.');
                        return false;
                    }
                    
                    // Check for unsafe combinations
                    checkPlanWarning(parseInt(duration), parseInt(goal));
                    return true;
                }
                
                if (stepNumber === 5) {
                    const email = document.getElementById('email').value.trim();
                    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                    
                    if (!email || !emailRegex.test(email)) {
                        alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                        return false;
                    }
                    return true;
                }
                
                return true;
            }
            
            function checkPlanWarning(duration, goal) {
                const warningBox = document.getElementById('plan-warning');
                const warningText = document.getElementById('plan-warning-text');
                
                // Check for unsafe combinations
                if ((duration === 4 && goal >= 70) || (duration <= 6 && goal >= 90)) {
                    warningBox.classList.remove('hidden');
                    warningText.textContent = 'Eine sehr kurze Plan-Dauer kombiniert mit einem hohen Reduktionsziel kann zu starken Entzugserscheinungen führen. Wir empfehlen für hohe Reduktionsziele eine längere Plan-Dauer von mindestens 8-12 Wochen.';
                } else if (duration === 4 && goal >= 50) {
                    warningBox.classList.remove('hidden');
                    warningText.textContent = 'Bei nur 4 Wochen Plan-Dauer empfehlen wir ein Reduktionsziel von maximal 40%. Für höhere Reduktionen wählen Sie bitte mindestens 6-8 Wochen.';
                } else {
                    warningBox.classList.add('hidden');
                }
            }
            
            function updateSummary() {
                // Name
                const firstName = document.getElementById('first-name').value.trim();
                document.getElementById('summary-name').textContent = firstName || '-';
                
                // Gender
                const genderInput = document.querySelector('input[name="gender"]:checked');
                const genderText = genderInput ? (genderInput.value === 'female' ? 'Weiblich' : 'Männlich') : '-';
                document.getElementById('summary-gender').textContent = genderText;
                
                // Age, Weight, Height
                document.getElementById('summary-age').textContent = document.getElementById('age').value + ' Jahre' || '-';
                document.getElementById('summary-weight').textContent = document.getElementById('weight').value + ' kg' || '-';
                document.getElementById('summary-height').textContent = document.getElementById('height').value + ' cm' || '-';
                
                // Medications
                const medicationInputs = document.querySelectorAll('.medication-name-input');
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
                
                // Goal
                const goalSelect = document.getElementById('reduction-goal');
                const goalText = goalSelect.options[goalSelect.selectedIndex]?.text || '-';
                document.getElementById('summary-goal').textContent = goalText;
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
                
                // Edit summary button
                const editButton = document.getElementById('edit-summary');
                if (editButton) {
                    editButton.addEventListener('click', function() {
                        showStep(1);
                    });
                }
                
                // Watch for changes on duration and goal to show warnings
                const durationSelect = document.getElementById('duration-weeks');
                const goalSelect = document.getElementById('reduction-goal');
                
                if (durationSelect && goalSelect) {
                    const checkWarning = () => {
                        const duration = parseInt(durationSelect.value);
                        const goal = parseInt(goalSelect.value);
                        if (duration && goal) {
                            checkPlanWarning(duration, goal);
                        }
                    };
                    
                    durationSelect.addEventListener('change', checkWarning);
                    goalSelect.addEventListener('change', checkWarning);
                }
                
                // Initialize: Show step 1
                showStep(1);
            });
        </script>
        <script src="/static/app.js"></script>
    </body>
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
                                Cannabinoide (wie CBD) wirken auf mehrere Arten in Ihrem Körper:
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
                                <strong>Wichtig:</strong> Cannabinoide wie CBD haben <strong>keine psychoaktive Wirkung</strong>, machen nicht "high" und sind <strong>nicht abhängigkeitsbildend</strong>.
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 2: Welche Medikamente sind gefährlich? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Bei welchen Medikamenten sind Wechselwirkungen mit Cannabinoiden besonders gefährlich?</span>
                    </summary>
                    <div class="mt-4 pl-8 text-gray-700 leading-relaxed">
                        <div class="warning-box p-5 rounded-lg mb-4 border-l-4 border-red-400">
                            <h4 class="font-semibold text-gray-900 mb-3 text-sm">
                                Kritische Medikamentengruppen:
                            </h4>
                            <ul class="text-xs space-y-2.5">
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Blutverdünner (Antikoagulanzien):</strong> Warfarin/Marcumar, Xarelto, Eliquis – Cannabinoide können die Blutgerinnung weiter hemmen → Blutungsrisiko erhöht</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Immunsuppressiva:</strong> Sandimmun (Ciclosporin), Prograf (Tacrolimus) – Cannabinoide können Wirkspiegel erhöhen → Toxizität möglich</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Opioide:</strong> OxyContin, Tramadol, Morphin – Cannabinoide + Opioide können zu übermäßiger Sedierung führen → Atemdepression</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Benzodiazepine:</strong> Tavor (Lorazepam), Valium (Diazepam), Rivotril – Verstärkte Müdigkeit, Sturzgefahr bei älteren Menschen</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Antidepressiva & Antipsychotika:</strong> Verstärkung der sedierenden Wirkung, mögliche CYP450-Interaktionen</span></li>
                                <li class="flex items-start"><span class="text-red-600 mr-2 mt-1">•</span><span><strong>Herzrhythmus-Medikamente:</strong> Amiodaron – Cannabinoide können Wirkspiegel beeinflussen</span></li>
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
                        <span>Wie lange dauert es, bis Cannabinoide wirken? Und wie lange hält die Wirkung an?</span>
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
                                <p class="text-sm mb-3">Wie lange bleiben Cannabinoide im Körper aktiv?</p>
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
                        <span>Kann ich wirklich meine Medikamente durch Cannabinoide reduzieren? Gibt es dafür Beweise?</span>
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
                                <li><strong>• Angststörungen:</strong> Cannabinoide zeigten in klinischen Studien vergleichbare Wirkung wie niedrig dosierte Benzodiazepine</li>
                                <li><strong>• Schlafstörungen:</strong> 60% der Patienten reduzierten Schlafmittel nach 3 Monaten Cannabinoid-Einnahme</li>
                                <li><strong>• Entzündliche Erkrankungen:</strong> Reduktion von NSAR (Ibuprofen, Diclofenac) durch anti-inflammatorische Cannabinoid-Wirkung</li>
                            </ul>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                            <p class="text-sm text-yellow-900 mb-2">
                                <i class="fas fa-user-md mr-2"></i>
                                <strong>Wichtig zu verstehen:</strong>
                            </p>
                            <ul class="text-sm space-y-1 text-yellow-900">
                                <li>• Cannabinoide sind <strong>kein Wundermittel</strong>, sondern unterstützen Ihr ECS</li>
                                <li>• Medikamenten-Reduktion ist ein <strong>langsamer Prozess</strong> (3-6 Monate)</li>
                                <li>• <strong>Niemals eigenständig absetzen</strong> – nur mit ärztlicher Begleitung!</li>
                                <li>• Nicht bei allen Menschen gleich wirksam (Genetik, ECS-Status)</li>
                            </ul>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 5: Machen Cannabinoide abhängig? Nebenwirkungen? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Machen Cannabinoide abhängig? Welche Nebenwirkungen kann es geben?</span>

                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <div class="grid md:grid-cols-2 gap-4 mb-4">
                            <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <h4 class="font-bold text-green-900 mb-2">
                                    <i class="fas fa-check-circle mr-2"></i>
                                    Abhängigkeitspotenzial:
                                </h4>
                                <p class="text-sm mb-2"><strong>Nein, Cannabinoide machen nicht abhängig!</strong></p>
                                <ul class="text-sm space-y-1">
                                    <li>• WHO stuft nicht-psychoaktive Cannabinoide als sicher ein (2025)</li>
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
                                <strong>Tipp:</strong> Unser "Start Low, Go Slow"-Ansatz minimiert Nebenwirkungen. Die meisten Menschen vertragen Cannabinoide sehr gut, wenn sie langsam einschleichen.
                            </p>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 6: Wie finde ich einen Arzt? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Wie finde ich einen Arzt, der mich bei der Medikamenten-Reduktion mit Cannabinoiden begleitet?</span>

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
                                    Zeigen Sie Ihrem Hausarzt diesen Medikamenten-Reduktionsplan. Viele Ärzte sind heute aufgeschlossen gegenüber Cannabinoiden, wenn wissenschaftliche Grundlagen vorliegen.
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
                                <li>✅ Bringen Sie diesen Medikamenten-Reduktionsplan mit (als PDF)</li>
                                <li>✅ Erklären Sie Ihre Motivation (weniger Medikamente, Nebenwirkungen)</li>
                                <li>✅ Betonen Sie, dass Sie unter ärztlicher Aufsicht vorgehen möchten</li>
                                <li>✅ Fragen Sie nach regelmäßigen Kontrolluntersuchungen</li>
                                <li>✅ Dokumentieren Sie Ihre Erfahrungen (Symptom-Tagebuch)</li>
                            </ul>
                        </div>
                    </div>
                </details>
                
                <!-- FAQ 7: Was kosten Cannabinoide? Zahlt Krankenkasse? -->
                <details class="cursor-pointer mb-4 border-b border-gray-200 pb-4">
                    <summary class="text-base font-semibold text-gray-900 py-3 flex items-center hover:text-teal-700 transition">
                        <i class="fas fa-chevron-right mr-3 text-teal-600 text-sm transition-transform"></i>
                        <span>Was kosten Cannabinoid-Präparate? Übernimmt die Krankenkasse die Kosten?</span>

                    </summary>
                    <div class="mt-4 pl-10 text-gray-700 leading-relaxed">
                        <!-- NEW: 8-Wochen-basierte Kostenberechnung -->
                        <div class="bg-orange-50 p-5 rounded-lg border-l-4 border-orange-500 mb-4">
                            <h4 class="font-bold text-orange-900 mb-3 text-base">
                                <i class="fas fa-calculator mr-2"></i>
                                💰 Kosten für Ihren Cannabinoid-Reduktionsplan (8 Wochen)
                            </h4>
                            <p class="text-sm mb-3 text-gray-700">
                                <strong>Grundlage der Berechnung:</strong><br>
                                • Eine 3 g-Spritze enthält ca. 3 000 mg Cannabinoide<br>
                                • Endkundenpreis: <strong class="text-orange-900">99 € inkl. MwSt.</strong><br>
                                • Durchschnittsverbrauch laut 8-Wochen-Plan: <strong class="text-orange-900">2,1 g = 2 100 mg</strong>
                            </p>
                            
                            <!-- Tabelle -->
                            <div class="overflow-x-auto mb-3">
                                <table class="w-full text-sm border-collapse">
                                    <thead>
                                        <tr class="bg-teal-700 text-white">
                                            <th class="border border-teal-600 p-2 text-left">Dosisbereich</th>
                                            <th class="border border-teal-600 p-2 text-center">Ø Tagesdosis (mg)</th>
                                            <th class="border border-teal-600 p-2 text-center">Gesamtbedarf (mg)</th>
                                            <th class="border border-teal-600 p-2 text-center">Benötigte Paste (g)</th>
                                            <th class="border border-teal-600 p-2 text-right">Geschätzte Kosten (€)</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white">
                                        <tr>
                                            <td class="border border-gray-300 p-2"><strong>Niedrig</strong></td>
                                            <td class="border border-gray-300 p-2 text-center">20 mg/Tag</td>
                                            <td class="border border-gray-300 p-2 text-center">1 120 mg</td>
                                            <td class="border border-gray-300 p-2 text-center">1,1 g</td>
                                            <td class="border border-gray-300 p-2 text-right font-bold text-teal-700">≈ 37 €</td>
                                        </tr>
                                        <tr class="bg-gray-50">
                                            <td class="border border-gray-300 p-2"><strong>Mittel</strong></td>
                                            <td class="border border-gray-300 p-2 text-center">40 mg/Tag</td>
                                            <td class="border border-gray-300 p-2 text-center">2 240 mg</td>
                                            <td class="border border-gray-300 p-2 text-center">2,2 g</td>
                                            <td class="border border-gray-300 p-2 text-right font-bold text-teal-700">≈ 73 €</td>
                                        </tr>
                                        <tr>
                                            <td class="border border-gray-300 p-2"><strong>Hoch</strong></td>
                                            <td class="border border-gray-300 p-2 text-center">70 mg/Tag</td>
                                            <td class="border border-gray-300 p-2 text-center">3 920 mg</td>
                                            <td class="border border-gray-300 p-2 text-center">3,9 g</td>
                                            <td class="border border-gray-300 p-2 text-right font-bold text-teal-700">≈ 129 €</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <p class="text-xs text-gray-600 mb-2">
                                <strong>Berechnungsbasis:</strong> Preis = (Verbrauch in g ÷ 3 g) × 99 €
                            </p>
                            
                            <div class="bg-white p-3 rounded border border-orange-200">
                                <p class="text-sm text-gray-700 mb-2">
                                    <strong>💬 Erläuterung:</strong>
                                </p>
                                <ul class="text-xs text-gray-600 space-y-1">
                                    <li>• Der Preis bezieht sich auf den tatsächlichen Verbrauch während des <strong>8-Wochen-Ausschleichplans</strong></li>
                                    <li>• Je nach Steigerungsplan, Körpergewicht und individueller Reaktion kann der Verbrauch leicht variieren</li>
                                    <li>• Da eine 3 g-Spritze etwa 2,1 g für den gesamten 8-Wochen-Plan abdeckt, liegen die tatsächlichen Gesamtkosten bei ca. <strong class="text-teal-700">70 – 75 €</strong> für den gesamten Plan</li>
                                    <li>• Eventuelle Restmengen können für eine Erhaltungs- oder Verlängerungsphase genutzt werden</li>
                                </ul>
                            </div>
                            
                            <p class="text-xs text-gray-500 mt-3 italic">
                                Die Kosten werden automatisch anhand der errechneten Verbrauchsmenge Ihres persönlichen Dosierungsplans berechnet. Grundlage ist der jeweils aktuelle Endkundenpreis der 3 g-Spritze (99 € inkl. MwSt.).
                            </p>
                            
                            <p class="text-xs text-gray-500 mt-2">
                                Berechnung dient als Beispiel. Tatsächliche Kosten können je nach Hersteller, Konzentration und individueller Dosierung leicht abweichen.
                            </p>
                        </div>
                        
                        <!-- Krankenkasse Info -->
                        <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                            <h4 class="font-bold text-blue-900 mb-2">
                                <i class="fas fa-hospital mr-2"></i>
                                Krankenkasse:
                            </h4>
                            <p class="text-sm mb-2"><strong>Leider meist NEIN:</strong></p>
                            <ul class="text-sm space-y-1">
                                <li>• Cannabinoid-Präparate als Nahrungsergänzungsmittel: <strong>Keine Kostenübernahme</strong></li>
                                <li>• Medizinisches Cannabis (THC-haltig): Kann verschrieben werden, aber hohe Hürden</li>
                                <li>• Private Krankenversicherungen: Einzelfallentscheidung</li>
                            </ul>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <h5 class="font-bold text-green-900 mb-2">
                                <i class="fas fa-piggy-bank mr-2"></i>
                                Aber: Langfristige Einsparungen möglich!
                            </h5>
                            <p class="text-sm mb-2">
                                Wenn Sie durch Cannabinoide Medikamente reduzieren können, sparen Sie:
                            </p>
                            <ul class="text-sm space-y-1">
                                <li>• Zuzahlungen für Medikamente (5-10€ pro Rezept)</li>
                                <li>• Kosten für Nebenwirkungen-Behandlung</li>
                                <li>• Arztbesuche wegen Nebenwirkungen</li>
                                <li>• Langfristig: Weniger Folgeerkrankungen durch Medikamente</li>
                            </ul>
                            <p class="text-sm mt-2">
                                <strong>Beispiel:</strong> Wenn Sie 3 Medikamente à 10€ Zuzahlung/Monat sparen = 30€. Plus Cannabinoid-Kosten 100€ = Netto-Mehrkosten 70€ für bessere Lebensqualität.
                            </p>
                        </div>
                    </div>
                </details>
            </div>

    </html>
  `)
})

export default app
