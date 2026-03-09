import { memo } from 'react';

/**
 * Skeleton loader for search result items
 * Netflix-style: Shows animated skeleton cards while loading
 */
const SearchSkeletonItem = memo(() => {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Poster skeleton */}
      <div className="h-12 w-8 shrink-0 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      
      {/* Content skeleton */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      
      {/* Badge skeleton */}
      <div className="h-6 w-12 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
});

SearchSkeletonItem.displayName = 'SearchSkeletonItem';

/**
 * Search skeleton loader component
 * Displays multiple skeleton items
 */
const SearchSkeleton = memo(({ count = 5 }) => {
  return (
    <div className="py-2">
      {Array.from({ length: count }).map((_, index) => (
        <SearchSkeletonItem key={index} />
      ))}
    </div>
  );
});

SearchSkeleton.displayName = 'SearchSkeleton';

export default SearchSkeleton;
