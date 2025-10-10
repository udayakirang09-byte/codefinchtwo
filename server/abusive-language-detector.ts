// Abusive Language Detection Utility
// This utility detects abusive/offensive language in text messages

// Configurable list of abusive words (can be extended)
const ABUSIVE_WORDS = [
  // Common profanity
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap',
  // Offensive slurs and derogatory terms
  'idiot', 'moron', 'stupid', 'dumb', 'loser', 'trash', 'jerk',
  // Harassment terms
  'kill yourself', 'die', 'hate you', 'ugly', 'fat', 'worthless',
  // Add more as needed
];

export interface AbusiveLanguageResult {
  isAbusive: boolean;
  detectedWords: string[];
  originalText: string;
}

/**
 * Detect abusive language in a given text
 * @param text - The text to analyze
 * @returns Detection result with list of abusive words found
 */
export function detectAbusiveLanguage(text: string): AbusiveLanguageResult {
  if (!text || typeof text !== 'string') {
    return {
      isAbusive: false,
      detectedWords: [],
      originalText: text || '',
    };
  }

  // Normalize text for detection (lowercase, remove special chars)
  const normalizedText = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const detectedWords: string[] = [];

  // Check for each abusive word/phrase
  for (const abusiveWord of ABUSIVE_WORDS) {
    const pattern = new RegExp(`\\b${abusiveWord.replace(/\s+/g, '\\s+')}\\b`, 'i');
    
    if (pattern.test(normalizedText)) {
      // Store the original casing version if found
      const match = text.match(new RegExp(abusiveWord.split(' ').join('\\s*'), 'i'));
      if (match) {
        detectedWords.push(match[0]);
      } else {
        detectedWords.push(abusiveWord);
      }
    }
  }

  return {
    isAbusive: detectedWords.length > 0,
    detectedWords: Array.from(new Set(detectedWords)), // Remove duplicates
    originalText: text,
  };
}

/**
 * Add custom abusive words to the detection list
 * @param words - Array of words/phrases to add
 */
export function addAbusiveWords(words: string[]): void {
  for (const word of words) {
    if (word && !ABUSIVE_WORDS.includes(word.toLowerCase())) {
      ABUSIVE_WORDS.push(word.toLowerCase());
    }
  }
}

/**
 * Get the current list of abusive words
 * @returns Current abusive words list
 */
export function getAbusiveWordsList(): string[] {
  return [...ABUSIVE_WORDS];
}
