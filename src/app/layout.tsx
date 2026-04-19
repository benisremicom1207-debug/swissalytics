import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import StructuredData from "./StructuredData";
import { ThemeProvider } from "@/components/design-system/ThemeProvider";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://swissalytics.com"),
  title: "Swissalytics | Analyse SEO & AI Search Gratuite",
  description:
    "Analysez gratuitement la visibilite de votre site sur Google, ChatGPT, Perplexity et 12+ moteurs IA. Audit SEO complet, E-E-A-T, Schema.org et Core Web Vitals.",
  keywords: [
    "SEO analyse gratuite",
    "AI search optimization",
    "GEO analyzer",
    "ChatGPT indexation",
    "Perplexity SEO",
    "E-E-A-T audit",
    "Schema.org validation",
    "Core Web Vitals",
    "Swissalytics",
  ],
  authors: [{ name: "Swissalytics" }],
  creator: "Swissalytics",
  publisher: "Swissalytics",
  openGraph: {
    type: "website",
    locale: "fr_CH",
    url: "https://swissalytics.com",
    siteName: "Swissalytics",
    title: "Swissalytics | Analyse SEO & AI Search Gratuite",
    description:
      "Decouvrez comment votre site est percu par Google, ChatGPT, Perplexity et les moteurs IA. Gratuit, rapide, complet.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Swissalytics" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swissalytics - Analyse SEO & AI Search Gratuite",
    description: "Audit SEO + visibilite IA en 30 secondes. ChatGPT, Perplexity, Gemini et 12+ moteurs.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://swissalytics.com" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport = { width: "device-width", initialScale: 1, maximumScale: 5 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${interTight.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <StructuredData />
      </head>
      <body className={interTight.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
