'use client';

import { ArrowDown } from 'lucide-react';
import { Button } from '@property-os/ui';
import { useRef, useState, useEffect } from 'react';

export default function SkipToContent() {
  const [isFocused, setIsFocused] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        mainContentRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50">
        <Button
          asChild
          className="flex items-center gap-2"
          onClick={() => mainContentRef.current?.focus()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Skip to main content"
        >
          <a href="#main-content" className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4" />
            Skip to main content
          </a>
        </Button>
      </div>
      <main id="main-content" tabIndex={-1} ref={mainContentRef} />
    </>
  );
}