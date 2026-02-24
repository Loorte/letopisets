import type { WorldContext } from "../types.js";

export function buildOrchestratorPrompt(ctx: WorldContext): string {
  const statesSummary = ctx.states
    .map((s) => `- ${s.name} (${s.form}): нас.=${s.population}, армия=${s.military.toFixed(1)}, экон.=${s.economy.toFixed(1)}, стаб.=${s.stability.toFixed(0)}`)
    .join("\n");

  const recentSummary = ctx.recentEvents.length > 0
    ? ctx.recentEvents.map((e) => `- [Тик ${e.tick}] ${e.title} (${e.type}, ${e.severity})`).join("\n")
    : "Событий пока нет.";

  return `Ты — оркестратор симуляции фэнтезийного мира "${ctx.worldName}".
Текущий тик: ${ctx.currentTick}

Государства:
${statesSummary}

Недавние события:
${recentSummary}

Определи, каких агентов нужно запустить на этом тике. Доступные агенты:
- politics — дипломатия, альянсы, конфликты, стабильность, перевороты

Ответь JSON-массивом с именами агентов. Если ничего важного не происходит, вызови хотя бы politics.
Пример: ["politics"]

Отвечай ТОЛЬКО JSON-массивом, без пояснений.`;
}
