import { useMemo, useCallback, useSyncExternalStore } from 'react';
import { useDebounce } from './useDebounce';
import { normalizeQuery, subscribeToLatestResults, getLatestResultsForQuery } from './useSearch';

const MIN_SUGGESTION_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

/**
 * Extract unique suggestions from search results
 * Amazon-style: Shows query suggestions based on popular searches
 */
const extractSuggestions = (results, query) => {
  if (!results || results.length === 0) return [];
  
  const normalizedQuery = normalizeQuery(query);
  const suggestions = new Set();
  
  // Extract titles/names that start with the query
  results.forEach((item) => {
    const title = item.title || item.name || '';
    const normalizedTitle = normalizeQuery(title);
    
    if (normalizedTitle.startsWith(normalizedQuery) && normalizedTitle !== normalizedQuery) {
      suggestions.add(title);
    }
  });
  
  // Convert to array and limit
  return Array.from(suggestions).slice(0, MAX_SUGGESTIONS);
};

/**
 * Custom hook for Amazon-style search suggestions
 * Shows query suggestions while user types
 * 
 * @param {string} query - The search query string
 * @param {number} debounceDelay - Debounce delay in milliseconds (default: 300ms)
 * @returns {object} - Suggestions state and handlers
 */
export const useSearchSuggestions = (query, debounceDelay = 300) => {
  const EMPTY_SUGGESTIONS = useMemo(() => [], []);

  // Debounce the query for suggestions (keep it fast but stable)
  const debouncedQuery = useDebounce(query, debounceDelay);

  const normalizedQuery = useMemo(
    () => normalizeQuery(debouncedQuery),
    [debouncedQuery]
  );

  const getSnapshot = useCallback(() => {
    if (normalizedQuery.length < MIN_SUGGESTION_LENGTH) return EMPTY_SUGGESTIONS;
    // IMPORTANT: must return a referentially-stable value unless the store changed
    return getLatestResultsForQuery(normalizedQuery);
  }, [normalizedQuery, EMPTY_SUGGESTIONS]);

  /**
   * Subscribe to the latest search results from the main search pipeline.
   * This uses a small external store powered by `useSearch` so that
   * suggestions are always derived from already-fetched search results.
   */
  const latestResults = useSyncExternalStore(
    subscribeToLatestResults,
    getSnapshot,
    getSnapshot
  );

  const suggestions = useMemo(() => {
    if (normalizedQuery.length < MIN_SUGGESTION_LENGTH) return EMPTY_SUGGESTIONS;
    if (!latestResults || latestResults.length === 0) return EMPTY_SUGGESTIONS;
    return extractSuggestions(latestResults, debouncedQuery);
  }, [normalizedQuery, latestResults, debouncedQuery, EMPTY_SUGGESTIONS]);

  const isLoading = useMemo(() => {
    if (normalizedQuery.length < MIN_SUGGESTION_LENGTH) return false;
    return !latestResults || latestResults.length === 0;
  }, [normalizedQuery, latestResults]);

  return {
    suggestions,
    isLoading,
  };
};
