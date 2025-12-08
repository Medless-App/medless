#!/usr/bin/env python3
import requests, json, sys

BASE = "http://localhost:3000"

def test(name, payload, expected_slower=0, expected_faster=0):
    print(f"\n{'='*70}")
    print(f"🧪 {name}")
    print('='*70)
    resp = requests.post(f"{BASE}/api/analyze", json=payload, timeout=15)
    data = resp.json()
    cyp = data.get("cyp_profile",{})
    
    print(f"✅ totalMedicationsWithCypData: {cyp.get('totalMedicationsWithCypData',0)}")
    print(f"✅ totalCypProfiles: {cyp.get('totalCypProfiles',0)}")
    print(f"✅ medicationsWithSlowerEffect: {cyp.get('medicationsWithSlowerEffect',[])}")
    print(f"✅ medicationsWithFasterEffect: {cyp.get('medicationsWithFasterEffect',[])}")
    
    if 'weeklyPlan' in data and len(data['weeklyPlan']) > 0:
        notes = data['weeklyPlan'][0].get('medicationSafetyNotes',{})
        for med, note_list in notes.items():
            cyp_notes = [n for n in note_list if 'CYP' in n]
            if cyp_notes:
                print(f"\n📋 CYP-Hinweis für {med}:")
                print(f"   {cyp_notes[0]}")
    
    # Validierung
    actual_slower = len(cyp.get('medicationsWithSlowerEffect',[]))
    actual_faster = len(cyp.get('medicationsWithFasterEffect',[]))
    if actual_slower == expected_slower and actual_faster == expected_faster:
        print(f"\n✅ TEST ERFOLGREICH")
    else:
        print(f"\n❌ TEST FEHLGESCHLAGEN: Erwartet slower={expected_slower}, faster={expected_faster}, aber bekommen slower={actual_slower}, faster={actual_faster}")
        sys.exit(1)

if __name__ == "__main__":
    print("="*70)
    print("🔬 MEDLESS CYP-PROFILE INTEGRATION - FINALE MINI-TESTS V2")
    print("="*70)
    
    # Test 1: Marcumar (3 CYP slower)
    test("TEST 1: Marcumar (3 CYP 'slower')", {
        "medications": [{"name":"Marcumar","mgPerDay":5}],
        "reductionGoal": 50, "durationWeeks": 12,
        "age": 50, "weight": 75, "gender": "m"
    }, expected_slower=1, expected_faster=0)
    
    # Test 2: Lorazepam (1 CYP faster)
    test("TEST 2: Lorazepam (1 CYP 'faster')", {
        "medications": [{"name":"Lorazepam","mgPerDay":2}],
        "reductionGoal": 50, "durationWeeks": 12,
        "age": 50, "weight": 75, "gender": "m"
    }, expected_slower=0, expected_faster=1)
    
    # Test 3: Ibuprofen (kein CYP)
    test("TEST 3: Ibuprofen (kein CYP)", {
        "medications": [{"name":"Ibuprofen","mgPerDay":400}],
        "reductionGoal": 50, "durationWeeks": 8,
        "age": 50, "weight": 75, "gender": "m"
    }, expected_slower=0, expected_faster=0)
    
    # Test 4: Marcumar + Prozac (beide slower)
    test("TEST 4: Marcumar + Prozac (beide 'slower')", {
        "medications": [
            {"name":"Marcumar","mgPerDay":5},
            {"name":"Prozac","mgPerDay":20}
        ],
        "reductionGoal": 50, "durationWeeks": 12,
        "age": 50, "weight": 75, "gender": "m"
    }, expected_slower=2, expected_faster=0)
    
    print("\n" + "="*70)
    print("✅ ALLE TESTS ERFOLGREICH ABGESCHLOSSEN")
    print("="*70)
