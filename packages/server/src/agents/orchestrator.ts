import { z } from "zod";
import { getAnthropicClient } from "../services/anthropic.js";
import { buildOrchestratorPrompt } from "./prompts/orchestrator.prompt.js";
import type { WorldContext } from "./types.js";

const orchestratorResponseSchema = z.array(z.string());

export async function runOrchestrator(
  ctx: WorldContext,
): Promise<{ agents: string[]; tokensUsed: number }> {
  const client = getAnthropicClient();
  const prompt = buildOrchestratorPrompt(ctx);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const tokensUsed =
    (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

  let agents: string[];
  try {
    agents = orchestratorResponseSchema.parse(JSON.parse(text));
  } catch {
    // Default to politics on parse error
    agents = ["politics"];
  }

  // Filter to only known agents
  const knownAgents = new Set(["politics"]);
  agents = agents.filter((a) => knownAgents.has(a));

  if (agents.length === 0) {
    agents = ["politics"];
  }

  return { agents, tokensUsed };
}
