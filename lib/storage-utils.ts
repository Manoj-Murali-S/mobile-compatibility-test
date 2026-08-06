'use client';

const RECENT_SEARCHES_KEY = 'mobile-finder:recent-searches';
const MAX_RECENT_SEARCHES = 5;

export interface RecentSearch {
  id: string;
  query: string;
  brand: string;
  timestamp: number;
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): RecentSearch[] {
  try {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a search to recent searches
 * Limits to MAX_RECENT_SEARCHES and removes duplicates
 */
export function addRecentSearch(
  query: string,
  brand: string
): RecentSearch[] {
  try {
    if (typeof window === 'undefined') return [];
    if (!query.trim()) return [];

    const searches = getRecentSearches();

    // Remove duplicate if exists
    const filtered = searches.filter(
      s => !(s.query.toLowerCase() === query.toLowerCase() && s.brand === brand)
    );

    // Add new search to the beginning
    const newSearch: RecentSearch = {
      id: `${Date.now()}-${Math.random()}`,
      query,
      brand,
      timestamp: Date.now(),
    };

    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

    return updated;
  } catch {
    return [];
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Remove a specific recent search by id
 */
export function removeRecentSearch(id: string): RecentSearch[] {
  try {
    if (typeof window === 'undefined') return [];
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.id !== id);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}
