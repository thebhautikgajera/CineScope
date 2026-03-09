import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from 'lucide-react';
import { favoritesRemove } from '../slices/librarySlice';
import LibraryCard from '../components/library/LibraryCard';
import { useRemoveFavoriteMutation } from '../services/favoritesApi';

const Favorites = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const favoritesState = useSelector((s) => s.library.favorites);
  const favorites = useMemo(
    () => favoritesState.allIds.map((id) => favoritesState.byId[id]).filter(Boolean),
    [favoritesState]
  );

  const handleRemove = async (id) => {
    dispatch(favoritesRemove(id));
    try {
      await removeFavorite(String(id)).unwrap();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 pt-12">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">Favorites</h1>
            <p className="mt-1 text-sm text-white/70">Your saved picks - ready whenever you are.</p>
          </div>
          <div className="glass-soft inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white/80">
            <Heart className="h-4 w-4 text-highlight" />
            {favorites.length}
          </div>
        </div>
      </div>

      {favorites.length === 0 && (
        <div className="glass-soft rounded-3xl p-10 text-center">
          <p className="text-sm text-white/70">
            No favorites yet. Open a movie and tap <span className="font-semibold text-white/90">Favorite</span>.
          </p>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {favorites.map((fav) => (
            <LibraryCard
              key={fav.id}
              title={fav.title}
              poster={fav.poster}
              rating={fav.rating}
              releaseDate={fav.releaseDate}
              onOpen={() => navigate(`/movie/${fav.id}`)}
              onRemove={() => handleRemove(fav.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;

