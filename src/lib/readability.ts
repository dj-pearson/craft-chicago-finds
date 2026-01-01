/**
 * Readability Score Calculation Utility
 *
 * Implements multiple readability formulas to calculate a composite readability score
 * for blog content. The score is normalized to a 0-100 scale where:
 * - 90-100: Very easy to read (5th grade level)
 * - 80-89: Easy to read (6th grade level)
 * - 70-79: Fairly easy (7th grade level)
 * - 60-69: Standard (8th-9th grade level)
 * - 50-59: Fairly difficult (10th-12th grade level)
 * - 30-49: Difficult (college level)
 * - 0-29: Very difficult (professional level)
 */

interface ReadabilityMetrics {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  complexWordCount: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
}

interface ReadabilityResult {
  score: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  metrics: ReadabilityMetrics;
  interpretation: string;
}

/**
 * Counts the number of syllables in a word using common English patterns
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();

  if (word.length <= 3) return 1;

  // Remove common silent endings
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Count vowel groups
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Extracts words from text, removing HTML tags and non-word characters
 */
function extractWords(text: string): string[] {
  // Remove HTML tags
  const cleanText = text.replace(/<[^>]*>/g, ' ');

  // Extract words (alphanumeric sequences)
  const words = cleanText
    .toLowerCase()
    .match(/[a-z0-9]+(?:'[a-z]+)?/gi);

  return words || [];
}

/**
 * Counts sentences in text
 */
function countSentences(text: string): number {
  // Remove HTML tags
  const cleanText = text.replace(/<[^>]*>/g, ' ');

  // Count sentence-ending punctuation, handling abbreviations
  const sentences = cleanText
    .replace(/([A-Z]\.)+/g, ' ') // Remove abbreviations like U.S.A.
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Jr|Sr)\./gi, ' ') // Remove common titles
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0);

  return Math.max(sentences.length, 1);
}

/**
 * Checks if a word is "complex" (3+ syllables)
 */
function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

/**
 * Calculate text metrics needed for readability formulas
 */
function calculateMetrics(text: string): ReadabilityMetrics {
  const words = extractWords(text);
  const wordCount = words.length;
  const sentenceCount = countSentences(text);

  let syllableCount = 0;
  let complexWordCount = 0;

  for (const word of words) {
    const syllables = countSyllables(word);
    syllableCount += syllables;
    if (syllables >= 3) {
      complexWordCount++;
    }
  }

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    complexWordCount,
    averageWordsPerSentence: wordCount / sentenceCount,
    averageSyllablesPerWord: syllableCount / Math.max(wordCount, 1),
  };
}

/**
 * Flesch Reading Ease formula
 * Score interpretation:
 * 90-100: Very easy
 * 80-89: Easy
 * 70-79: Fairly easy
 * 60-69: Standard
 * 50-59: Fairly difficult
 * 30-49: Difficult
 * 0-29: Very confusing
 */
function calculateFleschReadingEase(metrics: ReadabilityMetrics): number {
  const { wordCount, sentenceCount, syllableCount } = metrics;

  if (wordCount === 0 || sentenceCount === 0) return 0;

  const score = 206.835 -
    1.015 * (wordCount / sentenceCount) -
    84.6 * (syllableCount / wordCount);

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Flesch-Kincaid Grade Level formula
 * Returns approximate US grade level needed to understand the text
 */
function calculateFleschKincaidGrade(metrics: ReadabilityMetrics): number {
  const { wordCount, sentenceCount, syllableCount } = metrics;

  if (wordCount === 0 || sentenceCount === 0) return 0;

  const grade = 0.39 * (wordCount / sentenceCount) +
    11.8 * (syllableCount / wordCount) - 15.59;

  // Clamp to reasonable range (0-18 representing grade levels)
  return Math.max(0, Math.min(18, grade));
}

/**
 * Get interpretation text based on readability score
 */
function getInterpretation(score: number): string {
  if (score >= 90) return "Very easy to read - understood by 5th graders";
  if (score >= 80) return "Easy to read - conversational English";
  if (score >= 70) return "Fairly easy - understood by 7th graders";
  if (score >= 60) return "Standard - suitable for most readers";
  if (score >= 50) return "Fairly difficult - high school level";
  if (score >= 30) return "Difficult - college level reading";
  return "Very difficult - professional/academic level";
}

/**
 * Calculate comprehensive readability score for given text
 * Returns a score from 0-100 where higher is easier to read
 */
export function calculateReadabilityScore(text: string): ReadabilityResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      metrics: {
        wordCount: 0,
        sentenceCount: 0,
        syllableCount: 0,
        complexWordCount: 0,
        averageWordsPerSentence: 0,
        averageSyllablesPerWord: 0,
      },
      interpretation: "No content to analyze",
    };
  }

  const metrics = calculateMetrics(text);
  const fleschReadingEase = calculateFleschReadingEase(metrics);
  const fleschKincaidGrade = calculateFleschKincaidGrade(metrics);

  // Use Flesch Reading Ease as the primary score (already 0-100)
  const score = Math.round(fleschReadingEase);

  return {
    score,
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    metrics,
    interpretation: getInterpretation(score),
  };
}

/**
 * Simple function to just get the readability score number
 * For use in places where only the score is needed
 */
export function getReadabilityScore(text: string): number {
  return calculateReadabilityScore(text).score;
}

/**
 * Analyze content and provide improvement suggestions
 */
export function getReadabilitySuggestions(text: string): string[] {
  const result = calculateReadabilityScore(text);
  const suggestions: string[] = [];

  if (result.metrics.averageWordsPerSentence > 25) {
    suggestions.push("Consider breaking up long sentences (avg: " +
      Math.round(result.metrics.averageWordsPerSentence) + " words/sentence)");
  }

  if (result.metrics.averageSyllablesPerWord > 1.7) {
    suggestions.push("Try using simpler words with fewer syllables");
  }

  const complexWordPercentage =
    (result.metrics.complexWordCount / Math.max(result.metrics.wordCount, 1)) * 100;

  if (complexWordPercentage > 20) {
    suggestions.push("Reduce complex words (currently " +
      Math.round(complexWordPercentage) + "% of text)");
  }

  if (result.score < 60) {
    suggestions.push("Content may be too difficult for general audiences");
  }

  return suggestions;
}
