# 📊 MEDLESS - Vollständiger Datenbank-Bericht

**Datum:** 26. November 2025  
**Datenbank:** medless-production (lokal)  
**Scan-Typ:** Vollständige Analyse aller Tabellen und Einträge

---

## 📋 EXECUTIVE SUMMARY

### Gesamtanzahl Medikamente:
- **121 Medikamente** in der Haupttabelle `medications`
- **121 eindeutige Namen** (keine Duplikate bei `name`)
- **103 eindeutige Wirkstoffe** (`generic_name`)
- **18 Wirkstoffe mit 2 Einträgen** (Markenname + generischer Name)

### Zusätzliche Daten:
- **51 CBD-Interaktionen** in `cbd_interactions` (für erste 51 Medikamente)
- **24 Medikamentenkategorien** definiert
- **23 Kategorien mit Medikamenten**, 1 Kategorie leer (Antibiotika)

---

## 🗄️ TABELLEN-ÜBERSICHT

### Alle Tabellen in der Datenbank:

| Tabelle | Typ | Beschreibung | Einträge |
|---------|-----|--------------|----------|
| `medications` | **Haupttabelle** | Alle Medikamente mit Details | **121** |
| `medication_categories` | Kategorien | Medikamentenklassen | 24 |
| `cbd_interactions` | Interaktionen | CBD-Wechselwirkungen | 51 |
| `cbd_dosage_guidelines` | Richtlinien | CBD-Dosierungsempfehlungen | ? |
| `customer_emails` | Kontakte | E-Mail-Liste | ? |
| `user_plans` | Pläne | Benutzer-Dosierungspläne | ? |
| `d1_migrations` | System | Datenbank-Migrationen | ? |
| `_cf_METADATA` | System | Cloudflare-Metadaten | System |
| `sqlite_sequence` | System | Auto-Increment-IDs | System |

---

## 📊 MEDICATIONS TABLE - DETAILANALYSE

### Struktur (15 Spalten):

1. **id** (INTEGER, PRIMARY KEY)
2. **name** (TEXT, NOT NULL) - Produktname/Markenname
3. **generic_name** (TEXT) - Wirkstoffname
4. **category_id** (INTEGER) - Kategorie-ID
5. **cyp450_enzyme** (TEXT) - CYP450-Metabolismus
6. **description** (TEXT) - Beschreibung
7. **common_dosage** (TEXT) - Übliche Dosierung
8. **created_at** (DATETIME) - Erstellungsdatum
9. **half_life_hours** (REAL) - Halbwertszeit in Stunden
10. **therapeutic_min_ng_ml** (REAL) - Therapeutischer Minimalwert
11. **therapeutic_max_ng_ml** (REAL) - Therapeutischer Maximalwert
12. **withdrawal_risk_score** (INTEGER) - Absetzrisiko (0-10)
13. **max_weekly_reduction_pct** (REAL) - Max. wöchentliche Reduktion
14. **can_reduce_to_zero** (INTEGER) - Auf Null reduzierbar (0/1)
15. **cbd_interaction_strength** (TEXT) - CBD-Interaktionsstärke

---

## 📋 ALLE 121 MEDIKAMENTE (VOLLSTÄNDIGE LISTE)

### IDs 1-50:

| ID | Name | Wirkstoff | Kategorie | Withdrawal Risk | CBD Interaction | CYP450 |
|----|------|-----------|-----------|-----------------|-----------------|---------|
| 1 | Marcumar | Warfarin | 1 | null | null | CYP2C9, CYP3A4 |
| 2 | Xarelto | Rivaroxaban | 1 | null | null | CYP3A4 |
| 3 | Eliquis | Apixaban | 1 | null | null | CYP3A4 |
| 4 | Plavix | Clopidogrel | 1 | null | null | CYP2C19 |
| 5 | Prozac | Fluoxetin | 2 | null | null | CYP2D6, CYP2C9 |
| 6 | Zoloft | Sertralin | 2 | null | null | CYP2D6 |
| 7 | Cipralex | Escitalopram | 2 | null | null | CYP2C19, CYP3A4 |
| 8 | Trevilor | Venlafaxin | 2 | null | null | CYP2D6 |
| 9 | Cymbalta | Duloxetin | 2 | null | null | CYP2D6, CYP1A2 |
| 10 | Saroten | Amitriptylin | 2 | null | null | CYP2C19, CYP2D6 |
| 11 | Stangyl | Trimipramin | 2 | null | null | CYP2D6, CYP2C19 |
| 12 | Keppra | Levetiracetam | 3 | null | null | Keine |
| 13 | Lamictal | Lamotrigin | 3 | null | null | UGT1A4 |
| 14 | Depakote | Valproat | 3 | null | null | CYP2C9 |
| 15 | Trileptal | Oxcarbazepin | 3 | null | null | CYP3A4 |
| 16 | Onfi | Clobazam | 3 | null | null | CYP2C19, CYP3A4 |
| 17 | Lyrica | Pregabalin | 3 | null | null | Keine |
| 18 | Ibuprofen | Ibuprofen | 4 | null | null | CYP2C9 |
| 19 | Aspirin | Acetylsalicylsäure | 4 | null | null | Keine |
| 20 | Voltaren | Diclofenac | 4 | null | null | CYP2C9 |
| 21 | Tramal | Tramadol | 4 | null | null | CYP2D6, CYP3A4 |
| 22 | OxyContin | Oxycodon | 4 | null | null | CYP2D6, CYP3A4 |
| 23 | Novalgin | Metamizol | 4 | null | null | Keine |
| 24 | Tavor | Lorazepam | 5 | null | null | UGT2B7 |
| 25 | Valium | Diazepam | 5 | null | null | CYP2C19, CYP3A4 |
| 26 | Rivotril | Clonazepam | 5 | null | null | CYP3A4 |
| 27 | Lexotanil | Bromazepam | 5 | null | null | CYP3A4 |
| 28 | Zyprexa | Olanzapin | 5 | null | null | CYP1A2, CYP2D6 |
| 29 | Abilify | Aripiprazol | 5 | null | null | CYP2D6, CYP3A4 |
| 30 | Sortis | Atorvastatin | 6 | null | null | CYP3A4 |
| 31 | Zocor | Simvastatin | 6 | null | null | CYP3A4 |
| 32 | Sandimmun | Ciclosporin | 8 | null | null | CYP3A4 |
| 33 | Prograf | Tacrolimus | 8 | null | null | CYP3A4 |
| 34 | L-Thyroxin | Levothyroxin | 9 | null | null | Keine |
| 35 | Zestril | Lisinopril | 11 | null | null | Keine |
| 36 | Blopress | Candesartan | 11 | null | null | CYP2C9 |
| 37 | Norvasc | Amlodipin | 11 | null | null | CYP3A4 |
| 38 | Diovan | Valsartan | 11 | null | null | Keine |
| 39 | Antra | Omeprazol | 12 | null | null | CYP2C19, CYP3A4 |
| 40 | Agopton | Lansoprazol | 12 | null | null | CYP2C19, CYP3A4 |
| 41 | Pantozol | Pantoprazol | 12 | null | null | CYP2C19 |
| 42 | Glucophage | Metformin | 13 | null | null | Keine |
| 43 | Januvia | Sitagliptin | 13 | null | null | CYP3A4 |
| 44 | Ventolin | Salbutamol | 14 | null | null | Keine |
| 45 | Singulair | Montelukast | 14 | null | null | CYP3A4, CYP2C9 |
| 46 | Flutide | Fluticason | 14 | null | null | CYP3A4 |
| 47 | Medikinet | Methylphenidat | 15 | null | null | Keine |
| 48 | Zantac | Ranitidin | 12 | null | null | CYP3A4, CYP2D6 |
| 49 | Imodium | Loperamid | 4 | null | null | CYP3A4, CYP2C8 |
| 50 | Femara | Letrozol | 8 | null | null | CYP3A4, CYP2A6 |

### IDs 51-121:

| ID | Name | Wirkstoff | Kategorie | Withdrawal Risk | CBD Interaction | CYP450 |
|----|------|-----------|-----------|-----------------|-----------------|---------|
| 51 | Elontril | Bupropion | 2 | null | null | - |
| 52 | Ramipril | Ramipril | 11 | 7 | 3 | - |
| 53 | Captopril | Captopril | 11 | 7 | 2 | - |
| 54 | Telmisartan | Telmisartan | 11 | 7 | 3 | - |
| 55 | Irbesartan | Irbesartan | 11 | 7 | 3 | - |
| 56 | Atenolol | Atenolol | 11 | 8 | 2 | - |
| 57 | Propranolol | Propranolol | 11 | 8 | 5 | - |
| 58 | Simvastatin | Simvastatin | 6 | 5 | 6 | - |
| 59 | Atorvastatin | Atorvastatin | 6 | 5 | 6 | - |
| 60 | Rosuvastatin | Rosuvastatin | 6 | 5 | 3 | - |
| 61 | Pravastatin | Pravastatin | 6 | 5 | 2 | - |
| 62 | Fenofibrat | Fenofibrat | 6 | 5 | 4 | - |
| 63 | Dabigatran | Dabigatran | 10 | 10 | 4 | - |
| 64 | Phenprocoumon | Phenprocoumon | 10 | 10 | 7 | - |
| 65 | Warfarin | Warfarin | 10 | 10 | 7 | - |
| 66 | Pantoprazol | Pantoprazol | 12 | 6 | 4 | - |
| 67 | Omeprazol | Omeprazol | 12 | 6 | 5 | - |
| 68 | Esomeprazol | Esomeprazol | 12 | 6 | 5 | - |
| 69 | Lansoprazol | Lansoprazol | 12 | 6 | 5 | - |
| 70 | Rabeprazol | Rabeprazol | 12 | 6 | 4 | - |
| 71 | Metamizol | Metamizol | 4 | 4 | 3 | - |
| 72 | Acetylsalicylsäure | Acetylsalicylsäure | 4 | 5 | 3 | - |
| 73 | Diclofenac | Diclofenac | 4 | 5 | 5 | - |
| 74 | Naproxen | Naproxen | 4 | 5 | 4 | - |
| 75 | Indometacin | Indometacin | 4 | 5 | 4 | - |
| 76 | Meloxicam | Meloxicam | 4 | 5 | 4 | - |
| 77 | Pregabalin | Pregabalin | 3 | 7 | 3 | - |
| 78 | Gabapentin | Gabapentin | 3 | 7 | 2 | - |
| 79 | Citalopram | Citalopram | 2 | 8 | 5 | - |
| 80 | Escitalopram | Escitalopram | 2 | 8 | 5 | - |
| 81 | Fluvoxamin | Fluvoxamin | 2 | 8 | 7 | - |
| 82 | Amitriptylin | Amitriptylin | 2 | 8 | 6 | - |
| 83 | Bupropion | Bupropion | 2 | 7 | 5 | - |
| 84 | Trazodon | Trazodon | 2 | 7 | 6 | - |
| 85 | Quetiapin | Quetiapin | 18 | 8 | 6 | - |
| 86 | Risperidon | Risperidon | 18 | 8 | 5 | - |
| 87 | Clozapin | Clozapin | 18 | 9 | 7 | - |
| 88 | Aripiprazol | Aripiprazol | 18 | 7 | 5 | - |
| 89 | Haloperidol | Haloperidol | 18 | 8 | 4 | - |
| 90 | Diazepam | Diazepam | 16 | 9 | 6 | - |
| 91 | Lorazepam | Lorazepam | 16 | 9 | 3 | - |
| 92 | Alprazolam | Alprazolam | 16 | 9 | 7 | - |
| 93 | Midazolam | Midazolam | 16 | 8 | 7 | - |
| 94 | Zolpidem | Zolpidem | 17 | 8 | 6 | - |
| 95 | Zopiclon | Zopiclon | 17 | 8 | 6 | - |
| 96 | Lactulose | Lactulose | 19 | 3 | 1 | - |
| 97 | Natriumpicosulfat | Natriumpicosulfat | 19 | 4 | 2 | - |
| 98 | Senna | Senna | 19 | 4 | 2 | - |
| 99 | Prucaloprid | Prucaloprid | 19 | 4 | 3 | - |
| 100 | Linaclotid | Linaclotid | 19 | 3 | 1 | - |
| 101 | Mesalazin | Mesalazin | 20 | 5 | 2 | - |
| 102 | Budesonid | Budesonid | 20 | 6 | 5 | - |
| 103 | Azathioprin | Azathioprin | 8 | 8 | 3 | - |
| 104 | Ciclosporin | Ciclosporin | 8 | 9 | 8 | - |
| 105 | Tacrolimus | Tacrolimus | 8 | 9 | 8 | - |
| 106 | Mycophenolat-Mofetil | Mycophenolat | 8 | 8 | 4 | - |
| 107 | Zoledronat | Zoledronat | 21 | 6 | 2 | - |
| 108 | Ibandronat | Ibandronat | 21 | 6 | 2 | - |
| 109 | Risedronat | Risedronat | 21 | 6 | 2 | - |
| 110 | Teriparatid | Teriparatid | 21 | 7 | 2 | - |
| 111 | Cetirizin | Cetirizin | 22 | 3 | 2 | - |
| 112 | Loratadin | Loratadin | 22 | 3 | 4 | - |
| 113 | Desloratadin | Desloratadin | 22 | 3 | 4 | - |
| 114 | Levocetirizin | Levocetirizin | 22 | 3 | 2 | - |
| 115 | Fexofenadin | Fexofenadin | 22 | 3 | 3 | - |
| 116 | Hydroxyzin | Hydroxyzin | 22 | 5 | 5 | - |
| 117 | Itraconazol | Itraconazol | 23 | 5 | 7 | - |
| 118 | Voriconazol | Voriconazol | 23 | 6 | 7 | - |
| 119 | Terbinafin | Terbinafin | 23 | 4 | 4 | - |
| 120 | Valaciclovir | Valaciclovir | 24 | 3 | 1 | - |
| 121 | Oseltamivir | Oseltamivir | 24 | 3 | 2 | - |

---

## 🔍 DUPLIKATE-ANALYSE

### Name-Duplikate:
✅ **KEINE DUPLIKATE** - Alle 121 Namen sind einzigartig

### Generic-Name-Duplikate (18 Wirkstoffe mit 2 Einträgen):

| Wirkstoff | Medikamente | Grund |
|-----------|-------------|-------|
| **Warfarin** | Marcumar, Warfarin | Markenname + generisch |
| **Tacrolimus** | Prograf, Tacrolimus | Markenname + generisch |
| **Simvastatin** | Zocor, Simvastatin | Markenname + generisch |
| **Pregabalin** | Lyrica, Pregabalin | Markenname + generisch |
| **Pantoprazol** | Pantozol, Pantoprazol | Markenname + generisch |
| **Omeprazol** | Antra, Omeprazol | Markenname + generisch |
| **Metamizol** | Novalgin, Metamizol | Markenname + generisch |
| **Lorazepam** | Tavor, Lorazepam | Markenname + generisch |
| **Lansoprazol** | Agopton, Lansoprazol | Markenname + generisch |
| **Escitalopram** | Cipralex, Escitalopram | Markenname + generisch |
| **Diclofenac** | Voltaren, Diclofenac | Markenname + generisch |
| **Diazepam** | Valium, Diazepam | Markenname + generisch |
| **Ciclosporin** | Sandimmun, Ciclosporin | Markenname + generisch |
| **Bupropion** | Elontril, Bupropion | Markenname + generisch |
| **Atorvastatin** | Sortis, Atorvastatin | Markenname + generisch |
| **Aripiprazol** | Abilify, Aripiprazol | Markenname + generisch |
| **Amitriptylin** | Saroten, Amitriptylin | Markenname + generisch |
| **Acetylsalicylsäure** | Aspirin, Acetylsalicylsäure | Markenname + generisch |

**Anmerkung:** Diese Duplikate sind **gewollt**, da sowohl Markenname als auch generischer Name gesucht werden können.

---

## 🏷️ KATEGORIEN-VERTEILUNG

| Kategorie | Anzahl Medikamente | % von 121 |
|-----------|-------------------|-----------|
| **Antidepressiva** | 14 | 11.6% |
| **Schmerzmittel** | 13 | 10.7% |
| **Blutdrucksenker** | 10 | 8.3% |
| **Protonenpumpenhemmer** | 9 | 7.4% |
| **Antiepileptika** | 8 | 6.6% |
| **Statine** | 7 | 5.8% |
| **Immunsuppressiva** | 7 | 5.8% |
| **Psychopharmaka** | 6 | 5.0% |
| **Antihistaminika** | 6 | 5.0% |
| **Antipsychotika** | 5 | 4.1% |
| **Laxantien** | 5 | 4.1% |
| **Blutverdünner** | 4 | 3.3% |
| **Benzodiazepine** | 4 | 3.3% |
| **Osteoporose-Medikamente** | 4 | 3.3% |
| **Antikoagulantien** | 3 | 2.5% |
| **Asthma-Medikamente** | 3 | 2.5% |
| **Antimykotika** | 3 | 2.5% |
| **Diabetesmedikamente** | 2 | 1.7% |
| **Z-Substanzen** | 2 | 1.7% |
| **CED-Medikamente** | 2 | 1.7% |
| **Virostatika** | 2 | 1.7% |
| **Schilddrüsenmedikamente** | 1 | 0.8% |
| **ADHS-Medikamente** | 1 | 0.8% |
| **Antibiotika** | 0 | 0.0% ⚠️ |

---

## 📝 UNIQUE WIRKSTOFFE (103 TOTAL)

<details>
<summary>Alle 103 eindeutigen Wirkstoffe alphabetisch</summary>

1. Acetylsalicylsäure
2. Alprazolam
3. Amitriptylin
4. Amlodipin
5. Apixaban
6. Aripiprazol
7. Atenolol
8. Atorvastatin
9. Azathioprin
10. Bromazepam
11. Budesonid
12. Bupropion
13. Candesartan
14. Captopril
15. Cetirizin
16. Ciclosporin
17. Citalopram
18. Clobazam
19. Clonazepam
20. Clopidogrel
21. Clozapin
22. Dabigatran
23. Desloratadin
24. Diazepam
25. Diclofenac
26. Duloxetin
27. Escitalopram
28. Esomeprazol
29. Fenofibrat
30. Fexofenadin
31. Fluoxetin
32. Fluticason
33. Fluvoxamin
34. Gabapentin
35. Haloperidol
36. Hydroxyzin
37. Ibandronat
38. Ibuprofen
39. Indometacin
40. Irbesartan
41. Itraconazol
42. Lactulose
43. Lamotrigin
44. Lansoprazol
45. Letrozol
46. Levetiracetam
47. Levocetirizin
48. Levothyroxin
49. Linaclotid
50. Lisinopril
51. Loperamid
52. Loratadin
53. Lorazepam
54. Meloxicam
55. Mesalazin
56. Metamizol
57. Metformin
58. Methylphenidat
59. Midazolam
60. Montelukast
61. Mycophenolat
62. Naproxen
63. Natriumpicosulfat
64. Olanzapin
65. Omeprazol
66. Oseltamivir
67. Oxcarbazepin
68. Oxycodon
69. Pantoprazol
70. Phenprocoumon
71. Pravastatin
72. Pregabalin
73. Propranolol
74. Prucaloprid
75. Quetiapin
76. Rabeprazol
77. Ramipril
78. Ranitidin
79. Risedronat
80. Risperidon
81. Rivaroxaban
82. Rosuvastatin
83. Salbutamol
84. Senna
85. Sertralin
86. Simvastatin
87. Sitagliptin
88. Tacrolimus
89. Telmisartan
90. Terbinafin
91. Teriparatid
92. Tramadol
93. Trazodon
94. Trimipramin
95. Valaciclovir
96. Valproat
97. Valsartan
98. Venlafaxin
99. Voriconazol
100. Warfarin
101. Zoledronat
102. Zolpidem
103. Zopiclon

</details>

---

## ⚠️ DATENQUALITÄT-ANALYSE

### Fehlende Daten (IDs 1-51):

**Withdrawal Risk Score:** Nicht befüllt bei IDs 1-51  
**CBD Interaction Strength:** Nicht befüllt bei IDs 1-51  

### Vollständige Daten (IDs 52-121):

✅ **Withdrawal Risk Score:** Vollständig (Werte 3-10)  
✅ **CBD Interaction Strength:** Vollständig (Werte 1-8)  

### Empfehlung:
Die ersten 51 Einträge sollten mit `withdrawal_risk_score` und `cbd_interaction_strength` nachgepflegt werden.

---

## 💊 CBD-INTERAKTIONEN (51 EINTRÄGE)

Die Tabelle `cbd_interactions` enthält **51 detaillierte Interaktionsbeschreibungen** für die ersten 51 Medikamente.

**Felder pro Interaktion:**
- medication_id
- interaction_type (z.B. "enhancement")
- severity (low/medium/high/critical)
- description
- mechanism (pharmakologischer Mechanismus)
- recommendation (Empfehlungen)
- source_url (Quellenangabe)

**Beispiel (ID 1 - Warfarin):**
- **Severity:** critical
- **Description:** CBD kann die blutverdünnende Wirkung von Warfarin deutlich verstärken
- **Mechanism:** CBD hemmt CYP2C9 und CYP3A4
- **Recommendation:** Regelmäßige INR-Kontrollen erforderlich

---

## 🎯 ZUSAMMENFASSUNG

### ✅ Was ist gut:
- 121 Medikamente erfolgreich eingepflegt
- Keine Namen-Duplikate
- 18 Wirkstoffe mit Markenname + generischem Name (gewollt)
- 51 CBD-Interaktionen detailliert dokumentiert
- IDs 52-121 haben vollständige Risk-Scores

### ⚠️ Was fehlt:
1. **Withdrawal Risk Scores** für IDs 1-51
2. **CBD Interaction Strength** für IDs 1-51
3. **Antibiotika-Kategorie** ist leer (0 Medikamente)
4. **Datenbank-Ausbau** auf 200+ Medikamente geplant

### 📈 Empfohlene nächste Schritte:
1. Risk-Scores für IDs 1-51 nachtragen
2. Antibiotika-Kategorie befüllen (ca. 15-20 Medikamente)
3. Weitere Kategorien erweitern:
   - Antidepressiva: 14 → 25
   - Schmerzmittel: 13 → 20
   - Diabetes-Medikamente: 2 → 15
   - Hormonpräparate hinzufügen

---

**Bericht erstellt am:** 26. November 2025  
**Datenbank-Version:** Local D1 (medless-production)  
**Status:** ✅ VOLLSTÄNDIG ANALYSIERT
