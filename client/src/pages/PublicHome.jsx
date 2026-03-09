import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useGetPopularQuery, useGetTrendingQuery } from '../services/tmdbApi';
import MovieCard from '../components/MovieCard';
import MovieSkeletonCard from '../components/MovieSkeletonCard';

const PublicHome = () => {
  const { data: trendingData, isLoading: trendingLoading, isError: trendingError } = useGetTrendingQuery(1, { skip: false });
  const { data: popularData, isLoading: popularLoading, isError: popularError } = useGetPopularQuery(1, { skip: false });

  const trending = useMemo(() => trendingData?.data?.results ?? [], [trendingData]);
  const popular = useMemo(() => popularData?.data?.results ?? [], [popularData]);

  return (
    <div className="cinematic-bg -mx-4 min-h-[calc(100vh-2rem)] px-4 pb-16 pt-12">
      <div className="mx-auto w-full max-w-6xl space-y-10">

        {/* Hero */}
        <section className="glass rounded-3xl p-8 md:p-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Premium movie discovery
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-text md:text-5xl">
              Discover what to watch next - with a cinematic, streaming-grade experience.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
              Explore trending and popular titles, curate favorites, build a watchlist, and keep a clean viewing history -
              all in a premium glass UI.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-full bg-highlight px-5 py-2.5 text-sm font-semibold text-black/90 transition hover:brightness-110"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/8"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* Trending */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Trending</h2>
          </div>

          {trendingLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, idx) => (
                <MovieSkeletonCard key={idx} />
              ))}
            </div>
          )}
          {!trendingLoading && trendingError && (
            <p className="text-sm text-white/60">Unable to load trending right now.</p>
          )}
          {!trendingLoading && !trendingError && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {trending.slice(0, 12).map((item) => (
                <MovieCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Popular */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Popular</h2>
          </div>

          {popularLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, idx) => (
                <MovieSkeletonCard key={idx} />
              ))}
            </div>
          )}
          {!popularLoading && popularError && (
            <p className="text-sm text-white/60">Unable to load popular right now.</p>
          )}
          {!popularLoading && !popularError && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {popular.slice(0, 12).map((item) => (
                <MovieCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PublicHome;

