import express from 'express';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Get all users
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
    return res.json({
      ok: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// Ban user (set isActive=false)
router.post('/:id/ban', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    return res.json({
      ok: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Unban user (set isActive=true)
router.post('/:id/unban', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    return res.json({
      ok: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id).lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found',
      });
    }

    return res.json({
      ok: true,
      message: 'User deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

