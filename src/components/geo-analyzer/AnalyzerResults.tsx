'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult } from './types';
import {
    BarChart2,
    BrainCircuit,
    CheckCircle2,
    ChevronRight,
    Download,
    Layout,
    Share2,
    Shield,
    Sparkles,
    Target,
    TrendingUp,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';

interface AnalyzerResultsProps {
    result: AnalysisResult;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
};

const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
};

export default function AnalyzerResults({ result }: AnalyzerResultsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'roadmap'>('overview');

    return (
        <div className="w-full max-w-7xl mx-auto pb-24">
            {/* Top Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-8"
            >
                <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-12">

                        {/* Global Score Gauge */}
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    className="text-gray-800"
                                />
                                <motion.circle
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: result.globalScore / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    className={`${getScoreColor(result.globalScore)} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                                    strokeDasharray="1 1"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-black ${getScoreColor(result.globalScore)}`}>
                                    {result.globalScore}
                                </span>
                                <span className="text-sm text-gray-400 font-medium uppercase tracking-wider mt-1">Global Score</span>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <span className="text-gray-400 font-medium">SEO Google</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{result.seo.score}/100</div>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${result.seo.score}%` }} />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                        <BrainCircuit className="w-5 h-5" />
                                    </div>
                                    <span className="text-gray-400 font-medium">Perception IA</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">{result.geo.score}/100</div>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${result.geo.score}%` }} />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <span className="text-gray-400 font-medium">Potentiel</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">+{result.projection.threeMonths.gain} pts</div>
                                <div className="text-xs text-purple-400">Possible en 3 mois</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-t border-white/10 bg-black/20">
                    {[
                        { id: 'overview', label: 'Vue d\'ensemble', icon: Layout },
                        { id: 'details', label: 'Détails Techniques', icon: BarChart2 },
                        { id: 'roadmap', label: 'Plan d\'Action', icon: TrendingUp },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && <OverviewTab result={result} />}
                    {activeTab === 'details' && <DetailsTab result={result} />}
                    {activeTab === 'roadmap' && <RoadmapTab result={result} />}
                </motion.div>
            </AnimatePresence>

            {/* Sticky CTA */}

        </div>
    );
}

// Sub-components for Tabs

function OverviewTab({ result }: { result: AnalysisResult }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* High Priority Actions */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" />
                    Actions Prioritaires
                </h3>
                <div className="space-y-4">
                    {result.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').slice(0, 3).map((rec, i) => (
                        <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-xl flex gap-4">
                            <div className={`w-1 h-full rounded-full flex-shrink-0 ${rec.priority === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                            <div>
                                <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                                <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className={`px-2 py-0.5 rounded bg-white/5 border border-white/10 ${rec.priority === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                        {rec.priority.toUpperCase()}
                                    </span>
                                    <span className="text-green-400">Impact: +{rec.impact} pts</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Projection */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-green-500" />
                    Projection de Croissance
                </h3>

                <div className="relative pt-8">
                    <div className="flex items-end justify-between text-center max-w-sm mx-auto">
                        <div>
                            <div className="text-3xl font-bold text-gray-400 mb-2">{result.globalScore}</div>
                            <div className="h-16 w-12 bg-gray-700 mx-auto rounded-t-lg opacity-50"></div>
                            <div className="text-xs text-gray-500 mt-2">Actuel</div>
                        </div>
                        <div className="mb-8">
                            <ChevronRight className="text-gray-600" />
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-amber-500 mb-2">{result.projection.threeMonths.estimatedScore}</div>
                            <div className="h-24 w-12 bg-gradient-to-t from-amber-600 to-amber-400 mx-auto rounded-t-lg shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                            <div className="text-xs text-amber-400 mt-2 font-bold">3 Mois</div>
                        </div>
                        <div className="mb-8">
                            <ChevronRight className="text-gray-600" />
                        </div>
                        <div>
                            <div className="text-5xl font-bold text-green-500 mb-2">{result.projection.sixMonths.estimatedScore}</div>
                            <div className="h-32 w-12 bg-gradient-to-t from-green-600 to-green-400 mx-auto rounded-t-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>
                            <div className="text-xs text-green-400 mt-2 font-bold">6 Mois</div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5 text-sm text-gray-300 text-center">
                        "Avec ces optimisations, votre site sera référencé comme <span className="text-amber-400 font-semibold">source de confiance</span> par ChatGPT et Claude d'ici 90 jours."
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailsTab({ result }: { result: AnalysisResult }) {
    return (
        <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="space-y-12">
                {/* Lighthouse */}
                <div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Layout className="text-blue-500" />
                        Performance & SEO (Lighthouse)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(result.seo.lighthouse).map(([key, val]) => {
                            if (typeof val !== 'number') return null;
                            return (
                                <div key={key} className="bg-black/20 rounded-xl p-4 text-center border border-white/5">
                                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(val)}`}>{Math.round(val)}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AI Engines */}
                <div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <BrainCircuit className="text-amber-500" />
                        Indexation IA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(result.geo.indexation.engines).map(([name, data]) => (
                            <div key={name} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
                                <div>
                                    <div className="font-semibold text-white capitalize">{data.name?.split(' ')[0] || name}</div>
                                    <div className="text-xs text-gray-500">{data.mentions} mentions détectées</div>
                                </div>
                                {data.indexed ? (
                                    <CheckCircle2 className="text-green-500 w-6 h-6" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-600" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Schema & Trust */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-white mb-4">Données Structurées</h4>
                        <div className="space-y-2">
                            {Object.entries(result.geo.schema.schemas).map(([key, found]) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                    <span className="text-sm text-gray-300 capitalize">{key}</span>
                                    <span className={found ? 'text-green-500 text-sm font-bold' : 'text-red-500 text-sm'}>
                                        {found ? 'Validé' : 'Manquant'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Indices de Confiance (E-E-A-T)</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                <span className="text-sm text-gray-300">Page Équipe</span>
                                <span className={result.geo.eeat.signals.teamPage.found ? 'text-green-500' : 'text-gray-500'}>
                                    {result.geo.eeat.signals.teamPage.found ? 'Détectée' : 'Non trouvée'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                <span className="text-sm text-gray-300">Mentions Légales</span>
                                <span className={result.geo.eeat.signals.legalMentions ? 'text-green-500' : 'text-gray-500'}>
                                    {result.geo.eeat.signals.legalMentions ? 'Conforme' : 'Incomplet'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                <span className="text-sm text-gray-300">Témoignages Clients</span>
                                <span className={result.geo.eeat.signals.testimonials.found ? 'text-green-500' : 'text-gray-500'}>
                                    {result.geo.eeat.signals.testimonials.count > 0 ? `${result.geo.eeat.signals.testimonials.count} trouvés` : 'Absents'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoadmapTab({ result }: { result: AnalysisResult }) {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Votre Plan de Victoire</h3>
                <p className="text-gray-300 mb-6">Suivez ces étapes pour dominer la recherche IA dans votre secteur.</p>

                <div className="space-y-4">
                    {result.projection.threeMonths.requiredActions.map((action, i) => (
                        <div key={i} className="flex gap-4 items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                                {i + 1}
                            </div>
                            <div className="pt-1">
                                <p className="text-white font-medium">{action}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center">
                <h4 className="text-2xl font-bold text-white mb-4">Besoin d'aide pour l'implémentation ?</h4>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                    Notre équipe a déjà aidé plus de 50 PME suisses à optimiser leur présence GEO. Ne laissez pas vos concurrents prendre l'avance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Obtenir l'audit complet (PDF)
                    </button>
                    <a
                        href="/portfolio"
                        className="px-6 py-3 border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center"
                    >
                        Voir nos cas clients
                    </a>
                </div>
            </div>
        </div>
    );
}
