import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { useAuth } from "../features/auth/AuthProvider";
import { LoginPage } from "../features/auth/LoginPage";
import { Loading } from "../components/ui";
import type { Role } from "../lib/types";

const CatalogPage = lazy(() =>
  import("../features/catalog/CatalogPage").then((module) => ({ default: module.CatalogPage })),
);
const TransactionsPage = lazy(() =>
  import("../features/transactions/TransactionsPage").then((module) => ({
    default: module.TransactionsPage,
  })),
);
const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const MovementsPage = lazy(() =>
  import("../features/inventory/MovementsPage").then((module) => ({
    default: module.MovementsPage,
  })),
);
function Guard({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/products" replace />;
  return children;
}
export function App() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <Guard>
              <Layout />
            </Guard>
          }
        >
          <Route
            index
            element={user?.role === "SELLER" ? <Navigate to="/sales" replace /> : <DashboardPage />}
          />
          <Route path="products" element={<CatalogPage kind="products" />} />
          <Route path="categories" element={<CatalogPage kind="categories" />} />
          <Route path="customers" element={<CatalogPage kind="customers" />} />
          <Route
            path="suppliers"
            element={
              <Guard roles={["ADMIN", "WAREHOUSE"]}>
                <CatalogPage kind="suppliers" />
              </Guard>
            }
          />
          <Route
            path="users"
            element={
              <Guard roles={["ADMIN"]}>
                <CatalogPage kind="users" />
              </Guard>
            }
          />
          <Route
            path="sales"
            element={
              <Guard roles={["ADMIN", "SELLER"]}>
                <TransactionsPage kind="sales" />
              </Guard>
            }
          />
          <Route
            path="purchases"
            element={
              <Guard roles={["ADMIN", "WAREHOUSE"]}>
                <TransactionsPage kind="purchases" />
              </Guard>
            }
          />
          <Route
            path="movements"
            element={
              <Guard roles={["ADMIN", "WAREHOUSE"]}>
                <MovementsPage />
              </Guard>
            }
          />
          <Route
            path="reports"
            element={
              <Guard roles={["ADMIN", "WAREHOUSE"]}>
                <DashboardPage reports />
              </Guard>
            }
          />
          <Route
            path="*"
            element={
              <div className="empty-state">
                <h1>Página no encontrada</h1>
                <a className="button" href="/">
                  Volver al inicio
                </a>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
