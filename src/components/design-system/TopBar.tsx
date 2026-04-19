'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './primitives';
import { useTheme, type Lang } from './ThemeProvider';
import { COPY } from '@/lib/i18n/copy';

interface NavItem {
  key: string;
  href: string;
  label: (copy: (typeof COPY)['fr']) => string;
}

const NAV: NavItem[] = [
  { key: 'methode',  href: '/methode',   label: (c) => c.nav[0] },
  { key: 'exemples', href: '/exemples',  label: (c) => c.nav[1] },
  { key: 'journal',  href: '/journal',   label: (c) => c.nav[2] },
  { key: 'apropos',  href: '/a-propos',  label: (c) => c.nav[3] },
];

export default function TopBar() {
  const { lang, setLang, dark, setDark } = useTheme();
  const pathname = usePathname();
  const copy = COPY[lang];

  return (
    <div
      className="rule-b"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'var(--sa-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <Link href="/" style={{ cursor: 'pointer' }}>
        <Logo />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          className="mono"
          style={{
            display: 'none',
            gap: 28,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
          data-md-flex
        >
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== '/' && pathname?.startsWith(n.href));
            return (
              <Link
                key={n.key}
                href={n.href}
                style={{
                  borderBottom: active ? '2px solid var(--sa-ink)' : '2px solid transparent',
                  paddingBottom: 2,
                  color: 'var(--sa-ink)',
                }}
              >
                {n.label(copy)}
              </Link>
            );
          })}
          <span style={{ opacity: 0.35 }}>·</span>
          <Link
            href="/"
            className="caption-red"
            style={{ color: 'var(--sa-red)' }}
          >
            {copy.cta}
          </Link>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          aria-label={dark ? 'Light mode' : 'Dark mode'}
          title={dark ? 'Light' : 'Dark'}
          className="mono"
          style={{
            border: '2px solid var(--sa-ink)',
            background: 'transparent',
            color: 'var(--sa-ink)',
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {dark ? '☀' : '☾'}
        </button>

        {/* FR / EN toggle */}
        <div
          className="frame mono"
          style={{
            display: 'inline-flex',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}
        >
          {(['fr', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: lang === l ? 'var(--sa-ink)' : 'transparent',
                color: lang === l ? 'var(--sa-cream)' : 'var(--sa-ink)',
                borderLeft: l === 'en' ? '2px solid var(--sa-ink)' : 'none',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                letterSpacing: 'inherit',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Inline hack to show nav on md+ without a plugin */}
      <style>{`@media (min-width: 768px) { [data-md-flex] { display: flex !important; } }`}</style>
    </div>
  );
}
