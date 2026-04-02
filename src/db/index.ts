import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use Transaction Pooler URL (DATABASE_URL) for serverless runtime.
// `prepare: false` is required when using PgBouncer in transaction mode.
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
