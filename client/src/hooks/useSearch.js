import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLazySearchMultiQuery, useGetTrendingQuery } from '../services/tmdbApi';
import { useDebounce } from './useDebounce';

/**
 * Cache entry structure with expiration and access time for LRU
 * Enhanced with stale-while-revalidate support
 */
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes "fresh" cache
const CACHE_STALE_TTL = 20 * 60 * 1000; // 20 minutes total (stale-while-revalidate window)
const MAX_CACHE_SIZE = 50; // Maximum cache entries
const MIN_SEARCH_LENGTH = 2; // Minimum characters to trigger search

/**
 * LRU Cache implementation for search results with stale-while-revalidate
 * Uses access time to determine least recently used entries
 */
class LRUCache {
  constructor(maxSize = MAX_CACHE_SIZE) {
    this.cache = new Map(); // Map<normalizedQuery, { results, timestamp, accessTime, staleTimestamp }>
    this.maxSize = maxSize;
  }

  /**
   * Get cached results if available and not expired
   * Returns stale data if available (stale-while-revalidate pattern)
   * Updates access time for LRU tracking
   */
  get(normalizedQuery) {
    const cached = this.cache.get(normalizedQuery);
    if (!cached) return null;

    const now = Date.now();

    // Check if expired
    if (now - cached.timestamp > CACHE_STALE_TTL) {
      this.cache.delete(normalizedQuery);
      return null;
    }

    // Update access time for LRU
    cached.accessTime = now;

    // Return results (even if stale, for stale-while-revalidate)
    return {
      results: cached.results,
      isStale: now - cached.timestamp > CACHE_TTL,
    };
  }

  /**
   * Store results in cache with timestamp and access time
   * Evicts least recently used entry if cache is full
   */
  set(normalizedQuery, results) {
    const now = Date.now();

    // If key already exists, update it
    if (this.cache.has(normalizedQuery)) {
      const cached = this.cache.get(normalizedQuery);
      cached.results = results;
      cached.timestamp = now;
      cached.accessTime = now;
      cached.staleTimestamp = now + CACHE_STALE_TTL;
      return;
    }

    // If cache is full, evict least recently used entry
    if (this.cache.size >= this.maxSize) {
      let oldestKey = null;
      let oldestAccessTime = Infinity;

      for (const [key, value] of this.cache.entries()) {
        if (value.accessTime < oldestAccessTime) {
          oldestAccessTime = value.accessTime;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    // Add new entry
    this.cache.set(normalizedQuery, {
      results,
      timestamp: now,
      accessTime: now,
      staleTimestamp: now + CACHE_STALE_TTL,
    });
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.staleTimestamp) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }
}

/**
 * Normalize query for cache key
 * Ensures queries like "Batman", "batman", "BATMAN" reuse the same cache
 */
export const normalizeQuery = (query) => query.trim().toLowerCase();

/**
 * Request deduplication map (shared across all hook instances)
 * Prevents multiple simultaneous requests for the same query + page combination
 */
const requestDeduplicationMap = new Map(); // Map<`${normalizedQuery}:${page}`, Promise>

/**
 * Global LRU cache instance shared across all hook instances.
 * This allows multiple components to benefit from the same cached search results.
 */
const globalSearchCache = new LRUCache(MAX_CACHE_SIZE);

/**
 * Stable empty results reference so external-store snapshots don't allocate new arrays
 * (required for `useSyncExternalStore` snapshot stability).
 */
const EMPTY_RESULTS = [];

/**
 * Lightweight external store for latest search results by normalized query.
 * This is used by `useSearchSuggestions` to derive Amazon-style suggestions
 * without issuing additional API calls.
 */
const latestResultsStore = {
  map: new Map(), // Map<normalizedQuery, results[]>
  listeners: new Set(),
};

const notifyLatestResultsListeners = () => {
  latestResultsStore.listeners.forEach((listener) => listener());
};

const publishLatestResults = (normalizedQuery, results) => {
  const prev = latestResultsStore.map.get(normalizedQuery);
  if (prev === results) return;
  latestResultsStore.map.set(normalizedQuery, results);
  notifyLatestResultsListeners();
};

export const subscribeToLatestResults = (listener) => {
  latestResultsStore.listeners.add(listener);
  return () => {
    latestResultsStore.listeners.delete(listener);
  };
};

export const getLatestResultsForQuery = (query) => {
  const normalizedQuery = normalizeQuery(query);
  const entry = latestResultsStore.map.get(normalizedQuery);
  return entry || EMPTY_RESULTS;
};

/**
 * Production-ready custom hook for Netflix + Amazon hybrid search functionality
 * 
 * Features:
 * - Debounced search with minimum character threshold (≥2 chars)
 * - Race condition protection using request IDs
 * - LRU cache with stale-while-revalidate pattern
 * - Request deduplication to prevent duplicate API calls
 * - Trending fallback when search is empty
 * - Proper cleanup to prevent memory leaks
 * - Progressive results rendering
 * - Infinite scroll pagination support
 * 
 * @param {string} query - The search query string
 * @param {number} debounceDelay - Debounce delay in milliseconds (default: 400ms)
 * @returns {object} - Search state and handlers
 */
export const useSearch = (query, debounceDelay = 400) => {
  const [searchResults, setSearchResults] = useState([]);
  const [allResults, setAllResults] = useState([]); // For infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showTrending, setShowTrending] = useState(false);

  // Request ID to track the latest request (prevents race conditions)
  const requestIdRef = useRef(0);

  // Track the last in-flight RTK Query promise so we can cancel it
  const lastRequestRef = useRef(null);

  // Keep track of the last normalized query used for search so we can
  // publish aggregated results to the suggestions store.
  const lastNormalizedQueryRef = useRef('');

  // RTK Query hooks
  const [triggerSearch] = useLazySearchMultiQuery();

  // Prefetch trending data on mount (don't skip)
  const { data: trendingData, isLoading: trendingLoading } = useGetTrendingQuery(1);

  // Debounce the query using the reusable hook
  const debouncedQuery = useDebounce(query, debounceDelay);

  /**
   * Cancel current RTK Query request (if any) using the lazy query promise's
   * abort() method. This is the supported way to cancel in-flight RTK Query
   * lazy queries.
   */
  const cancelCurrentRequest = useCallback(() => {
    if (lastRequestRef.current && typeof lastRequestRef.current.abort === 'function') {
      lastRequestRef.current.abort();
    }
    lastRequestRef.current = null;
  }, []);

  /**
   * Perform search with caching, request deduplication, and proper request cancellation
   */
  const performSearch = useCallback(async (searchQuery, page = 1) => {
    const normalizedQuery = normalizeQuery(searchQuery);

    // Minimum character threshold
    if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setAllResults([]);
      setIsSearching(false);
      setError(null);
      setHasMore(false);
      return;
    }

    // Check cache first (global shared LRU cache)
    globalSearchCache.cleanup();
    const cached = globalSearchCache.get(normalizedQuery);

    if (cached && !cached.isStale && page === 1) {
      // Fresh cache hit - return immediately
      setSearchResults(cached.results);
      setAllResults(cached.results);
      setIsSearching(false);
      setError(null);
      setHasMore(cached.results.length >= 20); // Assume more if we got 20 results

      // Push cached results into the external suggestions store
      publishLatestResults(normalizedQuery, cached.results);
      return;
    }

    // If we have stale data, show it immediately (stale-while-revalidate)
    if (cached && cached.isStale && page === 1) {
      setSearchResults(cached.results);
      setAllResults(cached.results);
      // Push stale cached results immediately, then continue to fetch fresh data in background
      publishLatestResults(normalizedQuery, cached.results);
      // Continue to fetch fresh data in background
    }

    // Record the normalized query for this search
    if (page === 1) {
      lastNormalizedQueryRef.current = normalizedQuery;
    }

    // Check for request deduplication
    const cacheKey = `${normalizedQuery}:${page}`;
    if (requestDeduplicationMap.has(cacheKey)) {
      // Attach to in-flight request for this query + page combination
      const sharedPromise = requestDeduplicationMap.get(cacheKey);
      lastRequestRef.current = sharedPromise;
      const currentRequestId = ++requestIdRef.current;

      try {
        const result = await sharedPromise;

        // Check if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          return; // A newer request has started, ignore this result
        }

        const results = result?.data?.results ?? [];
        const totalPages = result?.data?.total_pages ?? 0;

        if (page === 1) {
          setSearchResults(results);
          setAllResults(results);
          // Cache the results
          globalSearchCache.set(normalizedQuery, results);
        } else {
          // Append for infinite scroll
          setAllResults((prev) => [...prev, ...results]);
          setSearchResults((prev) => [...prev, ...results]);
        }

        // Push latest aggregated results into suggestions store
        if (page === 1) {
          publishLatestResults(normalizedQuery, results);
        }

        setHasMore(page < totalPages);
        setCurrentPage(page);
        setError(null);
      } catch (err) {
        const isAborted =
          err?.name === 'AbortError' ||
          err?.name === 'AbortedError' ||
          (typeof err?.message === 'string' && err.message.toLowerCase().includes('abort'));

        if (isAborted) {
          // Expected when a newer request cancels this one
          return;
        }

        if (currentRequestId === requestIdRef.current) {
          setError(err?.message || 'Search failed. Please try again.');
        }
      } finally {
        requestDeduplicationMap.delete(cacheKey);
        if (currentRequestId === requestIdRef.current) {
          setIsSearching(false);
        }
        if (lastRequestRef.current === sharedPromise) {
          lastRequestRef.current = null;
        }
      }
      return;
    }

    // No in-flight request for this query + page, start a new one
    cancelCurrentRequest();
    const currentRequestId = ++requestIdRef.current;

    setIsSearching(true);
    setError(null);

    try {
      const requestPromise = triggerSearch(
        { query: searchQuery, page },
        false
      );

      lastRequestRef.current = requestPromise;
      requestDeduplicationMap.set(cacheKey, requestPromise);

      const result = await requestPromise.unwrap();

      requestDeduplicationMap.delete(cacheKey);

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const results = result?.data?.results ?? [];
      const totalPages = result?.data?.total_pages ?? 0;

      if (page === 1) {
        setSearchResults(results);
        setAllResults(results);
        globalSearchCache.set(normalizedQuery, results);
      } else {
        setAllResults((prev) => [...prev, ...results]);
        setSearchResults((prev) => [...prev, ...results]);
      }

      if (page === 1) {
        publishLatestResults(normalizedQuery, results);
      }

      setHasMore(page < totalPages);
      setCurrentPage(page);
      setError(null);

    } catch (err) {
      // Remove from deduplication map
      requestDeduplicationMap.delete(cacheKey);

      const isAborted =
        err?.name === 'AbortError' ||
        err?.name === 'AbortedError' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('abort'));

      // Ignore errors from superseded or explicitly aborted requests
      if (isAborted || currentRequestId !== requestIdRef.current) {
        return;
      }

      setError(err?.message || 'Search failed. Please try again.');
      if (page === 1) {
        setSearchResults([]);
        setAllResults([]);
        publishLatestResults(normalizedQuery, []);
      }
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setIsSearching(false);
      }
      if (lastRequestRef.current && typeof lastRequestRef.current.abort !== 'function') {
        lastRequestRef.current = null;
      }
    }
  }, [triggerSearch, cancelCurrentRequest]);

  /**
   * Load more results for infinite scroll
   */
  const loadMore = useCallback(() => {
    const trimmedQuery = debouncedQuery.trim();
    if (trimmedQuery.length >= MIN_SEARCH_LENGTH && hasMore && !isSearching) {
      performSearch(trimmedQuery, currentPage + 1);
    }
  }, [debouncedQuery, hasMore, isSearching, currentPage, performSearch]);

  /**
   * Effect to handle search when debounced query changes
   */
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    // Show trending if query is empty
    if (!trimmedQuery) {
      setShowTrending(true);
      setSearchResults([]);
      setAllResults([]);
      setIsSearching(false);
      setError(null);
      setHasMore(false);
      setCurrentPage(1);
      cancelCurrentRequest();
      return;
    }

    // Hide trending when user types
    setShowTrending(false);

    // Normalize and store the current search key
    const normalizedQuery = normalizeQuery(trimmedQuery);
    lastNormalizedQueryRef.current = normalizedQuery;

    // Reset pagination for new search
    setCurrentPage(1);
    setAllResults([]);

    // Perform search (only if query meets minimum length)
    if (trimmedQuery.length >= MIN_SEARCH_LENGTH) {
      performSearch(trimmedQuery, 1);
    } else {
      setSearchResults([]);
      setAllResults([]);
      setIsSearching(false);
      setError(null);
      setHasMore(false);
      publishLatestResults(normalizedQuery, []);
    }

    // Cleanup: cancel request if query changes
    return () => {
      cancelCurrentRequest();
    };
  }, [debouncedQuery, performSearch, cancelCurrentRequest]);

  /**
   * Cleanup on unmount - prevent memory leaks
   */
  useEffect(() => {
    return () => {
      cancelCurrentRequest();
    };
  }, [cancelCurrentRequest]);

  // Get trending results (filter to show only movies and TV shows)
  const trendingResults = useMemo(() => {
    return (trendingData?.data?.results ?? []).filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    );
  }, [trendingData]);

  // When not showing trending, keep the external suggestions store in sync
  useEffect(() => {
    if (!showTrending && lastNormalizedQueryRef.current) {
      publishLatestResults(lastNormalizedQueryRef.current, allResults);
    }
  }, [allResults, showTrending]);

  return {
    searchResults: showTrending ? trendingResults : searchResults,
    allResults: showTrending ? trendingResults : allResults,
    isSearching: showTrending ? trendingLoading : isSearching,
    error,
    showTrending,
    isTrending: showTrending,
    hasMore,
    loadMore,
    currentPage,
  };
};
