'use client';

import type { ReactNode } from 'react';
import TopBar from './TopBar';
import Footer from './Footer';

export default function Shell({
  children,
  hideFooter,
}: {
  children: ReactNode;
  hideFooter?: boolean;
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--sa-bg)', color: 'var(--sa-ink)' }}>
      <TopBar />
      <main>{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
