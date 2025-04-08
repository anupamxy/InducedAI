import { defineConfig } from "drizzle-kit";
import POSTGRESQL_DB
import { POSTGRESQL_DB } from '.env';

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: POSTGRESQL_DB,
  },
});
