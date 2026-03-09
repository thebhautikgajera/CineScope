import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      // TMDB movie ID or internal ID as string
      type: String,
      required: true,
    },
    movieTitle: {
      type: String,
      required: true,
      trim: true,
    },
    poster: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a movie is only favorited once per user
favoriteSchema.index({ user: 1, movieId: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);

