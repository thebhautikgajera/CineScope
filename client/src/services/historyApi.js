import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api/history`;

export const historyApi = createApi({
  reducerPath: 'historyApi',
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
  tagTypes: ['History'],
  endpoints: (builder) => ({
    getHistory: builder.query({
      query: () => '/',
      providesTags: ['History'],
    }),
    addHistory: builder.mutation({
      query: (body) => ({
        url: '/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['History'],
    }),
    getTrailerHistory: builder.query({
      query: () => '/trailers',
      providesTags: ['History'],
    }),
    addTrailerHistory: builder.mutation({
      query: (body) => ({
        url: '/trailers/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['History'],
    }),
  }),
});

export const {
  useGetHistoryQuery,
  useAddHistoryMutation,
  useGetTrailerHistoryQuery,
  useAddTrailerHistoryMutation,
} = historyApi;

