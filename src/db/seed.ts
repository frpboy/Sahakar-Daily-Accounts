import postgres from "postgres";
import { randomSalesData } from "./seed-utils";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

/**
 * LOGISTICS & DATA CONSTANTS
 */
const LOCATIONS = [
  { name: "MANJERI", location: "Manjeri" },
  { name: "ALANALLUR", location: "Alanallur" },
  { name: "KARINKALLATHANI", location: "Karinkallathani" },
  { name: "MELATTUR", location: "Melattur" },
  { name: "TIRUR", location: "Tirur" },
  { name: "MAKKARAPARAMBU", location: "Makkaraparambu" },
  { name: "TIRURANAGADI", location: "Tiruranagadi" },
];

const BUSINESSES = [
  { 
    name: "SAHAKAR HYPER PHARMACY", 
    type: "Hyper Pharmacy" as const,
    codePrefix: "SHP"
  },
  { 
    name: "SAHAKAR SMART CLINIC", 
    type: "Smart Clinic" as const,
    codePrefix: "SSC"
  },
];

const ADMIN = {
  id: "admin-rahul",
  email: "frpboy12@gmail.com",
  name: "Rahul",
  role: "admin",
};

const ACCOUNT_CATEGORIES = [
  { name: "Asset" },
  { name: "Liability" },
  { name: "Equity" },
  { name: "Revenue" },
  { name: "Expense" },
];

const ACCOUNT_GROUPS = [
  { name: "Current Assets", category: "Asset" },
  { name: "Fixed Assets", category: "Asset" },
  { name: "Current Liabilities", category: "Liability" },
  { name: "Operating Revenue", category: "Revenue" },
  { name: "Operating Expenses", category: "Expense" },
];

const CHART_OF_ACCOUNTS = [
  { code: "1001", name: "Cash on Hand", group: "Current Assets", description: "All physical cash kept in outlets" },
  { code: "1002", name: "UPI Collections", group: "Current Assets", description: "Pending settlements from UPI providers" },
  { code: "1101", name: "Buildings", group: "Fixed Assets", description: "Owned outlet buildings" },
  { code: "2001", name: "Accounts Payable", group: "Current Liabilities", description: "Owed to suppliers" },
  { code: "4001", name: "Sales Revenue", group: "Operating Revenue", description: "Daily sales collections" },
  { code: "5001", name: "Salaries", group: "Operating Expenses", description: "Staff payroll" },
  { code: "5002", name: "Electricity", group: "Operating Expenses", description: "Utility bills" },
];

async function main() {
  console.log("🌱 Starting Sahakar ERP Seeding (Phase 3 Schema Compatibility)...\n");

  try {
    // 1. Clear existing data to avoid constraint violations
    console.log("🗑️  Performing CASCADE TRUNCATE...");
    await sql`TRUNCATE TABLE daily_accounts, outlets, users, account_categories, account_groups, chart_of_accounts CASCADE`;
    console.log("  ✅ Tables cleared.\n");

    // 2. Create Outlets (14 total: 7 locations × 2 types)
    console.log("📍 Provisioning 14 outlets with branch codes...");
    const outletIds: Record<string, string> = {};
    let pharmacyCounter = 1;
    let clinicCounter = 1;

    for (const location of LOCATIONS) {
      for (const business of BUSINESSES) {
        const isPharmacy = business.codePrefix === "SHP";
        // Use location name as primary name, append suffix for clinics to maintain uniqueness
        const outletName = isPharmacy ? location.name.toUpperCase() : `${location.name.toUpperCase()} (SC)`;
        
        const counter = isPharmacy ? pharmacyCounter++ : clinicCounter++;
        const branchCode = `${business.codePrefix}-${String(counter).padStart(3, "0")}`;

        const [result] = await sql`
          INSERT INTO outlets (name, location, type, code, is_active) 
          VALUES (${outletName}, ${location.location}, ${business.type}, ${branchCode}, true)
          RETURNING id
        `;

        if (result && result.id) {
          outletIds[outletName] = result.id;
          console.log(`  ✅ ${branchCode.padEnd(8)} | ${outletName.padEnd(25)} | ${business.type}`);
        }
      }
    }

    // 3. Create Admin User
    console.log(`\n👤 Creating primary administrator...`);
    await sql`
      INSERT INTO users (id, name, email, role, is_active)
      VALUES (${ADMIN.id}, ${ADMIN.name}, ${ADMIN.email}, ${ADMIN.role}, 'true')
    `;
    console.log(`  ✅ User: ${ADMIN.name} (${ADMIN.email} | ${ADMIN.role})`);

    // 4. Seeding Accounting Infrastructure
    console.log(`\n📂 Setting up accounting categories...`);
    const categoryIds: Record<string, string> = {};
    for (const category of ACCOUNT_CATEGORIES) {
      const [result] = await sql`
        INSERT INTO account_categories (name) VALUES (${category.name}) RETURNING id
      `;
      categoryIds[category.name] = result.id;
      console.log(`  ✅ Category: ${category.name}`);
    }

    console.log(`📁 Setting up account groups...`);
    const groupIds: Record<string, string> = {};
    for (const group of ACCOUNT_GROUPS) {
      const [result] = await sql`
        INSERT INTO account_groups (name, category_id) 
        VALUES (${group.name}, ${categoryIds[group.category]}) 
        RETURNING id
      `;
      groupIds[group.name] = result.id;
      console.log(`  ✅ Group: ${group.name.padEnd(18)} (linked to ${group.category})`);
    }

    console.log(`📄 Populating Chart of Accounts...`);
    for (const item of CHART_OF_ACCOUNTS) {
      await sql`
        INSERT INTO chart_of_accounts (code, name, group_id, description, is_active)
        VALUES (${item.code}, ${item.name}, ${groupIds[item.group]}, ${item.description}, 'true')
      `;
      console.log(`  ✅ Account: [${item.code}] ${item.name}`);
    }

    // 5. Generate 30 days of Entry Data for each outlet
    console.log(`\n📊 Generating 420 daily entries (14 outlets × 30 days)...`);
    let entryCount = 0;

    for (const [outletName, outletId] of Object.entries(outletIds)) {
      const isClinic = outletName.includes("SMART CLINIC");
      const salesHistory = randomSalesData(30, isClinic);

      for (const entry of salesHistory) {
        await sql`
          INSERT INTO daily_accounts (
            outlet_id, date, sale_cash, sale_upi, sale_credit, 
            expenses, purchase, closing_stock, created_by
          ) VALUES (
            ${outletId}, ${entry.date}, ${entry.cash}, ${entry.upi}, ${entry.credit},
            ${entry.expenses}, ${entry.purchase}, ${entry.closingStock}, ${ADMIN.id}
          )
        `;
        entryCount++;
      }
      console.log(`  ✅ Data populated for: ${outletName}`);
    }

    console.log(`\n✨ Seeding successful!`);
    console.log(`   - Total Outlets: ${Object.keys(outletIds).length}`);
    console.log(`   - Total Entries: ${entryCount}`);
    console.log(`   - Primary Admin: ${ADMIN.email}`);
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Seeding failed dramatically:", error);
    process.exit(1);
  }
}

main();
