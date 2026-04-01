import { z } from "zod";

export const dailyEntrySchema = z.object({
  date: z.coerce
    .date()
    .max(new Date(), { message: "Cannot enter data for future dates" }),
  outletId: z.string().uuid("Invalid outlet selected"),

  // Sales (Coerce converts string inputs from the form to numbers)
  saleCash: z.coerce
    .number()
    .min(0, "Cash amount cannot be negative")
    .default(0),
  saleUpi: z.coerce
    .number()
    .min(0, "UPI amount cannot be negative")
    .default(0),
  saleCredit: z.coerce
    .number()
    .min(0, "Credit amount cannot be negative")
    .default(0),

  // Operations
  expenses: z.coerce
    .number()
    .min(0, "Expenses cannot be negative")
    .default(0),
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

// Filter schema for the reports page
export const reportsFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  outletId: z.string().uuid().optional(),
});

export type ReportsFilter = z.infer<typeof reportsFilterSchema>;
