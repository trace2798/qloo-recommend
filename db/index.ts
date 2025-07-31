import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: (process.env.TURSO_DATABASE_URL as string) || "file:dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  schema: schema,
});
