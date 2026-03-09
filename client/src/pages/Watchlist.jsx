import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bookmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LibraryCard from '../components/library/LibraryCard';
import { watchlistRemove } from '../slices/librarySlice';
import { useRemoveFromWatchlistMutation } from '../services/watchlistApi';

const Watchlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const watchlistState = useSelector((s) => s.library.watchlist);
  const watchlist = useMemo(
    () => watchlistState.allIds.map((id) => watchlistState.byId[id]).filter(Boolean),
    [watchlistState]
  );

  const handleRemove = async (movieId) => {
    dispatch(watchlistRemove(movieId));
    try {
      await removeFromWatchlist(movieId).unwrap();
      toast.success('Removed from watchlist');
    } catch {
      toast.error('Failed to remove from watchlist');
    }
  };

  return (
    <div className="space-y-6 pt-12">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">Watchlist</h1>
            <p className="mt-1 text-sm text-white/70">A queue of what you want to watch next.</p>
          </div>
          <div className="glass-soft inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white/80">
            <Bookmark className="h-4 w-4 text-highlight" />
            {watchlist.length}
          </div>
        </div>
      </div>

      {watchlist.length === 0 && (
        <div className="glass-soft rounded-3xl p-10 text-center">
          <p className="text-sm text-white/70">Your watchlist is empty. Add a movie from its details page.</p>
        </div>
      )}

      {watchlist.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {watchlist.map((item) => (
            <LibraryCard
              key={item.id}
              title={item.title}
              poster={item.poster}
              rating={item.rating}
              releaseDate={item.releaseDate}
              showPlay
              onOpen={() => navigate(`/movie/${item.id}`)}
              onRemove={() => handleRemove(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
