import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LoadingScreen } from "./LoadingScreen";

export function AuthGuard({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children ? children : <Outlet />;
}
