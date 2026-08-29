import { inject } from "@angular/core";
import { Router, type CanActivateFn } from "@angular/router";
import { AuthService } from "../features/auth/auth.service";

/**
 * Espera a restauração terminar antes de decidir. Sem isso, um recarregamento
 * de página jogaria para /login enquanto o refresh silencioso ainda está em voo.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restoreSession();

  return auth.isAuthenticated() ? true : router.createUrlTree(["/login"]);
};
