'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, ShieldCheck, Search, Database, Gauge, Globe } from 'lucide-react';

interface AnalyzerLoadingProps {
    step: number;
}

const steps = [
    { id: 1, label: 'Performance & Architecture', icon: Gauge, desc: 'Analyse Core Web Vitals...' },
    { id: 2, label: 'Structure Sémantique', icon: Search, desc: 'Vérification des balises...' },
    { id: 3, label: 'Perception IA', icon: Globe, desc: 'Simulation des crawlers LLM...' },
    { id: 4, label: 'Données Structurées', icon: Database, desc: 'Validation Schema.org...' },
    { id: 5, label: 'Signaux de Confiance', icon: ShieldCheck, desc: 'Audit E-E-A-T...' },
];

export default function AnalyzerLoading({ step }: AnalyzerLoadingProps) {
    return (
        <div className="w-full max-w-2xl mx-auto py-12">
            <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                        Analyse en cours...
                    </h3>
                    <span className="text-sm font-mono text-amber-500">
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
                                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isActive ? 'bg-white/5 border border-white/10' : 'border border-transparent'
                                    }`}
                            >
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isCompleted ? 'bg-green-500/20 text-green-500' :
                                        isActive ? 'bg-amber-500/20 text-amber-500' :
                                            'bg-gray-800 text-gray-500'}
                `}>
                                    {isCompleted ? <CheckCircle2 size={20} /> :
                                        isActive ? <Loader2 size={20} className="animate-spin" /> :
                                            <Icon size={20} />}
                                </div>

                                <div className="flex-1">
                                    <div className={`font-medium ${isCompleted ? 'text-gray-300' :
                                            isActive ? 'text-white' :
                                                'text-gray-500'
                                        }`}>
                                        {s.label}
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-amber-500 mt-1"
                                        >
                                            {s.desc}
                                        </motion.div>
                                    )}
                                </div>

                                {isCompleted && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium"
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
