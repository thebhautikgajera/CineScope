import { NavLink } from 'react-router-dom';
import { BarChart3, Film, Users, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { to: '/admin/movies', label: 'Movies', icon: Film },
  { to: '/admin/users', label: 'Users', icon: Users },
];

const AdminSidebar = () => {
  const [open, setOpen] = useState(true);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <aside
      className={`glass-soft relative flex h-screen flex-col border-r border-white/10 bg-black/40 transition-all duration-300 ${
        open ? 'w-64' : 'w-17'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-4">
        <button
          type="button"
          onClick={() => (window.location.href = '/')}
          className="flex items-center gap-2"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-highlight shadow-[0_0_18px_color-mix(in_oklab,var(--color-highlight)_55%,transparent)]" />
          {open && (
            <span className="text-sm font-semibold tracking-tight text-text">
              CineScope Admin
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle sidebar"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map(({ to, label, exact, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                'hover:bg-white/8',
                isActive
                  ? 'bg-white/10 text-text shadow-[0_0_20px_rgba(0,0,0,0.6)]'
                  : 'text-white/70 hover:text-white',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl bg-secondary px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:brightness-110"
        >
          <LogOut className="h-4 w-4" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

