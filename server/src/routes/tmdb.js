import express from 'express';

const router = express.Router();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.warn('⚠️ TMDB_API_KEY is not set. TMDB routes will return 500 until configured.');
}

// Cache configuration
const CACHE_TTL_FRESH = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL_STALE = 20 * 60 * 1000; // 20 minutes

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay
const RATE_LIMIT_RETRY_DELAY = 5000; // 5 seconds for rate limits

// In-memory cache: Map<url, { data, expiry, staleExpiry }>
const cache = new Map();

// Request deduplication: Map<url, Promise>
const pendingRequests = new Map();

// Failed request tracking to prevent repeated failing requests
const failedRequests = new Map(); // Map<url, { count, lastFailure }>
const FAILED_REQUEST_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Movie ID validation helper
 * Validates that ID is a positive integer
 */
const validateMovieId = (id) => {
  if (id === undefined || id === null || id === '') {
    return false;
  }
  const numId = Number(id);
  return !isNaN(numId) && isFinite(numId) && numId > 0 && Number.isInteger(numId);
};

/**
 * Parse TMDB error response
 * TMDB returns errors in format: { status_code: number, status_message: string }
 */
const parseTMDBError = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      if (errorData.status_code && errorData.status_message) {
        return {
          statusCode: errorData.status_code,
          message: errorData.status_message,
          isTMDBError: true,
        };
      }
    }
  } catch (e) {
    // If parsing fails, return generic error
  }
  
  return {
    statusCode: response.status,
    message: response.statusText || 'Unknown error',
    isTMDBError: false,
  };
};

/**
 * Create a structured error for Express error handling
 */
const createTMDBError = (statusCode, message, url) => {
  const error = new Error(message);
  error.status = statusCode;
  error.tmdbError = true;
  error.url = url;
  return error;
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if a request has failed recently and should be skipped
 */
const shouldSkipFailedRequest = (url) => {
  const failed = failedRequests.get(url);
  if (!failed) return false;
  
  const now = Date.now();
  if (now - failed.lastFailure > FAILED_REQUEST_TTL) {
    failedRequests.delete(url);
    return false;
  }
  
  // Skip if failed more than 3 times in the TTL period
  return failed.count >= 3;
};

/**
 * Record a failed request
 */
const recordFailedRequest = (url) => {
  const failed = failedRequests.get(url) || { count: 0, lastFailure: 0 };
  failed.count += 1;
  failed.lastFailure = Date.now();
  failedRequests.set(url, failed);
};

/**
 * Clear failed request record on success
 */
const clearFailedRequest = (url) => {
  failedRequests.delete(url);
};

/**
 * Internal function to fetch from TMDB with retry logic and proper error handling
 */
const fetchFromTMDB = async (url, retryCount = 0) => {
  // Check if this request should be skipped due to recent failures
  if (shouldSkipFailedRequest(url)) {
    const error = createTMDBError(
      404,
      'Resource not found (recent failures detected)',
      url
    );
    throw error;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    // Handle rate limiting (429)
    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : RATE_LIMIT_RETRY_DELAY;
      
      if (retryCount < MAX_RETRIES) {
        console.warn(`Rate limited, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return fetchFromTMDB(url, retryCount + 1);
      }
      
      const error = createTMDBError(429, 'Rate limit exceeded. Please try again later.', url);
      throw error;
    }

    // Handle 404 errors - parse TMDB error response
    if (res.status === 404) {
      const errorInfo = await parseTMDBError(res);
      recordFailedRequest(url);
      
      const error = createTMDBError(
        404,
        errorInfo.message || 'The resource you requested could not be found.',
        url
      );
      throw error;
    }

    // Handle other HTTP errors
    if (!res.ok) {
      const errorInfo = await parseTMDBError(res);
      
      // Retry on 5xx errors
      if (res.status >= 500 && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.warn(`Server error ${res.status}, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return fetchFromTMDB(url, retryCount + 1);
      }
      
      const error = createTMDBError(
        errorInfo.statusCode,
        errorInfo.message,
        url
      );
      throw error;
    }

    const data = await res.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw createTMDBError(500, 'Invalid response format from TMDB API', url);
    }

    // Clear failed request record on success
    clearFailedRequest(url);
    
    const now = Date.now();

    // Update cache with fresh data
    cache.set(url, {
      data,
      expiry: now + CACHE_TTL_FRESH,
      staleExpiry: now + CACHE_TTL_STALE,
    });

    return data;
  } catch (error) {
    // Handle network errors and timeouts
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.warn(`Network error/timeout, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return fetchFromTMDB(url, retryCount + 1);
      }
      throw createTMDBError(503, 'Request timeout. Please try again.', url);
    }

    // Re-throw TMDB errors
    if (error.tmdbError) {
      throw error;
    }

    // Handle other fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.warn(`Network error, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return fetchFromTMDB(url, retryCount + 1);
      }
      throw createTMDBError(503, 'Network error. Please check your connection.', url);
    }

    // Re-throw unknown errors
    throw error;
  }
};

/**
 * Enhanced tmdbFetch with caching, request deduplication, and stale-while-revalidate
 */
const tmdbFetch = async (path, query = {}) => {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY || '',
    include_adult: 'yes',
    language: 'en-US',
    ...query,
  });

  const url = `${TMDB_BASE_URL}${path}?${params.toString()}`;
  const now = Date.now();

  // Check cache first
  const cached = cache.get(url);
  if (cached) {
    // If data is still fresh, return immediately
    if (now < cached.expiry) {
      return cached.data;
    }

    // If data is stale but not expired, return stale data and refresh in background
    if (now < cached.staleExpiry) {
      // Trigger background refresh (don't await)
      refreshCache(url).catch((err) => {
        console.error('Background cache refresh failed:', err.message);
      });
      return cached.data;
    }

    // Cache expired, remove it
    cache.delete(url);
  }

  // Check if there's already a pending request for this URL
  if (pendingRequests.has(url)) {
    // Wait for the existing request to complete
    return pendingRequests.get(url);
  }

  // Create new request
  const requestPromise = fetchFromTMDB(url);
  pendingRequests.set(url, requestPromise);

  try {
    const data = await requestPromise;
    return data;
  } finally {
    // Remove from pending requests
    pendingRequests.delete(url);
  }
};

/**
 * Background cache refresh function
 */
const refreshCache = async (url) => {
  // Check if there's already a refresh in progress
  if (pendingRequests.has(url)) {
    return;
  }

  const requestPromise = fetchFromTMDB(url);
  pendingRequests.set(url, requestPromise);

  try {
    await requestPromise;
  } catch (error) {
    // If refresh fails, keep stale data
    console.error('Cache refresh failed, keeping stale data:', error.message);
  } finally {
    pendingRequests.delete(url);
  }
};

/**
 * Middleware to validate movie ID
 */
const validateMovieIdMiddleware = (req, res, next) => {
  const { id } = req.params;
  if (!validateMovieId(id)) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid movie id',
    });
  }
  next();
};

/**
 * Helper function to detect if an ID is a movie or TV show
 * Attempts to fetch as movie first, then TV if movie fails
 */
const detectMediaType = async (id) => {
  try {
    const movieData = await tmdbFetch(`/movie/${id}`, {});
    if (movieData && movieData.id) {
      return 'movie';
    }
  } catch (error) {
    // Movie fetch failed, try TV
    try {
      const tvData = await tmdbFetch(`/tv/${id}`, {});
      if (tvData && tvData.id) {
        return 'tv';
      }
    } catch (tvError) {
      // Both failed, return null
      return null;
    }
  }
  return null;
};

/**
 * Enhanced error handler for TMDB routes
 * Converts errors to proper HTTP responses
 */
const handleTMDBError = (error, req, res, next) => {
  // If error already has status, use it
  if (error.status) {
    return res.status(error.status).json({
      ok: false,
      error: error.message || 'An error occurred',
      ...(error.tmdbError && { tmdbError: true }),
    });
  }

  // Default to 500 for unknown errors
  console.error('Unhandled error in TMDB route:', error);
  return res.status(500).json({
    ok: false,
    error: 'Internal server error',
  });
};

// Trending (all media)
router.get('/trending', async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/trending/all/week', { page });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Popular movies
router.get('/popular', async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/movie/popular', { page });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Movies discovery
router.get('/movies', async (req, res, next) => {
  try {
    const { page = 1, with_genres } = req.query;
    const data = await tmdbFetch('/discover/movie', {
      page,
      with_genres,
      sort_by: 'popularity.desc',
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// TV shows discovery
router.get('/tv', async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/discover/tv', {
      page,
      sort_by: 'popularity.desc',
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Popular people
router.get('/people', async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/person/popular', { page });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Images / media for a movie
router.get('/movie/:id/images', validateMovieIdMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tmdbFetch(`/movie/${id}/images`, {});
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Combined movie payload (details + images + videos + credits) in a single TMDB call
router.get('/movie/:id/full', validateMovieIdMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Use TMDB's append_to_response to avoid multiple sequential API calls
    const data = await tmdbFetch(`/movie/${id}`, {
      append_to_response: 'images,credits,videos',
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Movie details
router.get('/movie/:id', validateMovieIdMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tmdbFetch(`/movie/${id}`, {});
    res.json({ ok: true, data });
  } catch (error) {
    // If 404, try to detect if it's actually a TV show
    if (error.status === 404 && error.tmdbError) {
      try {
        const mediaType = await detectMediaType(id);
        if (mediaType === 'tv') {
          // Return helpful error message
          return res.status(404).json({
            ok: false,
            error: `The ID ${id} corresponds to a TV show, not a movie. Use /api/tmdb/tv/${id} instead.`,
            tmdbError: true,
            suggestedEndpoint: `/api/tmdb/tv/${id}`,
          });
        }
      } catch (detectError) {
        // Detection failed, fall through to original error
      }
    }
    next(error);
  }
});

// Movie credits (cast & crew)
router.get('/movie/:id/credits', validateMovieIdMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tmdbFetch(`/movie/${id}/credits`, {});
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Movie videos (trailers)
router.get('/movie/:id/videos', validateMovieIdMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tmdbFetch(`/movie/${id}/videos`, {});
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Search multi (movies, TV, people)
router.get('/search', async (req, res, next) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query || query.trim() === '') {
      return res.json({ ok: true, data: { results: [], page: 1, total_pages: 0, total_results: 0 } });
    }
    const data = await tmdbFetch('/search/multi', {
      query: query.trim(),
      page,
    });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware for TMDB routes
router.use(handleTMDBError);

export default router;

