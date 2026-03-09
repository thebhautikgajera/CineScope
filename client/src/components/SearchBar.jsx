import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery } from '../slices/uiSlice';
import { useSearch } from '../hooks/useSearch';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import SearchSkeleton from './SearchSkeleton';
import SearchSuggestions from './SearchSuggestions';
import { getPosterUrl, getSafeTitle } from '../utils/fallbacks';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Memoized Result Item component for better performance
 * Netflix-style: Progressive rendering with images
 */
const ResultItem = memo(({ item, index, isSelected, theme, onSelect, onRef }) => {
  const title = getSafeTitle(item);
  const posterPath = item.poster_path || item.profile_path;
  const mediaType = item.media_type || (item.title ? 'movie' : item.name ? 'tv' : 'person');

  const year = useMemo(() => {
    if (mediaType === 'movie' && item.release_date) {
      return new Date(item.release_date).getFullYear();
    }
    if (mediaType === 'tv' && item.first_air_date) {
      return new Date(item.first_air_date).getFullYear();
    }
    if (mediaType === 'person') {
      return 'Person';
    }
    return '';
  }, [mediaType, item.release_date, item.first_air_date]);

  const handleClick = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <button
      ref={onRef}
      key={`${item.id}-${index}`}
      type="button"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`w-full px-4 py-3 text-left transition ${isSelected
        ? theme === 'dark'
          ? 'bg-slate-700'
          : 'bg-slate-100'
        : theme === 'dark'
          ? 'hover:bg-slate-700/50'
          : 'hover:bg-slate-50'
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Poster/Profile Image */}
        <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
          {posterPath ? (
            <img
              src={getPosterUrl(posterPath, 'w92')}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-300 dark:bg-slate-600">
              <Search size={16} className="text-slate-500" />
            </div>
          )}
        </div>

        {/* Title and Metadata */}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
            {title}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
              {year}
            </span>
            {mediaType !== 'person' && item.vote_average && (
              <>
                <span className={theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}>
                  •
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  {item.vote_average.toFixed(1)} ⭐
                </span>
              </>
            )}
          </div>
        </div>

        {/* Media Type Badge */}
        <div className="shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${mediaType === 'movie'
            ? theme === 'dark'
              ? 'bg-blue-600/20 text-blue-400'
              : 'bg-blue-50 text-blue-700'
            : mediaType === 'tv'
              ? theme === 'dark'
                ? 'bg-purple-600/20 text-purple-400'
                : 'bg-purple-50 text-purple-700'
              : theme === 'dark'
                ? 'bg-green-600/20 text-green-400'
                : 'bg-green-50 text-green-700'
            }`}>
            {mediaType === 'movie' ? 'Movie' : mediaType === 'tv' ? 'TV' : 'Person'}
          </span>
        </div>
      </div>
    </button>
  );
});

ResultItem.displayName = 'ResultItem';

/**
 * Enhanced SearchBar component with Netflix + Amazon hybrid search architecture
 * 
 * Features:
 * - Debounced search with minimum character threshold (≥2 chars)
 * - Amazon-style search suggestions
 * - Netflix-style progressive results rendering
 * - Skeleton loading UI (no spinners)
 * - Infinite scroll pagination
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape)
 * - Request deduplication
 * - Stale-while-revalidate caching
 * - Race condition protection
 * - Optimized rendering with memoization
 */
const SearchBar = ({
  debounceMs = 300,
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  compact = false,
} = {}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const query = useSelector((state) => state.ui.searchQuery);
  const { theme } = useTheme();

  const [localValue, setLocalValue] = useState(query);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Refs for DOM manipulation
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const resultItemRefs = useRef([]);
  const suggestionRefs = useRef([]);
  const loadMoreRef = useRef(null);

  // Use advanced search hook
  const {
    allResults,
    isSearching,
    error,
    showTrending,
    isTrending,
    hasMore,
    loadMore,
  } = useSearch(query, debounceMs);

  // Use search suggestions hook (faster debounce for suggestions)
  const { suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(localValue, 300);

  // Sync local value with Redux query (e.g. when changed elsewhere)
  useEffect(() => {
    setLocalValue(query);
  }, [query]);

  // Infinite scroll: Load more when scrolling to bottom
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isSearching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isSearching) {
          loadMore();
        }
      },
      {
        root: dropdownRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isSearching, loadMore]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        setSuggestionIndex(-1);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  /**
   * Handle input change
   * Memoized to prevent unnecessary re-renders
   */
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setLocalValue(value);
    setSelectedIndex(-1);
    setSuggestionIndex(-1);
    setShowSuggestions(true);

    const trimmed = value.trim();
    // Push query into global store directly to avoid effect-based feedback loops
    if (trimmed !== query) {
      dispatch(setSearchQuery(trimmed));
    }

    // Open dropdown when user types or when showing trending
    if (trimmed || showTrending) {
      setIsDropdownOpen(true);
    }
  }, [dispatch, query, showTrending]);

  /**
   * Handle input focus
   * Memoized to prevent unnecessary re-renders
   */
  const handleInputFocus = useCallback(() => {
    // Open dropdown when focused if there are results, trending, or suggestions
    if (allResults.length > 0 || showTrending || suggestions.length > 0 || !localValue.trim()) {
      setIsDropdownOpen(true);
    }
  }, [allResults.length, showTrending, suggestions.length, localValue]);

  /**
   * Handle input blur
   * Delay to allow click events on dropdown items
   */
  const blurTimeoutRef = useRef(null);
  const handleInputBlur = useCallback((e) => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Check if the blur is caused by clicking on dropdown
    const relatedTarget = e.relatedTarget;
    if (
      dropdownRef.current &&
      (dropdownRef.current.contains(relatedTarget) || relatedTarget === dropdownRef.current)
    ) {
      return; // Don't close if clicking inside dropdown
    }

    // Small delay to allow click events on dropdown items
    blurTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      setSuggestionIndex(-1);
      blurTimeoutRef.current = null;
    }, 200);
  }, []);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Handle clear button click
   */
  const handleClear = useCallback(() => {
    setLocalValue('');
    setSelectedIndex(-1);
    setSuggestionIndex(-1);
    dispatch(setSearchQuery(''));
    inputRef.current?.focus();
  }, [dispatch]);

  /**
   * Navigate to movie detail page
   */
  const handleSelectResult = useCallback((item) => {
    if (!item?.id) return;

    // Only navigate for movies and TV shows
    if (item.media_type === 'movie' || item.title) {
      navigate(`/movie/${item.id}`);
    } else if (item.media_type === 'tv' || item.name) {
      navigate(`/movie/${item.id}`);
    } else {
      // Skip person results
      return;
    }

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSuggestionIndex(-1);
    inputRef.current?.blur();
  }, [navigate]);

  /**
   * Handle suggestion select
   */
  const handleSelectSuggestion = useCallback((suggestion) => {
    setLocalValue(suggestion);
    dispatch(setSearchQuery(suggestion));
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [dispatch]);

  /**
   * Handle keyboard navigation
   * Supports ArrowUp/Down, Enter, and Escape keys
   * Works with both search results and suggestions
   */
  const handleKeyDown = useCallback((e) => {
    const hasResults = allResults.length > 0;
    const hasSuggestions = suggestions.length > 0 && showSuggestions;
    const maxResultIndex = allResults.length - 1;
    const maxSuggestionIndex = suggestions.length - 1;
    const isInSuggestions = suggestionIndex >= 0;
    const isInResults = selectedIndex >= 0;

    // Handle Enter when dropdown is closed or no results
    if (!isDropdownOpen || (!hasResults && !hasSuggestions)) {
      if (e.key === 'Enter' && localValue.trim()) {
        e.preventDefault();
        dispatch(setSearchQuery(localValue.trim()));
        setIsDropdownOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (hasSuggestions && (suggestionIndex < maxSuggestionIndex || !isInSuggestions)) {
          // Navigate in suggestions
          setSuggestionIndex((prev) => {
            const nextIndex = prev < maxSuggestionIndex ? prev + 1 : prev;
            if (nextIndex >= 0 && suggestionRefs.current[nextIndex]) {
              suggestionRefs.current[nextIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
            return nextIndex;
          });
          setSelectedIndex(-1);
        } else if (hasResults && (selectedIndex < maxResultIndex || !isInResults)) {
          // Navigate in results
          setSelectedIndex((prev) => {
            const nextIndex = prev < maxResultIndex ? prev + 1 : prev;
            if (nextIndex >= 0 && resultItemRefs.current[nextIndex]) {
              resultItemRefs.current[nextIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
            return nextIndex;
          });
          setSuggestionIndex(-1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isInResults && selectedIndex > 0) {
          // Navigate up in results
          setSelectedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : -1;
            if (nextIndex >= 0 && resultItemRefs.current[nextIndex]) {
              resultItemRefs.current[nextIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
            return nextIndex;
          });
        } else if (isInSuggestions && suggestionIndex > 0) {
          // Navigate up in suggestions
          setSuggestionIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : -1;
            if (nextIndex >= 0 && suggestionRefs.current[nextIndex]) {
              suggestionRefs.current[nextIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
              });
            }
            return nextIndex;
          });
        } else if (hasSuggestions && !isInResults) {
          // Move from results to suggestions
          setSuggestionIndex(maxSuggestionIndex);
          setSelectedIndex(-1);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (isInSuggestions && suggestionIndex >= 0 && suggestionIndex <= maxSuggestionIndex) {
          handleSelectSuggestion(suggestions[suggestionIndex]);
        } else if (isInResults && selectedIndex >= 0 && selectedIndex <= maxResultIndex) {
          handleSelectResult(allResults[selectedIndex]);
        } else if (hasResults) {
          // Select first result if none selected
          handleSelectResult(allResults[0]);
        } else if (hasSuggestions) {
          // Select first suggestion if none selected
          handleSelectSuggestion(suggestions[0]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        setSuggestionIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  }, [
    isDropdownOpen,
    allResults,
    suggestions,
    localValue,
    selectedIndex,
    suggestionIndex,
    showSuggestions,
    dispatch,
    handleSelectResult,
    handleSelectSuggestion,
  ]);

  // Reset selected indices when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [allResults]);

  // Reset refs arrays when results change
  useEffect(() => {
    resultItemRefs.current = resultItemRefs.current.slice(0, allResults.length);
  }, [allResults]);

  useEffect(() => {
    suggestionRefs.current = suggestionRefs.current.slice(0, suggestions.length);
  }, [suggestions]);

  // Memoize displayed results (limit to 20 for dropdown performance, rest via infinite scroll)
  const displayResults = useMemo(() => {
    return allResults.slice(0, 12);
  }, [allResults]);

  // Determine if we should show suggestions (only when query is short and has suggestions)
  const shouldShowSuggestions = useMemo(() => {
    return (
      showSuggestions &&
      suggestions.length > 0 &&
      localValue.trim().length >= 2 &&
      localValue.trim().length < 10 &&
      !isSearching &&
      allResults.length === 0
    );
  }, [showSuggestions, suggestions.length, localValue, isSearching, allResults.length]);

  return (
    <div className={`relative w-full ${compact ? 'max-w-md' : 'max-w-xl'} ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search movies, TV shows, and people..."
          className={`w-full rounded-full border py-2.5 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 ${compact ? 'py-2 text-[13px]' : ''} ${
            theme === 'dark'
              ? 'border-white/10 bg-white/5 text-text placeholder:text-white/50 focus:border-white/20 focus:ring-white/10'
              : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900/40 focus:ring-slate-900/10'
          } ${inputClassName}`}
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 mt-2 w-full max-h-[500px] overflow-y-auto overscroll-contain rounded-2xl border shadow-2xl ${theme === 'dark'
            ? 'border-white/10 bg-black backdrop-blur-xl'
            : 'border-slate-200 bg-white'
            } ${dropdownClassName}`}
          onWheel={(e) => {
            const target = e.currentTarget;
            if (target.scrollHeight > target.clientHeight) {
              e.stopPropagation();
            }
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
        >
          {/* Loading State - Skeleton UI (Netflix-style) */}
          {isSearching && displayResults.length === 0 && (
            <SearchSkeleton count={5} />
          )}

          {/* Error State */}
          {error && !isSearching && (
            <div className="px-4 py-8 text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                {error}
              </p>
            </div>
          )}

          {/* Search Suggestions (Amazon-style) */}
          {shouldShowSuggestions && (
            <SearchSuggestions
              suggestions={suggestions}
              isLoading={suggestionsLoading}
              selectedIndex={suggestionIndex}
              theme={theme}
              onSelect={handleSelectSuggestion}
              onRef={suggestionRefs}
            />
          )}

          {/* Results List */}
          {!isSearching && !error && displayResults.length > 0 && (
            <div className="py-2">
              {/* Section Header */}
              <div className="px-4 py-2">
                <p className={`text-xs font-semibold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  {isTrending ? 'Trending Now' : `Search Results${localValue.trim() ? ` for "${localValue.trim()}"` : ''}`}
                </p>
              </div>

              {/* Results - Progressive Rendering (Netflix-style) */}
              {displayResults.map((item, index) => (
                <ResultItem
                  key={`${item.id}-${index}`}
                  item={item}
                  index={index}
                  isSelected={selectedIndex === index}
                  theme={theme}
                  onSelect={handleSelectResult}
                  onRef={(el) => {
                    resultItemRefs.current[index] = el;
                  }}
                />
              ))}

              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="px-4 py-2 text-center">
                  {isSearching ? (
                    <SearchSkeleton count={3} />
                  ) : (
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                      Scroll for more results...
                    </p>
                  )}
                </div>
              )}

              {/* Show More Indicator */}
              {allResults.length > 20 && (
                <div className="px-4 py-2 text-center">
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                    Showing {displayResults.length} of {allResults.length} results
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {!isSearching && !error && displayResults.length === 0 && localValue.trim().length >= 2 && !shouldShowSuggestions && (
            <div className="px-4 py-8 text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                No results found for "{localValue.trim()}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
