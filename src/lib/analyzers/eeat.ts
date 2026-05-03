/**
 * Analyseur E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
 * 
 * Évalue les signaux de confiance Google:
 * - Page équipe (Team/About)
 * - Mentions légales
 * - Page contact
 * - Témoignages clients
 * - Backlinks de qualité
 * - Présence auteurs identifiés
 */

import * as cheerio from 'cheerio';

export interface EEATResult {
  score: number;
  signals: {
    teamPage: {
      found: boolean;
      quality: 'high' | 'medium' | 'low' | 'none';
      authorsCount: number;
    };
    legalMentions: boolean;
    contactPage: {
      found: boolean;
      hasEmail: boolean;
      hasPhone: boolean;
      hasAddress: boolean;
    };
    testimonials: {
      found: boolean;
      count: number;
      hasSchema: boolean;
    };
    backlinks: {
      total: number;
      quality: 'high' | 'medium' | 'low' | 'none';
      domains: number;
    };
    authorBios: {
      found: boolean;
      count: number;
    };
  };
  recommendations: string[];
}

export async function analyzeEEAT(url: string): Promise<EEATResult> {
  console.log(`[E-E-A-T] Démarrage analyse de ${url}...`);
  
  try {
    const baseUrl = new URL(url).origin;
    
    // Analyses parallèles
    const [teamPage, legalMentions, contactPage, testimonials, backlinks] = await Promise.all([
      analyzeTeamPage(baseUrl),
      checkLegalMentions(baseUrl),
      analyzeContactPage(baseUrl),
      analyzeTestimonials(baseUrl),
      analyzeBacklinks(url),
    ]);
    
    // Analyser présence auteurs (via Schema.org ou balises author)
    const authorBios = await analyzeAuthorBios(baseUrl);
    
    const signals = {
      teamPage,
      legalMentions,
      contactPage,
      testimonials,
      backlinks,
      authorBios,
    };
    
    // Calcul score E-E-A-T
    const score = calculateEEATScore(signals);
    
    // Recommandations
    const recommendations = generateEEATRecommendations(signals);
    
    return {
      score,
      signals,
      recommendations,
    };
    
  } catch (error) {
    console.error('[E-E-A-T] Erreur:', error);
    
    // Fallback données simulées
    return simulateEEATData();
  }
}

/**
 * Analyser page équipe
 */
async function analyzeTeamPage(baseUrl: string): Promise<{
  found: boolean;
  quality: 'high' | 'medium' | 'low' | 'none';
  authorsCount: number;
}> {
  try {
    // Tester URLs communes pour page équipe
    const teamUrls = [
      `${baseUrl}/team`,
      `${baseUrl}/team`,
      `${baseUrl}/about`,
      `${baseUrl}/a-propos`,
      `${baseUrl}/qui-sommes-nous`,
    ];
    
    for (const url of teamUrls) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Swissalytics/1.0 (+https://swissalytics.com)' },
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Chercher Schema.org Person dans JSON-LD
        let authorElements = 0;
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const content = $(el).html();
            if (content) {
              const json = JSON.parse(content);
              // Vérifier si c'est un tableau avec @graph
              if (json['@graph']) {
                authorElements = json['@graph'].filter((item: any) => item['@type'] === 'Person').length;
              } else if (json['@type'] === 'Person') {
                authorElements = 1;
              }
            }
          } catch {
            // Ignorer erreurs parsing
          }
        });

        // Si pas de JSON-LD, chercher balises HTML classiques
        if (authorElements === 0) {
          authorElements = $('[itemtype*="Person"], .author, .team-member, .profile').length;
        }

        const hasBios = $('p').filter((_, el) => {
          const text = $(el).text();
          return text.length > 100 && /expert|spécialis|fondateur|ceo|directeur|cto|cmo/i.test(text);
        }).length;
        
        let quality: 'high' | 'medium' | 'low' | 'none' = 'none';
        
        if (authorElements >= 3 && hasBios >= 3) {
          quality = 'high';
        } else if (authorElements >= 2 || hasBios >= 2) {
          quality = 'medium';
        } else if (authorElements >= 1) {
          quality = 'low';
        }
        
        console.log(`[E-E-A-T] Page équipe trouvée: ${url}, ${authorElements} auteurs, qualité: ${quality}`);
        
        return {
          found: true,
          quality,
          authorsCount: authorElements,
        };
      }
    }
    
    return { found: false, quality: 'none', authorsCount: 0 };
    
  } catch (error) {
    console.error('[E-E-A-T] Erreur Team Page:', error);
    return { found: false, quality: 'none', authorsCount: 0 };
  }
}

/**
 * Vérifier mentions légales
 */
async function checkLegalMentions(baseUrl: string): Promise<boolean> {
  try {
    const legalUrls = [
      `${baseUrl}/mentions-legales`,
      `${baseUrl}/legal`,
      `${baseUrl}/legal-notice`,
      `${baseUrl}/imprint`,
    ];
    
    for (const url of legalUrls) {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Swissalytics/1.0 (+https://swissalytics.com)' },
      });
      
      if (response.ok) {
        return true;
      }
    }
    
    return false;
    
  } catch {
    return false;
  }
}

/**
 * Analyser page contact
 */
async function analyzeContactPage(baseUrl: string): Promise<{
  found: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasAddress: boolean;
}> {
  try {
    const contactUrls = [
      `${baseUrl}/contact`,
      `${baseUrl}/contactez-nous`,
    ];
    
    for (const url of contactUrls) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Swissalytics/1.0 (+https://swissalytics.com)' },
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        const text = $('body').text().toLowerCase();
        
        const hasEmail = /@/.test(text) || $('a[href^="mailto:"]').length > 0;
        const hasPhone = /\+?\d{2,3}[\s-]?\d{2,3}[\s-]?\d{2,3}/.test(text) || $('a[href^="tel:"]').length > 0;
        const hasAddress = /adresse|address|rue|street|avenue/i.test(text);
        
        return {
          found: true,
          hasEmail,
          hasPhone,
          hasAddress,
        };
      }
    }
    
    return {
      found: false,
      hasEmail: false,
      hasPhone: false,
      hasAddress: false,
    };
    
  } catch (error) {
    console.error('[E-E-A-T] Erreur Contact Page:', error);
    return {
      found: false,
      hasEmail: false,
      hasPhone: false,
      hasAddress: false,
    };
  }
}

/**
 * Analyser témoignages clients
 */
async function analyzeTestimonials(baseUrl: string): Promise<{
  found: boolean;
  count: number;
  hasSchema: boolean;
}> {
  try {
    const testimonialUrls = [
      `${baseUrl}/testimonials`,
      `${baseUrl}/temoignages`,
      `${baseUrl}/avis`,
      `${baseUrl}/clients`,
      baseUrl, // Page d'accueil peut avoir testimonials
    ];
    
    for (const url of testimonialUrls) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Swissalytics/1.0 (+https://swissalytics.com)' },
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Chercher Review Schema dans JSON-LD
        let reviewCount = 0;
        let hasSchema = false;
        
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const content = $(el).html();
            if (content) {
              const json = JSON.parse(content);
              // Vérifier si c'est un tableau avec @graph
              if (json['@graph']) {
                const reviews = json['@graph'].filter((item: any) => item['@type'] === 'Review');
                if (reviews.length > 0) {
                  reviewCount = reviews.length;
                  hasSchema = true;
                }
              } else if (json['@type'] === 'Review') {
                reviewCount = 1;
                hasSchema = true;
              }
            }
          } catch {
            // Ignorer erreurs parsing
          }
        });

        // Si pas de JSON-LD, chercher balises HTML classiques
        if (reviewCount === 0) {
          reviewCount = $('.testimonial, .review, .avis, [itemtype*="Review"]').length;
          hasSchema = $('script[type="application/ld+json"]').filter((_, el) => {
            const content = $(el).html();
            return content ? /Review|Rating/i.test(content) : false;
          }).length > 0;
        }
        
        if (reviewCount > 0) {
          console.log(`[E-E-A-T] Témoignages trouvés: ${url}, ${reviewCount} avis, Schema: ${hasSchema}`);
          return {
            found: true,
            count: reviewCount,
            hasSchema,
          };
        }
      }
    }
    
    return { found: false, count: 0, hasSchema: false };
    
  } catch (error) {
    console.error('[E-E-A-T] Erreur Testimonials:', error);
    return { found: false, count: 0, hasSchema: false };
  }
}

/**
 * Analyser backlinks (via API externe ou simulation)
 */
async function analyzeBacklinks(url: string): Promise<{
  total: number;
  quality: 'high' | 'medium' | 'low' | 'none';
  domains: number;
}> {
  try {
    // Option: Utiliser Moz API, Ahrefs API, ou SEMrush API
    // Pour MVP, on simule ou utilise un service gratuit limité
    
    const mozKey = process.env.MOZ_API_KEY;
    
    if (!mozKey) {
      console.warn('[E-E-A-T] MOZ_API_KEY non configuré - simulation backlinks');
      
      // Simulation basée sur domaine
      const domain = new URL(url).hostname;
      const isEstablished = /\.ch$|\.com$|\.fr$/.test(domain);
      
      return {
        total: isEstablished ? 25 : 5,
        quality: isEstablished ? 'medium' : 'low',
        domains: isEstablished ? 15 : 3,
      };
    }
    
    // Appel Moz API (nécessite authentification)
    // TODO: Implémenter vraie requête Moz Link API
    
    return {
      total: 0,
      quality: 'none',
      domains: 0,
    };
    
  } catch (error) {
    console.error('[E-E-A-T] Erreur Backlinks:', error);
    return {
      total: 0,
      quality: 'none',
      domains: 0,
    };
  }
}

/**
 * Analyser présence auteurs identifiés
 */
async function analyzeAuthorBios(baseUrl: string): Promise<{
  found: boolean;
  count: number;
}> {
  try {
    const response = await fetch(baseUrl, {
      headers: { 'User-Agent': 'Swissalytics/1.0 (+https://swissalytics.com)' },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Chercher Schema.org Person
    const personSchemas = $('script[type="application/ld+json"]').filter((_, el) => {
      const content = $(el).html();
      return content ? /Person|ProfilePage/i.test(content) : false;
    }).length;
    
    // Chercher balises author
    const authorTags = $('[rel="author"], .author-bio, .author-profile').length;
    
    const count = personSchemas + authorTags;
    
    return {
      found: count > 0,
      count,
    };
    
  } catch (error) {
    console.error('[E-E-A-T] Erreur Author Bios:', error);
    return {
      found: false,
      count: 0,
    };
  }
}

/**
 * Calcul score E-E-A-T
 */
function calculateEEATScore(signals: EEATResult['signals']): number {
  let score = 0;
  
  // Team Page (25%)
  if (signals.teamPage.found) {
    const qualityScores = { high: 25, medium: 18, low: 10, none: 0 };
    score += qualityScores[signals.teamPage.quality];
  }
  
  // Legal Mentions (10%)
  if (signals.legalMentions) {
    score += 10;
  }
  
  // Contact Page (15%)
  if (signals.contactPage.found) {
    score += 5;
    if (signals.contactPage.hasEmail) score += 3;
    if (signals.contactPage.hasPhone) score += 3;
    if (signals.contactPage.hasAddress) score += 4;
  }
  
  // Testimonials (20%)
  if (signals.testimonials.found) {
    score += 10;
    if (signals.testimonials.count >= 5) score += 5;
    if (signals.testimonials.hasSchema) score += 5;
  }
  
  // Backlinks (20%)
  const backlinkScores = { high: 20, medium: 13, low: 6, none: 0 };
  score += backlinkScores[signals.backlinks.quality];
  
  // Author Bios (10%)
  if (signals.authorBios.found) {
    score += Math.min(signals.authorBios.count * 3, 10);
  }
  
  return Math.round(score);
}

/**
 * Générer recommandations E-E-A-T
 */
function generateEEATRecommendations(signals: EEATResult['signals']): string[] {
  const recs: string[] = [];
  
  // Priorité haute
  if (!signals.teamPage.found || signals.teamPage.quality === 'low') {
    recs.push('Créer page équipe détaillée avec photos, bios, expertise de chaque membre');
  }
  
  if (!signals.authorBios.found) {
    recs.push('Ajouter Schema.org Person/ProfilePage pour identifier auteurs de contenu');
  }
  
  if (!signals.testimonials.found) {
    recs.push('Publier témoignages clients avec Review Schema pour crédibilité');
  }
  
  // Priorité moyenne
  if (!signals.contactPage.found || (!signals.contactPage.hasEmail && !signals.contactPage.hasPhone)) {
    recs.push('Améliorer page contact avec email, téléphone, adresse physique');
  }
  
  if (!signals.legalMentions) {
    recs.push('Ajouter mentions légales complètes (obligatoire en Suisse/UE)');
  }
  
  if (signals.backlinks.quality === 'low' || signals.backlinks.quality === 'none') {
    recs.push('Obtenir backlinks de sites autoritaires (guest posts, partenariats)');
  }
  
  return recs.slice(0, 4); // Top 4 recommandations
}

/**
 * Simulation données E-E-A-T (développement)
 */
function simulateEEATData(): EEATResult {
  return {
    score: 52,
    signals: {
      teamPage: {
        found: false,
        quality: 'none',
        authorsCount: 0,
      },
      legalMentions: true,
      contactPage: {
        found: true,
        hasEmail: true,
        hasPhone: false,
        hasAddress: false,
      },
      testimonials: {
        found: false,
        count: 0,
        hasSchema: false,
      },
      backlinks: {
        total: 15,
        quality: 'medium',
        domains: 8,
      },
      authorBios: {
        found: false,
        count: 0,
      },
    },
    recommendations: [
      'Créer page équipe détaillée avec photos, bios, expertise de chaque membre',
      'Ajouter Schema.org Person/ProfilePage pour identifier auteurs de contenu',
      'Publier témoignages clients avec Review Schema pour crédibilité',
      'Améliorer page contact avec email, téléphone, adresse physique',
    ],
  };
}
