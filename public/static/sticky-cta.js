/**
 * STICKY CTA - Scroll-Detection Script
 * Zeigt CTA nach 25% Scroll-Tiefe
 * Performance-optimiert mit Throttling
 */

(function() {
  'use strict';
  
  // Configuration
  const SCROLL_THRESHOLD = 0.25; // 25% scroll depth
  const THROTTLE_DELAY = 100; // ms
  
  // State
  let isVisible = false;
  let throttleTimeout = null;
  
  // Get CTA element
  const ctaElement = document.getElementById('sticky-cta');
  
  if (!ctaElement) {
    console.warn('[Sticky CTA] Element #sticky-cta not found');
    return;
  }
  
  /**
   * Check scroll position and show/hide CTA
   */
  function checkScrollPosition() {
    // Calculate scroll percentage
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = scrollTop / docHeight;
    
    // Show CTA if scrolled past threshold
    const shouldShow = scrollPercent >= SCROLL_THRESHOLD;
    
    if (shouldShow && !isVisible) {
      ctaElement.classList.add('visible');
      isVisible = true;
    } else if (!shouldShow && isVisible) {
      ctaElement.classList.remove('visible');
      isVisible = false;
    }
  }
  
  /**
   * Throttled scroll handler
   */
  function handleScroll() {
    if (throttleTimeout) return;
    
    throttleTimeout = setTimeout(() => {
      checkScrollPosition();
      throttleTimeout = null;
    }, THROTTLE_DELAY);
  }
  
  /**
   * Initialize
   */
  function init() {
    // Check initial position (in case page loads mid-scroll)
    checkScrollPosition();
    
    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Listen to resize (affects scroll calculation)
    window.addEventListener('resize', checkScrollPosition, { passive: true });
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
