import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api/favorites`;

export const favoritesApi = createApi({
  reducerPath: 'favoritesApi',
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
  tagTypes: ['Favorites'],
  endpoints: (builder) => ({
    getFavorites: builder.query({
      query: () => '/',
      providesTags: ['Favorites'],
    }),
    addFavorite: builder.mutation({
      query: (body) => ({
        url: '/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Favorites'],
    }),
    removeFavorite: builder.mutation({
      query: (movieId) => ({
        url: `/remove/${movieId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites'],
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoritesApi;

