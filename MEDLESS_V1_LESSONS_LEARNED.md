# 📚 MEDLESS V1 – LESSONS LEARNED

**Version:** 1.0.0  
**Zeitraum:** Oktober 2024 – Dezember 2025

---

## **TECHNISCHE LEARNINGS**

### **1. DATABASE SCHEMA VALIDATION IST KRITISCH VOR GO-LIVE**
**Erfahrung:** Production DB hatte falsche Werte (Category Limits 10% statt 5%, Narrow Window nicht markiert), obwohl lokale DB korrekt war.  
**Lesson:** **IMMER** Production DB separat validieren, nicht nur lokal testen. 5 SQL-Checks sollten Standard-Verfahren vor jedem Deployment sein.

### **2. MIGRATIONS IN PRODUCTION ERFORDERN VORSICHT**
**Erfahrung:** Migration 017 schlug fehl wegen duplicate columns (`cyp3a4_substrate` existierte bereits). Automatische Migrations funktionierten nicht wie erwartet.  
**Lesson:** Bei komplexen Schema-Änderungen: Manuelle SQL-Befehle via `wrangler d1 execute` sind oft sicherer als automatische Migrations. Always check current schema first with `PRAGMA table_info`.

### **3. BUILD-INFO MUSS IM BUILD-PROZESS GENERIERT WERDEN**
**Erfahrung:** Erstes Deployment zeigte falschen Commit-Hash (`d6489e7` statt `a6101d0`), weil `dist/build-info.json` aus altem Build stammte.  
**Lesson:** Build-Info-Generation MUSS Teil von `npm run build` sein, nicht manuell. Script `generate-build-info.mjs` wurde hinzugefügt.

### **4. 2%-FLOOR IST ESSENTIELL FÜR PRAKTIKABILITÄT**
**Erfahrung:** Ohne 2%-Floor wurden unpraktische Pläne generiert (76 Wochen für Sertralin 100mg → 25mg).  
**Lesson:** Balance zwischen medizinischer Sicherheit und praktischer Durchführbarkeit ist kritisch. 2%-Floor verhindert "theoretisch perfekte, aber praktisch unmögliche" Pläne.

---

## **MEDIZINISCHE LEARNINGS**

### **5. CATEGORY-LIMITS SIND WICHTIGER ALS ABSOLUTE GESCHWINDIGKEITEN**
**Erfahrung:** Benzodiazepine mit 10% Limit führten zu medizinisch bedenklichen Plänen (zu schnell). Korrektur auf 5% (ASHTON Guidelines) machte Pläne sicher.  
**Lesson:** **Guidelines-basierte Kategorie-Limits** sind nicht verhandelbar. Evidenzbasierte Obergrenzen (ASHTON, CDC, DGPPN) MÜSSEN im System hinterlegt sein.

### **6. NARROW THERAPEUTIC WINDOW ERFORDERT SPEZIELLE BEHANDLUNG**
**Erfahrung:** Warfarin, Lithium, Digoxin ohne spezielle Markierung führten zu falschen Reduktions-Empfehlungen.  
**Lesson:** **Separate Spalte** (`has_narrow_therapeutic_window`) ist notwendig. Diese Medikamente brauchen TDM-Hinweise und konservativste Reduktion oder gar keine automatische Reduktion.

### **7. TAPER-TAIL IST MEDIZINISCH ESSENTIELL, ABER SCHWER ZU AUTOMATISIEREN**
**Erfahrung:** Letzte 25–30% der Reduktion sind medizinisch kritisch (höchstes Entzugsrisiko), aber algorithmisch schwer zu definieren.  
**Lesson:** **PDF-Warnung ist Kompromiss für v1**. V2 sollte explizite Logik haben: Ab 70% der Reduktion → Geschwindigkeit halbieren. Aber: Ärztliche Flexibilität MUSS erhalten bleiben.

### **8. PHARMAKODYNAMIK IST GENAUSO WICHTIG WIE PHARMAKOKINETIK**
**Erfahrung:** System berücksichtigt CYP-Interaktionen (Pharmakokinetik), aber NICHT additive Sedierung (Pharmakodynamik).  
**Lesson:** **PDF-Disclaimer ist obligatorisch**. Ärzte müssen wissen, dass System NUR Pharmakokinetik berücksichtigt. V2 sollte Pharmakodynamik-Warnings haben (Benzo + Opioid, SSRI + Tramadol).

---

## **PROZESS-LEARNINGS**

### **9. SYSTEMATISCHE VALIDIERUNG IN 8 SCHRITTEN IST ERFOLGREICH**
**Erfahrung:** Strukturierter 8-Schritte-Prozess (Datenbankanalyse → Berechnungslogik → DB-Korrekturen → MDI → PDF → E2E → Deployment → Doku) führte zu vollständiger Validierung ohne kritische Bugs nach Go-Live.  
**Lesson:** **Systematische Validierung** ist überlegen zu "ad-hoc testing". Jeder Schritt baut auf vorherigem auf, Fehler werden früh erkannt.

### **10. E2E-TESTS ENTDECKEN PRODUKTIONS-BUGS, DIE UNIT-TESTS NICHT FINDEN**
**Erfahrung:** E2E-Test für Quetiapin entdeckte `category_id = null` Bug in Production (trotz korrekter lokaler DB).  
**Lesson:** **E2E-Tests mit Production-ähnlicher Umgebung** sind unerlässlich. Lokale Tests allein reichen nicht.

### **11. DOKUMENTATION WÄHREND DER ENTWICKLUNG IST EFFIZIENTER**
**Erfahrung:** Kontinuierliche Dokumentation (Reports nach jedem Schritt) war einfacher als "alles am Ende dokumentieren".  
**Lesson:** **Documentation-as-you-go** ist nachhaltiger. Jede Phase sollte eigenen Report haben (z.B. `MDI_CODE_CHANGES_V1_IMPLEMENTATION_REPORT.md`).

### **12. ROLLBACK-PLAN IST UNVERZICHTBAR FÜR PRODUKTIONS-DEPLOYMENTS**
**Erfahrung:** Obwohl nicht gebraucht, gab Rollback-Plan (10–15 Min.) Sicherheit für Go-Live-Entscheidung.  
**Lesson:** **Rollback-Plan VOR Deployment** ist Pflicht. Inkl. Cloudflare Dashboard-Workflow, Git-Checkout, D1-Schema-Revert, Post-Rollback-Checks.

---

## **CODE-QUALITÄT LEARNINGS**

### **13. BOOLEAN FIELDS > TEXT FIELDS FÜR CYP-DATEN**
**Erfahrung:** Alte Implementierung nutzte TEXT-Feld `cyp450_enzyme` ("CYP3A4, P-gp"), neue nutzt Boolean-Felder (`cyp3a4_substrate`, `cyp3a4_inhibitor`).  
**Lesson:** **Boolean-Felder** sind einfacher zu querien, weniger fehleranfällig, und ermöglichen klare MDI-Logik.

### **14. SEPARATION OF CONCERNS: CALCULATION ≠ PRESENTATION**
**Erfahrung:** Calculation-Logik (`src/index.tsx`) und PDF-Templates (`src/report_templates_doctor_v3.ts`) sind getrennt → einfacher zu maintainen.  
**Lesson:** **Klare Trennung** zwischen Business-Logic, Data-Layer und Presentation-Layer macht Code wartbar.

---

## **STAKEHOLDER-KOMMUNIKATION LEARNINGS**

### **15. EXECUTIVE SUMMARY IST ESSENTIELL FÜR NON-TECH STAKEHOLDER**
**Erfahrung:** Ärzte, Apotheker, Investoren brauchen KEINE technischen Details, sondern: "Was kann es? Was kann es nicht? Für wen ist es?"  
**Lesson:** **Executive Summary** (max. 15 Sätze) sollte bei jedem Release erstellt werden. Keine technischen Details, nur medizinische/praktische Infos.

### **16. MEDIZINISCHE ZUSAMMENFASSUNG ERHÖHT VERTRAUEN**
**Erfahrung:** Ärzte wollen wissen: "Welche Faktoren berücksichtigt es? Was muss ich separat prüfen?"  
**Lesson:** **Medizinische Summary mit Bulletpoints** ist effektiver als lange Texte. Klare Liste: "Berücksichtigt", "Nicht berücksichtigt", "Arzt muss prüfen".

---

## **SICHERHEITS-LEARNINGS**

### **17. KONSERVATIVE OBERGRENZEN SIND SICHERER ALS DURCHSCHNITTSWERTE**
**Erfahrung:** System berechnet **Obergrenzen** (konservativste Geschwindigkeit), nicht "optimale" oder "durchschnittliche" Geschwindigkeit.  
**Lesson:** **Obergrenzen-Tool-Konzept** ist medizinisch sicherer. Ärzte können langsamer gehen, aber nicht schneller (ohne explizite Begründung).

### **18. MULTIPLE SAFETY LAYERS VERHINDERN MEDIZINISCHE FEHLER**
**Erfahrung:** 7 PDF-Warnungen + Category-Limits + 2%-Floor + Narrow-Window-Check = Multiple Safety Layers.  
**Lesson:** **Defense-in-Depth** (mehrere Sicherheitsebenen) ist in medizinischer Software essentiell. Eine Ebene kann versagen, andere fangen Fehler auf.

---

## **ZUSAMMENFASSUNG**

Die Entwicklung von MEDLESS V1 zeigte, dass **systematische Validierung**, **evidenzbasierte Medizin** und **technische Sorgfalt** kombiniert werden müssen für produktionsreife medizinische Software. **Wichtigste Learnings:**

1. **Production DB separat validieren** (nicht nur lokal)
2. **Guidelines-basierte Category-Limits** sind nicht verhandelbar
3. **2%-Floor** balanciert Sicherheit und Praktikabilität
4. **Taper-Tail** braucht explizite Logik (v2)
5. **Pharmakodynamik-Disclaimer** ist obligatorisch
6. **8-Schritte-Validierung** ist erfolgreiches Framework
7. **E2E-Tests** finden Produktions-Bugs
8. **Documentation-as-you-go** ist effizienter
9. **Rollback-Plan** ist Pflicht
10. **Executive Summary** für Non-Tech Stakeholder
11. **Konservative Obergrenzen** sind sicherer
12. **Multiple Safety Layers** verhindern Fehler

**Diese Learnings fließen direkt in MEDLESS v2 Entwicklung ein.**

---

**STATUS:** 🟢 **LEARNINGS DOKUMENTIERT & READY FOR V2**
