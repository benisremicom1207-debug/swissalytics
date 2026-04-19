'use client';

import { ArrowRight, FileDown } from 'lucide-react';

interface CTABannerProps {
  variant?: 'inline' | 'card';
  onExport?: () => void;
}

export default function CTABanner({ variant = 'inline', onExport }: CTABannerProps) {
  if (variant === 'inline') {
    return (
      <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border-2 border-ink bg-cream-2">
        <div className="flex items-start gap-4">
          <span className="font-mono text-[11px] font-bold tracking-[.12em] uppercase text-sa-red pt-1">
            §99
          </span>
          <p className="text-[15px] leading-[1.45] text-ink max-w-[520px]">
            Besoin d'un audit approfondi&nbsp;? Notre équipe chez{' '}
            <span className="font-semibold">Pixelab</span> construit des recommandations sur mesure.
          </p>
        </div>
        <a
          href="https://pixelab.ch/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-sa-red hover:bg-sa-red-ink text-cream font-sans font-extrabold text-[12px] tracking-[.06em] uppercase border-2 border-ink transition-colors whitespace-nowrap"
        >
          Demander un audit
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
        </a>
      </div>
    );
  }

  return (
    <div className="sa-frame bg-cream">
      {/* Caption strip */}
      <div className="flex items-center justify-between px-6 py-3 border-b-2 border-ink bg-ink text-cream">
        <span className="font-mono text-[11px] font-bold tracking-[.12em] uppercase">
          §99 — Prochaine étape
        </span>
        <span className="font-mono text-[11px] tracking-[.12em] uppercase opacity-70">
          Pixelab · CH
        </span>
      </div>

      <div className="px-8 md:px-12 py-12 grid md:grid-cols-[1.4fr_1fr] gap-10 items-end">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[.1em] uppercase text-sa-red mb-4">
            ● Audit complet sur mesure
          </p>
          <h4 className="font-sans font-extrabold tracking-tight-3 leading-[.95] text-4xl md:text-5xl text-ink mb-5">
            Cet audit gratuit couvre<br />
            les <span className="italic font-semibold">fondamentaux</span>.
          </h4>
          <p className="text-[16px] leading-[1.5] text-ink-2 max-w-[460px]">
            Pour un diagnostic approfondi — avec recommandations, priorisation et un plan d'action
            sur 3–6 mois — notre équipe vous accompagne.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <a
            href="https://pixelab.ch/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-sa-red hover:bg-sa-red-ink text-cream font-sans font-extrabold text-[13px] tracking-[.06em] uppercase border-2 border-ink transition-colors"
          >
            Demander un audit complet
            <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
          </a>
          <button
            onClick={() => (onExport ? onExport() : window.print())}
            className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-cream hover:bg-cream-2 text-ink font-sans font-extrabold text-[13px] tracking-[.06em] uppercase border-2 border-ink transition-colors"
          >
            <FileDown className="w-4 h-4" strokeWidth={2.25} />
            Exporter ce rapport
          </button>
        </div>
      </div>
    </div>
  );
}
