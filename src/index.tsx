import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
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

// Analyze medications and generate CBD plan
app.post('/api/analyze', async (c) => {
  const { env } = c;
  try {
    const body = await c.req.json();
    const { medications, durationWeeks } = body;
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return c.json({ success: false, error: 'Bitte geben Sie mindestens ein Medikament an' }, 400);
    }
    
    if (!durationWeeks || durationWeeks < 1) {
      return c.json({ success: false, error: 'Bitte geben Sie eine gültige Dauer in Wochen an' }, 400);
    }
    
    // Analyze each medication for interactions
    const analysisResults = [];
    let maxSeverity = 'low';
    
    for (const med of medications) {
      // Search for medication in database
      const medResult = await env.DB.prepare(`
        SELECT m.*, mc.risk_level
        FROM medications m
        LEFT JOIN medication_categories mc ON m.category_id = mc.id
        WHERE m.name LIKE ? OR m.generic_name LIKE ?
        LIMIT 1
      `).bind(`%${med.name}%`, `%${med.name}%`).first();
      
      if (medResult) {
        // Get interactions
        const interactions = await env.DB.prepare(`
          SELECT * FROM cbd_interactions WHERE medication_id = ?
        `).bind(medResult.id).all();
        
        analysisResults.push({
          medication: medResult,
          interactions: interactions.results,
          dosage: med.dosage || 'Nicht angegeben'
        });
        
        // Track highest severity
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
    
    // Get dosage guidelines based on severity
    const guidelines = await env.DB.prepare(`
      SELECT * FROM cbd_dosage_guidelines 
      WHERE condition_type = ?
      LIMIT 1
    `).bind(
      maxSeverity === 'critical' ? 'with_critical_interaction' :
      maxSeverity === 'high' ? 'with_high_interaction' :
      maxSeverity === 'medium' ? 'with_medium_interaction' : 'with_low_interaction'
    ).first();
    
    // Generate weekly plan
    const weeklyPlan = [];
    const startDosage = guidelines?.recommended_start_mg || 5;
    const maxDosage = guidelines?.max_dosage_mg || 50;
    const adjustmentPeriod = guidelines?.adjustment_period_days || 14;
    
    for (let week = 1; week <= durationWeeks; week++) {
      let dosage = startDosage;
      
      // Gradual increase every adjustment period
      if (week > 1 && week % Math.ceil(adjustmentPeriod / 7) === 0) {
        dosage = Math.min(startDosage + ((week / Math.ceil(adjustmentPeriod / 7)) * 5), maxDosage);
      } else if (week > 1) {
        dosage = Math.min(startDosage + (Math.floor(week / Math.ceil(adjustmentPeriod / 7)) * 5), maxDosage);
      }
      
      weeklyPlan.push({
        week,
        morningDosage: Math.round(dosage * 0.4 * 10) / 10,
        eveningDosage: Math.round(dosage * 0.6 * 10) / 10,
        totalDaily: Math.round(dosage * 10) / 10,
        notes: week === 1 ? 'Einschleichphase - beobachten Sie mögliche Reaktionen' : 
               week === durationWeeks ? 'Ende der Ausgleichsphase - ärztliche Nachkontrolle empfohlen' : ''
      });
    }
    
    return c.json({
      success: true,
      analysis: analysisResults,
      maxSeverity,
      guidelines,
      weeklyPlan,
      warnings: maxSeverity === 'critical' || maxSeverity === 'high' ? 
        ['⚠️ Kritische Wechselwirkungen erkannt!', 'Konsultieren Sie unbedingt einen Arzt vor der CBD-Einnahme.'] : []
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return c.json({ success: false, error: error.message || 'Fehler bei der Analyse' }, 500);
  }
})

// OCR endpoint for image upload (will use OpenAI Vision API)
app.post('/api/ocr', async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile || !(imageFile instanceof File)) {
      return c.json({ success: false, error: 'Kein Bild hochgeladen' }, 400);
    }
    
    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // TODO: Implement OpenAI Vision API call
    // For now, return placeholder
    return c.json({
      success: true,
      medications: [
        { name: 'Beispiel Medikament', dosage: '10mg täglich' }
      ],
      note: 'OCR-Funktion wird mit OpenAI API-Key aktiviert'
    });
    
  } catch (error: any) {
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
        <title>ECS Aktivierung - CBD Ausgleichsplan Generator</title>
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
          
          /* Autocomplete styles */
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
                        <p class="text-purple-100 text-lg">Ihr persönlicher CBD Ausgleichsplan</p>
                    </div>
                    <div class="text-right">
                        <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                            <i class="fas fa-shield-alt mr-2"></i>
                            <span class="text-sm">Medizinisch fundiert</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <div class="max-w-6xl mx-auto px-4 py-8">
            
            <!-- Mission Statement - NEU -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-8 mb-8 rounded-xl shadow-lg fade-in">
                <div class="flex items-start">
                    <i class="fas fa-heart text-green-600 text-4xl mr-6 mt-1"></i>
                    <div class="w-full">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-seedling mr-2"></i>
                            Ihr Weg zu weniger Tabletten - natürlich mit exogenen Cannabinoiden
                        </h2>
                        <p class="text-gray-700 text-lg mb-4 leading-relaxed">
                            <strong>Viele Menschen wünschen sich, von ihrer Medikation loszukommen.</strong> Diese Plattform bietet Ihnen einen wissenschaftlich fundierten Ansatz, um Ihr <strong>Endocannabinoid-System (ECS)</strong> zu stärken und Ihren Körper dabei zu unterstützen, sein natürliches Gleichgewicht wiederzufinden.
                        </p>
                        
                        <div class="bg-white/70 p-4 rounded-lg mb-4">
                            <h3 class="font-bold text-gray-800 mb-2">
                                <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                Warum exogene Cannabinoide?
                            </h3>
                            <p class="text-gray-700 mb-2">
                                Das <strong>Endocannabinoid-System (ECS)</strong> ist ein körpereigenes Regulationssystem, das Schlaf, Stimmung, Schmerz, Entzündungen und viele weitere Prozesse steuert. Wenn dieses System geschwächt ist, können Beschwerden entstehen.
                            </p>
                            <p class="text-gray-700">
                                <strong>Exogene Cannabinoide</strong> (wie CBD) aus der Cannabispflanze können Ihr ECS von außen unterstützen und stärken - ähnlich wie Vitamine einen Mangel ausgleichen können.
                            </p>
                        </div>
                        
                        <div class="grid md:grid-cols-3 gap-4 mt-4">
                            <div class="bg-green-100 p-4 rounded-lg">
                                <i class="fas fa-pills text-green-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-1">Medikamente reduzieren</h4>
                                <p class="text-sm text-gray-700">Viele Studien zeigen: CBD kann beim Ausschleichen von Opioiden, Antidepressiva und anderen Medikamenten unterstützen</p>
                            </div>
                            <div class="bg-blue-100 p-4 rounded-lg">
                                <i class="fas fa-brain text-blue-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-1">ECS stärken</h4>
                                <p class="text-sm text-gray-700">Ihr Körper verfügt über ein mächtiges Selbstheilungssystem - das ECS. CBD hilft, es zu aktivieren und zu balancieren</p>
                            </div>
                            <div class="bg-purple-100 p-4 rounded-lg">
                                <i class="fas fa-leaf text-purple-600 text-2xl mb-2"></i>
                                <h4 class="font-bold text-gray-800 mb-1">Natürlicher Ansatz</h4>
                                <p class="text-sm text-gray-700">Exogene Cannabinoide bieten eine pflanzliche Alternative mit weniger Nebenwirkungen als viele Medikamente</p>
                            </div>
                        </div>
                        
                        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4 rounded">
                            <p class="text-gray-700 font-semibold">
                                <i class="fas fa-user-md text-blue-600 mr-2"></i>
                                <strong>Wissenschaftlich belegt:</strong> Studien zeigen, dass CBD Entzugssymptome lindern, Schmerzen reduzieren und die Lebensqualität verbessern kann. Unser Plan berücksichtigt mögliche Wechselwirkungen mit Ihren aktuellen Medikamenten.
                            </p>
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
                            Dieser CBD-Ausgleichsplan ist <strong>KEINE medizinische Beratung</strong> und ersetzt nicht das Gespräch mit Ihrem Arzt oder Apotheker.
                        </p>
                        <ul class="text-yellow-700 space-y-1 ml-6 list-disc">
                            <li>Die Informationen dienen ausschließlich zur ersten Orientierung</li>
                            <li>Konsultieren Sie vor der Einnahme von CBD <strong>unbedingt Ihren Arzt</strong></li>
                            <li>Wechselwirkungen mit Medikamenten können gesundheitsgefährdend sein</li>
                            <li>Nehmen Sie diesen Plan zu Ihrem Arztgespräch mit</li>
                            <li><strong>Ändern Sie niemals ohne ärztliche Rücksprache Ihre Medikation</strong></li>
                            <li>CBD kann Sie beim Medikamenten-Ausschleichen begleiten, aber <strong>NUR unter ärztlicher Aufsicht</strong></li>
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
                            Das <strong>Endocannabinoid-System (ECS)</strong> ist ein körpereigenes Regulationssystem, das eine zentrale Rolle für Ihre Gesundheit spielt. Es besteht aus Rezeptoren, Enzymen und Endocannabinoiden, die im gesamten Körper verteilt sind.
                        </p>
                        <div class="bg-purple-50 p-4 rounded-lg mb-4">
                            <h3 class="font-bold text-purple-900 mb-2">
                                <i class="fas fa-bullseye mr-2"></i>
                                Funktionen des ECS:
                            </h3>
                            <ul class="text-gray-700 space-y-2">
                                <li><i class="fas fa-check text-green-500 mr-2"></i> Regulierung von Schmerzen</li>
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
                                <i class="fas fa-leaf text-green-600 mr-2"></i>
                                Wie CBD das ECS aktiviert:
                            </h3>
                            <p class="text-gray-700 mb-3">
                                <strong>Cannabidiol (CBD)</strong> aus der Hanfpflanze interagiert mit Ihrem ECS und kann helfen, das Gleichgewicht (Homöostase) wiederherzustellen.
                            </p>
                            <div class="bg-white p-4 rounded-lg">
                                <p class="text-sm text-gray-600 italic">
                                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                                    CBD hat <strong>keinepsychoaktive Wirkung</strong> und macht nicht abhängig. Es unterstützt Ihren Körper dabei, seine natürlichen Funktionen zu optimieren.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Form -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-file-prescription text-blue-600 mr-3"></i>
                    Erstellen Sie Ihren persönlichen CBD-Ausgleichsplan
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
                        <!-- Persönliche Angaben -->
                        <div class="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label class="block text-gray-700 font-semibold mb-3">
                                    <i class="fas fa-user mr-2"></i>
                                    Ihr Vorname
                                </label>
                                <input type="text" id="first-name" name="first_name" 
                                       placeholder="z.B. Maria" 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                       required>
                            </div>
                            <div>
                                <label class="block text-gray-700 font-semibold mb-3">
                                    <i class="fas fa-venus-mars mr-2"></i>
                                    Geschlecht
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

                        <div class="mb-6">
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-calendar-alt mr-2"></i>
                                Gewünschte Ausgleichsdauer
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
                                Empfohlen: 8-12 Wochen für einen nachhaltigen Ausgleich
                            </p>
                        </div>

                        <button type="submit" class="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                            <i class="fas fa-chart-line mr-2"></i>
                            CBD-Ausgleichsplan erstellen
                        </button>
                    </form>
                </div>

                <!-- Upload Tab -->
                <div id="content-upload" class="tab-content hidden">
                    <form id="upload-form">
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
                                    <p class="text-sm text-gray-500">JPG, PNG oder PDF (max. 10MB)</p>
                                </label>
                            </div>
                            <div id="image-preview" class="mt-4 hidden">
                                <img id="preview-img" class="max-w-full h-auto rounded-lg shadow-lg">
                            </div>
                        </div>

                        <div class="mb-6">
                            <label class="block text-gray-700 font-semibold mb-3">
                                <i class="fas fa-calendar-alt mr-2"></i>
                                Gewünschte Ausgleichsdauer
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
                            Bild analysieren & Plan erstellen
                        </button>
                    </form>
                </div>
            </div>

            <!-- Loading -->
            <div id="loading" class="hidden bg-white rounded-xl shadow-lg p-8 text-center">
                <i class="fas fa-spinner fa-spin text-6xl text-purple-600 mb-4"></i>
                <p class="text-xl font-semibold text-gray-700">Analysiere Ihre Medikamente...</p>
                <p class="text-gray-500 mt-2">Dies kann einige Sekunden dauern</p>
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
                    Quellen: PubMed, NIH, ProjectCBD, Nordic Oil, Hanfosan
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
