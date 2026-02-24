import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import type { World } from "@letopisets/shared/schemas/world";

export function WorldsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("");

  const { data: worlds = [], isLoading } = useQuery<World[]>({
    queryKey: ["worlds"],
    queryFn: () => apiFetch<World[]>("/worlds"),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; seed?: string }) =>
      apiFetch<World>("/worlds", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
      setShowForm(false);
      setName("");
      setSeed("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch("/worlds/" + id, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worlds"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), seed: seed.trim() || undefined });
  };

  const handleDelete = (id: string, worldName: string) => {
    if (!confirm(`${t("world.delete")}: ${worldName}?`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("nav.worlds")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500"
        >
          {t("world.create")}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-stone-700 bg-stone-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("world.create")}</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-stone-400 hover:text-stone-200"
            >
              {t("common.close")}
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-stone-400">
                {t("world.name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 focus:border-amber-600 focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-stone-400">
                {t("world.seed")}
              </label>
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full rounded-lg border border-stone-700 bg-stone-800 px-3 py-2 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>
            {createMutation.isError && (
              <p className="text-sm text-red-400">
                {t("common.error")}: {(createMutation.error as Error).message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
              >
                {createMutation.isPending ? t("common.loading") : t("common.create")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-stone-700 px-4 py-2 text-stone-300 transition-colors hover:bg-stone-800"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-stone-500">{t("common.loading")}</div>
      ) : worlds.length === 0 ? (
        <div className="rounded-lg border border-stone-800 bg-stone-900 p-12 text-center text-stone-500">
          {t("common.noData")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <div
              key={world.id}
              className="rounded-lg border border-stone-800 bg-stone-900 p-6 transition-colors hover:border-stone-700"
            >
              <div className="mb-2 flex items-start justify-between">
                <Link
                  to={`/worlds/${world.id}`}
                  className="text-lg font-semibold text-stone-100 hover:text-amber-400"
                >
                  {world.name}
                </Link>
                <button
                  onClick={() => handleDelete(world.id, world.name)}
                  className="text-sm text-stone-600 hover:text-red-400"
                  title={t("world.delete")}
                >
                  {t("common.delete")}
                </button>
              </div>
              <div className="space-y-1 text-sm text-stone-400">
                <p>{t("world.status")}: {t(`world.${world.simStatus}`)}</p>
                <p>{t("world.tick")}: {world.currentTick}</p>
                {world.seed && <p>{t("world.seed")}: {world.seed}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
