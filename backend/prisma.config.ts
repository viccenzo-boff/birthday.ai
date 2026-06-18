/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Tenta usar a DIRECT_URL primeiro (ideal para Supabase). Se não achar, usa a DATABASE_URL.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});