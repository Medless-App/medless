// Tab switching
document.getElementById('tab-text')?.addEventListener('click', () => {
  showTab('text');
});

document.getElementById('tab-upload')?.addEventListener('click', () => {
  showTab('upload');
});

function showTab(tab) {
  const textTab = document.getElementById('tab-text');
  const uploadTab = document.getElementById('tab-upload');
  const textContent = document.getElementById('content-text');
  const uploadContent = document.getElementById('content-upload');

  if (tab === 'text') {
    textTab.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
    textTab.classList.remove('text-gray-500');
    uploadTab.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
    uploadTab.classList.add('text-gray-500');
    textContent.classList.remove('hidden');
    uploadContent.classList.add('hidden');
  } else {
    uploadTab.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
    uploadTab.classList.remove('text-gray-500');
    textTab.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
    textTab.classList.add('text-gray-500');
    uploadContent.classList.remove('hidden');
    textContent.classList.add('hidden');
  }
}

// Add medication input
let medicationCount = 1;

document.getElementById('add-medication')?.addEventListener('click', () => {
  medicationCount++;
  const container = document.getElementById('medication-inputs');
  const newInput = document.createElement('div');
  newInput.className = 'medication-input-group flex gap-3';
  newInput.innerHTML = `
    <input type="text" name="medication_name[]" 
           placeholder="z.B. Ibuprofen, Marcumar, Prozac..." 
           class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
           required>
    <input type="text" name="medication_dosage[]" 
           placeholder="Dosierung (z.B. 400mg täglich)" 
           class="w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
    <button type="button" class="remove-medication px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
        <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(newInput);

  // Add remove handler
  newInput.querySelector('.remove-medication').addEventListener('click', function() {
    newInput.remove();
    medicationCount--;
  });
});

// Handle initial remove buttons
document.addEventListener('click', (e) => {
  if (e.target.closest('.remove-medication')) {
    const group = e.target.closest('.medication-input-group');
    if (group) {
      group.remove();
      medicationCount--;
    }
  }
});

// Image upload preview
document.getElementById('image-upload')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('image-preview');
      const img = document.getElementById('preview-img');
      img.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
});

// Handle manual form submission
document.getElementById('medication-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const medicationNames = form.querySelectorAll('input[name="medication_name[]"]');
  const medicationDosages = form.querySelectorAll('input[name="medication_dosage[]"]');
  const durationWeeks = parseInt(form.querySelector('input[name="duration_weeks"]').value);

  const medications = [];
  medicationNames.forEach((nameInput, index) => {
    if (nameInput.value.trim()) {
      medications.push({
        name: nameInput.value.trim(),
        dosage: medicationDosages[index].value.trim() || 'Nicht angegeben'
      });
    }
  });

  if (medications.length === 0) {
    alert('Bitte geben Sie mindestens ein Medikament an.');
    return;
  }

  await analyzeMedications(medications, durationWeeks);
});

// Handle upload form submission
document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const imageFile = document.getElementById('image-upload').files[0];
  const durationWeeks = parseInt(document.getElementById('upload-duration-weeks').value);

  if (!imageFile) {
    alert('Bitte laden Sie ein Bild hoch.');
    return;
  }

  // Show loading
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  try {
    // Upload image for OCR
    const formData = new FormData();
    formData.append('image', imageFile);

    const ocrResponse = await axios.post('/api/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (ocrResponse.data.success) {
      const medications = ocrResponse.data.medications;
      await analyzeMedications(medications, durationWeeks);
    } else {
      throw new Error(ocrResponse.data.error || 'OCR fehlgeschlagen');
    }
  } catch (error) {
    document.getElementById('loading').classList.add('hidden');
    alert('Fehler beim Bildupload: ' + (error.response?.data?.error || error.message));
  }
});

// Analyze medications
async function analyzeMedications(medications, durationWeeks) {
  // Show loading
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  try {
    const response = await axios.post('/api/analyze', {
      medications,
      durationWeeks
    });

    if (response.data.success) {
      displayResults(response.data);
    } else {
      throw new Error(response.data.error || 'Analyse fehlgeschlagen');
    }
  } catch (error) {
    alert('Fehler bei der Analyse: ' + (error.response?.data?.error || error.message));
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

// Display results
function displayResults(data) {
  const resultsDiv = document.getElementById('results');
  const { analysis, maxSeverity, guidelines, weeklyPlan, warnings } = data;

  let html = '';

  // Critical warnings
  if (warnings && warnings.length > 0) {
    html += `
      <div class="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-lg shadow fade-in">
        <div class="flex items-start">
          <i class="fas fa-exclamation-circle text-red-600 text-3xl mr-4"></i>
          <div>
            <h3 class="text-xl font-bold text-red-800 mb-3">Kritische Wechselwirkungen erkannt!</h3>
            ${warnings.map(w => `<p class="text-red-700 mb-2">${w}</p>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Medication Analysis
  html += `
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-microscope text-blue-600 mr-3"></i>
        Medikamenten-Analyse
      </h2>
      <div class="space-y-6">
  `;

  analysis.forEach((item) => {
    const med = item.medication;
    const interactions = item.interactions;
    
    if (med.found === false) {
      html += `
        <div class="border-l-4 border-gray-400 bg-gray-50 p-4 rounded-lg">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-gray-800 text-lg">${med.name}</h3>
              <p class="text-gray-600 mt-1">
                <i class="fas fa-info-circle mr-2"></i>
                ${item.warning}
              </p>
            </div>
            <span class="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
              Unbekannt
            </span>
          </div>
        </div>
      `;
    } else {
      const severityColors = {
        low: 'green',
        medium: 'yellow',
        high: 'orange',
        critical: 'red'
      };
      
      const maxInteractionSeverity = interactions.length > 0 ? 
        interactions.reduce((max, i) => {
          const order = { low: 1, medium: 2, high: 3, critical: 4 };
          return order[i.severity] > order[max] ? i.severity : max;
        }, 'low') : 'low';
      
      const color = severityColors[maxInteractionSeverity];
      
      html += `
        <div class="border-l-4 border-${color}-500 bg-${color}-50 p-4 rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-bold text-gray-800 text-lg">${med.name}</h3>
              ${med.generic_name ? `<p class="text-gray-600 text-sm">${med.generic_name}</p>` : ''}
              <p class="text-gray-600 text-sm mt-1">
                <i class="fas fa-capsules mr-2"></i>
                Dosierung: ${item.dosage}
              </p>
            </div>
            <span class="px-3 py-1 bg-${color}-200 text-${color}-800 rounded-full text-sm font-semibold">
              ${maxInteractionSeverity === 'critical' ? 'Kritisch' :
                maxInteractionSeverity === 'high' ? 'Hoch' :
                maxInteractionSeverity === 'medium' ? 'Mittel' : 'Niedrig'}
            </span>
          </div>
          
          ${interactions.length > 0 ? `
            <div class="mt-4 space-y-3">
              ${interactions.map(i => `
                <div class="bg-white p-4 rounded-lg">
                  <p class="text-gray-800 font-semibold mb-2">
                    <i class="fas fa-flask mr-2"></i>
                    ${i.description}
                  </p>
                  ${i.mechanism ? `
                    <p class="text-gray-600 text-sm mb-2">
                      <strong>Mechanismus:</strong> ${i.mechanism}
                    </p>
                  ` : ''}
                  ${i.recommendation ? `
                    <p class="text-${color}-700 text-sm bg-${color}-50 p-2 rounded">
                      <i class="fas fa-lightbulb mr-2"></i>
                      <strong>Empfehlung:</strong> ${i.recommendation}
                    </p>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-gray-600 text-sm mt-2">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              Keine bekannten Wechselwirkungen mit CBD
            </p>
          `}
        </div>
      `;
    }
  });

  html += `
      </div>
    </div>
  `;

  // Weekly Plan
  html += `
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-calendar-check text-green-600 mr-3"></i>
        Ihr persönlicher CBD-Ausgleichsplan
      </h2>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
        <p class="text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Dosierungsrichtlinie:</strong> ${guidelines?.notes || 'Standard-Dosierung'}
        </p>
        <p class="text-blue-700 text-sm mt-2">
          Startdosis: ${guidelines?.recommended_start_mg || 5} mg/Tag • 
          Maximaldosis: ${guidelines?.max_dosage_mg || 50} mg/Tag • 
          Anpassung alle ${guidelines?.adjustment_period_days || 14} Tage
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-purple-100">
            <tr>
              <th class="px-4 py-3 text-left text-purple-900 font-semibold">Woche</th>
              <th class="px-4 py-3 text-center text-purple-900 font-semibold">Morgens</th>
              <th class="px-4 py-3 text-center text-purple-900 font-semibold">Mittags</th>
              <th class="px-4 py-3 text-center text-purple-900 font-semibold">Abends</th>
              <th class="px-4 py-3 text-center text-purple-900 font-semibold">Gesamt/Tag</th>
              <th class="px-4 py-3 text-left text-purple-900 font-semibold">Hinweise</th>
            </tr>
          </thead>
          <tbody>
  `;

  weeklyPlan.forEach((week, index) => {
    html += `
      <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
        <td class="px-4 py-3 font-semibold">Woche ${week.week}</td>
        <td class="px-4 py-3 text-center">${week.morningDosage} mg</td>
        <td class="px-4 py-3 text-center">${week.middayDosage} mg</td>
        <td class="px-4 py-3 text-center">${week.eveningDosage} mg</td>
        <td class="px-4 py-3 text-center font-bold text-purple-700">${week.totalDaily} mg</td>
        <td class="px-4 py-3 text-sm text-gray-600">${week.notes}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>

      <div class="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 class="font-bold text-green-800 mb-2">
          <i class="fas fa-clipboard-check mr-2"></i>
          Wichtige Hinweise zur Einnahme:
        </h3>
        <ul class="text-green-700 space-y-2 ml-6 list-disc">
          <li>Nehmen Sie CBD am besten zu den Mahlzeiten ein</li>
          <li>Halten Sie CBD-Öl unter der Zunge für 60-90 Sekunden</li>
          <li>Trinken Sie ausreichend Wasser (2-3 Liter täglich)</li>
          <li>Führen Sie ein Tagebuch über Ihre Symptome und Wirkungen</li>
          <li>Bei Nebenwirkungen reduzieren Sie die Dosis oder pausieren Sie</li>
          <li>Konsultieren Sie bei Unsicherheiten immer Ihren Arzt</li>
        </ul>
      </div>

      <div class="mt-8 flex gap-4">
        <button onclick="downloadPDF()" class="flex-1 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg">
          <i class="fas fa-file-pdf mr-2"></i>
          Als PDF herunterladen
        </button>
        <button onclick="window.print()" class="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
          <i class="fas fa-print mr-2"></i>
          Drucken
        </button>
      </div>
    </div>
  `;

  resultsDiv.innerHTML = html;
  resultsDiv.classList.remove('hidden');
  
  // Scroll to results
  setTimeout(() => {
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  // Store data globally for PDF generation
  window.currentPlanData = { analysis, weeklyPlan, guidelines, maxSeverity };
}

// Download PDF function (placeholder - will use jsPDF when implemented)
function downloadPDF() {
  if (!window.currentPlanData) {
    alert('Keine Daten zum Herunterladen verfügbar');
    return;
  }
  
  // For now, just trigger print
  // TODO: Implement proper PDF generation with jsPDF
  alert('PDF-Download wird vorbereitet. Verwenden Sie vorerst die Druckfunktion (Strg+P oder Cmd+P).');
  window.print();
}
