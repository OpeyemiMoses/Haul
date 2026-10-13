import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal renders modal content directly into document.body.
 * This guarantees that position: fixed overlays are anchored to the active viewport
 * rather than being trapped in containers with CSS transforms, perspectives, or animations.
 */
let activeModalCount = 0;

export default function ModalPortal({ children, lockScroll = true }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (lockScroll) {
      activeModalCount += 1;
      if (activeModalCount === 1) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      if (lockScroll) {
        activeModalCount = Math.max(0, activeModalCount - 1);
        if (activeModalCount === 0) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      }
    };
  }, [lockScroll]);

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

export { ModalPortal };
