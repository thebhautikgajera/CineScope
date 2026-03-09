import {
    configureStore
} from '@reduxjs/toolkit';
import {
    setupListeners
} from '@reduxjs/toolkit/query';
import authReducer from '../slices/authSlice';
import uiReducer from '../slices/uiSlice';
import libraryReducer from '../slices/librarySlice';
import {
    tmdbApi
} from '../services/tmdbApi';
import {
    favoritesApi
} from '../services/favoritesApi';
import {
    historyApi
} from '../services/historyApi';
import {
    watchlistApi
} from '../services/watchlistApi';
import {
    genresApi
} from '../services/genresApi';
import {
    adminApi
} from '../services/adminApi';
import { libraryPersistMiddleware } from './libraryPersistMiddleware';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        library: libraryReducer,
        [tmdbApi.reducerPath]: tmdbApi.reducer,
        [favoritesApi.reducerPath]: favoritesApi.reducer,
        [historyApi.reducerPath]: historyApi.reducer,
        [watchlistApi.reducerPath]: watchlistApi.reducer,
        [genresApi.reducerPath]: genresApi.reducer,
        [adminApi.reducerPath]: adminApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(libraryPersistMiddleware.middleware).concat(
            tmdbApi.middleware,
            favoritesApi.middleware,
            historyApi.middleware,
            watchlistApi.middleware,
            genresApi.middleware,
            adminApi.middleware
        ),
});

setupListeners(store.dispatch);