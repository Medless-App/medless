-- =====================================================
-- MEDLESS PATCH 008: Updates für Medications 54-71
-- =====================================================
-- Datum: 26. November 2025
-- Zweck: Ergänzung fehlender Felder für Schlafmittel
--        (Benzodiazepine, Z-Drugs, Antihistaminika)
-- Anzahl: 18 Medikamente (IDs 54-71)
-- =====================================================

-- ID 54: Zaleplon (Sonata) - Z-Drug
UPDATE medications SET
    half_life_hours = 1.0,
    withdrawal_risk_score = 6,
    max_weekly_reduction_pct = 12.5,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'high'
WHERE id = 54;

-- ID 55: Diazepam (Valium) - Langwirkendes Benzodiazepin
UPDATE medications SET
    half_life_hours = 48.0,
    withdrawal_risk_score = 9,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'critical'
WHERE id = 55;

-- ID 56: Lorazepam (Tavor) - Mittelwirkendes Benzodiazepin
UPDATE medications SET
    half_life_hours = 14.0,
    withdrawal_risk_score = 9,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'high'
WHERE id = 56;

-- ID 57: Temazepam (Remestan) - Benzodiazepin
UPDATE medications SET
    half_life_hours = 10.0,
    withdrawal_risk_score = 8,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'high'
WHERE id = 57;

-- ID 58: Nitrazepam (Mogadan) - Langwirkendes Benzodiazepin
UPDATE medications SET
    half_life_hours = 28.0,
    withdrawal_risk_score = 9,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'critical'
WHERE id = 58;

-- ID 59: Flunitrazepam (Rohypnol) - Hochpotentes Benzodiazepin
UPDATE medications SET
    half_life_hours = 18.0,
    withdrawal_risk_score = 10,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'critical'
WHERE id = 59;

-- ID 60: Triazolam (Halcion) - Kurzwirkendes Benzodiazepin
UPDATE medications SET
    half_life_hours = 2.5,
    withdrawal_risk_score = 8,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'critical'
WHERE id = 60;

-- ID 61: Lormetazepam (Noctamid) - Mittelwirkendes Benzodiazepin
UPDATE medications SET
    half_life_hours = 10.0,
    withdrawal_risk_score = 8,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'high'
WHERE id = 61;

-- ID 62: Brotizolam (Lendormin) - Kurzwirkendes Benzodiazepin
UPDATE medications SET
    half_life_hours = 5.0,
    withdrawal_risk_score = 8,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'critical'
WHERE id = 62;

-- ID 63: Daridorexant (Quviviq) - Orexin-Rezeptor-Antagonist
UPDATE medications SET
    half_life_hours = 8.0,
    withdrawal_risk_score = 4,
    max_weekly_reduction_pct = 25,
    can_reduce_to_zero = 1,
    cbd_interaction_strength = 'medium'
WHERE id = 63;

-- ID 64: Lemborexant (Dayvigo) - Orexin-Rezeptor-Antagonist
UPDATE medications SET
    half_life_hours = 50.0,
    withdrawal_risk_score = 4,
    max_weekly_reduction_pct = 25,
    can_reduce_to_zero = 1,
    cbd_interaction_strength = 'medium'
WHERE id = 64;

-- ID 65: Mirtazapin (Remergil) - Tetrazyklisches Antidepressivum/Schlafmittel
UPDATE medications SET
    half_life_hours = 30.0,
    withdrawal_risk_score = 7,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'high'
WHERE id = 65;

-- ID 66: Trazodon (Trittico) - Serotonin-Antagonist/Reuptake-Inhibitor
UPDATE medications SET
    half_life_hours = 7.0,
    withdrawal_risk_score = 7,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'high'
WHERE id = 66;

-- ID 67: Doxepin (Aponal) - Trizyklisches Antidepressivum/Schlafmittel
UPDATE medications SET
    half_life_hours = 17.0,
    withdrawal_risk_score = 8,
    max_weekly_reduction_pct = 10,
    can_reduce_to_zero = 0,
    cbd_interaction_strength = 'high'
WHERE id = 67;

-- ID 68: Diphenhydramin (Vivinox) - Antihistamin-Schlafmittel
UPDATE medications SET
    half_life_hours = 9.0,
    withdrawal_risk_score = 3,
    max_weekly_reduction_pct = 25,
    can_reduce_to_zero = 1,
    cbd_interaction_strength = 'medium'
WHERE id = 68;

-- ID 69: Doxylamin (Hoggar Night) - Antihistamin-Schlafmittel
UPDATE medications SET
    half_life_hours = 10.0,
    withdrawal_risk_score = 3,
    max_weekly_reduction_pct = 25,
    can_reduce_to_zero = 1,
    cbd_interaction_strength = 'medium'
WHERE id = 69;

-- ID 70: Melatonin (Circadin) - Natürliches Schlafhormon
UPDATE medications SET
    half_life_hours = 0.5,
    withdrawal_risk_score = 1,
    max_weekly_reduction_pct = 100,
    can_reduce_to_zero = 1,
    cbd_interaction_strength = 'low'
WHERE id = 70;

-- ID 71: Baldrian hochdosiert - Pflanzliches Beruhigungsmittel
UPDATE medications SET
    half_life_hours = 1.0,
    withdrawal_risk_score = 1,
    max_weekly_reduction_pct = 100,
    can_reduce_to_zero = 1,
    cbd_interaction_strength = 'low'
WHERE id = 71;

-- =====================================================
-- PATCH VOLLSTÄNDIG
-- =====================================================
-- 18 UPDATE-Befehle für IDs 54-71
-- Alle Felder vollständig ausgefüllt
-- Idempotent und sicher für LOCAL und PRODUCTION
-- =====================================================
