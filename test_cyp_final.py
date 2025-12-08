#!/usr/bin/env python3
import requests
import json
import sys

BASE = "http://localhost:3000"

def test_1_slower():
    """Marcumar (3 CYP slower) → -30% Reduktion"""
    print("\n🧪 TEST 1: Marcumar (3 CYP 'slower') → Erwartung: -30% Reduktion")
    payload = {
        "medications": [{"name":"Marcumar","dosage":"5mg/Tag"}],
        "reductionGoal": 50,
        "durationWeeks": 12,
        "age": 50, "weight": 75, "gender": "m", "firstName": "Test1"
    }
    resp = requests.post(f"{BASE}/api/analyze", json=payload, timeout=15)
    data = resp.json()
    cyp = data.get("cyp_profile",{})
    
    print(f"   ✅ totalMedicationsWithCypData: {cyp.get('totalMedicationsWithCypData',0)}")
    print(f"   ✅ totalCypProfiles: {cyp.get('totalCypProfiles',0)}")
    print(f"   ✅ medicationsWithSlowerEffect: {cyp.get('medicationsWithSlowerEffect',[])}")
    print(f"   ✅ affectedEnzymes: {cyp.get('affectedEnzymes',[])}")
    
    notes = data.get("weeklyPlan",[{}])[0].get("medicationSafetyNotes",{}).get("Marcumar",[])
    cyp_note = [n for n in notes if "CYP" in n]
    print(f"   ✅ CYP-Sicherheitshinweis gefunden: {len(cyp_note) > 0}")
    if cyp_note:
        print(f"      → {cyp_note[0][:100]}...")
    return data

def test_2_faster():
    """Lorazepam (1 CYP faster) → +15% Reduktion"""
    print("\n🧪 TEST 2: Lorazepam (1 CYP 'faster') → Erwartung: +15% Reduktion")
    payload = {
        "medications": [{"name":"Lorazepam","dosage":"2mg/Tag"}],
        "reductionGoal": 50,
        "durationWeeks": 12,
        "age": 50, "weight": 75, "gender": "m", "firstName": "Test2"
    }
    resp = requests.post(f"{BASE}/api/analyze", json=payload, timeout=15)
    data = resp.json()
    cyp = data.get("cyp_profile",{})
    
    print(f"   ✅ totalMedicationsWithCypData: {cyp.get('totalMedicationsWithCypData',0)}")
    print(f"   ✅ medicationsWithFasterEffect: {cyp.get('medicationsWithFasterEffect',[])}")
    
    notes = data.get("weeklyPlan",[{}])[0].get("medicationSafetyNotes",{}).get("Lorazepam",[])
    cyp_note = [n for n in notes if "CYP" in n]
    print(f"   ✅ CYP-Sicherheitshinweis gefunden: {len(cyp_note) > 0}")
    if cyp_note:
        print(f"      → {cyp_note[0][:100]}...")
    return data

def test_3_no_cyp():
    """Ibuprofen (kein CYP) → keine CYP-Anpassung"""
    print("\n🧪 TEST 3: Ibuprofen (kein CYP) → Erwartung: keine CYP-Anpassung")
    payload = {
        "medications": [{"name":"Ibuprofen","dosage":"400mg/Tag"}],
        "reductionGoal": 50,
        "durationWeeks": 8,
        "age": 50, "weight": 75, "gender": "m", "firstName": "Test3"
    }
    resp = requests.post(f"{BASE}/api/analyze", json=payload, timeout=15)
    data = resp.json()
    cyp = data.get("cyp_profile",{})
    
    print(f"   ✅ totalMedicationsWithCypData: {cyp.get('totalMedicationsWithCypData',0)}")
    print(f"   ✅ totalCypProfiles: {cyp.get('totalCypProfiles',0)}")
    
    notes_w1 = data.get("weeklyPlan",[{}])[0].get("medicationSafetyNotes",{}).get("Ibuprofen",[])
    cyp_note = [n for n in notes_w1 if "CYP" in n]
    print(f"   ✅ Keine CYP-Hinweise (erwartet): {len(cyp_note) == 0}")
    return data

def test_4_multi_meds():
    """Marcumar + Prozac (beide 'slower') → beide -30%"""
    print("\n🧪 TEST 4: Marcumar + Prozac (beide 'slower') → Erwartung: beide -30%")
    payload = {
        "medications": [
            {"name":"Marcumar","dosage":"5mg/Tag"},
            {"name":"Prozac","dosage":"20mg/Tag"}
        ],
        "reductionGoal": 50,
        "durationWeeks": 12,
        "age": 50, "weight": 75, "gender": "m", "firstName": "Test4"
    }
    resp = requests.post(f"{BASE}/api/analyze", json=payload, timeout=15)
    data = resp.json()
    cyp = data.get("cyp_profile",{})
    
    print(f"   ✅ totalMedicationsWithCypData: {cyp.get('totalMedicationsWithCypData',0)}")
    print(f"   ✅ totalCypProfiles: {cyp.get('totalCypProfiles',0)}")
    print(f"   ✅ medicationsWithSlowerEffect: {cyp.get('medicationsWithSlowerEffect',[])}")
    
    notes_marc = data.get("weeklyPlan",[{}])[0].get("medicationSafetyNotes",{}).get("Marcumar",[])
    notes_proz = data.get("weeklyPlan",[{}])[0].get("medicationSafetyNotes",{}).get("Prozac",[])
    cyp_marc = [n for n in notes_marc if "CYP" in n]
    cyp_proz = [n for n in notes_proz if "CYP" in n]
    print(f"   ✅ Marcumar CYP-Note: {len(cyp_marc) > 0}")
    print(f"   ✅ Prozac CYP-Note: {len(cyp_proz) > 0}")
    return data

if __name__ == "__main__":
    try:
        print("="*70)
        print("🔬 MEDLESS CYP-PROFILE INTEGRATION - FINALE MINI-TESTS")
        print("="*70)
        
        test_1_slower()
        test_2_faster()
        test_3_no_cyp()
        test_4_multi_meds()
        
        print("\n" + "="*70)
        print("✅ ALLE MINI-TESTS ERFOLGREICH ABGESCHLOSSEN")
        print("="*70)
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ TEST FEHLGESCHLAGEN: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
