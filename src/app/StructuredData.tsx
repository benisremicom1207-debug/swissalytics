export default function StructuredData() {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Swissalytics',
    url: 'https://swissalytics.com',
    description: 'Outil gratuit d\'analyse SEO et de visibilité sur les moteurs de recherche IA (ChatGPT, Perplexity, Gemini). 100% hébergé en Suisse.',
    applicationCategory: 'SEO Tool',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CHF',
    },
    creator: {
      '@type': 'Organization',
      name: 'Pixelab',
      url: 'https://pixelab.ch',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Genève',
        addressCountry: 'CH',
      },
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Swissalytics',
    url: 'https://swissalytics.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://swissalytics.com/?url={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
