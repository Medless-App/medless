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

// Animate loading steps with rich visual feedback
function animateLoadingSteps() {
  return new Promise((resolve) => {
    // Create particles
    createParticles();
    
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
    const statusDots = document.getElementById('status-dots');
    
    // NEW: Circular progress elements
    const progressCircle = document.getElementById('progress-circle');
    const centerPercentage = document.getElementById('center-percentage');
    const centerTime = document.getElementById('center-time');
    const centerIcon = document.getElementById('center-icon');
    const completionBurst = document.getElementById('completion-burst');
    const completionStats = document.getElementById('completion-stats');
    const liveStats = document.getElementById('live-stats');
    
    // Counter elements
    const counterMeds = document.getElementById('counter-medications');
    const counterInteractions = document.getElementById('counter-interactions');
    const counterCalculations = document.getElementById('counter-calculations');
    
    let totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let currentTime = 0;
    
    // Animated dots for status
    let dotCount = 0;
    const dotsInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      if (statusDots) {
        statusDots.textContent = '.'.repeat(dotCount || 1);
      }
    }, 500);
    
    // Smooth overall progress (both bar and circular)
    const progressInterval = setInterval(() => {
      currentTime += 40;
      const smoothProgress = Math.min((currentTime / totalDuration) * 100, 100);
      
      // Update linear progress bar
      if (progressBar) {
        progressBar.style.width = smoothProgress + '%';
      }
      
      if (progressText) {
        progressText.textContent = Math.round(smoothProgress) + '%';
      }
      
      // Update circular progress ring (r=42 für noch kleineren Ring)
      if (progressCircle) {
        const circumference = 2 * Math.PI * 42; // r=42
        const offset = circumference - (smoothProgress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
      }
      
      // Update center percentage
      if (centerPercentage) {
        centerPercentage.textContent = Math.round(smoothProgress) + '%';
      }
      
      // Update time estimate
      if (centerTime) {
        const remainingSeconds = Math.ceil((totalDuration - currentTime) / 1000);
        if (remainingSeconds > 0) {
          centerTime.textContent = `noch ca. ${remainingSeconds} Sek.`;
        } else {
          centerTime.textContent = 'Abgeschlossen!';
        }
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
              // ========================================
              // SPEKTAKULÄRE 100% COMPLETION ANIMATION
              // ========================================
              
              // 1. Force all progress indicators to 100%
              if (progressBar) {
                progressBar.style.width = '100%';
              }
              if (progressText) {
                progressText.textContent = '100%';
              }
              if (progressCircle) {
                progressCircle.style.strokeDashoffset = '0';
              }
              if (centerPercentage) {
                centerPercentage.textContent = '100%';
                centerPercentage.style.fontSize = '2rem';
                centerPercentage.style.fontWeight = '800';
              }
              if (centerTime) {
                centerTime.textContent = '✓ Abgeschlossen!';
                centerTime.style.color = '#059669';
                centerTime.style.fontWeight = '600';
              }
              
              clearInterval(progressInterval);
              clearInterval(counterInterval);
              clearInterval(dotsInterval);
              
              // 2. Change icon to checkmark with SLOWER scale animation
              if (centerIcon) {
                centerIcon.style.animation = 'rotate-center 0.8s ease-out';
                setTimeout(() => {
                  centerIcon.className = 'fas fa-check-circle';
                  centerIcon.style.color = '#10b981';
                  centerIcon.style.fontSize = '2rem'; // Kleinerer Check für 100px Ring
                  centerIcon.style.animation = 'none';
                }, 400);
              }
              
              // 3. Add glow effect to circular progress (LANGSAMER)
              if (progressCircle) {
                progressCircle.style.transition = 'all 0.8s ease';
                progressCircle.style.animation = 'pulse-glow 2s ease-in-out infinite';
                progressCircle.style.stroke = '#10b981';
              }
              
              // 4. Show completion burst effect (LANGSAMER)
              if (completionBurst) {
                completionBurst.style.display = 'block';
                setTimeout(() => {
                  completionBurst.style.display = 'none';
                }, 800);
              }
              
              // 5. Create success particles & confetti
              const particlesContainer = document.getElementById('particles-container');
              if (particlesContainer) {
                // Add circular burst particles
                for (let i = 0; i < 25; i++) {
                  const particle = document.createElement('div');
                  const size = Math.random() * 6 + 3;
                  const angle = (Math.PI * 2 * i) / 25; // Gleichmäßig verteilt
                  const distance = Math.random() * 200 + 100;
                  const deltaX = Math.cos(angle) * distance;
                  const deltaY = Math.sin(angle) * distance;
                  const duration = Math.random() * 0.6 + 0.5; // 0.5-1.1s
                  const delay = Math.random() * 0.2; // 0-0.2s
                  
                  particle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: radial-gradient(circle, rgba(16,185,129,1), rgba(52,211,153,0.4));
                    border-radius: 50%;
                    left: 50%;
                    top: 25%;
                    --tx: ${deltaX};
                    --ty: ${deltaY};
                    animation: burst-particle ${duration}s ease-out ${delay}s forwards;
                    pointer-events: none;
                    box-shadow: 0 0 8px rgba(16,185,129,0.6);
                  `;
                  
                  particlesContainer.appendChild(particle);
                  
                  setTimeout(() => particle.remove(), (duration + delay) * 1000);
                }
                
                // Add confetti particles (colored rectangles)
                const confettiColors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'];
                for (let i = 0; i < 20; i++) {
                  const confetti = document.createElement('div');
                  const width = Math.random() * 6 + 3;
                  const height = Math.random() * 12 + 6;
                  const angle = Math.random() * Math.PI * 2;
                  const distance = Math.random() * 250 + 120;
                  const deltaX = Math.cos(angle) * distance;
                  const deltaY = Math.sin(angle) * distance;
                  const rotation = Math.random() * 720 - 360;
                  const duration = Math.random() * 0.8 + 0.6;
                  const delay = Math.random() * 0.25;
                  const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
                  
                  confetti.style.cssText = `
                    position: absolute;
                    width: ${width}px;
                    height: ${height}px;
                    background: ${color};
                    border-radius: 2px;
                    left: 50%;
                    top: 25%;
                    --tx: ${deltaX};
                    --ty: ${deltaY};
                    animation: burst-particle ${duration}s ease-out ${delay}s forwards, spin ${duration * 0.8}s linear ${delay}s forwards;
                    pointer-events: none;
                  `;
                  
                  particlesContainer.appendChild(confetti);
                  
                  setTimeout(() => confetti.remove(), (duration + delay) * 1000);
                }
              }
              
              // 6. Final counter values
              if (counterMeds) counterMeds.textContent = '173';
              if (counterInteractions) counterInteractions.textContent = '47';
              if (counterCalculations) counterCalculations.textContent = '2.847';
              
              // 7. Update status text with celebration
              if (statusText) {
                statusText.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 0.5rem;"></i>Analyse erfolgreich abgeschlossen';
                statusText.style.color = '#059669';
                statusText.style.fontWeight = '700';
                statusText.style.fontSize = '1rem';
              }
              
              if (statusDots) {
                statusDots.style.display = 'none';
              }
              
              // 8. SPEKTAKULÄRE STATS REVEAL - Hide live stats, show completion stats (LANGSAMER)
              setTimeout(() => {
                if (liveStats) {
                  liveStats.style.transition = 'all 0.5s ease';
                  liveStats.style.opacity = '0';
                  liveStats.style.transform = 'scale(0.95)';
                  
                  setTimeout(() => {
                    liveStats.style.display = 'none';
                    
                    // Show completion stats with SLOWER animation
                    if (completionStats) {
                      completionStats.style.display = 'block';
                      completionStats.style.opacity = '0';
                      completionStats.style.transform = 'scale(0.9)';
                      
                      setTimeout(() => {
                        completionStats.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        completionStats.style.opacity = '1';
                        completionStats.style.transform = 'scale(1)';
                        
                        // ALLE 4 STATS GLEICHZEITIG HOCHZÄHLEN (synchronisiert)
                        const statCalculations = document.getElementById('stat-calculations');
                        const statMedications = document.getElementById('stat-medications');
                        const statInteractions = document.getElementById('stat-interactions');
                        const statWeeks = document.getElementById('stat-weeks');
                        
                        const targets = {
                          calculations: 2847,
                          medications: 173,
                          interactions: 47,
                          weeks: 8
                        };
                        
                        let counts = {
                          calculations: 0,
                          medications: 0,
                          interactions: 0,
                          weeks: 0
                        };
                        
                        // Synchronisiertes Hochzählen - alle zur gleichen Zeit
                        const syncInterval = setInterval(() => {
                          // Increment basierend auf Zielwert (größere Zahlen = größere Schritte)
                          counts.calculations += Math.floor(Math.random() * 200) + 100;
                          counts.medications += Math.floor(Math.random() * 12) + 6;
                          counts.interactions += Math.floor(Math.random() * 4) + 2;
                          counts.weeks += 0.5;
                          
                          // Check & Update für jede Zahl
                          let allDone = true;
                          
                          if (counts.calculations >= targets.calculations) {
                            counts.calculations = targets.calculations;
                            if (statCalculations) statCalculations.textContent = counts.calculations.toLocaleString('de-DE');
                          } else {
                            if (statCalculations) statCalculations.textContent = Math.floor(counts.calculations).toLocaleString('de-DE');
                            allDone = false;
                          }
                          
                          if (counts.medications >= targets.medications) {
                            counts.medications = targets.medications;
                            if (statMedications) statMedications.textContent = counts.medications;
                          } else {
                            if (statMedications) statMedications.textContent = Math.floor(counts.medications);
                            allDone = false;
                          }
                          
                          if (counts.interactions >= targets.interactions) {
                            counts.interactions = targets.interactions;
                            if (statInteractions) statInteractions.textContent = counts.interactions;
                          } else {
                            if (statInteractions) statInteractions.textContent = Math.floor(counts.interactions);
                            allDone = false;
                          }
                          
                          if (counts.weeks >= targets.weeks) {
                            counts.weeks = targets.weeks;
                            if (statWeeks) statWeeks.textContent = counts.weeks;
                          } else {
                            if (statWeeks) statWeeks.textContent = Math.floor(counts.weeks);
                            allDone = false;
                          }
                          
                          // Stoppe wenn alle fertig
                          if (allDone) {
                            clearInterval(syncInterval);
                          }
                        }, 60); // Alle 60ms update
                      }, 100);
                    }
                  }, 500); // 500ms statt 300ms = länger warten
                }
              }, 600); // 600ms statt 400ms = später starten
              
              // 9. Progress bar celebration glow
              if (progressBar) {
                progressBar.style.transition = 'all 0.3s ease';
                progressBar.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3)';
                progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669, #34d399)';
                
                setTimeout(() => {
                  progressBar.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
                }, 500);
              }
              
              // 10. Zeige "Plan ist fertig!" Message nach Stats
              const planReadyMessage = document.getElementById('plan-ready-message');
              const showPlanButton = document.getElementById('show-plan-button');
              
              setTimeout(() => {
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
                
                // 11. Button-Click Handler - WARTET auf User-Interaktion!
                if (showPlanButton) {
                  showPlanButton.addEventListener('click', () => {
                    // Button Feedback
                    showPlanButton.style.transform = 'scale(0.95)';
                    showPlanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Wird geladen...</span>';
                    
                    setTimeout(() => {
                      // Fade-out Animation
                      const loadingEl = document.getElementById('loading');
                      if (loadingEl) {
                        loadingEl.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                        loadingEl.style.opacity = '0';
                        loadingEl.style.transform = 'scale(0.98)';
                      }
                      
                      // Resolve nach Fade-out
                      setTimeout(() => {
                        resolve();
                      }, 800);
                    }, 300);
                  });
                }
              }, 3200); // Nach 3.2 Sekunden erscheint die Message
              
              // Animation stoppt hier - wartet auf User-Click!
              
            }, 800);
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
  
  // Scroll to loading element - sanft in die Mitte des Bildschirms
  setTimeout(() => {
    loadingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 150);

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
    // IMPORTANT: Animation MUST complete to 100% even if API is fast
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
  
  const { analysis, maxSeverity, guidelines, weeklyPlan, warnings, product, personalization, costs } = data;
  
  let html = '';

  // ============================================================
  // 1. KOPFBEREICH - TITEL & UNTERTITEL (Homepage-Stil)
  // ============================================================
  
  html += `
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: radial-gradient(circle at top left, #e0fdf7, #f5f7fa); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h1 style="margin: 0 0 0.6rem; font-size: 1.6rem; line-height: 1.2; color: #0b7b6c; font-weight: 700;">
        Ihr persönlicher ReduMed-Dosierungs- und Reduktionsplan
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
        
        <div style="overflow-x: auto; margin-bottom: 1rem;">
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
        <div style="overflow-x: auto; margin-bottom: 1rem;">
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
  // PDF DOWNLOAD BUTTON (Homepage-Stil)
  // ============================================================
  
  html += `
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
      <button onclick="downloadPlanAsPDF(event)" style="padding: 0.75rem 2rem; background: #0b7b6c; color: white; font-weight: 600; font-size: 0.95rem; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#094d44'" onmouseout="this.style.background='#0b7b6c'">
        Als PDF herunterladen
      </button>
      <p style="margin: 0.75rem 0 0; font-size: 0.85rem; color: #6b7280;">
        Bringen Sie diesen Plan zu Ihrem nächsten Arzttermin mit.
      </p>
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

// ============================================================
// EINFACHE PDF-FUNKTION: HTML-Plan direkt als PDF (mit Fallback)
// ============================================================
async function downloadPlanAsPDF(event) {
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
    
    // Erstelle Screenshot vom Results-Div
    const canvas = await window.html2canvas(resultsDiv, {
      scale: 1.2, // Reduzierte Qualität für bessere Performance
      useCORS: true,
      allowTaint: true,
      logging: false, // Weniger Console-Spam
      backgroundColor: '#f5f7fa',
      windowWidth: resultsDiv.scrollWidth,
      windowHeight: resultsDiv.scrollHeight
    });
    
    console.log('Screenshot erstellt, Canvas-Größe:', canvas.width, 'x', canvas.height);
    
    // Konvertiere zu PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    console.log('Erstelle PDF, Bild-Höhe:', imgHeight, 'mm');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;
    
    // Erste Seite
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height
    
    // Weitere Seiten falls nötig
    let pageCount = 1;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pageCount++;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    
    console.log('PDF erstellt mit', pageCount, 'Seite(n)');
    
    // Dateiname mit Vorname
    const firstName = window.currentPlanData?.firstName || 'Patient';
    const date = new Date().toISOString().split('T')[0];
    const filename = `ReduMed_Plan_${firstName}_${date}.pdf`;
    
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
    console.error('❌ FEHLER beim Erstellen der PDF:', error);
    console.error('Fehler-Details:', error.message);
    console.error('Stack:', error.stack);
    
    alert(`Fehler beim Erstellen der PDF:\n${error.message}\n\nBitte versuchen Sie es erneut oder laden Sie die Seite neu.`);
    
    // Button zurücksetzen
    if (button) {
      const originalText = button.getAttribute('data-original-text') || 'Als PDF herunterladen';
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }
}
