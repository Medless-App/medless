// ============================================================
// ZENTRALE TEMPLATE ENGINE
// ============================================================
// Dies ist die einzige offizielle Master-Version von fillTemplate
// für das gesamte MEDLESS Report System.
//
// Unterstützt:
// - {{key}} - Einfache Platzhalter
// - {{nested.key}} - Verschachtelte Objekte
// - {{#array}}...{{/array}} - Array-Iteration
// - {{.}} - Primitive Array-Werte
//
// KEINE externen Abhängigkeiten - Pure TypeScript

/**
 * Füllt ein HTML-Template mit Daten
 * @param template HTML-String mit {{placeholders}}
 * @param data Datenobjekt mit Werten
 * @returns Gefülltes HTML
 */
export function fillTemplate(template: string, data: Record<string, any>): string {
  let result = template;

  // 1) Einfache {{key}} und {{nested.key}} Platzhalter ersetzen
  result = result.replace(/\{\{([^{}#/]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const keys = trimmedKey.split('.');
    let value: any = data;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return match; // Platzhalter unverändert lassen, wenn kein Wert
      }
    }
    
    if (value === null || value === undefined) {
      return match;
    }
    return String(value);
  });

  // 2) {{#array}}...{{/array}} Blöcke verarbeiten
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, innerTemplate) => {
    const arrayData = data[key];
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
      return ''; // Block entfernen, wenn keine Array-Daten
    }

    return arrayData.map(item => {
      let itemHtml = innerTemplate;
      
      // Primitive Werte: {{.}} ersetzen
      if (typeof item !== 'object') {
        itemHtml = itemHtml.replace(/\{\{\.\}\}/g, String(item));
        return itemHtml;
      }

      // Objekt-Properties: {{property}} ersetzen
      itemHtml = itemHtml.replace(/\{\{([^{}#/]+)\}\}/g, (_, prop) => {
        const trimmedProp = prop.trim();
        const value = item[trimmedProp];
        if (value === null || value === undefined) {
          return `{{${trimmedProp}}}`; // Platzhalter behalten
        }
        return String(value);
      });

      return itemHtml;
    }).join('');
  });

  return result;
}
