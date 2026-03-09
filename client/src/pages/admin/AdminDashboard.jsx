import { useMemo } from 'react';
import { useGetAdminMoviesQuery, useGetUsersQuery } from '../../services/adminApi';
import { formatDate } from '../../utils/date';
import { BarChart3, Film, Users, Activity, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sublabel }) => (
  <div className="glass-soft flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-highlight/20 text-highlight">
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-text">{value}</p>
      {sublabel && (
        <p className="text-[11px] text-white/60">{sublabel}</p>
      )}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { data: movies, isLoading: moviesLoading } = useGetAdminMoviesQuery();
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();

  const { totalMovies, totalUsers, bannedUsers, recentMovies, recentUsers } = useMemo(() => {
    const movieList = movies?.data ?? movies ?? [];
    const userList = users?.data ?? users ?? [];

    return {
      totalMovies: movieList.length,
      totalUsers: userList.length,
      bannedUsers: userList.filter((u) => u.isBanned || u.banned).length,
      recentMovies: [...movieList]
        .sort((a, b) => new Date(b.createdAt ?? b.updatedAt ?? 0) - new Date(a.createdAt ?? a.updatedAt ?? 0))
        .slice(0, 5),
      recentUsers: [...userList]
        .sort((a, b) => new Date(b.createdAt ?? b.updatedAt ?? 0) - new Date(a.createdAt ?? a.updatedAt ?? 0))
        .slice(0, 5),
    };
  }, [movies, users]);

  const loading = moviesLoading || usersLoading;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-r from-black/80 via-black/50 to-secondary/20 p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Real-time overview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text md:text-3xl">
              Live control dashboard
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Monitor movies and users in real time. All tiles update automatically when you add, edit, or remove data.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs text-white/70 ring-1 ring-white/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlight opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-highlight" />
            </span>
            Live sync with admin API
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Film}
          label="Movies"
          value={loading ? '—' : totalMovies}
          sublabel="Total titles in catalog"
        />
        <StatCard
          icon={Users}
          label="Users"
          value={loading ? '—' : totalUsers}
          sublabel="Registered accounts"
        />
        <StatCard
          icon={Activity}
          label="Banned"
          value={loading ? '—' : bannedUsers}
          sublabel="Restricted accounts"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-soft rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Recent movies
              </p>
              <h3 className="mt-1 text-sm font-semibold text-text">
                Latest changes
              </h3>
            </div>
          </div>
          <div className="space-y-2">
            {loading && (
              <p className="text-xs text-white/60">Loading latest movies…</p>
            )}
            {!loading && recentMovies.length === 0 && (
              <p className="text-xs text-white/60">
                No movies in the catalog yet. Start by adding your first title from the Movies page.
              </p>
            )}
            {!loading &&
              recentMovies.map((movie) => (
                <div
                  key={movie.id ?? movie._id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-white/90">
                      {movie.title ?? movie.name}
                    </span>
                    <span className="text-[11px] text-white/60">
                      {formatDate(movie.releaseDate) || 'No release date'}
                    </span>
                  </div>
                  {movie.status && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                      {movie.status}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="glass-soft rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Recent users
              </p>
              <h3 className="mt-1 text-sm font-semibold text-text">
                Latest signups
              </h3>
            </div>
          </div>
          <div className="space-y-2">
            {loading && (
              <p className="text-xs text-white/60">Loading users…</p>
            )}
            {!loading && recentUsers.length === 0 && (
              <p className="text-xs text-white/60">
                No users found yet. Once users sign up, they will appear here.
              </p>
            )}
            {!loading &&
              recentUsers.map((user) => (
                <div
                  key={user.id ?? user._id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-white/90">
                      {user.email ?? user.name ?? 'Unknown user'}
                    </span>
                    <span className="text-[11px] text-white/60">
                      {user.role ?? 'user'}
                    </span>
                  </div>
                  {user.isBanned || user.banned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      Banned
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;

