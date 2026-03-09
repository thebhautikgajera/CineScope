import { getPosterUrl } from '../../utils/fallbacks';

const HeroPoster = ({ posterPath, title, isInWatchlist, onToggleWatchlist }) => {
  return (
    <div className="relative flex items-center justify-center md:h-[360px] lg:h-[390px]">
      <div className="group relative w-full max-w-[260px] rounded-2xl bg-black/40 shadow-[0_24px_70px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition duration-500 hover:-translate-y-2 hover:shadow-[0_32px_90px_rgba(0,0,0,1)]">
        <div className="relative w-full overflow-hidden rounded-2xl pt-[150%]">
          {posterPath && (
            <img
              src={getPosterUrl(posterPath, 'w500')}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/10 opacity-0 transition duration-500 group-hover:opacity-100" />
        </div>

        <button
          type="button"
          onClick={onToggleWatchlist}
          aria-pressed={Boolean(isInWatchlist)}
          aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-black/85"
        >
          <span className="text-sm">{isInWatchlist ? '✓' : '+'}</span>
          <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
      </div>
    </div>
  );
};

export default HeroPoster;

