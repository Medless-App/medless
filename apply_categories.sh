#!/bin/bash
# Apply medication category safety defaults

DB="medless-production"
MODE="--local"  # Use --remote for production

echo "=== Updating Existing Categories with Safety Rules ==="

npx wrangler d1 execute $DB $MODE --command="UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Ausschleichen grundsätzlich möglich, aber nur sehr langsam (5–10 % pro Woche/mehrere Wochen); Entzugssymptome und Rückfallrisiko beachten.' WHERE name='Benzodiazepine / Z-Drugs';"

npx wrangler d1 execute $DB $MODE --command="UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Nur langsames Ausschleichen empfohlen; Risiko von Absetzsymptomen und Rückfall der Grunderkrankung.' WHERE name='Antidepressiva';"

npx wrangler d1 execute $DB $MODE --command="UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.25, max_weekly_reduction_pct=5, requires_specialist=1, notes='Reduktion nur sehr vorsichtig; Risiko von Krampfanfällen, Therapieanpassung nur durch erfahrene Behandler.' WHERE name='Antiepileptika';"

npx wrangler d1 execute $DB $MODE --command="UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Langsames Tapering erforderlich; Entzugssymptome und Schmerzexazerbation möglich, psychosoziale Faktoren beachten.' WHERE name='Opioide';"

npx wrangler d1 execute $DB $MODE --command="UPDATE medication_categories SET risk_level='high', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=10, requires_specialist=1, notes='Stufenweise Dosisreduktion notwendig; Nebennierenrinden-Suppression beachten, niemals abrupt absetzen.' WHERE name='Systemische Kortikosteroide';"

npx wrangler d1 execute $DB $MODE --command="UPDATE medication_categories SET risk_level='moderate', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=20, requires_specialist=0, notes='Standard-Kategorie für Medikamente ohne bekannte spezielle Tapering-Anforderungen; vorsichtige lineare Reduktion ist grundsätzlich möglich.' WHERE name='Standard';"

npx wrangler d1 execute $DB $MODE --command="UPDATE medication_categories SET risk_level='moderate', can_reduce_to_zero=1, default_min_target_fraction=0.0, max_weekly_reduction_pct=25, requires_specialist=0, notes='In der Regel gut reduzierbar bei nicht-opioiden Schmerzmitteln. Bei Langzeiteinnahme schrittweise Reduktion empfohlen.' WHERE name='Schmerzmittel';"

echo "=== Categories updated successfully ==="
