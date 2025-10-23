// Global medications list
let allMedications = [];

// Load medications on page load
async function loadMedications() {
  try {
    const response = await axios.get('/api/medications');
    if (response.data.success) {
      allMedications = response.data.medications;
      console.log(`Loaded ${allMedications.length} medications for autocomplete`);
    }
  } catch (error) {
    console.error('Failed to load medications:', error);
  }
}

// Initialize autocomplete on page load
document.addEventListener('DOMContentLoaded', () => {
  loadMedications();
  
  // Setup autocomplete for initial input
  const initialInput = document.querySelector('input[name="medication_name[]"]');
  if (initialInput) {
    setupAutocomplete(initialInput);
  }
});

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

// Setup autocomplete for input field
function setupAutocomplete(input) {
  let autocompleteList = null;
  let selectedIndex = -1;

  input.addEventListener('input', function(e) {
    const value = this.value.toLowerCase().trim();
    
    // Remove existing autocomplete list
    closeAllLists();
    
    if (!value || value.length < 2) {
      return;
    }
    
    // Filter medications
    const matches = allMedications.filter(med => 
      med.name.toLowerCase().includes(value) || 
      (med.generic_name && med.generic_name.toLowerCase().includes(value))
    ).slice(0, 10); // Limit to 10 results
    
    if (matches.length === 0) {
      return;
    }
    
    // Create autocomplete list
    autocompleteList = document.createElement('div');
    autocompleteList.className = 'autocomplete-list absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto w-full';
    autocompleteList.style.width = input.offsetWidth + 'px';
    
    matches.forEach((med, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item px-4 py-3 cursor-pointer hover:bg-purple-50 border-b border-gray-100';
      
      // Highlight matching text
      const nameMatch = med.name.toLowerCase().indexOf(value);
      let displayName = med.name;
      if (nameMatch !== -1) {
        displayName = med.name.substring(0, nameMatch) + 
                     '<strong>' + med.name.substring(nameMatch, nameMatch + value.length) + '</strong>' +
                     med.name.substring(nameMatch + value.length);
      }
      
      item.innerHTML = `
        <div class="font-semibold text-gray-800">${displayName}</div>
        ${med.generic_name ? `<div class="text-sm text-gray-600">${med.generic_name}</div>` : ''}
        <div class="text-xs text-gray-500 mt-1">
          <span class="inline-block px-2 py-1 bg-${med.risk_level === 'high' || med.risk_level === 'very_high' ? 'red' : med.risk_level === 'medium' ? 'yellow' : 'green'}-100 rounded">
            ${med.category_name}
          </span>
        </div>
      `;
      
      item.addEventListener('click', function() {
        input.value = med.name;
        
        // Auto-fill dosage if available
        const dosageInput = input.parentElement.querySelector('input[name="medication_dosage[]"]');
        if (dosageInput && med.common_dosage && !dosageInput.value) {
          dosageInput.value = med.common_dosage;
        }
        
        closeAllLists();
      });
      
      autocompleteList.appendChild(item);
    });
    
    // Position the list
    const rect = input.getBoundingClientRect();
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(autocompleteList);
  });
  
  // Keyboard navigation
  input.addEventListener('keydown', function(e) {
    if (!autocompleteList) return;
    
    const items = autocompleteList.getElementsByClassName('autocomplete-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      setActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      setActiveItem(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
    } else if (e.key === 'Escape') {
      closeAllLists();
    }
  });
  
  function setActiveItem(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('bg-purple-100');
      if (i === selectedIndex) {
        items[i].classList.add('bg-purple-100');
        items[i].scrollIntoView({ block: 'nearest' });
      }
    }
  }
  
  function closeAllLists() {
    const lists = document.getElementsByClassName('autocomplete-list');
    Array.from(lists).forEach(list => list.remove());
    selectedIndex = -1;
  }
  
  // Close list when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target !== input) {
      closeAllLists();
    }
  });
}

// Add medication input
let medicationCount = 1;

document.getElementById('add-medication')?.addEventListener('click', () => {
  medicationCount++;
  const container = document.getElementById('medication-inputs');
  const newInputGroup = document.createElement('div');
  newInputGroup.className = 'medication-input-group flex gap-3';
  newInputGroup.style.position = 'relative';
  newInputGroup.innerHTML = `
    <input type="text" name="medication_name[]" 
           placeholder="z.B. Ibuprofen, Marcumar, Prozac..." 
           class="medication-name-input flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
           required>
    <input type="text" name="medication_dosage[]" 
           placeholder="Dosierung (z.B. 400mg täglich)" 
           class="w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
    <button type="button" class="remove-medication px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
        <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(newInputGroup);

  // Setup autocomplete for new input
  const newInput = newInputGroup.querySelector('.medication-name-input');
  setupAutocomplete(newInput);

  // Add remove handler
  newInputGroup.querySelector('.remove-medication').addEventListener('click', function() {
    newInputGroup.remove();
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
  const firstName = form.querySelector('input[name="first_name"]').value.trim();
  const gender = form.querySelector('input[name="gender"]:checked')?.value;
  const medicationNames = form.querySelectorAll('input[name="medication_name[]"]');
  const medicationDosages = form.querySelectorAll('input[name="medication_dosage[]"]');
  const durationWeeks = parseInt(form.querySelector('input[name="duration_weeks"]').value);

  if (!firstName) {
    alert('Bitte geben Sie Ihren Vornamen an.');
    return;
  }

  if (!gender) {
    alert('Bitte wählen Sie Ihr Geschlecht aus.');
    return;
  }

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

  await analyzeMedications(medications, durationWeeks, firstName, gender);
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
async function analyzeMedications(medications, durationWeeks, firstName = '', gender = '') {
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
      displayResults(response.data, firstName, gender);
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
function displayResults(data, firstName = '', gender = '') {
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
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in" id="dosage-plan-section">
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
        <p class="text-blue-700 text-sm mt-2">
          <strong>Einnahme:</strong> 2x täglich - Morgens (40%) und Abends (60%)
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full" id="dosage-table">
          <thead class="bg-purple-100">
            <tr>
              <th class="px-4 py-3 text-left text-purple-900 font-semibold">Woche</th>
              <th class="px-4 py-3 text-center text-purple-900 font-semibold">Morgens (40%)</th>
              <th class="px-4 py-3 text-center text-purple-900 font-semibold">Abends (60%)</th>
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
          <li><strong>Einnahme 2x täglich:</strong> Morgens 40% der Tagesdosis, Abends 60% der Tagesdosis</li>
          <li>Nehmen Sie CBD am besten zu den Mahlzeiten ein (Frühstück & Abendessen)</li>
          <li>Halten Sie CBD-Öl unter der Zunge für 60-90 Sekunden, bevor Sie schlucken</li>
          <li>Trinken Sie ausreichend Wasser (2-3 Liter täglich)</li>
          <li>Führen Sie ein Tagebuch über Ihre Symptome und Wirkungen</li>
          <li>Bei Nebenwirkungen reduzieren Sie die Dosis oder pausieren Sie</li>
          <li>Konsultieren Sie bei Unsicherheiten immer Ihren Arzt</li>
          <li><strong>Nehmen Sie diesen Plan zu Ihrem Arztgespräch mit!</strong></li>
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

  // Store data globally for PDF generation (including personal data)
  window.currentPlanData = { analysis, weeklyPlan, guidelines, maxSeverity, firstName, gender };
}

// Download PDF function using jsPDF
function downloadPDF() {
  if (!window.currentPlanData || typeof jspdf === 'undefined') {
    alert('PDF-Bibliothek wird geladen... Bitte versuchen Sie es in einigen Sekunden erneut.');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const { analysis, weeklyPlan, guidelines, maxSeverity, firstName, gender } = window.currentPlanData;
  
  // Create PDF
  const doc = new jsPDF();
  
  let yPos = 20;
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('Ihr persönlicher CBD Ausgleichsplan', 105, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('ECS Aktivierung - Personalisierte Dosierungsempfehlung', 105, yPos, { align: 'center' });
  
  yPos += 15;
  
  // Personalized Greeting
  const greeting = gender === 'female' ? 'Liebe' : 'Lieber';
  doc.setFontSize(14);
  doc.setTextColor(88, 28, 135);
  doc.setFont(undefined, 'bold');
  doc.text(`${greeting} ${firstName},`, 15, yPos);
  
  yPos += 10;
  
  // Welcoming Introduction Text
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');
  
  const welcomeText = `herzlich willkommen zu Ihrem persönlichen CBD-Ausgleichsplan! Wir freuen uns, dass Sie den Schritt wagen, Ihr Endocannabinoid-System (ECS) zu stärken und damit Ihren Körper auf natürliche Weise zu unterstützen.

Dieser Plan wurde speziell für Sie und Ihre aktuelle Medikation erstellt. Er basiert auf wissenschaftlichen Erkenntnissen über Wechselwirkungen zwischen CBD und Medikamenten und soll Ihnen helfen, CBD sicher und effektiv in Ihren Alltag zu integrieren.

Unser Ziel ist es, Sie auf Ihrem Weg zu begleiten - einem Weg, der Sie möglicherweise langfristig dabei unterstützt, weniger auf Medikamente angewiesen zu sein. Exogene Cannabinoide wie CBD können Ihr ECS von außen stärken und Ihrem Körper helfen, sein natürliches Gleichgewicht wiederzufinden.`;
  
  const welcomeLines = doc.splitTextToSize(welcomeText, 180);
  doc.text(welcomeLines, 15, yPos);
  
  yPos += welcomeLines.length * 5 + 10;
  
  // Severity warning if critical
  if (maxSeverity === 'critical' || maxSeverity === 'high') {
    doc.setFillColor(254, 226, 226);
    doc.rect(10, yPos, 190, 15, 'F');
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.setFont(undefined, 'bold');
    doc.text('WARNUNG: Kritische Wechselwirkungen erkannt!', 15, yPos + 10);
    yPos += 20;
  }
  
  // Guidelines
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Dosierungsrichtlinie:', 15, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Startdosis: ${guidelines?.recommended_start_mg || 5} mg/Tag`, 15, yPos);
  yPos += 5;
  doc.text(`Maximaldosis: ${guidelines?.max_dosage_mg || 50} mg/Tag`, 15, yPos);
  yPos += 5;
  doc.text(`Anpassung alle ${guidelines?.adjustment_period_days || 14} Tage`, 15, yPos);
  yPos += 5;
  doc.setFont(undefined, 'bold');
  doc.text('Einnahme: 2x täglich - Morgens (40%) und Abends (60%)', 15, yPos);
  
  yPos += 12;
  
  // Dosage Table
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Wochenplan:', 15, yPos);
  yPos += 8;
  
  // Table Header
  doc.setFillColor(237, 233, 254);
  doc.rect(10, yPos - 5, 190, 10, 'F');
  doc.setFontSize(10);
  doc.setTextColor(88, 28, 135);
  doc.text('Woche', 15, yPos);
  doc.text('Morgens', 60, yPos);
  doc.text('Abends', 95, yPos);
  doc.text('Gesamt/Tag', 125, yPos);
  doc.text('Hinweise', 165, yPos);
  
  yPos += 8;
  
  // Table Rows
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');
  
  weeklyPlan.forEach((week, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(10, yPos - 5, 190, 8, 'F');
    }
    
    doc.text(`Woche ${week.week}`, 15, yPos);
    doc.text(`${week.morningDosage} mg`, 60, yPos);
    doc.text(`${week.eveningDosage} mg`, 95, yPos);
    doc.setFont(undefined, 'bold');
    doc.text(`${week.totalDaily} mg`, 125, yPos);
    doc.setFont(undefined, 'normal');
    
    if (week.notes) {
      const noteText = doc.splitTextToSize(week.notes, 30);
      doc.text(noteText, 165, yPos - 2);
    }
    
    yPos += 8;
  });
  
  yPos += 5;
  
  // Important Notes
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFillColor(236, 253, 245);
  doc.rect(10, yPos, 190, 60, 'F');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.setFont(undefined, 'bold');
  doc.text('Wichtige Einnahmehinweise:', 15, yPos + 7);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  const instructions = [
    '• 2x täglich: Morgens 40% der Tagesdosis, Abends 60% der Tagesdosis',
    '• Einnahme zu den Mahlzeiten (Frühstück & Abendessen)',
    '• CBD-Öl 60-90 Sekunden unter der Zunge halten',
    '• Ausreichend Wasser trinken (2-3 Liter täglich)',
    '• Symptom-Tagebuch führen',
    '• Bei Nebenwirkungen Dosis reduzieren oder pausieren',
    '• Bei Unsicherheiten immer Arzt konsultieren'
  ];
  
  let instructionY = yPos + 15;
  instructions.forEach(instruction => {
    doc.text(instruction, 15, instructionY);
    instructionY += 6;
  });
  
  yPos += 65;
  
  // Medications List
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Ihre Medikamente:', 15, yPos);
  yPos += 7;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  
  analysis.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    const med = item.medication;
    doc.setFont(undefined, 'bold');
    doc.text(`${index + 1}. ${med.name}`, 15, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    doc.text(`   Dosierung: ${item.dosage}`, 15, yPos);
    
    if (item.interactions && item.interactions.length > 0) {
      const maxSev = item.interactions.reduce((max, i) => {
        const order = { low: 1, medium: 2, high: 3, critical: 4 };
        return order[i.severity] > order[max.severity] ? i : max;
      });
      yPos += 5;
      doc.setTextColor(220, 38, 38);
      doc.text(`   Wechselwirkung: ${maxSev.severity === 'critical' ? 'KRITISCH' : maxSev.severity === 'high' ? 'Hoch' : 'Mittel'}`, 15, yPos);
      doc.setTextColor(60, 60, 60);
    }
    
    yPos += 8;
  });
  
  yPos += 10;
  
  // DISCLAIMER AT THE END - CRITICAL MEDICAL/LEGAL NOTICE
  if (yPos > 210) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFillColor(255, 243, 205);
  doc.rect(10, yPos, 190, 65, 'F');
  doc.setFontSize(14);
  doc.setTextColor(200, 100, 0);
  doc.setFont(undefined, 'bold');
  doc.text('WICHTIGER HAFTUNGSAUSSCHLUSS', 105, yPos + 10, { align: 'center' });
  
  yPos += 18;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  
  const disclaimerText = `Dies ist KEINE medizinische Beratung und ersetzt NICHT den Besuch bei Ihrem Arzt!

Die hier bereitgestellten Informationen dienen ausschließlich zu Bildungszwecken und zur ersten Orientierung. Sie basieren auf öffentlich zugänglichen wissenschaftlichen Studien über Wechselwirkungen zwischen CBD und Medikamenten.

WICHTIG: Konsultieren Sie UNBEDINGT Ihren Arzt oder Apotheker, bevor Sie CBD einnehmen, insbesondere wenn Sie Medikamente einnehmen. Wechselwirkungen können gesundheitsgefährdend sein!

Ändern Sie NIEMALS ohne ärztliche Rücksprache Ihre Medikation. CBD kann Sie beim Ausschleichen von Medikamenten begleiten, aber NUR unter ärztlicher Aufsicht.

Nehmen Sie diesen Plan unbedingt zu Ihrem nächsten Arztgespräch mit und besprechen Sie die Einnahme von CBD mit Ihrem behandelnden Arzt.`;
  
  const disclaimerLines = doc.splitTextToSize(disclaimerText, 180);
  doc.text(disclaimerLines, 15, yPos);
  
  // Footer on all pages
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')} | Seite ${i} von ${pageCount}`, 105, 290, { align: 'center' });
    doc.text('ECS Aktivierung - www.ecs-aktivierung.de', 105, 285, { align: 'center' });
  }
  
  // Save PDF with personalized filename
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedName = firstName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`CBD-Ausgleichsplan_${sanitizedName}_${dateStr}.pdf`);
}
