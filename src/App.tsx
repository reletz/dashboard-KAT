import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "./auth/AuthGuard";
import { Layout } from "./components/Layout";
import { useMe } from "./lib/me";
import { Home } from "./pages/Home";
import { Links } from "./pages/Links";
import { Kanban } from "./pages/Kanban";
import { Calendar } from "./pages/Calendar";
import { Admin } from "./pages/Admin";

// Vite mengisi BASE_URL dari `base` di vite.config (mis. "/dashboard/").
// React Router butuh tanpa trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Hanya ring 1; selain itu dilempar ke beranda (kanban & admin disembunyikan). */
function Ring1Route({ children }: { children: ReactElement }) {
  const { canWrite, loading } = useMe();
  if (loading) return null;
  return canWrite ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthGuard>
      <BrowserRouter basename={basename}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/links" element={<Links />} />
            <Route path="/kalender" element={<Calendar />} />
            <Route path="/kanban" element={<Ring1Route><Kanban /></Ring1Route>} />
            <Route path="/admin" element={<Ring1Route><Admin /></Ring1Route>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthGuard>
  );
}
