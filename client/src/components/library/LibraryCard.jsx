import { memo, useMemo } from 'react';
import { Play, Trash2 } from 'lucide-react';
import { getPosterUrl } from '../../utils/fallbacks';

const getYear = (releaseDate) => {
  if (!releaseDate) return null;
  const d = new Date(releaseDate);
  const y = d.getFullYear();
  return Number.isFinite(y) ? y : null;
};

const LibraryCard = memo(({ title, poster, rating, releaseDate, onOpen, onRemove, showPlay }) => {
  const year = useMemo(() => getYear(releaseDate), [releaseDate]);
  const displayRating = typeof rating === 'number' ? rating.toFixed(1) : rating ? String(rating) : null;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-2/3 w-full bg-white/5">
          <img
            src={getPosterUrl(poster)}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />
        </div>
        <div className="space-y-1 px-3 pb-3 pt-2">
          <p className="line-clamp-2 text-sm font-semibold text-white/90">{title}</p>
          <div className="flex items-center gap-2 text-xs text-white/60">
            {year && <span>{year}</span>}
            {displayRating && (
              <>
                <span className="opacity-40">•</span>
                <span>★ {displayRating}</span>
              </>
            )}
          </div>
        </div>
      </button>

      <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
        {showPlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            className="glass-soft inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:scale-105"
            aria-label="Play"
          >
            <Play className="h-4 w-4" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur transition hover:bg-black/65 hover:scale-105"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

LibraryCard.displayName = 'LibraryCard';

export default LibraryCard;

