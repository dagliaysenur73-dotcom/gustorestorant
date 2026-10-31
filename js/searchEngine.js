// js/searchEngine.js - Turkish Character Normalization, Fuzzy Matching & Multi-criteria Filtering

import { CULINARY_ITEMS, MOOD_PRESETS } from '../data.js';
import { store } from './state.js';

/**
 * Standardize text into clean ASCII for robust fuzzy comparison
 */
export function cleanAscii(str) {
  if (!str) return '';
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

/**
 * Normalize text for Turkish & Latin characters and common typos (e.g., 'kös' -> 'köz')
 */
export function normalizeSearchText(str) {
  if (!str) return '';
  return cleanAscii(str)
    // Handle specific common phonetic typos
    .replace(/\bkös\b/gi, 'koz')
    .replace(/\bkose\b/gi, 'koze')
    .replace(/\bkos\b/gi, 'koz');
}

/**
 * Calculate Levenshtein Distance between two strings (for typo tolerance)
 */
export function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy Matcher: Substring, prefix, or Levenshtein distance threshold
 */
export function fuzzyMatch(sourceStr, queryStr) {
  if (!sourceStr || !queryStr) return false;
  const source = normalizeSearchText(sourceStr);
  const query = normalizeSearchText(queryStr);

  if (!query) return true;

  // 1. Direct substring match (covers partial typing like "lev", "kar", "som")
  if (source.includes(query)) return true;

  // 2. Query words vs source words
  const queryWords = query.split(/\s+/).filter(Boolean);
  const sourceWords = source.split(/[\s,.\-()/]+/).filter(Boolean);

  // If multi-word query, every word should match either directly or fuzzily
  const allWordsMatch = queryWords.every(qWord => {
    // Direct inclusion
    if (source.includes(qWord)) return true;

    // Word-level prefix or fuzzy comparison
    return sourceWords.some(sWord => {
      // Prefix match (typing "levr" matches "levrek")
      if (sWord.startsWith(qWord) || qWord.startsWith(sWord)) {
        return Math.min(sWord.length, qWord.length) >= 2;
      }

      // Levenshtein fuzzy distance for typo tolerance
      if (qWord.length >= 3) {
        const allowedDist = qWord.length <= 4 ? 1 : 2;
        return levenshteinDistance(sWord, qWord) <= allowedDist;
      }
      return false;
    });
  });

  return allWordsMatch;
}

/**
 * Filter Engine: Multi-criteria Instant Search, Category, Origin, and Mood Predicates
 */
export function getFilteredItems() {
  return CULINARY_ITEMS.filter(item => {
    // 1. Category Filter
    if (store.state.activeCategory !== 'all' && item.category !== store.state.activeCategory) {
      return false;
    }

    // 2. Mood Filter
    if (store.state.activeMood !== 'all') {
      const moodDef = MOOD_PRESETS.find(m => m.id === store.state.activeMood);
      if (moodDef && moodDef.filter && !moodDef.filter(item)) {
        return false;
      }
    }

    // 3. Dedicated Origin Filter (with Fuzzy Search)
    if (store.state.originQuery && store.state.originQuery !== 'all') {
      const originMatch = fuzzyMatch(item.origin, store.state.originQuery) ||
                          (item.tags || []).some(t => fuzzyMatch(t, store.state.originQuery));
      if (!originMatch) {
        return false;
      }
    }

    // 4. Search Query Filter (with Fuzzy Search)
    if (store.state.searchQuery) {
      const rawQ = store.state.searchQuery.toLowerCase();
      const normQ = normalizeSearchText(store.state.searchQuery);

      // Check text in all searchable fields
      const searchableTexts = [
        item.title,
        item.titleEn,
        item.tagline,
        item.origin,
        item.chefSecret,
        ...(item.tags || []),
        ...(item.dietary || [])
      ].map(t => (t || ''));

      // Direct lowercase or normalized or Levenshtein fuzzy match
      const textMatch = searchableTexts.some(txt => {
        return fuzzyMatch(txt, store.state.searchQuery);
      });

      // Semantic Sensory profile check (Acı, Köz, Tatlı, Ekşi, Ferah, Hafif)
      const isAciQuery = normQ.includes('aci') || rawQ.includes('acı') || rawQ.includes('baharat');
      const aciMatch = isAciQuery && (item.flavorProfile.spice >= 40 || searchableTexts.some(t => normalizeSearchText(t).includes('biber') || normalizeSearchText(t).includes('baharat')));

      const isKozQuery = normQ.includes('koz') || rawQ.includes('köz') || rawQ.includes('kös') || normQ.includes('kos');
      const kozMatch = isKozQuery && searchableTexts.some(t => {
        const n = normalizeSearchText(t);
        return n.includes('koz') || n.includes('izgara') || n.includes('tutsu') || n.includes('ates');
      });

      const isTatliQuery = normQ.includes('tatli') || rawQ.includes('tatlı');
      const tatliMatch = isTatliQuery && item.flavorProfile.sweetness >= 40;

      const isEksiQuery = normQ.includes('eksi') || rawQ.includes('ekşi') || normQ.includes('ferah');
      const eksiMatch = isEksiQuery && item.flavorProfile.acidity >= 50;

      return textMatch || aciMatch || kozMatch || tatliMatch || eksiMatch;
    }

    return true;
  });
}

