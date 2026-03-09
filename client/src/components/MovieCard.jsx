import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { tmdbApi } from '../services/tmdbApi';
import { getPosterUrl, getSafeTitle } from '../utils/fallbacks';

const MovieCard = ({
  item,
  to,
  onClick,
  onToggleFavorite,
  isFavorite,
  onRemoveFromWatchlist,
  genreMap,
}) => {
  const prefetchMovieFull = tmdbApi.usePrefetch('getMovieFull');
  const title = getSafeTitle(item);
  const posterPath = item.poster_path || item.profile_path;
  const rating = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : null;
  const resolvedTo = to ?? (item?.id ? `/movie/${item.id}` : null);
  const hasLink = Boolean(resolvedTo && item?.id);

  const year = item?.release_date
    ? new Date(item.release_date).getFullYear()
    : item?.first_air_date
      ? new Date(item.first_air_date).getFullYear()
      : null;

  const genreBadges =
    Array.isArray(item?.genre_ids) && genreMap
      ? item.genre_ids
          .map((id) => genreMap.get(id))
          .filter(Boolean)
          .slice(0, 3)
      : [];

  const handleMouseEnter = () => {
    if (!hasLink) return;
    prefetchMovieFull(String(item.id), { ifOlderThan: 60 });
  };

  return (
    <div
      className={[
        'js-movie-card group relative overflow-hidden rounded-2xl transition will-change-transform',
        'glass-soft border border-white/10',
        'hover:-translate-y-1 hover:bg-white/6 hover:shadow-[0_20px_70px_rgba(0,0,0,0.6)]',
      ].join(' ')}
    >
      {hasLink ? (
        <Link
          to={resolvedTo}
          onMouseEnter={handleMouseEnter}
          className="block"
        >
          <div className="relative aspect-2/3 w-full overflow-hidden bg-white/5 cursor-pointer">
            <img
              src={getPosterUrl(posterPath, 'w342')}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
              loading="lazy"
              decoding="async"
            />
            {rating && (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-xs font-semibold text-highlight backdrop-blur">
                <Star size={12} className="fill-highlight text-highlight" />
                {rating}
              </span>
            )}

            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-2 text-sm font-semibold text-white/95">{title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                  {year && <span>{year}</span>}
                  {genreBadges.length > 0 && year && <span className="text-white/35">•</span>}
                  {genreBadges.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/80"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <>
          <div className="relative aspect-2/3 w-full cursor-pointer overflow-hidden bg-white/5" onClick={onClick}>
            <img
              src={getPosterUrl(posterPath, 'w342')}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
              loading="lazy"
              decoding="async"
            />
            {rating && (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-xs font-semibold text-highlight backdrop-blur">
                <Star size={12} className="fill-highlight text-highlight" />
                {rating}
              </span>
            )}
          </div>
        </>
      )}
      {onRemoveFromWatchlist && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromWatchlist();
          }}
          aria-label="Remove from watchlist"
          className="absolute right-2 top-10 inline-flex items-center justify-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-black/75"
        >
          <X size={14} />
          Remove
        </button>
      )}
      {onToggleFavorite && !onRemoveFromWatchlist && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-pressed={Boolean(isFavorite)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={[
            'absolute bottom-2 right-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur transition',
            isFavorite
              ? 'bg-highlight text-black/90 hover:brightness-110'
              : 'bg-black/55 text-white/90 hover:bg-black/65',
          ].join(' ')}
        >
          {isFavorite ? 'Favorited' : 'Favorite'}
        </button>
      )}
    </div>
  );
};

export default memo(MovieCard);

