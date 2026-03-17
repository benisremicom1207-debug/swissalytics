import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnalysisResult } from '@/lib/types';

// ── Colors ──────────────────────────────────────────────
const COLORS = {
  primary: [15, 23, 42] as [number, number, number],       // slate-900
  secondary: [100, 116, 139] as [number, number, number],  // slate-500
  accent: [99, 102, 241] as [number, number, number],      // indigo-500
  success: [34, 197, 94] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
  lightGray: [241, 245, 249] as [number, number, number],  // slate-100
  white: [255, 255, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],     // slate-200
};

// ── Helpers ─────────────────────────────────────────────

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.error;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function truncate(str: string, max: number): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ── Layout helpers ──────────────────────────────────────

const PAGE_WIDTH = 210;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const date = formatDate();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    doc.text('swissalytics.com', MARGIN, 285);
    doc.text(date, PAGE_WIDTH / 2, 285, { align: 'center' });
    doc.text(`${i} / ${pageCount}`, PAGE_WIDTH - MARGIN, 285, { align: 'right' });
    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 280, PAGE_WIDTH - MARGIN, 280);
  }
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2);
  return y + 10;
}

function checkNewPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 270) {
    doc.addPage();
    return 25;
  }
  return y;
}

function addKeyValueGrid(
  doc: jsPDF,
  y: number,
  items: [string, string][],
  colWidth = CONTENT_WIDTH / 2,
): number {
  const rowHeight = 8;
  let currentY = y;

  for (let i = 0; i < items.length; i += 2) {
    currentY = checkNewPage(doc, currentY, rowHeight + 2);

    // Alternating row background
    if (Math.floor(i / 2) % 2 === 0) {
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(MARGIN, currentY - 5, CONTENT_WIDTH, rowHeight, 'F');
    }

    // Left column
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    doc.text(items[i][0], MARGIN + 2, currentY);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(items[i][1], MARGIN + colWidth - 2, currentY, { align: 'right' });

    // Right column (if exists)
    if (i + 1 < items.length) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.secondary);
      doc.text(items[i + 1][0], MARGIN + colWidth + 4, currentY);
      doc.setTextColor(...COLORS.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(items[i + 1][1], MARGIN + CONTENT_WIDTH - 2, currentY, { align: 'right' });
    }

    currentY += rowHeight;
  }

  return currentY + 4;
}

// ── Page 1: Cover & Summary ─────────────────────────────

function buildCoverPage(doc: jsPDF, result: AnalysisResult) {
  // Header band
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 50, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SWISSALYTICS', MARGIN, 18);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("Rapport d'Analyse SEO", MARGIN, 34);

  // URL & date
  let y = 62;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text(`URL analysée :`, MARGIN, y);
  doc.setTextColor(...COLORS.accent);
  doc.setFont('helvetica', 'bold');
  doc.text(truncate(result.url, 80), MARGIN + 30, y);

  y += 7;
  doc.setTextColor(...COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${formatDate()}`, MARGIN, y);

  // Score circle area
  y += 16;
  const scoreColor = getScoreColor(result.score);
  const grade = getGrade(result.score);

  doc.setFillColor(...scoreColor);
  doc.circle(PAGE_WIDTH / 2, y + 18, 22, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(String(result.score), PAGE_WIDTH / 2, y + 22, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Grade ${grade}`, PAGE_WIDTH / 2, y + 32, { align: 'center' });

  // Category scores table
  y += 52;
  y = addSectionTitle(doc, y, 'Scores par Catégorie');

  const categories: [string, number][] = [
    ['Headings', result.headings.score],
    ['Images', result.images.score],
    ['Liens', result.links.score],
    ['Technique', result.technical.score],
    ['Metadata', result.metadata.score],
    ['Lisibilité', result.readability.score],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Catégorie', 'Score', 'Grade']],
    body: categories.map(([name, score]) => [name, `${score}/100`, getGrade(score)]),
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 9, cellPadding: 4, textColor: COLORS.primary },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightGray },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
  });

  // Issue summary
  const allIssues = [
    ...result.headings.issues,
    ...result.images.issues,
    ...result.links.issues,
    ...result.technical.issues,
    ...result.metadata.issues,
    ...result.readability.issues,
    ...result.keywords.issues,
  ];
  const errors = allIssues.filter(i => i.type === 'error').length;
  const warnings = allIssues.filter(i => i.type === 'warning').length;
  const infos = allIssues.filter(i => i.type === 'info').length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;

  y = addSectionTitle(doc, y, 'Résumé');
  y = checkNewPage(doc, y, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.setTextColor(...COLORS.error);
  doc.text(`${errors} erreur${errors !== 1 ? 's' : ''} critique${errors !== 1 ? 's' : ''}`, MARGIN, y);
  doc.setTextColor(...COLORS.warning);
  doc.text(`${warnings} amélioration${warnings !== 1 ? 's' : ''}`, MARGIN + 60, y);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`${infos} suggestion${infos !== 1 ? 's' : ''}`, MARGIN + 130, y);
}

// ── Page 2: Action Plan ─────────────────────────────────

function buildActionPlanPage(doc: jsPDF, result: AnalysisResult) {
  doc.addPage();
  let y = 25;
  y = addSectionTitle(doc, y, "Plan d'Action");

  const allIssues = [
    ...result.headings.issues.map(i => ({ ...i, cat: 'Headings' })),
    ...result.images.issues.map(i => ({ ...i, cat: 'Images' })),
    ...result.links.issues.map(i => ({ ...i, cat: 'Liens' })),
    ...result.technical.issues.map(i => ({ ...i, cat: 'Technique' })),
    ...result.metadata.issues.map(i => ({ ...i, cat: 'Metadata' })),
    ...result.readability.issues.map(i => ({ ...i, cat: 'Lisibilité' })),
    ...result.keywords.issues.map(i => ({ ...i, cat: 'Mots-clés' })),
  ];

  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  const infos = allIssues.filter(i => i.type === 'info');

  // Critical errors
  if (errors.length > 0) {
    y = checkNewPage(doc, y, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.error);
    doc.text(`Erreurs Critiques (${errors.length})`, MARGIN, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Problème', 'Catégorie']],
      body: errors.map((e, i) => [String(i + 1), truncate(e.message, 90), e.cat]),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.primary },
      headStyles: { fillColor: COLORS.error, textColor: COLORS.white },
      alternateRowStyles: { fillColor: [254, 226, 226] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 120 },
        2: { cellWidth: 38 },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Warnings
  if (warnings.length > 0) {
    y = checkNewPage(doc, y, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.warning);
    doc.text(`Améliorations (${warnings.length})`, MARGIN, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Amélioration', 'Catégorie']],
      body: warnings.map((w, i) => [String(i + 1), truncate(w.message, 90), w.cat]),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.primary },
      headStyles: { fillColor: COLORS.warning, textColor: COLORS.white },
      alternateRowStyles: { fillColor: [254, 243, 199] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 120 },
        2: { cellWidth: 38 },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Info (limited to 20)
  if (infos.length > 0) {
    y = checkNewPage(doc, y, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.secondary);
    doc.text(`Suggestions (${infos.length})`, MARGIN, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Suggestion', 'Catégorie']],
      body: infos.slice(0, 20).map((s, i) => [String(i + 1), truncate(s.message, 90), s.cat]),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.primary },
      headStyles: { fillColor: COLORS.secondary, textColor: COLORS.white },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 120 },
        2: { cellWidth: 38 },
      },
    });
  }
}

// ── Page 3: Technical ───────────────────────────────────

function buildTechnicalPage(doc: jsPDF, result: AnalysisResult) {
  doc.addPage();
  let y = 25;
  y = addSectionTitle(doc, y, 'Analyse Technique');

  const t = result.technical;
  const techItems: [string, string][] = [
    ['HTTPS', t.isHttps ? 'Oui' : 'Non'],
    ['robots.txt', t.robotsTxt.exists ? 'Présent' : 'Absent'],
    ['sitemap.xml', t.sitemap.exists ? 'Présent' : 'Absent'],
    ['llms.txt', t.llmsTxt.exists ? 'Présent' : 'Absent'],
    ['Canonical', t.canonical ? truncate(t.canonical, 50) : '—'],
    ['Langue', t.lang || '—'],
    ['Viewport', t.viewport ? 'Défini' : 'Absent'],
    ['Charset', t.charset || '—'],
    ['CMS', t.cms || '—'],
    ['Taille HTML', formatBytes(t.htmlSize)],
    ['Contenu mixte', `${t.mixedContentCount} élément${t.mixedContentCount !== 1 ? 's' : ''}`],
    ['Manifest', t.manifest.exists ? 'Présent' : 'Absent'],
  ];

  y = addKeyValueGrid(doc, y, techItems);

  // Core Web Vitals
  if (t.coreWebVitals) {
    for (const strategy of ['mobile', 'desktop'] as const) {
      const cwv = t.coreWebVitals[strategy];
      if (!cwv) continue;
      y += 4;
      y = checkNewPage(doc, y, 40);
      y = addSectionTitle(doc, y, `Core Web Vitals (${strategy === 'mobile' ? 'Mobile' : 'Desktop'})`);

      const cwvItems: [string, string][] = [
        ['Performance', `${cwv.performance}/100`],
        ['LCP', `${cwv.lcp.toFixed(1)} s`],
        ['FCP', `${cwv.fcp.toFixed(1)} s`],
        ['CLS', cwv.cls.toFixed(3)],
        ['TBT', `${cwv.tbt} ms`],
        ['Speed Index', `${cwv.si.toFixed(1)} s`],
      ];
      y = addKeyValueGrid(doc, y, cwvItems);
    }
  }

  // URL Structure
  y += 4;
  y = checkNewPage(doc, y, 40);
  y = addSectionTitle(doc, y, 'Structure URL');

  const urlItems: [string, string][] = [
    ['Longueur', `${t.urlStructure.length} caractères`],
    ['Profondeur', `${t.urlStructure.depth} niveaux`],
    ['Underscores', t.urlStructure.hasUnderscores ? 'Oui' : 'Non'],
    ['Majuscules', t.urlStructure.hasUppercase ? 'Oui' : 'Non'],
    ['Caractères spéciaux', t.urlStructure.hasSpecialChars ? 'Oui' : 'Non'],
    ['Mot-clé dans URL', t.urlStructure.keywordInUrl ? 'Oui' : 'Non'],
  ];
  y = addKeyValueGrid(doc, y, urlItems);

  // Resource Hints
  y += 4;
  y = checkNewPage(doc, y, 30);
  y = addSectionTitle(doc, y, 'Resource Hints');

  const hintsItems: [string, string][] = [
    ['Preconnect', String(t.resourceHints.preconnect)],
    ['Preload', String(t.resourceHints.preload)],
    ['Prefetch', String(t.resourceHints.prefetch)],
    ['DNS Prefetch', String(t.resourceHints.dnsPrefetch)],
  ];
  y = addKeyValueGrid(doc, y, hintsItems);

  // HTTP Headers
  y += 4;
  y = checkNewPage(doc, y, 30);
  y = addSectionTitle(doc, y, 'En-têtes HTTP');

  const headerItems: [string, string][] = [
    ['X-Robots-Tag', t.httpHeaders.xRobotsTag || '—'],
    ['Cache-Control', t.httpHeaders.cacheControl ? truncate(t.httpHeaders.cacheControl, 40) : '—'],
    ['CSP', t.httpHeaders.contentSecurityPolicy ? 'Oui' : 'Non'],
    ['HSTS', t.httpHeaders.strictTransportSecurity ? 'Oui' : 'Non'],
  ];
  y = addKeyValueGrid(doc, y, headerItems);

  // CSS & JS
  y += 4;
  y = checkNewPage(doc, y, 30);
  y = addSectionTitle(doc, y, 'Ressources CSS & JS');

  const resourceItems: [string, string][] = [
    ['CSS total', String(t.cssAnalysis.total)],
    ['CSS inline', String(t.cssAnalysis.inline)],
    ['JS total', String(t.jsAnalysis.total)],
    ['JS bloquant', String(t.jsAnalysis.blocking)],
  ];
  y = addKeyValueGrid(doc, y, resourceItems);
}

// ── Page 4: Content & Links ─────────────────────────────

function buildContentLinksPage(doc: jsPDF, result: AnalysisResult) {
  doc.addPage();
  let y = 25;
  y = addSectionTitle(doc, y, 'Contenu & Liens');

  // Headings
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Headings', MARGIN, y);
  y += 6;

  const headingCounts: [string, string][] = [
    ['H1', String(result.headings.h1.length)],
    ['H2', String(result.headings.h2.length)],
    ['H3', String(result.headings.h3.length)],
    ['H4', String(result.headings.h4.length)],
    ['H5', String(result.headings.h5.length)],
    ['H6', String(result.headings.h6.length)],
  ];
  y = addKeyValueGrid(doc, y, headingCounts);

  // List H1s
  if (result.headings.h1.length > 0) {
    y = checkNewPage(doc, y, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.secondary);
    doc.text('Balises H1 :', MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primary);
    for (const h1 of result.headings.h1.slice(0, 5)) {
      y = checkNewPage(doc, y, 6);
      doc.text(`• ${truncate(h1, 80)}`, MARGIN + 4, y);
      y += 5;
    }
    y += 2;
  }

  // List H2s
  if (result.headings.h2.length > 0) {
    y = checkNewPage(doc, y, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.secondary);
    doc.text('Balises H2 :', MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primary);
    for (const h2 of result.headings.h2.slice(0, 10)) {
      y = checkNewPage(doc, y, 6);
      doc.text(`• ${truncate(h2, 80)}`, MARGIN + 4, y);
      y += 5;
    }
    y += 2;
  }

  // Images
  y += 4;
  y = checkNewPage(doc, y, 30);
  y = addSectionTitle(doc, y, 'Images');

  const imgItems: [string, string][] = [
    ['Total', String(result.images.total)],
    ['Avec alt', String(result.images.withAlt)],
    ['Sans alt', String(result.images.withoutAlt)],
    ['Non responsive', String(result.images.withoutResponsive)],
  ];
  y = addKeyValueGrid(doc, y, imgItems);

  // Links
  y += 4;
  y = checkNewPage(doc, y, 30);
  y = addSectionTitle(doc, y, 'Liens');

  const linkItems: [string, string][] = [
    ['Total', String(result.links.total)],
    ['Internes', String(result.links.internal.length)],
    ['Externes', String(result.links.external.length)],
    ['Nofollow', String(result.links.nofollow)],
    ['Liens cassés (ext)', String(result.links.brokenLinks.length)],
    ['Liens cassés (int)', String(result.links.internalBrokenLinks.length)],
    ['Ancres vides', String(result.links.emptyAnchors)],
    ['Ancres génériques', String(result.links.genericAnchors)],
  ];
  y = addKeyValueGrid(doc, y, linkItems);

  // Keywords
  if (result.keywords.keywords.length > 0) {
    y += 4;
    y = checkNewPage(doc, y, 30);
    y = addSectionTitle(doc, y, 'Mots-clés');

    autoTable(doc, {
      startY: y,
      head: [['Mot-clé', 'Occurrences']],
      body: result.keywords.keywords.slice(0, 10).map(kw => [kw.word, String(kw.count)]),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.primary },
      headStyles: { fillColor: COLORS.accent, textColor: COLORS.white },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'center' },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6;

    // Keyword placement
    if (result.keywords.placement) {
      const p = result.keywords.placement;
      y = checkNewPage(doc, y, 30);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.secondary);
      doc.text(`Mot-clé principal : "${truncate(p.primary, 30)}"`, MARGIN, y);
      y += 6;

      const placementItems: [string, string][] = [
        ['Dans le titre', p.inTitle ? 'Oui' : 'Non'],
        ['Dans H1', p.inH1 ? 'Oui' : 'Non'],
        ['Dans meta description', p.inMetaDescription ? 'Oui' : 'Non'],
        ['Dans les 100 premiers mots', p.inFirst100Words ? 'Oui' : 'Non'],
        ['Densité', `${p.density.toFixed(2)}% (${p.densityStatus})`],
        ['Occurrences', `${p.keywordCount} / ${p.totalWords} mots`],
      ];
      y = addKeyValueGrid(doc, y, placementItems);
    }
  }
}

// ── Page 5: Metadata & Readability ──────────────────────

function buildMetadataReadabilityPage(doc: jsPDF, result: AnalysisResult) {
  doc.addPage();
  let y = 25;
  y = addSectionTitle(doc, y, 'Metadata & Social');

  const m = result.metadata;
  const metaItems: [string, string][] = [
    ['og:title', truncate(m.ogTitle || '—', 50)],
    ['og:description', truncate(m.ogDescription || '—', 50)],
    ['og:image', m.ogImage ? 'Présent' : 'Absent'],
    ['og:type', m.ogType || '—'],
    ['twitter:card', m.twitterCard || '—'],
    ['twitter:title', truncate(m.twitterTitle || '—', 50)],
    ['Favicon', m.favicon ? 'Présent' : 'Absent'],
    ['Robots', m.robots || '—'],
  ];
  y = addKeyValueGrid(doc, y, metaItems);

  // Structured Data
  y += 2;
  y = checkNewPage(doc, y, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.secondary);
  doc.text('Données structurées :', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.primary);
  if (m.structuredData.exists) {
    doc.text(m.structuredData.types.join(', ') || 'Présent', MARGIN + 50, y);
  } else {
    doc.text('Absent', MARGIN + 50, y);
  }
  y += 6;

  // Hreflang
  if (m.hreflang.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.secondary);
    doc.text('Hreflang :', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primary);
    doc.text(m.hreflang.map(h => h.lang).join(', '), MARGIN + 50, y);
    y += 6;
  }

  // Duplicates
  y += 4;
  y = checkNewPage(doc, y, 25);
  y = addSectionTitle(doc, y, 'Vérification des doublons');

  const dupItems: [string, string][] = [
    ['Titres dupliqués', m.duplicates.titleCount > 1 ? `${m.duplicates.titleCount} trouvés` : 'OK'],
    ['Descriptions dupliquées', m.duplicates.descriptionCount > 1 ? `${m.duplicates.descriptionCount} trouvées` : 'OK'],
    ['Title = og:title', m.duplicates.titleMatchesOg ? 'Identiques' : 'Différents'],
  ];
  y = addKeyValueGrid(doc, y, dupItems);

  // E-E-A-T
  y += 4;
  y = checkNewPage(doc, y, 35);
  y = addSectionTitle(doc, y, 'Signaux E-E-A-T');

  const e = m.eeat;
  const eeatItems: [string, string][] = [
    ['Auteur', e.hasAuthor ? (e.authorName || 'Oui') : 'Non'],
    ['Date de publication', e.hasPublishedDate ? (e.publishedDate || 'Oui') : 'Non'],
    ['Date de modification', e.hasModifiedDate ? (e.modifiedDate || 'Oui') : 'Non'],
    ['Lien contact', e.hasContactLink ? 'Oui' : 'Non'],
    ['Politique de confidentialité', e.hasPrivacyPolicy ? 'Oui' : 'Non'],
  ];
  y = addKeyValueGrid(doc, y, eeatItems);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.secondary);
  y = checkNewPage(doc, y, 8);
  doc.text(`Score E-E-A-T : ${e.signalCount}/5 signaux détectés`, MARGIN, y);
  y += 10;

  // Readability
  y = checkNewPage(doc, y, 40);
  y = addSectionTitle(doc, y, 'Lisibilité');

  const r = result.readability;
  const readItems: [string, string][] = [
    ['Score Flesch', `${r.fleschScore} (${r.fleschLevel})`],
    ['Nombre de mots', String(r.wordCount)],
    ['Nombre de phrases', String(r.sentenceCount)],
    ['Nombre de paragraphes', String(r.paragraphCount)],
    ['Mots/phrase (moy.)', r.avgWordsPerSentence.toFixed(1)],
    ['Temps de lecture', `${r.readingTime} min`],
  ];
  y = addKeyValueGrid(doc, y, readItems);

  // Sentence distribution
  y += 4;
  y = checkNewPage(doc, y, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.secondary);
  doc.text('Distribution des phrases :', MARGIN, y);
  y += 6;

  const distItems: [string, string][] = [
    ['Très courtes (1-5 mots)', String(r.distribution.veryShort)],
    ['Courtes (6-10 mots)', String(r.distribution.short)],
    ['Moyennes (11-20 mots)', String(r.distribution.medium)],
    ['Longues (21-30 mots)', String(r.distribution.long)],
    ['Très longues (31+ mots)', String(r.distribution.veryLong)],
  ];
  y = addKeyValueGrid(doc, y, distItems);
}

// ── Main Export ─────────────────────────────────────────

export function generatePdfReport(result: AnalysisResult) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  buildCoverPage(doc, result);
  buildActionPlanPage(doc, result);
  buildTechnicalPage(doc, result);
  buildContentLinksPage(doc, result);
  buildMetadataReadabilityPage(doc, result);

  addFooter(doc);

  const domain = new URL(result.url).hostname.replace('www.', '');
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`seo-report-${domain}-${date}.pdf`);
}
