import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type { World } from "@letopisets/shared/schemas/world";

type Tab = "overview" | "states" | "burgs" | "cultures" | "religions" | "map";

interface EntityState {
  id: string;
  fmgId: number;
  name: string;
  form: string;
  color: string | null;
  population: number;
  military: number;
  economy: number;
  stability: number;
}

interface EntityBurg {
  id: string;
  fmgId: number;
  name: string;
  population: number;
  isCapital: boolean;
  isPort: boolean;
  x: number;
  y: number;
}

interface EntityCulture {
  id: string;
  fmgId: number;
  name: string;
  type: string;
  color: string | null;
}

interface EntityReligion {
  id: string;
  fmgId: number;
  name: string;
  type: string;
  deity: string | null;
  color: string | null;
}

export function WorldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const { data: world, isLoading } = useQuery<World>({
    queryKey: ["world", id],
    queryFn: () => apiFetch<World>(`/worlds/${id}`),
  });

  const statesQuery = useQuery<EntityState[]>({
    queryKey: ["world", id, "states"],
    queryFn: () => apiFetch(`/worlds/${id}/states`),
    enabled: tab === "states" || tab === "overview",
  });

  const burgsQuery = useQuery<EntityBurg[]>({
    queryKey: ["world", id, "burgs"],
    queryFn: () => apiFetch(`/worlds/${id}/burgs`),
    enabled: tab === "burgs" || tab === "overview" || tab === "map",
  });

  const culturesQuery = useQuery<EntityCulture[]>({
    queryKey: ["world", id, "cultures"],
    queryFn: () => apiFetch(`/worlds/${id}/cultures`),
    enabled: tab === "cultures" || tab === "overview",
  });

  const religionsQuery = useQuery<EntityReligion[]>({
    queryKey: ["world", id, "religions"],
    queryFn: () => apiFetch(`/worlds/${id}/religions`),
    enabled: tab === "religions" || tab === "overview",
  });

  const importMutation = useMutation({
    mutationFn: (fmgData: unknown) =>
      apiFetch(`/worlds/${id}/fmg/import`, {
        method: "POST",
        body: JSON.stringify(fmgData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world", id] });
    },
  });

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text);
    importMutation.mutate(json);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (isLoading) {
    return <div className="text-center text-stone-500">{t("common.loading")}</div>;
  }

  if (!world) {
    return <div className="text-center text-red-400">{t("common.error")}</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t("world.overview") },
    { key: "states", label: t("entity.states") },
    { key: "burgs", label: t("entity.burgs") },
    { key: "cultures", label: t("entity.cultures") },
    { key: "religions", label: t("entity.religions") },
    { key: "map", label: t("world.map") },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/worlds" className="text-sm text-stone-500 hover:text-amber-400">
            {t("nav.worlds")}
          </Link>
          <h1 className="text-3xl font-bold">{world.name}</h1>
          <div className="mt-1 flex gap-4 text-sm text-stone-400">
            <span>{t("world.status")}: {t(`world.${world.simStatus}`)}</span>
            <span>{t("world.tick")}: {world.currentTick}</span>
            {world.seed && <span>{t("world.seed")}: {world.seed}</span>}
          </div>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importMutation.isPending}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {importMutation.isPending ? t("world.importing") : t("world.importFmg")}
          </button>
        </div>
      </div>

      {importMutation.isSuccess && (
        <div className="mb-4 rounded-lg border border-green-800 bg-green-900/30 p-3 text-sm text-green-300">
          {t("world.importSuccess")}
        </div>
      )}
      {importMutation.isError && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
          {t("common.error")}: {(importMutation.error as Error).message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-stone-800">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-b-2 border-amber-500 text-amber-400"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewTab
          states={statesQuery.data ?? []}
          burgs={burgsQuery.data ?? []}
          cultures={culturesQuery.data ?? []}
          religions={religionsQuery.data ?? []}
          t={t}
        />
      )}
      {tab === "states" && <StatesTab data={statesQuery.data ?? []} isLoading={statesQuery.isLoading} t={t} />}
      {tab === "burgs" && <BurgsTab data={burgsQuery.data ?? []} isLoading={burgsQuery.isLoading} t={t} />}
      {tab === "cultures" && <CulturesTab data={culturesQuery.data ?? []} isLoading={culturesQuery.isLoading} t={t} />}
      {tab === "religions" && <ReligionsTab data={religionsQuery.data ?? []} isLoading={religionsQuery.isLoading} t={t} />}
      {tab === "map" && <MapTab burgs={burgsQuery.data ?? []} states={statesQuery.data ?? []} t={t} />}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type TFn = (key: string) => string;

function OverviewTab({ states, burgs, cultures, religions, t }: {
  states: EntityState[];
  burgs: EntityBurg[];
  cultures: EntityCulture[];
  religions: EntityReligion[];
  t: TFn;
}) {
  const stats = [
    { label: t("entity.states"), count: states.length },
    { label: t("entity.burgs"), count: burgs.length },
    { label: t("entity.cultures"), count: cultures.length },
    { label: t("entity.religions"), count: religions.length },
  ];

  const hasData = stats.some((s) => s.count > 0);

  if (!hasData) {
    return (
      <div className="rounded-lg border border-stone-800 bg-stone-900 p-12 text-center text-stone-500">
        {t("common.noData")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, count }) => (
        <div key={label} className="rounded-lg border border-stone-800 bg-stone-900 p-6 text-center">
          <div className="text-3xl font-bold text-amber-400">{count}</div>
          <div className="mt-1 text-sm text-stone-400">{label}</div>
        </div>
      ))}
    </div>
  );
}

function StatesTab({ data, isLoading, t }: { data: EntityState[]; isLoading: boolean; t: TFn }) {
  if (isLoading) return <div className="text-stone-500">{t("common.loading")}</div>;
  if (data.length === 0) return <div className="text-stone-500">{t("common.noData")}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-800 text-left text-stone-400">
            <th className="px-3 py-2">{t("entity.color")}</th>
            <th className="px-3 py-2">{t("entity.name")}</th>
            <th className="px-3 py-2">{t("entity.form")}</th>
            <th className="px-3 py-2">{t("entity.population")}</th>
            <th className="px-3 py-2">{t("entity.military")}</th>
            <th className="px-3 py-2">{t("entity.economy")}</th>
            <th className="px-3 py-2">{t("entity.stability")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.id} className="border-b border-stone-800/50 hover:bg-stone-900">
              <td className="px-3 py-2">
                {s.color && <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: s.color }} />}
              </td>
              <td className="px-3 py-2 font-medium text-stone-100">{s.name}</td>
              <td className="px-3 py-2 text-stone-400">{s.form}</td>
              <td className="px-3 py-2 text-stone-300">{s.population.toLocaleString()}</td>
              <td className="px-3 py-2 text-stone-300">{s.military}</td>
              <td className="px-3 py-2 text-stone-300">{s.economy}</td>
              <td className="px-3 py-2 text-stone-300">{s.stability}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BurgsTab({ data, isLoading, t }: { data: EntityBurg[]; isLoading: boolean; t: TFn }) {
  if (isLoading) return <div className="text-stone-500">{t("common.loading")}</div>;
  if (data.length === 0) return <div className="text-stone-500">{t("common.noData")}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-800 text-left text-stone-400">
            <th className="px-3 py-2">{t("entity.name")}</th>
            <th className="px-3 py-2">{t("entity.population")}</th>
            <th className="px-3 py-2">{t("entity.capital")}</th>
            <th className="px-3 py-2">{t("entity.port")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b) => (
            <tr key={b.id} className="border-b border-stone-800/50 hover:bg-stone-900">
              <td className="px-3 py-2 font-medium text-stone-100">{b.name}</td>
              <td className="px-3 py-2 text-stone-300">{b.population.toLocaleString()}</td>
              <td className="px-3 py-2 text-stone-300">{b.isCapital ? "+" : ""}</td>
              <td className="px-3 py-2 text-stone-300">{b.isPort ? "+" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CulturesTab({ data, isLoading, t }: { data: EntityCulture[]; isLoading: boolean; t: TFn }) {
  if (isLoading) return <div className="text-stone-500">{t("common.loading")}</div>;
  if (data.length === 0) return <div className="text-stone-500">{t("common.noData")}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-800 text-left text-stone-400">
            <th className="px-3 py-2">{t("entity.color")}</th>
            <th className="px-3 py-2">{t("entity.name")}</th>
            <th className="px-3 py-2">{t("entity.type")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-b border-stone-800/50 hover:bg-stone-900">
              <td className="px-3 py-2">
                {c.color && <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: c.color }} />}
              </td>
              <td className="px-3 py-2 font-medium text-stone-100">{c.name}</td>
              <td className="px-3 py-2 text-stone-400">{c.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReligionsTab({ data, isLoading, t }: { data: EntityReligion[]; isLoading: boolean; t: TFn }) {
  if (isLoading) return <div className="text-stone-500">{t("common.loading")}</div>;
  if (data.length === 0) return <div className="text-stone-500">{t("common.noData")}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-800 text-left text-stone-400">
            <th className="px-3 py-2">{t("entity.color")}</th>
            <th className="px-3 py-2">{t("entity.name")}</th>
            <th className="px-3 py-2">{t("entity.type")}</th>
            <th className="px-3 py-2">{t("entity.deity")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-stone-800/50 hover:bg-stone-900">
              <td className="px-3 py-2">
                {r.color && <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: r.color }} />}
              </td>
              <td className="px-3 py-2 font-medium text-stone-100">{r.name}</td>
              <td className="px-3 py-2 text-stone-400">{r.type}</td>
              <td className="px-3 py-2 text-stone-300">{r.deity ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapTab({ burgs, t }: { burgs: EntityBurg[]; states: EntityState[]; t: TFn }) {
  if (burgs.length === 0) {
    return <div className="text-stone-500">{t("common.noData")}</div>;
  }

  // Calculate bounds from burg coordinates
  const xs = burgs.map((b) => b.x);
  const ys = burgs.map((b) => b.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = 30;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
      <svg
        viewBox={`${minX - padding} ${minY - padding} ${width} ${height}`}
        className="h-auto w-full"
        style={{ maxHeight: "600px" }}
      >
        <rect
          x={minX - padding}
          y={minY - padding}
          width={width}
          height={height}
          fill="#1c1917"
        />
        {burgs.map((burg) => (
          <g key={burg.id}>
            <circle
              cx={burg.x}
              cy={burg.y}
              r={burg.isCapital ? 5 : 3}
              fill={burg.isCapital ? "#f59e0b" : "#a8a29e"}
              stroke={burg.isPort ? "#38bdf8" : "none"}
              strokeWidth={burg.isPort ? 1.5 : 0}
            />
            <text
              x={burg.x}
              y={burg.y - (burg.isCapital ? 7 : 5)}
              textAnchor="middle"
              fill="#d6d3d1"
              fontSize={burg.isCapital ? 5 : 3.5}
              fontWeight={burg.isCapital ? "bold" : "normal"}
            >
              {burg.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
