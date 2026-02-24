import { agentResponseSchema } from "@letopisets/shared/schemas/simulation";
import { getAnthropicClient } from "../services/anthropic.js";
import { buildPoliticsPrompt } from "./prompts/politics.prompt.js";
import type { WorldContext, AgentResult } from "./types.js";

const MAX_RETRIES = 1;

export async function runPoliticsAgent(
  ctx: WorldContext,
): Promise<AgentResult> {
  const client = getAnthropicClient();
  const prompt = buildPoliticsPrompt(ctx);

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const tokensUsed =
      (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

    try {
      // Try to extract JSON from the response (may have markdown wrapper)
      const jsonStr = extractJson(text);
      const parsed = agentResponseSchema.parse(JSON.parse(jsonStr));

      return {
        agentType: "politics",
        actions: parsed.actions,
        memory: parsed.memory,
        tokensUsed,
      };
    } catch (err) {
      lastError = err;
      // Will retry once, then skip
    }
  }

  // All retries failed — return empty result
  console.warn(
    `Politics agent failed after ${MAX_RETRIES + 1} attempts:`,
    lastError,
  );
  return {
    agentType: "politics",
    actions: [],
    memory: undefined,
    tokensUsed: 0,
  };
}

function extractJson(text: string): string {
  // Try to extract JSON from possible markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1]!.trim();
  }
  return text.trim();
}
