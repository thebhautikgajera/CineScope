import express from 'express';
import { Watchlist } from '../models/Watchlist.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Add to watchlist
router.post('/add', requireAuth, async (req, res, next) => {
  try {
    const { movieId, movieTitle, poster, rating } = req.body;

    if (!movieId || !movieTitle) {
      return res.status(400).json({
        ok: false,
        error: 'movieId and movieTitle are required',
      });
    }

    const userId = req.auth.userId;

    const watchlistItem = await Watchlist.findOneAndUpdate(
      { user: userId, movieId },
      {
        user: userId,
        movieId,
        movieTitle,
        poster: poster || null,
        rating: typeof rating === 'number' ? rating : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      ok: true,
      data: watchlistItem,
    });
  } catch (error) {
    next(error);
  }
});

// Remove from watchlist
router.delete('/remove/:movieId', requireAuth, async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.auth.userId;

    await Watchlist.findOneAndDelete({ user: userId, movieId });

    return res.json({
      ok: true,
      message: 'Removed from watchlist',
    });
  } catch (error) {
    next(error);
  }
});

// Get all watchlist items for current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const watchlist = await Watchlist.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      data: watchlist,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
