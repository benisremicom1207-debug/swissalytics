'use client';

interface DegradedBannerProps {
  isFr: boolean;
}

export default function DegradedBanner({ isFr }: DegradedBannerProps) {
  return (
    <div
      role="status"
      style={{
        border: '2px solid var(--sa-red)',
        background: 'var(--sa-cream)',
        padding: '16px 20px',
        margin: '0 0 24px 0',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 16,
          lineHeight: 1.4,
          color: 'var(--sa-red)',
          fontWeight: 700,
        }}
      >
        ⚠
      </span>
      <div style={{ flex: 1 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-red)',
            marginBottom: 6,
          }}
        >
          {isFr ? 'Sauvegarde indisponible' : 'Storage unavailable'}
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--sa-ink)', margin: 0 }}>
          {isFr
            ? "Votre rapport est affiché ici, mais ne pourra pas être consulté à nouveau plus tard ou partagé. Téléchargez le PDF si vous voulez le garder."
            : 'Your report is displayed here, but cannot be revisited later or shared. Download the PDF to keep it.'}
        </p>
      </div>
    </div>
  );
}
