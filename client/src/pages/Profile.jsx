import { useNavigate } from 'react-router-dom';
import { User2, LogOut, ShieldCheck, Mail, Hash } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const username = (user?.email ?? 'user').split('@')[0];

  return (
    <div className="space-y-6 pt-12">
      <div className="glass rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 shadow-[0_0_30px_color-mix(in_oklab,var(--color-highlight)_22%,transparent)]">
              <User2 className="h-7 w-7 text-highlight" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text">Profile</h1>
              <p className="mt-1 text-sm text-white/70">
                Signed in as <span className="font-semibold text-white/90">{username}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white/95 transition hover:brightness-110"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-soft rounded-3xl p-6 md:col-span-2">
          <h2 className="text-sm font-semibold text-white/90">Account information</h2>
          <p className="mt-1 text-xs text-white/60">These details come from your JWT-authenticated session.</p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4">
              <dt className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
                <Mail className="h-4 w-4" />
                Email
              </dt>
              <dd className="mt-2 truncate text-sm font-semibold text-white/90">{user?.email ?? '—'}</dd>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <dt className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
                <ShieldCheck className="h-4 w-4" />
                Role
              </dt>
              <dd className="mt-2 text-sm font-semibold text-white/90">{user?.role ?? '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="glass-soft rounded-3xl p-6">
          <h2 className="text-sm font-semibold text-white/90">Coming soon</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>• Edit profile</li>
            <li>• Subscription plan</li>
            <li>• Device management</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;

