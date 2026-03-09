import { useState, useMemo } from 'react';
import {
  useGetAdminMoviesQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
} from '../../services/adminApi';
import { formatDate } from '../../utils/date';
import { Film, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const emptyMovie = {
  title: '',
  overview: '',
  releaseDate: '',
  runtime: '',
  posterUrl: '',
};

const AdminMovies = () => {
  const { data, isLoading, isError } = useGetAdminMoviesQuery();
  const [createMovie, { isLoading: creating }] = useCreateMovieMutation();
  const [updateMovie, { isLoading: updating }] = useUpdateMovieMutation();
  const [deleteMovie, { isLoading: deleting }] = useDeleteMovieMutation();

  const [editingMovie, setEditingMovie] = useState(null);
  const [form, setForm] = useState(emptyMovie);
  const [submitting, setSubmitting] = useState(false);

  const movies = useMemo(() => data?.data ?? data ?? [], [data]);

  const startCreate = () => {
    setEditingMovie(null);
    setForm(emptyMovie);
  };

  const startEdit = (movie) => {
    setEditingMovie(movie);
    setForm({
      title: movie.title ?? '',
      overview: movie.overview ?? '',
      releaseDate: movie.releaseDate ? movie.releaseDate.slice(0, 10) : '',
      runtime: movie.runtime ?? '',
      posterUrl: movie.posterUrl ?? movie.poster_path ?? '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        runtime: form.runtime ? Number(form.runtime) : undefined,
      };

      if (editingMovie) {
        await updateMovie({ id: editingMovie.id ?? editingMovie._id, ...payload }).unwrap();
        toast.success('Movie updated successfully');
      } else {
        await createMovie(payload).unwrap();
        toast.success('Movie created successfully');
      }

      setEditingMovie(null);
      setForm(emptyMovie);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save movie. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Delete "${movie.title ?? movie.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteMovie(movie.id ?? movie._id).unwrap();
      toast.success('Movie deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete movie');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlight/20 text-highlight">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Catalog
            </p>
            <h2 className="text-lg font-semibold text-text">
              Manage movies
            </h2>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
        <div className="glass-soft rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              All movies
            </p>
            <p className="text-[11px] text-white/60">
              {movies.length} total
            </p>
          </div>

          {isLoading && (
            <p className="text-xs text-white/60">Loading movies…</p>
          )}
          {isError && !isLoading && (
            <p className="text-xs text-red-400">
              Failed to load movies. Please try again.
            </p>
          )}
          {!isLoading && !isError && movies.length === 0 && (
            <p className="text-xs text-white/60">
              No movies found. Create your first movie using the form on the right.
            </p>
          )}

          {!isLoading && !isError && movies.length > 0 && (
            <div className="mt-2 space-y-2">
              {movies.map((movie) => (
                <div
                  key={movie.id ?? movie._id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-white/90">
                      {movie.title ?? movie.name}
                    </span>
                    <span className="text-[11px] text-white/60">
                      {formatDate(movie.releaseDate) || 'No release date'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(movie)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(movie)}
                      disabled={deleting}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-soft rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            {editingMovie ? 'Edit movie' : 'Add movie'}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-text">
            {editingMovie ? editingMovie.title ?? editingMovie.name : 'New title'}
          </h3>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] text-white/60">
                Title
              </label>
              <input
                required
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none ring-highlight/40 focus:border-highlight/60 focus:ring-1"
                placeholder="Movie title"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/60">
                Overview
              </label>
              <textarea
                name="overview"
                value={form.overview}
                onChange={handleChange}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none ring-highlight/40 focus:border-highlight/60 focus:ring-1"
                placeholder="Short description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-white/60">
                  Release date
                </label>
                <input
                  type="date"
                  name="releaseDate"
                  value={form.releaseDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none ring-highlight/40 focus:border-highlight/60 focus:ring-1"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-white/60">
                  Runtime (min)
                </label>
                <input
                  type="number"
                  name="runtime"
                  value={form.runtime}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none ring-highlight/40 focus:border-highlight/60 focus:ring-1"
                  placeholder="120"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-white/60">
                Poster URL
              </label>
              <input
                name="posterUrl"
                value={form.posterUrl}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none ring-highlight/40 focus:border-highlight/60 focus:ring-1"
                placeholder="https://…"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {editingMovie ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className="text-[11px] text-white/60 hover:text-white/80"
                >
                  Cancel edit
                </button>
              ) : (
                <span className="text-[11px] text-white/50">
                  Fields marked * are required.
                </span>
              )}

              <button
                type="submit"
                disabled={submitting || creating || updating}
                className="inline-flex items-center gap-2 rounded-full bg-highlight px-4 py-1.5 text-[11px] font-semibold text-black/90 shadow hover:brightness-110 disabled:opacity-60"
              >
                {(submitting || creating || updating) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {editingMovie ? 'Save changes' : 'Create movie'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AdminMovies;

