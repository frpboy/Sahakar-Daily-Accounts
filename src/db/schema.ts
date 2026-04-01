import { pgTable, text, timestamp, date, numeric, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Outlets Table
export const outlets = pgTable("outlets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users Table (Extension of Neon Auth Users)
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Matches Neon Auth User ID
  email: text("email").notNull().unique(),
  role: text("role").$type<"admin" | "manager">().default("manager"),
  outletId: uuid("outlet_id").references(() => outlets.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Accounts Table
export const dailyAccounts = pgTable(
  "daily_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outletId: uuid("outlet_id").notNull().references(() => outlets.id, { onDelete: "cascade" }),
    date: date("date").notNull(),

    // Sales Fields (NUMERIC for precise decimal handling)
    saleCash: numeric("sale_cash", { precision: 12, scale: 2 }).default("0"),
    saleUpi: numeric("sale_upi", { precision: 12, scale: 2 }).default("0"),
    saleCredit: numeric("sale_credit", { precision: 12, scale: 2 }).default("0"),

    // Operational Fields
    expenses: numeric("expenses", { precision: 12, scale: 2 }).default("0"),
    purchase: numeric("purchase", { precision: 12, scale: 2 }).default("0"),
    closingStock: numeric("closing_stock", { precision: 12, scale: 2 }).default("0"),

    // Metadata
    createdBy: text("created_by").notNull(), // Neon Auth User ID
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // UNIQUE constraint to prevent duplicate entries for same outlet and date
    uniqueDateOutlet: [table.date, table.outletId],
  })
);

// Accounts Module Tables
export const accountCategories = pgTable("account_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // Asset, Liability, Equity, Revenue, Expense
});

export const accountGroups = pgTable("account_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  categoryId: uuid("category_id").notNull().references(() => accountCategories.id),
  parentGroupId: uuid("parent_group_id"), // Self-referencing for hierarchy
});

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(), // e.g., "1001", "2005"
  name: text("name").notNull(),
  groupId: uuid("group_id").notNull().references(() => accountGroups.id),
  description: text("description"),
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const outletsRelations = relations(outlets, ({ many }) => ({
  dailyAccounts: many(dailyAccounts),
}));

export const dailyAccountsRelations = relations(dailyAccounts, ({ one }) => ({
  outlet: one(outlets, {
    fields: [dailyAccounts.outletId],
    references: [outlets.id],
  }),
}));

export const accountCategoriesRelations = relations(accountCategories, ({ many }) => ({
  groups: many(accountGroups),
}));

export const accountGroupsRelations = relations(accountGroups, ({ one, many }) => ({
  category: one(accountCategories, {
    fields: [accountGroups.categoryId],
    references: [accountCategories.id],
  }),
  parentGroup: one(accountGroups, {
    fields: [accountGroups.parentGroupId],
    references: [accountGroups.id],
    relationName: "group_hierarchy",
  }),
  childGroups: many(accountGroups, {
    relationName: "group_hierarchy",
  }),
  accounts: many(chartOfAccounts),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one }) => ({
  group: one(accountGroups, {
    fields: [chartOfAccounts.groupId],
    references: [accountGroups.id],
  }),
}));

