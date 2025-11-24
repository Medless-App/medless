# 📄 KOMPAKTES 2-SEITEN-PDF - IMPLEMENTIERUNGSPLAN

## 🎯 ZIEL
Aktuelle 3+ Seiten PDF auf **max. 2 Seiten** reduzieren mit modernem Layout.

---

## 📋 SEITE 1: THERAPIE-COCKPIT

### ✅ Header (bereits implementiert)
- [x] Links: Patientendaten (Name, Alter, Größe, Gewicht, BMI)
- [x] Rechts: MedLess Logo + Datum

### 🚧 ERFOLGSKURVE (Liniendiagramm) - TODO
**Position:** y=25, Höhe: 60mm
- Rote Linie: Medikamentenlast (Start → Ende)
- Grüne Linie: Cannabinoid-Unterstützung (Start → Ende)
- X-Achse: Wochen 1-8
- Y-Achse: mg/Tag
- Legende: Rot "Medikamente", Grün "Cannabinoide"

### 🚧 EINKAUFSLISTE (Kostenbox) - TODO
**Position:** y=90, Höhe: 25mm
- Überschrift: "Therapie-Bedarf"
- Text: "Sie benötigen: 1x MedLess Nr. 15 + 1x MedLess Nr. 25"
- Kosten: "Gesamtkosten: 159,80 € (ca. 19,98 € / Woche)"
- Hintergrund: Helles Mintgrün (#D1FAE5)

### 🚧 AKTUELLE MEDIKATION - TODO
**Position:** y=120, Höhe: 30mm
- Tabelle: Medikament | Dosis | Wechselwirkung
- 1-2 Zeilen (kompakt)
- Falls Wechselwirkung: Orange Warnung

---

## 📋 SEITE 2: DER FAHRPLAN

### 🚧 GROSSE FAHRPLAN-TABELLE - TODO
**Eine Tabelle für alle 8 Wochen:**

**Spalten:**
1. **Woche** (1-8)
2. **Medikament** (z.B. "Ibuprofen 375 mg **-25 mg**")
3. **MedLess-Support** (z.B. "Nr. 15: 1-0-2")
4. **Verbrauch** (z.B. "⚠️ Wechsel auf Nr. 25" in Woche 5)
5. **Check** (Leere Checkbox [  ])

**Design:**
- Kompakte Zeilen (Höhe: 8mm)
- Alternierende Zeilen (weiß/hellgrau)
- Fett: Dosisänderungen
- Orange: Produktwechsel

### 🚧 FOOTER MIT HINWEISEN - TODO
**Position:** Unterste 40mm der Seite
- Kleine Schrift (7pt)
- Graue Farbe (#9CA3AF)
- Hinweise:
  - "CYP450-Interaktionen beachten"
  - "Kein Alkohol, keine Grapefruit"
  - "Niemals eigenständig absetzen"
  - "Bei Nebenwirkungen Arzt kontaktieren"
- Unterschriftsfeld: "Stempel/Unterschrift Arzt: ___________"

---

## 🔧 BENÖTIGTE DATEN

Aus `window.currentPlanData`:
- `firstName`, `personalization` (age, height, weight, bmi)
- `analysis[0]` (erste Medikation für Tabelle)
- `weeklyPlan` (Array mit 8 Wochen)
  - `week.medications[0]` (Medikament-Info)
  - `week.actualCbdMg` (CBD-Dosis)
  - `week.kannasanProduct.name` (Produktname)
  - `week.morningSprays`, `week.eveningSprays` (Anwendung)
  - `week.bottleStatus` (Verbrauchsinfo)
- `costs.totalCost`, `costs.costBreakdown` (Kosteninfo)

---

## 📝 CODE-STRUKTUR

```javascript
// Bereits vorhanden:
- colors (angepasst)
- addLogo() (kompakt)
- addFooter(pageNum) (einfach)

// NEU hinzuzufügen:
1. drawChart() - Liniendiagramm zeichnen
2. drawCostBox() - Einkaufsliste Box
3. drawMedicationTable() - Kompakte Medikations-Tabelle
4. drawWeeklyPlanTable() - Die große 8-Wochen-Tabelle
5. drawFooterHinweise() - Footer mit Hinweisen + Unterschrift
```

---

## ✅ NÄCHSTE SCHRITTE

1. **Liniendiagramm erstellen** (drawChart)
2. **Einkaufsliste-Box** (drawCostBox)
3. **Medikations-Tabelle** (Seite 1 komplett)
4. **8-Wochen-Tabelle** (Seite 2 Hauptteil)
5. **Footer mit Hinweisen** (Seite 2 unten)
6. **Testen & Feinschliff**

---

## 🎨 DESIGN-PRINZIPIEN

- **Kompakt:** Max. 2 Seiten, keine Verschwendung
- **Visuell:** Liniendiagramm zeigt sofort den Erfolg
- **Praktisch:** "Einkaufsliste" für Patientenentscheidung
- **Übersichtlich:** Eine große Tabelle statt 8 Blöcke
- **Professionell:** Unterschriftsfeld für Arzt

Dieses Layout ist **arzt- und patientenfreundlich** und erfüllt alle rechtlichen Anforderungen.
