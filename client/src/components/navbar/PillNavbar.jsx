import { createElement, memo, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Bookmark,
  Clock,
  Flame,
  Heart,
  Home,
  LogOut,
  Search,
  Users,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../SearchBar';
import ThemeToggle from '../ui/ThemeToggle.jsx';

const authedNavItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/trending', label: 'Trending', icon: Flame },
  { to: '/charts', label: 'Charts', icon: BarChart2 },
  { to: '/people', label: 'People', icon: Users },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { to: '/history', label: 'History', icon: Clock },
];

const guestNavItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/trending', label: 'Trending', icon: Flame },
  { to: '/charts', label: 'Charts', icon: BarChart2 },
  { to: '/people', label: 'People', icon: Users },
];

const PillNavbar = memo(() => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isPublicHome = location.pathname === '/';
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verify-otp'];
  const isAuthRoute = authPaths.includes(location.pathname);
  const guestContentPaths = ['/', '/trending', '/charts', '/people'];
  const isGuestContentRoute = guestContentPaths.includes(location.pathname);

  const shouldShow = Boolean(
    user || (!user && (isPublicHome || isAuthRoute || isGuestContentRoute))
  );

  const isSearchRoute = useMemo(() => location.pathname.startsWith('/search'), [location.pathname]);

  const navItems = useMemo(() => {
    if (!user) return guestNavItems;

    if (user.role === 'admin') {
      return [
        ...authedNavItems,
        { to: '/admin', label: 'Admin', icon: Shield },
      ];
    }

    return authedNavItems;
  }, [user]);

  if (!shouldShow) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-7xl">
        <div className="rounded-full px-5">
          <div className="glass-soft flex items-center justify-between gap-2 rounded-full px-2 py-2">
            {/* Left: Brand */}
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/')}
              className="group flex items-center gap-2 rounded-full px-3 py-2 transition-all hover:scale-[1.02] hover:bg-white/5"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-highlight shadow-[0_0_18px_color-mix(in_oklab,var(--color-highlight)_55%,transparent)]" />
              <span className="hidden text-sm font-semibold tracking-tight text-text sm:block">
                CineScope
              </span>
            </button>

            {/* Right: Nav items + theme toggle (desktop) */}
            <nav className="hidden items-center gap-2 md:flex">
              {user ? (
                <>
                  {navItems.map(({ to, label, icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      aria-label={label}
                      className={({ isActive }) =>
                        [
                          'group inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all',
                          'hover:scale-105 hover:bg-white/6',
                          isActive ? 'bg-white/10 text-text' : 'text-white/70 hover:text-white',
                        ].join(' ')
                      }
                    >
                      {createElement(icon, { className: 'h-4 w-4' })}
                      <span className="hidden lg:block">{label}</span>
                    </NavLink>
                  ))}

                  {/* Theme toggle */}
                  <ThemeToggle className="ml-1 inline-flex" />

                  {/* Avatar + Logout */}
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="ml-1 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/8"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white/90">
                      {(user?.email?.[0] ?? 'U').toUpperCase()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-white/90 transition hover:brightness-110"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden lg:block">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {guestNavItems.map(({ to, label, icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      aria-label={label}
                      className={({ isActive }) =>
                        [
                          'group inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all',
                          'hover:scale-105 hover:bg-white/6',
                          isActive ? 'bg-white/10 text-text' : 'text-white/70 hover:text-white',
                        ].join(' ')
                      }
                    >
                      {createElement(icon, { className: 'h-4 w-4' })}
                      <span className="hidden lg:block">{label}</span>
                    </NavLink>
                  ))}

                  <div className="ml-2 flex items-center gap-2 pr-1">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/8"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="rounded-full bg-highlight px-4 py-2 text-xs font-semibold text-black/90 transition hover:brightness-110"
                    >
                      Register
                    </button>
                  </div>
                </>
              )}
            </nav>

            {/* Right: Mobile controls */}
            <div className="flex items-center gap-1 md:hidden">
              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/90 transition hover:bg-white/8"
                >
                  Login
                </button>
              )}
              {user && (
                <>
                  <NavLink
                    to="/favorites"
                    aria-label="Favorites"
                    className={({ isActive }) =>
                      [
                        'inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition',
                        'hover:bg-white/10',
                        isActive ? 'bg-white/15 text-white' : '',
                      ].join(' ')
                    }
                  >
                    <Heart className="h-4 w-4" />
                  </NavLink>
                  <NavLink
                    to="/watchlist"
                    aria-label="Watchlist"
                    className={({ isActive }) =>
                      [
                        'inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition',
                        'hover:bg-white/10',
                        isActive ? 'bg-white/15 text-white' : '',
                      ].join(' ')
                    }
                  >
                    <Bookmark className="h-4 w-4" />
                  </NavLink>
                  <NavLink
                    to="/history"
                    aria-label="History"
                    className={({ isActive }) =>
                      [
                        'inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition',
                        'hover:bg-white/10',
                        isActive ? 'bg-white/15 text-white' : '',
                      ].join(' ')
                    }
                  >
                    <Clock className="h-4 w-4" />
                  </NavLink>
                </>
              )}

              {/* Mobile: Search shortcut */}
              <NavLink
                to="/search"
                aria-label="Search"
                className={[
                  'inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition',
                  'hover:bg-white/10',
                  isSearchRoute ? 'bg-white/15 text-white' : '',
                ].join(' ')}
              >
                <Search className="h-4 w-4" />
              </NavLink>

              {/* Mobile: Menu toggle */}
              <button
                type="button"
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90 transition hover:bg-white/10"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile slide-out navigation */}
      {isMenuOpen && (
        <div className="pointer-events-auto fixed inset-x-0 top-0 z-40 mt-20 px-3 md:hidden">
          <div className="glass-soft rounded-3xl border border-white/15 bg-black/80 p-4 backdrop-blur-xl">
            <div className="mb-3">
              <SearchBar debounceMs={250} compact className="w-full" />
            </div>
            <nav className="space-y-1">
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                      'hover:bg-white/10',
                      isActive ? 'bg-white/10 text-text' : 'text-white/80',
                    ].join(' ')
                  }
                >
                  {createElement(icon, { className: 'h-4 w-4' })}
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 flex items-center justify-between gap-3">
              <ThemeToggle />
              {user ? (
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:brightness-110"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              ) : (
                <div className="flex flex-1 items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                    className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/8"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/register');
                      setIsMenuOpen(false);
                    }}
                    className="flex-1 rounded-full bg-highlight px-4 py-2.5 text-sm font-semibold text-black/90 transition hover:brightness-110"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PillNavbar.displayName = 'PillNavbar';

export default PillNavbar;

