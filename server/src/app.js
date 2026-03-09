import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import favoritesRoutes from './routes/favorites.js';
import historyRoutes from './routes/history.js';
import watchlistRoutes from './routes/watchlist.js';
import adminMoviesRoutes from './routes/adminMovies.js';
import adminUsersRoutes from './routes/adminUsers.js';
import tmdbRoutes from './routes/tmdb.js';
import genresRoutes from './routes/genres.js';
import { createApiLimiter } from './middleware/rateLimiter.js';
import { getRateLimitMetrics } from './middleware/advancedRateLimiter.js';

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

// CORS configuration (strict origin)
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware
app.use(compression()); // Enable gzip compression
app.use(express.json());
app.use(cookieParser());

// Initialize rate limiter (synchronous, in-memory)
const apiLimiter = createApiLimiter();

// Apply rate limiter to all routes
app.use(apiLimiter);

// Login-specific rate limiter (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    ok: false,
    error: 'Too many login attempts from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Routes
// Apply login limiter specifically to login endpoint
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/admin/movies', adminMoviesRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/genres', genresRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Prometheus metrics endpoint (optional - requires prom-client)
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getRateLimitMetrics();
    if (metrics) {
      // If prom-client is available, export metrics
      const promClient = await import('prom-client').catch(() => null);
      if (promClient && promClient.register) {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
        return;
      }
    }

    // Fallback: return basic metrics info
    res.json({
      message: 'Prometheus metrics not available. Install prom-client to enable.',
      available: false,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Internal server error',
  });
});

export default app;

