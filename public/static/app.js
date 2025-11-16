// KANNASAN Product Data - CBD Dosier-Sprays (for frontend calculations)
const KANNASAN_PRODUCTS = [
  { nr: 5,  cbdPerSpray: 5.8,  name: 'Kannasan Nr. 5',  price: 24.90 },
  { nr: 10, cbdPerSpray: 11.5, name: 'Kannasan Nr. 10', price: 39.90 },
  { nr: 15, cbdPerSpray: 17.5, name: 'Kannasan Nr. 15', price: 59.90 },
  { nr: 20, cbdPerSpray: 23.2, name: 'Kannasan Nr. 20', price: 79.90 },
  { nr: 25, cbdPerSpray: 29.0, name: 'Kannasan Nr. 25', price: 99.90 }
];

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
  inputGroup.style.cssText = 'margin-bottom: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%); border-radius: 12px; border: 2px solid #14b8a6; position: relative;';
  
  inputGroup.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h4 style="margin: 0; color: #0b7b6c; font-size: 1rem;">
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
      

      <!-- mg/Tag - PRIMARY INPUT (gleiche Farbe wie Medikamentenname, OHNE Dropdown-Pfeile) -->
      <div>
        <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
          Tagesdosis in mg
        </label>
        <input type="number" 
               name="medication_mg_per_day[]" 
               class="no-spinner-input"
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

// Create floating particles effect
function createParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;
  
  container.innerHTML = ''; // Clear existing particles
  
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2; // 2-6px (kleiner)
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const duration = Math.random() * 3 + 2; // 2-5s
    const delay = Math.random() * 2; // 0-2s
    
    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle, rgba(11,123,108,0.6), rgba(16,185,129,0.3));
      border-radius: 50%;
      left: ${startX}%;
      top: ${startY}%;
      animation: float ${duration}s ease-in-out ${delay}s infinite;
      pointer-events: none;
    `;
    
    container.appendChild(particle);
  }
}


// SIMPLIFIED Animate loading steps - works with new design HTML structure
function animateLoadingSteps() {
  return new Promise((resolve) => {
    console.log('🎬 Animation started');
    
    // Get DOM elements (only those that exist in new design)
    const statusText = document.getElementById('analysis-status');
    const statusDots = document.getElementById('status-dots');
    const progressCircle = document.getElementById('progress-circle');
    const centerPercentage = document.getElementById('center-percentage');
    const centerIcon = document.getElementById('center-icon');
    const counterMeds = document.getElementById('counter-medications');
    const counterInteractions = document.getElementById('counter-interactions');
    const counterCalculations = document.getElementById('counter-calculations');
    const planReadyMessage = document.getElementById('plan-ready-message');
    const showPlanButton = document.getElementById('show-plan-button');
    
    // Animation steps
    const steps = [
      { duration: 1800, title: 'Medikamenten-Datenbank durchsuchen', progress: 20 },
      { duration: 1600, title: 'Wechselwirkungen analysieren', progress: 40 },
      { duration: 1400, title: 'Körperdaten verarbeiten', progress: 60 },
      { duration: 1800, title: 'Dosierung berechnen', progress: 80 },
      { duration: 1600, title: 'Reduktionsplan erstellen', progress: 100 }
    ];
    
    const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
    let currentTime = 0;
    
    // Animated dots
    let dotCount = 0;
    const dotsInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      if (statusDots) statusDots.textContent = '.'.repeat(dotCount || 1);
    }, 500);
    
    // SVG circle animation (circumference = 2 * PI * r = 2 * PI * 70 = 440)
    const circumference = 440;
    
    // Execute steps sequentially
    let delay = 0;
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        console.log(`📍 Step ${index + 1}/${steps.length}: ${step.title}`);
        
        // Update status text
        if (statusText) {
          statusText.textContent = step.title;
        }
        
        // Animate progress over step duration
        const startProgress = index === 0 ? 0 : steps[index - 1].progress;
        const endProgress = step.progress;
        const startTime = Date.now();
        
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, startProgress + ((endProgress - startProgress) * elapsed / step.duration));
          
          // Update circle
          if (progressCircle) {
            const offset = circumference - (progress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
          }
          
          // Update percentage
          if (centerPercentage) {
            centerPercentage.textContent = Math.round(progress) + '%';
          }
          
          // Update counters (gradually increase)
          if (counterMeds) {
            counterMeds.textContent = Math.floor(progress * 2.63); // max 263
          }
          if (counterInteractions) {
            counterInteractions.textContent = Math.floor(progress * 0.47); // max 47
          }
          if (counterCalculations) {
            const calc = Math.floor(progress * 28.47); // max 2847
            counterCalculations.textContent = calc.toLocaleString('de-DE');
          }
          
          if (elapsed >= step.duration) {
            clearInterval(progressInterval);
          }
        }, 30);
        
        // When last step completes
        if (index === steps.length - 1) {
          setTimeout(() => {
            console.log('✅ Animation completed - 100%');
            clearInterval(dotsInterval);
            
            // Final values
            if (centerPercentage) {
              centerPercentage.textContent = '100%';
              centerPercentage.style.fontSize = '2rem';
            }
            if (statusText) {
              statusText.innerHTML = '<i class="fas fa-check-circle"></i> Analyse erfolgreich abgeschlossen';
              statusText.style.color = '#059669';
              statusText.style.fontWeight = '700';
            }
            if (statusDots) {
              statusDots.style.display = 'none';
            }
            if (counterMeds) counterMeds.textContent = '263';
            if (counterInteractions) counterInteractions.textContent = '47';
            if (counterCalculations) counterCalculations.textContent = '2.847';
            
            // Show "Plan ready" button after 1 second
            setTimeout(() => {
              console.log('🎁 Showing "Plan ready" button');
              
              if (planReadyMessage) {
                planReadyMessage.style.display = 'block';
                planReadyMessage.style.opacity = '0';
                planReadyMessage.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                  planReadyMessage.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                  planReadyMessage.style.opacity = '1';
                  planReadyMessage.style.transform = 'translateY(0)';
                }, 50);
              }
              
              // Register button click handler
              if (showPlanButton) {
                console.log('✅ Button click handler registered');
                showPlanButton.addEventListener('click', () => {
                  console.log('🎯 User clicked "Plan anzeigen" button');
                  
                  showPlanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Wird geladen...</span>';
                  
                  setTimeout(() => {
                    console.log('🎬 Fading out loading animation');
                    const loadingEl = document.getElementById('loading');
                    if (loadingEl) {
                      loadingEl.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                      loadingEl.style.opacity = '0';
                      loadingEl.style.transform = 'scale(0.98)';
                    }
                    
                    console.log('✅ Resolving animation promise NOW');
                    resolve();
                  }, 300);
                });
              } else {
                console.error('❌ Button not found!');
              }
            }, 1000);
            
          }, step.duration);
        }
      }, delay);
      
      delay += step.duration;
    });
  });
}


// Analyze medications with animated loading
async function analyzeMedications(medications, durationWeeks, firstName = '', gender = '', email = '', age = null, weight = null, height = null, reductionGoal = 100) {
  console.log('🚀 analyzeMedications started');
  
  // Show loading and scroll to it
  const loadingEl = document.getElementById('loading');
  loadingEl.classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
  
  // Scroll to loading element - sanft in die Mitte des Bildschirms
  setTimeout(() => {
    loadingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 150);

  // Start animation
  console.log('🎬 Starting animation promise');
  const animationPromise = animateLoadingSteps();

  try {
    // Make API call
    console.log('📡 Making API call to /api/analyze');
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
    // IMPORTANT: Animation MUST complete to 100% even if API is fast
    console.log('⏳ Waiting for API and animation to complete...');
    const [response] = await Promise.all([apiPromise, animationPromise]);

    console.log('✅ Both API and animation completed');
    console.log('📊 API response success:', response.data.success);

    if (response.data.success) {
      console.log('🎉 Calling displayResults()');
      console.log('📦 Response data:', response.data);
      
      try {
        displayResults(response.data, firstName, gender);
        console.log('✅ displayResults() completed successfully');
      } catch (displayError) {
        console.error('❌ ERROR in displayResults():', displayError);
        console.error('Stack trace:', displayError.stack);
        alert('Fehler beim Anzeigen der Ergebnisse: ' + displayError.message);
      }
    } else {
      throw new Error(response.data.error || 'Analyse fehlgeschlagen');
    }
  } catch (error) {
    console.error('❌ Fehler bei der Analyse:', error);
    alert('Fehler bei der Analyse: ' + (error.response?.data?.error || error.message));
  } finally {
    console.log('🧹 Finally block: hiding loading element');
    document.getElementById('loading').classList.add('hidden');
  }
}

// Display results
function displayResults(data, firstName = '', gender = '') {
  console.log('📺 displayResults() called');
  console.log('📦 Data received:', data);
  
  const resultsDiv = document.getElementById('results');
  
  if (!resultsDiv) {
    console.error('❌ FEHLER: Results div nicht gefunden!');
    return;
  }
  
  console.log('✅ Results div found:', resultsDiv);
  console.log('🎨 Current resultsDiv classes:', resultsDiv.className);
  
  const { analysis, maxSeverity, guidelines, weeklyPlan, warnings, product, personalization, costs } = data;
  
  let html = '';
  
  // ============================================================
  // MOBILE-FIRST RESPONSIVE STYLES
  // ============================================================
  html += `
    <style>
      /* Mobile-optimierte Basis-Styles */
      @media (max-width: 768px) {
        #results {
          font-size: 16px !important; /* Verhindert Auto-Zoom beim Fokus */
          -webkit-text-size-adjust: 100%;
        }
        
        /* Alle Karten/Container mobile-optimiert */
        #results > div[style*="border-radius"] {
          margin-left: -0.5rem !important;
          margin-right: -0.5rem !important;
          border-radius: 16px !important;
        }
        
        /* Grid-Layouts mobile-optimiert */
        div[style*="grid-template-columns"] {
          grid-template-columns: 1fr !important;
          gap: 0.75rem !important;
        }
        
        /* Tabellen scrollbar machen */
        .table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        table {
          min-width: 600px !important;
          font-size: 0.85rem !important;
        }
        
        /* Touch-optimierte Buttons */
        button {
          min-height: 44px !important;
          padding: 0.875rem 1.5rem !important;
          font-size: 1rem !important;
        }
        
        /* Schriftgrößen mobile-optimiert */
        h1 { font-size: 1.75rem !important; }
        h2 { font-size: 1.35rem !important; }
        h3 { font-size: 1.1rem !important; }
        h4 { font-size: 1rem !important; }
        
        /* Padding mobile reduziert */
        div[style*="padding: 1.5rem"] {
          padding: 1rem !important;
        }
        
        /* Flexbox Items auf mobile stapeln */
        div[style*="display: flex"][style*="justify-content: space-between"] {
          flex-direction: column !important;
          gap: 0.5rem !important;
          align-items: flex-start !important;
        }
        
        div[style*="display: flex"][style*="justify-content: space-between"] > * {
          width: 100% !important;
        }
        
        /* Wochenplan Cards mobile-optimiert */
        .week-card {
          padding: 1rem !important;
          margin-bottom: 0.75rem !important;
        }
        
        /* Medikations-Karten mobile-optimiert */
        div[style*="padding: 1rem"][style*="border-radius: 12px"] {
          padding: 0.875rem !important;
        }
        
        /* Text-Alignments mobile-fix */
        div[style*="text-align: right"] {
          text-align: left !important;
        }
      }
      
      /* Extra small screens (< 480px) */
      @media (max-width: 480px) {
        #results {
          padding: 0.5rem !important;
        }
        
        h1 { font-size: 1.5rem !important; }
        h2 { font-size: 1.25rem !important; }
        h3 { font-size: 1rem !important; }
        
        table {
          font-size: 0.75rem !important;
        }
        
        th, td {
          padding: 0.5rem 0.25rem !important;
        }
      }
    </style>
  `;

  // ============================================================
  // 1. KOPFBEREICH - TITEL & UNTERTITEL (Homepage-Stil)
  // ============================================================
  
  html += `
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: radial-gradient(circle at top left, #e0fdf7, #f5f7fa); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h1 style="margin: 0 0 0.6rem; font-size: 1.6rem; line-height: 1.2; color: #0b7b6c; font-weight: 700;">
        Ihr persönlicher MedLess-Dosierungs- und Reduktionsplan
      </h1>
      <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #4b5563;">
        Dieser Plan zeigt Ihnen eine strukturierte, medizinisch fundierte Kombination aus CBD-Dosierung und schrittweiser Medikamentenreduktion. 
        <strong style="color: #0b7b6c;">Bitte besprechen Sie jede Änderung mit Ihrem Arzt.</strong>
      </p>
    </div>
  `;
  
  // ============================================================
  // 2. PRODUKTBEDARF & GESAMTKOSTEN - GANZ AM ANFANG! (Homepage-Stil)
  // ============================================================
  
  if (costs) {
    const totalWeeks = weeklyPlan.length;
    const avgPerWeek = (costs.totalCost / totalWeeks).toFixed(2);
    
    html += `
      <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: radial-gradient(circle at top left, #e0fdf7, #f5f7fa); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 1rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">💰 Benötigte Produkte für Ihren vollständigen Plan</h2>
        
        <div class="table-container" style="overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1rem;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 2px solid rgba(11,123,108,0.2);">
                <th style="text-align: left; padding: 0.75rem 0.5rem; font-weight: 600; color: #374151;">Produkt</th>
                <th style="text-align: center; padding: 0.75rem 0.5rem; font-weight: 600; color: #374151;">mg/Hub</th>
                <th style="text-align: center; padding: 0.75rem 0.5rem; font-weight: 600; color: #374151;">Anzahl Fläschchen</th>
                <th style="text-align: right; padding: 0.75rem 0.5rem; font-weight: 600; color: #374151;">Preis pro Flasche</th>
                <th style="text-align: right; padding: 0.75rem 0.5rem; font-weight: 600; color: #374151;">Gesamtkosten</th>
              </tr>
            </thead>
            <tbody>
              ${costs.costBreakdown.map((item, idx) => `
                <tr style="border-bottom: 1px solid rgba(229,231,235,0.6);">
                  <td style="padding: 0.75rem 0.5rem; color: #1f2937;">${item.product}</td>
                  <td style="padding: 0.75rem 0.5rem; text-align: center; color: #4b5563;">${item.productNr ? (KANNASAN_PRODUCTS.find(p => p.nr === item.productNr)?.cbdPerSpray.toFixed(1) || '-') : '-'}</td>
                  <td style="padding: 0.75rem 0.5rem; text-align: center; color: #4b5563;">${item.bottleCount} Stück</td>
                  <td style="padding: 0.75rem 0.5rem; text-align: right; color: #4b5563;">${item.pricePerBottle.toFixed(2)} €</td>
                  <td style="padding: 0.75rem 0.5rem; text-align: right; font-weight: 600; color: #0b7b6c;">${item.totalCost.toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="padding: 1rem; border-radius: 12px; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #374151;">Gesamtkosten des Programms:</p>
            <p style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #0b7b6c;">${costs.totalCost.toFixed(2)} €</p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">Durchschnittliche Kosten pro Woche:</p>
            <p style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #0b7b6c;">${avgPerWeek} €</p>
          </div>
        </div>
      </div>
    `;
  }
  
  // ============================================================
  // 3. AUSGANGSSITUATION - IHRE AUSGANGSDATEN (Homepage-Stil)
  // ============================================================
  
  if (personalization) {
    html += `
      <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 1rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Ihre Ausgangsdaten</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem;">
          ${personalization.age ? `
            <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
              <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">Alter</p>
              <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${personalization.age} Jahre</p>
            </div>
          ` : ''}
          ${personalization.height ? `
            <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
              <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">Größe</p>
              <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${personalization.height} cm</p>
            </div>
          ` : ''}
          ${personalization.weight ? `
            <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
              <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">Gewicht</p>
              <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${personalization.weight} kg</p>
            </div>
          ` : ''}
          ${personalization.bmi ? `
            <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
              <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">BMI</p>
              <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${personalization.bmi.toFixed(1)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  // ============================================================
  // 3. IHRE AKTUELLE MEDIKATION (Homepage-Stil)
  // ============================================================
  
  html += `
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 1rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Ihre aktuelle Medikation</h2>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
  `;
  
  analysis.forEach((item) => {
    const med = item.medication;
    const interactions = item.interactions;
    const hasInteractions = interactions && interactions.length > 0;
    
    html += `
      <div style="padding: 1rem; border-radius: 12px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <div>
            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #1f2937;">${med.name}</h3>
            ${med.generic_name ? `<p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: #6b7280;">${med.generic_name}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 0.7rem; color: #9ca3af;">Tagesdosis</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.9rem; font-weight: 600; color: #1f2937;">${item.dosage}</p>
          </div>
        </div>
        
        ${hasInteractions ? `
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Hinweise zu Wechselwirkungen:</p>
            ${interactions.map(i => `
              <div style="margin-bottom: 0.5rem; font-size: 0.85rem; color: #374151;">
                <p style="margin: 0; font-weight: 600;">${i.description}</p>
                ${i.recommendation ? `<p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #6b7280;">${i.recommendation}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="margin: 0.75rem 0 0; font-size: 0.85rem; color: #6b7280;">Keine bekannten Wechselwirkungen mit Cannabinoiden</p>
        `}
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  // Critical warnings (Homepage-Stil)
  if (warnings && warnings.length > 0) {
    html += `
      <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: #fef2f2; border-left: 4px solid #ef4444;">
        <h3 style="margin: 0 0 0.75rem; font-size: 1.1rem; font-weight: 700; color: #991b1b;">⚠️ Kritische Wechselwirkungen erkannt</h3>
        ${warnings.map(w => `<p style="margin: 0 0 0.5rem; font-size: 0.85rem; color: #b91c1c;">${w}</p>`).join('')}
      </div>
    `;
  }

  // ============================================================
  // 4. CBD-DOSIERUNGSEMPFEHLUNG (Homepage-Stil)
  // ============================================================
  
  if (product && personalization) {
    html += `
      <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 1rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Ihre CBD-Dosierungsempfehlung</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">CBD Start-Dosis</p>
            <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${personalization.cbdStartMg.toFixed(1)} mg</p>
          </div>
          <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">CBD Ziel-Dosis</p>
            <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${personalization.cbdEndMg.toFixed(1)} mg</p>
          </div>
          <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">Wöchentlicher Anstieg</p>
            <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${((personalization.cbdEndMg - personalization.cbdStartMg) / weeklyPlan.length).toFixed(1)} mg</p>
          </div>
          <div style="padding-left: 0.75rem; border-left: 3px solid #0b7b6c;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 0.25rem;">Empfohlenes Produkt</p>
            <p style="font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 0;">${product.name}</p>
          </div>
        </div>
        
        <div style="padding: 1rem; border-radius: 12px; background: #f9fafb;">
          <p style="margin: 0 0 0.75rem; font-size: 0.85rem; font-weight: 600; color: #374151;">Berechnung der täglichen Sprühstöße</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
            <div>
              <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Morgens</p>
              <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #0b7b6c;">${product.morningSprays}</p>
            </div>
            <div>
              <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Abends</p>
              <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #0b7b6c;">${product.eveningSprays}</p>
            </div>
            <div>
              <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Gesamt pro Tag</p>
              <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #0b7b6c;">${product.totalSpraysPerDay}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // 5. WÖCHENTLICHER REDUKTIONSPLAN (Homepage-Stil)
  // ============================================================
  
  html += `
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 1rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Wöchentlicher Reduktionsplan</h2>
  `;

  // Wöchentlicher Reduktionsplan - Jede Woche eigene Box (Homepage-Stil)
  weeklyPlan.forEach((week, weekIndex) => {
    html += `
      <div style="margin-bottom: 1.2rem; padding: 1.2rem; border-radius: 16px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 1rem; font-size: 1.1rem; font-weight: 700; color: #0b7b6c;">Woche ${week.week}</h3>
        
        <!-- Medikamenten-Dosierung -->
        <h4 style="margin: 0 0 0.75rem; font-size: 0.85rem; font-weight: 600; color: #374151;">Medikamenten-Dosierung</h4>
        <div class="table-container" style="overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1rem;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(11,123,108,0.2);">
                <th style="text-align: left; padding: 0.5rem; font-weight: 600; color: #6b7280; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Medikament</th>
                <th style="text-align: center; padding: 0.5rem; font-weight: 600; color: #6b7280; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Start</th>
                <th style="text-align: center; padding: 0.5rem; font-weight: 600; color: #6b7280; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Woche ${week.week}</th>
                <th style="text-align: center; padding: 0.5rem; font-weight: 600; color: #6b7280; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Ziel</th>
                <th style="text-align: center; padding: 0.5rem; font-weight: 600; color: #6b7280; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Veränderung</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    week.medications.forEach((med) => {
      html += `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 0.5rem; color: #1f2937;">${med.name}</td>
                <td style="padding: 0.5rem; text-align: center; color: #4b5563;">${med.startMg} mg</td>
                <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #1f2937;">${med.currentMg} mg</td>
                <td style="padding: 0.5rem; text-align: center; color: #4b5563;">${med.targetMg} mg</td>
                <td style="padding: 0.5rem; text-align: center; color: #4b5563;">-${med.reduction} mg/Woche</td>
              </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
        
        <!-- CBD-Dosierung -->
        <h4 style="margin: 1rem 0 0.75rem; font-size: 0.85rem; font-weight: 600; color: #374151;">CBD-Dosierung</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
          <div style="padding-left: 0.5rem; border-left: 3px solid #0b7b6c;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">CBD mg/Tag</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${week.cbdDose} mg</p>
          </div>
          <div style="padding-left: 0.5rem; border-left: 3px solid #0b7b6c;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Produkt</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${week.kannasanProduct.name}</p>
          </div>
          <div style="padding-left: 0.5rem; border-left: 3px solid #0b7b6c;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Morgens</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${week.morningSprays}×</p>
          </div>
          <div style="padding-left: 0.5rem; border-left: 3px solid #0b7b6c;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Abends</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${week.eveningSprays}×</p>
          </div>
        </div>
        
        <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #6b7280;"><strong>Gesamt:</strong> ${week.totalSprays} Sprühstöße täglich = ${week.actualCbdMg} mg CBD</p>
        
        <!-- Fläschchen-Status -->
        ${week.bottleStatus ? `
        <h4 style="margin: 1rem 0 0.75rem; font-size: 0.85rem; font-weight: 600; color: #374151;">Fläschchen-Status</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
          <div style="padding-left: 0.5rem; border-left: 2px solid #e5e7eb;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Verbraucht</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${week.bottleStatus.used} / ${week.bottleStatus.totalCapacity}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.7rem; color: #9ca3af;">Hübe</p>
          </div>
          <div style="padding-left: 0.5rem; border-left: 2px solid #e5e7eb;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Verbleibend</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${week.bottleStatus.remaining}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.7rem; color: #9ca3af;">Hübe</p>
          </div>
          <div style="padding-left: 0.5rem; border-left: 2px solid #e5e7eb;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; color: #9ca3af;">Leer in</p>
            <p style="margin: 0; font-weight: 600; color: #1f2937;">~${week.bottleStatus.emptyInWeeks}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.7rem; color: #9ca3af;">Wochen</p>
          </div>
        </div>
        
        <div style="padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; ${week.bottleStatus.productChangeNext ? 'background: #fef3c7; color: #92400e;' : 'background: #d1fae5; color: #065f46;'}">
          <strong>Empfehlung:</strong> ${week.bottleStatus.productChangeNext ? 'Produktwechsel in nächster Woche erforderlich' : 'Aktuelles Fläschchen weiterverwenden'}
        </div>
        ` : ''}
      </div>
    `;
  });
  
  html += `
    </div>
  `;

  // ============================================================
  // 7. MEDIZINISCHE HINWEISE (Homepage-Stil)
  // ============================================================
  
  html += `
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 1rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Wichtige medizinische Hinweise</h2>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem; color: #374151;">
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #0b7b6c; margin: 0.4rem 0.75rem 0 0; flex-shrink: 0;"></div>
          <p style="margin: 0;"><strong>Keine selbstständige Medikamentenänderung:</strong> Reduzieren Sie Medikamente ausschließlich unter ärztlicher Aufsicht. Eigenständige Änderungen können gesundheitsgefährdend sein.</p>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #0b7b6c; margin: 0.4rem 0.75rem 0 0; flex-shrink: 0;"></div>
          <p style="margin: 0;"><strong>CYP450-Interaktionen beachten:</strong> Cannabinoide können den Abbau bestimmter Medikamente über das Cytochrom-P450-System beeinflussen. Ihr Arzt sollte mögliche Wechselwirkungen prüfen.</p>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #0b7b6c; margin: 0.4rem 0.75rem 0 0; flex-shrink: 0;"></div>
          <p style="margin: 0;"><strong>Kein Alkohol während der Reduktion:</strong> Alkohol kann Wechselwirkungen verstärken und den Reduktionsprozess gefährden.</p>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #0b7b6c; margin: 0.4rem 0.75rem 0 0; flex-shrink: 0;"></div>
          <p style="margin: 0;"><strong>Keine Grapefruit:</strong> Grapefruit beeinflusst ebenfalls das CYP450-System und sollte während der Behandlung vermieden werden.</p>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #0b7b6c; margin: 0.4rem 0.75rem 0 0; flex-shrink: 0;"></div>
          <p style="margin: 0;"><strong>Müdigkeit möglich:</strong> Cannabinoide können Müdigkeit verursachen. Fahren Sie kein Fahrzeug, bis Sie wissen, wie Sie auf Cannabinoide reagieren.</p>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #0b7b6c; margin: 0.4rem 0.75rem 0 0; flex-shrink: 0;"></div>
          <p style="margin: 0;"><strong>Niemals abrupt absetzen:</strong> Setzen Sie Medikamente niemals abrupt ab - immer schrittweise gemäß ärztlichem Plan.</p>
        </div>
        
        <div style="display: flex; align-items: flex-start;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #0b7b6c; margin: 0.4rem 0.75rem 0 0; flex-shrink: 0;"></div>
          <p style="margin: 0;"><strong>Bei Nebenwirkungen:</strong> Kontaktieren Sie sofort Ihren Arzt bei unerwünschten Symptomen oder Nebenwirkungen.</p>
        </div>
      </div>
    </div>
  `;

  // ============================================================
  // PDF DOWNLOAD BUTTON - ENTFERNT
  // Der Plan wird nur im Browser angezeigt, ohne Download-Möglichkeit
  // ============================================================

  resultsDiv.innerHTML = html;
  console.log('📝 Results HTML set (length:', html.length, 'chars)');
  
  resultsDiv.classList.remove('hidden');
  console.log('👁️ Removed "hidden" class from results');
  console.log('🎨 Final resultsDiv classes:', resultsDiv.className);
  console.log('📏 Results div dimensions:', resultsDiv.offsetWidth, 'x', resultsDiv.offsetHeight);
  
  // Scroll to results
  setTimeout(() => {
    console.log('📜 Scrolling to results');
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
  
  console.log('✅ displayResults() function completed successfully');
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
    
    // H1: MedLess Haupttitel
    doc.setFontSize(22);
    doc.setTextColor(26, 83, 92); // Dunkles Teal
    doc.setFont(undefined, 'bold');
    doc.text('MedLess – Ihr persönlicher Reduktionsplan', 105, yPos, { align: 'center' });
    
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
      doc.text('MedLess – www.redu-med.com', 105, 285, { align: 'center' });
      doc.text(`Seite ${i} von ${pageCount} | Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 105, 290, { align: 'center' });
    }
    
    // Download
    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedName = (firstName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `MedLess-Plan_${sanitizedName}_${dateStr}.pdf`;
    
    doc.save(filename);
    
  } catch (error) {
    console.error('Fehler beim Erstellen der PDF:', error);
    alert('Fehler beim Erstellen der PDF. Bitte versuchen Sie es erneut.');
  }
}

// ============================================================
// SUPER-EINFACHE LÖSUNG: Verstecke alles außer Results → Print
// ============================================================
window.downloadPlanAsPDF = async function(event) {
  console.log('🎯 downloadPlanAsPDF called');
  const resultsDiv = document.getElementById('results');
  
  if (!resultsDiv || resultsDiv.classList.contains('hidden')) {
    alert('Kein Plan vorhanden. Bitte erstellen Sie erst einen Reduktionsplan.');
    return;
  }
  
  // Finde Button (auch wenn auf Child-Element geklickt wurde)
  let button = event?.target;
  if (button && button.tagName !== 'BUTTON') {
    button = button.closest('button');
  }
  
  try {
    // Zeige Loading-Nachricht
    if (button) {
      const originalText = button.innerHTML;
      button.setAttribute('data-original-text', originalText);
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PDF wird erstellt...';
      button.disabled = true;
    }
    
    console.log('PDF-Generierung gestartet...');
    console.log('jsPDF verfügbar:', !!window.jspdf);
    console.log('html2canvas verfügbar:', !!window.html2canvas);
    
    // Prüfe jsPDF (muss bereits geladen sein)
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF-Bibliothek (jsPDF) nicht geladen. Bitte Seite neu laden.');
    }
    
    const { jsPDF } = window.jspdf;
    console.log('jsPDF bereit:', jsPDF);
    
    // Lade html2canvas wenn nicht vorhanden
    if (!window.html2canvas) {
      console.log('Lade html2canvas...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = () => {
          console.log('html2canvas erfolgreich geladen');
          resolve();
        };
        script.onerror = (err) => {
          console.error('Fehler beim Laden von html2canvas:', err);
          reject(new Error('html2canvas konnte nicht geladen werden'));
        };
        document.head.appendChild(script);
        
        // Timeout nach 15 Sekunden
        setTimeout(() => reject(new Error('Timeout beim Laden von html2canvas (15s)')), 15000);
      });
    }
    
    console.log('html2canvas verfügbar, starte Screenshot...');
    
    // Erstelle Screenshot mit Timeout-Schutz
    const canvasPromise = window.html2canvas(resultsDiv, {
      scale: 0.5,  // Reduziert von 0.6 auf 0.5 für bessere Performance
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#f5f7fa',
      windowWidth: resultsDiv.scrollWidth,
      windowHeight: resultsDiv.scrollHeight,
      onclone: (clonedDoc) => {
        // Bereinige Probleme im geklonten Dokument
        const clonedResults = clonedDoc.getElementById('results');
        if (clonedResults) {
          clonedResults.querySelectorAll('script, style').forEach(el => el.remove());
        }
      }
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Screenshot-Timeout nach 60 Sekunden')), 60000)
    );
    
    const canvas = await Promise.race([canvasPromise, timeoutPromise]);
    
    console.log('Screenshot erstellt, Canvas-Größe:', canvas.width, 'x', canvas.height);
    
    // Validierung
    if (!canvas.width || !canvas.height || canvas.width <= 0 || canvas.height <= 0) {
      throw new Error('Ungültige Canvas-Größe: ' + canvas.width + 'x' + canvas.height);
    }
    
    // Konvertiere zu Bild
    const imgData = canvas.toDataURL('image/jpeg', 0.75);
    
    // Erstelle PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 5;
    
    // Berechne Bildgröße für PDF
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    console.log('PDF wird erstellt, Bildgröße:', imgWidth.toFixed(2) + 'mm x ' + imgHeight.toFixed(2) + 'mm');
    
    // Sicherheitscheck: Maximale Bildgröße begrenzen
    const MAX_IMAGE_HEIGHT = 5000;
    if (imgHeight > MAX_IMAGE_HEIGHT) {
      throw new Error(`Plan ist zu lang für PDF-Erstellung (${imgHeight.toFixed(0)}mm). Bitte erstellen Sie einen kürzeren Plan.`);
    }
    
    // NEUE METHODE: Seiten-basierte Aufteilung (robuster)
    const contentHeight = pdfHeight - (margin * 2);
    let pageCount = 1;
    let yOffset = 0;
    
    // Erste Seite
    if (imgHeight <= contentHeight) {
      // Passt auf eine Seite
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      console.log('Plan passt auf 1 Seite');
    } else {
      // Mehrere Seiten nötig
      const totalPages = Math.ceil(imgHeight / contentHeight);
      console.log('Plan benötigt', totalPages, 'Seiten');
      
      // Sicherheitscheck: Max 20 Seiten
      if (totalPages > 20) {
        throw new Error(`Plan ist zu lang (${totalPages} Seiten). Maximum: 20 Seiten. Bitte kürzen Sie den Plan.`);
      }
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Berechne Ausschnitt für diese Seite
        yOffset = -(page * contentHeight);
        
        // Füge Bild hinzu mit Offset
        pdf.addImage(imgData, 'JPEG', margin, margin + yOffset, imgWidth, imgHeight);
        pageCount++;
      }
    }
    
    console.log('PDF erstellt mit', pageCount, 'Seite(n)');
    
    // Dateiname mit Vorname
    const firstName = window.currentPlanData?.firstName || 'Patient';
    const date = new Date().toISOString().split('T')[0];
    const filename = `MedLess_Plan_${firstName}_${date}.pdf`;
    
    console.log('Speichere PDF als:', filename);
    pdf.save(filename);
    
    console.log('✅ PDF erfolgreich heruntergeladen!');
    
    // Button zurücksetzen
    if (button) {
      const originalText = button.getAttribute('data-original-text') || 'Als PDF herunterladen';
      button.innerHTML = originalText;
      button.disabled = false;
    }
    
  } catch (error) {
    console.error('❌❌❌ FEHLER beim Erstellen der PDF ❌❌❌');
    console.error('Error Object:', error);
    console.error('Error Name:', error?.name);
    console.error('Error Message:', error?.message);
    console.error('Error Stack:', error?.stack);
    console.error('Error String:', String(error));
    
    // SICHTBARE Fehlermeldung
    const errorMsg = error?.message || error?.name || String(error) || 'Unbekannter Fehler';
    alert(`❌ PDF-Fehler gefunden:\n\n${errorMsg}\n\nBitte Screenshot der Console machen und senden!`);
    
    // Button zurücksetzen
    if (button) {
      const originalText = button.getAttribute('data-original-text') || 'Als PDF herunterladen';
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }
}
