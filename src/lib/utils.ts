import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const IST_TIME_ZONE = "Asia/Kolkata";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error(`Unable to format date for timezone ${timeZone}`);
  }

  return { year, month, day };
}

export function formatDateInput(date: Date | string, timeZone: string = IST_TIME_ZONE): string {
  const dateObj =
    typeof date === "string" ? parseDateInput(date) : date;
  const { year, month, day } = getDatePartsInTimeZone(dateObj, timeZone);
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date input: ${value}`);
  }

  // Noon UTC prevents accidental day shifts when the same value is later
  // formatted in the IST business timezone.
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function getISTDate(): Date {
  return parseDateInput(formatDateInput(new Date(), IST_TIME_ZONE));
}

export function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dateObj);
}

export function calculateTotalSales(
  cash: number,
  upi: number,
  credit: number
): number {
  return cash + upi + credit;
}

export function calculateProfit(
  totalSales: number,
  expenses: number,
  purchase: number
): number {
  return totalSales - expenses - purchase;
}
