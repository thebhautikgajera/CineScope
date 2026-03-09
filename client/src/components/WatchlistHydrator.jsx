import { useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetWatchlistQuery } from '../services/watchlistApi';
import { watchlistReplace } from '../slices/librarySlice';

/**
 * Hydrates the local watchlist bucket from the backend for logged-in users.
 * Keeps backend API contracts intact and avoids breaking existing local UX.
 */
const WatchlistHydrator = memo(() => {
  const dispatch = useDispatch();
  const accessToken = useSelector((s) => s.auth?.accessToken);

  const { data, isSuccess } = useGetWatchlistQuery(undefined, {
    skip: !accessToken,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!isSuccess) return;
    const rows = data?.data ?? data ?? [];
    if (!Array.isArray(rows)) return;

    dispatch(
      watchlistReplace(
        rows.map((row) => ({
          id: String(row.movieId),
          title: row.movieTitle ?? 'Untitled',
          poster: row.poster ?? null,
          rating: typeof row.rating === 'number' ? row.rating : null,
          releaseDate: null,
          mediaType: 'movie',
          updatedAt: row.updatedAt ? new Date(row.updatedAt).getTime() : Date.now(),
        }))
      )
    );
  }, [data, dispatch, isSuccess]);

  return null;
});

WatchlistHydrator.displayName = 'WatchlistHydrator';

export default WatchlistHydrator;

