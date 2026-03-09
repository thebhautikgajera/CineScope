import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchQuery: '',
  isTrailerOpen: false,
  trailerKey: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    openTrailer: (state, action) => {
      state.isTrailerOpen = true;
      state.trailerKey = action.payload;
    },
    closeTrailer: (state) => {
      state.isTrailerOpen = false;
      state.trailerKey = null;
    },
  },
});

export const { setSearchQuery, openTrailer, closeTrailer } = uiSlice.actions;

export default uiSlice.reducer;

