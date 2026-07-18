import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"], 
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});