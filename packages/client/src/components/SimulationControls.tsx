import { useTranslation } from "react-i18next";
import type { SimSpeed } from "../stores/simulation";

interface SimulationControlsProps {
  status: string;
  speed: SimSpeed;
  currentTick: number;
  processingTick: number | null;
  lastTickResult: {
    agentsRun: number;
    eventsCreated: number;
    tokensUsed: number;
  } | null;
  apiKeyConfigured: boolean;
  onStart: (speed?: SimSpeed) => void;
  onPause: () => void;
  onStep: () => void;
  onStop: () => void;
  onSpeedChange: (speed: SimSpeed) => void;
}

const SPEEDS: SimSpeed[] = ["slow", "normal", "fast"];
const SPEED_I18N: Record<SimSpeed, string> = {
  slow: "simulation.speedSlow",
  normal: "simulation.speedNormal",
  fast: "simulation.speedFast",
};

export function SimulationControls({
  status,
  speed,
  currentTick,
  processingTick,
  lastTickResult,
  apiKeyConfigured,
  onStart,
  onPause,
  onStep,
  onStop,
  onSpeedChange,
}: SimulationControlsProps) {
  const { t } = useTranslation();
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isIdle = status === "idle";

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Control buttons */}
        <div className="flex gap-2">
          {(isIdle || isPaused) && (
            <button
              onClick={() => onStart(speed)}
              disabled={!apiKeyConfigured}
              className="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!apiKeyConfigured ? t("simulation.apiKeyRequired") : ""}
            >
              {t("simulation.start")}
            </button>
          )}

          {isRunning && (
            <button
              onClick={onPause}
              className="rounded-lg bg-yellow-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
            >
              {t("simulation.pause")}
            </button>
          )}

          <button
            onClick={onStep}
            disabled={isRunning || !apiKeyConfigured}
            className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("simulation.step")}
          </button>

          {!isIdle && (
            <button
              onClick={onStop}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              {t("simulation.stop")}
            </button>
          )}
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <span>{t("simulation.speed")}:</span>
          <div className="flex gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${
                  speed === s
                    ? "bg-amber-600 text-white"
                    : "bg-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                {t(SPEED_I18N[s])}
              </button>
            ))}
          </div>
        </div>

        {/* Status info */}
        <div className="ml-auto flex items-center gap-4 text-sm">
          {processingTick !== null && (
            <span className="text-amber-400 animate-pulse">
              {t("simulation.tickProcessing", { tick: processingTick })}
            </span>
          )}

          {lastTickResult && !processingTick && (
            <span className="text-stone-500">
              {t("simulation.agentsRun", { count: lastTickResult.agentsRun })}
              {" · "}
              {t("simulation.eventsCreated", { count: lastTickResult.eventsCreated })}
              {" · "}
              {t("simulation.tokensUsed", { count: lastTickResult.tokensUsed })}
            </span>
          )}

          <span className={`inline-flex items-center gap-1.5 ${
            isRunning ? "text-green-400" : isPaused ? "text-yellow-400" : "text-stone-500"
          }`}>
            <span className={`inline-block h-2 w-2 rounded-full ${
              isRunning ? "bg-green-400 animate-pulse" : isPaused ? "bg-yellow-400" : "bg-stone-600"
            }`} />
            {t(`world.${status}`)}
          </span>

          <span className="text-stone-400">
            {t("world.tick")}: {currentTick}
          </span>
        </div>
      </div>
    </div>
  );
}
