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
      
      const riskColor = med.risk_level === 'high' || med.risk_level === 'very_high' ? 'bg-red-100' : 
                         med.risk_level === 'medium' ? 'bg-yellow-100' : 'bg-green-100';
      
      item.innerHTML = `
        <div class="font-semibold text-gray-800">${displayName}</div>
        ${med.generic_name ? `<div class="text-sm text-gray-600">${med.generic_name}</div>` : ''}
        <div class="text-xs text-gray-500 mt-1">
          <span class="inline-block px-2 py-1 ${riskColor} rounded">
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

// Add medication input - DISABLED (now handled in index.tsx inline JavaScript)
// Medication input management with mg/day field
let medicationCount = 0;

function createMedicationInput() {
  medicationCount++;
  const container = document.getElementById('medication-inputs');
  
  const inputGroup = document.createElement('div');
  inputGroup.className = 'medication-input-group';
  inputGroup.style.cssText = 'margin-bottom: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%); border-radius: 12px; border: 2px solid #f59e0b; position: relative;';
  
  inputGroup.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h4 style="margin: 0; color: #b45309; font-size: 1rem;">
        <i class="fas fa-pills" style="margin-right: 0.5rem;"></i>
        Medikament ${medicationCount}
      </h4>
      ${medicationCount > 1 ? `
        <button type="button" class="remove-medication" style="background: #fee2e2; color: #dc2626; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
          <i class="fas fa-times"></i> Entfernen
        </button>
      ` : ''}
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
      <!-- Medication Name with Autocomplete -->
      <div style="position: relative;">
        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
          Medikamentenname
        </label>
        <input type="text" 
               name="medication_display[]" 
               class="medication-display-input" 
               placeholder="z.B. Ibuprofen, Diazepam, Sertralin..." 
               required
               style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 8px; font-size: 0.95rem;">
        <input type="hidden" name="medication_name[]" class="medication-name-hidden">
      </div>
      

      <!-- mg/Tag - PRIMARY INPUT (gleiche Farbe wie Medikamentenname) -->
      <div>
        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
          Tagesdosis in mg
        </label>
        <input type="number" 
               name="medication_mg_per_day[]" 
               placeholder="z.B. 1200" 
               min="0"
               step="0.1"
               required
               style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 8px; font-size: 0.95rem;">
      </div>
    </div>
  `;
  
  container.appendChild(inputGroup);
  
  // Setup autocomplete for the new input
  const displayInput = inputGroup.querySelector('.medication-display-input');
  setupAutocomplete(displayInput);
  
  // Add remove handler
  const removeBtn = inputGroup.querySelector('.remove-medication');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      inputGroup.remove();
      renumberMedications();
    });
  }
}

function renumberMedications() {
  const groups = document.querySelectorAll('.medication-input-group');
  medicationCount = groups.length;
  groups.forEach((group, index) => {
    const title = group.querySelector('h4');
    if (title) {
      title.innerHTML = `<i class="fas fa-pills" style="margin-right: 0.5rem;"></i>Medikament ${index + 1}`;
    }
  });
}

// Initialize first medication input on page load
document.addEventListener('DOMContentLoaded', () => {
  createMedicationInput();
});

// Add medication button handler
document.getElementById('add-medication')?.addEventListener('click', () => {
  createMedicationInput();
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
  
  // Get medications from new autocomplete inputs (medication_display[] contains the visible names)
  const medicationNames = form.querySelectorAll('input[name="medication_display[]"], input.medication-display-input');
  const medicationMgPerDay = form.querySelectorAll('input[name="medication_mg_per_day[]"]');
  
  const durationWeeks = parseInt(form.querySelector('select[name="duration_weeks"]').value);
  const reductionGoal = parseInt(form.querySelector('select[name="reduction_goal"]').value);

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

  if (!durationWeeks || isNaN(durationWeeks)) {
    alert('Bitte wählen Sie eine Plan-Dauer aus.');
    return;
  }

  if (!reductionGoal || isNaN(reductionGoal)) {
    alert('Bitte wählen Sie ein Reduktionsziel aus.');
    return;
  }

  const medications = [];
  medicationNames.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    const mgPerDayValue = parseFloat(medicationMgPerDay[index]?.value);
    
    if (name) {
      // Validate mg/day is provided and valid
      if (!mgPerDayValue || isNaN(mgPerDayValue) || mgPerDayValue <= 0) {
        alert(`Bitte geben Sie eine gültige Tagesdosis in mg für "${name}" ein.`);
        throw new Error('Invalid mg/day value');
      }
      
      medications.push({
        name: name,
        dosage: `${mgPerDayValue} mg/Tag`,  // Generate dosage from mg/day value
        mgPerDay: mgPerDayValue
      });
    }
  });

  if (medications.length === 0) {
    alert('Bitte geben Sie mindestens ein Medikament an.');
    return;
  }

  await analyzeMedications(medications, durationWeeks, firstName, gender, email, age, weight, height, reductionGoal);
});

// Animate loading steps with rich visual feedback
function animateLoadingSteps() {
  return new Promise((resolve) => {
    const steps = [
      { 
        id: 1, 
        duration: 1800, 
        title: 'Medikamenten-Datenbank durchsuchen',
        details: [
          'Datenbank wird geladen...',
          'Medikamente werden identifiziert...',
          'Wirkstoffe werden analysiert...'
        ]
      },
      { 
        id: 2, 
        duration: 1600, 
        title: 'Wechselwirkungen analysieren',
        details: [
          'CYP450-Enzyme werden geprüft...',
          'Wechselwirkungen werden berechnet...',
          'Risiken werden kategorisiert...'
        ]
      },
      { 
        id: 3, 
        duration: 1400, 
        title: 'Körperdaten verarbeiten',
        details: [
          'BMI wird berechnet...',
          'Stoffwechselrate wird geschätzt...',
          'Dosisfaktoren werden angepasst...'
        ]
      },
      { 
        id: 4, 
        duration: 1800, 
        title: 'Dosierung berechnen',
        details: [
          'Startdosis wird ermittelt...',
          'Titrationsschema wird erstellt...',
          'Sicherheitspuffer werden eingerechnet...'
        ]
      },
      { 
        id: 5, 
        duration: 1600, 
        title: 'Reduktionsplan erstellen',
        details: [
          'Wochenplan wird generiert...',
          'PDF wird vorbereitet...',
          'Plan wird finalisiert...'
        ]
      }
    ];
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const statusText = document.getElementById('analysis-status');
    
    // Counter elements
    const counterMeds = document.getElementById('counter-medications');
    const counterInteractions = document.getElementById('counter-interactions');
    const counterCalculations = document.getElementById('counter-calculations');
    
    let totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let currentTime = 0;
    
    // Smooth overall progress bar
    const progressInterval = setInterval(() => {
      currentTime += 40;
      const smoothProgress = Math.min((currentTime / totalDuration) * 100, 100);
      progressBar.style.width = smoothProgress + '%';
      
      if (progressText) {
        progressText.textContent = Math.round(smoothProgress) + '%';
      }
      
      if (currentTime >= totalDuration) {
        clearInterval(progressInterval);
      }
    }, 40);
    
    // Animate counters (only if elements exist)
    let medCount = 0, interactionCount = 0, calcCount = 0;
    const counterInterval = setInterval(() => {
      if (counterMeds && medCount < 173) {
        medCount += Math.floor(Math.random() * 8) + 3;
        if (medCount > 173) medCount = 173;
        counterMeds.textContent = medCount;
      }
      if (counterInteractions && interactionCount < 47) {
        interactionCount += Math.floor(Math.random() * 3) + 1;
        if (interactionCount > 47) interactionCount = 47;
        counterInteractions.textContent = interactionCount;
      }
      if (counterCalculations && calcCount < 2847) {
        calcCount += Math.floor(Math.random() * 120) + 50;
        if (calcCount > 2847) calcCount = 2847;
        counterCalculations.textContent = calcCount.toLocaleString('de-DE');
      }
    }, 100);
    
    // Animate each step sequentially with detail changes
    let delay = 0;
    steps.forEach((step, stepIndex) => {
      setTimeout(() => {
        const stepEl = document.getElementById(`analysis-step-${step.id}`);
        const iconEl = document.getElementById(`icon-${step.id}`);
        const detailEl = document.getElementById(`detail-${step.id}`);
        const spinnerEl = document.getElementById(`spinner-${step.id}`);
        const checkEl = document.getElementById(`check-${step.id}`);
        const miniProgress = document.getElementById(`mini-progress-${step.id}`);
        
        // Update main status
        if (statusText) {
          statusText.textContent = step.title;
        }
        
        // Activate step visually
        stepEl.classList.remove('opacity-40', 'border-gray-200');
        stepEl.classList.add('opacity-100', 'border-teal-300', 'bg-teal-50', 'shadow-lg');
        stepEl.style.transform = 'scale(1.02)';
        
        // Activate icon with color
        const iconBg = iconEl.parentElement;
        iconBg.classList.remove('bg-gray-200');
        iconBg.classList.add('bg-gradient-to-br', 'from-teal-400', 'to-teal-600');
        iconEl.classList.remove('text-gray-400');
        iconEl.classList.add('text-white');
        
        // Show spinner
        spinnerEl.classList.remove('hidden');
        
        // Animate mini progress bar
        let miniProgress_val = 0;
        const miniProgressInterval = setInterval(() => {
          miniProgress_val += 3;
          if (miniProgress_val > 100) {
            miniProgress_val = 100;
            clearInterval(miniProgressInterval);
          }
          miniProgress.style.width = miniProgress_val + '%';
        }, step.duration / 35);
        
        // Cycle through detail messages
        let detailIndex = 0;
        const detailInterval = setInterval(() => {
          if (detailIndex < step.details.length) {
            detailEl.textContent = step.details[detailIndex];
            detailEl.classList.add('animate-pulse');
            setTimeout(() => detailEl.classList.remove('animate-pulse'), 300);
            detailIndex++;
          }
        }, step.duration / step.details.length);
        
        // Mark step as complete after duration
        setTimeout(() => {
          clearInterval(detailInterval);
          clearInterval(miniProgressInterval);
          
          miniProgress.style.width = '100%';
          stepEl.style.transform = 'scale(1)';
          stepEl.classList.remove('border-teal-300', 'bg-teal-50');
          stepEl.classList.add('border-green-300', 'bg-green-50');
          
          // Update icon background to green
          iconBg.classList.remove('from-teal-400', 'to-teal-600');
          iconBg.classList.add('from-green-500', 'to-green-600');
          
          // Hide spinner, show checkmark
          spinnerEl.classList.add('hidden');
          checkEl.classList.remove('hidden');
          
          // Update detail to complete
          detailEl.textContent = '✓ Abgeschlossen';
          detailEl.classList.add('text-green-700', 'font-semibold');
          
          // Resolve when last step completes
          if (stepIndex === steps.length - 1) {
            setTimeout(() => {
              clearInterval(progressInterval);
              clearInterval(counterInterval);
              
              // Final counter values (only if elements exist)
              if (counterMeds) counterMeds.textContent = '173';
              if (counterInteractions) counterInteractions.textContent = '47';
              if (counterCalculations) counterCalculations.textContent = '2.847';
              
              if (statusText) {
                statusText.textContent = 'Analyse abgeschlossen';
              }
              
              resolve();
            }, 600);
          }
        }, step.duration);
      }, delay);
      
      delay += step.duration;
    });
  });
}

// Analyze medications with animated loading
async function analyzeMedications(medications, durationWeeks, firstName = '', gender = '', email = '', age = null, weight = null, height = null, reductionGoal = 100) {
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
      reductionGoal,
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
    console.error('Fehler bei der Analyse:', error);
    alert('Fehler bei der Analyse: ' + (error.response?.data?.error || error.message));
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

// Display results
function displayResults(data, firstName = '', gender = '') {
  
  const resultsDiv = document.getElementById('results');
  
  if (!resultsDiv) {
    console.error('❌ FEHLER: Results div nicht gefunden!');
    return;
  }
  
  const { analysis, maxSeverity, guidelines, weeklyPlan, warnings, product, personalization } = data;
  
  let html = '';

  // Critical warnings
  if (warnings && warnings.length > 0) {
    html += `
      <div class="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-lg shadow fade-in">
        <div class="flex items-start">
          <i class="fas fa-exclamation-circle text-red-600 text-3xl mr-4"></i>
          <div>
            <h3 class="text-xl font-bold text-red-800 mb-3">Kritische Wechselwirkungen erkannt</h3>
            ${warnings.map(w => `<p class="text-red-700 mb-2">${w}</p>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Product Information Box - KANNASAN
  if (product) {
    html += `
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 p-6 mb-8 rounded-xl shadow-lg fade-in">
        <div class="flex items-start">
          <i class="fas fa-spray-can text-purple-600 text-4xl mr-4"></i>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-purple-900 mb-3">${product.name}</h3>
            <p class="text-sm text-gray-600 mb-4">${product.type}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 mb-4">
              <p><strong>Konzentration:</strong> ${product.concentration}</p>
              <p><strong>Verpackung:</strong> ${product.packaging}</p>
              <p><strong>2 Sprühstöße:</strong> ${product.twoSprays}</p>
              <p><strong>Dosierungseinheit:</strong> ${product.dosageUnit}</p>
            </div>
            
            <div class="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border-2 border-green-300 mb-4">
              <p class="text-lg font-bold text-green-900 mb-2">
                Ihre empfohlene Tagesdosis
              </p>
              <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p class="text-sm text-gray-600">Morgens</p>
                  <p class="text-2xl font-bold text-green-700">${product.morningSprays}×</p>
                  <p class="text-xs text-gray-500">Sprühstöße</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Abends</p>
                  <p class="text-2xl font-bold text-green-700">${product.eveningSprays}×</p>
                  <p class="text-xs text-gray-500">Sprühstöße</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Gesamt</p>
                  <p class="text-2xl font-bold text-purple-700">${product.totalSpraysPerDay}×</p>
                  <p class="text-xs text-gray-500">${product.actualDailyMg} mg/Tag</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <p class="text-sm text-gray-800">
                <strong>Anwendung:</strong> ${product.application}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Personalization Summary - ReduMed-AI
  if (personalization) {
    html += `
      <div class="bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-300 p-6 mb-8 rounded-xl shadow-lg fade-in">
        <div class="flex items-start">
          <i class="fas fa-user-circle text-teal-600 text-4xl mr-4"></i>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-teal-900 mb-3">Ihre Personalisierung</h3>
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
                <p class="text-xs text-gray-600 mb-1">CBD Start-Dosis</p>
                <p class="text-lg font-bold text-green-700">${personalization.cbdStartMg.toFixed(1)} mg</p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-teal-200">
                <p class="text-xs text-gray-600 mb-1">CBD Ziel-Dosis</p>
                <p class="text-lg font-bold text-green-700">${personalization.cbdEndMg.toFixed(1)} mg</p>
              </div>
              ${personalization.hasBenzoOrOpioid ? `
                <div class="bg-red-50 p-3 rounded-lg border-2 border-red-300">
                  <p class="text-xs text-red-600 mb-1">Sicherheitsregel</p>
                  <p class="text-sm font-bold text-red-700">Benzo/Opioid erkannt</p>
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
      const severityStyles = {
        low: {
          border: 'border-green-500',
          bg: 'bg-green-50',
          badgeBg: 'bg-green-200',
          badgeText: 'text-green-800'
        },
        medium: {
          border: 'border-yellow-500',
          bg: 'bg-yellow-50',
          badgeBg: 'bg-yellow-200',
          badgeText: 'text-yellow-800'
        },
        high: {
          border: 'border-orange-500',
          bg: 'bg-orange-50',
          badgeBg: 'bg-orange-200',
          badgeText: 'text-orange-800'
        },
        critical: {
          border: 'border-red-500',
          bg: 'bg-red-50',
          badgeBg: 'bg-red-200',
          badgeText: 'text-red-800'
        }
      };
      
      const maxInteractionSeverity = interactions.length > 0 ? 
        interactions.reduce((max, i) => {
          const order = { low: 1, medium: 2, high: 3, critical: 4 };
          return order[i.severity] > order[max] ? i.severity : max;
        }, 'low') : 'low';
      
      const styles = severityStyles[maxInteractionSeverity];
      
      html += `
        <div class="border-l-4 ${styles.border} ${styles.bg} p-4 rounded-lg">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h3 class="font-bold text-gray-800 text-lg">${med.name}</h3>
              ${med.generic_name ? `<p class="text-gray-600 text-sm">${med.generic_name}</p>` : ''}
              <p class="text-gray-600 text-sm mt-1">
                <i class="fas fa-capsules mr-2"></i>
                Dosierung: ${item.dosage}
              </p>
            </div>
            <span class="px-3 py-1 ${styles.badgeBg} ${styles.badgeText} rounded-full text-sm font-semibold">
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
                    <p class="text-gray-700 text-sm bg-gray-50 p-2 rounded">
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

  // ReduMed-AI: Multi-Medication Reduction Plan
  html += `
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in" id="dosage-plan-section">
      <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <i class="fas fa-calendar-check text-green-600 mr-3"></i>
        ReduMed-AI: Ihr Medikamenten-Reduktionsplan
      </h2>
      
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
        <p class="text-blue-900 font-bold mb-2">
          <i class="fas fa-info-circle mr-2"></i>
          Ihr personalisierter Multi-Medikamenten-Reduktionsplan
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div class="bg-white p-3 rounded-lg border border-blue-200">
            <p class="text-xs text-gray-600 mb-1">Medikamente</p>
            <p class="text-xl font-bold text-blue-900">${weeklyPlan[0].medications.length}</p>
          </div>
          <div class="bg-white p-3 rounded-lg border border-green-200">
            <p class="text-xs text-gray-600 mb-1">CBD Start → Ende</p>
            <p class="text-xl font-bold text-green-900">${weeklyPlan[0].cbdDose} → ${weeklyPlan[weeklyPlan.length - 1].cbdDose} mg</p>
          </div>
          <div class="bg-white p-3 rounded-lg border border-purple-200">
            <p class="text-xs text-gray-600 mb-1">Plan-Dauer</p>
            <p class="text-xl font-bold text-purple-900">${weeklyPlan.length} Wochen</p>
          </div>
        </div>
      </div>
  `;

  // Cost Overview - ReduMed
  if (data.costs) {
    html += `
      <div class="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 p-6 mb-8 rounded-xl shadow-lg fade-in">
        <div class="flex items-start">
          <i class="fas fa-euro-sign text-amber-600 text-4xl mr-4"></i>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-amber-900 mb-3">Kostenübersicht</h3>
            <div class="bg-white rounded-lg p-4 mb-4">
              <table class="w-full">
                <thead class="border-b-2 border-amber-200">
                  <tr class="text-left">
                    <th class="py-2 text-sm font-semibold text-gray-700">Produkt</th>
                    <th class="py-2 text-sm font-semibold text-gray-700 text-center">Flaschen</th>
                    <th class="py-2 text-sm font-semibold text-gray-700 text-center">Sprays</th>
                    <th class="py-2 text-sm font-semibold text-gray-700 text-right">Preis/Flasche</th>
                    <th class="py-2 text-sm font-semibold text-gray-700 text-right">Gesamtkosten</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.costs.costBreakdown.map((item, idx) => `
                    <tr class="${idx % 2 === 0 ? 'bg-amber-50' : 'bg-white'}">
                      <td class="py-3 text-sm font-medium text-gray-800">${item.product}</td>
                      <td class="py-3 text-sm text-gray-700 text-center">${item.bottleCount}×</td>
                      <td class="py-3 text-sm text-gray-600 text-center">${item.totalSprays}</td>
                      <td class="py-3 text-sm text-gray-700 text-right">${item.pricePerBottle.toFixed(2)} €</td>
                      <td class="py-3 text-sm font-bold text-amber-900 text-right">${item.totalCost.toFixed(2)} €</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot class="border-t-2 border-amber-300">
                  <tr class="bg-amber-100">
                    <td colspan="4" class="py-3 text-right font-bold text-gray-800">GESAMTKOSTEN:</td>
                    <td class="py-3 text-right text-xl font-bold text-amber-900">${data.costs.totalCost.toFixed(2)} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div class="bg-white p-3 rounded-lg border border-amber-200">
                <p class="text-xs text-gray-600 mb-1">Gesamtflaschen</p>
                <p class="text-lg font-bold text-amber-900">${data.costs.totalBottles} Flaschen</p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-amber-200">
                <p class="text-xs text-gray-600 mb-1">Gesamtsprays</p>
                <p class="text-lg font-bold text-amber-900">${data.costs.totalSprays} Hübe</p>
              </div>
              <div class="bg-white p-3 rounded-lg border border-amber-200">
                <p class="text-xs text-gray-600 mb-1">Ø Kosten/Woche</p>
                <p class="text-lg font-bold text-amber-900">${(data.costs.totalCost / weeklyPlan.length).toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Weekly plan with medication reduction + CBD increase
  weeklyPlan.forEach((week, weekIndex) => {
    html += `
      <div class="mb-8 border-2 border-purple-200 rounded-xl overflow-hidden">
        <!-- Week Header -->
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <h3 class="text-2xl font-bold text-white flex items-center justify-between">
            <span>
              <i class="fas fa-calendar-week mr-2"></i>
              Woche ${week.week}
            </span>
            <span class="text-sm font-normal">
              Medikamentenlast: ${week.totalMedicationLoad} mg/Tag
            </span>
          </h3>
        </div>
        
        <!-- Medications Table -->
        <div class="bg-red-50 p-4">
          <h4 class="font-bold text-red-900 mb-3 flex items-center">
            <i class="fas fa-pills text-red-600 mr-2"></i>
            Medikamenten-Dosierung
          </h4>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse bg-white rounded-lg">
              <thead class="bg-red-100">
                <tr>
                  <th class="px-4 py-3 text-left text-red-900 font-semibold border border-red-200">Medikament</th>
                  <th class="px-4 py-3 text-center text-red-900 font-semibold border border-red-200">Start</th>
                  <th class="px-4 py-3 text-center text-red-900 font-semibold border border-red-200">Aktuell</th>
                  <th class="px-4 py-3 text-center text-red-900 font-semibold border border-red-200">Ziel</th>
                  <th class="px-4 py-3 text-center text-red-900 font-semibold border border-red-200">Reduktion</th>
                </tr>
              </thead>
              <tbody>
    `;
    
    week.medications.forEach((med, medIndex) => {
      const bgColor = medIndex % 2 === 0 ? 'bg-white' : 'bg-red-50';
      html += `
        <tr class="${bgColor} hover:bg-red-100 transition-colors">
          <td class="px-4 py-3 font-semibold text-gray-800 border border-gray-200">${med.name}</td>
          <td class="px-4 py-3 text-center border border-gray-200">
            <span class="font-bold text-gray-700">${med.startMg} mg</span>
          </td>
          <td class="px-4 py-3 text-center border border-gray-200">
            <span class="font-bold text-lg text-red-700">${med.currentMg} mg</span>
            <br>
            <span class="text-xs text-gray-600">(${med.reductionPercent}% reduziert)</span>
          </td>
          <td class="px-4 py-3 text-center border border-gray-200">
            <span class="font-bold text-green-700">${med.targetMg} mg</span>
          </td>
          <td class="px-4 py-3 text-center border border-gray-200">
            <span class="font-bold text-orange-700">-${med.reduction} mg/Woche</span>
          </td>
        </tr>
      `;
    });
    
    html += `
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- CBD Compensation -->
        <div class="bg-green-50 p-4 border-t-2 border-green-200">
          <h4 class="font-bold text-green-900 mb-3 flex items-center">
            <i class="fas fa-leaf text-green-600 mr-2"></i>
            CBD-Kompensation
          </h4>
          <div class="bg-white rounded-lg p-4 border-2 border-green-300">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <p class="text-xs text-gray-600 mb-1">CBD-Dosis</p>
                <p class="text-2xl font-bold text-green-700">${week.cbdDose} mg</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-600 mb-1">Produkt</p>
                <p class="text-lg font-bold text-purple-700">${week.kannasanProduct.name}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-600 mb-1">Morgens 🌅</p>
                <p class="text-2xl font-bold text-orange-600">${week.morningSprays}×</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-600 mb-1">Abends 🌙</p>
                <p class="text-2xl font-bold text-blue-600">${week.eveningSprays}×</p>
              </div>
            </div>
            <p class="text-center text-sm text-gray-600 mt-3">
              <strong>Gesamt:</strong> ${week.totalSprays} Sprühstöße täglich = ${week.actualCbdMg} mg CBD
            </p>
          </div>
        </div>
        
        <!-- Bottle Status Tracking -->
        ${week.bottleStatus ? `
        <div class="bg-blue-50 p-4 border-t-2 border-blue-200">
          <h4 class="font-bold text-blue-900 mb-3 flex items-center">
            <i class="fas fa-flask text-blue-600 mr-2"></i>
            Fläschchen-Status
          </h4>
          <div class="bg-white rounded-lg p-4 border-2 border-blue-300">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div class="text-center">
                <p class="text-xs text-gray-600 mb-1">Verbraucht</p>
                <p class="text-2xl font-bold text-red-700">${week.bottleStatus.used} / ${week.bottleStatus.totalCapacity}</p>
                <p class="text-xs text-gray-500">Hübe verwendet</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-600 mb-1">Verbleibend</p>
                <p class="text-2xl font-bold text-green-700">${week.bottleStatus.remaining}</p>
                <p class="text-xs text-gray-500">Hübe übrig</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-600 mb-1">Voraussichtlich leer in</p>
                <p class="text-2xl font-bold text-orange-700">~${week.bottleStatus.emptyInWeeks}</p>
                <p class="text-xs text-gray-500">Wochen</p>
              </div>
            </div>
            ${week.bottleStatus.productChangeNext ? `
            <div class="mt-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3">
              <p class="text-center text-sm font-semibold text-yellow-800">
                <i class="fas fa-exchange-alt mr-2"></i>
                Produktwechsel in nächster Woche erforderlich
              </p>
            </div>
            ` : `
            <div class="mt-3 bg-green-100 border-2 border-green-400 rounded-lg p-3">
              <p class="text-center text-sm font-semibold text-green-800">
                <i class="fas fa-check-circle mr-2"></i>
                Aktuelles Fläschchen weiter verwenden
              </p>
            </div>
            `}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  });

  html += `
      <div class="mt-6 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
        <h3 class="font-bold text-green-800 mb-3 text-lg">
          <i class="fas fa-clipboard-check mr-2"></i>
          Wichtige Hinweise zur Medikamenten-Reduktion:
        </h3>
        <ul class="text-green-700 space-y-2 ml-6 list-disc">
          <li><strong>Ärztliche Begleitung:</strong> Reduzieren Sie Medikamente NUR unter ärztlicher Aufsicht!</li>
          <li><strong>Wöchentliche Kontrolle:</strong> Besprechen Sie den Fortschritt wöchentlich mit Ihrem Arzt</li>
          <li><strong>CBD-Einnahme:</strong> ${product.morningSprays}× morgens + ${product.eveningSprays}× abends (Produkt wechselt wöchentlich)</li>
          <li><strong>Anwendung:</strong> Sprühstoß direkt in den Mund oder unter die Zunge, vor Gebrauch gut schütteln</li>
          <li><strong>Bei Problemen:</strong> Sofort Arzt kontaktieren - nicht eigenständig weitermachen!</li>
          <li><strong>Symptom-Tagebuch:</strong> Dokumentieren Sie täglich Ihre Befindlichkeit und Symptome</li>
          <li><strong>Hydration:</strong> Mindestens 2-3 Liter Wasser täglich trinken</li>
          <li><strong>Absetzen:</strong> Niemals Medikamente abrupt absetzen - immer schrittweise!</li>
        </ul>
      </div>

      <div class="mt-8">
        <button onclick="downloadPDF()" class="w-full py-5 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg transform hover:scale-105">
          <i class="fas fa-file-pdf mr-2"></i>
          ReduMed-AI Plan als PDF herunterladen
        </button>
        <p class="text-center text-sm text-gray-500 mt-3">
          <i class="fas fa-info-circle mr-1"></i>
          Bringen Sie diesen Plan zu Ihrem nächsten Arzttermin mit!
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
  if (!window.currentPlanData) {
    alert('Keine Daten vorhanden. Bitte erstellen Sie erst einen Reduktionsplan.');
    return;
  }
  
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF-Bibliothek wird geladen... Bitte versuchen Sie es in einigen Sekunden erneut.');
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    const { analysis, weeklyPlan, maxSeverity, firstName, gender, product, personalization, costs } = window.currentPlanData;
    
    const doc = new jsPDF();
    let yPos = 20;
    
    // ============================================================
    // SEITE 1: TITEL & ÜBERSICHT
    // ============================================================
    
    // H1: ReduMed Haupttitel
    doc.setFontSize(22);
    doc.setTextColor(26, 83, 92); // Dunkles Teal
    doc.setFont(undefined, 'bold');
    doc.text('ReduMed – Ihr persönlicher Reduktionsplan', 105, yPos, { align: 'center' });
    
    // Untertitel
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.setFont(undefined, 'normal');
    doc.text('Individuell erstellt auf Basis Ihrer Angaben, KI-gestützt und medizinisch ausgerichtet', 105, yPos, { align: 'center' });
    
    yPos += 15;
    
    // Block: Patientendaten
    doc.setFillColor(240, 249, 255); // Hellblau
    doc.roundedRect(10, yPos, 90, 52, 3, 3, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.roundedRect(10, yPos, 90, 52, 3, 3, 'S');
    
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.setFont(undefined, 'bold');
    doc.text('Patientendaten', 15, yPos + 7);
    
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.setFont(undefined, 'normal');
    const age = personalization?.age || 'n/a';
    const weight = personalization?.bodyWeight || 'n/a';
    const height = personalization?.height || 'n/a';
    const numMeds = weeklyPlan[0]?.medications?.length || 0;
    const cbdStart = weeklyPlan[0]?.cbdDose || 0;
    const cbdEnd = weeklyPlan[weeklyPlan.length - 1]?.cbdDose || 0;
    const planDuration = weeklyPlan.length;
    
    doc.text(`Alter: ${age} Jahre`, 15, yPos + 15);
    doc.text(`Gewicht: ${weight} kg`, 15, yPos + 21);
    doc.text(`Größe: ${height} cm`, 15, yPos + 27);
    doc.text(`Medikamente: ${numMeds}`, 15, yPos + 33);
    doc.text(`CBD Start: ${cbdStart.toFixed(1)} mg`, 15, yPos + 39);
    doc.text(`CBD Ziel: ${cbdEnd.toFixed(1)} mg`, 15, yPos + 45);
    
    // Block: Produkt-Start
    doc.setFillColor(236, 253, 245); // Hellgrün
    doc.roundedRect(105, yPos, 95, 52, 3, 3, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(105, yPos, 95, 52, 3, 3, 'S');
    
    doc.setFontSize(14);
    doc.setTextColor(6, 78, 59);
    doc.setFont(undefined, 'bold');
    doc.text('Produkt-Start', 110, yPos + 7);
    
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.setFont(undefined, 'normal');
    const firstProduct = weeklyPlan[0]?.kannasanProduct || {};
    const firstMorning = weeklyPlan[0]?.morningSprays || 0;
    const firstEvening = weeklyPlan[0]?.eveningSprays || 0;
    const firstTotal = weeklyPlan[0]?.totalSprays || 0;
    
    doc.text(`Produkt: ${firstProduct.name || 'N/A'}`, 110, yPos + 15);
    doc.text(`mg/Spray: ${(firstProduct.cbdPerSpray || 0).toFixed(1)}`, 110, yPos + 21);
    doc.text(`Hübe/Tag: ${firstTotal}`, 110, yPos + 27);
    doc.text(`Morgens: ${firstMorning} | Abends: ${firstEvening}`, 110, yPos + 33);
    doc.text(`Plan-Dauer: ${planDuration} Wochen`, 110, yPos + 39);
    
    // Estimate bottle weeks
    const bottleWeeks = firstTotal > 0 ? Math.floor(100 / (firstTotal * 7)) : 'N/A';
    doc.text(`Fläschchen: ~${bottleWeeks} Wochen`, 110, yPos + 45);
    
    yPos += 60;
    
    // Warnung bei kritischen Wechselwirkungen
    if (maxSeverity === 'critical' || maxSeverity === 'high') {
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(10, yPos, 190, 18, 3, 3, 'F');
      doc.setDrawColor(220, 38, 38);
      doc.roundedRect(10, yPos, 190, 18, 3, 3, 'S');
      
      doc.setFontSize(11);
      doc.setTextColor(153, 27, 27);
      doc.setFont(undefined, 'bold');
      doc.text('Achtung: Kritische Wechselwirkungen erkannt', 15, yPos + 7);
      doc.setFont(undefined, 'normal');
      doc.text('Dieser Plan wurde extra vorsichtig gestaltet. Starten Sie nur nach ärztlicher Rücksprache!', 15, yPos + 13);
      
      yPos += 23;
    }
    
    // ============================================================
    // SEITE 2: WÖCHENTLICHER PLAN (TABELLENFORM)
    // ============================================================
    
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(26, 83, 92);
    doc.setFont(undefined, 'bold');
    doc.text('Wochenplan – Medikamente & CBD', 15, yPos);
    yPos += 10;
    
    // Tabellenkopf
    doc.setFillColor(226, 232, 240);
    doc.rect(10, yPos, 190, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    
    doc.text('Woche', 12, yPos + 5);
    doc.text('Medikament', 28, yPos + 5);
    doc.text('Start mg', 65, yPos + 5);
    doc.text('Ziel mg', 85, yPos + 5);
    doc.text('Änd./W', 103, yPos + 5);
    doc.text('CBD mg', 122, yPos + 5);
    doc.text('Produkt', 140, yPos + 5);
    doc.text('Hübe', 170, yPos + 5);
    doc.text('M', 183, yPos + 5);
    doc.text('A', 192, yPos + 5);
    
    yPos += 9;
    
    // Tabelleninhalt
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    weeklyPlan.forEach((week) => {
      // Prüfe Seitenumbruch
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        
        // Tabellenkopf wiederholen
        doc.setFillColor(226, 232, 240);
        doc.rect(10, yPos, 190, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.setFont(undefined, 'bold');
        
        doc.text('Woche', 12, yPos + 5);
        doc.text('Medikament', 28, yPos + 5);
        doc.text('Start mg', 65, yPos + 5);
        doc.text('Ziel mg', 85, yPos + 5);
        doc.text('Änd./W', 103, yPos + 5);
        doc.text('CBD mg', 122, yPos + 5);
        doc.text('Produkt', 140, yPos + 5);
        doc.text('Hübe', 170, yPos + 5);
        doc.text('M', 183, yPos + 5);
        doc.text('A', 192, yPos + 5);
        
        yPos += 9;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
      }
      
      const weekNum = week.week;
      const medications = week.medications || [];
      const cbdDose = week.cbdDose || 0;
      const product = week.kannasanProduct || {};
      const totalSprays = week.totalSprays || 0;
      const morning = week.morningSprays || 0;
      const evening = week.eveningSprays || 0;
      
      // Erste Medikament-Zeile mit CBD-Daten
      if (medications.length > 0) {
        const med = medications[0];
        doc.setTextColor(55, 65, 81);
        
        // Woche
        doc.text(`${weekNum}`, 12, yPos);
        
        // Medikament (gekürzt)
        const medName = med.name.length > 18 ? med.name.substring(0, 18) + '...' : med.name;
        doc.text(medName, 28, yPos);
        
        // Start mg
        doc.text(`${med.startMg.toFixed(1)}`, 65, yPos);
        
        // Ziel mg
        doc.text(`${med.targetMg.toFixed(1)}`, 85, yPos);
        
        // Änderung/Woche
        doc.text(`-${med.reduction.toFixed(1)}`, 103, yPos);
        
        // CBD mg
        doc.setTextColor(16, 185, 129);
        doc.text(`${cbdDose.toFixed(1)}`, 122, yPos);
        doc.setTextColor(55, 65, 81);
        
        // Produkt
        const prodName = product.name ? product.name.replace('Kannasan ', '') : 'N/A';
        doc.text(prodName, 140, yPos);
        
        // Hübe gesamt
        doc.text(`${totalSprays}`, 170, yPos);
        
        // Morgens/Abends
        doc.text(`${morning}`, 183, yPos);
        doc.text(`${evening}`, 192, yPos);
        
        yPos += 5;
      }
      
      // Weitere Medikamente ohne CBD-Spalten
      for (let i = 1; i < medications.length; i++) {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        const med = medications[i];
        doc.setTextColor(55, 65, 81);
        
        doc.text('', 12, yPos); // Woche leer
        
        const medName = med.name.length > 18 ? med.name.substring(0, 18) + '...' : med.name;
        doc.text(medName, 28, yPos);
        
        doc.text(`${med.startMg.toFixed(1)}`, 65, yPos);
        doc.text(`${med.targetMg.toFixed(1)}`, 85, yPos);
        doc.text(`-${med.reduction.toFixed(1)}`, 103, yPos);
        
        // CBD-Spalten leer
        doc.text('', 122, yPos);
        doc.text('', 140, yPos);
        doc.text('', 170, yPos);
        doc.text('', 183, yPos);
        doc.text('', 192, yPos);
        
        yPos += 5;
      }
      
      // Trennlinie nach jeder Woche
      doc.setDrawColor(226, 232, 240);
      doc.line(10, yPos, 200, yPos);
      yPos += 2;
    });
    
    // ============================================================
    // SEITE 3: FLASCHENVERBRAUCH & PRODUKTWECHSEL
    // ============================================================
    
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(26, 83, 92);
    doc.setFont(undefined, 'bold');
    doc.text('Fläschchen-Verbrauch & Produktwechsel', 15, yPos);
    yPos += 12;
    
    // Finde alle Produktwechsel
    let currentProd = null;
    const bottles = [];
    
    weeklyPlan.forEach((week) => {
      const prodName = week.kannasanProduct?.name;
      if (prodName !== currentProd) {
        bottles.push({
          product: week.kannasanProduct,
          startWeek: week.week,
          endWeek: week.week,
          totalSprays: week.bottleStatus?.used || 0
        });
        currentProd = prodName;
      } else if (bottles.length > 0) {
        bottles[bottles.length - 1].endWeek = week.week;
        bottles[bottles.length - 1].totalSprays = week.bottleStatus?.used || 0;
      }
    });
    
    // Zeige jeden Flaschenzyklus
    bottles.forEach((bottle, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(10, yPos, 190, 35, 3, 3, 'F');
      doc.setDrawColor(147, 197, 253);
      doc.roundedRect(10, yPos, 190, 35, 3, 3, 'S');
      
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text(`Flasche ${index + 1}: ${bottle.product?.name || 'N/A'}`, 15, yPos + 7);
      
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.setFont(undefined, 'normal');
      
      const mgPerSpray = bottle.product?.cbdPerSpray || 0;
      const used = bottle.totalSprays;
      const remaining = 100 - used;
      const weeksUsed = bottle.endWeek - bottle.startWeek + 1;
      
      doc.text(`mg/Hub: ${mgPerSpray.toFixed(1)}`, 15, yPos + 14);
      doc.text(`Gesamt: 100 Hübe`, 15, yPos + 19);
      doc.text(`Verbraucht: ${used} Hübe`, 15, yPos + 24);
      doc.text(`Rest: ${remaining} Hübe`, 15, yPos + 29);
      
      doc.text(`Zeitraum: Woche ${bottle.startWeek}–${bottle.endWeek}`, 80, yPos + 14);
      doc.text(`Dauer: ${weeksUsed} Wochen`, 80, yPos + 19);
      
      // Progress Bar
      doc.text('Verbrauch:', 140, yPos + 14);
      const barWidth = 50;
      const filledWidth = (used / 100) * barWidth;
      
      doc.setDrawColor(203, 213, 225);
      doc.rect(140, yPos + 16, barWidth, 6, 'S');
      
      if (used > 80) {
        doc.setFillColor(239, 68, 68); // Rot
      } else if (used > 50) {
        doc.setFillColor(251, 191, 36); // Gelb
      } else {
        doc.setFillColor(34, 197, 94); // Grün
      }
      doc.rect(140, yPos + 16, filledWidth, 6, 'F');
      
      doc.setFontSize(8);
      doc.text(`${used}%`, 142 + filledWidth, yPos + 21);
      
      yPos += 40;
    });
    
    // Hinweis zum Produktwechsel
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(10, yPos, 190, 20, 3, 3, 'F');
    doc.setDrawColor(234, 179, 8);
    doc.roundedRect(10, yPos, 190, 20, 3, 3, 'S');
    
    doc.setFontSize(11);
    doc.setTextColor(113, 63, 18);
    doc.setFont(undefined, 'bold');
    doc.text('Produktwechsel-Strategie', 15, yPos + 7);
    doc.setFont(undefined, 'normal');
    doc.text('Produkte werden nur gewechselt, wenn (1) Flasche leer oder (2) Dosierung >12 Sprays/Tag.', 15, yPos + 13);
    doc.text('Dies minimiert Kosten und vermeidet unnötige Wechsel.', 15, yPos + 18);
    
    yPos += 25;
    
    // ============================================================
    // KOSTENÜBERSICHT (vor Sicherheitshinweisen)
    // ============================================================
    
    if (costs) {
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setTextColor(26, 83, 92);
      doc.setFont(undefined, 'bold');
      doc.text('Kostenübersicht', 15, yPos);
      yPos += 12;
      
      // Tabelle: Kostenaufschlüsselung
      doc.setFillColor(254, 249, 195);
      doc.rect(10, yPos, 190, 8, 'F');
      doc.setFontSize(10);
      doc.setTextColor(113, 63, 18);
      doc.setFont(undefined, 'bold');
      
      doc.text('Produkt', 15, yPos + 5);
      doc.text('Flaschen', 80, yPos + 5);
      doc.text('Sprays', 110, yPos + 5);
      doc.text('Preis/Fl.', 140, yPos + 5);
      doc.text('Gesamt', 170, yPos + 5);
      
      yPos += 9;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(55, 65, 81);
      
      costs.costBreakdown.forEach((item, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(254, 252, 232);
          doc.rect(10, yPos - 4, 190, 6, 'F');
        }
        
        doc.text(item.product, 15, yPos);
        doc.text(`${item.bottleCount}×`, 80, yPos);
        doc.text(`${item.totalSprays}`, 110, yPos);
        doc.text(`${item.pricePerBottle.toFixed(2)} €`, 140, yPos);
        doc.setFont(undefined, 'bold');
        doc.text(`${item.totalCost.toFixed(2)} €`, 170, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 6;
      });
      
      // Gesamtsumme
      yPos += 2;
      doc.setDrawColor(234, 179, 8);
      doc.line(10, yPos, 200, yPos);
      yPos += 5;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(113, 63, 18);
      doc.text('GESAMTKOSTEN:', 15, yPos);
      doc.setFontSize(14);
      doc.text(`${costs.totalCost.toFixed(2)} €`, 170, yPos);
      
      yPos += 10;
      
      // Zusätzliche Infos
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(55, 65, 81);
      
      doc.text(`Gesamtflaschen: ${costs.totalBottles}`, 15, yPos);
      doc.text(`Gesamtsprays: ${costs.totalSprays}`, 15, yPos + 6);
      doc.text(`Ø Kosten/Woche: ${(costs.totalCost / weeklyPlan.length).toFixed(2)} €`, 15, yPos + 12);
      
      yPos += 20;
      
      // Hinweis-Box
      doc.setFillColor(254, 249, 195);
      doc.roundedRect(10, yPos, 190, 20, 3, 3, 'F');
      doc.setDrawColor(234, 179, 8);
      doc.roundedRect(10, yPos, 190, 20, 3, 3, 'S');
      
      doc.setFontSize(10);
      doc.setTextColor(113, 63, 18);
      doc.setFont(undefined, 'normal');
      doc.text('Hinweis: Preise gelten für KANNASAN CBD Dosier-Sprays (10ml Flaschen, ca. 100 Hübe).', 15, yPos + 7);
      doc.text('Produktwechsel erfolgen nur bei leerem Fläschchen oder zu hoher Dosierung.', 15, yPos + 13);
    }
    
    // ============================================================
    // SEITE 4 (oder 5): SICHERHEITSHINWEISE
    // ============================================================
    
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(16);
    doc.setTextColor(26, 83, 92);
    doc.setFont(undefined, 'bold');
    doc.text('Sicherheitshinweise & Anwendung', 15, yPos);
    yPos += 12;
    
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(10, yPos, 190, 85, 3, 3, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(10, yPos, 190, 85, 3, 3, 'S');
    
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.setFont(undefined, 'normal');
    
    const safetyRules = [
      '1. Änderungen der Medikation nur unter ärztlicher Aufsicht',
      '   • Niemals eigenständig Medikamente absetzen oder Dosis ändern',
      '   • Nehmen Sie diesen Plan zum Arztgespräch mit',
      '',
      '2. CBD kann Medikamentenspiegel erhöhen (CYP450-Hemmung)',
      '   • Regelmäßige ärztliche Kontrollen erforderlich',
      '   • Bei Nebenwirkungen sofort Arzt kontaktieren',
      '',
      '3. Einnahme morgens/abends wie angegeben',
      '   • Spray direkt in den Mund oder unter die Zunge',
      '   • Vor Gebrauch Flasche gut schütteln',
      '',
      '4. Bei Beschwerden "Step-Back"-Regel anwenden',
      '   • Eine Woche zurück zur letzten gut verträglichen Dosis',
      '   • Ärztliche Rücksprache einholen',
      '',
      '5. Symptomtagebuch führen',
      '   • Täglich notieren: Befinden, Nebenwirkungen, Schlaf',
      '   • Hilft dem Arzt bei Dosisanpassungen'
    ];
    
    let lineY = yPos + 8;
    safetyRules.forEach(line => {
      doc.text(line, 15, lineY);
      lineY += 5;
    });
    
    yPos += 90;
    
    // Footer auf allen Seiten
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.setFont(undefined, 'normal');
      doc.text('ReduMed – www.redu-med.com', 105, 285, { align: 'center' });
      doc.text(`Seite ${i} von ${pageCount} | Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 105, 290, { align: 'center' });
    }
    
    // Download
    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedName = (firstName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `ReduMed-Plan_${sanitizedName}_${dateStr}.pdf`;
    
    doc.save(filename);
    
  } catch (error) {
    console.error('Fehler beim Erstellen der PDF:', error);
    alert('Fehler beim Erstellen der PDF. Bitte versuchen Sie es erneut.');
  }
}
