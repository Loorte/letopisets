import fp from "fastify-plugin";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../config.js";
import * as schema from "../db/schema.js";

declare module "fastify" {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
  }
}

export const dbPlugin = fp(async (app) => {
  const client = postgres(config.database.url);
  const db = drizzle(client, { schema });

  app.decorate("db", db);

  app.addHook("onClose", async () => {
    await client.end();
  });
});
