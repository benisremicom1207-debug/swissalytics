'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Gauge, Search, Image, Link2, FileText } from 'lucide-react';

interface AnalyzerLoadingProps {
  step: number;
}

const steps = [
  { id: 1, label: 'Performance & Architecture', icon: Gauge, desc: 'Analyse Core Web Vitals...' },
  { id: 2, label: 'Structure Sémantique', icon: Search, desc: 'Vérification des headings et balises...' },
  { id: 3, label: 'Images & Medias', icon: Image, desc: 'Audit des attributs alt et formats...' },
  { id: 4, label: 'Liens & Navigation', icon: Link2, desc: 'Analyse des liens internes et externes...' },
  { id: 5, label: 'Contenu & Lisibilité', icon: FileText, desc: 'Évaluation Flesch et métadonnées...' },
];

export default function AnalyzerLoading({ step }: AnalyzerLoadingProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <div className="bg-surface-secondary backdrop-blur-md rounded-2xl border border-border-primary p-8 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
            Analyse en cours...
          </h3>
          <span className="text-sm font-mono text-text-tertiary">
            {Math.min(step * 20, 99)}%
          </span>
        </div>

        <div className="space-y-6">
          {steps.map((s) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            const Icon = s.icon;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: s.id * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  isActive ? 'bg-surface-tertiary border border-border-primary' : 'border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-status-success/20 text-status-success' :
                  isActive ? 'bg-surface-tertiary text-text-secondary' :
                  'bg-surface-tertiary text-text-quaternary'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> :
                   isActive ? <Loader2 size={20} className="animate-spin" /> :
                   <Icon size={20} />}
                </div>

                <div className="flex-1">
                  <div className={`font-medium ${
                    isCompleted ? 'text-text-tertiary' :
                    isActive ? 'text-text-primary' :
                    'text-text-quaternary'
                  }`}>
                    {s.label}
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-text-tertiary mt-1"
                    >
                      {s.desc}
                    </motion.div>
                  )}
                </div>

                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1 rounded-full bg-status-success/10 text-status-success text-xs font-medium"
                  >
                    Terminé
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
