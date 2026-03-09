import mongoose from 'mongoose';

const trailerHistorySchema = new mongoose.Schema(
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
    youtubeId: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
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

// Keep one record per (user, movie, trailer) and update watchedAt
trailerHistorySchema.index({ user: 1, movieId: 1, youtubeId: 1 });

export const TrailerHistory = mongoose.model('TrailerHistory', trailerHistorySchema);

