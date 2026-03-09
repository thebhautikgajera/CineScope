import express from 'express';

const router = express.Router();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const tmdbFetch = async (path, query = {}) => {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY || '',
    language: 'en-US',
    ...query,
  });

  const url = `${TMDB_BASE_URL}${path}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB error (${res.status}): ${text}`);
  }

  return res.json();
};

// Get movie genres
router.get('/movies', async (req, res, next) => {
  try {
    const data = await tmdbFetch('/genre/movie/list');
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
