#!/usr/bin/env node

/**
 * MEDLESS Magazin Articles - Batch Tailwind Conversion Script
 * 
 * Converts all remaining magazine articles to Tailwind CSS using Article 1 as template
 * 
 * Usage: node scripts/convert-articles-to-tailwind.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Article data mapping
const articles = [
  {
    route: 'medikamente-absetzen-7-fehler',
    title: '7 Fehler beim Medikamente absetzen',
    pageTitle: 'Medikamente absetzen: Die 7 gefährlichsten Fehler',
    subtitle: 'Die häufigsten Fehler beim Ausschleichen von Medikamenten und wie du sie vermeidest.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    date: '10. Dezember 2024',
    readTime: '8',
    intro: 'Das Absetzen von Medikamenten ist ein sensibles Thema, das ärztliche Begleitung erfordert. Viele Menschen machen dabei vermeidbare Fehler, die zu Rückschlägen oder gesundheitlichen Problemen führen können. In diesem Artikel erfährst du, welche 7 Fehler am häufigsten vorkommen und wie du sie vermeiden kannst.'
  },
  {
    route: 'antidepressiva-absetzen-ohne-entzug',
    title: 'Antidepressiva absetzen ohne Entzug',
    pageTitle: 'Antidepressiva absetzen ohne Entzug',
    subtitle: 'Strukturierter Leitfaden für ein sicheres Ausschleichen von Antidepressiva unter ärztlicher Begleitung.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop',
    date: '9. Dezember 2024',
    readTime: '10',
    intro: 'Das Absetzen von Antidepressiva erfordert Geduld, ärztliche Begleitung und einen strukturierten Plan. Ein plötzliches Absetzen kann zu Entzugserscheinungen führen. Dieser Leitfaden zeigt dir, wie du Antidepressiva sicher und schrittweise reduzieren kannst.'
  },
  {
    route: 'schlaftabletten-loswerden',
    title: 'Schlaftabletten loswerden',
    pageTitle: 'Schlaftabletten loswerden: Der Weg zu natürlichem Schlaf',
    subtitle: 'Wie du dich schrittweise von Schlafmitteln lösen und zu natürlichem Schlaf zurückfinden kannst.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop',
    date: '8. Dezember 2024',
    readTime: '9',
    intro: 'Schlaftabletten können kurzfristig helfen, führen aber oft zu Abhängigkeit und beeinträchtigen die natürliche Schlafqualität. Dieser Artikel zeigt dir, wie du schrittweise zu einem gesunden, natürlichen Schlaf zurückfinden kannst – ohne Medikamente.'
  },
  {
    route: 'cbd-studien-und-fakten',
    title: 'CBD: Studien und Fakten',
    pageTitle: 'CBD: Wissenschaftliche Studien und Fakten',
    subtitle: 'Wissenschaftliche Erkenntnisse zur Wirkung von CBD bei verschiedenen Beschwerden.',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop',
    date: '7. Dezember 2024',
    readTime: '12',
    intro: 'Cannabidiol (CBD) ist einer der am besten erforschten Pflanzenstoffe. Zahlreiche wissenschaftliche Studien untersuchen seine Wirkung bei verschiedenen Beschwerden. Dieser Artikel gibt einen Überblick über den aktuellen Stand der Forschung.'
  },
  {
    route: 'magenschutz-absetzen-ppi',
    title: 'Magenschutz (PPI) absetzen',
    pageTitle: 'Magenschutz (PPI) absetzen: Was du wissen musst',
    subtitle: 'Protonenpumpenhemmer sicher reduzieren: Was du über das Absetzen von Magenschutz wissen musst.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
    date: '6. Dezember 2024',
    readTime: '7',
    intro: 'Protonenpumpenhemmer (PPI) wie Omeprazol oder Pantoprazol werden oft langfristig eingenommen, obwohl sie nur für kurzfristige Anwendung gedacht sind. Das Absetzen kann eine Herausforderung sein, ist aber mit der richtigen Strategie gut möglich.'
  },
  {
    route: 'taeglich-5-tabletten',
    title: 'Täglich 5 Tabletten – ist das normal?',
    pageTitle: 'Täglich 5 Tabletten – ist das normal?',
    subtitle: 'Polypharmazie verstehen: Wann wird Medikation zur Belastung und was kannst du dagegen tun?',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&h=400&fit=crop',
    date: '5. Dezember 2024',
    readTime: '6',
    intro: 'Viele Menschen nehmen täglich mehrere Medikamente ein – oft ohne zu wissen, ob alle wirklich notwendig sind. Polypharmazie ist ein wachsendes Problem. Dieser Artikel erklärt, wann Medikation zur Belastung wird und wie du gegensteuern kannst.'
  }
];

// Tailwind template header (based on Article 1)
function getTailwindHeader(article) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${article.pageTitle} – MEDLESS</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'medless': {
              primary: '#2FB585',
              'primary-hover': '#28A376',
              'primary-light': '#E7F8EF',
              'bg-ultra-light': 'rgba(47, 181, 133, 0.02)',
              'bg-light': 'rgba(47, 181, 133, 0.05)',
              'bg-card': '#FBFCFD',
              'text-primary': '#1B2A36',
              'text-secondary': '#5E6A71',
              'text-tertiary': '#94A3B8',
              'border-primary': 'rgba(0, 0, 0, 0.06)',
              'border-light': '#E9ECEF'
            }
          },
          fontSize: {
            'article-hero': ['2.625rem', { lineHeight: '1.2', fontWeight: '300' }],
            'article-subtitle': ['1.25rem', { lineHeight: '1.6', fontWeight: '400' }],
            'article-body': ['1.125rem', { lineHeight: '1.75', fontWeight: '400' }],
            'article-h2': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
            'article-h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '500' }]
          },
          maxWidth: {
            'article': '800px'
          },
          borderRadius: {
            'medless-lg': '16px',
            'medless-md': '12px',
            'medless-button': '24px'
          },
          boxShadow: {
            'medless-card': '0 2px 8px rgba(0, 0, 0, 0.06)',
            'medless-button': '0 2px 8px rgba(47, 181, 133, 0.15)'
          },
          transitionDuration: {
            'medless': '280ms'
          }
        }
      }
    }
  </script>
  
  <style>
    \${getSharedStyles()}
  </style>
</head>
<body class="m-0 font-['Inter'] bg-white">
  
  <header class="header">
    <div class="container">
      <nav class="nav">
        <a href="/" class="logo">
          <span class="logo-text">Medless</span>
        </a>
        <ul class="nav-links">
          <li><a href="/#how-it-works" class="nav-link">So funktioniert's</a></li>
          <li><a href="/#benefits" class="nav-link">Vorteile</a></li>
          <li><a href="/#faq" class="nav-link">FAQ</a></li>
          <li><a href="/magazin" class="nav-link active">Magazin</a></li>
          <li><a href="/fachkreise" class="nav-link">Für Ärzt:innen & Apotheken</a></li>
        </ul>
        <button class="btn-primary" onclick="window.location.href='/app'">Orientierungsplan starten</button>
      </nav>
    </div>
  </header>

  <main class="max-w-article mx-auto px-4 md:px-8 py-16">
    
    <article class="mb-8">
      <h1 class="text-3xl md:text-article-hero text-medless-text-primary mb-4">${article.title}</h1>
      <p class="text-article-subtitle text-medless-text-secondary mb-6">${article.subtitle}</p>
      
      <div class="flex flex-wrap gap-4 text-sm text-medless-text-tertiary mb-8 pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> ${article.date}
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> ${article.readTime} Min. Lesezeit
        </span>
      </div>
    </article>
    
    <img
      class="w-full h-56 md:h-80 object-cover rounded-medless-lg shadow-medless-card mb-8"
      src="${article.image}"
      alt="${article.title}"
      loading="eager"
    />
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-md px-5 py-4 md:px-6 md:py-5 mb-10">
        <p><strong>Kurz erklärt:</strong> ${article.intro}</p>
      </div>
      
      {{ARTICLE_CONTENT}}
      
    </div>
    
    <section class="mt-16 bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg px-8 py-10 text-center shadow-medless-card">
      <h2 class="text-2xl md:text-3xl font-semibold text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h2>
      <p class="text-base text-medless-text-secondary max-w-xl mx-auto mb-6">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      <a href="/app" class="inline-flex items-center gap-3 px-8 py-3 text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button shadow-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5">
        Jetzt starten
        <i data-lucide="arrow-right" class="w-5 h-5"></i>
      </a>
    </section>
    
  </main>
  
  <footer class="bg-slate-900 py-16 px-8 text-white text-center mt-20">
    <p class="font-semibold mb-3">MEDLESS – Dein Weg zu weniger Medikamenten</p>
    <p class="opacity-85 text-white/80">Eine Marke der CBD-Vertriebskompetenz GmbH</p>
    <div class="mt-6 flex gap-6 justify-center">
      <a href="/impressum" class="text-white/80 hover:text-white transition-colors no-underline">Impressum</a>
      <a href="/datenschutz" class="text-white/80 hover:text-white transition-colors no-underline">Datenschutz</a>
      <a href="/agb" class="text-white/80 hover:text-white transition-colors no-underline">AGB</a>
    </div>
  </footer>
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>`;
}

// Extract article body content from existing HTML
function extractArticleContent(html) {
  // Remove everything before article content starts
  let content = html;
  
  // Find the main article content area
  const contentStart = content.indexOf('<h2');
  const contentEnd = content.lastIndexOf('</div>');
  
  if (contentStart === -1 || contentEnd === -1) {
    console.warn('Could not find article content boundaries');
    return '<p>Artikel-Inhalt konnte nicht extrahiert werden.</p>';
  }
  
  content = content.substring(contentStart, contentEnd);
  
  // Clean up and apply Tailwind classes
  content = content
    // H2 headings
    .replace(/<h2>/g, '<h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">')
    // H3 headings
    .replace(/<h3>/g, '<h3 class="text-article-h3 text-medless-text-primary mt-8 mb-2">')
    // Lists
    .replace(/<ul>/g, '<ul class="list-disc list-inside space-y-2 ml-4">')
    .replace(/<ol>/g, '<ol class="list-decimal list-inside space-y-2 ml-4">')
    // Horizontal rules
    .replace(/<hr>/g, '<hr class="my-10 border-medless-border-light">')
    // Info boxes
    .replace(/<div class="article-info-box">/g, '<div class="bg-medless-primary-light border-l-4 border-medless-primary rounded-r-medless-md px-5 py-4 my-8">')
    // Remove old FontAwesome icons from headings
    .replace(/<i class="fas fa-[^"]+"><\/i>\s*/g, '');
  
  return content;
}

// Main conversion function
function convertArticle(sourceFile, article) {
  console.log(`\n📝 Converting: ${article.route}`);
  
  // Read source file
  const content = fs.readFileSync(sourceFile, 'utf8');
  
  // Find article route section
  const routePattern = new RegExp(`app\\.get\\('/magazin/${article.route}'[^{]+{[\\s\\S]+?return c\\.html\\(\`([\\s\\S]+?)\`\\s*\\)\\s*}\\)`, 'm');
  const match = content.match(routePattern);
  
  if (!match) {
    console.error(`❌ Could not find route: /magazin/${article.route}`);
    return { success: false, content };
  }
  
  const oldHtml = match[1];
  const articleContent = extractArticleContent(oldHtml);
  
  // Generate new Tailwind HTML
  const newHtml = getTailwindHeader(article).replace('{{ARTICLE_CONTENT}}', articleContent);
  
  // Replace in source file
  const newContent = content.replace(
    routePattern,
    `app.get('/magazin/${article.route}', (c) => {\n  return c.html(\`\n${newHtml}\n  \`)\n})`
  );
  
  console.log(`✅ Converted successfully!`);
  
  return { success: true, content: newContent };
}

// Execute conversion
function main() {
  console.log('🚀 MEDLESS Article Tailwind Conversion\n');
  console.log(`Converting ${articles.length} articles to Tailwind CSS...\n`);
  
  const sourceFile = path.join(__dirname, '../src/index.tsx');
  let content = fs.readFileSync(sourceFile, 'utf8');
  let successCount = 0;
  
  for (const article of articles) {
    const result = convertArticle(content, article);
    if (result.success) {
      content = result.content;
      successCount++;
    }
  }
  
  // Write back to file
  fs.writeFileSync(sourceFile, content, 'utf8');
  
  console.log(`\n\n✨ Conversion Complete!`);
  console.log(`✅ Successfully converted: ${successCount}/${articles.length} articles`);
  console.log(`📁 Updated file: ${sourceFile}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Run: npm run build`);
  console.log(`   2. Test articles in browser`);
  console.log(`   3. Deploy: npx wrangler pages deploy dist --project-name medless`);
}

// Run script
main();
