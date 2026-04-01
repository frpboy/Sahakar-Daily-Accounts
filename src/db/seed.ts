import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const INITIAL_OUTLETS = [
  { name: "MELATTUR", location: "Melattur" },
  { name: "MAKKARAPPARAMBU", location: "Makkarapparambu" },
  { name: "TIRUR", location: "Tirur" },
  { name: "KARINKALLATHANI", location: "Karinkallathani" },
  { name: "MANJERI", location: "Manjeri" },
];

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // Seed Outlets
    for (const outlet of INITIAL_OUTLETS) {
      await db
        .insert(schema.outlets)
        .values(outlet)
        .onConflictDoNothing({ target: schema.outlets.name });
      console.log(`✅ Outlet ensured: ${outlet.name}`);
    }

    console.log("✨ Seeding completed successfully.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
