'use client';

import { useState, useRef } from 'react';
import type { AnalysisResult } from '@/lib/types';
import { calculateGlobalScore } from '@/lib/analyzer/score';
import AnalyzerHero from '@/components/AnalyzerHero';
import AnalyzerLoading from '@/components/AnalyzerLoading';
import ReportView from '@/components/report/ReportView';
import Shell from '@/components/design-system/Shell';
import { useTheme } from '@/components/design-system/ThemeProvider';
import { Pixel } from '@/components/design-system/primitives';

function isSelfAnalysis(input: string): boolean {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
  return ['swissalytics.com', 'swissalytics.ch', 'swissalytics.jcloud.ik-server.com'].includes(normalized);
}

export default function HomePage() {
  const { lang } = useTheme();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [degraded, setDegraded] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [cwvLoading, setCwvLoading] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!url) {
      setError(lang === 'fr' ? 'Veuillez entrer une URL valide' : 'Please enter a valid URL');
      return;
    }

    let validatedUrl = url.trim();
    if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
      validatedUrl = 'https://' + validatedUrl;
    }

    if (isSelfAnalysis(validatedUrl)) {
      setEasterEgg(true);
      setResult(null);
      setError('');
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    setEasterEgg(false);
    setLoading(true);
    setError('');
    setResult(null);
    setReportId(null);
    setDegraded(false);
    setLoadingStep(0);

    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 3000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validatedUrl }),
      });

      clearInterval(stepInterval);
      setLoadingStep(5);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Erreur lors de l'analyse");
      }

      const data = await response.json();
      // API now returns { reportId, report, degraded? } — backward compatible with legacy { ...report }
      const report: AnalysisResult = data.report ?? data;
      const id: string | null | undefined = data.reportId;
      setResult(report);
      setReportId(id ?? null);
      setDegraded(Boolean(data.degraded));
      setCwvLoading(true);

      fetch('/api/geo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validatedUrl }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((geoData) => {
          if (!geoData) return;
          setResult((prev) => (prev ? { ...prev, geoAnalysis: geoData } : prev));
        })
        .catch(() => {});

      fetch('/api/analyze/cwv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validatedUrl }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((cwvData) => {
          if (!cwvData?.coreWebVitals || (!cwvData.coreWebVitals.mobile && !cwvData.coreWebVitals.desktop)) return;
          setResult((prev) => {
            if (!prev) return prev;
            const newTechScore = Math.max(0, prev.technical.score - cwvData.cwvScorePenalty);
            const updatedTechnical = {
              ...prev.technical,
              coreWebVitals: cwvData.coreWebVitals,
              score: newTechScore,
              issues: [...prev.technical.issues, ...cwvData.cwvIssues],
            };
            const newGlobal = calculateGlobalScore({ ...prev, technical: updatedTechnical });
            return { ...prev, technical: updatedTechnical, score: newGlobal };
          });
        })
        .catch(() => {})
        .finally(() => setCwvLoading(false));

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      let errorMessage: string;
      const isFr = lang === 'fr';
      if (raw.includes('ENOTFOUND') || raw.includes('getaddrinfo')) {
        errorMessage = isFr
          ? "Site introuvable. Vérifiez l'adresse et réessayez."
          : 'Site not found. Check the address and retry.';
      } else if (raw.includes('ECONNREFUSED')) {
        errorMessage = isFr
          ? 'Connexion refusée par le serveur. Le site est peut-être hors ligne.'
          : 'Connection refused. The site may be offline.';
      } else if (raw.includes('ECONNRESET') || raw.includes('socket hang up')) {
        errorMessage = isFr
          ? 'La connexion a été interrompue. Réessayez dans quelques instants.'
          : 'The connection was interrupted. Try again shortly.';
      } else if (raw.includes('ETIMEDOUT') || raw.includes('Timeout')) {
        errorMessage = isFr
          ? 'Le site met trop de temps à répondre. Réessayez plus tard.'
          : 'The site is taking too long to respond. Try later.';
      } else if (raw.includes('CERT_') || raw.includes('certificate') || raw.includes('SSL')) {
        errorMessage = isFr
          ? 'Erreur de certificat SSL. Le site a un problème de sécurité.'
          : 'SSL certificate error. The site has a security issue.';
      } else if (raw.includes('URL invalide') || raw.includes('Invalid URL')) {
        errorMessage = isFr
          ? "L'URL saisie n'est pas valide. Vérifiez la syntaxe (ex : monsite.ch)."
          : 'Invalid URL. Check the syntax (e.g. mysite.ch).';
      } else if (raw.includes('HTTP 4') || raw.includes('HTTP 5')) {
        errorMessage = isFr
          ? `Le site a répondu avec une erreur (${raw}). Vérifiez que la page existe.`
          : `The site returned an error (${raw}). Verify the page exists.`;
      } else if (raw) {
        errorMessage = isFr ? `Impossible d'analyser ce site. ${raw}` : `Unable to analyze this site. ${raw}`;
      } else {
        errorMessage = isFr
          ? 'Une erreur est survenue. Veuillez réessayer.'
          : 'An error occurred. Please try again.';
      }
      setError(errorMessage);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <Shell>
      <AnalyzerHero url={url} setUrl={setUrl} onAnalyze={handleAnalyze} loading={loading} error={error} />

      {loading && (
        <section ref={loadingRef} className="scroll-mt-24" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
          <AnalyzerLoading step={loadingStep} />
        </section>
      )}

      {easterEgg && (
        <section ref={resultsRef} className="scroll-mt-24" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
          <EasterEgg lang={lang} onReset={() => { setEasterEgg(false); setUrl(''); }} />
        </section>
      )}

      {result && (
        <section ref={resultsRef} className="scroll-mt-24" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
          <ReportView
            report={result}
            reportId={reportId ?? undefined}
            cwvLoading={cwvLoading}
            degraded={degraded}
          />
        </section>
      )}
    </Shell>
  );
}

/* ============================================================
   Easter egg — brutalist edition
   ============================================================ */
function EasterEgg({ lang, onReset }: { lang: 'fr' | 'en'; onReset: () => void }) {
  const isFr = lang === 'fr';
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="frame" style={{ background: 'var(--sa-cream-2)' }}>
        <div
          className="ink-b mono"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            background: 'var(--sa-ink)',
            color: 'var(--sa-cream)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>§00 — {isFr ? 'Easter egg' : 'Easter egg'}</span>
          <span style={{ opacity: 0.7 }}>{isFr ? 'Score : ∞' : 'Score: ∞'}</span>
        </div>

        <div style={{ padding: '56px 40px' }}>
          <p
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              margin: '0 0 20px 0',
            }}
          >
            ● {isFr ? 'Auto-analyse détectée' : 'Self-analysis detected'}
          </p>

          <h2
            className="display"
            style={{
              fontSize: 'clamp(40px, 6vw, 80px)',
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
              color: 'var(--sa-ink)',
              margin: '0 0 24px 0',
            }}
          >
            {isFr ? 'On se connaît' : 'We already'}
            <br />
            <em className="serif" style={{ fontStyle: 'italic', fontWeight: 500 }}>
              {isFr ? 'déjà' : 'know'}
            </em>
            <Pixel size={0.18} />
          </h2>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.45,
              color: 'var(--sa-ink-2)',
              maxWidth: 560,
              margin: '0 0 36px 0',
            }}
          >
            {isFr
              ? 'Vous essayez d\u2019analyser Swissalytics… avec Swissalytics ? C\u2019est comme se regarder dans un miroir qui vous note.'
              : "Trying to analyze Swissalytics… with Swissalytics? That's like looking in a mirror that rates you."}
          </p>

          <div
            className="frame"
            style={{
              display: 'inline-flex',
              alignItems: 'stretch',
              background: 'var(--sa-bg)',
              marginBottom: 40,
            }}
          >
            <div
              className="mono"
              style={{
                padding: '16px 24px',
                background: 'var(--sa-ink)',
                color: 'var(--sa-cream)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isFr ? 'Score global' : 'Overall score'}
            </div>
            <div
              style={{
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'baseline',
                gap: 12,
                background: 'var(--sa-bg)',
              }}
            >
              <span
                className="display tnum"
                style={{ fontSize: 72, lineHeight: 1, color: 'var(--sa-ink)' }}
              >
                ∞
              </span>
              <span className="mono" style={{ fontSize: 14, color: 'var(--sa-ink-4)', letterSpacing: '0.1em' }}>
                / 100
              </span>
            </div>
          </div>

          <p
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.05em',
              color: 'var(--sa-ink-4)',
              textTransform: 'uppercase',
              margin: '0 0 32px 0',
            }}
          >
            {isFr ? '// Incalculable — on ne peut pas être juge et partie.' : '// Incalculable — you cannot be both judge and party.'}
          </p>

          <button
            onClick={onReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 28px',
              background: 'var(--sa-red)',
              color: 'var(--sa-cream)',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: '2px solid var(--sa-ink)',
              cursor: 'pointer',
              fontFamily: 'var(--sa-font-sans)',
            }}
          >
            {isFr ? 'Analyser un autre site' : 'Analyze another site'}
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
