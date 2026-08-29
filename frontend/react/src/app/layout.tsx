import { Link, Outlet, useNavigate } from "react-router";
import { useIsAuthenticated, useLogout, useRestoreSession } from "@/features/auth/use-auth";
import { Button } from "@/ui/button";

export function Layout() {
  useRestoreSession();
  const authenticated = useIsAuthenticated();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4 text-sm">
          <Link to="/users" className="font-semibold">
            Boilerplate
          </Link>
          {authenticated ? (
            <>
              <Link to="/users">Usuários</Link>
              <Link to="/me">Meu perfil</Link>
            </>
          ) : null}
          <Link to="/health">Situação</Link>
          <span className="flex-1" />
          {authenticated ? (
            <Button
              variant="ghost"
              onClick={() => {
                void logout().then(() => navigate("/login"));
              }}
            >
              Sair
            </Button>
          ) : (
            <Link to="/login">Entrar</Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
