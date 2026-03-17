'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface InfoItem {
  term: string;
  definition: string;
}

interface InfoBoxProps {
  items: InfoItem[];
}

export default function InfoBox({ items }: InfoBoxProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-tertiary hover:bg-border-secondary transition-colors border border-border-secondary"
        aria-label="Aide"
        aria-expanded={open}
      >
        <HelpCircle className="w-3.5 h-3.5 text-text-tertiary" />
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 z-50 w-80 max-h-96 overflow-y-auto bg-white dark:bg-zinc-900 border border-border-secondary rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary bg-surface-tertiary rounded-t-xl">
            <span className="text-sm font-semibold text-text-primary">Lexique</span>
            <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={item.term}>
                <dt className="text-sm font-semibold text-text-primary">{item.term}</dt>
                <dd className="text-sm text-text-tertiary mt-0.5 leading-relaxed">{item.definition}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}
