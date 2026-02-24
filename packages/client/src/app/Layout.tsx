import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const navItems = [
  { path: "/", key: "nav.home" },
  { path: "/worlds", key: "nav.worlds" },
] as const;

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 bg-stone-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-amber-500">
            {t("app.title")}
          </Link>
          <nav className="flex gap-6">
            {navItems.map(({ path, key }) => (
              <Link
                key={path}
                to={path}
                className={`text-sm transition-colors hover:text-amber-400 ${
                  location.pathname === path
                    ? "text-amber-400"
                    : "text-stone-400"
                }`}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
