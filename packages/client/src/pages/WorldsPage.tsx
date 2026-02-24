import { useTranslation } from "react-i18next";

export function WorldsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("nav.worlds")}</h1>
        <button className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500">
          {t("world.create")}
        </button>
      </div>
      <div className="rounded-lg border border-stone-800 bg-stone-900 p-12 text-center text-stone-500">
        {t("common.noData")}
      </div>
    </div>
  );
}
