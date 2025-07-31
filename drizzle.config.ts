import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: (process.env.TURSO_DATABASE_URL as string) || "file:dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
