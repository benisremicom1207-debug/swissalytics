import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Mentions légales | Swissalytics',
  description:
    "Mentions légales, politique de confidentialité et conditions d'utilisation de Swissalytics.",
};

export default function MentionsLegalesLayout({ children }: { children: ReactNode }) {
  return children;
}
