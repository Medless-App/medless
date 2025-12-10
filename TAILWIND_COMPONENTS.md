# MEDLESS Tailwind CSS Components

Alle UI-Komponenten mit reinen Tailwind-Klassen basierend auf dem MEDLESS Design System.

---

## 🎨 Design Tokens (aus tailwind.config.js)

### Farben
- **Primary**: `bg-medless-primary` (#2FB585)
- **Primary Dark**: `bg-medless-primary-dark` (#1B9C6E)
- **Text Primary**: `text-medless-text-primary` (#1B2A36)
- **Text Secondary**: `text-medless-text-secondary` (#5E6A71)
- **Background Card**: `bg-medless-bg-card` (#E7F8EF)

### Typografie
- **Hero Title**: `text-hero-title` (42px, light)
- **Article H2**: `text-article-h2` (32px, medium)
- **Article Body**: `text-article-body` (18px, 1.75 line-height)
- **Card Title**: `text-card-title` (21px, medium)

### Spacing
- **Container Padding**: `px-8 py-20` (80px vertical)
- **Card Gap**: `gap-8` (32px)
- **Section Margin**: `mt-16 mb-16` (64px)

### Radius
- **Card**: `rounded-medless-lg` (16px)
- **Button**: `rounded-medless-button` (24px)
- **Box**: `rounded-medless-md` (14px)

### Shadows
- **Card**: `shadow-medless-card`
- **Card Hover**: `shadow-medless-card-hover`
- **Button**: `shadow-medless-button`

---

## 📦 Komponenten-Beispiele

### 1. Header (Sticky Navigation)

```html
<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-medless-border-light shadow-medless-header">
  <div class="max-w-container mx-auto px-7 py-5 flex items-center justify-between">
    
    <!-- Logo -->
    <a href="/" class="text-2xl font-semibold text-medless-text-primary tracking-tight">
      Medless
    </a>
    
    <!-- Navigation -->
    <ul class="hidden md:flex items-center gap-7">
      <li><a href="/#how-it-works" class="text-meta-text text-gray-600 hover:text-medless-primary transition-colors duration-200">So funktioniert's</a></li>
      <li><a href="/#benefits" class="text-meta-text text-gray-600 hover:text-medless-primary transition-colors duration-200">Vorteile</a></li>
      <li><a href="/#faq" class="text-meta-text text-gray-600 hover:text-medless-primary transition-colors duration-200">FAQ</a></li>
      <li><a href="/magazin" class="text-meta-text text-medless-primary font-medium">Magazin</a></li>
      <li><a href="/fachkreise" class="text-meta-text text-gray-600 hover:text-medless-primary transition-colors duration-200">Für Ärzt:innen</a></li>
    </ul>
    
    <!-- CTA Button -->
    <button 
      onclick="window.location.href='/app'" 
      class="inline-flex items-center justify-center gap-3 px-8 py-4 text-button-text text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5 shadow-medless-button hover:shadow-medless-button-hover"
    >
      Orientierungsplan starten
    </button>
  </div>
</header>
```

---

### 2. Hero Section (Homepage)

```html
<section class="bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-light py-20 px-8">
  <div class="max-w-container mx-auto">
    <div class="grid md:grid-cols-2 gap-12 items-center">
      
      <!-- Left Column: Content -->
      <div class="space-y-8">
        
        <!-- Title -->
        <h1 class="text-hero-title text-medless-text-primary">
          Ihr persönlicher MEDLESS-Orientierungsplan
        </h1>
        
        <!-- Subtitle -->
        <p class="text-article-subtitle text-medless-text-secondary">
          Erfasst Medikamente, zeigt Wechselwirkungen, erstellt einen ärztetauglichen PDF-Bericht.
        </p>
        
        <!-- CTA Button -->
        <button class="inline-flex items-center justify-center gap-3 px-8 py-4 text-button-text text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5 shadow-medless-button hover:shadow-medless-button-hover">
          Orientierungsplan starten
          <i class="fas fa-arrow-right text-sm"></i>
        </button>
        
        <!-- USP Grid (2x2) -->
        <div class="grid grid-cols-2 gap-4 mt-8">
          
          <div class="bg-medless-primary/5 border border-medless-primary/15 rounded-medless-sm p-5 transition-all duration-300 hover:bg-medless-primary/8 hover:border-medless-primary/30 hover:-translate-y-1 hover:shadow-sm">
            <p class="text-card-description text-medless-text-secondary">
              Erfasst Ihre aktuellen Medikamente
            </p>
          </div>
          
          <div class="bg-medless-primary/5 border border-medless-primary/15 rounded-medless-sm p-5 transition-all duration-300 hover:bg-medless-primary/8 hover:border-medless-primary/30 hover:-translate-y-1 hover:shadow-sm">
            <p class="text-card-description text-medless-text-secondary">
              Zeigt mögliche Reihenfolgen
            </p>
          </div>
          
          <div class="bg-medless-primary/5 border border-medless-primary/15 rounded-medless-sm p-5 transition-all duration-300 hover:bg-medless-primary/8 hover:border-medless-primary/30 hover:-translate-y-1 hover:shadow-sm">
            <p class="text-card-description text-medless-text-secondary">
              Macht Wechselwirkungen sichtbar
            </p>
          </div>
          
          <div class="bg-medless-primary/5 border border-medless-primary/15 rounded-medless-sm p-5 transition-all duration-300 hover:bg-medless-primary/8 hover:border-medless-primary/30 hover:-translate-y-1 hover:shadow-sm">
            <p class="text-card-description text-medless-text-secondary">
              Erstellt einen PDF-Plan
            </p>
          </div>
          
        </div>
      </div>
      
      <!-- Right Column: Mockup -->
      <div class="flex items-center justify-center">
        <div class="bg-white border border-medless-border-light rounded-medless-lg p-8 shadow-medless-card max-w-md w-full">
          <div class="text-center space-y-4">
            <h3 class="text-card-title text-medless-text-primary">
              MEDLESS – Orientierungsplan
            </h3>
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div class="h-3 bg-gray-200 rounded w-full"></div>
              <div class="h-3 bg-gray-200 rounded w-5/6 mx-auto"></div>
            </div>
            <p class="text-xs text-medless-text-tertiary mt-4">
              Keine Therapieempfehlung
            </p>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</section>
```

---

### 3. "So funktioniert's" Cards

```html
<section class="bg-white py-20 px-8">
  <div class="max-w-container mx-auto">
    
    <!-- Section Title -->
    <h2 class="text-section-title text-medless-text-primary text-center mb-16">
      So funktioniert's
    </h2>
    
    <!-- 3-Column Grid -->
    <div class="grid md:grid-cols-3 gap-8">
      
      <!-- Step 1 -->
      <div class="group">
        <div class="bg-white border border-black/[0.06] rounded-medless-lg p-10 text-center transition-all duration-medless hover:-translate-y-1 hover:shadow-medless-card-hover hover:border-medless-primary/25">
          
          <!-- Icon -->
          <div class="w-20 h-20 mx-auto mb-6 bg-medless-bg-card rounded-medless-xl flex items-center justify-center transition-all duration-300 group-hover:bg-medless-bg-card-hover group-hover:scale-105">
            <i class="fas fa-clipboard-list text-3xl text-medless-primary"></i>
          </div>
          
          <!-- Step Label -->
          <p class="text-xs font-semibold uppercase tracking-wider text-medless-text-tertiary mb-3">
            SCHRITT 01
          </p>
          
          <!-- Title -->
          <h3 class="text-card-title text-medless-text-primary mb-3">
            Erfassen
          </h3>
          
          <!-- Description -->
          <p class="text-card-description text-medless-text-secondary">
            In 3 Minuten Medikamente eingeben.
          </p>
        </div>
      </div>
      
      <!-- Step 2 -->
      <div class="group">
        <div class="bg-white border border-black/[0.06] rounded-medless-lg p-10 text-center transition-all duration-medless hover:-translate-y-1 hover:shadow-medless-card-hover hover:border-medless-primary/25">
          
          <div class="w-20 h-20 mx-auto mb-6 bg-medless-bg-card rounded-medless-xl flex items-center justify-center transition-all duration-300 group-hover:bg-medless-bg-card-hover group-hover:scale-105">
            <i class="fas fa-file-pdf text-3xl text-medless-primary"></i>
          </div>
          
          <p class="text-xs font-semibold uppercase tracking-wider text-medless-text-tertiary mb-3">
            SCHRITT 02
          </p>
          
          <h3 class="text-card-title text-medless-text-primary mb-3">
            Plan erhalten
          </h3>
          
          <p class="text-card-description text-medless-text-secondary">
            Sofortiger PDF-Orientierungsplan.
          </p>
        </div>
      </div>
      
      <!-- Step 3 -->
      <div class="group">
        <div class="bg-white border border-black/[0.06] rounded-medless-lg p-10 text-center transition-all duration-medless hover:-translate-y-1 hover:shadow-medless-card-hover hover:border-medless-primary/25">
          
          <div class="w-20 h-20 mx-auto mb-6 bg-medless-bg-card rounded-medless-xl flex items-center justify-center transition-all duration-300 group-hover:bg-medless-bg-card-hover group-hover:scale-105">
            <i class="fas fa-user-md text-3xl text-medless-primary"></i>
          </div>
          
          <p class="text-xs font-semibold uppercase tracking-wider text-medless-text-tertiary mb-3">
            SCHRITT 03
          </p>
          
          <h3 class="text-card-title text-medless-text-primary mb-3">
            Besprechen
          </h3>
          
          <p class="text-card-description text-medless-text-secondary">
            Bessere Gespräche mit Ihrem Arzt.
          </p>
        </div>
      </div>
      
    </div>
  </div>
</section>
```

---

### 4. Magazin Article Card

```html
<article class="group bg-white border border-black/[0.06] rounded-medless-lg overflow-hidden transition-all duration-medless hover:-translate-y-1 hover:shadow-medless-card-hover hover:border-medless-primary/20">
  
  <!-- Image -->
  <div class="overflow-hidden h-56">
    <a href="/magazin/endocannabinoid-system-erklaert">
      <img 
        src="https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=400&fit=crop" 
        alt="Das Endocannabinoid-System erklärt" 
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
        loading="lazy"
      />
    </a>
  </div>
  
  <!-- Content -->
  <div class="p-6 space-y-3">
    
    <!-- Title -->
    <h3 class="text-card-title text-medless-text-primary">
      <a href="/magazin/endocannabinoid-system-erklaert" class="hover:text-medless-primary transition-colors">
        Das Endocannabinoid-System erklärt
      </a>
    </h3>
    
    <!-- Description -->
    <p class="text-card-description text-medless-text-secondary">
      Erfahre, wie dein körpereigenes Schutzschild funktioniert und warum es so wichtig für deine Gesundheit ist.
    </p>
    
    <!-- Read More Link -->
    <a 
      href="/magazin/endocannabinoid-system-erklaert" 
      class="inline-flex items-center gap-2 text-meta-text text-medless-primary font-medium transition-colors hover:text-medless-primary-dark group/link"
    >
      Artikel lesen
      <i class="fas fa-arrow-right text-sm transition-transform group-hover/link:translate-x-1"></i>
    </a>
  </div>
  
</article>
```

---

### 5. Article Page Layout

```html
<div class="max-w-article mx-auto px-8 py-20">
  
  <!-- Article Header -->
  <article class="mb-12">
    
    <!-- Title -->
    <h1 class="text-article-hero text-medless-text-primary mb-5">
      Das Endocannabinoid-System: Dein körpereigenes Schutzschild
    </h1>
    
    <!-- Subtitle -->
    <p class="text-article-subtitle text-medless-text-secondary mb-8">
      Erfahre, wie dein körpereigenes Schutzschild funktioniert und warum es so wichtig für deine Gesundheit ist.
    </p>
    
    <!-- Meta -->
    <div class="flex items-center gap-5 text-meta-text text-medless-text-tertiary pb-8 border-b border-medless-border-light">
      <span class="flex items-center gap-2">
        <i class="far fa-calendar text-sm"></i>
        8. Dezember 2024
      </span>
      <span class="flex items-center gap-2">
        <i class="far fa-clock text-sm"></i>
        7 Min. Lesezeit
      </span>
    </div>
  </article>
  
  <!-- Article Content -->
  <div class="text-article-body text-medless-text-primary space-y-7">
    
    <!-- Intro Box -->
    <div class="bg-medless-bg-card border border-medless-border-primary border-l-4 border-l-medless-primary rounded-medless-sm p-7 my-10">
      <strong>Kurz erklärt:</strong> Das Endocannabinoid-System (ECS) ist ein komplexes Netzwerk im Körper...
    </div>
    
    <!-- H2 Heading -->
    <h2 class="text-article-h2 text-medless-text-primary mt-16 mb-6">
      Was ist das Endocannabinoid-System?
    </h2>
    
    <!-- Paragraph -->
    <p>
      Das Endocannabinoid-System (ECS) ist eines der faszinierendsten Regulationssysteme unseres Körpers...
    </p>
    
    <!-- List -->
    <ul class="space-y-4 pl-8 my-7">
      <li class="text-article-body">
        <strong class="font-semibold">Endocannabinoide:</strong> Körpereigene Botenstoffe wie Anandamid und 2-AG
      </li>
      <li class="text-article-body">
        <strong class="font-semibold">Rezeptoren:</strong> CB1 (hauptsächlich im Nervensystem) und CB2 (vor allem im Immunsystem)
      </li>
    </ul>
    
    <!-- H3 Heading -->
    <h3 class="text-article-h3 text-medless-text-primary mt-12 mb-5">
      Schmerzwahrnehmung
    </h3>
    
    <p>
      Das ECS moduliert die Schmerzempfindung...
    </p>
    
    <!-- Info Box -->
    <div class="bg-medless-primary/5 border border-medless-primary/15 rounded-medless-md p-7 my-10">
      <h3 class="text-card-title text-medless-text-primary mb-4 flex items-center gap-2">
        <i class="fas fa-lightbulb text-medless-primary"></i>
        Wichtig zu wissen
      </h3>
      <p class="text-base text-medless-text-secondary leading-relaxed">
        Das Endocannabinoid-System ist bei jedem Menschen individuell ausgeprägt...
      </p>
    </div>
    
    <!-- Divider -->
    <hr class="border-t border-medless-border-light my-14">
    
    <!-- CTA Box -->
    <div class="bg-gradient-to-br from-medless-bg-ultra-light to-medless-bg-card border border-medless-border-primary rounded-medless-lg p-12 my-20 text-center">
      
      <h3 class="text-3xl font-medium text-medless-text-primary mb-4">
        Starte deinen persönlichen Orientierungsplan
      </h3>
      
      <p class="text-lg text-medless-text-secondary mb-8 leading-relaxed">
        Erfasse deine Medikamente, erhalte sofort einen PDF-Plan und führe bessere Arztgespräche.
      </p>
      
      <a 
        href="/app" 
        class="inline-flex items-center justify-center gap-3 px-8 py-4 text-button-text text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5 shadow-medless-button hover:shadow-medless-button-hover group"
      >
        Jetzt starten
        <i class="fas fa-arrow-right text-sm transition-transform group-hover:translate-x-1"></i>
      </a>
      
    </div>
  </div>
  
</div>
```

---

### 6. Button Variants

```html
<!-- Primary Outline Button (Default Style) -->
<button class="inline-flex items-center justify-center gap-3 px-8 py-4 text-button-text text-medless-primary bg-white border-2 border-medless-primary rounded-medless-button transition-all duration-medless hover:bg-medless-primary hover:text-white hover:-translate-y-0.5 shadow-medless-button hover:shadow-medless-button-hover">
  Button Text
</button>

<!-- Solid Primary Button -->
<button class="inline-flex items-center justify-center gap-3 px-8 py-4 text-button-text text-white bg-medless-primary border-2 border-medless-primary rounded-medless-button transition-all duration-medless hover:bg-medless-primary-dark hover:border-medless-primary-dark hover:-translate-y-0.5 shadow-medless-button hover:shadow-medless-button-hover">
  Button Text
</button>

<!-- Secondary Button -->
<button class="inline-flex items-center justify-center gap-3 px-8 py-4 text-button-text text-medless-text-primary bg-white border-2 border-medless-border-light rounded-medless-button transition-all duration-medless hover:border-medless-primary hover:text-medless-primary hover:-translate-y-0.5">
  Button Text
</button>

<!-- Small Button -->
<button class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-medless-primary bg-white border-2 border-medless-primary rounded-full transition-all duration-medless hover:bg-medless-primary hover:text-white">
  Small Button
</button>
```

---

## 🎯 Utility Classes Quick Reference

### Spacing
- Container: `max-w-container mx-auto px-8 py-20`
- Section Spacing: `my-16` (64px)
- Card Padding: `p-6` or `p-7` (24px/28px)
- Gap Between Items: `gap-8` (32px)

### Colors
- Primary Text: `text-medless-text-primary`
- Secondary Text: `text-medless-text-secondary`
- Primary BG: `bg-medless-primary`
- Card BG: `bg-medless-bg-card`

### Typography
- Hero: `text-hero-title`
- H2: `text-article-h2`
- Body: `text-article-body`
- Meta: `text-meta-text`

### Borders
- Light: `border-medless-border-light`
- Primary: `border-medless-primary`
- Radius: `rounded-medless-lg`

### Shadows
- Card: `shadow-medless-card`
- Hover: `hover:shadow-medless-card-hover`

### Transitions
- Standard: `transition-all duration-medless`
- Hover Lift: `hover:-translate-y-1`

---

## 📱 Responsive Breakpoints

- Mobile: Default (< 640px)
- Tablet: `md:` (≥ 768px)
- Desktop: `lg:` (≥ 1024px)
- Large: `xl:` (≥ 1280px)

Example:
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  <!-- 1 column mobile, 2 tablet, 3 desktop -->
</div>
```
