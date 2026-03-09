import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';
import MovieCard from '../components/MovieCard';
import MovieSkeletonCard from '../components/MovieSkeletonCard';
import { useGetMovieGenresQuery } from '../services/genresApi';
import GenreFilter from '../components/ui/GenreFilter';
import { toast } from 'react-hot-toast';

const SearchPage = () => {
  const navigate = useNavigate();
  const query = useSelector((state) => state.ui.searchQuery);

  const { allResults, isSearching, error, showTrending, isTrending } = useSearch(query, 300);

  const [selectedGenre, setSelectedGenre] = useState(null);

  const { data: genresData } = useGetMovieGenresQuery();
  const genres = useMemo(
    () => genresData?.data?.genres ?? [],
    [genresData]
  );

  const genreMap = useMemo(() => {
    const m = new Map();
    for (const g of genres) {
      if (g?.id) m.set(g.id, g.name);
    }
    return m;
  }, [genres]);

  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Something went wrong while searching');
    }
  }, [error]);

  const title = useMemo(() => {
    if (isTrending) return 'Trending right now';
    if (query?.trim()) return `Results for “${query.trim()}”`;
    if (showTrending) return 'Start typing to search (or browse trending)';
    return 'Search';
  }, [isTrending, query, showTrending]);

  const filteredResults = useMemo(() => {
    const nonPeople = allResults.filter((item) => item?.media_type !== 'person');

    if (selectedGenre == null) {
      return nonPeople;
    }

    return nonPeople.filter(
      (item) =>
        Array.isArray(item?.genre_ids) &&
        item.genre_ids.some((id) => Number(id) === Number(selectedGenre))
    );
  }, [allResults, selectedGenre]);

  return (
    <div className="relative space-y-6 pt-12">
      {/* Ensure the search bar (and its dropdown) always renders above the content below */}
      <div className="glass relative z-20 rounded-3xl p-6">
        <h1 className="text-2xl font-semibold text-text">Search</h1>
        <p className="mt-1 text-sm text-white/70">Search movies, TV shows, and people with live suggestions.</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchBar debounceMs={300} className="max-w-2xl" />
          <div className="w-full md:w-64">
            <GenreFilter value={selectedGenre} genres={genres} onChange={setSelectedGenre} />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white/90">{title}</h2>
          {error && <p className="mt-1 text-sm text-accent">{error}</p>}
        </div>
        {query?.trim() && (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/8 hover:text-white"
          >
            Back to Home
          </button>
        )}
      </div>

      {isSearching && (
        <div className="relative z-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <MovieSkeletonCard key={idx} />
          ))}
        </div>
      )}

      {!isSearching && !error && filteredResults.length === 0 && query?.trim()?.length >= 2 && (
        <div className="glass-soft relative z-10 rounded-3xl p-10 text-center">
          <p className="text-sm text-white/70">No results found for “{query.trim()}”. Try a different keyword.</p>
        </div>
      )}

      {!isSearching && !error && filteredResults.length > 0 && (
        <div className="relative z-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {filteredResults.slice(0, 36).map((item) => (
            <MovieCard
              key={`${item.media_type ?? 'm'}-${item.id}`}
              item={item}
              to={`/movie/${item.id}`}
              genreMap={genreMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;

