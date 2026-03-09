import { memo, useCallback } from 'react';

/**
 * Individual suggestion item component
 * Amazon-style: Clickable suggestion that fills the search input
 */
const SuggestionItem = memo(({ suggestion, isSelected, theme, onSelect, onRef }) => {
  const handleClick = useCallback(() => {
    onSelect(suggestion);
  }, [suggestion, onSelect]);

  return (
    <button
      ref={onRef}
      type="button"
      onClick={handleClick}
      className={`w-full px-4 py-2 text-left transition ${
        isSelected
          ? theme === 'dark'
            ? 'bg-slate-700'
            : 'bg-slate-100'
          : theme === 'dark'
          ? 'hover:bg-slate-700/50'
          : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">🔍</span>
        <span className={`text-sm ${
          theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
        }`}>
          {suggestion}
        </span>
      </div>
    </button>
  );
});

SuggestionItem.displayName = 'SuggestionItem';

/**
 * Search suggestions dropdown component
 * Amazon-style: Shows query suggestions while typing
 */
const SearchSuggestions = memo(({ 
  suggestions, 
  isLoading, 
  selectedIndex, 
  theme, 
  onSelect, 
  onRef 
}) => {
  if (isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 dark:border-slate-700">
      <div className="px-4 py-2">
        <p className={`text-xs font-semibold uppercase ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Suggestions
        </p>
      </div>
      <div ref={onRef}>
        {suggestions.map((suggestion, index) => (
          <SuggestionItem
            key={`${suggestion}-${index}`}
            suggestion={suggestion}
            isSelected={selectedIndex === index}
            theme={theme}
            onSelect={onSelect}
            onRef={(el) => {
              if (onRef && onRef.current) {
                onRef.current[index] = el;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
});

SearchSuggestions.displayName = 'SearchSuggestions';

export default SearchSuggestions;
