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
        
        // Dosierung muss vom Kunden selbst eingegeben werden
        // (keine automatische Befüllung mehr)
        
        closeAllLists();
        
        // Focus auf Dosierungs-Eingabefeld setzen
        const dosageInput = input.parentElement.querySelector('input[name="medication_dosage[]"]');
        if (dosageInput) {
          dosageInput.focus();
        }
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

  // Show loading and scroll to it
  const loadingEl = document.getElementById('loading');
  loadingEl.classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  
  // Scroll to loading element (stays at form position, not bottom)
  setTimeout(() => {
    loadingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);

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

// Animate loading steps with extended duration and smoother progress
function animateLoadingSteps() {
  return new Promise((resolve) => {
    const steps = [
      { id: 1, duration: 2000, label: 'Medikamenten-Datenbank durchsuchen' },
      { id: 2, duration: 2500, label: 'Persönliche Daten verarbeiten' },
      { id: 3, duration: 2800, label: 'Individuellen Plan berechnen' }
    ];
    
    let progress = 0;
    const progressBar = document.getElementById('progress-bar');
    
    // Smooth progress bar animation with percentage display
    let totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let currentTime = 0;
    const progressText = document.getElementById('progress-text');
    
    const progressInterval = setInterval(() => {
      currentTime += 50;
      const smoothProgress = Math.min((currentTime / totalDuration) * 100, 100);
      progressBar.style.width = smoothProgress + '%';
      
      // Update percentage text
      if (progressText) {
        progressText.textContent = Math.round(smoothProgress) + '%';
      }
      
      if (currentTime >= totalDuration) {
        clearInterval(progressInterval);
        if (progressText) {
          progressText.textContent = '100%';
        }
      }
    }, 50);
    
    // Animate each step sequentially
    let delay = 0;
    steps.forEach((step, index) => {
      setTimeout(() => {
        const stepEl = document.getElementById(`step-${step.id}`);
        const checkEl = document.getElementById(`check-${step.id}`);
        
        // Activate current step with animation
        stepEl.classList.remove('bg-gray-100', 'opacity-50');
        stepEl.classList.add('bg-teal-50', 'border-teal-200');
        stepEl.style.transform = 'scale(1.02)';
        
        const circleIcon = stepEl.querySelector('.fa-circle');
        if (circleIcon) {
          circleIcon.classList.replace('fa-circle', 'fa-circle-notch');
          circleIcon.classList.add('fa-spin', 'text-teal-600');
        }
        
        const titleEl = stepEl.querySelector('.text-gray-700');
        if (titleEl) titleEl.classList.replace('text-gray-700', 'text-gray-900');
        
        const subtitleEl = stepEl.querySelector('.text-gray-500');
        if (subtitleEl) subtitleEl.classList.replace('text-gray-500', 'text-gray-600');
        
        // After duration, mark as complete
        setTimeout(() => {
          stepEl.style.transform = 'scale(1)';
          
          const notchIcon = stepEl.querySelector('.fa-circle-notch');
          if (notchIcon) {
            notchIcon.classList.remove('fa-spin');
            notchIcon.classList.replace('fa-circle-notch', 'fa-check-circle');
            notchIcon.classList.add('text-green-600');
          }
          
          checkEl.classList.remove('hidden');
          checkEl.classList.add('text-green-600');
          
          // Resolve when all steps are done
          if (index === steps.length - 1) {
            setTimeout(() => {
              clearInterval(progressInterval);
              resolve();
            }, 500);
          }
        }, step.duration);
      }, delay);
      
      delay += step.duration;
    });
  });
}

// Analyze medications with animated loading
async function analyzeMedications(medications, durationWeeks, firstName = '', gender = '', email = '', age = null, weight = null, height = null) {
  // Show loading and scroll to it
  const loadingEl = document.getElementById('loading');
  loadingEl.classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  
  // Scroll to loading element (stays at form position, not bottom)
  setTimeout(() => {
    loadingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);

  // Start animation
  const animationPromise = animateLoadingSteps();

  try {
    // Make API call
    const apiPromise = axios.post('/api/analyze', {
      medications,
      durationWeeks,
      email,
      firstName,
      gender,
      age,
      weight,
      height
    });

    // Wait for both animation and API call to complete
    const [response] = await Promise.all([apiPromise, animationPromise]);

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
              <p><strong>📊 1 Teilstrich:</strong> 1.5 cm = 70 mg Cannabinoide</p>
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
              Keine bekannten Wechselwirkungen mit Cannabinoiden
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
        Ihr persönlicher Cannabinoid-Reduktionsplan
      </h2>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
        <p class="text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Dosierungsphilosophie:</strong> "Start low, go slow (niedrig beginnen, langsam steigern)" - Wir beginnen mit niedriger Dosis und steigern schrittweise
        </p>
        <p class="text-blue-700 text-sm mt-2">
          <strong>📊 Dosierungseinheit:</strong> Zentimeter (cm) auf der Spritze • 
          <strong>💉 1 cm</strong> = 46,7 mg Cannabinoide • 
          <strong>📏 1 Teilstrich</strong> = 1,5 cm = 70 mg Cannabinoide
        </p>
        <p class="text-blue-700 text-sm mt-2">
          <strong>⏰ Einnahme:</strong> Phase 1: Nur abends (Einschleichphase) → Phase 2: 2x täglich (Morgens ~40 % + Abends ~60 %)
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
          💡 Wichtige Hinweise zur Einnahme von Cannabinoid-Paste 70%:
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
          <li><strong>📏 Dosierung ablesen:</strong> Nutzen Sie die Teilstriche auf der Spritze (1 Teilstrich = 1.5 cm = 70 mg Cannabinoide)</li>
        </ul>
      </div>

      <div class="mt-8">
        <button onclick="downloadPDF()" class="w-full py-5 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg transform hover:scale-105">
          <i class="fas fa-file-pdf mr-2"></i>
          📄 Dosierungsplan als PDF herunterladen
        </button>
        <p class="text-center text-sm text-gray-500 mt-3">
          <i class="fas fa-info-circle mr-1"></i>
          Die PDF können Sie anschließend selbst ausdrucken oder digital speichern
        </p>
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

// Download PDF function using jsPDF - Global Standards Applied
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
  
  // === NEUE HAUPTÜBERSCHRIFT ===
  doc.setFontSize(18); // 18pt statt 20pt
  doc.setTextColor(0, 77, 64); // #004D40 (dunkleres Teal)
  doc.setFont(undefined, 'bold');
  doc.text('Cannabinoid-Reduktionsplan – Ihr Weg zu weniger Medikamenten', 105, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(12); // 12pt
  doc.setTextColor(0, 105, 92); // #00695C
  doc.setFont(undefined, 'normal');
  doc.text('Erstellt auf Basis Ihrer Eingaben, wissenschaftlich fundiert und KI-gestützt', 105, yPos, { align: 'center' });
  
  yPos += 12;
  
  // === PERSONALISIERTE ANREDE (vor Übersicht) ===
  const greeting = gender === 'female' ? 'Liebe' : 'Lieber';
  const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  doc.setFontSize(12); // 12pt statt 14pt
  doc.setTextColor(0, 77, 64); // #004D40
  doc.setFont(undefined, 'bold');
  doc.text(`${greeting} ${capitalizedFirstName},`, 15, yPos);
  
  yPos += 6;
  
  // === BEGRÜSSUNGSTEXT ===
  doc.setFontSize(11); // 11pt
  doc.setTextColor(34, 34, 34); // #222
  doc.setFont(undefined, 'normal');
  
  const greetingText = `willkommen zu Ihrem persönlichen Cannabinoid-Reduktionsplan!

Dieser Plan wurde individuell für Sie erstellt – basierend auf Ihrer aktuellen Medikation, Ihrem Alter, Körpergewicht und Ihrer Körpergröße.

Ziel ist es, das Endocannabinoid-System (ECS) zu stärken und dadurch schrittweise Ihre Medikamentenmenge zu reduzieren – unter ärztlicher Begleitung und ohne Risiko.`;
  
  const greetingLines = doc.splitTextToSize(greetingText, 180);
  doc.text(greetingLines, 15, yPos);
  
  yPos += greetingLines.length * 5 + 8;
  
  // === ÜBERSICHT IHRES PLANS (nach Begrüßung) ===
  doc.setFillColor(230, 247, 241); // #E6F7F1 (hellgrün)
  const boxHeight = 32;
  doc.rect(10, yPos, 190, boxHeight, 'F');
  doc.roundedRect(10, yPos, 190, boxHeight, 3, 3, 'S'); // Rahmen mit abgerundeten Ecken
  
  doc.setFontSize(12); // 12pt
  doc.setTextColor(0, 77, 64); // #004D40
  doc.setFont(undefined, 'bold');
  doc.text('📋 Übersicht Ihres Plans', 22, yPos + 8);
  
  doc.setFontSize(11); // 11pt
  doc.setFont(undefined, 'normal');
  doc.setTextColor(34, 34, 34); // #222
  
  // Calculate values with comma formatting
  const startDosageCm = weeklyPlan[0]?.days[0]?.eveningDosageCm || 0.2;
  const startDosageMg = (startDosageCm * 46.7).toFixed(1).replace('.', ',');
  const targetCm = '1,5';
  const targetMg = '70';
  const startCmFormatted = startDosageCm.toString().replace('.', ',');
  
  doc.text(`• Startdosis (Tag 1): ${startCmFormatted} cm = ${startDosageMg} mg (abends)`, 22, yPos + 14);
  doc.text(`• Zielbereich (Woche 7–8): ${targetCm} cm = ${targetMg} mg Cannabinoide täglich`, 22, yPos + 19);
  doc.text(`• Verteilung: morgens ~40 %, abends ~60 %`, 22, yPos + 24);
  doc.text(`• Einschleichphase: 3 Tage (nur abends) | Gesamtdauer: 8 Wochen`, 22, yPos + 29);
  
  yPos += boxHeight + 8;
  
  // === PRODUKTINFORMATIONEN (mit Referenzumrechnung) ===
  if (product) {
    doc.setFillColor(230, 247, 241); // #E6F7F1 (hellgrün)
    const prodBoxHeight = 35;
    doc.rect(10, yPos, 190, prodBoxHeight, 'F');
    doc.roundedRect(10, yPos, 190, prodBoxHeight, 3, 3, 'S');
    
    doc.setFontSize(12); // 12pt
    doc.setTextColor(0, 77, 64); // #004D40
    doc.setFont(undefined, 'bold');
    doc.text('Cannabinoid-Paste 70 % – Produktinformationen', 22, yPos + 8);
    
    doc.setFontSize(11); // 11pt
    doc.setTextColor(34, 34, 34); // #222
    doc.setFont(undefined, 'normal');
    doc.text('• Konzentration: 70 % Cannabinoide', 22, yPos + 14);
    doc.text('• Verpackung: 3 g Spritze mit 30 Teilstrichen (je 0,1 cm pro Teilstrich)', 22, yPos + 19);
    doc.text('• Dosierungseinheit: Zentimeter (cm) auf der Spritze', 22, yPos + 24);
    
    // Referenz-Umrechnung
    doc.setFont(undefined, 'bold');
    doc.text('Formel: mg = cm × 46,7', 22, yPos + 30);
    doc.setFont(undefined, 'normal');
    doc.text('(1,5 cm = 70 mg | 1,0 cm = 46,7 mg | 0,1 cm = 4,67 mg)', 72, yPos + 30);
    
    yPos += prodBoxHeight + 8;
  }
  
  // === IHRE INDIVIDUELLE DOSIERUNGSSTRATEGIE ===
  if (personalization) {
    doc.setFillColor(230, 247, 241); // #E6F7F1
    const persBoxHeight = personalization.notes && personalization.notes.length > 0 ? 38 : 28;
    doc.rect(10, yPos, 190, persBoxHeight, 'F');
    doc.roundedRect(10, yPos, 190, persBoxHeight, 3, 3, 'S');
    
    doc.setFontSize(12); // 12pt
    doc.setTextColor(0, 77, 64); // #004D40
    doc.setFont(undefined, 'bold');
    doc.text('Ihre individuelle Dosierungsstrategie', 22, yPos + 8);
    
    doc.setFontSize(11); // 11pt
    doc.setTextColor(34, 34, 34); // #222
    doc.setFont(undefined, 'normal');
    
    // Format numbers with comma
    const startMg = personalization.startDosageMg.toFixed(1).replace('.', ',');
    let line1 = `Einschleichphase: ${personalization.titrationDays} Tage | Startdosis: ${startMg} mg`;
    let line2 = '';
    if (personalization.age) line2 += `Alter: ${personalization.age} Jahre`;
    if (personalization.bmi) line2 += ` | BMI: ${personalization.bmi.toFixed(1).replace('.', ',')}`;
    if (personalization.bsa) line2 += ` | BSA: ${personalization.bsa.toFixed(2).replace('.', ',')} m²`;
    
    doc.text(line1, 22, yPos + 14);
    if (line2) doc.text(line2, 22, yPos + 19);
    
    if (personalization.notes && personalization.notes.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('Individuelle Anpassungen:', 22, yPos + 25);
      doc.setFont(undefined, 'normal');
      const notesText = personalization.notes.join(', ');
      const notesLines = doc.splitTextToSize(notesText, 178);
      doc.text(notesLines, 22, yPos + 30);
    }
    
    yPos += persBoxHeight + 5;
  }
  
  // Keine separate "Phasen Ihres Plans" Sektion mehr - ist schon in Übersicht enthalten
  
  // === WARNUNG BEI WECHSELWIRKUNGEN (oberhalb der Tabelle) ===
  if (maxSeverity === 'critical' || maxSeverity === 'high') {
    doc.setFillColor(253, 236, 234); // #FDECEA (zartrot)
    const warnBoxHeight = 32;
    doc.rect(10, yPos, 190, warnBoxHeight, 'F');
    doc.roundedRect(10, yPos, 190, warnBoxHeight, 3, 3, 'S');
    
    doc.setFontSize(12); // 12pt
    doc.setTextColor(220, 38, 38);
    doc.setFont(undefined, 'bold');
    doc.text('⚠️ Wichtig: Ihr Medikamentenprofil weist mögliche Wechselwirkungen auf', 22, yPos + 8);
    
    doc.setFontSize(11); // 11pt
    doc.setTextColor(34, 34, 34); // #222
    doc.setFont(undefined, 'normal');
    const warningText = 'Ihr Plan wurde deshalb besonders vorsichtig gestaltet. Bitte starten Sie erst nach ärztlicher Rücksprache.';
    const warningLines = doc.splitTextToSize(warningText, 178);
    doc.text(warningLines, 22, yPos + 16);
    
    doc.setFont(undefined, 'italic');
    doc.text('Dies dient Ihrer Sicherheit und ermöglicht eine optimale Anpassung.', 22, yPos + 26);
    
    yPos += warnBoxHeight + 8;
  }
  
  // Prüfe, ob neue Seite nötig ist
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }
  
  // === T\u00c4GLICHER DOSIERUNGSPLAN ===
  doc.setFontSize(18); // 18pt f\u00fcr Haupttitel
  doc.setTextColor(0, 77, 64); // #004D40
  doc.setFont(undefined, 'bold');
  doc.text('Ihr w\u00f6chentlicher Reduktionsplan', 15, yPos);
  yPos += 10;
  
  weeklyPlan.forEach((week, weekIndex) => {
    // Check if we need a new page for this week
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    // === WOCHEN\u00dcBERSCHRIFT ===
    doc.setFontSize(12); // 12pt
    doc.setTextColor(0, 77, 64); // #004D40
    doc.setFont(undefined, 'bold');
    doc.text(`Woche ${week.week}`, 15, yPos);
    yPos += 7;
    
    // === TABELLENHEADER (10pt, fett, #004D40) ===
    doc.setFillColor(255, 255, 255); // Wei\u00dfer Hintergrund
    doc.rect(10, yPos - 5, 190, 9, 'F');
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 77, 64);
    doc.rect(10, yPos - 5, 190, 9, 'S'); // Rahmen
    
    doc.setFontSize(10); // 10pt f\u00fcr Tabellenkopf
    doc.setTextColor(0, 77, 64); // #004D40
    doc.setFont(undefined, 'bold');
    doc.text('Tag', 15, yPos);
    doc.text('Morgens (cm / mg)', 40, yPos);
    doc.text('Abends (cm / mg)', 85, yPos);
    doc.text('Gesamt t\u00e4glich', 130, yPos);
    doc.text('Hinweise', 170, yPos);
    
    yPos += 7;
    
    // === TAGESZEILEN (STANDARD: nur eine Erhöhungszeile pro Woche für Woche 1-3) ===
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'normal');
    
    // For week 1-3: Show only one summary row with dose increase
    if (week.week <= 3) {
      // Alternating row color
      doc.setFillColor(249, 250, 251);
      doc.rect(10, yPos - 4, 190, 7, 'F');
      
      // Get first day data
      const firstDay = week.days[0];
      
      doc.text(`Tage ${(week.week - 1) * 7 + 1}-${week.week * 7}`, 15, yPos);
      
      // Morning dosage (MIT KOMMA!)
      if (firstDay.morningDosageCm > 0) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(34, 139, 34);
        doc.text(`${firstDay.morningDosageCm.toFixed(1).replace('.', ',')} cm`, 40, yPos);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`(${firstDay.morningDosageMg.toFixed(1).replace('.', ',')} mg)`, 56, yPos);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('—', 40, yPos);
      }
      
      // Evening dosage (MIT KOMMA!)
      doc.setTextColor(60, 60, 60);
      if (firstDay.eveningDosageCm > 0) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(`${firstDay.eveningDosageCm.toFixed(1).replace('.', ',')} cm`, 85, yPos);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`(${firstDay.eveningDosageMg.toFixed(1).replace('.', ',')} mg)`, 101, yPos);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('—', 85, yPos);
      }
      
      // Total daily (MIT KOMMA!)
      doc.setTextColor(60, 60, 60);
      if (firstDay.totalDailyCm > 0) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(88, 28, 135);
        doc.text(`${firstDay.totalDailyCm.toFixed(1).replace('.', ',')} cm`, 130, yPos);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`(${firstDay.totalDailyMg.toFixed(1).replace('.', ',')} mg)`, 148, yPos);
      }
      
      // Weekly summary note (MIT KOMMA!)
      doc.setTextColor(60, 60, 60);
      doc.setFont(undefined, 'italic');
      doc.text(`Dosierung: ${firstDay.totalDailyMg.toFixed(1).replace('.', ',')} mg täglich`, 170, yPos);
      
      yPos += 7;
    } else {
      // For week 4-8: Show all days
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
        
        // Morning dosage (MIT KOMMA!)
        if (day.morningDosageCm > 0) {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(34, 139, 34);
          doc.text(`${day.morningDosageCm.toFixed(1).replace('.', ',')} cm`, 40, yPos);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`(${day.morningDosageMg.toFixed(1).replace('.', ',')} mg)`, 56, yPos);
        } else {
          doc.setTextColor(150, 150, 150);
          doc.text('—', 40, yPos);
        }
        
        // Evening dosage (MIT KOMMA!)
        doc.setTextColor(60, 60, 60);
        if (day.eveningDosageCm > 0) {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(30, 64, 175);
          doc.text(`${day.eveningDosageCm.toFixed(1).replace('.', ',')} cm`, 85, yPos);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`(${day.eveningDosageMg.toFixed(1).replace('.', ',')} mg)`, 101, yPos);
        } else {
          doc.setTextColor(150, 150, 150);
          doc.text('—', 85, yPos);
        }
        
        // Total daily (MIT KOMMA!)
        doc.setTextColor(60, 60, 60);
        if (day.totalDailyCm > 0) {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(88, 28, 135);
          doc.text(`${day.totalDailyCm.toFixed(1).replace('.', ',')} cm`, 130, yPos);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`(${day.totalDailyMg.toFixed(1).replace('.', ',')} mg)`, 148, yPos);
        } else {
          doc.setTextColor(150, 150, 150);
          doc.text('—', 130, yPos);
        }
        
        // Notes (remove emojis for PDF compatibility)
        doc.setTextColor(60, 60, 60);
        doc.setFont(undefined, 'normal');
        if (day.notes) {
          const cleanNotes = day.notes.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
          const noteLines = doc.splitTextToSize(cleanNotes, 25);
          doc.text(noteLines[0], 170, yPos);
        }
        
        yPos += 7;
      });
    }
    
    yPos += 5; // Space between weeks
  });
  
  yPos += 5;
  
  // === SICHERHEIT & ÄRZTLICHE BEGLEITUNG (STANDARD: immer am Ende) ===
  if (yPos > 210) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFillColor(236, 253, 245);
  doc.rect(10, yPos, 190, 82, 'F');
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52);
  doc.setFont(undefined, 'bold');
  doc.text('Sicherheitshinweise & Ärztliche Begleitung', 15, yPos + 7);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(34, 34, 34);
  const instructions = [
    '• Sublinguale Einnahme: Paste unter die Zunge, 2-3 Minuten einwirken lassen, dann schlucken.',
    '• Phase 1 (Einschleichphase): Nur abends (Tage 1-3), um Verträglichkeit zu prüfen.',
    '• Phase 2 (Erhaltungsphase): 2x täglich (morgens ~40 %, abends ~60 %) wie im Plan angegeben.',
    '• Zeitpunkt: Am besten zu den Mahlzeiten (z. B. Frühstück & Abendessen) für bessere Aufnahme.',
    '• Dosierung ablesen: Teilstriche auf der Spritze nutzen. 1 Teilstrich = 1,5 cm = 70 mg Cannabinoide.',
    '• Ausreichend trinken: Täglich ca. 2-3 Liter Wasser.',
    '• Symptom-Tagebuch: Täglich notieren (Wirkung, Nebenwirkungen, Schlaf, Stimmung, Schmerzen).',
    '',
    'Bei Nebenwirkungen: Sofort auf die zuletzt gut verträgliche Dosis des Vortags zurückgehen',
    '("Step-back-Regel") und ärztlich Rücksprache halten.',
    '',
    'Cannabinoide können das ECS unterstützen und ärztlich begleitete Anpassungen der',
    'Medikation erleichtern. Änderungen erfolgen ausschließlich durch Ärztinnen und Ärzte.',
    '',
    'Bitte nehmen Sie diesen Plan zu Ihrem Arzttermin mit – er dient als Gesprächsgrundlage.'
  ];
  
  let instructionY = yPos + 14;
  instructions.forEach(instruction => {
    doc.text(instruction, 15, instructionY);
    instructionY += 5.2;
  });
  
  yPos += 87;
  
  // === MEDIKAMENTENLISTE (STANDARD: Tabellenform) ===
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Ihre aktuellen Medikamente (zum Zeitpunkt der Plan-Erstellung):', 15, yPos);
  yPos += 8;
  
  // Table Header
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 77, 64);
  doc.rect(10, yPos - 5, 190, 8, 'S');
  doc.setFontSize(10);
  doc.setTextColor(0, 77, 64);
  doc.setFont(undefined, 'bold');
  doc.text('Nr.', 12, yPos);
  doc.text('Wirkstoff (Generikum)', 25, yPos);
  doc.text('Dosierung', 85, yPos);
  doc.text('Einnahme', 125, yPos);
  doc.text('Wechselwirkung', 160, yPos);
  
  yPos += 6;
  
  // Table Rows
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  
  analysis.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(10, yPos - 4, 190, 7, 'F');
    }
    
    const med = item.medication;
    
    // Nr.
    doc.text(`${index + 1}`, 12, yPos);
    
    // Wirkstoff (name + generic)
    const medName = med.generic_name ? `${med.name} (${med.generic_name})` : med.name;
    const medNameLines = doc.splitTextToSize(medName, 55);
    doc.text(medNameLines[0], 25, yPos);
    
    // Dosierung
    const dosageLines = doc.splitTextToSize(item.dosage, 35);
    doc.text(dosageLines[0], 85, yPos);
    
    // Einnahme (frequency or "regelmäßig")
    const frequency = item.frequency || 'regelmäßig';
    doc.text(frequency, 125, yPos);
    
    // Wechselwirkung
    if (item.interactions && item.interactions.length > 0) {
      const maxSev = item.interactions.reduce((max, i) => {
        const order = { low: 1, medium: 2, high: 3, critical: 4 };
        return order[i.severity] > order[max.severity] ? i : max;
      });
      const sevText = maxSev.severity === 'critical' ? 'kritisch' : 
                      maxSev.severity === 'high' ? 'hoch' : 
                      maxSev.severity === 'medium' ? 'mittel' : 'niedrig';
      
      if (maxSev.severity === 'critical' || maxSev.severity === 'high') {
        doc.setTextColor(220, 38, 38);
      } else if (maxSev.severity === 'medium') {
        doc.setTextColor(234, 88, 12); // Orange
      } else {
        doc.setTextColor(34, 139, 34); // Green
      }
      doc.text(sevText, 160, yPos);
      doc.setTextColor(60, 60, 60);
    } else {
      doc.setTextColor(34, 139, 34);
      doc.text('keine', 160, yPos);
      doc.setTextColor(60, 60, 60);
    }
    
    yPos += 7;
  });
  
  yPos += 8;
  
  // === WECHSELWIRKUNGEN HINWEIS (STANDARD: unter Tabelle) ===
  doc.setFillColor(254, 249, 195);
  doc.rect(10, yPos, 190, 12, 'F');
  doc.setFontSize(8);
  doc.setTextColor(113, 63, 18);
  doc.setFont(undefined, 'normal');
  doc.text('Einstufung "mittel" bedeutet, dass Wirkstoffspiegel steigen können. Ärztliche Dosisanpassungen', 15, yPos + 5);
  doc.text('sind möglich – bitte nie eigenmächtig ändern.', 15, yPos + 10);
  
  yPos += 17;
  
  // === DISCLAIMER (letzte Seite, hellgraue Box) ===
  if (yPos > 190) {
    doc.addPage();
    yPos = 20;
  }
  
  const disclaimerText = `Dieser Plan ist keine medizinische Beratung und ersetzt nicht den Besuch bei Ihrem Arzt bzw. Ihrer Ärztin.

Die Informationen dienen ausschlie\u00dflich zu Bildungszwecken und zur ersten Orientierung. Sie basieren auf \u00f6ffentlich zug\u00e4nglichen wissenschaftlichen Studien zu Wechselwirkungen zwischen Cannabinoiden und Medikamenten.

Wichtig:
\u2022 Sprechen Sie unbedingt mit Ihrem Arzt bzw. Ihrer \u00c4rztin, bevor Sie Cannabinoide einnehmen \u2013 besonders bei bestehender Medikation.
\u2022 Wechselwirkungen k\u00f6nnen gesundheitsgef\u00e4hrdend sein.
\u2022 \u00c4ndern Sie niemals Ihre Medikation, ohne dies \u00e4rztlich abzusprechen.

Cannabinoide k\u00f6nnen Sie bei \u00e4rztlich begleiteter Medikamenten-Reduktion unterst\u00fctzen \u2013 aber ausschlie\u00dflich unter \u00e4rztlicher Aufsicht.

Bitte nehmen Sie diesen Plan zu Ihrem n\u00e4chsten Arzttermin mit und besprechen Sie gemeinsam, ob und wie Sie Cannabinoide einsetzen m\u00f6chten.`;
  
  const disclaimerLines = doc.splitTextToSize(disclaimerText, 174);
  const disclaimerHeight = disclaimerLines.length * 5.2 + 22;
  
  // Hellgraue Box f\u00fcr Disclaimer
  doc.setFillColor(245, 245, 245); // Hellgrau
  doc.rect(10, yPos, 190, disclaimerHeight, 'F');
  doc.roundedRect(10, yPos, 190, disclaimerHeight, 3, 3, 'S');
  
  doc.setFontSize(12); // 12pt
  doc.setTextColor(0, 77, 64); // #004D40
  doc.setFont(undefined, 'bold');
  doc.text('Wichtiger Hinweis & Haftungsausschluss', 105, yPos + 10, { align: 'center' });
  
  yPos += 18;
  doc.setFontSize(11); // 11pt
  doc.setTextColor(34, 34, 34); // #222
  doc.setFont(undefined, 'normal');
  
  doc.text(disclaimerLines, 18, yPos);
  
  yPos += disclaimerLines.length * 5.2 + 10;
  
  // === KI SIGNATUR (zentriert am Ende) ===
  doc.setFontSize(9); // 9pt
  doc.setTextColor(136, 136, 136); // #888
  doc.setFont(undefined, 'italic');
  doc.text('Erstellt durch KI auf Basis wissenschaftlicher Studien zu Cannabinoid-Dosierung und ECS-Regulation.', 105, yPos, { align: 'center' });
  
  // === FOOTER (9pt, kursiv, rechtsb\u00fcndig) ===
  doc.setFontSize(9); // 9pt
  doc.setTextColor(136, 136, 136); // #888
  doc.setFont(undefined, 'italic');
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')} | Seite ${i} von ${pageCount}`, 190, 290, { align: 'right' });
    doc.text('ECS Aktivierung - www.ecs-aktivierung.de', 105, 285, { align: 'center' });
  }
  
  // === DATEINAME (einheitlich: Cannabinoid-Reduktionsplan) ===
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedName = capitalizedFirstName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Cannabinoid-Reduktionsplan_${sanitizedName}_${dateStr}.pdf`);
}
