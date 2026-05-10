'use client';

import { useState } from 'react';
import type { ReadabilityAnalysis } from '@/lib/types';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';
import { SectionHeader, TabFrame } from './_v2';

function StatCell({ value, label, color = 'var(--sa-ink)' }: { value: number | string; label: string; color?: string }) {
  return (
    <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: '14px 12px', textAlign: 'center' }}>
      <div className="display tnum" style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)' }}>
        {label}
      </div>
    </div>
  );
}

function fleschColor(score: number): string {
  if (score >= 60) return 'var(--sa-ok)';
  if (score >= 40) return 'var(--sa-warn)';
  return 'var(--sa-red)';
}

export default function ReadabilityTab({ data }: { data: ReadabilityAnalysis }) {
  const [showAllSentences, setShowAllSentences] = useState(false);

  const maxDistValue = Math.max(
    data.distribution.veryShort,
    data.distribution.short,
    data.distribution.medium,
    data.distribution.long,
    data.distribution.veryLong,
    1,
  );

  const distBars = [
    { label: 'Très courtes (1-5 mots)',  value: data.distribution.veryShort, color: 'var(--sa-ok)' },
    { label: 'Courtes (6-10)',           value: data.distribution.short,     color: 'var(--sa-ok)' },
    { label: 'Moyennes (11-20)',         value: data.distribution.medium,    color: 'var(--sa-ink)' },
    { label: 'Longues (21-30)',          value: data.distribution.long,      color: 'var(--sa-warn)' },
    { label: 'Très longues (31+)',       value: data.distribution.veryLong,  color: 'var(--sa-red)' },
  ];

  const fleschC = fleschColor(data.fleschScore);

  return (
    <TabFrame>
      {/* §01 — Stats */}
      <section>
        <SectionHeader
          num="01"
          title="Analyse de lisibilité"
          info={
            <InfoBox
              items={[
                { term: 'Score Flesch', definition: 'Mesure la facilité de lecture (0-100). Visez 60+ pour le grand public. Score bas = phrases longues ou vocabulaire complexe.' },
                { term: 'Mots par phrase', definition: 'Au-delà de 20 mots/phrase, la compréhension diminue. Alternez courtes et longues.' },
                { term: 'Phrases très longues (31+)', definition: "Difficiles à suivre. Coupez en 2-3 phrases. Levier le plus efficace pour la lisibilité." },
                { term: 'Nombre de mots', definition: '800+ mots se classe généralement mieux, mais la qualité prime sur la quantité.' },
              ]}
            />
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatCell value={data.wordCount.toLocaleString()} label="Nombre de mots" />
          <StatCell value={data.sentenceCount} label="Total des phrases" />
          <StatCell value={data.avgWordsPerSentence} label="Mots / phrase" />
          <StatCell value={data.fleschScore} label="Score lisibilité" color={fleschC} />
        </div>
      </section>

      {/* §02 — Flesch gauge */}
      <section>
        <SectionHeader
          num="02"
          title="Score Flesch Reading Ease"
          rightSlot={
            <span
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                border: `1px solid ${fleschC}`,
                color: fleschC,
                background: 'var(--sa-cream)',
              }}
            >
              {data.fleschLevel.toUpperCase()} ({data.fleschScore})
            </span>
          }
        />
        <div style={{ position: 'relative', height: 14, border: '1px solid var(--sa-ink)', display: 'flex', overflow: 'hidden' }}>
          {[
            { min: 0,  max: 40, color: 'var(--sa-red)' },
            { min: 40, max: 60, color: 'var(--sa-warn)' },
            { min: 60, max: 100, color: 'var(--sa-ok)' },
          ].map((zone) => {
            const inside = data.fleschScore >= zone.min && data.fleschScore < zone.max;
            return (
              <div
                key={zone.min}
                style={{
                  width: `${zone.max - zone.min}%`,
                  background: zone.color,
                  opacity: inside ? 1 : 0.18,
                }}
              />
            );
          })}
          {/* Marker */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              bottom: -4,
              width: 2,
              background: 'var(--sa-ink)',
              left: `${Math.min(100, Math.max(0, data.fleschScore))}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--sa-ink-4)', marginTop: 8, letterSpacing: '0.08em' }}>
          <span>Très difficile · 0</span>
          <span>40</span>
          <span>60</span>
          <span>100 · Très facile</span>
        </div>
      </section>

      {/* §03 — Issues */}
      <IssuesList issues={data.issues} />

      {/* §04 — Tips */}
      {data.tips.length > 0 && (
        <section>
          <SectionHeader num="04" title="Conseils de lisibilité" />
          <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)' }}>
            {data.tips.map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < data.tips.length - 1 ? '1px solid var(--sa-rule)' : 'none',
                }}
              >
                <span style={{ color: 'var(--sa-ink-4)', flexShrink: 0, fontSize: 16, lineHeight: 1.4 }}>›</span>
                <p style={{ fontSize: 13, color: 'var(--sa-ink-2)', margin: 0, lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* §05 — Sentence distribution */}
      <section>
        <SectionHeader num="05" title="Distribution des longueurs de phrases" />
        <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {distBars.map((bar) => (
            <div key={bar.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--sa-ink-2)' }}>{bar.label}</span>
                <span className="tnum mono" style={{ fontSize: 12, fontWeight: 700, color: bar.color }}>
                  {bar.value}
                </span>
              </div>
              <div style={{ position: 'relative', height: 8, background: 'var(--sa-cream-3)', border: '1px solid var(--sa-rule)' }}>
                <div
                  style={{
                    height: '100%',
                    background: bar.color,
                    width: `${Math.max(bar.value > 0 ? 2 : 0, (bar.value / maxDistValue) * 100)}%`,
                    transition: 'width 200ms linear',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* §06 — Longest sentences (collapsible) */}
      {data.longestSentences.length > 0 && (
        <section>
          <SectionHeader
            num="06"
            title="Phrases les plus longues"
            rightSlot={
              <button
                onClick={() => setShowAllSentences(!showAllSentences)}
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  border: '1px solid var(--sa-ink)',
                  background: 'var(--sa-cream)',
                  color: 'var(--sa-ink)',
                  cursor: 'pointer',
                }}
              >
                {showAllSentences ? 'Masquer' : 'Afficher'}
              </button>
            }
          />
          {showAllSentences && (
            <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--sa-ink)' }}>
                    <th className="mono" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', width: 60 }}>
                      Mots
                    </th>
                    <th className="mono" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', width: 70 }}>
                      Car.
                    </th>
                    <th className="mono" style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)' }}>
                      Phrase
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.longestSentences.map((s, i) => {
                    const wColor = s.wordCount > 30 ? 'var(--sa-red)' : s.wordCount > 20 ? 'var(--sa-warn)' : 'var(--sa-ink-2)';
                    return (
                      <tr key={i} style={{ borderBottom: i < data.longestSentences.length - 1 ? '1px solid var(--sa-rule)' : 'none' }}>
                        <td className="tnum mono" style={{ padding: '10px 12px', fontWeight: 700, color: wColor }}>
                          {s.wordCount}
                        </td>
                        <td className="tnum mono" style={{ padding: '10px 12px', color: 'var(--sa-ink-4)' }}>
                          {s.charCount}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--sa-ink-3)', maxWidth: 500 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {s.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <CTABanner variant="inline" />
    </TabFrame>
  );
}
