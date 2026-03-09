import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'cinescope-library-v1';

const safeJsonParse = (raw, fallback) => {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const loadInitialState = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return safeJsonParse(window.localStorage.getItem(STORAGE_KEY), null);
};

const initialState =
  loadInitialState() ?? {
    favorites: {
      byId: {},
      allIds: [],
    },
    watchlist: {
      byId: {},
      allIds: [],
    },
    history: {
      detailsViewed: [],
      trailersWatched: [],
    },
  };

const upsertEntity = (bucket, entity) => {
  const id = String(entity.id);
  const exists = Boolean(bucket.byId[id]);
  bucket.byId[id] = entity;
  if (!exists) bucket.allIds.unshift(id);
};

const removeEntity = (bucket, id) => {
  const key = String(id);
  if (!bucket.byId[key]) return;
  delete bucket.byId[key];
  bucket.allIds = bucket.allIds.filter((x) => x !== key);
};

const clampHistory = (arr, limit) => arr.slice(0, limit);

const replaceBucket = (bucket, entities) => {
  bucket.byId = {};
  bucket.allIds = [];
  if (!Array.isArray(entities)) return;
  for (const entity of entities) {
    if (!entity?.id) continue;
    upsertEntity(bucket, entity);
  }
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    favoritesToggle: (state, action) => {
      const entity = action.payload;
      const id = String(entity.id);
      if (state.favorites.byId[id]) {
        removeEntity(state.favorites, id);
      } else {
        upsertEntity(state.favorites, entity);
      }
    },
    favoritesRemove: (state, action) => {
      removeEntity(state.favorites, action.payload);
    },

    watchlistAdd: (state, action) => {
      upsertEntity(state.watchlist, action.payload);
    },
    watchlistRemove: (state, action) => {
      removeEntity(state.watchlist, action.payload);
    },
    watchlistToggle: (state, action) => {
      const entity = action.payload;
      const id = String(entity.id);
      if (state.watchlist.byId[id]) {
        removeEntity(state.watchlist, id);
      } else {
        upsertEntity(state.watchlist, entity);
      }
    },
    watchlistReplace: (state, action) => {
      replaceBucket(state.watchlist, action.payload);
    },

    historyRecordDetailsView: (state, action) => {
      const entry = action.payload; // { id, poster, title, rating, timestamp }
      const key = String(entry.id);
      state.history.detailsViewed = [
        entry,
        ...state.history.detailsViewed.filter((x) => String(x.id) !== key),
      ];
      state.history.detailsViewed = clampHistory(state.history.detailsViewed, 120);
    },
    historyRecordTrailerWatch: (state, action) => {
      const entry = action.payload; // { id, title, youtubeId, thumbnail, timestamp }
      const dedupeKey = `${String(entry.id)}:${String(entry.youtubeId)}`;
      state.history.trailersWatched = [
        entry,
        ...state.history.trailersWatched.filter(
          (x) => `${String(x.id)}:${String(x.youtubeId)}` !== dedupeKey
        ),
      ];
      state.history.trailersWatched = clampHistory(state.history.trailersWatched, 120);
    },
    libraryHydrate: (state, action) => {
      return action.payload ?? state;
    },
    libraryClear: () => ({
      favorites: { byId: {}, allIds: [] },
      watchlist: { byId: {}, allIds: [] },
      history: { detailsViewed: [], trailersWatched: [] },
    }),
  },
});

export const {
  favoritesToggle,
  favoritesRemove,
  watchlistAdd,
  watchlistRemove,
  watchlistToggle,
  watchlistReplace,
  historyRecordDetailsView,
  historyRecordTrailerWatch,
  libraryHydrate,
  libraryClear,
} = librarySlice.actions;

export const libraryStorage = {
  key: STORAGE_KEY,
  save: (state) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
};

export default librarySlice.reducer;

