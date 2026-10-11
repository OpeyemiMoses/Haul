import { useEffect } from 'react';

/**
 * High-Performance On-Scroll Reveal Engine:
 * 1. Checks elements currently inside viewport and reveals them via requestAnimationFrame.
 * 2. Observes all elements below the fold using IntersectionObserver so they animate in on scroll.
 * 3. Applies alternating 3D angle slides, spring pops, staggers, and inner rotations.
 */

const SELECTOR = '.reveal-on-scroll, .reveal-pop, .card-reveal-left, .card-reveal-right, .stagger-group > *, .rise-rotate-in, .rise-rotate-in-reverse, [data-reveal]';

let globalObserver = null;
let scrollListenerAttached = false;

function revealElement(el) {
  if (!el || el.classList.contains('is-revealed')) return;
  el.classList.add('is-revealed');
  // Also reveal any nested rise-rotate elements inside this card
  const nested = el.querySelectorAll('.rise-rotate-in, .rise-rotate-in-reverse');
  nested.forEach(n => n.classList.add('is-revealed'));
}

export function scanAndReveal() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
  const elements = document.querySelectorAll(SELECTOR);

  // Initialize or re-use IntersectionObserver
  if ('IntersectionObserver' in window && !globalObserver) {
    globalObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealElement(entry.target);
          try { globalObserver.unobserve(entry.target); } catch {}
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -25px 0px',
      threshold: 0.05
    });
  }

  elements.forEach((el) => {
    if (el.classList.contains('is-revealed')) return;
    const rect = el.getBoundingClientRect();
    
    // If element is currently within the visible viewport on load/mount, reveal it
    if (rect.top <= viewportHeight - 10 && rect.bottom >= 0) {
      window.requestAnimationFrame(() => {
        revealElement(el);
      });
      if (globalObserver) {
        try { globalObserver.unobserve(el); } catch {}
      }
    } else if (globalObserver) {
      // Element is below the viewport; observe it so it animates when scrolled into view
      try { globalObserver.observe(el); } catch {}
    }
  });

  // Attach passive scroll listener as a backup for fast scrolling
  if (!scrollListenerAttached && typeof window !== 'undefined') {
    let ticking = false;
    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const vh = window.innerHeight || 800;
          document.querySelectorAll(SELECTOR).forEach((el) => {
            if (!el.classList.contains('is-revealed')) {
              const r = el.getBoundingClientRect();
              if (r.top <= vh - 15 && r.bottom >= 0) {
                revealElement(el);
                if (globalObserver) {
                  try { globalObserver.unobserve(el); } catch {}
                }
              }
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    scrollListenerAttached = true;
  }

  // Automatic MutationObserver to catch in-page dynamic React component mounting
  if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined' && !window.__hualMutationObserver) {
    let mutTimeout = null;
    window.__hualMutationObserver = new MutationObserver(() => {
      if (mutTimeout) clearTimeout(mutTimeout);
      mutTimeout = setTimeout(() => {
        scanAndReveal();
      }, 50);
    });
    if (document.body) {
      window.__hualMutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
}

export function useScrollReveal(dependencies = []) {
  useEffect(() => {
    // Immediate scan
    scanAndReveal();

    // Short staggered scans to catch async React children rendering
    const t1 = setTimeout(scanAndReveal, 40);
    const t2 = setTimeout(scanAndReveal, 160);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, dependencies);
}

export default useScrollReveal;

