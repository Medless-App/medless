# 🔥 MEDLESS PDF-API - Setup-Anleitung

## ✅ **Was wurde implementiert:**

Die MEDLESS-Plattform nutzt jetzt **serverseitige PDF-Generierung** mit PDFShift.io für 100% konsistente PDFs auf allen Geräten.

---

## 📋 **KRITISCH: PDFShift API-Key einrichten**

**OHNE diesen Schritt funktioniert die PDF-Generierung NICHT!**

### **Schritt 1: PDFShift Account erstellen**
1. Gehe zu: https://pdfshift.io/register
2. Erstelle einen kostenlosen Account (250 PDFs/Monat gratis)
3. Nach der Registrierung findest du deinen API-Key im Dashboard

### **Schritt 2: API-Key als Cloudflare Secret setzen**
```bash
cd /home/user/webapp
npx wrangler secret put PDFSHIFT_API_KEY
# Gib deinen PDFShift API-Key ein, wenn aufgefordert
```

### **Schritt 3: Verifizierung**
Nach dem Setup kannst du testen:
```bash
curl -X POST "https://medless.pages.dev/api/pdf/patient?example=true" --output test-patient.pdf
curl -X POST "https://medless.pages.dev/api/pdf/doctor?example=true" --output test-doctor.pdf
```

---

## 🎯 **Neue API-Endpunkte**

### **1. POST /api/pdf/patient**
Generiert Patientenbericht als PDF

**Test mit Beispieldaten:**
```bash
curl -X POST "https://medless.pages.dev/api/pdf/patient?example=true" \
  --output "Dein_persoenlicher_MEDLESS-Plan.pdf"
```

**Mit echten Daten:**
```bash
curl -X POST "https://medless.pages.dev/api/pdf/patient" \
  -H "Content-Type: application/json" \
  -d '{"analysis": {...}}' \
  --output "patient-report.pdf"
```

### **2. POST /api/pdf/doctor**
Generiert Arztbericht als PDF

**Test mit Beispieldaten:**
```bash
curl -X POST "https://medless.pages.dev/api/pdf/doctor?example=true" \
  --output "MEDLESS-Reduktionsplan_Aerztliche_Dokumentation.pdf"
```

**Mit echten Daten:**
```bash
curl -X POST "https://medless.pages.dev/api/pdf/doctor" \
  -H "Content-Type: application/json" \
  -d '{"analysis": {...}}' \
  --output "doctor-report.pdf"
```

---

## 🔧 **Technische Details**

### **PDF-Service: PDFShift.io**
- **API-Endpoint:** `https://api.pdfshift.io/v3/convert/pdf`
- **Authentication:** Basic Auth (API-Key + leeres Passwort)
- **Kosten:** 
  - 250 PDFs/Monat: Kostenlos
  - Danach: ~$0.02 pro PDF
  - Keine Abo-Pflicht

### **PDF-Rendering-Optionen:**
```json
{
  "format": "A4",
  "margin": "20mm 20mm 20mm 20mm",
  "print_background": true,
  "scale": 1.0,
  "prefer_css_page_size": false,
  "viewport": {
    "width": 794,
    "height": 1123
  }
}
```

### **Verwendete HTML-Templates:**
- **Patientenbericht:** `renderPatientReportHtmlFixed()` aus `src/report_templates_patient.ts`
- **Arztbericht:** `renderDoctorReportHtmlFixed()` aus `src/report_templates.ts`

**Diese Templates sind BYTEGENAU identisch mit:**
- https://medless.pages.dev/test/patient-report
- https://medless.pages.dev/test/doctor-report

---

## ✅ **Konsistenz-Garantien**

### **Was garantiert wird:**
✅ **Identisches Rendering** auf allen Geräten (Desktop, iOS, Android)  
✅ **Keine Device-Detection** - alle Clients nutzen denselben API-Endpunkt  
✅ **Keine User-Agent-Logik** - kein unterschiedliches Verhalten nach Browser  
✅ **Serverseitiges Rendering** - Chromium-basiert, konsistent  
✅ **Cache-Control: no-store** - immer aktuelle PDFs  

### **Was NICHT mehr passiert:**
❌ Keine client-seitige PDF-Konvertierung  
❌ Kein html2pdf.js mehr  
❌ Kein Browser-Print mehr  
❌ Keine Rendering-Unterschiede zwischen Browsern  
❌ Keine Mobile-spezifischen Templates  

---

## 🚨 **Error Handling**

### **Fehler: "PDFSHIFT_API_KEY not configured"**
**Ursache:** API-Key wurde nicht als Cloudflare Secret gesetzt

**Lösung:**
```bash
npx wrangler secret put PDFSHIFT_API_KEY
```

### **Fehler: "PDF generation failed (401)"**
**Ursache:** Falscher oder abgelaufener API-Key

**Lösung:**
1. Prüfe deinen API-Key im PDFShift Dashboard
2. Setze den API-Key neu:
```bash
npx wrangler secret put PDFSHIFT_API_KEY
```

### **Fehler: "PDF generation failed (429)"**
**Ursache:** Rate-Limit überschritten (250 PDFs/Monat im Free Plan)

**Lösung:**
- Upgrade auf PDFShift Paid Plan
- Oder warte bis zum nächsten Monat

---

## 🧪 **Testing**

### **Lokale Tests (Sandbox):**
```bash
cd /home/user/webapp

# Start local dev server
npm run build
pm2 start ecosystem.config.cjs

# Test endpoints
curl -X POST "http://localhost:3000/api/pdf/patient?example=true" --output test-patient.pdf
curl -X POST "http://localhost:3000/api/pdf/doctor?example=true" --output test-doctor.pdf
```

### **Production Tests:**
```bash
# Test Patient PDF
curl -X POST "https://medless.pages.dev/api/pdf/patient?example=true" \
  --output test-patient-prod.pdf

# Test Doctor PDF
curl -X POST "https://medless.pages.dev/api/pdf/doctor?example=true" \
  --output test-doctor-prod.pdf
```

### **Visual Comparison:**
1. Öffne: https://medless.pages.dev/test/patient-report
2. Lade herunter: https://medless.pages.dev/api/pdf/patient?example=true
3. Vergleiche visuell: HTML vs PDF (sollten identisch aussehen)

---

## 📊 **Monitoring**

### **PDFShift Dashboard:**
- **URL:** https://pdfshift.io/dashboard
- **Überwachung:** API-Requests, Fehler, Nutzung
- **Quota:** Verbleibende PDFs im aktuellen Monat

### **Cloudflare Analytics:**
- **URL:** https://dash.cloudflare.com/
- **Projekt:** medless
- **Metrics:** Request-Zähler für `/api/pdf/*` Endpunkte

---

## 🔄 **Migration (Alt → Neu)**

### **Frontend-Änderungen erforderlich:**

**ALT (Client-seitig):**
```javascript
// ❌ VERALTET - NICHT MEHR VERWENDEN
const html = response.patient.html;
html2pdf().from(html).save('patient-report.pdf');
```

**NEU (Server-seitig):**
```javascript
// ✅ KORREKT - Serverseitige PDF-API
const response = await fetch('/api/pdf/patient?example=true', {
  method: 'POST'
});
const pdfBlob = await response.blob();
const url = URL.createObjectURL(pdfBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'Dein_persoenlicher_MEDLESS-Plan.pdf';
a.click();
```

---

## 📝 **Changelog**

### **v2.1 - PDF-API (04.12.2025)**
- ✅ Neue Endpunkte: `/api/pdf/patient`, `/api/pdf/doctor`
- ✅ PDFShift.io Integration
- ✅ Serverseitige PDF-Generierung
- ✅ Konsistente PDFs auf allen Geräten
- ❌ html2pdf.js entfernt
- ❌ Browser-Print entfernt

---

## 🆘 **Support**

Bei Problemen:
1. Prüfe ob `PDFSHIFT_API_KEY` gesetzt ist
2. Teste mit `?example=true` URLs
3. Vergleiche HTML (/test/) mit PDF-Output
4. Prüfe Cloudflare Logs: `npx wrangler tail`
5. Prüfe PDFShift Dashboard auf Fehler

---

**Status:** ✅ PRODUCTION READY (nach API-Key-Setup)  
**Git Commit:** `881f782`  
**Deployment:** https://medless.pages.dev  
**Datum:** 04.12.2025
