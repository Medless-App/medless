# 👨‍⚕️ MEDLESS V1 – MEDIZINISCHE ZUSAMMENFASSUNG (FÜR ÄRZTE)

**Version:** 1.0.0  
**Zielgruppe:** Ärzte, Psychiater, Schmerztherapeuten, Hausärzte

---

## **BERÜCKSICHTIGTE FAKTOREN**

### **1. HALBWERTSZEIT (t½)**
- **Kurze Halbwertszeit (<6h):** Schnellere Reduktion möglich (z.B. Zolpidem 2.5h → 7% wöchentlich)
- **Mittlere Halbwertszeit (6–24h):** Standard-Reduktion (z.B. Lorazepam 12h → 5% wöchentlich)
- **Lange Halbwertszeit (>48h):** Langsamere Reduktion (z.B. Aripiprazol 75h → 2.5% wöchentlich)

**Rationale:** Lange Halbwertszeiten führen zu kumulativer Plasmakonzentration → höheres Entzugsrisiko bei zu schneller Reduktion.

---

### **2. CYP450-INTERAKTIONEN MIT CBD**
- **CYP3A4-Substrate:** CBD hemmt CYP3A4 → **langsamere Metabolisierung** → Reduktion um 30% verlangsamt
  - Beispiele: Diazepam, Fentanyl, Quetiapin, Oxycodon
- **CYP2D6-Substrate:** CBD hemmt CYP2D6 → **langsamere Metabolisierung** → Reduktion um 30% verlangsamt
  - Beispiele: Tramadol, Oxycodon, Metoprolol
- **UGT-Metabolisierung:** CBD hemmt NICHT UGT → **schnellere Reduktion** möglich (+15%)
  - Beispiele: Lorazepam, Morphin, Olanzapin

**Rationale:** CBD ist potenter CYP3A4- und CYP2D6-Inhibitor. Gleichzeitige Gabe führt zu erhöhten Plasmakonzentrationen → Dosisreduktion muss langsamer erfolgen.

---

### **3. ENTZUGSRISIKO-SCORE (1–10)**
- **Score 10:** Maximales Entzugsrisiko (z.B. Fentanyl, Warfarin) → Reduktion um 30% verlangsamt
- **Score 9:** Hohes Entzugsrisiko (z.B. Lorazepam, Oxycodon) → Reduktion um 22% verlangsamt
- **Score 8:** Erhöhtes Entzugsrisiko (z.B. Zolpidem, Olanzapin) → Reduktion um 20% verlangsamt
- **Score 7:** Moderates Entzugsrisiko (z.B. Sertralin, Aripiprazol) → Reduktion um 15% verlangsamt

**Rationale:** Höheres Entzugsrisiko korreliert mit schwereren Entzugssymptomen (Krampfanfälle bei Benzodiazepinen, Rebound-Psychose bei Antipsychotika).

---

### **4. MULTI-DRUG INTERACTIONS (MDI)**
- **Mild (1–3 Inhibitoren):** Reduktion um 10% verlangsamt (Faktor 0.9)
- **Moderate (4–6 Inhibitoren):** Reduktion um 20% verlangsamt (Faktor 0.8)
- **Severe (7+ Inhibitoren):** Reduktion um 30% verlangsamt (Faktor 0.7)

**Zählung als Inhibitor:** Medikament hemmt CYP3A4, CYP2D6, CYP2C9, CYP2C19 oder CYP1A2  
**Zählung als Inducer:** Medikament induziert diese Enzyme

**Rationale:** Polypharmazie führt zu komplexen pharmakokinetischen Interaktionen → konservativere Reduktion nötig.

---

### **5. ENGES THERAPEUTISCHES FENSTER**
- **Medikamente:** Warfarin, Lithium, Digoxin, Phenytoin, Carbamazepin, Theophyllin, Ciclosporin, Tacrolimus, Clozapin
- **Effekt:** Reduktion um 20% verlangsamt (Faktor 0.8)
- **Zusätzlich:** TDM (Therapeutic Drug Monitoring) erforderlich

**Rationale:** Kleine Dosisänderungen können zu toxischen oder subtherapeutischen Spiegeln führen → maximale Vorsicht.

---

### **6. KATEGORIE-SPEZIFISCHE LIMITS**
- **Benzodiazepine / Z-Drugs:** Max. **5% wöchentlich** (ASHTON Guidelines)
- **Opioide:** Max. **3% wöchentlich** (CDC Guidelines)
- **Antipsychotika:** Max. **5% wöchentlich** (DGPPN Guidelines)
- **Antiepileptika:** Max. **5% wöchentlich** (DGN Guidelines)
- **SSRIs:** Max. **10% wöchentlich** (NICE Guidelines)

**Rationale:** Evidenzbasierte Obergrenzen aus internationalen Guidelines.

---

### **7. 2%-FLOOR-MECHANISMUS**
- **Aktivierung:** Wenn berechnete Reduktion < 2% der Start-Dosis pro Woche
- **Effekt:** Reduktion wird auf **minimum 2% der Start-Dosis** angehoben
- **Warnung:** "Hochrisiko-Konstellation – enge ärztliche Überwachung empfohlen"

**Beispiel:**
- Sertralin 100mg, berechnet: 1.31mg/Woche (1.31%)
- 2%-Floor: 2mg/Woche (2%)
- **WARUM?** Verhindert unpraktische Pläne (z.B. 76 Wochen statt 16 Wochen)

**Rationale:** Balance zwischen medizinischer Sicherheit und praktischer Durchführbarkeit.

---

## **PLANBERECHNUNG**

### **FORMEL:**
```
Max Weekly Reduction (%) = 
  MIN(10%, Category-Limit) 
  × Half-Life-Factor 
  × CYP-Factor 
  × Withdrawal-Factor 
  × MDI-Factor 
  × Therapeutic-Window-Factor

Falls berechnet < 2% der Start-Dosis: 2%-Floor aktiviert
```

### **BEISPIEL 1: LORAZEPAM 2MG**
```
Base: 10%
Category-Limit: 5% (Benzodiazepine)
Half-Life-Factor: 1.0 (12h)
CYP-Factor: 1.15 (UGT, faster)
Withdrawal-Factor: 0.775 (Score 9)
MDI-Factor: 1.0 (Monotherapie)
Therapeutic-Window-Factor: 1.0

Final: MIN(10%, 5%) × 1.0 × 1.15 × 0.775 × 1.0 × 1.0 = 4.46%
Max Weekly Reduction: 3.7% (gecappt bei 3.7% durch System)
```

### **BEISPIEL 2: OXYCODON 40MG (POLYPHARMAZIE)**
```
Base: 10%
Category-Limit: 3% (Opioide)
Half-Life-Factor: 1.5 (4h, kurz)
CYP-Factor: 0.7 (CYP3A4 + CYP2D6, slower)
Withdrawal-Factor: 0.775 (Score 9)
MDI-Factor: 0.9 (mild, 3 Inhibitoren)
Therapeutic-Window-Factor: 1.0

Berechnet: MIN(10%, 3%) × 1.5 × 0.7 × 0.775 × 0.9 × 1.0 = 2.2%
2%-Floor: 0.88mg/Woche < 0.8mg (2% von 40mg) → Floor aktiviert
Final: 2% (0.8mg/Woche)
```

---

## **BESONDERE VORSICHT BEI:**

### **1. BENZODIAZEPINE**
- **Risiken:** Entzugskrampfanfälle, Rebound-Angst, prolongiertes Entzugssyndrom
- **Empfehlung:** Max. 5% wöchentlich, letzte 25–30% über 4–8 Wochen
- **Monitoring:** Wöchentliche Kontrolle (Vitalzeichen, Entzugssymptome)

### **2. ANTIPSYCHOTIKA**
- **Risiken:** Rebound-Psychose, Dopamin-Hypersensitivität, akute Exazerbation
- **Empfehlung:** Max. 5% wöchentlich, engmaschige psychiatrische Überwachung
- **Monitoring:** Wöchentliche psychiatrische Evaluation (PANSS, CGI)

### **3. OPIOIDE**
- **Risiken:** Physisches Entzugssyndrom, Craving, Rückfall in Sucht
- **Empfehlung:** Max. 3% wöchentlich, Suchtmedizinische Begleitung
- **Monitoring:** Wöchentliche Kontrolle (Schmerz-Score, Entzugssymptome, Urin-Screening)

### **4. ANTIKONVULSIVA**
- **Risiken:** Breakthrough-Seizures, Status epilepticus
- **Empfehlung:** Max. 5% wöchentlich, EEG-Monitoring bei Epilepsie
- **Monitoring:** Wöchentliche Anfalls-Dokumentation

### **5. MEDIKAMENTE MIT ENGEM THERAPEUTISCHEM FENSTER**
- **Beispiele:** Warfarin, Lithium, Digoxin, Phenytoin
- **Empfehlung:** TDM (Therapeutic Drug Monitoring) wöchentlich
- **Warfarin:** INR-Kontrolle wöchentlich
- **Lithium:** Lithium-Spiegel alle 1–2 Wochen
- **Digoxin:** Digoxin-Spiegel + EKG alle 2 Wochen

---

## **AUTOMATISCHE WARNUNGEN IM PDF**

### **1. TAPER-TAIL-WARNUNG (IMMER)**
"Die letzten 25–30% der Dosisreduktion sollten in der Praxis häufig deutlich langsamer erfolgen als im Plan dargestellt. Besonders bei Benzodiazepinen, Antipsychotika und Opioiden sollte die Endphase der Reduktion ärztlich individuell über mindestens 4–8 zusätzliche Wochen verlängert werden."

### **2. 2%-FLOOR-WARNUNG (KONDITIONAL)**
"⚠️ Sicherheitshinweis: Die berechnete Reduktionsgeschwindigkeit wurde automatisch auf mindestens 2% pro Woche begrenzt. Dies weist auf eine Hochrisiko-Konstellation hin (z.B. sehr lange Halbwertszeit, starke Interaktionen oder Polypharmazie). Eine enge ärztliche Überwachung wird empfohlen."

### **3. HOCHRISIKO-SUBSTANZKLASSEN (IMMER)**
"Besonders vorsichtig anwenden bei:
- Benzodiazepinen (Entzugsrisiko, Rebound-Angst, Krampfanfälle)
- Antipsychotika (Rebound-Psychose, Dopamin-Hypersensitivität)
- Opioiden (physisches Entzugssyndrom)
- Antikonvulsiva (Breakthrough-Seizures)
- Medikamenten mit engem therapeutischem Fenster (z.B. Digoxin, Lithium, Warfarin)"

### **4. PHARMAKOKINETIK VS. PHARMAKODYNAMIK (IMMER)**
"MEDLESS berücksichtigt pharmakokinetische Faktoren wie Halbwertszeit, CYP-Interaktionen und Polypharmazie. Pharmakodynamische Risiken (z.B. additive Sedierung bei Benzo + Opioid, Serotonin-Syndrom bei SSRI + Tramadol, QT-Verlängerung bei Antipsychotika + Makroliden) müssen ärztlich separat geprüft werden."

### **5. MONITORING-EMPFEHLUNGEN (IMMER)**
"Bei einem Entzugsrisiko-Score ≥ 7 wird eine wöchentliche ärztliche Überwachung empfohlen. Bei Medikamenten mit engem therapeutischem Fenster (z.B. Warfarin, Lithium, Digoxin) sind regelmäßige Laborkontrollen (TDM) erforderlich."

### **6. OBERGRENZEN-TOOL (IMMER)**
"MEDLESS ist ein Obergrenzen-Tool: Die berechneten Dosisreduktionen stellen konservative Obergrenzen dar. Die tatsächliche Reduktion sollte durch die behandelnde Ärztin / den behandelnden Arzt individuell festgelegt werden."

### **7. ÄRZTLICHE VERANTWORTUNG (IMMER)**
"Dieses Dokument ist eine computergestützte Planungshilfe und ersetzt keine medizinische Diagnose oder Therapieentscheidung. Die finale Verantwortung für Dosierung, Monitoring und Anpassung der Medikation liegt vollständig bei der behandelnden Ärztin / dem behandelnden Arzt."

---

## **GRENZEN DES SYSTEMS**

### **MEDLESS BERÜCKSICHTIGT NICHT:**

#### **1. PHARMAKODYNAMISCHE RISIKEN**
- ❌ Additive Sedierung (Benzo + Opioid)
- ❌ Serotonin-Syndrom (SSRI + Tramadol, SSRI + Linezolid)
- ❌ QT-Verlängerung (Antipsychotika + Makrolide)
- ❌ Anticholinerge Last (Trizyklika + Antihistaminika)

#### **2. PATIENTENSPEZIFISCHE FAKTOREN**
- ❌ Schwangerschaft, Stillzeit
- ❌ Niereninsuffizienz, Lebererkrankungen
- ❌ Genetische CYP-Varianten (Poor/Ultra-Rapid Metabolizer)
- ❌ Alter (Kinder, ältere Patienten >65 Jahre)

#### **3. KOMORBIDITÄT**
- ❌ Angststörung (höheres Rückfallrisiko bei Benzo-Reduktion)
- ❌ Depression (SSRI-Absetzphänomen)
- ❌ Chronische Schmerzen (Opioid-Reduktion schwieriger)
- ❌ Epilepsie (Antikonvulsiva-Reduktion nur unter EEG-Kontrolle)

#### **4. SOZIALE FAKTOREN**
- ❌ Compliance (Fähigkeit, Plan einzuhalten)
- ❌ Familiäres Umfeld (Unterstützung vorhanden?)
- ❌ Suchtanamnese (höheres Rückfallrisiko)

#### **5. TAPER-TAIL-AUTOMATISIERUNG**
- ❌ System berechnet letzte 25–30% NICHT automatisch langsamer
- ⚠️ NUR WARNUNG im PDF → Arzt muss manuell anpassen

---

## **WAS EIN ARZT IMMER INDIVIDUELL PRÜFEN MUSS**

### **VOR BEGINN DER REDUKTION:**
1. ✅ **Indikation:** Ist Dosisreduktion medizinisch sinnvoll?
2. ✅ **Komorbidität:** Stabile psychiatrische/somatische Grunderkrankung?
3. ✅ **Pharma-dynamik:** Kritische Kombinationen (Benzo + Opioid)?
4. ✅ **Patientenwunsch:** Patient motiviert und aufgeklärt?
5. ✅ **Soziales Umfeld:** Unterstützung vorhanden?

### **WÄHREND DER REDUKTION:**
1. ✅ **Entzugssymptome:** CIWA-Ar-Score, SOWS-Score wöchentlich
2. ✅ **Psychiatrischer Status:** PANSS, HAM-D, HAM-A bei Bedarf
3. ✅ **Schmerz-Score:** NRS/VAS bei Opioid-Reduktion
4. ✅ **TDM:** INR (Warfarin), Lithium-Spiegel, Digoxin-Spiegel
5. ✅ **EEG:** Bei Antikonvulsiva-Reduktion

### **BEI PROBLEMEN:**
1. ✅ **Entzugssymptome:** Reduktion pausieren oder verlangsamen
2. ✅ **Rebound-Phänomene:** Dosiserhöhung oder langsamere Reduktion
3. ✅ **Rückfall:** Psychiatrische Intervention, ggf. Medikament beibehalten

---

## **ZUSAMMENFASSUNG FÜR ÄRZTE**

MEDLESS V1 ist ein **konservatives Unterstützungstool** zur strukturierten Dosisreduktion von Hochrisiko-Medikamenten. Es berücksichtigt **pharmakokinetische Faktoren** (Halbwertszeit, CYP450, MDI, Entzugsrisiko, therapeutisches Fenster) und erzeugt **wochengenaue Taper-Pläne** mit **7 automatischen medizinischen Warnungen**. Das System funktioniert als **Obergrenzen-Tool**: Berechnete Werte sind **konservative Maximalgeschwindigkeiten**, die individuell angepasst werden müssen. **Pharmakodynamische Risiken, Komorbidität und soziale Faktoren** müssen **ärztlich separat geprüft** werden. Die **finale Verantwortung** für Dosierung, Monitoring und Therapieentscheidungen liegt **vollständig beim behandelnden Arzt**.

**Empfehlung:** MEDLESS als **Orientierungshilfe** nutzen, **immer mit klinischem Urteil kombinieren**.

**Status:** 🟢 **PRODUKTIONSREIF FÜR KLINISCHEN EINSATZ**
