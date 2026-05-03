'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisResult } from '@/lib/types';
import { getIssueTip } from '@/lib/issueTips';
import {
    BarChart2,
    CheckCircle2,
    ChevronRight,
    Layout,
    TrendingUp,
    AlertTriangle,
    BookOpen,
    Type,
    Settings,
    Image as ImageIcon,
    Link2,
    FileText,
    Tag,
} from 'lucide-react';
import HeadingsTab from './tabs/HeadingsTab';
import ImagesTab from './tabs/ImagesTab';
import LinksTab from './tabs/LinksTab';
import TechnicalTab from './tabs/TechnicalTab';
import MetadataTab from './tabs/MetadataTab';
import ReadabilityTab from './tabs/ReadabilityTab';
import CTABanner from './CTABanner';
import { generatePdfReport } from '@/lib/pdf/generateReport';

interface AnalyzerResultsProps {
    result: AnalysisResult;
    cwvLoading?: boolean;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-status-success';
    if (score >= 60) return 'text-status-warning';
    return 'text-status-error';
};

const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-status-success';
    if (score >= 60) return 'bg-status-warning';
    return 'bg-status-error';
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AnalyzerResults({ result, cwvLoading }: AnalyzerResultsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'roadmap'>('overview');

    const allIssues = useMemo(() => [
        ...result.headings.issues,
        ...result.images.issues,
        ...result.links.issues,
        ...result.technical.issues,
        ...result.metadata.issues,
        ...result.readability.issues,
        ...result.keywords.issues,
    ], [result]);
    const criticalCount = allIssues.filter(i => i.type === 'error').length;
    const warningCount = allIssues.filter(i => i.type === 'warning').length;
    const totalIssues = criticalCount + warningCount;

    return (
        <div className="w-full max-w-7xl mx-auto pb-24">
            {/* Top Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-secondary border border-border-primary rounded-3xl overflow-hidden shadow-lg mb-8"
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
                                    className="text-gauge-track"
                                />
                                <motion.circle
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: result.score / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    className={getScoreColor(result.score)}
                                    strokeDasharray="1 1"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                                    {result.score}
                                </span>
                                <span className="text-xs text-text-quaternary mt-1">{totalIssues} problème{totalIssues !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-surface-tertiary rounded-2xl p-5 border border-border-secondary">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-surface-secondary rounded-lg text-text-tertiary">
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <span className="text-text-tertiary font-medium">SEO Technique</span>
                                </div>
                                <div className="text-3xl font-bold text-text-primary mb-1">{result.technical.score}/100</div>
                                <div className="w-full bg-gauge-track h-1.5 rounded-full overflow-hidden">
                                    <div className={`${getScoreBg(result.technical.score)} h-full rounded-full`} style={{ width: `${result.technical.score}%` }} />
                                </div>
                            </div>

                            <div className="bg-surface-tertiary rounded-2xl p-5 border border-border-secondary">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-surface-secondary rounded-lg text-text-tertiary">
                                        <Type className="w-5 h-5" />
                                    </div>
                                    <span className="text-text-tertiary font-medium">Contenu</span>
                                </div>
                                <div className="text-3xl font-bold text-text-primary mb-1">{result.headings.score}/100</div>
                                <div className="w-full bg-gauge-track h-1.5 rounded-full overflow-hidden">
                                    <div className={`${getScoreBg(result.headings.score)} h-full rounded-full`} style={{ width: `${result.headings.score}%` }} />
                                </div>
                            </div>

                            <div className="bg-surface-tertiary rounded-2xl p-5 border border-border-secondary">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-surface-secondary rounded-lg text-text-tertiary">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <span className="text-text-tertiary font-medium">Lisibilité</span>
                                </div>
                                <div className="text-3xl font-bold text-text-primary mb-1">{result.readability.score}/100</div>
                                <div className="w-full bg-gauge-track h-1.5 rounded-full overflow-hidden">
                                    <div className={`${getScoreBg(result.readability.score)} h-full rounded-full`} style={{ width: `${result.readability.score}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div role="tablist" className="flex border-t border-border-primary bg-surface-primary">
                    {[
                        { id: 'overview', label: 'Tableau de bord', icon: Layout },
                        { id: 'details', label: 'Détails Techniques', icon: BarChart2 },
                        { id: 'roadmap', label: 'Plan d\'Action', icon: TrendingUp },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id as 'overview' | 'details' | 'roadmap')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-text-primary' : 'text-text-quaternary hover:text-text-secondary'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
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
                    role="tabpanel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && <OverviewTab result={result} />}
                    {activeTab === 'details' && <DetailsTab result={result} cwvLoading={cwvLoading} />}
                    {activeTab === 'roadmap' && <RoadmapTab result={result} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ========== OVERVIEW TAB ==========
function OverviewTab({ result }: { result: AnalysisResult }) {
    const allIssues = [
        ...result.headings.issues,
        ...result.images.issues,
        ...result.links.issues,
        ...result.technical.issues,
        ...result.metadata.issues,
        ...result.readability.issues,
        ...result.keywords.issues,
    ];

    const criticalIssues = allIssues.filter(i => i.type === 'error');
    const warningIssues = allIssues.filter(i => i.type === 'warning');

    const estimatedScore3m = Math.min(100, result.score + Math.round((100 - result.score) * 0.5));
    const estimatedScore6m = Math.min(100, result.score + Math.round((100 - result.score) * 0.8));

    const categories = [
        { key: 'headings' as const, label: 'Headings' },
        { key: 'images' as const, label: 'Images' },
        { key: 'links' as const, label: 'Liens' },
        { key: 'technical' as const, label: 'Technique' },
        { key: 'metadata' as const, label: 'Metadata' },
        { key: 'readability' as const, label: 'Lisibilité' },
    ];

    return (
        <div className="space-y-8">
            {/* Quick Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Headings summary */}
                <div className="bg-surface-secondary border border-border-primary rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Type className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm font-medium text-text-tertiary">Headings</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { tag: 'H1', count: result.headings.h1.length },
                            { tag: 'H2', count: result.headings.h2.length },
                            { tag: 'H3', count: result.headings.h3.length },
                            { tag: 'H4', count: result.headings.h4.length },
                            { tag: 'H5', count: result.headings.h5.length },
                            { tag: 'H6', count: result.headings.h6.length },
                        ].map(h => (
                            <div key={h.tag} className="flex items-center justify-between px-2 py-1.5 bg-surface-tertiary rounded-lg">
                                <span className="text-xs font-bold text-text-tertiary">{h.tag}</span>
                                <span className="text-sm font-bold text-text-primary">{h.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images summary */}
                <div className="bg-surface-secondary border border-border-primary rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm font-medium text-text-tertiary">Images</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-text-primary">{result.images.total}</span>
                        <span className="text-sm text-text-quaternary">total</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                        <span className="text-status-success">{result.images.withAlt} alt</span>
                        {result.images.withoutAlt > 0 && (
                            <span className="text-status-error">{result.images.withoutAlt} missing</span>
                        )}
                    </div>
                </div>

                {/* Links summary */}
                <div className="bg-surface-secondary border border-border-primary rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Link2 className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm font-medium text-text-tertiary">Liens</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-text-primary">{result.links.total}</span>
                        <span className="text-sm text-text-quaternary">total</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                        <span className="text-text-secondary">{result.links.internal.length} int</span>
                        <span className="text-text-tertiary">{result.links.external.length} ext</span>
                    </div>
                </div>
            </div>

            {/* Tech Stack + HTML Size + Keywords Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CMS & Tech */}
                <div className="bg-surface-secondary border border-border-primary rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-text-quaternary" />
                        <span className="text-xs text-text-quaternary uppercase tracking-wider">CMS</span>
                        <span className="text-sm font-bold text-text-primary ml-auto">{result.technical.cms || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-text-quaternary" />
                        <span className="text-xs text-text-quaternary uppercase tracking-wider">Tech Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {result.technical.technologies.length > 0 ? (
                            result.technical.technologies.slice(0, 5).map(tech => (
                                <span key={tech} className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-secondary border border-border-secondary">
                                    {tech}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-text-quaternary">Aucune détectée</span>
                        )}
                        {result.technical.technologies.length > 5 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-tertiary border border-border-secondary">
                                +{result.technical.technologies.length - 5}
                            </span>
                        )}
                    </div>
                </div>

                {/* HTML Size */}
                <div className="bg-surface-secondary border border-border-primary rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-text-quaternary" />
                        <span className="text-xs text-text-quaternary uppercase tracking-wider">Taille HTML</span>
                        <span className="text-sm font-bold text-text-primary ml-auto">{formatBytes(result.technical.htmlSize)}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'robots.txt', exists: result.technical.robotsTxt.exists },
                            { label: 'sitemap.xml', exists: result.technical.sitemap.exists },
                            { label: 'llms.txt', exists: result.technical.llmsTxt.exists },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                                <span className="text-text-tertiary">{item.label}</span>
                                {item.exists ? (
                                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                                ) : (
                                    <span className="text-status-error text-xs">&#10005;</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keywords */}
                <div className="bg-surface-secondary border border-border-primary rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-text-tertiary" />
                        <span className="text-xs text-text-quaternary uppercase tracking-wider">Mots-clés</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {result.keywords.keywords.slice(0, 8).map(kw => (
                            <span key={kw.word} className="text-xs px-2 py-1 rounded-full bg-surface-tertiary text-text-secondary border border-border-secondary">
                                {kw.word} <span className="text-text-quaternary">{kw.count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Two column: Recommendations + Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recommendations — limit to top 5 */}
                <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-status-error" />
                        Recommandations
                    </h3>
                    <div className="space-y-4">
                        {criticalIssues.length === 0 && warningIssues.length === 0 ? (
                            <div className="flex items-center gap-3 p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
                                <CheckCircle2 className="text-status-success w-5 h-5" />
                                <span className="text-status-success font-medium">Aucun problème critique détecté</span>
                            </div>
                        ) : (
                            [...criticalIssues, ...warningIssues].slice(0, 5).map((issue, i) => {
                                const tip = getIssueTip(issue.message);
                                return (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${issue.type === 'error' ? 'bg-status-error/20 text-status-error' : 'bg-status-warning/20 text-status-warning'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="text-sm text-text-secondary">{issue.message}</p>
                                            {tip && <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{tip}</p>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Category scores + Projection */}
                <div className="space-y-6">
                    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6">
                        <h4 className="font-semibold text-text-primary mb-4">Scores par Catégorie</h4>
                        <div className="space-y-3">
                            {categories.map(({ key, label }) => {
                                const data = result[key];
                                return (
                                    <div key={key} className="flex items-center justify-between p-3 bg-surface-tertiary rounded-lg">
                                        <span className="text-sm text-text-secondary">{label}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 bg-gauge-track h-1.5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getScoreBg(data.score)}`} style={{ width: `${data.score}%` }} />
                                            </div>
                                            <span className={`text-sm font-bold w-8 text-right ${getScoreColor(data.score)}`}>{data.score}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mini projection */}
                    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6">
                        <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <TrendingUp className="text-status-success w-4 h-4" />
                            Projection
                        </h4>
                        <div className="flex items-end justify-between text-center">
                            <div>
                                <div className="text-2xl font-bold text-text-tertiary">{result.score}</div>
                                <div className="text-xs text-text-quaternary mt-1">Actuel</div>
                            </div>
                            <ChevronRight className="text-text-quaternary mb-4" />
                            <div>
                                <div className="text-3xl font-bold text-status-warning">{estimatedScore3m}</div>
                                <div className="text-xs text-status-warning mt-1">3 Mois</div>
                            </div>
                            <ChevronRight className="text-text-quaternary mb-4" />
                            <div>
                                <div className="text-4xl font-bold text-status-success">{estimatedScore6m}</div>
                                <div className="text-xs text-status-success mt-1">6 Mois</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ========== DETAILS TAB ==========
function DetailsTab({ result, cwvLoading }: { result: AnalysisResult; cwvLoading?: boolean }) {
    const [activeSection, setActiveSection] = useState('headings');

    const sections = [
        { id: 'headings' as const, label: 'Headings', icon: Type, score: result.headings.score },
        { id: 'images' as const, label: 'Images', icon: ImageIcon, score: result.images.score },
        { id: 'links' as const, label: 'Liens', icon: Link2, score: result.links.score },
        { id: 'technical' as const, label: 'Technique', icon: Settings, score: result.technical.score },
        { id: 'metadata' as const, label: 'Metadata', icon: Layout, score: result.metadata.score },
        { id: 'readability' as const, label: 'Lisibilité', icon: BookOpen, score: result.readability.score },
    ];

    return (
        <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
                {sections.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                            activeSection === s.id
                                ? 'bg-surface-tertiary text-text-primary border border-border-primary'
                                : 'text-text-quaternary hover:text-text-secondary border border-transparent'
                        }`}
                    >
                        <s.icon className="w-4 h-4" />
                        {s.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getScoreBg(s.score)} text-white`}>
                            {s.score}
                        </span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                >
                    {activeSection === 'headings' && <HeadingsTab data={result.headings} keywords={result.keywords} url={result.url} />}
                    {activeSection === 'images' && <ImagesTab data={result.images} />}
                    {activeSection === 'links' && <LinksTab data={result.links} />}
                    {activeSection === 'technical' && <TechnicalTab data={result.technical} cwvLoading={cwvLoading} />}
                    {activeSection === 'metadata' && <MetadataTab data={result.metadata} />}
                    {activeSection === 'readability' && <ReadabilityTab data={result.readability} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ========== ROADMAP TAB ==========
function RoadmapTab({ result }: { result: AnalysisResult }) {
    const allIssues = [
        ...result.headings.issues.map(i => ({ ...i, category: 'Headings' })),
        ...result.images.issues.map(i => ({ ...i, category: 'Images' })),
        ...result.links.issues.map(i => ({ ...i, category: 'Liens' })),
        ...result.technical.issues.map(i => ({ ...i, category: 'Technique' })),
        ...result.metadata.issues.map(i => ({ ...i, category: 'Metadata' })),
        ...result.readability.issues.map(i => ({ ...i, category: 'Lisibilité' })),
        ...result.keywords.issues.map(i => ({ ...i, category: 'Mots-clés' })),
    ];

    const criticalActions = allIssues.filter(i => i.type === 'error');
    const warningActions = allIssues.filter(i => i.type === 'warning');
    const infoActions = allIssues.filter(i => i.type === 'info');

    return (
        <div className="space-y-6">
            <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Votre Plan d&apos;Optimisation</h3>
                <p className="text-text-tertiary mb-6">Suivez ces étapes pour améliorer votre score SEO. Les actions sont classées par ordre de priorité.</p>

                {criticalActions.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-sm font-semibold text-status-error uppercase tracking-wider mb-4">
                            Critiques — À corriger immédiatement ({criticalActions.length})
                        </h4>
                        <div className="space-y-4">
                            {criticalActions.map((action, i) => {
                                const tip = getIssueTip(action.message);
                                return (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-status-error/20 text-status-error flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-text-primary font-medium">{action.message}</p>
                                            {tip && <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{tip}</p>}
                                            <span className="text-xs text-text-quaternary">{action.category}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {warningActions.length > 0 && (
                    <div className="mb-8">
                        <h4 className="text-sm font-semibold text-status-warning uppercase tracking-wider mb-4">
                            Améliorations recommandées ({warningActions.length})
                        </h4>
                        <div className="space-y-4">
                            {warningActions.map((action, i) => {
                                const tip = getIssueTip(action.message);
                                return (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-status-warning/20 text-status-warning flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-text-primary font-medium">{action.message}</p>
                                            {tip && <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{tip}</p>}
                                            <span className="text-xs text-text-quaternary">{action.category}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {infoActions.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">
                            Suggestions ({infoActions.length})
                        </h4>
                        <div className="space-y-4">
                            {infoActions.map((action, i) => {
                                const tip = getIssueTip(action.message);
                                return (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-tertiary text-text-tertiary flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-text-primary font-medium">{action.message}</p>
                                            {tip && <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{tip}</p>}
                                            <span className="text-xs text-text-quaternary">{action.category}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <CTABanner variant="card" onExport={() => generatePdfReport(result)} />
        </div>
    );
}
