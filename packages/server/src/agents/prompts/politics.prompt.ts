import type { WorldContext } from "../types.js";

export function buildPoliticsPrompt(ctx: WorldContext): string {
  const statesSummary = ctx.states
    .map((s) => `- ${s.name} (id: ${s.id}, ${s.form}): население=${s.population}, армия=${s.military.toFixed(1)}, экономика=${s.economy.toFixed(1)}, стабильность=${s.stability.toFixed(0)}`)
    .join("\n");

  const diploSummary = ctx.diplomaticRelations.length > 0
    ? ctx.diplomaticRelations
        .map((d) => `- ${d.stateAName} ↔ ${d.stateBName}: ${d.relation} (с тика ${d.since})`)
        .join("\n")
    : "Дипломатических отношений пока нет.";

  const recentSummary = ctx.recentEvents.length > 0
    ? ctx.recentEvents.map((e) => `- [Тик ${e.tick}] ${e.title}: ${e.description}`).join("\n")
    : "Событий пока нет.";

  const memorySummary = ctx.memories.length > 0
    ? ctx.memories.map((m) => `- [Тик ${m.tick}, ${m.memoryType}] ${m.content}`).join("\n")
    : "Памяти пока нет.";

  return `Ты — агент политики в симуляции фэнтезийного мира "${ctx.worldName}".
Текущий тик: ${ctx.currentTick}

## Государства
${statesSummary}

## Дипломатические отношения
${diploSummary}

## Недавние события
${recentSummary}

## Твоя память
${memorySummary}

## Задача
Проанализируй текущую политическую ситуацию и сгенерируй 0–3 действия. Возможные типы:

1. **modify_entity** — изменить числовой параметр государства (stability, economy, military, population).
   Формат: { "type": "modify_entity", "entityType": "state", "entityId": "<uuid>", "changes": { "stability": <новое значение 0-100> } }

2. **create_event** — создать политическое событие.
   Формат: { "type": "create_event", "eventType": "political", "title": "<заголовок>", "description": "<описание>", "severity": "minor|moderate|major|catastrophic", "relatedEntityIds": ["<uuid>"] }

3. **diplomacy_action** — изменить дипломатические отношения между двумя государствами.
   Формат: { "type": "diplomacy_action", "stateAId": "<uuid>", "stateBId": "<uuid>", "newRelation": "alliance|friendly|neutral|rival|war", "reason": "<причина>" }

## Правила
- Все title и description пиши **на русском языке**
- Генерируй от 0 до 3 действий за тик
- Учитывай логику: нестабильное государство может испытать переворот, сильные соседи давят на слабых, война разрушает экономику
- Не генерируй катастрофы без причины — severity="catastrophic" только при длительных конфликтах
- Если ничего значимого не происходит — верни пустой массив actions

## Формат ответа
Отвечай СТРОГО в формате JSON:
{
  "actions": [...],
  "memory": "Краткое резюме текущей ситуации для запоминания (необязательно)"
}

Отвечай ТОЛЬКО JSON, без пояснений и markdown.`;
}
