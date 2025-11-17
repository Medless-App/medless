// ============================================================
// MEDICATION SAFETY CLASSIFICATIONS
// Zentrale Konfiguration für Medikamenten-Hinweise
// ============================================================

const MEDICATION_CLASSIFICATIONS = {
  benzodiazepines: {
    keywords: ['diazepam', 'lorazepam', 'alprazolam', 'oxazepam', 'temazepam', 
               'zolpidem', 'zopiclon', 'clonazepam', 'bromazepam', 'benzo'],
    badge: { text: 'vorsichtig reduzieren', color: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
    hint: 'Hinweis: Dieses Medikament gehört zu einer Wirkstoffgruppe, die in der Regel langsam und unter ärztlicher Begleitung reduziert wird. MEDLESS zeigt nur einen theoretischen Verlauf – bitte jede Änderung mit Ihrem Arzt besprechen.'
  },
  antidepressants: {
    keywords: ['citalopram', 'sertralin', 'fluoxetin', 'venlafaxin', 'duloxetin', 
               'amitriptylin', 'escitalopram', 'paroxetin', 'mirtazapin', 'trazodon'],
    badge: { text: 'vorsichtig reduzieren', color: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
    hint: 'Hinweis: Antidepressiva sollten nicht abrupt abgesetzt werden. MEDLESS kann einen theoretischen Ausschleichverlauf darstellen, ersetzt aber keine ärztliche Entscheidung.'
  },
  antiepileptics: {
    keywords: ['valproat', 'carbamazepin', 'lamotrigin', 'levetiracetam', 'gabapentin', 
               'pregabalin', 'topiramat', 'phenytoin'],
    badge: { text: 'vorsichtig reduzieren', color: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
    hint: 'Hinweis: Antiepileptika erfordern ein sehr vorsichtiges Ausschleichen unter ärztlicher Kontrolle. Ein abruptes Absetzen kann schwerwiegende Folgen haben.'
  },
  anticoagulants: {
    keywords: ['warfarin', 'phenprocoumon', 'apixaban', 'rivaroxaban', 'dabigatran', 
               'edoxaban', 'clopidogrel', 'marcumar', 'xarelto', 'eliquis'],
    badge: { text: 'kritische Dauertherapie', color: 'bg-orange-50 text-orange-800 border border-orange-200' },
    hint: 'Hinweis: Blutverdünner sind in vielen Fällen langfristig oder lebenswichtig. MEDLESS macht hierzu nur sehr vorsichtige oder keine Reduktionsvorschläge. Eine Anpassung darf ausschließlich ärztlich erfolgen.'
  },
  immunosuppressants: {
    keywords: ['tacrolimus', 'ciclosporin', 'mycophenolat', 'azathioprin', 'sirolimus',
               'everolimus', 'certolizumab', 'infliximab'],
    badge: { text: 'kritische Dauertherapie', color: 'bg-orange-50 text-orange-800 border border-orange-200' },
    hint: 'Hinweis: Medikamente zur Verhinderung einer Organabstoßung sind in der Regel unverzichtbar. MEDLESS berechnet hierfür keinen vollständigen Ausschleichplan, zeigt aber die Belastung im Überblick.'
  },
  opioids: {
    keywords: ['morphin', 'oxycodon', 'fentanyl', 'hydromorphon', 'tramadol', 
               'tilidin', 'buprenorphin', 'pethidin', 'tapentadol'],
    badge: { text: 'vorsichtig reduzieren', color: 'bg-yellow-50 text-yellow-800 border border-yellow-200' },
    hint: 'Hinweis: Starke Schmerzmittel erfordern ein langsames, begleitetes Ausschleichen. MEDLESS kann einen theoretischen Verlauf berechnen – die Umsetzung darf nur in ärztlicher Abstimmung erfolgen.'
  }
};

/**
 * Klassifiziert ein Medikament basierend auf Name/Generic Name
 * @param {string} medicationName - Name des Medikaments
 * @param {string} genericName - Generischer Name (optional)
 * @returns {Object|null} Classification object oder null
 */
function classifyMedication(medicationName, genericName = '') {
  const searchText = `${medicationName} ${genericName}`.toLowerCase();
  
  for (const [key, classification] of Object.entries(MEDICATION_CLASSIFICATIONS)) {
    if (classification.keywords.some(keyword => searchText.includes(keyword))) {
      return { type: key, ...classification };
    }
  }
  
  return null;
}

/**
 * Prüft ob mindestens ein Medikament in höherer Risikogruppe ist
 * @param {Array} medications - Array von Medikamenten
 * @returns {boolean}
 */
function hasHighRiskMedication(medications) {
  return medications.some(med => {
    const classification = classifyMedication(med.name || '', med.generic_name || '');
    return classification !== null;
  });
}

/**
 * Konvertiert Tailwind-Klassen zu inline CSS für Badges
 * @param {string} tailwindClasses - Tailwind CSS Klassen
 * @returns {string} Inline CSS String
 */
function getBadgeStyles(tailwindClasses) {
  // Map common Tailwind colors to CSS
  const colorMap = {
    'bg-yellow-50': 'background-color: #fefce8',
    'text-yellow-800': 'color: #854d0e',
    'border-yellow-200': 'border: 1px solid #fef08a',
    'bg-orange-50': 'background-color: #fff7ed',
    'text-orange-800': 'color: #9a3412',
    'border-orange-200': 'border: 1px solid #fed7aa',
  };
  
  const styles = [];
  const classes = tailwindClasses.split(' ');
  
  classes.forEach(cls => {
    if (colorMap[cls]) {
      styles.push(colorMap[cls]);
    }
  });
  
  return styles.join('; ');
}

// ============================================================
// MEDLESS Product Data - CBD Dosier-Sprays (for frontend calculations)
// ============================================================
const MEDLESS_PRODUCTS = [
  { nr: 5,  cbdPerSpray: 5.8,  name: 'MEDLESS Nr. 5',  price: 24.90 },
  { nr: 10, cbdPerSpray: 11.5, name: 'MEDLESS Nr. 10', price: 39.90 },
  { nr: 15, cbdPerSpray: 17.5, name: 'MEDLESS Nr. 15', price: 59.90 },
  { nr: 20, cbdPerSpray: 23.2, name: 'MEDLESS Nr. 20', price: 79.90 },
  { nr: 25, cbdPerSpray: 29.0, name: 'MEDLESS Nr. 25', price: 99.90 }
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

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', () => {
  loadMedications();
  
  // Create first medication input field
  createMedicationInput();
  
  // Setup "add medication" button handler
  const addButton = document.getElementById('add-medication');
  if (addButton) {
    addButton.addEventListener('click', () => {
      createMedicationInput();
    });
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
        
        // Store medication data for later use
        const hiddenInput = input.closest('.medication-input-group').querySelector('.medication-name-hidden');
        if (hiddenInput) {
          hiddenInput.value = med.name;
          hiddenInput.dataset.genericName = med.generic_name || '';
        }
        
        // Show safety hint if applicable
        showMedicationSafetyHint(input.closest('.medication-input-group'), med.name, med.generic_name);
        
        closeAllLists();
        
        // Focus auf Dosierungs-Eingabefeld setzen
        const dosageInput = input.closest('.medication-input-group').querySelector('input[name="medication_mg_per_day[]"]');
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

/**
 * Zeigt Safety-Hinweis für ein Medikament an
 * @param {HTMLElement} inputGroup - Das Medikamenten-Input-Container-Element
 * @param {string} medicationName - Name des Medikaments
 * @param {string} genericName - Generischer Name (optional)
 */
function showMedicationSafetyHint(inputGroup, medicationName, genericName = '') {
  // Entferne existierenden Hinweis
  const existingHint = inputGroup.querySelector('.medication-safety-hint');
  if (existingHint) {
    existingHint.remove();
  }
  
  // Entferne existierendes Badge
  const existingBadge = inputGroup.querySelector('.medication-safety-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  // Klassifiziere Medikament
  const classification = classifyMedication(medicationName, genericName);
  
  if (!classification) {
    updateGlobalSafetyNotice(); // Update global notice even if this med has no hint
    return; // Kein Hinweis nötig für dieses Medikament
  }
  
  // Füge Badge neben Medikamentennamen hinzu
  const nameLabel = inputGroup.querySelector('label');
  if (nameLabel && classification.badge) {
    const badge = document.createElement('span');
    badge.className = 'medication-safety-badge';
    badge.style.cssText = `
      display: inline-block;
      margin-left: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      ${getBadgeStyles(classification.badge.color)}
    `;
    badge.textContent = classification.badge.text;
    nameLabel.appendChild(badge);
  }
  
  // Erstelle Hinweis-Element
  const hintDiv = document.createElement('div');
  hintDiv.className = 'medication-safety-hint';
  hintDiv.style.cssText = 'margin-top: 0.5rem; padding: 0.75rem; background-color: #f9fafb; border-left: 3px solid #9ca3af; border-radius: 4px;';
  hintDiv.innerHTML = `
    <p style="margin: 0; font-size: 0.875rem; line-height: 1.5; color: #6b7280;">
      ${classification.hint}
    </p>
  `;
  
  // Füge Hinweis unter dem Medikamentennamen-Input ein
  const inputWrapper = inputGroup.querySelector('div[style*="position: relative"]');
  if (inputWrapper) {
    inputWrapper.appendChild(hintDiv);
  }
  
  // Update global safety notice
  updateGlobalSafetyNotice();
}

/**
 * Aktualisiert oder zeigt den globalen Safety-Hinweis unter der Medikamentenliste
 */
function updateGlobalSafetyNotice() {
  const container = document.getElementById('medication-inputs');
  if (!container) return;
  
  // Entferne existierenden globalen Hinweis
  const existingNotice = document.getElementById('global-safety-notice');
  if (existingNotice) {
    existingNotice.remove();
  }
  
  // Sammle alle eingegebenen Medikamente
  const medicationInputs = container.querySelectorAll('.medication-display-input');
  const medications = [];
  
  medicationInputs.forEach(input => {
    const name = input.value.trim();
    if (name) {
      const hiddenInput = input.closest('.medication-input-group').querySelector('.medication-name-hidden');
      const genericName = hiddenInput?.dataset?.genericName || '';
      medications.push({ name, genericName });
    }
  });
  
  // Prüfe ob mindestens ein High-Risk Medikament dabei ist
  const hasHighRisk = hasHighRiskMedication(medications);
  
  if (!hasHighRisk || medications.length === 0) {
    return; // Kein Hinweis nötig
  }
  
  // Erstelle globalen Hinweis
  const noticeDiv = document.createElement('div');
  noticeDiv.id = 'global-safety-notice';
  noticeDiv.style.cssText = 'margin-top: 1.5rem; padding: 1.25rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;';
  noticeDiv.innerHTML = `
    <h4 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600; color: #374151;">
      <i class="fas fa-info-circle" style="color: #6b7280; margin-right: 0.5rem;"></i>
      MedLess-Hinweis zu Ihrer Medikation
    </h4>
    <p style="margin: 0; font-size: 0.875rem; line-height: 1.6; color: #6b7280;">
      Bei einigen Ihrer Medikamente ist ein besonders vorsichtiges Vorgehen empfohlen. 
      Der berechnete Ausschleichplan ist nur eine theoretische Orientierung und ersetzt keine ärztliche Entscheidung. 
      <strong style="color: #374151;">Bitte besprechen Sie alle Änderungen mit Ihrem behandelnden Arzt.</strong>
    </p>
  `;
  
  // Füge Hinweis nach dem medication-inputs Container ein
  const addButton = document.getElementById('add-medication');
  if (addButton && addButton.parentNode) {
    addButton.parentNode.insertBefore(noticeDiv, addButton.nextSibling);
  }
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
      updateGlobalSafetyNotice(); // Update global notice after removal
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

// Medication button handler now set up in main DOMContentLoaded listener above

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

// Validation helper functions
function showFieldError(input, message) {
  // Remove existing error
  clearFieldError(input);
  
  // Add error styling to input
  input.style.borderColor = '#dc2626';
  input.style.backgroundColor = '#fef2f2';
  
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error-message';
  errorDiv.style.cssText = `
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: fadeInError 0.3s ease-in-out;
  `;
  errorDiv.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <span>${message}</span>
  `;
  
  // Insert after input or its parent container
  const container = input.closest('.form-row') || input.parentElement;
  container.appendChild(errorDiv);
  
  // Scroll to error
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFieldError(input) {
  // Reset input styling
  input.style.borderColor = '';
  input.style.backgroundColor = '';
  
  // Remove error message
  const container = input.closest('.form-row') || input.parentElement;
  const errorMsg = container.querySelector('.field-error-message');
  if (errorMsg) {
    errorMsg.remove();
  }
}

function clearAllErrors() {
  document.querySelectorAll('.field-error-message').forEach(el => el.remove());
  document.querySelectorAll('input, select').forEach(input => {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Handle manual form submission with comprehensive validation
document.getElementById('medication-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Clear all previous errors
  clearAllErrors();
  
  const form = e.target;
  let hasErrors = false;
  let firstErrorField = null;
  
  // === SCHRITT 1: Persönliche Daten ===
  const firstNameInput = form.querySelector('input[name="first_name"]');
  const firstName = firstNameInput.value.trim();
  if (!firstName) {
    showFieldError(firstNameInput, 'Bitte geben Sie Ihren Vornamen an.');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = firstNameInput;
  }
  
  const genderInputs = form.querySelectorAll('input[name="gender"]');
  const gender = form.querySelector('input[name="gender"]:checked')?.value;
  if (!gender) {
    // Show error on first gender radio button
    const genderContainer = genderInputs[0].closest('.form-row');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error-message';
    errorDiv.style.cssText = `
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>Bitte wählen Sie Ihr Geschlecht aus.</span>
    `;
    genderContainer.appendChild(errorDiv);
    hasErrors = true;
    if (!firstErrorField) firstErrorField = genderInputs[0];
  }
  
  // === SCHRITT 2: Gesundheitsdaten (Optional, aber wenn ausgefüllt dann validieren) ===
  const ageInput = form.querySelector('input[name="age"]');
  const age = parseInt(ageInput.value) || null;
  if (ageInput.value && (!age || age < 1 || age > 120)) {
    showFieldError(ageInput, 'Bitte geben Sie ein gültiges Alter ein (1-120 Jahre).');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = ageInput;
  }
  
  const weightInput = form.querySelector('input[name="weight"]');
  const weight = parseFloat(weightInput.value) || null;
  if (weightInput.value && (!weight || weight < 1 || weight > 500)) {
    showFieldError(weightInput, 'Bitte geben Sie ein gültiges Körpergewicht ein (1-500 kg).');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = weightInput;
  }
  
  const heightInput = form.querySelector('input[name="height"]');
  const height = parseFloat(heightInput.value) || null;
  if (heightInput.value && (!height || height < 50 || height > 300)) {
    showFieldError(heightInput, 'Bitte geben Sie eine gültige Körpergröße ein (50-300 cm).');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = heightInput;
  }
  
  // === SCHRITT 3: Medikamente ===
  const medicationNames = form.querySelectorAll('input[name="medication_display[]"], input.medication-display-input');
  const medicationMgPerDay = form.querySelectorAll('input[name="medication_mg_per_day[]"]');
  
  const medications = [];
  let hasMedicationError = false;
  
  medicationNames.forEach((nameInput, index) => {
    const name = nameInput.value.trim();
    const mgInput = medicationMgPerDay[index];
    const mgPerDayValue = parseFloat(mgInput?.value);
    
    if (name) {
      // Validate mg/day is provided and valid
      if (!mgInput || !mgInput.value || !mgPerDayValue || isNaN(mgPerDayValue) || mgPerDayValue <= 0) {
        showFieldError(mgInput, `Bitte geben Sie eine gültige Tagesdosis in mg an (größer als 0).`);
        hasErrors = true;
        hasMedicationError = true;
        if (!firstErrorField) firstErrorField = mgInput;
      } else {
        medications.push({
          name: name,
          dosage: `${mgPerDayValue} mg/Tag`,
          mgPerDay: mgPerDayValue
        });
      }
    } else if (mgInput && mgInput.value) {
      // Has dosage but no medication name
      showFieldError(nameInput, 'Bitte geben Sie den Medikamentennamen an.');
      hasErrors = true;
      hasMedicationError = true;
      if (!firstErrorField) firstErrorField = nameInput;
    }
  });
  
  if (medications.length === 0 && !hasMedicationError) {
    const firstMedInput = medicationNames[0];
    if (firstMedInput) {
      showFieldError(firstMedInput, 'Bitte geben Sie mindestens ein Medikament an.');
      hasErrors = true;
      if (!firstErrorField) firstErrorField = firstMedInput;
    }
  }
  
  // === SCHRITT 4: Reduktionsplan ===
  const durationSelect = form.querySelector('select[name="duration_weeks"]');
  const durationWeeks = parseInt(durationSelect.value);
  if (!durationWeeks || isNaN(durationWeeks)) {
    showFieldError(durationSelect, 'Bitte wählen Sie eine Plan-Dauer aus.');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = durationSelect;
  }
  
  const reductionSelect = form.querySelector('select[name="reduction_goal"]');
  const reductionGoal = parseInt(reductionSelect.value);
  if (!reductionGoal || isNaN(reductionGoal)) {
    showFieldError(reductionSelect, 'Bitte wählen Sie ein Reduktionsziel aus.');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = reductionSelect;
  }
  
  // === SCHRITT 5: E-Mail ===
  const emailInput = form.querySelector('input[name="email"]');
  const email = emailInput.value.trim();
  if (!email) {
    showFieldError(emailInput, 'Bitte geben Sie Ihre E-Mail-Adresse an.');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = emailInput;
  } else if (!validateEmail(email)) {
    showFieldError(emailInput, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
    hasErrors = true;
    if (!firstErrorField) firstErrorField = emailInput;
  }
  
  // If there are validation errors, scroll to first error and stop
  if (hasErrors) {
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorField.focus();
    }
    return;
  }
  
  // === VALIDATION SUCCESSFUL - START KI CALCULATION ===
  // Disable form
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.style.opacity = '0.6';
    submitButton.style.cursor = 'not-allowed';
  }
  
  // Disable all inputs
  form.querySelectorAll('input, select, button').forEach(el => {
    if (el !== submitButton) el.disabled = true;
  });
  
  // Start analysis with loading animation
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
              
              // Register button click handler for "Plan jetzt anzeigen"
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
                      
                      // Hide loading after fade-out
                      setTimeout(() => {
                        loadingEl.classList.add('hidden');
                        loadingEl.style.opacity = '1';
                        loadingEl.style.transform = 'scale(1)';
                        console.log('✅ Loading hidden, resolving animation promise');
                        resolve();
                      }, 800);
                    } else {
                      resolve();
                    }
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
      console.log('🎉 API successful - showing interstitial screen');
      
      // Show plan-ready interstitial screen
      const interstitialEl = document.getElementById('plan-ready-interstitial');
      const resultsDiv = document.getElementById('results');
      
      if (interstitialEl) {
        // Show interstitial with fade-in
        interstitialEl.classList.remove('hidden');
        interstitialEl.style.opacity = '0';
        interstitialEl.style.transform = 'translateY(20px)';
        
        // Smooth scroll to interstitial
        setTimeout(() => {
          interstitialEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // Fade in animation
        setTimeout(() => {
          interstitialEl.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          interstitialEl.style.opacity = '1';
          interstitialEl.style.transform = 'translateY(0)';
        }, 150);
        
        // Setup button click handler for "Plan jetzt ansehen"
        const showResultsButton = document.getElementById('show-results-button');
        if (showResultsButton) {
          showResultsButton.addEventListener('click', () => {
            console.log('🎯 User clicked "Plan jetzt ansehen" - showing results');
            
            // Change button to loading state
            showResultsButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird geladen...';
            showResultsButton.disabled = true;
            
            // OPTIMIZED ANIMATION: Schneller, subtiler Fade-Out (180-220ms)
            setTimeout(() => {
              // Zwischen-Screen: Sanftes Ausfaden mit minimalem Slide nach oben
              interstitialEl.style.transition = 'opacity 200ms ease-out, transform 200ms ease-out';
              interstitialEl.style.opacity = '0';
              interstitialEl.style.transform = 'translateY(-8px)';
              
              // Nach Fade-Out: Zwischen-Screen entfernen und Plan anzeigen
              setTimeout(() => {
                // Hide interstitial completely
                interstitialEl.classList.add('hidden');
                interstitialEl.style.transition = '';
                
                // Display results (NO LOGIC CHANGE - just display)
                try {
                  console.log('📊 Calling displayResults()');
                  displayResults(response.data, firstName, gender);
                  console.log('✅ displayResults() completed successfully');
                  
                  // OPTIMIZED ANIMATION: Ruhiger, professioneller Fade-In (300-400ms)
                  if (resultsDiv) {
                    // Initial state: unsichtbar, leicht nach unten versetzt
                    resultsDiv.classList.remove('hidden');
                    resultsDiv.style.opacity = '0';
                    resultsDiv.style.transform = 'translateY(25px)';
                    
                    // Smooth scroll to results
                    setTimeout(() => {
                      resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                    
                    // Fade-In Animation: 350ms ease-out für medizinische Ruhe
                    setTimeout(() => {
                      resultsDiv.style.transition = 'opacity 350ms ease-out, transform 350ms ease-out';
                      resultsDiv.style.opacity = '1';
                      resultsDiv.style.transform = 'translateY(0)';
                    }, 100);
                  }
                } catch (displayError) {
                  console.error('❌ ERROR in displayResults():', displayError);
                  console.error('Stack trace:', displayError.stack);
                  alert('Fehler beim Anzeigen der Ergebnisse: ' + displayError.message);
                }
              }, 200);
            }, 100);
          });
        }
      }
    } else {
      throw new Error(response.data.error || 'Analyse fehlgeschlagen');
    }
  } catch (error) {
    console.error('❌ Fehler bei der Analyse:', error);
    alert('Fehler bei der Analyse: ' + (error.response?.data?.error || error.message));
    // Hide loading on error
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
      <h1 style="margin: 0 0 0.75rem; font-size: 1.6rem; line-height: 1.2; color: #0b7b6c; font-weight: 700;">
        Ihr persönlicher MedLess-Dosierungs- und Reduktionsplan
      </h1>
      <p style="margin: 0 0 0.875rem; font-size: 0.95rem; line-height: 1.6; color: #4b5563;">
        Dieser Plan zeigt Ihnen eine strukturierte, medizinisch fundierte Kombination aus CBD-Dosierung und schrittweiser Medikamentenreduktion. 
        Er basiert auf Ihren Eingaben und bekannten pharmakologischen Daten.
      </p>
      <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #4b5563;">
        <strong style="color: #0b7b6c;">Er ersetzt keine ärztliche Entscheidung. Bitte besprechen Sie jede Änderung mit Ihrem behandelnden Arzt.</strong>
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
      <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 16px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 1.25rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">💰 Benötigte Produkte für Ihren vollständigen Plan</h2>
        
        <!-- Produkttabelle mit sauberen Linien -->
        <div class="table-container" style="overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1.25rem; background: #fafafa; border-radius: 8px; padding: 0.5rem;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 0.875rem 0.75rem; font-weight: 600; color: #374151; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Produkt</th>
                <th style="text-align: center; padding: 0.875rem 0.75rem; font-weight: 600; color: #374151; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">mg/Hub</th>
                <th style="text-align: center; padding: 0.875rem 0.75rem; font-weight: 600; color: #374151; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Anzahl</th>
                <th style="text-align: right; padding: 0.875rem 0.75rem; font-weight: 600; color: #374151; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Stückpreis</th>
                <th style="text-align: right; padding: 0.875rem 0.75rem; font-weight: 600; color: #374151; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${costs.costBreakdown.map((item, idx) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 0.875rem 0.75rem; color: #1f2937; font-weight: 500;">${item.product}</td>
                  <td style="padding: 0.875rem 0.75rem; text-align: center; color: #6b7280;">${item.productNr ? (MEDLESS_PRODUCTS.find(p => p.nr === item.productNr)?.cbdPerSpray.toFixed(1) || '–') : '–'}</td>
                  <td style="padding: 0.875rem 0.75rem; text-align: center; color: #6b7280;">${item.bottleCount}×</td>
                  <td style="padding: 0.875rem 0.75rem; text-align: right; color: #6b7280;">${item.pricePerBottle.toFixed(2)} €</td>
                  <td style="padding: 0.875rem 0.75rem; text-align: right; font-weight: 600; color: #0b7b6c;">${item.totalCost.toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Gesamtkosten Card -->
        <div style="padding: 1.25rem 1.5rem; border-radius: 12px; background: linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%); border: 1px solid #d1fae5;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.875rem; border-bottom: 1px solid #d1fae5;">
            <div>
              <p style="margin: 0 0 0.25rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500;">Gesamtkosten</p>
              <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">des vollständigen Programms</p>
            </div>
            <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #0b7b6c; letter-spacing: -0.02em;">${costs.totalCost.toFixed(2)} €</p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">∅ Kosten pro Woche</p>
            <p style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #047857;">${avgPerWeek} €</p>
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
      <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 16px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 1.25rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Ihre Ausgangsdaten</h2>
        
        <!-- 2x2 Grid für bessere Übersicht -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
          ${personalization.age ? `
            <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
              <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Alter</p>
              <p style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0;">${personalization.age}</p>
              <p style="font-size: 0.8rem; color: #6b7280; margin: 0.25rem 0 0;">Jahre</p>
            </div>
          ` : ''}
          ${personalization.weight ? `
            <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
              <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Gewicht</p>
              <p style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0;">${personalization.weight}</p>
              <p style="font-size: 0.8rem; color: #6b7280; margin: 0.25rem 0 0;">kg</p>
            </div>
          ` : ''}
          ${personalization.height ? `
            <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
              <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Größe</p>
              <p style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0;">${personalization.height}</p>
              <p style="font-size: 0.8rem; color: #6b7280; margin: 0.25rem 0 0;">cm</p>
            </div>
          ` : ''}
          ${personalization.bmi ? `
            <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
              <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">BMI</p>
              <p style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0;">${personalization.bmi.toFixed(1)}</p>
              <p style="font-size: 0.8rem; color: #6b7280; margin: 0.25rem 0 0;">Body-Mass-Index</p>
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
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 16px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 1.25rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Ihre aktuelle Medikation</h2>
      
      <div style="display: flex; flex-direction: column; gap: 1rem;">
  `;
  
  analysis.forEach((item) => {
    const med = item.medication;
    const interactions = item.interactions;
    const hasInteractions = interactions && interactions.length > 0;
    
    // Klassifiziere Medikament für Badge und Hinweis
    const classification = classifyMedication(med.name || '', med.generic_name || '');
    
    // Tagesdosis mit Fallback
    const dosageDisplay = item.dosage || item.mgPerDay ? `${item.mgPerDay} mg/Tag` : '– keine Angabe';
    
    html += `
      <div style="padding: 1.25rem; border-radius: 12px; background: #fafafa; border: 1px solid #e5e7eb;">
        <!-- Medikament Header: Name, Generic Name, Dosis in einer Zeile -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
              <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: #1f2937;">${med.name || '–'}</h3>
              ${classification && classification.badge ? `
                <span style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; ${getBadgeStyles(classification.badge.color)}">
                  ${classification.badge.text}
                </span>
              ` : ''}
            </div>
            ${med.generic_name ? `<p style="margin: 0; font-size: 0.8rem; color: #9ca3af;">${med.generic_name}</p>` : ''}
          </div>
          <div style="text-align: right; padding-left: 1rem;">
            <p style="margin: 0 0 0.25rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">Dosis</p>
            <p style="margin: 0; font-size: 1rem; font-weight: 600; color: #1f2937;">${dosageDisplay}</p>
          </div>
        </div>
        
        <!-- Category-spezifischer Hinweis -->
        ${classification && classification.hint ? `
          <div style="margin-top: 0.875rem; padding: 0.875rem; background-color: white; border-left: 3px solid #9ca3af; border-radius: 6px;">
            <p style="margin: 0; font-size: 0.8rem; line-height: 1.6; color: #6b7280;">
              ${classification.hint}
            </p>
          </div>
        ` : ''}
        
        <!-- Wechselwirkungen -->
        ${hasInteractions ? `
          <div style="margin-top: 0.875rem; padding: 0.875rem; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.625rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; font-weight: 500;">Wechselwirkungen:</p>
            ${interactions.map(i => `
              <div style="margin-bottom: 0.625rem; font-size: 0.85rem; line-height: 1.5;">
                <p style="margin: 0; font-weight: 600; color: #374151;">${i.description || '–'}</p>
                ${i.recommendation ? `<p style="margin: 0.375rem 0 0; color: #6b7280;">${i.recommendation}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="margin: 0.875rem 0 0; font-size: 0.85rem; color: #9ca3af; font-style: italic;">Keine bekannten Wechselwirkungen mit Cannabinoiden</p>
        `}
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  // ============================================================
  // MEDIKAMENTEN-SPEZIFISCHE KATEGORIE-HINWEISE
  // ============================================================
  
  // Sammle alle Medikamenten-Kategorien
  const analysisWithMeds = analysis.map(item => ({
    name: item.medication?.name || '',
    genericName: item.medication?.generic_name || ''
  }));
  
  const categoryHints = [];
  const detectedCategories = new Set();
  
  // Prüfe jedes Medikament auf Kategorie
  analysisWithMeds.forEach(med => {
    const classification = classifyMedication(med.name, med.genericName);
    if (classification) {
      detectedCategories.add(classification.type);
    }
  });
  
  // Definiere kategorie-spezifische Hinweise
  const CATEGORY_SPECIFIC_HINTS = {
    benzodiazepines: 'Bei Benzodiazepinen und Schlafmitteln ist ein langsames, stufenweises Ausschleichen wichtig. Der hier dargestellte Verlauf ist eine mögliche Orientierung – Tempo und Schritte sollten individuell durch Ihren Arzt angepasst werden.',
    antidepressants: 'Antidepressiva sollten nicht abrupt beendet werden. Ein zu schneller Wechsel kann zu Absetzsymptomen oder einem Wiederaufflammen der Beschwerden führen. Nutzen Sie diesen Plan nur als Grundlage für das Gespräch mit Ihrem Arzt.',
    anticoagulants: 'Blutverdünner werden häufig langfristig oder dauerhaft eingesetzt, zum Beispiel zum Schutz vor Schlaganfall oder Thrombosen. MEDLESS macht hier nur sehr vorsichtige oder keine Reduktionsvorschläge. Eine mögliche Anpassung muss immer ärztlich entschieden werden.',
    immunosuppressants: 'Medikamente zur Verhinderung einer Organabstoßung sind in der Regel unverzichtbar. In diesem Plan wird keine vollständige Reduktion bis 0 mg vorgeschlagen. Änderungen dürfen nur in spezialisierten Zentren erfolgen.',
    opioids: 'Starke Schmerzmittel sollten immer unter engmaschiger ärztlicher Kontrolle reduziert werden. MEDLESS kann helfen, einen möglichen Verlauf zu strukturieren – ersetzt aber keine persönliche Betreuung.',
    antiepileptics: 'Antiepileptika erfordern ein sehr vorsichtiges Ausschleichen. Ein abruptes Absetzen kann zu schweren Anfällen führen. Jede Dosisänderung sollte nur in enger Abstimmung mit Ihrem Neurologen erfolgen.'
  };
  
  // Sammle relevante Hinweise
  detectedCategories.forEach(category => {
    if (CATEGORY_SPECIFIC_HINTS[category]) {
      categoryHints.push(CATEGORY_SPECIFIC_HINTS[category]);
    }
  });
  
  // Zeige kategorie-spezifische Hinweise (maximal 4)
  if (categoryHints.length > 0) {
    html += `
      <div style="margin-top: 1.2rem; padding: 1.25rem 1.5rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h4 style="margin: 0 0 0.875rem; font-size: 1rem; font-weight: 600; color: #374151;">
          Hinweise zu Ihrer Medikation
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${categoryHints.slice(0, 4).map(hint => `
            <p style="margin: 0; font-size: 0.875rem; line-height: 1.6; color: #6b7280;">
              ${hint}
            </p>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Globaler Safety-Hinweis wenn High-Risk Medikamente vorhanden (aber keine kategorie-spezifischen)
  if ((hasHighRiskMedication(analysisWithMeds) || maxSeverity === 'high' || maxSeverity === 'critical') && categoryHints.length === 0) {
    html += `
      <div style="margin-top: 1.2rem; padding: 1.25rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h4 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600; color: #374151;">
          <i class="fas fa-info-circle" style="color: #6b7280; margin-right: 0.5rem;"></i>
          MedLess-Hinweis zu Ihrer Medikation
        </h4>
        <p style="margin: 0; font-size: 0.875rem; line-height: 1.6; color: #6b7280;">
          Bei einigen Ihrer Medikamente ist ein besonders vorsichtiges Vorgehen empfohlen. 
          Der berechnete Ausschleichplan ist nur eine theoretische Orientierung und ersetzt keine ärztliche Entscheidung. 
          <strong style="color: #374151;">Bitte besprechen Sie alle Änderungen mit Ihrem behandelnden Arzt.</strong>
        </p>
      </div>
    `;
  }
  
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
      <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 16px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 1.25rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Ihre CBD-Dosierungsempfehlung</h2>
        
        <!-- Horizontale Info-Kacheln -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Start-Dosis</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #0b7b6c; margin: 0;">${personalization.cbdStartMg.toFixed(1)}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">mg CBD</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Ziel-Dosis</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #0b7b6c; margin: 0;">${personalization.cbdEndMg.toFixed(1)}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">mg CBD</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Wöchentlich</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #0b7b6c; margin: 0;">+${((personalization.cbdEndMg - personalization.cbdStartMg) / weeklyPlan.length).toFixed(1)}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">mg CBD</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Produkt</p>
            <p style="font-size: 1.125rem; font-weight: 700; color: #1f2937; margin: 0;">${product.name}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">empfohlen</p>
          </div>
        </div>
        
        <!-- CBD-Anwendung pro Tag (klar getrennt) -->
        <div style="padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, #ecfdf5 0%, #f9fafb 100%); border: 1px solid #d1fae5;">
          <h3 style="margin: 0 0 1rem; font-size: 0.9rem; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;">CBD-Anwendung pro Tag</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;">
            <div style="text-align: center; padding: 0.75rem; background: white; border-radius: 8px;">
              <p style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">Morgens</p>
              <p style="margin: 0; font-size: 2.5rem; font-weight: 700; color: #0b7b6c; line-height: 1;">${product.morningSprays}×</p>
              <p style="margin: 0.375rem 0 0; font-size: 0.75rem; color: #6b7280;">Sprühstöße</p>
            </div>
            <div style="text-align: center; padding: 0.75rem; background: white; border-radius: 8px;">
              <p style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">Abends</p>
              <p style="margin: 0; font-size: 2.5rem; font-weight: 700; color: #0b7b6c; line-height: 1;">${product.eveningSprays}×</p>
              <p style="margin: 0.375rem 0 0; font-size: 0.75rem; color: #6b7280;">Sprühstöße</p>
            </div>
            <div style="text-align: center; padding: 0.75rem; background: white; border-radius: 8px; border: 2px solid #0b7b6c;">
              <p style="margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #047857; font-weight: 600;">Gesamt</p>
              <p style="margin: 0; font-size: 2.5rem; font-weight: 700; color: #0b7b6c; line-height: 1;">${product.totalSpraysPerDay}×</p>
              <p style="margin: 0.375rem 0 0; font-size: 0.75rem; color: #047857; font-weight: 500;">pro Tag</p>
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
    <div style="margin-top: 1.2rem; padding: 1.5rem 1.3rem; border-radius: 16px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 1.25rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Wöchentlicher Reduktionsplan</h2>
  `;

  // Wöchentlicher Reduktionsplan - Jede Woche eigene Box mit klarerem Schatten
  weeklyPlan.forEach((week, weekIndex) => {
    html += `
      <div style="margin-bottom: 1.5rem; padding: 1.5rem; border-radius: 12px; background: white; border: 2px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <!-- Wochentitel mit Untertitel -->
        <div style="margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 2px solid #f3f4f6;">
          <h3 style="margin: 0 0 0.25rem; font-size: 1.125rem; font-weight: 700; color: #0b7b6c;">Woche ${week.week}</h3>
          <p style="margin: 0; font-size: 0.8rem; color: #9ca3af;">Medikamenten- und CBD-Anpassung</p>
        </div>
        
        <!-- Medikamenten-Dosierung Tabelle -->
        <h4 style="margin: 0 0 0.875rem; font-size: 0.85rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Medikamenten-Dosierung</h4>
        <div class="table-container" style="overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1.25rem; background: #fafafa; border-radius: 8px; padding: 0.5rem;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 0.75rem 0.625rem; font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Medikament</th>
                <th style="text-align: center; padding: 0.75rem 0.625rem; font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Start</th>
                <th style="text-align: center; padding: 0.75rem 0.625rem; font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Woche ${week.week}</th>
                <th style="text-align: center; padding: 0.75rem 0.625rem; font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Ziel</th>
                <th style="text-align: center; padding: 0.75rem 0.625rem; font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Änderung</th>
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
        <h4 style="margin: 1.5rem 0 1rem; font-size: 0.85rem; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;">CBD-Dosierung</h4>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem;">
          <div style="padding: 1rem; background: #f0fdf4; border-radius: 8px; text-align: center; border: 1px solid #d1fae5;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">CBD mg/Tag</p>
            <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #0b7b6c;">${week.cbdDose}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #6b7280;">mg</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Produkt</p>
            <p style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #1f2937;">${week.kannasanProduct.name}</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Morgens</p>
            <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1f2937;">${week.morningSprays}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #6b7280;">Sprühstöße</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Abends</p>
            <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1f2937;">${week.eveningSprays}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #6b7280;">Sprühstöße</p>
          </div>
        </div>
        
        <div style="padding: 1rem; border-radius: 8px; background: linear-gradient(135deg, #ecfdf5 0%, #f9fafb 100%); border: 1px solid #d1fae5; text-align: center;">
          <p style="margin: 0; font-size: 0.8rem; color: #047857;"><strong>Gesamt:</strong> ${week.totalSprays} Sprühstöße täglich = <strong style="font-size: 1.1rem; color: #0b7b6c;">${week.actualCbdMg} mg CBD</strong></p>
        </div>
        
        <!-- Fläschchen-Status -->
        ${week.bottleStatus ? `
        <h4 style="margin: 1.5rem 0 1rem; font-size: 0.85rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Fläschchen-Status</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Verbraucht</p>
            <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1f2937;">${week.bottleStatus.used}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #6b7280;">von ${week.bottleStatus.totalCapacity} Hüben</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Verbleibend</p>
            <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1f2937;">${week.bottleStatus.remaining}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #6b7280;">Hübe</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 0.5rem; font-size: 0.7rem; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Leer in</p>
            <p style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1f2937;">~${week.bottleStatus.emptyInWeeks}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.75rem; color: #6b7280;">Wochen</p>
          </div>
        </div>
        
        <div style="padding: 1rem; border-radius: 8px; font-size: 0.85rem; text-align: center; ${week.bottleStatus.productChangeNext ? 'background: linear-gradient(135deg, #fef3c7 0%, #fef9f3 100%); border: 1px solid #fde68a; color: #92400e;' : 'background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%); border: 1px solid #a7f3d0; color: #065f46;'}">
          <strong>💡 Empfehlung:</strong> ${week.bottleStatus.productChangeNext ? 'Produktwechsel in nächster Woche erforderlich' : 'Aktuelles Fläschchen weiterverwenden'}
        </div>
        ` : ''}
        
        ${(() => {
          // Prüfe ob in dieser Woche ein High-Risk-Medikament reduziert wird
          const hasReduction = week.medications.some(med => {
            // Finde das Medikament in der Analyse
            const medData = analysis.find(a => 
              a.medication.name.toLowerCase().includes(med.name.toLowerCase()) || 
              med.name.toLowerCase().includes(a.medication.name.toLowerCase())
            );
            
            if (!medData) return false;
            
            // Klassifiziere das Medikament
            const classification = classifyMedication(medData.medication.name, medData.medication.generic_name);
            
            // Prüfe ob es High-Risk ist UND reduziert wird
            if (classification && (med.startMg - med.currentMg) > 0) {
              return true;
            }
            
            return false;
          });
          
          // Zeige Hinweis nur wenn tatsächlich reduziert wird
          if (hasReduction) {
            return `
              <div style="margin-top: 1rem; padding: 0.75rem; background-color: #fef9f3; border-left: 3px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; font-size: 0.8rem; line-height: 1.5; color: #92400e;">
                  <strong>Hinweis:</strong> In dieser Woche wird mindestens ein sensibles Medikament reduziert. Bitte achten Sie auf Veränderungen Ihres Befindens und besprechen Sie Auffälligkeiten mit Ihrem Arzt.
                </p>
              </div>
            `;
          }
          return '';
        })()}
      </div>
    `;
  });
  
  html += `
    </div>
  `;

  // ============================================================
  // 7. MEDIZINISCHE HINWEISE (Dark Background)
  // ============================================================
  
  html += `
    <div style="margin-top: 1.5rem; padding: 2rem 1.5rem; border-radius: 16px; background: #f3f4f6; border: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 1.5rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c; text-align: center;">⚕️ Wichtige medizinische Hinweise</h2>
      
      <!-- Allgemeine Hinweise -->
      <div style="margin-bottom: 2rem;">
        <h3 style="margin: 0 0 1rem; font-size: 0.9rem; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.05em;">Allgemeine Hinweise</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem; color: #374151;">
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Theoretischer Plan:</strong> Die Berechnungen von MedLess zeigen theoretische Möglichkeiten der Reduktion. Ob und in welchem Tempo tatsächlich reduziert wird, entscheidet immer Ihr Arzt.</p>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Besondere Medikamentengruppen:</strong> Bei Blutverdünnern, Immunsuppressiva, Antidepressiva, Antiepileptika, Benzodiazepinen und starken Schmerzmitteln ist ein besonders vorsichtiges Vorgehen erforderlich.</p>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Keine selbstständige Medikamentenänderung:</strong> Reduzieren Sie Medikamente ausschließlich unter ärztlicher Aufsicht. Eigenständige Änderungen können gesundheitsgefährdend sein.</p>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Niemals abrupt absetzen:</strong> Setzen Sie Medikamente niemals abrupt ab - immer schrittweise gemäß ärztlichem Plan.</p>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Bei Nebenwirkungen:</strong> Kontaktieren Sie sofort Ihren Arzt bei unerwünschten Symptomen oder Nebenwirkungen.</p>
          </div>
        </div>
      </div>
      
      <!-- Hinweise zu Cannabinoiden -->
      <div>
        <h3 style="margin: 0 0 1rem; font-size: 0.9rem; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.05em;">Hinweise zu Cannabinoiden</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem; color: #374151;">
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">CYP450-Interaktionen beachten:</strong> Cannabinoide können den Abbau bestimmter Medikamente über das Cytochrom-P450-System beeinflussen. Ihr Arzt sollte mögliche Wechselwirkungen prüfen.</p>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Kein Alkohol während der Behandlung:</strong> Alkohol kann Wechselwirkungen verstärken und den Reduktionsprozess gefährden.</p>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Keine Grapefruit:</strong> Grapefruit beeinflusst ebenfalls das CYP450-System und sollte während der Behandlung vermieden werden.</p>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #0b7b6c; margin: 0.5rem 0.75rem 0 0; flex-shrink: 0;"></div>
            <p style="margin: 0; line-height: 1.6;"><strong style="color: #1f2937;">Müdigkeit möglich:</strong> Cannabinoide können Müdigkeit verursachen. Fahren Sie kein Fahrzeug, bis Sie wissen, wie Sie auf Cannabinoide reagieren.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // ============================================================
  // PDF DOWNLOAD BUTTON (Centered with adequate spacing)
  // ============================================================
  
  html += `
    <div style="margin: 3rem 0 2rem; text-align: center;">
      <button 
        onclick="downloadPDF(event)" 
        style="
          padding: 1.25rem 2.5rem; 
          background: linear-gradient(135deg, #0b7b6c 0%, #10b981 100%); 
          color: white; 
          border: none; 
          border-radius: 12px; 
          font-size: 1rem; 
          font-weight: 600; 
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        "
        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'"
      >
        <i class="fas fa-file-pdf"></i>
        <span>Plan als PDF herunterladen</span>
      </button>
      
      <p style="margin: 1rem 0 0; font-size: 0.85rem; color: #6b7280;">
        <i class="fas fa-info-circle" style="margin-right: 0.25rem;"></i>
        Ihr persönlicher Ausschleichplan zum Ausdrucken und für Ihren Arzt
      </p>
    </div>
  `;

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
    personalization,
    costs
  };
  
  console.log('✅ displayResults() function completed successfully');
}

// Download PDF function - Simple and reliable using data directly
function downloadPDF(event) {
  // Prevent default
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!window.currentPlanData) {
    alert('Keine Daten vorhanden. Bitte erstellen Sie erst einen Reduktionsplan.');
    return;
  }
  
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF-Bibliothek wird geladen... Bitte versuchen Sie es in einigen Sekunden erneut.');
    return;
  }
  
  const button = event?.target?.closest('button');
  const originalButtonHTML = button?.innerHTML || '<i class="fas fa-file-pdf"></i> <span>Plan als PDF herunterladen</span>';
  
  try {
    console.log('🎯 PDF-Generierung gestartet...');
    
    // Show loading
    if (button) {
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>PDF wird erstellt...</span>';
      button.disabled = true;
    }
    
    const { jsPDF } = window.jspdf;
    const { analysis, weeklyPlan, firstName, personalization, costs } = window.currentPlanData;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    
    // Helper function: Check page break
    const checkPageBreak = (neededSpace) => {
      if (y + neededSpace > pageHeight - margin) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };
    
    // TITLE
    doc.setFontSize(18);
    doc.setTextColor(11, 123, 108);
    doc.text('MEDLESS - Ihr persönlicher Ausschleichplan', margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text('Erstellt am: ' + new Date().toLocaleDateString('de-DE'), margin, y);
    y += 10;
    
    // PATIENT DATA
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Ihre Ausgangsdaten', margin, y);
    y += 7;
    
    doc.setFontSize(10);
    doc.text(`Vorname: ${firstName || 'N/A'}`, margin, y);
    doc.text(`Alter: ${personalization?.age || 'N/A'} Jahre`, margin + 60, y);
    y += 6;
    doc.text(`Gewicht: ${personalization?.weight || 'N/A'} kg`, margin, y);
    doc.text(`Größe: ${personalization?.height || 'N/A'} cm`, margin + 60, y);
    y += 6;
    if (personalization?.bmi) {
      doc.text(`BMI: ${personalization.bmi}`, margin, y);
      y += 6;
    }
    y += 5;
    
    // COSTS
    if (costs && costs.products && costs.products.length > 0) {
      checkPageBreak(35);
      doc.setFontSize(12);
      doc.text('Benötigte Produkte', margin, y);
      y += 7;
      
      doc.setFontSize(9);
      costs.products.forEach(prod => {
        doc.text(`${prod.name}: ${prod.count}x à ${prod.price.toFixed(2)}€ = ${prod.totalCost.toFixed(2)}€`, margin, y);
        y += 5;
      });
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`Gesamtkosten: ${costs.totalCost.toFixed(2)}€`, margin, y);
      doc.setFont(undefined, 'normal');
      y += 10;
    }
    
    // MEDICATIONS
    if (analysis && analysis.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.text('Ihre Medikation', margin, y);
      y += 7;
      
      doc.setFontSize(10);
      analysis.forEach(item => {
        checkPageBreak(15);
        doc.text(`• ${item.medication.name || item.medication.generic_name}`, margin, y);
        y += 5;
        if (item.interactions && item.interactions.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const interaction = item.interactions[0];
          doc.text(`  Wechselwirkung: ${interaction.severity} - ${interaction.description.substring(0, 80)}...`, margin + 3, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }
        doc.setFontSize(10);
        y += 2;
      });
      y += 5;
    }
    
    // WEEKLY PLAN
    doc.addPage();
    y = margin;
    
    doc.setFontSize(14);
    doc.text('Wöchentlicher Reduktionsplan', margin, y);
    y += 10;
    
    weeklyPlan.forEach((week, index) => {
      checkPageBreak(50);
      
      // Week header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4, contentWidth, 8, 'F');
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Woche ${week.week}`, margin + 2, y);
      doc.setFont(undefined, 'normal');
      y += 10;
      
      // Medications
      doc.setFontSize(9);
      doc.text('Medikamente:', margin, y);
      y += 5;
      
      week.medications.forEach(med => {
        doc.text(`  ${med.name}: ${med.currentMg} mg/Tag (Start: ${med.startMg}, Ziel: ${med.targetMg})`, margin + 5, y);
        y += 4;
      });
      y += 3;
      
      // CBD
      doc.text(`CBD-Dosis: ${week.cbdDose.toFixed(1)} mg/Tag`, margin, y);
      y += 4;
      doc.text(`Produkt: ${week.kannasanProduct.name}`, margin, y);
      y += 4;
      doc.text(`Sprühstöße: ${week.morningSprays}× morgens, ${week.eveningSprays}× abends (${week.totalSprays}× täglich)`, margin, y);
      y += 4;
      doc.text(`Tatsächliche CBD-Menge: ${week.actualCbdMg} mg`, margin, y);
      y += 8;
    });
    
    // SAFETY WARNINGS
    doc.addPage();
    y = margin;
    
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.text('⚠️ Wichtige Sicherheitshinweise', margin, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
    
    doc.setFontSize(9);
    const warnings = [
      'Setzen Sie Medikamente niemals eigenständig ab - nur unter ärztlicher Aufsicht',
      'CYP450-Interaktionen: Cannabinoide beeinflussen den Medikamentenabbau',
      'Kein Alkohol während der Reduktion',
      'Keine Grapefruit (beeinflusst CYP450-System)',
      'Müdigkeit möglich - kein Fahrzeug fahren bis Wirkung bekannt',
      'Bei Nebenwirkungen sofort Arzt kontaktieren',
      'Dieser Plan ersetzt keine ärztliche Beratung'
    ];
    
    warnings.forEach(warning => {
      checkPageBreak(10);
      const lines = doc.splitTextToSize(`• ${warning}`, contentWidth - 5);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    });
    
    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© 2025 MEDLESS - Alle Rechte vorbehalten', margin, pageHeight - 10);
    
    // Save
    const date = new Date().toISOString().split('T')[0];
    const filename = `MedLess_Plan_${firstName || 'Patient'}_${date}.pdf`;
    
    console.log('💾 Speichere PDF:', filename);
    doc.save(filename);
    
    console.log('✅ PDF erfolgreich erstellt!');
    
    // Reset button
    if (button) {
      button.innerHTML = originalButtonHTML;
      button.disabled = false;
    }
    
  } catch (error) {
    console.error('❌ PDF-Fehler:', error);
    alert(`Fehler beim Erstellen des PDFs:\n\n${error.message || 'Unbekannter Fehler'}\n\nBitte kontaktieren Sie den Support.`);
    
    // Reset button
    if (button) {
      button.innerHTML = originalButtonHTML;
      button.disabled = false;
    }
  }
}
