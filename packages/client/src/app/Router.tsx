import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout.tsx";
import { HomePage } from "../pages/HomePage.tsx";
import { WorldsPage } from "../pages/WorldsPage.tsx";
import { WorldDetailPage } from "../pages/WorldDetailPage.tsx";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/worlds" element={<WorldsPage />} />
          <Route path="/worlds/:id" element={<WorldDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
