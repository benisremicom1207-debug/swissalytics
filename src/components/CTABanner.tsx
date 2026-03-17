'use client';

import { ArrowRight, FileDown } from 'lucide-react';

interface CTABannerProps {
  variant?: 'inline' | 'card';
  onExport?: () => void;
}

export default function CTABanner({ variant = 'inline', onExport }: CTABannerProps) {
  if (variant === 'inline') {
    return (
      <div className="mt-8 flex items-center justify-between p-4 bg-surface-tertiary rounded-xl border border-border-secondary">
        <p className="text-sm text-text-secondary">
          Besoin d&apos;un audit approfondi avec des recommandations sur mesure ?
        </p>
        <a
          href="https://pixelab.ch/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-text text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors whitespace-nowrap"
        >
          Demander un audit
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-8 text-center">
      <h4 className="text-2xl font-bold text-text-primary mb-3">
        Analyse SEO complète et personnalisée
      </h4>
      <p className="text-text-tertiary mb-8 max-w-lg mx-auto">
        Cette analyse gratuite couvre les fondamentaux. Pour un audit approfondi avec des recommandations sur mesure, notre équipe vous accompagne.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="https://pixelab.ch/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-accent text-accent-text font-bold rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
        >
          Demander un audit complet
          <ArrowRight className="w-4 h-4" />
        </a>
        <button
          onClick={() => onExport ? onExport() : window.print()}
          className="px-6 py-3 border border-border-primary text-text-secondary font-bold rounded-lg hover:bg-surface-tertiary transition-colors flex items-center justify-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          Exporter ce rapport
        </button>
      </div>
    </div>
  );
}
