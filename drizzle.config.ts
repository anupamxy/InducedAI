import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: 'postgresql://anupam_owner:npg_QIupmAj8R6tX@ep-twilight-boat-a5xlp3cw-pooler.us-east-2.aws.neon.tech/anupam?sslmode=require',
  },
});
