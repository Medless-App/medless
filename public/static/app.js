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
  const email = form.querySelector('input[name="email"]').value.trim();
  const age = parseInt(form.querySelector('input[name="age"]').value) || null;
  const weight = parseFloat(form.querySelector('input[name="weight"]').value) || null;
  const height = parseFloat(form.querySelector('input[name="height"]').value) || null;
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

  if (!email) {
    alert('Bitte geben Sie Ihre E-Mail-Adresse an.');
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

  await analyzeMedications(medications, durationWeeks, firstName, gender, email, age, weight, height);
});

// Handle upload form submission
document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const imageFile = document.getElementById('image-upload').files[0];
  const durationWeeks = parseInt(document.getElementById('upload-duration-weeks').value);
  const firstName = form.querySelector('input[name="first_name"]').value.trim();
  const gender = form.querySelector('input[name="gender"]:checked')?.value;
  const email = form.querySelector('input[name="email"]').value.trim();
  const age = parseInt(form.querySelector('input[name="age"]').value) || null;
  const weight = parseFloat(form.querySelector('input[name="weight"]').value) || null;
  const height = parseFloat(form.querySelector('input[name="height"]').value) || null;

  if (!imageFile) {
    alert('Bitte laden Sie ein Bild hoch.');
    return;
  }

  if (!firstName) {
    alert('Bitte geben Sie Ihren Vornamen an.');
    return;
  }

  if (!gender) {
    alert('Bitte wählen Sie Ihr Geschlecht aus.');
    return;
  }

  if (!email) {
    alert('Bitte geben Sie Ihre E-Mail-Adresse an.');
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
      await analyzeMedications(medications, durationWeeks, firstName, gender, email, age, weight, height);
    } else {
      throw new Error(ocrResponse.data.error || 'OCR fehlgeschlagen');
    }
  } catch (error) {
    document.getElementById('loading').classList.add('hidden');
    alert('Fehler beim Bildupload: ' + (error.response?.data?.error || error.message));
  }
});

// Analyze medications
async function analyzeMedications(medications, durationWeeks, firstName = '', gender = '', email = '', age = null, weight = null, height = null) {
  // Show loading
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  try {
    const response = await axios.post('/api/analyze', {
      medications,
      durationWeeks,
      email,
      firstName,
      gender,
      age,
      weight,
      height
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
  const { analysis, maxSeverity, guidelines, weeklyPlan, warnings, product, personalization } = data;

  let html = '';

  // Critical warnings
  if (warnings && warnings.length > 0) {
    html += `
      <div class="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-lg shadow fade-in">
        <div class="flex items-start">
          <i class="fas fa-exclamation-circle text-red-600 text-3xl mr-4"></i>
          <div>
            <h3 class="text-xl font-bold text-red-800 mb-3">⚠️ Kritische Wechselwirkungen erkannt!</h3>
            ${warnings.map(w => `<p class="text-red-700 mb-2">${w}</p>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Product Information Box
  if (product) {
    html += `
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 p-6 mb-8 rounded-xl shadow-lg fade-in">
        <div class="flex items-start">
          <i class="fas fa-syringe text-purple-600 text-4xl mr-4"></i>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-purple-900 mb-3">💊 ${product.name}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <p><strong>🎯 Konzentration:</strong> ${product.concentration}</p>
              <p><strong>📏 Dosierungseinheit:</strong> ${product.dosageUnit}</p>
              <p><strong>💉 Verpackung:</strong> 3g Spritze mit 30 Teilstrichen</p>
              <p><strong>📊 1 Teilstrich:</strong> 1.5 cm = 70 mg CBD</p>
            </div>
            <div class="mt-4 bg-white p-4 rounded-lg border border-purple-200">
              <p class="text-sm text-gray-800">
                <strong>👅 Einnahme (Sublingual):</strong> Paste unter die Zunge legen, 2-3 Minuten einwirken lassen, dann schlucken. 
                Dies ermöglicht optimale Aufnahme über die Mundschleimhaut.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Personalization Summary
  if (personalization) {
    html += `
      <div class="bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-300 p-6 mb-8 rounded-xl shadow-lg fade-in">
        <div class="flex items-start">
          <i class="fas fa-user-circle text-teal-600 text-4xl mr-4"></i>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-teal-900 mb-3">📋 Ihre Personalisierung</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${personalization.age ? `
                <div class="bg-white p-3 rounded-lg border border-teal-200">
                  <p class="text-xs text-gray-600 mb-1">Alter</p>
                  <p class="text-lg font-bold text-teal-900">${personalization.age} Jahre</p>
                </div>
              ` : ''}
              ${personalization.bmi ? `
                <div class="bg-white p-3 rounded-lg border border-teal-200">
                  <p class="text-xs text-gray-600 mb-1">Body-Mass-Index (BMI)</p>
                  <p class="text-lg font-bold text-teal-900">${personalization.bmi.toFixed(1)}</p>
                </div>
              ` : ''}
              ${personalization.bsa ? `
                <div class="bg-white p-3 rounded-lg border border-teal-200">
                  <p class="text-xs text-gray-600 mb-1">Körperoberfläche (BSA)</p>
                  <p class="text-lg font-bold text-teal-900">${personalization.bsa.toFixed(2)} m²</p>
                </div>
              ` : ''}
              <div class="bg-white p-3 rounded-lg border border-teal-200">
                <p class="text-xs text-gray-600 mb-1">Einschleichphase</p>
                <p class="text-lg font-bold text-teal-900">${personalization.titrationDays} Tage</p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-teal-200">
                <p class="text-xs text-gray-600 mb-1">Startdosis</p>
                <p class="text-lg font-bold text-teal-900">${personalization.startDosageMg.toFixed(1)} mg</p>
              </div>
              ${personalization.firstDoseTime ? `
                <div class="bg-white p-3 rounded-lg border border-teal-200">
                  <p class="text-xs text-gray-600 mb-1">Erste Einnahme</p>
                  <p class="text-sm font-bold text-teal-900">${personalization.firstDoseTime}</p>
                </div>
              ` : ''}
            </div>
            ${personalization.notes && personalization.notes.length > 0 ? `
              <div class="mt-4 bg-white p-4 rounded-lg border border-teal-200">
                <p class="text-sm font-semibold text-gray-800 mb-2">🔍 Individuelle Anpassungen:</p>
                <ul class="text-sm text-gray-700 space-y-1">
                  ${personalization.notes.map(note => `<li>${note}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
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

  // Daily Dosing Plan (grouped by weeks)
  html += `
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in" id="dosage-plan-section">
      <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-calendar-check text-green-600 mr-3"></i>
        Ihr persönlicher CBD-Paste Dosierungsplan
      </h2>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
        <p class="text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Dosierungsphilosophie:</strong> "Start Low, Go Slow" - Wir beginnen mit niedriger Dosis und steigern schrittweise
        </p>
        <p class="text-blue-700 text-sm mt-2">
          <strong>📊 Dosierungseinheit:</strong> Zentimeter (cm) auf der Spritze • 
          <strong>💉 1 cm</strong> = 46.67 mg CBD • 
          <strong>📏 1 Teilstrich</strong> = 1.5 cm = 70 mg CBD
        </p>
        <p class="text-blue-700 text-sm mt-2">
          <strong>⏰ Einnahme:</strong> Phase 1: Nur abends (Einschleichphase) → Phase 2: 2x täglich (Morgens 40% + Abends 60%)
        </p>
      </div>
  `;

  // Group days by week
  weeklyPlan.forEach((week, weekIndex) => {
    html += `
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-purple-900 mb-4 flex items-center">
          <i class="fas fa-calendar-week text-purple-600 mr-3"></i>
          Woche ${week.week}
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead class="bg-purple-100">
              <tr>
                <th class="px-3 py-3 text-left text-purple-900 font-semibold border border-purple-200">Tag</th>
                <th class="px-3 py-3 text-center text-purple-900 font-semibold border border-purple-200">Morgens 🌅</th>
                <th class="px-3 py-3 text-center text-purple-900 font-semibold border border-purple-200">Abends 🌙</th>
                <th class="px-3 py-3 text-center text-purple-900 font-semibold border border-purple-200">Gesamt/Tag</th>
                <th class="px-3 py-3 text-left text-purple-900 font-semibold border border-purple-200">Hinweise</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    week.days.forEach((day, dayIndex) => {
      const bgColor = dayIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white';
      const morningDisplay = day.morningDosageCm > 0 
        ? `<span class="font-bold text-lg text-green-700">${day.morningDosageCm} cm</span><br><span class="text-xs text-gray-600">(${day.morningDosageMg.toFixed(1)} mg)</span>` 
        : `<span class="text-gray-400">—</span>`;
      const eveningDisplay = day.eveningDosageCm > 0 
        ? `<span class="font-bold text-lg text-blue-700">${day.eveningDosageCm} cm</span><br><span class="text-xs text-gray-600">(${day.eveningDosageMg.toFixed(1)} mg)</span>` 
        : `<span class="text-gray-400">—</span>`;
      const totalDisplay = day.totalDailyCm > 0 
        ? `<span class="font-bold text-xl text-purple-700">${day.totalDailyCm} cm</span><br><span class="text-xs text-gray-600">(${day.totalDailyMg.toFixed(1)} mg)</span>` 
        : `<span class="text-gray-400">—</span>`;
      
      html += `
        <tr class="${bgColor} hover:bg-purple-50 transition-colors">
          <td class="px-3 py-3 font-semibold text-gray-800 border border-gray-200">Tag ${day.day}</td>
          <td class="px-3 py-3 text-center border border-gray-200">${morningDisplay}</td>
          <td class="px-3 py-3 text-center border border-gray-200">${eveningDisplay}</td>
          <td class="px-3 py-3 text-center border border-gray-200">${totalDisplay}</td>
          <td class="px-3 py-3 text-sm text-gray-700 border border-gray-200">${day.notes || '—'}</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  html += `
      <div class="mt-6 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
        <h3 class="font-bold text-green-800 mb-3 text-lg">
          <i class="fas fa-clipboard-check mr-2"></i>
          💡 Wichtige Hinweise zur Einnahme von CBD-Paste 70%:
        </h3>
        <ul class="text-green-700 space-y-2 ml-6 list-disc">
          <li><strong>👅 Sublinguale Einnahme:</strong> Paste unter die Zunge legen, 2-3 Minuten einwirken lassen, dann schlucken (optimale Aufnahme!)</li>
          <li><strong>⏰ Phase 1 (Einschleichphase):</strong> Nur abends einnehmen - zur Verträglichkeitsprüfung</li>
          <li><strong>⏰ Phase 2 (Erhaltung):</strong> 2x täglich - Morgens 40%, Abends 60% der Tagesdosis</li>
          <li><strong>🍽️ Timing:</strong> Am besten zu den Mahlzeiten (Frühstück & Abendessen) für bessere Aufnahme</li>
          <li><strong>💧 Hydration:</strong> Ausreichend Wasser trinken (2-3 Liter täglich)</li>
          <li><strong>📝 Tagebuch:</strong> Führen Sie ein Symptom-Tagebuch über Wirkungen und Nebenwirkungen</li>
          <li><strong>⚠️ Bei Nebenwirkungen:</strong> Dosis reduzieren oder pausieren - dann Arzt konsultieren</li>
          <li><strong>👨‍⚕️ Ärztliche Begleitung:</strong> Nehmen Sie diesen Plan zu Ihrem Arztgespräch mit!</li>
          <li><strong>📏 Dosierung ablesen:</strong> Nutzen Sie die Teilstriche auf der Spritze (1 Teilstrich = 1.5 cm = 70 mg CBD)</li>
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

  // Store data globally for PDF generation (including ALL new data)
  window.currentPlanData = { 
    analysis, 
    weeklyPlan, 
    guidelines, 
    maxSeverity, 
    firstName, 
    gender,
    product,
    personalization
  };
}

// Download PDF function using jsPDF
function downloadPDF() {
  if (!window.currentPlanData || typeof jspdf === 'undefined') {
    alert('PDF-Bibliothek wird geladen... Bitte versuchen Sie es in einigen Sekunden erneut.');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const { analysis, weeklyPlan, guidelines, maxSeverity, firstName, gender, product, personalization } = window.currentPlanData;
  
  // Create PDF
  const doc = new jsPDF();
  
  let yPos = 20;
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('Ihr persönlicher CBD-Paste 70% Dosierungsplan', 105, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('ECS Aktivierung - Individualisierte Dosierungsstrategie', 105, yPos, { align: 'center' });
  
  yPos += 15;
  
  // Product Information Box
  if (product) {
    doc.setFillColor(243, 232, 255);
    doc.rect(10, yPos, 190, 30, 'F');
    doc.setFontSize(14);
    doc.setTextColor(88, 28, 135);
    doc.setFont(undefined, 'bold');
    doc.text('CBD-Paste 70% - Produktinformationen', 15, yPos + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'normal');
    doc.text(`Konzentration: ${product.concentration}`, 15, yPos + 15);
    doc.text(`Verpackung: 3g Spritze mit 30 Teilstrichen`, 15, yPos + 20);
    doc.text(`Dosierungseinheit: ${product.dosageUnit}`, 15, yPos + 25);
    
    yPos += 35;
  }
  
  // Personalization Summary
  if (personalization) {
    doc.setFillColor(204, 251, 241);
    doc.rect(10, yPos, 190, 25, 'F');
    doc.setFontSize(12);
    doc.setTextColor(20, 83, 88);
    doc.setFont(undefined, 'bold');
    doc.text('Ihre individuelle Dosierungsstrategie', 15, yPos + 8);
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'normal');
    let personalText = `Einschleichphase: ${personalization.titrationDays} Tage | Startdosis: ${personalization.startDosageMg.toFixed(1)} mg`;
    if (personalization.age) personalText += ` | Alter: ${personalization.age} Jahre`;
    if (personalization.bmi) personalText += ` | BMI: ${personalization.bmi.toFixed(1)}`;
    if (personalization.bsa) personalText += ` | BSA: ${personalization.bsa.toFixed(2)} m²`;
    
    doc.text(personalText, 15, yPos + 15);
    
    if (personalization.notes && personalization.notes.length > 0) {
      doc.text('Anpassungen: ' + personalization.notes.join(', '), 15, yPos + 20);
    }
    
    yPos += 30;
  }
  
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
  
  const welcomeText = `herzlich willkommen zu Ihrem persönlichen CBD-Paste 70% Dosierungsplan! Wir freuen uns, dass Sie den Schritt wagen, Ihr Endocannabinoid-System (ECS) mit hochkonzentrierter CBD-Paste zu stärken.

Dieser Plan wurde individuell für Sie erstellt - basierend auf Ihren Medikamenten, Ihrem Alter, Körpergewicht und Körpergröße. Er nutzt wissenschaftliche Erkenntnisse über CBD-Wechselwirkungen und die "Start Low, Go Slow"-Philosophie für maximale Sicherheit.

CBD-Paste 70% ist eine hochkonzentrierte Form von Cannabidiol. Die sublinguale Einnahme (unter die Zunge, 2-3 Minuten einwirken lassen) ermöglicht optimale Aufnahme über die Mundschleimhaut. Ihr Plan beginnt mit einer vorsichtigen Einschleichphase (nur abends) und steigert sich schrittweise zu einer 2x täglichen Einnahme für optimale ECS-Unterstützung.`;
  
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
  
  // Dosing Philosophy
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Dosierungsphilosophie: "Start Low, Go Slow"', 15, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Dosierungseinheit: Zentimeter (cm) auf der Spritze', 15, yPos);
  yPos += 5;
  doc.text('Umrechnung: 1 cm = 46.67 mg CBD | 1 Teilstrich (1.5 cm) = 70 mg CBD', 15, yPos);
  yPos += 5;
  doc.setFont(undefined, 'bold');
  doc.text('Phase 1: Nur abends (Einschleichphase)', 15, yPos);
  yPos += 5;
  doc.setFont(undefined, 'normal');
  doc.text('Phase 2: 2x täglich - Morgens 40% + Abends 60% (optimale ECS-Unterstützung)', 15, yPos);
  
  yPos += 10;
  
  // Sublingual Instructions Box
  doc.setFillColor(254, 249, 195);
  doc.rect(10, yPos, 190, 15, 'F');
  doc.setFontSize(10);
  doc.setTextColor(113, 63, 18);
  doc.setFont(undefined, 'bold');
  doc.text('Sublinguale Einnahme:', 15, yPos + 6);
  doc.setFont(undefined, 'normal');
  doc.text('Paste unter die Zunge legen, 2-3 Minuten einwirken lassen, dann schlucken.', 15, yPos + 11);
  
  yPos += 20;
  
  // Daily Dosage Plan (grouped by weeks)
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Tag-für-Tag Dosierungsplan:', 15, yPos);
  yPos += 10;
  
  weeklyPlan.forEach((week, weekIndex) => {
    // Check if we need a new page for this week
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    // Week Header
    doc.setFontSize(12);
    doc.setTextColor(88, 28, 135);
    doc.setFont(undefined, 'bold');
    doc.text(`Woche ${week.week}`, 15, yPos);
    yPos += 7;
    
    // Table Header
    doc.setFillColor(237, 233, 254);
    doc.rect(10, yPos - 5, 190, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(88, 28, 135);
    doc.setFont(undefined, 'bold');
    doc.text('Tag', 15, yPos);
    doc.text('Morgens', 40, yPos);
    doc.text('Abends', 75, yPos);
    doc.text('Gesamt', 110, yPos);
    doc.text('Hinweise', 145, yPos);
    
    yPos += 6;
    
    // Day Rows
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'normal');
    
    week.days.forEach((day, dayIndex) => {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }
      
      // Alternating row colors
      if (dayIndex % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(10, yPos - 4, 190, 7, 'F');
      }
      
      // Day number
      doc.text(`Tag ${day.day}`, 15, yPos);
      
      // Morning dosage
      if (day.morningDosageCm > 0) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(34, 139, 34);
        doc.text(`${day.morningDosageCm} cm`, 40, yPos);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`(${day.morningDosageMg.toFixed(1)} mg)`, 55, yPos);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('—', 40, yPos);
      }
      
      // Evening dosage
      doc.setTextColor(60, 60, 60);
      if (day.eveningDosageCm > 0) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(`${day.eveningDosageCm} cm`, 75, yPos);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`(${day.eveningDosageMg.toFixed(1)} mg)`, 88, yPos);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('—', 75, yPos);
      }
      
      // Total daily
      doc.setTextColor(60, 60, 60);
      if (day.totalDailyCm > 0) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(88, 28, 135);
        doc.text(`${day.totalDailyCm} cm`, 110, yPos);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`(${day.totalDailyMg.toFixed(1)} mg)`, 125, yPos);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('—', 110, yPos);
      }
      
      // Notes (remove emojis for PDF compatibility)
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined, 'normal');
      if (day.notes) {
        const cleanNotes = day.notes.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        const noteLines = doc.splitTextToSize(cleanNotes, 50);
        doc.text(noteLines[0], 145, yPos);
      }
      
      yPos += 7;
    });
    
    yPos += 5; // Space between weeks
  });
  
  yPos += 5;
  
  // Important Notes
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFillColor(236, 253, 245);
  doc.rect(10, yPos, 190, 68, 'F');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.setFont(undefined, 'bold');
  doc.text('Wichtige Einnahmehinweise für CBD-Paste 70%:', 15, yPos + 7);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  const instructions = [
    '• Sublinguale Einnahme: Paste unter die Zunge legen, 2-3 Minuten einwirken lassen, dann schlucken',
    '• Phase 1 (Einschleichphase): Nur abends einnehmen zur Verträglichkeitsprüfung',
    '• Phase 2 (Erhaltung): 2x täglich - Morgens 40%, Abends 60% der Tagesdosis',
    '• Timing: Am besten zu den Mahlzeiten (Frühstück & Abendessen) für bessere Aufnahme',
    '• Dosierung ablesen: Nutzen Sie die Teilstriche auf der Spritze (1 Teilstrich = 1.5 cm = 70 mg)',
    '• Hydration: Ausreichend Wasser trinken (2-3 Liter täglich)',
    '• Tagebuch: Führen Sie ein Symptom-Tagebuch über Wirkungen und Nebenwirkungen',
    '• Bei Nebenwirkungen: Dosis reduzieren oder pausieren, dann Arzt konsultieren',
    '• Ärztliche Begleitung: Nehmen Sie diesen Plan zu Ihrem Arztgespräch mit!'
  ];
  
  let instructionY = yPos + 15;
  instructions.forEach(instruction => {
    doc.text(instruction, 15, instructionY);
    instructionY += 7;
  });
  
  yPos += 73;
  
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
  doc.save(`CBD-Paste-70-Dosierungsplan_${sanitizedName}_${dateStr}.pdf`);
}
