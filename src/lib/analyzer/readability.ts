import * as cheerio from 'cheerio';
import type { CheerioAPI } from './cheerio';
import type { ReadabilityAnalysis, SentenceDistribution, SentenceInfo, Issue } from '../types';

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüÿç]/g, '');
  if (word.length <= 2) return 1;
  const vowels = word.match(/[aeiouyàâäéèêëïîôùûüÿ]+/gi);
  let count = vowels ? vowels.length : 1;
  if (word.endsWith('e') && !word.endsWith('le') && !word.endsWith('re')) count--;
  return Math.max(1, count);
}

function extractSentences(text: string): SentenceInfo[] {
  const raw = text.split(/(?<=[.!?])\s+/).filter((s) => {
    const trimmed = s.trim();
    if (trimmed.length < 3) return false;
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    return words.length >= 1;
  });

  return raw.map((s) => {
    const trimmed = s.trim();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    return {
      text: trimmed,
      wordCount: words.length,
      charCount: trimmed.length,
    };
  });
}

function classifyDistribution(sentences: SentenceInfo[]): SentenceDistribution {
  const dist: SentenceDistribution = { veryShort: 0, short: 0, medium: 0, long: 0, veryLong: 0 };
  for (const s of sentences) {
    if (s.wordCount <= 5) dist.veryShort++;
    else if (s.wordCount <= 10) dist.short++;
    else if (s.wordCount <= 20) dist.medium++;
    else if (s.wordCount <= 30) dist.long++;
    else dist.veryLong++;
  }
  return dist;
}

function generateTips(dist: SentenceDistribution, avgWords: number): string[] {
  const tips: string[] = [];

  if (dist.veryLong > 0) {
    tips.push(`Évitez les phrases très longues (31+ mots) autant que possible. Vous avez ${dist.veryLong} phrase(s) dans cette catégorie.`);
  }
  if (dist.long > 3) {
    tips.push(`Essayez de réduire le nombre de phrases longues (21-30 mots) dans votre contenu. Vous avez ${dist.long} phrases longues.`);
  }
  if (dist.veryLong > 0 || dist.long > 5) {
    tips.push('Découpez les phrases complexes en phrases plus courtes et plus faciles à lire.');
  }
  tips.push('Variez la longueur de vos phrases pour maintenir l\'intérêt du lecteur, mais privilégiez les phrases courtes.');
  if (avgWords > 20) {
    tips.push(`Votre longueur moyenne de phrase (${avgWords} mots) est élevée. Visez 15-20 mots en moyenne.`);
  }

  return tips;
}

export function analyzeReadability($: CheerioAPI): ReadabilityAnalysis {
  const issues: Issue[] = [];

  const $clean = cheerio.load($.html());
  $clean('script, style, noscript').remove();
  const bodyText = $clean('body').text().replace(/\s+/g, ' ').trim();

  const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  const sentences = extractSentences(bodyText);
  const sentenceCount = Math.max(1, sentences.length);

  const paragraphs = $('p').length || 1;
  const avgWordsPerSentence = Math.round((wordCount / sentenceCount) * 10) / 10;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const fleschScore = Math.round(
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount)
  );
  const clampedFlesch = Math.max(0, Math.min(100, fleschScore));

  let fleschLevel: string;
  if (clampedFlesch >= 90) fleschLevel = 'Très facile';
  else if (clampedFlesch >= 80) fleschLevel = 'Facile';
  else if (clampedFlesch >= 70) fleschLevel = 'Assez facile';
  else if (clampedFlesch >= 60) fleschLevel = 'Standard';
  else if (clampedFlesch >= 50) fleschLevel = 'Assez difficile';
  else if (clampedFlesch >= 30) fleschLevel = 'Difficile';
  else fleschLevel = 'Très difficile';

  const distribution = classifyDistribution(sentences);
  const longestSentences = [...sentences]
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 20);

  const tips = generateTips(distribution, avgWordsPerSentence);

  // Issues
  if (wordCount < 300) {
    issues.push({ type: 'warning', message: `Contenu court: ${wordCount} mots (recommandé: 300+)` });
  }
  if (avgWordsPerSentence > 25) {
    issues.push({ type: 'warning', message: `Phrases longues en moyenne: ${avgWordsPerSentence} mots/phrase (recommandé: < 20)` });
  } else if (avgWordsPerSentence > 20) {
    issues.push({ type: 'info', message: `Phrases un peu longues en moyenne: ${avgWordsPerSentence} mots/phrase (optimal: 15-20)` });
  }
  if (clampedFlesch < 30) {
    issues.push({ type: 'error', message: `Lisibilité très difficile (Flesch: ${clampedFlesch}) — le contenu est trop complexe` });
  } else if (clampedFlesch < 50) {
    issues.push({ type: 'warning', message: `Lisibilité difficile (Flesch: ${clampedFlesch}) — simplifiez le langage` });
  }
  if (distribution.veryLong > 2) {
    issues.push({ type: 'warning', message: `${distribution.veryLong} phrases très longues (31+ mots) détectées` });
  }

  // Scoring — strict
  let score = 100;

  // Word count (max -15)
  if (wordCount < 100) score -= 15;
  else if (wordCount < 300) score -= 8;

  // Flesch score — major factor (max -25)
  // Note: Flesch formula is calibrated for English — French text naturally scores lower
  if (clampedFlesch < 20) score -= 22;
  else if (clampedFlesch < 30) score -= 18;
  else if (clampedFlesch < 40) score -= 14;
  else if (clampedFlesch < 50) score -= 10;
  else if (clampedFlesch < 60) score -= 5;

  // Sentence length (max -15)
  if (avgWordsPerSentence > 30) score -= 15;
  else if (avgWordsPerSentence > 25) score -= 10;
  else if (avgWordsPerSentence > 20) score -= 5;

  // Very long sentences (max -10)
  if (distribution.veryLong > 5) score -= 10;
  else if (distribution.veryLong > 2) score -= 6;
  else if (distribution.veryLong > 0) score -= 3;

  return {
    score: Math.max(0, Math.min(100, score)),
    wordCount,
    sentenceCount,
    paragraphCount: paragraphs,
    avgWordsPerSentence,
    readingTime,
    fleschScore: clampedFlesch,
    fleschLevel,
    distribution,
    longestSentences,
    tips,
    issues,
  };
}
