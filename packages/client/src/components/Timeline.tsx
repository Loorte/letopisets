import { useTranslation } from "react-i18next";
import type { TimelineEvent } from "../stores/simulation";

interface TimelineProps {
  events: TimelineEvent[];
  onLoadMore: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: "border-stone-600 bg-stone-800 text-stone-300",
  moderate: "border-yellow-700 bg-yellow-900/30 text-yellow-300",
  major: "border-orange-700 bg-orange-900/30 text-orange-300",
  catastrophic: "border-red-700 bg-red-900/30 text-red-300",
};

const TYPE_COLORS: Record<string, string> = {
  political: "bg-purple-800 text-purple-200",
  economic: "bg-emerald-800 text-emerald-200",
  military: "bg-red-800 text-red-200",
  social: "bg-blue-800 text-blue-200",
  natural: "bg-green-800 text-green-200",
  magical: "bg-violet-800 text-violet-200",
  creature: "bg-amber-800 text-amber-200",
};

export function Timeline({ events, onLoadMore }: TimelineProps) {
  const { t } = useTranslation();

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-stone-800 bg-stone-900 p-12 text-center text-stone-500">
        {t("simulation.noEvents")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className={`rounded-lg border p-4 ${SEVERITY_COLORS[event.severity] ?? SEVERITY_COLORS.minor}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[event.type] ?? "bg-stone-700 text-stone-300"}`}>
              {t(`eventType.${event.type}`)}
            </span>
            <span className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
              {t(`severity.${event.severity}`)}
            </span>
            <span className="ml-auto text-xs text-stone-500">
              {t("world.tick")}: {event.tick}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-stone-100">{event.title}</h3>
          <p className="mt-1 text-sm text-stone-400">{event.description}</p>
        </div>
      ))}

      <button
        onClick={onLoadMore}
        className="w-full rounded-lg border border-stone-800 bg-stone-900 px-4 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-200"
      >
        {t("simulation.loadMore")}
      </button>
    </div>
  );
}
