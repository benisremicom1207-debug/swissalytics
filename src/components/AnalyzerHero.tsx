'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Search, Zap, Globe, BarChart } from 'lucide-react';

interface AnalyzerHeroProps {
    url: string;
    setUrl: (url: string) => void;
    onAnalyze: () => void;
    loading: boolean;
    error?: string;
}

export default function AnalyzerHero({ url, setUrl, onAnalyze, loading, error }: AnalyzerHeroProps) {
    return (
        <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-tertiary border border-border-secondary backdrop-blur-sm mb-4">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
                        </span>
                        <span className="text-sm font-medium text-text-secondary">Analyse Gratuite</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text-primary mb-6">
                        Votre site est-il <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#06b6d4]">
                            visible par les IA ?
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-text-tertiary max-w-2xl mx-auto leading-relaxed">
                        Swissalytics analyse instantanément comment votre site est perçu par Google, ChatGPT et les nouvelles technologies de recherche.
                    </p>

                    {/* Input Section */}
                    <div className="max-w-2xl mx-auto mt-12">
                        <div className="relative bg-surface-elevated border border-border-primary rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 shadow-lg">
                            <div className="flex-1 flex items-center w-full px-4">
                                <Search className="w-5 h-5 text-text-quaternary mr-3" />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onAnalyze()}
                                    placeholder="https://votre-site.com"
                                    className="w-full bg-transparent border-none focus:ring-0 text-text-primary placeholder-text-quaternary text-lg h-12 focus:outline-none"
                                    disabled={loading}
                                    aria-label="URL du site à analyser"
                                />
                            </div>
                            <button
                                onClick={onAnalyze}
                                disabled={loading}
                                className="w-full md:w-auto px-8 py-3 bg-accent text-accent-text font-bold rounded-xl hover:bg-accent-hover transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-accent-text/30 border-t-accent-text rounded-full animate-spin" />
                                        <span>Analyse...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Analyser</span>
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 text-status-error text-sm font-medium bg-status-error/10 border border-status-error/20 p-3 rounded-lg flex items-center justify-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>

                    {/* Quick Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-border-secondary mt-16">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-surface-tertiary rounded-xl text-text-tertiary">
                                <BarChart className="w-6 h-6" />
                            </div>
                            <div className="text-text-primary font-semibold">SEO Technique & Perf</div>
                            <div className="text-sm text-text-quaternary">Core Web Vitals & Lighthouse</div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-surface-tertiary rounded-xl text-text-tertiary">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div className="text-text-primary font-semibold">Ready for IA Search</div>
                            <div className="text-sm text-text-quaternary">Optimisation AIO & LLM</div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-surface-tertiary rounded-xl text-text-tertiary">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="text-text-primary font-semibold">Visibilité Locale</div>
                            <div className="text-sm text-text-quaternary">E-E-A-T & Presence</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
