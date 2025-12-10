#!/usr/bin/env python3
"""
MEDLESS v1 - Medication Data Quality Analysis
Analyzes all 343 medications for missing/invalid data in critical fields
"""

import json
import sys
from collections import defaultdict

def load_medications(filepath):
    """Load medications from wrangler JSON export"""
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data[0]['results']

def analyze_cyp_enzyme_field(cyp_text):
    """Parse CYP enzyme text field to detect specific enzymes"""
    if not cyp_text:
        return {
            'has_cyp': False,
            'cypenzymes': [],
            'is_non_cyp': False
        }
    
    cyp_lower = cyp_text.lower()
    
    # Check for explicit non-CYP markers
    non_cyp_markers = ['kein cyp', 'no cyp', 'minimal cyp', 'non-cyp', 'renal', 'glukuronidierung', 'glucuronidation']
    is_non_cyp = any(marker in cyp_lower for marker in non_cyp_markers)
    
    # Extract specific CYP enzymes
    cyp_types = ['cyp3a4', 'cyp2d6', 'cyp2c9', 'cyp2c19', 'cyp1a2', 'cyp2c8', 'cyp2b6', 'cyp2e1', 'cyp2j2']
    found_enzymes = [cyp for cyp in cyp_types if cyp in cyp_lower]
    
    return {
        'has_cyp': len(found_enzymes) > 0,
        'cyp_enzymes': found_enzymes,
        'is_non_cyp': is_non_cyp
    }

def analyze_data_quality(medications):
    """Analyze data quality for all medications"""
    
    issues = {
        'missing_half_life': [],
        'invalid_half_life': [],  # 0 or >1000h
        'missing_cyp': [],
        'missing_withdrawal': [],
        'missing_category': [],
        'null_therapeutic_range': [],
        'zero_withdrawal_high_dependency': []  # Opioids/Benzos with score 0
    }
    
    stats = {
        'total': len(medications),
        'has_half_life': 0,
        'has_cyp_data': 0,
        'has_withdrawal_score': 0,
        'has_category': 0,
        'has_therapeutic_range': 0
    }
    
    category_analysis = defaultdict(lambda: {
        'meds': [],
        'cyp_critical': False,
        'withdrawal_critical': False,
        'half_life_critical': False
    })
    
    for med in medications:
        med_id = med['id']
        name = med['name']
        generic = med['generic_name']
        category_id = med['category_id']
        half_life = med['half_life_hours']
        cyp_text = med['cyp450_enzyme']
        withdrawal = med['withdrawal_risk_score']
        cbd_interaction = med['cbd_interaction_strength']
        ther_min = med['therapeutic_min_ng_ml']
        ther_max = med['therapeutic_max_ng_ml']
        
        # Analyze half_life_hours
        if half_life is None:
            issues['missing_half_life'].append({
                'id': med_id,
                'name': name,
                'generic': generic,
                'category': category_id
            })
        elif half_life == 0 or half_life > 1000:
            issues['invalid_half_life'].append({
                'id': med_id,
                'name': name,
                'generic': generic,
                'half_life': half_life,
                'category': category_id
            })
        else:
            stats['has_half_life'] += 1
        
        # Analyze CYP data
        cyp_analysis = analyze_cyp_enzyme_field(cyp_text)
        if not cyp_analysis['has_cyp'] and not cyp_analysis['is_non_cyp']:
            issues['missing_cyp'].append({
                'id': med_id,
                'name': name,
                'generic': generic,
                'cyp_text': cyp_text,
                'category': category_id
            })
        else:
            stats['has_cyp_data'] += 1
        
        # Analyze withdrawal_risk_score
        if withdrawal is None:
            issues['missing_withdrawal'].append({
                'id': med_id,
                'name': name,
                'generic': generic,
                'category': category_id
            })
        else:
            stats['has_withdrawal_score'] += 1
            
            # Check for high-dependency meds with zero score (likely error)
            if withdrawal == 0 and generic:
                high_dep_keywords = ['benzo', 'opioid', 'opiate', 'zepam', 'odon', 'morphin', 'fentanyl']
                if any(keyword in generic.lower() for keyword in high_dep_keywords):
                    issues['zero_withdrawal_high_dependency'].append({
                        'id': med_id,
                        'name': name,
                        'generic': generic,
                        'category': category_id,
                        'withdrawal_score': withdrawal
                    })
        
        # Analyze category_id
        if category_id is None or category_id == 0:
            issues['missing_category'].append({
                'id': med_id,
                'name': name,
                'generic': generic
            })
        else:
            stats['has_category'] += 1
        
        # Analyze therapeutic range
        if ther_min is None and ther_max is None:
            stats['has_therapeutic_range'] += 0  # NULL for all currently
        else:
            stats['has_therapeutic_range'] += 1
        
        # Category-specific analysis
        if category_id is not None:
            category_analysis[category_id]['meds'].append({
                'id': med_id,
                'name': name,
                'generic': generic
            })
    
    # Determine critical fields per category
    critical_categories = {
        # Psychopharmaka
        2: {'name': 'Antidepressiva (trizyklisch)', 'critical': ['withdrawal', 'cyp', 'half_life']},
        3: {'name': 'Antikonvulsiva', 'critical': ['withdrawal', 'half_life']},
        5: {'name': 'Antipsychotika', 'critical': ['withdrawal', 'cyp', 'half_life']},
        15: {'name': 'ADHS-Medikamente', 'critical': ['withdrawal']},
        16: {'name': 'Hypnotika (Schlafmittel)', 'critical': ['withdrawal', 'half_life']},
        17: {'name': 'Anxiolytika (Benzodiazepine)', 'critical': ['withdrawal', 'half_life']},
        18: {'name': 'Opioide', 'critical': ['withdrawal', 'cyp', 'half_life']},
        25: {'name': 'Antidepressiva (SSRI/SNRI)', 'critical': ['withdrawal', 'cyp', 'half_life']},
        
        # Cardiovascular
        6: {'name': 'Statine', 'critical': ['cyp']},
        19: {'name': 'Antihypertensiva', 'critical': ['half_life']},
        24: {'name': 'Antikoagulantien', 'critical': ['cyp', 'half_life']},
        
        # Immunsuppressiva
        8: {'name': 'Immunsuppressiva', 'critical': ['cyp', 'half_life', 'withdrawal']},
        
        # Sonstige
        21: {'name': 'Corticosteroide', 'critical': ['withdrawal', 'half_life']},
        26: {'name': 'Hormonpräparate', 'critical': ['cyp', 'half_life']}
    }
    
    return issues, stats, category_analysis, critical_categories

def generate_report(medications):
    """Generate comprehensive data quality report"""
    issues, stats, category_analysis, critical_categories = analyze_data_quality(medications)
    
    print("=" * 80)
    print("MEDLESS V1 - MEDICATION DATA QUALITY AUDIT")
    print("=" * 80)
    print()
    
    print("📊 OVERALL STATISTICS")
    print("-" * 80)
    print(f"Total Medications:                {stats['total']}")
    print(f"With half_life_hours:             {stats['has_half_life']} ({stats['has_half_life']/stats['total']*100:.1f}%)")
    print(f"With CYP data:                    {stats['has_cyp_data']} ({stats['has_cyp_data']/stats['total']*100:.1f}%)")
    print(f"With withdrawal_risk_score:       {stats['has_withdrawal_score']} ({stats['has_withdrawal_score']/stats['total']*100:.1f}%)")
    print(f"With category_id:                 {stats['has_category']} ({stats['has_category']/stats['total']*100:.1f}%)")
    print(f"With therapeutic_range:           {stats['has_therapeutic_range']} ({stats['has_therapeutic_range']/stats['total']*100:.1f}%)")
    print()
    
    print("🚨 DATA QUALITY ISSUES")
    print("-" * 80)
    print()
    
    # Missing half_life_hours
    print(f"1. MISSING half_life_hours: {len(issues['missing_half_life'])} medications")
    if issues['missing_half_life']:
        print("   Sample (first 10):")
        for med in issues['missing_half_life'][:10]:
            print(f"   - ID {med['id']:3d}: {med['name']:30s} ({med['generic']:30s}) [Cat {med['category']}]")
        if len(issues['missing_half_life']) > 10:
            print(f"   ... and {len(issues['missing_half_life']) - 10} more")
    print()
    
    # Invalid half_life_hours
    print(f"2. INVALID half_life_hours: {len(issues['invalid_half_life'])} medications (0 or >1000h)")
    if issues['invalid_half_life']:
        for med in issues['invalid_half_life']:
            print(f"   - ID {med['id']:3d}: {med['name']:30s} half_life={med['half_life']}h")
    print()
    
    # Missing CYP data
    print(f"3. MISSING/UNCLEAR CYP data: {len(issues['missing_cyp'])} medications")
    if issues['missing_cyp']:
        print("   Sample (first 10):")
        for med in issues['missing_cyp'][:10]:
            print(f"   - ID {med['id']:3d}: {med['name']:30s} cyp='{med['cyp_text']}'")
        if len(issues['missing_cyp']) > 10:
            print(f"   ... and {len(issues['missing_cyp']) - 10} more")
    print()
    
    # Missing withdrawal_risk_score
    print(f"4. MISSING withdrawal_risk_score: {len(issues['missing_withdrawal'])} medications")
    if issues['missing_withdrawal']:
        print("   Sample (first 10):")
        for med in issues['missing_withdrawal'][:10]:
            print(f"   - ID {med['id']:3d}: {med['name']:30s} ({med['generic']:30s})")
        if len(issues['missing_withdrawal']) > 10:
            print(f"   ... and {len(issues['missing_withdrawal']) - 10} more")
    print()
    
    # Missing category_id
    print(f"5. MISSING category_id: {len(issues['missing_category'])} medications")
    if issues['missing_category']:
        for med in issues['missing_category']:
            print(f"   - ID {med['id']:3d}: {med['name']:30s} ({med['generic']:30s})")
    print()
    
    # Zero withdrawal for high-dependency meds
    print(f"6. SUSPICIOUS: High-dependency meds with withdrawal_score=0: {len(issues['zero_withdrawal_high_dependency'])}")
    if issues['zero_withdrawal_high_dependency']:
        for med in issues['zero_withdrawal_high_dependency']:
            print(f"   - ID {med['id']:3d}: {med['name']:30s} ({med['generic']:30s}) score={med['withdrawal_score']}")
    print()
    
    print("=" * 80)
    print("📋 CATEGORY-SPECIFIC CRITICAL FIELDS ANALYSIS")
    print("=" * 80)
    print()
    
    for cat_id, cat_info in critical_categories.items():
        if cat_id in category_analysis and category_analysis[cat_id]['meds']:
            print(f"Category {cat_id}: {cat_info['name']}")
            print(f"  Total medications: {len(category_analysis[cat_id]['meds'])}")
            print(f"  Critical fields: {', '.join(cat_info['critical'])}")
            print()
    
    print("=" * 80)
    print("💡 RECOMMENDATIONS")
    print("=" * 80)
    print()
    print("PRIORITY 1 (CRITICAL - Affects calculation):")
    print("  - Fix missing half_life_hours (used in Phase 3 reduction calculation)")
    print("  - Complete withdrawal_risk_score (used in Phase 6 reduction calculation)")
    print("  - Review CYP enzyme data (used in Phase 4 CYP adjustment)")
    print()
    print("PRIORITY 2 (HIGH - Improves safety):")
    print("  - Review zero withdrawal scores for high-dependency meds")
    print("  - Verify invalid half-life values (0h or >1000h)")
    print()
    print("PRIORITY 3 (MEDIUM - Future features):")
    print("  - Add therapeutic_min/max ranges for narrow-window drugs")
    print("  - Complete category_id for any uncategorized medications")
    print()
    print("=" * 80)
    print("✅ EXPORT LISTS FOR MANUAL REVIEW")
    print("=" * 80)
    print()
    
    # Export medication IDs needing attention
    print("Medications needing half_life_hours:")
    print(",".join(str(med['id']) for med in issues['missing_half_life']))
    print()
    
    print("Medications needing withdrawal_risk_score:")
    print(",".join(str(med['id']) for med in issues['missing_withdrawal']))
    print()
    
    print("Medications needing CYP clarification:")
    print(",".join(str(med['id']) for med in issues['missing_cyp']))
    print()

if __name__ == '__main__':
    medications = load_medications('/home/user/webapp/medications_export.json')
    generate_report(medications)
