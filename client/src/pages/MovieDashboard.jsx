import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useGetMoviesQuery,
  useGetPopularQuery,
  useGetTrendingQuery,
  useGetTVShowsQuery,
  useGetPeopleQuery,
} from '../services/tmdbApi';
import { useGetMovieGenresQuery } from '../services/genresApi';
import { useAddFavoriteMutation, useGetFavoritesQuery } from '../services/favoritesApi';
import MovieCard from '../components/MovieCard';
import MovieSkeletonCard from '../components/MovieSkeletonCard';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { favoritesToggle } from '../slices/librarySlice';

const Section = ({ title, loading, error, items, emptyMessage, onItemClick, genreMap }) => {
  return (
    <section className="js-section mb-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
      </div>
      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 10 }).map((_, idx) => (
            <MovieSkeletonCard key={idx} />
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-accent">
          Failed to load {title.toLowerCase()}. Please try again later.
        </p>
      )}
      {!loading && !error && (!items || items.length === 0) && (
        <p className="text-sm text-white/70">{emptyMessage}</p>
      )}
      {!loading && !error && items && items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <MovieCard
              key={item.id}
              item={item}
              genreMap={genreMap}
              onClick={onItemClick ? () => onItemClick(item) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const MovieDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [page, setPage] = useState(1);
  const loadMoreRef = useRef(null);
  const containerRef = useRef(null);
  const pagingLockRef = useRef(false);

  const { data: genresData } = useGetMovieGenresQuery();
  const genres = useMemo(
    () => genresData?.data?.genres ?? [],
    [genresData]
  );

  const genreMap = useMemo(() => {
    const m = new Map();
    for (const g of genres) {
      if (g?.id) m.set(g.id, g.name);
    }
    return m;
  }, [genres]);

  const { data: trendingData, isLoading: trendingLoading, isError: trendingError } =
    useGetTrendingQuery(1, { skip: false });
  const { data: popularData, isLoading: popularLoading, isError: popularError } =
    useGetPopularQuery(1, { skip: false });

  const {
    data: moviesData,
    isLoading: moviesLoading,
    isFetching: moviesFetching,
    isError: moviesError,
  } = useGetMoviesQuery({ page }, { skip: false });

  const hasMoreMovies = useMemo(() => {
    const p = moviesData?.data?.page ?? 1;
    const total = moviesData?.data?.total_pages ?? 1;
    return p < total;
  }, [moviesData]);

  const { data: tvData, isLoading: tvLoading, isError: tvError } = useGetTVShowsQuery(1, { skip: false });
  const { data: peopleData, isLoading: peopleLoading, isError: peopleError } = useGetPeopleQuery(1, { skip: false });

  const { data: favoritesData } = useGetFavoritesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [addFavorite] = useAddFavoriteMutation();

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (pagingLockRef.current) return;
        if (entry.isIntersecting && hasMoreMovies && !moviesFetching && !moviesLoading) {
          pagingLockRef.current = true;
          setPage((prev) => prev + 1);
        }
      },
      {
        rootMargin: '200px',
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMoreMovies, moviesFetching, moviesLoading]);

  useEffect(() => {
    if (!moviesFetching) {
      pagingLockRef.current = false;
    }
  }, [moviesFetching]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {

      gsap.utils.toArray('.js-section', containerRef.current).forEach((section) => {

        // section fade
        gsap.fromTo(
          section,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%"
            }
          }
        );

        // cards animation
        const cards = gsap.utils.toArray('.js-movie-card', section);

        if (!cards.length) return;

        gsap.fromTo(
          cards,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: "power2.out"
          }
        );

      });

    }, containerRef);

    return () => ctx.revert();

  }, [moviesData]);

  const trending = useMemo(
    () => trendingData?.data?.results ?? [],
    [trendingData]
  );
  const popular = useMemo(
    () => popularData?.data?.results ?? [],
    [popularData]
  );
  const movies = useMemo(
    () => moviesData?.data?.results ?? moviesData?.results ?? [],
    [moviesData]
  );
  const tvShows = useMemo(
    () => tvData?.data?.results ?? [],
    [tvData]
  );
  const people = useMemo(
    () => peopleData?.data?.results ?? [],
    [peopleData]
  );

  const favoriteIds = useMemo(
    () => new Set((favoritesData?.data ?? favoritesData ?? []).map((f) => f.movieId)),
    [favoritesData]
  );

  const handleOpenDetails = useCallback(
    (id) => {
      navigate(`/movie/${id}`);
    },
    [navigate]
  );

  const handleToggleFavorite = useCallback(
    async (item) => {
      dispatch(
        favoritesToggle({
          id: String(item.id),
          poster: item.poster_path || null,
          title: item.title || item.name || 'Untitled',
          rating: item.vote_average ?? null,
          releaseDate: item.release_date ?? null,
          mediaType: item.media_type ?? (item.title ? 'movie' : 'tv'),
          updatedAt: Date.now(),
        })
      );
      try {
        await addFavorite({
          movieId: String(item.id),
          movieTitle: item.title || item.name || 'Untitled',
          poster: item.poster_path || null,
          rating: item.vote_average ?? null,
        }).unwrap();
      } catch {
        // swallow error, UI handled by toast elsewhere if desired
      }
    },
    [addFavorite, dispatch]
  );

  return (
    <div ref={containerRef} className="space-y-10 pt-12">
      <div className="glass-soft flex flex-col justify-between gap-4 rounded-3xl p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-text md:text-3xl">Discover</h1>
          <p className="mt-1 text-sm text-white/70">
            A cinematic dashboard for trending, popular, and genre-based discovery.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/favorites"
          className="glass-soft rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/8"
        >
          Favorites
        </Link>
        <Link
          to="/watchlist"
          className="glass-soft rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/8"
        >
          Watchlist
        </Link>
        <Link
          to="/history"
          className="glass-soft rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/8"
        >
          Watch history
        </Link>
      </div>

      <Section
        title="Trending now"
        loading={trendingLoading}
        error={trendingError}
        items={trending}
        emptyMessage="No trending titles available right now."
        genreMap={genreMap}
        onItemClick={(item) => {
          if (item && (item.media_type === 'movie' || item.title)) {
            handleOpenDetails(item.id);
          }
        }}
      />

      <Section
        title="Popular movies"
        loading={popularLoading}
        error={popularError}
        items={popular}
        emptyMessage="No popular movies found."
        genreMap={genreMap}
        onItemClick={(item) => handleOpenDetails(item.id)}
      />

      <section className="js-section mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">
            All movies
          </h2>
          {moviesFetching && <span className="text-xs text-white/70">Loading more titles…</span>}
        </div>
        {moviesLoading && (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <MovieSkeletonCard key={idx} />
            ))}
          </div>
        )}
        {!moviesLoading && moviesError && (
          <p className="text-sm text-accent">Failed to load movies. Please try again later.</p>
        )}
        {!moviesLoading && !moviesError && movies.length === 0 && (
          <p className="text-sm text-white/70">No movies found.</p>
        )}
        {!moviesLoading && !moviesError && movies.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {movies.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  genreMap={genreMap}
                  onToggleFavorite={() => handleToggleFavorite(item)}
                  isFavorite={favoriteIds.has(String(item.id))}
                />
              ))}
            </div>
            {hasMoreMovies && (
              <div ref={loadMoreRef} className="mt-6 h-10 w-full">
                {/* IntersectionObserver anchor for infinite scroll */}
              </div>
            )}
          </>
        )}
      </section>

      <Section
        title="TV shows"
        loading={tvLoading}
        error={tvError}
        items={tvShows}
        emptyMessage="No TV shows found."
      />

      <Section
        title="People"
        loading={peopleLoading}
        error={peopleError}
        items={people}
        emptyMessage="No people found."
      />
    </div>
  );
};

export default MovieDashboard;

