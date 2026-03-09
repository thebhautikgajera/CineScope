import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="glass-soft rounded-3xl px-6 py-4 text-sm text-white/80">
          Checking admin access…
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-linear-to-br from-black via-slate-950 to-black text-white">
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
              Admin Console
            </p>
            <h1 className="mt-1 text-xl font-semibold text-text">
              Control room
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

