'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { AnalysisResult } from '@/lib/types';
import HeadingsTab from '../tabs/HeadingsTab';
import ImagesTab from '../tabs/ImagesTab';
import LinksTab from '../tabs/LinksTab';
import TechnicalTab from '../tabs/TechnicalTab';
import MetadataTab from '../tabs/MetadataTab';
import ReadabilityTab from '../tabs/ReadabilityTab';

export type DetailsSectionKey =
  | 'headings'
  | 'images'
  | 'links'
  | 'technical'
  | 'metadata'
  | 'readability';

interface DetailsContentProps {
  report: AnalysisResult;
  cwvLoading?: boolean;
  section: DetailsSectionKey;
  setSection: (s: DetailsSectionKey) => void;
  sectionDefs: Array<{ key: DetailsSectionKey; num: string; label: string }>;
}

/* ---------------- private helper (only used here) ---------------- */

function SectionNavEntry({
  num,
  label,
  active,
  onClick,
}: {
  num: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        borderLeft: `3px solid ${active ? 'var(--sa-red)' : 'transparent'}`,
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        background: active ? 'var(--sa-cream-2)' : 'transparent',
        color: 'var(--sa-ink)',
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        className="tnum"
        style={{ color: active ? 'var(--sa-red)' : 'var(--sa-ink-4)' }}
      >
        §{num}
      </span>
      <span style={{ color: 'var(--sa-ink)' }}>{label}</span>
    </button>
  );
}

/* ---------------- exported tab content ---------------- */

export function DetailsContent({
  report,
  cwvLoading,
  section,
  setSection,
  sectionDefs,
}: DetailsContentProps) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    function handler() {
      setIsNarrow(window.innerWidth < 768);
    }
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const sidebarStyle: CSSProperties = isNarrow
    ? {
        display: 'flex',
        gap: 0,
        overflowX: 'auto',
        borderBottom: '1px solid var(--sa-rule)',
        marginBottom: 16,
      }
    : {
        position: 'sticky',
        top: 24,
        alignSelf: 'start',
        borderRight: '1px solid var(--sa-rule)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      };

  const content = (() => {
    switch (section) {
      case 'headings':
        return (
          <HeadingsTab
            data={report.headings}
            keywords={report.keywords}
            url={report.url}
            spa={report.spa}
          />
        );
      case 'images':
        return <ImagesTab data={report.images} />;
      case 'links':
        return <LinksTab data={report.links} />;
      case 'technical':
        return <TechnicalTab data={report.technical} cwvLoading={cwvLoading} />;
      case 'metadata':
        return <MetadataTab data={report.metadata} />;
      case 'readability':
        return <ReadabilityTab data={report.readability} />;
      default:
        return null;
    }
  })();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : '240px 1fr',
        gap: 24,
      }}
    >
      <nav style={sidebarStyle}>
        {sectionDefs.map((s) => (
          <SectionNavEntry
            key={s.key}
            num={s.num}
            label={s.label}
            active={section === s.key}
            onClick={() => setSection(s.key)}
          />
        ))}
      </nav>
      <div>{content}</div>
    </div>
  );
}
