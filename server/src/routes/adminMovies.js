import express from 'express';
import { Movie } from '../models/Movie.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Create movie
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const movie = await Movie.create(req.body);
    return res.status(201).json({
      ok: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
});

// Get all movies
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 }).lean();
    return res.json({
      ok: true,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
});

// Update movie
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({
        ok: false,
        error: 'Movie not found',
      });
    }

    return res.json({
      ok: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
});

// Delete movie
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      return res.status(404).json({
        ok: false,
        error: 'Movie not found',
      });
    }

    return res.json({
      ok: true,
      message: 'Movie deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

