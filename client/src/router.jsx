import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyOTP from './pages/auth/VerifyOTP';
import ProtectedRoute from './components/ProtectedRoute';
import CinematicLoader from './components/ui/CinematicLoader';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminUsers from './pages/admin/AdminUsers';

const PublicHome = lazy(() => import('./pages/PublicHome'));
const MovieDashboard = lazy(() => import('./pages/MovieDashboard'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const Trending = lazy(() => import('./pages/Trending'));
const PopularPeople = lazy(() => import('./pages/PopularPeople'));
const Charts = lazy(() => import('./pages/Charts'));

const PageLoader = () => <CinematicLoader label="Loading the next scene…" />;

const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MovieDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/trending" element={<Trending />} />
        <Route path="/people" element={<PopularPeople />} />
        <Route path="/charts" element={<Charts />} />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MovieDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <Watchlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="movies" element={<AdminMovies />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;

