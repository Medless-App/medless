// ============================================================
// CODE-SNIPPETS FÜR KOMPAKTES 2-SEITEN-PDF
// Diese Funktionen können direkt in downloadPDF() eingefügt werden
// ============================================================

// SNIPPET 1: Liniendiagramm zeichnen (Erfolgskurve)
// Einfügen nach dem Header (y ≈ 25)
function drawSuccessChart() {
  const chartX = margin;
  const chartY = y;
  const chartWidth = contentWidth;
  const chartHeight = 60;
  
  // Chart-Bereich
  doc.setDrawColor(...colors.tableBorder);
  doc.setLineWidth(0.5);
  doc.rect(chartX, chartY, chartWidth, chartHeight);
  
  // Titel
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.darkGray);
  doc.text('Die Erfolgskurve', chartX + 2, chartY + 6);
  
  // Berechne Start- und Endwerte
  const firstWeek = weeklyPlan[0];
  const lastWeek = weeklyPlan[weeklyPlan.length - 1];
  
  const medStart = firstWeek.medications[0]?.startMg || 400;
  const medEnd = lastWeek.medications[0]?.currentMg || 200;
  const cbdStart = firstWeek.actualCbdMg || 35;
  const cbdEnd = lastWeek.actualCbdMg || 87;
  
  // Max-Wert für Skalierung
  const maxValue = Math.max(medStart, cbdEnd, 500);
  const scaleY = (chartHeight - 20) / maxValue;
  
  // Zeichne Rasterlinien (horizontal)
  doc.setDrawColor(240, 240, 240);
  doc.setLineWidth(0.2);
  for (let i = 0; i <= 4; i++) {
    const gridY = chartY + 15 + (i * (chartHeight - 20) / 4);
    doc.line(chartX + 20, gridY, chartX + chartWidth - 5, gridY);
    
    // Y-Achsen-Labels
    const value = Math.round(maxValue - (i * maxValue / 4));
    doc.setFontSize(7);
    doc.setTextColor(...colors.lightGray);
    doc.text(`${value}mg`, chartX + 2, gridY + 1);
  }
  
  // Berechne Datenpunkte
  const dataPointSpacing = (chartWidth - 30) / (weeklyPlan.length - 1);
  const startX = chartX + 20;
  
  // Rote Linie (Medikamente - abfallend)
  doc.setDrawColor(...colors.red);
  doc.setLineWidth(1.5);
  weeklyPlan.forEach((week, idx) => {
    const x = startX + (idx * dataPointSpacing);
    const medValue = week.medications[0]?.currentMg || medStart - (idx * ((medStart - medEnd) / weeklyPlan.length));
    const y1 = chartY + 15 + ((maxValue - medValue) * scaleY);
    
    if (idx > 0) {
      const prevWeek = weeklyPlan[idx - 1];
      const prevMedValue = prevWeek.medications[0]?.currentMg || medStart - ((idx - 1) * ((medStart - medEnd) / weeklyPlan.length));
      const prevY = chartY + 15 + ((maxValue - prevMedValue) * scaleY);
      const prevX = startX + ((idx - 1) * dataPointSpacing);
      doc.line(prevX, prevY, x, y1);
    }
    
    // Datenpunkt
    doc.setFillColor(...colors.red);
    doc.circle(x, y1, 1.5, 'F');
  });
  
  // Grüne Linie (Cannabinoide - ansteigend)
  doc.setDrawColor(...colors.green);
  doc.setLineWidth(1.5);
  weeklyPlan.forEach((week, idx) => {
    const x = startX + (idx * dataPointSpacing);
    const cbdValue = week.actualCbdMg || cbdStart + (idx * ((cbdEnd - cbdStart) / weeklyPlan.length));
    const y1 = chartY + 15 + ((maxValue - cbdValue) * scaleY);
    
    if (idx > 0) {
      const prevWeek = weeklyPlan[idx - 1];
      const prevCbdValue = prevWeek.actualCbdMg || cbdStart + ((idx - 1) * ((cbdEnd - cbdStart) / weeklyPlan.length));
      const prevY = chartY + 15 + ((maxValue - prevCbdValue) * scaleY);
      const prevX = startX + ((idx - 1) * dataPointSpacing);
      doc.line(prevX, prevY, x, y1);
    }
    
    // Datenpunkt
    doc.setFillColor(...colors.green);
    doc.circle(x, y1, 1.5, 'F');
  });
  
  // X-Achsen-Labels (Wochen)
  doc.setFontSize(7);
  doc.setTextColor(...colors.mediumGray);
  weeklyPlan.forEach((week, idx) => {
    const x = startX + (idx * dataPointSpacing);
    doc.text(`W${idx + 1}`, x - 3, chartY + chartHeight - 2);
  });
  
  // Legende
  const legendY = chartY + chartHeight - 6;
  // Rot
  doc.setFillColor(...colors.red);
  doc.rect(chartX + chartWidth - 90, legendY - 2, 8, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...colors.darkGray);
  doc.text('Medikamente', chartX + chartWidth - 80, legendY);
  
  // Grün
  doc.setFillColor(...colors.green);
  doc.rect(chartX + chartWidth - 35, legendY - 2, 8, 2, 'F');
  doc.text('Cannabinoide', chartX + chartWidth - 25, legendY);
  
  y += chartHeight + 8;
}

// SNIPPET 2: Einkaufsliste (Kostenbox)
// Einfügen nach dem Chart (y ≈ 95)
function drawCostBox() {
  const boxHeight = 25;
  
  // Box-Hintergrund
  doc.setFillColor(...colors.lightMint);
  doc.setDrawColor(...colors.mint);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, boxHeight, 'FD');
  
  // Titel
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('💰 Therapie-Bedarf', margin + 3, y + 6);
  
  // Produktliste
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.darkGray);
  
  if (costs && costs.costBreakdown) {
    const products = costs.costBreakdown.map(item => item.product).join(' + ');
    doc.text(`Sie benötigen: ${products}`, margin + 3, y + 13);
    
    const totalCost = costs.totalCost.toFixed(2);
    const weeklyAvg = (costs.totalCost / weeklyPlan.length).toFixed(2);
    doc.setFont(undefined, 'bold');
    doc.text(`Gesamtkosten: ${totalCost} €`, margin + 3, y + 19);
    doc.setFont(undefined, 'normal');
    doc.text(`(ca. ${weeklyAvg} € / Woche)`, margin + 45, y + 19);
  }
  
  y += boxHeight + 8;
}

// SNIPPET 3: Kompakte Medikationstabelle (Seite 1)
// Einfügen nach der Kostenbox (y ≈ 130)
function drawCompactMedicationTable() {
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('Aktuelle Medikation & Wechselwirkungen', margin, y);
  y += 7;
  
  if (analysis && analysis.length > 0) {
    const med = analysis[0]; // Nur erste Medikation
    const rowHeight = 8;
    const col1 = contentWidth * 0.4;
    const col2 = contentWidth * 0.25;
    const col3 = contentWidth * 0.35;
    
    // Header
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin, y, col1, rowHeight, 'F');
    doc.rect(margin + col1, y, col2, rowHeight, 'F');
    doc.rect(margin + col1 + col2, y, col3, rowHeight, 'F');
    
    doc.setDrawColor(...colors.tableBorder);
    doc.rect(margin, y, contentWidth, rowHeight);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkGray);
    doc.text('Medikament', margin + 2, y + 5);
    doc.text('Dosis', margin + col1 + 2, y + 5);
    doc.text('Wechselwirkung', margin + col1 + col2 + 2, y + 5);
    
    y += rowHeight;
    
    // Data Row
    doc.setFont(undefined, 'normal');
    const medName = med.medication.name || 'Unbekannt';
    const dosage = med.mgPerDay ? `${med.mgPerDay} mg/Tag` : '-';
    
    doc.rect(margin, y, contentWidth, rowHeight);
    doc.text(medName, margin + 2, y + 5);
    doc.text(dosage, margin + col1 + 2, y + 5);
    
    // Wechselwirkung
    if (med.interactions && med.interactions.length > 0) {
      const severity = med.interactions[0].severity;
      if (severity === 'critical' || severity === 'high') {
        doc.setTextColor(...colors.warningOrange);
        doc.setFont(undefined, 'bold');
      } else {
        doc.setTextColor(...colors.mediumGray);
      }
      doc.text('⚠️ Verstärkung möglich', margin + col1 + col2 + 2, y + 5);
    } else {
      doc.setTextColor(...colors.lightGray);
      doc.text('Keine bekannt', margin + col1 + col2 + 2, y + 5);
    }
    
    y += rowHeight + 2;
  }
}

// SNIPPET 4: Große 8-Wochen-Tabelle (Seite 2)
// Auf neuer Seite (doc.addPage())
function drawWeeklyPlanTable() {
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('Der Fahrplan', margin, y);
  y += 10;
  
  // Tabellen-Spaltenbreiten
  const colW = contentWidth / 5;
  const rowH = 8;
  
  // Header Row
  doc.setFillColor(...colors.tableHeader);
  doc.rect(margin, y, contentWidth, rowH, 'F');
  doc.setDrawColor(...colors.tableBorder);
  doc.rect(margin, y, contentWidth, rowH);
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.darkGray);
  doc.text('Woche', margin + 2, y + 5);
  doc.text('Medikament', margin + colW + 2, y + 5);
  doc.text('MedLess-Support', margin + colW * 2 + 2, y + 5);
  doc.text('Verbrauch', margin + colW * 3 + 2, y + 5);
  doc.text('Check', margin + colW * 4 + 2, y + 5);
  
  y += rowH;
  
  // Data Rows
  weeklyPlan.forEach((week, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, rowH, 'F');
    }
    
    doc.setDrawColor(...colors.tableBorder);
    doc.rect(margin, y, contentWidth, rowH);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.darkGray);
    
    // Woche
    doc.text(`${week.week}`, margin + 4, y + 5);
    
    // Medikament
    const med = week.medications[0];
    if (med) {
      const change = med.reduction ? `-${med.reduction}` : '';
      doc.text(`${med.name} ${med.currentMg}mg`, margin + colW + 2, y + 5);
      if (change) {
        doc.setFont(undefined, 'bold');
        doc.text(change, margin + colW + 35, y + 5);
        doc.setFont(undefined, 'normal');
      }
    }
    
    // MedLess-Support
    const product = week.kannasanProduct.name.replace('MedLess Nr. ', 'Nr. ');
    const application = `${week.morningSprays}-0-${week.eveningSprays}`;
    doc.text(`${product}: ${application}`, margin + colW * 2 + 2, y + 5);
    
    // Verbrauch
    if (week.bottleStatus && week.bottleStatus.productChangeNext) {
      doc.setTextColor(...colors.warningOrange);
      doc.setFont(undefined, 'bold');
      doc.text('⚠️ Wechsel', margin + colW * 3 + 2, y + 5);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkGray);
    } else {
      doc.text('-', margin + colW * 3 + 4, y + 5);
    }
    
    // Checkbox
    doc.rect(margin + colW * 4 + 8, y + 2, 4, 4);
    
    y += rowH;
  });
  
  y += 5;
}

// SNIPPET 5: Footer mit Hinweisen (Seite 2 unten)
// Am Ende von Seite 2
function drawFooterHints() {
  // Box für Hinweise
  const footerY = pageHeight - 50;
  y = footerY;
  
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(...colors.tableBorder);
  doc.rect(margin, y, contentWidth, 40, 'FD');
  
  // Titel
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.darkGray);
  doc.text('Wichtige Hinweise', margin + 2, y + 5);
  
  // Hinweise (kompakt)
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.mediumGray);
  const hints = [
    '• CYP450-Interaktionen beachten   • Kein Alkohol, keine Grapefruit',
    '• Niemals eigenständig absetzen   • Bei Nebenwirkungen Arzt kontaktieren',
    '• Dieser Plan zeigt theoretische Möglichkeiten – Umsetzung nur unter ärztlicher Aufsicht'
  ];
  
  hints.forEach((hint, idx) => {
    doc.text(hint, margin + 2, y + 10 + (idx * 4));
  });
  
  // Unterschriftsfeld
  y += 25;
  doc.setFontSize(8);
  doc.setTextColor(...colors.darkGray);
  doc.text('Stempel/Unterschrift Arzt:', margin + 2, y);
  doc.setLineWidth(0.3);
  doc.line(margin + 45, y, margin + contentWidth - 2, y);
}

// ============================================================
// VERWENDUNG IN downloadPDF():
// ============================================================

// Nach den Helper-Funktionen und colors-Definition:

// SEITE 1
drawSuccessChart();
drawCostBox();
drawCompactMedicationTable();
addFooter(1);

// SEITE 2
doc.addPage();
y = margin;
addLogo(pageWidth - 40, y + 3);
y += 12;

drawWeeklyPlanTable();
drawFooterHints();
addFooter(2);

// Dann: doc.save(filename);
