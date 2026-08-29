import type { Routes } from "@angular/router";
import { authGuard } from "./auth.guard";
import { HealthPage } from "./pages/health.page";
import { LoginPage } from "./pages/login.page";
import { MePage } from "./pages/me.page";
import { NewUserPage } from "./pages/new-user.page";
import { RegisterPage } from "./pages/register.page";
import { UserDetailPage } from "./pages/user-detail.page";
import { UsersPage } from "./pages/users.page";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "users" },
  { path: "login", component: LoginPage },
  { path: "register", component: RegisterPage },
  { path: "health", component: HealthPage },
  { path: "users", component: UsersPage, canActivate: [authGuard] },
  { path: "users/new", component: NewUserPage, canActivate: [authGuard] },
  { path: "users/:id", component: UserDetailPage, canActivate: [authGuard] },
  { path: "me", component: MePage, canActivate: [authGuard] },
];
