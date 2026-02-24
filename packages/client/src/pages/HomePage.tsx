import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="mb-4 text-5xl font-bold text-amber-500">
        {t("app.title")}
      </h1>
      <p className="mb-10 text-lg text-stone-400">
        {t("app.subtitle")}
      </p>
      <Link
        to="/worlds"
        className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-500"
      >
        {t("nav.worlds")}
      </Link>
    </div>
  );
}
