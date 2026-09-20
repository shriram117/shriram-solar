import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: databaseUrl,
    max: 10,
    ssl: databaseUrl.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}