import { createListenerMiddleware } from '@reduxjs/toolkit';
import { libraryStorage } from '../slices/librarySlice';

export const libraryPersistMiddleware = createListenerMiddleware();

const shouldPersist = (action) => {
  const type = String(action?.type ?? '');
  return type.startsWith('library/');
};

libraryPersistMiddleware.startListening({
  predicate: (action) => shouldPersist(action),
  effect: async (_, api) => {
    const state = api.getState();
    libraryStorage.save(state.library);
  },
});

