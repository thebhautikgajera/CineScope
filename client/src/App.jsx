import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AppRouter from './router';
import { useAuth } from './hooks/useAuth';
import { useLenis } from './hooks/useLenis';
import PillNavbar from './components/navbar/PillNavbar';
import WatchlistHydrator from './components/WatchlistHydrator';
import Footer from './components/Footer';

const App = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useLenis();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Fade-in page transition
      gsap.fromTo(
        '[data-page]',
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    });

    return () => ctx.revert();
  }, [location.pathname]);

  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verify-otp'];
  const isAuthScreen = authPaths.includes(location.pathname);
  const isAdmin = user?.role === 'admin';
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (!isAdmin || isAdminRoute || isAuthScreen) return;
    navigate('/admin', { replace: true });
  }, [isAdmin, isAdminRoute, isAuthScreen, navigate]);

  return (
    <div className="min-h-screen cinematic-bg text-text">
      {/* User & guest premium pill navbar (hidden only on admin console routes) */}
      {!isAuthScreen && (!isAdmin || !isAdminRoute) && <PillNavbar />}

      {/* Keep local watchlist in sync with backend for logged-in users */}
      {!isAuthScreen && (!isAdmin || !isAdminRoute) && <WatchlistHydrator />}

      <main
        data-page
        className={
          isAuthScreen || (isAdmin && isAdminRoute)
            ? ''
            : 'mx-auto w-full max-w-6xl px-4 pb-16 pt-12'
        }
      >
        <AppRouter />
        {!isAuthScreen && (!isAdmin || !isAdminRoute) && <Footer />}
      </main>
    </div>
  );
};

export default App;