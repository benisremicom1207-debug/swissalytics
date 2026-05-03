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
            {/* Background Effects */}
            <div className="absolute inset-0 bg-black pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#DC2626]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-700" />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-gray-300">Nouvelle Génération d&apos;Audit</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
                        L&apos;excellence du Web <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DC2626] via-[#FF6B35] to-[#F59E0B]">
                            visible par les IA
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Analysez instantanément comment votre site est perçu par Google, ChatGPT et les nouvelles technologies de recherche.
                    </p>

                    {/* Input Section */}
                    <div className="max-w-2xl mx-auto mt-12 relative group">
                        <div className={`absolute -inset-1 bg-gradient-to-r from-[#DC2626] to-[#F59E0B] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 ${error ? 'opacity-50 from-red-500 to-red-600' : ''}`}></div>

                        <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 shadow-2xl">
                            <div className="flex-1 flex items-center w-full px-4">
                                <Search className="w-5 h-5 text-gray-500 mr-3" />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onAnalyze()}
                                    placeholder="https://votre-site.ch"
                                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-lg h-12"
                                    disabled={loading}
                                />
                            </div>
                            <button
                                onClick={onAnalyze}
                                disabled={loading}
                                className="w-full md:w-auto px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
                                className="absolute left-0 right-0 top-full mt-3 text-red-500 text-sm font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center justify-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>

                    {/* Quick Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-white/5 mt-16">
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <BarChart className="w-6 h-6" />
                            </div>
                            <div className="text-white font-semibold">SEO Technique & Perf</div>
                            <div className="text-sm text-gray-500">Core Web Vitals & Lighthouse</div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div className="text-white font-semibold">Ready for IA Search</div>
                            <div className="text-sm text-gray-500">Optimisation AIO & LLM</div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="text-white font-semibold">Visibilité Locale</div>
                            <div className="text-sm text-gray-500">E-E-A-T & Présence</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
