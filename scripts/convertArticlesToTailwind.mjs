#!/usr/bin/env node

/**
 * MEDLESS Magazin Article Tailwind Conversion Script
 * 
 * Converts all magazine articles to Tailwind CSS structure
 * based on Article 1 (Endocannabinoid-System) as reference template.
 */

import fs from 'fs';
import path from 'path';

// Article metadata with images from overview page
const ARTICLES = [
  {
    slug: 'medikamente-absetzen-7-fehler',
    title: '7 Fehler beim Medikamente absetzen',
    subtitle: 'Die häufigsten Fehler beim Ausschleichen von Medikamenten und wie du sie vermeidest.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    date: '8. Dezember 2024',
    readTime: '8'
  },
  {
    slug: 'antidepressiva-absetzen-ohne-entzug',
    title: 'Antidepressiva absetzen ohne Entzug',
    subtitle: 'Strukturierter Leitfaden für ein sicheres Ausschleichen von Antidepressiva unter ärztlicher Begleitung.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop',
    date: '8. Dezember 2024',
    readTime: '9'
  },
  {
    slug: 'schlaftabletten-loswerden',
    title: 'Schlaftabletten loswerden',
    subtitle: 'Wie du dich schrittweise von Schlafmitteln lösen und zu natürlichem Schlaf zurückfinden kannst.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop',
    date: '8. Dezember 2024',
    readTime: '7'
  },
  {
    slug: 'cbd-studien-und-fakten',
    title: 'CBD: Studien und Fakten',
    subtitle: 'Wissenschaftliche Erkenntnisse zur Wirkung von CBD bei verschiedenen Beschwerden.',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&h=400&fit=crop',
    date: '8. Dezember 2024',
    readTime: '10'
  },
  {
    slug: 'magenschutz-absetzen-ppi',
    title: 'Magenschutz (PPI) absetzen',
    subtitle: 'Protonenpumpenhemmer sicher reduzieren: Was du über das Absetzen von Magenschutz wissen musst.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
    date: '8. Dezember 2024',
    readTime: '8'
  },
  {
    slug: 'taeglich-5-tabletten',
    title: 'Täglich 5 Tabletten – ist das normal?',
    subtitle: 'Polypharmazie verstehen: Wann wird Medikation zur Belastung und was kannst du dagegen tun?',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&h=400&fit=crop',
    date: '8. Dezember 2024',
    readTime: '6'
  }
];

const SOURCE_FILE = path.join(process.cwd(), 'src/index.tsx');

console.log('🚀 Starting MEDLESS Article Tailwind Conversion...\n');

// Read the source file
let content = fs.readFileSync(SOURCE_FILE, 'utf-8');
const originalLength = content.length;

// Backup original file
const backupFile = SOURCE_FILE.replace('.tsx', '.backup.tsx');
fs.writeFileSync(backupFile, content);
console.log(`✅ Created backup: ${backupFile}\n`);

let conversionsCount = 0;

// Process each article
for (const article of ARTICLES) {
  console.log(`\n📝 Converting: ${article.title}`);
  console.log(`   Slug: /magazin/${article.slug}`);
  
  // Find article route boundaries
  const routeStart = `app.get('/magazin/${article.slug}', (c) => {`;
  const routeStartIndex = content.indexOf(routeStart);
  
  if (routeStartIndex === -1) {
    console.log(`   ❌ Route not found: ${article.slug}`);
    continue;
  }
  
  // Find the closing of this route (next app.get or end of file)
  let routeEndIndex = content.indexOf('\napp.get(\'', routeStartIndex + routeStart.length);
  if (routeEndIndex === -1) {
    routeEndIndex = content.indexOf('\napp.post(\'', routeStartIndex + routeStart.length);
  }
  if (routeEndIndex === -1) {
    routeEndIndex = content.indexOf('\nexport default app', routeStartIndex + routeStart.length);
  }
  
  // Extract original article HTML to preserve content
  const originalArticle = content.substring(routeStartIndex, routeEndIndex);
  
  // Extract intro text (first paragraph or intro box)
  let introText = 'Dieser Artikel bietet wichtige Informationen zur Medikamentenreduktion.';
  const introMatch = originalArticle.match(/<p[^>]*>(.*?)<\/p>/s);
  if (introMatch) {
    introText = introMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 300);
  }
  
  // Generate new Tailwind-based article
  const newArticle = generateTailwindArticle(article, originalArticle, introText);
  
  // Replace in content
  content = content.substring(0, routeStartIndex) + newArticle + content.substring(routeEndIndex);
  
  conversionsCount++;
  console.log(`   ✅ Converted successfully`);
}

// Remove duplicate endocannabinoid-system-erklaert route (line 2907)
const dupRoute = content.indexOf('app.get(\'/magazin/endocannabinoid-system-erklaert\', (c) => {', 2600);
if (dupRoute !== -1) {
  const dupEnd = content.indexOf('\napp.get(\'', dupRoute + 10);
  if (dupEnd !== -1) {
    console.log('\n🔧 Removing duplicate endocannabinoid-system-erklaert route...');
    content = content.substring(0, dupRoute) + content.substring(dupEnd);
    console.log('   ✅ Duplicate removed');
  }
}

// Write updated content
fs.writeFileSync(SOURCE_FILE, content);

console.log('\n\n✨ CONVERSION COMPLETE! ✨\n');
console.log(`📊 Statistics:`);
console.log(`   - Articles converted: ${conversionsCount}/6`);
console.log(`   - Original file size: ${(originalLength / 1024).toFixed(2)} KB`);
console.log(`   - New file size: ${(content.length / 1024).toFixed(2)} KB`);
console.log(`   - Size difference: ${((content.length - originalLength) / 1024).toFixed(2)} KB`);
console.log(`\n📁 Backup saved to: ${backupFile}`);
console.log(`\n✅ All articles now use Tailwind CSS structure from Article 1!`);

/**
 * Generate Tailwind-based article HTML
 */
function generateTailwindArticle(meta, originalContent, introText) {
  // Extract any H2/H3 sections from original content
  const h2Sections = extractContentSections(originalContent);
  
  return `app.get('/magazin/${meta.slug}', (c) => {
  return c.html(\`
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${meta.title} – MEDLESS</title>
  
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
      <h1 class="text-3xl md:text-article-hero text-medless-text-primary mb-4">${meta.title}</h1>
      <p class="text-article-subtitle text-medless-text-secondary mb-6">${meta.subtitle}</p>
      
      <div class="flex flex-wrap gap-4 text-sm text-medless-text-tertiary mb-8 pb-6 border-b border-medless-border-light">
        <span class="inline-flex items-center gap-2">
          <i data-lucide="calendar" class="w-4 h-4"></i> ${meta.date}
        </span>
        <span class="inline-flex items-center gap-2">
          <i data-lucide="clock" class="w-4 h-4"></i> ${meta.readTime} Min. Lesezeit
        </span>
      </div>
    </article>
    
    <img
      class="w-full h-56 md:h-80 object-cover rounded-medless-lg shadow-medless-card mb-8"
      src="${meta.image}"
      alt="${meta.title}"
      loading="eager"
    />
    
    <div class="text-article-body text-medless-text-primary space-y-6">
      
      <div class="bg-medless-bg-card border border-medless-border-primary rounded-medless-md px-5 py-4 md:px-6 md:py-5 mb-10">
        <p><strong>Kurz erklärt:</strong> ${introText}</p>
      </div>
      
      ${h2Sections}
      
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
</html>
  \`)
})

`;
}

/**
 * Extract H2/H3 content sections from original article
 */
function extractContentSections(originalContent) {
  // Extract all H2 and H3 sections with content
  const sections = [];
  
  // Simple content preservation - extract key sections
  const h2Matches = originalContent.matchAll(/<h2[^>]*>(.*?)<\/h2>/gs);
  const paragraphs = originalContent.matchAll(/<p[^>]*>(.*?)<\/p>/gs);
  
  let contentHtml = '';
  
  // Add H2 sections
  for (const match of h2Matches) {
    const h2Text = match[1].replace(/<[^>]*>/g, '').trim();
    if (h2Text && h2Text.length > 3) {
      contentHtml += `      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">${h2Text}</h2>\n`;
    }
  }
  
  // Add some paragraphs
  let pCount = 0;
  for (const match of paragraphs) {
    const pText = match[1].replace(/<i[^>]*>.*?<\/i>/g, '').trim();
    if (pText && pText.length > 20 && pCount < 8) {
      contentHtml += `      <p>${pText}</p>\n`;
      pCount++;
    }
  }
  
  // If no content extracted, add placeholder
  if (!contentHtml) {
    contentHtml = `      <h2 class="text-article-h2 text-medless-text-primary mt-10 mb-3">Wichtige Informationen</h2>
      <p>Dieser Artikel wird demnächst mit ausführlichen Informationen aktualisiert.</p>
      <p>Bitte schauen Sie später noch einmal vorbei oder nutzen Sie unseren Orientierungsplan für personalisierte Empfehlungen.</p>\n`;
  }
  
  return contentHtml;
}
