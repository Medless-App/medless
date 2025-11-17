#!/bin/bash
# Map medications to safety categories by generic_name patterns

DB="medless-production"
MODE="--local"  # Use --remote for production

echo "=== Mapping Medications to Categories ==="

echo "Benzodiazepine / Z-Drugs..."
npx wrangler d1 execute $DB $MODE --command="UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Benzodiazepine / Z-Drugs' LIMIT 1) WHERE LOWER(generic_name) LIKE '%diazepam%' OR LOWER(generic_name) LIKE '%lorazepam%' OR LOWER(generic_name) LIKE '%alprazolam%' OR LOWER(generic_name) LIKE '%clonazepam%' OR LOWER(generic_name) LIKE '%zolpidem%' OR LOWER(generic_name) LIKE '%zopiclon%';"

echo "Antidepressiva..."
npx wrangler d1 execute $DB $MODE --command="UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Antidepressiva' LIMIT 1) WHERE LOWER(generic_name) LIKE '%citalopram%' OR LOWER(generic_name) LIKE '%sertralin%' OR LOWER(generic_name) LIKE '%fluoxetin%' OR LOWER(generic_name) LIKE '%venlafaxin%' OR LOWER(generic_name) LIKE '%duloxetin%' OR LOWER(generic_name) LIKE '%amitriptylin%' OR LOWER(generic_name) LIKE '%mirtazapin%';"

echo "Opioide..."
npx wrangler d1 execute $DB $MODE --command="UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Opioide' LIMIT 1) WHERE LOWER(generic_name) LIKE '%morphin%' OR LOWER(generic_name) LIKE '%oxycodon%' OR LOWER(generic_name) LIKE '%fentanyl%' OR LOWER(generic_name) LIKE '%tramadol%' OR LOWER(generic_name) LIKE '%tilidin%';"

echo "Antiepileptika..."
npx wrangler d1 execute $DB $MODE --command="UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Antiepileptika' LIMIT 1) WHERE LOWER(generic_name) LIKE '%valproat%' OR LOWER(generic_name) LIKE '%carbamazepin%' OR LOWER(generic_name) LIKE '%lamotrigin%' OR LOWER(generic_name) LIKE '%gabapentin%' OR LOWER(generic_name) LIKE '%pregabalin%';"

echo "Systemische Kortikosteroide..."
npx wrangler d1 execute $DB $MODE --command="UPDATE medications SET category_id=(SELECT id FROM medication_categories WHERE name='Systemische Kortikosteroide' LIMIT 1) WHERE LOWER(generic_name) LIKE '%prednisolon%' OR LOWER(generic_name) LIKE '%dexamethason%' OR LOWER(generic_name) LIKE '%cortison%';"

echo "=== Medication mapping complete ==="
