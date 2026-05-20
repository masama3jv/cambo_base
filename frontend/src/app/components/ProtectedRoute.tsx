import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const roleDashboard: Record<string, string> = {
  capita: '/dashboard',
  jugador: '/jugador/dashboard',
  arbitre: '/arbitre/partits',
  admin: '/admin',
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8] items-center justify-center">
        <p className="text-[#5F5E5A]">Carregant...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectTo = roleDashboard[user.role] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
