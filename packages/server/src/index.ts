import { buildApp } from "./app.js";
import { config } from "./config.js";

async function main() {
  const app = await buildApp();

  if (!config.anthropic.apiKey) {
    app.log.warn("ANTHROPIC_API_KEY is not set. AI features (translation, simulation) will be unavailable.");
  }

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
