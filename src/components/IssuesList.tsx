'use client';

import type { Issue } from '@/lib/types';
import { getIssueTip } from '@/lib/issueTips';

const styles: Record<Issue['type'], { color: string; bg: string; label: string; border: string }> = {
  error: { color: 'text-status-error', bg: 'bg-status-error/10', label: 'CRITIQUE', border: 'bg-status-error' },
  warning: { color: 'text-status-warning', bg: 'bg-status-warning/10', label: 'ATTENTION', border: 'bg-status-warning' },
  info: { color: 'text-text-tertiary', bg: 'bg-surface-tertiary', label: 'INFO', border: 'bg-border-primary' },
};

export default function IssuesList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;

  return (
    <div>
      <h4 className="font-semibold text-text-primary mb-4">Problèmes détectés ({issues.length})</h4>
      <div className="space-y-2">
        {issues.map((issue, i) => {
          const s = styles[issue.type];
          const tip = getIssueTip(issue.message);
          return (
            <div key={i} className="bg-surface-tertiary border border-border-secondary p-4 rounded-xl flex gap-4">
              <div className={`w-1 rounded-full flex-shrink-0 ${s.border}`} />
              <div className="flex-1">
                <p className="text-sm text-text-secondary">{issue.message}</p>
                {tip && (
                  <p className="text-xs text-text-tertiary mt-1.5 leading-relaxed">{tip}</p>
                )}
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded bg-surface-secondary border border-border-secondary ${s.color}`}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
