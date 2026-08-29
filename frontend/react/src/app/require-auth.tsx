import { Navigate, Outlet, useLocation } from "react-router";
import { useIsAuthenticated, useSessionRestored } from "@/features/auth/use-auth";
import { Loading } from "@/ui/states";

/**
 * Espera a restauração terminar antes de decidir. Sem isso, um recarregamento
 * de página jogaria para /login enquanto o refresh silencioso ainda está em voo.
 */
export function RequireAuth() {
  const authenticated = useIsAuthenticated();
  const restored = useSessionRestored();
  const location = useLocation();

  if (!restored) return <Loading label="Verificando sessão…" />;
  if (!authenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
