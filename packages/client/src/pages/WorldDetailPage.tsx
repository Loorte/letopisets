import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function WorldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">{t("nav.worlds")}</h1>
      <p className="text-stone-400">ID: {id}</p>
    </div>
  );
}
