import { createRouter, createWebHistory } from "vue-router";
import { useSessionStore } from "@/features/session-store";
import HealthPage from "./pages/HealthPage.vue";
import LoginPage from "./pages/LoginPage.vue";
import MePage from "./pages/MePage.vue";
import NewUserPage from "./pages/NewUserPage.vue";
import RegisterPage from "./pages/RegisterPage.vue";
import UserDetailPage from "./pages/UserDetailPage.vue";
import UsersPage from "./pages/UsersPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/users" },
    { path: "/login", component: LoginPage },
    { path: "/register", component: RegisterPage },
    { path: "/health", component: HealthPage },
    { path: "/users", component: UsersPage, meta: { requiresAuth: true } },
    { path: "/users/new", component: NewUserPage, meta: { requiresAuth: true } },
    { path: "/users/:id", component: UserDetailPage, meta: { requiresAuth: true } },
    { path: "/me", component: MePage, meta: { requiresAuth: true } },
  ],
});

/**
 * Espera a restauração terminar antes de decidir. Sem isso, um recarregamento
 * de página jogaria para /login enquanto o refresh silencioso ainda está em voo.
 */
router.beforeEach(async (to) => {
  if (!to.meta["requiresAuth"]) return true;

  const store = useSessionStore();
  if (!store.restored) {
    const { authRepository } = await import("@/features/container");
    await authRepository.me().catch(() => null);
    store.markRestored();
  }

  return store.session !== null ? true : { path: "/login" };
});
