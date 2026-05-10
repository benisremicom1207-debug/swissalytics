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
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-label="Aide"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          background: 'var(--sa-cream-2)',
          border: '1px solid var(--sa-rule)',
          color: 'var(--sa-ink-3)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <HelpCircle style={{ width: 12, height: 12 }} />
      </button>
      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            zIndex: 50,
            width: 320,
            maxHeight: 384,
            overflowY: 'auto',
            background: 'var(--sa-cream)',
            border: '2px solid var(--sa-ink)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--sa-ink)',
              color: 'var(--sa-cream)',
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              § Lexique
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sa-cream)',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
              }}
              aria-label="Fermer"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => (
              <div key={item.term}>
                <dt
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--sa-ink)',
                    marginBottom: 4,
                  }}
                >
                  {item.term}
                </dt>
                <dd
                  style={{
                    fontSize: 12,
                    color: 'var(--sa-ink-3)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {item.definition}
                </dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}
