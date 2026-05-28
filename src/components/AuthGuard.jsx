import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function AuthGuard({ children }) {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-soil-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-leaf-600 border-t-transparent" />
          <p className="mt-4 font-bold text-slate-600">లోడ్ అవుతోంది...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
