'use client';

import { useEffect, useRef } from 'react';

interface FocusTrapProps {
  active: boolean;
  children: React.ReactNode;
}

/**
 * FocusTrap component that traps focus within its children when active.
 * Useful for modals, dialogs, and dropdowns to ensure keyboard users don't navigate outside.
 */
export function FocusTrap({ active, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap becomes active
    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: Move focus backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Move focus forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let parent component handle escape
        container.dispatchEvent(new CustomEvent('focustrap-escape', { bubbles: true }));
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Prevent scrolling when focus trap is active
    document.body.style.overflow = 'hidden';

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [active]);

  return <div ref={containerRef} role="dialog" aria-modal={active}>{children}</div>;
}