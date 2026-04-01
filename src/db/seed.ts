import { neon } from "@neondatabase/serverless";
import { randomSalesData } from "./seed-utils";

const sql = neon(process.env.DATABASE_URL!);

const LOCATIONS = [
  { name: "MANJERI", location: "Manjeri" },
  { name: "ALANALLUR", location: "Alanallur" },
  { name: "KARINKALLATHANI", location: "Karinkallathani" },
  { name: "MELATTUR", location: "Melattur" },
  { name: "TIRUR", location: "Tirur" },
  { name: "MAKKARAPARAMBU", location: "Makkarapparambu" },
  { name: "TIRURANAGADI", location: "Tiruranagadi" },
];

const BUSINESSES = [
  { prefix: "SAHAKAR HYPER PHARMACY", suffix: "Pharmacy" },
  { prefix: "SAHAKAR SMART CLINIC", suffix: "Clinic" },
];

const ADMIN = {
  id: "admin-rahul",
  email: "frpboy12@gmail.com",
  name: "Rahul",
  role: "admin" as const,
};

async function main() {
  console.log("🌱 Starting database seed...\n");

  try {
    console.log("🗑️  Clearing existing daily entries...");
    await sql`TRUNCATE TABLE daily_accounts CASCADE`;
    console.log("  ✅ Cleared\n");
    console.log("📍 Creating outlets...");
    const outletIds: Record<string, string> = {};

    for (const location of LOCATIONS) {
      for (const business of BUSINESSES) {
        const outletName = `${business.prefix} - ${location.name}`;

        const [result] = await sql`
          INSERT INTO outlets (name, location) 
          VALUES (${outletName}, ${location.location})
          ON CONFLICT (name) DO UPDATE SET location = ${location.location}
          RETURNING id
        `;

        if (result && result.id) {
          outletIds[outletName] = result.id;
          console.log(`  ✅ ${outletName}`);
        }
      }
    }

    console.log(`\n👤 Creating admin user...`);
    await sql`
      INSERT INTO users (id, email, role, outlet_id)
      VALUES (${ADMIN.id}, ${ADMIN.email}, ${ADMIN.role}, NULL)
      ON CONFLICT (email) DO UPDATE SET role = ${ADMIN.role}
    `;
    console.log(`  ✅ Admin: ${ADMIN.name} (${ADMIN.email})`);

    console.log(`\n📊 Generating daily entries for last 30 days...`);
    let entryCount = 0;

    for (const [outletName, outletId] of Object.entries(outletIds)) {
      const isClinic = outletName.includes("CLINIC");
      const data = randomSalesData(30, isClinic);

      for (const day of data) {
        await sql`
          INSERT INTO daily_accounts (
            outlet_id, date, sale_cash, sale_upi, sale_credit, 
            expenses, purchase, closing_stock, created_by
          ) VALUES (
            ${outletId}, ${day.date}, ${day.cash}, ${day.upi}, ${day.credit},
            ${day.expenses}, ${day.purchase}, ${day.closingStock}, ${ADMIN.id}
          )
        `;
        entryCount++;
      }
      console.log(`  ✅ ${outletName}: 30 days seeded`);
    }

    console.log(`\n✨ Seeding completed!`);
    console.log(`   - Outlets: ${Object.keys(outletIds).length}`);
    console.log(`   - Daily Entries: ${entryCount}`);
    console.log(`   - Admin: ${ADMIN.email}`);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
