import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CinematicLoader from './ui/CinematicLoader';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <CinematicLoader label="Checking your session…" sublabel="Just a moment." />;
  }

  // If the user is an admin, always keep them inside the admin console.
  if (user && user.role === 'admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;

