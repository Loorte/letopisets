import { getAnthropicClient } from "./anthropic.js";

export interface TranslationItem {
  id: string;
  name: string;
  deity?: string | null;
}

export interface TranslationResult {
  id: string;
  nameRu: string;
  deityRu?: string;
}

type EntityType = "state" | "burg" | "culture" | "religion";

const BATCH_SIZE = 100;

const ENTITY_PROMPTS: Record<EntityType, string> = {
  state:
    "Переведи или транслитерируй на русский язык названия фэнтезийных государств. Для узнаваемых слов — переводи (напр. Kingdom → Королевство), для уникальных имён собственных — транслитерируй кириллицей, сохраняя фэнтезийное звучание.",
  burg:
    "Переведи или транслитерируй на русский язык названия фэнтезийных городов. Для узнаваемых корней — переводи (напр. Riverside → Речной), для уникальных имён — транслитерируй кириллицей, сохраняя фэнтезийное звучание.",
  culture:
    "Переведи или транслитерируй на русский язык названия фэнтезийных культур/народов. Для узнаваемых слов — переводи, для уникальных — транслитерируй кириллицей.",
  religion:
    "Переведи или транслитерируй на русский язык названия фэнтезийных религий и имена божеств. Для узнаваемых слов — переводи, для уникальных — транслитерируй кириллицей, сохраняя фэнтезийное звучание.",
};

export async function translateBatch(
  items: TranslationItem[],
  entityType: EntityType,
  onBatchComplete?: (translated: number, total: number) => void,
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];
  const total = items.length;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await translateSingleBatch(batch, entityType);
    results.push(...batchResults);
    onBatchComplete?.(Math.min(i + BATCH_SIZE, total), total);
  }

  return results;
}

async function translateSingleBatch(
  items: TranslationItem[],
  entityType: EntityType,
): Promise<TranslationResult[]> {
  const client = getAnthropicClient();

  const includeDeity = entityType === "religion";
  const inputList = items.map((item) => {
    const entry: Record<string, string> = { id: item.id, name: item.name };
    if (includeDeity && item.deity) {
      entry.deity = item.deity;
    }
    return entry;
  });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${ENTITY_PROMPTS[entityType]}

Входные данные (JSON):
${JSON.stringify(inputList)}

Ответь ТОЛЬКО валидным JSON-массивом объектов с полями:
- "id" — оригинальный id
- "nameRu" — перевод/транслитерация названия
${includeDeity ? '- "deityRu" — перевод/транслитерация имени божества (если есть deity)\n' : ""}
Без пояснений, только JSON.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse translation response as JSON array");
  }

  return JSON.parse(jsonMatch[0]) as TranslationResult[];
}
