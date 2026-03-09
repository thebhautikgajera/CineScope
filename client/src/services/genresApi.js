import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api/genres`;

export const genresApi = createApi({
  reducerPath: 'genresApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
  }),
  tagTypes: ['Genres'],
  endpoints: (builder) => ({
    getMovieGenres: builder.query({
      query: () => '/movies',
      providesTags: ['Genres'],
    }),
  }),
});

export const { useGetMovieGenresQuery } = genresApi;
