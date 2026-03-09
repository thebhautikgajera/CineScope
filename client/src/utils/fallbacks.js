const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const PLACEHOLDER_POSTER = '/assets/fallback-movie-poster.webp';

export const getPosterUrl = (posterPath, size = 'w342') => {
  if (!posterPath) return PLACEHOLDER_POSTER;
  return `${IMAGE_BASE}/${size}${posterPath}`;
};

export const getSafeTitle = (movie) => {
  if (!movie) return 'Title not available';
  return movie.title || movie.name || 'Title not available';
};

export const getSafeOverview = (overview) => {
  if (!overview || typeof overview !== 'string' || !overview.trim()) {
    return 'Description not available';
  }
  return overview;
};

export const getTrailerUnavailableMessage = () =>
  'Trailer for this movie is currently unavailable.';

