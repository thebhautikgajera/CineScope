import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Clock } from 'lucide-react';
import LibraryCard from '../components/library/LibraryCard';
import TrailerHistoryCard from '../components/library/TrailerHistoryCard';
import TrailerModal from '../components/TrailerModal';
import { closeTrailer, openTrailer } from '../slices/uiSlice';
import { useGetHistoryQuery, useGetTrailerHistoryQuery } from '../services/historyApi';

const History = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isTrailerOpen, trailerKey } = useSelector((s) => s.ui);
  const [tab, setTab] = useState('viewed'); // 'viewed' | 'trailers'

  // Fetch watch history from the backend (database), not from local RTK library slice
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useGetHistoryQuery();

  const detailsViewed = useMemo(
    () => historyData?.data ?? historyData ?? [],
    [historyData]
  );

  // Trailer history now comes from backend so it survives logouts/device changes
  const {
    data: trailerHistoryData,
    isLoading: trailerHistoryLoading,
    isError: trailerHistoryError,
  } = useGetTrailerHistoryQuery();

  const trailersWatched = useMemo(
    () => trailerHistoryData?.data ?? trailerHistoryData ?? [],
    [trailerHistoryData]
  );

  return (
    <div className="space-y-8 pt-12">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">History</h1>
            <p className="mt-1 text-sm text-white/70">Everything you’ve opened and every trailer you’ve played.</p>
          </div>
          <div className="glass-soft inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white/80">
            <Clock className="h-4 w-4 text-highlight" />
            {detailsViewed.length + trailersWatched.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-soft inline-flex w-full items-center justify-between gap-2 rounded-full p-1 sm:w-auto">
        <button
          type="button"
          onClick={() => setTab('viewed')}
          className={[
            'rounded-full px-4 py-2 text-xs font-semibold transition',
            tab === 'viewed' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/6 hover:text-white',
          ].join(' ')}
        >
          Movies Viewed <span className="ml-1 text-white/50">({detailsViewed.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('trailers')}
          className={[
            'rounded-full px-4 py-2 text-xs font-semibold transition',
            tab === 'trailers' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/6 hover:text-white',
          ].join(' ')}
        >
          Trailers Watched <span className="ml-1 text-white/50">({trailersWatched.length})</span>
        </button>
      </div>

      {tab === 'viewed' && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white/90">Movies viewed</h2>
              <p className="mt-1 text-xs text-white/60">
                Loaded directly from your account history on the server.
              </p>
            </div>
          </div>

          {historyLoading && (
            <div className="glass-soft rounded-3xl p-10 text-center">
              <p className="text-sm text-white/70">Loading your viewed titles…</p>
            </div>
          )}

          {!historyLoading && historyError && (
            <div className="glass-soft rounded-3xl p-10 text-center">
              <p className="text-sm text-accent">Failed to load history. Please try again later.</p>
            </div>
          )}

          {!historyLoading && !historyError && detailsViewed.length === 0 && (
            <div className="glass-soft rounded-3xl p-10 text-center">
              <p className="text-sm text-white/70">No viewed titles yet.</p>
            </div>
          )}

          {!historyLoading && !historyError && detailsViewed.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {detailsViewed.map((entry) => (
                <LibraryCard
                  key={entry._id || entry.movieId}
                  title={entry.title}
                  poster={entry.poster}
                  rating={null}
                  releaseDate={entry.watchedAt}
                  onOpen={() => navigate(`/movie/${entry.movieId}`)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'trailers' && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white/90">Trailers watched</h2>
              <p className="mt-1 text-xs text-white/60">
                Loaded from your account so they’re available on any device.
              </p>
            </div>
          </div>

          {trailerHistoryLoading && (
            <div className="glass-soft rounded-3xl p-10 text-center">
              <p className="text-sm text-white/70">Loading your trailers…</p>
            </div>
          )}

          {!trailerHistoryLoading && trailerHistoryError && (
            <div className="glass-soft rounded-3xl p-10 text-center">
              <p className="text-sm text-accent">Failed to load trailer history. Please try again later.</p>
            </div>
          )}

          {!trailerHistoryLoading && !trailerHistoryError && trailersWatched.length === 0 && (
            <div className="glass-soft rounded-3xl p-10 text-center">
              <p className="text-sm text-white/70">No trailers watched yet.</p>
            </div>
          )}

          {!trailerHistoryLoading && !trailerHistoryError && trailersWatched.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trailersWatched.map((entry) => (
                <TrailerHistoryCard
                  key={`${entry._id || entry.movieId}:${entry.youtubeId}`}
                  title={entry.title}
                  thumbnail={entry.thumbnail}
                  timestamp={entry.watchedAt}
                  onPlay={() => dispatch(openTrailer(entry.youtubeId))}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <TrailerModal isOpen={isTrailerOpen} youtubeKey={trailerKey} onClose={() => dispatch(closeTrailer())} />
    </div>
  );
};

export default History;

