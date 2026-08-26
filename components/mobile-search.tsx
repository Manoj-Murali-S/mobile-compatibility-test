'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  highlightMatches,
  HighlightedSegment,
  normalizeQuery,
} from '@/lib/search-utils';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  RecentSearch,
} from '@/lib/storage-utils';
import { useSearch, SearchItem } from '@/hooks/use-search';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';

export interface MobileSearchProps<T extends SearchItem> {
  items: T[];
  searchFields?: (keyof T)[];
  placeholder?: string;
  debounceMs?: number;
  onSearch: (query: string, brand: string) => void;
  onSelect?: (item: T) => void;
  renderResult?: (
    item: T,
    query: string,
    isSelected: boolean
  ) => React.ReactNode;
  brand?: string;
  showRecentSearches?: boolean;
  showLoadingState?: boolean;
  emptyStateMessage?: string;
}

interface ResultItem extends SearchItem {
  id: string;
  name: string;
  brand?: string;
}

/**
 * Reusable MobileSearch component with:
 * - Instant debounced filtering
 * - Keyboard navigation (arrow keys, Enter)
 * - Text highlighting for matches
 * - Search aliases
 * - Recent searches with localStorage
 * - Loading and empty states
 */
export function MobileSearch<T extends SearchItem>({
  items,
  searchFields = ['name'] as (keyof T)[],
  placeholder = 'Search mobile models...',
  debounceMs = 300,
  onSearch,
  onSelect,
  renderResult,
  brand = 'All',
  showRecentSearches = true,
  showLoadingState = true,
  emptyStateMessage = 'No devices found',
}: MobileSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { query: searchQuery, isLoading, results } = useSearch(
    items,
    searchFields,
    debounceMs
  );

  const { selectedIndex, handleKeyDown: handleNavKeyDown } =
    useKeyboardNavigation(
      results.length,
      (index) => {
        if (results[index] && onSelect) {
          onSelect(results[index]);
          addRecentSearch(searchQuery, brand);
          setQuery('');
          setShowResults(false);
        }
      },
      () => {
        setShowResults(false);
        setIsFocused(false);
      }
    );

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Update results when query changes
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowResults(true);
    if (newQuery.trim()) {
      onSearch(newQuery, brand);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
    onSearch('', brand);
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    setQuery(search.query);
    setShowResults(true);
    onSearch(search.query, brand);
  };

  const handleRemoveRecent = (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();
    const updated = removeRecentSearch(id);
    setRecentSearches(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showResults) {
      handleNavKeyDown(e);
    } else {
      // Show results on arrow key press even if not showing
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowResults(true);
      }
    }
  };

  const displayResults = showResults && (!!query.trim() || recentSearches.length > 0);
  const hasNoResults = !!query.trim() && !isLoading && results.length === 0;

  return (
    <div className="w-full">
      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              if (query.trim() || recentSearches.length > 0) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click on results
              setTimeout(() => {
                setIsFocused(false);
              }, 200);
            }}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-10 py-3 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm focus:border-accent focus:bg-background transition-all"
            aria-label="Search mobile devices"
            aria-expanded={displayResults}
            aria-autocomplete="list"
            role="combobox"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results Dropdown */}
        <AnimatePresence>
          {displayResults && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="max-h-96 overflow-y-auto">
                {/* Loading State */}
                {showLoadingState && isLoading && (
                  <div className="p-4">
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-12 bg-muted rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {!isLoading && results.length > 0 && (
                  <div className="divide-y divide-border/30">
                    {results.map((item, index) => {
                      const isSelected = index === selectedIndex;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <button
                            onClick={() => {
                              if (onSelect) {
                                onSelect(item);
                                addRecentSearch(query, brand);
                                setQuery('');
                                setShowResults(false);
                              }
                            }}
                            className={`w-full text-left px-4 py-3 transition-all ${
                              isSelected
                                ? 'bg-accent/10 border-l-2 border-accent'
                                : 'hover:bg-muted/50'
                            }`}
                            aria-selected={isSelected}
                            role="option"
                          >
                            {renderResult ? (
                              renderResult(item, query, isSelected)
                            ) : (
                              <DefaultResultItem
                                item={item as ResultItem}
                                query={query}
                              />
                            )}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && hasNoResults && (
                  <div className="px-4 py-8 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {emptyStateMessage}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Try different keywords or brand filters
                    </p>
                  </div>
                )}

                {/* Recent Searches */}
                {!query.trim() &&
                  showRecentSearches &&
                  recentSearches.length > 0 && (
                    <div className="border-t border-border/30">
                      <div className="px-4 py-2">
                        <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                          Recent
                        </p>
                      </div>
                      <div className="divide-y divide-border/20">
                        {recentSearches.map((search, index) => (
                          <motion.button
                            key={search.id}
                            onClick={() => handleRecentSearchClick(search)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className={`w-full text-left px-4 py-2.5 transition-all group flex items-center justify-between hover:bg-muted/50 ${
                              selectedIndex - results.length === index
                                ? 'bg-accent/10'
                                : ''
                            }`}
                            aria-label={`Search for ${search.query} in ${search.brand}`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                              <div className="text-sm text-foreground/80">
                                {search.query}
                              </div>
                              {search.brand !== 'All' && (
                                <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded">
                                  {search.brand}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) =>
                                handleRemoveRecent(e, search.id)
                              }
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Remove ${search.query} from recent`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper Text */}
      {isFocused && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground/60">
          <span>↑↓ Navigate</span>
          <span>•</span>
          <span>↵ Select</span>
          <span>•</span>
          <span>Esc Close</span>
        </div>
      )}
    </div>
  );
}

/**
 * Default result item renderer with text highlighting
 */
function DefaultResultItem({
  item,
  query,
}: {
  item: ResultItem;
  query: string;
}) {
  const highlighted = highlightMatches(item.name, query);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">
          {highlighted.map((segment, i) => (
            <span
              key={i}
              className={
                segment.isMatch
                  ? 'bg-accent/20 text-accent font-semibold'
                  : ''
              }
            >
              {segment.text}
            </span>
          ))}
        </div>

      </div>
      {item.brand && (
        <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground/70 whitespace-nowrap">
          {item.brand}
        </span>
      )}
    </div>
  );
}
