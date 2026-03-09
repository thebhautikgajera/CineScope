import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api`;

export const adminApi = createApi({
  reducerPath: 'adminApi',
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
  tagTypes: ['AdminMovies', 'AdminUsers'],
  endpoints: (builder) => ({
    getAdminMovies: builder.query({
      query: () => '/admin/movies',
      providesTags: ['AdminMovies'],
    }),
    createMovie: builder.mutation({
      query: (body) => ({
        url: '/admin/movies',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminMovies'],
    }),
    updateMovie: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/movies/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdminMovies'],
    }),
    deleteMovie: builder.mutation({
      query: (id) => ({
        url: `/admin/movies/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminMovies'],
    }),
    getUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['AdminUsers'],
    }),
    banUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/ban`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    unbanUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/unban`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
  }),
});

export const {
  useGetAdminMoviesQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
  useGetUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useDeleteUserMutation,
} = adminApi;

