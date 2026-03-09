import { useMemo } from 'react';
import { useGetPopularQuery, useGetTrendingQuery } from '../services/tmdbApi';
import MovieCard from '../components/MovieCard';
import MovieSkeletonCard from '../components/MovieSkeletonCard';

const Charts = () => {
  const {
    data: trendingData,
    isLoading: trendingLoading,
    isError: trendingError,
  } = useGetTrendingQuery(1, { skip: false });

  const {
    data: popularData,
    isLoading: popularLoading,
    isError: popularError,
  } = useGetPopularQuery(1, { skip: false });

  const trending = useMemo(
    () => trendingData?.data?.results ?? trendingData?.results ?? [],
    [trendingData]
  );

  const popular = useMemo(
    () => popularData?.data?.results ?? popularData?.results ?? [],
    [popularData]
  );

  return (
    <div className="space-y-10 pt-12">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-r from-black/85 via-black/40 to-highlight/25 p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Box office view
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-text md:text-3xl lg:text-4xl">
                Charts
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-highlight shadow-[0_0_12px_var(--color-highlight)]" />
                Live rankings
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Explore stacked leaderboards for what&apos;s trending and what&apos;s
              universally popular, side by side.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-white/80">
            <div className="glass-soft flex flex-col gap-1 rounded-2xl px-3 py-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                Trending
              </span>
              <span className="text-sm font-semibold">
                Top {Math.min(trending.length || 0, 20)} titles
              </span>
              <span className="text-[11px] text-white/60">Based on daily buzz</span>
            </div>
            <div className="glass-soft flex flex-col gap-1 rounded-2xl px-3 py-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                Popular
              </span>
              <span className="text-sm font-semibold">
                Top {Math.min(popular.length || 0, 20)} titles
              </span>
              <span className="text-[11px] text-white/60">Long-tail favorites</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-highlight/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full bg-secondary/30 blur-3xl" />
      </header>

      <section className="js-section mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
              Chart A
            </h2>
            <p className="mt-1 text-base font-semibold text-text">Trending leaderboard</p>
          </div>
        </div>

        {trendingLoading && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <MovieSkeletonCard key={idx} />
            ))}
          </div>
        )}

        {!trendingLoading && trendingError && (
          <p className="text-sm text-accent">
            Failed to load trending chart. Please try again later.
          </p>
        )}

        {!trendingLoading && !trendingError && trending.length === 0 && (
          <p className="text-sm text-white/70">No trending titles found.</p>
        )}

        {!trendingLoading && !trendingError && trending.length > 0 && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {trending.map((item, index) => (
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

      <section className="js-section mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
              Chart B
            </h2>
            <p className="mt-1 text-base font-semibold text-text">Popular leaderboard</p>
          </div>
        </div>

        {popularLoading && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <MovieSkeletonCard key={idx} />
            ))}
          </div>
        )}

        {!popularLoading && popularError && (
          <p className="text-sm text-accent">
            Failed to load popular chart. Please try again later.
          </p>
        )}

        {!popularLoading && !popularError && popular.length === 0 && (
          <p className="text-sm text-white/70">No popular titles found.</p>
        )}

        {!popularLoading && !popularError && popular.length > 0 && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {popular.map((item, index) => (
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

export default Charts;

