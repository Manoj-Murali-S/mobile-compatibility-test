'use client';

/**
 * Search aliases for common mobile model names
 * Maps user inputs to full model names
 */
export const SEARCH_ALIASES: Record<string, string[]> = {
  'Galaxy S24': ['S24', 's24', 'S24', 'Galaxy S24', 'galaxy s24'],
};

/**
 * Find matching aliases for a search query
 */
export function getAliasedSearchTerms(query: string): string[] {
  const terms = new Set<string>();
  terms.add(query.toLowerCase());

  for (const [modelName, aliases] of Object.entries(SEARCH_ALIASES)) {
    if (aliases.some(alias => alias.toLowerCase() === query.toLowerCase())) {
      terms.add(modelName.toLowerCase());
    }
  }

  return Array.from(terms);
}

/**
 * Highlight matching text in a string
 * Returns array of objects with text and isMatch properties
 */
export interface HighlightedSegment {
  text: string;
  isMatch: boolean;
}

export function highlightMatches(
  text: string,
  query: string
): HighlightedSegment[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }];
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter(part => part.length > 0)
    .map(part => ({
      text: part,
      isMatch: regex.test(part),
    }));
}

/**
 * Normalize search query for consistent matching
 */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Check if text matches query (case-insensitive)
 */
export function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
