---
name: swissalytics-design
description: Use this skill to generate well-branded interfaces and assets for Swissalytics — a free, Swiss-hosted SEO & AI-search (GEO) analyzer shipped by the agency Pixelab. Covers the brutalist v2 identity: cream + carbon + Swiss red, Inter Tight + JetBrains Mono, 2px black frames, no gradients, no rounded corners. Use for production code in the swissalytics Next.js repo, or for throwaway prototypes / slides / mocks.
user-invocable: true
---

Read `README.md` in this skill for the full brand doctrine, then look at `colors_and_type.css` for the canonical tokens and `assets/` for logos.

## Stack this system targets
- Next.js 15 (App Router) + React 19
- Tailwind 3 with the extended theme in `tailwind.config.ts` (cream/ink/rule/sa-red plus legacy surface/text/border/accent tokens mapped to brutalist values)
- `framer-motion` for entrance + gauge arc animation only (ease `[0.2, 0, 0, 1]`, duration 600–1400ms)
- `lucide-react` for icons — use `strokeWidth={1.75}` and let them inherit `currentColor`

## Hard rules
- Surface: `#F5F2EA` cream. Never pure white.
- Ink: `#0A0A0A`. Never pure black.
- Swiss red `#E5241A` is a **scalpel** — category markers, critical score, terminal punctuation (`l'IA.` dot), one CTA. Nothing else.
- Frames: `border-2 border-ink`, square corners. `rounded-*` is forbidden unless it's `rounded-full` on a status dot.
- No gradients. No box-shadows beyond hairline rules. No glassmorphism.
- Display type: `Inter Tight` 800, `tracking-tight-4` (-0.04em), `leading-[.92]`.
- Captions & metrics: `JetBrains Mono` 600, uppercase, `tracking-[.1em]`, tabular-nums for numbers.
- Copy: French-first, assertive, editorial. Section markers use `§01 / §02 / §03`.

## When the user invokes this skill without specifics
Ask what they want to build (page / component / slide / mock), clarify whether it's production Next.js code or a throwaway HTML artifact, then deliver in that format. For production, edit the real repo files; for throwaway, ship a single HTML with inline React + Babel.
