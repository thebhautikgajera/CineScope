import express from 'express';
import { Favorite } from '../models/Favorite.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Add favorite
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

    const favorite = await Favorite.findOneAndUpdate(
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
      data: favorite,
    });
  } catch (error) {
    next(error);
  }
});

// Remove favorite
router.delete('/remove/:movieId', requireAuth, async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.auth.userId;

    await Favorite.findOneAndDelete({ user: userId, movieId });

    return res.json({
      ok: true,
      message: 'Favorite removed',
    });
  } catch (error) {
    next(error);
  }
});

// Get all favorites for current user
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const favorites = await Favorite.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

