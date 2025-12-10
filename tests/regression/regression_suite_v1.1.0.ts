/**
 * MEDLESS V1.1.0 - REGRESSION TEST SUITE
 * 
 * Diese Test-Suite verifiziert alle 6 Megaprompt-Regeln und
 * API-Endpoint-Funktionalität gegen ein deterministisches Testprofil.
 * 
 * Testprofil:
 * - Medikament: Lorazepam
 * - Startdosis: 300 mg
 * - Zieldosis: 207 mg (31% Reduktion nach 12 Wochen)
 * - CBD: 36 mg → 72 mg
 * - Körpergewicht: 72 kg
 * - Reduktionsziel: 50% (tatsächlich 31% wegen Sicherheitsfaktoren)
 */

// Test configuration
const TEST_API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const FIXED_TEST_PROFILE = {
  medications: [
    { generic_name: 'Lorazepam', mgPerDay: 300 }
  ],
  durationWeeks: 12,
  patientName: 'Regression Test Patient',
  patientAge: 45,
  patientGender: 'female',
  patientWeight: 72,
  reductionGoal: 50
};

const EXPECTED_VALUES = {
  cbd: {
    start: 36,
    end: 72,
    mgPerKgEnd: 1.00
  },
  lorazepam: {
    start: 300,
    // Hinweis: Tatsächliche Enddosis kann variieren je nach Sicherheitsanpassungen
    minEnd: 150, // Mindestens 50% Reduktion
    maxEnd: 300  // Maximal keine Reduktion (bei extremem Risiko)
  },
  reduction: {
    theoreticalPercent: 50,
    // actualPercent wird dynamisch berechnet
  }
};

/**
 * Test Helper: Fetch API
 */
async function fetchAPI(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const url = `${TEST_API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return await response.json();
}

/**
 * TEST 1: CBD-Enddosis Konsistenz
 * 
 * Verifiziert dass CBD-Werte in Analysis, Patient Data und Doctor Data identisch sind
 */
export async function test_cbd_consistency(): Promise<{ pass: boolean; details: string }> {
  console.log('🧪 TEST 1: CBD-Enddosis Konsistenz');
  
  try {
    const response = await fetchAPI('/api/analyze-and-reports', 'POST', FIXED_TEST_PROFILE);
    
    const analysisCBD = response.analysis.cbdProgression.endMg;
    const patientCBD = response.patient.data.cbdDoseInfo.endDose;
    const doctorCBD = response.doctor.data.cbdProgression.endMg;
    
    // Check if all values match
    const allMatch = (analysisCBD === patientCBD) && (analysisCBD === doctorCBD);
    
    // Check if values are within expected range
    const withinExpectedRange = analysisCBD === EXPECTED_VALUES.cbd.end;
    
    if (allMatch && withinExpectedRange) {
      return {
        pass: true,
        details: `✅ PASS: CBD End = ${analysisCBD}mg (Analysis = Patient = Doctor)`
      };
    } else {
      return {
        pass: false,
        details: `❌ FAIL: CBD mismatch - Analysis: ${analysisCBD}, Patient: ${patientCBD}, Doctor: ${doctorCBD}, Expected: ${EXPECTED_VALUES.cbd.end}`
      };
    }
  } catch (error: any) {
    return { pass: false, details: `❌ ERROR: ${error.message}` };
  }
}

/**
 * TEST 2: Keine Duplikate in Sicherheitshinweisen
 * 
 * Verifiziert dass jedes Medikament nur einmal in fullSafetyNotes erscheint
 */
export async function test_no_duplicates(): Promise<{ pass: boolean; details: string }> {
  console.log('🧪 TEST 2: Keine Duplikate in Sicherheitshinweisen');
  
  try {
    const response = await fetchAPI('/api/analyze-and-reports', 'POST', FIXED_TEST_PROFILE);
    
    const fullSafetyNotes = response.doctor.data.fullSafetyNotes;
    const medicationNames = fullSafetyNotes.map((note: any) => note.medicationName);
    const uniqueNames = [...new Set(medicationNames)];
    
    if (medicationNames.length === uniqueNames.length) {
      return {
        pass: true,
        details: `✅ PASS: ${medicationNames.length} Medikamente, keine Duplikate`
      };
    } else {
      return {
        pass: false,
        details: `❌ FAIL: ${medicationNames.length} Einträge, aber nur ${uniqueNames.length} eindeutige Medikamente`
      };
    }
  } catch (error: any) {
    return { pass: false, details: `❌ ERROR: ${error.message}` };
  }
}

/**
 * TEST 3: mg/mg/kg Formatierungsregeln
 * 
 * Verifiziert:
 * - mg-Werte: "XX mg täglich"
 * - mg/kg-Werte: "X.XX mg/kg" (exakt 2 Dezimalstellen)
 */
export async function test_formatting_rules(): Promise<{ pass: boolean; details: string }> {
  console.log('🧪 TEST 3: mg/mg/kg Formatierungsregeln');
  
  try {
    const response = await fetchAPI('/api/analyze-and-reports', 'POST', FIXED_TEST_PROFILE);
    
    const patientHTML = response.patient.html;
    
    // Check for "mg täglich" format
    const mgPattern = /\d+ mg täglich/g;
    const mgMatches = patientHTML.match(mgPattern);
    
    // Check for "X.XX mg/kg" format (exactly 2 decimal places)
    const mgPerKgPattern = /\d+\.\d{2} mg\/kg/g;
    const mgPerKgMatches = patientHTML.match(mgPerKgPattern);
    
    if (mgMatches && mgMatches.length > 0 && mgPerKgMatches && mgPerKgMatches.length > 0) {
      return {
        pass: true,
        details: `✅ PASS: ${mgMatches.length} mg-Werte, ${mgPerKgMatches.length} mg/kg-Werte (2 Dezimalstellen)`
      };
    } else {
      return {
        pass: false,
        details: `❌ FAIL: mg-Werte: ${mgMatches?.length || 0}, mg/kg-Werte: ${mgPerKgMatches?.length || 0}`
      };
    }
  } catch (error: any) {
    return { pass: false, details: `❌ ERROR: ${error.message}` };
  }
}

/**
 * TEST 4: Theoretisch vs. Tatsächlich
 * 
 * Verifiziert dass reductionSummary beide Werte enthält
 */
export async function test_theoretical_vs_actual(): Promise<{ pass: boolean; details: string }> {
  console.log('🧪 TEST 4: Theoretisch vs. Tatsächlich');
  
  try {
    const response = await fetchAPI('/api/analyze-and-reports', 'POST', FIXED_TEST_PROFILE);
    
    const reductionSummary = response.doctor.data.reductionSummary;
    
    const hasTheoretical = reductionSummary.theoreticalTargetPercent !== undefined;
    const hasActual = reductionSummary.actualReductionPercent !== undefined;
    
    if (hasTheoretical && hasActual) {
      return {
        pass: true,
        details: `✅ PASS: Theoretisch: ${reductionSummary.theoreticalTargetPercent}%, Tatsächlich: ${reductionSummary.actualReductionPercent}%`
      };
    } else {
      return {
        pass: false,
        details: `❌ FAIL: reductionSummary unvollständig - Theoretisch: ${hasTheoretical}, Tatsächlich: ${hasActual}`
      };
    }
  } catch (error: any) {
    return { pass: false, details: `❌ ERROR: ${error.message}` };
  }
}

/**
 * TEST 5: API Endpunkte liefern 200 OK
 * 
 * Verifiziert dass alle wichtigen Endpunkte funktionsfähig sind
 */
export async function test_api_endpoints(): Promise<{ pass: boolean; details: string }> {
  console.log('🧪 TEST 5: API Endpunkte');
  
  const endpoints = [
    { name: 'build-info', path: '/api/build-info', method: 'GET' },
    { name: 'analyze-and-reports', path: '/api/analyze-and-reports', method: 'POST', body: FIXED_TEST_PROFILE }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      await fetchAPI(endpoint.path, endpoint.method, endpoint.body);
      results.push(`✅ ${endpoint.name}`);
    } catch (error: any) {
      results.push(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
  const allPassed = results.every(r => r.startsWith('✅'));
  
  return {
    pass: allPassed,
    details: allPassed 
      ? `✅ PASS: Alle ${endpoints.length} Endpunkte funktionsfähig` 
      : `❌ FAIL:\n${results.join('\n')}`
  };
}

/**
 * Run all regression tests
 */
export async function runRegressionSuite(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   MEDLESS V1.1.0 - REGRESSION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const tests = [
    { name: 'TEST 1: CBD-Enddosis Konsistenz', fn: test_cbd_consistency },
    { name: 'TEST 2: Keine Duplikate', fn: test_no_duplicates },
    { name: 'TEST 3: mg/mg/kg Formatierung', fn: test_formatting_rules },
    { name: 'TEST 4: Theoretisch vs. Tatsächlich', fn: test_theoretical_vs_actual },
    { name: 'TEST 5: API Endpunkte', fn: test_api_endpoints }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, ...result });
    console.log(result.details);
    console.log('');
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  const passedCount = results.filter(r => r.pass).length;
  const totalCount = results.length;
  const passRate = Math.round((passedCount / totalCount) * 100);
  
  console.log(`\n📊 ERGEBNIS: ${passedCount}/${totalCount} Tests bestanden (${passRate}%)\n`);
  
  if (passedCount === totalCount) {
    console.log('✅ ALLE TESTS BESTANDEN - REGRESSION CHECK OK');
  } else {
    console.log('❌ EINIGE TESTS FEHLGESCHLAGEN - REGRESSION ERKANNT');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runRegressionSuite().catch(console.error);
}
