import express from 'express';
import { WatchHistory } from '../models/WatchHistory.js';
import { TrailerHistory } from '../models/TrailerHistory.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Add to watch history (idempotent per user+movie, updates watchedAt)
router.post('/add', requireAuth, async (req, res, next) => {
  try {
    const { movieId, title, poster } = req.body;

    if (!movieId || !title) {
      return res.status(400).json({
        ok: false,
        error: 'movieId and title are required',
      });
    }

    const userId = req.auth.userId;

    const history = await WatchHistory.findOneAndUpdate(
      { user: userId, movieId },
      {
        user: userId,
        movieId,
        title,
        poster: poster || null,
        watchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      ok: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

// Get watch history for current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const items = await WatchHistory.find({ user: userId })
      .sort({ watchedAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      ok: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
});

// Add to trailer watch history (idempotent per user+movie+trailer, updates watchedAt)
router.post('/trailers/add', requireAuth, async (req, res, next) => {
  try {
    const { movieId, title, youtubeId, thumbnail } = req.body;

    if (!movieId || !title || !youtubeId) {
      return res.status(400).json({
        ok: false,
        error: 'movieId, title and youtubeId are required',
      });
    }

    const userId = req.auth.userId;

    const trailerHistory = await TrailerHistory.findOneAndUpdate(
      { user: userId, movieId, youtubeId },
      {
        user: userId,
        movieId,
        title,
        youtubeId,
        thumbnail: thumbnail || null,
        watchedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      ok: true,
      data: trailerHistory,
    });
  } catch (error) {
    next(error);
  }
});

// Get trailer watch history for current user
router.get('/trailers', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    const items = await TrailerHistory.find({ user: userId })
      .sort({ watchedAt: -1 })
      .limit(120)
      .lean();

    return res.json({
      ok: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

