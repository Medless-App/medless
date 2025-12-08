// ============================================================
// UX HELPER FUNCTIONS - Professional Error Display
// ============================================================

/**
 * Display error message in dedicated error box (replaces alert())
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorBox = document.getElementById('error-box');
  const errorMessage = document.getElementById('error-message');
  
  if (!errorBox || !errorMessage) {
    // Fallback to alert if HTML structure is not available
    console.warn('Error box not found in DOM, using alert() fallback');
    alert(message);
    return;
  }
  
  errorMessage.textContent = message;
  errorBox.classList.remove('hidden');
  
  // Scroll to error box smoothly
  setTimeout(() => {
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

/**
 * Clear error message box
 */
function clearError() {
  const errorBox = document.getElementById('error-box');
  const errorMessage = document.getElementById('error-message');
  
  if (!errorBox || !errorMessage) return;
  
  errorMessage.textContent = '';
  errorBox.classList.add('hidden');
}

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

// ============================================================
// PDF GENERATION HELPER - Direct Download (html2pdf.js)
// ============================================================

// Robuste PDF-Erstellung über ein unsichtbares IFRAME
// htmlString: voller HTML-Report (patient.html oder doctor.html)
// fileName: gewünschter Dateiname, z.B. "MEDLESS_Plan_Patient.pdf"
async function downloadHtmlAsPdf(htmlString, fileName) {
  try {
    if (!htmlString || typeof htmlString !== 'string' || htmlString.trim().length < 200) {
      console.error('❌ downloadHtmlAsPdf: HTML string is empty or too short', {
        length: htmlString ? htmlString.length : 0
      });
      alert('Beim Erstellen des PDF ist ein Fehler aufgetreten (kein Inhalt). Bitte versuchen Sie es später erneut.');
      return;
    }

    if (typeof window.html2pdf === 'undefined') {
      console.error('❌ downloadHtmlAsPdf: html2pdf.js ist nicht geladen');
      alert('PDF-Funktion nicht verfügbar. Bitte laden Sie die Seite neu (Strg+Shift+R) und versuchen Sie es erneut.');
      return;
    }

    console.log('📄 downloadHtmlAsPdf (IFRAME): starting PDF generation', {
      fileName,
      length: htmlString.length
    });

    // 1) IFRAME anlegen (unsichtbar, aber NICHT display:none)
    const iframe = document.createElement('iframe');
    iframe.id = 'medless-pdf-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '210mm';     // A4-Breite
    iframe.style.height = '297mm';    // A4-Höhe
    iframe.style.border = '0';
    iframe.style.zIndex = '9999';
    iframe.setAttribute('aria-hidden', 'true');

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // 2) Vollständiges HTML in das IFRAME-Dokument schreiben
    iframeDoc.open();
    iframeDoc.write(htmlString);
    iframeDoc.close();

    // 3) Warten, bis das IFRAME-Dokument fertig gerendert ist
    await new Promise((resolve) => {
      const done = () => {
        // kleine Zusatz-Verzögerung, damit Fonts/Layout sicher fertig sind
        setTimeout(resolve, 300);
      };

      if (iframe.contentWindow.document.readyState === 'complete') {
        done();
      } else {
        iframe.onload = done;
      }
    });

    const body = iframeDoc.body;
    if (!body) {
      console.error('❌ downloadHtmlAsPdf: iframe body is null/undefined');
      alert('Beim Erstellen des PDF ist ein Fehler aufgetreten (kein Body).');
      return;
    }

    const textSample = body.innerText ? body.innerText.slice(0, 200) : '';
    console.log('📄 downloadHtmlAsPdf: iframe body ready', {
      innerTextLength: body.innerText ? body.innerText.length : 0,
      textSample
    });

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 4) PDF aus dem IFRAME-Body erzeugen
    await window.html2pdf().set(opt).from(body).save();

    console.log('✅ downloadHtmlAsPdf: PDF generation finished', { fileName });
  } catch (err) {
    console.error('❌ downloadHtmlAsPdf: error during PDF generation', err);
    alert('Beim Erstellen des PDF ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
  } finally {
    // 5) IFRAME aufräumen
    const existing = document.getElementById('medless-pdf-iframe');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }
}

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
  console.log('DEBUG_MEDLESS: DOMContentLoaded FIRED');
  
  loadMedications();
  
  // IMPORTANT: Create first medication input field
  // Note: medication-inputs container must exist in HTML (Step 3)
  // We create it immediately so it's ready when user reaches Step 3
  const medicationContainer = document.getElementById('medication-inputs');
  if (medicationContainer) {
    console.log('✅ medication-inputs container found - creating first input');
    createMedicationInput();
  } else {
    console.warn('⚠️ medication-inputs container not found yet - will retry on step navigation');
  }
  
  // Setup "add medication" button handler
  const addButton = document.getElementById('add-medication');
  if (addButton) {
    console.log('✅ add-medication button found');
    addButton.addEventListener('click', () => {
      console.log('🖱️ Add medication button clicked');
      createMedicationInput();
    });
  } else {
    console.warn('⚠️ add-medication button not found - will be initialized on step navigation');
  }
  
  // CRITICAL: Setup form submit handler INSIDE DOMContentLoaded
  const medicationForm = document.getElementById('medication-form');
  console.log('DEBUG_MEDLESS: medication-form element:', medicationForm);
  
  if (medicationForm) {
    console.log('DEBUG_MEDLESS: Attaching submit event listener to form');
    medicationForm.addEventListener('submit', handleFormSubmit);
  } else {
    console.error('DEBUG_MEDLESS: CRITICAL ERROR - medication-form NOT FOUND!');
  }
  
  // FALLBACK: Initialize medication inputs when Step 3 becomes visible
  // This handles cases where DOMContentLoaded fires before step navigation is set up
  const observer = new MutationObserver(() => {
    const step3 = document.getElementById('step-3');
    const medicationContainer = document.getElementById('medication-inputs');
    
    if (step3 && !step3.classList.contains('hidden') && medicationContainer) {
      const existingInputs = medicationContainer.querySelectorAll('.medication-input-group');
      if (existingInputs.length === 0) {
        console.log('🔄 Step 3 became visible - initializing medication inputs');
        createMedicationInput();
        
        // Also ensure add-medication button is set up
        const addBtn = document.getElementById('add-medication');
        if (addBtn && !addBtn.hasAttribute('data-listener-attached')) {
          addBtn.setAttribute('data-listener-attached', 'true');
          addBtn.addEventListener('click', () => {
            console.log('🖱️ Add medication button clicked (fallback handler)');
            createMedicationInput();
          });
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

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
            ${med.category_name || 'Allgemeine Medikation'}
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
  const container = document.getElementById('medication-inputs');
  
  if (!container) {
    console.error('❌ CRITICAL: medication-inputs container not found!');
    return;
  }
  
  medicationCount++;
  
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
// NOTE: This function is now called from DOMContentLoaded handler
async function handleFormSubmit(e) {
  e.preventDefault();
  
  console.log('DEBUG_MEDLESS: FORM SUBMIT HANDLER TRIGGERED');
  console.log('🔥 FORM SUBMIT EVENT TRIGGERED!');
  console.log('📋 Form element:', e.target);
  console.log('⏱️ Timestamp:', new Date().toISOString());
  
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
          dailyDoseMg: mgPerDayValue
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
  
  console.log('✅ VALIDATION PASSED - Starting analyzeMedications...');
  console.log('📊 Data:', { medications, durationWeeks, firstName, gender, age, weight, height, reductionGoal });
  
  // Start analysis with loading animation
  await analyzeMedications(medications, durationWeeks, firstName, gender, email, age, weight, height, reductionGoal);
}

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
    console.log('🎬 Premium Loader Animation started');
    
    // Get new premium loader elements
    const step1Counter = document.querySelector('.step-1 .step-counter');
    const step1ProgressBar = document.querySelector('.step-progress-bar[data-step="1"]');
    const step1Percentage = document.querySelector('.step-1 .step-percentage');
    
    const step2Counter = document.querySelector('.step-2 .step-counter');
    const step2ProgressBar = document.querySelector('.step-progress-bar[data-step="2"]');
    const step2Percentage = document.querySelector('.step-2 .step-percentage');
    
    const step3Counter = document.querySelector('.step-3 .step-counter');
    const step3ProgressBar = document.querySelector('.step-progress-bar[data-step="3"]');
    const step3Percentage = document.querySelector('.step-3 .step-percentage');
    
    // Animation config: [maxCount, duration, delay]
    const steps = [
      { counter: 18, duration: 3000, delay: 600 },   // Step 1: 18 medications
      { counter: 12, duration: 2500, delay: 1200 },  // Step 2: 12 interactions
      { counter: 8, duration: 2000, delay: 1800 }    // Step 3: 8 sections
    ];
    
    const totalDuration = steps.reduce((sum, s) => sum.duration + sum.delay, 0) + 1000;
    let currentTime = 0;
    
    // Animated dots
    let dotCount = 0;
    const dotsInterval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      if (statusDots) statusDots.textContent = '.'.repeat(dotCount || 1);
    }, 500);
    
    // SVG circle animation (circumference = 2 * PI * r = 2 * PI * 42 = 264)
    const circumference = 264;
    
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
              // Keep font-size consistent to prevent clipping
              centerPercentage.style.fontSize = '1.75rem';
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
            
            // DIRECT TRANSITION: Hide loading and resolve immediately (no button needed)
            setTimeout(() => {
              console.log('🎬 Animation completed - fading out loading screen');
              const loadingEl = document.getElementById('loading');
              if (loadingEl) {
                loadingEl.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                loadingEl.style.opacity = '0';
                loadingEl.style.transform = 'scale(0.98)';
                
                // Hide loading after fade-out and resolve promise
                setTimeout(() => {
                  loadingEl.classList.add('hidden');
                  loadingEl.style.opacity = '1';
                  loadingEl.style.transform = 'scale(1)';
                  console.log('✅ Loading hidden, resolving animation promise - ready for results');
                  resolve();
                }, 800);
              } else {
                resolve();
              }
            }, 800);
            
          }, step.duration);
        }
      }, delay);
      
      delay += step.duration;
    });
  });
}


// Variable to store the last analysis result for later use
let lastAnalyzeAndReportsResult = null;
let lastAnalyzePersonalData = { firstName: '', gender: '' };

// Analyze medications with animated loading
// JETZT MIT NEUER ROUTE: /api/analyze-and-reports
// Diese Route liefert Analysis + Patient-Report + Arzt-Report in einem Request
async function analyzeMedications(medications, durationWeeks, firstName = '', gender = '', email = '', age = null, weight = null, height = null, reductionGoal = 100) {
  console.log('DEBUG_MEDLESS: analyzeMedications STARTED');
  console.log('🚀 analyzeMedications started');
  
  // Clear any previous errors
  clearError();
  
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
    // Make API call - NEUE ROUTE: /api/analyze-and-reports
    // Diese Route gibt zurück: { analysis, patient: { data, html }, doctor: { data, html } }
    console.log('📡 Making API call to /api/analyze-and-reports');
    // ✅ FIX 2: Send firstName only (no vorname)
    const apiPromise = axios.post('/api/analyze-and-reports', {
      firstName: firstName,
      gender: gender,
      age: age,
      weight: weight,
      height: height,
      medications: medications.map(med => ({
        name: med.name,
        dailyDoseMg: med.dailyDoseMg
      })),
      durationWeeks: durationWeeks,
      reductionGoal: reductionGoal,
      email: email
    });

    // Wait for both animation and API call to complete
    // IMPORTANT: Animation MUST complete to 100% even if API is fast
    console.log('⏳ Waiting for API and animation to complete...');
    const [response] = await Promise.all([apiPromise, animationPromise]);

    console.log('✅ Both API and animation completed');
    console.log('📊 Full API response:', response.data);
    console.log('📊 API response success:', response.data.success);

    if (response.data.success) {
      console.log('DEBUG_MEDLESS: API /api/analyze-and-reports SUCCESS');
      console.log('🎉 API successful - storing result and showing completion state');
      
      // Store result for later use
      lastAnalyzeAndReportsResult = response.data;
      lastAnalyzePersonalData = { firstName, gender };
      
      console.log('💾 Stored lastAnalyzeAndReportsResult:', lastAnalyzeAndReportsResult);
      console.log('💾 Stored lastAnalyzePersonalData:', lastAnalyzePersonalData);
      
      // Show "Plan fertig" completion state
      console.log('DEBUG_MEDLESS: calling showPlanReadyState()');
      console.log('🎬 About to call showPlanReadyState()');
      showPlanReadyState(loadingEl);
      console.log('✅ showPlanReadyState() returned');
      
    } else {
      // ✅ FIX 3: Improved Error-Handling für API success:false
      console.error('❌ API returned success: false');
      console.error('Error message:', response.data.error);
      const errorMessage = response.data.error || 'Analyse fehlgeschlagen';
      showError(errorMessage); // Professional error display (replaces alert)
      document.getElementById('loading').classList.add('hidden');
      return; // Early return, kein throw
    }
  } catch (error) {
    console.error('❌ CRITICAL ERROR in analyzeMedications:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('API error response:', error.response.data);
      console.error('API status:', error.response.status);
    }
    showError('Fehler bei der Analyse: ' + (error.response?.data?.error || error.message)); // Professional error display
    // Hide loading on error
    document.getElementById('loading').classList.add('hidden');
  }
}

// Show "Plan fertig" completion state with action button
function showPlanReadyState(loadingEl) {
  console.log('DEBUG_MEDLESS: showPlanReadyState ENTERED');
  console.log('🎊 Showing plan ready state');
  console.log('📍 loadingEl:', loadingEl);
  console.log('📍 loadingEl ID:', loadingEl?.id);
  console.log('📍 loadingEl classList:', loadingEl?.classList);
  console.log('📍 loadingEl visible?', !loadingEl?.classList.contains('hidden'));
  console.log('📍 loadingEl innerHTML length:', loadingEl?.innerHTML?.length);
  
  // Ensure loading element is visible
  if (loadingEl) {
    loadingEl.classList.remove('hidden');
    console.log('✅ Removed hidden class from loadingEl');
  }
  
  // Clear loading animation content
  console.log('🧹 Clearing loading animation content');
  loadingEl.innerHTML = '';
  console.log('✅ loadingEl cleared, innerHTML now:', loadingEl.innerHTML.length);
  
  // Create completion overlay with medical styling
  const completionOverlay = document.createElement('div');
  completionOverlay.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 3rem 2rem;
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
  `;
  
  // Success icon (animated checkmark)
  const successIcon = document.createElement('div');
  successIcon.style.cssText = `
    width: 80px;
    height: 80px;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #10b981 0%, #0F5A46 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.5s ease-out;
  `;
  successIcon.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  
  // Title
  const title = document.createElement('h2');
  title.style.cssText = `
    margin: 0 0 1rem 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #0F5A46;
    text-align: center;
  `;
  title.textContent = 'Ihr persönlicher MEDLESS-Plan ist fertig';
  
  // Description
  const description = document.createElement('p');
  description.style.cssText = `
    margin: 0 0 2rem 0;
    font-size: 1rem;
    color: #4b5563;
    text-align: center;
    max-width: 500px;
    line-height: 1.6;
  `;
  description.textContent = 'Ihr individueller Reduktionsplan mit CBD-Dosierung wurde berechnet. Sie können ihn jetzt ansehen und als PDF ausdrucken.';
  
  // REFACTORED: TWO SEPARATE PDF DOWNLOAD BUTTONS (Thomas's request)
  // Instead of opening combined HTML in new tab, we now offer direct PDF downloads
  
  // Buttons wrapper
  const buttonsWrapper = document.createElement('div');
  buttonsWrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 500px;
  `;
  
  // Patient PDF Button
  const patientButton = document.createElement('button');
  patientButton.style.cssText = `
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #10b981 0%, #0F5A46 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(15, 90, 70, 0.3);
  `;
  patientButton.textContent = 'Patienten-Plan als PDF herunterladen';
  
  // Doctor PDF Button
  const doctorButton = document.createElement('button');
  doctorButton.style.cssText = `
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  `;
  doctorButton.textContent = 'Ärztebericht als PDF herunterladen';
  
  // Patient Button hover effects (only if not disabled)
  patientButton.addEventListener('mouseenter', () => {
    if (!patientButton.disabled) {
      patientButton.style.transform = 'translateY(-2px)';
      patientButton.style.boxShadow = '0 6px 20px rgba(15, 90, 70, 0.4)';
      patientButton.style.background = 'linear-gradient(135deg, #0F5A46 0%, #0a4434 100%)';
    }
  });
  
  patientButton.addEventListener('mouseleave', () => {
    if (!patientButton.disabled) {
      patientButton.style.transform = 'translateY(0)';
      patientButton.style.boxShadow = '0 4px 12px rgba(15, 90, 70, 0.3)';
      patientButton.style.background = 'linear-gradient(135deg, #10b981 0%, #0F5A46 100%)';
    }
  });
  
  // Doctor Button hover effects (only if not disabled)
  doctorButton.addEventListener('mouseenter', () => {
    if (!doctorButton.disabled) {
      doctorButton.style.transform = 'translateY(-2px)';
      doctorButton.style.boxShadow = '0 6px 20px rgba(30, 64, 175, 0.4)';
      doctorButton.style.background = 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)';
    }
  });
  
  doctorButton.addEventListener('mouseleave', () => {
    if (!doctorButton.disabled) {
      doctorButton.style.transform = 'translateY(0)';
      doctorButton.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
      doctorButton.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
    }
  });
  
  // Hint text below buttons
  const hintText = document.createElement('p');
  hintText.style.cssText = `
    margin: 1rem 0 0 0;
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
    line-height: 1.5;
  `;
  hintText.innerHTML = `
    <strong>Patienten-Plan:</strong> Für den Patienten – enthält Wochenplan, CBD-Dosierung und Sicherheitshinweise.<br>
    <strong>Ärztebericht:</strong> Für den behandelnden Arzt – enthält Risiko-Analyse, Wechselwirkungen und Monitoring-Empfehlungen.
  `;
  
  // NOTE: ensureResultsShown() function removed - PDFs are downloaded directly
  // without showing results in browser (as per Thomas's requirements)
  
  // Flags to ensure each PDF is downloaded only once
  let patientPdfDownloaded = false;
  let doctorPdfDownloaded = false;
  
  // Patient Button Click Handler (SERVER-SIDE PDF via /api/pdf/patient)
  patientButton.addEventListener('click', async () => {
    console.log('🖱️ Patient PDF button clicked');
    
    // Prevent multiple downloads
    if (patientPdfDownloaded) {
      console.log('⚠️ Patient PDF already downloaded');
      return;
    }
    
    if (!lastAnalyzeAndReportsResult) {
      console.error('❌ No analysis result stored');
      alert('Fehler: Keine Analysedaten vorhanden');
      return;
    }
    
    try {
      // Get Patient HTML
      const patientHtml = lastAnalyzeAndReportsResult.patient?.html;
      if (!patientHtml) {
        console.error('❌ No patient HTML available');
        alert('Fehler: Kein Patienten-Bericht verfügbar');
        return;
      }
      
      console.log('DEBUG Patient HTML length before PDF:', patientHtml.length);
      
      // Validate HTML length
      if (patientHtml.length < 500) {
        console.error('❌ Patient HTML too short:', patientHtml.length);
        alert('Fehler: Patienten-Bericht ist leer oder unvollständig');
        return;
      }
      
      // Disable button immediately to prevent double-clicks
      patientButton.disabled = true;
      patientButton.style.cursor = 'not-allowed';
      patientButton.style.opacity = '0.6';
      patientButton.textContent = 'PDF wird erstellt...';
      
      console.log('📄 Requesting server-side PDF generation via /api/pdf/patient');
      
      // Call server-side PDF API  
      const res = await fetch('/api/pdf/patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: patientHtml,
          fileName: 'medless-patient-plan.pdf'
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ PDF API error:');
        console.error('  Status:', res.status);
        console.error('  Headers:', Object.fromEntries(res.headers.entries()));
        console.error('  Body:', errorText);
        alert('PDF-Funktion nicht verfügbar. Bitte laden Sie die Seite neu (Strg+Shift+R) und versuchen Sie es erneut.');
        throw new Error('PDF API returned ' + res.status);
      }
      
      console.log('✅ PDF API response OK, downloading blob...');
      
      // Download PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medless-patient-plan.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      console.log('✅ Patient PDF downloaded successfully');
      
      // Mark as downloaded and update button text
      patientPdfDownloaded = true;
      patientButton.textContent = '✅ Patienten-PDF wurde erstellt';
      patientButton.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      
    } catch (error) {
      console.error('❌ ERROR in Patient PDF download:', error);
      alert('PDF-Funktion nicht verfügbar. Bitte laden Sie die Seite neu (Strg+Shift+R) und versuchen Sie es erneut.');
      
      // Re-enable button on error
      patientButton.disabled = false;
      patientButton.style.cursor = 'pointer';
      patientButton.style.opacity = '1';
      patientButton.textContent = 'Patienten-Plan als PDF herunterladen';
      patientButton.style.background = 'linear-gradient(135deg, #10b981 0%, #0F5A46 100%)';
    }
  });
  
  // Doctor Button Click Handler (SERVER-SIDE PDF via /api/pdf/arztbericht)
  doctorButton.addEventListener('click', async () => {
    console.log('🖱️ Doctor PDF button clicked');
    
    // Prevent multiple downloads
    if (doctorPdfDownloaded) {
      console.log('⚠️ Doctor PDF already downloaded');
      return;
    }
    
    if (!lastAnalyzeAndReportsResult) {
      console.error('❌ No analysis result stored');
      alert('Fehler: Keine Analysedaten vorhanden');
      return;
    }
    
    try {
      // Get Doctor HTML
      const doctorHtml = lastAnalyzeAndReportsResult.doctor?.html;
      if (!doctorHtml) {
        console.error('❌ No doctor HTML available');
        alert('Fehler: Kein Ärztebericht verfügbar');
        return;
      }
      
      console.log('DEBUG Doctor HTML length before PDF:', doctorHtml.length);
      
      // Validate HTML length
      if (doctorHtml.length < 500) {
        console.error('❌ Doctor HTML too short:', doctorHtml.length);
        alert('Fehler: Ärztebericht ist leer oder unvollständig');
        return;
      }
      
      // Disable button immediately to prevent double-clicks
      doctorButton.disabled = true;
      doctorButton.style.cursor = 'not-allowed';
      doctorButton.style.opacity = '0.6';
      doctorButton.textContent = 'PDF wird erstellt...';
      
      console.log('📄 Requesting server-side PDF generation via /api/pdf/arztbericht');
      
      // Call server-side PDF API
      const res = await fetch('/api/pdf/arztbericht', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: doctorHtml,
          fileName: 'medless-arztbericht.pdf'
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ PDF API error:');
        console.error('  Status:', res.status);
        console.error('  Headers:', Object.fromEntries(res.headers.entries()));
        console.error('  Body:', errorText);
        alert('PDF-Funktion nicht verfügbar. Bitte laden Sie die Seite neu (Strg+Shift+R) und versuchen Sie es erneut.');
        throw new Error('PDF API returned ' + res.status);
      }
      
      console.log('✅ PDF API response OK, downloading blob...');
      
      // Download PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medless-arztbericht.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      console.log('✅ Doctor PDF downloaded successfully');
      
      // Mark as downloaded and update button text
      doctorPdfDownloaded = true;
      doctorButton.textContent = '✅ Ärztebericht-PDF wurde erstellt';
      doctorButton.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      
    } catch (error) {
      console.error('❌ ERROR in Doctor PDF download:', error);
      alert('PDF-Funktion nicht verfügbar. Bitte laden Sie die Seite neu (Strg+Shift+R) und versuchen Sie es erneut.');
      
      // Re-enable button on error
      doctorButton.disabled = false;
      doctorButton.style.cursor = 'pointer';
      doctorButton.style.opacity = '1';
      doctorButton.textContent = 'Ärztebericht als PDF herunterladen';
      doctorButton.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
    }
  });
  
  // Add keyframe animation for icon
  if (!document.getElementById('plan-ready-animations')) {
    const style = document.createElement('style');
    style.id = 'plan-ready-animations';
    style.textContent = `
      @keyframes scaleIn {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Assemble completion overlay (NEW: Two separate PDF download buttons)
  console.log('🔨 Assembling completion overlay with elements');
  completionOverlay.appendChild(successIcon);
  completionOverlay.appendChild(title);
  completionOverlay.appendChild(description);
  
  // Add both buttons to wrapper
  buttonsWrapper.appendChild(patientButton);
  buttonsWrapper.appendChild(doctorButton);
  completionOverlay.appendChild(buttonsWrapper);
  completionOverlay.appendChild(hintText);
  
  console.log('✅ All elements added to completionOverlay (2 PDF buttons + hint)');
  
  // Add to loading element
  console.log('📍 Adding completionOverlay to loadingEl');
  loadingEl.appendChild(completionOverlay);
  console.log('DEBUG_MEDLESS: completion overlay + TWO PDF buttons added to DOM');
  console.log('✅ completionOverlay added to DOM');
  
  // Log button state
  console.log('🔘 Patient Button:', patientButton);
  console.log('🔘 Patient Button text:', patientButton.textContent);
  console.log('🔘 Patient Button visible?', patientButton.offsetHeight > 0);
  console.log('🔘 Doctor Button:', doctorButton);
  console.log('🔘 Doctor Button text:', doctorButton.textContent);
  console.log('🔘 Doctor Button visible?', doctorButton.offsetHeight > 0);
  
  // Scroll to completion overlay
  setTimeout(() => {
    console.log('📜 Scrolling to completion overlay');
    completionOverlay.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
  
  console.log('🎊 showPlanReadyState() COMPLETED SUCCESSFULLY (2 PDF buttons)');
  
  // FALLBACK: If buttons are not visible after 500ms, force show them
  setTimeout(() => {
    if (patientButton.offsetHeight === 0 || doctorButton.offsetHeight === 0) {
      console.error('⚠️ BUTTONS ARE HIDDEN! Forcing visibility...');
      loadingEl.style.display = 'block';
      loadingEl.style.visibility = 'visible';
      loadingEl.style.opacity = '1';
      completionOverlay.style.display = 'flex';
      buttonsWrapper.style.display = 'flex';
      patientButton.style.display = 'block';
      doctorButton.style.display = 'block';
    } else {
      console.log('✅ Both PDF buttons are visible and clickable');
    }
  }, 500);
}

// ============================================================
// TEST DATA / DEMO SECTION
// ============================================================



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
  
  // NEU: Daten können jetzt aus zwei Quellen kommen:
  // 1. Alte Route /api/analyze: data direkt mit analysis, maxSeverity, etc.
  // 2. Neue Route /api/analyze-and-reports: data.analysis enthält die Analysedaten
  // Wir prüfen, ob data.analysis existiert und nutzen dann diese Struktur
  const analysisData = data.analysis || data; // Fallback für Kompatibilität
  const { analysis, maxSeverity, guidelines, weeklyPlan, warnings, product, personalization, costs } = analysisData;
  
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
  // DIRECT DISPLAY: Skip all intermediate screens
  // ============================================================
  
  html += `
    <!-- Separator & Intro für Details -->
    <div style="margin-top: 3rem; padding: 1.5rem 1.3rem; border-radius: 24px; background: radial-gradient(circle at top left, #e0fdf7, #f5f7fa); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h1 style="margin: 0 0 0.75rem; font-size: 1.6rem; line-height: 1.2; color: #0b7b6c; font-weight: 700;">
        Ihr persönlicher MedLess-Dosierungs- und Reduktionsplan
      </h1>
      <p style="margin: 0 0 0.875rem; font-size: 0.95rem; line-height: 1.6; color: #4b5563;">
        Dieser Plan zeigt Ihnen eine strukturierte, medizinisch fundierte Kombination aus Cannabinoid-Dosierung und schrittweiser Medikamentenreduktion. 
        Er basiert auf Ihren Eingaben und bekannten pharmakologischen Daten.
      </p>
      <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #4b5563;">
        <strong style="color: #0b7b6c;">Er ersetzt keine ärztliche Entscheidung. Bitte besprechen Sie jede Änderung mit Ihrem behandelnden Arzt.</strong>
      </p>
      
      ${(() => {
        // PlanIntelligenz 2.0: Overall plan summary
        const intel = data.planIntelligence;
        if (!intel) return '';
        
        return `
          <div style="margin-top: 1.25rem; padding: 1rem 1.25rem; border-radius: 8px; background: rgba(255,255,255,0.7); border-left: 3px solid #0b7b6c;">
            <p style="margin: 0; font-size: 0.9rem; line-height: 1.6; color: #374151;">
              Über den gesamten Zeitraum sinkt Ihre tägliche Medikamentenlast von <strong>${intel.overallStartLoad} mg</strong> auf <strong>${intel.overallEndLoad} mg</strong> 
              (–<strong>${intel.totalLoadReductionPct}%</strong>). 
              Die geplante Reduktionsgeschwindigkeit ist im Durchschnitt <strong>${intel.reductionSpeedCategory}</strong>.
            </p>
          </div>
        `;
      })()}
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
        
        ${personalization.idealWeightKg ? `
          <!-- PlanIntelligenz 2.0: Ideal weight display -->
          <div style="margin-top: 1rem; padding: 0.875rem 1rem; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">
              Theoretisches Idealgewicht (Devine-Formel): <strong style="color: #1f2937;">${personalization.idealWeightKg} kg</strong>
            </p>
          </div>
        ` : ''}
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
        <h2 style="margin: 0 0 1.25rem; font-size: 1.2rem; font-weight: 700; color: #0b7b6c;">Ihre Cannabinoid-Dosierungsempfehlung</h2>
        
        <!-- Horizontale Info-Kacheln -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Cannabinoid-Start</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #0b7b6c; margin: 0;">${personalization.cbdStartMg.toFixed(1)}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">mg (z.B. CBD)</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Cannabinoid-Ziel</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #0b7b6c; margin: 0;">${personalization.cbdEndMg.toFixed(1)}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">mg (z.B. CBD)</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Wöchentlich</p>
            <p style="font-size: 1.5rem; font-weight: 700; color: #0b7b6c; margin: 0;">+${((personalization.cbdEndMg - personalization.cbdStartMg) / weeklyPlan.length).toFixed(1)}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">mg Anstieg</p>
          </div>
          <div style="padding: 1rem; background: #fafafa; border-radius: 8px; text-align: center;">
            <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin: 0 0 0.5rem; font-weight: 500;">Produkt</p>
            <p style="font-size: 1.125rem; font-weight: 700; color: #1f2937; margin: 0;">${product.name}</p>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0;">empfohlen</p>
          </div>
        </div>
        
        ${(() => {
          // PlanIntelligenz 2.0: Show weeks to target dose
          const intel = data.planIntelligence;
          if (intel && intel.weeksToCbdTarget) {
            return `
              <div style="margin-bottom: 1.5rem; padding: 1rem; border-radius: 8px; background: #f0fdf4; border: 1px solid #d1fae5;">
                <p style="margin: 0; font-size: 0.85rem; color: #047857;">
                  <strong>Voraussichtliches Erreichen der Ziel-Cannabinoid-Dosis: Woche ${Math.ceil(intel.weeksToCbdTarget)}</strong> (theoretischer Wert)
                </p>
                <p style="margin: 0.5rem 0 0; font-size: 0.8rem; color: #059669;">
                  In dieser Phase stabilisiert sich die Cannabinoid-Therapie und die Medikamente werden weiter reduziert.
                </p>
              </div>
            `;
          }
          return '';
        })()}
        
        <!-- Cannabinoid-Anwendung pro Tag (klar getrennt) -->
        <div style="padding: 1.25rem; border-radius: 12px; background: linear-gradient(135deg, #ecfdf5 0%, #f9fafb 100%); border: 1px solid #d1fae5;">
          <h3 style="margin: 0 0 1rem; font-size: 0.9rem; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;">Cannabinoid-Anwendung pro Tag</h3>
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
          // PlanIntelligenz 2.0: Weekly metrics display
          let metricsHtml = '<div style="margin-top: 1.5rem; padding: 0.875rem; border-radius: 6px; background: #f9fafb; border: 1px solid #e5e7eb;">';
          metricsHtml += '<div style="font-size: 0.8rem; color: #6b7280; line-height: 1.6;">';
          
          // Medication load
          if (week.totalMedicationLoad !== undefined) {
            metricsHtml += `<p style="margin: 0 0 0.375rem 0;">• Tägliche Medikamentenlast: <strong style="color: #1f2937;">${week.totalMedicationLoad} mg/Tag</strong></p>`;
          }
          
          // Cannabinoid dose with mg/kg
          if (week.actualCbdMg !== undefined) {
            let cbdText = `• Cannabinoid-Dosis: <strong style="color: #1f2937;">${week.actualCbdMg} mg/Tag</strong>`;
            if (week.cannabinoidMgPerKg !== null && week.cannabinoidMgPerKg !== undefined) {
              cbdText += ` (~<strong>${week.cannabinoidMgPerKg} mg/kg</strong> KG)`;
            }
            metricsHtml += `<p style="margin: 0 0 0.375rem 0;">${cbdText}</p>`;
          }
          
          // Cannabinoid-to-load ratio
          if (week.cannabinoidToLoadRatio !== null && week.cannabinoidToLoadRatio !== undefined) {
            metricsHtml += `<p style="margin: 0;">• Cannabinoid-Anteil an der täglichen Stofflast: <strong style="color: #1f2937;">${week.cannabinoidToLoadRatio}%</strong></p>`;
          }
          
          metricsHtml += '</div></div>';
          return metricsHtml;
        })()}
        
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
  // PlanIntelligenz 2.0: SICHERHEITSÜBERSICHT
  // ============================================================
  
  html += `
    <div style="margin-top: 1.5rem; padding: 1.5rem 1.3rem; border-radius: 12px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 1.25rem; font-size: 1.1rem; font-weight: 700; color: #0b7b6c;">Sicherheitsübersicht Ihres Plans</h2>
      
      ${(() => {
        const intel = data.planIntelligence;
        if (!intel) return '';
        
        let overview = '<p style="margin: 0; font-size: 0.9rem; line-height: 1.7; color: #374151;">';
        overview += `In Ihrem Plan werden insgesamt <strong>${intel.totalMedicationCount}</strong> Medikamente berücksichtigt. `;
        
        if (intel.sensitiveMedCount > 0) {
          overview += `Davon fallen <strong>${intel.sensitiveMedCount}</strong> in Gruppen, bei denen ein besonders vorsichtiges Vorgehen empfohlen wird (z.B. Blutverdünner, Immunsuppressiva, Antidepressiva, Antiepileptika, Benzodiazepine oder starke Schmerzmittel). `;
        }
        
        overview += 'Die berechneten Verläufe sind theoretische Vorschläge. Ob, wann und in welchem Tempo tatsächlich reduziert wird, entscheidet immer Ihr behandelnder Arzt.';
        overview += '</p>';
        
        return overview;
      })()}
      
      ${(() => {
        // PlanIntelligenz 2.0: Intelligent comparison of reduction speeds
        const intel = data.planIntelligence;
        if (!intel || !intel.cannabinoidIncreasePctPerWeek || !intel.avgReductionSpeedPct) return '';
        
        const cannabinoidSpeed = intel.cannabinoidIncreasePctPerWeek;
        const medSpeed = intel.avgReductionSpeedPct;
        
        let comparisonHtml = '<div style="margin-top: 1.25rem; padding: 1rem 1.25rem; border-radius: 8px; background: #f0fdf4; border-left: 3px solid #0b7b6c;">';
        comparisonHtml += '<p style="margin: 0; font-size: 0.9rem; line-height: 1.6; color: #047857;">';
        
        if (cannabinoidSpeed < medSpeed) {
          comparisonHtml += '<strong>Hinweis zur Dosierungsanpassung:</strong> In den ersten Wochen werden Ihre Medikamente etwas schneller reduziert, als die Cannabinoid-Dosis ansteigt. Achten Sie in dieser Phase besonders auf Ihr Körpergefühl und sprechen Sie Veränderungen mit Ihrem Arzt durch.';
        } else {
          comparisonHtml += '<strong>Hinweis zur Dosierungsanpassung:</strong> Die Cannabinoid-Dosis wird in einem ähnlichen oder etwas schnelleren Tempo angepasst als die Medikamente reduziert werden. Dies kann dazu beitragen, den Übergang sanfter zu gestalten, ersetzt aber keine ärztliche Kontrolle.';
        }
        
        comparisonHtml += '</p></div>';
        return comparisonHtml;
      })()}
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
    <style>
      /* Professional Medical PDF Button */
      .pdf-download-button {
        /* Form & Size - Full width up to 320px */
        padding: 16px 32px;
        max-width: 320px;
        width: 100%;
        height: 56px;
        border-radius: 12px;
        border: none;
        
        /* Colors - MEDLESS Green (#0E5F45) */
        background: #0E5F45;
        color: white;
        
        /* Typography - Professional Medical */
        font-size: 17px;
        font-weight: 600;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        letter-spacing: -0.01em;
        
        /* Layout - Icon left, text right */
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        
        /* Shadow - Professional depth */
        box-shadow: 
          0 2px 4px rgba(14, 95, 69, 0.08),
          0 4px 12px rgba(14, 95, 69, 0.12);
        
        /* Animation - Smooth scale effect */
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        
        /* Prevent text selection */
        user-select: none;
        -webkit-user-select: none;
      }
      
      .pdf-download-button:hover {
        /* Hover: +10% lighter (#107A5A) */
        background: #107A5A;
        transform: scale(1.03);
        box-shadow: 
          0 4px 8px rgba(14, 95, 69, 0.12),
          0 8px 20px rgba(14, 95, 69, 0.16);
      }
      
      .pdf-download-button:active {
        background: #0D5540;
        transform: scale(1.01);
        box-shadow: 
          0 2px 4px rgba(14, 95, 69, 0.1),
          0 4px 10px rgba(14, 95, 69, 0.14);
      }
      
      .pdf-download-button:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        transform: scale(1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      }
      
      .pdf-download-button i {
        font-size: 22px;
        color: white;
      }
      
      /* Mobile Optimization */
      @media (max-width: 768px) {
        .pdf-download-button {
          max-width: 90%;
          padding: 15px 28px;
          font-size: 16px;
        }
        
        .pdf-download-button i {
          font-size: 20px;
        }
      }
      
      @media (max-width: 360px) {
        .pdf-download-button {
          max-width: 100%;
          padding: 14px 24px;
        }
      }
    </style>
    
    <div style="margin: 3rem 0 2rem; text-align: center;">
      <button 
        onclick="downloadPDF(event)" 
        class="pdf-download-button"
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
  
  // ============================================================
  // NEU: REPORT-VORSCHAUEN HINZUFÜGEN (Patient + Arzt)
  // ============================================================
  // Die neue API-Route /api/analyze-and-reports gibt uns:
  // data.patient.html (HTML-String für Patientenbericht)
  // data.doctor.html (HTML-String für Ärztebericht)
  // Wir zeigen beide als iframe-Vorschau am Ende des Ergebnisbereichs an
  
  if (data.patient && data.patient.html) {
    console.log('📄 Patientenbericht-HTML gefunden, füge Vorschau hinzu');
    
    // Erstelle Container für Patientenbericht-Vorschau
    const patientPreviewSection = document.createElement('section');
    patientPreviewSection.style.marginTop = '3rem';
    patientPreviewSection.style.padding = '1.5rem';
    patientPreviewSection.style.backgroundColor = '#f9fafb';
    patientPreviewSection.style.borderRadius = '12px';
    patientPreviewSection.style.border = '1px solid #e5e7eb';
    
    patientPreviewSection.innerHTML = `
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #0F5A46; margin-bottom: 1rem;">
        📄 Patientenbericht (Vorschau)
      </h2>
      <p style="color: #6b7280; margin-bottom: 1rem;">
        Hier sehen Sie eine Vorschau des generierten Patientenberichts, der später als PDF heruntergeladen werden kann.
      </p>
      <details style="cursor: pointer;">
        <summary style="font-weight: 600; color: #374151; padding: 0.5rem; background: white; border-radius: 6px; list-style: none; user-select: none;">
          <span style="display: inline-block; margin-right: 0.5rem;">▶</span>
          HTML-Vorschau anzeigen/ausblenden
        </summary>
        <div style="margin-top: 12px; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; background: white;">
          <iframe 
            srcdoc="${data.patient.html.replace(/"/g, '&quot;')}"
            style="width: 100%; height: 600px; border: none; display: block;"
            title="Patientenbericht Vorschau"
          ></iframe>
        </div>
      </details>
    `;
    
    resultsDiv.appendChild(patientPreviewSection);
    console.log('✅ Patientenbericht-Vorschau hinzugefügt');
  }
  
  if (data.doctor && data.doctor.html) {
    console.log('📄 Ärztebericht-HTML gefunden, füge Vorschau hinzu');
    
    // Erstelle Container für Ärztebericht-Vorschau
    const doctorPreviewSection = document.createElement('section');
    doctorPreviewSection.style.marginTop = '2rem';
    doctorPreviewSection.style.padding = '1.5rem';
    doctorPreviewSection.style.backgroundColor = '#fef3c7';
    doctorPreviewSection.style.borderRadius = '12px';
    doctorPreviewSection.style.border = '1px solid #fbbf24';
    
    doctorPreviewSection.innerHTML = `
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #92400e; margin-bottom: 1rem;">
        🩺 Ärztebericht (Vorschau)
      </h2>
      <p style="color: #78350f; margin-bottom: 1rem;">
        Dieser Bericht ist für medizinisches Fachpersonal gedacht und enthält detaillierte pharmakokinetische Daten.
      </p>
      <details style="cursor: pointer;">
        <summary style="font-weight: 600; color: #78350f; padding: 0.5rem; background: white; border-radius: 6px; list-style: none; user-select: none;">
          <span style="display: inline-block; margin-right: 0.5rem;">▶</span>
          HTML-Vorschau anzeigen/ausblenden
        </summary>
        <div style="margin-top: 12px; border: 1px solid #f59e0b; border-radius: 8px; overflow: hidden; background: white;">
          <iframe 
            srcdoc="${data.doctor.html.replace(/"/g, '&quot;')}"
            style="width: 100%; height: 600px; border: none; display: block;"
            title="Ärztebericht Vorschau"
          ></iframe>
        </div>
      </details>
    `;
    
    resultsDiv.appendChild(doctorPreviewSection);
    console.log('✅ Ärztebericht-Vorschau hinzugefügt');
  }
  
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

// ============================================================
// KOMPAKTES 2-SEITEN-PDF - THERAPIE-COCKPIT
// Modern, übersichtlich, max. 2 Seiten
// ============================================================

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
    console.log('🎯 PDF-Generierung gestartet (Kompaktes 2-Seiten-Layout)...');
    
    // Show loading
    if (button) {
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>PDF wird erstellt...</span>';
      button.disabled = true;
    }
    
    const { jsPDF } = window.jspdf;
    const { analysis, weeklyPlan, firstName, gender, personalization, costs, product } = window.currentPlanData;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    
    // COLORS (MEDLESS Brand)
    const colors = {
      primary: [15, 90, 70],          // Waldgrün #0F5A46
      mint: [29, 185, 141],           // Mintgrün #1DB98D
      lightMint: [240, 253, 244],     // Sehr helles Mintgrün (bessere Lesbarkeit)
      darkGray: [31, 41, 55],         // Dunkles Grau #1F2937
      mediumGray: [107, 114, 128],    // Mittleres Grau #6B7280
      lightGray: [156, 163, 175],     // Helles Grau #9CA3AF
      tableBorder: [229, 231, 235],   // Tabellen-Border #E5E7EB
      tableHeader: [249, 250, 251],   // Tabellen-Header #F9FAFB
      red: [220, 38, 38],             // Rot für Medikamente #DC2626
      green: [29, 185, 141],          // Grün für Cannabinoide #1DB98D
      warningOrange: [245, 158, 11]   // Orange für Warnungen
    };
    
    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    
    // Sauberes Logo ohne Sonderzeichen
    const addLogo = (xPos, yPos) => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('MedLess', xPos, yPos);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.mediumGray);
      doc.text('weniger Medikamente, mehr Leben', xPos, yPos + 4);
    };
    
    // Footer
    const addFooter = (pageNum) => {
      doc.setFontSize(7);
      doc.setTextColor(...colors.lightGray);
      doc.text('© 2025 MEDLESS – Dieser Plan ersetzt keine ärztliche Entscheidung', margin, pageHeight - 8);
      doc.text(`Seite ${pageNum} von 2`, pageWidth - margin - 15, pageHeight - 8);
    };
    
    // ============================================================
    // SEITE 1: THERAPIE-COCKPIT
    // ============================================================
    
    // HEADER: Patientendaten (Links) + Logo/Datum (Rechts)
    y = margin;
    
    // Links: Patientendaten (schoen formatiert)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.mediumGray);
    let patientLine = '';
    if (firstName) patientLine += `Name: ${firstName}`;
    if (personalization?.age) patientLine += ` | Alter: ${personalization.age}J`;
    if (personalization?.height) patientLine += ` | ${personalization.height}cm`;
    if (personalization?.weight) patientLine += ` | ${personalization.weight}kg`;
    if (personalization?.bmi) patientLine += ` | BMI ${personalization.bmi.toFixed(1)}`;
    doc.text(patientLine || 'Patient', margin, y + 3);
    
    // Rechts: Logo + Datum
    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    addLogo(pageWidth - 40, y + 3);
    doc.setFontSize(8);
    doc.setTextColor(...colors.mediumGray);
    doc.setFont(undefined, 'normal');
    doc.text(today, pageWidth - margin, y + 3, { align: 'right' });
    
    y += 12;
    
    // Trennlinie
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // ============================================================
    // ERFOLGSKURVE (Liniendiagramm)
    // ============================================================
    
    const chartX = margin;
    const chartY = y;
    const chartWidth = contentWidth;
    const chartHeight = 65;
    
    // Titel
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Die Erfolgskurve', chartX, chartY + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    doc.text('So verändert sich Ihre Medikamentenlast über 8 Wochen', chartX, chartY + 10);
    
    y = chartY + 15;
    
    // Chart-Bereich Border
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.rect(chartX, y, chartWidth, chartHeight - 15);
    
    // Berechne Werte
    const firstWeek = weeklyPlan[0];
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    
    const medStart = firstWeek.medications[0]?.startMg || firstWeek.medications[0]?.currentMg || 400;
    const medEnd = lastWeek.medications[0]?.currentMg || 200;
    const cbdStart = firstWeek.actualCbdMg || 35;
    const cbdEnd = lastWeek.actualCbdMg || 87;
    
    // Skalierung
    const maxValue = Math.max(medStart, cbdEnd, 500);
    const minValue = 0;
    const scaleY = (chartHeight - 30) / maxValue;
    const dataPointSpacing = (chartWidth - 30) / (weeklyPlan.length - 1);
    const startX = chartX + 15;
    const baseY = y + (chartHeight - 20);
    
    // Rasterlinien (horizontal)
    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const gridY = y + 5 + (i * (chartHeight - 25) / 4);
      doc.line(startX, gridY, chartX + chartWidth - 5, gridY);
      
      // Y-Achsen-Labels
      const value = Math.round(maxValue - (i * maxValue / 4));
      doc.setFontSize(6);
      doc.setTextColor(...colors.lightGray);
      doc.setFont(undefined, 'normal');
      doc.text(`${value}`, chartX + 2, gridY + 1);
    }
    
    // ROTE LINIE (Medikamente - abfallend)
    doc.setDrawColor(...colors.red);
    doc.setLineWidth(1.2);
    for (let idx = 0; idx < weeklyPlan.length; idx++) {
      const week = weeklyPlan[idx];
      const x = startX + (idx * dataPointSpacing);
      const medValue = week.medications[0]?.currentMg || (medStart - (idx * ((medStart - medEnd) / weeklyPlan.length)));
      const yPos = baseY - (medValue * scaleY);
      
      if (idx > 0) {
        const prevWeek = weeklyPlan[idx - 1];
        const prevMedValue = prevWeek.medications[0]?.currentMg || (medStart - ((idx - 1) * ((medStart - medEnd) / weeklyPlan.length)));
        const prevY = baseY - (prevMedValue * scaleY);
        const prevX = startX + ((idx - 1) * dataPointSpacing);
        doc.line(prevX, prevY, x, yPos);
      }
      
      // Datenpunkt
      doc.setFillColor(...colors.red);
      doc.circle(x, yPos, 1.2, 'F');
    }
    
    // GRÜNE LINIE (Cannabinoide - ansteigend)
    doc.setDrawColor(...colors.green);
    doc.setLineWidth(1.2);
    for (let idx = 0; idx < weeklyPlan.length; idx++) {
      const week = weeklyPlan[idx];
      const x = startX + (idx * dataPointSpacing);
      const cbdValue = week.actualCbdMg || (cbdStart + (idx * ((cbdEnd - cbdStart) / weeklyPlan.length)));
      const yPos = baseY - (cbdValue * scaleY);
      
      if (idx > 0) {
        const prevWeek = weeklyPlan[idx - 1];
        const prevCbdValue = prevWeek.actualCbdMg || (cbdStart + ((idx - 1) * ((cbdEnd - cbdStart) / weeklyPlan.length)));
        const prevY = baseY - (prevCbdValue * scaleY);
        const prevX = startX + ((idx - 1) * dataPointSpacing);
        doc.line(prevX, prevY, x, yPos);
      }
      
      // Datenpunkt
      doc.setFillColor(...colors.green);
      doc.circle(x, yPos, 1.2, 'F');
    }
    
    // X-Achsen-Labels (Wochen)
    doc.setFontSize(7);
    doc.setTextColor(...colors.mediumGray);
    doc.setFont(undefined, 'normal');
    weeklyPlan.forEach((week, idx) => {
      const x = startX + (idx * dataPointSpacing);
      doc.text(`W${idx + 1}`, x - 3, baseY + 5);
    });
    
    // Legende
    const legendY = baseY + 9;
    const legendX = chartX + chartWidth - 95;
    
    // Rot (Medikamente)
    doc.setFillColor(...colors.red);
    doc.rect(legendX, legendY - 2, 8, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkGray);
    doc.setFont(undefined, 'normal');
    doc.text('Medikamente', legendX + 10, legendY);
    
    // Grün (Cannabinoide)
    doc.setFillColor(...colors.green);
    doc.rect(legendX + 45, legendY - 2, 8, 2, 'F');
    doc.text('Cannabinoide', legendX + 55, legendY);
    
    y = chartY + chartHeight + 5;
    
    // ============================================================
    // EINKAUFSLISTE (Kostenbox)
    // ============================================================
    
    const boxHeight = 28;
    
    // Box-Hintergrund
    doc.setFillColor(...colors.lightMint);
    doc.setDrawColor(...colors.mint);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, boxHeight, 'FD');
    
    // Titel
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('BENOETIGTES MATERIAL & KOSTEN', margin + 3, y + 6);
    
    // Produktliste
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.darkGray);
    
    if (costs && costs.costBreakdown) {
      const products = costs.costBreakdown.map(item => {
        const productName = item.product.replace('MedLess Nr. ', 'Nr. ');
        return `${item.bottleCount}× ${productName}`;
      }).join(' + ');
      doc.text(`Sie benötigen: ${products}`, margin + 3, y + 13);
      
      const totalCost = costs.totalCost.toFixed(2);
      const weeklyAvg = (costs.totalCost / weeklyPlan.length).toFixed(2);
      doc.setFont('helvetica', 'bold');
      doc.text(`Gesamtkosten:`, margin + 3, y + 19);
      doc.text(`${totalCost} EUR`, pageWidth - margin - 30, y + 19, { align: 'right' });
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.mediumGray);
      doc.text(`(Durchschnitt: ${weeklyAvg} € pro Woche)`, margin + 45, y + 19);
    }
    
    y += boxHeight + 8;
    
    // ============================================================
    // AKTUELLE MEDIKATION (Kompakt)
    // ============================================================
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Ihre aktuelle Medikation', margin, y);
    y += 7;
    
    if (analysis && analysis.length > 0) {
      const med = analysis[0];
      const rowHeight = 8;
      const col1W = contentWidth * 0.45;
      const col2W = contentWidth * 0.25;
      const col3W = contentWidth * 0.30;
      
      // Header
      doc.setFillColor(...colors.tableHeader);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, contentWidth, rowHeight);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.darkGray);
      doc.text('Medikament', margin + 2, y + 5);
      doc.text('Dosis', margin + col1W + 2, y + 5);
      doc.text('Wechselwirkung', margin + col1W + col2W + 2, y + 5);
      
      y += rowHeight;
      
      // Data Row
      doc.rect(margin, y, contentWidth, rowHeight);
      doc.setFont(undefined, 'normal');
      
      const medName = med.medication.name || 'Unbekannt';
      const dosage = med.mgPerDay ? `${med.mgPerDay} mg/Tag` : '-';
      
      doc.text(medName, margin + 2, y + 5);
      doc.text(dosage, margin + col1W + 2, y + 5);
      
      // Wechselwirkung
      if (med.interactions && med.interactions.length > 0) {
        const severity = med.interactions[0].severity;
        if (severity === 'critical' || severity === 'high') {
          doc.setTextColor(...colors.warningOrange);
          doc.setFont(undefined, 'bold');
          doc.text('⚠️ Verstärkung möglich', margin + col1W + col2W + 2, y + 5);
        } else {
          doc.setTextColor(...colors.mediumGray);
          doc.setFont(undefined, 'normal');
          doc.text('Leicht', margin + col1W + col2W + 2, y + 5);
        }
      } else {
        doc.setTextColor(...colors.lightGray);
        doc.text('Keine bekannt', margin + col1W + col2W + 2, y + 5);
      }
      
      y += rowHeight;
    }
    
    // Footer Seite 1
    addFooter(1);
    
    // ============================================================
    // SEITE 2: DER FAHRPLAN
    // ============================================================
    
    doc.addPage();
    y = margin;
    
    // Logo
    addLogo(pageWidth - 40, y + 3);
    y += 15;
    
    // Titel
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Der Fahrplan', margin, y);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    doc.text('Ihr 8-Wochen-Reduktionsplan – bitte mit Ihrem Arzt abstimmen', margin, y + 5);
    
    y += 12;
    
    // ============================================================
    // GROSSE 8-WOCHEN-TABELLE
    // ============================================================
    
    const colW1 = 15;  // Woche
    const colW2 = 45;  // Medikament
    const colW3 = 50;  // MedLess-Support
    const colW4 = 40;  // Verbrauch
    const colW5 = 15;  // Check
    const rowH = 9;
    
    // Header Row
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowH);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkGray);
    
    let xPos = margin;
    doc.text('Wo.', xPos + 3, y + 6);
    xPos += colW1;
    doc.text('Medikament (Dosis)', xPos + 2, y + 6);
    xPos += colW2;
    doc.text('MedLess-Support', xPos + 2, y + 6);
    xPos += colW3;
    doc.text('Verbrauch', xPos + 2, y + 6);
    xPos += colW4;
    doc.text('Check', xPos + 2, y + 6);
    
    y += rowH;
    
    // Data Rows (8 Wochen)
    weeklyPlan.forEach((week, idx) => {
      const isEven = idx % 2 === 0;
      
      // Alternierende Zeilen
      if (isEven) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, y, contentWidth, rowH, 'F');
      }
      
      doc.setDrawColor(...colors.tableBorder);
      doc.rect(margin, y, contentWidth, rowH);
      
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkGray);
      
      xPos = margin;
      
      // Woche
      doc.text(`${week.week}`, xPos + 5, y + 6);
      xPos += colW1;
      
      // Medikament (Dosis fett, Aenderung klein)
      const med = week.medications[0];
      if (med) {
        // Dosis fett anzeigen
        doc.setFont('helvetica', 'bold');
        doc.text(`${med.currentMg}mg`, xPos + 2, y + 6);
        doc.setFont('helvetica', 'normal');
        
        // Aenderung klein und rot daneben
        if (med.reduction && med.reduction > 0) {
          doc.setFontSize(7);
          doc.setTextColor(...colors.red);
          doc.text(`(-${med.reduction}mg)`, xPos + 20, y + 6);
          doc.setFontSize(8);
          doc.setTextColor(...colors.darkGray);
        }
      }
      xPos += colW2;
      
      // MedLess-Support
      const product = week.kannasanProduct.name.replace('MedLess ', '');
      const application = `${week.morningSprays}-0-${week.eveningSprays}`;
      doc.text(`${product}: ${application}`, xPos + 2, y + 6);
      xPos += colW3;
      
      // Verbrauch (ohne Emoji!)
      if (week.bottleStatus && week.bottleStatus.productChangeNext) {
        doc.setTextColor(...colors.warningOrange);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('WECHSEL', xPos + 2, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...colors.darkGray);
      } else {
        doc.text('-', xPos + 8, y + 6);
      }
      xPos += colW4;
      
      // Checkbox (sauberes leeres Quadrat)
      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.4);
      doc.rect(xPos + 4, y + 2.5, 5, 5);
      
      y += rowH;
    });
    
    y += 8;
    
    // ============================================================
    // FOOTER MIT HINWEISEN
    // ============================================================
    
    // Hinweise-Box
    const hinweisBoxY = pageHeight - 60;
    y = hinweisBoxY;
    
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 42, 'FD');
    
    // Titel
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkGray);
    doc.text('WICHTIGE HINWEISE', margin + 2, y + 5);
    
    // Hinweise (kompakt)
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    
    const hints = [
      '• CYP450-Interaktionen beachten  • Kein Alkohol, keine Grapefruit  • Niemals eigenständig absetzen',
      '• Bei Nebenwirkungen sofort Arzt kontaktieren  • Dieser Plan zeigt theoretische Möglichkeiten',
      '• Die Umsetzung erfolgt ausschließlich unter ärztlicher Aufsicht und Verantwortung'
    ];
    
    hints.forEach((hint, idx) => {
      doc.text(hint, margin + 2, y + 11 + (idx * 4));
    });
    
    // Unterschriftsfeld
    y += 28;
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkGray);
    doc.setFont(undefined, 'normal');
    doc.text('Stempel/Unterschrift Arzt:', margin + 2, y);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...colors.tableBorder);
    doc.line(margin + 42, y, pageWidth - margin - 2, y);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.lightGray);
    doc.text('Datum:', pageWidth - margin - 30, y + 5);
    doc.line(pageWidth - margin - 22, y + 5, pageWidth - margin - 2, y + 5);
    
    // Footer Seite 2
    addFooter(2);
    
    // ============================================================
    // SAVE PDF
    // ============================================================
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `MedLess_Plan_${firstName || 'Patient'}_${date}.pdf`;
    
    console.log('💾 Speichere PDF:', filename);
    doc.save(filename);
    
    console.log('✅ PDF erfolgreich erstellt (2 Seiten)!');
    
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
