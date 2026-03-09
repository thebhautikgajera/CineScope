import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    poster: {
      type: String,
      default: null,
    },
    watchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optionally keep only one record per (user, movie) and update watchedAt
watchHistorySchema.index({ user: 1, movieId: 1 });

export const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

