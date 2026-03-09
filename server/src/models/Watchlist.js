import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
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
    movieTitle: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one movie per user (unique constraint)
watchlistSchema.index({ user: 1, movieId: 1 }, { unique: true });

export const Watchlist = mongoose.model('Watchlist', watchlistSchema);
