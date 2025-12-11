// MEDLESS Scroll Animations - Intersection Observer für fade-up Effekte
(function() {
  // Warte auf DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }

  function initScrollAnimations() {
    // Finde alle Elemente mit data-animate Attribut
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (animatedElements.length === 0) return;

    // Intersection Observer mit threshold
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Verzögere Animation leicht für Stagger-Effekt
          const delay = parseInt(entry.target.dataset.delay || 0);
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          
          // Optional: Observer stoppen nach Animation
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Beobachte alle Elemente
    animatedElements.forEach((el, index) => {
      // Setze initiale opacity-0 wenn nicht schon gesetzt
      if (!el.classList.contains('opacity-0')) {
        el.classList.add('opacity-0', 'translate-y-3');
      }
      
      // Füge Transition hinzu
      el.classList.add('transition-all', 'duration-500', 'ease-out');
      
      // Optional: Stagger delay basierend auf Index
      if (!el.dataset.delay && index > 0) {
        el.dataset.delay = index * 100;
      }
      
      observer.observe(el);
    });
  }
})();
