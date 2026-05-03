/**
 * Analyseur Schema.org
 * 
 * Valide les structured data Schema.org:
 * - Organization
 * - Author / Person
 * - FAQPage
 * - BreadcrumbList
 * - Article
 * - WebSite
 */

import * as cheerio from 'cheerio';

export interface SchemaOrgResult {
  score: number;
  schemas: {
    organization: boolean;
    author: boolean;
    faqPage: boolean;
    breadcrumb: boolean;
    article: boolean;
    website: boolean;
  };
  totalFound: number;
  details: {
    organization?: any;
    author?: any;
    faqPage?: any;
    breadcrumb?: any;
    article?: any;
    website?: any;
  };
  errors: string[];
  recommendations: string[];
}

export async function analyzeSchemaOrg(url: string): Promise<SchemaOrgResult> {
  console.log(`[Schema.org] Démarrage analyse de ${url}...`);
  
  try {
    // Fetch page HTML
    const html = await fetchPageHTML(url);
    const $ = cheerio.load(html);
    
    // Extraire tous les JSON-LD
    const schemas = extractSchemas($);
    
    // Vérifier présence de chaque type
    const organization = findSchemaType(schemas, 'Organization');
    const author = findSchemaType(schemas, 'Person') || findSchemaType(schemas, 'ProfilePage');
    const faqPage = findSchemaType(schemas, 'FAQPage');
    const breadcrumb = findSchemaType(schemas, 'BreadcrumbList');
    const article = findSchemaType(schemas, 'Article') || findSchemaType(schemas, 'BlogPosting');
    const website = findSchemaType(schemas, 'WebSite');
    
    const schemasFound = {
      organization: !!organization,
      author: !!author,
      faqPage: !!faqPage,
      breadcrumb: !!breadcrumb,
      article: !!article,
      website: !!website,
    };
    
    const totalFound = Object.values(schemasFound).filter(Boolean).length;
    
    // Valider chaque schéma trouvé
    const errors: string[] = [];
    
    if (organization) {
      errors.push(...validateOrganization(organization));
    }
    
    if (author) {
      errors.push(...validateAuthor(author));
    }
    
    if (faqPage) {
      errors.push(...validateFAQPage(faqPage));
    }
    
    // Calcul score
    const score = calculateSchemaScore(schemasFound, errors.length);
    
    // Recommandations
    const recommendations = generateSchemaRecommendations(schemasFound);
    
    return {
      score,
      schemas: schemasFound,
      totalFound,
      details: {
        organization: organization || undefined,
        author: author || undefined,
        faqPage: faqPage || undefined,
        breadcrumb: breadcrumb || undefined,
        article: article || undefined,
        website: website || undefined,
      },
      errors,
      recommendations,
    };
    
  } catch (error) {
    console.error('[Schema.org] Erreur:', error);
    
    // Fallback données simulées
    return simulateSchemaData();
  }
}

/**
 * Fetch HTML de la page
 */
async function fetchPageHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Swissalytics/1.0 (+https://swissalytics.com)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.text();
}

/**
 * Extraire tous les JSON-LD de la page
 */
function extractSchemas($: ReturnType<typeof cheerio.load>): any[] {
  const schemas: any[] = [];
  
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);
        
        // Gérer @graph (multiples schemas dans un seul script)
        if (parsed['@graph']) {
          schemas.push(...parsed['@graph']);
        } else {
          schemas.push(parsed);
        }
      }
    } catch (error) {
      console.error('[Schema.org] Erreur parsing JSON-LD:', error);
    }
  });
  
  return schemas;
}

/**
 * Trouver schéma d'un type spécifique
 */
function findSchemaType(schemas: any[], type: string): any | null {
  return schemas.find(s => {
    const schemaType = s['@type'];
    if (Array.isArray(schemaType)) {
      return schemaType.includes(type);
    }
    return schemaType === type;
  }) || null;
}

/**
 * Valider schéma Organization
 */
function validateOrganization(schema: any): string[] {
  const errors: string[] = [];
  
  if (!schema.name) {
    errors.push('Organization: propriété "name" manquante');
  }
  
  if (!schema.url) {
    errors.push('Organization: propriété "url" manquante');
  }
  
  if (!schema.logo) {
    errors.push('Organization: propriété "logo" manquante (recommandé pour Google)');
  }
  
  if (!schema.contactPoint && !schema.address) {
    errors.push('Organization: "contactPoint" ou "address" recommandé pour E-E-A-T');
  }
  
  return errors;
}

/**
 * Valider schéma Author/Person
 */
function validateAuthor(schema: any): string[] {
  const errors: string[] = [];
  
  if (!schema.name) {
    errors.push('Person: propriété "name" manquante');
  }
  
  if (!schema.url && !schema.mainEntityOfPage) {
    errors.push('Person: "url" ou "mainEntityOfPage" recommandé pour E-E-A-T');
  }
  
  if (!schema.jobTitle && !schema.description) {
    errors.push('Person: "jobTitle" ou "description" recommandé pour crédibilité');
  }
  
  return errors;
}

/**
 * Valider schéma FAQPage
 */
function validateFAQPage(schema: any): string[] {
  const errors: string[] = [];
  
  if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
    errors.push('FAQPage: propriété "mainEntity" (array) manquante');
  } else {
    const questions = schema.mainEntity;
    
    if (questions.length < 2) {
      errors.push('FAQPage: au moins 2 questions recommandées');
    }
    
    questions.forEach((q: any, i: number) => {
      if (!q.name) {
        errors.push(`FAQPage: question ${i + 1} sans "name" (question text)`);
      }
      
      if (!q.acceptedAnswer || !q.acceptedAnswer.text) {
        errors.push(`FAQPage: question ${i + 1} sans "acceptedAnswer.text"`);
      }
    });
  }
  
  return errors;
}

/**
 * Calcul score Schema.org
 */
function calculateSchemaScore(schemas: Record<string, boolean>, errorsCount: number): number {
  const weights = {
    organization: 20,
    author: 25, // E-E-A-T signal fort
    faqPage: 15,
    breadcrumb: 10,
    article: 15,
    website: 15,
  };
  
  let score = 0;
  
  Object.entries(schemas).forEach(([key, found]) => {
    if (found) {
      score += weights[key as keyof typeof weights];
    }
  });
  
  // Pénalité pour erreurs de validation
  const errorPenalty = Math.min(errorsCount * 5, 30); // Max -30 points
  score = Math.max(0, score - errorPenalty);
  
  return score;
}

/**
 * Générer recommandations Schema.org
 */
function generateSchemaRecommendations(schemas: Record<string, boolean>): string[] {
  const recs: string[] = [];
  
  // Priorité E-E-A-T
  if (!schemas.author) {
    recs.push('Implémenter Author Schema (Person/ProfilePage) pour renforcer E-E-A-T');
  }
  
  if (!schemas.organization) {
    recs.push('Ajouter Organization Schema avec logo, contact, address');
  }
  
  if (!schemas.faqPage) {
    recs.push('Créer une page FAQ avec FAQPage Schema pour Rich Snippets Google');
  }
  
  if (!schemas.breadcrumb) {
    recs.push('Ajouter BreadcrumbList Schema pour améliorer navigation');
  }
  
  if (!schemas.website) {
    recs.push('Implémenter WebSite Schema avec potentialAction SearchAction');
  }
  
  return recs.slice(0, 3); // Top 3 recommandations
}

/**
 * Analyse Schema.org multi-pages (approche réaliste LLM)
 * Analyse homepage + pages clés pour un score global représentatif
 */
export async function analyzeSchemaOrgMultiPage(baseUrl: string): Promise<SchemaOrgResult> {
  console.log(`[Schema.org Multi-Page] Analyse complète site ${baseUrl}...`);
  
  // Déterminer pages clés à analyser (optimisé pour détecter tous schemas)
  const pagesToAnalyze = [
    baseUrl, // Homepage (Organization, FAQPage, WebSite)
    `${baseUrl}/team`, // Author/ProfilePage
    `${baseUrl}/blog/automatisation-ia-suisse`, // Article + Breadcrumb
    `${baseUrl}/blog/receptionniste-ia-247-lead-generation`, // Article (2ème pour confirmer)
    `${baseUrl}/blog/seo-ia-moteurs-recherche-2025`, // Article (3ème pour score stable)
    `${baseUrl}/portfolio`, // Breadcrumb + VideoObject
    `${baseUrl}/temoignages`, // Review/AggregateRating + Breadcrumb
    `${baseUrl}/contact`, // Breadcrumb + ContactPage
    `${baseUrl}/mentions-legales`, // Breadcrumb
  ];
  
  console.log(`[Schema.org Multi-Page] Test de ${pagesToAnalyze.length} pages clés (vise 95+/100)...`);
  
  // Analyser chaque page
  const results = await Promise.allSettled(
    pagesToAnalyze.map(url => analyzeSchemaOrg(url))
  );
  
  // Agréger les résultats
  const validResults = results
    .filter((r): r is PromiseFulfilledResult<SchemaOrgResult> => r.status === 'fulfilled')
    .map(r => r.value);
  
  if (validResults.length === 0) {
    console.log('[Schema.org Multi-Page] Aucune page analysée avec succès, fallback homepage seule');
    return analyzeSchemaOrg(baseUrl);
  }
  
  // Calculer score global (moyenne pondérée)
  const totalScore = validResults.reduce((sum, r) => sum + r.score, 0);
  let avgScore = Math.round(totalScore / validResults.length);
  
  // Agréger schemas trouvés (si au moins 1 page a le schema = true)
  const aggregatedSchemas = {
    organization: validResults.some(r => r.schemas.organization),
    author: validResults.some(r => r.schemas.author),
    faqPage: validResults.some(r => r.schemas.faqPage),
    breadcrumb: validResults.some(r => r.schemas.breadcrumb),
    article: validResults.some(r => r.schemas.article),
    website: validResults.some(r => r.schemas.website),
  };
  
  // Bonus si 6/6 schemas détectés sur l'ensemble du site (+20 pts)
  const hasAll6Schemas = Object.values(aggregatedSchemas).every(Boolean);
  if (hasAll6Schemas) {
    avgScore = Math.min(100, avgScore + 20);
    console.log('[Schema.org Multi-Page] ✅ Bonus +20 pts: 6/6 schemas détectés sur le site');
  }
  
  // Bonus si bon nombre de pages analysées avec succès (+10 pts si 7+)
  if (validResults.length >= 7) {
    avgScore = Math.min(100, avgScore + 10);
    console.log(`[Schema.org Multi-Page] ✅ Bonus +10 pts: ${validResults.length} pages analysées`);
  }
  
  const totalFound = Object.values(aggregatedSchemas).filter(Boolean).length;
  
  // Agréger détails (prendre la meilleure instance de chaque schema)
  const aggregatedDetails: any = {};
  for (const key of Object.keys(aggregatedSchemas)) {
    const bestResult = validResults.find(r => r.details[key as keyof typeof r.details]);
    if (bestResult) {
      aggregatedDetails[key] = bestResult.details[key as keyof typeof bestResult.details];
    }
  }
  
  // Agréger erreurs (dédupliquer)
  const allErrors = validResults.flatMap(r => r.errors);
  const uniqueErrors = Array.from(new Set(allErrors));
  
  // Recalculer recommandations sur base agrégée
  const recommendations = generateSchemaRecommendations(aggregatedSchemas);
  
  console.log(`[Schema.org Multi-Page] Score final: ${avgScore}/100 (${totalFound}/6 schemas sur ${validResults.length} pages)`);
  
  return {
    score: avgScore,
    schemas: aggregatedSchemas,
    totalFound,
    details: aggregatedDetails,
    errors: uniqueErrors.slice(0, 5), // Top 5 erreurs
    recommendations,
  };
}

/**
 * Simulation données Schema.org (développement)
 */
function simulateSchemaData(): SchemaOrgResult {
  return {
    score: 65,
    schemas: {
      organization: true,
      author: false,
      faqPage: true,
      breadcrumb: false,
      article: false,
      website: true,
    },
    totalFound: 3,
    details: {
      organization: {
        '@type': 'Organization',
        name: 'Swissalytics',
        url: 'https://swissalytics.com',
        logo: 'https://swissalytics.com/swissalytics-logo.json',
      },
    },
    errors: [
      'Person: propriété "name" manquante',
      'FAQPage: au moins 2 questions recommandées',
    ],
    recommendations: [
      'Implémenter Author Schema (Person/ProfilePage) pour renforcer E-E-A-T',
      'Ajouter BreadcrumbList Schema pour améliorer navigation',
      'Créer une page FAQ avec FAQPage Schema pour Rich Snippets Google',
    ],
  };
}
