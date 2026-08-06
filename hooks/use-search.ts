import { useState, useCallback, useRef, useEffect } from 'react';
import { getAliasedSearchTerms, matchesQuery } from '@/lib/search-utils';

export interface SearchItem {
  id: string;
  name: string;
  brand?: string;
  variants?: number;
  accessories?: number;
  [key: string]: any;
}

export interface UseSearchResult<T extends SearchItem> {
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  results: T[];
  hasResults: boolean;
}

/**
 * Hook for debounced search with alias support
 * @param items - Array of items to search through
 * @param searchFields - Fields to search in (e.g., ['name', 'brand'])
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Search state and helpers
 */
export function useSearch<T extends SearchItem>(
  items: T[],
  searchFields: (keyof T)[] = ['name'] as (keyof T)[],
  debounceMs: number = 300
): UseSearchResult<T> {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<T[]>(items);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Perform search with debouncing
  const performSearch = useCallback(
    (searchQuery: string) => {
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // If query is empty, show all items
      if (!searchQuery.trim()) {
        setResults(items);
        setIsLoading(false);
        return;
      }

      // Show loading state
      setIsLoading(true);

      // Debounce the actual search
      debounceTimeoutRef.current = setTimeout(() => {
        const aliasedTerms = getAliasedSearchTerms(searchQuery);

        const filtered = items.filter(item => {
          return aliasedTerms.some(term =>
            searchFields.some(field => {
              const fieldValue = String(item[field] || '').toLowerCase();
              return matchesQuery(fieldValue, term);
            })
          );
        });

        setResults(filtered);
        setIsLoading(false);
      }, debounceMs);
    },
    [items, searchFields, debounceMs]
  );

  // Handle query change
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);
      performSearch(newQuery);
    },
    [performSearch]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    isLoading,
    results,
    hasResults: results.length > 0,
  };
}
