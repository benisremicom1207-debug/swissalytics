'use client';

import { useState, useRef } from 'react';
import type { AnalysisResult } from '@/lib/types';
import { calculateGlobalScore } from '@/lib/analyzer/score';
import AnalyzerHero from '@/components/AnalyzerHero';
import AnalyzerLoading from '@/components/AnalyzerLoading';
import AnalyzerResults from '@/components/AnalyzerResults';

function isSelfAnalysis(input: string): boolean {
  const normalized = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  return ['swissalytics.com', 'swissalytics.ch', 'swissalytics.jcloud.ik-server.com'].includes(normalized);
}

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [cwvLoading, setCwvLoading] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!url) {
      setError('Veuillez entrer une URL valide');
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
    setLoadingStep(0);

    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < 4 ? prev + 1 : prev));
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
        throw new Error(errorData.error || errorData.details || 'Erreur lors de l\'analyse');
      }

      const data = await response.json();
      setResult(data);
      setCwvLoading(true);

      fetch('/api/analyze/cwv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: validatedUrl }),
      })
        .then(res => res.ok ? res.json() : null)
        .then(cwvData => {
          if (!cwvData?.coreWebVitals || (!cwvData.coreWebVitals.mobile && !cwvData.coreWebVitals.desktop)) return;
          setResult(prev => {
            if (!prev) return prev;
            const newTechScore = Math.max(0, prev.technical.score - cwvData.cwvScorePenalty);
            const updatedTechnical = {
              ...prev.technical,
              coreWebVitals: cwvData.coreWebVitals,
              score: newTechScore,
              issues: [...prev.technical.issues, ...cwvData.cwvIssues],
            };
            const newGlobal = calculateGlobalScore({
              ...prev,
              technical: updatedTechnical,
            });
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
      if (raw.includes('ENOTFOUND') || raw.includes('getaddrinfo')) {
        errorMessage = 'Site introuvable. V\u00e9rifiez l\'adresse et r\u00e9essayez.';
      } else if (raw.includes('ECONNREFUSED')) {
        errorMessage = 'Connexion refus\u00e9e par le serveur. Le site est peut-\u00eatre hors ligne.';
      } else if (raw.includes('ECONNRESET') || raw.includes('socket hang up')) {
        errorMessage = 'La connexion a \u00e9t\u00e9 interrompue. R\u00e9essayez dans quelques instants.';
      } else if (raw.includes('ETIMEDOUT') || raw.includes('Timeout')) {
        errorMessage = 'Le site met trop de temps \u00e0 r\u00e9pondre. R\u00e9essayez plus tard.';
      } else if (raw.includes('CERT_') || raw.includes('certificate') || raw.includes('SSL')) {
        errorMessage = 'Erreur de certificat SSL. Le site a un probl\u00e8me de s\u00e9curit\u00e9.';
      } else if (raw.includes('URL invalide') || raw.includes('Invalid URL')) {
        errorMessage = 'L\'URL saisie n\'est pas valide. V\u00e9rifiez la syntaxe (ex : monsite.ch).';
      } else if (raw.includes('HTTP 4') || raw.includes('HTTP 5')) {
        errorMessage = `Le site a r\u00e9pondu avec une erreur (${raw}). V\u00e9rifiez que la page existe.`;
      } else if (raw) {
        errorMessage = `Impossible d'analyser ce site. ${raw}`;
      } else {
        errorMessage = 'Une erreur est survenue. Veuillez r\u00e9essayer.';
      }
      setError(errorMessage);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <main>
        <AnalyzerHero
          url={url}
          setUrl={setUrl}
          onAnalyze={handleAnalyze}
          loading={loading}
          error={error}
        />

        {loading && (
          <section ref={loadingRef} className="container mx-auto px-4 py-12 scroll-mt-24">
            <AnalyzerLoading step={loadingStep} />
          </section>
        )}

        {easterEgg && (
          <section ref={resultsRef} className="container mx-auto px-4 py-16 scroll-mt-24">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-3xl p-12 shadow-lg">
                <div className="text-7xl mb-6">&#129302;</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Bien jou&eacute;, on se conna&icirc;t d&eacute;j&agrave; !
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Vous essayez d&apos;analyser Swissalytics... avec Swissalytics ?
                  <br />
                  C&apos;est comme se regarder dans un miroir qui vous note.
                </p>
                <div className="inline-flex items-center gap-3 bg-white border border-blue-200 rounded-2xl px-8 py-4 mb-8">
                  <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">&infin;</span>
                  <span className="text-lg text-gray-500">/100</span>
                </div>
                <p className="text-sm text-gray-400 italic">
                  Score : incalculable. On ne peut pas &ecirc;tre juge et partie.
                </p>
                <button
                  onClick={() => { setEasterEgg(false); setUrl(''); }}
                  className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Analyser un autre site
                </button>
              </div>
            </div>
          </section>
        )}

        {result && (
          <section ref={resultsRef} className="container mx-auto px-4 py-12 scroll-mt-24">
            <AnalyzerResults result={result} cwvLoading={cwvLoading} />
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mt-16">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>Swissalytics &mdash; Analyse SEO &amp; AI Search gratuite</p>
            <p className="mt-1">100% h&eacute;berg&eacute; en Suisse</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
