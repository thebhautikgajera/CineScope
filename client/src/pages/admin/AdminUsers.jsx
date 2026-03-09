import { useMemo } from 'react';
import {
  useGetUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useDeleteUserMutation,
} from '../../services/adminApi';
import { Users, ShieldBan, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
  const { data, isLoading, isError } = useGetUsersQuery();
  const [banUser, { isLoading: banning }] = useBanUserMutation();
  const [unbanUser, { isLoading: unbanning }] = useUnbanUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const users = useMemo(() => data?.data ?? data ?? [], [data]);

  const handleBanToggle = async (user) => {
    const isCurrentlyBanned = user.isBanned || user.banned;

    try {
      if (isCurrentlyBanned) {
        await unbanUser(user.id ?? user._id).unwrap();
        toast.success('User unbanned');
      } else {
        await banUser(user.id ?? user._id).unwrap();
        toast.success('User banned');
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete user "${user.email ?? user.name}"?`)) return;
    try {
      await deleteUser(user.id ?? user._id).unwrap();
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/25 text-secondary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Community
            </p>
            <h2 className="text-lg font-semibold text-text">
              Manage users
            </h2>
          </div>
        </div>
      </header>

      <section className="glass-soft rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <p className="font-semibold uppercase tracking-[0.18em] text-white/50">
            All users
          </p>
          <p className="text-[11px] text-white/60">
            {users.length} total
          </p>
        </div>

        {isLoading && (
          <p className="text-xs text-white/60">Loading users…</p>
        )}

        {isError && !isLoading && (
          <p className="text-xs text-red-400">
            Failed to load users. Please try again.
          </p>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <p className="text-xs text-white/60">
            No users found yet.
          </p>
        )}

        {!isLoading && !isError && users.length > 0 && (
          <div className="mt-2 max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {users.map((user) => {
              const isBanned = user.isBanned || user.banned;
              const busy = banning || unbanning || deleting;

              return (
                <div
                  key={user.id ?? user._id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-white/90">
                      {(user.email ?? user.name ?? 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white/90">
                        {user.email ?? user.name ?? 'Unknown user'}
                      </p>
                      <p className="text-[11px] text-white/60">
                        {user.role ?? 'user'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBanToggle(user)}
                      disabled={busy}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        isBanned
                          ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                      } disabled:opacity-60`}
                    >
                      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                      {isBanned ? (
                        <>
                          <ShieldCheck className="h-3 w-3" />
                          Unban
                        </>
                      ) : (
                        <>
                          <ShieldBan className="h-3 w-3" />
                          Ban
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      disabled={busy}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUsers;

