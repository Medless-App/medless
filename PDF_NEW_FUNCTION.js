// ============================================================
// KOMPAKTE 2-SEITEN-PDF FUNKTION - READY TO USE
// ============================================================
// 
// ANLEITUNG:
// 1. Kopiere diese gesamte Funktion
// 2. Ersetze die alte downloadPDF() in public/static/app.js (Zeile 2007-2639)
// 3. Teste mit: npm run build && npm run deploy
//
// FEATURES:
// - SEITE 1: Dashboard mit Erfolgskurve, Kostenbox, Patientendaten
// - SEITE 2: Eine große Tabelle für alle 8 Wochen + Unterschriftsfeld
// - Farben: Waldgrün (#0F5A46) + Mintgrün (#1DB98D)
// - Maximal 2 Seiten, kompakt, professionell
//
// ============================================================

function downloadPDF(event) {
  // Prevent default
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!window.currentPlanData) {
    alert('Keine Daten vorhanden. Bitte erstellen Sie erst einen Reduktionsplan.');
    return;
  }
  
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF-Bibliothek wird geladen... Bitte versuchen Sie es in einigen Sekunden erneut.');
    return;
  }
  
  const button = event?.target?.closest('button');
  const originalButtonHTML = button?.innerHTML || '<i class="fas fa-file-pdf"></i> <span>Plan als PDF herunterladen</span>';
  
  try {
    console.log('🎯 PDF-Generierung gestartet (Kompaktes 2-Seiten-Layout)...');
    
    // Show loading
    if (button) {
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>PDF wird erstellt...</span>';
      button.disabled = true;
    }
    
    const { jsPDF } = window.jspdf;
    const { analysis, weeklyPlan, firstName, gender, personalization, costs, product } = window.currentPlanData;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    
    // COLORS (MEDLESS Brand)
    const colors = {
      primary: [15, 90, 70],          // Waldgrün #0F5A46
      mint: [29, 185, 141],           // Mintgrün #1DB98D
      lightMint: [209, 250, 229],     // Helles Mintgrün #D1FAE5
      darkGray: [31, 41, 55],         // Dunkles Grau #1F2937
      mediumGray: [107, 114, 128],    // Mittleres Grau #6B7280
      lightGray: [156, 163, 175],     // Helles Grau #9CA3AF
      tableBorder: [229, 231, 235],   // Tabellen-Border #E5E7EB
      tableHeader: [249, 250, 251],   // Tabellen-Header #F9FAFB
      red: [220, 38, 38],             // Rot für Medikamente #DC2626
      green: [29, 185, 141],          // Grün für Cannabinoide #1DB98D
      warningOrange: [245, 158, 11]   // Orange für Warnungen
    };
    
    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    
    // Kompaktes Logo
    const addLogo = (xPos, yPos) => {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('Med', xPos, yPos);
      doc.setTextColor(...colors.mint);
      doc.text('Less', xPos + 10, yPos);
      doc.text('.', xPos + 22, yPos);
      
      doc.setFontSize(7);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.mediumGray);
      doc.text('weniger Medikamente, mehr Leben', xPos, yPos + 4);
    };
    
    // Footer
    const addFooter = (pageNum) => {
      doc.setFontSize(7);
      doc.setTextColor(...colors.lightGray);
      doc.text('© 2025 MEDLESS – Dieser Plan ersetzt keine ärztliche Entscheidung', margin, pageHeight - 8);
      doc.text(`Seite ${pageNum} von 2`, pageWidth - margin - 15, pageHeight - 8);
    };
    
    // ============================================================
    // SEITE 1: THERAPIE-COCKPIT
    // ============================================================
    
    // HEADER: Patientendaten (Links) + Logo/Datum (Rechts)
    y = margin;
    
    // Links: Patientendaten
    doc.setFontSize(9);
    doc.setTextColor(...colors.darkGray);
    doc.setFont(undefined, 'bold');
    let patientInfo = `${firstName || 'Patient'}`;
    if (personalization?.age) patientInfo += `, ${personalization.age} Jahre`;
    if (personalization?.height) patientInfo += `, ${personalization.height}cm`;
    if (personalization?.weight) patientInfo += `, ${personalization.weight}kg`;
    if (personalization?.bmi) patientInfo += `, BMI ${personalization.bmi.toFixed(1)}`;
    doc.text(patientInfo, margin, y + 3);
    
    // Rechts: Logo + Datum
    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    addLogo(pageWidth - 40, y + 3);
    doc.setFontSize(8);
    doc.setTextColor(...colors.mediumGray);
    doc.setFont(undefined, 'normal');
    doc.text(today, pageWidth - margin, y + 3, { align: 'right' });
    
    y += 12;
    
    // Trennlinie
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // ============================================================
    // ERFOLGSKURVE (Liniendiagramm)
    // ============================================================
    
    const chartX = margin;
    const chartY = y;
    const chartWidth = contentWidth;
    const chartHeight = 65;
    
    // Titel
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Die Erfolgskurve', chartX, chartY + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    doc.text('So verändert sich Ihre Medikamentenlast über 8 Wochen', chartX, chartY + 10);
    
    y = chartY + 15;
    
    // Chart-Bereich Border
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.rect(chartX, y, chartWidth, chartHeight - 15);
    
    // Berechne Werte
    const firstWeek = weeklyPlan[0];
    const lastWeek = weeklyPlan[weeklyPlan.length - 1];
    
    const medStart = firstWeek.medications[0]?.startMg || firstWeek.medications[0]?.currentMg || 400;
    const medEnd = lastWeek.medications[0]?.currentMg || 200;
    const cbdStart = firstWeek.actualCbdMg || 35;
    const cbdEnd = lastWeek.actualCbdMg || 87;
    
    // Skalierung
    const maxValue = Math.max(medStart, cbdEnd, 500);
    const minValue = 0;
    const scaleY = (chartHeight - 30) / maxValue;
    const dataPointSpacing = (chartWidth - 30) / (weeklyPlan.length - 1);
    const startX = chartX + 15;
    const baseY = y + (chartHeight - 20);
    
    // Rasterlinien (horizontal)
    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const gridY = y + 5 + (i * (chartHeight - 25) / 4);
      doc.line(startX, gridY, chartX + chartWidth - 5, gridY);
      
      // Y-Achsen-Labels
      const value = Math.round(maxValue - (i * maxValue / 4));
      doc.setFontSize(6);
      doc.setTextColor(...colors.lightGray);
      doc.setFont(undefined, 'normal');
      doc.text(`${value}`, chartX + 2, gridY + 1);
    }
    
    // ROTE LINIE (Medikamente - abfallend)
    doc.setDrawColor(...colors.red);
    doc.setLineWidth(1.2);
    for (let idx = 0; idx < weeklyPlan.length; idx++) {
      const week = weeklyPlan[idx];
      const x = startX + (idx * dataPointSpacing);
      const medValue = week.medications[0]?.currentMg || (medStart - (idx * ((medStart - medEnd) / weeklyPlan.length)));
      const yPos = baseY - (medValue * scaleY);
      
      if (idx > 0) {
        const prevWeek = weeklyPlan[idx - 1];
        const prevMedValue = prevWeek.medications[0]?.currentMg || (medStart - ((idx - 1) * ((medStart - medEnd) / weeklyPlan.length)));
        const prevY = baseY - (prevMedValue * scaleY);
        const prevX = startX + ((idx - 1) * dataPointSpacing);
        doc.line(prevX, prevY, x, yPos);
      }
      
      // Datenpunkt
      doc.setFillColor(...colors.red);
      doc.circle(x, yPos, 1.2, 'F');
    }
    
    // GRÜNE LINIE (Cannabinoide - ansteigend)
    doc.setDrawColor(...colors.green);
    doc.setLineWidth(1.2);
    for (let idx = 0; idx < weeklyPlan.length; idx++) {
      const week = weeklyPlan[idx];
      const x = startX + (idx * dataPointSpacing);
      const cbdValue = week.actualCbdMg || (cbdStart + (idx * ((cbdEnd - cbdStart) / weeklyPlan.length)));
      const yPos = baseY - (cbdValue * scaleY);
      
      if (idx > 0) {
        const prevWeek = weeklyPlan[idx - 1];
        const prevCbdValue = prevWeek.actualCbdMg || (cbdStart + ((idx - 1) * ((cbdEnd - cbdStart) / weeklyPlan.length)));
        const prevY = baseY - (prevCbdValue * scaleY);
        const prevX = startX + ((idx - 1) * dataPointSpacing);
        doc.line(prevX, prevY, x, yPos);
      }
      
      // Datenpunkt
      doc.setFillColor(...colors.green);
      doc.circle(x, yPos, 1.2, 'F');
    }
    
    // X-Achsen-Labels (Wochen)
    doc.setFontSize(7);
    doc.setTextColor(...colors.mediumGray);
    doc.setFont(undefined, 'normal');
    weeklyPlan.forEach((week, idx) => {
      const x = startX + (idx * dataPointSpacing);
      doc.text(`W${idx + 1}`, x - 3, baseY + 5);
    });
    
    // Legende
    const legendY = baseY + 9;
    const legendX = chartX + chartWidth - 95;
    
    // Rot (Medikamente)
    doc.setFillColor(...colors.red);
    doc.rect(legendX, legendY - 2, 8, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkGray);
    doc.setFont(undefined, 'normal');
    doc.text('Medikamente', legendX + 10, legendY);
    
    // Grün (Cannabinoide)
    doc.setFillColor(...colors.green);
    doc.rect(legendX + 45, legendY - 2, 8, 2, 'F');
    doc.text('Cannabinoide', legendX + 55, legendY);
    
    y = chartY + chartHeight + 5;
    
    // ============================================================
    // EINKAUFSLISTE (Kostenbox)
    // ============================================================
    
    const boxHeight = 28;
    
    // Box-Hintergrund
    doc.setFillColor(...colors.lightMint);
    doc.setDrawColor(...colors.mint);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, boxHeight, 'FD');
    
    // Titel
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('💰 Benötigtes Material & Kosten', margin + 3, y + 6);
    
    // Produktliste
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.darkGray);
    
    if (costs && costs.costBreakdown) {
      const products = costs.costBreakdown.map(item => {
        const productName = item.product.replace('MedLess Nr. ', 'Nr. ');
        return `${item.bottleCount}× ${productName}`;
      }).join(' + ');
      doc.text(`Sie benötigen: ${products}`, margin + 3, y + 13);
      
      const totalCost = costs.totalCost.toFixed(2);
      const weeklyAvg = (costs.totalCost / weeklyPlan.length).toFixed(2);
      doc.setFont(undefined, 'bold');
      doc.text(`Gesamtkosten: ${totalCost} €`, margin + 3, y + 19);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.mediumGray);
      doc.text(`(Durchschnitt: ${weeklyAvg} € pro Woche)`, margin + 45, y + 19);
    }
    
    y += boxHeight + 8;
    
    // ============================================================
    // AKTUELLE MEDIKATION (Kompakt)
    // ============================================================
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Ihre aktuelle Medikation', margin, y);
    y += 7;
    
    if (analysis && analysis.length > 0) {
      const med = analysis[0];
      const rowHeight = 8;
      const col1W = contentWidth * 0.45;
      const col2W = contentWidth * 0.25;
      const col3W = contentWidth * 0.30;
      
      // Header
      doc.setFillColor(...colors.tableHeader);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(...colors.tableBorder);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, contentWidth, rowHeight);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.darkGray);
      doc.text('Medikament', margin + 2, y + 5);
      doc.text('Dosis', margin + col1W + 2, y + 5);
      doc.text('Wechselwirkung', margin + col1W + col2W + 2, y + 5);
      
      y += rowHeight;
      
      // Data Row
      doc.rect(margin, y, contentWidth, rowHeight);
      doc.setFont(undefined, 'normal');
      
      const medName = med.medication.name || 'Unbekannt';
      const dosage = med.mgPerDay ? `${med.mgPerDay} mg/Tag` : '-';
      
      doc.text(medName, margin + 2, y + 5);
      doc.text(dosage, margin + col1W + 2, y + 5);
      
      // Wechselwirkung
      if (med.interactions && med.interactions.length > 0) {
        const severity = med.interactions[0].severity;
        if (severity === 'critical' || severity === 'high') {
          doc.setTextColor(...colors.warningOrange);
          doc.setFont(undefined, 'bold');
          doc.text('⚠️ Verstärkung möglich', margin + col1W + col2W + 2, y + 5);
        } else {
          doc.setTextColor(...colors.mediumGray);
          doc.setFont(undefined, 'normal');
          doc.text('Leicht', margin + col1W + col2W + 2, y + 5);
        }
      } else {
        doc.setTextColor(...colors.lightGray);
        doc.text('Keine bekannt', margin + col1W + col2W + 2, y + 5);
      }
      
      y += rowHeight;
    }
    
    // Footer Seite 1
    addFooter(1);
    
    // ============================================================
    // SEITE 2: DER FAHRPLAN
    // ============================================================
    
    doc.addPage();
    y = margin;
    
    // Logo
    addLogo(pageWidth - 40, y + 3);
    y += 15;
    
    // Titel
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Der Fahrplan', margin, y);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    doc.text('Ihr 8-Wochen-Reduktionsplan – bitte mit Ihrem Arzt abstimmen', margin, y + 5);
    
    y += 12;
    
    // ============================================================
    // GROSSE 8-WOCHEN-TABELLE
    // ============================================================
    
    const colW1 = 15;  // Woche
    const colW2 = 45;  // Medikament
    const colW3 = 50;  // MedLess-Support
    const colW4 = 40;  // Verbrauch
    const colW5 = 15;  // Check
    const rowH = 9;
    
    // Header Row
    doc.setFillColor(...colors.tableHeader);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowH);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkGray);
    
    let xPos = margin;
    doc.text('Wo.', xPos + 3, y + 6);
    xPos += colW1;
    doc.text('Medikament (Dosis)', xPos + 2, y + 6);
    xPos += colW2;
    doc.text('MedLess-Support', xPos + 2, y + 6);
    xPos += colW3;
    doc.text('Verbrauch', xPos + 2, y + 6);
    xPos += colW4;
    doc.text('✓', xPos + 5, y + 6);
    
    y += rowH;
    
    // Data Rows (8 Wochen)
    weeklyPlan.forEach((week, idx) => {
      const isEven = idx % 2 === 0;
      
      // Alternierende Zeilen
      if (isEven) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, y, contentWidth, rowH, 'F');
      }
      
      doc.setDrawColor(...colors.tableBorder);
      doc.rect(margin, y, contentWidth, rowH);
      
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.darkGray);
      
      xPos = margin;
      
      // Woche
      doc.text(`${week.week}`, xPos + 5, y + 6);
      xPos += colW1;
      
      // Medikament
      const med = week.medications[0];
      if (med) {
        const medText = `${med.name.substring(0, 12)} ${med.currentMg}mg`;
        doc.text(medText, xPos + 2, y + 6);
        
        // Änderung (fett)
        if (med.reduction && med.reduction > 0) {
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...colors.red);
          doc.text(`-${med.reduction}`, xPos + 35, y + 6);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...colors.darkGray);
        }
      }
      xPos += colW2;
      
      // MedLess-Support
      const product = week.kannasanProduct.name.replace('MedLess ', '');
      const application = `${week.morningSprays}-0-${week.eveningSprays}`;
      doc.text(`${product}: ${application}`, xPos + 2, y + 6);
      xPos += colW3;
      
      // Verbrauch
      if (week.bottleStatus && week.bottleStatus.productChangeNext) {
        doc.setTextColor(...colors.warningOrange);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(7);
        doc.text('⚠️ Wechsel', xPos + 2, y + 6);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...colors.darkGray);
      } else {
        doc.text('-', xPos + 8, y + 6);
      }
      xPos += colW4;
      
      // Checkbox
      doc.setLineWidth(0.3);
      doc.rect(xPos + 5, y + 2, 4, 4);
      
      y += rowH;
    });
    
    y += 8;
    
    // ============================================================
    // FOOTER MIT HINWEISEN
    // ============================================================
    
    // Hinweise-Box
    const hinweisBoxY = pageHeight - 60;
    y = hinweisBoxY;
    
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...colors.tableBorder);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 42, 'FD');
    
    // Titel
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.darkGray);
    doc.text('⚠️ Wichtige Hinweise', margin + 2, y + 5);
    
    // Hinweise (kompakt)
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.mediumGray);
    
    const hints = [
      '• CYP450-Interaktionen beachten  • Kein Alkohol, keine Grapefruit  • Niemals eigenständig absetzen',
      '• Bei Nebenwirkungen sofort Arzt kontaktieren  • Dieser Plan zeigt theoretische Möglichkeiten',
      '• Die Umsetzung erfolgt ausschließlich unter ärztlicher Aufsicht und Verantwortung'
    ];
    
    hints.forEach((hint, idx) => {
      doc.text(hint, margin + 2, y + 11 + (idx * 4));
    });
    
    // Unterschriftsfeld
    y += 28;
    doc.setFontSize(8);
    doc.setTextColor(...colors.darkGray);
    doc.setFont(undefined, 'normal');
    doc.text('Stempel/Unterschrift Arzt:', margin + 2, y);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...colors.tableBorder);
    doc.line(margin + 42, y, pageWidth - margin - 2, y);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.lightGray);
    doc.text('Datum:', pageWidth - margin - 30, y + 5);
    doc.line(pageWidth - margin - 22, y + 5, pageWidth - margin - 2, y + 5);
    
    // Footer Seite 2
    addFooter(2);
    
    // ============================================================
    // SAVE PDF
    // ============================================================
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `MedLess_Plan_${firstName || 'Patient'}_${date}.pdf`;
    
    console.log('💾 Speichere PDF:', filename);
    doc.save(filename);
    
    console.log('✅ PDF erfolgreich erstellt (2 Seiten)!');
    
    // Reset button
    if (button) {
      button.innerHTML = originalButtonHTML;
      button.disabled = false;
    }
    
  } catch (error) {
    console.error('❌ PDF-Fehler:', error);
    alert(`Fehler beim Erstellen des PDFs:\n\n${error.message || 'Unbekannter Fehler'}\n\nBitte kontaktieren Sie den Support.`);
    
    // Reset button
    if (button) {
      button.innerHTML = originalButtonHTML;
      button.disabled = false;
    }
  }
}

// ============================================================
// ENDE DER FUNKTION
// ============================================================
//
// NÄCHSTER SCHRITT:
// 1. Kopiere diese komplette Funktion (Zeile 23 bis 490)
// 2. Öffne public/static/app.js
// 3. Suche nach "function downloadPDF(event) {" (ca. Zeile 2007)
// 4. Ersetze die GESAMTE alte Funktion (bis Zeile 2639) mit dieser neuen
// 5. Speichern
// 6. Build: npm run build
// 7. Deploy: npx wrangler pages deploy dist --project-name medless
// 8. Teste: Formular ausfüllen → PDF herunterladen
//
// FEATURES DER NEUEN PDF:
// ✅ SEITE 1: Dashboard mit Erfolgskurve, Kostenbox, Medikation
// ✅ SEITE 2: Eine große Tabelle für 8 Wochen + Unterschriftsfeld
// ✅ Kompakt: Max. 2 Seiten
// ✅ Farben: Waldgrün + Mintgrün
// ✅ Professionell: Vektorgrafiken, saubere Typographie
// ✅ Praxistauglich: Unterschriftsfeld, Checkboxen, Hinweise
//
// ============================================================
