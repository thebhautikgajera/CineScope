import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  useGetMovieFullQuery,
} from '../services/tmdbApi';
import { useAddFavoriteMutation, useGetFavoritesQuery } from '../services/favoritesApi';
import { useAddHistoryMutation, useAddTrailerHistoryMutation } from '../services/historyApi';
import { useAddToWatchlistMutation, useRemoveFromWatchlistMutation } from '../services/watchlistApi';
import TrailerModal from '../components/TrailerModal';
import { useDispatch, useSelector } from 'react-redux';
import { closeTrailer, openTrailer } from '../slices/uiSlice';
import { getPosterUrl, getSafeOverview, getSafeTitle } from '../utils/fallbacks';
import { favoritesToggle, historyRecordDetailsView, historyRecordTrailerWatch, watchlistToggle } from '../slices/librarySlice';
import { toast } from 'react-hot-toast';
import MovieHero from '../components/MovieHero';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const getYoutubeThumbnail = (key) => (key ? `https://i.ytimg.com/vi/${key}/hqdefault.jpg` : null);

const MovieDetail = () => {
  const { id } = useParams();
  const {
    data: fullData,
    isLoading: fullLoading,
    isError: fullError,
  } = useGetMovieFullQuery(id);

  const { data: favoritesData } = useGetFavoritesQuery();
  const [addFavorite] = useAddFavoriteMutation();
  const [addHistory] = useAddHistoryMutation();
  const [addTrailerHistory] = useAddTrailerHistoryMutation();
  const [addToWatchlist] = useAddToWatchlistMutation();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const dispatch = useDispatch();
  const { isTrailerOpen, trailerKey } = useSelector((state) => state.ui);
  const watchlistState = useSelector((s) => s.library.watchlist);

  const movie = fullData?.data ?? fullData;
  const images = movie?.images ?? {};
  const videos = movie?.videos;
  const credits = movie?.credits ?? {};

  const bestTrailerKey = useMemo(() => {
    const videoResults = videos?.results ?? [];
    const youtubeVideos = videoResults.filter((v) => v.site === 'YouTube');
    const officialTrailer =
      youtubeVideos.find((v) => v.type === 'Trailer' && v.official) ||
      youtubeVideos.find((v) => v.type === 'Trailer') ||
      youtubeVideos[0];
    return officialTrailer?.key ?? null;
  }, [videos]);

  const backdrops = images?.backdrops ?? [];
  const cast = (credits?.cast ?? []).slice(0, 10);

  const favorites = favoritesData?.data ?? favoritesData ?? [];
  const isFavorite = favorites.some((f) => f.movieId === String(id));
  const isInWatchlist = Boolean(watchlistState?.byId?.[String(id)]);

  const handleFavorite = async () => {
    if (!movie) return;
    const wasFavorite = isFavorite;

    dispatch(
      favoritesToggle({
        id: String(id),
        poster: movie.poster_path || null,
        title: movie.title || movie.name || 'Untitled',
        rating: movie.vote_average ?? null,
        releaseDate: movie.release_date ?? null,
        mediaType: 'movie',
        updatedAt: Date.now(),
      })
    );

    try {
      await addFavorite({
        movieId: String(id),
        movieTitle: movie.title || movie.name || 'Untitled',
        poster: movie.poster_path || null,
        rating: movie.vote_average ?? null,
      }).unwrap();

      toast.success(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  const handleWatchlist = async () => {
    if (!movie) return;
    dispatch(
      watchlistToggle({
        id: String(id),
        poster: movie.poster_path || null,
        title: movie.title || movie.name || 'Untitled',
        rating: movie.vote_average ?? null,
        releaseDate: movie.release_date ?? null,
        mediaType: 'movie',
        updatedAt: Date.now(),
      })
    );
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(String(id)).unwrap();
        toast.success('Removed from watchlist');
      } else {
        await addToWatchlist({
          movieId: String(id),
          movieTitle: movie.title || movie.name || 'Untitled',
          poster: movie.poster_path || null,
          rating: movie.vote_average ?? null,
        }).unwrap();
        toast.success('Added to watchlist');
      }
    } catch {
      toast.error('Watchlist update failed');
    }
  };

  const handleOpenTrailer = async () => {
    if (movie) {
      const ts = Date.now();
      dispatch(
        historyRecordTrailerWatch({
          id: String(id),
          title: movie.title || movie.name || 'Untitled',
          youtubeId: bestTrailerKey,
          thumbnail: getYoutubeThumbnail(bestTrailerKey),
          timestamp: ts,
        })
      );
      try {
        await addTrailerHistory({
          movieId: String(id),
          title: movie.title || movie.name || 'Untitled',
          youtubeId: bestTrailerKey,
          thumbnail: getYoutubeThumbnail(bestTrailerKey),
        }).unwrap();
      } catch {
        // ignore
      }
    }
    dispatch(openTrailer(bestTrailerKey));
  };

  // Add to history when page opens (viewed)
  useEffect(() => {
    if (!movie) return;
    dispatch(
      historyRecordDetailsView({
        id: String(id),
        poster: movie.poster_path || null,
        title: movie.title || movie.name || 'Untitled',
        rating: movie.vote_average ?? null,
        releaseDate: movie.release_date ?? null,
        timestamp: Date.now(),
      })
    );
    addHistory({
      movieId: String(id),
      title: movie.title || movie.name || 'Untitled',
      poster: movie.poster_path || null,
    }).catch(() => {});
  }, [movie, addHistory, id, dispatch]);

  if (fullLoading) {
    return (
      <div className="space-y-6 pt-12">
        <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200" />
        <div className="space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (fullError || !movie) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-700">
        Unable to load this movie right now. Please try again later.
      </div>
    );
  }

  const posterPath = movie.poster_path;
  const title = getSafeTitle(movie);
  const overview = getSafeOverview(movie.overview);
  const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : null;
  const genres = Array.isArray(movie.genres) ? movie.genres : [];
  const language = movie.original_language || movie.spoken_languages?.[0]?.english_name;
  const backdropPath = movie.backdrop_path || backdrops?.[0]?.file_path || null;
  const trailerThumb = bestTrailerKey ? getYoutubeThumbnail(bestTrailerKey) : null;

  return (
    <>
      <MovieHero
        posterPath={posterPath}
        backdropPath={backdropPath}
        title={title}
        overview={overview}
        rating={rating}
        releaseDate={movie.release_date}
        runtime={movie.runtime}
        language={language}
        genres={genres}
        popularity={movie.popularity}
        videos={videos}
        photosCount={backdrops?.length ?? 0}
        isFavorite={isFavorite}
        isInWatchlist={isInWatchlist}
        onPlayTrailer={handleOpenTrailer}
        onToggleFavorite={handleFavorite}
        onToggleWatchlist={handleWatchlist}
      />

      {/* Trailer preview */}
      {trailerThumb ? (
        <section className="mt-8 h-full w-full">
          <div className="glass-soft overflow-hidden rounded-3xl">
            <button
              type="button"
              onClick={handleOpenTrailer}
              className="group relative block w-full text-left"
            >
              <div className="relative aspect-video w-full">
                <img
                  src={trailerThumb}
                  alt={`Trailer thumbnail for ${title}`}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-sm font-semibold text-white/90">Trailer</p>
                  <p className="mt-1 text-xs text-white/60">Tap to play in cinematic mode.</p>
                </div>
              </div>
            </button>
          </div>
        </section>
      ) : null}

      {/* Images */}
      {backdrops && backdrops.length > 0 && (
        <section className="mt-8">
          <div className="glass-soft rounded-3xl p-6">
            <h2 className="mb-3 text-sm font-semibold text-text">Backdrops</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {backdrops.slice(0, 12).map((img) => (
                <img
                  key={img.file_path}
                  src={`${IMAGE_BASE}${img.file_path}`}
                  alt={title}
                  className="h-32 w-auto shrink-0 rounded-2xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cast */}
      {cast && cast.length > 0 && (
        <section className="mt-8">
          <div className="glass-soft rounded-3xl p-6">
            <h2 className="mb-4 text-sm font-semibold text-text">Top cast</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {cast.map((person) => (
                <div
                  key={person.cast_id || person.credit_id || person.id}
                  className="flex flex-col items-center rounded-2xl bg-white/5 px-3 py-4 text-center backdrop-blur"
                >
                  <div className="mb-2 h-20 w-20 overflow-hidden rounded-2xl bg-white/10">
                    {person.profile_path ? (
                      <img
                        src={getPosterUrl(person.profile_path, 'w185')}
                        alt={person.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] font-semibold text-white/80">
                        No photo
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 h-9 text-xs font-semibold text-white/90">
                    {person.name || 'Unknown'}
                  </p>
                  {person.character && (
                    <p className="mt-0.5 line-clamp-2 h-8 text-[11px] text-white/60">
                      as {person.character}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <TrailerModal
        isOpen={isTrailerOpen}
        youtubeKey={trailerKey || bestTrailerKey}
        onClose={() => dispatch(closeTrailer())}
      />
    </>
  );
};

export default MovieDetail;

