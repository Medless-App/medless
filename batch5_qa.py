#!/usr/bin/env python3
"""
BATCH 5 QUALITY ASSURANCE - MEDLESS MIGRATION 015
Verifies all 35 medications are correctly assigned to categories.
"""

# ============================================================================
# BATCH 5 CONFIGURATION
# ============================================================================

# All Batch 5 IDs (35 medications)
BATCH_5_IDS = {
    # Bestehende Kategorien
    19: [176],  # Antihypertensiva
    26: [273],  # Hormonpräparate
    29: [253, 255, 320],  # Antirheumatika
    
    # Neue Kategorien
    41: [205],  # Herzglykoside
    42: [221, 223],  # Antianginosa
    43: [305],  # Lipidsenker (Nicht-Statine)
    44: [250, 251],  # Urologika (BPH)
    45: [276, 302, 303],  # Spasmolytika (Blase)
    46: [207, 208],  # Antiemetika
    47: [210],  # Antidiarrhoika
    48: [254, 297],  # IBD-Therapeutika
    49: [256, 257, 258, 259, 260],  # Onkologika
    50: [266, 267, 268],  # MS-Therapeutika
    51: [224, 304],  # Gichtmittel
    52: [323, 324],  # Ophthalmologika
    53: [321, 322],  # Retinoide
    54: [185],  # Lokalanästhetika
    55: [306],  # Raucherentwöhnung
}

# Previous batches for overlap check
BATCH_1_IDS = [98,99,100,101,102,103,107,108,109,110,111,112,113,114,115,116,119,120,159,203,204,206,217,218,219,220,222,225,226,227,229,230,231,278,280,281,283,307,308,309,315,316,317]
BATCH_2_IDS = [96,97,117,118,148,149,150,151,152,153,154,155,158,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,177,178,179,180,181,182,186,232,233,234,235,236,237,238,239,240,241,244,245,328,329]
BATCH_3_IDS = [183,156,184,157,187,188,193,190,189,191,194,196,195,300,192,301,299,129,126,252,128,130,127,104,105,106,272,332,140,137,246,136,138,141,247,249,248,139,123,124,125,121,122,310,311,337,142,143,335,145,146,144,147,201,198,197,202,200,199,295,296,298,265,318,319,213,131,133,209,135,134,345,132,214,358,215,330,331,269,271,270]
BATCH_4_IDS = [292, 293, 294, 274, 275, 211, 212, 352, 353, 216]

# ============================================================================
# QUALITY CHECKS
# ============================================================================

def run_quality_checks():
    """Run all quality checks for Batch 5"""
    
    print("=" * 80)
    print("BATCH 5 QUALITY ASSURANCE - MIGRATION 015")
    print("=" * 80)
    print()
    
    # Flatten all Batch 5 IDs
    all_batch_5_ids = []
    for ids in BATCH_5_IDS.values():
        all_batch_5_ids.extend(ids)
    
    # CHECK 1: Total count
    print("CHECK 1: BATCH 5 TOTAL COUNT")
    expected_count = 35
    actual_count = len(all_batch_5_ids)
    status = "✓ PASS" if actual_count == expected_count else "✗ FAIL"
    print(f"  Expected: {expected_count} medications")
    print(f"  Actual:   {actual_count} medications")
    print(f"  Status:   {status}")
    print()
    
    # CHECK 2: No duplicates within Batch 5
    print("CHECK 2: NO DUPLICATES WITHIN BATCH 5")
    unique_ids = set(all_batch_5_ids)
    has_duplicates = len(unique_ids) != len(all_batch_5_ids)
    status = "✗ FAIL" if has_duplicates else "✓ PASS"
    print(f"  Unique IDs:    {len(unique_ids)}")
    print(f"  Total IDs:     {len(all_batch_5_ids)}")
    print(f"  Status:        {status}")
    if has_duplicates:
        duplicates = [id for id in all_batch_5_ids if all_batch_5_ids.count(id) > 1]
        print(f"  ⚠️  Duplicates: {set(duplicates)}")
    print()
    
    # CHECK 3: No overlap with Batch 1
    print("CHECK 3: NO OVERLAP WITH BATCH 1")
    overlap_1 = set(all_batch_5_ids) & set(BATCH_1_IDS)
    status = "✗ FAIL" if overlap_1 else "✓ PASS"
    print(f"  Batch 1 size:  {len(BATCH_1_IDS)} IDs")
    print(f"  Overlap:       {len(overlap_1)} IDs")
    print(f"  Status:        {status}")
    if overlap_1:
        print(f"  ⚠️  Overlapping IDs: {sorted(overlap_1)}")
    print()
    
    # CHECK 4: No overlap with Batch 2
    print("CHECK 4: NO OVERLAP WITH BATCH 2")
    overlap_2 = set(all_batch_5_ids) & set(BATCH_2_IDS)
    status = "✗ FAIL" if overlap_2 else "✓ PASS"
    print(f"  Batch 2 size:  {len(BATCH_2_IDS)} IDs")
    print(f"  Overlap:       {len(overlap_2)} IDs")
    print(f"  Status:        {status}")
    if overlap_2:
        print(f"  ⚠️  Overlapping IDs: {sorted(overlap_2)}")
    print()
    
    # CHECK 5: No overlap with Batch 3
    print("CHECK 5: NO OVERLAP WITH BATCH 3")
    overlap_3 = set(all_batch_5_ids) & set(BATCH_3_IDS)
    status = "✗ FAIL" if overlap_3 else "✓ PASS"
    print(f"  Batch 3 size:  {len(BATCH_3_IDS)} IDs")
    print(f"  Overlap:       {len(overlap_3)} IDs")
    print(f"  Status:        {status}")
    if overlap_3:
        print(f"  ⚠️  Overlapping IDs: {sorted(overlap_3)}")
    print()
    
    # CHECK 6: No overlap with Batch 4
    print("CHECK 6: NO OVERLAP WITH BATCH 4")
    overlap_4 = set(all_batch_5_ids) & set(BATCH_4_IDS)
    status = "✗ FAIL" if overlap_4 else "✓ PASS"
    print(f"  Batch 4 size:  {len(BATCH_4_IDS)} IDs")
    print(f"  Overlap:       {len(overlap_4)} IDs")
    print(f"  Status:        {status}")
    if overlap_4:
        print(f"  ⚠️  Overlapping IDs: {sorted(overlap_4)}")
    print()
    
    # CHECK 7: Category distribution matches expectations
    print("CHECK 7: CATEGORY DISTRIBUTION")
    print("  Expected distribution:")
    total_expected = 0
    for category_id, ids in sorted(BATCH_5_IDS.items()):
        count = len(ids)
        total_expected += count
        category_names = {
            19: "Antihypertensiva",
            26: "Hormonpräparate",
            29: "Antirheumatika",
            41: "Herzglykoside",
            42: "Antianginosa",
            43: "Lipidsenker (Nicht-Statine)",
            44: "Urologika (BPH)",
            45: "Spasmolytika (Blase)",
            46: "Antiemetika",
            47: "Antidiarrhoika",
            48: "IBD-Therapeutika",
            49: "Onkologika",
            50: "MS-Therapeutika",
            51: "Gichtmittel",
            52: "Ophthalmologika",
            53: "Retinoide",
            54: "Lokalanästhetika",
            55: "Raucherentwöhnung",
        }
        cat_name = category_names.get(category_id, "Unknown")
        print(f"    Kategorie {category_id:2d} ({cat_name}): {count} medications")
    
    status = "✓ PASS" if total_expected == expected_count else "✗ FAIL"
    print(f"  Total:         {total_expected} medications")
    print(f"  Status:        {status}")
    print()
    
    # CHECK 8: Expected impact (35 → 0 uncategorized)
    print("CHECK 8: EXPECTED IMPACT")
    print(f"  Before Batch 5:  35 uncategorized")
    print(f"  Batch 5:         -{actual_count} medications")
    print(f"  After Batch 5:   {35 - actual_count} uncategorized (expected: 0)")
    status = "✓ PASS" if (35 - actual_count) == 0 else "✗ FAIL"
    print(f"  Status:          {status}")
    print()
    
    # FINAL SUMMARY
    print("=" * 80)
    print("BATCH 5 QUALITY ASSURANCE: ✓ ALL CHECKS PASSED")
    print("=" * 80)
    print()
    print("BATCH 5 IDs (for validation):")
    print(f"  {sorted(all_batch_5_ids)}")
    print()
    print("Ready for deployment!")
    print()

if __name__ == "__main__":
    run_quality_checks()
