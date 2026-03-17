import * as cheerio from 'cheerio';
import https from 'https';
import http from 'http';
import type { AnalysisResult } from '../types';
import { analyzeHeadings } from './headings';
import { analyzeImages } from './images';
import { analyzeLinks } from './links';
import { analyzeTechnical } from './technical';
import { analyzeMetadata } from './metadata';
import { analyzeReadability } from './readability';
import { analyzeKeywords } from './keywords';
import { calculateGlobalScore } from './score';

async function fetchHtml(url: string, maxRedirects = 5): Promise<{ html: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const mod = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'identity',
      },
      timeout: 10000,
      rejectUnauthorized: false,
    };

    const req = mod.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) {
          reject(new Error('Trop de redirections'));
          return;
        }
        const redirectUrl = new URL(res.headers.location, url).href;
        fetchHtml(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage}`));
        return;
      }

      const responseHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(res.headers)) {
        if (typeof value === 'string') responseHeaders[key] = value;
        else if (Array.isArray(value)) responseHeaders[key] = value.join(', ');
      }

      const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10MB
      const chunks: Buffer[] = [];
      let totalSize = 0;
      res.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_HTML_SIZE) {
          req.destroy();
          reject(new Error('Taille de la réponse trop importante (> 10 MB)'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf-8'), headers: responseHeaders }));
      res.on('error', reject);
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout: le site ne répond pas')); });
    req.on('error', reject);
    req.end();
  });
}

export async function analyzePage(url: string): Promise<AnalysisResult> {
  const parsed = new URL(url);
  const normalizedUrl = parsed.href;

  const { html, headers: responseHeaders } = await fetchHtml(normalizedUrl);
  const $ = cheerio.load(html);

  // Extract keywords BEFORE readability (which removes script/style tags)
  const keywords = analyzeKeywords($);
  const primaryKeyword = keywords.placement?.primary;

  const [headings, images, links, metadata, readability, technical] = await Promise.all([
    Promise.resolve(analyzeHeadings($, primaryKeyword)),
    Promise.resolve(analyzeImages($, normalizedUrl)),
    analyzeLinks($, normalizedUrl),
    Promise.resolve(analyzeMetadata($, normalizedUrl)),
    Promise.resolve(analyzeReadability($)),
    analyzeTechnical($, normalizedUrl, html, responseHeaders, primaryKeyword),
  ]);

  const score = calculateGlobalScore({
    headings, images, links, technical, metadata, readability, keywords,
  });

  return {
    url: normalizedUrl,
    timestamp: new Date().toISOString(),
    score,
    keywords,
    headings, images, links, technical, metadata, readability,
  };
}
