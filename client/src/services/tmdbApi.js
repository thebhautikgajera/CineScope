import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api/tmdb`;

export const tmdbApi = createApi({
  reducerPath: 'tmdbApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    // AbortController is automatically handled by fetchBaseQuery
  }),
  tagTypes: ['Trending', 'Popular', 'Movie', 'TV', 'Person', 'Search'],
  endpoints: (builder) => ({
    getTrending: builder.query({
      query: (page = 1) => `/trending?page=${page}`,
      providesTags: ['Trending'],
    }),
    getPopular: builder.query({
      query: (page = 1) => `/popular?page=${page}`,
      providesTags: ['Popular'],
    }),
    getMovies: builder.query({
      query: ({ page = 1, with_genres } = {}) => {
        const params = new URLSearchParams();
        params.set('page', page);
        if (with_genres) params.set('with_genres', with_genres);
        return `/movies?${params.toString()}`;
      },
      // IMPORTANT:
      // - Server responds with { ok: true, data: { results, page, total_pages, ... } }
      // - We want one cache entry per genre (or "all") so pagination can merge correctly.
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs?.with_genres ?? 'all'}`,
      merge: (currentCache, newData) => {
        const currentResults = currentCache?.data?.results ?? [];
        const incomingResults = newData?.data?.results ?? [];

        if (!Array.isArray(currentResults) || currentResults.length === 0) {
          return newData;
        }

        // Deduplicate by TMDB id while preserving order
        const seen = new Set();
        const merged = [];
        for (const item of [...currentResults, ...incomingResults]) {
          const key = item?.id;
          if (!key) continue;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(item);
        }

        return {
          ...newData,
          data: {
            ...(newData?.data ?? {}),
            results: merged,
          },
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
      providesTags: ['Movie'],
    }),
    getTVShows: builder.query({
      query: (page = 1) => `/tv?page=${page}`,
      providesTags: ['TV'],
    }),
    getPeople: builder.query({
      query: (page = 1) => `/people?page=${page}`,
      providesTags: ['Person'],
    }),
    getMovieDetails: builder.query({
      query: (id) => `/movie/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Movie', id }],
    }),
    getMovieFull: builder.query({
      query: (id) => `/movie/${id}/full`,
      providesTags: (_res, _err, id) => [{ type: 'Movie', id }],
    }),
    getMovieImages: builder.query({
      query: (id) => `/movie/${id}/images`,
    }),
    getMovieVideos: builder.query({
      query: (id) => `/movie/${id}/videos`,
    }),
    getMovieCredits: builder.query({
      query: (id) => `/movie/${id}/credits`,
    }),
    searchMulti: builder.query({
      query: ({ query, page = 1 }) => {
        const params = new URLSearchParams();
        params.set('query', query);
        params.set('page', page);
        return `/search?${params.toString()}`;
      },
      providesTags: ['Search'],
    }),
  }),
});

export const {
  useGetTrendingQuery,
  useGetPopularQuery,
  useGetMoviesQuery,
  useGetTVShowsQuery,
  useGetPeopleQuery,
  useGetMovieDetailsQuery,
  useGetMovieFullQuery,
  useGetMovieImagesQuery,
  useGetMovieVideosQuery,
  useGetMovieCreditsQuery,
  useLazySearchMultiQuery,
} = tmdbApi;

