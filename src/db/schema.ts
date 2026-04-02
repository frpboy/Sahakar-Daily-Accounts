import {
  pgTable,
  text,
  timestamp,
  date,
  numeric,
  uuid,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// User Roles
export type UserRole =
  | "admin"
  | "ho_accountant"
  | "outlet_manager"
  | "outlet_accountant";

// Outlets Table
export const outlets = pgTable("outlets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  location: text("location"),
  code: text("code").unique(),
  type: text("type").default("Pharmacy"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").$type<UserRole>().default("outlet_manager"),
  outletId: uuid("outlet_id").references(() => outlets.id),
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Accounts Table
export const dailyAccounts = pgTable("daily_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id")
    .notNull()
    .references(() => outlets.id, { onDelete: "cascade" }),
  date: date("date").notNull(),

  saleCash: numeric("sale_cash", { precision: 12, scale: 2 }).default("0"),
  saleUpi: numeric("sale_upi", { precision: 12, scale: 2 }).default("0"),
  saleCredit: numeric("sale_credit", { precision: 12, scale: 2 }).default("0"),

  expenses: numeric("expenses", { precision: 12, scale: 2 }).default("0"),
  purchase: numeric("purchase", { precision: 12, scale: 2 }).default("0"),
  closingStock: numeric("closing_stock", { precision: 12, scale: 2 }).default(
    "0"
  ),
  saleReturn: numeric("sale_return", { precision: 12, scale: 2 }).default("0"),

  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts Module Tables
export const accountCategories = pgTable("account_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
});

export const accountGroups = pgTable("account_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => accountCategories.id),
  parentGroupId: uuid("parent_group_id"),
});

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => accountGroups.id),
  description: text("description"),
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"),
  userName: text("user_name"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Registration Requests Table
export const registrationRequests = pgTable("registration_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  status: text("status").default("pending"), // pending | approved | rejected
  reviewedBy: text("reviewed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const outletsRelations = relations(outlets, ({ many }) => ({
  dailyAccounts: many(dailyAccounts),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  outlet: one(outlets, {
    fields: [users.outletId],
    references: [outlets.id],
  }),
}));

export const dailyAccountsRelations = relations(dailyAccounts, ({ one }) => ({
  outlet: one(outlets, {
    fields: [dailyAccounts.outletId],
    references: [outlets.id],
  }),
}));

export const accountCategoriesRelations = relations(
  accountCategories,
  ({ many }) => ({
    groups: many(accountGroups),
  })
);

export const accountGroupsRelations = relations(
  accountGroups,
  ({ one, many }) => ({
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
  })
);

export const chartOfAccountsRelations = relations(
  chartOfAccounts,
  ({ one }) => ({
    group: one(accountGroups, {
      fields: [chartOfAccounts.groupId],
      references: [accountGroups.id],
    }),
  })
);
