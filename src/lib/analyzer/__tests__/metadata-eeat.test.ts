import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { detectEEAT } from '../metadata';

/**
 * EEAT trust-link detection — multilingue (FR/EN/DE/IT) + tel/mailto.
 *
 * The pre-fix regex covered FR/EN paths only and missed DE/IT-pure sites
 * (Swisscom DE → false-positive "no contact / no legal" recos in the
 * action plan after P4 surfaced them). These tests pin the broader
 * coverage so future tweaks can't regress to the narrow set.
 */

function html(body: string): cheerio.CheerioAPI {
  return cheerio.load(`<html><body>${body}</body></html>`);
}

describe('detectEEAT — contact link', () => {
  it('matches French /contact', () => {
    const $ = html('<a href="/contact">Contact</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches French /aide (help-as-contact for telcos/SaaS)', () => {
    const $ = html('<a href="/fr/clients-prives/aide.html">Aide</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches German /hilfe', () => {
    const $ = html('<a href="/de/privatkunden/hilfe.html">Hilfe</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches German /kontakt', () => {
    const $ = html('<a href="/de/kontakt">Kontakt</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches German /impressum (Swiss/DACH legal-mandatory contact page)', () => {
    const $ = html('<a href="/impressum">Impressum</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches Italian /contatti', () => {
    const $ = html('<a href="/it/contatti">Contatti</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches Italian /aiuto', () => {
    const $ = html('<a href="/it/clienti-privati/aiuto.html">Aiuto</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches English /help', () => {
    const $ = html('<a href="/help">Help</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches English /customer-service', () => {
    const $ = html('<a href="/en/customer-service">Customer service</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches /about-us with hyphen', () => {
    const $ = html('<a href="/about-us">About</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches tel: link as direct contact signal', () => {
    const $ = html('<a href="tel:0800555155">0800 555 155</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('matches mailto: link as direct contact signal', () => {
    const $ = html('<a href="mailto:hello@swissalytics.ch">Email</a>');
    expect(detectEEAT($).hasContactLink).toBe(true);
  });

  it('returns false when no contact-shaped link present', () => {
    const $ = html('<a href="/products">Products</a>');
    expect(detectEEAT($).hasContactLink).toBe(false);
  });

  it('does NOT match /contracts as /contact (path-segment boundary)', () => {
    const $ = html('<a href="/contracts">Contracts</a>');
    expect(detectEEAT($).hasContactLink).toBe(false);
  });
});

describe('detectEEAT — privacy policy', () => {
  it('matches French /confidentialite', () => {
    const $ = html('<a href="/fr/confidentialite">Confidentialité</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(true);
  });

  it('matches French /protection-des-donnees', () => {
    const $ = html('<a href="/fr/protection-des-donnees">Protection</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(true);
  });

  it('matches German /datenschutz', () => {
    const $ = html('<a href="/de/datenschutz">Datenschutz</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(true);
  });

  it('matches German /datenschutzerklaerung', () => {
    const $ = html('<a href="/datenschutzerklaerung">Datenschutzerklärung</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(true);
  });

  it('matches English /privacy-policy', () => {
    const $ = html('<a href="/en/privacy-policy">Privacy</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(true);
  });

  it('matches compound path /data-privacy (leading hyphen boundary)', () => {
    // Real-world: Swisscom uses /de/about/legal/data-privacy
    const $ = html('<a href="/de/about/legal/data-privacy">Privacy</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(true);
  });

  it('matches Italian /riservatezza', () => {
    const $ = html('<a href="/it/riservatezza">Riservatezza</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(true);
  });

  it('returns false when no privacy link present', () => {
    const $ = html('<a href="/help">Help</a>');
    expect(detectEEAT($).hasPrivacyPolicy).toBe(false);
  });
});

describe('detectEEAT — terms of service', () => {
  it('matches French /mentions-legales', () => {
    const $ = html('<a href="/mentions-legales">Mentions légales</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(true);
  });

  it('matches French /cgu and /cgv', () => {
    const $cgu = html('<a href="/cgu">CGU</a>');
    const $cgv = html('<a href="/cgv">CGV</a>');
    expect(detectEEAT($cgu).hasTermsOfService).toBe(true);
    expect(detectEEAT($cgv).hasTermsOfService).toBe(true);
  });

  it('matches German /agb', () => {
    const $ = html('<a href="/de/agb">AGB</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(true);
  });

  it('matches German /impressum', () => {
    const $ = html('<a href="/impressum">Impressum</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(true);
  });

  it('matches German /nutzungsbedingungen', () => {
    const $ = html('<a href="/nutzungsbedingungen">Nutzungsbedingungen</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(true);
  });

  it('matches English /terms-of-service', () => {
    const $ = html('<a href="/terms-of-service">Terms</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(true);
  });

  it('matches Italian /note-legali', () => {
    const $ = html('<a href="/it/note-legali">Note legali</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(true);
  });

  it('matches Italian /termini-e-condizioni', () => {
    const $ = html('<a href="/it/termini-e-condizioni">Termini</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(true);
  });

  it('does NOT match /legalese as /legal (path-segment boundary)', () => {
    const $ = html('<a href="/legalese">Legalese</a>');
    expect(detectEEAT($).hasTermsOfService).toBe(false);
  });
});

describe('detectEEAT — signal aggregation', () => {
  it('counts all 3 trust signals when fully equipped', () => {
    const $ = html(`
      <a href="/de/kontakt">Kontakt</a>
      <a href="/de/datenschutz">Datenschutz</a>
      <a href="/de/agb">AGB</a>
    `);
    const eeat = detectEEAT($);
    expect(eeat.hasContactLink).toBe(true);
    expect(eeat.hasPrivacyPolicy).toBe(true);
    expect(eeat.hasTermsOfService).toBe(true);
    expect(eeat.signalCount).toBeGreaterThanOrEqual(3);
  });

  it('Swisscom-shaped page (DE+FR+IT links + tel:) gets all signals', () => {
    // Mimics what the Swisscom homepage exposes in static HTML (footer is
    // JS-rendered, but tel: + /hilfe + /aide + /aiuto are in the static
    // source). Pre-fix this triggered "no contact / no legal" recos.
    const $ = html(`
      <a href="/de/privatkunden/hilfe.html">Hilfe</a>
      <a href="/fr/clients-prives/aide.html">Aide</a>
      <a href="/it/clienti-privati/aiuto.html">Aiuto</a>
      <a href="tel:0800555155">0800 555 155</a>
      <a href="/de/about/legal/data-privacy">Datenschutz</a>
      <a href="/de/agb">AGB</a>
    `);
    const eeat = detectEEAT($);
    expect(eeat.hasContactLink).toBe(true);
    expect(eeat.hasPrivacyPolicy).toBe(true);
    expect(eeat.hasTermsOfService).toBe(true);
  });
});
