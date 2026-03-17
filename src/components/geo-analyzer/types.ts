export interface AnalysisResult {
    url: string;
    timestamp: string;
    globalScore: number;
    category: 'Excellent' | 'Bon' | 'Moyen' | 'Faible' | 'Critique';
    seo: {
        score: number;
        breakdown: {
            lighthouse: number;
            technicalSEO: number;
            content: number;
        };
        lighthouse: {
            performance: number;
            accessibility: number;
            bestPractices: number;
            seo: number;
            isEstimated?: boolean;
            warning?: string;
        };
    };
    geo: {
        score: number;
        breakdown: {
            indexation: number;
            schema: number;
            eeat: number;
        };
        indexation: {
            score: number;
            totalIndexed: number;
            totalEnabled: number;
            region?: string;
            engines: Record<string, {
                indexed: boolean;
                confidence: string;
                mentions: number;
                name?: string;
                company?: string;
            }>;
        };
        schema: {
            score: number;
            totalFound: number;
            schemas: {
                organization: boolean;
                author: boolean;
                faqPage: boolean;
                breadcrumb: boolean;
                article: boolean;
                website: boolean;
            };
        };
        eeat: {
            score: number;
            signals: {
                teamPage: { found: boolean };
                legalMentions: boolean;
                contactPage: { found: boolean };
                testimonials: { found: boolean; count: number };
            };
        };
    };
    recommendations: Array<{
        priority: 'critical' | 'high' | 'medium' | 'low';
        title: string;
        description: string;
        impact: number;
        difficulty: 'low' | 'medium' | 'high';
        category: 'seo' | 'geo';
        timeframe: string;
    }>;
    projection: {
        threeMonths: {
            estimatedScore: number;
            gain: number;
            quickWins: string[];
            requiredActions: string[];
        };
        sixMonths: {
            estimatedScore: number;
            gain: number;
            quickWins: string[];
            requiredActions: string[];
        };
    };
    warnings?: string[];
    warningMessage?: string;
}
