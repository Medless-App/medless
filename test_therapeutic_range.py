#!/usr/bin/env python3
import requests, json, sys

BASE = "http://localhost:3000"

print("="*70)
print("🔬 MEDLESS THERAPEUTIC RANGE MONITORING - MINI-TESTS")
print("="*70)

# TEST 1: Posaconazol (therapeutic range: 700-3500 ng/ml, window_width=2800, breites Fenster)
# Erwartung: HAS_RANGE=True, IS_NARROW=False, KEINE zusätzliche Bremsung
print("\n🧪 TEST 1: Posaconazol (breites therapeutisches Fenster)")
print("="*70)
resp = requests.post(f"{BASE}/api/analyze", json={
    "medications": [{"name":"Posaconazol","mgPerDay":400}],
    "reductionGoal": 50, "durationWeeks": 8,
    "age": 50, "weight": 75, "gender": "m"
}, timeout=15)
data = resp.json()

tr = data.get("therapeutic_range",{})
print(f"✅ totalMedicationsWithRange: {tr.get('totalMedicationsWithRange',0)}")
print(f"✅ medicationsWithNarrowWindow: {tr.get('medicationsWithNarrowWindow',[])}")

if len(tr.get('medications',[])) > 0:
    med_tr = tr['medications'][0]
    print(f"✅ Posaconazol has_range: {med_tr.get('has_range')}")
    print(f"✅ Posaconazol min/max: {med_tr.get('min_ng_ml')}-{med_tr.get('max_ng_ml')} ng/ml")
    print(f"✅ Posaconazol window_width: {med_tr.get('window_width')}")
    print(f"✅ Posaconazol is_narrow_window: {med_tr.get('is_narrow_window')}")
    
    if not med_tr.get('is_narrow_window'):
        print("✅ ERWARTUNG ERFÜLLT: Breites Fenster erkannt (kein narrow window)")
    else:
        print("❌ FEHLER: Breites Fenster sollte NICHT als narrow markiert sein")
        sys.exit(1)

# Check safety notes for week 1
notes = data.get('weeklyPlan',[{}])[0].get('medicationSafetyNotes',{}).get('Posaconazol',[])
narrow_window_notes = [n for n in notes if 'therapeutisches Fenster' in n.lower()]
if len(narrow_window_notes) == 0:
    print("✅ ERWARTUNG ERFÜLLT: Keine narrow-window-Warnungen (breites Fenster)")
else:
    print(f"ℹ️ Gefunden: {narrow_window_notes}")

# TEST 2: Marcumar (kein therapeutischer Bereich definiert)
# Erwartung: HAS_RANGE=False, KEINE therapeutic range warnings
print("\n🧪 TEST 2: Marcumar (kein therapeutischer Bereich)")
print("="*70)
resp = requests.post(f"{BASE}/api/analyze", json={
    "medications": [{"name":"Marcumar","mgPerDay":5}],
    "reductionGoal": 50, "durationWeeks": 12,
    "age": 50, "weight": 75, "gender": "m"
}, timeout=15)
data = resp.json()

tr = data.get("therapeutic_range",{})
print(f"✅ totalMedicationsWithRange: {tr.get('totalMedicationsWithRange',0)}")

if len(tr.get('medications',[])) > 0:
    med_tr = tr['medications'][0]
    print(f"✅ Marcumar has_range: {med_tr.get('has_range')}")
    
    if not med_tr.get('has_range'):
        print("✅ ERWARTUNG ERFÜLLT: Kein therapeutischer Bereich definiert")
    else:
        print("❌ FEHLER: Marcumar sollte KEINEN therapeutischen Bereich haben")
        sys.exit(1)

notes = data.get('weeklyPlan',[{}])[0].get('medicationSafetyNotes',{}).get('Marcumar',[])
tr_notes = [n for n in notes if 'therapeutisches Fenster' in n.lower() or 'dosierungsgefahr' in n.lower()]
if len(tr_notes) == 0:
    print("✅ ERWARTUNG ERFÜLLT: Keine therapeutic range warnings (kein Bereich definiert)")
else:
    print(f"❌ FEHLER: Sollte keine TR-Warnungen haben: {tr_notes}")
    sys.exit(1)

# TEST 3: CYP-Logik noch intakt? (Marcumar hat 3 CYP profiles)
print("\n🧪 TEST 3: CYP-Logik Integrität Check (Marcumar)")
print("="*70)
cyp = data.get("cyp_profile",{})
print(f"✅ totalCypProfiles: {cyp.get('totalCypProfiles',0)}")
print(f"✅ medicationsWithSlowerEffect: {cyp.get('medicationsWithSlowerEffect',[])}")

if cyp.get('totalCypProfiles',0) == 3 and 'Marcumar' in cyp.get('medicationsWithSlowerEffect',[]):
    print("✅ ERWARTUNG ERFÜLLT: CYP-Logik funktioniert weiterhin (3 Profile, slower effect)")
else:
    print("❌ FEHLER: CYP-Logik beschädigt!")
    sys.exit(1)

cyp_notes = [n for n in notes if 'CYP' in n]
if len(cyp_notes) > 0:
    print(f"✅ CYP-Note vorhanden: {cyp_notes[0][:80]}...")
else:
    print("❌ FEHLER: CYP-Note fehlt!")
    sys.exit(1)

print("\n" + "="*70)
print("✅ ALLE THERAPEUTIC RANGE TESTS ERFOLGREICH")
print("✅ CYP-LOGIK INTAKT")
print("="*70)
