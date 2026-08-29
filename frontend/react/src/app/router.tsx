import { createBrowserRouter } from "react-router";
import { Layout } from "./layout";
import { RequireAuth } from "./require-auth";
import { HealthPage } from "./pages/health-page";
import { LoginPage } from "./pages/login-page";
import { MePage } from "./pages/me-page";
import { RegisterPage } from "./pages/register-page";
import { UserDetailPage } from "./pages/user-detail-page";
import { UsersPage } from "./pages/users-page";

const routes = [
  {
    element: <Layout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/health", element: <HealthPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/", element: <UsersPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/users/:id", element: <UserDetailPage /> },
          { path: "/me", element: <MePage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
