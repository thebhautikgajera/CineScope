import { useEffect, useMemo, useState } from 'react';
import HeroPoster from './MovieHero/HeroPoster';
import HeroBackdrop from './MovieHero/HeroBackdrop';
import HeroRatings from './MovieHero/HeroRatings';
import { getPosterUrl } from '../utils/fallbacks';

const MovieHero = ({
  posterPath,
  backdropPath,
  title,
  overview,
  rating,
  releaseDate,
  runtime,
  language,
  genres,
  popularity,
  videos,
  photosCount,
  isFavorite,
  isInWatchlist,
  onPlayTrailer,
  onToggleFavorite,
  onToggleWatchlist,
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { parallaxOffset, blurAmount, fadeOpacity } = useMemo(() => {
    const clamped = Math.min(scrollY, 200);
    return {
      parallaxOffset: clamped * 0.15,
      blurAmount: clamped * 0.03,
      // Keep hero text fully opaque so it stays readable while scrolling
      fadeOpacity: 1,
    };
  }, [scrollY]);

  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const runtimeLabel = runtime ? `${runtime} min` : null;
  const languageLabel = language ? String(language).toUpperCase?.() || language : null;

  const videosCount = videos?.results?.length ?? 0;

  const backdropUrl = backdropPath ? getPosterUrl(backdropPath, 'w1280') : null;

  return (
    <section className="mt-10 movie-hero-shell">
      <div className="relative min-h-[380px] md:min-h-[430px] lg:min-h-[460px]">
        <HeroBackdrop
          backdropUrl={backdropUrl}
          parallaxOffset={parallaxOffset}
          blurAmount={blurAmount}
        />

        <div
          className="relative z-10 px-5 pb-8 pt-8 md:px-8 md:pb-10 lg:px-10"
          style={{ opacity: fadeOpacity, transition: 'opacity 200ms ease-out' }}
        >
          <div className="grid w-full grid-cols-1 items-start gap-8 md:grid-cols-[250px,1fr,220px] md:gap-10">
            <HeroPoster
              posterPath={posterPath}
              title={title}
              isInWatchlist={isInWatchlist}
              onToggleWatchlist={onToggleWatchlist}
            />

            <div className="space-y-5 md:space-y-6 lg:space-y-7">
              <div className="space-y-3 md:space-y-4">
                <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 shadow-sm">
                  Featured on <span className="ml-1 text-highlight">MovieBoard</span>
                </p>
                <h1 className="text-4xl font-bold leading-tight text-text md:text-5xl lg:text-6xl">
                  {title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 md:text-sm">
                  {year && <span>{year}</span>}
                  {year && (runtimeLabel || languageLabel) && <span className="text-gray-500">•</span>}
                  {runtimeLabel && <span>{runtimeLabel}</span>}
                  {languageLabel && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span>{languageLabel}</span>
                    </>
                  )}
                </div>

                <p className="max-w-3xl text-sm leading-relaxed text-white/85 md:text-[15px]">
                  {overview}
                </p>

                {genres?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {genres.slice(0, 6).map((g) => (
                      <span
                        key={g.id || g.name}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onPlayTrailer}
                  aria-label="Play trailer"
                  className="group inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.8)] ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 hover:ring-white/40"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white shadow-[0_18px_45px_rgba(0,0,0,0.8)] backdrop-blur transition group-hover:scale-105 group-hover:bg-white/30">
                    <span className="ml-1 inline-block h-0 w-0 border-y-[9px] border-l-15 border-y-transparent border-l-white" />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Watch
                    </span>
                    <span className="text-sm md:text-base">Play Trailer</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-pressed={Boolean(isFavorite)}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition hover:translate-y-px hover:scale-[1.01] ${
                    isFavorite
                      ? 'bg-highlight text-black shadow-[0_16px_40px_rgba(0,0,0,0.7)] hover:brightness-110'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </button>
              </div>
            </div>

            <HeroRatings
              rating={rating}
              popularity={popularity}
              videosCount={videosCount}
              photosCount={photosCount}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MovieHero;

