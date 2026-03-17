'use client';

import { useState } from 'react';
import type { ReadabilityAnalysis } from '@/lib/types';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';

export default function ReadabilityTab({ data }: { data: ReadabilityAnalysis }) {
  const [showAllSentences, setShowAllSentences] = useState(false);

  const maxDistValue = Math.max(
    data.distribution.veryShort,
    data.distribution.short,
    data.distribution.medium,
    data.distribution.long,
    data.distribution.veryLong,
    1
  );

  const distBars = [
    { label: 'Très courtes (1-5)', value: data.distribution.veryShort, color: 'bg-status-success' },
    { label: 'Courtes (6-10)', value: data.distribution.short, color: 'bg-status-success' },
    { label: 'Moyennes (11-20)', value: data.distribution.medium, color: 'bg-blue-500' },
    { label: 'Longues (21-30)', value: data.distribution.long, color: 'bg-status-warning' },
    { label: 'Très longues (31+)', value: data.distribution.veryLong, color: 'bg-status-error' },
  ];

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6 md:p-8">
      <div className="space-y-8">

        {/* 1. Stats grid */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            Analyse de lisibilité
            <InfoBox
              items={[
                { term: 'Score Flesch', definition: 'Mesure la facilité de lecture d\'un texte sur une échelle de 0 à 100. Plus le score est élevé, plus le texte est facile à lire. Visez 60+ pour le grand public. Un score bas signifie des phrases trop longues ou un vocabulaire trop complexe.' },
                { term: 'Mots par phrase', definition: 'Le nombre moyen de mots par phrase. Au-delà de 20 mots par phrase, la compréhension diminue. Alternez phrases courtes et longues pour un bon rythme de lecture.' },
                { term: 'Phrases très longues (31+ mots)', definition: 'Les phrases de plus de 30 mots sont difficiles à suivre. Coupez-les en deux ou trois phrases plus courtes. C\'est le levier le plus efficace pour améliorer la lisibilité.' },
                { term: 'Nombre de mots', definition: 'La longueur du contenu textuel de votre page. Pour le SEO, un contenu approfondi (800+ mots) est généralement mieux classé, mais la qualité prime toujours sur la quantité.' },
              ]}
            />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.wordCount.toLocaleString()}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Nombre de mots</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.sentenceCount}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Total des phrases</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.avgWordsPerSentence}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Mots / phrase</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className={`text-2xl font-bold mb-1 ${data.fleschScore >= 60 ? 'text-status-success' : data.fleschScore >= 40 ? 'text-status-warning' : 'text-status-error'}`}>
                {data.fleschScore}
              </div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Score lisibilité</div>
            </div>
          </div>
        </div>

        {/* 2. Flesch gauge (simplified to 3 zones) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-text-primary">Score Flesch Reading Ease</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.fleschScore >= 60 ? 'bg-status-success/10 text-status-success' :
              data.fleschScore >= 40 ? 'bg-status-warning/10 text-status-warning' :
              'bg-status-error/10 text-status-error'
            }`}>
              {data.fleschLevel} ({data.fleschScore})
            </span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden">
            {[
              { min: 0, max: 40, color: 'bg-status-error' },
              { min: 40, max: 60, color: 'bg-status-warning' },
              { min: 60, max: 100, color: 'bg-status-success' },
            ].map((zone) => (
              <div
                key={zone.min}
                className={`${zone.color} transition-opacity ${
                  data.fleschScore >= zone.min && data.fleschScore < zone.max ? 'opacity-100' : 'opacity-15'
                }`}
                style={{ width: `${zone.max - zone.min}%` }}
              />
            ))}
          </div>
          <div className="relative h-2 mt-0">
            <div
              className="absolute -top-3 w-0.5 h-5 bg-text-primary rounded-full"
              style={{ left: `${Math.min(100, Math.max(0, data.fleschScore))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-quaternary mt-3">
            <span>Très difficile</span>
            <span>Très facile</span>
          </div>
        </div>

        {/* 3. Issues */}
        <IssuesList issues={data.issues} />

        {/* 4. Tips */}
        {data.tips.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Conseils de lisibilité</h4>
            <div className="space-y-2">
              {data.tips.map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 bg-surface-tertiary rounded-lg border border-border-secondary">
                  <span className="text-text-tertiary flex-shrink-0">&#8226;</span>
                  <p className="text-sm text-text-secondary">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Sentence distribution */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4">Distribution des longueurs de phrases</h4>
          <div className="space-y-4">
            {distBars.map((bar) => (
              <div key={bar.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text-tertiary">{bar.label}</span>
                  <span className={`text-sm font-bold ${bar.color.replace('bg-', 'text-')}`}>{bar.value}</span>
                </div>
                <div className="w-full bg-gauge-track h-2 rounded-full overflow-hidden">
                  <div
                    className={`${bar.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(bar.value > 0 ? 4 : 0, (bar.value / maxDistValue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Longest Sentences (collapsible) */}
        {data.longestSentences.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-text-primary">Phrases les plus longues</h4>
              <button
                onClick={() => setShowAllSentences(!showAllSentences)}
                className="text-xs px-3 py-1 rounded-lg bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors border border-border-secondary"
              >
                {showAllSentences ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            {showAllSentences && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-quaternary border-b border-border-primary">
                      <th className="text-left pb-3 pr-4 font-medium w-16">Mots</th>
                      <th className="text-left pb-3 pr-4 font-medium w-20">Car.</th>
                      <th className="text-left pb-3 font-medium">Phrase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.longestSentences.map((s, i) => (
                      <tr key={i} className="border-b border-border-secondary">
                        <td className="py-2.5 pr-4">
                          <span className={`font-bold ${s.wordCount > 30 ? 'text-status-error' : s.wordCount > 20 ? 'text-status-warning' : 'text-text-secondary'}`}>
                            {s.wordCount}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-text-quaternary">{s.charCount}</td>
                        <td className="py-2.5 text-text-tertiary max-w-[500px]">
                          <span className="line-clamp-2">{s.text}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <CTABanner variant="inline" />
      </div>
    </div>
  );
}
