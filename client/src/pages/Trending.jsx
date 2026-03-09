import { useMemo } from 'react';
import { useGetTrendingQuery } from '../services/tmdbApi';
import MovieCard from '../components/MovieCard';
import MovieSkeletonCard from '../components/MovieSkeletonCard';

const Trending = () => {
  const {
    data: trendingData,
    isLoading,
    isError,
  } = useGetTrendingQuery(1, { skip: false });

  const items = useMemo(
    () => trendingData?.data?.results ?? trendingData?.results ?? [],
    [trendingData]
  );

  return (
    <div className="space-y-10 pt-12">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-r from-black/80 via-black/40 to-highlight/20 p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Live pulse
            </p>
            <div className="mt-2 flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-text md:text-3xl lg:text-4xl">
                Trending now
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-highlight shadow-[0_0_12px_var(--color-highlight)]" />
                Updating daily
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              See what&apos;s capturing attention across movies and TV right now, in a
              single cinematic stream.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-soft flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-white/80">
              <span className="h-6 w-6 rounded-xl bg-white/10 text-center text-[11px] font-semibold leading-6 text-white/90">
                {items.length || 0}
              </span>
              <div className="flex flex-col">
                <span className="font-semibold">Titles</span>
                <span className="text-[11px] text-white/60">Now trending</span>
              </div>
            </div>
            <div className="glass-soft flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-white/80">
              <span className="h-6 w-6 rounded-xl bg-highlight/90 text-center text-[11px] font-semibold leading-6 text-black/90">
                TOP
              </span>
              <div className="flex flex-col">
                <span className="font-semibold">Global heat</span>
                <span className="text-[11px] text-white/60">Across movies &amp; TV</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-highlight/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-secondary/30 blur-3xl" />
      </header>

      <section className="js-section mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
              Collection
            </h2>
            <p className="mt-1 text-base font-semibold text-text">All trending titles</p>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 10 }).map((_, idx) => (
              <MovieSkeletonCard key={idx} />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <p className="text-sm text-accent">
            Failed to load trending titles. Please try again later.
          </p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <p className="text-sm text-white/70">
            No trending titles available right now.
          </p>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item, index) => (
              <div key={item.id} className="relative">
                <span className="absolute left-2 top-2 z-10 inline-flex h-6 min-w-7 items-center justify-center rounded-full bg-black/75 px-2 text-xs font-semibold text-white/90 ring-1 ring-white/15 backdrop-blur">
                  #{index + 1}
                </span>
                <MovieCard item={item} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Trending;

