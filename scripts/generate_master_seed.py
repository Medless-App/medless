#!/usr/bin/env python3
"""
MEDLESS Master Seed Generator
Generates 008_master_medless_full_seed_343.sql from REMOTE database
"""

import json
import subprocess
import sys
from typing import Any, Dict, List

def run_wrangler_query(query: str) -> List[Dict[str, Any]]:
    """Execute wrangler d1 query and return JSON results"""
    cmd = [
        'npx', 'wrangler', 'd1', 'execute', 'medless-production',
        '--remote', '--command', query, '--json'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, cwd='/home/user/webapp')
    
    if result.returncode != 0:
        print(f"Error executing query: {result.stderr}", file=sys.stderr)
        return []
    
    try:
        data = json.loads(result.stdout)
        return data[0]['results'] if data and len(data) > 0 else []
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        return []

def escape_sql_string(value: Any) -> str:
    """Escape SQL string values"""
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        # Escape single quotes
        escaped = value.replace("'", "''")
        return f"'{escaped}'"
    return str(value)

def generate_medication_categories(output_file):
    """Generate medication_categories INSERT statements"""
    print("Fetching medication_categories from REMOTE...")
    
    query = """
    SELECT id, name, description, risk_level, can_reduce_to_zero, 
           default_min_target_fraction, max_weekly_reduction_pct, 
           requires_specialist, notes
    FROM medication_categories 
    ORDER BY id
    """
    
    categories = run_wrangler_query(query)
    
    output_file.write("\n-- ========================================================\n")
    output_file.write(f"-- TABLE: medication_categories ({len(categories)} entries)\n")
    output_file.write("-- ========================================================\n\n")
    
    for cat in categories:
        values = [
            str(cat['id']),
            escape_sql_string(cat['name']),
            escape_sql_string(cat.get('description')),
            escape_sql_string(cat.get('risk_level')),
            escape_sql_string(cat.get('can_reduce_to_zero')),
            escape_sql_string(cat.get('default_min_target_fraction')),
            escape_sql_string(cat.get('max_weekly_reduction_pct')),
            escape_sql_string(cat.get('requires_specialist')),
            escape_sql_string(cat.get('notes'))
        ]
        
        output_file.write(
            f"INSERT OR REPLACE INTO medication_categories "
            f"(id, name, description, risk_level, can_reduce_to_zero, "
            f"default_min_target_fraction, max_weekly_reduction_pct, "
            f"requires_specialist, notes)\n"
            f"VALUES ({', '.join(values)});\n\n"
        )
    
    return len(categories)

def generate_medications(output_file):
    """Generate medications INSERT statements"""
    print("Fetching medications from REMOTE...")
    
    query = """
    SELECT id, name, generic_name, category_id, cyp450_enzyme, description, 
           common_dosage, half_life_hours, therapeutic_min_ng_ml, 
           therapeutic_max_ng_ml, withdrawal_risk_score, max_weekly_reduction_pct, 
           can_reduce_to_zero, cbd_interaction_strength
    FROM medications 
    ORDER BY id
    """
    
    medications = run_wrangler_query(query)
    
    output_file.write("\n-- ========================================================\n")
    output_file.write(f"-- TABLE: medications ({len(medications)} entries)\n")
    output_file.write("-- ========================================================\n\n")
    
    for med in medications:
        values = [
            str(med['id']),
            escape_sql_string(med['name']),
            escape_sql_string(med.get('generic_name')),
            escape_sql_string(med.get('category_id')),
            escape_sql_string(med.get('cyp450_enzyme')),
            escape_sql_string(med.get('description')),
            escape_sql_string(med.get('common_dosage')),
            escape_sql_string(med.get('half_life_hours')),
            escape_sql_string(med.get('therapeutic_min_ng_ml')),
            escape_sql_string(med.get('therapeutic_max_ng_ml')),
            escape_sql_string(med.get('withdrawal_risk_score')),
            escape_sql_string(med.get('max_weekly_reduction_pct')),
            escape_sql_string(med.get('can_reduce_to_zero')),
            escape_sql_string(med.get('cbd_interaction_strength'))
        ]
        
        output_file.write(
            f"INSERT OR REPLACE INTO medications "
            f"(id, name, generic_name, category_id, cyp450_enzyme, description, "
            f"common_dosage, half_life_hours, therapeutic_min_ng_ml, therapeutic_max_ng_ml, "
            f"withdrawal_risk_score, max_weekly_reduction_pct, can_reduce_to_zero, "
            f"cbd_interaction_strength)\n"
            f"VALUES ({', '.join(values)});\n\n"
        )
    
    return len(medications)

def generate_cbd_interactions(output_file):
    """Generate cbd_interactions INSERT statements"""
    print("Fetching cbd_interactions from REMOTE...")
    
    query = """
    SELECT medication_id, interaction_type, severity, description, 
           mechanism, recommendation, source_url
    FROM cbd_interactions 
    ORDER BY medication_id
    """
    
    interactions = run_wrangler_query(query)
    
    output_file.write("\n-- ========================================================\n")
    output_file.write(f"-- TABLE: cbd_interactions ({len(interactions)} entries)\n")
    output_file.write("-- ========================================================\n\n")
    
    for interaction in interactions:
        values = [
            escape_sql_string(interaction['medication_id']),
            escape_sql_string(interaction.get('interaction_type')),
            escape_sql_string(interaction.get('severity')),
            escape_sql_string(interaction.get('description')),
            escape_sql_string(interaction.get('mechanism')),
            escape_sql_string(interaction.get('recommendation')),
            escape_sql_string(interaction.get('source_url'))
        ]
        
        output_file.write(
            f"INSERT OR IGNORE INTO cbd_interactions "
            f"(medication_id, interaction_type, severity, description, "
            f"mechanism, recommendation, source_url)\n"
            f"VALUES ({', '.join(values)});\n\n"
        )
    
    return len(interactions)

def generate_cyp_profiles(output_file):
    """Generate medication_cyp_profile INSERT statements"""
    print("Fetching medication_cyp_profile from REMOTE...")
    
    query = """
    SELECT medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note
    FROM medication_cyp_profile 
    ORDER BY medication_id, cyp_enzyme
    """
    
    profiles = run_wrangler_query(query)
    
    output_file.write("\n-- ========================================================\n")
    output_file.write(f"-- TABLE: medication_cyp_profile ({len(profiles)} entries)\n")
    output_file.write("-- ========================================================\n\n")
    
    for profile in profiles:
        values = [
            escape_sql_string(profile['medication_id']),
            escape_sql_string(profile['cyp_enzyme']),
            escape_sql_string(profile['role']),
            escape_sql_string(profile.get('cbd_effect_on_reduction')),
            escape_sql_string(profile.get('note'))
        ]
        
        output_file.write(
            f"INSERT OR IGNORE INTO medication_cyp_profile "
            f"(medication_id, cyp_enzyme, role, cbd_effect_on_reduction, note)\n"
            f"VALUES ({', '.join(values)});\n\n"
        )
    
    return len(profiles)

def main():
    """Main function"""
    output_path = '/home/user/webapp/migrations/008_master_medless_full_seed_343_GENERATED.sql'
    
    print("=" * 60)
    print("MEDLESS Master Seed Generator")
    print("=" * 60)
    print()
    
    with open(output_path, 'w', encoding='utf-8') as f:
        # Write header
        f.write("""-- ========================================================
-- MEDLESS MASTER SEED FILE (GENERATED)
-- ========================================================
-- Project: MEDLESS - Medication Reduction Planning System
-- Purpose: Master data seed for production state
-- Generated: Automatically from REMOTE/Production database
-- Target: medless-production (Cloudflare D1)
-- ========================================================
-- 
-- IDEMPOTENT: This file can be executed multiple times safely
-- - Uses INSERT OR REPLACE for medications and categories
-- - Uses INSERT OR IGNORE for interactions and CYP profiles
-- 
-- PREREQUISITES:
-- - Schema migrations 0001-0007 must be applied first
-- - CYP profile table migration (010) must be applied first
-- 
-- ========================================================

""")
        
        # Generate all tables
        cat_count = generate_medication_categories(f)
        med_count = generate_medications(f)
        int_count = generate_cbd_interactions(f)
        cyp_count = generate_cyp_profiles(f)
        
        # Write footer
        f.write("\n-- ========================================================\n")
        f.write("-- END OF MASTER SEED FILE\n")
        f.write("-- ========================================================\n")
        f.write(f"-- SUMMARY:\n")
        f.write(f"-- - {cat_count} medication_categories\n")
        f.write(f"-- - {med_count} medications\n")
        f.write(f"-- - {int_count} cbd_interactions\n")
        f.write(f"-- - {cyp_count} medication_cyp_profile entries\n")
        f.write("-- ========================================================\n")
    
    print()
    print("=" * 60)
    print("Generation complete!")
    print(f"Output: {output_path}")
    print(f"- {cat_count} medication_categories")
    print(f"- {med_count} medications")
    print(f"- {int_count} cbd_interactions")
    print(f"- {cyp_count} medication_cyp_profile entries")
    print("=" * 60)

if __name__ == '__main__':
    main()
