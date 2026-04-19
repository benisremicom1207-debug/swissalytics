# Swissalytics — Design System v2 (Brutalist)

Cream + carbon + Swiss red. Typographic. No gradients. No glow.

## Tokens at a glance

| Role               | Value        | CSS var            | Tailwind |
| ------------------ | ------------ | ------------------ | -------- |
| Primary surface    | `#F5F2EA`    | `--sa-cream`       | `bg-cream` |
| Secondary surface  | `#EDEAE0`    | `--a-surface-secondary` | `bg-cream-2` |
| Hairline rule      | `#CFCABE`    | `--sa-rule`        | `border-rule` |
| Ink (primary)      | `#0A0A0A`    | `--sa-ink`         | `text-ink / bg-ink` |
| Ink muted          | `#6B6B6B`    | —                  | `text-ink-4` |
| Swiss red          | `#E5241A`    | `--sa-red`         | `text-sa-red / bg-sa-red` |
| OK                 | `#2F6B3F`    | `--sa-ok`          | `text-status-success` |
| Warn               | `#B87B00`    | `--sa-warn`        | `text-status-warning` |

## Type
- **Display**: Inter Tight 800, `tracking-tight-4`, `leading-[.92]`
- **H1-H3**: Inter Tight 700/800
- **Body**: Inter Tight 400/500, line-height 1.45
- **Caption / metric**: JetBrains Mono 600, uppercase, `tracking-[.1em]`, tabular-nums

## Geometry
- 4px base unit
- `border-2 border-ink` hard frame
- Square corners — `rounded-*` forbidden except `rounded-full` on small status dots

## Motion
- Ease `[0.2, 0, 0, 1]` (Swiss ease)
- Entrance fade + 20px rise, 600–700ms
- Gauge arc sweep, 1400ms easeOut
- No bounces, no springs, no scale bursts

## Copy tone
French-first, assertive, editorial. Numbered section markers (§01). Red terminal punctuation (`l'IA.`) when a sentence deserves a hard stop.

## Files
- `SKILL.md` — Claude Code invocation
- `colors_and_type.css` — canonical tokens
- `assets/` — logos (mark, wordmark, dark, light, favicon)
