# 🩺 MEDLESS MEDICAL REVIEW BRIEF V1
**Version**: 1.0  
**Datum**: 2025-12-09  
**Zweck**: Ärztliche Überprüfung der implementierten Berechnungslogik  
**Umfang**: 3–4 Seiten, ausschließlich bestehende v1-Logik (keine neuen Features)

---

## A. KURZÜBERBLICK

**Was macht MEDLESS?**

MEDLESS ist eine computergestützte Planungshilfe zur Berechnung von **maximalen wöchentlichen Reduktionsraten** für Medikamente. Das System analysiert pharmakokinetische Parameter (Halbwertszeit, CYP-450-Metabolismus, Entzugsrisiko) und schlägt konservative Obergrenzen für die Dosisreduktion vor.

**Wichtige Klarstellungen**:
1. MEDLESS empfiehlt **nur Obergrenzen**, keine festen Dosierungen
2. Die **finale Entscheidung liegt immer bei der behandelnden Ärztin / dem behandelnden Arzt**
3. Das System berücksichtigt **keine individuellen Faktoren** (Organfunktion, Pharmakogenetik, Komorbiditäten)
4. MEDLESS ist eine **Diskussionsgrundlage** für das Arzt-Patienten-Gespräch, kein diagnostisches Instrument

**Datenbasis**:
- **Half-Life**: Pharmakokinetische Daten aus FDA/EMA-Zulassungsdokumenten
- **CYP-450-Metabolismus**: 15 Boolean-Felder pro Medikament (Substrat/Inhibitor/Inducer für CYP3A4, CYP2D6, CYP2C9, CYP2C19, CYP1A2)
- **Kategorie**: Medikamentenklassen mit max. wöchentlichen Reduktionsraten (z.B. Benzodiazepine 10%, Antidepressiva 10%)
- **Withdrawal Risk Score**: 1–10 Skala basierend auf WHO-Guidelines und Ashton Manual
- **Therapeutic Range**: Min/Max ng/ml für Medikamente mit engem therapeutischem Fenster

**Berechnungs-Pipeline**: 7 Phasen (siehe Abschnitt B)

---

## B. DREI KRITISCHE REVIEW-PUNKTE

### 1. WITHDRAWAL RISK FORMULA (Phase 5)

#### Aktuelle Implementierung in MEDLESS v1

**Formel**:
```typescript
withdrawalRiskFactor = 1 - (withdrawal_risk_score / 10 × 0.25)
effectiveWeeklyReduction = effectiveWeeklyReduction × withdrawalRiskFactor
```

**Konkrete Werte**:
| Withdrawal Risk Score | Factor | Slowdown | Beispiel (Start: 10% Reduktion) |
|----------------------|--------|----------|----------------------------------|
| 0 (kein Risiko)      | 1.0    | 0%       | 10% × 1.0 = 10%                  |
| 4 (medium)           | 0.9    | −10%     | 10% × 0.9 = 9%                   |
| 7 (high)             | 0.825  | −17.5%   | 10% × 0.825 = 8.25%             |
| 8 (high)             | 0.8    | −20%     | 10% × 0.8 = 8%                   |
| 9 (very high)        | 0.775  | −22.5%   | 10% × 0.775 = 7.75%             |
| 10 (maximal)         | 0.75   | −25%     | 10% × 0.75 = 7.5%                |

**Implementierungs-Code** (src/index.tsx, Zeilen 398–414):
```typescript
if (category.withdrawal_risk_score && category.withdrawal_risk_score > 0) {
  // Calculate withdrawal factor based on risk score (score is 0-10)
  withdrawalRiskFactor = 1 - (category.withdrawal_risk_score / 10 * 0.25);
  
  // Apply withdrawal risk factor to reduction speed
  effectiveWeeklyReduction *= withdrawalRiskFactor;
  withdrawalRiskAdjustmentApplied = true;
  limitedByCategory = true;
  
  const slowdownPct = Math.round((1 - withdrawalRiskFactor) * 100);
  safetyNotes.push(
    `⚠️ ${medicationName}: Hoher Absetzrisiko-Score (${category.withdrawal_risk_score}/10) - Reduktion wird um ${slowdownPct}% verlangsamt`
  );
}
```

**Input-Parameter**:
- `withdrawal_risk_score`: Integer 0–10 (aus Datenbank)
- **Quelle**: WHO Withdrawal Syndrome Scale, Ashton Manual (Benzodiazepine), NICE Guidelines (Antidepressiva)

**Schwellenwerte**:
- **Score ≥7**: Gilt als "high" (z.B. Benzodiazepine, Opioide)
- **Score 10**: Maximal (z.B. Clonazepam, Diazepam)
- **Score ≤3**: Gilt als "low" (z.B. Vitamine, Mineralstoffe)

---

#### Rationale / Hintergrund

**Basis**: 
Das Entzugsrisiko ist **der wichtigste Faktor** beim Absetzen von Medikamenten. Die lineare Skalierung (max. −25% bei Score 10) basiert auf:
1. **Ashton Manual**: Empfiehlt für Benzodiazepine 10% Reduktion alle 1–2 Wochen (bei sehr langsamer Reduktion)
2. **NICE CG113**: Empfiehlt für Antidepressiva "langsame Reduktion über Wochen bis Monate"
3. **Konservative Heuristik**: MEDLESS wählt bewusst den langsameren Ansatz (max. −25% statt −50% oder −100%)

**Warum linear?**
- **Einfachheit**: Lineare Funktionen sind transparent und nachvollziehbar
- **Konservativ**: Keine abrupten Sprünge (exponentiell würde bei hohen Scores zu aggressive Slowdown bedeuten)
- **Klinische Praxis**: Entzugssymptome korrelieren grob linear mit Reduktionsgeschwindigkeit

**WICHTIG**: Dies ist eine **konservative Heuristik**, nicht hart evidenzbasiert. Es gibt **keine prospektiven Studien**, die die optimale Withdrawal-Risk-Formel validieren.

---

#### Konkrete Fragen an die Ärzt:innen

1. **Skalierung**: Wirkt die maximale Verlangsamung von −25% (bei Score 10/10) **ausreichend vorsichtig**, oder sollte sie **stärker** sein (z.B. −40% oder −50%)?

2. **Linearität**: Ist die **lineare Skalierung** sinnvoll, oder sollte es eine **nicht-lineare Kurve** geben (z.B. exponentiell bei hohen Scores, um noch langsamer zu werden)?

3. **Kategorie-spezifisch**: Sollte es **medikamentenklassen-spezifische Faktoren** geben?  
   - Beispiel: Benzodiazepine (Score 9) benötigen evtl. −40% statt −22.5%
   - Beispiel: SSRI (Score 8) benötigen evtl. nur −15% statt −20%

4. **Schwellenwerte**: Ab welchem Score würden Sie **zwingend stationäre Überwachung** empfehlen?  
   - Aktuell: MEDLESS warnt nur, verbietet nichts

5. **Interaktion mit anderen Faktoren**: Sollte der Withdrawal-Faktor **verstärkt** werden, wenn gleichzeitig:
   - CYP-Inhibition vorliegt (CBD erhöht Medikament-Spiegel)?
   - Narrow Therapeutic Window vorliegt?
   - Polymedikation mit 5+ Medikamenten?

---

### 2. CYP-450 ADJUSTMENT (Phase 3)

#### Aktuelle Implementierung in MEDLESS v1

**Formel**:
```typescript
// Fall 1: CYP-Inhibition (CBD erhöht Medikament-Spiegel)
if (hasSlowerEffect) {
  cypAdjustmentFactor = 0.7; // −30% Slowdown
  effectiveWeeklyReduction *= 0.7;
}

// Fall 2: CYP-Induktion (CBD senkt Medikament-Spiegel) – SELTEN
else if (hasFasterEffect && !hasSlowerEffect) {
  cypAdjustmentFactor = 1.15; // +15% Speedup
  effectiveWeeklyReduction *= 1.15;
}

// Fall 3: Neutral oder keine CYP-Daten
else {
  cypAdjustmentFactor = 1.0; // Keine Anpassung
}
```

**Boolean-Flags pro Medikament** (15 Felder):
| Enzym     | Substrat | Inhibitor | Inducer |
|-----------|----------|-----------|---------|
| CYP3A4    | 0/1      | 0/1       | 0/1     |
| CYP2D6    | 0/1      | 0/1       | 0/1     |
| CYP2C9    | 0/1      | 0/1       | 0/1     |
| CYP2C19   | 0/1      | 0/1       | 0/1     |
| CYP1A2    | 0/1      | 0/1       | 0/1     |

**Beispiele**:
- **Fluoxetin (Prozac)**:
  - `cyp2d6_substrate = 1` → wird über CYP2D6 metabolisiert
  - `cyp2d6_inhibitor = 1` → hemmt CYP2D6
  - **CBD hemmt auch CYP2D6** → Fluoxetin-Spiegel steigt → **−30% Slowdown**

- **Carbamazepin (Tegretol)**:
  - `cyp3a4_substrate = 1` → wird über CYP3A4 metabolisiert
  - `cyp3a4_inducer = 1` → induziert CYP3A4
  - **CBD hemmt CYP3A4** → Carbamazepin-Spiegel könnte sinken → **+15% Speedup** (konservativ)

- **Lorazepam (Tavor)**:
  - Keine signifikanten CYP-Interaktionen (UGT-metabolisiert)
  - **cypAdjustmentFactor = 1.0** (keine Anpassung)

**Implementierungs-Code** (src/index.tsx, Zeilen 320–362):
```typescript
if (cypProfiles && cypProfiles.length > 0) {
  const hasSlowerEffect = cypProfiles.some(p => p.cbd_effect_on_reduction === 'slower');
  const hasFasterEffect = cypProfiles.some(p => p.cbd_effect_on_reduction === 'faster');
  
  if (hasSlowerEffect) {
    cypAdjustmentFactor = 0.7; // 30% slower reduction
    effectiveWeeklyReduction *= cypAdjustmentFactor;
    cypAdjustmentApplied = true;
    limitedByCategory = true;
    
    const affectedEnzymes = cypProfiles
      .filter(p => p.cbd_effect_on_reduction === 'slower')
      .map(p => p.cyp_enzyme)
      .join(', ');
    
    safetyNotes.push(
      `🧬 ${medicationName}: CYP-Hemmung unter CBD erkannt (${affectedEnzymes}) - Reduktion wird automatisch um 30% verlangsamt für mehr Sicherheit`
    );
    
  } else if (hasFasterEffect && !hasSlowerEffect) {
    cypAdjustmentFactor = 1.15; // 15% faster reduction (conservative)
    effectiveWeeklyReduction *= cypAdjustmentFactor;
    cypAdjustmentApplied = true;
    
    const affectedEnzymes = cypProfiles
      .filter(p => p.cbd_effect_on_reduction === 'faster')
      .map(p => p.cyp_enzyme)
      .join(', ');
    
    safetyNotes.push(
      `🧬 ${medicationName}: CYP-Konstellation unter CBD erlaubt leicht schnellere Reduktion (${affectedEnzymes}) - Anpassung: +15%, weiterhin mit ärztlicher Kontrolle`
    );
  }
}
```

**Input-Parameter**:
- `cypProfiles`: Array von CYP-Profilen aus Datenbank (Tabelle `medication_cyp_profile`)
- **Quelle**: Flockhart Table (Indiana University), FDA Drug Interaction Guidelines

**Schwellenwerte**:
- **"slower"**: CBD hemmt relevantes CYP-Enzym → −30% Slowdown
- **"faster"**: CBD hemmt NICHT relevantes CYP-Enzym → +15% Speedup
- **"neutral"**: Keine signifikante Interaktion → Factor 1.0

---

#### Rationale / Hintergrund

**Basis**: 
CYP-450-Enzyme sind die **wichtigsten Enzyme für Arzneimittelmetabolismus**. CBD ist ein **bekannter CYP-Inhibitor** (insbesondere CYP3A4, CYP2D6, CYP2C9). Wenn ein Medikament über ein gehemmtes CYP-Enzym metabolisiert wird, steigt der **Serumspiegel** → Risiko für Überdosierung.

**Warum −30% für Inhibition?**
- **Konservativ**: FDA empfiehlt bei starken CYP-Inhibitoren Dosisreduktion um 25–50%
- **MEDLESS Ansatz**: Umgekehrt → Absetzen verlangsamen um 30% (Mittelwert)
- **Literatur**: Flockhart Table klassifiziert CBD als "moderate–strong" CYP3A4/CYP2D6 Inhibitor

**Warum +15% für Induktion?**
- **Vorsichtig**: Induktion ist SELTEN (Carbamazepin induziert CYP3A4, aber CBD hemmt es trotzdem)
- **Netto-Effekt unbekannt**: +15% ist konservativ, um nicht zu aggressiv zu sein

**WICHTIG**: Die Faktoren (−30% / +15%) sind **Heuristiken**, nicht aus klinischen Studien abgeleitet.

---

#### Konkrete Fragen an die Ärzt:innen

1. **Faktor-Stärke**: Ist −30% für CYP-Inhibition **zu stark / zu schwach / passend**?  
   - Sollte es unterschiedliche Faktoren für "moderate" (−20%) vs. "strong" (−40%) Inhibition geben?

2. **Enzym-spezifisch**: Sollte es **CYP-Enzym-spezifische Faktoren** geben?  
   - Beispiel: CYP3A4-Inhibition (betrifft 50% aller Medikamente) → −30%
   - Beispiel: CYP2D6-Inhibition (betrifft 25% aller Medikamente) → −25%?

3. **Induktion**: Ist +15% für Induktion **zu aggressiv**?  
   - Sollte MEDLESS bei Induktion **gar nicht beschleunigen** (Factor 1.0)?

4. **Kombination**: Was passiert, wenn ein Medikament **mehrere CYP-Enzyme** betrifft?  
   - Aktuell: MEDLESS nimmt das **konservativste** Szenario (wenn "slower" vorhanden, gilt −30%)
   - Ist das sinnvoll, oder sollte es **kumulative Faktoren** geben?

5. **CBD-Dosis-Abhängigkeit**: MEDLESS berücksichtigt **nicht die CBD-Dosis** (50 mg CBD vs. 300 mg CBD).  
   - Sollte die CYP-Inhibition **dosisabhängig** skaliert werden?

---

### 3. THERAPEUTIC WINDOW LOGIC (Phase 4)

#### Aktuelle Implementierung in MEDLESS v1

**Formel**:
```typescript
// Schritt 1: Prüfe, ob Narrow Therapeutic Window vorliegt
windowWidth = therapeutic_max_ng_ml - therapeutic_min_ng_ml;
hasNarrowWindow = (windowWidth ≤ 50); // HEURISTIK: ≤50 ng/ml = "narrow"

// Schritt 2: Prüfe, ob gleichzeitig hohes Withdrawal Risk vorliegt
hasHighWithdrawalRisk = (withdrawal_risk_score ≥ 7);

// Schritt 3: Wenn BEIDE Bedingungen erfüllt, dann Slowdown
if (hasNarrowWindow && hasHighWithdrawalRisk) {
  therapeuticWindowFactor = 0.8; // −20% Slowdown
  effectiveWeeklyReduction *= 0.8;
}
```

**Konkrete Werte**:
| Medikament        | Min (ng/ml) | Max (ng/ml) | Window Width | Narrow? | Withdrawal Score | Adjustment? |
|-------------------|-------------|-------------|--------------|---------|------------------|-------------|
| **Digoxin**       | 0.8         | 2.0         | 1.2          | ✅ Ja   | 7/10            | ✅ −20%     |
| **Lithium**       | 600         | 1200        | 600          | ❌ Nein | 9/10            | ❌ Nein     |
| **Warfarin**      | 1.0         | 3.0         | 2.0          | ✅ Ja   | 6/10            | ❌ Nein (Score <7) |
| **Fluoxetin**     | NULL        | NULL        | —            | ❌ Nein | 8/10            | ❌ Nein     |

**Implementierungs-Code** (src/index.tsx, Zeilen 364–386):
```typescript
if (category.therapeutic_min_ng_ml != null && category.therapeutic_max_ng_ml != null) {
  const windowWidth = category.therapeutic_max_ng_ml - category.therapeutic_min_ng_ml;
  const hasNarrowWindow = windowWidth <= 50; // HEURISTIC: ≤50 ng/ml range is considered narrow
  const hasHighWithdrawalRisk = (category.withdrawal_risk_score || 0) >= 7;
  
  if (hasNarrowWindow && hasHighWithdrawalRisk) {
    // Apply additional 20% reduction to weekly speed for extra safety
    effectiveWeeklyReduction *= 0.8; // 20% slower
    therapeuticRangeAdjustmentApplied = true;
    limitedByCategory = true;
    
    safetyNotes.push(
      `🧪 ${medicationName}: Enges therapeutisches Fenster (${category.therapeutic_min_ng_ml}-${category.therapeutic_max_ng_ml} ng/ml) + hohes Absetzrisiko (${category.withdrawal_risk_score}/10) - Reduktion wird vorsichtshalber zusätzlich um 20% verlangsamt.`
    );
  }
}
```

**Input-Parameter**:
- `therapeutic_min_ng_ml`: Untere Grenze des therapeutischen Bereichs (ng/ml)
- `therapeutic_max_ng_ml`: Obere Grenze des therapeutischen Bereichs (ng/ml)
- **Quelle**: FDA-Zulassungsdokumente, TDM-Guidelines (Hiemke et al. 2018)

**Schwellenwerte**:
- **Window Width ≤50 ng/ml**: Gilt als "narrow"
- **Withdrawal Score ≥7**: Gilt als "high risk"
- **BEIDE Bedingungen erforderlich** für −20% Slowdown

---

#### Rationale / Hintergrund

**Basis**: 
Medikamente mit **engem therapeutischem Fenster** haben eine kleine Spanne zwischen wirksamer und toxischer Dosis. Beispiele:
- **Digoxin**: 0.8–2.0 ng/ml (toxisch ab 2.5 ng/ml)
- **Lithium**: 0.6–1.2 mmol/L (toxisch ab 1.5 mmol/L)
- **Warfarin**: INR 2.0–3.0 (Blutung ab INR >4.0)

**Warum 50 ng/ml als Threshold?**
- **Heuristisch**: Es gibt **keine universelle Definition** von "narrow therapeutic window"
- **MEDLESS Ansatz**: 50 ng/ml ist ein **pragmatischer Cutoff** basierend auf klinischer Erfahrung
- **Problem**: Einheit ist **nicht universell** (Lithium = mmol/L, Digoxin = ng/ml)

**Warum nur bei gleichzeitig hohem Withdrawal Risk?**
- **Doppeltes Risiko**: Narrow Window + High Withdrawal → besonders gefährlich
- **Konservativ**: Nur in kritischsten Fällen zusätzlich bremsen

**WICHTIG**: Der Threshold von 50 ng/ml ist **NICHT evidenzbasiert**, sondern eine **Arbeitshypothese**.

---

#### Konkrete Fragen an die Ärzt:innen

1. **Threshold**: Ist 50 ng/ml als Cutoff für "narrow window" **medizinisch sinnvoll**?  
   - Sollte es **medikamentenspezifische Thresholds** geben?
   - Beispiel: Digoxin (1.2 ng/ml Range) vs. Phenytoin (10 µg/ml Range)

2. **Einheiten**: Wie sollte MEDLESS mit **unterschiedlichen Einheiten** umgehen?  
   - Aktuell: Alles in ng/ml gespeichert (Lithium fälschlich als 600–1200 ng/ml statt mmol/L)
   - Sollte es **Einheiten-Konvertierung** geben?

3. **Kombination**: Sollte Narrow Window **auch ohne High Withdrawal Risk** einen Slowdown auslösen?  
   - Aktuell: Nur wenn BEIDE Bedingungen erfüllt (AND-Logik)
   - Alternative: OR-Logik (Narrow Window → −10%, High Withdrawal → −20%, Beide → −30%)

4. **Faktor-Stärke**: Ist −20% Slowdown **ausreichend** für Medikamente mit Narrow Window?  
   - Beispiel: Digoxin sollte evtl. −40% haben?

5. **TDM-Integration**: Sollte MEDLESS **Therapeutic Drug Monitoring (TDM)** empfehlen?  
   - Aktuell: Nur Warnung im PDF, aber keine explizite TDM-Empfehlung

---

## C. LIMITATIONS & RAHMENBEDINGUNGEN

**Was MEDLESS NICHT berücksichtigt** (bewusste Design-Entscheidungen):

1. **Pharmakogenetik**:
   - ❌ Keine CYP-Genotyp-Daten (z.B. CYP2D6 Poor Metabolizer, CYP2C19 Ultrarapid Metabolizer)
   - ❌ Keine individuellen Metabolisierungs-Raten
   - **Konsequenz**: MEDLESS Empfehlungen sind **populationsbasiert**, nicht personalisiert

2. **Organfunktion**:
   - ❌ Keine Leber-/Nierenfunktion (Kreatinin-Clearance, Child-Pugh-Score)
   - ❌ Keine Altersanpassung (Senioren >65 Jahre metabolisieren langsamer)
   - **Konsequenz**: Bei Organinsuffizienz sind Empfehlungen **potenziell zu schnell**

3. **Komorbiditäten**:
   - ❌ Keine psychiatrischen Komorbiditäten (Depression, Angststörung, Sucht)
   - ❌ Keine kardiovaskulären Erkrankungen (Arrhythmien, QT-Verlängerung)
   - **Konsequenz**: Zusätzliche Risikofaktoren werden **nicht erkannt**

4. **Individuelle Toleranz**:
   - ❌ Keine Berücksichtigung von Patient Feedback (Entzugssymptome, Verträglichkeit)
   - ❌ Keine Echtzeitanpassung basierend auf klinischem Verlauf
   - **Konsequenz**: MEDLESS ist **statisch**, nicht adaptiv

5. **Psychosoziale Faktoren**:
   - ❌ Keine Therapie-Begleitung (Psychotherapie, Selbsthilfegruppen)
   - ❌ Keine soziale Unterstützung (Familie, Arbeit, Wohnsituation)
   - **Konsequenz**: Erfolgswahrscheinlichkeit wird **überschätzt**

6. **Pharmakodynamische Interaktionen**:
   - ❌ Nur CYP-basierte Interaktionen, keine pharmakodynamischen (z.B. ZNS-Depression, QT-Verlängerung)
   - ❌ Keine Synergien zwischen Medikamenten (z.B. 2 Benzodiazepine = additive Wirkung)
   - **Konsequenz**: Multi-Drug Interaktionen sind **unvollständig abgebildet**

7. **Bioverfügbarkeit & Galenik**:
   - ❌ Keine First-Pass-Effekt-Berücksichtigung
   - ❌ Keine Retard-Präparate vs. Sofort-Präparate
   - **Konsequenz**: Empfehlungen sind **unabhängig von Darreichungsform**

8. **Withdrawal-Syndrom-Typen**:
   - ❌ Keine Differenzierung zwischen körperlichem vs. psychischem Entzug
   - ❌ Keine Rebound-Effekt-Modellierung (z.B. Antidepressiva Discontinuation Syndrome)
   - **Konsequenz**: Entzugssymptome werden **pauschal behandelt**

**Warum diese Limitationen?**
- **Transparenz**: Regelbasiert, nachvollziehbar, keine Black Box
- **Konservativ**: Alle Faktoren bewusst vorsichtig gewählt (lieber zu langsam als zu schnell)
- **Pragmatisch**: Datenquellen verfügbar, keine Pharmakogenomik-Tests erforderlich

**Rolle von MEDLESS**:
- ✅ **Diskussionsgrundlage** für Arzt-Patienten-Gespräch
- ✅ **Transparente Berechnung** von Obergrenzen
- ✅ **Konservative Heuristiken** basierend auf Literatur
- ❌ **KEIN Ersatz** für ärztliche Entscheidung
- ❌ **KEINE Garantie** für erfolgreiche Medikamentenreduktion

---

## D. REVIEW-CHECKLISTE

**Bitte beantworten Sie folgende Fragen mit Ja/Nein oder kurzem Kommentar**:

### Withdrawal Risk Formula

**1. Vorsichtigkeit**:  
☐ Ja / ☐ Nein / ☐ Unklar  
Wirkt die maximale Verlangsamung von −25% (bei Score 10/10) **ausreichend vorsichtig**?

**Kommentar**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**2. Linearität**:  
☐ Ja / ☐ Nein / ☐ Unklar  
Ist die **lineare Skalierung** (Score 4 → −10%, Score 8 → −20%, Score 10 → −25%) medizinisch sinnvoll?

**Kommentar**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

### CYP-450 Adjustment

**3. CYP-Faktoren**:  
☐ Zu stark / ☐ Passend / ☐ Zu schwach  
Bewertung der CYP-Faktoren: **Inhibition −30%** und **Induktion +15%**

**Kommentar**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**4. Enzym-Spezifität**:  
☐ Ja / ☐ Nein / ☐ Unklar  
Sollten **CYP-Enzym-spezifische Faktoren** verwendet werden (z.B. CYP3A4 −30%, CYP2D6 −25%)?

**Kommentar**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

### Therapeutic Window Logic

**5. Threshold**:  
☐ Ja / ☐ Nein / ☐ Unklar  
Ist der Cutoff von **50 ng/ml** für "narrow therapeutic window" medizinisch vertretbar?

**Kommentar**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

### Allgemeine Fragen

**6. Wirkstoffgruppen-Spezialregeln**:  
☐ Ja / ☐ Nein / ☐ Unklar  
Sollten bestimmte Wirkstoffgruppen (z.B. Benzodiazepine, Antipsychotika, Opioide) **eigene Spezialregeln** bekommen, statt nur die aktuellen Faktoren?

**Kommentar**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**7. Klinische Sicherheit**:  
☐ Ja / ☐ Nein / ☐ Nur mit Einschränkungen  
Würden Sie die aktuellen MEDLESS-Empfehlungen **als konservativ genug** einschätzen, um sie als Diskussionsgrundlage in der Praxis zu verwenden?

**Kommentar**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**Vielen Dank für Ihre Zeit und Expertise!**

**Kontakt für Rückfragen**: [info@medless.de] oder über das MEDLESS-Team

---

**Ende des Medical Review Brief V1**
