import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal renders modal content directly into document.body.
 * This guarantees that position: fixed overlays are anchored to the active viewport
 * rather than being trapped in containers with CSS transforms, perspectives, or animations.
 */
export default function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar width to prevent page shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

export { ModalPortal };
