import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api/watchlist`;

export const watchlistApi = createApi({
  reducerPath: 'watchlistApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ['Watchlist'],
  endpoints: (builder) => ({
    getWatchlist: builder.query({
      query: () => '/',
      providesTags: ['Watchlist'],
    }),
    addToWatchlist: builder.mutation({
      query: (body) => ({
        url: '/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Watchlist'],
    }),
    removeFromWatchlist: builder.mutation({
      query: (movieId) => ({
        url: `/remove/${movieId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Watchlist'],
    }),
  }),
});

export const {
  useGetWatchlistQuery,
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
} = watchlistApi;
