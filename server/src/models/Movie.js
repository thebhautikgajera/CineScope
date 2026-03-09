import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    poster: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    movieId: {
      // External TMDB ID or internal identifier.
      // For admin-created movies where no explicit movieId is provided,
      // default to using the document's _id as a stable internal identifier.
      type: String,
      required: false,
      index: true,
      default: function () {
        return this._id?.toString();
      },
    },
    releaseDate: {
      type: String,
      default: '',
    },
    trailerYoutubeLink: {
      type: String,
      default: '',
    },
    genre: {
      type: [String],
      default: [],
    },
    category: {
      // e.g. "featured", "curated", "staff-pick"
      type: String,
      default: 'general',
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

export const Movie = mongoose.model('Movie', movieSchema);

