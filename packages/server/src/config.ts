import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",

  database: {
    url:
      process.env.DATABASE_URL ||
      "postgres://letopisets:letopisets@localhost:5432/letopisets",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },
} as const;
