import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Maintenance",
  "Transportation",
  "Marketing",
  "Office Supplies",
  "Miscellaneous",
] as const;

export const expenseBreakdownItemSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().min(0, "Expense amount cannot be negative"),
});

export const dailyEntrySchema = z.object({
  entryId: z.string().uuid().optional(),
  date: z.coerce.date(),
  outletId: z.string().uuid("Invalid outlet selected"),

  totalSalesAmount: z.coerce
    .number()
    .min(0, "Total sales amount cannot be negative")
    .default(0),

  saleCash: z.coerce
    .number()
    .min(0, "Cash amount cannot be negative")
    .default(0),
  saleUpi: z.coerce.number().min(0, "UPI amount cannot be negative").default(0),
  saleCredit: z.coerce
    .number()
    .min(0, "Credit amount cannot be negative")
    .default(0),
  saleReturn: z.coerce
    .number()
    .min(0, "Sales return amount cannot be negative")
    .default(0),

  expenseBreakdown: z
    .array(expenseBreakdownItemSchema)
    .default([])
    .refine(
      (items) => new Set(items.map((item) => item.category)).size === items.length,
      "Duplicate expense categories are not allowed"
    ),

  expenses: z.coerce.number().min(0, "Expenses cannot be negative").default(0),
  purchase: z.coerce
    .number()
    .min(0, "Purchase amount cannot be negative")
    .default(0),
  closingStock: z.coerce
    .number()
    .min(0, "Closing stock cannot be negative")
    .default(0),
});

export type DailyEntryInput = z.infer<typeof dailyEntrySchema>;

export const reportsFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  outletId: z.string().uuid().optional(),
});

export type ReportsFilter = z.infer<typeof reportsFilterSchema>;
